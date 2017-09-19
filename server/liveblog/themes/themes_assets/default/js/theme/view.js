/**
 * @author ps / @___paul
 */

'use strict';

var helpers = require('./helpers');
var templates = require('./templates');
var Slideshow = require('./slideshow');
var Permalink = require('./permalink');

var timelineElem = document.querySelectorAll(".lb-posts.normal")
  , loadMorePostsButton = helpers.getElems("load-more-posts")
  , emptyMessage = helpers.getElems("empty-message");

const permalink = new Permalink();

/**
 * Replace the current timeline unconditionally.
 * @typedef {Object} api_response – contains request opts.
 * @property {Object} requestOpts - API request params.
 */
function renderTimeline(api_response) {
  var renderedPosts = [];

  api_response._items.forEach((post) => {
    renderedPosts.push(templates.post({
      item: post,
      settings: window.LB.settings,
      assets_root: window.LB.assets_root
    }));

  });
  if (renderedPosts.length) {
    emptyMessage[0].classList.toggle("mod--displaynone", true);
    timelineElem[0].innerHTML = renderedPosts.join("");
  } else {
    emptyMessage[0].classList.toggle("mod--displaynone", false);
    timelineElem[0].innerHTML = '';
  }
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
      return; // early
    }

    var renderedPost = templates.post({
      item: post,
      settings: window.LB.settings,
      assets_root: window.LB.assets_root
    });

    if (!api_response.requestOpts.page && post.operation === "update") {
      updatePost(post._id, renderedPost);
      return; // early
    }

    renderedPosts.push(renderedPost); // create operation
  }

  if (!renderedPosts.length) {
    return; // early
  }
  
  renderedPosts.reverse();

  addPosts(renderedPosts, { // if creates
    position: api_response.requestOpts.fromDate ? "top" : "bottom"
  });

  loadEmbeds();
}

/**
 * Add post nodes to DOM, do so regardless of settings.autoApplyUpdates,
 * but rather set them to NOT BE DISPLAYED if auto-apply is false.
 * This way we don't have to mess with two stacks of posts.
 * @param {array} posts - an array of Liveblog post items
 * @param {object} opts - keyword args
 * @param {string} opts.position - top or bottom
 */
function addPosts(posts, opts) {
  opts = opts || {};
  opts.position = opts.position || "bottom";

  var postsHTML = ""
    , position = opts.position === "top"
        ? "afterbegin" // insertAdjacentHTML API => after start of node
        : "beforeend"; // insertAdjacentHTML API => before end of node

  for (var i = posts.length - 1; i >= 0; i--) {
    postsHTML += posts[i];
  }

  timelineElem[0].insertAdjacentHTML(position, postsHTML);
  attachSlideshow();
  attachPermalink();
  attachShareBox();
}

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function deletePost(postId) {
  var elem = helpers.getElems('[data-js-post-id=\"' + postId + '\"]');
  if (elem.length) {
    elem[0].remove();
  }
}

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function updatePost(postId, renderedPost) {
  var elem = helpers.getElems('[data-js-post-id=\"' + postId + '\"]');
  if (elem.length) {
    elem[0].outerHTML = renderedPost;
    attachSlideshow();
    attachPermalink();
    attachShareBox();
  }
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
 * Todo: Make required scripts available on subsequent loads
 */
function loadEmbeds() {
  if (window.instgrm) {
    instgrm.Embeds.process();
  }

  if (window.twttr) {
    twttr.widgets.load();
  }
}

function clearCommentDialog() {
  document.querySelector('#comment-name').value = '';
  document.querySelector('#comment-content').value = '';
}

function toggleCommentDialog() {
  let commentForm = document.querySelector('form.comment');
  let isHidden = false;

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
  });
}

/**
 * Conditionally hide load-more-posts button.
 * @param {bool} shouldToggle - true => hide
 */
function hideLoadMore(shouldHide) {
  if (loadMorePostsButton.length > 0) {
    loadMorePostsButton[0].classList.toggle(
      "mod--hide", shouldHide);
  }
}

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function updateTimestamps() {
  var dateElems = helpers.getElems("lb-post-date");
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
  const slideshowImages = document.querySelectorAll('article.slideshow img');

  if (slideshowImages) {
    slideshowImages.forEach((image) => {
      image.addEventListener('click', slideshow.start);
    });
  }
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
  var scrollElem;
  var found = false;
  
  scrollElem = helpers.getElems('[data-js-post-id=\"' + permalink._id + '\"]');

  if (scrollElem.length > 0) {
    scrollElem[0].classList.add('lb-post-permalink-selected');
    scrollElem[0].scrollIntoView();
    found = true;
  } 

  return found;
}

module.exports = {
  addPosts: addPosts,
  deletePost: deletePost,
  displayNewPosts: displayNewPosts,
  renderTimeline: renderTimeline,
  renderPosts: renderPosts,
  updatePost: updatePost,
  updateTimestamps: updateTimestamps,
  hideLoadMore: hideLoadMore,
  toggleSortBtn: toggleSortBtn,
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
  clearCommentDialog: clearCommentDialog
};
