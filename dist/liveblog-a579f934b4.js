(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/opt/themes/liveblog-default-theme/js/liveblog.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */
 
'use strict';

// Prerender functions
var theme = require('./theme');

document.addEventListener('DOMContentLoaded', function() {
  theme.init()
});

module.exports = {}
},{"./theme":"/opt/themes/liveblog-default-theme/js/theme/index.js"}],"/opt/themes/liveblog-default-theme/js/theme/handlers.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var view = require('./view')
  , viewmodel = require('./viewmodel')
  , helpers = require('./helpers');

/**
 * Contains a mapping of element data-selectors and click handlers
 * buttons.attach {function} - registers handlers found in handlers object
 */
var buttons = {
  handlers: {
    "[data-js-loadmore]": function() {
      viewmodel.loadPostsPage()
        .then(view.renderPosts)
        .then(view.displayNewPosts);
    },

    "[data-js-orderby_oldest_first]": function() {
      viewmodel.loadPosts({sort: 'oldest_first'})
        .then(view.renderTimeline)
        .then(function() {
          view.toggleSortBtn('oldest_first')
        })
    },

    "[data-js-orderby_newest_first]": function() {
      viewmodel.loadPosts({sort: 'newest_first'})
        .then(view.renderTimeline)
        .then(function() {
          view.toggleSortBtn('newest_first')
        })
    }
  },

  attach: function() {
    for (var handler in buttons.handlers) {
      var el = helpers.getElems(handler)[0];
      if (!el) return false
      el.addEventListener('click', buttons.handlers[handler], false);
    }
  }
};

var events = {
  attach: function() {} // todo
};

module.exports = {
  buttons: buttons,
  events: events
}

},{"./helpers":"/opt/themes/liveblog-default-theme/js/theme/helpers.js","./view":"/opt/themes/liveblog-default-theme/js/theme/view.js","./viewmodel":"/opt/themes/liveblog-default-theme/js/theme/viewmodel.js"}],"/opt/themes/liveblog-default-theme/js/theme/helpers.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';
var moment;

/**
 * Convert ISO timestamps to relative moment timestamps
 * @param {Node} elem - a DOM element with ISO timestamp in data-js-timestamp attr
 */
function convertTimestamp(timestamp) {
  var l10n = LB.l10n.timeAgo
    , now = new Date() // Now
    , diff = now - new Date(timestamp)
    , units = {
      d: 1000 * 3600 * 24,
      h: 1000 * 3600,
      m: 1000 * 60
    };

  function getTimeAgoString(timestamp, unit) {
    return !(timestamp <= units[unit] * 2)
      ? l10n[unit].p.replace("{}", Math.floor(timestamp / units[unit]))
      : l10n[unit].s;
  }

  function timeAgo(timestamp) {
    if (timestamp < units.h) return getTimeAgoString(timestamp, "m");
    if (timestamp < units.d) return getTimeAgoString(timestamp, "h");

    return getTimeAgoString(timestamp, "d"); // default
  };

  return timeAgo(diff);
};

/**
 * Wrap element selector api
 * @param {string} query - a jQuery syntax DOM query (with dots)
 */
function getElems(query) {
  var isDataAttr = -1 < query.indexOf("data-");
  return isDataAttr
    ? document.querySelectorAll(query)
    : document.getElementsByClassName(query);
};

/**
 * jQuery's $.getJSON in a nutshell
 * @param {string} url - a request URL
 */
function getJSON(url) {
  return new Promise(function(resolve, reject) {
    var promise = Promise;
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url);
    xhr.onload = function() {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      }
      else reject(xhr.responseText);
    };

    xhr.send();
  });
}

module.exports = {
  getElems: getElems,
  getJSON: getJSON,
  convertTimestamp: convertTimestamp
}

},{}],"/opt/themes/liveblog-default-theme/js/theme/index.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var helpers = require("./helpers")
  , handlers = require("./handlers")
  , viewmodel = require("./viewmodel")
  , view = require("./view");

module.exports = {
  /**
   * On document loaded, do the following:
   */
  init: function() {
    handlers.buttons.attach(); // Register Buttons Handlers
    handlers.events.attach(); // Register Event, Message Handlers
    viewmodel.init();

    setInterval(function() {
      viewmodel.loadPosts().then(view.renderPosts); // Start polling
      view.updateTimestamps(); // Convert ISO dates to timeago
    }, 10*1000)
  }
}

},{"./handlers":"/opt/themes/liveblog-default-theme/js/theme/handlers.js","./helpers":"/opt/themes/liveblog-default-theme/js/theme/helpers.js","./view":"/opt/themes/liveblog-default-theme/js/theme/view.js","./viewmodel":"/opt/themes/liveblog-default-theme/js/theme/viewmodel.js"}],"/opt/themes/liveblog-default-theme/js/theme/templates.js":[function(require,module,exports){
module.exports = {
  post: require("../../templates/template-post.html"),
  timeline: require("../../templates/template-timeline.html"),
  itemImage: require("../../templates/template-item-image.html"),
  itemEmbed: require("../../templates/template-item-embed.html")
}
},{"../../templates/template-item-embed.html":"/opt/themes/liveblog-default-theme/templates/template-item-embed.html","../../templates/template-item-image.html":"/opt/themes/liveblog-default-theme/templates/template-item-image.html","../../templates/template-post.html":"/opt/themes/liveblog-default-theme/templates/template-post.html","../../templates/template-timeline.html":"/opt/themes/liveblog-default-theme/templates/template-timeline.html"}],"/opt/themes/liveblog-default-theme/js/theme/view.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';
var helpers = require("./helpers")
var templates = require('./templates')

var timelineElem = helpers.getElems("lb-posts")
  , loadMorePostsButton = helpers.getElems("load-more-posts");

/**
 * Replace the current timeline unconditionally.
 * @param {array} api_response - liveblog API response JSON
 * @param {object} opts - keyword args
 */
function renderTimeline(api_response, opts) {
  var renderedPosts = [];

  api_response._items.forEach(function(post) {
    renderedPosts.push(templates.post({
      item: post
    }))
  });

  timelineElem[0].innerHTML = renderedPosts.join("");
  loadEmbeds();
}

/**
 * Render posts currently in pipeline to template.
 * To reduce DOM calls/paints we hand off rendered HTML in bulk.
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
}

/**
 * Set sorting order button of class @name to active.
 * @param {string} name - liveblog API response JSON.
 */
function toggleSortBtn(name) {
  var sortingBtns = document.querySelectorAll('.sorting-bar__order');
  sortingBtns.forEach(function(el) {
    var shouldBeActive = el.dataset.hasOwnProperty("jsOrderby_" + name)
    el.classList.toggle('sorting-bar__order--active', shouldBeActive);
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
  if (window.instgrm) window.instgrm.Embeds.process()
  if (window.twttr) window.twttr.widgets.load()
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

},{"./helpers":"/opt/themes/liveblog-default-theme/js/theme/helpers.js","./templates":"/opt/themes/liveblog-default-theme/js/theme/templates.js"}],"/opt/themes/liveblog-default-theme/js/theme/viewmodel.js":[function(require,module,exports){
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
};

/**
 * Get next page of posts from API.
 * @param {object} opts - query builder options.
 * @returns {promise} resolves to posts array.
 */
function loadPostsPage(opts) {
  var opts = opts || {}
  opts.page = ++vm.currentPage;

  return getPosts(opts)
    .then(function(posts) {
      updateViewModel(posts, opts);
      return posts
    })
    .catch(function(err) {
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
      updateViewModel(posts, opts);
      return posts
    })
    .catch(function(err) {
      // catch all errors here
    })
};

/**
 * Add items in api response & latest update timestamp to viewmodel.
 * @param {object} api_response - liveblog API response JSON.
 */
function updateViewModel(api_response, opts) {
  if (opts.sort === 'oldest_first') {
    Object.assign(vm, api_response);
  } else {
    vm._items.push.apply(vm._items, api_response._items);
  }

  if (!opts.fromDate) { // Means we're not polling
    view.toggleLoadMore(isTimelineEnd(api_response)) // the end?
  } else { // Means we're polling for new posts
    if (!api_response._items.length) return;
    vm.latestUpdate = getLatestUpdate(api_response);
  }

  return api_response
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
  init: init
}

},{"./helpers":"/opt/themes/liveblog-default-theme/js/theme/helpers.js","./templates":"/opt/themes/liveblog-default-theme/js/theme/templates.js","./view":"/opt/themes/liveblog-default-theme/js/theme/view.js"}],"/opt/themes/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js":[function(require,module,exports){
/*! Browser bundle of nunjucks 3.0.0 (slim, only works with precompiled templates) */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["nunjucks"] = factory();
	else
		root["nunjucks"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var lib = __webpack_require__(1);
	var env = __webpack_require__(2);
	var Loader = __webpack_require__(14);
	var loaders = __webpack_require__(3);
	var precompile = __webpack_require__(3);

	module.exports = {};
	module.exports.Environment = env.Environment;
	module.exports.Template = env.Template;

	module.exports.Loader = Loader;
	module.exports.FileSystemLoader = loaders.FileSystemLoader;
	module.exports.PrecompiledLoader = loaders.PrecompiledLoader;
	module.exports.WebLoader = loaders.WebLoader;

	module.exports.compiler = __webpack_require__(3);
	module.exports.parser = __webpack_require__(3);
	module.exports.lexer = __webpack_require__(3);
	module.exports.runtime = __webpack_require__(8);
	module.exports.lib = lib;
	module.exports.nodes = __webpack_require__(3);

	module.exports.installJinjaCompat = __webpack_require__(15);

	// A single instance of an environment, since this is so commonly used

	var e;
	module.exports.configure = function(templatesPath, opts) {
	    opts = opts || {};
	    if(lib.isObject(templatesPath)) {
	        opts = templatesPath;
	        templatesPath = null;
	    }

	    var TemplateLoader;
	    if(loaders.FileSystemLoader) {
	        TemplateLoader = new loaders.FileSystemLoader(templatesPath, {
	            watch: opts.watch,
	            noCache: opts.noCache
	        });
	    }
	    else if(loaders.WebLoader) {
	        TemplateLoader = new loaders.WebLoader(templatesPath, {
	            useCache: opts.web && opts.web.useCache,
	            async: opts.web && opts.web.async
	        });
	    }

	    e = new env.Environment(TemplateLoader, opts);

	    if(opts && opts.express) {
	        e.express(opts.express);
	    }

	    return e;
	};

	module.exports.compile = function(src, env, path, eagerCompile) {
	    if(!e) {
	        module.exports.configure();
	    }
	    return new module.exports.Template(src, env, path, eagerCompile);
	};

	module.exports.render = function(name, ctx, cb) {
	    if(!e) {
	        module.exports.configure();
	    }

	    return e.render(name, ctx, cb);
	};

	module.exports.renderString = function(src, ctx, cb) {
	    if(!e) {
	        module.exports.configure();
	    }

	    return e.renderString(src, ctx, cb);
	};

	if(precompile) {
	    module.exports.precompile = precompile.precompile;
	    module.exports.precompileString = precompile.precompileString;
	}


/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	var ArrayProto = Array.prototype;
	var ObjProto = Object.prototype;

	var escapeMap = {
	    '&': '&amp;',
	    '"': '&quot;',
	    '\'': '&#39;',
	    '<': '&lt;',
	    '>': '&gt;'
	};

	var escapeRegex = /[&"'<>]/g;

	var lookupEscape = function(ch) {
	    return escapeMap[ch];
	};

	var exports = module.exports = {};

	exports.prettifyError = function(path, withInternals, err) {
	    // jshint -W022
	    // http://jslinterrors.com/do-not-assign-to-the-exception-parameter
	    if (!err.Update) {
	        // not one of ours, cast it
	        err = new exports.TemplateError(err);
	    }
	    err.Update(path);

	    // Unless they marked the dev flag, show them a trace from here
	    if (!withInternals) {
	        var old = err;
	        err = new Error(old.message);
	        err.name = old.name;
	    }

	    return err;
	};

	exports.TemplateError = function(message, lineno, colno) {
	    var err = this;

	    if (message instanceof Error) { // for casting regular js errors
	        err = message;
	        message = message.name + ': ' + message.message;

	        try {
	            if(err.name = '') {}
	        }
	        catch(e) {
	            // If we can't set the name of the error object in this
	            // environment, don't use it
	            err = this;
	        }
	    } else {
	        if(Error.captureStackTrace) {
	            Error.captureStackTrace(err);
	        }
	    }

	    err.name = 'Template render error';
	    err.message = message;
	    err.lineno = lineno;
	    err.colno = colno;
	    err.firstUpdate = true;

	    err.Update = function(path) {
	        var message = '(' + (path || 'unknown path') + ')';

	        // only show lineno + colno next to path of template
	        // where error occurred
	        if (this.firstUpdate) {
	            if(this.lineno && this.colno) {
	                message += ' [Line ' + this.lineno + ', Column ' + this.colno + ']';
	            }
	            else if(this.lineno) {
	                message += ' [Line ' + this.lineno + ']';
	            }
	        }

	        message += '\n ';
	        if (this.firstUpdate) {
	            message += ' ';
	        }

	        this.message = message + (this.message || '');
	        this.firstUpdate = false;
	        return this;
	    };

	    return err;
	};

	exports.TemplateError.prototype = Error.prototype;

	exports.escape = function(val) {
	  return val.replace(escapeRegex, lookupEscape);
	};

	exports.isFunction = function(obj) {
	    return ObjProto.toString.call(obj) === '[object Function]';
	};

	exports.isArray = Array.isArray || function(obj) {
	    return ObjProto.toString.call(obj) === '[object Array]';
	};

	exports.isString = function(obj) {
	    return ObjProto.toString.call(obj) === '[object String]';
	};

	exports.isObject = function(obj) {
	    return ObjProto.toString.call(obj) === '[object Object]';
	};

	exports.groupBy = function(obj, val) {
	    var result = {};
	    var iterator = exports.isFunction(val) ? val : function(obj) { return obj[val]; };
	    for(var i=0; i<obj.length; i++) {
	        var value = obj[i];
	        var key = iterator(value, i);
	        (result[key] || (result[key] = [])).push(value);
	    }
	    return result;
	};

	exports.toArray = function(obj) {
	    return Array.prototype.slice.call(obj);
	};

	exports.without = function(array) {
	    var result = [];
	    if (!array) {
	        return result;
	    }
	    var index = -1,
	    length = array.length,
	    contains = exports.toArray(arguments).slice(1);

	    while(++index < length) {
	        if(exports.indexOf(contains, array[index]) === -1) {
	            result.push(array[index]);
	        }
	    }
	    return result;
	};

	exports.extend = function(obj, obj2) {
	    for(var k in obj2) {
	        obj[k] = obj2[k];
	    }
	    return obj;
	};

	exports.repeat = function(char_, n) {
	    var str = '';
	    for(var i=0; i<n; i++) {
	        str += char_;
	    }
	    return str;
	};

	exports.each = function(obj, func, context) {
	    if(obj == null) {
	        return;
	    }

	    if(ArrayProto.each && obj.each === ArrayProto.each) {
	        obj.forEach(func, context);
	    }
	    else if(obj.length === +obj.length) {
	        for(var i=0, l=obj.length; i<l; i++) {
	            func.call(context, obj[i], i, obj);
	        }
	    }
	};

	exports.map = function(obj, func) {
	    var results = [];
	    if(obj == null) {
	        return results;
	    }

	    if(ArrayProto.map && obj.map === ArrayProto.map) {
	        return obj.map(func);
	    }

	    for(var i=0; i<obj.length; i++) {
	        results[results.length] = func(obj[i], i);
	    }

	    if(obj.length === +obj.length) {
	        results.length = obj.length;
	    }

	    return results;
	};

	exports.asyncIter = function(arr, iter, cb) {
	    var i = -1;

	    function next() {
	        i++;

	        if(i < arr.length) {
	            iter(arr[i], i, next, cb);
	        }
	        else {
	            cb();
	        }
	    }

	    next();
	};

	exports.asyncFor = function(obj, iter, cb) {
	    var keys = exports.keys(obj);
	    var len = keys.length;
	    var i = -1;

	    function next() {
	        i++;
	        var k = keys[i];

	        if(i < len) {
	            iter(k, obj[k], i, len, next);
	        }
	        else {
	            cb();
	        }
	    }

	    next();
	};

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf#Polyfill
	exports.indexOf = Array.prototype.indexOf ?
	    function (arr, searchElement, fromIndex) {
	        return Array.prototype.indexOf.call(arr, searchElement, fromIndex);
	    } :
	    function (arr, searchElement, fromIndex) {
	        var length = this.length >>> 0; // Hack to convert object.length to a UInt32

	        fromIndex = +fromIndex || 0;

	        if(Math.abs(fromIndex) === Infinity) {
	            fromIndex = 0;
	        }

	        if(fromIndex < 0) {
	            fromIndex += length;
	            if (fromIndex < 0) {
	                fromIndex = 0;
	            }
	        }

	        for(;fromIndex < length; fromIndex++) {
	            if (arr[fromIndex] === searchElement) {
	                return fromIndex;
	            }
	        }

	        return -1;
	    };

	if(!Array.prototype.map) {
	    Array.prototype.map = function() {
	        throw new Error('map is unimplemented for this js engine');
	    };
	}

	exports.keys = function(obj) {
	    if(Object.prototype.keys) {
	        return obj.keys();
	    }
	    else {
	        var keys = [];
	        for(var k in obj) {
	            if(obj.hasOwnProperty(k)) {
	                keys.push(k);
	            }
	        }
	        return keys;
	    }
	};

	exports.inOperator = function (key, val) {
	    if (exports.isArray(val)) {
	        return exports.indexOf(val, key) !== -1;
	    } else if (exports.isObject(val)) {
	        return key in val;
	    } else if (exports.isString(val)) {
	        return val.indexOf(key) !== -1;
	    } else {
	        throw new Error('Cannot use "in" operator to search for "'
	            + key + '" in unexpected types.');
	    }
	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var path = __webpack_require__(3);
	var asap = __webpack_require__(4);
	var lib = __webpack_require__(1);
	var Obj = __webpack_require__(6);
	var compiler = __webpack_require__(3);
	var builtin_filters = __webpack_require__(7);
	var builtin_loaders = __webpack_require__(3);
	var runtime = __webpack_require__(8);
	var globals = __webpack_require__(9);
	var waterfall = __webpack_require__(10);
	var Frame = runtime.Frame;
	var Template;

	// Unconditionally load in this loader, even if no other ones are
	// included (possible in the slim browser build)
	builtin_loaders.PrecompiledLoader = __webpack_require__(13);

	// If the user is using the async API, *always* call it
	// asynchronously even if the template was synchronous.
	function callbackAsap(cb, err, res) {
	    asap(function() { cb(err, res); });
	}

	var Environment = Obj.extend({
	    init: function(loaders, opts) {
	        // The dev flag determines the trace that'll be shown on errors.
	        // If set to true, returns the full trace from the error point,
	        // otherwise will return trace starting from Template.render
	        // (the full trace from within nunjucks may confuse developers using
	        //  the library)
	        // defaults to false
	        opts = this.opts = opts || {};
	        this.opts.dev = !!opts.dev;

	        // The autoescape flag sets global autoescaping. If true,
	        // every string variable will be escaped by default.
	        // If false, strings can be manually escaped using the `escape` filter.
	        // defaults to true
	        this.opts.autoescape = opts.autoescape != null ? opts.autoescape : true;

	        // If true, this will make the system throw errors if trying
	        // to output a null or undefined value
	        this.opts.throwOnUndefined = !!opts.throwOnUndefined;
	        this.opts.trimBlocks = !!opts.trimBlocks;
	        this.opts.lstripBlocks = !!opts.lstripBlocks;

	        this.loaders = [];

	        if(!loaders) {
	            // The filesystem loader is only available server-side
	            if(builtin_loaders.FileSystemLoader) {
	                this.loaders = [new builtin_loaders.FileSystemLoader('views')];
	            }
	            else if(builtin_loaders.WebLoader) {
	                this.loaders = [new builtin_loaders.WebLoader('/views')];
	            }
	        }
	        else {
	            this.loaders = lib.isArray(loaders) ? loaders : [loaders];
	        }

	        // It's easy to use precompiled templates: just include them
	        // before you configure nunjucks and this will automatically
	        // pick it up and use it
	        if((true) && window.nunjucksPrecompiled) {
	            this.loaders.unshift(
	                new builtin_loaders.PrecompiledLoader(window.nunjucksPrecompiled)
	            );
	        }

	        this.initCache();

	        this.globals = globals();
	        this.filters = {};
	        this.asyncFilters = [];
	        this.extensions = {};
	        this.extensionsList = [];

	        for(var name in builtin_filters) {
	            this.addFilter(name, builtin_filters[name]);
	        }
	    },

	    initCache: function() {
	        // Caching and cache busting
	        lib.each(this.loaders, function(loader) {
	            loader.cache = {};

	            if(typeof loader.on === 'function') {
	                loader.on('update', function(template) {
	                    loader.cache[template] = null;
	                });
	            }
	        });
	    },

	    addExtension: function(name, extension) {
	        extension._name = name;
	        this.extensions[name] = extension;
	        this.extensionsList.push(extension);
	        return this;
	    },

	    removeExtension: function(name) {
	        var extension = this.getExtension(name);
	        if (!extension) return;

	        this.extensionsList = lib.without(this.extensionsList, extension);
	        delete this.extensions[name];
	    },

	    getExtension: function(name) {
	        return this.extensions[name];
	    },

	    hasExtension: function(name) {
	        return !!this.extensions[name];
	    },

	    addGlobal: function(name, value) {
	        this.globals[name] = value;
	        return this;
	    },

	    getGlobal: function(name) {
	        if(typeof this.globals[name] === 'undefined') {
	            throw new Error('global not found: ' + name);
	        }
	        return this.globals[name];
	    },

	    addFilter: function(name, func, async) {
	        var wrapped = func;

	        if(async) {
	            this.asyncFilters.push(name);
	        }
	        this.filters[name] = wrapped;
	        return this;
	    },

	    getFilter: function(name) {
	        if(!this.filters[name]) {
	            throw new Error('filter not found: ' + name);
	        }
	        return this.filters[name];
	    },

	    resolveTemplate: function(loader, parentName, filename) {
	        var isRelative = (loader.isRelative && parentName)? loader.isRelative(filename) : false;
	        return (isRelative && loader.resolve)? loader.resolve(parentName, filename) : filename;
	    },

	    getTemplate: function(name, eagerCompile, parentName, ignoreMissing, cb) {
	        var that = this;
	        var tmpl = null;
	        if(name && name.raw) {
	            // this fixes autoescape for templates referenced in symbols
	            name = name.raw;
	        }

	        if(lib.isFunction(parentName)) {
	            cb = parentName;
	            parentName = null;
	            eagerCompile = eagerCompile || false;
	        }

	        if(lib.isFunction(eagerCompile)) {
	            cb = eagerCompile;
	            eagerCompile = false;
	        }

	        if (name instanceof Template) {
	             tmpl = name;
	        }
	        else if(typeof name !== 'string') {
	            throw new Error('template names must be a string: ' + name);
	        }
	        else {
	            for (var i = 0; i < this.loaders.length; i++) {
	                var _name = this.resolveTemplate(this.loaders[i], parentName, name);
	                tmpl = this.loaders[i].cache[_name];
	                if (tmpl) break;
	            }
	        }

	        if(tmpl) {
	            if(eagerCompile) {
	                tmpl.compile();
	            }

	            if(cb) {
	                cb(null, tmpl);
	            }
	            else {
	                return tmpl;
	            }
	        } else {
	            var syncResult;
	            var _this = this;

	            var createTemplate = function(err, info) {
	                if(!info && !err) {
	                    if(!ignoreMissing) {
	                        err = new Error('template not found: ' + name);
	                    }
	                }

	                if (err) {
	                    if(cb) {
	                        cb(err);
	                    }
	                    else {
	                        throw err;
	                    }
	                }
	                else {
	                    var tmpl;
	                    if(info) {
	                        tmpl = new Template(info.src, _this,
	                                            info.path, eagerCompile);

	                        if(!info.noCache) {
	                            info.loader.cache[name] = tmpl;
	                        }
	                    }
	                    else {
	                        tmpl = new Template('', _this,
	                                            '', eagerCompile);
	                    }

	                    if(cb) {
	                        cb(null, tmpl);
	                    }
	                    else {
	                        syncResult = tmpl;
	                    }
	                }
	            };

	            lib.asyncIter(this.loaders, function(loader, i, next, done) {
	                function handle(err, src) {
	                    if(err) {
	                        done(err);
	                    }
	                    else if(src) {
	                        src.loader = loader;
	                        done(null, src);
	                    }
	                    else {
	                        next();
	                    }
	                }

	                // Resolve name relative to parentName
	                name = that.resolveTemplate(loader, parentName, name);

	                if(loader.async) {
	                    loader.getSource(name, handle);
	                }
	                else {
	                    handle(null, loader.getSource(name));
	                }
	            }, createTemplate);

	            return syncResult;
	        }
	    },

	    express: function(app) {
	        var env = this;

	        function NunjucksView(name, opts) {
	            this.name          = name;
	            this.path          = name;
	            this.defaultEngine = opts.defaultEngine;
	            this.ext           = path.extname(name);
	            if (!this.ext && !this.defaultEngine) throw new Error('No default engine was specified and no extension was provided.');
	            if (!this.ext) this.name += (this.ext = ('.' !== this.defaultEngine[0] ? '.' : '') + this.defaultEngine);
	        }

	        NunjucksView.prototype.render = function(opts, cb) {
	          env.render(this.name, opts, cb);
	        };

	        app.set('view', NunjucksView);
	        app.set('nunjucksEnv', this);
	        return this;
	    },

	    render: function(name, ctx, cb) {
	        if(lib.isFunction(ctx)) {
	            cb = ctx;
	            ctx = null;
	        }

	        // We support a synchronous API to make it easier to migrate
	        // existing code to async. This works because if you don't do
	        // anything async work, the whole thing is actually run
	        // synchronously.
	        var syncResult = null;

	        this.getTemplate(name, function(err, tmpl) {
	            if(err && cb) {
	                callbackAsap(cb, err);
	            }
	            else if(err) {
	                throw err;
	            }
	            else {
	                syncResult = tmpl.render(ctx, cb);
	            }
	        });

	        return syncResult;
	    },

	    renderString: function(src, ctx, opts, cb) {
	        if(lib.isFunction(opts)) {
	            cb = opts;
	            opts = {};
	        }
	        opts = opts || {};

	        var tmpl = new Template(src, this, opts.path);
	        return tmpl.render(ctx, cb);
	    },

	    waterfall: waterfall
	});

	var Context = Obj.extend({
	    init: function(ctx, blocks, env) {
	        // Has to be tied to an environment so we can tap into its globals.
	        this.env = env || new Environment();

	        // Make a duplicate of ctx
	        this.ctx = {};
	        for(var k in ctx) {
	            if(ctx.hasOwnProperty(k)) {
	                this.ctx[k] = ctx[k];
	            }
	        }

	        this.blocks = {};
	        this.exported = [];

	        for(var name in blocks) {
	            this.addBlock(name, blocks[name]);
	        }
	    },

	    lookup: function(name) {
	        // This is one of the most called functions, so optimize for
	        // the typical case where the name isn't in the globals
	        if(name in this.env.globals && !(name in this.ctx)) {
	            return this.env.globals[name];
	        }
	        else {
	            return this.ctx[name];
	        }
	    },

	    setVariable: function(name, val) {
	        this.ctx[name] = val;
	    },

	    getVariables: function() {
	        return this.ctx;
	    },

	    addBlock: function(name, block) {
	        this.blocks[name] = this.blocks[name] || [];
	        this.blocks[name].push(block);
	        return this;
	    },

	    getBlock: function(name) {
	        if(!this.blocks[name]) {
	            throw new Error('unknown block "' + name + '"');
	        }

	        return this.blocks[name][0];
	    },

	    getSuper: function(env, name, block, frame, runtime, cb) {
	        var idx = lib.indexOf(this.blocks[name] || [], block);
	        var blk = this.blocks[name][idx + 1];
	        var context = this;

	        if(idx === -1 || !blk) {
	            throw new Error('no super block available for "' + name + '"');
	        }

	        blk(env, context, frame, runtime, cb);
	    },

	    addExport: function(name) {
	        this.exported.push(name);
	    },

	    getExported: function() {
	        var exported = {};
	        for(var i=0; i<this.exported.length; i++) {
	            var name = this.exported[i];
	            exported[name] = this.ctx[name];
	        }
	        return exported;
	    }
	});

	Template = Obj.extend({
	    init: function (src, env, path, eagerCompile) {
	        this.env = env || new Environment();

	        if(lib.isObject(src)) {
	            switch(src.type) {
	            case 'code': this.tmplProps = src.obj; break;
	            case 'string': this.tmplStr = src.obj; break;
	            }
	        }
	        else if(lib.isString(src)) {
	            this.tmplStr = src;
	        }
	        else {
	            throw new Error('src must be a string or an object describing ' +
	                            'the source');
	        }

	        this.path = path;

	        if(eagerCompile) {
	            var _this = this;
	            try {
	                _this._compile();
	            }
	            catch(err) {
	                throw lib.prettifyError(this.path, this.env.opts.dev, err);
	            }
	        }
	        else {
	            this.compiled = false;
	        }
	    },

	    render: function(ctx, parentFrame, cb) {
	        if (typeof ctx === 'function') {
	            cb = ctx;
	            ctx = {};
	        }
	        else if (typeof parentFrame === 'function') {
	            cb = parentFrame;
	            parentFrame = null;
	        }

	        var forceAsync = true;
	        if(parentFrame) {
	            // If there is a frame, we are being called from internal
	            // code of another template, and the internal system
	            // depends on the sync/async nature of the parent template
	            // to be inherited, so force an async callback
	            forceAsync = false;
	        }

	        var _this = this;
	        // Catch compile errors for async rendering
	        try {
	            _this.compile();
	        } catch (_err) {
	            var err = lib.prettifyError(this.path, this.env.opts.dev, _err);
	            if (cb) return callbackAsap(cb, err);
	            else throw err;
	        }

	        var context = new Context(ctx || {}, _this.blocks, _this.env);
	        var frame = parentFrame ? parentFrame.push(true) : new Frame();
	        frame.topLevel = true;
	        var syncResult = null;

	        _this.rootRenderFunc(
	            _this.env,
	            context,
	            frame || new Frame(),
	            runtime,
	            function(err, res) {
	                if(err) {
	                    err = lib.prettifyError(_this.path, _this.env.opts.dev, err);
	                }

	                if(cb) {
	                    if(forceAsync) {
	                        callbackAsap(cb, err, res);
	                    }
	                    else {
	                        cb(err, res);
	                    }
	                }
	                else {
	                    if(err) { throw err; }
	                    syncResult = res;
	                }
	            }
	        );

	        return syncResult;
	    },


	    getExported: function(ctx, parentFrame, cb) {
	        if (typeof ctx === 'function') {
	            cb = ctx;
	            ctx = {};
	        }

	        if (typeof parentFrame === 'function') {
	            cb = parentFrame;
	            parentFrame = null;
	        }

	        // Catch compile errors for async rendering
	        try {
	            this.compile();
	        } catch (e) {
	            if (cb) return cb(e);
	            else throw e;
	        }

	        var frame = parentFrame ? parentFrame.push() : new Frame();
	        frame.topLevel = true;

	        // Run the rootRenderFunc to populate the context with exported vars
	        var context = new Context(ctx || {}, this.blocks, this.env);
	        this.rootRenderFunc(this.env,
	                            context,
	                            frame,
	                            runtime,
	                            function(err) {
	        		        if ( err ) {
	        			    cb(err, null);
	        		        } else {
	        			    cb(null, context.getExported());
	        		        }
	                            });
	    },

	    compile: function() {
	        if(!this.compiled) {
	            this._compile();
	        }
	    },

	    _compile: function() {
	        var props;

	        if(this.tmplProps) {
	            props = this.tmplProps;
	        }
	        else {
	            var source = compiler.compile(this.tmplStr,
	                                          this.env.asyncFilters,
	                                          this.env.extensionsList,
	                                          this.path,
	                                          this.env.opts);

	            /* jslint evil: true */
	            var func = new Function(source);
	            props = func();
	        }

	        this.blocks = this._getBlocks(props);
	        this.rootRenderFunc = props.root;
	        this.compiled = true;
	    },

	    _getBlocks: function(props) {
	        var blocks = {};

	        for(var k in props) {
	            if(k.slice(0, 2) === 'b_') {
	                blocks[k.slice(2)] = props[k];
	            }
	        }

	        return blocks;
	    }
	});

	module.exports = {
	    Environment: Environment,
	    Template: Template
	};


/***/ },
/* 3 */
/***/ function(module, exports) {

	

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	// rawAsap provides everything we need except exception management.
	var rawAsap = __webpack_require__(5);
	// RawTasks are recycled to reduce GC churn.
	var freeTasks = [];
	// We queue errors to ensure they are thrown in right order (FIFO).
	// Array-as-queue is good enough here, since we are just dealing with exceptions.
	var pendingErrors = [];
	var requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);

	function throwFirstError() {
	    if (pendingErrors.length) {
	        throw pendingErrors.shift();
	    }
	}

	/**
	 * Calls a task as soon as possible after returning, in its own event, with priority
	 * over other events like animation, reflow, and repaint. An error thrown from an
	 * event will not interrupt, nor even substantially slow down the processing of
	 * other events, but will be rather postponed to a lower priority event.
	 * @param {{call}} task A callable object, typically a function that takes no
	 * arguments.
	 */
	module.exports = asap;
	function asap(task) {
	    var rawTask;
	    if (freeTasks.length) {
	        rawTask = freeTasks.pop();
	    } else {
	        rawTask = new RawTask();
	    }
	    rawTask.task = task;
	    rawAsap(rawTask);
	}

	// We wrap tasks with recyclable task objects.  A task object implements
	// `call`, just like a function.
	function RawTask() {
	    this.task = null;
	}

	// The sole purpose of wrapping the task is to catch the exception and recycle
	// the task object after its single use.
	RawTask.prototype.call = function () {
	    try {
	        this.task.call();
	    } catch (error) {
	        if (asap.onerror) {
	            // This hook exists purely for testing purposes.
	            // Its name will be periodically randomized to break any code that
	            // depends on its existence.
	            asap.onerror(error);
	        } else {
	            // In a web browser, exceptions are not fatal. However, to avoid
	            // slowing down the queue of pending tasks, we rethrow the error in a
	            // lower priority turn.
	            pendingErrors.push(error);
	            requestErrorThrow();
	        }
	    } finally {
	        this.task = null;
	        freeTasks[freeTasks.length] = this;
	    }
	};


/***/ },
/* 5 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {"use strict";

	// Use the fastest means possible to execute a task in its own turn, with
	// priority over other events including IO, animation, reflow, and redraw
	// events in browsers.
	//
	// An exception thrown by a task will permanently interrupt the processing of
	// subsequent tasks. The higher level `asap` function ensures that if an
	// exception is thrown by a task, that the task queue will continue flushing as
	// soon as possible, but if you use `rawAsap` directly, you are responsible to
	// either ensure that no exceptions are thrown from your task, or to manually
	// call `rawAsap.requestFlush` if an exception is thrown.
	module.exports = rawAsap;
	function rawAsap(task) {
	    if (!queue.length) {
	        requestFlush();
	        flushing = true;
	    }
	    // Equivalent to push, but avoids a function call.
	    queue[queue.length] = task;
	}

	var queue = [];
	// Once a flush has been requested, no further calls to `requestFlush` are
	// necessary until the next `flush` completes.
	var flushing = false;
	// `requestFlush` is an implementation-specific method that attempts to kick
	// off a `flush` event as quickly as possible. `flush` will attempt to exhaust
	// the event queue before yielding to the browser's own event loop.
	var requestFlush;
	// The position of the next task to execute in the task queue. This is
	// preserved between calls to `flush` so that it can be resumed if
	// a task throws an exception.
	var index = 0;
	// If a task schedules additional tasks recursively, the task queue can grow
	// unbounded. To prevent memory exhaustion, the task queue will periodically
	// truncate already-completed tasks.
	var capacity = 1024;

	// The flush function processes all tasks that have been scheduled with
	// `rawAsap` unless and until one of those tasks throws an exception.
	// If a task throws an exception, `flush` ensures that its state will remain
	// consistent and will resume where it left off when called again.
	// However, `flush` does not make any arrangements to be called again if an
	// exception is thrown.
	function flush() {
	    while (index < queue.length) {
	        var currentIndex = index;
	        // Advance the index before calling the task. This ensures that we will
	        // begin flushing on the next task the task throws an error.
	        index = index + 1;
	        queue[currentIndex].call();
	        // Prevent leaking memory for long chains of recursive calls to `asap`.
	        // If we call `asap` within tasks scheduled by `asap`, the queue will
	        // grow, but to avoid an O(n) walk for every task we execute, we don't
	        // shift tasks off the queue after they have been executed.
	        // Instead, we periodically shift 1024 tasks off the queue.
	        if (index > capacity) {
	            // Manually shift all values starting at the index back to the
	            // beginning of the queue.
	            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
	                queue[scan] = queue[scan + index];
	            }
	            queue.length -= index;
	            index = 0;
	        }
	    }
	    queue.length = 0;
	    index = 0;
	    flushing = false;
	}

	// `requestFlush` is implemented using a strategy based on data collected from
	// every available SauceLabs Selenium web driver worker at time of writing.
	// https://docs.google.com/spreadsheets/d/1mG-5UYGup5qxGdEMWkhP6BWCz053NUb2E1QoUTU16uA/edit#gid=783724593

	// Safari 6 and 6.1 for desktop, iPad, and iPhone are the only browsers that
	// have WebKitMutationObserver but not un-prefixed MutationObserver.
	// Must use `global` instead of `window` to work in both frames and web
	// workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.
	var BrowserMutationObserver = global.MutationObserver || global.WebKitMutationObserver;

	// MutationObservers are desirable because they have high priority and work
	// reliably everywhere they are implemented.
	// They are implemented in all modern browsers.
	//
	// - Android 4-4.3
	// - Chrome 26-34
	// - Firefox 14-29
	// - Internet Explorer 11
	// - iPad Safari 6-7.1
	// - iPhone Safari 7-7.1
	// - Safari 6-7
	if (typeof BrowserMutationObserver === "function") {
	    requestFlush = makeRequestCallFromMutationObserver(flush);

	// MessageChannels are desirable because they give direct access to the HTML
	// task queue, are implemented in Internet Explorer 10, Safari 5.0-1, and Opera
	// 11-12, and in web workers in many engines.
	// Although message channels yield to any queued rendering and IO tasks, they
	// would be better than imposing the 4ms delay of timers.
	// However, they do not work reliably in Internet Explorer or Safari.

	// Internet Explorer 10 is the only browser that has setImmediate but does
	// not have MutationObservers.
	// Although setImmediate yields to the browser's renderer, it would be
	// preferrable to falling back to setTimeout since it does not have
	// the minimum 4ms penalty.
	// Unfortunately there appears to be a bug in Internet Explorer 10 Mobile (and
	// Desktop to a lesser extent) that renders both setImmediate and
	// MessageChannel useless for the purposes of ASAP.
	// https://github.com/kriskowal/q/issues/396

	// Timers are implemented universally.
	// We fall back to timers in workers in most engines, and in foreground
	// contexts in the following browsers.
	// However, note that even this simple case requires nuances to operate in a
	// broad spectrum of browsers.
	//
	// - Firefox 3-13
	// - Internet Explorer 6-9
	// - iPad Safari 4.3
	// - Lynx 2.8.7
	} else {
	    requestFlush = makeRequestCallFromTimer(flush);
	}

	// `requestFlush` requests that the high priority event queue be flushed as
	// soon as possible.
	// This is useful to prevent an error thrown in a task from stalling the event
	// queue if the exception handled by Node.js’s
	// `process.on("uncaughtException")` or by a domain.
	rawAsap.requestFlush = requestFlush;

	// To request a high priority event, we induce a mutation observer by toggling
	// the text of a text node between "1" and "-1".
	function makeRequestCallFromMutationObserver(callback) {
	    var toggle = 1;
	    var observer = new BrowserMutationObserver(callback);
	    var node = document.createTextNode("");
	    observer.observe(node, {characterData: true});
	    return function requestCall() {
	        toggle = -toggle;
	        node.data = toggle;
	    };
	}

	// The message channel technique was discovered by Malte Ubl and was the
	// original foundation for this library.
	// http://www.nonblocking.io/2011/06/windownexttick.html

	// Safari 6.0.5 (at least) intermittently fails to create message ports on a
	// page's first load. Thankfully, this version of Safari supports
	// MutationObservers, so we don't need to fall back in that case.

	// function makeRequestCallFromMessageChannel(callback) {
	//     var channel = new MessageChannel();
	//     channel.port1.onmessage = callback;
	//     return function requestCall() {
	//         channel.port2.postMessage(0);
	//     };
	// }

	// For reasons explained above, we are also unable to use `setImmediate`
	// under any circumstances.
	// Even if we were, there is another bug in Internet Explorer 10.
	// It is not sufficient to assign `setImmediate` to `requestFlush` because
	// `setImmediate` must be called *by name* and therefore must be wrapped in a
	// closure.
	// Never forget.

	// function makeRequestCallFromSetImmediate(callback) {
	//     return function requestCall() {
	//         setImmediate(callback);
	//     };
	// }

	// Safari 6.0 has a problem where timers will get lost while the user is
	// scrolling. This problem does not impact ASAP because Safari 6.0 supports
	// mutation observers, so that implementation is used instead.
	// However, if we ever elect to use timers in Safari, the prevalent work-around
	// is to add a scroll event listener that calls for a flush.

	// `setTimeout` does not call the passed callback if the delay is less than
	// approximately 7 in web workers in Firefox 8 through 18, and sometimes not
	// even then.

	function makeRequestCallFromTimer(callback) {
	    return function requestCall() {
	        // We dispatch a timeout with a specified delay of 0 for engines that
	        // can reliably accommodate that request. This will usually be snapped
	        // to a 4 milisecond delay, but once we're flushing, there's no delay
	        // between events.
	        var timeoutHandle = setTimeout(handleTimer, 0);
	        // However, since this timer gets frequently dropped in Firefox
	        // workers, we enlist an interval handle that will try to fire
	        // an event 20 times per second until it succeeds.
	        var intervalHandle = setInterval(handleTimer, 50);

	        function handleTimer() {
	            // Whichever timer succeeds will cancel both timers and
	            // execute the callback.
	            clearTimeout(timeoutHandle);
	            clearInterval(intervalHandle);
	            callback();
	        }
	    };
	}

	// This is for `asap.js` only.
	// Its name will be periodically randomized to break any code that depends on
	// its existence.
	rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;

	// ASAP was originally a nextTick shim included in Q. This was factored out
	// into this ASAP package. It was later adapted to RSVP which made further
	// amendments. These decisions, particularly to marginalize MessageChannel and
	// to capture the MutationObserver implementation in a closure, were integrated
	// back into ASAP proper.
	// https://github.com/tildeio/rsvp.js/blob/cddf7232546a9cf858524b75cde6f9edf72620a7/lib/rsvp/asap.js

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	// A simple class system, more documentation to come

	function extend(cls, name, props) {
	    // This does that same thing as Object.create, but with support for IE8
	    var F = function() {};
	    F.prototype = cls.prototype;
	    var prototype = new F();

	    // jshint undef: false
	    var fnTest = /xyz/.test(function(){ xyz; }) ? /\bparent\b/ : /.*/;
	    props = props || {};

	    for(var k in props) {
	        var src = props[k];
	        var parent = prototype[k];

	        if(typeof parent === 'function' &&
	           typeof src === 'function' &&
	           fnTest.test(src)) {
	            /*jshint -W083 */
	            prototype[k] = (function (src, parent) {
	                return function() {
	                    // Save the current parent method
	                    var tmp = this.parent;

	                    // Set parent to the previous method, call, and restore
	                    this.parent = parent;
	                    var res = src.apply(this, arguments);
	                    this.parent = tmp;

	                    return res;
	                };
	            })(src, parent);
	        }
	        else {
	            prototype[k] = src;
	        }
	    }

	    prototype.typename = name;

	    var new_cls = function() {
	        if(prototype.init) {
	            prototype.init.apply(this, arguments);
	        }
	    };

	    new_cls.prototype = prototype;
	    new_cls.prototype.constructor = new_cls;

	    new_cls.extend = function(name, props) {
	        if(typeof name === 'object') {
	            props = name;
	            name = 'anonymous';
	        }
	        return extend(new_cls, name, props);
	    };

	    return new_cls;
	}

	module.exports = extend(Object, 'Object', {});


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var lib = __webpack_require__(1);
	var r = __webpack_require__(8);

	function normalize(value, defaultValue) {
	    if(value === null || value === undefined || value === false) {
	        return defaultValue;
	    }
	    return value;
	}

	var filters = {
	    abs: function(n) {
	        return Math.abs(n);
	    },

	    batch: function(arr, linecount, fill_with) {
	        var i;
	        var res = [];
	        var tmp = [];

	        for(i = 0; i < arr.length; i++) {
	            if(i % linecount === 0 && tmp.length) {
	                res.push(tmp);
	                tmp = [];
	            }

	            tmp.push(arr[i]);
	        }

	        if(tmp.length) {
	            if(fill_with) {
	                for(i = tmp.length; i < linecount; i++) {
	                    tmp.push(fill_with);
	                }
	            }

	            res.push(tmp);
	        }

	        return res;
	    },

	    capitalize: function(str) {
	        str = normalize(str, '');
	        var ret = str.toLowerCase();
	        return r.copySafeness(str, ret.charAt(0).toUpperCase() + ret.slice(1));
	    },

	    center: function(str, width) {
	        str = normalize(str, '');
	        width = width || 80;

	        if(str.length >= width) {
	            return str;
	        }

	        var spaces = width - str.length;
	        var pre = lib.repeat(' ', spaces/2 - spaces % 2);
	        var post = lib.repeat(' ', spaces/2);
	        return r.copySafeness(str, pre + str + post);
	    },

	    'default': function(val, def, bool) {
	        if(bool) {
	            return val ? val : def;
	        }
	        else {
	            return (val !== undefined) ? val : def;
	        }
	    },

	    dictsort: function(val, case_sensitive, by) {
	        if (!lib.isObject(val)) {
	            throw new lib.TemplateError('dictsort filter: val must be an object');
	        }

	        var array = [];
	        for (var k in val) {
	            // deliberately include properties from the object's prototype
	            array.push([k,val[k]]);
	        }

	        var si;
	        if (by === undefined || by === 'key') {
	            si = 0;
	        } else if (by === 'value') {
	            si = 1;
	        } else {
	            throw new lib.TemplateError(
	                'dictsort filter: You can only sort by either key or value');
	        }

	        array.sort(function(t1, t2) {
	            var a = t1[si];
	            var b = t2[si];

	            if (!case_sensitive) {
	                if (lib.isString(a)) {
	                    a = a.toUpperCase();
	                }
	                if (lib.isString(b)) {
	                    b = b.toUpperCase();
	                }
	            }

	            return a > b ? 1 : (a === b ? 0 : -1);
	        });

	        return array;
	    },

	    dump: function(obj, spaces) {
	        return JSON.stringify(obj, null, spaces);
	    },

	    escape: function(str) {
	        if(str instanceof r.SafeString) {
	            return str;
	        }
	        str = (str === null || str === undefined) ? '' : str;
	        return r.markSafe(lib.escape(str.toString()));
	    },

	    safe: function(str) {
	        if (str instanceof r.SafeString) {
	            return str;
	        }
	        str = (str === null || str === undefined) ? '' : str;
	        return r.markSafe(str.toString());
	    },

	    first: function(arr) {
	        return arr[0];
	    },

	    groupby: function(arr, attr) {
	        return lib.groupBy(arr, attr);
	    },

	    indent: function(str, width, indentfirst) {
	        str = normalize(str, '');

	        if (str === '') return '';

	        width = width || 4;
	        var res = '';
	        var lines = str.split('\n');
	        var sp = lib.repeat(' ', width);

	        for(var i=0; i<lines.length; i++) {
	            if(i === 0 && !indentfirst) {
	                res += lines[i] + '\n';
	            }
	            else {
	                res += sp + lines[i] + '\n';
	            }
	        }

	        return r.copySafeness(str, res);
	    },

	    join: function(arr, del, attr) {
	        del = del || '';

	        if(attr) {
	            arr = lib.map(arr, function(v) {
	                return v[attr];
	            });
	        }

	        return arr.join(del);
	    },

	    last: function(arr) {
	        return arr[arr.length-1];
	    },

	    length: function(val) {
	        var value = normalize(val, '');

	        if(value !== undefined) {
	            if(
	                (typeof Map === 'function' && value instanceof Map) ||
	                (typeof Set === 'function' && value instanceof Set)
	            ) {
	                // ECMAScript 2015 Maps and Sets
	                return value.size;
	            }
	            if(lib.isObject(value) && !(value instanceof r.SafeString)) {
	                // Objects (besides SafeStrings), non-primative Arrays
	                return Object.keys(value).length;
	            }
	            return value.length;
	        }
	        return 0;
	    },

	    list: function(val) {
	        if(lib.isString(val)) {
	            return val.split('');
	        }
	        else if(lib.isObject(val)) {
	            var keys = [];

	            if(Object.keys) {
	                keys = Object.keys(val);
	            }
	            else {
	                for(var k in val) {
	                    keys.push(k);
	                }
	            }

	            return lib.map(keys, function(k) {
	                return { key: k,
	                         value: val[k] };
	            });
	        }
	        else if(lib.isArray(val)) {
	          return val;
	        }
	        else {
	            throw new lib.TemplateError('list filter: type not iterable');
	        }
	    },

	    lower: function(str) {
	        str = normalize(str, '');
	        return str.toLowerCase();
	    },

	    nl2br: function(str) {
	        if (str === null || str === undefined) {
	            return '';
	        }
	        return r.copySafeness(str, str.replace(/\r\n|\n/g, '<br />\n'));
	    },

	    random: function(arr) {
	        return arr[Math.floor(Math.random() * arr.length)];
	    },

	    rejectattr: function(arr, attr) {
	      return arr.filter(function (item) {
	        return !item[attr];
	      });
	    },

	    selectattr: function(arr, attr) {
	      return arr.filter(function (item) {
	        return !!item[attr];
	      });
	    },

	    replace: function(str, old, new_, maxCount) {
	        var originalStr = str;

	        if (old instanceof RegExp) {
	            return str.replace(old, new_);
	        }

	        if(typeof maxCount === 'undefined'){
	            maxCount = -1;
	        }

	        var res = '';  // Output

	        // Cast Numbers in the search term to string
	        if(typeof old === 'number'){
	            old = old + '';
	        }
	        else if(typeof old !== 'string') {
	            // If it is something other than number or string,
	            // return the original string
	            return str;
	        }

	        // Cast numbers in the replacement to string
	        if(typeof str === 'number'){
	            str = str + '';
	        }

	        // If by now, we don't have a string, throw it back
	        if(typeof str !== 'string' && !(str instanceof r.SafeString)){
	            return str;
	        }

	        // ShortCircuits
	        if(old === ''){
	            // Mimic the python behaviour: empty string is replaced
	            // by replacement e.g. "abc"|replace("", ".") -> .a.b.c.
	            res = new_ + str.split('').join(new_) + new_;
	            return r.copySafeness(str, res);
	        }

	        var nextIndex = str.indexOf(old);
	        // if # of replacements to perform is 0, or the string to does
	        // not contain the old value, return the string
	        if(maxCount === 0 || nextIndex === -1){
	            return str;
	        }

	        var pos = 0;
	        var count = 0; // # of replacements made

	        while(nextIndex  > -1 && (maxCount === -1 || count < maxCount)){
	            // Grab the next chunk of src string and add it with the
	            // replacement, to the result
	            res += str.substring(pos, nextIndex) + new_;
	            // Increment our pointer in the src string
	            pos = nextIndex + old.length;
	            count++;
	            // See if there are any more replacements to be made
	            nextIndex = str.indexOf(old, pos);
	        }

	        // We've either reached the end, or done the max # of
	        // replacements, tack on any remaining string
	        if(pos < str.length) {
	            res += str.substring(pos);
	        }

	        return r.copySafeness(originalStr, res);
	    },

	    reverse: function(val) {
	        var arr;
	        if(lib.isString(val)) {
	            arr = filters.list(val);
	        }
	        else {
	            // Copy it
	            arr = lib.map(val, function(v) { return v; });
	        }

	        arr.reverse();

	        if(lib.isString(val)) {
	            return r.copySafeness(val, arr.join(''));
	        }
	        return arr;
	    },

	    round: function(val, precision, method) {
	        precision = precision || 0;
	        var factor = Math.pow(10, precision);
	        var rounder;

	        if(method === 'ceil') {
	            rounder = Math.ceil;
	        }
	        else if(method === 'floor') {
	            rounder = Math.floor;
	        }
	        else {
	            rounder = Math.round;
	        }

	        return rounder(val * factor) / factor;
	    },

	    slice: function(arr, slices, fillWith) {
	        var sliceLength = Math.floor(arr.length / slices);
	        var extra = arr.length % slices;
	        var offset = 0;
	        var res = [];

	        for(var i=0; i<slices; i++) {
	            var start = offset + i * sliceLength;
	            if(i < extra) {
	                offset++;
	            }
	            var end = offset + (i + 1) * sliceLength;

	            var slice = arr.slice(start, end);
	            if(fillWith && i >= extra) {
	                slice.push(fillWith);
	            }
	            res.push(slice);
	        }

	        return res;
	    },

	    sum: function(arr, attr, start) {
	        var sum = 0;

	        if(typeof start === 'number'){
	            sum += start;
	        }

	        if(attr) {
	            arr = lib.map(arr, function(v) {
	                return v[attr];
	            });
	        }

	        for(var i = 0; i < arr.length; i++) {
	            sum += arr[i];
	        }

	        return sum;
	    },

	    sort: r.makeMacro(['value', 'reverse', 'case_sensitive', 'attribute'], [], function(arr, reverse, caseSens, attr) {
	         // Copy it
	        arr = lib.map(arr, function(v) { return v; });

	        arr.sort(function(a, b) {
	            var x, y;

	            if(attr) {
	                x = a[attr];
	                y = b[attr];
	            }
	            else {
	                x = a;
	                y = b;
	            }

	            if(!caseSens && lib.isString(x) && lib.isString(y)) {
	                x = x.toLowerCase();
	                y = y.toLowerCase();
	            }

	            if(x < y) {
	                return reverse ? 1 : -1;
	            }
	            else if(x > y) {
	                return reverse ? -1: 1;
	            }
	            else {
	                return 0;
	            }
	        });

	        return arr;
	    }),

	    string: function(obj) {
	        return r.copySafeness(obj, obj);
	    },

	    striptags: function(input, preserve_linebreaks) {
	        input = normalize(input, '');
	        preserve_linebreaks = preserve_linebreaks || false;
	        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>|<!--[\s\S]*?-->/gi;
	        var trimmedInput = filters.trim(input.replace(tags, ''));
	        var res = '';
	        if (preserve_linebreaks) {
	            res = trimmedInput
	                .replace(/^ +| +$/gm, '')     // remove leading and trailing spaces
	                .replace(/ +/g, ' ')          // squash adjacent spaces
	                .replace(/(\r\n)/g, '\n')     // normalize linebreaks (CRLF -> LF)
	                .replace(/\n\n\n+/g, '\n\n'); // squash abnormal adjacent linebreaks
	        } else {
	            res = trimmedInput.replace(/\s+/gi, ' ');
	        }
	        return r.copySafeness(input, res);
	    },

	    title: function(str) {
	        str = normalize(str, '');
	        var words = str.split(' ');
	        for(var i = 0; i < words.length; i++) {
	            words[i] = filters.capitalize(words[i]);
	        }
	        return r.copySafeness(str, words.join(' '));
	    },

	    trim: function(str) {
	        return r.copySafeness(str, str.replace(/^\s*|\s*$/g, ''));
	    },

	    truncate: function(input, length, killwords, end) {
	        var orig = input;
	        input = normalize(input, '');
	        length = length || 255;

	        if (input.length <= length)
	            return input;

	        if (killwords) {
	            input = input.substring(0, length);
	        } else {
	            var idx = input.lastIndexOf(' ', length);
	            if(idx === -1) {
	                idx = length;
	            }

	            input = input.substring(0, idx);
	        }

	        input += (end !== undefined && end !== null) ? end : '...';
	        return r.copySafeness(orig, input);
	    },

	    upper: function(str) {
	        str = normalize(str, '');
	        return str.toUpperCase();
	    },

	    urlencode: function(obj) {
	        var enc = encodeURIComponent;
	        if (lib.isString(obj)) {
	            return enc(obj);
	        } else {
	            var parts;
	            if (lib.isArray(obj)) {
	                parts = obj.map(function(item) {
	                    return enc(item[0]) + '=' + enc(item[1]);
	                });
	            } else {
	                parts = [];
	                for (var k in obj) {
	                    if (obj.hasOwnProperty(k)) {
	                        parts.push(enc(k) + '=' + enc(obj[k]));
	                    }
	                }
	            }
	            return parts.join('&');
	        }
	    },

	    urlize: function(str, length, nofollow) {
	        if (isNaN(length)) length = Infinity;

	        var noFollowAttr = (nofollow === true ? ' rel="nofollow"' : '');

	        // For the jinja regexp, see
	        // https://github.com/mitsuhiko/jinja2/blob/f15b814dcba6aa12bc74d1f7d0c881d55f7126be/jinja2/utils.py#L20-L23
	        var puncRE = /^(?:\(|<|&lt;)?(.*?)(?:\.|,|\)|\n|&gt;)?$/;
	        // from http://blog.gerv.net/2011/05/html5_email_address_regexp/
	        var emailRE = /^[\w.!#$%&'*+\-\/=?\^`{|}~]+@[a-z\d\-]+(\.[a-z\d\-]+)+$/i;
	        var httpHttpsRE = /^https?:\/\/.*$/;
	        var wwwRE = /^www\./;
	        var tldRE = /\.(?:org|net|com)(?:\:|\/|$)/;

	        var words = str.split(/(\s+)/).filter(function(word) {
	          // If the word has no length, bail. This can happen for str with
	          // trailing whitespace.
	          return word && word.length;
	        }).map(function(word) {
	          var matches = word.match(puncRE);
	          var possibleUrl = matches && matches[1] || word;

	          // url that starts with http or https
	          if (httpHttpsRE.test(possibleUrl))
	            return '<a href="' + possibleUrl + '"' + noFollowAttr + '>' + possibleUrl.substr(0, length) + '</a>';

	          // url that starts with www.
	          if (wwwRE.test(possibleUrl))
	            return '<a href="http://' + possibleUrl + '"' + noFollowAttr + '>' + possibleUrl.substr(0, length) + '</a>';

	          // an email address of the form username@domain.tld
	          if (emailRE.test(possibleUrl))
	            return '<a href="mailto:' + possibleUrl + '">' + possibleUrl + '</a>';

	          // url that ends in .com, .org or .net that is not an email address
	          if (tldRE.test(possibleUrl))
	            return '<a href="http://' + possibleUrl + '"' + noFollowAttr + '>' + possibleUrl.substr(0, length) + '</a>';

	          return word;

	        });

	        return words.join('');
	    },

	    wordcount: function(str) {
	        str = normalize(str, '');
	        var words = (str) ? str.match(/\w+/g) : null;
	        return (words) ? words.length : null;
	    },

	    'float': function(val, def) {
	        var res = parseFloat(val);
	        return isNaN(res) ? def : res;
	    },

	    'int': function(val, def) {
	        var res = parseInt(val, 10);
	        return isNaN(res) ? def : res;
	    }
	};

	// Aliases
	filters.d = filters['default'];
	filters.e = filters.escape;

	module.exports = filters;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var lib = __webpack_require__(1);
	var Obj = __webpack_require__(6);

	// Frames keep track of scoping both at compile-time and run-time so
	// we know how to access variables. Block tags can introduce special
	// variables, for example.
	var Frame = Obj.extend({
	    init: function(parent, isolateWrites) {
	        this.variables = {};
	        this.parent = parent;
	        this.topLevel = false;
	        // if this is true, writes (set) should never propagate upwards past
	        // this frame to its parent (though reads may).
	        this.isolateWrites = isolateWrites;
	    },

	    set: function(name, val, resolveUp) {
	        // Allow variables with dots by automatically creating the
	        // nested structure
	        var parts = name.split('.');
	        var obj = this.variables;
	        var frame = this;

	        if(resolveUp) {
	            if((frame = this.resolve(parts[0], true))) {
	                frame.set(name, val);
	                return;
	            }
	        }

	        for(var i=0; i<parts.length - 1; i++) {
	            var id = parts[i];

	            if(!obj[id]) {
	                obj[id] = {};
	            }
	            obj = obj[id];
	        }

	        obj[parts[parts.length - 1]] = val;
	    },

	    get: function(name) {
	        var val = this.variables[name];
	        if(val !== undefined) {
	            return val;
	        }
	        return null;
	    },

	    lookup: function(name) {
	        var p = this.parent;
	        var val = this.variables[name];
	        if(val !== undefined) {
	            return val;
	        }
	        return p && p.lookup(name);
	    },

	    resolve: function(name, forWrite) {
	        var p = (forWrite && this.isolateWrites) ? undefined : this.parent;
	        var val = this.variables[name];
	        if(val !== undefined) {
	            return this;
	        }
	        return p && p.resolve(name);
	    },

	    push: function(isolateWrites) {
	        return new Frame(this, isolateWrites);
	    },

	    pop: function() {
	        return this.parent;
	    }
	});

	function makeMacro(argNames, kwargNames, func) {
	    return function() {
	        var argCount = numArgs(arguments);
	        var args;
	        var kwargs = getKeywordArgs(arguments);
	        var i;

	        if(argCount > argNames.length) {
	            args = Array.prototype.slice.call(arguments, 0, argNames.length);

	            // Positional arguments that should be passed in as
	            // keyword arguments (essentially default values)
	            var vals = Array.prototype.slice.call(arguments, args.length, argCount);
	            for(i = 0; i < vals.length; i++) {
	                if(i < kwargNames.length) {
	                    kwargs[kwargNames[i]] = vals[i];
	                }
	            }

	            args.push(kwargs);
	        }
	        else if(argCount < argNames.length) {
	            args = Array.prototype.slice.call(arguments, 0, argCount);

	            for(i = argCount; i < argNames.length; i++) {
	                var arg = argNames[i];

	                // Keyword arguments that should be passed as
	                // positional arguments, i.e. the caller explicitly
	                // used the name of a positional arg
	                args.push(kwargs[arg]);
	                delete kwargs[arg];
	            }

	            args.push(kwargs);
	        }
	        else {
	            args = arguments;
	        }

	        return func.apply(this, args);
	    };
	}

	function makeKeywordArgs(obj) {
	    obj.__keywords = true;
	    return obj;
	}

	function getKeywordArgs(args) {
	    var len = args.length;
	    if(len) {
	        var lastArg = args[len - 1];
	        if(lastArg && lastArg.hasOwnProperty('__keywords')) {
	            return lastArg;
	        }
	    }
	    return {};
	}

	function numArgs(args) {
	    var len = args.length;
	    if(len === 0) {
	        return 0;
	    }

	    var lastArg = args[len - 1];
	    if(lastArg && lastArg.hasOwnProperty('__keywords')) {
	        return len - 1;
	    }
	    else {
	        return len;
	    }
	}

	// A SafeString object indicates that the string should not be
	// autoescaped. This happens magically because autoescaping only
	// occurs on primitive string objects.
	function SafeString(val) {
	    if(typeof val !== 'string') {
	        return val;
	    }

	    this.val = val;
	    this.length = val.length;
	}

	SafeString.prototype = Object.create(String.prototype, {
	    length: { writable: true, configurable: true, value: 0 }
	});
	SafeString.prototype.valueOf = function() {
	    return this.val;
	};
	SafeString.prototype.toString = function() {
	    return this.val;
	};

	function copySafeness(dest, target) {
	    if(dest instanceof SafeString) {
	        return new SafeString(target);
	    }
	    return target.toString();
	}

	function markSafe(val) {
	    var type = typeof val;

	    if(type === 'string') {
	        return new SafeString(val);
	    }
	    else if(type !== 'function') {
	        return val;
	    }
	    else {
	        return function() {
	            var ret = val.apply(this, arguments);

	            if(typeof ret === 'string') {
	                return new SafeString(ret);
	            }

	            return ret;
	        };
	    }
	}

	function suppressValue(val, autoescape) {
	    val = (val !== undefined && val !== null) ? val : '';

	    if(autoescape && !(val instanceof SafeString)) {
	        val = lib.escape(val.toString());
	    }

	    return val;
	}

	function ensureDefined(val, lineno, colno) {
	    if(val === null || val === undefined) {
	        throw new lib.TemplateError(
	            'attempted to output null or undefined value',
	            lineno + 1,
	            colno + 1
	        );
	    }
	    return val;
	}

	function memberLookup(obj, val) {
	    obj = obj || {};

	    if(typeof obj[val] === 'function') {
	        return function() {
	            return obj[val].apply(obj, arguments);
	        };
	    }

	    return obj[val];
	}

	function callWrap(obj, name, context, args) {
	    if(!obj) {
	        throw new Error('Unable to call `' + name + '`, which is undefined or falsey');
	    }
	    else if(typeof obj !== 'function') {
	        throw new Error('Unable to call `' + name + '`, which is not a function');
	    }

	    // jshint validthis: true
	    return obj.apply(context, args);
	}

	function contextOrFrameLookup(context, frame, name) {
	    var val = frame.lookup(name);
	    return (val !== undefined) ?
	        val :
	        context.lookup(name);
	}

	function handleError(error, lineno, colno) {
	    if(error.lineno) {
	        return error;
	    }
	    else {
	        return new lib.TemplateError(error, lineno, colno);
	    }
	}

	function asyncEach(arr, dimen, iter, cb) {
	    if(lib.isArray(arr)) {
	        var len = arr.length;

	        lib.asyncIter(arr, function(item, i, next) {
	            switch(dimen) {
	            case 1: iter(item, i, len, next); break;
	            case 2: iter(item[0], item[1], i, len, next); break;
	            case 3: iter(item[0], item[1], item[2], i, len, next); break;
	            default:
	                item.push(i, next);
	                iter.apply(this, item);
	            }
	        }, cb);
	    }
	    else {
	        lib.asyncFor(arr, function(key, val, i, len, next) {
	            iter(key, val, i, len, next);
	        }, cb);
	    }
	}

	function asyncAll(arr, dimen, func, cb) {
	    var finished = 0;
	    var len, i;
	    var outputArr;

	    function done(i, output) {
	        finished++;
	        outputArr[i] = output;

	        if(finished === len) {
	            cb(null, outputArr.join(''));
	        }
	    }

	    if(lib.isArray(arr)) {
	        len = arr.length;
	        outputArr = new Array(len);

	        if(len === 0) {
	            cb(null, '');
	        }
	        else {
	            for(i = 0; i < arr.length; i++) {
	                var item = arr[i];

	                switch(dimen) {
	                case 1: func(item, i, len, done); break;
	                case 2: func(item[0], item[1], i, len, done); break;
	                case 3: func(item[0], item[1], item[2], i, len, done); break;
	                default:
	                    item.push(i, done);
	                    // jshint validthis: true
	                    func.apply(this, item);
	                }
	            }
	        }
	    }
	    else {
	        var keys = lib.keys(arr);
	        len = keys.length;
	        outputArr = new Array(len);

	        if(len === 0) {
	            cb(null, '');
	        }
	        else {
	            for(i = 0; i < keys.length; i++) {
	                var k = keys[i];
	                func(k, arr[k], i, len, done);
	            }
	        }
	    }
	}

	module.exports = {
	    Frame: Frame,
	    makeMacro: makeMacro,
	    makeKeywordArgs: makeKeywordArgs,
	    numArgs: numArgs,
	    suppressValue: suppressValue,
	    ensureDefined: ensureDefined,
	    memberLookup: memberLookup,
	    contextOrFrameLookup: contextOrFrameLookup,
	    callWrap: callWrap,
	    handleError: handleError,
	    isArray: lib.isArray,
	    keys: lib.keys,
	    SafeString: SafeString,
	    copySafeness: copySafeness,
	    markSafe: markSafe,
	    asyncEach: asyncEach,
	    asyncAll: asyncAll,
	    inOperator: lib.inOperator
	};


/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';

	function cycler(items) {
	    var index = -1;

	    return {
	        current: null,
	        reset: function() {
	            index = -1;
	            this.current = null;
	        },

	        next: function() {
	            index++;
	            if(index >= items.length) {
	                index = 0;
	            }

	            this.current = items[index];
	            return this.current;
	        },
	    };

	}

	function joiner(sep) {
	    sep = sep || ',';
	    var first = true;

	    return function() {
	        var val = first ? '' : sep;
	        first = false;
	        return val;
	    };
	}

	// Making this a function instead so it returns a new object
	// each time it's called. That way, if something like an environment
	// uses it, they will each have their own copy.
	function globals() {
	    return {
	        range: function(start, stop, step) {
	            if(typeof stop === 'undefined') {
	                stop = start;
	                start = 0;
	                step = 1;
	            }
	            else if(!step) {
	                step = 1;
	            }

	            var arr = [];
	            var i;
	            if (step > 0) {
	                for (i=start; i<stop; i+=step) {
	                    arr.push(i);
	                }
	            } else {
	                for (i=start; i>stop; i+=step) {
	                    arr.push(i);
	                }
	            }
	            return arr;
	        },

	        // lipsum: function(n, html, min, max) {
	        // },

	        cycler: function() {
	            return cycler(Array.prototype.slice.call(arguments));
	        },

	        joiner: function(sep) {
	            return joiner(sep);
	        }
	    };
	}

	module.exports = globals;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(setImmediate, process) {// MIT license (by Elan Shanker).
	(function(globals) {
	  'use strict';

	  var executeSync = function(){
	    var args = Array.prototype.slice.call(arguments);
	    if (typeof args[0] === 'function'){
	      args[0].apply(null, args.splice(1));
	    }
	  };

	  var executeAsync = function(fn){
	    if (typeof setImmediate === 'function') {
	      setImmediate(fn);
	    } else if (typeof process !== 'undefined' && process.nextTick) {
	      process.nextTick(fn);
	    } else {
	      setTimeout(fn, 0);
	    }
	  };

	  var makeIterator = function (tasks) {
	    var makeCallback = function (index) {
	      var fn = function () {
	        if (tasks.length) {
	          tasks[index].apply(null, arguments);
	        }
	        return fn.next();
	      };
	      fn.next = function () {
	        return (index < tasks.length - 1) ? makeCallback(index + 1): null;
	      };
	      return fn;
	    };
	    return makeCallback(0);
	  };
	  
	  var _isArray = Array.isArray || function(maybeArray){
	    return Object.prototype.toString.call(maybeArray) === '[object Array]';
	  };

	  var waterfall = function (tasks, callback, forceAsync) {
	    var nextTick = forceAsync ? executeAsync : executeSync;
	    callback = callback || function () {};
	    if (!_isArray(tasks)) {
	      var err = new Error('First argument to waterfall must be an array of functions');
	      return callback(err);
	    }
	    if (!tasks.length) {
	      return callback();
	    }
	    var wrapIterator = function (iterator) {
	      return function (err) {
	        if (err) {
	          callback.apply(null, arguments);
	          callback = function () {};
	        } else {
	          var args = Array.prototype.slice.call(arguments, 1);
	          var next = iterator.next();
	          if (next) {
	            args.push(wrapIterator(next));
	          } else {
	            args.push(callback);
	          }
	          nextTick(function () {
	            iterator.apply(null, args);
	          });
	        }
	      };
	    };
	    wrapIterator(makeIterator(tasks))();
	  };

	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	      return waterfall;
	    }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // RequireJS
	  } else if (typeof module !== 'undefined' && module.exports) {
	    module.exports = waterfall; // CommonJS
	  } else {
	    globals.waterfall = waterfall; // <script>
	  }
	})(this);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11).setImmediate, __webpack_require__(3)))

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(12).nextTick;
	var apply = Function.prototype.apply;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) { timeout.close(); };

	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};

	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};

	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};

	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);

	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};

	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

	  immediateIds[id] = true;

	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });

	  return id;
	};

	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11).setImmediate, __webpack_require__(11).clearImmediate))

/***/ },
/* 12 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Loader = __webpack_require__(14);

	var PrecompiledLoader = Loader.extend({
	    init: function(compiledTemplates) {
	        this.precompiled = compiledTemplates || {};
	    },

	    getSource: function(name) {
	        if (this.precompiled[name]) {
	            return {
	                src: { type: 'code',
	                       obj: this.precompiled[name] },
	                path: name
	            };
	        }
	        return null;
	    }
	});

	module.exports = PrecompiledLoader;


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var path = __webpack_require__(3);
	var Obj = __webpack_require__(6);
	var lib = __webpack_require__(1);

	var Loader = Obj.extend({
	    on: function(name, func) {
	        this.listeners = this.listeners || {};
	        this.listeners[name] = this.listeners[name] || [];
	        this.listeners[name].push(func);
	    },

	    emit: function(name /*, arg1, arg2, ...*/) {
	        var args = Array.prototype.slice.call(arguments, 1);

	        if(this.listeners && this.listeners[name]) {
	            lib.each(this.listeners[name], function(listener) {
	                listener.apply(null, args);
	            });
	        }
	    },

	    resolve: function(from, to) {
	        return path.resolve(path.dirname(from), to);
	    },

	    isRelative: function(filename) {
	        return (filename.indexOf('./') === 0 || filename.indexOf('../') === 0);
	    }
	});

	module.exports = Loader;


/***/ },
/* 15 */
/***/ function(module, exports) {

	function installCompat() {
	  'use strict';

	  // This must be called like `nunjucks.installCompat` so that `this`
	  // references the nunjucks instance
	  var runtime = this.runtime; // jshint ignore:line
	  var lib = this.lib; // jshint ignore:line

	  var orig_contextOrFrameLookup = runtime.contextOrFrameLookup;
	  runtime.contextOrFrameLookup = function(context, frame, key) {
	    var val = orig_contextOrFrameLookup.apply(this, arguments);
	    if (val === undefined) {
	      switch (key) {
	      case 'True':
	        return true;
	      case 'False':
	        return false;
	      case 'None':
	        return null;
	      }
	    }

	    return val;
	  };

	  var orig_memberLookup = runtime.memberLookup;
	  var ARRAY_MEMBERS = {
	    pop: function(index) {
	      if (index === undefined) {
	        return this.pop();
	      }
	      if (index >= this.length || index < 0) {
	        throw new Error('KeyError');
	      }
	      return this.splice(index, 1);
	    },
	    append: function(element) {
	        return this.push(element);
	    },
	    remove: function(element) {
	      for (var i = 0; i < this.length; i++) {
	        if (this[i] === element) {
	          return this.splice(i, 1);
	        }
	      }
	      throw new Error('ValueError');
	    },
	    count: function(element) {
	      var count = 0;
	      for (var i = 0; i < this.length; i++) {
	        if (this[i] === element) {
	          count++;
	        }
	      }
	      return count;
	    },
	    index: function(element) {
	      var i;
	      if ((i = this.indexOf(element)) === -1) {
	        throw new Error('ValueError');
	      }
	      return i;
	    },
	    find: function(element) {
	      return this.indexOf(element);
	    },
	    insert: function(index, elem) {
	      return this.splice(index, 0, elem);
	    }
	  };
	  var OBJECT_MEMBERS = {
	    items: function() {
	      var ret = [];
	      for(var k in this) {
	        ret.push([k, this[k]]);
	      }
	      return ret;
	    },
	    values: function() {
	      var ret = [];
	      for(var k in this) {
	        ret.push(this[k]);
	      }
	      return ret;
	    },
	    keys: function() {
	      var ret = [];
	      for(var k in this) {
	        ret.push(k);
	      }
	      return ret;
	    },
	    get: function(key, def) {
	      var output = this[key];
	      if (output === undefined) {
	        output = def;
	      }
	      return output;
	    },
	    has_key: function(key) {
	      return this.hasOwnProperty(key);
	    },
	    pop: function(key, def) {
	      var output = this[key];
	      if (output === undefined && def !== undefined) {
	        output = def;
	      } else if (output === undefined) {
	        throw new Error('KeyError');
	      } else {
	        delete this[key];
	      }
	      return output;
	    },
	    popitem: function() {
	      for (var k in this) {
	        // Return the first object pair.
	        var val = this[k];
	        delete this[k];
	        return [k, val];
	      }
	      throw new Error('KeyError');
	    },
	    setdefault: function(key, def) {
	      if (key in this) {
	        return this[key];
	      }
	      if (def === undefined) {
	        def = null;
	      }
	      return this[key] = def;
	    },
	    update: function(kwargs) {
	      for (var k in kwargs) {
	        this[k] = kwargs[k];
	      }
	      return null;  // Always returns None
	    }
	  };
	  OBJECT_MEMBERS.iteritems = OBJECT_MEMBERS.items;
	  OBJECT_MEMBERS.itervalues = OBJECT_MEMBERS.values;
	  OBJECT_MEMBERS.iterkeys = OBJECT_MEMBERS.keys;
	  runtime.memberLookup = function(obj, val, autoescape) { // jshint ignore:line
	    obj = obj || {};

	    // If the object is an object, return any of the methods that Python would
	    // otherwise provide.
	    if (lib.isArray(obj) && ARRAY_MEMBERS.hasOwnProperty(val)) {
	      return function() {return ARRAY_MEMBERS[val].apply(obj, arguments);};
	    }

	    if (lib.isObject(obj) && OBJECT_MEMBERS.hasOwnProperty(val)) {
	      return function() {return OBJECT_MEMBERS[val].apply(obj, arguments);};
	    }

	    return orig_memberLookup.apply(this, arguments);
	  };
	}

	module.exports = installCompat;


/***/ }
/******/ ])
});
;
},{}],"/opt/themes/liveblog-default-theme/templates/template-item-embed.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-item-embed.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"item--embed\"><div>";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"html")) || env.getFilter("safe").call(context, runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"meta")),"html")), env.opts.autoescape);
output += "</div>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
return function(ctx, cb) { return nunjucks.render("template-item-embed.html", ctx, cb); }
})();
;

},{"nunjucks/browser/nunjucks-slim":"/opt/themes/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/opt/themes/liveblog-default-theme/templates/template-item-image.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-item-image.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<figure>\n  <img \n    src=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"media")),"renditions")),"thumbnail")),"href"), env.opts.autoescape);
output += "\"\n    srcset=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"media")),"renditions")),"baseImage")),"href"), env.opts.autoescape);
output += " 810w, \n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"media")),"renditions")),"thumbnail")),"href"), env.opts.autoescape);
output += " 240w, \n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"media")),"renditions")),"viewImage")),"href"), env.opts.autoescape);
output += " 540w\" \n    alt=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"caption"), env.opts.autoescape);
output += "\">\n  <figcaption>\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"caption"), env.opts.autoescape);
output += " \n    <span ng-if=\"ref.item.meta.credit\">\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"credit"), env.opts.autoescape);
output += "\n    </span>\n  </figcaption>\n</figure>\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
return function(ctx, cb) { return nunjucks.render("template-item-image.html", ctx, cb); }
})();
;

},{"nunjucks/browser/nunjucks-slim":"/opt/themes/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/opt/themes/liveblog-default-theme/templates/template-post.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-post.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<article class=\"lb-post list-group-item show-author-avatar\" data-js-post-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"_id"), env.opts.autoescape);
output += "\">\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky")) {
output += "\n    <div class=\"lb-type\"></div>\n  ";
;
}
else {
output += "\n    <div class=\"lb-type lb-type--text\"></div>\n  ";
;
}
output += "\n  \n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"highlight")) {
output += "\n    <div class=\"lb-post-highlighted\"></div>\n  ";
;
}
output += "\n\n  <div class=\"lb-post-date\" data-js-timestamp=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"_updated"), env.opts.autoescape);
output += "\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"_updated"), env.opts.autoescape);
output += "</div>\n\n  <!-- item start -->\n  ";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"groups")),1)),"refs");
if(t_3) {var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("ref", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n    <div class=\"lb-item\">\n      ";
if(runtime.memberLookup((runtime.memberLookup((t_4),"item")),"item_type") == "embed") {
output += "\n        ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-item-embed.html", false, "template-post.html", null, function(t_7,t_5) {
if(t_7) { cb(t_7); return; }
callback(null,t_5);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_8,t_6) {
if(t_8) { cb(t_8); return; }
callback(null,t_6);});
});
tasks.push(
function(result, callback){
output += result;
callback(null);
});
env.waterfall(tasks, function(){
output += "\n      ";
});
}
else {
if(runtime.memberLookup((runtime.memberLookup((t_4),"item")),"item_type") == "image") {
output += "\n        ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-item-image.html", false, "template-post.html", null, function(t_11,t_9) {
if(t_11) { cb(t_11); return; }
callback(null,t_9);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_12,t_10) {
if(t_12) { cb(t_12); return; }
callback(null,t_10);});
});
tasks.push(
function(result, callback){
output += result;
callback(null);
});
env.waterfall(tasks, function(){
output += "\n      ";
});
}
else {
output += "\n        <article>";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.memberLookup((runtime.memberLookup((t_4),"item")),"text")), env.opts.autoescape);
output += "</article>\n      ";
;
}
;
}
output += "\n    </div>\n  ";
;
}
}
frame = frame.pop();
output += "\n  <!-- item end -->\n\n  <!-- author plus avatar -->\n  <div class=\"lb-author\">\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showAuthor")) {
output += "\n      ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showAuthorAvatar")) {
output += "\n        <img class=\"lb-author__avatar\" src=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"publisher")),"picture_url"), env.opts.autoescape);
output += "\" />\n      ";
;
}
output += "\n      <div class=\"lb-author__name\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"publisher")),"display_name"), env.opts.autoescape);
output += "</div>\n    ";
;
}
output += "\n  </div>\n  <!-- end author -->\n\n</article>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
return function(ctx, cb) { return nunjucks.render("template-post.html", ctx, cb); }
})();
;

},{"nunjucks/browser/nunjucks-slim":"/opt/themes/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/opt/themes/liveblog-default-theme/templates/template-timeline.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-timeline.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"lb-timeline\" data-js-target=\"timeline\">\n  ";
(parentTemplate ? function(e, c, f, r, cb) { cb(""); } : context.getBlock("timeline"))(env, context, frame, runtime, function(t_2,t_1) {
if(t_2) { cb(t_2); return; }
output += t_1;
output += "\n</div>\n\n";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-embed-providers.html", false, "template-timeline.html", null, function(t_5,t_3) {
if(t_5) { cb(t_5); return; }
callback(null,t_3);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_6,t_4) {
if(t_6) { cb(t_6); return; }
callback(null,t_4);});
});
tasks.push(
function(result, callback){
output += result;
callback(null);
});
env.waterfall(tasks, function(){
output += "\n\n";
if(runtime.contextOrFrameLookup(context, frame, "include_js_options")) {
output += "\n<script type=\"text/javascript\">\nwindow.LB = ";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.contextOrFrameLookup(context, frame, "theme_json")), env.opts.autoescape);
output += ";\n</script>\n";
;
}
output += "\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
})});
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
function b_timeline(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var frame = frame.push(true);
output += "\n  <div class=\"lb-timeline ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"language"), env.opts.autoescape);
output += "\">\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showTitle") && runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "blog")),"title")) {
output += "\n      <h1>";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"blog")),"title"), env.opts.autoescape);
output += "</h1>\n    ";
;
}
output += "\n\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showDescription") && runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "blog")),"description")) {
output += "\n      <div class=\"description\">\n        ";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "blog")),"description")), env.opts.autoescape);
output += "\n      </div>\n    ";
;
}
output += "\n\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showImage") && runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "blog")),"picture_url")) {
output += "\n      <img src=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "blog")),"picture_url"), env.opts.autoescape);
output += "\" />\n    ";
;
}
output += "\n\n    <!-- Header -->\n    <div class=\"header-bar\">\n      <div class=\"sorting-bar\">\n        <div class=\"sorting-bar__orders\">\n          <div class=\"sorting-bar__order sorting-bar__order--active\" data-js-orderby_newest_first>\n            ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "theme")),"l10n")),"newestFirst"), env.opts.autoescape);
output += "\n          </div>\n          <div class=\"sorting-bar__order\" data-js-orderby_oldest_first>\n            ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "theme")),"l10n")),"oldestFirst"), env.opts.autoescape);
output += "\n          </div>\n        </div>\n      </div>\n      <div class=\"header-bar__actions\"></div>\n    </div>\n    <!-- Header End -->\n\n    <!-- Timeline -->\n    <div class=\"timeline-body timeline-body--loaded\">\n      ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"_items")) == 0) {
output += "\n        <div class=\"lb-post empty-message\">\n          <div>Blog posts are not currently available.</div>\n        </div>\n        ";
;
}
else {
output += "\n        <section class=\"lb-posts list-group\">\n          ";
frame = frame.push();
var t_9 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"_items");
if(t_9) {var t_8 = t_9.length;
for(var t_7=0; t_7 < t_9.length; t_7++) {
var t_10 = t_9[t_7];
frame.set("item", t_10);
frame.set("loop.index", t_7 + 1);
frame.set("loop.index0", t_7);
frame.set("loop.revindex", t_8 - t_7);
frame.set("loop.revindex0", t_8 - t_7 - 1);
frame.set("loop.first", t_7 === 0);
frame.set("loop.last", t_7 === t_8 - 1);
frame.set("loop.length", t_8);
output += "\n            ";
if(!runtime.memberLookup((t_10),"deleted")) {
output += "\n              ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-post.html", false, "template-timeline.html", null, function(t_13,t_11) {
if(t_13) { cb(t_13); return; }
callback(null,t_11);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_14,t_12) {
if(t_14) { cb(t_14); return; }
callback(null,t_12);});
});
tasks.push(
function(result, callback){
output += result;
callback(null);
});
env.waterfall(tasks, function(){
output += "\n            ";
});
}
output += "\n          ";
;
}
}
frame = frame.pop();
output += "\n        </section>\n        ";
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"_meta")),"max_results") <= runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"_meta")),"total")) {
output += "\n          <button class=\"lb-button load-more-posts\" data-js-loadmore>";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "theme")),"l10n")),"loadNewPosts"), env.opts.autoescape);
output += "</button>\n        ";
;
}
output += "\n      ";
;
}
output += "\n    </div>\n    <!-- Timeline End -->\n  </div>\n  ";
cb(null, output);
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
b_timeline: b_timeline,
root: root
};

})();
return function(ctx, cb) { return nunjucks.render("template-timeline.html", ctx, cb); }
})();
;

},{"nunjucks/browser/nunjucks-slim":"/opt/themes/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}]},{},["/opt/themes/liveblog-default-theme/js/liveblog.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9saXZlYmxvZy5qcyIsImpzL3RoZW1lL2hhbmRsZXJzLmpzIiwianMvdGhlbWUvaGVscGVycy5qcyIsImpzL3RoZW1lL2luZGV4LmpzIiwianMvdGhlbWUvdGVtcGxhdGVzLmpzIiwianMvdGhlbWUvdmlldy5qcyIsImpzL3RoZW1lL3ZpZXdtb2RlbC5qcyIsIm5vZGVfbW9kdWxlcy9udW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW0uanMiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sIiwidGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbCIsInRlbXBsYXRlcy90ZW1wbGF0ZS1wb3N0Lmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtdGltZWxpbmUuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3A2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG4gXG4ndXNlIHN0cmljdCc7XG5cbi8vIFByZXJlbmRlciBmdW5jdGlvbnNcbnZhciB0aGVtZSA9IHJlcXVpcmUoJy4vdGhlbWUnKTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuICB0aGVtZS5pbml0KClcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHt9IiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB2aWV3ID0gcmVxdWlyZSgnLi92aWV3JylcbiAgLCB2aWV3bW9kZWwgPSByZXF1aXJlKCcuL3ZpZXdtb2RlbCcpXG4gICwgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xuXG4vKipcbiAqIENvbnRhaW5zIGEgbWFwcGluZyBvZiBlbGVtZW50IGRhdGEtc2VsZWN0b3JzIGFuZCBjbGljayBoYW5kbGVyc1xuICogYnV0dG9ucy5hdHRhY2gge2Z1bmN0aW9ufSAtIHJlZ2lzdGVycyBoYW5kbGVycyBmb3VuZCBpbiBoYW5kbGVycyBvYmplY3RcbiAqL1xudmFyIGJ1dHRvbnMgPSB7XG4gIGhhbmRsZXJzOiB7XG4gICAgXCJbZGF0YS1qcy1sb2FkbW9yZV1cIjogZnVuY3Rpb24oKSB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzUGFnZSgpXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyUG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKTtcbiAgICB9LFxuXG4gICAgXCJbZGF0YS1qcy1vcmRlcmJ5X29sZGVzdF9maXJzdF1cIjogZnVuY3Rpb24oKSB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzKHtzb3J0OiAnb2xkZXN0X2ZpcnN0J30pXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyVGltZWxpbmUpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZpZXcudG9nZ2xlU29ydEJ0bignb2xkZXN0X2ZpcnN0JylcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgXCJbZGF0YS1qcy1vcmRlcmJ5X25ld2VzdF9maXJzdF1cIjogZnVuY3Rpb24oKSB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzKHtzb3J0OiAnbmV3ZXN0X2ZpcnN0J30pXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyVGltZWxpbmUpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZpZXcudG9nZ2xlU29ydEJ0bignbmV3ZXN0X2ZpcnN0JylcbiAgICAgICAgfSlcbiAgICB9XG4gIH0sXG5cbiAgYXR0YWNoOiBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBoYW5kbGVyIGluIGJ1dHRvbnMuaGFuZGxlcnMpIHtcbiAgICAgIHZhciBlbCA9IGhlbHBlcnMuZ2V0RWxlbXMoaGFuZGxlcilbMF07XG4gICAgICBpZiAoIWVsKSByZXR1cm4gZmFsc2VcbiAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYnV0dG9ucy5oYW5kbGVyc1toYW5kbGVyXSwgZmFsc2UpO1xuICAgIH1cbiAgfVxufTtcblxudmFyIGV2ZW50cyA9IHtcbiAgYXR0YWNoOiBmdW5jdGlvbigpIHt9IC8vIHRvZG9cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBidXR0b25zOiBidXR0b25zLFxuICBldmVudHM6IGV2ZW50c1xufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgbW9tZW50O1xuXG4vKipcbiAqIENvbnZlcnQgSVNPIHRpbWVzdGFtcHMgdG8gcmVsYXRpdmUgbW9tZW50IHRpbWVzdGFtcHNcbiAqIEBwYXJhbSB7Tm9kZX0gZWxlbSAtIGEgRE9NIGVsZW1lbnQgd2l0aCBJU08gdGltZXN0YW1wIGluIGRhdGEtanMtdGltZXN0YW1wIGF0dHJcbiAqL1xuZnVuY3Rpb24gY29udmVydFRpbWVzdGFtcCh0aW1lc3RhbXApIHtcbiAgdmFyIGwxMG4gPSBMQi5sMTBuLnRpbWVBZ29cbiAgICAsIG5vdyA9IG5ldyBEYXRlKCkgLy8gTm93XG4gICAgLCBkaWZmID0gbm93IC0gbmV3IERhdGUodGltZXN0YW1wKVxuICAgICwgdW5pdHMgPSB7XG4gICAgICBkOiAxMDAwICogMzYwMCAqIDI0LFxuICAgICAgaDogMTAwMCAqIDM2MDAsXG4gICAgICBtOiAxMDAwICogNjBcbiAgICB9O1xuXG4gIGZ1bmN0aW9uIGdldFRpbWVBZ29TdHJpbmcodGltZXN0YW1wLCB1bml0KSB7XG4gICAgcmV0dXJuICEodGltZXN0YW1wIDw9IHVuaXRzW3VuaXRdICogMilcbiAgICAgID8gbDEwblt1bml0XS5wLnJlcGxhY2UoXCJ7fVwiLCBNYXRoLmZsb29yKHRpbWVzdGFtcCAvIHVuaXRzW3VuaXRdKSlcbiAgICAgIDogbDEwblt1bml0XS5zO1xuICB9XG5cbiAgZnVuY3Rpb24gdGltZUFnbyh0aW1lc3RhbXApIHtcbiAgICBpZiAodGltZXN0YW1wIDwgdW5pdHMuaCkgcmV0dXJuIGdldFRpbWVBZ29TdHJpbmcodGltZXN0YW1wLCBcIm1cIik7XG4gICAgaWYgKHRpbWVzdGFtcCA8IHVuaXRzLmQpIHJldHVybiBnZXRUaW1lQWdvU3RyaW5nKHRpbWVzdGFtcCwgXCJoXCIpO1xuXG4gICAgcmV0dXJuIGdldFRpbWVBZ29TdHJpbmcodGltZXN0YW1wLCBcImRcIik7IC8vIGRlZmF1bHRcbiAgfTtcblxuICByZXR1cm4gdGltZUFnbyhkaWZmKTtcbn07XG5cbi8qKlxuICogV3JhcCBlbGVtZW50IHNlbGVjdG9yIGFwaVxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IC0gYSBqUXVlcnkgc3ludGF4IERPTSBxdWVyeSAod2l0aCBkb3RzKVxuICovXG5mdW5jdGlvbiBnZXRFbGVtcyhxdWVyeSkge1xuICB2YXIgaXNEYXRhQXR0ciA9IC0xIDwgcXVlcnkuaW5kZXhPZihcImRhdGEtXCIpO1xuICByZXR1cm4gaXNEYXRhQXR0clxuICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxdWVyeSlcbiAgICA6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUocXVlcnkpO1xufTtcblxuLyoqXG4gKiBqUXVlcnkncyAkLmdldEpTT04gaW4gYSBudXRzaGVsbFxuICogQHBhcmFtIHtzdHJpbmd9IHVybCAtIGEgcmVxdWVzdCBVUkxcbiAqL1xuZnVuY3Rpb24gZ2V0SlNPTih1cmwpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciBwcm9taXNlID0gUHJvbWlzZTtcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub3BlbignR0VUJywgdXJsKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KSk7XG4gICAgICB9XG4gICAgICBlbHNlIHJlamVjdCh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICB9O1xuXG4gICAgeGhyLnNlbmQoKTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRFbGVtczogZ2V0RWxlbXMsXG4gIGdldEpTT046IGdldEpTT04sXG4gIGNvbnZlcnRUaW1lc3RhbXA6IGNvbnZlcnRUaW1lc3RhbXBcbn1cbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIilcbiAgLCBoYW5kbGVycyA9IHJlcXVpcmUoXCIuL2hhbmRsZXJzXCIpXG4gICwgdmlld21vZGVsID0gcmVxdWlyZShcIi4vdmlld21vZGVsXCIpXG4gICwgdmlldyA9IHJlcXVpcmUoXCIuL3ZpZXdcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvKipcbiAgICogT24gZG9jdW1lbnQgbG9hZGVkLCBkbyB0aGUgZm9sbG93aW5nOlxuICAgKi9cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgaGFuZGxlcnMuYnV0dG9ucy5hdHRhY2goKTsgLy8gUmVnaXN0ZXIgQnV0dG9ucyBIYW5kbGVyc1xuICAgIGhhbmRsZXJzLmV2ZW50cy5hdHRhY2goKTsgLy8gUmVnaXN0ZXIgRXZlbnQsIE1lc3NhZ2UgSGFuZGxlcnNcbiAgICB2aWV3bW9kZWwuaW5pdCgpO1xuXG4gICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzKCkudGhlbih2aWV3LnJlbmRlclBvc3RzKTsgLy8gU3RhcnQgcG9sbGluZ1xuICAgICAgdmlldy51cGRhdGVUaW1lc3RhbXBzKCk7IC8vIENvbnZlcnQgSVNPIGRhdGVzIHRvIHRpbWVhZ29cbiAgICB9LCAxMCoxMDAwKVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgcG9zdDogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1wb3N0Lmh0bWxcIiksXG4gIHRpbWVsaW5lOiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiksXG4gIGl0ZW1JbWFnZTogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiksXG4gIGl0ZW1FbWJlZDogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIilcbn0iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcbnZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKVxudmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJylcblxudmFyIHRpbWVsaW5lRWxlbSA9IGhlbHBlcnMuZ2V0RWxlbXMoXCJsYi1wb3N0c1wiKVxuICAsIGxvYWRNb3JlUG9zdHNCdXR0b24gPSBoZWxwZXJzLmdldEVsZW1zKFwibG9hZC1tb3JlLXBvc3RzXCIpO1xuXG4vKipcbiAqIFJlcGxhY2UgdGhlIGN1cnJlbnQgdGltZWxpbmUgdW5jb25kaXRpb25hbGx5LlxuICogQHBhcmFtIHthcnJheX0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT05cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0ga2V5d29yZCBhcmdzXG4gKi9cbmZ1bmN0aW9uIHJlbmRlclRpbWVsaW5lKGFwaV9yZXNwb25zZSwgb3B0cykge1xuICB2YXIgcmVuZGVyZWRQb3N0cyA9IFtdO1xuXG4gIGFwaV9yZXNwb25zZS5faXRlbXMuZm9yRWFjaChmdW5jdGlvbihwb3N0KSB7XG4gICAgcmVuZGVyZWRQb3N0cy5wdXNoKHRlbXBsYXRlcy5wb3N0KHtcbiAgICAgIGl0ZW06IHBvc3RcbiAgICB9KSlcbiAgfSk7XG5cbiAgdGltZWxpbmVFbGVtWzBdLmlubmVySFRNTCA9IHJlbmRlcmVkUG9zdHMuam9pbihcIlwiKTtcbiAgbG9hZEVtYmVkcygpO1xufVxuXG4vKipcbiAqIFJlbmRlciBwb3N0cyBjdXJyZW50bHkgaW4gcGlwZWxpbmUgdG8gdGVtcGxhdGUuXG4gKiBUbyByZWR1Y2UgRE9NIGNhbGxzL3BhaW50cyB3ZSBoYW5kIG9mZiByZW5kZXJlZCBIVE1MIGluIGJ1bGsuXG4gKiBAcGFyYW0ge29iamVjdH0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKi9cbmZ1bmN0aW9uIHJlbmRlclBvc3RzKGFwaV9yZXNwb25zZSwgb3B0cykge1xuICB2YXIgcmVuZGVyZWRQb3N0cyA9IFtdIC8vIHRlbXBvcmFyeSBzdG9yZVxuICAgICwgcG9zdHMgPSBhcGlfcmVzcG9uc2UuX2l0ZW1zO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcG9zdHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcG9zdCA9IHBvc3RzW2ldO1xuXG4gICAgaWYgKFwiZGVsZXRlXCIgPT09IHBvc3RzLm9wZXJhdGlvbikge1xuICAgICAgdmlldy5kZWxldGVQb3N0KHBvc3QuX2lkKTtcbiAgICAgIHJldHVybjsgLy8gZWFybHlcbiAgICB9O1xuXG4gICAgdmFyIHJlbmRlcmVkUG9zdCA9IHRlbXBsYXRlcy5wb3N0KHtcbiAgICAgIGl0ZW06IHBvc3RcbiAgICB9KTtcblxuICAgIGlmIChcInVwZGF0ZVwiID09PSBwb3N0cy5vcGVyYXRpb24pIHtcbiAgICAgIHZpZXcudXBkYXRlUG9zdChyZW5kZXJlZFBvc3QpXG4gICAgICByZXR1cm47IC8vIGVhcmx5XG4gICAgfVxuXG4gICAgcmVuZGVyZWRQb3N0cy5wdXNoKHJlbmRlcmVkUG9zdCkgLy8gY3JlYXRlIG9wZXJhdGlvblxuICB9O1xuXG4gIGlmICghcmVuZGVyZWRQb3N0cy5sZW5ndGgpIHJldHVybiAvLyBlYXJseVxuICBpZiAoc2V0dGluZ3MucG9zdE9yZGVyID09PSBcImRlc2NlbmRpbmdcIikgcmVuZGVyZWRQb3N0cy5yZXZlcnNlKClcblxuICB2aWV3LmFkZFBvc3RzKHJlbmRlcmVkUG9zdHMsIHsgLy8gaWYgY3JlYXRlc1xuICAgIHBvc2l0aW9uOiBvcHRzLmZyb21EYXRlID8gXCJ0b3BcIiA6IFwiYm90dG9tXCJcbiAgfSlcbn1cblxuLyoqXG4gKiBTZXQgc29ydGluZyBvcmRlciBidXR0b24gb2YgY2xhc3MgQG5hbWUgdG8gYWN0aXZlLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBsaXZlYmxvZyBBUEkgcmVzcG9uc2UgSlNPTi5cbiAqL1xuZnVuY3Rpb24gdG9nZ2xlU29ydEJ0bihuYW1lKSB7XG4gIHZhciBzb3J0aW5nQnRucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5zb3J0aW5nLWJhcl9fb3JkZXInKTtcbiAgc29ydGluZ0J0bnMuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuICAgIHZhciBzaG91bGRCZUFjdGl2ZSA9IGVsLmRhdGFzZXQuaGFzT3duUHJvcGVydHkoXCJqc09yZGVyYnlfXCIgKyBuYW1lKVxuICAgIGVsLmNsYXNzTGlzdC50b2dnbGUoJ3NvcnRpbmctYmFyX19vcmRlci0tYWN0aXZlJywgc2hvdWxkQmVBY3RpdmUpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBBZGQgcG9zdCBub2RlcyB0byBET00sIGRvIHNvIHJlZ2FyZGxlc3Mgb2Ygc2V0dGluZ3MuYXV0b0FwcGx5VXBkYXRlcyxcbiAqIGJ1dCByYXRoZXIgc2V0IHRoZW0gdG8gTk9UIEJFIERJU1BMQVlFRCBpZiBhdXRvLWFwcGx5IGlzIGZhbHNlLlxuICogVGhpcyB3YXkgd2UgZG9uJ3QgaGF2ZSB0byBtZXNzIHdpdGggdHdvIHN0YWNrcyBvZiBwb3N0cy5cbiAqIEBwYXJhbSB7YXJyYXl9IHBvc3RzIC0gYW4gYXJyYXkgb2YgTGl2ZWJsb2cgcG9zdCBpdGVtc1xuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBrZXl3b3JkIGFyZ3NcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLnBvc2l0aW9uIC0gdG9wIG9yIGJvdHRvbVxuICovXG5mdW5jdGlvbiBhZGRQb3N0cyhwb3N0cywgb3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgb3B0cy5wb3NpdGlvbiA9IG9wdHMucG9zaXRpb24gfHwgXCJib3R0b21cIjtcblxuICB2YXIgcG9zdHNIVE1MID0gXCJcIlxuICAgICwgcG9zaXRpb24gPSBvcHRzLnBvc2l0aW9uID09PSBcInRvcFwiXG4gICAgICAgID8gXCJhZnRlcmJlZ2luXCIgLy8gaW5zZXJ0QWRqYWNlbnRIVE1MIEFQSSA9PiBhZnRlciBzdGFydCBvZiBub2RlXG4gICAgICAgIDogXCJiZWZvcmVlbmRcIjsgLy8gaW5zZXJ0QWRqYWNlbnRIVE1MIEFQSSA9PiBiZWZvcmUgZW5kIG9mIG5vZGVcblxuICBmb3IgKHZhciBpID0gcG9zdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBwb3N0c0hUTUwgKz0gcG9zdHNbaV1cbiAgfTtcblxuICB0aW1lbGluZUVsZW1bMF0uaW5zZXJ0QWRqYWNlbnRIVE1MKHBvc2l0aW9uLCBwb3N0c0hUTUwpO1xuICBsb2FkRW1iZWRzKCk7XG59O1xuXG4vKipcbiAqIFRyaWdnZXIgZW1iZWQgcHJvdmlkZXIgdW5wYWNraW5nXG4gKiBUb2RvOiBNYWtlIHJlcXVpcmVkIHNjcmlwdHMgYXZhaWxhYmxlIG9uIHN1YnNlcXVlbnQgbG9hZHNcbiAqL1xuZnVuY3Rpb24gbG9hZEVtYmVkcygpIHtcbiAgaWYgKHdpbmRvdy5pbnN0Z3JtKSB3aW5kb3cuaW5zdGdybS5FbWJlZHMucHJvY2VzcygpXG4gIGlmICh3aW5kb3cudHd0dHIpIHdpbmRvdy50d3R0ci53aWRnZXRzLmxvYWQoKVxufTtcblxuLyoqXG4gKiBUb2dnbGUgZGlzcGxheSBvZiBsb2FkLW1vcmUtcG9zdHMgYnV0dG9uLlxuICogQHBhcmFtIHtib29sfSBzaG91bGRUb2dnbGUgLSB0cnVlID0+IGRpc3BsYXlcbiAqL1xuZnVuY3Rpb24gdG9nZ2xlTG9hZE1vcmUoc2hvdWxkVG9nZ2xlKSB7XG4gIGxvYWRNb3JlUG9zdHNCdXR0b25bMF0uY2xhc3NMaXN0LnRvZ2dsZShcbiAgICBcIm1vZC0taGlkZVwiLCBzaG91bGRUb2dnbGUpXG4gIHJldHVybjtcbn07XG5cbi8qKlxuICogU2hvdyBuZXcgcG9zdHMgbG9hZGVkIHZpYSBYSFJcbiAqL1xuZnVuY3Rpb24gZGlzcGxheU5ld1Bvc3RzKCkge1xuICB2YXIgbmV3UG9zdHMgPSBoZWxwZXJzLmdldEVsZW1zKFwibGItcG9zdC1uZXdcIilcbiAgZm9yICh2YXIgaSA9IG5ld1Bvc3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbmV3UG9zdHNbaV0uY2xhc3NMaXN0LnJlbW92ZShcImxiLXBvc3QtbmV3XCIpXG4gIH1cbn07XG5cbi8qKlxuICogRGVsZXRlIHBvc3QgPGFydGljbGU+IERPTSBub2RlIGJ5IGRhdGEgYXR0cmlidXRlLlxuICogQHBhcmFtIHtzdHJpbmd9IC0gYSBwb3N0IFVSTlxuICovXG5mdW5jdGlvbiBkZWxldGVQb3N0KHBvc3RJZCkge1xuICB2YXIgZWxlbSA9IGhlbHBlcnMuZ2V0RWxlbXMoJ2RhdGEtanMtcG9zdC1pZD1cXFwiJyArIHBvc3RJZCArICdcXFwiJyk7XG4gIGVsZW1bMF0ucmVtb3ZlKCk7XG59O1xuXG4vKipcbiAqIERlbGV0ZSBwb3N0IDxhcnRpY2xlPiBET00gbm9kZSBieSBkYXRhIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAtIGEgcG9zdCBVUk5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlUG9zdChwb3N0SWQsIHJlbmRlcmVkUG9zdCkge1xuICB2YXIgZWxlbSA9IGhlbHBlcnMuZ2V0RWxlbXMoJ2RhdGEtanMtcG9zdC1pZD1cXFwiJyArIHBvc3RJZCArICdcXFwiJyk7XG4gIGVsZW1bMF0uaW5uZXJIVE1MID0gcmVuZGVyZWRQb3N0O1xuICBsb2FkRW1iZWRzKCk7XG59O1xuXG4vKipcbiAqIERlbGV0ZSBwb3N0IDxhcnRpY2xlPiBET00gbm9kZSBieSBkYXRhIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAtIGEgcG9zdCBVUk5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlVGltZXN0YW1wcygpIHtcbiAgdmFyIGRhdGVFbGVtcyA9IGhlbHBlcnMuZ2V0RWxlbXMoXCJsYi1wb3N0LWRhdGVcIik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0ZUVsZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGVsZW0gPSBkYXRlRWxlbXNbaV1cbiAgICAgICwgdGltZXN0YW1wID0gZWxlbS5kYXRhc2V0LmpzVGltZXN0YW1wO1xuICAgIGVsZW0udGV4dENvbnRlbnQgPSBoZWxwZXJzLmNvbnZlcnRUaW1lc3RhbXAodGltZXN0YW1wKTtcbiAgfVxuICByZXR1cm4gbnVsbFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZFBvc3RzOiBhZGRQb3N0cyxcbiAgZGVsZXRlUG9zdDogZGVsZXRlUG9zdCxcbiAgZGlzcGxheU5ld1Bvc3RzOiBkaXNwbGF5TmV3UG9zdHMsXG4gIHJlbmRlclRpbWVsaW5lOiByZW5kZXJUaW1lbGluZSxcbiAgdXBkYXRlUG9zdDogdXBkYXRlUG9zdCxcbiAgdXBkYXRlVGltZXN0YW1wczogdXBkYXRlVGltZXN0YW1wcyxcbiAgdG9nZ2xlTG9hZE1vcmU6IHRvZ2dsZUxvYWRNb3JlLFxuICB0b2dnbGVTb3J0QnRuOiB0b2dnbGVTb3J0QnRuXG59XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJylcbiAgLCBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJylcbiAgLCB2aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbnZhciBlbmRwb2ludCA9IExCLmFwaV9ob3N0ICsgXCIvYXBpL2NsaWVudF9ibG9ncy9cIiArIExCLmJsb2cuX2lkICsgXCIvcG9zdHNcIlxuICAsIHNldHRpbmdzID0gTEIuc2V0dGluZ3M7XG5cbnZhciB2bSA9IHtcbiAgX2l0ZW1zOiBbXSxcbiAgY3VycmVudFBhZ2U6IDEsXG4gIHRvdGFsUG9zdHM6IDBcbn07XG5cbi8qKlxuICogUHJpdmF0ZSBBUEkgcmVxdWVzdCBtZXRob2RcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0gcXVlcnkgYnVpbGRlciBvcHRpb25zLlxuICogQHBhcmFtIHtudW1iZXJ9IG9wdHMucGFnZSAtIGRlc2lyZWQgcGFnZS9zdWJzZXQgb2YgcG9zdHMsIGxlYXZlIGVtcHR5IGZvciBwb2xsaW5nLlxuICogQHBhcmFtIHtudW1iZXJ9IG9wdHMuZnJvbURhdGUgLSBuZWVkZWQgZm9yIHBvbGxpbmcuXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBMaXZlYmxvZyAzIEFQSSByZXNwb25zZVxuICovXG5mdW5jdGlvbiBnZXRQb3N0cyhvcHRzKSB7XG4gIHZhciBkYlF1ZXJ5ID0gZ2V0UXVlcnkoe1xuICAgIHNvcnQ6IG9wdHMuc29ydCB8fCBzZXR0aW5ncy5wb3N0T3JkZXIsXG4gICAgaGlnaGxpZ2h0c09ubHk6IGZhbHNlIHx8IG9wdHMuaGlnaGxpZ2h0c09ubHksXG4gICAgZnJvbURhdGU6IG9wdHMuZnJvbURhdGVcbiAgICAgID8gb3B0cy5mcm9tRGF0ZVxuICAgICAgOiBmYWxzZVxuICB9KVxuXG4gIHZhciBwYWdlID0gb3B0cy5mcm9tRGF0ZSA/IDEgOiBvcHRzLnBhZ2U7XG4gIHZhciBxcyA9IFwiP21heF9yZXN1bHRzPVwiICsgTEIuc2V0dGluZ3MucG9zdHNQZXJQYWdlICsgXCImcGFnZT1cIiArIHBhZ2UgKyBcIiZzb3VyY2U9XCJcbiAgICAsIGZ1bGxQYXRoID0gZW5kcG9pbnQgKyBxcyArIGRiUXVlcnk7XG5cbiAgcmV0dXJuIGhlbHBlcnMuZ2V0SlNPTihmdWxsUGF0aClcbn07XG5cbi8qKlxuICogR2V0IG5leHQgcGFnZSBvZiBwb3N0cyBmcm9tIEFQSS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0gcXVlcnkgYnVpbGRlciBvcHRpb25zLlxuICogQHJldHVybnMge3Byb21pc2V9IHJlc29sdmVzIHRvIHBvc3RzIGFycmF5LlxuICovXG5mdW5jdGlvbiBsb2FkUG9zdHNQYWdlKG9wdHMpIHtcbiAgdmFyIG9wdHMgPSBvcHRzIHx8IHt9XG4gIG9wdHMucGFnZSA9ICsrdm0uY3VycmVudFBhZ2U7XG5cbiAgcmV0dXJuIGdldFBvc3RzKG9wdHMpXG4gICAgLnRoZW4oZnVuY3Rpb24ocG9zdHMpIHtcbiAgICAgIHVwZGF0ZVZpZXdNb2RlbChwb3N0cywgb3B0cyk7XG4gICAgICByZXR1cm4gcG9zdHNcbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAvLyBjYXRjaCBhbGwgZXJyb3JzIGhlcmVcbiAgfSlcbn07XG5cbi8qKlxuICogUG9sbCBBUEkgZm9yIG5ldyBwb3N0cy5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0gcXVlcnkgYnVpbGRlciBvcHRpb25zLlxuICogQHJldHVybnMge3Byb21pc2V9IHJlc29sdmVzIHRvIHBvc3RzIGFycmF5LlxuICovXG5mdW5jdGlvbiBsb2FkUG9zdHMob3B0cykge1xuICB2YXIgb3B0cyA9IG9wdHMgfHwge307XG4gIG9wdHMuZnJvbURhdGUgPSB2bS5sYXRlc3RVcGRhdGU7XG5cbiAgcmV0dXJuIGdldFBvc3RzKG9wdHMpXG4gICAgLnRoZW4oZnVuY3Rpb24ocG9zdHMpIHtcbiAgICAgIHVwZGF0ZVZpZXdNb2RlbChwb3N0cywgb3B0cyk7XG4gICAgICByZXR1cm4gcG9zdHNcbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgIC8vIGNhdGNoIGFsbCBlcnJvcnMgaGVyZVxuICAgIH0pXG59O1xuXG4vKipcbiAqIEFkZCBpdGVtcyBpbiBhcGkgcmVzcG9uc2UgJiBsYXRlc3QgdXBkYXRlIHRpbWVzdGFtcCB0byB2aWV3bW9kZWwuXG4gKiBAcGFyYW0ge29iamVjdH0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVZpZXdNb2RlbChhcGlfcmVzcG9uc2UsIG9wdHMpIHtcbiAgaWYgKG9wdHMuc29ydCA9PT0gJ29sZGVzdF9maXJzdCcpIHtcbiAgICBPYmplY3QuYXNzaWduKHZtLCBhcGlfcmVzcG9uc2UpO1xuICB9IGVsc2Uge1xuICAgIHZtLl9pdGVtcy5wdXNoLmFwcGx5KHZtLl9pdGVtcywgYXBpX3Jlc3BvbnNlLl9pdGVtcyk7XG4gIH1cblxuICBpZiAoIW9wdHMuZnJvbURhdGUpIHsgLy8gTWVhbnMgd2UncmUgbm90IHBvbGxpbmdcbiAgICB2aWV3LnRvZ2dsZUxvYWRNb3JlKGlzVGltZWxpbmVFbmQoYXBpX3Jlc3BvbnNlKSkgLy8gdGhlIGVuZD9cbiAgfSBlbHNlIHsgLy8gTWVhbnMgd2UncmUgcG9sbGluZyBmb3IgbmV3IHBvc3RzXG4gICAgaWYgKCFhcGlfcmVzcG9uc2UuX2l0ZW1zLmxlbmd0aCkgcmV0dXJuO1xuICAgIHZtLmxhdGVzdFVwZGF0ZSA9IGdldExhdGVzdFVwZGF0ZShhcGlfcmVzcG9uc2UpO1xuICB9XG5cbiAgcmV0dXJuIGFwaV9yZXNwb25zZVxufTtcblxuLyoqXG4gKiBHZXQgdGhlIGxhdGVzdCB1cGRhdGUgdGltZXN0YW1wIGZyb20gYSBudW1iZXIgb2YgcG9zdHMuXG4gKiBAcGFyYW0ge29iamVjdH0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIElTTyA4NjAxIGVuY29kZWQgZGF0ZVxuICovXG5mdW5jdGlvbiBnZXRMYXRlc3RVcGRhdGUoYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciB0aW1lc3RhbXBzID0gYXBpX3Jlc3BvbnNlLl9pdGVtcy5tYXAoZnVuY3Rpb24ocG9zdCkge1xuICAgIHJldHVybiBuZXcgRGF0ZShwb3N0Ll91cGRhdGVkKVxuICB9KTtcblxuICB2YXIgbGF0ZXN0ID0gbmV3IERhdGUoTWF0aC5tYXguYXBwbHkobnVsbCwgdGltZXN0YW1wcykpO1xuICByZXR1cm4gbGF0ZXN0LnRvSVNPU3RyaW5nKCkgLy8gY29udmVydCB0aW1lc3RhbXAgdG8gSVNPXG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHdlIHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgdGltZWxpbmUuXG4gKiBAcGFyYW0ge29iamVjdH0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKiBAcmV0dXJucyB7Ym9vbH1cbiAqL1xuZnVuY3Rpb24gaXNUaW1lbGluZUVuZChhcGlfcmVzcG9uc2UpIHtcbiAgdmFyIGl0ZW1zSW5WaWV3ID0gdm0uX2l0ZW1zLmxlbmd0aCArIHNldHRpbmdzLnBvc3RzUGVyUGFnZTtcbiAgcmV0dXJuIGFwaV9yZXNwb25zZS5fbWV0YS50b3RhbCA8PSBpdGVtc0luVmlldztcbn07XG5cbi8qKlxuICogU2V0IHVwIHZpZXdtb2RlbC5cbiAqL1xuZnVuY3Rpb24gaW5pdCgpIHtcbiAgdm0ubGF0ZXN0VXBkYXRlID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICB2bS50aW1lSW5pdGlhbGl6ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gIHJldHVybiB2bS5sYXRlc3RVcGRhdGU7XG59O1xuXG4vKipcbiAqIEJ1aWxkIHVybGVuY29kZWQgRWxhc3RpY1NlYXJjaCBRdWVyeXN0cmluZ1xuICogVE9ETzogYWJzdHJhY3QgYXdheSwgd2Ugb25seSBuZWVkIHN0aWNreSBmbGFnIGFuZCBvcmRlclxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBhcmd1bWVudHMgb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5zb3J0IC0gaWYgXCJvbGRlc3RfZmlyc3RcIiwgZ2V0IGl0ZW1zIGluIGFzY2VuZGluZyBvcmRlclxuICogQHBhcmFtIHtzdHJpbmd9IG9wdHMuZnJvbURhdGUgLSByZXN1bHRzIHdpdGggYSBJU08gODYwMSB0aW1lc3RhbXAgZ3QgdGhpcyBvbmx5XG4gKiBAcGFyYW0ge2Jvb2x9IG9wdHMuaGlnaGxpZ2h0c09ubHkgLSBnZXQgZWRpdG9yaWFsL2hpZ2hsaWdodGVkIGl0ZW1zIG9ubHlcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFF1ZXJ5c3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGdldFF1ZXJ5KG9wdHMpIHtcbiAgdmFyIHF1ZXJ5ID0ge1xuICAgIFwicXVlcnlcIjoge1xuICAgICAgXCJmaWx0ZXJlZFwiOiB7XG4gICAgICAgIFwiZmlsdGVyXCI6IHtcbiAgICAgICAgICBcImFuZFwiOiBbXG4gICAgICAgICAgICB7XCJ0ZXJtXCI6IHtcInN0aWNreVwiOiBmYWxzZX19LFxuICAgICAgICAgICAge1widGVybVwiOiB7XCJwb3N0X3N0YXR1c1wiOiBcIm9wZW5cIn19LFxuICAgICAgICAgICAge1wibm90XCI6IHtcInRlcm1cIjoge1wiZGVsZXRlZFwiOiB0cnVlfX19LFxuICAgICAgICAgICAge1wicmFuZ2VcIjoge1wiX3VwZGF0ZWRcIjoge1wibHRcIjogdm0udGltZUluaXRpYWxpemVkfX19XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcInNvcnRcIjpbe1xuICAgICAgXCJfdXBkYXRlZFwiOiB7XCJvcmRlclwiOiBcImRlc2NcIn1cbiAgICB9XVxuICB9O1xuXG4gIGlmIChvcHRzLmZyb21EYXRlKSB7XG4gICAgcXVlcnkucXVlcnkuZmlsdGVyZWQuZmlsdGVyLmFuZFszXS5yYW5nZS5fdXBkYXRlZCA9IHtcbiAgICAgIFwiZ3RcIjogb3B0cy5mcm9tRGF0ZVxuICAgIH1cbiAgfTtcblxuICBpZiAob3B0cy5oaWdobGlnaHRzT25seSA9PT0gdHJ1ZSkge1xuICAgIHF1ZXJ5LnF1ZXJ5LmZpbHRlcmVkLmZpbHRlci5hbmQucHVzaCh7XG4gICAgICAgIHRlcm06IHtoaWdobGlnaHQ6IHRydWV9XG4gICAgfSlcbiAgfTtcblxuICBpZiAob3B0cy5zb3J0ID09PSBcIm9sZGVzdF9maXJzdFwiKSB7XG4gICAgcXVlcnkuc29ydFswXS5fdXBkYXRlZC5vcmRlciA9IFwiYXNjXCJcbiAgfVxuXG4gIGlmIChvcHRzLnNvcnQgPT09IFwib2xkZXN0X2ZpcnN0XCIgfHwgb3B0cy5zb3J0ID09PSBcIm5ld2VzdF9maXJzdFwiKSB7XG4gICAgcXVlcnkucXVlcnkuZmlsdGVyZWQuZmlsdGVyLmFuZC5mb3JFYWNoKGZ1bmN0aW9uKHJ1bGUsIGluZGV4KSB7XG4gICAgICBpZiAocnVsZS5oYXNPd25Qcm9wZXJ0eSgncmFuZ2UnKSkge1xuICAgICAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kLnNwbGljZShpbmRleCwgMSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gZW5jb2RlVVJJKEpTT04uc3RyaW5naWZ5KHF1ZXJ5KSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRMYXRlc3RVcGRhdGU6IGdldExhdGVzdFVwZGF0ZSxcbiAgbG9hZFBvc3RzOiBsb2FkUG9zdHMsXG4gIGxvYWRQb3N0c1BhZ2U6IGxvYWRQb3N0c1BhZ2UsXG4gIGluaXQ6IGluaXRcbn1cbiIsIi8qISBCcm93c2VyIGJ1bmRsZSBvZiBudW5qdWNrcyAzLjAuMCAoc2xpbSwgb25seSB3b3JrcyB3aXRoIHByZWNvbXBpbGVkIHRlbXBsYXRlcykgKi9cbihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIm51bmp1Y2tzXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcIm51bmp1Y2tzXCJdID0gZmFjdG9yeSgpO1xufSkodGhpcywgZnVuY3Rpb24oKSB7XG5yZXR1cm4gLyoqKioqKi8gKGZ1bmN0aW9uKG1vZHVsZXMpIHsgLy8gd2VicGFja0Jvb3RzdHJhcFxuLyoqKioqKi8gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbi8qKioqKiovIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbi8qKioqKiovIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4vKioqKioqLyBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4vKioqKioqLyBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4vKioqKioqLyBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuLyoqKioqKi8gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4vKioqKioqLyBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuLyoqKioqKi8gXHRcdFx0ZXhwb3J0czoge30sXG4vKioqKioqLyBcdFx0XHRpZDogbW9kdWxlSWQsXG4vKioqKioqLyBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4vKioqKioqLyBcdFx0fTtcblxuLyoqKioqKi8gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuLyoqKioqKi8gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4vKioqKioqLyBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuLyoqKioqKi8gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4vKioqKioqLyBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbi8qKioqKiovIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4vKioqKioqLyBcdH1cblxuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuLyoqKioqKi8gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4vKioqKioqLyBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLyoqKioqKi8gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcbi8qKioqKiovIH0pXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKi8gKFtcbi8qIDAgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblx0dmFyIGVudiA9IF9fd2VicGFja19yZXF1aXJlX18oMik7XG5cdHZhciBMb2FkZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDE0KTtcblx0dmFyIGxvYWRlcnMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgcHJlY29tcGlsZSA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSB7fTtcblx0bW9kdWxlLmV4cG9ydHMuRW52aXJvbm1lbnQgPSBlbnYuRW52aXJvbm1lbnQ7XG5cdG1vZHVsZS5leHBvcnRzLlRlbXBsYXRlID0gZW52LlRlbXBsYXRlO1xuXG5cdG1vZHVsZS5leHBvcnRzLkxvYWRlciA9IExvYWRlcjtcblx0bW9kdWxlLmV4cG9ydHMuRmlsZVN5c3RlbUxvYWRlciA9IGxvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcjtcblx0bW9kdWxlLmV4cG9ydHMuUHJlY29tcGlsZWRMb2FkZXIgPSBsb2FkZXJzLlByZWNvbXBpbGVkTG9hZGVyO1xuXHRtb2R1bGUuZXhwb3J0cy5XZWJMb2FkZXIgPSBsb2FkZXJzLldlYkxvYWRlcjtcblxuXHRtb2R1bGUuZXhwb3J0cy5jb21waWxlciA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdG1vZHVsZS5leHBvcnRzLnBhcnNlciA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdG1vZHVsZS5leHBvcnRzLmxleGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0bW9kdWxlLmV4cG9ydHMucnVudGltZSA9IF9fd2VicGFja19yZXF1aXJlX18oOCk7XG5cdG1vZHVsZS5leHBvcnRzLmxpYiA9IGxpYjtcblx0bW9kdWxlLmV4cG9ydHMubm9kZXMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXG5cdG1vZHVsZS5leHBvcnRzLmluc3RhbGxKaW5qYUNvbXBhdCA9IF9fd2VicGFja19yZXF1aXJlX18oMTUpO1xuXG5cdC8vIEEgc2luZ2xlIGluc3RhbmNlIG9mIGFuIGVudmlyb25tZW50LCBzaW5jZSB0aGlzIGlzIHNvIGNvbW1vbmx5IHVzZWRcblxuXHR2YXIgZTtcblx0bW9kdWxlLmV4cG9ydHMuY29uZmlndXJlID0gZnVuY3Rpb24odGVtcGxhdGVzUGF0aCwgb3B0cykge1xuXHQgICAgb3B0cyA9IG9wdHMgfHwge307XG5cdCAgICBpZihsaWIuaXNPYmplY3QodGVtcGxhdGVzUGF0aCkpIHtcblx0ICAgICAgICBvcHRzID0gdGVtcGxhdGVzUGF0aDtcblx0ICAgICAgICB0ZW1wbGF0ZXNQYXRoID0gbnVsbDtcblx0ICAgIH1cblxuXHQgICAgdmFyIFRlbXBsYXRlTG9hZGVyO1xuXHQgICAgaWYobG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKSB7XG5cdCAgICAgICAgVGVtcGxhdGVMb2FkZXIgPSBuZXcgbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKHRlbXBsYXRlc1BhdGgsIHtcblx0ICAgICAgICAgICAgd2F0Y2g6IG9wdHMud2F0Y2gsXG5cdCAgICAgICAgICAgIG5vQ2FjaGU6IG9wdHMubm9DYWNoZVxuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXHQgICAgZWxzZSBpZihsb2FkZXJzLldlYkxvYWRlcikge1xuXHQgICAgICAgIFRlbXBsYXRlTG9hZGVyID0gbmV3IGxvYWRlcnMuV2ViTG9hZGVyKHRlbXBsYXRlc1BhdGgsIHtcblx0ICAgICAgICAgICAgdXNlQ2FjaGU6IG9wdHMud2ViICYmIG9wdHMud2ViLnVzZUNhY2hlLFxuXHQgICAgICAgICAgICBhc3luYzogb3B0cy53ZWIgJiYgb3B0cy53ZWIuYXN5bmNcblx0ICAgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgZSA9IG5ldyBlbnYuRW52aXJvbm1lbnQoVGVtcGxhdGVMb2FkZXIsIG9wdHMpO1xuXG5cdCAgICBpZihvcHRzICYmIG9wdHMuZXhwcmVzcykge1xuXHQgICAgICAgIGUuZXhwcmVzcyhvcHRzLmV4cHJlc3MpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gZTtcblx0fTtcblxuXHRtb2R1bGUuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24oc3JjLCBlbnYsIHBhdGgsIGVhZ2VyQ29tcGlsZSkge1xuXHQgICAgaWYoIWUpIHtcblx0ICAgICAgICBtb2R1bGUuZXhwb3J0cy5jb25maWd1cmUoKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiBuZXcgbW9kdWxlLmV4cG9ydHMuVGVtcGxhdGUoc3JjLCBlbnYsIHBhdGgsIGVhZ2VyQ29tcGlsZSk7XG5cdH07XG5cblx0bW9kdWxlLmV4cG9ydHMucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgY3R4LCBjYikge1xuXHQgICAgaWYoIWUpIHtcblx0ICAgICAgICBtb2R1bGUuZXhwb3J0cy5jb25maWd1cmUoKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIGUucmVuZGVyKG5hbWUsIGN0eCwgY2IpO1xuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzLnJlbmRlclN0cmluZyA9IGZ1bmN0aW9uKHNyYywgY3R4LCBjYikge1xuXHQgICAgaWYoIWUpIHtcblx0ICAgICAgICBtb2R1bGUuZXhwb3J0cy5jb25maWd1cmUoKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIGUucmVuZGVyU3RyaW5nKHNyYywgY3R4LCBjYik7XG5cdH07XG5cblx0aWYocHJlY29tcGlsZSkge1xuXHQgICAgbW9kdWxlLmV4cG9ydHMucHJlY29tcGlsZSA9IHByZWNvbXBpbGUucHJlY29tcGlsZTtcblx0ICAgIG1vZHVsZS5leHBvcnRzLnByZWNvbXBpbGVTdHJpbmcgPSBwcmVjb21waWxlLnByZWNvbXBpbGVTdHJpbmc7XG5cdH1cblxuXG4vKioqLyB9LFxuLyogMSAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlO1xuXHR2YXIgT2JqUHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG5cdHZhciBlc2NhcGVNYXAgPSB7XG5cdCAgICAnJic6ICcmYW1wOycsXG5cdCAgICAnXCInOiAnJnF1b3Q7Jyxcblx0ICAgICdcXCcnOiAnJiMzOTsnLFxuXHQgICAgJzwnOiAnJmx0OycsXG5cdCAgICAnPic6ICcmZ3Q7J1xuXHR9O1xuXG5cdHZhciBlc2NhcGVSZWdleCA9IC9bJlwiJzw+XS9nO1xuXG5cdHZhciBsb29rdXBFc2NhcGUgPSBmdW5jdGlvbihjaCkge1xuXHQgICAgcmV0dXJuIGVzY2FwZU1hcFtjaF07XG5cdH07XG5cblx0dmFyIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5cdGV4cG9ydHMucHJldHRpZnlFcnJvciA9IGZ1bmN0aW9uKHBhdGgsIHdpdGhJbnRlcm5hbHMsIGVycikge1xuXHQgICAgLy8ganNoaW50IC1XMDIyXG5cdCAgICAvLyBodHRwOi8vanNsaW50ZXJyb3JzLmNvbS9kby1ub3QtYXNzaWduLXRvLXRoZS1leGNlcHRpb24tcGFyYW1ldGVyXG5cdCAgICBpZiAoIWVyci5VcGRhdGUpIHtcblx0ICAgICAgICAvLyBub3Qgb25lIG9mIG91cnMsIGNhc3QgaXRcblx0ICAgICAgICBlcnIgPSBuZXcgZXhwb3J0cy5UZW1wbGF0ZUVycm9yKGVycik7XG5cdCAgICB9XG5cdCAgICBlcnIuVXBkYXRlKHBhdGgpO1xuXG5cdCAgICAvLyBVbmxlc3MgdGhleSBtYXJrZWQgdGhlIGRldiBmbGFnLCBzaG93IHRoZW0gYSB0cmFjZSBmcm9tIGhlcmVcblx0ICAgIGlmICghd2l0aEludGVybmFscykge1xuXHQgICAgICAgIHZhciBvbGQgPSBlcnI7XG5cdCAgICAgICAgZXJyID0gbmV3IEVycm9yKG9sZC5tZXNzYWdlKTtcblx0ICAgICAgICBlcnIubmFtZSA9IG9sZC5uYW1lO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gZXJyO1xuXHR9O1xuXG5cdGV4cG9ydHMuVGVtcGxhdGVFcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UsIGxpbmVubywgY29sbm8pIHtcblx0ICAgIHZhciBlcnIgPSB0aGlzO1xuXG5cdCAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIEVycm9yKSB7IC8vIGZvciBjYXN0aW5nIHJlZ3VsYXIganMgZXJyb3JzXG5cdCAgICAgICAgZXJyID0gbWVzc2FnZTtcblx0ICAgICAgICBtZXNzYWdlID0gbWVzc2FnZS5uYW1lICsgJzogJyArIG1lc3NhZ2UubWVzc2FnZTtcblxuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIGlmKGVyci5uYW1lID0gJycpIHt9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGNhdGNoKGUpIHtcblx0ICAgICAgICAgICAgLy8gSWYgd2UgY2FuJ3Qgc2V0IHRoZSBuYW1lIG9mIHRoZSBlcnJvciBvYmplY3QgaW4gdGhpc1xuXHQgICAgICAgICAgICAvLyBlbnZpcm9ubWVudCwgZG9uJ3QgdXNlIGl0XG5cdCAgICAgICAgICAgIGVyciA9IHRoaXM7XG5cdCAgICAgICAgfVxuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICBpZihFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuXHQgICAgICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShlcnIpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgZXJyLm5hbWUgPSAnVGVtcGxhdGUgcmVuZGVyIGVycm9yJztcblx0ICAgIGVyci5tZXNzYWdlID0gbWVzc2FnZTtcblx0ICAgIGVyci5saW5lbm8gPSBsaW5lbm87XG5cdCAgICBlcnIuY29sbm8gPSBjb2xubztcblx0ICAgIGVyci5maXJzdFVwZGF0ZSA9IHRydWU7XG5cblx0ICAgIGVyci5VcGRhdGUgPSBmdW5jdGlvbihwYXRoKSB7XG5cdCAgICAgICAgdmFyIG1lc3NhZ2UgPSAnKCcgKyAocGF0aCB8fCAndW5rbm93biBwYXRoJykgKyAnKSc7XG5cblx0ICAgICAgICAvLyBvbmx5IHNob3cgbGluZW5vICsgY29sbm8gbmV4dCB0byBwYXRoIG9mIHRlbXBsYXRlXG5cdCAgICAgICAgLy8gd2hlcmUgZXJyb3Igb2NjdXJyZWRcblx0ICAgICAgICBpZiAodGhpcy5maXJzdFVwZGF0ZSkge1xuXHQgICAgICAgICAgICBpZih0aGlzLmxpbmVubyAmJiB0aGlzLmNvbG5vKSB7XG5cdCAgICAgICAgICAgICAgICBtZXNzYWdlICs9ICcgW0xpbmUgJyArIHRoaXMubGluZW5vICsgJywgQ29sdW1uICcgKyB0aGlzLmNvbG5vICsgJ10nO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYodGhpcy5saW5lbm8pIHtcblx0ICAgICAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyBbTGluZSAnICsgdGhpcy5saW5lbm8gKyAnXSc7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBtZXNzYWdlICs9ICdcXG4gJztcblx0ICAgICAgICBpZiAodGhpcy5maXJzdFVwZGF0ZSkge1xuXHQgICAgICAgICAgICBtZXNzYWdlICs9ICcgJztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlICsgKHRoaXMubWVzc2FnZSB8fCAnJyk7XG5cdCAgICAgICAgdGhpcy5maXJzdFVwZGF0ZSA9IGZhbHNlO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfTtcblxuXHQgICAgcmV0dXJuIGVycjtcblx0fTtcblxuXHRleHBvcnRzLlRlbXBsYXRlRXJyb3IucHJvdG90eXBlID0gRXJyb3IucHJvdG90eXBlO1xuXG5cdGV4cG9ydHMuZXNjYXBlID0gZnVuY3Rpb24odmFsKSB7XG5cdCAgcmV0dXJuIHZhbC5yZXBsYWNlKGVzY2FwZVJlZ2V4LCBsb29rdXBFc2NhcGUpO1xuXHR9O1xuXG5cdGV4cG9ydHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblx0fTtcblxuXHRleHBvcnRzLmlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcblx0fTtcblxuXHRleHBvcnRzLmlzU3RyaW5nID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBTdHJpbmddJztcblx0fTtcblxuXHRleHBvcnRzLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBPYmplY3RdJztcblx0fTtcblxuXHRleHBvcnRzLmdyb3VwQnkgPSBmdW5jdGlvbihvYmosIHZhbCkge1xuXHQgICAgdmFyIHJlc3VsdCA9IHt9O1xuXHQgICAgdmFyIGl0ZXJhdG9yID0gZXhwb3J0cy5pc0Z1bmN0aW9uKHZhbCkgPyB2YWwgOiBmdW5jdGlvbihvYmopIHsgcmV0dXJuIG9ialt2YWxdOyB9O1xuXHQgICAgZm9yKHZhciBpPTA7IGk8b2JqLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgdmFyIHZhbHVlID0gb2JqW2ldO1xuXHQgICAgICAgIHZhciBrZXkgPSBpdGVyYXRvcih2YWx1ZSwgaSk7XG5cdCAgICAgICAgKHJlc3VsdFtrZXldIHx8IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gcmVzdWx0O1xuXHR9O1xuXG5cdGV4cG9ydHMudG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKG9iaik7XG5cdH07XG5cblx0ZXhwb3J0cy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcblx0ICAgIHZhciByZXN1bHQgPSBbXTtcblx0ICAgIGlmICghYXJyYXkpIHtcblx0ICAgICAgICByZXR1cm4gcmVzdWx0O1xuXHQgICAgfVxuXHQgICAgdmFyIGluZGV4ID0gLTEsXG5cdCAgICBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG5cdCAgICBjb250YWlucyA9IGV4cG9ydHMudG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuXG5cdCAgICB3aGlsZSgrK2luZGV4IDwgbGVuZ3RoKSB7XG5cdCAgICAgICAgaWYoZXhwb3J0cy5pbmRleE9mKGNvbnRhaW5zLCBhcnJheVtpbmRleF0pID09PSAtMSkge1xuXHQgICAgICAgICAgICByZXN1bHQucHVzaChhcnJheVtpbmRleF0pO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHJldHVybiByZXN1bHQ7XG5cdH07XG5cblx0ZXhwb3J0cy5leHRlbmQgPSBmdW5jdGlvbihvYmosIG9iajIpIHtcblx0ICAgIGZvcih2YXIgayBpbiBvYmoyKSB7XG5cdCAgICAgICAgb2JqW2tdID0gb2JqMltrXTtcblx0ICAgIH1cblx0ICAgIHJldHVybiBvYmo7XG5cdH07XG5cblx0ZXhwb3J0cy5yZXBlYXQgPSBmdW5jdGlvbihjaGFyXywgbikge1xuXHQgICAgdmFyIHN0ciA9ICcnO1xuXHQgICAgZm9yKHZhciBpPTA7IGk8bjsgaSsrKSB7XG5cdCAgICAgICAgc3RyICs9IGNoYXJfO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHN0cjtcblx0fTtcblxuXHRleHBvcnRzLmVhY2ggPSBmdW5jdGlvbihvYmosIGZ1bmMsIGNvbnRleHQpIHtcblx0ICAgIGlmKG9iaiA9PSBudWxsKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICBpZihBcnJheVByb3RvLmVhY2ggJiYgb2JqLmVhY2ggPT09IEFycmF5UHJvdG8uZWFjaCkge1xuXHQgICAgICAgIG9iai5mb3JFYWNoKGZ1bmMsIGNvbnRleHQpO1xuXHQgICAgfVxuXHQgICAgZWxzZSBpZihvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuXHQgICAgICAgIGZvcih2YXIgaT0wLCBsPW9iai5sZW5ndGg7IGk8bDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGZ1bmMuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHR9O1xuXG5cdGV4cG9ydHMubWFwID0gZnVuY3Rpb24ob2JqLCBmdW5jKSB7XG5cdCAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXHQgICAgaWYob2JqID09IG51bGwpIHtcblx0ICAgICAgICByZXR1cm4gcmVzdWx0cztcblx0ICAgIH1cblxuXHQgICAgaWYoQXJyYXlQcm90by5tYXAgJiYgb2JqLm1hcCA9PT0gQXJyYXlQcm90by5tYXApIHtcblx0ICAgICAgICByZXR1cm4gb2JqLm1hcChmdW5jKTtcblx0ICAgIH1cblxuXHQgICAgZm9yKHZhciBpPTA7IGk8b2JqLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgcmVzdWx0c1tyZXN1bHRzLmxlbmd0aF0gPSBmdW5jKG9ialtpXSwgaSk7XG5cdCAgICB9XG5cblx0ICAgIGlmKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG5cdCAgICAgICAgcmVzdWx0cy5sZW5ndGggPSBvYmoubGVuZ3RoO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gcmVzdWx0cztcblx0fTtcblxuXHRleHBvcnRzLmFzeW5jSXRlciA9IGZ1bmN0aW9uKGFyciwgaXRlciwgY2IpIHtcblx0ICAgIHZhciBpID0gLTE7XG5cblx0ICAgIGZ1bmN0aW9uIG5leHQoKSB7XG5cdCAgICAgICAgaSsrO1xuXG5cdCAgICAgICAgaWYoaSA8IGFyci5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgaXRlcihhcnJbaV0sIGksIG5leHQsIGNiKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGNiKCk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBuZXh0KCk7XG5cdH07XG5cblx0ZXhwb3J0cy5hc3luY0ZvciA9IGZ1bmN0aW9uKG9iaiwgaXRlciwgY2IpIHtcblx0ICAgIHZhciBrZXlzID0gZXhwb3J0cy5rZXlzKG9iaik7XG5cdCAgICB2YXIgbGVuID0ga2V5cy5sZW5ndGg7XG5cdCAgICB2YXIgaSA9IC0xO1xuXG5cdCAgICBmdW5jdGlvbiBuZXh0KCkge1xuXHQgICAgICAgIGkrKztcblx0ICAgICAgICB2YXIgayA9IGtleXNbaV07XG5cblx0ICAgICAgICBpZihpIDwgbGVuKSB7XG5cdCAgICAgICAgICAgIGl0ZXIoaywgb2JqW2tdLCBpLCBsZW4sIG5leHQpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgY2IoKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIG5leHQoKTtcblx0fTtcblxuXHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9pbmRleE9mI1BvbHlmaWxsXG5cdGV4cG9ydHMuaW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mID9cblx0ICAgIGZ1bmN0aW9uIChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuXHQgICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGFyciwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KTtcblx0ICAgIH0gOlxuXHQgICAgZnVuY3Rpb24gKGFyciwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG5cdCAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoID4+PiAwOyAvLyBIYWNrIHRvIGNvbnZlcnQgb2JqZWN0Lmxlbmd0aCB0byBhIFVJbnQzMlxuXG5cdCAgICAgICAgZnJvbUluZGV4ID0gK2Zyb21JbmRleCB8fCAwO1xuXG5cdCAgICAgICAgaWYoTWF0aC5hYnMoZnJvbUluZGV4KSA9PT0gSW5maW5pdHkpIHtcblx0ICAgICAgICAgICAgZnJvbUluZGV4ID0gMDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZihmcm9tSW5kZXggPCAwKSB7XG5cdCAgICAgICAgICAgIGZyb21JbmRleCArPSBsZW5ndGg7XG5cdCAgICAgICAgICAgIGlmIChmcm9tSW5kZXggPCAwKSB7XG5cdCAgICAgICAgICAgICAgICBmcm9tSW5kZXggPSAwO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yKDtmcm9tSW5kZXggPCBsZW5ndGg7IGZyb21JbmRleCsrKSB7XG5cdCAgICAgICAgICAgIGlmIChhcnJbZnJvbUluZGV4XSA9PT0gc2VhcmNoRWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZyb21JbmRleDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiAtMTtcblx0ICAgIH07XG5cblx0aWYoIUFycmF5LnByb3RvdHlwZS5tYXApIHtcblx0ICAgIEFycmF5LnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcCBpcyB1bmltcGxlbWVudGVkIGZvciB0aGlzIGpzIGVuZ2luZScpO1xuXHQgICAgfTtcblx0fVxuXG5cdGV4cG9ydHMua2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgaWYoT2JqZWN0LnByb3RvdHlwZS5rZXlzKSB7XG5cdCAgICAgICAgcmV0dXJuIG9iai5rZXlzKCk7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICB2YXIga2V5cyA9IFtdO1xuXHQgICAgICAgIGZvcih2YXIgayBpbiBvYmopIHtcblx0ICAgICAgICAgICAgaWYob2JqLmhhc093blByb3BlcnR5KGspKSB7XG5cdCAgICAgICAgICAgICAgICBrZXlzLnB1c2goayk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGtleXM7XG5cdCAgICB9XG5cdH07XG5cblx0ZXhwb3J0cy5pbk9wZXJhdG9yID0gZnVuY3Rpb24gKGtleSwgdmFsKSB7XG5cdCAgICBpZiAoZXhwb3J0cy5pc0FycmF5KHZhbCkpIHtcblx0ICAgICAgICByZXR1cm4gZXhwb3J0cy5pbmRleE9mKHZhbCwga2V5KSAhPT0gLTE7XG5cdCAgICB9IGVsc2UgaWYgKGV4cG9ydHMuaXNPYmplY3QodmFsKSkge1xuXHQgICAgICAgIHJldHVybiBrZXkgaW4gdmFsO1xuXHQgICAgfSBlbHNlIGlmIChleHBvcnRzLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICByZXR1cm4gdmFsLmluZGV4T2Yoa2V5KSAhPT0gLTE7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHVzZSBcImluXCIgb3BlcmF0b3IgdG8gc2VhcmNoIGZvciBcIidcblx0ICAgICAgICAgICAgKyBrZXkgKyAnXCIgaW4gdW5leHBlY3RlZCB0eXBlcy4nKTtcblx0ICAgIH1cblx0fTtcblxuXG4vKioqLyB9LFxuLyogMiAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBwYXRoID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIGFzYXAgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDQpO1xuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblx0dmFyIE9iaiA9IF9fd2VicGFja19yZXF1aXJlX18oNik7XG5cdHZhciBjb21waWxlciA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBidWlsdGluX2ZpbHRlcnMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDcpO1xuXHR2YXIgYnVpbHRpbl9sb2FkZXJzID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIHJ1bnRpbWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDgpO1xuXHR2YXIgZ2xvYmFscyA9IF9fd2VicGFja19yZXF1aXJlX18oOSk7XG5cdHZhciB3YXRlcmZhbGwgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEwKTtcblx0dmFyIEZyYW1lID0gcnVudGltZS5GcmFtZTtcblx0dmFyIFRlbXBsYXRlO1xuXG5cdC8vIFVuY29uZGl0aW9uYWxseSBsb2FkIGluIHRoaXMgbG9hZGVyLCBldmVuIGlmIG5vIG90aGVyIG9uZXMgYXJlXG5cdC8vIGluY2x1ZGVkIChwb3NzaWJsZSBpbiB0aGUgc2xpbSBicm93c2VyIGJ1aWxkKVxuXHRidWlsdGluX2xvYWRlcnMuUHJlY29tcGlsZWRMb2FkZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEzKTtcblxuXHQvLyBJZiB0aGUgdXNlciBpcyB1c2luZyB0aGUgYXN5bmMgQVBJLCAqYWx3YXlzKiBjYWxsIGl0XG5cdC8vIGFzeW5jaHJvbm91c2x5IGV2ZW4gaWYgdGhlIHRlbXBsYXRlIHdhcyBzeW5jaHJvbm91cy5cblx0ZnVuY3Rpb24gY2FsbGJhY2tBc2FwKGNiLCBlcnIsIHJlcykge1xuXHQgICAgYXNhcChmdW5jdGlvbigpIHsgY2IoZXJyLCByZXMpOyB9KTtcblx0fVxuXG5cdHZhciBFbnZpcm9ubWVudCA9IE9iai5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24obG9hZGVycywgb3B0cykge1xuXHQgICAgICAgIC8vIFRoZSBkZXYgZmxhZyBkZXRlcm1pbmVzIHRoZSB0cmFjZSB0aGF0J2xsIGJlIHNob3duIG9uIGVycm9ycy5cblx0ICAgICAgICAvLyBJZiBzZXQgdG8gdHJ1ZSwgcmV0dXJucyB0aGUgZnVsbCB0cmFjZSBmcm9tIHRoZSBlcnJvciBwb2ludCxcblx0ICAgICAgICAvLyBvdGhlcndpc2Ugd2lsbCByZXR1cm4gdHJhY2Ugc3RhcnRpbmcgZnJvbSBUZW1wbGF0ZS5yZW5kZXJcblx0ICAgICAgICAvLyAodGhlIGZ1bGwgdHJhY2UgZnJvbSB3aXRoaW4gbnVuanVja3MgbWF5IGNvbmZ1c2UgZGV2ZWxvcGVycyB1c2luZ1xuXHQgICAgICAgIC8vICB0aGUgbGlicmFyeSlcblx0ICAgICAgICAvLyBkZWZhdWx0cyB0byBmYWxzZVxuXHQgICAgICAgIG9wdHMgPSB0aGlzLm9wdHMgPSBvcHRzIHx8IHt9O1xuXHQgICAgICAgIHRoaXMub3B0cy5kZXYgPSAhIW9wdHMuZGV2O1xuXG5cdCAgICAgICAgLy8gVGhlIGF1dG9lc2NhcGUgZmxhZyBzZXRzIGdsb2JhbCBhdXRvZXNjYXBpbmcuIElmIHRydWUsXG5cdCAgICAgICAgLy8gZXZlcnkgc3RyaW5nIHZhcmlhYmxlIHdpbGwgYmUgZXNjYXBlZCBieSBkZWZhdWx0LlxuXHQgICAgICAgIC8vIElmIGZhbHNlLCBzdHJpbmdzIGNhbiBiZSBtYW51YWxseSBlc2NhcGVkIHVzaW5nIHRoZSBgZXNjYXBlYCBmaWx0ZXIuXG5cdCAgICAgICAgLy8gZGVmYXVsdHMgdG8gdHJ1ZVxuXHQgICAgICAgIHRoaXMub3B0cy5hdXRvZXNjYXBlID0gb3B0cy5hdXRvZXNjYXBlICE9IG51bGwgPyBvcHRzLmF1dG9lc2NhcGUgOiB0cnVlO1xuXG5cdCAgICAgICAgLy8gSWYgdHJ1ZSwgdGhpcyB3aWxsIG1ha2UgdGhlIHN5c3RlbSB0aHJvdyBlcnJvcnMgaWYgdHJ5aW5nXG5cdCAgICAgICAgLy8gdG8gb3V0cHV0IGEgbnVsbCBvciB1bmRlZmluZWQgdmFsdWVcblx0ICAgICAgICB0aGlzLm9wdHMudGhyb3dPblVuZGVmaW5lZCA9ICEhb3B0cy50aHJvd09uVW5kZWZpbmVkO1xuXHQgICAgICAgIHRoaXMub3B0cy50cmltQmxvY2tzID0gISFvcHRzLnRyaW1CbG9ja3M7XG5cdCAgICAgICAgdGhpcy5vcHRzLmxzdHJpcEJsb2NrcyA9ICEhb3B0cy5sc3RyaXBCbG9ja3M7XG5cblx0ICAgICAgICB0aGlzLmxvYWRlcnMgPSBbXTtcblxuXHQgICAgICAgIGlmKCFsb2FkZXJzKSB7XG5cdCAgICAgICAgICAgIC8vIFRoZSBmaWxlc3lzdGVtIGxvYWRlciBpcyBvbmx5IGF2YWlsYWJsZSBzZXJ2ZXItc2lkZVxuXHQgICAgICAgICAgICBpZihidWlsdGluX2xvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcikge1xuXHQgICAgICAgICAgICAgICAgdGhpcy5sb2FkZXJzID0gW25ldyBidWlsdGluX2xvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcigndmlld3MnKV07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZihidWlsdGluX2xvYWRlcnMuV2ViTG9hZGVyKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBbbmV3IGJ1aWx0aW5fbG9hZGVycy5XZWJMb2FkZXIoJy92aWV3cycpXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdGhpcy5sb2FkZXJzID0gbGliLmlzQXJyYXkobG9hZGVycykgPyBsb2FkZXJzIDogW2xvYWRlcnNdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIEl0J3MgZWFzeSB0byB1c2UgcHJlY29tcGlsZWQgdGVtcGxhdGVzOiBqdXN0IGluY2x1ZGUgdGhlbVxuXHQgICAgICAgIC8vIGJlZm9yZSB5b3UgY29uZmlndXJlIG51bmp1Y2tzIGFuZCB0aGlzIHdpbGwgYXV0b21hdGljYWxseVxuXHQgICAgICAgIC8vIHBpY2sgaXQgdXAgYW5kIHVzZSBpdFxuXHQgICAgICAgIGlmKCh0cnVlKSAmJiB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCkge1xuXHQgICAgICAgICAgICB0aGlzLmxvYWRlcnMudW5zaGlmdChcblx0ICAgICAgICAgICAgICAgIG5ldyBidWlsdGluX2xvYWRlcnMuUHJlY29tcGlsZWRMb2FkZXIod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQpXG5cdCAgICAgICAgICAgICk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5pbml0Q2FjaGUoKTtcblxuXHQgICAgICAgIHRoaXMuZ2xvYmFscyA9IGdsb2JhbHMoKTtcblx0ICAgICAgICB0aGlzLmZpbHRlcnMgPSB7fTtcblx0ICAgICAgICB0aGlzLmFzeW5jRmlsdGVycyA9IFtdO1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9ucyA9IHt9O1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9uc0xpc3QgPSBbXTtcblxuXHQgICAgICAgIGZvcih2YXIgbmFtZSBpbiBidWlsdGluX2ZpbHRlcnMpIHtcblx0ICAgICAgICAgICAgdGhpcy5hZGRGaWx0ZXIobmFtZSwgYnVpbHRpbl9maWx0ZXJzW25hbWVdKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBpbml0Q2FjaGU6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIC8vIENhY2hpbmcgYW5kIGNhY2hlIGJ1c3Rpbmdcblx0ICAgICAgICBsaWIuZWFjaCh0aGlzLmxvYWRlcnMsIGZ1bmN0aW9uKGxvYWRlcikge1xuXHQgICAgICAgICAgICBsb2FkZXIuY2FjaGUgPSB7fTtcblxuXHQgICAgICAgICAgICBpZih0eXBlb2YgbG9hZGVyLm9uID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgICAgICBsb2FkZXIub24oJ3VwZGF0ZScsIGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbG9hZGVyLmNhY2hlW3RlbXBsYXRlXSA9IG51bGw7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXHQgICAgfSxcblxuXHQgICAgYWRkRXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lLCBleHRlbnNpb24pIHtcblx0ICAgICAgICBleHRlbnNpb24uX25hbWUgPSBuYW1lO1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9uc1tuYW1lXSA9IGV4dGVuc2lvbjtcblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnNMaXN0LnB1c2goZXh0ZW5zaW9uKTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIHJlbW92ZUV4dGVuc2lvbjogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHZhciBleHRlbnNpb24gPSB0aGlzLmdldEV4dGVuc2lvbihuYW1lKTtcblx0ICAgICAgICBpZiAoIWV4dGVuc2lvbikgcmV0dXJuO1xuXG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zTGlzdCA9IGxpYi53aXRob3V0KHRoaXMuZXh0ZW5zaW9uc0xpc3QsIGV4dGVuc2lvbik7XG5cdCAgICAgICAgZGVsZXRlIHRoaXMuZXh0ZW5zaW9uc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGdldEV4dGVuc2lvbjogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLmV4dGVuc2lvbnNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICBoYXNFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICByZXR1cm4gISF0aGlzLmV4dGVuc2lvbnNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICBhZGRHbG9iYWw6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG5cdCAgICAgICAgdGhpcy5nbG9iYWxzW25hbWVdID0gdmFsdWU7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRHbG9iYWw6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZih0eXBlb2YgdGhpcy5nbG9iYWxzW25hbWVdID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2dsb2JhbCBub3QgZm91bmQ6ICcgKyBuYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuZ2xvYmFsc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEZpbHRlcjogZnVuY3Rpb24obmFtZSwgZnVuYywgYXN5bmMpIHtcblx0ICAgICAgICB2YXIgd3JhcHBlZCA9IGZ1bmM7XG5cblx0ICAgICAgICBpZihhc3luYykge1xuXHQgICAgICAgICAgICB0aGlzLmFzeW5jRmlsdGVycy5wdXNoKG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICB0aGlzLmZpbHRlcnNbbmFtZV0gPSB3cmFwcGVkO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0RmlsdGVyOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgaWYoIXRoaXMuZmlsdGVyc1tuYW1lXSkge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZpbHRlciBub3QgZm91bmQ6ICcgKyBuYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIHJlc29sdmVUZW1wbGF0ZTogZnVuY3Rpb24obG9hZGVyLCBwYXJlbnROYW1lLCBmaWxlbmFtZSkge1xuXHQgICAgICAgIHZhciBpc1JlbGF0aXZlID0gKGxvYWRlci5pc1JlbGF0aXZlICYmIHBhcmVudE5hbWUpPyBsb2FkZXIuaXNSZWxhdGl2ZShmaWxlbmFtZSkgOiBmYWxzZTtcblx0ICAgICAgICByZXR1cm4gKGlzUmVsYXRpdmUgJiYgbG9hZGVyLnJlc29sdmUpPyBsb2FkZXIucmVzb2x2ZShwYXJlbnROYW1lLCBmaWxlbmFtZSkgOiBmaWxlbmFtZTtcblx0ICAgIH0sXG5cblx0ICAgIGdldFRlbXBsYXRlOiBmdW5jdGlvbihuYW1lLCBlYWdlckNvbXBpbGUsIHBhcmVudE5hbWUsIGlnbm9yZU1pc3NpbmcsIGNiKSB7XG5cdCAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXHQgICAgICAgIHZhciB0bXBsID0gbnVsbDtcblx0ICAgICAgICBpZihuYW1lICYmIG5hbWUucmF3KSB7XG5cdCAgICAgICAgICAgIC8vIHRoaXMgZml4ZXMgYXV0b2VzY2FwZSBmb3IgdGVtcGxhdGVzIHJlZmVyZW5jZWQgaW4gc3ltYm9sc1xuXHQgICAgICAgICAgICBuYW1lID0gbmFtZS5yYXc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYobGliLmlzRnVuY3Rpb24ocGFyZW50TmFtZSkpIHtcblx0ICAgICAgICAgICAgY2IgPSBwYXJlbnROYW1lO1xuXHQgICAgICAgICAgICBwYXJlbnROYW1lID0gbnVsbDtcblx0ICAgICAgICAgICAgZWFnZXJDb21waWxlID0gZWFnZXJDb21waWxlIHx8IGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKGVhZ2VyQ29tcGlsZSkpIHtcblx0ICAgICAgICAgICAgY2IgPSBlYWdlckNvbXBpbGU7XG5cdCAgICAgICAgICAgIGVhZ2VyQ29tcGlsZSA9IGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChuYW1lIGluc3RhbmNlb2YgVGVtcGxhdGUpIHtcblx0ICAgICAgICAgICAgIHRtcGwgPSBuYW1lO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RlbXBsYXRlIG5hbWVzIG11c3QgYmUgYSBzdHJpbmc6ICcgKyBuYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sb2FkZXJzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgX25hbWUgPSB0aGlzLnJlc29sdmVUZW1wbGF0ZSh0aGlzLmxvYWRlcnNbaV0sIHBhcmVudE5hbWUsIG5hbWUpO1xuXHQgICAgICAgICAgICAgICAgdG1wbCA9IHRoaXMubG9hZGVyc1tpXS5jYWNoZVtfbmFtZV07XG5cdCAgICAgICAgICAgICAgICBpZiAodG1wbCkgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZih0bXBsKSB7XG5cdCAgICAgICAgICAgIGlmKGVhZ2VyQ29tcGlsZSkge1xuXHQgICAgICAgICAgICAgICAgdG1wbC5jb21waWxlKCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZihjYikge1xuXHQgICAgICAgICAgICAgICAgY2IobnVsbCwgdG1wbCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdG1wbDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBzeW5jUmVzdWx0O1xuXHQgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdCAgICAgICAgICAgIHZhciBjcmVhdGVUZW1wbGF0ZSA9IGZ1bmN0aW9uKGVyciwgaW5mbykge1xuXHQgICAgICAgICAgICAgICAgaWYoIWluZm8gJiYgIWVycikge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKCFpZ25vcmVNaXNzaW5nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVyciA9IG5ldyBFcnJvcigndGVtcGxhdGUgbm90IGZvdW5kOiAnICsgbmFtZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoY2IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2IoZXJyKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgdG1wbDtcblx0ICAgICAgICAgICAgICAgICAgICBpZihpbmZvKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRtcGwgPSBuZXcgVGVtcGxhdGUoaW5mby5zcmMsIF90aGlzLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucGF0aCwgZWFnZXJDb21waWxlKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZighaW5mby5ub0NhY2hlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmxvYWRlci5jYWNoZVtuYW1lXSA9IHRtcGw7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRtcGwgPSBuZXcgVGVtcGxhdGUoJycsIF90aGlzLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcnLCBlYWdlckNvbXBpbGUpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIGlmKGNiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNiKG51bGwsIHRtcGwpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHRtcGw7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgIGxpYi5hc3luY0l0ZXIodGhpcy5sb2FkZXJzLCBmdW5jdGlvbihsb2FkZXIsIGksIG5leHQsIGRvbmUpIHtcblx0ICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZShlcnIsIHNyYykge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGVycikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBkb25lKGVycik7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYoc3JjKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNyYy5sb2FkZXIgPSBsb2FkZXI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUobnVsbCwgc3JjKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIG5leHQoKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8vIFJlc29sdmUgbmFtZSByZWxhdGl2ZSB0byBwYXJlbnROYW1lXG5cdCAgICAgICAgICAgICAgICBuYW1lID0gdGhhdC5yZXNvbHZlVGVtcGxhdGUobG9hZGVyLCBwYXJlbnROYW1lLCBuYW1lKTtcblxuXHQgICAgICAgICAgICAgICAgaWYobG9hZGVyLmFzeW5jKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbG9hZGVyLmdldFNvdXJjZShuYW1lLCBoYW5kbGUpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaGFuZGxlKG51bGwsIGxvYWRlci5nZXRTb3VyY2UobmFtZSkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9LCBjcmVhdGVUZW1wbGF0ZSk7XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHN5bmNSZXN1bHQ7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgZXhwcmVzczogZnVuY3Rpb24oYXBwKSB7XG5cdCAgICAgICAgdmFyIGVudiA9IHRoaXM7XG5cblx0ICAgICAgICBmdW5jdGlvbiBOdW5qdWNrc1ZpZXcobmFtZSwgb3B0cykge1xuXHQgICAgICAgICAgICB0aGlzLm5hbWUgICAgICAgICAgPSBuYW1lO1xuXHQgICAgICAgICAgICB0aGlzLnBhdGggICAgICAgICAgPSBuYW1lO1xuXHQgICAgICAgICAgICB0aGlzLmRlZmF1bHRFbmdpbmUgPSBvcHRzLmRlZmF1bHRFbmdpbmU7XG5cdCAgICAgICAgICAgIHRoaXMuZXh0ICAgICAgICAgICA9IHBhdGguZXh0bmFtZShuYW1lKTtcblx0ICAgICAgICAgICAgaWYgKCF0aGlzLmV4dCAmJiAhdGhpcy5kZWZhdWx0RW5naW5lKSB0aHJvdyBuZXcgRXJyb3IoJ05vIGRlZmF1bHQgZW5naW5lIHdhcyBzcGVjaWZpZWQgYW5kIG5vIGV4dGVuc2lvbiB3YXMgcHJvdmlkZWQuJyk7XG5cdCAgICAgICAgICAgIGlmICghdGhpcy5leHQpIHRoaXMubmFtZSArPSAodGhpcy5leHQgPSAoJy4nICE9PSB0aGlzLmRlZmF1bHRFbmdpbmVbMF0gPyAnLicgOiAnJykgKyB0aGlzLmRlZmF1bHRFbmdpbmUpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIE51bmp1Y2tzVmlldy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24ob3B0cywgY2IpIHtcblx0ICAgICAgICAgIGVudi5yZW5kZXIodGhpcy5uYW1lLCBvcHRzLCBjYik7XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIGFwcC5zZXQoJ3ZpZXcnLCBOdW5qdWNrc1ZpZXcpO1xuXHQgICAgICAgIGFwcC5zZXQoJ251bmp1Y2tzRW52JywgdGhpcyk7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICByZW5kZXI6IGZ1bmN0aW9uKG5hbWUsIGN0eCwgY2IpIHtcblx0ICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihjdHgpKSB7XG5cdCAgICAgICAgICAgIGNiID0gY3R4O1xuXHQgICAgICAgICAgICBjdHggPSBudWxsO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIFdlIHN1cHBvcnQgYSBzeW5jaHJvbm91cyBBUEkgdG8gbWFrZSBpdCBlYXNpZXIgdG8gbWlncmF0ZVxuXHQgICAgICAgIC8vIGV4aXN0aW5nIGNvZGUgdG8gYXN5bmMuIFRoaXMgd29ya3MgYmVjYXVzZSBpZiB5b3UgZG9uJ3QgZG9cblx0ICAgICAgICAvLyBhbnl0aGluZyBhc3luYyB3b3JrLCB0aGUgd2hvbGUgdGhpbmcgaXMgYWN0dWFsbHkgcnVuXG5cdCAgICAgICAgLy8gc3luY2hyb25vdXNseS5cblx0ICAgICAgICB2YXIgc3luY1Jlc3VsdCA9IG51bGw7XG5cblx0ICAgICAgICB0aGlzLmdldFRlbXBsYXRlKG5hbWUsIGZ1bmN0aW9uKGVyciwgdG1wbCkge1xuXHQgICAgICAgICAgICBpZihlcnIgJiYgY2IpIHtcblx0ICAgICAgICAgICAgICAgIGNhbGxiYWNrQXNhcChjYiwgZXJyKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKGVycikge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHRtcGwucmVuZGVyKGN0eCwgY2IpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcblx0ICAgIH0sXG5cblx0ICAgIHJlbmRlclN0cmluZzogZnVuY3Rpb24oc3JjLCBjdHgsIG9wdHMsIGNiKSB7XG5cdCAgICAgICAgaWYobGliLmlzRnVuY3Rpb24ob3B0cykpIHtcblx0ICAgICAgICAgICAgY2IgPSBvcHRzO1xuXHQgICAgICAgICAgICBvcHRzID0ge307XG5cdCAgICAgICAgfVxuXHQgICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG5cdCAgICAgICAgdmFyIHRtcGwgPSBuZXcgVGVtcGxhdGUoc3JjLCB0aGlzLCBvcHRzLnBhdGgpO1xuXHQgICAgICAgIHJldHVybiB0bXBsLnJlbmRlcihjdHgsIGNiKTtcblx0ICAgIH0sXG5cblx0ICAgIHdhdGVyZmFsbDogd2F0ZXJmYWxsXG5cdH0pO1xuXG5cdHZhciBDb250ZXh0ID0gT2JqLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbihjdHgsIGJsb2NrcywgZW52KSB7XG5cdCAgICAgICAgLy8gSGFzIHRvIGJlIHRpZWQgdG8gYW4gZW52aXJvbm1lbnQgc28gd2UgY2FuIHRhcCBpbnRvIGl0cyBnbG9iYWxzLlxuXHQgICAgICAgIHRoaXMuZW52ID0gZW52IHx8IG5ldyBFbnZpcm9ubWVudCgpO1xuXG5cdCAgICAgICAgLy8gTWFrZSBhIGR1cGxpY2F0ZSBvZiBjdHhcblx0ICAgICAgICB0aGlzLmN0eCA9IHt9O1xuXHQgICAgICAgIGZvcih2YXIgayBpbiBjdHgpIHtcblx0ICAgICAgICAgICAgaWYoY3R4Lmhhc093blByb3BlcnR5KGspKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLmN0eFtrXSA9IGN0eFtrXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMuYmxvY2tzID0ge307XG5cdCAgICAgICAgdGhpcy5leHBvcnRlZCA9IFtdO1xuXG5cdCAgICAgICAgZm9yKHZhciBuYW1lIGluIGJsb2Nrcykge1xuXHQgICAgICAgICAgICB0aGlzLmFkZEJsb2NrKG5hbWUsIGJsb2Nrc1tuYW1lXSk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgbG9va3VwOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgLy8gVGhpcyBpcyBvbmUgb2YgdGhlIG1vc3QgY2FsbGVkIGZ1bmN0aW9ucywgc28gb3B0aW1pemUgZm9yXG5cdCAgICAgICAgLy8gdGhlIHR5cGljYWwgY2FzZSB3aGVyZSB0aGUgbmFtZSBpc24ndCBpbiB0aGUgZ2xvYmFsc1xuXHQgICAgICAgIGlmKG5hbWUgaW4gdGhpcy5lbnYuZ2xvYmFscyAmJiAhKG5hbWUgaW4gdGhpcy5jdHgpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLmVudi5nbG9iYWxzW25hbWVdO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3R4W25hbWVdO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIHNldFZhcmlhYmxlOiBmdW5jdGlvbihuYW1lLCB2YWwpIHtcblx0ICAgICAgICB0aGlzLmN0eFtuYW1lXSA9IHZhbDtcblx0ICAgIH0sXG5cblx0ICAgIGdldFZhcmlhYmxlczogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuY3R4O1xuXHQgICAgfSxcblxuXHQgICAgYWRkQmxvY2s6IGZ1bmN0aW9uKG5hbWUsIGJsb2NrKSB7XG5cdCAgICAgICAgdGhpcy5ibG9ja3NbbmFtZV0gPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXTtcblx0ICAgICAgICB0aGlzLmJsb2Nrc1tuYW1lXS5wdXNoKGJsb2NrKTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIGdldEJsb2NrOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgaWYoIXRoaXMuYmxvY2tzW25hbWVdKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndW5rbm93biBibG9jayBcIicgKyBuYW1lICsgJ1wiJyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tzW25hbWVdWzBdO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0U3VwZXI6IGZ1bmN0aW9uKGVudiwgbmFtZSwgYmxvY2ssIGZyYW1lLCBydW50aW1lLCBjYikge1xuXHQgICAgICAgIHZhciBpZHggPSBsaWIuaW5kZXhPZih0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXSwgYmxvY2spO1xuXHQgICAgICAgIHZhciBibGsgPSB0aGlzLmJsb2Nrc1tuYW1lXVtpZHggKyAxXTtcblx0ICAgICAgICB2YXIgY29udGV4dCA9IHRoaXM7XG5cblx0ICAgICAgICBpZihpZHggPT09IC0xIHx8ICFibGspIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBzdXBlciBibG9jayBhdmFpbGFibGUgZm9yIFwiJyArIG5hbWUgKyAnXCInKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBibGsoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xuXHQgICAgfSxcblxuXHQgICAgYWRkRXhwb3J0OiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdGhpcy5leHBvcnRlZC5wdXNoKG5hbWUpO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0RXhwb3J0ZWQ6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciBleHBvcnRlZCA9IHt9O1xuXHQgICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMuZXhwb3J0ZWQubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgdmFyIG5hbWUgPSB0aGlzLmV4cG9ydGVkW2ldO1xuXHQgICAgICAgICAgICBleHBvcnRlZFtuYW1lXSA9IHRoaXMuY3R4W25hbWVdO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gZXhwb3J0ZWQ7XG5cdCAgICB9XG5cdH0pO1xuXG5cdFRlbXBsYXRlID0gT2JqLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbiAoc3JjLCBlbnYsIHBhdGgsIGVhZ2VyQ29tcGlsZSkge1xuXHQgICAgICAgIHRoaXMuZW52ID0gZW52IHx8IG5ldyBFbnZpcm9ubWVudCgpO1xuXG5cdCAgICAgICAgaWYobGliLmlzT2JqZWN0KHNyYykpIHtcblx0ICAgICAgICAgICAgc3dpdGNoKHNyYy50eXBlKSB7XG5cdCAgICAgICAgICAgIGNhc2UgJ2NvZGUnOiB0aGlzLnRtcGxQcm9wcyA9IHNyYy5vYmo7IGJyZWFrO1xuXHQgICAgICAgICAgICBjYXNlICdzdHJpbmcnOiB0aGlzLnRtcGxTdHIgPSBzcmMub2JqOyBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKGxpYi5pc1N0cmluZyhzcmMpKSB7XG5cdCAgICAgICAgICAgIHRoaXMudG1wbFN0ciA9IHNyYztcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc3JjIG11c3QgYmUgYSBzdHJpbmcgb3IgYW4gb2JqZWN0IGRlc2NyaWJpbmcgJyArXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGhlIHNvdXJjZScpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMucGF0aCA9IHBhdGg7XG5cblx0ICAgICAgICBpZihlYWdlckNvbXBpbGUpIHtcblx0ICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblx0ICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgIF90aGlzLl9jb21waWxlKCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgY2F0Y2goZXJyKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBsaWIucHJldHRpZnlFcnJvcih0aGlzLnBhdGgsIHRoaXMuZW52Lm9wdHMuZGV2LCBlcnIpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB0aGlzLmNvbXBpbGVkID0gZmFsc2U7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgsIHBhcmVudEZyYW1lLCBjYikge1xuXHQgICAgICAgIGlmICh0eXBlb2YgY3R4ID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIGNiID0gY3R4O1xuXHQgICAgICAgICAgICBjdHggPSB7fTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZiAodHlwZW9mIHBhcmVudEZyYW1lID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIGNiID0gcGFyZW50RnJhbWU7XG5cdCAgICAgICAgICAgIHBhcmVudEZyYW1lID0gbnVsbDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgZm9yY2VBc3luYyA9IHRydWU7XG5cdCAgICAgICAgaWYocGFyZW50RnJhbWUpIHtcblx0ICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBmcmFtZSwgd2UgYXJlIGJlaW5nIGNhbGxlZCBmcm9tIGludGVybmFsXG5cdCAgICAgICAgICAgIC8vIGNvZGUgb2YgYW5vdGhlciB0ZW1wbGF0ZSwgYW5kIHRoZSBpbnRlcm5hbCBzeXN0ZW1cblx0ICAgICAgICAgICAgLy8gZGVwZW5kcyBvbiB0aGUgc3luYy9hc3luYyBuYXR1cmUgb2YgdGhlIHBhcmVudCB0ZW1wbGF0ZVxuXHQgICAgICAgICAgICAvLyB0byBiZSBpbmhlcml0ZWQsIHNvIGZvcmNlIGFuIGFzeW5jIGNhbGxiYWNrXG5cdCAgICAgICAgICAgIGZvcmNlQXN5bmMgPSBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXHQgICAgICAgIC8vIENhdGNoIGNvbXBpbGUgZXJyb3JzIGZvciBhc3luYyByZW5kZXJpbmdcblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICBfdGhpcy5jb21waWxlKCk7XG5cdCAgICAgICAgfSBjYXRjaCAoX2Vycikge1xuXHQgICAgICAgICAgICB2YXIgZXJyID0gbGliLnByZXR0aWZ5RXJyb3IodGhpcy5wYXRoLCB0aGlzLmVudi5vcHRzLmRldiwgX2Vycik7XG5cdCAgICAgICAgICAgIGlmIChjYikgcmV0dXJuIGNhbGxiYWNrQXNhcChjYiwgZXJyKTtcblx0ICAgICAgICAgICAgZWxzZSB0aHJvdyBlcnI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dChjdHggfHwge30sIF90aGlzLmJsb2NrcywgX3RoaXMuZW52KTtcblx0ICAgICAgICB2YXIgZnJhbWUgPSBwYXJlbnRGcmFtZSA/IHBhcmVudEZyYW1lLnB1c2godHJ1ZSkgOiBuZXcgRnJhbWUoKTtcblx0ICAgICAgICBmcmFtZS50b3BMZXZlbCA9IHRydWU7XG5cdCAgICAgICAgdmFyIHN5bmNSZXN1bHQgPSBudWxsO1xuXG5cdCAgICAgICAgX3RoaXMucm9vdFJlbmRlckZ1bmMoXG5cdCAgICAgICAgICAgIF90aGlzLmVudixcblx0ICAgICAgICAgICAgY29udGV4dCxcblx0ICAgICAgICAgICAgZnJhbWUgfHwgbmV3IEZyYW1lKCksXG5cdCAgICAgICAgICAgIHJ1bnRpbWUsXG5cdCAgICAgICAgICAgIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG5cdCAgICAgICAgICAgICAgICBpZihlcnIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBlcnIgPSBsaWIucHJldHRpZnlFcnJvcihfdGhpcy5wYXRoLCBfdGhpcy5lbnYub3B0cy5kZXYsIGVycik7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIGlmKGNiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoZm9yY2VBc3luYykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja0FzYXAoY2IsIGVyciwgcmVzKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNiKGVyciwgcmVzKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZihlcnIpIHsgdGhyb3cgZXJyOyB9XG5cdCAgICAgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHJlcztcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICk7XG5cblx0ICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcblx0ICAgIH0sXG5cblxuXHQgICAgZ2V0RXhwb3J0ZWQ6IGZ1bmN0aW9uKGN0eCwgcGFyZW50RnJhbWUsIGNiKSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBjdHggPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBjdHg7XG5cdCAgICAgICAgICAgIGN0eCA9IHt9O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmICh0eXBlb2YgcGFyZW50RnJhbWUgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBwYXJlbnRGcmFtZTtcblx0ICAgICAgICAgICAgcGFyZW50RnJhbWUgPSBudWxsO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIENhdGNoIGNvbXBpbGUgZXJyb3JzIGZvciBhc3luYyByZW5kZXJpbmdcblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICB0aGlzLmNvbXBpbGUoKTtcblx0ICAgICAgICB9IGNhdGNoIChlKSB7XG5cdCAgICAgICAgICAgIGlmIChjYikgcmV0dXJuIGNiKGUpO1xuXHQgICAgICAgICAgICBlbHNlIHRocm93IGU7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGZyYW1lID0gcGFyZW50RnJhbWUgPyBwYXJlbnRGcmFtZS5wdXNoKCkgOiBuZXcgRnJhbWUoKTtcblx0ICAgICAgICBmcmFtZS50b3BMZXZlbCA9IHRydWU7XG5cblx0ICAgICAgICAvLyBSdW4gdGhlIHJvb3RSZW5kZXJGdW5jIHRvIHBvcHVsYXRlIHRoZSBjb250ZXh0IHdpdGggZXhwb3J0ZWQgdmFyc1xuXHQgICAgICAgIHZhciBjb250ZXh0ID0gbmV3IENvbnRleHQoY3R4IHx8IHt9LCB0aGlzLmJsb2NrcywgdGhpcy5lbnYpO1xuXHQgICAgICAgIHRoaXMucm9vdFJlbmRlckZ1bmModGhpcy5lbnYsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyKSB7XG5cdCAgICAgICAgXHRcdCAgICAgICAgaWYgKCBlcnIgKSB7XG5cdCAgICAgICAgXHRcdFx0ICAgIGNiKGVyciwgbnVsbCk7XG5cdCAgICAgICAgXHRcdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBcdFx0XHQgICAgY2IobnVsbCwgY29udGV4dC5nZXRFeHBvcnRlZCgpKTtcblx0ICAgICAgICBcdFx0ICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgIH0sXG5cblx0ICAgIGNvbXBpbGU6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmKCF0aGlzLmNvbXBpbGVkKSB7XG5cdCAgICAgICAgICAgIHRoaXMuX2NvbXBpbGUoKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBfY29tcGlsZTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIHByb3BzO1xuXG5cdCAgICAgICAgaWYodGhpcy50bXBsUHJvcHMpIHtcblx0ICAgICAgICAgICAgcHJvcHMgPSB0aGlzLnRtcGxQcm9wcztcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBzb3VyY2UgPSBjb21waWxlci5jb21waWxlKHRoaXMudG1wbFN0cixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnYuYXN5bmNGaWx0ZXJzLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5leHRlbnNpb25zTGlzdCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXRoLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5vcHRzKTtcblxuXHQgICAgICAgICAgICAvKiBqc2xpbnQgZXZpbDogdHJ1ZSAqL1xuXHQgICAgICAgICAgICB2YXIgZnVuYyA9IG5ldyBGdW5jdGlvbihzb3VyY2UpO1xuXHQgICAgICAgICAgICBwcm9wcyA9IGZ1bmMoKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLmJsb2NrcyA9IHRoaXMuX2dldEJsb2Nrcyhwcm9wcyk7XG5cdCAgICAgICAgdGhpcy5yb290UmVuZGVyRnVuYyA9IHByb3BzLnJvb3Q7XG5cdCAgICAgICAgdGhpcy5jb21waWxlZCA9IHRydWU7XG5cdCAgICB9LFxuXG5cdCAgICBfZ2V0QmxvY2tzOiBmdW5jdGlvbihwcm9wcykge1xuXHQgICAgICAgIHZhciBibG9ja3MgPSB7fTtcblxuXHQgICAgICAgIGZvcih2YXIgayBpbiBwcm9wcykge1xuXHQgICAgICAgICAgICBpZihrLnNsaWNlKDAsIDIpID09PSAnYl8nKSB7XG5cdCAgICAgICAgICAgICAgICBibG9ja3Nbay5zbGljZSgyKV0gPSBwcm9wc1trXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBibG9ja3M7XG5cdCAgICB9XG5cdH0pO1xuXG5cdG1vZHVsZS5leHBvcnRzID0ge1xuXHQgICAgRW52aXJvbm1lbnQ6IEVudmlyb25tZW50LFxuXHQgICAgVGVtcGxhdGU6IFRlbXBsYXRlXG5cdH07XG5cblxuLyoqKi8gfSxcbi8qIDMgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdFxuXG4vKioqLyB9LFxuLyogNCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly8gcmF3QXNhcCBwcm92aWRlcyBldmVyeXRoaW5nIHdlIG5lZWQgZXhjZXB0IGV4Y2VwdGlvbiBtYW5hZ2VtZW50LlxuXHR2YXIgcmF3QXNhcCA9IF9fd2VicGFja19yZXF1aXJlX18oNSk7XG5cdC8vIFJhd1Rhc2tzIGFyZSByZWN5Y2xlZCB0byByZWR1Y2UgR0MgY2h1cm4uXG5cdHZhciBmcmVlVGFza3MgPSBbXTtcblx0Ly8gV2UgcXVldWUgZXJyb3JzIHRvIGVuc3VyZSB0aGV5IGFyZSB0aHJvd24gaW4gcmlnaHQgb3JkZXIgKEZJRk8pLlxuXHQvLyBBcnJheS1hcy1xdWV1ZSBpcyBnb29kIGVub3VnaCBoZXJlLCBzaW5jZSB3ZSBhcmUganVzdCBkZWFsaW5nIHdpdGggZXhjZXB0aW9ucy5cblx0dmFyIHBlbmRpbmdFcnJvcnMgPSBbXTtcblx0dmFyIHJlcXVlc3RFcnJvclRocm93ID0gcmF3QXNhcC5tYWtlUmVxdWVzdENhbGxGcm9tVGltZXIodGhyb3dGaXJzdEVycm9yKTtcblxuXHRmdW5jdGlvbiB0aHJvd0ZpcnN0RXJyb3IoKSB7XG5cdCAgICBpZiAocGVuZGluZ0Vycm9ycy5sZW5ndGgpIHtcblx0ICAgICAgICB0aHJvdyBwZW5kaW5nRXJyb3JzLnNoaWZ0KCk7XG5cdCAgICB9XG5cdH1cblxuXHQvKipcblx0ICogQ2FsbHMgYSB0YXNrIGFzIHNvb24gYXMgcG9zc2libGUgYWZ0ZXIgcmV0dXJuaW5nLCBpbiBpdHMgb3duIGV2ZW50LCB3aXRoIHByaW9yaXR5XG5cdCAqIG92ZXIgb3RoZXIgZXZlbnRzIGxpa2UgYW5pbWF0aW9uLCByZWZsb3csIGFuZCByZXBhaW50LiBBbiBlcnJvciB0aHJvd24gZnJvbSBhblxuXHQgKiBldmVudCB3aWxsIG5vdCBpbnRlcnJ1cHQsIG5vciBldmVuIHN1YnN0YW50aWFsbHkgc2xvdyBkb3duIHRoZSBwcm9jZXNzaW5nIG9mXG5cdCAqIG90aGVyIGV2ZW50cywgYnV0IHdpbGwgYmUgcmF0aGVyIHBvc3Rwb25lZCB0byBhIGxvd2VyIHByaW9yaXR5IGV2ZW50LlxuXHQgKiBAcGFyYW0ge3tjYWxsfX0gdGFzayBBIGNhbGxhYmxlIG9iamVjdCwgdHlwaWNhbGx5IGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBub1xuXHQgKiBhcmd1bWVudHMuXG5cdCAqL1xuXHRtb2R1bGUuZXhwb3J0cyA9IGFzYXA7XG5cdGZ1bmN0aW9uIGFzYXAodGFzaykge1xuXHQgICAgdmFyIHJhd1Rhc2s7XG5cdCAgICBpZiAoZnJlZVRhc2tzLmxlbmd0aCkge1xuXHQgICAgICAgIHJhd1Rhc2sgPSBmcmVlVGFza3MucG9wKCk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIHJhd1Rhc2sgPSBuZXcgUmF3VGFzaygpO1xuXHQgICAgfVxuXHQgICAgcmF3VGFzay50YXNrID0gdGFzaztcblx0ICAgIHJhd0FzYXAocmF3VGFzayk7XG5cdH1cblxuXHQvLyBXZSB3cmFwIHRhc2tzIHdpdGggcmVjeWNsYWJsZSB0YXNrIG9iamVjdHMuICBBIHRhc2sgb2JqZWN0IGltcGxlbWVudHNcblx0Ly8gYGNhbGxgLCBqdXN0IGxpa2UgYSBmdW5jdGlvbi5cblx0ZnVuY3Rpb24gUmF3VGFzaygpIHtcblx0ICAgIHRoaXMudGFzayA9IG51bGw7XG5cdH1cblxuXHQvLyBUaGUgc29sZSBwdXJwb3NlIG9mIHdyYXBwaW5nIHRoZSB0YXNrIGlzIHRvIGNhdGNoIHRoZSBleGNlcHRpb24gYW5kIHJlY3ljbGVcblx0Ly8gdGhlIHRhc2sgb2JqZWN0IGFmdGVyIGl0cyBzaW5nbGUgdXNlLlxuXHRSYXdUYXNrLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdHJ5IHtcblx0ICAgICAgICB0aGlzLnRhc2suY2FsbCgpO1xuXHQgICAgfSBjYXRjaCAoZXJyb3IpIHtcblx0ICAgICAgICBpZiAoYXNhcC5vbmVycm9yKSB7XG5cdCAgICAgICAgICAgIC8vIFRoaXMgaG9vayBleGlzdHMgcHVyZWx5IGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuXHQgICAgICAgICAgICAvLyBJdHMgbmFtZSB3aWxsIGJlIHBlcmlvZGljYWxseSByYW5kb21pemVkIHRvIGJyZWFrIGFueSBjb2RlIHRoYXRcblx0ICAgICAgICAgICAgLy8gZGVwZW5kcyBvbiBpdHMgZXhpc3RlbmNlLlxuXHQgICAgICAgICAgICBhc2FwLm9uZXJyb3IoZXJyb3IpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIC8vIEluIGEgd2ViIGJyb3dzZXIsIGV4Y2VwdGlvbnMgYXJlIG5vdCBmYXRhbC4gSG93ZXZlciwgdG8gYXZvaWRcblx0ICAgICAgICAgICAgLy8gc2xvd2luZyBkb3duIHRoZSBxdWV1ZSBvZiBwZW5kaW5nIHRhc2tzLCB3ZSByZXRocm93IHRoZSBlcnJvciBpbiBhXG5cdCAgICAgICAgICAgIC8vIGxvd2VyIHByaW9yaXR5IHR1cm4uXG5cdCAgICAgICAgICAgIHBlbmRpbmdFcnJvcnMucHVzaChlcnJvcik7XG5cdCAgICAgICAgICAgIHJlcXVlc3RFcnJvclRocm93KCk7XG5cdCAgICAgICAgfVxuXHQgICAgfSBmaW5hbGx5IHtcblx0ICAgICAgICB0aGlzLnRhc2sgPSBudWxsO1xuXHQgICAgICAgIGZyZWVUYXNrc1tmcmVlVGFza3MubGVuZ3RoXSA9IHRoaXM7XG5cdCAgICB9XG5cdH07XG5cblxuLyoqKi8gfSxcbi8qIDUgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqLyhmdW5jdGlvbihnbG9iYWwpIHtcInVzZSBzdHJpY3RcIjtcblxuXHQvLyBVc2UgdGhlIGZhc3Rlc3QgbWVhbnMgcG9zc2libGUgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gaXRzIG93biB0dXJuLCB3aXRoXG5cdC8vIHByaW9yaXR5IG92ZXIgb3RoZXIgZXZlbnRzIGluY2x1ZGluZyBJTywgYW5pbWF0aW9uLCByZWZsb3csIGFuZCByZWRyYXdcblx0Ly8gZXZlbnRzIGluIGJyb3dzZXJzLlxuXHQvL1xuXHQvLyBBbiBleGNlcHRpb24gdGhyb3duIGJ5IGEgdGFzayB3aWxsIHBlcm1hbmVudGx5IGludGVycnVwdCB0aGUgcHJvY2Vzc2luZyBvZlxuXHQvLyBzdWJzZXF1ZW50IHRhc2tzLiBUaGUgaGlnaGVyIGxldmVsIGBhc2FwYCBmdW5jdGlvbiBlbnN1cmVzIHRoYXQgaWYgYW5cblx0Ly8gZXhjZXB0aW9uIGlzIHRocm93biBieSBhIHRhc2ssIHRoYXQgdGhlIHRhc2sgcXVldWUgd2lsbCBjb250aW51ZSBmbHVzaGluZyBhc1xuXHQvLyBzb29uIGFzIHBvc3NpYmxlLCBidXQgaWYgeW91IHVzZSBgcmF3QXNhcGAgZGlyZWN0bHksIHlvdSBhcmUgcmVzcG9uc2libGUgdG9cblx0Ly8gZWl0aGVyIGVuc3VyZSB0aGF0IG5vIGV4Y2VwdGlvbnMgYXJlIHRocm93biBmcm9tIHlvdXIgdGFzaywgb3IgdG8gbWFudWFsbHlcblx0Ly8gY2FsbCBgcmF3QXNhcC5yZXF1ZXN0Rmx1c2hgIGlmIGFuIGV4Y2VwdGlvbiBpcyB0aHJvd24uXG5cdG1vZHVsZS5leHBvcnRzID0gcmF3QXNhcDtcblx0ZnVuY3Rpb24gcmF3QXNhcCh0YXNrKSB7XG5cdCAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuXHQgICAgICAgIHJlcXVlc3RGbHVzaCgpO1xuXHQgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIC8vIEVxdWl2YWxlbnQgdG8gcHVzaCwgYnV0IGF2b2lkcyBhIGZ1bmN0aW9uIGNhbGwuXG5cdCAgICBxdWV1ZVtxdWV1ZS5sZW5ndGhdID0gdGFzaztcblx0fVxuXG5cdHZhciBxdWV1ZSA9IFtdO1xuXHQvLyBPbmNlIGEgZmx1c2ggaGFzIGJlZW4gcmVxdWVzdGVkLCBubyBmdXJ0aGVyIGNhbGxzIHRvIGByZXF1ZXN0Rmx1c2hgIGFyZVxuXHQvLyBuZWNlc3NhcnkgdW50aWwgdGhlIG5leHQgYGZsdXNoYCBjb21wbGV0ZXMuXG5cdHZhciBmbHVzaGluZyA9IGZhbHNlO1xuXHQvLyBgcmVxdWVzdEZsdXNoYCBpcyBhbiBpbXBsZW1lbnRhdGlvbi1zcGVjaWZpYyBtZXRob2QgdGhhdCBhdHRlbXB0cyB0byBraWNrXG5cdC8vIG9mZiBhIGBmbHVzaGAgZXZlbnQgYXMgcXVpY2tseSBhcyBwb3NzaWJsZS4gYGZsdXNoYCB3aWxsIGF0dGVtcHQgdG8gZXhoYXVzdFxuXHQvLyB0aGUgZXZlbnQgcXVldWUgYmVmb3JlIHlpZWxkaW5nIHRvIHRoZSBicm93c2VyJ3Mgb3duIGV2ZW50IGxvb3AuXG5cdHZhciByZXF1ZXN0Rmx1c2g7XG5cdC8vIFRoZSBwb3NpdGlvbiBvZiB0aGUgbmV4dCB0YXNrIHRvIGV4ZWN1dGUgaW4gdGhlIHRhc2sgcXVldWUuIFRoaXMgaXNcblx0Ly8gcHJlc2VydmVkIGJldHdlZW4gY2FsbHMgdG8gYGZsdXNoYCBzbyB0aGF0IGl0IGNhbiBiZSByZXN1bWVkIGlmXG5cdC8vIGEgdGFzayB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuXHR2YXIgaW5kZXggPSAwO1xuXHQvLyBJZiBhIHRhc2sgc2NoZWR1bGVzIGFkZGl0aW9uYWwgdGFza3MgcmVjdXJzaXZlbHksIHRoZSB0YXNrIHF1ZXVlIGNhbiBncm93XG5cdC8vIHVuYm91bmRlZC4gVG8gcHJldmVudCBtZW1vcnkgZXhoYXVzdGlvbiwgdGhlIHRhc2sgcXVldWUgd2lsbCBwZXJpb2RpY2FsbHlcblx0Ly8gdHJ1bmNhdGUgYWxyZWFkeS1jb21wbGV0ZWQgdGFza3MuXG5cdHZhciBjYXBhY2l0eSA9IDEwMjQ7XG5cblx0Ly8gVGhlIGZsdXNoIGZ1bmN0aW9uIHByb2Nlc3NlcyBhbGwgdGFza3MgdGhhdCBoYXZlIGJlZW4gc2NoZWR1bGVkIHdpdGhcblx0Ly8gYHJhd0FzYXBgIHVubGVzcyBhbmQgdW50aWwgb25lIG9mIHRob3NlIHRhc2tzIHRocm93cyBhbiBleGNlcHRpb24uXG5cdC8vIElmIGEgdGFzayB0aHJvd3MgYW4gZXhjZXB0aW9uLCBgZmx1c2hgIGVuc3VyZXMgdGhhdCBpdHMgc3RhdGUgd2lsbCByZW1haW5cblx0Ly8gY29uc2lzdGVudCBhbmQgd2lsbCByZXN1bWUgd2hlcmUgaXQgbGVmdCBvZmYgd2hlbiBjYWxsZWQgYWdhaW4uXG5cdC8vIEhvd2V2ZXIsIGBmbHVzaGAgZG9lcyBub3QgbWFrZSBhbnkgYXJyYW5nZW1lbnRzIHRvIGJlIGNhbGxlZCBhZ2FpbiBpZiBhblxuXHQvLyBleGNlcHRpb24gaXMgdGhyb3duLlxuXHRmdW5jdGlvbiBmbHVzaCgpIHtcblx0ICAgIHdoaWxlIChpbmRleCA8IHF1ZXVlLmxlbmd0aCkge1xuXHQgICAgICAgIHZhciBjdXJyZW50SW5kZXggPSBpbmRleDtcblx0ICAgICAgICAvLyBBZHZhbmNlIHRoZSBpbmRleCBiZWZvcmUgY2FsbGluZyB0aGUgdGFzay4gVGhpcyBlbnN1cmVzIHRoYXQgd2Ugd2lsbFxuXHQgICAgICAgIC8vIGJlZ2luIGZsdXNoaW5nIG9uIHRoZSBuZXh0IHRhc2sgdGhlIHRhc2sgdGhyb3dzIGFuIGVycm9yLlxuXHQgICAgICAgIGluZGV4ID0gaW5kZXggKyAxO1xuXHQgICAgICAgIHF1ZXVlW2N1cnJlbnRJbmRleF0uY2FsbCgpO1xuXHQgICAgICAgIC8vIFByZXZlbnQgbGVha2luZyBtZW1vcnkgZm9yIGxvbmcgY2hhaW5zIG9mIHJlY3Vyc2l2ZSBjYWxscyB0byBgYXNhcGAuXG5cdCAgICAgICAgLy8gSWYgd2UgY2FsbCBgYXNhcGAgd2l0aGluIHRhc2tzIHNjaGVkdWxlZCBieSBgYXNhcGAsIHRoZSBxdWV1ZSB3aWxsXG5cdCAgICAgICAgLy8gZ3JvdywgYnV0IHRvIGF2b2lkIGFuIE8obikgd2FsayBmb3IgZXZlcnkgdGFzayB3ZSBleGVjdXRlLCB3ZSBkb24ndFxuXHQgICAgICAgIC8vIHNoaWZ0IHRhc2tzIG9mZiB0aGUgcXVldWUgYWZ0ZXIgdGhleSBoYXZlIGJlZW4gZXhlY3V0ZWQuXG5cdCAgICAgICAgLy8gSW5zdGVhZCwgd2UgcGVyaW9kaWNhbGx5IHNoaWZ0IDEwMjQgdGFza3Mgb2ZmIHRoZSBxdWV1ZS5cblx0ICAgICAgICBpZiAoaW5kZXggPiBjYXBhY2l0eSkge1xuXHQgICAgICAgICAgICAvLyBNYW51YWxseSBzaGlmdCBhbGwgdmFsdWVzIHN0YXJ0aW5nIGF0IHRoZSBpbmRleCBiYWNrIHRvIHRoZVxuXHQgICAgICAgICAgICAvLyBiZWdpbm5pbmcgb2YgdGhlIHF1ZXVlLlxuXHQgICAgICAgICAgICBmb3IgKHZhciBzY2FuID0gMCwgbmV3TGVuZ3RoID0gcXVldWUubGVuZ3RoIC0gaW5kZXg7IHNjYW4gPCBuZXdMZW5ndGg7IHNjYW4rKykge1xuXHQgICAgICAgICAgICAgICAgcXVldWVbc2Nhbl0gPSBxdWV1ZVtzY2FuICsgaW5kZXhdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCAtPSBpbmRleDtcblx0ICAgICAgICAgICAgaW5kZXggPSAwO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG5cdCAgICBpbmRleCA9IDA7XG5cdCAgICBmbHVzaGluZyA9IGZhbHNlO1xuXHR9XG5cblx0Ly8gYHJlcXVlc3RGbHVzaGAgaXMgaW1wbGVtZW50ZWQgdXNpbmcgYSBzdHJhdGVneSBiYXNlZCBvbiBkYXRhIGNvbGxlY3RlZCBmcm9tXG5cdC8vIGV2ZXJ5IGF2YWlsYWJsZSBTYXVjZUxhYnMgU2VsZW5pdW0gd2ViIGRyaXZlciB3b3JrZXIgYXQgdGltZSBvZiB3cml0aW5nLlxuXHQvLyBodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9zcHJlYWRzaGVldHMvZC8xbUctNVVZR3VwNXF4R2RFTVdraFA2QldDejA1M05VYjJFMVFvVVRVMTZ1QS9lZGl0I2dpZD03ODM3MjQ1OTNcblxuXHQvLyBTYWZhcmkgNiBhbmQgNi4xIGZvciBkZXNrdG9wLCBpUGFkLCBhbmQgaVBob25lIGFyZSB0aGUgb25seSBicm93c2VycyB0aGF0XG5cdC8vIGhhdmUgV2ViS2l0TXV0YXRpb25PYnNlcnZlciBidXQgbm90IHVuLXByZWZpeGVkIE11dGF0aW9uT2JzZXJ2ZXIuXG5cdC8vIE11c3QgdXNlIGBnbG9iYWxgIGluc3RlYWQgb2YgYHdpbmRvd2AgdG8gd29yayBpbiBib3RoIGZyYW1lcyBhbmQgd2ViXG5cdC8vIHdvcmtlcnMuIGBnbG9iYWxgIGlzIGEgcHJvdmlzaW9uIG9mIEJyb3dzZXJpZnksIE1yLCBNcnMsIG9yIE1vcC5cblx0dmFyIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gZ2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIgfHwgZ2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG5cblx0Ly8gTXV0YXRpb25PYnNlcnZlcnMgYXJlIGRlc2lyYWJsZSBiZWNhdXNlIHRoZXkgaGF2ZSBoaWdoIHByaW9yaXR5IGFuZCB3b3JrXG5cdC8vIHJlbGlhYmx5IGV2ZXJ5d2hlcmUgdGhleSBhcmUgaW1wbGVtZW50ZWQuXG5cdC8vIFRoZXkgYXJlIGltcGxlbWVudGVkIGluIGFsbCBtb2Rlcm4gYnJvd3NlcnMuXG5cdC8vXG5cdC8vIC0gQW5kcm9pZCA0LTQuM1xuXHQvLyAtIENocm9tZSAyNi0zNFxuXHQvLyAtIEZpcmVmb3ggMTQtMjlcblx0Ly8gLSBJbnRlcm5ldCBFeHBsb3JlciAxMVxuXHQvLyAtIGlQYWQgU2FmYXJpIDYtNy4xXG5cdC8vIC0gaVBob25lIFNhZmFyaSA3LTcuMVxuXHQvLyAtIFNhZmFyaSA2LTdcblx0aWYgKHR5cGVvZiBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdCAgICByZXF1ZXN0Rmx1c2ggPSBtYWtlUmVxdWVzdENhbGxGcm9tTXV0YXRpb25PYnNlcnZlcihmbHVzaCk7XG5cblx0Ly8gTWVzc2FnZUNoYW5uZWxzIGFyZSBkZXNpcmFibGUgYmVjYXVzZSB0aGV5IGdpdmUgZGlyZWN0IGFjY2VzcyB0byB0aGUgSFRNTFxuXHQvLyB0YXNrIHF1ZXVlLCBhcmUgaW1wbGVtZW50ZWQgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAsIFNhZmFyaSA1LjAtMSwgYW5kIE9wZXJhXG5cdC8vIDExLTEyLCBhbmQgaW4gd2ViIHdvcmtlcnMgaW4gbWFueSBlbmdpbmVzLlxuXHQvLyBBbHRob3VnaCBtZXNzYWdlIGNoYW5uZWxzIHlpZWxkIHRvIGFueSBxdWV1ZWQgcmVuZGVyaW5nIGFuZCBJTyB0YXNrcywgdGhleVxuXHQvLyB3b3VsZCBiZSBiZXR0ZXIgdGhhbiBpbXBvc2luZyB0aGUgNG1zIGRlbGF5IG9mIHRpbWVycy5cblx0Ly8gSG93ZXZlciwgdGhleSBkbyBub3Qgd29yayByZWxpYWJseSBpbiBJbnRlcm5ldCBFeHBsb3JlciBvciBTYWZhcmkuXG5cblx0Ly8gSW50ZXJuZXQgRXhwbG9yZXIgMTAgaXMgdGhlIG9ubHkgYnJvd3NlciB0aGF0IGhhcyBzZXRJbW1lZGlhdGUgYnV0IGRvZXNcblx0Ly8gbm90IGhhdmUgTXV0YXRpb25PYnNlcnZlcnMuXG5cdC8vIEFsdGhvdWdoIHNldEltbWVkaWF0ZSB5aWVsZHMgdG8gdGhlIGJyb3dzZXIncyByZW5kZXJlciwgaXQgd291bGQgYmVcblx0Ly8gcHJlZmVycmFibGUgdG8gZmFsbGluZyBiYWNrIHRvIHNldFRpbWVvdXQgc2luY2UgaXQgZG9lcyBub3QgaGF2ZVxuXHQvLyB0aGUgbWluaW11bSA0bXMgcGVuYWx0eS5cblx0Ly8gVW5mb3J0dW5hdGVseSB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgYnVnIGluIEludGVybmV0IEV4cGxvcmVyIDEwIE1vYmlsZSAoYW5kXG5cdC8vIERlc2t0b3AgdG8gYSBsZXNzZXIgZXh0ZW50KSB0aGF0IHJlbmRlcnMgYm90aCBzZXRJbW1lZGlhdGUgYW5kXG5cdC8vIE1lc3NhZ2VDaGFubmVsIHVzZWxlc3MgZm9yIHRoZSBwdXJwb3NlcyBvZiBBU0FQLlxuXHQvLyBodHRwczovL2dpdGh1Yi5jb20va3Jpc2tvd2FsL3EvaXNzdWVzLzM5NlxuXG5cdC8vIFRpbWVycyBhcmUgaW1wbGVtZW50ZWQgdW5pdmVyc2FsbHkuXG5cdC8vIFdlIGZhbGwgYmFjayB0byB0aW1lcnMgaW4gd29ya2VycyBpbiBtb3N0IGVuZ2luZXMsIGFuZCBpbiBmb3JlZ3JvdW5kXG5cdC8vIGNvbnRleHRzIGluIHRoZSBmb2xsb3dpbmcgYnJvd3NlcnMuXG5cdC8vIEhvd2V2ZXIsIG5vdGUgdGhhdCBldmVuIHRoaXMgc2ltcGxlIGNhc2UgcmVxdWlyZXMgbnVhbmNlcyB0byBvcGVyYXRlIGluIGFcblx0Ly8gYnJvYWQgc3BlY3RydW0gb2YgYnJvd3NlcnMuXG5cdC8vXG5cdC8vIC0gRmlyZWZveCAzLTEzXG5cdC8vIC0gSW50ZXJuZXQgRXhwbG9yZXIgNi05XG5cdC8vIC0gaVBhZCBTYWZhcmkgNC4zXG5cdC8vIC0gTHlueCAyLjguN1xuXHR9IGVsc2Uge1xuXHQgICAgcmVxdWVzdEZsdXNoID0gbWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKGZsdXNoKTtcblx0fVxuXG5cdC8vIGByZXF1ZXN0Rmx1c2hgIHJlcXVlc3RzIHRoYXQgdGhlIGhpZ2ggcHJpb3JpdHkgZXZlbnQgcXVldWUgYmUgZmx1c2hlZCBhc1xuXHQvLyBzb29uIGFzIHBvc3NpYmxlLlxuXHQvLyBUaGlzIGlzIHVzZWZ1bCB0byBwcmV2ZW50IGFuIGVycm9yIHRocm93biBpbiBhIHRhc2sgZnJvbSBzdGFsbGluZyB0aGUgZXZlbnRcblx0Ly8gcXVldWUgaWYgdGhlIGV4Y2VwdGlvbiBoYW5kbGVkIGJ5IE5vZGUuanPigJlzXG5cdC8vIGBwcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIilgIG9yIGJ5IGEgZG9tYWluLlxuXHRyYXdBc2FwLnJlcXVlc3RGbHVzaCA9IHJlcXVlc3RGbHVzaDtcblxuXHQvLyBUbyByZXF1ZXN0IGEgaGlnaCBwcmlvcml0eSBldmVudCwgd2UgaW5kdWNlIGEgbXV0YXRpb24gb2JzZXJ2ZXIgYnkgdG9nZ2xpbmdcblx0Ly8gdGhlIHRleHQgb2YgYSB0ZXh0IG5vZGUgYmV0d2VlbiBcIjFcIiBhbmQgXCItMVwiLlxuXHRmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjaykge1xuXHQgICAgdmFyIHRvZ2dsZSA9IDE7XG5cdCAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spO1xuXHQgICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcblx0ICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwge2NoYXJhY3RlckRhdGE6IHRydWV9KTtcblx0ICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcblx0ICAgICAgICB0b2dnbGUgPSAtdG9nZ2xlO1xuXHQgICAgICAgIG5vZGUuZGF0YSA9IHRvZ2dsZTtcblx0ICAgIH07XG5cdH1cblxuXHQvLyBUaGUgbWVzc2FnZSBjaGFubmVsIHRlY2huaXF1ZSB3YXMgZGlzY292ZXJlZCBieSBNYWx0ZSBVYmwgYW5kIHdhcyB0aGVcblx0Ly8gb3JpZ2luYWwgZm91bmRhdGlvbiBmb3IgdGhpcyBsaWJyYXJ5LlxuXHQvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuXG5cdC8vIFNhZmFyaSA2LjAuNSAoYXQgbGVhc3QpIGludGVybWl0dGVudGx5IGZhaWxzIHRvIGNyZWF0ZSBtZXNzYWdlIHBvcnRzIG9uIGFcblx0Ly8gcGFnZSdzIGZpcnN0IGxvYWQuIFRoYW5rZnVsbHksIHRoaXMgdmVyc2lvbiBvZiBTYWZhcmkgc3VwcG9ydHNcblx0Ly8gTXV0YXRpb25PYnNlcnZlcnMsIHNvIHdlIGRvbid0IG5lZWQgdG8gZmFsbCBiYWNrIGluIHRoYXQgY2FzZS5cblxuXHQvLyBmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tTWVzc2FnZUNoYW5uZWwoY2FsbGJhY2spIHtcblx0Ly8gICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG5cdC8vICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGNhbGxiYWNrO1xuXHQvLyAgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQvLyAgICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG5cdC8vICAgICB9O1xuXHQvLyB9XG5cblx0Ly8gRm9yIHJlYXNvbnMgZXhwbGFpbmVkIGFib3ZlLCB3ZSBhcmUgYWxzbyB1bmFibGUgdG8gdXNlIGBzZXRJbW1lZGlhdGVgXG5cdC8vIHVuZGVyIGFueSBjaXJjdW1zdGFuY2VzLlxuXHQvLyBFdmVuIGlmIHdlIHdlcmUsIHRoZXJlIGlzIGFub3RoZXIgYnVnIGluIEludGVybmV0IEV4cGxvcmVyIDEwLlxuXHQvLyBJdCBpcyBub3Qgc3VmZmljaWVudCB0byBhc3NpZ24gYHNldEltbWVkaWF0ZWAgdG8gYHJlcXVlc3RGbHVzaGAgYmVjYXVzZVxuXHQvLyBgc2V0SW1tZWRpYXRlYCBtdXN0IGJlIGNhbGxlZCAqYnkgbmFtZSogYW5kIHRoZXJlZm9yZSBtdXN0IGJlIHdyYXBwZWQgaW4gYVxuXHQvLyBjbG9zdXJlLlxuXHQvLyBOZXZlciBmb3JnZXQuXG5cblx0Ly8gZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbVNldEltbWVkaWF0ZShjYWxsYmFjaykge1xuXHQvLyAgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQvLyAgICAgICAgIHNldEltbWVkaWF0ZShjYWxsYmFjayk7XG5cdC8vICAgICB9O1xuXHQvLyB9XG5cblx0Ly8gU2FmYXJpIDYuMCBoYXMgYSBwcm9ibGVtIHdoZXJlIHRpbWVycyB3aWxsIGdldCBsb3N0IHdoaWxlIHRoZSB1c2VyIGlzXG5cdC8vIHNjcm9sbGluZy4gVGhpcyBwcm9ibGVtIGRvZXMgbm90IGltcGFjdCBBU0FQIGJlY2F1c2UgU2FmYXJpIDYuMCBzdXBwb3J0c1xuXHQvLyBtdXRhdGlvbiBvYnNlcnZlcnMsIHNvIHRoYXQgaW1wbGVtZW50YXRpb24gaXMgdXNlZCBpbnN0ZWFkLlxuXHQvLyBIb3dldmVyLCBpZiB3ZSBldmVyIGVsZWN0IHRvIHVzZSB0aW1lcnMgaW4gU2FmYXJpLCB0aGUgcHJldmFsZW50IHdvcmstYXJvdW5kXG5cdC8vIGlzIHRvIGFkZCBhIHNjcm9sbCBldmVudCBsaXN0ZW5lciB0aGF0IGNhbGxzIGZvciBhIGZsdXNoLlxuXG5cdC8vIGBzZXRUaW1lb3V0YCBkb2VzIG5vdCBjYWxsIHRoZSBwYXNzZWQgY2FsbGJhY2sgaWYgdGhlIGRlbGF5IGlzIGxlc3MgdGhhblxuXHQvLyBhcHByb3hpbWF0ZWx5IDcgaW4gd2ViIHdvcmtlcnMgaW4gRmlyZWZveCA4IHRocm91Z2ggMTgsIGFuZCBzb21ldGltZXMgbm90XG5cdC8vIGV2ZW4gdGhlbi5cblxuXHRmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXIoY2FsbGJhY2spIHtcblx0ICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcblx0ICAgICAgICAvLyBXZSBkaXNwYXRjaCBhIHRpbWVvdXQgd2l0aCBhIHNwZWNpZmllZCBkZWxheSBvZiAwIGZvciBlbmdpbmVzIHRoYXRcblx0ICAgICAgICAvLyBjYW4gcmVsaWFibHkgYWNjb21tb2RhdGUgdGhhdCByZXF1ZXN0LiBUaGlzIHdpbGwgdXN1YWxseSBiZSBzbmFwcGVkXG5cdCAgICAgICAgLy8gdG8gYSA0IG1pbGlzZWNvbmQgZGVsYXksIGJ1dCBvbmNlIHdlJ3JlIGZsdXNoaW5nLCB0aGVyZSdzIG5vIGRlbGF5XG5cdCAgICAgICAgLy8gYmV0d2VlbiBldmVudHMuXG5cdCAgICAgICAgdmFyIHRpbWVvdXRIYW5kbGUgPSBzZXRUaW1lb3V0KGhhbmRsZVRpbWVyLCAwKTtcblx0ICAgICAgICAvLyBIb3dldmVyLCBzaW5jZSB0aGlzIHRpbWVyIGdldHMgZnJlcXVlbnRseSBkcm9wcGVkIGluIEZpcmVmb3hcblx0ICAgICAgICAvLyB3b3JrZXJzLCB3ZSBlbmxpc3QgYW4gaW50ZXJ2YWwgaGFuZGxlIHRoYXQgd2lsbCB0cnkgdG8gZmlyZVxuXHQgICAgICAgIC8vIGFuIGV2ZW50IDIwIHRpbWVzIHBlciBzZWNvbmQgdW50aWwgaXQgc3VjY2VlZHMuXG5cdCAgICAgICAgdmFyIGludGVydmFsSGFuZGxlID0gc2V0SW50ZXJ2YWwoaGFuZGxlVGltZXIsIDUwKTtcblxuXHQgICAgICAgIGZ1bmN0aW9uIGhhbmRsZVRpbWVyKCkge1xuXHQgICAgICAgICAgICAvLyBXaGljaGV2ZXIgdGltZXIgc3VjY2VlZHMgd2lsbCBjYW5jZWwgYm90aCB0aW1lcnMgYW5kXG5cdCAgICAgICAgICAgIC8vIGV4ZWN1dGUgdGhlIGNhbGxiYWNrLlxuXHQgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG5cdCAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGUpO1xuXHQgICAgICAgICAgICBjYWxsYmFjaygpO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cdH1cblxuXHQvLyBUaGlzIGlzIGZvciBgYXNhcC5qc2Agb25seS5cblx0Ly8gSXRzIG5hbWUgd2lsbCBiZSBwZXJpb2RpY2FsbHkgcmFuZG9taXplZCB0byBicmVhayBhbnkgY29kZSB0aGF0IGRlcGVuZHMgb25cblx0Ly8gaXRzIGV4aXN0ZW5jZS5cblx0cmF3QXNhcC5tYWtlUmVxdWVzdENhbGxGcm9tVGltZXIgPSBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXI7XG5cblx0Ly8gQVNBUCB3YXMgb3JpZ2luYWxseSBhIG5leHRUaWNrIHNoaW0gaW5jbHVkZWQgaW4gUS4gVGhpcyB3YXMgZmFjdG9yZWQgb3V0XG5cdC8vIGludG8gdGhpcyBBU0FQIHBhY2thZ2UuIEl0IHdhcyBsYXRlciBhZGFwdGVkIHRvIFJTVlAgd2hpY2ggbWFkZSBmdXJ0aGVyXG5cdC8vIGFtZW5kbWVudHMuIFRoZXNlIGRlY2lzaW9ucywgcGFydGljdWxhcmx5IHRvIG1hcmdpbmFsaXplIE1lc3NhZ2VDaGFubmVsIGFuZFxuXHQvLyB0byBjYXB0dXJlIHRoZSBNdXRhdGlvbk9ic2VydmVyIGltcGxlbWVudGF0aW9uIGluIGEgY2xvc3VyZSwgd2VyZSBpbnRlZ3JhdGVkXG5cdC8vIGJhY2sgaW50byBBU0FQIHByb3Blci5cblx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3RpbGRlaW8vcnN2cC5qcy9ibG9iL2NkZGY3MjMyNTQ2YTljZjg1ODUyNGI3NWNkZTZmOWVkZjcyNjIwYTcvbGliL3JzdnAvYXNhcC5qc1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqL30uY2FsbChleHBvcnRzLCAoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KCkpKSlcblxuLyoqKi8gfSxcbi8qIDYgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvLyBBIHNpbXBsZSBjbGFzcyBzeXN0ZW0sIG1vcmUgZG9jdW1lbnRhdGlvbiB0byBjb21lXG5cblx0ZnVuY3Rpb24gZXh0ZW5kKGNscywgbmFtZSwgcHJvcHMpIHtcblx0ICAgIC8vIFRoaXMgZG9lcyB0aGF0IHNhbWUgdGhpbmcgYXMgT2JqZWN0LmNyZWF0ZSwgYnV0IHdpdGggc3VwcG9ydCBmb3IgSUU4XG5cdCAgICB2YXIgRiA9IGZ1bmN0aW9uKCkge307XG5cdCAgICBGLnByb3RvdHlwZSA9IGNscy5wcm90b3R5cGU7XG5cdCAgICB2YXIgcHJvdG90eXBlID0gbmV3IEYoKTtcblxuXHQgICAgLy8ganNoaW50IHVuZGVmOiBmYWxzZVxuXHQgICAgdmFyIGZuVGVzdCA9IC94eXovLnRlc3QoZnVuY3Rpb24oKXsgeHl6OyB9KSA/IC9cXGJwYXJlbnRcXGIvIDogLy4qLztcblx0ICAgIHByb3BzID0gcHJvcHMgfHwge307XG5cblx0ICAgIGZvcih2YXIgayBpbiBwcm9wcykge1xuXHQgICAgICAgIHZhciBzcmMgPSBwcm9wc1trXTtcblx0ICAgICAgICB2YXIgcGFyZW50ID0gcHJvdG90eXBlW2tdO1xuXG5cdCAgICAgICAgaWYodHlwZW9mIHBhcmVudCA9PT0gJ2Z1bmN0aW9uJyAmJlxuXHQgICAgICAgICAgIHR5cGVvZiBzcmMgPT09ICdmdW5jdGlvbicgJiZcblx0ICAgICAgICAgICBmblRlc3QudGVzdChzcmMpKSB7XG5cdCAgICAgICAgICAgIC8qanNoaW50IC1XMDgzICovXG5cdCAgICAgICAgICAgIHByb3RvdHlwZVtrXSA9IChmdW5jdGlvbiAoc3JjLCBwYXJlbnQpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSBjdXJyZW50IHBhcmVudCBtZXRob2Rcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgdG1wID0gdGhpcy5wYXJlbnQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvLyBTZXQgcGFyZW50IHRvIHRoZSBwcmV2aW91cyBtZXRob2QsIGNhbGwsIGFuZCByZXN0b3JlXG5cdCAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHJlcyA9IHNyYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gdG1wO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcblx0ICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH0pKHNyYywgcGFyZW50KTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHByb3RvdHlwZVtrXSA9IHNyYztcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIHByb3RvdHlwZS50eXBlbmFtZSA9IG5hbWU7XG5cblx0ICAgIHZhciBuZXdfY2xzID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYocHJvdG90eXBlLmluaXQpIHtcblx0ICAgICAgICAgICAgcHJvdG90eXBlLmluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICBuZXdfY2xzLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcblx0ICAgIG5ld19jbHMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gbmV3X2NscztcblxuXHQgICAgbmV3X2Nscy5leHRlbmQgPSBmdW5jdGlvbihuYW1lLCBwcm9wcykge1xuXHQgICAgICAgIGlmKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuXHQgICAgICAgICAgICBwcm9wcyA9IG5hbWU7XG5cdCAgICAgICAgICAgIG5hbWUgPSAnYW5vbnltb3VzJztcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGV4dGVuZChuZXdfY2xzLCBuYW1lLCBwcm9wcyk7XG5cdCAgICB9O1xuXG5cdCAgICByZXR1cm4gbmV3X2Nscztcblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzID0gZXh0ZW5kKE9iamVjdCwgJ09iamVjdCcsIHt9KTtcblxuXG4vKioqLyB9LFxuLyogNyAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgciA9IF9fd2VicGFja19yZXF1aXJlX18oOCk7XG5cblx0ZnVuY3Rpb24gbm9ybWFsaXplKHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcblx0ICAgIGlmKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB2YWx1ZTtcblx0fVxuXG5cdHZhciBmaWx0ZXJzID0ge1xuXHQgICAgYWJzOiBmdW5jdGlvbihuKSB7XG5cdCAgICAgICAgcmV0dXJuIE1hdGguYWJzKG4pO1xuXHQgICAgfSxcblxuXHQgICAgYmF0Y2g6IGZ1bmN0aW9uKGFyciwgbGluZWNvdW50LCBmaWxsX3dpdGgpIHtcblx0ICAgICAgICB2YXIgaTtcblx0ICAgICAgICB2YXIgcmVzID0gW107XG5cdCAgICAgICAgdmFyIHRtcCA9IFtdO1xuXG5cdCAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGlmKGkgJSBsaW5lY291bnQgPT09IDAgJiYgdG1wLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgcmVzLnB1c2godG1wKTtcblx0ICAgICAgICAgICAgICAgIHRtcCA9IFtdO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdG1wLnB1c2goYXJyW2ldKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZih0bXAubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIGlmKGZpbGxfd2l0aCkge1xuXHQgICAgICAgICAgICAgICAgZm9yKGkgPSB0bXAubGVuZ3RoOyBpIDwgbGluZWNvdW50OyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICB0bXAucHVzaChmaWxsX3dpdGgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmVzLnB1c2godG1wKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gcmVzO1xuXHQgICAgfSxcblxuXHQgICAgY2FwaXRhbGl6ZTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHZhciByZXQgPSBzdHIudG9Mb3dlckNhc2UoKTtcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyByZXQuc2xpY2UoMSkpO1xuXHQgICAgfSxcblxuXHQgICAgY2VudGVyOiBmdW5jdGlvbihzdHIsIHdpZHRoKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHdpZHRoID0gd2lkdGggfHwgODA7XG5cblx0ICAgICAgICBpZihzdHIubGVuZ3RoID49IHdpZHRoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHNwYWNlcyA9IHdpZHRoIC0gc3RyLmxlbmd0aDtcblx0ICAgICAgICB2YXIgcHJlID0gbGliLnJlcGVhdCgnICcsIHNwYWNlcy8yIC0gc3BhY2VzICUgMik7XG5cdCAgICAgICAgdmFyIHBvc3QgPSBsaWIucmVwZWF0KCcgJywgc3BhY2VzLzIpO1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHByZSArIHN0ciArIHBvc3QpO1xuXHQgICAgfSxcblxuXHQgICAgJ2RlZmF1bHQnOiBmdW5jdGlvbih2YWwsIGRlZiwgYm9vbCkge1xuXHQgICAgICAgIGlmKGJvb2wpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhbCA/IHZhbCA6IGRlZjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHJldHVybiAodmFsICE9PSB1bmRlZmluZWQpID8gdmFsIDogZGVmO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGRpY3Rzb3J0OiBmdW5jdGlvbih2YWwsIGNhc2Vfc2Vuc2l0aXZlLCBieSkge1xuXHQgICAgICAgIGlmICghbGliLmlzT2JqZWN0KHZhbCkpIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKCdkaWN0c29ydCBmaWx0ZXI6IHZhbCBtdXN0IGJlIGFuIG9iamVjdCcpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBhcnJheSA9IFtdO1xuXHQgICAgICAgIGZvciAodmFyIGsgaW4gdmFsKSB7XG5cdCAgICAgICAgICAgIC8vIGRlbGliZXJhdGVseSBpbmNsdWRlIHByb3BlcnRpZXMgZnJvbSB0aGUgb2JqZWN0J3MgcHJvdG90eXBlXG5cdCAgICAgICAgICAgIGFycmF5LnB1c2goW2ssdmFsW2tdXSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHNpO1xuXHQgICAgICAgIGlmIChieSA9PT0gdW5kZWZpbmVkIHx8IGJ5ID09PSAna2V5Jykge1xuXHQgICAgICAgICAgICBzaSA9IDA7XG5cdCAgICAgICAgfSBlbHNlIGlmIChieSA9PT0gJ3ZhbHVlJykge1xuXHQgICAgICAgICAgICBzaSA9IDE7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKFxuXHQgICAgICAgICAgICAgICAgJ2RpY3Rzb3J0IGZpbHRlcjogWW91IGNhbiBvbmx5IHNvcnQgYnkgZWl0aGVyIGtleSBvciB2YWx1ZScpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGFycmF5LnNvcnQoZnVuY3Rpb24odDEsIHQyKSB7XG5cdCAgICAgICAgICAgIHZhciBhID0gdDFbc2ldO1xuXHQgICAgICAgICAgICB2YXIgYiA9IHQyW3NpXTtcblxuXHQgICAgICAgICAgICBpZiAoIWNhc2Vfc2Vuc2l0aXZlKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAobGliLmlzU3RyaW5nKGEpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYSA9IGEudG9VcHBlckNhc2UoKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGlmIChsaWIuaXNTdHJpbmcoYikpIHtcblx0ICAgICAgICAgICAgICAgICAgICBiID0gYi50b1VwcGVyQ2FzZSgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIGEgPiBiID8gMSA6IChhID09PSBiID8gMCA6IC0xKTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiBhcnJheTtcblx0ICAgIH0sXG5cblx0ICAgIGR1bXA6IGZ1bmN0aW9uKG9iaiwgc3BhY2VzKSB7XG5cdCAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgc3BhY2VzKTtcblx0ICAgIH0sXG5cblx0ICAgIGVzY2FwZTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgaWYoc3RyIGluc3RhbmNlb2Ygci5TYWZlU3RyaW5nKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHN0ciA9IChzdHIgPT09IG51bGwgfHwgc3RyID09PSB1bmRlZmluZWQpID8gJycgOiBzdHI7XG5cdCAgICAgICAgcmV0dXJuIHIubWFya1NhZmUobGliLmVzY2FwZShzdHIudG9TdHJpbmcoKSkpO1xuXHQgICAgfSxcblxuXHQgICAgc2FmZTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgaWYgKHN0ciBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykge1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBzdHIgPSAoc3RyID09PSBudWxsIHx8IHN0ciA9PT0gdW5kZWZpbmVkKSA/ICcnIDogc3RyO1xuXHQgICAgICAgIHJldHVybiByLm1hcmtTYWZlKHN0ci50b1N0cmluZygpKTtcblx0ICAgIH0sXG5cblx0ICAgIGZpcnN0OiBmdW5jdGlvbihhcnIpIHtcblx0ICAgICAgICByZXR1cm4gYXJyWzBdO1xuXHQgICAgfSxcblxuXHQgICAgZ3JvdXBieTogZnVuY3Rpb24oYXJyLCBhdHRyKSB7XG5cdCAgICAgICAgcmV0dXJuIGxpYi5ncm91cEJ5KGFyciwgYXR0cik7XG5cdCAgICB9LFxuXG5cdCAgICBpbmRlbnQ6IGZ1bmN0aW9uKHN0ciwgd2lkdGgsIGluZGVudGZpcnN0KSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXG5cdCAgICAgICAgaWYgKHN0ciA9PT0gJycpIHJldHVybiAnJztcblxuXHQgICAgICAgIHdpZHRoID0gd2lkdGggfHwgNDtcblx0ICAgICAgICB2YXIgcmVzID0gJyc7XG5cdCAgICAgICAgdmFyIGxpbmVzID0gc3RyLnNwbGl0KCdcXG4nKTtcblx0ICAgICAgICB2YXIgc3AgPSBsaWIucmVwZWF0KCcgJywgd2lkdGgpO1xuXG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8bGluZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgaWYoaSA9PT0gMCAmJiAhaW5kZW50Zmlyc3QpIHtcblx0ICAgICAgICAgICAgICAgIHJlcyArPSBsaW5lc1tpXSArICdcXG4nO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcmVzICs9IHNwICsgbGluZXNbaV0gKyAnXFxuJztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHJlcyk7XG5cdCAgICB9LFxuXG5cdCAgICBqb2luOiBmdW5jdGlvbihhcnIsIGRlbCwgYXR0cikge1xuXHQgICAgICAgIGRlbCA9IGRlbCB8fCAnJztcblxuXHQgICAgICAgIGlmKGF0dHIpIHtcblx0ICAgICAgICAgICAgYXJyID0gbGliLm1hcChhcnIsIGZ1bmN0aW9uKHYpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB2W2F0dHJdO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gYXJyLmpvaW4oZGVsKTtcblx0ICAgIH0sXG5cblx0ICAgIGxhc3Q6IGZ1bmN0aW9uKGFycikge1xuXHQgICAgICAgIHJldHVybiBhcnJbYXJyLmxlbmd0aC0xXTtcblx0ICAgIH0sXG5cblx0ICAgIGxlbmd0aDogZnVuY3Rpb24odmFsKSB7XG5cdCAgICAgICAgdmFyIHZhbHVlID0gbm9ybWFsaXplKHZhbCwgJycpO1xuXG5cdCAgICAgICAgaWYodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICBpZihcblx0ICAgICAgICAgICAgICAgICh0eXBlb2YgTWFwID09PSAnZnVuY3Rpb24nICYmIHZhbHVlIGluc3RhbmNlb2YgTWFwKSB8fFxuXHQgICAgICAgICAgICAgICAgKHR5cGVvZiBTZXQgPT09ICdmdW5jdGlvbicgJiYgdmFsdWUgaW5zdGFuY2VvZiBTZXQpXG5cdCAgICAgICAgICAgICkge1xuXHQgICAgICAgICAgICAgICAgLy8gRUNNQVNjcmlwdCAyMDE1IE1hcHMgYW5kIFNldHNcblx0ICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5zaXplO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmKGxpYi5pc09iamVjdCh2YWx1ZSkgJiYgISh2YWx1ZSBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykpIHtcblx0ICAgICAgICAgICAgICAgIC8vIE9iamVjdHMgKGJlc2lkZXMgU2FmZVN0cmluZ3MpLCBub24tcHJpbWF0aXZlIEFycmF5c1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGg7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIDA7XG5cdCAgICB9LFxuXG5cdCAgICBsaXN0OiBmdW5jdGlvbih2YWwpIHtcblx0ICAgICAgICBpZihsaWIuaXNTdHJpbmcodmFsKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFsLnNwbGl0KCcnKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihsaWIuaXNPYmplY3QodmFsKSkge1xuXHQgICAgICAgICAgICB2YXIga2V5cyA9IFtdO1xuXG5cdCAgICAgICAgICAgIGlmKE9iamVjdC5rZXlzKSB7XG5cdCAgICAgICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXModmFsKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIGZvcih2YXIgayBpbiB2YWwpIHtcblx0ICAgICAgICAgICAgICAgICAgICBrZXlzLnB1c2goayk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gbGliLm1hcChrZXlzLCBmdW5jdGlvbihrKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4geyBrZXk6IGssXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsW2tdIH07XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKGxpYi5pc0FycmF5KHZhbCkpIHtcblx0ICAgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoJ2xpc3QgZmlsdGVyOiB0eXBlIG5vdCBpdGVyYWJsZScpO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGxvd2VyOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpO1xuXHQgICAgfSxcblxuXHQgICAgbmwyYnI6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIGlmIChzdHIgPT09IG51bGwgfHwgc3RyID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuICcnO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCBzdHIucmVwbGFjZSgvXFxyXFxufFxcbi9nLCAnPGJyIC8+XFxuJykpO1xuXHQgICAgfSxcblxuXHQgICAgcmFuZG9tOiBmdW5jdGlvbihhcnIpIHtcblx0ICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcblx0ICAgIH0sXG5cblx0ICAgIHJlamVjdGF0dHI6IGZ1bmN0aW9uKGFyciwgYXR0cikge1xuXHQgICAgICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuXHQgICAgICAgIHJldHVybiAhaXRlbVthdHRyXTtcblx0ICAgICAgfSk7XG5cdCAgICB9LFxuXG5cdCAgICBzZWxlY3RhdHRyOiBmdW5jdGlvbihhcnIsIGF0dHIpIHtcblx0ICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcblx0ICAgICAgICByZXR1cm4gISFpdGVtW2F0dHJdO1xuXHQgICAgICB9KTtcblx0ICAgIH0sXG5cblx0ICAgIHJlcGxhY2U6IGZ1bmN0aW9uKHN0ciwgb2xkLCBuZXdfLCBtYXhDb3VudCkge1xuXHQgICAgICAgIHZhciBvcmlnaW5hbFN0ciA9IHN0cjtcblxuXHQgICAgICAgIGlmIChvbGQgaW5zdGFuY2VvZiBSZWdFeHApIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKG9sZCwgbmV3Xyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYodHlwZW9mIG1heENvdW50ID09PSAndW5kZWZpbmVkJyl7XG5cdCAgICAgICAgICAgIG1heENvdW50ID0gLTE7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHJlcyA9ICcnOyAgLy8gT3V0cHV0XG5cblx0ICAgICAgICAvLyBDYXN0IE51bWJlcnMgaW4gdGhlIHNlYXJjaCB0ZXJtIHRvIHN0cmluZ1xuXHQgICAgICAgIGlmKHR5cGVvZiBvbGQgPT09ICdudW1iZXInKXtcblx0ICAgICAgICAgICAgb2xkID0gb2xkICsgJyc7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYodHlwZW9mIG9sZCAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgLy8gSWYgaXQgaXMgc29tZXRoaW5nIG90aGVyIHRoYW4gbnVtYmVyIG9yIHN0cmluZyxcblx0ICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSBvcmlnaW5hbCBzdHJpbmdcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBDYXN0IG51bWJlcnMgaW4gdGhlIHJlcGxhY2VtZW50IHRvIHN0cmluZ1xuXHQgICAgICAgIGlmKHR5cGVvZiBzdHIgPT09ICdudW1iZXInKXtcblx0ICAgICAgICAgICAgc3RyID0gc3RyICsgJyc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gSWYgYnkgbm93LCB3ZSBkb24ndCBoYXZlIGEgc3RyaW5nLCB0aHJvdyBpdCBiYWNrXG5cdCAgICAgICAgaWYodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycgJiYgIShzdHIgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpKXtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBTaG9ydENpcmN1aXRzXG5cdCAgICAgICAgaWYob2xkID09PSAnJyl7XG5cdCAgICAgICAgICAgIC8vIE1pbWljIHRoZSBweXRob24gYmVoYXZpb3VyOiBlbXB0eSBzdHJpbmcgaXMgcmVwbGFjZWRcblx0ICAgICAgICAgICAgLy8gYnkgcmVwbGFjZW1lbnQgZS5nLiBcImFiY1wifHJlcGxhY2UoXCJcIiwgXCIuXCIpIC0+IC5hLmIuYy5cblx0ICAgICAgICAgICAgcmVzID0gbmV3XyArIHN0ci5zcGxpdCgnJykuam9pbihuZXdfKSArIG5ld187XG5cdCAgICAgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHJlcyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIG5leHRJbmRleCA9IHN0ci5pbmRleE9mKG9sZCk7XG5cdCAgICAgICAgLy8gaWYgIyBvZiByZXBsYWNlbWVudHMgdG8gcGVyZm9ybSBpcyAwLCBvciB0aGUgc3RyaW5nIHRvIGRvZXNcblx0ICAgICAgICAvLyBub3QgY29udGFpbiB0aGUgb2xkIHZhbHVlLCByZXR1cm4gdGhlIHN0cmluZ1xuXHQgICAgICAgIGlmKG1heENvdW50ID09PSAwIHx8IG5leHRJbmRleCA9PT0gLTEpe1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBwb3MgPSAwO1xuXHQgICAgICAgIHZhciBjb3VudCA9IDA7IC8vICMgb2YgcmVwbGFjZW1lbnRzIG1hZGVcblxuXHQgICAgICAgIHdoaWxlKG5leHRJbmRleCAgPiAtMSAmJiAobWF4Q291bnQgPT09IC0xIHx8IGNvdW50IDwgbWF4Q291bnQpKXtcblx0ICAgICAgICAgICAgLy8gR3JhYiB0aGUgbmV4dCBjaHVuayBvZiBzcmMgc3RyaW5nIGFuZCBhZGQgaXQgd2l0aCB0aGVcblx0ICAgICAgICAgICAgLy8gcmVwbGFjZW1lbnQsIHRvIHRoZSByZXN1bHRcblx0ICAgICAgICAgICAgcmVzICs9IHN0ci5zdWJzdHJpbmcocG9zLCBuZXh0SW5kZXgpICsgbmV3Xztcblx0ICAgICAgICAgICAgLy8gSW5jcmVtZW50IG91ciBwb2ludGVyIGluIHRoZSBzcmMgc3RyaW5nXG5cdCAgICAgICAgICAgIHBvcyA9IG5leHRJbmRleCArIG9sZC5sZW5ndGg7XG5cdCAgICAgICAgICAgIGNvdW50Kys7XG5cdCAgICAgICAgICAgIC8vIFNlZSBpZiB0aGVyZSBhcmUgYW55IG1vcmUgcmVwbGFjZW1lbnRzIHRvIGJlIG1hZGVcblx0ICAgICAgICAgICAgbmV4dEluZGV4ID0gc3RyLmluZGV4T2Yob2xkLCBwb3MpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIFdlJ3ZlIGVpdGhlciByZWFjaGVkIHRoZSBlbmQsIG9yIGRvbmUgdGhlIG1heCAjIG9mXG5cdCAgICAgICAgLy8gcmVwbGFjZW1lbnRzLCB0YWNrIG9uIGFueSByZW1haW5pbmcgc3RyaW5nXG5cdCAgICAgICAgaWYocG9zIDwgc3RyLmxlbmd0aCkge1xuXHQgICAgICAgICAgICByZXMgKz0gc3RyLnN1YnN0cmluZyhwb3MpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhvcmlnaW5hbFN0ciwgcmVzKTtcblx0ICAgIH0sXG5cblx0ICAgIHJldmVyc2U6IGZ1bmN0aW9uKHZhbCkge1xuXHQgICAgICAgIHZhciBhcnI7XG5cdCAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICAgICAgYXJyID0gZmlsdGVycy5saXN0KHZhbCk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAvLyBDb3B5IGl0XG5cdCAgICAgICAgICAgIGFyciA9IGxpYi5tYXAodmFsLCBmdW5jdGlvbih2KSB7IHJldHVybiB2OyB9KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBhcnIucmV2ZXJzZSgpO1xuXG5cdCAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHZhbCwgYXJyLmpvaW4oJycpKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGFycjtcblx0ICAgIH0sXG5cblx0ICAgIHJvdW5kOiBmdW5jdGlvbih2YWwsIHByZWNpc2lvbiwgbWV0aG9kKSB7XG5cdCAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uIHx8IDA7XG5cdCAgICAgICAgdmFyIGZhY3RvciA9IE1hdGgucG93KDEwLCBwcmVjaXNpb24pO1xuXHQgICAgICAgIHZhciByb3VuZGVyO1xuXG5cdCAgICAgICAgaWYobWV0aG9kID09PSAnY2VpbCcpIHtcblx0ICAgICAgICAgICAgcm91bmRlciA9IE1hdGguY2VpbDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihtZXRob2QgPT09ICdmbG9vcicpIHtcblx0ICAgICAgICAgICAgcm91bmRlciA9IE1hdGguZmxvb3I7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICByb3VuZGVyID0gTWF0aC5yb3VuZDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gcm91bmRlcih2YWwgKiBmYWN0b3IpIC8gZmFjdG9yO1xuXHQgICAgfSxcblxuXHQgICAgc2xpY2U6IGZ1bmN0aW9uKGFyciwgc2xpY2VzLCBmaWxsV2l0aCkge1xuXHQgICAgICAgIHZhciBzbGljZUxlbmd0aCA9IE1hdGguZmxvb3IoYXJyLmxlbmd0aCAvIHNsaWNlcyk7XG5cdCAgICAgICAgdmFyIGV4dHJhID0gYXJyLmxlbmd0aCAlIHNsaWNlcztcblx0ICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcblx0ICAgICAgICB2YXIgcmVzID0gW107XG5cblx0ICAgICAgICBmb3IodmFyIGk9MDsgaTxzbGljZXM7IGkrKykge1xuXHQgICAgICAgICAgICB2YXIgc3RhcnQgPSBvZmZzZXQgKyBpICogc2xpY2VMZW5ndGg7XG5cdCAgICAgICAgICAgIGlmKGkgPCBleHRyYSkge1xuXHQgICAgICAgICAgICAgICAgb2Zmc2V0Kys7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgdmFyIGVuZCA9IG9mZnNldCArIChpICsgMSkgKiBzbGljZUxlbmd0aDtcblxuXHQgICAgICAgICAgICB2YXIgc2xpY2UgPSBhcnIuc2xpY2Uoc3RhcnQsIGVuZCk7XG5cdCAgICAgICAgICAgIGlmKGZpbGxXaXRoICYmIGkgPj0gZXh0cmEpIHtcblx0ICAgICAgICAgICAgICAgIHNsaWNlLnB1c2goZmlsbFdpdGgpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJlcy5wdXNoKHNsaWNlKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gcmVzO1xuXHQgICAgfSxcblxuXHQgICAgc3VtOiBmdW5jdGlvbihhcnIsIGF0dHIsIHN0YXJ0KSB7XG5cdCAgICAgICAgdmFyIHN1bSA9IDA7XG5cblx0ICAgICAgICBpZih0eXBlb2Ygc3RhcnQgPT09ICdudW1iZXInKXtcblx0ICAgICAgICAgICAgc3VtICs9IHN0YXJ0O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKGF0dHIpIHtcblx0ICAgICAgICAgICAgYXJyID0gbGliLm1hcChhcnIsIGZ1bmN0aW9uKHYpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB2W2F0dHJdO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIHN1bSArPSBhcnJbaV07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHN1bTtcblx0ICAgIH0sXG5cblx0ICAgIHNvcnQ6IHIubWFrZU1hY3JvKFsndmFsdWUnLCAncmV2ZXJzZScsICdjYXNlX3NlbnNpdGl2ZScsICdhdHRyaWJ1dGUnXSwgW10sIGZ1bmN0aW9uKGFyciwgcmV2ZXJzZSwgY2FzZVNlbnMsIGF0dHIpIHtcblx0ICAgICAgICAgLy8gQ29weSBpdFxuXHQgICAgICAgIGFyciA9IGxpYi5tYXAoYXJyLCBmdW5jdGlvbih2KSB7IHJldHVybiB2OyB9KTtcblxuXHQgICAgICAgIGFyci5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcblx0ICAgICAgICAgICAgdmFyIHgsIHk7XG5cblx0ICAgICAgICAgICAgaWYoYXR0cikge1xuXHQgICAgICAgICAgICAgICAgeCA9IGFbYXR0cl07XG5cdCAgICAgICAgICAgICAgICB5ID0gYlthdHRyXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHggPSBhO1xuXHQgICAgICAgICAgICAgICAgeSA9IGI7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZighY2FzZVNlbnMgJiYgbGliLmlzU3RyaW5nKHgpICYmIGxpYi5pc1N0cmluZyh5KSkge1xuXHQgICAgICAgICAgICAgICAgeCA9IHgudG9Mb3dlckNhc2UoKTtcblx0ICAgICAgICAgICAgICAgIHkgPSB5LnRvTG93ZXJDYXNlKCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZih4IDwgeSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHJldmVyc2UgPyAxIDogLTE7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZih4ID4geSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHJldmVyc2UgPyAtMTogMTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiAwO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gYXJyO1xuXHQgICAgfSksXG5cblx0ICAgIHN0cmluZzogZnVuY3Rpb24ob2JqKSB7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKG9iaiwgb2JqKTtcblx0ICAgIH0sXG5cblx0ICAgIHN0cmlwdGFnczogZnVuY3Rpb24oaW5wdXQsIHByZXNlcnZlX2xpbmVicmVha3MpIHtcblx0ICAgICAgICBpbnB1dCA9IG5vcm1hbGl6ZShpbnB1dCwgJycpO1xuXHQgICAgICAgIHByZXNlcnZlX2xpbmVicmVha3MgPSBwcmVzZXJ2ZV9saW5lYnJlYWtzIHx8IGZhbHNlO1xuXHQgICAgICAgIHZhciB0YWdzID0gLzxcXC8/KFthLXpdW2EtejAtOV0qKVxcYltePl0qPnw8IS0tW1xcc1xcU10qPy0tPi9naTtcblx0ICAgICAgICB2YXIgdHJpbW1lZElucHV0ID0gZmlsdGVycy50cmltKGlucHV0LnJlcGxhY2UodGFncywgJycpKTtcblx0ICAgICAgICB2YXIgcmVzID0gJyc7XG5cdCAgICAgICAgaWYgKHByZXNlcnZlX2xpbmVicmVha3MpIHtcblx0ICAgICAgICAgICAgcmVzID0gdHJpbW1lZElucHV0XG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvXiArfCArJC9nbSwgJycpICAgICAvLyByZW1vdmUgbGVhZGluZyBhbmQgdHJhaWxpbmcgc3BhY2VzXG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvICsvZywgJyAnKSAgICAgICAgICAvLyBzcXVhc2ggYWRqYWNlbnQgc3BhY2VzXG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvKFxcclxcbikvZywgJ1xcbicpICAgICAvLyBub3JtYWxpemUgbGluZWJyZWFrcyAoQ1JMRiAtPiBMRilcblx0ICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXG5cXG5cXG4rL2csICdcXG5cXG4nKTsgLy8gc3F1YXNoIGFibm9ybWFsIGFkamFjZW50IGxpbmVicmVha3Ncblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICByZXMgPSB0cmltbWVkSW5wdXQucmVwbGFjZSgvXFxzKy9naSwgJyAnKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKGlucHV0LCByZXMpO1xuXHQgICAgfSxcblxuXHQgICAgdGl0bGU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB2YXIgd29yZHMgPSBzdHIuc3BsaXQoJyAnKTtcblx0ICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgd29yZHMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgd29yZHNbaV0gPSBmaWx0ZXJzLmNhcGl0YWxpemUod29yZHNbaV0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCB3b3Jkcy5qb2luKCcgJykpO1xuXHQgICAgfSxcblxuXHQgICAgdHJpbTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgc3RyLnJlcGxhY2UoL15cXHMqfFxccyokL2csICcnKSk7XG5cdCAgICB9LFxuXG5cdCAgICB0cnVuY2F0ZTogZnVuY3Rpb24oaW5wdXQsIGxlbmd0aCwga2lsbHdvcmRzLCBlbmQpIHtcblx0ICAgICAgICB2YXIgb3JpZyA9IGlucHV0O1xuXHQgICAgICAgIGlucHV0ID0gbm9ybWFsaXplKGlucHV0LCAnJyk7XG5cdCAgICAgICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDI1NTtcblxuXHQgICAgICAgIGlmIChpbnB1dC5sZW5ndGggPD0gbGVuZ3RoKVxuXHQgICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG5cblx0ICAgICAgICBpZiAoa2lsbHdvcmRzKSB7XG5cdCAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyaW5nKDAsIGxlbmd0aCk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIGlkeCA9IGlucHV0Lmxhc3RJbmRleE9mKCcgJywgbGVuZ3RoKTtcblx0ICAgICAgICAgICAgaWYoaWR4ID09PSAtMSkge1xuXHQgICAgICAgICAgICAgICAgaWR4ID0gbGVuZ3RoO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgaWR4KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpbnB1dCArPSAoZW5kICE9PSB1bmRlZmluZWQgJiYgZW5kICE9PSBudWxsKSA/IGVuZCA6ICcuLi4nO1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhvcmlnLCBpbnB1dCk7XG5cdCAgICB9LFxuXG5cdCAgICB1cHBlcjogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHJldHVybiBzdHIudG9VcHBlckNhc2UoKTtcblx0ICAgIH0sXG5cblx0ICAgIHVybGVuY29kZTogZnVuY3Rpb24ob2JqKSB7XG5cdCAgICAgICAgdmFyIGVuYyA9IGVuY29kZVVSSUNvbXBvbmVudDtcblx0ICAgICAgICBpZiAobGliLmlzU3RyaW5nKG9iaikpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGVuYyhvYmopO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBwYXJ0cztcblx0ICAgICAgICAgICAgaWYgKGxpYi5pc0FycmF5KG9iaikpIHtcblx0ICAgICAgICAgICAgICAgIHBhcnRzID0gb2JqLm1hcChmdW5jdGlvbihpdGVtKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuYyhpdGVtWzBdKSArICc9JyArIGVuYyhpdGVtWzFdKTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcGFydHMgPSBbXTtcblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKGVuYyhrKSArICc9JyArIGVuYyhvYmpba10pKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oJyYnKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICB1cmxpemU6IGZ1bmN0aW9uKHN0ciwgbGVuZ3RoLCBub2ZvbGxvdykge1xuXHQgICAgICAgIGlmIChpc05hTihsZW5ndGgpKSBsZW5ndGggPSBJbmZpbml0eTtcblxuXHQgICAgICAgIHZhciBub0ZvbGxvd0F0dHIgPSAobm9mb2xsb3cgPT09IHRydWUgPyAnIHJlbD1cIm5vZm9sbG93XCInIDogJycpO1xuXG5cdCAgICAgICAgLy8gRm9yIHRoZSBqaW5qYSByZWdleHAsIHNlZVxuXHQgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9taXRzdWhpa28vamluamEyL2Jsb2IvZjE1YjgxNGRjYmE2YWExMmJjNzRkMWY3ZDBjODgxZDU1ZjcxMjZiZS9qaW5qYTIvdXRpbHMucHkjTDIwLUwyM1xuXHQgICAgICAgIHZhciBwdW5jUkUgPSAvXig/OlxcKHw8fCZsdDspPyguKj8pKD86XFwufCx8XFwpfFxcbnwmZ3Q7KT8kLztcblx0ICAgICAgICAvLyBmcm9tIGh0dHA6Ly9ibG9nLmdlcnYubmV0LzIwMTEvMDUvaHRtbDVfZW1haWxfYWRkcmVzc19yZWdleHAvXG5cdCAgICAgICAgdmFyIGVtYWlsUkUgPSAvXltcXHcuISMkJSYnKitcXC1cXC89P1xcXmB7fH1+XStAW2EtelxcZFxcLV0rKFxcLlthLXpcXGRcXC1dKykrJC9pO1xuXHQgICAgICAgIHZhciBodHRwSHR0cHNSRSA9IC9eaHR0cHM/OlxcL1xcLy4qJC87XG5cdCAgICAgICAgdmFyIHd3d1JFID0gL153d3dcXC4vO1xuXHQgICAgICAgIHZhciB0bGRSRSA9IC9cXC4oPzpvcmd8bmV0fGNvbSkoPzpcXDp8XFwvfCQpLztcblxuXHQgICAgICAgIHZhciB3b3JkcyA9IHN0ci5zcGxpdCgvKFxccyspLykuZmlsdGVyKGZ1bmN0aW9uKHdvcmQpIHtcblx0ICAgICAgICAgIC8vIElmIHRoZSB3b3JkIGhhcyBubyBsZW5ndGgsIGJhaWwuIFRoaXMgY2FuIGhhcHBlbiBmb3Igc3RyIHdpdGhcblx0ICAgICAgICAgIC8vIHRyYWlsaW5nIHdoaXRlc3BhY2UuXG5cdCAgICAgICAgICByZXR1cm4gd29yZCAmJiB3b3JkLmxlbmd0aDtcblx0ICAgICAgICB9KS5tYXAoZnVuY3Rpb24od29yZCkge1xuXHQgICAgICAgICAgdmFyIG1hdGNoZXMgPSB3b3JkLm1hdGNoKHB1bmNSRSk7XG5cdCAgICAgICAgICB2YXIgcG9zc2libGVVcmwgPSBtYXRjaGVzICYmIG1hdGNoZXNbMV0gfHwgd29yZDtcblxuXHQgICAgICAgICAgLy8gdXJsIHRoYXQgc3RhcnRzIHdpdGggaHR0cCBvciBodHRwc1xuXHQgICAgICAgICAgaWYgKGh0dHBIdHRwc1JFLnRlc3QocG9zc2libGVVcmwpKVxuXHQgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCInICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIC8vIHVybCB0aGF0IHN0YXJ0cyB3aXRoIHd3dy5cblx0ICAgICAgICAgIGlmICh3d3dSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovLycgKyBwb3NzaWJsZVVybCArICdcIicgKyBub0ZvbGxvd0F0dHIgKyAnPicgKyBwb3NzaWJsZVVybC5zdWJzdHIoMCwgbGVuZ3RoKSArICc8L2E+JztcblxuXHQgICAgICAgICAgLy8gYW4gZW1haWwgYWRkcmVzcyBvZiB0aGUgZm9ybSB1c2VybmFtZUBkb21haW4udGxkXG5cdCAgICAgICAgICBpZiAoZW1haWxSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwibWFpbHRvOicgKyBwb3NzaWJsZVVybCArICdcIj4nICsgcG9zc2libGVVcmwgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIC8vIHVybCB0aGF0IGVuZHMgaW4gLmNvbSwgLm9yZyBvciAubmV0IHRoYXQgaXMgbm90IGFuIGVtYWlsIGFkZHJlc3Ncblx0ICAgICAgICAgIGlmICh0bGRSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovLycgKyBwb3NzaWJsZVVybCArICdcIicgKyBub0ZvbGxvd0F0dHIgKyAnPicgKyBwb3NzaWJsZVVybC5zdWJzdHIoMCwgbGVuZ3RoKSArICc8L2E+JztcblxuXHQgICAgICAgICAgcmV0dXJuIHdvcmQ7XG5cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiB3b3Jkcy5qb2luKCcnKTtcblx0ICAgIH0sXG5cblx0ICAgIHdvcmRjb3VudDogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHZhciB3b3JkcyA9IChzdHIpID8gc3RyLm1hdGNoKC9cXHcrL2cpIDogbnVsbDtcblx0ICAgICAgICByZXR1cm4gKHdvcmRzKSA/IHdvcmRzLmxlbmd0aCA6IG51bGw7XG5cdCAgICB9LFxuXG5cdCAgICAnZmxvYXQnOiBmdW5jdGlvbih2YWwsIGRlZikge1xuXHQgICAgICAgIHZhciByZXMgPSBwYXJzZUZsb2F0KHZhbCk7XG5cdCAgICAgICAgcmV0dXJuIGlzTmFOKHJlcykgPyBkZWYgOiByZXM7XG5cdCAgICB9LFxuXG5cdCAgICAnaW50JzogZnVuY3Rpb24odmFsLCBkZWYpIHtcblx0ICAgICAgICB2YXIgcmVzID0gcGFyc2VJbnQodmFsLCAxMCk7XG5cdCAgICAgICAgcmV0dXJuIGlzTmFOKHJlcykgPyBkZWYgOiByZXM7XG5cdCAgICB9XG5cdH07XG5cblx0Ly8gQWxpYXNlc1xuXHRmaWx0ZXJzLmQgPSBmaWx0ZXJzWydkZWZhdWx0J107XG5cdGZpbHRlcnMuZSA9IGZpbHRlcnMuZXNjYXBlO1xuXG5cdG1vZHVsZS5leHBvcnRzID0gZmlsdGVycztcblxuXG4vKioqLyB9LFxuLyogOCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgT2JqID0gX193ZWJwYWNrX3JlcXVpcmVfXyg2KTtcblxuXHQvLyBGcmFtZXMga2VlcCB0cmFjayBvZiBzY29waW5nIGJvdGggYXQgY29tcGlsZS10aW1lIGFuZCBydW4tdGltZSBzb1xuXHQvLyB3ZSBrbm93IGhvdyB0byBhY2Nlc3MgdmFyaWFibGVzLiBCbG9jayB0YWdzIGNhbiBpbnRyb2R1Y2Ugc3BlY2lhbFxuXHQvLyB2YXJpYWJsZXMsIGZvciBleGFtcGxlLlxuXHR2YXIgRnJhbWUgPSBPYmouZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uKHBhcmVudCwgaXNvbGF0ZVdyaXRlcykge1xuXHQgICAgICAgIHRoaXMudmFyaWFibGVzID0ge307XG5cdCAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG5cdCAgICAgICAgdGhpcy50b3BMZXZlbCA9IGZhbHNlO1xuXHQgICAgICAgIC8vIGlmIHRoaXMgaXMgdHJ1ZSwgd3JpdGVzIChzZXQpIHNob3VsZCBuZXZlciBwcm9wYWdhdGUgdXB3YXJkcyBwYXN0XG5cdCAgICAgICAgLy8gdGhpcyBmcmFtZSB0byBpdHMgcGFyZW50ICh0aG91Z2ggcmVhZHMgbWF5KS5cblx0ICAgICAgICB0aGlzLmlzb2xhdGVXcml0ZXMgPSBpc29sYXRlV3JpdGVzO1xuXHQgICAgfSxcblxuXHQgICAgc2V0OiBmdW5jdGlvbihuYW1lLCB2YWwsIHJlc29sdmVVcCkge1xuXHQgICAgICAgIC8vIEFsbG93IHZhcmlhYmxlcyB3aXRoIGRvdHMgYnkgYXV0b21hdGljYWxseSBjcmVhdGluZyB0aGVcblx0ICAgICAgICAvLyBuZXN0ZWQgc3RydWN0dXJlXG5cdCAgICAgICAgdmFyIHBhcnRzID0gbmFtZS5zcGxpdCgnLicpO1xuXHQgICAgICAgIHZhciBvYmogPSB0aGlzLnZhcmlhYmxlcztcblx0ICAgICAgICB2YXIgZnJhbWUgPSB0aGlzO1xuXG5cdCAgICAgICAgaWYocmVzb2x2ZVVwKSB7XG5cdCAgICAgICAgICAgIGlmKChmcmFtZSA9IHRoaXMucmVzb2x2ZShwYXJ0c1swXSwgdHJ1ZSkpKSB7XG5cdCAgICAgICAgICAgICAgICBmcmFtZS5zZXQobmFtZSwgdmFsKTtcblx0ICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZvcih2YXIgaT0wOyBpPHBhcnRzLmxlbmd0aCAtIDE7IGkrKykge1xuXHQgICAgICAgICAgICB2YXIgaWQgPSBwYXJ0c1tpXTtcblxuXHQgICAgICAgICAgICBpZighb2JqW2lkXSkge1xuXHQgICAgICAgICAgICAgICAgb2JqW2lkXSA9IHt9O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIG9iaiA9IG9ialtpZF07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgb2JqW3BhcnRzW3BhcnRzLmxlbmd0aCAtIDFdXSA9IHZhbDtcblx0ICAgIH0sXG5cblx0ICAgIGdldDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHZhciB2YWwgPSB0aGlzLnZhcmlhYmxlc1tuYW1lXTtcblx0ICAgICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gbnVsbDtcblx0ICAgIH0sXG5cblx0ICAgIGxvb2t1cDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHZhciBwID0gdGhpcy5wYXJlbnQ7XG5cdCAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuXHQgICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBwICYmIHAubG9va3VwKG5hbWUpO1xuXHQgICAgfSxcblxuXHQgICAgcmVzb2x2ZTogZnVuY3Rpb24obmFtZSwgZm9yV3JpdGUpIHtcblx0ICAgICAgICB2YXIgcCA9IChmb3JXcml0ZSAmJiB0aGlzLmlzb2xhdGVXcml0ZXMpID8gdW5kZWZpbmVkIDogdGhpcy5wYXJlbnQ7XG5cdCAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuXHQgICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gcCAmJiBwLnJlc29sdmUobmFtZSk7XG5cdCAgICB9LFxuXG5cdCAgICBwdXNoOiBmdW5jdGlvbihpc29sYXRlV3JpdGVzKSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBGcmFtZSh0aGlzLCBpc29sYXRlV3JpdGVzKTtcblx0ICAgIH0sXG5cblx0ICAgIHBvcDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50O1xuXHQgICAgfVxuXHR9KTtcblxuXHRmdW5jdGlvbiBtYWtlTWFjcm8oYXJnTmFtZXMsIGt3YXJnTmFtZXMsIGZ1bmMpIHtcblx0ICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgYXJnQ291bnQgPSBudW1BcmdzKGFyZ3VtZW50cyk7XG5cdCAgICAgICAgdmFyIGFyZ3M7XG5cdCAgICAgICAgdmFyIGt3YXJncyA9IGdldEtleXdvcmRBcmdzKGFyZ3VtZW50cyk7XG5cdCAgICAgICAgdmFyIGk7XG5cblx0ICAgICAgICBpZihhcmdDb3VudCA+IGFyZ05hbWVzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBhcmdOYW1lcy5sZW5ndGgpO1xuXG5cdCAgICAgICAgICAgIC8vIFBvc2l0aW9uYWwgYXJndW1lbnRzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCBpbiBhc1xuXHQgICAgICAgICAgICAvLyBrZXl3b3JkIGFyZ3VtZW50cyAoZXNzZW50aWFsbHkgZGVmYXVsdCB2YWx1ZXMpXG5cdCAgICAgICAgICAgIHZhciB2YWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCBhcmdzLmxlbmd0aCwgYXJnQ291bnQpO1xuXHQgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCB2YWxzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBpZihpIDwga3dhcmdOYW1lcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgICAgICBrd2FyZ3Nba3dhcmdOYW1lc1tpXV0gPSB2YWxzW2ldO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgYXJncy5wdXNoKGt3YXJncyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYoYXJnQ291bnQgPCBhcmdOYW1lcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgYXJnQ291bnQpO1xuXG5cdCAgICAgICAgICAgIGZvcihpID0gYXJnQ291bnQ7IGkgPCBhcmdOYW1lcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ05hbWVzW2ldO1xuXG5cdCAgICAgICAgICAgICAgICAvLyBLZXl3b3JkIGFyZ3VtZW50cyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgYXNcblx0ICAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uYWwgYXJndW1lbnRzLCBpLmUuIHRoZSBjYWxsZXIgZXhwbGljaXRseVxuXHQgICAgICAgICAgICAgICAgLy8gdXNlZCB0aGUgbmFtZSBvZiBhIHBvc2l0aW9uYWwgYXJnXG5cdCAgICAgICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzW2FyZ10pO1xuXHQgICAgICAgICAgICAgICAgZGVsZXRlIGt3YXJnc1thcmddO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgYXJncy5wdXNoKGt3YXJncyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHQgICAgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIG1ha2VLZXl3b3JkQXJncyhvYmopIHtcblx0ICAgIG9iai5fX2tleXdvcmRzID0gdHJ1ZTtcblx0ICAgIHJldHVybiBvYmo7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRLZXl3b3JkQXJncyhhcmdzKSB7XG5cdCAgICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG5cdCAgICBpZihsZW4pIHtcblx0ICAgICAgICB2YXIgbGFzdEFyZyA9IGFyZ3NbbGVuIC0gMV07XG5cdCAgICAgICAgaWYobGFzdEFyZyAmJiBsYXN0QXJnLmhhc093blByb3BlcnR5KCdfX2tleXdvcmRzJykpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGxhc3RBcmc7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIHt9O1xuXHR9XG5cblx0ZnVuY3Rpb24gbnVtQXJncyhhcmdzKSB7XG5cdCAgICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG5cdCAgICBpZihsZW4gPT09IDApIHtcblx0ICAgICAgICByZXR1cm4gMDtcblx0ICAgIH1cblxuXHQgICAgdmFyIGxhc3RBcmcgPSBhcmdzW2xlbiAtIDFdO1xuXHQgICAgaWYobGFzdEFyZyAmJiBsYXN0QXJnLmhhc093blByb3BlcnR5KCdfX2tleXdvcmRzJykpIHtcblx0ICAgICAgICByZXR1cm4gbGVuIC0gMTtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBsZW47XG5cdCAgICB9XG5cdH1cblxuXHQvLyBBIFNhZmVTdHJpbmcgb2JqZWN0IGluZGljYXRlcyB0aGF0IHRoZSBzdHJpbmcgc2hvdWxkIG5vdCBiZVxuXHQvLyBhdXRvZXNjYXBlZC4gVGhpcyBoYXBwZW5zIG1hZ2ljYWxseSBiZWNhdXNlIGF1dG9lc2NhcGluZyBvbmx5XG5cdC8vIG9jY3VycyBvbiBwcmltaXRpdmUgc3RyaW5nIG9iamVjdHMuXG5cdGZ1bmN0aW9uIFNhZmVTdHJpbmcodmFsKSB7XG5cdCAgICBpZih0eXBlb2YgdmFsICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICB9XG5cblx0ICAgIHRoaXMudmFsID0gdmFsO1xuXHQgICAgdGhpcy5sZW5ndGggPSB2YWwubGVuZ3RoO1xuXHR9XG5cblx0U2FmZVN0cmluZy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFN0cmluZy5wcm90b3R5cGUsIHtcblx0ICAgIGxlbmd0aDogeyB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB2YWx1ZTogMCB9XG5cdH0pO1xuXHRTYWZlU3RyaW5nLnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24oKSB7XG5cdCAgICByZXR1cm4gdGhpcy52YWw7XG5cdH07XG5cdFNhZmVTdHJpbmcucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdCAgICByZXR1cm4gdGhpcy52YWw7XG5cdH07XG5cblx0ZnVuY3Rpb24gY29weVNhZmVuZXNzKGRlc3QsIHRhcmdldCkge1xuXHQgICAgaWYoZGVzdCBpbnN0YW5jZW9mIFNhZmVTdHJpbmcpIHtcblx0ICAgICAgICByZXR1cm4gbmV3IFNhZmVTdHJpbmcodGFyZ2V0KTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB0YXJnZXQudG9TdHJpbmcoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIG1hcmtTYWZlKHZhbCkge1xuXHQgICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuXG5cdCAgICBpZih0eXBlID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyh2YWwpO1xuXHQgICAgfVxuXHQgICAgZWxzZSBpZih0eXBlICE9PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgdmFyIHJldCA9IHZhbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG5cdCAgICAgICAgICAgIGlmKHR5cGVvZiByZXQgPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFNhZmVTdHJpbmcocmV0KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiByZXQ7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIHN1cHByZXNzVmFsdWUodmFsLCBhdXRvZXNjYXBlKSB7XG5cdCAgICB2YWwgPSAodmFsICE9PSB1bmRlZmluZWQgJiYgdmFsICE9PSBudWxsKSA/IHZhbCA6ICcnO1xuXG5cdCAgICBpZihhdXRvZXNjYXBlICYmICEodmFsIGluc3RhbmNlb2YgU2FmZVN0cmluZykpIHtcblx0ICAgICAgICB2YWwgPSBsaWIuZXNjYXBlKHZhbC50b1N0cmluZygpKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHZhbDtcblx0fVxuXG5cdGZ1bmN0aW9uIGVuc3VyZURlZmluZWQodmFsLCBsaW5lbm8sIGNvbG5vKSB7XG5cdCAgICBpZih2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoXG5cdCAgICAgICAgICAgICdhdHRlbXB0ZWQgdG8gb3V0cHV0IG51bGwgb3IgdW5kZWZpbmVkIHZhbHVlJyxcblx0ICAgICAgICAgICAgbGluZW5vICsgMSxcblx0ICAgICAgICAgICAgY29sbm8gKyAxXG5cdCAgICAgICAgKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB2YWw7XG5cdH1cblxuXHRmdW5jdGlvbiBtZW1iZXJMb29rdXAob2JqLCB2YWwpIHtcblx0ICAgIG9iaiA9IG9iaiB8fCB7fTtcblxuXHQgICAgaWYodHlwZW9mIG9ialt2YWxdID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICByZXR1cm4gb2JqW3ZhbF0uYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBvYmpbdmFsXTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNhbGxXcmFwKG9iaiwgbmFtZSwgY29udGV4dCwgYXJncykge1xuXHQgICAgaWYoIW9iaikge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGNhbGwgYCcgKyBuYW1lICsgJ2AsIHdoaWNoIGlzIHVuZGVmaW5lZCBvciBmYWxzZXknKTtcblx0ICAgIH1cblx0ICAgIGVsc2UgaWYodHlwZW9mIG9iaiAhPT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGNhbGwgYCcgKyBuYW1lICsgJ2AsIHdoaWNoIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG5cdCAgICB9XG5cblx0ICAgIC8vIGpzaGludCB2YWxpZHRoaXM6IHRydWVcblx0ICAgIHJldHVybiBvYmouYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdH1cblxuXHRmdW5jdGlvbiBjb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgbmFtZSkge1xuXHQgICAgdmFyIHZhbCA9IGZyYW1lLmxvb2t1cChuYW1lKTtcblx0ICAgIHJldHVybiAodmFsICE9PSB1bmRlZmluZWQpID9cblx0ICAgICAgICB2YWwgOlxuXHQgICAgICAgIGNvbnRleHQubG9va3VwKG5hbWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlRXJyb3IoZXJyb3IsIGxpbmVubywgY29sbm8pIHtcblx0ICAgIGlmKGVycm9yLmxpbmVubykge1xuXHQgICAgICAgIHJldHVybiBlcnJvcjtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBuZXcgbGliLlRlbXBsYXRlRXJyb3IoZXJyb3IsIGxpbmVubywgY29sbm8pO1xuXHQgICAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gYXN5bmNFYWNoKGFyciwgZGltZW4sIGl0ZXIsIGNiKSB7XG5cdCAgICBpZihsaWIuaXNBcnJheShhcnIpKSB7XG5cdCAgICAgICAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG5cblx0ICAgICAgICBsaWIuYXN5bmNJdGVyKGFyciwgZnVuY3Rpb24oaXRlbSwgaSwgbmV4dCkge1xuXHQgICAgICAgICAgICBzd2l0Y2goZGltZW4pIHtcblx0ICAgICAgICAgICAgY2FzZSAxOiBpdGVyKGl0ZW0sIGksIGxlbiwgbmV4dCk7IGJyZWFrO1xuXHQgICAgICAgICAgICBjYXNlIDI6IGl0ZXIoaXRlbVswXSwgaXRlbVsxXSwgaSwgbGVuLCBuZXh0KTsgYnJlYWs7XG5cdCAgICAgICAgICAgIGNhc2UgMzogaXRlcihpdGVtWzBdLCBpdGVtWzFdLCBpdGVtWzJdLCBpLCBsZW4sIG5leHQpOyBicmVhaztcblx0ICAgICAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgICAgIGl0ZW0ucHVzaChpLCBuZXh0KTtcblx0ICAgICAgICAgICAgICAgIGl0ZXIuYXBwbHkodGhpcywgaXRlbSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9LCBjYik7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICBsaWIuYXN5bmNGb3IoYXJyLCBmdW5jdGlvbihrZXksIHZhbCwgaSwgbGVuLCBuZXh0KSB7XG5cdCAgICAgICAgICAgIGl0ZXIoa2V5LCB2YWwsIGksIGxlbiwgbmV4dCk7XG5cdCAgICAgICAgfSwgY2IpO1xuXHQgICAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gYXN5bmNBbGwoYXJyLCBkaW1lbiwgZnVuYywgY2IpIHtcblx0ICAgIHZhciBmaW5pc2hlZCA9IDA7XG5cdCAgICB2YXIgbGVuLCBpO1xuXHQgICAgdmFyIG91dHB1dEFycjtcblxuXHQgICAgZnVuY3Rpb24gZG9uZShpLCBvdXRwdXQpIHtcblx0ICAgICAgICBmaW5pc2hlZCsrO1xuXHQgICAgICAgIG91dHB1dEFycltpXSA9IG91dHB1dDtcblxuXHQgICAgICAgIGlmKGZpbmlzaGVkID09PSBsZW4pIHtcblx0ICAgICAgICAgICAgY2IobnVsbCwgb3V0cHV0QXJyLmpvaW4oJycpKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGlmKGxpYi5pc0FycmF5KGFycikpIHtcblx0ICAgICAgICBsZW4gPSBhcnIubGVuZ3RoO1xuXHQgICAgICAgIG91dHB1dEFyciA9IG5ldyBBcnJheShsZW4pO1xuXG5cdCAgICAgICAgaWYobGVuID09PSAwKSB7XG5cdCAgICAgICAgICAgIGNiKG51bGwsICcnKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSBhcnJbaV07XG5cblx0ICAgICAgICAgICAgICAgIHN3aXRjaChkaW1lbikge1xuXHQgICAgICAgICAgICAgICAgY2FzZSAxOiBmdW5jKGl0ZW0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgY2FzZSAyOiBmdW5jKGl0ZW1bMF0sIGl0ZW1bMV0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgY2FzZSAzOiBmdW5jKGl0ZW1bMF0sIGl0ZW1bMV0sIGl0ZW1bMl0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgICAgICAgICBpdGVtLnB1c2goaSwgZG9uZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgLy8ganNoaW50IHZhbGlkdGhpczogdHJ1ZVxuXHQgICAgICAgICAgICAgICAgICAgIGZ1bmMuYXBwbHkodGhpcywgaXRlbSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICB2YXIga2V5cyA9IGxpYi5rZXlzKGFycik7XG5cdCAgICAgICAgbGVuID0ga2V5cy5sZW5ndGg7XG5cdCAgICAgICAgb3V0cHV0QXJyID0gbmV3IEFycmF5KGxlbik7XG5cblx0ICAgICAgICBpZihsZW4gPT09IDApIHtcblx0ICAgICAgICAgICAgY2IobnVsbCwgJycpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGsgPSBrZXlzW2ldO1xuXHQgICAgICAgICAgICAgICAgZnVuYyhrLCBhcnJba10sIGksIGxlbiwgZG9uZSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICB9XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IHtcblx0ICAgIEZyYW1lOiBGcmFtZSxcblx0ICAgIG1ha2VNYWNybzogbWFrZU1hY3JvLFxuXHQgICAgbWFrZUtleXdvcmRBcmdzOiBtYWtlS2V5d29yZEFyZ3MsXG5cdCAgICBudW1BcmdzOiBudW1BcmdzLFxuXHQgICAgc3VwcHJlc3NWYWx1ZTogc3VwcHJlc3NWYWx1ZSxcblx0ICAgIGVuc3VyZURlZmluZWQ6IGVuc3VyZURlZmluZWQsXG5cdCAgICBtZW1iZXJMb29rdXA6IG1lbWJlckxvb2t1cCxcblx0ICAgIGNvbnRleHRPckZyYW1lTG9va3VwOiBjb250ZXh0T3JGcmFtZUxvb2t1cCxcblx0ICAgIGNhbGxXcmFwOiBjYWxsV3JhcCxcblx0ICAgIGhhbmRsZUVycm9yOiBoYW5kbGVFcnJvcixcblx0ICAgIGlzQXJyYXk6IGxpYi5pc0FycmF5LFxuXHQgICAga2V5czogbGliLmtleXMsXG5cdCAgICBTYWZlU3RyaW5nOiBTYWZlU3RyaW5nLFxuXHQgICAgY29weVNhZmVuZXNzOiBjb3B5U2FmZW5lc3MsXG5cdCAgICBtYXJrU2FmZTogbWFya1NhZmUsXG5cdCAgICBhc3luY0VhY2g6IGFzeW5jRWFjaCxcblx0ICAgIGFzeW5jQWxsOiBhc3luY0FsbCxcblx0ICAgIGluT3BlcmF0b3I6IGxpYi5pbk9wZXJhdG9yXG5cdH07XG5cblxuLyoqKi8gfSxcbi8qIDkgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRmdW5jdGlvbiBjeWNsZXIoaXRlbXMpIHtcblx0ICAgIHZhciBpbmRleCA9IC0xO1xuXG5cdCAgICByZXR1cm4ge1xuXHQgICAgICAgIGN1cnJlbnQ6IG51bGwsXG5cdCAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICBpbmRleCA9IC0xO1xuXHQgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBudWxsO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgaW5kZXgrKztcblx0ICAgICAgICAgICAgaWYoaW5kZXggPj0gaXRlbXMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICBpbmRleCA9IDA7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBpdGVtc1tpbmRleF07XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnQ7XG5cdCAgICAgICAgfSxcblx0ICAgIH07XG5cblx0fVxuXG5cdGZ1bmN0aW9uIGpvaW5lcihzZXApIHtcblx0ICAgIHNlcCA9IHNlcCB8fCAnLCc7XG5cdCAgICB2YXIgZmlyc3QgPSB0cnVlO1xuXG5cdCAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIHZhbCA9IGZpcnN0ID8gJycgOiBzZXA7XG5cdCAgICAgICAgZmlyc3QgPSBmYWxzZTtcblx0ICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgfTtcblx0fVxuXG5cdC8vIE1ha2luZyB0aGlzIGEgZnVuY3Rpb24gaW5zdGVhZCBzbyBpdCByZXR1cm5zIGEgbmV3IG9iamVjdFxuXHQvLyBlYWNoIHRpbWUgaXQncyBjYWxsZWQuIFRoYXQgd2F5LCBpZiBzb21ldGhpbmcgbGlrZSBhbiBlbnZpcm9ubWVudFxuXHQvLyB1c2VzIGl0LCB0aGV5IHdpbGwgZWFjaCBoYXZlIHRoZWlyIG93biBjb3B5LlxuXHRmdW5jdGlvbiBnbG9iYWxzKCkge1xuXHQgICAgcmV0dXJuIHtcblx0ICAgICAgICByYW5nZTogZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcblx0ICAgICAgICAgICAgaWYodHlwZW9mIHN0b3AgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgICAgICBzdG9wID0gc3RhcnQ7XG5cdCAgICAgICAgICAgICAgICBzdGFydCA9IDA7XG5cdCAgICAgICAgICAgICAgICBzdGVwID0gMTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKCFzdGVwKSB7XG5cdCAgICAgICAgICAgICAgICBzdGVwID0gMTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHZhciBhcnIgPSBbXTtcblx0ICAgICAgICAgICAgdmFyIGk7XG5cdCAgICAgICAgICAgIGlmIChzdGVwID4gMCkge1xuXHQgICAgICAgICAgICAgICAgZm9yIChpPXN0YXJ0OyBpPHN0b3A7IGkrPXN0ZXApIHtcblx0ICAgICAgICAgICAgICAgICAgICBhcnIucHVzaChpKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIGZvciAoaT1zdGFydDsgaT5zdG9wOyBpKz1zdGVwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goaSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIGFycjtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLy8gbGlwc3VtOiBmdW5jdGlvbihuLCBodG1sLCBtaW4sIG1heCkge1xuXHQgICAgICAgIC8vIH0sXG5cblx0ICAgICAgICBjeWNsZXI6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICByZXR1cm4gY3ljbGVyKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICBqb2luZXI6IGZ1bmN0aW9uKHNlcCkge1xuXHQgICAgICAgICAgICByZXR1cm4gam9pbmVyKHNlcCk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzID0gZ2xvYmFscztcblxuXG4vKioqLyB9LFxuLyogMTAgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdHZhciBfX1dFQlBBQ0tfQU1EX0RFRklORV9BUlJBWV9fLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXzsvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi8oZnVuY3Rpb24oc2V0SW1tZWRpYXRlLCBwcm9jZXNzKSB7Ly8gTUlUIGxpY2Vuc2UgKGJ5IEVsYW4gU2hhbmtlcikuXG5cdChmdW5jdGlvbihnbG9iYWxzKSB7XG5cdCAgJ3VzZSBzdHJpY3QnO1xuXG5cdCAgdmFyIGV4ZWN1dGVTeW5jID0gZnVuY3Rpb24oKXtcblx0ICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblx0ICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ2Z1bmN0aW9uJyl7XG5cdCAgICAgIGFyZ3NbMF0uYXBwbHkobnVsbCwgYXJncy5zcGxpY2UoMSkpO1xuXHQgICAgfVxuXHQgIH07XG5cblx0ICB2YXIgZXhlY3V0ZUFzeW5jID0gZnVuY3Rpb24oZm4pe1xuXHQgICAgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgc2V0SW1tZWRpYXRlKGZuKTtcblx0ICAgIH0gZWxzZSBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MubmV4dFRpY2spIHtcblx0ICAgICAgcHJvY2Vzcy5uZXh0VGljayhmbik7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcblx0ICAgIH1cblx0ICB9O1xuXG5cdCAgdmFyIG1ha2VJdGVyYXRvciA9IGZ1bmN0aW9uICh0YXNrcykge1xuXHQgICAgdmFyIG1ha2VDYWxsYmFjayA9IGZ1bmN0aW9uIChpbmRleCkge1xuXHQgICAgICB2YXIgZm4gPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCkge1xuXHQgICAgICAgICAgdGFza3NbaW5kZXhdLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBmbi5uZXh0KCk7XG5cdCAgICAgIH07XG5cdCAgICAgIGZuLm5leHQgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgcmV0dXJuIChpbmRleCA8IHRhc2tzLmxlbmd0aCAtIDEpID8gbWFrZUNhbGxiYWNrKGluZGV4ICsgMSk6IG51bGw7XG5cdCAgICAgIH07XG5cdCAgICAgIHJldHVybiBmbjtcblx0ICAgIH07XG5cdCAgICByZXR1cm4gbWFrZUNhbGxiYWNrKDApO1xuXHQgIH07XG5cdCAgXG5cdCAgdmFyIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihtYXliZUFycmF5KXtcblx0ICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobWF5YmVBcnJheSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG5cdCAgfTtcblxuXHQgIHZhciB3YXRlcmZhbGwgPSBmdW5jdGlvbiAodGFza3MsIGNhbGxiYWNrLCBmb3JjZUFzeW5jKSB7XG5cdCAgICB2YXIgbmV4dFRpY2sgPSBmb3JjZUFzeW5jID8gZXhlY3V0ZUFzeW5jIDogZXhlY3V0ZVN5bmM7XG5cdCAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuXHQgICAgaWYgKCFfaXNBcnJheSh0YXNrcykpIHtcblx0ICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgdG8gd2F0ZXJmYWxsIG11c3QgYmUgYW4gYXJyYXkgb2YgZnVuY3Rpb25zJyk7XG5cdCAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuXHQgICAgfVxuXHQgICAgaWYgKCF0YXNrcy5sZW5ndGgpIHtcblx0ICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG5cdCAgICB9XG5cdCAgICB2YXIgd3JhcEl0ZXJhdG9yID0gZnVuY3Rpb24gKGl0ZXJhdG9yKSB7XG5cdCAgICAgIHJldHVybiBmdW5jdGlvbiAoZXJyKSB7XG5cdCAgICAgICAgaWYgKGVycikge1xuXHQgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcblx0ICAgICAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge307XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0ICAgICAgICAgIHZhciBuZXh0ID0gaXRlcmF0b3IubmV4dCgpO1xuXHQgICAgICAgICAgaWYgKG5leHQpIHtcblx0ICAgICAgICAgICAgYXJncy5wdXNoKHdyYXBJdGVyYXRvcihuZXh0KSk7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBhcmdzLnB1c2goY2FsbGJhY2spO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgICAgbmV4dFRpY2soZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICBpdGVyYXRvci5hcHBseShudWxsLCBhcmdzKTtcblx0ICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfTtcblx0ICAgIH07XG5cdCAgICB3cmFwSXRlcmF0b3IobWFrZUl0ZXJhdG9yKHRhc2tzKSkoKTtcblx0ICB9O1xuXG5cdCAgaWYgKHRydWUpIHtcblx0ICAgICEoX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXyA9IFtdLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgcmV0dXJuIHdhdGVyZmFsbDtcblx0ICAgIH0uYXBwbHkoZXhwb3J0cywgX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXyksIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fICE9PSB1bmRlZmluZWQgJiYgKG1vZHVsZS5leHBvcnRzID0gX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18pKTsgLy8gUmVxdWlyZUpTXG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSB3YXRlcmZhbGw7IC8vIENvbW1vbkpTXG5cdCAgfSBlbHNlIHtcblx0ICAgIGdsb2JhbHMud2F0ZXJmYWxsID0gd2F0ZXJmYWxsOyAvLyA8c2NyaXB0PlxuXHQgIH1cblx0fSkodGhpcyk7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18oMTEpLnNldEltbWVkaWF0ZSwgX193ZWJwYWNrX3JlcXVpcmVfXygzKSkpXG5cbi8qKiovIH0sXG4vKiAxMSAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovKGZ1bmN0aW9uKHNldEltbWVkaWF0ZSwgY2xlYXJJbW1lZGlhdGUpIHt2YXIgbmV4dFRpY2sgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEyKS5uZXh0VGljaztcblx0dmFyIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xuXHR2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cdHZhciBpbW1lZGlhdGVJZHMgPSB7fTtcblx0dmFyIG5leHRJbW1lZGlhdGVJZCA9IDA7XG5cblx0Ly8gRE9NIEFQSXMsIGZvciBjb21wbGV0ZW5lc3NcblxuXHRleHBvcnRzLnNldFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcblx0ICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRUaW1lb3V0LCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFyVGltZW91dCk7XG5cdH07XG5cdGV4cG9ydHMuc2V0SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcblx0ICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRJbnRlcnZhbCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhckludGVydmFsKTtcblx0fTtcblx0ZXhwb3J0cy5jbGVhclRpbWVvdXQgPVxuXHRleHBvcnRzLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbih0aW1lb3V0KSB7IHRpbWVvdXQuY2xvc2UoKTsgfTtcblxuXHRmdW5jdGlvbiBUaW1lb3V0KGlkLCBjbGVhckZuKSB7XG5cdCAgdGhpcy5faWQgPSBpZDtcblx0ICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcblx0fVxuXHRUaW1lb3V0LnByb3RvdHlwZS51bnJlZiA9IFRpbWVvdXQucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge307XG5cdFRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdCAgdGhpcy5fY2xlYXJGbi5jYWxsKHdpbmRvdywgdGhpcy5faWQpO1xuXHR9O1xuXG5cdC8vIERvZXMgbm90IHN0YXJ0IHRoZSB0aW1lLCBqdXN0IHNldHMgdXAgdGhlIG1lbWJlcnMgbmVlZGVkLlxuXHRleHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG5cdCAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXHQgIGl0ZW0uX2lkbGVUaW1lb3V0ID0gbXNlY3M7XG5cdH07XG5cblx0ZXhwb3J0cy51bmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0ICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cdCAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcblx0fTtcblxuXHRleHBvcnRzLl91bnJlZkFjdGl2ZSA9IGV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuXHQgIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuXHQgIHZhciBtc2VjcyA9IGl0ZW0uX2lkbGVUaW1lb3V0O1xuXHQgIGlmIChtc2VjcyA+PSAwKSB7XG5cdCAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG5cdCAgICAgIGlmIChpdGVtLl9vblRpbWVvdXQpXG5cdCAgICAgICAgaXRlbS5fb25UaW1lb3V0KCk7XG5cdCAgICB9LCBtc2Vjcyk7XG5cdCAgfVxuXHR9O1xuXG5cdC8vIFRoYXQncyBub3QgaG93IG5vZGUuanMgaW1wbGVtZW50cyBpdCBidXQgdGhlIGV4cG9zZWQgYXBpIGlzIHRoZSBzYW1lLlxuXHRleHBvcnRzLnNldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHNldEltbWVkaWF0ZSA6IGZ1bmN0aW9uKGZuKSB7XG5cdCAgdmFyIGlkID0gbmV4dEltbWVkaWF0ZUlkKys7XG5cdCAgdmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGZhbHNlIDogc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG5cdCAgaW1tZWRpYXRlSWRzW2lkXSA9IHRydWU7XG5cblx0ICBuZXh0VGljayhmdW5jdGlvbiBvbk5leHRUaWNrKCkge1xuXHQgICAgaWYgKGltbWVkaWF0ZUlkc1tpZF0pIHtcblx0ICAgICAgLy8gZm4uY2FsbCgpIGlzIGZhc3RlciBzbyB3ZSBvcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiB1c2UtY2FzZVxuXHQgICAgICAvLyBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2NhbGwtYXBwbHktc2VndVxuXHQgICAgICBpZiAoYXJncykge1xuXHQgICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIGZuLmNhbGwobnVsbCk7XG5cdCAgICAgIH1cblx0ICAgICAgLy8gUHJldmVudCBpZHMgZnJvbSBsZWFraW5nXG5cdCAgICAgIGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUoaWQpO1xuXHQgICAgfVxuXHQgIH0pO1xuXG5cdCAgcmV0dXJuIGlkO1xuXHR9O1xuXG5cdGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSB0eXBlb2YgY2xlYXJJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IGNsZWFySW1tZWRpYXRlIDogZnVuY3Rpb24oaWQpIHtcblx0ICBkZWxldGUgaW1tZWRpYXRlSWRzW2lkXTtcblx0fTtcblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18oMTEpLnNldEltbWVkaWF0ZSwgX193ZWJwYWNrX3JlcXVpcmVfXygxMSkuY2xlYXJJbW1lZGlhdGUpKVxuXG4vKioqLyB9LFxuLyogMTIgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdC8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG5cdHZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblx0dmFyIHF1ZXVlID0gW107XG5cdHZhciBkcmFpbmluZyA9IGZhbHNlO1xuXHR2YXIgY3VycmVudFF1ZXVlO1xuXHR2YXIgcXVldWVJbmRleCA9IC0xO1xuXG5cdGZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcblx0ICAgIGRyYWluaW5nID0gZmFsc2U7XG5cdCAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuXHQgICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcblx0ICAgIH1cblx0ICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcblx0ICAgICAgICBkcmFpblF1ZXVlKCk7XG5cdCAgICB9XG5cdH1cblxuXHRmdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuXHQgICAgaWYgKGRyYWluaW5nKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXHQgICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG5cdCAgICBkcmFpbmluZyA9IHRydWU7XG5cblx0ICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG5cdCAgICB3aGlsZShsZW4pIHtcblx0ICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcblx0ICAgICAgICBxdWV1ZSA9IFtdO1xuXHQgICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcblx0ICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuXHQgICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcblx0ICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG5cdCAgICB9XG5cdCAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuXHQgICAgZHJhaW5pbmcgPSBmYWxzZTtcblx0ICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0fVxuXG5cdHByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG5cdCAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG5cdCAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcblx0ICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuXHQgICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcblx0ICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuXHQgICAgfVxuXHR9O1xuXG5cdC8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcblx0ZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG5cdCAgICB0aGlzLmZ1biA9IGZ1bjtcblx0ICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcblx0fVxuXHRJdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcblx0fTtcblx0cHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcblx0cHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcblx0cHJvY2Vzcy5lbnYgPSB7fTtcblx0cHJvY2Vzcy5hcmd2ID0gW107XG5cdHByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xuXHRwcm9jZXNzLnZlcnNpb25zID0ge307XG5cblx0ZnVuY3Rpb24gbm9vcCgpIHt9XG5cblx0cHJvY2Vzcy5vbiA9IG5vb3A7XG5cdHByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xuXHRwcm9jZXNzLm9uY2UgPSBub29wO1xuXHRwcm9jZXNzLm9mZiA9IG5vb3A7XG5cdHByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xuXHRwcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5cdHByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cblx0cHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0ICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcblx0fTtcblxuXHRwcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xuXHRwcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuXHQgICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcblx0fTtcblx0cHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcblxuXG4vKioqLyB9LFxuLyogMTMgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgTG9hZGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygxNCk7XG5cblx0dmFyIFByZWNvbXBpbGVkTG9hZGVyID0gTG9hZGVyLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbihjb21waWxlZFRlbXBsYXRlcykge1xuXHQgICAgICAgIHRoaXMucHJlY29tcGlsZWQgPSBjb21waWxlZFRlbXBsYXRlcyB8fCB7fTtcblx0ICAgIH0sXG5cblx0ICAgIGdldFNvdXJjZTogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIGlmICh0aGlzLnByZWNvbXBpbGVkW25hbWVdKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB7XG5cdCAgICAgICAgICAgICAgICBzcmM6IHsgdHlwZTogJ2NvZGUnLFxuXHQgICAgICAgICAgICAgICAgICAgICAgIG9iajogdGhpcy5wcmVjb21waWxlZFtuYW1lXSB9LFxuXHQgICAgICAgICAgICAgICAgcGF0aDogbmFtZVxuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gbnVsbDtcblx0ICAgIH1cblx0fSk7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBQcmVjb21waWxlZExvYWRlcjtcblxuXG4vKioqLyB9LFxuLyogMTQgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgcGF0aCA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBPYmogPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDYpO1xuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblxuXHR2YXIgTG9hZGVyID0gT2JqLmV4dGVuZCh7XG5cdCAgICBvbjogZnVuY3Rpb24obmFtZSwgZnVuYykge1xuXHQgICAgICAgIHRoaXMubGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMgfHwge307XG5cdCAgICAgICAgdGhpcy5saXN0ZW5lcnNbbmFtZV0gPSB0aGlzLmxpc3RlbmVyc1tuYW1lXSB8fCBbXTtcblx0ICAgICAgICB0aGlzLmxpc3RlbmVyc1tuYW1lXS5wdXNoKGZ1bmMpO1xuXHQgICAgfSxcblxuXHQgICAgZW1pdDogZnVuY3Rpb24obmFtZSAvKiwgYXJnMSwgYXJnMiwgLi4uKi8pIHtcblx0ICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cblx0ICAgICAgICBpZih0aGlzLmxpc3RlbmVycyAmJiB0aGlzLmxpc3RlbmVyc1tuYW1lXSkge1xuXHQgICAgICAgICAgICBsaWIuZWFjaCh0aGlzLmxpc3RlbmVyc1tuYW1lXSwgZnVuY3Rpb24obGlzdGVuZXIpIHtcblx0ICAgICAgICAgICAgICAgIGxpc3RlbmVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICByZXNvbHZlOiBmdW5jdGlvbihmcm9tLCB0bykge1xuXHQgICAgICAgIHJldHVybiBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKGZyb20pLCB0byk7XG5cdCAgICB9LFxuXG5cdCAgICBpc1JlbGF0aXZlOiBmdW5jdGlvbihmaWxlbmFtZSkge1xuXHQgICAgICAgIHJldHVybiAoZmlsZW5hbWUuaW5kZXhPZignLi8nKSA9PT0gMCB8fCBmaWxlbmFtZS5pbmRleE9mKCcuLi8nKSA9PT0gMCk7XG5cdCAgICB9XG5cdH0pO1xuXG5cdG1vZHVsZS5leHBvcnRzID0gTG9hZGVyO1xuXG5cbi8qKiovIH0sXG4vKiAxNSAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0ZnVuY3Rpb24gaW5zdGFsbENvbXBhdCgpIHtcblx0ICAndXNlIHN0cmljdCc7XG5cblx0ICAvLyBUaGlzIG11c3QgYmUgY2FsbGVkIGxpa2UgYG51bmp1Y2tzLmluc3RhbGxDb21wYXRgIHNvIHRoYXQgYHRoaXNgXG5cdCAgLy8gcmVmZXJlbmNlcyB0aGUgbnVuanVja3MgaW5zdGFuY2Vcblx0ICB2YXIgcnVudGltZSA9IHRoaXMucnVudGltZTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cdCAgdmFyIGxpYiA9IHRoaXMubGliOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblxuXHQgIHZhciBvcmlnX2NvbnRleHRPckZyYW1lTG9va3VwID0gcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cDtcblx0ICBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwID0gZnVuY3Rpb24oY29udGV4dCwgZnJhbWUsIGtleSkge1xuXHQgICAgdmFyIHZhbCA9IG9yaWdfY29udGV4dE9yRnJhbWVMb29rdXAuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICBzd2l0Y2ggKGtleSkge1xuXHQgICAgICBjYXNlICdUcnVlJzpcblx0ICAgICAgICByZXR1cm4gdHJ1ZTtcblx0ICAgICAgY2FzZSAnRmFsc2UnOlxuXHQgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgY2FzZSAnTm9uZSc6XG5cdCAgICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHZhbDtcblx0ICB9O1xuXG5cdCAgdmFyIG9yaWdfbWVtYmVyTG9va3VwID0gcnVudGltZS5tZW1iZXJMb29rdXA7XG5cdCAgdmFyIEFSUkFZX01FTUJFUlMgPSB7XG5cdCAgICBwb3A6IGZ1bmN0aW9uKGluZGV4KSB7XG5cdCAgICAgIGlmIChpbmRleCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMucG9wKCk7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKGluZGV4ID49IHRoaXMubGVuZ3RoIHx8IGluZGV4IDwgMCkge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignS2V5RXJyb3InKTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gdGhpcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHQgICAgfSxcblx0ICAgIGFwcGVuZDogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLnB1c2goZWxlbWVudCk7XG5cdCAgICB9LFxuXHQgICAgcmVtb3ZlOiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgIGlmICh0aGlzW2ldID09PSBlbGVtZW50KSB7XG5cdCAgICAgICAgICByZXR1cm4gdGhpcy5zcGxpY2UoaSwgMSk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICAgIHRocm93IG5ldyBFcnJvcignVmFsdWVFcnJvcicpO1xuXHQgICAgfSxcblx0ICAgIGNvdW50OiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgIHZhciBjb3VudCA9IDA7XG5cdCAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgIGlmICh0aGlzW2ldID09PSBlbGVtZW50KSB7XG5cdCAgICAgICAgICBjb3VudCsrO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gY291bnQ7XG5cdCAgICB9LFxuXHQgICAgaW5kZXg6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgdmFyIGk7XG5cdCAgICAgIGlmICgoaSA9IHRoaXMuaW5kZXhPZihlbGVtZW50KSkgPT09IC0xKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZUVycm9yJyk7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIGk7XG5cdCAgICB9LFxuXHQgICAgZmluZDogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKGVsZW1lbnQpO1xuXHQgICAgfSxcblx0ICAgIGluc2VydDogZnVuY3Rpb24oaW5kZXgsIGVsZW0pIHtcblx0ICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGluZGV4LCAwLCBlbGVtKTtcblx0ICAgIH1cblx0ICB9O1xuXHQgIHZhciBPQkpFQ1RfTUVNQkVSUyA9IHtcblx0ICAgIGl0ZW1zOiBmdW5jdGlvbigpIHtcblx0ICAgICAgdmFyIHJldCA9IFtdO1xuXHQgICAgICBmb3IodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgIHJldC5wdXNoKFtrLCB0aGlzW2tdXSk7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIHJldDtcblx0ICAgIH0sXG5cdCAgICB2YWx1ZXM6IGZ1bmN0aW9uKCkge1xuXHQgICAgICB2YXIgcmV0ID0gW107XG5cdCAgICAgIGZvcih2YXIgayBpbiB0aGlzKSB7XG5cdCAgICAgICAgcmV0LnB1c2godGhpc1trXSk7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIHJldDtcblx0ICAgIH0sXG5cdCAgICBrZXlzOiBmdW5jdGlvbigpIHtcblx0ICAgICAgdmFyIHJldCA9IFtdO1xuXHQgICAgICBmb3IodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgIHJldC5wdXNoKGspO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiByZXQ7XG5cdCAgICB9LFxuXHQgICAgZ2V0OiBmdW5jdGlvbihrZXksIGRlZikge1xuXHQgICAgICB2YXIgb3V0cHV0ID0gdGhpc1trZXldO1xuXHQgICAgICBpZiAob3V0cHV0ID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICBvdXRwdXQgPSBkZWY7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIG91dHB1dDtcblx0ICAgIH0sXG5cdCAgICBoYXNfa2V5OiBmdW5jdGlvbihrZXkpIHtcblx0ICAgICAgcmV0dXJuIHRoaXMuaGFzT3duUHJvcGVydHkoa2V5KTtcblx0ICAgIH0sXG5cdCAgICBwb3A6IGZ1bmN0aW9uKGtleSwgZGVmKSB7XG5cdCAgICAgIHZhciBvdXRwdXQgPSB0aGlzW2tleV07XG5cdCAgICAgIGlmIChvdXRwdXQgPT09IHVuZGVmaW5lZCAmJiBkZWYgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgIG91dHB1dCA9IGRlZjtcblx0ICAgICAgfSBlbHNlIGlmIChvdXRwdXQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignS2V5RXJyb3InKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBkZWxldGUgdGhpc1trZXldO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiBvdXRwdXQ7XG5cdCAgICB9LFxuXHQgICAgcG9waXRlbTogZnVuY3Rpb24oKSB7XG5cdCAgICAgIGZvciAodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgIC8vIFJldHVybiB0aGUgZmlyc3Qgb2JqZWN0IHBhaXIuXG5cdCAgICAgICAgdmFyIHZhbCA9IHRoaXNba107XG5cdCAgICAgICAgZGVsZXRlIHRoaXNba107XG5cdCAgICAgICAgcmV0dXJuIFtrLCB2YWxdO1xuXHQgICAgICB9XG5cdCAgICAgIHRocm93IG5ldyBFcnJvcignS2V5RXJyb3InKTtcblx0ICAgIH0sXG5cdCAgICBzZXRkZWZhdWx0OiBmdW5jdGlvbihrZXksIGRlZikge1xuXHQgICAgICBpZiAoa2V5IGluIHRoaXMpIHtcblx0ICAgICAgICByZXR1cm4gdGhpc1trZXldO1xuXHQgICAgICB9XG5cdCAgICAgIGlmIChkZWYgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgIGRlZiA9IG51bGw7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIHRoaXNba2V5XSA9IGRlZjtcblx0ICAgIH0sXG5cdCAgICB1cGRhdGU6IGZ1bmN0aW9uKGt3YXJncykge1xuXHQgICAgICBmb3IgKHZhciBrIGluIGt3YXJncykge1xuXHQgICAgICAgIHRoaXNba10gPSBrd2FyZ3Nba107XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIG51bGw7ICAvLyBBbHdheXMgcmV0dXJucyBOb25lXG5cdCAgICB9XG5cdCAgfTtcblx0ICBPQkpFQ1RfTUVNQkVSUy5pdGVyaXRlbXMgPSBPQkpFQ1RfTUVNQkVSUy5pdGVtcztcblx0ICBPQkpFQ1RfTUVNQkVSUy5pdGVydmFsdWVzID0gT0JKRUNUX01FTUJFUlMudmFsdWVzO1xuXHQgIE9CSkVDVF9NRU1CRVJTLml0ZXJrZXlzID0gT0JKRUNUX01FTUJFUlMua2V5cztcblx0ICBydW50aW1lLm1lbWJlckxvb2t1cCA9IGZ1bmN0aW9uKG9iaiwgdmFsLCBhdXRvZXNjYXBlKSB7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgICAgb2JqID0gb2JqIHx8IHt9O1xuXG5cdCAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGFuIG9iamVjdCwgcmV0dXJuIGFueSBvZiB0aGUgbWV0aG9kcyB0aGF0IFB5dGhvbiB3b3VsZFxuXHQgICAgLy8gb3RoZXJ3aXNlIHByb3ZpZGUuXG5cdCAgICBpZiAobGliLmlzQXJyYXkob2JqKSAmJiBBUlJBWV9NRU1CRVJTLmhhc093blByb3BlcnR5KHZhbCkpIHtcblx0ICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge3JldHVybiBBUlJBWV9NRU1CRVJTW3ZhbF0uYXBwbHkob2JqLCBhcmd1bWVudHMpO307XG5cdCAgICB9XG5cblx0ICAgIGlmIChsaWIuaXNPYmplY3Qob2JqKSAmJiBPQkpFQ1RfTUVNQkVSUy5oYXNPd25Qcm9wZXJ0eSh2YWwpKSB7XG5cdCAgICAgIHJldHVybiBmdW5jdGlvbigpIHtyZXR1cm4gT0JKRUNUX01FTUJFUlNbdmFsXS5hcHBseShvYmosIGFyZ3VtZW50cyk7fTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIG9yaWdfbWVtYmVyTG9va3VwLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgfTtcblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzID0gaW5zdGFsbENvbXBhdDtcblxuXG4vKioqLyB9XG4vKioqKioqLyBdKVxufSk7XG47IiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sXCJdID0gKGZ1bmN0aW9uKCkge1xuZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIHBhcmVudFRlbXBsYXRlID0gbnVsbDtcbm91dHB1dCArPSBcIjxkaXYgY2xhc3M9XFxcIml0ZW0tLWVtYmVkXFxcIj48ZGl2PlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJodG1sXCIpKSB8fCBlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWV0YVwiKSksXCJodG1sXCIpKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPGZpZ3VyZT5cXG4gIDxpbWcgXFxuICAgIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcInRodW1ibmFpbFwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCJcXG4gICAgc3Jjc2V0PVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwiYmFzZUltYWdlXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDgxMHcsIFxcbiAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwidGh1bWJuYWlsXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDI0MHcsIFxcbiAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwidmlld0ltYWdlXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDU0MHdcXFwiIFxcbiAgICBhbHQ9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY2FwdGlvblwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgPGZpZ2NhcHRpb24+XFxuICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY2FwdGlvblwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCIgXFxuICAgIDxzcGFuIG5nLWlmPVxcXCJyZWYuaXRlbS5tZXRhLmNyZWRpdFxcXCI+XFxuICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjcmVkaXRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgIDwvc3Bhbj5cXG4gIDwvZmlnY2FwdGlvbj5cXG48L2ZpZ3VyZT5cXG5cXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPGFydGljbGUgY2xhc3M9XFxcImxiLXBvc3QgbGlzdC1ncm91cC1pdGVtIHNob3ctYXV0aG9yLWF2YXRhclxcXCIgZGF0YS1qcy1wb3N0LWlkPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfaWRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJzdGlja3lcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJsYi10eXBlXFxcIj48L2Rpdj5cXG4gIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGRpdiBjbGFzcz1cXFwibGItdHlwZSBsYi10eXBlLS10ZXh0XFxcIj48L2Rpdj5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICBcXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJoaWdobGlnaHRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJsYi1wb3N0LWhpZ2hsaWdodGVkXFxcIj48L2Rpdj5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICA8ZGl2IGNsYXNzPVxcXCJsYi1wb3N0LWRhdGVcXFwiIGRhdGEtanMtdGltZXN0YW1wPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfdXBkYXRlZFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcIl91cGRhdGVkXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcblxcbiAgPCEtLSBpdGVtIHN0YXJ0IC0tPlxcbiAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzMgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpO1xuaWYodF8zKSB7dmFyIHRfMiA9IHRfMy5sZW5ndGg7XG5mb3IodmFyIHRfMT0wOyB0XzEgPCB0XzMubGVuZ3RoOyB0XzErKykge1xudmFyIHRfNCA9IHRfM1t0XzFdO1xuZnJhbWUuc2V0KFwicmVmXCIsIHRfNCk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4XCIsIHRfMSArIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleDBcIiwgdF8xKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF8yIC0gdF8xKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXgwXCIsIHRfMiAtIHRfMSAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5maXJzdFwiLCB0XzEgPT09IDApO1xuZnJhbWUuc2V0KFwibG9vcC5sYXN0XCIsIHRfMSA9PT0gdF8yIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmxlbmd0aFwiLCB0XzIpO1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLWl0ZW1cXFwiPlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJlbWJlZFwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF83LHRfNSkge1xuaWYodF83KSB7IGNiKHRfNyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzUpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF84LHRfNikge1xuaWYodF84KSB7IGNiKHRfOCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzYpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbn0pO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcImltYWdlXCIpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzExLHRfOSkge1xuaWYodF8xMSkgeyBjYih0XzExKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfOSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzEyLHRfMTApIHtcbmlmKHRfMTIpIHsgY2IodF8xMik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzEwKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8YXJ0aWNsZT5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcInRleHRcIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvYXJ0aWNsZT5cXG4gICAgICBcIjtcbjtcbn1cbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICA8L2Rpdj5cXG4gIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgPCEtLSBpdGVtIGVuZCAtLT5cXG5cXG4gIDwhLS0gYXV0aG9yIHBsdXMgYXZhdGFyIC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yXFxcIj5cXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93QXV0aG9yXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dBdXRob3JBdmF0YXJcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGltZyBjbGFzcz1cXFwibGItYXV0aG9yX19hdmF0YXJcXFwiIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInB1Ymxpc2hlclwiKSksXCJwaWN0dXJlX3VybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiIC8+XFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJsYi1hdXRob3JfX25hbWVcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJwdWJsaXNoZXJcIikpLFwiZGlzcGxheV9uYW1lXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgPC9kaXY+XFxuICA8IS0tIGVuZCBhdXRob3IgLS0+XFxuXFxuPC9hcnRpY2xlPlwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPGRpdiBjbGFzcz1cXFwibGItdGltZWxpbmVcXFwiIGRhdGEtanMtdGFyZ2V0PVxcXCJ0aW1lbGluZVxcXCI+XFxuICBcIjtcbihwYXJlbnRUZW1wbGF0ZSA/IGZ1bmN0aW9uKGUsIGMsIGYsIHIsIGNiKSB7IGNiKFwiXCIpOyB9IDogY29udGV4dC5nZXRCbG9jayhcInRpbWVsaW5lXCIpKShlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBmdW5jdGlvbih0XzIsdF8xKSB7XG5pZih0XzIpIHsgY2IodF8yKTsgcmV0dXJuOyB9XG5vdXRwdXQgKz0gdF8xO1xub3V0cHV0ICs9IFwiXFxuPC9kaXY+XFxuXFxuXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtZW1iZWQtcHJvdmlkZXJzLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzUsdF8zKSB7XG5pZih0XzUpIHsgY2IodF81KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMyk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzYsdF80KSB7XG5pZih0XzYpIHsgY2IodF82KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNCk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcblxcblwiO1xuaWYocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpbmNsdWRlX2pzX29wdGlvbnNcIikpIHtcbm91dHB1dCArPSBcIlxcbjxzY3JpcHQgdHlwZT1cXFwidGV4dC9qYXZhc2NyaXB0XFxcIj5cXG53aW5kb3cuTEIgPSBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInRoZW1lX2pzb25cIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjtcXG48L3NjcmlwdD5cXG5cIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxufSl9KTtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5mdW5jdGlvbiBiX3RpbWVsaW5lKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgZnJhbWUgPSBmcmFtZS5wdXNoKHRydWUpO1xub3V0cHV0ICs9IFwiXFxuICA8ZGl2IGNsYXNzPVxcXCJsYi10aW1lbGluZSBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwibGFuZ3VhZ2VcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93VGl0bGVcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJ0aXRsZVwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPGgxPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwiYmxvZ1wiKSksXCJ0aXRsZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2gxPlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dEZXNjcmlwdGlvblwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcImRlc2NyaXB0aW9uXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJkZXNjcmlwdGlvblxcXCI+XFxuICAgICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcImRlc2NyaXB0aW9uXCIpKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8L2Rpdj5cXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93SW1hZ2VcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJwaWN0dXJlX3VybFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcInBpY3R1cmVfdXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgLz5cXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG4gICAgPCEtLSBIZWFkZXIgLS0+XFxuICAgIDxkaXYgY2xhc3M9XFxcImhlYWRlci1iYXJcXFwiPlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcInNvcnRpbmctYmFyXFxcIj5cXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcInNvcnRpbmctYmFyX19vcmRlcnNcXFwiPlxcbiAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJzb3J0aW5nLWJhcl9fb3JkZXIgc29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmVcXFwiIGRhdGEtanMtb3JkZXJieV9uZXdlc3RfZmlyc3Q+XFxuICAgICAgICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJ0aGVtZVwiKSksXCJsMTBuXCIpKSxcIm5ld2VzdEZpcnN0XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgPGRpdiBjbGFzcz1cXFwic29ydGluZy1iYXJfX29yZGVyXFxcIiBkYXRhLWpzLW9yZGVyYnlfb2xkZXN0X2ZpcnN0PlxcbiAgICAgICAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwidGhlbWVcIikpLFwibDEwblwiKSksXCJvbGRlc3RGaXJzdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgPC9kaXY+XFxuICAgICAgICA8L2Rpdj5cXG4gICAgICA8L2Rpdj5cXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJoZWFkZXItYmFyX19hY3Rpb25zXFxcIj48L2Rpdj5cXG4gICAgPC9kaXY+XFxuICAgIDwhLS0gSGVhZGVyIEVuZCAtLT5cXG5cXG4gICAgPCEtLSBUaW1lbGluZSAtLT5cXG4gICAgPGRpdiBjbGFzcz1cXFwidGltZWxpbmUtYm9keSB0aW1lbGluZS1ib2R5LS1sb2FkZWRcXFwiPlxcbiAgICAgIFwiO1xuaWYoZW52LmdldEZpbHRlcihcImxlbmd0aFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJfaXRlbXNcIikpID09IDApIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwibGItcG9zdCBlbXB0eS1tZXNzYWdlXFxcIj5cXG4gICAgICAgICAgPGRpdj5CbG9nIHBvc3RzIGFyZSBub3QgY3VycmVudGx5IGF2YWlsYWJsZS48L2Rpdj5cXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPHNlY3Rpb24gY2xhc3M9XFxcImxiLXBvc3RzIGxpc3QtZ3JvdXBcXFwiPlxcbiAgICAgICAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfOSA9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJfaXRlbXNcIik7XG5pZih0XzkpIHt2YXIgdF84ID0gdF85Lmxlbmd0aDtcbmZvcih2YXIgdF83PTA7IHRfNyA8IHRfOS5sZW5ndGg7IHRfNysrKSB7XG52YXIgdF8xMCA9IHRfOVt0XzddO1xuZnJhbWUuc2V0KFwiaXRlbVwiLCB0XzEwKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF83ICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzcpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzggLSB0XzcpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF84IC0gdF83IC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfNyA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF83ID09PSB0XzggLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfOCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICBcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgodF8xMCksXCJkZWxldGVkXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMTMsdF8xMSkge1xuaWYodF8xMykgeyBjYih0XzEzKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTEpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8xNCx0XzEyKSB7XG5pZih0XzE0KSB7IGNiKHRfMTQpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xMik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICAgIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG47XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8L3NlY3Rpb24+XFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwiX21ldGFcIikpLFwibWF4X3Jlc3VsdHNcIikgPD0gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJfbWV0YVwiKSksXCJ0b3RhbFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XFxcImxiLWJ1dHRvbiBsb2FkLW1vcmUtcG9zdHNcXFwiIGRhdGEtanMtbG9hZG1vcmU+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJ0aGVtZVwiKSksXCJsMTBuXCIpKSxcImxvYWROZXdQb3N0c1wiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2J1dHRvbj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgPC9kaXY+XFxuICAgIDwhLS0gVGltZWxpbmUgRW5kIC0tPlxcbiAgPC9kaXY+XFxuICBcIjtcbmNiKG51bGwsIG91dHB1dCk7XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbmJfdGltZWxpbmU6IGJfdGltZWxpbmUsXG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iXX0=
