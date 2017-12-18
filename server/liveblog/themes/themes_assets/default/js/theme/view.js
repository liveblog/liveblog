/**
 * @author ps / @___paul
 */

'use strict';

const helpers = require('./helpers');
const templates = require('./templates');
const Slideshow = require('./slideshow');
const Permalink = require('./permalink');

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
    renderedPosts.push(templates.post({
      item: post,
      options: optionsObj,
      settings: window.LB.settings,
      assets_root: window.LB.assets_root
    }));

  });

  els.emptyMessage.classList.toggle('mod--displaynone', Boolean(renderedPosts.length));
  els.timelineNormal.innerHTML = renderedPosts.length ? renderedPosts.join('') : '';

  updateTimestamps();
  loadEmbeds();
  attachSlideshow();
  attachPermalink();
  attachShareBox();
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

    if (!api_response.requestOpts.page && post.deleted) {
      deletePost(post._id);
      continue; // early
    }
    const elem = document.querySelector(`[data-post-id="${post._id}"]`);
    const displaynone = api_response.requestOpts.fromDate &&
                        !window.LB.settings.autoApplyUpdates &&
                        !elem;
    // for translation macro purposes                    
    var optionsObj = {i18n: window.LB.i18n};
  
    const rendered = templates.post({
      item: post,
      settings: window.LB.settings,
      options: optionsObj,
      assets_root: window.LB.assets_root,
      displaynone: displaynone
    });

    if ( updatePost(post, rendered) ) {
      continue;
    }
    renderedPosts.push({ html: rendered, data: post }); // create operation
  }

  if (!renderedPosts.length) {
    return; // early
  }

  addPosts(renderedPosts, api_response.requestOpts.fromDate ? 'afterbegin' : 'beforeend');

  loadEmbeds();
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

function checkPending() {
  let pending = document.querySelectorAll("[data-post-id].mod--displaynone"),
    one = document.querySelector('[data-one-new-update]').classList,
    updates = document.querySelector('[data-new-updates]').classList;
  if (pending.length === 1) {
    one.toggle('mod--displaynone', false);
    updates.toggle('mod--displaynone', true);
  } else if (pending.length > 1) {
    one.toggle('mod--displaynone', true);
    updates.toggle('mod--displaynone', false);
  } else {
    one.toggle('mod--displaynone', true);
    updates.toggle('mod--displaynone', true);
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
  attachSlideshow();
  attachPermalink();
  attachShareBox();
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

/**
 * Trigger embed provider unpacking
 */
function loadEmbeds() {
  if (window.instgrm) {
    instgrm.Embeds.process();
  }

  if (window.twttr) {
    twttr.widgets.load();
  }

  if (window.FB) {
    window.FB.XFBML.parse();
  }

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
  if (open !== undefined) {
    document.querySelector('.sorting-bar__dropdownContent')
      .classList.toggle('sorting-bar__dropdownContent--active', open);
  } else {
    document.querySelector('.sorting-bar__dropdownContent')
      .classList.toggle('sorting-bar__dropdownContent--active');
  }
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
    elem.textContent = helpers.convertTimestamp(timestamp);
  }
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
  const slideshow = new Slideshow();
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
    return true;
  }

  return false;
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
  checkPending: checkPending
};
