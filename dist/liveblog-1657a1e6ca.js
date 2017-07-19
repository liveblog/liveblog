(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/skam/Work/liveblog-default-theme/js/liveblog.js":[function(require,module,exports){
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

},{"./theme":"/home/skam/Work/liveblog-default-theme/js/theme/index.js"}],"/home/skam/Work/liveblog-default-theme/js/theme/handlers.js":[function(require,module,exports){
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

},{"./helpers":"/home/skam/Work/liveblog-default-theme/js/theme/helpers.js","./view":"/home/skam/Work/liveblog-default-theme/js/theme/view.js","./viewmodel":"/home/skam/Work/liveblog-default-theme/js/theme/viewmodel.js"}],"/home/skam/Work/liveblog-default-theme/js/theme/helpers.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var moment = require('moment'),
    settings = window.LB.settings;

function convertTimestamp(timestamp) {
  if (!settings.datetimeFormat || settings.datetimeFormat === 'timeAgo') {
    return moment(timestamp).fromNow();
  }
  return moment(timestamp).format(settings.datetimeFormat);
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

},{"moment":"/home/skam/Work/liveblog-default-theme/node_modules/moment/moment.js"}],"/home/skam/Work/liveblog-default-theme/js/theme/index.js":[function(require,module,exports){
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

    view.updateTimestamps();
    setInterval(function () {
      view.updateTimestamps(); // Convert ISO dates to timeago
    }, 1000);
  }
};

},{"./handlers":"/home/skam/Work/liveblog-default-theme/js/theme/handlers.js","./local-analytics":"/home/skam/Work/liveblog-default-theme/js/theme/local-analytics.js","./pageview":"/home/skam/Work/liveblog-default-theme/js/theme/pageview.js","./view":"/home/skam/Work/liveblog-default-theme/js/theme/view.js","./viewmodel":"/home/skam/Work/liveblog-default-theme/js/theme/viewmodel.js"}],"/home/skam/Work/liveblog-default-theme/js/theme/local-analytics.js":[function(require,module,exports){
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

},{}],"/home/skam/Work/liveblog-default-theme/js/theme/pageview.js":[function(require,module,exports){
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

},{}],"/home/skam/Work/liveblog-default-theme/js/theme/slideshow.js":[function(require,module,exports){
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

},{"./templates":"/home/skam/Work/liveblog-default-theme/js/theme/templates.js"}],"/home/skam/Work/liveblog-default-theme/js/theme/templates.js":[function(require,module,exports){
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

},{"../../templates/template-item-embed.html":"/home/skam/Work/liveblog-default-theme/templates/template-item-embed.html","../../templates/template-item-image.html":"/home/skam/Work/liveblog-default-theme/templates/template-item-image.html","../../templates/template-post.html":"/home/skam/Work/liveblog-default-theme/templates/template-post.html","../../templates/template-slideshow.html":"/home/skam/Work/liveblog-default-theme/templates/template-slideshow.html","../../templates/template-timeline.html":"/home/skam/Work/liveblog-default-theme/templates/template-timeline.html","nunjucks/browser/nunjucks-slim":"/home/skam/Work/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/skam/Work/liveblog-default-theme/js/theme/view.js":[function(require,module,exports){
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
  updateTimestamps();
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

},{"./helpers":"/home/skam/Work/liveblog-default-theme/js/theme/helpers.js","./slideshow":"/home/skam/Work/liveblog-default-theme/js/theme/slideshow.js","./templates":"/home/skam/Work/liveblog-default-theme/js/theme/templates.js"}],"/home/skam/Work/liveblog-default-theme/js/theme/viewmodel.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var helpers = require('./helpers'),
    view = require('./view');

var commentItemEndpoint = LB.api_host + 'api/client_items';
var commentPostEndpoint = LB.api_host + 'api/client_comments';

var endpoint = LB.api_host + "api/client_blogs/" + LB.blog._id + "/posts",
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

},{"./helpers":"/home/skam/Work/liveblog-default-theme/js/theme/helpers.js","./view":"/home/skam/Work/liveblog-default-theme/js/theme/view.js"}],"/home/skam/Work/liveblog-default-theme/node_modules/moment/moment.js":[function(require,module,exports){
//! moment.js
//! version : 2.18.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () { 'use strict';

var hookCallback;

function hooks () {
    return hookCallback.apply(null, arguments);
}

// This is done to register the method called with moment()
// without creating circular dependencies.
function setHookCallback (callback) {
    hookCallback = callback;
}

function isArray(input) {
    return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
}

function isObject(input) {
    // IE8 will treat undefined and null as object if it wasn't for
    // input != null
    return input != null && Object.prototype.toString.call(input) === '[object Object]';
}

function isObjectEmpty(obj) {
    var k;
    for (k in obj) {
        // even if its not own property I'd still call it non-empty
        return false;
    }
    return true;
}

function isUndefined(input) {
    return input === void 0;
}

function isNumber(input) {
    return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
}

function isDate(input) {
    return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
}

function map(arr, fn) {
    var res = [], i;
    for (i = 0; i < arr.length; ++i) {
        res.push(fn(arr[i], i));
    }
    return res;
}

function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
}

function extend(a, b) {
    for (var i in b) {
        if (hasOwnProp(b, i)) {
            a[i] = b[i];
        }
    }

    if (hasOwnProp(b, 'toString')) {
        a.toString = b.toString;
    }

    if (hasOwnProp(b, 'valueOf')) {
        a.valueOf = b.valueOf;
    }

    return a;
}

function createUTC (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, true).utc();
}

function defaultParsingFlags() {
    // We need to deep clone this object.
    return {
        empty           : false,
        unusedTokens    : [],
        unusedInput     : [],
        overflow        : -2,
        charsLeftOver   : 0,
        nullInput       : false,
        invalidMonth    : null,
        invalidFormat   : false,
        userInvalidated : false,
        iso             : false,
        parsedDateParts : [],
        meridiem        : null,
        rfc2822         : false,
        weekdayMismatch : false
    };
}

function getParsingFlags(m) {
    if (m._pf == null) {
        m._pf = defaultParsingFlags();
    }
    return m._pf;
}

var some;
if (Array.prototype.some) {
    some = Array.prototype.some;
} else {
    some = function (fun) {
        var t = Object(this);
        var len = t.length >>> 0;

        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(this, t[i], i, t)) {
                return true;
            }
        }

        return false;
    };
}

var some$1 = some;

function isValid(m) {
    if (m._isValid == null) {
        var flags = getParsingFlags(m);
        var parsedParts = some$1.call(flags.parsedDateParts, function (i) {
            return i != null;
        });
        var isNowValid = !isNaN(m._d.getTime()) &&
            flags.overflow < 0 &&
            !flags.empty &&
            !flags.invalidMonth &&
            !flags.invalidWeekday &&
            !flags.nullInput &&
            !flags.invalidFormat &&
            !flags.userInvalidated &&
            (!flags.meridiem || (flags.meridiem && parsedParts));

        if (m._strict) {
            isNowValid = isNowValid &&
                flags.charsLeftOver === 0 &&
                flags.unusedTokens.length === 0 &&
                flags.bigHour === undefined;
        }

        if (Object.isFrozen == null || !Object.isFrozen(m)) {
            m._isValid = isNowValid;
        }
        else {
            return isNowValid;
        }
    }
    return m._isValid;
}

function createInvalid (flags) {
    var m = createUTC(NaN);
    if (flags != null) {
        extend(getParsingFlags(m), flags);
    }
    else {
        getParsingFlags(m).userInvalidated = true;
    }

    return m;
}

// Plugins that add properties should also add the key here (null value),
// so we can properly clone ourselves.
var momentProperties = hooks.momentProperties = [];

function copyConfig(to, from) {
    var i, prop, val;

    if (!isUndefined(from._isAMomentObject)) {
        to._isAMomentObject = from._isAMomentObject;
    }
    if (!isUndefined(from._i)) {
        to._i = from._i;
    }
    if (!isUndefined(from._f)) {
        to._f = from._f;
    }
    if (!isUndefined(from._l)) {
        to._l = from._l;
    }
    if (!isUndefined(from._strict)) {
        to._strict = from._strict;
    }
    if (!isUndefined(from._tzm)) {
        to._tzm = from._tzm;
    }
    if (!isUndefined(from._isUTC)) {
        to._isUTC = from._isUTC;
    }
    if (!isUndefined(from._offset)) {
        to._offset = from._offset;
    }
    if (!isUndefined(from._pf)) {
        to._pf = getParsingFlags(from);
    }
    if (!isUndefined(from._locale)) {
        to._locale = from._locale;
    }

    if (momentProperties.length > 0) {
        for (i = 0; i < momentProperties.length; i++) {
            prop = momentProperties[i];
            val = from[prop];
            if (!isUndefined(val)) {
                to[prop] = val;
            }
        }
    }

    return to;
}

var updateInProgress = false;

// Moment prototype object
function Moment(config) {
    copyConfig(this, config);
    this._d = new Date(config._d != null ? config._d.getTime() : NaN);
    if (!this.isValid()) {
        this._d = new Date(NaN);
    }
    // Prevent infinite loop in case updateOffset creates new moment
    // objects.
    if (updateInProgress === false) {
        updateInProgress = true;
        hooks.updateOffset(this);
        updateInProgress = false;
    }
}

function isMoment (obj) {
    return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
}

function absFloor (number) {
    if (number < 0) {
        // -0 -> 0
        return Math.ceil(number) || 0;
    } else {
        return Math.floor(number);
    }
}

function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion,
        value = 0;

    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
        value = absFloor(coercedNumber);
    }

    return value;
}

// compare two arrays, return the number of differences
function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length),
        lengthDiff = Math.abs(array1.length - array2.length),
        diffs = 0,
        i;
    for (i = 0; i < len; i++) {
        if ((dontConvert && array1[i] !== array2[i]) ||
            (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
            diffs++;
        }
    }
    return diffs + lengthDiff;
}

function warn(msg) {
    if (hooks.suppressDeprecationWarnings === false &&
            (typeof console !==  'undefined') && console.warn) {
        console.warn('Deprecation warning: ' + msg);
    }
}

function deprecate(msg, fn) {
    var firstTime = true;

    return extend(function () {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(null, msg);
        }
        if (firstTime) {
            var args = [];
            var arg;
            for (var i = 0; i < arguments.length; i++) {
                arg = '';
                if (typeof arguments[i] === 'object') {
                    arg += '\n[' + i + '] ';
                    for (var key in arguments[0]) {
                        arg += key + ': ' + arguments[0][key] + ', ';
                    }
                    arg = arg.slice(0, -2); // Remove trailing comma and space
                } else {
                    arg = arguments[i];
                }
                args.push(arg);
            }
            warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
            firstTime = false;
        }
        return fn.apply(this, arguments);
    }, fn);
}

var deprecations = {};

function deprecateSimple(name, msg) {
    if (hooks.deprecationHandler != null) {
        hooks.deprecationHandler(name, msg);
    }
    if (!deprecations[name]) {
        warn(msg);
        deprecations[name] = true;
    }
}

hooks.suppressDeprecationWarnings = false;
hooks.deprecationHandler = null;

function isFunction(input) {
    return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
}

function set (config) {
    var prop, i;
    for (i in config) {
        prop = config[i];
        if (isFunction(prop)) {
            this[i] = prop;
        } else {
            this['_' + i] = prop;
        }
    }
    this._config = config;
    // Lenient ordinal parsing accepts just a number in addition to
    // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
    // TODO: Remove "ordinalParse" fallback in next major release.
    this._dayOfMonthOrdinalParseLenient = new RegExp(
        (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
            '|' + (/\d{1,2}/).source);
}

function mergeConfigs(parentConfig, childConfig) {
    var res = extend({}, parentConfig), prop;
    for (prop in childConfig) {
        if (hasOwnProp(childConfig, prop)) {
            if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                res[prop] = {};
                extend(res[prop], parentConfig[prop]);
                extend(res[prop], childConfig[prop]);
            } else if (childConfig[prop] != null) {
                res[prop] = childConfig[prop];
            } else {
                delete res[prop];
            }
        }
    }
    for (prop in parentConfig) {
        if (hasOwnProp(parentConfig, prop) &&
                !hasOwnProp(childConfig, prop) &&
                isObject(parentConfig[prop])) {
            // make sure changes to properties don't modify parent config
            res[prop] = extend({}, res[prop]);
        }
    }
    return res;
}

function Locale(config) {
    if (config != null) {
        this.set(config);
    }
}

var keys;

if (Object.keys) {
    keys = Object.keys;
} else {
    keys = function (obj) {
        var i, res = [];
        for (i in obj) {
            if (hasOwnProp(obj, i)) {
                res.push(i);
            }
        }
        return res;
    };
}

var keys$1 = keys;

var defaultCalendar = {
    sameDay : '[Today at] LT',
    nextDay : '[Tomorrow at] LT',
    nextWeek : 'dddd [at] LT',
    lastDay : '[Yesterday at] LT',
    lastWeek : '[Last] dddd [at] LT',
    sameElse : 'L'
};

function calendar (key, mom, now) {
    var output = this._calendar[key] || this._calendar['sameElse'];
    return isFunction(output) ? output.call(mom, now) : output;
}

var defaultLongDateFormat = {
    LTS  : 'h:mm:ss A',
    LT   : 'h:mm A',
    L    : 'MM/DD/YYYY',
    LL   : 'MMMM D, YYYY',
    LLL  : 'MMMM D, YYYY h:mm A',
    LLLL : 'dddd, MMMM D, YYYY h:mm A'
};

function longDateFormat (key) {
    var format = this._longDateFormat[key],
        formatUpper = this._longDateFormat[key.toUpperCase()];

    if (format || !formatUpper) {
        return format;
    }

    this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
        return val.slice(1);
    });

    return this._longDateFormat[key];
}

var defaultInvalidDate = 'Invalid date';

function invalidDate () {
    return this._invalidDate;
}

var defaultOrdinal = '%d';
var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

function ordinal (number) {
    return this._ordinal.replace('%d', number);
}

var defaultRelativeTime = {
    future : 'in %s',
    past   : '%s ago',
    s  : 'a few seconds',
    ss : '%d seconds',
    m  : 'a minute',
    mm : '%d minutes',
    h  : 'an hour',
    hh : '%d hours',
    d  : 'a day',
    dd : '%d days',
    M  : 'a month',
    MM : '%d months',
    y  : 'a year',
    yy : '%d years'
};

function relativeTime (number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return (isFunction(output)) ?
        output(number, withoutSuffix, string, isFuture) :
        output.replace(/%d/i, number);
}

function pastFuture (diff, output) {
    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
}

var aliases = {};

function addUnitAlias (unit, shorthand) {
    var lowerCase = unit.toLowerCase();
    aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
}

function normalizeUnits(units) {
    return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
}

function normalizeObjectUnits(inputObject) {
    var normalizedInput = {},
        normalizedProp,
        prop;

    for (prop in inputObject) {
        if (hasOwnProp(inputObject, prop)) {
            normalizedProp = normalizeUnits(prop);
            if (normalizedProp) {
                normalizedInput[normalizedProp] = inputObject[prop];
            }
        }
    }

    return normalizedInput;
}

var priorities = {};

function addUnitPriority(unit, priority) {
    priorities[unit] = priority;
}

function getPrioritizedUnits(unitsObj) {
    var units = [];
    for (var u in unitsObj) {
        units.push({unit: u, priority: priorities[u]});
    }
    units.sort(function (a, b) {
        return a.priority - b.priority;
    });
    return units;
}

function makeGetSet (unit, keepTime) {
    return function (value) {
        if (value != null) {
            set$1(this, unit, value);
            hooks.updateOffset(this, keepTime);
            return this;
        } else {
            return get(this, unit);
        }
    };
}

function get (mom, unit) {
    return mom.isValid() ?
        mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
}

function set$1 (mom, unit, value) {
    if (mom.isValid()) {
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    }
}

// MOMENTS

function stringGet (units) {
    units = normalizeUnits(units);
    if (isFunction(this[units])) {
        return this[units]();
    }
    return this;
}


function stringSet (units, value) {
    if (typeof units === 'object') {
        units = normalizeObjectUnits(units);
        var prioritized = getPrioritizedUnits(units);
        for (var i = 0; i < prioritized.length; i++) {
            this[prioritized[i].unit](units[prioritized[i].unit]);
        }
    } else {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units](value);
        }
    }
    return this;
}

function zeroFill(number, targetLength, forceSign) {
    var absNumber = '' + Math.abs(number),
        zerosToFill = targetLength - absNumber.length,
        sign = number >= 0;
    return (sign ? (forceSign ? '+' : '') : '-') +
        Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
}

var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

var formatFunctions = {};

var formatTokenFunctions = {};

// token:    'M'
// padded:   ['MM', 2]
// ordinal:  'Mo'
// callback: function () { this.month() + 1 }
function addFormatToken (token, padded, ordinal, callback) {
    var func = callback;
    if (typeof callback === 'string') {
        func = function () {
            return this[callback]();
        };
    }
    if (token) {
        formatTokenFunctions[token] = func;
    }
    if (padded) {
        formatTokenFunctions[padded[0]] = function () {
            return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
        };
    }
    if (ordinal) {
        formatTokenFunctions[ordinal] = function () {
            return this.localeData().ordinal(func.apply(this, arguments), token);
        };
    }
}

function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
        return input.replace(/^\[|\]$/g, '');
    }
    return input.replace(/\\/g, '');
}

function makeFormatFunction(format) {
    var array = format.match(formattingTokens), i, length;

    for (i = 0, length = array.length; i < length; i++) {
        if (formatTokenFunctions[array[i]]) {
            array[i] = formatTokenFunctions[array[i]];
        } else {
            array[i] = removeFormattingTokens(array[i]);
        }
    }

    return function (mom) {
        var output = '', i;
        for (i = 0; i < length; i++) {
            output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
        }
        return output;
    };
}

// format date using native date object
function formatMoment(m, format) {
    if (!m.isValid()) {
        return m.localeData().invalidDate();
    }

    format = expandFormat(format, m.localeData());
    formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

    return formatFunctions[format](m);
}

function expandFormat(format, locale) {
    var i = 5;

    function replaceLongDateFormatTokens(input) {
        return locale.longDateFormat(input) || input;
    }

    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
        format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        localFormattingTokens.lastIndex = 0;
        i -= 1;
    }

    return format;
}

var match1         = /\d/;            //       0 - 9
var match2         = /\d\d/;          //      00 - 99
var match3         = /\d{3}/;         //     000 - 999
var match4         = /\d{4}/;         //    0000 - 9999
var match6         = /[+-]?\d{6}/;    // -999999 - 999999
var match1to2      = /\d\d?/;         //       0 - 99
var match3to4      = /\d\d\d\d?/;     //     999 - 9999
var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
var match1to3      = /\d{1,3}/;       //       0 - 999
var match1to4      = /\d{1,4}/;       //       0 - 9999
var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

var matchUnsigned  = /\d+/;           //       0 - inf
var matchSigned    = /[+-]?\d+/;      //    -inf - inf

var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

// any word (or two) characters or numbers including two/three word month in arabic.
// includes scottish gaelic two word and hyphenated months
var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


var regexes = {};

function addRegexToken (token, regex, strictRegex) {
    regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
        return (isStrict && strictRegex) ? strictRegex : regex;
    };
}

function getParseRegexForToken (token, config) {
    if (!hasOwnProp(regexes, token)) {
        return new RegExp(unescapeFormat(token));
    }

    return regexes[token](config._strict, config._locale);
}

// Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
function unescapeFormat(s) {
    return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
        return p1 || p2 || p3 || p4;
    }));
}

function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

var tokens = {};

function addParseToken (token, callback) {
    var i, func = callback;
    if (typeof token === 'string') {
        token = [token];
    }
    if (isNumber(callback)) {
        func = function (input, array) {
            array[callback] = toInt(input);
        };
    }
    for (i = 0; i < token.length; i++) {
        tokens[token[i]] = func;
    }
}

function addWeekParseToken (token, callback) {
    addParseToken(token, function (input, array, config, token) {
        config._w = config._w || {};
        callback(input, config._w, config, token);
    });
}

function addTimeToArrayFromToken(token, input, config) {
    if (input != null && hasOwnProp(tokens, token)) {
        tokens[token](input, config._a, config, token);
    }
}

var YEAR = 0;
var MONTH = 1;
var DATE = 2;
var HOUR = 3;
var MINUTE = 4;
var SECOND = 5;
var MILLISECOND = 6;
var WEEK = 7;
var WEEKDAY = 8;

var indexOf;

if (Array.prototype.indexOf) {
    indexOf = Array.prototype.indexOf;
} else {
    indexOf = function (o) {
        // I know
        var i;
        for (i = 0; i < this.length; ++i) {
            if (this[i] === o) {
                return i;
            }
        }
        return -1;
    };
}

var indexOf$1 = indexOf;

function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// FORMATTING

addFormatToken('M', ['MM', 2], 'Mo', function () {
    return this.month() + 1;
});

addFormatToken('MMM', 0, 0, function (format) {
    return this.localeData().monthsShort(this, format);
});

addFormatToken('MMMM', 0, 0, function (format) {
    return this.localeData().months(this, format);
});

// ALIASES

addUnitAlias('month', 'M');

// PRIORITY

addUnitPriority('month', 8);

// PARSING

addRegexToken('M',    match1to2);
addRegexToken('MM',   match1to2, match2);
addRegexToken('MMM',  function (isStrict, locale) {
    return locale.monthsShortRegex(isStrict);
});
addRegexToken('MMMM', function (isStrict, locale) {
    return locale.monthsRegex(isStrict);
});

addParseToken(['M', 'MM'], function (input, array) {
    array[MONTH] = toInt(input) - 1;
});

addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
    var month = config._locale.monthsParse(input, token, config._strict);
    // if we didn't find a month name, mark the date as invalid.
    if (month != null) {
        array[MONTH] = month;
    } else {
        getParsingFlags(config).invalidMonth = input;
    }
});

// LOCALES

var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
function localeMonths (m, format) {
    if (!m) {
        return isArray(this._months) ? this._months :
            this._months['standalone'];
    }
    return isArray(this._months) ? this._months[m.month()] :
        this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
}

var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
function localeMonthsShort (m, format) {
    if (!m) {
        return isArray(this._monthsShort) ? this._monthsShort :
            this._monthsShort['standalone'];
    }
    return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
        this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
}

function handleStrictParse(monthName, format, strict) {
    var i, ii, mom, llc = monthName.toLocaleLowerCase();
    if (!this._monthsParse) {
        // this is not used
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
        for (i = 0; i < 12; ++i) {
            mom = createUTC([2000, i]);
            this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
            this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'MMM') {
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'MMM') {
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._longMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeMonthsParse (monthName, format, strict) {
    var i, mom, regex;

    if (this._monthsParseExact) {
        return handleStrictParse.call(this, monthName, format, strict);
    }

    if (!this._monthsParse) {
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
    }

    // TODO: add sorting
    // Sorting makes sure if one month (or abbr) is a prefix of another
    // see sorting in computeMonthsParse
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        if (strict && !this._longMonthsParse[i]) {
            this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
            this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
        }
        if (!strict && !this._monthsParse[i]) {
            regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
            this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
            return i;
        } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
            return i;
        } else if (!strict && this._monthsParse[i].test(monthName)) {
            return i;
        }
    }
}

// MOMENTS

function setMonth (mom, value) {
    var dayOfMonth;

    if (!mom.isValid()) {
        // No op
        return mom;
    }

    if (typeof value === 'string') {
        if (/^\d+$/.test(value)) {
            value = toInt(value);
        } else {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (!isNumber(value)) {
                return mom;
            }
        }
    }

    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
    return mom;
}

function getSetMonth (value) {
    if (value != null) {
        setMonth(this, value);
        hooks.updateOffset(this, true);
        return this;
    } else {
        return get(this, 'Month');
    }
}

function getDaysInMonth () {
    return daysInMonth(this.year(), this.month());
}

var defaultMonthsShortRegex = matchWord;
function monthsShortRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsShortStrictRegex;
        } else {
            return this._monthsShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsShortRegex')) {
            this._monthsShortRegex = defaultMonthsShortRegex;
        }
        return this._monthsShortStrictRegex && isStrict ?
            this._monthsShortStrictRegex : this._monthsShortRegex;
    }
}

var defaultMonthsRegex = matchWord;
function monthsRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsStrictRegex;
        } else {
            return this._monthsRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsRegex')) {
            this._monthsRegex = defaultMonthsRegex;
        }
        return this._monthsStrictRegex && isStrict ?
            this._monthsStrictRegex : this._monthsRegex;
    }
}

function computeMonthsParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom;
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        shortPieces.push(this.monthsShort(mom, ''));
        longPieces.push(this.months(mom, ''));
        mixedPieces.push(this.months(mom, ''));
        mixedPieces.push(this.monthsShort(mom, ''));
    }
    // Sorting makes sure if one month (or abbr) is a prefix of another it
    // will match the longer piece.
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 12; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
    }
    for (i = 0; i < 24; i++) {
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._monthsShortRegex = this._monthsRegex;
    this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
}

// FORMATTING

addFormatToken('Y', 0, 0, function () {
    var y = this.year();
    return y <= 9999 ? '' + y : '+' + y;
});

addFormatToken(0, ['YY', 2], 0, function () {
    return this.year() % 100;
});

addFormatToken(0, ['YYYY',   4],       0, 'year');
addFormatToken(0, ['YYYYY',  5],       0, 'year');
addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

// ALIASES

addUnitAlias('year', 'y');

// PRIORITIES

addUnitPriority('year', 1);

// PARSING

addRegexToken('Y',      matchSigned);
addRegexToken('YY',     match1to2, match2);
addRegexToken('YYYY',   match1to4, match4);
addRegexToken('YYYYY',  match1to6, match6);
addRegexToken('YYYYYY', match1to6, match6);

addParseToken(['YYYYY', 'YYYYYY'], YEAR);
addParseToken('YYYY', function (input, array) {
    array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
});
addParseToken('YY', function (input, array) {
    array[YEAR] = hooks.parseTwoDigitYear(input);
});
addParseToken('Y', function (input, array) {
    array[YEAR] = parseInt(input, 10);
});

// HELPERS

function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// HOOKS

hooks.parseTwoDigitYear = function (input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
};

// MOMENTS

var getSetYear = makeGetSet('FullYear', true);

function getIsLeapYear () {
    return isLeapYear(this.year());
}

function createDate (y, m, d, h, M, s, ms) {
    // can't just apply() to create a date:
    // https://stackoverflow.com/q/181348
    var date = new Date(y, m, d, h, M, s, ms);

    // the date constructor remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
        date.setFullYear(y);
    }
    return date;
}

function createUTCDate (y) {
    var date = new Date(Date.UTC.apply(null, arguments));

    // the Date.UTC function remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
        date.setUTCFullYear(y);
    }
    return date;
}

// start-of-first-week - start-of-year
function firstWeekOffset(year, dow, doy) {
    var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
        fwd = 7 + dow - doy,
        // first-week day local weekday -- which local weekday is fwd
        fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

    return -fwdlw + fwd - 1;
}

// https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    var localWeekday = (7 + weekday - dow) % 7,
        weekOffset = firstWeekOffset(year, dow, doy),
        dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
        resYear, resDayOfYear;

    if (dayOfYear <= 0) {
        resYear = year - 1;
        resDayOfYear = daysInYear(resYear) + dayOfYear;
    } else if (dayOfYear > daysInYear(year)) {
        resYear = year + 1;
        resDayOfYear = dayOfYear - daysInYear(year);
    } else {
        resYear = year;
        resDayOfYear = dayOfYear;
    }

    return {
        year: resYear,
        dayOfYear: resDayOfYear
    };
}

function weekOfYear(mom, dow, doy) {
    var weekOffset = firstWeekOffset(mom.year(), dow, doy),
        week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
        resWeek, resYear;

    if (week < 1) {
        resYear = mom.year() - 1;
        resWeek = week + weeksInYear(resYear, dow, doy);
    } else if (week > weeksInYear(mom.year(), dow, doy)) {
        resWeek = week - weeksInYear(mom.year(), dow, doy);
        resYear = mom.year() + 1;
    } else {
        resYear = mom.year();
        resWeek = week;
    }

    return {
        week: resWeek,
        year: resYear
    };
}

function weeksInYear(year, dow, doy) {
    var weekOffset = firstWeekOffset(year, dow, doy),
        weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
}

// FORMATTING

addFormatToken('w', ['ww', 2], 'wo', 'week');
addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

// ALIASES

addUnitAlias('week', 'w');
addUnitAlias('isoWeek', 'W');

// PRIORITIES

addUnitPriority('week', 5);
addUnitPriority('isoWeek', 5);

// PARSING

addRegexToken('w',  match1to2);
addRegexToken('ww', match1to2, match2);
addRegexToken('W',  match1to2);
addRegexToken('WW', match1to2, match2);

addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
    week[token.substr(0, 1)] = toInt(input);
});

// HELPERS

// LOCALES

function localeWeek (mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
}

var defaultLocaleWeek = {
    dow : 0, // Sunday is the first day of the week.
    doy : 6  // The week that contains Jan 1st is the first week of the year.
};

function localeFirstDayOfWeek () {
    return this._week.dow;
}

function localeFirstDayOfYear () {
    return this._week.doy;
}

// MOMENTS

function getSetWeek (input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, 'd');
}

function getSetISOWeek (input) {
    var week = weekOfYear(this, 1, 4).week;
    return input == null ? week : this.add((input - week) * 7, 'd');
}

// FORMATTING

addFormatToken('d', 0, 'do', 'day');

addFormatToken('dd', 0, 0, function (format) {
    return this.localeData().weekdaysMin(this, format);
});

addFormatToken('ddd', 0, 0, function (format) {
    return this.localeData().weekdaysShort(this, format);
});

addFormatToken('dddd', 0, 0, function (format) {
    return this.localeData().weekdays(this, format);
});

addFormatToken('e', 0, 0, 'weekday');
addFormatToken('E', 0, 0, 'isoWeekday');

// ALIASES

addUnitAlias('day', 'd');
addUnitAlias('weekday', 'e');
addUnitAlias('isoWeekday', 'E');

// PRIORITY
addUnitPriority('day', 11);
addUnitPriority('weekday', 11);
addUnitPriority('isoWeekday', 11);

// PARSING

addRegexToken('d',    match1to2);
addRegexToken('e',    match1to2);
addRegexToken('E',    match1to2);
addRegexToken('dd',   function (isStrict, locale) {
    return locale.weekdaysMinRegex(isStrict);
});
addRegexToken('ddd',   function (isStrict, locale) {
    return locale.weekdaysShortRegex(isStrict);
});
addRegexToken('dddd',   function (isStrict, locale) {
    return locale.weekdaysRegex(isStrict);
});

addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
    var weekday = config._locale.weekdaysParse(input, token, config._strict);
    // if we didn't get a weekday name, mark the date as invalid
    if (weekday != null) {
        week.d = weekday;
    } else {
        getParsingFlags(config).invalidWeekday = input;
    }
});

addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
    week[token] = toInt(input);
});

// HELPERS

function parseWeekday(input, locale) {
    if (typeof input !== 'string') {
        return input;
    }

    if (!isNaN(input)) {
        return parseInt(input, 10);
    }

    input = locale.weekdaysParse(input);
    if (typeof input === 'number') {
        return input;
    }

    return null;
}

function parseIsoWeekday(input, locale) {
    if (typeof input === 'string') {
        return locale.weekdaysParse(input) % 7 || 7;
    }
    return isNaN(input) ? null : input;
}

// LOCALES

var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
function localeWeekdays (m, format) {
    if (!m) {
        return isArray(this._weekdays) ? this._weekdays :
            this._weekdays['standalone'];
    }
    return isArray(this._weekdays) ? this._weekdays[m.day()] :
        this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
}

var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
function localeWeekdaysShort (m) {
    return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
}

var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
function localeWeekdaysMin (m) {
    return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
}

function handleStrictParse$1(weekdayName, format, strict) {
    var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._minWeekdaysParse = [];

        for (i = 0; i < 7; ++i) {
            mom = createUTC([2000, 1]).day(i);
            this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
            this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
            this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'dddd') {
            ii = indexOf$1.call(this._weekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'dddd') {
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeWeekdaysParse (weekdayName, format, strict) {
    var i, mom, regex;

    if (this._weekdaysParseExact) {
        return handleStrictParse$1.call(this, weekdayName, format, strict);
    }

    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._minWeekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._fullWeekdaysParse = [];
    }

    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already

        mom = createUTC([2000, 1]).day(i);
        if (strict && !this._fullWeekdaysParse[i]) {
            this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
            this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
            this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
        }
        if (!this._weekdaysParse[i]) {
            regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
            this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
            return i;
        }
    }
}

// MOMENTS

function getSetDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
    if (input != null) {
        input = parseWeekday(input, this.localeData());
        return this.add(input - day, 'd');
    } else {
        return day;
    }
}

function getSetLocaleDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, 'd');
}

function getSetISODayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }

    // behaves the same as moment#day except
    // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
    // as a setter, sunday should belong to the previous week.

    if (input != null) {
        var weekday = parseIsoWeekday(input, this.localeData());
        return this.day(this.day() % 7 ? weekday : weekday - 7);
    } else {
        return this.day() || 7;
    }
}

var defaultWeekdaysRegex = matchWord;
function weekdaysRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysStrictRegex;
        } else {
            return this._weekdaysRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            this._weekdaysRegex = defaultWeekdaysRegex;
        }
        return this._weekdaysStrictRegex && isStrict ?
            this._weekdaysStrictRegex : this._weekdaysRegex;
    }
}

var defaultWeekdaysShortRegex = matchWord;
function weekdaysShortRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysShortStrictRegex;
        } else {
            return this._weekdaysShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysShortRegex')) {
            this._weekdaysShortRegex = defaultWeekdaysShortRegex;
        }
        return this._weekdaysShortStrictRegex && isStrict ?
            this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
    }
}

var defaultWeekdaysMinRegex = matchWord;
function weekdaysMinRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysMinStrictRegex;
        } else {
            return this._weekdaysMinRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysMinRegex')) {
            this._weekdaysMinRegex = defaultWeekdaysMinRegex;
        }
        return this._weekdaysMinStrictRegex && isStrict ?
            this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
    }
}


function computeWeekdaysParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom, minp, shortp, longp;
    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, 1]).day(i);
        minp = this.weekdaysMin(mom, '');
        shortp = this.weekdaysShort(mom, '');
        longp = this.weekdays(mom, '');
        minPieces.push(minp);
        shortPieces.push(shortp);
        longPieces.push(longp);
        mixedPieces.push(minp);
        mixedPieces.push(shortp);
        mixedPieces.push(longp);
    }
    // Sorting makes sure if one weekday (or abbr) is a prefix of another it
    // will match the longer piece.
    minPieces.sort(cmpLenRev);
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 7; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._weekdaysShortRegex = this._weekdaysRegex;
    this._weekdaysMinRegex = this._weekdaysRegex;

    this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
}

// FORMATTING

function hFormat() {
    return this.hours() % 12 || 12;
}

function kFormat() {
    return this.hours() || 24;
}

addFormatToken('H', ['HH', 2], 0, 'hour');
addFormatToken('h', ['hh', 2], 0, hFormat);
addFormatToken('k', ['kk', 2], 0, kFormat);

addFormatToken('hmm', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
});

addFormatToken('hmmss', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

addFormatToken('Hmm', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2);
});

addFormatToken('Hmmss', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

function meridiem (token, lowercase) {
    addFormatToken(token, 0, 0, function () {
        return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
    });
}

meridiem('a', true);
meridiem('A', false);

// ALIASES

addUnitAlias('hour', 'h');

// PRIORITY
addUnitPriority('hour', 13);

// PARSING

function matchMeridiem (isStrict, locale) {
    return locale._meridiemParse;
}

addRegexToken('a',  matchMeridiem);
addRegexToken('A',  matchMeridiem);
addRegexToken('H',  match1to2);
addRegexToken('h',  match1to2);
addRegexToken('k',  match1to2);
addRegexToken('HH', match1to2, match2);
addRegexToken('hh', match1to2, match2);
addRegexToken('kk', match1to2, match2);

addRegexToken('hmm', match3to4);
addRegexToken('hmmss', match5to6);
addRegexToken('Hmm', match3to4);
addRegexToken('Hmmss', match5to6);

addParseToken(['H', 'HH'], HOUR);
addParseToken(['k', 'kk'], function (input, array, config) {
    var kInput = toInt(input);
    array[HOUR] = kInput === 24 ? 0 : kInput;
});
addParseToken(['a', 'A'], function (input, array, config) {
    config._isPm = config._locale.isPM(input);
    config._meridiem = input;
});
addParseToken(['h', 'hh'], function (input, array, config) {
    array[HOUR] = toInt(input);
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
    getParsingFlags(config).bigHour = true;
});
addParseToken('Hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
});
addParseToken('Hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
});

// LOCALES

function localeIsPM (input) {
    // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
    // Using charAt should be more compatible.
    return ((input + '').toLowerCase().charAt(0) === 'p');
}

var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
function localeMeridiem (hours, minutes, isLower) {
    if (hours > 11) {
        return isLower ? 'pm' : 'PM';
    } else {
        return isLower ? 'am' : 'AM';
    }
}


// MOMENTS

// Setting the hour should keep the time, because the user explicitly
// specified which hour he wants. So trying to maintain the same hour (in
// a new timezone) makes sense. Adding/subtracting hours does not follow
// this rule.
var getSetHour = makeGetSet('Hours', true);

// months
// week
// weekdays
// meridiem
var baseConfig = {
    calendar: defaultCalendar,
    longDateFormat: defaultLongDateFormat,
    invalidDate: defaultInvalidDate,
    ordinal: defaultOrdinal,
    dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
    relativeTime: defaultRelativeTime,

    months: defaultLocaleMonths,
    monthsShort: defaultLocaleMonthsShort,

    week: defaultLocaleWeek,

    weekdays: defaultLocaleWeekdays,
    weekdaysMin: defaultLocaleWeekdaysMin,
    weekdaysShort: defaultLocaleWeekdaysShort,

    meridiemParse: defaultLocaleMeridiemParse
};

// internal storage for locale config files
var locales = {};
var localeFamilies = {};
var globalLocale;

function normalizeLocale(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
}

// pick the locale from the array
// try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
// substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
function chooseLocale(names) {
    var i = 0, j, next, locale, split;

    while (i < names.length) {
        split = normalizeLocale(names[i]).split('-');
        j = split.length;
        next = normalizeLocale(names[i + 1]);
        next = next ? next.split('-') : null;
        while (j > 0) {
            locale = loadLocale(split.slice(0, j).join('-'));
            if (locale) {
                return locale;
            }
            if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                //the next array item is better than a shallower substring of this one
                break;
            }
            j--;
        }
        i++;
    }
    return null;
}

function loadLocale(name) {
    var oldLocale = null;
    // TODO: Find a better way to register and load all the locales in Node
    if (!locales[name] && (typeof module !== 'undefined') &&
            module && module.exports) {
        try {
            oldLocale = globalLocale._abbr;
            require('./locale/' + name);
            // because defineLocale currently also sets the global locale, we
            // want to undo that for lazy loaded locales
            getSetGlobalLocale(oldLocale);
        } catch (e) { }
    }
    return locales[name];
}

// This function will load locale and then set the global locale.  If
// no arguments are passed in, it will simply return the current global
// locale key.
function getSetGlobalLocale (key, values) {
    var data;
    if (key) {
        if (isUndefined(values)) {
            data = getLocale(key);
        }
        else {
            data = defineLocale(key, values);
        }

        if (data) {
            // moment.duration._locale = moment._locale = data;
            globalLocale = data;
        }
    }

    return globalLocale._abbr;
}

function defineLocale (name, config) {
    if (config !== null) {
        var parentConfig = baseConfig;
        config.abbr = name;
        if (locales[name] != null) {
            deprecateSimple('defineLocaleOverride',
                    'use moment.updateLocale(localeName, config) to change ' +
                    'an existing locale. moment.defineLocale(localeName, ' +
                    'config) should only be used for creating a new locale ' +
                    'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
            parentConfig = locales[name]._config;
        } else if (config.parentLocale != null) {
            if (locales[config.parentLocale] != null) {
                parentConfig = locales[config.parentLocale]._config;
            } else {
                if (!localeFamilies[config.parentLocale]) {
                    localeFamilies[config.parentLocale] = [];
                }
                localeFamilies[config.parentLocale].push({
                    name: name,
                    config: config
                });
                return null;
            }
        }
        locales[name] = new Locale(mergeConfigs(parentConfig, config));

        if (localeFamilies[name]) {
            localeFamilies[name].forEach(function (x) {
                defineLocale(x.name, x.config);
            });
        }

        // backwards compat for now: also set the locale
        // make sure we set the locale AFTER all child locales have been
        // created, so we won't end up with the child locale set.
        getSetGlobalLocale(name);


        return locales[name];
    } else {
        // useful for testing
        delete locales[name];
        return null;
    }
}

function updateLocale(name, config) {
    if (config != null) {
        var locale, parentConfig = baseConfig;
        // MERGE
        if (locales[name] != null) {
            parentConfig = locales[name]._config;
        }
        config = mergeConfigs(parentConfig, config);
        locale = new Locale(config);
        locale.parentLocale = locales[name];
        locales[name] = locale;

        // backwards compat for now: also set the locale
        getSetGlobalLocale(name);
    } else {
        // pass null for config to unupdate, useful for tests
        if (locales[name] != null) {
            if (locales[name].parentLocale != null) {
                locales[name] = locales[name].parentLocale;
            } else if (locales[name] != null) {
                delete locales[name];
            }
        }
    }
    return locales[name];
}

// returns locale data
function getLocale (key) {
    var locale;

    if (key && key._locale && key._locale._abbr) {
        key = key._locale._abbr;
    }

    if (!key) {
        return globalLocale;
    }

    if (!isArray(key)) {
        //short-circuit everything else
        locale = loadLocale(key);
        if (locale) {
            return locale;
        }
        key = [key];
    }

    return chooseLocale(key);
}

function listLocales() {
    return keys$1(locales);
}

function checkOverflow (m) {
    var overflow;
    var a = m._a;

    if (a && getParsingFlags(m).overflow === -2) {
        overflow =
            a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
            a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
            a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
            a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
            a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
            a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
            -1;

        if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
            overflow = DATE;
        }
        if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
            overflow = WEEK;
        }
        if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
            overflow = WEEKDAY;
        }

        getParsingFlags(m).overflow = overflow;
    }

    return m;
}

// iso 8601 regex
// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

var isoDates = [
    ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
    ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
    ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
    ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
    ['YYYY-DDD', /\d{4}-\d{3}/],
    ['YYYY-MM', /\d{4}-\d\d/, false],
    ['YYYYYYMMDD', /[+-]\d{10}/],
    ['YYYYMMDD', /\d{8}/],
    // YYYYMM is NOT allowed by the standard
    ['GGGG[W]WWE', /\d{4}W\d{3}/],
    ['GGGG[W]WW', /\d{4}W\d{2}/, false],
    ['YYYYDDD', /\d{7}/]
];

// iso time formats and regexes
var isoTimes = [
    ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
    ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
    ['HH:mm:ss', /\d\d:\d\d:\d\d/],
    ['HH:mm', /\d\d:\d\d/],
    ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
    ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
    ['HHmmss', /\d\d\d\d\d\d/],
    ['HHmm', /\d\d\d\d/],
    ['HH', /\d\d/]
];

var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

// date from iso format
function configFromISO(config) {
    var i, l,
        string = config._i,
        match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
        allowTime, dateFormat, timeFormat, tzFormat;

    if (match) {
        getParsingFlags(config).iso = true;

        for (i = 0, l = isoDates.length; i < l; i++) {
            if (isoDates[i][1].exec(match[1])) {
                dateFormat = isoDates[i][0];
                allowTime = isoDates[i][2] !== false;
                break;
            }
        }
        if (dateFormat == null) {
            config._isValid = false;
            return;
        }
        if (match[3]) {
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(match[3])) {
                    // match[2] should be 'T' or space
                    timeFormat = (match[2] || ' ') + isoTimes[i][0];
                    break;
                }
            }
            if (timeFormat == null) {
                config._isValid = false;
                return;
            }
        }
        if (!allowTime && timeFormat != null) {
            config._isValid = false;
            return;
        }
        if (match[4]) {
            if (tzRegex.exec(match[4])) {
                tzFormat = 'Z';
            } else {
                config._isValid = false;
                return;
            }
        }
        config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
        configFromStringAndFormat(config);
    } else {
        config._isValid = false;
    }
}

// RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
var basicRfcRegex = /^((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d?\d\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(?:\d\d)?\d\d\s)(\d\d:\d\d)(\:\d\d)?(\s(?:UT|GMT|[ECMP][SD]T|[A-IK-Za-ik-z]|[+-]\d{4}))$/;

// date and time from ref 2822 format
function configFromRFC2822(config) {
    var string, match, dayFormat,
        dateFormat, timeFormat, tzFormat;
    var timezones = {
        ' GMT': ' +0000',
        ' EDT': ' -0400',
        ' EST': ' -0500',
        ' CDT': ' -0500',
        ' CST': ' -0600',
        ' MDT': ' -0600',
        ' MST': ' -0700',
        ' PDT': ' -0700',
        ' PST': ' -0800'
    };
    var military = 'YXWVUTSRQPONZABCDEFGHIKLM';
    var timezone, timezoneIndex;

    string = config._i
        .replace(/\([^\)]*\)|[\n\t]/g, ' ') // Remove comments and folding whitespace
        .replace(/(\s\s+)/g, ' ') // Replace multiple-spaces with a single space
        .replace(/^\s|\s$/g, ''); // Remove leading and trailing spaces
    match = basicRfcRegex.exec(string);

    if (match) {
        dayFormat = match[1] ? 'ddd' + ((match[1].length === 5) ? ', ' : ' ') : '';
        dateFormat = 'D MMM ' + ((match[2].length > 10) ? 'YYYY ' : 'YY ');
        timeFormat = 'HH:mm' + (match[4] ? ':ss' : '');

        // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
        if (match[1]) { // day of week given
            var momentDate = new Date(match[2]);
            var momentDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][momentDate.getDay()];

            if (match[1].substr(0,3) !== momentDay) {
                getParsingFlags(config).weekdayMismatch = true;
                config._isValid = false;
                return;
            }
        }

        switch (match[5].length) {
            case 2: // military
                if (timezoneIndex === 0) {
                    timezone = ' +0000';
                } else {
                    timezoneIndex = military.indexOf(match[5][1].toUpperCase()) - 12;
                    timezone = ((timezoneIndex < 0) ? ' -' : ' +') +
                        (('' + timezoneIndex).replace(/^-?/, '0')).match(/..$/)[0] + '00';
                }
                break;
            case 4: // Zone
                timezone = timezones[match[5]];
                break;
            default: // UT or +/-9999
                timezone = timezones[' GMT'];
        }
        match[5] = timezone;
        config._i = match.splice(1).join('');
        tzFormat = ' ZZ';
        config._f = dayFormat + dateFormat + timeFormat + tzFormat;
        configFromStringAndFormat(config);
        getParsingFlags(config).rfc2822 = true;
    } else {
        config._isValid = false;
    }
}

// date from iso format or fallback
function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);

    if (matched !== null) {
        config._d = new Date(+matched[1]);
        return;
    }

    configFromISO(config);
    if (config._isValid === false) {
        delete config._isValid;
    } else {
        return;
    }

    configFromRFC2822(config);
    if (config._isValid === false) {
        delete config._isValid;
    } else {
        return;
    }

    // Final attempt, use Input Fallback
    hooks.createFromInputFallback(config);
}

hooks.createFromInputFallback = deprecate(
    'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
    'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
    'discouraged and will be removed in an upcoming major release. Please refer to ' +
    'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
    function (config) {
        config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
    }
);

// Pick the first defined of two or three arguments.
function defaults(a, b, c) {
    if (a != null) {
        return a;
    }
    if (b != null) {
        return b;
    }
    return c;
}

function currentDateArray(config) {
    // hooks is actually the exported moment object
    var nowValue = new Date(hooks.now());
    if (config._useUTC) {
        return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
    }
    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
}

// convert an array to a date.
// the array should mirror the parameters below
// note: all values past the year are optional and will default to the lowest possible value.
// [year, month, day , hour, minute, second, millisecond]
function configFromArray (config) {
    var i, date, input = [], currentDate, yearToUse;

    if (config._d) {
        return;
    }

    currentDate = currentDateArray(config);

    //compute day of the year from weeks and weekdays
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
        dayOfYearFromWeekInfo(config);
    }

    //if the day of the year is set, figure out what it is
    if (config._dayOfYear != null) {
        yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

        if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
            getParsingFlags(config)._overflowDayOfYear = true;
        }

        date = createUTCDate(yearToUse, 0, config._dayOfYear);
        config._a[MONTH] = date.getUTCMonth();
        config._a[DATE] = date.getUTCDate();
    }

    // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
        config._a[i] = input[i] = currentDate[i];
    }

    // Zero out whatever was not defaulted, including time
    for (; i < 7; i++) {
        config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
    }

    // Check for 24:00:00.000
    if (config._a[HOUR] === 24 &&
            config._a[MINUTE] === 0 &&
            config._a[SECOND] === 0 &&
            config._a[MILLISECOND] === 0) {
        config._nextDay = true;
        config._a[HOUR] = 0;
    }

    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
    // Apply timezone offset from input. The actual utcOffset can be changed
    // with parseZone.
    if (config._tzm != null) {
        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }

    if (config._nextDay) {
        config._a[HOUR] = 24;
    }
}

function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
        dow = 1;
        doy = 4;

        // TODO: We need to take the current isoWeekYear, but that depends on
        // how we interpret now (local, utc, fixed offset). So create
        // a now version of current config (take local/utc/offset flags, and
        // create now).
        weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
        week = defaults(w.W, 1);
        weekday = defaults(w.E, 1);
        if (weekday < 1 || weekday > 7) {
            weekdayOverflow = true;
        }
    } else {
        dow = config._locale._week.dow;
        doy = config._locale._week.doy;

        var curWeek = weekOfYear(createLocal(), dow, doy);

        weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

        // Default to current week.
        week = defaults(w.w, curWeek.week);

        if (w.d != null) {
            // weekday -- low day numbers are considered next week
            weekday = w.d;
            if (weekday < 0 || weekday > 6) {
                weekdayOverflow = true;
            }
        } else if (w.e != null) {
            // local weekday -- counting starts from begining of week
            weekday = w.e + dow;
            if (w.e < 0 || w.e > 6) {
                weekdayOverflow = true;
            }
        } else {
            // default to begining of week
            weekday = dow;
        }
    }
    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
        getParsingFlags(config)._overflowWeeks = true;
    } else if (weekdayOverflow != null) {
        getParsingFlags(config)._overflowWeekday = true;
    } else {
        temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }
}

// constant that refers to the ISO standard
hooks.ISO_8601 = function () {};

// constant that refers to the RFC 2822 form
hooks.RFC_2822 = function () {};

// date from string and format string
function configFromStringAndFormat(config) {
    // TODO: Move this to another part of the creation flow to prevent circular deps
    if (config._f === hooks.ISO_8601) {
        configFromISO(config);
        return;
    }
    if (config._f === hooks.RFC_2822) {
        configFromRFC2822(config);
        return;
    }
    config._a = [];
    getParsingFlags(config).empty = true;

    // This array is used to make a Date, either with `new Date` or `Date.UTC`
    var string = '' + config._i,
        i, parsedInput, tokens, token, skipped,
        stringLength = string.length,
        totalParsedInputLength = 0;

    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
        // console.log('token', token, 'parsedInput', parsedInput,
        //         'regex', getParseRegexForToken(token, config));
        if (parsedInput) {
            skipped = string.substr(0, string.indexOf(parsedInput));
            if (skipped.length > 0) {
                getParsingFlags(config).unusedInput.push(skipped);
            }
            string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            totalParsedInputLength += parsedInput.length;
        }
        // don't parse if it's not a known token
        if (formatTokenFunctions[token]) {
            if (parsedInput) {
                getParsingFlags(config).empty = false;
            }
            else {
                getParsingFlags(config).unusedTokens.push(token);
            }
            addTimeToArrayFromToken(token, parsedInput, config);
        }
        else if (config._strict && !parsedInput) {
            getParsingFlags(config).unusedTokens.push(token);
        }
    }

    // add remaining unparsed input length to the string
    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
        getParsingFlags(config).unusedInput.push(string);
    }

    // clear _12h flag if hour is <= 12
    if (config._a[HOUR] <= 12 &&
        getParsingFlags(config).bigHour === true &&
        config._a[HOUR] > 0) {
        getParsingFlags(config).bigHour = undefined;
    }

    getParsingFlags(config).parsedDateParts = config._a.slice(0);
    getParsingFlags(config).meridiem = config._meridiem;
    // handle meridiem
    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

    configFromArray(config);
    checkOverflow(config);
}


function meridiemFixWrap (locale, hour, meridiem) {
    var isPm;

    if (meridiem == null) {
        // nothing to do
        return hour;
    }
    if (locale.meridiemHour != null) {
        return locale.meridiemHour(hour, meridiem);
    } else if (locale.isPM != null) {
        // Fallback
        isPm = locale.isPM(meridiem);
        if (isPm && hour < 12) {
            hour += 12;
        }
        if (!isPm && hour === 12) {
            hour = 0;
        }
        return hour;
    } else {
        // this is not supposed to happen
        return hour;
    }
}

// date from string and array of format strings
function configFromStringAndArray(config) {
    var tempConfig,
        bestMoment,

        scoreToBeat,
        i,
        currentScore;

    if (config._f.length === 0) {
        getParsingFlags(config).invalidFormat = true;
        config._d = new Date(NaN);
        return;
    }

    for (i = 0; i < config._f.length; i++) {
        currentScore = 0;
        tempConfig = copyConfig({}, config);
        if (config._useUTC != null) {
            tempConfig._useUTC = config._useUTC;
        }
        tempConfig._f = config._f[i];
        configFromStringAndFormat(tempConfig);

        if (!isValid(tempConfig)) {
            continue;
        }

        // if there is any input that was not parsed add a penalty for that format
        currentScore += getParsingFlags(tempConfig).charsLeftOver;

        //or tokens
        currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

        getParsingFlags(tempConfig).score = currentScore;

        if (scoreToBeat == null || currentScore < scoreToBeat) {
            scoreToBeat = currentScore;
            bestMoment = tempConfig;
        }
    }

    extend(config, bestMoment || tempConfig);
}

function configFromObject(config) {
    if (config._d) {
        return;
    }

    var i = normalizeObjectUnits(config._i);
    config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
        return obj && parseInt(obj, 10);
    });

    configFromArray(config);
}

function createFromConfig (config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));
    if (res._nextDay) {
        // Adding is smart enough around DST
        res.add(1, 'd');
        res._nextDay = undefined;
    }

    return res;
}

function prepareConfig (config) {
    var input = config._i,
        format = config._f;

    config._locale = config._locale || getLocale(config._l);

    if (input === null || (format === undefined && input === '')) {
        return createInvalid({nullInput: true});
    }

    if (typeof input === 'string') {
        config._i = input = config._locale.preparse(input);
    }

    if (isMoment(input)) {
        return new Moment(checkOverflow(input));
    } else if (isDate(input)) {
        config._d = input;
    } else if (isArray(format)) {
        configFromStringAndArray(config);
    } else if (format) {
        configFromStringAndFormat(config);
    }  else {
        configFromInput(config);
    }

    if (!isValid(config)) {
        config._d = null;
    }

    return config;
}

function configFromInput(config) {
    var input = config._i;
    if (isUndefined(input)) {
        config._d = new Date(hooks.now());
    } else if (isDate(input)) {
        config._d = new Date(input.valueOf());
    } else if (typeof input === 'string') {
        configFromString(config);
    } else if (isArray(input)) {
        config._a = map(input.slice(0), function (obj) {
            return parseInt(obj, 10);
        });
        configFromArray(config);
    } else if (isObject(input)) {
        configFromObject(config);
    } else if (isNumber(input)) {
        // from milliseconds
        config._d = new Date(input);
    } else {
        hooks.createFromInputFallback(config);
    }
}

function createLocalOrUTC (input, format, locale, strict, isUTC) {
    var c = {};

    if (locale === true || locale === false) {
        strict = locale;
        locale = undefined;
    }

    if ((isObject(input) && isObjectEmpty(input)) ||
            (isArray(input) && input.length === 0)) {
        input = undefined;
    }
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
    c._isAMomentObject = true;
    c._useUTC = c._isUTC = isUTC;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;

    return createFromConfig(c);
}

function createLocal (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, false);
}

var prototypeMin = deprecate(
    'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other < this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

var prototypeMax = deprecate(
    'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other > this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

// Pick a moment m from moments so that m[fn](other) is true for all
// other. This relies on the function fn to be transitive.
//
// moments should either be an array of moment objects or an array, whose
// first element is an array of moment objects.
function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) {
        moments = moments[0];
    }
    if (!moments.length) {
        return createLocal();
    }
    res = moments[0];
    for (i = 1; i < moments.length; ++i) {
        if (!moments[i].isValid() || moments[i][fn](res)) {
            res = moments[i];
        }
    }
    return res;
}

// TODO: Use [].sort instead?
function min () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isBefore', args);
}

function max () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isAfter', args);
}

var now = function () {
    return Date.now ? Date.now() : +(new Date());
};

var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

function isDurationValid(m) {
    for (var key in m) {
        if (!(ordering.indexOf(key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
            return false;
        }
    }

    var unitHasDecimal = false;
    for (var i = 0; i < ordering.length; ++i) {
        if (m[ordering[i]]) {
            if (unitHasDecimal) {
                return false; // only allow non-integers for smallest unit
            }
            if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                unitHasDecimal = true;
            }
        }
    }

    return true;
}

function isValid$1() {
    return this._isValid;
}

function createInvalid$1() {
    return createDuration(NaN);
}

function Duration (duration) {
    var normalizedInput = normalizeObjectUnits(duration),
        years = normalizedInput.year || 0,
        quarters = normalizedInput.quarter || 0,
        months = normalizedInput.month || 0,
        weeks = normalizedInput.week || 0,
        days = normalizedInput.day || 0,
        hours = normalizedInput.hour || 0,
        minutes = normalizedInput.minute || 0,
        seconds = normalizedInput.second || 0,
        milliseconds = normalizedInput.millisecond || 0;

    this._isValid = isDurationValid(normalizedInput);

    // representation for dateAddRemove
    this._milliseconds = +milliseconds +
        seconds * 1e3 + // 1000
        minutes * 6e4 + // 1000 * 60
        hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days +
        weeks * 7;
    // It is impossible translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months +
        quarters * 3 +
        years * 12;

    this._data = {};

    this._locale = getLocale();

    this._bubble();
}

function isDuration (obj) {
    return obj instanceof Duration;
}

function absRound (number) {
    if (number < 0) {
        return Math.round(-1 * number) * -1;
    } else {
        return Math.round(number);
    }
}

// FORMATTING

function offset (token, separator) {
    addFormatToken(token, 0, 0, function () {
        var offset = this.utcOffset();
        var sign = '+';
        if (offset < 0) {
            offset = -offset;
            sign = '-';
        }
        return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
    });
}

offset('Z', ':');
offset('ZZ', '');

// PARSING

addRegexToken('Z',  matchShortOffset);
addRegexToken('ZZ', matchShortOffset);
addParseToken(['Z', 'ZZ'], function (input, array, config) {
    config._useUTC = true;
    config._tzm = offsetFromString(matchShortOffset, input);
});

// HELPERS

// timezone chunker
// '+10:00' > ['10',  '00']
// '-1530'  > ['-15', '30']
var chunkOffset = /([\+\-]|\d\d)/gi;

function offsetFromString(matcher, string) {
    var matches = (string || '').match(matcher);

    if (matches === null) {
        return null;
    }

    var chunk   = matches[matches.length - 1] || [];
    var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    var minutes = +(parts[1] * 60) + toInt(parts[2]);

    return minutes === 0 ?
      0 :
      parts[0] === '+' ? minutes : -minutes;
}

// Return a moment from input, that is local/utc/zone equivalent to model.
function cloneWithOffset(input, model) {
    var res, diff;
    if (model._isUTC) {
        res = model.clone();
        diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
        // Use low-level api, because this fn is low-level api.
        res._d.setTime(res._d.valueOf() + diff);
        hooks.updateOffset(res, false);
        return res;
    } else {
        return createLocal(input).local();
    }
}

function getDateOffset (m) {
    // On Firefox.24 Date#getTimezoneOffset returns a floating point.
    // https://github.com/moment/moment/pull/1871
    return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
}

// HOOKS

// This function will be called whenever a moment is mutated.
// It is intended to keep the offset in sync with the timezone.
hooks.updateOffset = function () {};

// MOMENTS

// keepLocalTime = true means only change the timezone, without
// affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
// 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
// +0200, so we adjust the time as needed, to be valid.
//
// Keeping the time actually adds/subtracts (one hour)
// from the actual represented time. That is why we call updateOffset
// a second time. In case it wants us to change the offset again
// _changeInProgress == true case, then we have to adjust, because
// there is no such time in the given timezone.
function getSetOffset (input, keepLocalTime, keepMinutes) {
    var offset = this._offset || 0,
        localAdjust;
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    if (input != null) {
        if (typeof input === 'string') {
            input = offsetFromString(matchShortOffset, input);
            if (input === null) {
                return this;
            }
        } else if (Math.abs(input) < 16 && !keepMinutes) {
            input = input * 60;
        }
        if (!this._isUTC && keepLocalTime) {
            localAdjust = getDateOffset(this);
        }
        this._offset = input;
        this._isUTC = true;
        if (localAdjust != null) {
            this.add(localAdjust, 'm');
        }
        if (offset !== input) {
            if (!keepLocalTime || this._changeInProgress) {
                addSubtract(this, createDuration(input - offset, 'm'), 1, false);
            } else if (!this._changeInProgress) {
                this._changeInProgress = true;
                hooks.updateOffset(this, true);
                this._changeInProgress = null;
            }
        }
        return this;
    } else {
        return this._isUTC ? offset : getDateOffset(this);
    }
}

function getSetZone (input, keepLocalTime) {
    if (input != null) {
        if (typeof input !== 'string') {
            input = -input;
        }

        this.utcOffset(input, keepLocalTime);

        return this;
    } else {
        return -this.utcOffset();
    }
}

function setOffsetToUTC (keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
}

function setOffsetToLocal (keepLocalTime) {
    if (this._isUTC) {
        this.utcOffset(0, keepLocalTime);
        this._isUTC = false;

        if (keepLocalTime) {
            this.subtract(getDateOffset(this), 'm');
        }
    }
    return this;
}

function setOffsetToParsedOffset () {
    if (this._tzm != null) {
        this.utcOffset(this._tzm, false, true);
    } else if (typeof this._i === 'string') {
        var tZone = offsetFromString(matchOffset, this._i);
        if (tZone != null) {
            this.utcOffset(tZone);
        }
        else {
            this.utcOffset(0, true);
        }
    }
    return this;
}

function hasAlignedHourOffset (input) {
    if (!this.isValid()) {
        return false;
    }
    input = input ? createLocal(input).utcOffset() : 0;

    return (this.utcOffset() - input) % 60 === 0;
}

function isDaylightSavingTime () {
    return (
        this.utcOffset() > this.clone().month(0).utcOffset() ||
        this.utcOffset() > this.clone().month(5).utcOffset()
    );
}

function isDaylightSavingTimeShifted () {
    if (!isUndefined(this._isDSTShifted)) {
        return this._isDSTShifted;
    }

    var c = {};

    copyConfig(c, this);
    c = prepareConfig(c);

    if (c._a) {
        var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
        this._isDSTShifted = this.isValid() &&
            compareArrays(c._a, other.toArray()) > 0;
    } else {
        this._isDSTShifted = false;
    }

    return this._isDSTShifted;
}

function isLocal () {
    return this.isValid() ? !this._isUTC : false;
}

function isUtcOffset () {
    return this.isValid() ? this._isUTC : false;
}

function isUtc () {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
}

// ASP.NET json date format regex
var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

// from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
// somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
// and further modified to allow for strings containing both week and day
var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

function createDuration (input, key) {
    var duration = input,
        // matching against regexp is expensive, do it on demand
        match = null,
        sign,
        ret,
        diffRes;

    if (isDuration(input)) {
        duration = {
            ms : input._milliseconds,
            d  : input._days,
            M  : input._months
        };
    } else if (isNumber(input)) {
        duration = {};
        if (key) {
            duration[key] = input;
        } else {
            duration.milliseconds = input;
        }
    } else if (!!(match = aspNetRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
            y  : 0,
            d  : toInt(match[DATE])                         * sign,
            h  : toInt(match[HOUR])                         * sign,
            m  : toInt(match[MINUTE])                       * sign,
            s  : toInt(match[SECOND])                       * sign,
            ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
        };
    } else if (!!(match = isoRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
            y : parseIso(match[2], sign),
            M : parseIso(match[3], sign),
            w : parseIso(match[4], sign),
            d : parseIso(match[5], sign),
            h : parseIso(match[6], sign),
            m : parseIso(match[7], sign),
            s : parseIso(match[8], sign)
        };
    } else if (duration == null) {// checks for null or undefined
        duration = {};
    } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
        diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

        duration = {};
        duration.ms = diffRes.milliseconds;
        duration.M = diffRes.months;
    }

    ret = new Duration(duration);

    if (isDuration(input) && hasOwnProp(input, '_locale')) {
        ret._locale = input._locale;
    }

    return ret;
}

createDuration.fn = Duration.prototype;
createDuration.invalid = createInvalid$1;

function parseIso (inp, sign) {
    // We'd normally use ~~inp for this, but unfortunately it also
    // converts floats to ints.
    // inp may be undefined, so careful calling replace on it.
    var res = inp && parseFloat(inp.replace(',', '.'));
    // apply sign while we're at it
    return (isNaN(res) ? 0 : res) * sign;
}

function positiveMomentsDifference(base, other) {
    var res = {milliseconds: 0, months: 0};

    res.months = other.month() - base.month() +
        (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, 'M').isAfter(other)) {
        --res.months;
    }

    res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

    return res;
}

function momentsDifference(base, other) {
    var res;
    if (!(base.isValid() && other.isValid())) {
        return {milliseconds: 0, months: 0};
    }

    other = cloneWithOffset(other, base);
    if (base.isBefore(other)) {
        res = positiveMomentsDifference(base, other);
    } else {
        res = positiveMomentsDifference(other, base);
        res.milliseconds = -res.milliseconds;
        res.months = -res.months;
    }

    return res;
}

// TODO: remove 'name' arg after deprecation is removed
function createAdder(direction, name) {
    return function (val, period) {
        var dur, tmp;
        //invert the arguments, but complain about it
        if (period !== null && !isNaN(+period)) {
            deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
            'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
            tmp = val; val = period; period = tmp;
        }

        val = typeof val === 'string' ? +val : val;
        dur = createDuration(val, period);
        addSubtract(this, dur, direction);
        return this;
    };
}

function addSubtract (mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds,
        days = absRound(duration._days),
        months = absRound(duration._months);

    if (!mom.isValid()) {
        // No op
        return;
    }

    updateOffset = updateOffset == null ? true : updateOffset;

    if (milliseconds) {
        mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
    }
    if (days) {
        set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
    }
    if (months) {
        setMonth(mom, get(mom, 'Month') + months * isAdding);
    }
    if (updateOffset) {
        hooks.updateOffset(mom, days || months);
    }
}

var add      = createAdder(1, 'add');
var subtract = createAdder(-1, 'subtract');

function getCalendarFormat(myMoment, now) {
    var diff = myMoment.diff(now, 'days', true);
    return diff < -6 ? 'sameElse' :
            diff < -1 ? 'lastWeek' :
            diff < 0 ? 'lastDay' :
            diff < 1 ? 'sameDay' :
            diff < 2 ? 'nextDay' :
            diff < 7 ? 'nextWeek' : 'sameElse';
}

function calendar$1 (time, formats) {
    // We want to compare the start of today, vs this.
    // Getting start-of-today depends on whether we're local/utc/offset or not.
    var now = time || createLocal(),
        sod = cloneWithOffset(now, this).startOf('day'),
        format = hooks.calendarFormat(this, sod) || 'sameElse';

    var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

    return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
}

function clone () {
    return new Moment(this);
}

function isAfter (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() > localInput.valueOf();
    } else {
        return localInput.valueOf() < this.clone().startOf(units).valueOf();
    }
}

function isBefore (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() < localInput.valueOf();
    } else {
        return this.clone().endOf(units).valueOf() < localInput.valueOf();
    }
}

function isBetween (from, to, units, inclusivity) {
    inclusivity = inclusivity || '()';
    return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
        (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
}

function isSame (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input),
        inputMs;
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(units || 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() === localInput.valueOf();
    } else {
        inputMs = localInput.valueOf();
        return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
    }
}

function isSameOrAfter (input, units) {
    return this.isSame(input, units) || this.isAfter(input,units);
}

function isSameOrBefore (input, units) {
    return this.isSame(input, units) || this.isBefore(input,units);
}

function diff (input, units, asFloat) {
    var that,
        zoneDelta,
        delta, output;

    if (!this.isValid()) {
        return NaN;
    }

    that = cloneWithOffset(input, this);

    if (!that.isValid()) {
        return NaN;
    }

    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

    units = normalizeUnits(units);

    if (units === 'year' || units === 'month' || units === 'quarter') {
        output = monthDiff(this, that);
        if (units === 'quarter') {
            output = output / 3;
        } else if (units === 'year') {
            output = output / 12;
        }
    } else {
        delta = this - that;
        output = units === 'second' ? delta / 1e3 : // 1000
            units === 'minute' ? delta / 6e4 : // 1000 * 60
            units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
            units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
            units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
            delta;
    }
    return asFloat ? output : absFloor(output);
}

function monthDiff (a, b) {
    // difference in months
    var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
        // b is in (anchor - 1 month, anchor + 1 month)
        anchor = a.clone().add(wholeMonthDiff, 'months'),
        anchor2, adjust;

    if (b - anchor < 0) {
        anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor - anchor2);
    } else {
        anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor2 - anchor);
    }

    //check for negative zero, return zero if negative zero
    return -(wholeMonthDiff + adjust) || 0;
}

hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

function toString () {
    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
}

function toISOString() {
    if (!this.isValid()) {
        return null;
    }
    var m = this.clone().utc();
    if (m.year() < 0 || m.year() > 9999) {
        return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    }
    if (isFunction(Date.prototype.toISOString)) {
        // native implementation is ~50x faster, use it when we can
        return this.toDate().toISOString();
    }
    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
}

/**
 * Return a human readable representation of a moment that can
 * also be evaluated to get a new moment which is the same
 *
 * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
 */
function inspect () {
    if (!this.isValid()) {
        return 'moment.invalid(/* ' + this._i + ' */)';
    }
    var func = 'moment';
    var zone = '';
    if (!this.isLocal()) {
        func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
        zone = 'Z';
    }
    var prefix = '[' + func + '("]';
    var year = (0 <= this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
    var datetime = '-MM-DD[T]HH:mm:ss.SSS';
    var suffix = zone + '[")]';

    return this.format(prefix + year + datetime + suffix);
}

function format (inputString) {
    if (!inputString) {
        inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
    }
    var output = formatMoment(this, inputString);
    return this.localeData().postformat(output);
}

function from (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function fromNow (withoutSuffix) {
    return this.from(createLocal(), withoutSuffix);
}

function to (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function toNow (withoutSuffix) {
    return this.to(createLocal(), withoutSuffix);
}

// If passed a locale key, it will set the locale for this
// instance.  Otherwise, it will return the locale configuration
// variables for this instance.
function locale (key) {
    var newLocaleData;

    if (key === undefined) {
        return this._locale._abbr;
    } else {
        newLocaleData = getLocale(key);
        if (newLocaleData != null) {
            this._locale = newLocaleData;
        }
        return this;
    }
}

var lang = deprecate(
    'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
    function (key) {
        if (key === undefined) {
            return this.localeData();
        } else {
            return this.locale(key);
        }
    }
);

function localeData () {
    return this._locale;
}

function startOf (units) {
    units = normalizeUnits(units);
    // the following switch intentionally omits break keywords
    // to utilize falling through the cases.
    switch (units) {
        case 'year':
            this.month(0);
            /* falls through */
        case 'quarter':
        case 'month':
            this.date(1);
            /* falls through */
        case 'week':
        case 'isoWeek':
        case 'day':
        case 'date':
            this.hours(0);
            /* falls through */
        case 'hour':
            this.minutes(0);
            /* falls through */
        case 'minute':
            this.seconds(0);
            /* falls through */
        case 'second':
            this.milliseconds(0);
    }

    // weeks are a special case
    if (units === 'week') {
        this.weekday(0);
    }
    if (units === 'isoWeek') {
        this.isoWeekday(1);
    }

    // quarters are also special
    if (units === 'quarter') {
        this.month(Math.floor(this.month() / 3) * 3);
    }

    return this;
}

function endOf (units) {
    units = normalizeUnits(units);
    if (units === undefined || units === 'millisecond') {
        return this;
    }

    // 'date' is an alias for 'day', so it should be considered as such.
    if (units === 'date') {
        units = 'day';
    }

    return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
}

function valueOf () {
    return this._d.valueOf() - ((this._offset || 0) * 60000);
}

function unix () {
    return Math.floor(this.valueOf() / 1000);
}

function toDate () {
    return new Date(this.valueOf());
}

function toArray () {
    var m = this;
    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
}

function toObject () {
    var m = this;
    return {
        years: m.year(),
        months: m.month(),
        date: m.date(),
        hours: m.hours(),
        minutes: m.minutes(),
        seconds: m.seconds(),
        milliseconds: m.milliseconds()
    };
}

function toJSON () {
    // new Date(NaN).toJSON() === null
    return this.isValid() ? this.toISOString() : null;
}

function isValid$2 () {
    return isValid(this);
}

function parsingFlags () {
    return extend({}, getParsingFlags(this));
}

function invalidAt () {
    return getParsingFlags(this).overflow;
}

function creationData() {
    return {
        input: this._i,
        format: this._f,
        locale: this._locale,
        isUTC: this._isUTC,
        strict: this._strict
    };
}

// FORMATTING

addFormatToken(0, ['gg', 2], 0, function () {
    return this.weekYear() % 100;
});

addFormatToken(0, ['GG', 2], 0, function () {
    return this.isoWeekYear() % 100;
});

function addWeekYearFormatToken (token, getter) {
    addFormatToken(0, [token, token.length], 0, getter);
}

addWeekYearFormatToken('gggg',     'weekYear');
addWeekYearFormatToken('ggggg',    'weekYear');
addWeekYearFormatToken('GGGG',  'isoWeekYear');
addWeekYearFormatToken('GGGGG', 'isoWeekYear');

// ALIASES

addUnitAlias('weekYear', 'gg');
addUnitAlias('isoWeekYear', 'GG');

// PRIORITY

addUnitPriority('weekYear', 1);
addUnitPriority('isoWeekYear', 1);


// PARSING

addRegexToken('G',      matchSigned);
addRegexToken('g',      matchSigned);
addRegexToken('GG',     match1to2, match2);
addRegexToken('gg',     match1to2, match2);
addRegexToken('GGGG',   match1to4, match4);
addRegexToken('gggg',   match1to4, match4);
addRegexToken('GGGGG',  match1to6, match6);
addRegexToken('ggggg',  match1to6, match6);

addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
    week[token.substr(0, 2)] = toInt(input);
});

addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
    week[token] = hooks.parseTwoDigitYear(input);
});

// MOMENTS

function getSetWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input,
            this.week(),
            this.weekday(),
            this.localeData()._week.dow,
            this.localeData()._week.doy);
}

function getSetISOWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input, this.isoWeek(), this.isoWeekday(), 1, 4);
}

function getISOWeeksInYear () {
    return weeksInYear(this.year(), 1, 4);
}

function getWeeksInYear () {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
}

function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    var weeksTarget;
    if (input == null) {
        return weekOfYear(this, dow, doy).year;
    } else {
        weeksTarget = weeksInYear(input, dow, doy);
        if (week > weeksTarget) {
            week = weeksTarget;
        }
        return setWeekAll.call(this, input, week, weekday, dow, doy);
    }
}

function setWeekAll(weekYear, week, weekday, dow, doy) {
    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
        date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

    this.year(date.getUTCFullYear());
    this.month(date.getUTCMonth());
    this.date(date.getUTCDate());
    return this;
}

// FORMATTING

addFormatToken('Q', 0, 'Qo', 'quarter');

// ALIASES

addUnitAlias('quarter', 'Q');

// PRIORITY

addUnitPriority('quarter', 7);

// PARSING

addRegexToken('Q', match1);
addParseToken('Q', function (input, array) {
    array[MONTH] = (toInt(input) - 1) * 3;
});

// MOMENTS

function getSetQuarter (input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
}

// FORMATTING

addFormatToken('D', ['DD', 2], 'Do', 'date');

// ALIASES

addUnitAlias('date', 'D');

// PRIOROITY
addUnitPriority('date', 9);

// PARSING

addRegexToken('D',  match1to2);
addRegexToken('DD', match1to2, match2);
addRegexToken('Do', function (isStrict, locale) {
    // TODO: Remove "ordinalParse" fallback in next major release.
    return isStrict ?
      (locale._dayOfMonthOrdinalParse || locale._ordinalParse) :
      locale._dayOfMonthOrdinalParseLenient;
});

addParseToken(['D', 'DD'], DATE);
addParseToken('Do', function (input, array) {
    array[DATE] = toInt(input.match(match1to2)[0], 10);
});

// MOMENTS

var getSetDayOfMonth = makeGetSet('Date', true);

// FORMATTING

addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

// ALIASES

addUnitAlias('dayOfYear', 'DDD');

// PRIORITY
addUnitPriority('dayOfYear', 4);

// PARSING

addRegexToken('DDD',  match1to3);
addRegexToken('DDDD', match3);
addParseToken(['DDD', 'DDDD'], function (input, array, config) {
    config._dayOfYear = toInt(input);
});

// HELPERS

// MOMENTS

function getSetDayOfYear (input) {
    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
    return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
}

// FORMATTING

addFormatToken('m', ['mm', 2], 0, 'minute');

// ALIASES

addUnitAlias('minute', 'm');

// PRIORITY

addUnitPriority('minute', 14);

// PARSING

addRegexToken('m',  match1to2);
addRegexToken('mm', match1to2, match2);
addParseToken(['m', 'mm'], MINUTE);

// MOMENTS

var getSetMinute = makeGetSet('Minutes', false);

// FORMATTING

addFormatToken('s', ['ss', 2], 0, 'second');

// ALIASES

addUnitAlias('second', 's');

// PRIORITY

addUnitPriority('second', 15);

// PARSING

addRegexToken('s',  match1to2);
addRegexToken('ss', match1to2, match2);
addParseToken(['s', 'ss'], SECOND);

// MOMENTS

var getSetSecond = makeGetSet('Seconds', false);

// FORMATTING

addFormatToken('S', 0, 0, function () {
    return ~~(this.millisecond() / 100);
});

addFormatToken(0, ['SS', 2], 0, function () {
    return ~~(this.millisecond() / 10);
});

addFormatToken(0, ['SSS', 3], 0, 'millisecond');
addFormatToken(0, ['SSSS', 4], 0, function () {
    return this.millisecond() * 10;
});
addFormatToken(0, ['SSSSS', 5], 0, function () {
    return this.millisecond() * 100;
});
addFormatToken(0, ['SSSSSS', 6], 0, function () {
    return this.millisecond() * 1000;
});
addFormatToken(0, ['SSSSSSS', 7], 0, function () {
    return this.millisecond() * 10000;
});
addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
    return this.millisecond() * 100000;
});
addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
    return this.millisecond() * 1000000;
});


// ALIASES

addUnitAlias('millisecond', 'ms');

// PRIORITY

addUnitPriority('millisecond', 16);

// PARSING

addRegexToken('S',    match1to3, match1);
addRegexToken('SS',   match1to3, match2);
addRegexToken('SSS',  match1to3, match3);

var token;
for (token = 'SSSS'; token.length <= 9; token += 'S') {
    addRegexToken(token, matchUnsigned);
}

function parseMs(input, array) {
    array[MILLISECOND] = toInt(('0.' + input) * 1000);
}

for (token = 'S'; token.length <= 9; token += 'S') {
    addParseToken(token, parseMs);
}
// MOMENTS

var getSetMillisecond = makeGetSet('Milliseconds', false);

// FORMATTING

addFormatToken('z',  0, 0, 'zoneAbbr');
addFormatToken('zz', 0, 0, 'zoneName');

// MOMENTS

function getZoneAbbr () {
    return this._isUTC ? 'UTC' : '';
}

function getZoneName () {
    return this._isUTC ? 'Coordinated Universal Time' : '';
}

var proto = Moment.prototype;

proto.add               = add;
proto.calendar          = calendar$1;
proto.clone             = clone;
proto.diff              = diff;
proto.endOf             = endOf;
proto.format            = format;
proto.from              = from;
proto.fromNow           = fromNow;
proto.to                = to;
proto.toNow             = toNow;
proto.get               = stringGet;
proto.invalidAt         = invalidAt;
proto.isAfter           = isAfter;
proto.isBefore          = isBefore;
proto.isBetween         = isBetween;
proto.isSame            = isSame;
proto.isSameOrAfter     = isSameOrAfter;
proto.isSameOrBefore    = isSameOrBefore;
proto.isValid           = isValid$2;
proto.lang              = lang;
proto.locale            = locale;
proto.localeData        = localeData;
proto.max               = prototypeMax;
proto.min               = prototypeMin;
proto.parsingFlags      = parsingFlags;
proto.set               = stringSet;
proto.startOf           = startOf;
proto.subtract          = subtract;
proto.toArray           = toArray;
proto.toObject          = toObject;
proto.toDate            = toDate;
proto.toISOString       = toISOString;
proto.inspect           = inspect;
proto.toJSON            = toJSON;
proto.toString          = toString;
proto.unix              = unix;
proto.valueOf           = valueOf;
proto.creationData      = creationData;

// Year
proto.year       = getSetYear;
proto.isLeapYear = getIsLeapYear;

// Week Year
proto.weekYear    = getSetWeekYear;
proto.isoWeekYear = getSetISOWeekYear;

// Quarter
proto.quarter = proto.quarters = getSetQuarter;

// Month
proto.month       = getSetMonth;
proto.daysInMonth = getDaysInMonth;

// Week
proto.week           = proto.weeks        = getSetWeek;
proto.isoWeek        = proto.isoWeeks     = getSetISOWeek;
proto.weeksInYear    = getWeeksInYear;
proto.isoWeeksInYear = getISOWeeksInYear;

// Day
proto.date       = getSetDayOfMonth;
proto.day        = proto.days             = getSetDayOfWeek;
proto.weekday    = getSetLocaleDayOfWeek;
proto.isoWeekday = getSetISODayOfWeek;
proto.dayOfYear  = getSetDayOfYear;

// Hour
proto.hour = proto.hours = getSetHour;

// Minute
proto.minute = proto.minutes = getSetMinute;

// Second
proto.second = proto.seconds = getSetSecond;

// Millisecond
proto.millisecond = proto.milliseconds = getSetMillisecond;

// Offset
proto.utcOffset            = getSetOffset;
proto.utc                  = setOffsetToUTC;
proto.local                = setOffsetToLocal;
proto.parseZone            = setOffsetToParsedOffset;
proto.hasAlignedHourOffset = hasAlignedHourOffset;
proto.isDST                = isDaylightSavingTime;
proto.isLocal              = isLocal;
proto.isUtcOffset          = isUtcOffset;
proto.isUtc                = isUtc;
proto.isUTC                = isUtc;

// Timezone
proto.zoneAbbr = getZoneAbbr;
proto.zoneName = getZoneName;

// Deprecations
proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

function createUnix (input) {
    return createLocal(input * 1000);
}

function createInZone () {
    return createLocal.apply(null, arguments).parseZone();
}

function preParsePostFormat (string) {
    return string;
}

var proto$1 = Locale.prototype;

proto$1.calendar        = calendar;
proto$1.longDateFormat  = longDateFormat;
proto$1.invalidDate     = invalidDate;
proto$1.ordinal         = ordinal;
proto$1.preparse        = preParsePostFormat;
proto$1.postformat      = preParsePostFormat;
proto$1.relativeTime    = relativeTime;
proto$1.pastFuture      = pastFuture;
proto$1.set             = set;

// Month
proto$1.months            =        localeMonths;
proto$1.monthsShort       =        localeMonthsShort;
proto$1.monthsParse       =        localeMonthsParse;
proto$1.monthsRegex       = monthsRegex;
proto$1.monthsShortRegex  = monthsShortRegex;

// Week
proto$1.week = localeWeek;
proto$1.firstDayOfYear = localeFirstDayOfYear;
proto$1.firstDayOfWeek = localeFirstDayOfWeek;

// Day of Week
proto$1.weekdays       =        localeWeekdays;
proto$1.weekdaysMin    =        localeWeekdaysMin;
proto$1.weekdaysShort  =        localeWeekdaysShort;
proto$1.weekdaysParse  =        localeWeekdaysParse;

proto$1.weekdaysRegex       =        weekdaysRegex;
proto$1.weekdaysShortRegex  =        weekdaysShortRegex;
proto$1.weekdaysMinRegex    =        weekdaysMinRegex;

// Hours
proto$1.isPM = localeIsPM;
proto$1.meridiem = localeMeridiem;

function get$1 (format, index, field, setter) {
    var locale = getLocale();
    var utc = createUTC().set(setter, index);
    return locale[field](utc, format);
}

function listMonthsImpl (format, index, field) {
    if (isNumber(format)) {
        index = format;
        format = undefined;
    }

    format = format || '';

    if (index != null) {
        return get$1(format, index, field, 'month');
    }

    var i;
    var out = [];
    for (i = 0; i < 12; i++) {
        out[i] = get$1(format, i, field, 'month');
    }
    return out;
}

// ()
// (5)
// (fmt, 5)
// (fmt)
// (true)
// (true, 5)
// (true, fmt, 5)
// (true, fmt)
function listWeekdaysImpl (localeSorted, format, index, field) {
    if (typeof localeSorted === 'boolean') {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    } else {
        format = localeSorted;
        index = format;
        localeSorted = false;

        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    }

    var locale = getLocale(),
        shift = localeSorted ? locale._week.dow : 0;

    if (index != null) {
        return get$1(format, (index + shift) % 7, field, 'day');
    }

    var i;
    var out = [];
    for (i = 0; i < 7; i++) {
        out[i] = get$1(format, (i + shift) % 7, field, 'day');
    }
    return out;
}

function listMonths (format, index) {
    return listMonthsImpl(format, index, 'months');
}

function listMonthsShort (format, index) {
    return listMonthsImpl(format, index, 'monthsShort');
}

function listWeekdays (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
}

function listWeekdaysShort (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
}

function listWeekdaysMin (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
}

getSetGlobalLocale('en', {
    dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (toInt(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    }
});

// Side effect imports
hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

var mathAbs = Math.abs;

function abs () {
    var data           = this._data;

    this._milliseconds = mathAbs(this._milliseconds);
    this._days         = mathAbs(this._days);
    this._months       = mathAbs(this._months);

    data.milliseconds  = mathAbs(data.milliseconds);
    data.seconds       = mathAbs(data.seconds);
    data.minutes       = mathAbs(data.minutes);
    data.hours         = mathAbs(data.hours);
    data.months        = mathAbs(data.months);
    data.years         = mathAbs(data.years);

    return this;
}

function addSubtract$1 (duration, input, value, direction) {
    var other = createDuration(input, value);

    duration._milliseconds += direction * other._milliseconds;
    duration._days         += direction * other._days;
    duration._months       += direction * other._months;

    return duration._bubble();
}

// supports only 2.0-style add(1, 's') or add(duration)
function add$1 (input, value) {
    return addSubtract$1(this, input, value, 1);
}

// supports only 2.0-style subtract(1, 's') or subtract(duration)
function subtract$1 (input, value) {
    return addSubtract$1(this, input, value, -1);
}

function absCeil (number) {
    if (number < 0) {
        return Math.floor(number);
    } else {
        return Math.ceil(number);
    }
}

function bubble () {
    var milliseconds = this._milliseconds;
    var days         = this._days;
    var months       = this._months;
    var data         = this._data;
    var seconds, minutes, hours, years, monthsFromDays;

    // if we have a mix of positive and negative values, bubble down first
    // check: https://github.com/moment/moment/issues/2166
    if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
            (milliseconds <= 0 && days <= 0 && months <= 0))) {
        milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
        days = 0;
        months = 0;
    }

    // The following code bubbles up values, see the tests for
    // examples of what that means.
    data.milliseconds = milliseconds % 1000;

    seconds           = absFloor(milliseconds / 1000);
    data.seconds      = seconds % 60;

    minutes           = absFloor(seconds / 60);
    data.minutes      = minutes % 60;

    hours             = absFloor(minutes / 60);
    data.hours        = hours % 24;

    days += absFloor(hours / 24);

    // convert days to months
    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays));

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;

    data.days   = days;
    data.months = months;
    data.years  = years;

    return this;
}

function daysToMonths (days) {
    // 400 years have 146097 days (taking into account leap year rules)
    // 400 years have 12 months === 4800
    return days * 4800 / 146097;
}

function monthsToDays (months) {
    // the reverse of daysToMonths
    return months * 146097 / 4800;
}

function as (units) {
    if (!this.isValid()) {
        return NaN;
    }
    var days;
    var months;
    var milliseconds = this._milliseconds;

    units = normalizeUnits(units);

    if (units === 'month' || units === 'year') {
        days   = this._days   + milliseconds / 864e5;
        months = this._months + daysToMonths(days);
        return units === 'month' ? months : months / 12;
    } else {
        // handle milliseconds separately because of floating point math errors (issue #1867)
        days = this._days + Math.round(monthsToDays(this._months));
        switch (units) {
            case 'week'   : return days / 7     + milliseconds / 6048e5;
            case 'day'    : return days         + milliseconds / 864e5;
            case 'hour'   : return days * 24    + milliseconds / 36e5;
            case 'minute' : return days * 1440  + milliseconds / 6e4;
            case 'second' : return days * 86400 + milliseconds / 1000;
            // Math.floor prevents floating point math errors here
            case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
            default: throw new Error('Unknown unit ' + units);
        }
    }
}

// TODO: Use this.as('ms')?
function valueOf$1 () {
    if (!this.isValid()) {
        return NaN;
    }
    return (
        this._milliseconds +
        this._days * 864e5 +
        (this._months % 12) * 2592e6 +
        toInt(this._months / 12) * 31536e6
    );
}

function makeAs (alias) {
    return function () {
        return this.as(alias);
    };
}

var asMilliseconds = makeAs('ms');
var asSeconds      = makeAs('s');
var asMinutes      = makeAs('m');
var asHours        = makeAs('h');
var asDays         = makeAs('d');
var asWeeks        = makeAs('w');
var asMonths       = makeAs('M');
var asYears        = makeAs('y');

function get$2 (units) {
    units = normalizeUnits(units);
    return this.isValid() ? this[units + 's']() : NaN;
}

function makeGetter(name) {
    return function () {
        return this.isValid() ? this._data[name] : NaN;
    };
}

var milliseconds = makeGetter('milliseconds');
var seconds      = makeGetter('seconds');
var minutes      = makeGetter('minutes');
var hours        = makeGetter('hours');
var days         = makeGetter('days');
var months       = makeGetter('months');
var years        = makeGetter('years');

function weeks () {
    return absFloor(this.days() / 7);
}

var round = Math.round;
var thresholds = {
    ss: 44,         // a few seconds to seconds
    s : 45,         // seconds to minute
    m : 45,         // minutes to hour
    h : 22,         // hours to day
    d : 26,         // days to month
    M : 11          // months to year
};

// helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
}

function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
    var duration = createDuration(posNegDuration).abs();
    var seconds  = round(duration.as('s'));
    var minutes  = round(duration.as('m'));
    var hours    = round(duration.as('h'));
    var days     = round(duration.as('d'));
    var months   = round(duration.as('M'));
    var years    = round(duration.as('y'));

    var a = seconds <= thresholds.ss && ['s', seconds]  ||
            seconds < thresholds.s   && ['ss', seconds] ||
            minutes <= 1             && ['m']           ||
            minutes < thresholds.m   && ['mm', minutes] ||
            hours   <= 1             && ['h']           ||
            hours   < thresholds.h   && ['hh', hours]   ||
            days    <= 1             && ['d']           ||
            days    < thresholds.d   && ['dd', days]    ||
            months  <= 1             && ['M']           ||
            months  < thresholds.M   && ['MM', months]  ||
            years   <= 1             && ['y']           || ['yy', years];

    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale;
    return substituteTimeAgo.apply(null, a);
}

// This function allows you to set the rounding function for relative time strings
function getSetRelativeTimeRounding (roundingFunction) {
    if (roundingFunction === undefined) {
        return round;
    }
    if (typeof(roundingFunction) === 'function') {
        round = roundingFunction;
        return true;
    }
    return false;
}

// This function allows you to set a threshold for relative time strings
function getSetRelativeTimeThreshold (threshold, limit) {
    if (thresholds[threshold] === undefined) {
        return false;
    }
    if (limit === undefined) {
        return thresholds[threshold];
    }
    thresholds[threshold] = limit;
    if (threshold === 's') {
        thresholds.ss = limit - 1;
    }
    return true;
}

function humanize (withSuffix) {
    if (!this.isValid()) {
        return this.localeData().invalidDate();
    }

    var locale = this.localeData();
    var output = relativeTime$1(this, !withSuffix, locale);

    if (withSuffix) {
        output = locale.pastFuture(+this, output);
    }

    return locale.postformat(output);
}

var abs$1 = Math.abs;

function toISOString$1() {
    // for ISO strings we do not use the normal bubbling rules:
    //  * milliseconds bubble up until they become hours
    //  * days do not bubble at all
    //  * months bubble up until they become years
    // This is because there is no context-free conversion between hours and days
    // (think of clock changes)
    // and also not between days and months (28-31 days per month)
    if (!this.isValid()) {
        return this.localeData().invalidDate();
    }

    var seconds = abs$1(this._milliseconds) / 1000;
    var days         = abs$1(this._days);
    var months       = abs$1(this._months);
    var minutes, hours, years;

    // 3600 seconds -> 60 minutes -> 1 hour
    minutes           = absFloor(seconds / 60);
    hours             = absFloor(minutes / 60);
    seconds %= 60;
    minutes %= 60;

    // 12 months -> 1 year
    years  = absFloor(months / 12);
    months %= 12;


    // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
    var Y = years;
    var M = months;
    var D = days;
    var h = hours;
    var m = minutes;
    var s = seconds;
    var total = this.asSeconds();

    if (!total) {
        // this is the same as C#'s (Noda) and python (isodate)...
        // but not other JS (goog.date)
        return 'P0D';
    }

    return (total < 0 ? '-' : '') +
        'P' +
        (Y ? Y + 'Y' : '') +
        (M ? M + 'M' : '') +
        (D ? D + 'D' : '') +
        ((h || m || s) ? 'T' : '') +
        (h ? h + 'H' : '') +
        (m ? m + 'M' : '') +
        (s ? s + 'S' : '');
}

var proto$2 = Duration.prototype;

proto$2.isValid        = isValid$1;
proto$2.abs            = abs;
proto$2.add            = add$1;
proto$2.subtract       = subtract$1;
proto$2.as             = as;
proto$2.asMilliseconds = asMilliseconds;
proto$2.asSeconds      = asSeconds;
proto$2.asMinutes      = asMinutes;
proto$2.asHours        = asHours;
proto$2.asDays         = asDays;
proto$2.asWeeks        = asWeeks;
proto$2.asMonths       = asMonths;
proto$2.asYears        = asYears;
proto$2.valueOf        = valueOf$1;
proto$2._bubble        = bubble;
proto$2.get            = get$2;
proto$2.milliseconds   = milliseconds;
proto$2.seconds        = seconds;
proto$2.minutes        = minutes;
proto$2.hours          = hours;
proto$2.days           = days;
proto$2.weeks          = weeks;
proto$2.months         = months;
proto$2.years          = years;
proto$2.humanize       = humanize;
proto$2.toISOString    = toISOString$1;
proto$2.toString       = toISOString$1;
proto$2.toJSON         = toISOString$1;
proto$2.locale         = locale;
proto$2.localeData     = localeData;

// Deprecations
proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
proto$2.lang = lang;

// Side effect imports

// FORMATTING

addFormatToken('X', 0, 0, 'unix');
addFormatToken('x', 0, 0, 'valueOf');

// PARSING

addRegexToken('x', matchSigned);
addRegexToken('X', matchTimestamp);
addParseToken('X', function (input, array, config) {
    config._d = new Date(parseFloat(input, 10) * 1000);
});
addParseToken('x', function (input, array, config) {
    config._d = new Date(toInt(input));
});

// Side effect imports


hooks.version = '2.18.1';

setHookCallback(createLocal);

hooks.fn                    = proto;
hooks.min                   = min;
hooks.max                   = max;
hooks.now                   = now;
hooks.utc                   = createUTC;
hooks.unix                  = createUnix;
hooks.months                = listMonths;
hooks.isDate                = isDate;
hooks.locale                = getSetGlobalLocale;
hooks.invalid               = createInvalid;
hooks.duration              = createDuration;
hooks.isMoment              = isMoment;
hooks.weekdays              = listWeekdays;
hooks.parseZone             = createInZone;
hooks.localeData            = getLocale;
hooks.isDuration            = isDuration;
hooks.monthsShort           = listMonthsShort;
hooks.weekdaysMin           = listWeekdaysMin;
hooks.defineLocale          = defineLocale;
hooks.updateLocale          = updateLocale;
hooks.locales               = listLocales;
hooks.weekdaysShort         = listWeekdaysShort;
hooks.normalizeUnits        = normalizeUnits;
hooks.relativeTimeRounding = getSetRelativeTimeRounding;
hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
hooks.calendarFormat        = getCalendarFormat;
hooks.prototype             = proto;

return hooks;

})));

},{}],"/home/skam/Work/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js":[function(require,module,exports){
/*! Browser bundle of nunjucks 3.0.1 (slim, only works with precompiled templates) */
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
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var lib = __webpack_require__(1);
	var env = __webpack_require__(2);
	var Loader = __webpack_require__(15);
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

	module.exports.installJinjaCompat = __webpack_require__(16);

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


/***/ }),
/* 1 */
/***/ (function(module, exports) {

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


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

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
	builtin_loaders.PrecompiledLoader = __webpack_require__(14);

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


/***/ }),
/* 3 */
/***/ (function(module, exports) {

	

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

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


/***/ }),
/* 5 */
/***/ (function(module, exports) {

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
	// Must use `global` or `self` instead of `window` to work in both frames and web
	// workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.

	/* globals self */
	var scope = typeof global !== "undefined" ? global : self;
	var BrowserMutationObserver = scope.MutationObserver || scope.WebKitMutationObserver;

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

/***/ }),
/* 6 */
/***/ (function(module, exports) {

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


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

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
	    abs: Math.abs,

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


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

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


/***/ }),
/* 9 */
/***/ (function(module, exports) {

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


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11).setImmediate, __webpack_require__(13)))

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	var apply = Function.prototype.apply;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) {
	  if (timeout) {
	    timeout.close();
	  }
	};

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

	// setimmediate attaches itself to the global object
	__webpack_require__(12);
	exports.setImmediate = setImmediate;
	exports.clearImmediate = clearImmediate;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
	    "use strict";

	    if (global.setImmediate) {
	        return;
	    }

	    var nextHandle = 1; // Spec says greater than zero
	    var tasksByHandle = {};
	    var currentlyRunningATask = false;
	    var doc = global.document;
	    var registerImmediate;

	    function setImmediate(callback) {
	      // Callback can either be a function or a string
	      if (typeof callback !== "function") {
	        callback = new Function("" + callback);
	      }
	      // Copy function arguments
	      var args = new Array(arguments.length - 1);
	      for (var i = 0; i < args.length; i++) {
	          args[i] = arguments[i + 1];
	      }
	      // Store and register the task
	      var task = { callback: callback, args: args };
	      tasksByHandle[nextHandle] = task;
	      registerImmediate(nextHandle);
	      return nextHandle++;
	    }

	    function clearImmediate(handle) {
	        delete tasksByHandle[handle];
	    }

	    function run(task) {
	        var callback = task.callback;
	        var args = task.args;
	        switch (args.length) {
	        case 0:
	            callback();
	            break;
	        case 1:
	            callback(args[0]);
	            break;
	        case 2:
	            callback(args[0], args[1]);
	            break;
	        case 3:
	            callback(args[0], args[1], args[2]);
	            break;
	        default:
	            callback.apply(undefined, args);
	            break;
	        }
	    }

	    function runIfPresent(handle) {
	        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
	        // So if we're currently running a task, we'll need to delay this invocation.
	        if (currentlyRunningATask) {
	            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
	            // "too much recursion" error.
	            setTimeout(runIfPresent, 0, handle);
	        } else {
	            var task = tasksByHandle[handle];
	            if (task) {
	                currentlyRunningATask = true;
	                try {
	                    run(task);
	                } finally {
	                    clearImmediate(handle);
	                    currentlyRunningATask = false;
	                }
	            }
	        }
	    }

	    function installNextTickImplementation() {
	        registerImmediate = function(handle) {
	            process.nextTick(function () { runIfPresent(handle); });
	        };
	    }

	    function canUsePostMessage() {
	        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
	        // where `global.postMessage` means something completely different and can't be used for this purpose.
	        if (global.postMessage && !global.importScripts) {
	            var postMessageIsAsynchronous = true;
	            var oldOnMessage = global.onmessage;
	            global.onmessage = function() {
	                postMessageIsAsynchronous = false;
	            };
	            global.postMessage("", "*");
	            global.onmessage = oldOnMessage;
	            return postMessageIsAsynchronous;
	        }
	    }

	    function installPostMessageImplementation() {
	        // Installs an event handler on `global` for the `message` event: see
	        // * https://developer.mozilla.org/en/DOM/window.postMessage
	        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

	        var messagePrefix = "setImmediate$" + Math.random() + "$";
	        var onGlobalMessage = function(event) {
	            if (event.source === global &&
	                typeof event.data === "string" &&
	                event.data.indexOf(messagePrefix) === 0) {
	                runIfPresent(+event.data.slice(messagePrefix.length));
	            }
	        };

	        if (global.addEventListener) {
	            global.addEventListener("message", onGlobalMessage, false);
	        } else {
	            global.attachEvent("onmessage", onGlobalMessage);
	        }

	        registerImmediate = function(handle) {
	            global.postMessage(messagePrefix + handle, "*");
	        };
	    }

	    function installMessageChannelImplementation() {
	        var channel = new MessageChannel();
	        channel.port1.onmessage = function(event) {
	            var handle = event.data;
	            runIfPresent(handle);
	        };

	        registerImmediate = function(handle) {
	            channel.port2.postMessage(handle);
	        };
	    }

	    function installReadyStateChangeImplementation() {
	        var html = doc.documentElement;
	        registerImmediate = function(handle) {
	            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
	            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
	            var script = doc.createElement("script");
	            script.onreadystatechange = function () {
	                runIfPresent(handle);
	                script.onreadystatechange = null;
	                html.removeChild(script);
	                script = null;
	            };
	            html.appendChild(script);
	        };
	    }

	    function installSetTimeoutImplementation() {
	        registerImmediate = function(handle) {
	            setTimeout(runIfPresent, 0, handle);
	        };
	    }

	    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
	    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
	    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

	    // Don't get fooled by e.g. browserify environments.
	    if ({}.toString.call(global.process) === "[object process]") {
	        // For Node.js before 0.9
	        installNextTickImplementation();

	    } else if (canUsePostMessage()) {
	        // For non-IE10 modern browsers
	        installPostMessageImplementation();

	    } else if (global.MessageChannel) {
	        // For web workers, where supported
	        installMessageChannelImplementation();

	    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
	        // For IE 6–8
	        installReadyStateChangeImplementation();

	    } else {
	        // For older browsers
	        installSetTimeoutImplementation();
	    }

	    attachTo.setImmediate = setImmediate;
	    attachTo.clearImmediate = clearImmediate;
	}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(13)))

/***/ }),
/* 13 */
/***/ (function(module, exports) {

	

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var Loader = __webpack_require__(15);

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


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

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


/***/ }),
/* 16 */
/***/ (function(module, exports) {

	function installCompat() {
	    'use strict';

	    // This must be called like `nunjucks.installCompat` so that `this`
	    // references the nunjucks instance
	    var runtime = this.runtime; // jshint ignore:line
	    var lib = this.lib; // jshint ignore:line
	    var Compiler = this.compiler.Compiler; // jshint ignore:line
	    var Parser = this.parser.Parser; // jshint ignore:line
	    var nodes = this.nodes; // jshint ignore:line
	    var lexer = this.lexer; // jshint ignore:line

	    var orig_contextOrFrameLookup = runtime.contextOrFrameLookup;
	    var orig_Compiler_assertType = Compiler.prototype.assertType;
	    var orig_Parser_parseAggregate = Parser.prototype.parseAggregate;
	    var orig_memberLookup = runtime.memberLookup;

	    function uninstall() {
	        runtime.contextOrFrameLookup = orig_contextOrFrameLookup;
	        Compiler.prototype.assertType = orig_Compiler_assertType;
	        Parser.prototype.parseAggregate = orig_Parser_parseAggregate;
	        runtime.memberLookup = orig_memberLookup;
	    }

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

	    var Slice = nodes.Node.extend('Slice', {
	        fields: ['start', 'stop', 'step'],
	        init: function(lineno, colno, start, stop, step) {
	            start = start || new nodes.Literal(lineno, colno, null);
	            stop = stop || new nodes.Literal(lineno, colno, null);
	            step = step || new nodes.Literal(lineno, colno, 1);
	            this.parent(lineno, colno, start, stop, step);
	        }
	    });

	    Compiler.prototype.assertType = function(node) {
	        if (node instanceof Slice) {
	            return;
	        }
	        return orig_Compiler_assertType.apply(this, arguments);
	    };
	    Compiler.prototype.compileSlice = function(node, frame) {
	        this.emit('(');
	        this._compileExpression(node.start, frame);
	        this.emit('),(');
	        this._compileExpression(node.stop, frame);
	        this.emit('),(');
	        this._compileExpression(node.step, frame);
	        this.emit(')');
	    };

	    function getTokensState(tokens) {
	        return {
	            index: tokens.index,
	            lineno: tokens.lineno,
	            colno: tokens.colno
	        };
	    }

	    Parser.prototype.parseAggregate = function() {
	        var self = this;
	        var origState = getTokensState(this.tokens);
	        // Set back one accounting for opening bracket/parens
	        origState.colno--;
	        origState.index--;
	        try {
	            return orig_Parser_parseAggregate.apply(this);
	        } catch(e) {
	            var errState = getTokensState(this.tokens);
	            var rethrow = function() {
	                lib.extend(self.tokens, errState);
	                return e;
	            };

	            // Reset to state before original parseAggregate called
	            lib.extend(this.tokens, origState);
	            this.peeked = false;

	            var tok = this.peekToken();
	            if (tok.type !== lexer.TOKEN_LEFT_BRACKET) {
	                throw rethrow();
	            } else {
	                this.nextToken();
	            }

	            var node = new Slice(tok.lineno, tok.colno);

	            // If we don't encounter a colon while parsing, this is not a slice,
	            // so re-raise the original exception.
	            var isSlice = false;

	            for (var i = 0; i <= node.fields.length; i++) {
	                if (this.skip(lexer.TOKEN_RIGHT_BRACKET)) {
	                    break;
	                }
	                if (i === node.fields.length) {
	                    if (isSlice) {
	                        this.fail('parseSlice: too many slice components', tok.lineno, tok.colno);
	                    } else {
	                        break;
	                    }
	                }
	                if (this.skip(lexer.TOKEN_COLON)) {
	                    isSlice = true;
	                } else {
	                    var field = node.fields[i];
	                    node[field] = this.parseExpression();
	                    isSlice = this.skip(lexer.TOKEN_COLON) || isSlice;
	                }
	            }
	            if (!isSlice) {
	                throw rethrow();
	            }
	            return new nodes.Array(tok.lineno, tok.colno, [node]);
	        }
	    };

	    function sliceLookup(obj, start, stop, step) {
	        obj = obj || [];
	        if (start === null) {
	            start = (step < 0) ? (obj.length - 1) : 0;
	        }
	        if (stop === null) {
	            stop = (step < 0) ? -1 : obj.length;
	        } else {
	            if (stop < 0) {
	                stop += obj.length;
	            }
	        }

	        if (start < 0) {
	            start += obj.length;
	        }

	        var results = [];

	        for (var i = start; ; i += step) {
	            if (i < 0 || i > obj.length) {
	                break;
	            }
	            if (step > 0 && i >= stop) {
	                break;
	            }
	            if (step < 0 && i <= stop) {
	                break;
	            }
	            results.push(runtime.memberLookup(obj, i));
	        }
	        return results;
	    }

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
	            return null;    // Always returns None
	        }
	    };
	    OBJECT_MEMBERS.iteritems = OBJECT_MEMBERS.items;
	    OBJECT_MEMBERS.itervalues = OBJECT_MEMBERS.values;
	    OBJECT_MEMBERS.iterkeys = OBJECT_MEMBERS.keys;
	    runtime.memberLookup = function(obj, val, autoescape) { // jshint ignore:line
	        if (arguments.length === 4) {
	            return sliceLookup.apply(this, arguments);
	        }
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

	    return uninstall;
	}

	module.exports = installCompat;


/***/ })
/******/ ])
});
;
},{}],"/home/skam/Work/liveblog-default-theme/templates/template-item-embed.html":[function(require,module,exports){
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

},{"nunjucks/browser/nunjucks-slim":"/home/skam/Work/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/skam/Work/liveblog-default-theme/templates/template-item-image.html":[function(require,module,exports){
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

},{"nunjucks/browser/nunjucks-slim":"/home/skam/Work/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/skam/Work/liveblog-default-theme/templates/template-post.html":[function(require,module,exports){
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
output += "\">\n\n\n  ";
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
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"post_items_type") == "advertisement") {
output += "\n  <div class=\"lb-advertisement\">Advertisement</div>\n  ";
;
}
else {
output += "\n    <div class=\"lb-type lb-type--text\"></div>\n  ";
;
}
;
}
;
}
output += "\n\n  <!-- remove advertisement stylization-->\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"post_items_type") != "advertisement") {
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
output += "\n  <!-- end sticky position toggle -->\n  ";
;
}
output += "\n  <!-- end remove advertisement stylization-->\n\n  <!-- item start -->\n  <div class=\"items-container\">\n    ";
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

},{"nunjucks/browser/nunjucks-slim":"/home/skam/Work/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/skam/Work/liveblog-default-theme/templates/template-slideshow.html":[function(require,module,exports){
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

},{"nunjucks/browser/nunjucks-slim":"/home/skam/Work/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/skam/Work/liveblog-default-theme/templates/template-timeline.html":[function(require,module,exports){
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

},{"nunjucks/browser/nunjucks-slim":"/home/skam/Work/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}]},{},["/home/skam/Work/liveblog-default-theme/js/liveblog.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9saXZlYmxvZy5qcyIsImpzL3RoZW1lL2hhbmRsZXJzLmpzIiwianMvdGhlbWUvaGVscGVycy5qcyIsImpzL3RoZW1lL2luZGV4LmpzIiwianMvdGhlbWUvbG9jYWwtYW5hbHl0aWNzLmpzIiwianMvdGhlbWUvcGFnZXZpZXcuanMiLCJqcy90aGVtZS9zbGlkZXNob3cuanMiLCJqcy90aGVtZS90ZW1wbGF0ZXMuanMiLCJqcy90aGVtZS92aWV3LmpzIiwianMvdGhlbWUvdmlld21vZGVsLmpzIiwibm9kZV9tb2R1bGVzL21vbWVudC9tb21lbnQuanMiLCJub2RlX21vZHVsZXMvbnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltLmpzIiwidGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbCIsInRlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtcG9zdC5odG1sIiwidGVtcGxhdGVzL3RlbXBsYXRlLXNsaWRlc2hvdy5odG1sIiwidGVtcGxhdGVzL3RlbXBsYXRlLXRpbWVsaW5lLmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7OztBQUlBOztBQUVBOztBQUNBLElBQUksUUFBUSxRQUFRLFNBQVIsQ0FBWjs7QUFFQSxTQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxZQUFNO0FBQ2xELFFBQU0sSUFBTjtBQUNELENBRkQ7O0FBSUEsT0FBTyxPQUFQLEdBQWlCLEVBQWpCOzs7QUNiQTs7OztBQUlBOztBQUVBLElBQUksT0FBTyxRQUFRLFFBQVIsQ0FBWDtBQUFBLElBQ0ksWUFBWSxRQUFRLGFBQVIsQ0FEaEI7QUFBQSxJQUVJLFVBQVUsUUFBUSxXQUFSLENBRmQ7O0FBSUE7Ozs7O0FBS0EsSUFBTSxjQUFjLFNBQWQsV0FBYyxDQUFDLENBQUQsRUFBTztBQUN6QixJQUFFLGNBQUY7O0FBRUEsTUFBSSxPQUFPLFNBQVMsYUFBVCxDQUF1QixlQUF2QixFQUF3QyxLQUFuRDtBQUNBLE1BQUksVUFBVSxTQUFTLGFBQVQsQ0FBdUIsa0JBQXZCLEVBQTJDLEtBQXpEOztBQUVBLE9BQUssc0JBQUw7O0FBRUEsU0FBTyxVQUFVLFdBQVYsQ0FBc0IsSUFBdEIsRUFBNEIsT0FBNUIsRUFDSixJQURJLENBQ0MsS0FBSyxtQkFETixFQUVKLElBRkksQ0FFQztBQUFBLFdBQU0sU0FDUCxhQURPLENBQ08sY0FEUCxFQUVQLG1CQUZPLENBRWEsUUFGYixFQUV1QixXQUZ2QixDQUFOO0FBQUEsR0FGRCxFQU1KLElBTkksQ0FNQyxLQUFLLHFCQU5OLEVBT0osS0FQSSxDQU9FLEtBQUssd0JBUFAsQ0FBUDtBQVFELENBaEJEOztBQWtCQSxJQUFJLFVBQVU7QUFDWixZQUFVO0FBQ1IsMEJBQXNCLDBCQUFNO0FBQzFCLGdCQUFVLGFBQVYsR0FDRyxJQURILENBQ1EsS0FBSyxXQURiLEVBRUcsSUFGSCxDQUVRLEtBQUssZUFGYixFQUdHLEtBSEgsQ0FHUyxVQUhUO0FBSUQsS0FOTzs7QUFRUixtQ0FBK0IsbUNBQU07QUFDbkMsZ0JBQVUsU0FBVixDQUFvQixFQUFDLE1BQU0sV0FBUCxFQUFwQixFQUNHLElBREgsQ0FDUSxLQUFLLGNBRGIsRUFFRyxJQUZILENBRVEsS0FBSyxlQUZiLEVBR0csSUFISCxDQUdRLEtBQUssYUFBTCxDQUFtQixXQUFuQixDQUhSLEVBSUcsS0FKSCxDQUlTLFVBSlQ7QUFLRCxLQWRPOztBQWdCUixvQ0FBZ0Msb0NBQU07QUFDcEMsZ0JBQVUsU0FBVixDQUFvQixFQUFDLE1BQU0sWUFBUCxFQUFwQixFQUNHLElBREgsQ0FDUSxLQUFLLGNBRGIsRUFFRyxJQUZILENBRVEsS0FBSyxlQUZiLEVBR0csSUFISCxDQUdRLEtBQUssYUFBTCxDQUFtQixZQUFuQixDQUhSLEVBSUcsS0FKSCxDQUlTLFVBSlQ7QUFLRCxLQXRCTzs7QUF3QlIsbUNBQStCLG1DQUFNO0FBQ25DLGdCQUFVLFNBQVYsQ0FBb0IsRUFBQyxNQUFNLFdBQVAsRUFBcEIsRUFDRyxJQURILENBQ1EsS0FBSyxjQURiLEVBRUcsSUFGSCxDQUVRLEtBQUssZUFGYixFQUdHLElBSEgsQ0FHUSxLQUFLLGFBQUwsQ0FBbUIsV0FBbkIsQ0FIUixFQUlHLEtBSkgsQ0FJUyxVQUpUO0FBS0QsS0E5Qk87O0FBZ0NSLHFDQUFpQyxtQ0FBTTtBQUNyQyxVQUFJLFlBQVksS0FBSyxtQkFBTCxFQUFoQjtBQUNBLFVBQUksY0FBYyxTQUFTLGFBQVQsQ0FBdUIsY0FBdkIsQ0FBbEI7O0FBRUEsVUFBSSxTQUFKLEVBQWU7QUFDYixvQkFBWSxnQkFBWixDQUE2QixRQUE3QixFQUF1QyxXQUF2QztBQUNELE9BRkQsTUFFTztBQUNMLG9CQUFZLG1CQUFaLENBQWdDLFFBQWhDLEVBQTBDLFdBQTFDO0FBQ0Q7QUFDRixLQXpDTzs7QUEyQ1Isc0NBQWtDLGtDQUFDLENBQUQsRUFBTztBQUN2QyxRQUFFLGNBQUY7QUFDQSxXQUFLLG1CQUFMO0FBQ0Q7QUE5Q08sR0FERTs7QUFrRFosVUFBUSxrQkFBVztBQUNqQixXQUFPLElBQVAsQ0FBWSxRQUFRLFFBQXBCLEVBQThCLE9BQTlCLENBQXNDLFVBQUMsT0FBRCxFQUFhO0FBQ2pELFVBQUksS0FBSyxRQUFRLFFBQVIsQ0FBaUIsT0FBakIsRUFBMEIsQ0FBMUIsQ0FBVDs7QUFFQSxVQUFJLENBQUMsRUFBTCxFQUFTO0FBQ1AsZUFBTyxLQUFQO0FBQ0Q7O0FBRUQsU0FBRyxnQkFBSCxDQUFvQixPQUFwQixFQUE2QixRQUFRLFFBQVIsQ0FBaUIsT0FBakIsQ0FBN0IsRUFBd0QsS0FBeEQ7QUFDRCxLQVJEOztBQVVBLFNBQUssZUFBTDtBQUNEO0FBOURXLENBQWQ7O0FBaUVBLFNBQVMsVUFBVCxDQUFvQixHQUFwQixFQUF5QjtBQUN2QixVQUFRLEtBQVIsQ0FBYyxpQkFBZCxFQUFpQyxHQUFqQztBQUNEOztBQUVELElBQUksU0FBUztBQUNYLFVBQVEsa0JBQVcsQ0FBRSxDQURWLENBQ1c7QUFEWCxDQUFiOztBQUlBLE9BQU8sT0FBUCxHQUFpQjtBQUNmLFdBQVMsT0FETTtBQUVmLFVBQVE7QUFGTyxDQUFqQjs7O0FDMUdBOzs7O0FBSUE7O0FBRUEsSUFBSSxTQUFTLFFBQVEsUUFBUixDQUFiO0FBQUEsSUFDRSxXQUFXLE9BQU8sRUFBUCxDQUFVLFFBRHZCOztBQUdBLFNBQVMsZ0JBQVQsQ0FBMEIsU0FBMUIsRUFBcUM7QUFDbkMsTUFBSSxDQUFDLFNBQVMsY0FBVixJQUE0QixTQUFTLGNBQVQsS0FBNEIsU0FBNUQsRUFBdUU7QUFDckUsV0FBTyxPQUFPLFNBQVAsRUFBa0IsT0FBbEIsRUFBUDtBQUNEO0FBQ0QsU0FBTyxPQUFPLFNBQVAsRUFBa0IsTUFBbEIsQ0FBeUIsU0FBUyxjQUFsQyxDQUFQO0FBQ0Q7O0FBRUQ7Ozs7QUFJQSxTQUFTLFFBQVQsQ0FBa0IsS0FBbEIsRUFBeUI7QUFDdkIsTUFBSSxhQUFhLE1BQU0sT0FBTixDQUFjLE9BQWQsSUFBeUIsQ0FBQyxDQUEzQztBQUNBLFNBQU8sYUFDSCxTQUFTLGdCQUFULENBQTBCLEtBQTFCLENBREcsR0FFSCxTQUFTLHNCQUFULENBQWdDLEtBQWhDLENBRko7QUFHRDs7QUFFRDs7OztBQUlBLFNBQVMsT0FBVCxDQUFpQixHQUFqQixFQUFzQjtBQUNwQixTQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsUUFBSSxNQUFNLElBQUksY0FBSixFQUFWOztBQUVBLFFBQUksSUFBSixDQUFTLEtBQVQsRUFBZ0IsR0FBaEI7QUFDQSxRQUFJLE1BQUosR0FBYSxZQUFXO0FBQ3RCLFVBQUksSUFBSSxNQUFKLEtBQWUsR0FBbkIsRUFBd0I7QUFDdEIsZ0JBQVEsS0FBSyxLQUFMLENBQVcsSUFBSSxZQUFmLENBQVI7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPLElBQUksWUFBWDtBQUNEO0FBQ0YsS0FORDs7QUFRQSxRQUFJLElBQUo7QUFDRCxHQWJNLENBQVA7QUFjRDs7QUFFRCxTQUFTLElBQVQsQ0FBYyxHQUFkLEVBQW1CLElBQW5CLEVBQXlCO0FBQ3ZCLFNBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxRQUFJLE1BQU0sSUFBSSxjQUFKLEVBQVY7O0FBRUEsUUFBSSxJQUFKLENBQVMsTUFBVCxFQUFpQixHQUFqQjtBQUNBLFFBQUksZ0JBQUosQ0FBcUIsY0FBckIsRUFBcUMsa0JBQXJDO0FBQ0EsUUFBSSxNQUFKLEdBQWEsWUFBVztBQUN0QixVQUFJLElBQUksTUFBSixLQUFlLEdBQW5CLEVBQXdCO0FBQ3RCLGdCQUFRLEtBQUssS0FBTCxDQUFXLElBQUksWUFBZixDQUFSO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxJQUFJLFlBQVg7QUFDRDtBQUNGLEtBTkQ7O0FBUUEsUUFBSSxJQUFKLENBQVMsS0FBSyxTQUFMLENBQWUsSUFBZixDQUFUO0FBQ0QsR0FkTSxDQUFQO0FBZ0JEOztBQUVELE9BQU8sT0FBUCxHQUFpQjtBQUNmLFlBQVUsUUFESztBQUVmLFdBQVMsT0FGTTtBQUdmLFFBQU0sSUFIUztBQUlmLG9CQUFrQjtBQUpILENBQWpCOzs7QUNuRUE7Ozs7QUFJQTs7QUFFQSxJQUFNLFdBQVcsUUFBUSxZQUFSLENBQWpCO0FBQUEsSUFDRSxZQUFZLFFBQVEsYUFBUixDQURkO0FBQUEsSUFFRSxPQUFPLFFBQVEsUUFBUixDQUZUO0FBQUEsSUFHRSxXQUFXLFFBQVEsWUFBUixDQUhiO0FBQUEsSUFJRSxpQkFBaUIsUUFBUSxtQkFBUixDQUpuQjs7QUFNQSxPQUFPLE9BQVAsR0FBaUI7QUFDZjs7O0FBR0EsUUFBTSxnQkFBVztBQUNmLGFBQVMsT0FBVCxDQUFpQixNQUFqQixHQURlLENBQ1k7QUFDM0IsYUFBUyxNQUFULENBQWdCLE1BQWhCLEdBRmUsQ0FFVztBQUMxQixjQUFVLElBQVY7QUFDQSxtQkFBZSxHQUFmO0FBQ0EsYUFBUyxJQUFUOztBQUVBLFNBQUssZ0JBQUw7QUFDQSxnQkFBWSxZQUFNO0FBQ2hCLFdBQUssZ0JBQUwsR0FEZ0IsQ0FDUztBQUMxQixLQUZELEVBRUcsSUFGSDtBQUdEO0FBZmMsQ0FBakI7Ozs7O0FDWkEsSUFBSSxVQUFVLE9BQU8sY0FBUCxDQUFzQixJQUF0QixJQUE4QixPQUFPLEVBQVAsQ0FBVSxRQUFWLENBQW1CLE9BQW5CLENBQTJCLEtBQTNCLEVBQWtDLEVBQWxDLENBQTlCLEdBQXNFLEVBQXBGO0FBQ0EsSUFBSSxhQUFhLFNBQVMsUUFBMUI7QUFDQSxJQUFJLFNBQVMsT0FBTyxjQUFQLENBQXNCLElBQXRCLElBQThCLE9BQU8sRUFBUCxDQUFVLElBQVYsQ0FBZSxHQUE3QyxHQUFtRCxFQUFoRTs7QUFFQSxXQUFXLG9CQUFYOztBQUVBLElBQUksZUFBZSxTQUFmLFlBQWUsQ0FBUyxJQUFULEVBQWUsS0FBZixFQUFzQixJQUF0QixFQUE0QjtBQUM3QyxNQUFJLFVBQVUsRUFBZDtBQUFBLE1BQWtCLE9BQU8sSUFBSSxJQUFKLEVBQXpCOztBQUVBLE1BQUksSUFBSixFQUFVO0FBQ1IsU0FBSyxPQUFMLENBQWEsS0FBSyxPQUFMLEtBQWlCLE9BQU8sRUFBUCxHQUFZLEVBQVosR0FBaUIsRUFBakIsR0FBc0IsSUFBcEQ7QUFDQSw2QkFBdUIsS0FBSyxXQUFMLEVBQXZCO0FBQ0Q7QUFDRCxXQUFTLE1BQVQsR0FBcUIsSUFBckIsU0FBNkIsS0FBN0IsR0FBcUMsT0FBckM7QUFDRCxDQVJEOztBQVVBLElBQUksYUFBYSxTQUFiLFVBQWEsQ0FBUyxJQUFULEVBQWU7QUFDOUIsTUFBSSxTQUFTLE9BQU8sR0FBcEI7QUFDQSxNQUFJLEtBQUssU0FBUyxNQUFULENBQWdCLEtBQWhCLENBQXNCLEdBQXRCLENBQVQ7O0FBRUEsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEdBQUcsTUFBdkIsRUFBK0IsR0FBL0IsRUFBb0M7QUFDbEMsUUFBSSxJQUFJLEdBQUcsQ0FBSCxDQUFSOztBQUVBLFdBQU8sRUFBRSxNQUFGLENBQVMsQ0FBVCxNQUFnQixHQUF2QixFQUE0QjtBQUMxQixVQUFJLEVBQUUsU0FBRixDQUFZLENBQVosRUFBZSxFQUFFLE1BQWpCLENBQUo7QUFDRDs7QUFFRCxRQUFJLEVBQUUsT0FBRixDQUFVLE1BQVYsTUFBc0IsQ0FBMUIsRUFBNkI7QUFDM0IsYUFBTyxFQUFFLFNBQUYsQ0FBWSxPQUFPLE1BQW5CLEVBQTJCLEVBQUUsTUFBN0IsQ0FBUDtBQUNEO0FBQ0Y7QUFDRCxTQUFPLElBQVA7QUFDRCxDQWhCRDs7QUFrQkEsSUFBSSxPQUFNLFNBQU4sSUFBTSxHQUFXO0FBQ25CLE1BQUksVUFBVSxJQUFJLGNBQUosRUFBZDtBQUNBLE1BQUksV0FBVyxLQUFLLFNBQUwsQ0FBZTtBQUM1QixpQkFBYSxVQURlO0FBRTVCLGFBQVM7QUFGbUIsR0FBZixDQUFmOztBQUtBLFVBQVEsSUFBUixDQUFhLE1BQWIsRUFBcUIsT0FBckI7QUFDQSxVQUFRLGdCQUFSLENBQXlCLGNBQXpCLEVBQXlDLGtCQUF6Qzs7QUFFQSxVQUFRLE1BQVIsR0FBaUIsWUFBVztBQUMxQixRQUFJLFFBQVEsTUFBUixLQUFtQixHQUF2QixFQUE0QjtBQUMxQixtQkFBYSxLQUFiLEVBQW9CLFFBQXBCLEVBQThCLENBQTlCO0FBQ0Q7QUFDRixHQUpEOztBQU1BLFVBQVEsSUFBUixDQUFhLFFBQWI7QUFDRCxDQWpCRDs7QUFtQkEsT0FBTyxPQUFQLEdBQWlCLEVBQUMsS0FBSyxlQUFNO0FBQzNCLFFBQUksQ0FBQyxXQUFXLEtBQVgsQ0FBTCxFQUF3QjtBQUN0QjtBQUNEO0FBQ0YsR0FKZ0IsRUFBakI7OztBQ3JEQTs7QUFFQTs7Ozs7QUFLQSxJQUFJLGVBQWU7QUFDakIsbUJBQWlCLEVBREEsRUFDSTs7QUFFckIsWUFBVSxvQkFBVztBQUNuQixRQUFJLENBQUMsT0FBTyxHQUFaLEVBQWlCO0FBQ2Y7QUFDRDs7QUFFRCxRQUFJLFdBQVc7QUFDYixZQUFNLE9BQU8sY0FBUCxDQUFzQixLQURmLEVBQ3NCO0FBQ25DLFlBQU0sT0FBTyxjQUFQLENBQXNCLEtBRmYsRUFFc0I7QUFDbkMsWUFBTSxPQUFPLGNBQVAsQ0FBc0IsS0FIZixFQUdzQjtBQUNuQyxZQUFNLElBSk8sQ0FJRjtBQUpFLEtBQWY7O0FBT0EsV0FBTyxHQUFQLENBQVcsQ0FBWCxDQUFhLFFBQWIsRUFBdUIsQ0FBdkIsRUFabUIsQ0FZUTtBQUM1QixHQWhCZ0I7O0FBa0JqQixXQUFTLG1CQUFXO0FBQ2xCLFFBQUksT0FBTyxFQUFQLENBQVUsTUFBVixHQUFtQixDQUF2QixFQUEwQjtBQUN4QixhQUFPLEVBQVAsQ0FBVSxRQUFWLEVBQW9CLE9BQU8sY0FBUCxDQUFzQixVQUExQyxFQUFzRCxNQUF0RDtBQUNBLGFBQU8sRUFBUCxDQUFVLEtBQVYsRUFBaUIsYUFBakIsRUFBZ0MsSUFBaEM7QUFDRDs7QUFFRCxRQUFJLE9BQU8sRUFBUCxDQUFVLE1BQWQsRUFBc0I7QUFDcEIsYUFBTyxFQUFQLENBQVUsTUFBVixFQUFrQjtBQUNoQixpQkFBUyxVQURPO0FBRWhCLGtCQUFVLE9BQU8sUUFBUCxDQUFnQixRQUZWLEVBRW9CO0FBQ3BDLHFCQUFhLHVCQUFXLENBQUU7QUFIVixPQUFsQjtBQUtEO0FBQ0YsR0EvQmdCOztBQWlDakIsaUJBQWUsdUJBQVMsR0FBVCxFQUFjLEVBQWQsRUFBa0I7QUFDL0IsUUFBSSxTQUFTLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFiLENBQStDLE9BQU8sR0FBUCxHQUFhLEdBQWI7QUFDL0MsYUFBUyxvQkFBVCxDQUE4QixNQUE5QixFQUFzQyxDQUF0QyxFQUF5QyxXQUF6QyxDQUFxRCxNQUFyRDtBQUNBLFdBQU8sZ0JBQVAsQ0FBd0IsTUFBeEIsRUFBZ0MsRUFBaEM7QUFDRCxHQXJDZ0I7O0FBdUNqQixpQkFBZSx5QkFBVztBQUN4QixRQUFJLGlCQUFpQixFQUFyQjs7QUFFQSxRQUFJLEtBQUssZUFBTCxDQUFxQixNQUF6QixFQUFpQztBQUMvQixhQUFPLEtBQUssZUFBWixDQUQrQixDQUNGO0FBQzlCOztBQUVELFNBQUssSUFBSSxDQUFULElBQWMsS0FBSyxVQUFuQixFQUErQjtBQUM3QixVQUFJLFdBQVcsS0FBSyxVQUFMLENBQWdCLENBQWhCLENBQWY7QUFDQSxVQUFJLFlBQVksU0FBUyxZQUFULENBQXNCLE1BQXRCLENBQTZCLFVBQUMsSUFBRCxFQUFPLElBQVA7QUFBQSxlQUMzQyxPQUFPLGNBQVAsQ0FBc0IsY0FBdEIsQ0FBcUMsSUFBckMsQ0FEMkM7QUFBQSxPQUE3QixFQUVkLElBRmMsQ0FBaEIsQ0FGNkIsQ0FJcEI7O0FBRVQsVUFBSSxjQUFjLElBQWxCLEVBQXdCO0FBQUU7QUFDeEIsWUFBSSxDQUFDLFNBQVMsTUFBZCxFQUFzQjtBQUNwQixlQUFLLGFBQUwsQ0FBbUIsU0FBUyxTQUE1QixFQUF1QyxTQUFTLElBQWhELEVBRG9CLENBQ21DO0FBQ3hELFNBRkQsTUFFTztBQUNMLHlCQUFlLElBQWYsQ0FBb0IsU0FBUyxJQUE3QixFQURLLENBQytCO0FBQ3JDO0FBQ0Y7QUFDRjs7QUFFRCxXQUFPLGVBQVAsR0FBeUIsY0FBekIsQ0F0QndCLENBc0JpQjtBQUN6QyxXQUFPLGNBQVA7QUFDRCxHQS9EZ0I7O0FBaUVqQixRQUFNLGdCQUFXO0FBQUU7QUFDakIsUUFBSSxDQUFDLE9BQU8sY0FBUCxDQUFzQixnQkFBdEIsQ0FBTCxFQUE4QztBQUM1QyxhQUQ0QyxDQUNwQztBQUNUOztBQUVELFFBQUksWUFBWSxLQUFLLGFBQUwsRUFBaEIsQ0FMZSxDQUt1Qjs7QUFFdEMsU0FBSyxJQUFJLElBQUksVUFBVSxNQUFWLEdBQW1CLENBQWhDLEVBQW1DLEtBQUssQ0FBeEMsRUFBMkMsR0FBM0MsRUFBZ0Q7QUFDOUMsZ0JBQVUsQ0FBVixJQUQ4QyxDQUM5QjtBQUNqQjtBQUNGLEdBM0VnQjs7QUE2RWpCLGtCQUFnQix3QkFBUyxDQUFULEVBQVk7QUFDMUIsUUFBSSxFQUFFLElBQUYsQ0FBTyxJQUFQLEtBQWdCLFdBQXBCLEVBQWlDO0FBQy9CLFVBQUksVUFBVSxLQUFLLEtBQUwsQ0FBVyxFQUFFLElBQUYsQ0FBTyxPQUFsQixDQUFkOztBQUVBLGFBQU8sY0FBUCxHQUF3QixPQUF4QixDQUgrQixDQUdFO0FBQ2xDO0FBQ0YsR0FuRmdCOztBQXFGakIsUUFBTSxnQkFBVztBQUNmLFFBQUksT0FBTyxFQUFQLENBQVUsUUFBVixDQUFtQixNQUFuQixLQUE4QixFQUFsQyxFQUFzQztBQUNwQyxhQUFPLGdCQUFQLENBQXdCLFNBQXhCLEVBQW1DLEtBQUssY0FBeEMsRUFBd0QsS0FBeEQ7QUFDQSxhQUFPLGdCQUFQLENBQXdCLGNBQXhCLEVBQXdDLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBZSxJQUFmLENBQXhDLEVBQThELEtBQTlEO0FBQ0QsS0FIRCxNQUdPO0FBQ0wsYUFBTyxjQUFQLEdBQXdCLEVBQUMsWUFBWSxPQUFPLEVBQVAsQ0FBVSxRQUFWLENBQW1CLE1BQWhDLEVBQXhCO0FBQ0EsV0FBSyxJQUFMLEdBQVksS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLElBQWYsQ0FBWjtBQUNBLFdBQUssSUFBTDtBQUNEO0FBQ0Y7QUE5RmdCLENBQW5COztBQWlHQSxhQUFhLFVBQWIsR0FBMEI7QUFDeEIsT0FBSztBQUNILFVBQU0sYUFBYSxRQURoQjtBQUVILGtCQUFjLENBQUMsT0FBRCxFQUFVLE9BQVYsRUFBbUIsT0FBbkIsQ0FGWDtBQUdILGVBQVcsK0JBSFI7QUFJSCxZQUFRLE9BQU8sY0FBUCxDQUFzQixLQUF0QixJQUErQixPQUFPLEdBQXRDLEdBQTRDO0FBSmpELEdBRG1COztBQVF4QixNQUFJO0FBQ0YsVUFBTSxhQUFhLE9BRGpCO0FBRUYsa0JBQWMsQ0FBQyxZQUFELENBRlo7QUFHRixlQUFXLCtDQUhUO0FBSUYsWUFBUSxPQUFPLGNBQVAsQ0FBc0IsSUFBdEIsSUFBOEIsT0FBTyxFQUFyQyxHQUEwQztBQUpoRDtBQVJvQixDQUExQjs7QUFnQkEsT0FBTyxPQUFQLEdBQWlCLFlBQWpCOzs7Ozs7Ozs7QUN4SEEsSUFBTSxZQUFZLFFBQVEsYUFBUixDQUFsQjs7SUFFTSxTO0FBQ0osdUJBQWM7QUFBQTs7QUFDWixTQUFLLEtBQUwsR0FBYSxLQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLElBQWhCLENBQWI7QUFDQSxTQUFLLElBQUwsR0FBWSxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsSUFBZixDQUFaO0FBQ0EsU0FBSyxnQkFBTCxHQUF3QixLQUFLLGdCQUFMLENBQXNCLElBQXRCLENBQTJCLElBQTNCLENBQXhCO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLEtBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsSUFBbkIsQ0FBaEI7QUFDQSxTQUFLLG9CQUFMLEdBQTRCLEtBQUssb0JBQUwsQ0FBMEIsSUFBMUIsQ0FBK0IsSUFBL0IsQ0FBNUI7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixJQUFuQixDQUFoQjtBQUNBLFNBQUssY0FBTCxHQUFzQixLQUFLLGNBQUwsQ0FBb0IsSUFBcEIsQ0FBeUIsSUFBekIsQ0FBdEI7QUFDQSxTQUFLLGdCQUFMLEdBQXdCLEtBQUssZ0JBQUwsQ0FBc0IsSUFBdEIsQ0FBMkIsSUFBM0IsQ0FBeEI7QUFDQSxTQUFLLGlCQUFMLEdBQXlCLEtBQUssaUJBQUwsQ0FBdUIsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FBekI7QUFDQSxTQUFLLG9CQUFMLEdBQTRCLEtBQUssb0JBQUwsQ0FBMEIsSUFBMUIsQ0FBK0IsSUFBL0IsQ0FBNUI7QUFDQSxTQUFLLFVBQUwsR0FBa0IsS0FBSyxVQUFMLENBQWdCLElBQWhCLENBQXFCLElBQXJCLENBQWxCO0FBQ0EsU0FBSyxTQUFMLEdBQWlCLEtBQUssU0FBTCxDQUFlLElBQWYsQ0FBb0IsSUFBcEIsQ0FBakI7QUFDRDs7OzswQkFFSyxDLEVBQUc7QUFDUCxVQUFJLFFBQVEsRUFBWjs7QUFFQSxXQUFLLFVBQUwsR0FBa0IsQ0FBbEI7QUFDQSxXQUFLLFlBQUwsR0FBb0IsS0FBcEI7QUFDQSxXQUFLLEtBQUwsR0FBYSxJQUFiO0FBQ0EsV0FBSyxLQUFMLEdBQWEsSUFBYjs7QUFFQSxRQUFFLE1BQUYsQ0FDRyxPQURILENBQ1csbUJBRFgsRUFFRyxnQkFGSCxDQUVvQixjQUZwQixFQUdHLE9BSEgsQ0FHVyxVQUFDLEdBQUQsRUFBUztBQUNoQixZQUFJLFVBQVUsRUFBZDs7QUFFQSxZQUFJLFlBQUosQ0FBaUIsUUFBakIsRUFBMkIsT0FBM0IsQ0FBbUMsY0FBbkMsRUFBbUQsVUFBQyxDQUFELEVBQUksS0FBSixFQUFjO0FBQy9ELGtCQUFRLElBQVIsQ0FBYSxLQUFiO0FBQ0QsU0FGRDs7QUFIZ0IsWUFPWCxTQVBXLEdBT3dCLE9BUHhCO0FBQUEsWUFPQSxTQVBBLEdBT3dCLE9BUHhCO0FBQUEsWUFPVyxTQVBYLEdBT3dCLE9BUHhCOzs7QUFTaEIsY0FBTSxJQUFOLENBQVc7QUFDVCxnQkFBTTtBQUNKLGtCQUFNO0FBQ0oscUJBQU8sRUFBQyxZQUFZO0FBQ2xCLDZCQUFXLEVBQUMsTUFBTSxTQUFQLEVBRE87QUFFbEIsNkJBQVcsRUFBQyxNQUFNLFNBQVAsRUFGTztBQUdsQiw2QkFBVyxFQUFDLE1BQU0sU0FBUDtBQUhPLGlCQUFiLEVBREg7QUFNSix1QkFBUyxJQUFJLFVBQUosQ0FBZSxhQUFmLENBQTZCLGNBQTdCLEVBQTZDLFdBTmxEO0FBT0osc0JBQVEsSUFBSSxVQUFKLENBQWUsYUFBZixDQUE2QixhQUE3QixFQUE0QztBQVBoRCxhQURGO0FBVUosb0JBQVEsY0FBYyxFQUFFLE1BQUYsQ0FBUyxZQUFULENBQXNCLEtBQXRCO0FBVmxCO0FBREcsU0FBWDtBQWNELE9BMUJIOztBQTRCQSxVQUFJLFlBQVksVUFBVSxTQUFWLENBQW9CO0FBQ2xDLGNBQU07QUFENEIsT0FBcEIsQ0FBaEI7O0FBSUEsZUFBUyxhQUFULENBQXVCLGlCQUF2QixFQUNHLGtCQURILENBQ3NCLFVBRHRCLEVBQ2tDLFNBRGxDOztBQUdBLFVBQUksT0FBTyxJQUFQLEtBQWdCLE9BQU8sR0FBM0IsRUFBZ0M7QUFDOUIsZUFBTyxNQUFQLENBQWMsV0FBZCxDQUEwQixZQUExQixFQUF3QyxPQUFPLFFBQVAsQ0FBZ0IsUUFBeEQ7QUFDRDs7QUFFRCxXQUFLLFFBQUw7QUFDQSxXQUFLLGlCQUFMO0FBQ0Q7OzsyQkFFTTtBQUNMLFdBQUssY0FBTDtBQUNBLFdBQUssb0JBQUw7QUFDQSxlQUFTLGFBQVQsQ0FBdUIsWUFBdkIsRUFBcUMsTUFBckM7QUFDRDs7OytCQUVVO0FBQ1QsVUFBTSxZQUFZLFNBQVMsYUFBVCxDQUF1Qix1QkFBdkIsQ0FBbEI7QUFDQSxVQUFJLFNBQVMsVUFBVSxZQUFWLEdBQXlCLEtBQUssVUFBM0M7O0FBRUEsZ0JBQVUsS0FBVixDQUFnQixTQUFoQixTQUFnQyxNQUFoQztBQUNEOzs7d0NBRW1CO0FBQUE7O0FBQ2xCLGFBQU8sZ0JBQVAsQ0FBd0IsU0FBeEIsRUFBbUMsS0FBSyxnQkFBeEM7O0FBRUEsZUFDRyxhQURILENBQ2lCLDhCQURqQixFQUVHLGdCQUZILENBRW9CLE9BRnBCLEVBRTZCLEtBQUssZ0JBRmxDOztBQUlBLGVBQ0csYUFESCxDQUNpQiwrQkFEakIsRUFFRyxnQkFGSCxDQUVvQixPQUZwQixFQUU2QjtBQUFBLGVBQU0sTUFBSyxnQkFBTCxDQUFzQixFQUFDLFNBQVMsRUFBVixFQUF0QixDQUFOO0FBQUEsT0FGN0I7O0FBSUEsZUFDRyxhQURILENBQ2lCLCtCQURqQixFQUVHLGdCQUZILENBRW9CLE9BRnBCLEVBRTZCO0FBQUEsZUFBTSxNQUFLLGdCQUFMLENBQXNCLEVBQUMsU0FBUyxFQUFWLEVBQXRCLENBQU47QUFBQSxPQUY3Qjs7QUFJQSxlQUNHLGFBREgsQ0FDaUIseUJBRGpCLEVBRUcsZ0JBRkgsQ0FFb0IsT0FGcEIsRUFFNkIsS0FBSyxJQUZsQzs7QUFJQSxlQUNHLGFBREgsQ0FDaUIsWUFEakIsRUFFRyxnQkFGSCxDQUVvQixZQUZwQixFQUVrQyxLQUFLLFVBRnZDOztBQUlBLGVBQ0csYUFESCxDQUNpQixZQURqQixFQUVHLGdCQUZILENBRW9CLFdBRnBCLEVBRWlDLEtBQUssU0FGdEM7O0FBSUEsYUFBTyxnQkFBUCxDQUF3QixRQUF4QixFQUFrQyxLQUFLLFFBQXZDO0FBQ0Q7OzsyQ0FFc0I7QUFBQTs7QUFDckIsYUFBTyxtQkFBUCxDQUEyQixTQUEzQixFQUFzQyxLQUFLLGdCQUEzQzs7QUFFQSxlQUNHLGFBREgsQ0FDaUIsOEJBRGpCLEVBRUcsbUJBRkgsQ0FFdUIsT0FGdkIsRUFFZ0MsS0FBSyxnQkFGckM7O0FBSUEsZUFDRyxhQURILENBQ2lCLCtCQURqQixFQUVHLG1CQUZILENBRXVCLE9BRnZCLEVBRWdDO0FBQUEsZUFBTSxPQUFLLGdCQUFMLENBQXNCLEVBQUMsU0FBUyxFQUFWLEVBQXRCLENBQU47QUFBQSxPQUZoQzs7QUFJQSxlQUNHLGFBREgsQ0FDaUIsK0JBRGpCLEVBRUcsbUJBRkgsQ0FFdUIsT0FGdkIsRUFFZ0M7QUFBQSxlQUFNLE9BQUssZ0JBQUwsQ0FBc0IsRUFBQyxTQUFTLEVBQVYsRUFBdEIsQ0FBTjtBQUFBLE9BRmhDOztBQUlBLGVBQ0csYUFESCxDQUNpQix5QkFEakIsRUFFRyxtQkFGSCxDQUV1QixPQUZ2QixFQUVnQyxLQUFLLElBRnJDOztBQUlBLGVBQ0csYUFESCxDQUNpQixZQURqQixFQUVHLG1CQUZILENBRXVCLFlBRnZCLEVBRXFDLEtBQUssVUFGMUM7O0FBSUEsZUFDRyxhQURILENBQ2lCLFlBRGpCLEVBRUcsbUJBRkgsQ0FFdUIsV0FGdkIsRUFFb0MsS0FBSyxTQUZ6Qzs7QUFJQSxhQUFPLG1CQUFQLENBQTJCLFFBQTNCLEVBQXFDLEtBQUssUUFBMUM7QUFDRDs7OytCQUVVLEMsRUFBRztBQUNaLFdBQUssS0FBTCxHQUFhLEVBQUUsT0FBRixDQUFVLENBQVYsRUFBYSxPQUExQjtBQUNBLFdBQUssS0FBTCxHQUFhLEVBQUUsT0FBRixDQUFVLENBQVYsRUFBYSxPQUExQjtBQUNEOzs7OEJBRVMsQyxFQUFHO0FBQ1gsVUFBSSxDQUFDLEtBQUssS0FBTixJQUFlLENBQUMsS0FBSyxLQUF6QixFQUFnQztBQUM5QjtBQUNEOztBQUVELFVBQUksTUFBTSxFQUFFLE9BQUYsQ0FBVSxDQUFWLEVBQWEsT0FBdkI7QUFDQSxVQUFJLE1BQU0sRUFBRSxPQUFGLENBQVUsQ0FBVixFQUFhLE9BQXZCOztBQUVBLFVBQUksUUFBUSxLQUFLLEtBQUwsR0FBYSxHQUF6QjtBQUNBLFVBQUksUUFBUSxLQUFLLEtBQUwsR0FBYSxHQUF6Qjs7QUFFQSxVQUFJLEtBQUssR0FBTCxDQUFTLEtBQVQsSUFBa0IsS0FBSyxHQUFMLENBQVMsS0FBVCxDQUFsQixJQUFxQyxRQUFRLENBQWpELEVBQW9EO0FBQ2xEO0FBQ0EsYUFBSyxnQkFBTCxDQUFzQixFQUFDLFNBQVMsRUFBVixFQUF0QjtBQUNELE9BSEQsTUFHTztBQUNMO0FBQ0EsYUFBSyxnQkFBTCxDQUFzQixFQUFDLFNBQVMsRUFBVixFQUF0QjtBQUNEOztBQUVELFdBQUssS0FBTCxHQUFhLElBQWI7QUFDQSxXQUFLLEtBQUwsR0FBYSxJQUFiO0FBQ0Q7Ozt1Q0FFa0I7QUFDakIsVUFBSSxDQUFDLEtBQUssWUFBVixFQUF3QjtBQUN0QixhQUFLLG9CQUFMLENBQTBCLFNBQVMsY0FBVCxDQUF3QixXQUF4QixDQUExQjtBQUNELE9BRkQsTUFFTztBQUNMLGFBQUssY0FBTDtBQUNEO0FBQ0Y7Ozt5Q0FFb0IsTyxFQUFTO0FBQzVCLFVBQUksUUFBUSxpQkFBWixFQUErQjtBQUM3QixnQkFBUSxpQkFBUjtBQUNELE9BRkQsTUFFTyxJQUFJLFFBQVEsb0JBQVosRUFBa0M7QUFDdkMsZ0JBQVEsb0JBQVI7QUFDRCxPQUZNLE1BRUEsSUFBSSxRQUFRLHVCQUFaLEVBQXFDO0FBQzFDLGdCQUFRLHVCQUFSO0FBQ0QsT0FGTSxNQUVBLElBQUksUUFBUSxtQkFBWixFQUFpQztBQUN0QyxnQkFBUSxtQkFBUjtBQUNEOztBQUVELFdBQUssWUFBTCxHQUFvQixJQUFwQjtBQUNEOzs7cUNBRWdCO0FBQ2YsVUFBSSxTQUFTLGNBQWIsRUFBNkI7QUFDM0IsaUJBQVMsY0FBVDtBQUNELE9BRkQsTUFFTyxJQUFJLFNBQVMsbUJBQWIsRUFBa0M7QUFDdkMsaUJBQVMsbUJBQVQ7QUFDRCxPQUZNLE1BRUEsSUFBSSxTQUFTLG9CQUFiLEVBQW1DO0FBQ3hDLGlCQUFTLG9CQUFUO0FBQ0Q7O0FBRUQsV0FBSyxZQUFMLEdBQW9CLEtBQXBCO0FBQ0Q7OzsrQkFFVTtBQUFBOztBQUNULFVBQU0sWUFBWSxTQUFTLGFBQVQsQ0FBdUIsdUJBQXZCLENBQWxCOztBQUVBLGdCQUFVLGdCQUFWLENBQTJCLEtBQTNCLEVBQWtDLE9BQWxDLENBQTBDLFVBQUMsR0FBRCxFQUFNLENBQU4sRUFBWTtBQUNwRCxZQUFJLElBQUksU0FBSixDQUFjLFFBQWQsQ0FBdUIsUUFBdkIsQ0FBSixFQUFzQztBQUNwQyxpQkFBSyxVQUFMLEdBQWtCLENBQWxCO0FBQ0Q7QUFDRixPQUpEOztBQU1BLFVBQUksS0FBSyxVQUFMLEdBQWtCLENBQXRCLEVBQXlCO0FBQ3ZCLGtCQUFVLEtBQVYsQ0FBZ0IsU0FBaEIsU0FBZ0MsVUFBVSxZQUFWLEdBQXlCLEtBQUssVUFBOUQ7QUFDRDtBQUNGOzs7cUNBRWdCLEMsRUFBRztBQUNsQixVQUFNLFlBQVksU0FBUyxhQUFULENBQXVCLHVCQUF2QixDQUFsQjtBQUNBLFVBQU0sZ0JBQWdCLFVBQVUsZ0JBQVYsQ0FBMkIsS0FBM0IsRUFBa0MsTUFBeEQ7QUFDQSxVQUFJLFNBQVMsVUFBVSxZQUFWLEdBQXlCLEtBQUssVUFBM0M7O0FBRUEsY0FBUSxFQUFFLE9BQVY7QUFDQSxhQUFLLEVBQUw7QUFBUztBQUNQLGNBQUksU0FBUyxVQUFVLFlBQW5CLEdBQWtDLGdCQUFnQixVQUFVLFlBQWhFLEVBQThFO0FBQzVFLHNCQUFVLEtBQVYsQ0FBZ0IsU0FBaEIsVUFBZ0MsU0FBUyxVQUFVLFlBQW5EO0FBQ0EsaUJBQUssVUFBTDtBQUNEOztBQUVEO0FBQ0YsYUFBSyxFQUFMO0FBQVM7QUFDUCxjQUFJLFNBQVMsVUFBVSxZQUFuQixJQUFtQyxDQUF2QyxFQUEwQztBQUN4QyxzQkFBVSxLQUFWLENBQWdCLFNBQWhCLFVBQWdDLFNBQVMsVUFBVSxZQUFuRDtBQUNBLGlCQUFLLFVBQUw7QUFDRDs7QUFFRDtBQUNGLGFBQUssRUFBTDtBQUFTO0FBQ1AsZUFBSyxjQUFMO0FBQ0EsZUFBSyxJQUFMO0FBakJGO0FBbUJEOzs7Ozs7QUFHSCxPQUFPLE9BQVAsR0FBaUIsU0FBakI7OztBQ3JQQTs7OztBQUlBOztBQUVBLElBQU0sV0FBVyxRQUFRLGdDQUFSLENBQWpCO0FBQ0EsSUFBTSxXQUFXLE9BQU8sRUFBUCxDQUFVLFFBQTNCOztBQUVBLElBQU0sbUJBQW1CO0FBQ3ZCLFFBQU0sUUFBUSxvQ0FBUixDQURpQjtBQUV2QixZQUFVLFFBQVEsd0NBQVIsQ0FGYTtBQUd2QixhQUFXLFFBQVEsMENBQVIsQ0FIWTtBQUl2QixhQUFXLFFBQVEsMENBQVIsQ0FKWTtBQUt2QixhQUFXLFFBQVEseUNBQVI7QUFMWSxDQUF6Qjs7QUFRQSxTQUFTLGtCQUFULEdBQThCO0FBQzVCLE1BQUksa0JBQWtCLFNBQVMsZUFBL0I7QUFBQSxNQUNJLGtCQUFrQixnQkFEdEI7O0FBRDRCLDZCQUluQixRQUptQjtBQUsxQixRQUFJLHFCQUFxQixnQkFBZ0IsUUFBaEIsQ0FBekI7QUFDQSxxQkFBaUIsUUFBakIsSUFBNkIsVUFBQyxHQUFELEVBQU0sRUFBTixFQUFhO0FBQ3hDLGVBQVMsTUFBVCxDQUFnQixrQkFBaEIsRUFBb0MsR0FBcEMsRUFBeUMsRUFBekM7QUFDRCxLQUZEO0FBTjBCOztBQUk1QixPQUFLLElBQUksUUFBVCxJQUFxQixlQUFyQixFQUFzQztBQUFBLFVBQTdCLFFBQTZCO0FBS3JDOztBQUVELFNBQU8sZUFBUDtBQUNEOztBQUVELE9BQU8sT0FBUCxHQUFpQixTQUFTLGVBQVQsR0FDYixvQkFEYSxHQUViLGdCQUZKOzs7QUMvQkE7Ozs7QUFJQTs7QUFFQSxJQUFJLFVBQVUsUUFBUSxXQUFSLENBQWQ7QUFDQSxJQUFJLFlBQVksUUFBUSxhQUFSLENBQWhCO0FBQ0EsSUFBSSxZQUFZLFFBQVEsYUFBUixDQUFoQjs7QUFFQSxJQUFJLGVBQWUsU0FBUyxnQkFBVCxDQUEwQixrQkFBMUIsQ0FBbkI7QUFBQSxJQUNJLHNCQUFzQixRQUFRLFFBQVIsQ0FBaUIsaUJBQWpCLENBRDFCOztBQUdBOzs7OztBQUtBLFNBQVMsY0FBVCxDQUF3QixZQUF4QixFQUFzQztBQUNwQyxNQUFJLGdCQUFnQixFQUFwQjs7QUFFQSxlQUFhLE1BQWIsQ0FBb0IsT0FBcEIsQ0FBNEIsVUFBQyxJQUFELEVBQVU7QUFDcEMsa0JBQWMsSUFBZCxDQUFtQixVQUFVLElBQVYsQ0FBZTtBQUNoQyxZQUFNLElBRDBCO0FBRWhDLGdCQUFVLE9BQU8sRUFBUCxDQUFVO0FBRlksS0FBZixDQUFuQjtBQUtELEdBTkQ7QUFPQSxlQUFhLENBQWIsRUFBZ0IsU0FBaEIsR0FBNEIsY0FBYyxJQUFkLENBQW1CLEVBQW5CLENBQTVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0Q7O0FBRUQ7Ozs7OztBQU1BLFNBQVMsV0FBVCxDQUFxQixZQUFyQixFQUFtQztBQUNqQyxNQUFJLGdCQUFnQixFQUFwQixDQUF1QjtBQUF2QjtBQUFBLE1BQ0ksUUFBUSxhQUFhLE1BRHpCOztBQUdBLE9BQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQ3JDLFFBQUksT0FBTyxNQUFNLENBQU4sQ0FBWDs7QUFFQSxRQUFJLE1BQU0sU0FBTixLQUFvQixRQUF4QixFQUFrQztBQUNoQyxpQkFBVyxLQUFLLEdBQWhCO0FBQ0EsYUFGZ0MsQ0FFeEI7QUFDVDs7QUFFRCxRQUFJLGVBQWUsVUFBVSxJQUFWLENBQWU7QUFDaEMsWUFBTSxJQUQwQjtBQUVoQyxnQkFBVSxPQUFPLEVBQVAsQ0FBVTtBQUZZLEtBQWYsQ0FBbkI7O0FBS0EsUUFBSSxNQUFNLFNBQU4sS0FBb0IsUUFBeEIsRUFBa0M7QUFDaEMsaUJBQVcsWUFBWDtBQUNBLGFBRmdDLENBRXhCO0FBQ1Q7O0FBRUQsa0JBQWMsSUFBZCxDQUFtQixZQUFuQixFQWxCcUMsQ0FrQkg7QUFDbkM7O0FBRUQsTUFBSSxDQUFDLGNBQWMsTUFBbkIsRUFBMkI7QUFDekIsV0FEeUIsQ0FDakI7QUFDVDs7QUFFRCxnQkFBYyxPQUFkOztBQUVBLFdBQVMsYUFBVCxFQUF3QixFQUFFO0FBQ3hCLGNBQVUsYUFBYSxXQUFiLENBQXlCLFFBQXpCLEdBQW9DLEtBQXBDLEdBQTRDO0FBRGhDLEdBQXhCOztBQUlBO0FBQ0Q7O0FBRUQ7Ozs7Ozs7O0FBUUEsU0FBUyxRQUFULENBQWtCLEtBQWxCLEVBQXlCLElBQXpCLEVBQStCO0FBQzdCLFNBQU8sUUFBUSxFQUFmO0FBQ0EsT0FBSyxRQUFMLEdBQWdCLEtBQUssUUFBTCxJQUFpQixRQUFqQzs7QUFFQSxNQUFJLFlBQVksRUFBaEI7QUFBQSxNQUNJLFdBQVcsS0FBSyxRQUFMLEtBQWtCLEtBQWxCLEdBQ1AsWUFETyxDQUNNO0FBRE4sSUFFUCxXQUhSLENBSjZCLENBT1I7O0FBRXJCLE9BQUssSUFBSSxJQUFJLE1BQU0sTUFBTixHQUFlLENBQTVCLEVBQStCLEtBQUssQ0FBcEMsRUFBdUMsR0FBdkMsRUFBNEM7QUFDMUMsaUJBQWEsTUFBTSxDQUFOLENBQWI7QUFDRDs7QUFFRCxlQUFhLENBQWIsRUFBZ0Isa0JBQWhCLENBQW1DLFFBQW5DLEVBQTZDLFNBQTdDO0FBQ0E7QUFDRDs7QUFFRDs7OztBQUlBLFNBQVMsVUFBVCxDQUFvQixNQUFwQixFQUE0QjtBQUMxQixNQUFJLE9BQU8sUUFBUSxRQUFSLENBQWlCLHVCQUF1QixNQUF2QixHQUFnQyxJQUFqRCxDQUFYO0FBQ0EsT0FBSyxDQUFMLEVBQVEsTUFBUjtBQUNEOztBQUVEOzs7O0FBSUEsU0FBUyxVQUFULENBQW9CLE1BQXBCLEVBQTRCLFlBQTVCLEVBQTBDO0FBQ3hDLE1BQUksT0FBTyxRQUFRLFFBQVIsQ0FBaUIsdUJBQXVCLE1BQXZCLEdBQWdDLElBQWpELENBQVg7QUFDQSxPQUFLLENBQUwsRUFBUSxTQUFSLEdBQW9CLFlBQXBCO0FBQ0Q7O0FBRUQ7OztBQUdBLFNBQVMsZUFBVCxHQUEyQjtBQUN6QixNQUFJLFdBQVcsUUFBUSxRQUFSLENBQWlCLGFBQWpCLENBQWY7QUFDQSxPQUFLLElBQUksSUFBSSxTQUFTLE1BQVQsR0FBa0IsQ0FBL0IsRUFBa0MsS0FBSyxDQUF2QyxFQUEwQyxHQUExQyxFQUErQztBQUM3QyxhQUFTLENBQVQsRUFBWSxTQUFaLENBQXNCLE1BQXRCLENBQTZCLGFBQTdCO0FBQ0Q7QUFDRjs7QUFFRDs7OztBQUlBLFNBQVMsVUFBVCxHQUFzQjtBQUNwQixNQUFJLE9BQU8sT0FBWCxFQUFvQjtBQUNsQixZQUFRLE1BQVIsQ0FBZSxPQUFmO0FBQ0Q7O0FBRUQsTUFBSSxPQUFPLEtBQVgsRUFBa0I7QUFDaEIsVUFBTSxPQUFOLENBQWMsSUFBZDtBQUNEO0FBQ0Y7O0FBRUQsU0FBUyxtQkFBVCxHQUErQjtBQUM3QixNQUFJLGNBQWMsU0FBUyxhQUFULENBQXVCLGNBQXZCLENBQWxCO0FBQ0EsTUFBSSxXQUFXLEtBQWY7O0FBRUEsTUFBSSxXQUFKLEVBQWlCO0FBQ2YsZUFBVyxZQUFZLFNBQVosQ0FBc0IsTUFBdEIsQ0FBNkIsTUFBN0IsQ0FBWDtBQUNEOztBQUVELFNBQU8sQ0FBQyxRQUFSO0FBQ0Q7O0FBRUQ7Ozs7QUFJQSxTQUFTLGFBQVQsQ0FBdUIsSUFBdkIsRUFBNkI7QUFDM0IsTUFBSSxjQUFjLFNBQVMsZ0JBQVQsQ0FBMEIscUJBQTFCLENBQWxCOztBQUVBLGNBQVksT0FBWixDQUFvQixVQUFDLEVBQUQsRUFBUTtBQUMxQixRQUFJLGlCQUFpQixHQUFHLE9BQUgsQ0FBVyxjQUFYLENBQTBCLGVBQWUsSUFBekMsQ0FBckI7O0FBRUEsT0FBRyxTQUFILENBQWEsTUFBYixDQUFvQiw0QkFBcEIsRUFBa0QsY0FBbEQ7QUFDRCxHQUpEO0FBS0Q7O0FBRUQ7Ozs7QUFJQSxTQUFTLFlBQVQsQ0FBc0IsVUFBdEIsRUFBa0M7QUFDaEMsTUFBSSxvQkFBb0IsTUFBcEIsR0FBNkIsQ0FBakMsRUFBb0M7QUFDbEMsd0JBQW9CLENBQXBCLEVBQXVCLFNBQXZCLENBQWlDLE1BQWpDLENBQ0UsV0FERixFQUNlLFVBRGY7QUFFRDtBQUNGOztBQUVEOzs7O0FBSUEsU0FBUyxnQkFBVCxHQUE0QjtBQUMxQixNQUFJLFlBQVksUUFBUSxRQUFSLENBQWlCLGNBQWpCLENBQWhCO0FBQ0EsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFVBQVUsTUFBOUIsRUFBc0MsR0FBdEMsRUFBMkM7QUFDekMsUUFBSSxPQUFPLFVBQVUsQ0FBVixDQUFYO0FBQUEsUUFDSSxZQUFZLEtBQUssT0FBTCxDQUFhLFdBRDdCO0FBRUEsU0FBSyxXQUFMLEdBQW1CLFFBQVEsZ0JBQVIsQ0FBeUIsU0FBekIsQ0FBbkI7QUFDRDtBQUNELFNBQU8sSUFBUDtBQUNEOztBQUVELFNBQVMscUJBQVQsR0FBaUM7QUFDL0IsTUFBSSxjQUFjLFNBQVMsYUFBVCxDQUF1QixrQkFBdkIsQ0FBbEI7O0FBRUEsY0FBWSxTQUFaLENBQXNCLE1BQXRCLENBQTZCLE1BQTdCOztBQUVBLGFBQVcsWUFBTTtBQUNmLGdCQUFZLFNBQVosQ0FBc0IsTUFBdEIsQ0FBNkIsTUFBN0I7QUFDRCxHQUZELEVBRUcsSUFGSDtBQUdEOztBQUVELFNBQVMsc0JBQVQsR0FBa0M7QUFDaEMsTUFBSSxhQUFhLFNBQVMsZ0JBQVQsQ0FBMEIsV0FBMUIsQ0FBakI7O0FBRUEsTUFBSSxVQUFKLEVBQWdCO0FBQ2QsZUFBVyxPQUFYLENBQW1CLFVBQUMsU0FBRDtBQUFBLGFBQWUsVUFBVSxNQUFWLEVBQWY7QUFBQSxLQUFuQjtBQUNEO0FBQ0Y7O0FBRUQsU0FBUyx3QkFBVCxDQUFrQyxNQUFsQyxFQUEwQztBQUN4QyxNQUFJLE1BQU0sT0FBTixDQUFjLE1BQWQsQ0FBSixFQUEyQjtBQUN6QixXQUFPLE9BQVAsQ0FBZSxVQUFDLEtBQUQsRUFBVztBQUN4QixVQUFJLFVBQVUsU0FBUyxhQUFULENBQXVCLE1BQU0sRUFBN0IsQ0FBZDs7QUFFQSxVQUFJLE9BQUosRUFBYTtBQUNYLGdCQUFRLGtCQUFSLENBQ0UsVUFERiwwQkFFd0IsTUFBTSxHQUY5QjtBQUlEO0FBQ0YsS0FURDtBQVVEO0FBQ0Y7O0FBRUQsU0FBUyxlQUFULEdBQTJCO0FBQ3pCLE1BQU0sWUFBWSxJQUFJLFNBQUosRUFBbEI7QUFDQSxNQUFNLGtCQUFrQixTQUFTLGdCQUFULENBQTBCLHVCQUExQixDQUF4Qjs7QUFFQSxNQUFJLGVBQUosRUFBcUI7QUFDbkIsb0JBQWdCLE9BQWhCLENBQXdCLFVBQUMsS0FBRCxFQUFXO0FBQ2pDLFlBQU0sZ0JBQU4sQ0FBdUIsT0FBdkIsRUFBZ0MsVUFBVSxLQUExQztBQUNELEtBRkQ7QUFHRDtBQUNGOztBQUVELE9BQU8sT0FBUCxHQUFpQjtBQUNmLFlBQVUsUUFESztBQUVmLGNBQVksVUFGRztBQUdmLG1CQUFpQixlQUhGO0FBSWYsa0JBQWdCLGNBSkQ7QUFLZixlQUFhLFdBTEU7QUFNZixjQUFZLFVBTkc7QUFPZixvQkFBa0IsZ0JBUEg7QUFRZixnQkFBYyxZQVJDO0FBU2YsaUJBQWUsYUFUQTtBQVVmLHVCQUFxQixtQkFWTjtBQVdmLHlCQUF1QixxQkFYUjtBQVlmLDRCQUEwQix3QkFaWDtBQWFmLDBCQUF3QixzQkFiVDtBQWNmLG1CQUFpQjtBQWRGLENBQWpCOzs7QUMvT0E7Ozs7QUFJQTs7QUFFQSxJQUFJLFVBQVUsUUFBUSxXQUFSLENBQWQ7QUFBQSxJQUNJLE9BQU8sUUFBUSxRQUFSLENBRFg7O0FBR0EsSUFBTSxzQkFBeUIsR0FBRyxRQUE1QixxQkFBTjtBQUNBLElBQU0sc0JBQXlCLEdBQUcsUUFBNUIsd0JBQU47O0FBRUEsSUFBSSxXQUFXLEdBQUcsUUFBSCxHQUFjLG1CQUFkLEdBQW9DLEdBQUcsSUFBSCxDQUFRLEdBQTVDLEdBQWtELFFBQWpFO0FBQUEsSUFDSSxXQUFXLEdBQUcsUUFEbEI7QUFBQSxJQUVJLEtBQUssRUFGVDs7QUFJQTs7OztBQUlBLFNBQVMsVUFBVCxDQUFvQixLQUFwQixFQUEyQjtBQUN6QixTQUFPO0FBQ0wsWUFBUSxJQUFJLEtBQUosQ0FBVSxLQUFWLEtBQW9CLENBRHZCO0FBRUwsaUJBQWEsQ0FGUjtBQUdMLGdCQUFZO0FBSFAsR0FBUDtBQUtEOztBQUVELEdBQUcsV0FBSCxHQUFpQixVQUFDLElBQUQsRUFBTyxPQUFQLEVBQW1CO0FBQ2xDLE1BQUksU0FBUyxFQUFiOztBQUVBLE1BQUksQ0FBQyxJQUFMLEVBQVc7QUFDVCxXQUFPLElBQVAsQ0FBWSxFQUFDLElBQUksZUFBTCxFQUFzQixLQUFLLGNBQTNCLEVBQVo7QUFDRDs7QUFFRCxNQUFJLENBQUMsT0FBTCxFQUFjO0FBQ1osV0FBTyxJQUFQLENBQVksRUFBQyxJQUFJLGtCQUFMLEVBQXlCLEtBQUssaUJBQTlCLEVBQVo7QUFDRDs7QUFFRCxNQUFJLE9BQU8sTUFBUCxHQUFnQixDQUFwQixFQUF1QjtBQUNyQixXQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVY7QUFBQSxhQUFxQixPQUFPLE1BQVAsQ0FBckI7QUFBQSxLQUFaLENBQVA7QUFDRDs7QUFFRCxTQUFPLFFBQ0osSUFESSxDQUNDLG1CQURELEVBQ3NCO0FBQ3pCLGVBQVcsU0FEYztBQUV6QixpQkFBYSxHQUFHLElBQUgsQ0FBUSxHQUZJO0FBR3pCLGVBQVcsSUFIYztBQUl6QixVQUFNO0FBSm1CLEdBRHRCLEVBT0osSUFQSSxDQU9DLFVBQUMsSUFBRDtBQUFBLFdBQVUsUUFBUSxJQUFSLENBQWEsbUJBQWIsRUFBa0M7QUFDaEQsbUJBQWEsU0FEbUM7QUFFaEQsbUJBQWEsR0FBRyxJQUFILENBQVEsR0FGMkI7QUFHaEQsY0FBUSxDQUFDO0FBQ1AsWUFBSSxNQURHO0FBRVAsY0FBTSxDQUFDLEVBQUMsT0FBTyxNQUFSLEVBQUQsQ0FGQztBQUdQLGNBQU07QUFIQyxPQUFELEVBSU47QUFDQSxZQUFJLE1BREo7QUFFQSxjQUFNLENBQUMsRUFBQyxVQUFVLEtBQUssR0FBaEIsRUFBRCxDQUZOO0FBR0EsY0FBTSxjQUhOLEVBSk07QUFId0MsS0FBbEMsQ0FBVjtBQUFBLEdBUEQsQ0FBUDtBQW9CRTtBQUNBO0FBQ0E7QUFDSCxDQXRDRDs7QUF3Q0E7Ozs7Ozs7QUFPQSxHQUFHLFFBQUgsR0FBYyxVQUFTLElBQVQsRUFBZTtBQUMzQixNQUFJLE9BQU8sSUFBWDs7QUFFQSxNQUFJLFVBQVUsS0FBSyxRQUFMLENBQWM7QUFDMUIsVUFBTSxLQUFLLElBQUwsSUFBYSxLQUFLLFFBQUwsQ0FBYyxTQURQO0FBRTFCLG9CQUFnQixTQUFTLEtBQUssY0FGSjtBQUcxQixjQUFVLEtBQUssUUFBTCxHQUNOLEtBQUssUUFEQyxHQUVOO0FBTHNCLEdBQWQsQ0FBZDs7QUFRQSxNQUFJLE9BQU8sS0FBSyxRQUFMLEdBQWdCLENBQWhCLEdBQW9CLEtBQUssSUFBcEM7QUFDQSxNQUFJLEtBQUssa0JBQWtCLFNBQVMsWUFBM0IsR0FBMEMsUUFBMUMsR0FBcUQsSUFBckQsR0FBNEQsVUFBckU7QUFBQSxNQUNJLFdBQVcsV0FBVyxFQUFYLEdBQWdCLE9BRC9COztBQUdBLFNBQU8sUUFBUSxPQUFSLENBQWdCLFFBQWhCLEVBQ0osSUFESSxDQUNDLFVBQUMsS0FBRCxFQUFXO0FBQ2YsU0FBSyxlQUFMLENBQXFCLEtBQXJCLEVBQTRCLElBQTVCO0FBQ0EsVUFBTSxXQUFOLEdBQW9CLElBQXBCO0FBQ0EsV0FBTyxLQUFQO0FBQ0QsR0FMSSxFQU1KLEtBTkksQ0FNRSxVQUFDLEdBQUQsRUFBUztBQUNkLFlBQVEsS0FBUixDQUFjLEdBQWQ7QUFDRCxHQVJJLENBQVA7QUFTRCxDQXhCRDs7QUEwQkE7Ozs7O0FBS0EsR0FBRyxhQUFILEdBQW1CLFVBQVMsSUFBVCxFQUFlO0FBQ2hDLFNBQU8sUUFBUSxFQUFmO0FBQ0EsT0FBSyxJQUFMLEdBQVksRUFBRSxLQUFLLEVBQUwsQ0FBUSxXQUF0QjtBQUNBLE9BQUssSUFBTCxHQUFZLEtBQUssUUFBTCxDQUFjLFNBQTFCO0FBQ0EsU0FBTyxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQVA7QUFDRCxDQUxEOztBQU9BOzs7OztBQUtBLEdBQUcsU0FBSCxHQUFlLFVBQVMsSUFBVCxFQUFlO0FBQzVCLFNBQU8sUUFBUSxFQUFmO0FBQ0EsT0FBSyxRQUFMLEdBQWdCLEtBQUssRUFBTCxDQUFRLFlBQXhCO0FBQ0EsU0FBTyxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQVA7QUFDRCxDQUpEOztBQU1BOzs7O0FBSUEsR0FBRyxlQUFILEdBQXFCLFVBQVMsWUFBVCxFQUF1QixJQUF2QixFQUE2QjtBQUNoRCxNQUFJLE9BQU8sSUFBWDs7QUFFQSxNQUFJLENBQUMsS0FBSyxRQUFOLElBQWtCLEtBQUssSUFBTCxLQUFjLEtBQUssUUFBTCxDQUFjLFNBQWxELEVBQTZEO0FBQUU7QUFDN0QsU0FBSyxZQUFMLENBQWtCLEtBQUssYUFBTCxDQUFtQixZQUFuQixDQUFsQixFQUQyRCxDQUNOO0FBQ3RELEdBRkQsTUFFTztBQUFFO0FBQ1AsUUFBSSxDQUFDLGFBQWEsTUFBYixDQUFvQixNQUF6QixFQUFpQztBQUMvQjtBQUNEOztBQUVELFNBQUssRUFBTCxDQUFRLFlBQVIsR0FBdUIsS0FBSyxlQUFMLENBQXFCLFlBQXJCLENBQXZCO0FBQ0Q7O0FBRUQsTUFBSSxLQUFLLElBQUwsS0FBYyxLQUFLLFFBQUwsQ0FBYyxTQUFoQyxFQUEyQztBQUN6QyxTQUFLLEVBQUwsR0FBVSxZQUFWO0FBQ0EsU0FBSyxZQUFMLENBQWtCLEtBQWxCO0FBQ0EsV0FBTyxNQUFQLENBQWMsS0FBSyxFQUFuQixFQUF1QixZQUF2QjtBQUNELEdBSkQsTUFJTztBQUNMLFNBQUssRUFBTCxDQUFRLE1BQVIsQ0FBZSxJQUFmLENBQW9CLEtBQXBCLENBQTBCLEtBQUssRUFBTCxDQUFRLE1BQWxDLEVBQTBDLGFBQWEsTUFBdkQ7QUFDRDs7QUFFRCxPQUFLLFFBQUwsQ0FBYyxTQUFkLEdBQTBCLEtBQUssSUFBL0I7QUFDQSxTQUFPLFlBQVA7QUFDRCxDQXZCRDs7QUF5QkE7Ozs7O0FBS0EsR0FBRyxlQUFILEdBQXFCLFVBQVMsWUFBVCxFQUF1QjtBQUMxQyxNQUFJLGFBQWEsYUFBYSxNQUFiLENBQW9CLEdBQXBCLENBQXdCLFVBQUMsSUFBRDtBQUFBLFdBQVUsSUFBSSxJQUFKLENBQVMsS0FBSyxRQUFkLENBQVY7QUFBQSxHQUF4QixDQUFqQjs7QUFFQSxNQUFJLFNBQVMsSUFBSSxJQUFKLENBQVMsS0FBSyxHQUFMLENBQVMsS0FBVCxDQUFlLElBQWYsRUFBcUIsVUFBckIsQ0FBVCxDQUFiO0FBQ0EsU0FBTyxPQUFPLFdBQVAsRUFBUCxDQUowQyxDQUliO0FBQzlCLENBTEQ7O0FBT0E7Ozs7O0FBS0EsR0FBRyxhQUFILEdBQW1CLFVBQVMsWUFBVCxFQUF1QjtBQUN4QyxNQUFJLGNBQWMsS0FBSyxFQUFMLENBQVEsTUFBUixDQUFlLE1BQWYsR0FBd0IsU0FBUyxZQUFuRDtBQUNBLFNBQU8sYUFBYSxLQUFiLENBQW1CLEtBQW5CLElBQTRCLFdBQW5DO0FBQ0QsQ0FIRDs7QUFLQTs7O0FBR0EsR0FBRyxJQUFILEdBQVUsWUFBVztBQUNuQixPQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxPQUFLLEVBQUwsR0FBVSxXQUFXLFNBQVMsWUFBcEIsQ0FBVjtBQUNBLE9BQUssRUFBTCxDQUFRLFlBQVIsR0FBdUIsSUFBSSxJQUFKLEdBQVcsV0FBWCxFQUF2QjtBQUNBLE9BQUssRUFBTCxDQUFRLGVBQVIsR0FBMEIsSUFBSSxJQUFKLEdBQVcsV0FBWCxFQUExQjtBQUNBLFNBQU8sS0FBSyxFQUFMLENBQVEsWUFBZjtBQUNELENBTkQ7O0FBUUE7Ozs7Ozs7OztBQVNBLEdBQUcsUUFBSCxHQUFjLFVBQVMsSUFBVCxFQUFlO0FBQzNCLE1BQUksUUFBUTtBQUNWLGFBQVM7QUFDUCxrQkFBWTtBQUNWLGtCQUFVO0FBQ1IsaUJBQU8sQ0FDTCxFQUFDLFFBQVEsRUFBQyxVQUFVLEtBQVgsRUFBVCxFQURLLEVBRUwsRUFBQyxRQUFRLEVBQUMsZUFBZSxNQUFoQixFQUFULEVBRkssRUFHTCxFQUFDLE9BQU8sRUFBQyxRQUFRLEVBQUMsV0FBVyxJQUFaLEVBQVQsRUFBUixFQUhLLEVBSUwsRUFBQyxTQUFTLEVBQUMsWUFBWSxFQUFDLE1BQU0sS0FBSyxFQUFMLENBQVEsZUFBZixFQUFiLEVBQVYsRUFKSztBQURDO0FBREE7QUFETCxLQURDO0FBYVYsWUFBUSxDQUNOO0FBQ0Usa0JBQVksRUFBQyxTQUFTLE1BQVY7QUFEZCxLQURNO0FBYkUsR0FBWjs7QUFvQkEsTUFBSSxLQUFLLFFBQVQsRUFBbUI7QUFDakIsVUFBTSxLQUFOLENBQVksUUFBWixDQUFxQixNQUFyQixDQUE0QixHQUE1QixDQUFnQyxDQUFoQyxFQUFtQyxLQUFuQyxDQUF5QyxRQUF6QyxHQUFvRDtBQUNsRCxZQUFNLEtBQUs7QUFEdUMsS0FBcEQ7QUFHRDs7QUFFRCxNQUFJLEtBQUssY0FBTCxLQUF3QixJQUE1QixFQUFrQztBQUNoQyxVQUFNLEtBQU4sQ0FBWSxRQUFaLENBQXFCLE1BQXJCLENBQTRCLEdBQTVCLENBQWdDLElBQWhDLENBQXFDO0FBQ25DLFlBQU0sRUFBQyxXQUFXLElBQVo7QUFENkIsS0FBckM7QUFHRDs7QUFFRCxNQUFJLEtBQUssSUFBTCxLQUFjLFdBQWxCLEVBQStCO0FBQzdCLFVBQU0sSUFBTixDQUFXLENBQVgsRUFBYyxRQUFkLENBQXVCLEtBQXZCLEdBQStCLEtBQS9CO0FBQ0QsR0FGRCxNQUVPLElBQUksS0FBSyxJQUFMLEtBQWMsV0FBbEIsRUFBK0I7QUFDcEMsVUFBTSxJQUFOLEdBQWEsQ0FDWDtBQUNFLGFBQU87QUFDTCxlQUFPLE1BREY7QUFFTCxpQkFBUyxPQUZKO0FBR0wsdUJBQWU7QUFIVjtBQURULEtBRFcsQ0FBYjtBQVNEOztBQUVEO0FBQ0EsTUFBSSxDQUFDLFdBQUQsRUFBYyxZQUFkLEVBQTRCLFdBQTVCLEVBQXlDLE9BQXpDLENBQWlELEtBQUssSUFBdEQsQ0FBSixFQUFpRTtBQUMvRCxVQUFNLEtBQU4sQ0FBWSxRQUFaLENBQXFCLE1BQXJCLENBQTRCLEdBQTVCLENBQWdDLE9BQWhDLENBQXdDLFVBQUMsSUFBRCxFQUFPLEtBQVAsRUFBaUI7QUFDdkQsVUFBSSxLQUFLLGNBQUwsQ0FBb0IsT0FBcEIsQ0FBSixFQUFrQztBQUNoQyxjQUFNLEtBQU4sQ0FBWSxRQUFaLENBQXFCLE1BQXJCLENBQTRCLEdBQTVCLENBQWdDLE1BQWhDLENBQXVDLEtBQXZDLEVBQThDLENBQTlDO0FBQ0Q7QUFDRixLQUpEO0FBS0Q7O0FBRUQsU0FBTyxVQUFVLEtBQUssU0FBTCxDQUFlLEtBQWYsQ0FBVixDQUFQO0FBQ0QsQ0F6REQ7O0FBMkRBLE9BQU8sT0FBUCxHQUFpQixFQUFqQjs7O0FDOVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvMklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcm9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gUHJlcmVuZGVyIGZ1bmN0aW9uc1xudmFyIHRoZW1lID0gcmVxdWlyZSgnLi90aGVtZScpO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICB0aGVtZS5pbml0KCk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSB7fTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdmlldyA9IHJlcXVpcmUoJy4vdmlldycpXG4gICwgdmlld21vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWwnKVxuICAsIGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcblxuLyoqXG4gKiBDb250YWlucyBhIG1hcHBpbmcgb2YgZWxlbWVudCBkYXRhLXNlbGVjdG9ycyBhbmQgY2xpY2sgaGFuZGxlcnNcbiAqIGJ1dHRvbnMuYXR0YWNoIHtmdW5jdGlvbn0gLSByZWdpc3RlcnMgaGFuZGxlcnMgZm91bmQgaW4gaGFuZGxlcnMgb2JqZWN0XG4gKi9cblxuY29uc3Qgc2VuZENvbW1lbnQgPSAoZSkgPT4ge1xuICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgbGV0IG5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29tbWVudC1uYW1lJykudmFsdWU7XG4gIGxldCBjb21tZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvbW1lbnQtY29udGVudCcpLnZhbHVlO1xuXG4gIHZpZXcuY2xlYXJDb21tZW50Rm9ybUVycm9ycygpO1xuXG4gIHJldHVybiB2aWV3bW9kZWwuc2VuZENvbW1lbnQobmFtZSwgY29tbWVudClcbiAgICAudGhlbih2aWV3LnRvZ2dsZUNvbW1lbnREaWFsb2cpXG4gICAgLnRoZW4oKCkgPT4gZG9jdW1lbnRcbiAgICAgICAgLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0uY29tbWVudCcpXG4gICAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBzZW5kQ29tbWVudClcbiAgICApXG4gICAgLnRoZW4odmlldy5zaG93U3VjY2Vzc0NvbW1lbnRNc2cpXG4gICAgLmNhdGNoKHZpZXcuZGlzcGxheUNvbW1lbnRGb3JtRXJyb3JzKTtcbn07XG5cbnZhciBidXR0b25zID0ge1xuICBoYW5kbGVyczoge1xuICAgIFwiW2RhdGEtanMtbG9hZG1vcmVdXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHNQYWdlKClcbiAgICAgICAgLnRoZW4odmlldy5yZW5kZXJQb3N0cylcbiAgICAgICAgLnRoZW4odmlldy5kaXNwbGF5TmV3UG9zdHMpXG4gICAgICAgIC5jYXRjaChjYXRjaEVycm9yKTtcbiAgICB9LFxuXG4gICAgXCJbZGF0YS1qcy1vcmRlcmJ5X2FzY2VuZGluZ11cIjogKCkgPT4ge1xuICAgICAgdmlld21vZGVsLmxvYWRQb3N0cyh7c29ydDogJ2FzY2VuZGluZyd9KVxuICAgICAgICAudGhlbih2aWV3LnJlbmRlclRpbWVsaW5lKVxuICAgICAgICAudGhlbih2aWV3LmRpc3BsYXlOZXdQb3N0cylcbiAgICAgICAgLnRoZW4odmlldy50b2dnbGVTb3J0QnRuKCdhc2NlbmRpbmcnKSlcbiAgICAgICAgLmNhdGNoKGNhdGNoRXJyb3IpO1xuICAgIH0sXG5cbiAgICBcIltkYXRhLWpzLW9yZGVyYnlfZGVzY2VuZGluZ11cIjogKCkgPT4ge1xuICAgICAgdmlld21vZGVsLmxvYWRQb3N0cyh7c29ydDogJ2Rlc2NlbmRpbmcnfSlcbiAgICAgICAgLnRoZW4odmlldy5yZW5kZXJUaW1lbGluZSlcbiAgICAgICAgLnRoZW4odmlldy5kaXNwbGF5TmV3UG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcudG9nZ2xlU29ydEJ0bignZGVzY2VuZGluZycpKVxuICAgICAgICAuY2F0Y2goY2F0Y2hFcnJvcik7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtb3JkZXJieV9lZGl0b3JpYWxdXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHMoe3NvcnQ6ICdlZGl0b3JpYWwnfSlcbiAgICAgICAgLnRoZW4odmlldy5yZW5kZXJUaW1lbGluZSlcbiAgICAgICAgLnRoZW4odmlldy5kaXNwbGF5TmV3UG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcudG9nZ2xlU29ydEJ0bignZWRpdG9yaWFsJykpXG4gICAgICAgIC5jYXRjaChjYXRjaEVycm9yKTtcbiAgICB9LFxuXG4gICAgXCJbZGF0YS1qcy1zaG93LWNvbW1lbnQtZGlhbG9nXVwiOiAoKSA9PiB7XG4gICAgICBsZXQgaXNWaXNpYmxlID0gdmlldy50b2dnbGVDb21tZW50RGlhbG9nKCk7XG4gICAgICBsZXQgY29tbWVudEZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdmb3JtLmNvbW1lbnQnKTtcblxuICAgICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgICBjb21tZW50Rm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBzZW5kQ29tbWVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21tZW50Rm9ybS5yZW1vdmVFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBzZW5kQ29tbWVudCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgICdbZGF0YS1qcy1jbG9zZS1jb21tZW50LWRpYWxvZ10nOiAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmlldy50b2dnbGVDb21tZW50RGlhbG9nKCk7XG4gICAgfVxuICB9LFxuXG4gIGF0dGFjaDogZnVuY3Rpb24oKSB7XG4gICAgT2JqZWN0LmtleXMoYnV0dG9ucy5oYW5kbGVycykuZm9yRWFjaCgoaGFuZGxlcikgPT4ge1xuICAgICAgbGV0IGVsID0gaGVscGVycy5nZXRFbGVtcyhoYW5kbGVyKVswXTtcblxuICAgICAgaWYgKCFlbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYnV0dG9ucy5oYW5kbGVyc1toYW5kbGVyXSwgZmFsc2UpO1xuICAgIH0pO1xuXG4gICAgdmlldy5hdHRhY2hTbGlkZXNob3coKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY2F0Y2hFcnJvcihlcnIpIHtcbiAgY29uc29sZS5lcnJvcihcIkhhbmRsZXIgZXJyb3I6IFwiLCBlcnIpO1xufVxuXG52YXIgZXZlbnRzID0ge1xuICBhdHRhY2g6IGZ1bmN0aW9uKCkge30gLy8gdG9kb1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJ1dHRvbnM6IGJ1dHRvbnMsXG4gIGV2ZW50czogZXZlbnRzXG59O1xuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcbiAgc2V0dGluZ3MgPSB3aW5kb3cuTEIuc2V0dGluZ3M7XG5cbmZ1bmN0aW9uIGNvbnZlcnRUaW1lc3RhbXAodGltZXN0YW1wKSB7XG4gIGlmICghc2V0dGluZ3MuZGF0ZXRpbWVGb3JtYXQgfHwgc2V0dGluZ3MuZGF0ZXRpbWVGb3JtYXQgPT09ICd0aW1lQWdvJykge1xuICAgIHJldHVybiBtb21lbnQodGltZXN0YW1wKS5mcm9tTm93KCk7XG4gIH1cbiAgcmV0dXJuIG1vbWVudCh0aW1lc3RhbXApLmZvcm1hdChzZXR0aW5ncy5kYXRldGltZUZvcm1hdCk7XG59XG5cbi8qKlxuICogV3JhcCBlbGVtZW50IHNlbGVjdG9yIGFwaVxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IC0gYSBqUXVlcnkgc3ludGF4IERPTSBxdWVyeSAod2l0aCBkb3RzKVxuICovXG5mdW5jdGlvbiBnZXRFbGVtcyhxdWVyeSkge1xuICB2YXIgaXNEYXRhQXR0ciA9IHF1ZXJ5LmluZGV4T2YoXCJkYXRhLVwiKSA+IC0xO1xuICByZXR1cm4gaXNEYXRhQXR0clxuICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxdWVyeSlcbiAgICA6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUocXVlcnkpO1xufVxuXG4vKipcbiAqIGpRdWVyeSdzICQuZ2V0SlNPTiBpbiBhIG51dHNoZWxsXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gYSByZXF1ZXN0IFVSTFxuICovXG5mdW5jdGlvbiBnZXRKU09OKHVybCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlamVjdCh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgeGhyLnNlbmQoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3QodXJsLCBkYXRhKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ1BPU1QnLCB1cmwpO1xuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAxKSB7XG4gICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWplY3QoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgfSk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldEVsZW1zOiBnZXRFbGVtcyxcbiAgZ2V0SlNPTjogZ2V0SlNPTixcbiAgcG9zdDogcG9zdCxcbiAgY29udmVydFRpbWVzdGFtcDogY29udmVydFRpbWVzdGFtcFxufTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBoYW5kbGVycyA9IHJlcXVpcmUoJy4vaGFuZGxlcnMnKSxcbiAgdmlld21vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWwnKSxcbiAgdmlldyA9IHJlcXVpcmUoJy4vdmlldycpLFxuICBwYWdldmlldyA9IHJlcXVpcmUoJy4vcGFnZXZpZXcnKSxcbiAgbG9jYWxBbmFseXRpY3MgPSByZXF1aXJlKCcuL2xvY2FsLWFuYWx5dGljcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLyoqXG4gICAqIE9uIGRvY3VtZW50IGxvYWRlZCwgZG8gdGhlIGZvbGxvd2luZzpcbiAgICovXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIGhhbmRsZXJzLmJ1dHRvbnMuYXR0YWNoKCk7IC8vIFJlZ2lzdGVyIEJ1dHRvbnMgSGFuZGxlcnNcbiAgICBoYW5kbGVycy5ldmVudHMuYXR0YWNoKCk7IC8vIFJlZ2lzdGVyIEV2ZW50LCBNZXNzYWdlIEhhbmRsZXJzXG4gICAgdmlld21vZGVsLmluaXQoKTtcbiAgICBsb2NhbEFuYWx5dGljcy5oaXQoKTtcbiAgICBwYWdldmlldy5pbml0KCk7XG5cbiAgICB2aWV3LnVwZGF0ZVRpbWVzdGFtcHMoKTtcbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB2aWV3LnVwZGF0ZVRpbWVzdGFtcHMoKTsgLy8gQ29udmVydCBJU08gZGF0ZXMgdG8gdGltZWFnb1xuICAgIH0sIDEwMDApO1xuICB9XG59O1xuIiwidmFyIGFwaUhvc3QgPSB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ0xCJykgPyB3aW5kb3cuTEIuYXBpX2hvc3QucmVwbGFjZSgvXFwvJC8sICcnKSA6ICcnO1xudmFyIGNvbnRleHRVcmwgPSBkb2N1bWVudC5yZWZlcnJlcjtcbnZhciBibG9nSWQgPSB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ0xCJykgPyB3aW5kb3cuTEIuYmxvZy5faWQgOiAnJztcblxuYXBpSG9zdCArPSAnL2FwaS9hbmFseXRpY3MvaGl0JztcblxudmFyIGNyZWF0ZUNvb2tpZSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBkYXlzKSB7XG4gIHZhciBleHBpcmVzID0gJycsIGRhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gIGlmIChkYXlzKSB7XG4gICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApO1xuICAgIGV4cGlyZXMgPSBgOyBleHBpcmVzPSR7ZGF0ZS50b1VUQ1N0cmluZygpfWA7XG4gIH1cbiAgZG9jdW1lbnQuY29va2llID0gYCR7bmFtZX09JHt2YWx1ZX0ke2V4cGlyZXN9OyBwYXRoPS9gO1xufTtcblxudmFyIHJlYWRDb29raWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBuYW1lRVEgPSBuYW1lICsgJz0nO1xuICB2YXIgY2EgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGMgPSBjYVtpXTtcblxuICAgIHdoaWxlIChjLmNoYXJBdCgwKSA9PT0gJyAnKSB7XG4gICAgICBjID0gYy5zdWJzdHJpbmcoMSwgYy5sZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChjLmluZGV4T2YobmFtZUVRKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIGMuc3Vic3RyaW5nKG5hbWVFUS5sZW5ndGgsIGMubGVuZ3RoKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG52YXIgaGl0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciB4bWxodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gIHZhciBqc29uRGF0YSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICBjb250ZXh0X3VybDogY29udGV4dFVybCxcbiAgICBibG9nX2lkOiBibG9nSWRcbiAgfSk7XG5cbiAgeG1saHR0cC5vcGVuKCdQT1NUJywgYXBpSG9zdCk7XG4gIHhtbGh0dHAuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblxuICB4bWxodHRwLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh4bWxodHRwLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICBjcmVhdGVDb29raWUoJ2hpdCcsIGpzb25EYXRhLCAyKTtcbiAgICB9XG4gIH07XG5cbiAgeG1saHR0cC5zZW5kKGpzb25EYXRhKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge2hpdDogKCkgPT4ge1xuICBpZiAoIXJlYWRDb29raWUoJ2hpdCcpKSB7XG4gICAgaGl0KCk7XG4gIH1cbn19O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKlxuICBTZW5kIHBhZ2V2aWV3IHNpZ25hbCB0byBhbmFseXRpY3MgcHJvdmlkZXJzXG4gIElWVyBhbmQgR29vZ2xlIEFuYWx5dGljcy4gTm90IHRvIGJlIHRpZWQgdG8gYW5ndWxhciBhcHAuXG4qL1xuXG52YXIgc2VuZFBhZ2V2aWV3ID0ge1xuICBfZm91bmRQcm92aWRlcnM6IFtdLCAvLyBDYWNoZSBhZnRlciBmaXJzdCBsb29rdXBcblxuICBfc2VuZElWVzogZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF3aW5kb3cuaW9tKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGlhbV9kYXRhID0ge1xuICAgICAgXCJzdFwiOiB3aW5kb3cuX2lmcmFtZURhdGFzZXQuc3ptU3QsIC8vIElEXG4gICAgICBcImNwXCI6IHdpbmRvdy5faWZyYW1lRGF0YXNldC5zem1DcCwgLy8gQ29kZVxuICAgICAgXCJjb1wiOiB3aW5kb3cuX2lmcmFtZURhdGFzZXQuc3ptQ28sIC8vIENvbW1lbnRcbiAgICAgIFwic3ZcIjogXCJrZVwiIC8vIERpc2FibGUgUSZBIGludml0ZVxuICAgIH07XG5cbiAgICB3aW5kb3cuaW9tLmMoaWFtX2RhdGEsIDEpOyAvLyB3aGVyZSdzIHRoZSAuaD8gYWhhaGFoYVxuICB9LFxuXG4gIF9zZW5kR0E6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh3aW5kb3cuZ2EubGVuZ3RoID4gMCkge1xuICAgICAgd2luZG93LmdhKCdjcmVhdGUnLCB3aW5kb3cuX2lmcmFtZURhdGFzZXQuZ2FQcm9wZXJ0eSwgJ2F1dG8nKTtcbiAgICAgIHdpbmRvdy5nYSgnc2V0JywgJ2Fub255bWl6ZUlwJywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgaWYgKHdpbmRvdy5nYS5sb2FkZWQpIHtcbiAgICAgIHdpbmRvdy5nYSgnc2VuZCcsIHtcbiAgICAgICAgaGl0VHlwZTogJ3BhZ2V2aWV3JyxcbiAgICAgICAgbG9jYXRpb246IHdpbmRvdy5kb2N1bWVudC5yZWZlcnJlciwgLy8gc2V0IHRvIHBhcmVudCB1cmxcbiAgICAgICAgaGl0Q2FsbGJhY2s6IGZ1bmN0aW9uKCkge31cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBfaW5zZXJ0U2NyaXB0OiBmdW5jdGlvbihzcmMsIGNiKSB7XG4gICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpOyBzY3JpcHQuc3JjID0gc3JjO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYm9keVwiKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgIHNjcmlwdC5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBjYik7XG4gIH0sXG5cbiAgX2dldFByb3ZpZGVyczogZnVuY3Rpb24oKSB7XG4gICAgbGV0IGZvdW5kUHJvdmlkZXJzID0gW107XG5cbiAgICBpZiAodGhpcy5fZm91bmRQcm92aWRlcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZm91bmRQcm92aWRlcnM7IC8vIHJldHVybiBlYXJseVxuICAgIH1cblxuICAgIGZvciAodmFyIHAgaW4gdGhpcy5fcHJvdmlkZXJzKSB7XG4gICAgICB2YXIgcHJvdmlkZXIgPSB0aGlzLl9wcm92aWRlcnNbcF07XG4gICAgICB2YXIga2V5c2ZvdW5kID0gcHJvdmlkZXIucmVxdWlyZWREYXRhLnJlZHVjZSgocHJldiwgY3VycikgPT5cbiAgICAgICAgd2luZG93Ll9pZnJhbWVEYXRhc2V0Lmhhc093blByb3BlcnR5KGN1cnIpXG4gICAgICAsIHRydWUpOyAvLyBuZWVkcyBpbml0aWFsIHZhbHVlIGZvciBvbmUgZWxlbWVudFxuXG4gICAgICBpZiAoa2V5c2ZvdW5kID09PSB0cnVlKSB7IC8vIGFsbCByZXF1aXJlZCBhdHRycyBmb3VuZFxuICAgICAgICBpZiAoIXByb3ZpZGVyLm9iamVjdCkge1xuICAgICAgICAgIHRoaXMuX2luc2VydFNjcmlwdChwcm92aWRlci5zY3JpcHRVUkwsIHByb3ZpZGVyLnNlbmQpOyAvLyBub3QgeWV0IGxvYWRlZFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvdW5kUHJvdmlkZXJzLnB1c2gocHJvdmlkZXIuc2VuZCk7IC8vIGxpc3Qgb2YgX3NlbmQgZnVuY3NcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHBhcmVudC5fZm91bmRQcm92aWRlcnMgPSBmb3VuZFByb3ZpZGVyczsgLy8gY2FjaGUgYWZ0ZXIgaW5pdGlhbFxuICAgIHJldHVybiBmb3VuZFByb3ZpZGVycztcbiAgfSxcblxuICBzZW5kOiBmdW5jdGlvbigpIHsgLy8gcHVibGljLCBpbnZva2Ugdy9vIHBhcmFtc1xuICAgIGlmICghd2luZG93Lmhhc093blByb3BlcnR5KCdfaWZyYW1lRGF0YXNldCcpKSB7XG4gICAgICByZXR1cm47IC8vIHJldHVybiBlYXJseVxuICAgIH1cblxuICAgIHZhciBwcm92aWRlcnMgPSB0aGlzLl9nZXRQcm92aWRlcnMoKTsgLy8gaXMgY2FjaGVkIG9uIGZpcnN0IGNhbGxcblxuICAgIGZvciAodmFyIGkgPSBwcm92aWRlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHByb3ZpZGVyc1tpXSgpOyAvLyBfc2VuZCBmdW5jdGlvbiBjYWxsc1xuICAgIH1cbiAgfSxcblxuICByZWNlaXZlTWVzc2FnZTogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmRhdGEudHlwZSA9PT0gJ2FuYWx5dGljcycpIHtcbiAgICAgIHZhciBwYXlsb2FkID0gSlNPTi5wYXJzZShlLmRhdGEucGF5bG9hZCk7XG5cbiAgICAgIHdpbmRvdy5faWZyYW1lRGF0YXNldCA9IHBheWxvYWQ7IC8vIHN0b3JlIGRhdGFzZXQgZnJvbSBwYXJlbnROb2RlXG4gICAgfVxuICB9LFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh3aW5kb3cuTEIuc2V0dGluZ3MuZ2FDb2RlID09PSAnJykge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLnJlY2VpdmVNZXNzYWdlLCBmYWxzZSk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2VuZHBhZ2V2aWV3JywgdGhpcy5zZW5kLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93Ll9pZnJhbWVEYXRhc2V0ID0ge2dhUHJvcGVydHk6IHdpbmRvdy5MQi5zZXR0aW5ncy5nYUNvZGV9O1xuICAgICAgdGhpcy5zZW5kID0gdGhpcy5zZW5kLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLnNlbmQoKTtcbiAgICB9XG4gIH1cbn07XG5cbnNlbmRQYWdldmlldy5fcHJvdmlkZXJzID0ge1xuICBpdnc6IHtcbiAgICBzZW5kOiBzZW5kUGFnZXZpZXcuX3NlbmRJVlcsXG4gICAgcmVxdWlyZWREYXRhOiBbJ3N6bVN0JywgJ3N6bUNwJywgJ3N6bUNvJ10sXG4gICAgc2NyaXB0VVJMOiAnaHR0cHM6Ly9zY3JpcHQuaW9hbS5kZS9pYW0uanMnLFxuICAgIG9iamVjdDogd2luZG93Lmhhc093blByb3BlcnR5KCdpb20nKSA/IHdpbmRvdy5pb20gOiBudWxsXG4gIH0sXG5cbiAgZ2E6IHtcbiAgICBzZW5kOiBzZW5kUGFnZXZpZXcuX3NlbmRHQSxcbiAgICByZXF1aXJlZERhdGE6IFsnZ2FQcm9wZXJ0eSddLFxuICAgIHNjcmlwdFVSTDogJ2h0dHBzOi8vd3d3Lmdvb2dsZS1hbmFseXRpY3MuY29tL2FuYWx5dGljcy5qcycsXG4gICAgb2JqZWN0OiB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ2dhJykgPyB3aW5kb3cuZ2EgOiBudWxsXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2VuZFBhZ2V2aWV3O1xuIiwiY29uc3QgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcblxuY2xhc3MgU2xpZGVzaG93IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5zdGFydCA9IHRoaXMuc3RhcnQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnN0b3AgPSB0aGlzLnN0b3AuYmluZCh0aGlzKTtcbiAgICB0aGlzLmtleWJvYXJkTGlzdGVuZXIgPSB0aGlzLmtleWJvYXJkTGlzdGVuZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNldEZvY3VzID0gdGhpcy5zZXRGb2N1cy5iaW5kKHRoaXMpO1xuICAgIHRoaXMubGF1bmNoSW50b0Z1bGxzY3JlZW4gPSB0aGlzLmxhdW5jaEludG9GdWxsc2NyZWVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vblJlc2l6ZSA9IHRoaXMub25SZXNpemUuYmluZCh0aGlzKTtcbiAgICB0aGlzLmV4aXRGdWxsc2NyZWVuID0gdGhpcy5leGl0RnVsbHNjcmVlbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMudG9nZ2xlRnVsbHNjcmVlbiA9IHRoaXMudG9nZ2xlRnVsbHNjcmVlbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcnMgPSB0aGlzLmFkZEV2ZW50TGlzdGVuZXJzLmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVycyA9IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMuYmluZCh0aGlzKTtcbiAgICB0aGlzLnRvdWNoU3RhcnQgPSB0aGlzLnRvdWNoU3RhcnQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnRvdWNoTW92ZSA9IHRoaXMudG91Y2hNb3ZlLmJpbmQodGhpcyk7XG4gIH1cblxuICBzdGFydChlKSB7XG4gICAgbGV0IGl0ZW1zID0gW107XG5cbiAgICB0aGlzLml0ZXJhdGlvbnMgPSAwO1xuICAgIHRoaXMuaXNGdWxsc2NyZWVuID0gZmFsc2U7XG4gICAgdGhpcy54RG93biA9IG51bGw7XG4gICAgdGhpcy55RG93biA9IG51bGw7XG5cbiAgICBlLnRhcmdldFxuICAgICAgLmNsb3Nlc3QoJ2FydGljbGUuc2xpZGVzaG93JylcbiAgICAgIC5xdWVyeVNlbGVjdG9yQWxsKCcubGItaXRlbSBpbWcnKVxuICAgICAgLmZvckVhY2goKGltZykgPT4ge1xuICAgICAgICBsZXQgbWF0Y2hlcyA9IFtdO1xuXG4gICAgICAgIGltZy5nZXRBdHRyaWJ1dGUoJ3NyY3NldCcpLnJlcGxhY2UoLyhcXFMrKVxcc1xcZCt3L2csIChzLCBtYXRjaCkgPT4ge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChtYXRjaCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBbYmFzZUltYWdlLCB0aHVtYm5haWwsIHZpZXdJbWFnZV0gPSBtYXRjaGVzO1xuXG4gICAgICAgIGl0ZW1zLnB1c2goe1xuICAgICAgICAgIGl0ZW06IHtcbiAgICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgICAgbWVkaWE6IHtyZW5kaXRpb25zOiB7XG4gICAgICAgICAgICAgICAgYmFzZUltYWdlOiB7aHJlZjogYmFzZUltYWdlfSxcbiAgICAgICAgICAgICAgICB0aHVtYm5haWw6IHtocmVmOiB0aHVtYm5haWx9LFxuICAgICAgICAgICAgICAgIHZpZXdJbWFnZToge2hyZWY6IHZpZXdJbWFnZX1cbiAgICAgICAgICAgICAgfX0sXG4gICAgICAgICAgICAgIGNhcHRpb246IGltZy5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4uY2FwdGlvbicpLnRleHRDb250ZW50LFxuICAgICAgICAgICAgICBjcmVkaXQ6IGltZy5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4uY3JlZGl0JykudGV4dENvbnRlbnQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWN0aXZlOiB0aHVtYm5haWwgPT09IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnc3JjJylcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBsZXQgc2xpZGVzaG93ID0gdGVtcGxhdGVzLnNsaWRlc2hvdyh7XG4gICAgICByZWZzOiBpdGVtc1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2LmxiLXRpbWVsaW5lJylcbiAgICAgIC5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyZW5kJywgc2xpZGVzaG93KTtcblxuICAgIGlmICh3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcCkge1xuICAgICAgd2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSgnZnVsbHNjcmVlbicsIHdpbmRvdy5kb2N1bWVudC5yZWZlcnJlcik7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRGb2N1cygpO1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgdGhpcy5leGl0RnVsbHNjcmVlbigpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JykucmVtb3ZlKCk7XG4gIH1cblxuICBvblJlc2l6ZSgpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IC5jb250YWluZXInKTtcbiAgICBsZXQgb2Zmc2V0ID0gY29udGFpbmVyLm9mZnNldEhlaWdodCAqIHRoaXMuaXRlcmF0aW9ucztcblxuICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7b2Zmc2V0fXB4YDtcbiAgfVxuXG4gIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlib2FyZExpc3RlbmVyKTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyBidXR0b24uZnVsbHNjcmVlbicpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4pO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5hcnJvd3MubmV4dCcpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmtleWJvYXJkTGlzdGVuZXIoe2tleUNvZGU6IDM5fSkpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5hcnJvd3MucHJldicpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmtleWJvYXJkTGlzdGVuZXIoe2tleUNvZGU6IDM3fSkpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5jbG9zZScpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnN0b3ApO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JylcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy50b3VjaFN0YXJ0KTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdycpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy50b3VjaE1vdmUpO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25SZXNpemUpO1xuICB9XG5cbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWJvYXJkTGlzdGVuZXIpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5mdWxsc2NyZWVuJylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlRnVsbHNjcmVlbik7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmFycm93cy5uZXh0JylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzl9KSk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmFycm93cy5wcmV2JylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzd9KSk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmNsb3NlJylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuc3RvcCk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cnKVxuICAgICAgLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLnRvdWNoU3RhcnQpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLnRvdWNoTW92ZSk7XG5cbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5vblJlc2l6ZSk7XG4gIH1cblxuICB0b3VjaFN0YXJ0KGUpIHtcbiAgICB0aGlzLnhEb3duID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgdGhpcy55RG93biA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuICB9XG5cbiAgdG91Y2hNb3ZlKGUpIHtcbiAgICBpZiAoIXRoaXMueERvd24gfHwgIXRoaXMueURvd24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgeFVwID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgdmFyIHlVcCA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuXG4gICAgdmFyIHhEaWZmID0gdGhpcy54RG93biAtIHhVcDtcbiAgICB2YXIgeURpZmYgPSB0aGlzLnlEb3duIC0geVVwO1xuXG4gICAgaWYgKE1hdGguYWJzKHhEaWZmKSA+IE1hdGguYWJzKHlEaWZmKSAmJiB4RGlmZiA+IDApIHtcbiAgICAgIC8vIExlZnQgc3dpcGVcbiAgICAgIHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzl9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmlnaHQgc3dpcGVcbiAgICAgIHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzd9KTtcbiAgICB9XG5cbiAgICB0aGlzLnhEb3duID0gbnVsbDtcbiAgICB0aGlzLnlEb3duID0gbnVsbDtcbiAgfVxuXG4gIHRvZ2dsZUZ1bGxzY3JlZW4oKSB7XG4gICAgaWYgKCF0aGlzLmlzRnVsbHNjcmVlbikge1xuICAgICAgdGhpcy5sYXVuY2hJbnRvRnVsbHNjcmVlbihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2xpZGVzaG93JykpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgfVxuICB9XG5cbiAgbGF1bmNoSW50b0Z1bGxzY3JlZW4oZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgICBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICAgIGVsZW1lbnQubXNSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgIH1cblxuICAgIHRoaXMuaXNGdWxsc2NyZWVuID0gdHJ1ZTtcbiAgfVxuXG4gIGV4aXRGdWxsc2NyZWVuKCkge1xuICAgIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICAgIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKSB7XG4gICAgICBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xuICAgIH1cblxuICAgIHRoaXMuaXNGdWxsc2NyZWVuID0gZmFsc2U7XG4gIH1cblxuICBzZXRGb2N1cygpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IC5jb250YWluZXInKTtcblxuICAgIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKS5mb3JFYWNoKChpbWcsIGkpID0+IHtcbiAgICAgIGlmIChpbWcuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSkge1xuICAgICAgICB0aGlzLml0ZXJhdGlvbnMgPSBpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuaXRlcmF0aW9ucyA+IDApIHtcbiAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7Y29udGFpbmVyLm9mZnNldEhlaWdodCAqIHRoaXMuaXRlcmF0aW9uc31weGA7XG4gICAgfVxuICB9XG5cbiAga2V5Ym9hcmRMaXN0ZW5lcihlKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyAuY29udGFpbmVyJyk7XG4gICAgY29uc3QgcGljdHVyZXNDb3VudCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKS5sZW5ndGg7XG4gICAgbGV0IG9mZnNldCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgKiB0aGlzLml0ZXJhdGlvbnM7XG5cbiAgICBzd2l0Y2ggKGUua2V5Q29kZSkge1xuICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBpZiAob2Zmc2V0ICsgY29udGFpbmVyLm9mZnNldEhlaWdodCA8IHBpY3R1cmVzQ291bnQgKiBjb250YWluZXIub2Zmc2V0SGVpZ2h0KSB7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7b2Zmc2V0ICsgY29udGFpbmVyLm9mZnNldEhlaWdodH1weGA7XG4gICAgICAgIHRoaXMuaXRlcmF0aW9ucysrO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBpZiAob2Zmc2V0IC0gY29udGFpbmVyLm9mZnNldEhlaWdodCA+PSAwKSB7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7b2Zmc2V0IC0gY29udGFpbmVyLm9mZnNldEhlaWdodH1weGA7XG4gICAgICAgIHRoaXMuaXRlcmF0aW9ucy0tO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICBjYXNlIDI3OiAvLyBlc2NcbiAgICAgIHRoaXMuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgIHRoaXMuc3RvcCgpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNsaWRlc2hvdztcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBudW5qdWNrcyA9IHJlcXVpcmUoXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIik7XG5jb25zdCBzZXR0aW5ncyA9IHdpbmRvdy5MQi5zZXR0aW5ncztcblxuY29uc3QgZGVmYXVsdFRlbXBsYXRlcyA9IHtcbiAgcG9zdDogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1wb3N0Lmh0bWxcIiksXG4gIHRpbWVsaW5lOiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiksXG4gIGl0ZW1JbWFnZTogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiksXG4gIGl0ZW1FbWJlZDogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIiksXG4gIHNsaWRlc2hvdzogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbFwiKVxufTtcblxuZnVuY3Rpb24gZ2V0Q3VzdG9tVGVtcGxhdGVzKCkge1xuICBsZXQgY3VzdG9tVGVtcGxhdGVzID0gc2V0dGluZ3MuY3VzdG9tVGVtcGxhdGVzXG4gICAgLCBtZXJnZWRUZW1wbGF0ZXMgPSBkZWZhdWx0VGVtcGxhdGVzO1xuXG4gIGZvciAobGV0IHRlbXBsYXRlIGluIGN1c3RvbVRlbXBsYXRlcykge1xuICAgIGxldCBjdXN0b21UZW1wbGF0ZU5hbWUgPSBjdXN0b21UZW1wbGF0ZXNbdGVtcGxhdGVdO1xuICAgIGRlZmF1bHRUZW1wbGF0ZXNbdGVtcGxhdGVdID0gKGN0eCwgY2IpID0+IHtcbiAgICAgIG51bmp1Y2tzLnJlbmRlcihjdXN0b21UZW1wbGF0ZU5hbWUsIGN0eCwgY2IpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gbWVyZ2VkVGVtcGxhdGVzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldHRpbmdzLmN1c3RvbVRlbXBsYXRlc1xuICA/IGdldEN1c3RvbVRlbXBsYXRlcygpXG4gIDogZGVmYXVsdFRlbXBsYXRlcztcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xudmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJyk7XG52YXIgU2xpZGVzaG93ID0gcmVxdWlyZSgnLi9zbGlkZXNob3cnKTtcblxudmFyIHRpbWVsaW5lRWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIubGItcG9zdHMubm9ybWFsXCIpXG4gICwgbG9hZE1vcmVQb3N0c0J1dHRvbiA9IGhlbHBlcnMuZ2V0RWxlbXMoXCJsb2FkLW1vcmUtcG9zdHNcIik7XG5cbi8qKlxuICogUmVwbGFjZSB0aGUgY3VycmVudCB0aW1lbGluZSB1bmNvbmRpdGlvbmFsbHkuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBhcGlfcmVzcG9uc2Ug4oCTIGNvbnRhaW5zIHJlcXVlc3Qgb3B0cy5cbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSByZXF1ZXN0T3B0cyAtIEFQSSByZXF1ZXN0IHBhcmFtcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyVGltZWxpbmUoYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciByZW5kZXJlZFBvc3RzID0gW107XG5cbiAgYXBpX3Jlc3BvbnNlLl9pdGVtcy5mb3JFYWNoKChwb3N0KSA9PiB7XG4gICAgcmVuZGVyZWRQb3N0cy5wdXNoKHRlbXBsYXRlcy5wb3N0KHtcbiAgICAgIGl0ZW06IHBvc3QsXG4gICAgICBzZXR0aW5nczogd2luZG93LkxCLnNldHRpbmdzXG4gICAgfSkpO1xuXG4gIH0pO1xuICB0aW1lbGluZUVsZW1bMF0uaW5uZXJIVE1MID0gcmVuZGVyZWRQb3N0cy5qb2luKFwiXCIpO1xuICB1cGRhdGVUaW1lc3RhbXBzKCk7XG4gIGxvYWRFbWJlZHMoKTtcbiAgYXR0YWNoU2xpZGVzaG93KCk7XG59XG5cbi8qKlxuICogUmVuZGVyIHBvc3RzIGN1cnJlbnRseSBpbiBwaXBlbGluZSB0byB0ZW1wbGF0ZS5cbiAqIFRvIHJlZHVjZSBET00gY2FsbHMvcGFpbnRzIHdlIGhhbmQgb2ZmIHJlbmRlcmVkIEhUTUwgaW4gYnVsay5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IGFwaV9yZXNwb25zZSDigJMgY29udGFpbnMgcmVxdWVzdCBvcHRzLlxuICogQHByb3BlcnR5IHtPYmplY3R9IHJlcXVlc3RPcHRzIC0gQVBJIHJlcXVlc3QgcGFyYW1zLlxuICovXG5mdW5jdGlvbiByZW5kZXJQb3N0cyhhcGlfcmVzcG9uc2UpIHtcbiAgdmFyIHJlbmRlcmVkUG9zdHMgPSBbXSAvLyB0ZW1wb3Jhcnkgc3RvcmVcbiAgICAsIHBvc3RzID0gYXBpX3Jlc3BvbnNlLl9pdGVtcztcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBvc3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBvc3QgPSBwb3N0c1tpXTtcblxuICAgIGlmIChwb3N0cy5vcGVyYXRpb24gPT09IFwiZGVsZXRlXCIpIHtcbiAgICAgIGRlbGV0ZVBvc3QocG9zdC5faWQpO1xuICAgICAgcmV0dXJuOyAvLyBlYXJseVxuICAgIH1cblxuICAgIHZhciByZW5kZXJlZFBvc3QgPSB0ZW1wbGF0ZXMucG9zdCh7XG4gICAgICBpdGVtOiBwb3N0LFxuICAgICAgc2V0dGluZ3M6IHdpbmRvdy5MQi5zZXR0aW5nc1xuICAgIH0pO1xuXG4gICAgaWYgKHBvc3RzLm9wZXJhdGlvbiA9PT0gXCJ1cGRhdGVcIikge1xuICAgICAgdXBkYXRlUG9zdChyZW5kZXJlZFBvc3QpO1xuICAgICAgcmV0dXJuOyAvLyBlYXJseVxuICAgIH1cblxuICAgIHJlbmRlcmVkUG9zdHMucHVzaChyZW5kZXJlZFBvc3QpOyAvLyBjcmVhdGUgb3BlcmF0aW9uXG4gIH1cblxuICBpZiAoIXJlbmRlcmVkUG9zdHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuOyAvLyBlYXJseVxuICB9XG4gIFxuICByZW5kZXJlZFBvc3RzLnJldmVyc2UoKTtcblxuICBhZGRQb3N0cyhyZW5kZXJlZFBvc3RzLCB7IC8vIGlmIGNyZWF0ZXNcbiAgICBwb3NpdGlvbjogYXBpX3Jlc3BvbnNlLnJlcXVlc3RPcHRzLmZyb21EYXRlID8gXCJ0b3BcIiA6IFwiYm90dG9tXCJcbiAgfSk7XG5cbiAgbG9hZEVtYmVkcygpO1xufVxuXG4vKipcbiAqIEFkZCBwb3N0IG5vZGVzIHRvIERPTSwgZG8gc28gcmVnYXJkbGVzcyBvZiBzZXR0aW5ncy5hdXRvQXBwbHlVcGRhdGVzLFxuICogYnV0IHJhdGhlciBzZXQgdGhlbSB0byBOT1QgQkUgRElTUExBWUVEIGlmIGF1dG8tYXBwbHkgaXMgZmFsc2UuXG4gKiBUaGlzIHdheSB3ZSBkb24ndCBoYXZlIHRvIG1lc3Mgd2l0aCB0d28gc3RhY2tzIG9mIHBvc3RzLlxuICogQHBhcmFtIHthcnJheX0gcG9zdHMgLSBhbiBhcnJheSBvZiBMaXZlYmxvZyBwb3N0IGl0ZW1zXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIGtleXdvcmQgYXJnc1xuICogQHBhcmFtIHtzdHJpbmd9IG9wdHMucG9zaXRpb24gLSB0b3Agb3IgYm90dG9tXG4gKi9cbmZ1bmN0aW9uIGFkZFBvc3RzKHBvc3RzLCBvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICBvcHRzLnBvc2l0aW9uID0gb3B0cy5wb3NpdGlvbiB8fCBcImJvdHRvbVwiO1xuXG4gIHZhciBwb3N0c0hUTUwgPSBcIlwiXG4gICAgLCBwb3NpdGlvbiA9IG9wdHMucG9zaXRpb24gPT09IFwidG9wXCJcbiAgICAgICAgPyBcImFmdGVyYmVnaW5cIiAvLyBpbnNlcnRBZGphY2VudEhUTUwgQVBJID0+IGFmdGVyIHN0YXJ0IG9mIG5vZGVcbiAgICAgICAgOiBcImJlZm9yZWVuZFwiOyAvLyBpbnNlcnRBZGphY2VudEhUTUwgQVBJID0+IGJlZm9yZSBlbmQgb2Ygbm9kZVxuXG4gIGZvciAodmFyIGkgPSBwb3N0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHBvc3RzSFRNTCArPSBwb3N0c1tpXTtcbiAgfVxuXG4gIHRpbWVsaW5lRWxlbVswXS5pbnNlcnRBZGphY2VudEhUTUwocG9zaXRpb24sIHBvc3RzSFRNTCk7XG4gIGF0dGFjaFNsaWRlc2hvdygpO1xufVxuXG4vKipcbiAqIERlbGV0ZSBwb3N0IDxhcnRpY2xlPiBET00gbm9kZSBieSBkYXRhIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAtIGEgcG9zdCBVUk5cbiAqL1xuZnVuY3Rpb24gZGVsZXRlUG9zdChwb3N0SWQpIHtcbiAgdmFyIGVsZW0gPSBoZWxwZXJzLmdldEVsZW1zKCdkYXRhLWpzLXBvc3QtaWQ9XFxcIicgKyBwb3N0SWQgKyAnXFxcIicpO1xuICBlbGVtWzBdLnJlbW92ZSgpO1xufVxuXG4vKipcbiAqIERlbGV0ZSBwb3N0IDxhcnRpY2xlPiBET00gbm9kZSBieSBkYXRhIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAtIGEgcG9zdCBVUk5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlUG9zdChwb3N0SWQsIHJlbmRlcmVkUG9zdCkge1xuICB2YXIgZWxlbSA9IGhlbHBlcnMuZ2V0RWxlbXMoJ2RhdGEtanMtcG9zdC1pZD1cXFwiJyArIHBvc3RJZCArICdcXFwiJyk7XG4gIGVsZW1bMF0uaW5uZXJIVE1MID0gcmVuZGVyZWRQb3N0O1xufVxuXG4vKipcbiAqIFNob3cgbmV3IHBvc3RzIGxvYWRlZCB2aWEgWEhSXG4gKi9cbmZ1bmN0aW9uIGRpc3BsYXlOZXdQb3N0cygpIHtcbiAgdmFyIG5ld1Bvc3RzID0gaGVscGVycy5nZXRFbGVtcyhcImxiLXBvc3QtbmV3XCIpO1xuICBmb3IgKHZhciBpID0gbmV3UG9zdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBuZXdQb3N0c1tpXS5jbGFzc0xpc3QucmVtb3ZlKFwibGItcG9zdC1uZXdcIik7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGVtYmVkIHByb3ZpZGVyIHVucGFja2luZ1xuICogVG9kbzogTWFrZSByZXF1aXJlZCBzY3JpcHRzIGF2YWlsYWJsZSBvbiBzdWJzZXF1ZW50IGxvYWRzXG4gKi9cbmZ1bmN0aW9uIGxvYWRFbWJlZHMoKSB7XG4gIGlmICh3aW5kb3cuaW5zdGdybSkge1xuICAgIGluc3Rncm0uRW1iZWRzLnByb2Nlc3MoKTtcbiAgfVxuXG4gIGlmICh3aW5kb3cudHd0dHIpIHtcbiAgICB0d3R0ci53aWRnZXRzLmxvYWQoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b2dnbGVDb21tZW50RGlhbG9nKCkge1xuICBsZXQgY29tbWVudEZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdmb3JtLmNvbW1lbnQnKTtcbiAgbGV0IGlzSGlkZGVuID0gZmFsc2U7XG5cbiAgaWYgKGNvbW1lbnRGb3JtKSB7XG4gICAgaXNIaWRkZW4gPSBjb21tZW50Rm9ybS5jbGFzc0xpc3QudG9nZ2xlKCdoaWRlJyk7XG4gIH1cblxuICByZXR1cm4gIWlzSGlkZGVuO1xufVxuXG4vKipcbiAqIFNldCBzb3J0aW5nIG9yZGVyIGJ1dHRvbiBvZiBjbGFzcyBAbmFtZSB0byBhY3RpdmUuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIGxpdmVibG9nIEFQSSByZXNwb25zZSBKU09OLlxuICovXG5mdW5jdGlvbiB0b2dnbGVTb3J0QnRuKG5hbWUpIHtcbiAgdmFyIHNvcnRpbmdCdG5zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnNvcnRpbmctYmFyX19vcmRlcicpO1xuXG4gIHNvcnRpbmdCdG5zLmZvckVhY2goKGVsKSA9PiB7XG4gICAgdmFyIHNob3VsZEJlQWN0aXZlID0gZWwuZGF0YXNldC5oYXNPd25Qcm9wZXJ0eShcImpzT3JkZXJieV9cIiArIG5hbWUpO1xuXG4gICAgZWwuY2xhc3NMaXN0LnRvZ2dsZSgnc29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmUnLCBzaG91bGRCZUFjdGl2ZSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIENvbmRpdGlvbmFsbHkgaGlkZSBsb2FkLW1vcmUtcG9zdHMgYnV0dG9uLlxuICogQHBhcmFtIHtib29sfSBzaG91bGRUb2dnbGUgLSB0cnVlID0+IGhpZGVcbiAqL1xuZnVuY3Rpb24gaGlkZUxvYWRNb3JlKHNob3VsZEhpZGUpIHtcbiAgaWYgKGxvYWRNb3JlUG9zdHNCdXR0b24ubGVuZ3RoID4gMCkge1xuICAgIGxvYWRNb3JlUG9zdHNCdXR0b25bMF0uY2xhc3NMaXN0LnRvZ2dsZShcbiAgICAgIFwibW9kLS1oaWRlXCIsIHNob3VsZEhpZGUpO1xuICB9XG59XG5cbi8qKlxuICogRGVsZXRlIHBvc3QgPGFydGljbGU+IERPTSBub2RlIGJ5IGRhdGEgYXR0cmlidXRlLlxuICogQHBhcmFtIHtzdHJpbmd9IC0gYSBwb3N0IFVSTlxuICovXG5mdW5jdGlvbiB1cGRhdGVUaW1lc3RhbXBzKCkge1xuICB2YXIgZGF0ZUVsZW1zID0gaGVscGVycy5nZXRFbGVtcyhcImxiLXBvc3QtZGF0ZVwiKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRlRWxlbXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZWxlbSA9IGRhdGVFbGVtc1tpXVxuICAgICAgLCB0aW1lc3RhbXAgPSBlbGVtLmRhdGFzZXQuanNUaW1lc3RhbXA7XG4gICAgZWxlbS50ZXh0Q29udGVudCA9IGhlbHBlcnMuY29udmVydFRpbWVzdGFtcCh0aW1lc3RhbXApO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBzaG93U3VjY2Vzc0NvbW1lbnRNc2coKSB7XG4gIGxldCBjb21tZW50U2VudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Rpdi5jb21tZW50LXNlbnQnKTtcblxuICBjb21tZW50U2VudC5jbGFzc0xpc3QudG9nZ2xlKCdoaWRlJyk7XG5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgY29tbWVudFNlbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZScpO1xuICB9LCA1MDAwKTtcbn1cblxuZnVuY3Rpb24gY2xlYXJDb21tZW50Rm9ybUVycm9ycygpIHtcbiAgbGV0IGVycm9yc01zZ3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwLmVyci1tc2cnKTtcblxuICBpZiAoZXJyb3JzTXNncykge1xuICAgIGVycm9yc01zZ3MuZm9yRWFjaCgoZXJyb3JzTXNnKSA9PiBlcnJvcnNNc2cucmVtb3ZlKCkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BsYXlDb21tZW50Rm9ybUVycm9ycyhlcnJvcnMpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoZXJyb3JzKSkge1xuICAgIGVycm9ycy5mb3JFYWNoKChlcnJvcikgPT4ge1xuICAgICAgbGV0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVycm9yLmlkKTtcblxuICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC5pbnNlcnRBZGphY2VudEhUTUwoXG4gICAgICAgICAgJ2FmdGVyZW5kJyxcbiAgICAgICAgICBgPHAgY2xhc3M9XCJlcnItbXNnXCI+JHtlcnJvci5tc2d9PC9wPmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhdHRhY2hTbGlkZXNob3coKSB7XG4gIGNvbnN0IHNsaWRlc2hvdyA9IG5ldyBTbGlkZXNob3coKTtcbiAgY29uc3Qgc2xpZGVzaG93SW1hZ2VzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYXJ0aWNsZS5zbGlkZXNob3cgaW1nJyk7XG5cbiAgaWYgKHNsaWRlc2hvd0ltYWdlcykge1xuICAgIHNsaWRlc2hvd0ltYWdlcy5mb3JFYWNoKChpbWFnZSkgPT4ge1xuICAgICAgaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzbGlkZXNob3cuc3RhcnQpO1xuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGRQb3N0czogYWRkUG9zdHMsXG4gIGRlbGV0ZVBvc3Q6IGRlbGV0ZVBvc3QsXG4gIGRpc3BsYXlOZXdQb3N0czogZGlzcGxheU5ld1Bvc3RzLFxuICByZW5kZXJUaW1lbGluZTogcmVuZGVyVGltZWxpbmUsXG4gIHJlbmRlclBvc3RzOiByZW5kZXJQb3N0cyxcbiAgdXBkYXRlUG9zdDogdXBkYXRlUG9zdCxcbiAgdXBkYXRlVGltZXN0YW1wczogdXBkYXRlVGltZXN0YW1wcyxcbiAgaGlkZUxvYWRNb3JlOiBoaWRlTG9hZE1vcmUsXG4gIHRvZ2dsZVNvcnRCdG46IHRvZ2dsZVNvcnRCdG4sXG4gIHRvZ2dsZUNvbW1lbnREaWFsb2c6IHRvZ2dsZUNvbW1lbnREaWFsb2csXG4gIHNob3dTdWNjZXNzQ29tbWVudE1zZzogc2hvd1N1Y2Nlc3NDb21tZW50TXNnLFxuICBkaXNwbGF5Q29tbWVudEZvcm1FcnJvcnM6IGRpc3BsYXlDb21tZW50Rm9ybUVycm9ycyxcbiAgY2xlYXJDb21tZW50Rm9ybUVycm9yczogY2xlYXJDb21tZW50Rm9ybUVycm9ycyxcbiAgYXR0YWNoU2xpZGVzaG93OiBhdHRhY2hTbGlkZXNob3dcbn07XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKVxuICAsIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY29uc3QgY29tbWVudEl0ZW1FbmRwb2ludCA9IGAke0xCLmFwaV9ob3N0fWFwaS9jbGllbnRfaXRlbXNgO1xuY29uc3QgY29tbWVudFBvc3RFbmRwb2ludCA9IGAke0xCLmFwaV9ob3N0fWFwaS9jbGllbnRfY29tbWVudHNgO1xuXG52YXIgZW5kcG9pbnQgPSBMQi5hcGlfaG9zdCArIFwiYXBpL2NsaWVudF9ibG9ncy9cIiArIExCLmJsb2cuX2lkICsgXCIvcG9zdHNcIlxuICAsIHNldHRpbmdzID0gTEIuc2V0dGluZ3NcbiAgLCB2bSA9IHt9O1xuXG4vKipcbiAqIEdldCBpbml0aWFsIG9yIHJlc2V0IHZpZXdtb2RlbC5cbiAqIEByZXR1cm5zIHtvYmplY3R9IGVtcHR5IHZpZXdtb2RlbCBzdG9yZS5cbiAqL1xuZnVuY3Rpb24gZ2V0RW1wdHlWbShpdGVtcykge1xuICByZXR1cm4ge1xuICAgIF9pdGVtczogbmV3IEFycmF5KGl0ZW1zKSB8fCAwLFxuICAgIGN1cnJlbnRQYWdlOiAxLFxuICAgIHRvdGFsUG9zdHM6IDBcbiAgfTtcbn1cblxudm0uc2VuZENvbW1lbnQgPSAobmFtZSwgY29tbWVudCkgPT4ge1xuICBsZXQgZXJyb3JzID0gW107XG5cbiAgaWYgKCFuYW1lKSB7XG4gICAgZXJyb3JzLnB1c2goe2lkOiAnI2NvbW1lbnQtbmFtZScsIG1zZzogJ01pc3NpbmcgbmFtZSd9KTtcbiAgfVxuXG4gIGlmICghY29tbWVudCkge1xuICAgIGVycm9ycy5wdXNoKHtpZDogJyNjb21tZW50LWNvbnRlbnQnLCBtc2c6ICdNaXNzaW5nIGNvbnRlbnQnfSk7XG4gIH1cblxuICBpZiAoZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gcmVqZWN0KGVycm9ycykpO1xuICB9XG5cbiAgcmV0dXJuIGhlbHBlcnNcbiAgICAucG9zdChjb21tZW50SXRlbUVuZHBvaW50LCB7XG4gICAgICBpdGVtX3R5cGU6IFwiY29tbWVudFwiLFxuICAgICAgY2xpZW50X2Jsb2c6IExCLmJsb2cuX2lkLFxuICAgICAgY29tbWVudGVyOiBuYW1lLFxuICAgICAgdGV4dDogY29tbWVudFxuICAgIH0pXG4gICAgLnRoZW4oKGl0ZW0pID0+IGhlbHBlcnMucG9zdChjb21tZW50UG9zdEVuZHBvaW50LCB7XG4gICAgICBwb3N0X3N0YXR1czogXCJjb21tZW50XCIsXG4gICAgICBjbGllbnRfYmxvZzogTEIuYmxvZy5faWQsXG4gICAgICBncm91cHM6IFt7XG4gICAgICAgIGlkOiBcInJvb3RcIixcbiAgICAgICAgcmVmczogW3tpZFJlZjogXCJtYWluXCJ9XSxcbiAgICAgICAgcm9sZTogXCJncnBSb2xlOk5FUFwiXG4gICAgICB9LHtcbiAgICAgICAgaWQ6IFwibWFpblwiLFxuICAgICAgICByZWZzOiBbe3Jlc2lkUmVmOiBpdGVtLl9pZH1dLFxuICAgICAgICByb2xlOiBcImdycFJvbGU6TWFpblwifVxuICAgICAgXVxuICAgIH0pKTtcbiAgICAvLy5jYXRjaCgoZXJyKSA9PiB7XG4gICAgLy8gIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAvL30pO1xufTtcblxuLyoqXG4gKiBQcml2YXRlIEFQSSByZXF1ZXN0IG1ldGhvZFxuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBxdWVyeSBidWlsZGVyIG9wdGlvbnMuXG4gKiBAcGFyYW0ge251bWJlcn0gb3B0cy5wYWdlIC0gZGVzaXJlZCBwYWdlL3N1YnNldCBvZiBwb3N0cywgbGVhdmUgZW1wdHkgZm9yIHBvbGxpbmcuXG4gKiBAcGFyYW0ge251bWJlcn0gb3B0cy5mcm9tRGF0ZSAtIG5lZWRlZCBmb3IgcG9sbGluZy5cbiAqIEByZXR1cm5zIHtvYmplY3R9IExpdmVibG9nIDMgQVBJIHJlc3BvbnNlXG4gKi9cbnZtLmdldFBvc3RzID0gZnVuY3Rpb24ob3B0cykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGRiUXVlcnkgPSBzZWxmLmdldFF1ZXJ5KHtcbiAgICBzb3J0OiBvcHRzLnNvcnQgfHwgc2VsZi5zZXR0aW5ncy5wb3N0T3JkZXIsXG4gICAgaGlnaGxpZ2h0c09ubHk6IGZhbHNlIHx8IG9wdHMuaGlnaGxpZ2h0c09ubHksXG4gICAgZnJvbURhdGU6IG9wdHMuZnJvbURhdGVcbiAgICAgID8gb3B0cy5mcm9tRGF0ZVxuICAgICAgOiBmYWxzZVxuICB9KTtcblxuICB2YXIgcGFnZSA9IG9wdHMuZnJvbURhdGUgPyAxIDogb3B0cy5wYWdlO1xuICB2YXIgcXMgPSBcIj9tYXhfcmVzdWx0cz1cIiArIHNldHRpbmdzLnBvc3RzUGVyUGFnZSArIFwiJnBhZ2U9XCIgKyBwYWdlICsgXCImc291cmNlPVwiXG4gICAgLCBmdWxsUGF0aCA9IGVuZHBvaW50ICsgcXMgKyBkYlF1ZXJ5O1xuXG4gIHJldHVybiBoZWxwZXJzLmdldEpTT04oZnVsbFBhdGgpXG4gICAgLnRoZW4oKHBvc3RzKSA9PiB7XG4gICAgICBzZWxmLnVwZGF0ZVZpZXdNb2RlbChwb3N0cywgb3B0cyk7XG4gICAgICBwb3N0cy5yZXF1ZXN0T3B0cyA9IG9wdHM7XG4gICAgICByZXR1cm4gcG9zdHM7XG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBHZXQgbmV4dCBwYWdlIG9mIHBvc3RzIGZyb20gQVBJLlxuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBxdWVyeSBidWlsZGVyIG9wdGlvbnMuXG4gKiBAcmV0dXJucyB7cHJvbWlzZX0gcmVzb2x2ZXMgdG8gcG9zdHMgYXJyYXkuXG4gKi9cbnZtLmxvYWRQb3N0c1BhZ2UgPSBmdW5jdGlvbihvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICBvcHRzLnBhZ2UgPSArK3RoaXMudm0uY3VycmVudFBhZ2U7XG4gIG9wdHMuc29ydCA9IHRoaXMuc2V0dGluZ3MucG9zdE9yZGVyO1xuICByZXR1cm4gdGhpcy5nZXRQb3N0cyhvcHRzKTtcbn07XG5cbi8qKlxuICogUG9sbCBBUEkgZm9yIG5ldyBwb3N0cy5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0gcXVlcnkgYnVpbGRlciBvcHRpb25zLlxuICogQHJldHVybnMge3Byb21pc2V9IHJlc29sdmVzIHRvIHBvc3RzIGFycmF5LlxuICovXG52bS5sb2FkUG9zdHMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICBvcHRzLmZyb21EYXRlID0gdGhpcy52bS5sYXRlc3RVcGRhdGU7XG4gIHJldHVybiB0aGlzLmdldFBvc3RzKG9wdHMpO1xufTtcblxuLyoqXG4gKiBBZGQgaXRlbXMgaW4gYXBpIHJlc3BvbnNlICYgbGF0ZXN0IHVwZGF0ZSB0aW1lc3RhbXAgdG8gdmlld21vZGVsLlxuICogQHBhcmFtIHtvYmplY3R9IGFwaV9yZXNwb25zZSAtIGxpdmVibG9nIEFQSSByZXNwb25zZSBKU09OLlxuICovXG52bS51cGRhdGVWaWV3TW9kZWwgPSBmdW5jdGlvbihhcGlfcmVzcG9uc2UsIG9wdHMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGlmICghb3B0cy5mcm9tRGF0ZSB8fCBvcHRzLnNvcnQgIT09IHNlbGYuc2V0dGluZ3MucG9zdE9yZGVyKSB7IC8vIE1lYW5zIHdlJ3JlIG5vdCBwb2xsaW5nXG4gICAgdmlldy5oaWRlTG9hZE1vcmUoc2VsZi5pc1RpbWVsaW5lRW5kKGFwaV9yZXNwb25zZSkpOyAvLyB0aGUgZW5kP1xuICB9IGVsc2UgeyAvLyBNZWFucyB3ZSdyZSBwb2xsaW5nIGZvciBuZXcgcG9zdHNcbiAgICBpZiAoIWFwaV9yZXNwb25zZS5faXRlbXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi52bS5sYXRlc3RVcGRhdGUgPSBzZWxmLmdldExhdGVzdFVwZGF0ZShhcGlfcmVzcG9uc2UpO1xuICB9XG5cbiAgaWYgKG9wdHMuc29ydCAhPT0gc2VsZi5zZXR0aW5ncy5wb3N0T3JkZXIpIHtcbiAgICBzZWxmLnZtID0gZ2V0RW1wdHlWbSgpO1xuICAgIHZpZXcuaGlkZUxvYWRNb3JlKGZhbHNlKTtcbiAgICBPYmplY3QuYXNzaWduKHNlbGYudm0sIGFwaV9yZXNwb25zZSk7XG4gIH0gZWxzZSB7XG4gICAgc2VsZi52bS5faXRlbXMucHVzaC5hcHBseShzZWxmLnZtLl9pdGVtcywgYXBpX3Jlc3BvbnNlLl9pdGVtcyk7XG4gIH1cblxuICBzZWxmLnNldHRpbmdzLnBvc3RPcmRlciA9IG9wdHMuc29ydDtcbiAgcmV0dXJuIGFwaV9yZXNwb25zZTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBsYXRlc3QgdXBkYXRlIHRpbWVzdGFtcCBmcm9tIGEgbnVtYmVyIG9mIHBvc3RzLlxuICogQHBhcmFtIHtvYmplY3R9IGFwaV9yZXNwb25zZSAtIGxpdmVibG9nIEFQSSByZXNwb25zZSBKU09OLlxuICogQHJldHVybnMge3N0cmluZ30gLSBJU08gODYwMSBlbmNvZGVkIGRhdGVcbiAqL1xudm0uZ2V0TGF0ZXN0VXBkYXRlID0gZnVuY3Rpb24oYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciB0aW1lc3RhbXBzID0gYXBpX3Jlc3BvbnNlLl9pdGVtcy5tYXAoKHBvc3QpID0+IG5ldyBEYXRlKHBvc3QuX3VwZGF0ZWQpKTtcblxuICB2YXIgbGF0ZXN0ID0gbmV3IERhdGUoTWF0aC5tYXguYXBwbHkobnVsbCwgdGltZXN0YW1wcykpO1xuICByZXR1cm4gbGF0ZXN0LnRvSVNPU3RyaW5nKCk7IC8vIGNvbnZlcnQgdGltZXN0YW1wIHRvIElTT1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB3ZSByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHRpbWVsaW5lLlxuICogQHBhcmFtIHtvYmplY3R9IGFwaV9yZXNwb25zZSAtIGxpdmVibG9nIEFQSSByZXNwb25zZSBKU09OLlxuICogQHJldHVybnMge2Jvb2x9XG4gKi9cbnZtLmlzVGltZWxpbmVFbmQgPSBmdW5jdGlvbihhcGlfcmVzcG9uc2UpIHtcbiAgdmFyIGl0ZW1zSW5WaWV3ID0gdGhpcy52bS5faXRlbXMubGVuZ3RoICsgc2V0dGluZ3MucG9zdHNQZXJQYWdlO1xuICByZXR1cm4gYXBpX3Jlc3BvbnNlLl9tZXRhLnRvdGFsIDw9IGl0ZW1zSW5WaWV3O1xufTtcblxuLyoqXG4gKiBTZXQgdXAgdmlld21vZGVsLlxuICovXG52bS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgdGhpcy52bSA9IGdldEVtcHR5Vm0oc2V0dGluZ3MucG9zdHNQZXJQYWdlKTtcbiAgdGhpcy52bS5sYXRlc3RVcGRhdGUgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gIHRoaXMudm0udGltZUluaXRpYWxpemVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICByZXR1cm4gdGhpcy52bS5sYXRlc3RVcGRhdGU7XG59O1xuXG4vKipcbiAqIEJ1aWxkIHVybGVuY29kZWQgRWxhc3RpY1NlYXJjaCBRdWVyeXN0cmluZ1xuICogVE9ETzogYWJzdHJhY3QgYXdheSwgd2Ugb25seSBuZWVkIHN0aWNreSBmbGFnIGFuZCBvcmRlclxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBhcmd1bWVudHMgb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5zb3J0IC0gaWYgXCJhc2NlbmRpbmdcIiwgZ2V0IGl0ZW1zIGluIGFzY2VuZGluZyBvcmRlclxuICogQHBhcmFtIHtzdHJpbmd9IG9wdHMuZnJvbURhdGUgLSByZXN1bHRzIHdpdGggYSBJU08gODYwMSB0aW1lc3RhbXAgZ3QgdGhpcyBvbmx5XG4gKiBAcGFyYW0ge2Jvb2x9IG9wdHMuaGlnaGxpZ2h0c09ubHkgLSBnZXQgZWRpdG9yaWFsL2hpZ2hsaWdodGVkIGl0ZW1zIG9ubHlcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFF1ZXJ5c3RyaW5nXG4gKi9cbnZtLmdldFF1ZXJ5ID0gZnVuY3Rpb24ob3B0cykge1xuICB2YXIgcXVlcnkgPSB7XG4gICAgXCJxdWVyeVwiOiB7XG4gICAgICBcImZpbHRlcmVkXCI6IHtcbiAgICAgICAgXCJmaWx0ZXJcIjoge1xuICAgICAgICAgIFwiYW5kXCI6IFtcbiAgICAgICAgICAgIHtcInRlcm1cIjoge1wic3RpY2t5XCI6IGZhbHNlfX0sXG4gICAgICAgICAgICB7XCJ0ZXJtXCI6IHtcInBvc3Rfc3RhdHVzXCI6IFwib3BlblwifX0sXG4gICAgICAgICAgICB7XCJub3RcIjoge1widGVybVwiOiB7XCJkZWxldGVkXCI6IHRydWV9fX0sXG4gICAgICAgICAgICB7XCJyYW5nZVwiOiB7XCJfdXBkYXRlZFwiOiB7XCJsdFwiOiB0aGlzLnZtLnRpbWVJbml0aWFsaXplZH19fVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXCJzb3J0XCI6IFtcbiAgICAgIHtcbiAgICAgICAgXCJfdXBkYXRlZFwiOiB7XCJvcmRlclwiOiBcImRlc2NcIn1cbiAgICAgIH1cbiAgICBdXG4gIH07XG5cbiAgaWYgKG9wdHMuZnJvbURhdGUpIHtcbiAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kWzNdLnJhbmdlLl91cGRhdGVkID0ge1xuICAgICAgXCJndFwiOiBvcHRzLmZyb21EYXRlXG4gICAgfTtcbiAgfVxuXG4gIGlmIChvcHRzLmhpZ2hsaWdodHNPbmx5ID09PSB0cnVlKSB7XG4gICAgcXVlcnkucXVlcnkuZmlsdGVyZWQuZmlsdGVyLmFuZC5wdXNoKHtcbiAgICAgIHRlcm06IHtoaWdobGlnaHQ6IHRydWV9XG4gICAgfSk7XG4gIH1cblxuICBpZiAob3B0cy5zb3J0ID09PSBcImFzY2VuZGluZ1wiKSB7XG4gICAgcXVlcnkuc29ydFswXS5fdXBkYXRlZC5vcmRlciA9IFwiYXNjXCI7XG4gIH0gZWxzZSBpZiAob3B0cy5zb3J0ID09PSBcImVkaXRvcmlhbFwiKSB7XG4gICAgcXVlcnkuc29ydCA9IFtcbiAgICAgIHtcbiAgICAgICAgb3JkZXI6IHtcbiAgICAgICAgICBvcmRlcjogXCJkZXNjXCIsXG4gICAgICAgICAgbWlzc2luZzogXCJfbGFzdFwiLFxuICAgICAgICAgIHVubWFwcGVkX3R5cGU6IFwibG9uZ1wiXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdO1xuICB9XG5cbiAgLy8gUmVtb3ZlIHRoZSByYW5nZSwgd2Ugd2FudCBhbGwgdGhlIHJlc3VsdHNcbiAgaWYgKFtcImFzY2VuZGluZ1wiLCBcImRlc2NlbmRpbmdcIiwgXCJlZGl0b3JpYWxcIl0uaW5kZXhPZihvcHRzLnNvcnQpKSB7XG4gICAgcXVlcnkucXVlcnkuZmlsdGVyZWQuZmlsdGVyLmFuZC5mb3JFYWNoKChydWxlLCBpbmRleCkgPT4ge1xuICAgICAgaWYgKHJ1bGUuaGFzT3duUHJvcGVydHkoJ3JhbmdlJykpIHtcbiAgICAgICAgcXVlcnkucXVlcnkuZmlsdGVyZWQuZmlsdGVyLmFuZC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGVuY29kZVVSSShKU09OLnN0cmluZ2lmeShxdWVyeSkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB2bTtcbiIsIi8vISBtb21lbnQuanNcbi8vISB2ZXJzaW9uIDogMi4xOC4xXG4vLyEgYXV0aG9ycyA6IFRpbSBXb29kLCBJc2tyZW4gQ2hlcm5ldiwgTW9tZW50LmpzIGNvbnRyaWJ1dG9yc1xuLy8hIGxpY2Vuc2UgOiBNSVRcbi8vISBtb21lbnRqcy5jb21cblxuOyhmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gICAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuICAgIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShmYWN0b3J5KSA6XG4gICAgZ2xvYmFsLm1vbWVudCA9IGZhY3RvcnkoKVxufSh0aGlzLCAoZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbnZhciBob29rQ2FsbGJhY2s7XG5cbmZ1bmN0aW9uIGhvb2tzICgpIHtcbiAgICByZXR1cm4gaG9va0NhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59XG5cbi8vIFRoaXMgaXMgZG9uZSB0byByZWdpc3RlciB0aGUgbWV0aG9kIGNhbGxlZCB3aXRoIG1vbWVudCgpXG4vLyB3aXRob3V0IGNyZWF0aW5nIGNpcmN1bGFyIGRlcGVuZGVuY2llcy5cbmZ1bmN0aW9uIHNldEhvb2tDYWxsYmFjayAoY2FsbGJhY2spIHtcbiAgICBob29rQ2FsbGJhY2sgPSBjYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gaXNBcnJheShpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEFycmF5IHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGlucHV0KSB7XG4gICAgLy8gSUU4IHdpbGwgdHJlYXQgdW5kZWZpbmVkIGFuZCBudWxsIGFzIG9iamVjdCBpZiBpdCB3YXNuJ3QgZm9yXG4gICAgLy8gaW5wdXQgIT0gbnVsbFxuICAgIHJldHVybiBpbnB1dCAhPSBudWxsICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdEVtcHR5KG9iaikge1xuICAgIHZhciBrO1xuICAgIGZvciAoayBpbiBvYmopIHtcbiAgICAgICAgLy8gZXZlbiBpZiBpdHMgbm90IG93biBwcm9wZXJ0eSBJJ2Qgc3RpbGwgY2FsbCBpdCBub24tZW1wdHlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQgPT09IHZvaWQgMDtcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoaW5wdXQpIHtcbiAgICByZXR1cm4gdHlwZW9mIGlucHV0ID09PSAnbnVtYmVyJyB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBOdW1iZXJdJztcbn1cblxuZnVuY3Rpb24gaXNEYXRlKGlucHV0KSB7XG4gICAgcmV0dXJuIGlucHV0IGluc3RhbmNlb2YgRGF0ZSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5cbmZ1bmN0aW9uIG1hcChhcnIsIGZuKSB7XG4gICAgdmFyIHJlcyA9IFtdLCBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgcmVzLnB1c2goZm4oYXJyW2ldLCBpKSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIGhhc093blByb3AoYSwgYikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYSwgYik7XG59XG5cbmZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XG4gICAgZm9yICh2YXIgaSBpbiBiKSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGIsIGkpKSB7XG4gICAgICAgICAgICBhW2ldID0gYltpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChoYXNPd25Qcm9wKGIsICd0b1N0cmluZycpKSB7XG4gICAgICAgIGEudG9TdHJpbmcgPSBiLnRvU3RyaW5nO1xuICAgIH1cblxuICAgIGlmIChoYXNPd25Qcm9wKGIsICd2YWx1ZU9mJykpIHtcbiAgICAgICAgYS52YWx1ZU9mID0gYi52YWx1ZU9mO1xuICAgIH1cblxuICAgIHJldHVybiBhO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVVVEMgKGlucHV0LCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0KSB7XG4gICAgcmV0dXJuIGNyZWF0ZUxvY2FsT3JVVEMoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QsIHRydWUpLnV0YygpO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0UGFyc2luZ0ZsYWdzKCkge1xuICAgIC8vIFdlIG5lZWQgdG8gZGVlcCBjbG9uZSB0aGlzIG9iamVjdC5cbiAgICByZXR1cm4ge1xuICAgICAgICBlbXB0eSAgICAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgdW51c2VkVG9rZW5zICAgIDogW10sXG4gICAgICAgIHVudXNlZElucHV0ICAgICA6IFtdLFxuICAgICAgICBvdmVyZmxvdyAgICAgICAgOiAtMixcbiAgICAgICAgY2hhcnNMZWZ0T3ZlciAgIDogMCxcbiAgICAgICAgbnVsbElucHV0ICAgICAgIDogZmFsc2UsXG4gICAgICAgIGludmFsaWRNb250aCAgICA6IG51bGwsXG4gICAgICAgIGludmFsaWRGb3JtYXQgICA6IGZhbHNlLFxuICAgICAgICB1c2VySW52YWxpZGF0ZWQgOiBmYWxzZSxcbiAgICAgICAgaXNvICAgICAgICAgICAgIDogZmFsc2UsXG4gICAgICAgIHBhcnNlZERhdGVQYXJ0cyA6IFtdLFxuICAgICAgICBtZXJpZGllbSAgICAgICAgOiBudWxsLFxuICAgICAgICByZmMyODIyICAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgd2Vla2RheU1pc21hdGNoIDogZmFsc2VcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRQYXJzaW5nRmxhZ3MobSkge1xuICAgIGlmIChtLl9wZiA9PSBudWxsKSB7XG4gICAgICAgIG0uX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xuICAgIH1cbiAgICByZXR1cm4gbS5fcGY7XG59XG5cbnZhciBzb21lO1xuaWYgKEFycmF5LnByb3RvdHlwZS5zb21lKSB7XG4gICAgc29tZSA9IEFycmF5LnByb3RvdHlwZS5zb21lO1xufSBlbHNlIHtcbiAgICBzb21lID0gZnVuY3Rpb24gKGZ1bikge1xuICAgICAgICB2YXIgdCA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgdmFyIGxlbiA9IHQubGVuZ3RoID4+PiAwO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpIGluIHQgJiYgZnVuLmNhbGwodGhpcywgdFtpXSwgaSwgdCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xufVxuXG52YXIgc29tZSQxID0gc29tZTtcblxuZnVuY3Rpb24gaXNWYWxpZChtKSB7XG4gICAgaWYgKG0uX2lzVmFsaWQgPT0gbnVsbCkge1xuICAgICAgICB2YXIgZmxhZ3MgPSBnZXRQYXJzaW5nRmxhZ3MobSk7XG4gICAgICAgIHZhciBwYXJzZWRQYXJ0cyA9IHNvbWUkMS5jYWxsKGZsYWdzLnBhcnNlZERhdGVQYXJ0cywgZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHJldHVybiBpICE9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgaXNOb3dWYWxpZCA9ICFpc05hTihtLl9kLmdldFRpbWUoKSkgJiZcbiAgICAgICAgICAgIGZsYWdzLm92ZXJmbG93IDwgMCAmJlxuICAgICAgICAgICAgIWZsYWdzLmVtcHR5ICYmXG4gICAgICAgICAgICAhZmxhZ3MuaW52YWxpZE1vbnRoICYmXG4gICAgICAgICAgICAhZmxhZ3MuaW52YWxpZFdlZWtkYXkgJiZcbiAgICAgICAgICAgICFmbGFncy5udWxsSW5wdXQgJiZcbiAgICAgICAgICAgICFmbGFncy5pbnZhbGlkRm9ybWF0ICYmXG4gICAgICAgICAgICAhZmxhZ3MudXNlckludmFsaWRhdGVkICYmXG4gICAgICAgICAgICAoIWZsYWdzLm1lcmlkaWVtIHx8IChmbGFncy5tZXJpZGllbSAmJiBwYXJzZWRQYXJ0cykpO1xuXG4gICAgICAgIGlmIChtLl9zdHJpY3QpIHtcbiAgICAgICAgICAgIGlzTm93VmFsaWQgPSBpc05vd1ZhbGlkICYmXG4gICAgICAgICAgICAgICAgZmxhZ3MuY2hhcnNMZWZ0T3ZlciA9PT0gMCAmJlxuICAgICAgICAgICAgICAgIGZsYWdzLnVudXNlZFRva2Vucy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgICAgICBmbGFncy5iaWdIb3VyID09PSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoT2JqZWN0LmlzRnJvemVuID09IG51bGwgfHwgIU9iamVjdC5pc0Zyb3plbihtKSkge1xuICAgICAgICAgICAgbS5faXNWYWxpZCA9IGlzTm93VmFsaWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaXNOb3dWYWxpZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbS5faXNWYWxpZDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSW52YWxpZCAoZmxhZ3MpIHtcbiAgICB2YXIgbSA9IGNyZWF0ZVVUQyhOYU4pO1xuICAgIGlmIChmbGFncyAhPSBudWxsKSB7XG4gICAgICAgIGV4dGVuZChnZXRQYXJzaW5nRmxhZ3MobSksIGZsYWdzKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhtKS51c2VySW52YWxpZGF0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBtO1xufVxuXG4vLyBQbHVnaW5zIHRoYXQgYWRkIHByb3BlcnRpZXMgc2hvdWxkIGFsc28gYWRkIHRoZSBrZXkgaGVyZSAobnVsbCB2YWx1ZSksXG4vLyBzbyB3ZSBjYW4gcHJvcGVybHkgY2xvbmUgb3Vyc2VsdmVzLlxudmFyIG1vbWVudFByb3BlcnRpZXMgPSBob29rcy5tb21lbnRQcm9wZXJ0aWVzID0gW107XG5cbmZ1bmN0aW9uIGNvcHlDb25maWcodG8sIGZyb20pIHtcbiAgICB2YXIgaSwgcHJvcCwgdmFsO1xuXG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9pc0FNb21lbnRPYmplY3QpKSB7XG4gICAgICAgIHRvLl9pc0FNb21lbnRPYmplY3QgPSBmcm9tLl9pc0FNb21lbnRPYmplY3Q7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5faSkpIHtcbiAgICAgICAgdG8uX2kgPSBmcm9tLl9pO1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2YpKSB7XG4gICAgICAgIHRvLl9mID0gZnJvbS5fZjtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9sKSkge1xuICAgICAgICB0by5fbCA9IGZyb20uX2w7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fc3RyaWN0KSkge1xuICAgICAgICB0by5fc3RyaWN0ID0gZnJvbS5fc3RyaWN0O1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX3R6bSkpIHtcbiAgICAgICAgdG8uX3R6bSA9IGZyb20uX3R6bTtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9pc1VUQykpIHtcbiAgICAgICAgdG8uX2lzVVRDID0gZnJvbS5faXNVVEM7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fb2Zmc2V0KSkge1xuICAgICAgICB0by5fb2Zmc2V0ID0gZnJvbS5fb2Zmc2V0O1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX3BmKSkge1xuICAgICAgICB0by5fcGYgPSBnZXRQYXJzaW5nRmxhZ3MoZnJvbSk7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fbG9jYWxlKSkge1xuICAgICAgICB0by5fbG9jYWxlID0gZnJvbS5fbG9jYWxlO1xuICAgIH1cblxuICAgIGlmIChtb21lbnRQcm9wZXJ0aWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG1vbWVudFByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHByb3AgPSBtb21lbnRQcm9wZXJ0aWVzW2ldO1xuICAgICAgICAgICAgdmFsID0gZnJvbVtwcm9wXTtcbiAgICAgICAgICAgIGlmICghaXNVbmRlZmluZWQodmFsKSkge1xuICAgICAgICAgICAgICAgIHRvW3Byb3BdID0gdmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRvO1xufVxuXG52YXIgdXBkYXRlSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4vLyBNb21lbnQgcHJvdG90eXBlIG9iamVjdFxuZnVuY3Rpb24gTW9tZW50KGNvbmZpZykge1xuICAgIGNvcHlDb25maWcodGhpcywgY29uZmlnKTtcbiAgICB0aGlzLl9kID0gbmV3IERhdGUoY29uZmlnLl9kICE9IG51bGwgPyBjb25maWcuX2QuZ2V0VGltZSgpIDogTmFOKTtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHRoaXMuX2QgPSBuZXcgRGF0ZShOYU4pO1xuICAgIH1cbiAgICAvLyBQcmV2ZW50IGluZmluaXRlIGxvb3AgaW4gY2FzZSB1cGRhdGVPZmZzZXQgY3JlYXRlcyBuZXcgbW9tZW50XG4gICAgLy8gb2JqZWN0cy5cbiAgICBpZiAodXBkYXRlSW5Qcm9ncmVzcyA9PT0gZmFsc2UpIHtcbiAgICAgICAgdXBkYXRlSW5Qcm9ncmVzcyA9IHRydWU7XG4gICAgICAgIGhvb2tzLnVwZGF0ZU9mZnNldCh0aGlzKTtcbiAgICAgICAgdXBkYXRlSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNNb21lbnQgKG9iaikge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBNb21lbnQgfHwgKG9iaiAhPSBudWxsICYmIG9iai5faXNBTW9tZW50T2JqZWN0ICE9IG51bGwpO1xufVxuXG5mdW5jdGlvbiBhYnNGbG9vciAobnVtYmVyKSB7XG4gICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgLy8gLTAgLT4gMFxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlcikgfHwgMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdG9JbnQoYXJndW1lbnRGb3JDb2VyY2lvbikge1xuICAgIHZhciBjb2VyY2VkTnVtYmVyID0gK2FyZ3VtZW50Rm9yQ29lcmNpb24sXG4gICAgICAgIHZhbHVlID0gMDtcblxuICAgIGlmIChjb2VyY2VkTnVtYmVyICE9PSAwICYmIGlzRmluaXRlKGNvZXJjZWROdW1iZXIpKSB7XG4gICAgICAgIHZhbHVlID0gYWJzRmxvb3IoY29lcmNlZE51bWJlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG4vLyBjb21wYXJlIHR3byBhcnJheXMsIHJldHVybiB0aGUgbnVtYmVyIG9mIGRpZmZlcmVuY2VzXG5mdW5jdGlvbiBjb21wYXJlQXJyYXlzKGFycmF5MSwgYXJyYXkyLCBkb250Q29udmVydCkge1xuICAgIHZhciBsZW4gPSBNYXRoLm1pbihhcnJheTEubGVuZ3RoLCBhcnJheTIubGVuZ3RoKSxcbiAgICAgICAgbGVuZ3RoRGlmZiA9IE1hdGguYWJzKGFycmF5MS5sZW5ndGggLSBhcnJheTIubGVuZ3RoKSxcbiAgICAgICAgZGlmZnMgPSAwLFxuICAgICAgICBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoKGRvbnRDb252ZXJ0ICYmIGFycmF5MVtpXSAhPT0gYXJyYXkyW2ldKSB8fFxuICAgICAgICAgICAgKCFkb250Q29udmVydCAmJiB0b0ludChhcnJheTFbaV0pICE9PSB0b0ludChhcnJheTJbaV0pKSkge1xuICAgICAgICAgICAgZGlmZnMrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlmZnMgKyBsZW5ndGhEaWZmO1xufVxuXG5mdW5jdGlvbiB3YXJuKG1zZykge1xuICAgIGlmIChob29rcy5zdXBwcmVzc0RlcHJlY2F0aW9uV2FybmluZ3MgPT09IGZhbHNlICYmXG4gICAgICAgICAgICAodHlwZW9mIGNvbnNvbGUgIT09ICAndW5kZWZpbmVkJykgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignRGVwcmVjYXRpb24gd2FybmluZzogJyArIG1zZyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkZXByZWNhdGUobXNnLCBmbikge1xuICAgIHZhciBmaXJzdFRpbWUgPSB0cnVlO1xuXG4gICAgcmV0dXJuIGV4dGVuZChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChob29rcy5kZXByZWNhdGlvbkhhbmRsZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgaG9va3MuZGVwcmVjYXRpb25IYW5kbGVyKG51bGwsIG1zZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpcnN0VGltZSkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIHZhciBhcmc7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGFyZyA9ICcnO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzW2ldID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBhcmcgKz0gJ1xcblsnICsgaSArICddICc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhcmd1bWVudHNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZyArPSBrZXkgKyAnOiAnICsgYXJndW1lbnRzWzBdW2tleV0gKyAnLCAnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy5zbGljZSgwLCAtMik7IC8vIFJlbW92ZSB0cmFpbGluZyBjb21tYSBhbmQgc3BhY2VcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChhcmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2Fybihtc2cgKyAnXFxuQXJndW1lbnRzOiAnICsgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncykuam9pbignJykgKyAnXFxuJyArIChuZXcgRXJyb3IoKSkuc3RhY2spO1xuICAgICAgICAgICAgZmlyc3RUaW1lID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSwgZm4pO1xufVxuXG52YXIgZGVwcmVjYXRpb25zID0ge307XG5cbmZ1bmN0aW9uIGRlcHJlY2F0ZVNpbXBsZShuYW1lLCBtc2cpIHtcbiAgICBpZiAoaG9va3MuZGVwcmVjYXRpb25IYW5kbGVyICE9IG51bGwpIHtcbiAgICAgICAgaG9va3MuZGVwcmVjYXRpb25IYW5kbGVyKG5hbWUsIG1zZyk7XG4gICAgfVxuICAgIGlmICghZGVwcmVjYXRpb25zW25hbWVdKSB7XG4gICAgICAgIHdhcm4obXNnKTtcbiAgICAgICAgZGVwcmVjYXRpb25zW25hbWVdID0gdHJ1ZTtcbiAgICB9XG59XG5cbmhvb2tzLnN1cHByZXNzRGVwcmVjYXRpb25XYXJuaW5ncyA9IGZhbHNlO1xuaG9va3MuZGVwcmVjYXRpb25IYW5kbGVyID0gbnVsbDtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEZ1bmN0aW9uIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG59XG5cbmZ1bmN0aW9uIHNldCAoY29uZmlnKSB7XG4gICAgdmFyIHByb3AsIGk7XG4gICAgZm9yIChpIGluIGNvbmZpZykge1xuICAgICAgICBwcm9wID0gY29uZmlnW2ldO1xuICAgICAgICBpZiAoaXNGdW5jdGlvbihwcm9wKSkge1xuICAgICAgICAgICAgdGhpc1tpXSA9IHByb3A7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzWydfJyArIGldID0gcHJvcDtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9jb25maWcgPSBjb25maWc7XG4gICAgLy8gTGVuaWVudCBvcmRpbmFsIHBhcnNpbmcgYWNjZXB0cyBqdXN0IGEgbnVtYmVyIGluIGFkZGl0aW9uIHRvXG4gICAgLy8gbnVtYmVyICsgKHBvc3NpYmx5KSBzdHVmZiBjb21pbmcgZnJvbSBfZGF5T2ZNb250aE9yZGluYWxQYXJzZS5cbiAgICAvLyBUT0RPOiBSZW1vdmUgXCJvcmRpbmFsUGFyc2VcIiBmYWxsYmFjayBpbiBuZXh0IG1ham9yIHJlbGVhc2UuXG4gICAgdGhpcy5fZGF5T2ZNb250aE9yZGluYWxQYXJzZUxlbmllbnQgPSBuZXcgUmVnRXhwKFxuICAgICAgICAodGhpcy5fZGF5T2ZNb250aE9yZGluYWxQYXJzZS5zb3VyY2UgfHwgdGhpcy5fb3JkaW5hbFBhcnNlLnNvdXJjZSkgK1xuICAgICAgICAgICAgJ3wnICsgKC9cXGR7MSwyfS8pLnNvdXJjZSk7XG59XG5cbmZ1bmN0aW9uIG1lcmdlQ29uZmlncyhwYXJlbnRDb25maWcsIGNoaWxkQ29uZmlnKSB7XG4gICAgdmFyIHJlcyA9IGV4dGVuZCh7fSwgcGFyZW50Q29uZmlnKSwgcHJvcDtcbiAgICBmb3IgKHByb3AgaW4gY2hpbGRDb25maWcpIHtcbiAgICAgICAgaWYgKGhhc093blByb3AoY2hpbGRDb25maWcsIHByb3ApKSB7XG4gICAgICAgICAgICBpZiAoaXNPYmplY3QocGFyZW50Q29uZmlnW3Byb3BdKSAmJiBpc09iamVjdChjaGlsZENvbmZpZ1twcm9wXSkpIHtcbiAgICAgICAgICAgICAgICByZXNbcHJvcF0gPSB7fTtcbiAgICAgICAgICAgICAgICBleHRlbmQocmVzW3Byb3BdLCBwYXJlbnRDb25maWdbcHJvcF0pO1xuICAgICAgICAgICAgICAgIGV4dGVuZChyZXNbcHJvcF0sIGNoaWxkQ29uZmlnW3Byb3BdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hpbGRDb25maWdbcHJvcF0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJlc1twcm9wXSA9IGNoaWxkQ29uZmlnW3Byb3BdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgcmVzW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAocHJvcCBpbiBwYXJlbnRDb25maWcpIHtcbiAgICAgICAgaWYgKGhhc093blByb3AocGFyZW50Q29uZmlnLCBwcm9wKSAmJlxuICAgICAgICAgICAgICAgICFoYXNPd25Qcm9wKGNoaWxkQ29uZmlnLCBwcm9wKSAmJlxuICAgICAgICAgICAgICAgIGlzT2JqZWN0KHBhcmVudENvbmZpZ1twcm9wXSkpIHtcbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSBjaGFuZ2VzIHRvIHByb3BlcnRpZXMgZG9uJ3QgbW9kaWZ5IHBhcmVudCBjb25maWdcbiAgICAgICAgICAgIHJlc1twcm9wXSA9IGV4dGVuZCh7fSwgcmVzW3Byb3BdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBMb2NhbGUoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZyAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuc2V0KGNvbmZpZyk7XG4gICAgfVxufVxuXG52YXIga2V5cztcblxuaWYgKE9iamVjdC5rZXlzKSB7XG4gICAga2V5cyA9IE9iamVjdC5rZXlzO1xufSBlbHNlIHtcbiAgICBrZXlzID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgaSwgcmVzID0gW107XG4gICAgICAgIGZvciAoaSBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wKG9iaiwgaSkpIHtcbiAgICAgICAgICAgICAgICByZXMucHVzaChpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG59XG5cbnZhciBrZXlzJDEgPSBrZXlzO1xuXG52YXIgZGVmYXVsdENhbGVuZGFyID0ge1xuICAgIHNhbWVEYXkgOiAnW1RvZGF5IGF0XSBMVCcsXG4gICAgbmV4dERheSA6ICdbVG9tb3Jyb3cgYXRdIExUJyxcbiAgICBuZXh0V2VlayA6ICdkZGRkIFthdF0gTFQnLFxuICAgIGxhc3REYXkgOiAnW1llc3RlcmRheSBhdF0gTFQnLFxuICAgIGxhc3RXZWVrIDogJ1tMYXN0XSBkZGRkIFthdF0gTFQnLFxuICAgIHNhbWVFbHNlIDogJ0wnXG59O1xuXG5mdW5jdGlvbiBjYWxlbmRhciAoa2V5LCBtb20sIG5vdykge1xuICAgIHZhciBvdXRwdXQgPSB0aGlzLl9jYWxlbmRhcltrZXldIHx8IHRoaXMuX2NhbGVuZGFyWydzYW1lRWxzZSddO1xuICAgIHJldHVybiBpc0Z1bmN0aW9uKG91dHB1dCkgPyBvdXRwdXQuY2FsbChtb20sIG5vdykgOiBvdXRwdXQ7XG59XG5cbnZhciBkZWZhdWx0TG9uZ0RhdGVGb3JtYXQgPSB7XG4gICAgTFRTICA6ICdoOm1tOnNzIEEnLFxuICAgIExUICAgOiAnaDptbSBBJyxcbiAgICBMICAgIDogJ01NL0REL1lZWVknLFxuICAgIExMICAgOiAnTU1NTSBELCBZWVlZJyxcbiAgICBMTEwgIDogJ01NTU0gRCwgWVlZWSBoOm1tIEEnLFxuICAgIExMTEwgOiAnZGRkZCwgTU1NTSBELCBZWVlZIGg6bW0gQSdcbn07XG5cbmZ1bmN0aW9uIGxvbmdEYXRlRm9ybWF0IChrZXkpIHtcbiAgICB2YXIgZm9ybWF0ID0gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XSxcbiAgICAgICAgZm9ybWF0VXBwZXIgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXkudG9VcHBlckNhc2UoKV07XG5cbiAgICBpZiAoZm9ybWF0IHx8ICFmb3JtYXRVcHBlcikge1xuICAgICAgICByZXR1cm4gZm9ybWF0O1xuICAgIH1cblxuICAgIHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleV0gPSBmb3JtYXRVcHBlci5yZXBsYWNlKC9NTU1NfE1NfEREfGRkZGQvZywgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsLnNsaWNlKDEpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleV07XG59XG5cbnZhciBkZWZhdWx0SW52YWxpZERhdGUgPSAnSW52YWxpZCBkYXRlJztcblxuZnVuY3Rpb24gaW52YWxpZERhdGUgKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnZhbGlkRGF0ZTtcbn1cblxudmFyIGRlZmF1bHRPcmRpbmFsID0gJyVkJztcbnZhciBkZWZhdWx0RGF5T2ZNb250aE9yZGluYWxQYXJzZSA9IC9cXGR7MSwyfS87XG5cbmZ1bmN0aW9uIG9yZGluYWwgKG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLl9vcmRpbmFsLnJlcGxhY2UoJyVkJywgbnVtYmVyKTtcbn1cblxudmFyIGRlZmF1bHRSZWxhdGl2ZVRpbWUgPSB7XG4gICAgZnV0dXJlIDogJ2luICVzJyxcbiAgICBwYXN0ICAgOiAnJXMgYWdvJyxcbiAgICBzICA6ICdhIGZldyBzZWNvbmRzJyxcbiAgICBzcyA6ICclZCBzZWNvbmRzJyxcbiAgICBtICA6ICdhIG1pbnV0ZScsXG4gICAgbW0gOiAnJWQgbWludXRlcycsXG4gICAgaCAgOiAnYW4gaG91cicsXG4gICAgaGggOiAnJWQgaG91cnMnLFxuICAgIGQgIDogJ2EgZGF5JyxcbiAgICBkZCA6ICclZCBkYXlzJyxcbiAgICBNICA6ICdhIG1vbnRoJyxcbiAgICBNTSA6ICclZCBtb250aHMnLFxuICAgIHkgIDogJ2EgeWVhcicsXG4gICAgeXkgOiAnJWQgeWVhcnMnXG59O1xuXG5mdW5jdGlvbiByZWxhdGl2ZVRpbWUgKG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkge1xuICAgIHZhciBvdXRwdXQgPSB0aGlzLl9yZWxhdGl2ZVRpbWVbc3RyaW5nXTtcbiAgICByZXR1cm4gKGlzRnVuY3Rpb24ob3V0cHV0KSkgP1xuICAgICAgICBvdXRwdXQobnVtYmVyLCB3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKSA6XG4gICAgICAgIG91dHB1dC5yZXBsYWNlKC8lZC9pLCBudW1iZXIpO1xufVxuXG5mdW5jdGlvbiBwYXN0RnV0dXJlIChkaWZmLCBvdXRwdXQpIHtcbiAgICB2YXIgZm9ybWF0ID0gdGhpcy5fcmVsYXRpdmVUaW1lW2RpZmYgPiAwID8gJ2Z1dHVyZScgOiAncGFzdCddO1xuICAgIHJldHVybiBpc0Z1bmN0aW9uKGZvcm1hdCkgPyBmb3JtYXQob3V0cHV0KSA6IGZvcm1hdC5yZXBsYWNlKC8lcy9pLCBvdXRwdXQpO1xufVxuXG52YXIgYWxpYXNlcyA9IHt9O1xuXG5mdW5jdGlvbiBhZGRVbml0QWxpYXMgKHVuaXQsIHNob3J0aGFuZCkge1xuICAgIHZhciBsb3dlckNhc2UgPSB1bml0LnRvTG93ZXJDYXNlKCk7XG4gICAgYWxpYXNlc1tsb3dlckNhc2VdID0gYWxpYXNlc1tsb3dlckNhc2UgKyAncyddID0gYWxpYXNlc1tzaG9ydGhhbmRdID0gdW5pdDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVW5pdHModW5pdHMpIHtcbiAgICByZXR1cm4gdHlwZW9mIHVuaXRzID09PSAnc3RyaW5nJyA/IGFsaWFzZXNbdW5pdHNdIHx8IGFsaWFzZXNbdW5pdHMudG9Mb3dlckNhc2UoKV0gOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU9iamVjdFVuaXRzKGlucHV0T2JqZWN0KSB7XG4gICAgdmFyIG5vcm1hbGl6ZWRJbnB1dCA9IHt9LFxuICAgICAgICBub3JtYWxpemVkUHJvcCxcbiAgICAgICAgcHJvcDtcblxuICAgIGZvciAocHJvcCBpbiBpbnB1dE9iamVjdCkge1xuICAgICAgICBpZiAoaGFzT3duUHJvcChpbnB1dE9iamVjdCwgcHJvcCkpIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wID0gbm9ybWFsaXplVW5pdHMocHJvcCk7XG4gICAgICAgICAgICBpZiAobm9ybWFsaXplZFByb3ApIHtcbiAgICAgICAgICAgICAgICBub3JtYWxpemVkSW5wdXRbbm9ybWFsaXplZFByb3BdID0gaW5wdXRPYmplY3RbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbm9ybWFsaXplZElucHV0O1xufVxuXG52YXIgcHJpb3JpdGllcyA9IHt9O1xuXG5mdW5jdGlvbiBhZGRVbml0UHJpb3JpdHkodW5pdCwgcHJpb3JpdHkpIHtcbiAgICBwcmlvcml0aWVzW3VuaXRdID0gcHJpb3JpdHk7XG59XG5cbmZ1bmN0aW9uIGdldFByaW9yaXRpemVkVW5pdHModW5pdHNPYmopIHtcbiAgICB2YXIgdW5pdHMgPSBbXTtcbiAgICBmb3IgKHZhciB1IGluIHVuaXRzT2JqKSB7XG4gICAgICAgIHVuaXRzLnB1c2goe3VuaXQ6IHUsIHByaW9yaXR5OiBwcmlvcml0aWVzW3VdfSk7XG4gICAgfVxuICAgIHVuaXRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgIH0pO1xuICAgIHJldHVybiB1bml0cztcbn1cblxuZnVuY3Rpb24gbWFrZUdldFNldCAodW5pdCwga2VlcFRpbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzZXQkMSh0aGlzLCB1bml0LCB2YWx1ZSk7XG4gICAgICAgICAgICBob29rcy51cGRhdGVPZmZzZXQodGhpcywga2VlcFRpbWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0KHRoaXMsIHVuaXQpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0IChtb20sIHVuaXQpIHtcbiAgICByZXR1cm4gbW9tLmlzVmFsaWQoKSA/XG4gICAgICAgIG1vbS5fZFsnZ2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSgpIDogTmFOO1xufVxuXG5mdW5jdGlvbiBzZXQkMSAobW9tLCB1bml0LCB2YWx1ZSkge1xuICAgIGlmIChtb20uaXNWYWxpZCgpKSB7XG4gICAgICAgIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSh2YWx1ZSk7XG4gICAgfVxufVxuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIHN0cmluZ0dldCAodW5pdHMpIHtcbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICBpZiAoaXNGdW5jdGlvbih0aGlzW3VuaXRzXSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHNdKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufVxuXG5cbmZ1bmN0aW9uIHN0cmluZ1NldCAodW5pdHMsIHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB1bml0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVPYmplY3RVbml0cyh1bml0cyk7XG4gICAgICAgIHZhciBwcmlvcml0aXplZCA9IGdldFByaW9yaXRpemVkVW5pdHModW5pdHMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByaW9yaXRpemVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzW3ByaW9yaXRpemVkW2ldLnVuaXRdKHVuaXRzW3ByaW9yaXRpemVkW2ldLnVuaXRdKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICBpZiAoaXNGdW5jdGlvbih0aGlzW3VuaXRzXSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3VuaXRzXSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIHplcm9GaWxsKG51bWJlciwgdGFyZ2V0TGVuZ3RoLCBmb3JjZVNpZ24pIHtcbiAgICB2YXIgYWJzTnVtYmVyID0gJycgKyBNYXRoLmFicyhudW1iZXIpLFxuICAgICAgICB6ZXJvc1RvRmlsbCA9IHRhcmdldExlbmd0aCAtIGFic051bWJlci5sZW5ndGgsXG4gICAgICAgIHNpZ24gPSBudW1iZXIgPj0gMDtcbiAgICByZXR1cm4gKHNpZ24gPyAoZm9yY2VTaWduID8gJysnIDogJycpIDogJy0nKSArXG4gICAgICAgIE1hdGgucG93KDEwLCBNYXRoLm1heCgwLCB6ZXJvc1RvRmlsbCkpLnRvU3RyaW5nKCkuc3Vic3RyKDEpICsgYWJzTnVtYmVyO1xufVxuXG52YXIgZm9ybWF0dGluZ1Rva2VucyA9IC8oXFxbW15cXFtdKlxcXSl8KFxcXFwpPyhbSGhdbW0oc3MpP3xNb3xNTT9NP00/fERvfERERG98REQ/RD9EP3xkZGQ/ZD98ZG8/fHdbb3x3XT98V1tvfFddP3xRbz98WVlZWVlZfFlZWVlZfFlZWVl8WVl8Z2coZ2dnPyk/fEdHKEdHRz8pP3xlfEV8YXxBfGhoP3xISD98a2s/fG1tP3xzcz98U3sxLDl9fHh8WHx6ej98Wlo/fC4pL2c7XG5cbnZhciBsb2NhbEZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTFRTfExUfExMP0w/TD98bHsxLDR9KS9nO1xuXG52YXIgZm9ybWF0RnVuY3Rpb25zID0ge307XG5cbnZhciBmb3JtYXRUb2tlbkZ1bmN0aW9ucyA9IHt9O1xuXG4vLyB0b2tlbjogICAgJ00nXG4vLyBwYWRkZWQ6ICAgWydNTScsIDJdXG4vLyBvcmRpbmFsOiAgJ01vJ1xuLy8gY2FsbGJhY2s6IGZ1bmN0aW9uICgpIHsgdGhpcy5tb250aCgpICsgMSB9XG5mdW5jdGlvbiBhZGRGb3JtYXRUb2tlbiAodG9rZW4sIHBhZGRlZCwgb3JkaW5hbCwgY2FsbGJhY2spIHtcbiAgICB2YXIgZnVuYyA9IGNhbGxiYWNrO1xuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGZ1bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1tjYWxsYmFja10oKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHRva2VuKSB7XG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW3Rva2VuXSA9IGZ1bmM7XG4gICAgfVxuICAgIGlmIChwYWRkZWQpIHtcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbcGFkZGVkWzBdXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB6ZXJvRmlsbChmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksIHBhZGRlZFsxXSwgcGFkZGVkWzJdKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKG9yZGluYWwpIHtcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbb3JkaW5hbF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkub3JkaW5hbChmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksIHRva2VuKTtcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUZvcm1hdHRpbmdUb2tlbnMoaW5wdXQpIHtcbiAgICBpZiAoaW5wdXQubWF0Y2goL1xcW1tcXHNcXFNdLykpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL15cXFt8XFxdJC9nLCAnJyk7XG4gICAgfVxuICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXFxcL2csICcnKTtcbn1cblxuZnVuY3Rpb24gbWFrZUZvcm1hdEZ1bmN0aW9uKGZvcm1hdCkge1xuICAgIHZhciBhcnJheSA9IGZvcm1hdC5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSwgaSwgbGVuZ3RoO1xuXG4gICAgZm9yIChpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGZvcm1hdFRva2VuRnVuY3Rpb25zW2FycmF5W2ldXSkge1xuICAgICAgICAgICAgYXJyYXlbaV0gPSBmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcnJheVtpXSA9IHJlbW92ZUZvcm1hdHRpbmdUb2tlbnMoYXJyYXlbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChtb20pIHtcbiAgICAgICAgdmFyIG91dHB1dCA9ICcnLCBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG91dHB1dCArPSBpc0Z1bmN0aW9uKGFycmF5W2ldKSA/IGFycmF5W2ldLmNhbGwobW9tLCBmb3JtYXQpIDogYXJyYXlbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xufVxuXG4vLyBmb3JtYXQgZGF0ZSB1c2luZyBuYXRpdmUgZGF0ZSBvYmplY3RcbmZ1bmN0aW9uIGZvcm1hdE1vbWVudChtLCBmb3JtYXQpIHtcbiAgICBpZiAoIW0uaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBtLmxvY2FsZURhdGEoKS5pbnZhbGlkRGF0ZSgpO1xuICAgIH1cblxuICAgIGZvcm1hdCA9IGV4cGFuZEZvcm1hdChmb3JtYXQsIG0ubG9jYWxlRGF0YSgpKTtcbiAgICBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XSA9IGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdIHx8IG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpO1xuXG4gICAgcmV0dXJuIGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdKG0pO1xufVxuXG5mdW5jdGlvbiBleHBhbmRGb3JtYXQoZm9ybWF0LCBsb2NhbGUpIHtcbiAgICB2YXIgaSA9IDU7XG5cbiAgICBmdW5jdGlvbiByZXBsYWNlTG9uZ0RhdGVGb3JtYXRUb2tlbnMoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS5sb25nRGF0ZUZvcm1hdChpbnB1dCkgfHwgaW5wdXQ7XG4gICAgfVxuXG4gICAgbG9jYWxGb3JtYXR0aW5nVG9rZW5zLmxhc3RJbmRleCA9IDA7XG4gICAgd2hpbGUgKGkgPj0gMCAmJiBsb2NhbEZvcm1hdHRpbmdUb2tlbnMudGVzdChmb3JtYXQpKSB7XG4gICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKGxvY2FsRm9ybWF0dGluZ1Rva2VucywgcmVwbGFjZUxvbmdEYXRlRm9ybWF0VG9rZW5zKTtcbiAgICAgICAgbG9jYWxGb3JtYXR0aW5nVG9rZW5zLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIGkgLT0gMTtcbiAgICB9XG5cbiAgICByZXR1cm4gZm9ybWF0O1xufVxuXG52YXIgbWF0Y2gxICAgICAgICAgPSAvXFxkLzsgICAgICAgICAgICAvLyAgICAgICAwIC0gOVxudmFyIG1hdGNoMiAgICAgICAgID0gL1xcZFxcZC87ICAgICAgICAgIC8vICAgICAgMDAgLSA5OVxudmFyIG1hdGNoMyAgICAgICAgID0gL1xcZHszfS87ICAgICAgICAgLy8gICAgIDAwMCAtIDk5OVxudmFyIG1hdGNoNCAgICAgICAgID0gL1xcZHs0fS87ICAgICAgICAgLy8gICAgMDAwMCAtIDk5OTlcbnZhciBtYXRjaDYgICAgICAgICA9IC9bKy1dP1xcZHs2fS87ICAgIC8vIC05OTk5OTkgLSA5OTk5OTlcbnZhciBtYXRjaDF0bzIgICAgICA9IC9cXGRcXGQ/LzsgICAgICAgICAvLyAgICAgICAwIC0gOTlcbnZhciBtYXRjaDN0bzQgICAgICA9IC9cXGRcXGRcXGRcXGQ/LzsgICAgIC8vICAgICA5OTkgLSA5OTk5XG52YXIgbWF0Y2g1dG82ICAgICAgPSAvXFxkXFxkXFxkXFxkXFxkXFxkPy87IC8vICAgOTk5OTkgLSA5OTk5OTlcbnZhciBtYXRjaDF0bzMgICAgICA9IC9cXGR7MSwzfS87ICAgICAgIC8vICAgICAgIDAgLSA5OTlcbnZhciBtYXRjaDF0bzQgICAgICA9IC9cXGR7MSw0fS87ICAgICAgIC8vICAgICAgIDAgLSA5OTk5XG52YXIgbWF0Y2gxdG82ICAgICAgPSAvWystXT9cXGR7MSw2fS87ICAvLyAtOTk5OTk5IC0gOTk5OTk5XG5cbnZhciBtYXRjaFVuc2lnbmVkICA9IC9cXGQrLzsgICAgICAgICAgIC8vICAgICAgIDAgLSBpbmZcbnZhciBtYXRjaFNpZ25lZCAgICA9IC9bKy1dP1xcZCsvOyAgICAgIC8vICAgIC1pbmYgLSBpbmZcblxudmFyIG1hdGNoT2Zmc2V0ICAgID0gL1p8WystXVxcZFxcZDo/XFxkXFxkL2dpOyAvLyArMDA6MDAgLTAwOjAwICswMDAwIC0wMDAwIG9yIFpcbnZhciBtYXRjaFNob3J0T2Zmc2V0ID0gL1p8WystXVxcZFxcZCg/Ojo/XFxkXFxkKT8vZ2k7IC8vICswMCAtMDAgKzAwOjAwIC0wMDowMCArMDAwMCAtMDAwMCBvciBaXG5cbnZhciBtYXRjaFRpbWVzdGFtcCA9IC9bKy1dP1xcZCsoXFwuXFxkezEsM30pPy87IC8vIDEyMzQ1Njc4OSAxMjM0NTY3ODkuMTIzXG5cbi8vIGFueSB3b3JkIChvciB0d28pIGNoYXJhY3RlcnMgb3IgbnVtYmVycyBpbmNsdWRpbmcgdHdvL3RocmVlIHdvcmQgbW9udGggaW4gYXJhYmljLlxuLy8gaW5jbHVkZXMgc2NvdHRpc2ggZ2FlbGljIHR3byB3b3JkIGFuZCBoeXBoZW5hdGVkIG1vbnRoc1xudmFyIG1hdGNoV29yZCA9IC9bMC05XSpbJ2EtelxcdTAwQTAtXFx1MDVGRlxcdTA3MDAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0rfFtcXHUwNjAwLVxcdTA2RkZcXC9dKyhcXHMqP1tcXHUwNjAwLVxcdTA2RkZdKyl7MSwyfS9pO1xuXG5cbnZhciByZWdleGVzID0ge307XG5cbmZ1bmN0aW9uIGFkZFJlZ2V4VG9rZW4gKHRva2VuLCByZWdleCwgc3RyaWN0UmVnZXgpIHtcbiAgICByZWdleGVzW3Rva2VuXSA9IGlzRnVuY3Rpb24ocmVnZXgpID8gcmVnZXggOiBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZURhdGEpIHtcbiAgICAgICAgcmV0dXJuIChpc1N0cmljdCAmJiBzdHJpY3RSZWdleCkgPyBzdHJpY3RSZWdleCA6IHJlZ2V4O1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldFBhcnNlUmVnZXhGb3JUb2tlbiAodG9rZW4sIGNvbmZpZykge1xuICAgIGlmICghaGFzT3duUHJvcChyZWdleGVzLCB0b2tlbikpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodW5lc2NhcGVGb3JtYXQodG9rZW4pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVnZXhlc1t0b2tlbl0oY29uZmlnLl9zdHJpY3QsIGNvbmZpZy5fbG9jYWxlKTtcbn1cblxuLy8gQ29kZSBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzU2MTQ5My9pcy10aGVyZS1hLXJlZ2V4cC1lc2NhcGUtZnVuY3Rpb24taW4tamF2YXNjcmlwdFxuZnVuY3Rpb24gdW5lc2NhcGVGb3JtYXQocykge1xuICAgIHJldHVybiByZWdleEVzY2FwZShzLnJlcGxhY2UoJ1xcXFwnLCAnJykucmVwbGFjZSgvXFxcXChcXFspfFxcXFwoXFxdKXxcXFsoW15cXF1cXFtdKilcXF18XFxcXCguKS9nLCBmdW5jdGlvbiAobWF0Y2hlZCwgcDEsIHAyLCBwMywgcDQpIHtcbiAgICAgICAgcmV0dXJuIHAxIHx8IHAyIHx8IHAzIHx8IHA0O1xuICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gcmVnZXhFc2NhcGUocykge1xuICAgIHJldHVybiBzLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xufVxuXG52YXIgdG9rZW5zID0ge307XG5cbmZ1bmN0aW9uIGFkZFBhcnNlVG9rZW4gKHRva2VuLCBjYWxsYmFjaykge1xuICAgIHZhciBpLCBmdW5jID0gY2FsbGJhY2s7XG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdG9rZW4gPSBbdG9rZW5dO1xuICAgIH1cbiAgICBpZiAoaXNOdW1iZXIoY2FsbGJhY2spKSB7XG4gICAgICAgIGZ1bmMgPSBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgICAgICBhcnJheVtjYWxsYmFja10gPSB0b0ludChpbnB1dCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCB0b2tlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b2tlbnNbdG9rZW5baV1dID0gZnVuYztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFkZFdlZWtQYXJzZVRva2VuICh0b2tlbiwgY2FsbGJhY2spIHtcbiAgICBhZGRQYXJzZVRva2VuKHRva2VuLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgIGNvbmZpZy5fdyA9IGNvbmZpZy5fdyB8fCB7fTtcbiAgICAgICAgY2FsbGJhY2soaW5wdXQsIGNvbmZpZy5fdywgY29uZmlnLCB0b2tlbik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGFkZFRpbWVUb0FycmF5RnJvbVRva2VuKHRva2VuLCBpbnB1dCwgY29uZmlnKSB7XG4gICAgaWYgKGlucHV0ICE9IG51bGwgJiYgaGFzT3duUHJvcCh0b2tlbnMsIHRva2VuKSkge1xuICAgICAgICB0b2tlbnNbdG9rZW5dKGlucHV0LCBjb25maWcuX2EsIGNvbmZpZywgdG9rZW4pO1xuICAgIH1cbn1cblxudmFyIFlFQVIgPSAwO1xudmFyIE1PTlRIID0gMTtcbnZhciBEQVRFID0gMjtcbnZhciBIT1VSID0gMztcbnZhciBNSU5VVEUgPSA0O1xudmFyIFNFQ09ORCA9IDU7XG52YXIgTUlMTElTRUNPTkQgPSA2O1xudmFyIFdFRUsgPSA3O1xudmFyIFdFRUtEQVkgPSA4O1xuXG52YXIgaW5kZXhPZjtcblxuaWYgKEFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgaW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mO1xufSBlbHNlIHtcbiAgICBpbmRleE9mID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgLy8gSSBrbm93XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IG8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfTtcbn1cblxudmFyIGluZGV4T2YkMSA9IGluZGV4T2Y7XG5cbmZ1bmN0aW9uIGRheXNJbk1vbnRoKHllYXIsIG1vbnRoKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKERhdGUuVVRDKHllYXIsIG1vbnRoICsgMSwgMCkpLmdldFVUQ0RhdGUoKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignTScsIFsnTU0nLCAyXSwgJ01vJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm1vbnRoKCkgKyAxO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdNTU0nLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1vbnRoc1Nob3J0KHRoaXMsIGZvcm1hdCk7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oJ01NTU0nLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1vbnRocyh0aGlzLCBmb3JtYXQpO1xufSk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdtb250aCcsICdNJyk7XG5cbi8vIFBSSU9SSVRZXG5cbmFkZFVuaXRQcmlvcml0eSgnbW9udGgnLCA4KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdNJywgICAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ01NJywgICBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdNTU0nLCAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLm1vbnRoc1Nob3J0UmVnZXgoaXNTdHJpY3QpO1xufSk7XG5hZGRSZWdleFRva2VuKCdNTU1NJywgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLm1vbnRoc1JlZ2V4KGlzU3RyaWN0KTtcbn0pO1xuXG5hZGRQYXJzZVRva2VuKFsnTScsICdNTSddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgYXJyYXlbTU9OVEhdID0gdG9JbnQoaW5wdXQpIC0gMTtcbn0pO1xuXG5hZGRQYXJzZVRva2VuKFsnTU1NJywgJ01NTU0nXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnLCB0b2tlbikge1xuICAgIHZhciBtb250aCA9IGNvbmZpZy5fbG9jYWxlLm1vbnRoc1BhcnNlKGlucHV0LCB0b2tlbiwgY29uZmlnLl9zdHJpY3QpO1xuICAgIC8vIGlmIHdlIGRpZG4ndCBmaW5kIGEgbW9udGggbmFtZSwgbWFyayB0aGUgZGF0ZSBhcyBpbnZhbGlkLlxuICAgIGlmIChtb250aCAhPSBudWxsKSB7XG4gICAgICAgIGFycmF5W01PTlRIXSA9IG1vbnRoO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmludmFsaWRNb250aCA9IGlucHV0O1xuICAgIH1cbn0pO1xuXG4vLyBMT0NBTEVTXG5cbnZhciBNT05USFNfSU5fRk9STUFUID0gL0Rbb0RdPyhcXFtbXlxcW1xcXV0qXFxdfFxccykrTU1NTT8vO1xudmFyIGRlZmF1bHRMb2NhbGVNb250aHMgPSAnSmFudWFyeV9GZWJydWFyeV9NYXJjaF9BcHJpbF9NYXlfSnVuZV9KdWx5X0F1Z3VzdF9TZXB0ZW1iZXJfT2N0b2Jlcl9Ob3ZlbWJlcl9EZWNlbWJlcicuc3BsaXQoJ18nKTtcbmZ1bmN0aW9uIGxvY2FsZU1vbnRocyAobSwgZm9ybWF0KSB7XG4gICAgaWYgKCFtKSB7XG4gICAgICAgIHJldHVybiBpc0FycmF5KHRoaXMuX21vbnRocykgPyB0aGlzLl9tb250aHMgOlxuICAgICAgICAgICAgdGhpcy5fbW9udGhzWydzdGFuZGFsb25lJ107XG4gICAgfVxuICAgIHJldHVybiBpc0FycmF5KHRoaXMuX21vbnRocykgPyB0aGlzLl9tb250aHNbbS5tb250aCgpXSA6XG4gICAgICAgIHRoaXMuX21vbnRoc1sodGhpcy5fbW9udGhzLmlzRm9ybWF0IHx8IE1PTlRIU19JTl9GT1JNQVQpLnRlc3QoZm9ybWF0KSA/ICdmb3JtYXQnIDogJ3N0YW5kYWxvbmUnXVttLm1vbnRoKCldO1xufVxuXG52YXIgZGVmYXVsdExvY2FsZU1vbnRoc1Nob3J0ID0gJ0phbl9GZWJfTWFyX0Fwcl9NYXlfSnVuX0p1bF9BdWdfU2VwX09jdF9Ob3ZfRGVjJy5zcGxpdCgnXycpO1xuZnVuY3Rpb24gbG9jYWxlTW9udGhzU2hvcnQgKG0sIGZvcm1hdCkge1xuICAgIGlmICghbSkge1xuICAgICAgICByZXR1cm4gaXNBcnJheSh0aGlzLl9tb250aHNTaG9ydCkgPyB0aGlzLl9tb250aHNTaG9ydCA6XG4gICAgICAgICAgICB0aGlzLl9tb250aHNTaG9ydFsnc3RhbmRhbG9uZSddO1xuICAgIH1cbiAgICByZXR1cm4gaXNBcnJheSh0aGlzLl9tb250aHNTaG9ydCkgPyB0aGlzLl9tb250aHNTaG9ydFttLm1vbnRoKCldIDpcbiAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRbTU9OVEhTX0lOX0ZPUk1BVC50ZXN0KGZvcm1hdCkgPyAnZm9ybWF0JyA6ICdzdGFuZGFsb25lJ11bbS5tb250aCgpXTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlU3RyaWN0UGFyc2UobW9udGhOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgIHZhciBpLCBpaSwgbW9tLCBsbGMgPSBtb250aE5hbWUudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICBpZiAoIXRoaXMuX21vbnRoc1BhcnNlKSB7XG4gICAgICAgIC8vIHRoaXMgaXMgbm90IHVzZWRcbiAgICAgICAgdGhpcy5fbW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fbG9uZ01vbnRoc1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX3Nob3J0TW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDEyOyArK2kpIHtcbiAgICAgICAgICAgIG1vbSA9IGNyZWF0ZVVUQyhbMjAwMCwgaV0pO1xuICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXSA9IHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZVtpXSA9IHRoaXMubW9udGhzKG1vbSwgJycpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdNTU0nKSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX3Nob3J0TW9udGhzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9sb25nTW9udGhzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ01NTScpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX2xvbmdNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX2xvbmdNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX3Nob3J0TW9udGhzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2NhbGVNb250aHNQYXJzZSAobW9udGhOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgIHZhciBpLCBtb20sIHJlZ2V4O1xuXG4gICAgaWYgKHRoaXMuX21vbnRoc1BhcnNlRXhhY3QpIHtcbiAgICAgICAgcmV0dXJuIGhhbmRsZVN0cmljdFBhcnNlLmNhbGwodGhpcywgbW9udGhOYW1lLCBmb3JtYXQsIHN0cmljdCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZSkge1xuICAgICAgICB0aGlzLl9tb250aHNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZSA9IFtdO1xuICAgIH1cblxuICAgIC8vIFRPRE86IGFkZCBzb3J0aW5nXG4gICAgLy8gU29ydGluZyBtYWtlcyBzdXJlIGlmIG9uZSBtb250aCAob3IgYWJicikgaXMgYSBwcmVmaXggb2YgYW5vdGhlclxuICAgIC8vIHNlZSBzb3J0aW5nIGluIGNvbXB1dGVNb250aHNQYXJzZVxuICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuICAgICAgICBtb20gPSBjcmVhdGVVVEMoWzIwMDAsIGldKTtcbiAgICAgICAgaWYgKHN0cmljdCAmJiAhdGhpcy5fbG9uZ01vbnRoc1BhcnNlW2ldKSB7XG4gICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMubW9udGhzKG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnJykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnJykgKyAnJCcsICdpJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzdHJpY3QgJiYgIXRoaXMuX21vbnRoc1BhcnNlW2ldKSB7XG4gICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMubW9udGhzKG1vbSwgJycpICsgJ3xeJyArIHRoaXMubW9udGhzU2hvcnQobW9tLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl9tb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAocmVnZXgucmVwbGFjZSgnLicsICcnKSwgJ2knKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB0ZXN0IHRoZSByZWdleFxuICAgICAgICBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ01NTU0nICYmIHRoaXMuX2xvbmdNb250aHNQYXJzZVtpXS50ZXN0KG1vbnRoTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBmb3JtYXQgPT09ICdNTU0nICYmIHRoaXMuX3Nob3J0TW9udGhzUGFyc2VbaV0udGVzdChtb250aE5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfSBlbHNlIGlmICghc3RyaWN0ICYmIHRoaXMuX21vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gc2V0TW9udGggKG1vbSwgdmFsdWUpIHtcbiAgICB2YXIgZGF5T2ZNb250aDtcblxuICAgIGlmICghbW9tLmlzVmFsaWQoKSkge1xuICAgICAgICAvLyBObyBvcFxuICAgICAgICByZXR1cm4gbW9tO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmICgvXlxcZCskLy50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSB0b0ludCh2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG1vbS5sb2NhbGVEYXRhKCkubW9udGhzUGFyc2UodmFsdWUpO1xuICAgICAgICAgICAgLy8gVE9ETzogQW5vdGhlciBzaWxlbnQgZmFpbHVyZT9cbiAgICAgICAgICAgIGlmICghaXNOdW1iZXIodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRheU9mTW9udGggPSBNYXRoLm1pbihtb20uZGF0ZSgpLCBkYXlzSW5Nb250aChtb20ueWVhcigpLCB2YWx1ZSkpO1xuICAgIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyAnTW9udGgnXSh2YWx1ZSwgZGF5T2ZNb250aCk7XG4gICAgcmV0dXJuIG1vbTtcbn1cblxuZnVuY3Rpb24gZ2V0U2V0TW9udGggKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgc2V0TW9udGgodGhpcywgdmFsdWUpO1xuICAgICAgICBob29rcy51cGRhdGVPZmZzZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBnZXQodGhpcywgJ01vbnRoJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXREYXlzSW5Nb250aCAoKSB7XG4gICAgcmV0dXJuIGRheXNJbk1vbnRoKHRoaXMueWVhcigpLCB0aGlzLm1vbnRoKCkpO1xufVxuXG52YXIgZGVmYXVsdE1vbnRoc1Nob3J0UmVnZXggPSBtYXRjaFdvcmQ7XG5mdW5jdGlvbiBtb250aHNTaG9ydFJlZ2V4IChpc1N0cmljdCkge1xuICAgIGlmICh0aGlzLl9tb250aHNQYXJzZUV4YWN0KSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX21vbnRoc1JlZ2V4JykpIHtcbiAgICAgICAgICAgIGNvbXB1dGVNb250aHNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1N0cmljdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0U3RyaWN0UmVnZXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRSZWdleDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX21vbnRoc1Nob3J0UmVnZXgnKSkge1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRSZWdleCA9IGRlZmF1bHRNb250aHNTaG9ydFJlZ2V4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTaG9ydFN0cmljdFJlZ2V4ICYmIGlzU3RyaWN0ID9cbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1Nob3J0U3RyaWN0UmVnZXggOiB0aGlzLl9tb250aHNTaG9ydFJlZ2V4O1xuICAgIH1cbn1cblxudmFyIGRlZmF1bHRNb250aHNSZWdleCA9IG1hdGNoV29yZDtcbmZ1bmN0aW9uIG1vbnRoc1JlZ2V4IChpc1N0cmljdCkge1xuICAgIGlmICh0aGlzLl9tb250aHNQYXJzZUV4YWN0KSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX21vbnRoc1JlZ2V4JykpIHtcbiAgICAgICAgICAgIGNvbXB1dGVNb250aHNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1N0cmljdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1N0cmljdFJlZ2V4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1JlZ2V4O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfbW9udGhzUmVnZXgnKSkge1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzUmVnZXggPSBkZWZhdWx0TW9udGhzUmVnZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1N0cmljdFJlZ2V4ICYmIGlzU3RyaWN0ID9cbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1N0cmljdFJlZ2V4IDogdGhpcy5fbW9udGhzUmVnZXg7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjb21wdXRlTW9udGhzUGFyc2UgKCkge1xuICAgIGZ1bmN0aW9uIGNtcExlblJldihhLCBiKSB7XG4gICAgICAgIHJldHVybiBiLmxlbmd0aCAtIGEubGVuZ3RoO1xuICAgIH1cblxuICAgIHZhciBzaG9ydFBpZWNlcyA9IFtdLCBsb25nUGllY2VzID0gW10sIG1peGVkUGllY2VzID0gW10sXG4gICAgICAgIGksIG1vbTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICAvLyBtYWtlIHRoZSByZWdleCBpZiB3ZSBkb24ndCBoYXZlIGl0IGFscmVhZHlcbiAgICAgICAgbW9tID0gY3JlYXRlVVRDKFsyMDAwLCBpXSk7XG4gICAgICAgIHNob3J0UGllY2VzLnB1c2godGhpcy5tb250aHNTaG9ydChtb20sICcnKSk7XG4gICAgICAgIGxvbmdQaWVjZXMucHVzaCh0aGlzLm1vbnRocyhtb20sICcnKSk7XG4gICAgICAgIG1peGVkUGllY2VzLnB1c2godGhpcy5tb250aHMobW9tLCAnJykpO1xuICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykpO1xuICAgIH1cbiAgICAvLyBTb3J0aW5nIG1ha2VzIHN1cmUgaWYgb25lIG1vbnRoIChvciBhYmJyKSBpcyBhIHByZWZpeCBvZiBhbm90aGVyIGl0XG4gICAgLy8gd2lsbCBtYXRjaCB0aGUgbG9uZ2VyIHBpZWNlLlxuICAgIHNob3J0UGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICBsb25nUGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICBtaXhlZFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgc2hvcnRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShzaG9ydFBpZWNlc1tpXSk7XG4gICAgICAgIGxvbmdQaWVjZXNbaV0gPSByZWdleEVzY2FwZShsb25nUGllY2VzW2ldKTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IDI0OyBpKyspIHtcbiAgICAgICAgbWl4ZWRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShtaXhlZFBpZWNlc1tpXSk7XG4gICAgfVxuXG4gICAgdGhpcy5fbW9udGhzUmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBtaXhlZFBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG4gICAgdGhpcy5fbW9udGhzU2hvcnRSZWdleCA9IHRoaXMuX21vbnRoc1JlZ2V4O1xuICAgIHRoaXMuX21vbnRoc1N0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgbG9uZ1BpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG4gICAgdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIHNob3J0UGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignWScsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgeSA9IHRoaXMueWVhcigpO1xuICAgIHJldHVybiB5IDw9IDk5OTkgPyAnJyArIHkgOiAnKycgKyB5O1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKDAsIFsnWVknLCAyXSwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnllYXIoKSAlIDEwMDtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbigwLCBbJ1lZWVknLCAgIDRdLCAgICAgICAwLCAneWVhcicpO1xuYWRkRm9ybWF0VG9rZW4oMCwgWydZWVlZWScsICA1XSwgICAgICAgMCwgJ3llYXInKTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnWVlZWVlZJywgNiwgdHJ1ZV0sIDAsICd5ZWFyJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCd5ZWFyJywgJ3knKTtcblxuLy8gUFJJT1JJVElFU1xuXG5hZGRVbml0UHJpb3JpdHkoJ3llYXInLCAxKTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdZJywgICAgICBtYXRjaFNpZ25lZCk7XG5hZGRSZWdleFRva2VuKCdZWScsICAgICBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdZWVlZJywgICBtYXRjaDF0bzQsIG1hdGNoNCk7XG5hZGRSZWdleFRva2VuKCdZWVlZWScsICBtYXRjaDF0bzYsIG1hdGNoNik7XG5hZGRSZWdleFRva2VuKCdZWVlZWVknLCBtYXRjaDF0bzYsIG1hdGNoNik7XG5cbmFkZFBhcnNlVG9rZW4oWydZWVlZWScsICdZWVlZWVknXSwgWUVBUik7XG5hZGRQYXJzZVRva2VuKCdZWVlZJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W1lFQVJdID0gaW5wdXQubGVuZ3RoID09PSAyID8gaG9va3MucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpIDogdG9JbnQoaW5wdXQpO1xufSk7XG5hZGRQYXJzZVRva2VuKCdZWScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtZRUFSXSA9IGhvb2tzLnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KTtcbn0pO1xuYWRkUGFyc2VUb2tlbignWScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtZRUFSXSA9IHBhcnNlSW50KGlucHV0LCAxMCk7XG59KTtcblxuLy8gSEVMUEVSU1xuXG5mdW5jdGlvbiBkYXlzSW5ZZWFyKHllYXIpIHtcbiAgICByZXR1cm4gaXNMZWFwWWVhcih5ZWFyKSA/IDM2NiA6IDM2NTtcbn1cblxuZnVuY3Rpb24gaXNMZWFwWWVhcih5ZWFyKSB7XG4gICAgcmV0dXJuICh5ZWFyICUgNCA9PT0gMCAmJiB5ZWFyICUgMTAwICE9PSAwKSB8fCB5ZWFyICUgNDAwID09PSAwO1xufVxuXG4vLyBIT09LU1xuXG5ob29rcy5wYXJzZVR3b0RpZ2l0WWVhciA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgIHJldHVybiB0b0ludChpbnB1dCkgKyAodG9JbnQoaW5wdXQpID4gNjggPyAxOTAwIDogMjAwMCk7XG59O1xuXG4vLyBNT01FTlRTXG5cbnZhciBnZXRTZXRZZWFyID0gbWFrZUdldFNldCgnRnVsbFllYXInLCB0cnVlKTtcblxuZnVuY3Rpb24gZ2V0SXNMZWFwWWVhciAoKSB7XG4gICAgcmV0dXJuIGlzTGVhcFllYXIodGhpcy55ZWFyKCkpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVEYXRlICh5LCBtLCBkLCBoLCBNLCBzLCBtcykge1xuICAgIC8vIGNhbid0IGp1c3QgYXBwbHkoKSB0byBjcmVhdGUgYSBkYXRlOlxuICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcS8xODEzNDhcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHksIG0sIGQsIGgsIE0sIHMsIG1zKTtcblxuICAgIC8vIHRoZSBkYXRlIGNvbnN0cnVjdG9yIHJlbWFwcyB5ZWFycyAwLTk5IHRvIDE5MDAtMTk5OVxuICAgIGlmICh5IDwgMTAwICYmIHkgPj0gMCAmJiBpc0Zpbml0ZShkYXRlLmdldEZ1bGxZZWFyKCkpKSB7XG4gICAgICAgIGRhdGUuc2V0RnVsbFllYXIoeSk7XG4gICAgfVxuICAgIHJldHVybiBkYXRlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVVVENEYXRlICh5KSB7XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShEYXRlLlVUQy5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcblxuICAgIC8vIHRoZSBEYXRlLlVUQyBmdW5jdGlvbiByZW1hcHMgeWVhcnMgMC05OSB0byAxOTAwLTE5OTlcbiAgICBpZiAoeSA8IDEwMCAmJiB5ID49IDAgJiYgaXNGaW5pdGUoZGF0ZS5nZXRVVENGdWxsWWVhcigpKSkge1xuICAgICAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHkpO1xuICAgIH1cbiAgICByZXR1cm4gZGF0ZTtcbn1cblxuLy8gc3RhcnQtb2YtZmlyc3Qtd2VlayAtIHN0YXJ0LW9mLXllYXJcbmZ1bmN0aW9uIGZpcnN0V2Vla09mZnNldCh5ZWFyLCBkb3csIGRveSkge1xuICAgIHZhciAvLyBmaXJzdC13ZWVrIGRheSAtLSB3aGljaCBqYW51YXJ5IGlzIGFsd2F5cyBpbiB0aGUgZmlyc3Qgd2VlayAoNCBmb3IgaXNvLCAxIGZvciBvdGhlcilcbiAgICAgICAgZndkID0gNyArIGRvdyAtIGRveSxcbiAgICAgICAgLy8gZmlyc3Qtd2VlayBkYXkgbG9jYWwgd2Vla2RheSAtLSB3aGljaCBsb2NhbCB3ZWVrZGF5IGlzIGZ3ZFxuICAgICAgICBmd2RsdyA9ICg3ICsgY3JlYXRlVVRDRGF0ZSh5ZWFyLCAwLCBmd2QpLmdldFVUQ0RheSgpIC0gZG93KSAlIDc7XG5cbiAgICByZXR1cm4gLWZ3ZGx3ICsgZndkIC0gMTtcbn1cblxuLy8gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSVNPX3dlZWtfZGF0ZSNDYWxjdWxhdGluZ19hX2RhdGVfZ2l2ZW5fdGhlX3llYXIuMkNfd2Vla19udW1iZXJfYW5kX3dlZWtkYXlcbmZ1bmN0aW9uIGRheU9mWWVhckZyb21XZWVrcyh5ZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgIHZhciBsb2NhbFdlZWtkYXkgPSAoNyArIHdlZWtkYXkgLSBkb3cpICUgNyxcbiAgICAgICAgd2Vla09mZnNldCA9IGZpcnN0V2Vla09mZnNldCh5ZWFyLCBkb3csIGRveSksXG4gICAgICAgIGRheU9mWWVhciA9IDEgKyA3ICogKHdlZWsgLSAxKSArIGxvY2FsV2Vla2RheSArIHdlZWtPZmZzZXQsXG4gICAgICAgIHJlc1llYXIsIHJlc0RheU9mWWVhcjtcblxuICAgIGlmIChkYXlPZlllYXIgPD0gMCkge1xuICAgICAgICByZXNZZWFyID0geWVhciAtIDE7XG4gICAgICAgIHJlc0RheU9mWWVhciA9IGRheXNJblllYXIocmVzWWVhcikgKyBkYXlPZlllYXI7XG4gICAgfSBlbHNlIGlmIChkYXlPZlllYXIgPiBkYXlzSW5ZZWFyKHllYXIpKSB7XG4gICAgICAgIHJlc1llYXIgPSB5ZWFyICsgMTtcbiAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5T2ZZZWFyIC0gZGF5c0luWWVhcih5ZWFyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXNZZWFyID0geWVhcjtcbiAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5T2ZZZWFyO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHllYXI6IHJlc1llYXIsXG4gICAgICAgIGRheU9mWWVhcjogcmVzRGF5T2ZZZWFyXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gd2Vla09mWWVhcihtb20sIGRvdywgZG95KSB7XG4gICAgdmFyIHdlZWtPZmZzZXQgPSBmaXJzdFdlZWtPZmZzZXQobW9tLnllYXIoKSwgZG93LCBkb3kpLFxuICAgICAgICB3ZWVrID0gTWF0aC5mbG9vcigobW9tLmRheU9mWWVhcigpIC0gd2Vla09mZnNldCAtIDEpIC8gNykgKyAxLFxuICAgICAgICByZXNXZWVrLCByZXNZZWFyO1xuXG4gICAgaWYgKHdlZWsgPCAxKSB7XG4gICAgICAgIHJlc1llYXIgPSBtb20ueWVhcigpIC0gMTtcbiAgICAgICAgcmVzV2VlayA9IHdlZWsgKyB3ZWVrc0luWWVhcihyZXNZZWFyLCBkb3csIGRveSk7XG4gICAgfSBlbHNlIGlmICh3ZWVrID4gd2Vla3NJblllYXIobW9tLnllYXIoKSwgZG93LCBkb3kpKSB7XG4gICAgICAgIHJlc1dlZWsgPSB3ZWVrIC0gd2Vla3NJblllYXIobW9tLnllYXIoKSwgZG93LCBkb3kpO1xuICAgICAgICByZXNZZWFyID0gbW9tLnllYXIoKSArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzWWVhciA9IG1vbS55ZWFyKCk7XG4gICAgICAgIHJlc1dlZWsgPSB3ZWVrO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHdlZWs6IHJlc1dlZWssXG4gICAgICAgIHllYXI6IHJlc1llYXJcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB3ZWVrc0luWWVhcih5ZWFyLCBkb3csIGRveSkge1xuICAgIHZhciB3ZWVrT2Zmc2V0ID0gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSxcbiAgICAgICAgd2Vla09mZnNldE5leHQgPSBmaXJzdFdlZWtPZmZzZXQoeWVhciArIDEsIGRvdywgZG95KTtcbiAgICByZXR1cm4gKGRheXNJblllYXIoeWVhcikgLSB3ZWVrT2Zmc2V0ICsgd2Vla09mZnNldE5leHQpIC8gNztcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbigndycsIFsnd3cnLCAyXSwgJ3dvJywgJ3dlZWsnKTtcbmFkZEZvcm1hdFRva2VuKCdXJywgWydXVycsIDJdLCAnV28nLCAnaXNvV2VlaycpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnd2VlaycsICd3Jyk7XG5hZGRVbml0QWxpYXMoJ2lzb1dlZWsnLCAnVycpO1xuXG4vLyBQUklPUklUSUVTXG5cbmFkZFVuaXRQcmlvcml0eSgnd2VlaycsIDUpO1xuYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrJywgNSk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbigndycsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignd3cnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdXJywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdXVycsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcblxuYWRkV2Vla1BhcnNlVG9rZW4oWyd3JywgJ3d3JywgJ1cnLCAnV1cnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgd2Vla1t0b2tlbi5zdWJzdHIoMCwgMSldID0gdG9JbnQoaW5wdXQpO1xufSk7XG5cbi8vIEhFTFBFUlNcblxuLy8gTE9DQUxFU1xuXG5mdW5jdGlvbiBsb2NhbGVXZWVrIChtb20pIHtcbiAgICByZXR1cm4gd2Vla09mWWVhcihtb20sIHRoaXMuX3dlZWsuZG93LCB0aGlzLl93ZWVrLmRveSkud2Vlaztcbn1cblxudmFyIGRlZmF1bHRMb2NhbGVXZWVrID0ge1xuICAgIGRvdyA6IDAsIC8vIFN1bmRheSBpcyB0aGUgZmlyc3QgZGF5IG9mIHRoZSB3ZWVrLlxuICAgIGRveSA6IDYgIC8vIFRoZSB3ZWVrIHRoYXQgY29udGFpbnMgSmFuIDFzdCBpcyB0aGUgZmlyc3Qgd2VlayBvZiB0aGUgeWVhci5cbn07XG5cbmZ1bmN0aW9uIGxvY2FsZUZpcnN0RGF5T2ZXZWVrICgpIHtcbiAgICByZXR1cm4gdGhpcy5fd2Vlay5kb3c7XG59XG5cbmZ1bmN0aW9uIGxvY2FsZUZpcnN0RGF5T2ZZZWFyICgpIHtcbiAgICByZXR1cm4gdGhpcy5fd2Vlay5kb3k7XG59XG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gZ2V0U2V0V2VlayAoaW5wdXQpIHtcbiAgICB2YXIgd2VlayA9IHRoaXMubG9jYWxlRGF0YSgpLndlZWsodGhpcyk7XG4gICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoKGlucHV0IC0gd2VlaykgKiA3LCAnZCcpO1xufVxuXG5mdW5jdGlvbiBnZXRTZXRJU09XZWVrIChpbnB1dCkge1xuICAgIHZhciB3ZWVrID0gd2Vla09mWWVhcih0aGlzLCAxLCA0KS53ZWVrO1xuICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2VlayA6IHRoaXMuYWRkKChpbnB1dCAtIHdlZWspICogNywgJ2QnKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignZCcsIDAsICdkbycsICdkYXknKTtcblxuYWRkRm9ybWF0VG9rZW4oJ2RkJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS53ZWVrZGF5c01pbih0aGlzLCBmb3JtYXQpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdkZGQnLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLndlZWtkYXlzU2hvcnQodGhpcywgZm9ybWF0KTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignZGRkZCcsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkud2Vla2RheXModGhpcywgZm9ybWF0KTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignZScsIDAsIDAsICd3ZWVrZGF5Jyk7XG5hZGRGb3JtYXRUb2tlbignRScsIDAsIDAsICdpc29XZWVrZGF5Jyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdkYXknLCAnZCcpO1xuYWRkVW5pdEFsaWFzKCd3ZWVrZGF5JywgJ2UnKTtcbmFkZFVuaXRBbGlhcygnaXNvV2Vla2RheScsICdFJyk7XG5cbi8vIFBSSU9SSVRZXG5hZGRVbml0UHJpb3JpdHkoJ2RheScsIDExKTtcbmFkZFVuaXRQcmlvcml0eSgnd2Vla2RheScsIDExKTtcbmFkZFVuaXRQcmlvcml0eSgnaXNvV2Vla2RheScsIDExKTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdkJywgICAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ2UnLCAgICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignRScsICAgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdkZCcsICAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzTWluUmVnZXgoaXNTdHJpY3QpO1xufSk7XG5hZGRSZWdleFRva2VuKCdkZGQnLCAgIGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIGxvY2FsZS53ZWVrZGF5c1Nob3J0UmVnZXgoaXNTdHJpY3QpO1xufSk7XG5hZGRSZWdleFRva2VuKCdkZGRkJywgICBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUud2Vla2RheXNSZWdleChpc1N0cmljdCk7XG59KTtcblxuYWRkV2Vla1BhcnNlVG9rZW4oWydkZCcsICdkZGQnLCAnZGRkZCddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB2YXIgd2Vla2RheSA9IGNvbmZpZy5fbG9jYWxlLndlZWtkYXlzUGFyc2UoaW5wdXQsIHRva2VuLCBjb25maWcuX3N0cmljdCk7XG4gICAgLy8gaWYgd2UgZGlkbid0IGdldCBhIHdlZWtkYXkgbmFtZSwgbWFyayB0aGUgZGF0ZSBhcyBpbnZhbGlkXG4gICAgaWYgKHdlZWtkYXkgIT0gbnVsbCkge1xuICAgICAgICB3ZWVrLmQgPSB3ZWVrZGF5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmludmFsaWRXZWVrZGF5ID0gaW5wdXQ7XG4gICAgfVxufSk7XG5cbmFkZFdlZWtQYXJzZVRva2VuKFsnZCcsICdlJywgJ0UnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgd2Vla1t0b2tlbl0gPSB0b0ludChpbnB1dCk7XG59KTtcblxuLy8gSEVMUEVSU1xuXG5mdW5jdGlvbiBwYXJzZVdlZWtkYXkoaW5wdXQsIGxvY2FsZSkge1xuICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG5cbiAgICBpZiAoIWlzTmFOKGlucHV0KSkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICB9XG5cbiAgICBpbnB1dCA9IGxvY2FsZS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHBhcnNlSXNvV2Vla2RheShpbnB1dCwgbG9jYWxlKSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS53ZWVrZGF5c1BhcnNlKGlucHV0KSAlIDcgfHwgNztcbiAgICB9XG4gICAgcmV0dXJuIGlzTmFOKGlucHV0KSA/IG51bGwgOiBpbnB1dDtcbn1cblxuLy8gTE9DQUxFU1xuXG52YXIgZGVmYXVsdExvY2FsZVdlZWtkYXlzID0gJ1N1bmRheV9Nb25kYXlfVHVlc2RheV9XZWRuZXNkYXlfVGh1cnNkYXlfRnJpZGF5X1NhdHVyZGF5Jy5zcGxpdCgnXycpO1xuZnVuY3Rpb24gbG9jYWxlV2Vla2RheXMgKG0sIGZvcm1hdCkge1xuICAgIGlmICghbSkge1xuICAgICAgICByZXR1cm4gaXNBcnJheSh0aGlzLl93ZWVrZGF5cykgPyB0aGlzLl93ZWVrZGF5cyA6XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1snc3RhbmRhbG9uZSddO1xuICAgIH1cbiAgICByZXR1cm4gaXNBcnJheSh0aGlzLl93ZWVrZGF5cykgPyB0aGlzLl93ZWVrZGF5c1ttLmRheSgpXSA6XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzW3RoaXMuX3dlZWtkYXlzLmlzRm9ybWF0LnRlc3QoZm9ybWF0KSA/ICdmb3JtYXQnIDogJ3N0YW5kYWxvbmUnXVttLmRheSgpXTtcbn1cblxudmFyIGRlZmF1bHRMb2NhbGVXZWVrZGF5c1Nob3J0ID0gJ1N1bl9Nb25fVHVlX1dlZF9UaHVfRnJpX1NhdCcuc3BsaXQoJ18nKTtcbmZ1bmN0aW9uIGxvY2FsZVdlZWtkYXlzU2hvcnQgKG0pIHtcbiAgICByZXR1cm4gKG0pID8gdGhpcy5fd2Vla2RheXNTaG9ydFttLmRheSgpXSA6IHRoaXMuX3dlZWtkYXlzU2hvcnQ7XG59XG5cbnZhciBkZWZhdWx0TG9jYWxlV2Vla2RheXNNaW4gPSAnU3VfTW9fVHVfV2VfVGhfRnJfU2EnLnNwbGl0KCdfJyk7XG5mdW5jdGlvbiBsb2NhbGVXZWVrZGF5c01pbiAobSkge1xuICAgIHJldHVybiAobSkgPyB0aGlzLl93ZWVrZGF5c01pblttLmRheSgpXSA6IHRoaXMuX3dlZWtkYXlzTWluO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVTdHJpY3RQYXJzZSQxKHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgIHZhciBpLCBpaSwgbW9tLCBsbGMgPSB3ZWVrZGF5TmFtZS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgIGlmICghdGhpcy5fd2Vla2RheXNQYXJzZSkge1xuICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlID0gW107XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDc7ICsraSkge1xuICAgICAgICAgICAgbW9tID0gY3JlYXRlVVRDKFsyMDAwLCAxXSkuZGF5KGkpO1xuICAgICAgICAgICAgdGhpcy5fbWluV2Vla2RheXNQYXJzZVtpXSA9IHRoaXMud2Vla2RheXNNaW4obW9tLCAnJykudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXSA9IHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZVtpXSA9IHRoaXMud2Vla2RheXMobW9tLCAnJykudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2RkZGQnKSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX3dlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2RkZCcpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm9ybWF0ID09PSAnZGRkZCcpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX21pbldlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2RkZCcpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX21pbldlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9taW5XZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvY2FsZVdlZWtkYXlzUGFyc2UgKHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgIHZhciBpLCBtb20sIHJlZ2V4O1xuXG4gICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VFeGFjdCkge1xuICAgICAgICByZXR1cm4gaGFuZGxlU3RyaWN0UGFyc2UkMS5jYWxsKHRoaXMsIHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlKSB7XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fbWluV2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuXG4gICAgICAgIG1vbSA9IGNyZWF0ZVVUQyhbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgaWYgKHN0cmljdCAmJiAhdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgIHRoaXMuX2Z1bGxXZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLndlZWtkYXlzKG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnXFwuPycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgdGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLndlZWtkYXlzU2hvcnQobW9tLCAnJykucmVwbGFjZSgnLicsICdcXC4/JykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnXFwuPycpICsgJyQnLCAnaScpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fd2Vla2RheXNQYXJzZVtpXSkge1xuICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLndlZWtkYXlzKG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKSArICd8XicgKyB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZVtpXSA9IG5ldyBSZWdFeHAocmVnZXgucmVwbGFjZSgnLicsICcnKSwgJ2knKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB0ZXN0IHRoZSByZWdleFxuICAgICAgICBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ2RkZGQnICYmIHRoaXMuX2Z1bGxXZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnZGRkJyAmJiB0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBmb3JtYXQgPT09ICdkZCcgJiYgdGhpcy5fbWluV2Vla2RheXNQYXJzZVtpXS50ZXN0KHdlZWtkYXlOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXN0cmljdCAmJiB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gTU9NRU5UU1xuXG5mdW5jdGlvbiBnZXRTZXREYXlPZldlZWsgKGlucHV0KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgfVxuICAgIHZhciBkYXkgPSB0aGlzLl9pc1VUQyA/IHRoaXMuX2QuZ2V0VVRDRGF5KCkgOiB0aGlzLl9kLmdldERheSgpO1xuICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgIGlucHV0ID0gcGFyc2VXZWVrZGF5KGlucHV0LCB0aGlzLmxvY2FsZURhdGEoKSk7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChpbnB1dCAtIGRheSwgJ2QnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZGF5O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0U2V0TG9jYWxlRGF5T2ZXZWVrIChpbnB1dCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0ICE9IG51bGwgPyB0aGlzIDogTmFOO1xuICAgIH1cbiAgICB2YXIgd2Vla2RheSA9ICh0aGlzLmRheSgpICsgNyAtIHRoaXMubG9jYWxlRGF0YSgpLl93ZWVrLmRvdykgJSA3O1xuICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2Vla2RheSA6IHRoaXMuYWRkKGlucHV0IC0gd2Vla2RheSwgJ2QnKTtcbn1cblxuZnVuY3Rpb24gZ2V0U2V0SVNPRGF5T2ZXZWVrIChpbnB1dCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0ICE9IG51bGwgPyB0aGlzIDogTmFOO1xuICAgIH1cblxuICAgIC8vIGJlaGF2ZXMgdGhlIHNhbWUgYXMgbW9tZW50I2RheSBleGNlcHRcbiAgICAvLyBhcyBhIGdldHRlciwgcmV0dXJucyA3IGluc3RlYWQgb2YgMCAoMS03IHJhbmdlIGluc3RlYWQgb2YgMC02KVxuICAgIC8vIGFzIGEgc2V0dGVyLCBzdW5kYXkgc2hvdWxkIGJlbG9uZyB0byB0aGUgcHJldmlvdXMgd2Vlay5cblxuICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgIHZhciB3ZWVrZGF5ID0gcGFyc2VJc29XZWVrZGF5KGlucHV0LCB0aGlzLmxvY2FsZURhdGEoKSk7XG4gICAgICAgIHJldHVybiB0aGlzLmRheSh0aGlzLmRheSgpICUgNyA/IHdlZWtkYXkgOiB3ZWVrZGF5IC0gNyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF5KCkgfHwgNztcbiAgICB9XG59XG5cbnZhciBkZWZhdWx0V2Vla2RheXNSZWdleCA9IG1hdGNoV29yZDtcbmZ1bmN0aW9uIHdlZWtkYXlzUmVnZXggKGlzU3RyaWN0KSB7XG4gICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VFeGFjdCkge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgIGNvbXB1dGVXZWVrZGF5c1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNSZWdleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1JlZ2V4ID0gZGVmYXVsdFdlZWtkYXlzUmVnZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNTdHJpY3RSZWdleCA6IHRoaXMuX3dlZWtkYXlzUmVnZXg7XG4gICAgfVxufVxuXG52YXIgZGVmYXVsdFdlZWtkYXlzU2hvcnRSZWdleCA9IG1hdGNoV29yZDtcbmZ1bmN0aW9uIHdlZWtkYXlzU2hvcnRSZWdleCAoaXNTdHJpY3QpIHtcbiAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX3dlZWtkYXlzUmVnZXgnKSkge1xuICAgICAgICAgICAgY29tcHV0ZVdlZWtkYXlzUGFyc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1Nob3J0U3RyaWN0UmVnZXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTaG9ydFJlZ2V4O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNTaG9ydFJlZ2V4JykpIHtcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleCA9IGRlZmF1bHRXZWVrZGF5c1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1Nob3J0U3RyaWN0UmVnZXggOiB0aGlzLl93ZWVrZGF5c1Nob3J0UmVnZXg7XG4gICAgfVxufVxuXG52YXIgZGVmYXVsdFdlZWtkYXlzTWluUmVnZXggPSBtYXRjaFdvcmQ7XG5mdW5jdGlvbiB3ZWVrZGF5c01pblJlZ2V4IChpc1N0cmljdCkge1xuICAgIGlmICh0aGlzLl93ZWVrZGF5c1BhcnNlRXhhY3QpIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNSZWdleCcpKSB7XG4gICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1N0cmljdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNNaW5SZWdleDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX3dlZWtkYXlzTWluUmVnZXgnKSkge1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNNaW5SZWdleCA9IGRlZmF1bHRXZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c01pblN0cmljdFJlZ2V4ICYmIGlzU3RyaWN0ID9cbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXggOiB0aGlzLl93ZWVrZGF5c01pblJlZ2V4O1xuICAgIH1cbn1cblxuXG5mdW5jdGlvbiBjb21wdXRlV2Vla2RheXNQYXJzZSAoKSB7XG4gICAgZnVuY3Rpb24gY21wTGVuUmV2KGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7XG4gICAgfVxuXG4gICAgdmFyIG1pblBpZWNlcyA9IFtdLCBzaG9ydFBpZWNlcyA9IFtdLCBsb25nUGllY2VzID0gW10sIG1peGVkUGllY2VzID0gW10sXG4gICAgICAgIGksIG1vbSwgbWlucCwgc2hvcnRwLCBsb25ncDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuICAgICAgICBtb20gPSBjcmVhdGVVVEMoWzIwMDAsIDFdKS5kYXkoaSk7XG4gICAgICAgIG1pbnAgPSB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpO1xuICAgICAgICBzaG9ydHAgPSB0aGlzLndlZWtkYXlzU2hvcnQobW9tLCAnJyk7XG4gICAgICAgIGxvbmdwID0gdGhpcy53ZWVrZGF5cyhtb20sICcnKTtcbiAgICAgICAgbWluUGllY2VzLnB1c2gobWlucCk7XG4gICAgICAgIHNob3J0UGllY2VzLnB1c2goc2hvcnRwKTtcbiAgICAgICAgbG9uZ1BpZWNlcy5wdXNoKGxvbmdwKTtcbiAgICAgICAgbWl4ZWRQaWVjZXMucHVzaChtaW5wKTtcbiAgICAgICAgbWl4ZWRQaWVjZXMucHVzaChzaG9ydHApO1xuICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKGxvbmdwKTtcbiAgICB9XG4gICAgLy8gU29ydGluZyBtYWtlcyBzdXJlIGlmIG9uZSB3ZWVrZGF5IChvciBhYmJyKSBpcyBhIHByZWZpeCBvZiBhbm90aGVyIGl0XG4gICAgLy8gd2lsbCBtYXRjaCB0aGUgbG9uZ2VyIHBpZWNlLlxuICAgIG1pblBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgc2hvcnRQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIGxvbmdQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIG1peGVkUGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgIHNob3J0UGllY2VzW2ldID0gcmVnZXhFc2NhcGUoc2hvcnRQaWVjZXNbaV0pO1xuICAgICAgICBsb25nUGllY2VzW2ldID0gcmVnZXhFc2NhcGUobG9uZ1BpZWNlc1tpXSk7XG4gICAgICAgIG1peGVkUGllY2VzW2ldID0gcmVnZXhFc2NhcGUobWl4ZWRQaWVjZXNbaV0pO1xuICAgIH1cblxuICAgIHRoaXMuX3dlZWtkYXlzUmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBtaXhlZFBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG4gICAgdGhpcy5fd2Vla2RheXNTaG9ydFJlZ2V4ID0gdGhpcy5fd2Vla2RheXNSZWdleDtcbiAgICB0aGlzLl93ZWVrZGF5c01pblJlZ2V4ID0gdGhpcy5fd2Vla2RheXNSZWdleDtcblxuICAgIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBsb25nUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl93ZWVrZGF5c1Nob3J0U3RyaWN0UmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBzaG9ydFBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG4gICAgdGhpcy5fd2Vla2RheXNNaW5TdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIG1pblBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuZnVuY3Rpb24gaEZvcm1hdCgpIHtcbiAgICByZXR1cm4gdGhpcy5ob3VycygpICUgMTIgfHwgMTI7XG59XG5cbmZ1bmN0aW9uIGtGb3JtYXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaG91cnMoKSB8fCAyNDtcbn1cblxuYWRkRm9ybWF0VG9rZW4oJ0gnLCBbJ0hIJywgMl0sIDAsICdob3VyJyk7XG5hZGRGb3JtYXRUb2tlbignaCcsIFsnaGgnLCAyXSwgMCwgaEZvcm1hdCk7XG5hZGRGb3JtYXRUb2tlbignaycsIFsna2snLCAyXSwgMCwga0Zvcm1hdCk7XG5cbmFkZEZvcm1hdFRva2VuKCdobW0nLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICcnICsgaEZvcm1hdC5hcHBseSh0aGlzKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignaG1tc3MnLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICcnICsgaEZvcm1hdC5hcHBseSh0aGlzKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKSArXG4gICAgICAgIHplcm9GaWxsKHRoaXMuc2Vjb25kcygpLCAyKTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignSG1tJywgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAnJyArIHRoaXMuaG91cnMoKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignSG1tc3MnLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICcnICsgdGhpcy5ob3VycygpICsgemVyb0ZpbGwodGhpcy5taW51dGVzKCksIDIpICtcbiAgICAgICAgemVyb0ZpbGwodGhpcy5zZWNvbmRzKCksIDIpO1xufSk7XG5cbmZ1bmN0aW9uIG1lcmlkaWVtICh0b2tlbiwgbG93ZXJjYXNlKSB7XG4gICAgYWRkRm9ybWF0VG9rZW4odG9rZW4sIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSwgdGhpcy5taW51dGVzKCksIGxvd2VyY2FzZSk7XG4gICAgfSk7XG59XG5cbm1lcmlkaWVtKCdhJywgdHJ1ZSk7XG5tZXJpZGllbSgnQScsIGZhbHNlKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ2hvdXInLCAnaCcpO1xuXG4vLyBQUklPUklUWVxuYWRkVW5pdFByaW9yaXR5KCdob3VyJywgMTMpO1xuXG4vLyBQQVJTSU5HXG5cbmZ1bmN0aW9uIG1hdGNoTWVyaWRpZW0gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLl9tZXJpZGllbVBhcnNlO1xufVxuXG5hZGRSZWdleFRva2VuKCdhJywgIG1hdGNoTWVyaWRpZW0pO1xuYWRkUmVnZXhUb2tlbignQScsICBtYXRjaE1lcmlkaWVtKTtcbmFkZFJlZ2V4VG9rZW4oJ0gnLCAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ2gnLCAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ2snLCAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ0hIJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignaGgnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdraycsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcblxuYWRkUmVnZXhUb2tlbignaG1tJywgbWF0Y2gzdG80KTtcbmFkZFJlZ2V4VG9rZW4oJ2htbXNzJywgbWF0Y2g1dG82KTtcbmFkZFJlZ2V4VG9rZW4oJ0htbScsIG1hdGNoM3RvNCk7XG5hZGRSZWdleFRva2VuKCdIbW1zcycsIG1hdGNoNXRvNik7XG5cbmFkZFBhcnNlVG9rZW4oWydIJywgJ0hIJ10sIEhPVVIpO1xuYWRkUGFyc2VUb2tlbihbJ2snLCAna2snXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgdmFyIGtJbnB1dCA9IHRvSW50KGlucHV0KTtcbiAgICBhcnJheVtIT1VSXSA9IGtJbnB1dCA9PT0gMjQgPyAwIDoga0lucHV0O1xufSk7XG5hZGRQYXJzZVRva2VuKFsnYScsICdBJ10sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgIGNvbmZpZy5faXNQbSA9IGNvbmZpZy5fbG9jYWxlLmlzUE0oaW5wdXQpO1xuICAgIGNvbmZpZy5fbWVyaWRpZW0gPSBpbnB1dDtcbn0pO1xuYWRkUGFyc2VUb2tlbihbJ2gnLCAnaGgnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dCk7XG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuYmlnSG91ciA9IHRydWU7XG59KTtcbmFkZFBhcnNlVG9rZW4oJ2htbScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgIHZhciBwb3MgPSBpbnB1dC5sZW5ndGggLSAyO1xuICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvcykpO1xuICAgIGFycmF5W01JTlVURV0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zKSk7XG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuYmlnSG91ciA9IHRydWU7XG59KTtcbmFkZFBhcnNlVG9rZW4oJ2htbXNzJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgdmFyIHBvczEgPSBpbnB1dC5sZW5ndGggLSA0O1xuICAgIHZhciBwb3MyID0gaW5wdXQubGVuZ3RoIC0gMjtcbiAgICBhcnJheVtIT1VSXSA9IHRvSW50KGlucHV0LnN1YnN0cigwLCBwb3MxKSk7XG4gICAgYXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MxLCAyKSk7XG4gICAgYXJyYXlbU0VDT05EXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MyKSk7XG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuYmlnSG91ciA9IHRydWU7XG59KTtcbmFkZFBhcnNlVG9rZW4oJ0htbScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgIHZhciBwb3MgPSBpbnB1dC5sZW5ndGggLSAyO1xuICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvcykpO1xuICAgIGFycmF5W01JTlVURV0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zKSk7XG59KTtcbmFkZFBhcnNlVG9rZW4oJ0htbXNzJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgdmFyIHBvczEgPSBpbnB1dC5sZW5ndGggLSA0O1xuICAgIHZhciBwb3MyID0gaW5wdXQubGVuZ3RoIC0gMjtcbiAgICBhcnJheVtIT1VSXSA9IHRvSW50KGlucHV0LnN1YnN0cigwLCBwb3MxKSk7XG4gICAgYXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MxLCAyKSk7XG4gICAgYXJyYXlbU0VDT05EXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MyKSk7XG59KTtcblxuLy8gTE9DQUxFU1xuXG5mdW5jdGlvbiBsb2NhbGVJc1BNIChpbnB1dCkge1xuICAgIC8vIElFOCBRdWlya3MgTW9kZSAmIElFNyBTdGFuZGFyZHMgTW9kZSBkbyBub3QgYWxsb3cgYWNjZXNzaW5nIHN0cmluZ3MgbGlrZSBhcnJheXNcbiAgICAvLyBVc2luZyBjaGFyQXQgc2hvdWxkIGJlIG1vcmUgY29tcGF0aWJsZS5cbiAgICByZXR1cm4gKChpbnB1dCArICcnKS50b0xvd2VyQ2FzZSgpLmNoYXJBdCgwKSA9PT0gJ3AnKTtcbn1cblxudmFyIGRlZmF1bHRMb2NhbGVNZXJpZGllbVBhcnNlID0gL1thcF1cXC4/bT9cXC4/L2k7XG5mdW5jdGlvbiBsb2NhbGVNZXJpZGllbSAoaG91cnMsIG1pbnV0ZXMsIGlzTG93ZXIpIHtcbiAgICBpZiAoaG91cnMgPiAxMSkge1xuICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwbScgOiAnUE0nO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpc0xvd2VyID8gJ2FtJyA6ICdBTSc7XG4gICAgfVxufVxuXG5cbi8vIE1PTUVOVFNcblxuLy8gU2V0dGluZyB0aGUgaG91ciBzaG91bGQga2VlcCB0aGUgdGltZSwgYmVjYXVzZSB0aGUgdXNlciBleHBsaWNpdGx5XG4vLyBzcGVjaWZpZWQgd2hpY2ggaG91ciBoZSB3YW50cy4gU28gdHJ5aW5nIHRvIG1haW50YWluIHRoZSBzYW1lIGhvdXIgKGluXG4vLyBhIG5ldyB0aW1lem9uZSkgbWFrZXMgc2Vuc2UuIEFkZGluZy9zdWJ0cmFjdGluZyBob3VycyBkb2VzIG5vdCBmb2xsb3dcbi8vIHRoaXMgcnVsZS5cbnZhciBnZXRTZXRIb3VyID0gbWFrZUdldFNldCgnSG91cnMnLCB0cnVlKTtcblxuLy8gbW9udGhzXG4vLyB3ZWVrXG4vLyB3ZWVrZGF5c1xuLy8gbWVyaWRpZW1cbnZhciBiYXNlQ29uZmlnID0ge1xuICAgIGNhbGVuZGFyOiBkZWZhdWx0Q2FsZW5kYXIsXG4gICAgbG9uZ0RhdGVGb3JtYXQ6IGRlZmF1bHRMb25nRGF0ZUZvcm1hdCxcbiAgICBpbnZhbGlkRGF0ZTogZGVmYXVsdEludmFsaWREYXRlLFxuICAgIG9yZGluYWw6IGRlZmF1bHRPcmRpbmFsLFxuICAgIGRheU9mTW9udGhPcmRpbmFsUGFyc2U6IGRlZmF1bHREYXlPZk1vbnRoT3JkaW5hbFBhcnNlLFxuICAgIHJlbGF0aXZlVGltZTogZGVmYXVsdFJlbGF0aXZlVGltZSxcblxuICAgIG1vbnRoczogZGVmYXVsdExvY2FsZU1vbnRocyxcbiAgICBtb250aHNTaG9ydDogZGVmYXVsdExvY2FsZU1vbnRoc1Nob3J0LFxuXG4gICAgd2VlazogZGVmYXVsdExvY2FsZVdlZWssXG5cbiAgICB3ZWVrZGF5czogZGVmYXVsdExvY2FsZVdlZWtkYXlzLFxuICAgIHdlZWtkYXlzTWluOiBkZWZhdWx0TG9jYWxlV2Vla2RheXNNaW4sXG4gICAgd2Vla2RheXNTaG9ydDogZGVmYXVsdExvY2FsZVdlZWtkYXlzU2hvcnQsXG5cbiAgICBtZXJpZGllbVBhcnNlOiBkZWZhdWx0TG9jYWxlTWVyaWRpZW1QYXJzZVxufTtcblxuLy8gaW50ZXJuYWwgc3RvcmFnZSBmb3IgbG9jYWxlIGNvbmZpZyBmaWxlc1xudmFyIGxvY2FsZXMgPSB7fTtcbnZhciBsb2NhbGVGYW1pbGllcyA9IHt9O1xudmFyIGdsb2JhbExvY2FsZTtcblxuZnVuY3Rpb24gbm9ybWFsaXplTG9jYWxlKGtleSkge1xuICAgIHJldHVybiBrZXkgPyBrZXkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCdfJywgJy0nKSA6IGtleTtcbn1cblxuLy8gcGljayB0aGUgbG9jYWxlIGZyb20gdGhlIGFycmF5XG4vLyB0cnkgWydlbi1hdScsICdlbi1nYiddIGFzICdlbi1hdScsICdlbi1nYicsICdlbicsIGFzIGluIG1vdmUgdGhyb3VnaCB0aGUgbGlzdCB0cnlpbmcgZWFjaFxuLy8gc3Vic3RyaW5nIGZyb20gbW9zdCBzcGVjaWZpYyB0byBsZWFzdCwgYnV0IG1vdmUgdG8gdGhlIG5leHQgYXJyYXkgaXRlbSBpZiBpdCdzIGEgbW9yZSBzcGVjaWZpYyB2YXJpYW50IHRoYW4gdGhlIGN1cnJlbnQgcm9vdFxuZnVuY3Rpb24gY2hvb3NlTG9jYWxlKG5hbWVzKSB7XG4gICAgdmFyIGkgPSAwLCBqLCBuZXh0LCBsb2NhbGUsIHNwbGl0O1xuXG4gICAgd2hpbGUgKGkgPCBuYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgc3BsaXQgPSBub3JtYWxpemVMb2NhbGUobmFtZXNbaV0pLnNwbGl0KCctJyk7XG4gICAgICAgIGogPSBzcGxpdC5sZW5ndGg7XG4gICAgICAgIG5leHQgPSBub3JtYWxpemVMb2NhbGUobmFtZXNbaSArIDFdKTtcbiAgICAgICAgbmV4dCA9IG5leHQgPyBuZXh0LnNwbGl0KCctJykgOiBudWxsO1xuICAgICAgICB3aGlsZSAoaiA+IDApIHtcbiAgICAgICAgICAgIGxvY2FsZSA9IGxvYWRMb2NhbGUoc3BsaXQuc2xpY2UoMCwgaikuam9pbignLScpKTtcbiAgICAgICAgICAgIGlmIChsb2NhbGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9jYWxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5leHQgJiYgbmV4dC5sZW5ndGggPj0gaiAmJiBjb21wYXJlQXJyYXlzKHNwbGl0LCBuZXh0LCB0cnVlKSA+PSBqIC0gMSkge1xuICAgICAgICAgICAgICAgIC8vdGhlIG5leHQgYXJyYXkgaXRlbSBpcyBiZXR0ZXIgdGhhbiBhIHNoYWxsb3dlciBzdWJzdHJpbmcgb2YgdGhpcyBvbmVcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGotLTtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBsb2FkTG9jYWxlKG5hbWUpIHtcbiAgICB2YXIgb2xkTG9jYWxlID0gbnVsbDtcbiAgICAvLyBUT0RPOiBGaW5kIGEgYmV0dGVyIHdheSB0byByZWdpc3RlciBhbmQgbG9hZCBhbGwgdGhlIGxvY2FsZXMgaW4gTm9kZVxuICAgIGlmICghbG9jYWxlc1tuYW1lXSAmJiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpICYmXG4gICAgICAgICAgICBtb2R1bGUgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG9sZExvY2FsZSA9IGdsb2JhbExvY2FsZS5fYWJicjtcbiAgICAgICAgICAgIHJlcXVpcmUoJy4vbG9jYWxlLycgKyBuYW1lKTtcbiAgICAgICAgICAgIC8vIGJlY2F1c2UgZGVmaW5lTG9jYWxlIGN1cnJlbnRseSBhbHNvIHNldHMgdGhlIGdsb2JhbCBsb2NhbGUsIHdlXG4gICAgICAgICAgICAvLyB3YW50IHRvIHVuZG8gdGhhdCBmb3IgbGF6eSBsb2FkZWQgbG9jYWxlc1xuICAgICAgICAgICAgZ2V0U2V0R2xvYmFsTG9jYWxlKG9sZExvY2FsZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgfVxuICAgIH1cbiAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGxvYWQgbG9jYWxlIGFuZCB0aGVuIHNldCB0aGUgZ2xvYmFsIGxvY2FsZS4gIElmXG4vLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50IGdsb2JhbFxuLy8gbG9jYWxlIGtleS5cbmZ1bmN0aW9uIGdldFNldEdsb2JhbExvY2FsZSAoa2V5LCB2YWx1ZXMpIHtcbiAgICB2YXIgZGF0YTtcbiAgICBpZiAoa2V5KSB7XG4gICAgICAgIGlmIChpc1VuZGVmaW5lZCh2YWx1ZXMpKSB7XG4gICAgICAgICAgICBkYXRhID0gZ2V0TG9jYWxlKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0gZGVmaW5lTG9jYWxlKGtleSwgdmFsdWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAvLyBtb21lbnQuZHVyYXRpb24uX2xvY2FsZSA9IG1vbWVudC5fbG9jYWxlID0gZGF0YTtcbiAgICAgICAgICAgIGdsb2JhbExvY2FsZSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ2xvYmFsTG9jYWxlLl9hYmJyO1xufVxuXG5mdW5jdGlvbiBkZWZpbmVMb2NhbGUgKG5hbWUsIGNvbmZpZykge1xuICAgIGlmIChjb25maWcgIT09IG51bGwpIHtcbiAgICAgICAgdmFyIHBhcmVudENvbmZpZyA9IGJhc2VDb25maWc7XG4gICAgICAgIGNvbmZpZy5hYmJyID0gbmFtZTtcbiAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgZGVwcmVjYXRlU2ltcGxlKCdkZWZpbmVMb2NhbGVPdmVycmlkZScsXG4gICAgICAgICAgICAgICAgICAgICd1c2UgbW9tZW50LnVwZGF0ZUxvY2FsZShsb2NhbGVOYW1lLCBjb25maWcpIHRvIGNoYW5nZSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2FuIGV4aXN0aW5nIGxvY2FsZS4gbW9tZW50LmRlZmluZUxvY2FsZShsb2NhbGVOYW1lLCAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbmZpZykgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgY3JlYXRpbmcgYSBuZXcgbG9jYWxlICcgK1xuICAgICAgICAgICAgICAgICAgICAnU2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvZGVmaW5lLWxvY2FsZS8gZm9yIG1vcmUgaW5mby4nKTtcbiAgICAgICAgICAgIHBhcmVudENvbmZpZyA9IGxvY2FsZXNbbmFtZV0uX2NvbmZpZztcbiAgICAgICAgfSBlbHNlIGlmIChjb25maWcucGFyZW50TG9jYWxlICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChsb2NhbGVzW2NvbmZpZy5wYXJlbnRMb2NhbGVdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRDb25maWcgPSBsb2NhbGVzW2NvbmZpZy5wYXJlbnRMb2NhbGVdLl9jb25maWc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghbG9jYWxlRmFtaWxpZXNbY29uZmlnLnBhcmVudExvY2FsZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxlRmFtaWxpZXNbY29uZmlnLnBhcmVudExvY2FsZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbG9jYWxlRmFtaWxpZXNbY29uZmlnLnBhcmVudExvY2FsZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzogY29uZmlnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbG9jYWxlc1tuYW1lXSA9IG5ldyBMb2NhbGUobWVyZ2VDb25maWdzKHBhcmVudENvbmZpZywgY29uZmlnKSk7XG5cbiAgICAgICAgaWYgKGxvY2FsZUZhbWlsaWVzW25hbWVdKSB7XG4gICAgICAgICAgICBsb2NhbGVGYW1pbGllc1tuYW1lXS5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lTG9jYWxlKHgubmFtZSwgeC5jb25maWcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBiYWNrd2FyZHMgY29tcGF0IGZvciBub3c6IGFsc28gc2V0IHRoZSBsb2NhbGVcbiAgICAgICAgLy8gbWFrZSBzdXJlIHdlIHNldCB0aGUgbG9jYWxlIEFGVEVSIGFsbCBjaGlsZCBsb2NhbGVzIGhhdmUgYmVlblxuICAgICAgICAvLyBjcmVhdGVkLCBzbyB3ZSB3b24ndCBlbmQgdXAgd2l0aCB0aGUgY2hpbGQgbG9jYWxlIHNldC5cbiAgICAgICAgZ2V0U2V0R2xvYmFsTG9jYWxlKG5hbWUpO1xuXG5cbiAgICAgICAgcmV0dXJuIGxvY2FsZXNbbmFtZV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdXNlZnVsIGZvciB0ZXN0aW5nXG4gICAgICAgIGRlbGV0ZSBsb2NhbGVzW25hbWVdO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUxvY2FsZShuYW1lLCBjb25maWcpIHtcbiAgICBpZiAoY29uZmlnICE9IG51bGwpIHtcbiAgICAgICAgdmFyIGxvY2FsZSwgcGFyZW50Q29uZmlnID0gYmFzZUNvbmZpZztcbiAgICAgICAgLy8gTUVSR0VcbiAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyZW50Q29uZmlnID0gbG9jYWxlc1tuYW1lXS5fY29uZmlnO1xuICAgICAgICB9XG4gICAgICAgIGNvbmZpZyA9IG1lcmdlQ29uZmlncyhwYXJlbnRDb25maWcsIGNvbmZpZyk7XG4gICAgICAgIGxvY2FsZSA9IG5ldyBMb2NhbGUoY29uZmlnKTtcbiAgICAgICAgbG9jYWxlLnBhcmVudExvY2FsZSA9IGxvY2FsZXNbbmFtZV07XG4gICAgICAgIGxvY2FsZXNbbmFtZV0gPSBsb2NhbGU7XG5cbiAgICAgICAgLy8gYmFja3dhcmRzIGNvbXBhdCBmb3Igbm93OiBhbHNvIHNldCB0aGUgbG9jYWxlXG4gICAgICAgIGdldFNldEdsb2JhbExvY2FsZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBwYXNzIG51bGwgZm9yIGNvbmZpZyB0byB1bnVwZGF0ZSwgdXNlZnVsIGZvciB0ZXN0c1xuICAgICAgICBpZiAobG9jYWxlc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAobG9jYWxlc1tuYW1lXS5wYXJlbnRMb2NhbGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGxvY2FsZXNbbmFtZV0gPSBsb2NhbGVzW25hbWVdLnBhcmVudExvY2FsZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobG9jYWxlc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGxvY2FsZXNbbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvY2FsZXNbbmFtZV07XG59XG5cbi8vIHJldHVybnMgbG9jYWxlIGRhdGFcbmZ1bmN0aW9uIGdldExvY2FsZSAoa2V5KSB7XG4gICAgdmFyIGxvY2FsZTtcblxuICAgIGlmIChrZXkgJiYga2V5Ll9sb2NhbGUgJiYga2V5Ll9sb2NhbGUuX2FiYnIpIHtcbiAgICAgICAga2V5ID0ga2V5Ll9sb2NhbGUuX2FiYnI7XG4gICAgfVxuXG4gICAgaWYgKCFrZXkpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbExvY2FsZTtcbiAgICB9XG5cbiAgICBpZiAoIWlzQXJyYXkoa2V5KSkge1xuICAgICAgICAvL3Nob3J0LWNpcmN1aXQgZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGxvY2FsZSA9IGxvYWRMb2NhbGUoa2V5KTtcbiAgICAgICAgaWYgKGxvY2FsZSkge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsZTtcbiAgICAgICAgfVxuICAgICAgICBrZXkgPSBba2V5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hvb3NlTG9jYWxlKGtleSk7XG59XG5cbmZ1bmN0aW9uIGxpc3RMb2NhbGVzKCkge1xuICAgIHJldHVybiBrZXlzJDEobG9jYWxlcyk7XG59XG5cbmZ1bmN0aW9uIGNoZWNrT3ZlcmZsb3cgKG0pIHtcbiAgICB2YXIgb3ZlcmZsb3c7XG4gICAgdmFyIGEgPSBtLl9hO1xuXG4gICAgaWYgKGEgJiYgZ2V0UGFyc2luZ0ZsYWdzKG0pLm92ZXJmbG93ID09PSAtMikge1xuICAgICAgICBvdmVyZmxvdyA9XG4gICAgICAgICAgICBhW01PTlRIXSAgICAgICA8IDAgfHwgYVtNT05USF0gICAgICAgPiAxMSAgPyBNT05USCA6XG4gICAgICAgICAgICBhW0RBVEVdICAgICAgICA8IDEgfHwgYVtEQVRFXSAgICAgICAgPiBkYXlzSW5Nb250aChhW1lFQVJdLCBhW01PTlRIXSkgPyBEQVRFIDpcbiAgICAgICAgICAgIGFbSE9VUl0gICAgICAgIDwgMCB8fCBhW0hPVVJdICAgICAgICA+IDI0IHx8IChhW0hPVVJdID09PSAyNCAmJiAoYVtNSU5VVEVdICE9PSAwIHx8IGFbU0VDT05EXSAhPT0gMCB8fCBhW01JTExJU0VDT05EXSAhPT0gMCkpID8gSE9VUiA6XG4gICAgICAgICAgICBhW01JTlVURV0gICAgICA8IDAgfHwgYVtNSU5VVEVdICAgICAgPiA1OSAgPyBNSU5VVEUgOlxuICAgICAgICAgICAgYVtTRUNPTkRdICAgICAgPCAwIHx8IGFbU0VDT05EXSAgICAgID4gNTkgID8gU0VDT05EIDpcbiAgICAgICAgICAgIGFbTUlMTElTRUNPTkRdIDwgMCB8fCBhW01JTExJU0VDT05EXSA+IDk5OSA/IE1JTExJU0VDT05EIDpcbiAgICAgICAgICAgIC0xO1xuXG4gICAgICAgIGlmIChnZXRQYXJzaW5nRmxhZ3MobSkuX292ZXJmbG93RGF5T2ZZZWFyICYmIChvdmVyZmxvdyA8IFlFQVIgfHwgb3ZlcmZsb3cgPiBEQVRFKSkge1xuICAgICAgICAgICAgb3ZlcmZsb3cgPSBEQVRFO1xuICAgICAgICB9XG4gICAgICAgIGlmIChnZXRQYXJzaW5nRmxhZ3MobSkuX292ZXJmbG93V2Vla3MgJiYgb3ZlcmZsb3cgPT09IC0xKSB7XG4gICAgICAgICAgICBvdmVyZmxvdyA9IFdFRUs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdldFBhcnNpbmdGbGFncyhtKS5fb3ZlcmZsb3dXZWVrZGF5ICYmIG92ZXJmbG93ID09PSAtMSkge1xuICAgICAgICAgICAgb3ZlcmZsb3cgPSBXRUVLREFZO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKG0pLm92ZXJmbG93ID0gb3ZlcmZsb3c7XG4gICAgfVxuXG4gICAgcmV0dXJuIG07XG59XG5cbi8vIGlzbyA4NjAxIHJlZ2V4XG4vLyAwMDAwLTAwLTAwIDAwMDAtVzAwIG9yIDAwMDAtVzAwLTAgKyBUICsgMDAgb3IgMDA6MDAgb3IgMDA6MDA6MDAgb3IgMDA6MDA6MDAuMDAwICsgKzAwOjAwIG9yICswMDAwIG9yICswMClcbnZhciBleHRlbmRlZElzb1JlZ2V4ID0gL15cXHMqKCg/OlsrLV1cXGR7Nn18XFxkezR9KS0oPzpcXGRcXGQtXFxkXFxkfFdcXGRcXGQtXFxkfFdcXGRcXGR8XFxkXFxkXFxkfFxcZFxcZCkpKD86KFR8ICkoXFxkXFxkKD86OlxcZFxcZCg/OjpcXGRcXGQoPzpbLixdXFxkKyk/KT8pPykoW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPyQvO1xudmFyIGJhc2ljSXNvUmVnZXggPSAvXlxccyooKD86WystXVxcZHs2fXxcXGR7NH0pKD86XFxkXFxkXFxkXFxkfFdcXGRcXGRcXGR8V1xcZFxcZHxcXGRcXGRcXGR8XFxkXFxkKSkoPzooVHwgKShcXGRcXGQoPzpcXGRcXGQoPzpcXGRcXGQoPzpbLixdXFxkKyk/KT8pPykoW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPyQvO1xuXG52YXIgdHpSZWdleCA9IC9afFsrLV1cXGRcXGQoPzo6P1xcZFxcZCk/LztcblxudmFyIGlzb0RhdGVzID0gW1xuICAgIFsnWVlZWVlZLU1NLUREJywgL1srLV1cXGR7Nn0tXFxkXFxkLVxcZFxcZC9dLFxuICAgIFsnWVlZWS1NTS1ERCcsIC9cXGR7NH0tXFxkXFxkLVxcZFxcZC9dLFxuICAgIFsnR0dHRy1bV11XVy1FJywgL1xcZHs0fS1XXFxkXFxkLVxcZC9dLFxuICAgIFsnR0dHRy1bV11XVycsIC9cXGR7NH0tV1xcZFxcZC8sIGZhbHNlXSxcbiAgICBbJ1lZWVktREREJywgL1xcZHs0fS1cXGR7M30vXSxcbiAgICBbJ1lZWVktTU0nLCAvXFxkezR9LVxcZFxcZC8sIGZhbHNlXSxcbiAgICBbJ1lZWVlZWU1NREQnLCAvWystXVxcZHsxMH0vXSxcbiAgICBbJ1lZWVlNTUREJywgL1xcZHs4fS9dLFxuICAgIC8vIFlZWVlNTSBpcyBOT1QgYWxsb3dlZCBieSB0aGUgc3RhbmRhcmRcbiAgICBbJ0dHR0dbV11XV0UnLCAvXFxkezR9V1xcZHszfS9dLFxuICAgIFsnR0dHR1tXXVdXJywgL1xcZHs0fVdcXGR7Mn0vLCBmYWxzZV0sXG4gICAgWydZWVlZREREJywgL1xcZHs3fS9dXG5dO1xuXG4vLyBpc28gdGltZSBmb3JtYXRzIGFuZCByZWdleGVzXG52YXIgaXNvVGltZXMgPSBbXG4gICAgWydISDptbTpzcy5TU1NTJywgL1xcZFxcZDpcXGRcXGQ6XFxkXFxkXFwuXFxkKy9dLFxuICAgIFsnSEg6bW06c3MsU1NTUycsIC9cXGRcXGQ6XFxkXFxkOlxcZFxcZCxcXGQrL10sXG4gICAgWydISDptbTpzcycsIC9cXGRcXGQ6XFxkXFxkOlxcZFxcZC9dLFxuICAgIFsnSEg6bW0nLCAvXFxkXFxkOlxcZFxcZC9dLFxuICAgIFsnSEhtbXNzLlNTU1MnLCAvXFxkXFxkXFxkXFxkXFxkXFxkXFwuXFxkKy9dLFxuICAgIFsnSEhtbXNzLFNTU1MnLCAvXFxkXFxkXFxkXFxkXFxkXFxkLFxcZCsvXSxcbiAgICBbJ0hIbW1zcycsIC9cXGRcXGRcXGRcXGRcXGRcXGQvXSxcbiAgICBbJ0hIbW0nLCAvXFxkXFxkXFxkXFxkL10sXG4gICAgWydISCcsIC9cXGRcXGQvXVxuXTtcblxudmFyIGFzcE5ldEpzb25SZWdleCA9IC9eXFwvP0RhdGVcXCgoXFwtP1xcZCspL2k7XG5cbi8vIGRhdGUgZnJvbSBpc28gZm9ybWF0XG5mdW5jdGlvbiBjb25maWdGcm9tSVNPKGNvbmZpZykge1xuICAgIHZhciBpLCBsLFxuICAgICAgICBzdHJpbmcgPSBjb25maWcuX2ksXG4gICAgICAgIG1hdGNoID0gZXh0ZW5kZWRJc29SZWdleC5leGVjKHN0cmluZykgfHwgYmFzaWNJc29SZWdleC5leGVjKHN0cmluZyksXG4gICAgICAgIGFsbG93VGltZSwgZGF0ZUZvcm1hdCwgdGltZUZvcm1hdCwgdHpGb3JtYXQ7XG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaXNvID0gdHJ1ZTtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvRGF0ZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaXNvRGF0ZXNbaV1bMV0uZXhlYyhtYXRjaFsxXSkpIHtcbiAgICAgICAgICAgICAgICBkYXRlRm9ybWF0ID0gaXNvRGF0ZXNbaV1bMF07XG4gICAgICAgICAgICAgICAgYWxsb3dUaW1lID0gaXNvRGF0ZXNbaV1bMl0gIT09IGZhbHNlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRlRm9ybWF0ID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXRjaFszXSkge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb1RpbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpc29UaW1lc1tpXVsxXS5leGVjKG1hdGNoWzNdKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYXRjaFsyXSBzaG91bGQgYmUgJ1QnIG9yIHNwYWNlXG4gICAgICAgICAgICAgICAgICAgIHRpbWVGb3JtYXQgPSAobWF0Y2hbMl0gfHwgJyAnKSArIGlzb1RpbWVzW2ldWzBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGltZUZvcm1hdCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghYWxsb3dUaW1lICYmIHRpbWVGb3JtYXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoWzRdKSB7XG4gICAgICAgICAgICBpZiAodHpSZWdleC5leGVjKG1hdGNoWzRdKSkge1xuICAgICAgICAgICAgICAgIHR6Rm9ybWF0ID0gJ1onO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uZmlnLl9mID0gZGF0ZUZvcm1hdCArICh0aW1lRm9ybWF0IHx8ICcnKSArICh0ekZvcm1hdCB8fCAnJyk7XG4gICAgICAgIGNvbmZpZ0Zyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICB9XG59XG5cbi8vIFJGQyAyODIyIHJlZ2V4OiBGb3IgZGV0YWlscyBzZWUgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzI4MjIjc2VjdGlvbi0zLjNcbnZhciBiYXNpY1JmY1JlZ2V4ID0gL14oKD86TW9ufFR1ZXxXZWR8VGh1fEZyaXxTYXR8U3VuKSw/XFxzKT8oXFxkP1xcZFxccyg/OkphbnxGZWJ8TWFyfEFwcnxNYXl8SnVufEp1bHxBdWd8U2VwfE9jdHxOb3Z8RGVjKVxccyg/OlxcZFxcZCk/XFxkXFxkXFxzKShcXGRcXGQ6XFxkXFxkKShcXDpcXGRcXGQpPyhcXHMoPzpVVHxHTVR8W0VDTVBdW1NEXVR8W0EtSUstWmEtaWstel18WystXVxcZHs0fSkpJC87XG5cbi8vIGRhdGUgYW5kIHRpbWUgZnJvbSByZWYgMjgyMiBmb3JtYXRcbmZ1bmN0aW9uIGNvbmZpZ0Zyb21SRkMyODIyKGNvbmZpZykge1xuICAgIHZhciBzdHJpbmcsIG1hdGNoLCBkYXlGb3JtYXQsXG4gICAgICAgIGRhdGVGb3JtYXQsIHRpbWVGb3JtYXQsIHR6Rm9ybWF0O1xuICAgIHZhciB0aW1lem9uZXMgPSB7XG4gICAgICAgICcgR01UJzogJyArMDAwMCcsXG4gICAgICAgICcgRURUJzogJyAtMDQwMCcsXG4gICAgICAgICcgRVNUJzogJyAtMDUwMCcsXG4gICAgICAgICcgQ0RUJzogJyAtMDUwMCcsXG4gICAgICAgICcgQ1NUJzogJyAtMDYwMCcsXG4gICAgICAgICcgTURUJzogJyAtMDYwMCcsXG4gICAgICAgICcgTVNUJzogJyAtMDcwMCcsXG4gICAgICAgICcgUERUJzogJyAtMDcwMCcsXG4gICAgICAgICcgUFNUJzogJyAtMDgwMCdcbiAgICB9O1xuICAgIHZhciBtaWxpdGFyeSA9ICdZWFdWVVRTUlFQT05aQUJDREVGR0hJS0xNJztcbiAgICB2YXIgdGltZXpvbmUsIHRpbWV6b25lSW5kZXg7XG5cbiAgICBzdHJpbmcgPSBjb25maWcuX2lcbiAgICAgICAgLnJlcGxhY2UoL1xcKFteXFwpXSpcXCl8W1xcblxcdF0vZywgJyAnKSAvLyBSZW1vdmUgY29tbWVudHMgYW5kIGZvbGRpbmcgd2hpdGVzcGFjZVxuICAgICAgICAucmVwbGFjZSgvKFxcc1xccyspL2csICcgJykgLy8gUmVwbGFjZSBtdWx0aXBsZS1zcGFjZXMgd2l0aCBhIHNpbmdsZSBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvXlxcc3xcXHMkL2csICcnKTsgLy8gUmVtb3ZlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNwYWNlc1xuICAgIG1hdGNoID0gYmFzaWNSZmNSZWdleC5leGVjKHN0cmluZyk7XG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgZGF5Rm9ybWF0ID0gbWF0Y2hbMV0gPyAnZGRkJyArICgobWF0Y2hbMV0ubGVuZ3RoID09PSA1KSA/ICcsICcgOiAnICcpIDogJyc7XG4gICAgICAgIGRhdGVGb3JtYXQgPSAnRCBNTU0gJyArICgobWF0Y2hbMl0ubGVuZ3RoID4gMTApID8gJ1lZWVkgJyA6ICdZWSAnKTtcbiAgICAgICAgdGltZUZvcm1hdCA9ICdISDptbScgKyAobWF0Y2hbNF0gPyAnOnNzJyA6ICcnKTtcblxuICAgICAgICAvLyBUT0RPOiBSZXBsYWNlIHRoZSB2YW5pbGxhIEpTIERhdGUgb2JqZWN0IHdpdGggYW4gaW5kZXBlbnRlbnQgZGF5LW9mLXdlZWsgY2hlY2suXG4gICAgICAgIGlmIChtYXRjaFsxXSkgeyAvLyBkYXkgb2Ygd2VlayBnaXZlblxuICAgICAgICAgICAgdmFyIG1vbWVudERhdGUgPSBuZXcgRGF0ZShtYXRjaFsyXSk7XG4gICAgICAgICAgICB2YXIgbW9tZW50RGF5ID0gWydTdW4nLCdNb24nLCdUdWUnLCdXZWQnLCdUaHUnLCdGcmknLCdTYXQnXVttb21lbnREYXRlLmdldERheSgpXTtcblxuICAgICAgICAgICAgaWYgKG1hdGNoWzFdLnN1YnN0cigwLDMpICE9PSBtb21lbnREYXkpIHtcbiAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS53ZWVrZGF5TWlzbWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAobWF0Y2hbNV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIDI6IC8vIG1pbGl0YXJ5XG4gICAgICAgICAgICAgICAgaWYgKHRpbWV6b25lSW5kZXggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZXpvbmUgPSAnICswMDAwJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aW1lem9uZUluZGV4ID0gbWlsaXRhcnkuaW5kZXhPZihtYXRjaFs1XVsxXS50b1VwcGVyQ2FzZSgpKSAtIDEyO1xuICAgICAgICAgICAgICAgICAgICB0aW1lem9uZSA9ICgodGltZXpvbmVJbmRleCA8IDApID8gJyAtJyA6ICcgKycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICgoJycgKyB0aW1lem9uZUluZGV4KS5yZXBsYWNlKC9eLT8vLCAnMCcpKS5tYXRjaCgvLi4kLylbMF0gKyAnMDAnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNDogLy8gWm9uZVxuICAgICAgICAgICAgICAgIHRpbWV6b25lID0gdGltZXpvbmVzW21hdGNoWzVdXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IC8vIFVUIG9yICsvLTk5OTlcbiAgICAgICAgICAgICAgICB0aW1lem9uZSA9IHRpbWV6b25lc1snIEdNVCddO1xuICAgICAgICB9XG4gICAgICAgIG1hdGNoWzVdID0gdGltZXpvbmU7XG4gICAgICAgIGNvbmZpZy5faSA9IG1hdGNoLnNwbGljZSgxKS5qb2luKCcnKTtcbiAgICAgICAgdHpGb3JtYXQgPSAnIFpaJztcbiAgICAgICAgY29uZmlnLl9mID0gZGF5Rm9ybWF0ICsgZGF0ZUZvcm1hdCArIHRpbWVGb3JtYXQgKyB0ekZvcm1hdDtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5yZmMyODIyID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICB9XG59XG5cbi8vIGRhdGUgZnJvbSBpc28gZm9ybWF0IG9yIGZhbGxiYWNrXG5mdW5jdGlvbiBjb25maWdGcm9tU3RyaW5nKGNvbmZpZykge1xuICAgIHZhciBtYXRjaGVkID0gYXNwTmV0SnNvblJlZ2V4LmV4ZWMoY29uZmlnLl9pKTtcblxuICAgIGlmIChtYXRjaGVkICE9PSBudWxsKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKCttYXRjaGVkWzFdKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbmZpZ0Zyb21JU08oY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLl9pc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgICBkZWxldGUgY29uZmlnLl9pc1ZhbGlkO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25maWdGcm9tUkZDMjgyMihjb25maWcpO1xuICAgIGlmIChjb25maWcuX2lzVmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICAgIGRlbGV0ZSBjb25maWcuX2lzVmFsaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEZpbmFsIGF0dGVtcHQsIHVzZSBJbnB1dCBGYWxsYmFja1xuICAgIGhvb2tzLmNyZWF0ZUZyb21JbnB1dEZhbGxiYWNrKGNvbmZpZyk7XG59XG5cbmhvb2tzLmNyZWF0ZUZyb21JbnB1dEZhbGxiYWNrID0gZGVwcmVjYXRlKFxuICAgICd2YWx1ZSBwcm92aWRlZCBpcyBub3QgaW4gYSByZWNvZ25pemVkIFJGQzI4MjIgb3IgSVNPIGZvcm1hdC4gbW9tZW50IGNvbnN0cnVjdGlvbiBmYWxscyBiYWNrIHRvIGpzIERhdGUoKSwgJyArXG4gICAgJ3doaWNoIGlzIG5vdCByZWxpYWJsZSBhY3Jvc3MgYWxsIGJyb3dzZXJzIGFuZCB2ZXJzaW9ucy4gTm9uIFJGQzI4MjIvSVNPIGRhdGUgZm9ybWF0cyBhcmUgJyArXG4gICAgJ2Rpc2NvdXJhZ2VkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYW4gdXBjb21pbmcgbWFqb3IgcmVsZWFzZS4gUGxlYXNlIHJlZmVyIHRvICcgK1xuICAgICdodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL2pzLWRhdGUvIGZvciBtb3JlIGluZm8uJyxcbiAgICBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGNvbmZpZy5faSArIChjb25maWcuX3VzZVVUQyA/ICcgVVRDJyA6ICcnKSk7XG4gICAgfVxuKTtcblxuLy8gUGljayB0aGUgZmlyc3QgZGVmaW5lZCBvZiB0d28gb3IgdGhyZWUgYXJndW1lbnRzLlxuZnVuY3Rpb24gZGVmYXVsdHMoYSwgYiwgYykge1xuICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIGlmIChiICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGI7XG4gICAgfVxuICAgIHJldHVybiBjO1xufVxuXG5mdW5jdGlvbiBjdXJyZW50RGF0ZUFycmF5KGNvbmZpZykge1xuICAgIC8vIGhvb2tzIGlzIGFjdHVhbGx5IHRoZSBleHBvcnRlZCBtb21lbnQgb2JqZWN0XG4gICAgdmFyIG5vd1ZhbHVlID0gbmV3IERhdGUoaG9va3Mubm93KCkpO1xuICAgIGlmIChjb25maWcuX3VzZVVUQykge1xuICAgICAgICByZXR1cm4gW25vd1ZhbHVlLmdldFVUQ0Z1bGxZZWFyKCksIG5vd1ZhbHVlLmdldFVUQ01vbnRoKCksIG5vd1ZhbHVlLmdldFVUQ0RhdGUoKV07XG4gICAgfVxuICAgIHJldHVybiBbbm93VmFsdWUuZ2V0RnVsbFllYXIoKSwgbm93VmFsdWUuZ2V0TW9udGgoKSwgbm93VmFsdWUuZ2V0RGF0ZSgpXTtcbn1cblxuLy8gY29udmVydCBhbiBhcnJheSB0byBhIGRhdGUuXG4vLyB0aGUgYXJyYXkgc2hvdWxkIG1pcnJvciB0aGUgcGFyYW1ldGVycyBiZWxvd1xuLy8gbm90ZTogYWxsIHZhbHVlcyBwYXN0IHRoZSB5ZWFyIGFyZSBvcHRpb25hbCBhbmQgd2lsbCBkZWZhdWx0IHRvIHRoZSBsb3dlc3QgcG9zc2libGUgdmFsdWUuXG4vLyBbeWVhciwgbW9udGgsIGRheSAsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtaWxsaXNlY29uZF1cbmZ1bmN0aW9uIGNvbmZpZ0Zyb21BcnJheSAoY29uZmlnKSB7XG4gICAgdmFyIGksIGRhdGUsIGlucHV0ID0gW10sIGN1cnJlbnREYXRlLCB5ZWFyVG9Vc2U7XG5cbiAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjdXJyZW50RGF0ZSA9IGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKTtcblxuICAgIC8vY29tcHV0ZSBkYXkgb2YgdGhlIHllYXIgZnJvbSB3ZWVrcyBhbmQgd2Vla2RheXNcbiAgICBpZiAoY29uZmlnLl93ICYmIGNvbmZpZy5fYVtEQVRFXSA9PSBudWxsICYmIGNvbmZpZy5fYVtNT05USF0gPT0gbnVsbCkge1xuICAgICAgICBkYXlPZlllYXJGcm9tV2Vla0luZm8oY29uZmlnKTtcbiAgICB9XG5cbiAgICAvL2lmIHRoZSBkYXkgb2YgdGhlIHllYXIgaXMgc2V0LCBmaWd1cmUgb3V0IHdoYXQgaXQgaXNcbiAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIgIT0gbnVsbCkge1xuICAgICAgICB5ZWFyVG9Vc2UgPSBkZWZhdWx0cyhjb25maWcuX2FbWUVBUl0sIGN1cnJlbnREYXRlW1lFQVJdKTtcblxuICAgICAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIgPiBkYXlzSW5ZZWFyKHllYXJUb1VzZSkgfHwgY29uZmlnLl9kYXlPZlllYXIgPT09IDApIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd0RheU9mWWVhciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBkYXRlID0gY3JlYXRlVVRDRGF0ZSh5ZWFyVG9Vc2UsIDAsIGNvbmZpZy5fZGF5T2ZZZWFyKTtcbiAgICAgICAgY29uZmlnLl9hW01PTlRIXSA9IGRhdGUuZ2V0VVRDTW9udGgoKTtcbiAgICAgICAgY29uZmlnLl9hW0RBVEVdID0gZGF0ZS5nZXRVVENEYXRlKCk7XG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdCB0byBjdXJyZW50IGRhdGUuXG4gICAgLy8gKiBpZiBubyB5ZWFyLCBtb250aCwgZGF5IG9mIG1vbnRoIGFyZSBnaXZlbiwgZGVmYXVsdCB0byB0b2RheVxuICAgIC8vICogaWYgZGF5IG9mIG1vbnRoIGlzIGdpdmVuLCBkZWZhdWx0IG1vbnRoIGFuZCB5ZWFyXG4gICAgLy8gKiBpZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBvbmx5IHllYXJcbiAgICAvLyAqIGlmIHllYXIgaXMgZ2l2ZW4sIGRvbid0IGRlZmF1bHQgYW55dGhpbmdcbiAgICBmb3IgKGkgPSAwOyBpIDwgMyAmJiBjb25maWcuX2FbaV0gPT0gbnVsbDsgKytpKSB7XG4gICAgICAgIGNvbmZpZy5fYVtpXSA9IGlucHV0W2ldID0gY3VycmVudERhdGVbaV07XG4gICAgfVxuXG4gICAgLy8gWmVybyBvdXQgd2hhdGV2ZXIgd2FzIG5vdCBkZWZhdWx0ZWQsIGluY2x1ZGluZyB0aW1lXG4gICAgZm9yICg7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSAoY29uZmlnLl9hW2ldID09IG51bGwpID8gKGkgPT09IDIgPyAxIDogMCkgOiBjb25maWcuX2FbaV07XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIDI0OjAwOjAwLjAwMFxuICAgIGlmIChjb25maWcuX2FbSE9VUl0gPT09IDI0ICYmXG4gICAgICAgICAgICBjb25maWcuX2FbTUlOVVRFXSA9PT0gMCAmJlxuICAgICAgICAgICAgY29uZmlnLl9hW1NFQ09ORF0gPT09IDAgJiZcbiAgICAgICAgICAgIGNvbmZpZy5fYVtNSUxMSVNFQ09ORF0gPT09IDApIHtcbiAgICAgICAgY29uZmlnLl9uZXh0RGF5ID0gdHJ1ZTtcbiAgICAgICAgY29uZmlnLl9hW0hPVVJdID0gMDtcbiAgICB9XG5cbiAgICBjb25maWcuX2QgPSAoY29uZmlnLl91c2VVVEMgPyBjcmVhdGVVVENEYXRlIDogY3JlYXRlRGF0ZSkuYXBwbHkobnVsbCwgaW5wdXQpO1xuICAgIC8vIEFwcGx5IHRpbWV6b25lIG9mZnNldCBmcm9tIGlucHV0LiBUaGUgYWN0dWFsIHV0Y09mZnNldCBjYW4gYmUgY2hhbmdlZFxuICAgIC8vIHdpdGggcGFyc2Vab25lLlxuICAgIGlmIChjb25maWcuX3R6bSAhPSBudWxsKSB7XG4gICAgICAgIGNvbmZpZy5fZC5zZXRVVENNaW51dGVzKGNvbmZpZy5fZC5nZXRVVENNaW51dGVzKCkgLSBjb25maWcuX3R6bSk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5fbmV4dERheSkge1xuICAgICAgICBjb25maWcuX2FbSE9VUl0gPSAyNDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRheU9mWWVhckZyb21XZWVrSW5mbyhjb25maWcpIHtcbiAgICB2YXIgdywgd2Vla1llYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95LCB0ZW1wLCB3ZWVrZGF5T3ZlcmZsb3c7XG5cbiAgICB3ID0gY29uZmlnLl93O1xuICAgIGlmICh3LkdHICE9IG51bGwgfHwgdy5XICE9IG51bGwgfHwgdy5FICE9IG51bGwpIHtcbiAgICAgICAgZG93ID0gMTtcbiAgICAgICAgZG95ID0gNDtcblxuICAgICAgICAvLyBUT0RPOiBXZSBuZWVkIHRvIHRha2UgdGhlIGN1cnJlbnQgaXNvV2Vla1llYXIsIGJ1dCB0aGF0IGRlcGVuZHMgb25cbiAgICAgICAgLy8gaG93IHdlIGludGVycHJldCBub3cgKGxvY2FsLCB1dGMsIGZpeGVkIG9mZnNldCkuIFNvIGNyZWF0ZVxuICAgICAgICAvLyBhIG5vdyB2ZXJzaW9uIG9mIGN1cnJlbnQgY29uZmlnICh0YWtlIGxvY2FsL3V0Yy9vZmZzZXQgZmxhZ3MsIGFuZFxuICAgICAgICAvLyBjcmVhdGUgbm93KS5cbiAgICAgICAgd2Vla1llYXIgPSBkZWZhdWx0cyh3LkdHLCBjb25maWcuX2FbWUVBUl0sIHdlZWtPZlllYXIoY3JlYXRlTG9jYWwoKSwgMSwgNCkueWVhcik7XG4gICAgICAgIHdlZWsgPSBkZWZhdWx0cyh3LlcsIDEpO1xuICAgICAgICB3ZWVrZGF5ID0gZGVmYXVsdHMody5FLCAxKTtcbiAgICAgICAgaWYgKHdlZWtkYXkgPCAxIHx8IHdlZWtkYXkgPiA3KSB7XG4gICAgICAgICAgICB3ZWVrZGF5T3ZlcmZsb3cgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZG93ID0gY29uZmlnLl9sb2NhbGUuX3dlZWsuZG93O1xuICAgICAgICBkb3kgPSBjb25maWcuX2xvY2FsZS5fd2Vlay5kb3k7XG5cbiAgICAgICAgdmFyIGN1cldlZWsgPSB3ZWVrT2ZZZWFyKGNyZWF0ZUxvY2FsKCksIGRvdywgZG95KTtcblxuICAgICAgICB3ZWVrWWVhciA9IGRlZmF1bHRzKHcuZ2csIGNvbmZpZy5fYVtZRUFSXSwgY3VyV2Vlay55ZWFyKTtcblxuICAgICAgICAvLyBEZWZhdWx0IHRvIGN1cnJlbnQgd2Vlay5cbiAgICAgICAgd2VlayA9IGRlZmF1bHRzKHcudywgY3VyV2Vlay53ZWVrKTtcblxuICAgICAgICBpZiAody5kICE9IG51bGwpIHtcbiAgICAgICAgICAgIC8vIHdlZWtkYXkgLS0gbG93IGRheSBudW1iZXJzIGFyZSBjb25zaWRlcmVkIG5leHQgd2Vla1xuICAgICAgICAgICAgd2Vla2RheSA9IHcuZDtcbiAgICAgICAgICAgIGlmICh3ZWVrZGF5IDwgMCB8fCB3ZWVrZGF5ID4gNikge1xuICAgICAgICAgICAgICAgIHdlZWtkYXlPdmVyZmxvdyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAody5lICE9IG51bGwpIHtcbiAgICAgICAgICAgIC8vIGxvY2FsIHdlZWtkYXkgLS0gY291bnRpbmcgc3RhcnRzIGZyb20gYmVnaW5pbmcgb2Ygd2Vla1xuICAgICAgICAgICAgd2Vla2RheSA9IHcuZSArIGRvdztcbiAgICAgICAgICAgIGlmICh3LmUgPCAwIHx8IHcuZSA+IDYpIHtcbiAgICAgICAgICAgICAgICB3ZWVrZGF5T3ZlcmZsb3cgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZGVmYXVsdCB0byBiZWdpbmluZyBvZiB3ZWVrXG4gICAgICAgICAgICB3ZWVrZGF5ID0gZG93O1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh3ZWVrIDwgMSB8fCB3ZWVrID4gd2Vla3NJblllYXIod2Vla1llYXIsIGRvdywgZG95KSkge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5fb3ZlcmZsb3dXZWVrcyA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh3ZWVrZGF5T3ZlcmZsb3cgIT0gbnVsbCkge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5fb3ZlcmZsb3dXZWVrZGF5ID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0ZW1wID0gZGF5T2ZZZWFyRnJvbVdlZWtzKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSk7XG4gICAgICAgIGNvbmZpZy5fYVtZRUFSXSA9IHRlbXAueWVhcjtcbiAgICAgICAgY29uZmlnLl9kYXlPZlllYXIgPSB0ZW1wLmRheU9mWWVhcjtcbiAgICB9XG59XG5cbi8vIGNvbnN0YW50IHRoYXQgcmVmZXJzIHRvIHRoZSBJU08gc3RhbmRhcmRcbmhvb2tzLklTT184NjAxID0gZnVuY3Rpb24gKCkge307XG5cbi8vIGNvbnN0YW50IHRoYXQgcmVmZXJzIHRvIHRoZSBSRkMgMjgyMiBmb3JtXG5ob29rcy5SRkNfMjgyMiA9IGZ1bmN0aW9uICgpIHt9O1xuXG4vLyBkYXRlIGZyb20gc3RyaW5nIGFuZCBmb3JtYXQgc3RyaW5nXG5mdW5jdGlvbiBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZykge1xuICAgIC8vIFRPRE86IE1vdmUgdGhpcyB0byBhbm90aGVyIHBhcnQgb2YgdGhlIGNyZWF0aW9uIGZsb3cgdG8gcHJldmVudCBjaXJjdWxhciBkZXBzXG4gICAgaWYgKGNvbmZpZy5fZiA9PT0gaG9va3MuSVNPXzg2MDEpIHtcbiAgICAgICAgY29uZmlnRnJvbUlTTyhjb25maWcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChjb25maWcuX2YgPT09IGhvb2tzLlJGQ18yODIyKSB7XG4gICAgICAgIGNvbmZpZ0Zyb21SRkMyODIyKGNvbmZpZyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uZmlnLl9hID0gW107XG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuZW1wdHkgPSB0cnVlO1xuXG4gICAgLy8gVGhpcyBhcnJheSBpcyB1c2VkIHRvIG1ha2UgYSBEYXRlLCBlaXRoZXIgd2l0aCBgbmV3IERhdGVgIG9yIGBEYXRlLlVUQ2BcbiAgICB2YXIgc3RyaW5nID0gJycgKyBjb25maWcuX2ksXG4gICAgICAgIGksIHBhcnNlZElucHV0LCB0b2tlbnMsIHRva2VuLCBza2lwcGVkLFxuICAgICAgICBzdHJpbmdMZW5ndGggPSBzdHJpbmcubGVuZ3RoLFxuICAgICAgICB0b3RhbFBhcnNlZElucHV0TGVuZ3RoID0gMDtcblxuICAgIHRva2VucyA9IGV4cGFuZEZvcm1hdChjb25maWcuX2YsIGNvbmZpZy5fbG9jYWxlKS5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSB8fCBbXTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICAgIHBhcnNlZElucHV0ID0gKHN0cmluZy5tYXRjaChnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4odG9rZW4sIGNvbmZpZykpIHx8IFtdKVswXTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3Rva2VuJywgdG9rZW4sICdwYXJzZWRJbnB1dCcsIHBhcnNlZElucHV0LFxuICAgICAgICAvLyAgICAgICAgICdyZWdleCcsIGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSk7XG4gICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgc2tpcHBlZCA9IHN0cmluZy5zdWJzdHIoMCwgc3RyaW5nLmluZGV4T2YocGFyc2VkSW5wdXQpKTtcbiAgICAgICAgICAgIGlmIChza2lwcGVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRJbnB1dC5wdXNoKHNraXBwZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSArIHBhcnNlZElucHV0Lmxlbmd0aCk7XG4gICAgICAgICAgICB0b3RhbFBhcnNlZElucHV0TGVuZ3RoICs9IHBhcnNlZElucHV0Lmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICAvLyBkb24ndCBwYXJzZSBpZiBpdCdzIG5vdCBhIGtub3duIHRva2VuXG4gICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1t0b2tlbl0pIHtcbiAgICAgICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgcGFyc2VkSW5wdXQsIGNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY29uZmlnLl9zdHJpY3QgJiYgIXBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhZGQgcmVtYWluaW5nIHVucGFyc2VkIGlucHV0IGxlbmd0aCB0byB0aGUgc3RyaW5nXG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuY2hhcnNMZWZ0T3ZlciA9IHN0cmluZ0xlbmd0aCAtIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGg7XG4gICAgaWYgKHN0cmluZy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnVudXNlZElucHV0LnB1c2goc3RyaW5nKTtcbiAgICB9XG5cbiAgICAvLyBjbGVhciBfMTJoIGZsYWcgaWYgaG91ciBpcyA8PSAxMlxuICAgIGlmIChjb25maWcuX2FbSE9VUl0gPD0gMTIgJiZcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuYmlnSG91ciA9PT0gdHJ1ZSAmJlxuICAgICAgICBjb25maWcuX2FbSE9VUl0gPiAwKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykucGFyc2VkRGF0ZVBhcnRzID0gY29uZmlnLl9hLnNsaWNlKDApO1xuICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLm1lcmlkaWVtID0gY29uZmlnLl9tZXJpZGllbTtcbiAgICAvLyBoYW5kbGUgbWVyaWRpZW1cbiAgICBjb25maWcuX2FbSE9VUl0gPSBtZXJpZGllbUZpeFdyYXAoY29uZmlnLl9sb2NhbGUsIGNvbmZpZy5fYVtIT1VSXSwgY29uZmlnLl9tZXJpZGllbSk7XG5cbiAgICBjb25maWdGcm9tQXJyYXkoY29uZmlnKTtcbiAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XG59XG5cblxuZnVuY3Rpb24gbWVyaWRpZW1GaXhXcmFwIChsb2NhbGUsIGhvdXIsIG1lcmlkaWVtKSB7XG4gICAgdmFyIGlzUG07XG5cbiAgICBpZiAobWVyaWRpZW0gPT0gbnVsbCkge1xuICAgICAgICAvLyBub3RoaW5nIHRvIGRvXG4gICAgICAgIHJldHVybiBob3VyO1xuICAgIH1cbiAgICBpZiAobG9jYWxlLm1lcmlkaWVtSG91ciAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUubWVyaWRpZW1Ib3VyKGhvdXIsIG1lcmlkaWVtKTtcbiAgICB9IGVsc2UgaWYgKGxvY2FsZS5pc1BNICE9IG51bGwpIHtcbiAgICAgICAgLy8gRmFsbGJhY2tcbiAgICAgICAgaXNQbSA9IGxvY2FsZS5pc1BNKG1lcmlkaWVtKTtcbiAgICAgICAgaWYgKGlzUG0gJiYgaG91ciA8IDEyKSB7XG4gICAgICAgICAgICBob3VyICs9IDEyO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNQbSAmJiBob3VyID09PSAxMikge1xuICAgICAgICAgICAgaG91ciA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhvdXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdGhpcyBpcyBub3Qgc3VwcG9zZWQgdG8gaGFwcGVuXG4gICAgICAgIHJldHVybiBob3VyO1xuICAgIH1cbn1cblxuLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgYXJyYXkgb2YgZm9ybWF0IHN0cmluZ3NcbmZ1bmN0aW9uIGNvbmZpZ0Zyb21TdHJpbmdBbmRBcnJheShjb25maWcpIHtcbiAgICB2YXIgdGVtcENvbmZpZyxcbiAgICAgICAgYmVzdE1vbWVudCxcblxuICAgICAgICBzY29yZVRvQmVhdCxcbiAgICAgICAgaSxcbiAgICAgICAgY3VycmVudFNjb3JlO1xuXG4gICAgaWYgKGNvbmZpZy5fZi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaW52YWxpZEZvcm1hdCA9IHRydWU7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKE5hTik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgY29uZmlnLl9mLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGN1cnJlbnRTY29yZSA9IDA7XG4gICAgICAgIHRlbXBDb25maWcgPSBjb3B5Q29uZmlnKHt9LCBjb25maWcpO1xuICAgICAgICBpZiAoY29uZmlnLl91c2VVVEMgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGVtcENvbmZpZy5fdXNlVVRDID0gY29uZmlnLl91c2VVVEM7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcENvbmZpZy5fZiA9IGNvbmZpZy5fZltpXTtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdCh0ZW1wQ29uZmlnKTtcblxuICAgICAgICBpZiAoIWlzVmFsaWQodGVtcENvbmZpZykpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYW55IGlucHV0IHRoYXQgd2FzIG5vdCBwYXJzZWQgYWRkIGEgcGVuYWx0eSBmb3IgdGhhdCBmb3JtYXRcbiAgICAgICAgY3VycmVudFNjb3JlICs9IGdldFBhcnNpbmdGbGFncyh0ZW1wQ29uZmlnKS5jaGFyc0xlZnRPdmVyO1xuXG4gICAgICAgIC8vb3IgdG9rZW5zXG4gICAgICAgIGN1cnJlbnRTY29yZSArPSBnZXRQYXJzaW5nRmxhZ3ModGVtcENvbmZpZykudW51c2VkVG9rZW5zLmxlbmd0aCAqIDEwO1xuXG4gICAgICAgIGdldFBhcnNpbmdGbGFncyh0ZW1wQ29uZmlnKS5zY29yZSA9IGN1cnJlbnRTY29yZTtcblxuICAgICAgICBpZiAoc2NvcmVUb0JlYXQgPT0gbnVsbCB8fCBjdXJyZW50U2NvcmUgPCBzY29yZVRvQmVhdCkge1xuICAgICAgICAgICAgc2NvcmVUb0JlYXQgPSBjdXJyZW50U2NvcmU7XG4gICAgICAgICAgICBiZXN0TW9tZW50ID0gdGVtcENvbmZpZztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4dGVuZChjb25maWcsIGJlc3RNb21lbnQgfHwgdGVtcENvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ0Zyb21PYmplY3QoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5fZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGkgPSBub3JtYWxpemVPYmplY3RVbml0cyhjb25maWcuX2kpO1xuICAgIGNvbmZpZy5fYSA9IG1hcChbaS55ZWFyLCBpLm1vbnRoLCBpLmRheSB8fCBpLmRhdGUsIGkuaG91ciwgaS5taW51dGUsIGkuc2Vjb25kLCBpLm1pbGxpc2Vjb25kXSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqICYmIHBhcnNlSW50KG9iaiwgMTApO1xuICAgIH0pO1xuXG4gICAgY29uZmlnRnJvbUFycmF5KGNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21Db25maWcgKGNvbmZpZykge1xuICAgIHZhciByZXMgPSBuZXcgTW9tZW50KGNoZWNrT3ZlcmZsb3cocHJlcGFyZUNvbmZpZyhjb25maWcpKSk7XG4gICAgaWYgKHJlcy5fbmV4dERheSkge1xuICAgICAgICAvLyBBZGRpbmcgaXMgc21hcnQgZW5vdWdoIGFyb3VuZCBEU1RcbiAgICAgICAgcmVzLmFkZCgxLCAnZCcpO1xuICAgICAgICByZXMuX25leHREYXkgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gcHJlcGFyZUNvbmZpZyAoY29uZmlnKSB7XG4gICAgdmFyIGlucHV0ID0gY29uZmlnLl9pLFxuICAgICAgICBmb3JtYXQgPSBjb25maWcuX2Y7XG5cbiAgICBjb25maWcuX2xvY2FsZSA9IGNvbmZpZy5fbG9jYWxlIHx8IGdldExvY2FsZShjb25maWcuX2wpO1xuXG4gICAgaWYgKGlucHV0ID09PSBudWxsIHx8IChmb3JtYXQgPT09IHVuZGVmaW5lZCAmJiBpbnB1dCA9PT0gJycpKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVJbnZhbGlkKHtudWxsSW5wdXQ6IHRydWV9KTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25maWcuX2kgPSBpbnB1dCA9IGNvbmZpZy5fbG9jYWxlLnByZXBhcnNlKGlucHV0KTtcbiAgICB9XG5cbiAgICBpZiAoaXNNb21lbnQoaW5wdXQpKSB7XG4gICAgICAgIHJldHVybiBuZXcgTW9tZW50KGNoZWNrT3ZlcmZsb3coaW5wdXQpKTtcbiAgICB9IGVsc2UgaWYgKGlzRGF0ZShpbnB1dCkpIHtcbiAgICAgICAgY29uZmlnLl9kID0gaW5wdXQ7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KGZvcm1hdCkpIHtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEFycmF5KGNvbmZpZyk7XG4gICAgfSBlbHNlIGlmIChmb3JtYXQpIHtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgIH0gIGVsc2Uge1xuICAgICAgICBjb25maWdGcm9tSW5wdXQoY29uZmlnKTtcbiAgICB9XG5cbiAgICBpZiAoIWlzVmFsaWQoY29uZmlnKSkge1xuICAgICAgICBjb25maWcuX2QgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBjb25maWc7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ0Zyb21JbnB1dChjb25maWcpIHtcbiAgICB2YXIgaW5wdXQgPSBjb25maWcuX2k7XG4gICAgaWYgKGlzVW5kZWZpbmVkKGlucHV0KSkge1xuICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShob29rcy5ub3coKSk7XG4gICAgfSBlbHNlIGlmIChpc0RhdGUoaW5wdXQpKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGlucHV0LnZhbHVlT2YoKSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbmZpZ0Zyb21TdHJpbmcoY29uZmlnKTtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkoaW5wdXQpKSB7XG4gICAgICAgIGNvbmZpZy5fYSA9IG1hcChpbnB1dC5zbGljZSgwKSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KG9iaiwgMTApO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uZmlnRnJvbUFycmF5KGNvbmZpZyk7XG4gICAgfSBlbHNlIGlmIChpc09iamVjdChpbnB1dCkpIHtcbiAgICAgICAgY29uZmlnRnJvbU9iamVjdChjb25maWcpO1xuICAgIH0gZWxzZSBpZiAoaXNOdW1iZXIoaW5wdXQpKSB7XG4gICAgICAgIC8vIGZyb20gbWlsbGlzZWNvbmRzXG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGlucHV0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBob29rcy5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayhjb25maWcpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlTG9jYWxPclVUQyAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QsIGlzVVRDKSB7XG4gICAgdmFyIGMgPSB7fTtcblxuICAgIGlmIChsb2NhbGUgPT09IHRydWUgfHwgbG9jYWxlID09PSBmYWxzZSkge1xuICAgICAgICBzdHJpY3QgPSBsb2NhbGU7XG4gICAgICAgIGxvY2FsZSA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAoKGlzT2JqZWN0KGlucHV0KSAmJiBpc09iamVjdEVtcHR5KGlucHV0KSkgfHxcbiAgICAgICAgICAgIChpc0FycmF5KGlucHV0KSAmJiBpbnB1dC5sZW5ndGggPT09IDApKSB7XG4gICAgICAgIGlucHV0ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTQyM1xuICAgIGMuX2lzQU1vbWVudE9iamVjdCA9IHRydWU7XG4gICAgYy5fdXNlVVRDID0gYy5faXNVVEMgPSBpc1VUQztcbiAgICBjLl9sID0gbG9jYWxlO1xuICAgIGMuX2kgPSBpbnB1dDtcbiAgICBjLl9mID0gZm9ybWF0O1xuICAgIGMuX3N0cmljdCA9IHN0cmljdDtcblxuICAgIHJldHVybiBjcmVhdGVGcm9tQ29uZmlnKGMpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMb2NhbCAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QpIHtcbiAgICByZXR1cm4gY3JlYXRlTG9jYWxPclVUQyhpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCwgZmFsc2UpO1xufVxuXG52YXIgcHJvdG90eXBlTWluID0gZGVwcmVjYXRlKFxuICAgICdtb21lbnQoKS5taW4gaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudC5tYXggaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9taW4tbWF4LycsXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3RoZXIgPSBjcmVhdGVMb2NhbC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkKCkgJiYgb3RoZXIuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3RoZXIgPCB0aGlzID8gdGhpcyA6IG90aGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cbik7XG5cbnZhciBwcm90b3R5cGVNYXggPSBkZXByZWNhdGUoXG4gICAgJ21vbWVudCgpLm1heCBpcyBkZXByZWNhdGVkLCB1c2UgbW9tZW50Lm1pbiBpbnN0ZWFkLiBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL21pbi1tYXgvJyxcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdGhlciA9IGNyZWF0ZUxvY2FsLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJiBvdGhlci5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBvdGhlciA+IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlSW52YWxpZCgpO1xuICAgICAgICB9XG4gICAgfVxuKTtcblxuLy8gUGljayBhIG1vbWVudCBtIGZyb20gbW9tZW50cyBzbyB0aGF0IG1bZm5dKG90aGVyKSBpcyB0cnVlIGZvciBhbGxcbi8vIG90aGVyLiBUaGlzIHJlbGllcyBvbiB0aGUgZnVuY3Rpb24gZm4gdG8gYmUgdHJhbnNpdGl2ZS5cbi8vXG4vLyBtb21lbnRzIHNob3VsZCBlaXRoZXIgYmUgYW4gYXJyYXkgb2YgbW9tZW50IG9iamVjdHMgb3IgYW4gYXJyYXksIHdob3NlXG4vLyBmaXJzdCBlbGVtZW50IGlzIGFuIGFycmF5IG9mIG1vbWVudCBvYmplY3RzLlxuZnVuY3Rpb24gcGlja0J5KGZuLCBtb21lbnRzKSB7XG4gICAgdmFyIHJlcywgaTtcbiAgICBpZiAobW9tZW50cy5sZW5ndGggPT09IDEgJiYgaXNBcnJheShtb21lbnRzWzBdKSkge1xuICAgICAgICBtb21lbnRzID0gbW9tZW50c1swXTtcbiAgICB9XG4gICAgaWYgKCFtb21lbnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlTG9jYWwoKTtcbiAgICB9XG4gICAgcmVzID0gbW9tZW50c1swXTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbW9tZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoIW1vbWVudHNbaV0uaXNWYWxpZCgpIHx8IG1vbWVudHNbaV1bZm5dKHJlcykpIHtcbiAgICAgICAgICAgIHJlcyA9IG1vbWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gVE9ETzogVXNlIFtdLnNvcnQgaW5zdGVhZD9cbmZ1bmN0aW9uIG1pbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICByZXR1cm4gcGlja0J5KCdpc0JlZm9yZScsIGFyZ3MpO1xufVxuXG5mdW5jdGlvbiBtYXggKCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuXG4gICAgcmV0dXJuIHBpY2tCeSgnaXNBZnRlcicsIGFyZ3MpO1xufVxuXG52YXIgbm93ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBEYXRlLm5vdyA/IERhdGUubm93KCkgOiArKG5ldyBEYXRlKCkpO1xufTtcblxudmFyIG9yZGVyaW5nID0gWyd5ZWFyJywgJ3F1YXJ0ZXInLCAnbW9udGgnLCAnd2VlaycsICdkYXknLCAnaG91cicsICdtaW51dGUnLCAnc2Vjb25kJywgJ21pbGxpc2Vjb25kJ107XG5cbmZ1bmN0aW9uIGlzRHVyYXRpb25WYWxpZChtKSB7XG4gICAgZm9yICh2YXIga2V5IGluIG0pIHtcbiAgICAgICAgaWYgKCEob3JkZXJpbmcuaW5kZXhPZihrZXkpICE9PSAtMSAmJiAobVtrZXldID09IG51bGwgfHwgIWlzTmFOKG1ba2V5XSkpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHVuaXRIYXNEZWNpbWFsID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmRlcmluZy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAobVtvcmRlcmluZ1tpXV0pIHtcbiAgICAgICAgICAgIGlmICh1bml0SGFzRGVjaW1hbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gb25seSBhbGxvdyBub24taW50ZWdlcnMgZm9yIHNtYWxsZXN0IHVuaXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYXJzZUZsb2F0KG1bb3JkZXJpbmdbaV1dKSAhPT0gdG9JbnQobVtvcmRlcmluZ1tpXV0pKSB7XG4gICAgICAgICAgICAgICAgdW5pdEhhc0RlY2ltYWwgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWQkMSgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNWYWxpZDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSW52YWxpZCQxKCkge1xuICAgIHJldHVybiBjcmVhdGVEdXJhdGlvbihOYU4pO1xufVxuXG5mdW5jdGlvbiBEdXJhdGlvbiAoZHVyYXRpb24pIHtcbiAgICB2YXIgbm9ybWFsaXplZElucHV0ID0gbm9ybWFsaXplT2JqZWN0VW5pdHMoZHVyYXRpb24pLFxuICAgICAgICB5ZWFycyA9IG5vcm1hbGl6ZWRJbnB1dC55ZWFyIHx8IDAsXG4gICAgICAgIHF1YXJ0ZXJzID0gbm9ybWFsaXplZElucHV0LnF1YXJ0ZXIgfHwgMCxcbiAgICAgICAgbW9udGhzID0gbm9ybWFsaXplZElucHV0Lm1vbnRoIHx8IDAsXG4gICAgICAgIHdlZWtzID0gbm9ybWFsaXplZElucHV0LndlZWsgfHwgMCxcbiAgICAgICAgZGF5cyA9IG5vcm1hbGl6ZWRJbnB1dC5kYXkgfHwgMCxcbiAgICAgICAgaG91cnMgPSBub3JtYWxpemVkSW5wdXQuaG91ciB8fCAwLFxuICAgICAgICBtaW51dGVzID0gbm9ybWFsaXplZElucHV0Lm1pbnV0ZSB8fCAwLFxuICAgICAgICBzZWNvbmRzID0gbm9ybWFsaXplZElucHV0LnNlY29uZCB8fCAwLFxuICAgICAgICBtaWxsaXNlY29uZHMgPSBub3JtYWxpemVkSW5wdXQubWlsbGlzZWNvbmQgfHwgMDtcblxuICAgIHRoaXMuX2lzVmFsaWQgPSBpc0R1cmF0aW9uVmFsaWQobm9ybWFsaXplZElucHV0KTtcblxuICAgIC8vIHJlcHJlc2VudGF0aW9uIGZvciBkYXRlQWRkUmVtb3ZlXG4gICAgdGhpcy5fbWlsbGlzZWNvbmRzID0gK21pbGxpc2Vjb25kcyArXG4gICAgICAgIHNlY29uZHMgKiAxZTMgKyAvLyAxMDAwXG4gICAgICAgIG1pbnV0ZXMgKiA2ZTQgKyAvLyAxMDAwICogNjBcbiAgICAgICAgaG91cnMgKiAxMDAwICogNjAgKiA2MDsgLy91c2luZyAxMDAwICogNjAgKiA2MCBpbnN0ZWFkIG9mIDM2ZTUgdG8gYXZvaWQgZmxvYXRpbmcgcG9pbnQgcm91bmRpbmcgZXJyb3JzIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8yOTc4XG4gICAgLy8gQmVjYXVzZSBvZiBkYXRlQWRkUmVtb3ZlIHRyZWF0cyAyNCBob3VycyBhcyBkaWZmZXJlbnQgZnJvbSBhXG4gICAgLy8gZGF5IHdoZW4gd29ya2luZyBhcm91bmQgRFNULCB3ZSBuZWVkIHRvIHN0b3JlIHRoZW0gc2VwYXJhdGVseVxuICAgIHRoaXMuX2RheXMgPSArZGF5cyArXG4gICAgICAgIHdlZWtzICogNztcbiAgICAvLyBJdCBpcyBpbXBvc3NpYmxlIHRyYW5zbGF0ZSBtb250aHMgaW50byBkYXlzIHdpdGhvdXQga25vd2luZ1xuICAgIC8vIHdoaWNoIG1vbnRocyB5b3UgYXJlIGFyZSB0YWxraW5nIGFib3V0LCBzbyB3ZSBoYXZlIHRvIHN0b3JlXG4gICAgLy8gaXQgc2VwYXJhdGVseS5cbiAgICB0aGlzLl9tb250aHMgPSArbW9udGhzICtcbiAgICAgICAgcXVhcnRlcnMgKiAzICtcbiAgICAgICAgeWVhcnMgKiAxMjtcblxuICAgIHRoaXMuX2RhdGEgPSB7fTtcblxuICAgIHRoaXMuX2xvY2FsZSA9IGdldExvY2FsZSgpO1xuXG4gICAgdGhpcy5fYnViYmxlKCk7XG59XG5cbmZ1bmN0aW9uIGlzRHVyYXRpb24gKG9iaikge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBEdXJhdGlvbjtcbn1cblxuZnVuY3Rpb24gYWJzUm91bmQgKG51bWJlcikge1xuICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKC0xICogbnVtYmVyKSAqIC0xO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG51bWJlcik7XG4gICAgfVxufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmZ1bmN0aW9uIG9mZnNldCAodG9rZW4sIHNlcGFyYXRvcikge1xuICAgIGFkZEZvcm1hdFRva2VuKHRva2VuLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLnV0Y09mZnNldCgpO1xuICAgICAgICB2YXIgc2lnbiA9ICcrJztcbiAgICAgICAgaWYgKG9mZnNldCA8IDApIHtcbiAgICAgICAgICAgIG9mZnNldCA9IC1vZmZzZXQ7XG4gICAgICAgICAgICBzaWduID0gJy0nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaWduICsgemVyb0ZpbGwofn4ob2Zmc2V0IC8gNjApLCAyKSArIHNlcGFyYXRvciArIHplcm9GaWxsKH5+KG9mZnNldCkgJSA2MCwgMik7XG4gICAgfSk7XG59XG5cbm9mZnNldCgnWicsICc6Jyk7XG5vZmZzZXQoJ1paJywgJycpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ1onLCAgbWF0Y2hTaG9ydE9mZnNldCk7XG5hZGRSZWdleFRva2VuKCdaWicsIG1hdGNoU2hvcnRPZmZzZXQpO1xuYWRkUGFyc2VUb2tlbihbJ1onLCAnWlonXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl91c2VVVEMgPSB0cnVlO1xuICAgIGNvbmZpZy5fdHptID0gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaFNob3J0T2Zmc2V0LCBpbnB1dCk7XG59KTtcblxuLy8gSEVMUEVSU1xuXG4vLyB0aW1lem9uZSBjaHVua2VyXG4vLyAnKzEwOjAwJyA+IFsnMTAnLCAgJzAwJ11cbi8vICctMTUzMCcgID4gWyctMTUnLCAnMzAnXVxudmFyIGNodW5rT2Zmc2V0ID0gLyhbXFwrXFwtXXxcXGRcXGQpL2dpO1xuXG5mdW5jdGlvbiBvZmZzZXRGcm9tU3RyaW5nKG1hdGNoZXIsIHN0cmluZykge1xuICAgIHZhciBtYXRjaGVzID0gKHN0cmluZyB8fCAnJykubWF0Y2gobWF0Y2hlcik7XG5cbiAgICBpZiAobWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgY2h1bmsgICA9IG1hdGNoZXNbbWF0Y2hlcy5sZW5ndGggLSAxXSB8fCBbXTtcbiAgICB2YXIgcGFydHMgICA9IChjaHVuayArICcnKS5tYXRjaChjaHVua09mZnNldCkgfHwgWyctJywgMCwgMF07XG4gICAgdmFyIG1pbnV0ZXMgPSArKHBhcnRzWzFdICogNjApICsgdG9JbnQocGFydHNbMl0pO1xuXG4gICAgcmV0dXJuIG1pbnV0ZXMgPT09IDAgP1xuICAgICAgMCA6XG4gICAgICBwYXJ0c1swXSA9PT0gJysnID8gbWludXRlcyA6IC1taW51dGVzO1xufVxuXG4vLyBSZXR1cm4gYSBtb21lbnQgZnJvbSBpbnB1dCwgdGhhdCBpcyBsb2NhbC91dGMvem9uZSBlcXVpdmFsZW50IHRvIG1vZGVsLlxuZnVuY3Rpb24gY2xvbmVXaXRoT2Zmc2V0KGlucHV0LCBtb2RlbCkge1xuICAgIHZhciByZXMsIGRpZmY7XG4gICAgaWYgKG1vZGVsLl9pc1VUQykge1xuICAgICAgICByZXMgPSBtb2RlbC5jbG9uZSgpO1xuICAgICAgICBkaWZmID0gKGlzTW9tZW50KGlucHV0KSB8fCBpc0RhdGUoaW5wdXQpID8gaW5wdXQudmFsdWVPZigpIDogY3JlYXRlTG9jYWwoaW5wdXQpLnZhbHVlT2YoKSkgLSByZXMudmFsdWVPZigpO1xuICAgICAgICAvLyBVc2UgbG93LWxldmVsIGFwaSwgYmVjYXVzZSB0aGlzIGZuIGlzIGxvdy1sZXZlbCBhcGkuXG4gICAgICAgIHJlcy5fZC5zZXRUaW1lKHJlcy5fZC52YWx1ZU9mKCkgKyBkaWZmKTtcbiAgICAgICAgaG9va3MudXBkYXRlT2Zmc2V0KHJlcywgZmFsc2UpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVMb2NhbChpbnB1dCkubG9jYWwoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldERhdGVPZmZzZXQgKG0pIHtcbiAgICAvLyBPbiBGaXJlZm94LjI0IERhdGUjZ2V0VGltZXpvbmVPZmZzZXQgcmV0dXJucyBhIGZsb2F0aW5nIHBvaW50LlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L3B1bGwvMTg3MVxuICAgIHJldHVybiAtTWF0aC5yb3VuZChtLl9kLmdldFRpbWV6b25lT2Zmc2V0KCkgLyAxNSkgKiAxNTtcbn1cblxuLy8gSE9PS1NcblxuLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB3aGVuZXZlciBhIG1vbWVudCBpcyBtdXRhdGVkLlxuLy8gSXQgaXMgaW50ZW5kZWQgdG8ga2VlcCB0aGUgb2Zmc2V0IGluIHN5bmMgd2l0aCB0aGUgdGltZXpvbmUuXG5ob29rcy51cGRhdGVPZmZzZXQgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gTU9NRU5UU1xuXG4vLyBrZWVwTG9jYWxUaW1lID0gdHJ1ZSBtZWFucyBvbmx5IGNoYW5nZSB0aGUgdGltZXpvbmUsIHdpdGhvdXRcbi8vIGFmZmVjdGluZyB0aGUgbG9jYWwgaG91ci4gU28gNTozMToyNiArMDMwMCAtLVt1dGNPZmZzZXQoMiwgdHJ1ZSldLS0+XG4vLyA1OjMxOjI2ICswMjAwIEl0IGlzIHBvc3NpYmxlIHRoYXQgNTozMToyNiBkb2Vzbid0IGV4aXN0IHdpdGggb2Zmc2V0XG4vLyArMDIwMCwgc28gd2UgYWRqdXN0IHRoZSB0aW1lIGFzIG5lZWRlZCwgdG8gYmUgdmFsaWQuXG4vL1xuLy8gS2VlcGluZyB0aGUgdGltZSBhY3R1YWxseSBhZGRzL3N1YnRyYWN0cyAob25lIGhvdXIpXG4vLyBmcm9tIHRoZSBhY3R1YWwgcmVwcmVzZW50ZWQgdGltZS4gVGhhdCBpcyB3aHkgd2UgY2FsbCB1cGRhdGVPZmZzZXRcbi8vIGEgc2Vjb25kIHRpbWUuIEluIGNhc2UgaXQgd2FudHMgdXMgdG8gY2hhbmdlIHRoZSBvZmZzZXQgYWdhaW5cbi8vIF9jaGFuZ2VJblByb2dyZXNzID09IHRydWUgY2FzZSwgdGhlbiB3ZSBoYXZlIHRvIGFkanVzdCwgYmVjYXVzZVxuLy8gdGhlcmUgaXMgbm8gc3VjaCB0aW1lIGluIHRoZSBnaXZlbiB0aW1lem9uZS5cbmZ1bmN0aW9uIGdldFNldE9mZnNldCAoaW5wdXQsIGtlZXBMb2NhbFRpbWUsIGtlZXBNaW51dGVzKSB7XG4gICAgdmFyIG9mZnNldCA9IHRoaXMuX29mZnNldCB8fCAwLFxuICAgICAgICBsb2NhbEFkanVzdDtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsID8gdGhpcyA6IE5hTjtcbiAgICB9XG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlucHV0ID0gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaFNob3J0T2Zmc2V0LCBpbnB1dCk7XG4gICAgICAgICAgICBpZiAoaW5wdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhpbnB1dCkgPCAxNiAmJiAha2VlcE1pbnV0ZXMpIHtcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQgKiA2MDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2lzVVRDICYmIGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgICAgIGxvY2FsQWRqdXN0ID0gZ2V0RGF0ZU9mZnNldCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vZmZzZXQgPSBpbnB1dDtcbiAgICAgICAgdGhpcy5faXNVVEMgPSB0cnVlO1xuICAgICAgICBpZiAobG9jYWxBZGp1c3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGQobG9jYWxBZGp1c3QsICdtJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9mZnNldCAhPT0gaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICgha2VlcExvY2FsVGltZSB8fCB0aGlzLl9jaGFuZ2VJblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgYWRkU3VidHJhY3QodGhpcywgY3JlYXRlRHVyYXRpb24oaW5wdXQgLSBvZmZzZXQsICdtJyksIDEsIGZhbHNlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jaGFuZ2VJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBob29rcy51cGRhdGVPZmZzZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gb2Zmc2V0IDogZ2V0RGF0ZU9mZnNldCh0aGlzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFNldFpvbmUgKGlucHV0LCBrZWVwTG9jYWxUaW1lKSB7XG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlucHV0ID0gLWlucHV0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51dGNPZmZzZXQoaW5wdXQsIGtlZXBMb2NhbFRpbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAtdGhpcy51dGNPZmZzZXQoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldE9mZnNldFRvVVRDIChrZWVwTG9jYWxUaW1lKSB7XG4gICAgcmV0dXJuIHRoaXMudXRjT2Zmc2V0KDAsIGtlZXBMb2NhbFRpbWUpO1xufVxuXG5mdW5jdGlvbiBzZXRPZmZzZXRUb0xvY2FsIChrZWVwTG9jYWxUaW1lKSB7XG4gICAgaWYgKHRoaXMuX2lzVVRDKSB7XG4gICAgICAgIHRoaXMudXRjT2Zmc2V0KDAsIGtlZXBMb2NhbFRpbWUpO1xuICAgICAgICB0aGlzLl9pc1VUQyA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChrZWVwTG9jYWxUaW1lKSB7XG4gICAgICAgICAgICB0aGlzLnN1YnRyYWN0KGdldERhdGVPZmZzZXQodGhpcyksICdtJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIHNldE9mZnNldFRvUGFyc2VkT2Zmc2V0ICgpIHtcbiAgICBpZiAodGhpcy5fdHptICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy51dGNPZmZzZXQodGhpcy5fdHptLCBmYWxzZSwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5faSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFyIHRab25lID0gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaE9mZnNldCwgdGhpcy5faSk7XG4gICAgICAgIGlmICh0Wm9uZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnV0Y09mZnNldCh0Wm9uZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnV0Y09mZnNldCgwLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gaGFzQWxpZ25lZEhvdXJPZmZzZXQgKGlucHV0KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlucHV0ID0gaW5wdXQgPyBjcmVhdGVMb2NhbChpbnB1dCkudXRjT2Zmc2V0KCkgOiAwO1xuXG4gICAgcmV0dXJuICh0aGlzLnV0Y09mZnNldCgpIC0gaW5wdXQpICUgNjAgPT09IDA7XG59XG5cbmZ1bmN0aW9uIGlzRGF5bGlnaHRTYXZpbmdUaW1lICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICB0aGlzLnV0Y09mZnNldCgpID4gdGhpcy5jbG9uZSgpLm1vbnRoKDApLnV0Y09mZnNldCgpIHx8XG4gICAgICAgIHRoaXMudXRjT2Zmc2V0KCkgPiB0aGlzLmNsb25lKCkubW9udGgoNSkudXRjT2Zmc2V0KClcbiAgICApO1xufVxuXG5mdW5jdGlvbiBpc0RheWxpZ2h0U2F2aW5nVGltZVNoaWZ0ZWQgKCkge1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5faXNEU1RTaGlmdGVkKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNEU1RTaGlmdGVkO1xuICAgIH1cblxuICAgIHZhciBjID0ge307XG5cbiAgICBjb3B5Q29uZmlnKGMsIHRoaXMpO1xuICAgIGMgPSBwcmVwYXJlQ29uZmlnKGMpO1xuXG4gICAgaWYgKGMuX2EpIHtcbiAgICAgICAgdmFyIG90aGVyID0gYy5faXNVVEMgPyBjcmVhdGVVVEMoYy5fYSkgOiBjcmVhdGVMb2NhbChjLl9hKTtcbiAgICAgICAgdGhpcy5faXNEU1RTaGlmdGVkID0gdGhpcy5pc1ZhbGlkKCkgJiZcbiAgICAgICAgICAgIGNvbXBhcmVBcnJheXMoYy5fYSwgb3RoZXIudG9BcnJheSgpKSA+IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5faXNEU1RTaGlmdGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2lzRFNUU2hpZnRlZDtcbn1cblxuZnVuY3Rpb24gaXNMb2NhbCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpID8gIXRoaXMuX2lzVVRDIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzVXRjT2Zmc2V0ICgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzLl9pc1VUQyA6IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc1V0YyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpID8gdGhpcy5faXNVVEMgJiYgdGhpcy5fb2Zmc2V0ID09PSAwIDogZmFsc2U7XG59XG5cbi8vIEFTUC5ORVQganNvbiBkYXRlIGZvcm1hdCByZWdleFxudmFyIGFzcE5ldFJlZ2V4ID0gL14oXFwtKT8oPzooXFxkKilbLiBdKT8oXFxkKylcXDooXFxkKykoPzpcXDooXFxkKykoXFwuXFxkKik/KT8kLztcblxuLy8gZnJvbSBodHRwOi8vZG9jcy5jbG9zdXJlLWxpYnJhcnkuZ29vZ2xlY29kZS5jb20vZ2l0L2Nsb3N1cmVfZ29vZ19kYXRlX2RhdGUuanMuc291cmNlLmh0bWxcbi8vIHNvbWV3aGF0IG1vcmUgaW4gbGluZSB3aXRoIDQuNC4zLjIgMjAwNCBzcGVjLCBidXQgYWxsb3dzIGRlY2ltYWwgYW55d2hlcmVcbi8vIGFuZCBmdXJ0aGVyIG1vZGlmaWVkIHRvIGFsbG93IGZvciBzdHJpbmdzIGNvbnRhaW5pbmcgYm90aCB3ZWVrIGFuZCBkYXlcbnZhciBpc29SZWdleCA9IC9eKC0pP1AoPzooLT9bMC05LC5dKilZKT8oPzooLT9bMC05LC5dKilNKT8oPzooLT9bMC05LC5dKilXKT8oPzooLT9bMC05LC5dKilEKT8oPzpUKD86KC0/WzAtOSwuXSopSCk/KD86KC0/WzAtOSwuXSopTSk/KD86KC0/WzAtOSwuXSopUyk/KT8kLztcblxuZnVuY3Rpb24gY3JlYXRlRHVyYXRpb24gKGlucHV0LCBrZXkpIHtcbiAgICB2YXIgZHVyYXRpb24gPSBpbnB1dCxcbiAgICAgICAgLy8gbWF0Y2hpbmcgYWdhaW5zdCByZWdleHAgaXMgZXhwZW5zaXZlLCBkbyBpdCBvbiBkZW1hbmRcbiAgICAgICAgbWF0Y2ggPSBudWxsLFxuICAgICAgICBzaWduLFxuICAgICAgICByZXQsXG4gICAgICAgIGRpZmZSZXM7XG5cbiAgICBpZiAoaXNEdXJhdGlvbihpbnB1dCkpIHtcbiAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICBtcyA6IGlucHV0Ll9taWxsaXNlY29uZHMsXG4gICAgICAgICAgICBkICA6IGlucHV0Ll9kYXlzLFxuICAgICAgICAgICAgTSAgOiBpbnB1dC5fbW9udGhzXG4gICAgICAgIH07XG4gICAgfSBlbHNlIGlmIChpc051bWJlcihpbnB1dCkpIHtcbiAgICAgICAgZHVyYXRpb24gPSB7fTtcbiAgICAgICAgaWYgKGtleSkge1xuICAgICAgICAgICAgZHVyYXRpb25ba2V5XSA9IGlucHV0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZHVyYXRpb24ubWlsbGlzZWNvbmRzID0gaW5wdXQ7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gYXNwTmV0UmVnZXguZXhlYyhpbnB1dCkpKSB7XG4gICAgICAgIHNpZ24gPSAobWF0Y2hbMV0gPT09ICctJykgPyAtMSA6IDE7XG4gICAgICAgIGR1cmF0aW9uID0ge1xuICAgICAgICAgICAgeSAgOiAwLFxuICAgICAgICAgICAgZCAgOiB0b0ludChtYXRjaFtEQVRFXSkgICAgICAgICAgICAgICAgICAgICAgICAgKiBzaWduLFxuICAgICAgICAgICAgaCAgOiB0b0ludChtYXRjaFtIT1VSXSkgICAgICAgICAgICAgICAgICAgICAgICAgKiBzaWduLFxuICAgICAgICAgICAgbSAgOiB0b0ludChtYXRjaFtNSU5VVEVdKSAgICAgICAgICAgICAgICAgICAgICAgKiBzaWduLFxuICAgICAgICAgICAgcyAgOiB0b0ludChtYXRjaFtTRUNPTkRdKSAgICAgICAgICAgICAgICAgICAgICAgKiBzaWduLFxuICAgICAgICAgICAgbXMgOiB0b0ludChhYnNSb3VuZChtYXRjaFtNSUxMSVNFQ09ORF0gKiAxMDAwKSkgKiBzaWduIC8vIHRoZSBtaWxsaXNlY29uZCBkZWNpbWFsIHBvaW50IGlzIGluY2x1ZGVkIGluIHRoZSBtYXRjaFxuICAgICAgICB9O1xuICAgIH0gZWxzZSBpZiAoISEobWF0Y2ggPSBpc29SZWdleC5leGVjKGlucHV0KSkpIHtcbiAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gJy0nKSA/IC0xIDogMTtcbiAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICB5IDogcGFyc2VJc28obWF0Y2hbMl0sIHNpZ24pLFxuICAgICAgICAgICAgTSA6IHBhcnNlSXNvKG1hdGNoWzNdLCBzaWduKSxcbiAgICAgICAgICAgIHcgOiBwYXJzZUlzbyhtYXRjaFs0XSwgc2lnbiksXG4gICAgICAgICAgICBkIDogcGFyc2VJc28obWF0Y2hbNV0sIHNpZ24pLFxuICAgICAgICAgICAgaCA6IHBhcnNlSXNvKG1hdGNoWzZdLCBzaWduKSxcbiAgICAgICAgICAgIG0gOiBwYXJzZUlzbyhtYXRjaFs3XSwgc2lnbiksXG4gICAgICAgICAgICBzIDogcGFyc2VJc28obWF0Y2hbOF0sIHNpZ24pXG4gICAgICAgIH07XG4gICAgfSBlbHNlIGlmIChkdXJhdGlvbiA9PSBudWxsKSB7Ly8gY2hlY2tzIGZvciBudWxsIG9yIHVuZGVmaW5lZFxuICAgICAgICBkdXJhdGlvbiA9IHt9O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGR1cmF0aW9uID09PSAnb2JqZWN0JyAmJiAoJ2Zyb20nIGluIGR1cmF0aW9uIHx8ICd0bycgaW4gZHVyYXRpb24pKSB7XG4gICAgICAgIGRpZmZSZXMgPSBtb21lbnRzRGlmZmVyZW5jZShjcmVhdGVMb2NhbChkdXJhdGlvbi5mcm9tKSwgY3JlYXRlTG9jYWwoZHVyYXRpb24udG8pKTtcblxuICAgICAgICBkdXJhdGlvbiA9IHt9O1xuICAgICAgICBkdXJhdGlvbi5tcyA9IGRpZmZSZXMubWlsbGlzZWNvbmRzO1xuICAgICAgICBkdXJhdGlvbi5NID0gZGlmZlJlcy5tb250aHM7XG4gICAgfVxuXG4gICAgcmV0ID0gbmV3IER1cmF0aW9uKGR1cmF0aW9uKTtcblxuICAgIGlmIChpc0R1cmF0aW9uKGlucHV0KSAmJiBoYXNPd25Qcm9wKGlucHV0LCAnX2xvY2FsZScpKSB7XG4gICAgICAgIHJldC5fbG9jYWxlID0gaW5wdXQuX2xvY2FsZTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xufVxuXG5jcmVhdGVEdXJhdGlvbi5mbiA9IER1cmF0aW9uLnByb3RvdHlwZTtcbmNyZWF0ZUR1cmF0aW9uLmludmFsaWQgPSBjcmVhdGVJbnZhbGlkJDE7XG5cbmZ1bmN0aW9uIHBhcnNlSXNvIChpbnAsIHNpZ24pIHtcbiAgICAvLyBXZSdkIG5vcm1hbGx5IHVzZSB+fmlucCBmb3IgdGhpcywgYnV0IHVuZm9ydHVuYXRlbHkgaXQgYWxzb1xuICAgIC8vIGNvbnZlcnRzIGZsb2F0cyB0byBpbnRzLlxuICAgIC8vIGlucCBtYXkgYmUgdW5kZWZpbmVkLCBzbyBjYXJlZnVsIGNhbGxpbmcgcmVwbGFjZSBvbiBpdC5cbiAgICB2YXIgcmVzID0gaW5wICYmIHBhcnNlRmxvYXQoaW5wLnJlcGxhY2UoJywnLCAnLicpKTtcbiAgICAvLyBhcHBseSBzaWduIHdoaWxlIHdlJ3JlIGF0IGl0XG4gICAgcmV0dXJuIChpc05hTihyZXMpID8gMCA6IHJlcykgKiBzaWduO1xufVxuXG5mdW5jdGlvbiBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKSB7XG4gICAgdmFyIHJlcyA9IHttaWxsaXNlY29uZHM6IDAsIG1vbnRoczogMH07XG5cbiAgICByZXMubW9udGhzID0gb3RoZXIubW9udGgoKSAtIGJhc2UubW9udGgoKSArXG4gICAgICAgIChvdGhlci55ZWFyKCkgLSBiYXNlLnllYXIoKSkgKiAxMjtcbiAgICBpZiAoYmFzZS5jbG9uZSgpLmFkZChyZXMubW9udGhzLCAnTScpLmlzQWZ0ZXIob3RoZXIpKSB7XG4gICAgICAgIC0tcmVzLm1vbnRocztcbiAgICB9XG5cbiAgICByZXMubWlsbGlzZWNvbmRzID0gK290aGVyIC0gKyhiYXNlLmNsb25lKCkuYWRkKHJlcy5tb250aHMsICdNJykpO1xuXG4gICAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gbW9tZW50c0RpZmZlcmVuY2UoYmFzZSwgb3RoZXIpIHtcbiAgICB2YXIgcmVzO1xuICAgIGlmICghKGJhc2UuaXNWYWxpZCgpICYmIG90aGVyLmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIHttaWxsaXNlY29uZHM6IDAsIG1vbnRoczogMH07XG4gICAgfVxuXG4gICAgb3RoZXIgPSBjbG9uZVdpdGhPZmZzZXQob3RoZXIsIGJhc2UpO1xuICAgIGlmIChiYXNlLmlzQmVmb3JlKG90aGVyKSkge1xuICAgICAgICByZXMgPSBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXMgPSBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKG90aGVyLCBiYXNlKTtcbiAgICAgICAgcmVzLm1pbGxpc2Vjb25kcyA9IC1yZXMubWlsbGlzZWNvbmRzO1xuICAgICAgICByZXMubW9udGhzID0gLXJlcy5tb250aHM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gVE9ETzogcmVtb3ZlICduYW1lJyBhcmcgYWZ0ZXIgZGVwcmVjYXRpb24gaXMgcmVtb3ZlZFxuZnVuY3Rpb24gY3JlYXRlQWRkZXIoZGlyZWN0aW9uLCBuYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWwsIHBlcmlvZCkge1xuICAgICAgICB2YXIgZHVyLCB0bXA7XG4gICAgICAgIC8vaW52ZXJ0IHRoZSBhcmd1bWVudHMsIGJ1dCBjb21wbGFpbiBhYm91dCBpdFxuICAgICAgICBpZiAocGVyaW9kICE9PSBudWxsICYmICFpc05hTigrcGVyaW9kKSkge1xuICAgICAgICAgICAgZGVwcmVjYXRlU2ltcGxlKG5hbWUsICdtb21lbnQoKS4nICsgbmFtZSAgKyAnKHBlcmlvZCwgbnVtYmVyKSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIG1vbWVudCgpLicgKyBuYW1lICsgJyhudW1iZXIsIHBlcmlvZCkuICcgK1xuICAgICAgICAgICAgJ1NlZSBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL2FkZC1pbnZlcnRlZC1wYXJhbS8gZm9yIG1vcmUgaW5mby4nKTtcbiAgICAgICAgICAgIHRtcCA9IHZhbDsgdmFsID0gcGVyaW9kOyBwZXJpb2QgPSB0bXA7XG4gICAgICAgIH1cblxuICAgICAgICB2YWwgPSB0eXBlb2YgdmFsID09PSAnc3RyaW5nJyA/ICt2YWwgOiB2YWw7XG4gICAgICAgIGR1ciA9IGNyZWF0ZUR1cmF0aW9uKHZhbCwgcGVyaW9kKTtcbiAgICAgICAgYWRkU3VidHJhY3QodGhpcywgZHVyLCBkaXJlY3Rpb24pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhZGRTdWJ0cmFjdCAobW9tLCBkdXJhdGlvbiwgaXNBZGRpbmcsIHVwZGF0ZU9mZnNldCkge1xuICAgIHZhciBtaWxsaXNlY29uZHMgPSBkdXJhdGlvbi5fbWlsbGlzZWNvbmRzLFxuICAgICAgICBkYXlzID0gYWJzUm91bmQoZHVyYXRpb24uX2RheXMpLFxuICAgICAgICBtb250aHMgPSBhYnNSb3VuZChkdXJhdGlvbi5fbW9udGhzKTtcblxuICAgIGlmICghbW9tLmlzVmFsaWQoKSkge1xuICAgICAgICAvLyBObyBvcFxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdXBkYXRlT2Zmc2V0ID0gdXBkYXRlT2Zmc2V0ID09IG51bGwgPyB0cnVlIDogdXBkYXRlT2Zmc2V0O1xuXG4gICAgaWYgKG1pbGxpc2Vjb25kcykge1xuICAgICAgICBtb20uX2Quc2V0VGltZShtb20uX2QudmFsdWVPZigpICsgbWlsbGlzZWNvbmRzICogaXNBZGRpbmcpO1xuICAgIH1cbiAgICBpZiAoZGF5cykge1xuICAgICAgICBzZXQkMShtb20sICdEYXRlJywgZ2V0KG1vbSwgJ0RhdGUnKSArIGRheXMgKiBpc0FkZGluZyk7XG4gICAgfVxuICAgIGlmIChtb250aHMpIHtcbiAgICAgICAgc2V0TW9udGgobW9tLCBnZXQobW9tLCAnTW9udGgnKSArIG1vbnRocyAqIGlzQWRkaW5nKTtcbiAgICB9XG4gICAgaWYgKHVwZGF0ZU9mZnNldCkge1xuICAgICAgICBob29rcy51cGRhdGVPZmZzZXQobW9tLCBkYXlzIHx8IG1vbnRocyk7XG4gICAgfVxufVxuXG52YXIgYWRkICAgICAgPSBjcmVhdGVBZGRlcigxLCAnYWRkJyk7XG52YXIgc3VidHJhY3QgPSBjcmVhdGVBZGRlcigtMSwgJ3N1YnRyYWN0Jyk7XG5cbmZ1bmN0aW9uIGdldENhbGVuZGFyRm9ybWF0KG15TW9tZW50LCBub3cpIHtcbiAgICB2YXIgZGlmZiA9IG15TW9tZW50LmRpZmYobm93LCAnZGF5cycsIHRydWUpO1xuICAgIHJldHVybiBkaWZmIDwgLTYgPyAnc2FtZUVsc2UnIDpcbiAgICAgICAgICAgIGRpZmYgPCAtMSA/ICdsYXN0V2VlaycgOlxuICAgICAgICAgICAgZGlmZiA8IDAgPyAnbGFzdERheScgOlxuICAgICAgICAgICAgZGlmZiA8IDEgPyAnc2FtZURheScgOlxuICAgICAgICAgICAgZGlmZiA8IDIgPyAnbmV4dERheScgOlxuICAgICAgICAgICAgZGlmZiA8IDcgPyAnbmV4dFdlZWsnIDogJ3NhbWVFbHNlJztcbn1cblxuZnVuY3Rpb24gY2FsZW5kYXIkMSAodGltZSwgZm9ybWF0cykge1xuICAgIC8vIFdlIHdhbnQgdG8gY29tcGFyZSB0aGUgc3RhcnQgb2YgdG9kYXksIHZzIHRoaXMuXG4gICAgLy8gR2V0dGluZyBzdGFydC1vZi10b2RheSBkZXBlbmRzIG9uIHdoZXRoZXIgd2UncmUgbG9jYWwvdXRjL29mZnNldCBvciBub3QuXG4gICAgdmFyIG5vdyA9IHRpbWUgfHwgY3JlYXRlTG9jYWwoKSxcbiAgICAgICAgc29kID0gY2xvbmVXaXRoT2Zmc2V0KG5vdywgdGhpcykuc3RhcnRPZignZGF5JyksXG4gICAgICAgIGZvcm1hdCA9IGhvb2tzLmNhbGVuZGFyRm9ybWF0KHRoaXMsIHNvZCkgfHwgJ3NhbWVFbHNlJztcblxuICAgIHZhciBvdXRwdXQgPSBmb3JtYXRzICYmIChpc0Z1bmN0aW9uKGZvcm1hdHNbZm9ybWF0XSkgPyBmb3JtYXRzW2Zvcm1hdF0uY2FsbCh0aGlzLCBub3cpIDogZm9ybWF0c1tmb3JtYXRdKTtcblxuICAgIHJldHVybiB0aGlzLmZvcm1hdChvdXRwdXQgfHwgdGhpcy5sb2NhbGVEYXRhKCkuY2FsZW5kYXIoZm9ybWF0LCB0aGlzLCBjcmVhdGVMb2NhbChub3cpKSk7XG59XG5cbmZ1bmN0aW9uIGNsb25lICgpIHtcbiAgICByZXR1cm4gbmV3IE1vbWVudCh0aGlzKTtcbn1cblxuZnVuY3Rpb24gaXNBZnRlciAoaW5wdXQsIHVuaXRzKSB7XG4gICAgdmFyIGxvY2FsSW5wdXQgPSBpc01vbWVudChpbnB1dCkgPyBpbnB1dCA6IGNyZWF0ZUxvY2FsKGlucHV0KTtcbiAgICBpZiAoISh0aGlzLmlzVmFsaWQoKSAmJiBsb2NhbElucHV0LmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKCFpc1VuZGVmaW5lZCh1bml0cykgPyB1bml0cyA6ICdtaWxsaXNlY29uZCcpO1xuICAgIGlmICh1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCkgPiBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbG9jYWxJbnB1dC52YWx1ZU9mKCkgPCB0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykudmFsdWVPZigpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNCZWZvcmUgKGlucHV0LCB1bml0cykge1xuICAgIHZhciBsb2NhbElucHV0ID0gaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBjcmVhdGVMb2NhbChpbnB1dCk7XG4gICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyghaXNVbmRlZmluZWQodW5pdHMpID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnKTtcbiAgICBpZiAodW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVPZigpIDwgbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKS5lbmRPZih1bml0cykudmFsdWVPZigpIDwgbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0JldHdlZW4gKGZyb20sIHRvLCB1bml0cywgaW5jbHVzaXZpdHkpIHtcbiAgICBpbmNsdXNpdml0eSA9IGluY2x1c2l2aXR5IHx8ICcoKSc7XG4gICAgcmV0dXJuIChpbmNsdXNpdml0eVswXSA9PT0gJygnID8gdGhpcy5pc0FmdGVyKGZyb20sIHVuaXRzKSA6ICF0aGlzLmlzQmVmb3JlKGZyb20sIHVuaXRzKSkgJiZcbiAgICAgICAgKGluY2x1c2l2aXR5WzFdID09PSAnKScgPyB0aGlzLmlzQmVmb3JlKHRvLCB1bml0cykgOiAhdGhpcy5pc0FmdGVyKHRvLCB1bml0cykpO1xufVxuXG5mdW5jdGlvbiBpc1NhbWUgKGlucHV0LCB1bml0cykge1xuICAgIHZhciBsb2NhbElucHV0ID0gaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBjcmVhdGVMb2NhbChpbnB1dCksXG4gICAgICAgIGlucHV0TXM7XG4gICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyB8fCAnbWlsbGlzZWNvbmQnKTtcbiAgICBpZiAodW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVPZigpID09PSBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbnB1dE1zID0gbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykudmFsdWVPZigpIDw9IGlucHV0TXMgJiYgaW5wdXRNcyA8PSB0aGlzLmNsb25lKCkuZW5kT2YodW5pdHMpLnZhbHVlT2YoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzU2FtZU9yQWZ0ZXIgKGlucHV0LCB1bml0cykge1xuICAgIHJldHVybiB0aGlzLmlzU2FtZShpbnB1dCwgdW5pdHMpIHx8IHRoaXMuaXNBZnRlcihpbnB1dCx1bml0cyk7XG59XG5cbmZ1bmN0aW9uIGlzU2FtZU9yQmVmb3JlIChpbnB1dCwgdW5pdHMpIHtcbiAgICByZXR1cm4gdGhpcy5pc1NhbWUoaW5wdXQsIHVuaXRzKSB8fCB0aGlzLmlzQmVmb3JlKGlucHV0LHVuaXRzKTtcbn1cblxuZnVuY3Rpb24gZGlmZiAoaW5wdXQsIHVuaXRzLCBhc0Zsb2F0KSB7XG4gICAgdmFyIHRoYXQsXG4gICAgICAgIHpvbmVEZWx0YSxcbiAgICAgICAgZGVsdGEsIG91dHB1dDtcblxuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG5cbiAgICB0aGF0ID0gY2xvbmVXaXRoT2Zmc2V0KGlucHV0LCB0aGlzKTtcblxuICAgIGlmICghdGhhdC5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG5cbiAgICB6b25lRGVsdGEgPSAodGhhdC51dGNPZmZzZXQoKSAtIHRoaXMudXRjT2Zmc2V0KCkpICogNmU0O1xuXG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG5cbiAgICBpZiAodW5pdHMgPT09ICd5ZWFyJyB8fCB1bml0cyA9PT0gJ21vbnRoJyB8fCB1bml0cyA9PT0gJ3F1YXJ0ZXInKSB7XG4gICAgICAgIG91dHB1dCA9IG1vbnRoRGlmZih0aGlzLCB0aGF0KTtcbiAgICAgICAgaWYgKHVuaXRzID09PSAncXVhcnRlcicpIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCAvIDM7XG4gICAgICAgIH0gZWxzZSBpZiAodW5pdHMgPT09ICd5ZWFyJykge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0IC8gMTI7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBkZWx0YSA9IHRoaXMgLSB0aGF0O1xuICAgICAgICBvdXRwdXQgPSB1bml0cyA9PT0gJ3NlY29uZCcgPyBkZWx0YSAvIDFlMyA6IC8vIDEwMDBcbiAgICAgICAgICAgIHVuaXRzID09PSAnbWludXRlJyA/IGRlbHRhIC8gNmU0IDogLy8gMTAwMCAqIDYwXG4gICAgICAgICAgICB1bml0cyA9PT0gJ2hvdXInID8gZGVsdGEgLyAzNmU1IDogLy8gMTAwMCAqIDYwICogNjBcbiAgICAgICAgICAgIHVuaXRzID09PSAnZGF5JyA/IChkZWx0YSAtIHpvbmVEZWx0YSkgLyA4NjRlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQsIG5lZ2F0ZSBkc3RcbiAgICAgICAgICAgIHVuaXRzID09PSAnd2VlaycgPyAoZGVsdGEgLSB6b25lRGVsdGEpIC8gNjA0OGU1IDogLy8gMTAwMCAqIDYwICogNjAgKiAyNCAqIDcsIG5lZ2F0ZSBkc3RcbiAgICAgICAgICAgIGRlbHRhO1xuICAgIH1cbiAgICByZXR1cm4gYXNGbG9hdCA/IG91dHB1dCA6IGFic0Zsb29yKG91dHB1dCk7XG59XG5cbmZ1bmN0aW9uIG1vbnRoRGlmZiAoYSwgYikge1xuICAgIC8vIGRpZmZlcmVuY2UgaW4gbW9udGhzXG4gICAgdmFyIHdob2xlTW9udGhEaWZmID0gKChiLnllYXIoKSAtIGEueWVhcigpKSAqIDEyKSArIChiLm1vbnRoKCkgLSBhLm1vbnRoKCkpLFxuICAgICAgICAvLyBiIGlzIGluIChhbmNob3IgLSAxIG1vbnRoLCBhbmNob3IgKyAxIG1vbnRoKVxuICAgICAgICBhbmNob3IgPSBhLmNsb25lKCkuYWRkKHdob2xlTW9udGhEaWZmLCAnbW9udGhzJyksXG4gICAgICAgIGFuY2hvcjIsIGFkanVzdDtcblxuICAgIGlmIChiIC0gYW5jaG9yIDwgMCkge1xuICAgICAgICBhbmNob3IyID0gYS5jbG9uZSgpLmFkZCh3aG9sZU1vbnRoRGlmZiAtIDEsICdtb250aHMnKTtcbiAgICAgICAgLy8gbGluZWFyIGFjcm9zcyB0aGUgbW9udGhcbiAgICAgICAgYWRqdXN0ID0gKGIgLSBhbmNob3IpIC8gKGFuY2hvciAtIGFuY2hvcjIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFuY2hvcjIgPSBhLmNsb25lKCkuYWRkKHdob2xlTW9udGhEaWZmICsgMSwgJ21vbnRocycpO1xuICAgICAgICAvLyBsaW5lYXIgYWNyb3NzIHRoZSBtb250aFxuICAgICAgICBhZGp1c3QgPSAoYiAtIGFuY2hvcikgLyAoYW5jaG9yMiAtIGFuY2hvcik7XG4gICAgfVxuXG4gICAgLy9jaGVjayBmb3IgbmVnYXRpdmUgemVybywgcmV0dXJuIHplcm8gaWYgbmVnYXRpdmUgemVyb1xuICAgIHJldHVybiAtKHdob2xlTW9udGhEaWZmICsgYWRqdXN0KSB8fCAwO1xufVxuXG5ob29rcy5kZWZhdWx0Rm9ybWF0ID0gJ1lZWVktTU0tRERUSEg6bW06c3NaJztcbmhvb2tzLmRlZmF1bHRGb3JtYXRVdGMgPSAnWVlZWS1NTS1ERFRISDptbTpzc1taXSc7XG5cbmZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gdGhpcy5jbG9uZSgpLmxvY2FsZSgnZW4nKS5mb3JtYXQoJ2RkZCBNTU0gREQgWVlZWSBISDptbTpzcyBbR01UXVpaJyk7XG59XG5cbmZ1bmN0aW9uIHRvSVNPU3RyaW5nKCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBtID0gdGhpcy5jbG9uZSgpLnV0YygpO1xuICAgIGlmIChtLnllYXIoKSA8IDAgfHwgbS55ZWFyKCkgPiA5OTk5KSB7XG4gICAgICAgIHJldHVybiBmb3JtYXRNb21lbnQobSwgJ1lZWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xuICAgIH1cbiAgICBpZiAoaXNGdW5jdGlvbihEYXRlLnByb3RvdHlwZS50b0lTT1N0cmluZykpIHtcbiAgICAgICAgLy8gbmF0aXZlIGltcGxlbWVudGF0aW9uIGlzIH41MHggZmFzdGVyLCB1c2UgaXQgd2hlbiB3ZSBjYW5cbiAgICAgICAgcmV0dXJuIHRoaXMudG9EYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xufVxuXG4vKipcbiAqIFJldHVybiBhIGh1bWFuIHJlYWRhYmxlIHJlcHJlc2VudGF0aW9uIG9mIGEgbW9tZW50IHRoYXQgY2FuXG4gKiBhbHNvIGJlIGV2YWx1YXRlZCB0byBnZXQgYSBuZXcgbW9tZW50IHdoaWNoIGlzIHRoZSBzYW1lXG4gKlxuICogQGxpbmsgaHR0cHM6Ly9ub2RlanMub3JnL2Rpc3QvbGF0ZXN0L2RvY3MvYXBpL3V0aWwuaHRtbCN1dGlsX2N1c3RvbV9pbnNwZWN0X2Z1bmN0aW9uX29uX29iamVjdHNcbiAqL1xuZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gJ21vbWVudC5pbnZhbGlkKC8qICcgKyB0aGlzLl9pICsgJyAqLyknO1xuICAgIH1cbiAgICB2YXIgZnVuYyA9ICdtb21lbnQnO1xuICAgIHZhciB6b25lID0gJyc7XG4gICAgaWYgKCF0aGlzLmlzTG9jYWwoKSkge1xuICAgICAgICBmdW5jID0gdGhpcy51dGNPZmZzZXQoKSA9PT0gMCA/ICdtb21lbnQudXRjJyA6ICdtb21lbnQucGFyc2Vab25lJztcbiAgICAgICAgem9uZSA9ICdaJztcbiAgICB9XG4gICAgdmFyIHByZWZpeCA9ICdbJyArIGZ1bmMgKyAnKFwiXSc7XG4gICAgdmFyIHllYXIgPSAoMCA8PSB0aGlzLnllYXIoKSAmJiB0aGlzLnllYXIoKSA8PSA5OTk5KSA/ICdZWVlZJyA6ICdZWVlZWVknO1xuICAgIHZhciBkYXRldGltZSA9ICctTU0tRERbVF1ISDptbTpzcy5TU1MnO1xuICAgIHZhciBzdWZmaXggPSB6b25lICsgJ1tcIildJztcblxuICAgIHJldHVybiB0aGlzLmZvcm1hdChwcmVmaXggKyB5ZWFyICsgZGF0ZXRpbWUgKyBzdWZmaXgpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXQgKGlucHV0U3RyaW5nKSB7XG4gICAgaWYgKCFpbnB1dFN0cmluZykge1xuICAgICAgICBpbnB1dFN0cmluZyA9IHRoaXMuaXNVdGMoKSA/IGhvb2tzLmRlZmF1bHRGb3JtYXRVdGMgOiBob29rcy5kZWZhdWx0Rm9ybWF0O1xuICAgIH1cbiAgICB2YXIgb3V0cHV0ID0gZm9ybWF0TW9tZW50KHRoaXMsIGlucHV0U3RyaW5nKTtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkucG9zdGZvcm1hdChvdXRwdXQpO1xufVxuXG5mdW5jdGlvbiBmcm9tICh0aW1lLCB3aXRob3V0U3VmZml4KSB7XG4gICAgaWYgKHRoaXMuaXNWYWxpZCgpICYmXG4gICAgICAgICAgICAoKGlzTW9tZW50KHRpbWUpICYmIHRpbWUuaXNWYWxpZCgpKSB8fFxuICAgICAgICAgICAgIGNyZWF0ZUxvY2FsKHRpbWUpLmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUR1cmF0aW9uKHt0bzogdGhpcywgZnJvbTogdGltZX0pLmxvY2FsZSh0aGlzLmxvY2FsZSgpKS5odW1hbml6ZSghd2l0aG91dFN1ZmZpeCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBmcm9tTm93ICh3aXRob3V0U3VmZml4KSB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbShjcmVhdGVMb2NhbCgpLCB3aXRob3V0U3VmZml4KTtcbn1cblxuZnVuY3Rpb24gdG8gKHRpbWUsIHdpdGhvdXRTdWZmaXgpIHtcbiAgICBpZiAodGhpcy5pc1ZhbGlkKCkgJiZcbiAgICAgICAgICAgICgoaXNNb21lbnQodGltZSkgJiYgdGltZS5pc1ZhbGlkKCkpIHx8XG4gICAgICAgICAgICAgY3JlYXRlTG9jYWwodGltZSkuaXNWYWxpZCgpKSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlRHVyYXRpb24oe2Zyb206IHRoaXMsIHRvOiB0aW1lfSkubG9jYWxlKHRoaXMubG9jYWxlKCkpLmh1bWFuaXplKCF3aXRob3V0U3VmZml4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkuaW52YWxpZERhdGUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRvTm93ICh3aXRob3V0U3VmZml4KSB7XG4gICAgcmV0dXJuIHRoaXMudG8oY3JlYXRlTG9jYWwoKSwgd2l0aG91dFN1ZmZpeCk7XG59XG5cbi8vIElmIHBhc3NlZCBhIGxvY2FsZSBrZXksIGl0IHdpbGwgc2V0IHRoZSBsb2NhbGUgZm9yIHRoaXNcbi8vIGluc3RhbmNlLiAgT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiB0aGUgbG9jYWxlIGNvbmZpZ3VyYXRpb25cbi8vIHZhcmlhYmxlcyBmb3IgdGhpcyBpbnN0YW5jZS5cbmZ1bmN0aW9uIGxvY2FsZSAoa2V5KSB7XG4gICAgdmFyIG5ld0xvY2FsZURhdGE7XG5cbiAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvY2FsZS5fYWJicjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBuZXdMb2NhbGVEYXRhID0gZ2V0TG9jYWxlKGtleSk7XG4gICAgICAgIGlmIChuZXdMb2NhbGVEYXRhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvY2FsZSA9IG5ld0xvY2FsZURhdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG52YXIgbGFuZyA9IGRlcHJlY2F0ZShcbiAgICAnbW9tZW50KCkubGFuZygpIGlzIGRlcHJlY2F0ZWQuIEluc3RlYWQsIHVzZSBtb21lbnQoKS5sb2NhbGVEYXRhKCkgdG8gZ2V0IHRoZSBsYW5ndWFnZSBjb25maWd1cmF0aW9uLiBVc2UgbW9tZW50KCkubG9jYWxlKCkgdG8gY2hhbmdlIGxhbmd1YWdlcy4nLFxuICAgIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGUoa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbik7XG5cbmZ1bmN0aW9uIGxvY2FsZURhdGEgKCkge1xuICAgIHJldHVybiB0aGlzLl9sb2NhbGU7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0T2YgKHVuaXRzKSB7XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgLy8gdGhlIGZvbGxvd2luZyBzd2l0Y2ggaW50ZW50aW9uYWxseSBvbWl0cyBicmVhayBrZXl3b3Jkc1xuICAgIC8vIHRvIHV0aWxpemUgZmFsbGluZyB0aHJvdWdoIHRoZSBjYXNlcy5cbiAgICBzd2l0Y2ggKHVuaXRzKSB7XG4gICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICAgICAgdGhpcy5tb250aCgwKTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAncXVhcnRlcic6XG4gICAgICAgIGNhc2UgJ21vbnRoJzpcbiAgICAgICAgICAgIHRoaXMuZGF0ZSgxKTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnd2Vlayc6XG4gICAgICAgIGNhc2UgJ2lzb1dlZWsnOlxuICAgICAgICBjYXNlICdkYXknOlxuICAgICAgICBjYXNlICdkYXRlJzpcbiAgICAgICAgICAgIHRoaXMuaG91cnMoMCk7XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ2hvdXInOlxuICAgICAgICAgICAgdGhpcy5taW51dGVzKDApO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdtaW51dGUnOlxuICAgICAgICAgICAgdGhpcy5zZWNvbmRzKDApO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdzZWNvbmQnOlxuICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHMoMCk7XG4gICAgfVxuXG4gICAgLy8gd2Vla3MgYXJlIGEgc3BlY2lhbCBjYXNlXG4gICAgaWYgKHVuaXRzID09PSAnd2VlaycpIHtcbiAgICAgICAgdGhpcy53ZWVrZGF5KDApO1xuICAgIH1cbiAgICBpZiAodW5pdHMgPT09ICdpc29XZWVrJykge1xuICAgICAgICB0aGlzLmlzb1dlZWtkYXkoMSk7XG4gICAgfVxuXG4gICAgLy8gcXVhcnRlcnMgYXJlIGFsc28gc3BlY2lhbFxuICAgIGlmICh1bml0cyA9PT0gJ3F1YXJ0ZXInKSB7XG4gICAgICAgIHRoaXMubW9udGgoTWF0aC5mbG9vcih0aGlzLm1vbnRoKCkgLyAzKSAqIDMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBlbmRPZiAodW5pdHMpIHtcbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICBpZiAodW5pdHMgPT09IHVuZGVmaW5lZCB8fCB1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvLyAnZGF0ZScgaXMgYW4gYWxpYXMgZm9yICdkYXknLCBzbyBpdCBzaG91bGQgYmUgY29uc2lkZXJlZCBhcyBzdWNoLlxuICAgIGlmICh1bml0cyA9PT0gJ2RhdGUnKSB7XG4gICAgICAgIHVuaXRzID0gJ2RheSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc3RhcnRPZih1bml0cykuYWRkKDEsICh1bml0cyA9PT0gJ2lzb1dlZWsnID8gJ3dlZWsnIDogdW5pdHMpKS5zdWJ0cmFjdCgxLCAnbXMnKTtcbn1cblxuZnVuY3Rpb24gdmFsdWVPZiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2QudmFsdWVPZigpIC0gKCh0aGlzLl9vZmZzZXQgfHwgMCkgKiA2MDAwMCk7XG59XG5cbmZ1bmN0aW9uIHVuaXggKCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKHRoaXMudmFsdWVPZigpIC8gMTAwMCk7XG59XG5cbmZ1bmN0aW9uIHRvRGF0ZSAoKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKHRoaXMudmFsdWVPZigpKTtcbn1cblxuZnVuY3Rpb24gdG9BcnJheSAoKSB7XG4gICAgdmFyIG0gPSB0aGlzO1xuICAgIHJldHVybiBbbS55ZWFyKCksIG0ubW9udGgoKSwgbS5kYXRlKCksIG0uaG91cigpLCBtLm1pbnV0ZSgpLCBtLnNlY29uZCgpLCBtLm1pbGxpc2Vjb25kKCldO1xufVxuXG5mdW5jdGlvbiB0b09iamVjdCAoKSB7XG4gICAgdmFyIG0gPSB0aGlzO1xuICAgIHJldHVybiB7XG4gICAgICAgIHllYXJzOiBtLnllYXIoKSxcbiAgICAgICAgbW9udGhzOiBtLm1vbnRoKCksXG4gICAgICAgIGRhdGU6IG0uZGF0ZSgpLFxuICAgICAgICBob3VyczogbS5ob3VycygpLFxuICAgICAgICBtaW51dGVzOiBtLm1pbnV0ZXMoKSxcbiAgICAgICAgc2Vjb25kczogbS5zZWNvbmRzKCksXG4gICAgICAgIG1pbGxpc2Vjb25kczogbS5taWxsaXNlY29uZHMoKVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gICAgLy8gbmV3IERhdGUoTmFOKS50b0pTT04oKSA9PT0gbnVsbFxuICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSA/IHRoaXMudG9JU09TdHJpbmcoKSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWQkMiAoKSB7XG4gICAgcmV0dXJuIGlzVmFsaWQodGhpcyk7XG59XG5cbmZ1bmN0aW9uIHBhcnNpbmdGbGFncyAoKSB7XG4gICAgcmV0dXJuIGV4dGVuZCh7fSwgZ2V0UGFyc2luZ0ZsYWdzKHRoaXMpKTtcbn1cblxuZnVuY3Rpb24gaW52YWxpZEF0ICgpIHtcbiAgICByZXR1cm4gZ2V0UGFyc2luZ0ZsYWdzKHRoaXMpLm92ZXJmbG93O1xufVxuXG5mdW5jdGlvbiBjcmVhdGlvbkRhdGEoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5wdXQ6IHRoaXMuX2ksXG4gICAgICAgIGZvcm1hdDogdGhpcy5fZixcbiAgICAgICAgbG9jYWxlOiB0aGlzLl9sb2NhbGUsXG4gICAgICAgIGlzVVRDOiB0aGlzLl9pc1VUQyxcbiAgICAgICAgc3RyaWN0OiB0aGlzLl9zdHJpY3RcbiAgICB9O1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKDAsIFsnZ2cnLCAyXSwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLndlZWtZZWFyKCkgJSAxMDA7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oMCwgWydHRycsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNvV2Vla1llYXIoKSAlIDEwMDtcbn0pO1xuXG5mdW5jdGlvbiBhZGRXZWVrWWVhckZvcm1hdFRva2VuICh0b2tlbiwgZ2V0dGVyKSB7XG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgW3Rva2VuLCB0b2tlbi5sZW5ndGhdLCAwLCBnZXR0ZXIpO1xufVxuXG5hZGRXZWVrWWVhckZvcm1hdFRva2VuKCdnZ2dnJywgICAgICd3ZWVrWWVhcicpO1xuYWRkV2Vla1llYXJGb3JtYXRUb2tlbignZ2dnZ2cnLCAgICAnd2Vla1llYXInKTtcbmFkZFdlZWtZZWFyRm9ybWF0VG9rZW4oJ0dHR0cnLCAgJ2lzb1dlZWtZZWFyJyk7XG5hZGRXZWVrWWVhckZvcm1hdFRva2VuKCdHR0dHRycsICdpc29XZWVrWWVhcicpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnd2Vla1llYXInLCAnZ2cnKTtcbmFkZFVuaXRBbGlhcygnaXNvV2Vla1llYXInLCAnR0cnKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCd3ZWVrWWVhcicsIDEpO1xuYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrWWVhcicsIDEpO1xuXG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignRycsICAgICAgbWF0Y2hTaWduZWQpO1xuYWRkUmVnZXhUb2tlbignZycsICAgICAgbWF0Y2hTaWduZWQpO1xuYWRkUmVnZXhUb2tlbignR0cnLCAgICAgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignZ2cnLCAgICAgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignR0dHRycsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuYWRkUmVnZXhUb2tlbignZ2dnZycsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuYWRkUmVnZXhUb2tlbignR0dHR0cnLCAgbWF0Y2gxdG82LCBtYXRjaDYpO1xuYWRkUmVnZXhUb2tlbignZ2dnZ2cnLCAgbWF0Y2gxdG82LCBtYXRjaDYpO1xuXG5hZGRXZWVrUGFyc2VUb2tlbihbJ2dnZ2cnLCAnZ2dnZ2cnLCAnR0dHRycsICdHR0dHRyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB3ZWVrW3Rva2VuLnN1YnN0cigwLCAyKV0gPSB0b0ludChpbnB1dCk7XG59KTtcblxuYWRkV2Vla1BhcnNlVG9rZW4oWydnZycsICdHRyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB3ZWVrW3Rva2VuXSA9IGhvb2tzLnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KTtcbn0pO1xuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFNldFdlZWtZZWFyIChpbnB1dCkge1xuICAgIHJldHVybiBnZXRTZXRXZWVrWWVhckhlbHBlci5jYWxsKHRoaXMsXG4gICAgICAgICAgICBpbnB1dCxcbiAgICAgICAgICAgIHRoaXMud2VlaygpLFxuICAgICAgICAgICAgdGhpcy53ZWVrZGF5KCksXG4gICAgICAgICAgICB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3csXG4gICAgICAgICAgICB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3kpO1xufVxuXG5mdW5jdGlvbiBnZXRTZXRJU09XZWVrWWVhciAoaW5wdXQpIHtcbiAgICByZXR1cm4gZ2V0U2V0V2Vla1llYXJIZWxwZXIuY2FsbCh0aGlzLFxuICAgICAgICAgICAgaW5wdXQsIHRoaXMuaXNvV2VlaygpLCB0aGlzLmlzb1dlZWtkYXkoKSwgMSwgNCk7XG59XG5cbmZ1bmN0aW9uIGdldElTT1dlZWtzSW5ZZWFyICgpIHtcbiAgICByZXR1cm4gd2Vla3NJblllYXIodGhpcy55ZWFyKCksIDEsIDQpO1xufVxuXG5mdW5jdGlvbiBnZXRXZWVrc0luWWVhciAoKSB7XG4gICAgdmFyIHdlZWtJbmZvID0gdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWs7XG4gICAgcmV0dXJuIHdlZWtzSW5ZZWFyKHRoaXMueWVhcigpLCB3ZWVrSW5mby5kb3csIHdlZWtJbmZvLmRveSk7XG59XG5cbmZ1bmN0aW9uIGdldFNldFdlZWtZZWFySGVscGVyKGlucHV0LCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgIHZhciB3ZWVrc1RhcmdldDtcbiAgICBpZiAoaW5wdXQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gd2Vla09mWWVhcih0aGlzLCBkb3csIGRveSkueWVhcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3ZWVrc1RhcmdldCA9IHdlZWtzSW5ZZWFyKGlucHV0LCBkb3csIGRveSk7XG4gICAgICAgIGlmICh3ZWVrID4gd2Vla3NUYXJnZXQpIHtcbiAgICAgICAgICAgIHdlZWsgPSB3ZWVrc1RhcmdldDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2V0V2Vla0FsbC5jYWxsKHRoaXMsIGlucHV0LCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRXZWVrQWxsKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgIHZhciBkYXlPZlllYXJEYXRhID0gZGF5T2ZZZWFyRnJvbVdlZWtzKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSksXG4gICAgICAgIGRhdGUgPSBjcmVhdGVVVENEYXRlKGRheU9mWWVhckRhdGEueWVhciwgMCwgZGF5T2ZZZWFyRGF0YS5kYXlPZlllYXIpO1xuXG4gICAgdGhpcy55ZWFyKGRhdGUuZ2V0VVRDRnVsbFllYXIoKSk7XG4gICAgdGhpcy5tb250aChkYXRlLmdldFVUQ01vbnRoKCkpO1xuICAgIHRoaXMuZGF0ZShkYXRlLmdldFVUQ0RhdGUoKSk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ1EnLCAwLCAnUW8nLCAncXVhcnRlcicpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygncXVhcnRlcicsICdRJyk7XG5cbi8vIFBSSU9SSVRZXG5cbmFkZFVuaXRQcmlvcml0eSgncXVhcnRlcicsIDcpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ1EnLCBtYXRjaDEpO1xuYWRkUGFyc2VUb2tlbignUScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtNT05USF0gPSAodG9JbnQoaW5wdXQpIC0gMSkgKiAzO1xufSk7XG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gZ2V0U2V0UXVhcnRlciAoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IE1hdGguY2VpbCgodGhpcy5tb250aCgpICsgMSkgLyAzKSA6IHRoaXMubW9udGgoKGlucHV0IC0gMSkgKiAzICsgdGhpcy5tb250aCgpICUgMyk7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ0QnLCBbJ0REJywgMl0sICdEbycsICdkYXRlJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdkYXRlJywgJ0QnKTtcblxuLy8gUFJJT1JPSVRZXG5hZGRVbml0UHJpb3JpdHkoJ2RhdGUnLCA5KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdEJywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdERCcsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ0RvJywgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICAvLyBUT0RPOiBSZW1vdmUgXCJvcmRpbmFsUGFyc2VcIiBmYWxsYmFjayBpbiBuZXh0IG1ham9yIHJlbGVhc2UuXG4gICAgcmV0dXJuIGlzU3RyaWN0ID9cbiAgICAgIChsb2NhbGUuX2RheU9mTW9udGhPcmRpbmFsUGFyc2UgfHwgbG9jYWxlLl9vcmRpbmFsUGFyc2UpIDpcbiAgICAgIGxvY2FsZS5fZGF5T2ZNb250aE9yZGluYWxQYXJzZUxlbmllbnQ7XG59KTtcblxuYWRkUGFyc2VUb2tlbihbJ0QnLCAnREQnXSwgREFURSk7XG5hZGRQYXJzZVRva2VuKCdEbycsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtEQVRFXSA9IHRvSW50KGlucHV0Lm1hdGNoKG1hdGNoMXRvMilbMF0sIDEwKTtcbn0pO1xuXG4vLyBNT01FTlRTXG5cbnZhciBnZXRTZXREYXlPZk1vbnRoID0gbWFrZUdldFNldCgnRGF0ZScsIHRydWUpO1xuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdEREQnLCBbJ0REREQnLCAzXSwgJ0RERG8nLCAnZGF5T2ZZZWFyJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdkYXlPZlllYXInLCAnREREJyk7XG5cbi8vIFBSSU9SSVRZXG5hZGRVbml0UHJpb3JpdHkoJ2RheU9mWWVhcicsIDQpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ0RERCcsICBtYXRjaDF0bzMpO1xuYWRkUmVnZXhUb2tlbignRERERCcsIG1hdGNoMyk7XG5hZGRQYXJzZVRva2VuKFsnREREJywgJ0REREQnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl9kYXlPZlllYXIgPSB0b0ludChpbnB1dCk7XG59KTtcblxuLy8gSEVMUEVSU1xuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFNldERheU9mWWVhciAoaW5wdXQpIHtcbiAgICB2YXIgZGF5T2ZZZWFyID0gTWF0aC5yb3VuZCgodGhpcy5jbG9uZSgpLnN0YXJ0T2YoJ2RheScpIC0gdGhpcy5jbG9uZSgpLnN0YXJ0T2YoJ3llYXInKSkgLyA4NjRlNSkgKyAxO1xuICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gZGF5T2ZZZWFyIDogdGhpcy5hZGQoKGlucHV0IC0gZGF5T2ZZZWFyKSwgJ2QnKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignbScsIFsnbW0nLCAyXSwgMCwgJ21pbnV0ZScpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnbWludXRlJywgJ20nKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCdtaW51dGUnLCAxNCk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignbScsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignbW0nLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRQYXJzZVRva2VuKFsnbScsICdtbSddLCBNSU5VVEUpO1xuXG4vLyBNT01FTlRTXG5cbnZhciBnZXRTZXRNaW51dGUgPSBtYWtlR2V0U2V0KCdNaW51dGVzJywgZmFsc2UpO1xuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdzJywgWydzcycsIDJdLCAwLCAnc2Vjb25kJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdzZWNvbmQnLCAncycpO1xuXG4vLyBQUklPUklUWVxuXG5hZGRVbml0UHJpb3JpdHkoJ3NlY29uZCcsIDE1KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdzJywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdzcycsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFBhcnNlVG9rZW4oWydzJywgJ3NzJ10sIFNFQ09ORCk7XG5cbi8vIE1PTUVOVFNcblxudmFyIGdldFNldFNlY29uZCA9IG1ha2VHZXRTZXQoJ1NlY29uZHMnLCBmYWxzZSk7XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ1MnLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIH5+KHRoaXMubWlsbGlzZWNvbmQoKSAvIDEwMCk7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oMCwgWydTUycsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIH5+KHRoaXMubWlsbGlzZWNvbmQoKSAvIDEwKTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTUycsIDNdLCAwLCAnbWlsbGlzZWNvbmQnKTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTUycsIDRdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTJywgNV0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTUycsIDZdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDA7XG59KTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1NTUycsIDddLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDAwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTU1NTJywgOF0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDAwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTU1NTUycsIDldLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDAwMDA7XG59KTtcblxuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnbWlsbGlzZWNvbmQnLCAnbXMnKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCdtaWxsaXNlY29uZCcsIDE2KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdTJywgICAgbWF0Y2gxdG8zLCBtYXRjaDEpO1xuYWRkUmVnZXhUb2tlbignU1MnLCAgIG1hdGNoMXRvMywgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ1NTUycsICBtYXRjaDF0bzMsIG1hdGNoMyk7XG5cbnZhciB0b2tlbjtcbmZvciAodG9rZW4gPSAnU1NTUyc7IHRva2VuLmxlbmd0aCA8PSA5OyB0b2tlbiArPSAnUycpIHtcbiAgICBhZGRSZWdleFRva2VuKHRva2VuLCBtYXRjaFVuc2lnbmVkKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VNcyhpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtNSUxMSVNFQ09ORF0gPSB0b0ludCgoJzAuJyArIGlucHV0KSAqIDEwMDApO1xufVxuXG5mb3IgKHRva2VuID0gJ1MnOyB0b2tlbi5sZW5ndGggPD0gOTsgdG9rZW4gKz0gJ1MnKSB7XG4gICAgYWRkUGFyc2VUb2tlbih0b2tlbiwgcGFyc2VNcyk7XG59XG4vLyBNT01FTlRTXG5cbnZhciBnZXRTZXRNaWxsaXNlY29uZCA9IG1ha2VHZXRTZXQoJ01pbGxpc2Vjb25kcycsIGZhbHNlKTtcblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbigneicsICAwLCAwLCAnem9uZUFiYnInKTtcbmFkZEZvcm1hdFRva2VuKCd6eicsIDAsIDAsICd6b25lTmFtZScpO1xuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFpvbmVBYmJyICgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNVVEMgPyAnVVRDJyA6ICcnO1xufVxuXG5mdW5jdGlvbiBnZXRab25lTmFtZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gJ0Nvb3JkaW5hdGVkIFVuaXZlcnNhbCBUaW1lJyA6ICcnO1xufVxuXG52YXIgcHJvdG8gPSBNb21lbnQucHJvdG90eXBlO1xuXG5wcm90by5hZGQgICAgICAgICAgICAgICA9IGFkZDtcbnByb3RvLmNhbGVuZGFyICAgICAgICAgID0gY2FsZW5kYXIkMTtcbnByb3RvLmNsb25lICAgICAgICAgICAgID0gY2xvbmU7XG5wcm90by5kaWZmICAgICAgICAgICAgICA9IGRpZmY7XG5wcm90by5lbmRPZiAgICAgICAgICAgICA9IGVuZE9mO1xucHJvdG8uZm9ybWF0ICAgICAgICAgICAgPSBmb3JtYXQ7XG5wcm90by5mcm9tICAgICAgICAgICAgICA9IGZyb207XG5wcm90by5mcm9tTm93ICAgICAgICAgICA9IGZyb21Ob3c7XG5wcm90by50byAgICAgICAgICAgICAgICA9IHRvO1xucHJvdG8udG9Ob3cgICAgICAgICAgICAgPSB0b05vdztcbnByb3RvLmdldCAgICAgICAgICAgICAgID0gc3RyaW5nR2V0O1xucHJvdG8uaW52YWxpZEF0ICAgICAgICAgPSBpbnZhbGlkQXQ7XG5wcm90by5pc0FmdGVyICAgICAgICAgICA9IGlzQWZ0ZXI7XG5wcm90by5pc0JlZm9yZSAgICAgICAgICA9IGlzQmVmb3JlO1xucHJvdG8uaXNCZXR3ZWVuICAgICAgICAgPSBpc0JldHdlZW47XG5wcm90by5pc1NhbWUgICAgICAgICAgICA9IGlzU2FtZTtcbnByb3RvLmlzU2FtZU9yQWZ0ZXIgICAgID0gaXNTYW1lT3JBZnRlcjtcbnByb3RvLmlzU2FtZU9yQmVmb3JlICAgID0gaXNTYW1lT3JCZWZvcmU7XG5wcm90by5pc1ZhbGlkICAgICAgICAgICA9IGlzVmFsaWQkMjtcbnByb3RvLmxhbmcgICAgICAgICAgICAgID0gbGFuZztcbnByb3RvLmxvY2FsZSAgICAgICAgICAgID0gbG9jYWxlO1xucHJvdG8ubG9jYWxlRGF0YSAgICAgICAgPSBsb2NhbGVEYXRhO1xucHJvdG8ubWF4ICAgICAgICAgICAgICAgPSBwcm90b3R5cGVNYXg7XG5wcm90by5taW4gICAgICAgICAgICAgICA9IHByb3RvdHlwZU1pbjtcbnByb3RvLnBhcnNpbmdGbGFncyAgICAgID0gcGFyc2luZ0ZsYWdzO1xucHJvdG8uc2V0ICAgICAgICAgICAgICAgPSBzdHJpbmdTZXQ7XG5wcm90by5zdGFydE9mICAgICAgICAgICA9IHN0YXJ0T2Y7XG5wcm90by5zdWJ0cmFjdCAgICAgICAgICA9IHN1YnRyYWN0O1xucHJvdG8udG9BcnJheSAgICAgICAgICAgPSB0b0FycmF5O1xucHJvdG8udG9PYmplY3QgICAgICAgICAgPSB0b09iamVjdDtcbnByb3RvLnRvRGF0ZSAgICAgICAgICAgID0gdG9EYXRlO1xucHJvdG8udG9JU09TdHJpbmcgICAgICAgPSB0b0lTT1N0cmluZztcbnByb3RvLmluc3BlY3QgICAgICAgICAgID0gaW5zcGVjdDtcbnByb3RvLnRvSlNPTiAgICAgICAgICAgID0gdG9KU09OO1xucHJvdG8udG9TdHJpbmcgICAgICAgICAgPSB0b1N0cmluZztcbnByb3RvLnVuaXggICAgICAgICAgICAgID0gdW5peDtcbnByb3RvLnZhbHVlT2YgICAgICAgICAgID0gdmFsdWVPZjtcbnByb3RvLmNyZWF0aW9uRGF0YSAgICAgID0gY3JlYXRpb25EYXRhO1xuXG4vLyBZZWFyXG5wcm90by55ZWFyICAgICAgID0gZ2V0U2V0WWVhcjtcbnByb3RvLmlzTGVhcFllYXIgPSBnZXRJc0xlYXBZZWFyO1xuXG4vLyBXZWVrIFllYXJcbnByb3RvLndlZWtZZWFyICAgID0gZ2V0U2V0V2Vla1llYXI7XG5wcm90by5pc29XZWVrWWVhciA9IGdldFNldElTT1dlZWtZZWFyO1xuXG4vLyBRdWFydGVyXG5wcm90by5xdWFydGVyID0gcHJvdG8ucXVhcnRlcnMgPSBnZXRTZXRRdWFydGVyO1xuXG4vLyBNb250aFxucHJvdG8ubW9udGggICAgICAgPSBnZXRTZXRNb250aDtcbnByb3RvLmRheXNJbk1vbnRoID0gZ2V0RGF5c0luTW9udGg7XG5cbi8vIFdlZWtcbnByb3RvLndlZWsgICAgICAgICAgID0gcHJvdG8ud2Vla3MgICAgICAgID0gZ2V0U2V0V2VlaztcbnByb3RvLmlzb1dlZWsgICAgICAgID0gcHJvdG8uaXNvV2Vla3MgICAgID0gZ2V0U2V0SVNPV2VlaztcbnByb3RvLndlZWtzSW5ZZWFyICAgID0gZ2V0V2Vla3NJblllYXI7XG5wcm90by5pc29XZWVrc0luWWVhciA9IGdldElTT1dlZWtzSW5ZZWFyO1xuXG4vLyBEYXlcbnByb3RvLmRhdGUgICAgICAgPSBnZXRTZXREYXlPZk1vbnRoO1xucHJvdG8uZGF5ICAgICAgICA9IHByb3RvLmRheXMgICAgICAgICAgICAgPSBnZXRTZXREYXlPZldlZWs7XG5wcm90by53ZWVrZGF5ICAgID0gZ2V0U2V0TG9jYWxlRGF5T2ZXZWVrO1xucHJvdG8uaXNvV2Vla2RheSA9IGdldFNldElTT0RheU9mV2VlaztcbnByb3RvLmRheU9mWWVhciAgPSBnZXRTZXREYXlPZlllYXI7XG5cbi8vIEhvdXJcbnByb3RvLmhvdXIgPSBwcm90by5ob3VycyA9IGdldFNldEhvdXI7XG5cbi8vIE1pbnV0ZVxucHJvdG8ubWludXRlID0gcHJvdG8ubWludXRlcyA9IGdldFNldE1pbnV0ZTtcblxuLy8gU2Vjb25kXG5wcm90by5zZWNvbmQgPSBwcm90by5zZWNvbmRzID0gZ2V0U2V0U2Vjb25kO1xuXG4vLyBNaWxsaXNlY29uZFxucHJvdG8ubWlsbGlzZWNvbmQgPSBwcm90by5taWxsaXNlY29uZHMgPSBnZXRTZXRNaWxsaXNlY29uZDtcblxuLy8gT2Zmc2V0XG5wcm90by51dGNPZmZzZXQgICAgICAgICAgICA9IGdldFNldE9mZnNldDtcbnByb3RvLnV0YyAgICAgICAgICAgICAgICAgID0gc2V0T2Zmc2V0VG9VVEM7XG5wcm90by5sb2NhbCAgICAgICAgICAgICAgICA9IHNldE9mZnNldFRvTG9jYWw7XG5wcm90by5wYXJzZVpvbmUgICAgICAgICAgICA9IHNldE9mZnNldFRvUGFyc2VkT2Zmc2V0O1xucHJvdG8uaGFzQWxpZ25lZEhvdXJPZmZzZXQgPSBoYXNBbGlnbmVkSG91ck9mZnNldDtcbnByb3RvLmlzRFNUICAgICAgICAgICAgICAgID0gaXNEYXlsaWdodFNhdmluZ1RpbWU7XG5wcm90by5pc0xvY2FsICAgICAgICAgICAgICA9IGlzTG9jYWw7XG5wcm90by5pc1V0Y09mZnNldCAgICAgICAgICA9IGlzVXRjT2Zmc2V0O1xucHJvdG8uaXNVdGMgICAgICAgICAgICAgICAgPSBpc1V0YztcbnByb3RvLmlzVVRDICAgICAgICAgICAgICAgID0gaXNVdGM7XG5cbi8vIFRpbWV6b25lXG5wcm90by56b25lQWJiciA9IGdldFpvbmVBYmJyO1xucHJvdG8uem9uZU5hbWUgPSBnZXRab25lTmFtZTtcblxuLy8gRGVwcmVjYXRpb25zXG5wcm90by5kYXRlcyAgPSBkZXByZWNhdGUoJ2RhdGVzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSBkYXRlIGluc3RlYWQuJywgZ2V0U2V0RGF5T2ZNb250aCk7XG5wcm90by5tb250aHMgPSBkZXByZWNhdGUoJ21vbnRocyBhY2Nlc3NvciBpcyBkZXByZWNhdGVkLiBVc2UgbW9udGggaW5zdGVhZCcsIGdldFNldE1vbnRoKTtcbnByb3RvLnllYXJzICA9IGRlcHJlY2F0ZSgneWVhcnMgYWNjZXNzb3IgaXMgZGVwcmVjYXRlZC4gVXNlIHllYXIgaW5zdGVhZCcsIGdldFNldFllYXIpO1xucHJvdG8uem9uZSAgID0gZGVwcmVjYXRlKCdtb21lbnQoKS56b25lIGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQoKS51dGNPZmZzZXQgaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy96b25lLycsIGdldFNldFpvbmUpO1xucHJvdG8uaXNEU1RTaGlmdGVkID0gZGVwcmVjYXRlKCdpc0RTVFNoaWZ0ZWQgaXMgZGVwcmVjYXRlZC4gU2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvZHN0LXNoaWZ0ZWQvIGZvciBtb3JlIGluZm9ybWF0aW9uJywgaXNEYXlsaWdodFNhdmluZ1RpbWVTaGlmdGVkKTtcblxuZnVuY3Rpb24gY3JlYXRlVW5peCAoaW5wdXQpIHtcbiAgICByZXR1cm4gY3JlYXRlTG9jYWwoaW5wdXQgKiAxMDAwKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSW5ab25lICgpIHtcbiAgICByZXR1cm4gY3JlYXRlTG9jYWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKS5wYXJzZVpvbmUoKTtcbn1cblxuZnVuY3Rpb24gcHJlUGFyc2VQb3N0Rm9ybWF0IChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nO1xufVxuXG52YXIgcHJvdG8kMSA9IExvY2FsZS5wcm90b3R5cGU7XG5cbnByb3RvJDEuY2FsZW5kYXIgICAgICAgID0gY2FsZW5kYXI7XG5wcm90byQxLmxvbmdEYXRlRm9ybWF0ICA9IGxvbmdEYXRlRm9ybWF0O1xucHJvdG8kMS5pbnZhbGlkRGF0ZSAgICAgPSBpbnZhbGlkRGF0ZTtcbnByb3RvJDEub3JkaW5hbCAgICAgICAgID0gb3JkaW5hbDtcbnByb3RvJDEucHJlcGFyc2UgICAgICAgID0gcHJlUGFyc2VQb3N0Rm9ybWF0O1xucHJvdG8kMS5wb3N0Zm9ybWF0ICAgICAgPSBwcmVQYXJzZVBvc3RGb3JtYXQ7XG5wcm90byQxLnJlbGF0aXZlVGltZSAgICA9IHJlbGF0aXZlVGltZTtcbnByb3RvJDEucGFzdEZ1dHVyZSAgICAgID0gcGFzdEZ1dHVyZTtcbnByb3RvJDEuc2V0ICAgICAgICAgICAgID0gc2V0O1xuXG4vLyBNb250aFxucHJvdG8kMS5tb250aHMgICAgICAgICAgICA9ICAgICAgICBsb2NhbGVNb250aHM7XG5wcm90byQxLm1vbnRoc1Nob3J0ICAgICAgID0gICAgICAgIGxvY2FsZU1vbnRoc1Nob3J0O1xucHJvdG8kMS5tb250aHNQYXJzZSAgICAgICA9ICAgICAgICBsb2NhbGVNb250aHNQYXJzZTtcbnByb3RvJDEubW9udGhzUmVnZXggICAgICAgPSBtb250aHNSZWdleDtcbnByb3RvJDEubW9udGhzU2hvcnRSZWdleCAgPSBtb250aHNTaG9ydFJlZ2V4O1xuXG4vLyBXZWVrXG5wcm90byQxLndlZWsgPSBsb2NhbGVXZWVrO1xucHJvdG8kMS5maXJzdERheU9mWWVhciA9IGxvY2FsZUZpcnN0RGF5T2ZZZWFyO1xucHJvdG8kMS5maXJzdERheU9mV2VlayA9IGxvY2FsZUZpcnN0RGF5T2ZXZWVrO1xuXG4vLyBEYXkgb2YgV2Vla1xucHJvdG8kMS53ZWVrZGF5cyAgICAgICA9ICAgICAgICBsb2NhbGVXZWVrZGF5cztcbnByb3RvJDEud2Vla2RheXNNaW4gICAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNNaW47XG5wcm90byQxLndlZWtkYXlzU2hvcnQgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzU2hvcnQ7XG5wcm90byQxLndlZWtkYXlzUGFyc2UgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzUGFyc2U7XG5cbnByb3RvJDEud2Vla2RheXNSZWdleCAgICAgICA9ICAgICAgICB3ZWVrZGF5c1JlZ2V4O1xucHJvdG8kMS53ZWVrZGF5c1Nob3J0UmVnZXggID0gICAgICAgIHdlZWtkYXlzU2hvcnRSZWdleDtcbnByb3RvJDEud2Vla2RheXNNaW5SZWdleCAgICA9ICAgICAgICB3ZWVrZGF5c01pblJlZ2V4O1xuXG4vLyBIb3Vyc1xucHJvdG8kMS5pc1BNID0gbG9jYWxlSXNQTTtcbnByb3RvJDEubWVyaWRpZW0gPSBsb2NhbGVNZXJpZGllbTtcblxuZnVuY3Rpb24gZ2V0JDEgKGZvcm1hdCwgaW5kZXgsIGZpZWxkLCBzZXR0ZXIpIHtcbiAgICB2YXIgbG9jYWxlID0gZ2V0TG9jYWxlKCk7XG4gICAgdmFyIHV0YyA9IGNyZWF0ZVVUQygpLnNldChzZXR0ZXIsIGluZGV4KTtcbiAgICByZXR1cm4gbG9jYWxlW2ZpZWxkXSh1dGMsIGZvcm1hdCk7XG59XG5cbmZ1bmN0aW9uIGxpc3RNb250aHNJbXBsIChmb3JtYXQsIGluZGV4LCBmaWVsZCkge1xuICAgIGlmIChpc051bWJlcihmb3JtYXQpKSB7XG4gICAgICAgIGluZGV4ID0gZm9ybWF0O1xuICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZm9ybWF0ID0gZm9ybWF0IHx8ICcnO1xuXG4gICAgaWYgKGluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGdldCQxKGZvcm1hdCwgaW5kZXgsIGZpZWxkLCAnbW9udGgnKTtcbiAgICB9XG5cbiAgICB2YXIgaTtcbiAgICB2YXIgb3V0ID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgb3V0W2ldID0gZ2V0JDEoZm9ybWF0LCBpLCBmaWVsZCwgJ21vbnRoJyk7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59XG5cbi8vICgpXG4vLyAoNSlcbi8vIChmbXQsIDUpXG4vLyAoZm10KVxuLy8gKHRydWUpXG4vLyAodHJ1ZSwgNSlcbi8vICh0cnVlLCBmbXQsIDUpXG4vLyAodHJ1ZSwgZm10KVxuZnVuY3Rpb24gbGlzdFdlZWtkYXlzSW1wbCAobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4LCBmaWVsZCkge1xuICAgIGlmICh0eXBlb2YgbG9jYWxlU29ydGVkID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgaWYgKGlzTnVtYmVyKGZvcm1hdCkpIHtcbiAgICAgICAgICAgIGluZGV4ID0gZm9ybWF0O1xuICAgICAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8ICcnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvcm1hdCA9IGxvY2FsZVNvcnRlZDtcbiAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgIGxvY2FsZVNvcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChpc051bWJlcihmb3JtYXQpKSB7XG4gICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgICAgIGZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcm1hdCA9IGZvcm1hdCB8fCAnJztcbiAgICB9XG5cbiAgICB2YXIgbG9jYWxlID0gZ2V0TG9jYWxlKCksXG4gICAgICAgIHNoaWZ0ID0gbG9jYWxlU29ydGVkID8gbG9jYWxlLl93ZWVrLmRvdyA6IDA7XG5cbiAgICBpZiAoaW5kZXggIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZ2V0JDEoZm9ybWF0LCAoaW5kZXggKyBzaGlmdCkgJSA3LCBmaWVsZCwgJ2RheScpO1xuICAgIH1cblxuICAgIHZhciBpO1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgIG91dFtpXSA9IGdldCQxKGZvcm1hdCwgKGkgKyBzaGlmdCkgJSA3LCBmaWVsZCwgJ2RheScpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBsaXN0TW9udGhzIChmb3JtYXQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGxpc3RNb250aHNJbXBsKGZvcm1hdCwgaW5kZXgsICdtb250aHMnKTtcbn1cblxuZnVuY3Rpb24gbGlzdE1vbnRoc1Nob3J0IChmb3JtYXQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGxpc3RNb250aHNJbXBsKGZvcm1hdCwgaW5kZXgsICdtb250aHNTaG9ydCcpO1xufVxuXG5mdW5jdGlvbiBsaXN0V2Vla2RheXMgKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCkge1xuICAgIHJldHVybiBsaXN0V2Vla2RheXNJbXBsKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCwgJ3dlZWtkYXlzJyk7XG59XG5cbmZ1bmN0aW9uIGxpc3RXZWVrZGF5c1Nob3J0IChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgpIHtcbiAgICByZXR1cm4gbGlzdFdlZWtkYXlzSW1wbChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgsICd3ZWVrZGF5c1Nob3J0Jyk7XG59XG5cbmZ1bmN0aW9uIGxpc3RXZWVrZGF5c01pbiAobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGxpc3RXZWVrZGF5c0ltcGwobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4LCAnd2Vla2RheXNNaW4nKTtcbn1cblxuZ2V0U2V0R2xvYmFsTG9jYWxlKCdlbicsIHtcbiAgICBkYXlPZk1vbnRoT3JkaW5hbFBhcnNlOiAvXFxkezEsMn0odGh8c3R8bmR8cmQpLyxcbiAgICBvcmRpbmFsIDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICB2YXIgYiA9IG51bWJlciAlIDEwLFxuICAgICAgICAgICAgb3V0cHV0ID0gKHRvSW50KG51bWJlciAlIDEwMCAvIDEwKSA9PT0gMSkgPyAndGgnIDpcbiAgICAgICAgICAgIChiID09PSAxKSA/ICdzdCcgOlxuICAgICAgICAgICAgKGIgPT09IDIpID8gJ25kJyA6XG4gICAgICAgICAgICAoYiA9PT0gMykgPyAncmQnIDogJ3RoJztcbiAgICAgICAgcmV0dXJuIG51bWJlciArIG91dHB1dDtcbiAgICB9XG59KTtcblxuLy8gU2lkZSBlZmZlY3QgaW1wb3J0c1xuaG9va3MubGFuZyA9IGRlcHJlY2F0ZSgnbW9tZW50LmxhbmcgaXMgZGVwcmVjYXRlZC4gVXNlIG1vbWVudC5sb2NhbGUgaW5zdGVhZC4nLCBnZXRTZXRHbG9iYWxMb2NhbGUpO1xuaG9va3MubGFuZ0RhdGEgPSBkZXByZWNhdGUoJ21vbWVudC5sYW5nRGF0YSBpcyBkZXByZWNhdGVkLiBVc2UgbW9tZW50LmxvY2FsZURhdGEgaW5zdGVhZC4nLCBnZXRMb2NhbGUpO1xuXG52YXIgbWF0aEFicyA9IE1hdGguYWJzO1xuXG5mdW5jdGlvbiBhYnMgKCkge1xuICAgIHZhciBkYXRhICAgICAgICAgICA9IHRoaXMuX2RhdGE7XG5cbiAgICB0aGlzLl9taWxsaXNlY29uZHMgPSBtYXRoQWJzKHRoaXMuX21pbGxpc2Vjb25kcyk7XG4gICAgdGhpcy5fZGF5cyAgICAgICAgID0gbWF0aEFicyh0aGlzLl9kYXlzKTtcbiAgICB0aGlzLl9tb250aHMgICAgICAgPSBtYXRoQWJzKHRoaXMuX21vbnRocyk7XG5cbiAgICBkYXRhLm1pbGxpc2Vjb25kcyAgPSBtYXRoQWJzKGRhdGEubWlsbGlzZWNvbmRzKTtcbiAgICBkYXRhLnNlY29uZHMgICAgICAgPSBtYXRoQWJzKGRhdGEuc2Vjb25kcyk7XG4gICAgZGF0YS5taW51dGVzICAgICAgID0gbWF0aEFicyhkYXRhLm1pbnV0ZXMpO1xuICAgIGRhdGEuaG91cnMgICAgICAgICA9IG1hdGhBYnMoZGF0YS5ob3Vycyk7XG4gICAgZGF0YS5tb250aHMgICAgICAgID0gbWF0aEFicyhkYXRhLm1vbnRocyk7XG4gICAgZGF0YS55ZWFycyAgICAgICAgID0gbWF0aEFicyhkYXRhLnllYXJzKTtcblxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBhZGRTdWJ0cmFjdCQxIChkdXJhdGlvbiwgaW5wdXQsIHZhbHVlLCBkaXJlY3Rpb24pIHtcbiAgICB2YXIgb3RoZXIgPSBjcmVhdGVEdXJhdGlvbihpbnB1dCwgdmFsdWUpO1xuXG4gICAgZHVyYXRpb24uX21pbGxpc2Vjb25kcyArPSBkaXJlY3Rpb24gKiBvdGhlci5fbWlsbGlzZWNvbmRzO1xuICAgIGR1cmF0aW9uLl9kYXlzICAgICAgICAgKz0gZGlyZWN0aW9uICogb3RoZXIuX2RheXM7XG4gICAgZHVyYXRpb24uX21vbnRocyAgICAgICArPSBkaXJlY3Rpb24gKiBvdGhlci5fbW9udGhzO1xuXG4gICAgcmV0dXJuIGR1cmF0aW9uLl9idWJibGUoKTtcbn1cblxuLy8gc3VwcG9ydHMgb25seSAyLjAtc3R5bGUgYWRkKDEsICdzJykgb3IgYWRkKGR1cmF0aW9uKVxuZnVuY3Rpb24gYWRkJDEgKGlucHV0LCB2YWx1ZSkge1xuICAgIHJldHVybiBhZGRTdWJ0cmFjdCQxKHRoaXMsIGlucHV0LCB2YWx1ZSwgMSk7XG59XG5cbi8vIHN1cHBvcnRzIG9ubHkgMi4wLXN0eWxlIHN1YnRyYWN0KDEsICdzJykgb3Igc3VidHJhY3QoZHVyYXRpb24pXG5mdW5jdGlvbiBzdWJ0cmFjdCQxIChpbnB1dCwgdmFsdWUpIHtcbiAgICByZXR1cm4gYWRkU3VidHJhY3QkMSh0aGlzLCBpbnB1dCwgdmFsdWUsIC0xKTtcbn1cblxuZnVuY3Rpb24gYWJzQ2VpbCAobnVtYmVyKSB7XG4gICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlcik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBidWJibGUgKCkge1xuICAgIHZhciBtaWxsaXNlY29uZHMgPSB0aGlzLl9taWxsaXNlY29uZHM7XG4gICAgdmFyIGRheXMgICAgICAgICA9IHRoaXMuX2RheXM7XG4gICAgdmFyIG1vbnRocyAgICAgICA9IHRoaXMuX21vbnRocztcbiAgICB2YXIgZGF0YSAgICAgICAgID0gdGhpcy5fZGF0YTtcbiAgICB2YXIgc2Vjb25kcywgbWludXRlcywgaG91cnMsIHllYXJzLCBtb250aHNGcm9tRGF5cztcblxuICAgIC8vIGlmIHdlIGhhdmUgYSBtaXggb2YgcG9zaXRpdmUgYW5kIG5lZ2F0aXZlIHZhbHVlcywgYnViYmxlIGRvd24gZmlyc3RcbiAgICAvLyBjaGVjazogaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzIxNjZcbiAgICBpZiAoISgobWlsbGlzZWNvbmRzID49IDAgJiYgZGF5cyA+PSAwICYmIG1vbnRocyA+PSAwKSB8fFxuICAgICAgICAgICAgKG1pbGxpc2Vjb25kcyA8PSAwICYmIGRheXMgPD0gMCAmJiBtb250aHMgPD0gMCkpKSB7XG4gICAgICAgIG1pbGxpc2Vjb25kcyArPSBhYnNDZWlsKG1vbnRoc1RvRGF5cyhtb250aHMpICsgZGF5cykgKiA4NjRlNTtcbiAgICAgICAgZGF5cyA9IDA7XG4gICAgICAgIG1vbnRocyA9IDA7XG4gICAgfVxuXG4gICAgLy8gVGhlIGZvbGxvd2luZyBjb2RlIGJ1YmJsZXMgdXAgdmFsdWVzLCBzZWUgdGhlIHRlc3RzIGZvclxuICAgIC8vIGV4YW1wbGVzIG9mIHdoYXQgdGhhdCBtZWFucy5cbiAgICBkYXRhLm1pbGxpc2Vjb25kcyA9IG1pbGxpc2Vjb25kcyAlIDEwMDA7XG5cbiAgICBzZWNvbmRzICAgICAgICAgICA9IGFic0Zsb29yKG1pbGxpc2Vjb25kcyAvIDEwMDApO1xuICAgIGRhdGEuc2Vjb25kcyAgICAgID0gc2Vjb25kcyAlIDYwO1xuXG4gICAgbWludXRlcyAgICAgICAgICAgPSBhYnNGbG9vcihzZWNvbmRzIC8gNjApO1xuICAgIGRhdGEubWludXRlcyAgICAgID0gbWludXRlcyAlIDYwO1xuXG4gICAgaG91cnMgICAgICAgICAgICAgPSBhYnNGbG9vcihtaW51dGVzIC8gNjApO1xuICAgIGRhdGEuaG91cnMgICAgICAgID0gaG91cnMgJSAyNDtcblxuICAgIGRheXMgKz0gYWJzRmxvb3IoaG91cnMgLyAyNCk7XG5cbiAgICAvLyBjb252ZXJ0IGRheXMgdG8gbW9udGhzXG4gICAgbW9udGhzRnJvbURheXMgPSBhYnNGbG9vcihkYXlzVG9Nb250aHMoZGF5cykpO1xuICAgIG1vbnRocyArPSBtb250aHNGcm9tRGF5cztcbiAgICBkYXlzIC09IGFic0NlaWwobW9udGhzVG9EYXlzKG1vbnRoc0Zyb21EYXlzKSk7XG5cbiAgICAvLyAxMiBtb250aHMgLT4gMSB5ZWFyXG4gICAgeWVhcnMgPSBhYnNGbG9vcihtb250aHMgLyAxMik7XG4gICAgbW9udGhzICU9IDEyO1xuXG4gICAgZGF0YS5kYXlzICAgPSBkYXlzO1xuICAgIGRhdGEubW9udGhzID0gbW9udGhzO1xuICAgIGRhdGEueWVhcnMgID0geWVhcnM7XG5cbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gZGF5c1RvTW9udGhzIChkYXlzKSB7XG4gICAgLy8gNDAwIHllYXJzIGhhdmUgMTQ2MDk3IGRheXMgKHRha2luZyBpbnRvIGFjY291bnQgbGVhcCB5ZWFyIHJ1bGVzKVxuICAgIC8vIDQwMCB5ZWFycyBoYXZlIDEyIG1vbnRocyA9PT0gNDgwMFxuICAgIHJldHVybiBkYXlzICogNDgwMCAvIDE0NjA5Nztcbn1cblxuZnVuY3Rpb24gbW9udGhzVG9EYXlzIChtb250aHMpIHtcbiAgICAvLyB0aGUgcmV2ZXJzZSBvZiBkYXlzVG9Nb250aHNcbiAgICByZXR1cm4gbW9udGhzICogMTQ2MDk3IC8gNDgwMDtcbn1cblxuZnVuY3Rpb24gYXMgKHVuaXRzKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gTmFOO1xuICAgIH1cbiAgICB2YXIgZGF5cztcbiAgICB2YXIgbW9udGhzO1xuICAgIHZhciBtaWxsaXNlY29uZHMgPSB0aGlzLl9taWxsaXNlY29uZHM7XG5cbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcblxuICAgIGlmICh1bml0cyA9PT0gJ21vbnRoJyB8fCB1bml0cyA9PT0gJ3llYXInKSB7XG4gICAgICAgIGRheXMgICA9IHRoaXMuX2RheXMgICArIG1pbGxpc2Vjb25kcyAvIDg2NGU1O1xuICAgICAgICBtb250aHMgPSB0aGlzLl9tb250aHMgKyBkYXlzVG9Nb250aHMoZGF5cyk7XG4gICAgICAgIHJldHVybiB1bml0cyA9PT0gJ21vbnRoJyA/IG1vbnRocyA6IG1vbnRocyAvIDEyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGhhbmRsZSBtaWxsaXNlY29uZHMgc2VwYXJhdGVseSBiZWNhdXNlIG9mIGZsb2F0aW5nIHBvaW50IG1hdGggZXJyb3JzIChpc3N1ZSAjMTg2NylcbiAgICAgICAgZGF5cyA9IHRoaXMuX2RheXMgKyBNYXRoLnJvdW5kKG1vbnRoc1RvRGF5cyh0aGlzLl9tb250aHMpKTtcbiAgICAgICAgc3dpdGNoICh1bml0cykge1xuICAgICAgICAgICAgY2FzZSAnd2VlaycgICA6IHJldHVybiBkYXlzIC8gNyAgICAgKyBtaWxsaXNlY29uZHMgLyA2MDQ4ZTU7XG4gICAgICAgICAgICBjYXNlICdkYXknICAgIDogcmV0dXJuIGRheXMgICAgICAgICArIG1pbGxpc2Vjb25kcyAvIDg2NGU1O1xuICAgICAgICAgICAgY2FzZSAnaG91cicgICA6IHJldHVybiBkYXlzICogMjQgICAgKyBtaWxsaXNlY29uZHMgLyAzNmU1O1xuICAgICAgICAgICAgY2FzZSAnbWludXRlJyA6IHJldHVybiBkYXlzICogMTQ0MCAgKyBtaWxsaXNlY29uZHMgLyA2ZTQ7XG4gICAgICAgICAgICBjYXNlICdzZWNvbmQnIDogcmV0dXJuIGRheXMgKiA4NjQwMCArIG1pbGxpc2Vjb25kcyAvIDEwMDA7XG4gICAgICAgICAgICAvLyBNYXRoLmZsb29yIHByZXZlbnRzIGZsb2F0aW5nIHBvaW50IG1hdGggZXJyb3JzIGhlcmVcbiAgICAgICAgICAgIGNhc2UgJ21pbGxpc2Vjb25kJzogcmV0dXJuIE1hdGguZmxvb3IoZGF5cyAqIDg2NGU1KSArIG1pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignVW5rbm93biB1bml0ICcgKyB1bml0cyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFRPRE86IFVzZSB0aGlzLmFzKCdtcycpP1xuZnVuY3Rpb24gdmFsdWVPZiQxICgpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBOYU47XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyArXG4gICAgICAgIHRoaXMuX2RheXMgKiA4NjRlNSArXG4gICAgICAgICh0aGlzLl9tb250aHMgJSAxMikgKiAyNTkyZTYgK1xuICAgICAgICB0b0ludCh0aGlzLl9tb250aHMgLyAxMikgKiAzMTUzNmU2XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gbWFrZUFzIChhbGlhcykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzKGFsaWFzKTtcbiAgICB9O1xufVxuXG52YXIgYXNNaWxsaXNlY29uZHMgPSBtYWtlQXMoJ21zJyk7XG52YXIgYXNTZWNvbmRzICAgICAgPSBtYWtlQXMoJ3MnKTtcbnZhciBhc01pbnV0ZXMgICAgICA9IG1ha2VBcygnbScpO1xudmFyIGFzSG91cnMgICAgICAgID0gbWFrZUFzKCdoJyk7XG52YXIgYXNEYXlzICAgICAgICAgPSBtYWtlQXMoJ2QnKTtcbnZhciBhc1dlZWtzICAgICAgICA9IG1ha2VBcygndycpO1xudmFyIGFzTW9udGhzICAgICAgID0gbWFrZUFzKCdNJyk7XG52YXIgYXNZZWFycyAgICAgICAgPSBtYWtlQXMoJ3knKTtcblxuZnVuY3Rpb24gZ2V0JDIgKHVuaXRzKSB7XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpID8gdGhpc1t1bml0cyArICdzJ10oKSA6IE5hTjtcbn1cblxuZnVuY3Rpb24gbWFrZUdldHRlcihuYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpID8gdGhpcy5fZGF0YVtuYW1lXSA6IE5hTjtcbiAgICB9O1xufVxuXG52YXIgbWlsbGlzZWNvbmRzID0gbWFrZUdldHRlcignbWlsbGlzZWNvbmRzJyk7XG52YXIgc2Vjb25kcyAgICAgID0gbWFrZUdldHRlcignc2Vjb25kcycpO1xudmFyIG1pbnV0ZXMgICAgICA9IG1ha2VHZXR0ZXIoJ21pbnV0ZXMnKTtcbnZhciBob3VycyAgICAgICAgPSBtYWtlR2V0dGVyKCdob3VycycpO1xudmFyIGRheXMgICAgICAgICA9IG1ha2VHZXR0ZXIoJ2RheXMnKTtcbnZhciBtb250aHMgICAgICAgPSBtYWtlR2V0dGVyKCdtb250aHMnKTtcbnZhciB5ZWFycyAgICAgICAgPSBtYWtlR2V0dGVyKCd5ZWFycycpO1xuXG5mdW5jdGlvbiB3ZWVrcyAoKSB7XG4gICAgcmV0dXJuIGFic0Zsb29yKHRoaXMuZGF5cygpIC8gNyk7XG59XG5cbnZhciByb3VuZCA9IE1hdGgucm91bmQ7XG52YXIgdGhyZXNob2xkcyA9IHtcbiAgICBzczogNDQsICAgICAgICAgLy8gYSBmZXcgc2Vjb25kcyB0byBzZWNvbmRzXG4gICAgcyA6IDQ1LCAgICAgICAgIC8vIHNlY29uZHMgdG8gbWludXRlXG4gICAgbSA6IDQ1LCAgICAgICAgIC8vIG1pbnV0ZXMgdG8gaG91clxuICAgIGggOiAyMiwgICAgICAgICAvLyBob3VycyB0byBkYXlcbiAgICBkIDogMjYsICAgICAgICAgLy8gZGF5cyB0byBtb250aFxuICAgIE0gOiAxMSAgICAgICAgICAvLyBtb250aHMgdG8geWVhclxufTtcblxuLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBtb21lbnQuZm4uZnJvbSwgbW9tZW50LmZuLmZyb21Ob3csIGFuZCBtb21lbnQuZHVyYXRpb24uZm4uaHVtYW5pemVcbmZ1bmN0aW9uIHN1YnN0aXR1dGVUaW1lQWdvKHN0cmluZywgbnVtYmVyLCB3aXRob3V0U3VmZml4LCBpc0Z1dHVyZSwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIGxvY2FsZS5yZWxhdGl2ZVRpbWUobnVtYmVyIHx8IDEsICEhd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSk7XG59XG5cbmZ1bmN0aW9uIHJlbGF0aXZlVGltZSQxIChwb3NOZWdEdXJhdGlvbiwgd2l0aG91dFN1ZmZpeCwgbG9jYWxlKSB7XG4gICAgdmFyIGR1cmF0aW9uID0gY3JlYXRlRHVyYXRpb24ocG9zTmVnRHVyYXRpb24pLmFicygpO1xuICAgIHZhciBzZWNvbmRzICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdzJykpO1xuICAgIHZhciBtaW51dGVzICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdtJykpO1xuICAgIHZhciBob3VycyAgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdoJykpO1xuICAgIHZhciBkYXlzICAgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdkJykpO1xuICAgIHZhciBtb250aHMgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdNJykpO1xuICAgIHZhciB5ZWFycyAgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCd5JykpO1xuXG4gICAgdmFyIGEgPSBzZWNvbmRzIDw9IHRocmVzaG9sZHMuc3MgJiYgWydzJywgc2Vjb25kc10gIHx8XG4gICAgICAgICAgICBzZWNvbmRzIDwgdGhyZXNob2xkcy5zICAgJiYgWydzcycsIHNlY29uZHNdIHx8XG4gICAgICAgICAgICBtaW51dGVzIDw9IDEgICAgICAgICAgICAgJiYgWydtJ10gICAgICAgICAgIHx8XG4gICAgICAgICAgICBtaW51dGVzIDwgdGhyZXNob2xkcy5tICAgJiYgWydtbScsIG1pbnV0ZXNdIHx8XG4gICAgICAgICAgICBob3VycyAgIDw9IDEgICAgICAgICAgICAgJiYgWydoJ10gICAgICAgICAgIHx8XG4gICAgICAgICAgICBob3VycyAgIDwgdGhyZXNob2xkcy5oICAgJiYgWydoaCcsIGhvdXJzXSAgIHx8XG4gICAgICAgICAgICBkYXlzICAgIDw9IDEgICAgICAgICAgICAgJiYgWydkJ10gICAgICAgICAgIHx8XG4gICAgICAgICAgICBkYXlzICAgIDwgdGhyZXNob2xkcy5kICAgJiYgWydkZCcsIGRheXNdICAgIHx8XG4gICAgICAgICAgICBtb250aHMgIDw9IDEgICAgICAgICAgICAgJiYgWydNJ10gICAgICAgICAgIHx8XG4gICAgICAgICAgICBtb250aHMgIDwgdGhyZXNob2xkcy5NICAgJiYgWydNTScsIG1vbnRoc10gIHx8XG4gICAgICAgICAgICB5ZWFycyAgIDw9IDEgICAgICAgICAgICAgJiYgWyd5J10gICAgICAgICAgIHx8IFsneXknLCB5ZWFyc107XG5cbiAgICBhWzJdID0gd2l0aG91dFN1ZmZpeDtcbiAgICBhWzNdID0gK3Bvc05lZ0R1cmF0aW9uID4gMDtcbiAgICBhWzRdID0gbG9jYWxlO1xuICAgIHJldHVybiBzdWJzdGl0dXRlVGltZUFnby5hcHBseShudWxsLCBhKTtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIHNldCB0aGUgcm91bmRpbmcgZnVuY3Rpb24gZm9yIHJlbGF0aXZlIHRpbWUgc3RyaW5nc1xuZnVuY3Rpb24gZ2V0U2V0UmVsYXRpdmVUaW1lUm91bmRpbmcgKHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICBpZiAocm91bmRpbmdGdW5jdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiByb3VuZDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZihyb3VuZGluZ0Z1bmN0aW9uKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByb3VuZCA9IHJvdW5kaW5nRnVuY3Rpb247XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHlvdSB0byBzZXQgYSB0aHJlc2hvbGQgZm9yIHJlbGF0aXZlIHRpbWUgc3RyaW5nc1xuZnVuY3Rpb24gZ2V0U2V0UmVsYXRpdmVUaW1lVGhyZXNob2xkICh0aHJlc2hvbGQsIGxpbWl0KSB7XG4gICAgaWYgKHRocmVzaG9sZHNbdGhyZXNob2xkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGxpbWl0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRocmVzaG9sZHNbdGhyZXNob2xkXTtcbiAgICB9XG4gICAgdGhyZXNob2xkc1t0aHJlc2hvbGRdID0gbGltaXQ7XG4gICAgaWYgKHRocmVzaG9sZCA9PT0gJ3MnKSB7XG4gICAgICAgIHRocmVzaG9sZHMuc3MgPSBsaW1pdCAtIDE7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBodW1hbml6ZSAod2l0aFN1ZmZpeCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgfVxuXG4gICAgdmFyIGxvY2FsZSA9IHRoaXMubG9jYWxlRGF0YSgpO1xuICAgIHZhciBvdXRwdXQgPSByZWxhdGl2ZVRpbWUkMSh0aGlzLCAhd2l0aFN1ZmZpeCwgbG9jYWxlKTtcblxuICAgIGlmICh3aXRoU3VmZml4KSB7XG4gICAgICAgIG91dHB1dCA9IGxvY2FsZS5wYXN0RnV0dXJlKCt0aGlzLCBvdXRwdXQpO1xuICAgIH1cblxuICAgIHJldHVybiBsb2NhbGUucG9zdGZvcm1hdChvdXRwdXQpO1xufVxuXG52YXIgYWJzJDEgPSBNYXRoLmFicztcblxuZnVuY3Rpb24gdG9JU09TdHJpbmckMSgpIHtcbiAgICAvLyBmb3IgSVNPIHN0cmluZ3Mgd2UgZG8gbm90IHVzZSB0aGUgbm9ybWFsIGJ1YmJsaW5nIHJ1bGVzOlxuICAgIC8vICAqIG1pbGxpc2Vjb25kcyBidWJibGUgdXAgdW50aWwgdGhleSBiZWNvbWUgaG91cnNcbiAgICAvLyAgKiBkYXlzIGRvIG5vdCBidWJibGUgYXQgYWxsXG4gICAgLy8gICogbW9udGhzIGJ1YmJsZSB1cCB1bnRpbCB0aGV5IGJlY29tZSB5ZWFyc1xuICAgIC8vIFRoaXMgaXMgYmVjYXVzZSB0aGVyZSBpcyBubyBjb250ZXh0LWZyZWUgY29udmVyc2lvbiBiZXR3ZWVuIGhvdXJzIGFuZCBkYXlzXG4gICAgLy8gKHRoaW5rIG9mIGNsb2NrIGNoYW5nZXMpXG4gICAgLy8gYW5kIGFsc28gbm90IGJldHdlZW4gZGF5cyBhbmQgbW9udGhzICgyOC0zMSBkYXlzIHBlciBtb250aClcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5pbnZhbGlkRGF0ZSgpO1xuICAgIH1cblxuICAgIHZhciBzZWNvbmRzID0gYWJzJDEodGhpcy5fbWlsbGlzZWNvbmRzKSAvIDEwMDA7XG4gICAgdmFyIGRheXMgICAgICAgICA9IGFicyQxKHRoaXMuX2RheXMpO1xuICAgIHZhciBtb250aHMgICAgICAgPSBhYnMkMSh0aGlzLl9tb250aHMpO1xuICAgIHZhciBtaW51dGVzLCBob3VycywgeWVhcnM7XG5cbiAgICAvLyAzNjAwIHNlY29uZHMgLT4gNjAgbWludXRlcyAtPiAxIGhvdXJcbiAgICBtaW51dGVzICAgICAgICAgICA9IGFic0Zsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgaG91cnMgICAgICAgICAgICAgPSBhYnNGbG9vcihtaW51dGVzIC8gNjApO1xuICAgIHNlY29uZHMgJT0gNjA7XG4gICAgbWludXRlcyAlPSA2MDtcblxuICAgIC8vIDEyIG1vbnRocyAtPiAxIHllYXJcbiAgICB5ZWFycyAgPSBhYnNGbG9vcihtb250aHMgLyAxMik7XG4gICAgbW9udGhzICU9IDEyO1xuXG5cbiAgICAvLyBpbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vZG9yZGlsbGUvbW9tZW50LWlzb2R1cmF0aW9uL2Jsb2IvbWFzdGVyL21vbWVudC5pc29kdXJhdGlvbi5qc1xuICAgIHZhciBZID0geWVhcnM7XG4gICAgdmFyIE0gPSBtb250aHM7XG4gICAgdmFyIEQgPSBkYXlzO1xuICAgIHZhciBoID0gaG91cnM7XG4gICAgdmFyIG0gPSBtaW51dGVzO1xuICAgIHZhciBzID0gc2Vjb25kcztcbiAgICB2YXIgdG90YWwgPSB0aGlzLmFzU2Vjb25kcygpO1xuXG4gICAgaWYgKCF0b3RhbCkge1xuICAgICAgICAvLyB0aGlzIGlzIHRoZSBzYW1lIGFzIEMjJ3MgKE5vZGEpIGFuZCBweXRob24gKGlzb2RhdGUpLi4uXG4gICAgICAgIC8vIGJ1dCBub3Qgb3RoZXIgSlMgKGdvb2cuZGF0ZSlcbiAgICAgICAgcmV0dXJuICdQMEQnO1xuICAgIH1cblxuICAgIHJldHVybiAodG90YWwgPCAwID8gJy0nIDogJycpICtcbiAgICAgICAgJ1AnICtcbiAgICAgICAgKFkgPyBZICsgJ1knIDogJycpICtcbiAgICAgICAgKE0gPyBNICsgJ00nIDogJycpICtcbiAgICAgICAgKEQgPyBEICsgJ0QnIDogJycpICtcbiAgICAgICAgKChoIHx8IG0gfHwgcykgPyAnVCcgOiAnJykgK1xuICAgICAgICAoaCA/IGggKyAnSCcgOiAnJykgK1xuICAgICAgICAobSA/IG0gKyAnTScgOiAnJykgK1xuICAgICAgICAocyA/IHMgKyAnUycgOiAnJyk7XG59XG5cbnZhciBwcm90byQyID0gRHVyYXRpb24ucHJvdG90eXBlO1xuXG5wcm90byQyLmlzVmFsaWQgICAgICAgID0gaXNWYWxpZCQxO1xucHJvdG8kMi5hYnMgICAgICAgICAgICA9IGFicztcbnByb3RvJDIuYWRkICAgICAgICAgICAgPSBhZGQkMTtcbnByb3RvJDIuc3VidHJhY3QgICAgICAgPSBzdWJ0cmFjdCQxO1xucHJvdG8kMi5hcyAgICAgICAgICAgICA9IGFzO1xucHJvdG8kMi5hc01pbGxpc2Vjb25kcyA9IGFzTWlsbGlzZWNvbmRzO1xucHJvdG8kMi5hc1NlY29uZHMgICAgICA9IGFzU2Vjb25kcztcbnByb3RvJDIuYXNNaW51dGVzICAgICAgPSBhc01pbnV0ZXM7XG5wcm90byQyLmFzSG91cnMgICAgICAgID0gYXNIb3VycztcbnByb3RvJDIuYXNEYXlzICAgICAgICAgPSBhc0RheXM7XG5wcm90byQyLmFzV2Vla3MgICAgICAgID0gYXNXZWVrcztcbnByb3RvJDIuYXNNb250aHMgICAgICAgPSBhc01vbnRocztcbnByb3RvJDIuYXNZZWFycyAgICAgICAgPSBhc1llYXJzO1xucHJvdG8kMi52YWx1ZU9mICAgICAgICA9IHZhbHVlT2YkMTtcbnByb3RvJDIuX2J1YmJsZSAgICAgICAgPSBidWJibGU7XG5wcm90byQyLmdldCAgICAgICAgICAgID0gZ2V0JDI7XG5wcm90byQyLm1pbGxpc2Vjb25kcyAgID0gbWlsbGlzZWNvbmRzO1xucHJvdG8kMi5zZWNvbmRzICAgICAgICA9IHNlY29uZHM7XG5wcm90byQyLm1pbnV0ZXMgICAgICAgID0gbWludXRlcztcbnByb3RvJDIuaG91cnMgICAgICAgICAgPSBob3VycztcbnByb3RvJDIuZGF5cyAgICAgICAgICAgPSBkYXlzO1xucHJvdG8kMi53ZWVrcyAgICAgICAgICA9IHdlZWtzO1xucHJvdG8kMi5tb250aHMgICAgICAgICA9IG1vbnRocztcbnByb3RvJDIueWVhcnMgICAgICAgICAgPSB5ZWFycztcbnByb3RvJDIuaHVtYW5pemUgICAgICAgPSBodW1hbml6ZTtcbnByb3RvJDIudG9JU09TdHJpbmcgICAgPSB0b0lTT1N0cmluZyQxO1xucHJvdG8kMi50b1N0cmluZyAgICAgICA9IHRvSVNPU3RyaW5nJDE7XG5wcm90byQyLnRvSlNPTiAgICAgICAgID0gdG9JU09TdHJpbmckMTtcbnByb3RvJDIubG9jYWxlICAgICAgICAgPSBsb2NhbGU7XG5wcm90byQyLmxvY2FsZURhdGEgICAgID0gbG9jYWxlRGF0YTtcblxuLy8gRGVwcmVjYXRpb25zXG5wcm90byQyLnRvSXNvU3RyaW5nID0gZGVwcmVjYXRlKCd0b0lzb1N0cmluZygpIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgdG9JU09TdHJpbmcoKSBpbnN0ZWFkIChub3RpY2UgdGhlIGNhcGl0YWxzKScsIHRvSVNPU3RyaW5nJDEpO1xucHJvdG8kMi5sYW5nID0gbGFuZztcblxuLy8gU2lkZSBlZmZlY3QgaW1wb3J0c1xuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdYJywgMCwgMCwgJ3VuaXgnKTtcbmFkZEZvcm1hdFRva2VuKCd4JywgMCwgMCwgJ3ZhbHVlT2YnKTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCd4JywgbWF0Y2hTaWduZWQpO1xuYWRkUmVnZXhUb2tlbignWCcsIG1hdGNoVGltZXN0YW1wKTtcbmFkZFBhcnNlVG9rZW4oJ1gnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShwYXJzZUZsb2F0KGlucHV0LCAxMCkgKiAxMDAwKTtcbn0pO1xuYWRkUGFyc2VUb2tlbigneCcsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHRvSW50KGlucHV0KSk7XG59KTtcblxuLy8gU2lkZSBlZmZlY3QgaW1wb3J0c1xuXG5cbmhvb2tzLnZlcnNpb24gPSAnMi4xOC4xJztcblxuc2V0SG9va0NhbGxiYWNrKGNyZWF0ZUxvY2FsKTtcblxuaG9va3MuZm4gICAgICAgICAgICAgICAgICAgID0gcHJvdG87XG5ob29rcy5taW4gICAgICAgICAgICAgICAgICAgPSBtaW47XG5ob29rcy5tYXggICAgICAgICAgICAgICAgICAgPSBtYXg7XG5ob29rcy5ub3cgICAgICAgICAgICAgICAgICAgPSBub3c7XG5ob29rcy51dGMgICAgICAgICAgICAgICAgICAgPSBjcmVhdGVVVEM7XG5ob29rcy51bml4ICAgICAgICAgICAgICAgICAgPSBjcmVhdGVVbml4O1xuaG9va3MubW9udGhzICAgICAgICAgICAgICAgID0gbGlzdE1vbnRocztcbmhvb2tzLmlzRGF0ZSAgICAgICAgICAgICAgICA9IGlzRGF0ZTtcbmhvb2tzLmxvY2FsZSAgICAgICAgICAgICAgICA9IGdldFNldEdsb2JhbExvY2FsZTtcbmhvb2tzLmludmFsaWQgICAgICAgICAgICAgICA9IGNyZWF0ZUludmFsaWQ7XG5ob29rcy5kdXJhdGlvbiAgICAgICAgICAgICAgPSBjcmVhdGVEdXJhdGlvbjtcbmhvb2tzLmlzTW9tZW50ICAgICAgICAgICAgICA9IGlzTW9tZW50O1xuaG9va3Mud2Vla2RheXMgICAgICAgICAgICAgID0gbGlzdFdlZWtkYXlzO1xuaG9va3MucGFyc2Vab25lICAgICAgICAgICAgID0gY3JlYXRlSW5ab25lO1xuaG9va3MubG9jYWxlRGF0YSAgICAgICAgICAgID0gZ2V0TG9jYWxlO1xuaG9va3MuaXNEdXJhdGlvbiAgICAgICAgICAgID0gaXNEdXJhdGlvbjtcbmhvb2tzLm1vbnRoc1Nob3J0ICAgICAgICAgICA9IGxpc3RNb250aHNTaG9ydDtcbmhvb2tzLndlZWtkYXlzTWluICAgICAgICAgICA9IGxpc3RXZWVrZGF5c01pbjtcbmhvb2tzLmRlZmluZUxvY2FsZSAgICAgICAgICA9IGRlZmluZUxvY2FsZTtcbmhvb2tzLnVwZGF0ZUxvY2FsZSAgICAgICAgICA9IHVwZGF0ZUxvY2FsZTtcbmhvb2tzLmxvY2FsZXMgICAgICAgICAgICAgICA9IGxpc3RMb2NhbGVzO1xuaG9va3Mud2Vla2RheXNTaG9ydCAgICAgICAgID0gbGlzdFdlZWtkYXlzU2hvcnQ7XG5ob29rcy5ub3JtYWxpemVVbml0cyAgICAgICAgPSBub3JtYWxpemVVbml0cztcbmhvb2tzLnJlbGF0aXZlVGltZVJvdW5kaW5nID0gZ2V0U2V0UmVsYXRpdmVUaW1lUm91bmRpbmc7XG5ob29rcy5yZWxhdGl2ZVRpbWVUaHJlc2hvbGQgPSBnZXRTZXRSZWxhdGl2ZVRpbWVUaHJlc2hvbGQ7XG5ob29rcy5jYWxlbmRhckZvcm1hdCAgICAgICAgPSBnZXRDYWxlbmRhckZvcm1hdDtcbmhvb2tzLnByb3RvdHlwZSAgICAgICAgICAgICA9IHByb3RvO1xuXG5yZXR1cm4gaG9va3M7XG5cbn0pKSk7XG4iLCIvKiEgQnJvd3NlciBidW5kbGUgb2YgbnVuanVja3MgMy4wLjEgKHNsaW0sIG9ubHkgd29ya3Mgd2l0aCBwcmVjb21waWxlZCB0ZW1wbGF0ZXMpICovXG4oZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJudW5qdWNrc1wiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJudW5qdWNrc1wiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIC8qKioqKiovIChmdW5jdGlvbihtb2R1bGVzKSB7IC8vIHdlYnBhY2tCb290c3RyYXBcbi8qKioqKiovIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4vKioqKioqLyBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuLyoqKioqKi8gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbi8qKioqKiovIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9LFxuLyoqKioqKi8gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdFx0bG9hZGVkOiBmYWxzZVxuLyoqKioqKi8gXHRcdH07XG5cbi8qKioqKiovIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuLyoqKioqKi8gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbi8qKioqKiovIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuLyoqKioqKi8gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG5cblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuLyoqKioqKi8gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8qKioqKiovIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG4vKioqKioqLyB9KVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIChbXG4vKiAwICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgZW52ID0gX193ZWJwYWNrX3JlcXVpcmVfXygyKTtcblx0dmFyIExvYWRlciA9IF9fd2VicGFja19yZXF1aXJlX18oMTUpO1xuXHR2YXIgbG9hZGVycyA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBwcmVjb21waWxlID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXHRtb2R1bGUuZXhwb3J0cy5FbnZpcm9ubWVudCA9IGVudi5FbnZpcm9ubWVudDtcblx0bW9kdWxlLmV4cG9ydHMuVGVtcGxhdGUgPSBlbnYuVGVtcGxhdGU7XG5cblx0bW9kdWxlLmV4cG9ydHMuTG9hZGVyID0gTG9hZGVyO1xuXHRtb2R1bGUuZXhwb3J0cy5GaWxlU3lzdGVtTG9hZGVyID0gbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyO1xuXHRtb2R1bGUuZXhwb3J0cy5QcmVjb21waWxlZExvYWRlciA9IGxvYWRlcnMuUHJlY29tcGlsZWRMb2FkZXI7XG5cdG1vZHVsZS5leHBvcnRzLldlYkxvYWRlciA9IGxvYWRlcnMuV2ViTG9hZGVyO1xuXG5cdG1vZHVsZS5leHBvcnRzLmNvbXBpbGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0bW9kdWxlLmV4cG9ydHMucGFyc2VyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0bW9kdWxlLmV4cG9ydHMubGV4ZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHRtb2R1bGUuZXhwb3J0cy5ydW50aW1lID0gX193ZWJwYWNrX3JlcXVpcmVfXyg4KTtcblx0bW9kdWxlLmV4cG9ydHMubGliID0gbGliO1xuXHRtb2R1bGUuZXhwb3J0cy5ub2RlcyA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0bW9kdWxlLmV4cG9ydHMuaW5zdGFsbEppbmphQ29tcGF0ID0gX193ZWJwYWNrX3JlcXVpcmVfXygxNik7XG5cblx0Ly8gQSBzaW5nbGUgaW5zdGFuY2Ugb2YgYW4gZW52aXJvbm1lbnQsIHNpbmNlIHRoaXMgaXMgc28gY29tbW9ubHkgdXNlZFxuXG5cdHZhciBlO1xuXHRtb2R1bGUuZXhwb3J0cy5jb25maWd1cmUgPSBmdW5jdGlvbih0ZW1wbGF0ZXNQYXRoLCBvcHRzKSB7XG5cdCAgICBvcHRzID0gb3B0cyB8fCB7fTtcblx0ICAgIGlmKGxpYi5pc09iamVjdCh0ZW1wbGF0ZXNQYXRoKSkge1xuXHQgICAgICAgIG9wdHMgPSB0ZW1wbGF0ZXNQYXRoO1xuXHQgICAgICAgIHRlbXBsYXRlc1BhdGggPSBudWxsO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgVGVtcGxhdGVMb2FkZXI7XG5cdCAgICBpZihsb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIpIHtcblx0ICAgICAgICBUZW1wbGF0ZUxvYWRlciA9IG5ldyBsb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIodGVtcGxhdGVzUGF0aCwge1xuXHQgICAgICAgICAgICB3YXRjaDogb3B0cy53YXRjaCxcblx0ICAgICAgICAgICAgbm9DYWNoZTogb3B0cy5ub0NhY2hlXG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cdCAgICBlbHNlIGlmKGxvYWRlcnMuV2ViTG9hZGVyKSB7XG5cdCAgICAgICAgVGVtcGxhdGVMb2FkZXIgPSBuZXcgbG9hZGVycy5XZWJMb2FkZXIodGVtcGxhdGVzUGF0aCwge1xuXHQgICAgICAgICAgICB1c2VDYWNoZTogb3B0cy53ZWIgJiYgb3B0cy53ZWIudXNlQ2FjaGUsXG5cdCAgICAgICAgICAgIGFzeW5jOiBvcHRzLndlYiAmJiBvcHRzLndlYi5hc3luY1xuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICBlID0gbmV3IGVudi5FbnZpcm9ubWVudChUZW1wbGF0ZUxvYWRlciwgb3B0cyk7XG5cblx0ICAgIGlmKG9wdHMgJiYgb3B0cy5leHByZXNzKSB7XG5cdCAgICAgICAgZS5leHByZXNzKG9wdHMuZXhwcmVzcyk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBlO1xuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbihzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKSB7XG5cdCAgICBpZighZSkge1xuXHQgICAgICAgIG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSgpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIG5ldyBtb2R1bGUuZXhwb3J0cy5UZW1wbGF0ZShzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKTtcblx0fTtcblxuXHRtb2R1bGUuZXhwb3J0cy5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCBjdHgsIGNiKSB7XG5cdCAgICBpZighZSkge1xuXHQgICAgICAgIG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSgpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gZS5yZW5kZXIobmFtZSwgY3R4LCBjYik7XG5cdH07XG5cblx0bW9kdWxlLmV4cG9ydHMucmVuZGVyU3RyaW5nID0gZnVuY3Rpb24oc3JjLCBjdHgsIGNiKSB7XG5cdCAgICBpZighZSkge1xuXHQgICAgICAgIG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSgpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gZS5yZW5kZXJTdHJpbmcoc3JjLCBjdHgsIGNiKTtcblx0fTtcblxuXHRpZihwcmVjb21waWxlKSB7XG5cdCAgICBtb2R1bGUuZXhwb3J0cy5wcmVjb21waWxlID0gcHJlY29tcGlsZS5wcmVjb21waWxlO1xuXHQgICAgbW9kdWxlLmV4cG9ydHMucHJlY29tcGlsZVN0cmluZyA9IHByZWNvbXBpbGUucHJlY29tcGlsZVN0cmluZztcblx0fVxuXG5cbi8qKiovIH0pLFxuLyogMSAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZTtcblx0dmFyIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuXHR2YXIgZXNjYXBlTWFwID0ge1xuXHQgICAgJyYnOiAnJmFtcDsnLFxuXHQgICAgJ1wiJzogJyZxdW90OycsXG5cdCAgICAnXFwnJzogJyYjMzk7Jyxcblx0ICAgICc8JzogJyZsdDsnLFxuXHQgICAgJz4nOiAnJmd0Oydcblx0fTtcblxuXHR2YXIgZXNjYXBlUmVnZXggPSAvWyZcIic8Pl0vZztcblxuXHR2YXIgbG9va3VwRXNjYXBlID0gZnVuY3Rpb24oY2gpIHtcblx0ICAgIHJldHVybiBlc2NhcGVNYXBbY2hdO1xuXHR9O1xuXG5cdHZhciBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuXHRleHBvcnRzLnByZXR0aWZ5RXJyb3IgPSBmdW5jdGlvbihwYXRoLCB3aXRoSW50ZXJuYWxzLCBlcnIpIHtcblx0ICAgIC8vIGpzaGludCAtVzAyMlxuXHQgICAgLy8gaHR0cDovL2pzbGludGVycm9ycy5jb20vZG8tbm90LWFzc2lnbi10by10aGUtZXhjZXB0aW9uLXBhcmFtZXRlclxuXHQgICAgaWYgKCFlcnIuVXBkYXRlKSB7XG5cdCAgICAgICAgLy8gbm90IG9uZSBvZiBvdXJzLCBjYXN0IGl0XG5cdCAgICAgICAgZXJyID0gbmV3IGV4cG9ydHMuVGVtcGxhdGVFcnJvcihlcnIpO1xuXHQgICAgfVxuXHQgICAgZXJyLlVwZGF0ZShwYXRoKTtcblxuXHQgICAgLy8gVW5sZXNzIHRoZXkgbWFya2VkIHRoZSBkZXYgZmxhZywgc2hvdyB0aGVtIGEgdHJhY2UgZnJvbSBoZXJlXG5cdCAgICBpZiAoIXdpdGhJbnRlcm5hbHMpIHtcblx0ICAgICAgICB2YXIgb2xkID0gZXJyO1xuXHQgICAgICAgIGVyciA9IG5ldyBFcnJvcihvbGQubWVzc2FnZSk7XG5cdCAgICAgICAgZXJyLm5hbWUgPSBvbGQubmFtZTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIGVycjtcblx0fTtcblxuXHRleHBvcnRzLlRlbXBsYXRlRXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlLCBsaW5lbm8sIGNvbG5vKSB7XG5cdCAgICB2YXIgZXJyID0gdGhpcztcblxuXHQgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBFcnJvcikgeyAvLyBmb3IgY2FzdGluZyByZWd1bGFyIGpzIGVycm9yc1xuXHQgICAgICAgIGVyciA9IG1lc3NhZ2U7XG5cdCAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UubmFtZSArICc6ICcgKyBtZXNzYWdlLm1lc3NhZ2U7XG5cblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICBpZihlcnIubmFtZSA9ICcnKSB7fVxuXHQgICAgICAgIH1cblx0ICAgICAgICBjYXRjaChlKSB7XG5cdCAgICAgICAgICAgIC8vIElmIHdlIGNhbid0IHNldCB0aGUgbmFtZSBvZiB0aGUgZXJyb3Igb2JqZWN0IGluIHRoaXNcblx0ICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQsIGRvbid0IHVzZSBpdFxuXHQgICAgICAgICAgICBlcnIgPSB0aGlzO1xuXHQgICAgICAgIH1cblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgaWYoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcblx0ICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoZXJyKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGVyci5uYW1lID0gJ1RlbXBsYXRlIHJlbmRlciBlcnJvcic7XG5cdCAgICBlcnIubWVzc2FnZSA9IG1lc3NhZ2U7XG5cdCAgICBlcnIubGluZW5vID0gbGluZW5vO1xuXHQgICAgZXJyLmNvbG5vID0gY29sbm87XG5cdCAgICBlcnIuZmlyc3RVcGRhdGUgPSB0cnVlO1xuXG5cdCAgICBlcnIuVXBkYXRlID0gZnVuY3Rpb24ocGF0aCkge1xuXHQgICAgICAgIHZhciBtZXNzYWdlID0gJygnICsgKHBhdGggfHwgJ3Vua25vd24gcGF0aCcpICsgJyknO1xuXG5cdCAgICAgICAgLy8gb25seSBzaG93IGxpbmVubyArIGNvbG5vIG5leHQgdG8gcGF0aCBvZiB0ZW1wbGF0ZVxuXHQgICAgICAgIC8vIHdoZXJlIGVycm9yIG9jY3VycmVkXG5cdCAgICAgICAgaWYgKHRoaXMuZmlyc3RVcGRhdGUpIHtcblx0ICAgICAgICAgICAgaWYodGhpcy5saW5lbm8gJiYgdGhpcy5jb2xubykge1xuXHQgICAgICAgICAgICAgICAgbWVzc2FnZSArPSAnIFtMaW5lICcgKyB0aGlzLmxpbmVubyArICcsIENvbHVtbiAnICsgdGhpcy5jb2xubyArICddJztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKHRoaXMubGluZW5vKSB7XG5cdCAgICAgICAgICAgICAgICBtZXNzYWdlICs9ICcgW0xpbmUgJyArIHRoaXMubGluZW5vICsgJ10nO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgbWVzc2FnZSArPSAnXFxuICc7XG5cdCAgICAgICAgaWYgKHRoaXMuZmlyc3RVcGRhdGUpIHtcblx0ICAgICAgICAgICAgbWVzc2FnZSArPSAnICc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSArICh0aGlzLm1lc3NhZ2UgfHwgJycpO1xuXHQgICAgICAgIHRoaXMuZmlyc3RVcGRhdGUgPSBmYWxzZTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH07XG5cblx0ICAgIHJldHVybiBlcnI7XG5cdH07XG5cblx0ZXhwb3J0cy5UZW1wbGF0ZUVycm9yLnByb3RvdHlwZSA9IEVycm9yLnByb3RvdHlwZTtcblxuXHRleHBvcnRzLmVzY2FwZSA9IGZ1bmN0aW9uKHZhbCkge1xuXHQgIHJldHVybiB2YWwucmVwbGFjZShlc2NhcGVSZWdleCwgbG9va3VwRXNjYXBlKTtcblx0fTtcblxuXHRleHBvcnRzLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cdH07XG5cblx0ZXhwb3J0cy5pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG5cdH07XG5cblx0ZXhwb3J0cy5pc1N0cmluZyA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgU3RyaW5nXSc7XG5cdH07XG5cblx0ZXhwb3J0cy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cdH07XG5cblx0ZXhwb3J0cy5ncm91cEJ5ID0gZnVuY3Rpb24ob2JqLCB2YWwpIHtcblx0ICAgIHZhciByZXN1bHQgPSB7fTtcblx0ICAgIHZhciBpdGVyYXRvciA9IGV4cG9ydHMuaXNGdW5jdGlvbih2YWwpID8gdmFsIDogZnVuY3Rpb24ob2JqKSB7IHJldHVybiBvYmpbdmFsXTsgfTtcblx0ICAgIGZvcih2YXIgaT0wOyBpPG9iai5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgIHZhciB2YWx1ZSA9IG9ialtpXTtcblx0ICAgICAgICB2YXIga2V5ID0gaXRlcmF0b3IodmFsdWUsIGkpO1xuXHQgICAgICAgIChyZXN1bHRba2V5XSB8fCAocmVzdWx0W2tleV0gPSBbXSkpLnB1c2godmFsdWUpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHJlc3VsdDtcblx0fTtcblxuXHRleHBvcnRzLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChvYmopO1xuXHR9O1xuXG5cdGV4cG9ydHMud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG5cdCAgICB2YXIgcmVzdWx0ID0gW107XG5cdCAgICBpZiAoIWFycmF5KSB7XG5cdCAgICAgICAgcmV0dXJuIHJlc3VsdDtcblx0ICAgIH1cblx0ICAgIHZhciBpbmRleCA9IC0xLFxuXHQgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuXHQgICAgY29udGFpbnMgPSBleHBvcnRzLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcblxuXHQgICAgd2hpbGUoKytpbmRleCA8IGxlbmd0aCkge1xuXHQgICAgICAgIGlmKGV4cG9ydHMuaW5kZXhPZihjb250YWlucywgYXJyYXlbaW5kZXhdKSA9PT0gLTEpIHtcblx0ICAgICAgICAgICAgcmVzdWx0LnB1c2goYXJyYXlbaW5kZXhdKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gcmVzdWx0O1xuXHR9O1xuXG5cdGV4cG9ydHMuZXh0ZW5kID0gZnVuY3Rpb24ob2JqLCBvYmoyKSB7XG5cdCAgICBmb3IodmFyIGsgaW4gb2JqMikge1xuXHQgICAgICAgIG9ialtrXSA9IG9iajJba107XG5cdCAgICB9XG5cdCAgICByZXR1cm4gb2JqO1xuXHR9O1xuXG5cdGV4cG9ydHMucmVwZWF0ID0gZnVuY3Rpb24oY2hhcl8sIG4pIHtcblx0ICAgIHZhciBzdHIgPSAnJztcblx0ICAgIGZvcih2YXIgaT0wOyBpPG47IGkrKykge1xuXHQgICAgICAgIHN0ciArPSBjaGFyXztcblx0ICAgIH1cblx0ICAgIHJldHVybiBzdHI7XG5cdH07XG5cblx0ZXhwb3J0cy5lYWNoID0gZnVuY3Rpb24ob2JqLCBmdW5jLCBjb250ZXh0KSB7XG5cdCAgICBpZihvYmogPT0gbnVsbCkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgaWYoQXJyYXlQcm90by5lYWNoICYmIG9iai5lYWNoID09PSBBcnJheVByb3RvLmVhY2gpIHtcblx0ICAgICAgICBvYmouZm9yRWFjaChmdW5jLCBjb250ZXh0KTtcblx0ICAgIH1cblx0ICAgIGVsc2UgaWYob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcblx0ICAgICAgICBmb3IodmFyIGk9MCwgbD1vYmoubGVuZ3RoOyBpPGw7IGkrKykge1xuXHQgICAgICAgICAgICBmdW5jLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0fTtcblxuXHRleHBvcnRzLm1hcCA9IGZ1bmN0aW9uKG9iaiwgZnVuYykge1xuXHQgICAgdmFyIHJlc3VsdHMgPSBbXTtcblx0ICAgIGlmKG9iaiA9PSBudWxsKSB7XG5cdCAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG5cdCAgICB9XG5cblx0ICAgIGlmKEFycmF5UHJvdG8ubWFwICYmIG9iai5tYXAgPT09IEFycmF5UHJvdG8ubWFwKSB7XG5cdCAgICAgICAgcmV0dXJuIG9iai5tYXAoZnVuYyk7XG5cdCAgICB9XG5cblx0ICAgIGZvcih2YXIgaT0wOyBpPG9iai5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgIHJlc3VsdHNbcmVzdWx0cy5sZW5ndGhdID0gZnVuYyhvYmpbaV0sIGkpO1xuXHQgICAgfVxuXG5cdCAgICBpZihvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuXHQgICAgICAgIHJlc3VsdHMubGVuZ3RoID0gb2JqLmxlbmd0aDtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHJlc3VsdHM7XG5cdH07XG5cblx0ZXhwb3J0cy5hc3luY0l0ZXIgPSBmdW5jdGlvbihhcnIsIGl0ZXIsIGNiKSB7XG5cdCAgICB2YXIgaSA9IC0xO1xuXG5cdCAgICBmdW5jdGlvbiBuZXh0KCkge1xuXHQgICAgICAgIGkrKztcblxuXHQgICAgICAgIGlmKGkgPCBhcnIubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIGl0ZXIoYXJyW2ldLCBpLCBuZXh0LCBjYik7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBjYigpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgbmV4dCgpO1xuXHR9O1xuXG5cdGV4cG9ydHMuYXN5bmNGb3IgPSBmdW5jdGlvbihvYmosIGl0ZXIsIGNiKSB7XG5cdCAgICB2YXIga2V5cyA9IGV4cG9ydHMua2V5cyhvYmopO1xuXHQgICAgdmFyIGxlbiA9IGtleXMubGVuZ3RoO1xuXHQgICAgdmFyIGkgPSAtMTtcblxuXHQgICAgZnVuY3Rpb24gbmV4dCgpIHtcblx0ICAgICAgICBpKys7XG5cdCAgICAgICAgdmFyIGsgPSBrZXlzW2ldO1xuXG5cdCAgICAgICAgaWYoaSA8IGxlbikge1xuXHQgICAgICAgICAgICBpdGVyKGssIG9ialtrXSwgaSwgbGVuLCBuZXh0KTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGNiKCk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBuZXh0KCk7XG5cdH07XG5cblx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvaW5kZXhPZiNQb2x5ZmlsbFxuXHRleHBvcnRzLmluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA/XG5cdCAgICBmdW5jdGlvbiAoYXJyLCBzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcblx0ICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCk7XG5cdCAgICB9IDpcblx0ICAgIGZ1bmN0aW9uIChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuXHQgICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCA+Pj4gMDsgLy8gSGFjayB0byBjb252ZXJ0IG9iamVjdC5sZW5ndGggdG8gYSBVSW50MzJcblxuXHQgICAgICAgIGZyb21JbmRleCA9ICtmcm9tSW5kZXggfHwgMDtcblxuXHQgICAgICAgIGlmKE1hdGguYWJzKGZyb21JbmRleCkgPT09IEluZmluaXR5KSB7XG5cdCAgICAgICAgICAgIGZyb21JbmRleCA9IDA7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYoZnJvbUluZGV4IDwgMCkge1xuXHQgICAgICAgICAgICBmcm9tSW5kZXggKz0gbGVuZ3RoO1xuXHQgICAgICAgICAgICBpZiAoZnJvbUluZGV4IDwgMCkge1xuXHQgICAgICAgICAgICAgICAgZnJvbUluZGV4ID0gMDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZvcig7ZnJvbUluZGV4IDwgbGVuZ3RoOyBmcm9tSW5kZXgrKykge1xuXHQgICAgICAgICAgICBpZiAoYXJyW2Zyb21JbmRleF0gPT09IHNlYXJjaEVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmcm9tSW5kZXg7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gLTE7XG5cdCAgICB9O1xuXG5cdGlmKCFBcnJheS5wcm90b3R5cGUubWFwKSB7XG5cdCAgICBBcnJheS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYXAgaXMgdW5pbXBsZW1lbnRlZCBmb3IgdGhpcyBqcyBlbmdpbmUnKTtcblx0ICAgIH07XG5cdH1cblxuXHRleHBvcnRzLmtleXMgPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIGlmKE9iamVjdC5wcm90b3R5cGUua2V5cykge1xuXHQgICAgICAgIHJldHVybiBvYmoua2V5cygpO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgdmFyIGtleXMgPSBbXTtcblx0ICAgICAgICBmb3IodmFyIGsgaW4gb2JqKSB7XG5cdCAgICAgICAgICAgIGlmKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHQgICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBrZXlzO1xuXHQgICAgfVxuXHR9O1xuXG5cdGV4cG9ydHMuaW5PcGVyYXRvciA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuXHQgICAgaWYgKGV4cG9ydHMuaXNBcnJheSh2YWwpKSB7XG5cdCAgICAgICAgcmV0dXJuIGV4cG9ydHMuaW5kZXhPZih2YWwsIGtleSkgIT09IC0xO1xuXHQgICAgfSBlbHNlIGlmIChleHBvcnRzLmlzT2JqZWN0KHZhbCkpIHtcblx0ICAgICAgICByZXR1cm4ga2V5IGluIHZhbDtcblx0ICAgIH0gZWxzZSBpZiAoZXhwb3J0cy5pc1N0cmluZyh2YWwpKSB7XG5cdCAgICAgICAgcmV0dXJuIHZhbC5pbmRleE9mKGtleSkgIT09IC0xO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB1c2UgXCJpblwiIG9wZXJhdG9yIHRvIHNlYXJjaCBmb3IgXCInXG5cdCAgICAgICAgICAgICsga2V5ICsgJ1wiIGluIHVuZXhwZWN0ZWQgdHlwZXMuJyk7XG5cdCAgICB9XG5cdH07XG5cblxuLyoqKi8gfSksXG4vKiAyICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBwYXRoID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIGFzYXAgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDQpO1xuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblx0dmFyIE9iaiA9IF9fd2VicGFja19yZXF1aXJlX18oNik7XG5cdHZhciBjb21waWxlciA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBidWlsdGluX2ZpbHRlcnMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDcpO1xuXHR2YXIgYnVpbHRpbl9sb2FkZXJzID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIHJ1bnRpbWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDgpO1xuXHR2YXIgZ2xvYmFscyA9IF9fd2VicGFja19yZXF1aXJlX18oOSk7XG5cdHZhciB3YXRlcmZhbGwgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEwKTtcblx0dmFyIEZyYW1lID0gcnVudGltZS5GcmFtZTtcblx0dmFyIFRlbXBsYXRlO1xuXG5cdC8vIFVuY29uZGl0aW9uYWxseSBsb2FkIGluIHRoaXMgbG9hZGVyLCBldmVuIGlmIG5vIG90aGVyIG9uZXMgYXJlXG5cdC8vIGluY2x1ZGVkIChwb3NzaWJsZSBpbiB0aGUgc2xpbSBicm93c2VyIGJ1aWxkKVxuXHRidWlsdGluX2xvYWRlcnMuUHJlY29tcGlsZWRMb2FkZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDE0KTtcblxuXHQvLyBJZiB0aGUgdXNlciBpcyB1c2luZyB0aGUgYXN5bmMgQVBJLCAqYWx3YXlzKiBjYWxsIGl0XG5cdC8vIGFzeW5jaHJvbm91c2x5IGV2ZW4gaWYgdGhlIHRlbXBsYXRlIHdhcyBzeW5jaHJvbm91cy5cblx0ZnVuY3Rpb24gY2FsbGJhY2tBc2FwKGNiLCBlcnIsIHJlcykge1xuXHQgICAgYXNhcChmdW5jdGlvbigpIHsgY2IoZXJyLCByZXMpOyB9KTtcblx0fVxuXG5cdHZhciBFbnZpcm9ubWVudCA9IE9iai5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24obG9hZGVycywgb3B0cykge1xuXHQgICAgICAgIC8vIFRoZSBkZXYgZmxhZyBkZXRlcm1pbmVzIHRoZSB0cmFjZSB0aGF0J2xsIGJlIHNob3duIG9uIGVycm9ycy5cblx0ICAgICAgICAvLyBJZiBzZXQgdG8gdHJ1ZSwgcmV0dXJucyB0aGUgZnVsbCB0cmFjZSBmcm9tIHRoZSBlcnJvciBwb2ludCxcblx0ICAgICAgICAvLyBvdGhlcndpc2Ugd2lsbCByZXR1cm4gdHJhY2Ugc3RhcnRpbmcgZnJvbSBUZW1wbGF0ZS5yZW5kZXJcblx0ICAgICAgICAvLyAodGhlIGZ1bGwgdHJhY2UgZnJvbSB3aXRoaW4gbnVuanVja3MgbWF5IGNvbmZ1c2UgZGV2ZWxvcGVycyB1c2luZ1xuXHQgICAgICAgIC8vICB0aGUgbGlicmFyeSlcblx0ICAgICAgICAvLyBkZWZhdWx0cyB0byBmYWxzZVxuXHQgICAgICAgIG9wdHMgPSB0aGlzLm9wdHMgPSBvcHRzIHx8IHt9O1xuXHQgICAgICAgIHRoaXMub3B0cy5kZXYgPSAhIW9wdHMuZGV2O1xuXG5cdCAgICAgICAgLy8gVGhlIGF1dG9lc2NhcGUgZmxhZyBzZXRzIGdsb2JhbCBhdXRvZXNjYXBpbmcuIElmIHRydWUsXG5cdCAgICAgICAgLy8gZXZlcnkgc3RyaW5nIHZhcmlhYmxlIHdpbGwgYmUgZXNjYXBlZCBieSBkZWZhdWx0LlxuXHQgICAgICAgIC8vIElmIGZhbHNlLCBzdHJpbmdzIGNhbiBiZSBtYW51YWxseSBlc2NhcGVkIHVzaW5nIHRoZSBgZXNjYXBlYCBmaWx0ZXIuXG5cdCAgICAgICAgLy8gZGVmYXVsdHMgdG8gdHJ1ZVxuXHQgICAgICAgIHRoaXMub3B0cy5hdXRvZXNjYXBlID0gb3B0cy5hdXRvZXNjYXBlICE9IG51bGwgPyBvcHRzLmF1dG9lc2NhcGUgOiB0cnVlO1xuXG5cdCAgICAgICAgLy8gSWYgdHJ1ZSwgdGhpcyB3aWxsIG1ha2UgdGhlIHN5c3RlbSB0aHJvdyBlcnJvcnMgaWYgdHJ5aW5nXG5cdCAgICAgICAgLy8gdG8gb3V0cHV0IGEgbnVsbCBvciB1bmRlZmluZWQgdmFsdWVcblx0ICAgICAgICB0aGlzLm9wdHMudGhyb3dPblVuZGVmaW5lZCA9ICEhb3B0cy50aHJvd09uVW5kZWZpbmVkO1xuXHQgICAgICAgIHRoaXMub3B0cy50cmltQmxvY2tzID0gISFvcHRzLnRyaW1CbG9ja3M7XG5cdCAgICAgICAgdGhpcy5vcHRzLmxzdHJpcEJsb2NrcyA9ICEhb3B0cy5sc3RyaXBCbG9ja3M7XG5cblx0ICAgICAgICB0aGlzLmxvYWRlcnMgPSBbXTtcblxuXHQgICAgICAgIGlmKCFsb2FkZXJzKSB7XG5cdCAgICAgICAgICAgIC8vIFRoZSBmaWxlc3lzdGVtIGxvYWRlciBpcyBvbmx5IGF2YWlsYWJsZSBzZXJ2ZXItc2lkZVxuXHQgICAgICAgICAgICBpZihidWlsdGluX2xvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcikge1xuXHQgICAgICAgICAgICAgICAgdGhpcy5sb2FkZXJzID0gW25ldyBidWlsdGluX2xvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcigndmlld3MnKV07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZihidWlsdGluX2xvYWRlcnMuV2ViTG9hZGVyKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBbbmV3IGJ1aWx0aW5fbG9hZGVycy5XZWJMb2FkZXIoJy92aWV3cycpXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdGhpcy5sb2FkZXJzID0gbGliLmlzQXJyYXkobG9hZGVycykgPyBsb2FkZXJzIDogW2xvYWRlcnNdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIEl0J3MgZWFzeSB0byB1c2UgcHJlY29tcGlsZWQgdGVtcGxhdGVzOiBqdXN0IGluY2x1ZGUgdGhlbVxuXHQgICAgICAgIC8vIGJlZm9yZSB5b3UgY29uZmlndXJlIG51bmp1Y2tzIGFuZCB0aGlzIHdpbGwgYXV0b21hdGljYWxseVxuXHQgICAgICAgIC8vIHBpY2sgaXQgdXAgYW5kIHVzZSBpdFxuXHQgICAgICAgIGlmKCh0cnVlKSAmJiB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCkge1xuXHQgICAgICAgICAgICB0aGlzLmxvYWRlcnMudW5zaGlmdChcblx0ICAgICAgICAgICAgICAgIG5ldyBidWlsdGluX2xvYWRlcnMuUHJlY29tcGlsZWRMb2FkZXIod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQpXG5cdCAgICAgICAgICAgICk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5pbml0Q2FjaGUoKTtcblxuXHQgICAgICAgIHRoaXMuZ2xvYmFscyA9IGdsb2JhbHMoKTtcblx0ICAgICAgICB0aGlzLmZpbHRlcnMgPSB7fTtcblx0ICAgICAgICB0aGlzLmFzeW5jRmlsdGVycyA9IFtdO1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9ucyA9IHt9O1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9uc0xpc3QgPSBbXTtcblxuXHQgICAgICAgIGZvcih2YXIgbmFtZSBpbiBidWlsdGluX2ZpbHRlcnMpIHtcblx0ICAgICAgICAgICAgdGhpcy5hZGRGaWx0ZXIobmFtZSwgYnVpbHRpbl9maWx0ZXJzW25hbWVdKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBpbml0Q2FjaGU6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIC8vIENhY2hpbmcgYW5kIGNhY2hlIGJ1c3Rpbmdcblx0ICAgICAgICBsaWIuZWFjaCh0aGlzLmxvYWRlcnMsIGZ1bmN0aW9uKGxvYWRlcikge1xuXHQgICAgICAgICAgICBsb2FkZXIuY2FjaGUgPSB7fTtcblxuXHQgICAgICAgICAgICBpZih0eXBlb2YgbG9hZGVyLm9uID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgICAgICBsb2FkZXIub24oJ3VwZGF0ZScsIGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbG9hZGVyLmNhY2hlW3RlbXBsYXRlXSA9IG51bGw7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXHQgICAgfSxcblxuXHQgICAgYWRkRXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lLCBleHRlbnNpb24pIHtcblx0ICAgICAgICBleHRlbnNpb24uX25hbWUgPSBuYW1lO1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9uc1tuYW1lXSA9IGV4dGVuc2lvbjtcblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnNMaXN0LnB1c2goZXh0ZW5zaW9uKTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIHJlbW92ZUV4dGVuc2lvbjogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHZhciBleHRlbnNpb24gPSB0aGlzLmdldEV4dGVuc2lvbihuYW1lKTtcblx0ICAgICAgICBpZiAoIWV4dGVuc2lvbikgcmV0dXJuO1xuXG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zTGlzdCA9IGxpYi53aXRob3V0KHRoaXMuZXh0ZW5zaW9uc0xpc3QsIGV4dGVuc2lvbik7XG5cdCAgICAgICAgZGVsZXRlIHRoaXMuZXh0ZW5zaW9uc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGdldEV4dGVuc2lvbjogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLmV4dGVuc2lvbnNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICBoYXNFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICByZXR1cm4gISF0aGlzLmV4dGVuc2lvbnNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICBhZGRHbG9iYWw6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG5cdCAgICAgICAgdGhpcy5nbG9iYWxzW25hbWVdID0gdmFsdWU7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRHbG9iYWw6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZih0eXBlb2YgdGhpcy5nbG9iYWxzW25hbWVdID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2dsb2JhbCBub3QgZm91bmQ6ICcgKyBuYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuZ2xvYmFsc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEZpbHRlcjogZnVuY3Rpb24obmFtZSwgZnVuYywgYXN5bmMpIHtcblx0ICAgICAgICB2YXIgd3JhcHBlZCA9IGZ1bmM7XG5cblx0ICAgICAgICBpZihhc3luYykge1xuXHQgICAgICAgICAgICB0aGlzLmFzeW5jRmlsdGVycy5wdXNoKG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICB0aGlzLmZpbHRlcnNbbmFtZV0gPSB3cmFwcGVkO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0RmlsdGVyOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgaWYoIXRoaXMuZmlsdGVyc1tuYW1lXSkge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZpbHRlciBub3QgZm91bmQ6ICcgKyBuYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIHJlc29sdmVUZW1wbGF0ZTogZnVuY3Rpb24obG9hZGVyLCBwYXJlbnROYW1lLCBmaWxlbmFtZSkge1xuXHQgICAgICAgIHZhciBpc1JlbGF0aXZlID0gKGxvYWRlci5pc1JlbGF0aXZlICYmIHBhcmVudE5hbWUpPyBsb2FkZXIuaXNSZWxhdGl2ZShmaWxlbmFtZSkgOiBmYWxzZTtcblx0ICAgICAgICByZXR1cm4gKGlzUmVsYXRpdmUgJiYgbG9hZGVyLnJlc29sdmUpPyBsb2FkZXIucmVzb2x2ZShwYXJlbnROYW1lLCBmaWxlbmFtZSkgOiBmaWxlbmFtZTtcblx0ICAgIH0sXG5cblx0ICAgIGdldFRlbXBsYXRlOiBmdW5jdGlvbihuYW1lLCBlYWdlckNvbXBpbGUsIHBhcmVudE5hbWUsIGlnbm9yZU1pc3NpbmcsIGNiKSB7XG5cdCAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXHQgICAgICAgIHZhciB0bXBsID0gbnVsbDtcblx0ICAgICAgICBpZihuYW1lICYmIG5hbWUucmF3KSB7XG5cdCAgICAgICAgICAgIC8vIHRoaXMgZml4ZXMgYXV0b2VzY2FwZSBmb3IgdGVtcGxhdGVzIHJlZmVyZW5jZWQgaW4gc3ltYm9sc1xuXHQgICAgICAgICAgICBuYW1lID0gbmFtZS5yYXc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYobGliLmlzRnVuY3Rpb24ocGFyZW50TmFtZSkpIHtcblx0ICAgICAgICAgICAgY2IgPSBwYXJlbnROYW1lO1xuXHQgICAgICAgICAgICBwYXJlbnROYW1lID0gbnVsbDtcblx0ICAgICAgICAgICAgZWFnZXJDb21waWxlID0gZWFnZXJDb21waWxlIHx8IGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKGVhZ2VyQ29tcGlsZSkpIHtcblx0ICAgICAgICAgICAgY2IgPSBlYWdlckNvbXBpbGU7XG5cdCAgICAgICAgICAgIGVhZ2VyQ29tcGlsZSA9IGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChuYW1lIGluc3RhbmNlb2YgVGVtcGxhdGUpIHtcblx0ICAgICAgICAgICAgIHRtcGwgPSBuYW1lO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RlbXBsYXRlIG5hbWVzIG11c3QgYmUgYSBzdHJpbmc6ICcgKyBuYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sb2FkZXJzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgX25hbWUgPSB0aGlzLnJlc29sdmVUZW1wbGF0ZSh0aGlzLmxvYWRlcnNbaV0sIHBhcmVudE5hbWUsIG5hbWUpO1xuXHQgICAgICAgICAgICAgICAgdG1wbCA9IHRoaXMubG9hZGVyc1tpXS5jYWNoZVtfbmFtZV07XG5cdCAgICAgICAgICAgICAgICBpZiAodG1wbCkgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZih0bXBsKSB7XG5cdCAgICAgICAgICAgIGlmKGVhZ2VyQ29tcGlsZSkge1xuXHQgICAgICAgICAgICAgICAgdG1wbC5jb21waWxlKCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZihjYikge1xuXHQgICAgICAgICAgICAgICAgY2IobnVsbCwgdG1wbCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdG1wbDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBzeW5jUmVzdWx0O1xuXHQgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdCAgICAgICAgICAgIHZhciBjcmVhdGVUZW1wbGF0ZSA9IGZ1bmN0aW9uKGVyciwgaW5mbykge1xuXHQgICAgICAgICAgICAgICAgaWYoIWluZm8gJiYgIWVycikge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKCFpZ25vcmVNaXNzaW5nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVyciA9IG5ldyBFcnJvcigndGVtcGxhdGUgbm90IGZvdW5kOiAnICsgbmFtZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoY2IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2IoZXJyKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgdG1wbDtcblx0ICAgICAgICAgICAgICAgICAgICBpZihpbmZvKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRtcGwgPSBuZXcgVGVtcGxhdGUoaW5mby5zcmMsIF90aGlzLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucGF0aCwgZWFnZXJDb21waWxlKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZighaW5mby5ub0NhY2hlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmxvYWRlci5jYWNoZVtuYW1lXSA9IHRtcGw7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRtcGwgPSBuZXcgVGVtcGxhdGUoJycsIF90aGlzLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcnLCBlYWdlckNvbXBpbGUpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIGlmKGNiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNiKG51bGwsIHRtcGwpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHRtcGw7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgIGxpYi5hc3luY0l0ZXIodGhpcy5sb2FkZXJzLCBmdW5jdGlvbihsb2FkZXIsIGksIG5leHQsIGRvbmUpIHtcblx0ICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZShlcnIsIHNyYykge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGVycikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBkb25lKGVycik7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYoc3JjKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNyYy5sb2FkZXIgPSBsb2FkZXI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUobnVsbCwgc3JjKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIG5leHQoKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8vIFJlc29sdmUgbmFtZSByZWxhdGl2ZSB0byBwYXJlbnROYW1lXG5cdCAgICAgICAgICAgICAgICBuYW1lID0gdGhhdC5yZXNvbHZlVGVtcGxhdGUobG9hZGVyLCBwYXJlbnROYW1lLCBuYW1lKTtcblxuXHQgICAgICAgICAgICAgICAgaWYobG9hZGVyLmFzeW5jKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbG9hZGVyLmdldFNvdXJjZShuYW1lLCBoYW5kbGUpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaGFuZGxlKG51bGwsIGxvYWRlci5nZXRTb3VyY2UobmFtZSkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9LCBjcmVhdGVUZW1wbGF0ZSk7XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHN5bmNSZXN1bHQ7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgZXhwcmVzczogZnVuY3Rpb24oYXBwKSB7XG5cdCAgICAgICAgdmFyIGVudiA9IHRoaXM7XG5cblx0ICAgICAgICBmdW5jdGlvbiBOdW5qdWNrc1ZpZXcobmFtZSwgb3B0cykge1xuXHQgICAgICAgICAgICB0aGlzLm5hbWUgICAgICAgICAgPSBuYW1lO1xuXHQgICAgICAgICAgICB0aGlzLnBhdGggICAgICAgICAgPSBuYW1lO1xuXHQgICAgICAgICAgICB0aGlzLmRlZmF1bHRFbmdpbmUgPSBvcHRzLmRlZmF1bHRFbmdpbmU7XG5cdCAgICAgICAgICAgIHRoaXMuZXh0ICAgICAgICAgICA9IHBhdGguZXh0bmFtZShuYW1lKTtcblx0ICAgICAgICAgICAgaWYgKCF0aGlzLmV4dCAmJiAhdGhpcy5kZWZhdWx0RW5naW5lKSB0aHJvdyBuZXcgRXJyb3IoJ05vIGRlZmF1bHQgZW5naW5lIHdhcyBzcGVjaWZpZWQgYW5kIG5vIGV4dGVuc2lvbiB3YXMgcHJvdmlkZWQuJyk7XG5cdCAgICAgICAgICAgIGlmICghdGhpcy5leHQpIHRoaXMubmFtZSArPSAodGhpcy5leHQgPSAoJy4nICE9PSB0aGlzLmRlZmF1bHRFbmdpbmVbMF0gPyAnLicgOiAnJykgKyB0aGlzLmRlZmF1bHRFbmdpbmUpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIE51bmp1Y2tzVmlldy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24ob3B0cywgY2IpIHtcblx0ICAgICAgICAgIGVudi5yZW5kZXIodGhpcy5uYW1lLCBvcHRzLCBjYik7XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIGFwcC5zZXQoJ3ZpZXcnLCBOdW5qdWNrc1ZpZXcpO1xuXHQgICAgICAgIGFwcC5zZXQoJ251bmp1Y2tzRW52JywgdGhpcyk7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICByZW5kZXI6IGZ1bmN0aW9uKG5hbWUsIGN0eCwgY2IpIHtcblx0ICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihjdHgpKSB7XG5cdCAgICAgICAgICAgIGNiID0gY3R4O1xuXHQgICAgICAgICAgICBjdHggPSBudWxsO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIFdlIHN1cHBvcnQgYSBzeW5jaHJvbm91cyBBUEkgdG8gbWFrZSBpdCBlYXNpZXIgdG8gbWlncmF0ZVxuXHQgICAgICAgIC8vIGV4aXN0aW5nIGNvZGUgdG8gYXN5bmMuIFRoaXMgd29ya3MgYmVjYXVzZSBpZiB5b3UgZG9uJ3QgZG9cblx0ICAgICAgICAvLyBhbnl0aGluZyBhc3luYyB3b3JrLCB0aGUgd2hvbGUgdGhpbmcgaXMgYWN0dWFsbHkgcnVuXG5cdCAgICAgICAgLy8gc3luY2hyb25vdXNseS5cblx0ICAgICAgICB2YXIgc3luY1Jlc3VsdCA9IG51bGw7XG5cblx0ICAgICAgICB0aGlzLmdldFRlbXBsYXRlKG5hbWUsIGZ1bmN0aW9uKGVyciwgdG1wbCkge1xuXHQgICAgICAgICAgICBpZihlcnIgJiYgY2IpIHtcblx0ICAgICAgICAgICAgICAgIGNhbGxiYWNrQXNhcChjYiwgZXJyKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKGVycikge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHRtcGwucmVuZGVyKGN0eCwgY2IpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcblx0ICAgIH0sXG5cblx0ICAgIHJlbmRlclN0cmluZzogZnVuY3Rpb24oc3JjLCBjdHgsIG9wdHMsIGNiKSB7XG5cdCAgICAgICAgaWYobGliLmlzRnVuY3Rpb24ob3B0cykpIHtcblx0ICAgICAgICAgICAgY2IgPSBvcHRzO1xuXHQgICAgICAgICAgICBvcHRzID0ge307XG5cdCAgICAgICAgfVxuXHQgICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG5cdCAgICAgICAgdmFyIHRtcGwgPSBuZXcgVGVtcGxhdGUoc3JjLCB0aGlzLCBvcHRzLnBhdGgpO1xuXHQgICAgICAgIHJldHVybiB0bXBsLnJlbmRlcihjdHgsIGNiKTtcblx0ICAgIH0sXG5cblx0ICAgIHdhdGVyZmFsbDogd2F0ZXJmYWxsXG5cdH0pO1xuXG5cdHZhciBDb250ZXh0ID0gT2JqLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbihjdHgsIGJsb2NrcywgZW52KSB7XG5cdCAgICAgICAgLy8gSGFzIHRvIGJlIHRpZWQgdG8gYW4gZW52aXJvbm1lbnQgc28gd2UgY2FuIHRhcCBpbnRvIGl0cyBnbG9iYWxzLlxuXHQgICAgICAgIHRoaXMuZW52ID0gZW52IHx8IG5ldyBFbnZpcm9ubWVudCgpO1xuXG5cdCAgICAgICAgLy8gTWFrZSBhIGR1cGxpY2F0ZSBvZiBjdHhcblx0ICAgICAgICB0aGlzLmN0eCA9IHt9O1xuXHQgICAgICAgIGZvcih2YXIgayBpbiBjdHgpIHtcblx0ICAgICAgICAgICAgaWYoY3R4Lmhhc093blByb3BlcnR5KGspKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLmN0eFtrXSA9IGN0eFtrXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMuYmxvY2tzID0ge307XG5cdCAgICAgICAgdGhpcy5leHBvcnRlZCA9IFtdO1xuXG5cdCAgICAgICAgZm9yKHZhciBuYW1lIGluIGJsb2Nrcykge1xuXHQgICAgICAgICAgICB0aGlzLmFkZEJsb2NrKG5hbWUsIGJsb2Nrc1tuYW1lXSk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgbG9va3VwOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgLy8gVGhpcyBpcyBvbmUgb2YgdGhlIG1vc3QgY2FsbGVkIGZ1bmN0aW9ucywgc28gb3B0aW1pemUgZm9yXG5cdCAgICAgICAgLy8gdGhlIHR5cGljYWwgY2FzZSB3aGVyZSB0aGUgbmFtZSBpc24ndCBpbiB0aGUgZ2xvYmFsc1xuXHQgICAgICAgIGlmKG5hbWUgaW4gdGhpcy5lbnYuZ2xvYmFscyAmJiAhKG5hbWUgaW4gdGhpcy5jdHgpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLmVudi5nbG9iYWxzW25hbWVdO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3R4W25hbWVdO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIHNldFZhcmlhYmxlOiBmdW5jdGlvbihuYW1lLCB2YWwpIHtcblx0ICAgICAgICB0aGlzLmN0eFtuYW1lXSA9IHZhbDtcblx0ICAgIH0sXG5cblx0ICAgIGdldFZhcmlhYmxlczogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuY3R4O1xuXHQgICAgfSxcblxuXHQgICAgYWRkQmxvY2s6IGZ1bmN0aW9uKG5hbWUsIGJsb2NrKSB7XG5cdCAgICAgICAgdGhpcy5ibG9ja3NbbmFtZV0gPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXTtcblx0ICAgICAgICB0aGlzLmJsb2Nrc1tuYW1lXS5wdXNoKGJsb2NrKTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIGdldEJsb2NrOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgaWYoIXRoaXMuYmxvY2tzW25hbWVdKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndW5rbm93biBibG9jayBcIicgKyBuYW1lICsgJ1wiJyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tzW25hbWVdWzBdO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0U3VwZXI6IGZ1bmN0aW9uKGVudiwgbmFtZSwgYmxvY2ssIGZyYW1lLCBydW50aW1lLCBjYikge1xuXHQgICAgICAgIHZhciBpZHggPSBsaWIuaW5kZXhPZih0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXSwgYmxvY2spO1xuXHQgICAgICAgIHZhciBibGsgPSB0aGlzLmJsb2Nrc1tuYW1lXVtpZHggKyAxXTtcblx0ICAgICAgICB2YXIgY29udGV4dCA9IHRoaXM7XG5cblx0ICAgICAgICBpZihpZHggPT09IC0xIHx8ICFibGspIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBzdXBlciBibG9jayBhdmFpbGFibGUgZm9yIFwiJyArIG5hbWUgKyAnXCInKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBibGsoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xuXHQgICAgfSxcblxuXHQgICAgYWRkRXhwb3J0OiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdGhpcy5leHBvcnRlZC5wdXNoKG5hbWUpO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0RXhwb3J0ZWQ6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciBleHBvcnRlZCA9IHt9O1xuXHQgICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMuZXhwb3J0ZWQubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgdmFyIG5hbWUgPSB0aGlzLmV4cG9ydGVkW2ldO1xuXHQgICAgICAgICAgICBleHBvcnRlZFtuYW1lXSA9IHRoaXMuY3R4W25hbWVdO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gZXhwb3J0ZWQ7XG5cdCAgICB9XG5cdH0pO1xuXG5cdFRlbXBsYXRlID0gT2JqLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbiAoc3JjLCBlbnYsIHBhdGgsIGVhZ2VyQ29tcGlsZSkge1xuXHQgICAgICAgIHRoaXMuZW52ID0gZW52IHx8IG5ldyBFbnZpcm9ubWVudCgpO1xuXG5cdCAgICAgICAgaWYobGliLmlzT2JqZWN0KHNyYykpIHtcblx0ICAgICAgICAgICAgc3dpdGNoKHNyYy50eXBlKSB7XG5cdCAgICAgICAgICAgIGNhc2UgJ2NvZGUnOiB0aGlzLnRtcGxQcm9wcyA9IHNyYy5vYmo7IGJyZWFrO1xuXHQgICAgICAgICAgICBjYXNlICdzdHJpbmcnOiB0aGlzLnRtcGxTdHIgPSBzcmMub2JqOyBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKGxpYi5pc1N0cmluZyhzcmMpKSB7XG5cdCAgICAgICAgICAgIHRoaXMudG1wbFN0ciA9IHNyYztcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc3JjIG11c3QgYmUgYSBzdHJpbmcgb3IgYW4gb2JqZWN0IGRlc2NyaWJpbmcgJyArXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGhlIHNvdXJjZScpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMucGF0aCA9IHBhdGg7XG5cblx0ICAgICAgICBpZihlYWdlckNvbXBpbGUpIHtcblx0ICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblx0ICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgIF90aGlzLl9jb21waWxlKCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgY2F0Y2goZXJyKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBsaWIucHJldHRpZnlFcnJvcih0aGlzLnBhdGgsIHRoaXMuZW52Lm9wdHMuZGV2LCBlcnIpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB0aGlzLmNvbXBpbGVkID0gZmFsc2U7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgsIHBhcmVudEZyYW1lLCBjYikge1xuXHQgICAgICAgIGlmICh0eXBlb2YgY3R4ID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIGNiID0gY3R4O1xuXHQgICAgICAgICAgICBjdHggPSB7fTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZiAodHlwZW9mIHBhcmVudEZyYW1lID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIGNiID0gcGFyZW50RnJhbWU7XG5cdCAgICAgICAgICAgIHBhcmVudEZyYW1lID0gbnVsbDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgZm9yY2VBc3luYyA9IHRydWU7XG5cdCAgICAgICAgaWYocGFyZW50RnJhbWUpIHtcblx0ICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBmcmFtZSwgd2UgYXJlIGJlaW5nIGNhbGxlZCBmcm9tIGludGVybmFsXG5cdCAgICAgICAgICAgIC8vIGNvZGUgb2YgYW5vdGhlciB0ZW1wbGF0ZSwgYW5kIHRoZSBpbnRlcm5hbCBzeXN0ZW1cblx0ICAgICAgICAgICAgLy8gZGVwZW5kcyBvbiB0aGUgc3luYy9hc3luYyBuYXR1cmUgb2YgdGhlIHBhcmVudCB0ZW1wbGF0ZVxuXHQgICAgICAgICAgICAvLyB0byBiZSBpbmhlcml0ZWQsIHNvIGZvcmNlIGFuIGFzeW5jIGNhbGxiYWNrXG5cdCAgICAgICAgICAgIGZvcmNlQXN5bmMgPSBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXHQgICAgICAgIC8vIENhdGNoIGNvbXBpbGUgZXJyb3JzIGZvciBhc3luYyByZW5kZXJpbmdcblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICBfdGhpcy5jb21waWxlKCk7XG5cdCAgICAgICAgfSBjYXRjaCAoX2Vycikge1xuXHQgICAgICAgICAgICB2YXIgZXJyID0gbGliLnByZXR0aWZ5RXJyb3IodGhpcy5wYXRoLCB0aGlzLmVudi5vcHRzLmRldiwgX2Vycik7XG5cdCAgICAgICAgICAgIGlmIChjYikgcmV0dXJuIGNhbGxiYWNrQXNhcChjYiwgZXJyKTtcblx0ICAgICAgICAgICAgZWxzZSB0aHJvdyBlcnI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dChjdHggfHwge30sIF90aGlzLmJsb2NrcywgX3RoaXMuZW52KTtcblx0ICAgICAgICB2YXIgZnJhbWUgPSBwYXJlbnRGcmFtZSA/IHBhcmVudEZyYW1lLnB1c2godHJ1ZSkgOiBuZXcgRnJhbWUoKTtcblx0ICAgICAgICBmcmFtZS50b3BMZXZlbCA9IHRydWU7XG5cdCAgICAgICAgdmFyIHN5bmNSZXN1bHQgPSBudWxsO1xuXG5cdCAgICAgICAgX3RoaXMucm9vdFJlbmRlckZ1bmMoXG5cdCAgICAgICAgICAgIF90aGlzLmVudixcblx0ICAgICAgICAgICAgY29udGV4dCxcblx0ICAgICAgICAgICAgZnJhbWUgfHwgbmV3IEZyYW1lKCksXG5cdCAgICAgICAgICAgIHJ1bnRpbWUsXG5cdCAgICAgICAgICAgIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG5cdCAgICAgICAgICAgICAgICBpZihlcnIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBlcnIgPSBsaWIucHJldHRpZnlFcnJvcihfdGhpcy5wYXRoLCBfdGhpcy5lbnYub3B0cy5kZXYsIGVycik7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIGlmKGNiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoZm9yY2VBc3luYykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja0FzYXAoY2IsIGVyciwgcmVzKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNiKGVyciwgcmVzKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZihlcnIpIHsgdGhyb3cgZXJyOyB9XG5cdCAgICAgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHJlcztcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICk7XG5cblx0ICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcblx0ICAgIH0sXG5cblxuXHQgICAgZ2V0RXhwb3J0ZWQ6IGZ1bmN0aW9uKGN0eCwgcGFyZW50RnJhbWUsIGNiKSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBjdHggPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBjdHg7XG5cdCAgICAgICAgICAgIGN0eCA9IHt9O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmICh0eXBlb2YgcGFyZW50RnJhbWUgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBwYXJlbnRGcmFtZTtcblx0ICAgICAgICAgICAgcGFyZW50RnJhbWUgPSBudWxsO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIENhdGNoIGNvbXBpbGUgZXJyb3JzIGZvciBhc3luYyByZW5kZXJpbmdcblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICB0aGlzLmNvbXBpbGUoKTtcblx0ICAgICAgICB9IGNhdGNoIChlKSB7XG5cdCAgICAgICAgICAgIGlmIChjYikgcmV0dXJuIGNiKGUpO1xuXHQgICAgICAgICAgICBlbHNlIHRocm93IGU7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGZyYW1lID0gcGFyZW50RnJhbWUgPyBwYXJlbnRGcmFtZS5wdXNoKCkgOiBuZXcgRnJhbWUoKTtcblx0ICAgICAgICBmcmFtZS50b3BMZXZlbCA9IHRydWU7XG5cblx0ICAgICAgICAvLyBSdW4gdGhlIHJvb3RSZW5kZXJGdW5jIHRvIHBvcHVsYXRlIHRoZSBjb250ZXh0IHdpdGggZXhwb3J0ZWQgdmFyc1xuXHQgICAgICAgIHZhciBjb250ZXh0ID0gbmV3IENvbnRleHQoY3R4IHx8IHt9LCB0aGlzLmJsb2NrcywgdGhpcy5lbnYpO1xuXHQgICAgICAgIHRoaXMucm9vdFJlbmRlckZ1bmModGhpcy5lbnYsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyKSB7XG5cdCAgICAgICAgXHRcdCAgICAgICAgaWYgKCBlcnIgKSB7XG5cdCAgICAgICAgXHRcdFx0ICAgIGNiKGVyciwgbnVsbCk7XG5cdCAgICAgICAgXHRcdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBcdFx0XHQgICAgY2IobnVsbCwgY29udGV4dC5nZXRFeHBvcnRlZCgpKTtcblx0ICAgICAgICBcdFx0ICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgIH0sXG5cblx0ICAgIGNvbXBpbGU6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmKCF0aGlzLmNvbXBpbGVkKSB7XG5cdCAgICAgICAgICAgIHRoaXMuX2NvbXBpbGUoKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBfY29tcGlsZTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIHByb3BzO1xuXG5cdCAgICAgICAgaWYodGhpcy50bXBsUHJvcHMpIHtcblx0ICAgICAgICAgICAgcHJvcHMgPSB0aGlzLnRtcGxQcm9wcztcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBzb3VyY2UgPSBjb21waWxlci5jb21waWxlKHRoaXMudG1wbFN0cixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnYuYXN5bmNGaWx0ZXJzLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5leHRlbnNpb25zTGlzdCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXRoLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5vcHRzKTtcblxuXHQgICAgICAgICAgICAvKiBqc2xpbnQgZXZpbDogdHJ1ZSAqL1xuXHQgICAgICAgICAgICB2YXIgZnVuYyA9IG5ldyBGdW5jdGlvbihzb3VyY2UpO1xuXHQgICAgICAgICAgICBwcm9wcyA9IGZ1bmMoKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLmJsb2NrcyA9IHRoaXMuX2dldEJsb2Nrcyhwcm9wcyk7XG5cdCAgICAgICAgdGhpcy5yb290UmVuZGVyRnVuYyA9IHByb3BzLnJvb3Q7XG5cdCAgICAgICAgdGhpcy5jb21waWxlZCA9IHRydWU7XG5cdCAgICB9LFxuXG5cdCAgICBfZ2V0QmxvY2tzOiBmdW5jdGlvbihwcm9wcykge1xuXHQgICAgICAgIHZhciBibG9ja3MgPSB7fTtcblxuXHQgICAgICAgIGZvcih2YXIgayBpbiBwcm9wcykge1xuXHQgICAgICAgICAgICBpZihrLnNsaWNlKDAsIDIpID09PSAnYl8nKSB7XG5cdCAgICAgICAgICAgICAgICBibG9ja3Nbay5zbGljZSgyKV0gPSBwcm9wc1trXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBibG9ja3M7XG5cdCAgICB9XG5cdH0pO1xuXG5cdG1vZHVsZS5leHBvcnRzID0ge1xuXHQgICAgRW52aXJvbm1lbnQ6IEVudmlyb25tZW50LFxuXHQgICAgVGVtcGxhdGU6IFRlbXBsYXRlXG5cdH07XG5cblxuLyoqKi8gfSksXG4vKiAzICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0XG5cbi8qKiovIH0pLFxuLyogNCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vIHJhd0FzYXAgcHJvdmlkZXMgZXZlcnl0aGluZyB3ZSBuZWVkIGV4Y2VwdCBleGNlcHRpb24gbWFuYWdlbWVudC5cblx0dmFyIHJhd0FzYXAgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDUpO1xuXHQvLyBSYXdUYXNrcyBhcmUgcmVjeWNsZWQgdG8gcmVkdWNlIEdDIGNodXJuLlxuXHR2YXIgZnJlZVRhc2tzID0gW107XG5cdC8vIFdlIHF1ZXVlIGVycm9ycyB0byBlbnN1cmUgdGhleSBhcmUgdGhyb3duIGluIHJpZ2h0IG9yZGVyIChGSUZPKS5cblx0Ly8gQXJyYXktYXMtcXVldWUgaXMgZ29vZCBlbm91Z2ggaGVyZSwgc2luY2Ugd2UgYXJlIGp1c3QgZGVhbGluZyB3aXRoIGV4Y2VwdGlvbnMuXG5cdHZhciBwZW5kaW5nRXJyb3JzID0gW107XG5cdHZhciByZXF1ZXN0RXJyb3JUaHJvdyA9IHJhd0FzYXAubWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKHRocm93Rmlyc3RFcnJvcik7XG5cblx0ZnVuY3Rpb24gdGhyb3dGaXJzdEVycm9yKCkge1xuXHQgICAgaWYgKHBlbmRpbmdFcnJvcnMubGVuZ3RoKSB7XG5cdCAgICAgICAgdGhyb3cgcGVuZGluZ0Vycm9ycy5zaGlmdCgpO1xuXHQgICAgfVxuXHR9XG5cblx0LyoqXG5cdCAqIENhbGxzIGEgdGFzayBhcyBzb29uIGFzIHBvc3NpYmxlIGFmdGVyIHJldHVybmluZywgaW4gaXRzIG93biBldmVudCwgd2l0aCBwcmlvcml0eVxuXHQgKiBvdmVyIG90aGVyIGV2ZW50cyBsaWtlIGFuaW1hdGlvbiwgcmVmbG93LCBhbmQgcmVwYWludC4gQW4gZXJyb3IgdGhyb3duIGZyb20gYW5cblx0ICogZXZlbnQgd2lsbCBub3QgaW50ZXJydXB0LCBub3IgZXZlbiBzdWJzdGFudGlhbGx5IHNsb3cgZG93biB0aGUgcHJvY2Vzc2luZyBvZlxuXHQgKiBvdGhlciBldmVudHMsIGJ1dCB3aWxsIGJlIHJhdGhlciBwb3N0cG9uZWQgdG8gYSBsb3dlciBwcmlvcml0eSBldmVudC5cblx0ICogQHBhcmFtIHt7Y2FsbH19IHRhc2sgQSBjYWxsYWJsZSBvYmplY3QsIHR5cGljYWxseSBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgbm9cblx0ICogYXJndW1lbnRzLlxuXHQgKi9cblx0bW9kdWxlLmV4cG9ydHMgPSBhc2FwO1xuXHRmdW5jdGlvbiBhc2FwKHRhc2spIHtcblx0ICAgIHZhciByYXdUYXNrO1xuXHQgICAgaWYgKGZyZWVUYXNrcy5sZW5ndGgpIHtcblx0ICAgICAgICByYXdUYXNrID0gZnJlZVRhc2tzLnBvcCgpO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICByYXdUYXNrID0gbmV3IFJhd1Rhc2soKTtcblx0ICAgIH1cblx0ICAgIHJhd1Rhc2sudGFzayA9IHRhc2s7XG5cdCAgICByYXdBc2FwKHJhd1Rhc2spO1xuXHR9XG5cblx0Ly8gV2Ugd3JhcCB0YXNrcyB3aXRoIHJlY3ljbGFibGUgdGFzayBvYmplY3RzLiAgQSB0YXNrIG9iamVjdCBpbXBsZW1lbnRzXG5cdC8vIGBjYWxsYCwganVzdCBsaWtlIGEgZnVuY3Rpb24uXG5cdGZ1bmN0aW9uIFJhd1Rhc2soKSB7XG5cdCAgICB0aGlzLnRhc2sgPSBudWxsO1xuXHR9XG5cblx0Ly8gVGhlIHNvbGUgcHVycG9zZSBvZiB3cmFwcGluZyB0aGUgdGFzayBpcyB0byBjYXRjaCB0aGUgZXhjZXB0aW9uIGFuZCByZWN5Y2xlXG5cdC8vIHRoZSB0YXNrIG9iamVjdCBhZnRlciBpdHMgc2luZ2xlIHVzZS5cblx0UmF3VGFzay5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRyeSB7XG5cdCAgICAgICAgdGhpcy50YXNrLmNhbGwoKTtcblx0ICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cdCAgICAgICAgaWYgKGFzYXAub25lcnJvcikge1xuXHQgICAgICAgICAgICAvLyBUaGlzIGhvb2sgZXhpc3RzIHB1cmVseSBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cblx0ICAgICAgICAgICAgLy8gSXRzIG5hbWUgd2lsbCBiZSBwZXJpb2RpY2FsbHkgcmFuZG9taXplZCB0byBicmVhayBhbnkgY29kZSB0aGF0XG5cdCAgICAgICAgICAgIC8vIGRlcGVuZHMgb24gaXRzIGV4aXN0ZW5jZS5cblx0ICAgICAgICAgICAgYXNhcC5vbmVycm9yKGVycm9yKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAvLyBJbiBhIHdlYiBicm93c2VyLCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuIEhvd2V2ZXIsIHRvIGF2b2lkXG5cdCAgICAgICAgICAgIC8vIHNsb3dpbmcgZG93biB0aGUgcXVldWUgb2YgcGVuZGluZyB0YXNrcywgd2UgcmV0aHJvdyB0aGUgZXJyb3IgaW4gYVxuXHQgICAgICAgICAgICAvLyBsb3dlciBwcmlvcml0eSB0dXJuLlxuXHQgICAgICAgICAgICBwZW5kaW5nRXJyb3JzLnB1c2goZXJyb3IpO1xuXHQgICAgICAgICAgICByZXF1ZXN0RXJyb3JUaHJvdygpO1xuXHQgICAgICAgIH1cblx0ICAgIH0gZmluYWxseSB7XG5cdCAgICAgICAgdGhpcy50YXNrID0gbnVsbDtcblx0ICAgICAgICBmcmVlVGFza3NbZnJlZVRhc2tzLmxlbmd0aF0gPSB0aGlzO1xuXHQgICAgfVxuXHR9O1xuXG5cbi8qKiovIH0pLFxuLyogNSAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqLyhmdW5jdGlvbihnbG9iYWwpIHtcInVzZSBzdHJpY3RcIjtcblxuXHQvLyBVc2UgdGhlIGZhc3Rlc3QgbWVhbnMgcG9zc2libGUgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gaXRzIG93biB0dXJuLCB3aXRoXG5cdC8vIHByaW9yaXR5IG92ZXIgb3RoZXIgZXZlbnRzIGluY2x1ZGluZyBJTywgYW5pbWF0aW9uLCByZWZsb3csIGFuZCByZWRyYXdcblx0Ly8gZXZlbnRzIGluIGJyb3dzZXJzLlxuXHQvL1xuXHQvLyBBbiBleGNlcHRpb24gdGhyb3duIGJ5IGEgdGFzayB3aWxsIHBlcm1hbmVudGx5IGludGVycnVwdCB0aGUgcHJvY2Vzc2luZyBvZlxuXHQvLyBzdWJzZXF1ZW50IHRhc2tzLiBUaGUgaGlnaGVyIGxldmVsIGBhc2FwYCBmdW5jdGlvbiBlbnN1cmVzIHRoYXQgaWYgYW5cblx0Ly8gZXhjZXB0aW9uIGlzIHRocm93biBieSBhIHRhc2ssIHRoYXQgdGhlIHRhc2sgcXVldWUgd2lsbCBjb250aW51ZSBmbHVzaGluZyBhc1xuXHQvLyBzb29uIGFzIHBvc3NpYmxlLCBidXQgaWYgeW91IHVzZSBgcmF3QXNhcGAgZGlyZWN0bHksIHlvdSBhcmUgcmVzcG9uc2libGUgdG9cblx0Ly8gZWl0aGVyIGVuc3VyZSB0aGF0IG5vIGV4Y2VwdGlvbnMgYXJlIHRocm93biBmcm9tIHlvdXIgdGFzaywgb3IgdG8gbWFudWFsbHlcblx0Ly8gY2FsbCBgcmF3QXNhcC5yZXF1ZXN0Rmx1c2hgIGlmIGFuIGV4Y2VwdGlvbiBpcyB0aHJvd24uXG5cdG1vZHVsZS5leHBvcnRzID0gcmF3QXNhcDtcblx0ZnVuY3Rpb24gcmF3QXNhcCh0YXNrKSB7XG5cdCAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuXHQgICAgICAgIHJlcXVlc3RGbHVzaCgpO1xuXHQgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIC8vIEVxdWl2YWxlbnQgdG8gcHVzaCwgYnV0IGF2b2lkcyBhIGZ1bmN0aW9uIGNhbGwuXG5cdCAgICBxdWV1ZVtxdWV1ZS5sZW5ndGhdID0gdGFzaztcblx0fVxuXG5cdHZhciBxdWV1ZSA9IFtdO1xuXHQvLyBPbmNlIGEgZmx1c2ggaGFzIGJlZW4gcmVxdWVzdGVkLCBubyBmdXJ0aGVyIGNhbGxzIHRvIGByZXF1ZXN0Rmx1c2hgIGFyZVxuXHQvLyBuZWNlc3NhcnkgdW50aWwgdGhlIG5leHQgYGZsdXNoYCBjb21wbGV0ZXMuXG5cdHZhciBmbHVzaGluZyA9IGZhbHNlO1xuXHQvLyBgcmVxdWVzdEZsdXNoYCBpcyBhbiBpbXBsZW1lbnRhdGlvbi1zcGVjaWZpYyBtZXRob2QgdGhhdCBhdHRlbXB0cyB0byBraWNrXG5cdC8vIG9mZiBhIGBmbHVzaGAgZXZlbnQgYXMgcXVpY2tseSBhcyBwb3NzaWJsZS4gYGZsdXNoYCB3aWxsIGF0dGVtcHQgdG8gZXhoYXVzdFxuXHQvLyB0aGUgZXZlbnQgcXVldWUgYmVmb3JlIHlpZWxkaW5nIHRvIHRoZSBicm93c2VyJ3Mgb3duIGV2ZW50IGxvb3AuXG5cdHZhciByZXF1ZXN0Rmx1c2g7XG5cdC8vIFRoZSBwb3NpdGlvbiBvZiB0aGUgbmV4dCB0YXNrIHRvIGV4ZWN1dGUgaW4gdGhlIHRhc2sgcXVldWUuIFRoaXMgaXNcblx0Ly8gcHJlc2VydmVkIGJldHdlZW4gY2FsbHMgdG8gYGZsdXNoYCBzbyB0aGF0IGl0IGNhbiBiZSByZXN1bWVkIGlmXG5cdC8vIGEgdGFzayB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuXHR2YXIgaW5kZXggPSAwO1xuXHQvLyBJZiBhIHRhc2sgc2NoZWR1bGVzIGFkZGl0aW9uYWwgdGFza3MgcmVjdXJzaXZlbHksIHRoZSB0YXNrIHF1ZXVlIGNhbiBncm93XG5cdC8vIHVuYm91bmRlZC4gVG8gcHJldmVudCBtZW1vcnkgZXhoYXVzdGlvbiwgdGhlIHRhc2sgcXVldWUgd2lsbCBwZXJpb2RpY2FsbHlcblx0Ly8gdHJ1bmNhdGUgYWxyZWFkeS1jb21wbGV0ZWQgdGFza3MuXG5cdHZhciBjYXBhY2l0eSA9IDEwMjQ7XG5cblx0Ly8gVGhlIGZsdXNoIGZ1bmN0aW9uIHByb2Nlc3NlcyBhbGwgdGFza3MgdGhhdCBoYXZlIGJlZW4gc2NoZWR1bGVkIHdpdGhcblx0Ly8gYHJhd0FzYXBgIHVubGVzcyBhbmQgdW50aWwgb25lIG9mIHRob3NlIHRhc2tzIHRocm93cyBhbiBleGNlcHRpb24uXG5cdC8vIElmIGEgdGFzayB0aHJvd3MgYW4gZXhjZXB0aW9uLCBgZmx1c2hgIGVuc3VyZXMgdGhhdCBpdHMgc3RhdGUgd2lsbCByZW1haW5cblx0Ly8gY29uc2lzdGVudCBhbmQgd2lsbCByZXN1bWUgd2hlcmUgaXQgbGVmdCBvZmYgd2hlbiBjYWxsZWQgYWdhaW4uXG5cdC8vIEhvd2V2ZXIsIGBmbHVzaGAgZG9lcyBub3QgbWFrZSBhbnkgYXJyYW5nZW1lbnRzIHRvIGJlIGNhbGxlZCBhZ2FpbiBpZiBhblxuXHQvLyBleGNlcHRpb24gaXMgdGhyb3duLlxuXHRmdW5jdGlvbiBmbHVzaCgpIHtcblx0ICAgIHdoaWxlIChpbmRleCA8IHF1ZXVlLmxlbmd0aCkge1xuXHQgICAgICAgIHZhciBjdXJyZW50SW5kZXggPSBpbmRleDtcblx0ICAgICAgICAvLyBBZHZhbmNlIHRoZSBpbmRleCBiZWZvcmUgY2FsbGluZyB0aGUgdGFzay4gVGhpcyBlbnN1cmVzIHRoYXQgd2Ugd2lsbFxuXHQgICAgICAgIC8vIGJlZ2luIGZsdXNoaW5nIG9uIHRoZSBuZXh0IHRhc2sgdGhlIHRhc2sgdGhyb3dzIGFuIGVycm9yLlxuXHQgICAgICAgIGluZGV4ID0gaW5kZXggKyAxO1xuXHQgICAgICAgIHF1ZXVlW2N1cnJlbnRJbmRleF0uY2FsbCgpO1xuXHQgICAgICAgIC8vIFByZXZlbnQgbGVha2luZyBtZW1vcnkgZm9yIGxvbmcgY2hhaW5zIG9mIHJlY3Vyc2l2ZSBjYWxscyB0byBgYXNhcGAuXG5cdCAgICAgICAgLy8gSWYgd2UgY2FsbCBgYXNhcGAgd2l0aGluIHRhc2tzIHNjaGVkdWxlZCBieSBgYXNhcGAsIHRoZSBxdWV1ZSB3aWxsXG5cdCAgICAgICAgLy8gZ3JvdywgYnV0IHRvIGF2b2lkIGFuIE8obikgd2FsayBmb3IgZXZlcnkgdGFzayB3ZSBleGVjdXRlLCB3ZSBkb24ndFxuXHQgICAgICAgIC8vIHNoaWZ0IHRhc2tzIG9mZiB0aGUgcXVldWUgYWZ0ZXIgdGhleSBoYXZlIGJlZW4gZXhlY3V0ZWQuXG5cdCAgICAgICAgLy8gSW5zdGVhZCwgd2UgcGVyaW9kaWNhbGx5IHNoaWZ0IDEwMjQgdGFza3Mgb2ZmIHRoZSBxdWV1ZS5cblx0ICAgICAgICBpZiAoaW5kZXggPiBjYXBhY2l0eSkge1xuXHQgICAgICAgICAgICAvLyBNYW51YWxseSBzaGlmdCBhbGwgdmFsdWVzIHN0YXJ0aW5nIGF0IHRoZSBpbmRleCBiYWNrIHRvIHRoZVxuXHQgICAgICAgICAgICAvLyBiZWdpbm5pbmcgb2YgdGhlIHF1ZXVlLlxuXHQgICAgICAgICAgICBmb3IgKHZhciBzY2FuID0gMCwgbmV3TGVuZ3RoID0gcXVldWUubGVuZ3RoIC0gaW5kZXg7IHNjYW4gPCBuZXdMZW5ndGg7IHNjYW4rKykge1xuXHQgICAgICAgICAgICAgICAgcXVldWVbc2Nhbl0gPSBxdWV1ZVtzY2FuICsgaW5kZXhdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCAtPSBpbmRleDtcblx0ICAgICAgICAgICAgaW5kZXggPSAwO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG5cdCAgICBpbmRleCA9IDA7XG5cdCAgICBmbHVzaGluZyA9IGZhbHNlO1xuXHR9XG5cblx0Ly8gYHJlcXVlc3RGbHVzaGAgaXMgaW1wbGVtZW50ZWQgdXNpbmcgYSBzdHJhdGVneSBiYXNlZCBvbiBkYXRhIGNvbGxlY3RlZCBmcm9tXG5cdC8vIGV2ZXJ5IGF2YWlsYWJsZSBTYXVjZUxhYnMgU2VsZW5pdW0gd2ViIGRyaXZlciB3b3JrZXIgYXQgdGltZSBvZiB3cml0aW5nLlxuXHQvLyBodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9zcHJlYWRzaGVldHMvZC8xbUctNVVZR3VwNXF4R2RFTVdraFA2QldDejA1M05VYjJFMVFvVVRVMTZ1QS9lZGl0I2dpZD03ODM3MjQ1OTNcblxuXHQvLyBTYWZhcmkgNiBhbmQgNi4xIGZvciBkZXNrdG9wLCBpUGFkLCBhbmQgaVBob25lIGFyZSB0aGUgb25seSBicm93c2VycyB0aGF0XG5cdC8vIGhhdmUgV2ViS2l0TXV0YXRpb25PYnNlcnZlciBidXQgbm90IHVuLXByZWZpeGVkIE11dGF0aW9uT2JzZXJ2ZXIuXG5cdC8vIE11c3QgdXNlIGBnbG9iYWxgIG9yIGBzZWxmYCBpbnN0ZWFkIG9mIGB3aW5kb3dgIHRvIHdvcmsgaW4gYm90aCBmcmFtZXMgYW5kIHdlYlxuXHQvLyB3b3JrZXJzLiBgZ2xvYmFsYCBpcyBhIHByb3Zpc2lvbiBvZiBCcm93c2VyaWZ5LCBNciwgTXJzLCBvciBNb3AuXG5cblx0LyogZ2xvYmFscyBzZWxmICovXG5cdHZhciBzY29wZSA9IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiBzZWxmO1xuXHR2YXIgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPSBzY29wZS5NdXRhdGlvbk9ic2VydmVyIHx8IHNjb3BlLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG5cblx0Ly8gTXV0YXRpb25PYnNlcnZlcnMgYXJlIGRlc2lyYWJsZSBiZWNhdXNlIHRoZXkgaGF2ZSBoaWdoIHByaW9yaXR5IGFuZCB3b3JrXG5cdC8vIHJlbGlhYmx5IGV2ZXJ5d2hlcmUgdGhleSBhcmUgaW1wbGVtZW50ZWQuXG5cdC8vIFRoZXkgYXJlIGltcGxlbWVudGVkIGluIGFsbCBtb2Rlcm4gYnJvd3NlcnMuXG5cdC8vXG5cdC8vIC0gQW5kcm9pZCA0LTQuM1xuXHQvLyAtIENocm9tZSAyNi0zNFxuXHQvLyAtIEZpcmVmb3ggMTQtMjlcblx0Ly8gLSBJbnRlcm5ldCBFeHBsb3JlciAxMVxuXHQvLyAtIGlQYWQgU2FmYXJpIDYtNy4xXG5cdC8vIC0gaVBob25lIFNhZmFyaSA3LTcuMVxuXHQvLyAtIFNhZmFyaSA2LTdcblx0aWYgKHR5cGVvZiBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdCAgICByZXF1ZXN0Rmx1c2ggPSBtYWtlUmVxdWVzdENhbGxGcm9tTXV0YXRpb25PYnNlcnZlcihmbHVzaCk7XG5cblx0Ly8gTWVzc2FnZUNoYW5uZWxzIGFyZSBkZXNpcmFibGUgYmVjYXVzZSB0aGV5IGdpdmUgZGlyZWN0IGFjY2VzcyB0byB0aGUgSFRNTFxuXHQvLyB0YXNrIHF1ZXVlLCBhcmUgaW1wbGVtZW50ZWQgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAsIFNhZmFyaSA1LjAtMSwgYW5kIE9wZXJhXG5cdC8vIDExLTEyLCBhbmQgaW4gd2ViIHdvcmtlcnMgaW4gbWFueSBlbmdpbmVzLlxuXHQvLyBBbHRob3VnaCBtZXNzYWdlIGNoYW5uZWxzIHlpZWxkIHRvIGFueSBxdWV1ZWQgcmVuZGVyaW5nIGFuZCBJTyB0YXNrcywgdGhleVxuXHQvLyB3b3VsZCBiZSBiZXR0ZXIgdGhhbiBpbXBvc2luZyB0aGUgNG1zIGRlbGF5IG9mIHRpbWVycy5cblx0Ly8gSG93ZXZlciwgdGhleSBkbyBub3Qgd29yayByZWxpYWJseSBpbiBJbnRlcm5ldCBFeHBsb3JlciBvciBTYWZhcmkuXG5cblx0Ly8gSW50ZXJuZXQgRXhwbG9yZXIgMTAgaXMgdGhlIG9ubHkgYnJvd3NlciB0aGF0IGhhcyBzZXRJbW1lZGlhdGUgYnV0IGRvZXNcblx0Ly8gbm90IGhhdmUgTXV0YXRpb25PYnNlcnZlcnMuXG5cdC8vIEFsdGhvdWdoIHNldEltbWVkaWF0ZSB5aWVsZHMgdG8gdGhlIGJyb3dzZXIncyByZW5kZXJlciwgaXQgd291bGQgYmVcblx0Ly8gcHJlZmVycmFibGUgdG8gZmFsbGluZyBiYWNrIHRvIHNldFRpbWVvdXQgc2luY2UgaXQgZG9lcyBub3QgaGF2ZVxuXHQvLyB0aGUgbWluaW11bSA0bXMgcGVuYWx0eS5cblx0Ly8gVW5mb3J0dW5hdGVseSB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgYnVnIGluIEludGVybmV0IEV4cGxvcmVyIDEwIE1vYmlsZSAoYW5kXG5cdC8vIERlc2t0b3AgdG8gYSBsZXNzZXIgZXh0ZW50KSB0aGF0IHJlbmRlcnMgYm90aCBzZXRJbW1lZGlhdGUgYW5kXG5cdC8vIE1lc3NhZ2VDaGFubmVsIHVzZWxlc3MgZm9yIHRoZSBwdXJwb3NlcyBvZiBBU0FQLlxuXHQvLyBodHRwczovL2dpdGh1Yi5jb20va3Jpc2tvd2FsL3EvaXNzdWVzLzM5NlxuXG5cdC8vIFRpbWVycyBhcmUgaW1wbGVtZW50ZWQgdW5pdmVyc2FsbHkuXG5cdC8vIFdlIGZhbGwgYmFjayB0byB0aW1lcnMgaW4gd29ya2VycyBpbiBtb3N0IGVuZ2luZXMsIGFuZCBpbiBmb3JlZ3JvdW5kXG5cdC8vIGNvbnRleHRzIGluIHRoZSBmb2xsb3dpbmcgYnJvd3NlcnMuXG5cdC8vIEhvd2V2ZXIsIG5vdGUgdGhhdCBldmVuIHRoaXMgc2ltcGxlIGNhc2UgcmVxdWlyZXMgbnVhbmNlcyB0byBvcGVyYXRlIGluIGFcblx0Ly8gYnJvYWQgc3BlY3RydW0gb2YgYnJvd3NlcnMuXG5cdC8vXG5cdC8vIC0gRmlyZWZveCAzLTEzXG5cdC8vIC0gSW50ZXJuZXQgRXhwbG9yZXIgNi05XG5cdC8vIC0gaVBhZCBTYWZhcmkgNC4zXG5cdC8vIC0gTHlueCAyLjguN1xuXHR9IGVsc2Uge1xuXHQgICAgcmVxdWVzdEZsdXNoID0gbWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKGZsdXNoKTtcblx0fVxuXG5cdC8vIGByZXF1ZXN0Rmx1c2hgIHJlcXVlc3RzIHRoYXQgdGhlIGhpZ2ggcHJpb3JpdHkgZXZlbnQgcXVldWUgYmUgZmx1c2hlZCBhc1xuXHQvLyBzb29uIGFzIHBvc3NpYmxlLlxuXHQvLyBUaGlzIGlzIHVzZWZ1bCB0byBwcmV2ZW50IGFuIGVycm9yIHRocm93biBpbiBhIHRhc2sgZnJvbSBzdGFsbGluZyB0aGUgZXZlbnRcblx0Ly8gcXVldWUgaWYgdGhlIGV4Y2VwdGlvbiBoYW5kbGVkIGJ5IE5vZGUuanPigJlzXG5cdC8vIGBwcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIilgIG9yIGJ5IGEgZG9tYWluLlxuXHRyYXdBc2FwLnJlcXVlc3RGbHVzaCA9IHJlcXVlc3RGbHVzaDtcblxuXHQvLyBUbyByZXF1ZXN0IGEgaGlnaCBwcmlvcml0eSBldmVudCwgd2UgaW5kdWNlIGEgbXV0YXRpb24gb2JzZXJ2ZXIgYnkgdG9nZ2xpbmdcblx0Ly8gdGhlIHRleHQgb2YgYSB0ZXh0IG5vZGUgYmV0d2VlbiBcIjFcIiBhbmQgXCItMVwiLlxuXHRmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjaykge1xuXHQgICAgdmFyIHRvZ2dsZSA9IDE7XG5cdCAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spO1xuXHQgICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcblx0ICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwge2NoYXJhY3RlckRhdGE6IHRydWV9KTtcblx0ICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcblx0ICAgICAgICB0b2dnbGUgPSAtdG9nZ2xlO1xuXHQgICAgICAgIG5vZGUuZGF0YSA9IHRvZ2dsZTtcblx0ICAgIH07XG5cdH1cblxuXHQvLyBUaGUgbWVzc2FnZSBjaGFubmVsIHRlY2huaXF1ZSB3YXMgZGlzY292ZXJlZCBieSBNYWx0ZSBVYmwgYW5kIHdhcyB0aGVcblx0Ly8gb3JpZ2luYWwgZm91bmRhdGlvbiBmb3IgdGhpcyBsaWJyYXJ5LlxuXHQvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuXG5cdC8vIFNhZmFyaSA2LjAuNSAoYXQgbGVhc3QpIGludGVybWl0dGVudGx5IGZhaWxzIHRvIGNyZWF0ZSBtZXNzYWdlIHBvcnRzIG9uIGFcblx0Ly8gcGFnZSdzIGZpcnN0IGxvYWQuIFRoYW5rZnVsbHksIHRoaXMgdmVyc2lvbiBvZiBTYWZhcmkgc3VwcG9ydHNcblx0Ly8gTXV0YXRpb25PYnNlcnZlcnMsIHNvIHdlIGRvbid0IG5lZWQgdG8gZmFsbCBiYWNrIGluIHRoYXQgY2FzZS5cblxuXHQvLyBmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tTWVzc2FnZUNoYW5uZWwoY2FsbGJhY2spIHtcblx0Ly8gICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG5cdC8vICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGNhbGxiYWNrO1xuXHQvLyAgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQvLyAgICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG5cdC8vICAgICB9O1xuXHQvLyB9XG5cblx0Ly8gRm9yIHJlYXNvbnMgZXhwbGFpbmVkIGFib3ZlLCB3ZSBhcmUgYWxzbyB1bmFibGUgdG8gdXNlIGBzZXRJbW1lZGlhdGVgXG5cdC8vIHVuZGVyIGFueSBjaXJjdW1zdGFuY2VzLlxuXHQvLyBFdmVuIGlmIHdlIHdlcmUsIHRoZXJlIGlzIGFub3RoZXIgYnVnIGluIEludGVybmV0IEV4cGxvcmVyIDEwLlxuXHQvLyBJdCBpcyBub3Qgc3VmZmljaWVudCB0byBhc3NpZ24gYHNldEltbWVkaWF0ZWAgdG8gYHJlcXVlc3RGbHVzaGAgYmVjYXVzZVxuXHQvLyBgc2V0SW1tZWRpYXRlYCBtdXN0IGJlIGNhbGxlZCAqYnkgbmFtZSogYW5kIHRoZXJlZm9yZSBtdXN0IGJlIHdyYXBwZWQgaW4gYVxuXHQvLyBjbG9zdXJlLlxuXHQvLyBOZXZlciBmb3JnZXQuXG5cblx0Ly8gZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbVNldEltbWVkaWF0ZShjYWxsYmFjaykge1xuXHQvLyAgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQvLyAgICAgICAgIHNldEltbWVkaWF0ZShjYWxsYmFjayk7XG5cdC8vICAgICB9O1xuXHQvLyB9XG5cblx0Ly8gU2FmYXJpIDYuMCBoYXMgYSBwcm9ibGVtIHdoZXJlIHRpbWVycyB3aWxsIGdldCBsb3N0IHdoaWxlIHRoZSB1c2VyIGlzXG5cdC8vIHNjcm9sbGluZy4gVGhpcyBwcm9ibGVtIGRvZXMgbm90IGltcGFjdCBBU0FQIGJlY2F1c2UgU2FmYXJpIDYuMCBzdXBwb3J0c1xuXHQvLyBtdXRhdGlvbiBvYnNlcnZlcnMsIHNvIHRoYXQgaW1wbGVtZW50YXRpb24gaXMgdXNlZCBpbnN0ZWFkLlxuXHQvLyBIb3dldmVyLCBpZiB3ZSBldmVyIGVsZWN0IHRvIHVzZSB0aW1lcnMgaW4gU2FmYXJpLCB0aGUgcHJldmFsZW50IHdvcmstYXJvdW5kXG5cdC8vIGlzIHRvIGFkZCBhIHNjcm9sbCBldmVudCBsaXN0ZW5lciB0aGF0IGNhbGxzIGZvciBhIGZsdXNoLlxuXG5cdC8vIGBzZXRUaW1lb3V0YCBkb2VzIG5vdCBjYWxsIHRoZSBwYXNzZWQgY2FsbGJhY2sgaWYgdGhlIGRlbGF5IGlzIGxlc3MgdGhhblxuXHQvLyBhcHByb3hpbWF0ZWx5IDcgaW4gd2ViIHdvcmtlcnMgaW4gRmlyZWZveCA4IHRocm91Z2ggMTgsIGFuZCBzb21ldGltZXMgbm90XG5cdC8vIGV2ZW4gdGhlbi5cblxuXHRmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXIoY2FsbGJhY2spIHtcblx0ICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcblx0ICAgICAgICAvLyBXZSBkaXNwYXRjaCBhIHRpbWVvdXQgd2l0aCBhIHNwZWNpZmllZCBkZWxheSBvZiAwIGZvciBlbmdpbmVzIHRoYXRcblx0ICAgICAgICAvLyBjYW4gcmVsaWFibHkgYWNjb21tb2RhdGUgdGhhdCByZXF1ZXN0LiBUaGlzIHdpbGwgdXN1YWxseSBiZSBzbmFwcGVkXG5cdCAgICAgICAgLy8gdG8gYSA0IG1pbGlzZWNvbmQgZGVsYXksIGJ1dCBvbmNlIHdlJ3JlIGZsdXNoaW5nLCB0aGVyZSdzIG5vIGRlbGF5XG5cdCAgICAgICAgLy8gYmV0d2VlbiBldmVudHMuXG5cdCAgICAgICAgdmFyIHRpbWVvdXRIYW5kbGUgPSBzZXRUaW1lb3V0KGhhbmRsZVRpbWVyLCAwKTtcblx0ICAgICAgICAvLyBIb3dldmVyLCBzaW5jZSB0aGlzIHRpbWVyIGdldHMgZnJlcXVlbnRseSBkcm9wcGVkIGluIEZpcmVmb3hcblx0ICAgICAgICAvLyB3b3JrZXJzLCB3ZSBlbmxpc3QgYW4gaW50ZXJ2YWwgaGFuZGxlIHRoYXQgd2lsbCB0cnkgdG8gZmlyZVxuXHQgICAgICAgIC8vIGFuIGV2ZW50IDIwIHRpbWVzIHBlciBzZWNvbmQgdW50aWwgaXQgc3VjY2VlZHMuXG5cdCAgICAgICAgdmFyIGludGVydmFsSGFuZGxlID0gc2V0SW50ZXJ2YWwoaGFuZGxlVGltZXIsIDUwKTtcblxuXHQgICAgICAgIGZ1bmN0aW9uIGhhbmRsZVRpbWVyKCkge1xuXHQgICAgICAgICAgICAvLyBXaGljaGV2ZXIgdGltZXIgc3VjY2VlZHMgd2lsbCBjYW5jZWwgYm90aCB0aW1lcnMgYW5kXG5cdCAgICAgICAgICAgIC8vIGV4ZWN1dGUgdGhlIGNhbGxiYWNrLlxuXHQgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG5cdCAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGUpO1xuXHQgICAgICAgICAgICBjYWxsYmFjaygpO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cdH1cblxuXHQvLyBUaGlzIGlzIGZvciBgYXNhcC5qc2Agb25seS5cblx0Ly8gSXRzIG5hbWUgd2lsbCBiZSBwZXJpb2RpY2FsbHkgcmFuZG9taXplZCB0byBicmVhayBhbnkgY29kZSB0aGF0IGRlcGVuZHMgb25cblx0Ly8gaXRzIGV4aXN0ZW5jZS5cblx0cmF3QXNhcC5tYWtlUmVxdWVzdENhbGxGcm9tVGltZXIgPSBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXI7XG5cblx0Ly8gQVNBUCB3YXMgb3JpZ2luYWxseSBhIG5leHRUaWNrIHNoaW0gaW5jbHVkZWQgaW4gUS4gVGhpcyB3YXMgZmFjdG9yZWQgb3V0XG5cdC8vIGludG8gdGhpcyBBU0FQIHBhY2thZ2UuIEl0IHdhcyBsYXRlciBhZGFwdGVkIHRvIFJTVlAgd2hpY2ggbWFkZSBmdXJ0aGVyXG5cdC8vIGFtZW5kbWVudHMuIFRoZXNlIGRlY2lzaW9ucywgcGFydGljdWxhcmx5IHRvIG1hcmdpbmFsaXplIE1lc3NhZ2VDaGFubmVsIGFuZFxuXHQvLyB0byBjYXB0dXJlIHRoZSBNdXRhdGlvbk9ic2VydmVyIGltcGxlbWVudGF0aW9uIGluIGEgY2xvc3VyZSwgd2VyZSBpbnRlZ3JhdGVkXG5cdC8vIGJhY2sgaW50byBBU0FQIHByb3Blci5cblx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3RpbGRlaW8vcnN2cC5qcy9ibG9iL2NkZGY3MjMyNTQ2YTljZjg1ODUyNGI3NWNkZTZmOWVkZjcyNjIwYTcvbGliL3JzdnAvYXNhcC5qc1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqL30uY2FsbChleHBvcnRzLCAoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KCkpKSlcblxuLyoqKi8gfSksXG4vKiA2ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8vIEEgc2ltcGxlIGNsYXNzIHN5c3RlbSwgbW9yZSBkb2N1bWVudGF0aW9uIHRvIGNvbWVcblxuXHRmdW5jdGlvbiBleHRlbmQoY2xzLCBuYW1lLCBwcm9wcykge1xuXHQgICAgLy8gVGhpcyBkb2VzIHRoYXQgc2FtZSB0aGluZyBhcyBPYmplY3QuY3JlYXRlLCBidXQgd2l0aCBzdXBwb3J0IGZvciBJRThcblx0ICAgIHZhciBGID0gZnVuY3Rpb24oKSB7fTtcblx0ICAgIEYucHJvdG90eXBlID0gY2xzLnByb3RvdHlwZTtcblx0ICAgIHZhciBwcm90b3R5cGUgPSBuZXcgRigpO1xuXG5cdCAgICAvLyBqc2hpbnQgdW5kZWY6IGZhbHNlXG5cdCAgICB2YXIgZm5UZXN0ID0gL3h5ei8udGVzdChmdW5jdGlvbigpeyB4eXo7IH0pID8gL1xcYnBhcmVudFxcYi8gOiAvLiovO1xuXHQgICAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcblxuXHQgICAgZm9yKHZhciBrIGluIHByb3BzKSB7XG5cdCAgICAgICAgdmFyIHNyYyA9IHByb3BzW2tdO1xuXHQgICAgICAgIHZhciBwYXJlbnQgPSBwcm90b3R5cGVba107XG5cblx0ICAgICAgICBpZih0eXBlb2YgcGFyZW50ID09PSAnZnVuY3Rpb24nICYmXG5cdCAgICAgICAgICAgdHlwZW9mIHNyYyA9PT0gJ2Z1bmN0aW9uJyAmJlxuXHQgICAgICAgICAgIGZuVGVzdC50ZXN0KHNyYykpIHtcblx0ICAgICAgICAgICAgLypqc2hpbnQgLVcwODMgKi9cblx0ICAgICAgICAgICAgcHJvdG90eXBlW2tdID0gKGZ1bmN0aW9uIChzcmMsIHBhcmVudCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGN1cnJlbnQgcGFyZW50IG1ldGhvZFxuXHQgICAgICAgICAgICAgICAgICAgIHZhciB0bXAgPSB0aGlzLnBhcmVudDtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8vIFNldCBwYXJlbnQgdG8gdGhlIHByZXZpb3VzIG1ldGhvZCwgY2FsbCwgYW5kIHJlc3RvcmVcblx0ICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgcmVzID0gc3JjLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSB0bXA7XG5cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuXHQgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfSkoc3JjLCBwYXJlbnQpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgcHJvdG90eXBlW2tdID0gc3JjO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgcHJvdG90eXBlLnR5cGVuYW1lID0gbmFtZTtcblxuXHQgICAgdmFyIG5ld19jbHMgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICBpZihwcm90b3R5cGUuaW5pdCkge1xuXHQgICAgICAgICAgICBwcm90b3R5cGUuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgIG5ld19jbHMucHJvdG90eXBlID0gcHJvdG90eXBlO1xuXHQgICAgbmV3X2Nscy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBuZXdfY2xzO1xuXG5cdCAgICBuZXdfY2xzLmV4dGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHByb3BzKSB7XG5cdCAgICAgICAgaWYodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG5cdCAgICAgICAgICAgIHByb3BzID0gbmFtZTtcblx0ICAgICAgICAgICAgbmFtZSA9ICdhbm9ueW1vdXMnO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gZXh0ZW5kKG5ld19jbHMsIG5hbWUsIHByb3BzKTtcblx0ICAgIH07XG5cblx0ICAgIHJldHVybiBuZXdfY2xzO1xuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBleHRlbmQoT2JqZWN0LCAnT2JqZWN0Jywge30pO1xuXG5cbi8qKiovIH0pLFxuLyogNyAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblx0dmFyIHIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDgpO1xuXG5cdGZ1bmN0aW9uIG5vcm1hbGl6ZSh2YWx1ZSwgZGVmYXVsdFZhbHVlKSB7XG5cdCAgICBpZih2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBmYWxzZSkge1xuXHQgICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdmFsdWU7XG5cdH1cblxuXHR2YXIgZmlsdGVycyA9IHtcblx0ICAgIGFiczogTWF0aC5hYnMsXG5cblx0ICAgIGJhdGNoOiBmdW5jdGlvbihhcnIsIGxpbmVjb3VudCwgZmlsbF93aXRoKSB7XG5cdCAgICAgICAgdmFyIGk7XG5cdCAgICAgICAgdmFyIHJlcyA9IFtdO1xuXHQgICAgICAgIHZhciB0bXAgPSBbXTtcblxuXHQgICAgICAgIGZvcihpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICBpZihpICUgbGluZWNvdW50ID09PSAwICYmIHRtcC5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgIHJlcy5wdXNoKHRtcCk7XG5cdCAgICAgICAgICAgICAgICB0bXAgPSBbXTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHRtcC5wdXNoKGFycltpXSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYodG1wLmxlbmd0aCkge1xuXHQgICAgICAgICAgICBpZihmaWxsX3dpdGgpIHtcblx0ICAgICAgICAgICAgICAgIGZvcihpID0gdG1wLmxlbmd0aDsgaSA8IGxpbmVjb3VudDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdG1wLnB1c2goZmlsbF93aXRoKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJlcy5wdXNoKHRtcCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHJlcztcblx0ICAgIH0sXG5cblx0ICAgIGNhcGl0YWxpemU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB2YXIgcmV0ID0gc3RyLnRvTG93ZXJDYXNlKCk7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcmV0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcmV0LnNsaWNlKDEpKTtcblx0ICAgIH0sXG5cblx0ICAgIGNlbnRlcjogZnVuY3Rpb24oc3RyLCB3aWR0aCkge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IDgwO1xuXG5cdCAgICAgICAgaWYoc3RyLmxlbmd0aCA+PSB3aWR0aCkge1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBzcGFjZXMgPSB3aWR0aCAtIHN0ci5sZW5ndGg7XG5cdCAgICAgICAgdmFyIHByZSA9IGxpYi5yZXBlYXQoJyAnLCBzcGFjZXMvMiAtIHNwYWNlcyAlIDIpO1xuXHQgICAgICAgIHZhciBwb3N0ID0gbGliLnJlcGVhdCgnICcsIHNwYWNlcy8yKTtcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCBwcmUgKyBzdHIgKyBwb3N0KTtcblx0ICAgIH0sXG5cblx0ICAgICdkZWZhdWx0JzogZnVuY3Rpb24odmFsLCBkZWYsIGJvb2wpIHtcblx0ICAgICAgICBpZihib29sKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YWwgPyB2YWwgOiBkZWY7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICByZXR1cm4gKHZhbCAhPT0gdW5kZWZpbmVkKSA/IHZhbCA6IGRlZjtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBkaWN0c29ydDogZnVuY3Rpb24odmFsLCBjYXNlX3NlbnNpdGl2ZSwgYnkpIHtcblx0ICAgICAgICBpZiAoIWxpYi5pc09iamVjdCh2YWwpKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcignZGljdHNvcnQgZmlsdGVyOiB2YWwgbXVzdCBiZSBhbiBvYmplY3QnKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgYXJyYXkgPSBbXTtcblx0ICAgICAgICBmb3IgKHZhciBrIGluIHZhbCkge1xuXHQgICAgICAgICAgICAvLyBkZWxpYmVyYXRlbHkgaW5jbHVkZSBwcm9wZXJ0aWVzIGZyb20gdGhlIG9iamVjdCdzIHByb3RvdHlwZVxuXHQgICAgICAgICAgICBhcnJheS5wdXNoKFtrLHZhbFtrXV0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBzaTtcblx0ICAgICAgICBpZiAoYnkgPT09IHVuZGVmaW5lZCB8fCBieSA9PT0gJ2tleScpIHtcblx0ICAgICAgICAgICAgc2kgPSAwO1xuXHQgICAgICAgIH0gZWxzZSBpZiAoYnkgPT09ICd2YWx1ZScpIHtcblx0ICAgICAgICAgICAgc2kgPSAxO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcihcblx0ICAgICAgICAgICAgICAgICdkaWN0c29ydCBmaWx0ZXI6IFlvdSBjYW4gb25seSBzb3J0IGJ5IGVpdGhlciBrZXkgb3IgdmFsdWUnKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBhcnJheS5zb3J0KGZ1bmN0aW9uKHQxLCB0Mikge1xuXHQgICAgICAgICAgICB2YXIgYSA9IHQxW3NpXTtcblx0ICAgICAgICAgICAgdmFyIGIgPSB0MltzaV07XG5cblx0ICAgICAgICAgICAgaWYgKCFjYXNlX3NlbnNpdGl2ZSkge1xuXHQgICAgICAgICAgICAgICAgaWYgKGxpYi5pc1N0cmluZyhhKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGEgPSBhLnRvVXBwZXJDYXNlKCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBpZiAobGliLmlzU3RyaW5nKGIpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYiA9IGIudG9VcHBlckNhc2UoKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBhID4gYiA/IDEgOiAoYSA9PT0gYiA/IDAgOiAtMSk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gYXJyYXk7XG5cdCAgICB9LFxuXG5cdCAgICBkdW1wOiBmdW5jdGlvbihvYmosIHNwYWNlcykge1xuXHQgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsIHNwYWNlcyk7XG5cdCAgICB9LFxuXG5cdCAgICBlc2NhcGU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIGlmKHN0ciBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykge1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBzdHIgPSAoc3RyID09PSBudWxsIHx8IHN0ciA9PT0gdW5kZWZpbmVkKSA/ICcnIDogc3RyO1xuXHQgICAgICAgIHJldHVybiByLm1hcmtTYWZlKGxpYi5lc2NhcGUoc3RyLnRvU3RyaW5nKCkpKTtcblx0ICAgIH0sXG5cblx0ICAgIHNhZmU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIGlmIChzdHIgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgc3RyID0gKHN0ciA9PT0gbnVsbCB8fCBzdHIgPT09IHVuZGVmaW5lZCkgPyAnJyA6IHN0cjtcblx0ICAgICAgICByZXR1cm4gci5tYXJrU2FmZShzdHIudG9TdHJpbmcoKSk7XG5cdCAgICB9LFxuXG5cdCAgICBmaXJzdDogZnVuY3Rpb24oYXJyKSB7XG5cdCAgICAgICAgcmV0dXJuIGFyclswXTtcblx0ICAgIH0sXG5cblx0ICAgIGdyb3VwYnk6IGZ1bmN0aW9uKGFyciwgYXR0cikge1xuXHQgICAgICAgIHJldHVybiBsaWIuZ3JvdXBCeShhcnIsIGF0dHIpO1xuXHQgICAgfSxcblxuXHQgICAgaW5kZW50OiBmdW5jdGlvbihzdHIsIHdpZHRoLCBpbmRlbnRmaXJzdCkge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblxuXHQgICAgICAgIGlmIChzdHIgPT09ICcnKSByZXR1cm4gJyc7XG5cblx0ICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IDQ7XG5cdCAgICAgICAgdmFyIHJlcyA9ICcnO1xuXHQgICAgICAgIHZhciBsaW5lcyA9IHN0ci5zcGxpdCgnXFxuJyk7XG5cdCAgICAgICAgdmFyIHNwID0gbGliLnJlcGVhdCgnICcsIHdpZHRoKTtcblxuXHQgICAgICAgIGZvcih2YXIgaT0wOyBpPGxpbmVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGlmKGkgPT09IDAgJiYgIWluZGVudGZpcnN0KSB7XG5cdCAgICAgICAgICAgICAgICByZXMgKz0gbGluZXNbaV0gKyAnXFxuJztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJlcyArPSBzcCArIGxpbmVzW2ldICsgJ1xcbic7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXMpO1xuXHQgICAgfSxcblxuXHQgICAgam9pbjogZnVuY3Rpb24oYXJyLCBkZWwsIGF0dHIpIHtcblx0ICAgICAgICBkZWwgPSBkZWwgfHwgJyc7XG5cblx0ICAgICAgICBpZihhdHRyKSB7XG5cdCAgICAgICAgICAgIGFyciA9IGxpYi5tYXAoYXJyLCBmdW5jdGlvbih2KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdlthdHRyXTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGFyci5qb2luKGRlbCk7XG5cdCAgICB9LFxuXG5cdCAgICBsYXN0OiBmdW5jdGlvbihhcnIpIHtcblx0ICAgICAgICByZXR1cm4gYXJyW2Fyci5sZW5ndGgtMV07XG5cdCAgICB9LFxuXG5cdCAgICBsZW5ndGg6IGZ1bmN0aW9uKHZhbCkge1xuXHQgICAgICAgIHZhciB2YWx1ZSA9IG5vcm1hbGl6ZSh2YWwsICcnKTtcblxuXHQgICAgICAgIGlmKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgaWYoXG5cdCAgICAgICAgICAgICAgICAodHlwZW9mIE1hcCA9PT0gJ2Z1bmN0aW9uJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIE1hcCkgfHxcblx0ICAgICAgICAgICAgICAgICh0eXBlb2YgU2V0ID09PSAnZnVuY3Rpb24nICYmIHZhbHVlIGluc3RhbmNlb2YgU2V0KVxuXHQgICAgICAgICAgICApIHtcblx0ICAgICAgICAgICAgICAgIC8vIEVDTUFTY3JpcHQgMjAxNSBNYXBzIGFuZCBTZXRzXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuc2l6ZTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZihsaWIuaXNPYmplY3QodmFsdWUpICYmICEodmFsdWUgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpKSB7XG5cdCAgICAgICAgICAgICAgICAvLyBPYmplY3RzIChiZXNpZGVzIFNhZmVTdHJpbmdzKSwgbm9uLXByaW1hdGl2ZSBBcnJheXNcblx0ICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiB2YWx1ZS5sZW5ndGg7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiAwO1xuXHQgICAgfSxcblxuXHQgICAgbGlzdDogZnVuY3Rpb24odmFsKSB7XG5cdCAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhbC5zcGxpdCgnJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYobGliLmlzT2JqZWN0KHZhbCkpIHtcblx0ICAgICAgICAgICAgdmFyIGtleXMgPSBbXTtcblxuXHQgICAgICAgICAgICBpZihPYmplY3Qua2V5cykge1xuXHQgICAgICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKHZhbCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBmb3IodmFyIGsgaW4gdmFsKSB7XG5cdCAgICAgICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIGxpYi5tYXAoa2V5cywgZnVuY3Rpb24oaykge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHsga2V5OiBrLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbFtrXSB9O1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihsaWIuaXNBcnJheSh2YWwpKSB7XG5cdCAgICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKCdsaXN0IGZpbHRlcjogdHlwZSBub3QgaXRlcmFibGUnKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBsb3dlcjogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHJldHVybiBzdHIudG9Mb3dlckNhc2UoKTtcblx0ICAgIH0sXG5cblx0ICAgIG5sMmJyOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBpZiAoc3RyID09PSBudWxsIHx8IHN0ciA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiAnJztcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgc3RyLnJlcGxhY2UoL1xcclxcbnxcXG4vZywgJzxiciAvPlxcbicpKTtcblx0ICAgIH0sXG5cblx0ICAgIHJhbmRvbTogZnVuY3Rpb24oYXJyKSB7XG5cdCAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG5cdCAgICB9LFxuXG5cdCAgICByZWplY3RhdHRyOiBmdW5jdGlvbihhcnIsIGF0dHIpIHtcblx0ICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcblx0ICAgICAgICByZXR1cm4gIWl0ZW1bYXR0cl07XG5cdCAgICAgIH0pO1xuXHQgICAgfSxcblxuXHQgICAgc2VsZWN0YXR0cjogZnVuY3Rpb24oYXJyLCBhdHRyKSB7XG5cdCAgICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG5cdCAgICAgICAgcmV0dXJuICEhaXRlbVthdHRyXTtcblx0ICAgICAgfSk7XG5cdCAgICB9LFxuXG5cdCAgICByZXBsYWNlOiBmdW5jdGlvbihzdHIsIG9sZCwgbmV3XywgbWF4Q291bnQpIHtcblx0ICAgICAgICB2YXIgb3JpZ2luYWxTdHIgPSBzdHI7XG5cblx0ICAgICAgICBpZiAob2xkIGluc3RhbmNlb2YgUmVnRXhwKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZShvbGQsIG5ld18pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKHR5cGVvZiBtYXhDb3VudCA9PT0gJ3VuZGVmaW5lZCcpe1xuXHQgICAgICAgICAgICBtYXhDb3VudCA9IC0xO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciByZXMgPSAnJzsgIC8vIE91dHB1dFxuXG5cdCAgICAgICAgLy8gQ2FzdCBOdW1iZXJzIGluIHRoZSBzZWFyY2ggdGVybSB0byBzdHJpbmdcblx0ICAgICAgICBpZih0eXBlb2Ygb2xkID09PSAnbnVtYmVyJyl7XG5cdCAgICAgICAgICAgIG9sZCA9IG9sZCArICcnO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKHR5cGVvZiBvbGQgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIC8vIElmIGl0IGlzIHNvbWV0aGluZyBvdGhlciB0aGFuIG51bWJlciBvciBzdHJpbmcsXG5cdCAgICAgICAgICAgIC8vIHJldHVybiB0aGUgb3JpZ2luYWwgc3RyaW5nXG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gQ2FzdCBudW1iZXJzIGluIHRoZSByZXBsYWNlbWVudCB0byBzdHJpbmdcblx0ICAgICAgICBpZih0eXBlb2Ygc3RyID09PSAnbnVtYmVyJyl7XG5cdCAgICAgICAgICAgIHN0ciA9IHN0ciArICcnO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIElmIGJ5IG5vdywgd2UgZG9uJ3QgaGF2ZSBhIHN0cmluZywgdGhyb3cgaXQgYmFja1xuXHQgICAgICAgIGlmKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnICYmICEoc3RyIGluc3RhbmNlb2Ygci5TYWZlU3RyaW5nKSl7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gU2hvcnRDaXJjdWl0c1xuXHQgICAgICAgIGlmKG9sZCA9PT0gJycpe1xuXHQgICAgICAgICAgICAvLyBNaW1pYyB0aGUgcHl0aG9uIGJlaGF2aW91cjogZW1wdHkgc3RyaW5nIGlzIHJlcGxhY2VkXG5cdCAgICAgICAgICAgIC8vIGJ5IHJlcGxhY2VtZW50IGUuZy4gXCJhYmNcInxyZXBsYWNlKFwiXCIsIFwiLlwiKSAtPiAuYS5iLmMuXG5cdCAgICAgICAgICAgIHJlcyA9IG5ld18gKyBzdHIuc3BsaXQoJycpLmpvaW4obmV3XykgKyBuZXdfO1xuXHQgICAgICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXMpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBuZXh0SW5kZXggPSBzdHIuaW5kZXhPZihvbGQpO1xuXHQgICAgICAgIC8vIGlmICMgb2YgcmVwbGFjZW1lbnRzIHRvIHBlcmZvcm0gaXMgMCwgb3IgdGhlIHN0cmluZyB0byBkb2VzXG5cdCAgICAgICAgLy8gbm90IGNvbnRhaW4gdGhlIG9sZCB2YWx1ZSwgcmV0dXJuIHRoZSBzdHJpbmdcblx0ICAgICAgICBpZihtYXhDb3VudCA9PT0gMCB8fCBuZXh0SW5kZXggPT09IC0xKXtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgcG9zID0gMDtcblx0ICAgICAgICB2YXIgY291bnQgPSAwOyAvLyAjIG9mIHJlcGxhY2VtZW50cyBtYWRlXG5cblx0ICAgICAgICB3aGlsZShuZXh0SW5kZXggID4gLTEgJiYgKG1heENvdW50ID09PSAtMSB8fCBjb3VudCA8IG1heENvdW50KSl7XG5cdCAgICAgICAgICAgIC8vIEdyYWIgdGhlIG5leHQgY2h1bmsgb2Ygc3JjIHN0cmluZyBhbmQgYWRkIGl0IHdpdGggdGhlXG5cdCAgICAgICAgICAgIC8vIHJlcGxhY2VtZW50LCB0byB0aGUgcmVzdWx0XG5cdCAgICAgICAgICAgIHJlcyArPSBzdHIuc3Vic3RyaW5nKHBvcywgbmV4dEluZGV4KSArIG5ld187XG5cdCAgICAgICAgICAgIC8vIEluY3JlbWVudCBvdXIgcG9pbnRlciBpbiB0aGUgc3JjIHN0cmluZ1xuXHQgICAgICAgICAgICBwb3MgPSBuZXh0SW5kZXggKyBvbGQubGVuZ3RoO1xuXHQgICAgICAgICAgICBjb3VudCsrO1xuXHQgICAgICAgICAgICAvLyBTZWUgaWYgdGhlcmUgYXJlIGFueSBtb3JlIHJlcGxhY2VtZW50cyB0byBiZSBtYWRlXG5cdCAgICAgICAgICAgIG5leHRJbmRleCA9IHN0ci5pbmRleE9mKG9sZCwgcG9zKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBXZSd2ZSBlaXRoZXIgcmVhY2hlZCB0aGUgZW5kLCBvciBkb25lIHRoZSBtYXggIyBvZlxuXHQgICAgICAgIC8vIHJlcGxhY2VtZW50cywgdGFjayBvbiBhbnkgcmVtYWluaW5nIHN0cmluZ1xuXHQgICAgICAgIGlmKHBvcyA8IHN0ci5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgcmVzICs9IHN0ci5zdWJzdHJpbmcocG9zKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Mob3JpZ2luYWxTdHIsIHJlcyk7XG5cdCAgICB9LFxuXG5cdCAgICByZXZlcnNlOiBmdW5jdGlvbih2YWwpIHtcblx0ICAgICAgICB2YXIgYXJyO1xuXHQgICAgICAgIGlmKGxpYi5pc1N0cmluZyh2YWwpKSB7XG5cdCAgICAgICAgICAgIGFyciA9IGZpbHRlcnMubGlzdCh2YWwpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgLy8gQ29weSBpdFxuXHQgICAgICAgICAgICBhcnIgPSBsaWIubWFwKHZhbCwgZnVuY3Rpb24odikgeyByZXR1cm4gdjsgfSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgYXJyLnJldmVyc2UoKTtcblxuXHQgICAgICAgIGlmKGxpYi5pc1N0cmluZyh2YWwpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyh2YWwsIGFyci5qb2luKCcnKSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBhcnI7XG5cdCAgICB9LFxuXG5cdCAgICByb3VuZDogZnVuY3Rpb24odmFsLCBwcmVjaXNpb24sIG1ldGhvZCkge1xuXHQgICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbiB8fCAwO1xuXHQgICAgICAgIHZhciBmYWN0b3IgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKTtcblx0ICAgICAgICB2YXIgcm91bmRlcjtcblxuXHQgICAgICAgIGlmKG1ldGhvZCA9PT0gJ2NlaWwnKSB7XG5cdCAgICAgICAgICAgIHJvdW5kZXIgPSBNYXRoLmNlaWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYobWV0aG9kID09PSAnZmxvb3InKSB7XG5cdCAgICAgICAgICAgIHJvdW5kZXIgPSBNYXRoLmZsb29yO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgcm91bmRlciA9IE1hdGgucm91bmQ7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHJvdW5kZXIodmFsICogZmFjdG9yKSAvIGZhY3Rvcjtcblx0ICAgIH0sXG5cblx0ICAgIHNsaWNlOiBmdW5jdGlvbihhcnIsIHNsaWNlcywgZmlsbFdpdGgpIHtcblx0ICAgICAgICB2YXIgc2xpY2VMZW5ndGggPSBNYXRoLmZsb29yKGFyci5sZW5ndGggLyBzbGljZXMpO1xuXHQgICAgICAgIHZhciBleHRyYSA9IGFyci5sZW5ndGggJSBzbGljZXM7XG5cdCAgICAgICAgdmFyIG9mZnNldCA9IDA7XG5cdCAgICAgICAgdmFyIHJlcyA9IFtdO1xuXG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8c2xpY2VzOyBpKyspIHtcblx0ICAgICAgICAgICAgdmFyIHN0YXJ0ID0gb2Zmc2V0ICsgaSAqIHNsaWNlTGVuZ3RoO1xuXHQgICAgICAgICAgICBpZihpIDwgZXh0cmEpIHtcblx0ICAgICAgICAgICAgICAgIG9mZnNldCsrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHZhciBlbmQgPSBvZmZzZXQgKyAoaSArIDEpICogc2xpY2VMZW5ndGg7XG5cblx0ICAgICAgICAgICAgdmFyIHNsaWNlID0gYXJyLnNsaWNlKHN0YXJ0LCBlbmQpO1xuXHQgICAgICAgICAgICBpZihmaWxsV2l0aCAmJiBpID49IGV4dHJhKSB7XG5cdCAgICAgICAgICAgICAgICBzbGljZS5wdXNoKGZpbGxXaXRoKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXMucHVzaChzbGljZSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHJlcztcblx0ICAgIH0sXG5cblx0ICAgIHN1bTogZnVuY3Rpb24oYXJyLCBhdHRyLCBzdGFydCkge1xuXHQgICAgICAgIHZhciBzdW0gPSAwO1xuXG5cdCAgICAgICAgaWYodHlwZW9mIHN0YXJ0ID09PSAnbnVtYmVyJyl7XG5cdCAgICAgICAgICAgIHN1bSArPSBzdGFydDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZihhdHRyKSB7XG5cdCAgICAgICAgICAgIGFyciA9IGxpYi5tYXAoYXJyLCBmdW5jdGlvbih2KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdlthdHRyXTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICBzdW0gKz0gYXJyW2ldO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBzdW07XG5cdCAgICB9LFxuXG5cdCAgICBzb3J0OiByLm1ha2VNYWNybyhbJ3ZhbHVlJywgJ3JldmVyc2UnLCAnY2FzZV9zZW5zaXRpdmUnLCAnYXR0cmlidXRlJ10sIFtdLCBmdW5jdGlvbihhcnIsIHJldmVyc2UsIGNhc2VTZW5zLCBhdHRyKSB7XG5cdCAgICAgICAgIC8vIENvcHkgaXRcblx0ICAgICAgICBhcnIgPSBsaWIubWFwKGFyciwgZnVuY3Rpb24odikgeyByZXR1cm4gdjsgfSk7XG5cblx0ICAgICAgICBhcnIuc29ydChmdW5jdGlvbihhLCBiKSB7XG5cdCAgICAgICAgICAgIHZhciB4LCB5O1xuXG5cdCAgICAgICAgICAgIGlmKGF0dHIpIHtcblx0ICAgICAgICAgICAgICAgIHggPSBhW2F0dHJdO1xuXHQgICAgICAgICAgICAgICAgeSA9IGJbYXR0cl07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICB4ID0gYTtcblx0ICAgICAgICAgICAgICAgIHkgPSBiO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYoIWNhc2VTZW5zICYmIGxpYi5pc1N0cmluZyh4KSAmJiBsaWIuaXNTdHJpbmcoeSkpIHtcblx0ICAgICAgICAgICAgICAgIHggPSB4LnRvTG93ZXJDYXNlKCk7XG5cdCAgICAgICAgICAgICAgICB5ID0geS50b0xvd2VyQ2FzZSgpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYoeCA8IHkpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiByZXZlcnNlID8gMSA6IC0xO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYoeCA+IHkpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiByZXZlcnNlID8gLTE6IDE7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gMDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgcmV0dXJuIGFycjtcblx0ICAgIH0pLFxuXG5cdCAgICBzdHJpbmc6IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhvYmosIG9iaik7XG5cdCAgICB9LFxuXG5cdCAgICBzdHJpcHRhZ3M6IGZ1bmN0aW9uKGlucHV0LCBwcmVzZXJ2ZV9saW5lYnJlYWtzKSB7XG5cdCAgICAgICAgaW5wdXQgPSBub3JtYWxpemUoaW5wdXQsICcnKTtcblx0ICAgICAgICBwcmVzZXJ2ZV9saW5lYnJlYWtzID0gcHJlc2VydmVfbGluZWJyZWFrcyB8fCBmYWxzZTtcblx0ICAgICAgICB2YXIgdGFncyA9IC88XFwvPyhbYS16XVthLXowLTldKilcXGJbXj5dKj58PCEtLVtcXHNcXFNdKj8tLT4vZ2k7XG5cdCAgICAgICAgdmFyIHRyaW1tZWRJbnB1dCA9IGZpbHRlcnMudHJpbShpbnB1dC5yZXBsYWNlKHRhZ3MsICcnKSk7XG5cdCAgICAgICAgdmFyIHJlcyA9ICcnO1xuXHQgICAgICAgIGlmIChwcmVzZXJ2ZV9saW5lYnJlYWtzKSB7XG5cdCAgICAgICAgICAgIHJlcyA9IHRyaW1tZWRJbnB1dFxuXHQgICAgICAgICAgICAgICAgLnJlcGxhY2UoL14gK3wgKyQvZ20sICcnKSAgICAgLy8gcmVtb3ZlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNwYWNlc1xuXHQgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyArL2csICcgJykgICAgICAgICAgLy8gc3F1YXNoIGFkamFjZW50IHNwYWNlc1xuXHQgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhcXHJcXG4pL2csICdcXG4nKSAgICAgLy8gbm9ybWFsaXplIGxpbmVicmVha3MgKENSTEYgLT4gTEYpXG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxuXFxuXFxuKy9nLCAnXFxuXFxuJyk7IC8vIHNxdWFzaCBhYm5vcm1hbCBhZGphY2VudCBsaW5lYnJlYWtzXG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgcmVzID0gdHJpbW1lZElucHV0LnJlcGxhY2UoL1xccysvZ2ksICcgJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhpbnB1dCwgcmVzKTtcblx0ICAgIH0sXG5cblx0ICAgIHRpdGxlOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgdmFyIHdvcmRzID0gc3RyLnNwbGl0KCcgJyk7XG5cdCAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHdvcmRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIHdvcmRzW2ldID0gZmlsdGVycy5jYXBpdGFsaXplKHdvcmRzW2ldKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgd29yZHMuam9pbignICcpKTtcblx0ICAgIH0sXG5cblx0ICAgIHRyaW06IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHN0ci5yZXBsYWNlKC9eXFxzKnxcXHMqJC9nLCAnJykpO1xuXHQgICAgfSxcblxuXHQgICAgdHJ1bmNhdGU6IGZ1bmN0aW9uKGlucHV0LCBsZW5ndGgsIGtpbGx3b3JkcywgZW5kKSB7XG5cdCAgICAgICAgdmFyIG9yaWcgPSBpbnB1dDtcblx0ICAgICAgICBpbnB1dCA9IG5vcm1hbGl6ZShpbnB1dCwgJycpO1xuXHQgICAgICAgIGxlbmd0aCA9IGxlbmd0aCB8fCAyNTU7XG5cblx0ICAgICAgICBpZiAoaW5wdXQubGVuZ3RoIDw9IGxlbmd0aClcblx0ICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuXG5cdCAgICAgICAgaWYgKGtpbGx3b3Jkcykge1xuXHQgICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cmluZygwLCBsZW5ndGgpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBpZHggPSBpbnB1dC5sYXN0SW5kZXhPZignICcsIGxlbmd0aCk7XG5cdCAgICAgICAgICAgIGlmKGlkeCA9PT0gLTEpIHtcblx0ICAgICAgICAgICAgICAgIGlkeCA9IGxlbmd0aDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyaW5nKDAsIGlkeCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaW5wdXQgKz0gKGVuZCAhPT0gdW5kZWZpbmVkICYmIGVuZCAhPT0gbnVsbCkgPyBlbmQgOiAnLi4uJztcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Mob3JpZywgaW5wdXQpO1xuXHQgICAgfSxcblxuXHQgICAgdXBwZXI6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICByZXR1cm4gc3RyLnRvVXBwZXJDYXNlKCk7XG5cdCAgICB9LFxuXG5cdCAgICB1cmxlbmNvZGU6IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgICAgIHZhciBlbmMgPSBlbmNvZGVVUklDb21wb25lbnQ7XG5cdCAgICAgICAgaWYgKGxpYi5pc1N0cmluZyhvYmopKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBlbmMob2JqKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICB2YXIgcGFydHM7XG5cdCAgICAgICAgICAgIGlmIChsaWIuaXNBcnJheShvYmopKSB7XG5cdCAgICAgICAgICAgICAgICBwYXJ0cyA9IG9iai5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmMoaXRlbVswXSkgKyAnPScgKyBlbmMoaXRlbVsxXSk7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHBhcnRzID0gW107XG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluIG9iaikge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcGFydHMucHVzaChlbmMoaykgKyAnPScgKyBlbmMob2JqW2tdKSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBwYXJ0cy5qb2luKCcmJyk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgdXJsaXplOiBmdW5jdGlvbihzdHIsIGxlbmd0aCwgbm9mb2xsb3cpIHtcblx0ICAgICAgICBpZiAoaXNOYU4obGVuZ3RoKSkgbGVuZ3RoID0gSW5maW5pdHk7XG5cblx0ICAgICAgICB2YXIgbm9Gb2xsb3dBdHRyID0gKG5vZm9sbG93ID09PSB0cnVlID8gJyByZWw9XCJub2ZvbGxvd1wiJyA6ICcnKTtcblxuXHQgICAgICAgIC8vIEZvciB0aGUgamluamEgcmVnZXhwLCBzZWVcblx0ICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWl0c3VoaWtvL2ppbmphMi9ibG9iL2YxNWI4MTRkY2JhNmFhMTJiYzc0ZDFmN2QwYzg4MWQ1NWY3MTI2YmUvamluamEyL3V0aWxzLnB5I0wyMC1MMjNcblx0ICAgICAgICB2YXIgcHVuY1JFID0gL14oPzpcXCh8PHwmbHQ7KT8oLio/KSg/OlxcLnwsfFxcKXxcXG58Jmd0Oyk/JC87XG5cdCAgICAgICAgLy8gZnJvbSBodHRwOi8vYmxvZy5nZXJ2Lm5ldC8yMDExLzA1L2h0bWw1X2VtYWlsX2FkZHJlc3NfcmVnZXhwL1xuXHQgICAgICAgIHZhciBlbWFpbFJFID0gL15bXFx3LiEjJCUmJyorXFwtXFwvPT9cXF5ge3x9fl0rQFthLXpcXGRcXC1dKyhcXC5bYS16XFxkXFwtXSspKyQvaTtcblx0ICAgICAgICB2YXIgaHR0cEh0dHBzUkUgPSAvXmh0dHBzPzpcXC9cXC8uKiQvO1xuXHQgICAgICAgIHZhciB3d3dSRSA9IC9ed3d3XFwuLztcblx0ICAgICAgICB2YXIgdGxkUkUgPSAvXFwuKD86b3JnfG5ldHxjb20pKD86XFw6fFxcL3wkKS87XG5cblx0ICAgICAgICB2YXIgd29yZHMgPSBzdHIuc3BsaXQoLyhcXHMrKS8pLmZpbHRlcihmdW5jdGlvbih3b3JkKSB7XG5cdCAgICAgICAgICAvLyBJZiB0aGUgd29yZCBoYXMgbm8gbGVuZ3RoLCBiYWlsLiBUaGlzIGNhbiBoYXBwZW4gZm9yIHN0ciB3aXRoXG5cdCAgICAgICAgICAvLyB0cmFpbGluZyB3aGl0ZXNwYWNlLlxuXHQgICAgICAgICAgcmV0dXJuIHdvcmQgJiYgd29yZC5sZW5ndGg7XG5cdCAgICAgICAgfSkubWFwKGZ1bmN0aW9uKHdvcmQpIHtcblx0ICAgICAgICAgIHZhciBtYXRjaGVzID0gd29yZC5tYXRjaChwdW5jUkUpO1xuXHQgICAgICAgICAgdmFyIHBvc3NpYmxlVXJsID0gbWF0Y2hlcyAmJiBtYXRjaGVzWzFdIHx8IHdvcmQ7XG5cblx0ICAgICAgICAgIC8vIHVybCB0aGF0IHN0YXJ0cyB3aXRoIGh0dHAgb3IgaHR0cHNcblx0ICAgICAgICAgIGlmIChodHRwSHR0cHNSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiJyArIHBvc3NpYmxlVXJsICsgJ1wiJyArIG5vRm9sbG93QXR0ciArICc+JyArIHBvc3NpYmxlVXJsLnN1YnN0cigwLCBsZW5ndGgpICsgJzwvYT4nO1xuXG5cdCAgICAgICAgICAvLyB1cmwgdGhhdCBzdGFydHMgd2l0aCB3d3cuXG5cdCAgICAgICAgICBpZiAod3d3UkUudGVzdChwb3NzaWJsZVVybCkpXG5cdCAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly8nICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIC8vIGFuIGVtYWlsIGFkZHJlc3Mgb2YgdGhlIGZvcm0gdXNlcm5hbWVAZG9tYWluLnRsZFxuXHQgICAgICAgICAgaWYgKGVtYWlsUkUudGVzdChwb3NzaWJsZVVybCkpXG5cdCAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cIm1haWx0bzonICsgcG9zc2libGVVcmwgKyAnXCI+JyArIHBvc3NpYmxlVXJsICsgJzwvYT4nO1xuXG5cdCAgICAgICAgICAvLyB1cmwgdGhhdCBlbmRzIGluIC5jb20sIC5vcmcgb3IgLm5ldCB0aGF0IGlzIG5vdCBhbiBlbWFpbCBhZGRyZXNzXG5cdCAgICAgICAgICBpZiAodGxkUkUudGVzdChwb3NzaWJsZVVybCkpXG5cdCAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly8nICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIHJldHVybiB3b3JkO1xuXG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gd29yZHMuam9pbignJyk7XG5cdCAgICB9LFxuXG5cdCAgICB3b3JkY291bnQ6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB2YXIgd29yZHMgPSAoc3RyKSA/IHN0ci5tYXRjaCgvXFx3Ky9nKSA6IG51bGw7XG5cdCAgICAgICAgcmV0dXJuICh3b3JkcykgPyB3b3Jkcy5sZW5ndGggOiBudWxsO1xuXHQgICAgfSxcblxuXHQgICAgJ2Zsb2F0JzogZnVuY3Rpb24odmFsLCBkZWYpIHtcblx0ICAgICAgICB2YXIgcmVzID0gcGFyc2VGbG9hdCh2YWwpO1xuXHQgICAgICAgIHJldHVybiBpc05hTihyZXMpID8gZGVmIDogcmVzO1xuXHQgICAgfSxcblxuXHQgICAgJ2ludCc6IGZ1bmN0aW9uKHZhbCwgZGVmKSB7XG5cdCAgICAgICAgdmFyIHJlcyA9IHBhcnNlSW50KHZhbCwgMTApO1xuXHQgICAgICAgIHJldHVybiBpc05hTihyZXMpID8gZGVmIDogcmVzO1xuXHQgICAgfVxuXHR9O1xuXG5cdC8vIEFsaWFzZXNcblx0ZmlsdGVycy5kID0gZmlsdGVyc1snZGVmYXVsdCddO1xuXHRmaWx0ZXJzLmUgPSBmaWx0ZXJzLmVzY2FwZTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IGZpbHRlcnM7XG5cblxuLyoqKi8gfSksXG4vKiA4ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgT2JqID0gX193ZWJwYWNrX3JlcXVpcmVfXyg2KTtcblxuXHQvLyBGcmFtZXMga2VlcCB0cmFjayBvZiBzY29waW5nIGJvdGggYXQgY29tcGlsZS10aW1lIGFuZCBydW4tdGltZSBzb1xuXHQvLyB3ZSBrbm93IGhvdyB0byBhY2Nlc3MgdmFyaWFibGVzLiBCbG9jayB0YWdzIGNhbiBpbnRyb2R1Y2Ugc3BlY2lhbFxuXHQvLyB2YXJpYWJsZXMsIGZvciBleGFtcGxlLlxuXHR2YXIgRnJhbWUgPSBPYmouZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uKHBhcmVudCwgaXNvbGF0ZVdyaXRlcykge1xuXHQgICAgICAgIHRoaXMudmFyaWFibGVzID0ge307XG5cdCAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG5cdCAgICAgICAgdGhpcy50b3BMZXZlbCA9IGZhbHNlO1xuXHQgICAgICAgIC8vIGlmIHRoaXMgaXMgdHJ1ZSwgd3JpdGVzIChzZXQpIHNob3VsZCBuZXZlciBwcm9wYWdhdGUgdXB3YXJkcyBwYXN0XG5cdCAgICAgICAgLy8gdGhpcyBmcmFtZSB0byBpdHMgcGFyZW50ICh0aG91Z2ggcmVhZHMgbWF5KS5cblx0ICAgICAgICB0aGlzLmlzb2xhdGVXcml0ZXMgPSBpc29sYXRlV3JpdGVzO1xuXHQgICAgfSxcblxuXHQgICAgc2V0OiBmdW5jdGlvbihuYW1lLCB2YWwsIHJlc29sdmVVcCkge1xuXHQgICAgICAgIC8vIEFsbG93IHZhcmlhYmxlcyB3aXRoIGRvdHMgYnkgYXV0b21hdGljYWxseSBjcmVhdGluZyB0aGVcblx0ICAgICAgICAvLyBuZXN0ZWQgc3RydWN0dXJlXG5cdCAgICAgICAgdmFyIHBhcnRzID0gbmFtZS5zcGxpdCgnLicpO1xuXHQgICAgICAgIHZhciBvYmogPSB0aGlzLnZhcmlhYmxlcztcblx0ICAgICAgICB2YXIgZnJhbWUgPSB0aGlzO1xuXG5cdCAgICAgICAgaWYocmVzb2x2ZVVwKSB7XG5cdCAgICAgICAgICAgIGlmKChmcmFtZSA9IHRoaXMucmVzb2x2ZShwYXJ0c1swXSwgdHJ1ZSkpKSB7XG5cdCAgICAgICAgICAgICAgICBmcmFtZS5zZXQobmFtZSwgdmFsKTtcblx0ICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZvcih2YXIgaT0wOyBpPHBhcnRzLmxlbmd0aCAtIDE7IGkrKykge1xuXHQgICAgICAgICAgICB2YXIgaWQgPSBwYXJ0c1tpXTtcblxuXHQgICAgICAgICAgICBpZighb2JqW2lkXSkge1xuXHQgICAgICAgICAgICAgICAgb2JqW2lkXSA9IHt9O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIG9iaiA9IG9ialtpZF07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgb2JqW3BhcnRzW3BhcnRzLmxlbmd0aCAtIDFdXSA9IHZhbDtcblx0ICAgIH0sXG5cblx0ICAgIGdldDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHZhciB2YWwgPSB0aGlzLnZhcmlhYmxlc1tuYW1lXTtcblx0ICAgICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gbnVsbDtcblx0ICAgIH0sXG5cblx0ICAgIGxvb2t1cDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHZhciBwID0gdGhpcy5wYXJlbnQ7XG5cdCAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuXHQgICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBwICYmIHAubG9va3VwKG5hbWUpO1xuXHQgICAgfSxcblxuXHQgICAgcmVzb2x2ZTogZnVuY3Rpb24obmFtZSwgZm9yV3JpdGUpIHtcblx0ICAgICAgICB2YXIgcCA9IChmb3JXcml0ZSAmJiB0aGlzLmlzb2xhdGVXcml0ZXMpID8gdW5kZWZpbmVkIDogdGhpcy5wYXJlbnQ7XG5cdCAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuXHQgICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gcCAmJiBwLnJlc29sdmUobmFtZSk7XG5cdCAgICB9LFxuXG5cdCAgICBwdXNoOiBmdW5jdGlvbihpc29sYXRlV3JpdGVzKSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBGcmFtZSh0aGlzLCBpc29sYXRlV3JpdGVzKTtcblx0ICAgIH0sXG5cblx0ICAgIHBvcDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50O1xuXHQgICAgfVxuXHR9KTtcblxuXHRmdW5jdGlvbiBtYWtlTWFjcm8oYXJnTmFtZXMsIGt3YXJnTmFtZXMsIGZ1bmMpIHtcblx0ICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgYXJnQ291bnQgPSBudW1BcmdzKGFyZ3VtZW50cyk7XG5cdCAgICAgICAgdmFyIGFyZ3M7XG5cdCAgICAgICAgdmFyIGt3YXJncyA9IGdldEtleXdvcmRBcmdzKGFyZ3VtZW50cyk7XG5cdCAgICAgICAgdmFyIGk7XG5cblx0ICAgICAgICBpZihhcmdDb3VudCA+IGFyZ05hbWVzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBhcmdOYW1lcy5sZW5ndGgpO1xuXG5cdCAgICAgICAgICAgIC8vIFBvc2l0aW9uYWwgYXJndW1lbnRzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCBpbiBhc1xuXHQgICAgICAgICAgICAvLyBrZXl3b3JkIGFyZ3VtZW50cyAoZXNzZW50aWFsbHkgZGVmYXVsdCB2YWx1ZXMpXG5cdCAgICAgICAgICAgIHZhciB2YWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCBhcmdzLmxlbmd0aCwgYXJnQ291bnQpO1xuXHQgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCB2YWxzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBpZihpIDwga3dhcmdOYW1lcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgICAgICBrd2FyZ3Nba3dhcmdOYW1lc1tpXV0gPSB2YWxzW2ldO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgYXJncy5wdXNoKGt3YXJncyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYoYXJnQ291bnQgPCBhcmdOYW1lcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgYXJnQ291bnQpO1xuXG5cdCAgICAgICAgICAgIGZvcihpID0gYXJnQ291bnQ7IGkgPCBhcmdOYW1lcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ05hbWVzW2ldO1xuXG5cdCAgICAgICAgICAgICAgICAvLyBLZXl3b3JkIGFyZ3VtZW50cyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgYXNcblx0ICAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uYWwgYXJndW1lbnRzLCBpLmUuIHRoZSBjYWxsZXIgZXhwbGljaXRseVxuXHQgICAgICAgICAgICAgICAgLy8gdXNlZCB0aGUgbmFtZSBvZiBhIHBvc2l0aW9uYWwgYXJnXG5cdCAgICAgICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzW2FyZ10pO1xuXHQgICAgICAgICAgICAgICAgZGVsZXRlIGt3YXJnc1thcmddO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgYXJncy5wdXNoKGt3YXJncyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHQgICAgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIG1ha2VLZXl3b3JkQXJncyhvYmopIHtcblx0ICAgIG9iai5fX2tleXdvcmRzID0gdHJ1ZTtcblx0ICAgIHJldHVybiBvYmo7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRLZXl3b3JkQXJncyhhcmdzKSB7XG5cdCAgICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG5cdCAgICBpZihsZW4pIHtcblx0ICAgICAgICB2YXIgbGFzdEFyZyA9IGFyZ3NbbGVuIC0gMV07XG5cdCAgICAgICAgaWYobGFzdEFyZyAmJiBsYXN0QXJnLmhhc093blByb3BlcnR5KCdfX2tleXdvcmRzJykpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGxhc3RBcmc7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIHt9O1xuXHR9XG5cblx0ZnVuY3Rpb24gbnVtQXJncyhhcmdzKSB7XG5cdCAgICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG5cdCAgICBpZihsZW4gPT09IDApIHtcblx0ICAgICAgICByZXR1cm4gMDtcblx0ICAgIH1cblxuXHQgICAgdmFyIGxhc3RBcmcgPSBhcmdzW2xlbiAtIDFdO1xuXHQgICAgaWYobGFzdEFyZyAmJiBsYXN0QXJnLmhhc093blByb3BlcnR5KCdfX2tleXdvcmRzJykpIHtcblx0ICAgICAgICByZXR1cm4gbGVuIC0gMTtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBsZW47XG5cdCAgICB9XG5cdH1cblxuXHQvLyBBIFNhZmVTdHJpbmcgb2JqZWN0IGluZGljYXRlcyB0aGF0IHRoZSBzdHJpbmcgc2hvdWxkIG5vdCBiZVxuXHQvLyBhdXRvZXNjYXBlZC4gVGhpcyBoYXBwZW5zIG1hZ2ljYWxseSBiZWNhdXNlIGF1dG9lc2NhcGluZyBvbmx5XG5cdC8vIG9jY3VycyBvbiBwcmltaXRpdmUgc3RyaW5nIG9iamVjdHMuXG5cdGZ1bmN0aW9uIFNhZmVTdHJpbmcodmFsKSB7XG5cdCAgICBpZih0eXBlb2YgdmFsICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICB9XG5cblx0ICAgIHRoaXMudmFsID0gdmFsO1xuXHQgICAgdGhpcy5sZW5ndGggPSB2YWwubGVuZ3RoO1xuXHR9XG5cblx0U2FmZVN0cmluZy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFN0cmluZy5wcm90b3R5cGUsIHtcblx0ICAgIGxlbmd0aDogeyB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB2YWx1ZTogMCB9XG5cdH0pO1xuXHRTYWZlU3RyaW5nLnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24oKSB7XG5cdCAgICByZXR1cm4gdGhpcy52YWw7XG5cdH07XG5cdFNhZmVTdHJpbmcucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdCAgICByZXR1cm4gdGhpcy52YWw7XG5cdH07XG5cblx0ZnVuY3Rpb24gY29weVNhZmVuZXNzKGRlc3QsIHRhcmdldCkge1xuXHQgICAgaWYoZGVzdCBpbnN0YW5jZW9mIFNhZmVTdHJpbmcpIHtcblx0ICAgICAgICByZXR1cm4gbmV3IFNhZmVTdHJpbmcodGFyZ2V0KTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB0YXJnZXQudG9TdHJpbmcoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIG1hcmtTYWZlKHZhbCkge1xuXHQgICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuXG5cdCAgICBpZih0eXBlID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyh2YWwpO1xuXHQgICAgfVxuXHQgICAgZWxzZSBpZih0eXBlICE9PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgdmFyIHJldCA9IHZhbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG5cdCAgICAgICAgICAgIGlmKHR5cGVvZiByZXQgPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFNhZmVTdHJpbmcocmV0KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiByZXQ7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIHN1cHByZXNzVmFsdWUodmFsLCBhdXRvZXNjYXBlKSB7XG5cdCAgICB2YWwgPSAodmFsICE9PSB1bmRlZmluZWQgJiYgdmFsICE9PSBudWxsKSA/IHZhbCA6ICcnO1xuXG5cdCAgICBpZihhdXRvZXNjYXBlICYmICEodmFsIGluc3RhbmNlb2YgU2FmZVN0cmluZykpIHtcblx0ICAgICAgICB2YWwgPSBsaWIuZXNjYXBlKHZhbC50b1N0cmluZygpKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHZhbDtcblx0fVxuXG5cdGZ1bmN0aW9uIGVuc3VyZURlZmluZWQodmFsLCBsaW5lbm8sIGNvbG5vKSB7XG5cdCAgICBpZih2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoXG5cdCAgICAgICAgICAgICdhdHRlbXB0ZWQgdG8gb3V0cHV0IG51bGwgb3IgdW5kZWZpbmVkIHZhbHVlJyxcblx0ICAgICAgICAgICAgbGluZW5vICsgMSxcblx0ICAgICAgICAgICAgY29sbm8gKyAxXG5cdCAgICAgICAgKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB2YWw7XG5cdH1cblxuXHRmdW5jdGlvbiBtZW1iZXJMb29rdXAob2JqLCB2YWwpIHtcblx0ICAgIG9iaiA9IG9iaiB8fCB7fTtcblxuXHQgICAgaWYodHlwZW9mIG9ialt2YWxdID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICByZXR1cm4gb2JqW3ZhbF0uYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBvYmpbdmFsXTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNhbGxXcmFwKG9iaiwgbmFtZSwgY29udGV4dCwgYXJncykge1xuXHQgICAgaWYoIW9iaikge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGNhbGwgYCcgKyBuYW1lICsgJ2AsIHdoaWNoIGlzIHVuZGVmaW5lZCBvciBmYWxzZXknKTtcblx0ICAgIH1cblx0ICAgIGVsc2UgaWYodHlwZW9mIG9iaiAhPT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGNhbGwgYCcgKyBuYW1lICsgJ2AsIHdoaWNoIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG5cdCAgICB9XG5cblx0ICAgIC8vIGpzaGludCB2YWxpZHRoaXM6IHRydWVcblx0ICAgIHJldHVybiBvYmouYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdH1cblxuXHRmdW5jdGlvbiBjb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgbmFtZSkge1xuXHQgICAgdmFyIHZhbCA9IGZyYW1lLmxvb2t1cChuYW1lKTtcblx0ICAgIHJldHVybiAodmFsICE9PSB1bmRlZmluZWQpID9cblx0ICAgICAgICB2YWwgOlxuXHQgICAgICAgIGNvbnRleHQubG9va3VwKG5hbWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlRXJyb3IoZXJyb3IsIGxpbmVubywgY29sbm8pIHtcblx0ICAgIGlmKGVycm9yLmxpbmVubykge1xuXHQgICAgICAgIHJldHVybiBlcnJvcjtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBuZXcgbGliLlRlbXBsYXRlRXJyb3IoZXJyb3IsIGxpbmVubywgY29sbm8pO1xuXHQgICAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gYXN5bmNFYWNoKGFyciwgZGltZW4sIGl0ZXIsIGNiKSB7XG5cdCAgICBpZihsaWIuaXNBcnJheShhcnIpKSB7XG5cdCAgICAgICAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG5cblx0ICAgICAgICBsaWIuYXN5bmNJdGVyKGFyciwgZnVuY3Rpb24oaXRlbSwgaSwgbmV4dCkge1xuXHQgICAgICAgICAgICBzd2l0Y2goZGltZW4pIHtcblx0ICAgICAgICAgICAgY2FzZSAxOiBpdGVyKGl0ZW0sIGksIGxlbiwgbmV4dCk7IGJyZWFrO1xuXHQgICAgICAgICAgICBjYXNlIDI6IGl0ZXIoaXRlbVswXSwgaXRlbVsxXSwgaSwgbGVuLCBuZXh0KTsgYnJlYWs7XG5cdCAgICAgICAgICAgIGNhc2UgMzogaXRlcihpdGVtWzBdLCBpdGVtWzFdLCBpdGVtWzJdLCBpLCBsZW4sIG5leHQpOyBicmVhaztcblx0ICAgICAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgICAgIGl0ZW0ucHVzaChpLCBuZXh0KTtcblx0ICAgICAgICAgICAgICAgIGl0ZXIuYXBwbHkodGhpcywgaXRlbSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9LCBjYik7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICBsaWIuYXN5bmNGb3IoYXJyLCBmdW5jdGlvbihrZXksIHZhbCwgaSwgbGVuLCBuZXh0KSB7XG5cdCAgICAgICAgICAgIGl0ZXIoa2V5LCB2YWwsIGksIGxlbiwgbmV4dCk7XG5cdCAgICAgICAgfSwgY2IpO1xuXHQgICAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gYXN5bmNBbGwoYXJyLCBkaW1lbiwgZnVuYywgY2IpIHtcblx0ICAgIHZhciBmaW5pc2hlZCA9IDA7XG5cdCAgICB2YXIgbGVuLCBpO1xuXHQgICAgdmFyIG91dHB1dEFycjtcblxuXHQgICAgZnVuY3Rpb24gZG9uZShpLCBvdXRwdXQpIHtcblx0ICAgICAgICBmaW5pc2hlZCsrO1xuXHQgICAgICAgIG91dHB1dEFycltpXSA9IG91dHB1dDtcblxuXHQgICAgICAgIGlmKGZpbmlzaGVkID09PSBsZW4pIHtcblx0ICAgICAgICAgICAgY2IobnVsbCwgb3V0cHV0QXJyLmpvaW4oJycpKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGlmKGxpYi5pc0FycmF5KGFycikpIHtcblx0ICAgICAgICBsZW4gPSBhcnIubGVuZ3RoO1xuXHQgICAgICAgIG91dHB1dEFyciA9IG5ldyBBcnJheShsZW4pO1xuXG5cdCAgICAgICAgaWYobGVuID09PSAwKSB7XG5cdCAgICAgICAgICAgIGNiKG51bGwsICcnKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSBhcnJbaV07XG5cblx0ICAgICAgICAgICAgICAgIHN3aXRjaChkaW1lbikge1xuXHQgICAgICAgICAgICAgICAgY2FzZSAxOiBmdW5jKGl0ZW0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgY2FzZSAyOiBmdW5jKGl0ZW1bMF0sIGl0ZW1bMV0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgY2FzZSAzOiBmdW5jKGl0ZW1bMF0sIGl0ZW1bMV0sIGl0ZW1bMl0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgICAgICAgICBpdGVtLnB1c2goaSwgZG9uZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgLy8ganNoaW50IHZhbGlkdGhpczogdHJ1ZVxuXHQgICAgICAgICAgICAgICAgICAgIGZ1bmMuYXBwbHkodGhpcywgaXRlbSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICB2YXIga2V5cyA9IGxpYi5rZXlzKGFycik7XG5cdCAgICAgICAgbGVuID0ga2V5cy5sZW5ndGg7XG5cdCAgICAgICAgb3V0cHV0QXJyID0gbmV3IEFycmF5KGxlbik7XG5cblx0ICAgICAgICBpZihsZW4gPT09IDApIHtcblx0ICAgICAgICAgICAgY2IobnVsbCwgJycpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGsgPSBrZXlzW2ldO1xuXHQgICAgICAgICAgICAgICAgZnVuYyhrLCBhcnJba10sIGksIGxlbiwgZG9uZSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICB9XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IHtcblx0ICAgIEZyYW1lOiBGcmFtZSxcblx0ICAgIG1ha2VNYWNybzogbWFrZU1hY3JvLFxuXHQgICAgbWFrZUtleXdvcmRBcmdzOiBtYWtlS2V5d29yZEFyZ3MsXG5cdCAgICBudW1BcmdzOiBudW1BcmdzLFxuXHQgICAgc3VwcHJlc3NWYWx1ZTogc3VwcHJlc3NWYWx1ZSxcblx0ICAgIGVuc3VyZURlZmluZWQ6IGVuc3VyZURlZmluZWQsXG5cdCAgICBtZW1iZXJMb29rdXA6IG1lbWJlckxvb2t1cCxcblx0ICAgIGNvbnRleHRPckZyYW1lTG9va3VwOiBjb250ZXh0T3JGcmFtZUxvb2t1cCxcblx0ICAgIGNhbGxXcmFwOiBjYWxsV3JhcCxcblx0ICAgIGhhbmRsZUVycm9yOiBoYW5kbGVFcnJvcixcblx0ICAgIGlzQXJyYXk6IGxpYi5pc0FycmF5LFxuXHQgICAga2V5czogbGliLmtleXMsXG5cdCAgICBTYWZlU3RyaW5nOiBTYWZlU3RyaW5nLFxuXHQgICAgY29weVNhZmVuZXNzOiBjb3B5U2FmZW5lc3MsXG5cdCAgICBtYXJrU2FmZTogbWFya1NhZmUsXG5cdCAgICBhc3luY0VhY2g6IGFzeW5jRWFjaCxcblx0ICAgIGFzeW5jQWxsOiBhc3luY0FsbCxcblx0ICAgIGluT3BlcmF0b3I6IGxpYi5pbk9wZXJhdG9yXG5cdH07XG5cblxuLyoqKi8gfSksXG4vKiA5ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGZ1bmN0aW9uIGN5Y2xlcihpdGVtcykge1xuXHQgICAgdmFyIGluZGV4ID0gLTE7XG5cblx0ICAgIHJldHVybiB7XG5cdCAgICAgICAgY3VycmVudDogbnVsbCxcblx0ICAgICAgICByZXNldDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIGluZGV4ID0gLTE7XG5cdCAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IG51bGw7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICBpbmRleCsrO1xuXHQgICAgICAgICAgICBpZihpbmRleCA+PSBpdGVtcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgIGluZGV4ID0gMDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IGl0ZW1zW2luZGV4XTtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudDtcblx0ICAgICAgICB9LFxuXHQgICAgfTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gam9pbmVyKHNlcCkge1xuXHQgICAgc2VwID0gc2VwIHx8ICcsJztcblx0ICAgIHZhciBmaXJzdCA9IHRydWU7XG5cblx0ICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgdmFsID0gZmlyc3QgPyAnJyA6IHNlcDtcblx0ICAgICAgICBmaXJzdCA9IGZhbHNlO1xuXHQgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICB9O1xuXHR9XG5cblx0Ly8gTWFraW5nIHRoaXMgYSBmdW5jdGlvbiBpbnN0ZWFkIHNvIGl0IHJldHVybnMgYSBuZXcgb2JqZWN0XG5cdC8vIGVhY2ggdGltZSBpdCdzIGNhbGxlZC4gVGhhdCB3YXksIGlmIHNvbWV0aGluZyBsaWtlIGFuIGVudmlyb25tZW50XG5cdC8vIHVzZXMgaXQsIHRoZXkgd2lsbCBlYWNoIGhhdmUgdGhlaXIgb3duIGNvcHkuXG5cdGZ1bmN0aW9uIGdsb2JhbHMoKSB7XG5cdCAgICByZXR1cm4ge1xuXHQgICAgICAgIHJhbmdlOiBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuXHQgICAgICAgICAgICBpZih0eXBlb2Ygc3RvcCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgICAgICAgIHN0b3AgPSBzdGFydDtcblx0ICAgICAgICAgICAgICAgIHN0YXJ0ID0gMDtcblx0ICAgICAgICAgICAgICAgIHN0ZXAgPSAxO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYoIXN0ZXApIHtcblx0ICAgICAgICAgICAgICAgIHN0ZXAgPSAxO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdmFyIGFyciA9IFtdO1xuXHQgICAgICAgICAgICB2YXIgaTtcblx0ICAgICAgICAgICAgaWYgKHN0ZXAgPiAwKSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKGk9c3RhcnQ7IGk8c3RvcDsgaSs9c3RlcCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGFyci5wdXNoKGkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgZm9yIChpPXN0YXJ0OyBpPnN0b3A7IGkrPXN0ZXApIHtcblx0ICAgICAgICAgICAgICAgICAgICBhcnIucHVzaChpKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gYXJyO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvLyBsaXBzdW06IGZ1bmN0aW9uKG4sIGh0bWwsIG1pbiwgbWF4KSB7XG5cdCAgICAgICAgLy8gfSxcblxuXHQgICAgICAgIGN5Y2xlcjogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBjeWNsZXIoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIGpvaW5lcjogZnVuY3Rpb24oc2VwKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBqb2luZXIoc2VwKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxzO1xuXG5cbi8qKiovIH0pLFxuLyogMTAgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHR2YXIgX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXywgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX187LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovKGZ1bmN0aW9uKHNldEltbWVkaWF0ZSwgcHJvY2Vzcykgey8vIE1JVCBsaWNlbnNlIChieSBFbGFuIFNoYW5rZXIpLlxuXHQoZnVuY3Rpb24oZ2xvYmFscykge1xuXHQgICd1c2Ugc3RyaWN0JztcblxuXHQgIHZhciBleGVjdXRlU3luYyA9IGZ1bmN0aW9uKCl7XG5cdCAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cdCAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdmdW5jdGlvbicpe1xuXHQgICAgICBhcmdzWzBdLmFwcGx5KG51bGwsIGFyZ3Muc3BsaWNlKDEpKTtcblx0ICAgIH1cblx0ICB9O1xuXG5cdCAgdmFyIGV4ZWN1dGVBc3luYyA9IGZ1bmN0aW9uKGZuKXtcblx0ICAgIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgIHNldEltbWVkaWF0ZShmbik7XG5cdCAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG5cdCAgICAgIHByb2Nlc3MubmV4dFRpY2soZm4pO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgc2V0VGltZW91dChmbiwgMCk7XG5cdCAgICB9XG5cdCAgfTtcblxuXHQgIHZhciBtYWtlSXRlcmF0b3IgPSBmdW5jdGlvbiAodGFza3MpIHtcblx0ICAgIHZhciBtYWtlQ2FsbGJhY2sgPSBmdW5jdGlvbiAoaW5kZXgpIHtcblx0ICAgICAgdmFyIGZuID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIGlmICh0YXNrcy5sZW5ndGgpIHtcblx0ICAgICAgICAgIHRhc2tzW2luZGV4XS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gZm4ubmV4dCgpO1xuXHQgICAgICB9O1xuXHQgICAgICBmbi5uZXh0ID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIHJldHVybiAoaW5kZXggPCB0YXNrcy5sZW5ndGggLSAxKSA/IG1ha2VDYWxsYmFjayhpbmRleCArIDEpOiBudWxsO1xuXHQgICAgICB9O1xuXHQgICAgICByZXR1cm4gZm47XG5cdCAgICB9O1xuXHQgICAgcmV0dXJuIG1ha2VDYWxsYmFjaygwKTtcblx0ICB9O1xuXHQgIFxuXHQgIHZhciBfaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24obWF5YmVBcnJheSl7XG5cdCAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG1heWJlQXJyYXkpID09PSAnW29iamVjdCBBcnJheV0nO1xuXHQgIH07XG5cblx0ICB2YXIgd2F0ZXJmYWxsID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaywgZm9yY2VBc3luYykge1xuXHQgICAgdmFyIG5leHRUaWNrID0gZm9yY2VBc3luYyA/IGV4ZWN1dGVBc3luYyA6IGV4ZWN1dGVTeW5jO1xuXHQgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbiAoKSB7fTtcblx0ICAgIGlmICghX2lzQXJyYXkodGFza3MpKSB7XG5cdCAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IHRvIHdhdGVyZmFsbCBtdXN0IGJlIGFuIGFycmF5IG9mIGZ1bmN0aW9ucycpO1xuXHQgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0ICAgIH1cblx0ICAgIGlmICghdGFza3MubGVuZ3RoKSB7XG5cdCAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuXHQgICAgfVxuXHQgICAgdmFyIHdyYXBJdGVyYXRvciA9IGZ1bmN0aW9uIChpdGVyYXRvcikge1xuXHQgICAgICByZXR1cm4gZnVuY3Rpb24gKGVycikge1xuXHQgICAgICAgIGlmIChlcnIpIHtcblx0ICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHt9O1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdCAgICAgICAgICB2YXIgbmV4dCA9IGl0ZXJhdG9yLm5leHQoKTtcblx0ICAgICAgICAgIGlmIChuZXh0KSB7XG5cdCAgICAgICAgICAgIGFyZ3MucHVzaCh3cmFwSXRlcmF0b3IobmV4dCkpO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgYXJncy5wdXNoKGNhbGxiYWNrKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgaXRlcmF0b3IuYXBwbHkobnVsbCwgYXJncyk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICAgIH07XG5cdCAgICB9O1xuXHQgICAgd3JhcEl0ZXJhdG9yKG1ha2VJdGVyYXRvcih0YXNrcykpKCk7XG5cdCAgfTtcblxuXHQgIGlmICh0cnVlKSB7XG5cdCAgICAhKF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18gPSBbXSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgIHJldHVybiB3YXRlcmZhbGw7XG5cdCAgICB9LmFwcGx5KGV4cG9ydHMsIF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18pLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyAhPT0gdW5kZWZpbmVkICYmIChtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fKSk7IC8vIFJlcXVpcmVKU1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gd2F0ZXJmYWxsOyAvLyBDb21tb25KU1xuXHQgIH0gZWxzZSB7XG5cdCAgICBnbG9iYWxzLndhdGVyZmFsbCA9IHdhdGVyZmFsbDsgLy8gPHNjcmlwdD5cblx0ICB9XG5cdH0pKHRoaXMpO1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqL30uY2FsbChleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKDExKS5zZXRJbW1lZGlhdGUsIF9fd2VicGFja19yZXF1aXJlX18oMTMpKSlcblxuLyoqKi8gfSksXG4vKiAxMSAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdHZhciBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseTtcblxuXHQvLyBET00gQVBJcywgZm9yIGNvbXBsZXRlbmVzc1xuXG5cdGV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuXHQgIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldFRpbWVvdXQsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcblx0fTtcblx0ZXhwb3J0cy5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuXHQgIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFySW50ZXJ2YWwpO1xuXHR9O1xuXHRleHBvcnRzLmNsZWFyVGltZW91dCA9XG5cdGV4cG9ydHMuY2xlYXJJbnRlcnZhbCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHtcblx0ICBpZiAodGltZW91dCkge1xuXHQgICAgdGltZW91dC5jbG9zZSgpO1xuXHQgIH1cblx0fTtcblxuXHRmdW5jdGlvbiBUaW1lb3V0KGlkLCBjbGVhckZuKSB7XG5cdCAgdGhpcy5faWQgPSBpZDtcblx0ICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcblx0fVxuXHRUaW1lb3V0LnByb3RvdHlwZS51bnJlZiA9IFRpbWVvdXQucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge307XG5cdFRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdCAgdGhpcy5fY2xlYXJGbi5jYWxsKHdpbmRvdywgdGhpcy5faWQpO1xuXHR9O1xuXG5cdC8vIERvZXMgbm90IHN0YXJ0IHRoZSB0aW1lLCBqdXN0IHNldHMgdXAgdGhlIG1lbWJlcnMgbmVlZGVkLlxuXHRleHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG5cdCAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXHQgIGl0ZW0uX2lkbGVUaW1lb3V0ID0gbXNlY3M7XG5cdH07XG5cblx0ZXhwb3J0cy51bmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0ICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cdCAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcblx0fTtcblxuXHRleHBvcnRzLl91bnJlZkFjdGl2ZSA9IGV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuXHQgIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuXHQgIHZhciBtc2VjcyA9IGl0ZW0uX2lkbGVUaW1lb3V0O1xuXHQgIGlmIChtc2VjcyA+PSAwKSB7XG5cdCAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG5cdCAgICAgIGlmIChpdGVtLl9vblRpbWVvdXQpXG5cdCAgICAgICAgaXRlbS5fb25UaW1lb3V0KCk7XG5cdCAgICB9LCBtc2Vjcyk7XG5cdCAgfVxuXHR9O1xuXG5cdC8vIHNldGltbWVkaWF0ZSBhdHRhY2hlcyBpdHNlbGYgdG8gdGhlIGdsb2JhbCBvYmplY3Rcblx0X193ZWJwYWNrX3JlcXVpcmVfXygxMik7XG5cdGV4cG9ydHMuc2V0SW1tZWRpYXRlID0gc2V0SW1tZWRpYXRlO1xuXHRleHBvcnRzLmNsZWFySW1tZWRpYXRlID0gY2xlYXJJbW1lZGlhdGU7XG5cblxuLyoqKi8gfSksXG4vKiAxMiAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqLyhmdW5jdGlvbihnbG9iYWwsIHByb2Nlc3MpIHsoZnVuY3Rpb24gKGdsb2JhbCwgdW5kZWZpbmVkKSB7XG5cdCAgICBcInVzZSBzdHJpY3RcIjtcblxuXHQgICAgaWYgKGdsb2JhbC5zZXRJbW1lZGlhdGUpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIHZhciBuZXh0SGFuZGxlID0gMTsgLy8gU3BlYyBzYXlzIGdyZWF0ZXIgdGhhbiB6ZXJvXG5cdCAgICB2YXIgdGFza3NCeUhhbmRsZSA9IHt9O1xuXHQgICAgdmFyIGN1cnJlbnRseVJ1bm5pbmdBVGFzayA9IGZhbHNlO1xuXHQgICAgdmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcblx0ICAgIHZhciByZWdpc3RlckltbWVkaWF0ZTtcblxuXHQgICAgZnVuY3Rpb24gc2V0SW1tZWRpYXRlKGNhbGxiYWNrKSB7XG5cdCAgICAgIC8vIENhbGxiYWNrIGNhbiBlaXRoZXIgYmUgYSBmdW5jdGlvbiBvciBhIHN0cmluZ1xuXHQgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0ICAgICAgICBjYWxsYmFjayA9IG5ldyBGdW5jdGlvbihcIlwiICsgY2FsbGJhY2spO1xuXHQgICAgICB9XG5cdCAgICAgIC8vIENvcHkgZnVuY3Rpb24gYXJndW1lbnRzXG5cdCAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcblx0ICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXTtcblx0ICAgICAgfVxuXHQgICAgICAvLyBTdG9yZSBhbmQgcmVnaXN0ZXIgdGhlIHRhc2tcblx0ICAgICAgdmFyIHRhc2sgPSB7IGNhbGxiYWNrOiBjYWxsYmFjaywgYXJnczogYXJncyB9O1xuXHQgICAgICB0YXNrc0J5SGFuZGxlW25leHRIYW5kbGVdID0gdGFzaztcblx0ICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUobmV4dEhhbmRsZSk7XG5cdCAgICAgIHJldHVybiBuZXh0SGFuZGxlKys7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGNsZWFySW1tZWRpYXRlKGhhbmRsZSkge1xuXHQgICAgICAgIGRlbGV0ZSB0YXNrc0J5SGFuZGxlW2hhbmRsZV07XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIHJ1bih0YXNrKSB7XG5cdCAgICAgICAgdmFyIGNhbGxiYWNrID0gdGFzay5jYWxsYmFjaztcblx0ICAgICAgICB2YXIgYXJncyA9IHRhc2suYXJncztcblx0ICAgICAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG5cdCAgICAgICAgY2FzZSAwOlxuXHQgICAgICAgICAgICBjYWxsYmFjaygpO1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICBjYXNlIDE6XG5cdCAgICAgICAgICAgIGNhbGxiYWNrKGFyZ3NbMF0pO1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICBjYXNlIDI6XG5cdCAgICAgICAgICAgIGNhbGxiYWNrKGFyZ3NbMF0sIGFyZ3NbMV0pO1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICBjYXNlIDM6XG5cdCAgICAgICAgICAgIGNhbGxiYWNrKGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0pO1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh1bmRlZmluZWQsIGFyZ3MpO1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIHJ1bklmUHJlc2VudChoYW5kbGUpIHtcblx0ICAgICAgICAvLyBGcm9tIHRoZSBzcGVjOiBcIldhaXQgdW50aWwgYW55IGludm9jYXRpb25zIG9mIHRoaXMgYWxnb3JpdGhtIHN0YXJ0ZWQgYmVmb3JlIHRoaXMgb25lIGhhdmUgY29tcGxldGVkLlwiXG5cdCAgICAgICAgLy8gU28gaWYgd2UncmUgY3VycmVudGx5IHJ1bm5pbmcgYSB0YXNrLCB3ZSdsbCBuZWVkIHRvIGRlbGF5IHRoaXMgaW52b2NhdGlvbi5cblx0ICAgICAgICBpZiAoY3VycmVudGx5UnVubmluZ0FUYXNrKSB7XG5cdCAgICAgICAgICAgIC8vIERlbGF5IGJ5IGRvaW5nIGEgc2V0VGltZW91dC4gc2V0SW1tZWRpYXRlIHdhcyB0cmllZCBpbnN0ZWFkLCBidXQgaW4gRmlyZWZveCA3IGl0IGdlbmVyYXRlZCBhXG5cdCAgICAgICAgICAgIC8vIFwidG9vIG11Y2ggcmVjdXJzaW9uXCIgZXJyb3IuXG5cdCAgICAgICAgICAgIHNldFRpbWVvdXQocnVuSWZQcmVzZW50LCAwLCBoYW5kbGUpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciB0YXNrID0gdGFza3NCeUhhbmRsZVtoYW5kbGVdO1xuXHQgICAgICAgICAgICBpZiAodGFzaykge1xuXHQgICAgICAgICAgICAgICAgY3VycmVudGx5UnVubmluZ0FUYXNrID0gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcnVuKHRhc2spO1xuXHQgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcblx0ICAgICAgICAgICAgICAgICAgICBjbGVhckltbWVkaWF0ZShoYW5kbGUpO1xuXHQgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRseVJ1bm5pbmdBVGFzayA9IGZhbHNlO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBpbnN0YWxsTmV4dFRpY2tJbXBsZW1lbnRhdGlvbigpIHtcblx0ICAgICAgICByZWdpc3RlckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuXHQgICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHsgcnVuSWZQcmVzZW50KGhhbmRsZSk7IH0pO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGNhblVzZVBvc3RNZXNzYWdlKCkge1xuXHQgICAgICAgIC8vIFRoZSB0ZXN0IGFnYWluc3QgYGltcG9ydFNjcmlwdHNgIHByZXZlbnRzIHRoaXMgaW1wbGVtZW50YXRpb24gZnJvbSBiZWluZyBpbnN0YWxsZWQgaW5zaWRlIGEgd2ViIHdvcmtlcixcblx0ICAgICAgICAvLyB3aGVyZSBgZ2xvYmFsLnBvc3RNZXNzYWdlYCBtZWFucyBzb21ldGhpbmcgY29tcGxldGVseSBkaWZmZXJlbnQgYW5kIGNhbid0IGJlIHVzZWQgZm9yIHRoaXMgcHVycG9zZS5cblx0ICAgICAgICBpZiAoZ2xvYmFsLnBvc3RNZXNzYWdlICYmICFnbG9iYWwuaW1wb3J0U2NyaXB0cykge1xuXHQgICAgICAgICAgICB2YXIgcG9zdE1lc3NhZ2VJc0FzeW5jaHJvbm91cyA9IHRydWU7XG5cdCAgICAgICAgICAgIHZhciBvbGRPbk1lc3NhZ2UgPSBnbG9iYWwub25tZXNzYWdlO1xuXHQgICAgICAgICAgICBnbG9iYWwub25tZXNzYWdlID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZUlzQXN5bmNocm9ub3VzID0gZmFsc2U7XG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIGdsb2JhbC5wb3N0TWVzc2FnZShcIlwiLCBcIipcIik7XG5cdCAgICAgICAgICAgIGdsb2JhbC5vbm1lc3NhZ2UgPSBvbGRPbk1lc3NhZ2U7XG5cdCAgICAgICAgICAgIHJldHVybiBwb3N0TWVzc2FnZUlzQXN5bmNocm9ub3VzO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gaW5zdGFsbFBvc3RNZXNzYWdlSW1wbGVtZW50YXRpb24oKSB7XG5cdCAgICAgICAgLy8gSW5zdGFsbHMgYW4gZXZlbnQgaGFuZGxlciBvbiBgZ2xvYmFsYCBmb3IgdGhlIGBtZXNzYWdlYCBldmVudDogc2VlXG5cdCAgICAgICAgLy8gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9ET00vd2luZG93LnBvc3RNZXNzYWdlXG5cdCAgICAgICAgLy8gKiBodHRwOi8vd3d3LndoYXR3Zy5vcmcvc3BlY3Mvd2ViLWFwcHMvY3VycmVudC13b3JrL211bHRpcGFnZS9jb21tcy5odG1sI2Nyb3NzRG9jdW1lbnRNZXNzYWdlc1xuXG5cdCAgICAgICAgdmFyIG1lc3NhZ2VQcmVmaXggPSBcInNldEltbWVkaWF0ZSRcIiArIE1hdGgucmFuZG9tKCkgKyBcIiRcIjtcblx0ICAgICAgICB2YXIgb25HbG9iYWxNZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgICAgICAgICAgaWYgKGV2ZW50LnNvdXJjZSA9PT0gZ2xvYmFsICYmXG5cdCAgICAgICAgICAgICAgICB0eXBlb2YgZXZlbnQuZGF0YSA9PT0gXCJzdHJpbmdcIiAmJlxuXHQgICAgICAgICAgICAgICAgZXZlbnQuZGF0YS5pbmRleE9mKG1lc3NhZ2VQcmVmaXgpID09PSAwKSB7XG5cdCAgICAgICAgICAgICAgICBydW5JZlByZXNlbnQoK2V2ZW50LmRhdGEuc2xpY2UobWVzc2FnZVByZWZpeC5sZW5ndGgpKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBpZiAoZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIpIHtcblx0ICAgICAgICAgICAgZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIG9uR2xvYmFsTWVzc2FnZSwgZmFsc2UpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGdsb2JhbC5hdHRhY2hFdmVudChcIm9ubWVzc2FnZVwiLCBvbkdsb2JhbE1lc3NhZ2UpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG5cdCAgICAgICAgICAgIGdsb2JhbC5wb3N0TWVzc2FnZShtZXNzYWdlUHJlZml4ICsgaGFuZGxlLCBcIipcIik7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gaW5zdGFsbE1lc3NhZ2VDaGFubmVsSW1wbGVtZW50YXRpb24oKSB7XG5cdCAgICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcblx0ICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICAgICAgICAgIHZhciBoYW5kbGUgPSBldmVudC5kYXRhO1xuXHQgICAgICAgICAgICBydW5JZlByZXNlbnQoaGFuZGxlKTtcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcblx0ICAgICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZShoYW5kbGUpO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGluc3RhbGxSZWFkeVN0YXRlQ2hhbmdlSW1wbGVtZW50YXRpb24oKSB7XG5cdCAgICAgICAgdmFyIGh0bWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXHQgICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG5cdCAgICAgICAgICAgIC8vIENyZWF0ZSBhIDxzY3JpcHQ+IGVsZW1lbnQ7IGl0cyByZWFkeXN0YXRlY2hhbmdlIGV2ZW50IHdpbGwgYmUgZmlyZWQgYXN5bmNocm9ub3VzbHkgb25jZSBpdCBpcyBpbnNlcnRlZFxuXHQgICAgICAgICAgICAvLyBpbnRvIHRoZSBkb2N1bWVudC4gRG8gc28sIHRodXMgcXVldWluZyB1cCB0aGUgdGFzay4gUmVtZW1iZXIgdG8gY2xlYW4gdXAgb25jZSBpdCdzIGJlZW4gY2FsbGVkLlxuXHQgICAgICAgICAgICB2YXIgc2NyaXB0ID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG5cdCAgICAgICAgICAgIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICBydW5JZlByZXNlbnQoaGFuZGxlKTtcblx0ICAgICAgICAgICAgICAgIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xuXHQgICAgICAgICAgICAgICAgaHRtbC5yZW1vdmVDaGlsZChzY3JpcHQpO1xuXHQgICAgICAgICAgICAgICAgc2NyaXB0ID0gbnVsbDtcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgaHRtbC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGluc3RhbGxTZXRUaW1lb3V0SW1wbGVtZW50YXRpb24oKSB7XG5cdCAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcblx0ICAgICAgICAgICAgc2V0VGltZW91dChydW5JZlByZXNlbnQsIDAsIGhhbmRsZSk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgLy8gSWYgc3VwcG9ydGVkLCB3ZSBzaG91bGQgYXR0YWNoIHRvIHRoZSBwcm90b3R5cGUgb2YgZ2xvYmFsLCBzaW5jZSB0aGF0IGlzIHdoZXJlIHNldFRpbWVvdXQgZXQgYWwuIGxpdmUuXG5cdCAgICB2YXIgYXR0YWNoVG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKGdsb2JhbCk7XG5cdCAgICBhdHRhY2hUbyA9IGF0dGFjaFRvICYmIGF0dGFjaFRvLnNldFRpbWVvdXQgPyBhdHRhY2hUbyA6IGdsb2JhbDtcblxuXHQgICAgLy8gRG9uJ3QgZ2V0IGZvb2xlZCBieSBlLmcuIGJyb3dzZXJpZnkgZW52aXJvbm1lbnRzLlxuXHQgICAgaWYgKHt9LnRvU3RyaW5nLmNhbGwoZ2xvYmFsLnByb2Nlc3MpID09PSBcIltvYmplY3QgcHJvY2Vzc11cIikge1xuXHQgICAgICAgIC8vIEZvciBOb2RlLmpzIGJlZm9yZSAwLjlcblx0ICAgICAgICBpbnN0YWxsTmV4dFRpY2tJbXBsZW1lbnRhdGlvbigpO1xuXG5cdCAgICB9IGVsc2UgaWYgKGNhblVzZVBvc3RNZXNzYWdlKCkpIHtcblx0ICAgICAgICAvLyBGb3Igbm9uLUlFMTAgbW9kZXJuIGJyb3dzZXJzXG5cdCAgICAgICAgaW5zdGFsbFBvc3RNZXNzYWdlSW1wbGVtZW50YXRpb24oKTtcblxuXHQgICAgfSBlbHNlIGlmIChnbG9iYWwuTWVzc2FnZUNoYW5uZWwpIHtcblx0ICAgICAgICAvLyBGb3Igd2ViIHdvcmtlcnMsIHdoZXJlIHN1cHBvcnRlZFxuXHQgICAgICAgIGluc3RhbGxNZXNzYWdlQ2hhbm5lbEltcGxlbWVudGF0aW9uKCk7XG5cblx0ICAgIH0gZWxzZSBpZiAoZG9jICYmIFwib25yZWFkeXN0YXRlY2hhbmdlXCIgaW4gZG9jLmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIikpIHtcblx0ICAgICAgICAvLyBGb3IgSUUgNuKAkzhcblx0ICAgICAgICBpbnN0YWxsUmVhZHlTdGF0ZUNoYW5nZUltcGxlbWVudGF0aW9uKCk7XG5cblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgLy8gRm9yIG9sZGVyIGJyb3dzZXJzXG5cdCAgICAgICAgaW5zdGFsbFNldFRpbWVvdXRJbXBsZW1lbnRhdGlvbigpO1xuXHQgICAgfVxuXG5cdCAgICBhdHRhY2hUby5zZXRJbW1lZGlhdGUgPSBzZXRJbW1lZGlhdGU7XG5cdCAgICBhdHRhY2hUby5jbGVhckltbWVkaWF0ZSA9IGNsZWFySW1tZWRpYXRlO1xuXHR9KHR5cGVvZiBzZWxmID09PSBcInVuZGVmaW5lZFwiID8gdHlwZW9mIGdsb2JhbCA9PT0gXCJ1bmRlZmluZWRcIiA/IHRoaXMgOiBnbG9iYWwgOiBzZWxmKSk7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKGV4cG9ydHMsIChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0oKSksIF9fd2VicGFja19yZXF1aXJlX18oMTMpKSlcblxuLyoqKi8gfSksXG4vKiAxMyAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdFxuXG4vKioqLyB9KSxcbi8qIDE0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBMb2FkZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDE1KTtcblxuXHR2YXIgUHJlY29tcGlsZWRMb2FkZXIgPSBMb2FkZXIuZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uKGNvbXBpbGVkVGVtcGxhdGVzKSB7XG5cdCAgICAgICAgdGhpcy5wcmVjb21waWxlZCA9IGNvbXBpbGVkVGVtcGxhdGVzIHx8IHt9O1xuXHQgICAgfSxcblxuXHQgICAgZ2V0U291cmNlOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgaWYgKHRoaXMucHJlY29tcGlsZWRbbmFtZV0pIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHtcblx0ICAgICAgICAgICAgICAgIHNyYzogeyB0eXBlOiAnY29kZScsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgb2JqOiB0aGlzLnByZWNvbXBpbGVkW25hbWVdIH0sXG5cdCAgICAgICAgICAgICAgICBwYXRoOiBuYW1lXG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBudWxsO1xuXHQgICAgfVxuXHR9KTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IFByZWNvbXBpbGVkTG9hZGVyO1xuXG5cbi8qKiovIH0pLFxuLyogMTUgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIHBhdGggPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgT2JqID0gX193ZWJwYWNrX3JlcXVpcmVfXyg2KTtcblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cblx0dmFyIExvYWRlciA9IE9iai5leHRlbmQoe1xuXHQgICAgb246IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpIHtcblx0ICAgICAgICB0aGlzLmxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzIHx8IHt9O1xuXHQgICAgICAgIHRoaXMubGlzdGVuZXJzW25hbWVdID0gdGhpcy5saXN0ZW5lcnNbbmFtZV0gfHwgW107XG5cdCAgICAgICAgdGhpcy5saXN0ZW5lcnNbbmFtZV0ucHVzaChmdW5jKTtcblx0ICAgIH0sXG5cblx0ICAgIGVtaXQ6IGZ1bmN0aW9uKG5hbWUgLyosIGFyZzEsIGFyZzIsIC4uLiovKSB7XG5cdCAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG5cdCAgICAgICAgaWYodGhpcy5saXN0ZW5lcnMgJiYgdGhpcy5saXN0ZW5lcnNbbmFtZV0pIHtcblx0ICAgICAgICAgICAgbGliLmVhY2godGhpcy5saXN0ZW5lcnNbbmFtZV0sIGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG5cdCAgICAgICAgICAgICAgICBsaXN0ZW5lci5hcHBseShudWxsLCBhcmdzKTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgcmVzb2x2ZTogZnVuY3Rpb24oZnJvbSwgdG8pIHtcblx0ICAgICAgICByZXR1cm4gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShmcm9tKSwgdG8pO1xuXHQgICAgfSxcblxuXHQgICAgaXNSZWxhdGl2ZTogZnVuY3Rpb24oZmlsZW5hbWUpIHtcblx0ICAgICAgICByZXR1cm4gKGZpbGVuYW1lLmluZGV4T2YoJy4vJykgPT09IDAgfHwgZmlsZW5hbWUuaW5kZXhPZignLi4vJykgPT09IDApO1xuXHQgICAgfVxuXHR9KTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IExvYWRlcjtcblxuXG4vKioqLyB9KSxcbi8qIDE2ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0ZnVuY3Rpb24gaW5zdGFsbENvbXBhdCgpIHtcblx0ICAgICd1c2Ugc3RyaWN0JztcblxuXHQgICAgLy8gVGhpcyBtdXN0IGJlIGNhbGxlZCBsaWtlIGBudW5qdWNrcy5pbnN0YWxsQ29tcGF0YCBzbyB0aGF0IGB0aGlzYFxuXHQgICAgLy8gcmVmZXJlbmNlcyB0aGUgbnVuanVja3MgaW5zdGFuY2Vcblx0ICAgIHZhciBydW50aW1lID0gdGhpcy5ydW50aW1lOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgIHZhciBsaWIgPSB0aGlzLmxpYjsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cdCAgICB2YXIgQ29tcGlsZXIgPSB0aGlzLmNvbXBpbGVyLkNvbXBpbGVyOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgIHZhciBQYXJzZXIgPSB0aGlzLnBhcnNlci5QYXJzZXI7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgICAgdmFyIG5vZGVzID0gdGhpcy5ub2RlczsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cdCAgICB2YXIgbGV4ZXIgPSB0aGlzLmxleGVyOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblxuXHQgICAgdmFyIG9yaWdfY29udGV4dE9yRnJhbWVMb29rdXAgPSBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwO1xuXHQgICAgdmFyIG9yaWdfQ29tcGlsZXJfYXNzZXJ0VHlwZSA9IENvbXBpbGVyLnByb3RvdHlwZS5hc3NlcnRUeXBlO1xuXHQgICAgdmFyIG9yaWdfUGFyc2VyX3BhcnNlQWdncmVnYXRlID0gUGFyc2VyLnByb3RvdHlwZS5wYXJzZUFnZ3JlZ2F0ZTtcblx0ICAgIHZhciBvcmlnX21lbWJlckxvb2t1cCA9IHJ1bnRpbWUubWVtYmVyTG9va3VwO1xuXG5cdCAgICBmdW5jdGlvbiB1bmluc3RhbGwoKSB7XG5cdCAgICAgICAgcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cCA9IG9yaWdfY29udGV4dE9yRnJhbWVMb29rdXA7XG5cdCAgICAgICAgQ29tcGlsZXIucHJvdG90eXBlLmFzc2VydFR5cGUgPSBvcmlnX0NvbXBpbGVyX2Fzc2VydFR5cGU7XG5cdCAgICAgICAgUGFyc2VyLnByb3RvdHlwZS5wYXJzZUFnZ3JlZ2F0ZSA9IG9yaWdfUGFyc2VyX3BhcnNlQWdncmVnYXRlO1xuXHQgICAgICAgIHJ1bnRpbWUubWVtYmVyTG9va3VwID0gb3JpZ19tZW1iZXJMb29rdXA7XG5cdCAgICB9XG5cblx0ICAgIHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAgPSBmdW5jdGlvbihjb250ZXh0LCBmcmFtZSwga2V5KSB7XG5cdCAgICAgICAgdmFyIHZhbCA9IG9yaWdfY29udGV4dE9yRnJhbWVMb29rdXAuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgc3dpdGNoIChrZXkpIHtcblx0ICAgICAgICAgICAgY2FzZSAnVHJ1ZSc6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblx0ICAgICAgICAgICAgY2FzZSAnRmFsc2UnOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgICAgICBjYXNlICdOb25lJzpcblx0ICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgIH07XG5cblx0ICAgIHZhciBTbGljZSA9IG5vZGVzLk5vZGUuZXh0ZW5kKCdTbGljZScsIHtcblx0ICAgICAgICBmaWVsZHM6IFsnc3RhcnQnLCAnc3RvcCcsICdzdGVwJ10sXG5cdCAgICAgICAgaW5pdDogZnVuY3Rpb24obGluZW5vLCBjb2xubywgc3RhcnQsIHN0b3AsIHN0ZXApIHtcblx0ICAgICAgICAgICAgc3RhcnQgPSBzdGFydCB8fCBuZXcgbm9kZXMuTGl0ZXJhbChsaW5lbm8sIGNvbG5vLCBudWxsKTtcblx0ICAgICAgICAgICAgc3RvcCA9IHN0b3AgfHwgbmV3IG5vZGVzLkxpdGVyYWwobGluZW5vLCBjb2xubywgbnVsbCk7XG5cdCAgICAgICAgICAgIHN0ZXAgPSBzdGVwIHx8IG5ldyBub2Rlcy5MaXRlcmFsKGxpbmVubywgY29sbm8sIDEpO1xuXHQgICAgICAgICAgICB0aGlzLnBhcmVudChsaW5lbm8sIGNvbG5vLCBzdGFydCwgc3RvcCwgc3RlcCk7XG5cdCAgICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIENvbXBpbGVyLnByb3RvdHlwZS5hc3NlcnRUeXBlID0gZnVuY3Rpb24obm9kZSkge1xuXHQgICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgU2xpY2UpIHtcblx0ICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gb3JpZ19Db21waWxlcl9hc3NlcnRUeXBlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICB9O1xuXHQgICAgQ29tcGlsZXIucHJvdG90eXBlLmNvbXBpbGVTbGljZSA9IGZ1bmN0aW9uKG5vZGUsIGZyYW1lKSB7XG5cdCAgICAgICAgdGhpcy5lbWl0KCcoJyk7XG5cdCAgICAgICAgdGhpcy5fY29tcGlsZUV4cHJlc3Npb24obm9kZS5zdGFydCwgZnJhbWUpO1xuXHQgICAgICAgIHRoaXMuZW1pdCgnKSwoJyk7XG5cdCAgICAgICAgdGhpcy5fY29tcGlsZUV4cHJlc3Npb24obm9kZS5zdG9wLCBmcmFtZSk7XG5cdCAgICAgICAgdGhpcy5lbWl0KCcpLCgnKTtcblx0ICAgICAgICB0aGlzLl9jb21waWxlRXhwcmVzc2lvbihub2RlLnN0ZXAsIGZyYW1lKTtcblx0ICAgICAgICB0aGlzLmVtaXQoJyknKTtcblx0ICAgIH07XG5cblx0ICAgIGZ1bmN0aW9uIGdldFRva2Vuc1N0YXRlKHRva2Vucykge1xuXHQgICAgICAgIHJldHVybiB7XG5cdCAgICAgICAgICAgIGluZGV4OiB0b2tlbnMuaW5kZXgsXG5cdCAgICAgICAgICAgIGxpbmVubzogdG9rZW5zLmxpbmVubyxcblx0ICAgICAgICAgICAgY29sbm86IHRva2Vucy5jb2xub1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIFBhcnNlci5wcm90b3R5cGUucGFyc2VBZ2dyZWdhdGUgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cdCAgICAgICAgdmFyIG9yaWdTdGF0ZSA9IGdldFRva2Vuc1N0YXRlKHRoaXMudG9rZW5zKTtcblx0ICAgICAgICAvLyBTZXQgYmFjayBvbmUgYWNjb3VudGluZyBmb3Igb3BlbmluZyBicmFja2V0L3BhcmVuc1xuXHQgICAgICAgIG9yaWdTdGF0ZS5jb2xuby0tO1xuXHQgICAgICAgIG9yaWdTdGF0ZS5pbmRleC0tO1xuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIHJldHVybiBvcmlnX1BhcnNlcl9wYXJzZUFnZ3JlZ2F0ZS5hcHBseSh0aGlzKTtcblx0ICAgICAgICB9IGNhdGNoKGUpIHtcblx0ICAgICAgICAgICAgdmFyIGVyclN0YXRlID0gZ2V0VG9rZW5zU3RhdGUodGhpcy50b2tlbnMpO1xuXHQgICAgICAgICAgICB2YXIgcmV0aHJvdyA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgICAgbGliLmV4dGVuZChzZWxmLnRva2VucywgZXJyU3RhdGUpO1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGU7XG5cdCAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgLy8gUmVzZXQgdG8gc3RhdGUgYmVmb3JlIG9yaWdpbmFsIHBhcnNlQWdncmVnYXRlIGNhbGxlZFxuXHQgICAgICAgICAgICBsaWIuZXh0ZW5kKHRoaXMudG9rZW5zLCBvcmlnU3RhdGUpO1xuXHQgICAgICAgICAgICB0aGlzLnBlZWtlZCA9IGZhbHNlO1xuXG5cdCAgICAgICAgICAgIHZhciB0b2sgPSB0aGlzLnBlZWtUb2tlbigpO1xuXHQgICAgICAgICAgICBpZiAodG9rLnR5cGUgIT09IGxleGVyLlRPS0VOX0xFRlRfQlJBQ0tFVCkge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgcmV0aHJvdygpO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHZhciBub2RlID0gbmV3IFNsaWNlKHRvay5saW5lbm8sIHRvay5jb2xubyk7XG5cblx0ICAgICAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZW5jb3VudGVyIGEgY29sb24gd2hpbGUgcGFyc2luZywgdGhpcyBpcyBub3QgYSBzbGljZSxcblx0ICAgICAgICAgICAgLy8gc28gcmUtcmFpc2UgdGhlIG9yaWdpbmFsIGV4Y2VwdGlvbi5cblx0ICAgICAgICAgICAgdmFyIGlzU2xpY2UgPSBmYWxzZTtcblxuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBub2RlLmZpZWxkcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2tpcChsZXhlci5UT0tFTl9SSUdIVF9CUkFDS0VUKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgaWYgKGkgPT09IG5vZGUuZmllbGRzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChpc1NsaWNlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmFpbCgncGFyc2VTbGljZTogdG9vIG1hbnkgc2xpY2UgY29tcG9uZW50cycsIHRvay5saW5lbm8sIHRvay5jb2xubyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2tpcChsZXhlci5UT0tFTl9DT0xPTikpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpc1NsaWNlID0gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkID0gbm9kZS5maWVsZHNbaV07XG5cdCAgICAgICAgICAgICAgICAgICAgbm9kZVtmaWVsZF0gPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXHQgICAgICAgICAgICAgICAgICAgIGlzU2xpY2UgPSB0aGlzLnNraXAobGV4ZXIuVE9LRU5fQ09MT04pIHx8IGlzU2xpY2U7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYgKCFpc1NsaWNlKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyByZXRocm93KCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5BcnJheSh0b2subGluZW5vLCB0b2suY29sbm8sIFtub2RlXSk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgZnVuY3Rpb24gc2xpY2VMb29rdXAob2JqLCBzdGFydCwgc3RvcCwgc3RlcCkge1xuXHQgICAgICAgIG9iaiA9IG9iaiB8fCBbXTtcblx0ICAgICAgICBpZiAoc3RhcnQgPT09IG51bGwpIHtcblx0ICAgICAgICAgICAgc3RhcnQgPSAoc3RlcCA8IDApID8gKG9iai5sZW5ndGggLSAxKSA6IDA7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGlmIChzdG9wID09PSBudWxsKSB7XG5cdCAgICAgICAgICAgIHN0b3AgPSAoc3RlcCA8IDApID8gLTEgOiBvYmoubGVuZ3RoO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGlmIChzdG9wIDwgMCkge1xuXHQgICAgICAgICAgICAgICAgc3RvcCArPSBvYmoubGVuZ3RoO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHN0YXJ0IDwgMCkge1xuXHQgICAgICAgICAgICBzdGFydCArPSBvYmoubGVuZ3RoO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciByZXN1bHRzID0gW107XG5cblx0ICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQ7IDsgaSArPSBzdGVwKSB7XG5cdCAgICAgICAgICAgIGlmIChpIDwgMCB8fCBpID4gb2JqLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYgKHN0ZXAgPiAwICYmIGkgPj0gc3RvcCkge1xuXHQgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYgKHN0ZXAgPCAwICYmIGkgPD0gc3RvcCkge1xuXHQgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJ1bnRpbWUubWVtYmVyTG9va3VwKG9iaiwgaSkpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gcmVzdWx0cztcblx0ICAgIH1cblxuXHQgICAgdmFyIEFSUkFZX01FTUJFUlMgPSB7XG5cdCAgICAgICAgcG9wOiBmdW5jdGlvbihpbmRleCkge1xuXHQgICAgICAgICAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucG9wKCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYgKGluZGV4ID49IHRoaXMubGVuZ3RoIHx8IGluZGV4IDwgMCkge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdLZXlFcnJvcicpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLnNwbGljZShpbmRleCwgMSk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZWxlbWVudCk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gZWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNwbGljZShpLCAxKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlRXJyb3InKTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGNvdW50OiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgICAgICBjb3VudCsrO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBjb3VudDtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGluZGV4OiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgICAgICAgIHZhciBpO1xuXHQgICAgICAgICAgICBpZiAoKGkgPSB0aGlzLmluZGV4T2YoZWxlbWVudCkpID09PSAtMSkge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZUVycm9yJyk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIGk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBmaW5kOiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4T2YoZWxlbWVudCk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBpbnNlcnQ6IGZ1bmN0aW9uKGluZGV4LCBlbGVtKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLnNwbGljZShpbmRleCwgMCwgZWxlbSk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblx0ICAgIHZhciBPQkpFQ1RfTUVNQkVSUyA9IHtcblx0ICAgICAgICBpdGVtczogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHZhciByZXQgPSBbXTtcblx0ICAgICAgICAgICAgZm9yKHZhciBrIGluIHRoaXMpIHtcblx0ICAgICAgICAgICAgICAgIHJldC5wdXNoKFtrLCB0aGlzW2tdXSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHJldDtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIHZhbHVlczogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHZhciByZXQgPSBbXTtcblx0ICAgICAgICAgICAgZm9yKHZhciBrIGluIHRoaXMpIHtcblx0ICAgICAgICAgICAgICAgIHJldC5wdXNoKHRoaXNba10pO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiByZXQ7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBrZXlzOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuXHQgICAgICAgICAgICBmb3IodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgICAgICAgICAgcmV0LnB1c2goayk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHJldDtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGdldDogZnVuY3Rpb24oa2V5LCBkZWYpIHtcblx0ICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXNba2V5XTtcblx0ICAgICAgICAgICAgaWYgKG91dHB1dCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICBvdXRwdXQgPSBkZWY7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGhhc19rZXk6IGZ1bmN0aW9uKGtleSkge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5oYXNPd25Qcm9wZXJ0eShrZXkpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgcG9wOiBmdW5jdGlvbihrZXksIGRlZikge1xuXHQgICAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpc1trZXldO1xuXHQgICAgICAgICAgICBpZiAob3V0cHV0ID09PSB1bmRlZmluZWQgJiYgZGVmICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIG91dHB1dCA9IGRlZjtcblx0ICAgICAgICAgICAgfSBlbHNlIGlmIChvdXRwdXQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdLZXlFcnJvcicpO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXNba2V5XTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgcG9waXRlbTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBmaXJzdCBvYmplY3QgcGFpci5cblx0ICAgICAgICAgICAgICAgIHZhciB2YWwgPSB0aGlzW2tdO1xuXHQgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXNba107XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gW2ssIHZhbF07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdLZXlFcnJvcicpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgc2V0ZGVmYXVsdDogZnVuY3Rpb24oa2V5LCBkZWYpIHtcblx0ICAgICAgICAgICAgaWYgKGtleSBpbiB0aGlzKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1trZXldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmIChkZWYgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgZGVmID0gbnVsbDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gdGhpc1trZXldID0gZGVmO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihrd2FyZ3MpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgayBpbiBrd2FyZ3MpIHtcblx0ICAgICAgICAgICAgICAgIHRoaXNba10gPSBrd2FyZ3Nba107XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIG51bGw7ICAgIC8vIEFsd2F5cyByZXR1cm5zIE5vbmVcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXHQgICAgT0JKRUNUX01FTUJFUlMuaXRlcml0ZW1zID0gT0JKRUNUX01FTUJFUlMuaXRlbXM7XG5cdCAgICBPQkpFQ1RfTUVNQkVSUy5pdGVydmFsdWVzID0gT0JKRUNUX01FTUJFUlMudmFsdWVzO1xuXHQgICAgT0JKRUNUX01FTUJFUlMuaXRlcmtleXMgPSBPQkpFQ1RfTUVNQkVSUy5rZXlzO1xuXHQgICAgcnVudGltZS5tZW1iZXJMb29rdXAgPSBmdW5jdGlvbihvYmosIHZhbCwgYXV0b2VzY2FwZSkgeyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gNCkge1xuXHQgICAgICAgICAgICByZXR1cm4gc2xpY2VMb29rdXAuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgb2JqID0gb2JqIHx8IHt9O1xuXG5cdCAgICAgICAgLy8gSWYgdGhlIG9iamVjdCBpcyBhbiBvYmplY3QsIHJldHVybiBhbnkgb2YgdGhlIG1ldGhvZHMgdGhhdCBQeXRob24gd291bGRcblx0ICAgICAgICAvLyBvdGhlcndpc2UgcHJvdmlkZS5cblx0ICAgICAgICBpZiAobGliLmlzQXJyYXkob2JqKSAmJiBBUlJBWV9NRU1CRVJTLmhhc093blByb3BlcnR5KHZhbCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge3JldHVybiBBUlJBWV9NRU1CRVJTW3ZhbF0uYXBwbHkob2JqLCBhcmd1bWVudHMpO307XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKGxpYi5pc09iamVjdChvYmopICYmIE9CSkVDVF9NRU1CRVJTLmhhc093blByb3BlcnR5KHZhbCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge3JldHVybiBPQkpFQ1RfTUVNQkVSU1t2YWxdLmFwcGx5KG9iaiwgYXJndW1lbnRzKTt9O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBvcmlnX21lbWJlckxvb2t1cC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgfTtcblxuXHQgICAgcmV0dXJuIHVuaW5zdGFsbDtcblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzID0gaW5zdGFsbENvbXBhdDtcblxuXG4vKioqLyB9KVxuLyoqKioqKi8gXSlcbn0pO1xuOyIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSkge1xub3V0cHV0ICs9IFwiXFxuPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX2VsZW1lbnRcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJodG1sXCIpKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cXG5cIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblwiO1xuaWYoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aXRsZVwiKSB8fCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiZGVzY3JpcHRpb25cIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSB8fCAoIXJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJodG1sXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aHVtYm5haWxfdXJsXCIpKSkpIHtcbm91dHB1dCArPSBcIlxcbjxhcnRpY2xlIGNsYXNzPVxcXCJpdGVtLS1lbWJlZCBpdGVtLS1lbWJlZF9fd3JhcHBlclxcXCI+XFxuICAgIFwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJodG1sXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aHVtYm5haWxfdXJsXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGEgaHJlZj1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ1cmxcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCIgY2xhc3M9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZSgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImRlc2NyaXB0aW9uXCIpP1wiaXRlbS0tZW1iZWRfX2lsbHVzdHJhdGlvblwiOlwiaXRlbS0tZW1iZWRfX29ubHktaWxsdXN0cmF0aW9uXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XFxuICAgICAgICA8aW1nIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aHVtYm5haWxfdXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIvPlxcbiAgIDwvYT5cXG4gICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInRpdGxlXCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJkZXNjcmlwdGlvblwiKSB8fCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY3JlZGl0XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICA8ZGl2IGNsYXNzPVxcXCJpdGVtLS1lbWJlZF9faW5mb1xcXCI+XFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aXRsZVwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpdGVtLS1lbWJlZF9fdGl0bGVcXFwiPlxcbiAgICAgICAgICAgIDxhIGhyZWY9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiIHRpdGxlPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInRpdGxlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aXRsZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2E+XFxuICAgICAgICA8L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJkZXNjcmlwdGlvblwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpdGVtLS1lbWJlZF9fZGVzY3JpcHRpb25cXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiZGVzY3JpcHRpb25cIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9kaXY+XFxuICAgICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY3JlZGl0XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcIml0ZW0tLWVtYmVkX19jcmVkaXRcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY3JlZGl0XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcbiAgICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgPC9kaXY+XFxuICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuPC9hcnRpY2xlPlxcblwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXCI7XG5pZihwYXJlbnRUZW1wbGF0ZSkge1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSBlbHNlIHtcbmNiKG51bGwsIG91dHB1dCk7XG59XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbnJvb3Q6IHJvb3Rcbn07XG5cbn0pKCk7XG5yZXR1cm4gZnVuY3Rpb24oY3R4LCBjYikgeyByZXR1cm4gbnVuanVja3MucmVuZGVyKFwidGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sXCIsIGN0eCwgY2IpOyB9XG59KSgpO1xuO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCJdID0gKGZ1bmN0aW9uKCkge1xuZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIHBhcmVudFRlbXBsYXRlID0gbnVsbDtcbm91dHB1dCArPSBcIjxmaWd1cmU+XFxuICA8aW1nIFxcbiAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJhY3RpdmVcIikpIHtcbm91dHB1dCArPSBcImNsYXNzPVxcXCJhY3RpdmVcXFwiXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwidGh1bWJuYWlsXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIlxcbiAgICBzcmNzZXQ9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJiYXNlSW1hZ2VcIikpLFwiaHJlZlwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCIgODEwdywgXFxuICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJ0aHVtYm5haWxcIikpLFwiaHJlZlwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCIgMjQwdywgXFxuICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJ2aWV3SW1hZ2VcIikpLFwiaHJlZlwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCIgNTQwd1xcXCIgXFxuICAgIGFsdD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjYXB0aW9uXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XFxuICA8ZmlnY2FwdGlvbj5cXG4gICAgPHNwYW4gbmctaWY9XFxcInJlZi5pdGVtLm1ldGEuY2FwdGlvblxcXCIgY2xhc3M9XFxcImNhcHRpb25cXFwiPlxcbiAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY2FwdGlvblwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgPC9zcGFuPiZuYnNwO1xcbiAgICA8c3BhbiBuZy1pZj1cXFwicmVmLml0ZW0ubWV0YS5jcmVkaXRcXFwiIGNsYXNzPVxcXCJjcmVkaXRcXFwiPlxcbiAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY3JlZGl0XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICA8L3NwYW4+XFxuICA8L2ZpZ2NhcHRpb24+XFxuPC9maWd1cmU+XFxuXFxuXCI7XG5pZihwYXJlbnRUZW1wbGF0ZSkge1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSBlbHNlIHtcbmNiKG51bGwsIG91dHB1dCk7XG59XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbnJvb3Q6IHJvb3Rcbn07XG5cbn0pKCk7XG5yZXR1cm4gZnVuY3Rpb24oY3R4LCBjYikgeyByZXR1cm4gbnVuanVja3MucmVuZGVyKFwidGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIsIGN0eCwgY2IpOyB9XG59KSgpO1xuO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtcG9zdC5odG1sXCJdID0gKGZ1bmN0aW9uKCkge1xuZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIHBhcmVudFRlbXBsYXRlID0gbnVsbDtcbm91dHB1dCArPSBcIjwhLS0gc3RpY2t5IHBvc2l0aW9uIHRvZ2dsZSAtLT5cXG5cIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwidG9wXCIpIHtcbm91dHB1dCArPSBcIlxcbjxhcnRpY2xlXFxuICBjbGFzcz1cXFwibGItc3RpY2t5LXRvcC1wb3N0IGxpc3QtZ3JvdXAtaXRlbSBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJwb3N0X2l0ZW1zX3R5cGVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIlxcbiAgZGF0YS1qcy1wb3N0LWlkPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfaWRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG48YXJ0aWNsZVxcbiAgY2xhc3M9XFxcImxiLXBvc3QgbGlzdC1ncm91cC1pdGVtIHNob3ctYXV0aG9yLWF2YXRhciBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJwb3N0X2l0ZW1zX3R5cGVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIlxcbiAgZGF0YS1qcy1wb3N0LWlkPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfaWRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG5cXG5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJzdGlja3lcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJsYi10eXBlXFxcIj48L2Rpdj5cXG4gICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9waW5wb3N0LnN2Z1xcXCIgY2xhc3M9XFxcImxiLXBvc3QtcGluXFxcIiAvPlxcbiAgXCI7XG47XG59XG5lbHNlIHtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwibGJfaGlnaGxpZ2h0XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGRpdiBjbGFzcz1cXFwibGItdHlwZSBsYi1wb3N0LWhpZ2hsaWdodGVkXFxcIj48L2Rpdj5cXG4gIFwiO1xuO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInBvc3RfaXRlbXNfdHlwZVwiKSA9PSBcImFkdmVydGlzZW1lbnRcIikge1xub3V0cHV0ICs9IFwiXFxuICA8ZGl2IGNsYXNzPVxcXCJsYi1hZHZlcnRpc2VtZW50XFxcIj5BZHZlcnRpc2VtZW50PC9kaXY+XFxuICBcIjtcbjtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLXR5cGUgbGItdHlwZS0tdGV4dFxcXCI+PC9kaXY+XFxuICBcIjtcbjtcbn1cbjtcbn1cbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgPCEtLSByZW1vdmUgYWR2ZXJ0aXNlbWVudCBzdHlsaXphdGlvbi0tPlxcbiAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInBvc3RfaXRlbXNfdHlwZVwiKSAhPSBcImFkdmVydGlzZW1lbnRcIikge1xub3V0cHV0ICs9IFwiXFxuXFxuICA8ZGl2IGNsYXNzPVxcXCJsYi1wb3N0LWRhdGVcXFwiIGRhdGEtanMtdGltZXN0YW1wPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfdXBkYXRlZFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcIl91cGRhdGVkXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcblxcbiAgPCEtLSBhdXRob3IgcGx1cyBhdmF0YXIgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJsYi1hdXRob3JcXFwiPlxcbiAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dBdXRob3JcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJwdWJsaXNoZXJcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcImxiLWF1dGhvcl9fbmFtZVxcXCI+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInB1Ymxpc2hlclwiKSksXCJkaXNwbGF5X25hbWVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9kaXY+XFxuICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93QXV0aG9yQXZhdGFyXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicHVibGlzaGVyXCIpKSxcInBpY3R1cmVfdXJsXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxpbWcgY2xhc3M9XFxcImxiLWF1dGhvcl9fYXZhdGFyXFxcIiBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJwdWJsaXNoZXJcIikpLFwicGljdHVyZV91cmxcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIiAvPlxcbiAgICAgICAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yX19hdmF0YXJcXFwiPjwvZGl2PlxcbiAgICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgPC9kaXY+XFxuICA8IS0tIGVuZCBhdXRob3IgLS0+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgPCEtLSBlbmQgc3RpY2t5IHBvc2l0aW9uIHRvZ2dsZSAtLT5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICA8IS0tIGVuZCByZW1vdmUgYWR2ZXJ0aXNlbWVudCBzdHlsaXphdGlvbi0tPlxcblxcbiAgPCEtLSBpdGVtIHN0YXJ0IC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwiaXRlbXMtY29udGFpbmVyXFxcIj5cXG4gICAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzMgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpO1xuaWYodF8zKSB7dmFyIHRfMiA9IHRfMy5sZW5ndGg7XG5mb3IodmFyIHRfMT0wOyB0XzEgPCB0XzMubGVuZ3RoOyB0XzErKykge1xudmFyIHRfNCA9IHRfM1t0XzFdO1xuZnJhbWUuc2V0KFwicmVmXCIsIHRfNCk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4XCIsIHRfMSArIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleDBcIiwgdF8xKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF8yIC0gdF8xKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXgwXCIsIHRfMiAtIHRfMSAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5maXJzdFwiLCB0XzEgPT09IDApO1xuZnJhbWUuc2V0KFwibG9vcC5sYXN0XCIsIHRfMSA9PT0gdF8yIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmxlbmd0aFwiLCB0XzIpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcImltYWdlXCIpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcIlwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwiYm90dG9tXCIpIHtcbm91dHB1dCArPSBcImxiLWl0ZW1cIjtcbjtcbn1cbm91dHB1dCArPSBcIiBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJvcmlnaW5hbFwiKSksXCJoZWlnaHRcIikgPiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwib3JpZ2luYWxcIikpLFwid2lkdGhcIikpIHtcbm91dHB1dCArPSBcInBvcnRyYWl0XCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInN0aWNreVwiKSB8fCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzdGlja3lQb3NpdGlvblwiKSA9PSBcImJvdHRvbVwiKSB7XG5vdXRwdXQgKz0gXCJsYi1pdGVtXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwiZW1iZWRcIikge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF83LHRfNSkge1xuaWYodF83KSB7IGNiKHRfNyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzUpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF84LHRfNikge1xuaWYodF84KSB7IGNiKHRfOCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzYpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xufSk7XG59XG5lbHNlIHtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwiaW1hZ2VcIikge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8xMSx0XzkpIHtcbmlmKHRfMTEpIHsgY2IodF8xMSk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzkpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8xMix0XzEwKSB7XG5pZih0XzEyKSB7IGNiKHRfMTIpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xMCk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJxdW90ZVwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1xdW90ZS5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzE1LHRfMTMpIHtcbmlmKHRfMTUpIHsgY2IodF8xNSk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzEzKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMTYsdF8xNCkge1xuaWYodF8xNikgeyBjYih0XzE2KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTQpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xufSk7XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICA8YXJ0aWNsZT5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcInRleHRcIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvYXJ0aWNsZT5cXG4gICAgICAgIFwiO1xuO1xufVxuO1xufVxuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgPC9kaXY+XFxuICAgIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgPC9kaXY+XFxuICA8IS0tIGl0ZW0gZW5kIC0tPlxcblxcbjwvYXJ0aWNsZT5cXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG5vdXRwdXQgKz0gXCI8ZGl2IGlkPVxcXCJzbGlkZXNob3dcXFwiPlxcbiAgPGRpdiBjbGFzcz1cXFwiY29udGFpbmVyXFxcIj5cXG4gICAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzMgPSBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZnNcIik7XG5pZih0XzMpIHt2YXIgdF8yID0gdF8zLmxlbmd0aDtcbmZvcih2YXIgdF8xPTA7IHRfMSA8IHRfMy5sZW5ndGg7IHRfMSsrKSB7XG52YXIgdF80ID0gdF8zW3RfMV07XG5mcmFtZS5zZXQoXCJyZWZcIiwgdF80KTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF8xICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzIgLSB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF8yIC0gdF8xIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfMSA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF8xID09PSB0XzIgLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfMik7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtc2xpZGVzaG93Lmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF83LHRfNSkge1xuaWYodF83KSB7IGNiKHRfNyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzUpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF84LHRfNikge1xuaWYodF84KSB7IGNiKHRfOCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzYpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG59KTtcbn1cbn1cbmZyYW1lID0gZnJhbWUucG9wKCk7XG5vdXRwdXQgKz0gXCJcXG4gIDwvZGl2PlxcbiAgPGJ1dHRvbiBjbGFzcz1cXFwiY2xvc2VcXFwiPlg8L2J1dHRvbj5cXG4gIDxidXR0b24gY2xhc3M9XFxcImZ1bGxzY3JlZW5cXFwiPkZ1bGxzY3JlZW48L2J1dHRvbj5cXG4gIDxidXR0b24gY2xhc3M9XFxcImFycm93cyBwcmV2XFxcIj4mbHQ7PC9idXR0b24+XFxuICA8YnV0dG9uIGNsYXNzPVxcXCJhcnJvd3MgbmV4dFxcXCI+Jmd0OzwvYnV0dG9uPlxcbjwvZGl2PlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLXNsaWRlc2hvdy5odG1sXCIsIGN0eCwgY2IpOyB9XG59KSgpO1xuO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG4ocGFyZW50VGVtcGxhdGUgPyBmdW5jdGlvbihlLCBjLCBmLCByLCBjYikgeyBjYihcIlwiKTsgfSA6IGNvbnRleHQuZ2V0QmxvY2soXCJ0aW1lbGluZVwiKSkoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgZnVuY3Rpb24odF8yLHRfMSkge1xuaWYodF8yKSB7IGNiKHRfMik7IHJldHVybjsgfVxub3V0cHV0ICs9IHRfMTtcbm91dHB1dCArPSBcIlxcblxcblwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWVtYmVkLXByb3ZpZGVycy5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF81LHRfMykge1xuaWYodF81KSB7IGNiKHRfNSk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzMpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF82LHRfNCkge1xuaWYodF82KSB7IGNiKHRfNik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzQpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG5cXG5cIjtcbmlmKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaW5jbHVkZV9qc19vcHRpb25zXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gIDxzY3JpcHQgdHlwZT1cXFwidGV4dC9qYXZhc2NyaXB0XFxcIj5cXG4gICAgd2luZG93LkxCID0gXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKGVudi5nZXRGaWx0ZXIoXCJzYWZlXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJqc29uX29wdGlvbnNcIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjtcXG4gIDwvc2NyaXB0PlxcblwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXCI7XG5pZihwYXJlbnRUZW1wbGF0ZSkge1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSBlbHNlIHtcbmNiKG51bGwsIG91dHB1dCk7XG59XG59KX0pO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbmZ1bmN0aW9uIGJfdGltZWxpbmUoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBmcmFtZSA9IGZyYW1lLnB1c2godHJ1ZSk7XG5vdXRwdXQgKz0gXCJcXG48ZGl2IGNsYXNzPVxcXCJsYi10aW1lbGluZSBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwibGFuZ3VhZ2VcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd1RpdGxlXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwidGl0bGVcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8aDE+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwidGl0bGVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9oMT5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dEZXNjcmlwdGlvblwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcImRlc2NyaXB0aW9uXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGRpdiBjbGFzcz1cXFwiZGVzY3JpcHRpb25cXFwiPlxcbiAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwiZGVzY3JpcHRpb25cIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICA8L2Rpdj5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dJbWFnZVwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcInBpY3R1cmVfdXJsXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcInBpY3R1cmVfdXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgLz5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwidG9wXCIgJiYgZW52LmdldEZpbHRlcihcImxlbmd0aFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwic3RpY2t5UG9zdHNcIikpLFwiX2l0ZW1zXCIpKSA+IDApIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJ0aW1lbGluZS10b3AgdGltZWxpbmUtdG9wLS1sb2FkZWRcXFwiPlxcbiAgICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJsYi1wb3N0cyBsaXN0LWdyb3VwXFxcIj5cXG4gICAgICAgIFwiO1xuZnJhbWUgPSBmcmFtZS5wdXNoKCk7XG52YXIgdF85ID0gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJzdGlja3lQb3N0c1wiKSksXCJfaXRlbXNcIik7XG5pZih0XzkpIHt2YXIgdF84ID0gdF85Lmxlbmd0aDtcbmZvcih2YXIgdF83PTA7IHRfNyA8IHRfOS5sZW5ndGg7IHRfNysrKSB7XG52YXIgdF8xMCA9IHRfOVt0XzddO1xuZnJhbWUuc2V0KFwiaXRlbVwiLCB0XzEwKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF83ICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzcpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzggLSB0XzcpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF84IC0gdF83IC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfNyA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF83ID09PSB0XzggLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfOCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHRfMTApLFwiZGVsZXRlZFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8xMyx0XzExKSB7XG5pZih0XzEzKSB7IGNiKHRfMTMpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xMSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzE0LHRfMTIpIHtcbmlmKHRfMTQpIHsgY2IodF8xNCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzEyKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIDwvc2VjdGlvbj5cXG4gICAgPC9kaXY+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgPCEtLSBIZWFkZXIgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJoZWFkZXItYmFyXFxcIj5cXG4gICAgPGRpdiBjbGFzcz1cXFwic29ydGluZy1iYXJcXFwiPlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcInNvcnRpbmctYmFyX19vcmRlcnNcXFwiPlxcbiAgICAgICAgPGRpdlxcbiAgICAgICAgICBjbGFzcz1cXFwic29ydGluZy1iYXJfX29yZGVyIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwicG9zdE9yZGVyXCIpID09IFwiZWRpdG9yaWFsXCIpIHtcbm91dHB1dCArPSBcInNvcnRpbmctYmFyX19vcmRlci0tYWN0aXZlXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiXFxuICAgICAgICAgIGRhdGEtanMtb3JkZXJieV9lZGl0b3JpYWw+XFxuICAgICAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwib3B0aW9uc1wiKSksXCJsMTBuXCIpKSxcImVkaXRvcmlhbFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICAgPGRpdlxcbiAgICAgICAgICBjbGFzcz1cXFwic29ydGluZy1iYXJfX29yZGVyIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwicG9zdE9yZGVyXCIpID09IFwibmV3ZXN0X2ZpcnN0XCIpIHtcbm91dHB1dCArPSBcInNvcnRpbmctYmFyX19vcmRlci0tYWN0aXZlXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiXFxuICAgICAgICAgIGRhdGEtanMtb3JkZXJieV9kZXNjZW5kaW5nPlxcbiAgICAgICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm9wdGlvbnNcIikpLFwibDEwblwiKSksXCJkZXNjZW5kaW5nXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICA8ZGl2XFxuICAgICAgICAgIGNsYXNzPVxcXCJzb3J0aW5nLWJhcl9fb3JkZXIgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJwb3N0T3JkZXJcIikgPT0gXCJvbGRlc3RfZmlyc3RcIikge1xub3V0cHV0ICs9IFwic29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmVcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCJcXG4gICAgICAgICAgZGF0YS1qcy1vcmRlcmJ5X2FzY2VuZGluZz5cXG4gICAgICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJvcHRpb25zXCIpKSxcImwxMG5cIikpLFwiYXNjZW5kaW5nXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgPC9kaXY+XFxuICAgIDwvZGl2PlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJoZWFkZXItYmFyX19hY3Rpb25zXFxcIj48L2Rpdj5cXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcImNhbkNvbW1lbnRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cXFwiaGVhZGVyLWJhcl9fY29tbWVudFxcXCIgZGF0YS1qcy1zaG93LWNvbW1lbnQtZGlhbG9nPkNvbW1lbnQ8L2J1dHRvbj5cXG4gICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0xpdmVibG9nTG9nb1wiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8YSBjbGFzcz1cXFwiaGVhZGVyLWJhcl9fbG9nb1xcXCIgaHJlZj1cXFwiaHR0cHM6Ly93d3cubGl2ZWJsb2cucHJvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+XFxuICAgICAgICAgIDxzcGFuPlBvd2VyZWQgYnk8L3NwYW4+XFxuICAgICAgICAgIDxpbWcgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhc3NldHNfcm9vdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJpbWFnZXMvbGItbG9nby5zdmdcXFwiIC8+XFxuICAgICAgICA8L2E+XFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgPC9kaXY+XFxuICA8IS0tIEhlYWRlciBFbmQgLS0+XFxuXFxuICA8IS0tIENvbW1lbnQgLS0+XFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcImNhbkNvbW1lbnRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1jb21tZW50Lmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzE3LHRfMTUpIHtcbmlmKHRfMTcpIHsgY2IodF8xNyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzE1KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMTgsdF8xNikge1xuaWYodF8xOCkgeyBjYih0XzE4KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTYpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwhLS0gQ29tbWVudCBFbmQgLS0+XFxuXFxuICA8IS0tIFRpbWVsaW5lIC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwidGltZWxpbmUtYm9keSB0aW1lbGluZS1ib2R5LS1sb2FkZWRcXFwiPlxcbiAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwiYm90dG9tXCIgJiYgZW52LmdldEZpbHRlcihcImxlbmd0aFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwic3RpY2t5UG9zdHNcIikpLFwiX2l0ZW1zXCIpKSA+IDApIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJsYi1wb3N0cyBsaXN0LWdyb3VwIHN0aWNreVxcXCI+XFxuICAgICAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMjEgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInN0aWNreVBvc3RzXCIpKSxcIl9pdGVtc1wiKTtcbmlmKHRfMjEpIHt2YXIgdF8yMCA9IHRfMjEubGVuZ3RoO1xuZm9yKHZhciB0XzE5PTA7IHRfMTkgPCB0XzIxLmxlbmd0aDsgdF8xOSsrKSB7XG52YXIgdF8yMiA9IHRfMjFbdF8xOV07XG5mcmFtZS5zZXQoXCJpdGVtXCIsIHRfMjIpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleFwiLCB0XzE5ICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzE5KTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF8yMCAtIHRfMTkpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF8yMCAtIHRfMTkgLSAxKTtcbmZyYW1lLnNldChcImxvb3AuZmlyc3RcIiwgdF8xOSA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF8xOSA9PT0gdF8yMCAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5sZW5ndGhcIiwgdF8yMCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHRfMjIpLFwiZGVsZXRlZFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8yNSx0XzIzKSB7XG5pZih0XzI1KSB7IGNiKHRfMjUpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8yMyk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzI2LHRfMjQpIHtcbmlmKHRfMjYpIHsgY2IodF8yNik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzI0KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIDwvc2VjdGlvbj5cXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG5pZihlbnYuZ2V0RmlsdGVyKFwibGVuZ3RoXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJwb3N0c1wiKSksXCJfaXRlbXNcIikpID09IDApIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcImxiLXBvc3QgZW1wdHktbWVzc2FnZVxcXCI+XFxuICAgICAgICA8ZGl2PkJsb2cgcG9zdHMgYXJlIG5vdCBjdXJyZW50bHkgYXZhaWxhYmxlLjwvZGl2PlxcbiAgICAgIDwvZGl2PlxcbiAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8c2VjdGlvbiBjbGFzcz1cXFwibGItcG9zdHMgbGlzdC1ncm91cCBub3JtYWxcXFwiPlxcbiAgICAgICAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzI5ID0gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJwb3N0c1wiKSksXCJfaXRlbXNcIik7XG5pZih0XzI5KSB7dmFyIHRfMjggPSB0XzI5Lmxlbmd0aDtcbmZvcih2YXIgdF8yNz0wOyB0XzI3IDwgdF8yOS5sZW5ndGg7IHRfMjcrKykge1xudmFyIHRfMzAgPSB0XzI5W3RfMjddO1xuZnJhbWUuc2V0KFwiaXRlbVwiLCB0XzMwKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF8yNyArIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleDBcIiwgdF8yNyk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4XCIsIHRfMjggLSB0XzI3KTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXgwXCIsIHRfMjggLSB0XzI3IC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfMjcgPT09IDApO1xuZnJhbWUuc2V0KFwibG9vcC5sYXN0XCIsIHRfMjcgPT09IHRfMjggLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfMjgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzMwKSxcImRlbGV0ZWRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMzMsdF8zMSkge1xuaWYodF8zMykgeyBjYih0XzMzKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMzEpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8zNCx0XzMyKSB7XG5pZih0XzM0KSB7IGNiKHRfMzQpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8zMik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbn0pO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbjtcbn1cbn1cbmZyYW1lID0gZnJhbWUucG9wKCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8L3NlY3Rpb24+XFxuICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJwb3N0c1wiKSksXCJfbWV0YVwiKSksXCJtYXhfcmVzdWx0c1wiKSA8PSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJwb3N0c1wiKSksXCJfbWV0YVwiKSksXCJ0b3RhbFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8YnV0dG9uIGNsYXNzPVxcXCJsYi1idXR0b24gbG9hZC1tb3JlLXBvc3RzXFxcIiBkYXRhLWpzLWxvYWRtb3JlPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwib3B0aW9uc1wiKSksXCJsMTBuXCIpKSxcImxvYWROZXdQb3N0c1wiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2J1dHRvbj5cXG4gICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgPC9kaXY+XFxuICA8IS0tIFRpbWVsaW5lIEVuZCAtLT5cXG5cXG48L2Rpdj5cXG5cIjtcbmNiKG51bGwsIG91dHB1dCk7XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbmJfdGltZWxpbmU6IGJfdGltZWxpbmUsXG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iXX0=
