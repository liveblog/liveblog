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

},{}],"/home/skam/Work/liveblog-default-theme/js/theme/index.js":[function(require,module,exports){
/**
 * @author ps / @___paul
 */

'use strict';

var handlers = require('./handlers'),
    viewmodel = require('./viewmodel'),
    view = require('./view'),
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

    setInterval(function () {
      view.updateTimestamps(); // Convert ISO dates to timeago
    }, 1000);
  }
};

},{"./handlers":"/home/skam/Work/liveblog-default-theme/js/theme/handlers.js","./local-analytics":"/home/skam/Work/liveblog-default-theme/js/theme/local-analytics.js","./view":"/home/skam/Work/liveblog-default-theme/js/theme/view.js","./viewmodel":"/home/skam/Work/liveblog-default-theme/js/theme/viewmodel.js"}],"/home/skam/Work/liveblog-default-theme/js/theme/local-analytics.js":[function(require,module,exports){
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

},{"./helpers":"/home/skam/Work/liveblog-default-theme/js/theme/helpers.js","./view":"/home/skam/Work/liveblog-default-theme/js/theme/view.js"}],"/home/skam/Work/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js":[function(require,module,exports){
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
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showGallery") && runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"groups")),1)),"refs")),0)),"item")),"item_type") == "image" && env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"groups")),1)),"refs")) > 1) {
output += "slideshow";
;
}
output += "\"\n  data-js-post-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"_id"), env.opts.autoescape);
output += "\">\n  ";
;
}
else {
output += "\n<article\n  class=\"lb-post list-group-item show-author-avatar ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "settings")),"showGallery") && runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"groups")),1)),"refs")),0)),"item")),"item_type") == "image" && env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"groups")),1)),"refs")) > 1) {
output += "slideshow";
;
}
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9saXZlYmxvZy5qcyIsImpzL3RoZW1lL2hhbmRsZXJzLmpzIiwianMvdGhlbWUvaGVscGVycy5qcyIsImpzL3RoZW1lL2luZGV4LmpzIiwianMvdGhlbWUvbG9jYWwtYW5hbHl0aWNzLmpzIiwianMvdGhlbWUvc2xpZGVzaG93LmpzIiwianMvdGhlbWUvdGVtcGxhdGVzLmpzIiwianMvdGhlbWUvdmlldy5qcyIsImpzL3RoZW1lL3ZpZXdtb2RlbC5qcyIsIm5vZGVfbW9kdWxlcy9udW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW0uanMiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sIiwidGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbCIsInRlbXBsYXRlcy90ZW1wbGF0ZS1wb3N0Lmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtc2xpZGVzaG93Lmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtdGltZWxpbmUuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7O0FBSUE7O0FBRUE7O0FBQ0EsSUFBSSxRQUFRLFFBQVEsU0FBUixDQUFaOztBQUVBLFNBQVMsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFlBQU07QUFDbEQsUUFBTSxJQUFOO0FBQ0QsQ0FGRDs7QUFJQSxPQUFPLE9BQVAsR0FBaUIsRUFBakI7OztBQ2JBOzs7O0FBSUE7O0FBRUEsSUFBSSxPQUFPLFFBQVEsUUFBUixDQUFYO0FBQUEsSUFDSSxZQUFZLFFBQVEsYUFBUixDQURoQjtBQUFBLElBRUksVUFBVSxRQUFRLFdBQVIsQ0FGZDs7QUFJQTs7Ozs7QUFLQSxJQUFNLGNBQWMsU0FBZCxXQUFjLENBQUMsQ0FBRCxFQUFPO0FBQ3pCLElBQUUsY0FBRjs7QUFFQSxNQUFJLE9BQU8sU0FBUyxhQUFULENBQXVCLGVBQXZCLEVBQXdDLEtBQW5EO0FBQ0EsTUFBSSxV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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFByZXJlbmRlciBmdW5jdGlvbnNcbnZhciB0aGVtZSA9IHJlcXVpcmUoJy4vdGhlbWUnKTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgdGhlbWUuaW5pdCgpO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge307XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKVxuICAsIHZpZXdtb2RlbCA9IHJlcXVpcmUoJy4vdmlld21vZGVsJylcbiAgLCBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XG5cbi8qKlxuICogQ29udGFpbnMgYSBtYXBwaW5nIG9mIGVsZW1lbnQgZGF0YS1zZWxlY3RvcnMgYW5kIGNsaWNrIGhhbmRsZXJzXG4gKiBidXR0b25zLmF0dGFjaCB7ZnVuY3Rpb259IC0gcmVnaXN0ZXJzIGhhbmRsZXJzIGZvdW5kIGluIGhhbmRsZXJzIG9iamVjdFxuICovXG5cbmNvbnN0IHNlbmRDb21tZW50ID0gKGUpID0+IHtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gIGxldCBuYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvbW1lbnQtbmFtZScpLnZhbHVlO1xuICBsZXQgY29tbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb21tZW50LWNvbnRlbnQnKS52YWx1ZTtcblxuICB2aWV3LmNsZWFyQ29tbWVudEZvcm1FcnJvcnMoKTtcblxuICByZXR1cm4gdmlld21vZGVsLnNlbmRDb21tZW50KG5hbWUsIGNvbW1lbnQpXG4gICAgLnRoZW4odmlldy50b2dnbGVDb21tZW50RGlhbG9nKVxuICAgIC50aGVuKCgpID0+IGRvY3VtZW50XG4gICAgICAgIC5xdWVyeVNlbGVjdG9yKCdmb3JtLmNvbW1lbnQnKVxuICAgICAgICAucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpXG4gICAgKVxuICAgIC50aGVuKHZpZXcuc2hvd1N1Y2Nlc3NDb21tZW50TXNnKVxuICAgIC5jYXRjaCh2aWV3LmRpc3BsYXlDb21tZW50Rm9ybUVycm9ycyk7XG59O1xuXG52YXIgYnV0dG9ucyA9IHtcbiAgaGFuZGxlcnM6IHtcbiAgICBcIltkYXRhLWpzLWxvYWRtb3JlXVwiOiAoKSA9PiB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzUGFnZSgpXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyUG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAuY2F0Y2goY2F0Y2hFcnJvcik7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtb3JkZXJieV9hc2NlbmRpbmddXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHMoe3NvcnQ6ICdhc2NlbmRpbmcnfSlcbiAgICAgICAgLnRoZW4odmlldy5yZW5kZXJUaW1lbGluZSlcbiAgICAgICAgLnRoZW4odmlldy5kaXNwbGF5TmV3UG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcudG9nZ2xlU29ydEJ0bignYXNjZW5kaW5nJykpXG4gICAgICAgIC5jYXRjaChjYXRjaEVycm9yKTtcbiAgICB9LFxuXG4gICAgXCJbZGF0YS1qcy1vcmRlcmJ5X2Rlc2NlbmRpbmddXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHMoe3NvcnQ6ICdkZXNjZW5kaW5nJ30pXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyVGltZWxpbmUpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAudGhlbih2aWV3LnRvZ2dsZVNvcnRCdG4oJ2Rlc2NlbmRpbmcnKSlcbiAgICAgICAgLmNhdGNoKGNhdGNoRXJyb3IpO1xuICAgIH0sXG5cbiAgICBcIltkYXRhLWpzLW9yZGVyYnlfZWRpdG9yaWFsXVwiOiAoKSA9PiB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzKHtzb3J0OiAnZWRpdG9yaWFsJ30pXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyVGltZWxpbmUpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAudGhlbih2aWV3LnRvZ2dsZVNvcnRCdG4oJ2VkaXRvcmlhbCcpKVxuICAgICAgICAuY2F0Y2goY2F0Y2hFcnJvcik7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtc2hvdy1jb21tZW50LWRpYWxvZ11cIjogKCkgPT4ge1xuICAgICAgbGV0IGlzVmlzaWJsZSA9IHZpZXcudG9nZ2xlQ29tbWVudERpYWxvZygpO1xuICAgICAgbGV0IGNvbW1lbnRGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9ybS5jb21tZW50Jyk7XG5cbiAgICAgIGlmIChpc1Zpc2libGUpIHtcbiAgICAgICAgY29tbWVudEZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29tbWVudEZvcm0ucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAnW2RhdGEtanMtY2xvc2UtY29tbWVudC1kaWFsb2ddJzogKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZpZXcudG9nZ2xlQ29tbWVudERpYWxvZygpO1xuICAgIH1cbiAgfSxcblxuICBhdHRhY2g6IGZ1bmN0aW9uKCkge1xuICAgIE9iamVjdC5rZXlzKGJ1dHRvbnMuaGFuZGxlcnMpLmZvckVhY2goKGhhbmRsZXIpID0+IHtcbiAgICAgIGxldCBlbCA9IGhlbHBlcnMuZ2V0RWxlbXMoaGFuZGxlcilbMF07XG5cbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGJ1dHRvbnMuaGFuZGxlcnNbaGFuZGxlcl0sIGZhbHNlKTtcbiAgICB9KTtcblxuICAgIHZpZXcuYXR0YWNoU2xpZGVzaG93KCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGNhdGNoRXJyb3IoZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoXCJIYW5kbGVyIGVycm9yOiBcIiwgZXJyKTtcbn1cblxudmFyIGV2ZW50cyA9IHtcbiAgYXR0YWNoOiBmdW5jdGlvbigpIHt9IC8vIHRvZG9cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBidXR0b25zOiBidXR0b25zLFxuICBldmVudHM6IGV2ZW50c1xufTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKiBDb252ZXJ0IElTTyB0aW1lc3RhbXBzIHRvIHJlbGF0aXZlIG1vbWVudCB0aW1lc3RhbXBzXG4gKiBAcGFyYW0ge05vZGV9IGVsZW0gLSBhIERPTSBlbGVtZW50IHdpdGggSVNPIHRpbWVzdGFtcCBpbiBkYXRhLWpzLXRpbWVzdGFtcCBhdHRyXG4gKi9cbmZ1bmN0aW9uIGNvbnZlcnRUaW1lc3RhbXAodGltZXN0YW1wKSB7XG4gIHZhciBsMTBuID0gTEIubDEwbi50aW1lQWdvXG4gICAgLCBub3cgPSBuZXcgRGF0ZSgpIC8vIE5vd1xuICAgICwgZGlmZiA9IG5vdyAtIG5ldyBEYXRlKHRpbWVzdGFtcClcbiAgICAsIHVuaXRzID0ge1xuICAgICAgZDogMTAwMCAqIDM2MDAgKiAyNCxcbiAgICAgIGg6IDEwMDAgKiAzNjAwLFxuICAgICAgbTogMTAwMCAqIDYwXG4gICAgfTtcblxuICBmdW5jdGlvbiBnZXRUaW1lQWdvU3RyaW5nKHRpbWVzdGFtcCwgdW5pdCkge1xuICAgIHJldHVybiAhKHRpbWVzdGFtcCA8PSB1bml0c1t1bml0XSAqIDIpXG4gICAgICA/IGwxMG5bdW5pdF0ucC5yZXBsYWNlKFwie31cIiwgTWF0aC5mbG9vcih0aW1lc3RhbXAgLyB1bml0c1t1bml0XSkpXG4gICAgICA6IGwxMG5bdW5pdF0ucztcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVBZ28odGltZXN0YW1wKSB7XG4gICAgaWYgKHRpbWVzdGFtcCA8IHVuaXRzLmgpIHtcbiAgICAgIHJldHVybiBnZXRUaW1lQWdvU3RyaW5nKHRpbWVzdGFtcCwgXCJtXCIpO1xuICAgIH1cblxuICAgIGlmICh0aW1lc3RhbXAgPCB1bml0cy5kKSB7XG4gICAgICByZXR1cm4gZ2V0VGltZUFnb1N0cmluZyh0aW1lc3RhbXAsIFwiaFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0VGltZUFnb1N0cmluZyh0aW1lc3RhbXAsIFwiZFwiKTsgLy8gZGVmYXVsdFxuICB9XG5cbiAgcmV0dXJuIHRpbWVBZ28oZGlmZik7XG59XG5cbi8qKlxuICogV3JhcCBlbGVtZW50IHNlbGVjdG9yIGFwaVxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IC0gYSBqUXVlcnkgc3ludGF4IERPTSBxdWVyeSAod2l0aCBkb3RzKVxuICovXG5mdW5jdGlvbiBnZXRFbGVtcyhxdWVyeSkge1xuICB2YXIgaXNEYXRhQXR0ciA9IHF1ZXJ5LmluZGV4T2YoXCJkYXRhLVwiKSA+IC0xO1xuICByZXR1cm4gaXNEYXRhQXR0clxuICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxdWVyeSlcbiAgICA6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUocXVlcnkpO1xufVxuXG4vKipcbiAqIGpRdWVyeSdzICQuZ2V0SlNPTiBpbiBhIG51dHNoZWxsXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gYSByZXF1ZXN0IFVSTFxuICovXG5mdW5jdGlvbiBnZXRKU09OKHVybCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlamVjdCh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgeGhyLnNlbmQoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3QodXJsLCBkYXRhKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ1BPU1QnLCB1cmwpO1xuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAxKSB7XG4gICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWplY3QoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgfSk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldEVsZW1zOiBnZXRFbGVtcyxcbiAgZ2V0SlNPTjogZ2V0SlNPTixcbiAgcG9zdDogcG9zdCxcbiAgY29udmVydFRpbWVzdGFtcDogY29udmVydFRpbWVzdGFtcFxufTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBoYW5kbGVycyA9IHJlcXVpcmUoJy4vaGFuZGxlcnMnKSxcbiAgdmlld21vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWwnKSxcbiAgdmlldyA9IHJlcXVpcmUoJy4vdmlldycpLFxuICBsb2NhbEFuYWx5dGljcyA9IHJlcXVpcmUoJy4vbG9jYWwtYW5hbHl0aWNzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvKipcbiAgICogT24gZG9jdW1lbnQgbG9hZGVkLCBkbyB0aGUgZm9sbG93aW5nOlxuICAgKi9cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgaGFuZGxlcnMuYnV0dG9ucy5hdHRhY2goKTsgLy8gUmVnaXN0ZXIgQnV0dG9ucyBIYW5kbGVyc1xuICAgIGhhbmRsZXJzLmV2ZW50cy5hdHRhY2goKTsgLy8gUmVnaXN0ZXIgRXZlbnQsIE1lc3NhZ2UgSGFuZGxlcnNcbiAgICB2aWV3bW9kZWwuaW5pdCgpO1xuICAgIGxvY2FsQW5hbHl0aWNzLmhpdCgpO1xuXG4gICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdmlldy51cGRhdGVUaW1lc3RhbXBzKCk7IC8vIENvbnZlcnQgSVNPIGRhdGVzIHRvIHRpbWVhZ29cbiAgICB9LCAxMDAwKTtcbiAgfVxufTtcbiIsInZhciBhcGlIb3N0ID0gd2luZG93Lmhhc093blByb3BlcnR5KCdMQicpID8gd2luZG93LkxCLmFwaV9ob3N0LnJlcGxhY2UoL1xcLyQvLCAnJykgOiAnJztcbnZhciBjb250ZXh0VXJsID0gZG9jdW1lbnQucmVmZXJyZXI7XG52YXIgYmxvZ0lkID0gd2luZG93Lmhhc093blByb3BlcnR5KCdMQicpID8gd2luZG93LkxCLmJsb2cuX2lkIDogJyc7XG5cbmFwaUhvc3QgKz0gJy9hcGkvYW5hbHl0aWNzL2hpdCc7XG5cbnZhciBjcmVhdGVDb29raWUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgZGF5cykge1xuICB2YXIgZXhwaXJlcyA9ICcnLCBkYXRlID0gbmV3IERhdGUoKTtcblxuICBpZiAoZGF5cykge1xuICAgIGRhdGUuc2V0VGltZShkYXRlLmdldFRpbWUoKSArIGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKTtcbiAgICBleHBpcmVzID0gYDsgZXhwaXJlcz0ke2RhdGUudG9VVENTdHJpbmcoKX1gO1xuICB9XG4gIGRvY3VtZW50LmNvb2tpZSA9IGAke25hbWV9PSR7dmFsdWV9JHtleHBpcmVzfTsgcGF0aD0vYDtcbn07XG5cbnZhciByZWFkQ29va2llID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgbmFtZUVRID0gbmFtZSArICc9JztcbiAgdmFyIGNhID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7Jyk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjID0gY2FbaV07XG5cbiAgICB3aGlsZSAoYy5jaGFyQXQoMCkgPT09ICcgJykge1xuICAgICAgYyA9IGMuc3Vic3RyaW5nKDEsIGMubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoYy5pbmRleE9mKG5hbWVFUSkgPT09IDApIHtcbiAgICAgIHJldHVybiBjLnN1YnN0cmluZyhuYW1lRVEubGVuZ3RoLCBjLmxlbmd0aCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxudmFyIGhpdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgeG1saHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICB2YXIganNvbkRhdGEgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgY29udGV4dF91cmw6IGNvbnRleHRVcmwsXG4gICAgYmxvZ19pZDogYmxvZ0lkXG4gIH0pO1xuXG4gIHhtbGh0dHAub3BlbignUE9TVCcsIGFwaUhvc3QpO1xuICB4bWxodHRwLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cbiAgeG1saHR0cC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoeG1saHR0cC5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgY3JlYXRlQ29va2llKCdoaXQnLCBqc29uRGF0YSwgMik7XG4gICAgfVxuICB9O1xuXG4gIHhtbGh0dHAuc2VuZChqc29uRGF0YSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtoaXQ6ICgpID0+IHtcbiAgaWYgKCFyZWFkQ29va2llKCdoaXQnKSkge1xuICAgIGhpdCgpO1xuICB9XG59fTtcbiIsImNvbnN0IHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJyk7XG5cbmNsYXNzIFNsaWRlc2hvdyB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc3RhcnQgPSB0aGlzLnN0YXJ0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5zdG9wID0gdGhpcy5zdG9wLmJpbmQodGhpcyk7XG4gICAgdGhpcy5rZXlib2FyZExpc3RlbmVyID0gdGhpcy5rZXlib2FyZExpc3RlbmVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zZXRGb2N1cyA9IHRoaXMuc2V0Rm9jdXMuYmluZCh0aGlzKTtcbiAgICB0aGlzLmxhdW5jaEludG9GdWxsc2NyZWVuID0gdGhpcy5sYXVuY2hJbnRvRnVsbHNjcmVlbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25SZXNpemUgPSB0aGlzLm9uUmVzaXplLmJpbmQodGhpcyk7XG4gICAgdGhpcy5leGl0RnVsbHNjcmVlbiA9IHRoaXMuZXhpdEZ1bGxzY3JlZW4uYmluZCh0aGlzKTtcbiAgICB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4gPSB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4uYmluZCh0aGlzKTtcbiAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXJzID0gdGhpcy5hZGRFdmVudExpc3RlbmVycy5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMgPSB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXJzLmJpbmQodGhpcyk7XG4gICAgdGhpcy50b3VjaFN0YXJ0ID0gdGhpcy50b3VjaFN0YXJ0LmJpbmQodGhpcyk7XG4gICAgdGhpcy50b3VjaE1vdmUgPSB0aGlzLnRvdWNoTW92ZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgc3RhcnQoZSkge1xuICAgIGxldCBpdGVtcyA9IFtdO1xuXG4gICAgdGhpcy5pdGVyYXRpb25zID0gMDtcbiAgICB0aGlzLmlzRnVsbHNjcmVlbiA9IGZhbHNlO1xuICAgIHRoaXMueERvd24gPSBudWxsO1xuICAgIHRoaXMueURvd24gPSBudWxsO1xuXG4gICAgZS50YXJnZXRcbiAgICAgIC5jbG9zZXN0KCdhcnRpY2xlLnNsaWRlc2hvdycpXG4gICAgICAucXVlcnlTZWxlY3RvckFsbCgnLmxiLWl0ZW0gaW1nJylcbiAgICAgIC5mb3JFYWNoKChpbWcpID0+IHtcbiAgICAgICAgbGV0IG1hdGNoZXMgPSBbXTtcblxuICAgICAgICBpbWcuZ2V0QXR0cmlidXRlKCdzcmNzZXQnKS5yZXBsYWNlKC8oXFxTKylcXHNcXGQrdy9nLCAocywgbWF0Y2gpID0+IHtcbiAgICAgICAgICBtYXRjaGVzLnB1c2gobWF0Y2gpO1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgW2Jhc2VJbWFnZSwgdGh1bWJuYWlsLCB2aWV3SW1hZ2VdID0gbWF0Y2hlcztcblxuICAgICAgICBpdGVtcy5wdXNoKHtcbiAgICAgICAgICBpdGVtOiB7XG4gICAgICAgICAgICBtZXRhOiB7XG4gICAgICAgICAgICAgIG1lZGlhOiB7cmVuZGl0aW9uczoge1xuICAgICAgICAgICAgICAgIGJhc2VJbWFnZToge2hyZWY6IGJhc2VJbWFnZX0sXG4gICAgICAgICAgICAgICAgdGh1bWJuYWlsOiB7aHJlZjogdGh1bWJuYWlsfSxcbiAgICAgICAgICAgICAgICB2aWV3SW1hZ2U6IHtocmVmOiB2aWV3SW1hZ2V9XG4gICAgICAgICAgICAgIH19LFxuICAgICAgICAgICAgICBjYXB0aW9uOiBpbWcucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yKCdzcGFuLmNhcHRpb24nKS50ZXh0Q29udGVudCxcbiAgICAgICAgICAgICAgY3JlZGl0OiBpbWcucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yKCdzcGFuLmNyZWRpdCcpLnRleHRDb250ZW50LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFjdGl2ZTogdGh1bWJuYWlsID09PSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ3NyYycpXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbGV0IHNsaWRlc2hvdyA9IHRlbXBsYXRlcy5zbGlkZXNob3coe1xuICAgICAgcmVmczogaXRlbXNcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Rpdi5sYi10aW1lbGluZScpXG4gICAgICAuaW5zZXJ0QWRqYWNlbnRIVE1MKCdhZnRlcmVuZCcsIHNsaWRlc2hvdyk7XG5cbiAgICBpZiAod2luZG93LnNlbGYgIT09IHdpbmRvdy50b3ApIHtcbiAgICAgIHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2UoJ2Z1bGxzY3JlZW4nLCB3aW5kb3cuZG9jdW1lbnQucmVmZXJyZXIpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0Rm9jdXMoKTtcbiAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXJzKCk7XG4gIH1cblxuICBzdG9wKCkge1xuICAgIHRoaXMuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXJzKCk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdycpLnJlbW92ZSgpO1xuICB9XG5cbiAgb25SZXNpemUoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyAuY29udGFpbmVyJyk7XG4gICAgbGV0IG9mZnNldCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgKiB0aGlzLml0ZXJhdGlvbnM7XG5cbiAgICBjb250YWluZXIuc3R5bGUubWFyZ2luVG9wID0gYC0ke29mZnNldH1weGA7XG4gIH1cblxuICBhZGRFdmVudExpc3RlbmVycygpIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMua2V5Ym9hcmRMaXN0ZW5lcik7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmZ1bGxzY3JlZW4nKVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy50b2dnbGVGdWxsc2NyZWVuKTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyBidXR0b24uYXJyb3dzLm5leHQnKVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5rZXlib2FyZExpc3RlbmVyKHtrZXlDb2RlOiAzOX0pKTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyBidXR0b24uYXJyb3dzLnByZXYnKVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5rZXlib2FyZExpc3RlbmVyKHtrZXlDb2RlOiAzN30pKTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyBidXR0b24uY2xvc2UnKVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5zdG9wKTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdycpXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMudG91Y2hTdGFydCk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cnKVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMudG91Y2hNb3ZlKTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLm9uUmVzaXplKTtcbiAgfVxuXG4gIHJlbW92ZUV2ZW50TGlzdGVuZXJzKCkge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlib2FyZExpc3RlbmVyKTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyBidXR0b24uZnVsbHNjcmVlbicpXG4gICAgICAucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4pO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5hcnJvd3MubmV4dCcpXG4gICAgICAucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmtleWJvYXJkTGlzdGVuZXIoe2tleUNvZGU6IDM5fSkpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5hcnJvd3MucHJldicpXG4gICAgICAucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmtleWJvYXJkTGlzdGVuZXIoe2tleUNvZGU6IDM3fSkpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5jbG9zZScpXG4gICAgICAucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnN0b3ApO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JylcbiAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy50b3VjaFN0YXJ0KTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdycpXG4gICAgICAucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy50b3VjaE1vdmUpO1xuXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25SZXNpemUpO1xuICB9XG5cbiAgdG91Y2hTdGFydChlKSB7XG4gICAgdGhpcy54RG93biA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuICAgIHRoaXMueURvd24gPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgfVxuXG4gIHRvdWNoTW92ZShlKSB7XG4gICAgaWYgKCF0aGlzLnhEb3duIHx8ICF0aGlzLnlEb3duKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHhVcCA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuICAgIHZhciB5VXAgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcblxuICAgIHZhciB4RGlmZiA9IHRoaXMueERvd24gLSB4VXA7XG4gICAgdmFyIHlEaWZmID0gdGhpcy55RG93biAtIHlVcDtcblxuICAgIGlmIChNYXRoLmFicyh4RGlmZikgPiBNYXRoLmFicyh5RGlmZikgJiYgeERpZmYgPiAwKSB7XG4gICAgICAvLyBMZWZ0IHN3aXBlXG4gICAgICB0aGlzLmtleWJvYXJkTGlzdGVuZXIoe2tleUNvZGU6IDM5fSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJpZ2h0IHN3aXBlXG4gICAgICB0aGlzLmtleWJvYXJkTGlzdGVuZXIoe2tleUNvZGU6IDM3fSk7XG4gICAgfVxuXG4gICAgdGhpcy54RG93biA9IG51bGw7XG4gICAgdGhpcy55RG93biA9IG51bGw7XG4gIH1cblxuICB0b2dnbGVGdWxsc2NyZWVuKCkge1xuICAgIGlmICghdGhpcy5pc0Z1bGxzY3JlZW4pIHtcbiAgICAgIHRoaXMubGF1bmNoSW50b0Z1bGxzY3JlZW4oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NsaWRlc2hvdycpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5leGl0RnVsbHNjcmVlbigpO1xuICAgIH1cbiAgfVxuXG4gIGxhdW5jaEludG9GdWxsc2NyZWVuKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbikge1xuICAgICAgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbigpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgICAgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5tc1JlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzRnVsbHNjcmVlbiA9IHRydWU7XG4gIH1cblxuICBleGl0RnVsbHNjcmVlbigpIHtcbiAgICBpZiAoZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4pIHtcbiAgICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKSB7XG4gICAgICBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbikge1xuICAgICAgZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzRnVsbHNjcmVlbiA9IGZhbHNlO1xuICB9XG5cbiAgc2V0Rm9jdXMoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyAuY29udGFpbmVyJyk7XG5cbiAgICBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnaW1nJykuZm9yRWFjaCgoaW1nLCBpKSA9PiB7XG4gICAgICBpZiAoaW1nLmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykpIHtcbiAgICAgICAgdGhpcy5pdGVyYXRpb25zID0gaTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICh0aGlzLml0ZXJhdGlvbnMgPiAwKSB7XG4gICAgICBjb250YWluZXIuc3R5bGUubWFyZ2luVG9wID0gYC0ke2NvbnRhaW5lci5vZmZzZXRIZWlnaHQgKiB0aGlzLml0ZXJhdGlvbnN9cHhgO1xuICAgIH1cbiAgfVxuXG4gIGtleWJvYXJkTGlzdGVuZXIoZSkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgLmNvbnRhaW5lcicpO1xuICAgIGNvbnN0IHBpY3R1cmVzQ291bnQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnaW1nJykubGVuZ3RoO1xuICAgIGxldCBvZmZzZXQgPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0ICogdGhpcy5pdGVyYXRpb25zO1xuXG4gICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgaWYgKG9mZnNldCArIGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgPCBwaWN0dXJlc0NvdW50ICogY29udGFpbmVyLm9mZnNldEhlaWdodCkge1xuICAgICAgICBjb250YWluZXIuc3R5bGUubWFyZ2luVG9wID0gYC0ke29mZnNldCArIGNvbnRhaW5lci5vZmZzZXRIZWlnaHR9cHhgO1xuICAgICAgICB0aGlzLml0ZXJhdGlvbnMrKztcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgaWYgKG9mZnNldCAtIGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgPj0gMCkge1xuICAgICAgICBjb250YWluZXIuc3R5bGUubWFyZ2luVG9wID0gYC0ke29mZnNldCAtIGNvbnRhaW5lci5vZmZzZXRIZWlnaHR9cHhgO1xuICAgICAgICB0aGlzLml0ZXJhdGlvbnMtLTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAyNzogLy8gZXNjXG4gICAgICB0aGlzLmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgICB0aGlzLnN0b3AoKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTbGlkZXNob3c7XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuY29uc3QgbnVuanVja3MgPSByZXF1aXJlKFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIpO1xuY29uc3Qgc2V0dGluZ3MgPSB3aW5kb3cuTEIuc2V0dGluZ3M7XG5cbmNvbnN0IGRlZmF1bHRUZW1wbGF0ZXMgPSB7XG4gIHBvc3Q6IHJlcXVpcmUoXCIuLi8uLi90ZW1wbGF0ZXMvdGVtcGxhdGUtcG9zdC5odG1sXCIpLFxuICB0aW1lbGluZTogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIpLFxuICBpdGVtSW1hZ2U6IHJlcXVpcmUoXCIuLi8uLi90ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIpLFxuICBpdGVtRW1iZWQ6IHJlcXVpcmUoXCIuLi8uLi90ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sXCIpLFxuICBzbGlkZXNob3c6IHJlcXVpcmUoXCIuLi8uLi90ZW1wbGF0ZXMvdGVtcGxhdGUtc2xpZGVzaG93Lmh0bWxcIilcbn07XG5cbmZ1bmN0aW9uIGdldEN1c3RvbVRlbXBsYXRlcygpIHtcbiAgbGV0IGN1c3RvbVRlbXBsYXRlcyA9IHNldHRpbmdzLmN1c3RvbVRlbXBsYXRlc1xuICAgICwgbWVyZ2VkVGVtcGxhdGVzID0gZGVmYXVsdFRlbXBsYXRlcztcblxuICBmb3IgKGxldCB0ZW1wbGF0ZSBpbiBjdXN0b21UZW1wbGF0ZXMpIHtcbiAgICBsZXQgY3VzdG9tVGVtcGxhdGVOYW1lID0gY3VzdG9tVGVtcGxhdGVzW3RlbXBsYXRlXTtcbiAgICBkZWZhdWx0VGVtcGxhdGVzW3RlbXBsYXRlXSA9IChjdHgsIGNiKSA9PiB7XG4gICAgICBudW5qdWNrcy5yZW5kZXIoY3VzdG9tVGVtcGxhdGVOYW1lLCBjdHgsIGNiKTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIG1lcmdlZFRlbXBsYXRlcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXR0aW5ncy5jdXN0b21UZW1wbGF0ZXNcbiAgPyBnZXRDdXN0b21UZW1wbGF0ZXMoKVxuICA6IGRlZmF1bHRUZW1wbGF0ZXM7XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcbnZhciB0ZW1wbGF0ZXMgPSByZXF1aXJlKCcuL3RlbXBsYXRlcycpO1xudmFyIFNsaWRlc2hvdyA9IHJlcXVpcmUoJy4vc2xpZGVzaG93Jyk7XG5cbnZhciB0aW1lbGluZUVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmxiLXBvc3RzLm5vcm1hbFwiKVxuICAsIGxvYWRNb3JlUG9zdHNCdXR0b24gPSBoZWxwZXJzLmdldEVsZW1zKFwibG9hZC1tb3JlLXBvc3RzXCIpO1xuXG4vKipcbiAqIFJlcGxhY2UgdGhlIGN1cnJlbnQgdGltZWxpbmUgdW5jb25kaXRpb25hbGx5LlxuICogQHR5cGVkZWYge09iamVjdH0gYXBpX3Jlc3BvbnNlIOKAkyBjb250YWlucyByZXF1ZXN0IG9wdHMuXG4gKiBAcHJvcGVydHkge09iamVjdH0gcmVxdWVzdE9wdHMgLSBBUEkgcmVxdWVzdCBwYXJhbXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlclRpbWVsaW5lKGFwaV9yZXNwb25zZSkge1xuICB2YXIgcmVuZGVyZWRQb3N0cyA9IFtdO1xuXG4gIGFwaV9yZXNwb25zZS5faXRlbXMuZm9yRWFjaCgocG9zdCkgPT4ge1xuICAgIHJlbmRlcmVkUG9zdHMucHVzaCh0ZW1wbGF0ZXMucG9zdCh7XG4gICAgICBpdGVtOiBwb3N0LFxuICAgICAgc2V0dGluZ3M6IHdpbmRvdy5MQi5zZXR0aW5nc1xuICAgIH0pKTtcbiAgfSk7XG5cbiAgdGltZWxpbmVFbGVtWzBdLmlubmVySFRNTCA9IHJlbmRlcmVkUG9zdHMuam9pbihcIlwiKTtcbiAgbG9hZEVtYmVkcygpO1xuICBhdHRhY2hTbGlkZXNob3coKTtcbn1cblxuLyoqXG4gKiBSZW5kZXIgcG9zdHMgY3VycmVudGx5IGluIHBpcGVsaW5lIHRvIHRlbXBsYXRlLlxuICogVG8gcmVkdWNlIERPTSBjYWxscy9wYWludHMgd2UgaGFuZCBvZmYgcmVuZGVyZWQgSFRNTCBpbiBidWxrLlxuICogQHR5cGVkZWYge09iamVjdH0gYXBpX3Jlc3BvbnNlIOKAkyBjb250YWlucyByZXF1ZXN0IG9wdHMuXG4gKiBAcHJvcGVydHkge09iamVjdH0gcmVxdWVzdE9wdHMgLSBBUEkgcmVxdWVzdCBwYXJhbXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlclBvc3RzKGFwaV9yZXNwb25zZSkge1xuICB2YXIgcmVuZGVyZWRQb3N0cyA9IFtdIC8vIHRlbXBvcmFyeSBzdG9yZVxuICAgICwgcG9zdHMgPSBhcGlfcmVzcG9uc2UuX2l0ZW1zO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcG9zdHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcG9zdCA9IHBvc3RzW2ldO1xuXG4gICAgaWYgKHBvc3RzLm9wZXJhdGlvbiA9PT0gXCJkZWxldGVcIikge1xuICAgICAgZGVsZXRlUG9zdChwb3N0Ll9pZCk7XG4gICAgICByZXR1cm47IC8vIGVhcmx5XG4gICAgfVxuXG4gICAgdmFyIHJlbmRlcmVkUG9zdCA9IHRlbXBsYXRlcy5wb3N0KHtcbiAgICAgIGl0ZW06IHBvc3QsXG4gICAgICBzZXR0aW5nczogd2luZG93LkxCLnNldHRpbmdzXG4gICAgfSk7XG5cbiAgICBpZiAocG9zdHMub3BlcmF0aW9uID09PSBcInVwZGF0ZVwiKSB7XG4gICAgICB1cGRhdGVQb3N0KHJlbmRlcmVkUG9zdCk7XG4gICAgICByZXR1cm47IC8vIGVhcmx5XG4gICAgfVxuXG4gICAgcmVuZGVyZWRQb3N0cy5wdXNoKHJlbmRlcmVkUG9zdCk7IC8vIGNyZWF0ZSBvcGVyYXRpb25cbiAgfVxuXG4gIGlmICghcmVuZGVyZWRQb3N0cy5sZW5ndGgpIHtcbiAgICByZXR1cm47IC8vIGVhcmx5XG4gIH1cbiAgXG4gIHJlbmRlcmVkUG9zdHMucmV2ZXJzZSgpO1xuXG4gIGFkZFBvc3RzKHJlbmRlcmVkUG9zdHMsIHsgLy8gaWYgY3JlYXRlc1xuICAgIHBvc2l0aW9uOiBhcGlfcmVzcG9uc2UucmVxdWVzdE9wdHMuZnJvbURhdGUgPyBcInRvcFwiIDogXCJib3R0b21cIlxuICB9KTtcblxuICBsb2FkRW1iZWRzKCk7XG59XG5cbi8qKlxuICogQWRkIHBvc3Qgbm9kZXMgdG8gRE9NLCBkbyBzbyByZWdhcmRsZXNzIG9mIHNldHRpbmdzLmF1dG9BcHBseVVwZGF0ZXMsXG4gKiBidXQgcmF0aGVyIHNldCB0aGVtIHRvIE5PVCBCRSBESVNQTEFZRUQgaWYgYXV0by1hcHBseSBpcyBmYWxzZS5cbiAqIFRoaXMgd2F5IHdlIGRvbid0IGhhdmUgdG8gbWVzcyB3aXRoIHR3byBzdGFja3Mgb2YgcG9zdHMuXG4gKiBAcGFyYW0ge2FycmF5fSBwb3N0cyAtIGFuIGFycmF5IG9mIExpdmVibG9nIHBvc3QgaXRlbXNcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0ga2V5d29yZCBhcmdzXG4gKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5wb3NpdGlvbiAtIHRvcCBvciBib3R0b21cbiAqL1xuZnVuY3Rpb24gYWRkUG9zdHMocG9zdHMsIG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIG9wdHMucG9zaXRpb24gPSBvcHRzLnBvc2l0aW9uIHx8IFwiYm90dG9tXCI7XG5cbiAgdmFyIHBvc3RzSFRNTCA9IFwiXCJcbiAgICAsIHBvc2l0aW9uID0gb3B0cy5wb3NpdGlvbiA9PT0gXCJ0b3BcIlxuICAgICAgICA/IFwiYWZ0ZXJiZWdpblwiIC8vIGluc2VydEFkamFjZW50SFRNTCBBUEkgPT4gYWZ0ZXIgc3RhcnQgb2Ygbm9kZVxuICAgICAgICA6IFwiYmVmb3JlZW5kXCI7IC8vIGluc2VydEFkamFjZW50SFRNTCBBUEkgPT4gYmVmb3JlIGVuZCBvZiBub2RlXG5cbiAgZm9yICh2YXIgaSA9IHBvc3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgcG9zdHNIVE1MICs9IHBvc3RzW2ldO1xuICB9XG5cbiAgdGltZWxpbmVFbGVtWzBdLmluc2VydEFkamFjZW50SFRNTChwb3NpdGlvbiwgcG9zdHNIVE1MKTtcbiAgYXR0YWNoU2xpZGVzaG93KCk7XG59XG5cbi8qKlxuICogRGVsZXRlIHBvc3QgPGFydGljbGU+IERPTSBub2RlIGJ5IGRhdGEgYXR0cmlidXRlLlxuICogQHBhcmFtIHtzdHJpbmd9IC0gYSBwb3N0IFVSTlxuICovXG5mdW5jdGlvbiBkZWxldGVQb3N0KHBvc3RJZCkge1xuICB2YXIgZWxlbSA9IGhlbHBlcnMuZ2V0RWxlbXMoJ2RhdGEtanMtcG9zdC1pZD1cXFwiJyArIHBvc3RJZCArICdcXFwiJyk7XG4gIGVsZW1bMF0ucmVtb3ZlKCk7XG59XG5cbi8qKlxuICogRGVsZXRlIHBvc3QgPGFydGljbGU+IERPTSBub2RlIGJ5IGRhdGEgYXR0cmlidXRlLlxuICogQHBhcmFtIHtzdHJpbmd9IC0gYSBwb3N0IFVSTlxuICovXG5mdW5jdGlvbiB1cGRhdGVQb3N0KHBvc3RJZCwgcmVuZGVyZWRQb3N0KSB7XG4gIHZhciBlbGVtID0gaGVscGVycy5nZXRFbGVtcygnZGF0YS1qcy1wb3N0LWlkPVxcXCInICsgcG9zdElkICsgJ1xcXCInKTtcbiAgZWxlbVswXS5pbm5lckhUTUwgPSByZW5kZXJlZFBvc3Q7XG59XG5cbi8qKlxuICogU2hvdyBuZXcgcG9zdHMgbG9hZGVkIHZpYSBYSFJcbiAqL1xuZnVuY3Rpb24gZGlzcGxheU5ld1Bvc3RzKCkge1xuICB2YXIgbmV3UG9zdHMgPSBoZWxwZXJzLmdldEVsZW1zKFwibGItcG9zdC1uZXdcIik7XG4gIGZvciAodmFyIGkgPSBuZXdQb3N0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIG5ld1Bvc3RzW2ldLmNsYXNzTGlzdC5yZW1vdmUoXCJsYi1wb3N0LW5ld1wiKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyaWdnZXIgZW1iZWQgcHJvdmlkZXIgdW5wYWNraW5nXG4gKiBUb2RvOiBNYWtlIHJlcXVpcmVkIHNjcmlwdHMgYXZhaWxhYmxlIG9uIHN1YnNlcXVlbnQgbG9hZHNcbiAqL1xuZnVuY3Rpb24gbG9hZEVtYmVkcygpIHtcbiAgaWYgKHdpbmRvdy5pbnN0Z3JtKSB7XG4gICAgaW5zdGdybS5FbWJlZHMucHJvY2VzcygpO1xuICB9XG5cbiAgaWYgKHdpbmRvdy50d3R0cikge1xuICAgIHR3dHRyLndpZGdldHMubG9hZCgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZUNvbW1lbnREaWFsb2coKSB7XG4gIGxldCBjb21tZW50Rm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0uY29tbWVudCcpO1xuICBsZXQgaXNIaWRkZW4gPSBmYWxzZTtcblxuICBpZiAoY29tbWVudEZvcm0pIHtcbiAgICBpc0hpZGRlbiA9IGNvbW1lbnRGb3JtLmNsYXNzTGlzdC50b2dnbGUoJ2hpZGUnKTtcbiAgfVxuXG4gIHJldHVybiAhaXNIaWRkZW47XG59XG5cbi8qKlxuICogU2V0IHNvcnRpbmcgb3JkZXIgYnV0dG9uIG9mIGNsYXNzIEBuYW1lIHRvIGFjdGl2ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKi9cbmZ1bmN0aW9uIHRvZ2dsZVNvcnRCdG4obmFtZSkge1xuICB2YXIgc29ydGluZ0J0bnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuc29ydGluZy1iYXJfX29yZGVyJyk7XG5cbiAgc29ydGluZ0J0bnMuZm9yRWFjaCgoZWwpID0+IHtcbiAgICB2YXIgc2hvdWxkQmVBY3RpdmUgPSBlbC5kYXRhc2V0Lmhhc093blByb3BlcnR5KFwianNPcmRlcmJ5X1wiICsgbmFtZSk7XG5cbiAgICBlbC5jbGFzc0xpc3QudG9nZ2xlKCdzb3J0aW5nLWJhcl9fb3JkZXItLWFjdGl2ZScsIHNob3VsZEJlQWN0aXZlKTtcbiAgfSk7XG59XG5cbi8qKlxuICogQ29uZGl0aW9uYWxseSBoaWRlIGxvYWQtbW9yZS1wb3N0cyBidXR0b24uXG4gKiBAcGFyYW0ge2Jvb2x9IHNob3VsZFRvZ2dsZSAtIHRydWUgPT4gaGlkZVxuICovXG5mdW5jdGlvbiBoaWRlTG9hZE1vcmUoc2hvdWxkSGlkZSkge1xuICBpZiAobG9hZE1vcmVQb3N0c0J1dHRvbi5sZW5ndGggPiAwKSB7XG4gICAgbG9hZE1vcmVQb3N0c0J1dHRvblswXS5jbGFzc0xpc3QudG9nZ2xlKFxuICAgICAgXCJtb2QtLWhpZGVcIiwgc2hvdWxkSGlkZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWxldGUgcG9zdCA8YXJ0aWNsZT4gRE9NIG5vZGUgYnkgZGF0YSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gLSBhIHBvc3QgVVJOXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVRpbWVzdGFtcHMoKSB7XG4gIHZhciBkYXRlRWxlbXMgPSBoZWxwZXJzLmdldEVsZW1zKFwibGItcG9zdC1kYXRlXCIpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGVFbGVtcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBlbGVtID0gZGF0ZUVsZW1zW2ldXG4gICAgICAsIHRpbWVzdGFtcCA9IGVsZW0uZGF0YXNldC5qc1RpbWVzdGFtcDtcbiAgICBlbGVtLnRleHRDb250ZW50ID0gaGVscGVycy5jb252ZXJ0VGltZXN0YW1wKHRpbWVzdGFtcCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHNob3dTdWNjZXNzQ29tbWVudE1zZygpIHtcbiAgbGV0IGNvbW1lbnRTZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2LmNvbW1lbnQtc2VudCcpO1xuXG4gIGNvbW1lbnRTZW50LmNsYXNzTGlzdC50b2dnbGUoJ2hpZGUnKTtcblxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBjb21tZW50U2VudC5jbGFzc0xpc3QudG9nZ2xlKCdoaWRlJyk7XG4gIH0sIDUwMDApO1xufVxuXG5mdW5jdGlvbiBjbGVhckNvbW1lbnRGb3JtRXJyb3JzKCkge1xuICBsZXQgZXJyb3JzTXNncyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3AuZXJyLW1zZycpO1xuXG4gIGlmIChlcnJvcnNNc2dzKSB7XG4gICAgZXJyb3JzTXNncy5mb3JFYWNoKChlcnJvcnNNc2cpID0+IGVycm9yc01zZy5yZW1vdmUoKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGlzcGxheUNvbW1lbnRGb3JtRXJyb3JzKGVycm9ycykge1xuICBpZiAoQXJyYXkuaXNBcnJheShlcnJvcnMpKSB7XG4gICAgZXJyb3JzLmZvckVhY2goKGVycm9yKSA9PiB7XG4gICAgICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZXJyb3IuaWQpO1xuXG4gICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICBlbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcbiAgICAgICAgICAnYWZ0ZXJlbmQnLFxuICAgICAgICAgIGA8cCBjbGFzcz1cImVyci1tc2dcIj4ke2Vycm9yLm1zZ308L3A+YFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGF0dGFjaFNsaWRlc2hvdygpIHtcbiAgY29uc3Qgc2xpZGVzaG93ID0gbmV3IFNsaWRlc2hvdygpO1xuICBjb25zdCBzbGlkZXNob3dJbWFnZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhcnRpY2xlLnNsaWRlc2hvdyBpbWcnKTtcblxuICBpZiAoc2xpZGVzaG93SW1hZ2VzKSB7XG4gICAgc2xpZGVzaG93SW1hZ2VzLmZvckVhY2goKGltYWdlKSA9PiB7XG4gICAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNsaWRlc2hvdy5zdGFydCk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZFBvc3RzOiBhZGRQb3N0cyxcbiAgZGVsZXRlUG9zdDogZGVsZXRlUG9zdCxcbiAgZGlzcGxheU5ld1Bvc3RzOiBkaXNwbGF5TmV3UG9zdHMsXG4gIHJlbmRlclRpbWVsaW5lOiByZW5kZXJUaW1lbGluZSxcbiAgcmVuZGVyUG9zdHM6IHJlbmRlclBvc3RzLFxuICB1cGRhdGVQb3N0OiB1cGRhdGVQb3N0LFxuICB1cGRhdGVUaW1lc3RhbXBzOiB1cGRhdGVUaW1lc3RhbXBzLFxuICBoaWRlTG9hZE1vcmU6IGhpZGVMb2FkTW9yZSxcbiAgdG9nZ2xlU29ydEJ0bjogdG9nZ2xlU29ydEJ0bixcbiAgdG9nZ2xlQ29tbWVudERpYWxvZzogdG9nZ2xlQ29tbWVudERpYWxvZyxcbiAgc2hvd1N1Y2Nlc3NDb21tZW50TXNnOiBzaG93U3VjY2Vzc0NvbW1lbnRNc2csXG4gIGRpc3BsYXlDb21tZW50Rm9ybUVycm9yczogZGlzcGxheUNvbW1lbnRGb3JtRXJyb3JzLFxuICBjbGVhckNvbW1lbnRGb3JtRXJyb3JzOiBjbGVhckNvbW1lbnRGb3JtRXJyb3JzLFxuICBhdHRhY2hTbGlkZXNob3c6IGF0dGFjaFNsaWRlc2hvd1xufTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpXG4gICwgdmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuXG5jb25zdCBjb21tZW50SXRlbUVuZHBvaW50ID0gYCR7TEIuYXBpX2hvc3R9YXBpL2NsaWVudF9pdGVtc2A7XG5jb25zdCBjb21tZW50UG9zdEVuZHBvaW50ID0gYCR7TEIuYXBpX2hvc3R9YXBpL2NsaWVudF9jb21tZW50c2A7XG5cbnZhciBlbmRwb2ludCA9IExCLmFwaV9ob3N0ICsgXCIvYXBpL2NsaWVudF9ibG9ncy9cIiArIExCLmJsb2cuX2lkICsgXCIvcG9zdHNcIlxuICAsIHNldHRpbmdzID0gTEIuc2V0dGluZ3NcbiAgLCB2bSA9IHt9O1xuXG4vKipcbiAqIEdldCBpbml0aWFsIG9yIHJlc2V0IHZpZXdtb2RlbC5cbiAqIEByZXR1cm5zIHtvYmplY3R9IGVtcHR5IHZpZXdtb2RlbCBzdG9yZS5cbiAqL1xuZnVuY3Rpb24gZ2V0RW1wdHlWbShpdGVtcykge1xuICByZXR1cm4ge1xuICAgIF9pdGVtczogbmV3IEFycmF5KGl0ZW1zKSB8fCAwLFxuICAgIGN1cnJlbnRQYWdlOiAxLFxuICAgIHRvdGFsUG9zdHM6IDBcbiAgfTtcbn1cblxudm0uc2VuZENvbW1lbnQgPSAobmFtZSwgY29tbWVudCkgPT4ge1xuICBsZXQgZXJyb3JzID0gW107XG5cbiAgaWYgKCFuYW1lKSB7XG4gICAgZXJyb3JzLnB1c2goe2lkOiAnI2NvbW1lbnQtbmFtZScsIG1zZzogJ01pc3NpbmcgbmFtZSd9KTtcbiAgfVxuXG4gIGlmICghY29tbWVudCkge1xuICAgIGVycm9ycy5wdXNoKHtpZDogJyNjb21tZW50LWNvbnRlbnQnLCBtc2c6ICdNaXNzaW5nIGNvbnRlbnQnfSk7XG4gIH1cblxuICBpZiAoZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gcmVqZWN0KGVycm9ycykpO1xuICB9XG5cbiAgcmV0dXJuIGhlbHBlcnNcbiAgICAucG9zdChjb21tZW50SXRlbUVuZHBvaW50LCB7XG4gICAgICBpdGVtX3R5cGU6IFwiY29tbWVudFwiLFxuICAgICAgY2xpZW50X2Jsb2c6IExCLmJsb2cuX2lkLFxuICAgICAgY29tbWVudGVyOiBuYW1lLFxuICAgICAgdGV4dDogY29tbWVudFxuICAgIH0pXG4gICAgLnRoZW4oKGl0ZW0pID0+IGhlbHBlcnMucG9zdChjb21tZW50UG9zdEVuZHBvaW50LCB7XG4gICAgICBwb3N0X3N0YXR1czogXCJjb21tZW50XCIsXG4gICAgICBjbGllbnRfYmxvZzogTEIuYmxvZy5faWQsXG4gICAgICBncm91cHM6IFt7XG4gICAgICAgIGlkOiBcInJvb3RcIixcbiAgICAgICAgcmVmczogW3tpZFJlZjogXCJtYWluXCJ9XSxcbiAgICAgICAgcm9sZTogXCJncnBSb2xlOk5FUFwiXG4gICAgICB9LHtcbiAgICAgICAgaWQ6IFwibWFpblwiLFxuICAgICAgICByZWZzOiBbe3Jlc2lkUmVmOiBpdGVtLl9pZH1dLFxuICAgICAgICByb2xlOiBcImdycFJvbGU6TWFpblwifVxuICAgICAgXVxuICAgIH0pKTtcbiAgICAvLy5jYXRjaCgoZXJyKSA9PiB7XG4gICAgLy8gIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAvL30pO1xufTtcblxuLyoqXG4gKiBQcml2YXRlIEFQSSByZXF1ZXN0IG1ldGhvZFxuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBxdWVyeSBidWlsZGVyIG9wdGlvbnMuXG4gKiBAcGFyYW0ge251bWJlcn0gb3B0cy5wYWdlIC0gZGVzaXJlZCBwYWdlL3N1YnNldCBvZiBwb3N0cywgbGVhdmUgZW1wdHkgZm9yIHBvbGxpbmcuXG4gKiBAcGFyYW0ge251bWJlcn0gb3B0cy5mcm9tRGF0ZSAtIG5lZWRlZCBmb3IgcG9sbGluZy5cbiAqIEByZXR1cm5zIHtvYmplY3R9IExpdmVibG9nIDMgQVBJIHJlc3BvbnNlXG4gKi9cbnZtLmdldFBvc3RzID0gZnVuY3Rpb24ob3B0cykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGRiUXVlcnkgPSBzZWxmLmdldFF1ZXJ5KHtcbiAgICBzb3J0OiBvcHRzLnNvcnQgfHwgc2VsZi5zZXR0aW5ncy5wb3N0T3JkZXIsXG4gICAgaGlnaGxpZ2h0c09ubHk6IGZhbHNlIHx8IG9wdHMuaGlnaGxpZ2h0c09ubHksXG4gICAgZnJvbURhdGU6IG9wdHMuZnJvbURhdGVcbiAgICAgID8gb3B0cy5mcm9tRGF0ZVxuICAgICAgOiBmYWxzZVxuICB9KTtcblxuICB2YXIgcGFnZSA9IG9wdHMuZnJvbURhdGUgPyAxIDogb3B0cy5wYWdlO1xuICB2YXIgcXMgPSBcIj9tYXhfcmVzdWx0cz1cIiArIHNldHRpbmdzLnBvc3RzUGVyUGFnZSArIFwiJnBhZ2U9XCIgKyBwYWdlICsgXCImc291cmNlPVwiXG4gICAgLCBmdWxsUGF0aCA9IGVuZHBvaW50ICsgcXMgKyBkYlF1ZXJ5O1xuXG4gIHJldHVybiBoZWxwZXJzLmdldEpTT04oZnVsbFBhdGgpXG4gICAgLnRoZW4oKHBvc3RzKSA9PiB7XG4gICAgICBzZWxmLnVwZGF0ZVZpZXdNb2RlbChwb3N0cywgb3B0cyk7XG4gICAgICBwb3N0cy5yZXF1ZXN0T3B0cyA9IG9wdHM7XG4gICAgICByZXR1cm4gcG9zdHM7XG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBHZXQgbmV4dCBwYWdlIG9mIHBvc3RzIGZyb20gQVBJLlxuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBxdWVyeSBidWlsZGVyIG9wdGlvbnMuXG4gKiBAcmV0dXJucyB7cHJvbWlzZX0gcmVzb2x2ZXMgdG8gcG9zdHMgYXJyYXkuXG4gKi9cbnZtLmxvYWRQb3N0c1BhZ2UgPSBmdW5jdGlvbihvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICBvcHRzLnBhZ2UgPSArK3RoaXMudm0uY3VycmVudFBhZ2U7XG4gIG9wdHMuc29ydCA9IHRoaXMuc2V0dGluZ3MucG9zdE9yZGVyO1xuICByZXR1cm4gdGhpcy5nZXRQb3N0cyhvcHRzKTtcbn07XG5cbi8qKlxuICogUG9sbCBBUEkgZm9yIG5ldyBwb3N0cy5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0gcXVlcnkgYnVpbGRlciBvcHRpb25zLlxuICogQHJldHVybnMge3Byb21pc2V9IHJlc29sdmVzIHRvIHBvc3RzIGFycmF5LlxuICovXG52bS5sb2FkUG9zdHMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICBvcHRzLmZyb21EYXRlID0gdGhpcy52bS5sYXRlc3RVcGRhdGU7XG4gIHJldHVybiB0aGlzLmdldFBvc3RzKG9wdHMpO1xufTtcblxuLyoqXG4gKiBBZGQgaXRlbXMgaW4gYXBpIHJlc3BvbnNlICYgbGF0ZXN0IHVwZGF0ZSB0aW1lc3RhbXAgdG8gdmlld21vZGVsLlxuICogQHBhcmFtIHtvYmplY3R9IGFwaV9yZXNwb25zZSAtIGxpdmVibG9nIEFQSSByZXNwb25zZSBKU09OLlxuICovXG52bS51cGRhdGVWaWV3TW9kZWwgPSBmdW5jdGlvbihhcGlfcmVzcG9uc2UsIG9wdHMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGlmICghb3B0cy5mcm9tRGF0ZSB8fCBvcHRzLnNvcnQgIT09IHNlbGYuc2V0dGluZ3MucG9zdE9yZGVyKSB7IC8vIE1lYW5zIHdlJ3JlIG5vdCBwb2xsaW5nXG4gICAgdmlldy5oaWRlTG9hZE1vcmUoc2VsZi5pc1RpbWVsaW5lRW5kKGFwaV9yZXNwb25zZSkpOyAvLyB0aGUgZW5kP1xuICB9IGVsc2UgeyAvLyBNZWFucyB3ZSdyZSBwb2xsaW5nIGZvciBuZXcgcG9zdHNcbiAgICBpZiAoIWFwaV9yZXNwb25zZS5faXRlbXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi52bS5sYXRlc3RVcGRhdGUgPSBzZWxmLmdldExhdGVzdFVwZGF0ZShhcGlfcmVzcG9uc2UpO1xuICB9XG5cbiAgaWYgKG9wdHMuc29ydCAhPT0gc2VsZi5zZXR0aW5ncy5wb3N0T3JkZXIpIHtcbiAgICBzZWxmLnZtID0gZ2V0RW1wdHlWbSgpO1xuICAgIHZpZXcuaGlkZUxvYWRNb3JlKGZhbHNlKTtcbiAgICBPYmplY3QuYXNzaWduKHNlbGYudm0sIGFwaV9yZXNwb25zZSk7XG4gIH0gZWxzZSB7XG4gICAgc2VsZi52bS5faXRlbXMucHVzaC5hcHBseShzZWxmLnZtLl9pdGVtcywgYXBpX3Jlc3BvbnNlLl9pdGVtcyk7XG4gIH1cblxuICBzZWxmLnNldHRpbmdzLnBvc3RPcmRlciA9IG9wdHMuc29ydDtcbiAgcmV0dXJuIGFwaV9yZXNwb25zZTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBsYXRlc3QgdXBkYXRlIHRpbWVzdGFtcCBmcm9tIGEgbnVtYmVyIG9mIHBvc3RzLlxuICogQHBhcmFtIHtvYmplY3R9IGFwaV9yZXNwb25zZSAtIGxpdmVibG9nIEFQSSByZXNwb25zZSBKU09OLlxuICogQHJldHVybnMge3N0cmluZ30gLSBJU08gODYwMSBlbmNvZGVkIGRhdGVcbiAqL1xudm0uZ2V0TGF0ZXN0VXBkYXRlID0gZnVuY3Rpb24oYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciB0aW1lc3RhbXBzID0gYXBpX3Jlc3BvbnNlLl9pdGVtcy5tYXAoKHBvc3QpID0+IG5ldyBEYXRlKHBvc3QuX3VwZGF0ZWQpKTtcblxuICB2YXIgbGF0ZXN0ID0gbmV3IERhdGUoTWF0aC5tYXguYXBwbHkobnVsbCwgdGltZXN0YW1wcykpO1xuICByZXR1cm4gbGF0ZXN0LnRvSVNPU3RyaW5nKCk7IC8vIGNvbnZlcnQgdGltZXN0YW1wIHRvIElTT1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB3ZSByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHRpbWVsaW5lLlxuICogQHBhcmFtIHtvYmplY3R9IGFwaV9yZXNwb25zZSAtIGxpdmVibG9nIEFQSSByZXNwb25zZSBKU09OLlxuICogQHJldHVybnMge2Jvb2x9XG4gKi9cbnZtLmlzVGltZWxpbmVFbmQgPSBmdW5jdGlvbihhcGlfcmVzcG9uc2UpIHtcbiAgdmFyIGl0ZW1zSW5WaWV3ID0gdGhpcy52bS5faXRlbXMubGVuZ3RoICsgc2V0dGluZ3MucG9zdHNQZXJQYWdlO1xuICByZXR1cm4gYXBpX3Jlc3BvbnNlLl9tZXRhLnRvdGFsIDw9IGl0ZW1zSW5WaWV3O1xufTtcblxuLyoqXG4gKiBTZXQgdXAgdmlld21vZGVsLlxuICovXG52bS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgdGhpcy52bSA9IGdldEVtcHR5Vm0oc2V0dGluZ3MucG9zdHNQZXJQYWdlKTtcbiAgdGhpcy52bS5sYXRlc3RVcGRhdGUgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gIHRoaXMudm0udGltZUluaXRpYWxpemVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICByZXR1cm4gdGhpcy52bS5sYXRlc3RVcGRhdGU7XG59O1xuXG4vKipcbiAqIEJ1aWxkIHVybGVuY29kZWQgRWxhc3RpY1NlYXJjaCBRdWVyeXN0cmluZ1xuICogVE9ETzogYWJzdHJhY3QgYXdheSwgd2Ugb25seSBuZWVkIHN0aWNreSBmbGFnIGFuZCBvcmRlclxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBhcmd1bWVudHMgb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5zb3J0IC0gaWYgXCJhc2NlbmRpbmdcIiwgZ2V0IGl0ZW1zIGluIGFzY2VuZGluZyBvcmRlclxuICogQHBhcmFtIHtzdHJpbmd9IG9wdHMuZnJvbURhdGUgLSByZXN1bHRzIHdpdGggYSBJU08gODYwMSB0aW1lc3RhbXAgZ3QgdGhpcyBvbmx5XG4gKiBAcGFyYW0ge2Jvb2x9IG9wdHMuaGlnaGxpZ2h0c09ubHkgLSBnZXQgZWRpdG9yaWFsL2hpZ2hsaWdodGVkIGl0ZW1zIG9ubHlcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFF1ZXJ5c3RyaW5nXG4gKi9cbnZtLmdldFF1ZXJ5ID0gZnVuY3Rpb24ob3B0cykge1xuICB2YXIgcXVlcnkgPSB7XG4gICAgXCJxdWVyeVwiOiB7XG4gICAgICBcImZpbHRlcmVkXCI6IHtcbiAgICAgICAgXCJmaWx0ZXJcIjoge1xuICAgICAgICAgIFwiYW5kXCI6IFtcbiAgICAgICAgICAgIHtcInRlcm1cIjoge1wic3RpY2t5XCI6IGZhbHNlfX0sXG4gICAgICAgICAgICB7XCJ0ZXJtXCI6IHtcInBvc3Rfc3RhdHVzXCI6IFwib3BlblwifX0sXG4gICAgICAgICAgICB7XCJub3RcIjoge1widGVybVwiOiB7XCJkZWxldGVkXCI6IHRydWV9fX0sXG4gICAgICAgICAgICB7XCJyYW5nZVwiOiB7XCJfdXBkYXRlZFwiOiB7XCJsdFwiOiB0aGlzLnZtLnRpbWVJbml0aWFsaXplZH19fVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXCJzb3J0XCI6IFtcbiAgICAgIHtcbiAgICAgICAgXCJfdXBkYXRlZFwiOiB7XCJvcmRlclwiOiBcImRlc2NcIn1cbiAgICAgIH1cbiAgICBdXG4gIH07XG5cbiAgaWYgKG9wdHMuZnJvbURhdGUpIHtcbiAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kWzNdLnJhbmdlLl91cGRhdGVkID0ge1xuICAgICAgXCJndFwiOiBvcHRzLmZyb21EYXRlXG4gICAgfTtcbiAgfVxuXG4gIGlmIChvcHRzLmhpZ2hsaWdodHNPbmx5ID09PSB0cnVlKSB7XG4gICAgcXVlcnkucXVlcnkuZmlsdGVyZWQuZmlsdGVyLmFuZC5wdXNoKHtcbiAgICAgIHRlcm06IHtoaWdobGlnaHQ6IHRydWV9XG4gICAgfSk7XG4gIH1cblxuICBpZiAob3B0cy5zb3J0ID09PSBcImFzY2VuZGluZ1wiKSB7XG4gICAgcXVlcnkuc29ydFswXS5fdXBkYXRlZC5vcmRlciA9IFwiYXNjXCI7XG4gIH0gZWxzZSBpZiAob3B0cy5zb3J0ID09PSBcImVkaXRvcmlhbFwiKSB7XG4gICAgcXVlcnkuc29ydCA9IFtcbiAgICAgIHtcbiAgICAgICAgb3JkZXI6IHtcbiAgICAgICAgICBvcmRlcjogXCJkZXNjXCIsXG4gICAgICAgICAgbWlzc2luZzogXCJfbGFzdFwiLFxuICAgICAgICAgIHVubWFwcGVkX3R5cGU6IFwibG9uZ1wiXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdO1xuICB9XG5cbiAgLy8gUmVtb3ZlIHRoZSByYW5nZSwgd2Ugd2FudCBhbGwgdGhlIHJlc3VsdHNcbiAgaWYgKFtcImFzY2VuZGluZ1wiLCBcImRlc2NlbmRpbmdcIiwgXCJlZGl0b3JpYWxcIl0uaW5kZXhPZihvcHRzLnNvcnQpKSB7XG4gICAgcXVlcnkucXVlcnkuZmlsdGVyZWQuZmlsdGVyLmFuZC5mb3JFYWNoKChydWxlLCBpbmRleCkgPT4ge1xuICAgICAgaWYgKHJ1bGUuaGFzT3duUHJvcGVydHkoJ3JhbmdlJykpIHtcbiAgICAgICAgcXVlcnkucXVlcnkuZmlsdGVyZWQuZmlsdGVyLmFuZC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGVuY29kZVVSSShKU09OLnN0cmluZ2lmeShxdWVyeSkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB2bTtcbiIsIi8qISBCcm93c2VyIGJ1bmRsZSBvZiBudW5qdWNrcyAzLjAuMSAoc2xpbSwgb25seSB3b3JrcyB3aXRoIHByZWNvbXBpbGVkIHRlbXBsYXRlcykgKi9cbihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIm51bmp1Y2tzXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcIm51bmp1Y2tzXCJdID0gZmFjdG9yeSgpO1xufSkodGhpcywgZnVuY3Rpb24oKSB7XG5yZXR1cm4gLyoqKioqKi8gKGZ1bmN0aW9uKG1vZHVsZXMpIHsgLy8gd2VicGFja0Jvb3RzdHJhcFxuLyoqKioqKi8gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbi8qKioqKiovIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbi8qKioqKiovIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4vKioqKioqLyBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4vKioqKioqLyBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4vKioqKioqLyBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuLyoqKioqKi8gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4vKioqKioqLyBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuLyoqKioqKi8gXHRcdFx0ZXhwb3J0czoge30sXG4vKioqKioqLyBcdFx0XHRpZDogbW9kdWxlSWQsXG4vKioqKioqLyBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4vKioqKioqLyBcdFx0fTtcblxuLyoqKioqKi8gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuLyoqKioqKi8gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4vKioqKioqLyBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuLyoqKioqKi8gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4vKioqKioqLyBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbi8qKioqKiovIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4vKioqKioqLyBcdH1cblxuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuLyoqKioqKi8gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4vKioqKioqLyBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLyoqKioqKi8gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcbi8qKioqKiovIH0pXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKi8gKFtcbi8qIDAgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cdHZhciBlbnYgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDIpO1xuXHR2YXIgTG9hZGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygxNSk7XG5cdHZhciBsb2FkZXJzID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIHByZWNvbXBpbGUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXG5cdG1vZHVsZS5leHBvcnRzID0ge307XG5cdG1vZHVsZS5leHBvcnRzLkVudmlyb25tZW50ID0gZW52LkVudmlyb25tZW50O1xuXHRtb2R1bGUuZXhwb3J0cy5UZW1wbGF0ZSA9IGVudi5UZW1wbGF0ZTtcblxuXHRtb2R1bGUuZXhwb3J0cy5Mb2FkZXIgPSBMb2FkZXI7XG5cdG1vZHVsZS5leHBvcnRzLkZpbGVTeXN0ZW1Mb2FkZXIgPSBsb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXI7XG5cdG1vZHVsZS5leHBvcnRzLlByZWNvbXBpbGVkTG9hZGVyID0gbG9hZGVycy5QcmVjb21waWxlZExvYWRlcjtcblx0bW9kdWxlLmV4cG9ydHMuV2ViTG9hZGVyID0gbG9hZGVycy5XZWJMb2FkZXI7XG5cblx0bW9kdWxlLmV4cG9ydHMuY29tcGlsZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHRtb2R1bGUuZXhwb3J0cy5wYXJzZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHRtb2R1bGUuZXhwb3J0cy5sZXhlciA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdG1vZHVsZS5leHBvcnRzLnJ1bnRpbWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDgpO1xuXHRtb2R1bGUuZXhwb3J0cy5saWIgPSBsaWI7XG5cdG1vZHVsZS5leHBvcnRzLm5vZGVzID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHRtb2R1bGUuZXhwb3J0cy5pbnN0YWxsSmluamFDb21wYXQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDE2KTtcblxuXHQvLyBBIHNpbmdsZSBpbnN0YW5jZSBvZiBhbiBlbnZpcm9ubWVudCwgc2luY2UgdGhpcyBpcyBzbyBjb21tb25seSB1c2VkXG5cblx0dmFyIGU7XG5cdG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uKHRlbXBsYXRlc1BhdGgsIG9wdHMpIHtcblx0ICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXHQgICAgaWYobGliLmlzT2JqZWN0KHRlbXBsYXRlc1BhdGgpKSB7XG5cdCAgICAgICAgb3B0cyA9IHRlbXBsYXRlc1BhdGg7XG5cdCAgICAgICAgdGVtcGxhdGVzUGF0aCA9IG51bGw7XG5cdCAgICB9XG5cblx0ICAgIHZhciBUZW1wbGF0ZUxvYWRlcjtcblx0ICAgIGlmKGxvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcikge1xuXHQgICAgICAgIFRlbXBsYXRlTG9hZGVyID0gbmV3IGxvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcih0ZW1wbGF0ZXNQYXRoLCB7XG5cdCAgICAgICAgICAgIHdhdGNoOiBvcHRzLndhdGNoLFxuXHQgICAgICAgICAgICBub0NhY2hlOiBvcHRzLm5vQ2FjaGVcblx0ICAgICAgICB9KTtcblx0ICAgIH1cblx0ICAgIGVsc2UgaWYobG9hZGVycy5XZWJMb2FkZXIpIHtcblx0ICAgICAgICBUZW1wbGF0ZUxvYWRlciA9IG5ldyBsb2FkZXJzLldlYkxvYWRlcih0ZW1wbGF0ZXNQYXRoLCB7XG5cdCAgICAgICAgICAgIHVzZUNhY2hlOiBvcHRzLndlYiAmJiBvcHRzLndlYi51c2VDYWNoZSxcblx0ICAgICAgICAgICAgYXN5bmM6IG9wdHMud2ViICYmIG9wdHMud2ViLmFzeW5jXG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIGUgPSBuZXcgZW52LkVudmlyb25tZW50KFRlbXBsYXRlTG9hZGVyLCBvcHRzKTtcblxuXHQgICAgaWYob3B0cyAmJiBvcHRzLmV4cHJlc3MpIHtcblx0ICAgICAgICBlLmV4cHJlc3Mob3B0cy5leHByZXNzKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIGU7XG5cdH07XG5cblx0bW9kdWxlLmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uKHNyYywgZW52LCBwYXRoLCBlYWdlckNvbXBpbGUpIHtcblx0ICAgIGlmKCFlKSB7XG5cdCAgICAgICAgbW9kdWxlLmV4cG9ydHMuY29uZmlndXJlKCk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbmV3IG1vZHVsZS5leHBvcnRzLlRlbXBsYXRlKHNyYywgZW52LCBwYXRoLCBlYWdlckNvbXBpbGUpO1xuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIGN0eCwgY2IpIHtcblx0ICAgIGlmKCFlKSB7XG5cdCAgICAgICAgbW9kdWxlLmV4cG9ydHMuY29uZmlndXJlKCk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBlLnJlbmRlcihuYW1lLCBjdHgsIGNiKTtcblx0fTtcblxuXHRtb2R1bGUuZXhwb3J0cy5yZW5kZXJTdHJpbmcgPSBmdW5jdGlvbihzcmMsIGN0eCwgY2IpIHtcblx0ICAgIGlmKCFlKSB7XG5cdCAgICAgICAgbW9kdWxlLmV4cG9ydHMuY29uZmlndXJlKCk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBlLnJlbmRlclN0cmluZyhzcmMsIGN0eCwgY2IpO1xuXHR9O1xuXG5cdGlmKHByZWNvbXBpbGUpIHtcblx0ICAgIG1vZHVsZS5leHBvcnRzLnByZWNvbXBpbGUgPSBwcmVjb21waWxlLnByZWNvbXBpbGU7XG5cdCAgICBtb2R1bGUuZXhwb3J0cy5wcmVjb21waWxlU3RyaW5nID0gcHJlY29tcGlsZS5wcmVjb21waWxlU3RyaW5nO1xuXHR9XG5cblxuLyoqKi8gfSksXG4vKiAxICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlO1xuXHR2YXIgT2JqUHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG5cdHZhciBlc2NhcGVNYXAgPSB7XG5cdCAgICAnJic6ICcmYW1wOycsXG5cdCAgICAnXCInOiAnJnF1b3Q7Jyxcblx0ICAgICdcXCcnOiAnJiMzOTsnLFxuXHQgICAgJzwnOiAnJmx0OycsXG5cdCAgICAnPic6ICcmZ3Q7J1xuXHR9O1xuXG5cdHZhciBlc2NhcGVSZWdleCA9IC9bJlwiJzw+XS9nO1xuXG5cdHZhciBsb29rdXBFc2NhcGUgPSBmdW5jdGlvbihjaCkge1xuXHQgICAgcmV0dXJuIGVzY2FwZU1hcFtjaF07XG5cdH07XG5cblx0dmFyIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5cdGV4cG9ydHMucHJldHRpZnlFcnJvciA9IGZ1bmN0aW9uKHBhdGgsIHdpdGhJbnRlcm5hbHMsIGVycikge1xuXHQgICAgLy8ganNoaW50IC1XMDIyXG5cdCAgICAvLyBodHRwOi8vanNsaW50ZXJyb3JzLmNvbS9kby1ub3QtYXNzaWduLXRvLXRoZS1leGNlcHRpb24tcGFyYW1ldGVyXG5cdCAgICBpZiAoIWVyci5VcGRhdGUpIHtcblx0ICAgICAgICAvLyBub3Qgb25lIG9mIG91cnMsIGNhc3QgaXRcblx0ICAgICAgICBlcnIgPSBuZXcgZXhwb3J0cy5UZW1wbGF0ZUVycm9yKGVycik7XG5cdCAgICB9XG5cdCAgICBlcnIuVXBkYXRlKHBhdGgpO1xuXG5cdCAgICAvLyBVbmxlc3MgdGhleSBtYXJrZWQgdGhlIGRldiBmbGFnLCBzaG93IHRoZW0gYSB0cmFjZSBmcm9tIGhlcmVcblx0ICAgIGlmICghd2l0aEludGVybmFscykge1xuXHQgICAgICAgIHZhciBvbGQgPSBlcnI7XG5cdCAgICAgICAgZXJyID0gbmV3IEVycm9yKG9sZC5tZXNzYWdlKTtcblx0ICAgICAgICBlcnIubmFtZSA9IG9sZC5uYW1lO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gZXJyO1xuXHR9O1xuXG5cdGV4cG9ydHMuVGVtcGxhdGVFcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UsIGxpbmVubywgY29sbm8pIHtcblx0ICAgIHZhciBlcnIgPSB0aGlzO1xuXG5cdCAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIEVycm9yKSB7IC8vIGZvciBjYXN0aW5nIHJlZ3VsYXIganMgZXJyb3JzXG5cdCAgICAgICAgZXJyID0gbWVzc2FnZTtcblx0ICAgICAgICBtZXNzYWdlID0gbWVzc2FnZS5uYW1lICsgJzogJyArIG1lc3NhZ2UubWVzc2FnZTtcblxuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIGlmKGVyci5uYW1lID0gJycpIHt9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGNhdGNoKGUpIHtcblx0ICAgICAgICAgICAgLy8gSWYgd2UgY2FuJ3Qgc2V0IHRoZSBuYW1lIG9mIHRoZSBlcnJvciBvYmplY3QgaW4gdGhpc1xuXHQgICAgICAgICAgICAvLyBlbnZpcm9ubWVudCwgZG9uJ3QgdXNlIGl0XG5cdCAgICAgICAgICAgIGVyciA9IHRoaXM7XG5cdCAgICAgICAgfVxuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICBpZihFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuXHQgICAgICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShlcnIpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgZXJyLm5hbWUgPSAnVGVtcGxhdGUgcmVuZGVyIGVycm9yJztcblx0ICAgIGVyci5tZXNzYWdlID0gbWVzc2FnZTtcblx0ICAgIGVyci5saW5lbm8gPSBsaW5lbm87XG5cdCAgICBlcnIuY29sbm8gPSBjb2xubztcblx0ICAgIGVyci5maXJzdFVwZGF0ZSA9IHRydWU7XG5cblx0ICAgIGVyci5VcGRhdGUgPSBmdW5jdGlvbihwYXRoKSB7XG5cdCAgICAgICAgdmFyIG1lc3NhZ2UgPSAnKCcgKyAocGF0aCB8fCAndW5rbm93biBwYXRoJykgKyAnKSc7XG5cblx0ICAgICAgICAvLyBvbmx5IHNob3cgbGluZW5vICsgY29sbm8gbmV4dCB0byBwYXRoIG9mIHRlbXBsYXRlXG5cdCAgICAgICAgLy8gd2hlcmUgZXJyb3Igb2NjdXJyZWRcblx0ICAgICAgICBpZiAodGhpcy5maXJzdFVwZGF0ZSkge1xuXHQgICAgICAgICAgICBpZih0aGlzLmxpbmVubyAmJiB0aGlzLmNvbG5vKSB7XG5cdCAgICAgICAgICAgICAgICBtZXNzYWdlICs9ICcgW0xpbmUgJyArIHRoaXMubGluZW5vICsgJywgQ29sdW1uICcgKyB0aGlzLmNvbG5vICsgJ10nO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYodGhpcy5saW5lbm8pIHtcblx0ICAgICAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyBbTGluZSAnICsgdGhpcy5saW5lbm8gKyAnXSc7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBtZXNzYWdlICs9ICdcXG4gJztcblx0ICAgICAgICBpZiAodGhpcy5maXJzdFVwZGF0ZSkge1xuXHQgICAgICAgICAgICBtZXNzYWdlICs9ICcgJztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlICsgKHRoaXMubWVzc2FnZSB8fCAnJyk7XG5cdCAgICAgICAgdGhpcy5maXJzdFVwZGF0ZSA9IGZhbHNlO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfTtcblxuXHQgICAgcmV0dXJuIGVycjtcblx0fTtcblxuXHRleHBvcnRzLlRlbXBsYXRlRXJyb3IucHJvdG90eXBlID0gRXJyb3IucHJvdG90eXBlO1xuXG5cdGV4cG9ydHMuZXNjYXBlID0gZnVuY3Rpb24odmFsKSB7XG5cdCAgcmV0dXJuIHZhbC5yZXBsYWNlKGVzY2FwZVJlZ2V4LCBsb29rdXBFc2NhcGUpO1xuXHR9O1xuXG5cdGV4cG9ydHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblx0fTtcblxuXHRleHBvcnRzLmlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcblx0fTtcblxuXHRleHBvcnRzLmlzU3RyaW5nID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBTdHJpbmddJztcblx0fTtcblxuXHRleHBvcnRzLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBPYmplY3RdJztcblx0fTtcblxuXHRleHBvcnRzLmdyb3VwQnkgPSBmdW5jdGlvbihvYmosIHZhbCkge1xuXHQgICAgdmFyIHJlc3VsdCA9IHt9O1xuXHQgICAgdmFyIGl0ZXJhdG9yID0gZXhwb3J0cy5pc0Z1bmN0aW9uKHZhbCkgPyB2YWwgOiBmdW5jdGlvbihvYmopIHsgcmV0dXJuIG9ialt2YWxdOyB9O1xuXHQgICAgZm9yKHZhciBpPTA7IGk8b2JqLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgdmFyIHZhbHVlID0gb2JqW2ldO1xuXHQgICAgICAgIHZhciBrZXkgPSBpdGVyYXRvcih2YWx1ZSwgaSk7XG5cdCAgICAgICAgKHJlc3VsdFtrZXldIHx8IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gcmVzdWx0O1xuXHR9O1xuXG5cdGV4cG9ydHMudG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKG9iaik7XG5cdH07XG5cblx0ZXhwb3J0cy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcblx0ICAgIHZhciByZXN1bHQgPSBbXTtcblx0ICAgIGlmICghYXJyYXkpIHtcblx0ICAgICAgICByZXR1cm4gcmVzdWx0O1xuXHQgICAgfVxuXHQgICAgdmFyIGluZGV4ID0gLTEsXG5cdCAgICBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG5cdCAgICBjb250YWlucyA9IGV4cG9ydHMudG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuXG5cdCAgICB3aGlsZSgrK2luZGV4IDwgbGVuZ3RoKSB7XG5cdCAgICAgICAgaWYoZXhwb3J0cy5pbmRleE9mKGNvbnRhaW5zLCBhcnJheVtpbmRleF0pID09PSAtMSkge1xuXHQgICAgICAgICAgICByZXN1bHQucHVzaChhcnJheVtpbmRleF0pO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHJldHVybiByZXN1bHQ7XG5cdH07XG5cblx0ZXhwb3J0cy5leHRlbmQgPSBmdW5jdGlvbihvYmosIG9iajIpIHtcblx0ICAgIGZvcih2YXIgayBpbiBvYmoyKSB7XG5cdCAgICAgICAgb2JqW2tdID0gb2JqMltrXTtcblx0ICAgIH1cblx0ICAgIHJldHVybiBvYmo7XG5cdH07XG5cblx0ZXhwb3J0cy5yZXBlYXQgPSBmdW5jdGlvbihjaGFyXywgbikge1xuXHQgICAgdmFyIHN0ciA9ICcnO1xuXHQgICAgZm9yKHZhciBpPTA7IGk8bjsgaSsrKSB7XG5cdCAgICAgICAgc3RyICs9IGNoYXJfO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHN0cjtcblx0fTtcblxuXHRleHBvcnRzLmVhY2ggPSBmdW5jdGlvbihvYmosIGZ1bmMsIGNvbnRleHQpIHtcblx0ICAgIGlmKG9iaiA9PSBudWxsKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICBpZihBcnJheVByb3RvLmVhY2ggJiYgb2JqLmVhY2ggPT09IEFycmF5UHJvdG8uZWFjaCkge1xuXHQgICAgICAgIG9iai5mb3JFYWNoKGZ1bmMsIGNvbnRleHQpO1xuXHQgICAgfVxuXHQgICAgZWxzZSBpZihvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuXHQgICAgICAgIGZvcih2YXIgaT0wLCBsPW9iai5sZW5ndGg7IGk8bDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGZ1bmMuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHR9O1xuXG5cdGV4cG9ydHMubWFwID0gZnVuY3Rpb24ob2JqLCBmdW5jKSB7XG5cdCAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXHQgICAgaWYob2JqID09IG51bGwpIHtcblx0ICAgICAgICByZXR1cm4gcmVzdWx0cztcblx0ICAgIH1cblxuXHQgICAgaWYoQXJyYXlQcm90by5tYXAgJiYgb2JqLm1hcCA9PT0gQXJyYXlQcm90by5tYXApIHtcblx0ICAgICAgICByZXR1cm4gb2JqLm1hcChmdW5jKTtcblx0ICAgIH1cblxuXHQgICAgZm9yKHZhciBpPTA7IGk8b2JqLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgcmVzdWx0c1tyZXN1bHRzLmxlbmd0aF0gPSBmdW5jKG9ialtpXSwgaSk7XG5cdCAgICB9XG5cblx0ICAgIGlmKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG5cdCAgICAgICAgcmVzdWx0cy5sZW5ndGggPSBvYmoubGVuZ3RoO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gcmVzdWx0cztcblx0fTtcblxuXHRleHBvcnRzLmFzeW5jSXRlciA9IGZ1bmN0aW9uKGFyciwgaXRlciwgY2IpIHtcblx0ICAgIHZhciBpID0gLTE7XG5cblx0ICAgIGZ1bmN0aW9uIG5leHQoKSB7XG5cdCAgICAgICAgaSsrO1xuXG5cdCAgICAgICAgaWYoaSA8IGFyci5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgaXRlcihhcnJbaV0sIGksIG5leHQsIGNiKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGNiKCk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBuZXh0KCk7XG5cdH07XG5cblx0ZXhwb3J0cy5hc3luY0ZvciA9IGZ1bmN0aW9uKG9iaiwgaXRlciwgY2IpIHtcblx0ICAgIHZhciBrZXlzID0gZXhwb3J0cy5rZXlzKG9iaik7XG5cdCAgICB2YXIgbGVuID0ga2V5cy5sZW5ndGg7XG5cdCAgICB2YXIgaSA9IC0xO1xuXG5cdCAgICBmdW5jdGlvbiBuZXh0KCkge1xuXHQgICAgICAgIGkrKztcblx0ICAgICAgICB2YXIgayA9IGtleXNbaV07XG5cblx0ICAgICAgICBpZihpIDwgbGVuKSB7XG5cdCAgICAgICAgICAgIGl0ZXIoaywgb2JqW2tdLCBpLCBsZW4sIG5leHQpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgY2IoKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIG5leHQoKTtcblx0fTtcblxuXHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9pbmRleE9mI1BvbHlmaWxsXG5cdGV4cG9ydHMuaW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mID9cblx0ICAgIGZ1bmN0aW9uIChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuXHQgICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGFyciwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KTtcblx0ICAgIH0gOlxuXHQgICAgZnVuY3Rpb24gKGFyciwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG5cdCAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoID4+PiAwOyAvLyBIYWNrIHRvIGNvbnZlcnQgb2JqZWN0Lmxlbmd0aCB0byBhIFVJbnQzMlxuXG5cdCAgICAgICAgZnJvbUluZGV4ID0gK2Zyb21JbmRleCB8fCAwO1xuXG5cdCAgICAgICAgaWYoTWF0aC5hYnMoZnJvbUluZGV4KSA9PT0gSW5maW5pdHkpIHtcblx0ICAgICAgICAgICAgZnJvbUluZGV4ID0gMDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZihmcm9tSW5kZXggPCAwKSB7XG5cdCAgICAgICAgICAgIGZyb21JbmRleCArPSBsZW5ndGg7XG5cdCAgICAgICAgICAgIGlmIChmcm9tSW5kZXggPCAwKSB7XG5cdCAgICAgICAgICAgICAgICBmcm9tSW5kZXggPSAwO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yKDtmcm9tSW5kZXggPCBsZW5ndGg7IGZyb21JbmRleCsrKSB7XG5cdCAgICAgICAgICAgIGlmIChhcnJbZnJvbUluZGV4XSA9PT0gc2VhcmNoRWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZyb21JbmRleDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiAtMTtcblx0ICAgIH07XG5cblx0aWYoIUFycmF5LnByb3RvdHlwZS5tYXApIHtcblx0ICAgIEFycmF5LnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcCBpcyB1bmltcGxlbWVudGVkIGZvciB0aGlzIGpzIGVuZ2luZScpO1xuXHQgICAgfTtcblx0fVxuXG5cdGV4cG9ydHMua2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgaWYoT2JqZWN0LnByb3RvdHlwZS5rZXlzKSB7XG5cdCAgICAgICAgcmV0dXJuIG9iai5rZXlzKCk7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICB2YXIga2V5cyA9IFtdO1xuXHQgICAgICAgIGZvcih2YXIgayBpbiBvYmopIHtcblx0ICAgICAgICAgICAgaWYob2JqLmhhc093blByb3BlcnR5KGspKSB7XG5cdCAgICAgICAgICAgICAgICBrZXlzLnB1c2goayk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGtleXM7XG5cdCAgICB9XG5cdH07XG5cblx0ZXhwb3J0cy5pbk9wZXJhdG9yID0gZnVuY3Rpb24gKGtleSwgdmFsKSB7XG5cdCAgICBpZiAoZXhwb3J0cy5pc0FycmF5KHZhbCkpIHtcblx0ICAgICAgICByZXR1cm4gZXhwb3J0cy5pbmRleE9mKHZhbCwga2V5KSAhPT0gLTE7XG5cdCAgICB9IGVsc2UgaWYgKGV4cG9ydHMuaXNPYmplY3QodmFsKSkge1xuXHQgICAgICAgIHJldHVybiBrZXkgaW4gdmFsO1xuXHQgICAgfSBlbHNlIGlmIChleHBvcnRzLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICByZXR1cm4gdmFsLmluZGV4T2Yoa2V5KSAhPT0gLTE7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHVzZSBcImluXCIgb3BlcmF0b3IgdG8gc2VhcmNoIGZvciBcIidcblx0ICAgICAgICAgICAgKyBrZXkgKyAnXCIgaW4gdW5leHBlY3RlZCB0eXBlcy4nKTtcblx0ICAgIH1cblx0fTtcblxuXG4vKioqLyB9KSxcbi8qIDIgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIHBhdGggPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgYXNhcCA9IF9fd2VicGFja19yZXF1aXJlX18oNCk7XG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgT2JqID0gX193ZWJwYWNrX3JlcXVpcmVfXyg2KTtcblx0dmFyIGNvbXBpbGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIGJ1aWx0aW5fZmlsdGVycyA9IF9fd2VicGFja19yZXF1aXJlX18oNyk7XG5cdHZhciBidWlsdGluX2xvYWRlcnMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgcnVudGltZSA9IF9fd2VicGFja19yZXF1aXJlX18oOCk7XG5cdHZhciBnbG9iYWxzID0gX193ZWJwYWNrX3JlcXVpcmVfXyg5KTtcblx0dmFyIHdhdGVyZmFsbCA9IF9fd2VicGFja19yZXF1aXJlX18oMTApO1xuXHR2YXIgRnJhbWUgPSBydW50aW1lLkZyYW1lO1xuXHR2YXIgVGVtcGxhdGU7XG5cblx0Ly8gVW5jb25kaXRpb25hbGx5IGxvYWQgaW4gdGhpcyBsb2FkZXIsIGV2ZW4gaWYgbm8gb3RoZXIgb25lcyBhcmVcblx0Ly8gaW5jbHVkZWQgKHBvc3NpYmxlIGluIHRoZSBzbGltIGJyb3dzZXIgYnVpbGQpXG5cdGJ1aWx0aW5fbG9hZGVycy5QcmVjb21waWxlZExvYWRlciA9IF9fd2VicGFja19yZXF1aXJlX18oMTQpO1xuXG5cdC8vIElmIHRoZSB1c2VyIGlzIHVzaW5nIHRoZSBhc3luYyBBUEksICphbHdheXMqIGNhbGwgaXRcblx0Ly8gYXN5bmNocm9ub3VzbHkgZXZlbiBpZiB0aGUgdGVtcGxhdGUgd2FzIHN5bmNocm9ub3VzLlxuXHRmdW5jdGlvbiBjYWxsYmFja0FzYXAoY2IsIGVyciwgcmVzKSB7XG5cdCAgICBhc2FwKGZ1bmN0aW9uKCkgeyBjYihlcnIsIHJlcyk7IH0pO1xuXHR9XG5cblx0dmFyIEVudmlyb25tZW50ID0gT2JqLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbihsb2FkZXJzLCBvcHRzKSB7XG5cdCAgICAgICAgLy8gVGhlIGRldiBmbGFnIGRldGVybWluZXMgdGhlIHRyYWNlIHRoYXQnbGwgYmUgc2hvd24gb24gZXJyb3JzLlxuXHQgICAgICAgIC8vIElmIHNldCB0byB0cnVlLCByZXR1cm5zIHRoZSBmdWxsIHRyYWNlIGZyb20gdGhlIGVycm9yIHBvaW50LFxuXHQgICAgICAgIC8vIG90aGVyd2lzZSB3aWxsIHJldHVybiB0cmFjZSBzdGFydGluZyBmcm9tIFRlbXBsYXRlLnJlbmRlclxuXHQgICAgICAgIC8vICh0aGUgZnVsbCB0cmFjZSBmcm9tIHdpdGhpbiBudW5qdWNrcyBtYXkgY29uZnVzZSBkZXZlbG9wZXJzIHVzaW5nXG5cdCAgICAgICAgLy8gIHRoZSBsaWJyYXJ5KVxuXHQgICAgICAgIC8vIGRlZmF1bHRzIHRvIGZhbHNlXG5cdCAgICAgICAgb3B0cyA9IHRoaXMub3B0cyA9IG9wdHMgfHwge307XG5cdCAgICAgICAgdGhpcy5vcHRzLmRldiA9ICEhb3B0cy5kZXY7XG5cblx0ICAgICAgICAvLyBUaGUgYXV0b2VzY2FwZSBmbGFnIHNldHMgZ2xvYmFsIGF1dG9lc2NhcGluZy4gSWYgdHJ1ZSxcblx0ICAgICAgICAvLyBldmVyeSBzdHJpbmcgdmFyaWFibGUgd2lsbCBiZSBlc2NhcGVkIGJ5IGRlZmF1bHQuXG5cdCAgICAgICAgLy8gSWYgZmFsc2UsIHN0cmluZ3MgY2FuIGJlIG1hbnVhbGx5IGVzY2FwZWQgdXNpbmcgdGhlIGBlc2NhcGVgIGZpbHRlci5cblx0ICAgICAgICAvLyBkZWZhdWx0cyB0byB0cnVlXG5cdCAgICAgICAgdGhpcy5vcHRzLmF1dG9lc2NhcGUgPSBvcHRzLmF1dG9lc2NhcGUgIT0gbnVsbCA/IG9wdHMuYXV0b2VzY2FwZSA6IHRydWU7XG5cblx0ICAgICAgICAvLyBJZiB0cnVlLCB0aGlzIHdpbGwgbWFrZSB0aGUgc3lzdGVtIHRocm93IGVycm9ycyBpZiB0cnlpbmdcblx0ICAgICAgICAvLyB0byBvdXRwdXQgYSBudWxsIG9yIHVuZGVmaW5lZCB2YWx1ZVxuXHQgICAgICAgIHRoaXMub3B0cy50aHJvd09uVW5kZWZpbmVkID0gISFvcHRzLnRocm93T25VbmRlZmluZWQ7XG5cdCAgICAgICAgdGhpcy5vcHRzLnRyaW1CbG9ja3MgPSAhIW9wdHMudHJpbUJsb2Nrcztcblx0ICAgICAgICB0aGlzLm9wdHMubHN0cmlwQmxvY2tzID0gISFvcHRzLmxzdHJpcEJsb2NrcztcblxuXHQgICAgICAgIHRoaXMubG9hZGVycyA9IFtdO1xuXG5cdCAgICAgICAgaWYoIWxvYWRlcnMpIHtcblx0ICAgICAgICAgICAgLy8gVGhlIGZpbGVzeXN0ZW0gbG9hZGVyIGlzIG9ubHkgYXZhaWxhYmxlIHNlcnZlci1zaWRlXG5cdCAgICAgICAgICAgIGlmKGJ1aWx0aW5fbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBbbmV3IGJ1aWx0aW5fbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKCd2aWV3cycpXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKGJ1aWx0aW5fbG9hZGVycy5XZWJMb2FkZXIpIHtcblx0ICAgICAgICAgICAgICAgIHRoaXMubG9hZGVycyA9IFtuZXcgYnVpbHRpbl9sb2FkZXJzLldlYkxvYWRlcignL3ZpZXdzJyldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBsaWIuaXNBcnJheShsb2FkZXJzKSA/IGxvYWRlcnMgOiBbbG9hZGVyc107XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gSXQncyBlYXN5IHRvIHVzZSBwcmVjb21waWxlZCB0ZW1wbGF0ZXM6IGp1c3QgaW5jbHVkZSB0aGVtXG5cdCAgICAgICAgLy8gYmVmb3JlIHlvdSBjb25maWd1cmUgbnVuanVja3MgYW5kIHRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5XG5cdCAgICAgICAgLy8gcGljayBpdCB1cCBhbmQgdXNlIGl0XG5cdCAgICAgICAgaWYoKHRydWUpICYmIHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkKSB7XG5cdCAgICAgICAgICAgIHRoaXMubG9hZGVycy51bnNoaWZ0KFxuXHQgICAgICAgICAgICAgICAgbmV3IGJ1aWx0aW5fbG9hZGVycy5QcmVjb21waWxlZExvYWRlcih3aW5kb3cubnVuanVja3NQcmVjb21waWxlZClcblx0ICAgICAgICAgICAgKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLmluaXRDYWNoZSgpO1xuXG5cdCAgICAgICAgdGhpcy5nbG9iYWxzID0gZ2xvYmFscygpO1xuXHQgICAgICAgIHRoaXMuZmlsdGVycyA9IHt9O1xuXHQgICAgICAgIHRoaXMuYXN5bmNGaWx0ZXJzID0gW107XG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zID0ge307XG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zTGlzdCA9IFtdO1xuXG5cdCAgICAgICAgZm9yKHZhciBuYW1lIGluIGJ1aWx0aW5fZmlsdGVycykge1xuXHQgICAgICAgICAgICB0aGlzLmFkZEZpbHRlcihuYW1lLCBidWlsdGluX2ZpbHRlcnNbbmFtZV0pO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGluaXRDYWNoZTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgLy8gQ2FjaGluZyBhbmQgY2FjaGUgYnVzdGluZ1xuXHQgICAgICAgIGxpYi5lYWNoKHRoaXMubG9hZGVycywgZnVuY3Rpb24obG9hZGVyKSB7XG5cdCAgICAgICAgICAgIGxvYWRlci5jYWNoZSA9IHt9O1xuXG5cdCAgICAgICAgICAgIGlmKHR5cGVvZiBsb2FkZXIub24gPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgICAgIGxvYWRlci5vbigndXBkYXRlJywgZnVuY3Rpb24odGVtcGxhdGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICBsb2FkZXIuY2FjaGVbdGVtcGxhdGVdID0gbnVsbDtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cdCAgICB9LFxuXG5cdCAgICBhZGRFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUsIGV4dGVuc2lvbikge1xuXHQgICAgICAgIGV4dGVuc2lvbi5fbmFtZSA9IG5hbWU7XG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zW25hbWVdID0gZXh0ZW5zaW9uO1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9uc0xpc3QucHVzaChleHRlbnNpb24pO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgcmVtb3ZlRXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdmFyIGV4dGVuc2lvbiA9IHRoaXMuZ2V0RXh0ZW5zaW9uKG5hbWUpO1xuXHQgICAgICAgIGlmICghZXh0ZW5zaW9uKSByZXR1cm47XG5cblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnNMaXN0ID0gbGliLndpdGhvdXQodGhpcy5leHRlbnNpb25zTGlzdCwgZXh0ZW5zaW9uKTtcblx0ICAgICAgICBkZWxldGUgdGhpcy5leHRlbnNpb25zW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0RXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuZXh0ZW5zaW9uc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGhhc0V4dGVuc2lvbjogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHJldHVybiAhIXRoaXMuZXh0ZW5zaW9uc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEdsb2JhbDogZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcblx0ICAgICAgICB0aGlzLmdsb2JhbHNbbmFtZV0gPSB2YWx1ZTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIGdldEdsb2JhbDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIGlmKHR5cGVvZiB0aGlzLmdsb2JhbHNbbmFtZV0gPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZ2xvYmFsIG5vdCBmb3VuZDogJyArIG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gdGhpcy5nbG9iYWxzW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgYWRkRmlsdGVyOiBmdW5jdGlvbihuYW1lLCBmdW5jLCBhc3luYykge1xuXHQgICAgICAgIHZhciB3cmFwcGVkID0gZnVuYztcblxuXHQgICAgICAgIGlmKGFzeW5jKSB7XG5cdCAgICAgICAgICAgIHRoaXMuYXN5bmNGaWx0ZXJzLnB1c2gobmFtZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHRoaXMuZmlsdGVyc1tuYW1lXSA9IHdyYXBwZWQ7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRGaWx0ZXI6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZighdGhpcy5maWx0ZXJzW25hbWVdKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZmlsdGVyIG5vdCBmb3VuZDogJyArIG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgcmVzb2x2ZVRlbXBsYXRlOiBmdW5jdGlvbihsb2FkZXIsIHBhcmVudE5hbWUsIGZpbGVuYW1lKSB7XG5cdCAgICAgICAgdmFyIGlzUmVsYXRpdmUgPSAobG9hZGVyLmlzUmVsYXRpdmUgJiYgcGFyZW50TmFtZSk/IGxvYWRlci5pc1JlbGF0aXZlKGZpbGVuYW1lKSA6IGZhbHNlO1xuXHQgICAgICAgIHJldHVybiAoaXNSZWxhdGl2ZSAmJiBsb2FkZXIucmVzb2x2ZSk/IGxvYWRlci5yZXNvbHZlKHBhcmVudE5hbWUsIGZpbGVuYW1lKSA6IGZpbGVuYW1lO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0VGVtcGxhdGU6IGZ1bmN0aW9uKG5hbWUsIGVhZ2VyQ29tcGlsZSwgcGFyZW50TmFtZSwgaWdub3JlTWlzc2luZywgY2IpIHtcblx0ICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cdCAgICAgICAgdmFyIHRtcGwgPSBudWxsO1xuXHQgICAgICAgIGlmKG5hbWUgJiYgbmFtZS5yYXcpIHtcblx0ICAgICAgICAgICAgLy8gdGhpcyBmaXhlcyBhdXRvZXNjYXBlIGZvciB0ZW1wbGF0ZXMgcmVmZXJlbmNlZCBpbiBzeW1ib2xzXG5cdCAgICAgICAgICAgIG5hbWUgPSBuYW1lLnJhdztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihwYXJlbnROYW1lKSkge1xuXHQgICAgICAgICAgICBjYiA9IHBhcmVudE5hbWU7XG5cdCAgICAgICAgICAgIHBhcmVudE5hbWUgPSBudWxsO1xuXHQgICAgICAgICAgICBlYWdlckNvbXBpbGUgPSBlYWdlckNvbXBpbGUgfHwgZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYobGliLmlzRnVuY3Rpb24oZWFnZXJDb21waWxlKSkge1xuXHQgICAgICAgICAgICBjYiA9IGVhZ2VyQ29tcGlsZTtcblx0ICAgICAgICAgICAgZWFnZXJDb21waWxlID0gZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKG5hbWUgaW5zdGFuY2VvZiBUZW1wbGF0ZSkge1xuXHQgICAgICAgICAgICAgdG1wbCA9IG5hbWU7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGVtcGxhdGUgbmFtZXMgbXVzdCBiZSBhIHN0cmluZzogJyArIG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxvYWRlcnMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHZhciBfbmFtZSA9IHRoaXMucmVzb2x2ZVRlbXBsYXRlKHRoaXMubG9hZGVyc1tpXSwgcGFyZW50TmFtZSwgbmFtZSk7XG5cdCAgICAgICAgICAgICAgICB0bXBsID0gdGhpcy5sb2FkZXJzW2ldLmNhY2hlW19uYW1lXTtcblx0ICAgICAgICAgICAgICAgIGlmICh0bXBsKSBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKHRtcGwpIHtcblx0ICAgICAgICAgICAgaWYoZWFnZXJDb21waWxlKSB7XG5cdCAgICAgICAgICAgICAgICB0bXBsLmNvbXBpbGUoKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmKGNiKSB7XG5cdCAgICAgICAgICAgICAgICBjYihudWxsLCB0bXBsKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0bXBsO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHN5bmNSZXN1bHQ7XG5cdCAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cblx0ICAgICAgICAgICAgdmFyIGNyZWF0ZVRlbXBsYXRlID0gZnVuY3Rpb24oZXJyLCBpbmZvKSB7XG5cdCAgICAgICAgICAgICAgICBpZighaW5mbyAmJiAhZXJyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoIWlnbm9yZU1pc3NpbmcpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZXJyID0gbmV3IEVycm9yKCd0ZW1wbGF0ZSBub3QgZm91bmQ6ICcgKyBuYW1lKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZihjYikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYihlcnIpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciB0bXBsO1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGluZm8pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdG1wbCA9IG5ldyBUZW1wbGF0ZShpbmZvLnNyYywgX3RoaXMsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wYXRoLCBlYWdlckNvbXBpbGUpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmKCFpbmZvLm5vQ2FjaGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubG9hZGVyLmNhY2hlW25hbWVdID0gdG1wbDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdG1wbCA9IG5ldyBUZW1wbGF0ZSgnJywgX3RoaXMsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJycsIGVhZ2VyQ29tcGlsZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYoY2IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2IobnVsbCwgdG1wbCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gdG1wbDtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgbGliLmFzeW5jSXRlcih0aGlzLmxvYWRlcnMsIGZ1bmN0aW9uKGxvYWRlciwgaSwgbmV4dCwgZG9uZSkge1xuXHQgICAgICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlKGVyciwgc3JjKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoZXJyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUoZXJyKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSBpZihzcmMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3JjLmxvYWRlciA9IGxvYWRlcjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShudWxsLCBzcmMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLy8gUmVzb2x2ZSBuYW1lIHJlbGF0aXZlIHRvIHBhcmVudE5hbWVcblx0ICAgICAgICAgICAgICAgIG5hbWUgPSB0aGF0LnJlc29sdmVUZW1wbGF0ZShsb2FkZXIsIHBhcmVudE5hbWUsIG5hbWUpO1xuXG5cdCAgICAgICAgICAgICAgICBpZihsb2FkZXIuYXN5bmMpIHtcblx0ICAgICAgICAgICAgICAgICAgICBsb2FkZXIuZ2V0U291cmNlKG5hbWUsIGhhbmRsZSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBoYW5kbGUobnVsbCwgbG9hZGVyLmdldFNvdXJjZShuYW1lKSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0sIGNyZWF0ZVRlbXBsYXRlKTtcblxuXHQgICAgICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBleHByZXNzOiBmdW5jdGlvbihhcHApIHtcblx0ICAgICAgICB2YXIgZW52ID0gdGhpcztcblxuXHQgICAgICAgIGZ1bmN0aW9uIE51bmp1Y2tzVmlldyhuYW1lLCBvcHRzKSB7XG5cdCAgICAgICAgICAgIHRoaXMubmFtZSAgICAgICAgICA9IG5hbWU7XG5cdCAgICAgICAgICAgIHRoaXMucGF0aCAgICAgICAgICA9IG5hbWU7XG5cdCAgICAgICAgICAgIHRoaXMuZGVmYXVsdEVuZ2luZSA9IG9wdHMuZGVmYXVsdEVuZ2luZTtcblx0ICAgICAgICAgICAgdGhpcy5leHQgICAgICAgICAgID0gcGF0aC5leHRuYW1lKG5hbWUpO1xuXHQgICAgICAgICAgICBpZiAoIXRoaXMuZXh0ICYmICF0aGlzLmRlZmF1bHRFbmdpbmUpIHRocm93IG5ldyBFcnJvcignTm8gZGVmYXVsdCBlbmdpbmUgd2FzIHNwZWNpZmllZCBhbmQgbm8gZXh0ZW5zaW9uIHdhcyBwcm92aWRlZC4nKTtcblx0ICAgICAgICAgICAgaWYgKCF0aGlzLmV4dCkgdGhpcy5uYW1lICs9ICh0aGlzLmV4dCA9ICgnLicgIT09IHRoaXMuZGVmYXVsdEVuZ2luZVswXSA/ICcuJyA6ICcnKSArIHRoaXMuZGVmYXVsdEVuZ2luZSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgTnVuanVja3NWaWV3LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihvcHRzLCBjYikge1xuXHQgICAgICAgICAgZW52LnJlbmRlcih0aGlzLm5hbWUsIG9wdHMsIGNiKTtcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgYXBwLnNldCgndmlldycsIE51bmp1Y2tzVmlldyk7XG5cdCAgICAgICAgYXBwLnNldCgnbnVuanVja3NFbnYnLCB0aGlzKTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIHJlbmRlcjogZnVuY3Rpb24obmFtZSwgY3R4LCBjYikge1xuXHQgICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKGN0eCkpIHtcblx0ICAgICAgICAgICAgY2IgPSBjdHg7XG5cdCAgICAgICAgICAgIGN0eCA9IG51bGw7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gV2Ugc3VwcG9ydCBhIHN5bmNocm9ub3VzIEFQSSB0byBtYWtlIGl0IGVhc2llciB0byBtaWdyYXRlXG5cdCAgICAgICAgLy8gZXhpc3RpbmcgY29kZSB0byBhc3luYy4gVGhpcyB3b3JrcyBiZWNhdXNlIGlmIHlvdSBkb24ndCBkb1xuXHQgICAgICAgIC8vIGFueXRoaW5nIGFzeW5jIHdvcmssIHRoZSB3aG9sZSB0aGluZyBpcyBhY3R1YWxseSBydW5cblx0ICAgICAgICAvLyBzeW5jaHJvbm91c2x5LlxuXHQgICAgICAgIHZhciBzeW5jUmVzdWx0ID0gbnVsbDtcblxuXHQgICAgICAgIHRoaXMuZ2V0VGVtcGxhdGUobmFtZSwgZnVuY3Rpb24oZXJyLCB0bXBsKSB7XG5cdCAgICAgICAgICAgIGlmKGVyciAmJiBjYikge1xuXHQgICAgICAgICAgICAgICAgY2FsbGJhY2tBc2FwKGNiLCBlcnIpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYoZXJyKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gdG1wbC5yZW5kZXIoY3R4LCBjYik7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiBzeW5jUmVzdWx0O1xuXHQgICAgfSxcblxuXHQgICAgcmVuZGVyU3RyaW5nOiBmdW5jdGlvbihzcmMsIGN0eCwgb3B0cywgY2IpIHtcblx0ICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihvcHRzKSkge1xuXHQgICAgICAgICAgICBjYiA9IG9wdHM7XG5cdCAgICAgICAgICAgIG9wdHMgPSB7fTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cblx0ICAgICAgICB2YXIgdG1wbCA9IG5ldyBUZW1wbGF0ZShzcmMsIHRoaXMsIG9wdHMucGF0aCk7XG5cdCAgICAgICAgcmV0dXJuIHRtcGwucmVuZGVyKGN0eCwgY2IpO1xuXHQgICAgfSxcblxuXHQgICAgd2F0ZXJmYWxsOiB3YXRlcmZhbGxcblx0fSk7XG5cblx0dmFyIENvbnRleHQgPSBPYmouZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uKGN0eCwgYmxvY2tzLCBlbnYpIHtcblx0ICAgICAgICAvLyBIYXMgdG8gYmUgdGllZCB0byBhbiBlbnZpcm9ubWVudCBzbyB3ZSBjYW4gdGFwIGludG8gaXRzIGdsb2JhbHMuXG5cdCAgICAgICAgdGhpcy5lbnYgPSBlbnYgfHwgbmV3IEVudmlyb25tZW50KCk7XG5cblx0ICAgICAgICAvLyBNYWtlIGEgZHVwbGljYXRlIG9mIGN0eFxuXHQgICAgICAgIHRoaXMuY3R4ID0ge307XG5cdCAgICAgICAgZm9yKHZhciBrIGluIGN0eCkge1xuXHQgICAgICAgICAgICBpZihjdHguaGFzT3duUHJvcGVydHkoaykpIHtcblx0ICAgICAgICAgICAgICAgIHRoaXMuY3R4W2tdID0gY3R4W2tdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5ibG9ja3MgPSB7fTtcblx0ICAgICAgICB0aGlzLmV4cG9ydGVkID0gW107XG5cblx0ICAgICAgICBmb3IodmFyIG5hbWUgaW4gYmxvY2tzKSB7XG5cdCAgICAgICAgICAgIHRoaXMuYWRkQmxvY2sobmFtZSwgYmxvY2tzW25hbWVdKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBsb29rdXA6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICAvLyBUaGlzIGlzIG9uZSBvZiB0aGUgbW9zdCBjYWxsZWQgZnVuY3Rpb25zLCBzbyBvcHRpbWl6ZSBmb3Jcblx0ICAgICAgICAvLyB0aGUgdHlwaWNhbCBjYXNlIHdoZXJlIHRoZSBuYW1lIGlzbid0IGluIHRoZSBnbG9iYWxzXG5cdCAgICAgICAgaWYobmFtZSBpbiB0aGlzLmVudi5nbG9iYWxzICYmICEobmFtZSBpbiB0aGlzLmN0eCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW52Lmdsb2JhbHNbbmFtZV07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5jdHhbbmFtZV07XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgc2V0VmFyaWFibGU6IGZ1bmN0aW9uKG5hbWUsIHZhbCkge1xuXHQgICAgICAgIHRoaXMuY3R4W25hbWVdID0gdmFsO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0VmFyaWFibGVzOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5jdHg7XG5cdCAgICB9LFxuXG5cdCAgICBhZGRCbG9jazogZnVuY3Rpb24obmFtZSwgYmxvY2spIHtcblx0ICAgICAgICB0aGlzLmJsb2Nrc1tuYW1lXSA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdO1xuXHQgICAgICAgIHRoaXMuYmxvY2tzW25hbWVdLnB1c2goYmxvY2spO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0QmxvY2s6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZighdGhpcy5ibG9ja3NbbmFtZV0pIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIGJsb2NrIFwiJyArIG5hbWUgKyAnXCInKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gdGhpcy5ibG9ja3NbbmFtZV1bMF07XG5cdCAgICB9LFxuXG5cdCAgICBnZXRTdXBlcjogZnVuY3Rpb24oZW52LCBuYW1lLCBibG9jaywgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG5cdCAgICAgICAgdmFyIGlkeCA9IGxpYi5pbmRleE9mKHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdLCBibG9jayk7XG5cdCAgICAgICAgdmFyIGJsayA9IHRoaXMuYmxvY2tzW25hbWVdW2lkeCArIDFdO1xuXHQgICAgICAgIHZhciBjb250ZXh0ID0gdGhpcztcblxuXHQgICAgICAgIGlmKGlkeCA9PT0gLTEgfHwgIWJsaykge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHN1cGVyIGJsb2NrIGF2YWlsYWJsZSBmb3IgXCInICsgbmFtZSArICdcIicpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGJsayhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG5cdCAgICB9LFxuXG5cdCAgICBhZGRFeHBvcnQ6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICB0aGlzLmV4cG9ydGVkLnB1c2gobmFtZSk7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRFeHBvcnRlZDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIGV4cG9ydGVkID0ge307XG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5leHBvcnRlZC5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICB2YXIgbmFtZSA9IHRoaXMuZXhwb3J0ZWRbaV07XG5cdCAgICAgICAgICAgIGV4cG9ydGVkW25hbWVdID0gdGhpcy5jdHhbbmFtZV07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBleHBvcnRlZDtcblx0ICAgIH1cblx0fSk7XG5cblx0VGVtcGxhdGUgPSBPYmouZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uIChzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKSB7XG5cdCAgICAgICAgdGhpcy5lbnYgPSBlbnYgfHwgbmV3IEVudmlyb25tZW50KCk7XG5cblx0ICAgICAgICBpZihsaWIuaXNPYmplY3Qoc3JjKSkge1xuXHQgICAgICAgICAgICBzd2l0Y2goc3JjLnR5cGUpIHtcblx0ICAgICAgICAgICAgY2FzZSAnY29kZSc6IHRoaXMudG1wbFByb3BzID0gc3JjLm9iajsgYnJlYWs7XG5cdCAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6IHRoaXMudG1wbFN0ciA9IHNyYy5vYmo7IGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYobGliLmlzU3RyaW5nKHNyYykpIHtcblx0ICAgICAgICAgICAgdGhpcy50bXBsU3RyID0gc3JjO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzcmMgbXVzdCBiZSBhIHN0cmluZyBvciBhbiBvYmplY3QgZGVzY3JpYmluZyAnICtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0aGUgc291cmNlJyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5wYXRoID0gcGF0aDtcblxuXHQgICAgICAgIGlmKGVhZ2VyQ29tcGlsZSkge1xuXHQgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXHQgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgX3RoaXMuX2NvbXBpbGUoKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBjYXRjaChlcnIpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IGxpYi5wcmV0dGlmeUVycm9yKHRoaXMucGF0aCwgdGhpcy5lbnYub3B0cy5kZXYsIGVycik7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHRoaXMuY29tcGlsZWQgPSBmYWxzZTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCwgcGFyZW50RnJhbWUsIGNiKSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBjdHggPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBjdHg7XG5cdCAgICAgICAgICAgIGN0eCA9IHt9O1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmICh0eXBlb2YgcGFyZW50RnJhbWUgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBwYXJlbnRGcmFtZTtcblx0ICAgICAgICAgICAgcGFyZW50RnJhbWUgPSBudWxsO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBmb3JjZUFzeW5jID0gdHJ1ZTtcblx0ICAgICAgICBpZihwYXJlbnRGcmFtZSkge1xuXHQgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIGZyYW1lLCB3ZSBhcmUgYmVpbmcgY2FsbGVkIGZyb20gaW50ZXJuYWxcblx0ICAgICAgICAgICAgLy8gY29kZSBvZiBhbm90aGVyIHRlbXBsYXRlLCBhbmQgdGhlIGludGVybmFsIHN5c3RlbVxuXHQgICAgICAgICAgICAvLyBkZXBlbmRzIG9uIHRoZSBzeW5jL2FzeW5jIG5hdHVyZSBvZiB0aGUgcGFyZW50IHRlbXBsYXRlXG5cdCAgICAgICAgICAgIC8vIHRvIGJlIGluaGVyaXRlZCwgc28gZm9yY2UgYW4gYXN5bmMgY2FsbGJhY2tcblx0ICAgICAgICAgICAgZm9yY2VBc3luYyA9IGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cdCAgICAgICAgLy8gQ2F0Y2ggY29tcGlsZSBlcnJvcnMgZm9yIGFzeW5jIHJlbmRlcmluZ1xuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIF90aGlzLmNvbXBpbGUoKTtcblx0ICAgICAgICB9IGNhdGNoIChfZXJyKSB7XG5cdCAgICAgICAgICAgIHZhciBlcnIgPSBsaWIucHJldHRpZnlFcnJvcih0aGlzLnBhdGgsIHRoaXMuZW52Lm9wdHMuZGV2LCBfZXJyKTtcblx0ICAgICAgICAgICAgaWYgKGNiKSByZXR1cm4gY2FsbGJhY2tBc2FwKGNiLCBlcnIpO1xuXHQgICAgICAgICAgICBlbHNlIHRocm93IGVycjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KGN0eCB8fCB7fSwgX3RoaXMuYmxvY2tzLCBfdGhpcy5lbnYpO1xuXHQgICAgICAgIHZhciBmcmFtZSA9IHBhcmVudEZyYW1lID8gcGFyZW50RnJhbWUucHVzaCh0cnVlKSA6IG5ldyBGcmFtZSgpO1xuXHQgICAgICAgIGZyYW1lLnRvcExldmVsID0gdHJ1ZTtcblx0ICAgICAgICB2YXIgc3luY1Jlc3VsdCA9IG51bGw7XG5cblx0ICAgICAgICBfdGhpcy5yb290UmVuZGVyRnVuYyhcblx0ICAgICAgICAgICAgX3RoaXMuZW52LFxuXHQgICAgICAgICAgICBjb250ZXh0LFxuXHQgICAgICAgICAgICBmcmFtZSB8fCBuZXcgRnJhbWUoKSxcblx0ICAgICAgICAgICAgcnVudGltZSxcblx0ICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXMpIHtcblx0ICAgICAgICAgICAgICAgIGlmKGVycikge1xuXHQgICAgICAgICAgICAgICAgICAgIGVyciA9IGxpYi5wcmV0dGlmeUVycm9yKF90aGlzLnBhdGgsIF90aGlzLmVudi5vcHRzLmRldiwgZXJyKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgaWYoY2IpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZihmb3JjZUFzeW5jKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrQXNhcChjYiwgZXJyLCByZXMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2IoZXJyLCByZXMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGVycikgeyB0aHJvdyBlcnI7IH1cblx0ICAgICAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gcmVzO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgKTtcblxuXHQgICAgICAgIHJldHVybiBzeW5jUmVzdWx0O1xuXHQgICAgfSxcblxuXG5cdCAgICBnZXRFeHBvcnRlZDogZnVuY3Rpb24oY3R4LCBwYXJlbnRGcmFtZSwgY2IpIHtcblx0ICAgICAgICBpZiAodHlwZW9mIGN0eCA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICBjYiA9IGN0eDtcblx0ICAgICAgICAgICAgY3R4ID0ge307XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHR5cGVvZiBwYXJlbnRGcmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICBjYiA9IHBhcmVudEZyYW1lO1xuXHQgICAgICAgICAgICBwYXJlbnRGcmFtZSA9IG51bGw7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gQ2F0Y2ggY29tcGlsZSBlcnJvcnMgZm9yIGFzeW5jIHJlbmRlcmluZ1xuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIHRoaXMuY29tcGlsZSgpO1xuXHQgICAgICAgIH0gY2F0Y2ggKGUpIHtcblx0ICAgICAgICAgICAgaWYgKGNiKSByZXR1cm4gY2IoZSk7XG5cdCAgICAgICAgICAgIGVsc2UgdGhyb3cgZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgZnJhbWUgPSBwYXJlbnRGcmFtZSA/IHBhcmVudEZyYW1lLnB1c2goKSA6IG5ldyBGcmFtZSgpO1xuXHQgICAgICAgIGZyYW1lLnRvcExldmVsID0gdHJ1ZTtcblxuXHQgICAgICAgIC8vIFJ1biB0aGUgcm9vdFJlbmRlckZ1bmMgdG8gcG9wdWxhdGUgdGhlIGNvbnRleHQgd2l0aCBleHBvcnRlZCB2YXJzXG5cdCAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dChjdHggfHwge30sIHRoaXMuYmxvY2tzLCB0aGlzLmVudik7XG5cdCAgICAgICAgdGhpcy5yb290UmVuZGVyRnVuYyh0aGlzLmVudixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihlcnIpIHtcblx0ICAgICAgICBcdFx0ICAgICAgICBpZiAoIGVyciApIHtcblx0ICAgICAgICBcdFx0XHQgICAgY2IoZXJyLCBudWxsKTtcblx0ICAgICAgICBcdFx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIFx0XHRcdCAgICBjYihudWxsLCBjb250ZXh0LmdldEV4cG9ydGVkKCkpO1xuXHQgICAgICAgIFx0XHQgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgfSxcblxuXHQgICAgY29tcGlsZTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYoIXRoaXMuY29tcGlsZWQpIHtcblx0ICAgICAgICAgICAgdGhpcy5fY29tcGlsZSgpO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIF9jb21waWxlOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgcHJvcHM7XG5cblx0ICAgICAgICBpZih0aGlzLnRtcGxQcm9wcykge1xuXHQgICAgICAgICAgICBwcm9wcyA9IHRoaXMudG1wbFByb3BzO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGNvbXBpbGVyLmNvbXBpbGUodGhpcy50bXBsU3RyLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5hc3luY0ZpbHRlcnMsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52LmV4dGVuc2lvbnNMaXN0LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhdGgsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52Lm9wdHMpO1xuXG5cdCAgICAgICAgICAgIC8qIGpzbGludCBldmlsOiB0cnVlICovXG5cdCAgICAgICAgICAgIHZhciBmdW5jID0gbmV3IEZ1bmN0aW9uKHNvdXJjZSk7XG5cdCAgICAgICAgICAgIHByb3BzID0gZnVuYygpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMuYmxvY2tzID0gdGhpcy5fZ2V0QmxvY2tzKHByb3BzKTtcblx0ICAgICAgICB0aGlzLnJvb3RSZW5kZXJGdW5jID0gcHJvcHMucm9vdDtcblx0ICAgICAgICB0aGlzLmNvbXBpbGVkID0gdHJ1ZTtcblx0ICAgIH0sXG5cblx0ICAgIF9nZXRCbG9ja3M6IGZ1bmN0aW9uKHByb3BzKSB7XG5cdCAgICAgICAgdmFyIGJsb2NrcyA9IHt9O1xuXG5cdCAgICAgICAgZm9yKHZhciBrIGluIHByb3BzKSB7XG5cdCAgICAgICAgICAgIGlmKGsuc2xpY2UoMCwgMikgPT09ICdiXycpIHtcblx0ICAgICAgICAgICAgICAgIGJsb2Nrc1trLnNsaWNlKDIpXSA9IHByb3BzW2tdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGJsb2Nrcztcblx0ICAgIH1cblx0fSk7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSB7XG5cdCAgICBFbnZpcm9ubWVudDogRW52aXJvbm1lbnQsXG5cdCAgICBUZW1wbGF0ZTogVGVtcGxhdGVcblx0fTtcblxuXG4vKioqLyB9KSxcbi8qIDMgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHRcblxuLyoqKi8gfSksXG4vKiA0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly8gcmF3QXNhcCBwcm92aWRlcyBldmVyeXRoaW5nIHdlIG5lZWQgZXhjZXB0IGV4Y2VwdGlvbiBtYW5hZ2VtZW50LlxuXHR2YXIgcmF3QXNhcCA9IF9fd2VicGFja19yZXF1aXJlX18oNSk7XG5cdC8vIFJhd1Rhc2tzIGFyZSByZWN5Y2xlZCB0byByZWR1Y2UgR0MgY2h1cm4uXG5cdHZhciBmcmVlVGFza3MgPSBbXTtcblx0Ly8gV2UgcXVldWUgZXJyb3JzIHRvIGVuc3VyZSB0aGV5IGFyZSB0aHJvd24gaW4gcmlnaHQgb3JkZXIgKEZJRk8pLlxuXHQvLyBBcnJheS1hcy1xdWV1ZSBpcyBnb29kIGVub3VnaCBoZXJlLCBzaW5jZSB3ZSBhcmUganVzdCBkZWFsaW5nIHdpdGggZXhjZXB0aW9ucy5cblx0dmFyIHBlbmRpbmdFcnJvcnMgPSBbXTtcblx0dmFyIHJlcXVlc3RFcnJvclRocm93ID0gcmF3QXNhcC5tYWtlUmVxdWVzdENhbGxGcm9tVGltZXIodGhyb3dGaXJzdEVycm9yKTtcblxuXHRmdW5jdGlvbiB0aHJvd0ZpcnN0RXJyb3IoKSB7XG5cdCAgICBpZiAocGVuZGluZ0Vycm9ycy5sZW5ndGgpIHtcblx0ICAgICAgICB0aHJvdyBwZW5kaW5nRXJyb3JzLnNoaWZ0KCk7XG5cdCAgICB9XG5cdH1cblxuXHQvKipcblx0ICogQ2FsbHMgYSB0YXNrIGFzIHNvb24gYXMgcG9zc2libGUgYWZ0ZXIgcmV0dXJuaW5nLCBpbiBpdHMgb3duIGV2ZW50LCB3aXRoIHByaW9yaXR5XG5cdCAqIG92ZXIgb3RoZXIgZXZlbnRzIGxpa2UgYW5pbWF0aW9uLCByZWZsb3csIGFuZCByZXBhaW50LiBBbiBlcnJvciB0aHJvd24gZnJvbSBhblxuXHQgKiBldmVudCB3aWxsIG5vdCBpbnRlcnJ1cHQsIG5vciBldmVuIHN1YnN0YW50aWFsbHkgc2xvdyBkb3duIHRoZSBwcm9jZXNzaW5nIG9mXG5cdCAqIG90aGVyIGV2ZW50cywgYnV0IHdpbGwgYmUgcmF0aGVyIHBvc3Rwb25lZCB0byBhIGxvd2VyIHByaW9yaXR5IGV2ZW50LlxuXHQgKiBAcGFyYW0ge3tjYWxsfX0gdGFzayBBIGNhbGxhYmxlIG9iamVjdCwgdHlwaWNhbGx5IGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBub1xuXHQgKiBhcmd1bWVudHMuXG5cdCAqL1xuXHRtb2R1bGUuZXhwb3J0cyA9IGFzYXA7XG5cdGZ1bmN0aW9uIGFzYXAodGFzaykge1xuXHQgICAgdmFyIHJhd1Rhc2s7XG5cdCAgICBpZiAoZnJlZVRhc2tzLmxlbmd0aCkge1xuXHQgICAgICAgIHJhd1Rhc2sgPSBmcmVlVGFza3MucG9wKCk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIHJhd1Rhc2sgPSBuZXcgUmF3VGFzaygpO1xuXHQgICAgfVxuXHQgICAgcmF3VGFzay50YXNrID0gdGFzaztcblx0ICAgIHJhd0FzYXAocmF3VGFzayk7XG5cdH1cblxuXHQvLyBXZSB3cmFwIHRhc2tzIHdpdGggcmVjeWNsYWJsZSB0YXNrIG9iamVjdHMuICBBIHRhc2sgb2JqZWN0IGltcGxlbWVudHNcblx0Ly8gYGNhbGxgLCBqdXN0IGxpa2UgYSBmdW5jdGlvbi5cblx0ZnVuY3Rpb24gUmF3VGFzaygpIHtcblx0ICAgIHRoaXMudGFzayA9IG51bGw7XG5cdH1cblxuXHQvLyBUaGUgc29sZSBwdXJwb3NlIG9mIHdyYXBwaW5nIHRoZSB0YXNrIGlzIHRvIGNhdGNoIHRoZSBleGNlcHRpb24gYW5kIHJlY3ljbGVcblx0Ly8gdGhlIHRhc2sgb2JqZWN0IGFmdGVyIGl0cyBzaW5nbGUgdXNlLlxuXHRSYXdUYXNrLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdHJ5IHtcblx0ICAgICAgICB0aGlzLnRhc2suY2FsbCgpO1xuXHQgICAgfSBjYXRjaCAoZXJyb3IpIHtcblx0ICAgICAgICBpZiAoYXNhcC5vbmVycm9yKSB7XG5cdCAgICAgICAgICAgIC8vIFRoaXMgaG9vayBleGlzdHMgcHVyZWx5IGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuXHQgICAgICAgICAgICAvLyBJdHMgbmFtZSB3aWxsIGJlIHBlcmlvZGljYWxseSByYW5kb21pemVkIHRvIGJyZWFrIGFueSBjb2RlIHRoYXRcblx0ICAgICAgICAgICAgLy8gZGVwZW5kcyBvbiBpdHMgZXhpc3RlbmNlLlxuXHQgICAgICAgICAgICBhc2FwLm9uZXJyb3IoZXJyb3IpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIC8vIEluIGEgd2ViIGJyb3dzZXIsIGV4Y2VwdGlvbnMgYXJlIG5vdCBmYXRhbC4gSG93ZXZlciwgdG8gYXZvaWRcblx0ICAgICAgICAgICAgLy8gc2xvd2luZyBkb3duIHRoZSBxdWV1ZSBvZiBwZW5kaW5nIHRhc2tzLCB3ZSByZXRocm93IHRoZSBlcnJvciBpbiBhXG5cdCAgICAgICAgICAgIC8vIGxvd2VyIHByaW9yaXR5IHR1cm4uXG5cdCAgICAgICAgICAgIHBlbmRpbmdFcnJvcnMucHVzaChlcnJvcik7XG5cdCAgICAgICAgICAgIHJlcXVlc3RFcnJvclRocm93KCk7XG5cdCAgICAgICAgfVxuXHQgICAgfSBmaW5hbGx5IHtcblx0ICAgICAgICB0aGlzLnRhc2sgPSBudWxsO1xuXHQgICAgICAgIGZyZWVUYXNrc1tmcmVlVGFza3MubGVuZ3RoXSA9IHRoaXM7XG5cdCAgICB9XG5cdH07XG5cblxuLyoqKi8gfSksXG4vKiA1ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovKGZ1bmN0aW9uKGdsb2JhbCkge1widXNlIHN0cmljdFwiO1xuXG5cdC8vIFVzZSB0aGUgZmFzdGVzdCBtZWFucyBwb3NzaWJsZSB0byBleGVjdXRlIGEgdGFzayBpbiBpdHMgb3duIHR1cm4sIHdpdGhcblx0Ly8gcHJpb3JpdHkgb3ZlciBvdGhlciBldmVudHMgaW5jbHVkaW5nIElPLCBhbmltYXRpb24sIHJlZmxvdywgYW5kIHJlZHJhd1xuXHQvLyBldmVudHMgaW4gYnJvd3NlcnMuXG5cdC8vXG5cdC8vIEFuIGV4Y2VwdGlvbiB0aHJvd24gYnkgYSB0YXNrIHdpbGwgcGVybWFuZW50bHkgaW50ZXJydXB0IHRoZSBwcm9jZXNzaW5nIG9mXG5cdC8vIHN1YnNlcXVlbnQgdGFza3MuIFRoZSBoaWdoZXIgbGV2ZWwgYGFzYXBgIGZ1bmN0aW9uIGVuc3VyZXMgdGhhdCBpZiBhblxuXHQvLyBleGNlcHRpb24gaXMgdGhyb3duIGJ5IGEgdGFzaywgdGhhdCB0aGUgdGFzayBxdWV1ZSB3aWxsIGNvbnRpbnVlIGZsdXNoaW5nIGFzXG5cdC8vIHNvb24gYXMgcG9zc2libGUsIGJ1dCBpZiB5b3UgdXNlIGByYXdBc2FwYCBkaXJlY3RseSwgeW91IGFyZSByZXNwb25zaWJsZSB0b1xuXHQvLyBlaXRoZXIgZW5zdXJlIHRoYXQgbm8gZXhjZXB0aW9ucyBhcmUgdGhyb3duIGZyb20geW91ciB0YXNrLCBvciB0byBtYW51YWxseVxuXHQvLyBjYWxsIGByYXdBc2FwLnJlcXVlc3RGbHVzaGAgaWYgYW4gZXhjZXB0aW9uIGlzIHRocm93bi5cblx0bW9kdWxlLmV4cG9ydHMgPSByYXdBc2FwO1xuXHRmdW5jdGlvbiByYXdBc2FwKHRhc2spIHtcblx0ICAgIGlmICghcXVldWUubGVuZ3RoKSB7XG5cdCAgICAgICAgcmVxdWVzdEZsdXNoKCk7XG5cdCAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuXHQgICAgfVxuXHQgICAgLy8gRXF1aXZhbGVudCB0byBwdXNoLCBidXQgYXZvaWRzIGEgZnVuY3Rpb24gY2FsbC5cblx0ICAgIHF1ZXVlW3F1ZXVlLmxlbmd0aF0gPSB0YXNrO1xuXHR9XG5cblx0dmFyIHF1ZXVlID0gW107XG5cdC8vIE9uY2UgYSBmbHVzaCBoYXMgYmVlbiByZXF1ZXN0ZWQsIG5vIGZ1cnRoZXIgY2FsbHMgdG8gYHJlcXVlc3RGbHVzaGAgYXJlXG5cdC8vIG5lY2Vzc2FyeSB1bnRpbCB0aGUgbmV4dCBgZmx1c2hgIGNvbXBsZXRlcy5cblx0dmFyIGZsdXNoaW5nID0gZmFsc2U7XG5cdC8vIGByZXF1ZXN0Rmx1c2hgIGlzIGFuIGltcGxlbWVudGF0aW9uLXNwZWNpZmljIG1ldGhvZCB0aGF0IGF0dGVtcHRzIHRvIGtpY2tcblx0Ly8gb2ZmIGEgYGZsdXNoYCBldmVudCBhcyBxdWlja2x5IGFzIHBvc3NpYmxlLiBgZmx1c2hgIHdpbGwgYXR0ZW1wdCB0byBleGhhdXN0XG5cdC8vIHRoZSBldmVudCBxdWV1ZSBiZWZvcmUgeWllbGRpbmcgdG8gdGhlIGJyb3dzZXIncyBvd24gZXZlbnQgbG9vcC5cblx0dmFyIHJlcXVlc3RGbHVzaDtcblx0Ly8gVGhlIHBvc2l0aW9uIG9mIHRoZSBuZXh0IHRhc2sgdG8gZXhlY3V0ZSBpbiB0aGUgdGFzayBxdWV1ZS4gVGhpcyBpc1xuXHQvLyBwcmVzZXJ2ZWQgYmV0d2VlbiBjYWxscyB0byBgZmx1c2hgIHNvIHRoYXQgaXQgY2FuIGJlIHJlc3VtZWQgaWZcblx0Ly8gYSB0YXNrIHRocm93cyBhbiBleGNlcHRpb24uXG5cdHZhciBpbmRleCA9IDA7XG5cdC8vIElmIGEgdGFzayBzY2hlZHVsZXMgYWRkaXRpb25hbCB0YXNrcyByZWN1cnNpdmVseSwgdGhlIHRhc2sgcXVldWUgY2FuIGdyb3dcblx0Ly8gdW5ib3VuZGVkLiBUbyBwcmV2ZW50IG1lbW9yeSBleGhhdXN0aW9uLCB0aGUgdGFzayBxdWV1ZSB3aWxsIHBlcmlvZGljYWxseVxuXHQvLyB0cnVuY2F0ZSBhbHJlYWR5LWNvbXBsZXRlZCB0YXNrcy5cblx0dmFyIGNhcGFjaXR5ID0gMTAyNDtcblxuXHQvLyBUaGUgZmx1c2ggZnVuY3Rpb24gcHJvY2Vzc2VzIGFsbCB0YXNrcyB0aGF0IGhhdmUgYmVlbiBzY2hlZHVsZWQgd2l0aFxuXHQvLyBgcmF3QXNhcGAgdW5sZXNzIGFuZCB1bnRpbCBvbmUgb2YgdGhvc2UgdGFza3MgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cblx0Ly8gSWYgYSB0YXNrIHRocm93cyBhbiBleGNlcHRpb24sIGBmbHVzaGAgZW5zdXJlcyB0aGF0IGl0cyBzdGF0ZSB3aWxsIHJlbWFpblxuXHQvLyBjb25zaXN0ZW50IGFuZCB3aWxsIHJlc3VtZSB3aGVyZSBpdCBsZWZ0IG9mZiB3aGVuIGNhbGxlZCBhZ2Fpbi5cblx0Ly8gSG93ZXZlciwgYGZsdXNoYCBkb2VzIG5vdCBtYWtlIGFueSBhcnJhbmdlbWVudHMgdG8gYmUgY2FsbGVkIGFnYWluIGlmIGFuXG5cdC8vIGV4Y2VwdGlvbiBpcyB0aHJvd24uXG5cdGZ1bmN0aW9uIGZsdXNoKCkge1xuXHQgICAgd2hpbGUgKGluZGV4IDwgcXVldWUubGVuZ3RoKSB7XG5cdCAgICAgICAgdmFyIGN1cnJlbnRJbmRleCA9IGluZGV4O1xuXHQgICAgICAgIC8vIEFkdmFuY2UgdGhlIGluZGV4IGJlZm9yZSBjYWxsaW5nIHRoZSB0YXNrLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSB3aWxsXG5cdCAgICAgICAgLy8gYmVnaW4gZmx1c2hpbmcgb24gdGhlIG5leHQgdGFzayB0aGUgdGFzayB0aHJvd3MgYW4gZXJyb3IuXG5cdCAgICAgICAgaW5kZXggPSBpbmRleCArIDE7XG5cdCAgICAgICAgcXVldWVbY3VycmVudEluZGV4XS5jYWxsKCk7XG5cdCAgICAgICAgLy8gUHJldmVudCBsZWFraW5nIG1lbW9yeSBmb3IgbG9uZyBjaGFpbnMgb2YgcmVjdXJzaXZlIGNhbGxzIHRvIGBhc2FwYC5cblx0ICAgICAgICAvLyBJZiB3ZSBjYWxsIGBhc2FwYCB3aXRoaW4gdGFza3Mgc2NoZWR1bGVkIGJ5IGBhc2FwYCwgdGhlIHF1ZXVlIHdpbGxcblx0ICAgICAgICAvLyBncm93LCBidXQgdG8gYXZvaWQgYW4gTyhuKSB3YWxrIGZvciBldmVyeSB0YXNrIHdlIGV4ZWN1dGUsIHdlIGRvbid0XG5cdCAgICAgICAgLy8gc2hpZnQgdGFza3Mgb2ZmIHRoZSBxdWV1ZSBhZnRlciB0aGV5IGhhdmUgYmVlbiBleGVjdXRlZC5cblx0ICAgICAgICAvLyBJbnN0ZWFkLCB3ZSBwZXJpb2RpY2FsbHkgc2hpZnQgMTAyNCB0YXNrcyBvZmYgdGhlIHF1ZXVlLlxuXHQgICAgICAgIGlmIChpbmRleCA+IGNhcGFjaXR5KSB7XG5cdCAgICAgICAgICAgIC8vIE1hbnVhbGx5IHNoaWZ0IGFsbCB2YWx1ZXMgc3RhcnRpbmcgYXQgdGhlIGluZGV4IGJhY2sgdG8gdGhlXG5cdCAgICAgICAgICAgIC8vIGJlZ2lubmluZyBvZiB0aGUgcXVldWUuXG5cdCAgICAgICAgICAgIGZvciAodmFyIHNjYW4gPSAwLCBuZXdMZW5ndGggPSBxdWV1ZS5sZW5ndGggLSBpbmRleDsgc2NhbiA8IG5ld0xlbmd0aDsgc2NhbisrKSB7XG5cdCAgICAgICAgICAgICAgICBxdWV1ZVtzY2FuXSA9IHF1ZXVlW3NjYW4gKyBpbmRleF07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcXVldWUubGVuZ3RoIC09IGluZGV4O1xuXHQgICAgICAgICAgICBpbmRleCA9IDA7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHQgICAgcXVldWUubGVuZ3RoID0gMDtcblx0ICAgIGluZGV4ID0gMDtcblx0ICAgIGZsdXNoaW5nID0gZmFsc2U7XG5cdH1cblxuXHQvLyBgcmVxdWVzdEZsdXNoYCBpcyBpbXBsZW1lbnRlZCB1c2luZyBhIHN0cmF0ZWd5IGJhc2VkIG9uIGRhdGEgY29sbGVjdGVkIGZyb21cblx0Ly8gZXZlcnkgYXZhaWxhYmxlIFNhdWNlTGFicyBTZWxlbml1bSB3ZWIgZHJpdmVyIHdvcmtlciBhdCB0aW1lIG9mIHdyaXRpbmcuXG5cdC8vIGh0dHBzOi8vZG9jcy5nb29nbGUuY29tL3NwcmVhZHNoZWV0cy9kLzFtRy01VVlHdXA1cXhHZEVNV2toUDZCV0N6MDUzTlViMkUxUW9VVFUxNnVBL2VkaXQjZ2lkPTc4MzcyNDU5M1xuXG5cdC8vIFNhZmFyaSA2IGFuZCA2LjEgZm9yIGRlc2t0b3AsIGlQYWQsIGFuZCBpUGhvbmUgYXJlIHRoZSBvbmx5IGJyb3dzZXJzIHRoYXRcblx0Ly8gaGF2ZSBXZWJLaXRNdXRhdGlvbk9ic2VydmVyIGJ1dCBub3QgdW4tcHJlZml4ZWQgTXV0YXRpb25PYnNlcnZlci5cblx0Ly8gTXVzdCB1c2UgYGdsb2JhbGAgb3IgYHNlbGZgIGluc3RlYWQgb2YgYHdpbmRvd2AgdG8gd29yayBpbiBib3RoIGZyYW1lcyBhbmQgd2ViXG5cdC8vIHdvcmtlcnMuIGBnbG9iYWxgIGlzIGEgcHJvdmlzaW9uIG9mIEJyb3dzZXJpZnksIE1yLCBNcnMsIG9yIE1vcC5cblxuXHQvKiBnbG9iYWxzIHNlbGYgKi9cblx0dmFyIHNjb3BlID0gdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHNlbGY7XG5cdHZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IHNjb3BlLk11dGF0aW9uT2JzZXJ2ZXIgfHwgc2NvcGUuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcblxuXHQvLyBNdXRhdGlvbk9ic2VydmVycyBhcmUgZGVzaXJhYmxlIGJlY2F1c2UgdGhleSBoYXZlIGhpZ2ggcHJpb3JpdHkgYW5kIHdvcmtcblx0Ly8gcmVsaWFibHkgZXZlcnl3aGVyZSB0aGV5IGFyZSBpbXBsZW1lbnRlZC5cblx0Ly8gVGhleSBhcmUgaW1wbGVtZW50ZWQgaW4gYWxsIG1vZGVybiBicm93c2Vycy5cblx0Ly9cblx0Ly8gLSBBbmRyb2lkIDQtNC4zXG5cdC8vIC0gQ2hyb21lIDI2LTM0XG5cdC8vIC0gRmlyZWZveCAxNC0yOVxuXHQvLyAtIEludGVybmV0IEV4cGxvcmVyIDExXG5cdC8vIC0gaVBhZCBTYWZhcmkgNi03LjFcblx0Ly8gLSBpUGhvbmUgU2FmYXJpIDctNy4xXG5cdC8vIC0gU2FmYXJpIDYtN1xuXHRpZiAodHlwZW9mIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID09PSBcImZ1bmN0aW9uXCIpIHtcblx0ICAgIHJlcXVlc3RGbHVzaCA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21NdXRhdGlvbk9ic2VydmVyKGZsdXNoKTtcblxuXHQvLyBNZXNzYWdlQ2hhbm5lbHMgYXJlIGRlc2lyYWJsZSBiZWNhdXNlIHRoZXkgZ2l2ZSBkaXJlY3QgYWNjZXNzIHRvIHRoZSBIVE1MXG5cdC8vIHRhc2sgcXVldWUsIGFyZSBpbXBsZW1lbnRlZCBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMCwgU2FmYXJpIDUuMC0xLCBhbmQgT3BlcmFcblx0Ly8gMTEtMTIsIGFuZCBpbiB3ZWIgd29ya2VycyBpbiBtYW55IGVuZ2luZXMuXG5cdC8vIEFsdGhvdWdoIG1lc3NhZ2UgY2hhbm5lbHMgeWllbGQgdG8gYW55IHF1ZXVlZCByZW5kZXJpbmcgYW5kIElPIHRhc2tzLCB0aGV5XG5cdC8vIHdvdWxkIGJlIGJldHRlciB0aGFuIGltcG9zaW5nIHRoZSA0bXMgZGVsYXkgb2YgdGltZXJzLlxuXHQvLyBIb3dldmVyLCB0aGV5IGRvIG5vdCB3b3JrIHJlbGlhYmx5IGluIEludGVybmV0IEV4cGxvcmVyIG9yIFNhZmFyaS5cblxuXHQvLyBJbnRlcm5ldCBFeHBsb3JlciAxMCBpcyB0aGUgb25seSBicm93c2VyIHRoYXQgaGFzIHNldEltbWVkaWF0ZSBidXQgZG9lc1xuXHQvLyBub3QgaGF2ZSBNdXRhdGlvbk9ic2VydmVycy5cblx0Ly8gQWx0aG91Z2ggc2V0SW1tZWRpYXRlIHlpZWxkcyB0byB0aGUgYnJvd3NlcidzIHJlbmRlcmVyLCBpdCB3b3VsZCBiZVxuXHQvLyBwcmVmZXJyYWJsZSB0byBmYWxsaW5nIGJhY2sgdG8gc2V0VGltZW91dCBzaW5jZSBpdCBkb2VzIG5vdCBoYXZlXG5cdC8vIHRoZSBtaW5pbXVtIDRtcyBwZW5hbHR5LlxuXHQvLyBVbmZvcnR1bmF0ZWx5IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSBidWcgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAgTW9iaWxlIChhbmRcblx0Ly8gRGVza3RvcCB0byBhIGxlc3NlciBleHRlbnQpIHRoYXQgcmVuZGVycyBib3RoIHNldEltbWVkaWF0ZSBhbmRcblx0Ly8gTWVzc2FnZUNoYW5uZWwgdXNlbGVzcyBmb3IgdGhlIHB1cnBvc2VzIG9mIEFTQVAuXG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9pc3N1ZXMvMzk2XG5cblx0Ly8gVGltZXJzIGFyZSBpbXBsZW1lbnRlZCB1bml2ZXJzYWxseS5cblx0Ly8gV2UgZmFsbCBiYWNrIHRvIHRpbWVycyBpbiB3b3JrZXJzIGluIG1vc3QgZW5naW5lcywgYW5kIGluIGZvcmVncm91bmRcblx0Ly8gY29udGV4dHMgaW4gdGhlIGZvbGxvd2luZyBicm93c2Vycy5cblx0Ly8gSG93ZXZlciwgbm90ZSB0aGF0IGV2ZW4gdGhpcyBzaW1wbGUgY2FzZSByZXF1aXJlcyBudWFuY2VzIHRvIG9wZXJhdGUgaW4gYVxuXHQvLyBicm9hZCBzcGVjdHJ1bSBvZiBicm93c2Vycy5cblx0Ly9cblx0Ly8gLSBGaXJlZm94IDMtMTNcblx0Ly8gLSBJbnRlcm5ldCBFeHBsb3JlciA2LTlcblx0Ly8gLSBpUGFkIFNhZmFyaSA0LjNcblx0Ly8gLSBMeW54IDIuOC43XG5cdH0gZWxzZSB7XG5cdCAgICByZXF1ZXN0Rmx1c2ggPSBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXIoZmx1c2gpO1xuXHR9XG5cblx0Ly8gYHJlcXVlc3RGbHVzaGAgcmVxdWVzdHMgdGhhdCB0aGUgaGlnaCBwcmlvcml0eSBldmVudCBxdWV1ZSBiZSBmbHVzaGVkIGFzXG5cdC8vIHNvb24gYXMgcG9zc2libGUuXG5cdC8vIFRoaXMgaXMgdXNlZnVsIHRvIHByZXZlbnQgYW4gZXJyb3IgdGhyb3duIGluIGEgdGFzayBmcm9tIHN0YWxsaW5nIHRoZSBldmVudFxuXHQvLyBxdWV1ZSBpZiB0aGUgZXhjZXB0aW9uIGhhbmRsZWQgYnkgTm9kZS5qc+KAmXNcblx0Ly8gYHByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiKWAgb3IgYnkgYSBkb21haW4uXG5cdHJhd0FzYXAucmVxdWVzdEZsdXNoID0gcmVxdWVzdEZsdXNoO1xuXG5cdC8vIFRvIHJlcXVlc3QgYSBoaWdoIHByaW9yaXR5IGV2ZW50LCB3ZSBpbmR1Y2UgYSBtdXRhdGlvbiBvYnNlcnZlciBieSB0b2dnbGluZ1xuXHQvLyB0aGUgdGV4dCBvZiBhIHRleHQgbm9kZSBiZXR3ZWVuIFwiMVwiIGFuZCBcIi0xXCIuXG5cdGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21NdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKSB7XG5cdCAgICB2YXIgdG9nZ2xlID0gMTtcblx0ICAgIHZhciBvYnNlcnZlciA9IG5ldyBCcm93c2VyTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjayk7XG5cdCAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuXHQgICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7Y2hhcmFjdGVyRGF0YTogdHJ1ZX0pO1xuXHQgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQgICAgICAgIHRvZ2dsZSA9IC10b2dnbGU7XG5cdCAgICAgICAgbm9kZS5kYXRhID0gdG9nZ2xlO1xuXHQgICAgfTtcblx0fVxuXG5cdC8vIFRoZSBtZXNzYWdlIGNoYW5uZWwgdGVjaG5pcXVlIHdhcyBkaXNjb3ZlcmVkIGJ5IE1hbHRlIFVibCBhbmQgd2FzIHRoZVxuXHQvLyBvcmlnaW5hbCBmb3VuZGF0aW9uIGZvciB0aGlzIGxpYnJhcnkuXG5cdC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG5cblx0Ly8gU2FmYXJpIDYuMC41IChhdCBsZWFzdCkgaW50ZXJtaXR0ZW50bHkgZmFpbHMgdG8gY3JlYXRlIG1lc3NhZ2UgcG9ydHMgb24gYVxuXHQvLyBwYWdlJ3MgZmlyc3QgbG9hZC4gVGhhbmtmdWxseSwgdGhpcyB2ZXJzaW9uIG9mIFNhZmFyaSBzdXBwb3J0c1xuXHQvLyBNdXRhdGlvbk9ic2VydmVycywgc28gd2UgZG9uJ3QgbmVlZCB0byBmYWxsIGJhY2sgaW4gdGhhdCBjYXNlLlxuXG5cdC8vIGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21NZXNzYWdlQ2hhbm5lbChjYWxsYmFjaykge1xuXHQvLyAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcblx0Ly8gICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gY2FsbGJhY2s7XG5cdC8vICAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG5cdC8vICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcblx0Ly8gICAgIH07XG5cdC8vIH1cblxuXHQvLyBGb3IgcmVhc29ucyBleHBsYWluZWQgYWJvdmUsIHdlIGFyZSBhbHNvIHVuYWJsZSB0byB1c2UgYHNldEltbWVkaWF0ZWBcblx0Ly8gdW5kZXIgYW55IGNpcmN1bXN0YW5jZXMuXG5cdC8vIEV2ZW4gaWYgd2Ugd2VyZSwgdGhlcmUgaXMgYW5vdGhlciBidWcgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAuXG5cdC8vIEl0IGlzIG5vdCBzdWZmaWNpZW50IHRvIGFzc2lnbiBgc2V0SW1tZWRpYXRlYCB0byBgcmVxdWVzdEZsdXNoYCBiZWNhdXNlXG5cdC8vIGBzZXRJbW1lZGlhdGVgIG11c3QgYmUgY2FsbGVkICpieSBuYW1lKiBhbmQgdGhlcmVmb3JlIG11c3QgYmUgd3JhcHBlZCBpbiBhXG5cdC8vIGNsb3N1cmUuXG5cdC8vIE5ldmVyIGZvcmdldC5cblxuXHQvLyBmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tU2V0SW1tZWRpYXRlKGNhbGxiYWNrKSB7XG5cdC8vICAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG5cdC8vICAgICAgICAgc2V0SW1tZWRpYXRlKGNhbGxiYWNrKTtcblx0Ly8gICAgIH07XG5cdC8vIH1cblxuXHQvLyBTYWZhcmkgNi4wIGhhcyBhIHByb2JsZW0gd2hlcmUgdGltZXJzIHdpbGwgZ2V0IGxvc3Qgd2hpbGUgdGhlIHVzZXIgaXNcblx0Ly8gc2Nyb2xsaW5nLiBUaGlzIHByb2JsZW0gZG9lcyBub3QgaW1wYWN0IEFTQVAgYmVjYXVzZSBTYWZhcmkgNi4wIHN1cHBvcnRzXG5cdC8vIG11dGF0aW9uIG9ic2VydmVycywgc28gdGhhdCBpbXBsZW1lbnRhdGlvbiBpcyB1c2VkIGluc3RlYWQuXG5cdC8vIEhvd2V2ZXIsIGlmIHdlIGV2ZXIgZWxlY3QgdG8gdXNlIHRpbWVycyBpbiBTYWZhcmksIHRoZSBwcmV2YWxlbnQgd29yay1hcm91bmRcblx0Ly8gaXMgdG8gYWRkIGEgc2Nyb2xsIGV2ZW50IGxpc3RlbmVyIHRoYXQgY2FsbHMgZm9yIGEgZmx1c2guXG5cblx0Ly8gYHNldFRpbWVvdXRgIGRvZXMgbm90IGNhbGwgdGhlIHBhc3NlZCBjYWxsYmFjayBpZiB0aGUgZGVsYXkgaXMgbGVzcyB0aGFuXG5cdC8vIGFwcHJveGltYXRlbHkgNyBpbiB3ZWIgd29ya2VycyBpbiBGaXJlZm94IDggdGhyb3VnaCAxOCwgYW5kIHNvbWV0aW1lcyBub3Rcblx0Ly8gZXZlbiB0aGVuLlxuXG5cdGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcihjYWxsYmFjaykge1xuXHQgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQgICAgICAgIC8vIFdlIGRpc3BhdGNoIGEgdGltZW91dCB3aXRoIGEgc3BlY2lmaWVkIGRlbGF5IG9mIDAgZm9yIGVuZ2luZXMgdGhhdFxuXHQgICAgICAgIC8vIGNhbiByZWxpYWJseSBhY2NvbW1vZGF0ZSB0aGF0IHJlcXVlc3QuIFRoaXMgd2lsbCB1c3VhbGx5IGJlIHNuYXBwZWRcblx0ICAgICAgICAvLyB0byBhIDQgbWlsaXNlY29uZCBkZWxheSwgYnV0IG9uY2Ugd2UncmUgZmx1c2hpbmcsIHRoZXJlJ3Mgbm8gZGVsYXlcblx0ICAgICAgICAvLyBiZXR3ZWVuIGV2ZW50cy5cblx0ICAgICAgICB2YXIgdGltZW91dEhhbmRsZSA9IHNldFRpbWVvdXQoaGFuZGxlVGltZXIsIDApO1xuXHQgICAgICAgIC8vIEhvd2V2ZXIsIHNpbmNlIHRoaXMgdGltZXIgZ2V0cyBmcmVxdWVudGx5IGRyb3BwZWQgaW4gRmlyZWZveFxuXHQgICAgICAgIC8vIHdvcmtlcnMsIHdlIGVubGlzdCBhbiBpbnRlcnZhbCBoYW5kbGUgdGhhdCB3aWxsIHRyeSB0byBmaXJlXG5cdCAgICAgICAgLy8gYW4gZXZlbnQgMjAgdGltZXMgcGVyIHNlY29uZCB1bnRpbCBpdCBzdWNjZWVkcy5cblx0ICAgICAgICB2YXIgaW50ZXJ2YWxIYW5kbGUgPSBzZXRJbnRlcnZhbChoYW5kbGVUaW1lciwgNTApO1xuXG5cdCAgICAgICAgZnVuY3Rpb24gaGFuZGxlVGltZXIoKSB7XG5cdCAgICAgICAgICAgIC8vIFdoaWNoZXZlciB0aW1lciBzdWNjZWVkcyB3aWxsIGNhbmNlbCBib3RoIHRpbWVycyBhbmRcblx0ICAgICAgICAgICAgLy8gZXhlY3V0ZSB0aGUgY2FsbGJhY2suXG5cdCAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SGFuZGxlKTtcblx0ICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbEhhbmRsZSk7XG5cdCAgICAgICAgICAgIGNhbGxiYWNrKCk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblx0fVxuXG5cdC8vIFRoaXMgaXMgZm9yIGBhc2FwLmpzYCBvbmx5LlxuXHQvLyBJdHMgbmFtZSB3aWxsIGJlIHBlcmlvZGljYWxseSByYW5kb21pemVkIHRvIGJyZWFrIGFueSBjb2RlIHRoYXQgZGVwZW5kcyBvblxuXHQvLyBpdHMgZXhpc3RlbmNlLlxuXHRyYXdBc2FwLm1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lciA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcjtcblxuXHQvLyBBU0FQIHdhcyBvcmlnaW5hbGx5IGEgbmV4dFRpY2sgc2hpbSBpbmNsdWRlZCBpbiBRLiBUaGlzIHdhcyBmYWN0b3JlZCBvdXRcblx0Ly8gaW50byB0aGlzIEFTQVAgcGFja2FnZS4gSXQgd2FzIGxhdGVyIGFkYXB0ZWQgdG8gUlNWUCB3aGljaCBtYWRlIGZ1cnRoZXJcblx0Ly8gYW1lbmRtZW50cy4gVGhlc2UgZGVjaXNpb25zLCBwYXJ0aWN1bGFybHkgdG8gbWFyZ2luYWxpemUgTWVzc2FnZUNoYW5uZWwgYW5kXG5cdC8vIHRvIGNhcHR1cmUgdGhlIE11dGF0aW9uT2JzZXJ2ZXIgaW1wbGVtZW50YXRpb24gaW4gYSBjbG9zdXJlLCB3ZXJlIGludGVncmF0ZWRcblx0Ly8gYmFjayBpbnRvIEFTQVAgcHJvcGVyLlxuXHQvLyBodHRwczovL2dpdGh1Yi5jb20vdGlsZGVpby9yc3ZwLmpzL2Jsb2IvY2RkZjcyMzI1NDZhOWNmODU4NTI0Yjc1Y2RlNmY5ZWRmNzI2MjBhNy9saWIvcnN2cC9hc2FwLmpzXG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKGV4cG9ydHMsIChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0oKSkpKVxuXG4vKioqLyB9KSxcbi8qIDYgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0Ly8gQSBzaW1wbGUgY2xhc3Mgc3lzdGVtLCBtb3JlIGRvY3VtZW50YXRpb24gdG8gY29tZVxuXG5cdGZ1bmN0aW9uIGV4dGVuZChjbHMsIG5hbWUsIHByb3BzKSB7XG5cdCAgICAvLyBUaGlzIGRvZXMgdGhhdCBzYW1lIHRoaW5nIGFzIE9iamVjdC5jcmVhdGUsIGJ1dCB3aXRoIHN1cHBvcnQgZm9yIElFOFxuXHQgICAgdmFyIEYgPSBmdW5jdGlvbigpIHt9O1xuXHQgICAgRi5wcm90b3R5cGUgPSBjbHMucHJvdG90eXBlO1xuXHQgICAgdmFyIHByb3RvdHlwZSA9IG5ldyBGKCk7XG5cblx0ICAgIC8vIGpzaGludCB1bmRlZjogZmFsc2Vcblx0ICAgIHZhciBmblRlc3QgPSAveHl6Ly50ZXN0KGZ1bmN0aW9uKCl7IHh5ejsgfSkgPyAvXFxicGFyZW50XFxiLyA6IC8uKi87XG5cdCAgICBwcm9wcyA9IHByb3BzIHx8IHt9O1xuXG5cdCAgICBmb3IodmFyIGsgaW4gcHJvcHMpIHtcblx0ICAgICAgICB2YXIgc3JjID0gcHJvcHNba107XG5cdCAgICAgICAgdmFyIHBhcmVudCA9IHByb3RvdHlwZVtrXTtcblxuXHQgICAgICAgIGlmKHR5cGVvZiBwYXJlbnQgPT09ICdmdW5jdGlvbicgJiZcblx0ICAgICAgICAgICB0eXBlb2Ygc3JjID09PSAnZnVuY3Rpb24nICYmXG5cdCAgICAgICAgICAgZm5UZXN0LnRlc3Qoc3JjKSkge1xuXHQgICAgICAgICAgICAvKmpzaGludCAtVzA4MyAqL1xuXHQgICAgICAgICAgICBwcm90b3R5cGVba10gPSAoZnVuY3Rpb24gKHNyYywgcGFyZW50KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgY3VycmVudCBwYXJlbnQgbWV0aG9kXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHRtcCA9IHRoaXMucGFyZW50O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHBhcmVudCB0byB0aGUgcHJldmlvdXMgbWV0aG9kLCBjYWxsLCBhbmQgcmVzdG9yZVxuXHQgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciByZXMgPSBzcmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IHRtcDtcblxuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG5cdCAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9KShzcmMsIHBhcmVudCk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBwcm90b3R5cGVba10gPSBzcmM7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBwcm90b3R5cGUudHlwZW5hbWUgPSBuYW1lO1xuXG5cdCAgICB2YXIgbmV3X2NscyA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmKHByb3RvdHlwZS5pbml0KSB7XG5cdCAgICAgICAgICAgIHByb3RvdHlwZS5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgbmV3X2Nscy5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG5cdCAgICBuZXdfY2xzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IG5ld19jbHM7XG5cblx0ICAgIG5ld19jbHMuZXh0ZW5kID0gZnVuY3Rpb24obmFtZSwgcHJvcHMpIHtcblx0ICAgICAgICBpZih0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcblx0ICAgICAgICAgICAgcHJvcHMgPSBuYW1lO1xuXHQgICAgICAgICAgICBuYW1lID0gJ2Fub255bW91cyc7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBleHRlbmQobmV3X2NscywgbmFtZSwgcHJvcHMpO1xuXHQgICAgfTtcblxuXHQgICAgcmV0dXJuIG5ld19jbHM7XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZChPYmplY3QsICdPYmplY3QnLCB7fSk7XG5cblxuLyoqKi8gfSksXG4vKiA3ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgciA9IF9fd2VicGFja19yZXF1aXJlX18oOCk7XG5cblx0ZnVuY3Rpb24gbm9ybWFsaXplKHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcblx0ICAgIGlmKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB2YWx1ZTtcblx0fVxuXG5cdHZhciBmaWx0ZXJzID0ge1xuXHQgICAgYWJzOiBNYXRoLmFicyxcblxuXHQgICAgYmF0Y2g6IGZ1bmN0aW9uKGFyciwgbGluZWNvdW50LCBmaWxsX3dpdGgpIHtcblx0ICAgICAgICB2YXIgaTtcblx0ICAgICAgICB2YXIgcmVzID0gW107XG5cdCAgICAgICAgdmFyIHRtcCA9IFtdO1xuXG5cdCAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGlmKGkgJSBsaW5lY291bnQgPT09IDAgJiYgdG1wLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgcmVzLnB1c2godG1wKTtcblx0ICAgICAgICAgICAgICAgIHRtcCA9IFtdO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdG1wLnB1c2goYXJyW2ldKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZih0bXAubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIGlmKGZpbGxfd2l0aCkge1xuXHQgICAgICAgICAgICAgICAgZm9yKGkgPSB0bXAubGVuZ3RoOyBpIDwgbGluZWNvdW50OyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICB0bXAucHVzaChmaWxsX3dpdGgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmVzLnB1c2godG1wKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gcmVzO1xuXHQgICAgfSxcblxuXHQgICAgY2FwaXRhbGl6ZTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHZhciByZXQgPSBzdHIudG9Mb3dlckNhc2UoKTtcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyByZXQuc2xpY2UoMSkpO1xuXHQgICAgfSxcblxuXHQgICAgY2VudGVyOiBmdW5jdGlvbihzdHIsIHdpZHRoKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHdpZHRoID0gd2lkdGggfHwgODA7XG5cblx0ICAgICAgICBpZihzdHIubGVuZ3RoID49IHdpZHRoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHNwYWNlcyA9IHdpZHRoIC0gc3RyLmxlbmd0aDtcblx0ICAgICAgICB2YXIgcHJlID0gbGliLnJlcGVhdCgnICcsIHNwYWNlcy8yIC0gc3BhY2VzICUgMik7XG5cdCAgICAgICAgdmFyIHBvc3QgPSBsaWIucmVwZWF0KCcgJywgc3BhY2VzLzIpO1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHByZSArIHN0ciArIHBvc3QpO1xuXHQgICAgfSxcblxuXHQgICAgJ2RlZmF1bHQnOiBmdW5jdGlvbih2YWwsIGRlZiwgYm9vbCkge1xuXHQgICAgICAgIGlmKGJvb2wpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhbCA/IHZhbCA6IGRlZjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHJldHVybiAodmFsICE9PSB1bmRlZmluZWQpID8gdmFsIDogZGVmO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGRpY3Rzb3J0OiBmdW5jdGlvbih2YWwsIGNhc2Vfc2Vuc2l0aXZlLCBieSkge1xuXHQgICAgICAgIGlmICghbGliLmlzT2JqZWN0KHZhbCkpIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKCdkaWN0c29ydCBmaWx0ZXI6IHZhbCBtdXN0IGJlIGFuIG9iamVjdCcpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBhcnJheSA9IFtdO1xuXHQgICAgICAgIGZvciAodmFyIGsgaW4gdmFsKSB7XG5cdCAgICAgICAgICAgIC8vIGRlbGliZXJhdGVseSBpbmNsdWRlIHByb3BlcnRpZXMgZnJvbSB0aGUgb2JqZWN0J3MgcHJvdG90eXBlXG5cdCAgICAgICAgICAgIGFycmF5LnB1c2goW2ssdmFsW2tdXSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHNpO1xuXHQgICAgICAgIGlmIChieSA9PT0gdW5kZWZpbmVkIHx8IGJ5ID09PSAna2V5Jykge1xuXHQgICAgICAgICAgICBzaSA9IDA7XG5cdCAgICAgICAgfSBlbHNlIGlmIChieSA9PT0gJ3ZhbHVlJykge1xuXHQgICAgICAgICAgICBzaSA9IDE7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKFxuXHQgICAgICAgICAgICAgICAgJ2RpY3Rzb3J0IGZpbHRlcjogWW91IGNhbiBvbmx5IHNvcnQgYnkgZWl0aGVyIGtleSBvciB2YWx1ZScpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGFycmF5LnNvcnQoZnVuY3Rpb24odDEsIHQyKSB7XG5cdCAgICAgICAgICAgIHZhciBhID0gdDFbc2ldO1xuXHQgICAgICAgICAgICB2YXIgYiA9IHQyW3NpXTtcblxuXHQgICAgICAgICAgICBpZiAoIWNhc2Vfc2Vuc2l0aXZlKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAobGliLmlzU3RyaW5nKGEpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYSA9IGEudG9VcHBlckNhc2UoKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGlmIChsaWIuaXNTdHJpbmcoYikpIHtcblx0ICAgICAgICAgICAgICAgICAgICBiID0gYi50b1VwcGVyQ2FzZSgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIGEgPiBiID8gMSA6IChhID09PSBiID8gMCA6IC0xKTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiBhcnJheTtcblx0ICAgIH0sXG5cblx0ICAgIGR1bXA6IGZ1bmN0aW9uKG9iaiwgc3BhY2VzKSB7XG5cdCAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgc3BhY2VzKTtcblx0ICAgIH0sXG5cblx0ICAgIGVzY2FwZTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgaWYoc3RyIGluc3RhbmNlb2Ygci5TYWZlU3RyaW5nKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHN0ciA9IChzdHIgPT09IG51bGwgfHwgc3RyID09PSB1bmRlZmluZWQpID8gJycgOiBzdHI7XG5cdCAgICAgICAgcmV0dXJuIHIubWFya1NhZmUobGliLmVzY2FwZShzdHIudG9TdHJpbmcoKSkpO1xuXHQgICAgfSxcblxuXHQgICAgc2FmZTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgaWYgKHN0ciBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykge1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBzdHIgPSAoc3RyID09PSBudWxsIHx8IHN0ciA9PT0gdW5kZWZpbmVkKSA/ICcnIDogc3RyO1xuXHQgICAgICAgIHJldHVybiByLm1hcmtTYWZlKHN0ci50b1N0cmluZygpKTtcblx0ICAgIH0sXG5cblx0ICAgIGZpcnN0OiBmdW5jdGlvbihhcnIpIHtcblx0ICAgICAgICByZXR1cm4gYXJyWzBdO1xuXHQgICAgfSxcblxuXHQgICAgZ3JvdXBieTogZnVuY3Rpb24oYXJyLCBhdHRyKSB7XG5cdCAgICAgICAgcmV0dXJuIGxpYi5ncm91cEJ5KGFyciwgYXR0cik7XG5cdCAgICB9LFxuXG5cdCAgICBpbmRlbnQ6IGZ1bmN0aW9uKHN0ciwgd2lkdGgsIGluZGVudGZpcnN0KSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXG5cdCAgICAgICAgaWYgKHN0ciA9PT0gJycpIHJldHVybiAnJztcblxuXHQgICAgICAgIHdpZHRoID0gd2lkdGggfHwgNDtcblx0ICAgICAgICB2YXIgcmVzID0gJyc7XG5cdCAgICAgICAgdmFyIGxpbmVzID0gc3RyLnNwbGl0KCdcXG4nKTtcblx0ICAgICAgICB2YXIgc3AgPSBsaWIucmVwZWF0KCcgJywgd2lkdGgpO1xuXG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8bGluZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgaWYoaSA9PT0gMCAmJiAhaW5kZW50Zmlyc3QpIHtcblx0ICAgICAgICAgICAgICAgIHJlcyArPSBsaW5lc1tpXSArICdcXG4nO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcmVzICs9IHNwICsgbGluZXNbaV0gKyAnXFxuJztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHJlcyk7XG5cdCAgICB9LFxuXG5cdCAgICBqb2luOiBmdW5jdGlvbihhcnIsIGRlbCwgYXR0cikge1xuXHQgICAgICAgIGRlbCA9IGRlbCB8fCAnJztcblxuXHQgICAgICAgIGlmKGF0dHIpIHtcblx0ICAgICAgICAgICAgYXJyID0gbGliLm1hcChhcnIsIGZ1bmN0aW9uKHYpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB2W2F0dHJdO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gYXJyLmpvaW4oZGVsKTtcblx0ICAgIH0sXG5cblx0ICAgIGxhc3Q6IGZ1bmN0aW9uKGFycikge1xuXHQgICAgICAgIHJldHVybiBhcnJbYXJyLmxlbmd0aC0xXTtcblx0ICAgIH0sXG5cblx0ICAgIGxlbmd0aDogZnVuY3Rpb24odmFsKSB7XG5cdCAgICAgICAgdmFyIHZhbHVlID0gbm9ybWFsaXplKHZhbCwgJycpO1xuXG5cdCAgICAgICAgaWYodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICBpZihcblx0ICAgICAgICAgICAgICAgICh0eXBlb2YgTWFwID09PSAnZnVuY3Rpb24nICYmIHZhbHVlIGluc3RhbmNlb2YgTWFwKSB8fFxuXHQgICAgICAgICAgICAgICAgKHR5cGVvZiBTZXQgPT09ICdmdW5jdGlvbicgJiYgdmFsdWUgaW5zdGFuY2VvZiBTZXQpXG5cdCAgICAgICAgICAgICkge1xuXHQgICAgICAgICAgICAgICAgLy8gRUNNQVNjcmlwdCAyMDE1IE1hcHMgYW5kIFNldHNcblx0ICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5zaXplO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmKGxpYi5pc09iamVjdCh2YWx1ZSkgJiYgISh2YWx1ZSBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykpIHtcblx0ICAgICAgICAgICAgICAgIC8vIE9iamVjdHMgKGJlc2lkZXMgU2FmZVN0cmluZ3MpLCBub24tcHJpbWF0aXZlIEFycmF5c1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGg7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIDA7XG5cdCAgICB9LFxuXG5cdCAgICBsaXN0OiBmdW5jdGlvbih2YWwpIHtcblx0ICAgICAgICBpZihsaWIuaXNTdHJpbmcodmFsKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFsLnNwbGl0KCcnKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihsaWIuaXNPYmplY3QodmFsKSkge1xuXHQgICAgICAgICAgICB2YXIga2V5cyA9IFtdO1xuXG5cdCAgICAgICAgICAgIGlmKE9iamVjdC5rZXlzKSB7XG5cdCAgICAgICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXModmFsKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIGZvcih2YXIgayBpbiB2YWwpIHtcblx0ICAgICAgICAgICAgICAgICAgICBrZXlzLnB1c2goayk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gbGliLm1hcChrZXlzLCBmdW5jdGlvbihrKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4geyBrZXk6IGssXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsW2tdIH07XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKGxpYi5pc0FycmF5KHZhbCkpIHtcblx0ICAgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoJ2xpc3QgZmlsdGVyOiB0eXBlIG5vdCBpdGVyYWJsZScpO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGxvd2VyOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpO1xuXHQgICAgfSxcblxuXHQgICAgbmwyYnI6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIGlmIChzdHIgPT09IG51bGwgfHwgc3RyID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuICcnO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCBzdHIucmVwbGFjZSgvXFxyXFxufFxcbi9nLCAnPGJyIC8+XFxuJykpO1xuXHQgICAgfSxcblxuXHQgICAgcmFuZG9tOiBmdW5jdGlvbihhcnIpIHtcblx0ICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcblx0ICAgIH0sXG5cblx0ICAgIHJlamVjdGF0dHI6IGZ1bmN0aW9uKGFyciwgYXR0cikge1xuXHQgICAgICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuXHQgICAgICAgIHJldHVybiAhaXRlbVthdHRyXTtcblx0ICAgICAgfSk7XG5cdCAgICB9LFxuXG5cdCAgICBzZWxlY3RhdHRyOiBmdW5jdGlvbihhcnIsIGF0dHIpIHtcblx0ICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcblx0ICAgICAgICByZXR1cm4gISFpdGVtW2F0dHJdO1xuXHQgICAgICB9KTtcblx0ICAgIH0sXG5cblx0ICAgIHJlcGxhY2U6IGZ1bmN0aW9uKHN0ciwgb2xkLCBuZXdfLCBtYXhDb3VudCkge1xuXHQgICAgICAgIHZhciBvcmlnaW5hbFN0ciA9IHN0cjtcblxuXHQgICAgICAgIGlmIChvbGQgaW5zdGFuY2VvZiBSZWdFeHApIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKG9sZCwgbmV3Xyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYodHlwZW9mIG1heENvdW50ID09PSAndW5kZWZpbmVkJyl7XG5cdCAgICAgICAgICAgIG1heENvdW50ID0gLTE7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHJlcyA9ICcnOyAgLy8gT3V0cHV0XG5cblx0ICAgICAgICAvLyBDYXN0IE51bWJlcnMgaW4gdGhlIHNlYXJjaCB0ZXJtIHRvIHN0cmluZ1xuXHQgICAgICAgIGlmKHR5cGVvZiBvbGQgPT09ICdudW1iZXInKXtcblx0ICAgICAgICAgICAgb2xkID0gb2xkICsgJyc7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYodHlwZW9mIG9sZCAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgLy8gSWYgaXQgaXMgc29tZXRoaW5nIG90aGVyIHRoYW4gbnVtYmVyIG9yIHN0cmluZyxcblx0ICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSBvcmlnaW5hbCBzdHJpbmdcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBDYXN0IG51bWJlcnMgaW4gdGhlIHJlcGxhY2VtZW50IHRvIHN0cmluZ1xuXHQgICAgICAgIGlmKHR5cGVvZiBzdHIgPT09ICdudW1iZXInKXtcblx0ICAgICAgICAgICAgc3RyID0gc3RyICsgJyc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gSWYgYnkgbm93LCB3ZSBkb24ndCBoYXZlIGEgc3RyaW5nLCB0aHJvdyBpdCBiYWNrXG5cdCAgICAgICAgaWYodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycgJiYgIShzdHIgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpKXtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBTaG9ydENpcmN1aXRzXG5cdCAgICAgICAgaWYob2xkID09PSAnJyl7XG5cdCAgICAgICAgICAgIC8vIE1pbWljIHRoZSBweXRob24gYmVoYXZpb3VyOiBlbXB0eSBzdHJpbmcgaXMgcmVwbGFjZWRcblx0ICAgICAgICAgICAgLy8gYnkgcmVwbGFjZW1lbnQgZS5nLiBcImFiY1wifHJlcGxhY2UoXCJcIiwgXCIuXCIpIC0+IC5hLmIuYy5cblx0ICAgICAgICAgICAgcmVzID0gbmV3XyArIHN0ci5zcGxpdCgnJykuam9pbihuZXdfKSArIG5ld187XG5cdCAgICAgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHJlcyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIG5leHRJbmRleCA9IHN0ci5pbmRleE9mKG9sZCk7XG5cdCAgICAgICAgLy8gaWYgIyBvZiByZXBsYWNlbWVudHMgdG8gcGVyZm9ybSBpcyAwLCBvciB0aGUgc3RyaW5nIHRvIGRvZXNcblx0ICAgICAgICAvLyBub3QgY29udGFpbiB0aGUgb2xkIHZhbHVlLCByZXR1cm4gdGhlIHN0cmluZ1xuXHQgICAgICAgIGlmKG1heENvdW50ID09PSAwIHx8IG5leHRJbmRleCA9PT0gLTEpe1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBwb3MgPSAwO1xuXHQgICAgICAgIHZhciBjb3VudCA9IDA7IC8vICMgb2YgcmVwbGFjZW1lbnRzIG1hZGVcblxuXHQgICAgICAgIHdoaWxlKG5leHRJbmRleCAgPiAtMSAmJiAobWF4Q291bnQgPT09IC0xIHx8IGNvdW50IDwgbWF4Q291bnQpKXtcblx0ICAgICAgICAgICAgLy8gR3JhYiB0aGUgbmV4dCBjaHVuayBvZiBzcmMgc3RyaW5nIGFuZCBhZGQgaXQgd2l0aCB0aGVcblx0ICAgICAgICAgICAgLy8gcmVwbGFjZW1lbnQsIHRvIHRoZSByZXN1bHRcblx0ICAgICAgICAgICAgcmVzICs9IHN0ci5zdWJzdHJpbmcocG9zLCBuZXh0SW5kZXgpICsgbmV3Xztcblx0ICAgICAgICAgICAgLy8gSW5jcmVtZW50IG91ciBwb2ludGVyIGluIHRoZSBzcmMgc3RyaW5nXG5cdCAgICAgICAgICAgIHBvcyA9IG5leHRJbmRleCArIG9sZC5sZW5ndGg7XG5cdCAgICAgICAgICAgIGNvdW50Kys7XG5cdCAgICAgICAgICAgIC8vIFNlZSBpZiB0aGVyZSBhcmUgYW55IG1vcmUgcmVwbGFjZW1lbnRzIHRvIGJlIG1hZGVcblx0ICAgICAgICAgICAgbmV4dEluZGV4ID0gc3RyLmluZGV4T2Yob2xkLCBwb3MpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIFdlJ3ZlIGVpdGhlciByZWFjaGVkIHRoZSBlbmQsIG9yIGRvbmUgdGhlIG1heCAjIG9mXG5cdCAgICAgICAgLy8gcmVwbGFjZW1lbnRzLCB0YWNrIG9uIGFueSByZW1haW5pbmcgc3RyaW5nXG5cdCAgICAgICAgaWYocG9zIDwgc3RyLmxlbmd0aCkge1xuXHQgICAgICAgICAgICByZXMgKz0gc3RyLnN1YnN0cmluZyhwb3MpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhvcmlnaW5hbFN0ciwgcmVzKTtcblx0ICAgIH0sXG5cblx0ICAgIHJldmVyc2U6IGZ1bmN0aW9uKHZhbCkge1xuXHQgICAgICAgIHZhciBhcnI7XG5cdCAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICAgICAgYXJyID0gZmlsdGVycy5saXN0KHZhbCk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAvLyBDb3B5IGl0XG5cdCAgICAgICAgICAgIGFyciA9IGxpYi5tYXAodmFsLCBmdW5jdGlvbih2KSB7IHJldHVybiB2OyB9KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBhcnIucmV2ZXJzZSgpO1xuXG5cdCAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHZhbCwgYXJyLmpvaW4oJycpKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGFycjtcblx0ICAgIH0sXG5cblx0ICAgIHJvdW5kOiBmdW5jdGlvbih2YWwsIHByZWNpc2lvbiwgbWV0aG9kKSB7XG5cdCAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uIHx8IDA7XG5cdCAgICAgICAgdmFyIGZhY3RvciA9IE1hdGgucG93KDEwLCBwcmVjaXNpb24pO1xuXHQgICAgICAgIHZhciByb3VuZGVyO1xuXG5cdCAgICAgICAgaWYobWV0aG9kID09PSAnY2VpbCcpIHtcblx0ICAgICAgICAgICAgcm91bmRlciA9IE1hdGguY2VpbDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihtZXRob2QgPT09ICdmbG9vcicpIHtcblx0ICAgICAgICAgICAgcm91bmRlciA9IE1hdGguZmxvb3I7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICByb3VuZGVyID0gTWF0aC5yb3VuZDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gcm91bmRlcih2YWwgKiBmYWN0b3IpIC8gZmFjdG9yO1xuXHQgICAgfSxcblxuXHQgICAgc2xpY2U6IGZ1bmN0aW9uKGFyciwgc2xpY2VzLCBmaWxsV2l0aCkge1xuXHQgICAgICAgIHZhciBzbGljZUxlbmd0aCA9IE1hdGguZmxvb3IoYXJyLmxlbmd0aCAvIHNsaWNlcyk7XG5cdCAgICAgICAgdmFyIGV4dHJhID0gYXJyLmxlbmd0aCAlIHNsaWNlcztcblx0ICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcblx0ICAgICAgICB2YXIgcmVzID0gW107XG5cblx0ICAgICAgICBmb3IodmFyIGk9MDsgaTxzbGljZXM7IGkrKykge1xuXHQgICAgICAgICAgICB2YXIgc3RhcnQgPSBvZmZzZXQgKyBpICogc2xpY2VMZW5ndGg7XG5cdCAgICAgICAgICAgIGlmKGkgPCBleHRyYSkge1xuXHQgICAgICAgICAgICAgICAgb2Zmc2V0Kys7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgdmFyIGVuZCA9IG9mZnNldCArIChpICsgMSkgKiBzbGljZUxlbmd0aDtcblxuXHQgICAgICAgICAgICB2YXIgc2xpY2UgPSBhcnIuc2xpY2Uoc3RhcnQsIGVuZCk7XG5cdCAgICAgICAgICAgIGlmKGZpbGxXaXRoICYmIGkgPj0gZXh0cmEpIHtcblx0ICAgICAgICAgICAgICAgIHNsaWNlLnB1c2goZmlsbFdpdGgpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJlcy5wdXNoKHNsaWNlKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gcmVzO1xuXHQgICAgfSxcblxuXHQgICAgc3VtOiBmdW5jdGlvbihhcnIsIGF0dHIsIHN0YXJ0KSB7XG5cdCAgICAgICAgdmFyIHN1bSA9IDA7XG5cblx0ICAgICAgICBpZih0eXBlb2Ygc3RhcnQgPT09ICdudW1iZXInKXtcblx0ICAgICAgICAgICAgc3VtICs9IHN0YXJ0O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKGF0dHIpIHtcblx0ICAgICAgICAgICAgYXJyID0gbGliLm1hcChhcnIsIGZ1bmN0aW9uKHYpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB2W2F0dHJdO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIHN1bSArPSBhcnJbaV07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHN1bTtcblx0ICAgIH0sXG5cblx0ICAgIHNvcnQ6IHIubWFrZU1hY3JvKFsndmFsdWUnLCAncmV2ZXJzZScsICdjYXNlX3NlbnNpdGl2ZScsICdhdHRyaWJ1dGUnXSwgW10sIGZ1bmN0aW9uKGFyciwgcmV2ZXJzZSwgY2FzZVNlbnMsIGF0dHIpIHtcblx0ICAgICAgICAgLy8gQ29weSBpdFxuXHQgICAgICAgIGFyciA9IGxpYi5tYXAoYXJyLCBmdW5jdGlvbih2KSB7IHJldHVybiB2OyB9KTtcblxuXHQgICAgICAgIGFyci5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcblx0ICAgICAgICAgICAgdmFyIHgsIHk7XG5cblx0ICAgICAgICAgICAgaWYoYXR0cikge1xuXHQgICAgICAgICAgICAgICAgeCA9IGFbYXR0cl07XG5cdCAgICAgICAgICAgICAgICB5ID0gYlthdHRyXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHggPSBhO1xuXHQgICAgICAgICAgICAgICAgeSA9IGI7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZighY2FzZVNlbnMgJiYgbGliLmlzU3RyaW5nKHgpICYmIGxpYi5pc1N0cmluZyh5KSkge1xuXHQgICAgICAgICAgICAgICAgeCA9IHgudG9Mb3dlckNhc2UoKTtcblx0ICAgICAgICAgICAgICAgIHkgPSB5LnRvTG93ZXJDYXNlKCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZih4IDwgeSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHJldmVyc2UgPyAxIDogLTE7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZih4ID4geSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHJldmVyc2UgPyAtMTogMTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiAwO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gYXJyO1xuXHQgICAgfSksXG5cblx0ICAgIHN0cmluZzogZnVuY3Rpb24ob2JqKSB7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKG9iaiwgb2JqKTtcblx0ICAgIH0sXG5cblx0ICAgIHN0cmlwdGFnczogZnVuY3Rpb24oaW5wdXQsIHByZXNlcnZlX2xpbmVicmVha3MpIHtcblx0ICAgICAgICBpbnB1dCA9IG5vcm1hbGl6ZShpbnB1dCwgJycpO1xuXHQgICAgICAgIHByZXNlcnZlX2xpbmVicmVha3MgPSBwcmVzZXJ2ZV9saW5lYnJlYWtzIHx8IGZhbHNlO1xuXHQgICAgICAgIHZhciB0YWdzID0gLzxcXC8/KFthLXpdW2EtejAtOV0qKVxcYltePl0qPnw8IS0tW1xcc1xcU10qPy0tPi9naTtcblx0ICAgICAgICB2YXIgdHJpbW1lZElucHV0ID0gZmlsdGVycy50cmltKGlucHV0LnJlcGxhY2UodGFncywgJycpKTtcblx0ICAgICAgICB2YXIgcmVzID0gJyc7XG5cdCAgICAgICAgaWYgKHByZXNlcnZlX2xpbmVicmVha3MpIHtcblx0ICAgICAgICAgICAgcmVzID0gdHJpbW1lZElucHV0XG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvXiArfCArJC9nbSwgJycpICAgICAvLyByZW1vdmUgbGVhZGluZyBhbmQgdHJhaWxpbmcgc3BhY2VzXG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvICsvZywgJyAnKSAgICAgICAgICAvLyBzcXVhc2ggYWRqYWNlbnQgc3BhY2VzXG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvKFxcclxcbikvZywgJ1xcbicpICAgICAvLyBub3JtYWxpemUgbGluZWJyZWFrcyAoQ1JMRiAtPiBMRilcblx0ICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXG5cXG5cXG4rL2csICdcXG5cXG4nKTsgLy8gc3F1YXNoIGFibm9ybWFsIGFkamFjZW50IGxpbmVicmVha3Ncblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICByZXMgPSB0cmltbWVkSW5wdXQucmVwbGFjZSgvXFxzKy9naSwgJyAnKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKGlucHV0LCByZXMpO1xuXHQgICAgfSxcblxuXHQgICAgdGl0bGU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB2YXIgd29yZHMgPSBzdHIuc3BsaXQoJyAnKTtcblx0ICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgd29yZHMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgd29yZHNbaV0gPSBmaWx0ZXJzLmNhcGl0YWxpemUod29yZHNbaV0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCB3b3Jkcy5qb2luKCcgJykpO1xuXHQgICAgfSxcblxuXHQgICAgdHJpbTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgc3RyLnJlcGxhY2UoL15cXHMqfFxccyokL2csICcnKSk7XG5cdCAgICB9LFxuXG5cdCAgICB0cnVuY2F0ZTogZnVuY3Rpb24oaW5wdXQsIGxlbmd0aCwga2lsbHdvcmRzLCBlbmQpIHtcblx0ICAgICAgICB2YXIgb3JpZyA9IGlucHV0O1xuXHQgICAgICAgIGlucHV0ID0gbm9ybWFsaXplKGlucHV0LCAnJyk7XG5cdCAgICAgICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDI1NTtcblxuXHQgICAgICAgIGlmIChpbnB1dC5sZW5ndGggPD0gbGVuZ3RoKVxuXHQgICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG5cblx0ICAgICAgICBpZiAoa2lsbHdvcmRzKSB7XG5cdCAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyaW5nKDAsIGxlbmd0aCk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIGlkeCA9IGlucHV0Lmxhc3RJbmRleE9mKCcgJywgbGVuZ3RoKTtcblx0ICAgICAgICAgICAgaWYoaWR4ID09PSAtMSkge1xuXHQgICAgICAgICAgICAgICAgaWR4ID0gbGVuZ3RoO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgaWR4KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpbnB1dCArPSAoZW5kICE9PSB1bmRlZmluZWQgJiYgZW5kICE9PSBudWxsKSA/IGVuZCA6ICcuLi4nO1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhvcmlnLCBpbnB1dCk7XG5cdCAgICB9LFxuXG5cdCAgICB1cHBlcjogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHJldHVybiBzdHIudG9VcHBlckNhc2UoKTtcblx0ICAgIH0sXG5cblx0ICAgIHVybGVuY29kZTogZnVuY3Rpb24ob2JqKSB7XG5cdCAgICAgICAgdmFyIGVuYyA9IGVuY29kZVVSSUNvbXBvbmVudDtcblx0ICAgICAgICBpZiAobGliLmlzU3RyaW5nKG9iaikpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGVuYyhvYmopO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBwYXJ0cztcblx0ICAgICAgICAgICAgaWYgKGxpYi5pc0FycmF5KG9iaikpIHtcblx0ICAgICAgICAgICAgICAgIHBhcnRzID0gb2JqLm1hcChmdW5jdGlvbihpdGVtKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuYyhpdGVtWzBdKSArICc9JyArIGVuYyhpdGVtWzFdKTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcGFydHMgPSBbXTtcblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKGVuYyhrKSArICc9JyArIGVuYyhvYmpba10pKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oJyYnKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICB1cmxpemU6IGZ1bmN0aW9uKHN0ciwgbGVuZ3RoLCBub2ZvbGxvdykge1xuXHQgICAgICAgIGlmIChpc05hTihsZW5ndGgpKSBsZW5ndGggPSBJbmZpbml0eTtcblxuXHQgICAgICAgIHZhciBub0ZvbGxvd0F0dHIgPSAobm9mb2xsb3cgPT09IHRydWUgPyAnIHJlbD1cIm5vZm9sbG93XCInIDogJycpO1xuXG5cdCAgICAgICAgLy8gRm9yIHRoZSBqaW5qYSByZWdleHAsIHNlZVxuXHQgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9taXRzdWhpa28vamluamEyL2Jsb2IvZjE1YjgxNGRjYmE2YWExMmJjNzRkMWY3ZDBjODgxZDU1ZjcxMjZiZS9qaW5qYTIvdXRpbHMucHkjTDIwLUwyM1xuXHQgICAgICAgIHZhciBwdW5jUkUgPSAvXig/OlxcKHw8fCZsdDspPyguKj8pKD86XFwufCx8XFwpfFxcbnwmZ3Q7KT8kLztcblx0ICAgICAgICAvLyBmcm9tIGh0dHA6Ly9ibG9nLmdlcnYubmV0LzIwMTEvMDUvaHRtbDVfZW1haWxfYWRkcmVzc19yZWdleHAvXG5cdCAgICAgICAgdmFyIGVtYWlsUkUgPSAvXltcXHcuISMkJSYnKitcXC1cXC89P1xcXmB7fH1+XStAW2EtelxcZFxcLV0rKFxcLlthLXpcXGRcXC1dKykrJC9pO1xuXHQgICAgICAgIHZhciBodHRwSHR0cHNSRSA9IC9eaHR0cHM/OlxcL1xcLy4qJC87XG5cdCAgICAgICAgdmFyIHd3d1JFID0gL153d3dcXC4vO1xuXHQgICAgICAgIHZhciB0bGRSRSA9IC9cXC4oPzpvcmd8bmV0fGNvbSkoPzpcXDp8XFwvfCQpLztcblxuXHQgICAgICAgIHZhciB3b3JkcyA9IHN0ci5zcGxpdCgvKFxccyspLykuZmlsdGVyKGZ1bmN0aW9uKHdvcmQpIHtcblx0ICAgICAgICAgIC8vIElmIHRoZSB3b3JkIGhhcyBubyBsZW5ndGgsIGJhaWwuIFRoaXMgY2FuIGhhcHBlbiBmb3Igc3RyIHdpdGhcblx0ICAgICAgICAgIC8vIHRyYWlsaW5nIHdoaXRlc3BhY2UuXG5cdCAgICAgICAgICByZXR1cm4gd29yZCAmJiB3b3JkLmxlbmd0aDtcblx0ICAgICAgICB9KS5tYXAoZnVuY3Rpb24od29yZCkge1xuXHQgICAgICAgICAgdmFyIG1hdGNoZXMgPSB3b3JkLm1hdGNoKHB1bmNSRSk7XG5cdCAgICAgICAgICB2YXIgcG9zc2libGVVcmwgPSBtYXRjaGVzICYmIG1hdGNoZXNbMV0gfHwgd29yZDtcblxuXHQgICAgICAgICAgLy8gdXJsIHRoYXQgc3RhcnRzIHdpdGggaHR0cCBvciBodHRwc1xuXHQgICAgICAgICAgaWYgKGh0dHBIdHRwc1JFLnRlc3QocG9zc2libGVVcmwpKVxuXHQgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCInICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIC8vIHVybCB0aGF0IHN0YXJ0cyB3aXRoIHd3dy5cblx0ICAgICAgICAgIGlmICh3d3dSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovLycgKyBwb3NzaWJsZVVybCArICdcIicgKyBub0ZvbGxvd0F0dHIgKyAnPicgKyBwb3NzaWJsZVVybC5zdWJzdHIoMCwgbGVuZ3RoKSArICc8L2E+JztcblxuXHQgICAgICAgICAgLy8gYW4gZW1haWwgYWRkcmVzcyBvZiB0aGUgZm9ybSB1c2VybmFtZUBkb21haW4udGxkXG5cdCAgICAgICAgICBpZiAoZW1haWxSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwibWFpbHRvOicgKyBwb3NzaWJsZVVybCArICdcIj4nICsgcG9zc2libGVVcmwgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIC8vIHVybCB0aGF0IGVuZHMgaW4gLmNvbSwgLm9yZyBvciAubmV0IHRoYXQgaXMgbm90IGFuIGVtYWlsIGFkZHJlc3Ncblx0ICAgICAgICAgIGlmICh0bGRSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovLycgKyBwb3NzaWJsZVVybCArICdcIicgKyBub0ZvbGxvd0F0dHIgKyAnPicgKyBwb3NzaWJsZVVybC5zdWJzdHIoMCwgbGVuZ3RoKSArICc8L2E+JztcblxuXHQgICAgICAgICAgcmV0dXJuIHdvcmQ7XG5cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiB3b3Jkcy5qb2luKCcnKTtcblx0ICAgIH0sXG5cblx0ICAgIHdvcmRjb3VudDogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHZhciB3b3JkcyA9IChzdHIpID8gc3RyLm1hdGNoKC9cXHcrL2cpIDogbnVsbDtcblx0ICAgICAgICByZXR1cm4gKHdvcmRzKSA/IHdvcmRzLmxlbmd0aCA6IG51bGw7XG5cdCAgICB9LFxuXG5cdCAgICAnZmxvYXQnOiBmdW5jdGlvbih2YWwsIGRlZikge1xuXHQgICAgICAgIHZhciByZXMgPSBwYXJzZUZsb2F0KHZhbCk7XG5cdCAgICAgICAgcmV0dXJuIGlzTmFOKHJlcykgPyBkZWYgOiByZXM7XG5cdCAgICB9LFxuXG5cdCAgICAnaW50JzogZnVuY3Rpb24odmFsLCBkZWYpIHtcblx0ICAgICAgICB2YXIgcmVzID0gcGFyc2VJbnQodmFsLCAxMCk7XG5cdCAgICAgICAgcmV0dXJuIGlzTmFOKHJlcykgPyBkZWYgOiByZXM7XG5cdCAgICB9XG5cdH07XG5cblx0Ly8gQWxpYXNlc1xuXHRmaWx0ZXJzLmQgPSBmaWx0ZXJzWydkZWZhdWx0J107XG5cdGZpbHRlcnMuZSA9IGZpbHRlcnMuZXNjYXBlO1xuXG5cdG1vZHVsZS5leHBvcnRzID0gZmlsdGVycztcblxuXG4vKioqLyB9KSxcbi8qIDggKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cdHZhciBPYmogPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDYpO1xuXG5cdC8vIEZyYW1lcyBrZWVwIHRyYWNrIG9mIHNjb3BpbmcgYm90aCBhdCBjb21waWxlLXRpbWUgYW5kIHJ1bi10aW1lIHNvXG5cdC8vIHdlIGtub3cgaG93IHRvIGFjY2VzcyB2YXJpYWJsZXMuIEJsb2NrIHRhZ3MgY2FuIGludHJvZHVjZSBzcGVjaWFsXG5cdC8vIHZhcmlhYmxlcywgZm9yIGV4YW1wbGUuXG5cdHZhciBGcmFtZSA9IE9iai5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24ocGFyZW50LCBpc29sYXRlV3JpdGVzKSB7XG5cdCAgICAgICAgdGhpcy52YXJpYWJsZXMgPSB7fTtcblx0ICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcblx0ICAgICAgICB0aGlzLnRvcExldmVsID0gZmFsc2U7XG5cdCAgICAgICAgLy8gaWYgdGhpcyBpcyB0cnVlLCB3cml0ZXMgKHNldCkgc2hvdWxkIG5ldmVyIHByb3BhZ2F0ZSB1cHdhcmRzIHBhc3Rcblx0ICAgICAgICAvLyB0aGlzIGZyYW1lIHRvIGl0cyBwYXJlbnQgKHRob3VnaCByZWFkcyBtYXkpLlxuXHQgICAgICAgIHRoaXMuaXNvbGF0ZVdyaXRlcyA9IGlzb2xhdGVXcml0ZXM7XG5cdCAgICB9LFxuXG5cdCAgICBzZXQ6IGZ1bmN0aW9uKG5hbWUsIHZhbCwgcmVzb2x2ZVVwKSB7XG5cdCAgICAgICAgLy8gQWxsb3cgdmFyaWFibGVzIHdpdGggZG90cyBieSBhdXRvbWF0aWNhbGx5IGNyZWF0aW5nIHRoZVxuXHQgICAgICAgIC8vIG5lc3RlZCBzdHJ1Y3R1cmVcblx0ICAgICAgICB2YXIgcGFydHMgPSBuYW1lLnNwbGl0KCcuJyk7XG5cdCAgICAgICAgdmFyIG9iaiA9IHRoaXMudmFyaWFibGVzO1xuXHQgICAgICAgIHZhciBmcmFtZSA9IHRoaXM7XG5cblx0ICAgICAgICBpZihyZXNvbHZlVXApIHtcblx0ICAgICAgICAgICAgaWYoKGZyYW1lID0gdGhpcy5yZXNvbHZlKHBhcnRzWzBdLCB0cnVlKSkpIHtcblx0ICAgICAgICAgICAgICAgIGZyYW1lLnNldChuYW1lLCB2YWwpO1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8cGFydHMubGVuZ3RoIC0gMTsgaSsrKSB7XG5cdCAgICAgICAgICAgIHZhciBpZCA9IHBhcnRzW2ldO1xuXG5cdCAgICAgICAgICAgIGlmKCFvYmpbaWRdKSB7XG5cdCAgICAgICAgICAgICAgICBvYmpbaWRdID0ge307XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgb2JqID0gb2JqW2lkXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBvYmpbcGFydHNbcGFydHMubGVuZ3RoIC0gMV1dID0gdmFsO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0OiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuXHQgICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBudWxsO1xuXHQgICAgfSxcblxuXHQgICAgbG9va3VwOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdmFyIHAgPSB0aGlzLnBhcmVudDtcblx0ICAgICAgICB2YXIgdmFsID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG5cdCAgICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHAgJiYgcC5sb29rdXAobmFtZSk7XG5cdCAgICB9LFxuXG5cdCAgICByZXNvbHZlOiBmdW5jdGlvbihuYW1lLCBmb3JXcml0ZSkge1xuXHQgICAgICAgIHZhciBwID0gKGZvcldyaXRlICYmIHRoaXMuaXNvbGF0ZVdyaXRlcykgPyB1bmRlZmluZWQgOiB0aGlzLnBhcmVudDtcblx0ICAgICAgICB2YXIgdmFsID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG5cdCAgICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBwICYmIHAucmVzb2x2ZShuYW1lKTtcblx0ICAgIH0sXG5cblx0ICAgIHB1c2g6IGZ1bmN0aW9uKGlzb2xhdGVXcml0ZXMpIHtcblx0ICAgICAgICByZXR1cm4gbmV3IEZyYW1lKHRoaXMsIGlzb2xhdGVXcml0ZXMpO1xuXHQgICAgfSxcblxuXHQgICAgcG9wOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQ7XG5cdCAgICB9XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIG1ha2VNYWNybyhhcmdOYW1lcywga3dhcmdOYW1lcywgZnVuYykge1xuXHQgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciBhcmdDb3VudCA9IG51bUFyZ3MoYXJndW1lbnRzKTtcblx0ICAgICAgICB2YXIgYXJncztcblx0ICAgICAgICB2YXIga3dhcmdzID0gZ2V0S2V5d29yZEFyZ3MoYXJndW1lbnRzKTtcblx0ICAgICAgICB2YXIgaTtcblxuXHQgICAgICAgIGlmKGFyZ0NvdW50ID4gYXJnTmFtZXMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIGFyZ05hbWVzLmxlbmd0aCk7XG5cblx0ICAgICAgICAgICAgLy8gUG9zaXRpb25hbCBhcmd1bWVudHMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIGluIGFzXG5cdCAgICAgICAgICAgIC8vIGtleXdvcmQgYXJndW1lbnRzIChlc3NlbnRpYWxseSBkZWZhdWx0IHZhbHVlcylcblx0ICAgICAgICAgICAgdmFyIHZhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIGFyZ3MubGVuZ3RoLCBhcmdDb3VudCk7XG5cdCAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IHZhbHMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIGlmKGkgPCBrd2FyZ05hbWVzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGt3YXJnc1trd2FyZ05hbWVzW2ldXSA9IHZhbHNbaV07XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihhcmdDb3VudCA8IGFyZ05hbWVzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBhcmdDb3VudCk7XG5cblx0ICAgICAgICAgICAgZm9yKGkgPSBhcmdDb3VudDsgaSA8IGFyZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJnTmFtZXNbaV07XG5cblx0ICAgICAgICAgICAgICAgIC8vIEtleXdvcmQgYXJndW1lbnRzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCBhc1xuXHQgICAgICAgICAgICAgICAgLy8gcG9zaXRpb25hbCBhcmd1bWVudHMsIGkuZS4gdGhlIGNhbGxlciBleHBsaWNpdGx5XG5cdCAgICAgICAgICAgICAgICAvLyB1c2VkIHRoZSBuYW1lIG9mIGEgcG9zaXRpb25hbCBhcmdcblx0ICAgICAgICAgICAgICAgIGFyZ3MucHVzaChrd2FyZ3NbYXJnXSk7XG5cdCAgICAgICAgICAgICAgICBkZWxldGUga3dhcmdzW2FyZ107XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG5cdCAgICB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gbWFrZUtleXdvcmRBcmdzKG9iaikge1xuXHQgICAgb2JqLl9fa2V5d29yZHMgPSB0cnVlO1xuXHQgICAgcmV0dXJuIG9iajtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldEtleXdvcmRBcmdzKGFyZ3MpIHtcblx0ICAgIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcblx0ICAgIGlmKGxlbikge1xuXHQgICAgICAgIHZhciBsYXN0QXJnID0gYXJnc1tsZW4gLSAxXTtcblx0ICAgICAgICBpZihsYXN0QXJnICYmIGxhc3RBcmcuaGFzT3duUHJvcGVydHkoJ19fa2V5d29yZHMnKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gbGFzdEFyZztcblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICByZXR1cm4ge307XG5cdH1cblxuXHRmdW5jdGlvbiBudW1BcmdzKGFyZ3MpIHtcblx0ICAgIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcblx0ICAgIGlmKGxlbiA9PT0gMCkge1xuXHQgICAgICAgIHJldHVybiAwO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgbGFzdEFyZyA9IGFyZ3NbbGVuIC0gMV07XG5cdCAgICBpZihsYXN0QXJnICYmIGxhc3RBcmcuaGFzT3duUHJvcGVydHkoJ19fa2V5d29yZHMnKSkge1xuXHQgICAgICAgIHJldHVybiBsZW4gLSAxO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIGxlbjtcblx0ICAgIH1cblx0fVxuXG5cdC8vIEEgU2FmZVN0cmluZyBvYmplY3QgaW5kaWNhdGVzIHRoYXQgdGhlIHN0cmluZyBzaG91bGQgbm90IGJlXG5cdC8vIGF1dG9lc2NhcGVkLiBUaGlzIGhhcHBlbnMgbWFnaWNhbGx5IGJlY2F1c2UgYXV0b2VzY2FwaW5nIG9ubHlcblx0Ly8gb2NjdXJzIG9uIHByaW1pdGl2ZSBzdHJpbmcgb2JqZWN0cy5cblx0ZnVuY3Rpb24gU2FmZVN0cmluZyh2YWwpIHtcblx0ICAgIGlmKHR5cGVvZiB2YWwgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgIH1cblxuXHQgICAgdGhpcy52YWwgPSB2YWw7XG5cdCAgICB0aGlzLmxlbmd0aCA9IHZhbC5sZW5ndGg7XG5cdH1cblxuXHRTYWZlU3RyaW5nLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3RyaW5nLnByb3RvdHlwZSwge1xuXHQgICAgbGVuZ3RoOiB7IHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHZhbHVlOiAwIH1cblx0fSk7XG5cdFNhZmVTdHJpbmcucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbigpIHtcblx0ICAgIHJldHVybiB0aGlzLnZhbDtcblx0fTtcblx0U2FmZVN0cmluZy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0ICAgIHJldHVybiB0aGlzLnZhbDtcblx0fTtcblxuXHRmdW5jdGlvbiBjb3B5U2FmZW5lc3MoZGVzdCwgdGFyZ2V0KSB7XG5cdCAgICBpZihkZXN0IGluc3RhbmNlb2YgU2FmZVN0cmluZykge1xuXHQgICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyh0YXJnZXQpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHRhcmdldC50b1N0cmluZygpO1xuXHR9XG5cblx0ZnVuY3Rpb24gbWFya1NhZmUodmFsKSB7XG5cdCAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG5cblx0ICAgIGlmKHR5cGUgPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBTYWZlU3RyaW5nKHZhbCk7XG5cdCAgICB9XG5cdCAgICBlbHNlIGlmKHR5cGUgIT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICB2YXIgcmV0ID0gdmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cblx0ICAgICAgICAgICAgaWYodHlwZW9mIHJldCA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyhyZXQpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHJldDtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gc3VwcHJlc3NWYWx1ZSh2YWwsIGF1dG9lc2NhcGUpIHtcblx0ICAgIHZhbCA9ICh2YWwgIT09IHVuZGVmaW5lZCAmJiB2YWwgIT09IG51bGwpID8gdmFsIDogJyc7XG5cblx0ICAgIGlmKGF1dG9lc2NhcGUgJiYgISh2YWwgaW5zdGFuY2VvZiBTYWZlU3RyaW5nKSkge1xuXHQgICAgICAgIHZhbCA9IGxpYi5lc2NhcGUodmFsLnRvU3RyaW5nKCkpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gdmFsO1xuXHR9XG5cblx0ZnVuY3Rpb24gZW5zdXJlRGVmaW5lZCh2YWwsIGxpbmVubywgY29sbm8pIHtcblx0ICAgIGlmKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcihcblx0ICAgICAgICAgICAgJ2F0dGVtcHRlZCB0byBvdXRwdXQgbnVsbCBvciB1bmRlZmluZWQgdmFsdWUnLFxuXHQgICAgICAgICAgICBsaW5lbm8gKyAxLFxuXHQgICAgICAgICAgICBjb2xubyArIDFcblx0ICAgICAgICApO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHZhbDtcblx0fVxuXG5cdGZ1bmN0aW9uIG1lbWJlckxvb2t1cChvYmosIHZhbCkge1xuXHQgICAgb2JqID0gb2JqIHx8IHt9O1xuXG5cdCAgICBpZih0eXBlb2Ygb2JqW3ZhbF0gPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBvYmpbdmFsXS5hcHBseShvYmosIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIG9ialt2YWxdO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2FsbFdyYXAob2JqLCBuYW1lLCBjb250ZXh0LCBhcmdzKSB7XG5cdCAgICBpZighb2JqKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY2FsbCBgJyArIG5hbWUgKyAnYCwgd2hpY2ggaXMgdW5kZWZpbmVkIG9yIGZhbHNleScpO1xuXHQgICAgfVxuXHQgICAgZWxzZSBpZih0eXBlb2Ygb2JqICE9PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY2FsbCBgJyArIG5hbWUgKyAnYCwgd2hpY2ggaXMgbm90IGEgZnVuY3Rpb24nKTtcblx0ICAgIH1cblxuXHQgICAgLy8ganNoaW50IHZhbGlkdGhpczogdHJ1ZVxuXHQgICAgcmV0dXJuIG9iai5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBuYW1lKSB7XG5cdCAgICB2YXIgdmFsID0gZnJhbWUubG9va3VwKG5hbWUpO1xuXHQgICAgcmV0dXJuICh2YWwgIT09IHVuZGVmaW5lZCkgP1xuXHQgICAgICAgIHZhbCA6XG5cdCAgICAgICAgY29udGV4dC5sb29rdXAobmFtZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVFcnJvcihlcnJvciwgbGluZW5vLCBjb2xubykge1xuXHQgICAgaWYoZXJyb3IubGluZW5vKSB7XG5cdCAgICAgICAgcmV0dXJuIGVycm9yO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBsaWIuVGVtcGxhdGVFcnJvcihlcnJvciwgbGluZW5vLCBjb2xubyk7XG5cdCAgICB9XG5cdH1cblxuXHRmdW5jdGlvbiBhc3luY0VhY2goYXJyLCBkaW1lbiwgaXRlciwgY2IpIHtcblx0ICAgIGlmKGxpYi5pc0FycmF5KGFycikpIHtcblx0ICAgICAgICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcblxuXHQgICAgICAgIGxpYi5hc3luY0l0ZXIoYXJyLCBmdW5jdGlvbihpdGVtLCBpLCBuZXh0KSB7XG5cdCAgICAgICAgICAgIHN3aXRjaChkaW1lbikge1xuXHQgICAgICAgICAgICBjYXNlIDE6IGl0ZXIoaXRlbSwgaSwgbGVuLCBuZXh0KTsgYnJlYWs7XG5cdCAgICAgICAgICAgIGNhc2UgMjogaXRlcihpdGVtWzBdLCBpdGVtWzFdLCBpLCBsZW4sIG5leHQpOyBicmVhaztcblx0ICAgICAgICAgICAgY2FzZSAzOiBpdGVyKGl0ZW1bMF0sIGl0ZW1bMV0sIGl0ZW1bMl0sIGksIGxlbiwgbmV4dCk7IGJyZWFrO1xuXHQgICAgICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICAgICAgaXRlbS5wdXNoKGksIG5leHQpO1xuXHQgICAgICAgICAgICAgICAgaXRlci5hcHBseSh0aGlzLCBpdGVtKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0sIGNiKTtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIGxpYi5hc3luY0ZvcihhcnIsIGZ1bmN0aW9uKGtleSwgdmFsLCBpLCBsZW4sIG5leHQpIHtcblx0ICAgICAgICAgICAgaXRlcihrZXksIHZhbCwgaSwgbGVuLCBuZXh0KTtcblx0ICAgICAgICB9LCBjYik7XG5cdCAgICB9XG5cdH1cblxuXHRmdW5jdGlvbiBhc3luY0FsbChhcnIsIGRpbWVuLCBmdW5jLCBjYikge1xuXHQgICAgdmFyIGZpbmlzaGVkID0gMDtcblx0ICAgIHZhciBsZW4sIGk7XG5cdCAgICB2YXIgb3V0cHV0QXJyO1xuXG5cdCAgICBmdW5jdGlvbiBkb25lKGksIG91dHB1dCkge1xuXHQgICAgICAgIGZpbmlzaGVkKys7XG5cdCAgICAgICAgb3V0cHV0QXJyW2ldID0gb3V0cHV0O1xuXG5cdCAgICAgICAgaWYoZmluaXNoZWQgPT09IGxlbikge1xuXHQgICAgICAgICAgICBjYihudWxsLCBvdXRwdXRBcnIuam9pbignJykpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgaWYobGliLmlzQXJyYXkoYXJyKSkge1xuXHQgICAgICAgIGxlbiA9IGFyci5sZW5ndGg7XG5cdCAgICAgICAgb3V0cHV0QXJyID0gbmV3IEFycmF5KGxlbik7XG5cblx0ICAgICAgICBpZihsZW4gPT09IDApIHtcblx0ICAgICAgICAgICAgY2IobnVsbCwgJycpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IGFycltpXTtcblxuXHQgICAgICAgICAgICAgICAgc3dpdGNoKGRpbWVuKSB7XG5cdCAgICAgICAgICAgICAgICBjYXNlIDE6IGZ1bmMoaXRlbSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICBjYXNlIDI6IGZ1bmMoaXRlbVswXSwgaXRlbVsxXSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICBjYXNlIDM6IGZ1bmMoaXRlbVswXSwgaXRlbVsxXSwgaXRlbVsyXSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICAgICAgICAgIGl0ZW0ucHVzaChpLCBkb25lKTtcblx0ICAgICAgICAgICAgICAgICAgICAvLyBqc2hpbnQgdmFsaWR0aGlzOiB0cnVlXG5cdCAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseSh0aGlzLCBpdGVtKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHZhciBrZXlzID0gbGliLmtleXMoYXJyKTtcblx0ICAgICAgICBsZW4gPSBrZXlzLmxlbmd0aDtcblx0ICAgICAgICBvdXRwdXRBcnIgPSBuZXcgQXJyYXkobGVuKTtcblxuXHQgICAgICAgIGlmKGxlbiA9PT0gMCkge1xuXHQgICAgICAgICAgICBjYihudWxsLCAnJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgayA9IGtleXNbaV07XG5cdCAgICAgICAgICAgICAgICBmdW5jKGssIGFycltrXSwgaSwgbGVuLCBkb25lKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgIH1cblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzID0ge1xuXHQgICAgRnJhbWU6IEZyYW1lLFxuXHQgICAgbWFrZU1hY3JvOiBtYWtlTWFjcm8sXG5cdCAgICBtYWtlS2V5d29yZEFyZ3M6IG1ha2VLZXl3b3JkQXJncyxcblx0ICAgIG51bUFyZ3M6IG51bUFyZ3MsXG5cdCAgICBzdXBwcmVzc1ZhbHVlOiBzdXBwcmVzc1ZhbHVlLFxuXHQgICAgZW5zdXJlRGVmaW5lZDogZW5zdXJlRGVmaW5lZCxcblx0ICAgIG1lbWJlckxvb2t1cDogbWVtYmVyTG9va3VwLFxuXHQgICAgY29udGV4dE9yRnJhbWVMb29rdXA6IGNvbnRleHRPckZyYW1lTG9va3VwLFxuXHQgICAgY2FsbFdyYXA6IGNhbGxXcmFwLFxuXHQgICAgaGFuZGxlRXJyb3I6IGhhbmRsZUVycm9yLFxuXHQgICAgaXNBcnJheTogbGliLmlzQXJyYXksXG5cdCAgICBrZXlzOiBsaWIua2V5cyxcblx0ICAgIFNhZmVTdHJpbmc6IFNhZmVTdHJpbmcsXG5cdCAgICBjb3B5U2FmZW5lc3M6IGNvcHlTYWZlbmVzcyxcblx0ICAgIG1hcmtTYWZlOiBtYXJrU2FmZSxcblx0ICAgIGFzeW5jRWFjaDogYXN5bmNFYWNoLFxuXHQgICAgYXN5bmNBbGw6IGFzeW5jQWxsLFxuXHQgICAgaW5PcGVyYXRvcjogbGliLmluT3BlcmF0b3Jcblx0fTtcblxuXG4vKioqLyB9KSxcbi8qIDkgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0ZnVuY3Rpb24gY3ljbGVyKGl0ZW1zKSB7XG5cdCAgICB2YXIgaW5kZXggPSAtMTtcblxuXHQgICAgcmV0dXJuIHtcblx0ICAgICAgICBjdXJyZW50OiBudWxsLFxuXHQgICAgICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgaW5kZXggPSAtMTtcblx0ICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gbnVsbDtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIGluZGV4Kys7XG5cdCAgICAgICAgICAgIGlmKGluZGV4ID49IGl0ZW1zLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgaW5kZXggPSAwO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gaXRlbXNbaW5kZXhdO1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50O1xuXHQgICAgICAgIH0sXG5cdCAgICB9O1xuXG5cdH1cblxuXHRmdW5jdGlvbiBqb2luZXIoc2VwKSB7XG5cdCAgICBzZXAgPSBzZXAgfHwgJywnO1xuXHQgICAgdmFyIGZpcnN0ID0gdHJ1ZTtcblxuXHQgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciB2YWwgPSBmaXJzdCA/ICcnIDogc2VwO1xuXHQgICAgICAgIGZpcnN0ID0gZmFsc2U7XG5cdCAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgIH07XG5cdH1cblxuXHQvLyBNYWtpbmcgdGhpcyBhIGZ1bmN0aW9uIGluc3RlYWQgc28gaXQgcmV0dXJucyBhIG5ldyBvYmplY3Rcblx0Ly8gZWFjaCB0aW1lIGl0J3MgY2FsbGVkLiBUaGF0IHdheSwgaWYgc29tZXRoaW5nIGxpa2UgYW4gZW52aXJvbm1lbnRcblx0Ly8gdXNlcyBpdCwgdGhleSB3aWxsIGVhY2ggaGF2ZSB0aGVpciBvd24gY29weS5cblx0ZnVuY3Rpb24gZ2xvYmFscygpIHtcblx0ICAgIHJldHVybiB7XG5cdCAgICAgICAgcmFuZ2U6IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG5cdCAgICAgICAgICAgIGlmKHR5cGVvZiBzdG9wID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgICAgICAgICAgc3RvcCA9IHN0YXJ0O1xuXHQgICAgICAgICAgICAgICAgc3RhcnQgPSAwO1xuXHQgICAgICAgICAgICAgICAgc3RlcCA9IDE7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZighc3RlcCkge1xuXHQgICAgICAgICAgICAgICAgc3RlcCA9IDE7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB2YXIgYXJyID0gW107XG5cdCAgICAgICAgICAgIHZhciBpO1xuXHQgICAgICAgICAgICBpZiAoc3RlcCA+IDApIHtcblx0ICAgICAgICAgICAgICAgIGZvciAoaT1zdGFydDsgaTxzdG9wOyBpKz1zdGVwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goaSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKGk9c3RhcnQ7IGk+c3RvcDsgaSs9c3RlcCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGFyci5wdXNoKGkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBhcnI7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8vIGxpcHN1bTogZnVuY3Rpb24obiwgaHRtbCwgbWluLCBtYXgpIHtcblx0ICAgICAgICAvLyB9LFxuXG5cdCAgICAgICAgY3ljbGVyOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGN5Y2xlcihBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgam9pbmVyOiBmdW5jdGlvbihzZXApIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGpvaW5lcihzZXApO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IGdsb2JhbHM7XG5cblxuLyoqKi8gfSksXG4vKiAxMCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdHZhciBfX1dFQlBBQ0tfQU1EX0RFRklORV9BUlJBWV9fLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXzsvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi8oZnVuY3Rpb24oc2V0SW1tZWRpYXRlLCBwcm9jZXNzKSB7Ly8gTUlUIGxpY2Vuc2UgKGJ5IEVsYW4gU2hhbmtlcikuXG5cdChmdW5jdGlvbihnbG9iYWxzKSB7XG5cdCAgJ3VzZSBzdHJpY3QnO1xuXG5cdCAgdmFyIGV4ZWN1dGVTeW5jID0gZnVuY3Rpb24oKXtcblx0ICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblx0ICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ2Z1bmN0aW9uJyl7XG5cdCAgICAgIGFyZ3NbMF0uYXBwbHkobnVsbCwgYXJncy5zcGxpY2UoMSkpO1xuXHQgICAgfVxuXHQgIH07XG5cblx0ICB2YXIgZXhlY3V0ZUFzeW5jID0gZnVuY3Rpb24oZm4pe1xuXHQgICAgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgc2V0SW1tZWRpYXRlKGZuKTtcblx0ICAgIH0gZWxzZSBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MubmV4dFRpY2spIHtcblx0ICAgICAgcHJvY2Vzcy5uZXh0VGljayhmbik7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcblx0ICAgIH1cblx0ICB9O1xuXG5cdCAgdmFyIG1ha2VJdGVyYXRvciA9IGZ1bmN0aW9uICh0YXNrcykge1xuXHQgICAgdmFyIG1ha2VDYWxsYmFjayA9IGZ1bmN0aW9uIChpbmRleCkge1xuXHQgICAgICB2YXIgZm4gPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCkge1xuXHQgICAgICAgICAgdGFza3NbaW5kZXhdLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBmbi5uZXh0KCk7XG5cdCAgICAgIH07XG5cdCAgICAgIGZuLm5leHQgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgcmV0dXJuIChpbmRleCA8IHRhc2tzLmxlbmd0aCAtIDEpID8gbWFrZUNhbGxiYWNrKGluZGV4ICsgMSk6IG51bGw7XG5cdCAgICAgIH07XG5cdCAgICAgIHJldHVybiBmbjtcblx0ICAgIH07XG5cdCAgICByZXR1cm4gbWFrZUNhbGxiYWNrKDApO1xuXHQgIH07XG5cdCAgXG5cdCAgdmFyIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihtYXliZUFycmF5KXtcblx0ICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobWF5YmVBcnJheSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG5cdCAgfTtcblxuXHQgIHZhciB3YXRlcmZhbGwgPSBmdW5jdGlvbiAodGFza3MsIGNhbGxiYWNrLCBmb3JjZUFzeW5jKSB7XG5cdCAgICB2YXIgbmV4dFRpY2sgPSBmb3JjZUFzeW5jID8gZXhlY3V0ZUFzeW5jIDogZXhlY3V0ZVN5bmM7XG5cdCAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuXHQgICAgaWYgKCFfaXNBcnJheSh0YXNrcykpIHtcblx0ICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgdG8gd2F0ZXJmYWxsIG11c3QgYmUgYW4gYXJyYXkgb2YgZnVuY3Rpb25zJyk7XG5cdCAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuXHQgICAgfVxuXHQgICAgaWYgKCF0YXNrcy5sZW5ndGgpIHtcblx0ICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG5cdCAgICB9XG5cdCAgICB2YXIgd3JhcEl0ZXJhdG9yID0gZnVuY3Rpb24gKGl0ZXJhdG9yKSB7XG5cdCAgICAgIHJldHVybiBmdW5jdGlvbiAoZXJyKSB7XG5cdCAgICAgICAgaWYgKGVycikge1xuXHQgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcblx0ICAgICAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge307XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0ICAgICAgICAgIHZhciBuZXh0ID0gaXRlcmF0b3IubmV4dCgpO1xuXHQgICAgICAgICAgaWYgKG5leHQpIHtcblx0ICAgICAgICAgICAgYXJncy5wdXNoKHdyYXBJdGVyYXRvcihuZXh0KSk7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBhcmdzLnB1c2goY2FsbGJhY2spO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgICAgbmV4dFRpY2soZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICBpdGVyYXRvci5hcHBseShudWxsLCBhcmdzKTtcblx0ICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfTtcblx0ICAgIH07XG5cdCAgICB3cmFwSXRlcmF0b3IobWFrZUl0ZXJhdG9yKHRhc2tzKSkoKTtcblx0ICB9O1xuXG5cdCAgaWYgKHRydWUpIHtcblx0ICAgICEoX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXyA9IFtdLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgcmV0dXJuIHdhdGVyZmFsbDtcblx0ICAgIH0uYXBwbHkoZXhwb3J0cywgX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXyksIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fICE9PSB1bmRlZmluZWQgJiYgKG1vZHVsZS5leHBvcnRzID0gX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18pKTsgLy8gUmVxdWlyZUpTXG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSB3YXRlcmZhbGw7IC8vIENvbW1vbkpTXG5cdCAgfSBlbHNlIHtcblx0ICAgIGdsb2JhbHMud2F0ZXJmYWxsID0gd2F0ZXJmYWxsOyAvLyA8c2NyaXB0PlxuXHQgIH1cblx0fSkodGhpcyk7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18oMTEpLnNldEltbWVkaWF0ZSwgX193ZWJwYWNrX3JlcXVpcmVfXygxMykpKVxuXG4vKioqLyB9KSxcbi8qIDExICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xuXG5cdC8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cblx0ZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG5cdCAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0VGltZW91dCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhclRpbWVvdXQpO1xuXHR9O1xuXHRleHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG5cdCAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0SW50ZXJ2YWwsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG5cdH07XG5cdGV4cG9ydHMuY2xlYXJUaW1lb3V0ID1cblx0ZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkge1xuXHQgIGlmICh0aW1lb3V0KSB7XG5cdCAgICB0aW1lb3V0LmNsb3NlKCk7XG5cdCAgfVxuXHR9O1xuXG5cdGZ1bmN0aW9uIFRpbWVvdXQoaWQsIGNsZWFyRm4pIHtcblx0ICB0aGlzLl9pZCA9IGlkO1xuXHQgIHRoaXMuX2NsZWFyRm4gPSBjbGVhckZuO1xuXHR9XG5cdFRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblx0VGltZW91dC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcblx0ICB0aGlzLl9jbGVhckZuLmNhbGwod2luZG93LCB0aGlzLl9pZCk7XG5cdH07XG5cblx0Ly8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5cdGV4cG9ydHMuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSwgbXNlY3MpIHtcblx0ICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cdCAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcblx0fTtcblxuXHRleHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuXHQgIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblx0ICBpdGVtLl9pZGxlVGltZW91dCA9IC0xO1xuXHR9O1xuXG5cdGV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG5cdCAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXG5cdCAgdmFyIG1zZWNzID0gaXRlbS5faWRsZVRpbWVvdXQ7XG5cdCAgaWYgKG1zZWNzID49IDApIHtcblx0ICAgIGl0ZW0uX2lkbGVUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIG9uVGltZW91dCgpIHtcblx0ICAgICAgaWYgKGl0ZW0uX29uVGltZW91dClcblx0ICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcblx0ICAgIH0sIG1zZWNzKTtcblx0ICB9XG5cdH07XG5cblx0Ly8gc2V0aW1tZWRpYXRlIGF0dGFjaGVzIGl0c2VsZiB0byB0aGUgZ2xvYmFsIG9iamVjdFxuXHRfX3dlYnBhY2tfcmVxdWlyZV9fKDEyKTtcblx0ZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSBzZXRJbW1lZGlhdGU7XG5cdGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSBjbGVhckltbWVkaWF0ZTtcblxuXG4vKioqLyB9KSxcbi8qIDEyICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovKGZ1bmN0aW9uKGdsb2JhbCwgcHJvY2VzcykgeyhmdW5jdGlvbiAoZ2xvYmFsLCB1bmRlZmluZWQpIHtcblx0ICAgIFwidXNlIHN0cmljdFwiO1xuXG5cdCAgICBpZiAoZ2xvYmFsLnNldEltbWVkaWF0ZSkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgdmFyIG5leHRIYW5kbGUgPSAxOyAvLyBTcGVjIHNheXMgZ3JlYXRlciB0aGFuIHplcm9cblx0ICAgIHZhciB0YXNrc0J5SGFuZGxlID0ge307XG5cdCAgICB2YXIgY3VycmVudGx5UnVubmluZ0FUYXNrID0gZmFsc2U7XG5cdCAgICB2YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xuXHQgICAgdmFyIHJlZ2lzdGVySW1tZWRpYXRlO1xuXG5cdCAgICBmdW5jdGlvbiBzZXRJbW1lZGlhdGUoY2FsbGJhY2spIHtcblx0ICAgICAgLy8gQ2FsbGJhY2sgY2FuIGVpdGhlciBiZSBhIGZ1bmN0aW9uIG9yIGEgc3RyaW5nXG5cdCAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuXHQgICAgICAgIGNhbGxiYWNrID0gbmV3IEZ1bmN0aW9uKFwiXCIgKyBjYWxsYmFjayk7XG5cdCAgICAgIH1cblx0ICAgICAgLy8gQ29weSBmdW5jdGlvbiBhcmd1bWVudHNcblx0ICAgICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuXHQgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdO1xuXHQgICAgICB9XG5cdCAgICAgIC8vIFN0b3JlIGFuZCByZWdpc3RlciB0aGUgdGFza1xuXHQgICAgICB2YXIgdGFzayA9IHsgY2FsbGJhY2s6IGNhbGxiYWNrLCBhcmdzOiBhcmdzIH07XG5cdCAgICAgIHRhc2tzQnlIYW5kbGVbbmV4dEhhbmRsZV0gPSB0YXNrO1xuXHQgICAgICByZWdpc3RlckltbWVkaWF0ZShuZXh0SGFuZGxlKTtcblx0ICAgICAgcmV0dXJuIG5leHRIYW5kbGUrKztcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gY2xlYXJJbW1lZGlhdGUoaGFuZGxlKSB7XG5cdCAgICAgICAgZGVsZXRlIHRhc2tzQnlIYW5kbGVbaGFuZGxlXTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gcnVuKHRhc2spIHtcblx0ICAgICAgICB2YXIgY2FsbGJhY2sgPSB0YXNrLmNhbGxiYWNrO1xuXHQgICAgICAgIHZhciBhcmdzID0gdGFzay5hcmdzO1xuXHQgICAgICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcblx0ICAgICAgICBjYXNlIDA6XG5cdCAgICAgICAgICAgIGNhbGxiYWNrKCk7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgIGNhc2UgMTpcblx0ICAgICAgICAgICAgY2FsbGJhY2soYXJnc1swXSk7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgIGNhc2UgMjpcblx0ICAgICAgICAgICAgY2FsbGJhY2soYXJnc1swXSwgYXJnc1sxXSk7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgIGNhc2UgMzpcblx0ICAgICAgICAgICAgY2FsbGJhY2soYXJnc1swXSwgYXJnc1sxXSwgYXJnc1syXSk7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgIGRlZmF1bHQ6XG5cdCAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHVuZGVmaW5lZCwgYXJncyk7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gcnVuSWZQcmVzZW50KGhhbmRsZSkge1xuXHQgICAgICAgIC8vIEZyb20gdGhlIHNwZWM6IFwiV2FpdCB1bnRpbCBhbnkgaW52b2NhdGlvbnMgb2YgdGhpcyBhbGdvcml0aG0gc3RhcnRlZCBiZWZvcmUgdGhpcyBvbmUgaGF2ZSBjb21wbGV0ZWQuXCJcblx0ICAgICAgICAvLyBTbyBpZiB3ZSdyZSBjdXJyZW50bHkgcnVubmluZyBhIHRhc2ssIHdlJ2xsIG5lZWQgdG8gZGVsYXkgdGhpcyBpbnZvY2F0aW9uLlxuXHQgICAgICAgIGlmIChjdXJyZW50bHlSdW5uaW5nQVRhc2spIHtcblx0ICAgICAgICAgICAgLy8gRGVsYXkgYnkgZG9pbmcgYSBzZXRUaW1lb3V0LiBzZXRJbW1lZGlhdGUgd2FzIHRyaWVkIGluc3RlYWQsIGJ1dCBpbiBGaXJlZm94IDcgaXQgZ2VuZXJhdGVkIGFcblx0ICAgICAgICAgICAgLy8gXCJ0b28gbXVjaCByZWN1cnNpb25cIiBlcnJvci5cblx0ICAgICAgICAgICAgc2V0VGltZW91dChydW5JZlByZXNlbnQsIDAsIGhhbmRsZSk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHRhc2sgPSB0YXNrc0J5SGFuZGxlW2hhbmRsZV07XG5cdCAgICAgICAgICAgIGlmICh0YXNrKSB7XG5cdCAgICAgICAgICAgICAgICBjdXJyZW50bHlSdW5uaW5nQVRhc2sgPSB0cnVlO1xuXHQgICAgICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgICAgICBydW4odGFzayk7XG5cdCAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuXHQgICAgICAgICAgICAgICAgICAgIGNsZWFySW1tZWRpYXRlKGhhbmRsZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgY3VycmVudGx5UnVubmluZ0FUYXNrID0gZmFsc2U7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGluc3RhbGxOZXh0VGlja0ltcGxlbWVudGF0aW9uKCkge1xuXHQgICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG5cdCAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkgeyBydW5JZlByZXNlbnQoaGFuZGxlKTsgfSk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gY2FuVXNlUG9zdE1lc3NhZ2UoKSB7XG5cdCAgICAgICAgLy8gVGhlIHRlc3QgYWdhaW5zdCBgaW1wb3J0U2NyaXB0c2AgcHJldmVudHMgdGhpcyBpbXBsZW1lbnRhdGlvbiBmcm9tIGJlaW5nIGluc3RhbGxlZCBpbnNpZGUgYSB3ZWIgd29ya2VyLFxuXHQgICAgICAgIC8vIHdoZXJlIGBnbG9iYWwucG9zdE1lc3NhZ2VgIG1lYW5zIHNvbWV0aGluZyBjb21wbGV0ZWx5IGRpZmZlcmVudCBhbmQgY2FuJ3QgYmUgdXNlZCBmb3IgdGhpcyBwdXJwb3NlLlxuXHQgICAgICAgIGlmIChnbG9iYWwucG9zdE1lc3NhZ2UgJiYgIWdsb2JhbC5pbXBvcnRTY3JpcHRzKSB7XG5cdCAgICAgICAgICAgIHZhciBwb3N0TWVzc2FnZUlzQXN5bmNocm9ub3VzID0gdHJ1ZTtcblx0ICAgICAgICAgICAgdmFyIG9sZE9uTWVzc2FnZSA9IGdsb2JhbC5vbm1lc3NhZ2U7XG5cdCAgICAgICAgICAgIGdsb2JhbC5vbm1lc3NhZ2UgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlSXNBc3luY2hyb25vdXMgPSBmYWxzZTtcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgZ2xvYmFsLnBvc3RNZXNzYWdlKFwiXCIsIFwiKlwiKTtcblx0ICAgICAgICAgICAgZ2xvYmFsLm9ubWVzc2FnZSA9IG9sZE9uTWVzc2FnZTtcblx0ICAgICAgICAgICAgcmV0dXJuIHBvc3RNZXNzYWdlSXNBc3luY2hyb25vdXM7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBpbnN0YWxsUG9zdE1lc3NhZ2VJbXBsZW1lbnRhdGlvbigpIHtcblx0ICAgICAgICAvLyBJbnN0YWxscyBhbiBldmVudCBoYW5kbGVyIG9uIGBnbG9iYWxgIGZvciB0aGUgYG1lc3NhZ2VgIGV2ZW50OiBzZWVcblx0ICAgICAgICAvLyAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0RPTS93aW5kb3cucG9zdE1lc3NhZ2Vcblx0ICAgICAgICAvLyAqIGh0dHA6Ly93d3cud2hhdHdnLm9yZy9zcGVjcy93ZWItYXBwcy9jdXJyZW50LXdvcmsvbXVsdGlwYWdlL2NvbW1zLmh0bWwjY3Jvc3NEb2N1bWVudE1lc3NhZ2VzXG5cblx0ICAgICAgICB2YXIgbWVzc2FnZVByZWZpeCA9IFwic2V0SW1tZWRpYXRlJFwiICsgTWF0aC5yYW5kb20oKSArIFwiJFwiO1xuXHQgICAgICAgIHZhciBvbkdsb2JhbE1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICAgICAgICBpZiAoZXZlbnQuc291cmNlID09PSBnbG9iYWwgJiZcblx0ICAgICAgICAgICAgICAgIHR5cGVvZiBldmVudC5kYXRhID09PSBcInN0cmluZ1wiICYmXG5cdCAgICAgICAgICAgICAgICBldmVudC5kYXRhLmluZGV4T2YobWVzc2FnZVByZWZpeCkgPT09IDApIHtcblx0ICAgICAgICAgICAgICAgIHJ1bklmUHJlc2VudCgrZXZlbnQuZGF0YS5zbGljZShtZXNzYWdlUHJlZml4Lmxlbmd0aCkpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIGlmIChnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuXHQgICAgICAgICAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgb25HbG9iYWxNZXNzYWdlLCBmYWxzZSk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgZ2xvYmFsLmF0dGFjaEV2ZW50KFwib25tZXNzYWdlXCIsIG9uR2xvYmFsTWVzc2FnZSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcblx0ICAgICAgICAgICAgZ2xvYmFsLnBvc3RNZXNzYWdlKG1lc3NhZ2VQcmVmaXggKyBoYW5kbGUsIFwiKlwiKTtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBpbnN0YWxsTWVzc2FnZUNoYW5uZWxJbXBsZW1lbnRhdGlvbigpIHtcblx0ICAgICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuXHQgICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgICAgICAgICAgdmFyIGhhbmRsZSA9IGV2ZW50LmRhdGE7XG5cdCAgICAgICAgICAgIHJ1bklmUHJlc2VudChoYW5kbGUpO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICByZWdpc3RlckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuXHQgICAgICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKGhhbmRsZSk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gaW5zdGFsbFJlYWR5U3RhdGVDaGFuZ2VJbXBsZW1lbnRhdGlvbigpIHtcblx0ICAgICAgICB2YXIgaHRtbCA9IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG5cdCAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcblx0ICAgICAgICAgICAgLy8gQ3JlYXRlIGEgPHNjcmlwdD4gZWxlbWVudDsgaXRzIHJlYWR5c3RhdGVjaGFuZ2UgZXZlbnQgd2lsbCBiZSBmaXJlZCBhc3luY2hyb25vdXNseSBvbmNlIGl0IGlzIGluc2VydGVkXG5cdCAgICAgICAgICAgIC8vIGludG8gdGhlIGRvY3VtZW50LiBEbyBzbywgdGh1cyBxdWV1aW5nIHVwIHRoZSB0YXNrLiBSZW1lbWJlciB0byBjbGVhbiB1cCBvbmNlIGl0J3MgYmVlbiBjYWxsZWQuXG5cdCAgICAgICAgICAgIHZhciBzY3JpcHQgPSBkb2MuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcblx0ICAgICAgICAgICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHJ1bklmUHJlc2VudChoYW5kbGUpO1xuXHQgICAgICAgICAgICAgICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG5cdCAgICAgICAgICAgICAgICBodG1sLnJlbW92ZUNoaWxkKHNjcmlwdCk7XG5cdCAgICAgICAgICAgICAgICBzY3JpcHQgPSBudWxsO1xuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICBodG1sLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gaW5zdGFsbFNldFRpbWVvdXRJbXBsZW1lbnRhdGlvbigpIHtcblx0ICAgICAgICByZWdpc3RlckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuXHQgICAgICAgICAgICBzZXRUaW1lb3V0KHJ1bklmUHJlc2VudCwgMCwgaGFuZGxlKTtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICAvLyBJZiBzdXBwb3J0ZWQsIHdlIHNob3VsZCBhdHRhY2ggdG8gdGhlIHByb3RvdHlwZSBvZiBnbG9iYWwsIHNpbmNlIHRoYXQgaXMgd2hlcmUgc2V0VGltZW91dCBldCBhbC4gbGl2ZS5cblx0ICAgIHZhciBhdHRhY2hUbyA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZ2xvYmFsKTtcblx0ICAgIGF0dGFjaFRvID0gYXR0YWNoVG8gJiYgYXR0YWNoVG8uc2V0VGltZW91dCA/IGF0dGFjaFRvIDogZ2xvYmFsO1xuXG5cdCAgICAvLyBEb24ndCBnZXQgZm9vbGVkIGJ5IGUuZy4gYnJvd3NlcmlmeSBlbnZpcm9ubWVudHMuXG5cdCAgICBpZiAoe30udG9TdHJpbmcuY2FsbChnbG9iYWwucHJvY2VzcykgPT09IFwiW29iamVjdCBwcm9jZXNzXVwiKSB7XG5cdCAgICAgICAgLy8gRm9yIE5vZGUuanMgYmVmb3JlIDAuOVxuXHQgICAgICAgIGluc3RhbGxOZXh0VGlja0ltcGxlbWVudGF0aW9uKCk7XG5cblx0ICAgIH0gZWxzZSBpZiAoY2FuVXNlUG9zdE1lc3NhZ2UoKSkge1xuXHQgICAgICAgIC8vIEZvciBub24tSUUxMCBtb2Rlcm4gYnJvd3NlcnNcblx0ICAgICAgICBpbnN0YWxsUG9zdE1lc3NhZ2VJbXBsZW1lbnRhdGlvbigpO1xuXG5cdCAgICB9IGVsc2UgaWYgKGdsb2JhbC5NZXNzYWdlQ2hhbm5lbCkge1xuXHQgICAgICAgIC8vIEZvciB3ZWIgd29ya2Vycywgd2hlcmUgc3VwcG9ydGVkXG5cdCAgICAgICAgaW5zdGFsbE1lc3NhZ2VDaGFubmVsSW1wbGVtZW50YXRpb24oKTtcblxuXHQgICAgfSBlbHNlIGlmIChkb2MgJiYgXCJvbnJlYWR5c3RhdGVjaGFuZ2VcIiBpbiBkb2MuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKSkge1xuXHQgICAgICAgIC8vIEZvciBJRSA24oCTOFxuXHQgICAgICAgIGluc3RhbGxSZWFkeVN0YXRlQ2hhbmdlSW1wbGVtZW50YXRpb24oKTtcblxuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICAvLyBGb3Igb2xkZXIgYnJvd3NlcnNcblx0ICAgICAgICBpbnN0YWxsU2V0VGltZW91dEltcGxlbWVudGF0aW9uKCk7XG5cdCAgICB9XG5cblx0ICAgIGF0dGFjaFRvLnNldEltbWVkaWF0ZSA9IHNldEltbWVkaWF0ZTtcblx0ICAgIGF0dGFjaFRvLmNsZWFySW1tZWRpYXRlID0gY2xlYXJJbW1lZGlhdGU7XG5cdH0odHlwZW9mIHNlbGYgPT09IFwidW5kZWZpbmVkXCIgPyB0eXBlb2YgZ2xvYmFsID09PSBcInVuZGVmaW5lZFwiID8gdGhpcyA6IGdsb2JhbCA6IHNlbGYpKTtcblxuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi99LmNhbGwoZXhwb3J0cywgKGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSgpKSwgX193ZWJwYWNrX3JlcXVpcmVfXygxMykpKVxuXG4vKioqLyB9KSxcbi8qIDEzICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0XG5cbi8qKiovIH0pLFxuLyogMTQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIExvYWRlciA9IF9fd2VicGFja19yZXF1aXJlX18oMTUpO1xuXG5cdHZhciBQcmVjb21waWxlZExvYWRlciA9IExvYWRlci5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24oY29tcGlsZWRUZW1wbGF0ZXMpIHtcblx0ICAgICAgICB0aGlzLnByZWNvbXBpbGVkID0gY29tcGlsZWRUZW1wbGF0ZXMgfHwge307XG5cdCAgICB9LFxuXG5cdCAgICBnZXRTb3VyY2U6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZiAodGhpcy5wcmVjb21waWxlZFtuYW1lXSkge1xuXHQgICAgICAgICAgICByZXR1cm4ge1xuXHQgICAgICAgICAgICAgICAgc3JjOiB7IHR5cGU6ICdjb2RlJyxcblx0ICAgICAgICAgICAgICAgICAgICAgICBvYmo6IHRoaXMucHJlY29tcGlsZWRbbmFtZV0gfSxcblx0ICAgICAgICAgICAgICAgIHBhdGg6IG5hbWVcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICB9XG5cdH0pO1xuXG5cdG1vZHVsZS5leHBvcnRzID0gUHJlY29tcGlsZWRMb2FkZXI7XG5cblxuLyoqKi8gfSksXG4vKiAxNSAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgcGF0aCA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBPYmogPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDYpO1xuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblxuXHR2YXIgTG9hZGVyID0gT2JqLmV4dGVuZCh7XG5cdCAgICBvbjogZnVuY3Rpb24obmFtZSwgZnVuYykge1xuXHQgICAgICAgIHRoaXMubGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMgfHwge307XG5cdCAgICAgICAgdGhpcy5saXN0ZW5lcnNbbmFtZV0gPSB0aGlzLmxpc3RlbmVyc1tuYW1lXSB8fCBbXTtcblx0ICAgICAgICB0aGlzLmxpc3RlbmVyc1tuYW1lXS5wdXNoKGZ1bmMpO1xuXHQgICAgfSxcblxuXHQgICAgZW1pdDogZnVuY3Rpb24obmFtZSAvKiwgYXJnMSwgYXJnMiwgLi4uKi8pIHtcblx0ICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cblx0ICAgICAgICBpZih0aGlzLmxpc3RlbmVycyAmJiB0aGlzLmxpc3RlbmVyc1tuYW1lXSkge1xuXHQgICAgICAgICAgICBsaWIuZWFjaCh0aGlzLmxpc3RlbmVyc1tuYW1lXSwgZnVuY3Rpb24obGlzdGVuZXIpIHtcblx0ICAgICAgICAgICAgICAgIGxpc3RlbmVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICByZXNvbHZlOiBmdW5jdGlvbihmcm9tLCB0bykge1xuXHQgICAgICAgIHJldHVybiBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKGZyb20pLCB0byk7XG5cdCAgICB9LFxuXG5cdCAgICBpc1JlbGF0aXZlOiBmdW5jdGlvbihmaWxlbmFtZSkge1xuXHQgICAgICAgIHJldHVybiAoZmlsZW5hbWUuaW5kZXhPZignLi8nKSA9PT0gMCB8fCBmaWxlbmFtZS5pbmRleE9mKCcuLi8nKSA9PT0gMCk7XG5cdCAgICB9XG5cdH0pO1xuXG5cdG1vZHVsZS5leHBvcnRzID0gTG9hZGVyO1xuXG5cbi8qKiovIH0pLFxuLyogMTYgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHRmdW5jdGlvbiBpbnN0YWxsQ29tcGF0KCkge1xuXHQgICAgJ3VzZSBzdHJpY3QnO1xuXG5cdCAgICAvLyBUaGlzIG11c3QgYmUgY2FsbGVkIGxpa2UgYG51bmp1Y2tzLmluc3RhbGxDb21wYXRgIHNvIHRoYXQgYHRoaXNgXG5cdCAgICAvLyByZWZlcmVuY2VzIHRoZSBudW5qdWNrcyBpbnN0YW5jZVxuXHQgICAgdmFyIHJ1bnRpbWUgPSB0aGlzLnJ1bnRpbWU7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgICAgdmFyIGxpYiA9IHRoaXMubGliOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgIHZhciBDb21waWxlciA9IHRoaXMuY29tcGlsZXIuQ29tcGlsZXI7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgICAgdmFyIFBhcnNlciA9IHRoaXMucGFyc2VyLlBhcnNlcjsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cdCAgICB2YXIgbm9kZXMgPSB0aGlzLm5vZGVzOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgIHZhciBsZXhlciA9IHRoaXMubGV4ZXI7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG5cdCAgICB2YXIgb3JpZ19jb250ZXh0T3JGcmFtZUxvb2t1cCA9IHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXA7XG5cdCAgICB2YXIgb3JpZ19Db21waWxlcl9hc3NlcnRUeXBlID0gQ29tcGlsZXIucHJvdG90eXBlLmFzc2VydFR5cGU7XG5cdCAgICB2YXIgb3JpZ19QYXJzZXJfcGFyc2VBZ2dyZWdhdGUgPSBQYXJzZXIucHJvdG90eXBlLnBhcnNlQWdncmVnYXRlO1xuXHQgICAgdmFyIG9yaWdfbWVtYmVyTG9va3VwID0gcnVudGltZS5tZW1iZXJMb29rdXA7XG5cblx0ICAgIGZ1bmN0aW9uIHVuaW5zdGFsbCgpIHtcblx0ICAgICAgICBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwID0gb3JpZ19jb250ZXh0T3JGcmFtZUxvb2t1cDtcblx0ICAgICAgICBDb21waWxlci5wcm90b3R5cGUuYXNzZXJ0VHlwZSA9IG9yaWdfQ29tcGlsZXJfYXNzZXJ0VHlwZTtcblx0ICAgICAgICBQYXJzZXIucHJvdG90eXBlLnBhcnNlQWdncmVnYXRlID0gb3JpZ19QYXJzZXJfcGFyc2VBZ2dyZWdhdGU7XG5cdCAgICAgICAgcnVudGltZS5tZW1iZXJMb29rdXAgPSBvcmlnX21lbWJlckxvb2t1cDtcblx0ICAgIH1cblxuXHQgICAgcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cCA9IGZ1bmN0aW9uKGNvbnRleHQsIGZyYW1lLCBrZXkpIHtcblx0ICAgICAgICB2YXIgdmFsID0gb3JpZ19jb250ZXh0T3JGcmFtZUxvb2t1cC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICBzd2l0Y2ggKGtleSkge1xuXHQgICAgICAgICAgICBjYXNlICdUcnVlJzpcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgICAgICAgICBjYXNlICdGYWxzZSc6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgICAgIGNhc2UgJ05vbmUnOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgfTtcblxuXHQgICAgdmFyIFNsaWNlID0gbm9kZXMuTm9kZS5leHRlbmQoJ1NsaWNlJywge1xuXHQgICAgICAgIGZpZWxkczogWydzdGFydCcsICdzdG9wJywgJ3N0ZXAnXSxcblx0ICAgICAgICBpbml0OiBmdW5jdGlvbihsaW5lbm8sIGNvbG5vLCBzdGFydCwgc3RvcCwgc3RlcCkge1xuXHQgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IHx8IG5ldyBub2Rlcy5MaXRlcmFsKGxpbmVubywgY29sbm8sIG51bGwpO1xuXHQgICAgICAgICAgICBzdG9wID0gc3RvcCB8fCBuZXcgbm9kZXMuTGl0ZXJhbChsaW5lbm8sIGNvbG5vLCBudWxsKTtcblx0ICAgICAgICAgICAgc3RlcCA9IHN0ZXAgfHwgbmV3IG5vZGVzLkxpdGVyYWwobGluZW5vLCBjb2xubywgMSk7XG5cdCAgICAgICAgICAgIHRoaXMucGFyZW50KGxpbmVubywgY29sbm8sIHN0YXJ0LCBzdG9wLCBzdGVwKTtcblx0ICAgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgQ29tcGlsZXIucHJvdG90eXBlLmFzc2VydFR5cGUgPSBmdW5jdGlvbihub2RlKSB7XG5cdCAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBTbGljZSkge1xuXHQgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBvcmlnX0NvbXBpbGVyX2Fzc2VydFR5cGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgIH07XG5cdCAgICBDb21waWxlci5wcm90b3R5cGUuY29tcGlsZVNsaWNlID0gZnVuY3Rpb24obm9kZSwgZnJhbWUpIHtcblx0ICAgICAgICB0aGlzLmVtaXQoJygnKTtcblx0ICAgICAgICB0aGlzLl9jb21waWxlRXhwcmVzc2lvbihub2RlLnN0YXJ0LCBmcmFtZSk7XG5cdCAgICAgICAgdGhpcy5lbWl0KCcpLCgnKTtcblx0ICAgICAgICB0aGlzLl9jb21waWxlRXhwcmVzc2lvbihub2RlLnN0b3AsIGZyYW1lKTtcblx0ICAgICAgICB0aGlzLmVtaXQoJyksKCcpO1xuXHQgICAgICAgIHRoaXMuX2NvbXBpbGVFeHByZXNzaW9uKG5vZGUuc3RlcCwgZnJhbWUpO1xuXHQgICAgICAgIHRoaXMuZW1pdCgnKScpO1xuXHQgICAgfTtcblxuXHQgICAgZnVuY3Rpb24gZ2V0VG9rZW5zU3RhdGUodG9rZW5zKSB7XG5cdCAgICAgICAgcmV0dXJuIHtcblx0ICAgICAgICAgICAgaW5kZXg6IHRva2Vucy5pbmRleCxcblx0ICAgICAgICAgICAgbGluZW5vOiB0b2tlbnMubGluZW5vLFxuXHQgICAgICAgICAgICBjb2xubzogdG9rZW5zLmNvbG5vXG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgUGFyc2VyLnByb3RvdHlwZS5wYXJzZUFnZ3JlZ2F0ZSA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciBzZWxmID0gdGhpcztcblx0ICAgICAgICB2YXIgb3JpZ1N0YXRlID0gZ2V0VG9rZW5zU3RhdGUodGhpcy50b2tlbnMpO1xuXHQgICAgICAgIC8vIFNldCBiYWNrIG9uZSBhY2NvdW50aW5nIGZvciBvcGVuaW5nIGJyYWNrZXQvcGFyZW5zXG5cdCAgICAgICAgb3JpZ1N0YXRlLmNvbG5vLS07XG5cdCAgICAgICAgb3JpZ1N0YXRlLmluZGV4LS07XG5cdCAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgcmV0dXJuIG9yaWdfUGFyc2VyX3BhcnNlQWdncmVnYXRlLmFwcGx5KHRoaXMpO1xuXHQgICAgICAgIH0gY2F0Y2goZSkge1xuXHQgICAgICAgICAgICB2YXIgZXJyU3RhdGUgPSBnZXRUb2tlbnNTdGF0ZSh0aGlzLnRva2Vucyk7XG5cdCAgICAgICAgICAgIHZhciByZXRocm93ID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICBsaWIuZXh0ZW5kKHNlbGYudG9rZW5zLCBlcnJTdGF0ZSk7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZTtcblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAvLyBSZXNldCB0byBzdGF0ZSBiZWZvcmUgb3JpZ2luYWwgcGFyc2VBZ2dyZWdhdGUgY2FsbGVkXG5cdCAgICAgICAgICAgIGxpYi5leHRlbmQodGhpcy50b2tlbnMsIG9yaWdTdGF0ZSk7XG5cdCAgICAgICAgICAgIHRoaXMucGVla2VkID0gZmFsc2U7XG5cblx0ICAgICAgICAgICAgdmFyIHRvayA9IHRoaXMucGVla1Rva2VuKCk7XG5cdCAgICAgICAgICAgIGlmICh0b2sudHlwZSAhPT0gbGV4ZXIuVE9LRU5fTEVGVF9CUkFDS0VUKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyByZXRocm93KCk7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdmFyIG5vZGUgPSBuZXcgU2xpY2UodG9rLmxpbmVubywgdG9rLmNvbG5vKTtcblxuXHQgICAgICAgICAgICAvLyBJZiB3ZSBkb24ndCBlbmNvdW50ZXIgYSBjb2xvbiB3aGlsZSBwYXJzaW5nLCB0aGlzIGlzIG5vdCBhIHNsaWNlLFxuXHQgICAgICAgICAgICAvLyBzbyByZS1yYWlzZSB0aGUgb3JpZ2luYWwgZXhjZXB0aW9uLlxuXHQgICAgICAgICAgICB2YXIgaXNTbGljZSA9IGZhbHNlO1xuXG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG5vZGUuZmllbGRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAodGhpcy5za2lwKGxleGVyLlRPS0VOX1JJR0hUX0JSQUNLRVQpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBpZiAoaSA9PT0gbm9kZS5maWVsZHMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGlzU2xpY2UpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsKCdwYXJzZVNsaWNlOiB0b28gbWFueSBzbGljZSBjb21wb25lbnRzJywgdG9rLmxpbmVubywgdG9rLmNvbG5vKTtcblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBpZiAodGhpcy5za2lwKGxleGVyLlRPS0VOX0NPTE9OKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGlzU2xpY2UgPSB0cnVlO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgZmllbGQgPSBub2RlLmZpZWxkc1tpXTtcblx0ICAgICAgICAgICAgICAgICAgICBub2RlW2ZpZWxkXSA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cdCAgICAgICAgICAgICAgICAgICAgaXNTbGljZSA9IHRoaXMuc2tpcChsZXhlci5UT0tFTl9DT0xPTikgfHwgaXNTbGljZTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZiAoIWlzU2xpY2UpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IHJldGhyb3coKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkFycmF5KHRvay5saW5lbm8sIHRvay5jb2xubywgW25vZGVdKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICBmdW5jdGlvbiBzbGljZUxvb2t1cChvYmosIHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG5cdCAgICAgICAgb2JqID0gb2JqIHx8IFtdO1xuXHQgICAgICAgIGlmIChzdGFydCA9PT0gbnVsbCkge1xuXHQgICAgICAgICAgICBzdGFydCA9IChzdGVwIDwgMCkgPyAob2JqLmxlbmd0aCAtIDEpIDogMDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgaWYgKHN0b3AgPT09IG51bGwpIHtcblx0ICAgICAgICAgICAgc3RvcCA9IChzdGVwIDwgMCkgPyAtMSA6IG9iai5sZW5ndGg7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgaWYgKHN0b3AgPCAwKSB7XG5cdCAgICAgICAgICAgICAgICBzdG9wICs9IG9iai5sZW5ndGg7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAoc3RhcnQgPCAwKSB7XG5cdCAgICAgICAgICAgIHN0YXJ0ICs9IG9iai5sZW5ndGg7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcblxuXHQgICAgICAgIGZvciAodmFyIGkgPSBzdGFydDsgOyBpICs9IHN0ZXApIHtcblx0ICAgICAgICAgICAgaWYgKGkgPCAwIHx8IGkgPiBvYmoubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZiAoc3RlcCA+IDAgJiYgaSA+PSBzdG9wKSB7XG5cdCAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZiAoc3RlcCA8IDAgJiYgaSA8PSBzdG9wKSB7XG5cdCAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXN1bHRzLnB1c2gocnVudGltZS5tZW1iZXJMb29rdXAob2JqLCBpKSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiByZXN1bHRzO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgQVJSQVlfTUVNQkVSUyA9IHtcblx0ICAgICAgICBwb3A6IGZ1bmN0aW9uKGluZGV4KSB7XG5cdCAgICAgICAgICAgIGlmIChpbmRleCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wb3AoKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZiAoaW5kZXggPj0gdGhpcy5sZW5ndGggfHwgaW5kZXggPCAwKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0tleUVycm9yJyk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGFwcGVuZDogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaChlbGVtZW50KTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIHJlbW92ZTogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIGlmICh0aGlzW2ldID09PSBlbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGksIDEpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsdWVFcnJvcicpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgY291bnQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gZWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGNvdW50Kys7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIGNvdW50O1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgaW5kZXg6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgdmFyIGk7XG5cdCAgICAgICAgICAgIGlmICgoaSA9IHRoaXMuaW5kZXhPZihlbGVtZW50KSkgPT09IC0xKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlRXJyb3InKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gaTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGZpbmQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihlbGVtZW50KTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGluc2VydDogZnVuY3Rpb24oaW5kZXgsIGVsZW0pIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGluZGV4LCAwLCBlbGVtKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXHQgICAgdmFyIE9CSkVDVF9NRU1CRVJTID0ge1xuXHQgICAgICAgIGl0ZW1zOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuXHQgICAgICAgICAgICBmb3IodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgICAgICAgICAgcmV0LnB1c2goW2ssIHRoaXNba11dKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gcmV0O1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgdmFsdWVzOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuXHQgICAgICAgICAgICBmb3IodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgICAgICAgICAgcmV0LnB1c2godGhpc1trXSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHJldDtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGtleXM6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICB2YXIgcmV0ID0gW107XG5cdCAgICAgICAgICAgIGZvcih2YXIgayBpbiB0aGlzKSB7XG5cdCAgICAgICAgICAgICAgICByZXQucHVzaChrKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gcmV0O1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXksIGRlZikge1xuXHQgICAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpc1trZXldO1xuXHQgICAgICAgICAgICBpZiAob3V0cHV0ID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIG91dHB1dCA9IGRlZjtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgaGFzX2tleTogZnVuY3Rpb24oa2V5KSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLmhhc093blByb3BlcnR5KGtleSk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBwb3A6IGZ1bmN0aW9uKGtleSwgZGVmKSB7XG5cdCAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzW2tleV07XG5cdCAgICAgICAgICAgIGlmIChvdXRwdXQgPT09IHVuZGVmaW5lZCAmJiBkZWYgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgb3V0cHV0ID0gZGVmO1xuXHQgICAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0tleUVycm9yJyk7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBkZWxldGUgdGhpc1trZXldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBwb3BpdGVtOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgayBpbiB0aGlzKSB7XG5cdCAgICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIGZpcnN0IG9iamVjdCBwYWlyLlxuXHQgICAgICAgICAgICAgICAgdmFyIHZhbCA9IHRoaXNba107XG5cdCAgICAgICAgICAgICAgICBkZWxldGUgdGhpc1trXTtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBbaywgdmFsXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0tleUVycm9yJyk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBzZXRkZWZhdWx0OiBmdW5jdGlvbihrZXksIGRlZikge1xuXHQgICAgICAgICAgICBpZiAoa2V5IGluIHRoaXMpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2tleV07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYgKGRlZiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICBkZWYgPSBudWxsO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzW2tleV0gPSBkZWY7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKGt3YXJncykge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBrIGluIGt3YXJncykge1xuXHQgICAgICAgICAgICAgICAgdGhpc1trXSA9IGt3YXJnc1trXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gbnVsbDsgICAgLy8gQWx3YXlzIHJldHVybnMgTm9uZVxuXHQgICAgICAgIH1cblx0ICAgIH07XG5cdCAgICBPQkpFQ1RfTUVNQkVSUy5pdGVyaXRlbXMgPSBPQkpFQ1RfTUVNQkVSUy5pdGVtcztcblx0ICAgIE9CSkVDVF9NRU1CRVJTLml0ZXJ2YWx1ZXMgPSBPQkpFQ1RfTUVNQkVSUy52YWx1ZXM7XG5cdCAgICBPQkpFQ1RfTUVNQkVSUy5pdGVya2V5cyA9IE9CSkVDVF9NRU1CRVJTLmtleXM7XG5cdCAgICBydW50aW1lLm1lbWJlckxvb2t1cCA9IGZ1bmN0aW9uKG9iaiwgdmFsLCBhdXRvZXNjYXBlKSB7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSA0KSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzbGljZUxvb2t1cC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBvYmogPSBvYmogfHwge307XG5cblx0ICAgICAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGFuIG9iamVjdCwgcmV0dXJuIGFueSBvZiB0aGUgbWV0aG9kcyB0aGF0IFB5dGhvbiB3b3VsZFxuXHQgICAgICAgIC8vIG90aGVyd2lzZSBwcm92aWRlLlxuXHQgICAgICAgIGlmIChsaWIuaXNBcnJheShvYmopICYmIEFSUkFZX01FTUJFUlMuaGFzT3duUHJvcGVydHkodmFsKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7cmV0dXJuIEFSUkFZX01FTUJFUlNbdmFsXS5hcHBseShvYmosIGFyZ3VtZW50cyk7fTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAobGliLmlzT2JqZWN0KG9iaikgJiYgT0JKRUNUX01FTUJFUlMuaGFzT3duUHJvcGVydHkodmFsKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7cmV0dXJuIE9CSkVDVF9NRU1CRVJTW3ZhbF0uYXBwbHkob2JqLCBhcmd1bWVudHMpO307XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIG9yaWdfbWVtYmVyTG9va3VwLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICB9O1xuXG5cdCAgICByZXR1cm4gdW5pbnN0YWxsO1xuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBpbnN0YWxsQ29tcGF0O1xuXG5cbi8qKiovIH0pXG4vKioqKioqLyBdKVxufSk7XG47IiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sXCJdID0gKGZ1bmN0aW9uKCkge1xuZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIHBhcmVudFRlbXBsYXRlID0gbnVsbDtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJodG1sXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG48ZGl2IGNsYXNzPVxcXCJpdGVtLS1lbWJlZF9fZWxlbWVudFxcXCI+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKGVudi5nZXRGaWx0ZXIoXCJzYWZlXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImh0bWxcIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcblwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXCI7XG5pZigocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInRpdGxlXCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJkZXNjcmlwdGlvblwiKSB8fCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY3JlZGl0XCIpIHx8ICghcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImh0bWxcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInRodW1ibmFpbF91cmxcIikpKSkge1xub3V0cHV0ICs9IFwiXFxuPGFydGljbGUgY2xhc3M9XFxcIml0ZW0tLWVtYmVkIGl0ZW0tLWVtYmVkX193cmFwcGVyXFxcIj5cXG4gICAgXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImh0bWxcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInRodW1ibmFpbF91cmxcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8YSBocmVmPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInVybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIiBjbGFzcz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiZGVzY3JpcHRpb25cIik/XCJpdGVtLS1lbWJlZF9faWxsdXN0cmF0aW9uXCI6XCJpdGVtLS1lbWJlZF9fb25seS1pbGx1c3RyYXRpb25cIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gICAgICAgIDxpbWcgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInRodW1ibmFpbF91cmxcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIi8+XFxuICAgPC9hPlxcbiAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGl0bGVcIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImRlc2NyaXB0aW9uXCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjcmVkaXRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgIDxkaXYgY2xhc3M9XFxcIml0ZW0tLWVtYmVkX19pbmZvXFxcIj5cXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInRpdGxlXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcIml0ZW0tLWVtYmVkX190aXRsZVxcXCI+XFxuICAgICAgICAgICAgPGEgaHJlZj1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ1cmxcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCIgdGl0bGU9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGl0bGVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInRpdGxlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvYT5cXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImRlc2NyaXB0aW9uXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcIml0ZW0tLWVtYmVkX19kZXNjcmlwdGlvblxcXCI+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJkZXNjcmlwdGlvblwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjcmVkaXRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX2NyZWRpdFxcXCI+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjcmVkaXRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9kaXY+XFxuICAgICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICA8L2Rpdj5cXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG48L2FydGljbGU+XFxuXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPGZpZ3VyZT5cXG4gIDxpbWcgXFxuICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcImFjdGl2ZVwiKSkge1xub3V0cHV0ICs9IFwiY2xhc3M9XFxcImFjdGl2ZVxcXCJcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJ0aHVtYm5haWxcIikpLFwiaHJlZlwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiXFxuICAgIHNyY3NldD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcImJhc2VJbWFnZVwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIiA4MTB3LCBcXG4gICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcInRodW1ibmFpbFwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIiAyNDB3LCBcXG4gICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcInZpZXdJbWFnZVwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIiA1NDB3XFxcIiBcXG4gICAgYWx0PVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNhcHRpb25cIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gIDxmaWdjYXB0aW9uPlxcbiAgICA8c3BhbiBuZy1pZj1cXFwicmVmLml0ZW0ubWV0YS5jYXB0aW9uXFxcIiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XFxuICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjYXB0aW9uXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICA8L3NwYW4+Jm5ic3A7XFxuICAgIDxzcGFuIG5nLWlmPVxcXCJyZWYuaXRlbS5tZXRhLmNyZWRpdFxcXCIgY2xhc3M9XFxcImNyZWRpdFxcXCI+XFxuICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjcmVkaXRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgIDwvc3Bhbj5cXG4gIDwvZmlnY2FwdGlvbj5cXG48L2ZpZ3VyZT5cXG5cXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPCEtLSBzdGlja3kgcG9zaXRpb24gdG9nZ2xlIC0tPlxcblwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJzdGlja3lcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic3RpY2t5UG9zaXRpb25cIikgPT0gXCJ0b3BcIikge1xub3V0cHV0ICs9IFwiXFxuPGFydGljbGVcXG4gIGNsYXNzPVxcXCJsYi1zdGlja3ktdG9wLXBvc3QgbGlzdC1ncm91cC1pdGVtIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0dhbGxlcnlcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcImdyb3Vwc1wiKSksMSkpLFwicmVmc1wiKSksMCkpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJpbWFnZVwiICYmIGVudi5nZXRGaWx0ZXIoXCJsZW5ndGhcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpKSA+IDEpIHtcbm91dHB1dCArPSBcInNsaWRlc2hvd1wiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxcIlxcbiAgZGF0YS1qcy1wb3N0LWlkPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfaWRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG48YXJ0aWNsZVxcbiAgY2xhc3M9XFxcImxiLXBvc3QgbGlzdC1ncm91cC1pdGVtIHNob3ctYXV0aG9yLWF2YXRhciBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dHYWxsZXJ5XCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJncm91cHNcIikpLDEpKSxcInJlZnNcIikpLDApKSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwiaW1hZ2VcIiAmJiBlbnYuZ2V0RmlsdGVyKFwibGVuZ3RoXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcImdyb3Vwc1wiKSksMSkpLFwicmVmc1wiKSkgPiAxKSB7XG5vdXRwdXQgKz0gXCJzbGlkZXNob3dcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCJcXG4gIGRhdGEtanMtcG9zdC1pZD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiX2lkXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGRpdiBjbGFzcz1cXFwibGItdHlwZVxcXCI+PC9kaXY+XFxuICAgIDxpbWcgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhc3NldHNfcm9vdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJpbWFnZXMvcGlucG9zdC5zdmdcXFwiIGNsYXNzPVxcXCJsYi1wb3N0LXBpblxcXCIgLz5cXG4gIFwiO1xuO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcImxiX2hpZ2hsaWdodFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLXR5cGUgbGItcG9zdC1oaWdobGlnaHRlZFxcXCI+PC9kaXY+XFxuICBcIjtcbjtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLXR5cGUgbGItdHlwZS0tdGV4dFxcXCI+PC9kaXY+XFxuICBcIjtcbjtcbn1cbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgPGRpdiBjbGFzcz1cXFwibGItcG9zdC1kYXRlXFxcIiBkYXRhLWpzLXRpbWVzdGFtcD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiX3VwZGF0ZWRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfdXBkYXRlZFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cXG5cXG4gIDwhLS0gYXV0aG9yIHBsdXMgYXZhdGFyIC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yXFxcIj5cXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93QXV0aG9yXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicHVibGlzaGVyXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJsYi1hdXRob3JfX25hbWVcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJwdWJsaXNoZXJcIikpLFwiZGlzcGxheV9uYW1lXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0F1dGhvckF2YXRhclwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInB1Ymxpc2hlclwiKSksXCJwaWN0dXJlX3VybFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8aW1nIGNsYXNzPVxcXCJsYi1hdXRob3JfX2F2YXRhclxcXCIgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicHVibGlzaGVyXCIpKSxcInBpY3R1cmVfdXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgLz5cXG4gICAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImxiLWF1dGhvcl9fYXZhdGFyXFxcIj48L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwvZGl2PlxcbiAgPCEtLSBlbmQgYXV0aG9yIC0tPlxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwhLS0gZW5kIHN0aWNreSBwb3NpdGlvbiB0b2dnbGUgLS0+XFxuXFxuICA8IS0tIGl0ZW0gc3RhcnQgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJpdGVtcy1jb250YWluZXJcXFwiPlxcbiAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMyA9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJncm91cHNcIikpLDEpKSxcInJlZnNcIik7XG5pZih0XzMpIHt2YXIgdF8yID0gdF8zLmxlbmd0aDtcbmZvcih2YXIgdF8xPTA7IHRfMSA8IHRfMy5sZW5ndGg7IHRfMSsrKSB7XG52YXIgdF80ID0gdF8zW3RfMV07XG5mcmFtZS5zZXQoXCJyZWZcIiwgdF80KTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF8xICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzIgLSB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF8yIC0gdF8xIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfMSA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF8xID09PSB0XzIgLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfMik7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwiaW1hZ2VcIikge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPGRpdiBjbGFzcz1cXFwiXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJzdGlja3lcIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic3RpY2t5UG9zaXRpb25cIikgPT0gXCJib3R0b21cIikge1xub3V0cHV0ICs9IFwibGItaXRlbVwiO1xuO1xufVxub3V0cHV0ICs9IFwiIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcIm9yaWdpbmFsXCIpKSxcImhlaWdodFwiKSA+IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJvcmlnaW5hbFwiKSksXCJ3aWR0aFwiKSkge1xub3V0cHV0ICs9IFwicG9ydHJhaXRcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCI+XFxuICAgICAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcIlwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwiYm90dG9tXCIpIHtcbm91dHB1dCArPSBcImxiLWl0ZW1cIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCI+XFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJlbWJlZFwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzcsdF81KSB7XG5pZih0XzcpIHsgY2IodF83KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzgsdF82KSB7XG5pZih0XzgpIHsgY2IodF84KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJpbWFnZVwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzExLHRfOSkge1xuaWYodF8xMSkgeyBjYih0XzExKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfOSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzEyLHRfMTApIHtcbmlmKHRfMTIpIHsgY2IodF8xMik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzEwKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbn0pO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcInF1b3RlXCIpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1pdGVtLXF1b3RlLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMTUsdF8xMykge1xuaWYodF8xNSkgeyBjYih0XzE1KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTMpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8xNix0XzE0KSB7XG5pZih0XzE2KSB7IGNiKHRfMTYpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xNCk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIDxhcnRpY2xlPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwidGV4dFwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9hcnRpY2xlPlxcbiAgICAgICAgXCI7XG47XG59XG47XG59XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8L2Rpdj5cXG4gICAgXCI7XG47XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICA8L2Rpdj5cXG4gIDwhLS0gaXRlbSBlbmQgLS0+XFxuXFxuPC9hcnRpY2xlPlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLXNsaWRlc2hvdy5odG1sXCJdID0gKGZ1bmN0aW9uKCkge1xuZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIHBhcmVudFRlbXBsYXRlID0gbnVsbDtcbm91dHB1dCArPSBcIjxkaXYgaWQ9XFxcInNsaWRlc2hvd1xcXCI+XFxuICA8ZGl2IGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcbiAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMyA9IHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmc1wiKTtcbmlmKHRfMykge3ZhciB0XzIgPSB0XzMubGVuZ3RoO1xuZm9yKHZhciB0XzE9MDsgdF8xIDwgdF8zLmxlbmd0aDsgdF8xKyspIHtcbnZhciB0XzQgPSB0XzNbdF8xXTtcbmZyYW1lLnNldChcInJlZlwiLCB0XzQpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleFwiLCB0XzEgKyAxKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXgwXCIsIHRfMSk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4XCIsIHRfMiAtIHRfMSk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4MFwiLCB0XzIgLSB0XzEgLSAxKTtcbmZyYW1lLnNldChcImxvb3AuZmlyc3RcIiwgdF8xID09PSAwKTtcbmZyYW1lLnNldChcImxvb3AubGFzdFwiLCB0XzEgPT09IHRfMiAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5sZW5ndGhcIiwgdF8yKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzcsdF81KSB7XG5pZih0XzcpIHsgY2IodF83KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzgsdF82KSB7XG5pZih0XzgpIHsgY2IodF84KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbn0pO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgPC9kaXY+XFxuICA8YnV0dG9uIGNsYXNzPVxcXCJjbG9zZVxcXCI+WDwvYnV0dG9uPlxcbiAgPGJ1dHRvbiBjbGFzcz1cXFwiZnVsbHNjcmVlblxcXCI+RnVsbHNjcmVlbjwvYnV0dG9uPlxcbiAgPGJ1dHRvbiBjbGFzcz1cXFwiYXJyb3dzIHByZXZcXFwiPiZsdDs8L2J1dHRvbj5cXG4gIDxidXR0b24gY2xhc3M9XFxcImFycm93cyBuZXh0XFxcIj4mZ3Q7PC9idXR0b24+XFxuPC9kaXY+XFxuXCI7XG5pZihwYXJlbnRUZW1wbGF0ZSkge1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSBlbHNlIHtcbmNiKG51bGwsIG91dHB1dCk7XG59XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbnJvb3Q6IHJvb3Rcbn07XG5cbn0pKCk7XG5yZXR1cm4gZnVuY3Rpb24oY3R4LCBjYikgeyByZXR1cm4gbnVuanVja3MucmVuZGVyKFwidGVtcGxhdGUtc2xpZGVzaG93Lmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCJdID0gKGZ1bmN0aW9uKCkge1xuZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIHBhcmVudFRlbXBsYXRlID0gbnVsbDtcbihwYXJlbnRUZW1wbGF0ZSA/IGZ1bmN0aW9uKGUsIGMsIGYsIHIsIGNiKSB7IGNiKFwiXCIpOyB9IDogY29udGV4dC5nZXRCbG9jayhcInRpbWVsaW5lXCIpKShlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBmdW5jdGlvbih0XzIsdF8xKSB7XG5pZih0XzIpIHsgY2IodF8yKTsgcmV0dXJuOyB9XG5vdXRwdXQgKz0gdF8xO1xub3V0cHV0ICs9IFwiXFxuXFxuXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtZW1iZWQtcHJvdmlkZXJzLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzUsdF8zKSB7XG5pZih0XzUpIHsgY2IodF81KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMyk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzYsdF80KSB7XG5pZih0XzYpIHsgY2IodF82KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNCk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcblxcblwiO1xuaWYocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpbmNsdWRlX2pzX29wdGlvbnNcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgPHNjcmlwdCB0eXBlPVxcXCJ0ZXh0L2phdmFzY3JpcHRcXFwiPlxcbiAgICB3aW5kb3cuTEIgPSBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImpzb25fb3B0aW9uc1wiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiO1xcbiAgPC9zY3JpcHQ+XFxuXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbn0pfSk7XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxuZnVuY3Rpb24gYl90aW1lbGluZShlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIGZyYW1lID0gZnJhbWUucHVzaCh0cnVlKTtcbm91dHB1dCArPSBcIlxcbjxkaXYgY2xhc3M9XFxcImxiLXRpbWVsaW5lIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJsYW5ndWFnZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93VGl0bGVcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJ0aXRsZVwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxoMT5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJ0aXRsZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2gxPlxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0Rlc2NyaXB0aW9uXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwiZGVzY3JpcHRpb25cIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJkZXNjcmlwdGlvblxcXCI+XFxuICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKGVudi5nZXRGaWx0ZXIoXCJzYWZlXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJkZXNjcmlwdGlvblwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgIDwvZGl2PlxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0ltYWdlXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwicGljdHVyZV91cmxcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8aW1nIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwicGljdHVyZV91cmxcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIiAvPlxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic3RpY2t5UG9zaXRpb25cIikgPT0gXCJ0b3BcIiAmJiBlbnYuZ2V0RmlsdGVyKFwibGVuZ3RoXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJzdGlja3lQb3N0c1wiKSksXCJfaXRlbXNcIikpID4gMCkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcInRpbWVsaW5lLXRvcCB0aW1lbGluZS10b3AtLWxvYWRlZFxcXCI+XFxuICAgICAgPHNlY3Rpb24gY2xhc3M9XFxcImxiLXBvc3RzIGxpc3QtZ3JvdXBcXFwiPlxcbiAgICAgICAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzkgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInN0aWNreVBvc3RzXCIpKSxcIl9pdGVtc1wiKTtcbmlmKHRfOSkge3ZhciB0XzggPSB0XzkubGVuZ3RoO1xuZm9yKHZhciB0Xzc9MDsgdF83IDwgdF85Lmxlbmd0aDsgdF83KyspIHtcbnZhciB0XzEwID0gdF85W3RfN107XG5mcmFtZS5zZXQoXCJpdGVtXCIsIHRfMTApO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleFwiLCB0XzcgKyAxKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXgwXCIsIHRfNyk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4XCIsIHRfOCAtIHRfNyk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4MFwiLCB0XzggLSB0XzcgLSAxKTtcbmZyYW1lLnNldChcImxvb3AuZmlyc3RcIiwgdF83ID09PSAwKTtcbmZyYW1lLnNldChcImxvb3AubGFzdFwiLCB0XzcgPT09IHRfOCAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5sZW5ndGhcIiwgdF84KTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgodF8xMCksXCJkZWxldGVkXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzEzLHRfMTEpIHtcbmlmKHRfMTMpIHsgY2IodF8xMyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzExKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMTQsdF8xMikge1xuaWYodF8xNCkgeyBjYih0XzE0KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTIpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG59KTtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG47XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgPC9zZWN0aW9uPlxcbiAgICA8L2Rpdj5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICA8IS0tIEhlYWRlciAtLT5cXG4gIDxkaXYgY2xhc3M9XFxcImhlYWRlci1iYXJcXFwiPlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJzb3J0aW5nLWJhclxcXCI+XFxuICAgICAgPGRpdiBjbGFzcz1cXFwic29ydGluZy1iYXJfX29yZGVyc1xcXCI+XFxuICAgICAgICA8ZGl2XFxuICAgICAgICAgIGNsYXNzPVxcXCJzb3J0aW5nLWJhcl9fb3JkZXIgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJwb3N0T3JkZXJcIikgPT0gXCJlZGl0b3JpYWxcIikge1xub3V0cHV0ICs9IFwic29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmVcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCJcXG4gICAgICAgICAgZGF0YS1qcy1vcmRlcmJ5X2VkaXRvcmlhbD5cXG4gICAgICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJvcHRpb25zXCIpKSxcImwxMG5cIikpLFwiZWRpdG9yaWFsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICA8ZGl2XFxuICAgICAgICAgIGNsYXNzPVxcXCJzb3J0aW5nLWJhcl9fb3JkZXIgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJwb3N0T3JkZXJcIikgPT0gXCJuZXdlc3RfZmlyc3RcIikge1xub3V0cHV0ICs9IFwic29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmVcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCJcXG4gICAgICAgICAgZGF0YS1qcy1vcmRlcmJ5X2Rlc2NlbmRpbmc+XFxuICAgICAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwib3B0aW9uc1wiKSksXCJsMTBuXCIpKSxcImRlc2NlbmRpbmdcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDxkaXZcXG4gICAgICAgICAgY2xhc3M9XFxcInNvcnRpbmctYmFyX19vcmRlciBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInBvc3RPcmRlclwiKSA9PSBcIm9sZGVzdF9maXJzdFwiKSB7XG5vdXRwdXQgKz0gXCJzb3J0aW5nLWJhcl9fb3JkZXItLWFjdGl2ZVwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxcIlxcbiAgICAgICAgICBkYXRhLWpzLW9yZGVyYnlfYXNjZW5kaW5nPlxcbiAgICAgICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm9wdGlvbnNcIikpLFwibDEwblwiKSksXCJhc2NlbmRpbmdcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8L2Rpdj5cXG4gICAgICA8L2Rpdj5cXG4gICAgPC9kaXY+XFxuICAgIDxkaXYgY2xhc3M9XFxcImhlYWRlci1iYXJfX2FjdGlvbnNcXFwiPjwvZGl2PlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwiY2FuQ29tbWVudFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8YnV0dG9uIGNsYXNzPVxcXCJoZWFkZXItYmFyX19jb21tZW50XFxcIiBkYXRhLWpzLXNob3ctY29tbWVudC1kaWFsb2c+Q29tbWVudDwvYnV0dG9uPlxcbiAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93TGl2ZWJsb2dMb2dvXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxhIGNsYXNzPVxcXCJoZWFkZXItYmFyX19sb2dvXFxcIiBocmVmPVxcXCJodHRwczovL3d3dy5saXZlYmxvZy5wcm9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5cXG4gICAgICAgICAgPHNwYW4+UG93ZXJlZCBieTwvc3Bhbj5cXG4gICAgICAgICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9sYi1sb2dvLnN2Z1xcXCIgLz5cXG4gICAgICAgIDwvYT5cXG4gICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICA8L2Rpdj5cXG4gIDwhLS0gSGVhZGVyIEVuZCAtLT5cXG5cXG4gIDwhLS0gQ29tbWVudCAtLT5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwiY2FuQ29tbWVudFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWNvbW1lbnQuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMTcsdF8xNSkge1xuaWYodF8xNykgeyBjYih0XzE3KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTUpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8xOCx0XzE2KSB7XG5pZih0XzE4KSB7IGNiKHRfMTgpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xNik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgXCI7XG59KTtcbn1cbm91dHB1dCArPSBcIlxcbiAgPCEtLSBDb21tZW50IEVuZCAtLT5cXG5cXG4gIDwhLS0gVGltZWxpbmUgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJ0aW1lbGluZS1ib2R5IHRpbWVsaW5lLWJvZHktLWxvYWRlZFxcXCI+XFxuICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic3RpY2t5UG9zaXRpb25cIikgPT0gXCJib3R0b21cIiAmJiBlbnYuZ2V0RmlsdGVyKFwibGVuZ3RoXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJzdGlja3lQb3N0c1wiKSksXCJfaXRlbXNcIikpID4gMCkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPHNlY3Rpb24gY2xhc3M9XFxcImxiLXBvc3RzIGxpc3QtZ3JvdXAgc3RpY2t5XFxcIj5cXG4gICAgICAgIFwiO1xuZnJhbWUgPSBmcmFtZS5wdXNoKCk7XG52YXIgdF8yMSA9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwic3RpY2t5UG9zdHNcIikpLFwiX2l0ZW1zXCIpO1xuaWYodF8yMSkge3ZhciB0XzIwID0gdF8yMS5sZW5ndGg7XG5mb3IodmFyIHRfMTk9MDsgdF8xOSA8IHRfMjEubGVuZ3RoOyB0XzE5KyspIHtcbnZhciB0XzIyID0gdF8yMVt0XzE5XTtcbmZyYW1lLnNldChcIml0ZW1cIiwgdF8yMik7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4XCIsIHRfMTkgKyAxKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXgwXCIsIHRfMTkpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzIwIC0gdF8xOSk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4MFwiLCB0XzIwIC0gdF8xOSAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5maXJzdFwiLCB0XzE5ID09PSAwKTtcbmZyYW1lLnNldChcImxvb3AubGFzdFwiLCB0XzE5ID09PSB0XzIwIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmxlbmd0aFwiLCB0XzIwKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgodF8yMiksXCJkZWxldGVkXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzI1LHRfMjMpIHtcbmlmKHRfMjUpIHsgY2IodF8yNSk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzIzKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMjYsdF8yNCkge1xuaWYodF8yNikgeyBjYih0XzI2KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMjQpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG59KTtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG47XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgPC9zZWN0aW9uPlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbmlmKGVudi5nZXRGaWx0ZXIoXCJsZW5ndGhcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInBvc3RzXCIpKSxcIl9pdGVtc1wiKSkgPT0gMCkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPGRpdiBjbGFzcz1cXFwibGItcG9zdCBlbXB0eS1tZXNzYWdlXFxcIj5cXG4gICAgICAgIDxkaXY+QmxvZyBwb3N0cyBhcmUgbm90IGN1cnJlbnRseSBhdmFpbGFibGUuPC9kaXY+XFxuICAgICAgPC9kaXY+XFxuICAgICAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJsYi1wb3N0cyBsaXN0LWdyb3VwIG5vcm1hbFxcXCI+XFxuICAgICAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMjkgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInBvc3RzXCIpKSxcIl9pdGVtc1wiKTtcbmlmKHRfMjkpIHt2YXIgdF8yOCA9IHRfMjkubGVuZ3RoO1xuZm9yKHZhciB0XzI3PTA7IHRfMjcgPCB0XzI5Lmxlbmd0aDsgdF8yNysrKSB7XG52YXIgdF8zMCA9IHRfMjlbdF8yN107XG5mcmFtZS5zZXQoXCJpdGVtXCIsIHRfMzApO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleFwiLCB0XzI3ICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzI3KTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF8yOCAtIHRfMjcpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF8yOCAtIHRfMjcgLSAxKTtcbmZyYW1lLnNldChcImxvb3AuZmlyc3RcIiwgdF8yNyA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF8yNyA9PT0gdF8yOCAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5sZW5ndGhcIiwgdF8yOCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHRfMzApLFwiZGVsZXRlZFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8zMyx0XzMxKSB7XG5pZih0XzMzKSB7IGNiKHRfMzMpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8zMSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzM0LHRfMzIpIHtcbmlmKHRfMzQpIHsgY2IodF8zNCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzMyKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIDwvc2VjdGlvbj5cXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInBvc3RzXCIpKSxcIl9tZXRhXCIpKSxcIm1heF9yZXN1bHRzXCIpIDw9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInBvc3RzXCIpKSxcIl9tZXRhXCIpKSxcInRvdGFsXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxidXR0b24gY2xhc3M9XFxcImxiLWJ1dHRvbiBsb2FkLW1vcmUtcG9zdHNcXFwiIGRhdGEtanMtbG9hZG1vcmU+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJvcHRpb25zXCIpKSxcImwxMG5cIikpLFwibG9hZE5ld1Bvc3RzXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvYnV0dG9uPlxcbiAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICA8L2Rpdj5cXG4gIDwhLS0gVGltZWxpbmUgRW5kIC0tPlxcblxcbjwvZGl2PlxcblwiO1xuY2IobnVsbCwgb3V0cHV0KTtcbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xuYl90aW1lbGluZTogYl90aW1lbGluZSxcbnJvb3Q6IHJvb3Rcbn07XG5cbn0pKCk7XG5yZXR1cm4gZnVuY3Rpb24oY3R4LCBjYikgeyByZXR1cm4gbnVuanVja3MucmVuZGVyKFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiJdfQ==
