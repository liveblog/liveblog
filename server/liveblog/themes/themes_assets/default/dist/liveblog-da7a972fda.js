(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/loic/code/liveblog-default-theme/js/liveblog.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

// Prerender functions

var theme = require('./theme');

document.addEventListener('DOMContentLoaded', function () {
  theme.init();
});

module.exports = {};

},{"./theme":"/home/loic/code/liveblog-default-theme/js/theme/index.js"}],"/home/loic/code/liveblog-default-theme/js/theme/handlers.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var view = require('./view'),
    viewmodel = require('./viewmodel'),
    helpers = require('./helpers');

/**
 * Contains a mapping of element data-selectors and click handlers
 * buttons.attach {function} - registers handlers found in handlers object
 */

var sendComment = function sendComment(e) {
  e.preventDefault();

  var name = document.querySelector('#comment-name').value;
  var comment = document.querySelector('#comment-content').value;

  view.clearCommentFormErrors();

  return viewmodel.sendComment(name, comment).then(view.toggleCommentDialog).then(function () {
    return document.querySelector('form.comment').removeEventListener('submit', sendComment);
  }).then(view.showSuccessCommentMsg).catch(view.displayCommentFormErrors);
};

var buttons = {
  handlers: {
    "[data-js-loadmore]": function dataJsLoadmore() {
      viewmodel.loadPostsPage().then(view.renderPosts).then(view.displayNewPosts).catch(catchError);
    },

    "[data-js-orderby_ascending]": function dataJsOrderby_ascending() {
      viewmodel.loadPosts({ sort: 'ascending' }).then(view.renderTimeline).then(view.displayNewPosts).then(view.toggleSortBtn('ascending')).catch(catchError);
    },

    "[data-js-orderby_descending]": function dataJsOrderby_descending() {
      viewmodel.loadPosts({ sort: 'descending' }).then(view.renderTimeline).then(view.displayNewPosts).then(view.toggleSortBtn('descending')).catch(catchError);
    },

    "[data-js-orderby_editorial]": function dataJsOrderby_editorial() {
      viewmodel.loadPosts({ sort: 'editorial' }).then(view.renderTimeline).then(view.displayNewPosts).then(view.toggleSortBtn('editorial')).catch(catchError);
    },

    "[data-js-show-comment-dialog]": function dataJsShowCommentDialog() {
      var isVisible = view.toggleCommentDialog();
      var commentForm = document.querySelector('form.comment');

      if (isVisible) {
        commentForm.addEventListener('submit', sendComment);
      } else {
        commentForm.removeEventListener('submit', sendComment);
      }
    },

    '[data-js-close-comment-dialog]': function dataJsCloseCommentDialog(e) {
      e.preventDefault();
      view.toggleCommentDialog();
    }
  },

  attach: function attach() {
    Object.keys(buttons.handlers).forEach(function (handler) {
      var el = helpers.getElems(handler)[0];

      if (!el) {
        return false;
      }

      el.addEventListener('click', buttons.handlers[handler], false);
    });

    view.attachSlideshow();
  }
};

function catchError(err) {
  console.error("Handler error: ", err);
}

var events = {
  attach: function attach() {} // todo
};

module.exports = {
  buttons: buttons,
  events: events
};

},{"./helpers":"/home/loic/code/liveblog-default-theme/js/theme/helpers.js","./view":"/home/loic/code/liveblog-default-theme/js/theme/view.js","./viewmodel":"/home/loic/code/liveblog-default-theme/js/theme/viewmodel.js"}],"/home/loic/code/liveblog-default-theme/js/theme/helpers.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';
/**
 * Convert ISO timestamps to relative moment timestamps
 * @param {Node} elem - a DOM element with ISO timestamp in data-js-timestamp attr
 */

function convertTimestamp(timestamp) {
  var l10n = LB.l10n.timeAgo,
      now = new Date() // Now
  ,
      diff = now - new Date(timestamp),
      units = {
    d: 1000 * 3600 * 24,
    h: 1000 * 3600,
    m: 1000 * 60
  };

  function getTimeAgoString(timestamp, unit) {
    return !(timestamp <= units[unit] * 2) ? l10n[unit].p.replace("{}", Math.floor(timestamp / units[unit])) : l10n[unit].s;
  }

  function timeAgo(timestamp) {
    if (timestamp < units.h) {
      return getTimeAgoString(timestamp, "m");
    }

    if (timestamp < units.d) {
      return getTimeAgoString(timestamp, "h");
    }

    return getTimeAgoString(timestamp, "d"); // default
  }

  return timeAgo(diff);
}

/**
 * Wrap element selector api
 * @param {string} query - a jQuery syntax DOM query (with dots)
 */
function getElems(query) {
  var isDataAttr = query.indexOf("data-") > -1;
  return isDataAttr ? document.querySelectorAll(query) : document.getElementsByClassName(query);
}

/**
 * jQuery's $.getJSON in a nutshell
 * @param {string} url - a request URL
 */
function getJSON(url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url);
    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(xhr.responseText);
      }
    };

    xhr.send();
  });
}

function post(url, data) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.open('POST', url);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onload = function () {
      if (xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(xhr.responseText);
      }
    };

    xhr.send(JSON.stringify(data));
  });
}

module.exports = {
  getElems: getElems,
  getJSON: getJSON,
  post: post,
  convertTimestamp: convertTimestamp
};

},{}],"/home/loic/code/liveblog-default-theme/js/theme/index.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var handlers = require('./handlers'),
    viewmodel = require('./viewmodel'),
    view = require('./view'),
    pageview = require('./pageview'),
    localAnalytics = require('./local-analytics');

module.exports = {
  /**
   * On document loaded, do the following:
   */
  init: function init() {
    handlers.buttons.attach(); // Register Buttons Handlers
    handlers.events.attach(); // Register Event, Message Handlers
    viewmodel.init();
    localAnalytics.hit();
    pageview.init();

    setInterval(function () {
      view.updateTimestamps(); // Convert ISO dates to timeago
    }, 1000);
  }
};

},{"./handlers":"/home/loic/code/liveblog-default-theme/js/theme/handlers.js","./local-analytics":"/home/loic/code/liveblog-default-theme/js/theme/local-analytics.js","./pageview":"/home/loic/code/liveblog-default-theme/js/theme/pageview.js","./view":"/home/loic/code/liveblog-default-theme/js/theme/view.js","./viewmodel":"/home/loic/code/liveblog-default-theme/js/theme/viewmodel.js"}],"/home/loic/code/liveblog-default-theme/js/theme/local-analytics.js":[function(require,module,exports){
'use strict';

var apiHost = window.hasOwnProperty('LB') ? window.LB.api_host.replace(/\/$/, '') : '';
var contextUrl = document.referrer;
var blogId = window.hasOwnProperty('LB') ? window.LB.blog._id : '';

apiHost += '/api/analytics/hit';

var createCookie = function createCookie(name, value, days) {
  var expires = '',
      date = new Date();

  if (days) {
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + value + expires + '; path=/';
};

var readCookie = function readCookie(name) {
  var nameEQ = name + '=';
  var ca = document.cookie.split(';');

  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];

    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }

    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

var _hit = function _hit() {
  var xmlhttp = new XMLHttpRequest();
  var jsonData = JSON.stringify({
    context_url: contextUrl,
    blog_id: blogId
  });

  xmlhttp.open('POST', apiHost);
  xmlhttp.setRequestHeader('Content-Type', 'application/json');

  xmlhttp.onload = function () {
    if (xmlhttp.status === 200) {
      createCookie('hit', jsonData, 2);
    }
  };

  xmlhttp.send(jsonData);
};

module.exports = { hit: function hit() {
    if (!readCookie('hit')) {
      _hit();
    }
  } };

},{}],"/home/loic/code/liveblog-default-theme/js/theme/pageview.js":[function(require,module,exports){
'use strict';

/*
  Send pageview signal to analytics providers
  IVW and Google Analytics. Not to be tied to angular app.
*/

var sendPageview = {
  _foundProviders: [], // Cache after first lookup

  _sendIVW: function _sendIVW() {
    if (!window.iom) {
      return;
    }

    var iam_data = {
      "st": window._iframeDataset.szmSt, // ID
      "cp": window._iframeDataset.szmCp, // Code
      "co": window._iframeDataset.szmCo, // Comment
      "sv": "ke" // Disable Q&A invite
    };

    window.iom.c(iam_data, 1); // where's the .h? ahahaha
  },

  _sendGA: function _sendGA() {
    if (window.ga.length > 0) {
      window.ga('create', window._iframeDataset.gaProperty, 'auto');
      window.ga('set', 'anonymizeIp', true);
    }

    if (window.ga.loaded) {
      window.ga('send', {
        hitType: 'pageview',
        location: window.document.referrer, // set to parent url
        hitCallback: function hitCallback() {}
      });
    }
  },

  _insertScript: function _insertScript(src, cb) {
    var script = document.createElement('script');script.src = src;
    document.getElementsByTagName("body")[0].appendChild(script);
    script.addEventListener("load", cb);
  },

  _getProviders: function _getProviders() {
    var foundProviders = [];

    if (this._foundProviders.length) {
      return this._foundProviders; // return early
    }

    for (var p in this._providers) {
      var provider = this._providers[p];
      var keysfound = provider.requiredData.reduce(function (prev, curr) {
        return window._iframeDataset.hasOwnProperty(curr);
      }, true); // needs initial value for one element

      if (keysfound === true) {
        // all required attrs found
        if (!provider.object) {
          this._insertScript(provider.scriptURL, provider.send); // not yet loaded
        } else {
          foundProviders.push(provider.send); // list of _send funcs
        }
      }
    }

    parent._foundProviders = foundProviders; // cache after initial
    return foundProviders;
  },

  send: function send() {
    // public, invoke w/o params
    if (!window.hasOwnProperty('_iframeDataset')) {
      return; // return early
    }

    var providers = this._getProviders(); // is cached on first call

    for (var i = providers.length - 1; i >= 0; i--) {
      providers[i](); // _send function calls
    }
  },

  receiveMessage: function receiveMessage(e) {
    if (e.data.type === 'analytics') {
      var payload = JSON.parse(e.data.payload);

      window._iframeDataset = payload; // store dataset from parentNode
    }
  },

  init: function init() {
    if (window.LB.settings.gaCode === '') {
      window.addEventListener('message', this.receiveMessage, false);
      window.addEventListener('sendpageview', this.send.bind(this), false);
    } else {
      window._iframeDataset = { gaProperty: window.LB.settings.gaCode };
      this.send = this.send.bind(this);
      this.send();
    }
  }
};

sendPageview._providers = {
  ivw: {
    send: sendPageview._sendIVW,
    requiredData: ['szmSt', 'szmCp', 'szmCo'],
    scriptURL: 'https://script.ioam.de/iam.js',
    object: window.hasOwnProperty('iom') ? window.iom : null
  },

  ga: {
    send: sendPageview._sendGA,
    requiredData: ['gaProperty'],
    scriptURL: 'https://www.google-analytics.com/analytics.js',
    object: window.hasOwnProperty('ga') ? window.ga : null
  }
};

module.exports = sendPageview;

},{}],"/home/loic/code/liveblog-default-theme/js/theme/slideshow.js":[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var templates = require('./templates');

var Slideshow = function () {
  function Slideshow() {
    _classCallCheck(this, Slideshow);

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.keyboardListener = this.keyboardListener.bind(this);
    this.setFocus = this.setFocus.bind(this);
    this.launchIntoFullscreen = this.launchIntoFullscreen.bind(this);
    this.onResize = this.onResize.bind(this);
    this.exitFullscreen = this.exitFullscreen.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.removeEventListeners = this.removeEventListeners.bind(this);
    this.touchStart = this.touchStart.bind(this);
    this.touchMove = this.touchMove.bind(this);
  }

  _createClass(Slideshow, [{
    key: 'start',
    value: function start(e) {
      var items = [];

      this.iterations = 0;
      this.isFullscreen = false;
      this.xDown = null;
      this.yDown = null;

      e.target.closest('article.slideshow').querySelectorAll('.lb-item img').forEach(function (img) {
        var matches = [];

        img.getAttribute('srcset').replace(/(\S+)\s\d+w/g, function (s, match) {
          matches.push(match);
        });

        var baseImage = matches[0],
            thumbnail = matches[1],
            viewImage = matches[2];


        items.push({
          item: {
            meta: {
              media: { renditions: {
                  baseImage: { href: baseImage },
                  thumbnail: { href: thumbnail },
                  viewImage: { href: viewImage }
                } },
              caption: img.parentNode.querySelector('span.caption').textContent,
              credit: img.parentNode.querySelector('span.credit').textContent
            },
            active: thumbnail === e.target.getAttribute('src')
          }
        });
      });

      var slideshow = templates.slideshow({
        refs: items
      });

      document.querySelector('div.lb-timeline').insertAdjacentHTML('afterend', slideshow);

      if (window.self !== window.top) {
        window.parent.postMessage('fullscreen', window.document.referrer);
      }

      this.setFocus();
      this.addEventListeners();
    }
  }, {
    key: 'stop',
    value: function stop() {
      this.exitFullscreen();
      this.removeEventListeners();
      document.querySelector('#slideshow').remove();
    }
  }, {
    key: 'onResize',
    value: function onResize() {
      var container = document.querySelector('#slideshow .container');
      var offset = container.offsetHeight * this.iterations;

      container.style.marginTop = '-' + offset + 'px';
    }
  }, {
    key: 'addEventListeners',
    value: function addEventListeners() {
      var _this = this;

      window.addEventListener('keydown', this.keyboardListener);

      document.querySelector('#slideshow button.fullscreen').addEventListener('click', this.toggleFullscreen);

      document.querySelector('#slideshow button.arrows.next').addEventListener('click', function () {
        return _this.keyboardListener({ keyCode: 39 });
      });

      document.querySelector('#slideshow button.arrows.prev').addEventListener('click', function () {
        return _this.keyboardListener({ keyCode: 37 });
      });

      document.querySelector('#slideshow button.close').addEventListener('click', this.stop);

      document.querySelector('#slideshow').addEventListener('touchstart', this.touchStart);

      document.querySelector('#slideshow').addEventListener('touchmove', this.touchMove);

      window.addEventListener('resize', this.onResize);
    }
  }, {
    key: 'removeEventListeners',
    value: function removeEventListeners() {
      var _this2 = this;

      window.removeEventListener('keydown', this.keyboardListener);

      document.querySelector('#slideshow button.fullscreen').removeEventListener('click', this.toggleFullscreen);

      document.querySelector('#slideshow button.arrows.next').removeEventListener('click', function () {
        return _this2.keyboardListener({ keyCode: 39 });
      });

      document.querySelector('#slideshow button.arrows.prev').removeEventListener('click', function () {
        return _this2.keyboardListener({ keyCode: 37 });
      });

      document.querySelector('#slideshow button.close').removeEventListener('click', this.stop);

      document.querySelector('#slideshow').removeEventListener('touchstart', this.touchStart);

      document.querySelector('#slideshow').removeEventListener('touchmove', this.touchMove);

      window.removeEventListener('resize', this.onResize);
    }
  }, {
    key: 'touchStart',
    value: function touchStart(e) {
      this.xDown = e.touches[0].clientX;
      this.yDown = e.touches[0].clientY;
    }
  }, {
    key: 'touchMove',
    value: function touchMove(e) {
      if (!this.xDown || !this.yDown) {
        return;
      }

      var xUp = e.touches[0].clientX;
      var yUp = e.touches[0].clientY;

      var xDiff = this.xDown - xUp;
      var yDiff = this.yDown - yUp;

      if (Math.abs(xDiff) > Math.abs(yDiff) && xDiff > 0) {
        // Left swipe
        this.keyboardListener({ keyCode: 39 });
      } else {
        // Right swipe
        this.keyboardListener({ keyCode: 37 });
      }

      this.xDown = null;
      this.yDown = null;
    }
  }, {
    key: 'toggleFullscreen',
    value: function toggleFullscreen() {
      if (!this.isFullscreen) {
        this.launchIntoFullscreen(document.getElementById('slideshow'));
      } else {
        this.exitFullscreen();
      }
    }
  }, {
    key: 'launchIntoFullscreen',
    value: function launchIntoFullscreen(element) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }

      this.isFullscreen = true;
    }
  }, {
    key: 'exitFullscreen',
    value: function exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }

      this.isFullscreen = false;
    }
  }, {
    key: 'setFocus',
    value: function setFocus() {
      var _this3 = this;

      var container = document.querySelector('#slideshow .container');

      container.querySelectorAll('img').forEach(function (img, i) {
        if (img.classList.contains('active')) {
          _this3.iterations = i;
        }
      });

      if (this.iterations > 0) {
        container.style.marginTop = '-' + container.offsetHeight * this.iterations + 'px';
      }
    }
  }, {
    key: 'keyboardListener',
    value: function keyboardListener(e) {
      var container = document.querySelector('#slideshow .container');
      var picturesCount = container.querySelectorAll('img').length;
      var offset = container.offsetHeight * this.iterations;

      switch (e.keyCode) {
        case 39:
          // right
          if (offset + container.offsetHeight < picturesCount * container.offsetHeight) {
            container.style.marginTop = '-' + (offset + container.offsetHeight) + 'px';
            this.iterations++;
          }

          break;
        case 37:
          // left
          if (offset - container.offsetHeight >= 0) {
            container.style.marginTop = '-' + (offset - container.offsetHeight) + 'px';
            this.iterations--;
          }

          break;
        case 27:
          // esc
          this.exitFullscreen();
          this.stop();
      }
    }
  }]);

  return Slideshow;
}();

module.exports = Slideshow;

},{"./templates":"/home/loic/code/liveblog-default-theme/js/theme/templates.js"}],"/home/loic/code/liveblog-default-theme/js/theme/templates.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var nunjucks = require("nunjucks/browser/nunjucks-slim");
var settings = window.LB.settings;

var defaultTemplates = {
  post: require("../../templates/template-post.html"),
  timeline: require("../../templates/template-timeline.html"),
  itemImage: require("../../templates/template-item-image.html"),
  itemEmbed: require("../../templates/template-item-embed.html"),
  slideshow: require("../../templates/template-slideshow.html")
};

function getCustomTemplates() {
  var customTemplates = settings.customTemplates,
      mergedTemplates = defaultTemplates;

  var _loop = function _loop(template) {
    var customTemplateName = customTemplates[template];
    defaultTemplates[template] = function (ctx, cb) {
      nunjucks.render(customTemplateName, ctx, cb);
    };
  };

  for (var template in customTemplates) {
    _loop(template);
  }

  return mergedTemplates;
}

module.exports = settings.customTemplates ? getCustomTemplates() : defaultTemplates;

},{"../../templates/template-item-embed.html":"/home/loic/code/liveblog-default-theme/templates/template-item-embed.html","../../templates/template-item-image.html":"/home/loic/code/liveblog-default-theme/templates/template-item-image.html","../../templates/template-post.html":"/home/loic/code/liveblog-default-theme/templates/template-post.html","../../templates/template-slideshow.html":"/home/loic/code/liveblog-default-theme/templates/template-slideshow.html","../../templates/template-timeline.html":"/home/loic/code/liveblog-default-theme/templates/template-timeline.html","nunjucks/browser/nunjucks-slim":"/home/loic/code/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/loic/code/liveblog-default-theme/js/theme/view.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var helpers = require('./helpers');
var templates = require('./templates');
var Slideshow = require('./slideshow');

var timelineElem = document.querySelectorAll(".lb-posts.normal"),
    loadMorePostsButton = helpers.getElems("load-more-posts");

/**
 * Replace the current timeline unconditionally.
 * @typedef {Object} api_response – contains request opts.
 * @property {Object} requestOpts - API request params.
 */
function renderTimeline(api_response) {
  var renderedPosts = [];

  api_response._items.forEach(function (post) {
    renderedPosts.push(templates.post({
      item: post,
      settings: window.LB.settings
    }));
  });

  timelineElem[0].innerHTML = renderedPosts.join("");
  loadEmbeds();
  attachSlideshow();
}

/**
 * Render posts currently in pipeline to template.
 * To reduce DOM calls/paints we hand off rendered HTML in bulk.
 * @typedef {Object} api_response – contains request opts.
 * @property {Object} requestOpts - API request params.
 */
function renderPosts(api_response) {
  var renderedPosts = [] // temporary store
  ,
      posts = api_response._items;

  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];

    if (posts.operation === "delete") {
      deletePost(post._id);
      return; // early
    }

    var renderedPost = templates.post({
      item: post,
      settings: window.LB.settings
    });

    if (posts.operation === "update") {
      updatePost(renderedPost);
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

  var postsHTML = "",
      position = opts.position === "top" ? "afterbegin" // insertAdjacentHTML API => after start of node
  : "beforeend"; // insertAdjacentHTML API => before end of node

  for (var i = posts.length - 1; i >= 0; i--) {
    postsHTML += posts[i];
  }

  timelineElem[0].insertAdjacentHTML(position, postsHTML);
  attachSlideshow();
}

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function deletePost(postId) {
  var elem = helpers.getElems('data-js-post-id=\"' + postId + '\"');
  elem[0].remove();
}

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function updatePost(postId, renderedPost) {
  var elem = helpers.getElems('data-js-post-id=\"' + postId + '\"');
  elem[0].innerHTML = renderedPost;
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

function toggleCommentDialog() {
  var commentForm = document.querySelector('form.comment');
  var isHidden = false;

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

  sortingBtns.forEach(function (el) {
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
    loadMorePostsButton[0].classList.toggle("mod--hide", shouldHide);
  }
}

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function updateTimestamps() {
  var dateElems = helpers.getElems("lb-post-date");
  for (var i = 0; i < dateElems.length; i++) {
    var elem = dateElems[i],
        timestamp = elem.dataset.jsTimestamp;
    elem.textContent = helpers.convertTimestamp(timestamp);
  }
  return null;
}

function showSuccessCommentMsg() {
  var commentSent = document.querySelector('div.comment-sent');

  commentSent.classList.toggle('hide');

  setTimeout(function () {
    commentSent.classList.toggle('hide');
  }, 5000);
}

function clearCommentFormErrors() {
  var errorsMsgs = document.querySelectorAll('p.err-msg');

  if (errorsMsgs) {
    errorsMsgs.forEach(function (errorsMsg) {
      return errorsMsg.remove();
    });
  }
}

function displayCommentFormErrors(errors) {
  if (Array.isArray(errors)) {
    errors.forEach(function (error) {
      var element = document.querySelector(error.id);

      if (element) {
        element.insertAdjacentHTML('afterend', '<p class="err-msg">' + error.msg + '</p>');
      }
    });
  }
}

function attachSlideshow() {
  var slideshow = new Slideshow();
  var slideshowImages = document.querySelectorAll('article.slideshow img');

  if (slideshowImages) {
    slideshowImages.forEach(function (image) {
      image.addEventListener('click', slideshow.start);
    });
  }
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
  attachSlideshow: attachSlideshow
};

},{"./helpers":"/home/loic/code/liveblog-default-theme/js/theme/helpers.js","./slideshow":"/home/loic/code/liveblog-default-theme/js/theme/slideshow.js","./templates":"/home/loic/code/liveblog-default-theme/js/theme/templates.js"}],"/home/loic/code/liveblog-default-theme/js/theme/viewmodel.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var helpers = require('./helpers'),
    view = require('./view');

var commentItemEndpoint = LB.api_host + 'api/client_items';
var commentPostEndpoint = LB.api_host + 'api/client_comments';

var endpoint = LB.api_host + "/api/client_blogs/" + LB.blog._id + "/posts",
    settings = LB.settings,
    vm = {};

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

vm.sendComment = function (name, comment) {
  var errors = [];

  if (!name) {
    errors.push({ id: '#comment-name', msg: 'Missing name' });
  }

  if (!comment) {
    errors.push({ id: '#comment-content', msg: 'Missing content' });
  }

  if (errors.length > 0) {
    return new Promise(function (resolve, reject) {
      return reject(errors);
    });
  }

  return helpers.post(commentItemEndpoint, {
    item_type: "comment",
    client_blog: LB.blog._id,
    commenter: name,
    text: comment
  }).then(function (item) {
    return helpers.post(commentPostEndpoint, {
      post_status: "comment",
      client_blog: LB.blog._id,
      groups: [{
        id: "root",
        refs: [{ idRef: "main" }],
        role: "grpRole:NEP"
      }, {
        id: "main",
        refs: [{ residRef: item._id }],
        role: "grpRole:Main" }]
    });
  });
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
vm.getPosts = function (opts) {
  var self = this;

  var dbQuery = self.getQuery({
    sort: opts.sort || self.settings.postOrder,
    highlightsOnly: false || opts.highlightsOnly,
    fromDate: opts.fromDate ? opts.fromDate : false
  });

  var page = opts.fromDate ? 1 : opts.page;
  var qs = "?max_results=" + settings.postsPerPage + "&page=" + page + "&source=",
      fullPath = endpoint + qs + dbQuery;

  return helpers.getJSON(fullPath).then(function (posts) {
    self.updateViewModel(posts, opts);
    posts.requestOpts = opts;
    return posts;
  }).catch(function (err) {
    console.error(err);
  });
};

/**
 * Get next page of posts from API.
 * @param {object} opts - query builder options.
 * @returns {promise} resolves to posts array.
 */
vm.loadPostsPage = function (opts) {
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
vm.loadPosts = function (opts) {
  opts = opts || {};
  opts.fromDate = this.vm.latestUpdate;
  return this.getPosts(opts);
};

/**
 * Add items in api response & latest update timestamp to viewmodel.
 * @param {object} api_response - liveblog API response JSON.
 */
vm.updateViewModel = function (api_response, opts) {
  var self = this;

  if (!opts.fromDate || opts.sort !== self.settings.postOrder) {
    // Means we're not polling
    view.hideLoadMore(self.isTimelineEnd(api_response)); // the end?
  } else {
    // Means we're polling for new posts
    if (!api_response._items.length) {
      return;
    }

    self.vm.latestUpdate = self.getLatestUpdate(api_response);
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
vm.getLatestUpdate = function (api_response) {
  var timestamps = api_response._items.map(function (post) {
    return new Date(post._updated);
  });

  var latest = new Date(Math.max.apply(null, timestamps));
  return latest.toISOString(); // convert timestamp to ISO
};

/**
 * Check if we reached the end of the timeline.
 * @param {object} api_response - liveblog API response JSON.
 * @returns {bool}
 */
vm.isTimelineEnd = function (api_response) {
  var itemsInView = this.vm._items.length + settings.postsPerPage;
  return api_response._meta.total <= itemsInView;
};

/**
 * Set up viewmodel.
 */
vm.init = function () {
  this.settings = settings;
  this.vm = getEmptyVm(settings.postsPerPage);
  this.vm.latestUpdate = new Date().toISOString();
  this.vm.timeInitialized = new Date().toISOString();
  return this.vm.latestUpdate;
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
vm.getQuery = function (opts) {
  var query = {
    "query": {
      "filtered": {
        "filter": {
          "and": [{ "term": { "sticky": false } }, { "term": { "post_status": "open" } }, { "not": { "term": { "deleted": true } } }, { "range": { "_updated": { "lt": this.vm.timeInitialized } } }]
        }
      }
    },
    "sort": [{
      "_updated": { "order": "desc" }
    }]
  };

  if (opts.fromDate) {
    query.query.filtered.filter.and[3].range._updated = {
      "gt": opts.fromDate
    };
  }

  if (opts.highlightsOnly === true) {
    query.query.filtered.filter.and.push({
      term: { highlight: true }
    });
  }

  if (opts.sort === "ascending") {
    query.sort[0]._updated.order = "asc";
  } else if (opts.sort === "editorial") {
    query.sort = [{
      order: {
        order: "desc",
        missing: "_last",
        unmapped_type: "long"
      }
    }];
  }

  // Remove the range, we want all the results
  if (["ascending", "descending", "editorial"].indexOf(opts.sort)) {
    query.query.filtered.filter.and.forEach(function (rule, index) {
      if (rule.hasOwnProperty('range')) {
        query.query.filtered.filter.and.splice(index, 1);
      }
    });
  }

  return encodeURI(JSON.stringify(query));
};

module.exports = vm;

},{"./helpers":"/home/loic/code/liveblog-default-theme/js/theme/helpers.js","./view":"/home/loic/code/liveblog-default-theme/js/theme/view.js"}],"/home/loic/code/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js":[function(require,module,exports){
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
},{}],"/home/loic/code/liveblog-default-theme/templates/template-item-embed.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-item-embed.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"html")) {
output += "\n<div class=\"item--embed__element\">";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"html")), env.opts.autoescape);
output += "</div>\n";
;
}
output += "\n";
if((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"title") || runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"description") || runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"credit") || (!runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"html") && runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"thumbnail_url")))) {
output += "\n<article class=\"item--embed item--embed__wrapper\">\n    ";
if(!runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"html") && runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"thumbnail_url")) {
output += "\n    <a href=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"url"), env.opts.autoescape);
output += "\" target=\"_blank\" class=\"";
output += runtime.suppressValue((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"description")?"item--embed__illustration":"item--embed__only-illustration"), env.opts.autoescape);
output += "\">\n        <img src=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"thumbnail_url"), env.opts.autoescape);
output += "\"/>\n   </a>\n   ";
;
}
output += "\n   ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"title") || runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"description") || runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"credit")) {
output += "\n   <div class=\"item--embed__info\">\n        ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"title")) {
output += "\n        <div class=\"item--embed__title\">\n            <a href=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"url"), env.opts.autoescape);
output += "\" target=\"_blank\" title=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"title"), env.opts.autoescape);
output += "\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"title"), env.opts.autoescape);
output += "</a>\n        </div>\n        ";
;
}
output += "\n        ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"description")) {
output += "\n        <div class=\"item--embed__description\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"description"), env.opts.autoescape);
output += "</div>\n        ";
;
}
output += "\n        ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"credit")) {
output += "\n        <div class=\"item--embed__credit\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"credit"), env.opts.autoescape);
output += "</div>\n        ";
;
}
output += "\n    </div>\n    ";
;
}
output += "\n\n</article>\n";
;
}
output += "\n";
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

},{"nunjucks/browser/nunjucks-slim":"/home/loic/code/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/loic/code/liveblog-default-theme/templates/template-item-image.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-item-image.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<figure>\n  <img \n    ";
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"active")) {
output += "class=\"active\"";
;
}
output += "\n    src=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"media")),"renditions")),"thumbnail")),"href"), env.opts.autoescape);
output += "\"\n    srcset=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"media")),"renditions")),"baseImage")),"href"), env.opts.autoescape);
output += " 810w, \n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"media")),"renditions")),"thumbnail")),"href"), env.opts.autoescape);
output += " 240w, \n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"media")),"renditions")),"viewImage")),"href"), env.opts.autoescape);
output += " 540w\" \n    alt=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"caption"), env.opts.autoescape);
output += "\">\n  <figcaption>\n    <span ng-if=\"ref.item.meta.caption\" class=\"caption\">\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"caption"), env.opts.autoescape);
output += "\n    </span>&nbsp;\n    <span ng-if=\"ref.item.meta.credit\" class=\"credit\">\n      ";
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

},{"nunjucks/browser/nunjucks-slim":"/home/loic/code/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/loic/code/liveblog-default-theme/templates/template-post.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-post.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<!-- sticky position toggle -->\n";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky") && runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"stickyPosition") == "top") {
output += "\n<article\n  class=\"lb-sticky-top-post list-group-item ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"post_items_type"), env.opts.autoescape);
output += "\"\n  data-js-post-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"_id"), env.opts.autoescape);
output += "\">\n  ";
;
}
else {
output += "\n<article\n  class=\"lb-post list-group-item show-author-avatar ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"post_items_type"), env.opts.autoescape);
output += "\"\n  data-js-post-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"_id"), env.opts.autoescape);
output += "\">\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky")) {
output += "\n    <div class=\"lb-type\"></div>\n    <img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/pinpost.svg\" class=\"lb-post-pin\" />\n  ";
;
}
else {
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"lb_highlight")) {
output += "\n    <div class=\"lb-type lb-post-highlighted\"></div>\n  ";
;
}
else {
output += "\n    <div class=\"lb-type lb-type--text\"></div>\n  ";
;
}
;
}
output += "\n\n  <div class=\"lb-post-date\" data-js-timestamp=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"_updated"), env.opts.autoescape);
output += "\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"_updated"), env.opts.autoescape);
output += "</div>\n\n  <!-- author plus avatar -->\n  <div class=\"lb-author\">\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showAuthor") && runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"publisher")) {
output += "\n      <div class=\"lb-author__name\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"publisher")),"display_name"), env.opts.autoescape);
output += "</div>\n      ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showAuthorAvatar")) {
output += "\n        ";
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"publisher")),"picture_url")) {
output += "\n        <img class=\"lb-author__avatar\" src=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"publisher")),"picture_url"), env.opts.autoescape);
output += "\" />\n        ";
;
}
else {
output += "\n        <div class=\"lb-author__avatar\"></div>\n        ";
;
}
output += "\n      ";
;
}
output += "\n    ";
;
}
output += "\n  </div>\n  <!-- end author -->\n  ";
;
}
output += "\n  <!-- end sticky position toggle -->\n\n  <!-- item start -->\n  <div class=\"items-container\">\n    ";
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
output += "\n      ";
if(runtime.memberLookup((runtime.memberLookup((t_4),"item")),"item_type") == "image") {
output += "\n      <div class=\"";
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky") || runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"stickyPosition") == "bottom") {
output += "lb-item";
;
}
output += " ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_4),"item")),"meta")),"media")),"renditions")),"original")),"height") > runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_4),"item")),"meta")),"media")),"renditions")),"original")),"width")) {
output += "portrait";
;
}
output += "\">\n      ";
;
}
else {
output += "\n      <div class=\"";
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky") || runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"stickyPosition") == "bottom") {
output += "lb-item";
;
}
output += "\">\n      ";
;
}
output += "\n        ";
if(runtime.memberLookup((runtime.memberLookup((t_4),"item")),"item_type") == "embed") {
output += "\n          ";
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
output += "\n        ";
});
}
else {
if(runtime.memberLookup((runtime.memberLookup((t_4),"item")),"item_type") == "image") {
output += "\n          ";
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
output += "\n        ";
});
}
else {
if(runtime.memberLookup((runtime.memberLookup((t_4),"item")),"item_type") == "quote") {
output += "\n          ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-item-quote.html", false, "template-post.html", null, function(t_15,t_13) {
if(t_15) { cb(t_15); return; }
callback(null,t_13);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_16,t_14) {
if(t_16) { cb(t_16); return; }
callback(null,t_14);});
});
tasks.push(
function(result, callback){
output += result;
callback(null);
});
env.waterfall(tasks, function(){
output += "\n        ";
});
}
else {
output += "\n          <article>";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.memberLookup((runtime.memberLookup((t_4),"item")),"text")), env.opts.autoescape);
output += "</article>\n        ";
;
}
;
}
;
}
output += "\n      </div>\n    ";
;
}
}
frame = frame.pop();
output += "\n  </div>\n  <!-- item end -->\n\n</article>\n";
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

},{"nunjucks/browser/nunjucks-slim":"/home/loic/code/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/loic/code/liveblog-default-theme/templates/template-slideshow.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-slideshow.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div id=\"slideshow\">\n  <div class=\"container\">\n    ";
frame = frame.push();
var t_3 = runtime.contextOrFrameLookup(context, frame, "refs");
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
output += "\n      ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-item-image.html", false, "template-slideshow.html", null, function(t_7,t_5) {
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
output += "\n    ";
});
}
}
frame = frame.pop();
output += "\n  </div>\n  <button class=\"close\">X</button>\n  <button class=\"fullscreen\">Fullscreen</button>\n  <button class=\"arrows prev\">&lt;</button>\n  <button class=\"arrows next\">&gt;</button>\n</div>\n";
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
return function(ctx, cb) { return nunjucks.render("template-slideshow.html", ctx, cb); }
})();
;

},{"nunjucks/browser/nunjucks-slim":"/home/loic/code/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/loic/code/liveblog-default-theme/templates/template-timeline.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-timeline.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
(parentTemplate ? function(e, c, f, r, cb) { cb(""); } : context.getBlock("timeline"))(env, context, frame, runtime, function(t_2,t_1) {
if(t_2) { cb(t_2); return; }
output += t_1;
output += "\n\n";
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
output += "\n  <script type=\"text/javascript\">\n    window.LB = ";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.contextOrFrameLookup(context, frame, "json_options")), env.opts.autoescape);
output += ";\n  </script>\n";
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
output += "\n<div class=\"lb-timeline ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"language"), env.opts.autoescape);
output += "\">\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showTitle") && runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "blog")),"title")) {
output += "\n    <h1>";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "blog")),"title"), env.opts.autoescape);
output += "</h1>\n  ";
;
}
output += "\n\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showDescription") && runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "blog")),"description")) {
output += "\n    <div class=\"description\">\n      ";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "blog")),"description")), env.opts.autoescape);
output += "\n    </div>\n  ";
;
}
output += "\n\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showImage") && runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "blog")),"picture_url")) {
output += "\n    <img src=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "blog")),"picture_url"), env.opts.autoescape);
output += "\" />\n  ";
;
}
output += "\n\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"stickyPosition") == "top" && env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"stickyPosts")),"_items")) > 0) {
output += "\n    <div class=\"timeline-top timeline-top--loaded\">\n      <section class=\"lb-posts list-group\">\n        ";
frame = frame.push();
var t_9 = runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"stickyPosts")),"_items");
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
output += "\n          ";
if(!runtime.memberLookup((t_10),"deleted")) {
output += "\n            ";
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
output += "\n          ";
});
}
output += "\n        ";
;
}
}
frame = frame.pop();
output += "\n      </section>\n    </div>\n  ";
;
}
output += "\n\n  <!-- Header -->\n  <div class=\"header-bar\">\n    <div class=\"sorting-bar\">\n      <div class=\"sorting-bar__orders\">\n        <div\n          class=\"sorting-bar__order ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"postOrder") == "editorial") {
output += "sorting-bar__order--active";
;
}
output += "\"\n          data-js-orderby_editorial>\n          ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "options")),"l10n")),"editorial"), env.opts.autoescape);
output += "\n        </div>\n        <div\n          class=\"sorting-bar__order ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"postOrder") == "newest_first") {
output += "sorting-bar__order--active";
;
}
output += "\"\n          data-js-orderby_descending>\n          ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "options")),"l10n")),"descending"), env.opts.autoescape);
output += "\n        </div>\n        <div\n          class=\"sorting-bar__order ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"postOrder") == "oldest_first") {
output += "sorting-bar__order--active";
;
}
output += "\"\n          data-js-orderby_ascending>\n          ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "options")),"l10n")),"ascending"), env.opts.autoescape);
output += "\n        </div>\n      </div>\n    </div>\n    <div class=\"header-bar__actions\"></div>\n      ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"canComment")) {
output += "\n        <button class=\"header-bar__comment\" data-js-show-comment-dialog>Comment</button>\n      ";
;
}
output += "\n\n      ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showLiveblogLogo")) {
output += "\n        <a class=\"header-bar__logo\" href=\"https://www.liveblog.pro\" target=\"_blank\">\n          <span>Powered by</span>\n          <img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/lb-logo.svg\" />\n        </a>\n      ";
;
}
output += "\n    </div>\n  <!-- Header End -->\n\n  <!-- Comment -->\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"canComment")) {
output += "\n    ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-comment.html", false, "template-timeline.html", null, function(t_17,t_15) {
if(t_17) { cb(t_17); return; }
callback(null,t_15);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_18,t_16) {
if(t_18) { cb(t_18); return; }
callback(null,t_16);});
});
tasks.push(
function(result, callback){
output += result;
callback(null);
});
env.waterfall(tasks, function(){
output += "\n  ";
});
}
output += "\n  <!-- Comment End -->\n\n  <!-- Timeline -->\n  <div class=\"timeline-body timeline-body--loaded\">\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"stickyPosition") == "bottom" && env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"stickyPosts")),"_items")) > 0) {
output += "\n      <section class=\"lb-posts list-group sticky\">\n        ";
frame = frame.push();
var t_21 = runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"stickyPosts")),"_items");
if(t_21) {var t_20 = t_21.length;
for(var t_19=0; t_19 < t_21.length; t_19++) {
var t_22 = t_21[t_19];
frame.set("item", t_22);
frame.set("loop.index", t_19 + 1);
frame.set("loop.index0", t_19);
frame.set("loop.revindex", t_20 - t_19);
frame.set("loop.revindex0", t_20 - t_19 - 1);
frame.set("loop.first", t_19 === 0);
frame.set("loop.last", t_19 === t_20 - 1);
frame.set("loop.length", t_20);
output += "\n          ";
if(!runtime.memberLookup((t_22),"deleted")) {
output += "\n            ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-post.html", false, "template-timeline.html", null, function(t_25,t_23) {
if(t_25) { cb(t_25); return; }
callback(null,t_23);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_26,t_24) {
if(t_26) { cb(t_26); return; }
callback(null,t_24);});
});
tasks.push(
function(result, callback){
output += result;
callback(null);
});
env.waterfall(tasks, function(){
output += "\n          ";
});
}
output += "\n        ";
;
}
}
frame = frame.pop();
output += "\n      </section>\n    ";
;
}
output += "\n    ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"posts")),"_items")) == 0) {
output += "\n      <div class=\"lb-post empty-message\">\n        <div>Blog posts are not currently available.</div>\n      </div>\n      ";
;
}
else {
output += "\n      <section class=\"lb-posts list-group normal\">\n        ";
frame = frame.push();
var t_29 = runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"posts")),"_items");
if(t_29) {var t_28 = t_29.length;
for(var t_27=0; t_27 < t_29.length; t_27++) {
var t_30 = t_29[t_27];
frame.set("item", t_30);
frame.set("loop.index", t_27 + 1);
frame.set("loop.index0", t_27);
frame.set("loop.revindex", t_28 - t_27);
frame.set("loop.revindex0", t_28 - t_27 - 1);
frame.set("loop.first", t_27 === 0);
frame.set("loop.last", t_27 === t_28 - 1);
frame.set("loop.length", t_28);
output += "\n          ";
if(!runtime.memberLookup((t_30),"deleted")) {
output += "\n            ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-post.html", false, "template-timeline.html", null, function(t_33,t_31) {
if(t_33) { cb(t_33); return; }
callback(null,t_31);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_34,t_32) {
if(t_34) { cb(t_34); return; }
callback(null,t_32);});
});
tasks.push(
function(result, callback){
output += result;
callback(null);
});
env.waterfall(tasks, function(){
output += "\n          ";
});
}
output += "\n        ";
;
}
}
frame = frame.pop();
output += "\n      </section>\n      ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"posts")),"_meta")),"max_results") <= runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"posts")),"_meta")),"total")) {
output += "\n        <button class=\"lb-button load-more-posts\" data-js-loadmore>";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "options")),"l10n")),"loadNewPosts"), env.opts.autoescape);
output += "</button>\n      ";
;
}
output += "\n    ";
;
}
output += "\n  </div>\n  <!-- Timeline End -->\n\n</div>\n";
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

},{"nunjucks/browser/nunjucks-slim":"/home/loic/code/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}]},{},["/home/loic/code/liveblog-default-theme/js/liveblog.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9saXZlYmxvZy5qcyIsImpzL3RoZW1lL2hhbmRsZXJzLmpzIiwianMvdGhlbWUvaGVscGVycy5qcyIsImpzL3RoZW1lL2luZGV4LmpzIiwianMvdGhlbWUvbG9jYWwtYW5hbHl0aWNzLmpzIiwianMvdGhlbWUvcGFnZXZpZXcuanMiLCJqcy90aGVtZS9zbGlkZXNob3cuanMiLCJqcy90aGVtZS90ZW1wbGF0ZXMuanMiLCJqcy90aGVtZS92aWV3LmpzIiwianMvdGhlbWUvdmlld21vZGVsLmpzIiwibm9kZV9tb2R1bGVzL251bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbS5qcyIsInRlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sIiwidGVtcGxhdGVzL3RlbXBsYXRlLXBvc3QuaHRtbCIsInRlbXBsYXRlcy90ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbCIsInRlbXBsYXRlcy90ZW1wbGF0ZS10aW1lbGluZS5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7Ozs7QUFJQTs7QUFFQTs7QUFDQSxJQUFJLFFBQVEsUUFBUSxTQUFSLENBQVo7O0FBRUEsU0FBUyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsWUFBTTtBQUNsRCxRQUFNLElBQU47QUFDRCxDQUZEOztBQUlBLE9BQU8sT0FBUCxHQUFpQixFQUFqQjs7O0FDYkE7Ozs7QUFJQTs7QUFFQSxJQUFJLE9BQU8sUUFBUSxRQUFSLENBQVg7QUFBQSxJQUNJLFlBQVksUUFBUSxhQUFSLENBRGhCO0FBQUEsSUFFSSxVQUFVLFFBQVEsV0FBUixDQUZkOztBQUlBOzs7OztBQUtBLElBQU0sY0FBYyxTQUFkLFdBQWMsQ0FBQyxDQUFELEVBQU87QUFDekIsSUFBRSxjQUFGOztBQUVBLE1BQUksT0FBTyxTQUFTLGFBQVQsQ0FBdUIsZUFBdkIs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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3A2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFByZXJlbmRlciBmdW5jdGlvbnNcbnZhciB0aGVtZSA9IHJlcXVpcmUoJy4vdGhlbWUnKTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgdGhlbWUuaW5pdCgpO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge307XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKVxuICAsIHZpZXdtb2RlbCA9IHJlcXVpcmUoJy4vdmlld21vZGVsJylcbiAgLCBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XG5cbi8qKlxuICogQ29udGFpbnMgYSBtYXBwaW5nIG9mIGVsZW1lbnQgZGF0YS1zZWxlY3RvcnMgYW5kIGNsaWNrIGhhbmRsZXJzXG4gKiBidXR0b25zLmF0dGFjaCB7ZnVuY3Rpb259IC0gcmVnaXN0ZXJzIGhhbmRsZXJzIGZvdW5kIGluIGhhbmRsZXJzIG9iamVjdFxuICovXG5cbmNvbnN0IHNlbmRDb21tZW50ID0gKGUpID0+IHtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gIGxldCBuYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvbW1lbnQtbmFtZScpLnZhbHVlO1xuICBsZXQgY29tbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb21tZW50LWNvbnRlbnQnKS52YWx1ZTtcblxuICB2aWV3LmNsZWFyQ29tbWVudEZvcm1FcnJvcnMoKTtcblxuICByZXR1cm4gdmlld21vZGVsLnNlbmRDb21tZW50KG5hbWUsIGNvbW1lbnQpXG4gICAgLnRoZW4odmlldy50b2dnbGVDb21tZW50RGlhbG9nKVxuICAgIC50aGVuKCgpID0+IGRvY3VtZW50XG4gICAgICAgIC5xdWVyeVNlbGVjdG9yKCdmb3JtLmNvbW1lbnQnKVxuICAgICAgICAucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpXG4gICAgKVxuICAgIC50aGVuKHZpZXcuc2hvd1N1Y2Nlc3NDb21tZW50TXNnKVxuICAgIC5jYXRjaCh2aWV3LmRpc3BsYXlDb21tZW50Rm9ybUVycm9ycyk7XG59O1xuXG52YXIgYnV0dG9ucyA9IHtcbiAgaGFuZGxlcnM6IHtcbiAgICBcIltkYXRhLWpzLWxvYWRtb3JlXVwiOiAoKSA9PiB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzUGFnZSgpXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyUG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAuY2F0Y2goY2F0Y2hFcnJvcik7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtb3JkZXJieV9hc2NlbmRpbmddXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHMoe3NvcnQ6ICdhc2NlbmRpbmcnfSlcbiAgICAgICAgLnRoZW4odmlldy5yZW5kZXJUaW1lbGluZSlcbiAgICAgICAgLnRoZW4odmlldy5kaXNwbGF5TmV3UG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcudG9nZ2xlU29ydEJ0bignYXNjZW5kaW5nJykpXG4gICAgICAgIC5jYXRjaChjYXRjaEVycm9yKTtcbiAgICB9LFxuXG4gICAgXCJbZGF0YS1qcy1vcmRlcmJ5X2Rlc2NlbmRpbmddXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHMoe3NvcnQ6ICdkZXNjZW5kaW5nJ30pXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyVGltZWxpbmUpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAudGhlbih2aWV3LnRvZ2dsZVNvcnRCdG4oJ2Rlc2NlbmRpbmcnKSlcbiAgICAgICAgLmNhdGNoKGNhdGNoRXJyb3IpO1xuICAgIH0sXG5cbiAgICBcIltkYXRhLWpzLW9yZGVyYnlfZWRpdG9yaWFsXVwiOiAoKSA9PiB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzKHtzb3J0OiAnZWRpdG9yaWFsJ30pXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyVGltZWxpbmUpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAudGhlbih2aWV3LnRvZ2dsZVNvcnRCdG4oJ2VkaXRvcmlhbCcpKVxuICAgICAgICAuY2F0Y2goY2F0Y2hFcnJvcik7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtc2hvdy1jb21tZW50LWRpYWxvZ11cIjogKCkgPT4ge1xuICAgICAgbGV0IGlzVmlzaWJsZSA9IHZpZXcudG9nZ2xlQ29tbWVudERpYWxvZygpO1xuICAgICAgbGV0IGNvbW1lbnRGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9ybS5jb21tZW50Jyk7XG5cbiAgICAgIGlmIChpc1Zpc2libGUpIHtcbiAgICAgICAgY29tbWVudEZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29tbWVudEZvcm0ucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAnW2RhdGEtanMtY2xvc2UtY29tbWVudC1kaWFsb2ddJzogKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZpZXcudG9nZ2xlQ29tbWVudERpYWxvZygpO1xuICAgIH1cbiAgfSxcblxuICBhdHRhY2g6IGZ1bmN0aW9uKCkge1xuICAgIE9iamVjdC5rZXlzKGJ1dHRvbnMuaGFuZGxlcnMpLmZvckVhY2goKGhhbmRsZXIpID0+IHtcbiAgICAgIGxldCBlbCA9IGhlbHBlcnMuZ2V0RWxlbXMoaGFuZGxlcilbMF07XG5cbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGJ1dHRvbnMuaGFuZGxlcnNbaGFuZGxlcl0sIGZhbHNlKTtcbiAgICB9KTtcblxuICAgIHZpZXcuYXR0YWNoU2xpZGVzaG93KCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGNhdGNoRXJyb3IoZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoXCJIYW5kbGVyIGVycm9yOiBcIiwgZXJyKTtcbn1cblxudmFyIGV2ZW50cyA9IHtcbiAgYXR0YWNoOiBmdW5jdGlvbigpIHt9IC8vIHRvZG9cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBidXR0b25zOiBidXR0b25zLFxuICBldmVudHM6IGV2ZW50c1xufTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKiBDb252ZXJ0IElTTyB0aW1lc3RhbXBzIHRvIHJlbGF0aXZlIG1vbWVudCB0aW1lc3RhbXBzXG4gKiBAcGFyYW0ge05vZGV9IGVsZW0gLSBhIERPTSBlbGVtZW50IHdpdGggSVNPIHRpbWVzdGFtcCBpbiBkYXRhLWpzLXRpbWVzdGFtcCBhdHRyXG4gKi9cbmZ1bmN0aW9uIGNvbnZlcnRUaW1lc3RhbXAodGltZXN0YW1wKSB7XG4gIHZhciBsMTBuID0gTEIubDEwbi50aW1lQWdvXG4gICAgLCBub3cgPSBuZXcgRGF0ZSgpIC8vIE5vd1xuICAgICwgZGlmZiA9IG5vdyAtIG5ldyBEYXRlKHRpbWVzdGFtcClcbiAgICAsIHVuaXRzID0ge1xuICAgICAgZDogMTAwMCAqIDM2MDAgKiAyNCxcbiAgICAgIGg6IDEwMDAgKiAzNjAwLFxuICAgICAgbTogMTAwMCAqIDYwXG4gICAgfTtcblxuICBmdW5jdGlvbiBnZXRUaW1lQWdvU3RyaW5nKHRpbWVzdGFtcCwgdW5pdCkge1xuICAgIHJldHVybiAhKHRpbWVzdGFtcCA8PSB1bml0c1t1bml0XSAqIDIpXG4gICAgICA/IGwxMG5bdW5pdF0ucC5yZXBsYWNlKFwie31cIiwgTWF0aC5mbG9vcih0aW1lc3RhbXAgLyB1bml0c1t1bml0XSkpXG4gICAgICA6IGwxMG5bdW5pdF0ucztcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVBZ28odGltZXN0YW1wKSB7XG4gICAgaWYgKHRpbWVzdGFtcCA8IHVuaXRzLmgpIHtcbiAgICAgIHJldHVybiBnZXRUaW1lQWdvU3RyaW5nKHRpbWVzdGFtcCwgXCJtXCIpO1xuICAgIH1cblxuICAgIGlmICh0aW1lc3RhbXAgPCB1bml0cy5kKSB7XG4gICAgICByZXR1cm4gZ2V0VGltZUFnb1N0cmluZyh0aW1lc3RhbXAsIFwiaFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0VGltZUFnb1N0cmluZyh0aW1lc3RhbXAsIFwiZFwiKTsgLy8gZGVmYXVsdFxuICB9XG5cbiAgcmV0dXJuIHRpbWVBZ28oZGlmZik7XG59XG5cbi8qKlxuICogV3JhcCBlbGVtZW50IHNlbGVjdG9yIGFwaVxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IC0gYSBqUXVlcnkgc3ludGF4IERPTSBxdWVyeSAod2l0aCBkb3RzKVxuICovXG5mdW5jdGlvbiBnZXRFbGVtcyhxdWVyeSkge1xuICB2YXIgaXNEYXRhQXR0ciA9IHF1ZXJ5LmluZGV4T2YoXCJkYXRhLVwiKSA+IC0xO1xuICByZXR1cm4gaXNEYXRhQXR0clxuICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxdWVyeSlcbiAgICA6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUocXVlcnkpO1xufVxuXG4vKipcbiAqIGpRdWVyeSdzICQuZ2V0SlNPTiBpbiBhIG51dHNoZWxsXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gYSByZXF1ZXN0IFVSTFxuICovXG5mdW5jdGlvbiBnZXRKU09OKHVybCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlamVjdCh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgeGhyLnNlbmQoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3QodXJsLCBkYXRhKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ1BPU1QnLCB1cmwpO1xuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAxKSB7XG4gICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWplY3QoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgfSk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldEVsZW1zOiBnZXRFbGVtcyxcbiAgZ2V0SlNPTjogZ2V0SlNPTixcbiAgcG9zdDogcG9zdCxcbiAgY29udmVydFRpbWVzdGFtcDogY29udmVydFRpbWVzdGFtcFxufTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBoYW5kbGVycyA9IHJlcXVpcmUoJy4vaGFuZGxlcnMnKSxcbiAgdmlld21vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWwnKSxcbiAgdmlldyA9IHJlcXVpcmUoJy4vdmlldycpLFxuICBwYWdldmlldyA9IHJlcXVpcmUoJy4vcGFnZXZpZXcnKSxcbiAgbG9jYWxBbmFseXRpY3MgPSByZXF1aXJlKCcuL2xvY2FsLWFuYWx5dGljcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLyoqXG4gICAqIE9uIGRvY3VtZW50IGxvYWRlZCwgZG8gdGhlIGZvbGxvd2luZzpcbiAgICovXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIGhhbmRsZXJzLmJ1dHRvbnMuYXR0YWNoKCk7IC8vIFJlZ2lzdGVyIEJ1dHRvbnMgSGFuZGxlcnNcbiAgICBoYW5kbGVycy5ldmVudHMuYXR0YWNoKCk7IC8vIFJlZ2lzdGVyIEV2ZW50LCBNZXNzYWdlIEhhbmRsZXJzXG4gICAgdmlld21vZGVsLmluaXQoKTtcbiAgICBsb2NhbEFuYWx5dGljcy5oaXQoKTtcbiAgICBwYWdldmlldy5pbml0KCk7XG5cbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB2aWV3LnVwZGF0ZVRpbWVzdGFtcHMoKTsgLy8gQ29udmVydCBJU08gZGF0ZXMgdG8gdGltZWFnb1xuICAgIH0sIDEwMDApO1xuICB9XG59O1xuIiwidmFyIGFwaUhvc3QgPSB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ0xCJykgPyB3aW5kb3cuTEIuYXBpX2hvc3QucmVwbGFjZSgvXFwvJC8sICcnKSA6ICcnO1xudmFyIGNvbnRleHRVcmwgPSBkb2N1bWVudC5yZWZlcnJlcjtcbnZhciBibG9nSWQgPSB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ0xCJykgPyB3aW5kb3cuTEIuYmxvZy5faWQgOiAnJztcblxuYXBpSG9zdCArPSAnL2FwaS9hbmFseXRpY3MvaGl0JztcblxudmFyIGNyZWF0ZUNvb2tpZSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBkYXlzKSB7XG4gIHZhciBleHBpcmVzID0gJycsIGRhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gIGlmIChkYXlzKSB7XG4gICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApO1xuICAgIGV4cGlyZXMgPSBgOyBleHBpcmVzPSR7ZGF0ZS50b1VUQ1N0cmluZygpfWA7XG4gIH1cbiAgZG9jdW1lbnQuY29va2llID0gYCR7bmFtZX09JHt2YWx1ZX0ke2V4cGlyZXN9OyBwYXRoPS9gO1xufTtcblxudmFyIHJlYWRDb29raWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBuYW1lRVEgPSBuYW1lICsgJz0nO1xuICB2YXIgY2EgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGMgPSBjYVtpXTtcblxuICAgIHdoaWxlIChjLmNoYXJBdCgwKSA9PT0gJyAnKSB7XG4gICAgICBjID0gYy5zdWJzdHJpbmcoMSwgYy5sZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChjLmluZGV4T2YobmFtZUVRKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIGMuc3Vic3RyaW5nKG5hbWVFUS5sZW5ndGgsIGMubGVuZ3RoKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG52YXIgaGl0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciB4bWxodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gIHZhciBqc29uRGF0YSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICBjb250ZXh0X3VybDogY29udGV4dFVybCxcbiAgICBibG9nX2lkOiBibG9nSWRcbiAgfSk7XG5cbiAgeG1saHR0cC5vcGVuKCdQT1NUJywgYXBpSG9zdCk7XG4gIHhtbGh0dHAuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblxuICB4bWxodHRwLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh4bWxodHRwLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICBjcmVhdGVDb29raWUoJ2hpdCcsIGpzb25EYXRhLCAyKTtcbiAgICB9XG4gIH07XG5cbiAgeG1saHR0cC5zZW5kKGpzb25EYXRhKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge2hpdDogKCkgPT4ge1xuICBpZiAoIXJlYWRDb29raWUoJ2hpdCcpKSB7XG4gICAgaGl0KCk7XG4gIH1cbn19O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKlxuICBTZW5kIHBhZ2V2aWV3IHNpZ25hbCB0byBhbmFseXRpY3MgcHJvdmlkZXJzXG4gIElWVyBhbmQgR29vZ2xlIEFuYWx5dGljcy4gTm90IHRvIGJlIHRpZWQgdG8gYW5ndWxhciBhcHAuXG4qL1xuXG52YXIgc2VuZFBhZ2V2aWV3ID0ge1xuICBfZm91bmRQcm92aWRlcnM6IFtdLCAvLyBDYWNoZSBhZnRlciBmaXJzdCBsb29rdXBcblxuICBfc2VuZElWVzogZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF3aW5kb3cuaW9tKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGlhbV9kYXRhID0ge1xuICAgICAgXCJzdFwiOiB3aW5kb3cuX2lmcmFtZURhdGFzZXQuc3ptU3QsIC8vIElEXG4gICAgICBcImNwXCI6IHdpbmRvdy5faWZyYW1lRGF0YXNldC5zem1DcCwgLy8gQ29kZVxuICAgICAgXCJjb1wiOiB3aW5kb3cuX2lmcmFtZURhdGFzZXQuc3ptQ28sIC8vIENvbW1lbnRcbiAgICAgIFwic3ZcIjogXCJrZVwiIC8vIERpc2FibGUgUSZBIGludml0ZVxuICAgIH07XG5cbiAgICB3aW5kb3cuaW9tLmMoaWFtX2RhdGEsIDEpOyAvLyB3aGVyZSdzIHRoZSAuaD8gYWhhaGFoYVxuICB9LFxuXG4gIF9zZW5kR0E6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh3aW5kb3cuZ2EubGVuZ3RoID4gMCkge1xuICAgICAgd2luZG93LmdhKCdjcmVhdGUnLCB3aW5kb3cuX2lmcmFtZURhdGFzZXQuZ2FQcm9wZXJ0eSwgJ2F1dG8nKTtcbiAgICAgIHdpbmRvdy5nYSgnc2V0JywgJ2Fub255bWl6ZUlwJywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgaWYgKHdpbmRvdy5nYS5sb2FkZWQpIHtcbiAgICAgIHdpbmRvdy5nYSgnc2VuZCcsIHtcbiAgICAgICAgaGl0VHlwZTogJ3BhZ2V2aWV3JyxcbiAgICAgICAgbG9jYXRpb246IHdpbmRvdy5kb2N1bWVudC5yZWZlcnJlciwgLy8gc2V0IHRvIHBhcmVudCB1cmxcbiAgICAgICAgaGl0Q2FsbGJhY2s6IGZ1bmN0aW9uKCkge31cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBfaW5zZXJ0U2NyaXB0OiBmdW5jdGlvbihzcmMsIGNiKSB7XG4gICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpOyBzY3JpcHQuc3JjID0gc3JjO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYm9keVwiKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgIHNjcmlwdC5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBjYik7XG4gIH0sXG5cbiAgX2dldFByb3ZpZGVyczogZnVuY3Rpb24oKSB7XG4gICAgbGV0IGZvdW5kUHJvdmlkZXJzID0gW107XG5cbiAgICBpZiAodGhpcy5fZm91bmRQcm92aWRlcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZm91bmRQcm92aWRlcnM7IC8vIHJldHVybiBlYXJseVxuICAgIH1cblxuICAgIGZvciAodmFyIHAgaW4gdGhpcy5fcHJvdmlkZXJzKSB7XG4gICAgICB2YXIgcHJvdmlkZXIgPSB0aGlzLl9wcm92aWRlcnNbcF07XG4gICAgICB2YXIga2V5c2ZvdW5kID0gcHJvdmlkZXIucmVxdWlyZWREYXRhLnJlZHVjZSgocHJldiwgY3VycikgPT5cbiAgICAgICAgd2luZG93Ll9pZnJhbWVEYXRhc2V0Lmhhc093blByb3BlcnR5KGN1cnIpXG4gICAgICAsIHRydWUpOyAvLyBuZWVkcyBpbml0aWFsIHZhbHVlIGZvciBvbmUgZWxlbWVudFxuXG4gICAgICBpZiAoa2V5c2ZvdW5kID09PSB0cnVlKSB7IC8vIGFsbCByZXF1aXJlZCBhdHRycyBmb3VuZFxuICAgICAgICBpZiAoIXByb3ZpZGVyLm9iamVjdCkge1xuICAgICAgICAgIHRoaXMuX2luc2VydFNjcmlwdChwcm92aWRlci5zY3JpcHRVUkwsIHByb3ZpZGVyLnNlbmQpOyAvLyBub3QgeWV0IGxvYWRlZFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvdW5kUHJvdmlkZXJzLnB1c2gocHJvdmlkZXIuc2VuZCk7IC8vIGxpc3Qgb2YgX3NlbmQgZnVuY3NcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHBhcmVudC5fZm91bmRQcm92aWRlcnMgPSBmb3VuZFByb3ZpZGVyczsgLy8gY2FjaGUgYWZ0ZXIgaW5pdGlhbFxuICAgIHJldHVybiBmb3VuZFByb3ZpZGVycztcbiAgfSxcblxuICBzZW5kOiBmdW5jdGlvbigpIHsgLy8gcHVibGljLCBpbnZva2Ugdy9vIHBhcmFtc1xuICAgIGlmICghd2luZG93Lmhhc093blByb3BlcnR5KCdfaWZyYW1lRGF0YXNldCcpKSB7XG4gICAgICByZXR1cm47IC8vIHJldHVybiBlYXJseVxuICAgIH1cblxuICAgIHZhciBwcm92aWRlcnMgPSB0aGlzLl9nZXRQcm92aWRlcnMoKTsgLy8gaXMgY2FjaGVkIG9uIGZpcnN0IGNhbGxcblxuICAgIGZvciAodmFyIGkgPSBwcm92aWRlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHByb3ZpZGVyc1tpXSgpOyAvLyBfc2VuZCBmdW5jdGlvbiBjYWxsc1xuICAgIH1cbiAgfSxcblxuICByZWNlaXZlTWVzc2FnZTogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmRhdGEudHlwZSA9PT0gJ2FuYWx5dGljcycpIHtcbiAgICAgIHZhciBwYXlsb2FkID0gSlNPTi5wYXJzZShlLmRhdGEucGF5bG9hZCk7XG5cbiAgICAgIHdpbmRvdy5faWZyYW1lRGF0YXNldCA9IHBheWxvYWQ7IC8vIHN0b3JlIGRhdGFzZXQgZnJvbSBwYXJlbnROb2RlXG4gICAgfVxuICB9LFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh3aW5kb3cuTEIuc2V0dGluZ3MuZ2FDb2RlID09PSAnJykge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLnJlY2VpdmVNZXNzYWdlLCBmYWxzZSk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2VuZHBhZ2V2aWV3JywgdGhpcy5zZW5kLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93Ll9pZnJhbWVEYXRhc2V0ID0ge2dhUHJvcGVydHk6IHdpbmRvdy5MQi5zZXR0aW5ncy5nYUNvZGV9O1xuICAgICAgdGhpcy5zZW5kID0gdGhpcy5zZW5kLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLnNlbmQoKTtcbiAgICB9XG4gIH1cbn07XG5cbnNlbmRQYWdldmlldy5fcHJvdmlkZXJzID0ge1xuICBpdnc6IHtcbiAgICBzZW5kOiBzZW5kUGFnZXZpZXcuX3NlbmRJVlcsXG4gICAgcmVxdWlyZWREYXRhOiBbJ3N6bVN0JywgJ3N6bUNwJywgJ3N6bUNvJ10sXG4gICAgc2NyaXB0VVJMOiAnaHR0cHM6Ly9zY3JpcHQuaW9hbS5kZS9pYW0uanMnLFxuICAgIG9iamVjdDogd2luZG93Lmhhc093blByb3BlcnR5KCdpb20nKSA/IHdpbmRvdy5pb20gOiBudWxsXG4gIH0sXG5cbiAgZ2E6IHtcbiAgICBzZW5kOiBzZW5kUGFnZXZpZXcuX3NlbmRHQSxcbiAgICByZXF1aXJlZERhdGE6IFsnZ2FQcm9wZXJ0eSddLFxuICAgIHNjcmlwdFVSTDogJ2h0dHBzOi8vd3d3Lmdvb2dsZS1hbmFseXRpY3MuY29tL2FuYWx5dGljcy5qcycsXG4gICAgb2JqZWN0OiB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ2dhJykgPyB3aW5kb3cuZ2EgOiBudWxsXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2VuZFBhZ2V2aWV3O1xuIiwiY29uc3QgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcblxuY2xhc3MgU2xpZGVzaG93IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5zdGFydCA9IHRoaXMuc3RhcnQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnN0b3AgPSB0aGlzLnN0b3AuYmluZCh0aGlzKTtcbiAgICB0aGlzLmtleWJvYXJkTGlzdGVuZXIgPSB0aGlzLmtleWJvYXJkTGlzdGVuZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNldEZvY3VzID0gdGhpcy5zZXRGb2N1cy5iaW5kKHRoaXMpO1xuICAgIHRoaXMubGF1bmNoSW50b0Z1bGxzY3JlZW4gPSB0aGlzLmxhdW5jaEludG9GdWxsc2NyZWVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vblJlc2l6ZSA9IHRoaXMub25SZXNpemUuYmluZCh0aGlzKTtcbiAgICB0aGlzLmV4aXRGdWxsc2NyZWVuID0gdGhpcy5leGl0RnVsbHNjcmVlbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMudG9nZ2xlRnVsbHNjcmVlbiA9IHRoaXMudG9nZ2xlRnVsbHNjcmVlbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcnMgPSB0aGlzLmFkZEV2ZW50TGlzdGVuZXJzLmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVycyA9IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMuYmluZCh0aGlzKTtcbiAgICB0aGlzLnRvdWNoU3RhcnQgPSB0aGlzLnRvdWNoU3RhcnQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnRvdWNoTW92ZSA9IHRoaXMudG91Y2hNb3ZlLmJpbmQodGhpcyk7XG4gIH1cblxuICBzdGFydChlKSB7XG4gICAgbGV0IGl0ZW1zID0gW107XG5cbiAgICB0aGlzLml0ZXJhdGlvbnMgPSAwO1xuICAgIHRoaXMuaXNGdWxsc2NyZWVuID0gZmFsc2U7XG4gICAgdGhpcy54RG93biA9IG51bGw7XG4gICAgdGhpcy55RG93biA9IG51bGw7XG5cbiAgICBlLnRhcmdldFxuICAgICAgLmNsb3Nlc3QoJ2FydGljbGUuc2xpZGVzaG93JylcbiAgICAgIC5xdWVyeVNlbGVjdG9yQWxsKCcubGItaXRlbSBpbWcnKVxuICAgICAgLmZvckVhY2goKGltZykgPT4ge1xuICAgICAgICBsZXQgbWF0Y2hlcyA9IFtdO1xuXG4gICAgICAgIGltZy5nZXRBdHRyaWJ1dGUoJ3NyY3NldCcpLnJlcGxhY2UoLyhcXFMrKVxcc1xcZCt3L2csIChzLCBtYXRjaCkgPT4ge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChtYXRjaCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBbYmFzZUltYWdlLCB0aHVtYm5haWwsIHZpZXdJbWFnZV0gPSBtYXRjaGVzO1xuXG4gICAgICAgIGl0ZW1zLnB1c2goe1xuICAgICAgICAgIGl0ZW06IHtcbiAgICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgICAgbWVkaWE6IHtyZW5kaXRpb25zOiB7XG4gICAgICAgICAgICAgICAgYmFzZUltYWdlOiB7aHJlZjogYmFzZUltYWdlfSxcbiAgICAgICAgICAgICAgICB0aHVtYm5haWw6IHtocmVmOiB0aHVtYm5haWx9LFxuICAgICAgICAgICAgICAgIHZpZXdJbWFnZToge2hyZWY6IHZpZXdJbWFnZX1cbiAgICAgICAgICAgICAgfX0sXG4gICAgICAgICAgICAgIGNhcHRpb246IGltZy5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4uY2FwdGlvbicpLnRleHRDb250ZW50LFxuICAgICAgICAgICAgICBjcmVkaXQ6IGltZy5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4uY3JlZGl0JykudGV4dENvbnRlbnQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWN0aXZlOiB0aHVtYm5haWwgPT09IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnc3JjJylcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBsZXQgc2xpZGVzaG93ID0gdGVtcGxhdGVzLnNsaWRlc2hvdyh7XG4gICAgICByZWZzOiBpdGVtc1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2LmxiLXRpbWVsaW5lJylcbiAgICAgIC5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyZW5kJywgc2xpZGVzaG93KTtcblxuICAgIGlmICh3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcCkge1xuICAgICAgd2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSgnZnVsbHNjcmVlbicsIHdpbmRvdy5kb2N1bWVudC5yZWZlcnJlcik7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRGb2N1cygpO1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgdGhpcy5leGl0RnVsbHNjcmVlbigpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JykucmVtb3ZlKCk7XG4gIH1cblxuICBvblJlc2l6ZSgpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IC5jb250YWluZXInKTtcbiAgICBsZXQgb2Zmc2V0ID0gY29udGFpbmVyLm9mZnNldEhlaWdodCAqIHRoaXMuaXRlcmF0aW9ucztcblxuICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7b2Zmc2V0fXB4YDtcbiAgfVxuXG4gIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlib2FyZExpc3RlbmVyKTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyBidXR0b24uZnVsbHNjcmVlbicpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4pO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5hcnJvd3MubmV4dCcpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmtleWJvYXJkTGlzdGVuZXIoe2tleUNvZGU6IDM5fSkpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5hcnJvd3MucHJldicpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmtleWJvYXJkTGlzdGVuZXIoe2tleUNvZGU6IDM3fSkpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5jbG9zZScpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnN0b3ApO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JylcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy50b3VjaFN0YXJ0KTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdycpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy50b3VjaE1vdmUpO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25SZXNpemUpO1xuICB9XG5cbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWJvYXJkTGlzdGVuZXIpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5mdWxsc2NyZWVuJylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlRnVsbHNjcmVlbik7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmFycm93cy5uZXh0JylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzl9KSk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmFycm93cy5wcmV2JylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzd9KSk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmNsb3NlJylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuc3RvcCk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cnKVxuICAgICAgLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLnRvdWNoU3RhcnQpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLnRvdWNoTW92ZSk7XG5cbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5vblJlc2l6ZSk7XG4gIH1cblxuICB0b3VjaFN0YXJ0KGUpIHtcbiAgICB0aGlzLnhEb3duID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgdGhpcy55RG93biA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuICB9XG5cbiAgdG91Y2hNb3ZlKGUpIHtcbiAgICBpZiAoIXRoaXMueERvd24gfHwgIXRoaXMueURvd24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgeFVwID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgdmFyIHlVcCA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuXG4gICAgdmFyIHhEaWZmID0gdGhpcy54RG93biAtIHhVcDtcbiAgICB2YXIgeURpZmYgPSB0aGlzLnlEb3duIC0geVVwO1xuXG4gICAgaWYgKE1hdGguYWJzKHhEaWZmKSA+IE1hdGguYWJzKHlEaWZmKSAmJiB4RGlmZiA+IDApIHtcbiAgICAgIC8vIExlZnQgc3dpcGVcbiAgICAgIHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzl9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmlnaHQgc3dpcGVcbiAgICAgIHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzd9KTtcbiAgICB9XG5cbiAgICB0aGlzLnhEb3duID0gbnVsbDtcbiAgICB0aGlzLnlEb3duID0gbnVsbDtcbiAgfVxuXG4gIHRvZ2dsZUZ1bGxzY3JlZW4oKSB7XG4gICAgaWYgKCF0aGlzLmlzRnVsbHNjcmVlbikge1xuICAgICAgdGhpcy5sYXVuY2hJbnRvRnVsbHNjcmVlbihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2xpZGVzaG93JykpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgfVxuICB9XG5cbiAgbGF1bmNoSW50b0Z1bGxzY3JlZW4oZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgICBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICAgIGVsZW1lbnQubXNSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgIH1cblxuICAgIHRoaXMuaXNGdWxsc2NyZWVuID0gdHJ1ZTtcbiAgfVxuXG4gIGV4aXRGdWxsc2NyZWVuKCkge1xuICAgIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICAgIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKSB7XG4gICAgICBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xuICAgIH1cblxuICAgIHRoaXMuaXNGdWxsc2NyZWVuID0gZmFsc2U7XG4gIH1cblxuICBzZXRGb2N1cygpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IC5jb250YWluZXInKTtcblxuICAgIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKS5mb3JFYWNoKChpbWcsIGkpID0+IHtcbiAgICAgIGlmIChpbWcuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSkge1xuICAgICAgICB0aGlzLml0ZXJhdGlvbnMgPSBpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuaXRlcmF0aW9ucyA+IDApIHtcbiAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7Y29udGFpbmVyLm9mZnNldEhlaWdodCAqIHRoaXMuaXRlcmF0aW9uc31weGA7XG4gICAgfVxuICB9XG5cbiAga2V5Ym9hcmRMaXN0ZW5lcihlKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyAuY29udGFpbmVyJyk7XG4gICAgY29uc3QgcGljdHVyZXNDb3VudCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKS5sZW5ndGg7XG4gICAgbGV0IG9mZnNldCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgKiB0aGlzLml0ZXJhdGlvbnM7XG5cbiAgICBzd2l0Y2ggKGUua2V5Q29kZSkge1xuICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBpZiAob2Zmc2V0ICsgY29udGFpbmVyLm9mZnNldEhlaWdodCA8IHBpY3R1cmVzQ291bnQgKiBjb250YWluZXIub2Zmc2V0SGVpZ2h0KSB7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7b2Zmc2V0ICsgY29udGFpbmVyLm9mZnNldEhlaWdodH1weGA7XG4gICAgICAgIHRoaXMuaXRlcmF0aW9ucysrO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBpZiAob2Zmc2V0IC0gY29udGFpbmVyLm9mZnNldEhlaWdodCA+PSAwKSB7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7b2Zmc2V0IC0gY29udGFpbmVyLm9mZnNldEhlaWdodH1weGA7XG4gICAgICAgIHRoaXMuaXRlcmF0aW9ucy0tO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICBjYXNlIDI3OiAvLyBlc2NcbiAgICAgIHRoaXMuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgIHRoaXMuc3RvcCgpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNsaWRlc2hvdztcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBudW5qdWNrcyA9IHJlcXVpcmUoXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIik7XG5jb25zdCBzZXR0aW5ncyA9IHdpbmRvdy5MQi5zZXR0aW5ncztcblxuY29uc3QgZGVmYXVsdFRlbXBsYXRlcyA9IHtcbiAgcG9zdDogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1wb3N0Lmh0bWxcIiksXG4gIHRpbWVsaW5lOiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiksXG4gIGl0ZW1JbWFnZTogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiksXG4gIGl0ZW1FbWJlZDogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIiksXG4gIHNsaWRlc2hvdzogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbFwiKVxufTtcblxuZnVuY3Rpb24gZ2V0Q3VzdG9tVGVtcGxhdGVzKCkge1xuICBsZXQgY3VzdG9tVGVtcGxhdGVzID0gc2V0dGluZ3MuY3VzdG9tVGVtcGxhdGVzXG4gICAgLCBtZXJnZWRUZW1wbGF0ZXMgPSBkZWZhdWx0VGVtcGxhdGVzO1xuXG4gIGZvciAobGV0IHRlbXBsYXRlIGluIGN1c3RvbVRlbXBsYXRlcykge1xuICAgIGxldCBjdXN0b21UZW1wbGF0ZU5hbWUgPSBjdXN0b21UZW1wbGF0ZXNbdGVtcGxhdGVdO1xuICAgIGRlZmF1bHRUZW1wbGF0ZXNbdGVtcGxhdGVdID0gKGN0eCwgY2IpID0+IHtcbiAgICAgIG51bmp1Y2tzLnJlbmRlcihjdXN0b21UZW1wbGF0ZU5hbWUsIGN0eCwgY2IpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gbWVyZ2VkVGVtcGxhdGVzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldHRpbmdzLmN1c3RvbVRlbXBsYXRlc1xuICA/IGdldEN1c3RvbVRlbXBsYXRlcygpXG4gIDogZGVmYXVsdFRlbXBsYXRlcztcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xudmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJyk7XG52YXIgU2xpZGVzaG93ID0gcmVxdWlyZSgnLi9zbGlkZXNob3cnKTtcblxudmFyIHRpbWVsaW5lRWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIubGItcG9zdHMubm9ybWFsXCIpXG4gICwgbG9hZE1vcmVQb3N0c0J1dHRvbiA9IGhlbHBlcnMuZ2V0RWxlbXMoXCJsb2FkLW1vcmUtcG9zdHNcIik7XG5cbi8qKlxuICogUmVwbGFjZSB0aGUgY3VycmVudCB0aW1lbGluZSB1bmNvbmRpdGlvbmFsbHkuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBhcGlfcmVzcG9uc2Ug4oCTIGNvbnRhaW5zIHJlcXVlc3Qgb3B0cy5cbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSByZXF1ZXN0T3B0cyAtIEFQSSByZXF1ZXN0IHBhcmFtcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyVGltZWxpbmUoYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciByZW5kZXJlZFBvc3RzID0gW107XG5cbiAgYXBpX3Jlc3BvbnNlLl9pdGVtcy5mb3JFYWNoKChwb3N0KSA9PiB7XG4gICAgcmVuZGVyZWRQb3N0cy5wdXNoKHRlbXBsYXRlcy5wb3N0KHtcbiAgICAgIGl0ZW06IHBvc3QsXG4gICAgICBzZXR0aW5nczogd2luZG93LkxCLnNldHRpbmdzXG4gICAgfSkpO1xuICB9KTtcblxuICB0aW1lbGluZUVsZW1bMF0uaW5uZXJIVE1MID0gcmVuZGVyZWRQb3N0cy5qb2luKFwiXCIpO1xuICBsb2FkRW1iZWRzKCk7XG4gIGF0dGFjaFNsaWRlc2hvdygpO1xufVxuXG4vKipcbiAqIFJlbmRlciBwb3N0cyBjdXJyZW50bHkgaW4gcGlwZWxpbmUgdG8gdGVtcGxhdGUuXG4gKiBUbyByZWR1Y2UgRE9NIGNhbGxzL3BhaW50cyB3ZSBoYW5kIG9mZiByZW5kZXJlZCBIVE1MIGluIGJ1bGsuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBhcGlfcmVzcG9uc2Ug4oCTIGNvbnRhaW5zIHJlcXVlc3Qgb3B0cy5cbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSByZXF1ZXN0T3B0cyAtIEFQSSByZXF1ZXN0IHBhcmFtcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyUG9zdHMoYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciByZW5kZXJlZFBvc3RzID0gW10gLy8gdGVtcG9yYXJ5IHN0b3JlXG4gICAgLCBwb3N0cyA9IGFwaV9yZXNwb25zZS5faXRlbXM7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb3N0cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBwb3N0ID0gcG9zdHNbaV07XG5cbiAgICBpZiAocG9zdHMub3BlcmF0aW9uID09PSBcImRlbGV0ZVwiKSB7XG4gICAgICBkZWxldGVQb3N0KHBvc3QuX2lkKTtcbiAgICAgIHJldHVybjsgLy8gZWFybHlcbiAgICB9XG5cbiAgICB2YXIgcmVuZGVyZWRQb3N0ID0gdGVtcGxhdGVzLnBvc3Qoe1xuICAgICAgaXRlbTogcG9zdCxcbiAgICAgIHNldHRpbmdzOiB3aW5kb3cuTEIuc2V0dGluZ3NcbiAgICB9KTtcblxuICAgIGlmIChwb3N0cy5vcGVyYXRpb24gPT09IFwidXBkYXRlXCIpIHtcbiAgICAgIHVwZGF0ZVBvc3QocmVuZGVyZWRQb3N0KTtcbiAgICAgIHJldHVybjsgLy8gZWFybHlcbiAgICB9XG5cbiAgICByZW5kZXJlZFBvc3RzLnB1c2gocmVuZGVyZWRQb3N0KTsgLy8gY3JlYXRlIG9wZXJhdGlvblxuICB9XG5cbiAgaWYgKCFyZW5kZXJlZFBvc3RzLmxlbmd0aCkge1xuICAgIHJldHVybjsgLy8gZWFybHlcbiAgfVxuICBcbiAgcmVuZGVyZWRQb3N0cy5yZXZlcnNlKCk7XG5cbiAgYWRkUG9zdHMocmVuZGVyZWRQb3N0cywgeyAvLyBpZiBjcmVhdGVzXG4gICAgcG9zaXRpb246IGFwaV9yZXNwb25zZS5yZXF1ZXN0T3B0cy5mcm9tRGF0ZSA/IFwidG9wXCIgOiBcImJvdHRvbVwiXG4gIH0pO1xuXG4gIGxvYWRFbWJlZHMoKTtcbn1cblxuLyoqXG4gKiBBZGQgcG9zdCBub2RlcyB0byBET00sIGRvIHNvIHJlZ2FyZGxlc3Mgb2Ygc2V0dGluZ3MuYXV0b0FwcGx5VXBkYXRlcyxcbiAqIGJ1dCByYXRoZXIgc2V0IHRoZW0gdG8gTk9UIEJFIERJU1BMQVlFRCBpZiBhdXRvLWFwcGx5IGlzIGZhbHNlLlxuICogVGhpcyB3YXkgd2UgZG9uJ3QgaGF2ZSB0byBtZXNzIHdpdGggdHdvIHN0YWNrcyBvZiBwb3N0cy5cbiAqIEBwYXJhbSB7YXJyYXl9IHBvc3RzIC0gYW4gYXJyYXkgb2YgTGl2ZWJsb2cgcG9zdCBpdGVtc1xuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBrZXl3b3JkIGFyZ3NcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLnBvc2l0aW9uIC0gdG9wIG9yIGJvdHRvbVxuICovXG5mdW5jdGlvbiBhZGRQb3N0cyhwb3N0cywgb3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgb3B0cy5wb3NpdGlvbiA9IG9wdHMucG9zaXRpb24gfHwgXCJib3R0b21cIjtcblxuICB2YXIgcG9zdHNIVE1MID0gXCJcIlxuICAgICwgcG9zaXRpb24gPSBvcHRzLnBvc2l0aW9uID09PSBcInRvcFwiXG4gICAgICAgID8gXCJhZnRlcmJlZ2luXCIgLy8gaW5zZXJ0QWRqYWNlbnRIVE1MIEFQSSA9PiBhZnRlciBzdGFydCBvZiBub2RlXG4gICAgICAgIDogXCJiZWZvcmVlbmRcIjsgLy8gaW5zZXJ0QWRqYWNlbnRIVE1MIEFQSSA9PiBiZWZvcmUgZW5kIG9mIG5vZGVcblxuICBmb3IgKHZhciBpID0gcG9zdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBwb3N0c0hUTUwgKz0gcG9zdHNbaV07XG4gIH1cblxuICB0aW1lbGluZUVsZW1bMF0uaW5zZXJ0QWRqYWNlbnRIVE1MKHBvc2l0aW9uLCBwb3N0c0hUTUwpO1xuICBhdHRhY2hTbGlkZXNob3coKTtcbn1cblxuLyoqXG4gKiBEZWxldGUgcG9zdCA8YXJ0aWNsZT4gRE9NIG5vZGUgYnkgZGF0YSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gLSBhIHBvc3QgVVJOXG4gKi9cbmZ1bmN0aW9uIGRlbGV0ZVBvc3QocG9zdElkKSB7XG4gIHZhciBlbGVtID0gaGVscGVycy5nZXRFbGVtcygnZGF0YS1qcy1wb3N0LWlkPVxcXCInICsgcG9zdElkICsgJ1xcXCInKTtcbiAgZWxlbVswXS5yZW1vdmUoKTtcbn1cblxuLyoqXG4gKiBEZWxldGUgcG9zdCA8YXJ0aWNsZT4gRE9NIG5vZGUgYnkgZGF0YSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gLSBhIHBvc3QgVVJOXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVBvc3QocG9zdElkLCByZW5kZXJlZFBvc3QpIHtcbiAgdmFyIGVsZW0gPSBoZWxwZXJzLmdldEVsZW1zKCdkYXRhLWpzLXBvc3QtaWQ9XFxcIicgKyBwb3N0SWQgKyAnXFxcIicpO1xuICBlbGVtWzBdLmlubmVySFRNTCA9IHJlbmRlcmVkUG9zdDtcbn1cblxuLyoqXG4gKiBTaG93IG5ldyBwb3N0cyBsb2FkZWQgdmlhIFhIUlxuICovXG5mdW5jdGlvbiBkaXNwbGF5TmV3UG9zdHMoKSB7XG4gIHZhciBuZXdQb3N0cyA9IGhlbHBlcnMuZ2V0RWxlbXMoXCJsYi1wb3N0LW5ld1wiKTtcbiAgZm9yICh2YXIgaSA9IG5ld1Bvc3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbmV3UG9zdHNbaV0uY2xhc3NMaXN0LnJlbW92ZShcImxiLXBvc3QtbmV3XCIpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlciBlbWJlZCBwcm92aWRlciB1bnBhY2tpbmdcbiAqIFRvZG86IE1ha2UgcmVxdWlyZWQgc2NyaXB0cyBhdmFpbGFibGUgb24gc3Vic2VxdWVudCBsb2Fkc1xuICovXG5mdW5jdGlvbiBsb2FkRW1iZWRzKCkge1xuICBpZiAod2luZG93Lmluc3Rncm0pIHtcbiAgICBpbnN0Z3JtLkVtYmVkcy5wcm9jZXNzKCk7XG4gIH1cblxuICBpZiAod2luZG93LnR3dHRyKSB7XG4gICAgdHd0dHIud2lkZ2V0cy5sb2FkKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9nZ2xlQ29tbWVudERpYWxvZygpIHtcbiAgbGV0IGNvbW1lbnRGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9ybS5jb21tZW50Jyk7XG4gIGxldCBpc0hpZGRlbiA9IGZhbHNlO1xuXG4gIGlmIChjb21tZW50Rm9ybSkge1xuICAgIGlzSGlkZGVuID0gY29tbWVudEZvcm0uY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZScpO1xuICB9XG5cbiAgcmV0dXJuICFpc0hpZGRlbjtcbn1cblxuLyoqXG4gKiBTZXQgc29ydGluZyBvcmRlciBidXR0b24gb2YgY2xhc3MgQG5hbWUgdG8gYWN0aXZlLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBsaXZlYmxvZyBBUEkgcmVzcG9uc2UgSlNPTi5cbiAqL1xuZnVuY3Rpb24gdG9nZ2xlU29ydEJ0bihuYW1lKSB7XG4gIHZhciBzb3J0aW5nQnRucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5zb3J0aW5nLWJhcl9fb3JkZXInKTtcblxuICBzb3J0aW5nQnRucy5mb3JFYWNoKChlbCkgPT4ge1xuICAgIHZhciBzaG91bGRCZUFjdGl2ZSA9IGVsLmRhdGFzZXQuaGFzT3duUHJvcGVydHkoXCJqc09yZGVyYnlfXCIgKyBuYW1lKTtcblxuICAgIGVsLmNsYXNzTGlzdC50b2dnbGUoJ3NvcnRpbmctYmFyX19vcmRlci0tYWN0aXZlJywgc2hvdWxkQmVBY3RpdmUpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBDb25kaXRpb25hbGx5IGhpZGUgbG9hZC1tb3JlLXBvc3RzIGJ1dHRvbi5cbiAqIEBwYXJhbSB7Ym9vbH0gc2hvdWxkVG9nZ2xlIC0gdHJ1ZSA9PiBoaWRlXG4gKi9cbmZ1bmN0aW9uIGhpZGVMb2FkTW9yZShzaG91bGRIaWRlKSB7XG4gIGlmIChsb2FkTW9yZVBvc3RzQnV0dG9uLmxlbmd0aCA+IDApIHtcbiAgICBsb2FkTW9yZVBvc3RzQnV0dG9uWzBdLmNsYXNzTGlzdC50b2dnbGUoXG4gICAgICBcIm1vZC0taGlkZVwiLCBzaG91bGRIaWRlKTtcbiAgfVxufVxuXG4vKipcbiAqIERlbGV0ZSBwb3N0IDxhcnRpY2xlPiBET00gbm9kZSBieSBkYXRhIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAtIGEgcG9zdCBVUk5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlVGltZXN0YW1wcygpIHtcbiAgdmFyIGRhdGVFbGVtcyA9IGhlbHBlcnMuZ2V0RWxlbXMoXCJsYi1wb3N0LWRhdGVcIik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0ZUVsZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGVsZW0gPSBkYXRlRWxlbXNbaV1cbiAgICAgICwgdGltZXN0YW1wID0gZWxlbS5kYXRhc2V0LmpzVGltZXN0YW1wO1xuICAgIGVsZW0udGV4dENvbnRlbnQgPSBoZWxwZXJzLmNvbnZlcnRUaW1lc3RhbXAodGltZXN0YW1wKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gc2hvd1N1Y2Nlc3NDb21tZW50TXNnKCkge1xuICBsZXQgY29tbWVudFNlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXYuY29tbWVudC1zZW50Jyk7XG5cbiAgY29tbWVudFNlbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZScpO1xuXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGNvbW1lbnRTZW50LmNsYXNzTGlzdC50b2dnbGUoJ2hpZGUnKTtcbiAgfSwgNTAwMCk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyQ29tbWVudEZvcm1FcnJvcnMoKSB7XG4gIGxldCBlcnJvcnNNc2dzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgncC5lcnItbXNnJyk7XG5cbiAgaWYgKGVycm9yc01zZ3MpIHtcbiAgICBlcnJvcnNNc2dzLmZvckVhY2goKGVycm9yc01zZykgPT4gZXJyb3JzTXNnLnJlbW92ZSgpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkaXNwbGF5Q29tbWVudEZvcm1FcnJvcnMoZXJyb3JzKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGVycm9ycykpIHtcbiAgICBlcnJvcnMuZm9yRWFjaCgoZXJyb3IpID0+IHtcbiAgICAgIGxldCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlcnJvci5pZCk7XG5cbiAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQuaW5zZXJ0QWRqYWNlbnRIVE1MKFxuICAgICAgICAgICdhZnRlcmVuZCcsXG4gICAgICAgICAgYDxwIGNsYXNzPVwiZXJyLW1zZ1wiPiR7ZXJyb3IubXNnfTwvcD5gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXR0YWNoU2xpZGVzaG93KCkge1xuICBjb25zdCBzbGlkZXNob3cgPSBuZXcgU2xpZGVzaG93KCk7XG4gIGNvbnN0IHNsaWRlc2hvd0ltYWdlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2FydGljbGUuc2xpZGVzaG93IGltZycpO1xuXG4gIGlmIChzbGlkZXNob3dJbWFnZXMpIHtcbiAgICBzbGlkZXNob3dJbWFnZXMuZm9yRWFjaCgoaW1hZ2UpID0+IHtcbiAgICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2xpZGVzaG93LnN0YXJ0KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkUG9zdHM6IGFkZFBvc3RzLFxuICBkZWxldGVQb3N0OiBkZWxldGVQb3N0LFxuICBkaXNwbGF5TmV3UG9zdHM6IGRpc3BsYXlOZXdQb3N0cyxcbiAgcmVuZGVyVGltZWxpbmU6IHJlbmRlclRpbWVsaW5lLFxuICByZW5kZXJQb3N0czogcmVuZGVyUG9zdHMsXG4gIHVwZGF0ZVBvc3Q6IHVwZGF0ZVBvc3QsXG4gIHVwZGF0ZVRpbWVzdGFtcHM6IHVwZGF0ZVRpbWVzdGFtcHMsXG4gIGhpZGVMb2FkTW9yZTogaGlkZUxvYWRNb3JlLFxuICB0b2dnbGVTb3J0QnRuOiB0b2dnbGVTb3J0QnRuLFxuICB0b2dnbGVDb21tZW50RGlhbG9nOiB0b2dnbGVDb21tZW50RGlhbG9nLFxuICBzaG93U3VjY2Vzc0NvbW1lbnRNc2c6IHNob3dTdWNjZXNzQ29tbWVudE1zZyxcbiAgZGlzcGxheUNvbW1lbnRGb3JtRXJyb3JzOiBkaXNwbGF5Q29tbWVudEZvcm1FcnJvcnMsXG4gIGNsZWFyQ29tbWVudEZvcm1FcnJvcnM6IGNsZWFyQ29tbWVudEZvcm1FcnJvcnMsXG4gIGF0dGFjaFNsaWRlc2hvdzogYXR0YWNoU2xpZGVzaG93XG59O1xuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJylcbiAgLCB2aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IGNvbW1lbnRJdGVtRW5kcG9pbnQgPSBgJHtMQi5hcGlfaG9zdH1hcGkvY2xpZW50X2l0ZW1zYDtcbmNvbnN0IGNvbW1lbnRQb3N0RW5kcG9pbnQgPSBgJHtMQi5hcGlfaG9zdH1hcGkvY2xpZW50X2NvbW1lbnRzYDtcblxudmFyIGVuZHBvaW50ID0gTEIuYXBpX2hvc3QgKyBcIi9hcGkvY2xpZW50X2Jsb2dzL1wiICsgTEIuYmxvZy5faWQgKyBcIi9wb3N0c1wiXG4gICwgc2V0dGluZ3MgPSBMQi5zZXR0aW5nc1xuICAsIHZtID0ge307XG5cbi8qKlxuICogR2V0IGluaXRpYWwgb3IgcmVzZXQgdmlld21vZGVsLlxuICogQHJldHVybnMge29iamVjdH0gZW1wdHkgdmlld21vZGVsIHN0b3JlLlxuICovXG5mdW5jdGlvbiBnZXRFbXB0eVZtKGl0ZW1zKSB7XG4gIHJldHVybiB7XG4gICAgX2l0ZW1zOiBuZXcgQXJyYXkoaXRlbXMpIHx8IDAsXG4gICAgY3VycmVudFBhZ2U6IDEsXG4gICAgdG90YWxQb3N0czogMFxuICB9O1xufVxuXG52bS5zZW5kQ29tbWVudCA9IChuYW1lLCBjb21tZW50KSA9PiB7XG4gIGxldCBlcnJvcnMgPSBbXTtcblxuICBpZiAoIW5hbWUpIHtcbiAgICBlcnJvcnMucHVzaCh7aWQ6ICcjY29tbWVudC1uYW1lJywgbXNnOiAnTWlzc2luZyBuYW1lJ30pO1xuICB9XG5cbiAgaWYgKCFjb21tZW50KSB7XG4gICAgZXJyb3JzLnB1c2goe2lkOiAnI2NvbW1lbnQtY29udGVudCcsIG1zZzogJ01pc3NpbmcgY29udGVudCd9KTtcbiAgfVxuXG4gIGlmIChlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiByZWplY3QoZXJyb3JzKSk7XG4gIH1cblxuICByZXR1cm4gaGVscGVyc1xuICAgIC5wb3N0KGNvbW1lbnRJdGVtRW5kcG9pbnQsIHtcbiAgICAgIGl0ZW1fdHlwZTogXCJjb21tZW50XCIsXG4gICAgICBjbGllbnRfYmxvZzogTEIuYmxvZy5faWQsXG4gICAgICBjb21tZW50ZXI6IG5hbWUsXG4gICAgICB0ZXh0OiBjb21tZW50XG4gICAgfSlcbiAgICAudGhlbigoaXRlbSkgPT4gaGVscGVycy5wb3N0KGNvbW1lbnRQb3N0RW5kcG9pbnQsIHtcbiAgICAgIHBvc3Rfc3RhdHVzOiBcImNvbW1lbnRcIixcbiAgICAgIGNsaWVudF9ibG9nOiBMQi5ibG9nLl9pZCxcbiAgICAgIGdyb3VwczogW3tcbiAgICAgICAgaWQ6IFwicm9vdFwiLFxuICAgICAgICByZWZzOiBbe2lkUmVmOiBcIm1haW5cIn1dLFxuICAgICAgICByb2xlOiBcImdycFJvbGU6TkVQXCJcbiAgICAgIH0se1xuICAgICAgICBpZDogXCJtYWluXCIsXG4gICAgICAgIHJlZnM6IFt7cmVzaWRSZWY6IGl0ZW0uX2lkfV0sXG4gICAgICAgIHJvbGU6IFwiZ3JwUm9sZTpNYWluXCJ9XG4gICAgICBdXG4gICAgfSkpO1xuICAgIC8vLmNhdGNoKChlcnIpID0+IHtcbiAgICAvLyAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIC8vfSk7XG59O1xuXG4vKipcbiAqIFByaXZhdGUgQVBJIHJlcXVlc3QgbWV0aG9kXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIHF1ZXJ5IGJ1aWxkZXIgb3B0aW9ucy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBvcHRzLnBhZ2UgLSBkZXNpcmVkIHBhZ2Uvc3Vic2V0IG9mIHBvc3RzLCBsZWF2ZSBlbXB0eSBmb3IgcG9sbGluZy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBvcHRzLmZyb21EYXRlIC0gbmVlZGVkIGZvciBwb2xsaW5nLlxuICogQHJldHVybnMge29iamVjdH0gTGl2ZWJsb2cgMyBBUEkgcmVzcG9uc2VcbiAqL1xudm0uZ2V0UG9zdHMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZGJRdWVyeSA9IHNlbGYuZ2V0UXVlcnkoe1xuICAgIHNvcnQ6IG9wdHMuc29ydCB8fCBzZWxmLnNldHRpbmdzLnBvc3RPcmRlcixcbiAgICBoaWdobGlnaHRzT25seTogZmFsc2UgfHwgb3B0cy5oaWdobGlnaHRzT25seSxcbiAgICBmcm9tRGF0ZTogb3B0cy5mcm9tRGF0ZVxuICAgICAgPyBvcHRzLmZyb21EYXRlXG4gICAgICA6IGZhbHNlXG4gIH0pO1xuXG4gIHZhciBwYWdlID0gb3B0cy5mcm9tRGF0ZSA/IDEgOiBvcHRzLnBhZ2U7XG4gIHZhciBxcyA9IFwiP21heF9yZXN1bHRzPVwiICsgc2V0dGluZ3MucG9zdHNQZXJQYWdlICsgXCImcGFnZT1cIiArIHBhZ2UgKyBcIiZzb3VyY2U9XCJcbiAgICAsIGZ1bGxQYXRoID0gZW5kcG9pbnQgKyBxcyArIGRiUXVlcnk7XG5cbiAgcmV0dXJuIGhlbHBlcnMuZ2V0SlNPTihmdWxsUGF0aClcbiAgICAudGhlbigocG9zdHMpID0+IHtcbiAgICAgIHNlbGYudXBkYXRlVmlld01vZGVsKHBvc3RzLCBvcHRzKTtcbiAgICAgIHBvc3RzLnJlcXVlc3RPcHRzID0gb3B0cztcbiAgICAgIHJldHVybiBwb3N0cztcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIEdldCBuZXh0IHBhZ2Ugb2YgcG9zdHMgZnJvbSBBUEkuXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIHF1ZXJ5IGJ1aWxkZXIgb3B0aW9ucy5cbiAqIEByZXR1cm5zIHtwcm9taXNlfSByZXNvbHZlcyB0byBwb3N0cyBhcnJheS5cbiAqL1xudm0ubG9hZFBvc3RzUGFnZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIG9wdHMucGFnZSA9ICsrdGhpcy52bS5jdXJyZW50UGFnZTtcbiAgb3B0cy5zb3J0ID0gdGhpcy5zZXR0aW5ncy5wb3N0T3JkZXI7XG4gIHJldHVybiB0aGlzLmdldFBvc3RzKG9wdHMpO1xufTtcblxuLyoqXG4gKiBQb2xsIEFQSSBmb3IgbmV3IHBvc3RzLlxuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBxdWVyeSBidWlsZGVyIG9wdGlvbnMuXG4gKiBAcmV0dXJucyB7cHJvbWlzZX0gcmVzb2x2ZXMgdG8gcG9zdHMgYXJyYXkuXG4gKi9cbnZtLmxvYWRQb3N0cyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIG9wdHMuZnJvbURhdGUgPSB0aGlzLnZtLmxhdGVzdFVwZGF0ZTtcbiAgcmV0dXJuIHRoaXMuZ2V0UG9zdHMob3B0cyk7XG59O1xuXG4vKipcbiAqIEFkZCBpdGVtcyBpbiBhcGkgcmVzcG9uc2UgJiBsYXRlc3QgdXBkYXRlIHRpbWVzdGFtcCB0byB2aWV3bW9kZWwuXG4gKiBAcGFyYW0ge29iamVjdH0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKi9cbnZtLnVwZGF0ZVZpZXdNb2RlbCA9IGZ1bmN0aW9uKGFwaV9yZXNwb25zZSwgb3B0cykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKCFvcHRzLmZyb21EYXRlIHx8IG9wdHMuc29ydCAhPT0gc2VsZi5zZXR0aW5ncy5wb3N0T3JkZXIpIHsgLy8gTWVhbnMgd2UncmUgbm90IHBvbGxpbmdcbiAgICB2aWV3LmhpZGVMb2FkTW9yZShzZWxmLmlzVGltZWxpbmVFbmQoYXBpX3Jlc3BvbnNlKSk7IC8vIHRoZSBlbmQ/XG4gIH0gZWxzZSB7IC8vIE1lYW5zIHdlJ3JlIHBvbGxpbmcgZm9yIG5ldyBwb3N0c1xuICAgIGlmICghYXBpX3Jlc3BvbnNlLl9pdGVtcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLnZtLmxhdGVzdFVwZGF0ZSA9IHNlbGYuZ2V0TGF0ZXN0VXBkYXRlKGFwaV9yZXNwb25zZSk7XG4gIH1cblxuICBpZiAob3B0cy5zb3J0ICE9PSBzZWxmLnNldHRpbmdzLnBvc3RPcmRlcikge1xuICAgIHNlbGYudm0gPSBnZXRFbXB0eVZtKCk7XG4gICAgdmlldy5oaWRlTG9hZE1vcmUoZmFsc2UpO1xuICAgIE9iamVjdC5hc3NpZ24oc2VsZi52bSwgYXBpX3Jlc3BvbnNlKTtcbiAgfSBlbHNlIHtcbiAgICBzZWxmLnZtLl9pdGVtcy5wdXNoLmFwcGx5KHNlbGYudm0uX2l0ZW1zLCBhcGlfcmVzcG9uc2UuX2l0ZW1zKTtcbiAgfVxuXG4gIHNlbGYuc2V0dGluZ3MucG9zdE9yZGVyID0gb3B0cy5zb3J0O1xuICByZXR1cm4gYXBpX3Jlc3BvbnNlO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGxhdGVzdCB1cGRhdGUgdGltZXN0YW1wIGZyb20gYSBudW1iZXIgb2YgcG9zdHMuXG4gKiBAcGFyYW0ge29iamVjdH0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIElTTyA4NjAxIGVuY29kZWQgZGF0ZVxuICovXG52bS5nZXRMYXRlc3RVcGRhdGUgPSBmdW5jdGlvbihhcGlfcmVzcG9uc2UpIHtcbiAgdmFyIHRpbWVzdGFtcHMgPSBhcGlfcmVzcG9uc2UuX2l0ZW1zLm1hcCgocG9zdCkgPT4gbmV3IERhdGUocG9zdC5fdXBkYXRlZCkpO1xuXG4gIHZhciBsYXRlc3QgPSBuZXcgRGF0ZShNYXRoLm1heC5hcHBseShudWxsLCB0aW1lc3RhbXBzKSk7XG4gIHJldHVybiBsYXRlc3QudG9JU09TdHJpbmcoKTsgLy8gY29udmVydCB0aW1lc3RhbXAgdG8gSVNPXG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHdlIHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgdGltZWxpbmUuXG4gKiBAcGFyYW0ge29iamVjdH0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKiBAcmV0dXJucyB7Ym9vbH1cbiAqL1xudm0uaXNUaW1lbGluZUVuZCA9IGZ1bmN0aW9uKGFwaV9yZXNwb25zZSkge1xuICB2YXIgaXRlbXNJblZpZXcgPSB0aGlzLnZtLl9pdGVtcy5sZW5ndGggKyBzZXR0aW5ncy5wb3N0c1BlclBhZ2U7XG4gIHJldHVybiBhcGlfcmVzcG9uc2UuX21ldGEudG90YWwgPD0gaXRlbXNJblZpZXc7XG59O1xuXG4vKipcbiAqIFNldCB1cCB2aWV3bW9kZWwuXG4gKi9cbnZtLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICB0aGlzLnZtID0gZ2V0RW1wdHlWbShzZXR0aW5ncy5wb3N0c1BlclBhZ2UpO1xuICB0aGlzLnZtLmxhdGVzdFVwZGF0ZSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgdGhpcy52bS50aW1lSW5pdGlhbGl6ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gIHJldHVybiB0aGlzLnZtLmxhdGVzdFVwZGF0ZTtcbn07XG5cbi8qKlxuICogQnVpbGQgdXJsZW5jb2RlZCBFbGFzdGljU2VhcmNoIFF1ZXJ5c3RyaW5nXG4gKiBUT0RPOiBhYnN0cmFjdCBhd2F5LCB3ZSBvbmx5IG5lZWQgc3RpY2t5IGZsYWcgYW5kIG9yZGVyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIGFyZ3VtZW50cyBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLnNvcnQgLSBpZiBcImFzY2VuZGluZ1wiLCBnZXQgaXRlbXMgaW4gYXNjZW5kaW5nIG9yZGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5mcm9tRGF0ZSAtIHJlc3VsdHMgd2l0aCBhIElTTyA4NjAxIHRpbWVzdGFtcCBndCB0aGlzIG9ubHlcbiAqIEBwYXJhbSB7Ym9vbH0gb3B0cy5oaWdobGlnaHRzT25seSAtIGdldCBlZGl0b3JpYWwvaGlnaGxpZ2h0ZWQgaXRlbXMgb25seVxuICogQHJldHVybnMge3N0cmluZ30gUXVlcnlzdHJpbmdcbiAqL1xudm0uZ2V0UXVlcnkgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHZhciBxdWVyeSA9IHtcbiAgICBcInF1ZXJ5XCI6IHtcbiAgICAgIFwiZmlsdGVyZWRcIjoge1xuICAgICAgICBcImZpbHRlclwiOiB7XG4gICAgICAgICAgXCJhbmRcIjogW1xuICAgICAgICAgICAge1widGVybVwiOiB7XCJzdGlja3lcIjogZmFsc2V9fSxcbiAgICAgICAgICAgIHtcInRlcm1cIjoge1wicG9zdF9zdGF0dXNcIjogXCJvcGVuXCJ9fSxcbiAgICAgICAgICAgIHtcIm5vdFwiOiB7XCJ0ZXJtXCI6IHtcImRlbGV0ZWRcIjogdHJ1ZX19fSxcbiAgICAgICAgICAgIHtcInJhbmdlXCI6IHtcIl91cGRhdGVkXCI6IHtcImx0XCI6IHRoaXMudm0udGltZUluaXRpYWxpemVkfX19XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcInNvcnRcIjogW1xuICAgICAge1xuICAgICAgICBcIl91cGRhdGVkXCI6IHtcIm9yZGVyXCI6IFwiZGVzY1wifVxuICAgICAgfVxuICAgIF1cbiAgfTtcblxuICBpZiAob3B0cy5mcm9tRGF0ZSkge1xuICAgIHF1ZXJ5LnF1ZXJ5LmZpbHRlcmVkLmZpbHRlci5hbmRbM10ucmFuZ2UuX3VwZGF0ZWQgPSB7XG4gICAgICBcImd0XCI6IG9wdHMuZnJvbURhdGVcbiAgICB9O1xuICB9XG5cbiAgaWYgKG9wdHMuaGlnaGxpZ2h0c09ubHkgPT09IHRydWUpIHtcbiAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kLnB1c2goe1xuICAgICAgdGVybToge2hpZ2hsaWdodDogdHJ1ZX1cbiAgICB9KTtcbiAgfVxuXG4gIGlmIChvcHRzLnNvcnQgPT09IFwiYXNjZW5kaW5nXCIpIHtcbiAgICBxdWVyeS5zb3J0WzBdLl91cGRhdGVkLm9yZGVyID0gXCJhc2NcIjtcbiAgfSBlbHNlIGlmIChvcHRzLnNvcnQgPT09IFwiZWRpdG9yaWFsXCIpIHtcbiAgICBxdWVyeS5zb3J0ID0gW1xuICAgICAge1xuICAgICAgICBvcmRlcjoge1xuICAgICAgICAgIG9yZGVyOiBcImRlc2NcIixcbiAgICAgICAgICBtaXNzaW5nOiBcIl9sYXN0XCIsXG4gICAgICAgICAgdW5tYXBwZWRfdHlwZTogXCJsb25nXCJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF07XG4gIH1cblxuICAvLyBSZW1vdmUgdGhlIHJhbmdlLCB3ZSB3YW50IGFsbCB0aGUgcmVzdWx0c1xuICBpZiAoW1wiYXNjZW5kaW5nXCIsIFwiZGVzY2VuZGluZ1wiLCBcImVkaXRvcmlhbFwiXS5pbmRleE9mKG9wdHMuc29ydCkpIHtcbiAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kLmZvckVhY2goKHJ1bGUsIGluZGV4KSA9PiB7XG4gICAgICBpZiAocnVsZS5oYXNPd25Qcm9wZXJ0eSgncmFuZ2UnKSkge1xuICAgICAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kLnNwbGljZShpbmRleCwgMSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gZW5jb2RlVVJJKEpTT04uc3RyaW5naWZ5KHF1ZXJ5KSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHZtO1xuIiwiLyohIEJyb3dzZXIgYnVuZGxlIG9mIG51bmp1Y2tzIDMuMC4wIChzbGltLCBvbmx5IHdvcmtzIHdpdGggcHJlY29tcGlsZWQgdGVtcGxhdGVzKSAqL1xuKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wibnVuanVja3NcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wibnVuanVja3NcIl0gPSBmYWN0b3J5KCk7XG59KSh0aGlzLCBmdW5jdGlvbigpIHtcbnJldHVybiAvKioqKioqLyAoZnVuY3Rpb24obW9kdWxlcykgeyAvLyB3ZWJwYWNrQm9vdHN0cmFwXG4vKioqKioqLyBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbi8qKioqKiovIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuLyoqKioqKi8gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuLyoqKioqKi8gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbi8qKioqKiovIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbi8qKioqKiovIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbi8qKioqKiovIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4vKioqKioqLyBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbi8qKioqKiovIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4vKioqKioqLyBcdFx0XHRleHBvcnRzOiB7fSxcbi8qKioqKiovIFx0XHRcdGlkOiBtb2R1bGVJZCxcbi8qKioqKiovIFx0XHRcdGxvYWRlZDogZmFsc2Vcbi8qKioqKiovIFx0XHR9O1xuXG4vKioqKioqLyBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4vKioqKioqLyBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbi8qKioqKiovIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4vKioqKioqLyBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbi8qKioqKiovIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuLyoqKioqKi8gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbi8qKioqKiovIFx0fVxuXG5cbi8qKioqKiovIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbi8qKioqKiovIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vKioqKioqLyBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuLyoqKioqKi8gfSlcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqLyAoW1xuLyogMCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgZW52ID0gX193ZWJwYWNrX3JlcXVpcmVfXygyKTtcblx0dmFyIExvYWRlciA9IF9fd2VicGFja19yZXF1aXJlX18oMTQpO1xuXHR2YXIgbG9hZGVycyA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBwcmVjb21waWxlID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXHRtb2R1bGUuZXhwb3J0cy5FbnZpcm9ubWVudCA9IGVudi5FbnZpcm9ubWVudDtcblx0bW9kdWxlLmV4cG9ydHMuVGVtcGxhdGUgPSBlbnYuVGVtcGxhdGU7XG5cblx0bW9kdWxlLmV4cG9ydHMuTG9hZGVyID0gTG9hZGVyO1xuXHRtb2R1bGUuZXhwb3J0cy5GaWxlU3lzdGVtTG9hZGVyID0gbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyO1xuXHRtb2R1bGUuZXhwb3J0cy5QcmVjb21waWxlZExvYWRlciA9IGxvYWRlcnMuUHJlY29tcGlsZWRMb2FkZXI7XG5cdG1vZHVsZS5leHBvcnRzLldlYkxvYWRlciA9IGxvYWRlcnMuV2ViTG9hZGVyO1xuXG5cdG1vZHVsZS5leHBvcnRzLmNvbXBpbGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0bW9kdWxlLmV4cG9ydHMucGFyc2VyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0bW9kdWxlLmV4cG9ydHMubGV4ZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHRtb2R1bGUuZXhwb3J0cy5ydW50aW1lID0gX193ZWJwYWNrX3JlcXVpcmVfXyg4KTtcblx0bW9kdWxlLmV4cG9ydHMubGliID0gbGliO1xuXHRtb2R1bGUuZXhwb3J0cy5ub2RlcyA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0bW9kdWxlLmV4cG9ydHMuaW5zdGFsbEppbmphQ29tcGF0ID0gX193ZWJwYWNrX3JlcXVpcmVfXygxNSk7XG5cblx0Ly8gQSBzaW5nbGUgaW5zdGFuY2Ugb2YgYW4gZW52aXJvbm1lbnQsIHNpbmNlIHRoaXMgaXMgc28gY29tbW9ubHkgdXNlZFxuXG5cdHZhciBlO1xuXHRtb2R1bGUuZXhwb3J0cy5jb25maWd1cmUgPSBmdW5jdGlvbih0ZW1wbGF0ZXNQYXRoLCBvcHRzKSB7XG5cdCAgICBvcHRzID0gb3B0cyB8fCB7fTtcblx0ICAgIGlmKGxpYi5pc09iamVjdCh0ZW1wbGF0ZXNQYXRoKSkge1xuXHQgICAgICAgIG9wdHMgPSB0ZW1wbGF0ZXNQYXRoO1xuXHQgICAgICAgIHRlbXBsYXRlc1BhdGggPSBudWxsO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgVGVtcGxhdGVMb2FkZXI7XG5cdCAgICBpZihsb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIpIHtcblx0ICAgICAgICBUZW1wbGF0ZUxvYWRlciA9IG5ldyBsb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIodGVtcGxhdGVzUGF0aCwge1xuXHQgICAgICAgICAgICB3YXRjaDogb3B0cy53YXRjaCxcblx0ICAgICAgICAgICAgbm9DYWNoZTogb3B0cy5ub0NhY2hlXG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cdCAgICBlbHNlIGlmKGxvYWRlcnMuV2ViTG9hZGVyKSB7XG5cdCAgICAgICAgVGVtcGxhdGVMb2FkZXIgPSBuZXcgbG9hZGVycy5XZWJMb2FkZXIodGVtcGxhdGVzUGF0aCwge1xuXHQgICAgICAgICAgICB1c2VDYWNoZTogb3B0cy53ZWIgJiYgb3B0cy53ZWIudXNlQ2FjaGUsXG5cdCAgICAgICAgICAgIGFzeW5jOiBvcHRzLndlYiAmJiBvcHRzLndlYi5hc3luY1xuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICBlID0gbmV3IGVudi5FbnZpcm9ubWVudChUZW1wbGF0ZUxvYWRlciwgb3B0cyk7XG5cblx0ICAgIGlmKG9wdHMgJiYgb3B0cy5leHByZXNzKSB7XG5cdCAgICAgICAgZS5leHByZXNzKG9wdHMuZXhwcmVzcyk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBlO1xuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbihzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKSB7XG5cdCAgICBpZighZSkge1xuXHQgICAgICAgIG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSgpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIG5ldyBtb2R1bGUuZXhwb3J0cy5UZW1wbGF0ZShzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKTtcblx0fTtcblxuXHRtb2R1bGUuZXhwb3J0cy5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCBjdHgsIGNiKSB7XG5cdCAgICBpZighZSkge1xuXHQgICAgICAgIG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSgpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gZS5yZW5kZXIobmFtZSwgY3R4LCBjYik7XG5cdH07XG5cblx0bW9kdWxlLmV4cG9ydHMucmVuZGVyU3RyaW5nID0gZnVuY3Rpb24oc3JjLCBjdHgsIGNiKSB7XG5cdCAgICBpZighZSkge1xuXHQgICAgICAgIG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSgpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gZS5yZW5kZXJTdHJpbmcoc3JjLCBjdHgsIGNiKTtcblx0fTtcblxuXHRpZihwcmVjb21waWxlKSB7XG5cdCAgICBtb2R1bGUuZXhwb3J0cy5wcmVjb21waWxlID0gcHJlY29tcGlsZS5wcmVjb21waWxlO1xuXHQgICAgbW9kdWxlLmV4cG9ydHMucHJlY29tcGlsZVN0cmluZyA9IHByZWNvbXBpbGUucHJlY29tcGlsZVN0cmluZztcblx0fVxuXG5cbi8qKiovIH0sXG4vKiAxICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGU7XG5cdHZhciBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cblx0dmFyIGVzY2FwZU1hcCA9IHtcblx0ICAgICcmJzogJyZhbXA7Jyxcblx0ICAgICdcIic6ICcmcXVvdDsnLFxuXHQgICAgJ1xcJyc6ICcmIzM5OycsXG5cdCAgICAnPCc6ICcmbHQ7Jyxcblx0ICAgICc+JzogJyZndDsnXG5cdH07XG5cblx0dmFyIGVzY2FwZVJlZ2V4ID0gL1smXCInPD5dL2c7XG5cblx0dmFyIGxvb2t1cEVzY2FwZSA9IGZ1bmN0aW9uKGNoKSB7XG5cdCAgICByZXR1cm4gZXNjYXBlTWFwW2NoXTtcblx0fTtcblxuXHR2YXIgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cblx0ZXhwb3J0cy5wcmV0dGlmeUVycm9yID0gZnVuY3Rpb24ocGF0aCwgd2l0aEludGVybmFscywgZXJyKSB7XG5cdCAgICAvLyBqc2hpbnQgLVcwMjJcblx0ICAgIC8vIGh0dHA6Ly9qc2xpbnRlcnJvcnMuY29tL2RvLW5vdC1hc3NpZ24tdG8tdGhlLWV4Y2VwdGlvbi1wYXJhbWV0ZXJcblx0ICAgIGlmICghZXJyLlVwZGF0ZSkge1xuXHQgICAgICAgIC8vIG5vdCBvbmUgb2Ygb3VycywgY2FzdCBpdFxuXHQgICAgICAgIGVyciA9IG5ldyBleHBvcnRzLlRlbXBsYXRlRXJyb3IoZXJyKTtcblx0ICAgIH1cblx0ICAgIGVyci5VcGRhdGUocGF0aCk7XG5cblx0ICAgIC8vIFVubGVzcyB0aGV5IG1hcmtlZCB0aGUgZGV2IGZsYWcsIHNob3cgdGhlbSBhIHRyYWNlIGZyb20gaGVyZVxuXHQgICAgaWYgKCF3aXRoSW50ZXJuYWxzKSB7XG5cdCAgICAgICAgdmFyIG9sZCA9IGVycjtcblx0ICAgICAgICBlcnIgPSBuZXcgRXJyb3Iob2xkLm1lc3NhZ2UpO1xuXHQgICAgICAgIGVyci5uYW1lID0gb2xkLm5hbWU7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBlcnI7XG5cdH07XG5cblx0ZXhwb3J0cy5UZW1wbGF0ZUVycm9yID0gZnVuY3Rpb24obWVzc2FnZSwgbGluZW5vLCBjb2xubykge1xuXHQgICAgdmFyIGVyciA9IHRoaXM7XG5cblx0ICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgRXJyb3IpIHsgLy8gZm9yIGNhc3RpbmcgcmVndWxhciBqcyBlcnJvcnNcblx0ICAgICAgICBlcnIgPSBtZXNzYWdlO1xuXHQgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLm5hbWUgKyAnOiAnICsgbWVzc2FnZS5tZXNzYWdlO1xuXG5cdCAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgaWYoZXJyLm5hbWUgPSAnJykge31cblx0ICAgICAgICB9XG5cdCAgICAgICAgY2F0Y2goZSkge1xuXHQgICAgICAgICAgICAvLyBJZiB3ZSBjYW4ndCBzZXQgdGhlIG5hbWUgb2YgdGhlIGVycm9yIG9iamVjdCBpbiB0aGlzXG5cdCAgICAgICAgICAgIC8vIGVudmlyb25tZW50LCBkb24ndCB1c2UgaXRcblx0ICAgICAgICAgICAgZXJyID0gdGhpcztcblx0ICAgICAgICB9XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIGlmKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG5cdCAgICAgICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKGVycik7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBlcnIubmFtZSA9ICdUZW1wbGF0ZSByZW5kZXIgZXJyb3InO1xuXHQgICAgZXJyLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHQgICAgZXJyLmxpbmVubyA9IGxpbmVubztcblx0ICAgIGVyci5jb2xubyA9IGNvbG5vO1xuXHQgICAgZXJyLmZpcnN0VXBkYXRlID0gdHJ1ZTtcblxuXHQgICAgZXJyLlVwZGF0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcblx0ICAgICAgICB2YXIgbWVzc2FnZSA9ICcoJyArIChwYXRoIHx8ICd1bmtub3duIHBhdGgnKSArICcpJztcblxuXHQgICAgICAgIC8vIG9ubHkgc2hvdyBsaW5lbm8gKyBjb2xubyBuZXh0IHRvIHBhdGggb2YgdGVtcGxhdGVcblx0ICAgICAgICAvLyB3aGVyZSBlcnJvciBvY2N1cnJlZFxuXHQgICAgICAgIGlmICh0aGlzLmZpcnN0VXBkYXRlKSB7XG5cdCAgICAgICAgICAgIGlmKHRoaXMubGluZW5vICYmIHRoaXMuY29sbm8pIHtcblx0ICAgICAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyBbTGluZSAnICsgdGhpcy5saW5lbm8gKyAnLCBDb2x1bW4gJyArIHRoaXMuY29sbm8gKyAnXSc7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZih0aGlzLmxpbmVubykge1xuXHQgICAgICAgICAgICAgICAgbWVzc2FnZSArPSAnIFtMaW5lICcgKyB0aGlzLmxpbmVubyArICddJztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIG1lc3NhZ2UgKz0gJ1xcbiAnO1xuXHQgICAgICAgIGlmICh0aGlzLmZpcnN0VXBkYXRlKSB7XG5cdCAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyAnO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgKyAodGhpcy5tZXNzYWdlIHx8ICcnKTtcblx0ICAgICAgICB0aGlzLmZpcnN0VXBkYXRlID0gZmFsc2U7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9O1xuXG5cdCAgICByZXR1cm4gZXJyO1xuXHR9O1xuXG5cdGV4cG9ydHMuVGVtcGxhdGVFcnJvci5wcm90b3R5cGUgPSBFcnJvci5wcm90b3R5cGU7XG5cblx0ZXhwb3J0cy5lc2NhcGUgPSBmdW5jdGlvbih2YWwpIHtcblx0ICByZXR1cm4gdmFsLnJlcGxhY2UoZXNjYXBlUmVnZXgsIGxvb2t1cEVzY2FwZSk7XG5cdH07XG5cblx0ZXhwb3J0cy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXHR9O1xuXG5cdGV4cG9ydHMuaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xuXHR9O1xuXG5cdGV4cG9ydHMuaXNTdHJpbmcgPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IFN0cmluZ10nO1xuXHR9O1xuXG5cdGV4cG9ydHMuaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xuXHR9O1xuXG5cdGV4cG9ydHMuZ3JvdXBCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsKSB7XG5cdCAgICB2YXIgcmVzdWx0ID0ge307XG5cdCAgICB2YXIgaXRlcmF0b3IgPSBleHBvcnRzLmlzRnVuY3Rpb24odmFsKSA/IHZhbCA6IGZ1bmN0aW9uKG9iaikgeyByZXR1cm4gb2JqW3ZhbF07IH07XG5cdCAgICBmb3IodmFyIGk9MDsgaTxvYmoubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICB2YXIgdmFsdWUgPSBvYmpbaV07XG5cdCAgICAgICAgdmFyIGtleSA9IGl0ZXJhdG9yKHZhbHVlLCBpKTtcblx0ICAgICAgICAocmVzdWx0W2tleV0gfHwgKHJlc3VsdFtrZXldID0gW10pKS5wdXNoKHZhbHVlKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiByZXN1bHQ7XG5cdH07XG5cblx0ZXhwb3J0cy50b0FycmF5ID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqKTtcblx0fTtcblxuXHRleHBvcnRzLndpdGhvdXQgPSBmdW5jdGlvbihhcnJheSkge1xuXHQgICAgdmFyIHJlc3VsdCA9IFtdO1xuXHQgICAgaWYgKCFhcnJheSkge1xuXHQgICAgICAgIHJldHVybiByZXN1bHQ7XG5cdCAgICB9XG5cdCAgICB2YXIgaW5kZXggPSAtMSxcblx0ICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcblx0ICAgIGNvbnRhaW5zID0gZXhwb3J0cy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG5cblx0ICAgIHdoaWxlKCsraW5kZXggPCBsZW5ndGgpIHtcblx0ICAgICAgICBpZihleHBvcnRzLmluZGV4T2YoY29udGFpbnMsIGFycmF5W2luZGV4XSkgPT09IC0xKSB7XG5cdCAgICAgICAgICAgIHJlc3VsdC5wdXNoKGFycmF5W2luZGV4XSk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIHJlc3VsdDtcblx0fTtcblxuXHRleHBvcnRzLmV4dGVuZCA9IGZ1bmN0aW9uKG9iaiwgb2JqMikge1xuXHQgICAgZm9yKHZhciBrIGluIG9iajIpIHtcblx0ICAgICAgICBvYmpba10gPSBvYmoyW2tdO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIG9iajtcblx0fTtcblxuXHRleHBvcnRzLnJlcGVhdCA9IGZ1bmN0aW9uKGNoYXJfLCBuKSB7XG5cdCAgICB2YXIgc3RyID0gJyc7XG5cdCAgICBmb3IodmFyIGk9MDsgaTxuOyBpKyspIHtcblx0ICAgICAgICBzdHIgKz0gY2hhcl87XG5cdCAgICB9XG5cdCAgICByZXR1cm4gc3RyO1xuXHR9O1xuXG5cdGV4cG9ydHMuZWFjaCA9IGZ1bmN0aW9uKG9iaiwgZnVuYywgY29udGV4dCkge1xuXHQgICAgaWYob2JqID09IG51bGwpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIGlmKEFycmF5UHJvdG8uZWFjaCAmJiBvYmouZWFjaCA9PT0gQXJyYXlQcm90by5lYWNoKSB7XG5cdCAgICAgICAgb2JqLmZvckVhY2goZnVuYywgY29udGV4dCk7XG5cdCAgICB9XG5cdCAgICBlbHNlIGlmKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG5cdCAgICAgICAgZm9yKHZhciBpPTAsIGw9b2JqLmxlbmd0aDsgaTxsOyBpKyspIHtcblx0ICAgICAgICAgICAgZnVuYy5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cdH07XG5cblx0ZXhwb3J0cy5tYXAgPSBmdW5jdGlvbihvYmosIGZ1bmMpIHtcblx0ICAgIHZhciByZXN1bHRzID0gW107XG5cdCAgICBpZihvYmogPT0gbnVsbCkge1xuXHQgICAgICAgIHJldHVybiByZXN1bHRzO1xuXHQgICAgfVxuXG5cdCAgICBpZihBcnJheVByb3RvLm1hcCAmJiBvYmoubWFwID09PSBBcnJheVByb3RvLm1hcCkge1xuXHQgICAgICAgIHJldHVybiBvYmoubWFwKGZ1bmMpO1xuXHQgICAgfVxuXG5cdCAgICBmb3IodmFyIGk9MDsgaTxvYmoubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICByZXN1bHRzW3Jlc3VsdHMubGVuZ3RoXSA9IGZ1bmMob2JqW2ldLCBpKTtcblx0ICAgIH1cblxuXHQgICAgaWYob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcblx0ICAgICAgICByZXN1bHRzLmxlbmd0aCA9IG9iai5sZW5ndGg7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiByZXN1bHRzO1xuXHR9O1xuXG5cdGV4cG9ydHMuYXN5bmNJdGVyID0gZnVuY3Rpb24oYXJyLCBpdGVyLCBjYikge1xuXHQgICAgdmFyIGkgPSAtMTtcblxuXHQgICAgZnVuY3Rpb24gbmV4dCgpIHtcblx0ICAgICAgICBpKys7XG5cblx0ICAgICAgICBpZihpIDwgYXJyLmxlbmd0aCkge1xuXHQgICAgICAgICAgICBpdGVyKGFycltpXSwgaSwgbmV4dCwgY2IpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgY2IoKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIG5leHQoKTtcblx0fTtcblxuXHRleHBvcnRzLmFzeW5jRm9yID0gZnVuY3Rpb24ob2JqLCBpdGVyLCBjYikge1xuXHQgICAgdmFyIGtleXMgPSBleHBvcnRzLmtleXMob2JqKTtcblx0ICAgIHZhciBsZW4gPSBrZXlzLmxlbmd0aDtcblx0ICAgIHZhciBpID0gLTE7XG5cblx0ICAgIGZ1bmN0aW9uIG5leHQoKSB7XG5cdCAgICAgICAgaSsrO1xuXHQgICAgICAgIHZhciBrID0ga2V5c1tpXTtcblxuXHQgICAgICAgIGlmKGkgPCBsZW4pIHtcblx0ICAgICAgICAgICAgaXRlcihrLCBvYmpba10sIGksIGxlbiwgbmV4dCk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBjYigpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgbmV4dCgpO1xuXHR9O1xuXG5cdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2luZGV4T2YjUG9seWZpbGxcblx0ZXhwb3J0cy5pbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YgP1xuXHQgICAgZnVuY3Rpb24gKGFyciwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG5cdCAgICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoYXJyLCBzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpO1xuXHQgICAgfSA6XG5cdCAgICBmdW5jdGlvbiAoYXJyLCBzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcblx0ICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggPj4+IDA7IC8vIEhhY2sgdG8gY29udmVydCBvYmplY3QubGVuZ3RoIHRvIGEgVUludDMyXG5cblx0ICAgICAgICBmcm9tSW5kZXggPSArZnJvbUluZGV4IHx8IDA7XG5cblx0ICAgICAgICBpZihNYXRoLmFicyhmcm9tSW5kZXgpID09PSBJbmZpbml0eSkge1xuXHQgICAgICAgICAgICBmcm9tSW5kZXggPSAwO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKGZyb21JbmRleCA8IDApIHtcblx0ICAgICAgICAgICAgZnJvbUluZGV4ICs9IGxlbmd0aDtcblx0ICAgICAgICAgICAgaWYgKGZyb21JbmRleCA8IDApIHtcblx0ICAgICAgICAgICAgICAgIGZyb21JbmRleCA9IDA7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmb3IoO2Zyb21JbmRleCA8IGxlbmd0aDsgZnJvbUluZGV4KyspIHtcblx0ICAgICAgICAgICAgaWYgKGFycltmcm9tSW5kZXhdID09PSBzZWFyY2hFbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZnJvbUluZGV4O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIC0xO1xuXHQgICAgfTtcblxuXHRpZighQXJyYXkucHJvdG90eXBlLm1hcCkge1xuXHQgICAgQXJyYXkucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignbWFwIGlzIHVuaW1wbGVtZW50ZWQgZm9yIHRoaXMganMgZW5naW5lJyk7XG5cdCAgICB9O1xuXHR9XG5cblx0ZXhwb3J0cy5rZXlzID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICBpZihPYmplY3QucHJvdG90eXBlLmtleXMpIHtcblx0ICAgICAgICByZXR1cm4gb2JqLmtleXMoKTtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHZhciBrZXlzID0gW107XG5cdCAgICAgICAgZm9yKHZhciBrIGluIG9iaikge1xuXHQgICAgICAgICAgICBpZihvYmouaGFzT3duUHJvcGVydHkoaykpIHtcblx0ICAgICAgICAgICAgICAgIGtleXMucHVzaChrKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4ga2V5cztcblx0ICAgIH1cblx0fTtcblxuXHRleHBvcnRzLmluT3BlcmF0b3IgPSBmdW5jdGlvbiAoa2V5LCB2YWwpIHtcblx0ICAgIGlmIChleHBvcnRzLmlzQXJyYXkodmFsKSkge1xuXHQgICAgICAgIHJldHVybiBleHBvcnRzLmluZGV4T2YodmFsLCBrZXkpICE9PSAtMTtcblx0ICAgIH0gZWxzZSBpZiAoZXhwb3J0cy5pc09iamVjdCh2YWwpKSB7XG5cdCAgICAgICAgcmV0dXJuIGtleSBpbiB2YWw7XG5cdCAgICB9IGVsc2UgaWYgKGV4cG9ydHMuaXNTdHJpbmcodmFsKSkge1xuXHQgICAgICAgIHJldHVybiB2YWwuaW5kZXhPZihrZXkpICE9PSAtMTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgdXNlIFwiaW5cIiBvcGVyYXRvciB0byBzZWFyY2ggZm9yIFwiJ1xuXHQgICAgICAgICAgICArIGtleSArICdcIiBpbiB1bmV4cGVjdGVkIHR5cGVzLicpO1xuXHQgICAgfVxuXHR9O1xuXG5cbi8qKiovIH0sXG4vKiAyICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIHBhdGggPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgYXNhcCA9IF9fd2VicGFja19yZXF1aXJlX18oNCk7XG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgT2JqID0gX193ZWJwYWNrX3JlcXVpcmVfXyg2KTtcblx0dmFyIGNvbXBpbGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIGJ1aWx0aW5fZmlsdGVycyA9IF9fd2VicGFja19yZXF1aXJlX18oNyk7XG5cdHZhciBidWlsdGluX2xvYWRlcnMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgcnVudGltZSA9IF9fd2VicGFja19yZXF1aXJlX18oOCk7XG5cdHZhciBnbG9iYWxzID0gX193ZWJwYWNrX3JlcXVpcmVfXyg5KTtcblx0dmFyIHdhdGVyZmFsbCA9IF9fd2VicGFja19yZXF1aXJlX18oMTApO1xuXHR2YXIgRnJhbWUgPSBydW50aW1lLkZyYW1lO1xuXHR2YXIgVGVtcGxhdGU7XG5cblx0Ly8gVW5jb25kaXRpb25hbGx5IGxvYWQgaW4gdGhpcyBsb2FkZXIsIGV2ZW4gaWYgbm8gb3RoZXIgb25lcyBhcmVcblx0Ly8gaW5jbHVkZWQgKHBvc3NpYmxlIGluIHRoZSBzbGltIGJyb3dzZXIgYnVpbGQpXG5cdGJ1aWx0aW5fbG9hZGVycy5QcmVjb21waWxlZExvYWRlciA9IF9fd2VicGFja19yZXF1aXJlX18oMTMpO1xuXG5cdC8vIElmIHRoZSB1c2VyIGlzIHVzaW5nIHRoZSBhc3luYyBBUEksICphbHdheXMqIGNhbGwgaXRcblx0Ly8gYXN5bmNocm9ub3VzbHkgZXZlbiBpZiB0aGUgdGVtcGxhdGUgd2FzIHN5bmNocm9ub3VzLlxuXHRmdW5jdGlvbiBjYWxsYmFja0FzYXAoY2IsIGVyciwgcmVzKSB7XG5cdCAgICBhc2FwKGZ1bmN0aW9uKCkgeyBjYihlcnIsIHJlcyk7IH0pO1xuXHR9XG5cblx0dmFyIEVudmlyb25tZW50ID0gT2JqLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbihsb2FkZXJzLCBvcHRzKSB7XG5cdCAgICAgICAgLy8gVGhlIGRldiBmbGFnIGRldGVybWluZXMgdGhlIHRyYWNlIHRoYXQnbGwgYmUgc2hvd24gb24gZXJyb3JzLlxuXHQgICAgICAgIC8vIElmIHNldCB0byB0cnVlLCByZXR1cm5zIHRoZSBmdWxsIHRyYWNlIGZyb20gdGhlIGVycm9yIHBvaW50LFxuXHQgICAgICAgIC8vIG90aGVyd2lzZSB3aWxsIHJldHVybiB0cmFjZSBzdGFydGluZyBmcm9tIFRlbXBsYXRlLnJlbmRlclxuXHQgICAgICAgIC8vICh0aGUgZnVsbCB0cmFjZSBmcm9tIHdpdGhpbiBudW5qdWNrcyBtYXkgY29uZnVzZSBkZXZlbG9wZXJzIHVzaW5nXG5cdCAgICAgICAgLy8gIHRoZSBsaWJyYXJ5KVxuXHQgICAgICAgIC8vIGRlZmF1bHRzIHRvIGZhbHNlXG5cdCAgICAgICAgb3B0cyA9IHRoaXMub3B0cyA9IG9wdHMgfHwge307XG5cdCAgICAgICAgdGhpcy5vcHRzLmRldiA9ICEhb3B0cy5kZXY7XG5cblx0ICAgICAgICAvLyBUaGUgYXV0b2VzY2FwZSBmbGFnIHNldHMgZ2xvYmFsIGF1dG9lc2NhcGluZy4gSWYgdHJ1ZSxcblx0ICAgICAgICAvLyBldmVyeSBzdHJpbmcgdmFyaWFibGUgd2lsbCBiZSBlc2NhcGVkIGJ5IGRlZmF1bHQuXG5cdCAgICAgICAgLy8gSWYgZmFsc2UsIHN0cmluZ3MgY2FuIGJlIG1hbnVhbGx5IGVzY2FwZWQgdXNpbmcgdGhlIGBlc2NhcGVgIGZpbHRlci5cblx0ICAgICAgICAvLyBkZWZhdWx0cyB0byB0cnVlXG5cdCAgICAgICAgdGhpcy5vcHRzLmF1dG9lc2NhcGUgPSBvcHRzLmF1dG9lc2NhcGUgIT0gbnVsbCA/IG9wdHMuYXV0b2VzY2FwZSA6IHRydWU7XG5cblx0ICAgICAgICAvLyBJZiB0cnVlLCB0aGlzIHdpbGwgbWFrZSB0aGUgc3lzdGVtIHRocm93IGVycm9ycyBpZiB0cnlpbmdcblx0ICAgICAgICAvLyB0byBvdXRwdXQgYSBudWxsIG9yIHVuZGVmaW5lZCB2YWx1ZVxuXHQgICAgICAgIHRoaXMub3B0cy50aHJvd09uVW5kZWZpbmVkID0gISFvcHRzLnRocm93T25VbmRlZmluZWQ7XG5cdCAgICAgICAgdGhpcy5vcHRzLnRyaW1CbG9ja3MgPSAhIW9wdHMudHJpbUJsb2Nrcztcblx0ICAgICAgICB0aGlzLm9wdHMubHN0cmlwQmxvY2tzID0gISFvcHRzLmxzdHJpcEJsb2NrcztcblxuXHQgICAgICAgIHRoaXMubG9hZGVycyA9IFtdO1xuXG5cdCAgICAgICAgaWYoIWxvYWRlcnMpIHtcblx0ICAgICAgICAgICAgLy8gVGhlIGZpbGVzeXN0ZW0gbG9hZGVyIGlzIG9ubHkgYXZhaWxhYmxlIHNlcnZlci1zaWRlXG5cdCAgICAgICAgICAgIGlmKGJ1aWx0aW5fbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBbbmV3IGJ1aWx0aW5fbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKCd2aWV3cycpXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKGJ1aWx0aW5fbG9hZGVycy5XZWJMb2FkZXIpIHtcblx0ICAgICAgICAgICAgICAgIHRoaXMubG9hZGVycyA9IFtuZXcgYnVpbHRpbl9sb2FkZXJzLldlYkxvYWRlcignL3ZpZXdzJyldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBsaWIuaXNBcnJheShsb2FkZXJzKSA/IGxvYWRlcnMgOiBbbG9hZGVyc107XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gSXQncyBlYXN5IHRvIHVzZSBwcmVjb21waWxlZCB0ZW1wbGF0ZXM6IGp1c3QgaW5jbHVkZSB0aGVtXG5cdCAgICAgICAgLy8gYmVmb3JlIHlvdSBjb25maWd1cmUgbnVuanVja3MgYW5kIHRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5XG5cdCAgICAgICAgLy8gcGljayBpdCB1cCBhbmQgdXNlIGl0XG5cdCAgICAgICAgaWYoKHRydWUpICYmIHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkKSB7XG5cdCAgICAgICAgICAgIHRoaXMubG9hZGVycy51bnNoaWZ0KFxuXHQgICAgICAgICAgICAgICAgbmV3IGJ1aWx0aW5fbG9hZGVycy5QcmVjb21waWxlZExvYWRlcih3aW5kb3cubnVuanVja3NQcmVjb21waWxlZClcblx0ICAgICAgICAgICAgKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLmluaXRDYWNoZSgpO1xuXG5cdCAgICAgICAgdGhpcy5nbG9iYWxzID0gZ2xvYmFscygpO1xuXHQgICAgICAgIHRoaXMuZmlsdGVycyA9IHt9O1xuXHQgICAgICAgIHRoaXMuYXN5bmNGaWx0ZXJzID0gW107XG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zID0ge307XG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zTGlzdCA9IFtdO1xuXG5cdCAgICAgICAgZm9yKHZhciBuYW1lIGluIGJ1aWx0aW5fZmlsdGVycykge1xuXHQgICAgICAgICAgICB0aGlzLmFkZEZpbHRlcihuYW1lLCBidWlsdGluX2ZpbHRlcnNbbmFtZV0pO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGluaXRDYWNoZTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgLy8gQ2FjaGluZyBhbmQgY2FjaGUgYnVzdGluZ1xuXHQgICAgICAgIGxpYi5lYWNoKHRoaXMubG9hZGVycywgZnVuY3Rpb24obG9hZGVyKSB7XG5cdCAgICAgICAgICAgIGxvYWRlci5jYWNoZSA9IHt9O1xuXG5cdCAgICAgICAgICAgIGlmKHR5cGVvZiBsb2FkZXIub24gPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgICAgIGxvYWRlci5vbigndXBkYXRlJywgZnVuY3Rpb24odGVtcGxhdGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICBsb2FkZXIuY2FjaGVbdGVtcGxhdGVdID0gbnVsbDtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cdCAgICB9LFxuXG5cdCAgICBhZGRFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUsIGV4dGVuc2lvbikge1xuXHQgICAgICAgIGV4dGVuc2lvbi5fbmFtZSA9IG5hbWU7XG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zW25hbWVdID0gZXh0ZW5zaW9uO1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9uc0xpc3QucHVzaChleHRlbnNpb24pO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgcmVtb3ZlRXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuZ2V0RXh0ZW5zaW9uKG5hbWUpO1xuXHQgICAgICAgIGlmICghZXh0ZW5zaW9uKSByZXR1cm47XG5cblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnNMaXN0ID0gbGliLndpdGhvdXQodGhpcy5leHRlbnNpb25zTGlzdCwgZXh0ZW5zaW9uKTtcblx0ICAgICAgICBkZWxldGUgdGhpcy5leHRlbnNpb25zW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0RXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuZXh0ZW5zaW9uc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGhhc0V4dGVuc2lvbjogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHJldHVybiAhIXRoaXMuZXh0ZW5zaW9uc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEdsb2JhbDogZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcblx0ICAgICAgICB0aGlzLmdsb2JhbHNbbmFtZV0gPSB2YWx1ZTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIGdldEdsb2JhbDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIGlmKHR5cGVvZiB0aGlzLmdsb2JhbHNbbmFtZV0gPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZ2xvYmFsIG5vdCBmb3VuZDogJyArIG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gdGhpcy5nbG9iYWxzW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgYWRkRmlsdGVyOiBmdW5jdGlvbihuYW1lLCBmdW5jLCBhc3luYykge1xuXHQgICAgICAgIHZhciB3cmFwcGVkID0gZnVuYztcblxuXHQgICAgICAgIGlmKGFzeW5jKSB7XG5cdCAgICAgICAgICAgIHRoaXMuYXN5bmNGaWx0ZXJzLnB1c2gobmFtZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHRoaXMuZmlsdGVyc1tuYW1lXSA9IHdyYXBwZWQ7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRGaWx0ZXI6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZighdGhpcy5maWx0ZXJzW25hbWVdKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZmlsdGVyIG5vdCBmb3VuZDogJyArIG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgcmVzb2x2ZVRlbXBsYXRlOiBmdW5jdGlvbihsb2FkZXIsIHBhcmVudE5hbWUsIGZpbGVuYW1lKSB7XG5cdCAgICAgICAgdmFyIGlzUmVsYXRpdmUgPSAobG9hZGVyLmlzUmVsYXRpdmUgJiYgcGFyZW50TmFtZSk/IGxvYWRlci5pc1JlbGF0aXZlKGZpbGVuYW1lKSA6IGZhbHNlO1xuXHQgICAgICAgIHJldHVybiAoaXNSZWxhdGl2ZSAmJiBsb2FkZXIucmVzb2x2ZSk/IGxvYWRlci5yZXNvbHZlKHBhcmVudE5hbWUsIGZpbGVuYW1lKSA6IGZpbGVuYW1lO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0VGVtcGxhdGU6IGZ1bmN0aW9uKG5hbWUsIGVhZ2VyQ29tcGlsZSwgcGFyZW50TmFtZSwgaWdub3JlTWlzc2luZywgY2IpIHtcblx0ICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cdCAgICAgICAgdmFyIHRtcGwgPSBudWxsO1xuXHQgICAgICAgIGlmKG5hbWUgJiYgbmFtZS5yYXcpIHtcblx0ICAgICAgICAgICAgLy8gdGhpcyBmaXhlcyBhdXRvZXNjYXBlIGZvciB0ZW1wbGF0ZXMgcmVmZXJlbmNlZCBpbiBzeW1ib2xzXG5cdCAgICAgICAgICAgIG5hbWUgPSBuYW1lLnJhdztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihwYXJlbnROYW1lKSkge1xuXHQgICAgICAgICAgICBjYiA9IHBhcmVudE5hbWU7XG5cdCAgICAgICAgICAgIHBhcmVudE5hbWUgPSBudWxsO1xuXHQgICAgICAgICAgICBlYWdlckNvbXBpbGUgPSBlYWdlckNvbXBpbGUgfHwgZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYobGliLmlzRnVuY3Rpb24oZWFnZXJDb21waWxlKSkge1xuXHQgICAgICAgICAgICBjYiA9IGVhZ2VyQ29tcGlsZTtcblx0ICAgICAgICAgICAgZWFnZXJDb21waWxlID0gZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKG5hbWUgaW5zdGFuY2VvZiBUZW1wbGF0ZSkge1xuXHQgICAgICAgICAgICAgdG1wbCA9IG5hbWU7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGVtcGxhdGUgbmFtZXMgbXVzdCBiZSBhIHN0cmluZzogJyArIG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxvYWRlcnMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHZhciBfbmFtZSA9IHRoaXMucmVzb2x2ZVRlbXBsYXRlKHRoaXMubG9hZGVyc1tpXSwgcGFyZW50TmFtZSwgbmFtZSk7XG5cdCAgICAgICAgICAgICAgICB0bXBsID0gdGhpcy5sb2FkZXJzW2ldLmNhY2hlW19uYW1lXTtcblx0ICAgICAgICAgICAgICAgIGlmICh0bXBsKSBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKHRtcGwpIHtcblx0ICAgICAgICAgICAgaWYoZWFnZXJDb21waWxlKSB7XG5cdCAgICAgICAgICAgICAgICB0bXBsLmNvbXBpbGUoKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmKGNiKSB7XG5cdCAgICAgICAgICAgICAgICBjYihudWxsLCB0bXBsKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0bXBsO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHN5bmNSZXN1bHQ7XG5cdCAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cblx0ICAgICAgICAgICAgdmFyIGNyZWF0ZVRlbXBsYXRlID0gZnVuY3Rpb24oZXJyLCBpbmZvKSB7XG5cdCAgICAgICAgICAgICAgICBpZighaW5mbyAmJiAhZXJyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoIWlnbm9yZU1pc3NpbmcpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZXJyID0gbmV3IEVycm9yKCd0ZW1wbGF0ZSBub3QgZm91bmQ6ICcgKyBuYW1lKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZihjYikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYihlcnIpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciB0bXBsO1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGluZm8pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdG1wbCA9IG5ldyBUZW1wbGF0ZShpbmZvLnNyYywgX3RoaXMsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wYXRoLCBlYWdlckNvbXBpbGUpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmKCFpbmZvLm5vQ2FjaGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubG9hZGVyLmNhY2hlW25hbWVdID0gdG1wbDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdG1wbCA9IG5ldyBUZW1wbGF0ZSgnJywgX3RoaXMsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJycsIGVhZ2VyQ29tcGlsZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYoY2IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2IobnVsbCwgdG1wbCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gdG1wbDtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgbGliLmFzeW5jSXRlcih0aGlzLmxvYWRlcnMsIGZ1bmN0aW9uKGxvYWRlciwgaSwgbmV4dCwgZG9uZSkge1xuXHQgICAgICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlKGVyciwgc3JjKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoZXJyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUoZXJyKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSBpZihzcmMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3JjLmxvYWRlciA9IGxvYWRlcjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShudWxsLCBzcmMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLy8gUmVzb2x2ZSBuYW1lIHJlbGF0aXZlIHRvIHBhcmVudE5hbWVcblx0ICAgICAgICAgICAgICAgIG5hbWUgPSB0aGF0LnJlc29sdmVUZW1wbGF0ZShsb2FkZXIsIHBhcmVudE5hbWUsIG5hbWUpO1xuXG5cdCAgICAgICAgICAgICAgICBpZihsb2FkZXIuYXN5bmMpIHtcblx0ICAgICAgICAgICAgICAgICAgICBsb2FkZXIuZ2V0U291cmNlKG5hbWUsIGhhbmRsZSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBoYW5kbGUobnVsbCwgbG9hZGVyLmdldFNvdXJjZShuYW1lKSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0sIGNyZWF0ZVRlbXBsYXRlKTtcblxuXHQgICAgICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBleHByZXNzOiBmdW5jdGlvbihhcHApIHtcblx0ICAgICAgICB2YXIgZW52ID0gdGhpcztcblxuXHQgICAgICAgIGZ1bmN0aW9uIE51bmp1Y2tzVmlldyhuYW1lLCBvcHRzKSB7XG5cdCAgICAgICAgICAgIHRoaXMubmFtZSAgICAgICAgICA9IG5hbWU7XG5cdCAgICAgICAgICAgIHRoaXMucGF0aCAgICAgICAgICA9IG5hbWU7XG5cdCAgICAgICAgICAgIHRoaXMuZGVmYXVsdEVuZ2luZSA9IG9wdHMuZGVmYXVsdEVuZ2luZTtcblx0ICAgICAgICAgICAgdGhpcy5leHQgICAgICAgICAgID0gcGF0aC5leHRuYW1lKG5hbWUpO1xuXHQgICAgICAgICAgICBpZiAoIXRoaXMuZXh0ICYmICF0aGlzLmRlZmF1bHRFbmdpbmUpIHRocm93IG5ldyBFcnJvcignTm8gZGVmYXVsdCBlbmdpbmUgd2FzIHNwZWNpZmllZCBhbmQgbm8gZXh0ZW5zaW9uIHdhcyBwcm92aWRlZC4nKTtcblx0ICAgICAgICAgICAgaWYgKCF0aGlzLmV4dCkgdGhpcy5uYW1lICs9ICh0aGlzLmV4dCA9ICgnLicgIT09IHRoaXMuZGVmYXVsdEVuZ2luZVswXSA/ICcuJyA6ICcnKSArIHRoaXMuZGVmYXVsdEVuZ2luZSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgTnVuanVja3NWaWV3LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihvcHRzLCBjYikge1xuXHQgICAgICAgICAgZW52LnJlbmRlcih0aGlzLm5hbWUsIG9wdHMsIGNiKTtcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgYXBwLnNldCgndmlldycsIE51bmp1Y2tzVmlldyk7XG5cdCAgICAgICAgYXBwLnNldCgnbnVuanVja3NFbnYnLCB0aGlzKTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIHJlbmRlcjogZnVuY3Rpb24obmFtZSwgY3R4LCBjYikge1xuXHQgICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKGN0eCkpIHtcblx0ICAgICAgICAgICAgY2IgPSBjdHg7XG5cdCAgICAgICAgICAgIGN0eCA9IG51bGw7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gV2Ugc3VwcG9ydCBhIHN5bmNocm9ub3VzIEFQSSB0byBtYWtlIGl0IGVhc2llciB0byBtaWdyYXRlXG5cdCAgICAgICAgLy8gZXhpc3RpbmcgY29kZSB0byBhc3luYy4gVGhpcyB3b3JrcyBiZWNhdXNlIGlmIHlvdSBkb24ndCBkb1xuXHQgICAgICAgIC8vIGFueXRoaW5nIGFzeW5jIHdvcmssIHRoZSB3aG9sZSB0aGluZyBpcyBhY3R1YWxseSBydW5cblx0ICAgICAgICAvLyBzeW5jaHJvbm91c2x5LlxuXHQgICAgICAgIHZhciBzeW5jUmVzdWx0ID0gbnVsbDtcblxuXHQgICAgICAgIHRoaXMuZ2V0VGVtcGxhdGUobmFtZSwgZnVuY3Rpb24oZXJyLCB0bXBsKSB7XG5cdCAgICAgICAgICAgIGlmKGVyciAmJiBjYikge1xuXHQgICAgICAgICAgICAgICAgY2FsbGJhY2tBc2FwKGNiLCBlcnIpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYoZXJyKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gdG1wbC5yZW5kZXIoY3R4LCBjYik7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiBzeW5jUmVzdWx0O1xuXHQgICAgfSxcblxuXHQgICAgcmVuZGVyU3RyaW5nOiBmdW5jdGlvbihzcmMsIGN0eCwgb3B0cywgY2IpIHtcblx0ICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihvcHRzKSkge1xuXHQgICAgICAgICAgICBjYiA9IG9wdHM7XG5cdCAgICAgICAgICAgIG9wdHMgPSB7fTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cblx0ICAgICAgICB2YXIgdG1wbCA9IG5ldyBUZW1wbGF0ZShzcmMsIHRoaXMsIG9wdHMucGF0aCk7XG5cdCAgICAgICAgcmV0dXJuIHRtcGwucmVuZGVyKGN0eCwgY2IpO1xuXHQgICAgfSxcblxuXHQgICAgd2F0ZXJmYWxsOiB3YXRlcmZhbGxcblx0fSk7XG5cblx0dmFyIENvbnRleHQgPSBPYmouZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uKGN0eCwgYmxvY2tzLCBlbnYpIHtcblx0ICAgICAgICAvLyBIYXMgdG8gYmUgdGllZCB0byBhbiBlbnZpcm9ubWVudCBzbyB3ZSBjYW4gdGFwIGludG8gaXRzIGdsb2JhbHMuXG5cdCAgICAgICAgdGhpcy5lbnYgPSBlbnYgfHwgbmV3IEVudmlyb25tZW50KCk7XG5cblx0ICAgICAgICAvLyBNYWtlIGEgZHVwbGljYXRlIG9mIGN0eFxuXHQgICAgICAgIHRoaXMuY3R4ID0ge307XG5cdCAgICAgICAgZm9yKHZhciBrIGluIGN0eCkge1xuXHQgICAgICAgICAgICBpZihjdHguaGFzT3duUHJvcGVydHkoaykpIHtcblx0ICAgICAgICAgICAgICAgIHRoaXMuY3R4W2tdID0gY3R4W2tdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5ibG9ja3MgPSB7fTtcblx0ICAgICAgICB0aGlzLmV4cG9ydGVkID0gW107XG5cblx0ICAgICAgICBmb3IodmFyIG5hbWUgaW4gYmxvY2tzKSB7XG5cdCAgICAgICAgICAgIHRoaXMuYWRkQmxvY2sobmFtZSwgYmxvY2tzW25hbWVdKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBsb29rdXA6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICAvLyBUaGlzIGlzIG9uZSBvZiB0aGUgbW9zdCBjYWxsZWQgZnVuY3Rpb25zLCBzbyBvcHRpbWl6ZSBmb3Jcblx0ICAgICAgICAvLyB0aGUgdHlwaWNhbCBjYXNlIHdoZXJlIHRoZSBuYW1lIGlzbid0IGluIHRoZSBnbG9iYWxzXG5cdCAgICAgICAgaWYobmFtZSBpbiB0aGlzLmVudi5nbG9iYWxzICYmICEobmFtZSBpbiB0aGlzLmN0eCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW52Lmdsb2JhbHNbbmFtZV07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5jdHhbbmFtZV07XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgc2V0VmFyaWFibGU6IGZ1bmN0aW9uKG5hbWUsIHZhbCkge1xuXHQgICAgICAgIHRoaXMuY3R4W25hbWVdID0gdmFsO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0VmFyaWFibGVzOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5jdHg7XG5cdCAgICB9LFxuXG5cdCAgICBhZGRCbG9jazogZnVuY3Rpb24obmFtZSwgYmxvY2spIHtcblx0ICAgICAgICB0aGlzLmJsb2Nrc1tuYW1lXSA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdO1xuXHQgICAgICAgIHRoaXMuYmxvY2tzW25hbWVdLnB1c2goYmxvY2spO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0QmxvY2s6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZighdGhpcy5ibG9ja3NbbmFtZV0pIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIGJsb2NrIFwiJyArIG5hbWUgKyAnXCInKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gdGhpcy5ibG9ja3NbbmFtZV1bMF07XG5cdCAgICB9LFxuXG5cdCAgICBnZXRTdXBlcjogZnVuY3Rpb24oZW52LCBuYW1lLCBibG9jaywgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG5cdCAgICAgICAgdmFyIGlkeCA9IGxpYi5pbmRleE9mKHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdLCBibG9jayk7XG5cdCAgICAgICAgdmFyIGJsayA9IHRoaXMuYmxvY2tzW25hbWVdW2lkeCArIDFdO1xuXHQgICAgICAgIHZhciBjb250ZXh0ID0gdGhpcztcblxuXHQgICAgICAgIGlmKGlkeCA9PT0gLTEgfHwgIWJsaykge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHN1cGVyIGJsb2NrIGF2YWlsYWJsZSBmb3IgXCInICsgbmFtZSArICdcIicpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGJsayhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG5cdCAgICB9LFxuXG5cdCAgICBhZGRFeHBvcnQ6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICB0aGlzLmV4cG9ydGVkLnB1c2gobmFtZSk7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRFeHBvcnRlZDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIGV4cG9ydGVkID0ge307XG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5leHBvcnRlZC5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICB2YXIgbmFtZSA9IHRoaXMuZXhwb3J0ZWRbaV07XG5cdCAgICAgICAgICAgIGV4cG9ydGVkW25hbWVdID0gdGhpcy5jdHhbbmFtZV07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBleHBvcnRlZDtcblx0ICAgIH1cblx0fSk7XG5cblx0VGVtcGxhdGUgPSBPYmouZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uIChzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKSB7XG5cdCAgICAgICAgdGhpcy5lbnYgPSBlbnYgfHwgbmV3IEVudmlyb25tZW50KCk7XG5cblx0ICAgICAgICBpZihsaWIuaXNPYmplY3Qoc3JjKSkge1xuXHQgICAgICAgICAgICBzd2l0Y2goc3JjLnR5cGUpIHtcblx0ICAgICAgICAgICAgY2FzZSAnY29kZSc6IHRoaXMudG1wbFByb3BzID0gc3JjLm9iajsgYnJlYWs7XG5cdCAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6IHRoaXMudG1wbFN0ciA9IHNyYy5vYmo7IGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYobGliLmlzU3RyaW5nKHNyYykpIHtcblx0ICAgICAgICAgICAgdGhpcy50bXBsU3RyID0gc3JjO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzcmMgbXVzdCBiZSBhIHN0cmluZyBvciBhbiBvYmplY3QgZGVzY3JpYmluZyAnICtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0aGUgc291cmNlJyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5wYXRoID0gcGF0aDtcblxuXHQgICAgICAgIGlmKGVhZ2VyQ29tcGlsZSkge1xuXHQgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXHQgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgX3RoaXMuX2NvbXBpbGUoKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBjYXRjaChlcnIpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IGxpYi5wcmV0dGlmeUVycm9yKHRoaXMucGF0aCwgdGhpcy5lbnYub3B0cy5kZXYsIGVycik7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHRoaXMuY29tcGlsZWQgPSBmYWxzZTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCwgcGFyZW50RnJhbWUsIGNiKSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBjdHggPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBjdHg7XG5cdCAgICAgICAgICAgIGN0eCA9IHt9O1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmICh0eXBlb2YgcGFyZW50RnJhbWUgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBwYXJlbnRGcmFtZTtcblx0ICAgICAgICAgICAgcGFyZW50RnJhbWUgPSBudWxsO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBmb3JjZUFzeW5jID0gdHJ1ZTtcblx0ICAgICAgICBpZihwYXJlbnRGcmFtZSkge1xuXHQgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIGZyYW1lLCB3ZSBhcmUgYmVpbmcgY2FsbGVkIGZyb20gaW50ZXJuYWxcblx0ICAgICAgICAgICAgLy8gY29kZSBvZiBhbm90aGVyIHRlbXBsYXRlLCBhbmQgdGhlIGludGVybmFsIHN5c3RlbVxuXHQgICAgICAgICAgICAvLyBkZXBlbmRzIG9uIHRoZSBzeW5jL2FzeW5jIG5hdHVyZSBvZiB0aGUgcGFyZW50IHRlbXBsYXRlXG5cdCAgICAgICAgICAgIC8vIHRvIGJlIGluaGVyaXRlZCwgc28gZm9yY2UgYW4gYXN5bmMgY2FsbGJhY2tcblx0ICAgICAgICAgICAgZm9yY2VBc3luYyA9IGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cdCAgICAgICAgLy8gQ2F0Y2ggY29tcGlsZSBlcnJvcnMgZm9yIGFzeW5jIHJlbmRlcmluZ1xuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIF90aGlzLmNvbXBpbGUoKTtcblx0ICAgICAgICB9IGNhdGNoIChfZXJyKSB7XG5cdCAgICAgICAgICAgIHZhciBlcnIgPSBsaWIucHJldHRpZnlFcnJvcih0aGlzLnBhdGgsIHRoaXMuZW52Lm9wdHMuZGV2LCBfZXJyKTtcblx0ICAgICAgICAgICAgaWYgKGNiKSByZXR1cm4gY2FsbGJhY2tBc2FwKGNiLCBlcnIpO1xuXHQgICAgICAgICAgICBlbHNlIHRocm93IGVycjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KGN0eCB8fCB7fSwgX3RoaXMuYmxvY2tzLCBfdGhpcy5lbnYpO1xuXHQgICAgICAgIHZhciBmcmFtZSA9IHBhcmVudEZyYW1lID8gcGFyZW50RnJhbWUucHVzaCh0cnVlKSA6IG5ldyBGcmFtZSgpO1xuXHQgICAgICAgIGZyYW1lLnRvcExldmVsID0gdHJ1ZTtcblx0ICAgICAgICB2YXIgc3luY1Jlc3VsdCA9IG51bGw7XG5cblx0ICAgICAgICBfdGhpcy5yb290UmVuZGVyRnVuYyhcblx0ICAgICAgICAgICAgX3RoaXMuZW52LFxuXHQgICAgICAgICAgICBjb250ZXh0LFxuXHQgICAgICAgICAgICBmcmFtZSB8fCBuZXcgRnJhbWUoKSxcblx0ICAgICAgICAgICAgcnVudGltZSxcblx0ICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXMpIHtcblx0ICAgICAgICAgICAgICAgIGlmKGVycikge1xuXHQgICAgICAgICAgICAgICAgICAgIGVyciA9IGxpYi5wcmV0dGlmeUVycm9yKF90aGlzLnBhdGgsIF90aGlzLmVudi5vcHRzLmRldiwgZXJyKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgaWYoY2IpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZihmb3JjZUFzeW5jKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrQXNhcChjYiwgZXJyLCByZXMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2IoZXJyLCByZXMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGVycikgeyB0aHJvdyBlcnI7IH1cblx0ICAgICAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gcmVzO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgKTtcblxuXHQgICAgICAgIHJldHVybiBzeW5jUmVzdWx0O1xuXHQgICAgfSxcblxuXG5cdCAgICBnZXRFeHBvcnRlZDogZnVuY3Rpb24oY3R4LCBwYXJlbnRGcmFtZSwgY2IpIHtcblx0ICAgICAgICBpZiAodHlwZW9mIGN0eCA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICBjYiA9IGN0eDtcblx0ICAgICAgICAgICAgY3R4ID0ge307XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHR5cGVvZiBwYXJlbnRGcmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICBjYiA9IHBhcmVudEZyYW1lO1xuXHQgICAgICAgICAgICBwYXJlbnRGcmFtZSA9IG51bGw7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gQ2F0Y2ggY29tcGlsZSBlcnJvcnMgZm9yIGFzeW5jIHJlbmRlcmluZ1xuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIHRoaXMuY29tcGlsZSgpO1xuXHQgICAgICAgIH0gY2F0Y2ggKGUpIHtcblx0ICAgICAgICAgICAgaWYgKGNiKSByZXR1cm4gY2IoZSk7XG5cdCAgICAgICAgICAgIGVsc2UgdGhyb3cgZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgZnJhbWUgPSBwYXJlbnRGcmFtZSA/IHBhcmVudEZyYW1lLnB1c2goKSA6IG5ldyBGcmFtZSgpO1xuXHQgICAgICAgIGZyYW1lLnRvcExldmVsID0gdHJ1ZTtcblxuXHQgICAgICAgIC8vIFJ1biB0aGUgcm9vdFJlbmRlckZ1bmMgdG8gcG9wdWxhdGUgdGhlIGNvbnRleHQgd2l0aCBleHBvcnRlZCB2YXJzXG5cdCAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dChjdHggfHwge30sIHRoaXMuYmxvY2tzLCB0aGlzLmVudik7XG5cdCAgICAgICAgdGhpcy5yb290UmVuZGVyRnVuYyh0aGlzLmVudixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihlcnIpIHtcblx0ICAgICAgICBcdFx0ICAgICAgICBpZiAoIGVyciApIHtcblx0ICAgICAgICBcdFx0XHQgICAgY2IoZXJyLCBudWxsKTtcblx0ICAgICAgICBcdFx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIFx0XHRcdCAgICBjYihudWxsLCBjb250ZXh0LmdldEV4cG9ydGVkKCkpO1xuXHQgICAgICAgIFx0XHQgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgfSxcblxuXHQgICAgY29tcGlsZTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYoIXRoaXMuY29tcGlsZWQpIHtcblx0ICAgICAgICAgICAgdGhpcy5fY29tcGlsZSgpO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIF9jb21waWxlOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgcHJvcHM7XG5cblx0ICAgICAgICBpZih0aGlzLnRtcGxQcm9wcykge1xuXHQgICAgICAgICAgICBwcm9wcyA9IHRoaXMudG1wbFByb3BzO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGNvbXBpbGVyLmNvbXBpbGUodGhpcy50bXBsU3RyLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5hc3luY0ZpbHRlcnMsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52LmV4dGVuc2lvbnNMaXN0LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhdGgsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52Lm9wdHMpO1xuXG5cdCAgICAgICAgICAgIC8qIGpzbGludCBldmlsOiB0cnVlICovXG5cdCAgICAgICAgICAgIHZhciBmdW5jID0gbmV3IEZ1bmN0aW9uKHNvdXJjZSk7XG5cdCAgICAgICAgICAgIHByb3BzID0gZnVuYygpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMuYmxvY2tzID0gdGhpcy5fZ2V0QmxvY2tzKHByb3BzKTtcblx0ICAgICAgICB0aGlzLnJvb3RSZW5kZXJGdW5jID0gcHJvcHMucm9vdDtcblx0ICAgICAgICB0aGlzLmNvbXBpbGVkID0gdHJ1ZTtcblx0ICAgIH0sXG5cblx0ICAgIF9nZXRCbG9ja3M6IGZ1bmN0aW9uKHByb3BzKSB7XG5cdCAgICAgICAgdmFyIGJsb2NrcyA9IHt9O1xuXG5cdCAgICAgICAgZm9yKHZhciBrIGluIHByb3BzKSB7XG5cdCAgICAgICAgICAgIGlmKGsuc2xpY2UoMCwgMikgPT09ICdiXycpIHtcblx0ICAgICAgICAgICAgICAgIGJsb2Nrc1trLnNsaWNlKDIpXSA9IHByb3BzW2tdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGJsb2Nrcztcblx0ICAgIH1cblx0fSk7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSB7XG5cdCAgICBFbnZpcm9ubWVudDogRW52aXJvbm1lbnQsXG5cdCAgICBUZW1wbGF0ZTogVGVtcGxhdGVcblx0fTtcblxuXG4vKioqLyB9LFxuLyogMyAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0XG5cbi8qKiovIH0sXG4vKiA0ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvLyByYXdBc2FwIHByb3ZpZGVzIGV2ZXJ5dGhpbmcgd2UgbmVlZCBleGNlcHQgZXhjZXB0aW9uIG1hbmFnZW1lbnQuXG5cdHZhciByYXdBc2FwID0gX193ZWJwYWNrX3JlcXVpcmVfXyg1KTtcblx0Ly8gUmF3VGFza3MgYXJlIHJlY3ljbGVkIHRvIHJlZHVjZSBHQyBjaHVybi5cblx0dmFyIGZyZWVUYXNrcyA9IFtdO1xuXHQvLyBXZSBxdWV1ZSBlcnJvcnMgdG8gZW5zdXJlIHRoZXkgYXJlIHRocm93biBpbiByaWdodCBvcmRlciAoRklGTykuXG5cdC8vIEFycmF5LWFzLXF1ZXVlIGlzIGdvb2QgZW5vdWdoIGhlcmUsIHNpbmNlIHdlIGFyZSBqdXN0IGRlYWxpbmcgd2l0aCBleGNlcHRpb25zLlxuXHR2YXIgcGVuZGluZ0Vycm9ycyA9IFtdO1xuXHR2YXIgcmVxdWVzdEVycm9yVGhyb3cgPSByYXdBc2FwLm1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcih0aHJvd0ZpcnN0RXJyb3IpO1xuXG5cdGZ1bmN0aW9uIHRocm93Rmlyc3RFcnJvcigpIHtcblx0ICAgIGlmIChwZW5kaW5nRXJyb3JzLmxlbmd0aCkge1xuXHQgICAgICAgIHRocm93IHBlbmRpbmdFcnJvcnMuc2hpZnQoKTtcblx0ICAgIH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxscyBhIHRhc2sgYXMgc29vbiBhcyBwb3NzaWJsZSBhZnRlciByZXR1cm5pbmcsIGluIGl0cyBvd24gZXZlbnQsIHdpdGggcHJpb3JpdHlcblx0ICogb3ZlciBvdGhlciBldmVudHMgbGlrZSBhbmltYXRpb24sIHJlZmxvdywgYW5kIHJlcGFpbnQuIEFuIGVycm9yIHRocm93biBmcm9tIGFuXG5cdCAqIGV2ZW50IHdpbGwgbm90IGludGVycnVwdCwgbm9yIGV2ZW4gc3Vic3RhbnRpYWxseSBzbG93IGRvd24gdGhlIHByb2Nlc3Npbmcgb2Zcblx0ICogb3RoZXIgZXZlbnRzLCBidXQgd2lsbCBiZSByYXRoZXIgcG9zdHBvbmVkIHRvIGEgbG93ZXIgcHJpb3JpdHkgZXZlbnQuXG5cdCAqIEBwYXJhbSB7e2NhbGx9fSB0YXNrIEEgY2FsbGFibGUgb2JqZWN0LCB0eXBpY2FsbHkgYSBmdW5jdGlvbiB0aGF0IHRha2VzIG5vXG5cdCAqIGFyZ3VtZW50cy5cblx0ICovXG5cdG1vZHVsZS5leHBvcnRzID0gYXNhcDtcblx0ZnVuY3Rpb24gYXNhcCh0YXNrKSB7XG5cdCAgICB2YXIgcmF3VGFzaztcblx0ICAgIGlmIChmcmVlVGFza3MubGVuZ3RoKSB7XG5cdCAgICAgICAgcmF3VGFzayA9IGZyZWVUYXNrcy5wb3AoKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgcmF3VGFzayA9IG5ldyBSYXdUYXNrKCk7XG5cdCAgICB9XG5cdCAgICByYXdUYXNrLnRhc2sgPSB0YXNrO1xuXHQgICAgcmF3QXNhcChyYXdUYXNrKTtcblx0fVxuXG5cdC8vIFdlIHdyYXAgdGFza3Mgd2l0aCByZWN5Y2xhYmxlIHRhc2sgb2JqZWN0cy4gIEEgdGFzayBvYmplY3QgaW1wbGVtZW50c1xuXHQvLyBgY2FsbGAsIGp1c3QgbGlrZSBhIGZ1bmN0aW9uLlxuXHRmdW5jdGlvbiBSYXdUYXNrKCkge1xuXHQgICAgdGhpcy50YXNrID0gbnVsbDtcblx0fVxuXG5cdC8vIFRoZSBzb2xlIHB1cnBvc2Ugb2Ygd3JhcHBpbmcgdGhlIHRhc2sgaXMgdG8gY2F0Y2ggdGhlIGV4Y2VwdGlvbiBhbmQgcmVjeWNsZVxuXHQvLyB0aGUgdGFzayBvYmplY3QgYWZ0ZXIgaXRzIHNpbmdsZSB1c2UuXG5cdFJhd1Rhc2sucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0cnkge1xuXHQgICAgICAgIHRoaXMudGFzay5jYWxsKCk7XG5cdCAgICB9IGNhdGNoIChlcnJvcikge1xuXHQgICAgICAgIGlmIChhc2FwLm9uZXJyb3IpIHtcblx0ICAgICAgICAgICAgLy8gVGhpcyBob29rIGV4aXN0cyBwdXJlbHkgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG5cdCAgICAgICAgICAgIC8vIEl0cyBuYW1lIHdpbGwgYmUgcGVyaW9kaWNhbGx5IHJhbmRvbWl6ZWQgdG8gYnJlYWsgYW55IGNvZGUgdGhhdFxuXHQgICAgICAgICAgICAvLyBkZXBlbmRzIG9uIGl0cyBleGlzdGVuY2UuXG5cdCAgICAgICAgICAgIGFzYXAub25lcnJvcihlcnJvcik7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgLy8gSW4gYSB3ZWIgYnJvd3NlciwgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLiBIb3dldmVyLCB0byBhdm9pZFxuXHQgICAgICAgICAgICAvLyBzbG93aW5nIGRvd24gdGhlIHF1ZXVlIG9mIHBlbmRpbmcgdGFza3MsIHdlIHJldGhyb3cgdGhlIGVycm9yIGluIGFcblx0ICAgICAgICAgICAgLy8gbG93ZXIgcHJpb3JpdHkgdHVybi5cblx0ICAgICAgICAgICAgcGVuZGluZ0Vycm9ycy5wdXNoKGVycm9yKTtcblx0ICAgICAgICAgICAgcmVxdWVzdEVycm9yVGhyb3coKTtcblx0ICAgICAgICB9XG5cdCAgICB9IGZpbmFsbHkge1xuXHQgICAgICAgIHRoaXMudGFzayA9IG51bGw7XG5cdCAgICAgICAgZnJlZVRhc2tzW2ZyZWVUYXNrcy5sZW5ndGhdID0gdGhpcztcblx0ICAgIH1cblx0fTtcblxuXG4vKioqLyB9LFxuLyogNSAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovKGZ1bmN0aW9uKGdsb2JhbCkge1widXNlIHN0cmljdFwiO1xuXG5cdC8vIFVzZSB0aGUgZmFzdGVzdCBtZWFucyBwb3NzaWJsZSB0byBleGVjdXRlIGEgdGFzayBpbiBpdHMgb3duIHR1cm4sIHdpdGhcblx0Ly8gcHJpb3JpdHkgb3ZlciBvdGhlciBldmVudHMgaW5jbHVkaW5nIElPLCBhbmltYXRpb24sIHJlZmxvdywgYW5kIHJlZHJhd1xuXHQvLyBldmVudHMgaW4gYnJvd3NlcnMuXG5cdC8vXG5cdC8vIEFuIGV4Y2VwdGlvbiB0aHJvd24gYnkgYSB0YXNrIHdpbGwgcGVybWFuZW50bHkgaW50ZXJydXB0IHRoZSBwcm9jZXNzaW5nIG9mXG5cdC8vIHN1YnNlcXVlbnQgdGFza3MuIFRoZSBoaWdoZXIgbGV2ZWwgYGFzYXBgIGZ1bmN0aW9uIGVuc3VyZXMgdGhhdCBpZiBhblxuXHQvLyBleGNlcHRpb24gaXMgdGhyb3duIGJ5IGEgdGFzaywgdGhhdCB0aGUgdGFzayBxdWV1ZSB3aWxsIGNvbnRpbnVlIGZsdXNoaW5nIGFzXG5cdC8vIHNvb24gYXMgcG9zc2libGUsIGJ1dCBpZiB5b3UgdXNlIGByYXdBc2FwYCBkaXJlY3RseSwgeW91IGFyZSByZXNwb25zaWJsZSB0b1xuXHQvLyBlaXRoZXIgZW5zdXJlIHRoYXQgbm8gZXhjZXB0aW9ucyBhcmUgdGhyb3duIGZyb20geW91ciB0YXNrLCBvciB0byBtYW51YWxseVxuXHQvLyBjYWxsIGByYXdBc2FwLnJlcXVlc3RGbHVzaGAgaWYgYW4gZXhjZXB0aW9uIGlzIHRocm93bi5cblx0bW9kdWxlLmV4cG9ydHMgPSByYXdBc2FwO1xuXHRmdW5jdGlvbiByYXdBc2FwKHRhc2spIHtcblx0ICAgIGlmICghcXVldWUubGVuZ3RoKSB7XG5cdCAgICAgICAgcmVxdWVzdEZsdXNoKCk7XG5cdCAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuXHQgICAgfVxuXHQgICAgLy8gRXF1aXZhbGVudCB0byBwdXNoLCBidXQgYXZvaWRzIGEgZnVuY3Rpb24gY2FsbC5cblx0ICAgIHF1ZXVlW3F1ZXVlLmxlbmd0aF0gPSB0YXNrO1xuXHR9XG5cblx0dmFyIHF1ZXVlID0gW107XG5cdC8vIE9uY2UgYSBmbHVzaCBoYXMgYmVlbiByZXF1ZXN0ZWQsIG5vIGZ1cnRoZXIgY2FsbHMgdG8gYHJlcXVlc3RGbHVzaGAgYXJlXG5cdC8vIG5lY2Vzc2FyeSB1bnRpbCB0aGUgbmV4dCBgZmx1c2hgIGNvbXBsZXRlcy5cblx0dmFyIGZsdXNoaW5nID0gZmFsc2U7XG5cdC8vIGByZXF1ZXN0Rmx1c2hgIGlzIGFuIGltcGxlbWVudGF0aW9uLXNwZWNpZmljIG1ldGhvZCB0aGF0IGF0dGVtcHRzIHRvIGtpY2tcblx0Ly8gb2ZmIGEgYGZsdXNoYCBldmVudCBhcyBxdWlja2x5IGFzIHBvc3NpYmxlLiBgZmx1c2hgIHdpbGwgYXR0ZW1wdCB0byBleGhhdXN0XG5cdC8vIHRoZSBldmVudCBxdWV1ZSBiZWZvcmUgeWllbGRpbmcgdG8gdGhlIGJyb3dzZXIncyBvd24gZXZlbnQgbG9vcC5cblx0dmFyIHJlcXVlc3RGbHVzaDtcblx0Ly8gVGhlIHBvc2l0aW9uIG9mIHRoZSBuZXh0IHRhc2sgdG8gZXhlY3V0ZSBpbiB0aGUgdGFzayBxdWV1ZS4gVGhpcyBpc1xuXHQvLyBwcmVzZXJ2ZWQgYmV0d2VlbiBjYWxscyB0byBgZmx1c2hgIHNvIHRoYXQgaXQgY2FuIGJlIHJlc3VtZWQgaWZcblx0Ly8gYSB0YXNrIHRocm93cyBhbiBleGNlcHRpb24uXG5cdHZhciBpbmRleCA9IDA7XG5cdC8vIElmIGEgdGFzayBzY2hlZHVsZXMgYWRkaXRpb25hbCB0YXNrcyByZWN1cnNpdmVseSwgdGhlIHRhc2sgcXVldWUgY2FuIGdyb3dcblx0Ly8gdW5ib3VuZGVkLiBUbyBwcmV2ZW50IG1lbW9yeSBleGhhdXN0aW9uLCB0aGUgdGFzayBxdWV1ZSB3aWxsIHBlcmlvZGljYWxseVxuXHQvLyB0cnVuY2F0ZSBhbHJlYWR5LWNvbXBsZXRlZCB0YXNrcy5cblx0dmFyIGNhcGFjaXR5ID0gMTAyNDtcblxuXHQvLyBUaGUgZmx1c2ggZnVuY3Rpb24gcHJvY2Vzc2VzIGFsbCB0YXNrcyB0aGF0IGhhdmUgYmVlbiBzY2hlZHVsZWQgd2l0aFxuXHQvLyBgcmF3QXNhcGAgdW5sZXNzIGFuZCB1bnRpbCBvbmUgb2YgdGhvc2UgdGFza3MgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cblx0Ly8gSWYgYSB0YXNrIHRocm93cyBhbiBleGNlcHRpb24sIGBmbHVzaGAgZW5zdXJlcyB0aGF0IGl0cyBzdGF0ZSB3aWxsIHJlbWFpblxuXHQvLyBjb25zaXN0ZW50IGFuZCB3aWxsIHJlc3VtZSB3aGVyZSBpdCBsZWZ0IG9mZiB3aGVuIGNhbGxlZCBhZ2Fpbi5cblx0Ly8gSG93ZXZlciwgYGZsdXNoYCBkb2VzIG5vdCBtYWtlIGFueSBhcnJhbmdlbWVudHMgdG8gYmUgY2FsbGVkIGFnYWluIGlmIGFuXG5cdC8vIGV4Y2VwdGlvbiBpcyB0aHJvd24uXG5cdGZ1bmN0aW9uIGZsdXNoKCkge1xuXHQgICAgd2hpbGUgKGluZGV4IDwgcXVldWUubGVuZ3RoKSB7XG5cdCAgICAgICAgdmFyIGN1cnJlbnRJbmRleCA9IGluZGV4O1xuXHQgICAgICAgIC8vIEFkdmFuY2UgdGhlIGluZGV4IGJlZm9yZSBjYWxsaW5nIHRoZSB0YXNrLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSB3aWxsXG5cdCAgICAgICAgLy8gYmVnaW4gZmx1c2hpbmcgb24gdGhlIG5leHQgdGFzayB0aGUgdGFzayB0aHJvd3MgYW4gZXJyb3IuXG5cdCAgICAgICAgaW5kZXggPSBpbmRleCArIDE7XG5cdCAgICAgICAgcXVldWVbY3VycmVudEluZGV4XS5jYWxsKCk7XG5cdCAgICAgICAgLy8gUHJldmVudCBsZWFraW5nIG1lbW9yeSBmb3IgbG9uZyBjaGFpbnMgb2YgcmVjdXJzaXZlIGNhbGxzIHRvIGBhc2FwYC5cblx0ICAgICAgICAvLyBJZiB3ZSBjYWxsIGBhc2FwYCB3aXRoaW4gdGFza3Mgc2NoZWR1bGVkIGJ5IGBhc2FwYCwgdGhlIHF1ZXVlIHdpbGxcblx0ICAgICAgICAvLyBncm93LCBidXQgdG8gYXZvaWQgYW4gTyhuKSB3YWxrIGZvciBldmVyeSB0YXNrIHdlIGV4ZWN1dGUsIHdlIGRvbid0XG5cdCAgICAgICAgLy8gc2hpZnQgdGFza3Mgb2ZmIHRoZSBxdWV1ZSBhZnRlciB0aGV5IGhhdmUgYmVlbiBleGVjdXRlZC5cblx0ICAgICAgICAvLyBJbnN0ZWFkLCB3ZSBwZXJpb2RpY2FsbHkgc2hpZnQgMTAyNCB0YXNrcyBvZmYgdGhlIHF1ZXVlLlxuXHQgICAgICAgIGlmIChpbmRleCA+IGNhcGFjaXR5KSB7XG5cdCAgICAgICAgICAgIC8vIE1hbnVhbGx5IHNoaWZ0IGFsbCB2YWx1ZXMgc3RhcnRpbmcgYXQgdGhlIGluZGV4IGJhY2sgdG8gdGhlXG5cdCAgICAgICAgICAgIC8vIGJlZ2lubmluZyBvZiB0aGUgcXVldWUuXG5cdCAgICAgICAgICAgIGZvciAodmFyIHNjYW4gPSAwLCBuZXdMZW5ndGggPSBxdWV1ZS5sZW5ndGggLSBpbmRleDsgc2NhbiA8IG5ld0xlbmd0aDsgc2NhbisrKSB7XG5cdCAgICAgICAgICAgICAgICBxdWV1ZVtzY2FuXSA9IHF1ZXVlW3NjYW4gKyBpbmRleF07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcXVldWUubGVuZ3RoIC09IGluZGV4O1xuXHQgICAgICAgICAgICBpbmRleCA9IDA7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHQgICAgcXVldWUubGVuZ3RoID0gMDtcblx0ICAgIGluZGV4ID0gMDtcblx0ICAgIGZsdXNoaW5nID0gZmFsc2U7XG5cdH1cblxuXHQvLyBgcmVxdWVzdEZsdXNoYCBpcyBpbXBsZW1lbnRlZCB1c2luZyBhIHN0cmF0ZWd5IGJhc2VkIG9uIGRhdGEgY29sbGVjdGVkIGZyb21cblx0Ly8gZXZlcnkgYXZhaWxhYmxlIFNhdWNlTGFicyBTZWxlbml1bSB3ZWIgZHJpdmVyIHdvcmtlciBhdCB0aW1lIG9mIHdyaXRpbmcuXG5cdC8vIGh0dHBzOi8vZG9jcy5nb29nbGUuY29tL3NwcmVhZHNoZWV0cy9kLzFtRy01VVlHdXA1cXhHZEVNV2toUDZCV0N6MDUzTlViMkUxUW9VVFUxNnVBL2VkaXQjZ2lkPTc4MzcyNDU5M1xuXG5cdC8vIFNhZmFyaSA2IGFuZCA2LjEgZm9yIGRlc2t0b3AsIGlQYWQsIGFuZCBpUGhvbmUgYXJlIHRoZSBvbmx5IGJyb3dzZXJzIHRoYXRcblx0Ly8gaGF2ZSBXZWJLaXRNdXRhdGlvbk9ic2VydmVyIGJ1dCBub3QgdW4tcHJlZml4ZWQgTXV0YXRpb25PYnNlcnZlci5cblx0Ly8gTXVzdCB1c2UgYGdsb2JhbGAgaW5zdGVhZCBvZiBgd2luZG93YCB0byB3b3JrIGluIGJvdGggZnJhbWVzIGFuZCB3ZWJcblx0Ly8gd29ya2Vycy4gYGdsb2JhbGAgaXMgYSBwcm92aXNpb24gb2YgQnJvd3NlcmlmeSwgTXIsIE1ycywgb3IgTW9wLlxuXHR2YXIgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPSBnbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBnbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcblxuXHQvLyBNdXRhdGlvbk9ic2VydmVycyBhcmUgZGVzaXJhYmxlIGJlY2F1c2UgdGhleSBoYXZlIGhpZ2ggcHJpb3JpdHkgYW5kIHdvcmtcblx0Ly8gcmVsaWFibHkgZXZlcnl3aGVyZSB0aGV5IGFyZSBpbXBsZW1lbnRlZC5cblx0Ly8gVGhleSBhcmUgaW1wbGVtZW50ZWQgaW4gYWxsIG1vZGVybiBicm93c2Vycy5cblx0Ly9cblx0Ly8gLSBBbmRyb2lkIDQtNC4zXG5cdC8vIC0gQ2hyb21lIDI2LTM0XG5cdC8vIC0gRmlyZWZveCAxNC0yOVxuXHQvLyAtIEludGVybmV0IEV4cGxvcmVyIDExXG5cdC8vIC0gaVBhZCBTYWZhcmkgNi03LjFcblx0Ly8gLSBpUGhvbmUgU2FmYXJpIDctNy4xXG5cdC8vIC0gU2FmYXJpIDYtN1xuXHRpZiAodHlwZW9mIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID09PSBcImZ1bmN0aW9uXCIpIHtcblx0ICAgIHJlcXVlc3RGbHVzaCA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21NdXRhdGlvbk9ic2VydmVyKGZsdXNoKTtcblxuXHQvLyBNZXNzYWdlQ2hhbm5lbHMgYXJlIGRlc2lyYWJsZSBiZWNhdXNlIHRoZXkgZ2l2ZSBkaXJlY3QgYWNjZXNzIHRvIHRoZSBIVE1MXG5cdC8vIHRhc2sgcXVldWUsIGFyZSBpbXBsZW1lbnRlZCBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMCwgU2FmYXJpIDUuMC0xLCBhbmQgT3BlcmFcblx0Ly8gMTEtMTIsIGFuZCBpbiB3ZWIgd29ya2VycyBpbiBtYW55IGVuZ2luZXMuXG5cdC8vIEFsdGhvdWdoIG1lc3NhZ2UgY2hhbm5lbHMgeWllbGQgdG8gYW55IHF1ZXVlZCByZW5kZXJpbmcgYW5kIElPIHRhc2tzLCB0aGV5XG5cdC8vIHdvdWxkIGJlIGJldHRlciB0aGFuIGltcG9zaW5nIHRoZSA0bXMgZGVsYXkgb2YgdGltZXJzLlxuXHQvLyBIb3dldmVyLCB0aGV5IGRvIG5vdCB3b3JrIHJlbGlhYmx5IGluIEludGVybmV0IEV4cGxvcmVyIG9yIFNhZmFyaS5cblxuXHQvLyBJbnRlcm5ldCBFeHBsb3JlciAxMCBpcyB0aGUgb25seSBicm93c2VyIHRoYXQgaGFzIHNldEltbWVkaWF0ZSBidXQgZG9lc1xuXHQvLyBub3QgaGF2ZSBNdXRhdGlvbk9ic2VydmVycy5cblx0Ly8gQWx0aG91Z2ggc2V0SW1tZWRpYXRlIHlpZWxkcyB0byB0aGUgYnJvd3NlcidzIHJlbmRlcmVyLCBpdCB3b3VsZCBiZVxuXHQvLyBwcmVmZXJyYWJsZSB0byBmYWxsaW5nIGJhY2sgdG8gc2V0VGltZW91dCBzaW5jZSBpdCBkb2VzIG5vdCBoYXZlXG5cdC8vIHRoZSBtaW5pbXVtIDRtcyBwZW5hbHR5LlxuXHQvLyBVbmZvcnR1bmF0ZWx5IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSBidWcgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAgTW9iaWxlIChhbmRcblx0Ly8gRGVza3RvcCB0byBhIGxlc3NlciBleHRlbnQpIHRoYXQgcmVuZGVycyBib3RoIHNldEltbWVkaWF0ZSBhbmRcblx0Ly8gTWVzc2FnZUNoYW5uZWwgdXNlbGVzcyBmb3IgdGhlIHB1cnBvc2VzIG9mIEFTQVAuXG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9pc3N1ZXMvMzk2XG5cblx0Ly8gVGltZXJzIGFyZSBpbXBsZW1lbnRlZCB1bml2ZXJzYWxseS5cblx0Ly8gV2UgZmFsbCBiYWNrIHRvIHRpbWVycyBpbiB3b3JrZXJzIGluIG1vc3QgZW5naW5lcywgYW5kIGluIGZvcmVncm91bmRcblx0Ly8gY29udGV4dHMgaW4gdGhlIGZvbGxvd2luZyBicm93c2Vycy5cblx0Ly8gSG93ZXZlciwgbm90ZSB0aGF0IGV2ZW4gdGhpcyBzaW1wbGUgY2FzZSByZXF1aXJlcyBudWFuY2VzIHRvIG9wZXJhdGUgaW4gYVxuXHQvLyBicm9hZCBzcGVjdHJ1bSBvZiBicm93c2Vycy5cblx0Ly9cblx0Ly8gLSBGaXJlZm94IDMtMTNcblx0Ly8gLSBJbnRlcm5ldCBFeHBsb3JlciA2LTlcblx0Ly8gLSBpUGFkIFNhZmFyaSA0LjNcblx0Ly8gLSBMeW54IDIuOC43XG5cdH0gZWxzZSB7XG5cdCAgICByZXF1ZXN0Rmx1c2ggPSBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXIoZmx1c2gpO1xuXHR9XG5cblx0Ly8gYHJlcXVlc3RGbHVzaGAgcmVxdWVzdHMgdGhhdCB0aGUgaGlnaCBwcmlvcml0eSBldmVudCBxdWV1ZSBiZSBmbHVzaGVkIGFzXG5cdC8vIHNvb24gYXMgcG9zc2libGUuXG5cdC8vIFRoaXMgaXMgdXNlZnVsIHRvIHByZXZlbnQgYW4gZXJyb3IgdGhyb3duIGluIGEgdGFzayBmcm9tIHN0YWxsaW5nIHRoZSBldmVudFxuXHQvLyBxdWV1ZSBpZiB0aGUgZXhjZXB0aW9uIGhhbmRsZWQgYnkgTm9kZS5qc+KAmXNcblx0Ly8gYHByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiKWAgb3IgYnkgYSBkb21haW4uXG5cdHJhd0FzYXAucmVxdWVzdEZsdXNoID0gcmVxdWVzdEZsdXNoO1xuXG5cdC8vIFRvIHJlcXVlc3QgYSBoaWdoIHByaW9yaXR5IGV2ZW50LCB3ZSBpbmR1Y2UgYSBtdXRhdGlvbiBvYnNlcnZlciBieSB0b2dnbGluZ1xuXHQvLyB0aGUgdGV4dCBvZiBhIHRleHQgbm9kZSBiZXR3ZWVuIFwiMVwiIGFuZCBcIi0xXCIuXG5cdGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21NdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKSB7XG5cdCAgICB2YXIgdG9nZ2xlID0gMTtcblx0ICAgIHZhciBvYnNlcnZlciA9IG5ldyBCcm93c2VyTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjayk7XG5cdCAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuXHQgICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7Y2hhcmFjdGVyRGF0YTogdHJ1ZX0pO1xuXHQgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQgICAgICAgIHRvZ2dsZSA9IC10b2dnbGU7XG5cdCAgICAgICAgbm9kZS5kYXRhID0gdG9nZ2xlO1xuXHQgICAgfTtcblx0fVxuXG5cdC8vIFRoZSBtZXNzYWdlIGNoYW5uZWwgdGVjaG5pcXVlIHdhcyBkaXNjb3ZlcmVkIGJ5IE1hbHRlIFVibCBhbmQgd2FzIHRoZVxuXHQvLyBvcmlnaW5hbCBmb3VuZGF0aW9uIGZvciB0aGlzIGxpYnJhcnkuXG5cdC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG5cblx0Ly8gU2FmYXJpIDYuMC41IChhdCBsZWFzdCkgaW50ZXJtaXR0ZW50bHkgZmFpbHMgdG8gY3JlYXRlIG1lc3NhZ2UgcG9ydHMgb24gYVxuXHQvLyBwYWdlJ3MgZmlyc3QgbG9hZC4gVGhhbmtmdWxseSwgdGhpcyB2ZXJzaW9uIG9mIFNhZmFyaSBzdXBwb3J0c1xuXHQvLyBNdXRhdGlvbk9ic2VydmVycywgc28gd2UgZG9uJ3QgbmVlZCB0byBmYWxsIGJhY2sgaW4gdGhhdCBjYXNlLlxuXG5cdC8vIGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21NZXNzYWdlQ2hhbm5lbChjYWxsYmFjaykge1xuXHQvLyAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcblx0Ly8gICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gY2FsbGJhY2s7XG5cdC8vICAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG5cdC8vICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcblx0Ly8gICAgIH07XG5cdC8vIH1cblxuXHQvLyBGb3IgcmVhc29ucyBleHBsYWluZWQgYWJvdmUsIHdlIGFyZSBhbHNvIHVuYWJsZSB0byB1c2UgYHNldEltbWVkaWF0ZWBcblx0Ly8gdW5kZXIgYW55IGNpcmN1bXN0YW5jZXMuXG5cdC8vIEV2ZW4gaWYgd2Ugd2VyZSwgdGhlcmUgaXMgYW5vdGhlciBidWcgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAuXG5cdC8vIEl0IGlzIG5vdCBzdWZmaWNpZW50IHRvIGFzc2lnbiBgc2V0SW1tZWRpYXRlYCB0byBgcmVxdWVzdEZsdXNoYCBiZWNhdXNlXG5cdC8vIGBzZXRJbW1lZGlhdGVgIG11c3QgYmUgY2FsbGVkICpieSBuYW1lKiBhbmQgdGhlcmVmb3JlIG11c3QgYmUgd3JhcHBlZCBpbiBhXG5cdC8vIGNsb3N1cmUuXG5cdC8vIE5ldmVyIGZvcmdldC5cblxuXHQvLyBmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tU2V0SW1tZWRpYXRlKGNhbGxiYWNrKSB7XG5cdC8vICAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG5cdC8vICAgICAgICAgc2V0SW1tZWRpYXRlKGNhbGxiYWNrKTtcblx0Ly8gICAgIH07XG5cdC8vIH1cblxuXHQvLyBTYWZhcmkgNi4wIGhhcyBhIHByb2JsZW0gd2hlcmUgdGltZXJzIHdpbGwgZ2V0IGxvc3Qgd2hpbGUgdGhlIHVzZXIgaXNcblx0Ly8gc2Nyb2xsaW5nLiBUaGlzIHByb2JsZW0gZG9lcyBub3QgaW1wYWN0IEFTQVAgYmVjYXVzZSBTYWZhcmkgNi4wIHN1cHBvcnRzXG5cdC8vIG11dGF0aW9uIG9ic2VydmVycywgc28gdGhhdCBpbXBsZW1lbnRhdGlvbiBpcyB1c2VkIGluc3RlYWQuXG5cdC8vIEhvd2V2ZXIsIGlmIHdlIGV2ZXIgZWxlY3QgdG8gdXNlIHRpbWVycyBpbiBTYWZhcmksIHRoZSBwcmV2YWxlbnQgd29yay1hcm91bmRcblx0Ly8gaXMgdG8gYWRkIGEgc2Nyb2xsIGV2ZW50IGxpc3RlbmVyIHRoYXQgY2FsbHMgZm9yIGEgZmx1c2guXG5cblx0Ly8gYHNldFRpbWVvdXRgIGRvZXMgbm90IGNhbGwgdGhlIHBhc3NlZCBjYWxsYmFjayBpZiB0aGUgZGVsYXkgaXMgbGVzcyB0aGFuXG5cdC8vIGFwcHJveGltYXRlbHkgNyBpbiB3ZWIgd29ya2VycyBpbiBGaXJlZm94IDggdGhyb3VnaCAxOCwgYW5kIHNvbWV0aW1lcyBub3Rcblx0Ly8gZXZlbiB0aGVuLlxuXG5cdGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcihjYWxsYmFjaykge1xuXHQgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQgICAgICAgIC8vIFdlIGRpc3BhdGNoIGEgdGltZW91dCB3aXRoIGEgc3BlY2lmaWVkIGRlbGF5IG9mIDAgZm9yIGVuZ2luZXMgdGhhdFxuXHQgICAgICAgIC8vIGNhbiByZWxpYWJseSBhY2NvbW1vZGF0ZSB0aGF0IHJlcXVlc3QuIFRoaXMgd2lsbCB1c3VhbGx5IGJlIHNuYXBwZWRcblx0ICAgICAgICAvLyB0byBhIDQgbWlsaXNlY29uZCBkZWxheSwgYnV0IG9uY2Ugd2UncmUgZmx1c2hpbmcsIHRoZXJlJ3Mgbm8gZGVsYXlcblx0ICAgICAgICAvLyBiZXR3ZWVuIGV2ZW50cy5cblx0ICAgICAgICB2YXIgdGltZW91dEhhbmRsZSA9IHNldFRpbWVvdXQoaGFuZGxlVGltZXIsIDApO1xuXHQgICAgICAgIC8vIEhvd2V2ZXIsIHNpbmNlIHRoaXMgdGltZXIgZ2V0cyBmcmVxdWVudGx5IGRyb3BwZWQgaW4gRmlyZWZveFxuXHQgICAgICAgIC8vIHdvcmtlcnMsIHdlIGVubGlzdCBhbiBpbnRlcnZhbCBoYW5kbGUgdGhhdCB3aWxsIHRyeSB0byBmaXJlXG5cdCAgICAgICAgLy8gYW4gZXZlbnQgMjAgdGltZXMgcGVyIHNlY29uZCB1bnRpbCBpdCBzdWNjZWVkcy5cblx0ICAgICAgICB2YXIgaW50ZXJ2YWxIYW5kbGUgPSBzZXRJbnRlcnZhbChoYW5kbGVUaW1lciwgNTApO1xuXG5cdCAgICAgICAgZnVuY3Rpb24gaGFuZGxlVGltZXIoKSB7XG5cdCAgICAgICAgICAgIC8vIFdoaWNoZXZlciB0aW1lciBzdWNjZWVkcyB3aWxsIGNhbmNlbCBib3RoIHRpbWVycyBhbmRcblx0ICAgICAgICAgICAgLy8gZXhlY3V0ZSB0aGUgY2FsbGJhY2suXG5cdCAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SGFuZGxlKTtcblx0ICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbEhhbmRsZSk7XG5cdCAgICAgICAgICAgIGNhbGxiYWNrKCk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblx0fVxuXG5cdC8vIFRoaXMgaXMgZm9yIGBhc2FwLmpzYCBvbmx5LlxuXHQvLyBJdHMgbmFtZSB3aWxsIGJlIHBlcmlvZGljYWxseSByYW5kb21pemVkIHRvIGJyZWFrIGFueSBjb2RlIHRoYXQgZGVwZW5kcyBvblxuXHQvLyBpdHMgZXhpc3RlbmNlLlxuXHRyYXdBc2FwLm1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lciA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcjtcblxuXHQvLyBBU0FQIHdhcyBvcmlnaW5hbGx5IGEgbmV4dFRpY2sgc2hpbSBpbmNsdWRlZCBpbiBRLiBUaGlzIHdhcyBmYWN0b3JlZCBvdXRcblx0Ly8gaW50byB0aGlzIEFTQVAgcGFja2FnZS4gSXQgd2FzIGxhdGVyIGFkYXB0ZWQgdG8gUlNWUCB3aGljaCBtYWRlIGZ1cnRoZXJcblx0Ly8gYW1lbmRtZW50cy4gVGhlc2UgZGVjaXNpb25zLCBwYXJ0aWN1bGFybHkgdG8gbWFyZ2luYWxpemUgTWVzc2FnZUNoYW5uZWwgYW5kXG5cdC8vIHRvIGNhcHR1cmUgdGhlIE11dGF0aW9uT2JzZXJ2ZXIgaW1wbGVtZW50YXRpb24gaW4gYSBjbG9zdXJlLCB3ZXJlIGludGVncmF0ZWRcblx0Ly8gYmFjayBpbnRvIEFTQVAgcHJvcGVyLlxuXHQvLyBodHRwczovL2dpdGh1Yi5jb20vdGlsZGVpby9yc3ZwLmpzL2Jsb2IvY2RkZjcyMzI1NDZhOWNmODU4NTI0Yjc1Y2RlNmY5ZWRmNzI2MjBhNy9saWIvcnN2cC9hc2FwLmpzXG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKGV4cG9ydHMsIChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0oKSkpKVxuXG4vKioqLyB9LFxuLyogNiAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8vIEEgc2ltcGxlIGNsYXNzIHN5c3RlbSwgbW9yZSBkb2N1bWVudGF0aW9uIHRvIGNvbWVcblxuXHRmdW5jdGlvbiBleHRlbmQoY2xzLCBuYW1lLCBwcm9wcykge1xuXHQgICAgLy8gVGhpcyBkb2VzIHRoYXQgc2FtZSB0aGluZyBhcyBPYmplY3QuY3JlYXRlLCBidXQgd2l0aCBzdXBwb3J0IGZvciBJRThcblx0ICAgIHZhciBGID0gZnVuY3Rpb24oKSB7fTtcblx0ICAgIEYucHJvdG90eXBlID0gY2xzLnByb3RvdHlwZTtcblx0ICAgIHZhciBwcm90b3R5cGUgPSBuZXcgRigpO1xuXG5cdCAgICAvLyBqc2hpbnQgdW5kZWY6IGZhbHNlXG5cdCAgICB2YXIgZm5UZXN0ID0gL3h5ei8udGVzdChmdW5jdGlvbigpeyB4eXo7IH0pID8gL1xcYnBhcmVudFxcYi8gOiAvLiovO1xuXHQgICAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcblxuXHQgICAgZm9yKHZhciBrIGluIHByb3BzKSB7XG5cdCAgICAgICAgdmFyIHNyYyA9IHByb3BzW2tdO1xuXHQgICAgICAgIHZhciBwYXJlbnQgPSBwcm90b3R5cGVba107XG5cblx0ICAgICAgICBpZih0eXBlb2YgcGFyZW50ID09PSAnZnVuY3Rpb24nICYmXG5cdCAgICAgICAgICAgdHlwZW9mIHNyYyA9PT0gJ2Z1bmN0aW9uJyAmJlxuXHQgICAgICAgICAgIGZuVGVzdC50ZXN0KHNyYykpIHtcblx0ICAgICAgICAgICAgLypqc2hpbnQgLVcwODMgKi9cblx0ICAgICAgICAgICAgcHJvdG90eXBlW2tdID0gKGZ1bmN0aW9uIChzcmMsIHBhcmVudCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGN1cnJlbnQgcGFyZW50IG1ldGhvZFxuXHQgICAgICAgICAgICAgICAgICAgIHZhciB0bXAgPSB0aGlzLnBhcmVudDtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8vIFNldCBwYXJlbnQgdG8gdGhlIHByZXZpb3VzIG1ldGhvZCwgY2FsbCwgYW5kIHJlc3RvcmVcblx0ICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgcmVzID0gc3JjLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSB0bXA7XG5cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuXHQgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfSkoc3JjLCBwYXJlbnQpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgcHJvdG90eXBlW2tdID0gc3JjO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgcHJvdG90eXBlLnR5cGVuYW1lID0gbmFtZTtcblxuXHQgICAgdmFyIG5ld19jbHMgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICBpZihwcm90b3R5cGUuaW5pdCkge1xuXHQgICAgICAgICAgICBwcm90b3R5cGUuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgIG5ld19jbHMucHJvdG90eXBlID0gcHJvdG90eXBlO1xuXHQgICAgbmV3X2Nscy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBuZXdfY2xzO1xuXG5cdCAgICBuZXdfY2xzLmV4dGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHByb3BzKSB7XG5cdCAgICAgICAgaWYodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG5cdCAgICAgICAgICAgIHByb3BzID0gbmFtZTtcblx0ICAgICAgICAgICAgbmFtZSA9ICdhbm9ueW1vdXMnO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gZXh0ZW5kKG5ld19jbHMsIG5hbWUsIHByb3BzKTtcblx0ICAgIH07XG5cblx0ICAgIHJldHVybiBuZXdfY2xzO1xuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBleHRlbmQoT2JqZWN0LCAnT2JqZWN0Jywge30pO1xuXG5cbi8qKiovIH0sXG4vKiA3ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cdHZhciByID0gX193ZWJwYWNrX3JlcXVpcmVfXyg4KTtcblxuXHRmdW5jdGlvbiBub3JtYWxpemUodmFsdWUsIGRlZmF1bHRWYWx1ZSkge1xuXHQgICAgaWYodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gZmFsc2UpIHtcblx0ICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHZhbHVlO1xuXHR9XG5cblx0dmFyIGZpbHRlcnMgPSB7XG5cdCAgICBhYnM6IGZ1bmN0aW9uKG4pIHtcblx0ICAgICAgICByZXR1cm4gTWF0aC5hYnMobik7XG5cdCAgICB9LFxuXG5cdCAgICBiYXRjaDogZnVuY3Rpb24oYXJyLCBsaW5lY291bnQsIGZpbGxfd2l0aCkge1xuXHQgICAgICAgIHZhciBpO1xuXHQgICAgICAgIHZhciByZXMgPSBbXTtcblx0ICAgICAgICB2YXIgdG1wID0gW107XG5cblx0ICAgICAgICBmb3IoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgaWYoaSAlIGxpbmVjb3VudCA9PT0gMCAmJiB0bXAubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICByZXMucHVzaCh0bXApO1xuXHQgICAgICAgICAgICAgICAgdG1wID0gW107XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB0bXAucHVzaChhcnJbaV0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKHRtcC5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgaWYoZmlsbF93aXRoKSB7XG5cdCAgICAgICAgICAgICAgICBmb3IoaSA9IHRtcC5sZW5ndGg7IGkgPCBsaW5lY291bnQ7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgICAgIHRtcC5wdXNoKGZpbGxfd2l0aCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXMucHVzaCh0bXApO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByZXM7XG5cdCAgICB9LFxuXG5cdCAgICBjYXBpdGFsaXplOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgdmFyIHJldCA9IHN0ci50b0xvd2VyQ2FzZSgpO1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHJldC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHJldC5zbGljZSgxKSk7XG5cdCAgICB9LFxuXG5cdCAgICBjZW50ZXI6IGZ1bmN0aW9uKHN0ciwgd2lkdGgpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgd2lkdGggPSB3aWR0aCB8fCA4MDtcblxuXHQgICAgICAgIGlmKHN0ci5sZW5ndGggPj0gd2lkdGgpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgc3BhY2VzID0gd2lkdGggLSBzdHIubGVuZ3RoO1xuXHQgICAgICAgIHZhciBwcmUgPSBsaWIucmVwZWF0KCcgJywgc3BhY2VzLzIgLSBzcGFjZXMgJSAyKTtcblx0ICAgICAgICB2YXIgcG9zdCA9IGxpYi5yZXBlYXQoJyAnLCBzcGFjZXMvMik7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcHJlICsgc3RyICsgcG9zdCk7XG5cdCAgICB9LFxuXG5cdCAgICAnZGVmYXVsdCc6IGZ1bmN0aW9uKHZhbCwgZGVmLCBib29sKSB7XG5cdCAgICAgICAgaWYoYm9vbCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFsID8gdmFsIDogZGVmO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgcmV0dXJuICh2YWwgIT09IHVuZGVmaW5lZCkgPyB2YWwgOiBkZWY7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgZGljdHNvcnQ6IGZ1bmN0aW9uKHZhbCwgY2FzZV9zZW5zaXRpdmUsIGJ5KSB7XG5cdCAgICAgICAgaWYgKCFsaWIuaXNPYmplY3QodmFsKSkge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoJ2RpY3Rzb3J0IGZpbHRlcjogdmFsIG11c3QgYmUgYW4gb2JqZWN0Jyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGFycmF5ID0gW107XG5cdCAgICAgICAgZm9yICh2YXIgayBpbiB2YWwpIHtcblx0ICAgICAgICAgICAgLy8gZGVsaWJlcmF0ZWx5IGluY2x1ZGUgcHJvcGVydGllcyBmcm9tIHRoZSBvYmplY3QncyBwcm90b3R5cGVcblx0ICAgICAgICAgICAgYXJyYXkucHVzaChbayx2YWxba11dKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgc2k7XG5cdCAgICAgICAgaWYgKGJ5ID09PSB1bmRlZmluZWQgfHwgYnkgPT09ICdrZXknKSB7XG5cdCAgICAgICAgICAgIHNpID0gMDtcblx0ICAgICAgICB9IGVsc2UgaWYgKGJ5ID09PSAndmFsdWUnKSB7XG5cdCAgICAgICAgICAgIHNpID0gMTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoXG5cdCAgICAgICAgICAgICAgICAnZGljdHNvcnQgZmlsdGVyOiBZb3UgY2FuIG9ubHkgc29ydCBieSBlaXRoZXIga2V5IG9yIHZhbHVlJyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgYXJyYXkuc29ydChmdW5jdGlvbih0MSwgdDIpIHtcblx0ICAgICAgICAgICAgdmFyIGEgPSB0MVtzaV07XG5cdCAgICAgICAgICAgIHZhciBiID0gdDJbc2ldO1xuXG5cdCAgICAgICAgICAgIGlmICghY2FzZV9zZW5zaXRpdmUpIHtcblx0ICAgICAgICAgICAgICAgIGlmIChsaWIuaXNTdHJpbmcoYSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBhID0gYS50b1VwcGVyQ2FzZSgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgaWYgKGxpYi5pc1N0cmluZyhiKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGIgPSBiLnRvVXBwZXJDYXNlKCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gYSA+IGIgPyAxIDogKGEgPT09IGIgPyAwIDogLTEpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgcmV0dXJuIGFycmF5O1xuXHQgICAgfSxcblxuXHQgICAgZHVtcDogZnVuY3Rpb24ob2JqLCBzcGFjZXMpIHtcblx0ICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCBzcGFjZXMpO1xuXHQgICAgfSxcblxuXHQgICAgZXNjYXBlOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBpZihzdHIgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgc3RyID0gKHN0ciA9PT0gbnVsbCB8fCBzdHIgPT09IHVuZGVmaW5lZCkgPyAnJyA6IHN0cjtcblx0ICAgICAgICByZXR1cm4gci5tYXJrU2FmZShsaWIuZXNjYXBlKHN0ci50b1N0cmluZygpKSk7XG5cdCAgICB9LFxuXG5cdCAgICBzYWZlOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBpZiAoc3RyIGluc3RhbmNlb2Ygci5TYWZlU3RyaW5nKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHN0ciA9IChzdHIgPT09IG51bGwgfHwgc3RyID09PSB1bmRlZmluZWQpID8gJycgOiBzdHI7XG5cdCAgICAgICAgcmV0dXJuIHIubWFya1NhZmUoc3RyLnRvU3RyaW5nKCkpO1xuXHQgICAgfSxcblxuXHQgICAgZmlyc3Q6IGZ1bmN0aW9uKGFycikge1xuXHQgICAgICAgIHJldHVybiBhcnJbMF07XG5cdCAgICB9LFxuXG5cdCAgICBncm91cGJ5OiBmdW5jdGlvbihhcnIsIGF0dHIpIHtcblx0ICAgICAgICByZXR1cm4gbGliLmdyb3VwQnkoYXJyLCBhdHRyKTtcblx0ICAgIH0sXG5cblx0ICAgIGluZGVudDogZnVuY3Rpb24oc3RyLCB3aWR0aCwgaW5kZW50Zmlyc3QpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cblx0ICAgICAgICBpZiAoc3RyID09PSAnJykgcmV0dXJuICcnO1xuXG5cdCAgICAgICAgd2lkdGggPSB3aWR0aCB8fCA0O1xuXHQgICAgICAgIHZhciByZXMgPSAnJztcblx0ICAgICAgICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoJ1xcbicpO1xuXHQgICAgICAgIHZhciBzcCA9IGxpYi5yZXBlYXQoJyAnLCB3aWR0aCk7XG5cblx0ICAgICAgICBmb3IodmFyIGk9MDsgaTxsaW5lcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICBpZihpID09PSAwICYmICFpbmRlbnRmaXJzdCkge1xuXHQgICAgICAgICAgICAgICAgcmVzICs9IGxpbmVzW2ldICsgJ1xcbic7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICByZXMgKz0gc3AgKyBsaW5lc1tpXSArICdcXG4nO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcmVzKTtcblx0ICAgIH0sXG5cblx0ICAgIGpvaW46IGZ1bmN0aW9uKGFyciwgZGVsLCBhdHRyKSB7XG5cdCAgICAgICAgZGVsID0gZGVsIHx8ICcnO1xuXG5cdCAgICAgICAgaWYoYXR0cikge1xuXHQgICAgICAgICAgICBhcnIgPSBsaWIubWFwKGFyciwgZnVuY3Rpb24odikge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHZbYXR0cl07XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBhcnIuam9pbihkZWwpO1xuXHQgICAgfSxcblxuXHQgICAgbGFzdDogZnVuY3Rpb24oYXJyKSB7XG5cdCAgICAgICAgcmV0dXJuIGFyclthcnIubGVuZ3RoLTFdO1xuXHQgICAgfSxcblxuXHQgICAgbGVuZ3RoOiBmdW5jdGlvbih2YWwpIHtcblx0ICAgICAgICB2YXIgdmFsdWUgPSBub3JtYWxpemUodmFsLCAnJyk7XG5cblx0ICAgICAgICBpZih2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIGlmKFxuXHQgICAgICAgICAgICAgICAgKHR5cGVvZiBNYXAgPT09ICdmdW5jdGlvbicgJiYgdmFsdWUgaW5zdGFuY2VvZiBNYXApIHx8XG5cdCAgICAgICAgICAgICAgICAodHlwZW9mIFNldCA9PT0gJ2Z1bmN0aW9uJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIFNldClcblx0ICAgICAgICAgICAgKSB7XG5cdCAgICAgICAgICAgICAgICAvLyBFQ01BU2NyaXB0IDIwMTUgTWFwcyBhbmQgU2V0c1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnNpemU7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYobGliLmlzT2JqZWN0KHZhbHVlKSAmJiAhKHZhbHVlIGluc3RhbmNlb2Ygci5TYWZlU3RyaW5nKSkge1xuXHQgICAgICAgICAgICAgICAgLy8gT2JqZWN0cyAoYmVzaWRlcyBTYWZlU3RyaW5ncyksIG5vbi1wcmltYXRpdmUgQXJyYXlzXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gMDtcblx0ICAgIH0sXG5cblx0ICAgIGxpc3Q6IGZ1bmN0aW9uKHZhbCkge1xuXHQgICAgICAgIGlmKGxpYi5pc1N0cmluZyh2YWwpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YWwuc3BsaXQoJycpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKGxpYi5pc09iamVjdCh2YWwpKSB7XG5cdCAgICAgICAgICAgIHZhciBrZXlzID0gW107XG5cblx0ICAgICAgICAgICAgaWYoT2JqZWN0LmtleXMpIHtcblx0ICAgICAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyh2YWwpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgZm9yKHZhciBrIGluIHZhbCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChrKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBsaWIubWFwKGtleXMsIGZ1bmN0aW9uKGspIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB7IGtleTogayxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWxba10gfTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYobGliLmlzQXJyYXkodmFsKSkge1xuXHQgICAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcignbGlzdCBmaWx0ZXI6IHR5cGUgbm90IGl0ZXJhYmxlJyk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgbG93ZXI6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICByZXR1cm4gc3RyLnRvTG93ZXJDYXNlKCk7XG5cdCAgICB9LFxuXG5cdCAgICBubDJicjogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgaWYgKHN0ciA9PT0gbnVsbCB8fCBzdHIgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICByZXR1cm4gJyc7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHN0ci5yZXBsYWNlKC9cXHJcXG58XFxuL2csICc8YnIgLz5cXG4nKSk7XG5cdCAgICB9LFxuXG5cdCAgICByYW5kb206IGZ1bmN0aW9uKGFycikge1xuXHQgICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuXHQgICAgfSxcblxuXHQgICAgcmVqZWN0YXR0cjogZnVuY3Rpb24oYXJyLCBhdHRyKSB7XG5cdCAgICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG5cdCAgICAgICAgcmV0dXJuICFpdGVtW2F0dHJdO1xuXHQgICAgICB9KTtcblx0ICAgIH0sXG5cblx0ICAgIHNlbGVjdGF0dHI6IGZ1bmN0aW9uKGFyciwgYXR0cikge1xuXHQgICAgICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuXHQgICAgICAgIHJldHVybiAhIWl0ZW1bYXR0cl07XG5cdCAgICAgIH0pO1xuXHQgICAgfSxcblxuXHQgICAgcmVwbGFjZTogZnVuY3Rpb24oc3RyLCBvbGQsIG5ld18sIG1heENvdW50KSB7XG5cdCAgICAgICAgdmFyIG9yaWdpbmFsU3RyID0gc3RyO1xuXG5cdCAgICAgICAgaWYgKG9sZCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2Uob2xkLCBuZXdfKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZih0eXBlb2YgbWF4Q291bnQgPT09ICd1bmRlZmluZWQnKXtcblx0ICAgICAgICAgICAgbWF4Q291bnQgPSAtMTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgcmVzID0gJyc7ICAvLyBPdXRwdXRcblxuXHQgICAgICAgIC8vIENhc3QgTnVtYmVycyBpbiB0aGUgc2VhcmNoIHRlcm0gdG8gc3RyaW5nXG5cdCAgICAgICAgaWYodHlwZW9mIG9sZCA9PT0gJ251bWJlcicpe1xuXHQgICAgICAgICAgICBvbGQgPSBvbGQgKyAnJztcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZih0eXBlb2Ygb2xkICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICAvLyBJZiBpdCBpcyBzb21ldGhpbmcgb3RoZXIgdGhhbiBudW1iZXIgb3Igc3RyaW5nLFxuXHQgICAgICAgICAgICAvLyByZXR1cm4gdGhlIG9yaWdpbmFsIHN0cmluZ1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIENhc3QgbnVtYmVycyBpbiB0aGUgcmVwbGFjZW1lbnQgdG8gc3RyaW5nXG5cdCAgICAgICAgaWYodHlwZW9mIHN0ciA9PT0gJ251bWJlcicpe1xuXHQgICAgICAgICAgICBzdHIgPSBzdHIgKyAnJztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBJZiBieSBub3csIHdlIGRvbid0IGhhdmUgYSBzdHJpbmcsIHRocm93IGl0IGJhY2tcblx0ICAgICAgICBpZih0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJyAmJiAhKHN0ciBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykpe1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIFNob3J0Q2lyY3VpdHNcblx0ICAgICAgICBpZihvbGQgPT09ICcnKXtcblx0ICAgICAgICAgICAgLy8gTWltaWMgdGhlIHB5dGhvbiBiZWhhdmlvdXI6IGVtcHR5IHN0cmluZyBpcyByZXBsYWNlZFxuXHQgICAgICAgICAgICAvLyBieSByZXBsYWNlbWVudCBlLmcuIFwiYWJjXCJ8cmVwbGFjZShcIlwiLCBcIi5cIikgLT4gLmEuYi5jLlxuXHQgICAgICAgICAgICByZXMgPSBuZXdfICsgc3RyLnNwbGl0KCcnKS5qb2luKG5ld18pICsgbmV3Xztcblx0ICAgICAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcmVzKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgbmV4dEluZGV4ID0gc3RyLmluZGV4T2Yob2xkKTtcblx0ICAgICAgICAvLyBpZiAjIG9mIHJlcGxhY2VtZW50cyB0byBwZXJmb3JtIGlzIDAsIG9yIHRoZSBzdHJpbmcgdG8gZG9lc1xuXHQgICAgICAgIC8vIG5vdCBjb250YWluIHRoZSBvbGQgdmFsdWUsIHJldHVybiB0aGUgc3RyaW5nXG5cdCAgICAgICAgaWYobWF4Q291bnQgPT09IDAgfHwgbmV4dEluZGV4ID09PSAtMSl7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHBvcyA9IDA7XG5cdCAgICAgICAgdmFyIGNvdW50ID0gMDsgLy8gIyBvZiByZXBsYWNlbWVudHMgbWFkZVxuXG5cdCAgICAgICAgd2hpbGUobmV4dEluZGV4ICA+IC0xICYmIChtYXhDb3VudCA9PT0gLTEgfHwgY291bnQgPCBtYXhDb3VudCkpe1xuXHQgICAgICAgICAgICAvLyBHcmFiIHRoZSBuZXh0IGNodW5rIG9mIHNyYyBzdHJpbmcgYW5kIGFkZCBpdCB3aXRoIHRoZVxuXHQgICAgICAgICAgICAvLyByZXBsYWNlbWVudCwgdG8gdGhlIHJlc3VsdFxuXHQgICAgICAgICAgICByZXMgKz0gc3RyLnN1YnN0cmluZyhwb3MsIG5leHRJbmRleCkgKyBuZXdfO1xuXHQgICAgICAgICAgICAvLyBJbmNyZW1lbnQgb3VyIHBvaW50ZXIgaW4gdGhlIHNyYyBzdHJpbmdcblx0ICAgICAgICAgICAgcG9zID0gbmV4dEluZGV4ICsgb2xkLmxlbmd0aDtcblx0ICAgICAgICAgICAgY291bnQrKztcblx0ICAgICAgICAgICAgLy8gU2VlIGlmIHRoZXJlIGFyZSBhbnkgbW9yZSByZXBsYWNlbWVudHMgdG8gYmUgbWFkZVxuXHQgICAgICAgICAgICBuZXh0SW5kZXggPSBzdHIuaW5kZXhPZihvbGQsIHBvcyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gV2UndmUgZWl0aGVyIHJlYWNoZWQgdGhlIGVuZCwgb3IgZG9uZSB0aGUgbWF4ICMgb2Zcblx0ICAgICAgICAvLyByZXBsYWNlbWVudHMsIHRhY2sgb24gYW55IHJlbWFpbmluZyBzdHJpbmdcblx0ICAgICAgICBpZihwb3MgPCBzdHIubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIHJlcyArPSBzdHIuc3Vic3RyaW5nKHBvcyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKG9yaWdpbmFsU3RyLCByZXMpO1xuXHQgICAgfSxcblxuXHQgICAgcmV2ZXJzZTogZnVuY3Rpb24odmFsKSB7XG5cdCAgICAgICAgdmFyIGFycjtcblx0ICAgICAgICBpZihsaWIuaXNTdHJpbmcodmFsKSkge1xuXHQgICAgICAgICAgICBhcnIgPSBmaWx0ZXJzLmxpc3QodmFsKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIC8vIENvcHkgaXRcblx0ICAgICAgICAgICAgYXJyID0gbGliLm1hcCh2YWwsIGZ1bmN0aW9uKHYpIHsgcmV0dXJuIHY7IH0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGFyci5yZXZlcnNlKCk7XG5cblx0ICAgICAgICBpZihsaWIuaXNTdHJpbmcodmFsKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3ModmFsLCBhcnIuam9pbignJykpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gYXJyO1xuXHQgICAgfSxcblxuXHQgICAgcm91bmQ6IGZ1bmN0aW9uKHZhbCwgcHJlY2lzaW9uLCBtZXRob2QpIHtcblx0ICAgICAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24gfHwgMDtcblx0ICAgICAgICB2YXIgZmFjdG9yID0gTWF0aC5wb3coMTAsIHByZWNpc2lvbik7XG5cdCAgICAgICAgdmFyIHJvdW5kZXI7XG5cblx0ICAgICAgICBpZihtZXRob2QgPT09ICdjZWlsJykge1xuXHQgICAgICAgICAgICByb3VuZGVyID0gTWF0aC5jZWlsO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKG1ldGhvZCA9PT0gJ2Zsb29yJykge1xuXHQgICAgICAgICAgICByb3VuZGVyID0gTWF0aC5mbG9vcjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHJvdW5kZXIgPSBNYXRoLnJvdW5kO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByb3VuZGVyKHZhbCAqIGZhY3RvcikgLyBmYWN0b3I7XG5cdCAgICB9LFxuXG5cdCAgICBzbGljZTogZnVuY3Rpb24oYXJyLCBzbGljZXMsIGZpbGxXaXRoKSB7XG5cdCAgICAgICAgdmFyIHNsaWNlTGVuZ3RoID0gTWF0aC5mbG9vcihhcnIubGVuZ3RoIC8gc2xpY2VzKTtcblx0ICAgICAgICB2YXIgZXh0cmEgPSBhcnIubGVuZ3RoICUgc2xpY2VzO1xuXHQgICAgICAgIHZhciBvZmZzZXQgPSAwO1xuXHQgICAgICAgIHZhciByZXMgPSBbXTtcblxuXHQgICAgICAgIGZvcih2YXIgaT0wOyBpPHNsaWNlczsgaSsrKSB7XG5cdCAgICAgICAgICAgIHZhciBzdGFydCA9IG9mZnNldCArIGkgKiBzbGljZUxlbmd0aDtcblx0ICAgICAgICAgICAgaWYoaSA8IGV4dHJhKSB7XG5cdCAgICAgICAgICAgICAgICBvZmZzZXQrKztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB2YXIgZW5kID0gb2Zmc2V0ICsgKGkgKyAxKSAqIHNsaWNlTGVuZ3RoO1xuXG5cdCAgICAgICAgICAgIHZhciBzbGljZSA9IGFyci5zbGljZShzdGFydCwgZW5kKTtcblx0ICAgICAgICAgICAgaWYoZmlsbFdpdGggJiYgaSA+PSBleHRyYSkge1xuXHQgICAgICAgICAgICAgICAgc2xpY2UucHVzaChmaWxsV2l0aCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmVzLnB1c2goc2xpY2UpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByZXM7XG5cdCAgICB9LFxuXG5cdCAgICBzdW06IGZ1bmN0aW9uKGFyciwgYXR0ciwgc3RhcnQpIHtcblx0ICAgICAgICB2YXIgc3VtID0gMDtcblxuXHQgICAgICAgIGlmKHR5cGVvZiBzdGFydCA9PT0gJ251bWJlcicpe1xuXHQgICAgICAgICAgICBzdW0gKz0gc3RhcnQ7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYoYXR0cikge1xuXHQgICAgICAgICAgICBhcnIgPSBsaWIubWFwKGFyciwgZnVuY3Rpb24odikge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHZbYXR0cl07XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgc3VtICs9IGFycltpXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gc3VtO1xuXHQgICAgfSxcblxuXHQgICAgc29ydDogci5tYWtlTWFjcm8oWyd2YWx1ZScsICdyZXZlcnNlJywgJ2Nhc2Vfc2Vuc2l0aXZlJywgJ2F0dHJpYnV0ZSddLCBbXSwgZnVuY3Rpb24oYXJyLCByZXZlcnNlLCBjYXNlU2VucywgYXR0cikge1xuXHQgICAgICAgICAvLyBDb3B5IGl0XG5cdCAgICAgICAgYXJyID0gbGliLm1hcChhcnIsIGZ1bmN0aW9uKHYpIHsgcmV0dXJuIHY7IH0pO1xuXG5cdCAgICAgICAgYXJyLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuXHQgICAgICAgICAgICB2YXIgeCwgeTtcblxuXHQgICAgICAgICAgICBpZihhdHRyKSB7XG5cdCAgICAgICAgICAgICAgICB4ID0gYVthdHRyXTtcblx0ICAgICAgICAgICAgICAgIHkgPSBiW2F0dHJdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgeCA9IGE7XG5cdCAgICAgICAgICAgICAgICB5ID0gYjtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmKCFjYXNlU2VucyAmJiBsaWIuaXNTdHJpbmcoeCkgJiYgbGliLmlzU3RyaW5nKHkpKSB7XG5cdCAgICAgICAgICAgICAgICB4ID0geC50b0xvd2VyQ2FzZSgpO1xuXHQgICAgICAgICAgICAgICAgeSA9IHkudG9Mb3dlckNhc2UoKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmKHggPCB5KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gcmV2ZXJzZSA/IDEgOiAtMTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKHggPiB5KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gcmV2ZXJzZSA/IC0xOiAxO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiBhcnI7XG5cdCAgICB9KSxcblxuXHQgICAgc3RyaW5nOiBmdW5jdGlvbihvYmopIHtcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Mob2JqLCBvYmopO1xuXHQgICAgfSxcblxuXHQgICAgc3RyaXB0YWdzOiBmdW5jdGlvbihpbnB1dCwgcHJlc2VydmVfbGluZWJyZWFrcykge1xuXHQgICAgICAgIGlucHV0ID0gbm9ybWFsaXplKGlucHV0LCAnJyk7XG5cdCAgICAgICAgcHJlc2VydmVfbGluZWJyZWFrcyA9IHByZXNlcnZlX2xpbmVicmVha3MgfHwgZmFsc2U7XG5cdCAgICAgICAgdmFyIHRhZ3MgPSAvPFxcLz8oW2Etel1bYS16MC05XSopXFxiW14+XSo+fDwhLS1bXFxzXFxTXSo/LS0+L2dpO1xuXHQgICAgICAgIHZhciB0cmltbWVkSW5wdXQgPSBmaWx0ZXJzLnRyaW0oaW5wdXQucmVwbGFjZSh0YWdzLCAnJykpO1xuXHQgICAgICAgIHZhciByZXMgPSAnJztcblx0ICAgICAgICBpZiAocHJlc2VydmVfbGluZWJyZWFrcykge1xuXHQgICAgICAgICAgICByZXMgPSB0cmltbWVkSW5wdXRcblx0ICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9eICt8ICskL2dtLCAnJykgICAgIC8vIHJlbW92ZSBsZWFkaW5nIGFuZCB0cmFpbGluZyBzcGFjZXNcblx0ICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8gKy9nLCAnICcpICAgICAgICAgIC8vIHNxdWFzaCBhZGphY2VudCBzcGFjZXNcblx0ICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXFxyXFxuKS9nLCAnXFxuJykgICAgIC8vIG5vcm1hbGl6ZSBsaW5lYnJlYWtzIChDUkxGIC0+IExGKVxuXHQgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcblxcblxcbisvZywgJ1xcblxcbicpOyAvLyBzcXVhc2ggYWJub3JtYWwgYWRqYWNlbnQgbGluZWJyZWFrc1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHJlcyA9IHRyaW1tZWRJbnB1dC5yZXBsYWNlKC9cXHMrL2dpLCAnICcpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3MoaW5wdXQsIHJlcyk7XG5cdCAgICB9LFxuXG5cdCAgICB0aXRsZTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHZhciB3b3JkcyA9IHN0ci5zcGxpdCgnICcpO1xuXHQgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB3b3Jkcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICB3b3Jkc1tpXSA9IGZpbHRlcnMuY2FwaXRhbGl6ZSh3b3Jkc1tpXSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHdvcmRzLmpvaW4oJyAnKSk7XG5cdCAgICB9LFxuXG5cdCAgICB0cmltOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCBzdHIucmVwbGFjZSgvXlxccyp8XFxzKiQvZywgJycpKTtcblx0ICAgIH0sXG5cblx0ICAgIHRydW5jYXRlOiBmdW5jdGlvbihpbnB1dCwgbGVuZ3RoLCBraWxsd29yZHMsIGVuZCkge1xuXHQgICAgICAgIHZhciBvcmlnID0gaW5wdXQ7XG5cdCAgICAgICAgaW5wdXQgPSBub3JtYWxpemUoaW5wdXQsICcnKTtcblx0ICAgICAgICBsZW5ndGggPSBsZW5ndGggfHwgMjU1O1xuXG5cdCAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA8PSBsZW5ndGgpXG5cdCAgICAgICAgICAgIHJldHVybiBpbnB1dDtcblxuXHQgICAgICAgIGlmIChraWxsd29yZHMpIHtcblx0ICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgbGVuZ3RoKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICB2YXIgaWR4ID0gaW5wdXQubGFzdEluZGV4T2YoJyAnLCBsZW5ndGgpO1xuXHQgICAgICAgICAgICBpZihpZHggPT09IC0xKSB7XG5cdCAgICAgICAgICAgICAgICBpZHggPSBsZW5ndGg7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cmluZygwLCBpZHgpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlucHV0ICs9IChlbmQgIT09IHVuZGVmaW5lZCAmJiBlbmQgIT09IG51bGwpID8gZW5kIDogJy4uLic7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKG9yaWcsIGlucHV0KTtcblx0ICAgIH0sXG5cblx0ICAgIHVwcGVyOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgcmV0dXJuIHN0ci50b1VwcGVyQ2FzZSgpO1xuXHQgICAgfSxcblxuXHQgICAgdXJsZW5jb2RlOiBmdW5jdGlvbihvYmopIHtcblx0ICAgICAgICB2YXIgZW5jID0gZW5jb2RlVVJJQ29tcG9uZW50O1xuXHQgICAgICAgIGlmIChsaWIuaXNTdHJpbmcob2JqKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gZW5jKG9iaik7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHBhcnRzO1xuXHQgICAgICAgICAgICBpZiAobGliLmlzQXJyYXkob2JqKSkge1xuXHQgICAgICAgICAgICAgICAgcGFydHMgPSBvYmoubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW5jKGl0ZW1bMF0pICsgJz0nICsgZW5jKGl0ZW1bMV0pO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBwYXJ0cyA9IFtdO1xuXHQgICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goZW5jKGspICsgJz0nICsgZW5jKG9ialtrXSkpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gcGFydHMuam9pbignJicpO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIHVybGl6ZTogZnVuY3Rpb24oc3RyLCBsZW5ndGgsIG5vZm9sbG93KSB7XG5cdCAgICAgICAgaWYgKGlzTmFOKGxlbmd0aCkpIGxlbmd0aCA9IEluZmluaXR5O1xuXG5cdCAgICAgICAgdmFyIG5vRm9sbG93QXR0ciA9IChub2ZvbGxvdyA9PT0gdHJ1ZSA/ICcgcmVsPVwibm9mb2xsb3dcIicgOiAnJyk7XG5cblx0ICAgICAgICAvLyBGb3IgdGhlIGppbmphIHJlZ2V4cCwgc2VlXG5cdCAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21pdHN1aGlrby9qaW5qYTIvYmxvYi9mMTViODE0ZGNiYTZhYTEyYmM3NGQxZjdkMGM4ODFkNTVmNzEyNmJlL2ppbmphMi91dGlscy5weSNMMjAtTDIzXG5cdCAgICAgICAgdmFyIHB1bmNSRSA9IC9eKD86XFwofDx8Jmx0Oyk/KC4qPykoPzpcXC58LHxcXCl8XFxufCZndDspPyQvO1xuXHQgICAgICAgIC8vIGZyb20gaHR0cDovL2Jsb2cuZ2Vydi5uZXQvMjAxMS8wNS9odG1sNV9lbWFpbF9hZGRyZXNzX3JlZ2V4cC9cblx0ICAgICAgICB2YXIgZW1haWxSRSA9IC9eW1xcdy4hIyQlJicqK1xcLVxcLz0/XFxeYHt8fX5dK0BbYS16XFxkXFwtXSsoXFwuW2EtelxcZFxcLV0rKSskL2k7XG5cdCAgICAgICAgdmFyIGh0dHBIdHRwc1JFID0gL15odHRwcz86XFwvXFwvLiokLztcblx0ICAgICAgICB2YXIgd3d3UkUgPSAvXnd3d1xcLi87XG5cdCAgICAgICAgdmFyIHRsZFJFID0gL1xcLig/Om9yZ3xuZXR8Y29tKSg/OlxcOnxcXC98JCkvO1xuXG5cdCAgICAgICAgdmFyIHdvcmRzID0gc3RyLnNwbGl0KC8oXFxzKykvKS5maWx0ZXIoZnVuY3Rpb24od29yZCkge1xuXHQgICAgICAgICAgLy8gSWYgdGhlIHdvcmQgaGFzIG5vIGxlbmd0aCwgYmFpbC4gVGhpcyBjYW4gaGFwcGVuIGZvciBzdHIgd2l0aFxuXHQgICAgICAgICAgLy8gdHJhaWxpbmcgd2hpdGVzcGFjZS5cblx0ICAgICAgICAgIHJldHVybiB3b3JkICYmIHdvcmQubGVuZ3RoO1xuXHQgICAgICAgIH0pLm1hcChmdW5jdGlvbih3b3JkKSB7XG5cdCAgICAgICAgICB2YXIgbWF0Y2hlcyA9IHdvcmQubWF0Y2gocHVuY1JFKTtcblx0ICAgICAgICAgIHZhciBwb3NzaWJsZVVybCA9IG1hdGNoZXMgJiYgbWF0Y2hlc1sxXSB8fCB3b3JkO1xuXG5cdCAgICAgICAgICAvLyB1cmwgdGhhdCBzdGFydHMgd2l0aCBodHRwIG9yIGh0dHBzXG5cdCAgICAgICAgICBpZiAoaHR0cEh0dHBzUkUudGVzdChwb3NzaWJsZVVybCkpXG5cdCAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cIicgKyBwb3NzaWJsZVVybCArICdcIicgKyBub0ZvbGxvd0F0dHIgKyAnPicgKyBwb3NzaWJsZVVybC5zdWJzdHIoMCwgbGVuZ3RoKSArICc8L2E+JztcblxuXHQgICAgICAgICAgLy8gdXJsIHRoYXQgc3RhcnRzIHdpdGggd3d3LlxuXHQgICAgICAgICAgaWYgKHd3d1JFLnRlc3QocG9zc2libGVVcmwpKVxuXHQgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJodHRwOi8vJyArIHBvc3NpYmxlVXJsICsgJ1wiJyArIG5vRm9sbG93QXR0ciArICc+JyArIHBvc3NpYmxlVXJsLnN1YnN0cigwLCBsZW5ndGgpICsgJzwvYT4nO1xuXG5cdCAgICAgICAgICAvLyBhbiBlbWFpbCBhZGRyZXNzIG9mIHRoZSBmb3JtIHVzZXJuYW1lQGRvbWFpbi50bGRcblx0ICAgICAgICAgIGlmIChlbWFpbFJFLnRlc3QocG9zc2libGVVcmwpKVxuXHQgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJtYWlsdG86JyArIHBvc3NpYmxlVXJsICsgJ1wiPicgKyBwb3NzaWJsZVVybCArICc8L2E+JztcblxuXHQgICAgICAgICAgLy8gdXJsIHRoYXQgZW5kcyBpbiAuY29tLCAub3JnIG9yIC5uZXQgdGhhdCBpcyBub3QgYW4gZW1haWwgYWRkcmVzc1xuXHQgICAgICAgICAgaWYgKHRsZFJFLnRlc3QocG9zc2libGVVcmwpKVxuXHQgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJodHRwOi8vJyArIHBvc3NpYmxlVXJsICsgJ1wiJyArIG5vRm9sbG93QXR0ciArICc+JyArIHBvc3NpYmxlVXJsLnN1YnN0cigwLCBsZW5ndGgpICsgJzwvYT4nO1xuXG5cdCAgICAgICAgICByZXR1cm4gd29yZDtcblxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgcmV0dXJuIHdvcmRzLmpvaW4oJycpO1xuXHQgICAgfSxcblxuXHQgICAgd29yZGNvdW50OiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgdmFyIHdvcmRzID0gKHN0cikgPyBzdHIubWF0Y2goL1xcdysvZykgOiBudWxsO1xuXHQgICAgICAgIHJldHVybiAod29yZHMpID8gd29yZHMubGVuZ3RoIDogbnVsbDtcblx0ICAgIH0sXG5cblx0ICAgICdmbG9hdCc6IGZ1bmN0aW9uKHZhbCwgZGVmKSB7XG5cdCAgICAgICAgdmFyIHJlcyA9IHBhcnNlRmxvYXQodmFsKTtcblx0ICAgICAgICByZXR1cm4gaXNOYU4ocmVzKSA/IGRlZiA6IHJlcztcblx0ICAgIH0sXG5cblx0ICAgICdpbnQnOiBmdW5jdGlvbih2YWwsIGRlZikge1xuXHQgICAgICAgIHZhciByZXMgPSBwYXJzZUludCh2YWwsIDEwKTtcblx0ICAgICAgICByZXR1cm4gaXNOYU4ocmVzKSA/IGRlZiA6IHJlcztcblx0ICAgIH1cblx0fTtcblxuXHQvLyBBbGlhc2VzXG5cdGZpbHRlcnMuZCA9IGZpbHRlcnNbJ2RlZmF1bHQnXTtcblx0ZmlsdGVycy5lID0gZmlsdGVycy5lc2NhcGU7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBmaWx0ZXJzO1xuXG5cbi8qKiovIH0sXG4vKiA4ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cdHZhciBPYmogPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDYpO1xuXG5cdC8vIEZyYW1lcyBrZWVwIHRyYWNrIG9mIHNjb3BpbmcgYm90aCBhdCBjb21waWxlLXRpbWUgYW5kIHJ1bi10aW1lIHNvXG5cdC8vIHdlIGtub3cgaG93IHRvIGFjY2VzcyB2YXJpYWJsZXMuIEJsb2NrIHRhZ3MgY2FuIGludHJvZHVjZSBzcGVjaWFsXG5cdC8vIHZhcmlhYmxlcywgZm9yIGV4YW1wbGUuXG5cdHZhciBGcmFtZSA9IE9iai5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24ocGFyZW50LCBpc29sYXRlV3JpdGVzKSB7XG5cdCAgICAgICAgdGhpcy52YXJpYWJsZXMgPSB7fTtcblx0ICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcblx0ICAgICAgICB0aGlzLnRvcExldmVsID0gZmFsc2U7XG5cdCAgICAgICAgLy8gaWYgdGhpcyBpcyB0cnVlLCB3cml0ZXMgKHNldCkgc2hvdWxkIG5ldmVyIHByb3BhZ2F0ZSB1cHdhcmRzIHBhc3Rcblx0ICAgICAgICAvLyB0aGlzIGZyYW1lIHRvIGl0cyBwYXJlbnQgKHRob3VnaCByZWFkcyBtYXkpLlxuXHQgICAgICAgIHRoaXMuaXNvbGF0ZVdyaXRlcyA9IGlzb2xhdGVXcml0ZXM7XG5cdCAgICB9LFxuXG5cdCAgICBzZXQ6IGZ1bmN0aW9uKG5hbWUsIHZhbCwgcmVzb2x2ZVVwKSB7XG5cdCAgICAgICAgLy8gQWxsb3cgdmFyaWFibGVzIHdpdGggZG90cyBieSBhdXRvbWF0aWNhbGx5IGNyZWF0aW5nIHRoZVxuXHQgICAgICAgIC8vIG5lc3RlZCBzdHJ1Y3R1cmVcblx0ICAgICAgICB2YXIgcGFydHMgPSBuYW1lLnNwbGl0KCcuJyk7XG5cdCAgICAgICAgdmFyIG9iaiA9IHRoaXMudmFyaWFibGVzO1xuXHQgICAgICAgIHZhciBmcmFtZSA9IHRoaXM7XG5cblx0ICAgICAgICBpZihyZXNvbHZlVXApIHtcblx0ICAgICAgICAgICAgaWYoKGZyYW1lID0gdGhpcy5yZXNvbHZlKHBhcnRzWzBdLCB0cnVlKSkpIHtcblx0ICAgICAgICAgICAgICAgIGZyYW1lLnNldChuYW1lLCB2YWwpO1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8cGFydHMubGVuZ3RoIC0gMTsgaSsrKSB7XG5cdCAgICAgICAgICAgIHZhciBpZCA9IHBhcnRzW2ldO1xuXG5cdCAgICAgICAgICAgIGlmKCFvYmpbaWRdKSB7XG5cdCAgICAgICAgICAgICAgICBvYmpbaWRdID0ge307XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgb2JqID0gb2JqW2lkXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBvYmpbcGFydHNbcGFydHMubGVuZ3RoIC0gMV1dID0gdmFsO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0OiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuXHQgICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBudWxsO1xuXHQgICAgfSxcblxuXHQgICAgbG9va3VwOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdmFyIHAgPSB0aGlzLnBhcmVudDtcblx0ICAgICAgICB2YXIgdmFsID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG5cdCAgICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHAgJiYgcC5sb29rdXAobmFtZSk7XG5cdCAgICB9LFxuXG5cdCAgICByZXNvbHZlOiBmdW5jdGlvbihuYW1lLCBmb3JXcml0ZSkge1xuXHQgICAgICAgIHZhciBwID0gKGZvcldyaXRlICYmIHRoaXMuaXNvbGF0ZVdyaXRlcykgPyB1bmRlZmluZWQgOiB0aGlzLnBhcmVudDtcblx0ICAgICAgICB2YXIgdmFsID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG5cdCAgICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBwICYmIHAucmVzb2x2ZShuYW1lKTtcblx0ICAgIH0sXG5cblx0ICAgIHB1c2g6IGZ1bmN0aW9uKGlzb2xhdGVXcml0ZXMpIHtcblx0ICAgICAgICByZXR1cm4gbmV3IEZyYW1lKHRoaXMsIGlzb2xhdGVXcml0ZXMpO1xuXHQgICAgfSxcblxuXHQgICAgcG9wOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQ7XG5cdCAgICB9XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIG1ha2VNYWNybyhhcmdOYW1lcywga3dhcmdOYW1lcywgZnVuYykge1xuXHQgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciBhcmdDb3VudCA9IG51bUFyZ3MoYXJndW1lbnRzKTtcblx0ICAgICAgICB2YXIgYXJncztcblx0ICAgICAgICB2YXIga3dhcmdzID0gZ2V0S2V5d29yZEFyZ3MoYXJndW1lbnRzKTtcblx0ICAgICAgICB2YXIgaTtcblxuXHQgICAgICAgIGlmKGFyZ0NvdW50ID4gYXJnTmFtZXMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIGFyZ05hbWVzLmxlbmd0aCk7XG5cblx0ICAgICAgICAgICAgLy8gUG9zaXRpb25hbCBhcmd1bWVudHMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIGluIGFzXG5cdCAgICAgICAgICAgIC8vIGtleXdvcmQgYXJndW1lbnRzIChlc3NlbnRpYWxseSBkZWZhdWx0IHZhbHVlcylcblx0ICAgICAgICAgICAgdmFyIHZhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIGFyZ3MubGVuZ3RoLCBhcmdDb3VudCk7XG5cdCAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IHZhbHMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIGlmKGkgPCBrd2FyZ05hbWVzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGt3YXJnc1trd2FyZ05hbWVzW2ldXSA9IHZhbHNbaV07XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihhcmdDb3VudCA8IGFyZ05hbWVzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBhcmdDb3VudCk7XG5cblx0ICAgICAgICAgICAgZm9yKGkgPSBhcmdDb3VudDsgaSA8IGFyZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJnTmFtZXNbaV07XG5cblx0ICAgICAgICAgICAgICAgIC8vIEtleXdvcmQgYXJndW1lbnRzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCBhc1xuXHQgICAgICAgICAgICAgICAgLy8gcG9zaXRpb25hbCBhcmd1bWVudHMsIGkuZS4gdGhlIGNhbGxlciBleHBsaWNpdGx5XG5cdCAgICAgICAgICAgICAgICAvLyB1c2VkIHRoZSBuYW1lIG9mIGEgcG9zaXRpb25hbCBhcmdcblx0ICAgICAgICAgICAgICAgIGFyZ3MucHVzaChrd2FyZ3NbYXJnXSk7XG5cdCAgICAgICAgICAgICAgICBkZWxldGUga3dhcmdzW2FyZ107XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG5cdCAgICB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gbWFrZUtleXdvcmRBcmdzKG9iaikge1xuXHQgICAgb2JqLl9fa2V5d29yZHMgPSB0cnVlO1xuXHQgICAgcmV0dXJuIG9iajtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldEtleXdvcmRBcmdzKGFyZ3MpIHtcblx0ICAgIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcblx0ICAgIGlmKGxlbikge1xuXHQgICAgICAgIHZhciBsYXN0QXJnID0gYXJnc1tsZW4gLSAxXTtcblx0ICAgICAgICBpZihsYXN0QXJnICYmIGxhc3RBcmcuaGFzT3duUHJvcGVydHkoJ19fa2V5d29yZHMnKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gbGFzdEFyZztcblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICByZXR1cm4ge307XG5cdH1cblxuXHRmdW5jdGlvbiBudW1BcmdzKGFyZ3MpIHtcblx0ICAgIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcblx0ICAgIGlmKGxlbiA9PT0gMCkge1xuXHQgICAgICAgIHJldHVybiAwO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgbGFzdEFyZyA9IGFyZ3NbbGVuIC0gMV07XG5cdCAgICBpZihsYXN0QXJnICYmIGxhc3RBcmcuaGFzT3duUHJvcGVydHkoJ19fa2V5d29yZHMnKSkge1xuXHQgICAgICAgIHJldHVybiBsZW4gLSAxO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIGxlbjtcblx0ICAgIH1cblx0fVxuXG5cdC8vIEEgU2FmZVN0cmluZyBvYmplY3QgaW5kaWNhdGVzIHRoYXQgdGhlIHN0cmluZyBzaG91bGQgbm90IGJlXG5cdC8vIGF1dG9lc2NhcGVkLiBUaGlzIGhhcHBlbnMgbWFnaWNhbGx5IGJlY2F1c2UgYXV0b2VzY2FwaW5nIG9ubHlcblx0Ly8gb2NjdXJzIG9uIHByaW1pdGl2ZSBzdHJpbmcgb2JqZWN0cy5cblx0ZnVuY3Rpb24gU2FmZVN0cmluZyh2YWwpIHtcblx0ICAgIGlmKHR5cGVvZiB2YWwgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgIH1cblxuXHQgICAgdGhpcy52YWwgPSB2YWw7XG5cdCAgICB0aGlzLmxlbmd0aCA9IHZhbC5sZW5ndGg7XG5cdH1cblxuXHRTYWZlU3RyaW5nLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3RyaW5nLnByb3RvdHlwZSwge1xuXHQgICAgbGVuZ3RoOiB7IHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHZhbHVlOiAwIH1cblx0fSk7XG5cdFNhZmVTdHJpbmcucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbigpIHtcblx0ICAgIHJldHVybiB0aGlzLnZhbDtcblx0fTtcblx0U2FmZVN0cmluZy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0ICAgIHJldHVybiB0aGlzLnZhbDtcblx0fTtcblxuXHRmdW5jdGlvbiBjb3B5U2FmZW5lc3MoZGVzdCwgdGFyZ2V0KSB7XG5cdCAgICBpZihkZXN0IGluc3RhbmNlb2YgU2FmZVN0cmluZykge1xuXHQgICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyh0YXJnZXQpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHRhcmdldC50b1N0cmluZygpO1xuXHR9XG5cblx0ZnVuY3Rpb24gbWFya1NhZmUodmFsKSB7XG5cdCAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG5cblx0ICAgIGlmKHR5cGUgPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBTYWZlU3RyaW5nKHZhbCk7XG5cdCAgICB9XG5cdCAgICBlbHNlIGlmKHR5cGUgIT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICB2YXIgcmV0ID0gdmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cblx0ICAgICAgICAgICAgaWYodHlwZW9mIHJldCA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyhyZXQpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHJldDtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gc3VwcHJlc3NWYWx1ZSh2YWwsIGF1dG9lc2NhcGUpIHtcblx0ICAgIHZhbCA9ICh2YWwgIT09IHVuZGVmaW5lZCAmJiB2YWwgIT09IG51bGwpID8gdmFsIDogJyc7XG5cblx0ICAgIGlmKGF1dG9lc2NhcGUgJiYgISh2YWwgaW5zdGFuY2VvZiBTYWZlU3RyaW5nKSkge1xuXHQgICAgICAgIHZhbCA9IGxpYi5lc2NhcGUodmFsLnRvU3RyaW5nKCkpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gdmFsO1xuXHR9XG5cblx0ZnVuY3Rpb24gZW5zdXJlRGVmaW5lZCh2YWwsIGxpbmVubywgY29sbm8pIHtcblx0ICAgIGlmKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcihcblx0ICAgICAgICAgICAgJ2F0dGVtcHRlZCB0byBvdXRwdXQgbnVsbCBvciB1bmRlZmluZWQgdmFsdWUnLFxuXHQgICAgICAgICAgICBsaW5lbm8gKyAxLFxuXHQgICAgICAgICAgICBjb2xubyArIDFcblx0ICAgICAgICApO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHZhbDtcblx0fVxuXG5cdGZ1bmN0aW9uIG1lbWJlckxvb2t1cChvYmosIHZhbCkge1xuXHQgICAgb2JqID0gb2JqIHx8IHt9O1xuXG5cdCAgICBpZih0eXBlb2Ygb2JqW3ZhbF0gPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBvYmpbdmFsXS5hcHBseShvYmosIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIG9ialt2YWxdO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2FsbFdyYXAob2JqLCBuYW1lLCBjb250ZXh0LCBhcmdzKSB7XG5cdCAgICBpZighb2JqKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY2FsbCBgJyArIG5hbWUgKyAnYCwgd2hpY2ggaXMgdW5kZWZpbmVkIG9yIGZhbHNleScpO1xuXHQgICAgfVxuXHQgICAgZWxzZSBpZih0eXBlb2Ygb2JqICE9PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY2FsbCBgJyArIG5hbWUgKyAnYCwgd2hpY2ggaXMgbm90IGEgZnVuY3Rpb24nKTtcblx0ICAgIH1cblxuXHQgICAgLy8ganNoaW50IHZhbGlkdGhpczogdHJ1ZVxuXHQgICAgcmV0dXJuIG9iai5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBuYW1lKSB7XG5cdCAgICB2YXIgdmFsID0gZnJhbWUubG9va3VwKG5hbWUpO1xuXHQgICAgcmV0dXJuICh2YWwgIT09IHVuZGVmaW5lZCkgP1xuXHQgICAgICAgIHZhbCA6XG5cdCAgICAgICAgY29udGV4dC5sb29rdXAobmFtZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVFcnJvcihlcnJvciwgbGluZW5vLCBjb2xubykge1xuXHQgICAgaWYoZXJyb3IubGluZW5vKSB7XG5cdCAgICAgICAgcmV0dXJuIGVycm9yO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBsaWIuVGVtcGxhdGVFcnJvcihlcnJvciwgbGluZW5vLCBjb2xubyk7XG5cdCAgICB9XG5cdH1cblxuXHRmdW5jdGlvbiBhc3luY0VhY2goYXJyLCBkaW1lbiwgaXRlciwgY2IpIHtcblx0ICAgIGlmKGxpYi5pc0FycmF5KGFycikpIHtcblx0ICAgICAgICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcblxuXHQgICAgICAgIGxpYi5hc3luY0l0ZXIoYXJyLCBmdW5jdGlvbihpdGVtLCBpLCBuZXh0KSB7XG5cdCAgICAgICAgICAgIHN3aXRjaChkaW1lbikge1xuXHQgICAgICAgICAgICBjYXNlIDE6IGl0ZXIoaXRlbSwgaSwgbGVuLCBuZXh0KTsgYnJlYWs7XG5cdCAgICAgICAgICAgIGNhc2UgMjogaXRlcihpdGVtWzBdLCBpdGVtWzFdLCBpLCBsZW4sIG5leHQpOyBicmVhaztcblx0ICAgICAgICAgICAgY2FzZSAzOiBpdGVyKGl0ZW1bMF0sIGl0ZW1bMV0sIGl0ZW1bMl0sIGksIGxlbiwgbmV4dCk7IGJyZWFrO1xuXHQgICAgICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICAgICAgaXRlbS5wdXNoKGksIG5leHQpO1xuXHQgICAgICAgICAgICAgICAgaXRlci5hcHBseSh0aGlzLCBpdGVtKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0sIGNiKTtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIGxpYi5hc3luY0ZvcihhcnIsIGZ1bmN0aW9uKGtleSwgdmFsLCBpLCBsZW4sIG5leHQpIHtcblx0ICAgICAgICAgICAgaXRlcihrZXksIHZhbCwgaSwgbGVuLCBuZXh0KTtcblx0ICAgICAgICB9LCBjYik7XG5cdCAgICB9XG5cdH1cblxuXHRmdW5jdGlvbiBhc3luY0FsbChhcnIsIGRpbWVuLCBmdW5jLCBjYikge1xuXHQgICAgdmFyIGZpbmlzaGVkID0gMDtcblx0ICAgIHZhciBsZW4sIGk7XG5cdCAgICB2YXIgb3V0cHV0QXJyO1xuXG5cdCAgICBmdW5jdGlvbiBkb25lKGksIG91dHB1dCkge1xuXHQgICAgICAgIGZpbmlzaGVkKys7XG5cdCAgICAgICAgb3V0cHV0QXJyW2ldID0gb3V0cHV0O1xuXG5cdCAgICAgICAgaWYoZmluaXNoZWQgPT09IGxlbikge1xuXHQgICAgICAgICAgICBjYihudWxsLCBvdXRwdXRBcnIuam9pbignJykpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgaWYobGliLmlzQXJyYXkoYXJyKSkge1xuXHQgICAgICAgIGxlbiA9IGFyci5sZW5ndGg7XG5cdCAgICAgICAgb3V0cHV0QXJyID0gbmV3IEFycmF5KGxlbik7XG5cblx0ICAgICAgICBpZihsZW4gPT09IDApIHtcblx0ICAgICAgICAgICAgY2IobnVsbCwgJycpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IGFycltpXTtcblxuXHQgICAgICAgICAgICAgICAgc3dpdGNoKGRpbWVuKSB7XG5cdCAgICAgICAgICAgICAgICBjYXNlIDE6IGZ1bmMoaXRlbSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICBjYXNlIDI6IGZ1bmMoaXRlbVswXSwgaXRlbVsxXSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICBjYXNlIDM6IGZ1bmMoaXRlbVswXSwgaXRlbVsxXSwgaXRlbVsyXSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICAgICAgICAgIGl0ZW0ucHVzaChpLCBkb25lKTtcblx0ICAgICAgICAgICAgICAgICAgICAvLyBqc2hpbnQgdmFsaWR0aGlzOiB0cnVlXG5cdCAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseSh0aGlzLCBpdGVtKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHZhciBrZXlzID0gbGliLmtleXMoYXJyKTtcblx0ICAgICAgICBsZW4gPSBrZXlzLmxlbmd0aDtcblx0ICAgICAgICBvdXRwdXRBcnIgPSBuZXcgQXJyYXkobGVuKTtcblxuXHQgICAgICAgIGlmKGxlbiA9PT0gMCkge1xuXHQgICAgICAgICAgICBjYihudWxsLCAnJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgayA9IGtleXNbaV07XG5cdCAgICAgICAgICAgICAgICBmdW5jKGssIGFycltrXSwgaSwgbGVuLCBkb25lKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgIH1cblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzID0ge1xuXHQgICAgRnJhbWU6IEZyYW1lLFxuXHQgICAgbWFrZU1hY3JvOiBtYWtlTWFjcm8sXG5cdCAgICBtYWtlS2V5d29yZEFyZ3M6IG1ha2VLZXl3b3JkQXJncyxcblx0ICAgIG51bUFyZ3M6IG51bUFyZ3MsXG5cdCAgICBzdXBwcmVzc1ZhbHVlOiBzdXBwcmVzc1ZhbHVlLFxuXHQgICAgZW5zdXJlRGVmaW5lZDogZW5zdXJlRGVmaW5lZCxcblx0ICAgIG1lbWJlckxvb2t1cDogbWVtYmVyTG9va3VwLFxuXHQgICAgY29udGV4dE9yRnJhbWVMb29rdXA6IGNvbnRleHRPckZyYW1lTG9va3VwLFxuXHQgICAgY2FsbFdyYXA6IGNhbGxXcmFwLFxuXHQgICAgaGFuZGxlRXJyb3I6IGhhbmRsZUVycm9yLFxuXHQgICAgaXNBcnJheTogbGliLmlzQXJyYXksXG5cdCAgICBrZXlzOiBsaWIua2V5cyxcblx0ICAgIFNhZmVTdHJpbmc6IFNhZmVTdHJpbmcsXG5cdCAgICBjb3B5U2FmZW5lc3M6IGNvcHlTYWZlbmVzcyxcblx0ICAgIG1hcmtTYWZlOiBtYXJrU2FmZSxcblx0ICAgIGFzeW5jRWFjaDogYXN5bmNFYWNoLFxuXHQgICAgYXN5bmNBbGw6IGFzeW5jQWxsLFxuXHQgICAgaW5PcGVyYXRvcjogbGliLmluT3BlcmF0b3Jcblx0fTtcblxuXG4vKioqLyB9LFxuLyogOSAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGZ1bmN0aW9uIGN5Y2xlcihpdGVtcykge1xuXHQgICAgdmFyIGluZGV4ID0gLTE7XG5cblx0ICAgIHJldHVybiB7XG5cdCAgICAgICAgY3VycmVudDogbnVsbCxcblx0ICAgICAgICByZXNldDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIGluZGV4ID0gLTE7XG5cdCAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IG51bGw7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICBpbmRleCsrO1xuXHQgICAgICAgICAgICBpZihpbmRleCA+PSBpdGVtcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgIGluZGV4ID0gMDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IGl0ZW1zW2luZGV4XTtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudDtcblx0ICAgICAgICB9LFxuXHQgICAgfTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gam9pbmVyKHNlcCkge1xuXHQgICAgc2VwID0gc2VwIHx8ICcsJztcblx0ICAgIHZhciBmaXJzdCA9IHRydWU7XG5cblx0ICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgdmFsID0gZmlyc3QgPyAnJyA6IHNlcDtcblx0ICAgICAgICBmaXJzdCA9IGZhbHNlO1xuXHQgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICB9O1xuXHR9XG5cblx0Ly8gTWFraW5nIHRoaXMgYSBmdW5jdGlvbiBpbnN0ZWFkIHNvIGl0IHJldHVybnMgYSBuZXcgb2JqZWN0XG5cdC8vIGVhY2ggdGltZSBpdCdzIGNhbGxlZC4gVGhhdCB3YXksIGlmIHNvbWV0aGluZyBsaWtlIGFuIGVudmlyb25tZW50XG5cdC8vIHVzZXMgaXQsIHRoZXkgd2lsbCBlYWNoIGhhdmUgdGhlaXIgb3duIGNvcHkuXG5cdGZ1bmN0aW9uIGdsb2JhbHMoKSB7XG5cdCAgICByZXR1cm4ge1xuXHQgICAgICAgIHJhbmdlOiBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuXHQgICAgICAgICAgICBpZih0eXBlb2Ygc3RvcCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgICAgICAgIHN0b3AgPSBzdGFydDtcblx0ICAgICAgICAgICAgICAgIHN0YXJ0ID0gMDtcblx0ICAgICAgICAgICAgICAgIHN0ZXAgPSAxO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYoIXN0ZXApIHtcblx0ICAgICAgICAgICAgICAgIHN0ZXAgPSAxO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdmFyIGFyciA9IFtdO1xuXHQgICAgICAgICAgICB2YXIgaTtcblx0ICAgICAgICAgICAgaWYgKHN0ZXAgPiAwKSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKGk9c3RhcnQ7IGk8c3RvcDsgaSs9c3RlcCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGFyci5wdXNoKGkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgZm9yIChpPXN0YXJ0OyBpPnN0b3A7IGkrPXN0ZXApIHtcblx0ICAgICAgICAgICAgICAgICAgICBhcnIucHVzaChpKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gYXJyO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvLyBsaXBzdW06IGZ1bmN0aW9uKG4sIGh0bWwsIG1pbiwgbWF4KSB7XG5cdCAgICAgICAgLy8gfSxcblxuXHQgICAgICAgIGN5Y2xlcjogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBjeWNsZXIoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIGpvaW5lcjogZnVuY3Rpb24oc2VwKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBqb2luZXIoc2VwKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxzO1xuXG5cbi8qKiovIH0sXG4vKiAxMCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18sIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fOy8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqLyhmdW5jdGlvbihzZXRJbW1lZGlhdGUsIHByb2Nlc3MpIHsvLyBNSVQgbGljZW5zZSAoYnkgRWxhbiBTaGFua2VyKS5cblx0KGZ1bmN0aW9uKGdsb2JhbHMpIHtcblx0ICAndXNlIHN0cmljdCc7XG5cblx0ICB2YXIgZXhlY3V0ZVN5bmMgPSBmdW5jdGlvbigpe1xuXHQgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXHQgICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnZnVuY3Rpb24nKXtcblx0ICAgICAgYXJnc1swXS5hcHBseShudWxsLCBhcmdzLnNwbGljZSgxKSk7XG5cdCAgICB9XG5cdCAgfTtcblxuXHQgIHZhciBleGVjdXRlQXN5bmMgPSBmdW5jdGlvbihmbil7XG5cdCAgICBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICBzZXRJbW1lZGlhdGUoZm4pO1xuXHQgICAgfSBlbHNlIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcHJvY2Vzcy5uZXh0VGljaykge1xuXHQgICAgICBwcm9jZXNzLm5leHRUaWNrKGZuKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuXHQgICAgfVxuXHQgIH07XG5cblx0ICB2YXIgbWFrZUl0ZXJhdG9yID0gZnVuY3Rpb24gKHRhc2tzKSB7XG5cdCAgICB2YXIgbWFrZUNhbGxiYWNrID0gZnVuY3Rpb24gKGluZGV4KSB7XG5cdCAgICAgIHZhciBmbiA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICBpZiAodGFza3MubGVuZ3RoKSB7XG5cdCAgICAgICAgICB0YXNrc1tpbmRleF0uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGZuLm5leHQoKTtcblx0ICAgICAgfTtcblx0ICAgICAgZm4ubmV4dCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICByZXR1cm4gKGluZGV4IDwgdGFza3MubGVuZ3RoIC0gMSkgPyBtYWtlQ2FsbGJhY2soaW5kZXggKyAxKTogbnVsbDtcblx0ICAgICAgfTtcblx0ICAgICAgcmV0dXJuIGZuO1xuXHQgICAgfTtcblx0ICAgIHJldHVybiBtYWtlQ2FsbGJhY2soMCk7XG5cdCAgfTtcblx0ICBcblx0ICB2YXIgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKG1heWJlQXJyYXkpe1xuXHQgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChtYXliZUFycmF5KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcblx0ICB9O1xuXG5cdCAgdmFyIHdhdGVyZmFsbCA9IGZ1bmN0aW9uICh0YXNrcywgY2FsbGJhY2ssIGZvcmNlQXN5bmMpIHtcblx0ICAgIHZhciBuZXh0VGljayA9IGZvcmNlQXN5bmMgPyBleGVjdXRlQXN5bmMgOiBleGVjdXRlU3luYztcblx0ICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24gKCkge307XG5cdCAgICBpZiAoIV9pc0FycmF5KHRhc2tzKSkge1xuXHQgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byB3YXRlcmZhbGwgbXVzdCBiZSBhbiBhcnJheSBvZiBmdW5jdGlvbnMnKTtcblx0ICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdCAgICB9XG5cdCAgICBpZiAoIXRhc2tzLmxlbmd0aCkge1xuXHQgICAgICByZXR1cm4gY2FsbGJhY2soKTtcblx0ICAgIH1cblx0ICAgIHZhciB3cmFwSXRlcmF0b3IgPSBmdW5jdGlvbiAoaXRlcmF0b3IpIHtcblx0ICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlcnIpIHtcblx0ICAgICAgICBpZiAoZXJyKSB7XG5cdCAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuXHQgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXHQgICAgICAgICAgdmFyIG5leHQgPSBpdGVyYXRvci5uZXh0KCk7XG5cdCAgICAgICAgICBpZiAobmV4dCkge1xuXHQgICAgICAgICAgICBhcmdzLnB1c2god3JhcEl0ZXJhdG9yKG5leHQpKTtcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGFyZ3MucHVzaChjYWxsYmFjayk7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIGl0ZXJhdG9yLmFwcGx5KG51bGwsIGFyZ3MpO1xuXHQgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9O1xuXHQgICAgfTtcblx0ICAgIHdyYXBJdGVyYXRvcihtYWtlSXRlcmF0b3IodGFza3MpKSgpO1xuXHQgIH07XG5cblx0ICBpZiAodHJ1ZSkge1xuXHQgICAgIShfX1dFQlBBQ0tfQU1EX0RFRklORV9BUlJBWV9fID0gW10sIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICByZXR1cm4gd2F0ZXJmYWxsO1xuXHQgICAgfS5hcHBseShleHBvcnRzLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9BUlJBWV9fKSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gIT09IHVuZGVmaW5lZCAmJiAobW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXykpOyAvLyBSZXF1aXJlSlNcblx0ICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IHdhdGVyZmFsbDsgLy8gQ29tbW9uSlNcblx0ICB9IGVsc2Uge1xuXHQgICAgZ2xvYmFscy53YXRlcmZhbGwgPSB3YXRlcmZhbGw7IC8vIDxzY3JpcHQ+XG5cdCAgfVxuXHR9KSh0aGlzKTtcblxuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi99LmNhbGwoZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXygxMSkuc2V0SW1tZWRpYXRlLCBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpKSlcblxuLyoqKi8gfSxcbi8qIDExICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi8oZnVuY3Rpb24oc2V0SW1tZWRpYXRlLCBjbGVhckltbWVkaWF0ZSkge3ZhciBuZXh0VGljayA9IF9fd2VicGFja19yZXF1aXJlX18oMTIpLm5leHRUaWNrO1xuXHR2YXIgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHk7XG5cdHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblx0dmFyIGltbWVkaWF0ZUlkcyA9IHt9O1xuXHR2YXIgbmV4dEltbWVkaWF0ZUlkID0gMDtcblxuXHQvLyBET00gQVBJcywgZm9yIGNvbXBsZXRlbmVzc1xuXG5cdGV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuXHQgIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldFRpbWVvdXQsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcblx0fTtcblx0ZXhwb3J0cy5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuXHQgIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFySW50ZXJ2YWwpO1xuXHR9O1xuXHRleHBvcnRzLmNsZWFyVGltZW91dCA9XG5cdGV4cG9ydHMuY2xlYXJJbnRlcnZhbCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHsgdGltZW91dC5jbG9zZSgpOyB9O1xuXG5cdGZ1bmN0aW9uIFRpbWVvdXQoaWQsIGNsZWFyRm4pIHtcblx0ICB0aGlzLl9pZCA9IGlkO1xuXHQgIHRoaXMuX2NsZWFyRm4gPSBjbGVhckZuO1xuXHR9XG5cdFRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblx0VGltZW91dC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcblx0ICB0aGlzLl9jbGVhckZuLmNhbGwod2luZG93LCB0aGlzLl9pZCk7XG5cdH07XG5cblx0Ly8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5cdGV4cG9ydHMuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSwgbXNlY3MpIHtcblx0ICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cdCAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcblx0fTtcblxuXHRleHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuXHQgIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblx0ICBpdGVtLl9pZGxlVGltZW91dCA9IC0xO1xuXHR9O1xuXG5cdGV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG5cdCAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXG5cdCAgdmFyIG1zZWNzID0gaXRlbS5faWRsZVRpbWVvdXQ7XG5cdCAgaWYgKG1zZWNzID49IDApIHtcblx0ICAgIGl0ZW0uX2lkbGVUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIG9uVGltZW91dCgpIHtcblx0ICAgICAgaWYgKGl0ZW0uX29uVGltZW91dClcblx0ICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcblx0ICAgIH0sIG1zZWNzKTtcblx0ICB9XG5cdH07XG5cblx0Ly8gVGhhdCdzIG5vdCBob3cgbm9kZS5qcyBpbXBsZW1lbnRzIGl0IGJ1dCB0aGUgZXhwb3NlZCBhcGkgaXMgdGhlIHNhbWUuXG5cdGV4cG9ydHMuc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gc2V0SW1tZWRpYXRlIDogZnVuY3Rpb24oZm4pIHtcblx0ICB2YXIgaWQgPSBuZXh0SW1tZWRpYXRlSWQrKztcblx0ICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGggPCAyID8gZmFsc2UgOiBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cblx0ICBpbW1lZGlhdGVJZHNbaWRdID0gdHJ1ZTtcblxuXHQgIG5leHRUaWNrKGZ1bmN0aW9uIG9uTmV4dFRpY2soKSB7XG5cdCAgICBpZiAoaW1tZWRpYXRlSWRzW2lkXSkge1xuXHQgICAgICAvLyBmbi5jYWxsKCkgaXMgZmFzdGVyIHNvIHdlIG9wdGltaXplIGZvciB0aGUgY29tbW9uIHVzZS1jYXNlXG5cdCAgICAgIC8vIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vY2FsbC1hcHBseS1zZWd1XG5cdCAgICAgIGlmIChhcmdzKSB7XG5cdCAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgZm4uY2FsbChudWxsKTtcblx0ICAgICAgfVxuXHQgICAgICAvLyBQcmV2ZW50IGlkcyBmcm9tIGxlYWtpbmdcblx0ICAgICAgZXhwb3J0cy5jbGVhckltbWVkaWF0ZShpZCk7XG5cdCAgICB9XG5cdCAgfSk7XG5cblx0ICByZXR1cm4gaWQ7XG5cdH07XG5cblx0ZXhwb3J0cy5jbGVhckltbWVkaWF0ZSA9IHR5cGVvZiBjbGVhckltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gY2xlYXJJbW1lZGlhdGUgOiBmdW5jdGlvbihpZCkge1xuXHQgIGRlbGV0ZSBpbW1lZGlhdGVJZHNbaWRdO1xuXHR9O1xuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi99LmNhbGwoZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXygxMSkuc2V0SW1tZWRpYXRlLCBfX3dlYnBhY2tfcmVxdWlyZV9fKDExKS5jbGVhckltbWVkaWF0ZSkpXG5cbi8qKiovIH0sXG4vKiAxMiAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0Ly8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cblx0dmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXHR2YXIgcXVldWUgPSBbXTtcblx0dmFyIGRyYWluaW5nID0gZmFsc2U7XG5cdHZhciBjdXJyZW50UXVldWU7XG5cdHZhciBxdWV1ZUluZGV4ID0gLTE7XG5cblx0ZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuXHQgICAgZHJhaW5pbmcgPSBmYWxzZTtcblx0ICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG5cdCAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuXHQgICAgfVxuXHQgICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuXHQgICAgICAgIGRyYWluUXVldWUoKTtcblx0ICAgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG5cdCAgICBpZiAoZHJhaW5pbmcpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcblx0ICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuXHQgICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcblx0ICAgIHdoaWxlKGxlbikge1xuXHQgICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuXHQgICAgICAgIHF1ZXVlID0gW107XG5cdCAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuXHQgICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG5cdCAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuXHQgICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcblx0ICAgIH1cblx0ICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG5cdCAgICBkcmFpbmluZyA9IGZhbHNlO1xuXHQgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHR9XG5cblx0cHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcblx0ICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcblx0ICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuXHQgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG5cdCAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuXHQgICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG5cdCAgICB9XG5cdH07XG5cblx0Ly8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuXHRmdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcblx0ICAgIHRoaXMuZnVuID0gZnVuO1xuXHQgICAgdGhpcy5hcnJheSA9IGFycmF5O1xuXHR9XG5cdEl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xuXHR9O1xuXHRwcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xuXHRwcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xuXHRwcm9jZXNzLmVudiA9IHt9O1xuXHRwcm9jZXNzLmFyZ3YgPSBbXTtcblx0cHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5cdHByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuXHRmdW5jdGlvbiBub29wKCkge31cblxuXHRwcm9jZXNzLm9uID0gbm9vcDtcblx0cHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5cdHByb2Nlc3Mub25jZSA9IG5vb3A7XG5cdHByb2Nlc3Mub2ZmID0gbm9vcDtcblx0cHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5cdHByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcblx0cHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxuXHRwcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuXHQgICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xuXHR9O1xuXG5cdHByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5cdHByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG5cdCAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xuXHR9O1xuXHRwcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuXG5cbi8qKiovIH0sXG4vKiAxMyAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBMb2FkZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDE0KTtcblxuXHR2YXIgUHJlY29tcGlsZWRMb2FkZXIgPSBMb2FkZXIuZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uKGNvbXBpbGVkVGVtcGxhdGVzKSB7XG5cdCAgICAgICAgdGhpcy5wcmVjb21waWxlZCA9IGNvbXBpbGVkVGVtcGxhdGVzIHx8IHt9O1xuXHQgICAgfSxcblxuXHQgICAgZ2V0U291cmNlOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgaWYgKHRoaXMucHJlY29tcGlsZWRbbmFtZV0pIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHtcblx0ICAgICAgICAgICAgICAgIHNyYzogeyB0eXBlOiAnY29kZScsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgb2JqOiB0aGlzLnByZWNvbXBpbGVkW25hbWVdIH0sXG5cdCAgICAgICAgICAgICAgICBwYXRoOiBuYW1lXG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBudWxsO1xuXHQgICAgfVxuXHR9KTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IFByZWNvbXBpbGVkTG9hZGVyO1xuXG5cbi8qKiovIH0sXG4vKiAxNCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBwYXRoID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIE9iaiA9IF9fd2VicGFja19yZXF1aXJlX18oNik7XG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXG5cdHZhciBMb2FkZXIgPSBPYmouZXh0ZW5kKHtcblx0ICAgIG9uOiBmdW5jdGlvbihuYW1lLCBmdW5jKSB7XG5cdCAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycyB8fCB7fTtcblx0ICAgICAgICB0aGlzLmxpc3RlbmVyc1tuYW1lXSA9IHRoaXMubGlzdGVuZXJzW25hbWVdIHx8IFtdO1xuXHQgICAgICAgIHRoaXMubGlzdGVuZXJzW25hbWVdLnB1c2goZnVuYyk7XG5cdCAgICB9LFxuXG5cdCAgICBlbWl0OiBmdW5jdGlvbihuYW1lIC8qLCBhcmcxLCBhcmcyLCAuLi4qLykge1xuXHQgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuXHQgICAgICAgIGlmKHRoaXMubGlzdGVuZXJzICYmIHRoaXMubGlzdGVuZXJzW25hbWVdKSB7XG5cdCAgICAgICAgICAgIGxpYi5lYWNoKHRoaXMubGlzdGVuZXJzW25hbWVdLCBmdW5jdGlvbihsaXN0ZW5lcikge1xuXHQgICAgICAgICAgICAgICAgbGlzdGVuZXIuYXBwbHkobnVsbCwgYXJncyk7XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIHJlc29sdmU6IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG5cdCAgICAgICAgcmV0dXJuIHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoZnJvbSksIHRvKTtcblx0ICAgIH0sXG5cblx0ICAgIGlzUmVsYXRpdmU6IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG5cdCAgICAgICAgcmV0dXJuIChmaWxlbmFtZS5pbmRleE9mKCcuLycpID09PSAwIHx8IGZpbGVuYW1lLmluZGV4T2YoJy4uLycpID09PSAwKTtcblx0ICAgIH1cblx0fSk7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBMb2FkZXI7XG5cblxuLyoqKi8gfSxcbi8qIDE1ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHRmdW5jdGlvbiBpbnN0YWxsQ29tcGF0KCkge1xuXHQgICd1c2Ugc3RyaWN0JztcblxuXHQgIC8vIFRoaXMgbXVzdCBiZSBjYWxsZWQgbGlrZSBgbnVuanVja3MuaW5zdGFsbENvbXBhdGAgc28gdGhhdCBgdGhpc2Bcblx0ICAvLyByZWZlcmVuY2VzIHRoZSBudW5qdWNrcyBpbnN0YW5jZVxuXHQgIHZhciBydW50aW1lID0gdGhpcy5ydW50aW1lOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICB2YXIgbGliID0gdGhpcy5saWI7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG5cdCAgdmFyIG9yaWdfY29udGV4dE9yRnJhbWVMb29rdXAgPSBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwO1xuXHQgIHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAgPSBmdW5jdGlvbihjb250ZXh0LCBmcmFtZSwga2V5KSB7XG5cdCAgICB2YXIgdmFsID0gb3JpZ19jb250ZXh0T3JGcmFtZUxvb2t1cC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgIHN3aXRjaCAoa2V5KSB7XG5cdCAgICAgIGNhc2UgJ1RydWUnOlxuXHQgICAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgICBjYXNlICdGYWxzZSc6XG5cdCAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICBjYXNlICdOb25lJzpcblx0ICAgICAgICByZXR1cm4gbnVsbDtcblx0ICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gdmFsO1xuXHQgIH07XG5cblx0ICB2YXIgb3JpZ19tZW1iZXJMb29rdXAgPSBydW50aW1lLm1lbWJlckxvb2t1cDtcblx0ICB2YXIgQVJSQVlfTUVNQkVSUyA9IHtcblx0ICAgIHBvcDogZnVuY3Rpb24oaW5kZXgpIHtcblx0ICAgICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5wb3AoKTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAoaW5kZXggPj0gdGhpcy5sZW5ndGggfHwgaW5kZXggPCAwKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdLZXlFcnJvcicpO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiB0aGlzLnNwbGljZShpbmRleCwgMSk7XG5cdCAgICB9LFxuXHQgICAgYXBwZW5kOiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMucHVzaChlbGVtZW50KTtcblx0ICAgIH0sXG5cdCAgICByZW1vdmU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgaWYgKHRoaXNbaV0gPT09IGVsZW1lbnQpIHtcblx0ICAgICAgICAgIHJldHVybiB0aGlzLnNwbGljZShpLCAxKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZUVycm9yJyk7XG5cdCAgICB9LFxuXHQgICAgY291bnQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgdmFyIGNvdW50ID0gMDtcblx0ICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgaWYgKHRoaXNbaV0gPT09IGVsZW1lbnQpIHtcblx0ICAgICAgICAgIGNvdW50Kys7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiBjb3VudDtcblx0ICAgIH0sXG5cdCAgICBpbmRleDogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICB2YXIgaTtcblx0ICAgICAgaWYgKChpID0gdGhpcy5pbmRleE9mKGVsZW1lbnQpKSA9PT0gLTEpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlRXJyb3InKTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gaTtcblx0ICAgIH0sXG5cdCAgICBmaW5kOiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgIHJldHVybiB0aGlzLmluZGV4T2YoZWxlbWVudCk7XG5cdCAgICB9LFxuXHQgICAgaW5zZXJ0OiBmdW5jdGlvbihpbmRleCwgZWxlbSkge1xuXHQgICAgICByZXR1cm4gdGhpcy5zcGxpY2UoaW5kZXgsIDAsIGVsZW0pO1xuXHQgICAgfVxuXHQgIH07XG5cdCAgdmFyIE9CSkVDVF9NRU1CRVJTID0ge1xuXHQgICAgaXRlbXM6IGZ1bmN0aW9uKCkge1xuXHQgICAgICB2YXIgcmV0ID0gW107XG5cdCAgICAgIGZvcih2YXIgayBpbiB0aGlzKSB7XG5cdCAgICAgICAgcmV0LnB1c2goW2ssIHRoaXNba11dKTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gcmV0O1xuXHQgICAgfSxcblx0ICAgIHZhbHVlczogZnVuY3Rpb24oKSB7XG5cdCAgICAgIHZhciByZXQgPSBbXTtcblx0ICAgICAgZm9yKHZhciBrIGluIHRoaXMpIHtcblx0ICAgICAgICByZXQucHVzaCh0aGlzW2tdKTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gcmV0O1xuXHQgICAgfSxcblx0ICAgIGtleXM6IGZ1bmN0aW9uKCkge1xuXHQgICAgICB2YXIgcmV0ID0gW107XG5cdCAgICAgIGZvcih2YXIgayBpbiB0aGlzKSB7XG5cdCAgICAgICAgcmV0LnB1c2goayk7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIHJldDtcblx0ICAgIH0sXG5cdCAgICBnZXQ6IGZ1bmN0aW9uKGtleSwgZGVmKSB7XG5cdCAgICAgIHZhciBvdXRwdXQgPSB0aGlzW2tleV07XG5cdCAgICAgIGlmIChvdXRwdXQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgIG91dHB1dCA9IGRlZjtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gb3V0cHV0O1xuXHQgICAgfSxcblx0ICAgIGhhc19rZXk6IGZ1bmN0aW9uKGtleSkge1xuXHQgICAgICByZXR1cm4gdGhpcy5oYXNPd25Qcm9wZXJ0eShrZXkpO1xuXHQgICAgfSxcblx0ICAgIHBvcDogZnVuY3Rpb24oa2V5LCBkZWYpIHtcblx0ICAgICAgdmFyIG91dHB1dCA9IHRoaXNba2V5XTtcblx0ICAgICAgaWYgKG91dHB1dCA9PT0gdW5kZWZpbmVkICYmIGRlZiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgb3V0cHV0ID0gZGVmO1xuXHQgICAgICB9IGVsc2UgaWYgKG91dHB1dCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdLZXlFcnJvcicpO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIGRlbGV0ZSB0aGlzW2tleV07XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIG91dHB1dDtcblx0ICAgIH0sXG5cdCAgICBwb3BpdGVtOiBmdW5jdGlvbigpIHtcblx0ICAgICAgZm9yICh2YXIgayBpbiB0aGlzKSB7XG5cdCAgICAgICAgLy8gUmV0dXJuIHRoZSBmaXJzdCBvYmplY3QgcGFpci5cblx0ICAgICAgICB2YXIgdmFsID0gdGhpc1trXTtcblx0ICAgICAgICBkZWxldGUgdGhpc1trXTtcblx0ICAgICAgICByZXR1cm4gW2ssIHZhbF07XG5cdCAgICAgIH1cblx0ICAgICAgdGhyb3cgbmV3IEVycm9yKCdLZXlFcnJvcicpO1xuXHQgICAgfSxcblx0ICAgIHNldGRlZmF1bHQ6IGZ1bmN0aW9uKGtleSwgZGVmKSB7XG5cdCAgICAgIGlmIChrZXkgaW4gdGhpcykge1xuXHQgICAgICAgIHJldHVybiB0aGlzW2tleV07XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKGRlZiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgZGVmID0gbnVsbDtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gdGhpc1trZXldID0gZGVmO1xuXHQgICAgfSxcblx0ICAgIHVwZGF0ZTogZnVuY3Rpb24oa3dhcmdzKSB7XG5cdCAgICAgIGZvciAodmFyIGsgaW4ga3dhcmdzKSB7XG5cdCAgICAgICAgdGhpc1trXSA9IGt3YXJnc1trXTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gbnVsbDsgIC8vIEFsd2F5cyByZXR1cm5zIE5vbmVcblx0ICAgIH1cblx0ICB9O1xuXHQgIE9CSkVDVF9NRU1CRVJTLml0ZXJpdGVtcyA9IE9CSkVDVF9NRU1CRVJTLml0ZW1zO1xuXHQgIE9CSkVDVF9NRU1CRVJTLml0ZXJ2YWx1ZXMgPSBPQkpFQ1RfTUVNQkVSUy52YWx1ZXM7XG5cdCAgT0JKRUNUX01FTUJFUlMuaXRlcmtleXMgPSBPQkpFQ1RfTUVNQkVSUy5rZXlzO1xuXHQgIHJ1bnRpbWUubWVtYmVyTG9va3VwID0gZnVuY3Rpb24ob2JqLCB2YWwsIGF1dG9lc2NhcGUpIHsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cdCAgICBvYmogPSBvYmogfHwge307XG5cblx0ICAgIC8vIElmIHRoZSBvYmplY3QgaXMgYW4gb2JqZWN0LCByZXR1cm4gYW55IG9mIHRoZSBtZXRob2RzIHRoYXQgUHl0aG9uIHdvdWxkXG5cdCAgICAvLyBvdGhlcndpc2UgcHJvdmlkZS5cblx0ICAgIGlmIChsaWIuaXNBcnJheShvYmopICYmIEFSUkFZX01FTUJFUlMuaGFzT3duUHJvcGVydHkodmFsKSkge1xuXHQgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7cmV0dXJuIEFSUkFZX01FTUJFUlNbdmFsXS5hcHBseShvYmosIGFyZ3VtZW50cyk7fTtcblx0ICAgIH1cblxuXHQgICAgaWYgKGxpYi5pc09iamVjdChvYmopICYmIE9CSkVDVF9NRU1CRVJTLmhhc093blByb3BlcnR5KHZhbCkpIHtcblx0ICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge3JldHVybiBPQkpFQ1RfTUVNQkVSU1t2YWxdLmFwcGx5KG9iaiwgYXJndW1lbnRzKTt9O1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gb3JpZ19tZW1iZXJMb29rdXAuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICB9O1xuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBpbnN0YWxsQ29tcGF0O1xuXG5cbi8qKiovIH1cbi8qKioqKiovIF0pXG59KTtcbjsiLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImh0bWxcIikpIHtcbm91dHB1dCArPSBcIlxcbjxkaXYgY2xhc3M9XFxcIml0ZW0tLWVtYmVkX19lbGVtZW50XFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9kaXY+XFxuXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cIjtcbmlmKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGl0bGVcIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImRlc2NyaXB0aW9uXCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjcmVkaXRcIikgfHwgKCFydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGh1bWJuYWlsX3VybFwiKSkpKSB7XG5vdXRwdXQgKz0gXCJcXG48YXJ0aWNsZSBjbGFzcz1cXFwiaXRlbS0tZW1iZWQgaXRlbS0tZW1iZWRfX3dyYXBwZXJcXFwiPlxcbiAgICBcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGh1bWJuYWlsX3VybFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxhIGhyZWY9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiIGNsYXNzPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJkZXNjcmlwdGlvblwiKT9cIml0ZW0tLWVtYmVkX19pbGx1c3RyYXRpb25cIjpcIml0ZW0tLWVtYmVkX19vbmx5LWlsbHVzdHJhdGlvblwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgICAgICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGh1bWJuYWlsX3VybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiLz5cXG4gICA8L2E+XFxuICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aXRsZVwiKSB8fCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiZGVzY3JpcHRpb25cIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX2luZm9cXFwiPlxcbiAgICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGl0bGVcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX3RpdGxlXFxcIj5cXG4gICAgICAgICAgICA8YSBocmVmPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInVybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIiB0aXRsZT1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aXRsZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGl0bGVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9hPlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiZGVzY3JpcHRpb25cIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX2Rlc2NyaXB0aW9uXFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImRlc2NyaXB0aW9uXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcbiAgICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpdGVtLS1lbWJlZF9fY3JlZGl0XFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIDwvZGl2PlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbjwvYXJ0aWNsZT5cXG5cIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG5vdXRwdXQgKz0gXCI8ZmlndXJlPlxcbiAgPGltZyBcXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwiYWN0aXZlXCIpKSB7XG5vdXRwdXQgKz0gXCJjbGFzcz1cXFwiYWN0aXZlXFxcIlwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcInRodW1ibmFpbFwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCJcXG4gICAgc3Jjc2V0PVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwiYmFzZUltYWdlXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDgxMHcsIFxcbiAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwidGh1bWJuYWlsXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDI0MHcsIFxcbiAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwidmlld0ltYWdlXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDU0MHdcXFwiIFxcbiAgICBhbHQ9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY2FwdGlvblwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgPGZpZ2NhcHRpb24+XFxuICAgIDxzcGFuIG5nLWlmPVxcXCJyZWYuaXRlbS5tZXRhLmNhcHRpb25cXFwiIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cXG4gICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNhcHRpb25cIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgIDwvc3Bhbj4mbmJzcDtcXG4gICAgPHNwYW4gbmctaWY9XFxcInJlZi5pdGVtLm1ldGEuY3JlZGl0XFxcIiBjbGFzcz1cXFwiY3JlZGl0XFxcIj5cXG4gICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgPC9zcGFuPlxcbiAgPC9maWdjYXB0aW9uPlxcbjwvZmlndXJlPlxcblxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLXBvc3QuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG5vdXRwdXQgKz0gXCI8IS0tIHN0aWNreSBwb3NpdGlvbiB0b2dnbGUgLS0+XFxuXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInN0aWNreVwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzdGlja3lQb3NpdGlvblwiKSA9PSBcInRvcFwiKSB7XG5vdXRwdXQgKz0gXCJcXG48YXJ0aWNsZVxcbiAgY2xhc3M9XFxcImxiLXN0aWNreS10b3AtcG9zdCBsaXN0LWdyb3VwLWl0ZW0gXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicG9zdF9pdGVtc190eXBlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCJcXG4gIGRhdGEtanMtcG9zdC1pZD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiX2lkXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XFxuICBcIjtcbjtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuPGFydGljbGVcXG4gIGNsYXNzPVxcXCJsYi1wb3N0IGxpc3QtZ3JvdXAtaXRlbSBzaG93LWF1dGhvci1hdmF0YXIgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicG9zdF9pdGVtc190eXBlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCJcXG4gIGRhdGEtanMtcG9zdC1pZD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiX2lkXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGRpdiBjbGFzcz1cXFwibGItdHlwZVxcXCI+PC9kaXY+XFxuICAgIDxpbWcgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhc3NldHNfcm9vdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJpbWFnZXMvcGlucG9zdC5zdmdcXFwiIGNsYXNzPVxcXCJsYi1wb3N0LXBpblxcXCIgLz5cXG4gIFwiO1xuO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcImxiX2hpZ2hsaWdodFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLXR5cGUgbGItcG9zdC1oaWdobGlnaHRlZFxcXCI+PC9kaXY+XFxuICBcIjtcbjtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLXR5cGUgbGItdHlwZS0tdGV4dFxcXCI+PC9kaXY+XFxuICBcIjtcbjtcbn1cbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgPGRpdiBjbGFzcz1cXFwibGItcG9zdC1kYXRlXFxcIiBkYXRhLWpzLXRpbWVzdGFtcD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiX3VwZGF0ZWRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfdXBkYXRlZFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cXG5cXG4gIDwhLS0gYXV0aG9yIHBsdXMgYXZhdGFyIC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yXFxcIj5cXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93QXV0aG9yXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicHVibGlzaGVyXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJsYi1hdXRob3JfX25hbWVcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJwdWJsaXNoZXJcIikpLFwiZGlzcGxheV9uYW1lXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0F1dGhvckF2YXRhclwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInB1Ymxpc2hlclwiKSksXCJwaWN0dXJlX3VybFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8aW1nIGNsYXNzPVxcXCJsYi1hdXRob3JfX2F2YXRhclxcXCIgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicHVibGlzaGVyXCIpKSxcInBpY3R1cmVfdXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgLz5cXG4gICAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImxiLWF1dGhvcl9fYXZhdGFyXFxcIj48L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwvZGl2PlxcbiAgPCEtLSBlbmQgYXV0aG9yIC0tPlxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwhLS0gZW5kIHN0aWNreSBwb3NpdGlvbiB0b2dnbGUgLS0+XFxuXFxuICA8IS0tIGl0ZW0gc3RhcnQgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJpdGVtcy1jb250YWluZXJcXFwiPlxcbiAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMyA9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJncm91cHNcIikpLDEpKSxcInJlZnNcIik7XG5pZih0XzMpIHt2YXIgdF8yID0gdF8zLmxlbmd0aDtcbmZvcih2YXIgdF8xPTA7IHRfMSA8IHRfMy5sZW5ndGg7IHRfMSsrKSB7XG52YXIgdF80ID0gdF8zW3RfMV07XG5mcmFtZS5zZXQoXCJyZWZcIiwgdF80KTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF8xICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzIgLSB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF8yIC0gdF8xIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfMSA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF8xID09PSB0XzIgLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfMik7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwiaW1hZ2VcIikge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPGRpdiBjbGFzcz1cXFwiXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJzdGlja3lcIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic3RpY2t5UG9zaXRpb25cIikgPT0gXCJib3R0b21cIikge1xub3V0cHV0ICs9IFwibGItaXRlbVwiO1xuO1xufVxub3V0cHV0ICs9IFwiIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcIm9yaWdpbmFsXCIpKSxcImhlaWdodFwiKSA+IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJvcmlnaW5hbFwiKSksXCJ3aWR0aFwiKSkge1xub3V0cHV0ICs9IFwicG9ydHJhaXRcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCI+XFxuICAgICAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcIlwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwiYm90dG9tXCIpIHtcbm91dHB1dCArPSBcImxiLWl0ZW1cIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCI+XFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJlbWJlZFwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzcsdF81KSB7XG5pZih0XzcpIHsgY2IodF83KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzgsdF82KSB7XG5pZih0XzgpIHsgY2IodF84KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJpbWFnZVwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzExLHRfOSkge1xuaWYodF8xMSkgeyBjYih0XzExKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfOSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzEyLHRfMTApIHtcbmlmKHRfMTIpIHsgY2IodF8xMik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzEwKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbn0pO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcInF1b3RlXCIpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1pdGVtLXF1b3RlLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMTUsdF8xMykge1xuaWYodF8xNSkgeyBjYih0XzE1KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTMpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8xNix0XzE0KSB7XG5pZih0XzE2KSB7IGNiKHRfMTYpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xNCk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIDxhcnRpY2xlPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwidGV4dFwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9hcnRpY2xlPlxcbiAgICAgICAgXCI7XG47XG59XG47XG59XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8L2Rpdj5cXG4gICAgXCI7XG47XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICA8L2Rpdj5cXG4gIDwhLS0gaXRlbSBlbmQgLS0+XFxuXFxuPC9hcnRpY2xlPlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLXNsaWRlc2hvdy5odG1sXCJdID0gKGZ1bmN0aW9uKCkge1xuZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIHBhcmVudFRlbXBsYXRlID0gbnVsbDtcbm91dHB1dCArPSBcIjxkaXYgaWQ9XFxcInNsaWRlc2hvd1xcXCI+XFxuICA8ZGl2IGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcbiAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMyA9IHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmc1wiKTtcbmlmKHRfMykge3ZhciB0XzIgPSB0XzMubGVuZ3RoO1xuZm9yKHZhciB0XzE9MDsgdF8xIDwgdF8zLmxlbmd0aDsgdF8xKyspIHtcbnZhciB0XzQgPSB0XzNbdF8xXTtcbmZyYW1lLnNldChcInJlZlwiLCB0XzQpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleFwiLCB0XzEgKyAxKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXgwXCIsIHRfMSk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4XCIsIHRfMiAtIHRfMSk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4MFwiLCB0XzIgLSB0XzEgLSAxKTtcbmZyYW1lLnNldChcImxvb3AuZmlyc3RcIiwgdF8xID09PSAwKTtcbmZyYW1lLnNldChcImxvb3AubGFzdFwiLCB0XzEgPT09IHRfMiAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5sZW5ndGhcIiwgdF8yKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzcsdF81KSB7XG5pZih0XzcpIHsgY2IodF83KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzgsdF82KSB7XG5pZih0XzgpIHsgY2IodF84KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbn0pO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgPC9kaXY+XFxuICA8YnV0dG9uIGNsYXNzPVxcXCJjbG9zZVxcXCI+WDwvYnV0dG9uPlxcbiAgPGJ1dHRvbiBjbGFzcz1cXFwiZnVsbHNjcmVlblxcXCI+RnVsbHNjcmVlbjwvYnV0dG9uPlxcbiAgPGJ1dHRvbiBjbGFzcz1cXFwiYXJyb3dzIHByZXZcXFwiPiZsdDs8L2J1dHRvbj5cXG4gIDxidXR0b24gY2xhc3M9XFxcImFycm93cyBuZXh0XFxcIj4mZ3Q7PC9idXR0b24+XFxuPC9kaXY+XFxuXCI7XG5pZihwYXJlbnRUZW1wbGF0ZSkge1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSBlbHNlIHtcbmNiKG51bGwsIG91dHB1dCk7XG59XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbnJvb3Q6IHJvb3Rcbn07XG5cbn0pKCk7XG5yZXR1cm4gZnVuY3Rpb24oY3R4LCBjYikgeyByZXR1cm4gbnVuanVja3MucmVuZGVyKFwidGVtcGxhdGUtc2xpZGVzaG93Lmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCJdID0gKGZ1bmN0aW9uKCkge1xuZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIHBhcmVudFRlbXBsYXRlID0gbnVsbDtcbihwYXJlbnRUZW1wbGF0ZSA/IGZ1bmN0aW9uKGUsIGMsIGYsIHIsIGNiKSB7IGNiKFwiXCIpOyB9IDogY29udGV4dC5nZXRCbG9jayhcInRpbWVsaW5lXCIpKShlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBmdW5jdGlvbih0XzIsdF8xKSB7XG5pZih0XzIpIHsgY2IodF8yKTsgcmV0dXJuOyB9XG5vdXRwdXQgKz0gdF8xO1xub3V0cHV0ICs9IFwiXFxuXFxuXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtZW1iZWQtcHJvdmlkZXJzLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzUsdF8zKSB7XG5pZih0XzUpIHsgY2IodF81KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMyk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzYsdF80KSB7XG5pZih0XzYpIHsgY2IodF82KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNCk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcblxcblwiO1xuaWYocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpbmNsdWRlX2pzX29wdGlvbnNcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgPHNjcmlwdCB0eXBlPVxcXCJ0ZXh0L2phdmFzY3JpcHRcXFwiPlxcbiAgICB3aW5kb3cuTEIgPSBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImpzb25fb3B0aW9uc1wiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiO1xcbiAgPC9zY3JpcHQ+XFxuXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbn0pfSk7XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxuZnVuY3Rpb24gYl90aW1lbGluZShlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIGZyYW1lID0gZnJhbWUucHVzaCh0cnVlKTtcbm91dHB1dCArPSBcIlxcbjxkaXYgY2xhc3M9XFxcImxiLXRpbWVsaW5lIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJsYW5ndWFnZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93VGl0bGVcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJ0aXRsZVwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxoMT5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJ0aXRsZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2gxPlxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0Rlc2NyaXB0aW9uXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwiZGVzY3JpcHRpb25cIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJkZXNjcmlwdGlvblxcXCI+XFxuICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKGVudi5nZXRGaWx0ZXIoXCJzYWZlXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJkZXNjcmlwdGlvblwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgIDwvZGl2PlxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0ltYWdlXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwicGljdHVyZV91cmxcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8aW1nIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwicGljdHVyZV91cmxcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIiAvPlxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic3RpY2t5UG9zaXRpb25cIikgPT0gXCJ0b3BcIiAmJiBlbnYuZ2V0RmlsdGVyKFwibGVuZ3RoXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJzdGlja3lQb3N0c1wiKSksXCJfaXRlbXNcIikpID4gMCkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcInRpbWVsaW5lLXRvcCB0aW1lbGluZS10b3AtLWxvYWRlZFxcXCI+XFxuICAgICAgPHNlY3Rpb24gY2xhc3M9XFxcImxiLXBvc3RzIGxpc3QtZ3JvdXBcXFwiPlxcbiAgICAgICAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzkgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInN0aWNreVBvc3RzXCIpKSxcIl9pdGVtc1wiKTtcbmlmKHRfOSkge3ZhciB0XzggPSB0XzkubGVuZ3RoO1xuZm9yKHZhciB0Xzc9MDsgdF83IDwgdF85Lmxlbmd0aDsgdF83KyspIHtcbnZhciB0XzEwID0gdF85W3RfN107XG5mcmFtZS5zZXQoXCJpdGVtXCIsIHRfMTApO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleFwiLCB0XzcgKyAxKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXgwXCIsIHRfNyk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4XCIsIHRfOCAtIHRfNyk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4MFwiLCB0XzggLSB0XzcgLSAxKTtcbmZyYW1lLnNldChcImxvb3AuZmlyc3RcIiwgdF83ID09PSAwKTtcbmZyYW1lLnNldChcImxvb3AubGFzdFwiLCB0XzcgPT09IHRfOCAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5sZW5ndGhcIiwgdF84KTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgodF8xMCksXCJkZWxldGVkXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzEzLHRfMTEpIHtcbmlmKHRfMTMpIHsgY2IodF8xMyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzExKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMTQsdF8xMikge1xuaWYodF8xNCkgeyBjYih0XzE0KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTIpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG59KTtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG47XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgPC9zZWN0aW9uPlxcbiAgICA8L2Rpdj5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICA8IS0tIEhlYWRlciAtLT5cXG4gIDxkaXYgY2xhc3M9XFxcImhlYWRlci1iYXJcXFwiPlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJzb3J0aW5nLWJhclxcXCI+XFxuICAgICAgPGRpdiBjbGFzcz1cXFwic29ydGluZy1iYXJfX29yZGVyc1xcXCI+XFxuICAgICAgICA8ZGl2XFxuICAgICAgICAgIGNsYXNzPVxcXCJzb3J0aW5nLWJhcl9fb3JkZXIgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJwb3N0T3JkZXJcIikgPT0gXCJlZGl0b3JpYWxcIikge1xub3V0cHV0ICs9IFwic29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmVcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCJcXG4gICAgICAgICAgZGF0YS1qcy1vcmRlcmJ5X2VkaXRvcmlhbD5cXG4gICAgICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJvcHRpb25zXCIpKSxcImwxMG5cIikpLFwiZWRpdG9yaWFsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICA8ZGl2XFxuICAgICAgICAgIGNsYXNzPVxcXCJzb3J0aW5nLWJhcl9fb3JkZXIgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJwb3N0T3JkZXJcIikgPT0gXCJuZXdlc3RfZmlyc3RcIikge1xub3V0cHV0ICs9IFwic29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmVcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCJcXG4gICAgICAgICAgZGF0YS1qcy1vcmRlcmJ5X2Rlc2NlbmRpbmc+XFxuICAgICAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwib3B0aW9uc1wiKSksXCJsMTBuXCIpKSxcImRlc2NlbmRpbmdcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDxkaXZcXG4gICAgICAgICAgY2xhc3M9XFxcInNvcnRpbmctYmFyX19vcmRlciBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInBvc3RPcmRlclwiKSA9PSBcIm9sZGVzdF9maXJzdFwiKSB7XG5vdXRwdXQgKz0gXCJzb3J0aW5nLWJhcl9fb3JkZXItLWFjdGl2ZVwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxcIlxcbiAgICAgICAgICBkYXRhLWpzLW9yZGVyYnlfYXNjZW5kaW5nPlxcbiAgICAgICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm9wdGlvbnNcIikpLFwibDEwblwiKSksXCJhc2NlbmRpbmdcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8L2Rpdj5cXG4gICAgICA8L2Rpdj5cXG4gICAgPC9kaXY+XFxuICAgIDxkaXYgY2xhc3M9XFxcImhlYWRlci1iYXJfX2FjdGlvbnNcXFwiPjwvZGl2PlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwiY2FuQ29tbWVudFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8YnV0dG9uIGNsYXNzPVxcXCJoZWFkZXItYmFyX19jb21tZW50XFxcIiBkYXRhLWpzLXNob3ctY29tbWVudC1kaWFsb2c+Q29tbWVudDwvYnV0dG9uPlxcbiAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93TGl2ZWJsb2dMb2dvXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxhIGNsYXNzPVxcXCJoZWFkZXItYmFyX19sb2dvXFxcIiBocmVmPVxcXCJodHRwczovL3d3dy5saXZlYmxvZy5wcm9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5cXG4gICAgICAgICAgPHNwYW4+UG93ZXJlZCBieTwvc3Bhbj5cXG4gICAgICAgICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9sYi1sb2dvLnN2Z1xcXCIgLz5cXG4gICAgICAgIDwvYT5cXG4gICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICA8L2Rpdj5cXG4gIDwhLS0gSGVhZGVyIEVuZCAtLT5cXG5cXG4gIDwhLS0gQ29tbWVudCAtLT5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwiY2FuQ29tbWVudFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWNvbW1lbnQuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMTcsdF8xNSkge1xuaWYodF8xNykgeyBjYih0XzE3KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTUpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8xOCx0XzE2KSB7XG5pZih0XzE4KSB7IGNiKHRfMTgpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xNik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgXCI7XG59KTtcbn1cbm91dHB1dCArPSBcIlxcbiAgPCEtLSBDb21tZW50IEVuZCAtLT5cXG5cXG4gIDwhLS0gVGltZWxpbmUgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJ0aW1lbGluZS1ib2R5IHRpbWVsaW5lLWJvZHktLWxvYWRlZFxcXCI+XFxuICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic3RpY2t5UG9zaXRpb25cIikgPT0gXCJib3R0b21cIiAmJiBlbnYuZ2V0RmlsdGVyKFwibGVuZ3RoXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJzdGlja3lQb3N0c1wiKSksXCJfaXRlbXNcIikpID4gMCkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPHNlY3Rpb24gY2xhc3M9XFxcImxiLXBvc3RzIGxpc3QtZ3JvdXAgc3RpY2t5XFxcIj5cXG4gICAgICAgIFwiO1xuZnJhbWUgPSBmcmFtZS5wdXNoKCk7XG52YXIgdF8yMSA9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwic3RpY2t5UG9zdHNcIikpLFwiX2l0ZW1zXCIpO1xuaWYodF8yMSkge3ZhciB0XzIwID0gdF8yMS5sZW5ndGg7XG5mb3IodmFyIHRfMTk9MDsgdF8xOSA8IHRfMjEubGVuZ3RoOyB0XzE5KyspIHtcbnZhciB0XzIyID0gdF8yMVt0XzE5XTtcbmZyYW1lLnNldChcIml0ZW1cIiwgdF8yMik7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4XCIsIHRfMTkgKyAxKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXgwXCIsIHRfMTkpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzIwIC0gdF8xOSk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4MFwiLCB0XzIwIC0gdF8xOSAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5maXJzdFwiLCB0XzE5ID09PSAwKTtcbmZyYW1lLnNldChcImxvb3AubGFzdFwiLCB0XzE5ID09PSB0XzIwIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmxlbmd0aFwiLCB0XzIwKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgodF8yMiksXCJkZWxldGVkXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzI1LHRfMjMpIHtcbmlmKHRfMjUpIHsgY2IodF8yNSk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzIzKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMjYsdF8yNCkge1xuaWYodF8yNikgeyBjYih0XzI2KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMjQpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG59KTtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG47XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgPC9zZWN0aW9uPlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbmlmKGVudi5nZXRGaWx0ZXIoXCJsZW5ndGhcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInBvc3RzXCIpKSxcIl9pdGVtc1wiKSkgPT0gMCkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPGRpdiBjbGFzcz1cXFwibGItcG9zdCBlbXB0eS1tZXNzYWdlXFxcIj5cXG4gICAgICAgIDxkaXY+QmxvZyBwb3N0cyBhcmUgbm90IGN1cnJlbnRseSBhdmFpbGFibGUuPC9kaXY+XFxuICAgICAgPC9kaXY+XFxuICAgICAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJsYi1wb3N0cyBsaXN0LWdyb3VwIG5vcm1hbFxcXCI+XFxuICAgICAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMjkgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInBvc3RzXCIpKSxcIl9pdGVtc1wiKTtcbmlmKHRfMjkpIHt2YXIgdF8yOCA9IHRfMjkubGVuZ3RoO1xuZm9yKHZhciB0XzI3PTA7IHRfMjcgPCB0XzI5Lmxlbmd0aDsgdF8yNysrKSB7XG52YXIgdF8zMCA9IHRfMjlbdF8yN107XG5mcmFtZS5zZXQoXCJpdGVtXCIsIHRfMzApO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleFwiLCB0XzI3ICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzI3KTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF8yOCAtIHRfMjcpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF8yOCAtIHRfMjcgLSAxKTtcbmZyYW1lLnNldChcImxvb3AuZmlyc3RcIiwgdF8yNyA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF8yNyA9PT0gdF8yOCAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5sZW5ndGhcIiwgdF8yOCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHRfMzApLFwiZGVsZXRlZFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8zMyx0XzMxKSB7XG5pZih0XzMzKSB7IGNiKHRfMzMpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8zMSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzM0LHRfMzIpIHtcbmlmKHRfMzQpIHsgY2IodF8zNCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzMyKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIDwvc2VjdGlvbj5cXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInBvc3RzXCIpKSxcIl9tZXRhXCIpKSxcIm1heF9yZXN1bHRzXCIpIDw9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInBvc3RzXCIpKSxcIl9tZXRhXCIpKSxcInRvdGFsXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxidXR0b24gY2xhc3M9XFxcImxiLWJ1dHRvbiBsb2FkLW1vcmUtcG9zdHNcXFwiIGRhdGEtanMtbG9hZG1vcmU+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJvcHRpb25zXCIpKSxcImwxMG5cIikpLFwibG9hZE5ld1Bvc3RzXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvYnV0dG9uPlxcbiAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICA8L2Rpdj5cXG4gIDwhLS0gVGltZWxpbmUgRW5kIC0tPlxcblxcbjwvZGl2PlxcblwiO1xuY2IobnVsbCwgb3V0cHV0KTtcbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xuYl90aW1lbGluZTogYl90aW1lbGluZSxcbnJvb3Q6IHJvb3Rcbn07XG5cbn0pKCk7XG5yZXR1cm4gZnVuY3Rpb24oY3R4LCBjYikgeyByZXR1cm4gbnVuanVja3MucmVuZGVyKFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiJdfQ==
