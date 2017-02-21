/**
 * @author ps / @___paul
 */

'use strict';

var templates = require('./templates')
  , helpers = require('./helpers')
  , view = require('./view');

var endpoint = LB.api_host + "api/client_blogs/" + LB.blog._id + "/posts"
  , settings = LB.settings;

var vm = LB.vm = {
  currentPage: 1,
  offset: 0,
  _items: []
};

var getPosts = function(page) {
  /**
   * Private API request method
   * @param {number} page - desired page/subset of posts.
   * @returns {object} Liveblog 3 API response
   */

  var qs = "?max_results=" + LB.settings.postsPerPage + "&page=" + page + "&source="
    , fullpath = endpoint + qs + getQuery(settings.postOrder, false);

  return helpers.getJSON(fullpath)
};

var loadPosts = function(currentPage, offset) {
  /**
   * Calls API, returns results
   * @param {number} page - desired page of posts, subset length controlled by settings.postsPerPage
   * @param {number} offset - current offset sum of loaded and deleted posts, needed for paging
   * @returns {array} - an array of Liveblog post items
   */

  var currentPage = currentPage || vm.currentPage
    , offset = offset || vm.offset
    , page;

  page = ++currentPage + getPageBoundary(offset);
  vm.currentPage = page;

  return getPosts(page)
    .then(function(json) { return json._items; })
    .catch(function(err) {})
};

var renderPosts = function(posts) {
  /**
   * Render posts currently in pipeline to template, store results in viewmodel
   * To reduce DOM draws we hand off add operations to view in bulk.
   * @param {array} posts - an array of Liveblog post items
   */

  var renderedPosts = []; // temporary store

  for (var i = 0, offset = 0; i < posts.length; i++) {
    var post = posts[i];

    if ("delete" === posts.operation) {
      view.deletePost(post._id)
    }

    var renderedPost = templates.post({
      item: post
    });

    if (postExists(post._id)) {
      view.updatePost(renderedPost)
      return; // early exit
    }
    
    renderedPosts.push(renderedPost) // create operation
  };

  // todo Update Offset on new posts and delete
  // todo update viewmodel
  
  if (!renderedPosts.length) return // early
  view.addPosts(renderedPosts) // if creates
};

var updateViewModel = function() {
  // todo
}; 

var postExists = function(postId) {
  /**
   * Check if a post is already present in viewmodel.
   * @param {string} postId - urn of the post to check against.
   * @returns {bool}
   */

  for (var i = vm._items.length - 1; i >= 0; i--) {
    if (postId === vm._items[i]._id) {
      return true
    }
  }

  return false
};

var getPageBoundary = function(offset) {
  /**
   * Check to see if we need to require a higher/lower page number
   * @returns {integer} of page boundaries crossed by the sum of posts loaded
   */

  return Math.floor(offset / settings.postsPerPage);
};

var getQuery = function(sort, highlightsOnly) {
  /**
   * Get urlencoded ElasticSearch Querystring
   * TODO: abstract away, we only need sticky flag and order
   * @param {string} sort - if "oldest_first", get items in ascending order
   * @param {bool} highlightsOnly - get editorial/highlighted items only
   * @returns {string} Querystring
   */

  var query = {
    "query": {
      "filtered": {
        "filter": {
          "and": [
            {"term": {"sticky": false}},
            {"term": {"post_status": "open"}},
            {"not": {"term": {"deleted": true}}}
          ]
        }
      }
    },
    "sort":[{
      "order": {"order": "desc"}
    }]
  };

  if (highlightsOnly) {
    _query.filtered.filter.and.push({
        term: {highlight: true}
    })
  }

  if (sort == "oldest_first") {
    _query.sort[0].order.order = "asc"
  }

  return encodeURI(JSON.stringify(query));
}

module.exports = {
  renderPosts: renderPosts,
  loadPosts: loadPosts
}
