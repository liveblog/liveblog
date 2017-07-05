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
  }

  _createClass(Slideshow, [{
    key: 'start',
    value: function start(e) {
      var items = [];

      this.iterations = 0;
      this.isFullscreen = false;

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

      window.removeEventListener('resize', this.onResize);
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
output += "\n    <div class=\"lb-type\"></div>\n  ";
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
output += "\n  </div>\n  <button class=\"fullscreen\">Fullscreen</button>\n  <button class=\"arrows prev\">&lt;</button>\n  <button class=\"arrows next\">&gt;</button>\n</div>\n";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9saXZlYmxvZy5qcyIsImpzL3RoZW1lL2hhbmRsZXJzLmpzIiwianMvdGhlbWUvaGVscGVycy5qcyIsImpzL3RoZW1lL2luZGV4LmpzIiwianMvdGhlbWUvbG9jYWwtYW5hbHl0aWNzLmpzIiwianMvdGhlbWUvc2xpZGVzaG93LmpzIiwianMvdGhlbWUvdGVtcGxhdGVzLmpzIiwianMvdGhlbWUvdmlldy5qcyIsImpzL3RoZW1lL3ZpZXdtb2RlbC5qcyIsIm5vZGVfbW9kdWxlcy9udW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW0uanMiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sIiwidGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbCIsInRlbXBsYXRlcy90ZW1wbGF0ZS1wb3N0Lmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtc2xpZGVzaG93Lmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtdGltZWxpbmUuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7O0FBSUE7O0FBRUE7O0FBQ0EsSUFBSSxRQUFRLFFBQVEsU0FBUixDQUFaOztBQUVBLFNBQVMsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFlBQU07QUFDbEQsUUFBTSxJQUFOO0FBQ0QsQ0FGRDs7QUFJQSxPQUFPLE9BQVAsR0FBaUIsRUFBakI7OztBQ2JBOzs7O0FBSUE7O0FBRUEsSUFBSSxPQUFPLFFBQVEsUUFBUixDQUFYO0FBQUEsSUFDSSxZQUFZLFFBQVEsYUFBUixDQURoQjtBQUFBLElBRUksVUFBVSxRQUFRLFdBQVIsQ0FGZDs7QUFJQTs7Ozs7QUFLQSxJQUFNLGNBQWMsU0FBZCxXQUFjLENBQUMsQ0FBRCxFQUFPO0FBQ3pCLElBQUUsY0FBRjs7QUFFQSxNQUFJLE9BQU8sU0FBUyxhQUFULENBQXVCLGVBQXZCLEVBQXdDLEtBQW5EO0FBQ0EsTUFBSSxV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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyb0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFByZXJlbmRlciBmdW5jdGlvbnNcbnZhciB0aGVtZSA9IHJlcXVpcmUoJy4vdGhlbWUnKTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgdGhlbWUuaW5pdCgpO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge307XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKVxuICAsIHZpZXdtb2RlbCA9IHJlcXVpcmUoJy4vdmlld21vZGVsJylcbiAgLCBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XG5cbi8qKlxuICogQ29udGFpbnMgYSBtYXBwaW5nIG9mIGVsZW1lbnQgZGF0YS1zZWxlY3RvcnMgYW5kIGNsaWNrIGhhbmRsZXJzXG4gKiBidXR0b25zLmF0dGFjaCB7ZnVuY3Rpb259IC0gcmVnaXN0ZXJzIGhhbmRsZXJzIGZvdW5kIGluIGhhbmRsZXJzIG9iamVjdFxuICovXG5cbmNvbnN0IHNlbmRDb21tZW50ID0gKGUpID0+IHtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gIGxldCBuYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvbW1lbnQtbmFtZScpLnZhbHVlO1xuICBsZXQgY29tbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb21tZW50LWNvbnRlbnQnKS52YWx1ZTtcblxuICB2aWV3LmNsZWFyQ29tbWVudEZvcm1FcnJvcnMoKTtcblxuICByZXR1cm4gdmlld21vZGVsLnNlbmRDb21tZW50KG5hbWUsIGNvbW1lbnQpXG4gICAgLnRoZW4odmlldy50b2dnbGVDb21tZW50RGlhbG9nKVxuICAgIC50aGVuKCgpID0+IGRvY3VtZW50XG4gICAgICAgIC5xdWVyeVNlbGVjdG9yKCdmb3JtLmNvbW1lbnQnKVxuICAgICAgICAucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpXG4gICAgKVxuICAgIC50aGVuKHZpZXcuc2hvd1N1Y2Nlc3NDb21tZW50TXNnKVxuICAgIC5jYXRjaCh2aWV3LmRpc3BsYXlDb21tZW50Rm9ybUVycm9ycyk7XG59O1xuXG52YXIgYnV0dG9ucyA9IHtcbiAgaGFuZGxlcnM6IHtcbiAgICBcIltkYXRhLWpzLWxvYWRtb3JlXVwiOiAoKSA9PiB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzUGFnZSgpXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyUG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAuY2F0Y2goY2F0Y2hFcnJvcik7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtb3JkZXJieV9hc2NlbmRpbmddXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHMoe3NvcnQ6ICdhc2NlbmRpbmcnfSlcbiAgICAgICAgLnRoZW4odmlldy5yZW5kZXJUaW1lbGluZSlcbiAgICAgICAgLnRoZW4odmlldy5kaXNwbGF5TmV3UG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcudG9nZ2xlU29ydEJ0bignYXNjZW5kaW5nJykpXG4gICAgICAgIC5jYXRjaChjYXRjaEVycm9yKTtcbiAgICB9LFxuXG4gICAgXCJbZGF0YS1qcy1vcmRlcmJ5X2Rlc2NlbmRpbmddXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHMoe3NvcnQ6ICdkZXNjZW5kaW5nJ30pXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyVGltZWxpbmUpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAudGhlbih2aWV3LnRvZ2dsZVNvcnRCdG4oJ2Rlc2NlbmRpbmcnKSlcbiAgICAgICAgLmNhdGNoKGNhdGNoRXJyb3IpO1xuICAgIH0sXG5cbiAgICBcIltkYXRhLWpzLW9yZGVyYnlfZWRpdG9yaWFsXVwiOiAoKSA9PiB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzKHtzb3J0OiAnZWRpdG9yaWFsJ30pXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyVGltZWxpbmUpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAudGhlbih2aWV3LnRvZ2dsZVNvcnRCdG4oJ2VkaXRvcmlhbCcpKVxuICAgICAgICAuY2F0Y2goY2F0Y2hFcnJvcik7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtc2hvdy1jb21tZW50LWRpYWxvZ11cIjogKCkgPT4ge1xuICAgICAgbGV0IGlzVmlzaWJsZSA9IHZpZXcudG9nZ2xlQ29tbWVudERpYWxvZygpO1xuICAgICAgbGV0IGNvbW1lbnRGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9ybS5jb21tZW50Jyk7XG5cbiAgICAgIGlmIChpc1Zpc2libGUpIHtcbiAgICAgICAgY29tbWVudEZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29tbWVudEZvcm0ucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAnW2RhdGEtanMtY2xvc2UtY29tbWVudC1kaWFsb2ddJzogKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZpZXcudG9nZ2xlQ29tbWVudERpYWxvZygpO1xuICAgIH1cbiAgfSxcblxuICBhdHRhY2g6IGZ1bmN0aW9uKCkge1xuICAgIE9iamVjdC5rZXlzKGJ1dHRvbnMuaGFuZGxlcnMpLmZvckVhY2goKGhhbmRsZXIpID0+IHtcbiAgICAgIGxldCBlbCA9IGhlbHBlcnMuZ2V0RWxlbXMoaGFuZGxlcilbMF07XG5cbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGJ1dHRvbnMuaGFuZGxlcnNbaGFuZGxlcl0sIGZhbHNlKTtcbiAgICB9KTtcblxuICAgIHZpZXcuYXR0YWNoU2xpZGVzaG93KCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGNhdGNoRXJyb3IoZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoXCJIYW5kbGVyIGVycm9yOiBcIiwgZXJyKTtcbn1cblxudmFyIGV2ZW50cyA9IHtcbiAgYXR0YWNoOiBmdW5jdGlvbigpIHt9IC8vIHRvZG9cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBidXR0b25zOiBidXR0b25zLFxuICBldmVudHM6IGV2ZW50c1xufTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKiBDb252ZXJ0IElTTyB0aW1lc3RhbXBzIHRvIHJlbGF0aXZlIG1vbWVudCB0aW1lc3RhbXBzXG4gKiBAcGFyYW0ge05vZGV9IGVsZW0gLSBhIERPTSBlbGVtZW50IHdpdGggSVNPIHRpbWVzdGFtcCBpbiBkYXRhLWpzLXRpbWVzdGFtcCBhdHRyXG4gKi9cbmZ1bmN0aW9uIGNvbnZlcnRUaW1lc3RhbXAodGltZXN0YW1wKSB7XG4gIHZhciBsMTBuID0gTEIubDEwbi50aW1lQWdvXG4gICAgLCBub3cgPSBuZXcgRGF0ZSgpIC8vIE5vd1xuICAgICwgZGlmZiA9IG5vdyAtIG5ldyBEYXRlKHRpbWVzdGFtcClcbiAgICAsIHVuaXRzID0ge1xuICAgICAgZDogMTAwMCAqIDM2MDAgKiAyNCxcbiAgICAgIGg6IDEwMDAgKiAzNjAwLFxuICAgICAgbTogMTAwMCAqIDYwXG4gICAgfTtcblxuICBmdW5jdGlvbiBnZXRUaW1lQWdvU3RyaW5nKHRpbWVzdGFtcCwgdW5pdCkge1xuICAgIHJldHVybiAhKHRpbWVzdGFtcCA8PSB1bml0c1t1bml0XSAqIDIpXG4gICAgICA/IGwxMG5bdW5pdF0ucC5yZXBsYWNlKFwie31cIiwgTWF0aC5mbG9vcih0aW1lc3RhbXAgLyB1bml0c1t1bml0XSkpXG4gICAgICA6IGwxMG5bdW5pdF0ucztcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVBZ28odGltZXN0YW1wKSB7XG4gICAgaWYgKHRpbWVzdGFtcCA8IHVuaXRzLmgpIHtcbiAgICAgIHJldHVybiBnZXRUaW1lQWdvU3RyaW5nKHRpbWVzdGFtcCwgXCJtXCIpO1xuICAgIH1cblxuICAgIGlmICh0aW1lc3RhbXAgPCB1bml0cy5kKSB7XG4gICAgICByZXR1cm4gZ2V0VGltZUFnb1N0cmluZyh0aW1lc3RhbXAsIFwiaFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0VGltZUFnb1N0cmluZyh0aW1lc3RhbXAsIFwiZFwiKTsgLy8gZGVmYXVsdFxuICB9XG5cbiAgcmV0dXJuIHRpbWVBZ28oZGlmZik7XG59XG5cbi8qKlxuICogV3JhcCBlbGVtZW50IHNlbGVjdG9yIGFwaVxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IC0gYSBqUXVlcnkgc3ludGF4IERPTSBxdWVyeSAod2l0aCBkb3RzKVxuICovXG5mdW5jdGlvbiBnZXRFbGVtcyhxdWVyeSkge1xuICB2YXIgaXNEYXRhQXR0ciA9IHF1ZXJ5LmluZGV4T2YoXCJkYXRhLVwiKSA+IC0xO1xuICByZXR1cm4gaXNEYXRhQXR0clxuICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxdWVyeSlcbiAgICA6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUocXVlcnkpO1xufVxuXG4vKipcbiAqIGpRdWVyeSdzICQuZ2V0SlNPTiBpbiBhIG51dHNoZWxsXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gYSByZXF1ZXN0IFVSTFxuICovXG5mdW5jdGlvbiBnZXRKU09OKHVybCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlamVjdCh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgeGhyLnNlbmQoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3QodXJsLCBkYXRhKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ1BPU1QnLCB1cmwpO1xuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAxKSB7XG4gICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWplY3QoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgfSk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldEVsZW1zOiBnZXRFbGVtcyxcbiAgZ2V0SlNPTjogZ2V0SlNPTixcbiAgcG9zdDogcG9zdCxcbiAgY29udmVydFRpbWVzdGFtcDogY29udmVydFRpbWVzdGFtcFxufTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBoYW5kbGVycyA9IHJlcXVpcmUoJy4vaGFuZGxlcnMnKSxcbiAgdmlld21vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWwnKSxcbiAgdmlldyA9IHJlcXVpcmUoJy4vdmlldycpLFxuICBsb2NhbEFuYWx5dGljcyA9IHJlcXVpcmUoJy4vbG9jYWwtYW5hbHl0aWNzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvKipcbiAgICogT24gZG9jdW1lbnQgbG9hZGVkLCBkbyB0aGUgZm9sbG93aW5nOlxuICAgKi9cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgaGFuZGxlcnMuYnV0dG9ucy5hdHRhY2goKTsgLy8gUmVnaXN0ZXIgQnV0dG9ucyBIYW5kbGVyc1xuICAgIGhhbmRsZXJzLmV2ZW50cy5hdHRhY2goKTsgLy8gUmVnaXN0ZXIgRXZlbnQsIE1lc3NhZ2UgSGFuZGxlcnNcbiAgICB2aWV3bW9kZWwuaW5pdCgpO1xuICAgIGxvY2FsQW5hbHl0aWNzLmhpdCgpO1xuXG4gICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdmlldy51cGRhdGVUaW1lc3RhbXBzKCk7IC8vIENvbnZlcnQgSVNPIGRhdGVzIHRvIHRpbWVhZ29cbiAgICB9LCAxMDAwKTtcbiAgfVxufTtcbiIsInZhciBhcGlIb3N0ID0gd2luZG93Lmhhc093blByb3BlcnR5KCdMQicpID8gd2luZG93LkxCLmFwaV9ob3N0LnJlcGxhY2UoL1xcLyQvLCAnJykgOiAnJztcbnZhciBjb250ZXh0VXJsID0gZG9jdW1lbnQucmVmZXJyZXI7XG52YXIgYmxvZ0lkID0gd2luZG93Lmhhc093blByb3BlcnR5KCdMQicpID8gd2luZG93LkxCLmJsb2cuX2lkIDogJyc7XG5cbmFwaUhvc3QgKz0gJy9hcGkvYW5hbHl0aWNzL2hpdCc7XG5cbnZhciBjcmVhdGVDb29raWUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgZGF5cykge1xuICB2YXIgZXhwaXJlcyA9ICcnLCBkYXRlID0gbmV3IERhdGUoKTtcblxuICBpZiAoZGF5cykge1xuICAgIGRhdGUuc2V0VGltZShkYXRlLmdldFRpbWUoKSArIGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKTtcbiAgICBleHBpcmVzID0gYDsgZXhwaXJlcz0ke2RhdGUudG9VVENTdHJpbmcoKX1gO1xuICB9XG4gIGRvY3VtZW50LmNvb2tpZSA9IGAke25hbWV9PSR7dmFsdWV9JHtleHBpcmVzfTsgcGF0aD0vYDtcbn07XG5cbnZhciByZWFkQ29va2llID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgbmFtZUVRID0gbmFtZSArICc9JztcbiAgdmFyIGNhID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7Jyk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjID0gY2FbaV07XG5cbiAgICB3aGlsZSAoYy5jaGFyQXQoMCkgPT09ICcgJykge1xuICAgICAgYyA9IGMuc3Vic3RyaW5nKDEsIGMubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoYy5pbmRleE9mKG5hbWVFUSkgPT09IDApIHtcbiAgICAgIHJldHVybiBjLnN1YnN0cmluZyhuYW1lRVEubGVuZ3RoLCBjLmxlbmd0aCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxudmFyIGhpdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgeG1saHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICB2YXIganNvbkRhdGEgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgY29udGV4dF91cmw6IGNvbnRleHRVcmwsXG4gICAgYmxvZ19pZDogYmxvZ0lkXG4gIH0pO1xuXG4gIHhtbGh0dHAub3BlbignUE9TVCcsIGFwaUhvc3QpO1xuICB4bWxodHRwLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cbiAgeG1saHR0cC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoeG1saHR0cC5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgY3JlYXRlQ29va2llKCdoaXQnLCBqc29uRGF0YSwgMik7XG4gICAgfVxuICB9O1xuXG4gIHhtbGh0dHAuc2VuZChqc29uRGF0YSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtoaXQ6ICgpID0+IHtcbiAgaWYgKCFyZWFkQ29va2llKCdoaXQnKSkge1xuICAgIGhpdCgpO1xuICB9XG59fTtcbiIsImNvbnN0IHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJyk7XG5cbmNsYXNzIFNsaWRlc2hvdyB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc3RhcnQgPSB0aGlzLnN0YXJ0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5zdG9wID0gdGhpcy5zdG9wLmJpbmQodGhpcyk7XG4gICAgdGhpcy5rZXlib2FyZExpc3RlbmVyID0gdGhpcy5rZXlib2FyZExpc3RlbmVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zZXRGb2N1cyA9IHRoaXMuc2V0Rm9jdXMuYmluZCh0aGlzKTtcbiAgICB0aGlzLmxhdW5jaEludG9GdWxsc2NyZWVuID0gdGhpcy5sYXVuY2hJbnRvRnVsbHNjcmVlbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25SZXNpemUgPSB0aGlzLm9uUmVzaXplLmJpbmQodGhpcyk7XG4gICAgdGhpcy5leGl0RnVsbHNjcmVlbiA9IHRoaXMuZXhpdEZ1bGxzY3JlZW4uYmluZCh0aGlzKTtcbiAgICB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4gPSB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4uYmluZCh0aGlzKTtcbiAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXJzID0gdGhpcy5hZGRFdmVudExpc3RlbmVycy5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMgPSB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXJzLmJpbmQodGhpcyk7XG4gIH1cblxuICBzdGFydChlKSB7XG4gICAgbGV0IGl0ZW1zID0gW107XG5cbiAgICB0aGlzLml0ZXJhdGlvbnMgPSAwO1xuICAgIHRoaXMuaXNGdWxsc2NyZWVuID0gZmFsc2U7XG5cbiAgICBlLnRhcmdldFxuICAgICAgLmNsb3Nlc3QoJ2FydGljbGUuc2xpZGVzaG93JylcbiAgICAgIC5xdWVyeVNlbGVjdG9yQWxsKCcubGItaXRlbSBpbWcnKVxuICAgICAgLmZvckVhY2goKGltZykgPT4ge1xuICAgICAgICBsZXQgbWF0Y2hlcyA9IFtdO1xuXG4gICAgICAgIGltZy5nZXRBdHRyaWJ1dGUoJ3NyY3NldCcpLnJlcGxhY2UoLyhcXFMrKVxcc1xcZCt3L2csIChzLCBtYXRjaCkgPT4ge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChtYXRjaCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBbYmFzZUltYWdlLCB0aHVtYm5haWwsIHZpZXdJbWFnZV0gPSBtYXRjaGVzO1xuXG4gICAgICAgIGl0ZW1zLnB1c2goe1xuICAgICAgICAgIGl0ZW06IHtcbiAgICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgICAgbWVkaWE6IHtyZW5kaXRpb25zOiB7XG4gICAgICAgICAgICAgICAgYmFzZUltYWdlOiB7aHJlZjogYmFzZUltYWdlfSxcbiAgICAgICAgICAgICAgICB0aHVtYm5haWw6IHtocmVmOiB0aHVtYm5haWx9LFxuICAgICAgICAgICAgICAgIHZpZXdJbWFnZToge2hyZWY6IHZpZXdJbWFnZX1cbiAgICAgICAgICAgICAgfX0sXG4gICAgICAgICAgICAgIGNhcHRpb246IGltZy5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4uY2FwdGlvbicpLnRleHRDb250ZW50LFxuICAgICAgICAgICAgICBjcmVkaXQ6IGltZy5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4uY3JlZGl0JykudGV4dENvbnRlbnQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWN0aXZlOiB0aHVtYm5haWwgPT09IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnc3JjJylcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBsZXQgc2xpZGVzaG93ID0gdGVtcGxhdGVzLnNsaWRlc2hvdyh7XG4gICAgICByZWZzOiBpdGVtc1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2LmxiLXRpbWVsaW5lJylcbiAgICAgIC5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyZW5kJywgc2xpZGVzaG93KTtcblxuICAgIGlmICh3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcCkge1xuICAgICAgd2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSgnZnVsbHNjcmVlbicsIHdpbmRvdy5kb2N1bWVudC5yZWZlcnJlcik7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRGb2N1cygpO1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVycygpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cnKS5yZW1vdmUoKTtcbiAgfVxuXG4gIG9uUmVzaXplKCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgLmNvbnRhaW5lcicpO1xuICAgIGxldCBvZmZzZXQgPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0ICogdGhpcy5pdGVyYXRpb25zO1xuXG4gICAgY29udGFpbmVyLnN0eWxlLm1hcmdpblRvcCA9IGAtJHtvZmZzZXR9cHhgO1xuICB9XG5cbiAgYWRkRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWJvYXJkTGlzdGVuZXIpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5mdWxsc2NyZWVuJylcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlRnVsbHNjcmVlbik7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmFycm93cy5uZXh0JylcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzl9KSk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmFycm93cy5wcmV2JylcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzd9KSk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5vblJlc2l6ZSk7XG4gIH1cblxuICByZW1vdmVFdmVudExpc3RlbmVycygpIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMua2V5Ym9hcmRMaXN0ZW5lcik7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmZ1bGxzY3JlZW4nKVxuICAgICAgLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy50b2dnbGVGdWxsc2NyZWVuKTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyBidXR0b24uYXJyb3dzLm5leHQnKVxuICAgICAgLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5rZXlib2FyZExpc3RlbmVyKHtrZXlDb2RlOiAzOX0pKTtcblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyBidXR0b24uYXJyb3dzLnByZXYnKVxuICAgICAgLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5rZXlib2FyZExpc3RlbmVyKHtrZXlDb2RlOiAzN30pKTtcblxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLm9uUmVzaXplKTtcbiAgfVxuXG4gIHRvZ2dsZUZ1bGxzY3JlZW4oKSB7XG4gICAgaWYgKCF0aGlzLmlzRnVsbHNjcmVlbikge1xuICAgICAgdGhpcy5sYXVuY2hJbnRvRnVsbHNjcmVlbihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2xpZGVzaG93JykpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgfVxuICB9XG5cbiAgbGF1bmNoSW50b0Z1bGxzY3JlZW4oZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgICBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICAgIGVsZW1lbnQubXNSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgIH1cblxuICAgIHRoaXMuaXNGdWxsc2NyZWVuID0gdHJ1ZTtcbiAgfVxuXG4gIGV4aXRGdWxsc2NyZWVuKCkge1xuICAgIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICAgIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKSB7XG4gICAgICBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xuICAgIH1cblxuICAgIHRoaXMuaXNGdWxsc2NyZWVuID0gZmFsc2U7XG4gIH1cblxuICBzZXRGb2N1cygpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IC5jb250YWluZXInKTtcblxuICAgIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKS5mb3JFYWNoKChpbWcsIGkpID0+IHtcbiAgICAgIGlmIChpbWcuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSkge1xuICAgICAgICB0aGlzLml0ZXJhdGlvbnMgPSBpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuaXRlcmF0aW9ucyA+IDApIHtcbiAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7Y29udGFpbmVyLm9mZnNldEhlaWdodCAqIHRoaXMuaXRlcmF0aW9uc31weGA7XG4gICAgfVxuICB9XG5cbiAga2V5Ym9hcmRMaXN0ZW5lcihlKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyAuY29udGFpbmVyJyk7XG4gICAgY29uc3QgcGljdHVyZXNDb3VudCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKS5sZW5ndGg7XG4gICAgbGV0IG9mZnNldCA9IGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgKiB0aGlzLml0ZXJhdGlvbnM7XG5cbiAgICBzd2l0Y2ggKGUua2V5Q29kZSkge1xuICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBpZiAob2Zmc2V0ICsgY29udGFpbmVyLm9mZnNldEhlaWdodCA8IHBpY3R1cmVzQ291bnQgKiBjb250YWluZXIub2Zmc2V0SGVpZ2h0KSB7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7b2Zmc2V0ICsgY29udGFpbmVyLm9mZnNldEhlaWdodH1weGA7XG4gICAgICAgIHRoaXMuaXRlcmF0aW9ucysrO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBpZiAob2Zmc2V0IC0gY29udGFpbmVyLm9mZnNldEhlaWdodCA+PSAwKSB7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSBgLSR7b2Zmc2V0IC0gY29udGFpbmVyLm9mZnNldEhlaWdodH1weGA7XG4gICAgICAgIHRoaXMuaXRlcmF0aW9ucy0tO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICBjYXNlIDI3OiAvLyBlc2NcbiAgICAgIHRoaXMuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgIHRoaXMuc3RvcCgpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNsaWRlc2hvdztcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBudW5qdWNrcyA9IHJlcXVpcmUoXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIik7XG5jb25zdCBzZXR0aW5ncyA9IHdpbmRvdy5MQi5zZXR0aW5ncztcblxuY29uc3QgZGVmYXVsdFRlbXBsYXRlcyA9IHtcbiAgcG9zdDogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1wb3N0Lmh0bWxcIiksXG4gIHRpbWVsaW5lOiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiksXG4gIGl0ZW1JbWFnZTogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiksXG4gIGl0ZW1FbWJlZDogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIiksXG4gIHNsaWRlc2hvdzogcmVxdWlyZShcIi4uLy4uL3RlbXBsYXRlcy90ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbFwiKVxufTtcblxuZnVuY3Rpb24gZ2V0Q3VzdG9tVGVtcGxhdGVzKCkge1xuICBsZXQgY3VzdG9tVGVtcGxhdGVzID0gc2V0dGluZ3MuY3VzdG9tVGVtcGxhdGVzXG4gICAgLCBtZXJnZWRUZW1wbGF0ZXMgPSBkZWZhdWx0VGVtcGxhdGVzO1xuXG4gIGZvciAobGV0IHRlbXBsYXRlIGluIGN1c3RvbVRlbXBsYXRlcykge1xuICAgIGxldCBjdXN0b21UZW1wbGF0ZU5hbWUgPSBjdXN0b21UZW1wbGF0ZXNbdGVtcGxhdGVdO1xuICAgIGRlZmF1bHRUZW1wbGF0ZXNbdGVtcGxhdGVdID0gKGN0eCwgY2IpID0+IHtcbiAgICAgIG51bmp1Y2tzLnJlbmRlcihjdXN0b21UZW1wbGF0ZU5hbWUsIGN0eCwgY2IpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gbWVyZ2VkVGVtcGxhdGVzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldHRpbmdzLmN1c3RvbVRlbXBsYXRlc1xuICA/IGdldEN1c3RvbVRlbXBsYXRlcygpXG4gIDogZGVmYXVsdFRlbXBsYXRlcztcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xudmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJyk7XG52YXIgU2xpZGVzaG93ID0gcmVxdWlyZSgnLi9zbGlkZXNob3cnKTtcblxudmFyIHRpbWVsaW5lRWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIubGItcG9zdHMubm9ybWFsXCIpXG4gICwgbG9hZE1vcmVQb3N0c0J1dHRvbiA9IGhlbHBlcnMuZ2V0RWxlbXMoXCJsb2FkLW1vcmUtcG9zdHNcIik7XG5cbi8qKlxuICogUmVwbGFjZSB0aGUgY3VycmVudCB0aW1lbGluZSB1bmNvbmRpdGlvbmFsbHkuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBhcGlfcmVzcG9uc2Ug4oCTIGNvbnRhaW5zIHJlcXVlc3Qgb3B0cy5cbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSByZXF1ZXN0T3B0cyAtIEFQSSByZXF1ZXN0IHBhcmFtcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyVGltZWxpbmUoYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciByZW5kZXJlZFBvc3RzID0gW107XG5cbiAgYXBpX3Jlc3BvbnNlLl9pdGVtcy5mb3JFYWNoKChwb3N0KSA9PiB7XG4gICAgcmVuZGVyZWRQb3N0cy5wdXNoKHRlbXBsYXRlcy5wb3N0KHtcbiAgICAgIGl0ZW06IHBvc3QsXG4gICAgICBzZXR0aW5nczogd2luZG93LkxCLnNldHRpbmdzXG4gICAgfSkpO1xuICB9KTtcblxuICB0aW1lbGluZUVsZW1bMF0uaW5uZXJIVE1MID0gcmVuZGVyZWRQb3N0cy5qb2luKFwiXCIpO1xuICBsb2FkRW1iZWRzKCk7XG4gIGF0dGFjaFNsaWRlc2hvdygpO1xufVxuXG4vKipcbiAqIFJlbmRlciBwb3N0cyBjdXJyZW50bHkgaW4gcGlwZWxpbmUgdG8gdGVtcGxhdGUuXG4gKiBUbyByZWR1Y2UgRE9NIGNhbGxzL3BhaW50cyB3ZSBoYW5kIG9mZiByZW5kZXJlZCBIVE1MIGluIGJ1bGsuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBhcGlfcmVzcG9uc2Ug4oCTIGNvbnRhaW5zIHJlcXVlc3Qgb3B0cy5cbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSByZXF1ZXN0T3B0cyAtIEFQSSByZXF1ZXN0IHBhcmFtcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyUG9zdHMoYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciByZW5kZXJlZFBvc3RzID0gW10gLy8gdGVtcG9yYXJ5IHN0b3JlXG4gICAgLCBwb3N0cyA9IGFwaV9yZXNwb25zZS5faXRlbXM7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb3N0cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBwb3N0ID0gcG9zdHNbaV07XG5cbiAgICBpZiAocG9zdHMub3BlcmF0aW9uID09PSBcImRlbGV0ZVwiKSB7XG4gICAgICBkZWxldGVQb3N0KHBvc3QuX2lkKTtcbiAgICAgIHJldHVybjsgLy8gZWFybHlcbiAgICB9XG5cbiAgICB2YXIgcmVuZGVyZWRQb3N0ID0gdGVtcGxhdGVzLnBvc3Qoe1xuICAgICAgaXRlbTogcG9zdCxcbiAgICAgIHNldHRpbmdzOiB3aW5kb3cuTEIuc2V0dGluZ3NcbiAgICB9KTtcblxuICAgIGlmIChwb3N0cy5vcGVyYXRpb24gPT09IFwidXBkYXRlXCIpIHtcbiAgICAgIHVwZGF0ZVBvc3QocmVuZGVyZWRQb3N0KTtcbiAgICAgIHJldHVybjsgLy8gZWFybHlcbiAgICB9XG5cbiAgICByZW5kZXJlZFBvc3RzLnB1c2gocmVuZGVyZWRQb3N0KTsgLy8gY3JlYXRlIG9wZXJhdGlvblxuICB9XG5cbiAgaWYgKCFyZW5kZXJlZFBvc3RzLmxlbmd0aCkge1xuICAgIHJldHVybjsgLy8gZWFybHlcbiAgfVxuICBcbiAgcmVuZGVyZWRQb3N0cy5yZXZlcnNlKCk7XG5cbiAgYWRkUG9zdHMocmVuZGVyZWRQb3N0cywgeyAvLyBpZiBjcmVhdGVzXG4gICAgcG9zaXRpb246IGFwaV9yZXNwb25zZS5yZXF1ZXN0T3B0cy5mcm9tRGF0ZSA/IFwidG9wXCIgOiBcImJvdHRvbVwiXG4gIH0pO1xuXG4gIGxvYWRFbWJlZHMoKTtcbn1cblxuLyoqXG4gKiBBZGQgcG9zdCBub2RlcyB0byBET00sIGRvIHNvIHJlZ2FyZGxlc3Mgb2Ygc2V0dGluZ3MuYXV0b0FwcGx5VXBkYXRlcyxcbiAqIGJ1dCByYXRoZXIgc2V0IHRoZW0gdG8gTk9UIEJFIERJU1BMQVlFRCBpZiBhdXRvLWFwcGx5IGlzIGZhbHNlLlxuICogVGhpcyB3YXkgd2UgZG9uJ3QgaGF2ZSB0byBtZXNzIHdpdGggdHdvIHN0YWNrcyBvZiBwb3N0cy5cbiAqIEBwYXJhbSB7YXJyYXl9IHBvc3RzIC0gYW4gYXJyYXkgb2YgTGl2ZWJsb2cgcG9zdCBpdGVtc1xuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBrZXl3b3JkIGFyZ3NcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLnBvc2l0aW9uIC0gdG9wIG9yIGJvdHRvbVxuICovXG5mdW5jdGlvbiBhZGRQb3N0cyhwb3N0cywgb3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgb3B0cy5wb3NpdGlvbiA9IG9wdHMucG9zaXRpb24gfHwgXCJib3R0b21cIjtcblxuICB2YXIgcG9zdHNIVE1MID0gXCJcIlxuICAgICwgcG9zaXRpb24gPSBvcHRzLnBvc2l0aW9uID09PSBcInRvcFwiXG4gICAgICAgID8gXCJhZnRlcmJlZ2luXCIgLy8gaW5zZXJ0QWRqYWNlbnRIVE1MIEFQSSA9PiBhZnRlciBzdGFydCBvZiBub2RlXG4gICAgICAgIDogXCJiZWZvcmVlbmRcIjsgLy8gaW5zZXJ0QWRqYWNlbnRIVE1MIEFQSSA9PiBiZWZvcmUgZW5kIG9mIG5vZGVcblxuICBmb3IgKHZhciBpID0gcG9zdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBwb3N0c0hUTUwgKz0gcG9zdHNbaV07XG4gIH1cblxuICB0aW1lbGluZUVsZW1bMF0uaW5zZXJ0QWRqYWNlbnRIVE1MKHBvc2l0aW9uLCBwb3N0c0hUTUwpO1xuICBhdHRhY2hTbGlkZXNob3coKTtcbn1cblxuLyoqXG4gKiBEZWxldGUgcG9zdCA8YXJ0aWNsZT4gRE9NIG5vZGUgYnkgZGF0YSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gLSBhIHBvc3QgVVJOXG4gKi9cbmZ1bmN0aW9uIGRlbGV0ZVBvc3QocG9zdElkKSB7XG4gIHZhciBlbGVtID0gaGVscGVycy5nZXRFbGVtcygnZGF0YS1qcy1wb3N0LWlkPVxcXCInICsgcG9zdElkICsgJ1xcXCInKTtcbiAgZWxlbVswXS5yZW1vdmUoKTtcbn1cblxuLyoqXG4gKiBEZWxldGUgcG9zdCA8YXJ0aWNsZT4gRE9NIG5vZGUgYnkgZGF0YSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gLSBhIHBvc3QgVVJOXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVBvc3QocG9zdElkLCByZW5kZXJlZFBvc3QpIHtcbiAgdmFyIGVsZW0gPSBoZWxwZXJzLmdldEVsZW1zKCdkYXRhLWpzLXBvc3QtaWQ9XFxcIicgKyBwb3N0SWQgKyAnXFxcIicpO1xuICBlbGVtWzBdLmlubmVySFRNTCA9IHJlbmRlcmVkUG9zdDtcbn1cblxuLyoqXG4gKiBTaG93IG5ldyBwb3N0cyBsb2FkZWQgdmlhIFhIUlxuICovXG5mdW5jdGlvbiBkaXNwbGF5TmV3UG9zdHMoKSB7XG4gIHZhciBuZXdQb3N0cyA9IGhlbHBlcnMuZ2V0RWxlbXMoXCJsYi1wb3N0LW5ld1wiKTtcbiAgZm9yICh2YXIgaSA9IG5ld1Bvc3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbmV3UG9zdHNbaV0uY2xhc3NMaXN0LnJlbW92ZShcImxiLXBvc3QtbmV3XCIpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlciBlbWJlZCBwcm92aWRlciB1bnBhY2tpbmdcbiAqIFRvZG86IE1ha2UgcmVxdWlyZWQgc2NyaXB0cyBhdmFpbGFibGUgb24gc3Vic2VxdWVudCBsb2Fkc1xuICovXG5mdW5jdGlvbiBsb2FkRW1iZWRzKCkge1xuICBpZiAod2luZG93Lmluc3Rncm0pIHtcbiAgICBpbnN0Z3JtLkVtYmVkcy5wcm9jZXNzKCk7XG4gIH1cblxuICBpZiAod2luZG93LnR3dHRyKSB7XG4gICAgdHd0dHIud2lkZ2V0cy5sb2FkKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9nZ2xlQ29tbWVudERpYWxvZygpIHtcbiAgbGV0IGNvbW1lbnRGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9ybS5jb21tZW50Jyk7XG4gIGxldCBpc0hpZGRlbiA9IGZhbHNlO1xuXG4gIGlmIChjb21tZW50Rm9ybSkge1xuICAgIGlzSGlkZGVuID0gY29tbWVudEZvcm0uY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZScpO1xuICB9XG5cbiAgcmV0dXJuICFpc0hpZGRlbjtcbn1cblxuLyoqXG4gKiBTZXQgc29ydGluZyBvcmRlciBidXR0b24gb2YgY2xhc3MgQG5hbWUgdG8gYWN0aXZlLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBsaXZlYmxvZyBBUEkgcmVzcG9uc2UgSlNPTi5cbiAqL1xuZnVuY3Rpb24gdG9nZ2xlU29ydEJ0bihuYW1lKSB7XG4gIHZhciBzb3J0aW5nQnRucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5zb3J0aW5nLWJhcl9fb3JkZXInKTtcblxuICBzb3J0aW5nQnRucy5mb3JFYWNoKChlbCkgPT4ge1xuICAgIHZhciBzaG91bGRCZUFjdGl2ZSA9IGVsLmRhdGFzZXQuaGFzT3duUHJvcGVydHkoXCJqc09yZGVyYnlfXCIgKyBuYW1lKTtcblxuICAgIGVsLmNsYXNzTGlzdC50b2dnbGUoJ3NvcnRpbmctYmFyX19vcmRlci0tYWN0aXZlJywgc2hvdWxkQmVBY3RpdmUpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBDb25kaXRpb25hbGx5IGhpZGUgbG9hZC1tb3JlLXBvc3RzIGJ1dHRvbi5cbiAqIEBwYXJhbSB7Ym9vbH0gc2hvdWxkVG9nZ2xlIC0gdHJ1ZSA9PiBoaWRlXG4gKi9cbmZ1bmN0aW9uIGhpZGVMb2FkTW9yZShzaG91bGRIaWRlKSB7XG4gIGlmIChsb2FkTW9yZVBvc3RzQnV0dG9uLmxlbmd0aCA+IDApIHtcbiAgICBsb2FkTW9yZVBvc3RzQnV0dG9uWzBdLmNsYXNzTGlzdC50b2dnbGUoXG4gICAgICBcIm1vZC0taGlkZVwiLCBzaG91bGRIaWRlKTtcbiAgfVxufVxuXG4vKipcbiAqIERlbGV0ZSBwb3N0IDxhcnRpY2xlPiBET00gbm9kZSBieSBkYXRhIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAtIGEgcG9zdCBVUk5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlVGltZXN0YW1wcygpIHtcbiAgdmFyIGRhdGVFbGVtcyA9IGhlbHBlcnMuZ2V0RWxlbXMoXCJsYi1wb3N0LWRhdGVcIik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0ZUVsZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGVsZW0gPSBkYXRlRWxlbXNbaV1cbiAgICAgICwgdGltZXN0YW1wID0gZWxlbS5kYXRhc2V0LmpzVGltZXN0YW1wO1xuICAgIGVsZW0udGV4dENvbnRlbnQgPSBoZWxwZXJzLmNvbnZlcnRUaW1lc3RhbXAodGltZXN0YW1wKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gc2hvd1N1Y2Nlc3NDb21tZW50TXNnKCkge1xuICBsZXQgY29tbWVudFNlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXYuY29tbWVudC1zZW50Jyk7XG5cbiAgY29tbWVudFNlbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZScpO1xuXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGNvbW1lbnRTZW50LmNsYXNzTGlzdC50b2dnbGUoJ2hpZGUnKTtcbiAgfSwgNTAwMCk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyQ29tbWVudEZvcm1FcnJvcnMoKSB7XG4gIGxldCBlcnJvcnNNc2dzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgncC5lcnItbXNnJyk7XG5cbiAgaWYgKGVycm9yc01zZ3MpIHtcbiAgICBlcnJvcnNNc2dzLmZvckVhY2goKGVycm9yc01zZykgPT4gZXJyb3JzTXNnLnJlbW92ZSgpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkaXNwbGF5Q29tbWVudEZvcm1FcnJvcnMoZXJyb3JzKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGVycm9ycykpIHtcbiAgICBlcnJvcnMuZm9yRWFjaCgoZXJyb3IpID0+IHtcbiAgICAgIGxldCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlcnJvci5pZCk7XG5cbiAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQuaW5zZXJ0QWRqYWNlbnRIVE1MKFxuICAgICAgICAgICdhZnRlcmVuZCcsXG4gICAgICAgICAgYDxwIGNsYXNzPVwiZXJyLW1zZ1wiPiR7ZXJyb3IubXNnfTwvcD5gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXR0YWNoU2xpZGVzaG93KCkge1xuICBjb25zdCBzbGlkZXNob3cgPSBuZXcgU2xpZGVzaG93KCk7XG4gIGNvbnN0IHNsaWRlc2hvd0ltYWdlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2FydGljbGUuc2xpZGVzaG93IGltZycpO1xuXG4gIGlmIChzbGlkZXNob3dJbWFnZXMpIHtcbiAgICBzbGlkZXNob3dJbWFnZXMuZm9yRWFjaCgoaW1hZ2UpID0+IHtcbiAgICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2xpZGVzaG93LnN0YXJ0KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkUG9zdHM6IGFkZFBvc3RzLFxuICBkZWxldGVQb3N0OiBkZWxldGVQb3N0LFxuICBkaXNwbGF5TmV3UG9zdHM6IGRpc3BsYXlOZXdQb3N0cyxcbiAgcmVuZGVyVGltZWxpbmU6IHJlbmRlclRpbWVsaW5lLFxuICByZW5kZXJQb3N0czogcmVuZGVyUG9zdHMsXG4gIHVwZGF0ZVBvc3Q6IHVwZGF0ZVBvc3QsXG4gIHVwZGF0ZVRpbWVzdGFtcHM6IHVwZGF0ZVRpbWVzdGFtcHMsXG4gIGhpZGVMb2FkTW9yZTogaGlkZUxvYWRNb3JlLFxuICB0b2dnbGVTb3J0QnRuOiB0b2dnbGVTb3J0QnRuLFxuICB0b2dnbGVDb21tZW50RGlhbG9nOiB0b2dnbGVDb21tZW50RGlhbG9nLFxuICBzaG93U3VjY2Vzc0NvbW1lbnRNc2c6IHNob3dTdWNjZXNzQ29tbWVudE1zZyxcbiAgZGlzcGxheUNvbW1lbnRGb3JtRXJyb3JzOiBkaXNwbGF5Q29tbWVudEZvcm1FcnJvcnMsXG4gIGNsZWFyQ29tbWVudEZvcm1FcnJvcnM6IGNsZWFyQ29tbWVudEZvcm1FcnJvcnMsXG4gIGF0dGFjaFNsaWRlc2hvdzogYXR0YWNoU2xpZGVzaG93XG59O1xuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJylcbiAgLCB2aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IGNvbW1lbnRJdGVtRW5kcG9pbnQgPSBgJHtMQi5hcGlfaG9zdH1hcGkvY2xpZW50X2l0ZW1zYDtcbmNvbnN0IGNvbW1lbnRQb3N0RW5kcG9pbnQgPSBgJHtMQi5hcGlfaG9zdH1hcGkvY2xpZW50X2NvbW1lbnRzYDtcblxudmFyIGVuZHBvaW50ID0gTEIuYXBpX2hvc3QgKyBcIi9hcGkvY2xpZW50X2Jsb2dzL1wiICsgTEIuYmxvZy5faWQgKyBcIi9wb3N0c1wiXG4gICwgc2V0dGluZ3MgPSBMQi5zZXR0aW5nc1xuICAsIHZtID0ge307XG5cbi8qKlxuICogR2V0IGluaXRpYWwgb3IgcmVzZXQgdmlld21vZGVsLlxuICogQHJldHVybnMge29iamVjdH0gZW1wdHkgdmlld21vZGVsIHN0b3JlLlxuICovXG5mdW5jdGlvbiBnZXRFbXB0eVZtKGl0ZW1zKSB7XG4gIHJldHVybiB7XG4gICAgX2l0ZW1zOiBuZXcgQXJyYXkoaXRlbXMpIHx8IDAsXG4gICAgY3VycmVudFBhZ2U6IDEsXG4gICAgdG90YWxQb3N0czogMFxuICB9O1xufVxuXG52bS5zZW5kQ29tbWVudCA9IChuYW1lLCBjb21tZW50KSA9PiB7XG4gIGxldCBlcnJvcnMgPSBbXTtcblxuICBpZiAoIW5hbWUpIHtcbiAgICBlcnJvcnMucHVzaCh7aWQ6ICcjY29tbWVudC1uYW1lJywgbXNnOiAnTWlzc2luZyBuYW1lJ30pO1xuICB9XG5cbiAgaWYgKCFjb21tZW50KSB7XG4gICAgZXJyb3JzLnB1c2goe2lkOiAnI2NvbW1lbnQtY29udGVudCcsIG1zZzogJ01pc3NpbmcgY29udGVudCd9KTtcbiAgfVxuXG4gIGlmIChlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiByZWplY3QoZXJyb3JzKSk7XG4gIH1cblxuICByZXR1cm4gaGVscGVyc1xuICAgIC5wb3N0KGNvbW1lbnRJdGVtRW5kcG9pbnQsIHtcbiAgICAgIGl0ZW1fdHlwZTogXCJjb21tZW50XCIsXG4gICAgICBjbGllbnRfYmxvZzogTEIuYmxvZy5faWQsXG4gICAgICBjb21tZW50ZXI6IG5hbWUsXG4gICAgICB0ZXh0OiBjb21tZW50XG4gICAgfSlcbiAgICAudGhlbigoaXRlbSkgPT4gaGVscGVycy5wb3N0KGNvbW1lbnRQb3N0RW5kcG9pbnQsIHtcbiAgICAgIHBvc3Rfc3RhdHVzOiBcImNvbW1lbnRcIixcbiAgICAgIGNsaWVudF9ibG9nOiBMQi5ibG9nLl9pZCxcbiAgICAgIGdyb3VwczogW3tcbiAgICAgICAgaWQ6IFwicm9vdFwiLFxuICAgICAgICByZWZzOiBbe2lkUmVmOiBcIm1haW5cIn1dLFxuICAgICAgICByb2xlOiBcImdycFJvbGU6TkVQXCJcbiAgICAgIH0se1xuICAgICAgICBpZDogXCJtYWluXCIsXG4gICAgICAgIHJlZnM6IFt7cmVzaWRSZWY6IGl0ZW0uX2lkfV0sXG4gICAgICAgIHJvbGU6IFwiZ3JwUm9sZTpNYWluXCJ9XG4gICAgICBdXG4gICAgfSkpO1xuICAgIC8vLmNhdGNoKChlcnIpID0+IHtcbiAgICAvLyAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIC8vfSk7XG59O1xuXG4vKipcbiAqIFByaXZhdGUgQVBJIHJlcXVlc3QgbWV0aG9kXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIHF1ZXJ5IGJ1aWxkZXIgb3B0aW9ucy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBvcHRzLnBhZ2UgLSBkZXNpcmVkIHBhZ2Uvc3Vic2V0IG9mIHBvc3RzLCBsZWF2ZSBlbXB0eSBmb3IgcG9sbGluZy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBvcHRzLmZyb21EYXRlIC0gbmVlZGVkIGZvciBwb2xsaW5nLlxuICogQHJldHVybnMge29iamVjdH0gTGl2ZWJsb2cgMyBBUEkgcmVzcG9uc2VcbiAqL1xudm0uZ2V0UG9zdHMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZGJRdWVyeSA9IHNlbGYuZ2V0UXVlcnkoe1xuICAgIHNvcnQ6IG9wdHMuc29ydCB8fCBzZWxmLnNldHRpbmdzLnBvc3RPcmRlcixcbiAgICBoaWdobGlnaHRzT25seTogZmFsc2UgfHwgb3B0cy5oaWdobGlnaHRzT25seSxcbiAgICBmcm9tRGF0ZTogb3B0cy5mcm9tRGF0ZVxuICAgICAgPyBvcHRzLmZyb21EYXRlXG4gICAgICA6IGZhbHNlXG4gIH0pO1xuXG4gIHZhciBwYWdlID0gb3B0cy5mcm9tRGF0ZSA/IDEgOiBvcHRzLnBhZ2U7XG4gIHZhciBxcyA9IFwiP21heF9yZXN1bHRzPVwiICsgc2V0dGluZ3MucG9zdHNQZXJQYWdlICsgXCImcGFnZT1cIiArIHBhZ2UgKyBcIiZzb3VyY2U9XCJcbiAgICAsIGZ1bGxQYXRoID0gZW5kcG9pbnQgKyBxcyArIGRiUXVlcnk7XG5cbiAgcmV0dXJuIGhlbHBlcnMuZ2V0SlNPTihmdWxsUGF0aClcbiAgICAudGhlbigocG9zdHMpID0+IHtcbiAgICAgIHNlbGYudXBkYXRlVmlld01vZGVsKHBvc3RzLCBvcHRzKTtcbiAgICAgIHBvc3RzLnJlcXVlc3RPcHRzID0gb3B0cztcbiAgICAgIHJldHVybiBwb3N0cztcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIEdldCBuZXh0IHBhZ2Ugb2YgcG9zdHMgZnJvbSBBUEkuXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIHF1ZXJ5IGJ1aWxkZXIgb3B0aW9ucy5cbiAqIEByZXR1cm5zIHtwcm9taXNlfSByZXNvbHZlcyB0byBwb3N0cyBhcnJheS5cbiAqL1xudm0ubG9hZFBvc3RzUGFnZSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIG9wdHMucGFnZSA9ICsrdGhpcy52bS5jdXJyZW50UGFnZTtcbiAgb3B0cy5zb3J0ID0gdGhpcy5zZXR0aW5ncy5wb3N0T3JkZXI7XG4gIHJldHVybiB0aGlzLmdldFBvc3RzKG9wdHMpO1xufTtcblxuLyoqXG4gKiBQb2xsIEFQSSBmb3IgbmV3IHBvc3RzLlxuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBxdWVyeSBidWlsZGVyIG9wdGlvbnMuXG4gKiBAcmV0dXJucyB7cHJvbWlzZX0gcmVzb2x2ZXMgdG8gcG9zdHMgYXJyYXkuXG4gKi9cbnZtLmxvYWRQb3N0cyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIG9wdHMuZnJvbURhdGUgPSB0aGlzLnZtLmxhdGVzdFVwZGF0ZTtcbiAgcmV0dXJuIHRoaXMuZ2V0UG9zdHMob3B0cyk7XG59O1xuXG4vKipcbiAqIEFkZCBpdGVtcyBpbiBhcGkgcmVzcG9uc2UgJiBsYXRlc3QgdXBkYXRlIHRpbWVzdGFtcCB0byB2aWV3bW9kZWwuXG4gKiBAcGFyYW0ge29iamVjdH0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKi9cbnZtLnVwZGF0ZVZpZXdNb2RlbCA9IGZ1bmN0aW9uKGFwaV9yZXNwb25zZSwgb3B0cykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKCFvcHRzLmZyb21EYXRlIHx8IG9wdHMuc29ydCAhPT0gc2VsZi5zZXR0aW5ncy5wb3N0T3JkZXIpIHsgLy8gTWVhbnMgd2UncmUgbm90IHBvbGxpbmdcbiAgICB2aWV3LmhpZGVMb2FkTW9yZShzZWxmLmlzVGltZWxpbmVFbmQoYXBpX3Jlc3BvbnNlKSk7IC8vIHRoZSBlbmQ/XG4gIH0gZWxzZSB7IC8vIE1lYW5zIHdlJ3JlIHBvbGxpbmcgZm9yIG5ldyBwb3N0c1xuICAgIGlmICghYXBpX3Jlc3BvbnNlLl9pdGVtcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLnZtLmxhdGVzdFVwZGF0ZSA9IHNlbGYuZ2V0TGF0ZXN0VXBkYXRlKGFwaV9yZXNwb25zZSk7XG4gIH1cblxuICBpZiAob3B0cy5zb3J0ICE9PSBzZWxmLnNldHRpbmdzLnBvc3RPcmRlcikge1xuICAgIHNlbGYudm0gPSBnZXRFbXB0eVZtKCk7XG4gICAgdmlldy5oaWRlTG9hZE1vcmUoZmFsc2UpO1xuICAgIE9iamVjdC5hc3NpZ24oc2VsZi52bSwgYXBpX3Jlc3BvbnNlKTtcbiAgfSBlbHNlIHtcbiAgICBzZWxmLnZtLl9pdGVtcy5wdXNoLmFwcGx5KHNlbGYudm0uX2l0ZW1zLCBhcGlfcmVzcG9uc2UuX2l0ZW1zKTtcbiAgfVxuXG4gIHNlbGYuc2V0dGluZ3MucG9zdE9yZGVyID0gb3B0cy5zb3J0O1xuICByZXR1cm4gYXBpX3Jlc3BvbnNlO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGxhdGVzdCB1cGRhdGUgdGltZXN0YW1wIGZyb20gYSBudW1iZXIgb2YgcG9zdHMuXG4gKiBAcGFyYW0ge29iamVjdH0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIElTTyA4NjAxIGVuY29kZWQgZGF0ZVxuICovXG52bS5nZXRMYXRlc3RVcGRhdGUgPSBmdW5jdGlvbihhcGlfcmVzcG9uc2UpIHtcbiAgdmFyIHRpbWVzdGFtcHMgPSBhcGlfcmVzcG9uc2UuX2l0ZW1zLm1hcCgocG9zdCkgPT4gbmV3IERhdGUocG9zdC5fdXBkYXRlZCkpO1xuXG4gIHZhciBsYXRlc3QgPSBuZXcgRGF0ZShNYXRoLm1heC5hcHBseShudWxsLCB0aW1lc3RhbXBzKSk7XG4gIHJldHVybiBsYXRlc3QudG9JU09TdHJpbmcoKTsgLy8gY29udmVydCB0aW1lc3RhbXAgdG8gSVNPXG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHdlIHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgdGltZWxpbmUuXG4gKiBAcGFyYW0ge29iamVjdH0gYXBpX3Jlc3BvbnNlIC0gbGl2ZWJsb2cgQVBJIHJlc3BvbnNlIEpTT04uXG4gKiBAcmV0dXJucyB7Ym9vbH1cbiAqL1xudm0uaXNUaW1lbGluZUVuZCA9IGZ1bmN0aW9uKGFwaV9yZXNwb25zZSkge1xuICB2YXIgaXRlbXNJblZpZXcgPSB0aGlzLnZtLl9pdGVtcy5sZW5ndGggKyBzZXR0aW5ncy5wb3N0c1BlclBhZ2U7XG4gIHJldHVybiBhcGlfcmVzcG9uc2UuX21ldGEudG90YWwgPD0gaXRlbXNJblZpZXc7XG59O1xuXG4vKipcbiAqIFNldCB1cCB2aWV3bW9kZWwuXG4gKi9cbnZtLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICB0aGlzLnZtID0gZ2V0RW1wdHlWbShzZXR0aW5ncy5wb3N0c1BlclBhZ2UpO1xuICB0aGlzLnZtLmxhdGVzdFVwZGF0ZSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgdGhpcy52bS50aW1lSW5pdGlhbGl6ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gIHJldHVybiB0aGlzLnZtLmxhdGVzdFVwZGF0ZTtcbn07XG5cbi8qKlxuICogQnVpbGQgdXJsZW5jb2RlZCBFbGFzdGljU2VhcmNoIFF1ZXJ5c3RyaW5nXG4gKiBUT0RPOiBhYnN0cmFjdCBhd2F5LCB3ZSBvbmx5IG5lZWQgc3RpY2t5IGZsYWcgYW5kIG9yZGVyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIGFyZ3VtZW50cyBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLnNvcnQgLSBpZiBcImFzY2VuZGluZ1wiLCBnZXQgaXRlbXMgaW4gYXNjZW5kaW5nIG9yZGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5mcm9tRGF0ZSAtIHJlc3VsdHMgd2l0aCBhIElTTyA4NjAxIHRpbWVzdGFtcCBndCB0aGlzIG9ubHlcbiAqIEBwYXJhbSB7Ym9vbH0gb3B0cy5oaWdobGlnaHRzT25seSAtIGdldCBlZGl0b3JpYWwvaGlnaGxpZ2h0ZWQgaXRlbXMgb25seVxuICogQHJldHVybnMge3N0cmluZ30gUXVlcnlzdHJpbmdcbiAqL1xudm0uZ2V0UXVlcnkgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHZhciBxdWVyeSA9IHtcbiAgICBcInF1ZXJ5XCI6IHtcbiAgICAgIFwiZmlsdGVyZWRcIjoge1xuICAgICAgICBcImZpbHRlclwiOiB7XG4gICAgICAgICAgXCJhbmRcIjogW1xuICAgICAgICAgICAge1widGVybVwiOiB7XCJzdGlja3lcIjogZmFsc2V9fSxcbiAgICAgICAgICAgIHtcInRlcm1cIjoge1wicG9zdF9zdGF0dXNcIjogXCJvcGVuXCJ9fSxcbiAgICAgICAgICAgIHtcIm5vdFwiOiB7XCJ0ZXJtXCI6IHtcImRlbGV0ZWRcIjogdHJ1ZX19fSxcbiAgICAgICAgICAgIHtcInJhbmdlXCI6IHtcIl91cGRhdGVkXCI6IHtcImx0XCI6IHRoaXMudm0udGltZUluaXRpYWxpemVkfX19XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcInNvcnRcIjogW1xuICAgICAge1xuICAgICAgICBcIl91cGRhdGVkXCI6IHtcIm9yZGVyXCI6IFwiZGVzY1wifVxuICAgICAgfVxuICAgIF1cbiAgfTtcblxuICBpZiAob3B0cy5mcm9tRGF0ZSkge1xuICAgIHF1ZXJ5LnF1ZXJ5LmZpbHRlcmVkLmZpbHRlci5hbmRbM10ucmFuZ2UuX3VwZGF0ZWQgPSB7XG4gICAgICBcImd0XCI6IG9wdHMuZnJvbURhdGVcbiAgICB9O1xuICB9XG5cbiAgaWYgKG9wdHMuaGlnaGxpZ2h0c09ubHkgPT09IHRydWUpIHtcbiAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kLnB1c2goe1xuICAgICAgdGVybToge2hpZ2hsaWdodDogdHJ1ZX1cbiAgICB9KTtcbiAgfVxuXG4gIGlmIChvcHRzLnNvcnQgPT09IFwiYXNjZW5kaW5nXCIpIHtcbiAgICBxdWVyeS5zb3J0WzBdLl91cGRhdGVkLm9yZGVyID0gXCJhc2NcIjtcbiAgfSBlbHNlIGlmIChvcHRzLnNvcnQgPT09IFwiZWRpdG9yaWFsXCIpIHtcbiAgICBxdWVyeS5zb3J0ID0gW1xuICAgICAge1xuICAgICAgICBvcmRlcjoge1xuICAgICAgICAgIG9yZGVyOiBcImRlc2NcIixcbiAgICAgICAgICBtaXNzaW5nOiBcIl9sYXN0XCIsXG4gICAgICAgICAgdW5tYXBwZWRfdHlwZTogXCJsb25nXCJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF07XG4gIH1cblxuICAvLyBSZW1vdmUgdGhlIHJhbmdlLCB3ZSB3YW50IGFsbCB0aGUgcmVzdWx0c1xuICBpZiAoW1wiYXNjZW5kaW5nXCIsIFwiZGVzY2VuZGluZ1wiLCBcImVkaXRvcmlhbFwiXS5pbmRleE9mKG9wdHMuc29ydCkpIHtcbiAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kLmZvckVhY2goKHJ1bGUsIGluZGV4KSA9PiB7XG4gICAgICBpZiAocnVsZS5oYXNPd25Qcm9wZXJ0eSgncmFuZ2UnKSkge1xuICAgICAgICBxdWVyeS5xdWVyeS5maWx0ZXJlZC5maWx0ZXIuYW5kLnNwbGljZShpbmRleCwgMSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gZW5jb2RlVVJJKEpTT04uc3RyaW5naWZ5KHF1ZXJ5KSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHZtO1xuIiwiLyohIEJyb3dzZXIgYnVuZGxlIG9mIG51bmp1Y2tzIDMuMC4xIChzbGltLCBvbmx5IHdvcmtzIHdpdGggcHJlY29tcGlsZWQgdGVtcGxhdGVzKSAqL1xuKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wibnVuanVja3NcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wibnVuanVja3NcIl0gPSBmYWN0b3J5KCk7XG59KSh0aGlzLCBmdW5jdGlvbigpIHtcbnJldHVybiAvKioqKioqLyAoZnVuY3Rpb24obW9kdWxlcykgeyAvLyB3ZWJwYWNrQm9vdHN0cmFwXG4vKioqKioqLyBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbi8qKioqKiovIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuLyoqKioqKi8gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuLyoqKioqKi8gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbi8qKioqKiovIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbi8qKioqKiovIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbi8qKioqKiovIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4vKioqKioqLyBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbi8qKioqKiovIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4vKioqKioqLyBcdFx0XHRleHBvcnRzOiB7fSxcbi8qKioqKiovIFx0XHRcdGlkOiBtb2R1bGVJZCxcbi8qKioqKiovIFx0XHRcdGxvYWRlZDogZmFsc2Vcbi8qKioqKiovIFx0XHR9O1xuXG4vKioqKioqLyBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4vKioqKioqLyBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbi8qKioqKiovIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4vKioqKioqLyBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbi8qKioqKiovIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuLyoqKioqKi8gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbi8qKioqKiovIFx0fVxuXG5cbi8qKioqKiovIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbi8qKioqKiovIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vKioqKioqLyBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuLyoqKioqKi8gfSlcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqLyAoW1xuLyogMCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblx0dmFyIGVudiA9IF9fd2VicGFja19yZXF1aXJlX18oMik7XG5cdHZhciBMb2FkZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDE1KTtcblx0dmFyIGxvYWRlcnMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgcHJlY29tcGlsZSA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSB7fTtcblx0bW9kdWxlLmV4cG9ydHMuRW52aXJvbm1lbnQgPSBlbnYuRW52aXJvbm1lbnQ7XG5cdG1vZHVsZS5leHBvcnRzLlRlbXBsYXRlID0gZW52LlRlbXBsYXRlO1xuXG5cdG1vZHVsZS5leHBvcnRzLkxvYWRlciA9IExvYWRlcjtcblx0bW9kdWxlLmV4cG9ydHMuRmlsZVN5c3RlbUxvYWRlciA9IGxvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcjtcblx0bW9kdWxlLmV4cG9ydHMuUHJlY29tcGlsZWRMb2FkZXIgPSBsb2FkZXJzLlByZWNvbXBpbGVkTG9hZGVyO1xuXHRtb2R1bGUuZXhwb3J0cy5XZWJMb2FkZXIgPSBsb2FkZXJzLldlYkxvYWRlcjtcblxuXHRtb2R1bGUuZXhwb3J0cy5jb21waWxlciA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdG1vZHVsZS5leHBvcnRzLnBhcnNlciA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdG1vZHVsZS5leHBvcnRzLmxleGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0bW9kdWxlLmV4cG9ydHMucnVudGltZSA9IF9fd2VicGFja19yZXF1aXJlX18oOCk7XG5cdG1vZHVsZS5leHBvcnRzLmxpYiA9IGxpYjtcblx0bW9kdWxlLmV4cG9ydHMubm9kZXMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXG5cdG1vZHVsZS5leHBvcnRzLmluc3RhbGxKaW5qYUNvbXBhdCA9IF9fd2VicGFja19yZXF1aXJlX18oMTYpO1xuXG5cdC8vIEEgc2luZ2xlIGluc3RhbmNlIG9mIGFuIGVudmlyb25tZW50LCBzaW5jZSB0aGlzIGlzIHNvIGNvbW1vbmx5IHVzZWRcblxuXHR2YXIgZTtcblx0bW9kdWxlLmV4cG9ydHMuY29uZmlndXJlID0gZnVuY3Rpb24odGVtcGxhdGVzUGF0aCwgb3B0cykge1xuXHQgICAgb3B0cyA9IG9wdHMgfHwge307XG5cdCAgICBpZihsaWIuaXNPYmplY3QodGVtcGxhdGVzUGF0aCkpIHtcblx0ICAgICAgICBvcHRzID0gdGVtcGxhdGVzUGF0aDtcblx0ICAgICAgICB0ZW1wbGF0ZXNQYXRoID0gbnVsbDtcblx0ICAgIH1cblxuXHQgICAgdmFyIFRlbXBsYXRlTG9hZGVyO1xuXHQgICAgaWYobG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKSB7XG5cdCAgICAgICAgVGVtcGxhdGVMb2FkZXIgPSBuZXcgbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKHRlbXBsYXRlc1BhdGgsIHtcblx0ICAgICAgICAgICAgd2F0Y2g6IG9wdHMud2F0Y2gsXG5cdCAgICAgICAgICAgIG5vQ2FjaGU6IG9wdHMubm9DYWNoZVxuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXHQgICAgZWxzZSBpZihsb2FkZXJzLldlYkxvYWRlcikge1xuXHQgICAgICAgIFRlbXBsYXRlTG9hZGVyID0gbmV3IGxvYWRlcnMuV2ViTG9hZGVyKHRlbXBsYXRlc1BhdGgsIHtcblx0ICAgICAgICAgICAgdXNlQ2FjaGU6IG9wdHMud2ViICYmIG9wdHMud2ViLnVzZUNhY2hlLFxuXHQgICAgICAgICAgICBhc3luYzogb3B0cy53ZWIgJiYgb3B0cy53ZWIuYXN5bmNcblx0ICAgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgZSA9IG5ldyBlbnYuRW52aXJvbm1lbnQoVGVtcGxhdGVMb2FkZXIsIG9wdHMpO1xuXG5cdCAgICBpZihvcHRzICYmIG9wdHMuZXhwcmVzcykge1xuXHQgICAgICAgIGUuZXhwcmVzcyhvcHRzLmV4cHJlc3MpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gZTtcblx0fTtcblxuXHRtb2R1bGUuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24oc3JjLCBlbnYsIHBhdGgsIGVhZ2VyQ29tcGlsZSkge1xuXHQgICAgaWYoIWUpIHtcblx0ICAgICAgICBtb2R1bGUuZXhwb3J0cy5jb25maWd1cmUoKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiBuZXcgbW9kdWxlLmV4cG9ydHMuVGVtcGxhdGUoc3JjLCBlbnYsIHBhdGgsIGVhZ2VyQ29tcGlsZSk7XG5cdH07XG5cblx0bW9kdWxlLmV4cG9ydHMucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgY3R4LCBjYikge1xuXHQgICAgaWYoIWUpIHtcblx0ICAgICAgICBtb2R1bGUuZXhwb3J0cy5jb25maWd1cmUoKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIGUucmVuZGVyKG5hbWUsIGN0eCwgY2IpO1xuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzLnJlbmRlclN0cmluZyA9IGZ1bmN0aW9uKHNyYywgY3R4LCBjYikge1xuXHQgICAgaWYoIWUpIHtcblx0ICAgICAgICBtb2R1bGUuZXhwb3J0cy5jb25maWd1cmUoKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIGUucmVuZGVyU3RyaW5nKHNyYywgY3R4LCBjYik7XG5cdH07XG5cblx0aWYocHJlY29tcGlsZSkge1xuXHQgICAgbW9kdWxlLmV4cG9ydHMucHJlY29tcGlsZSA9IHByZWNvbXBpbGUucHJlY29tcGlsZTtcblx0ICAgIG1vZHVsZS5leHBvcnRzLnByZWNvbXBpbGVTdHJpbmcgPSBwcmVjb21waWxlLnByZWNvbXBpbGVTdHJpbmc7XG5cdH1cblxuXG4vKioqLyB9KSxcbi8qIDEgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGU7XG5cdHZhciBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cblx0dmFyIGVzY2FwZU1hcCA9IHtcblx0ICAgICcmJzogJyZhbXA7Jyxcblx0ICAgICdcIic6ICcmcXVvdDsnLFxuXHQgICAgJ1xcJyc6ICcmIzM5OycsXG5cdCAgICAnPCc6ICcmbHQ7Jyxcblx0ICAgICc+JzogJyZndDsnXG5cdH07XG5cblx0dmFyIGVzY2FwZVJlZ2V4ID0gL1smXCInPD5dL2c7XG5cblx0dmFyIGxvb2t1cEVzY2FwZSA9IGZ1bmN0aW9uKGNoKSB7XG5cdCAgICByZXR1cm4gZXNjYXBlTWFwW2NoXTtcblx0fTtcblxuXHR2YXIgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cblx0ZXhwb3J0cy5wcmV0dGlmeUVycm9yID0gZnVuY3Rpb24ocGF0aCwgd2l0aEludGVybmFscywgZXJyKSB7XG5cdCAgICAvLyBqc2hpbnQgLVcwMjJcblx0ICAgIC8vIGh0dHA6Ly9qc2xpbnRlcnJvcnMuY29tL2RvLW5vdC1hc3NpZ24tdG8tdGhlLWV4Y2VwdGlvbi1wYXJhbWV0ZXJcblx0ICAgIGlmICghZXJyLlVwZGF0ZSkge1xuXHQgICAgICAgIC8vIG5vdCBvbmUgb2Ygb3VycywgY2FzdCBpdFxuXHQgICAgICAgIGVyciA9IG5ldyBleHBvcnRzLlRlbXBsYXRlRXJyb3IoZXJyKTtcblx0ICAgIH1cblx0ICAgIGVyci5VcGRhdGUocGF0aCk7XG5cblx0ICAgIC8vIFVubGVzcyB0aGV5IG1hcmtlZCB0aGUgZGV2IGZsYWcsIHNob3cgdGhlbSBhIHRyYWNlIGZyb20gaGVyZVxuXHQgICAgaWYgKCF3aXRoSW50ZXJuYWxzKSB7XG5cdCAgICAgICAgdmFyIG9sZCA9IGVycjtcblx0ICAgICAgICBlcnIgPSBuZXcgRXJyb3Iob2xkLm1lc3NhZ2UpO1xuXHQgICAgICAgIGVyci5uYW1lID0gb2xkLm5hbWU7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBlcnI7XG5cdH07XG5cblx0ZXhwb3J0cy5UZW1wbGF0ZUVycm9yID0gZnVuY3Rpb24obWVzc2FnZSwgbGluZW5vLCBjb2xubykge1xuXHQgICAgdmFyIGVyciA9IHRoaXM7XG5cblx0ICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgRXJyb3IpIHsgLy8gZm9yIGNhc3RpbmcgcmVndWxhciBqcyBlcnJvcnNcblx0ICAgICAgICBlcnIgPSBtZXNzYWdlO1xuXHQgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLm5hbWUgKyAnOiAnICsgbWVzc2FnZS5tZXNzYWdlO1xuXG5cdCAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgaWYoZXJyLm5hbWUgPSAnJykge31cblx0ICAgICAgICB9XG5cdCAgICAgICAgY2F0Y2goZSkge1xuXHQgICAgICAgICAgICAvLyBJZiB3ZSBjYW4ndCBzZXQgdGhlIG5hbWUgb2YgdGhlIGVycm9yIG9iamVjdCBpbiB0aGlzXG5cdCAgICAgICAgICAgIC8vIGVudmlyb25tZW50LCBkb24ndCB1c2UgaXRcblx0ICAgICAgICAgICAgZXJyID0gdGhpcztcblx0ICAgICAgICB9XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIGlmKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG5cdCAgICAgICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKGVycik7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBlcnIubmFtZSA9ICdUZW1wbGF0ZSByZW5kZXIgZXJyb3InO1xuXHQgICAgZXJyLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHQgICAgZXJyLmxpbmVubyA9IGxpbmVubztcblx0ICAgIGVyci5jb2xubyA9IGNvbG5vO1xuXHQgICAgZXJyLmZpcnN0VXBkYXRlID0gdHJ1ZTtcblxuXHQgICAgZXJyLlVwZGF0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcblx0ICAgICAgICB2YXIgbWVzc2FnZSA9ICcoJyArIChwYXRoIHx8ICd1bmtub3duIHBhdGgnKSArICcpJztcblxuXHQgICAgICAgIC8vIG9ubHkgc2hvdyBsaW5lbm8gKyBjb2xubyBuZXh0IHRvIHBhdGggb2YgdGVtcGxhdGVcblx0ICAgICAgICAvLyB3aGVyZSBlcnJvciBvY2N1cnJlZFxuXHQgICAgICAgIGlmICh0aGlzLmZpcnN0VXBkYXRlKSB7XG5cdCAgICAgICAgICAgIGlmKHRoaXMubGluZW5vICYmIHRoaXMuY29sbm8pIHtcblx0ICAgICAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyBbTGluZSAnICsgdGhpcy5saW5lbm8gKyAnLCBDb2x1bW4gJyArIHRoaXMuY29sbm8gKyAnXSc7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZih0aGlzLmxpbmVubykge1xuXHQgICAgICAgICAgICAgICAgbWVzc2FnZSArPSAnIFtMaW5lICcgKyB0aGlzLmxpbmVubyArICddJztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIG1lc3NhZ2UgKz0gJ1xcbiAnO1xuXHQgICAgICAgIGlmICh0aGlzLmZpcnN0VXBkYXRlKSB7XG5cdCAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyAnO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgKyAodGhpcy5tZXNzYWdlIHx8ICcnKTtcblx0ICAgICAgICB0aGlzLmZpcnN0VXBkYXRlID0gZmFsc2U7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9O1xuXG5cdCAgICByZXR1cm4gZXJyO1xuXHR9O1xuXG5cdGV4cG9ydHMuVGVtcGxhdGVFcnJvci5wcm90b3R5cGUgPSBFcnJvci5wcm90b3R5cGU7XG5cblx0ZXhwb3J0cy5lc2NhcGUgPSBmdW5jdGlvbih2YWwpIHtcblx0ICByZXR1cm4gdmFsLnJlcGxhY2UoZXNjYXBlUmVnZXgsIGxvb2t1cEVzY2FwZSk7XG5cdH07XG5cblx0ZXhwb3J0cy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXHR9O1xuXG5cdGV4cG9ydHMuaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xuXHR9O1xuXG5cdGV4cG9ydHMuaXNTdHJpbmcgPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IFN0cmluZ10nO1xuXHR9O1xuXG5cdGV4cG9ydHMuaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xuXHR9O1xuXG5cdGV4cG9ydHMuZ3JvdXBCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsKSB7XG5cdCAgICB2YXIgcmVzdWx0ID0ge307XG5cdCAgICB2YXIgaXRlcmF0b3IgPSBleHBvcnRzLmlzRnVuY3Rpb24odmFsKSA/IHZhbCA6IGZ1bmN0aW9uKG9iaikgeyByZXR1cm4gb2JqW3ZhbF07IH07XG5cdCAgICBmb3IodmFyIGk9MDsgaTxvYmoubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICB2YXIgdmFsdWUgPSBvYmpbaV07XG5cdCAgICAgICAgdmFyIGtleSA9IGl0ZXJhdG9yKHZhbHVlLCBpKTtcblx0ICAgICAgICAocmVzdWx0W2tleV0gfHwgKHJlc3VsdFtrZXldID0gW10pKS5wdXNoKHZhbHVlKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiByZXN1bHQ7XG5cdH07XG5cblx0ZXhwb3J0cy50b0FycmF5ID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqKTtcblx0fTtcblxuXHRleHBvcnRzLndpdGhvdXQgPSBmdW5jdGlvbihhcnJheSkge1xuXHQgICAgdmFyIHJlc3VsdCA9IFtdO1xuXHQgICAgaWYgKCFhcnJheSkge1xuXHQgICAgICAgIHJldHVybiByZXN1bHQ7XG5cdCAgICB9XG5cdCAgICB2YXIgaW5kZXggPSAtMSxcblx0ICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcblx0ICAgIGNvbnRhaW5zID0gZXhwb3J0cy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG5cblx0ICAgIHdoaWxlKCsraW5kZXggPCBsZW5ndGgpIHtcblx0ICAgICAgICBpZihleHBvcnRzLmluZGV4T2YoY29udGFpbnMsIGFycmF5W2luZGV4XSkgPT09IC0xKSB7XG5cdCAgICAgICAgICAgIHJlc3VsdC5wdXNoKGFycmF5W2luZGV4XSk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIHJlc3VsdDtcblx0fTtcblxuXHRleHBvcnRzLmV4dGVuZCA9IGZ1bmN0aW9uKG9iaiwgb2JqMikge1xuXHQgICAgZm9yKHZhciBrIGluIG9iajIpIHtcblx0ICAgICAgICBvYmpba10gPSBvYmoyW2tdO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIG9iajtcblx0fTtcblxuXHRleHBvcnRzLnJlcGVhdCA9IGZ1bmN0aW9uKGNoYXJfLCBuKSB7XG5cdCAgICB2YXIgc3RyID0gJyc7XG5cdCAgICBmb3IodmFyIGk9MDsgaTxuOyBpKyspIHtcblx0ICAgICAgICBzdHIgKz0gY2hhcl87XG5cdCAgICB9XG5cdCAgICByZXR1cm4gc3RyO1xuXHR9O1xuXG5cdGV4cG9ydHMuZWFjaCA9IGZ1bmN0aW9uKG9iaiwgZnVuYywgY29udGV4dCkge1xuXHQgICAgaWYob2JqID09IG51bGwpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIGlmKEFycmF5UHJvdG8uZWFjaCAmJiBvYmouZWFjaCA9PT0gQXJyYXlQcm90by5lYWNoKSB7XG5cdCAgICAgICAgb2JqLmZvckVhY2goZnVuYywgY29udGV4dCk7XG5cdCAgICB9XG5cdCAgICBlbHNlIGlmKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG5cdCAgICAgICAgZm9yKHZhciBpPTAsIGw9b2JqLmxlbmd0aDsgaTxsOyBpKyspIHtcblx0ICAgICAgICAgICAgZnVuYy5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cdH07XG5cblx0ZXhwb3J0cy5tYXAgPSBmdW5jdGlvbihvYmosIGZ1bmMpIHtcblx0ICAgIHZhciByZXN1bHRzID0gW107XG5cdCAgICBpZihvYmogPT0gbnVsbCkge1xuXHQgICAgICAgIHJldHVybiByZXN1bHRzO1xuXHQgICAgfVxuXG5cdCAgICBpZihBcnJheVByb3RvLm1hcCAmJiBvYmoubWFwID09PSBBcnJheVByb3RvLm1hcCkge1xuXHQgICAgICAgIHJldHVybiBvYmoubWFwKGZ1bmMpO1xuXHQgICAgfVxuXG5cdCAgICBmb3IodmFyIGk9MDsgaTxvYmoubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICByZXN1bHRzW3Jlc3VsdHMubGVuZ3RoXSA9IGZ1bmMob2JqW2ldLCBpKTtcblx0ICAgIH1cblxuXHQgICAgaWYob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcblx0ICAgICAgICByZXN1bHRzLmxlbmd0aCA9IG9iai5sZW5ndGg7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiByZXN1bHRzO1xuXHR9O1xuXG5cdGV4cG9ydHMuYXN5bmNJdGVyID0gZnVuY3Rpb24oYXJyLCBpdGVyLCBjYikge1xuXHQgICAgdmFyIGkgPSAtMTtcblxuXHQgICAgZnVuY3Rpb24gbmV4dCgpIHtcblx0ICAgICAgICBpKys7XG5cblx0ICAgICAgICBpZihpIDwgYXJyLmxlbmd0aCkge1xuXHQgICAgICAgICAgICBpdGVyKGFycltpXSwgaSwgbmV4dCwgY2IpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgY2IoKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIG5leHQoKTtcblx0fTtcblxuXHRleHBvcnRzLmFzeW5jRm9yID0gZnVuY3Rpb24ob2JqLCBpdGVyLCBjYikge1xuXHQgICAgdmFyIGtleXMgPSBleHBvcnRzLmtleXMob2JqKTtcblx0ICAgIHZhciBsZW4gPSBrZXlzLmxlbmd0aDtcblx0ICAgIHZhciBpID0gLTE7XG5cblx0ICAgIGZ1bmN0aW9uIG5leHQoKSB7XG5cdCAgICAgICAgaSsrO1xuXHQgICAgICAgIHZhciBrID0ga2V5c1tpXTtcblxuXHQgICAgICAgIGlmKGkgPCBsZW4pIHtcblx0ICAgICAgICAgICAgaXRlcihrLCBvYmpba10sIGksIGxlbiwgbmV4dCk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBjYigpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgbmV4dCgpO1xuXHR9O1xuXG5cdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2luZGV4T2YjUG9seWZpbGxcblx0ZXhwb3J0cy5pbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YgP1xuXHQgICAgZnVuY3Rpb24gKGFyciwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG5cdCAgICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoYXJyLCBzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpO1xuXHQgICAgfSA6XG5cdCAgICBmdW5jdGlvbiAoYXJyLCBzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcblx0ICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggPj4+IDA7IC8vIEhhY2sgdG8gY29udmVydCBvYmplY3QubGVuZ3RoIHRvIGEgVUludDMyXG5cblx0ICAgICAgICBmcm9tSW5kZXggPSArZnJvbUluZGV4IHx8IDA7XG5cblx0ICAgICAgICBpZihNYXRoLmFicyhmcm9tSW5kZXgpID09PSBJbmZpbml0eSkge1xuXHQgICAgICAgICAgICBmcm9tSW5kZXggPSAwO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKGZyb21JbmRleCA8IDApIHtcblx0ICAgICAgICAgICAgZnJvbUluZGV4ICs9IGxlbmd0aDtcblx0ICAgICAgICAgICAgaWYgKGZyb21JbmRleCA8IDApIHtcblx0ICAgICAgICAgICAgICAgIGZyb21JbmRleCA9IDA7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmb3IoO2Zyb21JbmRleCA8IGxlbmd0aDsgZnJvbUluZGV4KyspIHtcblx0ICAgICAgICAgICAgaWYgKGFycltmcm9tSW5kZXhdID09PSBzZWFyY2hFbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZnJvbUluZGV4O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIC0xO1xuXHQgICAgfTtcblxuXHRpZighQXJyYXkucHJvdG90eXBlLm1hcCkge1xuXHQgICAgQXJyYXkucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignbWFwIGlzIHVuaW1wbGVtZW50ZWQgZm9yIHRoaXMganMgZW5naW5lJyk7XG5cdCAgICB9O1xuXHR9XG5cblx0ZXhwb3J0cy5rZXlzID0gZnVuY3Rpb24ob2JqKSB7XG5cdCAgICBpZihPYmplY3QucHJvdG90eXBlLmtleXMpIHtcblx0ICAgICAgICByZXR1cm4gb2JqLmtleXMoKTtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHZhciBrZXlzID0gW107XG5cdCAgICAgICAgZm9yKHZhciBrIGluIG9iaikge1xuXHQgICAgICAgICAgICBpZihvYmouaGFzT3duUHJvcGVydHkoaykpIHtcblx0ICAgICAgICAgICAgICAgIGtleXMucHVzaChrKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4ga2V5cztcblx0ICAgIH1cblx0fTtcblxuXHRleHBvcnRzLmluT3BlcmF0b3IgPSBmdW5jdGlvbiAoa2V5LCB2YWwpIHtcblx0ICAgIGlmIChleHBvcnRzLmlzQXJyYXkodmFsKSkge1xuXHQgICAgICAgIHJldHVybiBleHBvcnRzLmluZGV4T2YodmFsLCBrZXkpICE9PSAtMTtcblx0ICAgIH0gZWxzZSBpZiAoZXhwb3J0cy5pc09iamVjdCh2YWwpKSB7XG5cdCAgICAgICAgcmV0dXJuIGtleSBpbiB2YWw7XG5cdCAgICB9IGVsc2UgaWYgKGV4cG9ydHMuaXNTdHJpbmcodmFsKSkge1xuXHQgICAgICAgIHJldHVybiB2YWwuaW5kZXhPZihrZXkpICE9PSAtMTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgdXNlIFwiaW5cIiBvcGVyYXRvciB0byBzZWFyY2ggZm9yIFwiJ1xuXHQgICAgICAgICAgICArIGtleSArICdcIiBpbiB1bmV4cGVjdGVkIHR5cGVzLicpO1xuXHQgICAgfVxuXHR9O1xuXG5cbi8qKiovIH0pLFxuLyogMiAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgcGF0aCA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBhc2FwID0gX193ZWJwYWNrX3JlcXVpcmVfXyg0KTtcblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cdHZhciBPYmogPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDYpO1xuXHR2YXIgY29tcGlsZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgYnVpbHRpbl9maWx0ZXJzID0gX193ZWJwYWNrX3JlcXVpcmVfXyg3KTtcblx0dmFyIGJ1aWx0aW5fbG9hZGVycyA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBydW50aW1lID0gX193ZWJwYWNrX3JlcXVpcmVfXyg4KTtcblx0dmFyIGdsb2JhbHMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDkpO1xuXHR2YXIgd2F0ZXJmYWxsID0gX193ZWJwYWNrX3JlcXVpcmVfXygxMCk7XG5cdHZhciBGcmFtZSA9IHJ1bnRpbWUuRnJhbWU7XG5cdHZhciBUZW1wbGF0ZTtcblxuXHQvLyBVbmNvbmRpdGlvbmFsbHkgbG9hZCBpbiB0aGlzIGxvYWRlciwgZXZlbiBpZiBubyBvdGhlciBvbmVzIGFyZVxuXHQvLyBpbmNsdWRlZCAocG9zc2libGUgaW4gdGhlIHNsaW0gYnJvd3NlciBidWlsZClcblx0YnVpbHRpbl9sb2FkZXJzLlByZWNvbXBpbGVkTG9hZGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygxNCk7XG5cblx0Ly8gSWYgdGhlIHVzZXIgaXMgdXNpbmcgdGhlIGFzeW5jIEFQSSwgKmFsd2F5cyogY2FsbCBpdFxuXHQvLyBhc3luY2hyb25vdXNseSBldmVuIGlmIHRoZSB0ZW1wbGF0ZSB3YXMgc3luY2hyb25vdXMuXG5cdGZ1bmN0aW9uIGNhbGxiYWNrQXNhcChjYiwgZXJyLCByZXMpIHtcblx0ICAgIGFzYXAoZnVuY3Rpb24oKSB7IGNiKGVyciwgcmVzKTsgfSk7XG5cdH1cblxuXHR2YXIgRW52aXJvbm1lbnQgPSBPYmouZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uKGxvYWRlcnMsIG9wdHMpIHtcblx0ICAgICAgICAvLyBUaGUgZGV2IGZsYWcgZGV0ZXJtaW5lcyB0aGUgdHJhY2UgdGhhdCdsbCBiZSBzaG93biBvbiBlcnJvcnMuXG5cdCAgICAgICAgLy8gSWYgc2V0IHRvIHRydWUsIHJldHVybnMgdGhlIGZ1bGwgdHJhY2UgZnJvbSB0aGUgZXJyb3IgcG9pbnQsXG5cdCAgICAgICAgLy8gb3RoZXJ3aXNlIHdpbGwgcmV0dXJuIHRyYWNlIHN0YXJ0aW5nIGZyb20gVGVtcGxhdGUucmVuZGVyXG5cdCAgICAgICAgLy8gKHRoZSBmdWxsIHRyYWNlIGZyb20gd2l0aGluIG51bmp1Y2tzIG1heSBjb25mdXNlIGRldmVsb3BlcnMgdXNpbmdcblx0ICAgICAgICAvLyAgdGhlIGxpYnJhcnkpXG5cdCAgICAgICAgLy8gZGVmYXVsdHMgdG8gZmFsc2Vcblx0ICAgICAgICBvcHRzID0gdGhpcy5vcHRzID0gb3B0cyB8fCB7fTtcblx0ICAgICAgICB0aGlzLm9wdHMuZGV2ID0gISFvcHRzLmRldjtcblxuXHQgICAgICAgIC8vIFRoZSBhdXRvZXNjYXBlIGZsYWcgc2V0cyBnbG9iYWwgYXV0b2VzY2FwaW5nLiBJZiB0cnVlLFxuXHQgICAgICAgIC8vIGV2ZXJ5IHN0cmluZyB2YXJpYWJsZSB3aWxsIGJlIGVzY2FwZWQgYnkgZGVmYXVsdC5cblx0ICAgICAgICAvLyBJZiBmYWxzZSwgc3RyaW5ncyBjYW4gYmUgbWFudWFsbHkgZXNjYXBlZCB1c2luZyB0aGUgYGVzY2FwZWAgZmlsdGVyLlxuXHQgICAgICAgIC8vIGRlZmF1bHRzIHRvIHRydWVcblx0ICAgICAgICB0aGlzLm9wdHMuYXV0b2VzY2FwZSA9IG9wdHMuYXV0b2VzY2FwZSAhPSBudWxsID8gb3B0cy5hdXRvZXNjYXBlIDogdHJ1ZTtcblxuXHQgICAgICAgIC8vIElmIHRydWUsIHRoaXMgd2lsbCBtYWtlIHRoZSBzeXN0ZW0gdGhyb3cgZXJyb3JzIGlmIHRyeWluZ1xuXHQgICAgICAgIC8vIHRvIG91dHB1dCBhIG51bGwgb3IgdW5kZWZpbmVkIHZhbHVlXG5cdCAgICAgICAgdGhpcy5vcHRzLnRocm93T25VbmRlZmluZWQgPSAhIW9wdHMudGhyb3dPblVuZGVmaW5lZDtcblx0ICAgICAgICB0aGlzLm9wdHMudHJpbUJsb2NrcyA9ICEhb3B0cy50cmltQmxvY2tzO1xuXHQgICAgICAgIHRoaXMub3B0cy5sc3RyaXBCbG9ja3MgPSAhIW9wdHMubHN0cmlwQmxvY2tzO1xuXG5cdCAgICAgICAgdGhpcy5sb2FkZXJzID0gW107XG5cblx0ICAgICAgICBpZighbG9hZGVycykge1xuXHQgICAgICAgICAgICAvLyBUaGUgZmlsZXN5c3RlbSBsb2FkZXIgaXMgb25seSBhdmFpbGFibGUgc2VydmVyLXNpZGVcblx0ICAgICAgICAgICAgaWYoYnVpbHRpbl9sb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIpIHtcblx0ICAgICAgICAgICAgICAgIHRoaXMubG9hZGVycyA9IFtuZXcgYnVpbHRpbl9sb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIoJ3ZpZXdzJyldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYoYnVpbHRpbl9sb2FkZXJzLldlYkxvYWRlcikge1xuXHQgICAgICAgICAgICAgICAgdGhpcy5sb2FkZXJzID0gW25ldyBidWlsdGluX2xvYWRlcnMuV2ViTG9hZGVyKCcvdmlld3MnKV07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHRoaXMubG9hZGVycyA9IGxpYi5pc0FycmF5KGxvYWRlcnMpID8gbG9hZGVycyA6IFtsb2FkZXJzXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBJdCdzIGVhc3kgdG8gdXNlIHByZWNvbXBpbGVkIHRlbXBsYXRlczoganVzdCBpbmNsdWRlIHRoZW1cblx0ICAgICAgICAvLyBiZWZvcmUgeW91IGNvbmZpZ3VyZSBudW5qdWNrcyBhbmQgdGhpcyB3aWxsIGF1dG9tYXRpY2FsbHlcblx0ICAgICAgICAvLyBwaWNrIGl0IHVwIGFuZCB1c2UgaXRcblx0ICAgICAgICBpZigodHJ1ZSkgJiYgd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQpIHtcblx0ICAgICAgICAgICAgdGhpcy5sb2FkZXJzLnVuc2hpZnQoXG5cdCAgICAgICAgICAgICAgICBuZXcgYnVpbHRpbl9sb2FkZXJzLlByZWNvbXBpbGVkTG9hZGVyKHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkKVxuXHQgICAgICAgICAgICApO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMuaW5pdENhY2hlKCk7XG5cblx0ICAgICAgICB0aGlzLmdsb2JhbHMgPSBnbG9iYWxzKCk7XG5cdCAgICAgICAgdGhpcy5maWx0ZXJzID0ge307XG5cdCAgICAgICAgdGhpcy5hc3luY0ZpbHRlcnMgPSBbXTtcblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnMgPSB7fTtcblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnNMaXN0ID0gW107XG5cblx0ICAgICAgICBmb3IodmFyIG5hbWUgaW4gYnVpbHRpbl9maWx0ZXJzKSB7XG5cdCAgICAgICAgICAgIHRoaXMuYWRkRmlsdGVyKG5hbWUsIGJ1aWx0aW5fZmlsdGVyc1tuYW1lXSk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgaW5pdENhY2hlOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAvLyBDYWNoaW5nIGFuZCBjYWNoZSBidXN0aW5nXG5cdCAgICAgICAgbGliLmVhY2godGhpcy5sb2FkZXJzLCBmdW5jdGlvbihsb2FkZXIpIHtcblx0ICAgICAgICAgICAgbG9hZGVyLmNhY2hlID0ge307XG5cblx0ICAgICAgICAgICAgaWYodHlwZW9mIGxvYWRlci5vbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICAgICAgbG9hZGVyLm9uKCd1cGRhdGUnLCBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGxvYWRlci5jYWNoZVt0ZW1wbGF0ZV0gPSBudWxsO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEV4dGVuc2lvbjogZnVuY3Rpb24obmFtZSwgZXh0ZW5zaW9uKSB7XG5cdCAgICAgICAgZXh0ZW5zaW9uLl9uYW1lID0gbmFtZTtcblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnNbbmFtZV0gPSBleHRlbnNpb247XG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zTGlzdC5wdXNoKGV4dGVuc2lvbik7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICByZW1vdmVFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICB2YXIgZXh0ZW5zaW9uID0gdGhpcy5nZXRFeHRlbnNpb24obmFtZSk7XG5cdCAgICAgICAgaWYgKCFleHRlbnNpb24pIHJldHVybjtcblxuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9uc0xpc3QgPSBsaWIud2l0aG91dCh0aGlzLmV4dGVuc2lvbnNMaXN0LCBleHRlbnNpb24pO1xuXHQgICAgICAgIGRlbGV0ZSB0aGlzLmV4dGVuc2lvbnNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICBnZXRFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5leHRlbnNpb25zW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgaGFzRXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgcmV0dXJuICEhdGhpcy5leHRlbnNpb25zW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgYWRkR2xvYmFsOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuXHQgICAgICAgIHRoaXMuZ2xvYmFsc1tuYW1lXSA9IHZhbHVlO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0R2xvYmFsOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgaWYodHlwZW9mIHRoaXMuZ2xvYmFsc1tuYW1lXSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdnbG9iYWwgbm90IGZvdW5kOiAnICsgbmFtZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiB0aGlzLmdsb2JhbHNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICBhZGRGaWx0ZXI6IGZ1bmN0aW9uKG5hbWUsIGZ1bmMsIGFzeW5jKSB7XG5cdCAgICAgICAgdmFyIHdyYXBwZWQgPSBmdW5jO1xuXG5cdCAgICAgICAgaWYoYXN5bmMpIHtcblx0ICAgICAgICAgICAgdGhpcy5hc3luY0ZpbHRlcnMucHVzaChuYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgdGhpcy5maWx0ZXJzW25hbWVdID0gd3JhcHBlZDtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIGdldEZpbHRlcjogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIGlmKCF0aGlzLmZpbHRlcnNbbmFtZV0pIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdmaWx0ZXIgbm90IGZvdW5kOiAnICsgbmFtZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiB0aGlzLmZpbHRlcnNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICByZXNvbHZlVGVtcGxhdGU6IGZ1bmN0aW9uKGxvYWRlciwgcGFyZW50TmFtZSwgZmlsZW5hbWUpIHtcblx0ICAgICAgICB2YXIgaXNSZWxhdGl2ZSA9IChsb2FkZXIuaXNSZWxhdGl2ZSAmJiBwYXJlbnROYW1lKT8gbG9hZGVyLmlzUmVsYXRpdmUoZmlsZW5hbWUpIDogZmFsc2U7XG5cdCAgICAgICAgcmV0dXJuIChpc1JlbGF0aXZlICYmIGxvYWRlci5yZXNvbHZlKT8gbG9hZGVyLnJlc29sdmUocGFyZW50TmFtZSwgZmlsZW5hbWUpIDogZmlsZW5hbWU7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRUZW1wbGF0ZTogZnVuY3Rpb24obmFtZSwgZWFnZXJDb21waWxlLCBwYXJlbnROYW1lLCBpZ25vcmVNaXNzaW5nLCBjYikge1xuXHQgICAgICAgIHZhciB0aGF0ID0gdGhpcztcblx0ICAgICAgICB2YXIgdG1wbCA9IG51bGw7XG5cdCAgICAgICAgaWYobmFtZSAmJiBuYW1lLnJhdykge1xuXHQgICAgICAgICAgICAvLyB0aGlzIGZpeGVzIGF1dG9lc2NhcGUgZm9yIHRlbXBsYXRlcyByZWZlcmVuY2VkIGluIHN5bWJvbHNcblx0ICAgICAgICAgICAgbmFtZSA9IG5hbWUucmF3O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKHBhcmVudE5hbWUpKSB7XG5cdCAgICAgICAgICAgIGNiID0gcGFyZW50TmFtZTtcblx0ICAgICAgICAgICAgcGFyZW50TmFtZSA9IG51bGw7XG5cdCAgICAgICAgICAgIGVhZ2VyQ29tcGlsZSA9IGVhZ2VyQ29tcGlsZSB8fCBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihlYWdlckNvbXBpbGUpKSB7XG5cdCAgICAgICAgICAgIGNiID0gZWFnZXJDb21waWxlO1xuXHQgICAgICAgICAgICBlYWdlckNvbXBpbGUgPSBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAobmFtZSBpbnN0YW5jZW9mIFRlbXBsYXRlKSB7XG5cdCAgICAgICAgICAgICB0bXBsID0gbmFtZTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZih0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0ZW1wbGF0ZSBuYW1lcyBtdXN0IGJlIGEgc3RyaW5nOiAnICsgbmFtZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubG9hZGVycy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIF9uYW1lID0gdGhpcy5yZXNvbHZlVGVtcGxhdGUodGhpcy5sb2FkZXJzW2ldLCBwYXJlbnROYW1lLCBuYW1lKTtcblx0ICAgICAgICAgICAgICAgIHRtcGwgPSB0aGlzLmxvYWRlcnNbaV0uY2FjaGVbX25hbWVdO1xuXHQgICAgICAgICAgICAgICAgaWYgKHRtcGwpIGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYodG1wbCkge1xuXHQgICAgICAgICAgICBpZihlYWdlckNvbXBpbGUpIHtcblx0ICAgICAgICAgICAgICAgIHRtcGwuY29tcGlsZSgpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYoY2IpIHtcblx0ICAgICAgICAgICAgICAgIGNiKG51bGwsIHRtcGwpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHRtcGw7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICB2YXIgc3luY1Jlc3VsdDtcblx0ICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgICAgICAgICB2YXIgY3JlYXRlVGVtcGxhdGUgPSBmdW5jdGlvbihlcnIsIGluZm8pIHtcblx0ICAgICAgICAgICAgICAgIGlmKCFpbmZvICYmICFlcnIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZighaWdub3JlTWlzc2luZykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBlcnIgPSBuZXcgRXJyb3IoJ3RlbXBsYXRlIG5vdCBmb3VuZDogJyArIG5hbWUpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgaWYgKGVycikge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGNiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNiKGVycik7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHRtcGw7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoaW5mbykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0bXBsID0gbmV3IFRlbXBsYXRlKGluZm8uc3JjLCBfdGhpcyxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnBhdGgsIGVhZ2VyQ29tcGlsZSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYoIWluZm8ubm9DYWNoZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5sb2FkZXIuY2FjaGVbbmFtZV0gPSB0bXBsO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0bXBsID0gbmV3IFRlbXBsYXRlKCcnLCBfdGhpcyxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJywgZWFnZXJDb21waWxlKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZihjYikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYihudWxsLCB0bXBsKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHN5bmNSZXN1bHQgPSB0bXBsO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICBsaWIuYXN5bmNJdGVyKHRoaXMubG9hZGVycywgZnVuY3Rpb24obG9hZGVyLCBpLCBuZXh0LCBkb25lKSB7XG5cdCAgICAgICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGUoZXJyLCBzcmMpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZihlcnIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShlcnIpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKHNyYykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzcmMubG9hZGVyID0gbG9hZGVyO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBkb25lKG51bGwsIHNyYyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvLyBSZXNvbHZlIG5hbWUgcmVsYXRpdmUgdG8gcGFyZW50TmFtZVxuXHQgICAgICAgICAgICAgICAgbmFtZSA9IHRoYXQucmVzb2x2ZVRlbXBsYXRlKGxvYWRlciwgcGFyZW50TmFtZSwgbmFtZSk7XG5cblx0ICAgICAgICAgICAgICAgIGlmKGxvYWRlci5hc3luYykge1xuXHQgICAgICAgICAgICAgICAgICAgIGxvYWRlci5nZXRTb3VyY2UobmFtZSwgaGFuZGxlKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIGhhbmRsZShudWxsLCBsb2FkZXIuZ2V0U291cmNlKG5hbWUpKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSwgY3JlYXRlVGVtcGxhdGUpO1xuXG5cdCAgICAgICAgICAgIHJldHVybiBzeW5jUmVzdWx0O1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGV4cHJlc3M6IGZ1bmN0aW9uKGFwcCkge1xuXHQgICAgICAgIHZhciBlbnYgPSB0aGlzO1xuXG5cdCAgICAgICAgZnVuY3Rpb24gTnVuanVja3NWaWV3KG5hbWUsIG9wdHMpIHtcblx0ICAgICAgICAgICAgdGhpcy5uYW1lICAgICAgICAgID0gbmFtZTtcblx0ICAgICAgICAgICAgdGhpcy5wYXRoICAgICAgICAgID0gbmFtZTtcblx0ICAgICAgICAgICAgdGhpcy5kZWZhdWx0RW5naW5lID0gb3B0cy5kZWZhdWx0RW5naW5lO1xuXHQgICAgICAgICAgICB0aGlzLmV4dCAgICAgICAgICAgPSBwYXRoLmV4dG5hbWUobmFtZSk7XG5cdCAgICAgICAgICAgIGlmICghdGhpcy5leHQgJiYgIXRoaXMuZGVmYXVsdEVuZ2luZSkgdGhyb3cgbmV3IEVycm9yKCdObyBkZWZhdWx0IGVuZ2luZSB3YXMgc3BlY2lmaWVkIGFuZCBubyBleHRlbnNpb24gd2FzIHByb3ZpZGVkLicpO1xuXHQgICAgICAgICAgICBpZiAoIXRoaXMuZXh0KSB0aGlzLm5hbWUgKz0gKHRoaXMuZXh0ID0gKCcuJyAhPT0gdGhpcy5kZWZhdWx0RW5naW5lWzBdID8gJy4nIDogJycpICsgdGhpcy5kZWZhdWx0RW5naW5lKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBOdW5qdWNrc1ZpZXcucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKG9wdHMsIGNiKSB7XG5cdCAgICAgICAgICBlbnYucmVuZGVyKHRoaXMubmFtZSwgb3B0cywgY2IpO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBhcHAuc2V0KCd2aWV3JywgTnVuanVja3NWaWV3KTtcblx0ICAgICAgICBhcHAuc2V0KCdudW5qdWNrc0VudicsIHRoaXMpO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgcmVuZGVyOiBmdW5jdGlvbihuYW1lLCBjdHgsIGNiKSB7XG5cdCAgICAgICAgaWYobGliLmlzRnVuY3Rpb24oY3R4KSkge1xuXHQgICAgICAgICAgICBjYiA9IGN0eDtcblx0ICAgICAgICAgICAgY3R4ID0gbnVsbDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBXZSBzdXBwb3J0IGEgc3luY2hyb25vdXMgQVBJIHRvIG1ha2UgaXQgZWFzaWVyIHRvIG1pZ3JhdGVcblx0ICAgICAgICAvLyBleGlzdGluZyBjb2RlIHRvIGFzeW5jLiBUaGlzIHdvcmtzIGJlY2F1c2UgaWYgeW91IGRvbid0IGRvXG5cdCAgICAgICAgLy8gYW55dGhpbmcgYXN5bmMgd29yaywgdGhlIHdob2xlIHRoaW5nIGlzIGFjdHVhbGx5IHJ1blxuXHQgICAgICAgIC8vIHN5bmNocm9ub3VzbHkuXG5cdCAgICAgICAgdmFyIHN5bmNSZXN1bHQgPSBudWxsO1xuXG5cdCAgICAgICAgdGhpcy5nZXRUZW1wbGF0ZShuYW1lLCBmdW5jdGlvbihlcnIsIHRtcGwpIHtcblx0ICAgICAgICAgICAgaWYoZXJyICYmIGNiKSB7XG5cdCAgICAgICAgICAgICAgICBjYWxsYmFja0FzYXAoY2IsIGVycik7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZihlcnIpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IGVycjtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHN5bmNSZXN1bHQgPSB0bXBsLnJlbmRlcihjdHgsIGNiKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgcmV0dXJuIHN5bmNSZXN1bHQ7XG5cdCAgICB9LFxuXG5cdCAgICByZW5kZXJTdHJpbmc6IGZ1bmN0aW9uKHNyYywgY3R4LCBvcHRzLCBjYikge1xuXHQgICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKG9wdHMpKSB7XG5cdCAgICAgICAgICAgIGNiID0gb3B0cztcblx0ICAgICAgICAgICAgb3B0cyA9IHt9O1xuXHQgICAgICAgIH1cblx0ICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuXHQgICAgICAgIHZhciB0bXBsID0gbmV3IFRlbXBsYXRlKHNyYywgdGhpcywgb3B0cy5wYXRoKTtcblx0ICAgICAgICByZXR1cm4gdG1wbC5yZW5kZXIoY3R4LCBjYik7XG5cdCAgICB9LFxuXG5cdCAgICB3YXRlcmZhbGw6IHdhdGVyZmFsbFxuXHR9KTtcblxuXHR2YXIgQ29udGV4dCA9IE9iai5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24oY3R4LCBibG9ja3MsIGVudikge1xuXHQgICAgICAgIC8vIEhhcyB0byBiZSB0aWVkIHRvIGFuIGVudmlyb25tZW50IHNvIHdlIGNhbiB0YXAgaW50byBpdHMgZ2xvYmFscy5cblx0ICAgICAgICB0aGlzLmVudiA9IGVudiB8fCBuZXcgRW52aXJvbm1lbnQoKTtcblxuXHQgICAgICAgIC8vIE1ha2UgYSBkdXBsaWNhdGUgb2YgY3R4XG5cdCAgICAgICAgdGhpcy5jdHggPSB7fTtcblx0ICAgICAgICBmb3IodmFyIGsgaW4gY3R4KSB7XG5cdCAgICAgICAgICAgIGlmKGN0eC5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHQgICAgICAgICAgICAgICAgdGhpcy5jdHhba10gPSBjdHhba107XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLmJsb2NrcyA9IHt9O1xuXHQgICAgICAgIHRoaXMuZXhwb3J0ZWQgPSBbXTtcblxuXHQgICAgICAgIGZvcih2YXIgbmFtZSBpbiBibG9ja3MpIHtcblx0ICAgICAgICAgICAgdGhpcy5hZGRCbG9jayhuYW1lLCBibG9ja3NbbmFtZV0pO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGxvb2t1cDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIC8vIFRoaXMgaXMgb25lIG9mIHRoZSBtb3N0IGNhbGxlZCBmdW5jdGlvbnMsIHNvIG9wdGltaXplIGZvclxuXHQgICAgICAgIC8vIHRoZSB0eXBpY2FsIGNhc2Ugd2hlcmUgdGhlIG5hbWUgaXNuJ3QgaW4gdGhlIGdsb2JhbHNcblx0ICAgICAgICBpZihuYW1lIGluIHRoaXMuZW52Lmdsb2JhbHMgJiYgIShuYW1lIGluIHRoaXMuY3R4KSkge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5lbnYuZ2xvYmFsc1tuYW1lXTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLmN0eFtuYW1lXTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBzZXRWYXJpYWJsZTogZnVuY3Rpb24obmFtZSwgdmFsKSB7XG5cdCAgICAgICAgdGhpcy5jdHhbbmFtZV0gPSB2YWw7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRWYXJpYWJsZXM6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLmN0eDtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEJsb2NrOiBmdW5jdGlvbihuYW1lLCBibG9jaykge1xuXHQgICAgICAgIHRoaXMuYmxvY2tzW25hbWVdID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW107XG5cdCAgICAgICAgdGhpcy5ibG9ja3NbbmFtZV0ucHVzaChibG9jayk7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRCbG9jazogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIGlmKCF0aGlzLmJsb2Nrc1tuYW1lXSkge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gYmxvY2sgXCInICsgbmFtZSArICdcIicpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiB0aGlzLmJsb2Nrc1tuYW1lXVswXTtcblx0ICAgIH0sXG5cblx0ICAgIGdldFN1cGVyOiBmdW5jdGlvbihlbnYsIG5hbWUsIGJsb2NrLCBmcmFtZSwgcnVudGltZSwgY2IpIHtcblx0ICAgICAgICB2YXIgaWR4ID0gbGliLmluZGV4T2YodGhpcy5ibG9ja3NbbmFtZV0gfHwgW10sIGJsb2NrKTtcblx0ICAgICAgICB2YXIgYmxrID0gdGhpcy5ibG9ja3NbbmFtZV1baWR4ICsgMV07XG5cdCAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzO1xuXG5cdCAgICAgICAgaWYoaWR4ID09PSAtMSB8fCAhYmxrKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gc3VwZXIgYmxvY2sgYXZhaWxhYmxlIGZvciBcIicgKyBuYW1lICsgJ1wiJyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgYmxrKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEV4cG9ydDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHRoaXMuZXhwb3J0ZWQucHVzaChuYW1lKTtcblx0ICAgIH0sXG5cblx0ICAgIGdldEV4cG9ydGVkOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgZXhwb3J0ZWQgPSB7fTtcblx0ICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLmV4cG9ydGVkLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5leHBvcnRlZFtpXTtcblx0ICAgICAgICAgICAgZXhwb3J0ZWRbbmFtZV0gPSB0aGlzLmN0eFtuYW1lXTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGV4cG9ydGVkO1xuXHQgICAgfVxuXHR9KTtcblxuXHRUZW1wbGF0ZSA9IE9iai5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24gKHNyYywgZW52LCBwYXRoLCBlYWdlckNvbXBpbGUpIHtcblx0ICAgICAgICB0aGlzLmVudiA9IGVudiB8fCBuZXcgRW52aXJvbm1lbnQoKTtcblxuXHQgICAgICAgIGlmKGxpYi5pc09iamVjdChzcmMpKSB7XG5cdCAgICAgICAgICAgIHN3aXRjaChzcmMudHlwZSkge1xuXHQgICAgICAgICAgICBjYXNlICdjb2RlJzogdGhpcy50bXBsUHJvcHMgPSBzcmMub2JqOyBicmVhaztcblx0ICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzogdGhpcy50bXBsU3RyID0gc3JjLm9iajsgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihsaWIuaXNTdHJpbmcoc3JjKSkge1xuXHQgICAgICAgICAgICB0aGlzLnRtcGxTdHIgPSBzcmM7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NyYyBtdXN0IGJlIGEgc3RyaW5nIG9yIGFuIG9iamVjdCBkZXNjcmliaW5nICcgK1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RoZSBzb3VyY2UnKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLnBhdGggPSBwYXRoO1xuXG5cdCAgICAgICAgaWYoZWFnZXJDb21waWxlKSB7XG5cdCAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cdCAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICBfdGhpcy5fY29tcGlsZSgpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGNhdGNoKGVycikge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgbGliLnByZXR0aWZ5RXJyb3IodGhpcy5wYXRoLCB0aGlzLmVudi5vcHRzLmRldiwgZXJyKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdGhpcy5jb21waWxlZCA9IGZhbHNlO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4LCBwYXJlbnRGcmFtZSwgY2IpIHtcblx0ICAgICAgICBpZiAodHlwZW9mIGN0eCA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICBjYiA9IGN0eDtcblx0ICAgICAgICAgICAgY3R4ID0ge307XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBwYXJlbnRGcmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICBjYiA9IHBhcmVudEZyYW1lO1xuXHQgICAgICAgICAgICBwYXJlbnRGcmFtZSA9IG51bGw7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGZvcmNlQXN5bmMgPSB0cnVlO1xuXHQgICAgICAgIGlmKHBhcmVudEZyYW1lKSB7XG5cdCAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgZnJhbWUsIHdlIGFyZSBiZWluZyBjYWxsZWQgZnJvbSBpbnRlcm5hbFxuXHQgICAgICAgICAgICAvLyBjb2RlIG9mIGFub3RoZXIgdGVtcGxhdGUsIGFuZCB0aGUgaW50ZXJuYWwgc3lzdGVtXG5cdCAgICAgICAgICAgIC8vIGRlcGVuZHMgb24gdGhlIHN5bmMvYXN5bmMgbmF0dXJlIG9mIHRoZSBwYXJlbnQgdGVtcGxhdGVcblx0ICAgICAgICAgICAgLy8gdG8gYmUgaW5oZXJpdGVkLCBzbyBmb3JjZSBhbiBhc3luYyBjYWxsYmFja1xuXHQgICAgICAgICAgICBmb3JjZUFzeW5jID0gZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblx0ICAgICAgICAvLyBDYXRjaCBjb21waWxlIGVycm9ycyBmb3IgYXN5bmMgcmVuZGVyaW5nXG5cdCAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgX3RoaXMuY29tcGlsZSgpO1xuXHQgICAgICAgIH0gY2F0Y2ggKF9lcnIpIHtcblx0ICAgICAgICAgICAgdmFyIGVyciA9IGxpYi5wcmV0dGlmeUVycm9yKHRoaXMucGF0aCwgdGhpcy5lbnYub3B0cy5kZXYsIF9lcnIpO1xuXHQgICAgICAgICAgICBpZiAoY2IpIHJldHVybiBjYWxsYmFja0FzYXAoY2IsIGVycik7XG5cdCAgICAgICAgICAgIGVsc2UgdGhyb3cgZXJyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBjb250ZXh0ID0gbmV3IENvbnRleHQoY3R4IHx8IHt9LCBfdGhpcy5ibG9ja3MsIF90aGlzLmVudik7XG5cdCAgICAgICAgdmFyIGZyYW1lID0gcGFyZW50RnJhbWUgPyBwYXJlbnRGcmFtZS5wdXNoKHRydWUpIDogbmV3IEZyYW1lKCk7XG5cdCAgICAgICAgZnJhbWUudG9wTGV2ZWwgPSB0cnVlO1xuXHQgICAgICAgIHZhciBzeW5jUmVzdWx0ID0gbnVsbDtcblxuXHQgICAgICAgIF90aGlzLnJvb3RSZW5kZXJGdW5jKFxuXHQgICAgICAgICAgICBfdGhpcy5lbnYsXG5cdCAgICAgICAgICAgIGNvbnRleHQsXG5cdCAgICAgICAgICAgIGZyYW1lIHx8IG5ldyBGcmFtZSgpLFxuXHQgICAgICAgICAgICBydW50aW1lLFxuXHQgICAgICAgICAgICBmdW5jdGlvbihlcnIsIHJlcykge1xuXHQgICAgICAgICAgICAgICAgaWYoZXJyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZXJyID0gbGliLnByZXR0aWZ5RXJyb3IoX3RoaXMucGF0aCwgX3RoaXMuZW52Lm9wdHMuZGV2LCBlcnIpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICBpZihjYikge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGZvcmNlQXN5bmMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tBc2FwKGNiLCBlcnIsIHJlcyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYihlcnIsIHJlcyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoZXJyKSB7IHRocm93IGVycjsgfVxuXHQgICAgICAgICAgICAgICAgICAgIHN5bmNSZXN1bHQgPSByZXM7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICApO1xuXG5cdCAgICAgICAgcmV0dXJuIHN5bmNSZXN1bHQ7XG5cdCAgICB9LFxuXG5cblx0ICAgIGdldEV4cG9ydGVkOiBmdW5jdGlvbihjdHgsIHBhcmVudEZyYW1lLCBjYikge1xuXHQgICAgICAgIGlmICh0eXBlb2YgY3R4ID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIGNiID0gY3R4O1xuXHQgICAgICAgICAgICBjdHggPSB7fTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodHlwZW9mIHBhcmVudEZyYW1lID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIGNiID0gcGFyZW50RnJhbWU7XG5cdCAgICAgICAgICAgIHBhcmVudEZyYW1lID0gbnVsbDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBDYXRjaCBjb21waWxlIGVycm9ycyBmb3IgYXN5bmMgcmVuZGVyaW5nXG5cdCAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgdGhpcy5jb21waWxlKCk7XG5cdCAgICAgICAgfSBjYXRjaCAoZSkge1xuXHQgICAgICAgICAgICBpZiAoY2IpIHJldHVybiBjYihlKTtcblx0ICAgICAgICAgICAgZWxzZSB0aHJvdyBlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBmcmFtZSA9IHBhcmVudEZyYW1lID8gcGFyZW50RnJhbWUucHVzaCgpIDogbmV3IEZyYW1lKCk7XG5cdCAgICAgICAgZnJhbWUudG9wTGV2ZWwgPSB0cnVlO1xuXG5cdCAgICAgICAgLy8gUnVuIHRoZSByb290UmVuZGVyRnVuYyB0byBwb3B1bGF0ZSB0aGUgY29udGV4dCB3aXRoIGV4cG9ydGVkIHZhcnNcblx0ICAgICAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KGN0eCB8fCB7fSwgdGhpcy5ibG9ja3MsIHRoaXMuZW52KTtcblx0ICAgICAgICB0aGlzLnJvb3RSZW5kZXJGdW5jKHRoaXMuZW52LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVudGltZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGVycikge1xuXHQgICAgICAgIFx0XHQgICAgICAgIGlmICggZXJyICkge1xuXHQgICAgICAgIFx0XHRcdCAgICBjYihlcnIsIG51bGwpO1xuXHQgICAgICAgIFx0XHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgXHRcdFx0ICAgIGNiKG51bGwsIGNvbnRleHQuZ2V0RXhwb3J0ZWQoKSk7XG5cdCAgICAgICAgXHRcdCAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICB9LFxuXG5cdCAgICBjb21waWxlOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICBpZighdGhpcy5jb21waWxlZCkge1xuXHQgICAgICAgICAgICB0aGlzLl9jb21waWxlKCk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgX2NvbXBpbGU6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciBwcm9wcztcblxuXHQgICAgICAgIGlmKHRoaXMudG1wbFByb3BzKSB7XG5cdCAgICAgICAgICAgIHByb3BzID0gdGhpcy50bXBsUHJvcHM7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB2YXIgc291cmNlID0gY29tcGlsZXIuY29tcGlsZSh0aGlzLnRtcGxTdHIsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52LmFzeW5jRmlsdGVycyxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnYuZXh0ZW5zaW9uc0xpc3QsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGF0aCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnYub3B0cyk7XG5cblx0ICAgICAgICAgICAgLyoganNsaW50IGV2aWw6IHRydWUgKi9cblx0ICAgICAgICAgICAgdmFyIGZ1bmMgPSBuZXcgRnVuY3Rpb24oc291cmNlKTtcblx0ICAgICAgICAgICAgcHJvcHMgPSBmdW5jKCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5ibG9ja3MgPSB0aGlzLl9nZXRCbG9ja3MocHJvcHMpO1xuXHQgICAgICAgIHRoaXMucm9vdFJlbmRlckZ1bmMgPSBwcm9wcy5yb290O1xuXHQgICAgICAgIHRoaXMuY29tcGlsZWQgPSB0cnVlO1xuXHQgICAgfSxcblxuXHQgICAgX2dldEJsb2NrczogZnVuY3Rpb24ocHJvcHMpIHtcblx0ICAgICAgICB2YXIgYmxvY2tzID0ge307XG5cblx0ICAgICAgICBmb3IodmFyIGsgaW4gcHJvcHMpIHtcblx0ICAgICAgICAgICAgaWYoay5zbGljZSgwLCAyKSA9PT0gJ2JfJykge1xuXHQgICAgICAgICAgICAgICAgYmxvY2tzW2suc2xpY2UoMildID0gcHJvcHNba107XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gYmxvY2tzO1xuXHQgICAgfVxuXHR9KTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IHtcblx0ICAgIEVudmlyb25tZW50OiBFbnZpcm9ubWVudCxcblx0ICAgIFRlbXBsYXRlOiBUZW1wbGF0ZVxuXHR9O1xuXG5cbi8qKiovIH0pLFxuLyogMyAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdFxuXG4vKioqLyB9KSxcbi8qIDQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvLyByYXdBc2FwIHByb3ZpZGVzIGV2ZXJ5dGhpbmcgd2UgbmVlZCBleGNlcHQgZXhjZXB0aW9uIG1hbmFnZW1lbnQuXG5cdHZhciByYXdBc2FwID0gX193ZWJwYWNrX3JlcXVpcmVfXyg1KTtcblx0Ly8gUmF3VGFza3MgYXJlIHJlY3ljbGVkIHRvIHJlZHVjZSBHQyBjaHVybi5cblx0dmFyIGZyZWVUYXNrcyA9IFtdO1xuXHQvLyBXZSBxdWV1ZSBlcnJvcnMgdG8gZW5zdXJlIHRoZXkgYXJlIHRocm93biBpbiByaWdodCBvcmRlciAoRklGTykuXG5cdC8vIEFycmF5LWFzLXF1ZXVlIGlzIGdvb2QgZW5vdWdoIGhlcmUsIHNpbmNlIHdlIGFyZSBqdXN0IGRlYWxpbmcgd2l0aCBleGNlcHRpb25zLlxuXHR2YXIgcGVuZGluZ0Vycm9ycyA9IFtdO1xuXHR2YXIgcmVxdWVzdEVycm9yVGhyb3cgPSByYXdBc2FwLm1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcih0aHJvd0ZpcnN0RXJyb3IpO1xuXG5cdGZ1bmN0aW9uIHRocm93Rmlyc3RFcnJvcigpIHtcblx0ICAgIGlmIChwZW5kaW5nRXJyb3JzLmxlbmd0aCkge1xuXHQgICAgICAgIHRocm93IHBlbmRpbmdFcnJvcnMuc2hpZnQoKTtcblx0ICAgIH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxscyBhIHRhc2sgYXMgc29vbiBhcyBwb3NzaWJsZSBhZnRlciByZXR1cm5pbmcsIGluIGl0cyBvd24gZXZlbnQsIHdpdGggcHJpb3JpdHlcblx0ICogb3ZlciBvdGhlciBldmVudHMgbGlrZSBhbmltYXRpb24sIHJlZmxvdywgYW5kIHJlcGFpbnQuIEFuIGVycm9yIHRocm93biBmcm9tIGFuXG5cdCAqIGV2ZW50IHdpbGwgbm90IGludGVycnVwdCwgbm9yIGV2ZW4gc3Vic3RhbnRpYWxseSBzbG93IGRvd24gdGhlIHByb2Nlc3Npbmcgb2Zcblx0ICogb3RoZXIgZXZlbnRzLCBidXQgd2lsbCBiZSByYXRoZXIgcG9zdHBvbmVkIHRvIGEgbG93ZXIgcHJpb3JpdHkgZXZlbnQuXG5cdCAqIEBwYXJhbSB7e2NhbGx9fSB0YXNrIEEgY2FsbGFibGUgb2JqZWN0LCB0eXBpY2FsbHkgYSBmdW5jdGlvbiB0aGF0IHRha2VzIG5vXG5cdCAqIGFyZ3VtZW50cy5cblx0ICovXG5cdG1vZHVsZS5leHBvcnRzID0gYXNhcDtcblx0ZnVuY3Rpb24gYXNhcCh0YXNrKSB7XG5cdCAgICB2YXIgcmF3VGFzaztcblx0ICAgIGlmIChmcmVlVGFza3MubGVuZ3RoKSB7XG5cdCAgICAgICAgcmF3VGFzayA9IGZyZWVUYXNrcy5wb3AoKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgcmF3VGFzayA9IG5ldyBSYXdUYXNrKCk7XG5cdCAgICB9XG5cdCAgICByYXdUYXNrLnRhc2sgPSB0YXNrO1xuXHQgICAgcmF3QXNhcChyYXdUYXNrKTtcblx0fVxuXG5cdC8vIFdlIHdyYXAgdGFza3Mgd2l0aCByZWN5Y2xhYmxlIHRhc2sgb2JqZWN0cy4gIEEgdGFzayBvYmplY3QgaW1wbGVtZW50c1xuXHQvLyBgY2FsbGAsIGp1c3QgbGlrZSBhIGZ1bmN0aW9uLlxuXHRmdW5jdGlvbiBSYXdUYXNrKCkge1xuXHQgICAgdGhpcy50YXNrID0gbnVsbDtcblx0fVxuXG5cdC8vIFRoZSBzb2xlIHB1cnBvc2Ugb2Ygd3JhcHBpbmcgdGhlIHRhc2sgaXMgdG8gY2F0Y2ggdGhlIGV4Y2VwdGlvbiBhbmQgcmVjeWNsZVxuXHQvLyB0aGUgdGFzayBvYmplY3QgYWZ0ZXIgaXRzIHNpbmdsZSB1c2UuXG5cdFJhd1Rhc2sucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0cnkge1xuXHQgICAgICAgIHRoaXMudGFzay5jYWxsKCk7XG5cdCAgICB9IGNhdGNoIChlcnJvcikge1xuXHQgICAgICAgIGlmIChhc2FwLm9uZXJyb3IpIHtcblx0ICAgICAgICAgICAgLy8gVGhpcyBob29rIGV4aXN0cyBwdXJlbHkgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG5cdCAgICAgICAgICAgIC8vIEl0cyBuYW1lIHdpbGwgYmUgcGVyaW9kaWNhbGx5IHJhbmRvbWl6ZWQgdG8gYnJlYWsgYW55IGNvZGUgdGhhdFxuXHQgICAgICAgICAgICAvLyBkZXBlbmRzIG9uIGl0cyBleGlzdGVuY2UuXG5cdCAgICAgICAgICAgIGFzYXAub25lcnJvcihlcnJvcik7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgLy8gSW4gYSB3ZWIgYnJvd3NlciwgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLiBIb3dldmVyLCB0byBhdm9pZFxuXHQgICAgICAgICAgICAvLyBzbG93aW5nIGRvd24gdGhlIHF1ZXVlIG9mIHBlbmRpbmcgdGFza3MsIHdlIHJldGhyb3cgdGhlIGVycm9yIGluIGFcblx0ICAgICAgICAgICAgLy8gbG93ZXIgcHJpb3JpdHkgdHVybi5cblx0ICAgICAgICAgICAgcGVuZGluZ0Vycm9ycy5wdXNoKGVycm9yKTtcblx0ICAgICAgICAgICAgcmVxdWVzdEVycm9yVGhyb3coKTtcblx0ICAgICAgICB9XG5cdCAgICB9IGZpbmFsbHkge1xuXHQgICAgICAgIHRoaXMudGFzayA9IG51bGw7XG5cdCAgICAgICAgZnJlZVRhc2tzW2ZyZWVUYXNrcy5sZW5ndGhdID0gdGhpcztcblx0ICAgIH1cblx0fTtcblxuXG4vKioqLyB9KSxcbi8qIDUgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi8oZnVuY3Rpb24oZ2xvYmFsKSB7XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly8gVXNlIHRoZSBmYXN0ZXN0IG1lYW5zIHBvc3NpYmxlIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGl0cyBvd24gdHVybiwgd2l0aFxuXHQvLyBwcmlvcml0eSBvdmVyIG90aGVyIGV2ZW50cyBpbmNsdWRpbmcgSU8sIGFuaW1hdGlvbiwgcmVmbG93LCBhbmQgcmVkcmF3XG5cdC8vIGV2ZW50cyBpbiBicm93c2Vycy5cblx0Ly9cblx0Ly8gQW4gZXhjZXB0aW9uIHRocm93biBieSBhIHRhc2sgd2lsbCBwZXJtYW5lbnRseSBpbnRlcnJ1cHQgdGhlIHByb2Nlc3Npbmcgb2Zcblx0Ly8gc3Vic2VxdWVudCB0YXNrcy4gVGhlIGhpZ2hlciBsZXZlbCBgYXNhcGAgZnVuY3Rpb24gZW5zdXJlcyB0aGF0IGlmIGFuXG5cdC8vIGV4Y2VwdGlvbiBpcyB0aHJvd24gYnkgYSB0YXNrLCB0aGF0IHRoZSB0YXNrIHF1ZXVlIHdpbGwgY29udGludWUgZmx1c2hpbmcgYXNcblx0Ly8gc29vbiBhcyBwb3NzaWJsZSwgYnV0IGlmIHlvdSB1c2UgYHJhd0FzYXBgIGRpcmVjdGx5LCB5b3UgYXJlIHJlc3BvbnNpYmxlIHRvXG5cdC8vIGVpdGhlciBlbnN1cmUgdGhhdCBubyBleGNlcHRpb25zIGFyZSB0aHJvd24gZnJvbSB5b3VyIHRhc2ssIG9yIHRvIG1hbnVhbGx5XG5cdC8vIGNhbGwgYHJhd0FzYXAucmVxdWVzdEZsdXNoYCBpZiBhbiBleGNlcHRpb24gaXMgdGhyb3duLlxuXHRtb2R1bGUuZXhwb3J0cyA9IHJhd0FzYXA7XG5cdGZ1bmN0aW9uIHJhd0FzYXAodGFzaykge1xuXHQgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcblx0ICAgICAgICByZXF1ZXN0Rmx1c2goKTtcblx0ICAgICAgICBmbHVzaGluZyA9IHRydWU7XG5cdCAgICB9XG5cdCAgICAvLyBFcXVpdmFsZW50IHRvIHB1c2gsIGJ1dCBhdm9pZHMgYSBmdW5jdGlvbiBjYWxsLlxuXHQgICAgcXVldWVbcXVldWUubGVuZ3RoXSA9IHRhc2s7XG5cdH1cblxuXHR2YXIgcXVldWUgPSBbXTtcblx0Ly8gT25jZSBhIGZsdXNoIGhhcyBiZWVuIHJlcXVlc3RlZCwgbm8gZnVydGhlciBjYWxscyB0byBgcmVxdWVzdEZsdXNoYCBhcmVcblx0Ly8gbmVjZXNzYXJ5IHVudGlsIHRoZSBuZXh0IGBmbHVzaGAgY29tcGxldGVzLlxuXHR2YXIgZmx1c2hpbmcgPSBmYWxzZTtcblx0Ly8gYHJlcXVlc3RGbHVzaGAgaXMgYW4gaW1wbGVtZW50YXRpb24tc3BlY2lmaWMgbWV0aG9kIHRoYXQgYXR0ZW1wdHMgdG8ga2lja1xuXHQvLyBvZmYgYSBgZmx1c2hgIGV2ZW50IGFzIHF1aWNrbHkgYXMgcG9zc2libGUuIGBmbHVzaGAgd2lsbCBhdHRlbXB0IHRvIGV4aGF1c3Rcblx0Ly8gdGhlIGV2ZW50IHF1ZXVlIGJlZm9yZSB5aWVsZGluZyB0byB0aGUgYnJvd3NlcidzIG93biBldmVudCBsb29wLlxuXHR2YXIgcmVxdWVzdEZsdXNoO1xuXHQvLyBUaGUgcG9zaXRpb24gb2YgdGhlIG5leHQgdGFzayB0byBleGVjdXRlIGluIHRoZSB0YXNrIHF1ZXVlLiBUaGlzIGlzXG5cdC8vIHByZXNlcnZlZCBiZXR3ZWVuIGNhbGxzIHRvIGBmbHVzaGAgc28gdGhhdCBpdCBjYW4gYmUgcmVzdW1lZCBpZlxuXHQvLyBhIHRhc2sgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cblx0dmFyIGluZGV4ID0gMDtcblx0Ly8gSWYgYSB0YXNrIHNjaGVkdWxlcyBhZGRpdGlvbmFsIHRhc2tzIHJlY3Vyc2l2ZWx5LCB0aGUgdGFzayBxdWV1ZSBjYW4gZ3Jvd1xuXHQvLyB1bmJvdW5kZWQuIFRvIHByZXZlbnQgbWVtb3J5IGV4aGF1c3Rpb24sIHRoZSB0YXNrIHF1ZXVlIHdpbGwgcGVyaW9kaWNhbGx5XG5cdC8vIHRydW5jYXRlIGFscmVhZHktY29tcGxldGVkIHRhc2tzLlxuXHR2YXIgY2FwYWNpdHkgPSAxMDI0O1xuXG5cdC8vIFRoZSBmbHVzaCBmdW5jdGlvbiBwcm9jZXNzZXMgYWxsIHRhc2tzIHRoYXQgaGF2ZSBiZWVuIHNjaGVkdWxlZCB3aXRoXG5cdC8vIGByYXdBc2FwYCB1bmxlc3MgYW5kIHVudGlsIG9uZSBvZiB0aG9zZSB0YXNrcyB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuXHQvLyBJZiBhIHRhc2sgdGhyb3dzIGFuIGV4Y2VwdGlvbiwgYGZsdXNoYCBlbnN1cmVzIHRoYXQgaXRzIHN0YXRlIHdpbGwgcmVtYWluXG5cdC8vIGNvbnNpc3RlbnQgYW5kIHdpbGwgcmVzdW1lIHdoZXJlIGl0IGxlZnQgb2ZmIHdoZW4gY2FsbGVkIGFnYWluLlxuXHQvLyBIb3dldmVyLCBgZmx1c2hgIGRvZXMgbm90IG1ha2UgYW55IGFycmFuZ2VtZW50cyB0byBiZSBjYWxsZWQgYWdhaW4gaWYgYW5cblx0Ly8gZXhjZXB0aW9uIGlzIHRocm93bi5cblx0ZnVuY3Rpb24gZmx1c2goKSB7XG5cdCAgICB3aGlsZSAoaW5kZXggPCBxdWV1ZS5sZW5ndGgpIHtcblx0ICAgICAgICB2YXIgY3VycmVudEluZGV4ID0gaW5kZXg7XG5cdCAgICAgICAgLy8gQWR2YW5jZSB0aGUgaW5kZXggYmVmb3JlIGNhbGxpbmcgdGhlIHRhc2suIFRoaXMgZW5zdXJlcyB0aGF0IHdlIHdpbGxcblx0ICAgICAgICAvLyBiZWdpbiBmbHVzaGluZyBvbiB0aGUgbmV4dCB0YXNrIHRoZSB0YXNrIHRocm93cyBhbiBlcnJvci5cblx0ICAgICAgICBpbmRleCA9IGluZGV4ICsgMTtcblx0ICAgICAgICBxdWV1ZVtjdXJyZW50SW5kZXhdLmNhbGwoKTtcblx0ICAgICAgICAvLyBQcmV2ZW50IGxlYWtpbmcgbWVtb3J5IGZvciBsb25nIGNoYWlucyBvZiByZWN1cnNpdmUgY2FsbHMgdG8gYGFzYXBgLlxuXHQgICAgICAgIC8vIElmIHdlIGNhbGwgYGFzYXBgIHdpdGhpbiB0YXNrcyBzY2hlZHVsZWQgYnkgYGFzYXBgLCB0aGUgcXVldWUgd2lsbFxuXHQgICAgICAgIC8vIGdyb3csIGJ1dCB0byBhdm9pZCBhbiBPKG4pIHdhbGsgZm9yIGV2ZXJ5IHRhc2sgd2UgZXhlY3V0ZSwgd2UgZG9uJ3Rcblx0ICAgICAgICAvLyBzaGlmdCB0YXNrcyBvZmYgdGhlIHF1ZXVlIGFmdGVyIHRoZXkgaGF2ZSBiZWVuIGV4ZWN1dGVkLlxuXHQgICAgICAgIC8vIEluc3RlYWQsIHdlIHBlcmlvZGljYWxseSBzaGlmdCAxMDI0IHRhc2tzIG9mZiB0aGUgcXVldWUuXG5cdCAgICAgICAgaWYgKGluZGV4ID4gY2FwYWNpdHkpIHtcblx0ICAgICAgICAgICAgLy8gTWFudWFsbHkgc2hpZnQgYWxsIHZhbHVlcyBzdGFydGluZyBhdCB0aGUgaW5kZXggYmFjayB0byB0aGVcblx0ICAgICAgICAgICAgLy8gYmVnaW5uaW5nIG9mIHRoZSBxdWV1ZS5cblx0ICAgICAgICAgICAgZm9yICh2YXIgc2NhbiA9IDAsIG5ld0xlbmd0aCA9IHF1ZXVlLmxlbmd0aCAtIGluZGV4OyBzY2FuIDwgbmV3TGVuZ3RoOyBzY2FuKyspIHtcblx0ICAgICAgICAgICAgICAgIHF1ZXVlW3NjYW5dID0gcXVldWVbc2NhbiArIGluZGV4XTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBxdWV1ZS5sZW5ndGggLT0gaW5kZXg7XG5cdCAgICAgICAgICAgIGluZGV4ID0gMDtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICBxdWV1ZS5sZW5ndGggPSAwO1xuXHQgICAgaW5kZXggPSAwO1xuXHQgICAgZmx1c2hpbmcgPSBmYWxzZTtcblx0fVxuXG5cdC8vIGByZXF1ZXN0Rmx1c2hgIGlzIGltcGxlbWVudGVkIHVzaW5nIGEgc3RyYXRlZ3kgYmFzZWQgb24gZGF0YSBjb2xsZWN0ZWQgZnJvbVxuXHQvLyBldmVyeSBhdmFpbGFibGUgU2F1Y2VMYWJzIFNlbGVuaXVtIHdlYiBkcml2ZXIgd29ya2VyIGF0IHRpbWUgb2Ygd3JpdGluZy5cblx0Ly8gaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMW1HLTVVWUd1cDVxeEdkRU1Xa2hQNkJXQ3owNTNOVWIyRTFRb1VUVTE2dUEvZWRpdCNnaWQ9NzgzNzI0NTkzXG5cblx0Ly8gU2FmYXJpIDYgYW5kIDYuMSBmb3IgZGVza3RvcCwgaVBhZCwgYW5kIGlQaG9uZSBhcmUgdGhlIG9ubHkgYnJvd3NlcnMgdGhhdFxuXHQvLyBoYXZlIFdlYktpdE11dGF0aW9uT2JzZXJ2ZXIgYnV0IG5vdCB1bi1wcmVmaXhlZCBNdXRhdGlvbk9ic2VydmVyLlxuXHQvLyBNdXN0IHVzZSBgZ2xvYmFsYCBvciBgc2VsZmAgaW5zdGVhZCBvZiBgd2luZG93YCB0byB3b3JrIGluIGJvdGggZnJhbWVzIGFuZCB3ZWJcblx0Ly8gd29ya2Vycy4gYGdsb2JhbGAgaXMgYSBwcm92aXNpb24gb2YgQnJvd3NlcmlmeSwgTXIsIE1ycywgb3IgTW9wLlxuXG5cdC8qIGdsb2JhbHMgc2VsZiAqL1xuXHR2YXIgc2NvcGUgPSB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogc2VsZjtcblx0dmFyIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gc2NvcGUuTXV0YXRpb25PYnNlcnZlciB8fCBzY29wZS5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO1xuXG5cdC8vIE11dGF0aW9uT2JzZXJ2ZXJzIGFyZSBkZXNpcmFibGUgYmVjYXVzZSB0aGV5IGhhdmUgaGlnaCBwcmlvcml0eSBhbmQgd29ya1xuXHQvLyByZWxpYWJseSBldmVyeXdoZXJlIHRoZXkgYXJlIGltcGxlbWVudGVkLlxuXHQvLyBUaGV5IGFyZSBpbXBsZW1lbnRlZCBpbiBhbGwgbW9kZXJuIGJyb3dzZXJzLlxuXHQvL1xuXHQvLyAtIEFuZHJvaWQgNC00LjNcblx0Ly8gLSBDaHJvbWUgMjYtMzRcblx0Ly8gLSBGaXJlZm94IDE0LTI5XG5cdC8vIC0gSW50ZXJuZXQgRXhwbG9yZXIgMTFcblx0Ly8gLSBpUGFkIFNhZmFyaSA2LTcuMVxuXHQvLyAtIGlQaG9uZSBTYWZhcmkgNy03LjFcblx0Ly8gLSBTYWZhcmkgNi03XG5cdGlmICh0eXBlb2YgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuXHQgICAgcmVxdWVzdEZsdXNoID0gbWFrZVJlcXVlc3RDYWxsRnJvbU11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpO1xuXG5cdC8vIE1lc3NhZ2VDaGFubmVscyBhcmUgZGVzaXJhYmxlIGJlY2F1c2UgdGhleSBnaXZlIGRpcmVjdCBhY2Nlc3MgdG8gdGhlIEhUTUxcblx0Ly8gdGFzayBxdWV1ZSwgYXJlIGltcGxlbWVudGVkIGluIEludGVybmV0IEV4cGxvcmVyIDEwLCBTYWZhcmkgNS4wLTEsIGFuZCBPcGVyYVxuXHQvLyAxMS0xMiwgYW5kIGluIHdlYiB3b3JrZXJzIGluIG1hbnkgZW5naW5lcy5cblx0Ly8gQWx0aG91Z2ggbWVzc2FnZSBjaGFubmVscyB5aWVsZCB0byBhbnkgcXVldWVkIHJlbmRlcmluZyBhbmQgSU8gdGFza3MsIHRoZXlcblx0Ly8gd291bGQgYmUgYmV0dGVyIHRoYW4gaW1wb3NpbmcgdGhlIDRtcyBkZWxheSBvZiB0aW1lcnMuXG5cdC8vIEhvd2V2ZXIsIHRoZXkgZG8gbm90IHdvcmsgcmVsaWFibHkgaW4gSW50ZXJuZXQgRXhwbG9yZXIgb3IgU2FmYXJpLlxuXG5cdC8vIEludGVybmV0IEV4cGxvcmVyIDEwIGlzIHRoZSBvbmx5IGJyb3dzZXIgdGhhdCBoYXMgc2V0SW1tZWRpYXRlIGJ1dCBkb2VzXG5cdC8vIG5vdCBoYXZlIE11dGF0aW9uT2JzZXJ2ZXJzLlxuXHQvLyBBbHRob3VnaCBzZXRJbW1lZGlhdGUgeWllbGRzIHRvIHRoZSBicm93c2VyJ3MgcmVuZGVyZXIsIGl0IHdvdWxkIGJlXG5cdC8vIHByZWZlcnJhYmxlIHRvIGZhbGxpbmcgYmFjayB0byBzZXRUaW1lb3V0IHNpbmNlIGl0IGRvZXMgbm90IGhhdmVcblx0Ly8gdGhlIG1pbmltdW0gNG1zIHBlbmFsdHkuXG5cdC8vIFVuZm9ydHVuYXRlbHkgdGhlcmUgYXBwZWFycyB0byBiZSBhIGJ1ZyBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMCBNb2JpbGUgKGFuZFxuXHQvLyBEZXNrdG9wIHRvIGEgbGVzc2VyIGV4dGVudCkgdGhhdCByZW5kZXJzIGJvdGggc2V0SW1tZWRpYXRlIGFuZFxuXHQvLyBNZXNzYWdlQ2hhbm5lbCB1c2VsZXNzIGZvciB0aGUgcHVycG9zZXMgb2YgQVNBUC5cblx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9xL2lzc3Vlcy8zOTZcblxuXHQvLyBUaW1lcnMgYXJlIGltcGxlbWVudGVkIHVuaXZlcnNhbGx5LlxuXHQvLyBXZSBmYWxsIGJhY2sgdG8gdGltZXJzIGluIHdvcmtlcnMgaW4gbW9zdCBlbmdpbmVzLCBhbmQgaW4gZm9yZWdyb3VuZFxuXHQvLyBjb250ZXh0cyBpbiB0aGUgZm9sbG93aW5nIGJyb3dzZXJzLlxuXHQvLyBIb3dldmVyLCBub3RlIHRoYXQgZXZlbiB0aGlzIHNpbXBsZSBjYXNlIHJlcXVpcmVzIG51YW5jZXMgdG8gb3BlcmF0ZSBpbiBhXG5cdC8vIGJyb2FkIHNwZWN0cnVtIG9mIGJyb3dzZXJzLlxuXHQvL1xuXHQvLyAtIEZpcmVmb3ggMy0xM1xuXHQvLyAtIEludGVybmV0IEV4cGxvcmVyIDYtOVxuXHQvLyAtIGlQYWQgU2FmYXJpIDQuM1xuXHQvLyAtIEx5bnggMi44Ljdcblx0fSBlbHNlIHtcblx0ICAgIHJlcXVlc3RGbHVzaCA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcihmbHVzaCk7XG5cdH1cblxuXHQvLyBgcmVxdWVzdEZsdXNoYCByZXF1ZXN0cyB0aGF0IHRoZSBoaWdoIHByaW9yaXR5IGV2ZW50IHF1ZXVlIGJlIGZsdXNoZWQgYXNcblx0Ly8gc29vbiBhcyBwb3NzaWJsZS5cblx0Ly8gVGhpcyBpcyB1c2VmdWwgdG8gcHJldmVudCBhbiBlcnJvciB0aHJvd24gaW4gYSB0YXNrIGZyb20gc3RhbGxpbmcgdGhlIGV2ZW50XG5cdC8vIHF1ZXVlIGlmIHRoZSBleGNlcHRpb24gaGFuZGxlZCBieSBOb2RlLmpz4oCZc1xuXHQvLyBgcHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIpYCBvciBieSBhIGRvbWFpbi5cblx0cmF3QXNhcC5yZXF1ZXN0Rmx1c2ggPSByZXF1ZXN0Rmx1c2g7XG5cblx0Ly8gVG8gcmVxdWVzdCBhIGhpZ2ggcHJpb3JpdHkgZXZlbnQsIHdlIGluZHVjZSBhIG11dGF0aW9uIG9ic2VydmVyIGJ5IHRvZ2dsaW5nXG5cdC8vIHRoZSB0ZXh0IG9mIGEgdGV4dCBub2RlIGJldHdlZW4gXCIxXCIgYW5kIFwiLTFcIi5cblx0ZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbU11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spIHtcblx0ICAgIHZhciB0b2dnbGUgPSAxO1xuXHQgICAgdmFyIG9ic2VydmVyID0gbmV3IEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKTtcblx0ICAgIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG5cdCAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHtjaGFyYWN0ZXJEYXRhOiB0cnVlfSk7XG5cdCAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG5cdCAgICAgICAgdG9nZ2xlID0gLXRvZ2dsZTtcblx0ICAgICAgICBub2RlLmRhdGEgPSB0b2dnbGU7XG5cdCAgICB9O1xuXHR9XG5cblx0Ly8gVGhlIG1lc3NhZ2UgY2hhbm5lbCB0ZWNobmlxdWUgd2FzIGRpc2NvdmVyZWQgYnkgTWFsdGUgVWJsIGFuZCB3YXMgdGhlXG5cdC8vIG9yaWdpbmFsIGZvdW5kYXRpb24gZm9yIHRoaXMgbGlicmFyeS5cblx0Ly8gaHR0cDovL3d3dy5ub25ibG9ja2luZy5pby8yMDExLzA2L3dpbmRvd25leHR0aWNrLmh0bWxcblxuXHQvLyBTYWZhcmkgNi4wLjUgKGF0IGxlYXN0KSBpbnRlcm1pdHRlbnRseSBmYWlscyB0byBjcmVhdGUgbWVzc2FnZSBwb3J0cyBvbiBhXG5cdC8vIHBhZ2UncyBmaXJzdCBsb2FkLiBUaGFua2Z1bGx5LCB0aGlzIHZlcnNpb24gb2YgU2FmYXJpIHN1cHBvcnRzXG5cdC8vIE11dGF0aW9uT2JzZXJ2ZXJzLCBzbyB3ZSBkb24ndCBuZWVkIHRvIGZhbGwgYmFjayBpbiB0aGF0IGNhc2UuXG5cblx0Ly8gZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbU1lc3NhZ2VDaGFubmVsKGNhbGxiYWNrKSB7XG5cdC8vICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuXHQvLyAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBjYWxsYmFjaztcblx0Ly8gICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcblx0Ly8gICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuXHQvLyAgICAgfTtcblx0Ly8gfVxuXG5cdC8vIEZvciByZWFzb25zIGV4cGxhaW5lZCBhYm92ZSwgd2UgYXJlIGFsc28gdW5hYmxlIHRvIHVzZSBgc2V0SW1tZWRpYXRlYFxuXHQvLyB1bmRlciBhbnkgY2lyY3Vtc3RhbmNlcy5cblx0Ly8gRXZlbiBpZiB3ZSB3ZXJlLCB0aGVyZSBpcyBhbm90aGVyIGJ1ZyBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMC5cblx0Ly8gSXQgaXMgbm90IHN1ZmZpY2llbnQgdG8gYXNzaWduIGBzZXRJbW1lZGlhdGVgIHRvIGByZXF1ZXN0Rmx1c2hgIGJlY2F1c2Vcblx0Ly8gYHNldEltbWVkaWF0ZWAgbXVzdCBiZSBjYWxsZWQgKmJ5IG5hbWUqIGFuZCB0aGVyZWZvcmUgbXVzdCBiZSB3cmFwcGVkIGluIGFcblx0Ly8gY2xvc3VyZS5cblx0Ly8gTmV2ZXIgZm9yZ2V0LlxuXG5cdC8vIGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21TZXRJbW1lZGlhdGUoY2FsbGJhY2spIHtcblx0Ly8gICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcblx0Ly8gICAgICAgICBzZXRJbW1lZGlhdGUoY2FsbGJhY2spO1xuXHQvLyAgICAgfTtcblx0Ly8gfVxuXG5cdC8vIFNhZmFyaSA2LjAgaGFzIGEgcHJvYmxlbSB3aGVyZSB0aW1lcnMgd2lsbCBnZXQgbG9zdCB3aGlsZSB0aGUgdXNlciBpc1xuXHQvLyBzY3JvbGxpbmcuIFRoaXMgcHJvYmxlbSBkb2VzIG5vdCBpbXBhY3QgQVNBUCBiZWNhdXNlIFNhZmFyaSA2LjAgc3VwcG9ydHNcblx0Ly8gbXV0YXRpb24gb2JzZXJ2ZXJzLCBzbyB0aGF0IGltcGxlbWVudGF0aW9uIGlzIHVzZWQgaW5zdGVhZC5cblx0Ly8gSG93ZXZlciwgaWYgd2UgZXZlciBlbGVjdCB0byB1c2UgdGltZXJzIGluIFNhZmFyaSwgdGhlIHByZXZhbGVudCB3b3JrLWFyb3VuZFxuXHQvLyBpcyB0byBhZGQgYSBzY3JvbGwgZXZlbnQgbGlzdGVuZXIgdGhhdCBjYWxscyBmb3IgYSBmbHVzaC5cblxuXHQvLyBgc2V0VGltZW91dGAgZG9lcyBub3QgY2FsbCB0aGUgcGFzc2VkIGNhbGxiYWNrIGlmIHRoZSBkZWxheSBpcyBsZXNzIHRoYW5cblx0Ly8gYXBwcm94aW1hdGVseSA3IGluIHdlYiB3b3JrZXJzIGluIEZpcmVmb3ggOCB0aHJvdWdoIDE4LCBhbmQgc29tZXRpbWVzIG5vdFxuXHQvLyBldmVuIHRoZW4uXG5cblx0ZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKGNhbGxiYWNrKSB7XG5cdCAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG5cdCAgICAgICAgLy8gV2UgZGlzcGF0Y2ggYSB0aW1lb3V0IHdpdGggYSBzcGVjaWZpZWQgZGVsYXkgb2YgMCBmb3IgZW5naW5lcyB0aGF0XG5cdCAgICAgICAgLy8gY2FuIHJlbGlhYmx5IGFjY29tbW9kYXRlIHRoYXQgcmVxdWVzdC4gVGhpcyB3aWxsIHVzdWFsbHkgYmUgc25hcHBlZFxuXHQgICAgICAgIC8vIHRvIGEgNCBtaWxpc2Vjb25kIGRlbGF5LCBidXQgb25jZSB3ZSdyZSBmbHVzaGluZywgdGhlcmUncyBubyBkZWxheVxuXHQgICAgICAgIC8vIGJldHdlZW4gZXZlbnRzLlxuXHQgICAgICAgIHZhciB0aW1lb3V0SGFuZGxlID0gc2V0VGltZW91dChoYW5kbGVUaW1lciwgMCk7XG5cdCAgICAgICAgLy8gSG93ZXZlciwgc2luY2UgdGhpcyB0aW1lciBnZXRzIGZyZXF1ZW50bHkgZHJvcHBlZCBpbiBGaXJlZm94XG5cdCAgICAgICAgLy8gd29ya2Vycywgd2UgZW5saXN0IGFuIGludGVydmFsIGhhbmRsZSB0aGF0IHdpbGwgdHJ5IHRvIGZpcmVcblx0ICAgICAgICAvLyBhbiBldmVudCAyMCB0aW1lcyBwZXIgc2Vjb25kIHVudGlsIGl0IHN1Y2NlZWRzLlxuXHQgICAgICAgIHZhciBpbnRlcnZhbEhhbmRsZSA9IHNldEludGVydmFsKGhhbmRsZVRpbWVyLCA1MCk7XG5cblx0ICAgICAgICBmdW5jdGlvbiBoYW5kbGVUaW1lcigpIHtcblx0ICAgICAgICAgICAgLy8gV2hpY2hldmVyIHRpbWVyIHN1Y2NlZWRzIHdpbGwgY2FuY2VsIGJvdGggdGltZXJzIGFuZFxuXHQgICAgICAgICAgICAvLyBleGVjdXRlIHRoZSBjYWxsYmFjay5cblx0ICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRIYW5kbGUpO1xuXHQgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsSGFuZGxlKTtcblx0ICAgICAgICAgICAgY2FsbGJhY2soKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXHR9XG5cblx0Ly8gVGhpcyBpcyBmb3IgYGFzYXAuanNgIG9ubHkuXG5cdC8vIEl0cyBuYW1lIHdpbGwgYmUgcGVyaW9kaWNhbGx5IHJhbmRvbWl6ZWQgdG8gYnJlYWsgYW55IGNvZGUgdGhhdCBkZXBlbmRzIG9uXG5cdC8vIGl0cyBleGlzdGVuY2UuXG5cdHJhd0FzYXAubWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyID0gbWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyO1xuXG5cdC8vIEFTQVAgd2FzIG9yaWdpbmFsbHkgYSBuZXh0VGljayBzaGltIGluY2x1ZGVkIGluIFEuIFRoaXMgd2FzIGZhY3RvcmVkIG91dFxuXHQvLyBpbnRvIHRoaXMgQVNBUCBwYWNrYWdlLiBJdCB3YXMgbGF0ZXIgYWRhcHRlZCB0byBSU1ZQIHdoaWNoIG1hZGUgZnVydGhlclxuXHQvLyBhbWVuZG1lbnRzLiBUaGVzZSBkZWNpc2lvbnMsIHBhcnRpY3VsYXJseSB0byBtYXJnaW5hbGl6ZSBNZXNzYWdlQ2hhbm5lbCBhbmRcblx0Ly8gdG8gY2FwdHVyZSB0aGUgTXV0YXRpb25PYnNlcnZlciBpbXBsZW1lbnRhdGlvbiBpbiBhIGNsb3N1cmUsIHdlcmUgaW50ZWdyYXRlZFxuXHQvLyBiYWNrIGludG8gQVNBUCBwcm9wZXIuXG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90aWxkZWlvL3JzdnAuanMvYmxvYi9jZGRmNzIzMjU0NmE5Y2Y4NTg1MjRiNzVjZGU2ZjllZGY3MjYyMGE3L2xpYi9yc3ZwL2FzYXAuanNcblxuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi99LmNhbGwoZXhwb3J0cywgKGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSgpKSkpXG5cbi8qKiovIH0pLFxuLyogNiAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvLyBBIHNpbXBsZSBjbGFzcyBzeXN0ZW0sIG1vcmUgZG9jdW1lbnRhdGlvbiB0byBjb21lXG5cblx0ZnVuY3Rpb24gZXh0ZW5kKGNscywgbmFtZSwgcHJvcHMpIHtcblx0ICAgIC8vIFRoaXMgZG9lcyB0aGF0IHNhbWUgdGhpbmcgYXMgT2JqZWN0LmNyZWF0ZSwgYnV0IHdpdGggc3VwcG9ydCBmb3IgSUU4XG5cdCAgICB2YXIgRiA9IGZ1bmN0aW9uKCkge307XG5cdCAgICBGLnByb3RvdHlwZSA9IGNscy5wcm90b3R5cGU7XG5cdCAgICB2YXIgcHJvdG90eXBlID0gbmV3IEYoKTtcblxuXHQgICAgLy8ganNoaW50IHVuZGVmOiBmYWxzZVxuXHQgICAgdmFyIGZuVGVzdCA9IC94eXovLnRlc3QoZnVuY3Rpb24oKXsgeHl6OyB9KSA/IC9cXGJwYXJlbnRcXGIvIDogLy4qLztcblx0ICAgIHByb3BzID0gcHJvcHMgfHwge307XG5cblx0ICAgIGZvcih2YXIgayBpbiBwcm9wcykge1xuXHQgICAgICAgIHZhciBzcmMgPSBwcm9wc1trXTtcblx0ICAgICAgICB2YXIgcGFyZW50ID0gcHJvdG90eXBlW2tdO1xuXG5cdCAgICAgICAgaWYodHlwZW9mIHBhcmVudCA9PT0gJ2Z1bmN0aW9uJyAmJlxuXHQgICAgICAgICAgIHR5cGVvZiBzcmMgPT09ICdmdW5jdGlvbicgJiZcblx0ICAgICAgICAgICBmblRlc3QudGVzdChzcmMpKSB7XG5cdCAgICAgICAgICAgIC8qanNoaW50IC1XMDgzICovXG5cdCAgICAgICAgICAgIHByb3RvdHlwZVtrXSA9IChmdW5jdGlvbiAoc3JjLCBwYXJlbnQpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSBjdXJyZW50IHBhcmVudCBtZXRob2Rcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgdG1wID0gdGhpcy5wYXJlbnQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvLyBTZXQgcGFyZW50IHRvIHRoZSBwcmV2aW91cyBtZXRob2QsIGNhbGwsIGFuZCByZXN0b3JlXG5cdCAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHJlcyA9IHNyYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gdG1wO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcblx0ICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH0pKHNyYywgcGFyZW50KTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHByb3RvdHlwZVtrXSA9IHNyYztcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIHByb3RvdHlwZS50eXBlbmFtZSA9IG5hbWU7XG5cblx0ICAgIHZhciBuZXdfY2xzID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYocHJvdG90eXBlLmluaXQpIHtcblx0ICAgICAgICAgICAgcHJvdG90eXBlLmluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICBuZXdfY2xzLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcblx0ICAgIG5ld19jbHMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gbmV3X2NscztcblxuXHQgICAgbmV3X2Nscy5leHRlbmQgPSBmdW5jdGlvbihuYW1lLCBwcm9wcykge1xuXHQgICAgICAgIGlmKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuXHQgICAgICAgICAgICBwcm9wcyA9IG5hbWU7XG5cdCAgICAgICAgICAgIG5hbWUgPSAnYW5vbnltb3VzJztcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGV4dGVuZChuZXdfY2xzLCBuYW1lLCBwcm9wcyk7XG5cdCAgICB9O1xuXG5cdCAgICByZXR1cm4gbmV3X2Nscztcblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzID0gZXh0ZW5kKE9iamVjdCwgJ09iamVjdCcsIHt9KTtcblxuXG4vKioqLyB9KSxcbi8qIDcgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cdHZhciByID0gX193ZWJwYWNrX3JlcXVpcmVfXyg4KTtcblxuXHRmdW5jdGlvbiBub3JtYWxpemUodmFsdWUsIGRlZmF1bHRWYWx1ZSkge1xuXHQgICAgaWYodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gZmFsc2UpIHtcblx0ICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHZhbHVlO1xuXHR9XG5cblx0dmFyIGZpbHRlcnMgPSB7XG5cdCAgICBhYnM6IE1hdGguYWJzLFxuXG5cdCAgICBiYXRjaDogZnVuY3Rpb24oYXJyLCBsaW5lY291bnQsIGZpbGxfd2l0aCkge1xuXHQgICAgICAgIHZhciBpO1xuXHQgICAgICAgIHZhciByZXMgPSBbXTtcblx0ICAgICAgICB2YXIgdG1wID0gW107XG5cblx0ICAgICAgICBmb3IoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgaWYoaSAlIGxpbmVjb3VudCA9PT0gMCAmJiB0bXAubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICByZXMucHVzaCh0bXApO1xuXHQgICAgICAgICAgICAgICAgdG1wID0gW107XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB0bXAucHVzaChhcnJbaV0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKHRtcC5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgaWYoZmlsbF93aXRoKSB7XG5cdCAgICAgICAgICAgICAgICBmb3IoaSA9IHRtcC5sZW5ndGg7IGkgPCBsaW5lY291bnQ7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgICAgIHRtcC5wdXNoKGZpbGxfd2l0aCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXMucHVzaCh0bXApO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByZXM7XG5cdCAgICB9LFxuXG5cdCAgICBjYXBpdGFsaXplOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgdmFyIHJldCA9IHN0ci50b0xvd2VyQ2FzZSgpO1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHJldC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHJldC5zbGljZSgxKSk7XG5cdCAgICB9LFxuXG5cdCAgICBjZW50ZXI6IGZ1bmN0aW9uKHN0ciwgd2lkdGgpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgd2lkdGggPSB3aWR0aCB8fCA4MDtcblxuXHQgICAgICAgIGlmKHN0ci5sZW5ndGggPj0gd2lkdGgpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgc3BhY2VzID0gd2lkdGggLSBzdHIubGVuZ3RoO1xuXHQgICAgICAgIHZhciBwcmUgPSBsaWIucmVwZWF0KCcgJywgc3BhY2VzLzIgLSBzcGFjZXMgJSAyKTtcblx0ICAgICAgICB2YXIgcG9zdCA9IGxpYi5yZXBlYXQoJyAnLCBzcGFjZXMvMik7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcHJlICsgc3RyICsgcG9zdCk7XG5cdCAgICB9LFxuXG5cdCAgICAnZGVmYXVsdCc6IGZ1bmN0aW9uKHZhbCwgZGVmLCBib29sKSB7XG5cdCAgICAgICAgaWYoYm9vbCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFsID8gdmFsIDogZGVmO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgcmV0dXJuICh2YWwgIT09IHVuZGVmaW5lZCkgPyB2YWwgOiBkZWY7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgZGljdHNvcnQ6IGZ1bmN0aW9uKHZhbCwgY2FzZV9zZW5zaXRpdmUsIGJ5KSB7XG5cdCAgICAgICAgaWYgKCFsaWIuaXNPYmplY3QodmFsKSkge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoJ2RpY3Rzb3J0IGZpbHRlcjogdmFsIG11c3QgYmUgYW4gb2JqZWN0Jyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGFycmF5ID0gW107XG5cdCAgICAgICAgZm9yICh2YXIgayBpbiB2YWwpIHtcblx0ICAgICAgICAgICAgLy8gZGVsaWJlcmF0ZWx5IGluY2x1ZGUgcHJvcGVydGllcyBmcm9tIHRoZSBvYmplY3QncyBwcm90b3R5cGVcblx0ICAgICAgICAgICAgYXJyYXkucHVzaChbayx2YWxba11dKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgc2k7XG5cdCAgICAgICAgaWYgKGJ5ID09PSB1bmRlZmluZWQgfHwgYnkgPT09ICdrZXknKSB7XG5cdCAgICAgICAgICAgIHNpID0gMDtcblx0ICAgICAgICB9IGVsc2UgaWYgKGJ5ID09PSAndmFsdWUnKSB7XG5cdCAgICAgICAgICAgIHNpID0gMTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoXG5cdCAgICAgICAgICAgICAgICAnZGljdHNvcnQgZmlsdGVyOiBZb3UgY2FuIG9ubHkgc29ydCBieSBlaXRoZXIga2V5IG9yIHZhbHVlJyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgYXJyYXkuc29ydChmdW5jdGlvbih0MSwgdDIpIHtcblx0ICAgICAgICAgICAgdmFyIGEgPSB0MVtzaV07XG5cdCAgICAgICAgICAgIHZhciBiID0gdDJbc2ldO1xuXG5cdCAgICAgICAgICAgIGlmICghY2FzZV9zZW5zaXRpdmUpIHtcblx0ICAgICAgICAgICAgICAgIGlmIChsaWIuaXNTdHJpbmcoYSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBhID0gYS50b1VwcGVyQ2FzZSgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgaWYgKGxpYi5pc1N0cmluZyhiKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGIgPSBiLnRvVXBwZXJDYXNlKCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gYSA+IGIgPyAxIDogKGEgPT09IGIgPyAwIDogLTEpO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgcmV0dXJuIGFycmF5O1xuXHQgICAgfSxcblxuXHQgICAgZHVtcDogZnVuY3Rpb24ob2JqLCBzcGFjZXMpIHtcblx0ICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCBzcGFjZXMpO1xuXHQgICAgfSxcblxuXHQgICAgZXNjYXBlOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBpZihzdHIgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgc3RyID0gKHN0ciA9PT0gbnVsbCB8fCBzdHIgPT09IHVuZGVmaW5lZCkgPyAnJyA6IHN0cjtcblx0ICAgICAgICByZXR1cm4gci5tYXJrU2FmZShsaWIuZXNjYXBlKHN0ci50b1N0cmluZygpKSk7XG5cdCAgICB9LFxuXG5cdCAgICBzYWZlOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBpZiAoc3RyIGluc3RhbmNlb2Ygci5TYWZlU3RyaW5nKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHN0ciA9IChzdHIgPT09IG51bGwgfHwgc3RyID09PSB1bmRlZmluZWQpID8gJycgOiBzdHI7XG5cdCAgICAgICAgcmV0dXJuIHIubWFya1NhZmUoc3RyLnRvU3RyaW5nKCkpO1xuXHQgICAgfSxcblxuXHQgICAgZmlyc3Q6IGZ1bmN0aW9uKGFycikge1xuXHQgICAgICAgIHJldHVybiBhcnJbMF07XG5cdCAgICB9LFxuXG5cdCAgICBncm91cGJ5OiBmdW5jdGlvbihhcnIsIGF0dHIpIHtcblx0ICAgICAgICByZXR1cm4gbGliLmdyb3VwQnkoYXJyLCBhdHRyKTtcblx0ICAgIH0sXG5cblx0ICAgIGluZGVudDogZnVuY3Rpb24oc3RyLCB3aWR0aCwgaW5kZW50Zmlyc3QpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cblx0ICAgICAgICBpZiAoc3RyID09PSAnJykgcmV0dXJuICcnO1xuXG5cdCAgICAgICAgd2lkdGggPSB3aWR0aCB8fCA0O1xuXHQgICAgICAgIHZhciByZXMgPSAnJztcblx0ICAgICAgICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoJ1xcbicpO1xuXHQgICAgICAgIHZhciBzcCA9IGxpYi5yZXBlYXQoJyAnLCB3aWR0aCk7XG5cblx0ICAgICAgICBmb3IodmFyIGk9MDsgaTxsaW5lcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICBpZihpID09PSAwICYmICFpbmRlbnRmaXJzdCkge1xuXHQgICAgICAgICAgICAgICAgcmVzICs9IGxpbmVzW2ldICsgJ1xcbic7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICByZXMgKz0gc3AgKyBsaW5lc1tpXSArICdcXG4nO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcmVzKTtcblx0ICAgIH0sXG5cblx0ICAgIGpvaW46IGZ1bmN0aW9uKGFyciwgZGVsLCBhdHRyKSB7XG5cdCAgICAgICAgZGVsID0gZGVsIHx8ICcnO1xuXG5cdCAgICAgICAgaWYoYXR0cikge1xuXHQgICAgICAgICAgICBhcnIgPSBsaWIubWFwKGFyciwgZnVuY3Rpb24odikge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHZbYXR0cl07XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBhcnIuam9pbihkZWwpO1xuXHQgICAgfSxcblxuXHQgICAgbGFzdDogZnVuY3Rpb24oYXJyKSB7XG5cdCAgICAgICAgcmV0dXJuIGFyclthcnIubGVuZ3RoLTFdO1xuXHQgICAgfSxcblxuXHQgICAgbGVuZ3RoOiBmdW5jdGlvbih2YWwpIHtcblx0ICAgICAgICB2YXIgdmFsdWUgPSBub3JtYWxpemUodmFsLCAnJyk7XG5cblx0ICAgICAgICBpZih2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIGlmKFxuXHQgICAgICAgICAgICAgICAgKHR5cGVvZiBNYXAgPT09ICdmdW5jdGlvbicgJiYgdmFsdWUgaW5zdGFuY2VvZiBNYXApIHx8XG5cdCAgICAgICAgICAgICAgICAodHlwZW9mIFNldCA9PT0gJ2Z1bmN0aW9uJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIFNldClcblx0ICAgICAgICAgICAgKSB7XG5cdCAgICAgICAgICAgICAgICAvLyBFQ01BU2NyaXB0IDIwMTUgTWFwcyBhbmQgU2V0c1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnNpemU7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYobGliLmlzT2JqZWN0KHZhbHVlKSAmJiAhKHZhbHVlIGluc3RhbmNlb2Ygci5TYWZlU3RyaW5nKSkge1xuXHQgICAgICAgICAgICAgICAgLy8gT2JqZWN0cyAoYmVzaWRlcyBTYWZlU3RyaW5ncyksIG5vbi1wcmltYXRpdmUgQXJyYXlzXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gMDtcblx0ICAgIH0sXG5cblx0ICAgIGxpc3Q6IGZ1bmN0aW9uKHZhbCkge1xuXHQgICAgICAgIGlmKGxpYi5pc1N0cmluZyh2YWwpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YWwuc3BsaXQoJycpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKGxpYi5pc09iamVjdCh2YWwpKSB7XG5cdCAgICAgICAgICAgIHZhciBrZXlzID0gW107XG5cblx0ICAgICAgICAgICAgaWYoT2JqZWN0LmtleXMpIHtcblx0ICAgICAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyh2YWwpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgZm9yKHZhciBrIGluIHZhbCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChrKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBsaWIubWFwKGtleXMsIGZ1bmN0aW9uKGspIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB7IGtleTogayxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWxba10gfTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYobGliLmlzQXJyYXkodmFsKSkge1xuXHQgICAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcignbGlzdCBmaWx0ZXI6IHR5cGUgbm90IGl0ZXJhYmxlJyk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgbG93ZXI6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICByZXR1cm4gc3RyLnRvTG93ZXJDYXNlKCk7XG5cdCAgICB9LFxuXG5cdCAgICBubDJicjogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgaWYgKHN0ciA9PT0gbnVsbCB8fCBzdHIgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICByZXR1cm4gJyc7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHN0ci5yZXBsYWNlKC9cXHJcXG58XFxuL2csICc8YnIgLz5cXG4nKSk7XG5cdCAgICB9LFxuXG5cdCAgICByYW5kb206IGZ1bmN0aW9uKGFycikge1xuXHQgICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuXHQgICAgfSxcblxuXHQgICAgcmVqZWN0YXR0cjogZnVuY3Rpb24oYXJyLCBhdHRyKSB7XG5cdCAgICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG5cdCAgICAgICAgcmV0dXJuICFpdGVtW2F0dHJdO1xuXHQgICAgICB9KTtcblx0ICAgIH0sXG5cblx0ICAgIHNlbGVjdGF0dHI6IGZ1bmN0aW9uKGFyciwgYXR0cikge1xuXHQgICAgICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuXHQgICAgICAgIHJldHVybiAhIWl0ZW1bYXR0cl07XG5cdCAgICAgIH0pO1xuXHQgICAgfSxcblxuXHQgICAgcmVwbGFjZTogZnVuY3Rpb24oc3RyLCBvbGQsIG5ld18sIG1heENvdW50KSB7XG5cdCAgICAgICAgdmFyIG9yaWdpbmFsU3RyID0gc3RyO1xuXG5cdCAgICAgICAgaWYgKG9sZCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2Uob2xkLCBuZXdfKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZih0eXBlb2YgbWF4Q291bnQgPT09ICd1bmRlZmluZWQnKXtcblx0ICAgICAgICAgICAgbWF4Q291bnQgPSAtMTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgcmVzID0gJyc7ICAvLyBPdXRwdXRcblxuXHQgICAgICAgIC8vIENhc3QgTnVtYmVycyBpbiB0aGUgc2VhcmNoIHRlcm0gdG8gc3RyaW5nXG5cdCAgICAgICAgaWYodHlwZW9mIG9sZCA9PT0gJ251bWJlcicpe1xuXHQgICAgICAgICAgICBvbGQgPSBvbGQgKyAnJztcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZih0eXBlb2Ygb2xkICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICAvLyBJZiBpdCBpcyBzb21ldGhpbmcgb3RoZXIgdGhhbiBudW1iZXIgb3Igc3RyaW5nLFxuXHQgICAgICAgICAgICAvLyByZXR1cm4gdGhlIG9yaWdpbmFsIHN0cmluZ1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIENhc3QgbnVtYmVycyBpbiB0aGUgcmVwbGFjZW1lbnQgdG8gc3RyaW5nXG5cdCAgICAgICAgaWYodHlwZW9mIHN0ciA9PT0gJ251bWJlcicpe1xuXHQgICAgICAgICAgICBzdHIgPSBzdHIgKyAnJztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBJZiBieSBub3csIHdlIGRvbid0IGhhdmUgYSBzdHJpbmcsIHRocm93IGl0IGJhY2tcblx0ICAgICAgICBpZih0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJyAmJiAhKHN0ciBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykpe1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIFNob3J0Q2lyY3VpdHNcblx0ICAgICAgICBpZihvbGQgPT09ICcnKXtcblx0ICAgICAgICAgICAgLy8gTWltaWMgdGhlIHB5dGhvbiBiZWhhdmlvdXI6IGVtcHR5IHN0cmluZyBpcyByZXBsYWNlZFxuXHQgICAgICAgICAgICAvLyBieSByZXBsYWNlbWVudCBlLmcuIFwiYWJjXCJ8cmVwbGFjZShcIlwiLCBcIi5cIikgLT4gLmEuYi5jLlxuXHQgICAgICAgICAgICByZXMgPSBuZXdfICsgc3RyLnNwbGl0KCcnKS5qb2luKG5ld18pICsgbmV3Xztcblx0ICAgICAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcmVzKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgbmV4dEluZGV4ID0gc3RyLmluZGV4T2Yob2xkKTtcblx0ICAgICAgICAvLyBpZiAjIG9mIHJlcGxhY2VtZW50cyB0byBwZXJmb3JtIGlzIDAsIG9yIHRoZSBzdHJpbmcgdG8gZG9lc1xuXHQgICAgICAgIC8vIG5vdCBjb250YWluIHRoZSBvbGQgdmFsdWUsIHJldHVybiB0aGUgc3RyaW5nXG5cdCAgICAgICAgaWYobWF4Q291bnQgPT09IDAgfHwgbmV4dEluZGV4ID09PSAtMSl7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIHBvcyA9IDA7XG5cdCAgICAgICAgdmFyIGNvdW50ID0gMDsgLy8gIyBvZiByZXBsYWNlbWVudHMgbWFkZVxuXG5cdCAgICAgICAgd2hpbGUobmV4dEluZGV4ICA+IC0xICYmIChtYXhDb3VudCA9PT0gLTEgfHwgY291bnQgPCBtYXhDb3VudCkpe1xuXHQgICAgICAgICAgICAvLyBHcmFiIHRoZSBuZXh0IGNodW5rIG9mIHNyYyBzdHJpbmcgYW5kIGFkZCBpdCB3aXRoIHRoZVxuXHQgICAgICAgICAgICAvLyByZXBsYWNlbWVudCwgdG8gdGhlIHJlc3VsdFxuXHQgICAgICAgICAgICByZXMgKz0gc3RyLnN1YnN0cmluZyhwb3MsIG5leHRJbmRleCkgKyBuZXdfO1xuXHQgICAgICAgICAgICAvLyBJbmNyZW1lbnQgb3VyIHBvaW50ZXIgaW4gdGhlIHNyYyBzdHJpbmdcblx0ICAgICAgICAgICAgcG9zID0gbmV4dEluZGV4ICsgb2xkLmxlbmd0aDtcblx0ICAgICAgICAgICAgY291bnQrKztcblx0ICAgICAgICAgICAgLy8gU2VlIGlmIHRoZXJlIGFyZSBhbnkgbW9yZSByZXBsYWNlbWVudHMgdG8gYmUgbWFkZVxuXHQgICAgICAgICAgICBuZXh0SW5kZXggPSBzdHIuaW5kZXhPZihvbGQsIHBvcyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gV2UndmUgZWl0aGVyIHJlYWNoZWQgdGhlIGVuZCwgb3IgZG9uZSB0aGUgbWF4ICMgb2Zcblx0ICAgICAgICAvLyByZXBsYWNlbWVudHMsIHRhY2sgb24gYW55IHJlbWFpbmluZyBzdHJpbmdcblx0ICAgICAgICBpZihwb3MgPCBzdHIubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIHJlcyArPSBzdHIuc3Vic3RyaW5nKHBvcyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKG9yaWdpbmFsU3RyLCByZXMpO1xuXHQgICAgfSxcblxuXHQgICAgcmV2ZXJzZTogZnVuY3Rpb24odmFsKSB7XG5cdCAgICAgICAgdmFyIGFycjtcblx0ICAgICAgICBpZihsaWIuaXNTdHJpbmcodmFsKSkge1xuXHQgICAgICAgICAgICBhcnIgPSBmaWx0ZXJzLmxpc3QodmFsKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIC8vIENvcHkgaXRcblx0ICAgICAgICAgICAgYXJyID0gbGliLm1hcCh2YWwsIGZ1bmN0aW9uKHYpIHsgcmV0dXJuIHY7IH0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGFyci5yZXZlcnNlKCk7XG5cblx0ICAgICAgICBpZihsaWIuaXNTdHJpbmcodmFsKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3ModmFsLCBhcnIuam9pbignJykpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gYXJyO1xuXHQgICAgfSxcblxuXHQgICAgcm91bmQ6IGZ1bmN0aW9uKHZhbCwgcHJlY2lzaW9uLCBtZXRob2QpIHtcblx0ICAgICAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24gfHwgMDtcblx0ICAgICAgICB2YXIgZmFjdG9yID0gTWF0aC5wb3coMTAsIHByZWNpc2lvbik7XG5cdCAgICAgICAgdmFyIHJvdW5kZXI7XG5cblx0ICAgICAgICBpZihtZXRob2QgPT09ICdjZWlsJykge1xuXHQgICAgICAgICAgICByb3VuZGVyID0gTWF0aC5jZWlsO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKG1ldGhvZCA9PT0gJ2Zsb29yJykge1xuXHQgICAgICAgICAgICByb3VuZGVyID0gTWF0aC5mbG9vcjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHJvdW5kZXIgPSBNYXRoLnJvdW5kO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByb3VuZGVyKHZhbCAqIGZhY3RvcikgLyBmYWN0b3I7XG5cdCAgICB9LFxuXG5cdCAgICBzbGljZTogZnVuY3Rpb24oYXJyLCBzbGljZXMsIGZpbGxXaXRoKSB7XG5cdCAgICAgICAgdmFyIHNsaWNlTGVuZ3RoID0gTWF0aC5mbG9vcihhcnIubGVuZ3RoIC8gc2xpY2VzKTtcblx0ICAgICAgICB2YXIgZXh0cmEgPSBhcnIubGVuZ3RoICUgc2xpY2VzO1xuXHQgICAgICAgIHZhciBvZmZzZXQgPSAwO1xuXHQgICAgICAgIHZhciByZXMgPSBbXTtcblxuXHQgICAgICAgIGZvcih2YXIgaT0wOyBpPHNsaWNlczsgaSsrKSB7XG5cdCAgICAgICAgICAgIHZhciBzdGFydCA9IG9mZnNldCArIGkgKiBzbGljZUxlbmd0aDtcblx0ICAgICAgICAgICAgaWYoaSA8IGV4dHJhKSB7XG5cdCAgICAgICAgICAgICAgICBvZmZzZXQrKztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB2YXIgZW5kID0gb2Zmc2V0ICsgKGkgKyAxKSAqIHNsaWNlTGVuZ3RoO1xuXG5cdCAgICAgICAgICAgIHZhciBzbGljZSA9IGFyci5zbGljZShzdGFydCwgZW5kKTtcblx0ICAgICAgICAgICAgaWYoZmlsbFdpdGggJiYgaSA+PSBleHRyYSkge1xuXHQgICAgICAgICAgICAgICAgc2xpY2UucHVzaChmaWxsV2l0aCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmVzLnB1c2goc2xpY2UpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByZXM7XG5cdCAgICB9LFxuXG5cdCAgICBzdW06IGZ1bmN0aW9uKGFyciwgYXR0ciwgc3RhcnQpIHtcblx0ICAgICAgICB2YXIgc3VtID0gMDtcblxuXHQgICAgICAgIGlmKHR5cGVvZiBzdGFydCA9PT0gJ251bWJlcicpe1xuXHQgICAgICAgICAgICBzdW0gKz0gc3RhcnQ7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYoYXR0cikge1xuXHQgICAgICAgICAgICBhcnIgPSBsaWIubWFwKGFyciwgZnVuY3Rpb24odikge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHZbYXR0cl07XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgc3VtICs9IGFycltpXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gc3VtO1xuXHQgICAgfSxcblxuXHQgICAgc29ydDogci5tYWtlTWFjcm8oWyd2YWx1ZScsICdyZXZlcnNlJywgJ2Nhc2Vfc2Vuc2l0aXZlJywgJ2F0dHJpYnV0ZSddLCBbXSwgZnVuY3Rpb24oYXJyLCByZXZlcnNlLCBjYXNlU2VucywgYXR0cikge1xuXHQgICAgICAgICAvLyBDb3B5IGl0XG5cdCAgICAgICAgYXJyID0gbGliLm1hcChhcnIsIGZ1bmN0aW9uKHYpIHsgcmV0dXJuIHY7IH0pO1xuXG5cdCAgICAgICAgYXJyLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuXHQgICAgICAgICAgICB2YXIgeCwgeTtcblxuXHQgICAgICAgICAgICBpZihhdHRyKSB7XG5cdCAgICAgICAgICAgICAgICB4ID0gYVthdHRyXTtcblx0ICAgICAgICAgICAgICAgIHkgPSBiW2F0dHJdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgeCA9IGE7XG5cdCAgICAgICAgICAgICAgICB5ID0gYjtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmKCFjYXNlU2VucyAmJiBsaWIuaXNTdHJpbmcoeCkgJiYgbGliLmlzU3RyaW5nKHkpKSB7XG5cdCAgICAgICAgICAgICAgICB4ID0geC50b0xvd2VyQ2FzZSgpO1xuXHQgICAgICAgICAgICAgICAgeSA9IHkudG9Mb3dlckNhc2UoKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmKHggPCB5KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gcmV2ZXJzZSA/IDEgOiAtMTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKHggPiB5KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gcmV2ZXJzZSA/IC0xOiAxO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiBhcnI7XG5cdCAgICB9KSxcblxuXHQgICAgc3RyaW5nOiBmdW5jdGlvbihvYmopIHtcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Mob2JqLCBvYmopO1xuXHQgICAgfSxcblxuXHQgICAgc3RyaXB0YWdzOiBmdW5jdGlvbihpbnB1dCwgcHJlc2VydmVfbGluZWJyZWFrcykge1xuXHQgICAgICAgIGlucHV0ID0gbm9ybWFsaXplKGlucHV0LCAnJyk7XG5cdCAgICAgICAgcHJlc2VydmVfbGluZWJyZWFrcyA9IHByZXNlcnZlX2xpbmVicmVha3MgfHwgZmFsc2U7XG5cdCAgICAgICAgdmFyIHRhZ3MgPSAvPFxcLz8oW2Etel1bYS16MC05XSopXFxiW14+XSo+fDwhLS1bXFxzXFxTXSo/LS0+L2dpO1xuXHQgICAgICAgIHZhciB0cmltbWVkSW5wdXQgPSBmaWx0ZXJzLnRyaW0oaW5wdXQucmVwbGFjZSh0YWdzLCAnJykpO1xuXHQgICAgICAgIHZhciByZXMgPSAnJztcblx0ICAgICAgICBpZiAocHJlc2VydmVfbGluZWJyZWFrcykge1xuXHQgICAgICAgICAgICByZXMgPSB0cmltbWVkSW5wdXRcblx0ICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9eICt8ICskL2dtLCAnJykgICAgIC8vIHJlbW92ZSBsZWFkaW5nIGFuZCB0cmFpbGluZyBzcGFjZXNcblx0ICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8gKy9nLCAnICcpICAgICAgICAgIC8vIHNxdWFzaCBhZGphY2VudCBzcGFjZXNcblx0ICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXFxyXFxuKS9nLCAnXFxuJykgICAgIC8vIG5vcm1hbGl6ZSBsaW5lYnJlYWtzIChDUkxGIC0+IExGKVxuXHQgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcblxcblxcbisvZywgJ1xcblxcbicpOyAvLyBzcXVhc2ggYWJub3JtYWwgYWRqYWNlbnQgbGluZWJyZWFrc1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHJlcyA9IHRyaW1tZWRJbnB1dC5yZXBsYWNlKC9cXHMrL2dpLCAnICcpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3MoaW5wdXQsIHJlcyk7XG5cdCAgICB9LFxuXG5cdCAgICB0aXRsZTogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHZhciB3b3JkcyA9IHN0ci5zcGxpdCgnICcpO1xuXHQgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB3b3Jkcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICB3b3Jkc1tpXSA9IGZpbHRlcnMuY2FwaXRhbGl6ZSh3b3Jkc1tpXSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHdvcmRzLmpvaW4oJyAnKSk7XG5cdCAgICB9LFxuXG5cdCAgICB0cmltOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCBzdHIucmVwbGFjZSgvXlxccyp8XFxzKiQvZywgJycpKTtcblx0ICAgIH0sXG5cblx0ICAgIHRydW5jYXRlOiBmdW5jdGlvbihpbnB1dCwgbGVuZ3RoLCBraWxsd29yZHMsIGVuZCkge1xuXHQgICAgICAgIHZhciBvcmlnID0gaW5wdXQ7XG5cdCAgICAgICAgaW5wdXQgPSBub3JtYWxpemUoaW5wdXQsICcnKTtcblx0ICAgICAgICBsZW5ndGggPSBsZW5ndGggfHwgMjU1O1xuXG5cdCAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA8PSBsZW5ndGgpXG5cdCAgICAgICAgICAgIHJldHVybiBpbnB1dDtcblxuXHQgICAgICAgIGlmIChraWxsd29yZHMpIHtcblx0ICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgbGVuZ3RoKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICB2YXIgaWR4ID0gaW5wdXQubGFzdEluZGV4T2YoJyAnLCBsZW5ndGgpO1xuXHQgICAgICAgICAgICBpZihpZHggPT09IC0xKSB7XG5cdCAgICAgICAgICAgICAgICBpZHggPSBsZW5ndGg7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cmluZygwLCBpZHgpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlucHV0ICs9IChlbmQgIT09IHVuZGVmaW5lZCAmJiBlbmQgIT09IG51bGwpID8gZW5kIDogJy4uLic7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKG9yaWcsIGlucHV0KTtcblx0ICAgIH0sXG5cblx0ICAgIHVwcGVyOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgcmV0dXJuIHN0ci50b1VwcGVyQ2FzZSgpO1xuXHQgICAgfSxcblxuXHQgICAgdXJsZW5jb2RlOiBmdW5jdGlvbihvYmopIHtcblx0ICAgICAgICB2YXIgZW5jID0gZW5jb2RlVVJJQ29tcG9uZW50O1xuXHQgICAgICAgIGlmIChsaWIuaXNTdHJpbmcob2JqKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gZW5jKG9iaik7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIHBhcnRzO1xuXHQgICAgICAgICAgICBpZiAobGliLmlzQXJyYXkob2JqKSkge1xuXHQgICAgICAgICAgICAgICAgcGFydHMgPSBvYmoubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW5jKGl0ZW1bMF0pICsgJz0nICsgZW5jKGl0ZW1bMV0pO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBwYXJ0cyA9IFtdO1xuXHQgICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goZW5jKGspICsgJz0nICsgZW5jKG9ialtrXSkpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gcGFydHMuam9pbignJicpO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIHVybGl6ZTogZnVuY3Rpb24oc3RyLCBsZW5ndGgsIG5vZm9sbG93KSB7XG5cdCAgICAgICAgaWYgKGlzTmFOKGxlbmd0aCkpIGxlbmd0aCA9IEluZmluaXR5O1xuXG5cdCAgICAgICAgdmFyIG5vRm9sbG93QXR0ciA9IChub2ZvbGxvdyA9PT0gdHJ1ZSA/ICcgcmVsPVwibm9mb2xsb3dcIicgOiAnJyk7XG5cblx0ICAgICAgICAvLyBGb3IgdGhlIGppbmphIHJlZ2V4cCwgc2VlXG5cdCAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21pdHN1aGlrby9qaW5qYTIvYmxvYi9mMTViODE0ZGNiYTZhYTEyYmM3NGQxZjdkMGM4ODFkNTVmNzEyNmJlL2ppbmphMi91dGlscy5weSNMMjAtTDIzXG5cdCAgICAgICAgdmFyIHB1bmNSRSA9IC9eKD86XFwofDx8Jmx0Oyk/KC4qPykoPzpcXC58LHxcXCl8XFxufCZndDspPyQvO1xuXHQgICAgICAgIC8vIGZyb20gaHR0cDovL2Jsb2cuZ2Vydi5uZXQvMjAxMS8wNS9odG1sNV9lbWFpbF9hZGRyZXNzX3JlZ2V4cC9cblx0ICAgICAgICB2YXIgZW1haWxSRSA9IC9eW1xcdy4hIyQlJicqK1xcLVxcLz0/XFxeYHt8fX5dK0BbYS16XFxkXFwtXSsoXFwuW2EtelxcZFxcLV0rKSskL2k7XG5cdCAgICAgICAgdmFyIGh0dHBIdHRwc1JFID0gL15odHRwcz86XFwvXFwvLiokLztcblx0ICAgICAgICB2YXIgd3d3UkUgPSAvXnd3d1xcLi87XG5cdCAgICAgICAgdmFyIHRsZFJFID0gL1xcLig/Om9yZ3xuZXR8Y29tKSg/OlxcOnxcXC98JCkvO1xuXG5cdCAgICAgICAgdmFyIHdvcmRzID0gc3RyLnNwbGl0KC8oXFxzKykvKS5maWx0ZXIoZnVuY3Rpb24od29yZCkge1xuXHQgICAgICAgICAgLy8gSWYgdGhlIHdvcmQgaGFzIG5vIGxlbmd0aCwgYmFpbC4gVGhpcyBjYW4gaGFwcGVuIGZvciBzdHIgd2l0aFxuXHQgICAgICAgICAgLy8gdHJhaWxpbmcgd2hpdGVzcGFjZS5cblx0ICAgICAgICAgIHJldHVybiB3b3JkICYmIHdvcmQubGVuZ3RoO1xuXHQgICAgICAgIH0pLm1hcChmdW5jdGlvbih3b3JkKSB7XG5cdCAgICAgICAgICB2YXIgbWF0Y2hlcyA9IHdvcmQubWF0Y2gocHVuY1JFKTtcblx0ICAgICAgICAgIHZhciBwb3NzaWJsZVVybCA9IG1hdGNoZXMgJiYgbWF0Y2hlc1sxXSB8fCB3b3JkO1xuXG5cdCAgICAgICAgICAvLyB1cmwgdGhhdCBzdGFydHMgd2l0aCBodHRwIG9yIGh0dHBzXG5cdCAgICAgICAgICBpZiAoaHR0cEh0dHBzUkUudGVzdChwb3NzaWJsZVVybCkpXG5cdCAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cIicgKyBwb3NzaWJsZVVybCArICdcIicgKyBub0ZvbGxvd0F0dHIgKyAnPicgKyBwb3NzaWJsZVVybC5zdWJzdHIoMCwgbGVuZ3RoKSArICc8L2E+JztcblxuXHQgICAgICAgICAgLy8gdXJsIHRoYXQgc3RhcnRzIHdpdGggd3d3LlxuXHQgICAgICAgICAgaWYgKHd3d1JFLnRlc3QocG9zc2libGVVcmwpKVxuXHQgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJodHRwOi8vJyArIHBvc3NpYmxlVXJsICsgJ1wiJyArIG5vRm9sbG93QXR0ciArICc+JyArIHBvc3NpYmxlVXJsLnN1YnN0cigwLCBsZW5ndGgpICsgJzwvYT4nO1xuXG5cdCAgICAgICAgICAvLyBhbiBlbWFpbCBhZGRyZXNzIG9mIHRoZSBmb3JtIHVzZXJuYW1lQGRvbWFpbi50bGRcblx0ICAgICAgICAgIGlmIChlbWFpbFJFLnRlc3QocG9zc2libGVVcmwpKVxuXHQgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJtYWlsdG86JyArIHBvc3NpYmxlVXJsICsgJ1wiPicgKyBwb3NzaWJsZVVybCArICc8L2E+JztcblxuXHQgICAgICAgICAgLy8gdXJsIHRoYXQgZW5kcyBpbiAuY29tLCAub3JnIG9yIC5uZXQgdGhhdCBpcyBub3QgYW4gZW1haWwgYWRkcmVzc1xuXHQgICAgICAgICAgaWYgKHRsZFJFLnRlc3QocG9zc2libGVVcmwpKVxuXHQgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJodHRwOi8vJyArIHBvc3NpYmxlVXJsICsgJ1wiJyArIG5vRm9sbG93QXR0ciArICc+JyArIHBvc3NpYmxlVXJsLnN1YnN0cigwLCBsZW5ndGgpICsgJzwvYT4nO1xuXG5cdCAgICAgICAgICByZXR1cm4gd29yZDtcblxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgcmV0dXJuIHdvcmRzLmpvaW4oJycpO1xuXHQgICAgfSxcblxuXHQgICAgd29yZGNvdW50OiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgdmFyIHdvcmRzID0gKHN0cikgPyBzdHIubWF0Y2goL1xcdysvZykgOiBudWxsO1xuXHQgICAgICAgIHJldHVybiAod29yZHMpID8gd29yZHMubGVuZ3RoIDogbnVsbDtcblx0ICAgIH0sXG5cblx0ICAgICdmbG9hdCc6IGZ1bmN0aW9uKHZhbCwgZGVmKSB7XG5cdCAgICAgICAgdmFyIHJlcyA9IHBhcnNlRmxvYXQodmFsKTtcblx0ICAgICAgICByZXR1cm4gaXNOYU4ocmVzKSA/IGRlZiA6IHJlcztcblx0ICAgIH0sXG5cblx0ICAgICdpbnQnOiBmdW5jdGlvbih2YWwsIGRlZikge1xuXHQgICAgICAgIHZhciByZXMgPSBwYXJzZUludCh2YWwsIDEwKTtcblx0ICAgICAgICByZXR1cm4gaXNOYU4ocmVzKSA/IGRlZiA6IHJlcztcblx0ICAgIH1cblx0fTtcblxuXHQvLyBBbGlhc2VzXG5cdGZpbHRlcnMuZCA9IGZpbHRlcnNbJ2RlZmF1bHQnXTtcblx0ZmlsdGVycy5lID0gZmlsdGVycy5lc2NhcGU7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBmaWx0ZXJzO1xuXG5cbi8qKiovIH0pLFxuLyogOCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblx0dmFyIE9iaiA9IF9fd2VicGFja19yZXF1aXJlX18oNik7XG5cblx0Ly8gRnJhbWVzIGtlZXAgdHJhY2sgb2Ygc2NvcGluZyBib3RoIGF0IGNvbXBpbGUtdGltZSBhbmQgcnVuLXRpbWUgc29cblx0Ly8gd2Uga25vdyBob3cgdG8gYWNjZXNzIHZhcmlhYmxlcy4gQmxvY2sgdGFncyBjYW4gaW50cm9kdWNlIHNwZWNpYWxcblx0Ly8gdmFyaWFibGVzLCBmb3IgZXhhbXBsZS5cblx0dmFyIEZyYW1lID0gT2JqLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbihwYXJlbnQsIGlzb2xhdGVXcml0ZXMpIHtcblx0ICAgICAgICB0aGlzLnZhcmlhYmxlcyA9IHt9O1xuXHQgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuXHQgICAgICAgIHRoaXMudG9wTGV2ZWwgPSBmYWxzZTtcblx0ICAgICAgICAvLyBpZiB0aGlzIGlzIHRydWUsIHdyaXRlcyAoc2V0KSBzaG91bGQgbmV2ZXIgcHJvcGFnYXRlIHVwd2FyZHMgcGFzdFxuXHQgICAgICAgIC8vIHRoaXMgZnJhbWUgdG8gaXRzIHBhcmVudCAodGhvdWdoIHJlYWRzIG1heSkuXG5cdCAgICAgICAgdGhpcy5pc29sYXRlV3JpdGVzID0gaXNvbGF0ZVdyaXRlcztcblx0ICAgIH0sXG5cblx0ICAgIHNldDogZnVuY3Rpb24obmFtZSwgdmFsLCByZXNvbHZlVXApIHtcblx0ICAgICAgICAvLyBBbGxvdyB2YXJpYWJsZXMgd2l0aCBkb3RzIGJ5IGF1dG9tYXRpY2FsbHkgY3JlYXRpbmcgdGhlXG5cdCAgICAgICAgLy8gbmVzdGVkIHN0cnVjdHVyZVxuXHQgICAgICAgIHZhciBwYXJ0cyA9IG5hbWUuc3BsaXQoJy4nKTtcblx0ICAgICAgICB2YXIgb2JqID0gdGhpcy52YXJpYWJsZXM7XG5cdCAgICAgICAgdmFyIGZyYW1lID0gdGhpcztcblxuXHQgICAgICAgIGlmKHJlc29sdmVVcCkge1xuXHQgICAgICAgICAgICBpZigoZnJhbWUgPSB0aGlzLnJlc29sdmUocGFydHNbMF0sIHRydWUpKSkge1xuXHQgICAgICAgICAgICAgICAgZnJhbWUuc2V0KG5hbWUsIHZhbCk7XG5cdCAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmb3IodmFyIGk9MDsgaTxwYXJ0cy5sZW5ndGggLSAxOyBpKyspIHtcblx0ICAgICAgICAgICAgdmFyIGlkID0gcGFydHNbaV07XG5cblx0ICAgICAgICAgICAgaWYoIW9ialtpZF0pIHtcblx0ICAgICAgICAgICAgICAgIG9ialtpZF0gPSB7fTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBvYmogPSBvYmpbaWRdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIG9ialtwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXV0gPSB2YWw7XG5cdCAgICB9LFxuXG5cdCAgICBnZXQ6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICB2YXIgdmFsID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG5cdCAgICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICB9LFxuXG5cdCAgICBsb29rdXA6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICB2YXIgcCA9IHRoaXMucGFyZW50O1xuXHQgICAgICAgIHZhciB2YWwgPSB0aGlzLnZhcmlhYmxlc1tuYW1lXTtcblx0ICAgICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gcCAmJiBwLmxvb2t1cChuYW1lKTtcblx0ICAgIH0sXG5cblx0ICAgIHJlc29sdmU6IGZ1bmN0aW9uKG5hbWUsIGZvcldyaXRlKSB7XG5cdCAgICAgICAgdmFyIHAgPSAoZm9yV3JpdGUgJiYgdGhpcy5pc29sYXRlV3JpdGVzKSA/IHVuZGVmaW5lZCA6IHRoaXMucGFyZW50O1xuXHQgICAgICAgIHZhciB2YWwgPSB0aGlzLnZhcmlhYmxlc1tuYW1lXTtcblx0ICAgICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHAgJiYgcC5yZXNvbHZlKG5hbWUpO1xuXHQgICAgfSxcblxuXHQgICAgcHVzaDogZnVuY3Rpb24oaXNvbGF0ZVdyaXRlcykge1xuXHQgICAgICAgIHJldHVybiBuZXcgRnJhbWUodGhpcywgaXNvbGF0ZVdyaXRlcyk7XG5cdCAgICB9LFxuXG5cdCAgICBwb3A6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLnBhcmVudDtcblx0ICAgIH1cblx0fSk7XG5cblx0ZnVuY3Rpb24gbWFrZU1hY3JvKGFyZ05hbWVzLCBrd2FyZ05hbWVzLCBmdW5jKSB7XG5cdCAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIGFyZ0NvdW50ID0gbnVtQXJncyhhcmd1bWVudHMpO1xuXHQgICAgICAgIHZhciBhcmdzO1xuXHQgICAgICAgIHZhciBrd2FyZ3MgPSBnZXRLZXl3b3JkQXJncyhhcmd1bWVudHMpO1xuXHQgICAgICAgIHZhciBpO1xuXG5cdCAgICAgICAgaWYoYXJnQ291bnQgPiBhcmdOYW1lcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgYXJnTmFtZXMubGVuZ3RoKTtcblxuXHQgICAgICAgICAgICAvLyBQb3NpdGlvbmFsIGFyZ3VtZW50cyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgaW4gYXNcblx0ICAgICAgICAgICAgLy8ga2V5d29yZCBhcmd1bWVudHMgKGVzc2VudGlhbGx5IGRlZmF1bHQgdmFsdWVzKVxuXHQgICAgICAgICAgICB2YXIgdmFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgYXJncy5sZW5ndGgsIGFyZ0NvdW50KTtcblx0ICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgdmFscy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgaWYoaSA8IGt3YXJnTmFtZXMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAga3dhcmdzW2t3YXJnTmFtZXNbaV1dID0gdmFsc1tpXTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGFyZ3MucHVzaChrd2FyZ3MpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKGFyZ0NvdW50IDwgYXJnTmFtZXMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIGFyZ0NvdW50KTtcblxuXHQgICAgICAgICAgICBmb3IoaSA9IGFyZ0NvdW50OyBpIDwgYXJnTmFtZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmdOYW1lc1tpXTtcblxuXHQgICAgICAgICAgICAgICAgLy8gS2V5d29yZCBhcmd1bWVudHMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIGFzXG5cdCAgICAgICAgICAgICAgICAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50cywgaS5lLiB0aGUgY2FsbGVyIGV4cGxpY2l0bHlcblx0ICAgICAgICAgICAgICAgIC8vIHVzZWQgdGhlIG5hbWUgb2YgYSBwb3NpdGlvbmFsIGFyZ1xuXHQgICAgICAgICAgICAgICAgYXJncy5wdXNoKGt3YXJnc1thcmddKTtcblx0ICAgICAgICAgICAgICAgIGRlbGV0ZSBrd2FyZ3NbYXJnXTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGFyZ3MucHVzaChrd2FyZ3MpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcblx0ICAgIH07XG5cdH1cblxuXHRmdW5jdGlvbiBtYWtlS2V5d29yZEFyZ3Mob2JqKSB7XG5cdCAgICBvYmouX19rZXl3b3JkcyA9IHRydWU7XG5cdCAgICByZXR1cm4gb2JqO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0S2V5d29yZEFyZ3MoYXJncykge1xuXHQgICAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuXHQgICAgaWYobGVuKSB7XG5cdCAgICAgICAgdmFyIGxhc3RBcmcgPSBhcmdzW2xlbiAtIDFdO1xuXHQgICAgICAgIGlmKGxhc3RBcmcgJiYgbGFzdEFyZy5oYXNPd25Qcm9wZXJ0eSgnX19rZXl3b3JkcycpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBsYXN0QXJnO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHJldHVybiB7fTtcblx0fVxuXG5cdGZ1bmN0aW9uIG51bUFyZ3MoYXJncykge1xuXHQgICAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuXHQgICAgaWYobGVuID09PSAwKSB7XG5cdCAgICAgICAgcmV0dXJuIDA7XG5cdCAgICB9XG5cblx0ICAgIHZhciBsYXN0QXJnID0gYXJnc1tsZW4gLSAxXTtcblx0ICAgIGlmKGxhc3RBcmcgJiYgbGFzdEFyZy5oYXNPd25Qcm9wZXJ0eSgnX19rZXl3b3JkcycpKSB7XG5cdCAgICAgICAgcmV0dXJuIGxlbiAtIDE7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICByZXR1cm4gbGVuO1xuXHQgICAgfVxuXHR9XG5cblx0Ly8gQSBTYWZlU3RyaW5nIG9iamVjdCBpbmRpY2F0ZXMgdGhhdCB0aGUgc3RyaW5nIHNob3VsZCBub3QgYmVcblx0Ly8gYXV0b2VzY2FwZWQuIFRoaXMgaGFwcGVucyBtYWdpY2FsbHkgYmVjYXVzZSBhdXRvZXNjYXBpbmcgb25seVxuXHQvLyBvY2N1cnMgb24gcHJpbWl0aXZlIHN0cmluZyBvYmplY3RzLlxuXHRmdW5jdGlvbiBTYWZlU3RyaW5nKHZhbCkge1xuXHQgICAgaWYodHlwZW9mIHZhbCAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgfVxuXG5cdCAgICB0aGlzLnZhbCA9IHZhbDtcblx0ICAgIHRoaXMubGVuZ3RoID0gdmFsLmxlbmd0aDtcblx0fVxuXG5cdFNhZmVTdHJpbmcucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdHJpbmcucHJvdG90eXBlLCB7XG5cdCAgICBsZW5ndGg6IHsgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgdmFsdWU6IDAgfVxuXHR9KTtcblx0U2FmZVN0cmluZy5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uKCkge1xuXHQgICAgcmV0dXJuIHRoaXMudmFsO1xuXHR9O1xuXHRTYWZlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXHQgICAgcmV0dXJuIHRoaXMudmFsO1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGNvcHlTYWZlbmVzcyhkZXN0LCB0YXJnZXQpIHtcblx0ICAgIGlmKGRlc3QgaW5zdGFuY2VvZiBTYWZlU3RyaW5nKSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBTYWZlU3RyaW5nKHRhcmdldCk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdGFyZ2V0LnRvU3RyaW5nKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBtYXJrU2FmZSh2YWwpIHtcblx0ICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbDtcblxuXHQgICAgaWYodHlwZSA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICByZXR1cm4gbmV3IFNhZmVTdHJpbmcodmFsKTtcblx0ICAgIH1cblx0ICAgIGVsc2UgaWYodHlwZSAhPT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHZhciByZXQgPSB2YWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuXHQgICAgICAgICAgICBpZih0eXBlb2YgcmV0ID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTYWZlU3RyaW5nKHJldCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gcmV0O1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cdH1cblxuXHRmdW5jdGlvbiBzdXBwcmVzc1ZhbHVlKHZhbCwgYXV0b2VzY2FwZSkge1xuXHQgICAgdmFsID0gKHZhbCAhPT0gdW5kZWZpbmVkICYmIHZhbCAhPT0gbnVsbCkgPyB2YWwgOiAnJztcblxuXHQgICAgaWYoYXV0b2VzY2FwZSAmJiAhKHZhbCBpbnN0YW5jZW9mIFNhZmVTdHJpbmcpKSB7XG5cdCAgICAgICAgdmFsID0gbGliLmVzY2FwZSh2YWwudG9TdHJpbmcoKSk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiB2YWw7XG5cdH1cblxuXHRmdW5jdGlvbiBlbnN1cmVEZWZpbmVkKHZhbCwgbGluZW5vLCBjb2xubykge1xuXHQgICAgaWYodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKFxuXHQgICAgICAgICAgICAnYXR0ZW1wdGVkIHRvIG91dHB1dCBudWxsIG9yIHVuZGVmaW5lZCB2YWx1ZScsXG5cdCAgICAgICAgICAgIGxpbmVubyArIDEsXG5cdCAgICAgICAgICAgIGNvbG5vICsgMVxuXHQgICAgICAgICk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdmFsO1xuXHR9XG5cblx0ZnVuY3Rpb24gbWVtYmVyTG9va3VwKG9iaiwgdmFsKSB7XG5cdCAgICBvYmogPSBvYmogfHwge307XG5cblx0ICAgIGlmKHR5cGVvZiBvYmpbdmFsXSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIG9ialt2YWxdLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gb2JqW3ZhbF07XG5cdH1cblxuXHRmdW5jdGlvbiBjYWxsV3JhcChvYmosIG5hbWUsIGNvbnRleHQsIGFyZ3MpIHtcblx0ICAgIGlmKCFvYmopIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjYWxsIGAnICsgbmFtZSArICdgLCB3aGljaCBpcyB1bmRlZmluZWQgb3IgZmFsc2V5Jyk7XG5cdCAgICB9XG5cdCAgICBlbHNlIGlmKHR5cGVvZiBvYmogIT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjYWxsIGAnICsgbmFtZSArICdgLCB3aGljaCBpcyBub3QgYSBmdW5jdGlvbicpO1xuXHQgICAgfVxuXG5cdCAgICAvLyBqc2hpbnQgdmFsaWR0aGlzOiB0cnVlXG5cdCAgICByZXR1cm4gb2JqLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIG5hbWUpIHtcblx0ICAgIHZhciB2YWwgPSBmcmFtZS5sb29rdXAobmFtZSk7XG5cdCAgICByZXR1cm4gKHZhbCAhPT0gdW5kZWZpbmVkKSA/XG5cdCAgICAgICAgdmFsIDpcblx0ICAgICAgICBjb250ZXh0Lmxvb2t1cChuYW1lKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUVycm9yKGVycm9yLCBsaW5lbm8sIGNvbG5vKSB7XG5cdCAgICBpZihlcnJvci5saW5lbm8pIHtcblx0ICAgICAgICByZXR1cm4gZXJyb3I7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICByZXR1cm4gbmV3IGxpYi5UZW1wbGF0ZUVycm9yKGVycm9yLCBsaW5lbm8sIGNvbG5vKTtcblx0ICAgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIGFzeW5jRWFjaChhcnIsIGRpbWVuLCBpdGVyLCBjYikge1xuXHQgICAgaWYobGliLmlzQXJyYXkoYXJyKSkge1xuXHQgICAgICAgIHZhciBsZW4gPSBhcnIubGVuZ3RoO1xuXG5cdCAgICAgICAgbGliLmFzeW5jSXRlcihhcnIsIGZ1bmN0aW9uKGl0ZW0sIGksIG5leHQpIHtcblx0ICAgICAgICAgICAgc3dpdGNoKGRpbWVuKSB7XG5cdCAgICAgICAgICAgIGNhc2UgMTogaXRlcihpdGVtLCBpLCBsZW4sIG5leHQpOyBicmVhaztcblx0ICAgICAgICAgICAgY2FzZSAyOiBpdGVyKGl0ZW1bMF0sIGl0ZW1bMV0sIGksIGxlbiwgbmV4dCk7IGJyZWFrO1xuXHQgICAgICAgICAgICBjYXNlIDM6IGl0ZXIoaXRlbVswXSwgaXRlbVsxXSwgaXRlbVsyXSwgaSwgbGVuLCBuZXh0KTsgYnJlYWs7XG5cdCAgICAgICAgICAgIGRlZmF1bHQ6XG5cdCAgICAgICAgICAgICAgICBpdGVtLnB1c2goaSwgbmV4dCk7XG5cdCAgICAgICAgICAgICAgICBpdGVyLmFwcGx5KHRoaXMsIGl0ZW0pO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSwgY2IpO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgbGliLmFzeW5jRm9yKGFyciwgZnVuY3Rpb24oa2V5LCB2YWwsIGksIGxlbiwgbmV4dCkge1xuXHQgICAgICAgICAgICBpdGVyKGtleSwgdmFsLCBpLCBsZW4sIG5leHQpO1xuXHQgICAgICAgIH0sIGNiKTtcblx0ICAgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIGFzeW5jQWxsKGFyciwgZGltZW4sIGZ1bmMsIGNiKSB7XG5cdCAgICB2YXIgZmluaXNoZWQgPSAwO1xuXHQgICAgdmFyIGxlbiwgaTtcblx0ICAgIHZhciBvdXRwdXRBcnI7XG5cblx0ICAgIGZ1bmN0aW9uIGRvbmUoaSwgb3V0cHV0KSB7XG5cdCAgICAgICAgZmluaXNoZWQrKztcblx0ICAgICAgICBvdXRwdXRBcnJbaV0gPSBvdXRwdXQ7XG5cblx0ICAgICAgICBpZihmaW5pc2hlZCA9PT0gbGVuKSB7XG5cdCAgICAgICAgICAgIGNiKG51bGwsIG91dHB1dEFyci5qb2luKCcnKSk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBpZihsaWIuaXNBcnJheShhcnIpKSB7XG5cdCAgICAgICAgbGVuID0gYXJyLmxlbmd0aDtcblx0ICAgICAgICBvdXRwdXRBcnIgPSBuZXcgQXJyYXkobGVuKTtcblxuXHQgICAgICAgIGlmKGxlbiA9PT0gMCkge1xuXHQgICAgICAgICAgICBjYihudWxsLCAnJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHZhciBpdGVtID0gYXJyW2ldO1xuXG5cdCAgICAgICAgICAgICAgICBzd2l0Y2goZGltZW4pIHtcblx0ICAgICAgICAgICAgICAgIGNhc2UgMTogZnVuYyhpdGVtLCBpLCBsZW4sIGRvbmUpOyBicmVhaztcblx0ICAgICAgICAgICAgICAgIGNhc2UgMjogZnVuYyhpdGVtWzBdLCBpdGVtWzFdLCBpLCBsZW4sIGRvbmUpOyBicmVhaztcblx0ICAgICAgICAgICAgICAgIGNhc2UgMzogZnVuYyhpdGVtWzBdLCBpdGVtWzFdLCBpdGVtWzJdLCBpLCBsZW4sIGRvbmUpOyBicmVhaztcblx0ICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG5cdCAgICAgICAgICAgICAgICAgICAgaXRlbS5wdXNoKGksIGRvbmUpO1xuXHQgICAgICAgICAgICAgICAgICAgIC8vIGpzaGludCB2YWxpZHRoaXM6IHRydWVcblx0ICAgICAgICAgICAgICAgICAgICBmdW5jLmFwcGx5KHRoaXMsIGl0ZW0pO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgdmFyIGtleXMgPSBsaWIua2V5cyhhcnIpO1xuXHQgICAgICAgIGxlbiA9IGtleXMubGVuZ3RoO1xuXHQgICAgICAgIG91dHB1dEFyciA9IG5ldyBBcnJheShsZW4pO1xuXG5cdCAgICAgICAgaWYobGVuID09PSAwKSB7XG5cdCAgICAgICAgICAgIGNiKG51bGwsICcnKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHZhciBrID0ga2V5c1tpXTtcblx0ICAgICAgICAgICAgICAgIGZ1bmMoaywgYXJyW2tdLCBpLCBsZW4sIGRvbmUpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMgPSB7XG5cdCAgICBGcmFtZTogRnJhbWUsXG5cdCAgICBtYWtlTWFjcm86IG1ha2VNYWNybyxcblx0ICAgIG1ha2VLZXl3b3JkQXJnczogbWFrZUtleXdvcmRBcmdzLFxuXHQgICAgbnVtQXJnczogbnVtQXJncyxcblx0ICAgIHN1cHByZXNzVmFsdWU6IHN1cHByZXNzVmFsdWUsXG5cdCAgICBlbnN1cmVEZWZpbmVkOiBlbnN1cmVEZWZpbmVkLFxuXHQgICAgbWVtYmVyTG9va3VwOiBtZW1iZXJMb29rdXAsXG5cdCAgICBjb250ZXh0T3JGcmFtZUxvb2t1cDogY29udGV4dE9yRnJhbWVMb29rdXAsXG5cdCAgICBjYWxsV3JhcDogY2FsbFdyYXAsXG5cdCAgICBoYW5kbGVFcnJvcjogaGFuZGxlRXJyb3IsXG5cdCAgICBpc0FycmF5OiBsaWIuaXNBcnJheSxcblx0ICAgIGtleXM6IGxpYi5rZXlzLFxuXHQgICAgU2FmZVN0cmluZzogU2FmZVN0cmluZyxcblx0ICAgIGNvcHlTYWZlbmVzczogY29weVNhZmVuZXNzLFxuXHQgICAgbWFya1NhZmU6IG1hcmtTYWZlLFxuXHQgICAgYXN5bmNFYWNoOiBhc3luY0VhY2gsXG5cdCAgICBhc3luY0FsbDogYXN5bmNBbGwsXG5cdCAgICBpbk9wZXJhdG9yOiBsaWIuaW5PcGVyYXRvclxuXHR9O1xuXG5cbi8qKiovIH0pLFxuLyogOSAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRmdW5jdGlvbiBjeWNsZXIoaXRlbXMpIHtcblx0ICAgIHZhciBpbmRleCA9IC0xO1xuXG5cdCAgICByZXR1cm4ge1xuXHQgICAgICAgIGN1cnJlbnQ6IG51bGwsXG5cdCAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICBpbmRleCA9IC0xO1xuXHQgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBudWxsO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgaW5kZXgrKztcblx0ICAgICAgICAgICAgaWYoaW5kZXggPj0gaXRlbXMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICBpbmRleCA9IDA7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBpdGVtc1tpbmRleF07XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnQ7XG5cdCAgICAgICAgfSxcblx0ICAgIH07XG5cblx0fVxuXG5cdGZ1bmN0aW9uIGpvaW5lcihzZXApIHtcblx0ICAgIHNlcCA9IHNlcCB8fCAnLCc7XG5cdCAgICB2YXIgZmlyc3QgPSB0cnVlO1xuXG5cdCAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIHZhbCA9IGZpcnN0ID8gJycgOiBzZXA7XG5cdCAgICAgICAgZmlyc3QgPSBmYWxzZTtcblx0ICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgfTtcblx0fVxuXG5cdC8vIE1ha2luZyB0aGlzIGEgZnVuY3Rpb24gaW5zdGVhZCBzbyBpdCByZXR1cm5zIGEgbmV3IG9iamVjdFxuXHQvLyBlYWNoIHRpbWUgaXQncyBjYWxsZWQuIFRoYXQgd2F5LCBpZiBzb21ldGhpbmcgbGlrZSBhbiBlbnZpcm9ubWVudFxuXHQvLyB1c2VzIGl0LCB0aGV5IHdpbGwgZWFjaCBoYXZlIHRoZWlyIG93biBjb3B5LlxuXHRmdW5jdGlvbiBnbG9iYWxzKCkge1xuXHQgICAgcmV0dXJuIHtcblx0ICAgICAgICByYW5nZTogZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcblx0ICAgICAgICAgICAgaWYodHlwZW9mIHN0b3AgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgICAgICBzdG9wID0gc3RhcnQ7XG5cdCAgICAgICAgICAgICAgICBzdGFydCA9IDA7XG5cdCAgICAgICAgICAgICAgICBzdGVwID0gMTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKCFzdGVwKSB7XG5cdCAgICAgICAgICAgICAgICBzdGVwID0gMTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHZhciBhcnIgPSBbXTtcblx0ICAgICAgICAgICAgdmFyIGk7XG5cdCAgICAgICAgICAgIGlmIChzdGVwID4gMCkge1xuXHQgICAgICAgICAgICAgICAgZm9yIChpPXN0YXJ0OyBpPHN0b3A7IGkrPXN0ZXApIHtcblx0ICAgICAgICAgICAgICAgICAgICBhcnIucHVzaChpKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIGZvciAoaT1zdGFydDsgaT5zdG9wOyBpKz1zdGVwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goaSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIGFycjtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLy8gbGlwc3VtOiBmdW5jdGlvbihuLCBodG1sLCBtaW4sIG1heCkge1xuXHQgICAgICAgIC8vIH0sXG5cblx0ICAgICAgICBjeWNsZXI6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICByZXR1cm4gY3ljbGVyKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICBqb2luZXI6IGZ1bmN0aW9uKHNlcCkge1xuXHQgICAgICAgICAgICByZXR1cm4gam9pbmVyKHNlcCk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzID0gZ2xvYmFscztcblxuXG4vKioqLyB9KSxcbi8qIDEwICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18sIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fOy8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqLyhmdW5jdGlvbihzZXRJbW1lZGlhdGUsIHByb2Nlc3MpIHsvLyBNSVQgbGljZW5zZSAoYnkgRWxhbiBTaGFua2VyKS5cblx0KGZ1bmN0aW9uKGdsb2JhbHMpIHtcblx0ICAndXNlIHN0cmljdCc7XG5cblx0ICB2YXIgZXhlY3V0ZVN5bmMgPSBmdW5jdGlvbigpe1xuXHQgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXHQgICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnZnVuY3Rpb24nKXtcblx0ICAgICAgYXJnc1swXS5hcHBseShudWxsLCBhcmdzLnNwbGljZSgxKSk7XG5cdCAgICB9XG5cdCAgfTtcblxuXHQgIHZhciBleGVjdXRlQXN5bmMgPSBmdW5jdGlvbihmbil7XG5cdCAgICBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICBzZXRJbW1lZGlhdGUoZm4pO1xuXHQgICAgfSBlbHNlIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcHJvY2Vzcy5uZXh0VGljaykge1xuXHQgICAgICBwcm9jZXNzLm5leHRUaWNrKGZuKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuXHQgICAgfVxuXHQgIH07XG5cblx0ICB2YXIgbWFrZUl0ZXJhdG9yID0gZnVuY3Rpb24gKHRhc2tzKSB7XG5cdCAgICB2YXIgbWFrZUNhbGxiYWNrID0gZnVuY3Rpb24gKGluZGV4KSB7XG5cdCAgICAgIHZhciBmbiA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICBpZiAodGFza3MubGVuZ3RoKSB7XG5cdCAgICAgICAgICB0YXNrc1tpbmRleF0uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGZuLm5leHQoKTtcblx0ICAgICAgfTtcblx0ICAgICAgZm4ubmV4dCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICByZXR1cm4gKGluZGV4IDwgdGFza3MubGVuZ3RoIC0gMSkgPyBtYWtlQ2FsbGJhY2soaW5kZXggKyAxKTogbnVsbDtcblx0ICAgICAgfTtcblx0ICAgICAgcmV0dXJuIGZuO1xuXHQgICAgfTtcblx0ICAgIHJldHVybiBtYWtlQ2FsbGJhY2soMCk7XG5cdCAgfTtcblx0ICBcblx0ICB2YXIgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKG1heWJlQXJyYXkpe1xuXHQgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChtYXliZUFycmF5KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcblx0ICB9O1xuXG5cdCAgdmFyIHdhdGVyZmFsbCA9IGZ1bmN0aW9uICh0YXNrcywgY2FsbGJhY2ssIGZvcmNlQXN5bmMpIHtcblx0ICAgIHZhciBuZXh0VGljayA9IGZvcmNlQXN5bmMgPyBleGVjdXRlQXN5bmMgOiBleGVjdXRlU3luYztcblx0ICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24gKCkge307XG5cdCAgICBpZiAoIV9pc0FycmF5KHRhc2tzKSkge1xuXHQgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byB3YXRlcmZhbGwgbXVzdCBiZSBhbiBhcnJheSBvZiBmdW5jdGlvbnMnKTtcblx0ICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdCAgICB9XG5cdCAgICBpZiAoIXRhc2tzLmxlbmd0aCkge1xuXHQgICAgICByZXR1cm4gY2FsbGJhY2soKTtcblx0ICAgIH1cblx0ICAgIHZhciB3cmFwSXRlcmF0b3IgPSBmdW5jdGlvbiAoaXRlcmF0b3IpIHtcblx0ICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlcnIpIHtcblx0ICAgICAgICBpZiAoZXJyKSB7XG5cdCAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuXHQgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXHQgICAgICAgICAgdmFyIG5leHQgPSBpdGVyYXRvci5uZXh0KCk7XG5cdCAgICAgICAgICBpZiAobmV4dCkge1xuXHQgICAgICAgICAgICBhcmdzLnB1c2god3JhcEl0ZXJhdG9yKG5leHQpKTtcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGFyZ3MucHVzaChjYWxsYmFjayk7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIGl0ZXJhdG9yLmFwcGx5KG51bGwsIGFyZ3MpO1xuXHQgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9O1xuXHQgICAgfTtcblx0ICAgIHdyYXBJdGVyYXRvcihtYWtlSXRlcmF0b3IodGFza3MpKSgpO1xuXHQgIH07XG5cblx0ICBpZiAodHJ1ZSkge1xuXHQgICAgIShfX1dFQlBBQ0tfQU1EX0RFRklORV9BUlJBWV9fID0gW10sIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICByZXR1cm4gd2F0ZXJmYWxsO1xuXHQgICAgfS5hcHBseShleHBvcnRzLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9BUlJBWV9fKSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gIT09IHVuZGVmaW5lZCAmJiAobW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXykpOyAvLyBSZXF1aXJlSlNcblx0ICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IHdhdGVyZmFsbDsgLy8gQ29tbW9uSlNcblx0ICB9IGVsc2Uge1xuXHQgICAgZ2xvYmFscy53YXRlcmZhbGwgPSB3YXRlcmZhbGw7IC8vIDxzY3JpcHQ+XG5cdCAgfVxuXHR9KSh0aGlzKTtcblxuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi99LmNhbGwoZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXygxMSkuc2V0SW1tZWRpYXRlLCBfX3dlYnBhY2tfcmVxdWlyZV9fKDEzKSkpXG5cbi8qKiovIH0pLFxuLyogMTEgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHR2YXIgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHk7XG5cblx0Ly8gRE9NIEFQSXMsIGZvciBjb21wbGV0ZW5lc3NcblxuXHRleHBvcnRzLnNldFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcblx0ICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRUaW1lb3V0LCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFyVGltZW91dCk7XG5cdH07XG5cdGV4cG9ydHMuc2V0SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcblx0ICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRJbnRlcnZhbCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhckludGVydmFsKTtcblx0fTtcblx0ZXhwb3J0cy5jbGVhclRpbWVvdXQgPVxuXHRleHBvcnRzLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbih0aW1lb3V0KSB7XG5cdCAgaWYgKHRpbWVvdXQpIHtcblx0ICAgIHRpbWVvdXQuY2xvc2UoKTtcblx0ICB9XG5cdH07XG5cblx0ZnVuY3Rpb24gVGltZW91dChpZCwgY2xlYXJGbikge1xuXHQgIHRoaXMuX2lkID0gaWQ7XG5cdCAgdGhpcy5fY2xlYXJGbiA9IGNsZWFyRm47XG5cdH1cblx0VGltZW91dC5wcm90b3R5cGUudW5yZWYgPSBUaW1lb3V0LnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbigpIHt9O1xuXHRUaW1lb3V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuXHQgIHRoaXMuX2NsZWFyRm4uY2FsbCh3aW5kb3csIHRoaXMuX2lkKTtcblx0fTtcblxuXHQvLyBEb2VzIG5vdCBzdGFydCB0aGUgdGltZSwganVzdCBzZXRzIHVwIHRoZSBtZW1iZXJzIG5lZWRlZC5cblx0ZXhwb3J0cy5lbnJvbGwgPSBmdW5jdGlvbihpdGVtLCBtc2Vjcykge1xuXHQgIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblx0ICBpdGVtLl9pZGxlVGltZW91dCA9IG1zZWNzO1xuXHR9O1xuXG5cdGV4cG9ydHMudW5lbnJvbGwgPSBmdW5jdGlvbihpdGVtKSB7XG5cdCAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXHQgIGl0ZW0uX2lkbGVUaW1lb3V0ID0gLTE7XG5cdH07XG5cblx0ZXhwb3J0cy5fdW5yZWZBY3RpdmUgPSBleHBvcnRzLmFjdGl2ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0ICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cblx0ICB2YXIgbXNlY3MgPSBpdGVtLl9pZGxlVGltZW91dDtcblx0ICBpZiAobXNlY3MgPj0gMCkge1xuXHQgICAgaXRlbS5faWRsZVRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gb25UaW1lb3V0KCkge1xuXHQgICAgICBpZiAoaXRlbS5fb25UaW1lb3V0KVxuXHQgICAgICAgIGl0ZW0uX29uVGltZW91dCgpO1xuXHQgICAgfSwgbXNlY3MpO1xuXHQgIH1cblx0fTtcblxuXHQvLyBzZXRpbW1lZGlhdGUgYXR0YWNoZXMgaXRzZWxmIHRvIHRoZSBnbG9iYWwgb2JqZWN0XG5cdF9fd2VicGFja19yZXF1aXJlX18oMTIpO1xuXHRleHBvcnRzLnNldEltbWVkaWF0ZSA9IHNldEltbWVkaWF0ZTtcblx0ZXhwb3J0cy5jbGVhckltbWVkaWF0ZSA9IGNsZWFySW1tZWRpYXRlO1xuXG5cbi8qKiovIH0pLFxuLyogMTIgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi8oZnVuY3Rpb24oZ2xvYmFsLCBwcm9jZXNzKSB7KGZ1bmN0aW9uIChnbG9iYWwsIHVuZGVmaW5lZCkge1xuXHQgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cblx0ICAgIGlmIChnbG9iYWwuc2V0SW1tZWRpYXRlKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgbmV4dEhhbmRsZSA9IDE7IC8vIFNwZWMgc2F5cyBncmVhdGVyIHRoYW4gemVyb1xuXHQgICAgdmFyIHRhc2tzQnlIYW5kbGUgPSB7fTtcblx0ICAgIHZhciBjdXJyZW50bHlSdW5uaW5nQVRhc2sgPSBmYWxzZTtcblx0ICAgIHZhciBkb2MgPSBnbG9iYWwuZG9jdW1lbnQ7XG5cdCAgICB2YXIgcmVnaXN0ZXJJbW1lZGlhdGU7XG5cblx0ICAgIGZ1bmN0aW9uIHNldEltbWVkaWF0ZShjYWxsYmFjaykge1xuXHQgICAgICAvLyBDYWxsYmFjayBjYW4gZWl0aGVyIGJlIGEgZnVuY3Rpb24gb3IgYSBzdHJpbmdcblx0ICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG5cdCAgICAgICAgY2FsbGJhY2sgPSBuZXcgRnVuY3Rpb24oXCJcIiArIGNhbGxiYWNrKTtcblx0ICAgICAgfVxuXHQgICAgICAvLyBDb3B5IGZ1bmN0aW9uIGFyZ3VtZW50c1xuXHQgICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG5cdCAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpICsgMV07XG5cdCAgICAgIH1cblx0ICAgICAgLy8gU3RvcmUgYW5kIHJlZ2lzdGVyIHRoZSB0YXNrXG5cdCAgICAgIHZhciB0YXNrID0geyBjYWxsYmFjazogY2FsbGJhY2ssIGFyZ3M6IGFyZ3MgfTtcblx0ICAgICAgdGFza3NCeUhhbmRsZVtuZXh0SGFuZGxlXSA9IHRhc2s7XG5cdCAgICAgIHJlZ2lzdGVySW1tZWRpYXRlKG5leHRIYW5kbGUpO1xuXHQgICAgICByZXR1cm4gbmV4dEhhbmRsZSsrO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBjbGVhckltbWVkaWF0ZShoYW5kbGUpIHtcblx0ICAgICAgICBkZWxldGUgdGFza3NCeUhhbmRsZVtoYW5kbGVdO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBydW4odGFzaykge1xuXHQgICAgICAgIHZhciBjYWxsYmFjayA9IHRhc2suY2FsbGJhY2s7XG5cdCAgICAgICAgdmFyIGFyZ3MgPSB0YXNrLmFyZ3M7XG5cdCAgICAgICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuXHQgICAgICAgIGNhc2UgMDpcblx0ICAgICAgICAgICAgY2FsbGJhY2soKTtcblx0ICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgY2FzZSAxOlxuXHQgICAgICAgICAgICBjYWxsYmFjayhhcmdzWzBdKTtcblx0ICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgY2FzZSAyOlxuXHQgICAgICAgICAgICBjYWxsYmFjayhhcmdzWzBdLCBhcmdzWzFdKTtcblx0ICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgY2FzZSAzOlxuXHQgICAgICAgICAgICBjYWxsYmFjayhhcmdzWzBdLCBhcmdzWzFdLCBhcmdzWzJdKTtcblx0ICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodW5kZWZpbmVkLCBhcmdzKTtcblx0ICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBydW5JZlByZXNlbnQoaGFuZGxlKSB7XG5cdCAgICAgICAgLy8gRnJvbSB0aGUgc3BlYzogXCJXYWl0IHVudGlsIGFueSBpbnZvY2F0aW9ucyBvZiB0aGlzIGFsZ29yaXRobSBzdGFydGVkIGJlZm9yZSB0aGlzIG9uZSBoYXZlIGNvbXBsZXRlZC5cIlxuXHQgICAgICAgIC8vIFNvIGlmIHdlJ3JlIGN1cnJlbnRseSBydW5uaW5nIGEgdGFzaywgd2UnbGwgbmVlZCB0byBkZWxheSB0aGlzIGludm9jYXRpb24uXG5cdCAgICAgICAgaWYgKGN1cnJlbnRseVJ1bm5pbmdBVGFzaykge1xuXHQgICAgICAgICAgICAvLyBEZWxheSBieSBkb2luZyBhIHNldFRpbWVvdXQuIHNldEltbWVkaWF0ZSB3YXMgdHJpZWQgaW5zdGVhZCwgYnV0IGluIEZpcmVmb3ggNyBpdCBnZW5lcmF0ZWQgYVxuXHQgICAgICAgICAgICAvLyBcInRvbyBtdWNoIHJlY3Vyc2lvblwiIGVycm9yLlxuXHQgICAgICAgICAgICBzZXRUaW1lb3V0KHJ1bklmUHJlc2VudCwgMCwgaGFuZGxlKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICB2YXIgdGFzayA9IHRhc2tzQnlIYW5kbGVbaGFuZGxlXTtcblx0ICAgICAgICAgICAgaWYgKHRhc2spIHtcblx0ICAgICAgICAgICAgICAgIGN1cnJlbnRseVJ1bm5pbmdBVGFzayA9IHRydWU7XG5cdCAgICAgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJ1bih0YXNrKTtcblx0ICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XG5cdCAgICAgICAgICAgICAgICAgICAgY2xlYXJJbW1lZGlhdGUoaGFuZGxlKTtcblx0ICAgICAgICAgICAgICAgICAgICBjdXJyZW50bHlSdW5uaW5nQVRhc2sgPSBmYWxzZTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gaW5zdGFsbE5leHRUaWNrSW1wbGVtZW50YXRpb24oKSB7XG5cdCAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcblx0ICAgICAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7IHJ1bklmUHJlc2VudChoYW5kbGUpOyB9KTtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBjYW5Vc2VQb3N0TWVzc2FnZSgpIHtcblx0ICAgICAgICAvLyBUaGUgdGVzdCBhZ2FpbnN0IGBpbXBvcnRTY3JpcHRzYCBwcmV2ZW50cyB0aGlzIGltcGxlbWVudGF0aW9uIGZyb20gYmVpbmcgaW5zdGFsbGVkIGluc2lkZSBhIHdlYiB3b3JrZXIsXG5cdCAgICAgICAgLy8gd2hlcmUgYGdsb2JhbC5wb3N0TWVzc2FnZWAgbWVhbnMgc29tZXRoaW5nIGNvbXBsZXRlbHkgZGlmZmVyZW50IGFuZCBjYW4ndCBiZSB1c2VkIGZvciB0aGlzIHB1cnBvc2UuXG5cdCAgICAgICAgaWYgKGdsb2JhbC5wb3N0TWVzc2FnZSAmJiAhZ2xvYmFsLmltcG9ydFNjcmlwdHMpIHtcblx0ICAgICAgICAgICAgdmFyIHBvc3RNZXNzYWdlSXNBc3luY2hyb25vdXMgPSB0cnVlO1xuXHQgICAgICAgICAgICB2YXIgb2xkT25NZXNzYWdlID0gZ2xvYmFsLm9ubWVzc2FnZTtcblx0ICAgICAgICAgICAgZ2xvYmFsLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgICAgcG9zdE1lc3NhZ2VJc0FzeW5jaHJvbm91cyA9IGZhbHNlO1xuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICBnbG9iYWwucG9zdE1lc3NhZ2UoXCJcIiwgXCIqXCIpO1xuXHQgICAgICAgICAgICBnbG9iYWwub25tZXNzYWdlID0gb2xkT25NZXNzYWdlO1xuXHQgICAgICAgICAgICByZXR1cm4gcG9zdE1lc3NhZ2VJc0FzeW5jaHJvbm91cztcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGluc3RhbGxQb3N0TWVzc2FnZUltcGxlbWVudGF0aW9uKCkge1xuXHQgICAgICAgIC8vIEluc3RhbGxzIGFuIGV2ZW50IGhhbmRsZXIgb24gYGdsb2JhbGAgZm9yIHRoZSBgbWVzc2FnZWAgZXZlbnQ6IHNlZVxuXHQgICAgICAgIC8vICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vRE9NL3dpbmRvdy5wb3N0TWVzc2FnZVxuXHQgICAgICAgIC8vICogaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2UvY29tbXMuaHRtbCNjcm9zc0RvY3VtZW50TWVzc2FnZXNcblxuXHQgICAgICAgIHZhciBtZXNzYWdlUHJlZml4ID0gXCJzZXRJbW1lZGlhdGUkXCIgKyBNYXRoLnJhbmRvbSgpICsgXCIkXCI7XG5cdCAgICAgICAgdmFyIG9uR2xvYmFsTWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICAgICAgICAgIGlmIChldmVudC5zb3VyY2UgPT09IGdsb2JhbCAmJlxuXHQgICAgICAgICAgICAgICAgdHlwZW9mIGV2ZW50LmRhdGEgPT09IFwic3RyaW5nXCIgJiZcblx0ICAgICAgICAgICAgICAgIGV2ZW50LmRhdGEuaW5kZXhPZihtZXNzYWdlUHJlZml4KSA9PT0gMCkge1xuXHQgICAgICAgICAgICAgICAgcnVuSWZQcmVzZW50KCtldmVudC5kYXRhLnNsaWNlKG1lc3NhZ2VQcmVmaXgubGVuZ3RoKSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgaWYgKGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG5cdCAgICAgICAgICAgIGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBvbkdsb2JhbE1lc3NhZ2UsIGZhbHNlKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBnbG9iYWwuYXR0YWNoRXZlbnQoXCJvbm1lc3NhZ2VcIiwgb25HbG9iYWxNZXNzYWdlKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZWdpc3RlckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuXHQgICAgICAgICAgICBnbG9iYWwucG9zdE1lc3NhZ2UobWVzc2FnZVByZWZpeCArIGhhbmRsZSwgXCIqXCIpO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGluc3RhbGxNZXNzYWdlQ2hhbm5lbEltcGxlbWVudGF0aW9uKCkge1xuXHQgICAgICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG5cdCAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICAgICAgICB2YXIgaGFuZGxlID0gZXZlbnQuZGF0YTtcblx0ICAgICAgICAgICAgcnVuSWZQcmVzZW50KGhhbmRsZSk7XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG5cdCAgICAgICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoaGFuZGxlKTtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBpbnN0YWxsUmVhZHlTdGF0ZUNoYW5nZUltcGxlbWVudGF0aW9uKCkge1xuXHQgICAgICAgIHZhciBodG1sID0gZG9jLmRvY3VtZW50RWxlbWVudDtcblx0ICAgICAgICByZWdpc3RlckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuXHQgICAgICAgICAgICAvLyBDcmVhdGUgYSA8c2NyaXB0PiBlbGVtZW50OyBpdHMgcmVhZHlzdGF0ZWNoYW5nZSBldmVudCB3aWxsIGJlIGZpcmVkIGFzeW5jaHJvbm91c2x5IG9uY2UgaXQgaXMgaW5zZXJ0ZWRcblx0ICAgICAgICAgICAgLy8gaW50byB0aGUgZG9jdW1lbnQuIERvIHNvLCB0aHVzIHF1ZXVpbmcgdXAgdGhlIHRhc2suIFJlbWVtYmVyIHRvIGNsZWFuIHVwIG9uY2UgaXQncyBiZWVuIGNhbGxlZC5cblx0ICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvYy5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuXHQgICAgICAgICAgICBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgcnVuSWZQcmVzZW50KGhhbmRsZSk7XG5cdCAgICAgICAgICAgICAgICBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcblx0ICAgICAgICAgICAgICAgIGh0bWwucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcblx0ICAgICAgICAgICAgICAgIHNjcmlwdCA9IG51bGw7XG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIGh0bWwuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBpbnN0YWxsU2V0VGltZW91dEltcGxlbWVudGF0aW9uKCkge1xuXHQgICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG5cdCAgICAgICAgICAgIHNldFRpbWVvdXQocnVuSWZQcmVzZW50LCAwLCBoYW5kbGUpO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIC8vIElmIHN1cHBvcnRlZCwgd2Ugc2hvdWxkIGF0dGFjaCB0byB0aGUgcHJvdG90eXBlIG9mIGdsb2JhbCwgc2luY2UgdGhhdCBpcyB3aGVyZSBzZXRUaW1lb3V0IGV0IGFsLiBsaXZlLlxuXHQgICAgdmFyIGF0dGFjaFRvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihnbG9iYWwpO1xuXHQgICAgYXR0YWNoVG8gPSBhdHRhY2hUbyAmJiBhdHRhY2hUby5zZXRUaW1lb3V0ID8gYXR0YWNoVG8gOiBnbG9iYWw7XG5cblx0ICAgIC8vIERvbid0IGdldCBmb29sZWQgYnkgZS5nLiBicm93c2VyaWZ5IGVudmlyb25tZW50cy5cblx0ICAgIGlmICh7fS50b1N0cmluZy5jYWxsKGdsb2JhbC5wcm9jZXNzKSA9PT0gXCJbb2JqZWN0IHByb2Nlc3NdXCIpIHtcblx0ICAgICAgICAvLyBGb3IgTm9kZS5qcyBiZWZvcmUgMC45XG5cdCAgICAgICAgaW5zdGFsbE5leHRUaWNrSW1wbGVtZW50YXRpb24oKTtcblxuXHQgICAgfSBlbHNlIGlmIChjYW5Vc2VQb3N0TWVzc2FnZSgpKSB7XG5cdCAgICAgICAgLy8gRm9yIG5vbi1JRTEwIG1vZGVybiBicm93c2Vyc1xuXHQgICAgICAgIGluc3RhbGxQb3N0TWVzc2FnZUltcGxlbWVudGF0aW9uKCk7XG5cblx0ICAgIH0gZWxzZSBpZiAoZ2xvYmFsLk1lc3NhZ2VDaGFubmVsKSB7XG5cdCAgICAgICAgLy8gRm9yIHdlYiB3b3JrZXJzLCB3aGVyZSBzdXBwb3J0ZWRcblx0ICAgICAgICBpbnN0YWxsTWVzc2FnZUNoYW5uZWxJbXBsZW1lbnRhdGlvbigpO1xuXG5cdCAgICB9IGVsc2UgaWYgKGRvYyAmJiBcIm9ucmVhZHlzdGF0ZWNoYW5nZVwiIGluIGRvYy5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpKSB7XG5cdCAgICAgICAgLy8gRm9yIElFIDbigJM4XG5cdCAgICAgICAgaW5zdGFsbFJlYWR5U3RhdGVDaGFuZ2VJbXBsZW1lbnRhdGlvbigpO1xuXG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIC8vIEZvciBvbGRlciBicm93c2Vyc1xuXHQgICAgICAgIGluc3RhbGxTZXRUaW1lb3V0SW1wbGVtZW50YXRpb24oKTtcblx0ICAgIH1cblxuXHQgICAgYXR0YWNoVG8uc2V0SW1tZWRpYXRlID0gc2V0SW1tZWRpYXRlO1xuXHQgICAgYXR0YWNoVG8uY2xlYXJJbW1lZGlhdGUgPSBjbGVhckltbWVkaWF0ZTtcblx0fSh0eXBlb2Ygc2VsZiA9PT0gXCJ1bmRlZmluZWRcIiA/IHR5cGVvZiBnbG9iYWwgPT09IFwidW5kZWZpbmVkXCIgPyB0aGlzIDogZ2xvYmFsIDogc2VsZikpO1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqL30uY2FsbChleHBvcnRzLCAoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KCkpLCBfX3dlYnBhY2tfcmVxdWlyZV9fKDEzKSkpXG5cbi8qKiovIH0pLFxuLyogMTMgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHRcblxuLyoqKi8gfSksXG4vKiAxNCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgTG9hZGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygxNSk7XG5cblx0dmFyIFByZWNvbXBpbGVkTG9hZGVyID0gTG9hZGVyLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbihjb21waWxlZFRlbXBsYXRlcykge1xuXHQgICAgICAgIHRoaXMucHJlY29tcGlsZWQgPSBjb21waWxlZFRlbXBsYXRlcyB8fCB7fTtcblx0ICAgIH0sXG5cblx0ICAgIGdldFNvdXJjZTogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIGlmICh0aGlzLnByZWNvbXBpbGVkW25hbWVdKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB7XG5cdCAgICAgICAgICAgICAgICBzcmM6IHsgdHlwZTogJ2NvZGUnLFxuXHQgICAgICAgICAgICAgICAgICAgICAgIG9iajogdGhpcy5wcmVjb21waWxlZFtuYW1lXSB9LFxuXHQgICAgICAgICAgICAgICAgcGF0aDogbmFtZVxuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gbnVsbDtcblx0ICAgIH1cblx0fSk7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBQcmVjb21waWxlZExvYWRlcjtcblxuXG4vKioqLyB9KSxcbi8qIDE1ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBwYXRoID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIE9iaiA9IF9fd2VicGFja19yZXF1aXJlX18oNik7XG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXG5cdHZhciBMb2FkZXIgPSBPYmouZXh0ZW5kKHtcblx0ICAgIG9uOiBmdW5jdGlvbihuYW1lLCBmdW5jKSB7XG5cdCAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycyB8fCB7fTtcblx0ICAgICAgICB0aGlzLmxpc3RlbmVyc1tuYW1lXSA9IHRoaXMubGlzdGVuZXJzW25hbWVdIHx8IFtdO1xuXHQgICAgICAgIHRoaXMubGlzdGVuZXJzW25hbWVdLnB1c2goZnVuYyk7XG5cdCAgICB9LFxuXG5cdCAgICBlbWl0OiBmdW5jdGlvbihuYW1lIC8qLCBhcmcxLCBhcmcyLCAuLi4qLykge1xuXHQgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuXHQgICAgICAgIGlmKHRoaXMubGlzdGVuZXJzICYmIHRoaXMubGlzdGVuZXJzW25hbWVdKSB7XG5cdCAgICAgICAgICAgIGxpYi5lYWNoKHRoaXMubGlzdGVuZXJzW25hbWVdLCBmdW5jdGlvbihsaXN0ZW5lcikge1xuXHQgICAgICAgICAgICAgICAgbGlzdGVuZXIuYXBwbHkobnVsbCwgYXJncyk7XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIHJlc29sdmU6IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG5cdCAgICAgICAgcmV0dXJuIHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoZnJvbSksIHRvKTtcblx0ICAgIH0sXG5cblx0ICAgIGlzUmVsYXRpdmU6IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG5cdCAgICAgICAgcmV0dXJuIChmaWxlbmFtZS5pbmRleE9mKCcuLycpID09PSAwIHx8IGZpbGVuYW1lLmluZGV4T2YoJy4uLycpID09PSAwKTtcblx0ICAgIH1cblx0fSk7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBMb2FkZXI7XG5cblxuLyoqKi8gfSksXG4vKiAxNiAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdGZ1bmN0aW9uIGluc3RhbGxDb21wYXQoKSB7XG5cdCAgICAndXNlIHN0cmljdCc7XG5cblx0ICAgIC8vIFRoaXMgbXVzdCBiZSBjYWxsZWQgbGlrZSBgbnVuanVja3MuaW5zdGFsbENvbXBhdGAgc28gdGhhdCBgdGhpc2Bcblx0ICAgIC8vIHJlZmVyZW5jZXMgdGhlIG51bmp1Y2tzIGluc3RhbmNlXG5cdCAgICB2YXIgcnVudGltZSA9IHRoaXMucnVudGltZTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cdCAgICB2YXIgbGliID0gdGhpcy5saWI7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgICAgdmFyIENvbXBpbGVyID0gdGhpcy5jb21waWxlci5Db21waWxlcjsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cdCAgICB2YXIgUGFyc2VyID0gdGhpcy5wYXJzZXIuUGFyc2VyOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgIHZhciBub2RlcyA9IHRoaXMubm9kZXM7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgICAgdmFyIGxleGVyID0gdGhpcy5sZXhlcjsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cblx0ICAgIHZhciBvcmlnX2NvbnRleHRPckZyYW1lTG9va3VwID0gcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cDtcblx0ICAgIHZhciBvcmlnX0NvbXBpbGVyX2Fzc2VydFR5cGUgPSBDb21waWxlci5wcm90b3R5cGUuYXNzZXJ0VHlwZTtcblx0ICAgIHZhciBvcmlnX1BhcnNlcl9wYXJzZUFnZ3JlZ2F0ZSA9IFBhcnNlci5wcm90b3R5cGUucGFyc2VBZ2dyZWdhdGU7XG5cdCAgICB2YXIgb3JpZ19tZW1iZXJMb29rdXAgPSBydW50aW1lLm1lbWJlckxvb2t1cDtcblxuXHQgICAgZnVuY3Rpb24gdW5pbnN0YWxsKCkge1xuXHQgICAgICAgIHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAgPSBvcmlnX2NvbnRleHRPckZyYW1lTG9va3VwO1xuXHQgICAgICAgIENvbXBpbGVyLnByb3RvdHlwZS5hc3NlcnRUeXBlID0gb3JpZ19Db21waWxlcl9hc3NlcnRUeXBlO1xuXHQgICAgICAgIFBhcnNlci5wcm90b3R5cGUucGFyc2VBZ2dyZWdhdGUgPSBvcmlnX1BhcnNlcl9wYXJzZUFnZ3JlZ2F0ZTtcblx0ICAgICAgICBydW50aW1lLm1lbWJlckxvb2t1cCA9IG9yaWdfbWVtYmVyTG9va3VwO1xuXHQgICAgfVxuXG5cdCAgICBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwID0gZnVuY3Rpb24oY29udGV4dCwgZnJhbWUsIGtleSkge1xuXHQgICAgICAgIHZhciB2YWwgPSBvcmlnX2NvbnRleHRPckZyYW1lTG9va3VwLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHN3aXRjaCAoa2V5KSB7XG5cdCAgICAgICAgICAgIGNhc2UgJ1RydWUnOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICAgICAgICAgIGNhc2UgJ0ZhbHNlJzpcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICAgICAgY2FzZSAnTm9uZSc6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICB9O1xuXG5cdCAgICB2YXIgU2xpY2UgPSBub2Rlcy5Ob2RlLmV4dGVuZCgnU2xpY2UnLCB7XG5cdCAgICAgICAgZmllbGRzOiBbJ3N0YXJ0JywgJ3N0b3AnLCAnc3RlcCddLFxuXHQgICAgICAgIGluaXQ6IGZ1bmN0aW9uKGxpbmVubywgY29sbm8sIHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG5cdCAgICAgICAgICAgIHN0YXJ0ID0gc3RhcnQgfHwgbmV3IG5vZGVzLkxpdGVyYWwobGluZW5vLCBjb2xubywgbnVsbCk7XG5cdCAgICAgICAgICAgIHN0b3AgPSBzdG9wIHx8IG5ldyBub2Rlcy5MaXRlcmFsKGxpbmVubywgY29sbm8sIG51bGwpO1xuXHQgICAgICAgICAgICBzdGVwID0gc3RlcCB8fCBuZXcgbm9kZXMuTGl0ZXJhbChsaW5lbm8sIGNvbG5vLCAxKTtcblx0ICAgICAgICAgICAgdGhpcy5wYXJlbnQobGluZW5vLCBjb2xubywgc3RhcnQsIHN0b3AsIHN0ZXApO1xuXHQgICAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICBDb21waWxlci5wcm90b3R5cGUuYXNzZXJ0VHlwZSA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0ICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIFNsaWNlKSB7XG5cdCAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIG9yaWdfQ29tcGlsZXJfYXNzZXJ0VHlwZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgfTtcblx0ICAgIENvbXBpbGVyLnByb3RvdHlwZS5jb21waWxlU2xpY2UgPSBmdW5jdGlvbihub2RlLCBmcmFtZSkge1xuXHQgICAgICAgIHRoaXMuZW1pdCgnKCcpO1xuXHQgICAgICAgIHRoaXMuX2NvbXBpbGVFeHByZXNzaW9uKG5vZGUuc3RhcnQsIGZyYW1lKTtcblx0ICAgICAgICB0aGlzLmVtaXQoJyksKCcpO1xuXHQgICAgICAgIHRoaXMuX2NvbXBpbGVFeHByZXNzaW9uKG5vZGUuc3RvcCwgZnJhbWUpO1xuXHQgICAgICAgIHRoaXMuZW1pdCgnKSwoJyk7XG5cdCAgICAgICAgdGhpcy5fY29tcGlsZUV4cHJlc3Npb24obm9kZS5zdGVwLCBmcmFtZSk7XG5cdCAgICAgICAgdGhpcy5lbWl0KCcpJyk7XG5cdCAgICB9O1xuXG5cdCAgICBmdW5jdGlvbiBnZXRUb2tlbnNTdGF0ZSh0b2tlbnMpIHtcblx0ICAgICAgICByZXR1cm4ge1xuXHQgICAgICAgICAgICBpbmRleDogdG9rZW5zLmluZGV4LFxuXHQgICAgICAgICAgICBsaW5lbm86IHRva2Vucy5saW5lbm8sXG5cdCAgICAgICAgICAgIGNvbG5vOiB0b2tlbnMuY29sbm9cblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICBQYXJzZXIucHJvdG90eXBlLnBhcnNlQWdncmVnYXRlID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXHQgICAgICAgIHZhciBvcmlnU3RhdGUgPSBnZXRUb2tlbnNTdGF0ZSh0aGlzLnRva2Vucyk7XG5cdCAgICAgICAgLy8gU2V0IGJhY2sgb25lIGFjY291bnRpbmcgZm9yIG9wZW5pbmcgYnJhY2tldC9wYXJlbnNcblx0ICAgICAgICBvcmlnU3RhdGUuY29sbm8tLTtcblx0ICAgICAgICBvcmlnU3RhdGUuaW5kZXgtLTtcblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICByZXR1cm4gb3JpZ19QYXJzZXJfcGFyc2VBZ2dyZWdhdGUuYXBwbHkodGhpcyk7XG5cdCAgICAgICAgfSBjYXRjaChlKSB7XG5cdCAgICAgICAgICAgIHZhciBlcnJTdGF0ZSA9IGdldFRva2Vuc1N0YXRlKHRoaXMudG9rZW5zKTtcblx0ICAgICAgICAgICAgdmFyIHJldGhyb3cgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICAgIGxpYi5leHRlbmQoc2VsZi50b2tlbnMsIGVyclN0YXRlKTtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBlO1xuXHQgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgIC8vIFJlc2V0IHRvIHN0YXRlIGJlZm9yZSBvcmlnaW5hbCBwYXJzZUFnZ3JlZ2F0ZSBjYWxsZWRcblx0ICAgICAgICAgICAgbGliLmV4dGVuZCh0aGlzLnRva2Vucywgb3JpZ1N0YXRlKTtcblx0ICAgICAgICAgICAgdGhpcy5wZWVrZWQgPSBmYWxzZTtcblxuXHQgICAgICAgICAgICB2YXIgdG9rID0gdGhpcy5wZWVrVG9rZW4oKTtcblx0ICAgICAgICAgICAgaWYgKHRvay50eXBlICE9PSBsZXhlci5UT0tFTl9MRUZUX0JSQUNLRVQpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IHJldGhyb3coKTtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB2YXIgbm9kZSA9IG5ldyBTbGljZSh0b2subGluZW5vLCB0b2suY29sbm8pO1xuXG5cdCAgICAgICAgICAgIC8vIElmIHdlIGRvbid0IGVuY291bnRlciBhIGNvbG9uIHdoaWxlIHBhcnNpbmcsIHRoaXMgaXMgbm90IGEgc2xpY2UsXG5cdCAgICAgICAgICAgIC8vIHNvIHJlLXJhaXNlIHRoZSBvcmlnaW5hbCBleGNlcHRpb24uXG5cdCAgICAgICAgICAgIHZhciBpc1NsaWNlID0gZmFsc2U7XG5cblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbm9kZS5maWVsZHMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIGlmICh0aGlzLnNraXAobGV4ZXIuVE9LRU5fUklHSFRfQlJBQ0tFVCkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGlmIChpID09PSBub2RlLmZpZWxkcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAoaXNTbGljZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZhaWwoJ3BhcnNlU2xpY2U6IHRvbyBtYW55IHNsaWNlIGNvbXBvbmVudHMnLCB0b2subGluZW5vLCB0b2suY29sbm8pO1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGlmICh0aGlzLnNraXAobGV4ZXIuVE9LRU5fQ09MT04pKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaXNTbGljZSA9IHRydWU7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBmaWVsZCA9IG5vZGUuZmllbGRzW2ldO1xuXHQgICAgICAgICAgICAgICAgICAgIG5vZGVbZmllbGRdID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblx0ICAgICAgICAgICAgICAgICAgICBpc1NsaWNlID0gdGhpcy5za2lwKGxleGVyLlRPS0VOX0NPTE9OKSB8fCBpc1NsaWNlO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmICghaXNTbGljZSkge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgcmV0aHJvdygpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQXJyYXkodG9rLmxpbmVubywgdG9rLmNvbG5vLCBbbm9kZV0pO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgIGZ1bmN0aW9uIHNsaWNlTG9va3VwKG9iaiwgc3RhcnQsIHN0b3AsIHN0ZXApIHtcblx0ICAgICAgICBvYmogPSBvYmogfHwgW107XG5cdCAgICAgICAgaWYgKHN0YXJ0ID09PSBudWxsKSB7XG5cdCAgICAgICAgICAgIHN0YXJ0ID0gKHN0ZXAgPCAwKSA/IChvYmoubGVuZ3RoIC0gMSkgOiAwO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBpZiAoc3RvcCA9PT0gbnVsbCkge1xuXHQgICAgICAgICAgICBzdG9wID0gKHN0ZXAgPCAwKSA/IC0xIDogb2JqLmxlbmd0aDtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBpZiAoc3RvcCA8IDApIHtcblx0ICAgICAgICAgICAgICAgIHN0b3AgKz0gb2JqLmxlbmd0aDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChzdGFydCA8IDApIHtcblx0ICAgICAgICAgICAgc3RhcnQgKz0gb2JqLmxlbmd0aDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXG5cdCAgICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0OyA7IGkgKz0gc3RlcCkge1xuXHQgICAgICAgICAgICBpZiAoaSA8IDAgfHwgaSA+IG9iai5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmIChzdGVwID4gMCAmJiBpID49IHN0b3ApIHtcblx0ICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmIChzdGVwIDwgMCAmJiBpIDw9IHN0b3ApIHtcblx0ICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJlc3VsdHMucHVzaChydW50aW1lLm1lbWJlckxvb2t1cChvYmosIGkpKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG5cdCAgICB9XG5cblx0ICAgIHZhciBBUlJBWV9NRU1CRVJTID0ge1xuXHQgICAgICAgIHBvcDogZnVuY3Rpb24oaW5kZXgpIHtcblx0ICAgICAgICAgICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBvcCgpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmIChpbmRleCA+PSB0aGlzLmxlbmd0aCB8fCBpbmRleCA8IDApIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignS2V5RXJyb3InKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgYXBwZW5kOiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGVsZW1lbnQpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGxpY2UoaSwgMSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZUVycm9yJyk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBjb3VudDogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICAgICAgICB2YXIgY291bnQgPSAwO1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIGlmICh0aGlzW2ldID09PSBlbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgY291bnQrKztcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gY291bnQ7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBpbmRleDogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICAgICAgICB2YXIgaTtcblx0ICAgICAgICAgICAgaWYgKChpID0gdGhpcy5pbmRleE9mKGVsZW1lbnQpKSA9PT0gLTEpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsdWVFcnJvcicpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgZmluZDogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKGVsZW1lbnQpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgaW5zZXJ0OiBmdW5jdGlvbihpbmRleCwgZWxlbSkge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGxpY2UoaW5kZXgsIDAsIGVsZW0pO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cdCAgICB2YXIgT0JKRUNUX01FTUJFUlMgPSB7XG5cdCAgICAgICAgaXRlbXM6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICB2YXIgcmV0ID0gW107XG5cdCAgICAgICAgICAgIGZvcih2YXIgayBpbiB0aGlzKSB7XG5cdCAgICAgICAgICAgICAgICByZXQucHVzaChbaywgdGhpc1trXV0pO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiByZXQ7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICB2YWx1ZXM6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICB2YXIgcmV0ID0gW107XG5cdCAgICAgICAgICAgIGZvcih2YXIgayBpbiB0aGlzKSB7XG5cdCAgICAgICAgICAgICAgICByZXQucHVzaCh0aGlzW2tdKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gcmV0O1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAga2V5czogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHZhciByZXQgPSBbXTtcblx0ICAgICAgICAgICAgZm9yKHZhciBrIGluIHRoaXMpIHtcblx0ICAgICAgICAgICAgICAgIHJldC5wdXNoKGspO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiByZXQ7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleSwgZGVmKSB7XG5cdCAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzW2tleV07XG5cdCAgICAgICAgICAgIGlmIChvdXRwdXQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgb3V0cHV0ID0gZGVmO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBoYXNfa2V5OiBmdW5jdGlvbihrZXkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFzT3duUHJvcGVydHkoa2V5KTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIHBvcDogZnVuY3Rpb24oa2V5LCBkZWYpIHtcblx0ICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXNba2V5XTtcblx0ICAgICAgICAgICAgaWYgKG91dHB1dCA9PT0gdW5kZWZpbmVkICYmIGRlZiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICBvdXRwdXQgPSBkZWY7XG5cdCAgICAgICAgICAgIH0gZWxzZSBpZiAob3V0cHV0ID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignS2V5RXJyb3InKTtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzW2tleV07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIHBvcGl0ZW06IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBrIGluIHRoaXMpIHtcblx0ICAgICAgICAgICAgICAgIC8vIFJldHVybiB0aGUgZmlyc3Qgb2JqZWN0IHBhaXIuXG5cdCAgICAgICAgICAgICAgICB2YXIgdmFsID0gdGhpc1trXTtcblx0ICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzW2tdO1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIFtrLCB2YWxdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignS2V5RXJyb3InKTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIHNldGRlZmF1bHQ6IGZ1bmN0aW9uKGtleSwgZGVmKSB7XG5cdCAgICAgICAgICAgIGlmIChrZXkgaW4gdGhpcykge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNba2V5XTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZiAoZGVmID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIGRlZiA9IG51bGw7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXNba2V5XSA9IGRlZjtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oa3dhcmdzKSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGsgaW4ga3dhcmdzKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzW2tdID0ga3dhcmdzW2tdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBudWxsOyAgICAvLyBBbHdheXMgcmV0dXJucyBOb25lXG5cdCAgICAgICAgfVxuXHQgICAgfTtcblx0ICAgIE9CSkVDVF9NRU1CRVJTLml0ZXJpdGVtcyA9IE9CSkVDVF9NRU1CRVJTLml0ZW1zO1xuXHQgICAgT0JKRUNUX01FTUJFUlMuaXRlcnZhbHVlcyA9IE9CSkVDVF9NRU1CRVJTLnZhbHVlcztcblx0ICAgIE9CSkVDVF9NRU1CRVJTLml0ZXJrZXlzID0gT0JKRUNUX01FTUJFUlMua2V5cztcblx0ICAgIHJ1bnRpbWUubWVtYmVyTG9va3VwID0gZnVuY3Rpb24ob2JqLCB2YWwsIGF1dG9lc2NhcGUpIHsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cdCAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHNsaWNlTG9va3VwLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIG9iaiA9IG9iaiB8fCB7fTtcblxuXHQgICAgICAgIC8vIElmIHRoZSBvYmplY3QgaXMgYW4gb2JqZWN0LCByZXR1cm4gYW55IG9mIHRoZSBtZXRob2RzIHRoYXQgUHl0aG9uIHdvdWxkXG5cdCAgICAgICAgLy8gb3RoZXJ3aXNlIHByb3ZpZGUuXG5cdCAgICAgICAgaWYgKGxpYi5pc0FycmF5KG9iaikgJiYgQVJSQVlfTUVNQkVSUy5oYXNPd25Qcm9wZXJ0eSh2YWwpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtyZXR1cm4gQVJSQVlfTUVNQkVSU1t2YWxdLmFwcGx5KG9iaiwgYXJndW1lbnRzKTt9O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChsaWIuaXNPYmplY3Qob2JqKSAmJiBPQkpFQ1RfTUVNQkVSUy5oYXNPd25Qcm9wZXJ0eSh2YWwpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtyZXR1cm4gT0JKRUNUX01FTUJFUlNbdmFsXS5hcHBseShvYmosIGFyZ3VtZW50cyk7fTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gb3JpZ19tZW1iZXJMb29rdXAuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgIH07XG5cblx0ICAgIHJldHVybiB1bmluc3RhbGw7XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IGluc3RhbGxDb21wYXQ7XG5cblxuLyoqKi8gfSlcbi8qKioqKiovIF0pXG59KTtcbjsiLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImh0bWxcIikpIHtcbm91dHB1dCArPSBcIlxcbjxkaXYgY2xhc3M9XFxcIml0ZW0tLWVtYmVkX19lbGVtZW50XFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9kaXY+XFxuXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cIjtcbmlmKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGl0bGVcIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImRlc2NyaXB0aW9uXCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjcmVkaXRcIikgfHwgKCFydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGh1bWJuYWlsX3VybFwiKSkpKSB7XG5vdXRwdXQgKz0gXCJcXG48YXJ0aWNsZSBjbGFzcz1cXFwiaXRlbS0tZW1iZWQgaXRlbS0tZW1iZWRfX3dyYXBwZXJcXFwiPlxcbiAgICBcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGh1bWJuYWlsX3VybFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxhIGhyZWY9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiIGNsYXNzPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJkZXNjcmlwdGlvblwiKT9cIml0ZW0tLWVtYmVkX19pbGx1c3RyYXRpb25cIjpcIml0ZW0tLWVtYmVkX19vbmx5LWlsbHVzdHJhdGlvblwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgICAgICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGh1bWJuYWlsX3VybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiLz5cXG4gICA8L2E+XFxuICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aXRsZVwiKSB8fCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiZGVzY3JpcHRpb25cIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX2luZm9cXFwiPlxcbiAgICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGl0bGVcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX3RpdGxlXFxcIj5cXG4gICAgICAgICAgICA8YSBocmVmPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInVybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIiB0aXRsZT1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aXRsZVwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGl0bGVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9hPlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiZGVzY3JpcHRpb25cIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX2Rlc2NyaXB0aW9uXFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImRlc2NyaXB0aW9uXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcbiAgICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpdGVtLS1lbWJlZF9fY3JlZGl0XFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIDwvZGl2PlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbjwvYXJ0aWNsZT5cXG5cIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG5vdXRwdXQgKz0gXCI8ZmlndXJlPlxcbiAgPGltZyBcXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwiYWN0aXZlXCIpKSB7XG5vdXRwdXQgKz0gXCJjbGFzcz1cXFwiYWN0aXZlXFxcIlwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcInRodW1ibmFpbFwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCJcXG4gICAgc3Jjc2V0PVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwiYmFzZUltYWdlXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDgxMHcsIFxcbiAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwidGh1bWJuYWlsXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDI0MHcsIFxcbiAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwidmlld0ltYWdlXCIpKSxcImhyZWZcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIDU0MHdcXFwiIFxcbiAgICBhbHQ9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY2FwdGlvblwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgPGZpZ2NhcHRpb24+XFxuICAgIDxzcGFuIG5nLWlmPVxcXCJyZWYuaXRlbS5tZXRhLmNhcHRpb25cXFwiIGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cXG4gICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNhcHRpb25cIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgIDwvc3Bhbj4mbmJzcDtcXG4gICAgPHNwYW4gbmctaWY9XFxcInJlZi5pdGVtLm1ldGEuY3JlZGl0XFxcIiBjbGFzcz1cXFwiY3JlZGl0XFxcIj5cXG4gICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgPC9zcGFuPlxcbiAgPC9maWdjYXB0aW9uPlxcbjwvZmlndXJlPlxcblxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLXBvc3QuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG5vdXRwdXQgKz0gXCI8IS0tIHN0aWNreSBwb3NpdGlvbiB0b2dnbGUgLS0+XFxuXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInN0aWNreVwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzdGlja3lQb3NpdGlvblwiKSA9PSBcInRvcFwiKSB7XG5vdXRwdXQgKz0gXCJcXG48YXJ0aWNsZVxcbiAgY2xhc3M9XFxcImxiLXN0aWNreS10b3AtcG9zdCBsaXN0LWdyb3VwLWl0ZW0gXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93R2FsbGVyeVwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpKSwwKSksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcImltYWdlXCIgJiYgZW52LmdldEZpbHRlcihcImxlbmd0aFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJncm91cHNcIikpLDEpKSxcInJlZnNcIikpID4gMSkge1xub3V0cHV0ICs9IFwic2xpZGVzaG93XCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiXFxuICBkYXRhLWpzLXBvc3QtaWQ9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcIl9pZFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbjxhcnRpY2xlXFxuICBjbGFzcz1cXFwibGItcG9zdCBsaXN0LWdyb3VwLWl0ZW0gc2hvdy1hdXRob3ItYXZhdGFyIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0dhbGxlcnlcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcImdyb3Vwc1wiKSksMSkpLFwicmVmc1wiKSksMCkpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJpbWFnZVwiICYmIGVudi5nZXRGaWx0ZXIoXCJsZW5ndGhcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpKSA+IDEpIHtcbm91dHB1dCArPSBcInNsaWRlc2hvd1wiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxcIlxcbiAgZGF0YS1qcy1wb3N0LWlkPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfaWRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJzdGlja3lcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJsYi10eXBlXFxcIj48L2Rpdj5cXG4gIFwiO1xuO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcImxiX2hpZ2hsaWdodFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLXR5cGUgbGItcG9zdC1oaWdobGlnaHRlZFxcXCI+PC9kaXY+XFxuICBcIjtcbjtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLXR5cGUgbGItdHlwZS0tdGV4dFxcXCI+PC9kaXY+XFxuICBcIjtcbjtcbn1cbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgPGRpdiBjbGFzcz1cXFwibGItcG9zdC1kYXRlXFxcIiBkYXRhLWpzLXRpbWVzdGFtcD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiX3VwZGF0ZWRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfdXBkYXRlZFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cXG5cXG4gIDwhLS0gYXV0aG9yIHBsdXMgYXZhdGFyIC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yXFxcIj5cXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93QXV0aG9yXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicHVibGlzaGVyXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJsYi1hdXRob3JfX25hbWVcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJwdWJsaXNoZXJcIikpLFwiZGlzcGxheV9uYW1lXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0F1dGhvckF2YXRhclwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInB1Ymxpc2hlclwiKSksXCJwaWN0dXJlX3VybFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8aW1nIGNsYXNzPVxcXCJsYi1hdXRob3JfX2F2YXRhclxcXCIgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicHVibGlzaGVyXCIpKSxcInBpY3R1cmVfdXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgLz5cXG4gICAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImxiLWF1dGhvcl9fYXZhdGFyXFxcIj48L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwvZGl2PlxcbiAgPCEtLSBlbmQgYXV0aG9yIC0tPlxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwhLS0gZW5kIHN0aWNreSBwb3NpdGlvbiB0b2dnbGUgLS0+XFxuXFxuICA8IS0tIGl0ZW0gc3RhcnQgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJpdGVtcy1jb250YWluZXJcXFwiPlxcbiAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMyA9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJncm91cHNcIikpLDEpKSxcInJlZnNcIik7XG5pZih0XzMpIHt2YXIgdF8yID0gdF8zLmxlbmd0aDtcbmZvcih2YXIgdF8xPTA7IHRfMSA8IHRfMy5sZW5ndGg7IHRfMSsrKSB7XG52YXIgdF80ID0gdF8zW3RfMV07XG5mcmFtZS5zZXQoXCJyZWZcIiwgdF80KTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF8xICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzIgLSB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF8yIC0gdF8xIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfMSA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF8xID09PSB0XzIgLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfMik7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwiaW1hZ2VcIikge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPGRpdiBjbGFzcz1cXFwiXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJzdGlja3lcIikgfHwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic3RpY2t5UG9zaXRpb25cIikgPT0gXCJib3R0b21cIikge1xub3V0cHV0ICs9IFwibGItaXRlbVwiO1xuO1xufVxub3V0cHV0ICs9IFwiIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcIm9yaWdpbmFsXCIpKSxcImhlaWdodFwiKSA+IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJvcmlnaW5hbFwiKSksXCJ3aWR0aFwiKSkge1xub3V0cHV0ICs9IFwicG9ydHJhaXRcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCI+XFxuICAgICAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcIlwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwic3RpY2t5XCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwiYm90dG9tXCIpIHtcbm91dHB1dCArPSBcImxiLWl0ZW1cIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCI+XFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJlbWJlZFwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzcsdF81KSB7XG5pZih0XzcpIHsgY2IodF83KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzgsdF82KSB7XG5pZih0XzgpIHsgY2IodF84KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJpbWFnZVwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzExLHRfOSkge1xuaWYodF8xMSkgeyBjYih0XzExKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfOSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzEyLHRfMTApIHtcbmlmKHRfMTIpIHsgY2IodF8xMik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzEwKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbn0pO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcInF1b3RlXCIpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1pdGVtLXF1b3RlLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMTUsdF8xMykge1xuaWYodF8xNSkgeyBjYih0XzE1KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTMpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8xNix0XzE0KSB7XG5pZih0XzE2KSB7IGNiKHRfMTYpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xNCk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIDxhcnRpY2xlPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwidGV4dFwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9hcnRpY2xlPlxcbiAgICAgICAgXCI7XG47XG59XG47XG59XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8L2Rpdj5cXG4gICAgXCI7XG47XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICA8L2Rpdj5cXG4gIDwhLS0gaXRlbSBlbmQgLS0+XFxuXFxuPC9hcnRpY2xlPlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLXNsaWRlc2hvdy5odG1sXCJdID0gKGZ1bmN0aW9uKCkge1xuZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIHBhcmVudFRlbXBsYXRlID0gbnVsbDtcbm91dHB1dCArPSBcIjxkaXYgaWQ9XFxcInNsaWRlc2hvd1xcXCI+XFxuICA8ZGl2IGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcbiAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMyA9IHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmc1wiKTtcbmlmKHRfMykge3ZhciB0XzIgPSB0XzMubGVuZ3RoO1xuZm9yKHZhciB0XzE9MDsgdF8xIDwgdF8zLmxlbmd0aDsgdF8xKyspIHtcbnZhciB0XzQgPSB0XzNbdF8xXTtcbmZyYW1lLnNldChcInJlZlwiLCB0XzQpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleFwiLCB0XzEgKyAxKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXgwXCIsIHRfMSk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4XCIsIHRfMiAtIHRfMSk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4MFwiLCB0XzIgLSB0XzEgLSAxKTtcbmZyYW1lLnNldChcImxvb3AuZmlyc3RcIiwgdF8xID09PSAwKTtcbmZyYW1lLnNldChcImxvb3AubGFzdFwiLCB0XzEgPT09IHRfMiAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5sZW5ndGhcIiwgdF8yKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzcsdF81KSB7XG5pZih0XzcpIHsgY2IodF83KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzgsdF82KSB7XG5pZih0XzgpIHsgY2IodF84KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfNik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbn0pO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgPC9kaXY+XFxuICA8YnV0dG9uIGNsYXNzPVxcXCJmdWxsc2NyZWVuXFxcIj5GdWxsc2NyZWVuPC9idXR0b24+XFxuICA8YnV0dG9uIGNsYXNzPVxcXCJhcnJvd3MgcHJldlxcXCI+Jmx0OzwvYnV0dG9uPlxcbiAgPGJ1dHRvbiBjbGFzcz1cXFwiYXJyb3dzIG5leHRcXFwiPiZndDs8L2J1dHRvbj5cXG48L2Rpdj5cXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xuKHBhcmVudFRlbXBsYXRlID8gZnVuY3Rpb24oZSwgYywgZiwgciwgY2IpIHsgY2IoXCJcIik7IH0gOiBjb250ZXh0LmdldEJsb2NrKFwidGltZWxpbmVcIikpKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGZ1bmN0aW9uKHRfMix0XzEpIHtcbmlmKHRfMikgeyBjYih0XzIpOyByZXR1cm47IH1cbm91dHB1dCArPSB0XzE7XG5vdXRwdXQgKz0gXCJcXG5cXG5cIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1lbWJlZC1wcm92aWRlcnMuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfNSx0XzMpIHtcbmlmKHRfNSkgeyBjYih0XzUpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8zKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfNix0XzQpIHtcbmlmKHRfNikgeyBjYih0XzYpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF80KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuXFxuXCI7XG5pZihydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImluY2x1ZGVfanNfb3B0aW9uc1wiKSkge1xub3V0cHV0ICs9IFwiXFxuICA8c2NyaXB0IHR5cGU9XFxcInRleHQvamF2YXNjcmlwdFxcXCI+XFxuICAgIHdpbmRvdy5MQiA9IFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwianNvbl9vcHRpb25zXCIpKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI7XFxuICA8L3NjcmlwdD5cXG5cIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxufSl9KTtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5mdW5jdGlvbiBiX3RpbWVsaW5lKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgZnJhbWUgPSBmcmFtZS5wdXNoKHRydWUpO1xub3V0cHV0ICs9IFwiXFxuPGRpdiBjbGFzcz1cXFwibGItdGltZWxpbmUgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcImxhbmd1YWdlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dUaXRsZVwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcInRpdGxlXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGgxPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcInRpdGxlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvaDE+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93RGVzY3JpcHRpb25cIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJkZXNjcmlwdGlvblwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImRlc2NyaXB0aW9uXFxcIj5cXG4gICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcImRlc2NyaXB0aW9uXCIpKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgPC9kaXY+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93SW1hZ2VcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJwaWN0dXJlX3VybFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxpbWcgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJwaWN0dXJlX3VybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiIC8+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzdGlja3lQb3NpdGlvblwiKSA9PSBcInRvcFwiICYmIGVudi5nZXRGaWx0ZXIoXCJsZW5ndGhcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInN0aWNreVBvc3RzXCIpKSxcIl9pdGVtc1wiKSkgPiAwKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGRpdiBjbGFzcz1cXFwidGltZWxpbmUtdG9wIHRpbWVsaW5lLXRvcC0tbG9hZGVkXFxcIj5cXG4gICAgICA8c2VjdGlvbiBjbGFzcz1cXFwibGItcG9zdHMgbGlzdC1ncm91cFxcXCI+XFxuICAgICAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfOSA9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwic3RpY2t5UG9zdHNcIikpLFwiX2l0ZW1zXCIpO1xuaWYodF85KSB7dmFyIHRfOCA9IHRfOS5sZW5ndGg7XG5mb3IodmFyIHRfNz0wOyB0XzcgPCB0XzkubGVuZ3RoOyB0XzcrKykge1xudmFyIHRfMTAgPSB0XzlbdF83XTtcbmZyYW1lLnNldChcIml0ZW1cIiwgdF8xMCk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4XCIsIHRfNyArIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleDBcIiwgdF83KTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF84IC0gdF83KTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXgwXCIsIHRfOCAtIHRfNyAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5maXJzdFwiLCB0XzcgPT09IDApO1xuZnJhbWUuc2V0KFwibG9vcC5sYXN0XCIsIHRfNyA9PT0gdF84IC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmxlbmd0aFwiLCB0XzgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzEwKSxcImRlbGV0ZWRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMTMsdF8xMSkge1xuaWYodF8xMykgeyBjYih0XzEzKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTEpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8xNCx0XzEyKSB7XG5pZih0XzE0KSB7IGNiKHRfMTQpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xMik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbn0pO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbjtcbn1cbn1cbmZyYW1lID0gZnJhbWUucG9wKCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8L3NlY3Rpb24+XFxuICAgIDwvZGl2PlxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG4gIDwhLS0gSGVhZGVyIC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwiaGVhZGVyLWJhclxcXCI+XFxuICAgIDxkaXYgY2xhc3M9XFxcInNvcnRpbmctYmFyXFxcIj5cXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJzb3J0aW5nLWJhcl9fb3JkZXJzXFxcIj5cXG4gICAgICAgIDxkaXZcXG4gICAgICAgICAgY2xhc3M9XFxcInNvcnRpbmctYmFyX19vcmRlciBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInBvc3RPcmRlclwiKSA9PSBcImVkaXRvcmlhbFwiKSB7XG5vdXRwdXQgKz0gXCJzb3J0aW5nLWJhcl9fb3JkZXItLWFjdGl2ZVwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxcIlxcbiAgICAgICAgICBkYXRhLWpzLW9yZGVyYnlfZWRpdG9yaWFsPlxcbiAgICAgICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm9wdGlvbnNcIikpLFwibDEwblwiKSksXCJlZGl0b3JpYWxcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDxkaXZcXG4gICAgICAgICAgY2xhc3M9XFxcInNvcnRpbmctYmFyX19vcmRlciBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInBvc3RPcmRlclwiKSA9PSBcIm5ld2VzdF9maXJzdFwiKSB7XG5vdXRwdXQgKz0gXCJzb3J0aW5nLWJhcl9fb3JkZXItLWFjdGl2ZVwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxcIlxcbiAgICAgICAgICBkYXRhLWpzLW9yZGVyYnlfZGVzY2VuZGluZz5cXG4gICAgICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJvcHRpb25zXCIpKSxcImwxMG5cIikpLFwiZGVzY2VuZGluZ1wiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICAgPGRpdlxcbiAgICAgICAgICBjbGFzcz1cXFwic29ydGluZy1iYXJfX29yZGVyIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwicG9zdE9yZGVyXCIpID09IFwib2xkZXN0X2ZpcnN0XCIpIHtcbm91dHB1dCArPSBcInNvcnRpbmctYmFyX19vcmRlci0tYWN0aXZlXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiXFxuICAgICAgICAgIGRhdGEtanMtb3JkZXJieV9hc2NlbmRpbmc+XFxuICAgICAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwib3B0aW9uc1wiKSksXCJsMTBuXCIpKSxcImFzY2VuZGluZ1wiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDwvZGl2PlxcbiAgICAgIDwvZGl2PlxcbiAgICA8L2Rpdj5cXG4gICAgPGRpdiBjbGFzcz1cXFwiaGVhZGVyLWJhcl9fYWN0aW9uc1xcXCI+PC9kaXY+XFxuICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJjYW5Db21tZW50XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxidXR0b24gY2xhc3M9XFxcImhlYWRlci1iYXJfX2NvbW1lbnRcXFwiIGRhdGEtanMtc2hvdy1jb21tZW50LWRpYWxvZz5Db21tZW50PC9idXR0b24+XFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dMaXZlYmxvZ0xvZ29cIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGEgY2xhc3M9XFxcImhlYWRlci1iYXJfX2xvZ29cXFwiIGhyZWY9XFxcImh0dHBzOi8vd3d3LmxpdmVibG9nLnByb1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlxcbiAgICAgICAgICA8c3Bhbj5Qb3dlcmVkIGJ5PC9zcGFuPlxcbiAgICAgICAgICA8aW1nIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXNzZXRzX3Jvb3RcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiaW1hZ2VzL2xiLWxvZ28uc3ZnXFxcIiAvPlxcbiAgICAgICAgPC9hPlxcbiAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIDwvZGl2PlxcbiAgPCEtLSBIZWFkZXIgRW5kIC0tPlxcblxcbiAgPCEtLSBDb21tZW50IC0tPlxcbiAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJjYW5Db21tZW50XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtY29tbWVudC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8xNyx0XzE1KSB7XG5pZih0XzE3KSB7IGNiKHRfMTcpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xNSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzE4LHRfMTYpIHtcbmlmKHRfMTgpIHsgY2IodF8xOCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzE2KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICBcIjtcbn0pO1xufVxub3V0cHV0ICs9IFwiXFxuICA8IS0tIENvbW1lbnQgRW5kIC0tPlxcblxcbiAgPCEtLSBUaW1lbGluZSAtLT5cXG4gIDxkaXYgY2xhc3M9XFxcInRpbWVsaW5lLWJvZHkgdGltZWxpbmUtYm9keS0tbG9hZGVkXFxcIj5cXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzdGlja3lQb3NpdGlvblwiKSA9PSBcImJvdHRvbVwiICYmIGVudi5nZXRGaWx0ZXIoXCJsZW5ndGhcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInN0aWNreVBvc3RzXCIpKSxcIl9pdGVtc1wiKSkgPiAwKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8c2VjdGlvbiBjbGFzcz1cXFwibGItcG9zdHMgbGlzdC1ncm91cCBzdGlja3lcXFwiPlxcbiAgICAgICAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzIxID0gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJzdGlja3lQb3N0c1wiKSksXCJfaXRlbXNcIik7XG5pZih0XzIxKSB7dmFyIHRfMjAgPSB0XzIxLmxlbmd0aDtcbmZvcih2YXIgdF8xOT0wOyB0XzE5IDwgdF8yMS5sZW5ndGg7IHRfMTkrKykge1xudmFyIHRfMjIgPSB0XzIxW3RfMTldO1xuZnJhbWUuc2V0KFwiaXRlbVwiLCB0XzIyKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF8xOSArIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleDBcIiwgdF8xOSk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4XCIsIHRfMjAgLSB0XzE5KTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXgwXCIsIHRfMjAgLSB0XzE5IC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfMTkgPT09IDApO1xuZnJhbWUuc2V0KFwibG9vcC5sYXN0XCIsIHRfMTkgPT09IHRfMjAgLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfMjApO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzIyKSxcImRlbGV0ZWRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMjUsdF8yMykge1xuaWYodF8yNSkgeyBjYih0XzI1KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMjMpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8yNix0XzI0KSB7XG5pZih0XzI2KSB7IGNiKHRfMjYpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8yNCk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbn0pO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbjtcbn1cbn1cbmZyYW1lID0gZnJhbWUucG9wKCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8L3NlY3Rpb24+XFxuICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xuaWYoZW52LmdldEZpbHRlcihcImxlbmd0aFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwicG9zdHNcIikpLFwiX2l0ZW1zXCIpKSA9PSAwKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJsYi1wb3N0IGVtcHR5LW1lc3NhZ2VcXFwiPlxcbiAgICAgICAgPGRpdj5CbG9nIHBvc3RzIGFyZSBub3QgY3VycmVudGx5IGF2YWlsYWJsZS48L2Rpdj5cXG4gICAgICA8L2Rpdj5cXG4gICAgICBcIjtcbjtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPHNlY3Rpb24gY2xhc3M9XFxcImxiLXBvc3RzIGxpc3QtZ3JvdXAgbm9ybWFsXFxcIj5cXG4gICAgICAgIFwiO1xuZnJhbWUgPSBmcmFtZS5wdXNoKCk7XG52YXIgdF8yOSA9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwicG9zdHNcIikpLFwiX2l0ZW1zXCIpO1xuaWYodF8yOSkge3ZhciB0XzI4ID0gdF8yOS5sZW5ndGg7XG5mb3IodmFyIHRfMjc9MDsgdF8yNyA8IHRfMjkubGVuZ3RoOyB0XzI3KyspIHtcbnZhciB0XzMwID0gdF8yOVt0XzI3XTtcbmZyYW1lLnNldChcIml0ZW1cIiwgdF8zMCk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4XCIsIHRfMjcgKyAxKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXgwXCIsIHRfMjcpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzI4IC0gdF8yNyk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4MFwiLCB0XzI4IC0gdF8yNyAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5maXJzdFwiLCB0XzI3ID09PSAwKTtcbmZyYW1lLnNldChcImxvb3AubGFzdFwiLCB0XzI3ID09PSB0XzI4IC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmxlbmd0aFwiLCB0XzI4KTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgodF8zMCksXCJkZWxldGVkXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzMzLHRfMzEpIHtcbmlmKHRfMzMpIHsgY2IodF8zMyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzMxKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMzQsdF8zMikge1xuaWYodF8zNCkgeyBjYih0XzM0KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMzIpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG59KTtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG47XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgPC9zZWN0aW9uPlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwicG9zdHNcIikpLFwiX21ldGFcIikpLFwibWF4X3Jlc3VsdHNcIikgPD0gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwicG9zdHNcIikpLFwiX21ldGFcIikpLFwidG90YWxcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cXFwibGItYnV0dG9uIGxvYWQtbW9yZS1wb3N0c1xcXCIgZGF0YS1qcy1sb2FkbW9yZT5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm9wdGlvbnNcIikpLFwibDEwblwiKSksXCJsb2FkTmV3UG9zdHNcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9idXR0b24+XFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwvZGl2PlxcbiAgPCEtLSBUaW1lbGluZSBFbmQgLS0+XFxuXFxuPC9kaXY+XFxuXCI7XG5jYihudWxsLCBvdXRwdXQpO1xuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5iX3RpbWVsaW5lOiBiX3RpbWVsaW5lLFxucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIGN0eCwgY2IpOyB9XG59KSgpO1xuO1xuIl19
