/**
 * @author ps / @___paul
 */

'use strict';
var helpers = require("./helpers")
var templates = require('./templates')

var timelineElem = helpers.getElems("lb-posts")
  , loadMorePostsButton = helpers.getElems("load-more-posts");

function renderTimeline(posts) {
  var renderedPosts = [];

  posts._items.forEach(function(post) {
    renderedPosts.push(templates.post({
      item: post
    }))
  });

  document.querySelectorAll('.lb-post').forEach(function(el) {
    el.remove();
  });

  renderedPosts.forEach(function(renderedPost) {
    timelineElem[0].innerHTML += renderedPost;
  });
}

function toggleSortBtn(name) {
  document
    .querySelectorAll('.sorting-bar__order')
    .forEach(function(btn) {
      btn.classList.remove('sorting-bar__order--active');

      if (btn.id === name) {
        btn.classList.add('sorting-bar__order--active');
      }
    });
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
    postsHTML += posts[i]
  };

  timelineElem[0].insertAdjacentHTML(position, postsHTML);
  loadEmbeds();
};

/**
 * Trigger embed provider unpacking
 * Todo: Make required scripts available on subsequent loads
 */
function loadEmbeds() {
  if (window.instgrm) instgrm.Embeds.process()
  if (window.twttr) twttr.widgets.load()
};

/**
 * Toggle display of load-more-posts button.
 * @param {bool} shouldToggle - true => display
 */
function toggleLoadMore(shouldToggle) {
  loadMorePostsButton[0].classList.toggle(
    "mod--hide", shouldToggle)
  return;
};

/**
 * Show new posts loaded via XHR
 */
function displayNewPosts() {
  var newPosts = helpers.getElems("lb-post-new")
  for (var i = newPosts.length - 1; i >= 0; i--) {
    newPosts[i].classList.remove("lb-post-new")
  }
};

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function deletePost(postId) {
  var elem = helpers.getElems('data-js-post-id=\"' + postId + '\"');
  elem[0].remove();
};

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function updatePost(postId, renderedPost) {
  var elem = helpers.getElems('data-js-post-id=\"' + postId + '\"');
  elem[0].innerHTML = renderedPost;
  loadEmbeds();
};

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
  return null
};

module.exports = {
  addPosts: addPosts,
  deletePost: deletePost,
  displayNewPosts: displayNewPosts,
  renderTimeline: renderTimeline,
  updatePost: updatePost,
  updateTimestamps: updateTimestamps,
  toggleLoadMore: toggleLoadMore,
  toggleSortBtn: toggleSortBtn
}
