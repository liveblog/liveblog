/**
 * @author ps / @___paul
 */

'use strict';
var helpers = require("./helpers")
var timelineElem = helpers.getElems("lb-posts")[0]

var addPosts = function(posts) {
  /**
   * Add post nodes to DOM, do so regardless of settings.autoApplyUpdates,
   * but rather set them to NOT BE DISPLAYED if auto-apply is false.
   * This way we don't have to mess with two stacks of posts.
   * @param {array} posts - an array of Liveblog post items
   */
  
  var postsHTML = ""
    , position = "beforeend" // todo: insert new posts at the top (afterbegin)

  for (var i = posts.length - 1; i >= 0; i--) {
    postsHTML += posts[i]
  }

  timelineElem.insertAdjacentHTML(position, postsHTML);
  loadEmbeds()
};

var loadEmbeds = function() {
  /**
   * Trigger embed provider unpacking
   * Todo: Make required scripts available on subsequent loads
   */

  if (window.instgrm) instgrm.Embeds.process()
  if (window.twttr) twttr.widgets.load()
}

var deletePost = function() {}; // todo
var updatePost = function() {};

module.exports = {
  addPosts: addPosts,
  deletePost: deletePost,
  updatePost: updatePost
}
