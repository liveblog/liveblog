(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/mihai/Sourcefabric/liveblog-default-theme/js/liveblog.js":[function(require,module,exports){
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

},{"./theme":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/index.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/handlers.js":[function(require,module,exports){
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
      loadSort('ascending');
    },

    "[data-js-orderby_descending]": function dataJsOrderby_descending() {
      loadSort('descending');
    },

    "[data-js-orderby_editorial]": function dataJsOrderby_editorial() {
      loadSort('editorial');
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
    view.attachPermalink();
    if (view.permalink._changedSort) {
      loadSort(LB.settings.postOrder).then(checkForScroll);
    } else {
      checkForScroll();
    }
  }
};

function loadSort(sortBy) {
  // initialy on server sort params are set as newest_first, oldest_first
  // on client we dont use this, so this is temp fix
  switch (sortBy) {
    case 'oldest_first':
    case 'ascending':
      sortBy = 'ascending';
      break;
    case 'newest_first':
    case 'descending':
      sortBy = 'descending';
      break;
    default:
      sortBy = 'editorial';
  }

  return viewmodel.loadPosts({ sort: sortBy }).then(view.renderTimeline).then(view.displayNewPosts).then(view.toggleSortBtn(sortBy)).catch(catchError);
}

function checkForScroll() {
  viewmodel.getAllPosts().then(function (posts) {
    if (view.checkPermalink(posts)) {
      loadForScroll();
    }
  });
}

function loadForScroll() {
  if (!view.permalinkScroll()) {
    viewmodel.loadPostsPage().then(view.renderPosts).then(view.displayNewPosts).then(loadForScroll).catch(catchError);
  }
}

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

},{"./helpers":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/helpers.js","./view":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/view.js","./viewmodel":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/viewmodel.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/helpers.js":[function(require,module,exports){
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

},{"moment":"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/moment/moment.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/index.js":[function(require,module,exports){
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

},{"./handlers":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/handlers.js","./local-analytics":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/local-analytics.js","./pageview":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/pageview.js","./view":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/view.js","./viewmodel":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/viewmodel.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/local-analytics.js":[function(require,module,exports){
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

},{}],"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/pageview.js":[function(require,module,exports){
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

},{}],"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/permalink.js":[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Permalink = function () {
  function Permalink() {
    _classCallCheck(this, Permalink);

    this.escapeRegExp = function (string) {
      return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    };

    this.PARAM_NAME = 'liveblog._id', // the parameter name for permalink.  
    this.regexHash = new RegExp(this.escapeRegExp(this.PARAM_NAME) + '=([^&#]*)');

    if (document.parent) {
      // use document parent if avalible, see iframe cors limitation.
      try {
        this.href = document.location.href;
      } catch (e) {
        // if not use the referrer of the iframe.
        this.href = document.referrer;
      }
    } else {
      this.href = document.location.href; // use this option if it is access directly not via iframe.
    }

    var matches = this.href.match(this.regexHash);

    if (matches) {
      var arr = decodeURIComponent(matches[1]).split('->');
      this._id = arr[0];
      if (LB.settings.postOrder !== arr[1]) {
        LB.settings.postOrder = arr[1];
        this._changedSort = true;
      }
    }
  }

  _createClass(Permalink, [{
    key: 'getUrl',
    value: function getUrl(id) {
      var permalink = false,
          DELIMITER = LB.settings.permalinkDelimiter || '?',
          // delimiter can be `?` or `#`.
      newHash = this.PARAM_NAME + '=' + id + '->' + LB.settings.postOrder;

      if (this.href.indexOf(DELIMITER) === -1) {
        permalink = this.href + DELIMITER + newHash;
      } else if (this.href.indexOf(this.PARAM_NAME + '=') !== -1) {
        permalink = this.href.replace(this.regexHash, newHash);
      } else {
        permalink = this.href + '&' + newHash;
      }

      return permalink;
    }
  }]);

  return Permalink;
}();

module.exports = Permalink;

},{}],"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/slideshow.js":[function(require,module,exports){
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

        var caption = '',
            credit = '';

        if (img.parentNode.querySelector('span.caption')) {
          caption = img.parentNode.querySelector('span.caption').textContent;
        }

        if (img.parentNode.querySelector('span.credit')) {
          credit = img.parentNode.querySelector('span.credit').textContent;
        }

        items.push({
          item: {
            meta: {
              media: { renditions: {
                  baseImage: { href: baseImage },
                  thumbnail: { href: thumbnail },
                  viewImage: { href: viewImage }
                } },
              caption: caption,
              credit: credit
            },
            active: thumbnail === e.target.getAttribute('src')
          }
        });
      });

      var slideshow = templates.slideshow({
        refs: items,
        assets_root: window.LB.assets_root
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

},{"./templates":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/templates.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/templates.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var nunjucks = require("nunjucks/browser/nunjucks-slim");
var settings = window.LB.settings;

var defaultTemplates = {
  post: require("../../templates/template-post.html"),
  timeline: require("../../templates/template-timeline.html"),
  postComment: require("../../templates/template-post-comment.html"),
  itemImage: require("../../templates/template-item-image.html"),
  itemEmbed: require("../../templates/template-item-embed.html"),
  itemQuote: require("../../templates/template-item-quote.html"),
  itemComment: require("../../templates/template-item-comment.html"),
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

},{"../../templates/template-item-comment.html":"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-item-comment.html","../../templates/template-item-embed.html":"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-item-embed.html","../../templates/template-item-image.html":"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-item-image.html","../../templates/template-item-quote.html":"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-item-quote.html","../../templates/template-post-comment.html":"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-post-comment.html","../../templates/template-post.html":"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-post.html","../../templates/template-slideshow.html":"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-slideshow.html","../../templates/template-timeline.html":"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-timeline.html","nunjucks/browser/nunjucks-slim":"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/view.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var helpers = require('./helpers');
var templates = require('./templates');
var Slideshow = require('./slideshow');
var Permalink = require('./permalink');

var timelineElem = document.querySelectorAll(".lb-posts.normal"),
    loadMorePostsButton = helpers.getElems("load-more-posts");

var permalink = new Permalink();

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
      settings: window.LB.settings,
      assets_root: window.LB.assets_root
    }));
  });
  timelineElem[0].innerHTML = renderedPosts.join("");
  updateTimestamps();
  loadEmbeds();
  attachSlideshow();
  attachPermalink();
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

    if (!api_response.requestOpts.page && post.deleted) {
      deletePost(post._id);
      return; // early
    }

    var renderedPost = templates.post({
      item: post,
      settings: window.LB.settings,
      assets_root: window.LB.assets_root
    });

    if (!api_response.requestOpts.page && post.operation === "update") {
      updatePost(post._id, renderedPost);
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
  attachPermalink();
}

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function deletePost(postId) {
  var elem = helpers.getElems('[data-js-post-id=\"' + postId + '\"]');
  if (elem.length) {
    elem[0].remove();
  }
}

/**
 * Delete post <article> DOM node by data attribute.
 * @param {string} - a post URN
 */
function updatePost(postId, renderedPost) {
  var elem = helpers.getElems('[data-js-post-id=\"' + postId + '\"]');
  if (elem.length) {
    elem[0].outerHTML = renderedPost;
    attachSlideshow();
    attachPermalink();
  }
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

function attachPermalink() {
  var permalinks = document.querySelectorAll('.lb-post-permalink a');

  permalinks.forEach(function (link) {
    link.href = permalink.getUrl(link.id);
  });
}

function checkPermalink(posts) {
  var found = false;

  if (permalink._id) {
    posts._items.forEach(function (post) {
      if (permalink._id === post._id) {
        found = true;
      }
    });
  }

  return found;
}

function permalinkScroll() {
  var scrollElem;
  var found = false;

  scrollElem = helpers.getElems('[data-js-post-id=\"' + permalink._id + '\"]');

  if (scrollElem.length > 0) {
    scrollElem[0].classList.add('lb-post-permalink-selected');
    scrollElem[0].scrollIntoView();
    found = true;
  }

  return found;
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
  attachSlideshow: attachSlideshow,
  attachPermalink: attachPermalink,
  checkPermalink: checkPermalink,
  permalinkScroll: permalinkScroll,
  permalink: permalink
};

},{"./helpers":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/helpers.js","./permalink":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/permalink.js","./slideshow":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/slideshow.js","./templates":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/templates.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/viewmodel.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var helpers = require('./helpers'),
    view = require('./view');

var apiHost = LB.api_host.match(/\/$/i) ? LB.api_host : LB.api_host + '/';
var commentItemEndpoint = apiHost + 'api/client_items';
var commentPostEndpoint = apiHost + 'api/client_comments';

var endpoint = apiHost + "api/client_blogs/" + LB.blog._id + "/posts",
    settings = LB.settings,
    vm = {};

var latestUpdate = void 0;
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
 * Private API request method
 * @returns {object} Liveblog 3 API response
 */
vm.getAllPosts = function () {
  var self = this;

  var dbQuery = self.getQuery({});

  var qs = "?source=",
      fullPath = endpoint + qs + dbQuery;

  return helpers.getJSON(fullPath);
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
  //opts.fromDate = this.vm.latestUpdate || new Date().toISOString();
  return this.getPosts(opts);
};

/**
 * Add items in api response & latest update timestamp to viewmodel.
 * @param {object} api_response - liveblog API response JSON.
 */
vm.updateViewModel = function (api_response, opts) {
  var self = this;

  if (!opts.fromDate || opts.sort && opts.sort !== self.settings.postOrder) {
    // Means we're not polling
    view.hideLoadMore(self.isTimelineEnd(api_response)); // the end?
  } else {
    // Means we're polling for new posts
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

  if (opts.sort) {
    self.settings.postOrder = opts.sort;
  }

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
  latestUpdate = new Date().toISOString();
  this.vm.timeInitialized = new Date().toISOString();

  setInterval(function () {
    vm.loadPosts({ fromDate: latestUpdate }).then(view.renderPosts) // Start polling
    .then(function () {
      latestUpdate = new Date().toISOString();
    });
  }, 10 * 1000);

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
vm.getQuery = function (opts) {
  var query = {
    "query": {
      "filtered": {
        "filter": {
          "and": [{ "term": { "sticky": false } }, { "term": { "post_status": "open" } }, { "not": { "term": { "deleted": true } } }, { "range": { "_updated": { "lt": this.vm ? this.vm.timeInitialized : new Date().toISOString() } } }]
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
  if (!opts.fromDate) {
    query.query.filtered.filter.and.forEach(function (rule, index) {
      if (rule.hasOwnProperty('range')) {
        query.query.filtered.filter.and.splice(index, 1);
      }
    });
  }

  return encodeURI(JSON.stringify(query));
};

module.exports = vm;

},{"./helpers":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/helpers.js","./view":"/home/mihai/Sourcefabric/liveblog-default-theme/js/theme/view.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/moment/moment.js":[function(require,module,exports){
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

},{}],"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js":[function(require,module,exports){
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
},{}],"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-item-comment.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-item-comment.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"items-containerIndent\">\n  <!-- author plus avatar -->\n  <div class=\"lb-author lb-author--indent\">\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showAuthor") && runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"original_creator")) {
output += "\n      ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showAuthorAvatar")) {
output += "\n        <img class=\"lb-author__avatar lb-author__avatar--comment\" src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/comment_icon.svg\">\n        <div class=\"lb-author__name\">\n            Comment by ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"commenter"), env.opts.autoescape);
output += "\n        </div>\n      ";
;
}
output += "\n    ";
;
}
output += "\n  </div>\n   <article>";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"text")), env.opts.autoescape);
output += "</article>\n</div>";
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
return function(ctx, cb) { return nunjucks.render("template-item-comment.html", ctx, cb); }
})();
;

},{"nunjucks/browser/nunjucks-slim":"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-item-embed.html":[function(require,module,exports){
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

},{"nunjucks/browser/nunjucks-slim":"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-item-image.html":[function(require,module,exports){
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
output += "\">\n  <figcaption>\n    ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"caption")) {
output += "\n      <span ng-if=\"ref.item.meta.caption\" class=\"caption\">\n        ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"caption"), env.opts.autoescape);
output += "\n      </span>&nbsp;\n    ";
;
}
output += "\n    ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"credit")) {
output += "\n      <span ng-if=\"ref.item.meta.credit\" class=\"credit\">\n        <b>Credit:</b> ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"credit"), env.opts.autoescape);
output += "\n      </span>\n    ";
;
}
output += "\n  </figcaption>\n</figure>\n\n";
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

},{"nunjucks/browser/nunjucks-slim":"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-item-quote.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-item-quote.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"item--embed-quote\">\n    <blockquote>\n        <p>";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"quote"), env.opts.autoescape);
output += "</p>\n        ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"credit")) {
output += "\n            <h4>";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"credit"), env.opts.autoescape);
output += "</h4>\n        ";
;
}
output += "\n    </blockquote>\n</div>\n";
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
return function(ctx, cb) { return nunjucks.render("template-item-quote.html", ctx, cb); }
})();
;

},{"nunjucks/browser/nunjucks-slim":"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-post-comment.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-post-comment.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"";
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky") || runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"stickyPosition") == "bottom") {
output += "lb-item";
;
}
output += " commentItem\">\n    <article>";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"groups")),1)),"refs")),0)),"item")),"text")), env.opts.autoescape);
output += "</article>\n</div>\n";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"groups")),1)),"refs")) > 1) {
output += "\n<div class=\"items-containerIndent\">\n";
var t_1;
t_1 = runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"groups")),1)),"refs")),1)),"item");
frame.set("secondary", t_1, true);
if(frame.topLevel) {
context.setVariable("secondary", t_1);
}
if(frame.topLevel) {
context.addExport("secondary", t_1);
}
output += "\n  <!-- author plus avatar -->\n  <div class=\"lb-author lb-author--indent\">\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showAuthor") && runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "secondary")),"original_creator")) {
output += "\n      ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showAuthorAvatar")) {
output += "\n        ";
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "secondary")),"original_creator")),"picture_url")) {
output += "\n        <img class=\"lb-author__avatar\" src=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "secondary")),"original_creator")),"picture_url"), env.opts.autoescape);
output += "\" />\n        ";
;
}
else {
output += "\n        <div class=\"lb-author__avatar\"></div>\n        ";
;
}
output += "\n        <div class=\"lb-author__name\">\n            ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "secondary")),"original_creator")),"display_name"), env.opts.autoescape);
output += "\n        </div>\n      ";
;
}
output += "\n    ";
;
}
output += "\n  </div>\n  <!-- end author -->\n    ";
frame = frame.push();
var t_4 = runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"groups")),1)),"refs");
if(t_4) {var t_3 = t_4.length;
for(var t_2=0; t_2 < t_4.length; t_2++) {
var t_5 = t_4[t_2];
frame.set("ref", t_5);
frame.set("loop.index", t_2 + 1);
frame.set("loop.index0", t_2);
frame.set("loop.revindex", t_3 - t_2);
frame.set("loop.revindex0", t_3 - t_2 - 1);
frame.set("loop.first", t_2 === 0);
frame.set("loop.last", t_2 === t_3 - 1);
frame.set("loop.length", t_3);
output += "\n      ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "loop")),"index0") > 0) {
output += "\n          ";
if(runtime.memberLookup((runtime.memberLookup((t_5),"item")),"item_type") == "image") {
output += "\n          <div class=\"";
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky") || runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"stickyPosition") == "bottom") {
output += "lb-item";
;
}
output += " ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_5),"item")),"meta")),"media")),"renditions")),"original")),"height") > runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_5),"item")),"meta")),"media")),"renditions")),"original")),"width")) {
output += "portrait";
;
}
output += " ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_5),"item")),"item_type"), env.opts.autoescape);
output += "\">\n          ";
;
}
else {
output += "\n          <div class=\"";
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky") || runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"stickyPosition") == "bottom") {
output += "lb-item";
;
}
output += " ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_5),"item")),"item_type"), env.opts.autoescape);
output += "\">\n          ";
;
}
output += "\n            ";
if(runtime.memberLookup((runtime.memberLookup((t_5),"item")),"item_type") == "embed") {
output += "\n              ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-item-embed.html", false, "template-post-comment.html", null, function(t_8,t_6) {
if(t_8) { cb(t_8); return; }
callback(null,t_6);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_9,t_7) {
if(t_9) { cb(t_9); return; }
callback(null,t_7);});
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
else {
if(runtime.memberLookup((runtime.memberLookup((t_5),"item")),"item_type") == "image") {
output += "\n              ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-item-image.html", false, "template-post-comment.html", null, function(t_12,t_10) {
if(t_12) { cb(t_12); return; }
callback(null,t_10);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_13,t_11) {
if(t_13) { cb(t_13); return; }
callback(null,t_11);});
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
else {
if(runtime.memberLookup((runtime.memberLookup((t_5),"item")),"item_type") == "quote") {
output += "\n              ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-item-quote.html", false, "template-post-comment.html", null, function(t_16,t_14) {
if(t_16) { cb(t_16); return; }
callback(null,t_14);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_17,t_15) {
if(t_17) { cb(t_17); return; }
callback(null,t_15);});
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
else {
output += "\n              <article>";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.memberLookup((runtime.memberLookup((t_5),"item")),"text")), env.opts.autoescape);
output += "</article>\n            ";
;
}
;
}
;
}
output += "\n           </div>\n        ";
;
}
output += "\n    ";
;
}
}
frame = frame.pop();
output += "\n</div>\n";
;
}
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
return function(ctx, cb) { return nunjucks.render("template-post-comment.html", ctx, cb); }
})();
;

},{"nunjucks/browser/nunjucks-slim":"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-post.html":[function(require,module,exports){
var nunjucks = require( "nunjucks/browser/nunjucks-slim" );
module.exports = (function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["template-post.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
var t_1;
t_1 = runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"groups")),1)),"refs")),0)),"item");
frame.set("mainItem", t_1, true);
if(frame.topLevel) {
context.setVariable("mainItem", t_1);
}
if(frame.topLevel) {
context.addExport("mainItem", t_1);
}
output += "\n";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "mainItem")),"commenter")) {
output += "\n  ";
var t_2;
t_2 = "comment";
frame.set("type", t_2, true);
if(frame.topLevel) {
context.setVariable("type", t_2);
}
if(frame.topLevel) {
context.addExport("type", t_2);
}
output += "\n";
;
}
else {
output += "\n  ";
var t_3;
t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"post_items_type");
frame.set("type", t_3, true);
if(frame.topLevel) {
context.setVariable("type", t_3);
}
if(frame.topLevel) {
context.addExport("type", t_3);
}
output += "\n";
;
}
output += "\n\n<!-- sticky position toggle -->\n";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky") && runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"stickyPosition") == "top") {
output += "\n<article\n  class=\"lb-sticky-top-post list-group-item ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "type"), env.opts.autoescape);
output += "\"\n  data-js-post-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"_id"), env.opts.autoescape);
output += "\">\n  ";
;
}
else {
output += "\n<article\n  class=\"lb-post list-group-item show-author-avatar ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "type"), env.opts.autoescape);
output += " ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"lb_highlight")) {
output += "lb-post--highlighted";
;
}
output += "\"\n  data-js-post-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"_id"), env.opts.autoescape);
output += "\">\n    \n  <div class=\"lb-type lb-type--";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"post_items_type"), env.opts.autoescape);
output += "\"></div>\n\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky") && runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"lb_highlight")) {
output += "\n    <img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/pinpost.svg\" class=\"pin-icon\" />\n    <img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/highlighted.svg\" class=\"highlight-icon\" />\n  ";
;
}
else {
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky")) {
output += "\n    <img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/pinpost.svg\" class=\"pin-icon\" />\n  ";
;
}
else {
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"lb_highlight")) {
output += "\n    <img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/highlighted.svg\" class=\"highlight-icon\" />\n  ";
;
}
else {
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"post_items_type") == "advertisement") {
output += "\n    <div class=\"lb-advertisement\">Advertisement</div>\n  ";
;
}
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
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showAuthor")) {
output += "\n      <div class=\"lb-author__name\">\n      ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "mainItem")),"commenter")) {
output += "\n        Comment by ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "mainItem")),"commenter"), env.opts.autoescape);
output += "\n      ";
;
}
else {
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "mainItem")),"original_creator")) {
output += "\n        ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "mainItem")),"original_creator")),"display_name"), env.opts.autoescape);
output += "\n      ";
;
}
;
}
output += "\n      </div>\n      ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showAuthorAvatar")) {
output += "\n        ";
if(runtime.contextOrFrameLookup(context, frame, "type") == "comment") {
output += "\n        <img class=\"lb-author__avatar lb-author__avatar--comment\" src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/comment_icon.svg\">\n        ";
;
}
else {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "mainItem")),"original_creator")),"picture_url")) {
output += "\n        <img class=\"lb-author__avatar\" src=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "mainItem")),"original_creator")),"picture_url"), env.opts.autoescape);
output += "\" />\n        ";
;
}
else {
output += "\n        <div class=\"lb-author__avatar\"></div>\n        ";
;
}
;
}
output += "\n      ";
;
}
output += "\n    ";
;
}
output += "\n  </div>\n  <!-- end author -->\n\n  ";
;
}
output += "\n  <!-- end sticky position toggle -->\n  ";
;
}
output += "\n  <!-- end remove advertisement stylization-->\n\n  <!-- item start -->\n  <div class=\"items-container\">\n  ";
if(runtime.contextOrFrameLookup(context, frame, "type") == "comment") {
output += "\n    ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-post-comment.html", false, "template-post.html", null, function(t_6,t_4) {
if(t_6) { cb(t_6); return; }
callback(null,t_4);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_7,t_5) {
if(t_7) { cb(t_7); return; }
callback(null,t_5);});
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
else {
output += "\n    ";
frame = frame.push();
var t_10 = runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"groups")),1)),"refs");
if(t_10) {var t_9 = t_10.length;
for(var t_8=0; t_8 < t_10.length; t_8++) {
var t_11 = t_10[t_8];
frame.set("ref", t_11);
frame.set("loop.index", t_8 + 1);
frame.set("loop.index0", t_8);
frame.set("loop.revindex", t_9 - t_8);
frame.set("loop.revindex0", t_9 - t_8 - 1);
frame.set("loop.first", t_8 === 0);
frame.set("loop.last", t_8 === t_9 - 1);
frame.set("loop.length", t_9);
output += "\n      ";
if(runtime.memberLookup((runtime.memberLookup((t_11),"item")),"item_type") == "image") {
output += "\n      <div class=\"";
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky") || runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"stickyPosition") == "bottom") {
output += "lb-item";
;
}
output += " ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_11),"item")),"meta")),"media")),"renditions")),"original")),"height") > runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_11),"item")),"meta")),"media")),"renditions")),"original")),"width")) {
output += "portrait";
;
}
output += " ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_11),"item")),"item_type"), env.opts.autoescape);
output += "\">\n      ";
;
}
else {
output += "\n      <div class=\"";
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"sticky") || runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"stickyPosition") == "bottom") {
output += "lb-item";
;
}
output += " ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_11),"item")),"item_type"), env.opts.autoescape);
output += "\">\n      ";
;
}
output += "\n        ";
if(runtime.memberLookup((runtime.memberLookup((t_11),"item")),"item_type") == "embed") {
output += "\n          ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-item-embed.html", false, "template-post.html", null, function(t_14,t_12) {
if(t_14) { cb(t_14); return; }
callback(null,t_12);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_15,t_13) {
if(t_15) { cb(t_15); return; }
callback(null,t_13);});
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
if(runtime.memberLookup((runtime.memberLookup((t_11),"item")),"item_type") == "image") {
output += "\n          ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-item-image.html", false, "template-post.html", null, function(t_18,t_16) {
if(t_18) { cb(t_18); return; }
callback(null,t_16);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_19,t_17) {
if(t_19) { cb(t_19); return; }
callback(null,t_17);});
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
if(runtime.memberLookup((runtime.memberLookup((t_11),"item")),"item_type") == "quote") {
output += "\n          ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-item-quote.html", false, "template-post.html", null, function(t_22,t_20) {
if(t_22) { cb(t_22); return; }
callback(null,t_20);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_23,t_21) {
if(t_23) { cb(t_23); return; }
callback(null,t_21);});
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
if(runtime.memberLookup((runtime.memberLookup((t_11),"item")),"item_type") == "comment") {
output += "\n          ";
var tasks = [];
tasks.push(
function(callback) {
env.getTemplate("template-item-comment.html", false, "template-post.html", null, function(t_26,t_24) {
if(t_26) { cb(t_26); return; }
callback(null,t_24);});
});
tasks.push(
function(template, callback){
template.render(context.getVariables(), frame, function(t_27,t_25) {
if(t_27) { cb(t_27); return; }
callback(null,t_25);});
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
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.memberLookup((runtime.memberLookup((t_11),"item")),"text")), env.opts.autoescape);
output += "</article>\n        ";
;
}
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
output += "\n    ";
;
}
output += "\n  </div>\n  <!-- item end -->\n\n  <div class=\"lb-post-actions\">\n\n    <!-- share \n      Aco share buttons should be vissible on click, not on share\n    -->\n    <div class=\"lb-post-share\">\n      <img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/action_share.svg\" class=\"lb-post-shareIcon\" />\n      <div class=\"lb-post-shareBox\">\n        <a class=\"lb-post-shareBox__item\" href=\"#\"><img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/share_facebook.svg\"/></a>\n        <a class=\"lb-post-shareBox__item\" href=\"#\"><img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/share_google.svg\"/></a>\n        <a class=\"lb-post-shareBox__item\" href=\"#\"><img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/share_linkedin.svg\"/></a>\n        <a class=\"lb-post-shareBox__item\" href=\"#\"><img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/share_twitter.svg\"/></a>\n        <a class=\"lb-post-shareBox__item\" href=\"#\"><img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/share_email.svg\"/></a>\n        <span> | </span>\n      </div>\n    </div>\n    <!-- end share -->\n\n    <!-- permalink -->\n    <div class=\"lb-post-permalink\">\n      <a id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"_id"), env.opts.autoescape);
output += "\" target=\"_blank\">\n        <img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/action_link.svg\" class=\"lb-post-linkIcon\" />\n      </a>\n    </div>\n    <!-- end permalink -->\n\n  </div>\n\n</article>\n";
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

},{"nunjucks/browser/nunjucks-slim":"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-slideshow.html":[function(require,module,exports){
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
output += "\n  </div>\n  <button class=\"close\"><img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/sl_close.svg\" /></button>\n  <button class=\"fullscreen\"><img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/sl_fullscreen.svg\" /></button>\n  <button class=\"arrows prev\"><img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/sl_arrow_previous.svg\" /></button>\n  <button class=\"arrows next\"><img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/sl_arrow_next.svg\" /></button>\n</div>\n";
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

},{"nunjucks/browser/nunjucks-slim":"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/mihai/Sourcefabric/liveblog-default-theme/templates/template-timeline.html":[function(require,module,exports){
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
output += "\n        ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "output")),"logo_url")) {
output += "\n        <img src=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "output")),"logo_url"), env.opts.autoescape);
output += "\"/>\n        ";
;
}
else {
output += "\n        <a class=\"header-bar__logo\" href=\"https://www.liveblog.pro\" target=\"_blank\">\n          <span>Powered by</span>\n          <img src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "assets_root"), env.opts.autoescape);
output += "images/lb-logo.svg\" />\n        </a>\n        ";
;
}
output += "\n      ";
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
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"posts")),"_meta")),"max_results") < runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"posts")),"_meta")),"total")) {
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

},{"nunjucks/browser/nunjucks-slim":"/home/mihai/Sourcefabric/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}]},{},["/home/mihai/Sourcefabric/liveblog-default-theme/js/liveblog.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9saXZlYmxvZy5qcyIsImpzL3RoZW1lL2hhbmRsZXJzLmpzIiwianMvdGhlbWUvaGVscGVycy5qcyIsImpzL3RoZW1lL2luZGV4LmpzIiwianMvdGhlbWUvbG9jYWwtYW5hbHl0aWNzLmpzIiwianMvdGhlbWUvcGFnZXZpZXcuanMiLCJqcy90aGVtZS9wZXJtYWxpbmsuanMiLCJqcy90aGVtZS9zbGlkZXNob3cuanMiLCJqcy90aGVtZS90ZW1wbGF0ZXMuanMiLCJqcy90aGVtZS92aWV3LmpzIiwianMvdGhlbWUvdmlld21vZGVsLmpzIiwibm9kZV9tb2R1bGVzL21vbWVudC9tb21lbnQuanMiLCJub2RlX21vZHVsZXMvbnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltLmpzIiwidGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0tY29tbWVudC5odG1sIiwidGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbCIsInRlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1xdW90ZS5odG1sIiwidGVtcGxhdGVzL3RlbXBsYXRlLXBvc3QtY29tbWVudC5odG1sIiwidGVtcGxhdGVzL3RlbXBsYXRlLXBvc3QuaHRtbCIsInRlbXBsYXRlcy90ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbCIsInRlbXBsYXRlcy90ZW1wbGF0ZS10aW1lbGluZS5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7Ozs7QUFJQTs7QUFFQTs7QUFDQSxJQUFJLFFBQVEsUUFBUSxTQUFSLENBQVo7O0FBRUEsU0FBUyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsWUFBTTtBQUNsRCxRQUFNLElBQU47QUFDRCxDQUZEOztBQUlBLE9BQU8sT0FBUCxHQUFpQixFQUFqQjs7O0FDYkE7Ozs7QUFJQTs7QUFFQSxJQUFJLE9BQU8sUUFBUSxRQUFS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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvMklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcm9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBQcmVyZW5kZXIgZnVuY3Rpb25zXG52YXIgdGhlbWUgPSByZXF1aXJlKCcuL3RoZW1lJyk7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG4gIHRoZW1lLmluaXQoKTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHt9O1xuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB2aWV3ID0gcmVxdWlyZSgnLi92aWV3JylcbiAgLCB2aWV3bW9kZWwgPSByZXF1aXJlKCcuL3ZpZXdtb2RlbCcpXG4gICwgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xuXG4vKipcbiAqIENvbnRhaW5zIGEgbWFwcGluZyBvZiBlbGVtZW50IGRhdGEtc2VsZWN0b3JzIGFuZCBjbGljayBoYW5kbGVyc1xuICogYnV0dG9ucy5hdHRhY2gge2Z1bmN0aW9ufSAtIHJlZ2lzdGVycyBoYW5kbGVycyBmb3VuZCBpbiBoYW5kbGVycyBvYmplY3RcbiAqL1xuXG5jb25zdCBzZW5kQ29tbWVudCA9IChlKSA9PiB7XG4gIGUucHJldmVudERlZmF1bHQoKTtcblxuICBsZXQgbmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb21tZW50LW5hbWUnKS52YWx1ZTtcbiAgbGV0IGNvbW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29tbWVudC1jb250ZW50JykudmFsdWU7XG5cbiAgdmlldy5jbGVhckNvbW1lbnRGb3JtRXJyb3JzKCk7XG5cbiAgcmV0dXJuIHZpZXdtb2RlbC5zZW5kQ29tbWVudChuYW1lLCBjb21tZW50KVxuICAgIC50aGVuKHZpZXcudG9nZ2xlQ29tbWVudERpYWxvZylcbiAgICAudGhlbigoKSA9PiBkb2N1bWVudFxuICAgICAgICAucXVlcnlTZWxlY3RvcignZm9ybS5jb21tZW50JylcbiAgICAgICAgLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIHNlbmRDb21tZW50KVxuICAgIClcbiAgICAudGhlbih2aWV3LnNob3dTdWNjZXNzQ29tbWVudE1zZylcbiAgICAuY2F0Y2godmlldy5kaXNwbGF5Q29tbWVudEZvcm1FcnJvcnMpO1xufTtcblxudmFyIGJ1dHRvbnMgPSB7XG4gIGhhbmRsZXJzOiB7XG4gICAgXCJbZGF0YS1qcy1sb2FkbW9yZV1cIjogKCkgPT4ge1xuICAgICAgdmlld21vZGVsLmxvYWRQb3N0c1BhZ2UoKVxuICAgICAgICAudGhlbih2aWV3LnJlbmRlclBvc3RzKVxuICAgICAgICAudGhlbih2aWV3LmRpc3BsYXlOZXdQb3N0cylcbiAgICAgICAgLmNhdGNoKGNhdGNoRXJyb3IpO1xuICAgIH0sXG5cbiAgICBcIltkYXRhLWpzLW9yZGVyYnlfYXNjZW5kaW5nXVwiOiAoKSA9PiB7XG4gICAgICBsb2FkU29ydCgnYXNjZW5kaW5nJyk7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtb3JkZXJieV9kZXNjZW5kaW5nXVwiOiAoKSA9PiB7XG4gICAgICBsb2FkU29ydCgnZGVzY2VuZGluZycpO1xuICAgIH0sXG5cbiAgICBcIltkYXRhLWpzLW9yZGVyYnlfZWRpdG9yaWFsXVwiOiAoKSA9PiB7XG4gICAgICBsb2FkU29ydCgnZWRpdG9yaWFsJyk7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtc2hvdy1jb21tZW50LWRpYWxvZ11cIjogKCkgPT4ge1xuICAgICAgbGV0IGlzVmlzaWJsZSA9IHZpZXcudG9nZ2xlQ29tbWVudERpYWxvZygpO1xuICAgICAgbGV0IGNvbW1lbnRGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9ybS5jb21tZW50Jyk7XG5cbiAgICAgIGlmIChpc1Zpc2libGUpIHtcbiAgICAgICAgY29tbWVudEZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29tbWVudEZvcm0ucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAnW2RhdGEtanMtY2xvc2UtY29tbWVudC1kaWFsb2ddJzogKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZpZXcudG9nZ2xlQ29tbWVudERpYWxvZygpO1xuICAgIH1cbiAgfSxcblxuICBhdHRhY2g6IGZ1bmN0aW9uKCkge1xuICAgIE9iamVjdC5rZXlzKGJ1dHRvbnMuaGFuZGxlcnMpLmZvckVhY2goKGhhbmRsZXIpID0+IHtcbiAgICAgIGxldCBlbCA9IGhlbHBlcnMuZ2V0RWxlbXMoaGFuZGxlcilbMF07XG5cbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGJ1dHRvbnMuaGFuZGxlcnNbaGFuZGxlcl0sIGZhbHNlKTtcbiAgICB9KTtcblxuICAgIHZpZXcuYXR0YWNoU2xpZGVzaG93KCk7XG4gICAgdmlldy5hdHRhY2hQZXJtYWxpbmsoKTtcbiAgICBpZiAodmlldy5wZXJtYWxpbmsuX2NoYW5nZWRTb3J0KSB7XG4gICAgICBsb2FkU29ydChMQi5zZXR0aW5ncy5wb3N0T3JkZXIpXG4gICAgICAgIC50aGVuKGNoZWNrRm9yU2Nyb2xsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2hlY2tGb3JTY3JvbGwoKTtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGxvYWRTb3J0KHNvcnRCeSkge1xuICAvLyBpbml0aWFseSBvbiBzZXJ2ZXIgc29ydCBwYXJhbXMgYXJlIHNldCBhcyBuZXdlc3RfZmlyc3QsIG9sZGVzdF9maXJzdFxuICAvLyBvbiBjbGllbnQgd2UgZG9udCB1c2UgdGhpcywgc28gdGhpcyBpcyB0ZW1wIGZpeFxuICBzd2l0Y2ggKHNvcnRCeSkge1xuICBjYXNlICdvbGRlc3RfZmlyc3QnOlxuICBjYXNlICdhc2NlbmRpbmcnOlxuICAgIHNvcnRCeSA9ICdhc2NlbmRpbmcnO1xuICAgIGJyZWFrO1xuICBjYXNlICduZXdlc3RfZmlyc3QnOlxuICBjYXNlICdkZXNjZW5kaW5nJzpcbiAgICBzb3J0QnkgPSAnZGVzY2VuZGluZyc7XG4gICAgYnJlYWs7XG4gIGRlZmF1bHQ6XG4gICAgc29ydEJ5ID0gJ2VkaXRvcmlhbCc7XG4gIH1cblxuICByZXR1cm4gdmlld21vZGVsLmxvYWRQb3N0cyh7c29ydDogc29ydEJ5fSlcbiAgICAudGhlbih2aWV3LnJlbmRlclRpbWVsaW5lKVxuICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgIC50aGVuKHZpZXcudG9nZ2xlU29ydEJ0bihzb3J0QnkpKVxuICAgIC5jYXRjaChjYXRjaEVycm9yKTtcbn1cblxuZnVuY3Rpb24gY2hlY2tGb3JTY3JvbGwoKSB7XG4gIHZpZXdtb2RlbC5nZXRBbGxQb3N0cygpXG4gICAgLnRoZW4oKHBvc3RzKSA9PiB7XG4gICAgICBpZiAodmlldy5jaGVja1Blcm1hbGluayhwb3N0cykpIHtcbiAgICAgICAgbG9hZEZvclNjcm9sbCgpO1xuICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBsb2FkRm9yU2Nyb2xsKCkge1xuICBpZiAoIXZpZXcucGVybWFsaW5rU2Nyb2xsKCkpIHtcbiAgICB2aWV3bW9kZWwubG9hZFBvc3RzUGFnZSgpXG4gICAgICAudGhlbih2aWV3LnJlbmRlclBvc3RzKVxuICAgICAgLnRoZW4odmlldy5kaXNwbGF5TmV3UG9zdHMpXG4gICAgICAudGhlbihsb2FkRm9yU2Nyb2xsKVxuICAgICAgLmNhdGNoKGNhdGNoRXJyb3IpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhdGNoRXJyb3IoZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoXCJIYW5kbGVyIGVycm9yOiBcIiwgZXJyKTtcbn1cblxudmFyIGV2ZW50cyA9IHtcbiAgYXR0YWNoOiBmdW5jdGlvbigpIHt9IC8vIHRvZG9cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBidXR0b25zOiBidXR0b25zLFxuICBldmVudHM6IGV2ZW50c1xufTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXG4gIHNldHRpbmdzID0gd2luZG93LkxCLnNldHRpbmdzO1xuXG5mdW5jdGlvbiBjb252ZXJ0VGltZXN0YW1wKHRpbWVzdGFtcCkge1xuICBpZiAoIXNldHRpbmdzLmRhdGV0aW1lRm9ybWF0IHx8IHNldHRpbmdzLmRhdGV0aW1lRm9ybWF0ID09PSAndGltZUFnbycpIHtcbiAgICByZXR1cm4gbW9tZW50KHRpbWVzdGFtcCkuZnJvbU5vdygpO1xuICB9XG4gIHJldHVybiBtb21lbnQodGltZXN0YW1wKS5mb3JtYXQoc2V0dGluZ3MuZGF0ZXRpbWVGb3JtYXQpO1xufVxuXG4vKipcbiAqIFdyYXAgZWxlbWVudCBzZWxlY3RvciBhcGlcbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeSAtIGEgalF1ZXJ5IHN5bnRheCBET00gcXVlcnkgKHdpdGggZG90cylcbiAqL1xuZnVuY3Rpb24gZ2V0RWxlbXMocXVlcnkpIHtcbiAgdmFyIGlzRGF0YUF0dHIgPSBxdWVyeS5pbmRleE9mKFwiZGF0YS1cIikgPiAtMTtcbiAgcmV0dXJuIGlzRGF0YUF0dHJcbiAgICA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpXG4gICAgOiBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKHF1ZXJ5KTtcbn1cblxuLyoqXG4gKiBqUXVlcnkncyAkLmdldEpTT04gaW4gYSBudXRzaGVsbFxuICogQHBhcmFtIHtzdHJpbmd9IHVybCAtIGEgcmVxdWVzdCBVUkxcbiAqL1xuZnVuY3Rpb24gZ2V0SlNPTih1cmwpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub3BlbignR0VUJywgdXJsKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWplY3QoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHhoci5zZW5kKCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBwb3N0KHVybCwgZGF0YSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vcGVuKCdQT1NUJywgdXJsKTtcbiAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtdHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMSkge1xuICAgICAgICByZXNvbHZlKEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVqZWN0KHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gIH0pO1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRFbGVtczogZ2V0RWxlbXMsXG4gIGdldEpTT046IGdldEpTT04sXG4gIHBvc3Q6IHBvc3QsXG4gIGNvbnZlcnRUaW1lc3RhbXA6IGNvbnZlcnRUaW1lc3RhbXBcbn07XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuY29uc3QgaGFuZGxlcnMgPSByZXF1aXJlKCcuL2hhbmRsZXJzJyksXG4gIHZpZXdtb2RlbCA9IHJlcXVpcmUoJy4vdmlld21vZGVsJyksXG4gIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKSxcbiAgcGFnZXZpZXcgPSByZXF1aXJlKCcuL3BhZ2V2aWV3JyksXG4gIGxvY2FsQW5hbHl0aWNzID0gcmVxdWlyZSgnLi9sb2NhbC1hbmFseXRpY3MnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8qKlxuICAgKiBPbiBkb2N1bWVudCBsb2FkZWQsIGRvIHRoZSBmb2xsb3dpbmc6XG4gICAqL1xuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICBoYW5kbGVycy5idXR0b25zLmF0dGFjaCgpOyAvLyBSZWdpc3RlciBCdXR0b25zIEhhbmRsZXJzXG4gICAgaGFuZGxlcnMuZXZlbnRzLmF0dGFjaCgpOyAvLyBSZWdpc3RlciBFdmVudCwgTWVzc2FnZSBIYW5kbGVyc1xuICAgIHZpZXdtb2RlbC5pbml0KCk7XG4gICAgbG9jYWxBbmFseXRpY3MuaGl0KCk7XG4gICAgcGFnZXZpZXcuaW5pdCgpO1xuXG4gICAgdmlldy51cGRhdGVUaW1lc3RhbXBzKCk7XG4gICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdmlldy51cGRhdGVUaW1lc3RhbXBzKCk7IC8vIENvbnZlcnQgSVNPIGRhdGVzIHRvIHRpbWVhZ29cbiAgICB9LCAxMDAwKTtcbiAgfVxufTtcbiIsInZhciBhcGlIb3N0ID0gd2luZG93Lmhhc093blByb3BlcnR5KCdMQicpID8gd2luZG93LkxCLmFwaV9ob3N0LnJlcGxhY2UoL1xcLyQvLCAnJykgOiAnJztcbnZhciBjb250ZXh0VXJsID0gZG9jdW1lbnQucmVmZXJyZXI7XG52YXIgYmxvZ0lkID0gd2luZG93Lmhhc093blByb3BlcnR5KCdMQicpID8gd2luZG93LkxCLmJsb2cuX2lkIDogJyc7XG5cbmFwaUhvc3QgKz0gJy9hcGkvYW5hbHl0aWNzL2hpdCc7XG5cbnZhciBjcmVhdGVDb29raWUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgZGF5cykge1xuICB2YXIgZXhwaXJlcyA9ICcnLCBkYXRlID0gbmV3IERhdGUoKTtcblxuICBpZiAoZGF5cykge1xuICAgIGRhdGUuc2V0VGltZShkYXRlLmdldFRpbWUoKSArIGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKTtcbiAgICBleHBpcmVzID0gYDsgZXhwaXJlcz0ke2RhdGUudG9VVENTdHJpbmcoKX1gO1xuICB9XG4gIGRvY3VtZW50LmNvb2tpZSA9IGAke25hbWV9PSR7dmFsdWV9JHtleHBpcmVzfTsgcGF0aD0vYDtcbn07XG5cbnZhciByZWFkQ29va2llID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgbmFtZUVRID0gbmFtZSArICc9JztcbiAgdmFyIGNhID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7Jyk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjID0gY2FbaV07XG5cbiAgICB3aGlsZSAoYy5jaGFyQXQoMCkgPT09ICcgJykge1xuICAgICAgYyA9IGMuc3Vic3RyaW5nKDEsIGMubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoYy5pbmRleE9mKG5hbWVFUSkgPT09IDApIHtcbiAgICAgIHJldHVybiBjLnN1YnN0cmluZyhuYW1lRVEubGVuZ3RoLCBjLmxlbmd0aCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxudmFyIGhpdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgeG1saHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICB2YXIganNvbkRhdGEgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgY29udGV4dF91cmw6IGNvbnRleHRVcmwsXG4gICAgYmxvZ19pZDogYmxvZ0lkXG4gIH0pO1xuXG4gIHhtbGh0dHAub3BlbignUE9TVCcsIGFwaUhvc3QpO1xuICB4bWxodHRwLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cbiAgeG1saHR0cC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoeG1saHR0cC5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgY3JlYXRlQ29va2llKCdoaXQnLCBqc29uRGF0YSwgMik7XG4gICAgfVxuICB9O1xuXG4gIHhtbGh0dHAuc2VuZChqc29uRGF0YSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtoaXQ6ICgpID0+IHtcbiAgaWYgKCFyZWFkQ29va2llKCdoaXQnKSkge1xuICAgIGhpdCgpO1xuICB9XG59fTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLypcbiAgU2VuZCBwYWdldmlldyBzaWduYWwgdG8gYW5hbHl0aWNzIHByb3ZpZGVyc1xuICBJVlcgYW5kIEdvb2dsZSBBbmFseXRpY3MuIE5vdCB0byBiZSB0aWVkIHRvIGFuZ3VsYXIgYXBwLlxuKi9cblxudmFyIHNlbmRQYWdldmlldyA9IHtcbiAgX2ZvdW5kUHJvdmlkZXJzOiBbXSwgLy8gQ2FjaGUgYWZ0ZXIgZmlyc3QgbG9va3VwXG5cbiAgX3NlbmRJVlc6IGZ1bmN0aW9uKCkge1xuICAgIGlmICghd2luZG93LmlvbSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBpYW1fZGF0YSA9IHtcbiAgICAgIFwic3RcIjogd2luZG93Ll9pZnJhbWVEYXRhc2V0LnN6bVN0LCAvLyBJRFxuICAgICAgXCJjcFwiOiB3aW5kb3cuX2lmcmFtZURhdGFzZXQuc3ptQ3AsIC8vIENvZGVcbiAgICAgIFwiY29cIjogd2luZG93Ll9pZnJhbWVEYXRhc2V0LnN6bUNvLCAvLyBDb21tZW50XG4gICAgICBcInN2XCI6IFwia2VcIiAvLyBEaXNhYmxlIFEmQSBpbnZpdGVcbiAgICB9O1xuXG4gICAgd2luZG93LmlvbS5jKGlhbV9kYXRhLCAxKTsgLy8gd2hlcmUncyB0aGUgLmg/IGFoYWhhaGFcbiAgfSxcblxuICBfc2VuZEdBOiBmdW5jdGlvbigpIHtcbiAgICBpZiAod2luZG93LmdhLmxlbmd0aCA+IDApIHtcbiAgICAgIHdpbmRvdy5nYSgnY3JlYXRlJywgd2luZG93Ll9pZnJhbWVEYXRhc2V0LmdhUHJvcGVydHksICdhdXRvJyk7XG4gICAgICB3aW5kb3cuZ2EoJ3NldCcsICdhbm9ueW1pemVJcCcsIHRydWUpO1xuICAgIH1cblxuICAgIGlmICh3aW5kb3cuZ2EubG9hZGVkKSB7XG4gICAgICB3aW5kb3cuZ2EoJ3NlbmQnLCB7XG4gICAgICAgIGhpdFR5cGU6ICdwYWdldmlldycsXG4gICAgICAgIGxvY2F0aW9uOiB3aW5kb3cuZG9jdW1lbnQucmVmZXJyZXIsIC8vIHNldCB0byBwYXJlbnQgdXJsXG4gICAgICAgIGhpdENhbGxiYWNrOiBmdW5jdGlvbigpIHt9XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgX2luc2VydFNjcmlwdDogZnVuY3Rpb24oc3JjLCBjYikge1xuICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTsgc2NyaXB0LnNyYyA9IHNyYztcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJvZHlcIilbMF0uYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICBzY3JpcHQuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgY2IpO1xuICB9LFxuXG4gIF9nZXRQcm92aWRlcnM6IGZ1bmN0aW9uKCkge1xuICAgIGxldCBmb3VuZFByb3ZpZGVycyA9IFtdO1xuXG4gICAgaWYgKHRoaXMuX2ZvdW5kUHJvdmlkZXJzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2ZvdW5kUHJvdmlkZXJzOyAvLyByZXR1cm4gZWFybHlcbiAgICB9XG5cbiAgICBmb3IgKHZhciBwIGluIHRoaXMuX3Byb3ZpZGVycykge1xuICAgICAgdmFyIHByb3ZpZGVyID0gdGhpcy5fcHJvdmlkZXJzW3BdO1xuICAgICAgdmFyIGtleXNmb3VuZCA9IHByb3ZpZGVyLnJlcXVpcmVkRGF0YS5yZWR1Y2UoKHByZXYsIGN1cnIpID0+XG4gICAgICAgIHdpbmRvdy5faWZyYW1lRGF0YXNldC5oYXNPd25Qcm9wZXJ0eShjdXJyKVxuICAgICAgLCB0cnVlKTsgLy8gbmVlZHMgaW5pdGlhbCB2YWx1ZSBmb3Igb25lIGVsZW1lbnRcblxuICAgICAgaWYgKGtleXNmb3VuZCA9PT0gdHJ1ZSkgeyAvLyBhbGwgcmVxdWlyZWQgYXR0cnMgZm91bmRcbiAgICAgICAgaWYgKCFwcm92aWRlci5vYmplY3QpIHtcbiAgICAgICAgICB0aGlzLl9pbnNlcnRTY3JpcHQocHJvdmlkZXIuc2NyaXB0VVJMLCBwcm92aWRlci5zZW5kKTsgLy8gbm90IHlldCBsb2FkZWRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3VuZFByb3ZpZGVycy5wdXNoKHByb3ZpZGVyLnNlbmQpOyAvLyBsaXN0IG9mIF9zZW5kIGZ1bmNzXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBwYXJlbnQuX2ZvdW5kUHJvdmlkZXJzID0gZm91bmRQcm92aWRlcnM7IC8vIGNhY2hlIGFmdGVyIGluaXRpYWxcbiAgICByZXR1cm4gZm91bmRQcm92aWRlcnM7XG4gIH0sXG5cbiAgc2VuZDogZnVuY3Rpb24oKSB7IC8vIHB1YmxpYywgaW52b2tlIHcvbyBwYXJhbXNcbiAgICBpZiAoIXdpbmRvdy5oYXNPd25Qcm9wZXJ0eSgnX2lmcmFtZURhdGFzZXQnKSkge1xuICAgICAgcmV0dXJuOyAvLyByZXR1cm4gZWFybHlcbiAgICB9XG5cbiAgICB2YXIgcHJvdmlkZXJzID0gdGhpcy5fZ2V0UHJvdmlkZXJzKCk7IC8vIGlzIGNhY2hlZCBvbiBmaXJzdCBjYWxsXG5cbiAgICBmb3IgKHZhciBpID0gcHJvdmlkZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBwcm92aWRlcnNbaV0oKTsgLy8gX3NlbmQgZnVuY3Rpb24gY2FsbHNcbiAgICB9XG4gIH0sXG5cbiAgcmVjZWl2ZU1lc3NhZ2U6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5kYXRhLnR5cGUgPT09ICdhbmFseXRpY3MnKSB7XG4gICAgICB2YXIgcGF5bG9hZCA9IEpTT04ucGFyc2UoZS5kYXRhLnBheWxvYWQpO1xuXG4gICAgICB3aW5kb3cuX2lmcmFtZURhdGFzZXQgPSBwYXlsb2FkOyAvLyBzdG9yZSBkYXRhc2V0IGZyb20gcGFyZW50Tm9kZVxuICAgIH1cbiAgfSxcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICBpZiAod2luZG93LkxCLnNldHRpbmdzLmdhQ29kZSA9PT0gJycpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5yZWNlaXZlTWVzc2FnZSwgZmFsc2UpO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbmRwYWdldmlldycsIHRoaXMuc2VuZC5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy5faWZyYW1lRGF0YXNldCA9IHtnYVByb3BlcnR5OiB3aW5kb3cuTEIuc2V0dGluZ3MuZ2FDb2RlfTtcbiAgICAgIHRoaXMuc2VuZCA9IHRoaXMuc2VuZC5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5zZW5kKCk7XG4gICAgfVxuICB9XG59O1xuXG5zZW5kUGFnZXZpZXcuX3Byb3ZpZGVycyA9IHtcbiAgaXZ3OiB7XG4gICAgc2VuZDogc2VuZFBhZ2V2aWV3Ll9zZW5kSVZXLFxuICAgIHJlcXVpcmVkRGF0YTogWydzem1TdCcsICdzem1DcCcsICdzem1DbyddLFxuICAgIHNjcmlwdFVSTDogJ2h0dHBzOi8vc2NyaXB0LmlvYW0uZGUvaWFtLmpzJyxcbiAgICBvYmplY3Q6IHdpbmRvdy5oYXNPd25Qcm9wZXJ0eSgnaW9tJykgPyB3aW5kb3cuaW9tIDogbnVsbFxuICB9LFxuXG4gIGdhOiB7XG4gICAgc2VuZDogc2VuZFBhZ2V2aWV3Ll9zZW5kR0EsXG4gICAgcmVxdWlyZWREYXRhOiBbJ2dhUHJvcGVydHknXSxcbiAgICBzY3JpcHRVUkw6ICdodHRwczovL3d3dy5nb29nbGUtYW5hbHl0aWNzLmNvbS9hbmFseXRpY3MuanMnLFxuICAgIG9iamVjdDogd2luZG93Lmhhc093blByb3BlcnR5KCdnYScpID8gd2luZG93LmdhIDogbnVsbFxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNlbmRQYWdldmlldztcbiIsImNsYXNzIFBlcm1hbGluayB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZXNjYXBlUmVnRXhwID0gZnVuY3Rpb24gKHN0cmluZykge1xuICAgICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC8oWy4qKz9ePSE6JHt9KCl8XFxbXFxdXFwvXFxcXF0pL2csICdcXFxcJDEnKTtcbiAgICB9O1xuXG4gICAgdGhpcy5QQVJBTV9OQU1FID0gJ2xpdmVibG9nLl9pZCcsIC8vIHRoZSBwYXJhbWV0ZXIgbmFtZSBmb3IgcGVybWFsaW5rLiAgXG4gICAgdGhpcy5yZWdleEhhc2ggPSBuZXcgUmVnRXhwKHRoaXMuZXNjYXBlUmVnRXhwKHRoaXMuUEFSQU1fTkFNRSkgKyAnPShbXiYjXSopJyk7XG5cbiAgICBpZiAoZG9jdW1lbnQucGFyZW50KSB7XG4gICAgICAvLyB1c2UgZG9jdW1lbnQgcGFyZW50IGlmIGF2YWxpYmxlLCBzZWUgaWZyYW1lIGNvcnMgbGltaXRhdGlvbi5cbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuaHJlZiA9IGRvY3VtZW50LmxvY2F0aW9uLmhyZWY7IFxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBpZiBub3QgdXNlIHRoZSByZWZlcnJlciBvZiB0aGUgaWZyYW1lLlxuICAgICAgICB0aGlzLmhyZWYgPSBkb2N1bWVudC5yZWZlcnJlcjsgXG4gICAgICB9XG4gICAgfSBlbHNlIHsgICAgICAgICAgICAgICAgXG4gICAgICB0aGlzLmhyZWYgPSBkb2N1bWVudC5sb2NhdGlvbi5ocmVmOyAvLyB1c2UgdGhpcyBvcHRpb24gaWYgaXQgaXMgYWNjZXNzIGRpcmVjdGx5IG5vdCB2aWEgaWZyYW1lLlxuICAgIH1cblxuICAgIHZhciBtYXRjaGVzID0gdGhpcy5ocmVmLm1hdGNoKHRoaXMucmVnZXhIYXNoKTtcbiAgICAgICAgXG4gICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgIHZhciBhcnIgPSBkZWNvZGVVUklDb21wb25lbnQobWF0Y2hlc1sxXSkuc3BsaXQoJy0+Jyk7XG4gICAgICB0aGlzLl9pZCA9IGFyclswXTtcbiAgICAgIGlmIChMQi5zZXR0aW5ncy5wb3N0T3JkZXIgIT09IGFyclsxXSkge1xuICAgICAgICBMQi5zZXR0aW5ncy5wb3N0T3JkZXIgPSBhcnJbMV07XG4gICAgICAgIHRoaXMuX2NoYW5nZWRTb3J0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRVcmwoaWQpIHtcbiAgICB2YXIgcGVybWFsaW5rID0gZmFsc2UsXG4gICAgICBERUxJTUlURVIgPSBMQi5zZXR0aW5ncy5wZXJtYWxpbmtEZWxpbWl0ZXIgfHwgJz8nLCAvLyBkZWxpbWl0ZXIgY2FuIGJlIGA/YCBvciBgI2AuXG4gICAgICBuZXdIYXNoID0gdGhpcy5QQVJBTV9OQU1FICsgJz0nICsgaWQgKyAnLT4nICsgTEIuc2V0dGluZ3MucG9zdE9yZGVyO1xuXG4gICAgaWYgKHRoaXMuaHJlZi5pbmRleE9mKERFTElNSVRFUikgPT09IC0xKSB7XG4gICAgICBwZXJtYWxpbmsgPSB0aGlzLmhyZWYgKyBERUxJTUlURVIgKyBuZXdIYXNoO1xuICAgIH0gZWxzZSBpZiAodGhpcy5ocmVmLmluZGV4T2YodGhpcy5QQVJBTV9OQU1FICsgJz0nKSAhPT0gLTEpIHtcbiAgICAgIHBlcm1hbGluayA9IHRoaXMuaHJlZi5yZXBsYWNlKHRoaXMucmVnZXhIYXNoLCBuZXdIYXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGVybWFsaW5rID0gdGhpcy5ocmVmICsgJyYnICsgbmV3SGFzaDtcbiAgICB9XG5cbiAgICByZXR1cm4gcGVybWFsaW5rOyBcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBlcm1hbGluaztcbiIsImNvbnN0IHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJyk7XG5cbmNsYXNzIFNsaWRlc2hvdyB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc3RhcnQgPSB0aGlzLnN0YXJ0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5zdG9wID0gdGhpcy5zdG9wLmJpbmQodGhpcyk7XG4gICAgdGhpcy5rZXlib2FyZExpc3RlbmVyID0gdGhpcy5rZXlib2FyZExpc3RlbmVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zZXRGb2N1cyA9IHRoaXMuc2V0Rm9jdXMuYmluZCh0aGlzKTtcbiAgICB0aGlzLmxhdW5jaEludG9GdWxsc2NyZWVuID0gdGhpcy5sYXVuY2hJbnRvRnVsbHNjcmVlbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25SZXNpemUgPSB0aGlzLm9uUmVzaXplLmJpbmQodGhpcyk7XG4gICAgdGhpcy5leGl0RnVsbHNjcmVlbiA9IHRoaXMuZXhpdEZ1bGxzY3JlZW4uYmluZCh0aGlzKTtcbiAgICB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4gPSB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4uYmluZCh0aGlzKTtcbiAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXJzID0gdGhpcy5hZGRFdmVudExpc3RlbmVycy5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMgPSB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXJzLmJpbmQodGhpcyk7XG4gICAgdGhpcy50b3VjaFN0YXJ0ID0gdGhpcy50b3VjaFN0YXJ0LmJpbmQodGhpcyk7XG4gICAgdGhpcy50b3VjaE1vdmUgPSB0aGlzLnRvdWNoTW92ZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgc3RhcnQoZSkge1xuICAgIGxldCBpdGVtcyA9IFtdO1xuXG4gICAgdGhpcy5pdGVyYXRpb25zID0gMDtcbiAgICB0aGlzLmlzRnVsbHNjcmVlbiA9IGZhbHNlO1xuICAgIHRoaXMueERvd24gPSBudWxsO1xuICAgIHRoaXMueURvd24gPSBudWxsO1xuXG4gICAgZS50YXJnZXRcbiAgICAgIC5jbG9zZXN0KCdhcnRpY2xlLnNsaWRlc2hvdycpXG4gICAgICAucXVlcnlTZWxlY3RvckFsbCgnLmxiLWl0ZW0gaW1nJylcbiAgICAgIC5mb3JFYWNoKChpbWcpID0+IHtcbiAgICAgICAgbGV0IG1hdGNoZXMgPSBbXTtcblxuICAgICAgICBpbWcuZ2V0QXR0cmlidXRlKCdzcmNzZXQnKS5yZXBsYWNlKC8oXFxTKylcXHNcXGQrdy9nLCAocywgbWF0Y2gpID0+IHtcbiAgICAgICAgICBtYXRjaGVzLnB1c2gobWF0Y2gpO1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgW2Jhc2VJbWFnZSwgdGh1bWJuYWlsLCB2aWV3SW1hZ2VdID0gbWF0Y2hlcztcbiAgICAgICAgbGV0IGNhcHRpb24gPSAnJywgY3JlZGl0ID0gJyc7XG5cbiAgICAgICAgaWYgKGltZy5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4uY2FwdGlvbicpKSB7XG4gICAgICAgICAgY2FwdGlvbiA9IGltZy5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4uY2FwdGlvbicpLnRleHRDb250ZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGltZy5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4uY3JlZGl0JykpIHtcbiAgICAgICAgICBjcmVkaXQgPSBpbWcucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yKCdzcGFuLmNyZWRpdCcpLnRleHRDb250ZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgaXRlbXMucHVzaCh7XG4gICAgICAgICAgaXRlbToge1xuICAgICAgICAgICAgbWV0YToge1xuICAgICAgICAgICAgICBtZWRpYToge3JlbmRpdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBiYXNlSW1hZ2U6IHtocmVmOiBiYXNlSW1hZ2V9LFxuICAgICAgICAgICAgICAgIHRodW1ibmFpbDoge2hyZWY6IHRodW1ibmFpbH0sXG4gICAgICAgICAgICAgICAgdmlld0ltYWdlOiB7aHJlZjogdmlld0ltYWdlfVxuICAgICAgICAgICAgICB9fSxcbiAgICAgICAgICAgICAgY2FwdGlvbjogY2FwdGlvbixcbiAgICAgICAgICAgICAgY3JlZGl0OiBjcmVkaXRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY3RpdmU6IHRodW1ibmFpbCA9PT0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdzcmMnKVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIGxldCBzbGlkZXNob3cgPSB0ZW1wbGF0ZXMuc2xpZGVzaG93KHtcbiAgICAgIHJlZnM6IGl0ZW1zLFxuICAgICAgYXNzZXRzX3Jvb3Q6IHdpbmRvdy5MQi5hc3NldHNfcm9vdFxuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2LmxiLXRpbWVsaW5lJylcbiAgICAgIC5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyZW5kJywgc2xpZGVzaG93KTtcblxuICAgIGlmICh3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcCkge1xuICAgICAgd2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSgnZnVsbHNjcmVlbicsIHdpbmRvdy5kb2N1bWVudC5yZWZlcnJlcik7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRGb2N1cygpO1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgdGhpcy5leGl0RnVsbHNjcmVlbigpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JykucmVtb3ZlKCk7XG4gIH1cblxuICBvblJlc2l6ZSgpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IC5jb250YWluZXInKTtcbiAgICBsZXQgb2Zmc2V0ID0gY29udGFpbmVyLm9mZnNldEhlaWdodCAqIHRoaXMuaXRlcmF0aW9ucztcblxuICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7b2Zmc2V0fXB4YDtcbiAgfVxuXG4gIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlib2FyZExpc3RlbmVyKTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyBidXR0b24uZnVsbHNjcmVlbicpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4pO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5hcnJvd3MubmV4dCcpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmtleWJvYXJkTGlzdGVuZXIoe2tleUNvZGU6IDM5fSkpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5hcnJvd3MucHJldicpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmtleWJvYXJkTGlzdGVuZXIoe2tleUNvZGU6IDM3fSkpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5jbG9zZScpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnN0b3ApO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JylcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy50b3VjaFN0YXJ0KTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdycpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy50b3VjaE1vdmUpO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25SZXNpemUpO1xuICB9XG5cbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWJvYXJkTGlzdGVuZXIpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5mdWxsc2NyZWVuJylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlRnVsbHNjcmVlbik7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmFycm93cy5uZXh0JylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzl9KSk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmFycm93cy5wcmV2JylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzd9KSk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmNsb3NlJylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuc3RvcCk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cnKVxuICAgICAgLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLnRvdWNoU3RhcnQpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLnRvdWNoTW92ZSk7XG5cbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5vblJlc2l6ZSk7XG4gIH1cblxuICB0b3VjaFN0YXJ0KGUpIHtcbiAgICB0aGlzLnhEb3duID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgdGhpcy55RG93biA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuICB9XG5cbiAgdG91Y2hNb3ZlKGUpIHtcbiAgICBpZiAoIXRoaXMueERvd24gfHwgIXRoaXMueURvd24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgeFVwID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgdmFyIHlVcCA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuXG4gICAgdmFyIHhEaWZmID0gdGhpcy54RG93biAtIHhVcDtcbiAgICB2YXIgeURpZmYgPSB0aGlzLnlEb3duIC0geVVwO1xuXG4gICAgaWYgKE1hdGguYWJzKHhEaWZmKSA+IE1hdGguYWJzKHlEaWZmKSAmJiB4RGlmZiA+IDApIHtcbiAgICAgIC8vIExlZnQgc3dpcGVcbiAgICAgIHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzl9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmlnaHQgc3dpcGVcbiAgICAgIHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzd9KTtcbiAgICB9XG5cbiAgICB0aGlzLnhEb3duID0gbnVsbDtcbiAgICB0aGlzLnlEb3duID0gbnVsbDtcbiAgfVxuXG4gIHRvZ2dsZUZ1bGxzY3JlZW4oKSB7XG4gICAgaWYgKCF0aGlzLmlzRnVsbHNjcmVlbikge1xuICAgICAgdGhpcy5sYXVuY2hJbnRvRnVsbHNjcmVlbihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2xpZGVzaG93JykpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgfVxuICB9XG5cbiAgbGF1bmNoSW50b0Z1bGxzY3JlZW4oZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgICBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICAgIGVsZW1lbnQubXNSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgIH1cblxuICAgIHRoaXMuaXNGdWxsc2NyZWVuID0gdHJ1ZTtcbiAgfVxuXG4gIGV4aXRGdWxsc2NyZWVuKCkge1xuICAgIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICAgIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKSB7XG4gICAgICBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xuICAgIH1cblxuICAgIHRoaXMuaXNGdWxsc2NyZWVuID0gZmFsc2U7XG4gIH1cblxuICBzZXRGb2N1cygpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IC5jb250YWluZXInKTtcblxuICAgIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKS5mb3JFYWNoKChpbWcsIGkpID0+IHtcbiAgICAgIGlmIChpbWcuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSkge1xuICAgICAgICB0aGlzLml0ZXJhdGlvbnMgPSBpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuaXRlcmF0aW9ucyA+IDApIHtcbiAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7Y29udGFpbmVyLm9mZnNldEhlaWdodCAqIHRoaXMuaXRlcmF0aW9uc31weGA7XG4gICAgfVxuICB9XG5cbiAga2V5Ym9hcmRMaXN0ZW5lcihlKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyAuY29udGFpbmVyJyk7XG4gICAgY29uc3QgcGljdHVyZXNDb3VudCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKS5sZW5ndGg7XG4gICAgbGV0IG9mZnNldCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgKiB0aGlzLml0ZXJhdGlvbnM7XG5cbiAgICBzd2l0Y2ggKGUua2V5Q29kZSkge1xuICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBpZiAob2Zmc2V0ICsgY29udGFpbmVyLm9mZnNldEhlaWdodCA8IHBpY3R1cmVzQ291bnQgKiBjb250YWluZXIub2Zmc2V0SGVpZ2h0KSB7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7b2Zmc2V0ICsgY29udGFpbmVyLm9mZnNldEhlaWdodH1weGA7XG4gICAgICAgIHRoaXMuaXRlcmF0aW9ucysrO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBpZiAob2Zmc2V0IC0gY29udGFpbmVyLm9mZnNldEhlaWdodCA+PSAwKSB7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7b2Zmc2V0IC0gY29udGFpbmVyLm9mZnNldEhlaWdodH1weGA7XG4gICAgICAgIHRoaXMuaXRlcmF0aW9ucy0tO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICBjYXNlIDI3OiAvLyBlc2NcbiAgICAgIHRoaXMuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgIHRoaXMuc3RvcCgpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNsaWRlc2hvdztcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBudW5qdWNrcyA9IHJlcXVpcmUoXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIik7XG5jb25zdCBzZXR0aW5ncyA9IHdpbmRvdy5MQi5zZXR0aW5ncztcblxuY29uc3QgZGVmYXVsdFRlbXBsYXRlcyA9IHtcbiAgcG9zdDogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1wb3N0Lmh0bWxcIiksXG4gIHRpbWVsaW5lOiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiksXG4gIHBvc3RDb21tZW50OiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLXBvc3QtY29tbWVudC5odG1sXCIpLFxuICBpdGVtSW1hZ2U6IHJlcXVpcmUoXCIuLi8uLi90ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIpLFxuICBpdGVtRW1iZWQ6IHJlcXVpcmUoXCIuLi8uLi90ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sXCIpLFxuICBpdGVtUXVvdGU6IHJlcXVpcmUoXCIuLi8uLi90ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1xdW90ZS5odG1sXCIpLFxuICBpdGVtQ29tbWVudDogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWNvbW1lbnQuaHRtbFwiKSxcbiAgc2xpZGVzaG93OiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLXNsaWRlc2hvdy5odG1sXCIpXG59O1xuXG5mdW5jdGlvbiBnZXRDdXN0b21UZW1wbGF0ZXMoKSB7XG4gIGxldCBjdXN0b21UZW1wbGF0ZXMgPSBzZXR0aW5ncy5jdXN0b21UZW1wbGF0ZXNcbiAgICAsIG1lcmdlZFRlbXBsYXRlcyA9IGRlZmF1bHRUZW1wbGF0ZXM7XG5cbiAgZm9yIChsZXQgdGVtcGxhdGUgaW4gY3VzdG9tVGVtcGxhdGVzKSB7XG4gICAgbGV0IGN1c3RvbVRlbXBsYXRlTmFtZSA9IGN1c3RvbVRlbXBsYXRlc1t0ZW1wbGF0ZV07XG4gICAgZGVmYXVsdFRlbXBsYXRlc1t0ZW1wbGF0ZV0gPSAoY3R4LCBjYikgPT4ge1xuICAgICAgbnVuanVja3MucmVuZGVyKGN1c3RvbVRlbXBsYXRlTmFtZSwgY3R4LCBjYik7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBtZXJnZWRUZW1wbGF0ZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dGluZ3MuY3VzdG9tVGVtcGxhdGVzXG4gID8gZ2V0Q3VzdG9tVGVtcGxhdGVzKClcbiAgOiBkZWZhdWx0VGVtcGxhdGVzO1xuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XG52YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcbnZhciBTbGlkZXNob3cgPSByZXF1aXJlKCcuL3NsaWRlc2hvdycpO1xudmFyIFBlcm1hbGluayA9IHJlcXVpcmUoJy4vcGVybWFsaW5rJyk7XG5cbnZhciB0aW1lbGluZUVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmxiLXBvc3RzLm5vcm1hbFwiKVxuICAsIGxvYWRNb3JlUG9zdHNCdXR0b24gPSBoZWxwZXJzLmdldEVsZW1zKFwibG9hZC1tb3JlLXBvc3RzXCIpO1xuXG5jb25zdCBwZXJtYWxpbmsgPSBuZXcgUGVybWFsaW5rKCk7XG5cbi8qKlxuICogUmVwbGFjZSB0aGUgY3VycmVudCB0aW1lbGluZSB1bmNvbmRpdGlvbmFsbHkuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBhcGlfcmVzcG9uc2Ug4oCTIGNvbnRhaW5zIHJlcXVlc3Qgb3B0cy5cbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSByZXF1ZXN0T3B0cyAtIEFQSSByZXF1ZXN0IHBhcmFtcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyVGltZWxpbmUoYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciByZW5kZXJlZFBvc3RzID0gW107XG5cbiAgYXBpX3Jlc3BvbnNlLl9pdGVtcy5mb3JFYWNoKChwb3N0KSA9PiB7XG4gICAgcmVuZGVyZWRQb3N0cy5wdXNoKHRlbXBsYXRlcy5wb3N0KHtcbiAgICAgIGl0ZW06IHBvc3QsXG4gICAgICBzZXR0aW5nczogd2luZG93LkxCLnNldHRpbmdzLFxuICAgICAgYXNzZXRzX3Jvb3Q6IHdpbmRvdy5MQi5hc3NldHNfcm9vdFxuICAgIH0pKTtcblxuICB9KTtcbiAgdGltZWxpbmVFbGVtWzBdLmlubmVySFRNTCA9IHJlbmRlcmVkUG9zdHMuam9pbihcIlwiKTtcbiAgdXBkYXRlVGltZXN0YW1wcygpO1xuICBsb2FkRW1iZWRzKCk7XG4gIGF0dGFjaFNsaWRlc2hvdygpO1xuICBhdHRhY2hQZXJtYWxpbmsoKTtcbn1cblxuLyoqXG4gKiBSZW5kZXIgcG9zdHMgY3VycmVudGx5IGluIHBpcGVsaW5lIHRvIHRlbXBsYXRlLlxuICogVG8gcmVkdWNlIERPTSBjYWxscy9wYWludHMgd2UgaGFuZCBvZmYgcmVuZGVyZWQgSFRNTCBpbiBidWxrLlxuICogQHR5cGVkZWYge09iamVjdH0gYXBpX3Jlc3BvbnNlIOKAkyBjb250YWlucyByZXF1ZXN0IG9wdHMuXG4gKiBAcHJvcGVydHkge09iamVjdH0gcmVxdWVzdE9wdHMgLSBBUEkgcmVxdWVzdCBwYXJhbXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlclBvc3RzKGFwaV9yZXNwb25zZSkge1xuICB2YXIgcmVuZGVyZWRQb3N0cyA9IFtdIC8vIHRlbXBvcmFyeSBzdG9yZVxuICAgICwgcG9zdHMgPSBhcGlfcmVzcG9uc2UuX2l0ZW1zO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcG9zdHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcG9zdCA9IHBvc3RzW2ldO1xuXG4gICAgaWYgKCFhcGlfcmVzcG9uc2UucmVxdWVzdE9wdHMucGFnZSAmJiBwb3N0LmRlbGV0ZWQpIHtcbiAgICAgIGRlbGV0ZVBvc3QocG9zdC5faWQpO1xuICAgICAgcmV0dXJuOyAvLyBlYXJseVxuICAgIH1cblxuICAgIHZhciByZW5kZXJlZFBvc3QgPSB0ZW1wbGF0ZXMucG9zdCh7XG4gICAgICBpdGVtOiBwb3N0LFxuICAgICAgc2V0dGluZ3M6IHdpbmRvdy5MQi5zZXR0aW5ncyxcbiAgICAgIGFzc2V0c19yb290OiB3aW5kb3cuTEIuYXNzZXRzX3Jvb3RcbiAgICB9KTtcblxuICAgIGlmICghYXBpX3Jlc3BvbnNlLnJlcXVlc3RPcHRzLnBhZ2UgJiYgcG9zdC5vcGVyYXRpb24gPT09IFwidXBkYXRlXCIpIHtcbiAgICAgIHVwZGF0ZVBvc3QocG9zdC5faWQsIHJlbmRlcmVkUG9zdCk7XG4gICAgICByZXR1cm47IC8vIGVhcmx5XG4gICAgfVxuXG4gICAgcmVuZGVyZWRQb3N0cy5wdXNoKHJlbmRlcmVkUG9zdCk7IC8vIGNyZWF0ZSBvcGVyYXRpb25cbiAgfVxuXG4gIGlmICghcmVuZGVyZWRQb3N0cy5sZW5ndGgpIHtcbiAgICByZXR1cm47IC8vIGVhcmx5XG4gIH1cbiAgXG4gIHJlbmRlcmVkUG9zdHMucmV2ZXJzZSgpO1xuXG4gIGFkZFBvc3RzKHJlbmRlcmVkUG9zdHMsIHsgLy8gaWYgY3JlYXRlc1xuICAgIHBvc2l0aW9uOiBhcGlfcmVzcG9uc2UucmVxdWVzdE9wdHMuZnJvbURhdGUgPyBcInRvcFwiIDogXCJib3R0b21cIlxuICB9KTtcblxuICBsb2FkRW1iZWRzKCk7XG59XG5cbi8qKlxuICogQWRkIHBvc3Qgbm9kZXMgdG8gRE9NLCBkbyBzbyByZWdhcmRsZXNzIG9mIHNldHRpbmdzLmF1dG9BcHBseVVwZGF0ZXMsXG4gKiBidXQgcmF0aGVyIHNldCB0aGVtIHRvIE5PVCBCRSBESVNQTEFZRUQgaWYgYXV0by1hcHBseSBpcyBmYWxzZS5cbiAqIFRoaXMgd2F5IHdlIGRvbid0IGhhdmUgdG8gbWVzcyB3aXRoIHR3byBzdGFja3Mgb2YgcG9zdHMuXG4gKiBAcGFyYW0ge2FycmF5fSBwb3N0cyAtIGFuIGFycmF5IG9mIExpdmVibG9nIHBvc3QgaXRlbXNcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0ga2V5d29yZCBhcmdzXG4gKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5wb3NpdGlvbiAtIHRvcCBvciBib3R0b21cbiAqL1xuZnVuY3Rpb24gYWRkUG9zdHMocG9zdHMsIG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIG9wdHMucG9zaXRpb24gPSBvcHRzLnBvc2l0aW9uIHx8IFwiYm90dG9tXCI7XG5cbiAgdmFyIHBvc3RzSFRNTCA9IFwiXCJcbiAgICAsIHBvc2l0aW9uID0gb3B0cy5wb3NpdGlvbiA9PT0gXCJ0b3BcIlxuICAgICAgICA/IFwiYWZ0ZXJiZWdpblwiIC8vIGluc2VydEFkamFjZW50SFRNTCBBUEkgPT4gYWZ0ZXIgc3RhcnQgb2Ygbm9kZVxuICAgICAgICA6IFwiYmVmb3JlZW5kXCI7IC8vIGluc2VydEFkamFjZW50SFRNTCBBUEkgPT4gYmVmb3JlIGVuZCBvZiBub2RlXG5cbiAgZm9yICh2YXIgaSA9IHBvc3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgcG9zdHNIVE1MICs9IHBvc3RzW2ldO1xuICB9XG5cbiAgdGltZWxpbmVFbGVtWzBdLmluc2VydEFkamFjZW50SFRNTChwb3NpdGlvbiwgcG9zdHNIVE1MKTtcbiAgYXR0YWNoU2xpZGVzaG93KCk7XG4gIGF0dGFjaFBlcm1hbGluaygpO1xufVxuXG4vKipcbiAqIERlbGV0ZSBwb3N0IDxhcnRpY2xlPiBET00gbm9kZSBieSBkYXRhIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAtIGEgcG9zdCBVUk5cbiAqL1xuZnVuY3Rpb24gZGVsZXRlUG9zdChwb3N0SWQpIHtcbiAgdmFyIGVsZW0gPSBoZWxwZXJzLmdldEVsZW1zKCdbZGF0YS1qcy1wb3N0LWlkPVxcXCInICsgcG9zdElkICsgJ1xcXCJdJyk7XG4gIGlmIChlbGVtLmxlbmd0aCkge1xuICAgIGVsZW1bMF0ucmVtb3ZlKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWxldGUgcG9zdCA8YXJ0aWNsZT4gRE9NIG5vZGUgYnkgZGF0YSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gLSBhIHBvc3QgVVJOXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVBvc3QocG9zdElkLCByZW5kZXJlZFBvc3QpIHtcbiAgdmFyIGVsZW0gPSBoZWxwZXJzLmdldEVsZW1zKCdbZGF0YS1qcy1wb3N0LWlkPVxcXCInICsgcG9zdElkICsgJ1xcXCJdJyk7XG4gIGlmIChlbGVtLmxlbmd0aCkge1xuICAgIGVsZW1bMF0ub3V0ZXJIVE1MID0gcmVuZGVyZWRQb3N0O1xuICAgIGF0dGFjaFNsaWRlc2hvdygpO1xuICAgIGF0dGFjaFBlcm1hbGluaygpO1xuICB9XG59XG5cbi8qKlxuICogU2hvdyBuZXcgcG9zdHMgbG9hZGVkIHZpYSBYSFJcbiAqL1xuZnVuY3Rpb24gZGlzcGxheU5ld1Bvc3RzKCkge1xuICB2YXIgbmV3UG9zdHMgPSBoZWxwZXJzLmdldEVsZW1zKFwibGItcG9zdC1uZXdcIik7XG4gIGZvciAodmFyIGkgPSBuZXdQb3N0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIG5ld1Bvc3RzW2ldLmNsYXNzTGlzdC5yZW1vdmUoXCJsYi1wb3N0LW5ld1wiKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyaWdnZXIgZW1iZWQgcHJvdmlkZXIgdW5wYWNraW5nXG4gKiBUb2RvOiBNYWtlIHJlcXVpcmVkIHNjcmlwdHMgYXZhaWxhYmxlIG9uIHN1YnNlcXVlbnQgbG9hZHNcbiAqL1xuZnVuY3Rpb24gbG9hZEVtYmVkcygpIHtcbiAgaWYgKHdpbmRvdy5pbnN0Z3JtKSB7XG4gICAgaW5zdGdybS5FbWJlZHMucHJvY2VzcygpO1xuICB9XG5cbiAgaWYgKHdpbmRvdy50d3R0cikge1xuICAgIHR3dHRyLndpZGdldHMubG9hZCgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZUNvbW1lbnREaWFsb2coKSB7XG4gIGxldCBjb21tZW50Rm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0uY29tbWVudCcpO1xuICBsZXQgaXNIaWRkZW4gPSBmYWxzZTtcblxuICBpZiAoY29tbWVudEZvcm0pIHtcbiAgICBpc0hpZGRlbiA9IGNvbW1lbnRGb3JtLmNsYXNzTGlzdC50b2dnbGUoJ2hpZGUnKTtcbiAgfVxuXG4gIHJldHVybiAhaXNIaWRkZW47XG59XG5cbi8qKlxuICogU2V0IHNvcnRpbmcgb3JkZXIgYnV0dG9uIG9mIGNsYXNzIEBuYW1lIHRvIGFjdGl2ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKi9cbmZ1bmN0aW9uIHRvZ2dsZVNvcnRCdG4obmFtZSkge1xuICB2YXIgc29ydGluZ0J0bnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuc29ydGluZy1iYXJfX29yZGVyJyk7XG5cbiAgc29ydGluZ0J0bnMuZm9yRWFjaCgoZWwpID0+IHtcbiAgICB2YXIgc2hvdWxkQmVBY3RpdmUgPSBlbC5kYXRhc2V0Lmhhc093blByb3BlcnR5KFwianNPcmRlcmJ5X1wiICsgbmFtZSk7XG5cbiAgICBlbC5jbGFzc0xpc3QudG9nZ2xlKCdzb3J0aW5nLWJhcl9fb3JkZXItLWFjdGl2ZScsIHNob3VsZEJlQWN0aXZlKTtcbiAgfSk7XG59XG5cbi8qKlxuICogQ29uZGl0aW9uYWxseSBoaWRlIGxvYWQtbW9yZS1wb3N0cyBidXR0b24uXG4gKiBAcGFyYW0ge2Jvb2x9IHNob3VsZFRvZ2dsZSAtIHRydWUgPT4gaGlkZVxuICovXG5mdW5jdGlvbiBoaWRlTG9hZE1vcmUoc2hvdWxkSGlkZSkge1xuICBpZiAobG9hZE1vcmVQb3N0c0J1dHRvbi5sZW5ndGggPiAwKSB7XG4gICAgbG9hZE1vcmVQb3N0c0J1dHRvblswXS5jbGFzc0xpc3QudG9nZ2xlKFxuICAgICAgXCJtb2QtLWhpZGVcIiwgc2hvdWxkSGlkZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWxldGUgcG9zdCA8YXJ0aWNsZT4gRE9NIG5vZGUgYnkgZGF0YSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gLSBhIHBvc3QgVVJOXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVRpbWVzdGFtcHMoKSB7XG4gIHZhciBkYXRlRWxlbXMgPSBoZWxwZXJzLmdldEVsZW1zKFwibGItcG9zdC1kYXRlXCIpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGVFbGVtcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBlbGVtID0gZGF0ZUVsZW1zW2ldXG4gICAgICAsIHRpbWVzdGFtcCA9IGVsZW0uZGF0YXNldC5qc1RpbWVzdGFtcDtcbiAgICBlbGVtLnRleHRDb250ZW50ID0gaGVscGVycy5jb252ZXJ0VGltZXN0YW1wKHRpbWVzdGFtcCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHNob3dTdWNjZXNzQ29tbWVudE1zZygpIHtcbiAgbGV0IGNvbW1lbnRTZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2LmNvbW1lbnQtc2VudCcpO1xuXG4gIGNvbW1lbnRTZW50LmNsYXNzTGlzdC50b2dnbGUoJ2hpZGUnKTtcblxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBjb21tZW50U2VudC5jbGFzc0xpc3QudG9nZ2xlKCdoaWRlJyk7XG4gIH0sIDUwMDApO1xufVxuXG5mdW5jdGlvbiBjbGVhckNvbW1lbnRGb3JtRXJyb3JzKCkge1xuICBsZXQgZXJyb3JzTXNncyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3AuZXJyLW1zZycpO1xuXG4gIGlmIChlcnJvcnNNc2dzKSB7XG4gICAgZXJyb3JzTXNncy5mb3JFYWNoKChlcnJvcnNNc2cpID0+IGVycm9yc01zZy5yZW1vdmUoKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGlzcGxheUNvbW1lbnRGb3JtRXJyb3JzKGVycm9ycykge1xuICBpZiAoQXJyYXkuaXNBcnJheShlcnJvcnMpKSB7XG4gICAgZXJyb3JzLmZvckVhY2goKGVycm9yKSA9PiB7XG4gICAgICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZXJyb3IuaWQpO1xuXG4gICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICBlbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcbiAgICAgICAgICAnYWZ0ZXJlbmQnLFxuICAgICAgICAgIGA8cCBjbGFzcz1cImVyci1tc2dcIj4ke2Vycm9yLm1zZ308L3A+YFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGF0dGFjaFNsaWRlc2hvdygpIHtcbiAgY29uc3Qgc2xpZGVzaG93ID0gbmV3IFNsaWRlc2hvdygpO1xuICBjb25zdCBzbGlkZXNob3dJbWFnZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhcnRpY2xlLnNsaWRlc2hvdyBpbWcnKTtcblxuICBpZiAoc2xpZGVzaG93SW1hZ2VzKSB7XG4gICAgc2xpZGVzaG93SW1hZ2VzLmZvckVhY2goKGltYWdlKSA9PiB7XG4gICAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNsaWRlc2hvdy5zdGFydCk7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXR0YWNoUGVybWFsaW5rKCkge1xuICBjb25zdCBwZXJtYWxpbmtzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmxiLXBvc3QtcGVybWFsaW5rIGEnKTtcblxuICBwZXJtYWxpbmtzLmZvckVhY2goKGxpbmspID0+IHtcbiAgICBsaW5rLmhyZWYgPSBwZXJtYWxpbmsuZ2V0VXJsKGxpbmsuaWQpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY2hlY2tQZXJtYWxpbmsocG9zdHMpIHtcbiAgdmFyIGZvdW5kID0gZmFsc2U7XG5cbiAgaWYgKHBlcm1hbGluay5faWQpIHtcbiAgICBwb3N0cy5faXRlbXMuZm9yRWFjaCgocG9zdCkgPT4ge1xuICAgICAgaWYgKHBlcm1hbGluay5faWQgPT09IHBvc3QuX2lkKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBmb3VuZDtcbn1cblxuZnVuY3Rpb24gcGVybWFsaW5rU2Nyb2xsKCkge1xuICB2YXIgc2Nyb2xsRWxlbTtcbiAgdmFyIGZvdW5kID0gZmFsc2U7XG4gIFxuICBzY3JvbGxFbGVtID0gaGVscGVycy5nZXRFbGVtcygnW2RhdGEtanMtcG9zdC1pZD1cXFwiJyArIHBlcm1hbGluay5faWQgKyAnXFxcIl0nKTtcblxuICBpZiAoc2Nyb2xsRWxlbS5sZW5ndGggPiAwKSB7XG4gICAgc2Nyb2xsRWxlbVswXS5jbGFzc0xpc3QuYWRkKCdsYi1wb3N0LXBlcm1hbGluay1zZWxlY3RlZCcpO1xuICAgIHNjcm9sbEVsZW1bMF0uc2Nyb2xsSW50b1ZpZXcoKTtcbiAgICBmb3VuZCA9IHRydWU7XG4gIH0gXG5cbiAgcmV0dXJuIGZvdW5kO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkUG9zdHM6IGFkZFBvc3RzLFxuICBkZWxldGVQb3N0OiBkZWxldGVQb3N0LFxuICBkaXNwbGF5TmV3UG9zdHM6IGRpc3BsYXlOZXdQb3N0cyxcbiAgcmVuZGVyVGltZWxpbmU6IHJlbmRlclRpbWVsaW5lLFxuICByZW5kZXJQb3N0czogcmVuZGVyUG9zdHMsXG4gIHVwZGF0ZVBvc3Q6IHVwZGF0ZVBvc3QsXG4gIHVwZGF0ZVRpbWVzdGFtcHM6IHVwZGF0ZVRpbWVzdGFtcHMsXG4gIGhpZGVMb2FkTW9yZTogaGlkZUxvYWRNb3JlLFxuICB0b2dnbGVTb3J0QnRuOiB0b2dnbGVTb3J0QnRuLFxuICB0b2dnbGVDb21tZW50RGlhbG9nOiB0b2dnbGVDb21tZW50RGlhbG9nLFxuICBzaG93U3VjY2Vzc0NvbW1lbnRNc2c6IHNob3dTdWNjZXNzQ29tbWVudE1zZyxcbiAgZGlzcGxheUNvbW1lbnRGb3JtRXJyb3JzOiBkaXNwbGF5Q29tbWVudEZvcm1FcnJvcnMsXG4gIGNsZWFyQ29tbWVudEZvcm1FcnJvcnM6IGNsZWFyQ29tbWVudEZvcm1FcnJvcnMsXG4gIGF0dGFjaFNsaWRlc2hvdzogYXR0YWNoU2xpZGVzaG93LFxuICBhdHRhY2hQZXJtYWxpbms6IGF0dGFjaFBlcm1hbGluayxcbiAgY2hlY2tQZXJtYWxpbms6IGNoZWNrUGVybWFsaW5rLFxuICBwZXJtYWxpbmtTY3JvbGw6IHBlcm1hbGlua1Njcm9sbCxcbiAgcGVybWFsaW5rOiBwZXJtYWxpbmtcbn07XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKVxuICAsIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY29uc3QgYXBpSG9zdCA9IExCLmFwaV9ob3N0Lm1hdGNoKC9cXC8kL2kpID8gTEIuYXBpX2hvc3QgOiBMQi5hcGlfaG9zdCArICcvJztcbmNvbnN0IGNvbW1lbnRJdGVtRW5kcG9pbnQgPSBgJHthcGlIb3N0fWFwaS9jbGllbnRfaXRlbXNgO1xuY29uc3QgY29tbWVudFBvc3RFbmRwb2ludCA9IGAke2FwaUhvc3R9YXBpL2NsaWVudF9jb21tZW50c2A7XG5cbnZhciBlbmRwb2ludCA9IGFwaUhvc3QgKyBcImFwaS9jbGllbnRfYmxvZ3MvXCIgKyBMQi5ibG9nLl9pZCArIFwiL3Bvc3RzXCJcbiAgLCBzZXR0aW5ncyA9IExCLnNldHRpbmdzXG4gICwgdm0gPSB7fTtcblxubGV0IGxhdGVzdFVwZGF0ZTtcbi8qKlxuICogR2V0IGluaXRpYWwgb3IgcmVzZXQgdmlld21vZGVsLlxuICogQHJldHVybnMge29iamVjdH0gZW1wdHkgdmlld21vZGVsIHN0b3JlLlxuICovXG5mdW5jdGlvbiBnZXRFbXB0eVZtKGl0ZW1zKSB7XG4gIHJldHVybiB7XG4gICAgX2l0ZW1zOiBuZXcgQXJyYXkoaXRlbXMpIHx8IDAsXG4gICAgY3VycmVudFBhZ2U6IDEsXG4gICAgdG90YWxQb3N0czogMFxuICB9O1xufVxuXG52bS5zZW5kQ29tbWVudCA9IChuYW1lLCBjb21tZW50KSA9PiB7XG4gIGxldCBlcnJvcnMgPSBbXTtcblxuICBpZiAoIW5hbWUpIHtcbiAgICBlcnJvcnMucHVzaCh7aWQ6ICcjY29tbWVudC1uYW1lJywgbXNnOiAnTWlzc2luZyBuYW1lJ30pO1xuICB9XG5cbiAgaWYgKCFjb21tZW50KSB7XG4gICAgZXJyb3JzLnB1c2goe2lkOiAnI2NvbW1lbnQtY29udGVudCcsIG1zZzogJ01pc3NpbmcgY29udGVudCd9KTtcbiAgfVxuXG4gIGlmIChlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiByZWplY3QoZXJyb3JzKSk7XG4gIH1cblxuICByZXR1cm4gaGVscGVyc1xuICAgIC5wb3N0KGNvbW1lbnRJdGVtRW5kcG9pbnQsIHtcbiAgICAgIGl0ZW1fdHlwZTogXCJjb21tZW50XCIsXG4gICAgICBjbGllbnRfYmxvZzogTEIuYmxvZy5faWQsXG4gICAgICBjb21tZW50ZXI6IG5hbWUsXG4gICAgICB0ZXh0OiBjb21tZW50XG4gICAgfSlcbiAgICAudGhlbigoaXRlbSkgPT4gaGVscGVycy5wb3N0KGNvbW1lbnRQb3N0RW5kcG9pbnQsIHtcbiAgICAgIHBvc3Rfc3RhdHVzOiBcImNvbW1lbnRcIixcbiAgICAgIGNsaWVudF9ibG9nOiBMQi5ibG9nLl9pZCxcbiAgICAgIGdyb3VwczogW3tcbiAgICAgICAgaWQ6IFwicm9vdFwiLFxuICAgICAgICByZWZzOiBbe2lkUmVmOiBcIm1haW5cIn1dLFxuICAgICAgICByb2xlOiBcImdycFJvbGU6TkVQXCJcbiAgICAgIH0se1xuICAgICAgICBpZDogXCJtYWluXCIsXG4gICAgICAgIHJlZnM6IFt7cmVzaWRSZWY6IGl0ZW0uX2lkfV0sXG4gICAgICAgIHJvbGU6IFwiZ3JwUm9sZTpNYWluXCJ9XG4gICAgICBdXG4gICAgfSkpO1xuICAgIC8vLmNhdGNoKChlcnIpID0+IHtcbiAgICAvLyAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIC8vfSk7XG59O1xuXG4vKipcbiAqIFByaXZhdGUgQVBJIHJlcXVlc3QgbWV0aG9kXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIHF1ZXJ5IGJ1aWxkZXIgb3B0aW9ucy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBvcHRzLnBhZ2UgLSBkZXNpcmVkIHBhZ2Uvc3Vic2V0IG9mIHBvc3RzLCBsZWF2ZSBlbXB0eSBmb3IgcG9sbGluZy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBvcHRzLmZyb21EYXRlIC0gbmVlZGVkIGZvciBwb2xsaW5nLlxuICogQHJldHVybnMge29iamVjdH0gTGl2ZWJsb2cgMyBBUEkgcmVzcG9uc2VcbiAqL1xudm0uZ2V0UG9zdHMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZGJRdWVyeSA9IHNlbGYuZ2V0UXVlcnkoe1xuICAgIHNvcnQ6IG9wdHMuc29ydCB8fCBzZWxmLnNldHRpbmdzLnBvc3RPcmRlcixcbiAgICBoaWdobGlnaHRzT25seTogZmFsc2UgfHwgb3B0cy5oaWdobGlnaHRzT25seSxcbiAgICBmcm9tRGF0ZTogb3B0cy5mcm9tRGF0ZVxuICAgICAgPyBvcHRzLmZyb21EYXRlXG4gICAgICA6IGZhbHNlXG4gIH0pO1xuXG4gIHZhciBwYWdlID0gb3B0cy5mcm9tRGF0ZSA/IDEgOiBvcHRzLnBhZ2U7XG4gIHZhciBxcyA9IFwiP21heF9yZXN1bHRzPVwiICsgc2V0dGluZ3MucG9zdHNQZXJQYWdlICsgXCImcGFnZT1cIiArIHBhZ2UgKyBcIiZzb3VyY2U9XCJcbiAgICAsIGZ1bGxQYXRoID0gZW5kcG9pbnQgKyBxcyArIGRiUXVlcnk7XG5cbiAgcmV0dXJuIGhlbHBlcnMuZ2V0SlNPTihmdWxsUGF0aClcbiAgICAudGhlbigocG9zdHMpID0+IHtcbiAgICAgIHNlbGYudXBkYXRlVmlld01vZGVsKHBvc3RzLCBvcHRzKTtcbiAgICAgIHBvc3RzLnJlcXVlc3RPcHRzID0gb3B0cztcbiAgICAgIHJldHVybiBwb3N0cztcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFByaXZhdGUgQVBJIHJlcXVlc3QgbWV0aG9kXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBMaXZlYmxvZyAzIEFQSSByZXNwb25zZVxuICovXG52bS5nZXRBbGxQb3N0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGRiUXVlcnkgPSBzZWxmLmdldFF1ZXJ5KHt9KTtcblxuICB2YXIgcXMgPSBcIj9zb3VyY2U9XCJcbiAgICAsIGZ1bGxQYXRoID0gZW5kcG9pbnQgKyBxcyArIGRiUXVlcnk7XG5cbiAgcmV0dXJuIGhlbHBlcnMuZ2V0SlNPTihmdWxsUGF0aCk7XG59O1xuXG4vKipcbiAqIEdldCBuZXh0IHBhZ2Ugb2YgcG9zdHMgZnJvbSBBUEkuXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIHF1ZXJ5IGJ1aWxkZXIgb3B0aW9ucy5cbiAqIEByZXR1cm5zIHtwcm9taXNlfSByZXNvbHZlcyB0byBwb3N0cyBhcnJheS5cbiAqL1xudm0ubG9hZFBvc3RzUGFnZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIG9wdHMucGFnZSA9ICsrdGhpcy52bS5jdXJyZW50UGFnZTtcbiAgb3B0cy5zb3J0ID0gdGhpcy5zZXR0aW5ncy5wb3N0T3JkZXI7XG4gIHJldHVybiB0aGlzLmdldFBvc3RzKG9wdHMpO1xufTtcblxuLyoqXG4gKiBQb2xsIEFQSSBmb3IgbmV3IHBvc3RzLlxuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBxdWVyeSBidWlsZGVyIG9wdGlvbnMuXG4gKiBAcmV0dXJucyB7cHJvbWlzZX0gcmVzb2x2ZXMgdG8gcG9zdHMgYXJyYXkuXG4gKi9cbnZtLmxvYWRQb3N0cyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIC8vb3B0cy5mcm9tRGF0ZSA9IHRoaXMudm0ubGF0ZXN0VXBkYXRlIHx8IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgcmV0dXJuIHRoaXMuZ2V0UG9zdHMob3B0cyk7XG59O1xuXG4vKipcbiAqIEFkZCBpdGVtcyBpbiBhcGkgcmVzcG9uc2UgJiBsYXRlc3QgdXBkYXRlIHRpbWVzdGFtcCB0byB2aWV3bW9kZWwuXG4gKiBAcGFyYW0ge29iamVjdH0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKi9cbnZtLnVwZGF0ZVZpZXdNb2RlbCA9IGZ1bmN0aW9uKGFwaV9yZXNwb25zZSwgb3B0cykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKCFvcHRzLmZyb21EYXRlIHx8IG9wdHMuc29ydCAmJiBvcHRzLnNvcnQgIT09IHNlbGYuc2V0dGluZ3MucG9zdE9yZGVyKSB7IC8vIE1lYW5zIHdlJ3JlIG5vdCBwb2xsaW5nXG4gICAgdmlldy5oaWRlTG9hZE1vcmUoc2VsZi5pc1RpbWVsaW5lRW5kKGFwaV9yZXNwb25zZSkpOyAvLyB0aGUgZW5kP1xuICB9IGVsc2UgeyAvLyBNZWFucyB3ZSdyZSBwb2xsaW5nIGZvciBuZXcgcG9zdHNcbiAgICBpZiAoIWFwaV9yZXNwb25zZS5faXRlbXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGF0ZXN0VXBkYXRlID0gc2VsZi5nZXRMYXRlc3RVcGRhdGUoYXBpX3Jlc3BvbnNlKTtcbiAgfVxuXG4gIGlmIChvcHRzLnNvcnQgIT09IHNlbGYuc2V0dGluZ3MucG9zdE9yZGVyKSB7XG4gICAgc2VsZi52bSA9IGdldEVtcHR5Vm0oKTtcbiAgICB2aWV3LmhpZGVMb2FkTW9yZShmYWxzZSk7XG4gICAgT2JqZWN0LmFzc2lnbihzZWxmLnZtLCBhcGlfcmVzcG9uc2UpO1xuICB9IGVsc2Uge1xuICAgIHNlbGYudm0uX2l0ZW1zLnB1c2guYXBwbHkoc2VsZi52bS5faXRlbXMsIGFwaV9yZXNwb25zZS5faXRlbXMpO1xuICB9XG5cbiAgaWYgKG9wdHMuc29ydCkge1xuICAgIHNlbGYuc2V0dGluZ3MucG9zdE9yZGVyID0gb3B0cy5zb3J0O1xuICB9XG5cbiAgcmV0dXJuIGFwaV9yZXNwb25zZTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBsYXRlc3QgdXBkYXRlIHRpbWVzdGFtcCBmcm9tIGEgbnVtYmVyIG9mIHBvc3RzLlxuICogQHBhcmFtIHtvYmplY3R9IGFwaV9yZXNwb25zZSAtIGxpdmVibG9nIEFQSSByZXNwb25zZSBKU09OLlxuICogQHJldHVybnMge3N0cmluZ30gLSBJU08gODYwMSBlbmNvZGVkIGRhdGVcbiAqL1xudm0uZ2V0TGF0ZXN0VXBkYXRlID0gZnVuY3Rpb24oYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciB0aW1lc3RhbXBzID0gYXBpX3Jlc3BvbnNlLl9pdGVtcy5tYXAoKHBvc3QpID0+IG5ldyBEYXRlKHBvc3QuX3VwZGF0ZWQpKTtcblxuICB2YXIgbGF0ZXN0ID0gbmV3IERhdGUoTWF0aC5tYXguYXBwbHkobnVsbCwgdGltZXN0YW1wcykpO1xuICByZXR1cm4gbGF0ZXN0LnRvSVNPU3RyaW5nKCk7IC8vIGNvbnZlcnQgdGltZXN0YW1wIHRvIElTT1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB3ZSByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHRpbWVsaW5lLlxuICogQHBhcmFtIHtvYmplY3R9IGFwaV9yZXNwb25zZSAtIGxpdmVibG9nIEFQSSByZXNwb25zZSBKU09OLlxuICogQHJldHVybnMge2Jvb2x9XG4gKi9cbnZtLmlzVGltZWxpbmVFbmQgPSBmdW5jdGlvbihhcGlfcmVzcG9uc2UpIHtcbiAgdmFyIGl0ZW1zSW5WaWV3ID0gdGhpcy52bS5faXRlbXMubGVuZ3RoICsgc2V0dGluZ3MucG9zdHNQZXJQYWdlO1xuICByZXR1cm4gYXBpX3Jlc3BvbnNlLl9tZXRhLnRvdGFsIDw9IGl0ZW1zSW5WaWV3O1xufTtcblxuLyoqXG4gKiBTZXQgdXAgdmlld21vZGVsLlxuICovXG52bS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgdGhpcy52bSA9IGdldEVtcHR5Vm0oc2V0dGluZ3MucG9zdHNQZXJQYWdlKTtcbiAgbGF0ZXN0VXBkYXRlID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICB0aGlzLnZtLnRpbWVJbml0aWFsaXplZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgdm0ubG9hZFBvc3RzKHtmcm9tRGF0ZTogbGF0ZXN0VXBkYXRlfSlcbiAgICAgIC50aGVuKHZpZXcucmVuZGVyUG9zdHMpIC8vIFN0YXJ0IHBvbGxpbmdcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgbGF0ZXN0VXBkYXRlID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgfSk7XG4gIH0sIDEwKjEwMDApO1xuXG4gIC8vcmV0dXJuIHRoaXMudm0ubGF0ZXN0VXBkYXRlO1xufTtcblxuLyoqXG4gKiBCdWlsZCB1cmxlbmNvZGVkIEVsYXN0aWNTZWFyY2ggUXVlcnlzdHJpbmdcbiAqIFRPRE86IGFic3RyYWN0IGF3YXksIHdlIG9ubHkgbmVlZCBzdGlja3kgZmxhZyBhbmQgb3JkZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gYXJndW1lbnRzIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IG9wdHMuc29ydCAtIGlmIFwiYXNjZW5kaW5nXCIsIGdldCBpdGVtcyBpbiBhc2NlbmRpbmcgb3JkZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLmZyb21EYXRlIC0gcmVzdWx0cyB3aXRoIGEgSVNPIDg2MDEgdGltZXN0YW1wIGd0IHRoaXMgb25seVxuICogQHBhcmFtIHtib29sfSBvcHRzLmhpZ2hsaWdodHNPbmx5IC0gZ2V0IGVkaXRvcmlhbC9oaWdobGlnaHRlZCBpdGVtcyBvbmx5XG4gKiBAcmV0dXJucyB7c3RyaW5nfSBRdWVyeXN0cmluZ1xuICovXG52bS5nZXRRdWVyeSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgdmFyIHF1ZXJ5ID0ge1xuICAgIFwicXVlcnlcIjoge1xuICAgICAgXCJmaWx0ZXJlZFwiOiB7XG4gICAgICAgIFwiZmlsdGVyXCI6IHtcbiAgICAgICAgICBcImFuZFwiOiBbXG4gICAgICAgICAgICB7XCJ0ZXJtXCI6IHtcInN0aWNreVwiOiBmYWxzZX19LFxuICAgICAgICAgICAge1widGVybVwiOiB7XCJwb3N0X3N0YXR1c1wiOiBcIm9wZW5cIn19LFxuICAgICAgICAgICAge1wibm90XCI6IHtcInRlcm1cIjoge1wiZGVsZXRlZFwiOiB0cnVlfX19LFxuICAgICAgICAgICAge1wicmFuZ2VcIjoge1wiX3VwZGF0ZWRcIjoge1wibHRcIjogdGhpcy52bSA/IHRoaXMudm0udGltZUluaXRpYWxpemVkIDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpfX19XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcInNvcnRcIjogW1xuICAgICAge1xuICAgICAgICBcIl91cGRhdGVkXCI6IHtcIm9yZGVyXCI6IFwiZGVzY1wifVxuICAgICAgfVxuICAgIF1cbiAgfTtcblxuICBpZiAob3B0cy5mcm9tRGF0ZSkge1xuICAgIHF1ZXJ5LnF1ZXJ5LmZpbHRlcmVkLmZpbHRlci5hbmRbM10ucmFuZ2UuX3VwZGF0ZWQgPSB7XG4gICAgICBcImd0XCI6IG9wdHMuZnJvbURhdGVcbiAgICB9O1xuICB9XG5cbiAgaWYgKG9wdHMuaGlnaGxpZ2h0c09ubHkgPT09IHRydWUpIHtcbiAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kLnB1c2goe1xuICAgICAgdGVybToge2hpZ2hsaWdodDogdHJ1ZX1cbiAgICB9KTtcbiAgfVxuXG4gIGlmIChvcHRzLnNvcnQgPT09IFwiYXNjZW5kaW5nXCIpIHtcbiAgICBxdWVyeS5zb3J0WzBdLl91cGRhdGVkLm9yZGVyID0gXCJhc2NcIjtcbiAgfSBlbHNlIGlmIChvcHRzLnNvcnQgPT09IFwiZWRpdG9yaWFsXCIpIHtcbiAgICBxdWVyeS5zb3J0ID0gW1xuICAgICAge1xuICAgICAgICBvcmRlcjoge1xuICAgICAgICAgIG9yZGVyOiBcImRlc2NcIixcbiAgICAgICAgICBtaXNzaW5nOiBcIl9sYXN0XCIsXG4gICAgICAgICAgdW5tYXBwZWRfdHlwZTogXCJsb25nXCJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF07XG4gIH1cblxuICAvLyBSZW1vdmUgdGhlIHJhbmdlLCB3ZSB3YW50IGFsbCB0aGUgcmVzdWx0c1xuICBpZiAoIW9wdHMuZnJvbURhdGUpIHtcbiAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kLmZvckVhY2goKHJ1bGUsIGluZGV4KSA9PiB7XG4gICAgICBpZiAocnVsZS5oYXNPd25Qcm9wZXJ0eSgncmFuZ2UnKSkge1xuICAgICAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kLnNwbGljZShpbmRleCwgMSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gZW5jb2RlVVJJKEpTT04uc3RyaW5naWZ5KHF1ZXJ5KSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHZtO1xuIiwiLy8hIG1vbWVudC5qc1xuLy8hIHZlcnNpb24gOiAyLjE4LjFcbi8vISBhdXRob3JzIDogVGltIFdvb2QsIElza3JlbiBDaGVybmV2LCBNb21lbnQuanMgY29udHJpYnV0b3JzXG4vLyEgbGljZW5zZSA6IE1JVFxuLy8hIG1vbWVudGpzLmNvbVxuXG47KGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKSA6XG4gICAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgICBnbG9iYWwubW9tZW50ID0gZmFjdG9yeSgpXG59KHRoaXMsIChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxudmFyIGhvb2tDYWxsYmFjaztcblxuZnVuY3Rpb24gaG9va3MgKCkge1xuICAgIHJldHVybiBob29rQ2FsbGJhY2suYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbn1cblxuLy8gVGhpcyBpcyBkb25lIHRvIHJlZ2lzdGVyIHRoZSBtZXRob2QgY2FsbGVkIHdpdGggbW9tZW50KClcbi8vIHdpdGhvdXQgY3JlYXRpbmcgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxuZnVuY3Rpb24gc2V0SG9va0NhbGxiYWNrIChjYWxsYmFjaykge1xuICAgIGhvb2tDYWxsYmFjayA9IGNhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBpc0FycmF5KGlucHV0KSB7XG4gICAgcmV0dXJuIGlucHV0IGluc3RhbmNlb2YgQXJyYXkgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoaW5wdXQpIHtcbiAgICAvLyBJRTggd2lsbCB0cmVhdCB1bmRlZmluZWQgYW5kIG51bGwgYXMgb2JqZWN0IGlmIGl0IHdhc24ndCBmb3JcbiAgICAvLyBpbnB1dCAhPSBudWxsXG4gICAgcmV0dXJuIGlucHV0ICE9IG51bGwgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0RW1wdHkob2JqKSB7XG4gICAgdmFyIGs7XG4gICAgZm9yIChrIGluIG9iaikge1xuICAgICAgICAvLyBldmVuIGlmIGl0cyBub3Qgb3duIHByb3BlcnR5IEknZCBzdGlsbCBjYWxsIGl0IG5vbi1lbXB0eVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dCA9PT0gdm9pZCAwO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihpbnB1dCkge1xuICAgIHJldHVybiB0eXBlb2YgaW5wdXQgPT09ICdudW1iZXInIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IE51bWJlcl0nO1xufVxuXG5mdW5jdGlvbiBpc0RhdGUoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQgaW5zdGFuY2VvZiBEYXRlIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cblxuZnVuY3Rpb24gbWFwKGFyciwgZm4pIHtcbiAgICB2YXIgcmVzID0gW10sIGk7XG4gICAgZm9yIChpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkge1xuICAgICAgICByZXMucHVzaChmbihhcnJbaV0sIGkpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gaGFzT3duUHJvcChhLCBiKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhLCBiKTtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKGEsIGIpIHtcbiAgICBmb3IgKHZhciBpIGluIGIpIHtcbiAgICAgICAgaWYgKGhhc093blByb3AoYiwgaSkpIHtcbiAgICAgICAgICAgIGFbaV0gPSBiW2ldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGhhc093blByb3AoYiwgJ3RvU3RyaW5nJykpIHtcbiAgICAgICAgYS50b1N0cmluZyA9IGIudG9TdHJpbmc7XG4gICAgfVxuXG4gICAgaWYgKGhhc093blByb3AoYiwgJ3ZhbHVlT2YnKSkge1xuICAgICAgICBhLnZhbHVlT2YgPSBiLnZhbHVlT2Y7XG4gICAgfVxuXG4gICAgcmV0dXJuIGE7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVVUQyAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QpIHtcbiAgICByZXR1cm4gY3JlYXRlTG9jYWxPclVUQyhpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCwgdHJ1ZSkudXRjKCk7XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRQYXJzaW5nRmxhZ3MoKSB7XG4gICAgLy8gV2UgbmVlZCB0byBkZWVwIGNsb25lIHRoaXMgb2JqZWN0LlxuICAgIHJldHVybiB7XG4gICAgICAgIGVtcHR5ICAgICAgICAgICA6IGZhbHNlLFxuICAgICAgICB1bnVzZWRUb2tlbnMgICAgOiBbXSxcbiAgICAgICAgdW51c2VkSW5wdXQgICAgIDogW10sXG4gICAgICAgIG92ZXJmbG93ICAgICAgICA6IC0yLFxuICAgICAgICBjaGFyc0xlZnRPdmVyICAgOiAwLFxuICAgICAgICBudWxsSW5wdXQgICAgICAgOiBmYWxzZSxcbiAgICAgICAgaW52YWxpZE1vbnRoICAgIDogbnVsbCxcbiAgICAgICAgaW52YWxpZEZvcm1hdCAgIDogZmFsc2UsXG4gICAgICAgIHVzZXJJbnZhbGlkYXRlZCA6IGZhbHNlLFxuICAgICAgICBpc28gICAgICAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgcGFyc2VkRGF0ZVBhcnRzIDogW10sXG4gICAgICAgIG1lcmlkaWVtICAgICAgICA6IG51bGwsXG4gICAgICAgIHJmYzI4MjIgICAgICAgICA6IGZhbHNlLFxuICAgICAgICB3ZWVrZGF5TWlzbWF0Y2ggOiBmYWxzZVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldFBhcnNpbmdGbGFncyhtKSB7XG4gICAgaWYgKG0uX3BmID09IG51bGwpIHtcbiAgICAgICAgbS5fcGYgPSBkZWZhdWx0UGFyc2luZ0ZsYWdzKCk7XG4gICAgfVxuICAgIHJldHVybiBtLl9wZjtcbn1cblxudmFyIHNvbWU7XG5pZiAoQXJyYXkucHJvdG90eXBlLnNvbWUpIHtcbiAgICBzb21lID0gQXJyYXkucHJvdG90eXBlLnNvbWU7XG59IGVsc2Uge1xuICAgIHNvbWUgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgICAgIHZhciB0ID0gT2JqZWN0KHRoaXMpO1xuICAgICAgICB2YXIgbGVuID0gdC5sZW5ndGggPj4+IDA7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgaW4gdCAmJiBmdW4uY2FsbCh0aGlzLCB0W2ldLCBpLCB0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG59XG5cbnZhciBzb21lJDEgPSBzb21lO1xuXG5mdW5jdGlvbiBpc1ZhbGlkKG0pIHtcbiAgICBpZiAobS5faXNWYWxpZCA9PSBudWxsKSB7XG4gICAgICAgIHZhciBmbGFncyA9IGdldFBhcnNpbmdGbGFncyhtKTtcbiAgICAgICAgdmFyIHBhcnNlZFBhcnRzID0gc29tZSQxLmNhbGwoZmxhZ3MucGFyc2VkRGF0ZVBhcnRzLCBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgcmV0dXJuIGkgIT0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBpc05vd1ZhbGlkID0gIWlzTmFOKG0uX2QuZ2V0VGltZSgpKSAmJlxuICAgICAgICAgICAgZmxhZ3Mub3ZlcmZsb3cgPCAwICYmXG4gICAgICAgICAgICAhZmxhZ3MuZW1wdHkgJiZcbiAgICAgICAgICAgICFmbGFncy5pbnZhbGlkTW9udGggJiZcbiAgICAgICAgICAgICFmbGFncy5pbnZhbGlkV2Vla2RheSAmJlxuICAgICAgICAgICAgIWZsYWdzLm51bGxJbnB1dCAmJlxuICAgICAgICAgICAgIWZsYWdzLmludmFsaWRGb3JtYXQgJiZcbiAgICAgICAgICAgICFmbGFncy51c2VySW52YWxpZGF0ZWQgJiZcbiAgICAgICAgICAgICghZmxhZ3MubWVyaWRpZW0gfHwgKGZsYWdzLm1lcmlkaWVtICYmIHBhcnNlZFBhcnRzKSk7XG5cbiAgICAgICAgaWYgKG0uX3N0cmljdCkge1xuICAgICAgICAgICAgaXNOb3dWYWxpZCA9IGlzTm93VmFsaWQgJiZcbiAgICAgICAgICAgICAgICBmbGFncy5jaGFyc0xlZnRPdmVyID09PSAwICYmXG4gICAgICAgICAgICAgICAgZmxhZ3MudW51c2VkVG9rZW5zLmxlbmd0aCA9PT0gMCAmJlxuICAgICAgICAgICAgICAgIGZsYWdzLmJpZ0hvdXIgPT09IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChPYmplY3QuaXNGcm96ZW4gPT0gbnVsbCB8fCAhT2JqZWN0LmlzRnJvemVuKG0pKSB7XG4gICAgICAgICAgICBtLl9pc1ZhbGlkID0gaXNOb3dWYWxpZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBpc05vd1ZhbGlkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtLl9pc1ZhbGlkO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVJbnZhbGlkIChmbGFncykge1xuICAgIHZhciBtID0gY3JlYXRlVVRDKE5hTik7XG4gICAgaWYgKGZsYWdzICE9IG51bGwpIHtcbiAgICAgICAgZXh0ZW5kKGdldFBhcnNpbmdGbGFncyhtKSwgZmxhZ3MpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKG0pLnVzZXJJbnZhbGlkYXRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG07XG59XG5cbi8vIFBsdWdpbnMgdGhhdCBhZGQgcHJvcGVydGllcyBzaG91bGQgYWxzbyBhZGQgdGhlIGtleSBoZXJlIChudWxsIHZhbHVlKSxcbi8vIHNvIHdlIGNhbiBwcm9wZXJseSBjbG9uZSBvdXJzZWx2ZXMuXG52YXIgbW9tZW50UHJvcGVydGllcyA9IGhvb2tzLm1vbWVudFByb3BlcnRpZXMgPSBbXTtcblxuZnVuY3Rpb24gY29weUNvbmZpZyh0bywgZnJvbSkge1xuICAgIHZhciBpLCBwcm9wLCB2YWw7XG5cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2lzQU1vbWVudE9iamVjdCkpIHtcbiAgICAgICAgdG8uX2lzQU1vbWVudE9iamVjdCA9IGZyb20uX2lzQU1vbWVudE9iamVjdDtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9pKSkge1xuICAgICAgICB0by5faSA9IGZyb20uX2k7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fZikpIHtcbiAgICAgICAgdG8uX2YgPSBmcm9tLl9mO1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2wpKSB7XG4gICAgICAgIHRvLl9sID0gZnJvbS5fbDtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9zdHJpY3QpKSB7XG4gICAgICAgIHRvLl9zdHJpY3QgPSBmcm9tLl9zdHJpY3Q7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fdHptKSkge1xuICAgICAgICB0by5fdHptID0gZnJvbS5fdHptO1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2lzVVRDKSkge1xuICAgICAgICB0by5faXNVVEMgPSBmcm9tLl9pc1VUQztcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9vZmZzZXQpKSB7XG4gICAgICAgIHRvLl9vZmZzZXQgPSBmcm9tLl9vZmZzZXQ7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fcGYpKSB7XG4gICAgICAgIHRvLl9wZiA9IGdldFBhcnNpbmdGbGFncyhmcm9tKTtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9sb2NhbGUpKSB7XG4gICAgICAgIHRvLl9sb2NhbGUgPSBmcm9tLl9sb2NhbGU7XG4gICAgfVxuXG4gICAgaWYgKG1vbWVudFByb3BlcnRpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbW9tZW50UHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcHJvcCA9IG1vbWVudFByb3BlcnRpZXNbaV07XG4gICAgICAgICAgICB2YWwgPSBmcm9tW3Byb3BdO1xuICAgICAgICAgICAgaWYgKCFpc1VuZGVmaW5lZCh2YWwpKSB7XG4gICAgICAgICAgICAgICAgdG9bcHJvcF0gPSB2YWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdG87XG59XG5cbnZhciB1cGRhdGVJblByb2dyZXNzID0gZmFsc2U7XG5cbi8vIE1vbWVudCBwcm90b3R5cGUgb2JqZWN0XG5mdW5jdGlvbiBNb21lbnQoY29uZmlnKSB7XG4gICAgY29weUNvbmZpZyh0aGlzLCBjb25maWcpO1xuICAgIHRoaXMuX2QgPSBuZXcgRGF0ZShjb25maWcuX2QgIT0gbnVsbCA/IGNvbmZpZy5fZC5nZXRUaW1lKCkgOiBOYU4pO1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgdGhpcy5fZCA9IG5ldyBEYXRlKE5hTik7XG4gICAgfVxuICAgIC8vIFByZXZlbnQgaW5maW5pdGUgbG9vcCBpbiBjYXNlIHVwZGF0ZU9mZnNldCBjcmVhdGVzIG5ldyBtb21lbnRcbiAgICAvLyBvYmplY3RzLlxuICAgIGlmICh1cGRhdGVJblByb2dyZXNzID09PSBmYWxzZSkge1xuICAgICAgICB1cGRhdGVJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgaG9va3MudXBkYXRlT2Zmc2V0KHRoaXMpO1xuICAgICAgICB1cGRhdGVJblByb2dyZXNzID0gZmFsc2U7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc01vbWVudCAob2JqKSB7XG4gICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE1vbWVudCB8fCAob2JqICE9IG51bGwgJiYgb2JqLl9pc0FNb21lbnRPYmplY3QgIT0gbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGFic0Zsb29yIChudW1iZXIpIHtcbiAgICBpZiAobnVtYmVyIDwgMCkge1xuICAgICAgICAvLyAtMCAtPiAwXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyKSB8fCAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKG51bWJlcik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0b0ludChhcmd1bWVudEZvckNvZXJjaW9uKSB7XG4gICAgdmFyIGNvZXJjZWROdW1iZXIgPSArYXJndW1lbnRGb3JDb2VyY2lvbixcbiAgICAgICAgdmFsdWUgPSAwO1xuXG4gICAgaWYgKGNvZXJjZWROdW1iZXIgIT09IDAgJiYgaXNGaW5pdGUoY29lcmNlZE51bWJlcikpIHtcbiAgICAgICAgdmFsdWUgPSBhYnNGbG9vcihjb2VyY2VkTnVtYmVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8vIGNvbXBhcmUgdHdvIGFycmF5cywgcmV0dXJuIHRoZSBudW1iZXIgb2YgZGlmZmVyZW5jZXNcbmZ1bmN0aW9uIGNvbXBhcmVBcnJheXMoYXJyYXkxLCBhcnJheTIsIGRvbnRDb252ZXJ0KSB7XG4gICAgdmFyIGxlbiA9IE1hdGgubWluKGFycmF5MS5sZW5ndGgsIGFycmF5Mi5sZW5ndGgpLFxuICAgICAgICBsZW5ndGhEaWZmID0gTWF0aC5hYnMoYXJyYXkxLmxlbmd0aCAtIGFycmF5Mi5sZW5ndGgpLFxuICAgICAgICBkaWZmcyA9IDAsXG4gICAgICAgIGk7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGlmICgoZG9udENvbnZlcnQgJiYgYXJyYXkxW2ldICE9PSBhcnJheTJbaV0pIHx8XG4gICAgICAgICAgICAoIWRvbnRDb252ZXJ0ICYmIHRvSW50KGFycmF5MVtpXSkgIT09IHRvSW50KGFycmF5MltpXSkpKSB7XG4gICAgICAgICAgICBkaWZmcysrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkaWZmcyArIGxlbmd0aERpZmY7XG59XG5cbmZ1bmN0aW9uIHdhcm4obXNnKSB7XG4gICAgaWYgKGhvb2tzLnN1cHByZXNzRGVwcmVjYXRpb25XYXJuaW5ncyA9PT0gZmFsc2UgJiZcbiAgICAgICAgICAgICh0eXBlb2YgY29uc29sZSAhPT0gICd1bmRlZmluZWQnKSAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdEZXByZWNhdGlvbiB3YXJuaW5nOiAnICsgbXNnKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlcHJlY2F0ZShtc2csIGZuKSB7XG4gICAgdmFyIGZpcnN0VGltZSA9IHRydWU7XG5cbiAgICByZXR1cm4gZXh0ZW5kKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGhvb2tzLmRlcHJlY2F0aW9uSGFuZGxlciAhPSBudWxsKSB7XG4gICAgICAgICAgICBob29rcy5kZXByZWNhdGlvbkhhbmRsZXIobnVsbCwgbXNnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmlyc3RUaW1lKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgdmFyIGFyZztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYXJnID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbaV0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZyArPSAnXFxuWycgKyBpICsgJ10gJztcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGFyZ3VtZW50c1swXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJnICs9IGtleSArICc6ICcgKyBhcmd1bWVudHNbMF1ba2V5XSArICcsICc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnNsaWNlKDAsIC0yKTsgLy8gUmVtb3ZlIHRyYWlsaW5nIGNvbW1hIGFuZCBzcGFjZVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGFyZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3YXJuKG1zZyArICdcXG5Bcmd1bWVudHM6ICcgKyBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzKS5qb2luKCcnKSArICdcXG4nICsgKG5ldyBFcnJvcigpKS5zdGFjayk7XG4gICAgICAgICAgICBmaXJzdFRpbWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9LCBmbik7XG59XG5cbnZhciBkZXByZWNhdGlvbnMgPSB7fTtcblxuZnVuY3Rpb24gZGVwcmVjYXRlU2ltcGxlKG5hbWUsIG1zZykge1xuICAgIGlmIChob29rcy5kZXByZWNhdGlvbkhhbmRsZXIgIT0gbnVsbCkge1xuICAgICAgICBob29rcy5kZXByZWNhdGlvbkhhbmRsZXIobmFtZSwgbXNnKTtcbiAgICB9XG4gICAgaWYgKCFkZXByZWNhdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgd2Fybihtc2cpO1xuICAgICAgICBkZXByZWNhdGlvbnNbbmFtZV0gPSB0cnVlO1xuICAgIH1cbn1cblxuaG9va3Muc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID0gZmFsc2U7XG5ob29rcy5kZXByZWNhdGlvbkhhbmRsZXIgPSBudWxsO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGlucHV0KSB7XG4gICAgcmV0dXJuIGlucHV0IGluc3RhbmNlb2YgRnVuY3Rpb24gfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn1cblxuZnVuY3Rpb24gc2V0IChjb25maWcpIHtcbiAgICB2YXIgcHJvcCwgaTtcbiAgICBmb3IgKGkgaW4gY29uZmlnKSB7XG4gICAgICAgIHByb3AgPSBjb25maWdbaV07XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHByb3ApKSB7XG4gICAgICAgICAgICB0aGlzW2ldID0gcHJvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXNbJ18nICsgaV0gPSBwcm9wO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcbiAgICAvLyBMZW5pZW50IG9yZGluYWwgcGFyc2luZyBhY2NlcHRzIGp1c3QgYSBudW1iZXIgaW4gYWRkaXRpb24gdG9cbiAgICAvLyBudW1iZXIgKyAocG9zc2libHkpIHN0dWZmIGNvbWluZyBmcm9tIF9kYXlPZk1vbnRoT3JkaW5hbFBhcnNlLlxuICAgIC8vIFRPRE86IFJlbW92ZSBcIm9yZGluYWxQYXJzZVwiIGZhbGxiYWNrIGluIG5leHQgbWFqb3IgcmVsZWFzZS5cbiAgICB0aGlzLl9kYXlPZk1vbnRoT3JkaW5hbFBhcnNlTGVuaWVudCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICh0aGlzLl9kYXlPZk1vbnRoT3JkaW5hbFBhcnNlLnNvdXJjZSB8fCB0aGlzLl9vcmRpbmFsUGFyc2Uuc291cmNlKSArXG4gICAgICAgICAgICAnfCcgKyAoL1xcZHsxLDJ9Lykuc291cmNlKTtcbn1cblxuZnVuY3Rpb24gbWVyZ2VDb25maWdzKHBhcmVudENvbmZpZywgY2hpbGRDb25maWcpIHtcbiAgICB2YXIgcmVzID0gZXh0ZW5kKHt9LCBwYXJlbnRDb25maWcpLCBwcm9wO1xuICAgIGZvciAocHJvcCBpbiBjaGlsZENvbmZpZykge1xuICAgICAgICBpZiAoaGFzT3duUHJvcChjaGlsZENvbmZpZywgcHJvcCkpIHtcbiAgICAgICAgICAgIGlmIChpc09iamVjdChwYXJlbnRDb25maWdbcHJvcF0pICYmIGlzT2JqZWN0KGNoaWxkQ29uZmlnW3Byb3BdKSkge1xuICAgICAgICAgICAgICAgIHJlc1twcm9wXSA9IHt9O1xuICAgICAgICAgICAgICAgIGV4dGVuZChyZXNbcHJvcF0sIHBhcmVudENvbmZpZ1twcm9wXSk7XG4gICAgICAgICAgICAgICAgZXh0ZW5kKHJlc1twcm9wXSwgY2hpbGRDb25maWdbcHJvcF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaGlsZENvbmZpZ1twcm9wXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmVzW3Byb3BdID0gY2hpbGRDb25maWdbcHJvcF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSByZXNbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChwcm9wIGluIHBhcmVudENvbmZpZykge1xuICAgICAgICBpZiAoaGFzT3duUHJvcChwYXJlbnRDb25maWcsIHByb3ApICYmXG4gICAgICAgICAgICAgICAgIWhhc093blByb3AoY2hpbGRDb25maWcsIHByb3ApICYmXG4gICAgICAgICAgICAgICAgaXNPYmplY3QocGFyZW50Q29uZmlnW3Byb3BdKSkge1xuICAgICAgICAgICAgLy8gbWFrZSBzdXJlIGNoYW5nZXMgdG8gcHJvcGVydGllcyBkb24ndCBtb2RpZnkgcGFyZW50IGNvbmZpZ1xuICAgICAgICAgICAgcmVzW3Byb3BdID0gZXh0ZW5kKHt9LCByZXNbcHJvcF0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIExvY2FsZShjb25maWcpIHtcbiAgICBpZiAoY29uZmlnICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5zZXQoY29uZmlnKTtcbiAgICB9XG59XG5cbnZhciBrZXlzO1xuXG5pZiAoT2JqZWN0LmtleXMpIHtcbiAgICBrZXlzID0gT2JqZWN0LmtleXM7XG59IGVsc2Uge1xuICAgIGtleXMgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBpLCByZXMgPSBbXTtcbiAgICAgICAgZm9yIChpIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKGhhc093blByb3Aob2JqLCBpKSkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbn1cblxudmFyIGtleXMkMSA9IGtleXM7XG5cbnZhciBkZWZhdWx0Q2FsZW5kYXIgPSB7XG4gICAgc2FtZURheSA6ICdbVG9kYXkgYXRdIExUJyxcbiAgICBuZXh0RGF5IDogJ1tUb21vcnJvdyBhdF0gTFQnLFxuICAgIG5leHRXZWVrIDogJ2RkZGQgW2F0XSBMVCcsXG4gICAgbGFzdERheSA6ICdbWWVzdGVyZGF5IGF0XSBMVCcsXG4gICAgbGFzdFdlZWsgOiAnW0xhc3RdIGRkZGQgW2F0XSBMVCcsXG4gICAgc2FtZUVsc2UgOiAnTCdcbn07XG5cbmZ1bmN0aW9uIGNhbGVuZGFyIChrZXksIG1vbSwgbm93KSB7XG4gICAgdmFyIG91dHB1dCA9IHRoaXMuX2NhbGVuZGFyW2tleV0gfHwgdGhpcy5fY2FsZW5kYXJbJ3NhbWVFbHNlJ107XG4gICAgcmV0dXJuIGlzRnVuY3Rpb24ob3V0cHV0KSA/IG91dHB1dC5jYWxsKG1vbSwgbm93KSA6IG91dHB1dDtcbn1cblxudmFyIGRlZmF1bHRMb25nRGF0ZUZvcm1hdCA9IHtcbiAgICBMVFMgIDogJ2g6bW06c3MgQScsXG4gICAgTFQgICA6ICdoOm1tIEEnLFxuICAgIEwgICAgOiAnTU0vREQvWVlZWScsXG4gICAgTEwgICA6ICdNTU1NIEQsIFlZWVknLFxuICAgIExMTCAgOiAnTU1NTSBELCBZWVlZIGg6bW0gQScsXG4gICAgTExMTCA6ICdkZGRkLCBNTU1NIEQsIFlZWVkgaDptbSBBJ1xufTtcblxuZnVuY3Rpb24gbG9uZ0RhdGVGb3JtYXQgKGtleSkge1xuICAgIHZhciBmb3JtYXQgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldLFxuICAgICAgICBmb3JtYXRVcHBlciA9IHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleS50b1VwcGVyQ2FzZSgpXTtcblxuICAgIGlmIChmb3JtYXQgfHwgIWZvcm1hdFVwcGVyKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgfVxuXG4gICAgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XSA9IGZvcm1hdFVwcGVyLnJlcGxhY2UoL01NTU18TU18RER8ZGRkZC9nLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIHJldHVybiB2YWwuc2xpY2UoMSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XTtcbn1cblxudmFyIGRlZmF1bHRJbnZhbGlkRGF0ZSA9ICdJbnZhbGlkIGRhdGUnO1xuXG5mdW5jdGlvbiBpbnZhbGlkRGF0ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludmFsaWREYXRlO1xufVxuXG52YXIgZGVmYXVsdE9yZGluYWwgPSAnJWQnO1xudmFyIGRlZmF1bHREYXlPZk1vbnRoT3JkaW5hbFBhcnNlID0gL1xcZHsxLDJ9LztcblxuZnVuY3Rpb24gb3JkaW5hbCAobnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX29yZGluYWwucmVwbGFjZSgnJWQnLCBudW1iZXIpO1xufVxuXG52YXIgZGVmYXVsdFJlbGF0aXZlVGltZSA9IHtcbiAgICBmdXR1cmUgOiAnaW4gJXMnLFxuICAgIHBhc3QgICA6ICclcyBhZ28nLFxuICAgIHMgIDogJ2EgZmV3IHNlY29uZHMnLFxuICAgIHNzIDogJyVkIHNlY29uZHMnLFxuICAgIG0gIDogJ2EgbWludXRlJyxcbiAgICBtbSA6ICclZCBtaW51dGVzJyxcbiAgICBoICA6ICdhbiBob3VyJyxcbiAgICBoaCA6ICclZCBob3VycycsXG4gICAgZCAgOiAnYSBkYXknLFxuICAgIGRkIDogJyVkIGRheXMnLFxuICAgIE0gIDogJ2EgbW9udGgnLFxuICAgIE1NIDogJyVkIG1vbnRocycsXG4gICAgeSAgOiAnYSB5ZWFyJyxcbiAgICB5eSA6ICclZCB5ZWFycydcbn07XG5cbmZ1bmN0aW9uIHJlbGF0aXZlVGltZSAobnVtYmVyLCB3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKSB7XG4gICAgdmFyIG91dHB1dCA9IHRoaXMuX3JlbGF0aXZlVGltZVtzdHJpbmddO1xuICAgIHJldHVybiAoaXNGdW5jdGlvbihvdXRwdXQpKSA/XG4gICAgICAgIG91dHB1dChudW1iZXIsIHdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpIDpcbiAgICAgICAgb3V0cHV0LnJlcGxhY2UoLyVkL2ksIG51bWJlcik7XG59XG5cbmZ1bmN0aW9uIHBhc3RGdXR1cmUgKGRpZmYsIG91dHB1dCkge1xuICAgIHZhciBmb3JtYXQgPSB0aGlzLl9yZWxhdGl2ZVRpbWVbZGlmZiA+IDAgPyAnZnV0dXJlJyA6ICdwYXN0J107XG4gICAgcmV0dXJuIGlzRnVuY3Rpb24oZm9ybWF0KSA/IGZvcm1hdChvdXRwdXQpIDogZm9ybWF0LnJlcGxhY2UoLyVzL2ksIG91dHB1dCk7XG59XG5cbnZhciBhbGlhc2VzID0ge307XG5cbmZ1bmN0aW9uIGFkZFVuaXRBbGlhcyAodW5pdCwgc2hvcnRoYW5kKSB7XG4gICAgdmFyIGxvd2VyQ2FzZSA9IHVuaXQudG9Mb3dlckNhc2UoKTtcbiAgICBhbGlhc2VzW2xvd2VyQ2FzZV0gPSBhbGlhc2VzW2xvd2VyQ2FzZSArICdzJ10gPSBhbGlhc2VzW3Nob3J0aGFuZF0gPSB1bml0O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVVbml0cyh1bml0cykge1xuICAgIHJldHVybiB0eXBlb2YgdW5pdHMgPT09ICdzdHJpbmcnID8gYWxpYXNlc1t1bml0c10gfHwgYWxpYXNlc1t1bml0cy50b0xvd2VyQ2FzZSgpXSA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplT2JqZWN0VW5pdHMoaW5wdXRPYmplY3QpIHtcbiAgICB2YXIgbm9ybWFsaXplZElucHV0ID0ge30sXG4gICAgICAgIG5vcm1hbGl6ZWRQcm9wLFxuICAgICAgICBwcm9wO1xuXG4gICAgZm9yIChwcm9wIGluIGlucHV0T2JqZWN0KSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGlucHV0T2JqZWN0LCBwcm9wKSkge1xuICAgICAgICAgICAgbm9ybWFsaXplZFByb3AgPSBub3JtYWxpemVVbml0cyhwcm9wKTtcbiAgICAgICAgICAgIGlmIChub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dFtub3JtYWxpemVkUHJvcF0gPSBpbnB1dE9iamVjdFtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBub3JtYWxpemVkSW5wdXQ7XG59XG5cbnZhciBwcmlvcml0aWVzID0ge307XG5cbmZ1bmN0aW9uIGFkZFVuaXRQcmlvcml0eSh1bml0LCBwcmlvcml0eSkge1xuICAgIHByaW9yaXRpZXNbdW5pdF0gPSBwcmlvcml0eTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJpb3JpdGl6ZWRVbml0cyh1bml0c09iaikge1xuICAgIHZhciB1bml0cyA9IFtdO1xuICAgIGZvciAodmFyIHUgaW4gdW5pdHNPYmopIHtcbiAgICAgICAgdW5pdHMucHVzaCh7dW5pdDogdSwgcHJpb3JpdHk6IHByaW9yaXRpZXNbdV19KTtcbiAgICB9XG4gICAgdW5pdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gYS5wcmlvcml0eSAtIGIucHJpb3JpdHk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHVuaXRzO1xufVxuXG5mdW5jdGlvbiBtYWtlR2V0U2V0ICh1bml0LCBrZWVwVGltZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHNldCQxKHRoaXMsIHVuaXQsIHZhbHVlKTtcbiAgICAgICAgICAgIGhvb2tzLnVwZGF0ZU9mZnNldCh0aGlzLCBrZWVwVGltZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBnZXQodGhpcywgdW5pdCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXQgKG1vbSwgdW5pdCkge1xuICAgIHJldHVybiBtb20uaXNWYWxpZCgpID9cbiAgICAgICAgbW9tLl9kWydnZXQnICsgKG1vbS5faXNVVEMgPyAnVVRDJyA6ICcnKSArIHVuaXRdKCkgOiBOYU47XG59XG5cbmZ1bmN0aW9uIHNldCQxIChtb20sIHVuaXQsIHZhbHVlKSB7XG4gICAgaWYgKG1vbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgbW9tLl9kWydzZXQnICsgKG1vbS5faXNVVEMgPyAnVVRDJyA6ICcnKSArIHVuaXRdKHZhbHVlKTtcbiAgICB9XG59XG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gc3RyaW5nR2V0ICh1bml0cykge1xuICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgIGlmIChpc0Z1bmN0aW9uKHRoaXNbdW5pdHNdKSkge1xuICAgICAgICByZXR1cm4gdGhpc1t1bml0c10oKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblxuZnVuY3Rpb24gc3RyaW5nU2V0ICh1bml0cywgdmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHVuaXRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZU9iamVjdFVuaXRzKHVuaXRzKTtcbiAgICAgICAgdmFyIHByaW9yaXRpemVkID0gZ2V0UHJpb3JpdGl6ZWRVbml0cyh1bml0cyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJpb3JpdGl6ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXNbcHJpb3JpdGl6ZWRbaV0udW5pdF0odW5pdHNbcHJpb3JpdGl6ZWRbaV0udW5pdF0pO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHRoaXNbdW5pdHNdKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHNdKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gemVyb0ZpbGwobnVtYmVyLCB0YXJnZXRMZW5ndGgsIGZvcmNlU2lnbikge1xuICAgIHZhciBhYnNOdW1iZXIgPSAnJyArIE1hdGguYWJzKG51bWJlciksXG4gICAgICAgIHplcm9zVG9GaWxsID0gdGFyZ2V0TGVuZ3RoIC0gYWJzTnVtYmVyLmxlbmd0aCxcbiAgICAgICAgc2lnbiA9IG51bWJlciA+PSAwO1xuICAgIHJldHVybiAoc2lnbiA/IChmb3JjZVNpZ24gPyAnKycgOiAnJykgOiAnLScpICtcbiAgICAgICAgTWF0aC5wb3coMTAsIE1hdGgubWF4KDAsIHplcm9zVG9GaWxsKSkudG9TdHJpbmcoKS5zdWJzdHIoMSkgKyBhYnNOdW1iZXI7XG59XG5cbnZhciBmb3JtYXR0aW5nVG9rZW5zID0gLyhcXFtbXlxcW10qXFxdKXwoXFxcXCk/KFtIaF1tbShzcyk/fE1vfE1NP00/TT98RG98REREb3xERD9EP0Q/fGRkZD9kP3xkbz98d1tvfHddP3xXW298V10/fFFvP3xZWVlZWVl8WVlZWVl8WVlZWXxZWXxnZyhnZ2c/KT98R0coR0dHPyk/fGV8RXxhfEF8aGg/fEhIP3xraz98bW0/fHNzP3xTezEsOX18eHxYfHp6P3xaWj98LikvZztcblxudmFyIGxvY2FsRm9ybWF0dGluZ1Rva2VucyA9IC8oXFxbW15cXFtdKlxcXSl8KFxcXFwpPyhMVFN8TFR8TEw/TD9MP3xsezEsNH0pL2c7XG5cbnZhciBmb3JtYXRGdW5jdGlvbnMgPSB7fTtcblxudmFyIGZvcm1hdFRva2VuRnVuY3Rpb25zID0ge307XG5cbi8vIHRva2VuOiAgICAnTSdcbi8vIHBhZGRlZDogICBbJ01NJywgMl1cbi8vIG9yZGluYWw6ICAnTW8nXG4vLyBjYWxsYmFjazogZnVuY3Rpb24gKCkgeyB0aGlzLm1vbnRoKCkgKyAxIH1cbmZ1bmN0aW9uIGFkZEZvcm1hdFRva2VuICh0b2tlbiwgcGFkZGVkLCBvcmRpbmFsLCBjYWxsYmFjaykge1xuICAgIHZhciBmdW5jID0gY2FsbGJhY2s7XG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZnVuYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW2NhbGxiYWNrXSgpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbdG9rZW5dID0gZnVuYztcbiAgICB9XG4gICAgaWYgKHBhZGRlZCkge1xuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9uc1twYWRkZWRbMF1dID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHplcm9GaWxsKGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKSwgcGFkZGVkWzFdLCBwYWRkZWRbMl0pO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAob3JkaW5hbCkge1xuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9uc1tvcmRpbmFsXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5vcmRpbmFsKGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKSwgdG9rZW4pO1xuICAgICAgICB9O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlRm9ybWF0dGluZ1Rva2VucyhpbnB1dCkge1xuICAgIGlmIChpbnB1dC5tYXRjaCgvXFxbW1xcc1xcU10vKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXlxcW3xcXF0kL2csICcnKTtcbiAgICB9XG4gICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xcXFwvZywgJycpO1xufVxuXG5mdW5jdGlvbiBtYWtlRm9ybWF0RnVuY3Rpb24oZm9ybWF0KSB7XG4gICAgdmFyIGFycmF5ID0gZm9ybWF0Lm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpLCBpLCBsZW5ndGg7XG5cbiAgICBmb3IgKGkgPSAwLCBsZW5ndGggPSBhcnJheS5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbYXJyYXlbaV1dKSB7XG4gICAgICAgICAgICBhcnJheVtpXSA9IGZvcm1hdFRva2VuRnVuY3Rpb25zW2FycmF5W2ldXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFycmF5W2ldID0gcmVtb3ZlRm9ybWF0dGluZ1Rva2VucyhhcnJheVtpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKG1vbSkge1xuICAgICAgICB2YXIgb3V0cHV0ID0gJycsIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgb3V0cHV0ICs9IGlzRnVuY3Rpb24oYXJyYXlbaV0pID8gYXJyYXlbaV0uY2FsbChtb20sIGZvcm1hdCkgOiBhcnJheVtpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG59XG5cbi8vIGZvcm1hdCBkYXRlIHVzaW5nIG5hdGl2ZSBkYXRlIG9iamVjdFxuZnVuY3Rpb24gZm9ybWF0TW9tZW50KG0sIGZvcm1hdCkge1xuICAgIGlmICghbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIG0ubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgfVxuXG4gICAgZm9ybWF0ID0gZXhwYW5kRm9ybWF0KGZvcm1hdCwgbS5sb2NhbGVEYXRhKCkpO1xuICAgIGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdID0gZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0gfHwgbWFrZUZvcm1hdEZ1bmN0aW9uKGZvcm1hdCk7XG5cbiAgICByZXR1cm4gZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0obSk7XG59XG5cbmZ1bmN0aW9uIGV4cGFuZEZvcm1hdChmb3JtYXQsIGxvY2FsZSkge1xuICAgIHZhciBpID0gNTtcblxuICAgIGZ1bmN0aW9uIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2VucyhpbnB1dCkge1xuICAgICAgICByZXR1cm4gbG9jYWxlLmxvbmdEYXRlRm9ybWF0KGlucHV0KSB8fCBpbnB1dDtcbiAgICB9XG5cbiAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICB3aGlsZSAoaSA+PSAwICYmIGxvY2FsRm9ybWF0dGluZ1Rva2Vucy50ZXN0KGZvcm1hdCkpIHtcbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UobG9jYWxGb3JtYXR0aW5nVG9rZW5zLCByZXBsYWNlTG9uZ0RhdGVGb3JtYXRUb2tlbnMpO1xuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgaSAtPSAxO1xuICAgIH1cblxuICAgIHJldHVybiBmb3JtYXQ7XG59XG5cbnZhciBtYXRjaDEgICAgICAgICA9IC9cXGQvOyAgICAgICAgICAgIC8vICAgICAgIDAgLSA5XG52YXIgbWF0Y2gyICAgICAgICAgPSAvXFxkXFxkLzsgICAgICAgICAgLy8gICAgICAwMCAtIDk5XG52YXIgbWF0Y2gzICAgICAgICAgPSAvXFxkezN9LzsgICAgICAgICAvLyAgICAgMDAwIC0gOTk5XG52YXIgbWF0Y2g0ICAgICAgICAgPSAvXFxkezR9LzsgICAgICAgICAvLyAgICAwMDAwIC0gOTk5OVxudmFyIG1hdGNoNiAgICAgICAgID0gL1srLV0/XFxkezZ9LzsgICAgLy8gLTk5OTk5OSAtIDk5OTk5OVxudmFyIG1hdGNoMXRvMiAgICAgID0gL1xcZFxcZD8vOyAgICAgICAgIC8vICAgICAgIDAgLSA5OVxudmFyIG1hdGNoM3RvNCAgICAgID0gL1xcZFxcZFxcZFxcZD8vOyAgICAgLy8gICAgIDk5OSAtIDk5OTlcbnZhciBtYXRjaDV0bzYgICAgICA9IC9cXGRcXGRcXGRcXGRcXGRcXGQ/LzsgLy8gICA5OTk5OSAtIDk5OTk5OVxudmFyIG1hdGNoMXRvMyAgICAgID0gL1xcZHsxLDN9LzsgICAgICAgLy8gICAgICAgMCAtIDk5OVxudmFyIG1hdGNoMXRvNCAgICAgID0gL1xcZHsxLDR9LzsgICAgICAgLy8gICAgICAgMCAtIDk5OTlcbnZhciBtYXRjaDF0bzYgICAgICA9IC9bKy1dP1xcZHsxLDZ9LzsgIC8vIC05OTk5OTkgLSA5OTk5OTlcblxudmFyIG1hdGNoVW5zaWduZWQgID0gL1xcZCsvOyAgICAgICAgICAgLy8gICAgICAgMCAtIGluZlxudmFyIG1hdGNoU2lnbmVkICAgID0gL1srLV0/XFxkKy87ICAgICAgLy8gICAgLWluZiAtIGluZlxuXG52YXIgbWF0Y2hPZmZzZXQgICAgPSAvWnxbKy1dXFxkXFxkOj9cXGRcXGQvZ2k7IC8vICswMDowMCAtMDA6MDAgKzAwMDAgLTAwMDAgb3IgWlxudmFyIG1hdGNoU2hvcnRPZmZzZXQgPSAvWnxbKy1dXFxkXFxkKD86Oj9cXGRcXGQpPy9naTsgLy8gKzAwIC0wMCArMDA6MDAgLTAwOjAwICswMDAwIC0wMDAwIG9yIFpcblxudmFyIG1hdGNoVGltZXN0YW1wID0gL1srLV0/XFxkKyhcXC5cXGR7MSwzfSk/LzsgLy8gMTIzNDU2Nzg5IDEyMzQ1Njc4OS4xMjNcblxuLy8gYW55IHdvcmQgKG9yIHR3bykgY2hhcmFjdGVycyBvciBudW1iZXJzIGluY2x1ZGluZyB0d28vdGhyZWUgd29yZCBtb250aCBpbiBhcmFiaWMuXG4vLyBpbmNsdWRlcyBzY290dGlzaCBnYWVsaWMgdHdvIHdvcmQgYW5kIGh5cGhlbmF0ZWQgbW9udGhzXG52YXIgbWF0Y2hXb3JkID0gL1swLTldKlsnYS16XFx1MDBBMC1cXHUwNUZGXFx1MDcwMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSt8W1xcdTA2MDAtXFx1MDZGRlxcL10rKFxccyo/W1xcdTA2MDAtXFx1MDZGRl0rKXsxLDJ9L2k7XG5cblxudmFyIHJlZ2V4ZXMgPSB7fTtcblxuZnVuY3Rpb24gYWRkUmVnZXhUb2tlbiAodG9rZW4sIHJlZ2V4LCBzdHJpY3RSZWdleCkge1xuICAgIHJlZ2V4ZXNbdG9rZW5dID0gaXNGdW5jdGlvbihyZWdleCkgPyByZWdleCA6IGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlRGF0YSkge1xuICAgICAgICByZXR1cm4gKGlzU3RyaWN0ICYmIHN0cmljdFJlZ2V4KSA/IHN0cmljdFJlZ2V4IDogcmVnZXg7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0UGFyc2VSZWdleEZvclRva2VuICh0b2tlbiwgY29uZmlnKSB7XG4gICAgaWYgKCFoYXNPd25Qcm9wKHJlZ2V4ZXMsIHRva2VuKSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cCh1bmVzY2FwZUZvcm1hdCh0b2tlbikpO1xuICAgIH1cblxuICAgIHJldHVybiByZWdleGVzW3Rva2VuXShjb25maWcuX3N0cmljdCwgY29uZmlnLl9sb2NhbGUpO1xufVxuXG4vLyBDb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNTYxNDkzL2lzLXRoZXJlLWEtcmVnZXhwLWVzY2FwZS1mdW5jdGlvbi1pbi1qYXZhc2NyaXB0XG5mdW5jdGlvbiB1bmVzY2FwZUZvcm1hdChzKSB7XG4gICAgcmV0dXJuIHJlZ2V4RXNjYXBlKHMucmVwbGFjZSgnXFxcXCcsICcnKS5yZXBsYWNlKC9cXFxcKFxcWyl8XFxcXChcXF0pfFxcWyhbXlxcXVxcW10qKVxcXXxcXFxcKC4pL2csIGZ1bmN0aW9uIChtYXRjaGVkLCBwMSwgcDIsIHAzLCBwNCkge1xuICAgICAgICByZXR1cm4gcDEgfHwgcDIgfHwgcDMgfHwgcDQ7XG4gICAgfSkpO1xufVxuXG5mdW5jdGlvbiByZWdleEVzY2FwZShzKSB7XG4gICAgcmV0dXJuIHMucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XG59XG5cbnZhciB0b2tlbnMgPSB7fTtcblxuZnVuY3Rpb24gYWRkUGFyc2VUb2tlbiAodG9rZW4sIGNhbGxiYWNrKSB7XG4gICAgdmFyIGksIGZ1bmMgPSBjYWxsYmFjaztcbiAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICB0b2tlbiA9IFt0b2tlbl07XG4gICAgfVxuICAgIGlmIChpc051bWJlcihjYWxsYmFjaykpIHtcbiAgICAgICAgZnVuYyA9IGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICAgICAgICAgIGFycmF5W2NhbGxiYWNrXSA9IHRvSW50KGlucHV0KTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHRva2VuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRva2Vuc1t0b2tlbltpXV0gPSBmdW5jO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYWRkV2Vla1BhcnNlVG9rZW4gKHRva2VuLCBjYWxsYmFjaykge1xuICAgIGFkZFBhcnNlVG9rZW4odG9rZW4sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZywgdG9rZW4pIHtcbiAgICAgICAgY29uZmlnLl93ID0gY29uZmlnLl93IHx8IHt9O1xuICAgICAgICBjYWxsYmFjayhpbnB1dCwgY29uZmlnLl93LCBjb25maWcsIHRva2VuKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYWRkVGltZVRvQXJyYXlGcm9tVG9rZW4odG9rZW4sIGlucHV0LCBjb25maWcpIHtcbiAgICBpZiAoaW5wdXQgIT0gbnVsbCAmJiBoYXNPd25Qcm9wKHRva2VucywgdG9rZW4pKSB7XG4gICAgICAgIHRva2Vuc1t0b2tlbl0oaW5wdXQsIGNvbmZpZy5fYSwgY29uZmlnLCB0b2tlbik7XG4gICAgfVxufVxuXG52YXIgWUVBUiA9IDA7XG52YXIgTU9OVEggPSAxO1xudmFyIERBVEUgPSAyO1xudmFyIEhPVVIgPSAzO1xudmFyIE1JTlVURSA9IDQ7XG52YXIgU0VDT05EID0gNTtcbnZhciBNSUxMSVNFQ09ORCA9IDY7XG52YXIgV0VFSyA9IDc7XG52YXIgV0VFS0RBWSA9IDg7XG5cbnZhciBpbmRleE9mO1xuXG5pZiAoQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcbiAgICBpbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2Y7XG59IGVsc2Uge1xuICAgIGluZGV4T2YgPSBmdW5jdGlvbiAobykge1xuICAgICAgICAvLyBJIGtub3dcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gbykge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9O1xufVxuXG52YXIgaW5kZXhPZiQxID0gaW5kZXhPZjtcblxuZnVuY3Rpb24gZGF5c0luTW9udGgoeWVhciwgbW9udGgpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoeWVhciwgbW9udGggKyAxLCAwKSkuZ2V0VVRDRGF0ZSgpO1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdNJywgWydNTScsIDJdLCAnTW8nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubW9udGgoKSArIDE7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oJ01NTScsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubW9udGhzU2hvcnQodGhpcywgZm9ybWF0KTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignTU1NTScsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubW9udGhzKHRoaXMsIGZvcm1hdCk7XG59KTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ21vbnRoJywgJ00nKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCdtb250aCcsIDgpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ00nLCAgICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignTU0nLCAgIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ01NTScsICBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUubW9udGhzU2hvcnRSZWdleChpc1N0cmljdCk7XG59KTtcbmFkZFJlZ2V4VG9rZW4oJ01NTU0nLCBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUubW9udGhzUmVnZXgoaXNTdHJpY3QpO1xufSk7XG5cbmFkZFBhcnNlVG9rZW4oWydNJywgJ01NJ10sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtNT05USF0gPSB0b0ludChpbnB1dCkgLSAxO1xufSk7XG5cbmFkZFBhcnNlVG9rZW4oWydNTU0nLCAnTU1NTSddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcsIHRva2VuKSB7XG4gICAgdmFyIG1vbnRoID0gY29uZmlnLl9sb2NhbGUubW9udGhzUGFyc2UoaW5wdXQsIHRva2VuLCBjb25maWcuX3N0cmljdCk7XG4gICAgLy8gaWYgd2UgZGlkbid0IGZpbmQgYSBtb250aCBuYW1lLCBtYXJrIHRoZSBkYXRlIGFzIGludmFsaWQuXG4gICAgaWYgKG1vbnRoICE9IG51bGwpIHtcbiAgICAgICAgYXJyYXlbTU9OVEhdID0gbW9udGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaW52YWxpZE1vbnRoID0gaW5wdXQ7XG4gICAgfVxufSk7XG5cbi8vIExPQ0FMRVNcblxudmFyIE1PTlRIU19JTl9GT1JNQVQgPSAvRFtvRF0/KFxcW1teXFxbXFxdXSpcXF18XFxzKStNTU1NPy87XG52YXIgZGVmYXVsdExvY2FsZU1vbnRocyA9ICdKYW51YXJ5X0ZlYnJ1YXJ5X01hcmNoX0FwcmlsX01heV9KdW5lX0p1bHlfQXVndXN0X1NlcHRlbWJlcl9PY3RvYmVyX05vdmVtYmVyX0RlY2VtYmVyJy5zcGxpdCgnXycpO1xuZnVuY3Rpb24gbG9jYWxlTW9udGhzIChtLCBmb3JtYXQpIHtcbiAgICBpZiAoIW0pIHtcbiAgICAgICAgcmV0dXJuIGlzQXJyYXkodGhpcy5fbW9udGhzKSA/IHRoaXMuX21vbnRocyA6XG4gICAgICAgICAgICB0aGlzLl9tb250aHNbJ3N0YW5kYWxvbmUnXTtcbiAgICB9XG4gICAgcmV0dXJuIGlzQXJyYXkodGhpcy5fbW9udGhzKSA/IHRoaXMuX21vbnRoc1ttLm1vbnRoKCldIDpcbiAgICAgICAgdGhpcy5fbW9udGhzWyh0aGlzLl9tb250aHMuaXNGb3JtYXQgfHwgTU9OVEhTX0lOX0ZPUk1BVCkudGVzdChmb3JtYXQpID8gJ2Zvcm1hdCcgOiAnc3RhbmRhbG9uZSddW20ubW9udGgoKV07XG59XG5cbnZhciBkZWZhdWx0TG9jYWxlTW9udGhzU2hvcnQgPSAnSmFuX0ZlYl9NYXJfQXByX01heV9KdW5fSnVsX0F1Z19TZXBfT2N0X05vdl9EZWMnLnNwbGl0KCdfJyk7XG5mdW5jdGlvbiBsb2NhbGVNb250aHNTaG9ydCAobSwgZm9ybWF0KSB7XG4gICAgaWYgKCFtKSB7XG4gICAgICAgIHJldHVybiBpc0FycmF5KHRoaXMuX21vbnRoc1Nob3J0KSA/IHRoaXMuX21vbnRoc1Nob3J0IDpcbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1Nob3J0WydzdGFuZGFsb25lJ107XG4gICAgfVxuICAgIHJldHVybiBpc0FycmF5KHRoaXMuX21vbnRoc1Nob3J0KSA/IHRoaXMuX21vbnRoc1Nob3J0W20ubW9udGgoKV0gOlxuICAgICAgICB0aGlzLl9tb250aHNTaG9ydFtNT05USFNfSU5fRk9STUFULnRlc3QoZm9ybWF0KSA/ICdmb3JtYXQnIDogJ3N0YW5kYWxvbmUnXVttLm1vbnRoKCldO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVTdHJpY3RQYXJzZShtb250aE5hbWUsIGZvcm1hdCwgc3RyaWN0KSB7XG4gICAgdmFyIGksIGlpLCBtb20sIGxsYyA9IG1vbnRoTmFtZS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2UpIHtcbiAgICAgICAgLy8gdGhpcyBpcyBub3QgdXNlZFxuICAgICAgICB0aGlzLl9tb250aHNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMTI7ICsraSkge1xuICAgICAgICAgICAgbW9tID0gY3JlYXRlVVRDKFsyMDAwLCBpXSk7XG4gICAgICAgICAgICB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlW2ldID0gdGhpcy5tb250aHNTaG9ydChtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdGhpcy5fbG9uZ01vbnRoc1BhcnNlW2ldID0gdGhpcy5tb250aHMobW9tLCAnJykudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ01NTScpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX2xvbmdNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm9ybWF0ID09PSAnTU1NJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fbG9uZ01vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fbG9uZ01vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvY2FsZU1vbnRoc1BhcnNlIChtb250aE5hbWUsIGZvcm1hdCwgc3RyaWN0KSB7XG4gICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICByZXR1cm4gaGFuZGxlU3RyaWN0UGFyc2UuY2FsbCh0aGlzLCBtb250aE5hbWUsIGZvcm1hdCwgc3RyaWN0KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX21vbnRoc1BhcnNlKSB7XG4gICAgICAgIHRoaXMuX21vbnRoc1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlID0gW107XG4gICAgfVxuXG4gICAgLy8gVE9ETzogYWRkIHNvcnRpbmdcbiAgICAvLyBTb3J0aW5nIG1ha2VzIHN1cmUgaWYgb25lIG1vbnRoIChvciBhYmJyKSBpcyBhIHByZWZpeCBvZiBhbm90aGVyXG4gICAgLy8gc2VlIHNvcnRpbmcgaW4gY29tcHV0ZU1vbnRoc1BhcnNlXG4gICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgIG1vbSA9IGNyZWF0ZVVUQyhbMjAwMCwgaV0pO1xuICAgICAgICBpZiAoc3RyaWN0ICYmICF0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5tb250aHMobW9tLCAnJykucmVwbGFjZSgnLicsICcnKSArICckJywgJ2knKTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0TW9udGhzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykucmVwbGFjZSgnLicsICcnKSArICckJywgJ2knKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXN0cmljdCAmJiAhdGhpcy5fbW9udGhzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgIHJlZ2V4ID0gJ14nICsgdGhpcy5tb250aHMobW9tLCAnJykgKyAnfF4nICsgdGhpcy5tb250aHNTaG9ydChtb20sICcnKTtcbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnTU1NTScgJiYgdGhpcy5fbG9uZ01vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ01NTScgJiYgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXS50ZXN0KG1vbnRoTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9IGVsc2UgaWYgKCFzdHJpY3QgJiYgdGhpcy5fbW9udGhzUGFyc2VbaV0udGVzdChtb250aE5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gTU9NRU5UU1xuXG5mdW5jdGlvbiBzZXRNb250aCAobW9tLCB2YWx1ZSkge1xuICAgIHZhciBkYXlPZk1vbnRoO1xuXG4gICAgaWYgKCFtb20uaXNWYWxpZCgpKSB7XG4gICAgICAgIC8vIE5vIG9wXG4gICAgICAgIHJldHVybiBtb207XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKC9eXFxkKyQvLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRvSW50KHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gbW9tLmxvY2FsZURhdGEoKS5tb250aHNQYXJzZSh2YWx1ZSk7XG4gICAgICAgICAgICAvLyBUT0RPOiBBbm90aGVyIHNpbGVudCBmYWlsdXJlP1xuICAgICAgICAgICAgaWYgKCFpc051bWJlcih2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGF5T2ZNb250aCA9IE1hdGgubWluKG1vbS5kYXRlKCksIGRheXNJbk1vbnRoKG1vbS55ZWFyKCksIHZhbHVlKSk7XG4gICAgbW9tLl9kWydzZXQnICsgKG1vbS5faXNVVEMgPyAnVVRDJyA6ICcnKSArICdNb250aCddKHZhbHVlLCBkYXlPZk1vbnRoKTtcbiAgICByZXR1cm4gbW9tO1xufVxuXG5mdW5jdGlvbiBnZXRTZXRNb250aCAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICBzZXRNb250aCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgIGhvb2tzLnVwZGF0ZU9mZnNldCh0aGlzLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdldCh0aGlzLCAnTW9udGgnKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldERheXNJbk1vbnRoICgpIHtcbiAgICByZXR1cm4gZGF5c0luTW9udGgodGhpcy55ZWFyKCksIHRoaXMubW9udGgoKSk7XG59XG5cbnZhciBkZWZhdWx0TW9udGhzU2hvcnRSZWdleCA9IG1hdGNoV29yZDtcbmZ1bmN0aW9uIG1vbnRoc1Nob3J0UmVnZXggKGlzU3RyaWN0KSB7XG4gICAgaWYgKHRoaXMuX21vbnRoc1BhcnNlRXhhY3QpIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfbW9udGhzUmVnZXgnKSkge1xuICAgICAgICAgICAgY29tcHV0ZU1vbnRoc1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTaG9ydFJlZ2V4O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfbW9udGhzU2hvcnRSZWdleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl9tb250aHNTaG9ydFJlZ2V4ID0gZGVmYXVsdE1vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0U3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleCA6IHRoaXMuX21vbnRoc1Nob3J0UmVnZXg7XG4gICAgfVxufVxuXG52YXIgZGVmYXVsdE1vbnRoc1JlZ2V4ID0gbWF0Y2hXb3JkO1xuZnVuY3Rpb24gbW9udGhzUmVnZXggKGlzU3RyaWN0KSB7XG4gICAgaWYgKHRoaXMuX21vbnRoc1BhcnNlRXhhY3QpIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfbW9udGhzUmVnZXgnKSkge1xuICAgICAgICAgICAgY29tcHV0ZU1vbnRoc1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU3RyaWN0UmVnZXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzUmVnZXg7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl9tb250aHNSZWdleCA9IGRlZmF1bHRNb250aHNSZWdleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzU3RyaWN0UmVnZXggOiB0aGlzLl9tb250aHNSZWdleDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVNb250aHNQYXJzZSAoKSB7XG4gICAgZnVuY3Rpb24gY21wTGVuUmV2KGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7XG4gICAgfVxuXG4gICAgdmFyIHNob3J0UGllY2VzID0gW10sIGxvbmdQaWVjZXMgPSBbXSwgbWl4ZWRQaWVjZXMgPSBbXSxcbiAgICAgICAgaSwgbW9tO1xuICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuICAgICAgICBtb20gPSBjcmVhdGVVVEMoWzIwMDAsIGldKTtcbiAgICAgICAgc2hvcnRQaWVjZXMucHVzaCh0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpKTtcbiAgICAgICAgbG9uZ1BpZWNlcy5wdXNoKHRoaXMubW9udGhzKG1vbSwgJycpKTtcbiAgICAgICAgbWl4ZWRQaWVjZXMucHVzaCh0aGlzLm1vbnRocyhtb20sICcnKSk7XG4gICAgICAgIG1peGVkUGllY2VzLnB1c2godGhpcy5tb250aHNTaG9ydChtb20sICcnKSk7XG4gICAgfVxuICAgIC8vIFNvcnRpbmcgbWFrZXMgc3VyZSBpZiBvbmUgbW9udGggKG9yIGFiYnIpIGlzIGEgcHJlZml4IG9mIGFub3RoZXIgaXRcbiAgICAvLyB3aWxsIG1hdGNoIHRoZSBsb25nZXIgcGllY2UuXG4gICAgc2hvcnRQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIGxvbmdQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIG1peGVkUGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICBzaG9ydFBpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKHNob3J0UGllY2VzW2ldKTtcbiAgICAgICAgbG9uZ1BpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKGxvbmdQaWVjZXNbaV0pO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgMjQ7IGkrKykge1xuICAgICAgICBtaXhlZFBpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKG1peGVkUGllY2VzW2ldKTtcbiAgICB9XG5cbiAgICB0aGlzLl9tb250aHNSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIG1peGVkUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl9tb250aHNTaG9ydFJlZ2V4ID0gdGhpcy5fbW9udGhzUmVnZXg7XG4gICAgdGhpcy5fbW9udGhzU3RyaWN0UmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBsb25nUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl9tb250aHNTaG9ydFN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgc2hvcnRQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdZJywgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHZhciB5ID0gdGhpcy55ZWFyKCk7XG4gICAgcmV0dXJuIHkgPD0gOTk5OSA/ICcnICsgeSA6ICcrJyArIHk7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oMCwgWydZWScsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMueWVhcigpICUgMTAwO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKDAsIFsnWVlZWScsICAgNF0sICAgICAgIDAsICd5ZWFyJyk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1lZWVlZJywgIDVdLCAgICAgICAwLCAneWVhcicpO1xuYWRkRm9ybWF0VG9rZW4oMCwgWydZWVlZWVknLCA2LCB0cnVlXSwgMCwgJ3llYXInKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ3llYXInLCAneScpO1xuXG4vLyBQUklPUklUSUVTXG5cbmFkZFVuaXRQcmlvcml0eSgneWVhcicsIDEpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ1knLCAgICAgIG1hdGNoU2lnbmVkKTtcbmFkZFJlZ2V4VG9rZW4oJ1lZJywgICAgIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ1lZWVknLCAgIG1hdGNoMXRvNCwgbWF0Y2g0KTtcbmFkZFJlZ2V4VG9rZW4oJ1lZWVlZJywgIG1hdGNoMXRvNiwgbWF0Y2g2KTtcbmFkZFJlZ2V4VG9rZW4oJ1lZWVlZWScsIG1hdGNoMXRvNiwgbWF0Y2g2KTtcblxuYWRkUGFyc2VUb2tlbihbJ1lZWVlZJywgJ1lZWVlZWSddLCBZRUFSKTtcbmFkZFBhcnNlVG9rZW4oJ1lZWVknLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgYXJyYXlbWUVBUl0gPSBpbnB1dC5sZW5ndGggPT09IDIgPyBob29rcy5wYXJzZVR3b0RpZ2l0WWVhcihpbnB1dCkgOiB0b0ludChpbnB1dCk7XG59KTtcbmFkZFBhcnNlVG9rZW4oJ1lZJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W1lFQVJdID0gaG9va3MucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpO1xufSk7XG5hZGRQYXJzZVRva2VuKCdZJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W1lFQVJdID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbn0pO1xuXG4vLyBIRUxQRVJTXG5cbmZ1bmN0aW9uIGRheXNJblllYXIoeWVhcikge1xuICAgIHJldHVybiBpc0xlYXBZZWFyKHllYXIpID8gMzY2IDogMzY1O1xufVxuXG5mdW5jdGlvbiBpc0xlYXBZZWFyKHllYXIpIHtcbiAgICByZXR1cm4gKHllYXIgJSA0ID09PSAwICYmIHllYXIgJSAxMDAgIT09IDApIHx8IHllYXIgJSA0MDAgPT09IDA7XG59XG5cbi8vIEhPT0tTXG5cbmhvb2tzLnBhcnNlVHdvRGlnaXRZZWFyID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgcmV0dXJuIHRvSW50KGlucHV0KSArICh0b0ludChpbnB1dCkgPiA2OCA/IDE5MDAgOiAyMDAwKTtcbn07XG5cbi8vIE1PTUVOVFNcblxudmFyIGdldFNldFllYXIgPSBtYWtlR2V0U2V0KCdGdWxsWWVhcicsIHRydWUpO1xuXG5mdW5jdGlvbiBnZXRJc0xlYXBZZWFyICgpIHtcbiAgICByZXR1cm4gaXNMZWFwWWVhcih0aGlzLnllYXIoKSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURhdGUgKHksIG0sIGQsIGgsIE0sIHMsIG1zKSB7XG4gICAgLy8gY2FuJ3QganVzdCBhcHBseSgpIHRvIGNyZWF0ZSBhIGRhdGU6XG4gICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xLzE4MTM0OFxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoeSwgbSwgZCwgaCwgTSwgcywgbXMpO1xuXG4gICAgLy8gdGhlIGRhdGUgY29uc3RydWN0b3IgcmVtYXBzIHllYXJzIDAtOTkgdG8gMTkwMC0xOTk5XG4gICAgaWYgKHkgPCAxMDAgJiYgeSA+PSAwICYmIGlzRmluaXRlKGRhdGUuZ2V0RnVsbFllYXIoKSkpIHtcbiAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih5KTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVVUQ0RhdGUgKHkpIHtcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKERhdGUuVVRDLmFwcGx5KG51bGwsIGFyZ3VtZW50cykpO1xuXG4gICAgLy8gdGhlIERhdGUuVVRDIGZ1bmN0aW9uIHJlbWFwcyB5ZWFycyAwLTk5IHRvIDE5MDAtMTk5OVxuICAgIGlmICh5IDwgMTAwICYmIHkgPj0gMCAmJiBpc0Zpbml0ZShkYXRlLmdldFVUQ0Z1bGxZZWFyKCkpKSB7XG4gICAgICAgIGRhdGUuc2V0VVRDRnVsbFllYXIoeSk7XG4gICAgfVxuICAgIHJldHVybiBkYXRlO1xufVxuXG4vLyBzdGFydC1vZi1maXJzdC13ZWVrIC0gc3RhcnQtb2YteWVhclxuZnVuY3Rpb24gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSB7XG4gICAgdmFyIC8vIGZpcnN0LXdlZWsgZGF5IC0tIHdoaWNoIGphbnVhcnkgaXMgYWx3YXlzIGluIHRoZSBmaXJzdCB3ZWVrICg0IGZvciBpc28sIDEgZm9yIG90aGVyKVxuICAgICAgICBmd2QgPSA3ICsgZG93IC0gZG95LFxuICAgICAgICAvLyBmaXJzdC13ZWVrIGRheSBsb2NhbCB3ZWVrZGF5IC0tIHdoaWNoIGxvY2FsIHdlZWtkYXkgaXMgZndkXG4gICAgICAgIGZ3ZGx3ID0gKDcgKyBjcmVhdGVVVENEYXRlKHllYXIsIDAsIGZ3ZCkuZ2V0VVRDRGF5KCkgLSBkb3cpICUgNztcblxuICAgIHJldHVybiAtZndkbHcgKyBmd2QgLSAxO1xufVxuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9JU09fd2Vla19kYXRlI0NhbGN1bGF0aW5nX2FfZGF0ZV9naXZlbl90aGVfeWVhci4yQ193ZWVrX251bWJlcl9hbmRfd2Vla2RheVxuZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtzKHllYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KSB7XG4gICAgdmFyIGxvY2FsV2Vla2RheSA9ICg3ICsgd2Vla2RheSAtIGRvdykgJSA3LFxuICAgICAgICB3ZWVrT2Zmc2V0ID0gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSxcbiAgICAgICAgZGF5T2ZZZWFyID0gMSArIDcgKiAod2VlayAtIDEpICsgbG9jYWxXZWVrZGF5ICsgd2Vla09mZnNldCxcbiAgICAgICAgcmVzWWVhciwgcmVzRGF5T2ZZZWFyO1xuXG4gICAgaWYgKGRheU9mWWVhciA8PSAwKSB7XG4gICAgICAgIHJlc1llYXIgPSB5ZWFyIC0gMTtcbiAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5c0luWWVhcihyZXNZZWFyKSArIGRheU9mWWVhcjtcbiAgICB9IGVsc2UgaWYgKGRheU9mWWVhciA+IGRheXNJblllYXIoeWVhcikpIHtcbiAgICAgICAgcmVzWWVhciA9IHllYXIgKyAxO1xuICAgICAgICByZXNEYXlPZlllYXIgPSBkYXlPZlllYXIgLSBkYXlzSW5ZZWFyKHllYXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc1llYXIgPSB5ZWFyO1xuICAgICAgICByZXNEYXlPZlllYXIgPSBkYXlPZlllYXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgeWVhcjogcmVzWWVhcixcbiAgICAgICAgZGF5T2ZZZWFyOiByZXNEYXlPZlllYXJcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB3ZWVrT2ZZZWFyKG1vbSwgZG93LCBkb3kpIHtcbiAgICB2YXIgd2Vla09mZnNldCA9IGZpcnN0V2Vla09mZnNldChtb20ueWVhcigpLCBkb3csIGRveSksXG4gICAgICAgIHdlZWsgPSBNYXRoLmZsb29yKChtb20uZGF5T2ZZZWFyKCkgLSB3ZWVrT2Zmc2V0IC0gMSkgLyA3KSArIDEsXG4gICAgICAgIHJlc1dlZWssIHJlc1llYXI7XG5cbiAgICBpZiAod2VlayA8IDEpIHtcbiAgICAgICAgcmVzWWVhciA9IG1vbS55ZWFyKCkgLSAxO1xuICAgICAgICByZXNXZWVrID0gd2VlayArIHdlZWtzSW5ZZWFyKHJlc1llYXIsIGRvdywgZG95KTtcbiAgICB9IGVsc2UgaWYgKHdlZWsgPiB3ZWVrc0luWWVhcihtb20ueWVhcigpLCBkb3csIGRveSkpIHtcbiAgICAgICAgcmVzV2VlayA9IHdlZWsgLSB3ZWVrc0luWWVhcihtb20ueWVhcigpLCBkb3csIGRveSk7XG4gICAgICAgIHJlc1llYXIgPSBtb20ueWVhcigpICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXNZZWFyID0gbW9tLnllYXIoKTtcbiAgICAgICAgcmVzV2VlayA9IHdlZWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgd2VlazogcmVzV2VlayxcbiAgICAgICAgeWVhcjogcmVzWWVhclxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHdlZWtzSW5ZZWFyKHllYXIsIGRvdywgZG95KSB7XG4gICAgdmFyIHdlZWtPZmZzZXQgPSBmaXJzdFdlZWtPZmZzZXQoeWVhciwgZG93LCBkb3kpLFxuICAgICAgICB3ZWVrT2Zmc2V0TmV4dCA9IGZpcnN0V2Vla09mZnNldCh5ZWFyICsgMSwgZG93LCBkb3kpO1xuICAgIHJldHVybiAoZGF5c0luWWVhcih5ZWFyKSAtIHdlZWtPZmZzZXQgKyB3ZWVrT2Zmc2V0TmV4dCkgLyA3O1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCd3JywgWyd3dycsIDJdLCAnd28nLCAnd2VlaycpO1xuYWRkRm9ybWF0VG9rZW4oJ1cnLCBbJ1dXJywgMl0sICdXbycsICdpc29XZWVrJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCd3ZWVrJywgJ3cnKTtcbmFkZFVuaXRBbGlhcygnaXNvV2VlaycsICdXJyk7XG5cbi8vIFBSSU9SSVRJRVNcblxuYWRkVW5pdFByaW9yaXR5KCd3ZWVrJywgNSk7XG5hZGRVbml0UHJpb3JpdHkoJ2lzb1dlZWsnLCA1KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCd3JywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCd3dycsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ1cnLCAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ1dXJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuXG5hZGRXZWVrUGFyc2VUb2tlbihbJ3cnLCAnd3cnLCAnVycsICdXVyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB3ZWVrW3Rva2VuLnN1YnN0cigwLCAxKV0gPSB0b0ludChpbnB1dCk7XG59KTtcblxuLy8gSEVMUEVSU1xuXG4vLyBMT0NBTEVTXG5cbmZ1bmN0aW9uIGxvY2FsZVdlZWsgKG1vbSkge1xuICAgIHJldHVybiB3ZWVrT2ZZZWFyKG1vbSwgdGhpcy5fd2Vlay5kb3csIHRoaXMuX3dlZWsuZG95KS53ZWVrO1xufVxuXG52YXIgZGVmYXVsdExvY2FsZVdlZWsgPSB7XG4gICAgZG93IDogMCwgLy8gU3VuZGF5IGlzIHRoZSBmaXJzdCBkYXkgb2YgdGhlIHdlZWsuXG4gICAgZG95IDogNiAgLy8gVGhlIHdlZWsgdGhhdCBjb250YWlucyBKYW4gMXN0IGlzIHRoZSBmaXJzdCB3ZWVrIG9mIHRoZSB5ZWFyLlxufTtcblxuZnVuY3Rpb24gbG9jYWxlRmlyc3REYXlPZldlZWsgKCkge1xuICAgIHJldHVybiB0aGlzLl93ZWVrLmRvdztcbn1cblxuZnVuY3Rpb24gbG9jYWxlRmlyc3REYXlPZlllYXIgKCkge1xuICAgIHJldHVybiB0aGlzLl93ZWVrLmRveTtcbn1cblxuLy8gTU9NRU5UU1xuXG5mdW5jdGlvbiBnZXRTZXRXZWVrIChpbnB1dCkge1xuICAgIHZhciB3ZWVrID0gdGhpcy5sb2NhbGVEYXRhKCkud2Vlayh0aGlzKTtcbiAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZCgoaW5wdXQgLSB3ZWVrKSAqIDcsICdkJyk7XG59XG5cbmZ1bmN0aW9uIGdldFNldElTT1dlZWsgKGlucHV0KSB7XG4gICAgdmFyIHdlZWsgPSB3ZWVrT2ZZZWFyKHRoaXMsIDEsIDQpLndlZWs7XG4gICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoKGlucHV0IC0gd2VlaykgKiA3LCAnZCcpO1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdkJywgMCwgJ2RvJywgJ2RheScpO1xuXG5hZGRGb3JtYXRUb2tlbignZGQnLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLndlZWtkYXlzTWluKHRoaXMsIGZvcm1hdCk7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oJ2RkZCcsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkud2Vla2RheXNTaG9ydCh0aGlzLCBmb3JtYXQpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdkZGRkJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS53ZWVrZGF5cyh0aGlzLCBmb3JtYXQpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdlJywgMCwgMCwgJ3dlZWtkYXknKTtcbmFkZEZvcm1hdFRva2VuKCdFJywgMCwgMCwgJ2lzb1dlZWtkYXknKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ2RheScsICdkJyk7XG5hZGRVbml0QWxpYXMoJ3dlZWtkYXknLCAnZScpO1xuYWRkVW5pdEFsaWFzKCdpc29XZWVrZGF5JywgJ0UnKTtcblxuLy8gUFJJT1JJVFlcbmFkZFVuaXRQcmlvcml0eSgnZGF5JywgMTEpO1xuYWRkVW5pdFByaW9yaXR5KCd3ZWVrZGF5JywgMTEpO1xuYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrZGF5JywgMTEpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ2QnLCAgICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignZScsICAgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdFJywgICAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ2RkJywgICBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUud2Vla2RheXNNaW5SZWdleChpc1N0cmljdCk7XG59KTtcbmFkZFJlZ2V4VG9rZW4oJ2RkZCcsICAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzU2hvcnRSZWdleChpc1N0cmljdCk7XG59KTtcbmFkZFJlZ2V4VG9rZW4oJ2RkZGQnLCAgIGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIGxvY2FsZS53ZWVrZGF5c1JlZ2V4KGlzU3RyaWN0KTtcbn0pO1xuXG5hZGRXZWVrUGFyc2VUb2tlbihbJ2RkJywgJ2RkZCcsICdkZGRkJ10sIGZ1bmN0aW9uIChpbnB1dCwgd2VlaywgY29uZmlnLCB0b2tlbikge1xuICAgIHZhciB3ZWVrZGF5ID0gY29uZmlnLl9sb2NhbGUud2Vla2RheXNQYXJzZShpbnB1dCwgdG9rZW4sIGNvbmZpZy5fc3RyaWN0KTtcbiAgICAvLyBpZiB3ZSBkaWRuJ3QgZ2V0IGEgd2Vla2RheSBuYW1lLCBtYXJrIHRoZSBkYXRlIGFzIGludmFsaWRcbiAgICBpZiAod2Vla2RheSAhPSBudWxsKSB7XG4gICAgICAgIHdlZWsuZCA9IHdlZWtkYXk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaW52YWxpZFdlZWtkYXkgPSBpbnB1dDtcbiAgICB9XG59KTtcblxuYWRkV2Vla1BhcnNlVG9rZW4oWydkJywgJ2UnLCAnRSddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB3ZWVrW3Rva2VuXSA9IHRvSW50KGlucHV0KTtcbn0pO1xuXG4vLyBIRUxQRVJTXG5cbmZ1bmN0aW9uIHBhcnNlV2Vla2RheShpbnB1dCwgbG9jYWxlKSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cblxuICAgIGlmICghaXNOYU4oaW5wdXQpKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChpbnB1dCwgMTApO1xuICAgIH1cblxuICAgIGlucHV0ID0gbG9jYWxlLndlZWtkYXlzUGFyc2UoaW5wdXQpO1xuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcGFyc2VJc29XZWVrZGF5KGlucHV0LCBsb2NhbGUpIHtcbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzUGFyc2UoaW5wdXQpICUgNyB8fCA3O1xuICAgIH1cbiAgICByZXR1cm4gaXNOYU4oaW5wdXQpID8gbnVsbCA6IGlucHV0O1xufVxuXG4vLyBMT0NBTEVTXG5cbnZhciBkZWZhdWx0TG9jYWxlV2Vla2RheXMgPSAnU3VuZGF5X01vbmRheV9UdWVzZGF5X1dlZG5lc2RheV9UaHVyc2RheV9GcmlkYXlfU2F0dXJkYXknLnNwbGl0KCdfJyk7XG5mdW5jdGlvbiBsb2NhbGVXZWVrZGF5cyAobSwgZm9ybWF0KSB7XG4gICAgaWYgKCFtKSB7XG4gICAgICAgIHJldHVybiBpc0FycmF5KHRoaXMuX3dlZWtkYXlzKSA/IHRoaXMuX3dlZWtkYXlzIDpcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzWydzdGFuZGFsb25lJ107XG4gICAgfVxuICAgIHJldHVybiBpc0FycmF5KHRoaXMuX3dlZWtkYXlzKSA/IHRoaXMuX3dlZWtkYXlzW20uZGF5KCldIDpcbiAgICAgICAgdGhpcy5fd2Vla2RheXNbdGhpcy5fd2Vla2RheXMuaXNGb3JtYXQudGVzdChmb3JtYXQpID8gJ2Zvcm1hdCcgOiAnc3RhbmRhbG9uZSddW20uZGF5KCldO1xufVxuXG52YXIgZGVmYXVsdExvY2FsZVdlZWtkYXlzU2hvcnQgPSAnU3VuX01vbl9UdWVfV2VkX1RodV9GcmlfU2F0Jy5zcGxpdCgnXycpO1xuZnVuY3Rpb24gbG9jYWxlV2Vla2RheXNTaG9ydCAobSkge1xuICAgIHJldHVybiAobSkgPyB0aGlzLl93ZWVrZGF5c1Nob3J0W20uZGF5KCldIDogdGhpcy5fd2Vla2RheXNTaG9ydDtcbn1cblxudmFyIGRlZmF1bHRMb2NhbGVXZWVrZGF5c01pbiA9ICdTdV9Nb19UdV9XZV9UaF9Gcl9TYScuc3BsaXQoJ18nKTtcbmZ1bmN0aW9uIGxvY2FsZVdlZWtkYXlzTWluIChtKSB7XG4gICAgcmV0dXJuIChtKSA/IHRoaXMuX3dlZWtkYXlzTWluW20uZGF5KCldIDogdGhpcy5fd2Vla2RheXNNaW47XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVN0cmljdFBhcnNlJDEod2Vla2RheU5hbWUsIGZvcm1hdCwgc3RyaWN0KSB7XG4gICAgdmFyIGksIGlpLCBtb20sIGxsYyA9IHdlZWtkYXlOYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlKSB7XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2UgPSBbXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNzsgKytpKSB7XG4gICAgICAgICAgICBtb20gPSBjcmVhdGVVVEMoWzIwMDAsIDFdKS5kYXkoaSk7XG4gICAgICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5c01pbihtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5cyhtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0cmljdCkge1xuICAgICAgICBpZiAoZm9ybWF0ID09PSAnZGRkZCcpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSAnZGRkJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9taW5XZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdkZGRkJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl93ZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSAnZGRkJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl93ZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX21pbldlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl93ZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9jYWxlV2Vla2RheXNQYXJzZSAod2Vla2RheU5hbWUsIGZvcm1hdCwgc3RyaWN0KSB7XG4gICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgIHJldHVybiBoYW5kbGVTdHJpY3RQYXJzZSQxLmNhbGwodGhpcywgd2Vla2RheU5hbWUsIGZvcm1hdCwgc3RyaWN0KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2UpIHtcbiAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9mdWxsV2Vla2RheXNQYXJzZSA9IFtdO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG5cbiAgICAgICAgbW9tID0gY3JlYXRlVVRDKFsyMDAwLCAxXSkuZGF5KGkpO1xuICAgICAgICBpZiAoc3RyaWN0ICYmICF0aGlzLl9mdWxsV2Vla2RheXNQYXJzZVtpXSkge1xuICAgICAgICAgICAgdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykucmVwbGFjZSgnLicsICdcXC4/JykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICB0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKS5yZXBsYWNlKCcuJywgJ1xcLj8nKSArICckJywgJ2knKTtcbiAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJykucmVwbGFjZSgnLicsICdcXC4/JykgKyAnJCcsICdpJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlW2ldKSB7XG4gICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykgKyAnfF4nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnZGRkZCcgJiYgdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBmb3JtYXQgPT09ICdkZGQnICYmIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXS50ZXN0KHdlZWtkYXlOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ2RkJyAmJiB0aGlzLl9taW5XZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfSBlbHNlIGlmICghc3RyaWN0ICYmIHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFNldERheU9mV2VlayAoaW5wdXQpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsID8gdGhpcyA6IE5hTjtcbiAgICB9XG4gICAgdmFyIGRheSA9IHRoaXMuX2lzVVRDID8gdGhpcy5fZC5nZXRVVENEYXkoKSA6IHRoaXMuX2QuZ2V0RGF5KCk7XG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgaW5wdXQgPSBwYXJzZVdlZWtkYXkoaW5wdXQsIHRoaXMubG9jYWxlRGF0YSgpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKGlucHV0IC0gZGF5LCAnZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBkYXk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRTZXRMb2NhbGVEYXlPZldlZWsgKGlucHV0KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgfVxuICAgIHZhciB3ZWVrZGF5ID0gKHRoaXMuZGF5KCkgKyA3IC0gdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWsuZG93KSAlIDc7XG4gICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrZGF5IDogdGhpcy5hZGQoaW5wdXQgLSB3ZWVrZGF5LCAnZCcpO1xufVxuXG5mdW5jdGlvbiBnZXRTZXRJU09EYXlPZldlZWsgKGlucHV0KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgfVxuXG4gICAgLy8gYmVoYXZlcyB0aGUgc2FtZSBhcyBtb21lbnQjZGF5IGV4Y2VwdFxuICAgIC8vIGFzIGEgZ2V0dGVyLCByZXR1cm5zIDcgaW5zdGVhZCBvZiAwICgxLTcgcmFuZ2UgaW5zdGVhZCBvZiAwLTYpXG4gICAgLy8gYXMgYSBzZXR0ZXIsIHN1bmRheSBzaG91bGQgYmVsb25nIHRvIHRoZSBwcmV2aW91cyB3ZWVrLlxuXG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgdmFyIHdlZWtkYXkgPSBwYXJzZUlzb1dlZWtkYXkoaW5wdXQsIHRoaXMubG9jYWxlRGF0YSgpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF5KHRoaXMuZGF5KCkgJSA3ID8gd2Vla2RheSA6IHdlZWtkYXkgLSA3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXkoKSB8fCA3O1xuICAgIH1cbn1cblxudmFyIGRlZmF1bHRXZWVrZGF5c1JlZ2V4ID0gbWF0Y2hXb3JkO1xuZnVuY3Rpb24gd2Vla2RheXNSZWdleCAoaXNTdHJpY3QpIHtcbiAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX3dlZWtkYXlzUmVnZXgnKSkge1xuICAgICAgICAgICAgY29tcHV0ZVdlZWtkYXlzUGFyc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1N0cmljdFJlZ2V4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzUmVnZXg7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUmVnZXggPSBkZWZhdWx0V2Vla2RheXNSZWdleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1N0cmljdFJlZ2V4IDogdGhpcy5fd2Vla2RheXNSZWdleDtcbiAgICB9XG59XG5cbnZhciBkZWZhdWx0V2Vla2RheXNTaG9ydFJlZ2V4ID0gbWF0Y2hXb3JkO1xuZnVuY3Rpb24gd2Vla2RheXNTaG9ydFJlZ2V4IChpc1N0cmljdCkge1xuICAgIGlmICh0aGlzLl93ZWVrZGF5c1BhcnNlRXhhY3QpIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNSZWdleCcpKSB7XG4gICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1N0cmljdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1Nob3J0UmVnZXgnKSkge1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNTaG9ydFJlZ2V4ID0gZGVmYXVsdFdlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTaG9ydFN0cmljdFJlZ2V4ICYmIGlzU3RyaWN0ID9cbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleCA6IHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleDtcbiAgICB9XG59XG5cbnZhciBkZWZhdWx0V2Vla2RheXNNaW5SZWdleCA9IG1hdGNoV29yZDtcbmZ1bmN0aW9uIHdlZWtkYXlzTWluUmVnZXggKGlzU3RyaWN0KSB7XG4gICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VFeGFjdCkge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgIGNvbXB1dGVXZWVrZGF5c1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNNaW5TdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNNaW5SZWdleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c01pblJlZ2V4ID0gZGVmYXVsdFdlZWtkYXlzTWluUmVnZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNNaW5TdHJpY3RSZWdleCA6IHRoaXMuX3dlZWtkYXlzTWluUmVnZXg7XG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIGNvbXB1dGVXZWVrZGF5c1BhcnNlICgpIHtcbiAgICBmdW5jdGlvbiBjbXBMZW5SZXYoYSwgYikge1xuICAgICAgICByZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aDtcbiAgICB9XG5cbiAgICB2YXIgbWluUGllY2VzID0gW10sIHNob3J0UGllY2VzID0gW10sIGxvbmdQaWVjZXMgPSBbXSwgbWl4ZWRQaWVjZXMgPSBbXSxcbiAgICAgICAgaSwgbW9tLCBtaW5wLCBzaG9ydHAsIGxvbmdwO1xuICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgIG1vbSA9IGNyZWF0ZVVUQyhbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgbWlucCA9IHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XG4gICAgICAgIHNob3J0cCA9IHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKTtcbiAgICAgICAgbG9uZ3AgPSB0aGlzLndlZWtkYXlzKG1vbSwgJycpO1xuICAgICAgICBtaW5QaWVjZXMucHVzaChtaW5wKTtcbiAgICAgICAgc2hvcnRQaWVjZXMucHVzaChzaG9ydHApO1xuICAgICAgICBsb25nUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKG1pbnApO1xuICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKHNob3J0cCk7XG4gICAgICAgIG1peGVkUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgIH1cbiAgICAvLyBTb3J0aW5nIG1ha2VzIHN1cmUgaWYgb25lIHdlZWtkYXkgKG9yIGFiYnIpIGlzIGEgcHJlZml4IG9mIGFub3RoZXIgaXRcbiAgICAvLyB3aWxsIG1hdGNoIHRoZSBsb25nZXIgcGllY2UuXG4gICAgbWluUGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICBzaG9ydFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgbG9uZ1BpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgbWl4ZWRQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgc2hvcnRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShzaG9ydFBpZWNlc1tpXSk7XG4gICAgICAgIGxvbmdQaWVjZXNbaV0gPSByZWdleEVzY2FwZShsb25nUGllY2VzW2ldKTtcbiAgICAgICAgbWl4ZWRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShtaXhlZFBpZWNlc1tpXSk7XG4gICAgfVxuXG4gICAgdGhpcy5fd2Vla2RheXNSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIG1peGVkUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl93ZWVrZGF5c1Nob3J0UmVnZXggPSB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuICAgIHRoaXMuX3dlZWtkYXlzTWluUmVnZXggPSB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuXG4gICAgdGhpcy5fd2Vla2RheXNTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIGxvbmdQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIHNob3J0UGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl93ZWVrZGF5c01pblN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgbWluUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5mdW5jdGlvbiBoRm9ybWF0KCkge1xuICAgIHJldHVybiB0aGlzLmhvdXJzKCkgJSAxMiB8fCAxMjtcbn1cblxuZnVuY3Rpb24ga0Zvcm1hdCgpIHtcbiAgICByZXR1cm4gdGhpcy5ob3VycygpIHx8IDI0O1xufVxuXG5hZGRGb3JtYXRUb2tlbignSCcsIFsnSEgnLCAyXSwgMCwgJ2hvdXInKTtcbmFkZEZvcm1hdFRva2VuKCdoJywgWydoaCcsIDJdLCAwLCBoRm9ybWF0KTtcbmFkZEZvcm1hdFRva2VuKCdrJywgWydraycsIDJdLCAwLCBrRm9ybWF0KTtcblxuYWRkRm9ybWF0VG9rZW4oJ2htbScsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJycgKyBoRm9ybWF0LmFwcGx5KHRoaXMpICsgemVyb0ZpbGwodGhpcy5taW51dGVzKCksIDIpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdobW1zcycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJycgKyBoRm9ybWF0LmFwcGx5KHRoaXMpICsgemVyb0ZpbGwodGhpcy5taW51dGVzKCksIDIpICtcbiAgICAgICAgemVyb0ZpbGwodGhpcy5zZWNvbmRzKCksIDIpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdIbW0nLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICcnICsgdGhpcy5ob3VycygpICsgemVyb0ZpbGwodGhpcy5taW51dGVzKCksIDIpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdIbW1zcycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJycgKyB0aGlzLmhvdXJzKCkgKyB6ZXJvRmlsbCh0aGlzLm1pbnV0ZXMoKSwgMikgK1xuICAgICAgICB6ZXJvRmlsbCh0aGlzLnNlY29uZHMoKSwgMik7XG59KTtcblxuZnVuY3Rpb24gbWVyaWRpZW0gKHRva2VuLCBsb3dlcmNhc2UpIHtcbiAgICBhZGRGb3JtYXRUb2tlbih0b2tlbiwgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubWVyaWRpZW0odGhpcy5ob3VycygpLCB0aGlzLm1pbnV0ZXMoKSwgbG93ZXJjYXNlKTtcbiAgICB9KTtcbn1cblxubWVyaWRpZW0oJ2EnLCB0cnVlKTtcbm1lcmlkaWVtKCdBJywgZmFsc2UpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnaG91cicsICdoJyk7XG5cbi8vIFBSSU9SSVRZXG5hZGRVbml0UHJpb3JpdHkoJ2hvdXInLCAxMyk7XG5cbi8vIFBBUlNJTkdcblxuZnVuY3Rpb24gbWF0Y2hNZXJpZGllbSAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUuX21lcmlkaWVtUGFyc2U7XG59XG5cbmFkZFJlZ2V4VG9rZW4oJ2EnLCAgbWF0Y2hNZXJpZGllbSk7XG5hZGRSZWdleFRva2VuKCdBJywgIG1hdGNoTWVyaWRpZW0pO1xuYWRkUmVnZXhUb2tlbignSCcsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignaCcsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignaycsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignSEgnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdoaCcsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ2trJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuXG5hZGRSZWdleFRva2VuKCdobW0nLCBtYXRjaDN0bzQpO1xuYWRkUmVnZXhUb2tlbignaG1tc3MnLCBtYXRjaDV0bzYpO1xuYWRkUmVnZXhUb2tlbignSG1tJywgbWF0Y2gzdG80KTtcbmFkZFJlZ2V4VG9rZW4oJ0htbXNzJywgbWF0Y2g1dG82KTtcblxuYWRkUGFyc2VUb2tlbihbJ0gnLCAnSEgnXSwgSE9VUik7XG5hZGRQYXJzZVRva2VuKFsnaycsICdrayddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICB2YXIga0lucHV0ID0gdG9JbnQoaW5wdXQpO1xuICAgIGFycmF5W0hPVVJdID0ga0lucHV0ID09PSAyNCA/IDAgOiBrSW5wdXQ7XG59KTtcbmFkZFBhcnNlVG9rZW4oWydhJywgJ0EnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl9pc1BtID0gY29uZmlnLl9sb2NhbGUuaXNQTShpbnB1dCk7XG4gICAgY29uZmlnLl9tZXJpZGllbSA9IGlucHV0O1xufSk7XG5hZGRQYXJzZVRva2VuKFsnaCcsICdoaCddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICBhcnJheVtIT1VSXSA9IHRvSW50KGlucHV0KTtcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbn0pO1xuYWRkUGFyc2VUb2tlbignaG1tJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgdmFyIHBvcyA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zKSk7XG4gICAgYXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MpKTtcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbn0pO1xuYWRkUGFyc2VUb2tlbignaG1tc3MnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICB2YXIgcG9zMSA9IGlucHV0Lmxlbmd0aCAtIDQ7XG4gICAgdmFyIHBvczIgPSBpbnB1dC5sZW5ndGggLSAyO1xuICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvczEpKTtcbiAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczEsIDIpKTtcbiAgICBhcnJheVtTRUNPTkRdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczIpKTtcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbn0pO1xuYWRkUGFyc2VUb2tlbignSG1tJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgdmFyIHBvcyA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zKSk7XG4gICAgYXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MpKTtcbn0pO1xuYWRkUGFyc2VUb2tlbignSG1tc3MnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICB2YXIgcG9zMSA9IGlucHV0Lmxlbmd0aCAtIDQ7XG4gICAgdmFyIHBvczIgPSBpbnB1dC5sZW5ndGggLSAyO1xuICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvczEpKTtcbiAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczEsIDIpKTtcbiAgICBhcnJheVtTRUNPTkRdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczIpKTtcbn0pO1xuXG4vLyBMT0NBTEVTXG5cbmZ1bmN0aW9uIGxvY2FsZUlzUE0gKGlucHV0KSB7XG4gICAgLy8gSUU4IFF1aXJrcyBNb2RlICYgSUU3IFN0YW5kYXJkcyBNb2RlIGRvIG5vdCBhbGxvdyBhY2Nlc3Npbmcgc3RyaW5ncyBsaWtlIGFycmF5c1xuICAgIC8vIFVzaW5nIGNoYXJBdCBzaG91bGQgYmUgbW9yZSBjb21wYXRpYmxlLlxuICAgIHJldHVybiAoKGlucHV0ICsgJycpLnRvTG93ZXJDYXNlKCkuY2hhckF0KDApID09PSAncCcpO1xufVxuXG52YXIgZGVmYXVsdExvY2FsZU1lcmlkaWVtUGFyc2UgPSAvW2FwXVxcLj9tP1xcLj8vaTtcbmZ1bmN0aW9uIGxvY2FsZU1lcmlkaWVtIChob3VycywgbWludXRlcywgaXNMb3dlcikge1xuICAgIGlmIChob3VycyA+IDExKSB7XG4gICAgICAgIHJldHVybiBpc0xvd2VyID8gJ3BtJyA6ICdQTSc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAnYW0nIDogJ0FNJztcbiAgICB9XG59XG5cblxuLy8gTU9NRU5UU1xuXG4vLyBTZXR0aW5nIHRoZSBob3VyIHNob3VsZCBrZWVwIHRoZSB0aW1lLCBiZWNhdXNlIHRoZSB1c2VyIGV4cGxpY2l0bHlcbi8vIHNwZWNpZmllZCB3aGljaCBob3VyIGhlIHdhbnRzLiBTbyB0cnlpbmcgdG8gbWFpbnRhaW4gdGhlIHNhbWUgaG91ciAoaW5cbi8vIGEgbmV3IHRpbWV6b25lKSBtYWtlcyBzZW5zZS4gQWRkaW5nL3N1YnRyYWN0aW5nIGhvdXJzIGRvZXMgbm90IGZvbGxvd1xuLy8gdGhpcyBydWxlLlxudmFyIGdldFNldEhvdXIgPSBtYWtlR2V0U2V0KCdIb3VycycsIHRydWUpO1xuXG4vLyBtb250aHNcbi8vIHdlZWtcbi8vIHdlZWtkYXlzXG4vLyBtZXJpZGllbVxudmFyIGJhc2VDb25maWcgPSB7XG4gICAgY2FsZW5kYXI6IGRlZmF1bHRDYWxlbmRhcixcbiAgICBsb25nRGF0ZUZvcm1hdDogZGVmYXVsdExvbmdEYXRlRm9ybWF0LFxuICAgIGludmFsaWREYXRlOiBkZWZhdWx0SW52YWxpZERhdGUsXG4gICAgb3JkaW5hbDogZGVmYXVsdE9yZGluYWwsXG4gICAgZGF5T2ZNb250aE9yZGluYWxQYXJzZTogZGVmYXVsdERheU9mTW9udGhPcmRpbmFsUGFyc2UsXG4gICAgcmVsYXRpdmVUaW1lOiBkZWZhdWx0UmVsYXRpdmVUaW1lLFxuXG4gICAgbW9udGhzOiBkZWZhdWx0TG9jYWxlTW9udGhzLFxuICAgIG1vbnRoc1Nob3J0OiBkZWZhdWx0TG9jYWxlTW9udGhzU2hvcnQsXG5cbiAgICB3ZWVrOiBkZWZhdWx0TG9jYWxlV2VlayxcblxuICAgIHdlZWtkYXlzOiBkZWZhdWx0TG9jYWxlV2Vla2RheXMsXG4gICAgd2Vla2RheXNNaW46IGRlZmF1bHRMb2NhbGVXZWVrZGF5c01pbixcbiAgICB3ZWVrZGF5c1Nob3J0OiBkZWZhdWx0TG9jYWxlV2Vla2RheXNTaG9ydCxcblxuICAgIG1lcmlkaWVtUGFyc2U6IGRlZmF1bHRMb2NhbGVNZXJpZGllbVBhcnNlXG59O1xuXG4vLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsb2NhbGUgY29uZmlnIGZpbGVzXG52YXIgbG9jYWxlcyA9IHt9O1xudmFyIGxvY2FsZUZhbWlsaWVzID0ge307XG52YXIgZ2xvYmFsTG9jYWxlO1xuXG5mdW5jdGlvbiBub3JtYWxpemVMb2NhbGUoa2V5KSB7XG4gICAgcmV0dXJuIGtleSA/IGtleS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJ18nLCAnLScpIDoga2V5O1xufVxuXG4vLyBwaWNrIHRoZSBsb2NhbGUgZnJvbSB0aGUgYXJyYXlcbi8vIHRyeSBbJ2VuLWF1JywgJ2VuLWdiJ10gYXMgJ2VuLWF1JywgJ2VuLWdiJywgJ2VuJywgYXMgaW4gbW92ZSB0aHJvdWdoIHRoZSBsaXN0IHRyeWluZyBlYWNoXG4vLyBzdWJzdHJpbmcgZnJvbSBtb3N0IHNwZWNpZmljIHRvIGxlYXN0LCBidXQgbW92ZSB0byB0aGUgbmV4dCBhcnJheSBpdGVtIGlmIGl0J3MgYSBtb3JlIHNwZWNpZmljIHZhcmlhbnQgdGhhbiB0aGUgY3VycmVudCByb290XG5mdW5jdGlvbiBjaG9vc2VMb2NhbGUobmFtZXMpIHtcbiAgICB2YXIgaSA9IDAsIGosIG5leHQsIGxvY2FsZSwgc3BsaXQ7XG5cbiAgICB3aGlsZSAoaSA8IG5hbWVzLmxlbmd0aCkge1xuICAgICAgICBzcGxpdCA9IG5vcm1hbGl6ZUxvY2FsZShuYW1lc1tpXSkuc3BsaXQoJy0nKTtcbiAgICAgICAgaiA9IHNwbGl0Lmxlbmd0aDtcbiAgICAgICAgbmV4dCA9IG5vcm1hbGl6ZUxvY2FsZShuYW1lc1tpICsgMV0pO1xuICAgICAgICBuZXh0ID0gbmV4dCA/IG5leHQuc3BsaXQoJy0nKSA6IG51bGw7XG4gICAgICAgIHdoaWxlIChqID4gMCkge1xuICAgICAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShzcGxpdC5zbGljZSgwLCBqKS5qb2luKCctJykpO1xuICAgICAgICAgICAgaWYgKGxvY2FsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmV4dCAmJiBuZXh0Lmxlbmd0aCA+PSBqICYmIGNvbXBhcmVBcnJheXMoc3BsaXQsIG5leHQsIHRydWUpID49IGogLSAxKSB7XG4gICAgICAgICAgICAgICAgLy90aGUgbmV4dCBhcnJheSBpdGVtIGlzIGJldHRlciB0aGFuIGEgc2hhbGxvd2VyIHN1YnN0cmluZyBvZiB0aGlzIG9uZVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgai0tO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGxvYWRMb2NhbGUobmFtZSkge1xuICAgIHZhciBvbGRMb2NhbGUgPSBudWxsO1xuICAgIC8vIFRPRE86IEZpbmQgYSBiZXR0ZXIgd2F5IHRvIHJlZ2lzdGVyIGFuZCBsb2FkIGFsbCB0aGUgbG9jYWxlcyBpbiBOb2RlXG4gICAgaWYgKCFsb2NhbGVzW25hbWVdICYmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykgJiZcbiAgICAgICAgICAgIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgb2xkTG9jYWxlID0gZ2xvYmFsTG9jYWxlLl9hYmJyO1xuICAgICAgICAgICAgcmVxdWlyZSgnLi9sb2NhbGUvJyArIG5hbWUpO1xuICAgICAgICAgICAgLy8gYmVjYXVzZSBkZWZpbmVMb2NhbGUgY3VycmVudGx5IGFsc28gc2V0cyB0aGUgZ2xvYmFsIGxvY2FsZSwgd2VcbiAgICAgICAgICAgIC8vIHdhbnQgdG8gdW5kbyB0aGF0IGZvciBsYXp5IGxvYWRlZCBsb2NhbGVzXG4gICAgICAgICAgICBnZXRTZXRHbG9iYWxMb2NhbGUob2xkTG9jYWxlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkgeyB9XG4gICAgfVxuICAgIHJldHVybiBsb2NhbGVzW25hbWVdO1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIHdpbGwgbG9hZCBsb2NhbGUgYW5kIHRoZW4gc2V0IHRoZSBnbG9iYWwgbG9jYWxlLiAgSWZcbi8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnQgZ2xvYmFsXG4vLyBsb2NhbGUga2V5LlxuZnVuY3Rpb24gZ2V0U2V0R2xvYmFsTG9jYWxlIChrZXksIHZhbHVlcykge1xuICAgIHZhciBkYXRhO1xuICAgIGlmIChrZXkpIHtcbiAgICAgICAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlcykpIHtcbiAgICAgICAgICAgIGRhdGEgPSBnZXRMb2NhbGUoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSBkZWZpbmVMb2NhbGUoa2V5LCB2YWx1ZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIC8vIG1vbWVudC5kdXJhdGlvbi5fbG9jYWxlID0gbW9tZW50Ll9sb2NhbGUgPSBkYXRhO1xuICAgICAgICAgICAgZ2xvYmFsTG9jYWxlID0gZGF0YTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBnbG9iYWxMb2NhbGUuX2FiYnI7XG59XG5cbmZ1bmN0aW9uIGRlZmluZUxvY2FsZSAobmFtZSwgY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZyAhPT0gbnVsbCkge1xuICAgICAgICB2YXIgcGFyZW50Q29uZmlnID0gYmFzZUNvbmZpZztcbiAgICAgICAgY29uZmlnLmFiYnIgPSBuYW1lO1xuICAgICAgICBpZiAobG9jYWxlc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgICBkZXByZWNhdGVTaW1wbGUoJ2RlZmluZUxvY2FsZU92ZXJyaWRlJyxcbiAgICAgICAgICAgICAgICAgICAgJ3VzZSBtb21lbnQudXBkYXRlTG9jYWxlKGxvY2FsZU5hbWUsIGNvbmZpZykgdG8gY2hhbmdlICcgK1xuICAgICAgICAgICAgICAgICAgICAnYW4gZXhpc3RpbmcgbG9jYWxlLiBtb21lbnQuZGVmaW5lTG9jYWxlKGxvY2FsZU5hbWUsICcgK1xuICAgICAgICAgICAgICAgICAgICAnY29uZmlnKSBzaG91bGQgb25seSBiZSB1c2VkIGZvciBjcmVhdGluZyBhIG5ldyBsb2NhbGUgJyArXG4gICAgICAgICAgICAgICAgICAgICdTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9kZWZpbmUtbG9jYWxlLyBmb3IgbW9yZSBpbmZvLicpO1xuICAgICAgICAgICAgcGFyZW50Q29uZmlnID0gbG9jYWxlc1tuYW1lXS5fY29uZmlnO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbmZpZy5wYXJlbnRMb2NhbGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKGxvY2FsZXNbY29uZmlnLnBhcmVudExvY2FsZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHBhcmVudENvbmZpZyA9IGxvY2FsZXNbY29uZmlnLnBhcmVudExvY2FsZV0uX2NvbmZpZztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFsb2NhbGVGYW1pbGllc1tjb25maWcucGFyZW50TG9jYWxlXSkge1xuICAgICAgICAgICAgICAgICAgICBsb2NhbGVGYW1pbGllc1tjb25maWcucGFyZW50TG9jYWxlXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsb2NhbGVGYW1pbGllc1tjb25maWcucGFyZW50TG9jYWxlXS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnOiBjb25maWdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsb2NhbGVzW25hbWVdID0gbmV3IExvY2FsZShtZXJnZUNvbmZpZ3MocGFyZW50Q29uZmlnLCBjb25maWcpKTtcblxuICAgICAgICBpZiAobG9jYWxlRmFtaWxpZXNbbmFtZV0pIHtcbiAgICAgICAgICAgIGxvY2FsZUZhbWlsaWVzW25hbWVdLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVMb2NhbGUoeC5uYW1lLCB4LmNvbmZpZyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGJhY2t3YXJkcyBjb21wYXQgZm9yIG5vdzogYWxzbyBzZXQgdGhlIGxvY2FsZVxuICAgICAgICAvLyBtYWtlIHN1cmUgd2Ugc2V0IHRoZSBsb2NhbGUgQUZURVIgYWxsIGNoaWxkIGxvY2FsZXMgaGF2ZSBiZWVuXG4gICAgICAgIC8vIGNyZWF0ZWQsIHNvIHdlIHdvbid0IGVuZCB1cCB3aXRoIHRoZSBjaGlsZCBsb2NhbGUgc2V0LlxuICAgICAgICBnZXRTZXRHbG9iYWxMb2NhbGUobmFtZSk7XG5cblxuICAgICAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB1c2VmdWwgZm9yIHRlc3RpbmdcbiAgICAgICAgZGVsZXRlIGxvY2FsZXNbbmFtZV07XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlTG9jYWxlKG5hbWUsIGNvbmZpZykge1xuICAgIGlmIChjb25maWcgIT0gbnVsbCkge1xuICAgICAgICB2YXIgbG9jYWxlLCBwYXJlbnRDb25maWcgPSBiYXNlQ29uZmlnO1xuICAgICAgICAvLyBNRVJHRVxuICAgICAgICBpZiAobG9jYWxlc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgICBwYXJlbnRDb25maWcgPSBsb2NhbGVzW25hbWVdLl9jb25maWc7XG4gICAgICAgIH1cbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWdzKHBhcmVudENvbmZpZywgY29uZmlnKTtcbiAgICAgICAgbG9jYWxlID0gbmV3IExvY2FsZShjb25maWcpO1xuICAgICAgICBsb2NhbGUucGFyZW50TG9jYWxlID0gbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgbG9jYWxlc1tuYW1lXSA9IGxvY2FsZTtcblxuICAgICAgICAvLyBiYWNrd2FyZHMgY29tcGF0IGZvciBub3c6IGFsc28gc2V0IHRoZSBsb2NhbGVcbiAgICAgICAgZ2V0U2V0R2xvYmFsTG9jYWxlKG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHBhc3MgbnVsbCBmb3IgY29uZmlnIHRvIHVudXBkYXRlLCB1c2VmdWwgZm9yIHRlc3RzXG4gICAgICAgIGlmIChsb2NhbGVzW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChsb2NhbGVzW25hbWVdLnBhcmVudExvY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxlc1tuYW1lXSA9IGxvY2FsZXNbbmFtZV0ucGFyZW50TG9jYWxlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsb2NhbGVzW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbn1cblxuLy8gcmV0dXJucyBsb2NhbGUgZGF0YVxuZnVuY3Rpb24gZ2V0TG9jYWxlIChrZXkpIHtcbiAgICB2YXIgbG9jYWxlO1xuXG4gICAgaWYgKGtleSAmJiBrZXkuX2xvY2FsZSAmJiBrZXkuX2xvY2FsZS5fYWJicikge1xuICAgICAgICBrZXkgPSBrZXkuX2xvY2FsZS5fYWJicjtcbiAgICB9XG5cbiAgICBpZiAoIWtleSkge1xuICAgICAgICByZXR1cm4gZ2xvYmFsTG9jYWxlO1xuICAgIH1cblxuICAgIGlmICghaXNBcnJheShrZXkpKSB7XG4gICAgICAgIC8vc2hvcnQtY2lyY3VpdCBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShrZXkpO1xuICAgICAgICBpZiAobG9jYWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxlO1xuICAgICAgICB9XG4gICAgICAgIGtleSA9IFtrZXldO1xuICAgIH1cblxuICAgIHJldHVybiBjaG9vc2VMb2NhbGUoa2V5KTtcbn1cblxuZnVuY3Rpb24gbGlzdExvY2FsZXMoKSB7XG4gICAgcmV0dXJuIGtleXMkMShsb2NhbGVzKTtcbn1cblxuZnVuY3Rpb24gY2hlY2tPdmVyZmxvdyAobSkge1xuICAgIHZhciBvdmVyZmxvdztcbiAgICB2YXIgYSA9IG0uX2E7XG5cbiAgICBpZiAoYSAmJiBnZXRQYXJzaW5nRmxhZ3MobSkub3ZlcmZsb3cgPT09IC0yKSB7XG4gICAgICAgIG92ZXJmbG93ID1cbiAgICAgICAgICAgIGFbTU9OVEhdICAgICAgIDwgMCB8fCBhW01PTlRIXSAgICAgICA+IDExICA/IE1PTlRIIDpcbiAgICAgICAgICAgIGFbREFURV0gICAgICAgIDwgMSB8fCBhW0RBVEVdICAgICAgICA+IGRheXNJbk1vbnRoKGFbWUVBUl0sIGFbTU9OVEhdKSA/IERBVEUgOlxuICAgICAgICAgICAgYVtIT1VSXSAgICAgICAgPCAwIHx8IGFbSE9VUl0gICAgICAgID4gMjQgfHwgKGFbSE9VUl0gPT09IDI0ICYmIChhW01JTlVURV0gIT09IDAgfHwgYVtTRUNPTkRdICE9PSAwIHx8IGFbTUlMTElTRUNPTkRdICE9PSAwKSkgPyBIT1VSIDpcbiAgICAgICAgICAgIGFbTUlOVVRFXSAgICAgIDwgMCB8fCBhW01JTlVURV0gICAgICA+IDU5ICA/IE1JTlVURSA6XG4gICAgICAgICAgICBhW1NFQ09ORF0gICAgICA8IDAgfHwgYVtTRUNPTkRdICAgICAgPiA1OSAgPyBTRUNPTkQgOlxuICAgICAgICAgICAgYVtNSUxMSVNFQ09ORF0gPCAwIHx8IGFbTUlMTElTRUNPTkRdID4gOTk5ID8gTUlMTElTRUNPTkQgOlxuICAgICAgICAgICAgLTE7XG5cbiAgICAgICAgaWYgKGdldFBhcnNpbmdGbGFncyhtKS5fb3ZlcmZsb3dEYXlPZlllYXIgJiYgKG92ZXJmbG93IDwgWUVBUiB8fCBvdmVyZmxvdyA+IERBVEUpKSB7XG4gICAgICAgICAgICBvdmVyZmxvdyA9IERBVEU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdldFBhcnNpbmdGbGFncyhtKS5fb3ZlcmZsb3dXZWVrcyAmJiBvdmVyZmxvdyA9PT0gLTEpIHtcbiAgICAgICAgICAgIG92ZXJmbG93ID0gV0VFSztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ2V0UGFyc2luZ0ZsYWdzKG0pLl9vdmVyZmxvd1dlZWtkYXkgJiYgb3ZlcmZsb3cgPT09IC0xKSB7XG4gICAgICAgICAgICBvdmVyZmxvdyA9IFdFRUtEQVk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MobSkub3ZlcmZsb3cgPSBvdmVyZmxvdztcbiAgICB9XG5cbiAgICByZXR1cm4gbTtcbn1cblxuLy8gaXNvIDg2MDEgcmVnZXhcbi8vIDAwMDAtMDAtMDAgMDAwMC1XMDAgb3IgMDAwMC1XMDAtMCArIFQgKyAwMCBvciAwMDowMCBvciAwMDowMDowMCBvciAwMDowMDowMC4wMDAgKyArMDA6MDAgb3IgKzAwMDAgb3IgKzAwKVxudmFyIGV4dGVuZGVkSXNvUmVnZXggPSAvXlxccyooKD86WystXVxcZHs2fXxcXGR7NH0pLSg/OlxcZFxcZC1cXGRcXGR8V1xcZFxcZC1cXGR8V1xcZFxcZHxcXGRcXGRcXGR8XFxkXFxkKSkoPzooVHwgKShcXGRcXGQoPzo6XFxkXFxkKD86OlxcZFxcZCg/OlsuLF1cXGQrKT8pPyk/KShbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC87XG52YXIgYmFzaWNJc29SZWdleCA9IC9eXFxzKigoPzpbKy1dXFxkezZ9fFxcZHs0fSkoPzpcXGRcXGRcXGRcXGR8V1xcZFxcZFxcZHxXXFxkXFxkfFxcZFxcZFxcZHxcXGRcXGQpKSg/OihUfCApKFxcZFxcZCg/OlxcZFxcZCg/OlxcZFxcZCg/OlsuLF1cXGQrKT8pPyk/KShbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC87XG5cbnZhciB0elJlZ2V4ID0gL1p8WystXVxcZFxcZCg/Ojo/XFxkXFxkKT8vO1xuXG52YXIgaXNvRGF0ZXMgPSBbXG4gICAgWydZWVlZWVktTU0tREQnLCAvWystXVxcZHs2fS1cXGRcXGQtXFxkXFxkL10sXG4gICAgWydZWVlZLU1NLUREJywgL1xcZHs0fS1cXGRcXGQtXFxkXFxkL10sXG4gICAgWydHR0dHLVtXXVdXLUUnLCAvXFxkezR9LVdcXGRcXGQtXFxkL10sXG4gICAgWydHR0dHLVtXXVdXJywgL1xcZHs0fS1XXFxkXFxkLywgZmFsc2VdLFxuICAgIFsnWVlZWS1EREQnLCAvXFxkezR9LVxcZHszfS9dLFxuICAgIFsnWVlZWS1NTScsIC9cXGR7NH0tXFxkXFxkLywgZmFsc2VdLFxuICAgIFsnWVlZWVlZTU1ERCcsIC9bKy1dXFxkezEwfS9dLFxuICAgIFsnWVlZWU1NREQnLCAvXFxkezh9L10sXG4gICAgLy8gWVlZWU1NIGlzIE5PVCBhbGxvd2VkIGJ5IHRoZSBzdGFuZGFyZFxuICAgIFsnR0dHR1tXXVdXRScsIC9cXGR7NH1XXFxkezN9L10sXG4gICAgWydHR0dHW1ddV1cnLCAvXFxkezR9V1xcZHsyfS8sIGZhbHNlXSxcbiAgICBbJ1lZWVlEREQnLCAvXFxkezd9L11cbl07XG5cbi8vIGlzbyB0aW1lIGZvcm1hdHMgYW5kIHJlZ2V4ZXNcbnZhciBpc29UaW1lcyA9IFtcbiAgICBbJ0hIOm1tOnNzLlNTU1MnLCAvXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGQrL10sXG4gICAgWydISDptbTpzcyxTU1NTJywgL1xcZFxcZDpcXGRcXGQ6XFxkXFxkLFxcZCsvXSxcbiAgICBbJ0hIOm1tOnNzJywgL1xcZFxcZDpcXGRcXGQ6XFxkXFxkL10sXG4gICAgWydISDptbScsIC9cXGRcXGQ6XFxkXFxkL10sXG4gICAgWydISG1tc3MuU1NTUycsIC9cXGRcXGRcXGRcXGRcXGRcXGRcXC5cXGQrL10sXG4gICAgWydISG1tc3MsU1NTUycsIC9cXGRcXGRcXGRcXGRcXGRcXGQsXFxkKy9dLFxuICAgIFsnSEhtbXNzJywgL1xcZFxcZFxcZFxcZFxcZFxcZC9dLFxuICAgIFsnSEhtbScsIC9cXGRcXGRcXGRcXGQvXSxcbiAgICBbJ0hIJywgL1xcZFxcZC9dXG5dO1xuXG52YXIgYXNwTmV0SnNvblJlZ2V4ID0gL15cXC8/RGF0ZVxcKChcXC0/XFxkKykvaTtcblxuLy8gZGF0ZSBmcm9tIGlzbyBmb3JtYXRcbmZ1bmN0aW9uIGNvbmZpZ0Zyb21JU08oY29uZmlnKSB7XG4gICAgdmFyIGksIGwsXG4gICAgICAgIHN0cmluZyA9IGNvbmZpZy5faSxcbiAgICAgICAgbWF0Y2ggPSBleHRlbmRlZElzb1JlZ2V4LmV4ZWMoc3RyaW5nKSB8fCBiYXNpY0lzb1JlZ2V4LmV4ZWMoc3RyaW5nKSxcbiAgICAgICAgYWxsb3dUaW1lLCBkYXRlRm9ybWF0LCB0aW1lRm9ybWF0LCB0ekZvcm1hdDtcblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pc28gPSB0cnVlO1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBpc29EYXRlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpc29EYXRlc1tpXVsxXS5leGVjKG1hdGNoWzFdKSkge1xuICAgICAgICAgICAgICAgIGRhdGVGb3JtYXQgPSBpc29EYXRlc1tpXVswXTtcbiAgICAgICAgICAgICAgICBhbGxvd1RpbWUgPSBpc29EYXRlc1tpXVsyXSAhPT0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGVGb3JtYXQgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoWzNdKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvVGltZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzb1RpbWVzW2ldWzFdLmV4ZWMobWF0Y2hbM10pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1hdGNoWzJdIHNob3VsZCBiZSAnVCcgb3Igc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgdGltZUZvcm1hdCA9IChtYXRjaFsyXSB8fCAnICcpICsgaXNvVGltZXNbaV1bMF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aW1lRm9ybWF0ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhbGxvd1RpbWUgJiYgdGltZUZvcm1hdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWF0Y2hbNF0pIHtcbiAgICAgICAgICAgIGlmICh0elJlZ2V4LmV4ZWMobWF0Y2hbNF0pKSB7XG4gICAgICAgICAgICAgICAgdHpGb3JtYXQgPSAnWic7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25maWcuX2YgPSBkYXRlRm9ybWF0ICsgKHRpbWVGb3JtYXQgfHwgJycpICsgKHR6Rm9ybWF0IHx8ICcnKTtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgIH1cbn1cblxuLy8gUkZDIDI4MjIgcmVnZXg6IEZvciBkZXRhaWxzIHNlZSBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMjgyMiNzZWN0aW9uLTMuM1xudmFyIGJhc2ljUmZjUmVnZXggPSAvXigoPzpNb258VHVlfFdlZHxUaHV8RnJpfFNhdHxTdW4pLD9cXHMpPyhcXGQ/XFxkXFxzKD86SmFufEZlYnxNYXJ8QXByfE1heXxKdW58SnVsfEF1Z3xTZXB8T2N0fE5vdnxEZWMpXFxzKD86XFxkXFxkKT9cXGRcXGRcXHMpKFxcZFxcZDpcXGRcXGQpKFxcOlxcZFxcZCk/KFxccyg/OlVUfEdNVHxbRUNNUF1bU0RdVHxbQS1JSy1aYS1pay16XXxbKy1dXFxkezR9KSkkLztcblxuLy8gZGF0ZSBhbmQgdGltZSBmcm9tIHJlZiAyODIyIGZvcm1hdFxuZnVuY3Rpb24gY29uZmlnRnJvbVJGQzI4MjIoY29uZmlnKSB7XG4gICAgdmFyIHN0cmluZywgbWF0Y2gsIGRheUZvcm1hdCxcbiAgICAgICAgZGF0ZUZvcm1hdCwgdGltZUZvcm1hdCwgdHpGb3JtYXQ7XG4gICAgdmFyIHRpbWV6b25lcyA9IHtcbiAgICAgICAgJyBHTVQnOiAnICswMDAwJyxcbiAgICAgICAgJyBFRFQnOiAnIC0wNDAwJyxcbiAgICAgICAgJyBFU1QnOiAnIC0wNTAwJyxcbiAgICAgICAgJyBDRFQnOiAnIC0wNTAwJyxcbiAgICAgICAgJyBDU1QnOiAnIC0wNjAwJyxcbiAgICAgICAgJyBNRFQnOiAnIC0wNjAwJyxcbiAgICAgICAgJyBNU1QnOiAnIC0wNzAwJyxcbiAgICAgICAgJyBQRFQnOiAnIC0wNzAwJyxcbiAgICAgICAgJyBQU1QnOiAnIC0wODAwJ1xuICAgIH07XG4gICAgdmFyIG1pbGl0YXJ5ID0gJ1lYV1ZVVFNSUVBPTlpBQkNERUZHSElLTE0nO1xuICAgIHZhciB0aW1lem9uZSwgdGltZXpvbmVJbmRleDtcblxuICAgIHN0cmluZyA9IGNvbmZpZy5faVxuICAgICAgICAucmVwbGFjZSgvXFwoW15cXCldKlxcKXxbXFxuXFx0XS9nLCAnICcpIC8vIFJlbW92ZSBjb21tZW50cyBhbmQgZm9sZGluZyB3aGl0ZXNwYWNlXG4gICAgICAgIC5yZXBsYWNlKC8oXFxzXFxzKykvZywgJyAnKSAvLyBSZXBsYWNlIG11bHRpcGxlLXNwYWNlcyB3aXRoIGEgc2luZ2xlIHNwYWNlXG4gICAgICAgIC5yZXBsYWNlKC9eXFxzfFxccyQvZywgJycpOyAvLyBSZW1vdmUgbGVhZGluZyBhbmQgdHJhaWxpbmcgc3BhY2VzXG4gICAgbWF0Y2ggPSBiYXNpY1JmY1JlZ2V4LmV4ZWMoc3RyaW5nKTtcblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgICBkYXlGb3JtYXQgPSBtYXRjaFsxXSA/ICdkZGQnICsgKChtYXRjaFsxXS5sZW5ndGggPT09IDUpID8gJywgJyA6ICcgJykgOiAnJztcbiAgICAgICAgZGF0ZUZvcm1hdCA9ICdEIE1NTSAnICsgKChtYXRjaFsyXS5sZW5ndGggPiAxMCkgPyAnWVlZWSAnIDogJ1lZICcpO1xuICAgICAgICB0aW1lRm9ybWF0ID0gJ0hIOm1tJyArIChtYXRjaFs0XSA/ICc6c3MnIDogJycpO1xuXG4gICAgICAgIC8vIFRPRE86IFJlcGxhY2UgdGhlIHZhbmlsbGEgSlMgRGF0ZSBvYmplY3Qgd2l0aCBhbiBpbmRlcGVudGVudCBkYXktb2Ytd2VlayBjaGVjay5cbiAgICAgICAgaWYgKG1hdGNoWzFdKSB7IC8vIGRheSBvZiB3ZWVrIGdpdmVuXG4gICAgICAgICAgICB2YXIgbW9tZW50RGF0ZSA9IG5ldyBEYXRlKG1hdGNoWzJdKTtcbiAgICAgICAgICAgIHZhciBtb21lbnREYXkgPSBbJ1N1bicsJ01vbicsJ1R1ZScsJ1dlZCcsJ1RodScsJ0ZyaScsJ1NhdCddW21vbWVudERhdGUuZ2V0RGF5KCldO1xuXG4gICAgICAgICAgICBpZiAobWF0Y2hbMV0uc3Vic3RyKDAsMykgIT09IG1vbWVudERheSkge1xuICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLndlZWtkYXlNaXNtYXRjaCA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChtYXRjaFs1XS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMjogLy8gbWlsaXRhcnlcbiAgICAgICAgICAgICAgICBpZiAodGltZXpvbmVJbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aW1lem9uZSA9ICcgKzAwMDAnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWV6b25lSW5kZXggPSBtaWxpdGFyeS5pbmRleE9mKG1hdGNoWzVdWzFdLnRvVXBwZXJDYXNlKCkpIC0gMTI7XG4gICAgICAgICAgICAgICAgICAgIHRpbWV6b25lID0gKCh0aW1lem9uZUluZGV4IDwgMCkgPyAnIC0nIDogJyArJykgK1xuICAgICAgICAgICAgICAgICAgICAgICAgKCgnJyArIHRpbWV6b25lSW5kZXgpLnJlcGxhY2UoL14tPy8sICcwJykpLm1hdGNoKC8uLiQvKVswXSArICcwMCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA0OiAvLyBab25lXG4gICAgICAgICAgICAgICAgdGltZXpvbmUgPSB0aW1lem9uZXNbbWF0Y2hbNV1dO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDogLy8gVVQgb3IgKy8tOTk5OVxuICAgICAgICAgICAgICAgIHRpbWV6b25lID0gdGltZXpvbmVzWycgR01UJ107XG4gICAgICAgIH1cbiAgICAgICAgbWF0Y2hbNV0gPSB0aW1lem9uZTtcbiAgICAgICAgY29uZmlnLl9pID0gbWF0Y2guc3BsaWNlKDEpLmpvaW4oJycpO1xuICAgICAgICB0ekZvcm1hdCA9ICcgWlonO1xuICAgICAgICBjb25maWcuX2YgPSBkYXlGb3JtYXQgKyBkYXRlRm9ybWF0ICsgdGltZUZvcm1hdCArIHR6Rm9ybWF0O1xuICAgICAgICBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnJmYzI4MjIgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgIH1cbn1cblxuLy8gZGF0ZSBmcm9tIGlzbyBmb3JtYXQgb3IgZmFsbGJhY2tcbmZ1bmN0aW9uIGNvbmZpZ0Zyb21TdHJpbmcoY29uZmlnKSB7XG4gICAgdmFyIG1hdGNoZWQgPSBhc3BOZXRKc29uUmVnZXguZXhlYyhjb25maWcuX2kpO1xuXG4gICAgaWYgKG1hdGNoZWQgIT09IG51bGwpIHtcbiAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoK21hdGNoZWRbMV0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uZmlnRnJvbUlTTyhjb25maWcpO1xuICAgIGlmIChjb25maWcuX2lzVmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICAgIGRlbGV0ZSBjb25maWcuX2lzVmFsaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbmZpZ0Zyb21SRkMyODIyKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZy5faXNWYWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgZGVsZXRlIGNvbmZpZy5faXNWYWxpZDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRmluYWwgYXR0ZW1wdCwgdXNlIElucHV0IEZhbGxiYWNrXG4gICAgaG9va3MuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2soY29uZmlnKTtcbn1cblxuaG9va3MuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2sgPSBkZXByZWNhdGUoXG4gICAgJ3ZhbHVlIHByb3ZpZGVkIGlzIG5vdCBpbiBhIHJlY29nbml6ZWQgUkZDMjgyMiBvciBJU08gZm9ybWF0LiBtb21lbnQgY29uc3RydWN0aW9uIGZhbGxzIGJhY2sgdG8ganMgRGF0ZSgpLCAnICtcbiAgICAnd2hpY2ggaXMgbm90IHJlbGlhYmxlIGFjcm9zcyBhbGwgYnJvd3NlcnMgYW5kIHZlcnNpb25zLiBOb24gUkZDMjgyMi9JU08gZGF0ZSBmb3JtYXRzIGFyZSAnICtcbiAgICAnZGlzY291cmFnZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiBhbiB1cGNvbWluZyBtYWpvciByZWxlYXNlLiBQbGVhc2UgcmVmZXIgdG8gJyArXG4gICAgJ2h0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvanMtZGF0ZS8gZm9yIG1vcmUgaW5mby4nLFxuICAgIGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoY29uZmlnLl9pICsgKGNvbmZpZy5fdXNlVVRDID8gJyBVVEMnIDogJycpKTtcbiAgICB9XG4pO1xuXG4vLyBQaWNrIHRoZSBmaXJzdCBkZWZpbmVkIG9mIHR3byBvciB0aHJlZSBhcmd1bWVudHMuXG5mdW5jdGlvbiBkZWZhdWx0cyhhLCBiLCBjKSB7XG4gICAgaWYgKGEgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gICAgaWYgKGIgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gYjtcbiAgICB9XG4gICAgcmV0dXJuIGM7XG59XG5cbmZ1bmN0aW9uIGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKSB7XG4gICAgLy8gaG9va3MgaXMgYWN0dWFsbHkgdGhlIGV4cG9ydGVkIG1vbWVudCBvYmplY3RcbiAgICB2YXIgbm93VmFsdWUgPSBuZXcgRGF0ZShob29rcy5ub3coKSk7XG4gICAgaWYgKGNvbmZpZy5fdXNlVVRDKSB7XG4gICAgICAgIHJldHVybiBbbm93VmFsdWUuZ2V0VVRDRnVsbFllYXIoKSwgbm93VmFsdWUuZ2V0VVRDTW9udGgoKSwgbm93VmFsdWUuZ2V0VVRDRGF0ZSgpXTtcbiAgICB9XG4gICAgcmV0dXJuIFtub3dWYWx1ZS5nZXRGdWxsWWVhcigpLCBub3dWYWx1ZS5nZXRNb250aCgpLCBub3dWYWx1ZS5nZXREYXRlKCldO1xufVxuXG4vLyBjb252ZXJ0IGFuIGFycmF5IHRvIGEgZGF0ZS5cbi8vIHRoZSBhcnJheSBzaG91bGQgbWlycm9yIHRoZSBwYXJhbWV0ZXJzIGJlbG93XG4vLyBub3RlOiBhbGwgdmFsdWVzIHBhc3QgdGhlIHllYXIgYXJlIG9wdGlvbmFsIGFuZCB3aWxsIGRlZmF1bHQgdG8gdGhlIGxvd2VzdCBwb3NzaWJsZSB2YWx1ZS5cbi8vIFt5ZWFyLCBtb250aCwgZGF5ICwgaG91ciwgbWludXRlLCBzZWNvbmQsIG1pbGxpc2Vjb25kXVxuZnVuY3Rpb24gY29uZmlnRnJvbUFycmF5IChjb25maWcpIHtcbiAgICB2YXIgaSwgZGF0ZSwgaW5wdXQgPSBbXSwgY3VycmVudERhdGUsIHllYXJUb1VzZTtcblxuICAgIGlmIChjb25maWcuX2QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGN1cnJlbnREYXRlID0gY3VycmVudERhdGVBcnJheShjb25maWcpO1xuXG4gICAgLy9jb21wdXRlIGRheSBvZiB0aGUgeWVhciBmcm9tIHdlZWtzIGFuZCB3ZWVrZGF5c1xuICAgIGlmIChjb25maWcuX3cgJiYgY29uZmlnLl9hW0RBVEVdID09IG51bGwgJiYgY29uZmlnLl9hW01PTlRIXSA9PSBudWxsKSB7XG4gICAgICAgIGRheU9mWWVhckZyb21XZWVrSW5mbyhjb25maWcpO1xuICAgIH1cblxuICAgIC8vaWYgdGhlIGRheSBvZiB0aGUgeWVhciBpcyBzZXQsIGZpZ3VyZSBvdXQgd2hhdCBpdCBpc1xuICAgIGlmIChjb25maWcuX2RheU9mWWVhciAhPSBudWxsKSB7XG4gICAgICAgIHllYXJUb1VzZSA9IGRlZmF1bHRzKGNvbmZpZy5fYVtZRUFSXSwgY3VycmVudERhdGVbWUVBUl0pO1xuXG4gICAgICAgIGlmIChjb25maWcuX2RheU9mWWVhciA+IGRheXNJblllYXIoeWVhclRvVXNlKSB8fCBjb25maWcuX2RheU9mWWVhciA9PT0gMCkge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuX292ZXJmbG93RGF5T2ZZZWFyID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRhdGUgPSBjcmVhdGVVVENEYXRlKHllYXJUb1VzZSwgMCwgY29uZmlnLl9kYXlPZlllYXIpO1xuICAgICAgICBjb25maWcuX2FbTU9OVEhdID0gZGF0ZS5nZXRVVENNb250aCgpO1xuICAgICAgICBjb25maWcuX2FbREFURV0gPSBkYXRlLmdldFVUQ0RhdGUoKTtcbiAgICB9XG5cbiAgICAvLyBEZWZhdWx0IHRvIGN1cnJlbnQgZGF0ZS5cbiAgICAvLyAqIGlmIG5vIHllYXIsIG1vbnRoLCBkYXkgb2YgbW9udGggYXJlIGdpdmVuLCBkZWZhdWx0IHRvIHRvZGF5XG4gICAgLy8gKiBpZiBkYXkgb2YgbW9udGggaXMgZ2l2ZW4sIGRlZmF1bHQgbW9udGggYW5kIHllYXJcbiAgICAvLyAqIGlmIG1vbnRoIGlzIGdpdmVuLCBkZWZhdWx0IG9ubHkgeWVhclxuICAgIC8vICogaWYgeWVhciBpcyBnaXZlbiwgZG9uJ3QgZGVmYXVsdCBhbnl0aGluZ1xuICAgIGZvciAoaSA9IDA7IGkgPCAzICYmIGNvbmZpZy5fYVtpXSA9PSBudWxsOyArK2kpIHtcbiAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSBjdXJyZW50RGF0ZVtpXTtcbiAgICB9XG5cbiAgICAvLyBaZXJvIG91dCB3aGF0ZXZlciB3YXMgbm90IGRlZmF1bHRlZCwgaW5jbHVkaW5nIHRpbWVcbiAgICBmb3IgKDsgaSA8IDc7IGkrKykge1xuICAgICAgICBjb25maWcuX2FbaV0gPSBpbnB1dFtpXSA9IChjb25maWcuX2FbaV0gPT0gbnVsbCkgPyAoaSA9PT0gMiA/IDEgOiAwKSA6IGNvbmZpZy5fYVtpXTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgMjQ6MDA6MDAuMDAwXG4gICAgaWYgKGNvbmZpZy5fYVtIT1VSXSA9PT0gMjQgJiZcbiAgICAgICAgICAgIGNvbmZpZy5fYVtNSU5VVEVdID09PSAwICYmXG4gICAgICAgICAgICBjb25maWcuX2FbU0VDT05EXSA9PT0gMCAmJlxuICAgICAgICAgICAgY29uZmlnLl9hW01JTExJU0VDT05EXSA9PT0gMCkge1xuICAgICAgICBjb25maWcuX25leHREYXkgPSB0cnVlO1xuICAgICAgICBjb25maWcuX2FbSE9VUl0gPSAwO1xuICAgIH1cblxuICAgIGNvbmZpZy5fZCA9IChjb25maWcuX3VzZVVUQyA/IGNyZWF0ZVVUQ0RhdGUgOiBjcmVhdGVEYXRlKS5hcHBseShudWxsLCBpbnB1dCk7XG4gICAgLy8gQXBwbHkgdGltZXpvbmUgb2Zmc2V0IGZyb20gaW5wdXQuIFRoZSBhY3R1YWwgdXRjT2Zmc2V0IGNhbiBiZSBjaGFuZ2VkXG4gICAgLy8gd2l0aCBwYXJzZVpvbmUuXG4gICAgaWYgKGNvbmZpZy5fdHptICE9IG51bGwpIHtcbiAgICAgICAgY29uZmlnLl9kLnNldFVUQ01pbnV0ZXMoY29uZmlnLl9kLmdldFVUQ01pbnV0ZXMoKSAtIGNvbmZpZy5fdHptKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLl9uZXh0RGF5KSB7XG4gICAgICAgIGNvbmZpZy5fYVtIT1VSXSA9IDI0O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtJbmZvKGNvbmZpZykge1xuICAgIHZhciB3LCB3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3ksIHRlbXAsIHdlZWtkYXlPdmVyZmxvdztcblxuICAgIHcgPSBjb25maWcuX3c7XG4gICAgaWYgKHcuR0cgIT0gbnVsbCB8fCB3LlcgIT0gbnVsbCB8fCB3LkUgIT0gbnVsbCkge1xuICAgICAgICBkb3cgPSAxO1xuICAgICAgICBkb3kgPSA0O1xuXG4gICAgICAgIC8vIFRPRE86IFdlIG5lZWQgdG8gdGFrZSB0aGUgY3VycmVudCBpc29XZWVrWWVhciwgYnV0IHRoYXQgZGVwZW5kcyBvblxuICAgICAgICAvLyBob3cgd2UgaW50ZXJwcmV0IG5vdyAobG9jYWwsIHV0YywgZml4ZWQgb2Zmc2V0KS4gU28gY3JlYXRlXG4gICAgICAgIC8vIGEgbm93IHZlcnNpb24gb2YgY3VycmVudCBjb25maWcgKHRha2UgbG9jYWwvdXRjL29mZnNldCBmbGFncywgYW5kXG4gICAgICAgIC8vIGNyZWF0ZSBub3cpLlxuICAgICAgICB3ZWVrWWVhciA9IGRlZmF1bHRzKHcuR0csIGNvbmZpZy5fYVtZRUFSXSwgd2Vla09mWWVhcihjcmVhdGVMb2NhbCgpLCAxLCA0KS55ZWFyKTtcbiAgICAgICAgd2VlayA9IGRlZmF1bHRzKHcuVywgMSk7XG4gICAgICAgIHdlZWtkYXkgPSBkZWZhdWx0cyh3LkUsIDEpO1xuICAgICAgICBpZiAod2Vla2RheSA8IDEgfHwgd2Vla2RheSA+IDcpIHtcbiAgICAgICAgICAgIHdlZWtkYXlPdmVyZmxvdyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBkb3cgPSBjb25maWcuX2xvY2FsZS5fd2Vlay5kb3c7XG4gICAgICAgIGRveSA9IGNvbmZpZy5fbG9jYWxlLl93ZWVrLmRveTtcblxuICAgICAgICB2YXIgY3VyV2VlayA9IHdlZWtPZlllYXIoY3JlYXRlTG9jYWwoKSwgZG93LCBkb3kpO1xuXG4gICAgICAgIHdlZWtZZWFyID0gZGVmYXVsdHMody5nZywgY29uZmlnLl9hW1lFQVJdLCBjdXJXZWVrLnllYXIpO1xuXG4gICAgICAgIC8vIERlZmF1bHQgdG8gY3VycmVudCB3ZWVrLlxuICAgICAgICB3ZWVrID0gZGVmYXVsdHMody53LCBjdXJXZWVrLndlZWspO1xuXG4gICAgICAgIGlmICh3LmQgIT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gd2Vla2RheSAtLSBsb3cgZGF5IG51bWJlcnMgYXJlIGNvbnNpZGVyZWQgbmV4dCB3ZWVrXG4gICAgICAgICAgICB3ZWVrZGF5ID0gdy5kO1xuICAgICAgICAgICAgaWYgKHdlZWtkYXkgPCAwIHx8IHdlZWtkYXkgPiA2KSB7XG4gICAgICAgICAgICAgICAgd2Vla2RheU92ZXJmbG93ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh3LmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gbG9jYWwgd2Vla2RheSAtLSBjb3VudGluZyBzdGFydHMgZnJvbSBiZWdpbmluZyBvZiB3ZWVrXG4gICAgICAgICAgICB3ZWVrZGF5ID0gdy5lICsgZG93O1xuICAgICAgICAgICAgaWYgKHcuZSA8IDAgfHwgdy5lID4gNikge1xuICAgICAgICAgICAgICAgIHdlZWtkYXlPdmVyZmxvdyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBkZWZhdWx0IHRvIGJlZ2luaW5nIG9mIHdlZWtcbiAgICAgICAgICAgIHdlZWtkYXkgPSBkb3c7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdlZWsgPCAxIHx8IHdlZWsgPiB3ZWVrc0luWWVhcih3ZWVrWWVhciwgZG93LCBkb3kpKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd1dlZWtzID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHdlZWtkYXlPdmVyZmxvdyAhPSBudWxsKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd1dlZWtkYXkgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRlbXAgPSBkYXlPZlllYXJGcm9tV2Vla3Mod2Vla1llYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KTtcbiAgICAgICAgY29uZmlnLl9hW1lFQVJdID0gdGVtcC55ZWFyO1xuICAgICAgICBjb25maWcuX2RheU9mWWVhciA9IHRlbXAuZGF5T2ZZZWFyO1xuICAgIH1cbn1cblxuLy8gY29uc3RhbnQgdGhhdCByZWZlcnMgdG8gdGhlIElTTyBzdGFuZGFyZFxuaG9va3MuSVNPXzg2MDEgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gY29uc3RhbnQgdGhhdCByZWZlcnMgdG8gdGhlIFJGQyAyODIyIGZvcm1cbmhvb2tzLlJGQ18yODIyID0gZnVuY3Rpb24gKCkge307XG5cbi8vIGRhdGUgZnJvbSBzdHJpbmcgYW5kIGZvcm1hdCBzdHJpbmdcbmZ1bmN0aW9uIGNvbmZpZ0Zyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKSB7XG4gICAgLy8gVE9ETzogTW92ZSB0aGlzIHRvIGFub3RoZXIgcGFydCBvZiB0aGUgY3JlYXRpb24gZmxvdyB0byBwcmV2ZW50IGNpcmN1bGFyIGRlcHNcbiAgICBpZiAoY29uZmlnLl9mID09PSBob29rcy5JU09fODYwMSkge1xuICAgICAgICBjb25maWdGcm9tSVNPKGNvbmZpZyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5fZiA9PT0gaG9va3MuUkZDXzI4MjIpIHtcbiAgICAgICAgY29uZmlnRnJvbVJGQzI4MjIoY29uZmlnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25maWcuX2EgPSBbXTtcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5lbXB0eSA9IHRydWU7XG5cbiAgICAvLyBUaGlzIGFycmF5IGlzIHVzZWQgdG8gbWFrZSBhIERhdGUsIGVpdGhlciB3aXRoIGBuZXcgRGF0ZWAgb3IgYERhdGUuVVRDYFxuICAgIHZhciBzdHJpbmcgPSAnJyArIGNvbmZpZy5faSxcbiAgICAgICAgaSwgcGFyc2VkSW5wdXQsIHRva2VucywgdG9rZW4sIHNraXBwZWQsXG4gICAgICAgIHN0cmluZ0xlbmd0aCA9IHN0cmluZy5sZW5ndGgsXG4gICAgICAgIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGggPSAwO1xuXG4gICAgdG9rZW5zID0gZXhwYW5kRm9ybWF0KGNvbmZpZy5fZiwgY29uZmlnLl9sb2NhbGUpLm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpIHx8IFtdO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcbiAgICAgICAgcGFyc2VkSW5wdXQgPSAoc3RyaW5nLm1hdGNoKGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSkgfHwgW10pWzBdO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygndG9rZW4nLCB0b2tlbiwgJ3BhcnNlZElucHV0JywgcGFyc2VkSW5wdXQsXG4gICAgICAgIC8vICAgICAgICAgJ3JlZ2V4JywgZ2V0UGFyc2VSZWdleEZvclRva2VuKHRva2VuLCBjb25maWcpKTtcbiAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICBza2lwcGVkID0gc3RyaW5nLnN1YnN0cigwLCBzdHJpbmcuaW5kZXhPZihwYXJzZWRJbnB1dCkpO1xuICAgICAgICAgICAgaWYgKHNraXBwZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnVudXNlZElucHV0LnB1c2goc2tpcHBlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcuc2xpY2Uoc3RyaW5nLmluZGV4T2YocGFyc2VkSW5wdXQpICsgcGFyc2VkSW5wdXQubGVuZ3RoKTtcbiAgICAgICAgICAgIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGggKz0gcGFyc2VkSW5wdXQubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIC8vIGRvbid0IHBhcnNlIGlmIGl0J3Mgbm90IGEga25vd24gdG9rZW5cbiAgICAgICAgaWYgKGZvcm1hdFRva2VuRnVuY3Rpb25zW3Rva2VuXSkge1xuICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuZW1wdHkgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnVudXNlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFkZFRpbWVUb0FycmF5RnJvbVRva2VuKHRva2VuLCBwYXJzZWRJbnB1dCwgY29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjb25maWcuX3N0cmljdCAmJiAhcGFyc2VkSW5wdXQpIHtcbiAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnVudXNlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGFkZCByZW1haW5pbmcgdW5wYXJzZWQgaW5wdXQgbGVuZ3RoIHRvIHRoZSBzdHJpbmdcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5jaGFyc0xlZnRPdmVyID0gc3RyaW5nTGVuZ3RoIC0gdG90YWxQYXJzZWRJbnB1dExlbmd0aDtcbiAgICBpZiAoc3RyaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykudW51c2VkSW5wdXQucHVzaChzdHJpbmcpO1xuICAgIH1cblxuICAgIC8vIGNsZWFyIF8xMmggZmxhZyBpZiBob3VyIGlzIDw9IDEyXG4gICAgaWYgKGNvbmZpZy5fYVtIT1VSXSA8PSAxMiAmJlxuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID09PSB0cnVlICYmXG4gICAgICAgIGNvbmZpZy5fYVtIT1VSXSA+IDApIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuYmlnSG91ciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5wYXJzZWREYXRlUGFydHMgPSBjb25maWcuX2Euc2xpY2UoMCk7XG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykubWVyaWRpZW0gPSBjb25maWcuX21lcmlkaWVtO1xuICAgIC8vIGhhbmRsZSBtZXJpZGllbVxuICAgIGNvbmZpZy5fYVtIT1VSXSA9IG1lcmlkaWVtRml4V3JhcChjb25maWcuX2xvY2FsZSwgY29uZmlnLl9hW0hPVVJdLCBjb25maWcuX21lcmlkaWVtKTtcblxuICAgIGNvbmZpZ0Zyb21BcnJheShjb25maWcpO1xuICAgIGNoZWNrT3ZlcmZsb3coY29uZmlnKTtcbn1cblxuXG5mdW5jdGlvbiBtZXJpZGllbUZpeFdyYXAgKGxvY2FsZSwgaG91ciwgbWVyaWRpZW0pIHtcbiAgICB2YXIgaXNQbTtcblxuICAgIGlmIChtZXJpZGllbSA9PSBudWxsKSB7XG4gICAgICAgIC8vIG5vdGhpbmcgdG8gZG9cbiAgICAgICAgcmV0dXJuIGhvdXI7XG4gICAgfVxuICAgIGlmIChsb2NhbGUubWVyaWRpZW1Ib3VyICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS5tZXJpZGllbUhvdXIoaG91ciwgbWVyaWRpZW0pO1xuICAgIH0gZWxzZSBpZiAobG9jYWxlLmlzUE0gIT0gbnVsbCkge1xuICAgICAgICAvLyBGYWxsYmFja1xuICAgICAgICBpc1BtID0gbG9jYWxlLmlzUE0obWVyaWRpZW0pO1xuICAgICAgICBpZiAoaXNQbSAmJiBob3VyIDwgMTIpIHtcbiAgICAgICAgICAgIGhvdXIgKz0gMTI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1BtICYmIGhvdXIgPT09IDEyKSB7XG4gICAgICAgICAgICBob3VyID0gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaG91cjtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB0aGlzIGlzIG5vdCBzdXBwb3NlZCB0byBoYXBwZW5cbiAgICAgICAgcmV0dXJuIGhvdXI7XG4gICAgfVxufVxuXG4vLyBkYXRlIGZyb20gc3RyaW5nIGFuZCBhcnJheSBvZiBmb3JtYXQgc3RyaW5nc1xuZnVuY3Rpb24gY29uZmlnRnJvbVN0cmluZ0FuZEFycmF5KGNvbmZpZykge1xuICAgIHZhciB0ZW1wQ29uZmlnLFxuICAgICAgICBiZXN0TW9tZW50LFxuXG4gICAgICAgIHNjb3JlVG9CZWF0LFxuICAgICAgICBpLFxuICAgICAgICBjdXJyZW50U2NvcmU7XG5cbiAgICBpZiAoY29uZmlnLl9mLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pbnZhbGlkRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoTmFOKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBjb25maWcuX2YubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3VycmVudFNjb3JlID0gMDtcbiAgICAgICAgdGVtcENvbmZpZyA9IGNvcHlDb25maWcoe30sIGNvbmZpZyk7XG4gICAgICAgIGlmIChjb25maWcuX3VzZVVUQyAhPSBudWxsKSB7XG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl91c2VVVEMgPSBjb25maWcuX3VzZVVUQztcbiAgICAgICAgfVxuICAgICAgICB0ZW1wQ29uZmlnLl9mID0gY29uZmlnLl9mW2ldO1xuICAgICAgICBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KHRlbXBDb25maWcpO1xuXG4gICAgICAgIGlmICghaXNWYWxpZCh0ZW1wQ29uZmlnKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhbnkgaW5wdXQgdGhhdCB3YXMgbm90IHBhcnNlZCBhZGQgYSBwZW5hbHR5IGZvciB0aGF0IGZvcm1hdFxuICAgICAgICBjdXJyZW50U2NvcmUgKz0gZ2V0UGFyc2luZ0ZsYWdzKHRlbXBDb25maWcpLmNoYXJzTGVmdE92ZXI7XG5cbiAgICAgICAgLy9vciB0b2tlbnNcbiAgICAgICAgY3VycmVudFNjb3JlICs9IGdldFBhcnNpbmdGbGFncyh0ZW1wQ29uZmlnKS51bnVzZWRUb2tlbnMubGVuZ3RoICogMTA7XG5cbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKHRlbXBDb25maWcpLnNjb3JlID0gY3VycmVudFNjb3JlO1xuXG4gICAgICAgIGlmIChzY29yZVRvQmVhdCA9PSBudWxsIHx8IGN1cnJlbnRTY29yZSA8IHNjb3JlVG9CZWF0KSB7XG4gICAgICAgICAgICBzY29yZVRvQmVhdCA9IGN1cnJlbnRTY29yZTtcbiAgICAgICAgICAgIGJlc3RNb21lbnQgPSB0ZW1wQ29uZmlnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZXh0ZW5kKGNvbmZpZywgYmVzdE1vbWVudCB8fCB0ZW1wQ29uZmlnKTtcbn1cblxuZnVuY3Rpb24gY29uZmlnRnJvbU9iamVjdChjb25maWcpIHtcbiAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaSA9IG5vcm1hbGl6ZU9iamVjdFVuaXRzKGNvbmZpZy5faSk7XG4gICAgY29uZmlnLl9hID0gbWFwKFtpLnllYXIsIGkubW9udGgsIGkuZGF5IHx8IGkuZGF0ZSwgaS5ob3VyLCBpLm1pbnV0ZSwgaS5zZWNvbmQsIGkubWlsbGlzZWNvbmRdLCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmogJiYgcGFyc2VJbnQob2JqLCAxMCk7XG4gICAgfSk7XG5cbiAgICBjb25maWdGcm9tQXJyYXkoY29uZmlnKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRnJvbUNvbmZpZyAoY29uZmlnKSB7XG4gICAgdmFyIHJlcyA9IG5ldyBNb21lbnQoY2hlY2tPdmVyZmxvdyhwcmVwYXJlQ29uZmlnKGNvbmZpZykpKTtcbiAgICBpZiAocmVzLl9uZXh0RGF5KSB7XG4gICAgICAgIC8vIEFkZGluZyBpcyBzbWFydCBlbm91Z2ggYXJvdW5kIERTVFxuICAgICAgICByZXMuYWRkKDEsICdkJyk7XG4gICAgICAgIHJlcy5fbmV4dERheSA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBwcmVwYXJlQ29uZmlnIChjb25maWcpIHtcbiAgICB2YXIgaW5wdXQgPSBjb25maWcuX2ksXG4gICAgICAgIGZvcm1hdCA9IGNvbmZpZy5fZjtcblxuICAgIGNvbmZpZy5fbG9jYWxlID0gY29uZmlnLl9sb2NhbGUgfHwgZ2V0TG9jYWxlKGNvbmZpZy5fbCk7XG5cbiAgICBpZiAoaW5wdXQgPT09IG51bGwgfHwgKGZvcm1hdCA9PT0gdW5kZWZpbmVkICYmIGlucHV0ID09PSAnJykpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUludmFsaWQoe251bGxJbnB1dDogdHJ1ZX0pO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbmZpZy5faSA9IGlucHV0ID0gY29uZmlnLl9sb2NhbGUucHJlcGFyc2UoaW5wdXQpO1xuICAgIH1cblxuICAgIGlmIChpc01vbWVudChpbnB1dCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNb21lbnQoY2hlY2tPdmVyZmxvdyhpbnB1dCkpO1xuICAgIH0gZWxzZSBpZiAoaXNEYXRlKGlucHV0KSkge1xuICAgICAgICBjb25maWcuX2QgPSBpbnB1dDtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkoZm9ybWF0KSkge1xuICAgICAgICBjb25maWdGcm9tU3RyaW5nQW5kQXJyYXkoY29uZmlnKTtcbiAgICB9IGVsc2UgaWYgKGZvcm1hdCkge1xuICAgICAgICBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XG4gICAgfSAgZWxzZSB7XG4gICAgICAgIGNvbmZpZ0Zyb21JbnB1dChjb25maWcpO1xuICAgIH1cblxuICAgIGlmICghaXNWYWxpZChjb25maWcpKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbmZpZztcbn1cblxuZnVuY3Rpb24gY29uZmlnRnJvbUlucHV0KGNvbmZpZykge1xuICAgIHZhciBpbnB1dCA9IGNvbmZpZy5faTtcbiAgICBpZiAoaXNVbmRlZmluZWQoaW5wdXQpKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGhvb2tzLm5vdygpKTtcbiAgICB9IGVsc2UgaWYgKGlzRGF0ZShpbnB1dCkpIHtcbiAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoaW5wdXQudmFsdWVPZigpKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZyhjb25maWcpO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgY29uZmlnLl9hID0gbWFwKGlucHV0LnNsaWNlKDApLCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQob2JqLCAxMCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25maWdGcm9tQXJyYXkoY29uZmlnKTtcbiAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KGlucHV0KSkge1xuICAgICAgICBjb25maWdGcm9tT2JqZWN0KGNvbmZpZyk7XG4gICAgfSBlbHNlIGlmIChpc051bWJlcihpbnB1dCkpIHtcbiAgICAgICAgLy8gZnJvbSBtaWxsaXNlY29uZHNcbiAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoaW5wdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGhvb2tzLmNyZWF0ZUZyb21JbnB1dEZhbGxiYWNrKGNvbmZpZyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVMb2NhbE9yVVRDIChpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCwgaXNVVEMpIHtcbiAgICB2YXIgYyA9IHt9O1xuXG4gICAgaWYgKGxvY2FsZSA9PT0gdHJ1ZSB8fCBsb2NhbGUgPT09IGZhbHNlKSB7XG4gICAgICAgIHN0cmljdCA9IGxvY2FsZTtcbiAgICAgICAgbG9jYWxlID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICgoaXNPYmplY3QoaW5wdXQpICYmIGlzT2JqZWN0RW1wdHkoaW5wdXQpKSB8fFxuICAgICAgICAgICAgKGlzQXJyYXkoaW5wdXQpICYmIGlucHV0Lmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgaW5wdXQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIC8vIG9iamVjdCBjb25zdHJ1Y3Rpb24gbXVzdCBiZSBkb25lIHRoaXMgd2F5LlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNDIzXG4gICAgYy5faXNBTW9tZW50T2JqZWN0ID0gdHJ1ZTtcbiAgICBjLl91c2VVVEMgPSBjLl9pc1VUQyA9IGlzVVRDO1xuICAgIGMuX2wgPSBsb2NhbGU7XG4gICAgYy5faSA9IGlucHV0O1xuICAgIGMuX2YgPSBmb3JtYXQ7XG4gICAgYy5fc3RyaWN0ID0gc3RyaWN0O1xuXG4gICAgcmV0dXJuIGNyZWF0ZUZyb21Db25maWcoYyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxvY2FsIChpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCkge1xuICAgIHJldHVybiBjcmVhdGVMb2NhbE9yVVRDKGlucHV0LCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0LCBmYWxzZSk7XG59XG5cbnZhciBwcm90b3R5cGVNaW4gPSBkZXByZWNhdGUoXG4gICAgJ21vbWVudCgpLm1pbiBpcyBkZXByZWNhdGVkLCB1c2UgbW9tZW50Lm1heCBpbnN0ZWFkLiBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL21pbi1tYXgvJyxcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdGhlciA9IGNyZWF0ZUxvY2FsLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJiBvdGhlci5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBvdGhlciA8IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlSW52YWxpZCgpO1xuICAgICAgICB9XG4gICAgfVxuKTtcblxudmFyIHByb3RvdHlwZU1heCA9IGRlcHJlY2F0ZShcbiAgICAnbW9tZW50KCkubWF4IGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQubWluIGluc3RlYWQuIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvbWluLW1heC8nLFxuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG90aGVyID0gY3JlYXRlTG9jYWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKHRoaXMuaXNWYWxpZCgpICYmIG90aGVyLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG90aGVyID4gdGhpcyA/IHRoaXMgOiBvdGhlcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVJbnZhbGlkKCk7XG4gICAgICAgIH1cbiAgICB9XG4pO1xuXG4vLyBQaWNrIGEgbW9tZW50IG0gZnJvbSBtb21lbnRzIHNvIHRoYXQgbVtmbl0ob3RoZXIpIGlzIHRydWUgZm9yIGFsbFxuLy8gb3RoZXIuIFRoaXMgcmVsaWVzIG9uIHRoZSBmdW5jdGlvbiBmbiB0byBiZSB0cmFuc2l0aXZlLlxuLy9cbi8vIG1vbWVudHMgc2hvdWxkIGVpdGhlciBiZSBhbiBhcnJheSBvZiBtb21lbnQgb2JqZWN0cyBvciBhbiBhcnJheSwgd2hvc2Vcbi8vIGZpcnN0IGVsZW1lbnQgaXMgYW4gYXJyYXkgb2YgbW9tZW50IG9iamVjdHMuXG5mdW5jdGlvbiBwaWNrQnkoZm4sIG1vbWVudHMpIHtcbiAgICB2YXIgcmVzLCBpO1xuICAgIGlmIChtb21lbnRzLmxlbmd0aCA9PT0gMSAmJiBpc0FycmF5KG1vbWVudHNbMF0pKSB7XG4gICAgICAgIG1vbWVudHMgPSBtb21lbnRzWzBdO1xuICAgIH1cbiAgICBpZiAoIW1vbWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVMb2NhbCgpO1xuICAgIH1cbiAgICByZXMgPSBtb21lbnRzWzBdO1xuICAgIGZvciAoaSA9IDE7IGkgPCBtb21lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmICghbW9tZW50c1tpXS5pc1ZhbGlkKCkgfHwgbW9tZW50c1tpXVtmbl0ocmVzKSkge1xuICAgICAgICAgICAgcmVzID0gbW9tZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBUT0RPOiBVc2UgW10uc29ydCBpbnN0ZWFkP1xuZnVuY3Rpb24gbWluICgpIHtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcblxuICAgIHJldHVybiBwaWNrQnkoJ2lzQmVmb3JlJywgYXJncyk7XG59XG5cbmZ1bmN0aW9uIG1heCAoKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICByZXR1cm4gcGlja0J5KCdpc0FmdGVyJywgYXJncyk7XG59XG5cbnZhciBub3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIERhdGUubm93ID8gRGF0ZS5ub3coKSA6ICsobmV3IERhdGUoKSk7XG59O1xuXG52YXIgb3JkZXJpbmcgPSBbJ3llYXInLCAncXVhcnRlcicsICdtb250aCcsICd3ZWVrJywgJ2RheScsICdob3VyJywgJ21pbnV0ZScsICdzZWNvbmQnLCAnbWlsbGlzZWNvbmQnXTtcblxuZnVuY3Rpb24gaXNEdXJhdGlvblZhbGlkKG0pIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gbSkge1xuICAgICAgICBpZiAoIShvcmRlcmluZy5pbmRleE9mKGtleSkgIT09IC0xICYmIChtW2tleV0gPT0gbnVsbCB8fCAhaXNOYU4obVtrZXldKSkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdW5pdEhhc0RlY2ltYWwgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yZGVyaW5nLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChtW29yZGVyaW5nW2ldXSkge1xuICAgICAgICAgICAgaWYgKHVuaXRIYXNEZWNpbWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBvbmx5IGFsbG93IG5vbi1pbnRlZ2VycyBmb3Igc21hbGxlc3QgdW5pdFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQobVtvcmRlcmluZ1tpXV0pICE9PSB0b0ludChtW29yZGVyaW5nW2ldXSkpIHtcbiAgICAgICAgICAgICAgICB1bml0SGFzRGVjaW1hbCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZCQxKCkge1xuICAgIHJldHVybiB0aGlzLl9pc1ZhbGlkO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVJbnZhbGlkJDEoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUR1cmF0aW9uKE5hTik7XG59XG5cbmZ1bmN0aW9uIER1cmF0aW9uIChkdXJhdGlvbikge1xuICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSBub3JtYWxpemVPYmplY3RVbml0cyhkdXJhdGlvbiksXG4gICAgICAgIHllYXJzID0gbm9ybWFsaXplZElucHV0LnllYXIgfHwgMCxcbiAgICAgICAgcXVhcnRlcnMgPSBub3JtYWxpemVkSW5wdXQucXVhcnRlciB8fCAwLFxuICAgICAgICBtb250aHMgPSBub3JtYWxpemVkSW5wdXQubW9udGggfHwgMCxcbiAgICAgICAgd2Vla3MgPSBub3JtYWxpemVkSW5wdXQud2VlayB8fCAwLFxuICAgICAgICBkYXlzID0gbm9ybWFsaXplZElucHV0LmRheSB8fCAwLFxuICAgICAgICBob3VycyA9IG5vcm1hbGl6ZWRJbnB1dC5ob3VyIHx8IDAsXG4gICAgICAgIG1pbnV0ZXMgPSBub3JtYWxpemVkSW5wdXQubWludXRlIHx8IDAsXG4gICAgICAgIHNlY29uZHMgPSBub3JtYWxpemVkSW5wdXQuc2Vjb25kIHx8IDAsXG4gICAgICAgIG1pbGxpc2Vjb25kcyA9IG5vcm1hbGl6ZWRJbnB1dC5taWxsaXNlY29uZCB8fCAwO1xuXG4gICAgdGhpcy5faXNWYWxpZCA9IGlzRHVyYXRpb25WYWxpZChub3JtYWxpemVkSW5wdXQpO1xuXG4gICAgLy8gcmVwcmVzZW50YXRpb24gZm9yIGRhdGVBZGRSZW1vdmVcbiAgICB0aGlzLl9taWxsaXNlY29uZHMgPSArbWlsbGlzZWNvbmRzICtcbiAgICAgICAgc2Vjb25kcyAqIDFlMyArIC8vIDEwMDBcbiAgICAgICAgbWludXRlcyAqIDZlNCArIC8vIDEwMDAgKiA2MFxuICAgICAgICBob3VycyAqIDEwMDAgKiA2MCAqIDYwOyAvL3VzaW5nIDEwMDAgKiA2MCAqIDYwIGluc3RlYWQgb2YgMzZlNSB0byBhdm9pZCBmbG9hdGluZyBwb2ludCByb3VuZGluZyBlcnJvcnMgaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzI5NzhcbiAgICAvLyBCZWNhdXNlIG9mIGRhdGVBZGRSZW1vdmUgdHJlYXRzIDI0IGhvdXJzIGFzIGRpZmZlcmVudCBmcm9tIGFcbiAgICAvLyBkYXkgd2hlbiB3b3JraW5nIGFyb3VuZCBEU1QsIHdlIG5lZWQgdG8gc3RvcmUgdGhlbSBzZXBhcmF0ZWx5XG4gICAgdGhpcy5fZGF5cyA9ICtkYXlzICtcbiAgICAgICAgd2Vla3MgKiA3O1xuICAgIC8vIEl0IGlzIGltcG9zc2libGUgdHJhbnNsYXRlIG1vbnRocyBpbnRvIGRheXMgd2l0aG91dCBrbm93aW5nXG4gICAgLy8gd2hpY2ggbW9udGhzIHlvdSBhcmUgYXJlIHRhbGtpbmcgYWJvdXQsIHNvIHdlIGhhdmUgdG8gc3RvcmVcbiAgICAvLyBpdCBzZXBhcmF0ZWx5LlxuICAgIHRoaXMuX21vbnRocyA9ICttb250aHMgK1xuICAgICAgICBxdWFydGVycyAqIDMgK1xuICAgICAgICB5ZWFycyAqIDEyO1xuXG4gICAgdGhpcy5fZGF0YSA9IHt9O1xuXG4gICAgdGhpcy5fbG9jYWxlID0gZ2V0TG9jYWxlKCk7XG5cbiAgICB0aGlzLl9idWJibGUoKTtcbn1cblxuZnVuY3Rpb24gaXNEdXJhdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIER1cmF0aW9uO1xufVxuXG5mdW5jdGlvbiBhYnNSb3VuZCAobnVtYmVyKSB7XG4gICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoLTEgKiBudW1iZXIpICogLTE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyKTtcbiAgICB9XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuZnVuY3Rpb24gb2Zmc2V0ICh0b2tlbiwgc2VwYXJhdG9yKSB7XG4gICAgYWRkRm9ybWF0VG9rZW4odG9rZW4sIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMudXRjT2Zmc2V0KCk7XG4gICAgICAgIHZhciBzaWduID0gJysnO1xuICAgICAgICBpZiAob2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgb2Zmc2V0ID0gLW9mZnNldDtcbiAgICAgICAgICAgIHNpZ24gPSAnLSc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNpZ24gKyB6ZXJvRmlsbCh+fihvZmZzZXQgLyA2MCksIDIpICsgc2VwYXJhdG9yICsgemVyb0ZpbGwofn4ob2Zmc2V0KSAlIDYwLCAyKTtcbiAgICB9KTtcbn1cblxub2Zmc2V0KCdaJywgJzonKTtcbm9mZnNldCgnWlonLCAnJyk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignWicsICBtYXRjaFNob3J0T2Zmc2V0KTtcbmFkZFJlZ2V4VG9rZW4oJ1paJywgbWF0Y2hTaG9ydE9mZnNldCk7XG5hZGRQYXJzZVRva2VuKFsnWicsICdaWiddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICBjb25maWcuX3VzZVVUQyA9IHRydWU7XG4gICAgY29uZmlnLl90em0gPSBvZmZzZXRGcm9tU3RyaW5nKG1hdGNoU2hvcnRPZmZzZXQsIGlucHV0KTtcbn0pO1xuXG4vLyBIRUxQRVJTXG5cbi8vIHRpbWV6b25lIGNodW5rZXJcbi8vICcrMTA6MDAnID4gWycxMCcsICAnMDAnXVxuLy8gJy0xNTMwJyAgPiBbJy0xNScsICczMCddXG52YXIgY2h1bmtPZmZzZXQgPSAvKFtcXCtcXC1dfFxcZFxcZCkvZ2k7XG5cbmZ1bmN0aW9uIG9mZnNldEZyb21TdHJpbmcobWF0Y2hlciwgc3RyaW5nKSB7XG4gICAgdmFyIG1hdGNoZXMgPSAoc3RyaW5nIHx8ICcnKS5tYXRjaChtYXRjaGVyKTtcblxuICAgIGlmIChtYXRjaGVzID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBjaHVuayAgID0gbWF0Y2hlc1ttYXRjaGVzLmxlbmd0aCAtIDFdIHx8IFtdO1xuICAgIHZhciBwYXJ0cyAgID0gKGNodW5rICsgJycpLm1hdGNoKGNodW5rT2Zmc2V0KSB8fCBbJy0nLCAwLCAwXTtcbiAgICB2YXIgbWludXRlcyA9ICsocGFydHNbMV0gKiA2MCkgKyB0b0ludChwYXJ0c1syXSk7XG5cbiAgICByZXR1cm4gbWludXRlcyA9PT0gMCA/XG4gICAgICAwIDpcbiAgICAgIHBhcnRzWzBdID09PSAnKycgPyBtaW51dGVzIDogLW1pbnV0ZXM7XG59XG5cbi8vIFJldHVybiBhIG1vbWVudCBmcm9tIGlucHV0LCB0aGF0IGlzIGxvY2FsL3V0Yy96b25lIGVxdWl2YWxlbnQgdG8gbW9kZWwuXG5mdW5jdGlvbiBjbG9uZVdpdGhPZmZzZXQoaW5wdXQsIG1vZGVsKSB7XG4gICAgdmFyIHJlcywgZGlmZjtcbiAgICBpZiAobW9kZWwuX2lzVVRDKSB7XG4gICAgICAgIHJlcyA9IG1vZGVsLmNsb25lKCk7XG4gICAgICAgIGRpZmYgPSAoaXNNb21lbnQoaW5wdXQpIHx8IGlzRGF0ZShpbnB1dCkgPyBpbnB1dC52YWx1ZU9mKCkgOiBjcmVhdGVMb2NhbChpbnB1dCkudmFsdWVPZigpKSAtIHJlcy52YWx1ZU9mKCk7XG4gICAgICAgIC8vIFVzZSBsb3ctbGV2ZWwgYXBpLCBiZWNhdXNlIHRoaXMgZm4gaXMgbG93LWxldmVsIGFwaS5cbiAgICAgICAgcmVzLl9kLnNldFRpbWUocmVzLl9kLnZhbHVlT2YoKSArIGRpZmYpO1xuICAgICAgICBob29rcy51cGRhdGVPZmZzZXQocmVzLCBmYWxzZSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUxvY2FsKGlucHV0KS5sb2NhbCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0RGF0ZU9mZnNldCAobSkge1xuICAgIC8vIE9uIEZpcmVmb3guMjQgRGF0ZSNnZXRUaW1lem9uZU9mZnNldCByZXR1cm5zIGEgZmxvYXRpbmcgcG9pbnQuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvcHVsbC8xODcxXG4gICAgcmV0dXJuIC1NYXRoLnJvdW5kKG0uX2QuZ2V0VGltZXpvbmVPZmZzZXQoKSAvIDE1KSAqIDE1O1xufVxuXG4vLyBIT09LU1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHdoZW5ldmVyIGEgbW9tZW50IGlzIG11dGF0ZWQuXG4vLyBJdCBpcyBpbnRlbmRlZCB0byBrZWVwIHRoZSBvZmZzZXQgaW4gc3luYyB3aXRoIHRoZSB0aW1lem9uZS5cbmhvb2tzLnVwZGF0ZU9mZnNldCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4vLyBNT01FTlRTXG5cbi8vIGtlZXBMb2NhbFRpbWUgPSB0cnVlIG1lYW5zIG9ubHkgY2hhbmdlIHRoZSB0aW1lem9uZSwgd2l0aG91dFxuLy8gYWZmZWN0aW5nIHRoZSBsb2NhbCBob3VyLiBTbyA1OjMxOjI2ICswMzAwIC0tW3V0Y09mZnNldCgyLCB0cnVlKV0tLT5cbi8vIDU6MzE6MjYgKzAyMDAgSXQgaXMgcG9zc2libGUgdGhhdCA1OjMxOjI2IGRvZXNuJ3QgZXhpc3Qgd2l0aCBvZmZzZXRcbi8vICswMjAwLCBzbyB3ZSBhZGp1c3QgdGhlIHRpbWUgYXMgbmVlZGVkLCB0byBiZSB2YWxpZC5cbi8vXG4vLyBLZWVwaW5nIHRoZSB0aW1lIGFjdHVhbGx5IGFkZHMvc3VidHJhY3RzIChvbmUgaG91cilcbi8vIGZyb20gdGhlIGFjdHVhbCByZXByZXNlbnRlZCB0aW1lLiBUaGF0IGlzIHdoeSB3ZSBjYWxsIHVwZGF0ZU9mZnNldFxuLy8gYSBzZWNvbmQgdGltZS4gSW4gY2FzZSBpdCB3YW50cyB1cyB0byBjaGFuZ2UgdGhlIG9mZnNldCBhZ2FpblxuLy8gX2NoYW5nZUluUHJvZ3Jlc3MgPT0gdHJ1ZSBjYXNlLCB0aGVuIHdlIGhhdmUgdG8gYWRqdXN0LCBiZWNhdXNlXG4vLyB0aGVyZSBpcyBubyBzdWNoIHRpbWUgaW4gdGhlIGdpdmVuIHRpbWV6b25lLlxuZnVuY3Rpb24gZ2V0U2V0T2Zmc2V0IChpbnB1dCwga2VlcExvY2FsVGltZSwga2VlcE1pbnV0ZXMpIHtcbiAgICB2YXIgb2Zmc2V0ID0gdGhpcy5fb2Zmc2V0IHx8IDAsXG4gICAgICAgIGxvY2FsQWRqdXN0O1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0ICE9IG51bGwgPyB0aGlzIDogTmFOO1xuICAgIH1cbiAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaW5wdXQgPSBvZmZzZXRGcm9tU3RyaW5nKG1hdGNoU2hvcnRPZmZzZXQsIGlucHV0KTtcbiAgICAgICAgICAgIGlmIChpbnB1dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKE1hdGguYWJzKGlucHV0KSA8IDE2ICYmICFrZWVwTWludXRlcykge1xuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dCAqIDYwO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5faXNVVEMgJiYga2VlcExvY2FsVGltZSkge1xuICAgICAgICAgICAgbG9jYWxBZGp1c3QgPSBnZXREYXRlT2Zmc2V0KHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX29mZnNldCA9IGlucHV0O1xuICAgICAgICB0aGlzLl9pc1VUQyA9IHRydWU7XG4gICAgICAgIGlmIChsb2NhbEFkanVzdCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmFkZChsb2NhbEFkanVzdCwgJ20nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob2Zmc2V0ICE9PSBpbnB1dCkge1xuICAgICAgICAgICAgaWYgKCFrZWVwTG9jYWxUaW1lIHx8IHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICBhZGRTdWJ0cmFjdCh0aGlzLCBjcmVhdGVEdXJhdGlvbihpbnB1dCAtIG9mZnNldCwgJ20nKSwgMSwgZmFsc2UpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGhvb2tzLnVwZGF0ZU9mZnNldCh0aGlzLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jaGFuZ2VJblByb2dyZXNzID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyBvZmZzZXQgOiBnZXREYXRlT2Zmc2V0KHRoaXMpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0U2V0Wm9uZSAoaW5wdXQsIGtlZXBMb2NhbFRpbWUpIHtcbiAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICBpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaW5wdXQgPSAtaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnV0Y09mZnNldChpbnB1dCwga2VlcExvY2FsVGltZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIC10aGlzLnV0Y09mZnNldCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0T2Zmc2V0VG9VVEMgKGtlZXBMb2NhbFRpbWUpIHtcbiAgICByZXR1cm4gdGhpcy51dGNPZmZzZXQoMCwga2VlcExvY2FsVGltZSk7XG59XG5cbmZ1bmN0aW9uIHNldE9mZnNldFRvTG9jYWwgKGtlZXBMb2NhbFRpbWUpIHtcbiAgICBpZiAodGhpcy5faXNVVEMpIHtcbiAgICAgICAgdGhpcy51dGNPZmZzZXQoMCwga2VlcExvY2FsVGltZSk7XG4gICAgICAgIHRoaXMuX2lzVVRDID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgICAgIHRoaXMuc3VidHJhY3QoZ2V0RGF0ZU9mZnNldCh0aGlzKSwgJ20nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gc2V0T2Zmc2V0VG9QYXJzZWRPZmZzZXQgKCkge1xuICAgIGlmICh0aGlzLl90em0gIT0gbnVsbCkge1xuICAgICAgICB0aGlzLnV0Y09mZnNldCh0aGlzLl90em0sIGZhbHNlLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLl9pID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YXIgdFpvbmUgPSBvZmZzZXRGcm9tU3RyaW5nKG1hdGNoT2Zmc2V0LCB0aGlzLl9pKTtcbiAgICAgICAgaWYgKHRab25lICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KHRab25lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KDAsIHRydWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBoYXNBbGlnbmVkSG91ck9mZnNldCAoaW5wdXQpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaW5wdXQgPSBpbnB1dCA/IGNyZWF0ZUxvY2FsKGlucHV0KS51dGNPZmZzZXQoKSA6IDA7XG5cbiAgICByZXR1cm4gKHRoaXMudXRjT2Zmc2V0KCkgLSBpbnB1dCkgJSA2MCA9PT0gMDtcbn1cblxuZnVuY3Rpb24gaXNEYXlsaWdodFNhdmluZ1RpbWUgKCkge1xuICAgIHJldHVybiAoXG4gICAgICAgIHRoaXMudXRjT2Zmc2V0KCkgPiB0aGlzLmNsb25lKCkubW9udGgoMCkudXRjT2Zmc2V0KCkgfHxcbiAgICAgICAgdGhpcy51dGNPZmZzZXQoKSA+IHRoaXMuY2xvbmUoKS5tb250aCg1KS51dGNPZmZzZXQoKVxuICAgICk7XG59XG5cbmZ1bmN0aW9uIGlzRGF5bGlnaHRTYXZpbmdUaW1lU2hpZnRlZCAoKSB7XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9pc0RTVFNoaWZ0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0RTVFNoaWZ0ZWQ7XG4gICAgfVxuXG4gICAgdmFyIGMgPSB7fTtcblxuICAgIGNvcHlDb25maWcoYywgdGhpcyk7XG4gICAgYyA9IHByZXBhcmVDb25maWcoYyk7XG5cbiAgICBpZiAoYy5fYSkge1xuICAgICAgICB2YXIgb3RoZXIgPSBjLl9pc1VUQyA/IGNyZWF0ZVVUQyhjLl9hKSA6IGNyZWF0ZUxvY2FsKGMuX2EpO1xuICAgICAgICB0aGlzLl9pc0RTVFNoaWZ0ZWQgPSB0aGlzLmlzVmFsaWQoKSAmJlxuICAgICAgICAgICAgY29tcGFyZUFycmF5cyhjLl9hLCBvdGhlci50b0FycmF5KCkpID4gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9pc0RTVFNoaWZ0ZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5faXNEU1RTaGlmdGVkO1xufVxuXG5mdW5jdGlvbiBpc0xvY2FsICgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyAhdGhpcy5faXNVVEMgOiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNVdGNPZmZzZXQgKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSA/IHRoaXMuX2lzVVRDIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzVXRjICgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzLl9pc1VUQyAmJiB0aGlzLl9vZmZzZXQgPT09IDAgOiBmYWxzZTtcbn1cblxuLy8gQVNQLk5FVCBqc29uIGRhdGUgZm9ybWF0IHJlZ2V4XG52YXIgYXNwTmV0UmVnZXggPSAvXihcXC0pPyg/OihcXGQqKVsuIF0pPyhcXGQrKVxcOihcXGQrKSg/OlxcOihcXGQrKShcXC5cXGQqKT8pPyQvO1xuXG4vLyBmcm9tIGh0dHA6Ly9kb2NzLmNsb3N1cmUtbGlicmFyeS5nb29nbGVjb2RlLmNvbS9naXQvY2xvc3VyZV9nb29nX2RhdGVfZGF0ZS5qcy5zb3VyY2UuaHRtbFxuLy8gc29tZXdoYXQgbW9yZSBpbiBsaW5lIHdpdGggNC40LjMuMiAyMDA0IHNwZWMsIGJ1dCBhbGxvd3MgZGVjaW1hbCBhbnl3aGVyZVxuLy8gYW5kIGZ1cnRoZXIgbW9kaWZpZWQgdG8gYWxsb3cgZm9yIHN0cmluZ3MgY29udGFpbmluZyBib3RoIHdlZWsgYW5kIGRheVxudmFyIGlzb1JlZ2V4ID0gL14oLSk/UCg/OigtP1swLTksLl0qKVkpPyg/OigtP1swLTksLl0qKU0pPyg/OigtP1swLTksLl0qKVcpPyg/OigtP1swLTksLl0qKUQpPyg/OlQoPzooLT9bMC05LC5dKilIKT8oPzooLT9bMC05LC5dKilNKT8oPzooLT9bMC05LC5dKilTKT8pPyQvO1xuXG5mdW5jdGlvbiBjcmVhdGVEdXJhdGlvbiAoaW5wdXQsIGtleSkge1xuICAgIHZhciBkdXJhdGlvbiA9IGlucHV0LFxuICAgICAgICAvLyBtYXRjaGluZyBhZ2FpbnN0IHJlZ2V4cCBpcyBleHBlbnNpdmUsIGRvIGl0IG9uIGRlbWFuZFxuICAgICAgICBtYXRjaCA9IG51bGwsXG4gICAgICAgIHNpZ24sXG4gICAgICAgIHJldCxcbiAgICAgICAgZGlmZlJlcztcblxuICAgIGlmIChpc0R1cmF0aW9uKGlucHV0KSkge1xuICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgIG1zIDogaW5wdXQuX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgIGQgIDogaW5wdXQuX2RheXMsXG4gICAgICAgICAgICBNICA6IGlucHV0Ll9tb250aHNcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGlzTnVtYmVyKGlucHV0KSkge1xuICAgICAgICBkdXJhdGlvbiA9IHt9O1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICBkdXJhdGlvbltrZXldID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkdXJhdGlvbi5taWxsaXNlY29uZHMgPSBpbnB1dDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoISEobWF0Y2ggPSBhc3BOZXRSZWdleC5leGVjKGlucHV0KSkpIHtcbiAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gJy0nKSA/IC0xIDogMTtcbiAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICB5ICA6IDAsXG4gICAgICAgICAgICBkICA6IHRvSW50KG1hdGNoW0RBVEVdKSAgICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBoICA6IHRvSW50KG1hdGNoW0hPVVJdKSAgICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBtICA6IHRvSW50KG1hdGNoW01JTlVURV0pICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBzICA6IHRvSW50KG1hdGNoW1NFQ09ORF0pICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBtcyA6IHRvSW50KGFic1JvdW5kKG1hdGNoW01JTExJU0VDT05EXSAqIDEwMDApKSAqIHNpZ24gLy8gdGhlIG1pbGxpc2Vjb25kIGRlY2ltYWwgcG9pbnQgaXMgaW5jbHVkZWQgaW4gdGhlIG1hdGNoXG4gICAgICAgIH07XG4gICAgfSBlbHNlIGlmICghIShtYXRjaCA9IGlzb1JlZ2V4LmV4ZWMoaW5wdXQpKSkge1xuICAgICAgICBzaWduID0gKG1hdGNoWzFdID09PSAnLScpID8gLTEgOiAxO1xuICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgIHkgOiBwYXJzZUlzbyhtYXRjaFsyXSwgc2lnbiksXG4gICAgICAgICAgICBNIDogcGFyc2VJc28obWF0Y2hbM10sIHNpZ24pLFxuICAgICAgICAgICAgdyA6IHBhcnNlSXNvKG1hdGNoWzRdLCBzaWduKSxcbiAgICAgICAgICAgIGQgOiBwYXJzZUlzbyhtYXRjaFs1XSwgc2lnbiksXG4gICAgICAgICAgICBoIDogcGFyc2VJc28obWF0Y2hbNl0sIHNpZ24pLFxuICAgICAgICAgICAgbSA6IHBhcnNlSXNvKG1hdGNoWzddLCBzaWduKSxcbiAgICAgICAgICAgIHMgOiBwYXJzZUlzbyhtYXRjaFs4XSwgc2lnbilcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGR1cmF0aW9uID09IG51bGwpIHsvLyBjaGVja3MgZm9yIG51bGwgb3IgdW5kZWZpbmVkXG4gICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZHVyYXRpb24gPT09ICdvYmplY3QnICYmICgnZnJvbScgaW4gZHVyYXRpb24gfHwgJ3RvJyBpbiBkdXJhdGlvbikpIHtcbiAgICAgICAgZGlmZlJlcyA9IG1vbWVudHNEaWZmZXJlbmNlKGNyZWF0ZUxvY2FsKGR1cmF0aW9uLmZyb20pLCBjcmVhdGVMb2NhbChkdXJhdGlvbi50bykpO1xuXG4gICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgICAgIGR1cmF0aW9uLm1zID0gZGlmZlJlcy5taWxsaXNlY29uZHM7XG4gICAgICAgIGR1cmF0aW9uLk0gPSBkaWZmUmVzLm1vbnRocztcbiAgICB9XG5cbiAgICByZXQgPSBuZXcgRHVyYXRpb24oZHVyYXRpb24pO1xuXG4gICAgaWYgKGlzRHVyYXRpb24oaW5wdXQpICYmIGhhc093blByb3AoaW5wdXQsICdfbG9jYWxlJykpIHtcbiAgICAgICAgcmV0Ll9sb2NhbGUgPSBpbnB1dC5fbG9jYWxlO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59XG5cbmNyZWF0ZUR1cmF0aW9uLmZuID0gRHVyYXRpb24ucHJvdG90eXBlO1xuY3JlYXRlRHVyYXRpb24uaW52YWxpZCA9IGNyZWF0ZUludmFsaWQkMTtcblxuZnVuY3Rpb24gcGFyc2VJc28gKGlucCwgc2lnbikge1xuICAgIC8vIFdlJ2Qgbm9ybWFsbHkgdXNlIH5+aW5wIGZvciB0aGlzLCBidXQgdW5mb3J0dW5hdGVseSBpdCBhbHNvXG4gICAgLy8gY29udmVydHMgZmxvYXRzIHRvIGludHMuXG4gICAgLy8gaW5wIG1heSBiZSB1bmRlZmluZWQsIHNvIGNhcmVmdWwgY2FsbGluZyByZXBsYWNlIG9uIGl0LlxuICAgIHZhciByZXMgPSBpbnAgJiYgcGFyc2VGbG9hdChpbnAucmVwbGFjZSgnLCcsICcuJykpO1xuICAgIC8vIGFwcGx5IHNpZ24gd2hpbGUgd2UncmUgYXQgaXRcbiAgICByZXR1cm4gKGlzTmFOKHJlcykgPyAwIDogcmVzKSAqIHNpZ247XG59XG5cbmZ1bmN0aW9uIHBvc2l0aXZlTW9tZW50c0RpZmZlcmVuY2UoYmFzZSwgb3RoZXIpIHtcbiAgICB2YXIgcmVzID0ge21pbGxpc2Vjb25kczogMCwgbW9udGhzOiAwfTtcblxuICAgIHJlcy5tb250aHMgPSBvdGhlci5tb250aCgpIC0gYmFzZS5tb250aCgpICtcbiAgICAgICAgKG90aGVyLnllYXIoKSAtIGJhc2UueWVhcigpKSAqIDEyO1xuICAgIGlmIChiYXNlLmNsb25lKCkuYWRkKHJlcy5tb250aHMsICdNJykuaXNBZnRlcihvdGhlcikpIHtcbiAgICAgICAgLS1yZXMubW9udGhzO1xuICAgIH1cblxuICAgIHJlcy5taWxsaXNlY29uZHMgPSArb3RoZXIgLSArKGJhc2UuY2xvbmUoKS5hZGQocmVzLm1vbnRocywgJ00nKSk7XG5cbiAgICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBtb21lbnRzRGlmZmVyZW5jZShiYXNlLCBvdGhlcikge1xuICAgIHZhciByZXM7XG4gICAgaWYgKCEoYmFzZS5pc1ZhbGlkKCkgJiYgb3RoZXIuaXNWYWxpZCgpKSkge1xuICAgICAgICByZXR1cm4ge21pbGxpc2Vjb25kczogMCwgbW9udGhzOiAwfTtcbiAgICB9XG5cbiAgICBvdGhlciA9IGNsb25lV2l0aE9mZnNldChvdGhlciwgYmFzZSk7XG4gICAgaWYgKGJhc2UuaXNCZWZvcmUob3RoZXIpKSB7XG4gICAgICAgIHJlcyA9IHBvc2l0aXZlTW9tZW50c0RpZmZlcmVuY2UoYmFzZSwgb3RoZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcyA9IHBvc2l0aXZlTW9tZW50c0RpZmZlcmVuY2Uob3RoZXIsIGJhc2UpO1xuICAgICAgICByZXMubWlsbGlzZWNvbmRzID0gLXJlcy5taWxsaXNlY29uZHM7XG4gICAgICAgIHJlcy5tb250aHMgPSAtcmVzLm1vbnRocztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBUT0RPOiByZW1vdmUgJ25hbWUnIGFyZyBhZnRlciBkZXByZWNhdGlvbiBpcyByZW1vdmVkXG5mdW5jdGlvbiBjcmVhdGVBZGRlcihkaXJlY3Rpb24sIG5hbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbCwgcGVyaW9kKSB7XG4gICAgICAgIHZhciBkdXIsIHRtcDtcbiAgICAgICAgLy9pbnZlcnQgdGhlIGFyZ3VtZW50cywgYnV0IGNvbXBsYWluIGFib3V0IGl0XG4gICAgICAgIGlmIChwZXJpb2QgIT09IG51bGwgJiYgIWlzTmFOKCtwZXJpb2QpKSB7XG4gICAgICAgICAgICBkZXByZWNhdGVTaW1wbGUobmFtZSwgJ21vbWVudCgpLicgKyBuYW1lICArICcocGVyaW9kLCBudW1iZXIpIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgbW9tZW50KCkuJyArIG5hbWUgKyAnKG51bWJlciwgcGVyaW9kKS4gJyArXG4gICAgICAgICAgICAnU2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvYWRkLWludmVydGVkLXBhcmFtLyBmb3IgbW9yZSBpbmZvLicpO1xuICAgICAgICAgICAgdG1wID0gdmFsOyB2YWwgPSBwZXJpb2Q7IHBlcmlvZCA9IHRtcDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbCA9IHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnID8gK3ZhbCA6IHZhbDtcbiAgICAgICAgZHVyID0gY3JlYXRlRHVyYXRpb24odmFsLCBwZXJpb2QpO1xuICAgICAgICBhZGRTdWJ0cmFjdCh0aGlzLCBkdXIsIGRpcmVjdGlvbik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGFkZFN1YnRyYWN0IChtb20sIGR1cmF0aW9uLCBpc0FkZGluZywgdXBkYXRlT2Zmc2V0KSB7XG4gICAgdmFyIG1pbGxpc2Vjb25kcyA9IGR1cmF0aW9uLl9taWxsaXNlY29uZHMsXG4gICAgICAgIGRheXMgPSBhYnNSb3VuZChkdXJhdGlvbi5fZGF5cyksXG4gICAgICAgIG1vbnRocyA9IGFic1JvdW5kKGR1cmF0aW9uLl9tb250aHMpO1xuXG4gICAgaWYgKCFtb20uaXNWYWxpZCgpKSB7XG4gICAgICAgIC8vIE5vIG9wXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB1cGRhdGVPZmZzZXQgPSB1cGRhdGVPZmZzZXQgPT0gbnVsbCA/IHRydWUgOiB1cGRhdGVPZmZzZXQ7XG5cbiAgICBpZiAobWlsbGlzZWNvbmRzKSB7XG4gICAgICAgIG1vbS5fZC5zZXRUaW1lKG1vbS5fZC52YWx1ZU9mKCkgKyBtaWxsaXNlY29uZHMgKiBpc0FkZGluZyk7XG4gICAgfVxuICAgIGlmIChkYXlzKSB7XG4gICAgICAgIHNldCQxKG1vbSwgJ0RhdGUnLCBnZXQobW9tLCAnRGF0ZScpICsgZGF5cyAqIGlzQWRkaW5nKTtcbiAgICB9XG4gICAgaWYgKG1vbnRocykge1xuICAgICAgICBzZXRNb250aChtb20sIGdldChtb20sICdNb250aCcpICsgbW9udGhzICogaXNBZGRpbmcpO1xuICAgIH1cbiAgICBpZiAodXBkYXRlT2Zmc2V0KSB7XG4gICAgICAgIGhvb2tzLnVwZGF0ZU9mZnNldChtb20sIGRheXMgfHwgbW9udGhzKTtcbiAgICB9XG59XG5cbnZhciBhZGQgICAgICA9IGNyZWF0ZUFkZGVyKDEsICdhZGQnKTtcbnZhciBzdWJ0cmFjdCA9IGNyZWF0ZUFkZGVyKC0xLCAnc3VidHJhY3QnKTtcblxuZnVuY3Rpb24gZ2V0Q2FsZW5kYXJGb3JtYXQobXlNb21lbnQsIG5vdykge1xuICAgIHZhciBkaWZmID0gbXlNb21lbnQuZGlmZihub3csICdkYXlzJywgdHJ1ZSk7XG4gICAgcmV0dXJuIGRpZmYgPCAtNiA/ICdzYW1lRWxzZScgOlxuICAgICAgICAgICAgZGlmZiA8IC0xID8gJ2xhc3RXZWVrJyA6XG4gICAgICAgICAgICBkaWZmIDwgMCA/ICdsYXN0RGF5JyA6XG4gICAgICAgICAgICBkaWZmIDwgMSA/ICdzYW1lRGF5JyA6XG4gICAgICAgICAgICBkaWZmIDwgMiA/ICduZXh0RGF5JyA6XG4gICAgICAgICAgICBkaWZmIDwgNyA/ICduZXh0V2VlaycgOiAnc2FtZUVsc2UnO1xufVxuXG5mdW5jdGlvbiBjYWxlbmRhciQxICh0aW1lLCBmb3JtYXRzKSB7XG4gICAgLy8gV2Ugd2FudCB0byBjb21wYXJlIHRoZSBzdGFydCBvZiB0b2RheSwgdnMgdGhpcy5cbiAgICAvLyBHZXR0aW5nIHN0YXJ0LW9mLXRvZGF5IGRlcGVuZHMgb24gd2hldGhlciB3ZSdyZSBsb2NhbC91dGMvb2Zmc2V0IG9yIG5vdC5cbiAgICB2YXIgbm93ID0gdGltZSB8fCBjcmVhdGVMb2NhbCgpLFxuICAgICAgICBzb2QgPSBjbG9uZVdpdGhPZmZzZXQobm93LCB0aGlzKS5zdGFydE9mKCdkYXknKSxcbiAgICAgICAgZm9ybWF0ID0gaG9va3MuY2FsZW5kYXJGb3JtYXQodGhpcywgc29kKSB8fCAnc2FtZUVsc2UnO1xuXG4gICAgdmFyIG91dHB1dCA9IGZvcm1hdHMgJiYgKGlzRnVuY3Rpb24oZm9ybWF0c1tmb3JtYXRdKSA/IGZvcm1hdHNbZm9ybWF0XS5jYWxsKHRoaXMsIG5vdykgOiBmb3JtYXRzW2Zvcm1hdF0pO1xuXG4gICAgcmV0dXJuIHRoaXMuZm9ybWF0KG91dHB1dCB8fCB0aGlzLmxvY2FsZURhdGEoKS5jYWxlbmRhcihmb3JtYXQsIHRoaXMsIGNyZWF0ZUxvY2FsKG5vdykpKTtcbn1cblxuZnVuY3Rpb24gY2xvbmUgKCkge1xuICAgIHJldHVybiBuZXcgTW9tZW50KHRoaXMpO1xufVxuXG5mdW5jdGlvbiBpc0FmdGVyIChpbnB1dCwgdW5pdHMpIHtcbiAgICB2YXIgbG9jYWxJbnB1dCA9IGlzTW9tZW50KGlucHV0KSA/IGlucHV0IDogY3JlYXRlTG9jYWwoaW5wdXQpO1xuICAgIGlmICghKHRoaXMuaXNWYWxpZCgpICYmIGxvY2FsSW5wdXQuaXNWYWxpZCgpKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHMoIWlzVW5kZWZpbmVkKHVuaXRzKSA/IHVuaXRzIDogJ21pbGxpc2Vjb25kJyk7XG4gICAgaWYgKHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKSA+IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBsb2NhbElucHV0LnZhbHVlT2YoKSA8IHRoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKS52YWx1ZU9mKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0JlZm9yZSAoaW5wdXQsIHVuaXRzKSB7XG4gICAgdmFyIGxvY2FsSW5wdXQgPSBpc01vbWVudChpbnB1dCkgPyBpbnB1dCA6IGNyZWF0ZUxvY2FsKGlucHV0KTtcbiAgICBpZiAoISh0aGlzLmlzVmFsaWQoKSAmJiBsb2NhbElucHV0LmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKCFpc1VuZGVmaW5lZCh1bml0cykgPyB1bml0cyA6ICdtaWxsaXNlY29uZCcpO1xuICAgIGlmICh1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCkgPCBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSgpLmVuZE9mKHVuaXRzKS52YWx1ZU9mKCkgPCBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzQmV0d2VlbiAoZnJvbSwgdG8sIHVuaXRzLCBpbmNsdXNpdml0eSkge1xuICAgIGluY2x1c2l2aXR5ID0gaW5jbHVzaXZpdHkgfHwgJygpJztcbiAgICByZXR1cm4gKGluY2x1c2l2aXR5WzBdID09PSAnKCcgPyB0aGlzLmlzQWZ0ZXIoZnJvbSwgdW5pdHMpIDogIXRoaXMuaXNCZWZvcmUoZnJvbSwgdW5pdHMpKSAmJlxuICAgICAgICAoaW5jbHVzaXZpdHlbMV0gPT09ICcpJyA/IHRoaXMuaXNCZWZvcmUodG8sIHVuaXRzKSA6ICF0aGlzLmlzQWZ0ZXIodG8sIHVuaXRzKSk7XG59XG5cbmZ1bmN0aW9uIGlzU2FtZSAoaW5wdXQsIHVuaXRzKSB7XG4gICAgdmFyIGxvY2FsSW5wdXQgPSBpc01vbWVudChpbnB1dCkgPyBpbnB1dCA6IGNyZWF0ZUxvY2FsKGlucHV0KSxcbiAgICAgICAgaW5wdXRNcztcbiAgICBpZiAoISh0aGlzLmlzVmFsaWQoKSAmJiBsb2NhbElucHV0LmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzIHx8ICdtaWxsaXNlY29uZCcpO1xuICAgIGlmICh1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCkgPT09IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlucHV0TXMgPSBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKS52YWx1ZU9mKCkgPD0gaW5wdXRNcyAmJiBpbnB1dE1zIDw9IHRoaXMuY2xvbmUoKS5lbmRPZih1bml0cykudmFsdWVPZigpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNTYW1lT3JBZnRlciAoaW5wdXQsIHVuaXRzKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNTYW1lKGlucHV0LCB1bml0cykgfHwgdGhpcy5pc0FmdGVyKGlucHV0LHVuaXRzKTtcbn1cblxuZnVuY3Rpb24gaXNTYW1lT3JCZWZvcmUgKGlucHV0LCB1bml0cykge1xuICAgIHJldHVybiB0aGlzLmlzU2FtZShpbnB1dCwgdW5pdHMpIHx8IHRoaXMuaXNCZWZvcmUoaW5wdXQsdW5pdHMpO1xufVxuXG5mdW5jdGlvbiBkaWZmIChpbnB1dCwgdW5pdHMsIGFzRmxvYXQpIHtcbiAgICB2YXIgdGhhdCxcbiAgICAgICAgem9uZURlbHRhLFxuICAgICAgICBkZWx0YSwgb3V0cHV0O1xuXG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gTmFOO1xuICAgIH1cblxuICAgIHRoYXQgPSBjbG9uZVdpdGhPZmZzZXQoaW5wdXQsIHRoaXMpO1xuXG4gICAgaWYgKCF0aGF0LmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gTmFOO1xuICAgIH1cblxuICAgIHpvbmVEZWx0YSA9ICh0aGF0LnV0Y09mZnNldCgpIC0gdGhpcy51dGNPZmZzZXQoKSkgKiA2ZTQ7XG5cbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcblxuICAgIGlmICh1bml0cyA9PT0gJ3llYXInIHx8IHVuaXRzID09PSAnbW9udGgnIHx8IHVuaXRzID09PSAncXVhcnRlcicpIHtcbiAgICAgICAgb3V0cHV0ID0gbW9udGhEaWZmKHRoaXMsIHRoYXQpO1xuICAgICAgICBpZiAodW5pdHMgPT09ICdxdWFydGVyJykge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0IC8gMztcbiAgICAgICAgfSBlbHNlIGlmICh1bml0cyA9PT0gJ3llYXInKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgLyAxMjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbHRhID0gdGhpcyAtIHRoYXQ7XG4gICAgICAgIG91dHB1dCA9IHVuaXRzID09PSAnc2Vjb25kJyA/IGRlbHRhIC8gMWUzIDogLy8gMTAwMFxuICAgICAgICAgICAgdW5pdHMgPT09ICdtaW51dGUnID8gZGVsdGEgLyA2ZTQgOiAvLyAxMDAwICogNjBcbiAgICAgICAgICAgIHVuaXRzID09PSAnaG91cicgPyBkZWx0YSAvIDM2ZTUgOiAvLyAxMDAwICogNjAgKiA2MFxuICAgICAgICAgICAgdW5pdHMgPT09ICdkYXknID8gKGRlbHRhIC0gem9uZURlbHRhKSAvIDg2NGU1IDogLy8gMTAwMCAqIDYwICogNjAgKiAyNCwgbmVnYXRlIGRzdFxuICAgICAgICAgICAgdW5pdHMgPT09ICd3ZWVrJyA/IChkZWx0YSAtIHpvbmVEZWx0YSkgLyA2MDQ4ZTUgOiAvLyAxMDAwICogNjAgKiA2MCAqIDI0ICogNywgbmVnYXRlIGRzdFxuICAgICAgICAgICAgZGVsdGE7XG4gICAgfVxuICAgIHJldHVybiBhc0Zsb2F0ID8gb3V0cHV0IDogYWJzRmxvb3Iob3V0cHV0KTtcbn1cblxuZnVuY3Rpb24gbW9udGhEaWZmIChhLCBiKSB7XG4gICAgLy8gZGlmZmVyZW5jZSBpbiBtb250aHNcbiAgICB2YXIgd2hvbGVNb250aERpZmYgPSAoKGIueWVhcigpIC0gYS55ZWFyKCkpICogMTIpICsgKGIubW9udGgoKSAtIGEubW9udGgoKSksXG4gICAgICAgIC8vIGIgaXMgaW4gKGFuY2hvciAtIDEgbW9udGgsIGFuY2hvciArIDEgbW9udGgpXG4gICAgICAgIGFuY2hvciA9IGEuY2xvbmUoKS5hZGQod2hvbGVNb250aERpZmYsICdtb250aHMnKSxcbiAgICAgICAgYW5jaG9yMiwgYWRqdXN0O1xuXG4gICAgaWYgKGIgLSBhbmNob3IgPCAwKSB7XG4gICAgICAgIGFuY2hvcjIgPSBhLmNsb25lKCkuYWRkKHdob2xlTW9udGhEaWZmIC0gMSwgJ21vbnRocycpO1xuICAgICAgICAvLyBsaW5lYXIgYWNyb3NzIHRoZSBtb250aFxuICAgICAgICBhZGp1c3QgPSAoYiAtIGFuY2hvcikgLyAoYW5jaG9yIC0gYW5jaG9yMik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYW5jaG9yMiA9IGEuY2xvbmUoKS5hZGQod2hvbGVNb250aERpZmYgKyAxLCAnbW9udGhzJyk7XG4gICAgICAgIC8vIGxpbmVhciBhY3Jvc3MgdGhlIG1vbnRoXG4gICAgICAgIGFkanVzdCA9IChiIC0gYW5jaG9yKSAvIChhbmNob3IyIC0gYW5jaG9yKTtcbiAgICB9XG5cbiAgICAvL2NoZWNrIGZvciBuZWdhdGl2ZSB6ZXJvLCByZXR1cm4gemVybyBpZiBuZWdhdGl2ZSB6ZXJvXG4gICAgcmV0dXJuIC0od2hvbGVNb250aERpZmYgKyBhZGp1c3QpIHx8IDA7XG59XG5cbmhvb2tzLmRlZmF1bHRGb3JtYXQgPSAnWVlZWS1NTS1ERFRISDptbTpzc1onO1xuaG9va3MuZGVmYXVsdEZvcm1hdFV0YyA9ICdZWVlZLU1NLUREVEhIOm1tOnNzW1pdJztcblxuZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiB0aGlzLmNsb25lKCkubG9jYWxlKCdlbicpLmZvcm1hdCgnZGRkIE1NTSBERCBZWVlZIEhIOm1tOnNzIFtHTVRdWlonKTtcbn1cblxuZnVuY3Rpb24gdG9JU09TdHJpbmcoKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIG0gPSB0aGlzLmNsb25lKCkudXRjKCk7XG4gICAgaWYgKG0ueWVhcigpIDwgMCB8fCBtLnllYXIoKSA+IDk5OTkpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdJyk7XG4gICAgfVxuICAgIGlmIChpc0Z1bmN0aW9uKERhdGUucHJvdG90eXBlLnRvSVNPU3RyaW5nKSkge1xuICAgICAgICAvLyBuYXRpdmUgaW1wbGVtZW50YXRpb24gaXMgfjUweCBmYXN0ZXIsIHVzZSBpdCB3aGVuIHdlIGNhblxuICAgICAgICByZXR1cm4gdGhpcy50b0RhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIH1cbiAgICByZXR1cm4gZm9ybWF0TW9tZW50KG0sICdZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdJyk7XG59XG5cbi8qKlxuICogUmV0dXJuIGEgaHVtYW4gcmVhZGFibGUgcmVwcmVzZW50YXRpb24gb2YgYSBtb21lbnQgdGhhdCBjYW5cbiAqIGFsc28gYmUgZXZhbHVhdGVkIHRvIGdldCBhIG5ldyBtb21lbnQgd2hpY2ggaXMgdGhlIHNhbWVcbiAqXG4gKiBAbGluayBodHRwczovL25vZGVqcy5vcmcvZGlzdC9sYXRlc3QvZG9jcy9hcGkvdXRpbC5odG1sI3V0aWxfY3VzdG9tX2luc3BlY3RfZnVuY3Rpb25fb25fb2JqZWN0c1xuICovXG5mdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiAnbW9tZW50LmludmFsaWQoLyogJyArIHRoaXMuX2kgKyAnICovKSc7XG4gICAgfVxuICAgIHZhciBmdW5jID0gJ21vbWVudCc7XG4gICAgdmFyIHpvbmUgPSAnJztcbiAgICBpZiAoIXRoaXMuaXNMb2NhbCgpKSB7XG4gICAgICAgIGZ1bmMgPSB0aGlzLnV0Y09mZnNldCgpID09PSAwID8gJ21vbWVudC51dGMnIDogJ21vbWVudC5wYXJzZVpvbmUnO1xuICAgICAgICB6b25lID0gJ1onO1xuICAgIH1cbiAgICB2YXIgcHJlZml4ID0gJ1snICsgZnVuYyArICcoXCJdJztcbiAgICB2YXIgeWVhciA9ICgwIDw9IHRoaXMueWVhcigpICYmIHRoaXMueWVhcigpIDw9IDk5OTkpID8gJ1lZWVknIDogJ1lZWVlZWSc7XG4gICAgdmFyIGRhdGV0aW1lID0gJy1NTS1ERFtUXUhIOm1tOnNzLlNTUyc7XG4gICAgdmFyIHN1ZmZpeCA9IHpvbmUgKyAnW1wiKV0nO1xuXG4gICAgcmV0dXJuIHRoaXMuZm9ybWF0KHByZWZpeCArIHllYXIgKyBkYXRldGltZSArIHN1ZmZpeCk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdCAoaW5wdXRTdHJpbmcpIHtcbiAgICBpZiAoIWlucHV0U3RyaW5nKSB7XG4gICAgICAgIGlucHV0U3RyaW5nID0gdGhpcy5pc1V0YygpID8gaG9va3MuZGVmYXVsdEZvcm1hdFV0YyA6IGhvb2tzLmRlZmF1bHRGb3JtYXQ7XG4gICAgfVxuICAgIHZhciBvdXRwdXQgPSBmb3JtYXRNb21lbnQodGhpcywgaW5wdXRTdHJpbmcpO1xuICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5wb3N0Zm9ybWF0KG91dHB1dCk7XG59XG5cbmZ1bmN0aW9uIGZyb20gKHRpbWUsIHdpdGhvdXRTdWZmaXgpIHtcbiAgICBpZiAodGhpcy5pc1ZhbGlkKCkgJiZcbiAgICAgICAgICAgICgoaXNNb21lbnQodGltZSkgJiYgdGltZS5pc1ZhbGlkKCkpIHx8XG4gICAgICAgICAgICAgY3JlYXRlTG9jYWwodGltZSkuaXNWYWxpZCgpKSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlRHVyYXRpb24oe3RvOiB0aGlzLCBmcm9tOiB0aW1lfSkubG9jYWxlKHRoaXMubG9jYWxlKCkpLmh1bWFuaXplKCF3aXRob3V0U3VmZml4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkuaW52YWxpZERhdGUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZyb21Ob3cgKHdpdGhvdXRTdWZmaXgpIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tKGNyZWF0ZUxvY2FsKCksIHdpdGhvdXRTdWZmaXgpO1xufVxuXG5mdW5jdGlvbiB0byAodGltZSwgd2l0aG91dFN1ZmZpeCkge1xuICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJlxuICAgICAgICAgICAgKChpc01vbWVudCh0aW1lKSAmJiB0aW1lLmlzVmFsaWQoKSkgfHxcbiAgICAgICAgICAgICBjcmVhdGVMb2NhbCh0aW1lKS5pc1ZhbGlkKCkpKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVEdXJhdGlvbih7ZnJvbTogdGhpcywgdG86IHRpbWV9KS5sb2NhbGUodGhpcy5sb2NhbGUoKSkuaHVtYW5pemUoIXdpdGhvdXRTdWZmaXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5pbnZhbGlkRGF0ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdG9Ob3cgKHdpdGhvdXRTdWZmaXgpIHtcbiAgICByZXR1cm4gdGhpcy50byhjcmVhdGVMb2NhbCgpLCB3aXRob3V0U3VmZml4KTtcbn1cblxuLy8gSWYgcGFzc2VkIGEgbG9jYWxlIGtleSwgaXQgd2lsbCBzZXQgdGhlIGxvY2FsZSBmb3IgdGhpc1xuLy8gaW5zdGFuY2UuICBPdGhlcndpc2UsIGl0IHdpbGwgcmV0dXJuIHRoZSBsb2NhbGUgY29uZmlndXJhdGlvblxuLy8gdmFyaWFibGVzIGZvciB0aGlzIGluc3RhbmNlLlxuZnVuY3Rpb24gbG9jYWxlIChrZXkpIHtcbiAgICB2YXIgbmV3TG9jYWxlRGF0YTtcblxuICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9jYWxlLl9hYmJyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld0xvY2FsZURhdGEgPSBnZXRMb2NhbGUoa2V5KTtcbiAgICAgICAgaWYgKG5ld0xvY2FsZURhdGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fbG9jYWxlID0gbmV3TG9jYWxlRGF0YTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbnZhciBsYW5nID0gZGVwcmVjYXRlKFxuICAgICdtb21lbnQoKS5sYW5nKCkgaXMgZGVwcmVjYXRlZC4gSW5zdGVhZCwgdXNlIG1vbWVudCgpLmxvY2FsZURhdGEoKSB0byBnZXQgdGhlIGxhbmd1YWdlIGNvbmZpZ3VyYXRpb24uIFVzZSBtb21lbnQoKS5sb2NhbGUoKSB0byBjaGFuZ2UgbGFuZ3VhZ2VzLicsXG4gICAgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZShrZXkpO1xuICAgICAgICB9XG4gICAgfVxuKTtcblxuZnVuY3Rpb24gbG9jYWxlRGF0YSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2xvY2FsZTtcbn1cblxuZnVuY3Rpb24gc3RhcnRPZiAodW5pdHMpIHtcbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAvLyB0aGUgZm9sbG93aW5nIHN3aXRjaCBpbnRlbnRpb25hbGx5IG9taXRzIGJyZWFrIGtleXdvcmRzXG4gICAgLy8gdG8gdXRpbGl6ZSBmYWxsaW5nIHRocm91Z2ggdGhlIGNhc2VzLlxuICAgIHN3aXRjaCAodW5pdHMpIHtcbiAgICAgICAgY2FzZSAneWVhcic6XG4gICAgICAgICAgICB0aGlzLm1vbnRoKDApO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdxdWFydGVyJzpcbiAgICAgICAgY2FzZSAnbW9udGgnOlxuICAgICAgICAgICAgdGhpcy5kYXRlKDEpO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICd3ZWVrJzpcbiAgICAgICAgY2FzZSAnaXNvV2Vlayc6XG4gICAgICAgIGNhc2UgJ2RheSc6XG4gICAgICAgIGNhc2UgJ2RhdGUnOlxuICAgICAgICAgICAgdGhpcy5ob3VycygwKTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnaG91cic6XG4gICAgICAgICAgICB0aGlzLm1pbnV0ZXMoMCk7XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgICAgICAgICB0aGlzLnNlY29uZHMoMCk7XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgICAgICAgICB0aGlzLm1pbGxpc2Vjb25kcygwKTtcbiAgICB9XG5cbiAgICAvLyB3ZWVrcyBhcmUgYSBzcGVjaWFsIGNhc2VcbiAgICBpZiAodW5pdHMgPT09ICd3ZWVrJykge1xuICAgICAgICB0aGlzLndlZWtkYXkoMCk7XG4gICAgfVxuICAgIGlmICh1bml0cyA9PT0gJ2lzb1dlZWsnKSB7XG4gICAgICAgIHRoaXMuaXNvV2Vla2RheSgxKTtcbiAgICB9XG5cbiAgICAvLyBxdWFydGVycyBhcmUgYWxzbyBzcGVjaWFsXG4gICAgaWYgKHVuaXRzID09PSAncXVhcnRlcicpIHtcbiAgICAgICAgdGhpcy5tb250aChNYXRoLmZsb29yKHRoaXMubW9udGgoKSAvIDMpICogMyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIGVuZE9mICh1bml0cykge1xuICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgIGlmICh1bml0cyA9PT0gdW5kZWZpbmVkIHx8IHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8vICdkYXRlJyBpcyBhbiBhbGlhcyBmb3IgJ2RheScsIHNvIGl0IHNob3VsZCBiZSBjb25zaWRlcmVkIGFzIHN1Y2guXG4gICAgaWYgKHVuaXRzID09PSAnZGF0ZScpIHtcbiAgICAgICAgdW5pdHMgPSAnZGF5JztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zdGFydE9mKHVuaXRzKS5hZGQoMSwgKHVuaXRzID09PSAnaXNvV2VlaycgPyAnd2VlaycgOiB1bml0cykpLnN1YnRyYWN0KDEsICdtcycpO1xufVxuXG5mdW5jdGlvbiB2YWx1ZU9mICgpIHtcbiAgICByZXR1cm4gdGhpcy5fZC52YWx1ZU9mKCkgLSAoKHRoaXMuX29mZnNldCB8fCAwKSAqIDYwMDAwKTtcbn1cblxuZnVuY3Rpb24gdW5peCAoKSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IodGhpcy52YWx1ZU9mKCkgLyAxMDAwKTtcbn1cblxuZnVuY3Rpb24gdG9EYXRlICgpIHtcbiAgICByZXR1cm4gbmV3IERhdGUodGhpcy52YWx1ZU9mKCkpO1xufVxuXG5mdW5jdGlvbiB0b0FycmF5ICgpIHtcbiAgICB2YXIgbSA9IHRoaXM7XG4gICAgcmV0dXJuIFttLnllYXIoKSwgbS5tb250aCgpLCBtLmRhdGUoKSwgbS5ob3VyKCksIG0ubWludXRlKCksIG0uc2Vjb25kKCksIG0ubWlsbGlzZWNvbmQoKV07XG59XG5cbmZ1bmN0aW9uIHRvT2JqZWN0ICgpIHtcbiAgICB2YXIgbSA9IHRoaXM7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeWVhcnM6IG0ueWVhcigpLFxuICAgICAgICBtb250aHM6IG0ubW9udGgoKSxcbiAgICAgICAgZGF0ZTogbS5kYXRlKCksXG4gICAgICAgIGhvdXJzOiBtLmhvdXJzKCksXG4gICAgICAgIG1pbnV0ZXM6IG0ubWludXRlcygpLFxuICAgICAgICBzZWNvbmRzOiBtLnNlY29uZHMoKSxcbiAgICAgICAgbWlsbGlzZWNvbmRzOiBtLm1pbGxpc2Vjb25kcygpXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgICAvLyBuZXcgRGF0ZShOYU4pLnRvSlNPTigpID09PSBudWxsXG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpID8gdGhpcy50b0lTT1N0cmluZygpIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZCQyICgpIHtcbiAgICByZXR1cm4gaXNWYWxpZCh0aGlzKTtcbn1cblxuZnVuY3Rpb24gcGFyc2luZ0ZsYWdzICgpIHtcbiAgICByZXR1cm4gZXh0ZW5kKHt9LCBnZXRQYXJzaW5nRmxhZ3ModGhpcykpO1xufVxuXG5mdW5jdGlvbiBpbnZhbGlkQXQgKCkge1xuICAgIHJldHVybiBnZXRQYXJzaW5nRmxhZ3ModGhpcykub3ZlcmZsb3c7XG59XG5cbmZ1bmN0aW9uIGNyZWF0aW9uRGF0YSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBpbnB1dDogdGhpcy5faSxcbiAgICAgICAgZm9ybWF0OiB0aGlzLl9mLFxuICAgICAgICBsb2NhbGU6IHRoaXMuX2xvY2FsZSxcbiAgICAgICAgaXNVVEM6IHRoaXMuX2lzVVRDLFxuICAgICAgICBzdHJpY3Q6IHRoaXMuX3N0cmljdFxuICAgIH07XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oMCwgWydnZycsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMud2Vla1llYXIoKSAlIDEwMDtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbigwLCBbJ0dHJywgMl0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pc29XZWVrWWVhcigpICUgMTAwO1xufSk7XG5cbmZ1bmN0aW9uIGFkZFdlZWtZZWFyRm9ybWF0VG9rZW4gKHRva2VuLCBnZXR0ZXIpIHtcbiAgICBhZGRGb3JtYXRUb2tlbigwLCBbdG9rZW4sIHRva2VuLmxlbmd0aF0sIDAsIGdldHRlcik7XG59XG5cbmFkZFdlZWtZZWFyRm9ybWF0VG9rZW4oJ2dnZ2cnLCAgICAgJ3dlZWtZZWFyJyk7XG5hZGRXZWVrWWVhckZvcm1hdFRva2VuKCdnZ2dnZycsICAgICd3ZWVrWWVhcicpO1xuYWRkV2Vla1llYXJGb3JtYXRUb2tlbignR0dHRycsICAnaXNvV2Vla1llYXInKTtcbmFkZFdlZWtZZWFyRm9ybWF0VG9rZW4oJ0dHR0dHJywgJ2lzb1dlZWtZZWFyJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCd3ZWVrWWVhcicsICdnZycpO1xuYWRkVW5pdEFsaWFzKCdpc29XZWVrWWVhcicsICdHRycpO1xuXG4vLyBQUklPUklUWVxuXG5hZGRVbml0UHJpb3JpdHkoJ3dlZWtZZWFyJywgMSk7XG5hZGRVbml0UHJpb3JpdHkoJ2lzb1dlZWtZZWFyJywgMSk7XG5cblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdHJywgICAgICBtYXRjaFNpZ25lZCk7XG5hZGRSZWdleFRva2VuKCdnJywgICAgICBtYXRjaFNpZ25lZCk7XG5hZGRSZWdleFRva2VuKCdHRycsICAgICBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdnZycsICAgICBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdHR0dHJywgICBtYXRjaDF0bzQsIG1hdGNoNCk7XG5hZGRSZWdleFRva2VuKCdnZ2dnJywgICBtYXRjaDF0bzQsIG1hdGNoNCk7XG5hZGRSZWdleFRva2VuKCdHR0dHRycsICBtYXRjaDF0bzYsIG1hdGNoNik7XG5hZGRSZWdleFRva2VuKCdnZ2dnZycsICBtYXRjaDF0bzYsIG1hdGNoNik7XG5cbmFkZFdlZWtQYXJzZVRva2VuKFsnZ2dnZycsICdnZ2dnZycsICdHR0dHJywgJ0dHR0dHJ10sIGZ1bmN0aW9uIChpbnB1dCwgd2VlaywgY29uZmlnLCB0b2tlbikge1xuICAgIHdlZWtbdG9rZW4uc3Vic3RyKDAsIDIpXSA9IHRvSW50KGlucHV0KTtcbn0pO1xuXG5hZGRXZWVrUGFyc2VUb2tlbihbJ2dnJywgJ0dHJ10sIGZ1bmN0aW9uIChpbnB1dCwgd2VlaywgY29uZmlnLCB0b2tlbikge1xuICAgIHdlZWtbdG9rZW5dID0gaG9va3MucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpO1xufSk7XG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gZ2V0U2V0V2Vla1llYXIgKGlucHV0KSB7XG4gICAgcmV0dXJuIGdldFNldFdlZWtZZWFySGVscGVyLmNhbGwodGhpcyxcbiAgICAgICAgICAgIGlucHV0LFxuICAgICAgICAgICAgdGhpcy53ZWVrKCksXG4gICAgICAgICAgICB0aGlzLndlZWtkYXkoKSxcbiAgICAgICAgICAgIHRoaXMubG9jYWxlRGF0YSgpLl93ZWVrLmRvdyxcbiAgICAgICAgICAgIHRoaXMubG9jYWxlRGF0YSgpLl93ZWVrLmRveSk7XG59XG5cbmZ1bmN0aW9uIGdldFNldElTT1dlZWtZZWFyIChpbnB1dCkge1xuICAgIHJldHVybiBnZXRTZXRXZWVrWWVhckhlbHBlci5jYWxsKHRoaXMsXG4gICAgICAgICAgICBpbnB1dCwgdGhpcy5pc29XZWVrKCksIHRoaXMuaXNvV2Vla2RheSgpLCAxLCA0KTtcbn1cblxuZnVuY3Rpb24gZ2V0SVNPV2Vla3NJblllYXIgKCkge1xuICAgIHJldHVybiB3ZWVrc0luWWVhcih0aGlzLnllYXIoKSwgMSwgNCk7XG59XG5cbmZ1bmN0aW9uIGdldFdlZWtzSW5ZZWFyICgpIHtcbiAgICB2YXIgd2Vla0luZm8gPSB0aGlzLmxvY2FsZURhdGEoKS5fd2VlaztcbiAgICByZXR1cm4gd2Vla3NJblllYXIodGhpcy55ZWFyKCksIHdlZWtJbmZvLmRvdywgd2Vla0luZm8uZG95KTtcbn1cblxuZnVuY3Rpb24gZ2V0U2V0V2Vla1llYXJIZWxwZXIoaW5wdXQsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KSB7XG4gICAgdmFyIHdlZWtzVGFyZ2V0O1xuICAgIGlmIChpbnB1dCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB3ZWVrT2ZZZWFyKHRoaXMsIGRvdywgZG95KS55ZWFyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHdlZWtzVGFyZ2V0ID0gd2Vla3NJblllYXIoaW5wdXQsIGRvdywgZG95KTtcbiAgICAgICAgaWYgKHdlZWsgPiB3ZWVrc1RhcmdldCkge1xuICAgICAgICAgICAgd2VlayA9IHdlZWtzVGFyZ2V0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZXRXZWVrQWxsLmNhbGwodGhpcywgaW5wdXQsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldFdlZWtBbGwod2Vla1llYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KSB7XG4gICAgdmFyIGRheU9mWWVhckRhdGEgPSBkYXlPZlllYXJGcm9tV2Vla3Mod2Vla1llYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KSxcbiAgICAgICAgZGF0ZSA9IGNyZWF0ZVVUQ0RhdGUoZGF5T2ZZZWFyRGF0YS55ZWFyLCAwLCBkYXlPZlllYXJEYXRhLmRheU9mWWVhcik7XG5cbiAgICB0aGlzLnllYXIoZGF0ZS5nZXRVVENGdWxsWWVhcigpKTtcbiAgICB0aGlzLm1vbnRoKGRhdGUuZ2V0VVRDTW9udGgoKSk7XG4gICAgdGhpcy5kYXRlKGRhdGUuZ2V0VVRDRGF0ZSgpKTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignUScsIDAsICdRbycsICdxdWFydGVyJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdxdWFydGVyJywgJ1EnKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCdxdWFydGVyJywgNyk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignUScsIG1hdGNoMSk7XG5hZGRQYXJzZVRva2VuKCdRJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W01PTlRIXSA9ICh0b0ludChpbnB1dCkgLSAxKSAqIDM7XG59KTtcblxuLy8gTU9NRU5UU1xuXG5mdW5jdGlvbiBnZXRTZXRRdWFydGVyIChpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gTWF0aC5jZWlsKCh0aGlzLm1vbnRoKCkgKyAxKSAvIDMpIDogdGhpcy5tb250aCgoaW5wdXQgLSAxKSAqIDMgKyB0aGlzLm1vbnRoKCkgJSAzKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignRCcsIFsnREQnLCAyXSwgJ0RvJywgJ2RhdGUnKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ2RhdGUnLCAnRCcpO1xuXG4vLyBQUklPUk9JVFlcbmFkZFVuaXRQcmlvcml0eSgnZGF0ZScsIDkpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ0QnLCAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ0REJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignRG8nLCBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIC8vIFRPRE86IFJlbW92ZSBcIm9yZGluYWxQYXJzZVwiIGZhbGxiYWNrIGluIG5leHQgbWFqb3IgcmVsZWFzZS5cbiAgICByZXR1cm4gaXNTdHJpY3QgP1xuICAgICAgKGxvY2FsZS5fZGF5T2ZNb250aE9yZGluYWxQYXJzZSB8fCBsb2NhbGUuX29yZGluYWxQYXJzZSkgOlxuICAgICAgbG9jYWxlLl9kYXlPZk1vbnRoT3JkaW5hbFBhcnNlTGVuaWVudDtcbn0pO1xuXG5hZGRQYXJzZVRva2VuKFsnRCcsICdERCddLCBEQVRFKTtcbmFkZFBhcnNlVG9rZW4oJ0RvJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W0RBVEVdID0gdG9JbnQoaW5wdXQubWF0Y2gobWF0Y2gxdG8yKVswXSwgMTApO1xufSk7XG5cbi8vIE1PTUVOVFNcblxudmFyIGdldFNldERheU9mTW9udGggPSBtYWtlR2V0U2V0KCdEYXRlJywgdHJ1ZSk7XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ0RERCcsIFsnRERERCcsIDNdLCAnREREbycsICdkYXlPZlllYXInKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ2RheU9mWWVhcicsICdEREQnKTtcblxuLy8gUFJJT1JJVFlcbmFkZFVuaXRQcmlvcml0eSgnZGF5T2ZZZWFyJywgNCk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignREREJywgIG1hdGNoMXRvMyk7XG5hZGRSZWdleFRva2VuKCdEREREJywgbWF0Y2gzKTtcbmFkZFBhcnNlVG9rZW4oWydEREQnLCAnRERERCddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICBjb25maWcuX2RheU9mWWVhciA9IHRvSW50KGlucHV0KTtcbn0pO1xuXG4vLyBIRUxQRVJTXG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gZ2V0U2V0RGF5T2ZZZWFyIChpbnB1dCkge1xuICAgIHZhciBkYXlPZlllYXIgPSBNYXRoLnJvdW5kKCh0aGlzLmNsb25lKCkuc3RhcnRPZignZGF5JykgLSB0aGlzLmNsb25lKCkuc3RhcnRPZigneWVhcicpKSAvIDg2NGU1KSArIDE7XG4gICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBkYXlPZlllYXIgOiB0aGlzLmFkZCgoaW5wdXQgLSBkYXlPZlllYXIpLCAnZCcpO1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdtJywgWydtbScsIDJdLCAwLCAnbWludXRlJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdtaW51dGUnLCAnbScpO1xuXG4vLyBQUklPUklUWVxuXG5hZGRVbml0UHJpb3JpdHkoJ21pbnV0ZScsIDE0KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdtJywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdtbScsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFBhcnNlVG9rZW4oWydtJywgJ21tJ10sIE1JTlVURSk7XG5cbi8vIE1PTUVOVFNcblxudmFyIGdldFNldE1pbnV0ZSA9IG1ha2VHZXRTZXQoJ01pbnV0ZXMnLCBmYWxzZSk7XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ3MnLCBbJ3NzJywgMl0sIDAsICdzZWNvbmQnKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ3NlY29uZCcsICdzJyk7XG5cbi8vIFBSSU9SSVRZXG5cbmFkZFVuaXRQcmlvcml0eSgnc2Vjb25kJywgMTUpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ3MnLCAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ3NzJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUGFyc2VUb2tlbihbJ3MnLCAnc3MnXSwgU0VDT05EKTtcblxuLy8gTU9NRU5UU1xuXG52YXIgZ2V0U2V0U2Vjb25kID0gbWFrZUdldFNldCgnU2Vjb25kcycsIGZhbHNlKTtcblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignUycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gfn4odGhpcy5taWxsaXNlY29uZCgpIC8gMTAwKTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTJywgMl0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gfn4odGhpcy5taWxsaXNlY29uZCgpIC8gMTApO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTJywgM10sIDAsICdtaWxsaXNlY29uZCcpO1xuYWRkRm9ybWF0VG9rZW4oMCwgWydTU1NTJywgNF0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTA7XG59KTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1MnLCA1XSwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDA7XG59KTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1NTJywgNl0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDtcbn0pO1xuYWRkRm9ybWF0VG9rZW4oMCwgWydTU1NTU1NTJywgN10sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDA7XG59KTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1NTU1MnLCA4XSwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDAwMDA7XG59KTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1NTU1NTJywgOV0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDAwMDtcbn0pO1xuXG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdtaWxsaXNlY29uZCcsICdtcycpO1xuXG4vLyBQUklPUklUWVxuXG5hZGRVbml0UHJpb3JpdHkoJ21pbGxpc2Vjb25kJywgMTYpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ1MnLCAgICBtYXRjaDF0bzMsIG1hdGNoMSk7XG5hZGRSZWdleFRva2VuKCdTUycsICAgbWF0Y2gxdG8zLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignU1NTJywgIG1hdGNoMXRvMywgbWF0Y2gzKTtcblxudmFyIHRva2VuO1xuZm9yICh0b2tlbiA9ICdTU1NTJzsgdG9rZW4ubGVuZ3RoIDw9IDk7IHRva2VuICs9ICdTJykge1xuICAgIGFkZFJlZ2V4VG9rZW4odG9rZW4sIG1hdGNoVW5zaWduZWQpO1xufVxuXG5mdW5jdGlvbiBwYXJzZU1zKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W01JTExJU0VDT05EXSA9IHRvSW50KCgnMC4nICsgaW5wdXQpICogMTAwMCk7XG59XG5cbmZvciAodG9rZW4gPSAnUyc7IHRva2VuLmxlbmd0aCA8PSA5OyB0b2tlbiArPSAnUycpIHtcbiAgICBhZGRQYXJzZVRva2VuKHRva2VuLCBwYXJzZU1zKTtcbn1cbi8vIE1PTUVOVFNcblxudmFyIGdldFNldE1pbGxpc2Vjb25kID0gbWFrZUdldFNldCgnTWlsbGlzZWNvbmRzJywgZmFsc2UpO1xuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCd6JywgIDAsIDAsICd6b25lQWJicicpO1xuYWRkRm9ybWF0VG9rZW4oJ3p6JywgMCwgMCwgJ3pvbmVOYW1lJyk7XG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gZ2V0Wm9uZUFiYnIgKCkge1xuICAgIHJldHVybiB0aGlzLl9pc1VUQyA/ICdVVEMnIDogJyc7XG59XG5cbmZ1bmN0aW9uIGdldFpvbmVOYW1lICgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNVVEMgPyAnQ29vcmRpbmF0ZWQgVW5pdmVyc2FsIFRpbWUnIDogJyc7XG59XG5cbnZhciBwcm90byA9IE1vbWVudC5wcm90b3R5cGU7XG5cbnByb3RvLmFkZCAgICAgICAgICAgICAgID0gYWRkO1xucHJvdG8uY2FsZW5kYXIgICAgICAgICAgPSBjYWxlbmRhciQxO1xucHJvdG8uY2xvbmUgICAgICAgICAgICAgPSBjbG9uZTtcbnByb3RvLmRpZmYgICAgICAgICAgICAgID0gZGlmZjtcbnByb3RvLmVuZE9mICAgICAgICAgICAgID0gZW5kT2Y7XG5wcm90by5mb3JtYXQgICAgICAgICAgICA9IGZvcm1hdDtcbnByb3RvLmZyb20gICAgICAgICAgICAgID0gZnJvbTtcbnByb3RvLmZyb21Ob3cgICAgICAgICAgID0gZnJvbU5vdztcbnByb3RvLnRvICAgICAgICAgICAgICAgID0gdG87XG5wcm90by50b05vdyAgICAgICAgICAgICA9IHRvTm93O1xucHJvdG8uZ2V0ICAgICAgICAgICAgICAgPSBzdHJpbmdHZXQ7XG5wcm90by5pbnZhbGlkQXQgICAgICAgICA9IGludmFsaWRBdDtcbnByb3RvLmlzQWZ0ZXIgICAgICAgICAgID0gaXNBZnRlcjtcbnByb3RvLmlzQmVmb3JlICAgICAgICAgID0gaXNCZWZvcmU7XG5wcm90by5pc0JldHdlZW4gICAgICAgICA9IGlzQmV0d2VlbjtcbnByb3RvLmlzU2FtZSAgICAgICAgICAgID0gaXNTYW1lO1xucHJvdG8uaXNTYW1lT3JBZnRlciAgICAgPSBpc1NhbWVPckFmdGVyO1xucHJvdG8uaXNTYW1lT3JCZWZvcmUgICAgPSBpc1NhbWVPckJlZm9yZTtcbnByb3RvLmlzVmFsaWQgICAgICAgICAgID0gaXNWYWxpZCQyO1xucHJvdG8ubGFuZyAgICAgICAgICAgICAgPSBsYW5nO1xucHJvdG8ubG9jYWxlICAgICAgICAgICAgPSBsb2NhbGU7XG5wcm90by5sb2NhbGVEYXRhICAgICAgICA9IGxvY2FsZURhdGE7XG5wcm90by5tYXggICAgICAgICAgICAgICA9IHByb3RvdHlwZU1heDtcbnByb3RvLm1pbiAgICAgICAgICAgICAgID0gcHJvdG90eXBlTWluO1xucHJvdG8ucGFyc2luZ0ZsYWdzICAgICAgPSBwYXJzaW5nRmxhZ3M7XG5wcm90by5zZXQgICAgICAgICAgICAgICA9IHN0cmluZ1NldDtcbnByb3RvLnN0YXJ0T2YgICAgICAgICAgID0gc3RhcnRPZjtcbnByb3RvLnN1YnRyYWN0ICAgICAgICAgID0gc3VidHJhY3Q7XG5wcm90by50b0FycmF5ICAgICAgICAgICA9IHRvQXJyYXk7XG5wcm90by50b09iamVjdCAgICAgICAgICA9IHRvT2JqZWN0O1xucHJvdG8udG9EYXRlICAgICAgICAgICAgPSB0b0RhdGU7XG5wcm90by50b0lTT1N0cmluZyAgICAgICA9IHRvSVNPU3RyaW5nO1xucHJvdG8uaW5zcGVjdCAgICAgICAgICAgPSBpbnNwZWN0O1xucHJvdG8udG9KU09OICAgICAgICAgICAgPSB0b0pTT047XG5wcm90by50b1N0cmluZyAgICAgICAgICA9IHRvU3RyaW5nO1xucHJvdG8udW5peCAgICAgICAgICAgICAgPSB1bml4O1xucHJvdG8udmFsdWVPZiAgICAgICAgICAgPSB2YWx1ZU9mO1xucHJvdG8uY3JlYXRpb25EYXRhICAgICAgPSBjcmVhdGlvbkRhdGE7XG5cbi8vIFllYXJcbnByb3RvLnllYXIgICAgICAgPSBnZXRTZXRZZWFyO1xucHJvdG8uaXNMZWFwWWVhciA9IGdldElzTGVhcFllYXI7XG5cbi8vIFdlZWsgWWVhclxucHJvdG8ud2Vla1llYXIgICAgPSBnZXRTZXRXZWVrWWVhcjtcbnByb3RvLmlzb1dlZWtZZWFyID0gZ2V0U2V0SVNPV2Vla1llYXI7XG5cbi8vIFF1YXJ0ZXJcbnByb3RvLnF1YXJ0ZXIgPSBwcm90by5xdWFydGVycyA9IGdldFNldFF1YXJ0ZXI7XG5cbi8vIE1vbnRoXG5wcm90by5tb250aCAgICAgICA9IGdldFNldE1vbnRoO1xucHJvdG8uZGF5c0luTW9udGggPSBnZXREYXlzSW5Nb250aDtcblxuLy8gV2Vla1xucHJvdG8ud2VlayAgICAgICAgICAgPSBwcm90by53ZWVrcyAgICAgICAgPSBnZXRTZXRXZWVrO1xucHJvdG8uaXNvV2VlayAgICAgICAgPSBwcm90by5pc29XZWVrcyAgICAgPSBnZXRTZXRJU09XZWVrO1xucHJvdG8ud2Vla3NJblllYXIgICAgPSBnZXRXZWVrc0luWWVhcjtcbnByb3RvLmlzb1dlZWtzSW5ZZWFyID0gZ2V0SVNPV2Vla3NJblllYXI7XG5cbi8vIERheVxucHJvdG8uZGF0ZSAgICAgICA9IGdldFNldERheU9mTW9udGg7XG5wcm90by5kYXkgICAgICAgID0gcHJvdG8uZGF5cyAgICAgICAgICAgICA9IGdldFNldERheU9mV2VlaztcbnByb3RvLndlZWtkYXkgICAgPSBnZXRTZXRMb2NhbGVEYXlPZldlZWs7XG5wcm90by5pc29XZWVrZGF5ID0gZ2V0U2V0SVNPRGF5T2ZXZWVrO1xucHJvdG8uZGF5T2ZZZWFyICA9IGdldFNldERheU9mWWVhcjtcblxuLy8gSG91clxucHJvdG8uaG91ciA9IHByb3RvLmhvdXJzID0gZ2V0U2V0SG91cjtcblxuLy8gTWludXRlXG5wcm90by5taW51dGUgPSBwcm90by5taW51dGVzID0gZ2V0U2V0TWludXRlO1xuXG4vLyBTZWNvbmRcbnByb3RvLnNlY29uZCA9IHByb3RvLnNlY29uZHMgPSBnZXRTZXRTZWNvbmQ7XG5cbi8vIE1pbGxpc2Vjb25kXG5wcm90by5taWxsaXNlY29uZCA9IHByb3RvLm1pbGxpc2Vjb25kcyA9IGdldFNldE1pbGxpc2Vjb25kO1xuXG4vLyBPZmZzZXRcbnByb3RvLnV0Y09mZnNldCAgICAgICAgICAgID0gZ2V0U2V0T2Zmc2V0O1xucHJvdG8udXRjICAgICAgICAgICAgICAgICAgPSBzZXRPZmZzZXRUb1VUQztcbnByb3RvLmxvY2FsICAgICAgICAgICAgICAgID0gc2V0T2Zmc2V0VG9Mb2NhbDtcbnByb3RvLnBhcnNlWm9uZSAgICAgICAgICAgID0gc2V0T2Zmc2V0VG9QYXJzZWRPZmZzZXQ7XG5wcm90by5oYXNBbGlnbmVkSG91ck9mZnNldCA9IGhhc0FsaWduZWRIb3VyT2Zmc2V0O1xucHJvdG8uaXNEU1QgICAgICAgICAgICAgICAgPSBpc0RheWxpZ2h0U2F2aW5nVGltZTtcbnByb3RvLmlzTG9jYWwgICAgICAgICAgICAgID0gaXNMb2NhbDtcbnByb3RvLmlzVXRjT2Zmc2V0ICAgICAgICAgID0gaXNVdGNPZmZzZXQ7XG5wcm90by5pc1V0YyAgICAgICAgICAgICAgICA9IGlzVXRjO1xucHJvdG8uaXNVVEMgICAgICAgICAgICAgICAgPSBpc1V0YztcblxuLy8gVGltZXpvbmVcbnByb3RvLnpvbmVBYmJyID0gZ2V0Wm9uZUFiYnI7XG5wcm90by56b25lTmFtZSA9IGdldFpvbmVOYW1lO1xuXG4vLyBEZXByZWNhdGlvbnNcbnByb3RvLmRhdGVzICA9IGRlcHJlY2F0ZSgnZGF0ZXMgYWNjZXNzb3IgaXMgZGVwcmVjYXRlZC4gVXNlIGRhdGUgaW5zdGVhZC4nLCBnZXRTZXREYXlPZk1vbnRoKTtcbnByb3RvLm1vbnRocyA9IGRlcHJlY2F0ZSgnbW9udGhzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb250aCBpbnN0ZWFkJywgZ2V0U2V0TW9udGgpO1xucHJvdG8ueWVhcnMgID0gZGVwcmVjYXRlKCd5ZWFycyBhY2Nlc3NvciBpcyBkZXByZWNhdGVkLiBVc2UgeWVhciBpbnN0ZWFkJywgZ2V0U2V0WWVhcik7XG5wcm90by56b25lICAgPSBkZXByZWNhdGUoJ21vbWVudCgpLnpvbmUgaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudCgpLnV0Y09mZnNldCBpbnN0ZWFkLiBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL3pvbmUvJywgZ2V0U2V0Wm9uZSk7XG5wcm90by5pc0RTVFNoaWZ0ZWQgPSBkZXByZWNhdGUoJ2lzRFNUU2hpZnRlZCBpcyBkZXByZWNhdGVkLiBTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9kc3Qtc2hpZnRlZC8gZm9yIG1vcmUgaW5mb3JtYXRpb24nLCBpc0RheWxpZ2h0U2F2aW5nVGltZVNoaWZ0ZWQpO1xuXG5mdW5jdGlvbiBjcmVhdGVVbml4IChpbnB1dCkge1xuICAgIHJldHVybiBjcmVhdGVMb2NhbChpbnB1dCAqIDEwMDApO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVJblpvbmUgKCkge1xuICAgIHJldHVybiBjcmVhdGVMb2NhbC5hcHBseShudWxsLCBhcmd1bWVudHMpLnBhcnNlWm9uZSgpO1xufVxuXG5mdW5jdGlvbiBwcmVQYXJzZVBvc3RGb3JtYXQgKHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbnZhciBwcm90byQxID0gTG9jYWxlLnByb3RvdHlwZTtcblxucHJvdG8kMS5jYWxlbmRhciAgICAgICAgPSBjYWxlbmRhcjtcbnByb3RvJDEubG9uZ0RhdGVGb3JtYXQgID0gbG9uZ0RhdGVGb3JtYXQ7XG5wcm90byQxLmludmFsaWREYXRlICAgICA9IGludmFsaWREYXRlO1xucHJvdG8kMS5vcmRpbmFsICAgICAgICAgPSBvcmRpbmFsO1xucHJvdG8kMS5wcmVwYXJzZSAgICAgICAgPSBwcmVQYXJzZVBvc3RGb3JtYXQ7XG5wcm90byQxLnBvc3Rmb3JtYXQgICAgICA9IHByZVBhcnNlUG9zdEZvcm1hdDtcbnByb3RvJDEucmVsYXRpdmVUaW1lICAgID0gcmVsYXRpdmVUaW1lO1xucHJvdG8kMS5wYXN0RnV0dXJlICAgICAgPSBwYXN0RnV0dXJlO1xucHJvdG8kMS5zZXQgICAgICAgICAgICAgPSBzZXQ7XG5cbi8vIE1vbnRoXG5wcm90byQxLm1vbnRocyAgICAgICAgICAgID0gICAgICAgIGxvY2FsZU1vbnRocztcbnByb3RvJDEubW9udGhzU2hvcnQgICAgICAgPSAgICAgICAgbG9jYWxlTW9udGhzU2hvcnQ7XG5wcm90byQxLm1vbnRoc1BhcnNlICAgICAgID0gICAgICAgIGxvY2FsZU1vbnRoc1BhcnNlO1xucHJvdG8kMS5tb250aHNSZWdleCAgICAgICA9IG1vbnRoc1JlZ2V4O1xucHJvdG8kMS5tb250aHNTaG9ydFJlZ2V4ICA9IG1vbnRoc1Nob3J0UmVnZXg7XG5cbi8vIFdlZWtcbnByb3RvJDEud2VlayA9IGxvY2FsZVdlZWs7XG5wcm90byQxLmZpcnN0RGF5T2ZZZWFyID0gbG9jYWxlRmlyc3REYXlPZlllYXI7XG5wcm90byQxLmZpcnN0RGF5T2ZXZWVrID0gbG9jYWxlRmlyc3REYXlPZldlZWs7XG5cbi8vIERheSBvZiBXZWVrXG5wcm90byQxLndlZWtkYXlzICAgICAgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzO1xucHJvdG8kMS53ZWVrZGF5c01pbiAgICA9ICAgICAgICBsb2NhbGVXZWVrZGF5c01pbjtcbnByb3RvJDEud2Vla2RheXNTaG9ydCAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNTaG9ydDtcbnByb3RvJDEud2Vla2RheXNQYXJzZSAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNQYXJzZTtcblxucHJvdG8kMS53ZWVrZGF5c1JlZ2V4ICAgICAgID0gICAgICAgIHdlZWtkYXlzUmVnZXg7XG5wcm90byQxLndlZWtkYXlzU2hvcnRSZWdleCAgPSAgICAgICAgd2Vla2RheXNTaG9ydFJlZ2V4O1xucHJvdG8kMS53ZWVrZGF5c01pblJlZ2V4ICAgID0gICAgICAgIHdlZWtkYXlzTWluUmVnZXg7XG5cbi8vIEhvdXJzXG5wcm90byQxLmlzUE0gPSBsb2NhbGVJc1BNO1xucHJvdG8kMS5tZXJpZGllbSA9IGxvY2FsZU1lcmlkaWVtO1xuXG5mdW5jdGlvbiBnZXQkMSAoZm9ybWF0LCBpbmRleCwgZmllbGQsIHNldHRlcikge1xuICAgIHZhciBsb2NhbGUgPSBnZXRMb2NhbGUoKTtcbiAgICB2YXIgdXRjID0gY3JlYXRlVVRDKCkuc2V0KHNldHRlciwgaW5kZXgpO1xuICAgIHJldHVybiBsb2NhbGVbZmllbGRdKHV0YywgZm9ybWF0KTtcbn1cblxuZnVuY3Rpb24gbGlzdE1vbnRoc0ltcGwgKGZvcm1hdCwgaW5kZXgsIGZpZWxkKSB7XG4gICAgaWYgKGlzTnVtYmVyKGZvcm1hdCkpIHtcbiAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgIGZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJyc7XG5cbiAgICBpZiAoaW5kZXggIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZ2V0JDEoZm9ybWF0LCBpbmRleCwgZmllbGQsICdtb250aCcpO1xuICAgIH1cblxuICAgIHZhciBpO1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICBvdXRbaV0gPSBnZXQkMShmb3JtYXQsIGksIGZpZWxkLCAnbW9udGgnKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLy8gKClcbi8vICg1KVxuLy8gKGZtdCwgNSlcbi8vIChmbXQpXG4vLyAodHJ1ZSlcbi8vICh0cnVlLCA1KVxuLy8gKHRydWUsIGZtdCwgNSlcbi8vICh0cnVlLCBmbXQpXG5mdW5jdGlvbiBsaXN0V2Vla2RheXNJbXBsIChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgsIGZpZWxkKSB7XG4gICAgaWYgKHR5cGVvZiBsb2NhbGVTb3J0ZWQgPT09ICdib29sZWFuJykge1xuICAgICAgICBpZiAoaXNOdW1iZXIoZm9ybWF0KSkge1xuICAgICAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJyc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9ybWF0ID0gbG9jYWxlU29ydGVkO1xuICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgbG9jYWxlU29ydGVkID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGlzTnVtYmVyKGZvcm1hdCkpIHtcbiAgICAgICAgICAgIGluZGV4ID0gZm9ybWF0O1xuICAgICAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8ICcnO1xuICAgIH1cblxuICAgIHZhciBsb2NhbGUgPSBnZXRMb2NhbGUoKSxcbiAgICAgICAgc2hpZnQgPSBsb2NhbGVTb3J0ZWQgPyBsb2NhbGUuX3dlZWsuZG93IDogMDtcblxuICAgIGlmIChpbmRleCAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBnZXQkMShmb3JtYXQsIChpbmRleCArIHNoaWZ0KSAlIDcsIGZpZWxkLCAnZGF5Jyk7XG4gICAgfVxuXG4gICAgdmFyIGk7XG4gICAgdmFyIG91dCA9IFtdO1xuICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgb3V0W2ldID0gZ2V0JDEoZm9ybWF0LCAoaSArIHNoaWZ0KSAlIDcsIGZpZWxkLCAnZGF5Jyk7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGxpc3RNb250aHMgKGZvcm1hdCwgaW5kZXgpIHtcbiAgICByZXR1cm4gbGlzdE1vbnRoc0ltcGwoZm9ybWF0LCBpbmRleCwgJ21vbnRocycpO1xufVxuXG5mdW5jdGlvbiBsaXN0TW9udGhzU2hvcnQgKGZvcm1hdCwgaW5kZXgpIHtcbiAgICByZXR1cm4gbGlzdE1vbnRoc0ltcGwoZm9ybWF0LCBpbmRleCwgJ21vbnRoc1Nob3J0Jyk7XG59XG5cbmZ1bmN0aW9uIGxpc3RXZWVrZGF5cyAobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGxpc3RXZWVrZGF5c0ltcGwobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4LCAnd2Vla2RheXMnKTtcbn1cblxuZnVuY3Rpb24gbGlzdFdlZWtkYXlzU2hvcnQgKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCkge1xuICAgIHJldHVybiBsaXN0V2Vla2RheXNJbXBsKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCwgJ3dlZWtkYXlzU2hvcnQnKTtcbn1cblxuZnVuY3Rpb24gbGlzdFdlZWtkYXlzTWluIChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgpIHtcbiAgICByZXR1cm4gbGlzdFdlZWtkYXlzSW1wbChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgsICd3ZWVrZGF5c01pbicpO1xufVxuXG5nZXRTZXRHbG9iYWxMb2NhbGUoJ2VuJywge1xuICAgIGRheU9mTW9udGhPcmRpbmFsUGFyc2U6IC9cXGR7MSwyfSh0aHxzdHxuZHxyZCkvLFxuICAgIG9yZGluYWwgOiBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICAgIHZhciBiID0gbnVtYmVyICUgMTAsXG4gICAgICAgICAgICBvdXRwdXQgPSAodG9JbnQobnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/ICd0aCcgOlxuICAgICAgICAgICAgKGIgPT09IDEpID8gJ3N0JyA6XG4gICAgICAgICAgICAoYiA9PT0gMikgPyAnbmQnIDpcbiAgICAgICAgICAgIChiID09PSAzKSA/ICdyZCcgOiAndGgnO1xuICAgICAgICByZXR1cm4gbnVtYmVyICsgb3V0cHV0O1xuICAgIH1cbn0pO1xuXG4vLyBTaWRlIGVmZmVjdCBpbXBvcnRzXG5ob29rcy5sYW5nID0gZGVwcmVjYXRlKCdtb21lbnQubGFuZyBpcyBkZXByZWNhdGVkLiBVc2UgbW9tZW50LmxvY2FsZSBpbnN0ZWFkLicsIGdldFNldEdsb2JhbExvY2FsZSk7XG5ob29rcy5sYW5nRGF0YSA9IGRlcHJlY2F0ZSgnbW9tZW50LmxhbmdEYXRhIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb21lbnQubG9jYWxlRGF0YSBpbnN0ZWFkLicsIGdldExvY2FsZSk7XG5cbnZhciBtYXRoQWJzID0gTWF0aC5hYnM7XG5cbmZ1bmN0aW9uIGFicyAoKSB7XG4gICAgdmFyIGRhdGEgICAgICAgICAgID0gdGhpcy5fZGF0YTtcblxuICAgIHRoaXMuX21pbGxpc2Vjb25kcyA9IG1hdGhBYnModGhpcy5fbWlsbGlzZWNvbmRzKTtcbiAgICB0aGlzLl9kYXlzICAgICAgICAgPSBtYXRoQWJzKHRoaXMuX2RheXMpO1xuICAgIHRoaXMuX21vbnRocyAgICAgICA9IG1hdGhBYnModGhpcy5fbW9udGhzKTtcblxuICAgIGRhdGEubWlsbGlzZWNvbmRzICA9IG1hdGhBYnMoZGF0YS5taWxsaXNlY29uZHMpO1xuICAgIGRhdGEuc2Vjb25kcyAgICAgICA9IG1hdGhBYnMoZGF0YS5zZWNvbmRzKTtcbiAgICBkYXRhLm1pbnV0ZXMgICAgICAgPSBtYXRoQWJzKGRhdGEubWludXRlcyk7XG4gICAgZGF0YS5ob3VycyAgICAgICAgID0gbWF0aEFicyhkYXRhLmhvdXJzKTtcbiAgICBkYXRhLm1vbnRocyAgICAgICAgPSBtYXRoQWJzKGRhdGEubW9udGhzKTtcbiAgICBkYXRhLnllYXJzICAgICAgICAgPSBtYXRoQWJzKGRhdGEueWVhcnMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIGFkZFN1YnRyYWN0JDEgKGR1cmF0aW9uLCBpbnB1dCwgdmFsdWUsIGRpcmVjdGlvbikge1xuICAgIHZhciBvdGhlciA9IGNyZWF0ZUR1cmF0aW9uKGlucHV0LCB2YWx1ZSk7XG5cbiAgICBkdXJhdGlvbi5fbWlsbGlzZWNvbmRzICs9IGRpcmVjdGlvbiAqIG90aGVyLl9taWxsaXNlY29uZHM7XG4gICAgZHVyYXRpb24uX2RheXMgICAgICAgICArPSBkaXJlY3Rpb24gKiBvdGhlci5fZGF5cztcbiAgICBkdXJhdGlvbi5fbW9udGhzICAgICAgICs9IGRpcmVjdGlvbiAqIG90aGVyLl9tb250aHM7XG5cbiAgICByZXR1cm4gZHVyYXRpb24uX2J1YmJsZSgpO1xufVxuXG4vLyBzdXBwb3J0cyBvbmx5IDIuMC1zdHlsZSBhZGQoMSwgJ3MnKSBvciBhZGQoZHVyYXRpb24pXG5mdW5jdGlvbiBhZGQkMSAoaW5wdXQsIHZhbHVlKSB7XG4gICAgcmV0dXJuIGFkZFN1YnRyYWN0JDEodGhpcywgaW5wdXQsIHZhbHVlLCAxKTtcbn1cblxuLy8gc3VwcG9ydHMgb25seSAyLjAtc3R5bGUgc3VidHJhY3QoMSwgJ3MnKSBvciBzdWJ0cmFjdChkdXJhdGlvbilcbmZ1bmN0aW9uIHN1YnRyYWN0JDEgKGlucHV0LCB2YWx1ZSkge1xuICAgIHJldHVybiBhZGRTdWJ0cmFjdCQxKHRoaXMsIGlucHV0LCB2YWx1ZSwgLTEpO1xufVxuXG5mdW5jdGlvbiBhYnNDZWlsIChudW1iZXIpIHtcbiAgICBpZiAobnVtYmVyIDwgMCkge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJ1YmJsZSAoKSB7XG4gICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcztcbiAgICB2YXIgZGF5cyAgICAgICAgID0gdGhpcy5fZGF5cztcbiAgICB2YXIgbW9udGhzICAgICAgID0gdGhpcy5fbW9udGhzO1xuICAgIHZhciBkYXRhICAgICAgICAgPSB0aGlzLl9kYXRhO1xuICAgIHZhciBzZWNvbmRzLCBtaW51dGVzLCBob3VycywgeWVhcnMsIG1vbnRoc0Zyb21EYXlzO1xuXG4gICAgLy8gaWYgd2UgaGF2ZSBhIG1peCBvZiBwb3NpdGl2ZSBhbmQgbmVnYXRpdmUgdmFsdWVzLCBidWJibGUgZG93biBmaXJzdFxuICAgIC8vIGNoZWNrOiBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMjE2NlxuICAgIGlmICghKChtaWxsaXNlY29uZHMgPj0gMCAmJiBkYXlzID49IDAgJiYgbW9udGhzID49IDApIHx8XG4gICAgICAgICAgICAobWlsbGlzZWNvbmRzIDw9IDAgJiYgZGF5cyA8PSAwICYmIG1vbnRocyA8PSAwKSkpIHtcbiAgICAgICAgbWlsbGlzZWNvbmRzICs9IGFic0NlaWwobW9udGhzVG9EYXlzKG1vbnRocykgKyBkYXlzKSAqIDg2NGU1O1xuICAgICAgICBkYXlzID0gMDtcbiAgICAgICAgbW9udGhzID0gMDtcbiAgICB9XG5cbiAgICAvLyBUaGUgZm9sbG93aW5nIGNvZGUgYnViYmxlcyB1cCB2YWx1ZXMsIHNlZSB0aGUgdGVzdHMgZm9yXG4gICAgLy8gZXhhbXBsZXMgb2Ygd2hhdCB0aGF0IG1lYW5zLlxuICAgIGRhdGEubWlsbGlzZWNvbmRzID0gbWlsbGlzZWNvbmRzICUgMTAwMDtcblxuICAgIHNlY29uZHMgICAgICAgICAgID0gYWJzRmxvb3IobWlsbGlzZWNvbmRzIC8gMTAwMCk7XG4gICAgZGF0YS5zZWNvbmRzICAgICAgPSBzZWNvbmRzICUgNjA7XG5cbiAgICBtaW51dGVzICAgICAgICAgICA9IGFic0Zsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgZGF0YS5taW51dGVzICAgICAgPSBtaW51dGVzICUgNjA7XG5cbiAgICBob3VycyAgICAgICAgICAgICA9IGFic0Zsb29yKG1pbnV0ZXMgLyA2MCk7XG4gICAgZGF0YS5ob3VycyAgICAgICAgPSBob3VycyAlIDI0O1xuXG4gICAgZGF5cyArPSBhYnNGbG9vcihob3VycyAvIDI0KTtcblxuICAgIC8vIGNvbnZlcnQgZGF5cyB0byBtb250aHNcbiAgICBtb250aHNGcm9tRGF5cyA9IGFic0Zsb29yKGRheXNUb01vbnRocyhkYXlzKSk7XG4gICAgbW9udGhzICs9IG1vbnRoc0Zyb21EYXlzO1xuICAgIGRheXMgLT0gYWJzQ2VpbChtb250aHNUb0RheXMobW9udGhzRnJvbURheXMpKTtcblxuICAgIC8vIDEyIG1vbnRocyAtPiAxIHllYXJcbiAgICB5ZWFycyA9IGFic0Zsb29yKG1vbnRocyAvIDEyKTtcbiAgICBtb250aHMgJT0gMTI7XG5cbiAgICBkYXRhLmRheXMgICA9IGRheXM7XG4gICAgZGF0YS5tb250aHMgPSBtb250aHM7XG4gICAgZGF0YS55ZWFycyAgPSB5ZWFycztcblxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBkYXlzVG9Nb250aHMgKGRheXMpIHtcbiAgICAvLyA0MDAgeWVhcnMgaGF2ZSAxNDYwOTcgZGF5cyAodGFraW5nIGludG8gYWNjb3VudCBsZWFwIHllYXIgcnVsZXMpXG4gICAgLy8gNDAwIHllYXJzIGhhdmUgMTIgbW9udGhzID09PSA0ODAwXG4gICAgcmV0dXJuIGRheXMgKiA0ODAwIC8gMTQ2MDk3O1xufVxuXG5mdW5jdGlvbiBtb250aHNUb0RheXMgKG1vbnRocykge1xuICAgIC8vIHRoZSByZXZlcnNlIG9mIGRheXNUb01vbnRoc1xuICAgIHJldHVybiBtb250aHMgKiAxNDYwOTcgLyA0ODAwO1xufVxuXG5mdW5jdGlvbiBhcyAodW5pdHMpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBOYU47XG4gICAgfVxuICAgIHZhciBkYXlzO1xuICAgIHZhciBtb250aHM7XG4gICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcztcblxuICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuXG4gICAgaWYgKHVuaXRzID09PSAnbW9udGgnIHx8IHVuaXRzID09PSAneWVhcicpIHtcbiAgICAgICAgZGF5cyAgID0gdGhpcy5fZGF5cyAgICsgbWlsbGlzZWNvbmRzIC8gODY0ZTU7XG4gICAgICAgIG1vbnRocyA9IHRoaXMuX21vbnRocyArIGRheXNUb01vbnRocyhkYXlzKTtcbiAgICAgICAgcmV0dXJuIHVuaXRzID09PSAnbW9udGgnID8gbW9udGhzIDogbW9udGhzIC8gMTI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaGFuZGxlIG1pbGxpc2Vjb25kcyBzZXBhcmF0ZWx5IGJlY2F1c2Ugb2YgZmxvYXRpbmcgcG9pbnQgbWF0aCBlcnJvcnMgKGlzc3VlICMxODY3KVxuICAgICAgICBkYXlzID0gdGhpcy5fZGF5cyArIE1hdGgucm91bmQobW9udGhzVG9EYXlzKHRoaXMuX21vbnRocykpO1xuICAgICAgICBzd2l0Y2ggKHVuaXRzKSB7XG4gICAgICAgICAgICBjYXNlICd3ZWVrJyAgIDogcmV0dXJuIGRheXMgLyA3ICAgICArIG1pbGxpc2Vjb25kcyAvIDYwNDhlNTtcbiAgICAgICAgICAgIGNhc2UgJ2RheScgICAgOiByZXR1cm4gZGF5cyAgICAgICAgICsgbWlsbGlzZWNvbmRzIC8gODY0ZTU7XG4gICAgICAgICAgICBjYXNlICdob3VyJyAgIDogcmV0dXJuIGRheXMgKiAyNCAgICArIG1pbGxpc2Vjb25kcyAvIDM2ZTU7XG4gICAgICAgICAgICBjYXNlICdtaW51dGUnIDogcmV0dXJuIGRheXMgKiAxNDQwICArIG1pbGxpc2Vjb25kcyAvIDZlNDtcbiAgICAgICAgICAgIGNhc2UgJ3NlY29uZCcgOiByZXR1cm4gZGF5cyAqIDg2NDAwICsgbWlsbGlzZWNvbmRzIC8gMTAwMDtcbiAgICAgICAgICAgIC8vIE1hdGguZmxvb3IgcHJldmVudHMgZmxvYXRpbmcgcG9pbnQgbWF0aCBlcnJvcnMgaGVyZVxuICAgICAgICAgICAgY2FzZSAnbWlsbGlzZWNvbmQnOiByZXR1cm4gTWF0aC5mbG9vcihkYXlzICogODY0ZTUpICsgbWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIHVuaXQgJyArIHVuaXRzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gVE9ETzogVXNlIHRoaXMuYXMoJ21zJyk/XG5mdW5jdGlvbiB2YWx1ZU9mJDEgKCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzICtcbiAgICAgICAgdGhpcy5fZGF5cyAqIDg2NGU1ICtcbiAgICAgICAgKHRoaXMuX21vbnRocyAlIDEyKSAqIDI1OTJlNiArXG4gICAgICAgIHRvSW50KHRoaXMuX21vbnRocyAvIDEyKSAqIDMxNTM2ZTZcbiAgICApO1xufVxuXG5mdW5jdGlvbiBtYWtlQXMgKGFsaWFzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXMoYWxpYXMpO1xuICAgIH07XG59XG5cbnZhciBhc01pbGxpc2Vjb25kcyA9IG1ha2VBcygnbXMnKTtcbnZhciBhc1NlY29uZHMgICAgICA9IG1ha2VBcygncycpO1xudmFyIGFzTWludXRlcyAgICAgID0gbWFrZUFzKCdtJyk7XG52YXIgYXNIb3VycyAgICAgICAgPSBtYWtlQXMoJ2gnKTtcbnZhciBhc0RheXMgICAgICAgICA9IG1ha2VBcygnZCcpO1xudmFyIGFzV2Vla3MgICAgICAgID0gbWFrZUFzKCd3Jyk7XG52YXIgYXNNb250aHMgICAgICAgPSBtYWtlQXMoJ00nKTtcbnZhciBhc1llYXJzICAgICAgICA9IG1ha2VBcygneScpO1xuXG5mdW5jdGlvbiBnZXQkMiAodW5pdHMpIHtcbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzW3VuaXRzICsgJ3MnXSgpIDogTmFOO1xufVxuXG5mdW5jdGlvbiBtYWtlR2V0dGVyKG5hbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzLl9kYXRhW25hbWVdIDogTmFOO1xuICAgIH07XG59XG5cbnZhciBtaWxsaXNlY29uZHMgPSBtYWtlR2V0dGVyKCdtaWxsaXNlY29uZHMnKTtcbnZhciBzZWNvbmRzICAgICAgPSBtYWtlR2V0dGVyKCdzZWNvbmRzJyk7XG52YXIgbWludXRlcyAgICAgID0gbWFrZUdldHRlcignbWludXRlcycpO1xudmFyIGhvdXJzICAgICAgICA9IG1ha2VHZXR0ZXIoJ2hvdXJzJyk7XG52YXIgZGF5cyAgICAgICAgID0gbWFrZUdldHRlcignZGF5cycpO1xudmFyIG1vbnRocyAgICAgICA9IG1ha2VHZXR0ZXIoJ21vbnRocycpO1xudmFyIHllYXJzICAgICAgICA9IG1ha2VHZXR0ZXIoJ3llYXJzJyk7XG5cbmZ1bmN0aW9uIHdlZWtzICgpIHtcbiAgICByZXR1cm4gYWJzRmxvb3IodGhpcy5kYXlzKCkgLyA3KTtcbn1cblxudmFyIHJvdW5kID0gTWF0aC5yb3VuZDtcbnZhciB0aHJlc2hvbGRzID0ge1xuICAgIHNzOiA0NCwgICAgICAgICAvLyBhIGZldyBzZWNvbmRzIHRvIHNlY29uZHNcbiAgICBzIDogNDUsICAgICAgICAgLy8gc2Vjb25kcyB0byBtaW51dGVcbiAgICBtIDogNDUsICAgICAgICAgLy8gbWludXRlcyB0byBob3VyXG4gICAgaCA6IDIyLCAgICAgICAgIC8vIGhvdXJzIHRvIGRheVxuICAgIGQgOiAyNiwgICAgICAgICAvLyBkYXlzIHRvIG1vbnRoXG4gICAgTSA6IDExICAgICAgICAgIC8vIG1vbnRocyB0byB5ZWFyXG59O1xuXG4vLyBoZWxwZXIgZnVuY3Rpb24gZm9yIG1vbWVudC5mbi5mcm9tLCBtb21lbnQuZm4uZnJvbU5vdywgYW5kIG1vbWVudC5kdXJhdGlvbi5mbi5odW1hbml6ZVxuZnVuY3Rpb24gc3Vic3RpdHV0ZVRpbWVBZ28oc3RyaW5nLCBudW1iZXIsIHdpdGhvdXRTdWZmaXgsIGlzRnV0dXJlLCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLnJlbGF0aXZlVGltZShudW1iZXIgfHwgMSwgISF3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKTtcbn1cblxuZnVuY3Rpb24gcmVsYXRpdmVUaW1lJDEgKHBvc05lZ0R1cmF0aW9uLCB3aXRob3V0U3VmZml4LCBsb2NhbGUpIHtcbiAgICB2YXIgZHVyYXRpb24gPSBjcmVhdGVEdXJhdGlvbihwb3NOZWdEdXJhdGlvbikuYWJzKCk7XG4gICAgdmFyIHNlY29uZHMgID0gcm91bmQoZHVyYXRpb24uYXMoJ3MnKSk7XG4gICAgdmFyIG1pbnV0ZXMgID0gcm91bmQoZHVyYXRpb24uYXMoJ20nKSk7XG4gICAgdmFyIGhvdXJzICAgID0gcm91bmQoZHVyYXRpb24uYXMoJ2gnKSk7XG4gICAgdmFyIGRheXMgICAgID0gcm91bmQoZHVyYXRpb24uYXMoJ2QnKSk7XG4gICAgdmFyIG1vbnRocyAgID0gcm91bmQoZHVyYXRpb24uYXMoJ00nKSk7XG4gICAgdmFyIHllYXJzICAgID0gcm91bmQoZHVyYXRpb24uYXMoJ3knKSk7XG5cbiAgICB2YXIgYSA9IHNlY29uZHMgPD0gdGhyZXNob2xkcy5zcyAmJiBbJ3MnLCBzZWNvbmRzXSAgfHxcbiAgICAgICAgICAgIHNlY29uZHMgPCB0aHJlc2hvbGRzLnMgICAmJiBbJ3NzJywgc2Vjb25kc10gfHxcbiAgICAgICAgICAgIG1pbnV0ZXMgPD0gMSAgICAgICAgICAgICAmJiBbJ20nXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgIG1pbnV0ZXMgPCB0aHJlc2hvbGRzLm0gICAmJiBbJ21tJywgbWludXRlc10gfHxcbiAgICAgICAgICAgIGhvdXJzICAgPD0gMSAgICAgICAgICAgICAmJiBbJ2gnXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgIGhvdXJzICAgPCB0aHJlc2hvbGRzLmggICAmJiBbJ2hoJywgaG91cnNdICAgfHxcbiAgICAgICAgICAgIGRheXMgICAgPD0gMSAgICAgICAgICAgICAmJiBbJ2QnXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgIGRheXMgICAgPCB0aHJlc2hvbGRzLmQgICAmJiBbJ2RkJywgZGF5c10gICAgfHxcbiAgICAgICAgICAgIG1vbnRocyAgPD0gMSAgICAgICAgICAgICAmJiBbJ00nXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgIG1vbnRocyAgPCB0aHJlc2hvbGRzLk0gICAmJiBbJ01NJywgbW9udGhzXSAgfHxcbiAgICAgICAgICAgIHllYXJzICAgPD0gMSAgICAgICAgICAgICAmJiBbJ3knXSAgICAgICAgICAgfHwgWyd5eScsIHllYXJzXTtcblxuICAgIGFbMl0gPSB3aXRob3V0U3VmZml4O1xuICAgIGFbM10gPSArcG9zTmVnRHVyYXRpb24gPiAwO1xuICAgIGFbNF0gPSBsb2NhbGU7XG4gICAgcmV0dXJuIHN1YnN0aXR1dGVUaW1lQWdvLmFwcGx5KG51bGwsIGEpO1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gc2V0IHRoZSByb3VuZGluZyBmdW5jdGlvbiBmb3IgcmVsYXRpdmUgdGltZSBzdHJpbmdzXG5mdW5jdGlvbiBnZXRTZXRSZWxhdGl2ZVRpbWVSb3VuZGluZyAocm91bmRpbmdGdW5jdGlvbikge1xuICAgIGlmIChyb3VuZGluZ0Z1bmN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJvdW5kO1xuICAgIH1cbiAgICBpZiAodHlwZW9mKHJvdW5kaW5nRnVuY3Rpb24pID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJvdW5kID0gcm91bmRpbmdGdW5jdGlvbjtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIHNldCBhIHRocmVzaG9sZCBmb3IgcmVsYXRpdmUgdGltZSBzdHJpbmdzXG5mdW5jdGlvbiBnZXRTZXRSZWxhdGl2ZVRpbWVUaHJlc2hvbGQgKHRocmVzaG9sZCwgbGltaXQpIHtcbiAgICBpZiAodGhyZXNob2xkc1t0aHJlc2hvbGRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAobGltaXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdGhyZXNob2xkc1t0aHJlc2hvbGRdO1xuICAgIH1cbiAgICB0aHJlc2hvbGRzW3RocmVzaG9sZF0gPSBsaW1pdDtcbiAgICBpZiAodGhyZXNob2xkID09PSAncycpIHtcbiAgICAgICAgdGhyZXNob2xkcy5zcyA9IGxpbWl0IC0gMTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGh1bWFuaXplICh3aXRoU3VmZml4KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkuaW52YWxpZERhdGUoKTtcbiAgICB9XG5cbiAgICB2YXIgbG9jYWxlID0gdGhpcy5sb2NhbGVEYXRhKCk7XG4gICAgdmFyIG91dHB1dCA9IHJlbGF0aXZlVGltZSQxKHRoaXMsICF3aXRoU3VmZml4LCBsb2NhbGUpO1xuXG4gICAgaWYgKHdpdGhTdWZmaXgpIHtcbiAgICAgICAgb3V0cHV0ID0gbG9jYWxlLnBhc3RGdXR1cmUoK3RoaXMsIG91dHB1dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvY2FsZS5wb3N0Zm9ybWF0KG91dHB1dCk7XG59XG5cbnZhciBhYnMkMSA9IE1hdGguYWJzO1xuXG5mdW5jdGlvbiB0b0lTT1N0cmluZyQxKCkge1xuICAgIC8vIGZvciBJU08gc3RyaW5ncyB3ZSBkbyBub3QgdXNlIHRoZSBub3JtYWwgYnViYmxpbmcgcnVsZXM6XG4gICAgLy8gICogbWlsbGlzZWNvbmRzIGJ1YmJsZSB1cCB1bnRpbCB0aGV5IGJlY29tZSBob3Vyc1xuICAgIC8vICAqIGRheXMgZG8gbm90IGJ1YmJsZSBhdCBhbGxcbiAgICAvLyAgKiBtb250aHMgYnViYmxlIHVwIHVudGlsIHRoZXkgYmVjb21lIHllYXJzXG4gICAgLy8gVGhpcyBpcyBiZWNhdXNlIHRoZXJlIGlzIG5vIGNvbnRleHQtZnJlZSBjb252ZXJzaW9uIGJldHdlZW4gaG91cnMgYW5kIGRheXNcbiAgICAvLyAodGhpbmsgb2YgY2xvY2sgY2hhbmdlcylcbiAgICAvLyBhbmQgYWxzbyBub3QgYmV0d2VlbiBkYXlzIGFuZCBtb250aHMgKDI4LTMxIGRheXMgcGVyIG1vbnRoKVxuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgfVxuXG4gICAgdmFyIHNlY29uZHMgPSBhYnMkMSh0aGlzLl9taWxsaXNlY29uZHMpIC8gMTAwMDtcbiAgICB2YXIgZGF5cyAgICAgICAgID0gYWJzJDEodGhpcy5fZGF5cyk7XG4gICAgdmFyIG1vbnRocyAgICAgICA9IGFicyQxKHRoaXMuX21vbnRocyk7XG4gICAgdmFyIG1pbnV0ZXMsIGhvdXJzLCB5ZWFycztcblxuICAgIC8vIDM2MDAgc2Vjb25kcyAtPiA2MCBtaW51dGVzIC0+IDEgaG91clxuICAgIG1pbnV0ZXMgICAgICAgICAgID0gYWJzRmxvb3Ioc2Vjb25kcyAvIDYwKTtcbiAgICBob3VycyAgICAgICAgICAgICA9IGFic0Zsb29yKG1pbnV0ZXMgLyA2MCk7XG4gICAgc2Vjb25kcyAlPSA2MDtcbiAgICBtaW51dGVzICU9IDYwO1xuXG4gICAgLy8gMTIgbW9udGhzIC0+IDEgeWVhclxuICAgIHllYXJzICA9IGFic0Zsb29yKG1vbnRocyAvIDEyKTtcbiAgICBtb250aHMgJT0gMTI7XG5cblxuICAgIC8vIGluc3BpcmVkIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9kb3JkaWxsZS9tb21lbnQtaXNvZHVyYXRpb24vYmxvYi9tYXN0ZXIvbW9tZW50Lmlzb2R1cmF0aW9uLmpzXG4gICAgdmFyIFkgPSB5ZWFycztcbiAgICB2YXIgTSA9IG1vbnRocztcbiAgICB2YXIgRCA9IGRheXM7XG4gICAgdmFyIGggPSBob3VycztcbiAgICB2YXIgbSA9IG1pbnV0ZXM7XG4gICAgdmFyIHMgPSBzZWNvbmRzO1xuICAgIHZhciB0b3RhbCA9IHRoaXMuYXNTZWNvbmRzKCk7XG5cbiAgICBpZiAoIXRvdGFsKSB7XG4gICAgICAgIC8vIHRoaXMgaXMgdGhlIHNhbWUgYXMgQyMncyAoTm9kYSkgYW5kIHB5dGhvbiAoaXNvZGF0ZSkuLi5cbiAgICAgICAgLy8gYnV0IG5vdCBvdGhlciBKUyAoZ29vZy5kYXRlKVxuICAgICAgICByZXR1cm4gJ1AwRCc7XG4gICAgfVxuXG4gICAgcmV0dXJuICh0b3RhbCA8IDAgPyAnLScgOiAnJykgK1xuICAgICAgICAnUCcgK1xuICAgICAgICAoWSA/IFkgKyAnWScgOiAnJykgK1xuICAgICAgICAoTSA/IE0gKyAnTScgOiAnJykgK1xuICAgICAgICAoRCA/IEQgKyAnRCcgOiAnJykgK1xuICAgICAgICAoKGggfHwgbSB8fCBzKSA/ICdUJyA6ICcnKSArXG4gICAgICAgIChoID8gaCArICdIJyA6ICcnKSArXG4gICAgICAgIChtID8gbSArICdNJyA6ICcnKSArXG4gICAgICAgIChzID8gcyArICdTJyA6ICcnKTtcbn1cblxudmFyIHByb3RvJDIgPSBEdXJhdGlvbi5wcm90b3R5cGU7XG5cbnByb3RvJDIuaXNWYWxpZCAgICAgICAgPSBpc1ZhbGlkJDE7XG5wcm90byQyLmFicyAgICAgICAgICAgID0gYWJzO1xucHJvdG8kMi5hZGQgICAgICAgICAgICA9IGFkZCQxO1xucHJvdG8kMi5zdWJ0cmFjdCAgICAgICA9IHN1YnRyYWN0JDE7XG5wcm90byQyLmFzICAgICAgICAgICAgID0gYXM7XG5wcm90byQyLmFzTWlsbGlzZWNvbmRzID0gYXNNaWxsaXNlY29uZHM7XG5wcm90byQyLmFzU2Vjb25kcyAgICAgID0gYXNTZWNvbmRzO1xucHJvdG8kMi5hc01pbnV0ZXMgICAgICA9IGFzTWludXRlcztcbnByb3RvJDIuYXNIb3VycyAgICAgICAgPSBhc0hvdXJzO1xucHJvdG8kMi5hc0RheXMgICAgICAgICA9IGFzRGF5cztcbnByb3RvJDIuYXNXZWVrcyAgICAgICAgPSBhc1dlZWtzO1xucHJvdG8kMi5hc01vbnRocyAgICAgICA9IGFzTW9udGhzO1xucHJvdG8kMi5hc1llYXJzICAgICAgICA9IGFzWWVhcnM7XG5wcm90byQyLnZhbHVlT2YgICAgICAgID0gdmFsdWVPZiQxO1xucHJvdG8kMi5fYnViYmxlICAgICAgICA9IGJ1YmJsZTtcbnByb3RvJDIuZ2V0ICAgICAgICAgICAgPSBnZXQkMjtcbnByb3RvJDIubWlsbGlzZWNvbmRzICAgPSBtaWxsaXNlY29uZHM7XG5wcm90byQyLnNlY29uZHMgICAgICAgID0gc2Vjb25kcztcbnByb3RvJDIubWludXRlcyAgICAgICAgPSBtaW51dGVzO1xucHJvdG8kMi5ob3VycyAgICAgICAgICA9IGhvdXJzO1xucHJvdG8kMi5kYXlzICAgICAgICAgICA9IGRheXM7XG5wcm90byQyLndlZWtzICAgICAgICAgID0gd2Vla3M7XG5wcm90byQyLm1vbnRocyAgICAgICAgID0gbW9udGhzO1xucHJvdG8kMi55ZWFycyAgICAgICAgICA9IHllYXJzO1xucHJvdG8kMi5odW1hbml6ZSAgICAgICA9IGh1bWFuaXplO1xucHJvdG8kMi50b0lTT1N0cmluZyAgICA9IHRvSVNPU3RyaW5nJDE7XG5wcm90byQyLnRvU3RyaW5nICAgICAgID0gdG9JU09TdHJpbmckMTtcbnByb3RvJDIudG9KU09OICAgICAgICAgPSB0b0lTT1N0cmluZyQxO1xucHJvdG8kMi5sb2NhbGUgICAgICAgICA9IGxvY2FsZTtcbnByb3RvJDIubG9jYWxlRGF0YSAgICAgPSBsb2NhbGVEYXRhO1xuXG4vLyBEZXByZWNhdGlvbnNcbnByb3RvJDIudG9Jc29TdHJpbmcgPSBkZXByZWNhdGUoJ3RvSXNvU3RyaW5nKCkgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSB0b0lTT1N0cmluZygpIGluc3RlYWQgKG5vdGljZSB0aGUgY2FwaXRhbHMpJywgdG9JU09TdHJpbmckMSk7XG5wcm90byQyLmxhbmcgPSBsYW5nO1xuXG4vLyBTaWRlIGVmZmVjdCBpbXBvcnRzXG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ1gnLCAwLCAwLCAndW5peCcpO1xuYWRkRm9ybWF0VG9rZW4oJ3gnLCAwLCAwLCAndmFsdWVPZicpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ3gnLCBtYXRjaFNpZ25lZCk7XG5hZGRSZWdleFRva2VuKCdYJywgbWF0Y2hUaW1lc3RhbXApO1xuYWRkUGFyc2VUb2tlbignWCcsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHBhcnNlRmxvYXQoaW5wdXQsIDEwKSAqIDEwMDApO1xufSk7XG5hZGRQYXJzZVRva2VuKCd4JywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl9kID0gbmV3IERhdGUodG9JbnQoaW5wdXQpKTtcbn0pO1xuXG4vLyBTaWRlIGVmZmVjdCBpbXBvcnRzXG5cblxuaG9va3MudmVyc2lvbiA9ICcyLjE4LjEnO1xuXG5zZXRIb29rQ2FsbGJhY2soY3JlYXRlTG9jYWwpO1xuXG5ob29rcy5mbiAgICAgICAgICAgICAgICAgICAgPSBwcm90bztcbmhvb2tzLm1pbiAgICAgICAgICAgICAgICAgICA9IG1pbjtcbmhvb2tzLm1heCAgICAgICAgICAgICAgICAgICA9IG1heDtcbmhvb2tzLm5vdyAgICAgICAgICAgICAgICAgICA9IG5vdztcbmhvb2tzLnV0YyAgICAgICAgICAgICAgICAgICA9IGNyZWF0ZVVUQztcbmhvb2tzLnVuaXggICAgICAgICAgICAgICAgICA9IGNyZWF0ZVVuaXg7XG5ob29rcy5tb250aHMgICAgICAgICAgICAgICAgPSBsaXN0TW9udGhzO1xuaG9va3MuaXNEYXRlICAgICAgICAgICAgICAgID0gaXNEYXRlO1xuaG9va3MubG9jYWxlICAgICAgICAgICAgICAgID0gZ2V0U2V0R2xvYmFsTG9jYWxlO1xuaG9va3MuaW52YWxpZCAgICAgICAgICAgICAgID0gY3JlYXRlSW52YWxpZDtcbmhvb2tzLmR1cmF0aW9uICAgICAgICAgICAgICA9IGNyZWF0ZUR1cmF0aW9uO1xuaG9va3MuaXNNb21lbnQgICAgICAgICAgICAgID0gaXNNb21lbnQ7XG5ob29rcy53ZWVrZGF5cyAgICAgICAgICAgICAgPSBsaXN0V2Vla2RheXM7XG5ob29rcy5wYXJzZVpvbmUgICAgICAgICAgICAgPSBjcmVhdGVJblpvbmU7XG5ob29rcy5sb2NhbGVEYXRhICAgICAgICAgICAgPSBnZXRMb2NhbGU7XG5ob29rcy5pc0R1cmF0aW9uICAgICAgICAgICAgPSBpc0R1cmF0aW9uO1xuaG9va3MubW9udGhzU2hvcnQgICAgICAgICAgID0gbGlzdE1vbnRoc1Nob3J0O1xuaG9va3Mud2Vla2RheXNNaW4gICAgICAgICAgID0gbGlzdFdlZWtkYXlzTWluO1xuaG9va3MuZGVmaW5lTG9jYWxlICAgICAgICAgID0gZGVmaW5lTG9jYWxlO1xuaG9va3MudXBkYXRlTG9jYWxlICAgICAgICAgID0gdXBkYXRlTG9jYWxlO1xuaG9va3MubG9jYWxlcyAgICAgICAgICAgICAgID0gbGlzdExvY2FsZXM7XG5ob29rcy53ZWVrZGF5c1Nob3J0ICAgICAgICAgPSBsaXN0V2Vla2RheXNTaG9ydDtcbmhvb2tzLm5vcm1hbGl6ZVVuaXRzICAgICAgICA9IG5vcm1hbGl6ZVVuaXRzO1xuaG9va3MucmVsYXRpdmVUaW1lUm91bmRpbmcgPSBnZXRTZXRSZWxhdGl2ZVRpbWVSb3VuZGluZztcbmhvb2tzLnJlbGF0aXZlVGltZVRocmVzaG9sZCA9IGdldFNldFJlbGF0aXZlVGltZVRocmVzaG9sZDtcbmhvb2tzLmNhbGVuZGFyRm9ybWF0ICAgICAgICA9IGdldENhbGVuZGFyRm9ybWF0O1xuaG9va3MucHJvdG90eXBlICAgICAgICAgICAgID0gcHJvdG87XG5cbnJldHVybiBob29rcztcblxufSkpKTtcbiIsIi8qISBCcm93c2VyIGJ1bmRsZSBvZiBudW5qdWNrcyAzLjAuMSAoc2xpbSwgb25seSB3b3JrcyB3aXRoIHByZWNvbXBpbGVkIHRlbXBsYXRlcykgKi9cbihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIm51bmp1Y2tzXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcIm51bmp1Y2tzXCJdID0gZmFjdG9yeSgpO1xufSkodGhpcywgZnVuY3Rpb24oKSB7XG5yZXR1cm4gLyoqKioqKi8gKGZ1bmN0aW9uKG1vZHVsZXMpIHsgLy8gd2VicGFja0Jvb3RzdHJhcFxuLyoqKioqKi8gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbi8qKioqKiovIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbi8qKioqKiovIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4vKioqKioqLyBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4vKioqKioqLyBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4vKioqKioqLyBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuLyoqKioqKi8gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4vKioqKioqLyBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuLyoqKioqKi8gXHRcdFx0ZXhwb3J0czoge30sXG4vKioqKioqLyBcdFx0XHRpZDogbW9kdWxlSWQsXG4vKioqKioqLyBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4vKioqKioqLyBcdFx0fTtcblxuLyoqKioqKi8gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuLyoqKioqKi8gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4vKioqKioqLyBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuLyoqKioqKi8gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4vKioqKioqLyBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbi8qKioqKiovIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4vKioqKioqLyBcdH1cblxuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuLyoqKioqKi8gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4vKioqKioqLyBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLyoqKioqKi8gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcbi8qKioqKiovIH0pXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKi8gKFtcbi8qIDAgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cdHZhciBlbnYgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDIpO1xuXHR2YXIgTG9hZGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygxNSk7XG5cdHZhciBsb2FkZXJzID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIHByZWNvbXBpbGUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXG5cdG1vZHVsZS5leHBvcnRzID0ge307XG5cdG1vZHVsZS5leHBvcnRzLkVudmlyb25tZW50ID0gZW52LkVudmlyb25tZW50O1xuXHRtb2R1bGUuZXhwb3J0cy5UZW1wbGF0ZSA9IGVudi5UZW1wbGF0ZTtcblxuXHRtb2R1bGUuZXhwb3J0cy5Mb2FkZXIgPSBMb2FkZXI7XG5cdG1vZHVsZS5leHBvcnRzLkZpbGVTeXN0ZW1Mb2FkZXIgPSBsb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXI7XG5cdG1vZHVsZS5leHBvcnRzLlByZWNvbXBpbGVkTG9hZGVyID0gbG9hZGVycy5QcmVjb21waWxlZExvYWRlcjtcblx0bW9kdWxlLmV4cG9ydHMuV2ViTG9hZGVyID0gbG9hZGVycy5XZWJMb2FkZXI7XG5cblx0bW9kdWxlLmV4cG9ydHMuY29tcGlsZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHRtb2R1bGUuZXhwb3J0cy5wYXJzZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHRtb2R1bGUuZXhwb3J0cy5sZXhlciA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdG1vZHVsZS5leHBvcnRzLnJ1bnRpbWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDgpO1xuXHRtb2R1bGUuZXhwb3J0cy5saWIgPSBsaWI7XG5cdG1vZHVsZS5leHBvcnRzLm5vZGVzID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHRtb2R1bGUuZXhwb3J0cy5pbnN0YWxsSmluamFDb21wYXQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDE2KTtcblxuXHQvLyBBIHNpbmdsZSBpbnN0YW5jZSBvZiBhbiBlbnZpcm9ubWVudCwgc2luY2UgdGhpcyBpcyBzbyBjb21tb25seSB1c2VkXG5cblx0dmFyIGU7XG5cdG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uKHRlbXBsYXRlc1BhdGgsIG9wdHMpIHtcblx0ICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXHQgICAgaWYobGliLmlzT2JqZWN0KHRlbXBsYXRlc1BhdGgpKSB7XG5cdCAgICAgICAgb3B0cyA9IHRlbXBsYXRlc1BhdGg7XG5cdCAgICAgICAgdGVtcGxhdGVzUGF0aCA9IG51bGw7XG5cdCAgICB9XG5cblx0ICAgIHZhciBUZW1wbGF0ZUxvYWRlcjtcblx0ICAgIGlmKGxvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcikge1xuXHQgICAgICAgIFRlbXBsYXRlTG9hZGVyID0gbmV3IGxvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcih0ZW1wbGF0ZXNQYXRoLCB7XG5cdCAgICAgICAgICAgIHdhdGNoOiBvcHRzLndhdGNoLFxuXHQgICAgICAgICAgICBub0NhY2hlOiBvcHRzLm5vQ2FjaGVcblx0ICAgICAgICB9KTtcblx0ICAgIH1cblx0ICAgIGVsc2UgaWYobG9hZGVycy5XZWJMb2FkZXIpIHtcblx0ICAgICAgICBUZW1wbGF0ZUxvYWRlciA9IG5ldyBsb2FkZXJzLldlYkxvYWRlcih0ZW1wbGF0ZXNQYXRoLCB7XG5cdCAgICAgICAgICAgIHVzZUNhY2hlOiBvcHRzLndlYiAmJiBvcHRzLndlYi51c2VDYWNoZSxcblx0ICAgICAgICAgICAgYXN5bmM6IG9wdHMud2ViICYmIG9wdHMud2ViLmFzeW5jXG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIGUgPSBuZXcgZW52LkVudmlyb25tZW50KFRlbXBsYXRlTG9hZGVyLCBvcHRzKTtcblxuXHQgICAgaWYob3B0cyAmJiBvcHRzLmV4cHJlc3MpIHtcblx0ICAgICAgICBlLmV4cHJlc3Mob3B0cy5leHByZXNzKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIGU7XG5cdH07XG5cblx0bW9kdWxlLmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uKHNyYywgZW52LCBwYXRoLCBlYWdlckNvbXBpbGUpIHtcblx0ICAgIGlmKCFlKSB7XG5cdCAgICAgICAgbW9kdWxlLmV4cG9ydHMuY29uZmlndXJlKCk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbmV3IG1vZHVsZS5leHBvcnRzLlRlbXBsYXRlKHNyYywgZW52LCBwYXRoLCBlYWdlckNvbXBpbGUpO1xuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIGN0eCwgY2IpIHtcblx0ICAgIGlmKCFlKSB7XG5cdCAgICAgICAgbW9kdWxlLmV4cG9ydHMuY29uZmlndXJlKCk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBlLnJlbmRlcihuYW1lLCBjdHgsIGNiKTtcblx0fTtcblxuXHRtb2R1bGUuZXhwb3J0cy5yZW5kZXJTdHJpbmcgPSBmdW5jdGlvbihzcmMsIGN0eCwgY2IpIHtcblx0ICAgIGlmKCFlKSB7XG5cdCAgICAgICAgbW9kdWxlLmV4cG9ydHMuY29uZmlndXJlKCk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBlLnJlbmRlclN0cmluZyhzcmMsIGN0eCwgY2IpO1xuXHR9O1xuXG5cdGlmKHByZWNvbXBpbGUpIHtcblx0ICAgIG1vZHVsZS5leHBvcnRzLnByZWNvbXBpbGUgPSBwcmVjb21waWxlLnByZWNvbXBpbGU7XG5cdCAgICBtb2R1bGUuZXhwb3J0cy5wcmVjb21waWxlU3RyaW5nID0gcHJlY29tcGlsZS5wcmVjb21waWxlU3RyaW5nO1xuXHR9XG5cblxuLyoqKi8gfSksXG4vKiAxICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlO1xuXHR2YXIgT2JqUHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG5cdHZhciBlc2NhcGVNYXAgPSB7XG5cdCAgICAnJic6ICcmYW1wOycsXG5cdCAgICAnXCInOiAnJnF1b3Q7Jyxcblx0ICAgICdcXCcnOiAnJiMzOTsnLFxuXHQgICAgJzwnOiAnJmx0OycsXG5cdCAgICAnPic6ICcmZ3Q7J1xuXHR9O1xuXG5cdHZhciBlc2NhcGVSZWdleCA9IC9bJlwiJzw+XS9nO1xuXG5cdHZhciBsb29rdXBFc2NhcGUgPSBmdW5jdGlvbihjaCkge1xuXHQgICAgcmV0dXJuIGVzY2FwZU1hcFtjaF07XG5cdH07XG5cblx0dmFyIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5cdGV4cG9ydHMucHJldHRpZnlFcnJvciA9IGZ1bmN0aW9uKHBhdGgsIHdpdGhJbnRlcm5hbHMsIGVycikge1xuXHQgICAgLy8ganNoaW50IC1XMDIyXG5cdCAgICAvLyBodHRwOi8vanNsaW50ZXJyb3JzLmNvbS9kby1ub3QtYXNzaWduLXRvLXRoZS1leGNlcHRpb24tcGFyYW1ldGVyXG5cdCAgICBpZiAoIWVyci5VcGRhdGUpIHtcblx0ICAgICAgICAvLyBub3Qgb25lIG9mIG91cnMsIGNhc3QgaXRcblx0ICAgICAgICBlcnIgPSBuZXcgZXhwb3J0cy5UZW1wbGF0ZUVycm9yKGVycik7XG5cdCAgICB9XG5cdCAgICBlcnIuVXBkYXRlKHBhdGgpO1xuXG5cdCAgICAvLyBVbmxlc3MgdGhleSBtYXJrZWQgdGhlIGRldiBmbGFnLCBzaG93IHRoZW0gYSB0cmFjZSBmcm9tIGhlcmVcblx0ICAgIGlmICghd2l0aEludGVybmFscykge1xuXHQgICAgICAgIHZhciBvbGQgPSBlcnI7XG5cdCAgICAgICAgZXJyID0gbmV3IEVycm9yKG9sZC5tZXNzYWdlKTtcblx0ICAgICAgICBlcnIubmFtZSA9IG9sZC5uYW1lO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gZXJyO1xuXHR9O1xuXG5cdGV4cG9ydHMuVGVtcGxhdGVFcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UsIGxpbmVubywgY29sbm8pIHtcblx0ICAgIHZhciBlcnIgPSB0aGlzO1xuXG5cdCAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIEVycm9yKSB7IC8vIGZvciBjYXN0aW5nIHJlZ3VsYXIganMgZXJyb3JzXG5cdCAgICAgICAgZXJyID0gbWVzc2FnZTtcblx0ICAgICAgICBtZXNzYWdlID0gbWVzc2FnZS5uYW1lICsgJzogJyArIG1lc3NhZ2UubWVzc2FnZTtcblxuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIGlmKGVyci5uYW1lID0gJycpIHt9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGNhdGNoKGUpIHtcblx0ICAgICAgICAgICAgLy8gSWYgd2UgY2FuJ3Qgc2V0IHRoZSBuYW1lIG9mIHRoZSBlcnJvciBvYmplY3QgaW4gdGhpc1xuXHQgICAgICAgICAgICAvLyBlbnZpcm9ubWVudCwgZG9uJ3QgdXNlIGl0XG5cdCAgICAgICAgICAgIGVyciA9IHRoaXM7XG5cdCAgICAgICAgfVxuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICBpZihFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuXHQgICAgICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShlcnIpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgZXJyLm5hbWUgPSAnVGVtcGxhdGUgcmVuZGVyIGVycm9yJztcblx0ICAgIGVyci5tZXNzYWdlID0gbWVzc2FnZTtcblx0ICAgIGVyci5saW5lbm8gPSBsaW5lbm87XG5cdCAgICBlcnIuY29sbm8gPSBjb2xubztcblx0ICAgIGVyci5maXJzdFVwZGF0ZSA9IHRydWU7XG5cblx0ICAgIGVyci5VcGRhdGUgPSBmdW5jdGlvbihwYXRoKSB7XG5cdCAgICAgICAgdmFyIG1lc3NhZ2UgPSAnKCcgKyAocGF0aCB8fCAndW5rbm93biBwYXRoJykgKyAnKSc7XG5cblx0ICAgICAgICAvLyBvbmx5IHNob3cgbGluZW5vICsgY29sbm8gbmV4dCB0byBwYXRoIG9mIHRlbXBsYXRlXG5cdCAgICAgICAgLy8gd2hlcmUgZXJyb3Igb2NjdXJyZWRcblx0ICAgICAgICBpZiAodGhpcy5maXJzdFVwZGF0ZSkge1xuXHQgICAgICAgICAgICBpZih0aGlzLmxpbmVubyAmJiB0aGlzLmNvbG5vKSB7XG5cdCAgICAgICAgICAgICAgICBtZXNzYWdlICs9ICcgW0xpbmUgJyArIHRoaXMubGluZW5vICsgJywgQ29sdW1uICcgKyB0aGlzLmNvbG5vICsgJ10nO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYodGhpcy5saW5lbm8pIHtcblx0ICAgICAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyBbTGluZSAnICsgdGhpcy5saW5lbm8gKyAnXSc7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBtZXNzYWdlICs9ICdcXG4gJztcblx0ICAgICAgICBpZiAodGhpcy5maXJzdFVwZGF0ZSkge1xuXHQgICAgICAgICAgICBtZXNzYWdlICs9ICcgJztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlICsgKHRoaXMubWVzc2FnZSB8fCAnJyk7XG5cdCAgICAgICAgdGhpcy5maXJzdFVwZGF0ZSA9IGZhbHNlO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfTtcblxuXHQgICAgcmV0dXJuIGVycjtcblx0fTtcblxuXHRleHBvcnRzLlRlbXBsYXRlRXJyb3IucHJvdG90eXBlID0gRXJyb3IucHJvdG90eXBlO1xuXG5cdGV4cG9ydHMuZXNjYXBlID0gZnVuY3Rpb24odmFsKSB7XG5cdCAgcmV0dXJuIHZhbC5yZXBsYWNlKGVzY2FwZVJlZ2V4LCBsb29rdXBFc2NhcGUpO1xuXHR9O1xuXG5cdGV4cG9ydHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblx0fTtcblxuXHRleHBvcnRzLmlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcblx0fTtcblxuXHRleHBvcnRzLmlzU3RyaW5nID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBTdHJpbmddJztcblx0fTtcblxuXHRleHBvcnRzLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBPYmplY3RdJztcblx0fTtcblxuXHRleHBvcnRzLmdyb3VwQnkgPSBmdW5jdGlvbihvYmosIHZhbCkge1xuXHQgICAgdmFyIHJlc3VsdCA9IHt9O1xuXHQgICAgdmFyIGl0ZXJhdG9yID0gZXhwb3J0cy5pc0Z1bmN0aW9uKHZhbCkgPyB2YWwgOiBmdW5jdGlvbihvYmopIHsgcmV0dXJuIG9ialt2YWxdOyB9O1xuXHQgICAgZm9yKHZhciBpPTA7IGk8b2JqLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgdmFyIHZhbHVlID0gb2JqW2ldO1xuXHQgICAgICAgIHZhciBrZXkgPSBpdGVyYXRvcih2YWx1ZSwgaSk7XG5cdCAgICAgICAgKHJlc3VsdFtrZXldIHx8IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gcmVzdWx0O1xuXHR9O1xuXG5cdGV4cG9ydHMudG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKG9iaik7XG5cdH07XG5cblx0ZXhwb3J0cy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcblx0ICAgIHZhciByZXN1bHQgPSBbXTtcblx0ICAgIGlmICghYXJyYXkpIHtcblx0ICAgICAgICByZXR1cm4gcmVzdWx0O1xuXHQgICAgfVxuXHQgICAgdmFyIGluZGV4ID0gLTEsXG5cdCAgICBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG5cdCAgICBjb250YWlucyA9IGV4cG9ydHMudG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuXG5cdCAgICB3aGlsZSgrK2luZGV4IDwgbGVuZ3RoKSB7XG5cdCAgICAgICAgaWYoZXhwb3J0cy5pbmRleE9mKGNvbnRhaW5zLCBhcnJheVtpbmRleF0pID09PSAtMSkge1xuXHQgICAgICAgICAgICByZXN1bHQucHVzaChhcnJheVtpbmRleF0pO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHJldHVybiByZXN1bHQ7XG5cdH07XG5cblx0ZXhwb3J0cy5leHRlbmQgPSBmdW5jdGlvbihvYmosIG9iajIpIHtcblx0ICAgIGZvcih2YXIgayBpbiBvYmoyKSB7XG5cdCAgICAgICAgb2JqW2tdID0gb2JqMltrXTtcblx0ICAgIH1cblx0ICAgIHJldHVybiBvYmo7XG5cdH07XG5cblx0ZXhwb3J0cy5yZXBlYXQgPSBmdW5jdGlvbihjaGFyXywgbikge1xuXHQgICAgdmFyIHN0ciA9ICcnO1xuXHQgICAgZm9yKHZhciBpPTA7IGk8bjsgaSsrKSB7XG5cdCAgICAgICAgc3RyICs9IGNoYXJfO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHN0cjtcblx0fTtcblxuXHRleHBvcnRzLmVhY2ggPSBmdW5jdGlvbihvYmosIGZ1bmMsIGNvbnRleHQpIHtcblx0ICAgIGlmKG9iaiA9PSBudWxsKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICBpZihBcnJheVByb3RvLmVhY2ggJiYgb2JqLmVhY2ggPT09IEFycmF5UHJvdG8uZWFjaCkge1xuXHQgICAgICAgIG9iai5mb3JFYWNoKGZ1bmMsIGNvbnRleHQpO1xuXHQgICAgfVxuXHQgICAgZWxzZSBpZihvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuXHQgICAgICAgIGZvcih2YXIgaT0wLCBsPW9iai5sZW5ndGg7IGk8bDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGZ1bmMuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHR9O1xuXG5cdGV4cG9ydHMubWFwID0gZnVuY3Rpb24ob2JqLCBmdW5jKSB7XG5cdCAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXHQgICAgaWYob2JqID09IG51bGwpIHtcblx0ICAgICAgICByZXR1cm4gcmVzdWx0cztcblx0ICAgIH1cblxuXHQgICAgaWYoQXJyYXlQcm90by5tYXAgJiYgb2JqLm1hcCA9PT0gQXJyYXlQcm90by5tYXApIHtcblx0ICAgICAgICByZXR1cm4gb2JqLm1hcChmdW5jKTtcblx0ICAgIH1cblxuXHQgICAgZm9yKHZhciBpPTA7IGk8b2JqLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgcmVzdWx0c1tyZXN1bHRzLmxlbmd0aF0gPSBmdW5jKG9ialtpXSwgaSk7XG5cdCAgICB9XG5cblx0ICAgIGlmKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG5cdCAgICAgICAgcmVzdWx0cy5sZW5ndGggPSBvYmoubGVuZ3RoO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gcmVzdWx0cztcblx0fTtcblxuXHRleHBvcnRzLmFzeW5jSXRlciA9IGZ1bmN0aW9uKGFyciwgaXRlciwgY2IpIHtcblx0ICAgIHZhciBpID0gLTE7XG5cblx0ICAgIGZ1bmN0aW9uIG5leHQoKSB7XG5cdCAgICAgICAgaSsrO1xuXG5cdCAgICAgICAgaWYoaSA8IGFyci5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgaXRlcihhcnJbaV0sIGksIG5leHQsIGNiKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGNiKCk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBuZXh0KCk7XG5cdH07XG5cblx0ZXhwb3J0cy5hc3luY0ZvciA9IGZ1bmN0aW9uKG9iaiwgaXRlciwgY2IpIHtcblx0ICAgIHZhciBrZXlzID0gZXhwb3J0cy5rZXlzKG9iaik7XG5cdCAgICB2YXIgbGVuID0ga2V5cy5sZW5ndGg7XG5cdCAgICB2YXIgaSA9IC0xO1xuXG5cdCAgICBmdW5jdGlvbiBuZXh0KCkge1xuXHQgICAgICAgIGkrKztcblx0ICAgICAgICB2YXIgayA9IGtleXNbaV07XG5cblx0ICAgICAgICBpZihpIDwgbGVuKSB7XG5cdCAgICAgICAgICAgIGl0ZXIoaywgb2JqW2tdLCBpLCBsZW4sIG5leHQpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgY2IoKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIG5leHQoKTtcblx0fTtcblxuXHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9pbmRleE9mI1BvbHlmaWxsXG5cdGV4cG9ydHMuaW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mID9cblx0ICAgIGZ1bmN0aW9uIChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuXHQgICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGFyciwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KTtcblx0ICAgIH0gOlxuXHQgICAgZnVuY3Rpb24gKGFyciwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG5cdCAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoID4+PiAwOyAvLyBIYWNrIHRvIGNvbnZlcnQgb2JqZWN0Lmxlbmd0aCB0byBhIFVJbnQzMlxuXG5cdCAgICAgICAgZnJvbUluZGV4ID0gK2Zyb21JbmRleCB8fCAwO1xuXG5cdCAgICAgICAgaWYoTWF0aC5hYnMoZnJvbUluZGV4KSA9PT0gSW5maW5pdHkpIHtcblx0ICAgICAgICAgICAgZnJvbUluZGV4ID0gMDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZihmcm9tSW5kZXggPCAwKSB7XG5cdCAgICAgICAgICAgIGZyb21JbmRleCArPSBsZW5ndGg7XG5cdCAgICAgICAgICAgIGlmIChmcm9tSW5kZXggPCAwKSB7XG5cdCAgICAgICAgICAgICAgICBmcm9tSW5kZXggPSAwO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yKDtmcm9tSW5kZXggPCBsZW5ndGg7IGZyb21JbmRleCsrKSB7XG5cdCAgICAgICAgICAgIGlmIChhcnJbZnJvbUluZGV4XSA9PT0gc2VhcmNoRWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZyb21JbmRleDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiAtMTtcblx0ICAgIH07XG5cblx0aWYoIUFycmF5LnByb3RvdHlwZS5tYXApIHtcblx0ICAgIEFycmF5LnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcCBpcyB1bmltcGxlbWVudGVkIGZvciB0aGlzIGpzIGVuZ2luZScpO1xuXHQgICAgfTtcblx0fVxuXG5cdGV4cG9ydHMua2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgaWYoT2JqZWN0LnByb3RvdHlwZS5rZXlzKSB7XG5cdCAgICAgICAgcmV0dXJuIG9iai5rZXlzKCk7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICB2YXIga2V5cyA9IFtdO1xuXHQgICAgICAgIGZvcih2YXIgayBpbiBvYmopIHtcblx0ICAgICAgICAgICAgaWYob2JqLmhhc093blByb3BlcnR5KGspKSB7XG5cdCAgICAgICAgICAgICAgICBrZXlzLnB1c2goayk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGtleXM7XG5cdCAgICB9XG5cdH07XG5cblx0ZXhwb3J0cy5pbk9wZXJhdG9yID0gZnVuY3Rpb24gKGtleSwgdmFsKSB7XG5cdCAgICBpZiAoZXhwb3J0cy5pc0FycmF5KHZhbCkpIHtcblx0ICAgICAgICByZXR1cm4gZXhwb3J0cy5pbmRleE9mKHZhbCwga2V5KSAhPT0gLTE7XG5cdCAgICB9IGVsc2UgaWYgKGV4cG9ydHMuaXNPYmplY3QodmFsKSkge1xuXHQgICAgICAgIHJldHVybiBrZXkgaW4gdmFsO1xuXHQgICAgfSBlbHNlIGlmIChleHBvcnRzLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICByZXR1cm4gdmFsLmluZGV4T2Yoa2V5KSAhPT0gLTE7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHVzZSBcImluXCIgb3BlcmF0b3IgdG8gc2VhcmNoIGZvciBcIidcblx0ICAgICAgICAgICAgKyBrZXkgKyAnXCIgaW4gdW5leHBlY3RlZCB0eXBlcy4nKTtcblx0ICAgIH1cblx0fTtcblxuXG4vKioqLyB9KSxcbi8qIDIgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIHBhdGggPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgYXNhcCA9IF9fd2VicGFja19yZXF1aXJlX18oNCk7XG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgT2JqID0gX193ZWJwYWNrX3JlcXVpcmVfXyg2KTtcblx0dmFyIGNvbXBpbGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIGJ1aWx0aW5fZmlsdGVycyA9IF9fd2VicGFja19yZXF1aXJlX18oNyk7XG5cdHZhciBidWlsdGluX2xvYWRlcnMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgcnVudGltZSA9IF9fd2VicGFja19yZXF1aXJlX18oOCk7XG5cdHZhciBnbG9iYWxzID0gX193ZWJwYWNrX3JlcXVpcmVfXyg5KTtcblx0dmFyIHdhdGVyZmFsbCA9IF9fd2VicGFja19yZXF1aXJlX18oMTApO1xuXHR2YXIgRnJhbWUgPSBydW50aW1lLkZyYW1lO1xuXHR2YXIgVGVtcGxhdGU7XG5cblx0Ly8gVW5jb25kaXRpb25hbGx5IGxvYWQgaW4gdGhpcyBsb2FkZXIsIGV2ZW4gaWYgbm8gb3RoZXIgb25lcyBhcmVcblx0Ly8gaW5jbHVkZWQgKHBvc3NpYmxlIGluIHRoZSBzbGltIGJyb3dzZXIgYnVpbGQpXG5cdGJ1aWx0aW5fbG9hZGVycy5QcmVjb21waWxlZExvYWRlciA9IF9fd2VicGFja19yZXF1aXJlX18oMTQpO1xuXG5cdC8vIElmIHRoZSB1c2VyIGlzIHVzaW5nIHRoZSBhc3luYyBBUEksICphbHdheXMqIGNhbGwgaXRcblx0Ly8gYXN5bmNocm9ub3VzbHkgZXZlbiBpZiB0aGUgdGVtcGxhdGUgd2FzIHN5bmNocm9ub3VzLlxuXHRmdW5jdGlvbiBjYWxsYmFja0FzYXAoY2IsIGVyciwgcmVzKSB7XG5cdCAgICBhc2FwKGZ1bmN0aW9uKCkgeyBjYihlcnIsIHJlcyk7IH0pO1xuXHR9XG5cblx0dmFyIEVudmlyb25tZW50ID0gT2JqLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbihsb2FkZXJzLCBvcHRzKSB7XG5cdCAgICAgICAgLy8gVGhlIGRldiBmbGFnIGRldGVybWluZXMgdGhlIHRyYWNlIHRoYXQnbGwgYmUgc2hvd24gb24gZXJyb3JzLlxuXHQgICAgICAgIC8vIElmIHNldCB0byB0cnVlLCByZXR1cm5zIHRoZSBmdWxsIHRyYWNlIGZyb20gdGhlIGVycm9yIHBvaW50LFxuXHQgICAgICAgIC8vIG90aGVyd2lzZSB3aWxsIHJldHVybiB0cmFjZSBzdGFydGluZyBmcm9tIFRlbXBsYXRlLnJlbmRlclxuXHQgICAgICAgIC8vICh0aGUgZnVsbCB0cmFjZSBmcm9tIHdpdGhpbiBudW5qdWNrcyBtYXkgY29uZnVzZSBkZXZlbG9wZXJzIHVzaW5nXG5cdCAgICAgICAgLy8gIHRoZSBsaWJyYXJ5KVxuXHQgICAgICAgIC8vIGRlZmF1bHRzIHRvIGZhbHNlXG5cdCAgICAgICAgb3B0cyA9IHRoaXMub3B0cyA9IG9wdHMgfHwge307XG5cdCAgICAgICAgdGhpcy5vcHRzLmRldiA9ICEhb3B0cy5kZXY7XG5cblx0ICAgICAgICAvLyBUaGUgYXV0b2VzY2FwZSBmbGFnIHNldHMgZ2xvYmFsIGF1dG9lc2NhcGluZy4gSWYgdHJ1ZSxcblx0ICAgICAgICAvLyBldmVyeSBzdHJpbmcgdmFyaWFibGUgd2lsbCBiZSBlc2NhcGVkIGJ5IGRlZmF1bHQuXG5cdCAgICAgICAgLy8gSWYgZmFsc2UsIHN0cmluZ3MgY2FuIGJlIG1hbnVhbGx5IGVzY2FwZWQgdXNpbmcgdGhlIGBlc2NhcGVgIGZpbHRlci5cblx0ICAgICAgICAvLyBkZWZhdWx0cyB0byB0cnVlXG5cdCAgICAgICAgdGhpcy5vcHRzLmF1dG9lc2NhcGUgPSBvcHRzLmF1dG9lc2NhcGUgIT0gbnVsbCA/IG9wdHMuYXV0b2VzY2FwZSA6IHRydWU7XG5cblx0ICAgICAgICAvLyBJZiB0cnVlLCB0aGlzIHdpbGwgbWFrZSB0aGUgc3lzdGVtIHRocm93IGVycm9ycyBpZiB0cnlpbmdcblx0ICAgICAgICAvLyB0byBvdXRwdXQgYSBudWxsIG9yIHVuZGVmaW5lZCB2YWx1ZVxuXHQgICAgICAgIHRoaXMub3B0cy50aHJvd09uVW5kZWZpbmVkID0gISFvcHRzLnRocm93T25VbmRlZmluZWQ7XG5cdCAgICAgICAgdGhpcy5vcHRzLnRyaW1CbG9ja3MgPSAhIW9wdHMudHJpbUJsb2Nrcztcblx0ICAgICAgICB0aGlzLm9wdHMubHN0cmlwQmxvY2tzID0gISFvcHRzLmxzdHJpcEJsb2NrcztcblxuXHQgICAgICAgIHRoaXMubG9hZGVycyA9IFtdO1xuXG5cdCAgICAgICAgaWYoIWxvYWRlcnMpIHtcblx0ICAgICAgICAgICAgLy8gVGhlIGZpbGVzeXN0ZW0gbG9hZGVyIGlzIG9ubHkgYXZhaWxhYmxlIHNlcnZlci1zaWRlXG5cdCAgICAgICAgICAgIGlmKGJ1aWx0aW5fbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBbbmV3IGJ1aWx0aW5fbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKCd2aWV3cycpXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKGJ1aWx0aW5fbG9hZGVycy5XZWJMb2FkZXIpIHtcblx0ICAgICAgICAgICAgICAgIHRoaXMubG9hZGVycyA9IFtuZXcgYnVpbHRpbl9sb2FkZXJzLldlYkxvYWRlcignL3ZpZXdzJyldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBsaWIuaXNBcnJheShsb2FkZXJzKSA/IGxvYWRlcnMgOiBbbG9hZGVyc107XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gSXQncyBlYXN5IHRvIHVzZSBwcmVjb21waWxlZCB0ZW1wbGF0ZXM6IGp1c3QgaW5jbHVkZSB0aGVtXG5cdCAgICAgICAgLy8gYmVmb3JlIHlvdSBjb25maWd1cmUgbnVuanVja3MgYW5kIHRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5XG5cdCAgICAgICAgLy8gcGljayBpdCB1cCBhbmQgdXNlIGl0XG5cdCAgICAgICAgaWYoKHRydWUpICYmIHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkKSB7XG5cdCAgICAgICAgICAgIHRoaXMubG9hZGVycy51bnNoaWZ0KFxuXHQgICAgICAgICAgICAgICAgbmV3IGJ1aWx0aW5fbG9hZGVycy5QcmVjb21waWxlZExvYWRlcih3aW5kb3cubnVuanVja3NQcmVjb21waWxlZClcblx0ICAgICAgICAgICAgKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLmluaXRDYWNoZSgpO1xuXG5cdCAgICAgICAgdGhpcy5nbG9iYWxzID0gZ2xvYmFscygpO1xuXHQgICAgICAgIHRoaXMuZmlsdGVycyA9IHt9O1xuXHQgICAgICAgIHRoaXMuYXN5bmNGaWx0ZXJzID0gW107XG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zID0ge307XG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zTGlzdCA9IFtdO1xuXG5cdCAgICAgICAgZm9yKHZhciBuYW1lIGluIGJ1aWx0aW5fZmlsdGVycykge1xuXHQgICAgICAgICAgICB0aGlzLmFkZEZpbHRlcihuYW1lLCBidWlsdGluX2ZpbHRlcnNbbmFtZV0pO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGluaXRDYWNoZTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgLy8gQ2FjaGluZyBhbmQgY2FjaGUgYnVzdGluZ1xuXHQgICAgICAgIGxpYi5lYWNoKHRoaXMubG9hZGVycywgZnVuY3Rpb24obG9hZGVyKSB7XG5cdCAgICAgICAgICAgIGxvYWRlci5jYWNoZSA9IHt9O1xuXG5cdCAgICAgICAgICAgIGlmKHR5cGVvZiBsb2FkZXIub24gPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgICAgIGxvYWRlci5vbigndXBkYXRlJywgZnVuY3Rpb24odGVtcGxhdGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICBsb2FkZXIuY2FjaGVbdGVtcGxhdGVdID0gbnVsbDtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cdCAgICB9LFxuXG5cdCAgICBhZGRFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUsIGV4dGVuc2lvbikge1xuXHQgICAgICAgIGV4dGVuc2lvbi5fbmFtZSA9IG5hbWU7XG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zW25hbWVdID0gZXh0ZW5zaW9uO1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9uc0xpc3QucHVzaChleHRlbnNpb24pO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgcmVtb3ZlRXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuZ2V0RXh0ZW5zaW9uKG5hbWUpO1xuXHQgICAgICAgIGlmICghZXh0ZW5zaW9uKSByZXR1cm47XG5cblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnNMaXN0ID0gbGliLndpdGhvdXQodGhpcy5leHRlbnNpb25zTGlzdCwgZXh0ZW5zaW9uKTtcblx0ICAgICAgICBkZWxldGUgdGhpcy5leHRlbnNpb25zW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0RXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuZXh0ZW5zaW9uc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGhhc0V4dGVuc2lvbjogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHJldHVybiAhIXRoaXMuZXh0ZW5zaW9uc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEdsb2JhbDogZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcblx0ICAgICAgICB0aGlzLmdsb2JhbHNbbmFtZV0gPSB2YWx1ZTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIGdldEdsb2JhbDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIGlmKHR5cGVvZiB0aGlzLmdsb2JhbHNbbmFtZV0gPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZ2xvYmFsIG5vdCBmb3VuZDogJyArIG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gdGhpcy5nbG9iYWxzW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgYWRkRmlsdGVyOiBmdW5jdGlvbihuYW1lLCBmdW5jLCBhc3luYykge1xuXHQgICAgICAgIHZhciB3cmFwcGVkID0gZnVuYztcblxuXHQgICAgICAgIGlmKGFzeW5jKSB7XG5cdCAgICAgICAgICAgIHRoaXMuYXN5bmNGaWx0ZXJzLnB1c2gobmFtZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHRoaXMuZmlsdGVyc1tuYW1lXSA9IHdyYXBwZWQ7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRGaWx0ZXI6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZighdGhpcy5maWx0ZXJzW25hbWVdKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZmlsdGVyIG5vdCBmb3VuZDogJyArIG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgcmVzb2x2ZVRlbXBsYXRlOiBmdW5jdGlvbihsb2FkZXIsIHBhcmVudE5hbWUsIGZpbGVuYW1lKSB7XG5cdCAgICAgICAgdmFyIGlzUmVsYXRpdmUgPSAobG9hZGVyLmlzUmVsYXRpdmUgJiYgcGFyZW50TmFtZSk/IGxvYWRlci5pc1JlbGF0aXZlKGZpbGVuYW1lKSA6IGZhbHNlO1xuXHQgICAgICAgIHJldHVybiAoaXNSZWxhdGl2ZSAmJiBsb2FkZXIucmVzb2x2ZSk/IGxvYWRlci5yZXNvbHZlKHBhcmVudE5hbWUsIGZpbGVuYW1lKSA6IGZpbGVuYW1lO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0VGVtcGxhdGU6IGZ1bmN0aW9uKG5hbWUsIGVhZ2VyQ29tcGlsZSwgcGFyZW50TmFtZSwgaWdub3JlTWlzc2luZywgY2IpIHtcblx0ICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cdCAgICAgICAgdmFyIHRtcGwgPSBudWxsO1xuXHQgICAgICAgIGlmKG5hbWUgJiYgbmFtZS5yYXcpIHtcblx0ICAgICAgICAgICAgLy8gdGhpcyBmaXhlcyBhdXRvZXNjYXBlIGZvciB0ZW1wbGF0ZXMgcmVmZXJlbmNlZCBpbiBzeW1ib2xzXG5cdCAgICAgICAgICAgIG5hbWUgPSBuYW1lLnJhdztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihwYXJlbnROYW1lKSkge1xuXHQgICAgICAgICAgICBjYiA9IHBhcmVudE5hbWU7XG5cdCAgICAgICAgICAgIHBhcmVudE5hbWUgPSBudWxsO1xuXHQgICAgICAgICAgICBlYWdlckNvbXBpbGUgPSBlYWdlckNvbXBpbGUgfHwgZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYobGliLmlzRnVuY3Rpb24oZWFnZXJDb21waWxlKSkge1xuXHQgICAgICAgICAgICBjYiA9IGVhZ2VyQ29tcGlsZTtcblx0ICAgICAgICAgICAgZWFnZXJDb21waWxlID0gZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKG5hbWUgaW5zdGFuY2VvZiBUZW1wbGF0ZSkge1xuXHQgICAgICAgICAgICAgdG1wbCA9IG5hbWU7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGVtcGxhdGUgbmFtZXMgbXVzdCBiZSBhIHN0cmluZzogJyArIG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxvYWRlcnMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHZhciBfbmFtZSA9IHRoaXMucmVzb2x2ZVRlbXBsYXRlKHRoaXMubG9hZGVyc1tpXSwgcGFyZW50TmFtZSwgbmFtZSk7XG5cdCAgICAgICAgICAgICAgICB0bXBsID0gdGhpcy5sb2FkZXJzW2ldLmNhY2hlW19uYW1lXTtcblx0ICAgICAgICAgICAgICAgIGlmICh0bXBsKSBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKHRtcGwpIHtcblx0ICAgICAgICAgICAgaWYoZWFnZXJDb21waWxlKSB7XG5cdCAgICAgICAgICAgICAgICB0bXBsLmNvbXBpbGUoKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmKGNiKSB7XG5cdCAgICAgICAgICAgICAgICBjYihudWxsLCB0bXBsKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0bXBsO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHN5bmNSZXN1bHQ7XG5cdCAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cblx0ICAgICAgICAgICAgdmFyIGNyZWF0ZVRlbXBsYXRlID0gZnVuY3Rpb24oZXJyLCBpbmZvKSB7XG5cdCAgICAgICAgICAgICAgICBpZighaW5mbyAmJiAhZXJyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoIWlnbm9yZU1pc3NpbmcpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZXJyID0gbmV3IEVycm9yKCd0ZW1wbGF0ZSBub3QgZm91bmQ6ICcgKyBuYW1lKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZihjYikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYihlcnIpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciB0bXBsO1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGluZm8pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdG1wbCA9IG5ldyBUZW1wbGF0ZShpbmZvLnNyYywgX3RoaXMsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wYXRoLCBlYWdlckNvbXBpbGUpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmKCFpbmZvLm5vQ2FjaGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubG9hZGVyLmNhY2hlW25hbWVdID0gdG1wbDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdG1wbCA9IG5ldyBUZW1wbGF0ZSgnJywgX3RoaXMsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJycsIGVhZ2VyQ29tcGlsZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYoY2IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2IobnVsbCwgdG1wbCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gdG1wbDtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgbGliLmFzeW5jSXRlcih0aGlzLmxvYWRlcnMsIGZ1bmN0aW9uKGxvYWRlciwgaSwgbmV4dCwgZG9uZSkge1xuXHQgICAgICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlKGVyciwgc3JjKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoZXJyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUoZXJyKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSBpZihzcmMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3JjLmxvYWRlciA9IGxvYWRlcjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShudWxsLCBzcmMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLy8gUmVzb2x2ZSBuYW1lIHJlbGF0aXZlIHRvIHBhcmVudE5hbWVcblx0ICAgICAgICAgICAgICAgIG5hbWUgPSB0aGF0LnJlc29sdmVUZW1wbGF0ZShsb2FkZXIsIHBhcmVudE5hbWUsIG5hbWUpO1xuXG5cdCAgICAgICAgICAgICAgICBpZihsb2FkZXIuYXN5bmMpIHtcblx0ICAgICAgICAgICAgICAgICAgICBsb2FkZXIuZ2V0U291cmNlKG5hbWUsIGhhbmRsZSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBoYW5kbGUobnVsbCwgbG9hZGVyLmdldFNvdXJjZShuYW1lKSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0sIGNyZWF0ZVRlbXBsYXRlKTtcblxuXHQgICAgICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBleHByZXNzOiBmdW5jdGlvbihhcHApIHtcblx0ICAgICAgICB2YXIgZW52ID0gdGhpcztcblxuXHQgICAgICAgIGZ1bmN0aW9uIE51bmp1Y2tzVmlldyhuYW1lLCBvcHRzKSB7XG5cdCAgICAgICAgICAgIHRoaXMubmFtZSAgICAgICAgICA9IG5hbWU7XG5cdCAgICAgICAgICAgIHRoaXMucGF0aCAgICAgICAgICA9IG5hbWU7XG5cdCAgICAgICAgICAgIHRoaXMuZGVmYXVsdEVuZ2luZSA9IG9wdHMuZGVmYXVsdEVuZ2luZTtcblx0ICAgICAgICAgICAgdGhpcy5leHQgICAgICAgICAgID0gcGF0aC5leHRuYW1lKG5hbWUpO1xuXHQgICAgICAgICAgICBpZiAoIXRoaXMuZXh0ICYmICF0aGlzLmRlZmF1bHRFbmdpbmUpIHRocm93IG5ldyBFcnJvcignTm8gZGVmYXVsdCBlbmdpbmUgd2FzIHNwZWNpZmllZCBhbmQgbm8gZXh0ZW5zaW9uIHdhcyBwcm92aWRlZC4nKTtcblx0ICAgICAgICAgICAgaWYgKCF0aGlzLmV4dCkgdGhpcy5uYW1lICs9ICh0aGlzLmV4dCA9ICgnLicgIT09IHRoaXMuZGVmYXVsdEVuZ2luZVswXSA/ICcuJyA6ICcnKSArIHRoaXMuZGVmYXVsdEVuZ2luZSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgTnVuanVja3NWaWV3LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihvcHRzLCBjYikge1xuXHQgICAgICAgICAgZW52LnJlbmRlcih0aGlzLm5hbWUsIG9wdHMsIGNiKTtcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgYXBwLnNldCgndmlldycsIE51bmp1Y2tzVmlldyk7XG5cdCAgICAgICAgYXBwLnNldCgnbnVuanVja3NFbnYnLCB0aGlzKTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIHJlbmRlcjogZnVuY3Rpb24obmFtZSwgY3R4LCBjYikge1xuXHQgICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKGN0eCkpIHtcblx0ICAgICAgICAgICAgY2IgPSBjdHg7XG5cdCAgICAgICAgICAgIGN0eCA9IG51bGw7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gV2Ugc3VwcG9ydCBhIHN5bmNocm9ub3VzIEFQSSB0byBtYWtlIGl0IGVhc2llciB0byBtaWdyYXRlXG5cdCAgICAgICAgLy8gZXhpc3RpbmcgY29kZSB0byBhc3luYy4gVGhpcyB3b3JrcyBiZWNhdXNlIGlmIHlvdSBkb24ndCBkb1xuXHQgICAgICAgIC8vIGFueXRoaW5nIGFzeW5jIHdvcmssIHRoZSB3aG9sZSB0aGluZyBpcyBhY3R1YWxseSBydW5cblx0ICAgICAgICAvLyBzeW5jaHJvbm91c2x5LlxuXHQgICAgICAgIHZhciBzeW5jUmVzdWx0ID0gbnVsbDtcblxuXHQgICAgICAgIHRoaXMuZ2V0VGVtcGxhdGUobmFtZSwgZnVuY3Rpb24oZXJyLCB0bXBsKSB7XG5cdCAgICAgICAgICAgIGlmKGVyciAmJiBjYikge1xuXHQgICAgICAgICAgICAgICAgY2FsbGJhY2tBc2FwKGNiLCBlcnIpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYoZXJyKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gdG1wbC5yZW5kZXIoY3R4LCBjYik7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiBzeW5jUmVzdWx0O1xuXHQgICAgfSxcblxuXHQgICAgcmVuZGVyU3RyaW5nOiBmdW5jdGlvbihzcmMsIGN0eCwgb3B0cywgY2IpIHtcblx0ICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihvcHRzKSkge1xuXHQgICAgICAgICAgICBjYiA9IG9wdHM7XG5cdCAgICAgICAgICAgIG9wdHMgPSB7fTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cblx0ICAgICAgICB2YXIgdG1wbCA9IG5ldyBUZW1wbGF0ZShzcmMsIHRoaXMsIG9wdHMucGF0aCk7XG5cdCAgICAgICAgcmV0dXJuIHRtcGwucmVuZGVyKGN0eCwgY2IpO1xuXHQgICAgfSxcblxuXHQgICAgd2F0ZXJmYWxsOiB3YXRlcmZhbGxcblx0fSk7XG5cblx0dmFyIENvbnRleHQgPSBPYmouZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uKGN0eCwgYmxvY2tzLCBlbnYpIHtcblx0ICAgICAgICAvLyBIYXMgdG8gYmUgdGllZCB0byBhbiBlbnZpcm9ubWVudCBzbyB3ZSBjYW4gdGFwIGludG8gaXRzIGdsb2JhbHMuXG5cdCAgICAgICAgdGhpcy5lbnYgPSBlbnYgfHwgbmV3IEVudmlyb25tZW50KCk7XG5cblx0ICAgICAgICAvLyBNYWtlIGEgZHVwbGljYXRlIG9mIGN0eFxuXHQgICAgICAgIHRoaXMuY3R4ID0ge307XG5cdCAgICAgICAgZm9yKHZhciBrIGluIGN0eCkge1xuXHQgICAgICAgICAgICBpZihjdHguaGFzT3duUHJvcGVydHkoaykpIHtcblx0ICAgICAgICAgICAgICAgIHRoaXMuY3R4W2tdID0gY3R4W2tdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5ibG9ja3MgPSB7fTtcblx0ICAgICAgICB0aGlzLmV4cG9ydGVkID0gW107XG5cblx0ICAgICAgICBmb3IodmFyIG5hbWUgaW4gYmxvY2tzKSB7XG5cdCAgICAgICAgICAgIHRoaXMuYWRkQmxvY2sobmFtZSwgYmxvY2tzW25hbWVdKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBsb29rdXA6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICAvLyBUaGlzIGlzIG9uZSBvZiB0aGUgbW9zdCBjYWxsZWQgZnVuY3Rpb25zLCBzbyBvcHRpbWl6ZSBmb3Jcblx0ICAgICAgICAvLyB0aGUgdHlwaWNhbCBjYXNlIHdoZXJlIHRoZSBuYW1lIGlzbid0IGluIHRoZSBnbG9iYWxzXG5cdCAgICAgICAgaWYobmFtZSBpbiB0aGlzLmVudi5nbG9iYWxzICYmICEobmFtZSBpbiB0aGlzLmN0eCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW52Lmdsb2JhbHNbbmFtZV07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5jdHhbbmFtZV07XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgc2V0VmFyaWFibGU6IGZ1bmN0aW9uKG5hbWUsIHZhbCkge1xuXHQgICAgICAgIHRoaXMuY3R4W25hbWVdID0gdmFsO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0VmFyaWFibGVzOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5jdHg7XG5cdCAgICB9LFxuXG5cdCAgICBhZGRCbG9jazogZnVuY3Rpb24obmFtZSwgYmxvY2spIHtcblx0ICAgICAgICB0aGlzLmJsb2Nrc1tuYW1lXSA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdO1xuXHQgICAgICAgIHRoaXMuYmxvY2tzW25hbWVdLnB1c2goYmxvY2spO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0QmxvY2s6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZighdGhpcy5ibG9ja3NbbmFtZV0pIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIGJsb2NrIFwiJyArIG5hbWUgKyAnXCInKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gdGhpcy5ibG9ja3NbbmFtZV1bMF07XG5cdCAgICB9LFxuXG5cdCAgICBnZXRTdXBlcjogZnVuY3Rpb24oZW52LCBuYW1lLCBibG9jaywgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG5cdCAgICAgICAgdmFyIGlkeCA9IGxpYi5pbmRleE9mKHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdLCBibG9jayk7XG5cdCAgICAgICAgdmFyIGJsayA9IHRoaXMuYmxvY2tzW25hbWVdW2lkeCArIDFdO1xuXHQgICAgICAgIHZhciBjb250ZXh0ID0gdGhpcztcblxuXHQgICAgICAgIGlmKGlkeCA9PT0gLTEgfHwgIWJsaykge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHN1cGVyIGJsb2NrIGF2YWlsYWJsZSBmb3IgXCInICsgbmFtZSArICdcIicpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGJsayhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG5cdCAgICB9LFxuXG5cdCAgICBhZGRFeHBvcnQ6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICB0aGlzLmV4cG9ydGVkLnB1c2gobmFtZSk7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRFeHBvcnRlZDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIGV4cG9ydGVkID0ge307XG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5leHBvcnRlZC5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICB2YXIgbmFtZSA9IHRoaXMuZXhwb3J0ZWRbaV07XG5cdCAgICAgICAgICAgIGV4cG9ydGVkW25hbWVdID0gdGhpcy5jdHhbbmFtZV07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBleHBvcnRlZDtcblx0ICAgIH1cblx0fSk7XG5cblx0VGVtcGxhdGUgPSBPYmouZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uIChzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKSB7XG5cdCAgICAgICAgdGhpcy5lbnYgPSBlbnYgfHwgbmV3IEVudmlyb25tZW50KCk7XG5cblx0ICAgICAgICBpZihsaWIuaXNPYmplY3Qoc3JjKSkge1xuXHQgICAgICAgICAgICBzd2l0Y2goc3JjLnR5cGUpIHtcblx0ICAgICAgICAgICAgY2FzZSAnY29kZSc6IHRoaXMudG1wbFByb3BzID0gc3JjLm9iajsgYnJlYWs7XG5cdCAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6IHRoaXMudG1wbFN0ciA9IHNyYy5vYmo7IGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYobGliLmlzU3RyaW5nKHNyYykpIHtcblx0ICAgICAgICAgICAgdGhpcy50bXBsU3RyID0gc3JjO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzcmMgbXVzdCBiZSBhIHN0cmluZyBvciBhbiBvYmplY3QgZGVzY3JpYmluZyAnICtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0aGUgc291cmNlJyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5wYXRoID0gcGF0aDtcblxuXHQgICAgICAgIGlmKGVhZ2VyQ29tcGlsZSkge1xuXHQgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXHQgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgX3RoaXMuX2NvbXBpbGUoKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBjYXRjaChlcnIpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IGxpYi5wcmV0dGlmeUVycm9yKHRoaXMucGF0aCwgdGhpcy5lbnYub3B0cy5kZXYsIGVycik7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHRoaXMuY29tcGlsZWQgPSBmYWxzZTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCwgcGFyZW50RnJhbWUsIGNiKSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBjdHggPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBjdHg7XG5cdCAgICAgICAgICAgIGN0eCA9IHt9O1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmICh0eXBlb2YgcGFyZW50RnJhbWUgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBwYXJlbnRGcmFtZTtcblx0ICAgICAgICAgICAgcGFyZW50RnJhbWUgPSBudWxsO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBmb3JjZUFzeW5jID0gdHJ1ZTtcblx0ICAgICAgICBpZihwYXJlbnRGcmFtZSkge1xuXHQgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIGZyYW1lLCB3ZSBhcmUgYmVpbmcgY2FsbGVkIGZyb20gaW50ZXJuYWxcblx0ICAgICAgICAgICAgLy8gY29kZSBvZiBhbm90aGVyIHRlbXBsYXRlLCBhbmQgdGhlIGludGVybmFsIHN5c3RlbVxuXHQgICAgICAgICAgICAvLyBkZXBlbmRzIG9uIHRoZSBzeW5jL2FzeW5jIG5hdHVyZSBvZiB0aGUgcGFyZW50IHRlbXBsYXRlXG5cdCAgICAgICAgICAgIC8vIHRvIGJlIGluaGVyaXRlZCwgc28gZm9yY2UgYW4gYXN5bmMgY2FsbGJhY2tcblx0ICAgICAgICAgICAgZm9yY2VBc3luYyA9IGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cdCAgICAgICAgLy8gQ2F0Y2ggY29tcGlsZSBlcnJvcnMgZm9yIGFzeW5jIHJlbmRlcmluZ1xuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIF90aGlzLmNvbXBpbGUoKTtcblx0ICAgICAgICB9IGNhdGNoIChfZXJyKSB7XG5cdCAgICAgICAgICAgIHZhciBlcnIgPSBsaWIucHJldHRpZnlFcnJvcih0aGlzLnBhdGgsIHRoaXMuZW52Lm9wdHMuZGV2LCBfZXJyKTtcblx0ICAgICAgICAgICAgaWYgKGNiKSByZXR1cm4gY2FsbGJhY2tBc2FwKGNiLCBlcnIpO1xuXHQgICAgICAgICAgICBlbHNlIHRocm93IGVycjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KGN0eCB8fCB7fSwgX3RoaXMuYmxvY2tzLCBfdGhpcy5lbnYpO1xuXHQgICAgICAgIHZhciBmcmFtZSA9IHBhcmVudEZyYW1lID8gcGFyZW50RnJhbWUucHVzaCh0cnVlKSA6IG5ldyBGcmFtZSgpO1xuXHQgICAgICAgIGZyYW1lLnRvcExldmVsID0gdHJ1ZTtcblx0ICAgICAgICB2YXIgc3luY1Jlc3VsdCA9IG51bGw7XG5cblx0ICAgICAgICBfdGhpcy5yb290UmVuZGVyRnVuYyhcblx0ICAgICAgICAgICAgX3RoaXMuZW52LFxuXHQgICAgICAgICAgICBjb250ZXh0LFxuXHQgICAgICAgICAgICBmcmFtZSB8fCBuZXcgRnJhbWUoKSxcblx0ICAgICAgICAgICAgcnVudGltZSxcblx0ICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXMpIHtcblx0ICAgICAgICAgICAgICAgIGlmKGVycikge1xuXHQgICAgICAgICAgICAgICAgICAgIGVyciA9IGxpYi5wcmV0dGlmeUVycm9yKF90aGlzLnBhdGgsIF90aGlzLmVudi5vcHRzLmRldiwgZXJyKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgaWYoY2IpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZihmb3JjZUFzeW5jKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrQXNhcChjYiwgZXJyLCByZXMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2IoZXJyLCByZXMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGVycikgeyB0aHJvdyBlcnI7IH1cblx0ICAgICAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gcmVzO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgKTtcblxuXHQgICAgICAgIHJldHVybiBzeW5jUmVzdWx0O1xuXHQgICAgfSxcblxuXG5cdCAgICBnZXRFeHBvcnRlZDogZnVuY3Rpb24oY3R4LCBwYXJlbnRGcmFtZSwgY2IpIHtcblx0ICAgICAgICBpZiAodHlwZW9mIGN0eCA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICBjYiA9IGN0eDtcblx0ICAgICAgICAgICAgY3R4ID0ge307XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHR5cGVvZiBwYXJlbnRGcmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICBjYiA9IHBhcmVudEZyYW1lO1xuXHQgICAgICAgICAgICBwYXJlbnRGcmFtZSA9IG51bGw7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gQ2F0Y2ggY29tcGlsZSBlcnJvcnMgZm9yIGFzeW5jIHJlbmRlcmluZ1xuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIHRoaXMuY29tcGlsZSgpO1xuXHQgICAgICAgIH0gY2F0Y2ggKGUpIHtcblx0ICAgICAgICAgICAgaWYgKGNiKSByZXR1cm4gY2IoZSk7XG5cdCAgICAgICAgICAgIGVsc2UgdGhyb3cgZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgZnJhbWUgPSBwYXJlbnRGcmFtZSA/IHBhcmVudEZyYW1lLnB1c2goKSA6IG5ldyBGcmFtZSgpO1xuXHQgICAgICAgIGZyYW1lLnRvcExldmVsID0gdHJ1ZTtcblxuXHQgICAgICAgIC8vIFJ1biB0aGUgcm9vdFJlbmRlckZ1bmMgdG8gcG9wdWxhdGUgdGhlIGNvbnRleHQgd2l0aCBleHBvcnRlZCB2YXJzXG5cdCAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dChjdHggfHwge30sIHRoaXMuYmxvY2tzLCB0aGlzLmVudik7XG5cdCAgICAgICAgdGhpcy5yb290UmVuZGVyRnVuYyh0aGlzLmVudixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihlcnIpIHtcblx0ICAgICAgICBcdFx0ICAgICAgICBpZiAoIGVyciApIHtcblx0ICAgICAgICBcdFx0XHQgICAgY2IoZXJyLCBudWxsKTtcblx0ICAgICAgICBcdFx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIFx0XHRcdCAgICBjYihudWxsLCBjb250ZXh0LmdldEV4cG9ydGVkKCkpO1xuXHQgICAgICAgIFx0XHQgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgfSxcblxuXHQgICAgY29tcGlsZTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYoIXRoaXMuY29tcGlsZWQpIHtcblx0ICAgICAgICAgICAgdGhpcy5fY29tcGlsZSgpO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIF9jb21waWxlOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgcHJvcHM7XG5cblx0ICAgICAgICBpZih0aGlzLnRtcGxQcm9wcykge1xuXHQgICAgICAgICAgICBwcm9wcyA9IHRoaXMudG1wbFByb3BzO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGNvbXBpbGVyLmNvbXBpbGUodGhpcy50bXBsU3RyLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5hc3luY0ZpbHRlcnMsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52LmV4dGVuc2lvbnNMaXN0LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhdGgsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52Lm9wdHMpO1xuXG5cdCAgICAgICAgICAgIC8qIGpzbGludCBldmlsOiB0cnVlICovXG5cdCAgICAgICAgICAgIHZhciBmdW5jID0gbmV3IEZ1bmN0aW9uKHNvdXJjZSk7XG5cdCAgICAgICAgICAgIHByb3BzID0gZnVuYygpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMuYmxvY2tzID0gdGhpcy5fZ2V0QmxvY2tzKHByb3BzKTtcblx0ICAgICAgICB0aGlzLnJvb3RSZW5kZXJGdW5jID0gcHJvcHMucm9vdDtcblx0ICAgICAgICB0aGlzLmNvbXBpbGVkID0gdHJ1ZTtcblx0ICAgIH0sXG5cblx0ICAgIF9nZXRCbG9ja3M6IGZ1bmN0aW9uKHByb3BzKSB7XG5cdCAgICAgICAgdmFyIGJsb2NrcyA9IHt9O1xuXG5cdCAgICAgICAgZm9yKHZhciBrIGluIHByb3BzKSB7XG5cdCAgICAgICAgICAgIGlmKGsuc2xpY2UoMCwgMikgPT09ICdiXycpIHtcblx0ICAgICAgICAgICAgICAgIGJsb2Nrc1trLnNsaWNlKDIpXSA9IHByb3BzW2tdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGJsb2Nrcztcblx0ICAgIH1cblx0fSk7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSB7XG5cdCAgICBFbnZpcm9ubWVudDogRW52aXJvbm1lbnQsXG5cdCAgICBUZW1wbGF0ZTogVGVtcGxhdGVcblx0fTtcblxuXG4vKioqLyB9KSxcbi8qIDMgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHRcblxuLyoqKi8gfSksXG4vKiA0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly8gcmF3QXNhcCBwcm92aWRlcyBldmVyeXRoaW5nIHdlIG5lZWQgZXhjZXB0IGV4Y2VwdGlvbiBtYW5hZ2VtZW50LlxuXHR2YXIgcmF3QXNhcCA9IF9fd2VicGFja19yZXF1aXJlX18oNSk7XG5cdC8vIFJhd1Rhc2tzIGFyZSByZWN5Y2xlZCB0byByZWR1Y2UgR0MgY2h1cm4uXG5cdHZhciBmcmVlVGFza3MgPSBbXTtcblx0Ly8gV2UgcXVldWUgZXJyb3JzIHRvIGVuc3VyZSB0aGV5IGFyZSB0aHJvd24gaW4gcmlnaHQgb3JkZXIgKEZJRk8pLlxuXHQvLyBBcnJheS1hcy1xdWV1ZSBpcyBnb29kIGVub3VnaCBoZXJlLCBzaW5jZSB3ZSBhcmUganVzdCBkZWFsaW5nIHdpdGggZXhjZXB0aW9ucy5cblx0dmFyIHBlbmRpbmdFcnJvcnMgPSBbXTtcblx0dmFyIHJlcXVlc3RFcnJvclRocm93ID0gcmF3QXNhcC5tYWtlUmVxdWVzdENhbGxGcm9tVGltZXIodGhyb3dGaXJzdEVycm9yKTtcblxuXHRmdW5jdGlvbiB0aHJvd0ZpcnN0RXJyb3IoKSB7XG5cdCAgICBpZiAocGVuZGluZ0Vycm9ycy5sZW5ndGgpIHtcblx0ICAgICAgICB0aHJvdyBwZW5kaW5nRXJyb3JzLnNoaWZ0KCk7XG5cdCAgICB9XG5cdH1cblxuXHQvKipcblx0ICogQ2FsbHMgYSB0YXNrIGFzIHNvb24gYXMgcG9zc2libGUgYWZ0ZXIgcmV0dXJuaW5nLCBpbiBpdHMgb3duIGV2ZW50LCB3aXRoIHByaW9yaXR5XG5cdCAqIG92ZXIgb3RoZXIgZXZlbnRzIGxpa2UgYW5pbWF0aW9uLCByZWZsb3csIGFuZCByZXBhaW50LiBBbiBlcnJvciB0aHJvd24gZnJvbSBhblxuXHQgKiBldmVudCB3aWxsIG5vdCBpbnRlcnJ1cHQsIG5vciBldmVuIHN1YnN0YW50aWFsbHkgc2xvdyBkb3duIHRoZSBwcm9jZXNzaW5nIG9mXG5cdCAqIG90aGVyIGV2ZW50cywgYnV0IHdpbGwgYmUgcmF0aGVyIHBvc3Rwb25lZCB0byBhIGxvd2VyIHByaW9yaXR5IGV2ZW50LlxuXHQgKiBAcGFyYW0ge3tjYWxsfX0gdGFzayBBIGNhbGxhYmxlIG9iamVjdCwgdHlwaWNhbGx5IGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBub1xuXHQgKiBhcmd1bWVudHMuXG5cdCAqL1xuXHRtb2R1bGUuZXhwb3J0cyA9IGFzYXA7XG5cdGZ1bmN0aW9uIGFzYXAodGFzaykge1xuXHQgICAgdmFyIHJhd1Rhc2s7XG5cdCAgICBpZiAoZnJlZVRhc2tzLmxlbmd0aCkge1xuXHQgICAgICAgIHJhd1Rhc2sgPSBmcmVlVGFza3MucG9wKCk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIHJhd1Rhc2sgPSBuZXcgUmF3VGFzaygpO1xuXHQgICAgfVxuXHQgICAgcmF3VGFzay50YXNrID0gdGFzaztcblx0ICAgIHJhd0FzYXAocmF3VGFzayk7XG5cdH1cblxuXHQvLyBXZSB3cmFwIHRhc2tzIHdpdGggcmVjeWNsYWJsZSB0YXNrIG9iamVjdHMuICBBIHRhc2sgb2JqZWN0IGltcGxlbWVudHNcblx0Ly8gYGNhbGxgLCBqdXN0IGxpa2UgYSBmdW5jdGlvbi5cblx0ZnVuY3Rpb24gUmF3VGFzaygpIHtcblx0ICAgIHRoaXMudGFzayA9IG51bGw7XG5cdH1cblxuXHQvLyBUaGUgc29sZSBwdXJwb3NlIG9mIHdyYXBwaW5nIHRoZSB0YXNrIGlzIHRvIGNhdGNoIHRoZSBleGNlcHRpb24gYW5kIHJlY3ljbGVcblx0Ly8gdGhlIHRhc2sgb2JqZWN0IGFmdGVyIGl0cyBzaW5nbGUgdXNlLlxuXHRSYXdUYXNrLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdHJ5IHtcblx0ICAgICAgICB0aGlzLnRhc2suY2FsbCgpO1xuXHQgICAgfSBjYXRjaCAoZXJyb3IpIHtcblx0ICAgICAgICBpZiAoYXNhcC5vbmVycm9yKSB7XG5cdCAgICAgICAgICAgIC8vIFRoaXMgaG9vayBleGlzdHMgcHVyZWx5IGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuXHQgICAgICAgICAgICAvLyBJdHMgbmFtZSB3aWxsIGJlIHBlcmlvZGljYWxseSByYW5kb21pemVkIHRvIGJyZWFrIGFueSBjb2RlIHRoYXRcblx0ICAgICAgICAgICAgLy8gZGVwZW5kcyBvbiBpdHMgZXhpc3RlbmNlLlxuXHQgICAgICAgICAgICBhc2FwLm9uZXJyb3IoZXJyb3IpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIC8vIEluIGEgd2ViIGJyb3dzZXIsIGV4Y2VwdGlvbnMgYXJlIG5vdCBmYXRhbC4gSG93ZXZlciwgdG8gYXZvaWRcblx0ICAgICAgICAgICAgLy8gc2xvd2luZyBkb3duIHRoZSBxdWV1ZSBvZiBwZW5kaW5nIHRhc2tzLCB3ZSByZXRocm93IHRoZSBlcnJvciBpbiBhXG5cdCAgICAgICAgICAgIC8vIGxvd2VyIHByaW9yaXR5IHR1cm4uXG5cdCAgICAgICAgICAgIHBlbmRpbmdFcnJvcnMucHVzaChlcnJvcik7XG5cdCAgICAgICAgICAgIHJlcXVlc3RFcnJvclRocm93KCk7XG5cdCAgICAgICAgfVxuXHQgICAgfSBmaW5hbGx5IHtcblx0ICAgICAgICB0aGlzLnRhc2sgPSBudWxsO1xuXHQgICAgICAgIGZyZWVUYXNrc1tmcmVlVGFza3MubGVuZ3RoXSA9IHRoaXM7XG5cdCAgICB9XG5cdH07XG5cblxuLyoqKi8gfSksXG4vKiA1ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovKGZ1bmN0aW9uKGdsb2JhbCkge1widXNlIHN0cmljdFwiO1xuXG5cdC8vIFVzZSB0aGUgZmFzdGVzdCBtZWFucyBwb3NzaWJsZSB0byBleGVjdXRlIGEgdGFzayBpbiBpdHMgb3duIHR1cm4sIHdpdGhcblx0Ly8gcHJpb3JpdHkgb3ZlciBvdGhlciBldmVudHMgaW5jbHVkaW5nIElPLCBhbmltYXRpb24sIHJlZmxvdywgYW5kIHJlZHJhd1xuXHQvLyBldmVudHMgaW4gYnJvd3NlcnMuXG5cdC8vXG5cdC8vIEFuIGV4Y2VwdGlvbiB0aHJvd24gYnkgYSB0YXNrIHdpbGwgcGVybWFuZW50bHkgaW50ZXJydXB0IHRoZSBwcm9jZXNzaW5nIG9mXG5cdC8vIHN1YnNlcXVlbnQgdGFza3MuIFRoZSBoaWdoZXIgbGV2ZWwgYGFzYXBgIGZ1bmN0aW9uIGVuc3VyZXMgdGhhdCBpZiBhblxuXHQvLyBleGNlcHRpb24gaXMgdGhyb3duIGJ5IGEgdGFzaywgdGhhdCB0aGUgdGFzayBxdWV1ZSB3aWxsIGNvbnRpbnVlIGZsdXNoaW5nIGFzXG5cdC8vIHNvb24gYXMgcG9zc2libGUsIGJ1dCBpZiB5b3UgdXNlIGByYXdBc2FwYCBkaXJlY3RseSwgeW91IGFyZSByZXNwb25zaWJsZSB0b1xuXHQvLyBlaXRoZXIgZW5zdXJlIHRoYXQgbm8gZXhjZXB0aW9ucyBhcmUgdGhyb3duIGZyb20geW91ciB0YXNrLCBvciB0byBtYW51YWxseVxuXHQvLyBjYWxsIGByYXdBc2FwLnJlcXVlc3RGbHVzaGAgaWYgYW4gZXhjZXB0aW9uIGlzIHRocm93bi5cblx0bW9kdWxlLmV4cG9ydHMgPSByYXdBc2FwO1xuXHRmdW5jdGlvbiByYXdBc2FwKHRhc2spIHtcblx0ICAgIGlmICghcXVldWUubGVuZ3RoKSB7XG5cdCAgICAgICAgcmVxdWVzdEZsdXNoKCk7XG5cdCAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuXHQgICAgfVxuXHQgICAgLy8gRXF1aXZhbGVudCB0byBwdXNoLCBidXQgYXZvaWRzIGEgZnVuY3Rpb24gY2FsbC5cblx0ICAgIHF1ZXVlW3F1ZXVlLmxlbmd0aF0gPSB0YXNrO1xuXHR9XG5cblx0dmFyIHF1ZXVlID0gW107XG5cdC8vIE9uY2UgYSBmbHVzaCBoYXMgYmVlbiByZXF1ZXN0ZWQsIG5vIGZ1cnRoZXIgY2FsbHMgdG8gYHJlcXVlc3RGbHVzaGAgYXJlXG5cdC8vIG5lY2Vzc2FyeSB1bnRpbCB0aGUgbmV4dCBgZmx1c2hgIGNvbXBsZXRlcy5cblx0dmFyIGZsdXNoaW5nID0gZmFsc2U7XG5cdC8vIGByZXF1ZXN0Rmx1c2hgIGlzIGFuIGltcGxlbWVudGF0aW9uLXNwZWNpZmljIG1ldGhvZCB0aGF0IGF0dGVtcHRzIHRvIGtpY2tcblx0Ly8gb2ZmIGEgYGZsdXNoYCBldmVudCBhcyBxdWlja2x5IGFzIHBvc3NpYmxlLiBgZmx1c2hgIHdpbGwgYXR0ZW1wdCB0byBleGhhdXN0XG5cdC8vIHRoZSBldmVudCBxdWV1ZSBiZWZvcmUgeWllbGRpbmcgdG8gdGhlIGJyb3dzZXIncyBvd24gZXZlbnQgbG9vcC5cblx0dmFyIHJlcXVlc3RGbHVzaDtcblx0Ly8gVGhlIHBvc2l0aW9uIG9mIHRoZSBuZXh0IHRhc2sgdG8gZXhlY3V0ZSBpbiB0aGUgdGFzayBxdWV1ZS4gVGhpcyBpc1xuXHQvLyBwcmVzZXJ2ZWQgYmV0d2VlbiBjYWxscyB0byBgZmx1c2hgIHNvIHRoYXQgaXQgY2FuIGJlIHJlc3VtZWQgaWZcblx0Ly8gYSB0YXNrIHRocm93cyBhbiBleGNlcHRpb24uXG5cdHZhciBpbmRleCA9IDA7XG5cdC8vIElmIGEgdGFzayBzY2hlZHVsZXMgYWRkaXRpb25hbCB0YXNrcyByZWN1cnNpdmVseSwgdGhlIHRhc2sgcXVldWUgY2FuIGdyb3dcblx0Ly8gdW5ib3VuZGVkLiBUbyBwcmV2ZW50IG1lbW9yeSBleGhhdXN0aW9uLCB0aGUgdGFzayBxdWV1ZSB3aWxsIHBlcmlvZGljYWxseVxuXHQvLyB0cnVuY2F0ZSBhbHJlYWR5LWNvbXBsZXRlZCB0YXNrcy5cblx0dmFyIGNhcGFjaXR5ID0gMTAyNDtcblxuXHQvLyBUaGUgZmx1c2ggZnVuY3Rpb24gcHJvY2Vzc2VzIGFsbCB0YXNrcyB0aGF0IGhhdmUgYmVlbiBzY2hlZHVsZWQgd2l0aFxuXHQvLyBgcmF3QXNhcGAgdW5sZXNzIGFuZCB1bnRpbCBvbmUgb2YgdGhvc2UgdGFza3MgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cblx0Ly8gSWYgYSB0YXNrIHRocm93cyBhbiBleGNlcHRpb24sIGBmbHVzaGAgZW5zdXJlcyB0aGF0IGl0cyBzdGF0ZSB3aWxsIHJlbWFpblxuXHQvLyBjb25zaXN0ZW50IGFuZCB3aWxsIHJlc3VtZSB3aGVyZSBpdCBsZWZ0IG9mZiB3aGVuIGNhbGxlZCBhZ2Fpbi5cblx0Ly8gSG93ZXZlciwgYGZsdXNoYCBkb2VzIG5vdCBtYWtlIGFueSBhcnJhbmdlbWVudHMgdG8gYmUgY2FsbGVkIGFnYWluIGlmIGFuXG5cdC8vIGV4Y2VwdGlvbiBpcyB0aHJvd24uXG5cdGZ1bmN0aW9uIGZsdXNoKCkge1xuXHQgICAgd2hpbGUgKGluZGV4IDwgcXVldWUubGVuZ3RoKSB7XG5cdCAgICAgICAgdmFyIGN1cnJlbnRJbmRleCA9IGluZGV4O1xuXHQgICAgICAgIC8vIEFkdmFuY2UgdGhlIGluZGV4IGJlZm9yZSBjYWxsaW5nIHRoZSB0YXNrLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSB3aWxsXG5cdCAgICAgICAgLy8gYmVnaW4gZmx1c2hpbmcgb24gdGhlIG5leHQgdGFzayB0aGUgdGFzayB0aHJvd3MgYW4gZXJyb3IuXG5cdCAgICAgICAgaW5kZXggPSBpbmRleCArIDE7XG5cdCAgICAgICAgcXVldWVbY3VycmVudEluZGV4XS5jYWxsKCk7XG5cdCAgICAgICAgLy8gUHJldmVudCBsZWFraW5nIG1lbW9yeSBmb3IgbG9uZyBjaGFpbnMgb2YgcmVjdXJzaXZlIGNhbGxzIHRvIGBhc2FwYC5cblx0ICAgICAgICAvLyBJZiB3ZSBjYWxsIGBhc2FwYCB3aXRoaW4gdGFza3Mgc2NoZWR1bGVkIGJ5IGBhc2FwYCwgdGhlIHF1ZXVlIHdpbGxcblx0ICAgICAgICAvLyBncm93LCBidXQgdG8gYXZvaWQgYW4gTyhuKSB3YWxrIGZvciBldmVyeSB0YXNrIHdlIGV4ZWN1dGUsIHdlIGRvbid0XG5cdCAgICAgICAgLy8gc2hpZnQgdGFza3Mgb2ZmIHRoZSBxdWV1ZSBhZnRlciB0aGV5IGhhdmUgYmVlbiBleGVjdXRlZC5cblx0ICAgICAgICAvLyBJbnN0ZWFkLCB3ZSBwZXJpb2RpY2FsbHkgc2hpZnQgMTAyNCB0YXNrcyBvZmYgdGhlIHF1ZXVlLlxuXHQgICAgICAgIGlmIChpbmRleCA+IGNhcGFjaXR5KSB7XG5cdCAgICAgICAgICAgIC8vIE1hbnVhbGx5IHNoaWZ0IGFsbCB2YWx1ZXMgc3RhcnRpbmcgYXQgdGhlIGluZGV4IGJhY2sgdG8gdGhlXG5cdCAgICAgICAgICAgIC8vIGJlZ2lubmluZyBvZiB0aGUgcXVldWUuXG5cdCAgICAgICAgICAgIGZvciAodmFyIHNjYW4gPSAwLCBuZXdMZW5ndGggPSBxdWV1ZS5sZW5ndGggLSBpbmRleDsgc2NhbiA8IG5ld0xlbmd0aDsgc2NhbisrKSB7XG5cdCAgICAgICAgICAgICAgICBxdWV1ZVtzY2FuXSA9IHF1ZXVlW3NjYW4gKyBpbmRleF07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcXVldWUubGVuZ3RoIC09IGluZGV4O1xuXHQgICAgICAgICAgICBpbmRleCA9IDA7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHQgICAgcXVldWUubGVuZ3RoID0gMDtcblx0ICAgIGluZGV4ID0gMDtcblx0ICAgIGZsdXNoaW5nID0gZmFsc2U7XG5cdH1cblxuXHQvLyBgcmVxdWVzdEZsdXNoYCBpcyBpbXBsZW1lbnRlZCB1c2luZyBhIHN0cmF0ZWd5IGJhc2VkIG9uIGRhdGEgY29sbGVjdGVkIGZyb21cblx0Ly8gZXZlcnkgYXZhaWxhYmxlIFNhdWNlTGFicyBTZWxlbml1bSB3ZWIgZHJpdmVyIHdvcmtlciBhdCB0aW1lIG9mIHdyaXRpbmcuXG5cdC8vIGh0dHBzOi8vZG9jcy5nb29nbGUuY29tL3NwcmVhZHNoZWV0cy9kLzFtRy01VVlHdXA1cXhHZEVNV2toUDZCV0N6MDUzTlViMkUxUW9VVFUxNnVBL2VkaXQjZ2lkPTc4MzcyNDU5M1xuXG5cdC8vIFNhZmFyaSA2IGFuZCA2LjEgZm9yIGRlc2t0b3AsIGlQYWQsIGFuZCBpUGhvbmUgYXJlIHRoZSBvbmx5IGJyb3dzZXJzIHRoYXRcblx0Ly8gaGF2ZSBXZWJLaXRNdXRhdGlvbk9ic2VydmVyIGJ1dCBub3QgdW4tcHJlZml4ZWQgTXV0YXRpb25PYnNlcnZlci5cblx0Ly8gTXVzdCB1c2UgYGdsb2JhbGAgb3IgYHNlbGZgIGluc3RlYWQgb2YgYHdpbmRvd2AgdG8gd29yayBpbiBib3RoIGZyYW1lcyBhbmQgd2ViXG5cdC8vIHdvcmtlcnMuIGBnbG9iYWxgIGlzIGEgcHJvdmlzaW9uIG9mIEJyb3dzZXJpZnksIE1yLCBNcnMsIG9yIE1vcC5cblxuXHQvKiBnbG9iYWxzIHNlbGYgKi9cblx0dmFyIHNjb3BlID0gdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHNlbGY7XG5cdHZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IHNjb3BlLk11dGF0aW9uT2JzZXJ2ZXIgfHwgc2NvcGUuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcblxuXHQvLyBNdXRhdGlvbk9ic2VydmVycyBhcmUgZGVzaXJhYmxlIGJlY2F1c2UgdGhleSBoYXZlIGhpZ2ggcHJpb3JpdHkgYW5kIHdvcmtcblx0Ly8gcmVsaWFibHkgZXZlcnl3aGVyZSB0aGV5IGFyZSBpbXBsZW1lbnRlZC5cblx0Ly8gVGhleSBhcmUgaW1wbGVtZW50ZWQgaW4gYWxsIG1vZGVybiBicm93c2Vycy5cblx0Ly9cblx0Ly8gLSBBbmRyb2lkIDQtNC4zXG5cdC8vIC0gQ2hyb21lIDI2LTM0XG5cdC8vIC0gRmlyZWZveCAxNC0yOVxuXHQvLyAtIEludGVybmV0IEV4cGxvcmVyIDExXG5cdC8vIC0gaVBhZCBTYWZhcmkgNi03LjFcblx0Ly8gLSBpUGhvbmUgU2FmYXJpIDctNy4xXG5cdC8vIC0gU2FmYXJpIDYtN1xuXHRpZiAodHlwZW9mIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID09PSBcImZ1bmN0aW9uXCIpIHtcblx0ICAgIHJlcXVlc3RGbHVzaCA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21NdXRhdGlvbk9ic2VydmVyKGZsdXNoKTtcblxuXHQvLyBNZXNzYWdlQ2hhbm5lbHMgYXJlIGRlc2lyYWJsZSBiZWNhdXNlIHRoZXkgZ2l2ZSBkaXJlY3QgYWNjZXNzIHRvIHRoZSBIVE1MXG5cdC8vIHRhc2sgcXVldWUsIGFyZSBpbXBsZW1lbnRlZCBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMCwgU2FmYXJpIDUuMC0xLCBhbmQgT3BlcmFcblx0Ly8gMTEtMTIsIGFuZCBpbiB3ZWIgd29ya2VycyBpbiBtYW55IGVuZ2luZXMuXG5cdC8vIEFsdGhvdWdoIG1lc3NhZ2UgY2hhbm5lbHMgeWllbGQgdG8gYW55IHF1ZXVlZCByZW5kZXJpbmcgYW5kIElPIHRhc2tzLCB0aGV5XG5cdC8vIHdvdWxkIGJlIGJldHRlciB0aGFuIGltcG9zaW5nIHRoZSA0bXMgZGVsYXkgb2YgdGltZXJzLlxuXHQvLyBIb3dldmVyLCB0aGV5IGRvIG5vdCB3b3JrIHJlbGlhYmx5IGluIEludGVybmV0IEV4cGxvcmVyIG9yIFNhZmFyaS5cblxuXHQvLyBJbnRlcm5ldCBFeHBsb3JlciAxMCBpcyB0aGUgb25seSBicm93c2VyIHRoYXQgaGFzIHNldEltbWVkaWF0ZSBidXQgZG9lc1xuXHQvLyBub3QgaGF2ZSBNdXRhdGlvbk9ic2VydmVycy5cblx0Ly8gQWx0aG91Z2ggc2V0SW1tZWRpYXRlIHlpZWxkcyB0byB0aGUgYnJvd3NlcidzIHJlbmRlcmVyLCBpdCB3b3VsZCBiZVxuXHQvLyBwcmVmZXJyYWJsZSB0byBmYWxsaW5nIGJhY2sgdG8gc2V0VGltZW91dCBzaW5jZSBpdCBkb2VzIG5vdCBoYXZlXG5cdC8vIHRoZSBtaW5pbXVtIDRtcyBwZW5hbHR5LlxuXHQvLyBVbmZvcnR1bmF0ZWx5IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSBidWcgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAgTW9iaWxlIChhbmRcblx0Ly8gRGVza3RvcCB0byBhIGxlc3NlciBleHRlbnQpIHRoYXQgcmVuZGVycyBib3RoIHNldEltbWVkaWF0ZSBhbmRcblx0Ly8gTWVzc2FnZUNoYW5uZWwgdXNlbGVzcyBmb3IgdGhlIHB1cnBvc2VzIG9mIEFTQVAuXG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9pc3N1ZXMvMzk2XG5cblx0Ly8gVGltZXJzIGFyZSBpbXBsZW1lbnRlZCB1bml2ZXJzYWxseS5cblx0Ly8gV2UgZmFsbCBiYWNrIHRvIHRpbWVycyBpbiB3b3JrZXJzIGluIG1vc3QgZW5naW5lcywgYW5kIGluIGZvcmVncm91bmRcblx0Ly8gY29udGV4dHMgaW4gdGhlIGZvbGxvd2luZyBicm93c2Vycy5cblx0Ly8gSG93ZXZlciwgbm90ZSB0aGF0IGV2ZW4gdGhpcyBzaW1wbGUgY2FzZSByZXF1aXJlcyBudWFuY2VzIHRvIG9wZXJhdGUgaW4gYVxuXHQvLyBicm9hZCBzcGVjdHJ1bSBvZiBicm93c2Vycy5cblx0Ly9cblx0Ly8gLSBGaXJlZm94IDMtMTNcblx0Ly8gLSBJbnRlcm5ldCBFeHBsb3JlciA2LTlcblx0Ly8gLSBpUGFkIFNhZmFyaSA0LjNcblx0Ly8gLSBMeW54IDIuOC43XG5cdH0gZWxzZSB7XG5cdCAgICByZXF1ZXN0Rmx1c2ggPSBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXIoZmx1c2gpO1xuXHR9XG5cblx0Ly8gYHJlcXVlc3RGbHVzaGAgcmVxdWVzdHMgdGhhdCB0aGUgaGlnaCBwcmlvcml0eSBldmVudCBxdWV1ZSBiZSBmbHVzaGVkIGFzXG5cdC8vIHNvb24gYXMgcG9zc2libGUuXG5cdC8vIFRoaXMgaXMgdXNlZnVsIHRvIHByZXZlbnQgYW4gZXJyb3IgdGhyb3duIGluIGEgdGFzayBmcm9tIHN0YWxsaW5nIHRoZSBldmVudFxuXHQvLyBxdWV1ZSBpZiB0aGUgZXhjZXB0aW9uIGhhbmRsZWQgYnkgTm9kZS5qc+KAmXNcblx0Ly8gYHByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiKWAgb3IgYnkgYSBkb21haW4uXG5cdHJhd0FzYXAucmVxdWVzdEZsdXNoID0gcmVxdWVzdEZsdXNoO1xuXG5cdC8vIFRvIHJlcXVlc3QgYSBoaWdoIHByaW9yaXR5IGV2ZW50LCB3ZSBpbmR1Y2UgYSBtdXRhdGlvbiBvYnNlcnZlciBieSB0b2dnbGluZ1xuXHQvLyB0aGUgdGV4dCBvZiBhIHRleHQgbm9kZSBiZXR3ZWVuIFwiMVwiIGFuZCBcIi0xXCIuXG5cdGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21NdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKSB7XG5cdCAgICB2YXIgdG9nZ2xlID0gMTtcblx0ICAgIHZhciBvYnNlcnZlciA9IG5ldyBCcm93c2VyTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjayk7XG5cdCAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuXHQgICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7Y2hhcmFjdGVyRGF0YTogdHJ1ZX0pO1xuXHQgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQgICAgICAgIHRvZ2dsZSA9IC10b2dnbGU7XG5cdCAgICAgICAgbm9kZS5kYXRhID0gdG9nZ2xlO1xuXHQgICAgfTtcblx0fVxuXG5cdC8vIFRoZSBtZXNzYWdlIGNoYW5uZWwgdGVjaG5pcXVlIHdhcyBkaXNjb3ZlcmVkIGJ5IE1hbHRlIFVibCBhbmQgd2FzIHRoZVxuXHQvLyBvcmlnaW5hbCBmb3VuZGF0aW9uIGZvciB0aGlzIGxpYnJhcnkuXG5cdC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG5cblx0Ly8gU2FmYXJpIDYuMC41IChhdCBsZWFzdCkgaW50ZXJtaXR0ZW50bHkgZmFpbHMgdG8gY3JlYXRlIG1lc3NhZ2UgcG9ydHMgb24gYVxuXHQvLyBwYWdlJ3MgZmlyc3QgbG9hZC4gVGhhbmtmdWxseSwgdGhpcyB2ZXJzaW9uIG9mIFNhZmFyaSBzdXBwb3J0c1xuXHQvLyBNdXRhdGlvbk9ic2VydmVycywgc28gd2UgZG9uJ3QgbmVlZCB0byBmYWxsIGJhY2sgaW4gdGhhdCBjYXNlLlxuXG5cdC8vIGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21NZXNzYWdlQ2hhbm5lbChjYWxsYmFjaykge1xuXHQvLyAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcblx0Ly8gICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gY2FsbGJhY2s7XG5cdC8vICAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG5cdC8vICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcblx0Ly8gICAgIH07XG5cdC8vIH1cblxuXHQvLyBGb3IgcmVhc29ucyBleHBsYWluZWQgYWJvdmUsIHdlIGFyZSBhbHNvIHVuYWJsZSB0byB1c2UgYHNldEltbWVkaWF0ZWBcblx0Ly8gdW5kZXIgYW55IGNpcmN1bXN0YW5jZXMuXG5cdC8vIEV2ZW4gaWYgd2Ugd2VyZSwgdGhlcmUgaXMgYW5vdGhlciBidWcgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAuXG5cdC8vIEl0IGlzIG5vdCBzdWZmaWNpZW50IHRvIGFzc2lnbiBgc2V0SW1tZWRpYXRlYCB0byBgcmVxdWVzdEZsdXNoYCBiZWNhdXNlXG5cdC8vIGBzZXRJbW1lZGlhdGVgIG11c3QgYmUgY2FsbGVkICpieSBuYW1lKiBhbmQgdGhlcmVmb3JlIG11c3QgYmUgd3JhcHBlZCBpbiBhXG5cdC8vIGNsb3N1cmUuXG5cdC8vIE5ldmVyIGZvcmdldC5cblxuXHQvLyBmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tU2V0SW1tZWRpYXRlKGNhbGxiYWNrKSB7XG5cdC8vICAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG5cdC8vICAgICAgICAgc2V0SW1tZWRpYXRlKGNhbGxiYWNrKTtcblx0Ly8gICAgIH07XG5cdC8vIH1cblxuXHQvLyBTYWZhcmkgNi4wIGhhcyBhIHByb2JsZW0gd2hlcmUgdGltZXJzIHdpbGwgZ2V0IGxvc3Qgd2hpbGUgdGhlIHVzZXIgaXNcblx0Ly8gc2Nyb2xsaW5nLiBUaGlzIHByb2JsZW0gZG9lcyBub3QgaW1wYWN0IEFTQVAgYmVjYXVzZSBTYWZhcmkgNi4wIHN1cHBvcnRzXG5cdC8vIG11dGF0aW9uIG9ic2VydmVycywgc28gdGhhdCBpbXBsZW1lbnRhdGlvbiBpcyB1c2VkIGluc3RlYWQuXG5cdC8vIEhvd2V2ZXIsIGlmIHdlIGV2ZXIgZWxlY3QgdG8gdXNlIHRpbWVycyBpbiBTYWZhcmksIHRoZSBwcmV2YWxlbnQgd29yay1hcm91bmRcblx0Ly8gaXMgdG8gYWRkIGEgc2Nyb2xsIGV2ZW50IGxpc3RlbmVyIHRoYXQgY2FsbHMgZm9yIGEgZmx1c2guXG5cblx0Ly8gYHNldFRpbWVvdXRgIGRvZXMgbm90IGNhbGwgdGhlIHBhc3NlZCBjYWxsYmFjayBpZiB0aGUgZGVsYXkgaXMgbGVzcyB0aGFuXG5cdC8vIGFwcHJveGltYXRlbHkgNyBpbiB3ZWIgd29ya2VycyBpbiBGaXJlZm94IDggdGhyb3VnaCAxOCwgYW5kIHNvbWV0aW1lcyBub3Rcblx0Ly8gZXZlbiB0aGVuLlxuXG5cdGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcihjYWxsYmFjaykge1xuXHQgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQgICAgICAgIC8vIFdlIGRpc3BhdGNoIGEgdGltZW91dCB3aXRoIGEgc3BlY2lmaWVkIGRlbGF5IG9mIDAgZm9yIGVuZ2luZXMgdGhhdFxuXHQgICAgICAgIC8vIGNhbiByZWxpYWJseSBhY2NvbW1vZGF0ZSB0aGF0IHJlcXVlc3QuIFRoaXMgd2lsbCB1c3VhbGx5IGJlIHNuYXBwZWRcblx0ICAgICAgICAvLyB0byBhIDQgbWlsaXNlY29uZCBkZWxheSwgYnV0IG9uY2Ugd2UncmUgZmx1c2hpbmcsIHRoZXJlJ3Mgbm8gZGVsYXlcblx0ICAgICAgICAvLyBiZXR3ZWVuIGV2ZW50cy5cblx0ICAgICAgICB2YXIgdGltZW91dEhhbmRsZSA9IHNldFRpbWVvdXQoaGFuZGxlVGltZXIsIDApO1xuXHQgICAgICAgIC8vIEhvd2V2ZXIsIHNpbmNlIHRoaXMgdGltZXIgZ2V0cyBmcmVxdWVudGx5IGRyb3BwZWQgaW4gRmlyZWZveFxuXHQgICAgICAgIC8vIHdvcmtlcnMsIHdlIGVubGlzdCBhbiBpbnRlcnZhbCBoYW5kbGUgdGhhdCB3aWxsIHRyeSB0byBmaXJlXG5cdCAgICAgICAgLy8gYW4gZXZlbnQgMjAgdGltZXMgcGVyIHNlY29uZCB1bnRpbCBpdCBzdWNjZWVkcy5cblx0ICAgICAgICB2YXIgaW50ZXJ2YWxIYW5kbGUgPSBzZXRJbnRlcnZhbChoYW5kbGVUaW1lciwgNTApO1xuXG5cdCAgICAgICAgZnVuY3Rpb24gaGFuZGxlVGltZXIoKSB7XG5cdCAgICAgICAgICAgIC8vIFdoaWNoZXZlciB0aW1lciBzdWNjZWVkcyB3aWxsIGNhbmNlbCBib3RoIHRpbWVycyBhbmRcblx0ICAgICAgICAgICAgLy8gZXhlY3V0ZSB0aGUgY2FsbGJhY2suXG5cdCAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SGFuZGxlKTtcblx0ICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbEhhbmRsZSk7XG5cdCAgICAgICAgICAgIGNhbGxiYWNrKCk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblx0fVxuXG5cdC8vIFRoaXMgaXMgZm9yIGBhc2FwLmpzYCBvbmx5LlxuXHQvLyBJdHMgbmFtZSB3aWxsIGJlIHBlcmlvZGljYWxseSByYW5kb21pemVkIHRvIGJyZWFrIGFueSBjb2RlIHRoYXQgZGVwZW5kcyBvblxuXHQvLyBpdHMgZXhpc3RlbmNlLlxuXHRyYXdBc2FwLm1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lciA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcjtcblxuXHQvLyBBU0FQIHdhcyBvcmlnaW5hbGx5IGEgbmV4dFRpY2sgc2hpbSBpbmNsdWRlZCBpbiBRLiBUaGlzIHdhcyBmYWN0b3JlZCBvdXRcblx0Ly8gaW50byB0aGlzIEFTQVAgcGFja2FnZS4gSXQgd2FzIGxhdGVyIGFkYXB0ZWQgdG8gUlNWUCB3aGljaCBtYWRlIGZ1cnRoZXJcblx0Ly8gYW1lbmRtZW50cy4gVGhlc2UgZGVjaXNpb25zLCBwYXJ0aWN1bGFybHkgdG8gbWFyZ2luYWxpemUgTWVzc2FnZUNoYW5uZWwgYW5kXG5cdC8vIHRvIGNhcHR1cmUgdGhlIE11dGF0aW9uT2JzZXJ2ZXIgaW1wbGVtZW50YXRpb24gaW4gYSBjbG9zdXJlLCB3ZXJlIGludGVncmF0ZWRcblx0Ly8gYmFjayBpbnRvIEFTQVAgcHJvcGVyLlxuXHQvLyBodHRwczovL2dpdGh1Yi5jb20vdGlsZGVpby9yc3ZwLmpzL2Jsb2IvY2RkZjcyMzI1NDZhOWNmODU4NTI0Yjc1Y2RlNmY5ZWRmNzI2MjBhNy9saWIvcnN2cC9hc2FwLmpzXG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKGV4cG9ydHMsIChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0oKSkpKVxuXG4vKioqLyB9KSxcbi8qIDYgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0Ly8gQSBzaW1wbGUgY2xhc3Mgc3lzdGVtLCBtb3JlIGRvY3VtZW50YXRpb24gdG8gY29tZVxuXG5cdGZ1bmN0aW9uIGV4dGVuZChjbHMsIG5hbWUsIHByb3BzKSB7XG5cdCAgICAvLyBUaGlzIGRvZXMgdGhhdCBzYW1lIHRoaW5nIGFzIE9iamVjdC5jcmVhdGUsIGJ1dCB3aXRoIHN1cHBvcnQgZm9yIElFOFxuXHQgICAgdmFyIEYgPSBmdW5jdGlvbigpIHt9O1xuXHQgICAgRi5wcm90b3R5cGUgPSBjbHMucHJvdG90eXBlO1xuXHQgICAgdmFyIHByb3RvdHlwZSA9IG5ldyBGKCk7XG5cblx0ICAgIC8vIGpzaGludCB1bmRlZjogZmFsc2Vcblx0ICAgIHZhciBmblRlc3QgPSAveHl6Ly50ZXN0KGZ1bmN0aW9uKCl7IHh5ejsgfSkgPyAvXFxicGFyZW50XFxiLyA6IC8uKi87XG5cdCAgICBwcm9wcyA9IHByb3BzIHx8IHt9O1xuXG5cdCAgICBmb3IodmFyIGsgaW4gcHJvcHMpIHtcblx0ICAgICAgICB2YXIgc3JjID0gcHJvcHNba107XG5cdCAgICAgICAgdmFyIHBhcmVudCA9IHByb3RvdHlwZVtrXTtcblxuXHQgICAgICAgIGlmKHR5cGVvZiBwYXJlbnQgPT09ICdmdW5jdGlvbicgJiZcblx0ICAgICAgICAgICB0eXBlb2Ygc3JjID09PSAnZnVuY3Rpb24nICYmXG5cdCAgICAgICAgICAgZm5UZXN0LnRlc3Qoc3JjKSkge1xuXHQgICAgICAgICAgICAvKmpzaGludCAtVzA4MyAqL1xuXHQgICAgICAgICAgICBwcm90b3R5cGVba10gPSAoZnVuY3Rpb24gKHNyYywgcGFyZW50KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgY3VycmVudCBwYXJlbnQgbWV0aG9kXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHRtcCA9IHRoaXMucGFyZW50O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHBhcmVudCB0byB0aGUgcHJldmlvdXMgbWV0aG9kLCBjYWxsLCBhbmQgcmVzdG9yZVxuXHQgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciByZXMgPSBzcmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IHRtcDtcblxuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG5cdCAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9KShzcmMsIHBhcmVudCk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBwcm90b3R5cGVba10gPSBzcmM7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBwcm90b3R5cGUudHlwZW5hbWUgPSBuYW1lO1xuXG5cdCAgICB2YXIgbmV3X2NscyA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmKHByb3RvdHlwZS5pbml0KSB7XG5cdCAgICAgICAgICAgIHByb3RvdHlwZS5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgbmV3X2Nscy5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG5cdCAgICBuZXdfY2xzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IG5ld19jbHM7XG5cblx0ICAgIG5ld19jbHMuZXh0ZW5kID0gZnVuY3Rpb24obmFtZSwgcHJvcHMpIHtcblx0ICAgICAgICBpZih0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcblx0ICAgICAgICAgICAgcHJvcHMgPSBuYW1lO1xuXHQgICAgICAgICAgICBuYW1lID0gJ2Fub255bW91cyc7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBleHRlbmQobmV3X2NscywgbmFtZSwgcHJvcHMpO1xuXHQgICAgfTtcblxuXHQgICAgcmV0dXJuIG5ld19jbHM7XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZChPYmplY3QsICdPYmplY3QnLCB7fSk7XG5cblxuLyoqKi8gfSksXG4vKiA3ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgciA9IF9fd2VicGFja19yZXF1aXJlX18oOCk7XG5cblx0ZnVuY3Rpb24gbm9ybWFsaXplKHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcblx0ICAgIGlmKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB2YWx1ZTtcblx0fVxuXG5cdHZhciBmaWx0ZXJzID0ge1xuXHQgICAgYWJzOiBNYXRoLmFicyxcblxuXHQgICAgYmF0Y2g6IGZ1bmN0aW9uKGFyciwgbGluZWNvdW50LCBmaWxsX3dpdGgpIHtcblx0ICAgICAgICB2YXIgaTtcblx0ICAgICAgICB2YXIgcmVzID0gW107XG5cdCAgICAgICAgdmFyIHRtcCA9IFtdO1xuXG5cdCAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGlmKGkgJSBsaW5lY291bnQgPT09IDAgJiYgdG1wLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgcmVzLnB1c2godG1wKTtcblx0ICAgICAgICAgICAgICAgIHRtcCA9IFtdO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdG1wLnB1c2goYXJyW2ldKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZih0bXAubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIGlmKGZpbGxfd2l0aCkge1xuXHQgICAgICAgICAgICAgICAgZm9yKGkgPSB0bXAubGVuZ3RoOyBpIDwgbGluZWNvdW50OyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICB0bXAucHVzaChmaWxsX3dpdGgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmVzLnB1c2godG1wKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gcmVzO1xuXHQgICAgfSxcblxuXHQgICAgY2FwaXRhbGl6ZTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHZhciByZXQgPSBzdHIudG9Mb3dlckNhc2UoKTtcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyByZXQuc2xpY2UoMSkpO1xuXHQgICAgfSxcblxuXHQgICAgY2VudGVyOiBmdW5jdGlvbihzdHIsIHdpZHRoKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHdpZHRoID0gd2lkdGggfHwgODA7XG5cblx0ICAgICAgICBpZihzdHIubGVuZ3RoID49IHdpZHRoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHNwYWNlcyA9IHdpZHRoIC0gc3RyLmxlbmd0aDtcblx0ICAgICAgICB2YXIgcHJlID0gbGliLnJlcGVhdCgnICcsIHNwYWNlcy8yIC0gc3BhY2VzICUgMik7XG5cdCAgICAgICAgdmFyIHBvc3QgPSBsaWIucmVwZWF0KCcgJywgc3BhY2VzLzIpO1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHByZSArIHN0ciArIHBvc3QpO1xuXHQgICAgfSxcblxuXHQgICAgJ2RlZmF1bHQnOiBmdW5jdGlvbih2YWwsIGRlZiwgYm9vbCkge1xuXHQgICAgICAgIGlmKGJvb2wpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhbCA/IHZhbCA6IGRlZjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHJldHVybiAodmFsICE9PSB1bmRlZmluZWQpID8gdmFsIDogZGVmO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGRpY3Rzb3J0OiBmdW5jdGlvbih2YWwsIGNhc2Vfc2Vuc2l0aXZlLCBieSkge1xuXHQgICAgICAgIGlmICghbGliLmlzT2JqZWN0KHZhbCkpIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKCdkaWN0c29ydCBmaWx0ZXI6IHZhbCBtdXN0IGJlIGFuIG9iamVjdCcpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBhcnJheSA9IFtdO1xuXHQgICAgICAgIGZvciAodmFyIGsgaW4gdmFsKSB7XG5cdCAgICAgICAgICAgIC8vIGRlbGliZXJhdGVseSBpbmNsdWRlIHByb3BlcnRpZXMgZnJvbSB0aGUgb2JqZWN0J3MgcHJvdG90eXBlXG5cdCAgICAgICAgICAgIGFycmF5LnB1c2goW2ssdmFsW2tdXSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHNpO1xuXHQgICAgICAgIGlmIChieSA9PT0gdW5kZWZpbmVkIHx8IGJ5ID09PSAna2V5Jykge1xuXHQgICAgICAgICAgICBzaSA9IDA7XG5cdCAgICAgICAgfSBlbHNlIGlmIChieSA9PT0gJ3ZhbHVlJykge1xuXHQgICAgICAgICAgICBzaSA9IDE7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKFxuXHQgICAgICAgICAgICAgICAgJ2RpY3Rzb3J0IGZpbHRlcjogWW91IGNhbiBvbmx5IHNvcnQgYnkgZWl0aGVyIGtleSBvciB2YWx1ZScpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGFycmF5LnNvcnQoZnVuY3Rpb24odDEsIHQyKSB7XG5cdCAgICAgICAgICAgIHZhciBhID0gdDFbc2ldO1xuXHQgICAgICAgICAgICB2YXIgYiA9IHQyW3NpXTtcblxuXHQgICAgICAgICAgICBpZiAoIWNhc2Vfc2Vuc2l0aXZlKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAobGliLmlzU3RyaW5nKGEpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYSA9IGEudG9VcHBlckNhc2UoKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGlmIChsaWIuaXNTdHJpbmcoYikpIHtcblx0ICAgICAgICAgICAgICAgICAgICBiID0gYi50b1VwcGVyQ2FzZSgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIGEgPiBiID8gMSA6IChhID09PSBiID8gMCA6IC0xKTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiBhcnJheTtcblx0ICAgIH0sXG5cblx0ICAgIGR1bXA6IGZ1bmN0aW9uKG9iaiwgc3BhY2VzKSB7XG5cdCAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgc3BhY2VzKTtcblx0ICAgIH0sXG5cblx0ICAgIGVzY2FwZTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgaWYoc3RyIGluc3RhbmNlb2Ygci5TYWZlU3RyaW5nKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHN0ciA9IChzdHIgPT09IG51bGwgfHwgc3RyID09PSB1bmRlZmluZWQpID8gJycgOiBzdHI7XG5cdCAgICAgICAgcmV0dXJuIHIubWFya1NhZmUobGliLmVzY2FwZShzdHIudG9TdHJpbmcoKSkpO1xuXHQgICAgfSxcblxuXHQgICAgc2FmZTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgaWYgKHN0ciBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykge1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBzdHIgPSAoc3RyID09PSBudWxsIHx8IHN0ciA9PT0gdW5kZWZpbmVkKSA/ICcnIDogc3RyO1xuXHQgICAgICAgIHJldHVybiByLm1hcmtTYWZlKHN0ci50b1N0cmluZygpKTtcblx0ICAgIH0sXG5cblx0ICAgIGZpcnN0OiBmdW5jdGlvbihhcnIpIHtcblx0ICAgICAgICByZXR1cm4gYXJyWzBdO1xuXHQgICAgfSxcblxuXHQgICAgZ3JvdXBieTogZnVuY3Rpb24oYXJyLCBhdHRyKSB7XG5cdCAgICAgICAgcmV0dXJuIGxpYi5ncm91cEJ5KGFyciwgYXR0cik7XG5cdCAgICB9LFxuXG5cdCAgICBpbmRlbnQ6IGZ1bmN0aW9uKHN0ciwgd2lkdGgsIGluZGVudGZpcnN0KSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXG5cdCAgICAgICAgaWYgKHN0ciA9PT0gJycpIHJldHVybiAnJztcblxuXHQgICAgICAgIHdpZHRoID0gd2lkdGggfHwgNDtcblx0ICAgICAgICB2YXIgcmVzID0gJyc7XG5cdCAgICAgICAgdmFyIGxpbmVzID0gc3RyLnNwbGl0KCdcXG4nKTtcblx0ICAgICAgICB2YXIgc3AgPSBsaWIucmVwZWF0KCcgJywgd2lkdGgpO1xuXG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8bGluZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgaWYoaSA9PT0gMCAmJiAhaW5kZW50Zmlyc3QpIHtcblx0ICAgICAgICAgICAgICAgIHJlcyArPSBsaW5lc1tpXSArICdcXG4nO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcmVzICs9IHNwICsgbGluZXNbaV0gKyAnXFxuJztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHJlcyk7XG5cdCAgICB9LFxuXG5cdCAgICBqb2luOiBmdW5jdGlvbihhcnIsIGRlbCwgYXR0cikge1xuXHQgICAgICAgIGRlbCA9IGRlbCB8fCAnJztcblxuXHQgICAgICAgIGlmKGF0dHIpIHtcblx0ICAgICAgICAgICAgYXJyID0gbGliLm1hcChhcnIsIGZ1bmN0aW9uKHYpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB2W2F0dHJdO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gYXJyLmpvaW4oZGVsKTtcblx0ICAgIH0sXG5cblx0ICAgIGxhc3Q6IGZ1bmN0aW9uKGFycikge1xuXHQgICAgICAgIHJldHVybiBhcnJbYXJyLmxlbmd0aC0xXTtcblx0ICAgIH0sXG5cblx0ICAgIGxlbmd0aDogZnVuY3Rpb24odmFsKSB7XG5cdCAgICAgICAgdmFyIHZhbHVlID0gbm9ybWFsaXplKHZhbCwgJycpO1xuXG5cdCAgICAgICAgaWYodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICBpZihcblx0ICAgICAgICAgICAgICAgICh0eXBlb2YgTWFwID09PSAnZnVuY3Rpb24nICYmIHZhbHVlIGluc3RhbmNlb2YgTWFwKSB8fFxuXHQgICAgICAgICAgICAgICAgKHR5cGVvZiBTZXQgPT09ICdmdW5jdGlvbicgJiYgdmFsdWUgaW5zdGFuY2VvZiBTZXQpXG5cdCAgICAgICAgICAgICkge1xuXHQgICAgICAgICAgICAgICAgLy8gRUNNQVNjcmlwdCAyMDE1IE1hcHMgYW5kIFNldHNcblx0ICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5zaXplO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmKGxpYi5pc09iamVjdCh2YWx1ZSkgJiYgISh2YWx1ZSBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykpIHtcblx0ICAgICAgICAgICAgICAgIC8vIE9iamVjdHMgKGJlc2lkZXMgU2FmZVN0cmluZ3MpLCBub24tcHJpbWF0aXZlIEFycmF5c1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGg7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIDA7XG5cdCAgICB9LFxuXG5cdCAgICBsaXN0OiBmdW5jdGlvbih2YWwpIHtcblx0ICAgICAgICBpZihsaWIuaXNTdHJpbmcodmFsKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFsLnNwbGl0KCcnKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihsaWIuaXNPYmplY3QodmFsKSkge1xuXHQgICAgICAgICAgICB2YXIga2V5cyA9IFtdO1xuXG5cdCAgICAgICAgICAgIGlmKE9iamVjdC5rZXlzKSB7XG5cdCAgICAgICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXModmFsKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIGZvcih2YXIgayBpbiB2YWwpIHtcblx0ICAgICAgICAgICAgICAgICAgICBrZXlzLnB1c2goayk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gbGliLm1hcChrZXlzLCBmdW5jdGlvbihrKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4geyBrZXk6IGssXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsW2tdIH07XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKGxpYi5pc0FycmF5KHZhbCkpIHtcblx0ICAgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoJ2xpc3QgZmlsdGVyOiB0eXBlIG5vdCBpdGVyYWJsZScpO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGxvd2VyOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpO1xuXHQgICAgfSxcblxuXHQgICAgbmwyYnI6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIGlmIChzdHIgPT09IG51bGwgfHwgc3RyID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuICcnO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCBzdHIucmVwbGFjZSgvXFxyXFxufFxcbi9nLCAnPGJyIC8+XFxuJykpO1xuXHQgICAgfSxcblxuXHQgICAgcmFuZG9tOiBmdW5jdGlvbihhcnIpIHtcblx0ICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcblx0ICAgIH0sXG5cblx0ICAgIHJlamVjdGF0dHI6IGZ1bmN0aW9uKGFyciwgYXR0cikge1xuXHQgICAgICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuXHQgICAgICAgIHJldHVybiAhaXRlbVthdHRyXTtcblx0ICAgICAgfSk7XG5cdCAgICB9LFxuXG5cdCAgICBzZWxlY3RhdHRyOiBmdW5jdGlvbihhcnIsIGF0dHIpIHtcblx0ICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcblx0ICAgICAgICByZXR1cm4gISFpdGVtW2F0dHJdO1xuXHQgICAgICB9KTtcblx0ICAgIH0sXG5cblx0ICAgIHJlcGxhY2U6IGZ1bmN0aW9uKHN0ciwgb2xkLCBuZXdfLCBtYXhDb3VudCkge1xuXHQgICAgICAgIHZhciBvcmlnaW5hbFN0ciA9IHN0cjtcblxuXHQgICAgICAgIGlmIChvbGQgaW5zdGFuY2VvZiBSZWdFeHApIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKG9sZCwgbmV3Xyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYodHlwZW9mIG1heENvdW50ID09PSAndW5kZWZpbmVkJyl7XG5cdCAgICAgICAgICAgIG1heENvdW50ID0gLTE7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHJlcyA9ICcnOyAgLy8gT3V0cHV0XG5cblx0ICAgICAgICAvLyBDYXN0IE51bWJlcnMgaW4gdGhlIHNlYXJjaCB0ZXJtIHRvIHN0cmluZ1xuXHQgICAgICAgIGlmKHR5cGVvZiBvbGQgPT09ICdudW1iZXInKXtcblx0ICAgICAgICAgICAgb2xkID0gb2xkICsgJyc7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYodHlwZW9mIG9sZCAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgLy8gSWYgaXQgaXMgc29tZXRoaW5nIG90aGVyIHRoYW4gbnVtYmVyIG9yIHN0cmluZyxcblx0ICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSBvcmlnaW5hbCBzdHJpbmdcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBDYXN0IG51bWJlcnMgaW4gdGhlIHJlcGxhY2VtZW50IHRvIHN0cmluZ1xuXHQgICAgICAgIGlmKHR5cGVvZiBzdHIgPT09ICdudW1iZXInKXtcblx0ICAgICAgICAgICAgc3RyID0gc3RyICsgJyc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gSWYgYnkgbm93LCB3ZSBkb24ndCBoYXZlIGEgc3RyaW5nLCB0aHJvdyBpdCBiYWNrXG5cdCAgICAgICAgaWYodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycgJiYgIShzdHIgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpKXtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBTaG9ydENpcmN1aXRzXG5cdCAgICAgICAgaWYob2xkID09PSAnJyl7XG5cdCAgICAgICAgICAgIC8vIE1pbWljIHRoZSBweXRob24gYmVoYXZpb3VyOiBlbXB0eSBzdHJpbmcgaXMgcmVwbGFjZWRcblx0ICAgICAgICAgICAgLy8gYnkgcmVwbGFjZW1lbnQgZS5nLiBcImFiY1wifHJlcGxhY2UoXCJcIiwgXCIuXCIpIC0+IC5hLmIuYy5cblx0ICAgICAgICAgICAgcmVzID0gbmV3XyArIHN0ci5zcGxpdCgnJykuam9pbihuZXdfKSArIG5ld187XG5cdCAgICAgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHJlcyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIG5leHRJbmRleCA9IHN0ci5pbmRleE9mKG9sZCk7XG5cdCAgICAgICAgLy8gaWYgIyBvZiByZXBsYWNlbWVudHMgdG8gcGVyZm9ybSBpcyAwLCBvciB0aGUgc3RyaW5nIHRvIGRvZXNcblx0ICAgICAgICAvLyBub3QgY29udGFpbiB0aGUgb2xkIHZhbHVlLCByZXR1cm4gdGhlIHN0cmluZ1xuXHQgICAgICAgIGlmKG1heENvdW50ID09PSAwIHx8IG5leHRJbmRleCA9PT0gLTEpe1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBwb3MgPSAwO1xuXHQgICAgICAgIHZhciBjb3VudCA9IDA7IC8vICMgb2YgcmVwbGFjZW1lbnRzIG1hZGVcblxuXHQgICAgICAgIHdoaWxlKG5leHRJbmRleCAgPiAtMSAmJiAobWF4Q291bnQgPT09IC0xIHx8IGNvdW50IDwgbWF4Q291bnQpKXtcblx0ICAgICAgICAgICAgLy8gR3JhYiB0aGUgbmV4dCBjaHVuayBvZiBzcmMgc3RyaW5nIGFuZCBhZGQgaXQgd2l0aCB0aGVcblx0ICAgICAgICAgICAgLy8gcmVwbGFjZW1lbnQsIHRvIHRoZSByZXN1bHRcblx0ICAgICAgICAgICAgcmVzICs9IHN0ci5zdWJzdHJpbmcocG9zLCBuZXh0SW5kZXgpICsgbmV3Xztcblx0ICAgICAgICAgICAgLy8gSW5jcmVtZW50IG91ciBwb2ludGVyIGluIHRoZSBzcmMgc3RyaW5nXG5cdCAgICAgICAgICAgIHBvcyA9IG5leHRJbmRleCArIG9sZC5sZW5ndGg7XG5cdCAgICAgICAgICAgIGNvdW50Kys7XG5cdCAgICAgICAgICAgIC8vIFNlZSBpZiB0aGVyZSBhcmUgYW55IG1vcmUgcmVwbGFjZW1lbnRzIHRvIGJlIG1hZGVcblx0ICAgICAgICAgICAgbmV4dEluZGV4ID0gc3RyLmluZGV4T2Yob2xkLCBwb3MpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIFdlJ3ZlIGVpdGhlciByZWFjaGVkIHRoZSBlbmQsIG9yIGRvbmUgdGhlIG1heCAjIG9mXG5cdCAgICAgICAgLy8gcmVwbGFjZW1lbnRzLCB0YWNrIG9uIGFueSByZW1haW5pbmcgc3RyaW5nXG5cdCAgICAgICAgaWYocG9zIDwgc3RyLmxlbmd0aCkge1xuXHQgICAgICAgICAgICByZXMgKz0gc3RyLnN1YnN0cmluZyhwb3MpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhvcmlnaW5hbFN0ciwgcmVzKTtcblx0ICAgIH0sXG5cblx0ICAgIHJldmVyc2U6IGZ1bmN0aW9uKHZhbCkge1xuXHQgICAgICAgIHZhciBhcnI7XG5cdCAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICAgICAgYXJyID0gZmlsdGVycy5saXN0KHZhbCk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAvLyBDb3B5IGl0XG5cdCAgICAgICAgICAgIGFyciA9IGxpYi5tYXAodmFsLCBmdW5jdGlvbih2KSB7IHJldHVybiB2OyB9KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBhcnIucmV2ZXJzZSgpO1xuXG5cdCAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHZhbCwgYXJyLmpvaW4oJycpKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGFycjtcblx0ICAgIH0sXG5cblx0ICAgIHJvdW5kOiBmdW5jdGlvbih2YWwsIHByZWNpc2lvbiwgbWV0aG9kKSB7XG5cdCAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uIHx8IDA7XG5cdCAgICAgICAgdmFyIGZhY3RvciA9IE1hdGgucG93KDEwLCBwcmVjaXNpb24pO1xuXHQgICAgICAgIHZhciByb3VuZGVyO1xuXG5cdCAgICAgICAgaWYobWV0aG9kID09PSAnY2VpbCcpIHtcblx0ICAgICAgICAgICAgcm91bmRlciA9IE1hdGguY2VpbDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihtZXRob2QgPT09ICdmbG9vcicpIHtcblx0ICAgICAgICAgICAgcm91bmRlciA9IE1hdGguZmxvb3I7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICByb3VuZGVyID0gTWF0aC5yb3VuZDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gcm91bmRlcih2YWwgKiBmYWN0b3IpIC8gZmFjdG9yO1xuXHQgICAgfSxcblxuXHQgICAgc2xpY2U6IGZ1bmN0aW9uKGFyciwgc2xpY2VzLCBmaWxsV2l0aCkge1xuXHQgICAgICAgIHZhciBzbGljZUxlbmd0aCA9IE1hdGguZmxvb3IoYXJyLmxlbmd0aCAvIHNsaWNlcyk7XG5cdCAgICAgICAgdmFyIGV4dHJhID0gYXJyLmxlbmd0aCAlIHNsaWNlcztcblx0ICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcblx0ICAgICAgICB2YXIgcmVzID0gW107XG5cblx0ICAgICAgICBmb3IodmFyIGk9MDsgaTxzbGljZXM7IGkrKykge1xuXHQgICAgICAgICAgICB2YXIgc3RhcnQgPSBvZmZzZXQgKyBpICogc2xpY2VMZW5ndGg7XG5cdCAgICAgICAgICAgIGlmKGkgPCBleHRyYSkge1xuXHQgICAgICAgICAgICAgICAgb2Zmc2V0Kys7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgdmFyIGVuZCA9IG9mZnNldCArIChpICsgMSkgKiBzbGljZUxlbmd0aDtcblxuXHQgICAgICAgICAgICB2YXIgc2xpY2UgPSBhcnIuc2xpY2Uoc3RhcnQsIGVuZCk7XG5cdCAgICAgICAgICAgIGlmKGZpbGxXaXRoICYmIGkgPj0gZXh0cmEpIHtcblx0ICAgICAgICAgICAgICAgIHNsaWNlLnB1c2goZmlsbFdpdGgpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJlcy5wdXNoKHNsaWNlKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gcmVzO1xuXHQgICAgfSxcblxuXHQgICAgc3VtOiBmdW5jdGlvbihhcnIsIGF0dHIsIHN0YXJ0KSB7XG5cdCAgICAgICAgdmFyIHN1bSA9IDA7XG5cblx0ICAgICAgICBpZih0eXBlb2Ygc3RhcnQgPT09ICdudW1iZXInKXtcblx0ICAgICAgICAgICAgc3VtICs9IHN0YXJ0O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKGF0dHIpIHtcblx0ICAgICAgICAgICAgYXJyID0gbGliLm1hcChhcnIsIGZ1bmN0aW9uKHYpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB2W2F0dHJdO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIHN1bSArPSBhcnJbaV07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHN1bTtcblx0ICAgIH0sXG5cblx0ICAgIHNvcnQ6IHIubWFrZU1hY3JvKFsndmFsdWUnLCAncmV2ZXJzZScsICdjYXNlX3NlbnNpdGl2ZScsICdhdHRyaWJ1dGUnXSwgW10sIGZ1bmN0aW9uKGFyciwgcmV2ZXJzZSwgY2FzZVNlbnMsIGF0dHIpIHtcblx0ICAgICAgICAgLy8gQ29weSBpdFxuXHQgICAgICAgIGFyciA9IGxpYi5tYXAoYXJyLCBmdW5jdGlvbih2KSB7IHJldHVybiB2OyB9KTtcblxuXHQgICAgICAgIGFyci5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcblx0ICAgICAgICAgICAgdmFyIHgsIHk7XG5cblx0ICAgICAgICAgICAgaWYoYXR0cikge1xuXHQgICAgICAgICAgICAgICAgeCA9IGFbYXR0cl07XG5cdCAgICAgICAgICAgICAgICB5ID0gYlthdHRyXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHggPSBhO1xuXHQgICAgICAgICAgICAgICAgeSA9IGI7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZighY2FzZVNlbnMgJiYgbGliLmlzU3RyaW5nKHgpICYmIGxpYi5pc1N0cmluZyh5KSkge1xuXHQgICAgICAgICAgICAgICAgeCA9IHgudG9Mb3dlckNhc2UoKTtcblx0ICAgICAgICAgICAgICAgIHkgPSB5LnRvTG93ZXJDYXNlKCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZih4IDwgeSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHJldmVyc2UgPyAxIDogLTE7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZih4ID4geSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHJldmVyc2UgPyAtMTogMTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiAwO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gYXJyO1xuXHQgICAgfSksXG5cblx0ICAgIHN0cmluZzogZnVuY3Rpb24ob2JqKSB7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKG9iaiwgb2JqKTtcblx0ICAgIH0sXG5cblx0ICAgIHN0cmlwdGFnczogZnVuY3Rpb24oaW5wdXQsIHByZXNlcnZlX2xpbmVicmVha3MpIHtcblx0ICAgICAgICBpbnB1dCA9IG5vcm1hbGl6ZShpbnB1dCwgJycpO1xuXHQgICAgICAgIHByZXNlcnZlX2xpbmVicmVha3MgPSBwcmVzZXJ2ZV9saW5lYnJlYWtzIHx8IGZhbHNlO1xuXHQgICAgICAgIHZhciB0YWdzID0gLzxcXC8/KFthLXpdW2EtejAtOV0qKVxcYltePl0qPnw8IS0tW1xcc1xcU10qPy0tPi9naTtcblx0ICAgICAgICB2YXIgdHJpbW1lZElucHV0ID0gZmlsdGVycy50cmltKGlucHV0LnJlcGxhY2UodGFncywgJycpKTtcblx0ICAgICAgICB2YXIgcmVzID0gJyc7XG5cdCAgICAgICAgaWYgKHByZXNlcnZlX2xpbmVicmVha3MpIHtcblx0ICAgICAgICAgICAgcmVzID0gdHJpbW1lZElucHV0XG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvXiArfCArJC9nbSwgJycpICAgICAvLyByZW1vdmUgbGVhZGluZyBhbmQgdHJhaWxpbmcgc3BhY2VzXG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvICsvZywgJyAnKSAgICAgICAgICAvLyBzcXVhc2ggYWRqYWNlbnQgc3BhY2VzXG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvKFxcclxcbikvZywgJ1xcbicpICAgICAvLyBub3JtYWxpemUgbGluZWJyZWFrcyAoQ1JMRiAtPiBMRilcblx0ICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXG5cXG5cXG4rL2csICdcXG5cXG4nKTsgLy8gc3F1YXNoIGFibm9ybWFsIGFkamFjZW50IGxpbmVicmVha3Ncblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICByZXMgPSB0cmltbWVkSW5wdXQucmVwbGFjZSgvXFxzKy9naSwgJyAnKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKGlucHV0LCByZXMpO1xuXHQgICAgfSxcblxuXHQgICAgdGl0bGU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB2YXIgd29yZHMgPSBzdHIuc3BsaXQoJyAnKTtcblx0ICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgd29yZHMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgd29yZHNbaV0gPSBmaWx0ZXJzLmNhcGl0YWxpemUod29yZHNbaV0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCB3b3Jkcy5qb2luKCcgJykpO1xuXHQgICAgfSxcblxuXHQgICAgdHJpbTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgc3RyLnJlcGxhY2UoL15cXHMqfFxccyokL2csICcnKSk7XG5cdCAgICB9LFxuXG5cdCAgICB0cnVuY2F0ZTogZnVuY3Rpb24oaW5wdXQsIGxlbmd0aCwga2lsbHdvcmRzLCBlbmQpIHtcblx0ICAgICAgICB2YXIgb3JpZyA9IGlucHV0O1xuXHQgICAgICAgIGlucHV0ID0gbm9ybWFsaXplKGlucHV0LCAnJyk7XG5cdCAgICAgICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDI1NTtcblxuXHQgICAgICAgIGlmIChpbnB1dC5sZW5ndGggPD0gbGVuZ3RoKVxuXHQgICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG5cblx0ICAgICAgICBpZiAoa2lsbHdvcmRzKSB7XG5cdCAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyaW5nKDAsIGxlbmd0aCk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIGlkeCA9IGlucHV0Lmxhc3RJbmRleE9mKCcgJywgbGVuZ3RoKTtcblx0ICAgICAgICAgICAgaWYoaWR4ID09PSAtMSkge1xuXHQgICAgICAgICAgICAgICAgaWR4ID0gbGVuZ3RoO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgaWR4KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpbnB1dCArPSAoZW5kICE9PSB1bmRlZmluZWQgJiYgZW5kICE9PSBudWxsKSA/IGVuZCA6ICcuLi4nO1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhvcmlnLCBpbnB1dCk7XG5cdCAgICB9LFxuXG5cdCAgICB1cHBlcjogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHJldHVybiBzdHIudG9VcHBlckNhc2UoKTtcblx0ICAgIH0sXG5cblx0ICAgIHVybGVuY29kZTogZnVuY3Rpb24ob2JqKSB7XG5cdCAgICAgICAgdmFyIGVuYyA9IGVuY29kZVVSSUNvbXBvbmVudDtcblx0ICAgICAgICBpZiAobGliLmlzU3RyaW5nKG9iaikpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGVuYyhvYmopO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBwYXJ0cztcblx0ICAgICAgICAgICAgaWYgKGxpYi5pc0FycmF5KG9iaikpIHtcblx0ICAgICAgICAgICAgICAgIHBhcnRzID0gb2JqLm1hcChmdW5jdGlvbihpdGVtKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuYyhpdGVtWzBdKSArICc9JyArIGVuYyhpdGVtWzFdKTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcGFydHMgPSBbXTtcblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKGVuYyhrKSArICc9JyArIGVuYyhvYmpba10pKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oJyYnKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICB1cmxpemU6IGZ1bmN0aW9uKHN0ciwgbGVuZ3RoLCBub2ZvbGxvdykge1xuXHQgICAgICAgIGlmIChpc05hTihsZW5ndGgpKSBsZW5ndGggPSBJbmZpbml0eTtcblxuXHQgICAgICAgIHZhciBub0ZvbGxvd0F0dHIgPSAobm9mb2xsb3cgPT09IHRydWUgPyAnIHJlbD1cIm5vZm9sbG93XCInIDogJycpO1xuXG5cdCAgICAgICAgLy8gRm9yIHRoZSBqaW5qYSByZWdleHAsIHNlZVxuXHQgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9taXRzdWhpa28vamluamEyL2Jsb2IvZjE1YjgxNGRjYmE2YWExMmJjNzRkMWY3ZDBjODgxZDU1ZjcxMjZiZS9qaW5qYTIvdXRpbHMucHkjTDIwLUwyM1xuXHQgICAgICAgIHZhciBwdW5jUkUgPSAvXig/OlxcKHw8fCZsdDspPyguKj8pKD86XFwufCx8XFwpfFxcbnwmZ3Q7KT8kLztcblx0ICAgICAgICAvLyBmcm9tIGh0dHA6Ly9ibG9nLmdlcnYubmV0LzIwMTEvMDUvaHRtbDVfZW1haWxfYWRkcmVzc19yZWdleHAvXG5cdCAgICAgICAgdmFyIGVtYWlsUkUgPSAvXltcXHcuISMkJSYnKitcXC1cXC89P1xcXmB7fH1+XStAW2EtelxcZFxcLV0rKFxcLlthLXpcXGRcXC1dKykrJC9pO1xuXHQgICAgICAgIHZhciBodHRwSHR0cHNSRSA9IC9eaHR0cHM/OlxcL1xcLy4qJC87XG5cdCAgICAgICAgdmFyIHd3d1JFID0gL153d3dcXC4vO1xuXHQgICAgICAgIHZhciB0bGRSRSA9IC9cXC4oPzpvcmd8bmV0fGNvbSkoPzpcXDp8XFwvfCQpLztcblxuXHQgICAgICAgIHZhciB3b3JkcyA9IHN0ci5zcGxpdCgvKFxccyspLykuZmlsdGVyKGZ1bmN0aW9uKHdvcmQpIHtcblx0ICAgICAgICAgIC8vIElmIHRoZSB3b3JkIGhhcyBubyBsZW5ndGgsIGJhaWwuIFRoaXMgY2FuIGhhcHBlbiBmb3Igc3RyIHdpdGhcblx0ICAgICAgICAgIC8vIHRyYWlsaW5nIHdoaXRlc3BhY2UuXG5cdCAgICAgICAgICByZXR1cm4gd29yZCAmJiB3b3JkLmxlbmd0aDtcblx0ICAgICAgICB9KS5tYXAoZnVuY3Rpb24od29yZCkge1xuXHQgICAgICAgICAgdmFyIG1hdGNoZXMgPSB3b3JkLm1hdGNoKHB1bmNSRSk7XG5cdCAgICAgICAgICB2YXIgcG9zc2libGVVcmwgPSBtYXRjaGVzICYmIG1hdGNoZXNbMV0gfHwgd29yZDtcblxuXHQgICAgICAgICAgLy8gdXJsIHRoYXQgc3RhcnRzIHdpdGggaHR0cCBvciBodHRwc1xuXHQgICAgICAgICAgaWYgKGh0dHBIdHRwc1JFLnRlc3QocG9zc2libGVVcmwpKVxuXHQgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCInICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIC8vIHVybCB0aGF0IHN0YXJ0cyB3aXRoIHd3dy5cblx0ICAgICAgICAgIGlmICh3d3dSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovLycgKyBwb3NzaWJsZVVybCArICdcIicgKyBub0ZvbGxvd0F0dHIgKyAnPicgKyBwb3NzaWJsZVVybC5zdWJzdHIoMCwgbGVuZ3RoKSArICc8L2E+JztcblxuXHQgICAgICAgICAgLy8gYW4gZW1haWwgYWRkcmVzcyBvZiB0aGUgZm9ybSB1c2VybmFtZUBkb21haW4udGxkXG5cdCAgICAgICAgICBpZiAoZW1haWxSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwibWFpbHRvOicgKyBwb3NzaWJsZVVybCArICdcIj4nICsgcG9zc2libGVVcmwgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIC8vIHVybCB0aGF0IGVuZHMgaW4gLmNvbSwgLm9yZyBvciAubmV0IHRoYXQgaXMgbm90IGFuIGVtYWlsIGFkZHJlc3Ncblx0ICAgICAgICAgIGlmICh0bGRSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovLycgKyBwb3NzaWJsZVVybCArICdcIicgKyBub0ZvbGxvd0F0dHIgKyAnPicgKyBwb3NzaWJsZVVybC5zdWJzdHIoMCwgbGVuZ3RoKSArICc8L2E+JztcblxuXHQgICAgICAgICAgcmV0dXJuIHdvcmQ7XG5cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiB3b3Jkcy5qb2luKCcnKTtcblx0ICAgIH0sXG5cblx0ICAgIHdvcmRjb3VudDogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHZhciB3b3JkcyA9IChzdHIpID8gc3RyLm1hdGNoKC9cXHcrL2cpIDogbnVsbDtcblx0ICAgICAgICByZXR1cm4gKHdvcmRzKSA/IHdvcmRzLmxlbmd0aCA6IG51bGw7XG5cdCAgICB9LFxuXG5cdCAgICAnZmxvYXQnOiBmdW5jdGlvbih2YWwsIGRlZikge1xuXHQgICAgICAgIHZhciByZXMgPSBwYXJzZUZsb2F0KHZhbCk7XG5cdCAgICAgICAgcmV0dXJuIGlzTmFOKHJlcykgPyBkZWYgOiByZXM7XG5cdCAgICB9LFxuXG5cdCAgICAnaW50JzogZnVuY3Rpb24odmFsLCBkZWYpIHtcblx0ICAgICAgICB2YXIgcmVzID0gcGFyc2VJbnQodmFsLCAxMCk7XG5cdCAgICAgICAgcmV0dXJuIGlzTmFOKHJlcykgPyBkZWYgOiByZXM7XG5cdCAgICB9XG5cdH07XG5cblx0Ly8gQWxpYXNlc1xuXHRmaWx0ZXJzLmQgPSBmaWx0ZXJzWydkZWZhdWx0J107XG5cdGZpbHRlcnMuZSA9IGZpbHRlcnMuZXNjYXBlO1xuXG5cdG1vZHVsZS5leHBvcnRzID0gZmlsdGVycztcblxuXG4vKioqLyB9KSxcbi8qIDggKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cdHZhciBPYmogPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDYpO1xuXG5cdC8vIEZyYW1lcyBrZWVwIHRyYWNrIG9mIHNjb3BpbmcgYm90aCBhdCBjb21waWxlLXRpbWUgYW5kIHJ1bi10aW1lIHNvXG5cdC8vIHdlIGtub3cgaG93IHRvIGFjY2VzcyB2YXJpYWJsZXMuIEJsb2NrIHRhZ3MgY2FuIGludHJvZHVjZSBzcGVjaWFsXG5cdC8vIHZhcmlhYmxlcywgZm9yIGV4YW1wbGUuXG5cdHZhciBGcmFtZSA9IE9iai5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24ocGFyZW50LCBpc29sYXRlV3JpdGVzKSB7XG5cdCAgICAgICAgdGhpcy52YXJpYWJsZXMgPSB7fTtcblx0ICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcblx0ICAgICAgICB0aGlzLnRvcExldmVsID0gZmFsc2U7XG5cdCAgICAgICAgLy8gaWYgdGhpcyBpcyB0cnVlLCB3cml0ZXMgKHNldCkgc2hvdWxkIG5ldmVyIHByb3BhZ2F0ZSB1cHdhcmRzIHBhc3Rcblx0ICAgICAgICAvLyB0aGlzIGZyYW1lIHRvIGl0cyBwYXJlbnQgKHRob3VnaCByZWFkcyBtYXkpLlxuXHQgICAgICAgIHRoaXMuaXNvbGF0ZVdyaXRlcyA9IGlzb2xhdGVXcml0ZXM7XG5cdCAgICB9LFxuXG5cdCAgICBzZXQ6IGZ1bmN0aW9uKG5hbWUsIHZhbCwgcmVzb2x2ZVVwKSB7XG5cdCAgICAgICAgLy8gQWxsb3cgdmFyaWFibGVzIHdpdGggZG90cyBieSBhdXRvbWF0aWNhbGx5IGNyZWF0aW5nIHRoZVxuXHQgICAgICAgIC8vIG5lc3RlZCBzdHJ1Y3R1cmVcblx0ICAgICAgICB2YXIgcGFydHMgPSBuYW1lLnNwbGl0KCcuJyk7XG5cdCAgICAgICAgdmFyIG9iaiA9IHRoaXMudmFyaWFibGVzO1xuXHQgICAgICAgIHZhciBmcmFtZSA9IHRoaXM7XG5cblx0ICAgICAgICBpZihyZXNvbHZlVXApIHtcblx0ICAgICAgICAgICAgaWYoKGZyYW1lID0gdGhpcy5yZXNvbHZlKHBhcnRzWzBdLCB0cnVlKSkpIHtcblx0ICAgICAgICAgICAgICAgIGZyYW1lLnNldChuYW1lLCB2YWwpO1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8cGFydHMubGVuZ3RoIC0gMTsgaSsrKSB7XG5cdCAgICAgICAgICAgIHZhciBpZCA9IHBhcnRzW2ldO1xuXG5cdCAgICAgICAgICAgIGlmKCFvYmpbaWRdKSB7XG5cdCAgICAgICAgICAgICAgICBvYmpbaWRdID0ge307XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgb2JqID0gb2JqW2lkXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBvYmpbcGFydHNbcGFydHMubGVuZ3RoIC0gMV1dID0gdmFsO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0OiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuXHQgICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBudWxsO1xuXHQgICAgfSxcblxuXHQgICAgbG9va3VwOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdmFyIHAgPSB0aGlzLnBhcmVudDtcblx0ICAgICAgICB2YXIgdmFsID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG5cdCAgICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHAgJiYgcC5sb29rdXAobmFtZSk7XG5cdCAgICB9LFxuXG5cdCAgICByZXNvbHZlOiBmdW5jdGlvbihuYW1lLCBmb3JXcml0ZSkge1xuXHQgICAgICAgIHZhciBwID0gKGZvcldyaXRlICYmIHRoaXMuaXNvbGF0ZVdyaXRlcykgPyB1bmRlZmluZWQgOiB0aGlzLnBhcmVudDtcblx0ICAgICAgICB2YXIgdmFsID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG5cdCAgICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBwICYmIHAucmVzb2x2ZShuYW1lKTtcblx0ICAgIH0sXG5cblx0ICAgIHB1c2g6IGZ1bmN0aW9uKGlzb2xhdGVXcml0ZXMpIHtcblx0ICAgICAgICByZXR1cm4gbmV3IEZyYW1lKHRoaXMsIGlzb2xhdGVXcml0ZXMpO1xuXHQgICAgfSxcblxuXHQgICAgcG9wOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQ7XG5cdCAgICB9XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIG1ha2VNYWNybyhhcmdOYW1lcywga3dhcmdOYW1lcywgZnVuYykge1xuXHQgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciBhcmdDb3VudCA9IG51bUFyZ3MoYXJndW1lbnRzKTtcblx0ICAgICAgICB2YXIgYXJncztcblx0ICAgICAgICB2YXIga3dhcmdzID0gZ2V0S2V5d29yZEFyZ3MoYXJndW1lbnRzKTtcblx0ICAgICAgICB2YXIgaTtcblxuXHQgICAgICAgIGlmKGFyZ0NvdW50ID4gYXJnTmFtZXMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIGFyZ05hbWVzLmxlbmd0aCk7XG5cblx0ICAgICAgICAgICAgLy8gUG9zaXRpb25hbCBhcmd1bWVudHMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIGluIGFzXG5cdCAgICAgICAgICAgIC8vIGtleXdvcmQgYXJndW1lbnRzIChlc3NlbnRpYWxseSBkZWZhdWx0IHZhbHVlcylcblx0ICAgICAgICAgICAgdmFyIHZhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIGFyZ3MubGVuZ3RoLCBhcmdDb3VudCk7XG5cdCAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IHZhbHMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIGlmKGkgPCBrd2FyZ05hbWVzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGt3YXJnc1trd2FyZ05hbWVzW2ldXSA9IHZhbHNbaV07XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihhcmdDb3VudCA8IGFyZ05hbWVzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBhcmdDb3VudCk7XG5cblx0ICAgICAgICAgICAgZm9yKGkgPSBhcmdDb3VudDsgaSA8IGFyZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJnTmFtZXNbaV07XG5cblx0ICAgICAgICAgICAgICAgIC8vIEtleXdvcmQgYXJndW1lbnRzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCBhc1xuXHQgICAgICAgICAgICAgICAgLy8gcG9zaXRpb25hbCBhcmd1bWVudHMsIGkuZS4gdGhlIGNhbGxlciBleHBsaWNpdGx5XG5cdCAgICAgICAgICAgICAgICAvLyB1c2VkIHRoZSBuYW1lIG9mIGEgcG9zaXRpb25hbCBhcmdcblx0ICAgICAgICAgICAgICAgIGFyZ3MucHVzaChrd2FyZ3NbYXJnXSk7XG5cdCAgICAgICAgICAgICAgICBkZWxldGUga3dhcmdzW2FyZ107XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG5cdCAgICB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gbWFrZUtleXdvcmRBcmdzKG9iaikge1xuXHQgICAgb2JqLl9fa2V5d29yZHMgPSB0cnVlO1xuXHQgICAgcmV0dXJuIG9iajtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldEtleXdvcmRBcmdzKGFyZ3MpIHtcblx0ICAgIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcblx0ICAgIGlmKGxlbikge1xuXHQgICAgICAgIHZhciBsYXN0QXJnID0gYXJnc1tsZW4gLSAxXTtcblx0ICAgICAgICBpZihsYXN0QXJnICYmIGxhc3RBcmcuaGFzT3duUHJvcGVydHkoJ19fa2V5d29yZHMnKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gbGFzdEFyZztcblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICByZXR1cm4ge307XG5cdH1cblxuXHRmdW5jdGlvbiBudW1BcmdzKGFyZ3MpIHtcblx0ICAgIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcblx0ICAgIGlmKGxlbiA9PT0gMCkge1xuXHQgICAgICAgIHJldHVybiAwO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgbGFzdEFyZyA9IGFyZ3NbbGVuIC0gMV07XG5cdCAgICBpZihsYXN0QXJnICYmIGxhc3RBcmcuaGFzT3duUHJvcGVydHkoJ19fa2V5d29yZHMnKSkge1xuXHQgICAgICAgIHJldHVybiBsZW4gLSAxO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIGxlbjtcblx0ICAgIH1cblx0fVxuXG5cdC8vIEEgU2FmZVN0cmluZyBvYmplY3QgaW5kaWNhdGVzIHRoYXQgdGhlIHN0cmluZyBzaG91bGQgbm90IGJlXG5cdC8vIGF1dG9lc2NhcGVkLiBUaGlzIGhhcHBlbnMgbWFnaWNhbGx5IGJlY2F1c2UgYXV0b2VzY2FwaW5nIG9ubHlcblx0Ly8gb2NjdXJzIG9uIHByaW1pdGl2ZSBzdHJpbmcgb2JqZWN0cy5cblx0ZnVuY3Rpb24gU2FmZVN0cmluZyh2YWwpIHtcblx0ICAgIGlmKHR5cGVvZiB2YWwgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgIH1cblxuXHQgICAgdGhpcy52YWwgPSB2YWw7XG5cdCAgICB0aGlzLmxlbmd0aCA9IHZhbC5sZW5ndGg7XG5cdH1cblxuXHRTYWZlU3RyaW5nLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3RyaW5nLnByb3RvdHlwZSwge1xuXHQgICAgbGVuZ3RoOiB7IHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHZhbHVlOiAwIH1cblx0fSk7XG5cdFNhZmVTdHJpbmcucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbigpIHtcblx0ICAgIHJldHVybiB0aGlzLnZhbDtcblx0fTtcblx0U2FmZVN0cmluZy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0ICAgIHJldHVybiB0aGlzLnZhbDtcblx0fTtcblxuXHRmdW5jdGlvbiBjb3B5U2FmZW5lc3MoZGVzdCwgdGFyZ2V0KSB7XG5cdCAgICBpZihkZXN0IGluc3RhbmNlb2YgU2FmZVN0cmluZykge1xuXHQgICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyh0YXJnZXQpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHRhcmdldC50b1N0cmluZygpO1xuXHR9XG5cblx0ZnVuY3Rpb24gbWFya1NhZmUodmFsKSB7XG5cdCAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG5cblx0ICAgIGlmKHR5cGUgPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBTYWZlU3RyaW5nKHZhbCk7XG5cdCAgICB9XG5cdCAgICBlbHNlIGlmKHR5cGUgIT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICB2YXIgcmV0ID0gdmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cblx0ICAgICAgICAgICAgaWYodHlwZW9mIHJldCA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyhyZXQpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHJldDtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gc3VwcHJlc3NWYWx1ZSh2YWwsIGF1dG9lc2NhcGUpIHtcblx0ICAgIHZhbCA9ICh2YWwgIT09IHVuZGVmaW5lZCAmJiB2YWwgIT09IG51bGwpID8gdmFsIDogJyc7XG5cblx0ICAgIGlmKGF1dG9lc2NhcGUgJiYgISh2YWwgaW5zdGFuY2VvZiBTYWZlU3RyaW5nKSkge1xuXHQgICAgICAgIHZhbCA9IGxpYi5lc2NhcGUodmFsLnRvU3RyaW5nKCkpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gdmFsO1xuXHR9XG5cblx0ZnVuY3Rpb24gZW5zdXJlRGVmaW5lZCh2YWwsIGxpbmVubywgY29sbm8pIHtcblx0ICAgIGlmKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcihcblx0ICAgICAgICAgICAgJ2F0dGVtcHRlZCB0byBvdXRwdXQgbnVsbCBvciB1bmRlZmluZWQgdmFsdWUnLFxuXHQgICAgICAgICAgICBsaW5lbm8gKyAxLFxuXHQgICAgICAgICAgICBjb2xubyArIDFcblx0ICAgICAgICApO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHZhbDtcblx0fVxuXG5cdGZ1bmN0aW9uIG1lbWJlckxvb2t1cChvYmosIHZhbCkge1xuXHQgICAgb2JqID0gb2JqIHx8IHt9O1xuXG5cdCAgICBpZih0eXBlb2Ygb2JqW3ZhbF0gPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBvYmpbdmFsXS5hcHBseShvYmosIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIG9ialt2YWxdO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2FsbFdyYXAob2JqLCBuYW1lLCBjb250ZXh0LCBhcmdzKSB7XG5cdCAgICBpZighb2JqKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY2FsbCBgJyArIG5hbWUgKyAnYCwgd2hpY2ggaXMgdW5kZWZpbmVkIG9yIGZhbHNleScpO1xuXHQgICAgfVxuXHQgICAgZWxzZSBpZih0eXBlb2Ygb2JqICE9PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY2FsbCBgJyArIG5hbWUgKyAnYCwgd2hpY2ggaXMgbm90IGEgZnVuY3Rpb24nKTtcblx0ICAgIH1cblxuXHQgICAgLy8ganNoaW50IHZhbGlkdGhpczogdHJ1ZVxuXHQgICAgcmV0dXJuIG9iai5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBuYW1lKSB7XG5cdCAgICB2YXIgdmFsID0gZnJhbWUubG9va3VwKG5hbWUpO1xuXHQgICAgcmV0dXJuICh2YWwgIT09IHVuZGVmaW5lZCkgP1xuXHQgICAgICAgIHZhbCA6XG5cdCAgICAgICAgY29udGV4dC5sb29rdXAobmFtZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVFcnJvcihlcnJvciwgbGluZW5vLCBjb2xubykge1xuXHQgICAgaWYoZXJyb3IubGluZW5vKSB7XG5cdCAgICAgICAgcmV0dXJuIGVycm9yO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBsaWIuVGVtcGxhdGVFcnJvcihlcnJvciwgbGluZW5vLCBjb2xubyk7XG5cdCAgICB9XG5cdH1cblxuXHRmdW5jdGlvbiBhc3luY0VhY2goYXJyLCBkaW1lbiwgaXRlciwgY2IpIHtcblx0ICAgIGlmKGxpYi5pc0FycmF5KGFycikpIHtcblx0ICAgICAgICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcblxuXHQgICAgICAgIGxpYi5hc3luY0l0ZXIoYXJyLCBmdW5jdGlvbihpdGVtLCBpLCBuZXh0KSB7XG5cdCAgICAgICAgICAgIHN3aXRjaChkaW1lbikge1xuXHQgICAgICAgICAgICBjYXNlIDE6IGl0ZXIoaXRlbSwgaSwgbGVuLCBuZXh0KTsgYnJlYWs7XG5cdCAgICAgICAgICAgIGNhc2UgMjogaXRlcihpdGVtWzBdLCBpdGVtWzFdLCBpLCBsZW4sIG5leHQpOyBicmVhaztcblx0ICAgICAgICAgICAgY2FzZSAzOiBpdGVyKGl0ZW1bMF0sIGl0ZW1bMV0sIGl0ZW1bMl0sIGksIGxlbiwgbmV4dCk7IGJyZWFrO1xuXHQgICAgICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICAgICAgaXRlbS5wdXNoKGksIG5leHQpO1xuXHQgICAgICAgICAgICAgICAgaXRlci5hcHBseSh0aGlzLCBpdGVtKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0sIGNiKTtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIGxpYi5hc3luY0ZvcihhcnIsIGZ1bmN0aW9uKGtleSwgdmFsLCBpLCBsZW4sIG5leHQpIHtcblx0ICAgICAgICAgICAgaXRlcihrZXksIHZhbCwgaSwgbGVuLCBuZXh0KTtcblx0ICAgICAgICB9LCBjYik7XG5cdCAgICB9XG5cdH1cblxuXHRmdW5jdGlvbiBhc3luY0FsbChhcnIsIGRpbWVuLCBmdW5jLCBjYikge1xuXHQgICAgdmFyIGZpbmlzaGVkID0gMDtcblx0ICAgIHZhciBsZW4sIGk7XG5cdCAgICB2YXIgb3V0cHV0QXJyO1xuXG5cdCAgICBmdW5jdGlvbiBkb25lKGksIG91dHB1dCkge1xuXHQgICAgICAgIGZpbmlzaGVkKys7XG5cdCAgICAgICAgb3V0cHV0QXJyW2ldID0gb3V0cHV0O1xuXG5cdCAgICAgICAgaWYoZmluaXNoZWQgPT09IGxlbikge1xuXHQgICAgICAgICAgICBjYihudWxsLCBvdXRwdXRBcnIuam9pbignJykpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgaWYobGliLmlzQXJyYXkoYXJyKSkge1xuXHQgICAgICAgIGxlbiA9IGFyci5sZW5ndGg7XG5cdCAgICAgICAgb3V0cHV0QXJyID0gbmV3IEFycmF5KGxlbik7XG5cblx0ICAgICAgICBpZihsZW4gPT09IDApIHtcblx0ICAgICAgICAgICAgY2IobnVsbCwgJycpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IGFycltpXTtcblxuXHQgICAgICAgICAgICAgICAgc3dpdGNoKGRpbWVuKSB7XG5cdCAgICAgICAgICAgICAgICBjYXNlIDE6IGZ1bmMoaXRlbSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICBjYXNlIDI6IGZ1bmMoaXRlbVswXSwgaXRlbVsxXSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICBjYXNlIDM6IGZ1bmMoaXRlbVswXSwgaXRlbVsxXSwgaXRlbVsyXSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICAgICAgICAgIGl0ZW0ucHVzaChpLCBkb25lKTtcblx0ICAgICAgICAgICAgICAgICAgICAvLyBqc2hpbnQgdmFsaWR0aGlzOiB0cnVlXG5cdCAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseSh0aGlzLCBpdGVtKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHZhciBrZXlzID0gbGliLmtleXMoYXJyKTtcblx0ICAgICAgICBsZW4gPSBrZXlzLmxlbmd0aDtcblx0ICAgICAgICBvdXRwdXRBcnIgPSBuZXcgQXJyYXkobGVuKTtcblxuXHQgICAgICAgIGlmKGxlbiA9PT0gMCkge1xuXHQgICAgICAgICAgICBjYihudWxsLCAnJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgayA9IGtleXNbaV07XG5cdCAgICAgICAgICAgICAgICBmdW5jKGssIGFycltrXSwgaSwgbGVuLCBkb25lKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgIH1cblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzID0ge1xuXHQgICAgRnJhbWU6IEZyYW1lLFxuXHQgICAgbWFrZU1hY3JvOiBtYWtlTWFjcm8sXG5cdCAgICBtYWtlS2V5d29yZEFyZ3M6IG1ha2VLZXl3b3JkQXJncyxcblx0ICAgIG51bUFyZ3M6IG51bUFyZ3MsXG5cdCAgICBzdXBwcmVzc1ZhbHVlOiBzdXBwcmVzc1ZhbHVlLFxuXHQgICAgZW5zdXJlRGVmaW5lZDogZW5zdXJlRGVmaW5lZCxcblx0ICAgIG1lbWJlckxvb2t1cDogbWVtYmVyTG9va3VwLFxuXHQgICAgY29udGV4dE9yRnJhbWVMb29rdXA6IGNvbnRleHRPckZyYW1lTG9va3VwLFxuXHQgICAgY2FsbFdyYXA6IGNhbGxXcmFwLFxuXHQgICAgaGFuZGxlRXJyb3I6IGhhbmRsZUVycm9yLFxuXHQgICAgaXNBcnJheTogbGliLmlzQXJyYXksXG5cdCAgICBrZXlzOiBsaWIua2V5cyxcblx0ICAgIFNhZmVTdHJpbmc6IFNhZmVTdHJpbmcsXG5cdCAgICBjb3B5U2FmZW5lc3M6IGNvcHlTYWZlbmVzcyxcblx0ICAgIG1hcmtTYWZlOiBtYXJrU2FmZSxcblx0ICAgIGFzeW5jRWFjaDogYXN5bmNFYWNoLFxuXHQgICAgYXN5bmNBbGw6IGFzeW5jQWxsLFxuXHQgICAgaW5PcGVyYXRvcjogbGliLmluT3BlcmF0b3Jcblx0fTtcblxuXG4vKioqLyB9KSxcbi8qIDkgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0ZnVuY3Rpb24gY3ljbGVyKGl0ZW1zKSB7XG5cdCAgICB2YXIgaW5kZXggPSAtMTtcblxuXHQgICAgcmV0dXJuIHtcblx0ICAgICAgICBjdXJyZW50OiBudWxsLFxuXHQgICAgICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgaW5kZXggPSAtMTtcblx0ICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gbnVsbDtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIGluZGV4Kys7XG5cdCAgICAgICAgICAgIGlmKGluZGV4ID49IGl0ZW1zLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgaW5kZXggPSAwO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gaXRlbXNbaW5kZXhdO1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50O1xuXHQgICAgICAgIH0sXG5cdCAgICB9O1xuXG5cdH1cblxuXHRmdW5jdGlvbiBqb2luZXIoc2VwKSB7XG5cdCAgICBzZXAgPSBzZXAgfHwgJywnO1xuXHQgICAgdmFyIGZpcnN0ID0gdHJ1ZTtcblxuXHQgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciB2YWwgPSBmaXJzdCA/ICcnIDogc2VwO1xuXHQgICAgICAgIGZpcnN0ID0gZmFsc2U7XG5cdCAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgIH07XG5cdH1cblxuXHQvLyBNYWtpbmcgdGhpcyBhIGZ1bmN0aW9uIGluc3RlYWQgc28gaXQgcmV0dXJucyBhIG5ldyBvYmplY3Rcblx0Ly8gZWFjaCB0aW1lIGl0J3MgY2FsbGVkLiBUaGF0IHdheSwgaWYgc29tZXRoaW5nIGxpa2UgYW4gZW52aXJvbm1lbnRcblx0Ly8gdXNlcyBpdCwgdGhleSB3aWxsIGVhY2ggaGF2ZSB0aGVpciBvd24gY29weS5cblx0ZnVuY3Rpb24gZ2xvYmFscygpIHtcblx0ICAgIHJldHVybiB7XG5cdCAgICAgICAgcmFuZ2U6IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG5cdCAgICAgICAgICAgIGlmKHR5cGVvZiBzdG9wID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgICAgICAgICAgc3RvcCA9IHN0YXJ0O1xuXHQgICAgICAgICAgICAgICAgc3RhcnQgPSAwO1xuXHQgICAgICAgICAgICAgICAgc3RlcCA9IDE7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZighc3RlcCkge1xuXHQgICAgICAgICAgICAgICAgc3RlcCA9IDE7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB2YXIgYXJyID0gW107XG5cdCAgICAgICAgICAgIHZhciBpO1xuXHQgICAgICAgICAgICBpZiAoc3RlcCA+IDApIHtcblx0ICAgICAgICAgICAgICAgIGZvciAoaT1zdGFydDsgaTxzdG9wOyBpKz1zdGVwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goaSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKGk9c3RhcnQ7IGk+c3RvcDsgaSs9c3RlcCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGFyci5wdXNoKGkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBhcnI7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8vIGxpcHN1bTogZnVuY3Rpb24obiwgaHRtbCwgbWluLCBtYXgpIHtcblx0ICAgICAgICAvLyB9LFxuXG5cdCAgICAgICAgY3ljbGVyOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGN5Y2xlcihBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgam9pbmVyOiBmdW5jdGlvbihzZXApIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGpvaW5lcihzZXApO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IGdsb2JhbHM7XG5cblxuLyoqKi8gfSksXG4vKiAxMCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdHZhciBfX1dFQlBBQ0tfQU1EX0RFRklORV9BUlJBWV9fLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXzsvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi8oZnVuY3Rpb24oc2V0SW1tZWRpYXRlLCBwcm9jZXNzKSB7Ly8gTUlUIGxpY2Vuc2UgKGJ5IEVsYW4gU2hhbmtlcikuXG5cdChmdW5jdGlvbihnbG9iYWxzKSB7XG5cdCAgJ3VzZSBzdHJpY3QnO1xuXG5cdCAgdmFyIGV4ZWN1dGVTeW5jID0gZnVuY3Rpb24oKXtcblx0ICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblx0ICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ2Z1bmN0aW9uJyl7XG5cdCAgICAgIGFyZ3NbMF0uYXBwbHkobnVsbCwgYXJncy5zcGxpY2UoMSkpO1xuXHQgICAgfVxuXHQgIH07XG5cblx0ICB2YXIgZXhlY3V0ZUFzeW5jID0gZnVuY3Rpb24oZm4pe1xuXHQgICAgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgc2V0SW1tZWRpYXRlKGZuKTtcblx0ICAgIH0gZWxzZSBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MubmV4dFRpY2spIHtcblx0ICAgICAgcHJvY2Vzcy5uZXh0VGljayhmbik7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcblx0ICAgIH1cblx0ICB9O1xuXG5cdCAgdmFyIG1ha2VJdGVyYXRvciA9IGZ1bmN0aW9uICh0YXNrcykge1xuXHQgICAgdmFyIG1ha2VDYWxsYmFjayA9IGZ1bmN0aW9uIChpbmRleCkge1xuXHQgICAgICB2YXIgZm4gPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCkge1xuXHQgICAgICAgICAgdGFza3NbaW5kZXhdLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBmbi5uZXh0KCk7XG5cdCAgICAgIH07XG5cdCAgICAgIGZuLm5leHQgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgcmV0dXJuIChpbmRleCA8IHRhc2tzLmxlbmd0aCAtIDEpID8gbWFrZUNhbGxiYWNrKGluZGV4ICsgMSk6IG51bGw7XG5cdCAgICAgIH07XG5cdCAgICAgIHJldHVybiBmbjtcblx0ICAgIH07XG5cdCAgICByZXR1cm4gbWFrZUNhbGxiYWNrKDApO1xuXHQgIH07XG5cdCAgXG5cdCAgdmFyIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihtYXliZUFycmF5KXtcblx0ICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobWF5YmVBcnJheSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG5cdCAgfTtcblxuXHQgIHZhciB3YXRlcmZhbGwgPSBmdW5jdGlvbiAodGFza3MsIGNhbGxiYWNrLCBmb3JjZUFzeW5jKSB7XG5cdCAgICB2YXIgbmV4dFRpY2sgPSBmb3JjZUFzeW5jID8gZXhlY3V0ZUFzeW5jIDogZXhlY3V0ZVN5bmM7XG5cdCAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuXHQgICAgaWYgKCFfaXNBcnJheSh0YXNrcykpIHtcblx0ICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgdG8gd2F0ZXJmYWxsIG11c3QgYmUgYW4gYXJyYXkgb2YgZnVuY3Rpb25zJyk7XG5cdCAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuXHQgICAgfVxuXHQgICAgaWYgKCF0YXNrcy5sZW5ndGgpIHtcblx0ICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG5cdCAgICB9XG5cdCAgICB2YXIgd3JhcEl0ZXJhdG9yID0gZnVuY3Rpb24gKGl0ZXJhdG9yKSB7XG5cdCAgICAgIHJldHVybiBmdW5jdGlvbiAoZXJyKSB7XG5cdCAgICAgICAgaWYgKGVycikge1xuXHQgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcblx0ICAgICAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge307XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0ICAgICAgICAgIHZhciBuZXh0ID0gaXRlcmF0b3IubmV4dCgpO1xuXHQgICAgICAgICAgaWYgKG5leHQpIHtcblx0ICAgICAgICAgICAgYXJncy5wdXNoKHdyYXBJdGVyYXRvcihuZXh0KSk7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBhcmdzLnB1c2goY2FsbGJhY2spO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgICAgbmV4dFRpY2soZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICBpdGVyYXRvci5hcHBseShudWxsLCBhcmdzKTtcblx0ICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfTtcblx0ICAgIH07XG5cdCAgICB3cmFwSXRlcmF0b3IobWFrZUl0ZXJhdG9yKHRhc2tzKSkoKTtcblx0ICB9O1xuXG5cdCAgaWYgKHRydWUpIHtcblx0ICAgICEoX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXyA9IFtdLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgcmV0dXJuIHdhdGVyZmFsbDtcblx0ICAgIH0uYXBwbHkoZXhwb3J0cywgX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXyksIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fICE9PSB1bmRlZmluZWQgJiYgKG1vZHVsZS5leHBvcnRzID0gX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18pKTsgLy8gUmVxdWlyZUpTXG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSB3YXRlcmZhbGw7IC8vIENvbW1vbkpTXG5cdCAgfSBlbHNlIHtcblx0ICAgIGdsb2JhbHMud2F0ZXJmYWxsID0gd2F0ZXJmYWxsOyAvLyA8c2NyaXB0PlxuXHQgIH1cblx0fSkodGhpcyk7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18oMTEpLnNldEltbWVkaWF0ZSwgX193ZWJwYWNrX3JlcXVpcmVfXygxMykpKVxuXG4vKioqLyB9KSxcbi8qIDExICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xuXG5cdC8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cblx0ZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG5cdCAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0VGltZW91dCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhclRpbWVvdXQpO1xuXHR9O1xuXHRleHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG5cdCAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0SW50ZXJ2YWwsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG5cdH07XG5cdGV4cG9ydHMuY2xlYXJUaW1lb3V0ID1cblx0ZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkge1xuXHQgIGlmICh0aW1lb3V0KSB7XG5cdCAgICB0aW1lb3V0LmNsb3NlKCk7XG5cdCAgfVxuXHR9O1xuXG5cdGZ1bmN0aW9uIFRpbWVvdXQoaWQsIGNsZWFyRm4pIHtcblx0ICB0aGlzLl9pZCA9IGlkO1xuXHQgIHRoaXMuX2NsZWFyRm4gPSBjbGVhckZuO1xuXHR9XG5cdFRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblx0VGltZW91dC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcblx0ICB0aGlzLl9jbGVhckZuLmNhbGwod2luZG93LCB0aGlzLl9pZCk7XG5cdH07XG5cblx0Ly8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5cdGV4cG9ydHMuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSwgbXNlY3MpIHtcblx0ICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cdCAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcblx0fTtcblxuXHRleHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuXHQgIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblx0ICBpdGVtLl9pZGxlVGltZW91dCA9IC0xO1xuXHR9O1xuXG5cdGV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG5cdCAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXG5cdCAgdmFyIG1zZWNzID0gaXRlbS5faWRsZVRpbWVvdXQ7XG5cdCAgaWYgKG1zZWNzID49IDApIHtcblx0ICAgIGl0ZW0uX2lkbGVUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIG9uVGltZW91dCgpIHtcblx0ICAgICAgaWYgKGl0ZW0uX29uVGltZW91dClcblx0ICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcblx0ICAgIH0sIG1zZWNzKTtcblx0ICB9XG5cdH07XG5cblx0Ly8gc2V0aW1tZWRpYXRlIGF0dGFjaGVzIGl0c2VsZiB0byB0aGUgZ2xvYmFsIG9iamVjdFxuXHRfX3dlYnBhY2tfcmVxdWlyZV9fKDEyKTtcblx0ZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSBzZXRJbW1lZGlhdGU7XG5cdGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSBjbGVhckltbWVkaWF0ZTtcblxuXG4vKioqLyB9KSxcbi8qIDEyICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovKGZ1bmN0aW9uKGdsb2JhbCwgcHJvY2VzcykgeyhmdW5jdGlvbiAoZ2xvYmFsLCB1bmRlZmluZWQpIHtcblx0ICAgIFwidXNlIHN0cmljdFwiO1xuXG5cdCAgICBpZiAoZ2xvYmFsLnNldEltbWVkaWF0ZSkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgdmFyIG5leHRIYW5kbGUgPSAxOyAvLyBTcGVjIHNheXMgZ3JlYXRlciB0aGFuIHplcm9cblx0ICAgIHZhciB0YXNrc0J5SGFuZGxlID0ge307XG5cdCAgICB2YXIgY3VycmVudGx5UnVubmluZ0FUYXNrID0gZmFsc2U7XG5cdCAgICB2YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xuXHQgICAgdmFyIHJlZ2lzdGVySW1tZWRpYXRlO1xuXG5cdCAgICBmdW5jdGlvbiBzZXRJbW1lZGlhdGUoY2FsbGJhY2spIHtcblx0ICAgICAgLy8gQ2FsbGJhY2sgY2FuIGVpdGhlciBiZSBhIGZ1bmN0aW9uIG9yIGEgc3RyaW5nXG5cdCAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuXHQgICAgICAgIGNhbGxiYWNrID0gbmV3IEZ1bmN0aW9uKFwiXCIgKyBjYWxsYmFjayk7XG5cdCAgICAgIH1cblx0ICAgICAgLy8gQ29weSBmdW5jdGlvbiBhcmd1bWVudHNcblx0ICAgICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuXHQgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdO1xuXHQgICAgICB9XG5cdCAgICAgIC8vIFN0b3JlIGFuZCByZWdpc3RlciB0aGUgdGFza1xuXHQgICAgICB2YXIgdGFzayA9IHsgY2FsbGJhY2s6IGNhbGxiYWNrLCBhcmdzOiBhcmdzIH07XG5cdCAgICAgIHRhc2tzQnlIYW5kbGVbbmV4dEhhbmRsZV0gPSB0YXNrO1xuXHQgICAgICByZWdpc3RlckltbWVkaWF0ZShuZXh0SGFuZGxlKTtcblx0ICAgICAgcmV0dXJuIG5leHRIYW5kbGUrKztcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gY2xlYXJJbW1lZGlhdGUoaGFuZGxlKSB7XG5cdCAgICAgICAgZGVsZXRlIHRhc2tzQnlIYW5kbGVbaGFuZGxlXTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gcnVuKHRhc2spIHtcblx0ICAgICAgICB2YXIgY2FsbGJhY2sgPSB0YXNrLmNhbGxiYWNrO1xuXHQgICAgICAgIHZhciBhcmdzID0gdGFzay5hcmdzO1xuXHQgICAgICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcblx0ICAgICAgICBjYXNlIDA6XG5cdCAgICAgICAgICAgIGNhbGxiYWNrKCk7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgIGNhc2UgMTpcblx0ICAgICAgICAgICAgY2FsbGJhY2soYXJnc1swXSk7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgIGNhc2UgMjpcblx0ICAgICAgICAgICAgY2FsbGJhY2soYXJnc1swXSwgYXJnc1sxXSk7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgIGNhc2UgMzpcblx0ICAgICAgICAgICAgY2FsbGJhY2soYXJnc1swXSwgYXJnc1sxXSwgYXJnc1syXSk7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgIGRlZmF1bHQ6XG5cdCAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHVuZGVmaW5lZCwgYXJncyk7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gcnVuSWZQcmVzZW50KGhhbmRsZSkge1xuXHQgICAgICAgIC8vIEZyb20gdGhlIHNwZWM6IFwiV2FpdCB1bnRpbCBhbnkgaW52b2NhdGlvbnMgb2YgdGhpcyBhbGdvcml0aG0gc3RhcnRlZCBiZWZvcmUgdGhpcyBvbmUgaGF2ZSBjb21wbGV0ZWQuXCJcblx0ICAgICAgICAvLyBTbyBpZiB3ZSdyZSBjdXJyZW50bHkgcnVubmluZyBhIHRhc2ssIHdlJ2xsIG5lZWQgdG8gZGVsYXkgdGhpcyBpbnZvY2F0aW9uLlxuXHQgICAgICAgIGlmIChjdXJyZW50bHlSdW5uaW5nQVRhc2spIHtcblx0ICAgICAgICAgICAgLy8gRGVsYXkgYnkgZG9pbmcgYSBzZXRUaW1lb3V0LiBzZXRJbW1lZGlhdGUgd2FzIHRyaWVkIGluc3RlYWQsIGJ1dCBpbiBGaXJlZm94IDcgaXQgZ2VuZXJhdGVkIGFcblx0ICAgICAgICAgICAgLy8gXCJ0b28gbXVjaCByZWN1cnNpb25cIiBlcnJvci5cblx0ICAgICAgICAgICAgc2V0VGltZW91dChydW5JZlByZXNlbnQsIDAsIGhhbmRsZSk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHRhc2sgPSB0YXNrc0J5SGFuZGxlW2hhbmRsZV07XG5cdCAgICAgICAgICAgIGlmICh0YXNrKSB7XG5cdCAgICAgICAgICAgICAgICBjdXJyZW50bHlSdW5uaW5nQVRhc2sgPSB0cnVlO1xuXHQgICAgICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgICAgICBydW4odGFzayk7XG5cdCAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuXHQgICAgICAgICAgICAgICAgICAgIGNsZWFySW1tZWRpYXRlKGhhbmRsZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgY3VycmVudGx5UnVubmluZ0FUYXNrID0gZmFsc2U7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGluc3RhbGxOZXh0VGlja0ltcGxlbWVudGF0aW9uKCkge1xuXHQgICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG5cdCAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkgeyBydW5JZlByZXNlbnQoaGFuZGxlKTsgfSk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gY2FuVXNlUG9zdE1lc3NhZ2UoKSB7XG5cdCAgICAgICAgLy8gVGhlIHRlc3QgYWdhaW5zdCBgaW1wb3J0U2NyaXB0c2AgcHJldmVudHMgdGhpcyBpbXBsZW1lbnRhdGlvbiBmcm9tIGJlaW5nIGluc3RhbGxlZCBpbnNpZGUgYSB3ZWIgd29ya2VyLFxuXHQgICAgICAgIC8vIHdoZXJlIGBnbG9iYWwucG9zdE1lc3NhZ2VgIG1lYW5zIHNvbWV0aGluZyBjb21wbGV0ZWx5IGRpZmZlcmVudCBhbmQgY2FuJ3QgYmUgdXNlZCBmb3IgdGhpcyBwdXJwb3NlLlxuXHQgICAgICAgIGlmIChnbG9iYWwucG9zdE1lc3NhZ2UgJiYgIWdsb2JhbC5pbXBvcnRTY3JpcHRzKSB7XG5cdCAgICAgICAgICAgIHZhciBwb3N0TWVzc2FnZUlzQXN5bmNocm9ub3VzID0gdHJ1ZTtcblx0ICAgICAgICAgICAgdmFyIG9sZE9uTWVzc2FnZSA9IGdsb2JhbC5vbm1lc3NhZ2U7XG5cdCAgICAgICAgICAgIGdsb2JhbC5vbm1lc3NhZ2UgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlSXNBc3luY2hyb25vdXMgPSBmYWxzZTtcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgZ2xvYmFsLnBvc3RNZXNzYWdlKFwiXCIsIFwiKlwiKTtcblx0ICAgICAgICAgICAgZ2xvYmFsLm9ubWVzc2FnZSA9IG9sZE9uTWVzc2FnZTtcblx0ICAgICAgICAgICAgcmV0dXJuIHBvc3RNZXNzYWdlSXNBc3luY2hyb25vdXM7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBpbnN0YWxsUG9zdE1lc3NhZ2VJbXBsZW1lbnRhdGlvbigpIHtcblx0ICAgICAgICAvLyBJbnN0YWxscyBhbiBldmVudCBoYW5kbGVyIG9uIGBnbG9iYWxgIGZvciB0aGUgYG1lc3NhZ2VgIGV2ZW50OiBzZWVcblx0ICAgICAgICAvLyAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0RPTS93aW5kb3cucG9zdE1lc3NhZ2Vcblx0ICAgICAgICAvLyAqIGh0dHA6Ly93d3cud2hhdHdnLm9yZy9zcGVjcy93ZWItYXBwcy9jdXJyZW50LXdvcmsvbXVsdGlwYWdlL2NvbW1zLmh0bWwjY3Jvc3NEb2N1bWVudE1lc3NhZ2VzXG5cblx0ICAgICAgICB2YXIgbWVzc2FnZVByZWZpeCA9IFwic2V0SW1tZWRpYXRlJFwiICsgTWF0aC5yYW5kb20oKSArIFwiJFwiO1xuXHQgICAgICAgIHZhciBvbkdsb2JhbE1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICAgICAgICBpZiAoZXZlbnQuc291cmNlID09PSBnbG9iYWwgJiZcblx0ICAgICAgICAgICAgICAgIHR5cGVvZiBldmVudC5kYXRhID09PSBcInN0cmluZ1wiICYmXG5cdCAgICAgICAgICAgICAgICBldmVudC5kYXRhLmluZGV4T2YobWVzc2FnZVByZWZpeCkgPT09IDApIHtcblx0ICAgICAgICAgICAgICAgIHJ1bklmUHJlc2VudCgrZXZlbnQuZGF0YS5zbGljZShtZXNzYWdlUHJlZml4Lmxlbmd0aCkpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIGlmIChnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuXHQgICAgICAgICAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgb25HbG9iYWxNZXNzYWdlLCBmYWxzZSk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgZ2xvYmFsLmF0dGFjaEV2ZW50KFwib25tZXNzYWdlXCIsIG9uR2xvYmFsTWVzc2FnZSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcblx0ICAgICAgICAgICAgZ2xvYmFsLnBvc3RNZXNzYWdlKG1lc3NhZ2VQcmVmaXggKyBoYW5kbGUsIFwiKlwiKTtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBpbnN0YWxsTWVzc2FnZUNoYW5uZWxJbXBsZW1lbnRhdGlvbigpIHtcblx0ICAgICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuXHQgICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgICAgICAgICAgdmFyIGhhbmRsZSA9IGV2ZW50LmRhdGE7XG5cdCAgICAgICAgICAgIHJ1bklmUHJlc2VudChoYW5kbGUpO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICByZWdpc3RlckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuXHQgICAgICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKGhhbmRsZSk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gaW5zdGFsbFJlYWR5U3RhdGVDaGFuZ2VJbXBsZW1lbnRhdGlvbigpIHtcblx0ICAgICAgICB2YXIgaHRtbCA9IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG5cdCAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcblx0ICAgICAgICAgICAgLy8gQ3JlYXRlIGEgPHNjcmlwdD4gZWxlbWVudDsgaXRzIHJlYWR5c3RhdGVjaGFuZ2UgZXZlbnQgd2lsbCBiZSBmaXJlZCBhc3luY2hyb25vdXNseSBvbmNlIGl0IGlzIGluc2VydGVkXG5cdCAgICAgICAgICAgIC8vIGludG8gdGhlIGRvY3VtZW50LiBEbyBzbywgdGh1cyBxdWV1aW5nIHVwIHRoZSB0YXNrLiBSZW1lbWJlciB0byBjbGVhbiB1cCBvbmNlIGl0J3MgYmVlbiBjYWxsZWQuXG5cdCAgICAgICAgICAgIHZhciBzY3JpcHQgPSBkb2MuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcblx0ICAgICAgICAgICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHJ1bklmUHJlc2VudChoYW5kbGUpO1xuXHQgICAgICAgICAgICAgICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG5cdCAgICAgICAgICAgICAgICBodG1sLnJlbW92ZUNoaWxkKHNjcmlwdCk7XG5cdCAgICAgICAgICAgICAgICBzY3JpcHQgPSBudWxsO1xuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICBodG1sLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gaW5zdGFsbFNldFRpbWVvdXRJbXBsZW1lbnRhdGlvbigpIHtcblx0ICAgICAgICByZWdpc3RlckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuXHQgICAgICAgICAgICBzZXRUaW1lb3V0KHJ1bklmUHJlc2VudCwgMCwgaGFuZGxlKTtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICAvLyBJZiBzdXBwb3J0ZWQsIHdlIHNob3VsZCBhdHRhY2ggdG8gdGhlIHByb3RvdHlwZSBvZiBnbG9iYWwsIHNpbmNlIHRoYXQgaXMgd2hlcmUgc2V0VGltZW91dCBldCBhbC4gbGl2ZS5cblx0ICAgIHZhciBhdHRhY2hUbyA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZ2xvYmFsKTtcblx0ICAgIGF0dGFjaFRvID0gYXR0YWNoVG8gJiYgYXR0YWNoVG8uc2V0VGltZW91dCA/IGF0dGFjaFRvIDogZ2xvYmFsO1xuXG5cdCAgICAvLyBEb24ndCBnZXQgZm9vbGVkIGJ5IGUuZy4gYnJvd3NlcmlmeSBlbnZpcm9ubWVudHMuXG5cdCAgICBpZiAoe30udG9TdHJpbmcuY2FsbChnbG9iYWwucHJvY2VzcykgPT09IFwiW29iamVjdCBwcm9jZXNzXVwiKSB7XG5cdCAgICAgICAgLy8gRm9yIE5vZGUuanMgYmVmb3JlIDAuOVxuXHQgICAgICAgIGluc3RhbGxOZXh0VGlja0ltcGxlbWVudGF0aW9uKCk7XG5cblx0ICAgIH0gZWxzZSBpZiAoY2FuVXNlUG9zdE1lc3NhZ2UoKSkge1xuXHQgICAgICAgIC8vIEZvciBub24tSUUxMCBtb2Rlcm4gYnJvd3NlcnNcblx0ICAgICAgICBpbnN0YWxsUG9zdE1lc3NhZ2VJbXBsZW1lbnRhdGlvbigpO1xuXG5cdCAgICB9IGVsc2UgaWYgKGdsb2JhbC5NZXNzYWdlQ2hhbm5lbCkge1xuXHQgICAgICAgIC8vIEZvciB3ZWIgd29ya2Vycywgd2hlcmUgc3VwcG9ydGVkXG5cdCAgICAgICAgaW5zdGFsbE1lc3NhZ2VDaGFubmVsSW1wbGVtZW50YXRpb24oKTtcblxuXHQgICAgfSBlbHNlIGlmIChkb2MgJiYgXCJvbnJlYWR5c3RhdGVjaGFuZ2VcIiBpbiBkb2MuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKSkge1xuXHQgICAgICAgIC8vIEZvciBJRSA24oCTOFxuXHQgICAgICAgIGluc3RhbGxSZWFkeVN0YXRlQ2hhbmdlSW1wbGVtZW50YXRpb24oKTtcblxuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICAvLyBGb3Igb2xkZXIgYnJvd3NlcnNcblx0ICAgICAgICBpbnN0YWxsU2V0VGltZW91dEltcGxlbWVudGF0aW9uKCk7XG5cdCAgICB9XG5cblx0ICAgIGF0dGFjaFRvLnNldEltbWVkaWF0ZSA9IHNldEltbWVkaWF0ZTtcblx0ICAgIGF0dGFjaFRvLmNsZWFySW1tZWRpYXRlID0gY2xlYXJJbW1lZGlhdGU7XG5cdH0odHlwZW9mIHNlbGYgPT09IFwidW5kZWZpbmVkXCIgPyB0eXBlb2YgZ2xvYmFsID09PSBcInVuZGVmaW5lZFwiID8gdGhpcyA6IGdsb2JhbCA6IHNlbGYpKTtcblxuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi99LmNhbGwoZXhwb3J0cywgKGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSgpKSwgX193ZWJwYWNrX3JlcXVpcmVfXygxMykpKVxuXG4vKioqLyB9KSxcbi8qIDEzICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0XG5cbi8qKiovIH0pLFxuLyogMTQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIExvYWRlciA9IF9fd2VicGFja19yZXF1aXJlX18oMTUpO1xuXG5cdHZhciBQcmVjb21waWxlZExvYWRlciA9IExvYWRlci5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24oY29tcGlsZWRUZW1wbGF0ZXMpIHtcblx0ICAgICAgICB0aGlzLnByZWNvbXBpbGVkID0gY29tcGlsZWRUZW1wbGF0ZXMgfHwge307XG5cdCAgICB9LFxuXG5cdCAgICBnZXRTb3VyY2U6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZiAodGhpcy5wcmVjb21waWxlZFtuYW1lXSkge1xuXHQgICAgICAgICAgICByZXR1cm4ge1xuXHQgICAgICAgICAgICAgICAgc3JjOiB7IHR5cGU6ICdjb2RlJyxcblx0ICAgICAgICAgICAgICAgICAgICAgICBvYmo6IHRoaXMucHJlY29tcGlsZWRbbmFtZV0gfSxcblx0ICAgICAgICAgICAgICAgIHBhdGg6IG5hbWVcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICB9XG5cdH0pO1xuXG5cdG1vZHVsZS5leHBvcnRzID0gUHJlY29tcGlsZWRMb2FkZXI7XG5cblxuLyoqKi8gfSksXG4vKiAxNSAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgcGF0aCA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBPYmogPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDYpO1xuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblxuXHR2YXIgTG9hZGVyID0gT2JqLmV4dGVuZCh7XG5cdCAgICBvbjogZnVuY3Rpb24obmFtZSwgZnVuYykge1xuXHQgICAgICAgIHRoaXMubGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMgfHwge307XG5cdCAgICAgICAgdGhpcy5saXN0ZW5lcnNbbmFtZV0gPSB0aGlzLmxpc3RlbmVyc1tuYW1lXSB8fCBbXTtcblx0ICAgICAgICB0aGlzLmxpc3RlbmVyc1tuYW1lXS5wdXNoKGZ1bmMpO1xuXHQgICAgfSxcblxuXHQgICAgZW1pdDogZnVuY3Rpb24obmFtZSAvKiwgYXJnMSwgYXJnMiwgLi4uKi8pIHtcblx0ICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cblx0ICAgICAgICBpZih0aGlzLmxpc3RlbmVycyAmJiB0aGlzLmxpc3RlbmVyc1tuYW1lXSkge1xuXHQgICAgICAgICAgICBsaWIuZWFjaCh0aGlzLmxpc3RlbmVyc1tuYW1lXSwgZnVuY3Rpb24obGlzdGVuZXIpIHtcblx0ICAgICAgICAgICAgICAgIGxpc3RlbmVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICByZXNvbHZlOiBmdW5jdGlvbihmcm9tLCB0bykge1xuXHQgICAgICAgIHJldHVybiBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKGZyb20pLCB0byk7XG5cdCAgICB9LFxuXG5cdCAgICBpc1JlbGF0aXZlOiBmdW5jdGlvbihmaWxlbmFtZSkge1xuXHQgICAgICAgIHJldHVybiAoZmlsZW5hbWUuaW5kZXhPZignLi8nKSA9PT0gMCB8fCBmaWxlbmFtZS5pbmRleE9mKCcuLi8nKSA9PT0gMCk7XG5cdCAgICB9XG5cdH0pO1xuXG5cdG1vZHVsZS5leHBvcnRzID0gTG9hZGVyO1xuXG5cbi8qKiovIH0pLFxuLyogMTYgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHRmdW5jdGlvbiBpbnN0YWxsQ29tcGF0KCkge1xuXHQgICAgJ3VzZSBzdHJpY3QnO1xuXG5cdCAgICAvLyBUaGlzIG11c3QgYmUgY2FsbGVkIGxpa2UgYG51bmp1Y2tzLmluc3RhbGxDb21wYXRgIHNvIHRoYXQgYHRoaXNgXG5cdCAgICAvLyByZWZlcmVuY2VzIHRoZSBudW5qdWNrcyBpbnN0YW5jZVxuXHQgICAgdmFyIHJ1bnRpbWUgPSB0aGlzLnJ1bnRpbWU7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgICAgdmFyIGxpYiA9IHRoaXMubGliOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgIHZhciBDb21waWxlciA9IHRoaXMuY29tcGlsZXIuQ29tcGlsZXI7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgICAgdmFyIFBhcnNlciA9IHRoaXMucGFyc2VyLlBhcnNlcjsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cdCAgICB2YXIgbm9kZXMgPSB0aGlzLm5vZGVzOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgIHZhciBsZXhlciA9IHRoaXMubGV4ZXI7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG5cdCAgICB2YXIgb3JpZ19jb250ZXh0T3JGcmFtZUxvb2t1cCA9IHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXA7XG5cdCAgICB2YXIgb3JpZ19Db21waWxlcl9hc3NlcnRUeXBlID0gQ29tcGlsZXIucHJvdG90eXBlLmFzc2VydFR5cGU7XG5cdCAgICB2YXIgb3JpZ19QYXJzZXJfcGFyc2VBZ2dyZWdhdGUgPSBQYXJzZXIucHJvdG90eXBlLnBhcnNlQWdncmVnYXRlO1xuXHQgICAgdmFyIG9yaWdfbWVtYmVyTG9va3VwID0gcnVudGltZS5tZW1iZXJMb29rdXA7XG5cblx0ICAgIGZ1bmN0aW9uIHVuaW5zdGFsbCgpIHtcblx0ICAgICAgICBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwID0gb3JpZ19jb250ZXh0T3JGcmFtZUxvb2t1cDtcblx0ICAgICAgICBDb21waWxlci5wcm90b3R5cGUuYXNzZXJ0VHlwZSA9IG9yaWdfQ29tcGlsZXJfYXNzZXJ0VHlwZTtcblx0ICAgICAgICBQYXJzZXIucHJvdG90eXBlLnBhcnNlQWdncmVnYXRlID0gb3JpZ19QYXJzZXJfcGFyc2VBZ2dyZWdhdGU7XG5cdCAgICAgICAgcnVudGltZS5tZW1iZXJMb29rdXAgPSBvcmlnX21lbWJlckxvb2t1cDtcblx0ICAgIH1cblxuXHQgICAgcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cCA9IGZ1bmN0aW9uKGNvbnRleHQsIGZyYW1lLCBrZXkpIHtcblx0ICAgICAgICB2YXIgdmFsID0gb3JpZ19jb250ZXh0T3JGcmFtZUxvb2t1cC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICBzd2l0Y2ggKGtleSkge1xuXHQgICAgICAgICAgICBjYXNlICdUcnVlJzpcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgICAgICAgICBjYXNlICdGYWxzZSc6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgICAgIGNhc2UgJ05vbmUnOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgfTtcblxuXHQgICAgdmFyIFNsaWNlID0gbm9kZXMuTm9kZS5leHRlbmQoJ1NsaWNlJywge1xuXHQgICAgICAgIGZpZWxkczogWydzdGFydCcsICdzdG9wJywgJ3N0ZXAnXSxcblx0ICAgICAgICBpbml0OiBmdW5jdGlvbihsaW5lbm8sIGNvbG5vLCBzdGFydCwgc3RvcCwgc3RlcCkge1xuXHQgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IHx8IG5ldyBub2Rlcy5MaXRlcmFsKGxpbmVubywgY29sbm8sIG51bGwpO1xuXHQgICAgICAgICAgICBzdG9wID0gc3RvcCB8fCBuZXcgbm9kZXMuTGl0ZXJhbChsaW5lbm8sIGNvbG5vLCBudWxsKTtcblx0ICAgICAgICAgICAgc3RlcCA9IHN0ZXAgfHwgbmV3IG5vZGVzLkxpdGVyYWwobGluZW5vLCBjb2xubywgMSk7XG5cdCAgICAgICAgICAgIHRoaXMucGFyZW50KGxpbmVubywgY29sbm8sIHN0YXJ0LCBzdG9wLCBzdGVwKTtcblx0ICAgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgQ29tcGlsZXIucHJvdG90eXBlLmFzc2VydFR5cGUgPSBmdW5jdGlvbihub2RlKSB7XG5cdCAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBTbGljZSkge1xuXHQgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBvcmlnX0NvbXBpbGVyX2Fzc2VydFR5cGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgIH07XG5cdCAgICBDb21waWxlci5wcm90b3R5cGUuY29tcGlsZVNsaWNlID0gZnVuY3Rpb24obm9kZSwgZnJhbWUpIHtcblx0ICAgICAgICB0aGlzLmVtaXQoJygnKTtcblx0ICAgICAgICB0aGlzLl9jb21waWxlRXhwcmVzc2lvbihub2RlLnN0YXJ0LCBmcmFtZSk7XG5cdCAgICAgICAgdGhpcy5lbWl0KCcpLCgnKTtcblx0ICAgICAgICB0aGlzLl9jb21waWxlRXhwcmVzc2lvbihub2RlLnN0b3AsIGZyYW1lKTtcblx0ICAgICAgICB0aGlzLmVtaXQoJyksKCcpO1xuXHQgICAgICAgIHRoaXMuX2NvbXBpbGVFeHByZXNzaW9uKG5vZGUuc3RlcCwgZnJhbWUpO1xuXHQgICAgICAgIHRoaXMuZW1pdCgnKScpO1xuXHQgICAgfTtcblxuXHQgICAgZnVuY3Rpb24gZ2V0VG9rZW5zU3RhdGUodG9rZW5zKSB7XG5cdCAgICAgICAgcmV0dXJuIHtcblx0ICAgICAgICAgICAgaW5kZXg6IHRva2Vucy5pbmRleCxcblx0ICAgICAgICAgICAgbGluZW5vOiB0b2tlbnMubGluZW5vLFxuXHQgICAgICAgICAgICBjb2xubzogdG9rZW5zLmNvbG5vXG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgUGFyc2VyLnByb3RvdHlwZS5wYXJzZUFnZ3JlZ2F0ZSA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblx0ICAgICAgICB2YXIgb3JpZ1N0YXRlID0gZ2V0VG9rZW5zU3RhdGUodGhpcy50b2tlbnMpO1xuXHQgICAgICAgIC8vIFNldCBiYWNrIG9uZSBhY2NvdW50aW5nIGZvciBvcGVuaW5nIGJyYWNrZXQvcGFyZW5zXG5cdCAgICAgICAgb3JpZ1N0YXRlLmNvbG5vLS07XG5cdCAgICAgICAgb3JpZ1N0YXRlLmluZGV4LS07XG5cdCAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgcmV0dXJuIG9yaWdfUGFyc2VyX3BhcnNlQWdncmVnYXRlLmFwcGx5KHRoaXMpO1xuXHQgICAgICAgIH0gY2F0Y2goZSkge1xuXHQgICAgICAgICAgICB2YXIgZXJyU3RhdGUgPSBnZXRUb2tlbnNTdGF0ZSh0aGlzLnRva2Vucyk7XG5cdCAgICAgICAgICAgIHZhciByZXRocm93ID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICBsaWIuZXh0ZW5kKHNlbGYudG9rZW5zLCBlcnJTdGF0ZSk7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZTtcblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAvLyBSZXNldCB0byBzdGF0ZSBiZWZvcmUgb3JpZ2luYWwgcGFyc2VBZ2dyZWdhdGUgY2FsbGVkXG5cdCAgICAgICAgICAgIGxpYi5leHRlbmQodGhpcy50b2tlbnMsIG9yaWdTdGF0ZSk7XG5cdCAgICAgICAgICAgIHRoaXMucGVla2VkID0gZmFsc2U7XG5cblx0ICAgICAgICAgICAgdmFyIHRvayA9IHRoaXMucGVla1Rva2VuKCk7XG5cdCAgICAgICAgICAgIGlmICh0b2sudHlwZSAhPT0gbGV4ZXIuVE9LRU5fTEVGVF9CUkFDS0VUKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyByZXRocm93KCk7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdmFyIG5vZGUgPSBuZXcgU2xpY2UodG9rLmxpbmVubywgdG9rLmNvbG5vKTtcblxuXHQgICAgICAgICAgICAvLyBJZiB3ZSBkb24ndCBlbmNvdW50ZXIgYSBjb2xvbiB3aGlsZSBwYXJzaW5nLCB0aGlzIGlzIG5vdCBhIHNsaWNlLFxuXHQgICAgICAgICAgICAvLyBzbyByZS1yYWlzZSB0aGUgb3JpZ2luYWwgZXhjZXB0aW9uLlxuXHQgICAgICAgICAgICB2YXIgaXNTbGljZSA9IGZhbHNlO1xuXG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG5vZGUuZmllbGRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAodGhpcy5za2lwKGxleGVyLlRPS0VOX1JJR0hUX0JSQUNLRVQpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBpZiAoaSA9PT0gbm9kZS5maWVsZHMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGlzU2xpY2UpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsKCdwYXJzZVNsaWNlOiB0b28gbWFueSBzbGljZSBjb21wb25lbnRzJywgdG9rLmxpbmVubywgdG9rLmNvbG5vKTtcblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBpZiAodGhpcy5za2lwKGxleGVyLlRPS0VOX0NPTE9OKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGlzU2xpY2UgPSB0cnVlO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgZmllbGQgPSBub2RlLmZpZWxkc1tpXTtcblx0ICAgICAgICAgICAgICAgICAgICBub2RlW2ZpZWxkXSA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cdCAgICAgICAgICAgICAgICAgICAgaXNTbGljZSA9IHRoaXMuc2tpcChsZXhlci5UT0tFTl9DT0xPTikgfHwgaXNTbGljZTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZiAoIWlzU2xpY2UpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IHJldGhyb3coKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkFycmF5KHRvay5saW5lbm8sIHRvay5jb2xubywgW25vZGVdKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICBmdW5jdGlvbiBzbGljZUxvb2t1cChvYmosIHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG5cdCAgICAgICAgb2JqID0gb2JqIHx8IFtdO1xuXHQgICAgICAgIGlmIChzdGFydCA9PT0gbnVsbCkge1xuXHQgICAgICAgICAgICBzdGFydCA9IChzdGVwIDwgMCkgPyAob2JqLmxlbmd0aCAtIDEpIDogMDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgaWYgKHN0b3AgPT09IG51bGwpIHtcblx0ICAgICAgICAgICAgc3RvcCA9IChzdGVwIDwgMCkgPyAtMSA6IG9iai5sZW5ndGg7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgaWYgKHN0b3AgPCAwKSB7XG5cdCAgICAgICAgICAgICAgICBzdG9wICs9IG9iai5sZW5ndGg7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAoc3RhcnQgPCAwKSB7XG5cdCAgICAgICAgICAgIHN0YXJ0ICs9IG9iai5sZW5ndGg7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcblxuXHQgICAgICAgIGZvciAodmFyIGkgPSBzdGFydDsgOyBpICs9IHN0ZXApIHtcblx0ICAgICAgICAgICAgaWYgKGkgPCAwIHx8IGkgPiBvYmoubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZiAoc3RlcCA+IDAgJiYgaSA+PSBzdG9wKSB7XG5cdCAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZiAoc3RlcCA8IDAgJiYgaSA8PSBzdG9wKSB7XG5cdCAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXN1bHRzLnB1c2gocnVudGltZS5tZW1iZXJMb29rdXAob2JqLCBpKSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiByZXN1bHRzO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgQVJSQVlfTUVNQkVSUyA9IHtcblx0ICAgICAgICBwb3A6IGZ1bmN0aW9uKGluZGV4KSB7XG5cdCAgICAgICAgICAgIGlmIChpbmRleCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wb3AoKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZiAoaW5kZXggPj0gdGhpcy5sZW5ndGggfHwgaW5kZXggPCAwKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0tleUVycm9yJyk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGFwcGVuZDogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChlbGVtZW50KTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIHJlbW92ZTogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIGlmICh0aGlzW2ldID09PSBlbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGksIDEpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsdWVFcnJvcicpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgY291bnQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gZWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGNvdW50Kys7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIGNvdW50O1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgaW5kZXg6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgdmFyIGk7XG5cdCAgICAgICAgICAgIGlmICgoaSA9IHRoaXMuaW5kZXhPZihlbGVtZW50KSkgPT09IC0xKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlRXJyb3InKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gaTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGZpbmQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihlbGVtZW50KTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGluc2VydDogZnVuY3Rpb24oaW5kZXgsIGVsZW0pIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGluZGV4LCAwLCBlbGVtKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXHQgICAgdmFyIE9CSkVDVF9NRU1CRVJTID0ge1xuXHQgICAgICAgIGl0ZW1zOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuXHQgICAgICAgICAgICBmb3IodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgICAgICAgICAgcmV0LnB1c2goW2ssIHRoaXNba11dKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gcmV0O1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgdmFsdWVzOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuXHQgICAgICAgICAgICBmb3IodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgICAgICAgICAgcmV0LnB1c2godGhpc1trXSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHJldDtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGtleXM6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICB2YXIgcmV0ID0gW107XG5cdCAgICAgICAgICAgIGZvcih2YXIgayBpbiB0aGlzKSB7XG5cdCAgICAgICAgICAgICAgICByZXQucHVzaChrKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gcmV0O1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXksIGRlZikge1xuXHQgICAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpc1trZXldO1xuXHQgICAgICAgICAgICBpZiAob3V0cHV0ID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIG91dHB1dCA9IGRlZjtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgaGFzX2tleTogZnVuY3Rpb24oa2V5KSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLmhhc093blByb3BlcnR5KGtleSk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBwb3A6IGZ1bmN0aW9uKGtleSwgZGVmKSB7XG5cdCAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzW2tleV07XG5cdCAgICAgICAgICAgIGlmIChvdXRwdXQgPT09IHVuZGVmaW5lZCAmJiBkZWYgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgb3V0cHV0ID0gZGVmO1xuXHQgICAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0tleUVycm9yJyk7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBkZWxldGUgdGhpc1trZXldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBwb3BpdGVtOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgayBpbiB0aGlzKSB7XG5cdCAgICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIGZpcnN0IG9iamVjdCBwYWlyLlxuXHQgICAgICAgICAgICAgICAgdmFyIHZhbCA9IHRoaXNba107XG5cdCAgICAgICAgICAgICAgICBkZWxldGUgdGhpc1trXTtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBbaywgdmFsXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0tleUVycm9yJyk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBzZXRkZWZhdWx0OiBmdW5jdGlvbihrZXksIGRlZikge1xuXHQgICAgICAgICAgICBpZiAoa2V5IGluIHRoaXMpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2tleV07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYgKGRlZiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICBkZWYgPSBudWxsO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzW2tleV0gPSBkZWY7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKGt3YXJncykge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBrIGluIGt3YXJncykge1xuXHQgICAgICAgICAgICAgICAgdGhpc1trXSA9IGt3YXJnc1trXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gbnVsbDsgICAgLy8gQWx3YXlzIHJldHVybnMgTm9uZVxuXHQgICAgICAgIH1cblx0ICAgIH07XG5cdCAgICBPQkpFQ1RfTUVNQkVSUy5pdGVyaXRlbXMgPSBPQkpFQ1RfTUVNQkVSUy5pdGVtcztcblx0ICAgIE9CSkVDVF9NRU1CRVJTLml0ZXJ2YWx1ZXMgPSBPQkpFQ1RfTUVNQkVSUy52YWx1ZXM7XG5cdCAgICBPQkpFQ1RfTUVNQkVSUy5pdGVya2V5cyA9IE9CSkVDVF9NRU1CRVJTLmtleXM7XG5cdCAgICBydW50aW1lLm1lbWJlckxvb2t1cCA9IGZ1bmN0aW9uKG9iaiwgdmFsLCBhdXRvZXNjYXBlKSB7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSA0KSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzbGljZUxvb2t1cC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBvYmogPSBvYmogfHwge307XG5cblx0ICAgICAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGFuIG9iamVjdCwgcmV0dXJuIGFueSBvZiB0aGUgbWV0aG9kcyB0aGF0IFB5dGhvbiB3b3VsZFxuXHQgICAgICAgIC8vIG90aGVyd2lzZSBwcm92aWRlLlxuXHQgICAgICAgIGlmIChsaWIuaXNBcnJheShvYmopICYmIEFSUkFZX01FTUJFUlMuaGFzT3duUHJvcGVydHkodmFsKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7cmV0dXJuIEFSUkFZX01FTUJFUlNbdmFsXS5hcHBseShvYmosIGFyZ3VtZW50cyk7fTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAobGliLmlzT2JqZWN0KG9iaikgJiYgT0JKRUNUX01FTUJFUlMuaGFzT3duUHJvcGVydHkodmFsKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7cmV0dXJuIE9CSkVDVF9NRU1CRVJTW3ZhbF0uYXBwbHkob2JqLCBhcmd1bWVudHMpO307XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIG9yaWdfbWVtYmVyTG9va3VwLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICB9O1xuXG5cdCAgICByZXR1cm4gdW5pbnN0YWxsO1xuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBpbnN0YWxsQ29tcGF0O1xuXG5cbi8qKiovIH0pXG4vKioqKioqLyBdKVxufSk7XG47IiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtaXRlbS1jb21tZW50Lmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPGRpdiBjbGFzcz1cXFwiaXRlbXMtY29udGFpbmVySW5kZW50XFxcIj5cXG4gIDwhLS0gYXV0aG9yIHBsdXMgYXZhdGFyIC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yIGxiLWF1dGhvci0taW5kZW50XFxcIj5cXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93QXV0aG9yXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJvcmlnaW5hbF9jcmVhdG9yXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dBdXRob3JBdmF0YXJcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGltZyBjbGFzcz1cXFwibGItYXV0aG9yX19hdmF0YXIgbGItYXV0aG9yX19hdmF0YXItLWNvbW1lbnRcXFwiIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXNzZXRzX3Jvb3RcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiaW1hZ2VzL2NvbW1lbnRfaWNvbi5zdmdcXFwiPlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yX19uYW1lXFxcIj5cXG4gICAgICAgICAgICBDb21tZW50IGJ5IFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwiY29tbWVudGVyXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwvZGl2PlxcbiAgIDxhcnRpY2xlPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJ0ZXh0XCIpKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2FydGljbGU+XFxuPC9kaXY+XCI7XG5pZihwYXJlbnRUZW1wbGF0ZSkge1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSBlbHNlIHtcbmNiKG51bGwsIG91dHB1dCk7XG59XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbnJvb3Q6IHJvb3Rcbn07XG5cbn0pKCk7XG5yZXR1cm4gZnVuY3Rpb24oY3R4LCBjYikgeyByZXR1cm4gbnVuanVja3MucmVuZGVyKFwidGVtcGxhdGUtaXRlbS1jb21tZW50Lmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImh0bWxcIikpIHtcbm91dHB1dCArPSBcIlxcbjxkaXYgY2xhc3M9XFxcIml0ZW0tLWVtYmVkX19lbGVtZW50XFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9kaXY+XFxuXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cIjtcbmlmKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGl0bGVcIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImRlc2NyaXB0aW9uXCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjcmVkaXRcIikgfHwgKCFydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGh1bWJuYWlsX3VybFwiKSkpKSB7XG5vdXRwdXQgKz0gXCJcXG48YXJ0aWNsZSBjbGFzcz1cXFwiaXRlbS0tZW1iZWQgaXRlbS0tZW1iZWRfX3dyYXBwZXJcXFwiPlxcbiAgICBcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGh1bWJuYWlsX3VybFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxhIGhyZWY9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiIGNsYXNzPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJkZXNjcmlwdGlvblwiKT9cIml0ZW0tLWVtYmVkX19pbGx1c3RyYXRpb25cIjpcIml0ZW0tLWVtYmVkX19vbmx5LWlsbHVzdHJhdGlvblwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgICAgICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGh1bWJuYWlsX3VybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiLz5cXG4gICA8L2E+XFxuICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aXRsZVwiKSB8fCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiZGVzY3JpcHRpb25cIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX2luZm9cXFwiPlxcbiAgICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGl0bGVcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX3RpdGxlXFxcIj5cXG4gICAgICAgICAgICA8YSBocmVmPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInVybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIiB0aXRsZT1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aXRsZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGl0bGVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9hPlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiZGVzY3JpcHRpb25cIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX2Rlc2NyaXB0aW9uXFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImRlc2NyaXB0aW9uXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcbiAgICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpdGVtLS1lbWJlZF9fY3JlZGl0XFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIDwvZGl2PlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbjwvYXJ0aWNsZT5cXG5cIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG5vdXRwdXQgKz0gXCI8ZmlndXJlPlxcbiAgPGltZyBcXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwiYWN0aXZlXCIpKSB7XG5vdXRwdXQgKz0gXCJjbGFzcz1cXFwiYWN0aXZlXFxcIlwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcInRodW1ibmFpbFwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCJcXG4gICAgc3Jjc2V0PVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwiYmFzZUltYWdlXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDgxMHcsIFxcbiAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwidGh1bWJuYWlsXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDI0MHcsIFxcbiAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwidmlld0ltYWdlXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDU0MHdcXFwiIFxcbiAgICBhbHQ9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY2FwdGlvblwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgPGZpZ2NhcHRpb24+XFxuICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNhcHRpb25cIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxzcGFuIG5nLWlmPVxcXCJyZWYuaXRlbS5tZXRhLmNhcHRpb25cXFwiIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cXG4gICAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY2FwdGlvblwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8L3NwYW4+Jm5ic3A7XFxuICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPHNwYW4gbmctaWY9XFxcInJlZi5pdGVtLm1ldGEuY3JlZGl0XFxcIiBjbGFzcz1cXFwiY3JlZGl0XFxcIj5cXG4gICAgICAgIDxiPkNyZWRpdDo8L2I+IFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY3JlZGl0XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIDwvc3Bhbj5cXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwvZmlnY2FwdGlvbj5cXG48L2ZpZ3VyZT5cXG5cXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1pdGVtLXF1b3RlLmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWQtcXVvdGVcXFwiPlxcbiAgICA8YmxvY2txdW90ZT5cXG4gICAgICAgIDxwPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwicXVvdGVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9wPlxcbiAgICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY3JlZGl0XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICA8aDQ+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjcmVkaXRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9oND5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIDwvYmxvY2txdW90ZT5cXG48L2Rpdj5cXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1pdGVtLXF1b3RlLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1wb3N0LWNvbW1lbnQuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG5vdXRwdXQgKz0gXCI8ZGl2IGNsYXNzPVxcXCJcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInN0aWNreVwiKSB8fCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzdGlja3lQb3NpdGlvblwiKSA9PSBcImJvdHRvbVwiKSB7XG5vdXRwdXQgKz0gXCJsYi1pdGVtXCI7XG47XG59XG5vdXRwdXQgKz0gXCIgY29tbWVudEl0ZW1cXFwiPlxcbiAgICA8YXJ0aWNsZT5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpKSwwKSksXCJpdGVtXCIpKSxcInRleHRcIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvYXJ0aWNsZT5cXG48L2Rpdj5cXG5cIjtcbmlmKGVudi5nZXRGaWx0ZXIoXCJsZW5ndGhcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpKSA+IDEpIHtcbm91dHB1dCArPSBcIlxcbjxkaXYgY2xhc3M9XFxcIml0ZW1zLWNvbnRhaW5lckluZGVudFxcXCI+XFxuXCI7XG52YXIgdF8xO1xudF8xID0gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpKSwxKSksXCJpdGVtXCIpO1xuZnJhbWUuc2V0KFwic2Vjb25kYXJ5XCIsIHRfMSwgdHJ1ZSk7XG5pZihmcmFtZS50b3BMZXZlbCkge1xuY29udGV4dC5zZXRWYXJpYWJsZShcInNlY29uZGFyeVwiLCB0XzEpO1xufVxuaWYoZnJhbWUudG9wTGV2ZWwpIHtcbmNvbnRleHQuYWRkRXhwb3J0KFwic2Vjb25kYXJ5XCIsIHRfMSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwhLS0gYXV0aG9yIHBsdXMgYXZhdGFyIC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yIGxiLWF1dGhvci0taW5kZW50XFxcIj5cXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93QXV0aG9yXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNlY29uZGFyeVwiKSksXCJvcmlnaW5hbF9jcmVhdG9yXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dBdXRob3JBdmF0YXJcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2Vjb25kYXJ5XCIpKSxcIm9yaWdpbmFsX2NyZWF0b3JcIikpLFwicGljdHVyZV91cmxcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGltZyBjbGFzcz1cXFwibGItYXV0aG9yX19hdmF0YXJcXFwiIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZWNvbmRhcnlcIikpLFwib3JpZ2luYWxfY3JlYXRvclwiKSksXCJwaWN0dXJlX3VybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiIC8+XFxuICAgICAgICBcIjtcbjtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJsYi1hdXRob3JfX2F2YXRhclxcXCI+PC9kaXY+XFxuICAgICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yX19uYW1lXFxcIj5cXG4gICAgICAgICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNlY29uZGFyeVwiKSksXCJvcmlnaW5hbF9jcmVhdG9yXCIpKSxcImRpc3BsYXlfbmFtZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDwvZGl2PlxcbiAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICA8L2Rpdj5cXG4gIDwhLS0gZW5kIGF1dGhvciAtLT5cXG4gICAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzQgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpO1xuaWYodF80KSB7dmFyIHRfMyA9IHRfNC5sZW5ndGg7XG5mb3IodmFyIHRfMj0wOyB0XzIgPCB0XzQubGVuZ3RoOyB0XzIrKykge1xudmFyIHRfNSA9IHRfNFt0XzJdO1xuZnJhbWUuc2V0KFwicmVmXCIsIHRfNSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4XCIsIHRfMiArIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleDBcIiwgdF8yKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF8zIC0gdF8yKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXgwXCIsIHRfMyAtIHRfMiAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5maXJzdFwiLCB0XzIgPT09IDApO1xuZnJhbWUuc2V0KFwibG9vcC5sYXN0XCIsIHRfMiA9PT0gdF8zIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmxlbmd0aFwiLCB0XzMpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJsb29wXCIpKSxcImluZGV4MFwiKSA+IDApIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF81KSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwiaW1hZ2VcIikge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIDxkaXYgY2xhc3M9XFxcIlwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwiYm90dG9tXCIpIHtcbm91dHB1dCArPSBcImxiLWl0ZW1cIjtcbjtcbn1cbm91dHB1dCArPSBcIiBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJvcmlnaW5hbFwiKSksXCJoZWlnaHRcIikgPiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzUpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwib3JpZ2luYWxcIikpLFwid2lkdGhcIikpIHtcbm91dHB1dCArPSBcInBvcnRyYWl0XCI7XG47XG59XG5vdXRwdXQgKz0gXCIgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF81KSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XFxuICAgICAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgPGRpdiBjbGFzcz1cXFwiXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJzdGlja3lcIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic3RpY2t5UG9zaXRpb25cIikgPT0gXCJib3R0b21cIikge1xub3V0cHV0ICs9IFwibGItaXRlbVwiO1xuO1xufVxub3V0cHV0ICs9IFwiIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNSksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgICAgICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzUpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJlbWJlZFwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS1wb3N0LWNvbW1lbnQuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzgsdF82KSB7XG5pZih0XzgpIHsgY2IodF84KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzksdF83KSB7XG5pZih0XzkpIHsgY2IodF85KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNyk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICAgIFwiO1xufSk7XG59XG5lbHNlIHtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF81KSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwiaW1hZ2VcIikge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtcG9zdC1jb21tZW50Lmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8xMix0XzEwKSB7XG5pZih0XzEyKSB7IGNiKHRfMTIpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xMCk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzEzLHRfMTEpIHtcbmlmKHRfMTMpIHsgY2IodF8xMyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzExKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzUpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJxdW90ZVwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWl0ZW0tcXVvdGUuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS1wb3N0LWNvbW1lbnQuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzE2LHRfMTQpIHtcbmlmKHRfMTYpIHsgY2IodF8xNik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzE0KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMTcsdF8xNSkge1xuaWYodF8xNykgeyBjYih0XzE3KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTUpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICBcIjtcbn0pO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICAgIDxhcnRpY2xlPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF81KSxcIml0ZW1cIikpLFwidGV4dFwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9hcnRpY2xlPlxcbiAgICAgICAgICAgIFwiO1xuO1xufVxuO1xufVxuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbjwvZGl2PlxcblwiO1xuO1xufVxuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLXBvc3QtY29tbWVudC5odG1sXCIsIGN0eCwgY2IpOyB9XG59KSgpO1xuO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtcG9zdC5odG1sXCJdID0gKGZ1bmN0aW9uKCkge1xuZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIHBhcmVudFRlbXBsYXRlID0gbnVsbDtcbnZhciB0XzE7XG50XzEgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJncm91cHNcIikpLDEpKSxcInJlZnNcIikpLDApKSxcIml0ZW1cIik7XG5mcmFtZS5zZXQoXCJtYWluSXRlbVwiLCB0XzEsIHRydWUpO1xuaWYoZnJhbWUudG9wTGV2ZWwpIHtcbmNvbnRleHQuc2V0VmFyaWFibGUoXCJtYWluSXRlbVwiLCB0XzEpO1xufVxuaWYoZnJhbWUudG9wTGV2ZWwpIHtcbmNvbnRleHQuYWRkRXhwb3J0KFwibWFpbkl0ZW1cIiwgdF8xKTtcbn1cbm91dHB1dCArPSBcIlxcblwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwibWFpbkl0ZW1cIikpLFwiY29tbWVudGVyXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gIFwiO1xudmFyIHRfMjtcbnRfMiA9IFwiY29tbWVudFwiO1xuZnJhbWUuc2V0KFwidHlwZVwiLCB0XzIsIHRydWUpO1xuaWYoZnJhbWUudG9wTGV2ZWwpIHtcbmNvbnRleHQuc2V0VmFyaWFibGUoXCJ0eXBlXCIsIHRfMik7XG59XG5pZihmcmFtZS50b3BMZXZlbCkge1xuY29udGV4dC5hZGRFeHBvcnQoXCJ0eXBlXCIsIHRfMik7XG59XG5vdXRwdXQgKz0gXCJcXG5cIjtcbjtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICBcIjtcbnZhciB0XzM7XG50XzMgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInBvc3RfaXRlbXNfdHlwZVwiKTtcbmZyYW1lLnNldChcInR5cGVcIiwgdF8zLCB0cnVlKTtcbmlmKGZyYW1lLnRvcExldmVsKSB7XG5jb250ZXh0LnNldFZhcmlhYmxlKFwidHlwZVwiLCB0XzMpO1xufVxuaWYoZnJhbWUudG9wTGV2ZWwpIHtcbmNvbnRleHQuYWRkRXhwb3J0KFwidHlwZVwiLCB0XzMpO1xufVxub3V0cHV0ICs9IFwiXFxuXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG48IS0tIHN0aWNreSBwb3NpdGlvbiB0b2dnbGUgLS0+XFxuXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInN0aWNreVwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzdGlja3lQb3NpdGlvblwiKSA9PSBcInRvcFwiKSB7XG5vdXRwdXQgKz0gXCJcXG48YXJ0aWNsZVxcbiAgY2xhc3M9XFxcImxiLXN0aWNreS10b3AtcG9zdCBsaXN0LWdyb3VwLWl0ZW0gXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwidHlwZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiXFxuICBkYXRhLWpzLXBvc3QtaWQ9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcIl9pZFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbjxhcnRpY2xlXFxuICBjbGFzcz1cXFwibGItcG9zdCBsaXN0LWdyb3VwLWl0ZW0gc2hvdy1hdXRob3ItYXZhdGFyIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInR5cGVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJsYl9oaWdobGlnaHRcIikpIHtcbm91dHB1dCArPSBcImxiLXBvc3QtLWhpZ2hsaWdodGVkXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiXFxuICBkYXRhLWpzLXBvc3QtaWQ9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcIl9pZFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgICBcXG4gIDxkaXYgY2xhc3M9XFxcImxiLXR5cGUgbGItdHlwZS0tXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicG9zdF9pdGVtc190eXBlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+PC9kaXY+XFxuXFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwibGJfaGlnaGxpZ2h0XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9waW5wb3N0LnN2Z1xcXCIgY2xhc3M9XFxcInBpbi1pY29uXFxcIiAvPlxcbiAgICA8aW1nIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXNzZXRzX3Jvb3RcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiaW1hZ2VzL2hpZ2hsaWdodGVkLnN2Z1xcXCIgY2xhc3M9XFxcImhpZ2hsaWdodC1pY29uXFxcIiAvPlxcbiAgXCI7XG47XG59XG5lbHNlIHtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9waW5wb3N0LnN2Z1xcXCIgY2xhc3M9XFxcInBpbi1pY29uXFxcIiAvPlxcbiAgXCI7XG47XG59XG5lbHNlIHtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwibGJfaGlnaGxpZ2h0XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9oaWdobGlnaHRlZC5zdmdcXFwiIGNsYXNzPVxcXCJoaWdobGlnaHQtaWNvblxcXCIgLz5cXG4gIFwiO1xuO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInBvc3RfaXRlbXNfdHlwZVwiKSA9PSBcImFkdmVydGlzZW1lbnRcIikge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLWFkdmVydGlzZW1lbnRcXFwiPkFkdmVydGlzZW1lbnQ8L2Rpdj5cXG4gIFwiO1xuO1xufVxuO1xufVxuO1xufVxuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICA8IS0tIHJlbW92ZSBhZHZlcnRpc2VtZW50IHN0eWxpemF0aW9uLS0+XFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicG9zdF9pdGVtc190eXBlXCIpICE9IFwiYWR2ZXJ0aXNlbWVudFwiKSB7XG5vdXRwdXQgKz0gXCJcXG5cXG4gIDxkaXYgY2xhc3M9XFxcImxiLXBvc3QtZGF0ZVxcXCIgZGF0YS1qcy10aW1lc3RhbXA9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcIl91cGRhdGVkXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiX3VwZGF0ZWRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9kaXY+XFxuXFxuICA8IS0tIGF1dGhvciBwbHVzIGF2YXRhciAtLT5cXG4gIDxkaXYgY2xhc3M9XFxcImxiLWF1dGhvclxcXCI+XFxuICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0F1dGhvclwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yX19uYW1lXFxcIj5cXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm1haW5JdGVtXCIpKSxcImNvbW1lbnRlclwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBDb21tZW50IGJ5IFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJtYWluSXRlbVwiKSksXCJjb21tZW50ZXJcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG47XG59XG5lbHNlIHtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm1haW5JdGVtXCIpKSxcIm9yaWdpbmFsX2NyZWF0b3JcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJtYWluSXRlbVwiKSksXCJvcmlnaW5hbF9jcmVhdG9yXCIpKSxcImRpc3BsYXlfbmFtZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbjtcbn1cbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgIDwvZGl2PlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0F1dGhvckF2YXRhclwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwidHlwZVwiKSA9PSBcImNvbW1lbnRcIikge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8aW1nIGNsYXNzPVxcXCJsYi1hdXRob3JfX2F2YXRhciBsYi1hdXRob3JfX2F2YXRhci0tY29tbWVudFxcXCIgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhc3NldHNfcm9vdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJpbWFnZXMvY29tbWVudF9pY29uLnN2Z1xcXCI+XFxuICAgICAgICBcIjtcbjtcbn1cbmVsc2Uge1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm1haW5JdGVtXCIpKSxcIm9yaWdpbmFsX2NyZWF0b3JcIikpLFwicGljdHVyZV91cmxcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGltZyBjbGFzcz1cXFwibGItYXV0aG9yX19hdmF0YXJcXFwiIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJtYWluSXRlbVwiKSksXCJvcmlnaW5hbF9jcmVhdG9yXCIpKSxcInBpY3R1cmVfdXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgLz5cXG4gICAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImxiLWF1dGhvcl9fYXZhdGFyXFxcIj48L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwvZGl2PlxcbiAgPCEtLSBlbmQgYXV0aG9yIC0tPlxcblxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwhLS0gZW5kIHN0aWNreSBwb3NpdGlvbiB0b2dnbGUgLS0+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgPCEtLSBlbmQgcmVtb3ZlIGFkdmVydGlzZW1lbnQgc3R5bGl6YXRpb24tLT5cXG5cXG4gIDwhLS0gaXRlbSBzdGFydCAtLT5cXG4gIDxkaXYgY2xhc3M9XFxcIml0ZW1zLWNvbnRhaW5lclxcXCI+XFxuICBcIjtcbmlmKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwidHlwZVwiKSA9PSBcImNvbW1lbnRcIikge1xub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLXBvc3QtY29tbWVudC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzYsdF80KSB7XG5pZih0XzYpIHsgY2IodF82KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNCk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzcsdF81KSB7XG5pZih0XzcpIHsgY2IodF83KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgXCI7XG59KTtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xuZnJhbWUgPSBmcmFtZS5wdXNoKCk7XG52YXIgdF8xMCA9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJncm91cHNcIikpLDEpKSxcInJlZnNcIik7XG5pZih0XzEwKSB7dmFyIHRfOSA9IHRfMTAubGVuZ3RoO1xuZm9yKHZhciB0Xzg9MDsgdF84IDwgdF8xMC5sZW5ndGg7IHRfOCsrKSB7XG52YXIgdF8xMSA9IHRfMTBbdF84XTtcbmZyYW1lLnNldChcInJlZlwiLCB0XzExKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF84ICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzgpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzkgLSB0XzgpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF85IC0gdF84IC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfOCA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF84ID09PSB0XzkgLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfOSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF8xMSksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcImltYWdlXCIpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcIlwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwiYm90dG9tXCIpIHtcbm91dHB1dCArPSBcImxiLWl0ZW1cIjtcbjtcbn1cbm91dHB1dCArPSBcIiBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfMTEpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwib3JpZ2luYWxcIikpLFwiaGVpZ2h0XCIpID4gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF8xMSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJvcmlnaW5hbFwiKSksXCJ3aWR0aFwiKSkge1xub3V0cHV0ICs9IFwicG9ydHJhaXRcIjtcbjtcbn1cbm91dHB1dCArPSBcIiBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzExKSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XFxuICAgICAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcIlwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwiYm90dG9tXCIpIHtcbm91dHB1dCArPSBcImxiLWl0ZW1cIjtcbjtcbn1cbm91dHB1dCArPSBcIiBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzExKSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzExKSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwiZW1iZWRcIikge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8xNCx0XzEyKSB7XG5pZih0XzE0KSB7IGNiKHRfMTQpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xMik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzE1LHRfMTMpIHtcbmlmKHRfMTUpIHsgY2IodF8xNSk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzEzKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbn0pO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfMTEpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJpbWFnZVwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzE4LHRfMTYpIHtcbmlmKHRfMTgpIHsgY2IodF8xOCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzE2KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMTksdF8xNykge1xuaWYodF8xOSkgeyBjYih0XzE5KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTcpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xufSk7XG59XG5lbHNlIHtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF8xMSksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcInF1b3RlXCIpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1pdGVtLXF1b3RlLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMjIsdF8yMCkge1xuaWYodF8yMikgeyBjYih0XzIyKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMjApO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8yMyx0XzIxKSB7XG5pZih0XzIzKSB7IGNiKHRfMjMpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8yMSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzExKSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwiY29tbWVudFwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1jb21tZW50Lmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMjYsdF8yNCkge1xuaWYodF8yNikgeyBjYih0XzI2KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMjQpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8yNyx0XzI1KSB7XG5pZih0XzI3KSB7IGNiKHRfMjcpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8yNSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIDxhcnRpY2xlPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF8xMSksXCJpdGVtXCIpKSxcInRleHRcIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvYXJ0aWNsZT5cXG4gICAgICAgIFwiO1xuO1xufVxuO1xufVxuO1xufVxuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgPC9kaXY+XFxuICAgIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgPC9kaXY+XFxuICA8IS0tIGl0ZW0gZW5kIC0tPlxcblxcbiAgPGRpdiBjbGFzcz1cXFwibGItcG9zdC1hY3Rpb25zXFxcIj5cXG5cXG4gICAgPCEtLSBzaGFyZSBcXG4gICAgICBBY28gc2hhcmUgYnV0dG9ucyBzaG91bGQgYmUgdmlzc2libGUgb24gY2xpY2ssIG5vdCBvbiBzaGFyZVxcbiAgICAtLT5cXG4gICAgPGRpdiBjbGFzcz1cXFwibGItcG9zdC1zaGFyZVxcXCI+XFxuICAgICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9hY3Rpb25fc2hhcmUuc3ZnXFxcIiBjbGFzcz1cXFwibGItcG9zdC1zaGFyZUljb25cXFwiIC8+XFxuICAgICAgPGRpdiBjbGFzcz1cXFwibGItcG9zdC1zaGFyZUJveFxcXCI+XFxuICAgICAgICA8YSBjbGFzcz1cXFwibGItcG9zdC1zaGFyZUJveF9faXRlbVxcXCIgaHJlZj1cXFwiI1xcXCI+PGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9zaGFyZV9mYWNlYm9vay5zdmdcXFwiLz48L2E+XFxuICAgICAgICA8YSBjbGFzcz1cXFwibGItcG9zdC1zaGFyZUJveF9faXRlbVxcXCIgaHJlZj1cXFwiI1xcXCI+PGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9zaGFyZV9nb29nbGUuc3ZnXFxcIi8+PC9hPlxcbiAgICAgICAgPGEgY2xhc3M9XFxcImxiLXBvc3Qtc2hhcmVCb3hfX2l0ZW1cXFwiIGhyZWY9XFxcIiNcXFwiPjxpbWcgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhc3NldHNfcm9vdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJpbWFnZXMvc2hhcmVfbGlua2VkaW4uc3ZnXFxcIi8+PC9hPlxcbiAgICAgICAgPGEgY2xhc3M9XFxcImxiLXBvc3Qtc2hhcmVCb3hfX2l0ZW1cXFwiIGhyZWY9XFxcIiNcXFwiPjxpbWcgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhc3NldHNfcm9vdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJpbWFnZXMvc2hhcmVfdHdpdHRlci5zdmdcXFwiLz48L2E+XFxuICAgICAgICA8YSBjbGFzcz1cXFwibGItcG9zdC1zaGFyZUJveF9faXRlbVxcXCIgaHJlZj1cXFwiI1xcXCI+PGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9zaGFyZV9lbWFpbC5zdmdcXFwiLz48L2E+XFxuICAgICAgICA8c3Bhbj4gfCA8L3NwYW4+XFxuICAgICAgPC9kaXY+XFxuICAgIDwvZGl2PlxcbiAgICA8IS0tIGVuZCBzaGFyZSAtLT5cXG5cXG4gICAgPCEtLSBwZXJtYWxpbmsgLS0+XFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLXBvc3QtcGVybWFsaW5rXFxcIj5cXG4gICAgICA8YSBpZD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiX2lkXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlxcbiAgICAgICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9hY3Rpb25fbGluay5zdmdcXFwiIGNsYXNzPVxcXCJsYi1wb3N0LWxpbmtJY29uXFxcIiAvPlxcbiAgICAgIDwvYT5cXG4gICAgPC9kaXY+XFxuICAgIDwhLS0gZW5kIHBlcm1hbGluayAtLT5cXG5cXG4gIDwvZGl2PlxcblxcbjwvYXJ0aWNsZT5cXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG5vdXRwdXQgKz0gXCI8ZGl2IGlkPVxcXCJzbGlkZXNob3dcXFwiPlxcbiAgPGRpdiBjbGFzcz1cXFwiY29udGFpbmVyXFxcIj5cXG4gICAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzMgPSBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZnNcIik7XG5pZih0XzMpIHt2YXIgdF8yID0gdF8zLmxlbmd0aDtcbmZvcih2YXIgdF8xPTA7IHRfMSA8IHRfMy5sZW5ndGg7IHRfMSsrKSB7XG52YXIgdF80ID0gdF8zW3RfMV07XG5mcmFtZS5zZXQoXCJyZWZcIiwgdF80KTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF8xICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzIgLSB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF8yIC0gdF8xIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfMSA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF8xID09PSB0XzIgLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfMik7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtc2xpZGVzaG93Lmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF83LHRfNSkge1xuaWYodF83KSB7IGNiKHRfNyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzUpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF84LHRfNikge1xuaWYodF84KSB7IGNiKHRfOCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzYpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG59KTtcbn1cbn1cbmZyYW1lID0gZnJhbWUucG9wKCk7XG5vdXRwdXQgKz0gXCJcXG4gIDwvZGl2PlxcbiAgPGJ1dHRvbiBjbGFzcz1cXFwiY2xvc2VcXFwiPjxpbWcgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhc3NldHNfcm9vdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJpbWFnZXMvc2xfY2xvc2Uuc3ZnXFxcIiAvPjwvYnV0dG9uPlxcbiAgPGJ1dHRvbiBjbGFzcz1cXFwiZnVsbHNjcmVlblxcXCI+PGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9zbF9mdWxsc2NyZWVuLnN2Z1xcXCIgLz48L2J1dHRvbj5cXG4gIDxidXR0b24gY2xhc3M9XFxcImFycm93cyBwcmV2XFxcIj48aW1nIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXNzZXRzX3Jvb3RcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiaW1hZ2VzL3NsX2Fycm93X3ByZXZpb3VzLnN2Z1xcXCIgLz48L2J1dHRvbj5cXG4gIDxidXR0b24gY2xhc3M9XFxcImFycm93cyBuZXh0XFxcIj48aW1nIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXNzZXRzX3Jvb3RcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiaW1hZ2VzL3NsX2Fycm93X25leHQuc3ZnXFxcIiAvPjwvYnV0dG9uPlxcbjwvZGl2PlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLXNsaWRlc2hvdy5odG1sXCIsIGN0eCwgY2IpOyB9XG59KSgpO1xuO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG4ocGFyZW50VGVtcGxhdGUgPyBmdW5jdGlvbihlLCBjLCBmLCByLCBjYikgeyBjYihcIlwiKTsgfSA6IGNvbnRleHQuZ2V0QmxvY2soXCJ0aW1lbGluZVwiKSkoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgZnVuY3Rpb24odF8yLHRfMSkge1xuaWYodF8yKSB7IGNiKHRfMik7IHJldHVybjsgfVxub3V0cHV0ICs9IHRfMTtcbm91dHB1dCArPSBcIlxcblxcblwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWVtYmVkLXByb3ZpZGVycy5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF81LHRfMykge1xuaWYodF81KSB7IGNiKHRfNSk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzMpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF82LHRfNCkge1xuaWYodF82KSB7IGNiKHRfNik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzQpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG5cXG5cIjtcbmlmKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaW5jbHVkZV9qc19vcHRpb25zXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gIDxzY3JpcHQgdHlwZT1cXFwidGV4dC9qYXZhc2NyaXB0XFxcIj5cXG4gICAgd2luZG93LkxCID0gXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKGVudi5nZXRGaWx0ZXIoXCJzYWZlXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJqc29uX29wdGlvbnNcIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjtcXG4gIDwvc2NyaXB0PlxcblwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXCI7XG5pZihwYXJlbnRUZW1wbGF0ZSkge1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSBlbHNlIHtcbmNiKG51bGwsIG91dHB1dCk7XG59XG59KX0pO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbmZ1bmN0aW9uIGJfdGltZWxpbmUoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBmcmFtZSA9IGZyYW1lLnB1c2godHJ1ZSk7XG5vdXRwdXQgKz0gXCJcXG48ZGl2IGNsYXNzPVxcXCJsYi10aW1lbGluZSBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwibGFuZ3VhZ2VcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd1RpdGxlXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwidGl0bGVcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8aDE+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwidGl0bGVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9oMT5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dEZXNjcmlwdGlvblwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcImRlc2NyaXB0aW9uXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGRpdiBjbGFzcz1cXFwiZGVzY3JpcHRpb25cXFwiPlxcbiAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwiZGVzY3JpcHRpb25cIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICA8L2Rpdj5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dJbWFnZVwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcInBpY3R1cmVfdXJsXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcInBpY3R1cmVfdXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgLz5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwidG9wXCIgJiYgZW52LmdldEZpbHRlcihcImxlbmd0aFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwic3RpY2t5UG9zdHNcIikpLFwiX2l0ZW1zXCIpKSA+IDApIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJ0aW1lbGluZS10b3AgdGltZWxpbmUtdG9wLS1sb2FkZWRcXFwiPlxcbiAgICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJsYi1wb3N0cyBsaXN0LWdyb3VwXFxcIj5cXG4gICAgICAgIFwiO1xuZnJhbWUgPSBmcmFtZS5wdXNoKCk7XG52YXIgdF85ID0gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJzdGlja3lQb3N0c1wiKSksXCJfaXRlbXNcIik7XG5pZih0XzkpIHt2YXIgdF84ID0gdF85Lmxlbmd0aDtcbmZvcih2YXIgdF83PTA7IHRfNyA8IHRfOS5sZW5ndGg7IHRfNysrKSB7XG52YXIgdF8xMCA9IHRfOVt0XzddO1xuZnJhbWUuc2V0KFwiaXRlbVwiLCB0XzEwKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF83ICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzcpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzggLSB0XzcpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF84IC0gdF83IC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfNyA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF83ID09PSB0XzggLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfOCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHRfMTApLFwiZGVsZXRlZFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8xMyx0XzExKSB7XG5pZih0XzEzKSB7IGNiKHRfMTMpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xMSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzE0LHRfMTIpIHtcbmlmKHRfMTQpIHsgY2IodF8xNCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzEyKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIDwvc2VjdGlvbj5cXG4gICAgPC9kaXY+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgPCEtLSBIZWFkZXIgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJoZWFkZXItYmFyXFxcIj5cXG4gICAgPGRpdiBjbGFzcz1cXFwic29ydGluZy1iYXJcXFwiPlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcInNvcnRpbmctYmFyX19vcmRlcnNcXFwiPlxcbiAgICAgICAgPGRpdlxcbiAgICAgICAgICBjbGFzcz1cXFwic29ydGluZy1iYXJfX29yZGVyIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwicG9zdE9yZGVyXCIpID09IFwiZWRpdG9yaWFsXCIpIHtcbm91dHB1dCArPSBcInNvcnRpbmctYmFyX19vcmRlci0tYWN0aXZlXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiXFxuICAgICAgICAgIGRhdGEtanMtb3JkZXJieV9lZGl0b3JpYWw+XFxuICAgICAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwib3B0aW9uc1wiKSksXCJsMTBuXCIpKSxcImVkaXRvcmlhbFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICAgPGRpdlxcbiAgICAgICAgICBjbGFzcz1cXFwic29ydGluZy1iYXJfX29yZGVyIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwicG9zdE9yZGVyXCIpID09IFwibmV3ZXN0X2ZpcnN0XCIpIHtcbm91dHB1dCArPSBcInNvcnRpbmctYmFyX19vcmRlci0tYWN0aXZlXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiXFxuICAgICAgICAgIGRhdGEtanMtb3JkZXJieV9kZXNjZW5kaW5nPlxcbiAgICAgICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm9wdGlvbnNcIikpLFwibDEwblwiKSksXCJkZXNjZW5kaW5nXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICA8ZGl2XFxuICAgICAgICAgIGNsYXNzPVxcXCJzb3J0aW5nLWJhcl9fb3JkZXIgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJwb3N0T3JkZXJcIikgPT0gXCJvbGRlc3RfZmlyc3RcIikge1xub3V0cHV0ICs9IFwic29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmVcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCJcXG4gICAgICAgICAgZGF0YS1qcy1vcmRlcmJ5X2FzY2VuZGluZz5cXG4gICAgICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJvcHRpb25zXCIpKSxcImwxMG5cIikpLFwiYXNjZW5kaW5nXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgPC9kaXY+XFxuICAgIDwvZGl2PlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJoZWFkZXItYmFyX19hY3Rpb25zXFxcIj48L2Rpdj5cXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcImNhbkNvbW1lbnRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cXFwiaGVhZGVyLWJhcl9fY29tbWVudFxcXCIgZGF0YS1qcy1zaG93LWNvbW1lbnQtZGlhbG9nPkNvbW1lbnQ8L2J1dHRvbj5cXG4gICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0xpdmVibG9nTG9nb1wiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm91dHB1dFwiKSksXCJsb2dvX3VybFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8aW1nIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm91dHB1dFwiKSksXCJsb2dvX3VybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiLz5cXG4gICAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxhIGNsYXNzPVxcXCJoZWFkZXItYmFyX19sb2dvXFxcIiBocmVmPVxcXCJodHRwczovL3d3dy5saXZlYmxvZy5wcm9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5cXG4gICAgICAgICAgPHNwYW4+UG93ZXJlZCBieTwvc3Bhbj5cXG4gICAgICAgICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9sYi1sb2dvLnN2Z1xcXCIgLz5cXG4gICAgICAgIDwvYT5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgPC9kaXY+XFxuICA8IS0tIEhlYWRlciBFbmQgLS0+XFxuXFxuICA8IS0tIENvbW1lbnQgLS0+XFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcImNhbkNvbW1lbnRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1jb21tZW50Lmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzE3LHRfMTUpIHtcbmlmKHRfMTcpIHsgY2IodF8xNyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzE1KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMTgsdF8xNikge1xuaWYodF8xOCkgeyBjYih0XzE4KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTYpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwhLS0gQ29tbWVudCBFbmQgLS0+XFxuXFxuICA8IS0tIFRpbWVsaW5lIC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwidGltZWxpbmUtYm9keSB0aW1lbGluZS1ib2R5LS1sb2FkZWRcXFwiPlxcbiAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwiYm90dG9tXCIgJiYgZW52LmdldEZpbHRlcihcImxlbmd0aFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwic3RpY2t5UG9zdHNcIikpLFwiX2l0ZW1zXCIpKSA+IDApIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJsYi1wb3N0cyBsaXN0LWdyb3VwIHN0aWNreVxcXCI+XFxuICAgICAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMjEgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInN0aWNreVBvc3RzXCIpKSxcIl9pdGVtc1wiKTtcbmlmKHRfMjEpIHt2YXIgdF8yMCA9IHRfMjEubGVuZ3RoO1xuZm9yKHZhciB0XzE5PTA7IHRfMTkgPCB0XzIxLmxlbmd0aDsgdF8xOSsrKSB7XG52YXIgdF8yMiA9IHRfMjFbdF8xOV07XG5mcmFtZS5zZXQoXCJpdGVtXCIsIHRfMjIpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleFwiLCB0XzE5ICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzE5KTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF8yMCAtIHRfMTkpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF8yMCAtIHRfMTkgLSAxKTtcbmZyYW1lLnNldChcImxvb3AuZmlyc3RcIiwgdF8xOSA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF8xOSA9PT0gdF8yMCAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5sZW5ndGhcIiwgdF8yMCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHRfMjIpLFwiZGVsZXRlZFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8yNSx0XzIzKSB7XG5pZih0XzI1KSB7IGNiKHRfMjUpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8yMyk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzI2LHRfMjQpIHtcbmlmKHRfMjYpIHsgY2IodF8yNik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzI0KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIDwvc2VjdGlvbj5cXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG5pZihlbnYuZ2V0RmlsdGVyKFwibGVuZ3RoXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJwb3N0c1wiKSksXCJfaXRlbXNcIikpID09IDApIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcImxiLXBvc3QgZW1wdHktbWVzc2FnZVxcXCI+XFxuICAgICAgICA8ZGl2PkJsb2cgcG9zdHMgYXJlIG5vdCBjdXJyZW50bHkgYXZhaWxhYmxlLjwvZGl2PlxcbiAgICAgIDwvZGl2PlxcbiAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8c2VjdGlvbiBjbGFzcz1cXFwibGItcG9zdHMgbGlzdC1ncm91cCBub3JtYWxcXFwiPlxcbiAgICAgICAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzI5ID0gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJwb3N0c1wiKSksXCJfaXRlbXNcIik7XG5pZih0XzI5KSB7dmFyIHRfMjggPSB0XzI5Lmxlbmd0aDtcbmZvcih2YXIgdF8yNz0wOyB0XzI3IDwgdF8yOS5sZW5ndGg7IHRfMjcrKykge1xudmFyIHRfMzAgPSB0XzI5W3RfMjddO1xuZnJhbWUuc2V0KFwiaXRlbVwiLCB0XzMwKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF8yNyArIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleDBcIiwgdF8yNyk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4XCIsIHRfMjggLSB0XzI3KTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXgwXCIsIHRfMjggLSB0XzI3IC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfMjcgPT09IDApO1xuZnJhbWUuc2V0KFwibG9vcC5sYXN0XCIsIHRfMjcgPT09IHRfMjggLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfMjgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzMwKSxcImRlbGV0ZWRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMzMsdF8zMSkge1xuaWYodF8zMykgeyBjYih0XzMzKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMzEpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8zNCx0XzMyKSB7XG5pZih0XzM0KSB7IGNiKHRfMzQpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8zMik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbn0pO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbjtcbn1cbn1cbmZyYW1lID0gZnJhbWUucG9wKCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8L3NlY3Rpb24+XFxuICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJwb3N0c1wiKSksXCJfbWV0YVwiKSksXCJtYXhfcmVzdWx0c1wiKSA8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInBvc3RzXCIpKSxcIl9tZXRhXCIpKSxcInRvdGFsXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxidXR0b24gY2xhc3M9XFxcImxiLWJ1dHRvbiBsb2FkLW1vcmUtcG9zdHNcXFwiIGRhdGEtanMtbG9hZG1vcmU+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJvcHRpb25zXCIpKSxcImwxMG5cIikpLFwibG9hZE5ld1Bvc3RzXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvYnV0dG9uPlxcbiAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICA8L2Rpdj5cXG4gIDwhLS0gVGltZWxpbmUgRW5kIC0tPlxcblxcbjwvZGl2PlxcblwiO1xuY2IobnVsbCwgb3V0cHV0KTtcbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xuYl90aW1lbGluZTogYl90aW1lbGluZSxcbnJvb3Q6IHJvb3Rcbn07XG5cbn0pKCk7XG5yZXR1cm4gZnVuY3Rpb24oY3R4LCBjYikgeyByZXR1cm4gbnVuanVja3MucmVuZGVyKFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiJdfQ==
