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
  _items: [],
  currentPage: 1,
  offset: 0
};

/**
 * Private API request method
 * @param {number} page - desired page/subset of posts.
 * @returns {object} Liveblog 3 API response
 */
function getPosts(page) {
  var dbQuery = getQuery({sort: settings.postOrder, highlightsOnly: false})
    , qs = "?max_results=" + LB.settings.postsPerPage + "&page=" + page + "&source="
    , fullPath = endpoint + qs + dbQuery;

  return helpers.getJSON(fullPath);
};

/**
 * Calls API, returns results
 * @param {number} page - desired page of posts, subset length controlled by settings.postsPerPage
 * @param {number} offset - current offset sum of loaded and deleted posts, needed for paging
 * @returns {array} - an array of Liveblog post items
 */
function loadPosts(currentPage, offset) {
  var currentPage = currentPage || vm.currentPage
    , offset = offset || vm.offset
    , page;

  page = ++currentPage + getPageBoundary(offset);
  vm.currentPage = page;

  return getPosts(page)
    .then(function(api_response) {
      updateViewModel(api_response);
      return api_response._items;
    })
    
    .catch(function(err) {})
};

/**
 * Render posts currently in pipeline to template, store results in viewmodel
 * To reduce DOM calls/paints we hand off add operations to view in bulk.
 * @param {array} posts - an array of Liveblog post items
 */
function renderPosts(posts) {
  var renderedPosts = []; // temporary store

  for (var i = 0, offset = 0; i < posts.length; i++) {
    var post = posts[i];

    if ("delete" === posts.operation) {
      view.deletePost(post._id)
      return; // early
    };

    var renderedPost = templates.post({
      item: post
    });

    if ("update" === posts.operation) {
      view.updatePost(renderedPost)
      return; // early
    }
    
    renderedPosts.push(renderedPost) // create operation
  };

  // todo Update Offset on new posts and delete
  // todo update viewmodel
  
  if (!renderedPosts.length) return // early
  if (settings.postOrder === "descending") renderedPosts.reverse()

  view.addPosts(renderedPosts) // if creates
};

/**
 * Add items in api response & latest update timestamp to viewmodel.
 * @param {object} api_response - liveblog API response JSON.
 */
function updateViewModel(api_response) {
  vm.latest_update = getLatestUpdate(api_response);
  vm._items.push.apply(vm._items, api_response._items);
  view.toggleLoadMore(isTimelineEnd(api_response)) // the end?
};

/**
 * Get the latest update timestamp from a number of posts.
 * @param {object} api_response - liveblog API response JSON.
 * @returns {string} - ISO 8601 encoded date
 */
function getLatestUpdate(api_response) {
  if (!api_response) return new Date().toISOString(); // initial
  var timestamps = api_response._items.map(function(post) {
    return new Date(post._updated)
  })

  var latest = new Date(Math.max.apply(null, timestamps));
  return latest.toISOString() // convert timestamp to ISO
};

/**
 * Check if we reached the end of the timeline.
 * @param {object} api_response - liveblog API response JSON.
 * @returns {bool}
 */
function isTimelineEnd(api_response) {
  var itemsInView = vm._items.length + settings.postsPerPage;
  return api_response._meta.total <= itemsInView;
};

/**
 * Check to see if we need to require a higher/lower page number
 * @returns {integer} of page boundaries crossed by the sum of posts loaded
 */
function getPageBoundary(offset) {
  return Math.floor(offset / settings.postsPerPage);
};

/**
 * Build urlencoded ElasticSearch Querystring
 * TODO: abstract away, we only need sticky flag and order
 * @param {Object} opts - arguments object
 * @param {string} opts.sort - if "oldest_first", get items in ascending order
 * @param {string} opts.fromDate - results with a ISO 8601 timestamp gt this only
 * @param {bool} opts.highlightsOnly - get editorial/highlighted items only
 * @returns {string} Querystring
 */
function getQuery(opts) {
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

  if (opts.fromDate) {
    _query.filtered.filter.and.push({
      "range": {"_updated": {"gt": fromDate}}
    })
  };

  if (opts.highlightsOnly === true) {
    _query.filtered.filter.and.push({
        term: {highlight: true}
    })
  };

  if (opts.sort === "oldest_first") {
    _query.sort[0].order.order = "asc"
  }

  return encodeURI(JSON.stringify(query));
}

module.exports = {
  getLatestUpdate: getLatestUpdate,
  loadPosts: loadPosts,
  renderPosts: renderPosts
}
