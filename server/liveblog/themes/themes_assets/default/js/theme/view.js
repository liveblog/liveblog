/**
 * @author ps / @___paul
 */

'use strict';

const helpers = require('./helpers');
const adsManager = require('./ads-manager');
const Slideshow = require('./slideshow');
const Permalink = require('./permalink');
const gdprConsent = require('./gdpr');
const nunjucks = require('nunjucks/browser/nunjucks-slim');
const filters = require('../../misc/filters');
const polls = require('./polls');
import * as messages from './common/messages';

const nunjucksEnv = new nunjucks.Environment();
nunjucksEnv.addFilter('date', helpers.convertTimestamp);
nunjucksEnv.addFilter('decode_uri', filters.decodeUri);
nunjucksEnv.addFilter('fix_x_domain_embed', filters.fixXDomainEmbed);
nunjucksEnv.addFilter('tojson', filters.tojson);
nunjucks.env = nunjucksEnv;

const permalink = new Permalink();
const els = {
  timelineSticky: document.querySelector("[data-timeline-sticky]"),
  timelineNormal: document.querySelector("[data-timeline-normal]"),
  emptyMessage: document.querySelector("[data-empty-message]"),
  loadMore: document.querySelector("[data-load-more]")
};


/**
 * Replace the current timeline unconditionally.
 * @typedef {Object} api_response – contains request opts.
 * @property {Object} requestOpts - API request params.
 */
function renderTimeline(api_response) {
  var renderedPosts = [];
  // for translation macro purposes
  var optionsObj = {i18n: window.LB.i18n};

  api_response._items.forEach((post) => {
    renderedPosts.push(
      nunjucks.env.render('template-post.html', {
        post: post,
        options: optionsObj,
        settings: window.LB.settings,
        assets_root: window.LB.assets_root
      })
    );

  });

  els.emptyMessage.classList.toggle('mod--displaynone', Boolean(renderedPosts.length));
  els.timelineNormal.innerHTML = renderedPosts.length ? renderedPosts.join('') : '';

  if (api_response.pendingPosts) {
    checkPending(api_response.pendingPosts);
  }
  updateTimestamps();
  loadEmbeds();
  attachSlideshow();
  attachPermalink();
  attachShareBox();
  polls.checkExistingVotes();
}

/**
 * Render the post content into the proper html template
 * @param {Object} post
 * @param {boolean} displayNone
 */
function renderSinglePost(post, displayNone) {
  return nunjucks.env.render(
    'template-post.html', {
      post: post,
      settings: window.LB.settings,
      options: {i18n: window.LB.i18n},
      assets_root: window.LB.assets_root,
      displaynone: displayNone
    }
  );
}

/**
 * Render posts currently in pipeline to template.
 * To reduce DOM calls/paints we hand off rendered HTML in bulk.
 * @typedef {Object} api_response – contains request opts.
 * @property {Object} requestOpts - API request params.
 */
function renderPosts(api_response) {
  var renderedPosts = [] // temporary store
    , posts = api_response._items;

  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];

    if (!api_response.requestOpts.page && (post.deleted || post.post_status === 'submitted')) {
      deletePost(post._id);
      continue; // early
    }
    const elem = document.querySelector(`[data-post-id="${post._id}"]`);
    const isVideoPlaying = Object.values(window.playersState).some(x => x === true);
    const displaynone = api_response.requestOpts.fromDate &&
                        (!window.LB.settings.autoApplyUpdates || isVideoPlaying ) && !elem;

    const rendered = renderSinglePost(post, displaynone);

    if ( updatePost(post, rendered) ) {
      setTimeout(function() {
        loadEmbeds();
      }, 500);

      continue;
    }
    renderedPosts.push({ html: rendered, data: post }); // create operation
  }

  if (!renderedPosts.length) {
    return api_response;
  }

  els.emptyMessage.classList.toggle('mod--displaynone', Boolean(renderedPosts.length));
  addPosts(renderedPosts, api_response.requestOpts.fromDate ? 'afterbegin' : 'beforeend');

  setTimeout(function() {
    loadEmbeds();
  }, 500);

  return api_response;
}

/**
 * Add post nodes to DOM, do so regardless of settings.autoApplyUpdates,
 * but rather set them to NOT BE DISPLAYED if auto-apply is false.
 * This way we don't have to mess with two stacks of posts.
 * @param {collection} posts - an array of object html, data for posts.
 * @param {string} position - afterbegin or beforeend
 */
function addPosts(posts, position) {

  const timelineNormal = posts.reduce((html, post) => post.data.sticky ? '' : html.concat(post.html), '');
  const timelineSticky = posts.reduce((html, post) => post.data.sticky ? html.concat(post.html) : '', '');

  els.timelineNormal.insertAdjacentHTML(position, timelineNormal);
  els.timelineSticky.insertAdjacentHTML(position, timelineSticky);
  els.timelineSticky.classList.remove('sticky--empty');

  checkPending();
  attachSlideshow();
  attachPermalink();
  attachShareBox();
}

function checkPending(pendingPosts = 0) {
  let pending = document.querySelectorAll("[data-post-id].mod--displaynone"),
    singleSelector = document.querySelector('[data-one-new-update]').classList,
    multipleSelector = document.querySelector('[data-new-updates]').classList,
    countedSelector = document.querySelector('[data-counted-updates]').classList;

  const updateToggles = (single, multiple, counted) => {
    singleSelector.toggle('mod--displaynone', single);
    multipleSelector.toggle('mod--displaynone', multiple);
    countedSelector.toggle('mod--displaynone', counted);
  }

  let count = pending.length || pendingPosts;

  if (count === 1) {
    updateToggles(false, true, true);
  } else if (count > 1) {
    if (permalink) {
      updateToggles(true, true, false);
      document.getElementById('data-counted-updates-length-container').textContent = count;
    } else {
      updateToggles(true, false, true);
    }
  } else {
    updateToggles(true, true, true);
  }
}

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function deletePost(id) {
  var elem = document.querySelector(`[data-post-id="${id}"]`);
  if (elem) {
    elem.remove();
  }
}

/**
 * Update post <article> DOM node by data attribute.
 * @param {string} - a post URN
 * @param {string} - a post rendered HTML
 */
function updatePost(post, rendered) {
  const elem = document.querySelector(`[data-post-id="${post._id}"]`);
  if (!elem) {
    return false;
  }

  // has change the sticky status so we should delete it and add it again.
  if (post.sticky !== (elem.getAttribute('data-post-sticky').toLowerCase() === 'true') ) {
    deletePost(post._id);
    return false;
  }

  elem.outerHTML = rendered;
  reloadScripts(elem);
  attachSlideshow();
  attachPermalink();
  attachShareBox();

  // FB embeds has a weird glitch after update. So we need to force the re-render
  // in case the post contains any fb embed
  if (post.post_items_type === 'embed-facebook') {
    setTimeout(function() {
      // we query again as the DOM has been replaced
      var embedContainer = document.querySelector(`[data-post-id="${post._id}"] .embed`);
      FB.XFBML.parse(embedContainer);
    }, 500);
  }

  // If post updated is a poll, check existing votes to see if user has already voted
  // and apply UI changes accordingly
  if (post.post_items_type === 'poll') {
    polls.checkExistingVotes();
  }

  return true;
}

/**
 * Show new posts loaded via XHR
 */
function displayNewPosts() {
  var newPosts = helpers.getElems("lb-post-new");
  for (var i = newPosts.length - 1; i >= 0; i--) {
    newPosts[i].classList.remove("lb-post-new");
  }
}

function reloadScripts(elem) {
  const $scripts = elem.querySelectorAll('script');
  $scripts.forEach(($script) => {
    let s = document.createElement('script');
    s.type = 'text/javascript';
    if ($script.src) {
      s.src = $script.src;
    } else {
      s.textContent = $script.innerText;
    }
    // re-insert the script tag so it executes.
    document.head.appendChild(s);
    // clean-up
    document.head.removeChild(s);
  });
}
/**
 * Trigger embed provider unpacking
 */
function loadEmbeds() {
  if (window.instgrm)
    instgrm.Embeds.process();

  if (window.twttr)
    twttr.widgets.load();

  if (window.FB)
    window.FB.XFBML.parse();

  if (window.iframely)
    iframely.load();

  attachSlideshow();
}

function clearCommentDialog() {
  document.querySelector('#comment-name').value = '';
  document.querySelector('#comment-content').value = '';
}

function toggleCommentDialog() {
  let commentForm = document.querySelector('form.comment');
  let isHidden = false;

  document.querySelector('.header-bar__comment').classList.toggle('header-bar__comment--active');

  if (commentForm) {
    isHidden = commentForm.classList.toggle('hide');
  }

  return !isHidden;
}

/**
 * Set sorting order button of class @name to active.
 * @param {string} name - liveblog API response JSON.
 */
function toggleSortBtn(name) {
  var sortingBtns = document.querySelectorAll('.sorting-bar__order');

  sortingBtns.forEach((el) => {
    var shouldBeActive = el.dataset.hasOwnProperty("jsOrderby_" + name);

    el.classList.toggle('sorting-bar__order--active', shouldBeActive);
    if (shouldBeActive) {
      document.querySelector('.sorting-bar__dropdownBtn').innerHTML = el.innerHTML;
    }
  });
  toggleSortDropdown(false);
}

/**
 * Toggles sorting dropdown visibility
 * @param {Boolean} open
 */
function toggleSortDropdown(open) {
  var dropdown = document.querySelector('.sorting-bar__dropdownContent');

  if (!dropdown) return;

  if (open !== undefined) {
    dropdown.classList.toggle('sorting-bar__dropdownContent--active', open);
  } else {
    dropdown.classList.toggle('sorting-bar__dropdownContent--active');
  }

  window.playersState = {};
}

/**
 * Toggles tags filter dropdown visibility
 * @param {Boolean} open
 */
function toggleTagsFilterDropdown(open) {
  var tagsDropdown = document.querySelector('.tags-filter-bar__dropdownContent');
  var activeClass = 'tags-filter-bar__dropdownContent--active';

  if (tagsDropdown) {
    if (open !== undefined) {
      tagsDropdown.classList.toggle(activeClass, open);
    } else {
      tagsDropdown.classList.toggle(activeClass);
    }
  }

  window.playersState = {};
}

/**
 * Conditionally hide load-more button.
 * @param {bool} hide
 */
function hideLoadMore(hide) {
  if (els.loadMore) {
    els.loadMore.classList.toggle('mod--hide', hide);
  }
}

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function updateTimestamps() {
  var dateElems = helpers.getElems("relativeDate");
  for (var i = 0; i < dateElems.length; i++) {
    var elem = dateElems[i]
      , timestamp = elem.dataset.jsTimestamp;
    elem.classList.remove('mod--displaynone');
    elem.textContent = helpers.convertTimestamp(timestamp);
  }

  // Also update the times for the polls
  const elements = document.querySelectorAll('.lb-item.poll');
  elements.forEach((elem) => {
      reloadScripts(elem)
  });

  return null;
}

function showSuccessCommentMsg() {
  let commentSent = document.querySelector('div.comment-sent');

  commentSent.classList.toggle('hide');

  setTimeout(() => {
    commentSent.classList.toggle('hide');
  }, 5000);
}

function clearCommentFormErrors() {
  let errorsMsgs = document.querySelectorAll('p.err-msg');

  if (errorsMsgs) {
    errorsMsgs.forEach((errorsMsg) => errorsMsg.remove());
  }
}

function displayCommentFormErrors(errors) {
  if (Array.isArray(errors)) {
    errors.forEach((error) => {
      let element = document.querySelector(error.id);

      if (element) {
        element.insertAdjacentHTML(
          'afterend',
          `<p class="err-msg">${error.msg}</p>`
        );
      }
    });
  }
}

function attachSlideshow() {
  const slideshow = Slideshow.getInstance();
  slideshow.init();
}

function attachPermalink() {
  const permalinks = document.querySelectorAll('.lb-post-permalink a');

  permalinks.forEach((link) => {
    link.href = permalink.getUrl(link.id);
  });
}

function attachShareBox() {
  const shareLinks = document.querySelectorAll('.lb-post-shareBox__item');

  shareLinks.forEach((link) => {
    link.href = link.getAttribute('data-link-base') + permalink.getUrl(link.getAttribute('data-link-id'));
  });
}

function checkPermalink(posts) {
  var found = false;

  if (permalink._id) {
    posts._items.forEach((post) => {
      if (permalink._id === post._id) {
        found = true;
      }
    });
  }

  return found;
}

function permalinkScroll() {
  const scrollElem = document.querySelector(`[data-post-id="${permalink._id}"]`);

  if (scrollElem) {
    scrollElem.classList.add('lb-post-permalink-selected');
    scrollElem.scrollIntoView();
    window.onload = function() {
      scrollElem.scrollIntoView();
    };
    updateTimestamps();
    return true;
  }

  return false;
}

function scrollHeaderIntoView() {
  const elem = document.querySelector('.header-bar');

  if(elem) {
    const elemPosition = elem.getBoundingClientRect().top + window.scrollY;
    const offset = 20;
    window.scrollTo({
      top: elemPosition - offset,
      behavior: 'smooth'
    });
  }

  messages.send('scroll_header_into_view');
}

function attachDropdownCloseEvent() {
  document.addEventListener("click", function (evt) {
    const target = evt.target;
    const dropDownBtnClicked = target.className === 'sorting-bar__dropdownBtn' || target.className === 'tags-filter-bar__dropdownBtn',
      clickedOutside = (target.closest('div') === null ||
        !['tags-filter-bar', 'sorting-bar'].includes(target.closest('div').className.split('__')[0]))
    if (!dropDownBtnClicked && clickedOutside) {
      // close tags-filter dropdown
      toggleTagsFilterDropdown(false);
      toggleSortDropdown(false);
    }
  });
}

function initGdprConsentAndRefreshAds(api_response) {
  if (api_response && api_response._items.length > 0) {
    gdprConsent.init();
    adsManager.refreshAds();
  }
}

module.exports = {
  displayNewPosts: displayNewPosts,
  renderTimeline: renderTimeline,
  renderPosts: renderPosts,
  updateTimestamps: updateTimestamps,
  hideLoadMore: hideLoadMore,
  toggleSortBtn: toggleSortBtn,
  toggleSortDropdown: toggleSortDropdown,
  toggleCommentDialog: toggleCommentDialog,
  showSuccessCommentMsg: showSuccessCommentMsg,
  displayCommentFormErrors: displayCommentFormErrors,
  clearCommentFormErrors: clearCommentFormErrors,
  attachSlideshow: attachSlideshow,
  attachPermalink: attachPermalink,
  checkPermalink: checkPermalink,
  permalinkScroll: permalinkScroll,
  attachShareBox: attachShareBox,
  permalink: permalink,
  clearCommentDialog: clearCommentDialog,
  checkPending: checkPending,
  adsManager: adsManager,
  consent: gdprConsent,
  toggleTagsFilterDropdown: toggleTagsFilterDropdown,
  attachDropdownCloseEvent: attachDropdownCloseEvent,
  loadEmbeds: loadEmbeds,
  initGdprConsentAndRefreshAds: initGdprConsentAndRefreshAds,
  scrollHeaderIntoView: scrollHeaderIntoView,
  reloadScripts: reloadScripts,
  renderSinglePost: renderSinglePost,
  updatePost: updatePost,
};
