/**
 * @author ps / @___paul
 */

'use strict';

var helpers = require('./helpers')
  , view = require('./view');

const apiHost = LB.api_host.match(/\/$/i) ? LB.api_host : LB.api_host + '/';
const commentItemEndpoint = `${apiHost}api/client_items`;
const commentPostEndpoint = `${apiHost}api/client_comments`;

var endpoint = apiHost + "api/client_blogs/" + LB.blog._id + "/posts"
  , settings = LB.settings
  , vm = {};

let latestUpdate;
/**
 * Get initial or reset viewmodel.
 * @returns {object} empty viewmodel store.
 */
function getEmptyVm(items) {
  return {
    _items: new Array(items) || 0,
    currentPage: 1,
    totalPosts: 0
  };
}

vm.sendComment = (name, comment) => {
  let errors = [];

  if (!name) {
    errors.push({id: '#comment-name', msg: 'Missing name'});
  }

  if (!comment) {
    errors.push({id: '#comment-content', msg: 'Missing content'});
  }

  if (errors.length > 0) {
    return new Promise((resolve, reject) => reject(errors));
  }

  return helpers
    .post(commentItemEndpoint, {
      item_type: "comment",
      client_blog: LB.blog._id,
      commenter: name,
      text: comment
    })
    .then((item) => helpers.post(commentPostEndpoint, {
      post_status: "comment",
      client_blog: LB.blog._id,
      groups: [{
        id: "root",
        refs: [{idRef: "main"}],
        role: "grpRole:NEP"
      },{
        id: "main",
        refs: [{residRef: item._id}],
        role: "grpRole:Main"}
      ]
    }));
    //.catch((err) => {
    //  console.error(err);
    //});
};

/**
 * Private API request method
 * @param {object} opts - query builder options.
 * @param {number} opts.page - desired page/subset of posts, leave empty for polling.
 * @param {number} opts.fromDate - needed for polling.
 * @returns {object} Liveblog 3 API response
 */
vm.getPosts = function(opts) {
  var self = this;

  var dbQuery = self.getQuery({
    sort: opts.sort || self.settings.postOrder,
    highlightsOnly: false || opts.highlightsOnly,
    fromDate: opts.fromDate
      ? opts.fromDate
      : false
  });

  var page = opts.fromDate ? 1 : opts.page;
  var qs = "?max_results=" + settings.postsPerPage + "&page=" + page + "&source="
    , fullPath = endpoint + qs + dbQuery;

  return helpers.getJSON(fullPath)
    .then((posts) => {
      self.updateViewModel(posts, opts);
      posts.requestOpts = opts;
      return posts;
    })
    .catch((err) => {
      console.error(err);
    });
};

/**
 * Get next page of posts from API.
 * @param {object} opts - query builder options.
 * @returns {promise} resolves to posts array.
 */
vm.loadPostsPage = function(opts) {
  opts = opts || {};
  opts.page = ++this.vm.currentPage;
  opts.sort = this.settings.postOrder;
  return this.getPosts(opts);
};

/**
 * Poll API for new posts.
 * @param {object} opts - query builder options.
 * @returns {promise} resolves to posts array.
 */
vm.loadPosts = function(opts) {
  opts = opts || {};
  //opts.fromDate = this.vm.latestUpdate || new Date().toISOString();

  return this.getPosts(opts);
};

/**
 * Add items in api response & latest update timestamp to viewmodel.
 * @param {object} api_response - liveblog API response JSON.
 */
vm.updateViewModel = function(api_response, opts) {
  var self = this;

  if (!opts.fromDate || opts.sort !== self.settings.postOrder) { // Means we're not polling
    view.hideLoadMore(self.isTimelineEnd(api_response)); // the end?
  } else { // Means we're polling for new posts
    if (!api_response._items.length) {
      return;
    }

    latestUpdate = self.getLatestUpdate(api_response);
  }

  if (opts.sort !== self.settings.postOrder) {
    self.vm = getEmptyVm();
    view.hideLoadMore(false);
    Object.assign(self.vm, api_response);
  } else {
    self.vm._items.push.apply(self.vm._items, api_response._items);
  }

  self.settings.postOrder = opts.sort;
  return api_response;
};

/**
 * Get the latest update timestamp from a number of posts.
 * @param {object} api_response - liveblog API response JSON.
 * @returns {string} - ISO 8601 encoded date
 */
vm.getLatestUpdate = function(api_response) {
  var timestamps = api_response._items.map((post) => new Date(post._updated));

  var latest = new Date(Math.max.apply(null, timestamps));
  return latest.toISOString(); // convert timestamp to ISO
};

/**
 * Check if we reached the end of the timeline.
 * @param {object} api_response - liveblog API response JSON.
 * @returns {bool}
 */
vm.isTimelineEnd = function(api_response) {
  var itemsInView = this.vm._items.length + settings.postsPerPage;
  return api_response._meta.total <= itemsInView;
};

/**
 * Set up viewmodel.
 */
vm.init = function() {
  this.settings = settings;
  this.vm = getEmptyVm(settings.postsPerPage);
  latestUpdate = new Date().toISOString();
  this.vm.timeInitialized = new Date().toISOString();

  setInterval(() => {
    vm.loadPosts({fromDate: latestUpdate})
      .then(view.renderPosts) // Start polling
      .then(() => {
        latestUpdate = new Date().toISOString();
      });
  }, 10*1000);

  //return this.vm.latestUpdate;
};

/**
 * Build urlencoded ElasticSearch Querystring
 * TODO: abstract away, we only need sticky flag and order
 * @param {Object} opts - arguments object
 * @param {string} opts.sort - if "ascending", get items in ascending order
 * @param {string} opts.fromDate - results with a ISO 8601 timestamp gt this only
 * @param {bool} opts.highlightsOnly - get editorial/highlighted items only
 * @returns {string} Querystring
 */
vm.getQuery = function(opts) {
  var query = {
    "query": {
      "filtered": {
        "filter": {
          "and": [
            {"term": {"sticky": false}},
            {"term": {"post_status": "open"}},
            {"not": {"term": {"deleted": true}}},
            {"range": {"_updated": {"lt": this.vm.timeInitialized}}}
          ]
        }
      }
    },
    "sort": [
      {
        "_updated": {"order": "desc"}
      }
    ]
  };

  if (opts.fromDate) {
    query.query.filtered.filter.and[3].range._updated = {
      "gt": opts.fromDate
    };
  }

  if (opts.highlightsOnly === true) {
    query.query.filtered.filter.and.push({
      term: {highlight: true}
    });
  }

  if (opts.sort === "ascending") {
    query.sort[0]._updated.order = "asc";
  } else if (opts.sort === "editorial") {
    query.sort = [
      {
        order: {
          order: "desc",
          missing: "_last",
          unmapped_type: "long"
        }
      }
    ];
  }

  // Remove the range, we want all the results
  if (!opts.fromDate) {
    query.query.filtered.filter.and.forEach((rule, index) => {
      if (rule.hasOwnProperty('range')) {
        query.query.filtered.filter.and.splice(index, 1);
      }
    });
  }

  return encodeURI(JSON.stringify(query));
};

module.exports = vm;
