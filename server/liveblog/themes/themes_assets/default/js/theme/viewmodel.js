/* eslint-disable */
/**
 * @author ps / @___paul
 */

'use strict';

var helpers = require('./helpers')
  , view = require('./view')
  , polls = require('./polls');
const Permalink = require('./permalink');

const apiHost = LB.api_host.match(/\/$/i) ? LB.api_host : LB.api_host + '/';
const commentItemEndpoint = `${apiHost}api/client_items`;
const clientPostsEndpoint = `${apiHost}api/client_posts`;
const commentPostEndpoint = `${apiHost}api/client_comments`;
const permalink = new Permalink();

var endpoint = apiHost + 'api/client_blogs/' + LB.blog._id + '/posts';
var settings = LB.settings;
var vm = {};
var latestUpdate = new Date().toISOString();
var pendingPosts;
var sharedPostTimestamp;
var selectedTags = [];

// flag used to avoid adding duplicated `_items` to the viewmodel when initial
// render is processing
vm.isInitialRenderProcessing = false;

/**
 * Get initial or reset viewmodel.
 * @returns {object} empty viewmodel store.
 */
function getEmptyVm(items) {
  return {
    _items: new Array(items || 0),
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
    sort: opts.sort || settings.postOrder,
    highlightsOnly: settings.onlyHighlighted || false,
    notDeleted: opts.notDeleted,
    fromDate: opts.fromDate ? opts.fromDate : false,
    sticky: opts.sticky,
    tags: opts.tags,
    beforeDate: opts.beforeDate ? opts.beforeDate : false
  });

  if (LB.output && endpoint.indexOf('api/client_blogs') !== -1) {
    endpoint = `${apiHost}api/client_blogs/${LB.blog._id}/${LB.output._id}/posts`;
  }

  var page = opts.fromDate ? '' : `&page=${opts.page?opts.page:'1'}`;
  var qs = '?max_results=' + settings.postsPerPage + page + '&source='
    , fullPath = endpoint + qs + dbQuery;

  return helpers.getJSON(fullPath)
    .then((posts) => {
      posts.requestOpts = opts;
      self.updateViewModel(posts);
      return posts;
    })
    .catch((err) => {
      console.error(err);
    });
};

/**
 * Private API request method
 * @returns {object} Liveblog 3 API response
 */
vm.getAllPosts = function() {
  var self = this;

  var dbQuery = self.getQuery({});

  var qs = "?source="
    , fullPath = endpoint + qs + dbQuery;

  return helpers.getJSON(fullPath);
};

vm.getSinglePost = function(id) {
  var url = `${clientPostsEndpoint}/${id}`;
  return helpers.getJSON(url);
};

/**
 * Get next page of posts from API.
 * @param {object} opts - query builder options.
 * @returns {promise} resolves to posts array.
 */
vm.loadPostsPage = function(opts) {
  opts = opts || {};
  opts.notDeleted = true;
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
  return this.getPosts(opts);
};

/**
 * Add/Remove tags from drodown
 * @param {object} tag - The tag to add/remove
 * @returns {array} The tags checked in the dropdown
 */
vm.updateSelectedTags = function(tag) {
  const tagIndex = selectedTags.indexOf(tag);
  if (tagIndex === -1) {
    selectedTags.push(tag);
  } else {
    selectedTags.splice(tagIndex, 1);
  }
  return selectedTags;
}

/**
 * Add items in api response & latest update timestamp to viewmodel.
 * @param {object} api_response - liveblog API response JSON.
 */
vm.updateViewModel = function(api_response) {
  var self = this;
  var reqOpts = api_response.requestOpts;
  var isPolling = typeof reqOpts.fromDate !== 'undefined';

  if (isPolling) {
    // no items? then nothing to do here
    if (!api_response._items.length) return;

    latestUpdate = self.getLatestUpdate(api_response);
  } else {
    view.hideLoadMore(self.isTimelineEnd(api_response));
  }

  // tag selected/removed
  if (reqOpts.tags && reqOpts.tags.length && !reqOpts.sort) {
    self.vm = getEmptyVm();
    self.vm._items.push.apply(self.vm._items, api_response._items);
    view.hideLoadMore(self.isTimelineEnd(api_response));
    return api_response;
  }

  // order has changed
  if (reqOpts.sort && reqOpts.sort !== settings.postOrder) {
    self.vm = getEmptyVm();
    Object.assign(self.vm, api_response);
    view.hideLoadMore(self.isTimelineEnd(api_response));
  } else {
    if (!vm.isInitialRenderProcessing)
      self.vm._items = [...self.vm._items, ...api_response._items];

    view.hideLoadMore(self.isTimelineEnd(api_response));
  }

  if (reqOpts.sort) {
    settings.postOrder = reqOpts.sort;
  }

  return api_response;
};

/**
 * Get the latest update timestamp from a number of posts.
 * @param {object} api_response - liveblog API response JSON.
 * @returns {string} - ISO 8601 encoded date
 */
vm.getLatestUpdate = function(api_response) {
  var timestamps = api_response._items.map((post) => new Date(post.content_updated_date));

  var latest = new Date(Math.max.apply(null, timestamps));
  return latest.toISOString(); // convert timestamp to ISO
};

/**
 * Getter for selectedTags
 * @returns {array} - Tags checked in tags-filter dropdown
 */
vm.getSelectedTags = function() {
  return selectedTags;
}

/**
 * Check if we reached the end of the timeline.
 * @param {object} api_response - liveblog API response JSON.
 * @returns {bool}
 */
vm.isTimelineEnd = function(api_response) {
  var itemsInView = view.getItemsInView();
  
  // In cases where fromDate is set, e.g polling for updates/shared posts,
  // and meta.total isn't the accurate number of total posts from the blog
  // but those returned for those specific requests, we ignore
  if (api_response.requestOpts.fromDate) {
    return false;
  }
  
  return api_response._meta.total <= itemsInView;
};


vm.fetchLatestAndRender = function() {
  vm.loadPosts({
    fromDate: latestUpdate,
    tags: selectedTags
  })
  .then(view.renderPosts)
  .then(view.initGdprConsentAndRefreshAds)
  .catch(error => console.log(error))
}

vm.fetchFromPermalinkAndRender = function() {
  vm.loadPosts({
    beforeDate: sharedPostTimestamp,
    tags: selectedTags,
  })
  .then(response => {
    response.pendingPosts = pendingPosts;
    latestUpdate = sharedPostTimestamp;
    return view.renderTimeline(response);
  })
  .then(view.scrollHeaderIntoView)
  .then(vm.fetchLatestAndRender)
  .catch(error => console.log(error))
}

vm.handleSharedPost = function(postId) {
  LB.settings.autoApplyUpdates = false;
  vm.getSinglePost(postId)
  .then(post => {
    sharedPostTimestamp = new Date(post._updated).toISOString();
    vm.loadPosts({
      fromDate: sharedPostTimestamp,
      tags: selectedTags
    })
    .then(response => {
      pendingPosts = response._meta.total;
      return vm.fetchFromPermalinkAndRender();
    })
  })
  .catch(error => console.log(error));
}

vm.initialRender = function() {
  vm.isInitialRenderProcessing = true;
  vm.loadPosts({
    beforeDate: latestUpdate,
    tags: selectedTags,
    notDeleted: true,
  })
  .then(api_response => {
    view.hideLoadMore(api_response._meta.total <= settings.postsPerPage);
    return api_response;
  })
  .then(view.renderTimeline)
  .then(view.displayNewPosts)
  .then(view.checkPending)
  .then(view.consent.init)
  .then(view.adsManager.refreshAds)
  .then(view.loadEmbeds)
  .then(polls.checkExistingVotes)
  .then(() => {
    onYouTubeIframeAPIReady();
  })
  .then(vm.fetchLatestAndRender)
  .then(() => {
    vm.isInitialRenderProcessing = false;
  })
  .catch(error => console.log(error))
}

/**
 * Set up viewmodel.
 */
vm.init = function() {
  this.settings = settings;
  this.vm = getEmptyVm(settings.postsPerPage);
  this.vm.timeInitialized = new Date().toISOString();

  var isBlogOpen = LB.blog.blog_status === "open";
  var tenSeconds = 10 * 1000;

  if (permalink._id) {
    // if permalink exists, even if blog is archived, get the timestamp and render the post and the posts before it
    // after which get the latest posts from the same timestamp and render as new updates
    vm.handleSharedPost(permalink._id);
  }

  if (isBlogOpen) {
    // let's hit backend right away after load and load posts before current time
    // after which we check for new posts
    vm.initialRender();

    // then every 10 seconds
    setInterval(vm.fetchLatestAndRender, tenSeconds);
  }
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
            {"range": {"_updated": opts.beforeDate ? { "lte": opts.beforeDate } : {"lt": this.vm ? this.vm.timeInitialized : new Date().toISOString()}}}
          ]
        }
      }
    },
    "sort": [
      {
        "published_date": {order: 'desc', missing: '_last', unmapped_type: 'long'}
      }
    ]
  };

  if (opts.fromDate) {
    query.query.filtered.filter.and[2].range = {
      "content_updated_date": {"gt": opts.fromDate }
    };

    // remove sticky posts from update polling request.
    query.query.filtered.filter.and.splice(0, 1);

    // changing `term`.`post_status` to `terms`.`post_status` with
    // multiple values so we can have unpublish posts
    query.query.filtered.filter.and.splice(0, 1);

    query.query.filtered.filter.and.push({
      terms: { post_status:  ["open", "submitted"] }
    });
  }

  if (opts.tags && opts.tags.length > 0) {
    query.post_filter = {
      "bool": {
        "must": [{
          "terms": {
            "tags": opts.tags
          }
        }]
      }
    };
  }

  if (opts.highlightsOnly === true) {
    query.query.filtered.filter.and.push({
      term: {lb_highlight: true}
    });
  }

  if (opts.notDeleted === true) {
    query.query.filtered.filter.and.push({
      not: { term: {deleted: true} }
    });
  }

  if (opts.sort === "ascending") {
    query.sort[0].published_date.order = "asc";
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
  if (!opts.fromDate && !opts.beforeDate) {
    query.query.filtered.filter.and.forEach((rule, index) => {
      if (rule.hasOwnProperty('range')) {
        query.query.filtered.filter.and.splice(index, 1);
      }
    });
  }

  return encodeURI(JSON.stringify(query));
};

module.exports = vm;
