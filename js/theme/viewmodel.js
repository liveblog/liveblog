/**
 * @author ps / @___paul
 */

'use strict';

var templates = require('./templates')
  , helpers = require('./helpers')
  , view = require('./view');

var endpoint = LB.api_host + "/api/client_blogs/" + LB.blog._id + "/posts"
  , settings = LB.settings;

var vm = {
  _items: [],
  currentPage: 1,
  totalPosts: 0
};

/**
 * Private API request method
 * @param {object} opts - query builder options.
 * @param {number} opts.page - desired page/subset of posts, leave empty for polling.
 * @param {number} opts.fromDate - needed for polling.
 * @returns {object} Liveblog 3 API response
 */
function getPosts(opts) {
  var dbQuery = getQuery({
    sort: opts.sort || settings.postOrder,
    highlightsOnly: false || opts.highlightsOnly,
    fromDate: opts.fromDate
      ? opts.fromDate
      : false
  })

  var page = opts.fromDate ? 1 : opts.page;
  var qs = "?max_results=" + LB.settings.postsPerPage + "&page=" + page + "&source="
    , fullPath = endpoint + qs + dbQuery;

  return helpers.getJSON(fullPath)
    .then(function(api_response) {
      if (opts.returnPromise) {
        return api_response;
      }

      updateViewModel(api_response, opts);
      renderPosts(api_response, opts);
    })
};

/**
 * Get next page of posts from API.
 * @param {object} opts - query builder options.
 * @returns {promise} resolves to posts array.
 */
function loadPostsPage(opts) {
  var opts = opts || {}
  opts.page = ++vm.currentPage;

  return getPosts(opts).catch(function(err) {
    // catch all errors here
  })
};

/**
 * Poll API for new posts.
 * @param {object} opts - query builder options.
 * @returns {promise} resolves to posts array.
 */
function loadPosts(opts) {
  var opts = opts || {};
  opts.fromDate = vm.latestUpdate;

  return getPosts(opts)
    .then(function(posts) {
      return posts;
    })
    .catch(function(err) {
      // catch all errors here
    })
};

/**
 * Render posts currently in pipeline to template, store results in viewmodel
 * To reduce DOM calls/paints we hand off add operations to view in bulk.
 * @param {object} api_response - liveblog API response JSON.
 */
function renderPosts(api_response, opts) {
  var renderedPosts = [] // temporary store
    , posts = api_response._items;

  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];

    if ("delete" === posts.operation) {
      view.deletePost(post._id);
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

  if (!renderedPosts.length) return // early
  if (settings.postOrder === "descending") renderedPosts.reverse()

  view.addPosts(renderedPosts, { // if creates
    position: opts.fromDate ? "top" : "bottom"
  })
};

/**
 * Add items in api response & latest update timestamp to viewmodel.
 * @param {object} api_response - liveblog API response JSON.
 */
function updateViewModel(api_response, opts) {
  if (opts.sort === 'oldest_first') {
    vm._items = api_reponse._items;
  } else {
    vm._items.push.apply(vm._items, api_response._items);
  }

  if (!opts.fromDate) { // Means we're not polling
    view.toggleLoadMore(isTimelineEnd(api_response)) // the end?
  } else { // Means we're polling for new posts
    if (!api_response._items.length) return;
    vm.latestUpdate = getLatestUpdate(api_response);
  }
};

/**
 * Get the latest update timestamp from a number of posts.
 * @param {object} api_response - liveblog API response JSON.
 * @returns {string} - ISO 8601 encoded date
 */
function getLatestUpdate(api_response) {
  var timestamps = api_response._items.map(function(post) {
    return new Date(post._updated)
  });

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
 * Set up viewmodel.
 */
function init() {
  vm.latestUpdate = new Date().toISOString();
  vm.timeInitialized = new Date().toISOString();
  return vm.latestUpdate;
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
            {"not": {"term": {"deleted": true}}},
            {"range": {"_updated": {"lt": vm.timeInitialized}}}
          ]
        }
      }
    },
    "sort":[{
      "_updated": {"order": "desc"}
    }]
  };

  if (opts.fromDate) {
    query.query.filtered.filter.and[3].range._updated = {
      "gt": opts.fromDate
    }
  };

  if (opts.highlightsOnly === true) {
    query.query.filtered.filter.and.push({
        term: {highlight: true}
    })
  };

  if (opts.sort === "oldest_first") {
    query.sort[0]._updated.order = "asc"
  }

  if (opts.sort === "oldest_first" || opts.sort === "newest_first") {
    query.query.filtered.filter.and.forEach(function(rule, index) {
      if (rule.hasOwnProperty('range')) {
        query.query.filtered.filter.and.splice(index, 1);
      }
    });
  }

  return encodeURI(JSON.stringify(query));
}

module.exports = {
  getLatestUpdate: getLatestUpdate,
  loadPosts: loadPosts,
  loadPostsPage: loadPostsPage,
  renderPosts: renderPosts,
  init: init
}
