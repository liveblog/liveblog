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

},{"./handlers":"/home/loic/code/liveblog-default-theme/js/theme/handlers.js","./local-analytics":"/home/loic/code/liveblog-default-theme/js/theme/local-analytics.js","./view":"/home/loic/code/liveblog-default-theme/js/theme/view.js","./viewmodel":"/home/loic/code/liveblog-default-theme/js/theme/viewmodel.js"}],"/home/loic/code/liveblog-default-theme/js/theme/local-analytics.js":[function(require,module,exports){
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

},{}],"/home/loic/code/liveblog-default-theme/js/theme/slideshow.js":[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var templates = require('./templates');

var Slideshow = function () {
  function Slideshow() {
    _classCallCheck(this, Slideshow);

    this.start = this.start.bind(this);
    this.keyboardListener = this.keyboardListener.bind(this);
    this.setFocus = this.setFocus.bind(this);
    this.launchIntoFullscreen = this.launchIntoFullscreen.bind(this);
    this.exitFullscreen = this.exitFullscreen.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
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
      var _this2 = this;

      var container = document.querySelector('#slideshow .container');

      container.querySelectorAll('img').forEach(function (img, i) {
        if (img.classList.contains('active')) {
          _this2.iterations = i;
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
          document.querySelector('#slideshow').remove();
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
output += "\n<div class=\"lb-type lb-type--embed lb-type--";
output += runtime.suppressValue(env.getFilter("lower").call(context, runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"provider_name")), env.opts.autoescape);
output += "\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"html"), env.opts.autoescape);
output += "</div>\n";
;
}
output += "\n";
if((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"title") || runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"description") || runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"credit") || (runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"html") && runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"thumbnail_url")))) {
output += "\n<article class=\"item--embed item--embed__wrapper\">\n    ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"html") && runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"thumbnail_url")) {
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
output += "\"></a>\n        </div>\n        ";
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
output += "<article\n  class=\"lb-post list-group-item show-author-avatar ";
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
output += "\n    <div class=\"lb-type lb-type--text\"></div>\n  ";
;
}
output += "\n\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"highlight")) {
output += "\n    <div class=\"lb-post-highlighted\"></div>\n  ";
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
output += "\n  </div>\n  <!-- end author -->\n\n  <!-- item start -->\n  <div class=\"items-container\">\n    ";
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
output += "\n      <div class=\"lb-item ";
if(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_4),"item")),"meta")),"media")),"renditions")),"original")),"height") > runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_4),"item")),"meta")),"media")),"renditions")),"original")),"width")) {
output += "portrait";
;
}
output += "\">\n      ";
;
}
else {
output += "\n      <div class=\"lb-item\">\n      ";
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
output += "\n    <div class=\"timeline-body timeline-body--loaded\">\n      <section class=\"lb-posts list-group sticky\">\n        ";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9saXZlYmxvZy5qcyIsImpzL3RoZW1lL2hhbmRsZXJzLmpzIiwianMvdGhlbWUvaGVscGVycy5qcyIsImpzL3RoZW1lL2luZGV4LmpzIiwianMvdGhlbWUvbG9jYWwtYW5hbHl0aWNzLmpzIiwianMvdGhlbWUvc2xpZGVzaG93LmpzIiwianMvdGhlbWUvdGVtcGxhdGVzLmpzIiwianMvdGhlbWUvdmlldy5qcyIsImpzL3RoZW1lL3ZpZXdtb2RlbC5qcyIsIm5vZGVfbW9kdWxlcy9udW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW0uanMiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sIiwidGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbCIsInRlbXBsYXRlcy90ZW1wbGF0ZS1wb3N0Lmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtc2xpZGVzaG93Lmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtdGltZWxpbmUuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7O0FBSUE7O0FBRUE7O0FBQ0EsSUFBSSxRQUFRLFFBQVEsU0FBUixDQUFaOztBQUVBLFNBQVMsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFlBQU07QUFDbEQsUUFBTSxJQUFOO0FBQ0QsQ0FGRDs7QUFJQSxPQUFPLE9BQVAsR0FBaUIsRUFBakI7OztBQ2JBOzs7O0FBSUE7O0FBRUEsSUFBSSxPQUFPLFFBQVEsUUFBUixDQUFYO0FBQUEsSUFDSSxZQUFZLFFBQVEsYUFBUixDQURoQjtBQUFBLElBRUksVUFBVSxRQUFRLFdBQVIsQ0FGZDs7QUFJQTs7Ozs7QUFLQSxJQUFNLGNBQWMsU0FBZCxXQUFjLENBQUMsQ0FBRCxFQUFPO0FBQ3pCLElBQUUsY0FBRjs7QUFFQSxNQUFJLE9BQU8sU0FBUyxhQUFULENBQXVCLGVBQXZCLEVBQXdDLEtBQW5EO0FBQ0EsTUFBSSxV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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFByZXJlbmRlciBmdW5jdGlvbnNcbnZhciB0aGVtZSA9IHJlcXVpcmUoJy4vdGhlbWUnKTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgdGhlbWUuaW5pdCgpO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge307XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKVxuICAsIHZpZXdtb2RlbCA9IHJlcXVpcmUoJy4vdmlld21vZGVsJylcbiAgLCBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XG5cbi8qKlxuICogQ29udGFpbnMgYSBtYXBwaW5nIG9mIGVsZW1lbnQgZGF0YS1zZWxlY3RvcnMgYW5kIGNsaWNrIGhhbmRsZXJzXG4gKiBidXR0b25zLmF0dGFjaCB7ZnVuY3Rpb259IC0gcmVnaXN0ZXJzIGhhbmRsZXJzIGZvdW5kIGluIGhhbmRsZXJzIG9iamVjdFxuICovXG5cbmNvbnN0IHNlbmRDb21tZW50ID0gKGUpID0+IHtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gIGxldCBuYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvbW1lbnQtbmFtZScpLnZhbHVlO1xuICBsZXQgY29tbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb21tZW50LWNvbnRlbnQnKS52YWx1ZTtcblxuICB2aWV3LmNsZWFyQ29tbWVudEZvcm1FcnJvcnMoKTtcblxuICByZXR1cm4gdmlld21vZGVsLnNlbmRDb21tZW50KG5hbWUsIGNvbW1lbnQpXG4gICAgLnRoZW4odmlldy50b2dnbGVDb21tZW50RGlhbG9nKVxuICAgIC50aGVuKCgpID0+IGRvY3VtZW50XG4gICAgICAgIC5xdWVyeVNlbGVjdG9yKCdmb3JtLmNvbW1lbnQnKVxuICAgICAgICAucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpXG4gICAgKVxuICAgIC50aGVuKHZpZXcuc2hvd1N1Y2Nlc3NDb21tZW50TXNnKVxuICAgIC5jYXRjaCh2aWV3LmRpc3BsYXlDb21tZW50Rm9ybUVycm9ycyk7XG59O1xuXG52YXIgYnV0dG9ucyA9IHtcbiAgaGFuZGxlcnM6IHtcbiAgICBcIltkYXRhLWpzLWxvYWRtb3JlXVwiOiAoKSA9PiB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzUGFnZSgpXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyUG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAuY2F0Y2goY2F0Y2hFcnJvcik7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtb3JkZXJieV9hc2NlbmRpbmddXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHMoe3NvcnQ6ICdhc2NlbmRpbmcnfSlcbiAgICAgICAgLnRoZW4odmlldy5yZW5kZXJUaW1lbGluZSlcbiAgICAgICAgLnRoZW4odmlldy5kaXNwbGF5TmV3UG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcudG9nZ2xlU29ydEJ0bignYXNjZW5kaW5nJykpXG4gICAgICAgIC5jYXRjaChjYXRjaEVycm9yKTtcbiAgICB9LFxuXG4gICAgXCJbZGF0YS1qcy1vcmRlcmJ5X2Rlc2NlbmRpbmddXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHMoe3NvcnQ6ICdkZXNjZW5kaW5nJ30pXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyVGltZWxpbmUpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAudGhlbih2aWV3LnRvZ2dsZVNvcnRCdG4oJ2Rlc2NlbmRpbmcnKSlcbiAgICAgICAgLmNhdGNoKGNhdGNoRXJyb3IpO1xuICAgIH0sXG5cbiAgICBcIltkYXRhLWpzLW9yZGVyYnlfZWRpdG9yaWFsXVwiOiAoKSA9PiB7XG4gICAgICB2aWV3bW9kZWwubG9hZFBvc3RzKHtzb3J0OiAnZWRpdG9yaWFsJ30pXG4gICAgICAgIC50aGVuKHZpZXcucmVuZGVyVGltZWxpbmUpXG4gICAgICAgIC50aGVuKHZpZXcuZGlzcGxheU5ld1Bvc3RzKVxuICAgICAgICAudGhlbih2aWV3LnRvZ2dsZVNvcnRCdG4oJ2VkaXRvcmlhbCcpKVxuICAgICAgICAuY2F0Y2goY2F0Y2hFcnJvcik7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtc2hvdy1jb21tZW50LWRpYWxvZ11cIjogKCkgPT4ge1xuICAgICAgbGV0IGlzVmlzaWJsZSA9IHZpZXcudG9nZ2xlQ29tbWVudERpYWxvZygpO1xuICAgICAgbGV0IGNvbW1lbnRGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9ybS5jb21tZW50Jyk7XG5cbiAgICAgIGlmIChpc1Zpc2libGUpIHtcbiAgICAgICAgY29tbWVudEZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29tbWVudEZvcm0ucmVtb3ZlRXZlbnRMaXN0ZW5lcignc3VibWl0Jywgc2VuZENvbW1lbnQpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAnW2RhdGEtanMtY2xvc2UtY29tbWVudC1kaWFsb2ddJzogKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZpZXcudG9nZ2xlQ29tbWVudERpYWxvZygpO1xuICAgIH1cbiAgfSxcblxuICBhdHRhY2g6IGZ1bmN0aW9uKCkge1xuICAgIE9iamVjdC5rZXlzKGJ1dHRvbnMuaGFuZGxlcnMpLmZvckVhY2goKGhhbmRsZXIpID0+IHtcbiAgICAgIGxldCBlbCA9IGhlbHBlcnMuZ2V0RWxlbXMoaGFuZGxlcilbMF07XG5cbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGJ1dHRvbnMuaGFuZGxlcnNbaGFuZGxlcl0sIGZhbHNlKTtcbiAgICB9KTtcblxuICAgIHZpZXcuYXR0YWNoU2xpZGVzaG93KCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGNhdGNoRXJyb3IoZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoXCJIYW5kbGVyIGVycm9yOiBcIiwgZXJyKTtcbn1cblxudmFyIGV2ZW50cyA9IHtcbiAgYXR0YWNoOiBmdW5jdGlvbigpIHt9IC8vIHRvZG9cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBidXR0b25zOiBidXR0b25zLFxuICBldmVudHM6IGV2ZW50c1xufTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKiBDb252ZXJ0IElTTyB0aW1lc3RhbXBzIHRvIHJlbGF0aXZlIG1vbWVudCB0aW1lc3RhbXBzXG4gKiBAcGFyYW0ge05vZGV9IGVsZW0gLSBhIERPTSBlbGVtZW50IHdpdGggSVNPIHRpbWVzdGFtcCBpbiBkYXRhLWpzLXRpbWVzdGFtcCBhdHRyXG4gKi9cbmZ1bmN0aW9uIGNvbnZlcnRUaW1lc3RhbXAodGltZXN0YW1wKSB7XG4gIHZhciBsMTBuID0gTEIubDEwbi50aW1lQWdvXG4gICAgLCBub3cgPSBuZXcgRGF0ZSgpIC8vIE5vd1xuICAgICwgZGlmZiA9IG5vdyAtIG5ldyBEYXRlKHRpbWVzdGFtcClcbiAgICAsIHVuaXRzID0ge1xuICAgICAgZDogMTAwMCAqIDM2MDAgKiAyNCxcbiAgICAgIGg6IDEwMDAgKiAzNjAwLFxuICAgICAgbTogMTAwMCAqIDYwXG4gICAgfTtcblxuICBmdW5jdGlvbiBnZXRUaW1lQWdvU3RyaW5nKHRpbWVzdGFtcCwgdW5pdCkge1xuICAgIHJldHVybiAhKHRpbWVzdGFtcCA8PSB1bml0c1t1bml0XSAqIDIpXG4gICAgICA/IGwxMG5bdW5pdF0ucC5yZXBsYWNlKFwie31cIiwgTWF0aC5mbG9vcih0aW1lc3RhbXAgLyB1bml0c1t1bml0XSkpXG4gICAgICA6IGwxMG5bdW5pdF0ucztcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVBZ28odGltZXN0YW1wKSB7XG4gICAgaWYgKHRpbWVzdGFtcCA8IHVuaXRzLmgpIHtcbiAgICAgIHJldHVybiBnZXRUaW1lQWdvU3RyaW5nKHRpbWVzdGFtcCwgXCJtXCIpO1xuICAgIH1cblxuICAgIGlmICh0aW1lc3RhbXAgPCB1bml0cy5kKSB7XG4gICAgICByZXR1cm4gZ2V0VGltZUFnb1N0cmluZyh0aW1lc3RhbXAsIFwiaFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0VGltZUFnb1N0cmluZyh0aW1lc3RhbXAsIFwiZFwiKTsgLy8gZGVmYXVsdFxuICB9XG5cbiAgcmV0dXJuIHRpbWVBZ28oZGlmZik7XG59XG5cbi8qKlxuICogV3JhcCBlbGVtZW50IHNlbGVjdG9yIGFwaVxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IC0gYSBqUXVlcnkgc3ludGF4IERPTSBxdWVyeSAod2l0aCBkb3RzKVxuICovXG5mdW5jdGlvbiBnZXRFbGVtcyhxdWVyeSkge1xuICB2YXIgaXNEYXRhQXR0ciA9IHF1ZXJ5LmluZGV4T2YoXCJkYXRhLVwiKSA+IC0xO1xuICByZXR1cm4gaXNEYXRhQXR0clxuICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxdWVyeSlcbiAgICA6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUocXVlcnkpO1xufVxuXG4vKipcbiAqIGpRdWVyeSdzICQuZ2V0SlNPTiBpbiBhIG51dHNoZWxsXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gYSByZXF1ZXN0IFVSTFxuICovXG5mdW5jdGlvbiBnZXRKU09OKHVybCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlamVjdCh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgeGhyLnNlbmQoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3QodXJsLCBkYXRhKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ1BPU1QnLCB1cmwpO1xuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAxKSB7XG4gICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWplY3QoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgfSk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldEVsZW1zOiBnZXRFbGVtcyxcbiAgZ2V0SlNPTjogZ2V0SlNPTixcbiAgcG9zdDogcG9zdCxcbiAgY29udmVydFRpbWVzdGFtcDogY29udmVydFRpbWVzdGFtcFxufTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBoYW5kbGVycyA9IHJlcXVpcmUoJy4vaGFuZGxlcnMnKSxcbiAgdmlld21vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWwnKSxcbiAgdmlldyA9IHJlcXVpcmUoJy4vdmlldycpLFxuICBsb2NhbEFuYWx5dGljcyA9IHJlcXVpcmUoJy4vbG9jYWwtYW5hbHl0aWNzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvKipcbiAgICogT24gZG9jdW1lbnQgbG9hZGVkLCBkbyB0aGUgZm9sbG93aW5nOlxuICAgKi9cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgaGFuZGxlcnMuYnV0dG9ucy5hdHRhY2goKTsgLy8gUmVnaXN0ZXIgQnV0dG9ucyBIYW5kbGVyc1xuICAgIGhhbmRsZXJzLmV2ZW50cy5hdHRhY2goKTsgLy8gUmVnaXN0ZXIgRXZlbnQsIE1lc3NhZ2UgSGFuZGxlcnNcbiAgICB2aWV3bW9kZWwuaW5pdCgpO1xuICAgIGxvY2FsQW5hbHl0aWNzLmhpdCgpO1xuXG4gICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdmlldy51cGRhdGVUaW1lc3RhbXBzKCk7IC8vIENvbnZlcnQgSVNPIGRhdGVzIHRvIHRpbWVhZ29cbiAgICB9LCAxMDAwKTtcbiAgfVxufTtcbiIsInZhciBhcGlIb3N0ID0gd2luZG93Lmhhc093blByb3BlcnR5KCdMQicpID8gd2luZG93LkxCLmFwaV9ob3N0LnJlcGxhY2UoL1xcLyQvLCAnJykgOiAnJztcbnZhciBjb250ZXh0VXJsID0gZG9jdW1lbnQucmVmZXJyZXI7XG52YXIgYmxvZ0lkID0gd2luZG93Lmhhc093blByb3BlcnR5KCdMQicpID8gd2luZG93LkxCLmJsb2cuX2lkIDogJyc7XG5cbmFwaUhvc3QgKz0gJy9hcGkvYW5hbHl0aWNzL2hpdCc7XG5cbnZhciBjcmVhdGVDb29raWUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgZGF5cykge1xuICB2YXIgZXhwaXJlcyA9ICcnLCBkYXRlID0gbmV3IERhdGUoKTtcblxuICBpZiAoZGF5cykge1xuICAgIGRhdGUuc2V0VGltZShkYXRlLmdldFRpbWUoKSArIGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKTtcbiAgICBleHBpcmVzID0gYDsgZXhwaXJlcz0ke2RhdGUudG9VVENTdHJpbmcoKX1gO1xuICB9XG4gIGRvY3VtZW50LmNvb2tpZSA9IGAke25hbWV9PSR7dmFsdWV9JHtleHBpcmVzfTsgcGF0aD0vYDtcbn07XG5cbnZhciByZWFkQ29va2llID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgbmFtZUVRID0gbmFtZSArICc9JztcbiAgdmFyIGNhID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7Jyk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjID0gY2FbaV07XG5cbiAgICB3aGlsZSAoYy5jaGFyQXQoMCkgPT09ICcgJykge1xuICAgICAgYyA9IGMuc3Vic3RyaW5nKDEsIGMubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoYy5pbmRleE9mKG5hbWVFUSkgPT09IDApIHtcbiAgICAgIHJldHVybiBjLnN1YnN0cmluZyhuYW1lRVEubGVuZ3RoLCBjLmxlbmd0aCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxudmFyIGhpdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgeG1saHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICB2YXIganNvbkRhdGEgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgY29udGV4dF91cmw6IGNvbnRleHRVcmwsXG4gICAgYmxvZ19pZDogYmxvZ0lkXG4gIH0pO1xuXG4gIHhtbGh0dHAub3BlbignUE9TVCcsIGFwaUhvc3QpO1xuICB4bWxodHRwLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cbiAgeG1saHR0cC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoeG1saHR0cC5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgY3JlYXRlQ29va2llKCdoaXQnLCBqc29uRGF0YSwgMik7XG4gICAgfVxuICB9O1xuXG4gIHhtbGh0dHAuc2VuZChqc29uRGF0YSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtoaXQ6ICgpID0+IHtcbiAgaWYgKCFyZWFkQ29va2llKCdoaXQnKSkge1xuICAgIGhpdCgpO1xuICB9XG59fTtcbiIsImNvbnN0IHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJyk7XG5cbmNsYXNzIFNsaWRlc2hvdyB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc3RhcnQgPSB0aGlzLnN0YXJ0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5rZXlib2FyZExpc3RlbmVyID0gdGhpcy5rZXlib2FyZExpc3RlbmVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zZXRGb2N1cyA9IHRoaXMuc2V0Rm9jdXMuYmluZCh0aGlzKTtcbiAgICB0aGlzLmxhdW5jaEludG9GdWxsc2NyZWVuID0gdGhpcy5sYXVuY2hJbnRvRnVsbHNjcmVlbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZXhpdEZ1bGxzY3JlZW4gPSB0aGlzLmV4aXRGdWxsc2NyZWVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy50b2dnbGVGdWxsc2NyZWVuID0gdGhpcy50b2dnbGVGdWxsc2NyZWVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVycyA9IHRoaXMuYWRkRXZlbnRMaXN0ZW5lcnMuYmluZCh0aGlzKTtcbiAgfVxuXG4gIHN0YXJ0KGUpIHtcbiAgICBsZXQgaXRlbXMgPSBbXTtcblxuICAgIHRoaXMuaXRlcmF0aW9ucyA9IDA7XG4gICAgdGhpcy5pc0Z1bGxzY3JlZW4gPSBmYWxzZTtcblxuICAgIGUudGFyZ2V0XG4gICAgICAuY2xvc2VzdCgnYXJ0aWNsZS5zbGlkZXNob3cnKVxuICAgICAgLnF1ZXJ5U2VsZWN0b3JBbGwoJy5sYi1pdGVtIGltZycpXG4gICAgICAuZm9yRWFjaCgoaW1nKSA9PiB7XG4gICAgICAgIGxldCBtYXRjaGVzID0gW107XG5cbiAgICAgICAgaW1nLmdldEF0dHJpYnV0ZSgnc3Jjc2V0JykucmVwbGFjZSgvKFxcUyspXFxzXFxkK3cvZywgKHMsIG1hdGNoKSA9PiB7XG4gICAgICAgICAgbWF0Y2hlcy5wdXNoKG1hdGNoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IFtiYXNlSW1hZ2UsIHRodW1ibmFpbCwgdmlld0ltYWdlXSA9IG1hdGNoZXM7XG5cbiAgICAgICAgaXRlbXMucHVzaCh7XG4gICAgICAgICAgaXRlbToge1xuICAgICAgICAgICAgbWV0YToge1xuICAgICAgICAgICAgICBtZWRpYToge3JlbmRpdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBiYXNlSW1hZ2U6IHtocmVmOiBiYXNlSW1hZ2V9LFxuICAgICAgICAgICAgICAgIHRodW1ibmFpbDoge2hyZWY6IHRodW1ibmFpbH0sXG4gICAgICAgICAgICAgICAgdmlld0ltYWdlOiB7aHJlZjogdmlld0ltYWdlfVxuICAgICAgICAgICAgICB9fSxcbiAgICAgICAgICAgICAgY2FwdGlvbjogaW1nLnBhcmVudE5vZGUucXVlcnlTZWxlY3Rvcignc3Bhbi5jYXB0aW9uJykudGV4dENvbnRlbnQsXG4gICAgICAgICAgICAgIGNyZWRpdDogaW1nLnBhcmVudE5vZGUucXVlcnlTZWxlY3Rvcignc3Bhbi5jcmVkaXQnKS50ZXh0Q29udGVudCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY3RpdmU6IHRodW1ibmFpbCA9PT0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdzcmMnKVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIGxldCBzbGlkZXNob3cgPSB0ZW1wbGF0ZXMuc2xpZGVzaG93KHtcbiAgICAgIHJlZnM6IGl0ZW1zXG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXYubGItdGltZWxpbmUnKVxuICAgICAgLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJlbmQnLCBzbGlkZXNob3cpO1xuXG4gICAgaWYgKHdpbmRvdy5zZWxmICE9PSB3aW5kb3cudG9wKSB7XG4gICAgICB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKCdmdWxsc2NyZWVuJywgd2luZG93LmRvY3VtZW50LnJlZmVycmVyKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldEZvY3VzKCk7XG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVycygpO1xuICB9XG5cbiAgYWRkRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWJvYXJkTGlzdGVuZXIpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5mdWxsc2NyZWVuJylcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlRnVsbHNjcmVlbik7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmFycm93cy5uZXh0JylcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzl9KSk7XG5cbiAgICBkb2N1bWVudFxuICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgYnV0dG9uLmFycm93cy5wcmV2JylcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMua2V5Ym9hcmRMaXN0ZW5lcih7a2V5Q29kZTogMzd9KSk7XG4gIH1cblxuICB0b2dnbGVGdWxsc2NyZWVuKCkge1xuICAgIGlmICghdGhpcy5pc0Z1bGxzY3JlZW4pIHtcbiAgICAgIHRoaXMubGF1bmNoSW50b0Z1bGxzY3JlZW4oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NsaWRlc2hvdycpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5leGl0RnVsbHNjcmVlbigpO1xuICAgIH1cbiAgfVxuXG4gIGxhdW5jaEludG9GdWxsc2NyZWVuKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbikge1xuICAgICAgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbigpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgICAgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5tc1JlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzRnVsbHNjcmVlbiA9IHRydWU7XG4gIH1cblxuICBleGl0RnVsbHNjcmVlbigpIHtcbiAgICBpZiAoZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4pIHtcbiAgICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKSB7XG4gICAgICBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbikge1xuICAgICAgZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzRnVsbHNjcmVlbiA9IGZhbHNlO1xuICB9XG5cbiAgc2V0Rm9jdXMoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyAuY29udGFpbmVyJyk7XG5cbiAgICBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnaW1nJykuZm9yRWFjaCgoaW1nLCBpKSA9PiB7XG4gICAgICBpZiAoaW1nLmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykpIHtcbiAgICAgICAgdGhpcy5pdGVyYXRpb25zID0gaTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICh0aGlzLml0ZXJhdGlvbnMgPiAwKSB7XG4gICAgICBjb250YWluZXIuc3R5bGUubWFyZ2luVG9wID0gYC0ke2NvbnRhaW5lci5vZmZzZXRIZWlnaHQgKiB0aGlzLml0ZXJhdGlvbnN9cHhgO1xuICAgIH1cbiAgfVxuXG4gIGtleWJvYXJkTGlzdGVuZXIoZSkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgLmNvbnRhaW5lcicpO1xuICAgIGNvbnN0IHBpY3R1cmVzQ291bnQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnaW1nJykubGVuZ3RoO1xuICAgIGxldCBvZmZzZXQgPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0ICogdGhpcy5pdGVyYXRpb25zO1xuXG4gICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgaWYgKG9mZnNldCArIGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgPCBwaWN0dXJlc0NvdW50ICogY29udGFpbmVyLm9mZnNldEhlaWdodCkge1xuICAgICAgICBjb250YWluZXIuc3R5bGUubWFyZ2luVG9wID0gYC0ke29mZnNldCArIGNvbnRhaW5lci5vZmZzZXRIZWlnaHR9cHhgO1xuICAgICAgICB0aGlzLml0ZXJhdGlvbnMrKztcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgaWYgKG9mZnNldCAtIGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgPj0gMCkge1xuICAgICAgICBjb250YWluZXIuc3R5bGUubWFyZ2luVG9wID0gYC0ke29mZnNldCAtIGNvbnRhaW5lci5vZmZzZXRIZWlnaHR9cHhgO1xuICAgICAgICB0aGlzLml0ZXJhdGlvbnMtLTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAyNzogLy8gZXNjXG4gICAgICB0aGlzLmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JykucmVtb3ZlKCk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2xpZGVzaG93O1xuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IG51bmp1Y2tzID0gcmVxdWlyZShcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiKTtcbmNvbnN0IHNldHRpbmdzID0gd2luZG93LkxCLnNldHRpbmdzO1xuXG5jb25zdCBkZWZhdWx0VGVtcGxhdGVzID0ge1xuICBwb3N0OiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLXBvc3QuaHRtbFwiKSxcbiAgdGltZWxpbmU6IHJlcXVpcmUoXCIuLi8uLi90ZW1wbGF0ZXMvdGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiKSxcbiAgaXRlbUltYWdlOiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbFwiKSxcbiAgaXRlbUVtYmVkOiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiKSxcbiAgc2xpZGVzaG93OiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLXNsaWRlc2hvdy5odG1sXCIpXG59O1xuXG5mdW5jdGlvbiBnZXRDdXN0b21UZW1wbGF0ZXMoKSB7XG4gIGxldCBjdXN0b21UZW1wbGF0ZXMgPSBzZXR0aW5ncy5jdXN0b21UZW1wbGF0ZXNcbiAgICAsIG1lcmdlZFRlbXBsYXRlcyA9IGRlZmF1bHRUZW1wbGF0ZXM7XG5cbiAgZm9yIChsZXQgdGVtcGxhdGUgaW4gY3VzdG9tVGVtcGxhdGVzKSB7XG4gICAgbGV0IGN1c3RvbVRlbXBsYXRlTmFtZSA9IGN1c3RvbVRlbXBsYXRlc1t0ZW1wbGF0ZV07XG4gICAgZGVmYXVsdFRlbXBsYXRlc1t0ZW1wbGF0ZV0gPSAoY3R4LCBjYikgPT4ge1xuICAgICAgbnVuanVja3MucmVuZGVyKGN1c3RvbVRlbXBsYXRlTmFtZSwgY3R4LCBjYik7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBtZXJnZWRUZW1wbGF0ZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dGluZ3MuY3VzdG9tVGVtcGxhdGVzXG4gID8gZ2V0Q3VzdG9tVGVtcGxhdGVzKClcbiAgOiBkZWZhdWx0VGVtcGxhdGVzO1xuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XG52YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcbnZhciBTbGlkZXNob3cgPSByZXF1aXJlKCcuL3NsaWRlc2hvdycpO1xuXG52YXIgdGltZWxpbmVFbGVtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5sYi1wb3N0cy5ub3JtYWxcIilcbiAgLCBsb2FkTW9yZVBvc3RzQnV0dG9uID0gaGVscGVycy5nZXRFbGVtcyhcImxvYWQtbW9yZS1wb3N0c1wiKTtcblxuLyoqXG4gKiBSZXBsYWNlIHRoZSBjdXJyZW50IHRpbWVsaW5lIHVuY29uZGl0aW9uYWxseS5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IGFwaV9yZXNwb25zZSDigJMgY29udGFpbnMgcmVxdWVzdCBvcHRzLlxuICogQHByb3BlcnR5IHtPYmplY3R9IHJlcXVlc3RPcHRzIC0gQVBJIHJlcXVlc3QgcGFyYW1zLlxuICovXG5mdW5jdGlvbiByZW5kZXJUaW1lbGluZShhcGlfcmVzcG9uc2UpIHtcbiAgdmFyIHJlbmRlcmVkUG9zdHMgPSBbXTtcblxuICBhcGlfcmVzcG9uc2UuX2l0ZW1zLmZvckVhY2goKHBvc3QpID0+IHtcbiAgICByZW5kZXJlZFBvc3RzLnB1c2godGVtcGxhdGVzLnBvc3Qoe1xuICAgICAgaXRlbTogcG9zdCxcbiAgICAgIHNldHRpbmdzOiB3aW5kb3cuTEIuc2V0dGluZ3NcbiAgICB9KSk7XG4gIH0pO1xuXG4gIHRpbWVsaW5lRWxlbVswXS5pbm5lckhUTUwgPSByZW5kZXJlZFBvc3RzLmpvaW4oXCJcIik7XG4gIGxvYWRFbWJlZHMoKTtcbiAgYXR0YWNoU2xpZGVzaG93KCk7XG59XG5cbi8qKlxuICogUmVuZGVyIHBvc3RzIGN1cnJlbnRseSBpbiBwaXBlbGluZSB0byB0ZW1wbGF0ZS5cbiAqIFRvIHJlZHVjZSBET00gY2FsbHMvcGFpbnRzIHdlIGhhbmQgb2ZmIHJlbmRlcmVkIEhUTUwgaW4gYnVsay5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IGFwaV9yZXNwb25zZSDigJMgY29udGFpbnMgcmVxdWVzdCBvcHRzLlxuICogQHByb3BlcnR5IHtPYmplY3R9IHJlcXVlc3RPcHRzIC0gQVBJIHJlcXVlc3QgcGFyYW1zLlxuICovXG5mdW5jdGlvbiByZW5kZXJQb3N0cyhhcGlfcmVzcG9uc2UpIHtcbiAgdmFyIHJlbmRlcmVkUG9zdHMgPSBbXSAvLyB0ZW1wb3Jhcnkgc3RvcmVcbiAgICAsIHBvc3RzID0gYXBpX3Jlc3BvbnNlLl9pdGVtcztcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBvc3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBvc3QgPSBwb3N0c1tpXTtcblxuICAgIGlmIChwb3N0cy5vcGVyYXRpb24gPT09IFwiZGVsZXRlXCIpIHtcbiAgICAgIGRlbGV0ZVBvc3QocG9zdC5faWQpO1xuICAgICAgcmV0dXJuOyAvLyBlYXJseVxuICAgIH1cblxuICAgIHZhciByZW5kZXJlZFBvc3QgPSB0ZW1wbGF0ZXMucG9zdCh7XG4gICAgICBpdGVtOiBwb3N0LFxuICAgICAgc2V0dGluZ3M6IHdpbmRvdy5MQi5zZXR0aW5nc1xuICAgIH0pO1xuXG4gICAgaWYgKHBvc3RzLm9wZXJhdGlvbiA9PT0gXCJ1cGRhdGVcIikge1xuICAgICAgdXBkYXRlUG9zdChyZW5kZXJlZFBvc3QpO1xuICAgICAgcmV0dXJuOyAvLyBlYXJseVxuICAgIH1cblxuICAgIHJlbmRlcmVkUG9zdHMucHVzaChyZW5kZXJlZFBvc3QpOyAvLyBjcmVhdGUgb3BlcmF0aW9uXG4gIH1cblxuICBpZiAoIXJlbmRlcmVkUG9zdHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuOyAvLyBlYXJseVxuICB9XG4gIFxuICByZW5kZXJlZFBvc3RzLnJldmVyc2UoKTtcblxuICBhZGRQb3N0cyhyZW5kZXJlZFBvc3RzLCB7IC8vIGlmIGNyZWF0ZXNcbiAgICBwb3NpdGlvbjogYXBpX3Jlc3BvbnNlLnJlcXVlc3RPcHRzLmZyb21EYXRlID8gXCJ0b3BcIiA6IFwiYm90dG9tXCJcbiAgfSk7XG5cbiAgbG9hZEVtYmVkcygpO1xufVxuXG4vKipcbiAqIEFkZCBwb3N0IG5vZGVzIHRvIERPTSwgZG8gc28gcmVnYXJkbGVzcyBvZiBzZXR0aW5ncy5hdXRvQXBwbHlVcGRhdGVzLFxuICogYnV0IHJhdGhlciBzZXQgdGhlbSB0byBOT1QgQkUgRElTUExBWUVEIGlmIGF1dG8tYXBwbHkgaXMgZmFsc2UuXG4gKiBUaGlzIHdheSB3ZSBkb24ndCBoYXZlIHRvIG1lc3Mgd2l0aCB0d28gc3RhY2tzIG9mIHBvc3RzLlxuICogQHBhcmFtIHthcnJheX0gcG9zdHMgLSBhbiBhcnJheSBvZiBMaXZlYmxvZyBwb3N0IGl0ZW1zXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIGtleXdvcmQgYXJnc1xuICogQHBhcmFtIHtzdHJpbmd9IG9wdHMucG9zaXRpb24gLSB0b3Agb3IgYm90dG9tXG4gKi9cbmZ1bmN0aW9uIGFkZFBvc3RzKHBvc3RzLCBvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICBvcHRzLnBvc2l0aW9uID0gb3B0cy5wb3NpdGlvbiB8fCBcImJvdHRvbVwiO1xuXG4gIHZhciBwb3N0c0hUTUwgPSBcIlwiXG4gICAgLCBwb3NpdGlvbiA9IG9wdHMucG9zaXRpb24gPT09IFwidG9wXCJcbiAgICAgICAgPyBcImFmdGVyYmVnaW5cIiAvLyBpbnNlcnRBZGphY2VudEhUTUwgQVBJID0+IGFmdGVyIHN0YXJ0IG9mIG5vZGVcbiAgICAgICAgOiBcImJlZm9yZWVuZFwiOyAvLyBpbnNlcnRBZGphY2VudEhUTUwgQVBJID0+IGJlZm9yZSBlbmQgb2Ygbm9kZVxuXG4gIGZvciAodmFyIGkgPSBwb3N0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHBvc3RzSFRNTCArPSBwb3N0c1tpXTtcbiAgfVxuXG4gIHRpbWVsaW5lRWxlbVswXS5pbnNlcnRBZGphY2VudEhUTUwocG9zaXRpb24sIHBvc3RzSFRNTCk7XG4gIGF0dGFjaFNsaWRlc2hvdygpO1xufVxuXG4vKipcbiAqIERlbGV0ZSBwb3N0IDxhcnRpY2xlPiBET00gbm9kZSBieSBkYXRhIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAtIGEgcG9zdCBVUk5cbiAqL1xuZnVuY3Rpb24gZGVsZXRlUG9zdChwb3N0SWQpIHtcbiAgdmFyIGVsZW0gPSBoZWxwZXJzLmdldEVsZW1zKCdkYXRhLWpzLXBvc3QtaWQ9XFxcIicgKyBwb3N0SWQgKyAnXFxcIicpO1xuICBlbGVtWzBdLnJlbW92ZSgpO1xufVxuXG4vKipcbiAqIERlbGV0ZSBwb3N0IDxhcnRpY2xlPiBET00gbm9kZSBieSBkYXRhIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAtIGEgcG9zdCBVUk5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlUG9zdChwb3N0SWQsIHJlbmRlcmVkUG9zdCkge1xuICB2YXIgZWxlbSA9IGhlbHBlcnMuZ2V0RWxlbXMoJ2RhdGEtanMtcG9zdC1pZD1cXFwiJyArIHBvc3RJZCArICdcXFwiJyk7XG4gIGVsZW1bMF0uaW5uZXJIVE1MID0gcmVuZGVyZWRQb3N0O1xufVxuXG4vKipcbiAqIFNob3cgbmV3IHBvc3RzIGxvYWRlZCB2aWEgWEhSXG4gKi9cbmZ1bmN0aW9uIGRpc3BsYXlOZXdQb3N0cygpIHtcbiAgdmFyIG5ld1Bvc3RzID0gaGVscGVycy5nZXRFbGVtcyhcImxiLXBvc3QtbmV3XCIpO1xuICBmb3IgKHZhciBpID0gbmV3UG9zdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBuZXdQb3N0c1tpXS5jbGFzc0xpc3QucmVtb3ZlKFwibGItcG9zdC1uZXdcIik7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGVtYmVkIHByb3ZpZGVyIHVucGFja2luZ1xuICogVG9kbzogTWFrZSByZXF1aXJlZCBzY3JpcHRzIGF2YWlsYWJsZSBvbiBzdWJzZXF1ZW50IGxvYWRzXG4gKi9cbmZ1bmN0aW9uIGxvYWRFbWJlZHMoKSB7XG4gIGlmICh3aW5kb3cuaW5zdGdybSkge1xuICAgIGluc3Rncm0uRW1iZWRzLnByb2Nlc3MoKTtcbiAgfVxuXG4gIGlmICh3aW5kb3cudHd0dHIpIHtcbiAgICB0d3R0ci53aWRnZXRzLmxvYWQoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b2dnbGVDb21tZW50RGlhbG9nKCkge1xuICBsZXQgY29tbWVudEZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdmb3JtLmNvbW1lbnQnKTtcbiAgbGV0IGlzSGlkZGVuID0gZmFsc2U7XG5cbiAgaWYgKGNvbW1lbnRGb3JtKSB7XG4gICAgaXNIaWRkZW4gPSBjb21tZW50Rm9ybS5jbGFzc0xpc3QudG9nZ2xlKCdoaWRlJyk7XG4gIH1cblxuICByZXR1cm4gIWlzSGlkZGVuO1xufVxuXG4vKipcbiAqIFNldCBzb3J0aW5nIG9yZGVyIGJ1dHRvbiBvZiBjbGFzcyBAbmFtZSB0byBhY3RpdmUuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIGxpdmVibG9nIEFQSSByZXNwb25zZSBKU09OLlxuICovXG5mdW5jdGlvbiB0b2dnbGVTb3J0QnRuKG5hbWUpIHtcbiAgdmFyIHNvcnRpbmdCdG5zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnNvcnRpbmctYmFyX19vcmRlcicpO1xuXG4gIHNvcnRpbmdCdG5zLmZvckVhY2goKGVsKSA9PiB7XG4gICAgdmFyIHNob3VsZEJlQWN0aXZlID0gZWwuZGF0YXNldC5oYXNPd25Qcm9wZXJ0eShcImpzT3JkZXJieV9cIiArIG5hbWUpO1xuXG4gICAgZWwuY2xhc3NMaXN0LnRvZ2dsZSgnc29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmUnLCBzaG91bGRCZUFjdGl2ZSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIENvbmRpdGlvbmFsbHkgaGlkZSBsb2FkLW1vcmUtcG9zdHMgYnV0dG9uLlxuICogQHBhcmFtIHtib29sfSBzaG91bGRUb2dnbGUgLSB0cnVlID0+IGhpZGVcbiAqL1xuZnVuY3Rpb24gaGlkZUxvYWRNb3JlKHNob3VsZEhpZGUpIHtcbiAgaWYgKGxvYWRNb3JlUG9zdHNCdXR0b24ubGVuZ3RoID4gMCkge1xuICAgIGxvYWRNb3JlUG9zdHNCdXR0b25bMF0uY2xhc3NMaXN0LnRvZ2dsZShcbiAgICAgIFwibW9kLS1oaWRlXCIsIHNob3VsZEhpZGUpO1xuICB9XG59XG5cbi8qKlxuICogRGVsZXRlIHBvc3QgPGFydGljbGU+IERPTSBub2RlIGJ5IGRhdGEgYXR0cmlidXRlLlxuICogQHBhcmFtIHtzdHJpbmd9IC0gYSBwb3N0IFVSTlxuICovXG5mdW5jdGlvbiB1cGRhdGVUaW1lc3RhbXBzKCkge1xuICB2YXIgZGF0ZUVsZW1zID0gaGVscGVycy5nZXRFbGVtcyhcImxiLXBvc3QtZGF0ZVwiKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRlRWxlbXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZWxlbSA9IGRhdGVFbGVtc1tpXVxuICAgICAgLCB0aW1lc3RhbXAgPSBlbGVtLmRhdGFzZXQuanNUaW1lc3RhbXA7XG4gICAgZWxlbS50ZXh0Q29udGVudCA9IGhlbHBlcnMuY29udmVydFRpbWVzdGFtcCh0aW1lc3RhbXApO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBzaG93U3VjY2Vzc0NvbW1lbnRNc2coKSB7XG4gIGxldCBjb21tZW50U2VudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Rpdi5jb21tZW50LXNlbnQnKTtcblxuICBjb21tZW50U2VudC5jbGFzc0xpc3QudG9nZ2xlKCdoaWRlJyk7XG5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgY29tbWVudFNlbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZScpO1xuICB9LCA1MDAwKTtcbn1cblxuZnVuY3Rpb24gY2xlYXJDb21tZW50Rm9ybUVycm9ycygpIHtcbiAgbGV0IGVycm9yc01zZ3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwLmVyci1tc2cnKTtcblxuICBpZiAoZXJyb3JzTXNncykge1xuICAgIGVycm9yc01zZ3MuZm9yRWFjaCgoZXJyb3JzTXNnKSA9PiBlcnJvcnNNc2cucmVtb3ZlKCkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BsYXlDb21tZW50Rm9ybUVycm9ycyhlcnJvcnMpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoZXJyb3JzKSkge1xuICAgIGVycm9ycy5mb3JFYWNoKChlcnJvcikgPT4ge1xuICAgICAgbGV0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVycm9yLmlkKTtcblxuICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC5pbnNlcnRBZGphY2VudEhUTUwoXG4gICAgICAgICAgJ2FmdGVyZW5kJyxcbiAgICAgICAgICBgPHAgY2xhc3M9XCJlcnItbXNnXCI+JHtlcnJvci5tc2d9PC9wPmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhdHRhY2hTbGlkZXNob3coKSB7XG4gIGNvbnN0IHNsaWRlc2hvdyA9IG5ldyBTbGlkZXNob3coKTtcbiAgY29uc3Qgc2xpZGVzaG93SW1hZ2VzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYXJ0aWNsZS5zbGlkZXNob3cgaW1nJyk7XG5cbiAgaWYgKHNsaWRlc2hvd0ltYWdlcykge1xuICAgIHNsaWRlc2hvd0ltYWdlcy5mb3JFYWNoKChpbWFnZSkgPT4ge1xuICAgICAgaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzbGlkZXNob3cuc3RhcnQpO1xuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGRQb3N0czogYWRkUG9zdHMsXG4gIGRlbGV0ZVBvc3Q6IGRlbGV0ZVBvc3QsXG4gIGRpc3BsYXlOZXdQb3N0czogZGlzcGxheU5ld1Bvc3RzLFxuICByZW5kZXJUaW1lbGluZTogcmVuZGVyVGltZWxpbmUsXG4gIHJlbmRlclBvc3RzOiByZW5kZXJQb3N0cyxcbiAgdXBkYXRlUG9zdDogdXBkYXRlUG9zdCxcbiAgdXBkYXRlVGltZXN0YW1wczogdXBkYXRlVGltZXN0YW1wcyxcbiAgaGlkZUxvYWRNb3JlOiBoaWRlTG9hZE1vcmUsXG4gIHRvZ2dsZVNvcnRCdG46IHRvZ2dsZVNvcnRCdG4sXG4gIHRvZ2dsZUNvbW1lbnREaWFsb2c6IHRvZ2dsZUNvbW1lbnREaWFsb2csXG4gIHNob3dTdWNjZXNzQ29tbWVudE1zZzogc2hvd1N1Y2Nlc3NDb21tZW50TXNnLFxuICBkaXNwbGF5Q29tbWVudEZvcm1FcnJvcnM6IGRpc3BsYXlDb21tZW50Rm9ybUVycm9ycyxcbiAgY2xlYXJDb21tZW50Rm9ybUVycm9yczogY2xlYXJDb21tZW50Rm9ybUVycm9ycyxcbiAgYXR0YWNoU2xpZGVzaG93OiBhdHRhY2hTbGlkZXNob3dcbn07XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKVxuICAsIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY29uc3QgY29tbWVudEl0ZW1FbmRwb2ludCA9IGAke0xCLmFwaV9ob3N0fWFwaS9jbGllbnRfaXRlbXNgO1xuY29uc3QgY29tbWVudFBvc3RFbmRwb2ludCA9IGAke0xCLmFwaV9ob3N0fWFwaS9jbGllbnRfY29tbWVudHNgO1xuXG52YXIgZW5kcG9pbnQgPSBMQi5hcGlfaG9zdCArIFwiL2FwaS9jbGllbnRfYmxvZ3MvXCIgKyBMQi5ibG9nLl9pZCArIFwiL3Bvc3RzXCJcbiAgLCBzZXR0aW5ncyA9IExCLnNldHRpbmdzXG4gICwgdm0gPSB7fTtcblxuLyoqXG4gKiBHZXQgaW5pdGlhbCBvciByZXNldCB2aWV3bW9kZWwuXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBlbXB0eSB2aWV3bW9kZWwgc3RvcmUuXG4gKi9cbmZ1bmN0aW9uIGdldEVtcHR5Vm0oaXRlbXMpIHtcbiAgcmV0dXJuIHtcbiAgICBfaXRlbXM6IG5ldyBBcnJheShpdGVtcykgfHwgMCxcbiAgICBjdXJyZW50UGFnZTogMSxcbiAgICB0b3RhbFBvc3RzOiAwXG4gIH07XG59XG5cbnZtLnNlbmRDb21tZW50ID0gKG5hbWUsIGNvbW1lbnQpID0+IHtcbiAgbGV0IGVycm9ycyA9IFtdO1xuXG4gIGlmICghbmFtZSkge1xuICAgIGVycm9ycy5wdXNoKHtpZDogJyNjb21tZW50LW5hbWUnLCBtc2c6ICdNaXNzaW5nIG5hbWUnfSk7XG4gIH1cblxuICBpZiAoIWNvbW1lbnQpIHtcbiAgICBlcnJvcnMucHVzaCh7aWQ6ICcjY29tbWVudC1jb250ZW50JywgbXNnOiAnTWlzc2luZyBjb250ZW50J30pO1xuICB9XG5cbiAgaWYgKGVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHJlamVjdChlcnJvcnMpKTtcbiAgfVxuXG4gIHJldHVybiBoZWxwZXJzXG4gICAgLnBvc3QoY29tbWVudEl0ZW1FbmRwb2ludCwge1xuICAgICAgaXRlbV90eXBlOiBcImNvbW1lbnRcIixcbiAgICAgIGNsaWVudF9ibG9nOiBMQi5ibG9nLl9pZCxcbiAgICAgIGNvbW1lbnRlcjogbmFtZSxcbiAgICAgIHRleHQ6IGNvbW1lbnRcbiAgICB9KVxuICAgIC50aGVuKChpdGVtKSA9PiBoZWxwZXJzLnBvc3QoY29tbWVudFBvc3RFbmRwb2ludCwge1xuICAgICAgcG9zdF9zdGF0dXM6IFwiY29tbWVudFwiLFxuICAgICAgY2xpZW50X2Jsb2c6IExCLmJsb2cuX2lkLFxuICAgICAgZ3JvdXBzOiBbe1xuICAgICAgICBpZDogXCJyb290XCIsXG4gICAgICAgIHJlZnM6IFt7aWRSZWY6IFwibWFpblwifV0sXG4gICAgICAgIHJvbGU6IFwiZ3JwUm9sZTpORVBcIlxuICAgICAgfSx7XG4gICAgICAgIGlkOiBcIm1haW5cIixcbiAgICAgICAgcmVmczogW3tyZXNpZFJlZjogaXRlbS5faWR9XSxcbiAgICAgICAgcm9sZTogXCJncnBSb2xlOk1haW5cIn1cbiAgICAgIF1cbiAgICB9KSk7XG4gICAgLy8uY2F0Y2goKGVycikgPT4ge1xuICAgIC8vICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgLy99KTtcbn07XG5cbi8qKlxuICogUHJpdmF0ZSBBUEkgcmVxdWVzdCBtZXRob2RcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0gcXVlcnkgYnVpbGRlciBvcHRpb25zLlxuICogQHBhcmFtIHtudW1iZXJ9IG9wdHMucGFnZSAtIGRlc2lyZWQgcGFnZS9zdWJzZXQgb2YgcG9zdHMsIGxlYXZlIGVtcHR5IGZvciBwb2xsaW5nLlxuICogQHBhcmFtIHtudW1iZXJ9IG9wdHMuZnJvbURhdGUgLSBuZWVkZWQgZm9yIHBvbGxpbmcuXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBMaXZlYmxvZyAzIEFQSSByZXNwb25zZVxuICovXG52bS5nZXRQb3N0cyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBkYlF1ZXJ5ID0gc2VsZi5nZXRRdWVyeSh7XG4gICAgc29ydDogb3B0cy5zb3J0IHx8IHNlbGYuc2V0dGluZ3MucG9zdE9yZGVyLFxuICAgIGhpZ2hsaWdodHNPbmx5OiBmYWxzZSB8fCBvcHRzLmhpZ2hsaWdodHNPbmx5LFxuICAgIGZyb21EYXRlOiBvcHRzLmZyb21EYXRlXG4gICAgICA/IG9wdHMuZnJvbURhdGVcbiAgICAgIDogZmFsc2VcbiAgfSk7XG5cbiAgdmFyIHBhZ2UgPSBvcHRzLmZyb21EYXRlID8gMSA6IG9wdHMucGFnZTtcbiAgdmFyIHFzID0gXCI/bWF4X3Jlc3VsdHM9XCIgKyBzZXR0aW5ncy5wb3N0c1BlclBhZ2UgKyBcIiZwYWdlPVwiICsgcGFnZSArIFwiJnNvdXJjZT1cIlxuICAgICwgZnVsbFBhdGggPSBlbmRwb2ludCArIHFzICsgZGJRdWVyeTtcblxuICByZXR1cm4gaGVscGVycy5nZXRKU09OKGZ1bGxQYXRoKVxuICAgIC50aGVuKChwb3N0cykgPT4ge1xuICAgICAgc2VsZi51cGRhdGVWaWV3TW9kZWwocG9zdHMsIG9wdHMpO1xuICAgICAgcG9zdHMucmVxdWVzdE9wdHMgPSBvcHRzO1xuICAgICAgcmV0dXJuIHBvc3RzO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogR2V0IG5leHQgcGFnZSBvZiBwb3N0cyBmcm9tIEFQSS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0gcXVlcnkgYnVpbGRlciBvcHRpb25zLlxuICogQHJldHVybnMge3Byb21pc2V9IHJlc29sdmVzIHRvIHBvc3RzIGFycmF5LlxuICovXG52bS5sb2FkUG9zdHNQYWdlID0gZnVuY3Rpb24ob3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgb3B0cy5wYWdlID0gKyt0aGlzLnZtLmN1cnJlbnRQYWdlO1xuICBvcHRzLnNvcnQgPSB0aGlzLnNldHRpbmdzLnBvc3RPcmRlcjtcbiAgcmV0dXJuIHRoaXMuZ2V0UG9zdHMob3B0cyk7XG59O1xuXG4vKipcbiAqIFBvbGwgQVBJIGZvciBuZXcgcG9zdHMuXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIHF1ZXJ5IGJ1aWxkZXIgb3B0aW9ucy5cbiAqIEByZXR1cm5zIHtwcm9taXNlfSByZXNvbHZlcyB0byBwb3N0cyBhcnJheS5cbiAqL1xudm0ubG9hZFBvc3RzID0gZnVuY3Rpb24ob3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgb3B0cy5mcm9tRGF0ZSA9IHRoaXMudm0ubGF0ZXN0VXBkYXRlO1xuICByZXR1cm4gdGhpcy5nZXRQb3N0cyhvcHRzKTtcbn07XG5cbi8qKlxuICogQWRkIGl0ZW1zIGluIGFwaSByZXNwb25zZSAmIGxhdGVzdCB1cGRhdGUgdGltZXN0YW1wIHRvIHZpZXdtb2RlbC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBhcGlfcmVzcG9uc2UgLSBsaXZlYmxvZyBBUEkgcmVzcG9uc2UgSlNPTi5cbiAqL1xudm0udXBkYXRlVmlld01vZGVsID0gZnVuY3Rpb24oYXBpX3Jlc3BvbnNlLCBvcHRzKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAoIW9wdHMuZnJvbURhdGUgfHwgb3B0cy5zb3J0ICE9PSBzZWxmLnNldHRpbmdzLnBvc3RPcmRlcikgeyAvLyBNZWFucyB3ZSdyZSBub3QgcG9sbGluZ1xuICAgIHZpZXcuaGlkZUxvYWRNb3JlKHNlbGYuaXNUaW1lbGluZUVuZChhcGlfcmVzcG9uc2UpKTsgLy8gdGhlIGVuZD9cbiAgfSBlbHNlIHsgLy8gTWVhbnMgd2UncmUgcG9sbGluZyBmb3IgbmV3IHBvc3RzXG4gICAgaWYgKCFhcGlfcmVzcG9uc2UuX2l0ZW1zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYudm0ubGF0ZXN0VXBkYXRlID0gc2VsZi5nZXRMYXRlc3RVcGRhdGUoYXBpX3Jlc3BvbnNlKTtcbiAgfVxuXG4gIGlmIChvcHRzLnNvcnQgIT09IHNlbGYuc2V0dGluZ3MucG9zdE9yZGVyKSB7XG4gICAgc2VsZi52bSA9IGdldEVtcHR5Vm0oKTtcbiAgICB2aWV3LmhpZGVMb2FkTW9yZShmYWxzZSk7XG4gICAgT2JqZWN0LmFzc2lnbihzZWxmLnZtLCBhcGlfcmVzcG9uc2UpO1xuICB9IGVsc2Uge1xuICAgIHNlbGYudm0uX2l0ZW1zLnB1c2guYXBwbHkoc2VsZi52bS5faXRlbXMsIGFwaV9yZXNwb25zZS5faXRlbXMpO1xuICB9XG5cbiAgc2VsZi5zZXR0aW5ncy5wb3N0T3JkZXIgPSBvcHRzLnNvcnQ7XG4gIHJldHVybiBhcGlfcmVzcG9uc2U7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgbGF0ZXN0IHVwZGF0ZSB0aW1lc3RhbXAgZnJvbSBhIG51bWJlciBvZiBwb3N0cy5cbiAqIEBwYXJhbSB7b2JqZWN0fSBhcGlfcmVzcG9uc2UgLSBsaXZlYmxvZyBBUEkgcmVzcG9uc2UgSlNPTi5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IC0gSVNPIDg2MDEgZW5jb2RlZCBkYXRlXG4gKi9cbnZtLmdldExhdGVzdFVwZGF0ZSA9IGZ1bmN0aW9uKGFwaV9yZXNwb25zZSkge1xuICB2YXIgdGltZXN0YW1wcyA9IGFwaV9yZXNwb25zZS5faXRlbXMubWFwKChwb3N0KSA9PiBuZXcgRGF0ZShwb3N0Ll91cGRhdGVkKSk7XG5cbiAgdmFyIGxhdGVzdCA9IG5ldyBEYXRlKE1hdGgubWF4LmFwcGx5KG51bGwsIHRpbWVzdGFtcHMpKTtcbiAgcmV0dXJuIGxhdGVzdC50b0lTT1N0cmluZygpOyAvLyBjb252ZXJ0IHRpbWVzdGFtcCB0byBJU09cbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgd2UgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSB0aW1lbGluZS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBhcGlfcmVzcG9uc2UgLSBsaXZlYmxvZyBBUEkgcmVzcG9uc2UgSlNPTi5cbiAqIEByZXR1cm5zIHtib29sfVxuICovXG52bS5pc1RpbWVsaW5lRW5kID0gZnVuY3Rpb24oYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciBpdGVtc0luVmlldyA9IHRoaXMudm0uX2l0ZW1zLmxlbmd0aCArIHNldHRpbmdzLnBvc3RzUGVyUGFnZTtcbiAgcmV0dXJuIGFwaV9yZXNwb25zZS5fbWV0YS50b3RhbCA8PSBpdGVtc0luVmlldztcbn07XG5cbi8qKlxuICogU2V0IHVwIHZpZXdtb2RlbC5cbiAqL1xudm0uaW5pdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gIHRoaXMudm0gPSBnZXRFbXB0eVZtKHNldHRpbmdzLnBvc3RzUGVyUGFnZSk7XG4gIHRoaXMudm0ubGF0ZXN0VXBkYXRlID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICB0aGlzLnZtLnRpbWVJbml0aWFsaXplZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgcmV0dXJuIHRoaXMudm0ubGF0ZXN0VXBkYXRlO1xufTtcblxuLyoqXG4gKiBCdWlsZCB1cmxlbmNvZGVkIEVsYXN0aWNTZWFyY2ggUXVlcnlzdHJpbmdcbiAqIFRPRE86IGFic3RyYWN0IGF3YXksIHdlIG9ubHkgbmVlZCBzdGlja3kgZmxhZyBhbmQgb3JkZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gYXJndW1lbnRzIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IG9wdHMuc29ydCAtIGlmIFwiYXNjZW5kaW5nXCIsIGdldCBpdGVtcyBpbiBhc2NlbmRpbmcgb3JkZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLmZyb21EYXRlIC0gcmVzdWx0cyB3aXRoIGEgSVNPIDg2MDEgdGltZXN0YW1wIGd0IHRoaXMgb25seVxuICogQHBhcmFtIHtib29sfSBvcHRzLmhpZ2hsaWdodHNPbmx5IC0gZ2V0IGVkaXRvcmlhbC9oaWdobGlnaHRlZCBpdGVtcyBvbmx5XG4gKiBAcmV0dXJucyB7c3RyaW5nfSBRdWVyeXN0cmluZ1xuICovXG52bS5nZXRRdWVyeSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgdmFyIHF1ZXJ5ID0ge1xuICAgIFwicXVlcnlcIjoge1xuICAgICAgXCJmaWx0ZXJlZFwiOiB7XG4gICAgICAgIFwiZmlsdGVyXCI6IHtcbiAgICAgICAgICBcImFuZFwiOiBbXG4gICAgICAgICAgICB7XCJ0ZXJtXCI6IHtcInN0aWNreVwiOiBmYWxzZX19LFxuICAgICAgICAgICAge1widGVybVwiOiB7XCJwb3N0X3N0YXR1c1wiOiBcIm9wZW5cIn19LFxuICAgICAgICAgICAge1wibm90XCI6IHtcInRlcm1cIjoge1wiZGVsZXRlZFwiOiB0cnVlfX19LFxuICAgICAgICAgICAge1wicmFuZ2VcIjoge1wiX3VwZGF0ZWRcIjoge1wibHRcIjogdGhpcy52bS50aW1lSW5pdGlhbGl6ZWR9fX1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFwic29ydFwiOiBbXG4gICAgICB7XG4gICAgICAgIFwiX3VwZGF0ZWRcIjoge1wib3JkZXJcIjogXCJkZXNjXCJ9XG4gICAgICB9XG4gICAgXVxuICB9O1xuXG4gIGlmIChvcHRzLmZyb21EYXRlKSB7XG4gICAgcXVlcnkucXVlcnkuZmlsdGVyZWQuZmlsdGVyLmFuZFszXS5yYW5nZS5fdXBkYXRlZCA9IHtcbiAgICAgIFwiZ3RcIjogb3B0cy5mcm9tRGF0ZVxuICAgIH07XG4gIH1cblxuICBpZiAob3B0cy5oaWdobGlnaHRzT25seSA9PT0gdHJ1ZSkge1xuICAgIHF1ZXJ5LnF1ZXJ5LmZpbHRlcmVkLmZpbHRlci5hbmQucHVzaCh7XG4gICAgICB0ZXJtOiB7aGlnaGxpZ2h0OiB0cnVlfVxuICAgIH0pO1xuICB9XG5cbiAgaWYgKG9wdHMuc29ydCA9PT0gXCJhc2NlbmRpbmdcIikge1xuICAgIHF1ZXJ5LnNvcnRbMF0uX3VwZGF0ZWQub3JkZXIgPSBcImFzY1wiO1xuICB9IGVsc2UgaWYgKG9wdHMuc29ydCA9PT0gXCJlZGl0b3JpYWxcIikge1xuICAgIHF1ZXJ5LnNvcnQgPSBbXG4gICAgICB7XG4gICAgICAgIG9yZGVyOiB7XG4gICAgICAgICAgb3JkZXI6IFwiZGVzY1wiLFxuICAgICAgICAgIG1pc3Npbmc6IFwiX2xhc3RcIixcbiAgICAgICAgICB1bm1hcHBlZF90eXBlOiBcImxvbmdcIlxuICAgICAgICB9XG4gICAgICB9XG4gICAgXTtcbiAgfVxuXG4gIC8vIFJlbW92ZSB0aGUgcmFuZ2UsIHdlIHdhbnQgYWxsIHRoZSByZXN1bHRzXG4gIGlmIChbXCJhc2NlbmRpbmdcIiwgXCJkZXNjZW5kaW5nXCIsIFwiZWRpdG9yaWFsXCJdLmluZGV4T2Yob3B0cy5zb3J0KSkge1xuICAgIHF1ZXJ5LnF1ZXJ5LmZpbHRlcmVkLmZpbHRlci5hbmQuZm9yRWFjaCgocnVsZSwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChydWxlLmhhc093blByb3BlcnR5KCdyYW5nZScpKSB7XG4gICAgICAgIHF1ZXJ5LnF1ZXJ5LmZpbHRlcmVkLmZpbHRlci5hbmQuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBlbmNvZGVVUkkoSlNPTi5zdHJpbmdpZnkocXVlcnkpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdm07XG4iLCIvKiEgQnJvd3NlciBidW5kbGUgb2YgbnVuanVja3MgMy4wLjAgKHNsaW0sIG9ubHkgd29ya3Mgd2l0aCBwcmVjb21waWxlZCB0ZW1wbGF0ZXMpICovXG4oZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJudW5qdWNrc1wiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJudW5qdWNrc1wiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIC8qKioqKiovIChmdW5jdGlvbihtb2R1bGVzKSB7IC8vIHdlYnBhY2tCb290c3RyYXBcbi8qKioqKiovIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4vKioqKioqLyBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuLyoqKioqKi8gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbi8qKioqKiovIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9LFxuLyoqKioqKi8gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdFx0bG9hZGVkOiBmYWxzZVxuLyoqKioqKi8gXHRcdH07XG5cbi8qKioqKiovIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuLyoqKioqKi8gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbi8qKioqKiovIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuLyoqKioqKi8gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG5cblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuLyoqKioqKi8gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8qKioqKiovIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG4vKioqKioqLyB9KVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIChbXG4vKiAwICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cdHZhciBlbnYgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDIpO1xuXHR2YXIgTG9hZGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygxNCk7XG5cdHZhciBsb2FkZXJzID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIHByZWNvbXBpbGUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXG5cdG1vZHVsZS5leHBvcnRzID0ge307XG5cdG1vZHVsZS5leHBvcnRzLkVudmlyb25tZW50ID0gZW52LkVudmlyb25tZW50O1xuXHRtb2R1bGUuZXhwb3J0cy5UZW1wbGF0ZSA9IGVudi5UZW1wbGF0ZTtcblxuXHRtb2R1bGUuZXhwb3J0cy5Mb2FkZXIgPSBMb2FkZXI7XG5cdG1vZHVsZS5leHBvcnRzLkZpbGVTeXN0ZW1Mb2FkZXIgPSBsb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXI7XG5cdG1vZHVsZS5leHBvcnRzLlByZWNvbXBpbGVkTG9hZGVyID0gbG9hZGVycy5QcmVjb21waWxlZExvYWRlcjtcblx0bW9kdWxlLmV4cG9ydHMuV2ViTG9hZGVyID0gbG9hZGVycy5XZWJMb2FkZXI7XG5cblx0bW9kdWxlLmV4cG9ydHMuY29tcGlsZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHRtb2R1bGUuZXhwb3J0cy5wYXJzZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHRtb2R1bGUuZXhwb3J0cy5sZXhlciA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdG1vZHVsZS5leHBvcnRzLnJ1bnRpbWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDgpO1xuXHRtb2R1bGUuZXhwb3J0cy5saWIgPSBsaWI7XG5cdG1vZHVsZS5leHBvcnRzLm5vZGVzID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHRtb2R1bGUuZXhwb3J0cy5pbnN0YWxsSmluamFDb21wYXQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDE1KTtcblxuXHQvLyBBIHNpbmdsZSBpbnN0YW5jZSBvZiBhbiBlbnZpcm9ubWVudCwgc2luY2UgdGhpcyBpcyBzbyBjb21tb25seSB1c2VkXG5cblx0dmFyIGU7XG5cdG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uKHRlbXBsYXRlc1BhdGgsIG9wdHMpIHtcblx0ICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXHQgICAgaWYobGliLmlzT2JqZWN0KHRlbXBsYXRlc1BhdGgpKSB7XG5cdCAgICAgICAgb3B0cyA9IHRlbXBsYXRlc1BhdGg7XG5cdCAgICAgICAgdGVtcGxhdGVzUGF0aCA9IG51bGw7XG5cdCAgICB9XG5cblx0ICAgIHZhciBUZW1wbGF0ZUxvYWRlcjtcblx0ICAgIGlmKGxvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcikge1xuXHQgICAgICAgIFRlbXBsYXRlTG9hZGVyID0gbmV3IGxvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcih0ZW1wbGF0ZXNQYXRoLCB7XG5cdCAgICAgICAgICAgIHdhdGNoOiBvcHRzLndhdGNoLFxuXHQgICAgICAgICAgICBub0NhY2hlOiBvcHRzLm5vQ2FjaGVcblx0ICAgICAgICB9KTtcblx0ICAgIH1cblx0ICAgIGVsc2UgaWYobG9hZGVycy5XZWJMb2FkZXIpIHtcblx0ICAgICAgICBUZW1wbGF0ZUxvYWRlciA9IG5ldyBsb2FkZXJzLldlYkxvYWRlcih0ZW1wbGF0ZXNQYXRoLCB7XG5cdCAgICAgICAgICAgIHVzZUNhY2hlOiBvcHRzLndlYiAmJiBvcHRzLndlYi51c2VDYWNoZSxcblx0ICAgICAgICAgICAgYXN5bmM6IG9wdHMud2ViICYmIG9wdHMud2ViLmFzeW5jXG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIGUgPSBuZXcgZW52LkVudmlyb25tZW50KFRlbXBsYXRlTG9hZGVyLCBvcHRzKTtcblxuXHQgICAgaWYob3B0cyAmJiBvcHRzLmV4cHJlc3MpIHtcblx0ICAgICAgICBlLmV4cHJlc3Mob3B0cy5leHByZXNzKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIGU7XG5cdH07XG5cblx0bW9kdWxlLmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uKHNyYywgZW52LCBwYXRoLCBlYWdlckNvbXBpbGUpIHtcblx0ICAgIGlmKCFlKSB7XG5cdCAgICAgICAgbW9kdWxlLmV4cG9ydHMuY29uZmlndXJlKCk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbmV3IG1vZHVsZS5leHBvcnRzLlRlbXBsYXRlKHNyYywgZW52LCBwYXRoLCBlYWdlckNvbXBpbGUpO1xuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIGN0eCwgY2IpIHtcblx0ICAgIGlmKCFlKSB7XG5cdCAgICAgICAgbW9kdWxlLmV4cG9ydHMuY29uZmlndXJlKCk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBlLnJlbmRlcihuYW1lLCBjdHgsIGNiKTtcblx0fTtcblxuXHRtb2R1bGUuZXhwb3J0cy5yZW5kZXJTdHJpbmcgPSBmdW5jdGlvbihzcmMsIGN0eCwgY2IpIHtcblx0ICAgIGlmKCFlKSB7XG5cdCAgICAgICAgbW9kdWxlLmV4cG9ydHMuY29uZmlndXJlKCk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBlLnJlbmRlclN0cmluZyhzcmMsIGN0eCwgY2IpO1xuXHR9O1xuXG5cdGlmKHByZWNvbXBpbGUpIHtcblx0ICAgIG1vZHVsZS5leHBvcnRzLnByZWNvbXBpbGUgPSBwcmVjb21waWxlLnByZWNvbXBpbGU7XG5cdCAgICBtb2R1bGUuZXhwb3J0cy5wcmVjb21waWxlU3RyaW5nID0gcHJlY29tcGlsZS5wcmVjb21waWxlU3RyaW5nO1xuXHR9XG5cblxuLyoqKi8gfSxcbi8qIDEgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZTtcblx0dmFyIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuXHR2YXIgZXNjYXBlTWFwID0ge1xuXHQgICAgJyYnOiAnJmFtcDsnLFxuXHQgICAgJ1wiJzogJyZxdW90OycsXG5cdCAgICAnXFwnJzogJyYjMzk7Jyxcblx0ICAgICc8JzogJyZsdDsnLFxuXHQgICAgJz4nOiAnJmd0Oydcblx0fTtcblxuXHR2YXIgZXNjYXBlUmVnZXggPSAvWyZcIic8Pl0vZztcblxuXHR2YXIgbG9va3VwRXNjYXBlID0gZnVuY3Rpb24oY2gpIHtcblx0ICAgIHJldHVybiBlc2NhcGVNYXBbY2hdO1xuXHR9O1xuXG5cdHZhciBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuXHRleHBvcnRzLnByZXR0aWZ5RXJyb3IgPSBmdW5jdGlvbihwYXRoLCB3aXRoSW50ZXJuYWxzLCBlcnIpIHtcblx0ICAgIC8vIGpzaGludCAtVzAyMlxuXHQgICAgLy8gaHR0cDovL2pzbGludGVycm9ycy5jb20vZG8tbm90LWFzc2lnbi10by10aGUtZXhjZXB0aW9uLXBhcmFtZXRlclxuXHQgICAgaWYgKCFlcnIuVXBkYXRlKSB7XG5cdCAgICAgICAgLy8gbm90IG9uZSBvZiBvdXJzLCBjYXN0IGl0XG5cdCAgICAgICAgZXJyID0gbmV3IGV4cG9ydHMuVGVtcGxhdGVFcnJvcihlcnIpO1xuXHQgICAgfVxuXHQgICAgZXJyLlVwZGF0ZShwYXRoKTtcblxuXHQgICAgLy8gVW5sZXNzIHRoZXkgbWFya2VkIHRoZSBkZXYgZmxhZywgc2hvdyB0aGVtIGEgdHJhY2UgZnJvbSBoZXJlXG5cdCAgICBpZiAoIXdpdGhJbnRlcm5hbHMpIHtcblx0ICAgICAgICB2YXIgb2xkID0gZXJyO1xuXHQgICAgICAgIGVyciA9IG5ldyBFcnJvcihvbGQubWVzc2FnZSk7XG5cdCAgICAgICAgZXJyLm5hbWUgPSBvbGQubmFtZTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIGVycjtcblx0fTtcblxuXHRleHBvcnRzLlRlbXBsYXRlRXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlLCBsaW5lbm8sIGNvbG5vKSB7XG5cdCAgICB2YXIgZXJyID0gdGhpcztcblxuXHQgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBFcnJvcikgeyAvLyBmb3IgY2FzdGluZyByZWd1bGFyIGpzIGVycm9yc1xuXHQgICAgICAgIGVyciA9IG1lc3NhZ2U7XG5cdCAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UubmFtZSArICc6ICcgKyBtZXNzYWdlLm1lc3NhZ2U7XG5cblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICBpZihlcnIubmFtZSA9ICcnKSB7fVxuXHQgICAgICAgIH1cblx0ICAgICAgICBjYXRjaChlKSB7XG5cdCAgICAgICAgICAgIC8vIElmIHdlIGNhbid0IHNldCB0aGUgbmFtZSBvZiB0aGUgZXJyb3Igb2JqZWN0IGluIHRoaXNcblx0ICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQsIGRvbid0IHVzZSBpdFxuXHQgICAgICAgICAgICBlcnIgPSB0aGlzO1xuXHQgICAgICAgIH1cblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgaWYoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcblx0ICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoZXJyKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGVyci5uYW1lID0gJ1RlbXBsYXRlIHJlbmRlciBlcnJvcic7XG5cdCAgICBlcnIubWVzc2FnZSA9IG1lc3NhZ2U7XG5cdCAgICBlcnIubGluZW5vID0gbGluZW5vO1xuXHQgICAgZXJyLmNvbG5vID0gY29sbm87XG5cdCAgICBlcnIuZmlyc3RVcGRhdGUgPSB0cnVlO1xuXG5cdCAgICBlcnIuVXBkYXRlID0gZnVuY3Rpb24ocGF0aCkge1xuXHQgICAgICAgIHZhciBtZXNzYWdlID0gJygnICsgKHBhdGggfHwgJ3Vua25vd24gcGF0aCcpICsgJyknO1xuXG5cdCAgICAgICAgLy8gb25seSBzaG93IGxpbmVubyArIGNvbG5vIG5leHQgdG8gcGF0aCBvZiB0ZW1wbGF0ZVxuXHQgICAgICAgIC8vIHdoZXJlIGVycm9yIG9jY3VycmVkXG5cdCAgICAgICAgaWYgKHRoaXMuZmlyc3RVcGRhdGUpIHtcblx0ICAgICAgICAgICAgaWYodGhpcy5saW5lbm8gJiYgdGhpcy5jb2xubykge1xuXHQgICAgICAgICAgICAgICAgbWVzc2FnZSArPSAnIFtMaW5lICcgKyB0aGlzLmxpbmVubyArICcsIENvbHVtbiAnICsgdGhpcy5jb2xubyArICddJztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKHRoaXMubGluZW5vKSB7XG5cdCAgICAgICAgICAgICAgICBtZXNzYWdlICs9ICcgW0xpbmUgJyArIHRoaXMubGluZW5vICsgJ10nO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgbWVzc2FnZSArPSAnXFxuICc7XG5cdCAgICAgICAgaWYgKHRoaXMuZmlyc3RVcGRhdGUpIHtcblx0ICAgICAgICAgICAgbWVzc2FnZSArPSAnICc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSArICh0aGlzLm1lc3NhZ2UgfHwgJycpO1xuXHQgICAgICAgIHRoaXMuZmlyc3RVcGRhdGUgPSBmYWxzZTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH07XG5cblx0ICAgIHJldHVybiBlcnI7XG5cdH07XG5cblx0ZXhwb3J0cy5UZW1wbGF0ZUVycm9yLnByb3RvdHlwZSA9IEVycm9yLnByb3RvdHlwZTtcblxuXHRleHBvcnRzLmVzY2FwZSA9IGZ1bmN0aW9uKHZhbCkge1xuXHQgIHJldHVybiB2YWwucmVwbGFjZShlc2NhcGVSZWdleCwgbG9va3VwRXNjYXBlKTtcblx0fTtcblxuXHRleHBvcnRzLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cdH07XG5cblx0ZXhwb3J0cy5pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG5cdH07XG5cblx0ZXhwb3J0cy5pc1N0cmluZyA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgU3RyaW5nXSc7XG5cdH07XG5cblx0ZXhwb3J0cy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cdH07XG5cblx0ZXhwb3J0cy5ncm91cEJ5ID0gZnVuY3Rpb24ob2JqLCB2YWwpIHtcblx0ICAgIHZhciByZXN1bHQgPSB7fTtcblx0ICAgIHZhciBpdGVyYXRvciA9IGV4cG9ydHMuaXNGdW5jdGlvbih2YWwpID8gdmFsIDogZnVuY3Rpb24ob2JqKSB7IHJldHVybiBvYmpbdmFsXTsgfTtcblx0ICAgIGZvcih2YXIgaT0wOyBpPG9iai5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgIHZhciB2YWx1ZSA9IG9ialtpXTtcblx0ICAgICAgICB2YXIga2V5ID0gaXRlcmF0b3IodmFsdWUsIGkpO1xuXHQgICAgICAgIChyZXN1bHRba2V5XSB8fCAocmVzdWx0W2tleV0gPSBbXSkpLnB1c2godmFsdWUpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHJlc3VsdDtcblx0fTtcblxuXHRleHBvcnRzLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChvYmopO1xuXHR9O1xuXG5cdGV4cG9ydHMud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG5cdCAgICB2YXIgcmVzdWx0ID0gW107XG5cdCAgICBpZiAoIWFycmF5KSB7XG5cdCAgICAgICAgcmV0dXJuIHJlc3VsdDtcblx0ICAgIH1cblx0ICAgIHZhciBpbmRleCA9IC0xLFxuXHQgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuXHQgICAgY29udGFpbnMgPSBleHBvcnRzLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcblxuXHQgICAgd2hpbGUoKytpbmRleCA8IGxlbmd0aCkge1xuXHQgICAgICAgIGlmKGV4cG9ydHMuaW5kZXhPZihjb250YWlucywgYXJyYXlbaW5kZXhdKSA9PT0gLTEpIHtcblx0ICAgICAgICAgICAgcmVzdWx0LnB1c2goYXJyYXlbaW5kZXhdKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gcmVzdWx0O1xuXHR9O1xuXG5cdGV4cG9ydHMuZXh0ZW5kID0gZnVuY3Rpb24ob2JqLCBvYmoyKSB7XG5cdCAgICBmb3IodmFyIGsgaW4gb2JqMikge1xuXHQgICAgICAgIG9ialtrXSA9IG9iajJba107XG5cdCAgICB9XG5cdCAgICByZXR1cm4gb2JqO1xuXHR9O1xuXG5cdGV4cG9ydHMucmVwZWF0ID0gZnVuY3Rpb24oY2hhcl8sIG4pIHtcblx0ICAgIHZhciBzdHIgPSAnJztcblx0ICAgIGZvcih2YXIgaT0wOyBpPG47IGkrKykge1xuXHQgICAgICAgIHN0ciArPSBjaGFyXztcblx0ICAgIH1cblx0ICAgIHJldHVybiBzdHI7XG5cdH07XG5cblx0ZXhwb3J0cy5lYWNoID0gZnVuY3Rpb24ob2JqLCBmdW5jLCBjb250ZXh0KSB7XG5cdCAgICBpZihvYmogPT0gbnVsbCkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgaWYoQXJyYXlQcm90by5lYWNoICYmIG9iai5lYWNoID09PSBBcnJheVByb3RvLmVhY2gpIHtcblx0ICAgICAgICBvYmouZm9yRWFjaChmdW5jLCBjb250ZXh0KTtcblx0ICAgIH1cblx0ICAgIGVsc2UgaWYob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcblx0ICAgICAgICBmb3IodmFyIGk9MCwgbD1vYmoubGVuZ3RoOyBpPGw7IGkrKykge1xuXHQgICAgICAgICAgICBmdW5jLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0fTtcblxuXHRleHBvcnRzLm1hcCA9IGZ1bmN0aW9uKG9iaiwgZnVuYykge1xuXHQgICAgdmFyIHJlc3VsdHMgPSBbXTtcblx0ICAgIGlmKG9iaiA9PSBudWxsKSB7XG5cdCAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG5cdCAgICB9XG5cblx0ICAgIGlmKEFycmF5UHJvdG8ubWFwICYmIG9iai5tYXAgPT09IEFycmF5UHJvdG8ubWFwKSB7XG5cdCAgICAgICAgcmV0dXJuIG9iai5tYXAoZnVuYyk7XG5cdCAgICB9XG5cblx0ICAgIGZvcih2YXIgaT0wOyBpPG9iai5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgIHJlc3VsdHNbcmVzdWx0cy5sZW5ndGhdID0gZnVuYyhvYmpbaV0sIGkpO1xuXHQgICAgfVxuXG5cdCAgICBpZihvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuXHQgICAgICAgIHJlc3VsdHMubGVuZ3RoID0gb2JqLmxlbmd0aDtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHJlc3VsdHM7XG5cdH07XG5cblx0ZXhwb3J0cy5hc3luY0l0ZXIgPSBmdW5jdGlvbihhcnIsIGl0ZXIsIGNiKSB7XG5cdCAgICB2YXIgaSA9IC0xO1xuXG5cdCAgICBmdW5jdGlvbiBuZXh0KCkge1xuXHQgICAgICAgIGkrKztcblxuXHQgICAgICAgIGlmKGkgPCBhcnIubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIGl0ZXIoYXJyW2ldLCBpLCBuZXh0LCBjYik7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBjYigpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgbmV4dCgpO1xuXHR9O1xuXG5cdGV4cG9ydHMuYXN5bmNGb3IgPSBmdW5jdGlvbihvYmosIGl0ZXIsIGNiKSB7XG5cdCAgICB2YXIga2V5cyA9IGV4cG9ydHMua2V5cyhvYmopO1xuXHQgICAgdmFyIGxlbiA9IGtleXMubGVuZ3RoO1xuXHQgICAgdmFyIGkgPSAtMTtcblxuXHQgICAgZnVuY3Rpb24gbmV4dCgpIHtcblx0ICAgICAgICBpKys7XG5cdCAgICAgICAgdmFyIGsgPSBrZXlzW2ldO1xuXG5cdCAgICAgICAgaWYoaSA8IGxlbikge1xuXHQgICAgICAgICAgICBpdGVyKGssIG9ialtrXSwgaSwgbGVuLCBuZXh0KTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGNiKCk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBuZXh0KCk7XG5cdH07XG5cblx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvaW5kZXhPZiNQb2x5ZmlsbFxuXHRleHBvcnRzLmluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA/XG5cdCAgICBmdW5jdGlvbiAoYXJyLCBzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcblx0ICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCk7XG5cdCAgICB9IDpcblx0ICAgIGZ1bmN0aW9uIChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuXHQgICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCA+Pj4gMDsgLy8gSGFjayB0byBjb252ZXJ0IG9iamVjdC5sZW5ndGggdG8gYSBVSW50MzJcblxuXHQgICAgICAgIGZyb21JbmRleCA9ICtmcm9tSW5kZXggfHwgMDtcblxuXHQgICAgICAgIGlmKE1hdGguYWJzKGZyb21JbmRleCkgPT09IEluZmluaXR5KSB7XG5cdCAgICAgICAgICAgIGZyb21JbmRleCA9IDA7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYoZnJvbUluZGV4IDwgMCkge1xuXHQgICAgICAgICAgICBmcm9tSW5kZXggKz0gbGVuZ3RoO1xuXHQgICAgICAgICAgICBpZiAoZnJvbUluZGV4IDwgMCkge1xuXHQgICAgICAgICAgICAgICAgZnJvbUluZGV4ID0gMDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZvcig7ZnJvbUluZGV4IDwgbGVuZ3RoOyBmcm9tSW5kZXgrKykge1xuXHQgICAgICAgICAgICBpZiAoYXJyW2Zyb21JbmRleF0gPT09IHNlYXJjaEVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmcm9tSW5kZXg7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gLTE7XG5cdCAgICB9O1xuXG5cdGlmKCFBcnJheS5wcm90b3R5cGUubWFwKSB7XG5cdCAgICBBcnJheS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYXAgaXMgdW5pbXBsZW1lbnRlZCBmb3IgdGhpcyBqcyBlbmdpbmUnKTtcblx0ICAgIH07XG5cdH1cblxuXHRleHBvcnRzLmtleXMgPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIGlmKE9iamVjdC5wcm90b3R5cGUua2V5cykge1xuXHQgICAgICAgIHJldHVybiBvYmoua2V5cygpO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgdmFyIGtleXMgPSBbXTtcblx0ICAgICAgICBmb3IodmFyIGsgaW4gb2JqKSB7XG5cdCAgICAgICAgICAgIGlmKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHQgICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBrZXlzO1xuXHQgICAgfVxuXHR9O1xuXG5cdGV4cG9ydHMuaW5PcGVyYXRvciA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuXHQgICAgaWYgKGV4cG9ydHMuaXNBcnJheSh2YWwpKSB7XG5cdCAgICAgICAgcmV0dXJuIGV4cG9ydHMuaW5kZXhPZih2YWwsIGtleSkgIT09IC0xO1xuXHQgICAgfSBlbHNlIGlmIChleHBvcnRzLmlzT2JqZWN0KHZhbCkpIHtcblx0ICAgICAgICByZXR1cm4ga2V5IGluIHZhbDtcblx0ICAgIH0gZWxzZSBpZiAoZXhwb3J0cy5pc1N0cmluZyh2YWwpKSB7XG5cdCAgICAgICAgcmV0dXJuIHZhbC5pbmRleE9mKGtleSkgIT09IC0xO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB1c2UgXCJpblwiIG9wZXJhdG9yIHRvIHNlYXJjaCBmb3IgXCInXG5cdCAgICAgICAgICAgICsga2V5ICsgJ1wiIGluIHVuZXhwZWN0ZWQgdHlwZXMuJyk7XG5cdCAgICB9XG5cdH07XG5cblxuLyoqKi8gfSxcbi8qIDIgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgcGF0aCA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBhc2FwID0gX193ZWJwYWNrX3JlcXVpcmVfXyg0KTtcblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cdHZhciBPYmogPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDYpO1xuXHR2YXIgY29tcGlsZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgYnVpbHRpbl9maWx0ZXJzID0gX193ZWJwYWNrX3JlcXVpcmVfXyg3KTtcblx0dmFyIGJ1aWx0aW5fbG9hZGVycyA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBydW50aW1lID0gX193ZWJwYWNrX3JlcXVpcmVfXyg4KTtcblx0dmFyIGdsb2JhbHMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDkpO1xuXHR2YXIgd2F0ZXJmYWxsID0gX193ZWJwYWNrX3JlcXVpcmVfXygxMCk7XG5cdHZhciBGcmFtZSA9IHJ1bnRpbWUuRnJhbWU7XG5cdHZhciBUZW1wbGF0ZTtcblxuXHQvLyBVbmNvbmRpdGlvbmFsbHkgbG9hZCBpbiB0aGlzIGxvYWRlciwgZXZlbiBpZiBubyBvdGhlciBvbmVzIGFyZVxuXHQvLyBpbmNsdWRlZCAocG9zc2libGUgaW4gdGhlIHNsaW0gYnJvd3NlciBidWlsZClcblx0YnVpbHRpbl9sb2FkZXJzLlByZWNvbXBpbGVkTG9hZGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygxMyk7XG5cblx0Ly8gSWYgdGhlIHVzZXIgaXMgdXNpbmcgdGhlIGFzeW5jIEFQSSwgKmFsd2F5cyogY2FsbCBpdFxuXHQvLyBhc3luY2hyb25vdXNseSBldmVuIGlmIHRoZSB0ZW1wbGF0ZSB3YXMgc3luY2hyb25vdXMuXG5cdGZ1bmN0aW9uIGNhbGxiYWNrQXNhcChjYiwgZXJyLCByZXMpIHtcblx0ICAgIGFzYXAoZnVuY3Rpb24oKSB7IGNiKGVyciwgcmVzKTsgfSk7XG5cdH1cblxuXHR2YXIgRW52aXJvbm1lbnQgPSBPYmouZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uKGxvYWRlcnMsIG9wdHMpIHtcblx0ICAgICAgICAvLyBUaGUgZGV2IGZsYWcgZGV0ZXJtaW5lcyB0aGUgdHJhY2UgdGhhdCdsbCBiZSBzaG93biBvbiBlcnJvcnMuXG5cdCAgICAgICAgLy8gSWYgc2V0IHRvIHRydWUsIHJldHVybnMgdGhlIGZ1bGwgdHJhY2UgZnJvbSB0aGUgZXJyb3IgcG9pbnQsXG5cdCAgICAgICAgLy8gb3RoZXJ3aXNlIHdpbGwgcmV0dXJuIHRyYWNlIHN0YXJ0aW5nIGZyb20gVGVtcGxhdGUucmVuZGVyXG5cdCAgICAgICAgLy8gKHRoZSBmdWxsIHRyYWNlIGZyb20gd2l0aGluIG51bmp1Y2tzIG1heSBjb25mdXNlIGRldmVsb3BlcnMgdXNpbmdcblx0ICAgICAgICAvLyAgdGhlIGxpYnJhcnkpXG5cdCAgICAgICAgLy8gZGVmYXVsdHMgdG8gZmFsc2Vcblx0ICAgICAgICBvcHRzID0gdGhpcy5vcHRzID0gb3B0cyB8fCB7fTtcblx0ICAgICAgICB0aGlzLm9wdHMuZGV2ID0gISFvcHRzLmRldjtcblxuXHQgICAgICAgIC8vIFRoZSBhdXRvZXNjYXBlIGZsYWcgc2V0cyBnbG9iYWwgYXV0b2VzY2FwaW5nLiBJZiB0cnVlLFxuXHQgICAgICAgIC8vIGV2ZXJ5IHN0cmluZyB2YXJpYWJsZSB3aWxsIGJlIGVzY2FwZWQgYnkgZGVmYXVsdC5cblx0ICAgICAgICAvLyBJZiBmYWxzZSwgc3RyaW5ncyBjYW4gYmUgbWFudWFsbHkgZXNjYXBlZCB1c2luZyB0aGUgYGVzY2FwZWAgZmlsdGVyLlxuXHQgICAgICAgIC8vIGRlZmF1bHRzIHRvIHRydWVcblx0ICAgICAgICB0aGlzLm9wdHMuYXV0b2VzY2FwZSA9IG9wdHMuYXV0b2VzY2FwZSAhPSBudWxsID8gb3B0cy5hdXRvZXNjYXBlIDogdHJ1ZTtcblxuXHQgICAgICAgIC8vIElmIHRydWUsIHRoaXMgd2lsbCBtYWtlIHRoZSBzeXN0ZW0gdGhyb3cgZXJyb3JzIGlmIHRyeWluZ1xuXHQgICAgICAgIC8vIHRvIG91dHB1dCBhIG51bGwgb3IgdW5kZWZpbmVkIHZhbHVlXG5cdCAgICAgICAgdGhpcy5vcHRzLnRocm93T25VbmRlZmluZWQgPSAhIW9wdHMudGhyb3dPblVuZGVmaW5lZDtcblx0ICAgICAgICB0aGlzLm9wdHMudHJpbUJsb2NrcyA9ICEhb3B0cy50cmltQmxvY2tzO1xuXHQgICAgICAgIHRoaXMub3B0cy5sc3RyaXBCbG9ja3MgPSAhIW9wdHMubHN0cmlwQmxvY2tzO1xuXG5cdCAgICAgICAgdGhpcy5sb2FkZXJzID0gW107XG5cblx0ICAgICAgICBpZighbG9hZGVycykge1xuXHQgICAgICAgICAgICAvLyBUaGUgZmlsZXN5c3RlbSBsb2FkZXIgaXMgb25seSBhdmFpbGFibGUgc2VydmVyLXNpZGVcblx0ICAgICAgICAgICAgaWYoYnVpbHRpbl9sb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIpIHtcblx0ICAgICAgICAgICAgICAgIHRoaXMubG9hZGVycyA9IFtuZXcgYnVpbHRpbl9sb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIoJ3ZpZXdzJyldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYoYnVpbHRpbl9sb2FkZXJzLldlYkxvYWRlcikge1xuXHQgICAgICAgICAgICAgICAgdGhpcy5sb2FkZXJzID0gW25ldyBidWlsdGluX2xvYWRlcnMuV2ViTG9hZGVyKCcvdmlld3MnKV07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHRoaXMubG9hZGVycyA9IGxpYi5pc0FycmF5KGxvYWRlcnMpID8gbG9hZGVycyA6IFtsb2FkZXJzXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBJdCdzIGVhc3kgdG8gdXNlIHByZWNvbXBpbGVkIHRlbXBsYXRlczoganVzdCBpbmNsdWRlIHRoZW1cblx0ICAgICAgICAvLyBiZWZvcmUgeW91IGNvbmZpZ3VyZSBudW5qdWNrcyBhbmQgdGhpcyB3aWxsIGF1dG9tYXRpY2FsbHlcblx0ICAgICAgICAvLyBwaWNrIGl0IHVwIGFuZCB1c2UgaXRcblx0ICAgICAgICBpZigodHJ1ZSkgJiYgd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQpIHtcblx0ICAgICAgICAgICAgdGhpcy5sb2FkZXJzLnVuc2hpZnQoXG5cdCAgICAgICAgICAgICAgICBuZXcgYnVpbHRpbl9sb2FkZXJzLlByZWNvbXBpbGVkTG9hZGVyKHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkKVxuXHQgICAgICAgICAgICApO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMuaW5pdENhY2hlKCk7XG5cblx0ICAgICAgICB0aGlzLmdsb2JhbHMgPSBnbG9iYWxzKCk7XG5cdCAgICAgICAgdGhpcy5maWx0ZXJzID0ge307XG5cdCAgICAgICAgdGhpcy5hc3luY0ZpbHRlcnMgPSBbXTtcblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnMgPSB7fTtcblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnNMaXN0ID0gW107XG5cblx0ICAgICAgICBmb3IodmFyIG5hbWUgaW4gYnVpbHRpbl9maWx0ZXJzKSB7XG5cdCAgICAgICAgICAgIHRoaXMuYWRkRmlsdGVyKG5hbWUsIGJ1aWx0aW5fZmlsdGVyc1tuYW1lXSk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgaW5pdENhY2hlOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAvLyBDYWNoaW5nIGFuZCBjYWNoZSBidXN0aW5nXG5cdCAgICAgICAgbGliLmVhY2godGhpcy5sb2FkZXJzLCBmdW5jdGlvbihsb2FkZXIpIHtcblx0ICAgICAgICAgICAgbG9hZGVyLmNhY2hlID0ge307XG5cblx0ICAgICAgICAgICAgaWYodHlwZW9mIGxvYWRlci5vbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICAgICAgbG9hZGVyLm9uKCd1cGRhdGUnLCBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGxvYWRlci5jYWNoZVt0ZW1wbGF0ZV0gPSBudWxsO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEV4dGVuc2lvbjogZnVuY3Rpb24obmFtZSwgZXh0ZW5zaW9uKSB7XG5cdCAgICAgICAgZXh0ZW5zaW9uLl9uYW1lID0gbmFtZTtcblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnNbbmFtZV0gPSBleHRlbnNpb247XG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zTGlzdC5wdXNoKGV4dGVuc2lvbik7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICByZW1vdmVFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICB2YXIgZXh0ZW5zaW9uID0gdGhpcy5nZXRFeHRlbnNpb24obmFtZSk7XG5cdCAgICAgICAgaWYgKCFleHRlbnNpb24pIHJldHVybjtcblxuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9uc0xpc3QgPSBsaWIud2l0aG91dCh0aGlzLmV4dGVuc2lvbnNMaXN0LCBleHRlbnNpb24pO1xuXHQgICAgICAgIGRlbGV0ZSB0aGlzLmV4dGVuc2lvbnNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICBnZXRFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5leHRlbnNpb25zW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgaGFzRXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgcmV0dXJuICEhdGhpcy5leHRlbnNpb25zW25hbWVdO1xuXHQgICAgfSxcblxuXHQgICAgYWRkR2xvYmFsOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuXHQgICAgICAgIHRoaXMuZ2xvYmFsc1tuYW1lXSA9IHZhbHVlO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0R2xvYmFsOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgaWYodHlwZW9mIHRoaXMuZ2xvYmFsc1tuYW1lXSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdnbG9iYWwgbm90IGZvdW5kOiAnICsgbmFtZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiB0aGlzLmdsb2JhbHNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICBhZGRGaWx0ZXI6IGZ1bmN0aW9uKG5hbWUsIGZ1bmMsIGFzeW5jKSB7XG5cdCAgICAgICAgdmFyIHdyYXBwZWQgPSBmdW5jO1xuXG5cdCAgICAgICAgaWYoYXN5bmMpIHtcblx0ICAgICAgICAgICAgdGhpcy5hc3luY0ZpbHRlcnMucHVzaChuYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgdGhpcy5maWx0ZXJzW25hbWVdID0gd3JhcHBlZDtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIGdldEZpbHRlcjogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIGlmKCF0aGlzLmZpbHRlcnNbbmFtZV0pIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdmaWx0ZXIgbm90IGZvdW5kOiAnICsgbmFtZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiB0aGlzLmZpbHRlcnNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICByZXNvbHZlVGVtcGxhdGU6IGZ1bmN0aW9uKGxvYWRlciwgcGFyZW50TmFtZSwgZmlsZW5hbWUpIHtcblx0ICAgICAgICB2YXIgaXNSZWxhdGl2ZSA9IChsb2FkZXIuaXNSZWxhdGl2ZSAmJiBwYXJlbnROYW1lKT8gbG9hZGVyLmlzUmVsYXRpdmUoZmlsZW5hbWUpIDogZmFsc2U7XG5cdCAgICAgICAgcmV0dXJuIChpc1JlbGF0aXZlICYmIGxvYWRlci5yZXNvbHZlKT8gbG9hZGVyLnJlc29sdmUocGFyZW50TmFtZSwgZmlsZW5hbWUpIDogZmlsZW5hbWU7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRUZW1wbGF0ZTogZnVuY3Rpb24obmFtZSwgZWFnZXJDb21waWxlLCBwYXJlbnROYW1lLCBpZ25vcmVNaXNzaW5nLCBjYikge1xuXHQgICAgICAgIHZhciB0aGF0ID0gdGhpcztcblx0ICAgICAgICB2YXIgdG1wbCA9IG51bGw7XG5cdCAgICAgICAgaWYobmFtZSAmJiBuYW1lLnJhdykge1xuXHQgICAgICAgICAgICAvLyB0aGlzIGZpeGVzIGF1dG9lc2NhcGUgZm9yIHRlbXBsYXRlcyByZWZlcmVuY2VkIGluIHN5bWJvbHNcblx0ICAgICAgICAgICAgbmFtZSA9IG5hbWUucmF3O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKHBhcmVudE5hbWUpKSB7XG5cdCAgICAgICAgICAgIGNiID0gcGFyZW50TmFtZTtcblx0ICAgICAgICAgICAgcGFyZW50TmFtZSA9IG51bGw7XG5cdCAgICAgICAgICAgIGVhZ2VyQ29tcGlsZSA9IGVhZ2VyQ29tcGlsZSB8fCBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihlYWdlckNvbXBpbGUpKSB7XG5cdCAgICAgICAgICAgIGNiID0gZWFnZXJDb21waWxlO1xuXHQgICAgICAgICAgICBlYWdlckNvbXBpbGUgPSBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAobmFtZSBpbnN0YW5jZW9mIFRlbXBsYXRlKSB7XG5cdCAgICAgICAgICAgICB0bXBsID0gbmFtZTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZih0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0ZW1wbGF0ZSBuYW1lcyBtdXN0IGJlIGEgc3RyaW5nOiAnICsgbmFtZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubG9hZGVycy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIF9uYW1lID0gdGhpcy5yZXNvbHZlVGVtcGxhdGUodGhpcy5sb2FkZXJzW2ldLCBwYXJlbnROYW1lLCBuYW1lKTtcblx0ICAgICAgICAgICAgICAgIHRtcGwgPSB0aGlzLmxvYWRlcnNbaV0uY2FjaGVbX25hbWVdO1xuXHQgICAgICAgICAgICAgICAgaWYgKHRtcGwpIGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYodG1wbCkge1xuXHQgICAgICAgICAgICBpZihlYWdlckNvbXBpbGUpIHtcblx0ICAgICAgICAgICAgICAgIHRtcGwuY29tcGlsZSgpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYoY2IpIHtcblx0ICAgICAgICAgICAgICAgIGNiKG51bGwsIHRtcGwpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHRtcGw7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICB2YXIgc3luY1Jlc3VsdDtcblx0ICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgICAgICAgICB2YXIgY3JlYXRlVGVtcGxhdGUgPSBmdW5jdGlvbihlcnIsIGluZm8pIHtcblx0ICAgICAgICAgICAgICAgIGlmKCFpbmZvICYmICFlcnIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZighaWdub3JlTWlzc2luZykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBlcnIgPSBuZXcgRXJyb3IoJ3RlbXBsYXRlIG5vdCBmb3VuZDogJyArIG5hbWUpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgaWYgKGVycikge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGNiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNiKGVycik7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHRtcGw7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoaW5mbykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0bXBsID0gbmV3IFRlbXBsYXRlKGluZm8uc3JjLCBfdGhpcyxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnBhdGgsIGVhZ2VyQ29tcGlsZSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYoIWluZm8ubm9DYWNoZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5sb2FkZXIuY2FjaGVbbmFtZV0gPSB0bXBsO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0bXBsID0gbmV3IFRlbXBsYXRlKCcnLCBfdGhpcyxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJywgZWFnZXJDb21waWxlKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZihjYikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYihudWxsLCB0bXBsKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHN5bmNSZXN1bHQgPSB0bXBsO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICBsaWIuYXN5bmNJdGVyKHRoaXMubG9hZGVycywgZnVuY3Rpb24obG9hZGVyLCBpLCBuZXh0LCBkb25lKSB7XG5cdCAgICAgICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGUoZXJyLCBzcmMpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZihlcnIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShlcnIpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKHNyYykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzcmMubG9hZGVyID0gbG9hZGVyO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBkb25lKG51bGwsIHNyYyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvLyBSZXNvbHZlIG5hbWUgcmVsYXRpdmUgdG8gcGFyZW50TmFtZVxuXHQgICAgICAgICAgICAgICAgbmFtZSA9IHRoYXQucmVzb2x2ZVRlbXBsYXRlKGxvYWRlciwgcGFyZW50TmFtZSwgbmFtZSk7XG5cblx0ICAgICAgICAgICAgICAgIGlmKGxvYWRlci5hc3luYykge1xuXHQgICAgICAgICAgICAgICAgICAgIGxvYWRlci5nZXRTb3VyY2UobmFtZSwgaGFuZGxlKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIGhhbmRsZShudWxsLCBsb2FkZXIuZ2V0U291cmNlKG5hbWUpKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSwgY3JlYXRlVGVtcGxhdGUpO1xuXG5cdCAgICAgICAgICAgIHJldHVybiBzeW5jUmVzdWx0O1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGV4cHJlc3M6IGZ1bmN0aW9uKGFwcCkge1xuXHQgICAgICAgIHZhciBlbnYgPSB0aGlzO1xuXG5cdCAgICAgICAgZnVuY3Rpb24gTnVuanVja3NWaWV3KG5hbWUsIG9wdHMpIHtcblx0ICAgICAgICAgICAgdGhpcy5uYW1lICAgICAgICAgID0gbmFtZTtcblx0ICAgICAgICAgICAgdGhpcy5wYXRoICAgICAgICAgID0gbmFtZTtcblx0ICAgICAgICAgICAgdGhpcy5kZWZhdWx0RW5naW5lID0gb3B0cy5kZWZhdWx0RW5naW5lO1xuXHQgICAgICAgICAgICB0aGlzLmV4dCAgICAgICAgICAgPSBwYXRoLmV4dG5hbWUobmFtZSk7XG5cdCAgICAgICAgICAgIGlmICghdGhpcy5leHQgJiYgIXRoaXMuZGVmYXVsdEVuZ2luZSkgdGhyb3cgbmV3IEVycm9yKCdObyBkZWZhdWx0IGVuZ2luZSB3YXMgc3BlY2lmaWVkIGFuZCBubyBleHRlbnNpb24gd2FzIHByb3ZpZGVkLicpO1xuXHQgICAgICAgICAgICBpZiAoIXRoaXMuZXh0KSB0aGlzLm5hbWUgKz0gKHRoaXMuZXh0ID0gKCcuJyAhPT0gdGhpcy5kZWZhdWx0RW5naW5lWzBdID8gJy4nIDogJycpICsgdGhpcy5kZWZhdWx0RW5naW5lKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBOdW5qdWNrc1ZpZXcucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKG9wdHMsIGNiKSB7XG5cdCAgICAgICAgICBlbnYucmVuZGVyKHRoaXMubmFtZSwgb3B0cywgY2IpO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBhcHAuc2V0KCd2aWV3JywgTnVuanVja3NWaWV3KTtcblx0ICAgICAgICBhcHAuc2V0KCdudW5qdWNrc0VudicsIHRoaXMpO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgcmVuZGVyOiBmdW5jdGlvbihuYW1lLCBjdHgsIGNiKSB7XG5cdCAgICAgICAgaWYobGliLmlzRnVuY3Rpb24oY3R4KSkge1xuXHQgICAgICAgICAgICBjYiA9IGN0eDtcblx0ICAgICAgICAgICAgY3R4ID0gbnVsbDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBXZSBzdXBwb3J0IGEgc3luY2hyb25vdXMgQVBJIHRvIG1ha2UgaXQgZWFzaWVyIHRvIG1pZ3JhdGVcblx0ICAgICAgICAvLyBleGlzdGluZyBjb2RlIHRvIGFzeW5jLiBUaGlzIHdvcmtzIGJlY2F1c2UgaWYgeW91IGRvbid0IGRvXG5cdCAgICAgICAgLy8gYW55dGhpbmcgYXN5bmMgd29yaywgdGhlIHdob2xlIHRoaW5nIGlzIGFjdHVhbGx5IHJ1blxuXHQgICAgICAgIC8vIHN5bmNocm9ub3VzbHkuXG5cdCAgICAgICAgdmFyIHN5bmNSZXN1bHQgPSBudWxsO1xuXG5cdCAgICAgICAgdGhpcy5nZXRUZW1wbGF0ZShuYW1lLCBmdW5jdGlvbihlcnIsIHRtcGwpIHtcblx0ICAgICAgICAgICAgaWYoZXJyICYmIGNiKSB7XG5cdCAgICAgICAgICAgICAgICBjYWxsYmFja0FzYXAoY2IsIGVycik7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZihlcnIpIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IGVycjtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHN5bmNSZXN1bHQgPSB0bXBsLnJlbmRlcihjdHgsIGNiKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgcmV0dXJuIHN5bmNSZXN1bHQ7XG5cdCAgICB9LFxuXG5cdCAgICByZW5kZXJTdHJpbmc6IGZ1bmN0aW9uKHNyYywgY3R4LCBvcHRzLCBjYikge1xuXHQgICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKG9wdHMpKSB7XG5cdCAgICAgICAgICAgIGNiID0gb3B0cztcblx0ICAgICAgICAgICAgb3B0cyA9IHt9O1xuXHQgICAgICAgIH1cblx0ICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuXHQgICAgICAgIHZhciB0bXBsID0gbmV3IFRlbXBsYXRlKHNyYywgdGhpcywgb3B0cy5wYXRoKTtcblx0ICAgICAgICByZXR1cm4gdG1wbC5yZW5kZXIoY3R4LCBjYik7XG5cdCAgICB9LFxuXG5cdCAgICB3YXRlcmZhbGw6IHdhdGVyZmFsbFxuXHR9KTtcblxuXHR2YXIgQ29udGV4dCA9IE9iai5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24oY3R4LCBibG9ja3MsIGVudikge1xuXHQgICAgICAgIC8vIEhhcyB0byBiZSB0aWVkIHRvIGFuIGVudmlyb25tZW50IHNvIHdlIGNhbiB0YXAgaW50byBpdHMgZ2xvYmFscy5cblx0ICAgICAgICB0aGlzLmVudiA9IGVudiB8fCBuZXcgRW52aXJvbm1lbnQoKTtcblxuXHQgICAgICAgIC8vIE1ha2UgYSBkdXBsaWNhdGUgb2YgY3R4XG5cdCAgICAgICAgdGhpcy5jdHggPSB7fTtcblx0ICAgICAgICBmb3IodmFyIGsgaW4gY3R4KSB7XG5cdCAgICAgICAgICAgIGlmKGN0eC5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHQgICAgICAgICAgICAgICAgdGhpcy5jdHhba10gPSBjdHhba107XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLmJsb2NrcyA9IHt9O1xuXHQgICAgICAgIHRoaXMuZXhwb3J0ZWQgPSBbXTtcblxuXHQgICAgICAgIGZvcih2YXIgbmFtZSBpbiBibG9ja3MpIHtcblx0ICAgICAgICAgICAgdGhpcy5hZGRCbG9jayhuYW1lLCBibG9ja3NbbmFtZV0pO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIGxvb2t1cDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIC8vIFRoaXMgaXMgb25lIG9mIHRoZSBtb3N0IGNhbGxlZCBmdW5jdGlvbnMsIHNvIG9wdGltaXplIGZvclxuXHQgICAgICAgIC8vIHRoZSB0eXBpY2FsIGNhc2Ugd2hlcmUgdGhlIG5hbWUgaXNuJ3QgaW4gdGhlIGdsb2JhbHNcblx0ICAgICAgICBpZihuYW1lIGluIHRoaXMuZW52Lmdsb2JhbHMgJiYgIShuYW1lIGluIHRoaXMuY3R4KSkge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5lbnYuZ2xvYmFsc1tuYW1lXTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLmN0eFtuYW1lXTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBzZXRWYXJpYWJsZTogZnVuY3Rpb24obmFtZSwgdmFsKSB7XG5cdCAgICAgICAgdGhpcy5jdHhbbmFtZV0gPSB2YWw7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRWYXJpYWJsZXM6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLmN0eDtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEJsb2NrOiBmdW5jdGlvbihuYW1lLCBibG9jaykge1xuXHQgICAgICAgIHRoaXMuYmxvY2tzW25hbWVdID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW107XG5cdCAgICAgICAgdGhpcy5ibG9ja3NbbmFtZV0ucHVzaChibG9jayk7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRCbG9jazogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIGlmKCF0aGlzLmJsb2Nrc1tuYW1lXSkge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gYmxvY2sgXCInICsgbmFtZSArICdcIicpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiB0aGlzLmJsb2Nrc1tuYW1lXVswXTtcblx0ICAgIH0sXG5cblx0ICAgIGdldFN1cGVyOiBmdW5jdGlvbihlbnYsIG5hbWUsIGJsb2NrLCBmcmFtZSwgcnVudGltZSwgY2IpIHtcblx0ICAgICAgICB2YXIgaWR4ID0gbGliLmluZGV4T2YodGhpcy5ibG9ja3NbbmFtZV0gfHwgW10sIGJsb2NrKTtcblx0ICAgICAgICB2YXIgYmxrID0gdGhpcy5ibG9ja3NbbmFtZV1baWR4ICsgMV07XG5cdCAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzO1xuXG5cdCAgICAgICAgaWYoaWR4ID09PSAtMSB8fCAhYmxrKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gc3VwZXIgYmxvY2sgYXZhaWxhYmxlIGZvciBcIicgKyBuYW1lICsgJ1wiJyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgYmxrKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEV4cG9ydDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHRoaXMuZXhwb3J0ZWQucHVzaChuYW1lKTtcblx0ICAgIH0sXG5cblx0ICAgIGdldEV4cG9ydGVkOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgZXhwb3J0ZWQgPSB7fTtcblx0ICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLmV4cG9ydGVkLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5leHBvcnRlZFtpXTtcblx0ICAgICAgICAgICAgZXhwb3J0ZWRbbmFtZV0gPSB0aGlzLmN0eFtuYW1lXTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIGV4cG9ydGVkO1xuXHQgICAgfVxuXHR9KTtcblxuXHRUZW1wbGF0ZSA9IE9iai5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24gKHNyYywgZW52LCBwYXRoLCBlYWdlckNvbXBpbGUpIHtcblx0ICAgICAgICB0aGlzLmVudiA9IGVudiB8fCBuZXcgRW52aXJvbm1lbnQoKTtcblxuXHQgICAgICAgIGlmKGxpYi5pc09iamVjdChzcmMpKSB7XG5cdCAgICAgICAgICAgIHN3aXRjaChzcmMudHlwZSkge1xuXHQgICAgICAgICAgICBjYXNlICdjb2RlJzogdGhpcy50bXBsUHJvcHMgPSBzcmMub2JqOyBicmVhaztcblx0ICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzogdGhpcy50bXBsU3RyID0gc3JjLm9iajsgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihsaWIuaXNTdHJpbmcoc3JjKSkge1xuXHQgICAgICAgICAgICB0aGlzLnRtcGxTdHIgPSBzcmM7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NyYyBtdXN0IGJlIGEgc3RyaW5nIG9yIGFuIG9iamVjdCBkZXNjcmliaW5nICcgK1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RoZSBzb3VyY2UnKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLnBhdGggPSBwYXRoO1xuXG5cdCAgICAgICAgaWYoZWFnZXJDb21waWxlKSB7XG5cdCAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cdCAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICBfdGhpcy5fY29tcGlsZSgpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGNhdGNoKGVycikge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgbGliLnByZXR0aWZ5RXJyb3IodGhpcy5wYXRoLCB0aGlzLmVudi5vcHRzLmRldiwgZXJyKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdGhpcy5jb21waWxlZCA9IGZhbHNlO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4LCBwYXJlbnRGcmFtZSwgY2IpIHtcblx0ICAgICAgICBpZiAodHlwZW9mIGN0eCA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICBjYiA9IGN0eDtcblx0ICAgICAgICAgICAgY3R4ID0ge307XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBwYXJlbnRGcmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICBjYiA9IHBhcmVudEZyYW1lO1xuXHQgICAgICAgICAgICBwYXJlbnRGcmFtZSA9IG51bGw7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGZvcmNlQXN5bmMgPSB0cnVlO1xuXHQgICAgICAgIGlmKHBhcmVudEZyYW1lKSB7XG5cdCAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgZnJhbWUsIHdlIGFyZSBiZWluZyBjYWxsZWQgZnJvbSBpbnRlcm5hbFxuXHQgICAgICAgICAgICAvLyBjb2RlIG9mIGFub3RoZXIgdGVtcGxhdGUsIGFuZCB0aGUgaW50ZXJuYWwgc3lzdGVtXG5cdCAgICAgICAgICAgIC8vIGRlcGVuZHMgb24gdGhlIHN5bmMvYXN5bmMgbmF0dXJlIG9mIHRoZSBwYXJlbnQgdGVtcGxhdGVcblx0ICAgICAgICAgICAgLy8gdG8gYmUgaW5oZXJpdGVkLCBzbyBmb3JjZSBhbiBhc3luYyBjYWxsYmFja1xuXHQgICAgICAgICAgICBmb3JjZUFzeW5jID0gZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblx0ICAgICAgICAvLyBDYXRjaCBjb21waWxlIGVycm9ycyBmb3IgYXN5bmMgcmVuZGVyaW5nXG5cdCAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgX3RoaXMuY29tcGlsZSgpO1xuXHQgICAgICAgIH0gY2F0Y2ggKF9lcnIpIHtcblx0ICAgICAgICAgICAgdmFyIGVyciA9IGxpYi5wcmV0dGlmeUVycm9yKHRoaXMucGF0aCwgdGhpcy5lbnYub3B0cy5kZXYsIF9lcnIpO1xuXHQgICAgICAgICAgICBpZiAoY2IpIHJldHVybiBjYWxsYmFja0FzYXAoY2IsIGVycik7XG5cdCAgICAgICAgICAgIGVsc2UgdGhyb3cgZXJyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBjb250ZXh0ID0gbmV3IENvbnRleHQoY3R4IHx8IHt9LCBfdGhpcy5ibG9ja3MsIF90aGlzLmVudik7XG5cdCAgICAgICAgdmFyIGZyYW1lID0gcGFyZW50RnJhbWUgPyBwYXJlbnRGcmFtZS5wdXNoKHRydWUpIDogbmV3IEZyYW1lKCk7XG5cdCAgICAgICAgZnJhbWUudG9wTGV2ZWwgPSB0cnVlO1xuXHQgICAgICAgIHZhciBzeW5jUmVzdWx0ID0gbnVsbDtcblxuXHQgICAgICAgIF90aGlzLnJvb3RSZW5kZXJGdW5jKFxuXHQgICAgICAgICAgICBfdGhpcy5lbnYsXG5cdCAgICAgICAgICAgIGNvbnRleHQsXG5cdCAgICAgICAgICAgIGZyYW1lIHx8IG5ldyBGcmFtZSgpLFxuXHQgICAgICAgICAgICBydW50aW1lLFxuXHQgICAgICAgICAgICBmdW5jdGlvbihlcnIsIHJlcykge1xuXHQgICAgICAgICAgICAgICAgaWYoZXJyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZXJyID0gbGliLnByZXR0aWZ5RXJyb3IoX3RoaXMucGF0aCwgX3RoaXMuZW52Lm9wdHMuZGV2LCBlcnIpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICBpZihjYikge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGZvcmNlQXN5bmMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tBc2FwKGNiLCBlcnIsIHJlcyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYihlcnIsIHJlcyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoZXJyKSB7IHRocm93IGVycjsgfVxuXHQgICAgICAgICAgICAgICAgICAgIHN5bmNSZXN1bHQgPSByZXM7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICApO1xuXG5cdCAgICAgICAgcmV0dXJuIHN5bmNSZXN1bHQ7XG5cdCAgICB9LFxuXG5cblx0ICAgIGdldEV4cG9ydGVkOiBmdW5jdGlvbihjdHgsIHBhcmVudEZyYW1lLCBjYikge1xuXHQgICAgICAgIGlmICh0eXBlb2YgY3R4ID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIGNiID0gY3R4O1xuXHQgICAgICAgICAgICBjdHggPSB7fTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodHlwZW9mIHBhcmVudEZyYW1lID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIGNiID0gcGFyZW50RnJhbWU7XG5cdCAgICAgICAgICAgIHBhcmVudEZyYW1lID0gbnVsbDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBDYXRjaCBjb21waWxlIGVycm9ycyBmb3IgYXN5bmMgcmVuZGVyaW5nXG5cdCAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgdGhpcy5jb21waWxlKCk7XG5cdCAgICAgICAgfSBjYXRjaCAoZSkge1xuXHQgICAgICAgICAgICBpZiAoY2IpIHJldHVybiBjYihlKTtcblx0ICAgICAgICAgICAgZWxzZSB0aHJvdyBlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBmcmFtZSA9IHBhcmVudEZyYW1lID8gcGFyZW50RnJhbWUucHVzaCgpIDogbmV3IEZyYW1lKCk7XG5cdCAgICAgICAgZnJhbWUudG9wTGV2ZWwgPSB0cnVlO1xuXG5cdCAgICAgICAgLy8gUnVuIHRoZSByb290UmVuZGVyRnVuYyB0byBwb3B1bGF0ZSB0aGUgY29udGV4dCB3aXRoIGV4cG9ydGVkIHZhcnNcblx0ICAgICAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KGN0eCB8fCB7fSwgdGhpcy5ibG9ja3MsIHRoaXMuZW52KTtcblx0ICAgICAgICB0aGlzLnJvb3RSZW5kZXJGdW5jKHRoaXMuZW52LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVudGltZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGVycikge1xuXHQgICAgICAgIFx0XHQgICAgICAgIGlmICggZXJyICkge1xuXHQgICAgICAgIFx0XHRcdCAgICBjYihlcnIsIG51bGwpO1xuXHQgICAgICAgIFx0XHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgXHRcdFx0ICAgIGNiKG51bGwsIGNvbnRleHQuZ2V0RXhwb3J0ZWQoKSk7XG5cdCAgICAgICAgXHRcdCAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICB9LFxuXG5cdCAgICBjb21waWxlOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICBpZighdGhpcy5jb21waWxlZCkge1xuXHQgICAgICAgICAgICB0aGlzLl9jb21waWxlKCk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgX2NvbXBpbGU6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciBwcm9wcztcblxuXHQgICAgICAgIGlmKHRoaXMudG1wbFByb3BzKSB7XG5cdCAgICAgICAgICAgIHByb3BzID0gdGhpcy50bXBsUHJvcHM7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB2YXIgc291cmNlID0gY29tcGlsZXIuY29tcGlsZSh0aGlzLnRtcGxTdHIsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52LmFzeW5jRmlsdGVycyxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnYuZXh0ZW5zaW9uc0xpc3QsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGF0aCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnYub3B0cyk7XG5cblx0ICAgICAgICAgICAgLyoganNsaW50IGV2aWw6IHRydWUgKi9cblx0ICAgICAgICAgICAgdmFyIGZ1bmMgPSBuZXcgRnVuY3Rpb24oc291cmNlKTtcblx0ICAgICAgICAgICAgcHJvcHMgPSBmdW5jKCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5ibG9ja3MgPSB0aGlzLl9nZXRCbG9ja3MocHJvcHMpO1xuXHQgICAgICAgIHRoaXMucm9vdFJlbmRlckZ1bmMgPSBwcm9wcy5yb290O1xuXHQgICAgICAgIHRoaXMuY29tcGlsZWQgPSB0cnVlO1xuXHQgICAgfSxcblxuXHQgICAgX2dldEJsb2NrczogZnVuY3Rpb24ocHJvcHMpIHtcblx0ICAgICAgICB2YXIgYmxvY2tzID0ge307XG5cblx0ICAgICAgICBmb3IodmFyIGsgaW4gcHJvcHMpIHtcblx0ICAgICAgICAgICAgaWYoay5zbGljZSgwLCAyKSA9PT0gJ2JfJykge1xuXHQgICAgICAgICAgICAgICAgYmxvY2tzW2suc2xpY2UoMildID0gcHJvcHNba107XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gYmxvY2tzO1xuXHQgICAgfVxuXHR9KTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IHtcblx0ICAgIEVudmlyb25tZW50OiBFbnZpcm9ubWVudCxcblx0ICAgIFRlbXBsYXRlOiBUZW1wbGF0ZVxuXHR9O1xuXG5cbi8qKiovIH0sXG4vKiAzICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHRcblxuLyoqKi8gfSxcbi8qIDQgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vIHJhd0FzYXAgcHJvdmlkZXMgZXZlcnl0aGluZyB3ZSBuZWVkIGV4Y2VwdCBleGNlcHRpb24gbWFuYWdlbWVudC5cblx0dmFyIHJhd0FzYXAgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDUpO1xuXHQvLyBSYXdUYXNrcyBhcmUgcmVjeWNsZWQgdG8gcmVkdWNlIEdDIGNodXJuLlxuXHR2YXIgZnJlZVRhc2tzID0gW107XG5cdC8vIFdlIHF1ZXVlIGVycm9ycyB0byBlbnN1cmUgdGhleSBhcmUgdGhyb3duIGluIHJpZ2h0IG9yZGVyIChGSUZPKS5cblx0Ly8gQXJyYXktYXMtcXVldWUgaXMgZ29vZCBlbm91Z2ggaGVyZSwgc2luY2Ugd2UgYXJlIGp1c3QgZGVhbGluZyB3aXRoIGV4Y2VwdGlvbnMuXG5cdHZhciBwZW5kaW5nRXJyb3JzID0gW107XG5cdHZhciByZXF1ZXN0RXJyb3JUaHJvdyA9IHJhd0FzYXAubWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKHRocm93Rmlyc3RFcnJvcik7XG5cblx0ZnVuY3Rpb24gdGhyb3dGaXJzdEVycm9yKCkge1xuXHQgICAgaWYgKHBlbmRpbmdFcnJvcnMubGVuZ3RoKSB7XG5cdCAgICAgICAgdGhyb3cgcGVuZGluZ0Vycm9ycy5zaGlmdCgpO1xuXHQgICAgfVxuXHR9XG5cblx0LyoqXG5cdCAqIENhbGxzIGEgdGFzayBhcyBzb29uIGFzIHBvc3NpYmxlIGFmdGVyIHJldHVybmluZywgaW4gaXRzIG93biBldmVudCwgd2l0aCBwcmlvcml0eVxuXHQgKiBvdmVyIG90aGVyIGV2ZW50cyBsaWtlIGFuaW1hdGlvbiwgcmVmbG93LCBhbmQgcmVwYWludC4gQW4gZXJyb3IgdGhyb3duIGZyb20gYW5cblx0ICogZXZlbnQgd2lsbCBub3QgaW50ZXJydXB0LCBub3IgZXZlbiBzdWJzdGFudGlhbGx5IHNsb3cgZG93biB0aGUgcHJvY2Vzc2luZyBvZlxuXHQgKiBvdGhlciBldmVudHMsIGJ1dCB3aWxsIGJlIHJhdGhlciBwb3N0cG9uZWQgdG8gYSBsb3dlciBwcmlvcml0eSBldmVudC5cblx0ICogQHBhcmFtIHt7Y2FsbH19IHRhc2sgQSBjYWxsYWJsZSBvYmplY3QsIHR5cGljYWxseSBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgbm9cblx0ICogYXJndW1lbnRzLlxuXHQgKi9cblx0bW9kdWxlLmV4cG9ydHMgPSBhc2FwO1xuXHRmdW5jdGlvbiBhc2FwKHRhc2spIHtcblx0ICAgIHZhciByYXdUYXNrO1xuXHQgICAgaWYgKGZyZWVUYXNrcy5sZW5ndGgpIHtcblx0ICAgICAgICByYXdUYXNrID0gZnJlZVRhc2tzLnBvcCgpO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICByYXdUYXNrID0gbmV3IFJhd1Rhc2soKTtcblx0ICAgIH1cblx0ICAgIHJhd1Rhc2sudGFzayA9IHRhc2s7XG5cdCAgICByYXdBc2FwKHJhd1Rhc2spO1xuXHR9XG5cblx0Ly8gV2Ugd3JhcCB0YXNrcyB3aXRoIHJlY3ljbGFibGUgdGFzayBvYmplY3RzLiAgQSB0YXNrIG9iamVjdCBpbXBsZW1lbnRzXG5cdC8vIGBjYWxsYCwganVzdCBsaWtlIGEgZnVuY3Rpb24uXG5cdGZ1bmN0aW9uIFJhd1Rhc2soKSB7XG5cdCAgICB0aGlzLnRhc2sgPSBudWxsO1xuXHR9XG5cblx0Ly8gVGhlIHNvbGUgcHVycG9zZSBvZiB3cmFwcGluZyB0aGUgdGFzayBpcyB0byBjYXRjaCB0aGUgZXhjZXB0aW9uIGFuZCByZWN5Y2xlXG5cdC8vIHRoZSB0YXNrIG9iamVjdCBhZnRlciBpdHMgc2luZ2xlIHVzZS5cblx0UmF3VGFzay5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRyeSB7XG5cdCAgICAgICAgdGhpcy50YXNrLmNhbGwoKTtcblx0ICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cdCAgICAgICAgaWYgKGFzYXAub25lcnJvcikge1xuXHQgICAgICAgICAgICAvLyBUaGlzIGhvb2sgZXhpc3RzIHB1cmVseSBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cblx0ICAgICAgICAgICAgLy8gSXRzIG5hbWUgd2lsbCBiZSBwZXJpb2RpY2FsbHkgcmFuZG9taXplZCB0byBicmVhayBhbnkgY29kZSB0aGF0XG5cdCAgICAgICAgICAgIC8vIGRlcGVuZHMgb24gaXRzIGV4aXN0ZW5jZS5cblx0ICAgICAgICAgICAgYXNhcC5vbmVycm9yKGVycm9yKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAvLyBJbiBhIHdlYiBicm93c2VyLCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuIEhvd2V2ZXIsIHRvIGF2b2lkXG5cdCAgICAgICAgICAgIC8vIHNsb3dpbmcgZG93biB0aGUgcXVldWUgb2YgcGVuZGluZyB0YXNrcywgd2UgcmV0aHJvdyB0aGUgZXJyb3IgaW4gYVxuXHQgICAgICAgICAgICAvLyBsb3dlciBwcmlvcml0eSB0dXJuLlxuXHQgICAgICAgICAgICBwZW5kaW5nRXJyb3JzLnB1c2goZXJyb3IpO1xuXHQgICAgICAgICAgICByZXF1ZXN0RXJyb3JUaHJvdygpO1xuXHQgICAgICAgIH1cblx0ICAgIH0gZmluYWxseSB7XG5cdCAgICAgICAgdGhpcy50YXNrID0gbnVsbDtcblx0ICAgICAgICBmcmVlVGFza3NbZnJlZVRhc2tzLmxlbmd0aF0gPSB0aGlzO1xuXHQgICAgfVxuXHR9O1xuXG5cbi8qKiovIH0sXG4vKiA1ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi8oZnVuY3Rpb24oZ2xvYmFsKSB7XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly8gVXNlIHRoZSBmYXN0ZXN0IG1lYW5zIHBvc3NpYmxlIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGl0cyBvd24gdHVybiwgd2l0aFxuXHQvLyBwcmlvcml0eSBvdmVyIG90aGVyIGV2ZW50cyBpbmNsdWRpbmcgSU8sIGFuaW1hdGlvbiwgcmVmbG93LCBhbmQgcmVkcmF3XG5cdC8vIGV2ZW50cyBpbiBicm93c2Vycy5cblx0Ly9cblx0Ly8gQW4gZXhjZXB0aW9uIHRocm93biBieSBhIHRhc2sgd2lsbCBwZXJtYW5lbnRseSBpbnRlcnJ1cHQgdGhlIHByb2Nlc3Npbmcgb2Zcblx0Ly8gc3Vic2VxdWVudCB0YXNrcy4gVGhlIGhpZ2hlciBsZXZlbCBgYXNhcGAgZnVuY3Rpb24gZW5zdXJlcyB0aGF0IGlmIGFuXG5cdC8vIGV4Y2VwdGlvbiBpcyB0aHJvd24gYnkgYSB0YXNrLCB0aGF0IHRoZSB0YXNrIHF1ZXVlIHdpbGwgY29udGludWUgZmx1c2hpbmcgYXNcblx0Ly8gc29vbiBhcyBwb3NzaWJsZSwgYnV0IGlmIHlvdSB1c2UgYHJhd0FzYXBgIGRpcmVjdGx5LCB5b3UgYXJlIHJlc3BvbnNpYmxlIHRvXG5cdC8vIGVpdGhlciBlbnN1cmUgdGhhdCBubyBleGNlcHRpb25zIGFyZSB0aHJvd24gZnJvbSB5b3VyIHRhc2ssIG9yIHRvIG1hbnVhbGx5XG5cdC8vIGNhbGwgYHJhd0FzYXAucmVxdWVzdEZsdXNoYCBpZiBhbiBleGNlcHRpb24gaXMgdGhyb3duLlxuXHRtb2R1bGUuZXhwb3J0cyA9IHJhd0FzYXA7XG5cdGZ1bmN0aW9uIHJhd0FzYXAodGFzaykge1xuXHQgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcblx0ICAgICAgICByZXF1ZXN0Rmx1c2goKTtcblx0ICAgICAgICBmbHVzaGluZyA9IHRydWU7XG5cdCAgICB9XG5cdCAgICAvLyBFcXVpdmFsZW50IHRvIHB1c2gsIGJ1dCBhdm9pZHMgYSBmdW5jdGlvbiBjYWxsLlxuXHQgICAgcXVldWVbcXVldWUubGVuZ3RoXSA9IHRhc2s7XG5cdH1cblxuXHR2YXIgcXVldWUgPSBbXTtcblx0Ly8gT25jZSBhIGZsdXNoIGhhcyBiZWVuIHJlcXVlc3RlZCwgbm8gZnVydGhlciBjYWxscyB0byBgcmVxdWVzdEZsdXNoYCBhcmVcblx0Ly8gbmVjZXNzYXJ5IHVudGlsIHRoZSBuZXh0IGBmbHVzaGAgY29tcGxldGVzLlxuXHR2YXIgZmx1c2hpbmcgPSBmYWxzZTtcblx0Ly8gYHJlcXVlc3RGbHVzaGAgaXMgYW4gaW1wbGVtZW50YXRpb24tc3BlY2lmaWMgbWV0aG9kIHRoYXQgYXR0ZW1wdHMgdG8ga2lja1xuXHQvLyBvZmYgYSBgZmx1c2hgIGV2ZW50IGFzIHF1aWNrbHkgYXMgcG9zc2libGUuIGBmbHVzaGAgd2lsbCBhdHRlbXB0IHRvIGV4aGF1c3Rcblx0Ly8gdGhlIGV2ZW50IHF1ZXVlIGJlZm9yZSB5aWVsZGluZyB0byB0aGUgYnJvd3NlcidzIG93biBldmVudCBsb29wLlxuXHR2YXIgcmVxdWVzdEZsdXNoO1xuXHQvLyBUaGUgcG9zaXRpb24gb2YgdGhlIG5leHQgdGFzayB0byBleGVjdXRlIGluIHRoZSB0YXNrIHF1ZXVlLiBUaGlzIGlzXG5cdC8vIHByZXNlcnZlZCBiZXR3ZWVuIGNhbGxzIHRvIGBmbHVzaGAgc28gdGhhdCBpdCBjYW4gYmUgcmVzdW1lZCBpZlxuXHQvLyBhIHRhc2sgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cblx0dmFyIGluZGV4ID0gMDtcblx0Ly8gSWYgYSB0YXNrIHNjaGVkdWxlcyBhZGRpdGlvbmFsIHRhc2tzIHJlY3Vyc2l2ZWx5LCB0aGUgdGFzayBxdWV1ZSBjYW4gZ3Jvd1xuXHQvLyB1bmJvdW5kZWQuIFRvIHByZXZlbnQgbWVtb3J5IGV4aGF1c3Rpb24sIHRoZSB0YXNrIHF1ZXVlIHdpbGwgcGVyaW9kaWNhbGx5XG5cdC8vIHRydW5jYXRlIGFscmVhZHktY29tcGxldGVkIHRhc2tzLlxuXHR2YXIgY2FwYWNpdHkgPSAxMDI0O1xuXG5cdC8vIFRoZSBmbHVzaCBmdW5jdGlvbiBwcm9jZXNzZXMgYWxsIHRhc2tzIHRoYXQgaGF2ZSBiZWVuIHNjaGVkdWxlZCB3aXRoXG5cdC8vIGByYXdBc2FwYCB1bmxlc3MgYW5kIHVudGlsIG9uZSBvZiB0aG9zZSB0YXNrcyB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuXHQvLyBJZiBhIHRhc2sgdGhyb3dzIGFuIGV4Y2VwdGlvbiwgYGZsdXNoYCBlbnN1cmVzIHRoYXQgaXRzIHN0YXRlIHdpbGwgcmVtYWluXG5cdC8vIGNvbnNpc3RlbnQgYW5kIHdpbGwgcmVzdW1lIHdoZXJlIGl0IGxlZnQgb2ZmIHdoZW4gY2FsbGVkIGFnYWluLlxuXHQvLyBIb3dldmVyLCBgZmx1c2hgIGRvZXMgbm90IG1ha2UgYW55IGFycmFuZ2VtZW50cyB0byBiZSBjYWxsZWQgYWdhaW4gaWYgYW5cblx0Ly8gZXhjZXB0aW9uIGlzIHRocm93bi5cblx0ZnVuY3Rpb24gZmx1c2goKSB7XG5cdCAgICB3aGlsZSAoaW5kZXggPCBxdWV1ZS5sZW5ndGgpIHtcblx0ICAgICAgICB2YXIgY3VycmVudEluZGV4ID0gaW5kZXg7XG5cdCAgICAgICAgLy8gQWR2YW5jZSB0aGUgaW5kZXggYmVmb3JlIGNhbGxpbmcgdGhlIHRhc2suIFRoaXMgZW5zdXJlcyB0aGF0IHdlIHdpbGxcblx0ICAgICAgICAvLyBiZWdpbiBmbHVzaGluZyBvbiB0aGUgbmV4dCB0YXNrIHRoZSB0YXNrIHRocm93cyBhbiBlcnJvci5cblx0ICAgICAgICBpbmRleCA9IGluZGV4ICsgMTtcblx0ICAgICAgICBxdWV1ZVtjdXJyZW50SW5kZXhdLmNhbGwoKTtcblx0ICAgICAgICAvLyBQcmV2ZW50IGxlYWtpbmcgbWVtb3J5IGZvciBsb25nIGNoYWlucyBvZiByZWN1cnNpdmUgY2FsbHMgdG8gYGFzYXBgLlxuXHQgICAgICAgIC8vIElmIHdlIGNhbGwgYGFzYXBgIHdpdGhpbiB0YXNrcyBzY2hlZHVsZWQgYnkgYGFzYXBgLCB0aGUgcXVldWUgd2lsbFxuXHQgICAgICAgIC8vIGdyb3csIGJ1dCB0byBhdm9pZCBhbiBPKG4pIHdhbGsgZm9yIGV2ZXJ5IHRhc2sgd2UgZXhlY3V0ZSwgd2UgZG9uJ3Rcblx0ICAgICAgICAvLyBzaGlmdCB0YXNrcyBvZmYgdGhlIHF1ZXVlIGFmdGVyIHRoZXkgaGF2ZSBiZWVuIGV4ZWN1dGVkLlxuXHQgICAgICAgIC8vIEluc3RlYWQsIHdlIHBlcmlvZGljYWxseSBzaGlmdCAxMDI0IHRhc2tzIG9mZiB0aGUgcXVldWUuXG5cdCAgICAgICAgaWYgKGluZGV4ID4gY2FwYWNpdHkpIHtcblx0ICAgICAgICAgICAgLy8gTWFudWFsbHkgc2hpZnQgYWxsIHZhbHVlcyBzdGFydGluZyBhdCB0aGUgaW5kZXggYmFjayB0byB0aGVcblx0ICAgICAgICAgICAgLy8gYmVnaW5uaW5nIG9mIHRoZSBxdWV1ZS5cblx0ICAgICAgICAgICAgZm9yICh2YXIgc2NhbiA9IDAsIG5ld0xlbmd0aCA9IHF1ZXVlLmxlbmd0aCAtIGluZGV4OyBzY2FuIDwgbmV3TGVuZ3RoOyBzY2FuKyspIHtcblx0ICAgICAgICAgICAgICAgIHF1ZXVlW3NjYW5dID0gcXVldWVbc2NhbiArIGluZGV4XTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBxdWV1ZS5sZW5ndGggLT0gaW5kZXg7XG5cdCAgICAgICAgICAgIGluZGV4ID0gMDtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICBxdWV1ZS5sZW5ndGggPSAwO1xuXHQgICAgaW5kZXggPSAwO1xuXHQgICAgZmx1c2hpbmcgPSBmYWxzZTtcblx0fVxuXG5cdC8vIGByZXF1ZXN0Rmx1c2hgIGlzIGltcGxlbWVudGVkIHVzaW5nIGEgc3RyYXRlZ3kgYmFzZWQgb24gZGF0YSBjb2xsZWN0ZWQgZnJvbVxuXHQvLyBldmVyeSBhdmFpbGFibGUgU2F1Y2VMYWJzIFNlbGVuaXVtIHdlYiBkcml2ZXIgd29ya2VyIGF0IHRpbWUgb2Ygd3JpdGluZy5cblx0Ly8gaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMW1HLTVVWUd1cDVxeEdkRU1Xa2hQNkJXQ3owNTNOVWIyRTFRb1VUVTE2dUEvZWRpdCNnaWQ9NzgzNzI0NTkzXG5cblx0Ly8gU2FmYXJpIDYgYW5kIDYuMSBmb3IgZGVza3RvcCwgaVBhZCwgYW5kIGlQaG9uZSBhcmUgdGhlIG9ubHkgYnJvd3NlcnMgdGhhdFxuXHQvLyBoYXZlIFdlYktpdE11dGF0aW9uT2JzZXJ2ZXIgYnV0IG5vdCB1bi1wcmVmaXhlZCBNdXRhdGlvbk9ic2VydmVyLlxuXHQvLyBNdXN0IHVzZSBgZ2xvYmFsYCBpbnN0ZWFkIG9mIGB3aW5kb3dgIHRvIHdvcmsgaW4gYm90aCBmcmFtZXMgYW5kIHdlYlxuXHQvLyB3b3JrZXJzLiBgZ2xvYmFsYCBpcyBhIHByb3Zpc2lvbiBvZiBCcm93c2VyaWZ5LCBNciwgTXJzLCBvciBNb3AuXG5cdHZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGdsb2JhbC5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO1xuXG5cdC8vIE11dGF0aW9uT2JzZXJ2ZXJzIGFyZSBkZXNpcmFibGUgYmVjYXVzZSB0aGV5IGhhdmUgaGlnaCBwcmlvcml0eSBhbmQgd29ya1xuXHQvLyByZWxpYWJseSBldmVyeXdoZXJlIHRoZXkgYXJlIGltcGxlbWVudGVkLlxuXHQvLyBUaGV5IGFyZSBpbXBsZW1lbnRlZCBpbiBhbGwgbW9kZXJuIGJyb3dzZXJzLlxuXHQvL1xuXHQvLyAtIEFuZHJvaWQgNC00LjNcblx0Ly8gLSBDaHJvbWUgMjYtMzRcblx0Ly8gLSBGaXJlZm94IDE0LTI5XG5cdC8vIC0gSW50ZXJuZXQgRXhwbG9yZXIgMTFcblx0Ly8gLSBpUGFkIFNhZmFyaSA2LTcuMVxuXHQvLyAtIGlQaG9uZSBTYWZhcmkgNy03LjFcblx0Ly8gLSBTYWZhcmkgNi03XG5cdGlmICh0eXBlb2YgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuXHQgICAgcmVxdWVzdEZsdXNoID0gbWFrZVJlcXVlc3RDYWxsRnJvbU11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpO1xuXG5cdC8vIE1lc3NhZ2VDaGFubmVscyBhcmUgZGVzaXJhYmxlIGJlY2F1c2UgdGhleSBnaXZlIGRpcmVjdCBhY2Nlc3MgdG8gdGhlIEhUTUxcblx0Ly8gdGFzayBxdWV1ZSwgYXJlIGltcGxlbWVudGVkIGluIEludGVybmV0IEV4cGxvcmVyIDEwLCBTYWZhcmkgNS4wLTEsIGFuZCBPcGVyYVxuXHQvLyAxMS0xMiwgYW5kIGluIHdlYiB3b3JrZXJzIGluIG1hbnkgZW5naW5lcy5cblx0Ly8gQWx0aG91Z2ggbWVzc2FnZSBjaGFubmVscyB5aWVsZCB0byBhbnkgcXVldWVkIHJlbmRlcmluZyBhbmQgSU8gdGFza3MsIHRoZXlcblx0Ly8gd291bGQgYmUgYmV0dGVyIHRoYW4gaW1wb3NpbmcgdGhlIDRtcyBkZWxheSBvZiB0aW1lcnMuXG5cdC8vIEhvd2V2ZXIsIHRoZXkgZG8gbm90IHdvcmsgcmVsaWFibHkgaW4gSW50ZXJuZXQgRXhwbG9yZXIgb3IgU2FmYXJpLlxuXG5cdC8vIEludGVybmV0IEV4cGxvcmVyIDEwIGlzIHRoZSBvbmx5IGJyb3dzZXIgdGhhdCBoYXMgc2V0SW1tZWRpYXRlIGJ1dCBkb2VzXG5cdC8vIG5vdCBoYXZlIE11dGF0aW9uT2JzZXJ2ZXJzLlxuXHQvLyBBbHRob3VnaCBzZXRJbW1lZGlhdGUgeWllbGRzIHRvIHRoZSBicm93c2VyJ3MgcmVuZGVyZXIsIGl0IHdvdWxkIGJlXG5cdC8vIHByZWZlcnJhYmxlIHRvIGZhbGxpbmcgYmFjayB0byBzZXRUaW1lb3V0IHNpbmNlIGl0IGRvZXMgbm90IGhhdmVcblx0Ly8gdGhlIG1pbmltdW0gNG1zIHBlbmFsdHkuXG5cdC8vIFVuZm9ydHVuYXRlbHkgdGhlcmUgYXBwZWFycyB0byBiZSBhIGJ1ZyBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMCBNb2JpbGUgKGFuZFxuXHQvLyBEZXNrdG9wIHRvIGEgbGVzc2VyIGV4dGVudCkgdGhhdCByZW5kZXJzIGJvdGggc2V0SW1tZWRpYXRlIGFuZFxuXHQvLyBNZXNzYWdlQ2hhbm5lbCB1c2VsZXNzIGZvciB0aGUgcHVycG9zZXMgb2YgQVNBUC5cblx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9xL2lzc3Vlcy8zOTZcblxuXHQvLyBUaW1lcnMgYXJlIGltcGxlbWVudGVkIHVuaXZlcnNhbGx5LlxuXHQvLyBXZSBmYWxsIGJhY2sgdG8gdGltZXJzIGluIHdvcmtlcnMgaW4gbW9zdCBlbmdpbmVzLCBhbmQgaW4gZm9yZWdyb3VuZFxuXHQvLyBjb250ZXh0cyBpbiB0aGUgZm9sbG93aW5nIGJyb3dzZXJzLlxuXHQvLyBIb3dldmVyLCBub3RlIHRoYXQgZXZlbiB0aGlzIHNpbXBsZSBjYXNlIHJlcXVpcmVzIG51YW5jZXMgdG8gb3BlcmF0ZSBpbiBhXG5cdC8vIGJyb2FkIHNwZWN0cnVtIG9mIGJyb3dzZXJzLlxuXHQvL1xuXHQvLyAtIEZpcmVmb3ggMy0xM1xuXHQvLyAtIEludGVybmV0IEV4cGxvcmVyIDYtOVxuXHQvLyAtIGlQYWQgU2FmYXJpIDQuM1xuXHQvLyAtIEx5bnggMi44Ljdcblx0fSBlbHNlIHtcblx0ICAgIHJlcXVlc3RGbHVzaCA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcihmbHVzaCk7XG5cdH1cblxuXHQvLyBgcmVxdWVzdEZsdXNoYCByZXF1ZXN0cyB0aGF0IHRoZSBoaWdoIHByaW9yaXR5IGV2ZW50IHF1ZXVlIGJlIGZsdXNoZWQgYXNcblx0Ly8gc29vbiBhcyBwb3NzaWJsZS5cblx0Ly8gVGhpcyBpcyB1c2VmdWwgdG8gcHJldmVudCBhbiBlcnJvciB0aHJvd24gaW4gYSB0YXNrIGZyb20gc3RhbGxpbmcgdGhlIGV2ZW50XG5cdC8vIHF1ZXVlIGlmIHRoZSBleGNlcHRpb24gaGFuZGxlZCBieSBOb2RlLmpz4oCZc1xuXHQvLyBgcHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIpYCBvciBieSBhIGRvbWFpbi5cblx0cmF3QXNhcC5yZXF1ZXN0Rmx1c2ggPSByZXF1ZXN0Rmx1c2g7XG5cblx0Ly8gVG8gcmVxdWVzdCBhIGhpZ2ggcHJpb3JpdHkgZXZlbnQsIHdlIGluZHVjZSBhIG11dGF0aW9uIG9ic2VydmVyIGJ5IHRvZ2dsaW5nXG5cdC8vIHRoZSB0ZXh0IG9mIGEgdGV4dCBub2RlIGJldHdlZW4gXCIxXCIgYW5kIFwiLTFcIi5cblx0ZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbU11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spIHtcblx0ICAgIHZhciB0b2dnbGUgPSAxO1xuXHQgICAgdmFyIG9ic2VydmVyID0gbmV3IEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKTtcblx0ICAgIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG5cdCAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHtjaGFyYWN0ZXJEYXRhOiB0cnVlfSk7XG5cdCAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG5cdCAgICAgICAgdG9nZ2xlID0gLXRvZ2dsZTtcblx0ICAgICAgICBub2RlLmRhdGEgPSB0b2dnbGU7XG5cdCAgICB9O1xuXHR9XG5cblx0Ly8gVGhlIG1lc3NhZ2UgY2hhbm5lbCB0ZWNobmlxdWUgd2FzIGRpc2NvdmVyZWQgYnkgTWFsdGUgVWJsIGFuZCB3YXMgdGhlXG5cdC8vIG9yaWdpbmFsIGZvdW5kYXRpb24gZm9yIHRoaXMgbGlicmFyeS5cblx0Ly8gaHR0cDovL3d3dy5ub25ibG9ja2luZy5pby8yMDExLzA2L3dpbmRvd25leHR0aWNrLmh0bWxcblxuXHQvLyBTYWZhcmkgNi4wLjUgKGF0IGxlYXN0KSBpbnRlcm1pdHRlbnRseSBmYWlscyB0byBjcmVhdGUgbWVzc2FnZSBwb3J0cyBvbiBhXG5cdC8vIHBhZ2UncyBmaXJzdCBsb2FkLiBUaGFua2Z1bGx5LCB0aGlzIHZlcnNpb24gb2YgU2FmYXJpIHN1cHBvcnRzXG5cdC8vIE11dGF0aW9uT2JzZXJ2ZXJzLCBzbyB3ZSBkb24ndCBuZWVkIHRvIGZhbGwgYmFjayBpbiB0aGF0IGNhc2UuXG5cblx0Ly8gZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbU1lc3NhZ2VDaGFubmVsKGNhbGxiYWNrKSB7XG5cdC8vICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuXHQvLyAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBjYWxsYmFjaztcblx0Ly8gICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcblx0Ly8gICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuXHQvLyAgICAgfTtcblx0Ly8gfVxuXG5cdC8vIEZvciByZWFzb25zIGV4cGxhaW5lZCBhYm92ZSwgd2UgYXJlIGFsc28gdW5hYmxlIHRvIHVzZSBgc2V0SW1tZWRpYXRlYFxuXHQvLyB1bmRlciBhbnkgY2lyY3Vtc3RhbmNlcy5cblx0Ly8gRXZlbiBpZiB3ZSB3ZXJlLCB0aGVyZSBpcyBhbm90aGVyIGJ1ZyBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMC5cblx0Ly8gSXQgaXMgbm90IHN1ZmZpY2llbnQgdG8gYXNzaWduIGBzZXRJbW1lZGlhdGVgIHRvIGByZXF1ZXN0Rmx1c2hgIGJlY2F1c2Vcblx0Ly8gYHNldEltbWVkaWF0ZWAgbXVzdCBiZSBjYWxsZWQgKmJ5IG5hbWUqIGFuZCB0aGVyZWZvcmUgbXVzdCBiZSB3cmFwcGVkIGluIGFcblx0Ly8gY2xvc3VyZS5cblx0Ly8gTmV2ZXIgZm9yZ2V0LlxuXG5cdC8vIGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21TZXRJbW1lZGlhdGUoY2FsbGJhY2spIHtcblx0Ly8gICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcblx0Ly8gICAgICAgICBzZXRJbW1lZGlhdGUoY2FsbGJhY2spO1xuXHQvLyAgICAgfTtcblx0Ly8gfVxuXG5cdC8vIFNhZmFyaSA2LjAgaGFzIGEgcHJvYmxlbSB3aGVyZSB0aW1lcnMgd2lsbCBnZXQgbG9zdCB3aGlsZSB0aGUgdXNlciBpc1xuXHQvLyBzY3JvbGxpbmcuIFRoaXMgcHJvYmxlbSBkb2VzIG5vdCBpbXBhY3QgQVNBUCBiZWNhdXNlIFNhZmFyaSA2LjAgc3VwcG9ydHNcblx0Ly8gbXV0YXRpb24gb2JzZXJ2ZXJzLCBzbyB0aGF0IGltcGxlbWVudGF0aW9uIGlzIHVzZWQgaW5zdGVhZC5cblx0Ly8gSG93ZXZlciwgaWYgd2UgZXZlciBlbGVjdCB0byB1c2UgdGltZXJzIGluIFNhZmFyaSwgdGhlIHByZXZhbGVudCB3b3JrLWFyb3VuZFxuXHQvLyBpcyB0byBhZGQgYSBzY3JvbGwgZXZlbnQgbGlzdGVuZXIgdGhhdCBjYWxscyBmb3IgYSBmbHVzaC5cblxuXHQvLyBgc2V0VGltZW91dGAgZG9lcyBub3QgY2FsbCB0aGUgcGFzc2VkIGNhbGxiYWNrIGlmIHRoZSBkZWxheSBpcyBsZXNzIHRoYW5cblx0Ly8gYXBwcm94aW1hdGVseSA3IGluIHdlYiB3b3JrZXJzIGluIEZpcmVmb3ggOCB0aHJvdWdoIDE4LCBhbmQgc29tZXRpbWVzIG5vdFxuXHQvLyBldmVuIHRoZW4uXG5cblx0ZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKGNhbGxiYWNrKSB7XG5cdCAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG5cdCAgICAgICAgLy8gV2UgZGlzcGF0Y2ggYSB0aW1lb3V0IHdpdGggYSBzcGVjaWZpZWQgZGVsYXkgb2YgMCBmb3IgZW5naW5lcyB0aGF0XG5cdCAgICAgICAgLy8gY2FuIHJlbGlhYmx5IGFjY29tbW9kYXRlIHRoYXQgcmVxdWVzdC4gVGhpcyB3aWxsIHVzdWFsbHkgYmUgc25hcHBlZFxuXHQgICAgICAgIC8vIHRvIGEgNCBtaWxpc2Vjb25kIGRlbGF5LCBidXQgb25jZSB3ZSdyZSBmbHVzaGluZywgdGhlcmUncyBubyBkZWxheVxuXHQgICAgICAgIC8vIGJldHdlZW4gZXZlbnRzLlxuXHQgICAgICAgIHZhciB0aW1lb3V0SGFuZGxlID0gc2V0VGltZW91dChoYW5kbGVUaW1lciwgMCk7XG5cdCAgICAgICAgLy8gSG93ZXZlciwgc2luY2UgdGhpcyB0aW1lciBnZXRzIGZyZXF1ZW50bHkgZHJvcHBlZCBpbiBGaXJlZm94XG5cdCAgICAgICAgLy8gd29ya2Vycywgd2UgZW5saXN0IGFuIGludGVydmFsIGhhbmRsZSB0aGF0IHdpbGwgdHJ5IHRvIGZpcmVcblx0ICAgICAgICAvLyBhbiBldmVudCAyMCB0aW1lcyBwZXIgc2Vjb25kIHVudGlsIGl0IHN1Y2NlZWRzLlxuXHQgICAgICAgIHZhciBpbnRlcnZhbEhhbmRsZSA9IHNldEludGVydmFsKGhhbmRsZVRpbWVyLCA1MCk7XG5cblx0ICAgICAgICBmdW5jdGlvbiBoYW5kbGVUaW1lcigpIHtcblx0ICAgICAgICAgICAgLy8gV2hpY2hldmVyIHRpbWVyIHN1Y2NlZWRzIHdpbGwgY2FuY2VsIGJvdGggdGltZXJzIGFuZFxuXHQgICAgICAgICAgICAvLyBleGVjdXRlIHRoZSBjYWxsYmFjay5cblx0ICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRIYW5kbGUpO1xuXHQgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsSGFuZGxlKTtcblx0ICAgICAgICAgICAgY2FsbGJhY2soKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXHR9XG5cblx0Ly8gVGhpcyBpcyBmb3IgYGFzYXAuanNgIG9ubHkuXG5cdC8vIEl0cyBuYW1lIHdpbGwgYmUgcGVyaW9kaWNhbGx5IHJhbmRvbWl6ZWQgdG8gYnJlYWsgYW55IGNvZGUgdGhhdCBkZXBlbmRzIG9uXG5cdC8vIGl0cyBleGlzdGVuY2UuXG5cdHJhd0FzYXAubWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyID0gbWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyO1xuXG5cdC8vIEFTQVAgd2FzIG9yaWdpbmFsbHkgYSBuZXh0VGljayBzaGltIGluY2x1ZGVkIGluIFEuIFRoaXMgd2FzIGZhY3RvcmVkIG91dFxuXHQvLyBpbnRvIHRoaXMgQVNBUCBwYWNrYWdlLiBJdCB3YXMgbGF0ZXIgYWRhcHRlZCB0byBSU1ZQIHdoaWNoIG1hZGUgZnVydGhlclxuXHQvLyBhbWVuZG1lbnRzLiBUaGVzZSBkZWNpc2lvbnMsIHBhcnRpY3VsYXJseSB0byBtYXJnaW5hbGl6ZSBNZXNzYWdlQ2hhbm5lbCBhbmRcblx0Ly8gdG8gY2FwdHVyZSB0aGUgTXV0YXRpb25PYnNlcnZlciBpbXBsZW1lbnRhdGlvbiBpbiBhIGNsb3N1cmUsIHdlcmUgaW50ZWdyYXRlZFxuXHQvLyBiYWNrIGludG8gQVNBUCBwcm9wZXIuXG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90aWxkZWlvL3JzdnAuanMvYmxvYi9jZGRmNzIzMjU0NmE5Y2Y4NTg1MjRiNzVjZGU2ZjllZGY3MjYyMGE3L2xpYi9yc3ZwL2FzYXAuanNcblxuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi99LmNhbGwoZXhwb3J0cywgKGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSgpKSkpXG5cbi8qKiovIH0sXG4vKiA2ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0Ly8gQSBzaW1wbGUgY2xhc3Mgc3lzdGVtLCBtb3JlIGRvY3VtZW50YXRpb24gdG8gY29tZVxuXG5cdGZ1bmN0aW9uIGV4dGVuZChjbHMsIG5hbWUsIHByb3BzKSB7XG5cdCAgICAvLyBUaGlzIGRvZXMgdGhhdCBzYW1lIHRoaW5nIGFzIE9iamVjdC5jcmVhdGUsIGJ1dCB3aXRoIHN1cHBvcnQgZm9yIElFOFxuXHQgICAgdmFyIEYgPSBmdW5jdGlvbigpIHt9O1xuXHQgICAgRi5wcm90b3R5cGUgPSBjbHMucHJvdG90eXBlO1xuXHQgICAgdmFyIHByb3RvdHlwZSA9IG5ldyBGKCk7XG5cblx0ICAgIC8vIGpzaGludCB1bmRlZjogZmFsc2Vcblx0ICAgIHZhciBmblRlc3QgPSAveHl6Ly50ZXN0KGZ1bmN0aW9uKCl7IHh5ejsgfSkgPyAvXFxicGFyZW50XFxiLyA6IC8uKi87XG5cdCAgICBwcm9wcyA9IHByb3BzIHx8IHt9O1xuXG5cdCAgICBmb3IodmFyIGsgaW4gcHJvcHMpIHtcblx0ICAgICAgICB2YXIgc3JjID0gcHJvcHNba107XG5cdCAgICAgICAgdmFyIHBhcmVudCA9IHByb3RvdHlwZVtrXTtcblxuXHQgICAgICAgIGlmKHR5cGVvZiBwYXJlbnQgPT09ICdmdW5jdGlvbicgJiZcblx0ICAgICAgICAgICB0eXBlb2Ygc3JjID09PSAnZnVuY3Rpb24nICYmXG5cdCAgICAgICAgICAgZm5UZXN0LnRlc3Qoc3JjKSkge1xuXHQgICAgICAgICAgICAvKmpzaGludCAtVzA4MyAqL1xuXHQgICAgICAgICAgICBwcm90b3R5cGVba10gPSAoZnVuY3Rpb24gKHNyYywgcGFyZW50KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgY3VycmVudCBwYXJlbnQgbWV0aG9kXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHRtcCA9IHRoaXMucGFyZW50O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHBhcmVudCB0byB0aGUgcHJldmlvdXMgbWV0aG9kLCBjYWxsLCBhbmQgcmVzdG9yZVxuXHQgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciByZXMgPSBzcmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IHRtcDtcblxuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG5cdCAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9KShzcmMsIHBhcmVudCk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBwcm90b3R5cGVba10gPSBzcmM7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBwcm90b3R5cGUudHlwZW5hbWUgPSBuYW1lO1xuXG5cdCAgICB2YXIgbmV3X2NscyA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmKHByb3RvdHlwZS5pbml0KSB7XG5cdCAgICAgICAgICAgIHByb3RvdHlwZS5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgbmV3X2Nscy5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG5cdCAgICBuZXdfY2xzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IG5ld19jbHM7XG5cblx0ICAgIG5ld19jbHMuZXh0ZW5kID0gZnVuY3Rpb24obmFtZSwgcHJvcHMpIHtcblx0ICAgICAgICBpZih0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcblx0ICAgICAgICAgICAgcHJvcHMgPSBuYW1lO1xuXHQgICAgICAgICAgICBuYW1lID0gJ2Fub255bW91cyc7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBleHRlbmQobmV3X2NscywgbmFtZSwgcHJvcHMpO1xuXHQgICAgfTtcblxuXHQgICAgcmV0dXJuIG5ld19jbHM7XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZChPYmplY3QsICdPYmplY3QnLCB7fSk7XG5cblxuLyoqKi8gfSxcbi8qIDcgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblx0dmFyIHIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDgpO1xuXG5cdGZ1bmN0aW9uIG5vcm1hbGl6ZSh2YWx1ZSwgZGVmYXVsdFZhbHVlKSB7XG5cdCAgICBpZih2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBmYWxzZSkge1xuXHQgICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdmFsdWU7XG5cdH1cblxuXHR2YXIgZmlsdGVycyA9IHtcblx0ICAgIGFiczogZnVuY3Rpb24obikge1xuXHQgICAgICAgIHJldHVybiBNYXRoLmFicyhuKTtcblx0ICAgIH0sXG5cblx0ICAgIGJhdGNoOiBmdW5jdGlvbihhcnIsIGxpbmVjb3VudCwgZmlsbF93aXRoKSB7XG5cdCAgICAgICAgdmFyIGk7XG5cdCAgICAgICAgdmFyIHJlcyA9IFtdO1xuXHQgICAgICAgIHZhciB0bXAgPSBbXTtcblxuXHQgICAgICAgIGZvcihpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICBpZihpICUgbGluZWNvdW50ID09PSAwICYmIHRtcC5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgIHJlcy5wdXNoKHRtcCk7XG5cdCAgICAgICAgICAgICAgICB0bXAgPSBbXTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHRtcC5wdXNoKGFycltpXSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYodG1wLmxlbmd0aCkge1xuXHQgICAgICAgICAgICBpZihmaWxsX3dpdGgpIHtcblx0ICAgICAgICAgICAgICAgIGZvcihpID0gdG1wLmxlbmd0aDsgaSA8IGxpbmVjb3VudDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdG1wLnB1c2goZmlsbF93aXRoKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJlcy5wdXNoKHRtcCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHJlcztcblx0ICAgIH0sXG5cblx0ICAgIGNhcGl0YWxpemU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB2YXIgcmV0ID0gc3RyLnRvTG93ZXJDYXNlKCk7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcmV0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcmV0LnNsaWNlKDEpKTtcblx0ICAgIH0sXG5cblx0ICAgIGNlbnRlcjogZnVuY3Rpb24oc3RyLCB3aWR0aCkge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IDgwO1xuXG5cdCAgICAgICAgaWYoc3RyLmxlbmd0aCA+PSB3aWR0aCkge1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBzcGFjZXMgPSB3aWR0aCAtIHN0ci5sZW5ndGg7XG5cdCAgICAgICAgdmFyIHByZSA9IGxpYi5yZXBlYXQoJyAnLCBzcGFjZXMvMiAtIHNwYWNlcyAlIDIpO1xuXHQgICAgICAgIHZhciBwb3N0ID0gbGliLnJlcGVhdCgnICcsIHNwYWNlcy8yKTtcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCBwcmUgKyBzdHIgKyBwb3N0KTtcblx0ICAgIH0sXG5cblx0ICAgICdkZWZhdWx0JzogZnVuY3Rpb24odmFsLCBkZWYsIGJvb2wpIHtcblx0ICAgICAgICBpZihib29sKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YWwgPyB2YWwgOiBkZWY7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICByZXR1cm4gKHZhbCAhPT0gdW5kZWZpbmVkKSA/IHZhbCA6IGRlZjtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBkaWN0c29ydDogZnVuY3Rpb24odmFsLCBjYXNlX3NlbnNpdGl2ZSwgYnkpIHtcblx0ICAgICAgICBpZiAoIWxpYi5pc09iamVjdCh2YWwpKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcignZGljdHNvcnQgZmlsdGVyOiB2YWwgbXVzdCBiZSBhbiBvYmplY3QnKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgYXJyYXkgPSBbXTtcblx0ICAgICAgICBmb3IgKHZhciBrIGluIHZhbCkge1xuXHQgICAgICAgICAgICAvLyBkZWxpYmVyYXRlbHkgaW5jbHVkZSBwcm9wZXJ0aWVzIGZyb20gdGhlIG9iamVjdCdzIHByb3RvdHlwZVxuXHQgICAgICAgICAgICBhcnJheS5wdXNoKFtrLHZhbFtrXV0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBzaTtcblx0ICAgICAgICBpZiAoYnkgPT09IHVuZGVmaW5lZCB8fCBieSA9PT0gJ2tleScpIHtcblx0ICAgICAgICAgICAgc2kgPSAwO1xuXHQgICAgICAgIH0gZWxzZSBpZiAoYnkgPT09ICd2YWx1ZScpIHtcblx0ICAgICAgICAgICAgc2kgPSAxO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcihcblx0ICAgICAgICAgICAgICAgICdkaWN0c29ydCBmaWx0ZXI6IFlvdSBjYW4gb25seSBzb3J0IGJ5IGVpdGhlciBrZXkgb3IgdmFsdWUnKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBhcnJheS5zb3J0KGZ1bmN0aW9uKHQxLCB0Mikge1xuXHQgICAgICAgICAgICB2YXIgYSA9IHQxW3NpXTtcblx0ICAgICAgICAgICAgdmFyIGIgPSB0MltzaV07XG5cblx0ICAgICAgICAgICAgaWYgKCFjYXNlX3NlbnNpdGl2ZSkge1xuXHQgICAgICAgICAgICAgICAgaWYgKGxpYi5pc1N0cmluZyhhKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGEgPSBhLnRvVXBwZXJDYXNlKCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBpZiAobGliLmlzU3RyaW5nKGIpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYiA9IGIudG9VcHBlckNhc2UoKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBhID4gYiA/IDEgOiAoYSA9PT0gYiA/IDAgOiAtMSk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gYXJyYXk7XG5cdCAgICB9LFxuXG5cdCAgICBkdW1wOiBmdW5jdGlvbihvYmosIHNwYWNlcykge1xuXHQgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsIHNwYWNlcyk7XG5cdCAgICB9LFxuXG5cdCAgICBlc2NhcGU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIGlmKHN0ciBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykge1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBzdHIgPSAoc3RyID09PSBudWxsIHx8IHN0ciA9PT0gdW5kZWZpbmVkKSA/ICcnIDogc3RyO1xuXHQgICAgICAgIHJldHVybiByLm1hcmtTYWZlKGxpYi5lc2NhcGUoc3RyLnRvU3RyaW5nKCkpKTtcblx0ICAgIH0sXG5cblx0ICAgIHNhZmU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIGlmIChzdHIgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgc3RyID0gKHN0ciA9PT0gbnVsbCB8fCBzdHIgPT09IHVuZGVmaW5lZCkgPyAnJyA6IHN0cjtcblx0ICAgICAgICByZXR1cm4gci5tYXJrU2FmZShzdHIudG9TdHJpbmcoKSk7XG5cdCAgICB9LFxuXG5cdCAgICBmaXJzdDogZnVuY3Rpb24oYXJyKSB7XG5cdCAgICAgICAgcmV0dXJuIGFyclswXTtcblx0ICAgIH0sXG5cblx0ICAgIGdyb3VwYnk6IGZ1bmN0aW9uKGFyciwgYXR0cikge1xuXHQgICAgICAgIHJldHVybiBsaWIuZ3JvdXBCeShhcnIsIGF0dHIpO1xuXHQgICAgfSxcblxuXHQgICAgaW5kZW50OiBmdW5jdGlvbihzdHIsIHdpZHRoLCBpbmRlbnRmaXJzdCkge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblxuXHQgICAgICAgIGlmIChzdHIgPT09ICcnKSByZXR1cm4gJyc7XG5cblx0ICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IDQ7XG5cdCAgICAgICAgdmFyIHJlcyA9ICcnO1xuXHQgICAgICAgIHZhciBsaW5lcyA9IHN0ci5zcGxpdCgnXFxuJyk7XG5cdCAgICAgICAgdmFyIHNwID0gbGliLnJlcGVhdCgnICcsIHdpZHRoKTtcblxuXHQgICAgICAgIGZvcih2YXIgaT0wOyBpPGxpbmVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGlmKGkgPT09IDAgJiYgIWluZGVudGZpcnN0KSB7XG5cdCAgICAgICAgICAgICAgICByZXMgKz0gbGluZXNbaV0gKyAnXFxuJztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJlcyArPSBzcCArIGxpbmVzW2ldICsgJ1xcbic7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXMpO1xuXHQgICAgfSxcblxuXHQgICAgam9pbjogZnVuY3Rpb24oYXJyLCBkZWwsIGF0dHIpIHtcblx0ICAgICAgICBkZWwgPSBkZWwgfHwgJyc7XG5cblx0ICAgICAgICBpZihhdHRyKSB7XG5cdCAgICAgICAgICAgIGFyciA9IGxpYi5tYXAoYXJyLCBmdW5jdGlvbih2KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdlthdHRyXTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGFyci5qb2luKGRlbCk7XG5cdCAgICB9LFxuXG5cdCAgICBsYXN0OiBmdW5jdGlvbihhcnIpIHtcblx0ICAgICAgICByZXR1cm4gYXJyW2Fyci5sZW5ndGgtMV07XG5cdCAgICB9LFxuXG5cdCAgICBsZW5ndGg6IGZ1bmN0aW9uKHZhbCkge1xuXHQgICAgICAgIHZhciB2YWx1ZSA9IG5vcm1hbGl6ZSh2YWwsICcnKTtcblxuXHQgICAgICAgIGlmKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgaWYoXG5cdCAgICAgICAgICAgICAgICAodHlwZW9mIE1hcCA9PT0gJ2Z1bmN0aW9uJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIE1hcCkgfHxcblx0ICAgICAgICAgICAgICAgICh0eXBlb2YgU2V0ID09PSAnZnVuY3Rpb24nICYmIHZhbHVlIGluc3RhbmNlb2YgU2V0KVxuXHQgICAgICAgICAgICApIHtcblx0ICAgICAgICAgICAgICAgIC8vIEVDTUFTY3JpcHQgMjAxNSBNYXBzIGFuZCBTZXRzXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuc2l6ZTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZihsaWIuaXNPYmplY3QodmFsdWUpICYmICEodmFsdWUgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpKSB7XG5cdCAgICAgICAgICAgICAgICAvLyBPYmplY3RzIChiZXNpZGVzIFNhZmVTdHJpbmdzKSwgbm9uLXByaW1hdGl2ZSBBcnJheXNcblx0ICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiB2YWx1ZS5sZW5ndGg7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiAwO1xuXHQgICAgfSxcblxuXHQgICAgbGlzdDogZnVuY3Rpb24odmFsKSB7XG5cdCAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhbC5zcGxpdCgnJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYobGliLmlzT2JqZWN0KHZhbCkpIHtcblx0ICAgICAgICAgICAgdmFyIGtleXMgPSBbXTtcblxuXHQgICAgICAgICAgICBpZihPYmplY3Qua2V5cykge1xuXHQgICAgICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKHZhbCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBmb3IodmFyIGsgaW4gdmFsKSB7XG5cdCAgICAgICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIGxpYi5tYXAoa2V5cywgZnVuY3Rpb24oaykge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHsga2V5OiBrLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbFtrXSB9O1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihsaWIuaXNBcnJheSh2YWwpKSB7XG5cdCAgICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKCdsaXN0IGZpbHRlcjogdHlwZSBub3QgaXRlcmFibGUnKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBsb3dlcjogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHJldHVybiBzdHIudG9Mb3dlckNhc2UoKTtcblx0ICAgIH0sXG5cblx0ICAgIG5sMmJyOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBpZiAoc3RyID09PSBudWxsIHx8IHN0ciA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiAnJztcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgc3RyLnJlcGxhY2UoL1xcclxcbnxcXG4vZywgJzxiciAvPlxcbicpKTtcblx0ICAgIH0sXG5cblx0ICAgIHJhbmRvbTogZnVuY3Rpb24oYXJyKSB7XG5cdCAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG5cdCAgICB9LFxuXG5cdCAgICByZWplY3RhdHRyOiBmdW5jdGlvbihhcnIsIGF0dHIpIHtcblx0ICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcblx0ICAgICAgICByZXR1cm4gIWl0ZW1bYXR0cl07XG5cdCAgICAgIH0pO1xuXHQgICAgfSxcblxuXHQgICAgc2VsZWN0YXR0cjogZnVuY3Rpb24oYXJyLCBhdHRyKSB7XG5cdCAgICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG5cdCAgICAgICAgcmV0dXJuICEhaXRlbVthdHRyXTtcblx0ICAgICAgfSk7XG5cdCAgICB9LFxuXG5cdCAgICByZXBsYWNlOiBmdW5jdGlvbihzdHIsIG9sZCwgbmV3XywgbWF4Q291bnQpIHtcblx0ICAgICAgICB2YXIgb3JpZ2luYWxTdHIgPSBzdHI7XG5cblx0ICAgICAgICBpZiAob2xkIGluc3RhbmNlb2YgUmVnRXhwKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZShvbGQsIG5ld18pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKHR5cGVvZiBtYXhDb3VudCA9PT0gJ3VuZGVmaW5lZCcpe1xuXHQgICAgICAgICAgICBtYXhDb3VudCA9IC0xO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciByZXMgPSAnJzsgIC8vIE91dHB1dFxuXG5cdCAgICAgICAgLy8gQ2FzdCBOdW1iZXJzIGluIHRoZSBzZWFyY2ggdGVybSB0byBzdHJpbmdcblx0ICAgICAgICBpZih0eXBlb2Ygb2xkID09PSAnbnVtYmVyJyl7XG5cdCAgICAgICAgICAgIG9sZCA9IG9sZCArICcnO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKHR5cGVvZiBvbGQgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIC8vIElmIGl0IGlzIHNvbWV0aGluZyBvdGhlciB0aGFuIG51bWJlciBvciBzdHJpbmcsXG5cdCAgICAgICAgICAgIC8vIHJldHVybiB0aGUgb3JpZ2luYWwgc3RyaW5nXG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gQ2FzdCBudW1iZXJzIGluIHRoZSByZXBsYWNlbWVudCB0byBzdHJpbmdcblx0ICAgICAgICBpZih0eXBlb2Ygc3RyID09PSAnbnVtYmVyJyl7XG5cdCAgICAgICAgICAgIHN0ciA9IHN0ciArICcnO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIElmIGJ5IG5vdywgd2UgZG9uJ3QgaGF2ZSBhIHN0cmluZywgdGhyb3cgaXQgYmFja1xuXHQgICAgICAgIGlmKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnICYmICEoc3RyIGluc3RhbmNlb2Ygci5TYWZlU3RyaW5nKSl7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gU2hvcnRDaXJjdWl0c1xuXHQgICAgICAgIGlmKG9sZCA9PT0gJycpe1xuXHQgICAgICAgICAgICAvLyBNaW1pYyB0aGUgcHl0aG9uIGJlaGF2aW91cjogZW1wdHkgc3RyaW5nIGlzIHJlcGxhY2VkXG5cdCAgICAgICAgICAgIC8vIGJ5IHJlcGxhY2VtZW50IGUuZy4gXCJhYmNcInxyZXBsYWNlKFwiXCIsIFwiLlwiKSAtPiAuYS5iLmMuXG5cdCAgICAgICAgICAgIHJlcyA9IG5ld18gKyBzdHIuc3BsaXQoJycpLmpvaW4obmV3XykgKyBuZXdfO1xuXHQgICAgICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXMpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBuZXh0SW5kZXggPSBzdHIuaW5kZXhPZihvbGQpO1xuXHQgICAgICAgIC8vIGlmICMgb2YgcmVwbGFjZW1lbnRzIHRvIHBlcmZvcm0gaXMgMCwgb3IgdGhlIHN0cmluZyB0byBkb2VzXG5cdCAgICAgICAgLy8gbm90IGNvbnRhaW4gdGhlIG9sZCB2YWx1ZSwgcmV0dXJuIHRoZSBzdHJpbmdcblx0ICAgICAgICBpZihtYXhDb3VudCA9PT0gMCB8fCBuZXh0SW5kZXggPT09IC0xKXtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgcG9zID0gMDtcblx0ICAgICAgICB2YXIgY291bnQgPSAwOyAvLyAjIG9mIHJlcGxhY2VtZW50cyBtYWRlXG5cblx0ICAgICAgICB3aGlsZShuZXh0SW5kZXggID4gLTEgJiYgKG1heENvdW50ID09PSAtMSB8fCBjb3VudCA8IG1heENvdW50KSl7XG5cdCAgICAgICAgICAgIC8vIEdyYWIgdGhlIG5leHQgY2h1bmsgb2Ygc3JjIHN0cmluZyBhbmQgYWRkIGl0IHdpdGggdGhlXG5cdCAgICAgICAgICAgIC8vIHJlcGxhY2VtZW50LCB0byB0aGUgcmVzdWx0XG5cdCAgICAgICAgICAgIHJlcyArPSBzdHIuc3Vic3RyaW5nKHBvcywgbmV4dEluZGV4KSArIG5ld187XG5cdCAgICAgICAgICAgIC8vIEluY3JlbWVudCBvdXIgcG9pbnRlciBpbiB0aGUgc3JjIHN0cmluZ1xuXHQgICAgICAgICAgICBwb3MgPSBuZXh0SW5kZXggKyBvbGQubGVuZ3RoO1xuXHQgICAgICAgICAgICBjb3VudCsrO1xuXHQgICAgICAgICAgICAvLyBTZWUgaWYgdGhlcmUgYXJlIGFueSBtb3JlIHJlcGxhY2VtZW50cyB0byBiZSBtYWRlXG5cdCAgICAgICAgICAgIG5leHRJbmRleCA9IHN0ci5pbmRleE9mKG9sZCwgcG9zKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBXZSd2ZSBlaXRoZXIgcmVhY2hlZCB0aGUgZW5kLCBvciBkb25lIHRoZSBtYXggIyBvZlxuXHQgICAgICAgIC8vIHJlcGxhY2VtZW50cywgdGFjayBvbiBhbnkgcmVtYWluaW5nIHN0cmluZ1xuXHQgICAgICAgIGlmKHBvcyA8IHN0ci5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgcmVzICs9IHN0ci5zdWJzdHJpbmcocG9zKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Mob3JpZ2luYWxTdHIsIHJlcyk7XG5cdCAgICB9LFxuXG5cdCAgICByZXZlcnNlOiBmdW5jdGlvbih2YWwpIHtcblx0ICAgICAgICB2YXIgYXJyO1xuXHQgICAgICAgIGlmKGxpYi5pc1N0cmluZyh2YWwpKSB7XG5cdCAgICAgICAgICAgIGFyciA9IGZpbHRlcnMubGlzdCh2YWwpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgLy8gQ29weSBpdFxuXHQgICAgICAgICAgICBhcnIgPSBsaWIubWFwKHZhbCwgZnVuY3Rpb24odikgeyByZXR1cm4gdjsgfSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgYXJyLnJldmVyc2UoKTtcblxuXHQgICAgICAgIGlmKGxpYi5pc1N0cmluZyh2YWwpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyh2YWwsIGFyci5qb2luKCcnKSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBhcnI7XG5cdCAgICB9LFxuXG5cdCAgICByb3VuZDogZnVuY3Rpb24odmFsLCBwcmVjaXNpb24sIG1ldGhvZCkge1xuXHQgICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbiB8fCAwO1xuXHQgICAgICAgIHZhciBmYWN0b3IgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKTtcblx0ICAgICAgICB2YXIgcm91bmRlcjtcblxuXHQgICAgICAgIGlmKG1ldGhvZCA9PT0gJ2NlaWwnKSB7XG5cdCAgICAgICAgICAgIHJvdW5kZXIgPSBNYXRoLmNlaWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYobWV0aG9kID09PSAnZmxvb3InKSB7XG5cdCAgICAgICAgICAgIHJvdW5kZXIgPSBNYXRoLmZsb29yO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgcm91bmRlciA9IE1hdGgucm91bmQ7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHJvdW5kZXIodmFsICogZmFjdG9yKSAvIGZhY3Rvcjtcblx0ICAgIH0sXG5cblx0ICAgIHNsaWNlOiBmdW5jdGlvbihhcnIsIHNsaWNlcywgZmlsbFdpdGgpIHtcblx0ICAgICAgICB2YXIgc2xpY2VMZW5ndGggPSBNYXRoLmZsb29yKGFyci5sZW5ndGggLyBzbGljZXMpO1xuXHQgICAgICAgIHZhciBleHRyYSA9IGFyci5sZW5ndGggJSBzbGljZXM7XG5cdCAgICAgICAgdmFyIG9mZnNldCA9IDA7XG5cdCAgICAgICAgdmFyIHJlcyA9IFtdO1xuXG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8c2xpY2VzOyBpKyspIHtcblx0ICAgICAgICAgICAgdmFyIHN0YXJ0ID0gb2Zmc2V0ICsgaSAqIHNsaWNlTGVuZ3RoO1xuXHQgICAgICAgICAgICBpZihpIDwgZXh0cmEpIHtcblx0ICAgICAgICAgICAgICAgIG9mZnNldCsrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHZhciBlbmQgPSBvZmZzZXQgKyAoaSArIDEpICogc2xpY2VMZW5ndGg7XG5cblx0ICAgICAgICAgICAgdmFyIHNsaWNlID0gYXJyLnNsaWNlKHN0YXJ0LCBlbmQpO1xuXHQgICAgICAgICAgICBpZihmaWxsV2l0aCAmJiBpID49IGV4dHJhKSB7XG5cdCAgICAgICAgICAgICAgICBzbGljZS5wdXNoKGZpbGxXaXRoKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXMucHVzaChzbGljZSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHJlcztcblx0ICAgIH0sXG5cblx0ICAgIHN1bTogZnVuY3Rpb24oYXJyLCBhdHRyLCBzdGFydCkge1xuXHQgICAgICAgIHZhciBzdW0gPSAwO1xuXG5cdCAgICAgICAgaWYodHlwZW9mIHN0YXJ0ID09PSAnbnVtYmVyJyl7XG5cdCAgICAgICAgICAgIHN1bSArPSBzdGFydDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZihhdHRyKSB7XG5cdCAgICAgICAgICAgIGFyciA9IGxpYi5tYXAoYXJyLCBmdW5jdGlvbih2KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdlthdHRyXTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICBzdW0gKz0gYXJyW2ldO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBzdW07XG5cdCAgICB9LFxuXG5cdCAgICBzb3J0OiByLm1ha2VNYWNybyhbJ3ZhbHVlJywgJ3JldmVyc2UnLCAnY2FzZV9zZW5zaXRpdmUnLCAnYXR0cmlidXRlJ10sIFtdLCBmdW5jdGlvbihhcnIsIHJldmVyc2UsIGNhc2VTZW5zLCBhdHRyKSB7XG5cdCAgICAgICAgIC8vIENvcHkgaXRcblx0ICAgICAgICBhcnIgPSBsaWIubWFwKGFyciwgZnVuY3Rpb24odikgeyByZXR1cm4gdjsgfSk7XG5cblx0ICAgICAgICBhcnIuc29ydChmdW5jdGlvbihhLCBiKSB7XG5cdCAgICAgICAgICAgIHZhciB4LCB5O1xuXG5cdCAgICAgICAgICAgIGlmKGF0dHIpIHtcblx0ICAgICAgICAgICAgICAgIHggPSBhW2F0dHJdO1xuXHQgICAgICAgICAgICAgICAgeSA9IGJbYXR0cl07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICB4ID0gYTtcblx0ICAgICAgICAgICAgICAgIHkgPSBiO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYoIWNhc2VTZW5zICYmIGxpYi5pc1N0cmluZyh4KSAmJiBsaWIuaXNTdHJpbmcoeSkpIHtcblx0ICAgICAgICAgICAgICAgIHggPSB4LnRvTG93ZXJDYXNlKCk7XG5cdCAgICAgICAgICAgICAgICB5ID0geS50b0xvd2VyQ2FzZSgpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYoeCA8IHkpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiByZXZlcnNlID8gMSA6IC0xO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYoeCA+IHkpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiByZXZlcnNlID8gLTE6IDE7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gMDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgcmV0dXJuIGFycjtcblx0ICAgIH0pLFxuXG5cdCAgICBzdHJpbmc6IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhvYmosIG9iaik7XG5cdCAgICB9LFxuXG5cdCAgICBzdHJpcHRhZ3M6IGZ1bmN0aW9uKGlucHV0LCBwcmVzZXJ2ZV9saW5lYnJlYWtzKSB7XG5cdCAgICAgICAgaW5wdXQgPSBub3JtYWxpemUoaW5wdXQsICcnKTtcblx0ICAgICAgICBwcmVzZXJ2ZV9saW5lYnJlYWtzID0gcHJlc2VydmVfbGluZWJyZWFrcyB8fCBmYWxzZTtcblx0ICAgICAgICB2YXIgdGFncyA9IC88XFwvPyhbYS16XVthLXowLTldKilcXGJbXj5dKj58PCEtLVtcXHNcXFNdKj8tLT4vZ2k7XG5cdCAgICAgICAgdmFyIHRyaW1tZWRJbnB1dCA9IGZpbHRlcnMudHJpbShpbnB1dC5yZXBsYWNlKHRhZ3MsICcnKSk7XG5cdCAgICAgICAgdmFyIHJlcyA9ICcnO1xuXHQgICAgICAgIGlmIChwcmVzZXJ2ZV9saW5lYnJlYWtzKSB7XG5cdCAgICAgICAgICAgIHJlcyA9IHRyaW1tZWRJbnB1dFxuXHQgICAgICAgICAgICAgICAgLnJlcGxhY2UoL14gK3wgKyQvZ20sICcnKSAgICAgLy8gcmVtb3ZlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNwYWNlc1xuXHQgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyArL2csICcgJykgICAgICAgICAgLy8gc3F1YXNoIGFkamFjZW50IHNwYWNlc1xuXHQgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhcXHJcXG4pL2csICdcXG4nKSAgICAgLy8gbm9ybWFsaXplIGxpbmVicmVha3MgKENSTEYgLT4gTEYpXG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxuXFxuXFxuKy9nLCAnXFxuXFxuJyk7IC8vIHNxdWFzaCBhYm5vcm1hbCBhZGphY2VudCBsaW5lYnJlYWtzXG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgcmVzID0gdHJpbW1lZElucHV0LnJlcGxhY2UoL1xccysvZ2ksICcgJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhpbnB1dCwgcmVzKTtcblx0ICAgIH0sXG5cblx0ICAgIHRpdGxlOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgdmFyIHdvcmRzID0gc3RyLnNwbGl0KCcgJyk7XG5cdCAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHdvcmRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIHdvcmRzW2ldID0gZmlsdGVycy5jYXBpdGFsaXplKHdvcmRzW2ldKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgd29yZHMuam9pbignICcpKTtcblx0ICAgIH0sXG5cblx0ICAgIHRyaW06IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHN0ci5yZXBsYWNlKC9eXFxzKnxcXHMqJC9nLCAnJykpO1xuXHQgICAgfSxcblxuXHQgICAgdHJ1bmNhdGU6IGZ1bmN0aW9uKGlucHV0LCBsZW5ndGgsIGtpbGx3b3JkcywgZW5kKSB7XG5cdCAgICAgICAgdmFyIG9yaWcgPSBpbnB1dDtcblx0ICAgICAgICBpbnB1dCA9IG5vcm1hbGl6ZShpbnB1dCwgJycpO1xuXHQgICAgICAgIGxlbmd0aCA9IGxlbmd0aCB8fCAyNTU7XG5cblx0ICAgICAgICBpZiAoaW5wdXQubGVuZ3RoIDw9IGxlbmd0aClcblx0ICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuXG5cdCAgICAgICAgaWYgKGtpbGx3b3Jkcykge1xuXHQgICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cmluZygwLCBsZW5ndGgpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBpZHggPSBpbnB1dC5sYXN0SW5kZXhPZignICcsIGxlbmd0aCk7XG5cdCAgICAgICAgICAgIGlmKGlkeCA9PT0gLTEpIHtcblx0ICAgICAgICAgICAgICAgIGlkeCA9IGxlbmd0aDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyaW5nKDAsIGlkeCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaW5wdXQgKz0gKGVuZCAhPT0gdW5kZWZpbmVkICYmIGVuZCAhPT0gbnVsbCkgPyBlbmQgOiAnLi4uJztcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Mob3JpZywgaW5wdXQpO1xuXHQgICAgfSxcblxuXHQgICAgdXBwZXI6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICByZXR1cm4gc3RyLnRvVXBwZXJDYXNlKCk7XG5cdCAgICB9LFxuXG5cdCAgICB1cmxlbmNvZGU6IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgICAgIHZhciBlbmMgPSBlbmNvZGVVUklDb21wb25lbnQ7XG5cdCAgICAgICAgaWYgKGxpYi5pc1N0cmluZyhvYmopKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBlbmMob2JqKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICB2YXIgcGFydHM7XG5cdCAgICAgICAgICAgIGlmIChsaWIuaXNBcnJheShvYmopKSB7XG5cdCAgICAgICAgICAgICAgICBwYXJ0cyA9IG9iai5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmMoaXRlbVswXSkgKyAnPScgKyBlbmMoaXRlbVsxXSk7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHBhcnRzID0gW107XG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluIG9iaikge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcGFydHMucHVzaChlbmMoaykgKyAnPScgKyBlbmMob2JqW2tdKSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBwYXJ0cy5qb2luKCcmJyk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgdXJsaXplOiBmdW5jdGlvbihzdHIsIGxlbmd0aCwgbm9mb2xsb3cpIHtcblx0ICAgICAgICBpZiAoaXNOYU4obGVuZ3RoKSkgbGVuZ3RoID0gSW5maW5pdHk7XG5cblx0ICAgICAgICB2YXIgbm9Gb2xsb3dBdHRyID0gKG5vZm9sbG93ID09PSB0cnVlID8gJyByZWw9XCJub2ZvbGxvd1wiJyA6ICcnKTtcblxuXHQgICAgICAgIC8vIEZvciB0aGUgamluamEgcmVnZXhwLCBzZWVcblx0ICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWl0c3VoaWtvL2ppbmphMi9ibG9iL2YxNWI4MTRkY2JhNmFhMTJiYzc0ZDFmN2QwYzg4MWQ1NWY3MTI2YmUvamluamEyL3V0aWxzLnB5I0wyMC1MMjNcblx0ICAgICAgICB2YXIgcHVuY1JFID0gL14oPzpcXCh8PHwmbHQ7KT8oLio/KSg/OlxcLnwsfFxcKXxcXG58Jmd0Oyk/JC87XG5cdCAgICAgICAgLy8gZnJvbSBodHRwOi8vYmxvZy5nZXJ2Lm5ldC8yMDExLzA1L2h0bWw1X2VtYWlsX2FkZHJlc3NfcmVnZXhwL1xuXHQgICAgICAgIHZhciBlbWFpbFJFID0gL15bXFx3LiEjJCUmJyorXFwtXFwvPT9cXF5ge3x9fl0rQFthLXpcXGRcXC1dKyhcXC5bYS16XFxkXFwtXSspKyQvaTtcblx0ICAgICAgICB2YXIgaHR0cEh0dHBzUkUgPSAvXmh0dHBzPzpcXC9cXC8uKiQvO1xuXHQgICAgICAgIHZhciB3d3dSRSA9IC9ed3d3XFwuLztcblx0ICAgICAgICB2YXIgdGxkUkUgPSAvXFwuKD86b3JnfG5ldHxjb20pKD86XFw6fFxcL3wkKS87XG5cblx0ICAgICAgICB2YXIgd29yZHMgPSBzdHIuc3BsaXQoLyhcXHMrKS8pLmZpbHRlcihmdW5jdGlvbih3b3JkKSB7XG5cdCAgICAgICAgICAvLyBJZiB0aGUgd29yZCBoYXMgbm8gbGVuZ3RoLCBiYWlsLiBUaGlzIGNhbiBoYXBwZW4gZm9yIHN0ciB3aXRoXG5cdCAgICAgICAgICAvLyB0cmFpbGluZyB3aGl0ZXNwYWNlLlxuXHQgICAgICAgICAgcmV0dXJuIHdvcmQgJiYgd29yZC5sZW5ndGg7XG5cdCAgICAgICAgfSkubWFwKGZ1bmN0aW9uKHdvcmQpIHtcblx0ICAgICAgICAgIHZhciBtYXRjaGVzID0gd29yZC5tYXRjaChwdW5jUkUpO1xuXHQgICAgICAgICAgdmFyIHBvc3NpYmxlVXJsID0gbWF0Y2hlcyAmJiBtYXRjaGVzWzFdIHx8IHdvcmQ7XG5cblx0ICAgICAgICAgIC8vIHVybCB0aGF0IHN0YXJ0cyB3aXRoIGh0dHAgb3IgaHR0cHNcblx0ICAgICAgICAgIGlmIChodHRwSHR0cHNSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiJyArIHBvc3NpYmxlVXJsICsgJ1wiJyArIG5vRm9sbG93QXR0ciArICc+JyArIHBvc3NpYmxlVXJsLnN1YnN0cigwLCBsZW5ndGgpICsgJzwvYT4nO1xuXG5cdCAgICAgICAgICAvLyB1cmwgdGhhdCBzdGFydHMgd2l0aCB3d3cuXG5cdCAgICAgICAgICBpZiAod3d3UkUudGVzdChwb3NzaWJsZVVybCkpXG5cdCAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly8nICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIC8vIGFuIGVtYWlsIGFkZHJlc3Mgb2YgdGhlIGZvcm0gdXNlcm5hbWVAZG9tYWluLnRsZFxuXHQgICAgICAgICAgaWYgKGVtYWlsUkUudGVzdChwb3NzaWJsZVVybCkpXG5cdCAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cIm1haWx0bzonICsgcG9zc2libGVVcmwgKyAnXCI+JyArIHBvc3NpYmxlVXJsICsgJzwvYT4nO1xuXG5cdCAgICAgICAgICAvLyB1cmwgdGhhdCBlbmRzIGluIC5jb20sIC5vcmcgb3IgLm5ldCB0aGF0IGlzIG5vdCBhbiBlbWFpbCBhZGRyZXNzXG5cdCAgICAgICAgICBpZiAodGxkUkUudGVzdChwb3NzaWJsZVVybCkpXG5cdCAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly8nICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIHJldHVybiB3b3JkO1xuXG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gd29yZHMuam9pbignJyk7XG5cdCAgICB9LFxuXG5cdCAgICB3b3JkY291bnQ6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB2YXIgd29yZHMgPSAoc3RyKSA/IHN0ci5tYXRjaCgvXFx3Ky9nKSA6IG51bGw7XG5cdCAgICAgICAgcmV0dXJuICh3b3JkcykgPyB3b3Jkcy5sZW5ndGggOiBudWxsO1xuXHQgICAgfSxcblxuXHQgICAgJ2Zsb2F0JzogZnVuY3Rpb24odmFsLCBkZWYpIHtcblx0ICAgICAgICB2YXIgcmVzID0gcGFyc2VGbG9hdCh2YWwpO1xuXHQgICAgICAgIHJldHVybiBpc05hTihyZXMpID8gZGVmIDogcmVzO1xuXHQgICAgfSxcblxuXHQgICAgJ2ludCc6IGZ1bmN0aW9uKHZhbCwgZGVmKSB7XG5cdCAgICAgICAgdmFyIHJlcyA9IHBhcnNlSW50KHZhbCwgMTApO1xuXHQgICAgICAgIHJldHVybiBpc05hTihyZXMpID8gZGVmIDogcmVzO1xuXHQgICAgfVxuXHR9O1xuXG5cdC8vIEFsaWFzZXNcblx0ZmlsdGVycy5kID0gZmlsdGVyc1snZGVmYXVsdCddO1xuXHRmaWx0ZXJzLmUgPSBmaWx0ZXJzLmVzY2FwZTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IGZpbHRlcnM7XG5cblxuLyoqKi8gfSxcbi8qIDggKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblx0dmFyIE9iaiA9IF9fd2VicGFja19yZXF1aXJlX18oNik7XG5cblx0Ly8gRnJhbWVzIGtlZXAgdHJhY2sgb2Ygc2NvcGluZyBib3RoIGF0IGNvbXBpbGUtdGltZSBhbmQgcnVuLXRpbWUgc29cblx0Ly8gd2Uga25vdyBob3cgdG8gYWNjZXNzIHZhcmlhYmxlcy4gQmxvY2sgdGFncyBjYW4gaW50cm9kdWNlIHNwZWNpYWxcblx0Ly8gdmFyaWFibGVzLCBmb3IgZXhhbXBsZS5cblx0dmFyIEZyYW1lID0gT2JqLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbihwYXJlbnQsIGlzb2xhdGVXcml0ZXMpIHtcblx0ICAgICAgICB0aGlzLnZhcmlhYmxlcyA9IHt9O1xuXHQgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuXHQgICAgICAgIHRoaXMudG9wTGV2ZWwgPSBmYWxzZTtcblx0ICAgICAgICAvLyBpZiB0aGlzIGlzIHRydWUsIHdyaXRlcyAoc2V0KSBzaG91bGQgbmV2ZXIgcHJvcGFnYXRlIHVwd2FyZHMgcGFzdFxuXHQgICAgICAgIC8vIHRoaXMgZnJhbWUgdG8gaXRzIHBhcmVudCAodGhvdWdoIHJlYWRzIG1heSkuXG5cdCAgICAgICAgdGhpcy5pc29sYXRlV3JpdGVzID0gaXNvbGF0ZVdyaXRlcztcblx0ICAgIH0sXG5cblx0ICAgIHNldDogZnVuY3Rpb24obmFtZSwgdmFsLCByZXNvbHZlVXApIHtcblx0ICAgICAgICAvLyBBbGxvdyB2YXJpYWJsZXMgd2l0aCBkb3RzIGJ5IGF1dG9tYXRpY2FsbHkgY3JlYXRpbmcgdGhlXG5cdCAgICAgICAgLy8gbmVzdGVkIHN0cnVjdHVyZVxuXHQgICAgICAgIHZhciBwYXJ0cyA9IG5hbWUuc3BsaXQoJy4nKTtcblx0ICAgICAgICB2YXIgb2JqID0gdGhpcy52YXJpYWJsZXM7XG5cdCAgICAgICAgdmFyIGZyYW1lID0gdGhpcztcblxuXHQgICAgICAgIGlmKHJlc29sdmVVcCkge1xuXHQgICAgICAgICAgICBpZigoZnJhbWUgPSB0aGlzLnJlc29sdmUocGFydHNbMF0sIHRydWUpKSkge1xuXHQgICAgICAgICAgICAgICAgZnJhbWUuc2V0KG5hbWUsIHZhbCk7XG5cdCAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmb3IodmFyIGk9MDsgaTxwYXJ0cy5sZW5ndGggLSAxOyBpKyspIHtcblx0ICAgICAgICAgICAgdmFyIGlkID0gcGFydHNbaV07XG5cblx0ICAgICAgICAgICAgaWYoIW9ialtpZF0pIHtcblx0ICAgICAgICAgICAgICAgIG9ialtpZF0gPSB7fTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBvYmogPSBvYmpbaWRdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIG9ialtwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXV0gPSB2YWw7XG5cdCAgICB9LFxuXG5cdCAgICBnZXQ6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICB2YXIgdmFsID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG5cdCAgICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICB9LFxuXG5cdCAgICBsb29rdXA6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICB2YXIgcCA9IHRoaXMucGFyZW50O1xuXHQgICAgICAgIHZhciB2YWwgPSB0aGlzLnZhcmlhYmxlc1tuYW1lXTtcblx0ICAgICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gcCAmJiBwLmxvb2t1cChuYW1lKTtcblx0ICAgIH0sXG5cblx0ICAgIHJlc29sdmU6IGZ1bmN0aW9uKG5hbWUsIGZvcldyaXRlKSB7XG5cdCAgICAgICAgdmFyIHAgPSAoZm9yV3JpdGUgJiYgdGhpcy5pc29sYXRlV3JpdGVzKSA/IHVuZGVmaW5lZCA6IHRoaXMucGFyZW50O1xuXHQgICAgICAgIHZhciB2YWwgPSB0aGlzLnZhcmlhYmxlc1tuYW1lXTtcblx0ICAgICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHAgJiYgcC5yZXNvbHZlKG5hbWUpO1xuXHQgICAgfSxcblxuXHQgICAgcHVzaDogZnVuY3Rpb24oaXNvbGF0ZVdyaXRlcykge1xuXHQgICAgICAgIHJldHVybiBuZXcgRnJhbWUodGhpcywgaXNvbGF0ZVdyaXRlcyk7XG5cdCAgICB9LFxuXG5cdCAgICBwb3A6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLnBhcmVudDtcblx0ICAgIH1cblx0fSk7XG5cblx0ZnVuY3Rpb24gbWFrZU1hY3JvKGFyZ05hbWVzLCBrd2FyZ05hbWVzLCBmdW5jKSB7XG5cdCAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIGFyZ0NvdW50ID0gbnVtQXJncyhhcmd1bWVudHMpO1xuXHQgICAgICAgIHZhciBhcmdzO1xuXHQgICAgICAgIHZhciBrd2FyZ3MgPSBnZXRLZXl3b3JkQXJncyhhcmd1bWVudHMpO1xuXHQgICAgICAgIHZhciBpO1xuXG5cdCAgICAgICAgaWYoYXJnQ291bnQgPiBhcmdOYW1lcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgYXJnTmFtZXMubGVuZ3RoKTtcblxuXHQgICAgICAgICAgICAvLyBQb3NpdGlvbmFsIGFyZ3VtZW50cyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgaW4gYXNcblx0ICAgICAgICAgICAgLy8ga2V5d29yZCBhcmd1bWVudHMgKGVzc2VudGlhbGx5IGRlZmF1bHQgdmFsdWVzKVxuXHQgICAgICAgICAgICB2YXIgdmFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgYXJncy5sZW5ndGgsIGFyZ0NvdW50KTtcblx0ICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgdmFscy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgaWYoaSA8IGt3YXJnTmFtZXMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAga3dhcmdzW2t3YXJnTmFtZXNbaV1dID0gdmFsc1tpXTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGFyZ3MucHVzaChrd2FyZ3MpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKGFyZ0NvdW50IDwgYXJnTmFtZXMubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIGFyZ0NvdW50KTtcblxuXHQgICAgICAgICAgICBmb3IoaSA9IGFyZ0NvdW50OyBpIDwgYXJnTmFtZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmdOYW1lc1tpXTtcblxuXHQgICAgICAgICAgICAgICAgLy8gS2V5d29yZCBhcmd1bWVudHMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIGFzXG5cdCAgICAgICAgICAgICAgICAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50cywgaS5lLiB0aGUgY2FsbGVyIGV4cGxpY2l0bHlcblx0ICAgICAgICAgICAgICAgIC8vIHVzZWQgdGhlIG5hbWUgb2YgYSBwb3NpdGlvbmFsIGFyZ1xuXHQgICAgICAgICAgICAgICAgYXJncy5wdXNoKGt3YXJnc1thcmddKTtcblx0ICAgICAgICAgICAgICAgIGRlbGV0ZSBrd2FyZ3NbYXJnXTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGFyZ3MucHVzaChrd2FyZ3MpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcblx0ICAgIH07XG5cdH1cblxuXHRmdW5jdGlvbiBtYWtlS2V5d29yZEFyZ3Mob2JqKSB7XG5cdCAgICBvYmouX19rZXl3b3JkcyA9IHRydWU7XG5cdCAgICByZXR1cm4gb2JqO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0S2V5d29yZEFyZ3MoYXJncykge1xuXHQgICAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuXHQgICAgaWYobGVuKSB7XG5cdCAgICAgICAgdmFyIGxhc3RBcmcgPSBhcmdzW2xlbiAtIDFdO1xuXHQgICAgICAgIGlmKGxhc3RBcmcgJiYgbGFzdEFyZy5oYXNPd25Qcm9wZXJ0eSgnX19rZXl3b3JkcycpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBsYXN0QXJnO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHJldHVybiB7fTtcblx0fVxuXG5cdGZ1bmN0aW9uIG51bUFyZ3MoYXJncykge1xuXHQgICAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuXHQgICAgaWYobGVuID09PSAwKSB7XG5cdCAgICAgICAgcmV0dXJuIDA7XG5cdCAgICB9XG5cblx0ICAgIHZhciBsYXN0QXJnID0gYXJnc1tsZW4gLSAxXTtcblx0ICAgIGlmKGxhc3RBcmcgJiYgbGFzdEFyZy5oYXNPd25Qcm9wZXJ0eSgnX19rZXl3b3JkcycpKSB7XG5cdCAgICAgICAgcmV0dXJuIGxlbiAtIDE7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICByZXR1cm4gbGVuO1xuXHQgICAgfVxuXHR9XG5cblx0Ly8gQSBTYWZlU3RyaW5nIG9iamVjdCBpbmRpY2F0ZXMgdGhhdCB0aGUgc3RyaW5nIHNob3VsZCBub3QgYmVcblx0Ly8gYXV0b2VzY2FwZWQuIFRoaXMgaGFwcGVucyBtYWdpY2FsbHkgYmVjYXVzZSBhdXRvZXNjYXBpbmcgb25seVxuXHQvLyBvY2N1cnMgb24gcHJpbWl0aXZlIHN0cmluZyBvYmplY3RzLlxuXHRmdW5jdGlvbiBTYWZlU3RyaW5nKHZhbCkge1xuXHQgICAgaWYodHlwZW9mIHZhbCAhPT0gJ3N0cmluZycpIHtcblx0ICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgfVxuXG5cdCAgICB0aGlzLnZhbCA9IHZhbDtcblx0ICAgIHRoaXMubGVuZ3RoID0gdmFsLmxlbmd0aDtcblx0fVxuXG5cdFNhZmVTdHJpbmcucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdHJpbmcucHJvdG90eXBlLCB7XG5cdCAgICBsZW5ndGg6IHsgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgdmFsdWU6IDAgfVxuXHR9KTtcblx0U2FmZVN0cmluZy5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uKCkge1xuXHQgICAgcmV0dXJuIHRoaXMudmFsO1xuXHR9O1xuXHRTYWZlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXHQgICAgcmV0dXJuIHRoaXMudmFsO1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGNvcHlTYWZlbmVzcyhkZXN0LCB0YXJnZXQpIHtcblx0ICAgIGlmKGRlc3QgaW5zdGFuY2VvZiBTYWZlU3RyaW5nKSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBTYWZlU3RyaW5nKHRhcmdldCk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdGFyZ2V0LnRvU3RyaW5nKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBtYXJrU2FmZSh2YWwpIHtcblx0ICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbDtcblxuXHQgICAgaWYodHlwZSA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICByZXR1cm4gbmV3IFNhZmVTdHJpbmcodmFsKTtcblx0ICAgIH1cblx0ICAgIGVsc2UgaWYodHlwZSAhPT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHZhciByZXQgPSB2YWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuXHQgICAgICAgICAgICBpZih0eXBlb2YgcmV0ID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTYWZlU3RyaW5nKHJldCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gcmV0O1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cdH1cblxuXHRmdW5jdGlvbiBzdXBwcmVzc1ZhbHVlKHZhbCwgYXV0b2VzY2FwZSkge1xuXHQgICAgdmFsID0gKHZhbCAhPT0gdW5kZWZpbmVkICYmIHZhbCAhPT0gbnVsbCkgPyB2YWwgOiAnJztcblxuXHQgICAgaWYoYXV0b2VzY2FwZSAmJiAhKHZhbCBpbnN0YW5jZW9mIFNhZmVTdHJpbmcpKSB7XG5cdCAgICAgICAgdmFsID0gbGliLmVzY2FwZSh2YWwudG9TdHJpbmcoKSk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiB2YWw7XG5cdH1cblxuXHRmdW5jdGlvbiBlbnN1cmVEZWZpbmVkKHZhbCwgbGluZW5vLCBjb2xubykge1xuXHQgICAgaWYodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKFxuXHQgICAgICAgICAgICAnYXR0ZW1wdGVkIHRvIG91dHB1dCBudWxsIG9yIHVuZGVmaW5lZCB2YWx1ZScsXG5cdCAgICAgICAgICAgIGxpbmVubyArIDEsXG5cdCAgICAgICAgICAgIGNvbG5vICsgMVxuXHQgICAgICAgICk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdmFsO1xuXHR9XG5cblx0ZnVuY3Rpb24gbWVtYmVyTG9va3VwKG9iaiwgdmFsKSB7XG5cdCAgICBvYmogPSBvYmogfHwge307XG5cblx0ICAgIGlmKHR5cGVvZiBvYmpbdmFsXSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIG9ialt2YWxdLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gb2JqW3ZhbF07XG5cdH1cblxuXHRmdW5jdGlvbiBjYWxsV3JhcChvYmosIG5hbWUsIGNvbnRleHQsIGFyZ3MpIHtcblx0ICAgIGlmKCFvYmopIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjYWxsIGAnICsgbmFtZSArICdgLCB3aGljaCBpcyB1bmRlZmluZWQgb3IgZmFsc2V5Jyk7XG5cdCAgICB9XG5cdCAgICBlbHNlIGlmKHR5cGVvZiBvYmogIT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjYWxsIGAnICsgbmFtZSArICdgLCB3aGljaCBpcyBub3QgYSBmdW5jdGlvbicpO1xuXHQgICAgfVxuXG5cdCAgICAvLyBqc2hpbnQgdmFsaWR0aGlzOiB0cnVlXG5cdCAgICByZXR1cm4gb2JqLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIG5hbWUpIHtcblx0ICAgIHZhciB2YWwgPSBmcmFtZS5sb29rdXAobmFtZSk7XG5cdCAgICByZXR1cm4gKHZhbCAhPT0gdW5kZWZpbmVkKSA/XG5cdCAgICAgICAgdmFsIDpcblx0ICAgICAgICBjb250ZXh0Lmxvb2t1cChuYW1lKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUVycm9yKGVycm9yLCBsaW5lbm8sIGNvbG5vKSB7XG5cdCAgICBpZihlcnJvci5saW5lbm8pIHtcblx0ICAgICAgICByZXR1cm4gZXJyb3I7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICByZXR1cm4gbmV3IGxpYi5UZW1wbGF0ZUVycm9yKGVycm9yLCBsaW5lbm8sIGNvbG5vKTtcblx0ICAgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIGFzeW5jRWFjaChhcnIsIGRpbWVuLCBpdGVyLCBjYikge1xuXHQgICAgaWYobGliLmlzQXJyYXkoYXJyKSkge1xuXHQgICAgICAgIHZhciBsZW4gPSBhcnIubGVuZ3RoO1xuXG5cdCAgICAgICAgbGliLmFzeW5jSXRlcihhcnIsIGZ1bmN0aW9uKGl0ZW0sIGksIG5leHQpIHtcblx0ICAgICAgICAgICAgc3dpdGNoKGRpbWVuKSB7XG5cdCAgICAgICAgICAgIGNhc2UgMTogaXRlcihpdGVtLCBpLCBsZW4sIG5leHQpOyBicmVhaztcblx0ICAgICAgICAgICAgY2FzZSAyOiBpdGVyKGl0ZW1bMF0sIGl0ZW1bMV0sIGksIGxlbiwgbmV4dCk7IGJyZWFrO1xuXHQgICAgICAgICAgICBjYXNlIDM6IGl0ZXIoaXRlbVswXSwgaXRlbVsxXSwgaXRlbVsyXSwgaSwgbGVuLCBuZXh0KTsgYnJlYWs7XG5cdCAgICAgICAgICAgIGRlZmF1bHQ6XG5cdCAgICAgICAgICAgICAgICBpdGVtLnB1c2goaSwgbmV4dCk7XG5cdCAgICAgICAgICAgICAgICBpdGVyLmFwcGx5KHRoaXMsIGl0ZW0pO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSwgY2IpO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgbGliLmFzeW5jRm9yKGFyciwgZnVuY3Rpb24oa2V5LCB2YWwsIGksIGxlbiwgbmV4dCkge1xuXHQgICAgICAgICAgICBpdGVyKGtleSwgdmFsLCBpLCBsZW4sIG5leHQpO1xuXHQgICAgICAgIH0sIGNiKTtcblx0ICAgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIGFzeW5jQWxsKGFyciwgZGltZW4sIGZ1bmMsIGNiKSB7XG5cdCAgICB2YXIgZmluaXNoZWQgPSAwO1xuXHQgICAgdmFyIGxlbiwgaTtcblx0ICAgIHZhciBvdXRwdXRBcnI7XG5cblx0ICAgIGZ1bmN0aW9uIGRvbmUoaSwgb3V0cHV0KSB7XG5cdCAgICAgICAgZmluaXNoZWQrKztcblx0ICAgICAgICBvdXRwdXRBcnJbaV0gPSBvdXRwdXQ7XG5cblx0ICAgICAgICBpZihmaW5pc2hlZCA9PT0gbGVuKSB7XG5cdCAgICAgICAgICAgIGNiKG51bGwsIG91dHB1dEFyci5qb2luKCcnKSk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBpZihsaWIuaXNBcnJheShhcnIpKSB7XG5cdCAgICAgICAgbGVuID0gYXJyLmxlbmd0aDtcblx0ICAgICAgICBvdXRwdXRBcnIgPSBuZXcgQXJyYXkobGVuKTtcblxuXHQgICAgICAgIGlmKGxlbiA9PT0gMCkge1xuXHQgICAgICAgICAgICBjYihudWxsLCAnJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHZhciBpdGVtID0gYXJyW2ldO1xuXG5cdCAgICAgICAgICAgICAgICBzd2l0Y2goZGltZW4pIHtcblx0ICAgICAgICAgICAgICAgIGNhc2UgMTogZnVuYyhpdGVtLCBpLCBsZW4sIGRvbmUpOyBicmVhaztcblx0ICAgICAgICAgICAgICAgIGNhc2UgMjogZnVuYyhpdGVtWzBdLCBpdGVtWzFdLCBpLCBsZW4sIGRvbmUpOyBicmVhaztcblx0ICAgICAgICAgICAgICAgIGNhc2UgMzogZnVuYyhpdGVtWzBdLCBpdGVtWzFdLCBpdGVtWzJdLCBpLCBsZW4sIGRvbmUpOyBicmVhaztcblx0ICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG5cdCAgICAgICAgICAgICAgICAgICAgaXRlbS5wdXNoKGksIGRvbmUpO1xuXHQgICAgICAgICAgICAgICAgICAgIC8vIGpzaGludCB2YWxpZHRoaXM6IHRydWVcblx0ICAgICAgICAgICAgICAgICAgICBmdW5jLmFwcGx5KHRoaXMsIGl0ZW0pO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgdmFyIGtleXMgPSBsaWIua2V5cyhhcnIpO1xuXHQgICAgICAgIGxlbiA9IGtleXMubGVuZ3RoO1xuXHQgICAgICAgIG91dHB1dEFyciA9IG5ldyBBcnJheShsZW4pO1xuXG5cdCAgICAgICAgaWYobGVuID09PSAwKSB7XG5cdCAgICAgICAgICAgIGNiKG51bGwsICcnKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIHZhciBrID0ga2V5c1tpXTtcblx0ICAgICAgICAgICAgICAgIGZ1bmMoaywgYXJyW2tdLCBpLCBsZW4sIGRvbmUpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMgPSB7XG5cdCAgICBGcmFtZTogRnJhbWUsXG5cdCAgICBtYWtlTWFjcm86IG1ha2VNYWNybyxcblx0ICAgIG1ha2VLZXl3b3JkQXJnczogbWFrZUtleXdvcmRBcmdzLFxuXHQgICAgbnVtQXJnczogbnVtQXJncyxcblx0ICAgIHN1cHByZXNzVmFsdWU6IHN1cHByZXNzVmFsdWUsXG5cdCAgICBlbnN1cmVEZWZpbmVkOiBlbnN1cmVEZWZpbmVkLFxuXHQgICAgbWVtYmVyTG9va3VwOiBtZW1iZXJMb29rdXAsXG5cdCAgICBjb250ZXh0T3JGcmFtZUxvb2t1cDogY29udGV4dE9yRnJhbWVMb29rdXAsXG5cdCAgICBjYWxsV3JhcDogY2FsbFdyYXAsXG5cdCAgICBoYW5kbGVFcnJvcjogaGFuZGxlRXJyb3IsXG5cdCAgICBpc0FycmF5OiBsaWIuaXNBcnJheSxcblx0ICAgIGtleXM6IGxpYi5rZXlzLFxuXHQgICAgU2FmZVN0cmluZzogU2FmZVN0cmluZyxcblx0ICAgIGNvcHlTYWZlbmVzczogY29weVNhZmVuZXNzLFxuXHQgICAgbWFya1NhZmU6IG1hcmtTYWZlLFxuXHQgICAgYXN5bmNFYWNoOiBhc3luY0VhY2gsXG5cdCAgICBhc3luY0FsbDogYXN5bmNBbGwsXG5cdCAgICBpbk9wZXJhdG9yOiBsaWIuaW5PcGVyYXRvclxuXHR9O1xuXG5cbi8qKiovIH0sXG4vKiA5ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0ZnVuY3Rpb24gY3ljbGVyKGl0ZW1zKSB7XG5cdCAgICB2YXIgaW5kZXggPSAtMTtcblxuXHQgICAgcmV0dXJuIHtcblx0ICAgICAgICBjdXJyZW50OiBudWxsLFxuXHQgICAgICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgaW5kZXggPSAtMTtcblx0ICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gbnVsbDtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIGluZGV4Kys7XG5cdCAgICAgICAgICAgIGlmKGluZGV4ID49IGl0ZW1zLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgaW5kZXggPSAwO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gaXRlbXNbaW5kZXhdO1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50O1xuXHQgICAgICAgIH0sXG5cdCAgICB9O1xuXG5cdH1cblxuXHRmdW5jdGlvbiBqb2luZXIoc2VwKSB7XG5cdCAgICBzZXAgPSBzZXAgfHwgJywnO1xuXHQgICAgdmFyIGZpcnN0ID0gdHJ1ZTtcblxuXHQgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciB2YWwgPSBmaXJzdCA/ICcnIDogc2VwO1xuXHQgICAgICAgIGZpcnN0ID0gZmFsc2U7XG5cdCAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgIH07XG5cdH1cblxuXHQvLyBNYWtpbmcgdGhpcyBhIGZ1bmN0aW9uIGluc3RlYWQgc28gaXQgcmV0dXJucyBhIG5ldyBvYmplY3Rcblx0Ly8gZWFjaCB0aW1lIGl0J3MgY2FsbGVkLiBUaGF0IHdheSwgaWYgc29tZXRoaW5nIGxpa2UgYW4gZW52aXJvbm1lbnRcblx0Ly8gdXNlcyBpdCwgdGhleSB3aWxsIGVhY2ggaGF2ZSB0aGVpciBvd24gY29weS5cblx0ZnVuY3Rpb24gZ2xvYmFscygpIHtcblx0ICAgIHJldHVybiB7XG5cdCAgICAgICAgcmFuZ2U6IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG5cdCAgICAgICAgICAgIGlmKHR5cGVvZiBzdG9wID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgICAgICAgICAgc3RvcCA9IHN0YXJ0O1xuXHQgICAgICAgICAgICAgICAgc3RhcnQgPSAwO1xuXHQgICAgICAgICAgICAgICAgc3RlcCA9IDE7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZighc3RlcCkge1xuXHQgICAgICAgICAgICAgICAgc3RlcCA9IDE7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB2YXIgYXJyID0gW107XG5cdCAgICAgICAgICAgIHZhciBpO1xuXHQgICAgICAgICAgICBpZiAoc3RlcCA+IDApIHtcblx0ICAgICAgICAgICAgICAgIGZvciAoaT1zdGFydDsgaTxzdG9wOyBpKz1zdGVwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2goaSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKGk9c3RhcnQ7IGk+c3RvcDsgaSs9c3RlcCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGFyci5wdXNoKGkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBhcnI7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8vIGxpcHN1bTogZnVuY3Rpb24obiwgaHRtbCwgbWluLCBtYXgpIHtcblx0ICAgICAgICAvLyB9LFxuXG5cdCAgICAgICAgY3ljbGVyOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGN5Y2xlcihBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgam9pbmVyOiBmdW5jdGlvbihzZXApIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGpvaW5lcihzZXApO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IGdsb2JhbHM7XG5cblxuLyoqKi8gfSxcbi8qIDEwICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHR2YXIgX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXywgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX187LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovKGZ1bmN0aW9uKHNldEltbWVkaWF0ZSwgcHJvY2Vzcykgey8vIE1JVCBsaWNlbnNlIChieSBFbGFuIFNoYW5rZXIpLlxuXHQoZnVuY3Rpb24oZ2xvYmFscykge1xuXHQgICd1c2Ugc3RyaWN0JztcblxuXHQgIHZhciBleGVjdXRlU3luYyA9IGZ1bmN0aW9uKCl7XG5cdCAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cdCAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdmdW5jdGlvbicpe1xuXHQgICAgICBhcmdzWzBdLmFwcGx5KG51bGwsIGFyZ3Muc3BsaWNlKDEpKTtcblx0ICAgIH1cblx0ICB9O1xuXG5cdCAgdmFyIGV4ZWN1dGVBc3luYyA9IGZ1bmN0aW9uKGZuKXtcblx0ICAgIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgIHNldEltbWVkaWF0ZShmbik7XG5cdCAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG5cdCAgICAgIHByb2Nlc3MubmV4dFRpY2soZm4pO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgc2V0VGltZW91dChmbiwgMCk7XG5cdCAgICB9XG5cdCAgfTtcblxuXHQgIHZhciBtYWtlSXRlcmF0b3IgPSBmdW5jdGlvbiAodGFza3MpIHtcblx0ICAgIHZhciBtYWtlQ2FsbGJhY2sgPSBmdW5jdGlvbiAoaW5kZXgpIHtcblx0ICAgICAgdmFyIGZuID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIGlmICh0YXNrcy5sZW5ndGgpIHtcblx0ICAgICAgICAgIHRhc2tzW2luZGV4XS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gZm4ubmV4dCgpO1xuXHQgICAgICB9O1xuXHQgICAgICBmbi5uZXh0ID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIHJldHVybiAoaW5kZXggPCB0YXNrcy5sZW5ndGggLSAxKSA/IG1ha2VDYWxsYmFjayhpbmRleCArIDEpOiBudWxsO1xuXHQgICAgICB9O1xuXHQgICAgICByZXR1cm4gZm47XG5cdCAgICB9O1xuXHQgICAgcmV0dXJuIG1ha2VDYWxsYmFjaygwKTtcblx0ICB9O1xuXHQgIFxuXHQgIHZhciBfaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24obWF5YmVBcnJheSl7XG5cdCAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG1heWJlQXJyYXkpID09PSAnW29iamVjdCBBcnJheV0nO1xuXHQgIH07XG5cblx0ICB2YXIgd2F0ZXJmYWxsID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaywgZm9yY2VBc3luYykge1xuXHQgICAgdmFyIG5leHRUaWNrID0gZm9yY2VBc3luYyA/IGV4ZWN1dGVBc3luYyA6IGV4ZWN1dGVTeW5jO1xuXHQgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbiAoKSB7fTtcblx0ICAgIGlmICghX2lzQXJyYXkodGFza3MpKSB7XG5cdCAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IHRvIHdhdGVyZmFsbCBtdXN0IGJlIGFuIGFycmF5IG9mIGZ1bmN0aW9ucycpO1xuXHQgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0ICAgIH1cblx0ICAgIGlmICghdGFza3MubGVuZ3RoKSB7XG5cdCAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuXHQgICAgfVxuXHQgICAgdmFyIHdyYXBJdGVyYXRvciA9IGZ1bmN0aW9uIChpdGVyYXRvcikge1xuXHQgICAgICByZXR1cm4gZnVuY3Rpb24gKGVycikge1xuXHQgICAgICAgIGlmIChlcnIpIHtcblx0ICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHt9O1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdCAgICAgICAgICB2YXIgbmV4dCA9IGl0ZXJhdG9yLm5leHQoKTtcblx0ICAgICAgICAgIGlmIChuZXh0KSB7XG5cdCAgICAgICAgICAgIGFyZ3MucHVzaCh3cmFwSXRlcmF0b3IobmV4dCkpO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgYXJncy5wdXNoKGNhbGxiYWNrKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgaXRlcmF0b3IuYXBwbHkobnVsbCwgYXJncyk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICAgIH07XG5cdCAgICB9O1xuXHQgICAgd3JhcEl0ZXJhdG9yKG1ha2VJdGVyYXRvcih0YXNrcykpKCk7XG5cdCAgfTtcblxuXHQgIGlmICh0cnVlKSB7XG5cdCAgICAhKF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18gPSBbXSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgIHJldHVybiB3YXRlcmZhbGw7XG5cdCAgICB9LmFwcGx5KGV4cG9ydHMsIF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18pLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyAhPT0gdW5kZWZpbmVkICYmIChtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fKSk7IC8vIFJlcXVpcmVKU1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gd2F0ZXJmYWxsOyAvLyBDb21tb25KU1xuXHQgIH0gZWxzZSB7XG5cdCAgICBnbG9iYWxzLndhdGVyZmFsbCA9IHdhdGVyZmFsbDsgLy8gPHNjcmlwdD5cblx0ICB9XG5cdH0pKHRoaXMpO1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqL30uY2FsbChleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKDExKS5zZXRJbW1lZGlhdGUsIF9fd2VicGFja19yZXF1aXJlX18oMykpKVxuXG4vKioqLyB9LFxuLyogMTEgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqLyhmdW5jdGlvbihzZXRJbW1lZGlhdGUsIGNsZWFySW1tZWRpYXRlKSB7dmFyIG5leHRUaWNrID0gX193ZWJwYWNrX3JlcXVpcmVfXygxMikubmV4dFRpY2s7XG5cdHZhciBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseTtcblx0dmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXHR2YXIgaW1tZWRpYXRlSWRzID0ge307XG5cdHZhciBuZXh0SW1tZWRpYXRlSWQgPSAwO1xuXG5cdC8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cblx0ZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG5cdCAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0VGltZW91dCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhclRpbWVvdXQpO1xuXHR9O1xuXHRleHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG5cdCAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0SW50ZXJ2YWwsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG5cdH07XG5cdGV4cG9ydHMuY2xlYXJUaW1lb3V0ID1cblx0ZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkgeyB0aW1lb3V0LmNsb3NlKCk7IH07XG5cblx0ZnVuY3Rpb24gVGltZW91dChpZCwgY2xlYXJGbikge1xuXHQgIHRoaXMuX2lkID0gaWQ7XG5cdCAgdGhpcy5fY2xlYXJGbiA9IGNsZWFyRm47XG5cdH1cblx0VGltZW91dC5wcm90b3R5cGUudW5yZWYgPSBUaW1lb3V0LnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbigpIHt9O1xuXHRUaW1lb3V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuXHQgIHRoaXMuX2NsZWFyRm4uY2FsbCh3aW5kb3csIHRoaXMuX2lkKTtcblx0fTtcblxuXHQvLyBEb2VzIG5vdCBzdGFydCB0aGUgdGltZSwganVzdCBzZXRzIHVwIHRoZSBtZW1iZXJzIG5lZWRlZC5cblx0ZXhwb3J0cy5lbnJvbGwgPSBmdW5jdGlvbihpdGVtLCBtc2Vjcykge1xuXHQgIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblx0ICBpdGVtLl9pZGxlVGltZW91dCA9IG1zZWNzO1xuXHR9O1xuXG5cdGV4cG9ydHMudW5lbnJvbGwgPSBmdW5jdGlvbihpdGVtKSB7XG5cdCAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXHQgIGl0ZW0uX2lkbGVUaW1lb3V0ID0gLTE7XG5cdH07XG5cblx0ZXhwb3J0cy5fdW5yZWZBY3RpdmUgPSBleHBvcnRzLmFjdGl2ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0ICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cblx0ICB2YXIgbXNlY3MgPSBpdGVtLl9pZGxlVGltZW91dDtcblx0ICBpZiAobXNlY3MgPj0gMCkge1xuXHQgICAgaXRlbS5faWRsZVRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gb25UaW1lb3V0KCkge1xuXHQgICAgICBpZiAoaXRlbS5fb25UaW1lb3V0KVxuXHQgICAgICAgIGl0ZW0uX29uVGltZW91dCgpO1xuXHQgICAgfSwgbXNlY3MpO1xuXHQgIH1cblx0fTtcblxuXHQvLyBUaGF0J3Mgbm90IGhvdyBub2RlLmpzIGltcGxlbWVudHMgaXQgYnV0IHRoZSBleHBvc2VkIGFwaSBpcyB0aGUgc2FtZS5cblx0ZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBzZXRJbW1lZGlhdGUgOiBmdW5jdGlvbihmbikge1xuXHQgIHZhciBpZCA9IG5leHRJbW1lZGlhdGVJZCsrO1xuXHQgIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aCA8IDIgPyBmYWxzZSA6IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuXHQgIGltbWVkaWF0ZUlkc1tpZF0gPSB0cnVlO1xuXG5cdCAgbmV4dFRpY2soZnVuY3Rpb24gb25OZXh0VGljaygpIHtcblx0ICAgIGlmIChpbW1lZGlhdGVJZHNbaWRdKSB7XG5cdCAgICAgIC8vIGZuLmNhbGwoKSBpcyBmYXN0ZXIgc28gd2Ugb3B0aW1pemUgZm9yIHRoZSBjb21tb24gdXNlLWNhc2Vcblx0ICAgICAgLy8gQHNlZSBodHRwOi8vanNwZXJmLmNvbS9jYWxsLWFwcGx5LXNlZ3Vcblx0ICAgICAgaWYgKGFyZ3MpIHtcblx0ICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBmbi5jYWxsKG51bGwpO1xuXHQgICAgICB9XG5cdCAgICAgIC8vIFByZXZlbnQgaWRzIGZyb20gbGVha2luZ1xuXHQgICAgICBleHBvcnRzLmNsZWFySW1tZWRpYXRlKGlkKTtcblx0ICAgIH1cblx0ICB9KTtcblxuXHQgIHJldHVybiBpZDtcblx0fTtcblxuXHRleHBvcnRzLmNsZWFySW1tZWRpYXRlID0gdHlwZW9mIGNsZWFySW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBjbGVhckltbWVkaWF0ZSA6IGZ1bmN0aW9uKGlkKSB7XG5cdCAgZGVsZXRlIGltbWVkaWF0ZUlkc1tpZF07XG5cdH07XG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqL30uY2FsbChleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKDExKS5zZXRJbW1lZGlhdGUsIF9fd2VicGFja19yZXF1aXJlX18oMTEpLmNsZWFySW1tZWRpYXRlKSlcblxuLyoqKi8gfSxcbi8qIDEyICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHQvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxuXHR2YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cdHZhciBxdWV1ZSA9IFtdO1xuXHR2YXIgZHJhaW5pbmcgPSBmYWxzZTtcblx0dmFyIGN1cnJlbnRRdWV1ZTtcblx0dmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuXHRmdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG5cdCAgICBkcmFpbmluZyA9IGZhbHNlO1xuXHQgICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcblx0ICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG5cdCAgICB9XG5cdCAgICBpZiAocXVldWUubGVuZ3RoKSB7XG5cdCAgICAgICAgZHJhaW5RdWV1ZSgpO1xuXHQgICAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcblx0ICAgIGlmIChkcmFpbmluZykge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgIH1cblx0ICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuXHQgICAgZHJhaW5pbmcgPSB0cnVlO1xuXG5cdCAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuXHQgICAgd2hpbGUobGVuKSB7XG5cdCAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG5cdCAgICAgICAgcXVldWUgPSBbXTtcblx0ICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG5cdCAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcblx0ICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG5cdCAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuXHQgICAgfVxuXHQgICAgY3VycmVudFF1ZXVlID0gbnVsbDtcblx0ICAgIGRyYWluaW5nID0gZmFsc2U7XG5cdCAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdH1cblxuXHRwcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuXHQgICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuXHQgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG5cdCAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHQgICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcblx0ICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG5cdCAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcblx0ICAgIH1cblx0fTtcblxuXHQvLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5cdGZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuXHQgICAgdGhpcy5mdW4gPSBmdW47XG5cdCAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG5cdH1cblx0SXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG5cdH07XG5cdHByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5cdHByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5cdHByb2Nlc3MuZW52ID0ge307XG5cdHByb2Nlc3MuYXJndiA9IFtdO1xuXHRwcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcblx0cHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5cdGZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5cdHByb2Nlc3Mub24gPSBub29wO1xuXHRwcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcblx0cHJvY2Vzcy5vbmNlID0gbm9vcDtcblx0cHJvY2Vzcy5vZmYgPSBub29wO1xuXHRwcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcblx0cHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xuXHRwcm9jZXNzLmVtaXQgPSBub29wO1xuXG5cdHByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdCAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG5cdH07XG5cblx0cHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcblx0cHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcblx0ICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG5cdH07XG5cdHByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG5cblxuLyoqKi8gfSxcbi8qIDEzICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIExvYWRlciA9IF9fd2VicGFja19yZXF1aXJlX18oMTQpO1xuXG5cdHZhciBQcmVjb21waWxlZExvYWRlciA9IExvYWRlci5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24oY29tcGlsZWRUZW1wbGF0ZXMpIHtcblx0ICAgICAgICB0aGlzLnByZWNvbXBpbGVkID0gY29tcGlsZWRUZW1wbGF0ZXMgfHwge307XG5cdCAgICB9LFxuXG5cdCAgICBnZXRTb3VyY2U6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZiAodGhpcy5wcmVjb21waWxlZFtuYW1lXSkge1xuXHQgICAgICAgICAgICByZXR1cm4ge1xuXHQgICAgICAgICAgICAgICAgc3JjOiB7IHR5cGU6ICdjb2RlJyxcblx0ICAgICAgICAgICAgICAgICAgICAgICBvYmo6IHRoaXMucHJlY29tcGlsZWRbbmFtZV0gfSxcblx0ICAgICAgICAgICAgICAgIHBhdGg6IG5hbWVcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICB9XG5cdH0pO1xuXG5cdG1vZHVsZS5leHBvcnRzID0gUHJlY29tcGlsZWRMb2FkZXI7XG5cblxuLyoqKi8gfSxcbi8qIDE0ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIHBhdGggPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgT2JqID0gX193ZWJwYWNrX3JlcXVpcmVfXyg2KTtcblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cblx0dmFyIExvYWRlciA9IE9iai5leHRlbmQoe1xuXHQgICAgb246IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpIHtcblx0ICAgICAgICB0aGlzLmxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzIHx8IHt9O1xuXHQgICAgICAgIHRoaXMubGlzdGVuZXJzW25hbWVdID0gdGhpcy5saXN0ZW5lcnNbbmFtZV0gfHwgW107XG5cdCAgICAgICAgdGhpcy5saXN0ZW5lcnNbbmFtZV0ucHVzaChmdW5jKTtcblx0ICAgIH0sXG5cblx0ICAgIGVtaXQ6IGZ1bmN0aW9uKG5hbWUgLyosIGFyZzEsIGFyZzIsIC4uLiovKSB7XG5cdCAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG5cdCAgICAgICAgaWYodGhpcy5saXN0ZW5lcnMgJiYgdGhpcy5saXN0ZW5lcnNbbmFtZV0pIHtcblx0ICAgICAgICAgICAgbGliLmVhY2godGhpcy5saXN0ZW5lcnNbbmFtZV0sIGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG5cdCAgICAgICAgICAgICAgICBsaXN0ZW5lci5hcHBseShudWxsLCBhcmdzKTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgcmVzb2x2ZTogZnVuY3Rpb24oZnJvbSwgdG8pIHtcblx0ICAgICAgICByZXR1cm4gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShmcm9tKSwgdG8pO1xuXHQgICAgfSxcblxuXHQgICAgaXNSZWxhdGl2ZTogZnVuY3Rpb24oZmlsZW5hbWUpIHtcblx0ICAgICAgICByZXR1cm4gKGZpbGVuYW1lLmluZGV4T2YoJy4vJykgPT09IDAgfHwgZmlsZW5hbWUuaW5kZXhPZignLi4vJykgPT09IDApO1xuXHQgICAgfVxuXHR9KTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IExvYWRlcjtcblxuXG4vKioqLyB9LFxuLyogMTUgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdGZ1bmN0aW9uIGluc3RhbGxDb21wYXQoKSB7XG5cdCAgJ3VzZSBzdHJpY3QnO1xuXG5cdCAgLy8gVGhpcyBtdXN0IGJlIGNhbGxlZCBsaWtlIGBudW5qdWNrcy5pbnN0YWxsQ29tcGF0YCBzbyB0aGF0IGB0aGlzYFxuXHQgIC8vIHJlZmVyZW5jZXMgdGhlIG51bmp1Y2tzIGluc3RhbmNlXG5cdCAgdmFyIHJ1bnRpbWUgPSB0aGlzLnJ1bnRpbWU7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgIHZhciBsaWIgPSB0aGlzLmxpYjsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cblx0ICB2YXIgb3JpZ19jb250ZXh0T3JGcmFtZUxvb2t1cCA9IHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXA7XG5cdCAgcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cCA9IGZ1bmN0aW9uKGNvbnRleHQsIGZyYW1lLCBrZXkpIHtcblx0ICAgIHZhciB2YWwgPSBvcmlnX2NvbnRleHRPckZyYW1lTG9va3VwLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgc3dpdGNoIChrZXkpIHtcblx0ICAgICAgY2FzZSAnVHJ1ZSc6XG5cdCAgICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICAgIGNhc2UgJ0ZhbHNlJzpcblx0ICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgIGNhc2UgJ05vbmUnOlxuXHQgICAgICAgIHJldHVybiBudWxsO1xuXHQgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiB2YWw7XG5cdCAgfTtcblxuXHQgIHZhciBvcmlnX21lbWJlckxvb2t1cCA9IHJ1bnRpbWUubWVtYmVyTG9va3VwO1xuXHQgIHZhciBBUlJBWV9NRU1CRVJTID0ge1xuXHQgICAgcG9wOiBmdW5jdGlvbihpbmRleCkge1xuXHQgICAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLnBvcCgpO1xuXHQgICAgICB9XG5cdCAgICAgIGlmIChpbmRleCA+PSB0aGlzLmxlbmd0aCB8fCBpbmRleCA8IDApIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0tleUVycm9yJyk7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcblx0ICAgIH0sXG5cdCAgICBhcHBlbmQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5wdXNoKGVsZW1lbnQpO1xuXHQgICAgfSxcblx0ICAgIHJlbW92ZTogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICBpZiAodGhpc1tpXSA9PT0gZWxlbWVudCkge1xuXHQgICAgICAgICAgcmV0dXJuIHRoaXMuc3BsaWNlKGksIDEpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlRXJyb3InKTtcblx0ICAgIH0sXG5cdCAgICBjb3VudDogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICB2YXIgY291bnQgPSAwO1xuXHQgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICBpZiAodGhpc1tpXSA9PT0gZWxlbWVudCkge1xuXHQgICAgICAgICAgY291bnQrKztcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIGNvdW50O1xuXHQgICAgfSxcblx0ICAgIGluZGV4OiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgIHZhciBpO1xuXHQgICAgICBpZiAoKGkgPSB0aGlzLmluZGV4T2YoZWxlbWVudCkpID09PSAtMSkge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsdWVFcnJvcicpO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiBpO1xuXHQgICAgfSxcblx0ICAgIGZpbmQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihlbGVtZW50KTtcblx0ICAgIH0sXG5cdCAgICBpbnNlcnQ6IGZ1bmN0aW9uKGluZGV4LCBlbGVtKSB7XG5cdCAgICAgIHJldHVybiB0aGlzLnNwbGljZShpbmRleCwgMCwgZWxlbSk7XG5cdCAgICB9XG5cdCAgfTtcblx0ICB2YXIgT0JKRUNUX01FTUJFUlMgPSB7XG5cdCAgICBpdGVtczogZnVuY3Rpb24oKSB7XG5cdCAgICAgIHZhciByZXQgPSBbXTtcblx0ICAgICAgZm9yKHZhciBrIGluIHRoaXMpIHtcblx0ICAgICAgICByZXQucHVzaChbaywgdGhpc1trXV0pO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiByZXQ7XG5cdCAgICB9LFxuXHQgICAgdmFsdWVzOiBmdW5jdGlvbigpIHtcblx0ICAgICAgdmFyIHJldCA9IFtdO1xuXHQgICAgICBmb3IodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgIHJldC5wdXNoKHRoaXNba10pO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiByZXQ7XG5cdCAgICB9LFxuXHQgICAga2V5czogZnVuY3Rpb24oKSB7XG5cdCAgICAgIHZhciByZXQgPSBbXTtcblx0ICAgICAgZm9yKHZhciBrIGluIHRoaXMpIHtcblx0ICAgICAgICByZXQucHVzaChrKTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gcmV0O1xuXHQgICAgfSxcblx0ICAgIGdldDogZnVuY3Rpb24oa2V5LCBkZWYpIHtcblx0ICAgICAgdmFyIG91dHB1dCA9IHRoaXNba2V5XTtcblx0ICAgICAgaWYgKG91dHB1dCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgb3V0cHV0ID0gZGVmO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiBvdXRwdXQ7XG5cdCAgICB9LFxuXHQgICAgaGFzX2tleTogZnVuY3Rpb24oa2V5KSB7XG5cdCAgICAgIHJldHVybiB0aGlzLmhhc093blByb3BlcnR5KGtleSk7XG5cdCAgICB9LFxuXHQgICAgcG9wOiBmdW5jdGlvbihrZXksIGRlZikge1xuXHQgICAgICB2YXIgb3V0cHV0ID0gdGhpc1trZXldO1xuXHQgICAgICBpZiAob3V0cHV0ID09PSB1bmRlZmluZWQgJiYgZGVmICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICBvdXRwdXQgPSBkZWY7XG5cdCAgICAgIH0gZWxzZSBpZiAob3V0cHV0ID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0tleUVycm9yJyk7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgZGVsZXRlIHRoaXNba2V5XTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gb3V0cHV0O1xuXHQgICAgfSxcblx0ICAgIHBvcGl0ZW06IGZ1bmN0aW9uKCkge1xuXHQgICAgICBmb3IgKHZhciBrIGluIHRoaXMpIHtcblx0ICAgICAgICAvLyBSZXR1cm4gdGhlIGZpcnN0IG9iamVjdCBwYWlyLlxuXHQgICAgICAgIHZhciB2YWwgPSB0aGlzW2tdO1xuXHQgICAgICAgIGRlbGV0ZSB0aGlzW2tdO1xuXHQgICAgICAgIHJldHVybiBbaywgdmFsXTtcblx0ICAgICAgfVxuXHQgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0tleUVycm9yJyk7XG5cdCAgICB9LFxuXHQgICAgc2V0ZGVmYXVsdDogZnVuY3Rpb24oa2V5LCBkZWYpIHtcblx0ICAgICAgaWYgKGtleSBpbiB0aGlzKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXNba2V5XTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAoZGVmID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICBkZWYgPSBudWxsO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiB0aGlzW2tleV0gPSBkZWY7XG5cdCAgICB9LFxuXHQgICAgdXBkYXRlOiBmdW5jdGlvbihrd2FyZ3MpIHtcblx0ICAgICAgZm9yICh2YXIgayBpbiBrd2FyZ3MpIHtcblx0ICAgICAgICB0aGlzW2tdID0ga3dhcmdzW2tdO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiBudWxsOyAgLy8gQWx3YXlzIHJldHVybnMgTm9uZVxuXHQgICAgfVxuXHQgIH07XG5cdCAgT0JKRUNUX01FTUJFUlMuaXRlcml0ZW1zID0gT0JKRUNUX01FTUJFUlMuaXRlbXM7XG5cdCAgT0JKRUNUX01FTUJFUlMuaXRlcnZhbHVlcyA9IE9CSkVDVF9NRU1CRVJTLnZhbHVlcztcblx0ICBPQkpFQ1RfTUVNQkVSUy5pdGVya2V5cyA9IE9CSkVDVF9NRU1CRVJTLmtleXM7XG5cdCAgcnVudGltZS5tZW1iZXJMb29rdXAgPSBmdW5jdGlvbihvYmosIHZhbCwgYXV0b2VzY2FwZSkgeyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgIG9iaiA9IG9iaiB8fCB7fTtcblxuXHQgICAgLy8gSWYgdGhlIG9iamVjdCBpcyBhbiBvYmplY3QsIHJldHVybiBhbnkgb2YgdGhlIG1ldGhvZHMgdGhhdCBQeXRob24gd291bGRcblx0ICAgIC8vIG90aGVyd2lzZSBwcm92aWRlLlxuXHQgICAgaWYgKGxpYi5pc0FycmF5KG9iaikgJiYgQVJSQVlfTUVNQkVSUy5oYXNPd25Qcm9wZXJ0eSh2YWwpKSB7XG5cdCAgICAgIHJldHVybiBmdW5jdGlvbigpIHtyZXR1cm4gQVJSQVlfTUVNQkVSU1t2YWxdLmFwcGx5KG9iaiwgYXJndW1lbnRzKTt9O1xuXHQgICAgfVxuXG5cdCAgICBpZiAobGliLmlzT2JqZWN0KG9iaikgJiYgT0JKRUNUX01FTUJFUlMuaGFzT3duUHJvcGVydHkodmFsKSkge1xuXHQgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7cmV0dXJuIE9CSkVDVF9NRU1CRVJTW3ZhbF0uYXBwbHkob2JqLCBhcmd1bWVudHMpO307XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBvcmlnX21lbWJlckxvb2t1cC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgIH07XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IGluc3RhbGxDb21wYXQ7XG5cblxuLyoqKi8gfVxuLyoqKioqKi8gXSlcbn0pO1xuOyIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSkge1xub3V0cHV0ICs9IFwiXFxuPGRpdiBjbGFzcz1cXFwibGItdHlwZSBsYi10eXBlLS1lbWJlZCBsYi10eXBlLS1cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcImxvd2VyXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInByb3ZpZGVyX25hbWVcIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJodG1sXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcblwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXCI7XG5pZigocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInRpdGxlXCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJkZXNjcmlwdGlvblwiKSB8fCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY3JlZGl0XCIpIHx8IChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiaHRtbFwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidGh1bWJuYWlsX3VybFwiKSkpKSB7XG5vdXRwdXQgKz0gXCJcXG48YXJ0aWNsZSBjbGFzcz1cXFwiaXRlbS0tZW1iZWQgaXRlbS0tZW1iZWRfX3dyYXBwZXJcXFwiPlxcbiAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJodG1sXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aHVtYm5haWxfdXJsXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGEgaHJlZj1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ1cmxcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCIgY2xhc3M9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZSgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImRlc2NyaXB0aW9uXCIpP1wiaXRlbS0tZW1iZWRfX2lsbHVzdHJhdGlvblwiOlwiaXRlbS0tZW1iZWRfX29ubHktaWxsdXN0cmF0aW9uXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XFxuICAgICAgICA8aW1nIHNyYz1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aHVtYm5haWxfdXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIvPlxcbiAgIDwvYT5cXG4gICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInRpdGxlXCIpIHx8IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJkZXNjcmlwdGlvblwiKSB8fCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY3JlZGl0XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICA8ZGl2IGNsYXNzPVxcXCJpdGVtLS1lbWJlZF9faW5mb1xcXCI+XFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJ0aXRsZVwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpdGVtLS1lbWJlZF9fdGl0bGVcXFwiPlxcbiAgICAgICAgICAgIDxhIGhyZWY9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwidXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiIHRpdGxlPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcInRpdGxlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+PC9hPlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiZGVzY3JpcHRpb25cIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiaXRlbS0tZW1iZWRfX2Rlc2NyaXB0aW9uXFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImRlc2NyaXB0aW9uXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcbiAgICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpdGVtLS1lbWJlZF9fY3JlZGl0XFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNyZWRpdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgIDwvZGl2PlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbjwvYXJ0aWNsZT5cXG5cIjtcbjtcbn1cbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPGZpZ3VyZT5cXG4gIDxpbWcgXFxuICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcImFjdGl2ZVwiKSkge1xub3V0cHV0ICs9IFwiY2xhc3M9XFxcImFjdGl2ZVxcXCJcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJ0aHVtYm5haWxcIikpLFwiaHJlZlwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiXFxuICAgIHNyY3NldD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcImJhc2VJbWFnZVwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIiA4MTB3LCBcXG4gICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcInRodW1ibmFpbFwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIiAyNDB3LCBcXG4gICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcInZpZXdJbWFnZVwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIiA1NDB3XFxcIiBcXG4gICAgYWx0PVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNhcHRpb25cIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gIDxmaWdjYXB0aW9uPlxcbiAgICA8c3BhbiBuZy1pZj1cXFwicmVmLml0ZW0ubWV0YS5jYXB0aW9uXFxcIiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XFxuICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjYXB0aW9uXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICA8L3NwYW4+Jm5ic3A7XFxuICAgIDxzcGFuIG5nLWlmPVxcXCJyZWYuaXRlbS5tZXRhLmNyZWRpdFxcXCIgY2xhc3M9XFxcImNyZWRpdFxcXCI+XFxuICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJjcmVkaXRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgIDwvc3Bhbj5cXG4gIDwvZmlnY2FwdGlvbj5cXG48L2ZpZ3VyZT5cXG5cXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPGFydGljbGVcXG4gIGNsYXNzPVxcXCJsYi1wb3N0IGxpc3QtZ3JvdXAtaXRlbSBzaG93LWF1dGhvci1hdmF0YXIgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93R2FsbGVyeVwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpKSwwKSksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcImltYWdlXCIgJiYgZW52LmdldEZpbHRlcihcImxlbmd0aFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJncm91cHNcIikpLDEpKSxcInJlZnNcIikpID4gMSkge1xub3V0cHV0ICs9IFwic2xpZGVzaG93XCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiXFxuICBkYXRhLWpzLXBvc3QtaWQ9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcIl9pZFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInN0aWNreVwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLXR5cGVcXFwiPjwvZGl2PlxcbiAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJsYi10eXBlIGxiLXR5cGUtLXRleHRcXFwiPjwvZGl2PlxcbiAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJoaWdobGlnaHRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJsYi1wb3N0LWhpZ2hsaWdodGVkXFxcIj48L2Rpdj5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICA8ZGl2IGNsYXNzPVxcXCJsYi1wb3N0LWRhdGVcXFwiIGRhdGEtanMtdGltZXN0YW1wPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfdXBkYXRlZFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcIl91cGRhdGVkXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcblxcbiAgPCEtLSBhdXRob3IgcGx1cyBhdmF0YXIgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJsYi1hdXRob3JcXFwiPlxcbiAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dBdXRob3JcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJwdWJsaXNoZXJcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcImxiLWF1dGhvcl9fbmFtZVxcXCI+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInB1Ymxpc2hlclwiKSksXCJkaXNwbGF5X25hbWVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9kaXY+XFxuICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93QXV0aG9yQXZhdGFyXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicHVibGlzaGVyXCIpKSxcInBpY3R1cmVfdXJsXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxpbWcgY2xhc3M9XFxcImxiLWF1dGhvcl9fYXZhdGFyXFxcIiBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJwdWJsaXNoZXJcIikpLFwicGljdHVyZV91cmxcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIiAvPlxcbiAgICAgICAgXCI7XG47XG59XG5lbHNlIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yX19hdmF0YXJcXFwiPjwvZGl2PlxcbiAgICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgPC9kaXY+XFxuICA8IS0tIGVuZCBhdXRob3IgLS0+XFxuXFxuICA8IS0tIGl0ZW0gc3RhcnQgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJpdGVtcy1jb250YWluZXJcXFwiPlxcbiAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMyA9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJncm91cHNcIikpLDEpKSxcInJlZnNcIik7XG5pZih0XzMpIHt2YXIgdF8yID0gdF8zLmxlbmd0aDtcbmZvcih2YXIgdF8xPTA7IHRfMSA8IHRfMy5sZW5ndGg7IHRfMSsrKSB7XG52YXIgdF80ID0gdF8zW3RfMV07XG5mcmFtZS5zZXQoXCJyZWZcIiwgdF80KTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF8xICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzIgLSB0XzEpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF8yIC0gdF8xIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfMSA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF8xID09PSB0XzIgLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfMik7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwiaW1hZ2VcIikge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPGRpdiBjbGFzcz1cXFwibGItaXRlbSBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJvcmlnaW5hbFwiKSksXCJoZWlnaHRcIikgPiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcIm1lZGlhXCIpKSxcInJlbmRpdGlvbnNcIikpLFwib3JpZ2luYWxcIikpLFwid2lkdGhcIikpIHtcbm91dHB1dCArPSBcInBvcnRyYWl0XCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiPlxcbiAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJsYi1pdGVtXFxcIj5cXG4gICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcImVtYmVkXCIpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfNyx0XzUpIHtcbmlmKHRfNykgeyBjYih0XzcpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF81KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfOCx0XzYpIHtcbmlmKHRfOCkgeyBjYih0XzgpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF82KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbn0pO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcImltYWdlXCIpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMTEsdF85KSB7XG5pZih0XzExKSB7IGNiKHRfMTEpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF85KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMTIsdF8xMCkge1xuaWYodF8xMikgeyBjYih0XzEyKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTApO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xufSk7XG59XG5lbHNlIHtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgodF80KSxcIml0ZW1cIikpLFwiaXRlbV90eXBlXCIpID09IFwicXVvdGVcIikge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWl0ZW0tcXVvdGUuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8xNSx0XzEzKSB7XG5pZih0XzE1KSB7IGNiKHRfMTUpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xMyk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzE2LHRfMTQpIHtcbmlmKHRfMTYpIHsgY2IodF8xNik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzE0KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbn0pO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgPGFydGljbGU+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKGVudi5nZXRGaWx0ZXIoXCJzYWZlXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJ0ZXh0XCIpKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2FydGljbGU+XFxuICAgICAgICBcIjtcbjtcbn1cbjtcbn1cbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgIDwvZGl2PlxcbiAgICBcIjtcbjtcbn1cbn1cbmZyYW1lID0gZnJhbWUucG9wKCk7XG5vdXRwdXQgKz0gXCJcXG4gIDwvZGl2PlxcbiAgPCEtLSBpdGVtIGVuZCAtLT5cXG5cXG48L2FydGljbGU+XFxuXCI7XG5pZihwYXJlbnRUZW1wbGF0ZSkge1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSBlbHNlIHtcbmNiKG51bGwsIG91dHB1dCk7XG59XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbnJvb3Q6IHJvb3Rcbn07XG5cbn0pKCk7XG5yZXR1cm4gZnVuY3Rpb24oY3R4LCBjYikgeyByZXR1cm4gbnVuanVja3MucmVuZGVyKFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIGN0eCwgY2IpOyB9XG59KSgpO1xuO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtc2xpZGVzaG93Lmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPGRpdiBpZD1cXFwic2xpZGVzaG93XFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcImNvbnRhaW5lclxcXCI+XFxuICAgIFwiO1xuZnJhbWUgPSBmcmFtZS5wdXNoKCk7XG52YXIgdF8zID0gcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZzXCIpO1xuaWYodF8zKSB7dmFyIHRfMiA9IHRfMy5sZW5ndGg7XG5mb3IodmFyIHRfMT0wOyB0XzEgPCB0XzMubGVuZ3RoOyB0XzErKykge1xudmFyIHRfNCA9IHRfM1t0XzFdO1xuZnJhbWUuc2V0KFwicmVmXCIsIHRfNCk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4XCIsIHRfMSArIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleDBcIiwgdF8xKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF8yIC0gdF8xKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXgwXCIsIHRfMiAtIHRfMSAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5maXJzdFwiLCB0XzEgPT09IDApO1xuZnJhbWUuc2V0KFwibG9vcC5sYXN0XCIsIHRfMSA9PT0gdF8yIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmxlbmd0aFwiLCB0XzIpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXNsaWRlc2hvdy5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfNyx0XzUpIHtcbmlmKHRfNykgeyBjYih0XzcpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF81KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfOCx0XzYpIHtcbmlmKHRfOCkgeyBjYih0XzgpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF82KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xufSk7XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICA8L2Rpdj5cXG4gIDxidXR0b24gY2xhc3M9XFxcImZ1bGxzY3JlZW5cXFwiPkZ1bGxzY3JlZW48L2J1dHRvbj5cXG4gIDxidXR0b24gY2xhc3M9XFxcImFycm93cyBwcmV2XFxcIj4mbHQ7PC9idXR0b24+XFxuICA8YnV0dG9uIGNsYXNzPVxcXCJhcnJvd3MgbmV4dFxcXCI+Jmd0OzwvYnV0dG9uPlxcbjwvZGl2PlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLXNsaWRlc2hvdy5odG1sXCIsIGN0eCwgY2IpOyB9XG59KSgpO1xuO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG4ocGFyZW50VGVtcGxhdGUgPyBmdW5jdGlvbihlLCBjLCBmLCByLCBjYikgeyBjYihcIlwiKTsgfSA6IGNvbnRleHQuZ2V0QmxvY2soXCJ0aW1lbGluZVwiKSkoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgZnVuY3Rpb24odF8yLHRfMSkge1xuaWYodF8yKSB7IGNiKHRfMik7IHJldHVybjsgfVxub3V0cHV0ICs9IHRfMTtcbm91dHB1dCArPSBcIlxcblxcblwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWVtYmVkLXByb3ZpZGVycy5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF81LHRfMykge1xuaWYodF81KSB7IGNiKHRfNSk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzMpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF82LHRfNCkge1xuaWYodF82KSB7IGNiKHRfNik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzQpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG5cXG5cIjtcbmlmKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaW5jbHVkZV9qc19vcHRpb25zXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gIDxzY3JpcHQgdHlwZT1cXFwidGV4dC9qYXZhc2NyaXB0XFxcIj5cXG4gICAgd2luZG93LkxCID0gXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKGVudi5nZXRGaWx0ZXIoXCJzYWZlXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJqc29uX29wdGlvbnNcIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjtcXG4gIDwvc2NyaXB0PlxcblwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXCI7XG5pZihwYXJlbnRUZW1wbGF0ZSkge1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSBlbHNlIHtcbmNiKG51bGwsIG91dHB1dCk7XG59XG59KX0pO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbmZ1bmN0aW9uIGJfdGltZWxpbmUoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBmcmFtZSA9IGZyYW1lLnB1c2godHJ1ZSk7XG5vdXRwdXQgKz0gXCJcXG48ZGl2IGNsYXNzPVxcXCJsYi10aW1lbGluZSBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwibGFuZ3VhZ2VcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd1RpdGxlXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwidGl0bGVcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8aDE+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwidGl0bGVcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9oMT5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dEZXNjcmlwdGlvblwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcImRlc2NyaXB0aW9uXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGRpdiBjbGFzcz1cXFwiZGVzY3JpcHRpb25cXFwiPlxcbiAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImJsb2dcIikpLFwiZGVzY3JpcHRpb25cIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICA8L2Rpdj5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dJbWFnZVwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcInBpY3R1cmVfdXJsXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcInBpY3R1cmVfdXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgLz5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwidG9wXCIgJiYgZW52LmdldEZpbHRlcihcImxlbmd0aFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwic3RpY2t5UG9zdHNcIikpLFwiX2l0ZW1zXCIpKSA+IDApIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJ0aW1lbGluZS1ib2R5IHRpbWVsaW5lLWJvZHktLWxvYWRlZFxcXCI+XFxuICAgICAgPHNlY3Rpb24gY2xhc3M9XFxcImxiLXBvc3RzIGxpc3QtZ3JvdXAgc3RpY2t5XFxcIj5cXG4gICAgICAgIFwiO1xuZnJhbWUgPSBmcmFtZS5wdXNoKCk7XG52YXIgdF85ID0gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJzdGlja3lQb3N0c1wiKSksXCJfaXRlbXNcIik7XG5pZih0XzkpIHt2YXIgdF84ID0gdF85Lmxlbmd0aDtcbmZvcih2YXIgdF83PTA7IHRfNyA8IHRfOS5sZW5ndGg7IHRfNysrKSB7XG52YXIgdF8xMCA9IHRfOVt0XzddO1xuZnJhbWUuc2V0KFwiaXRlbVwiLCB0XzEwKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF83ICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzcpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzggLSB0XzcpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF84IC0gdF83IC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfNyA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF83ID09PSB0XzggLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfOCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHRfMTApLFwiZGVsZXRlZFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8xMyx0XzExKSB7XG5pZih0XzEzKSB7IGNiKHRfMTMpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xMSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzE0LHRfMTIpIHtcbmlmKHRfMTQpIHsgY2IodF8xNCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzEyKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIDwvc2VjdGlvbj5cXG4gICAgPC9kaXY+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgPCEtLSBIZWFkZXIgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJoZWFkZXItYmFyXFxcIj5cXG4gICAgPGRpdiBjbGFzcz1cXFwic29ydGluZy1iYXJcXFwiPlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcInNvcnRpbmctYmFyX19vcmRlcnNcXFwiPlxcbiAgICAgICAgPGRpdlxcbiAgICAgICAgICBjbGFzcz1cXFwic29ydGluZy1iYXJfX29yZGVyIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwicG9zdE9yZGVyXCIpID09IFwiZWRpdG9yaWFsXCIpIHtcbm91dHB1dCArPSBcInNvcnRpbmctYmFyX19vcmRlci0tYWN0aXZlXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiXFxuICAgICAgICAgIGRhdGEtanMtb3JkZXJieV9lZGl0b3JpYWw+XFxuICAgICAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwib3B0aW9uc1wiKSksXCJsMTBuXCIpKSxcImVkaXRvcmlhbFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICAgPGRpdlxcbiAgICAgICAgICBjbGFzcz1cXFwic29ydGluZy1iYXJfX29yZGVyIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwicG9zdE9yZGVyXCIpID09IFwibmV3ZXN0X2ZpcnN0XCIpIHtcbm91dHB1dCArPSBcInNvcnRpbmctYmFyX19vcmRlci0tYWN0aXZlXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXFwiXFxuICAgICAgICAgIGRhdGEtanMtb3JkZXJieV9kZXNjZW5kaW5nPlxcbiAgICAgICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm9wdGlvbnNcIikpLFwibDEwblwiKSksXCJkZXNjZW5kaW5nXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICA8ZGl2XFxuICAgICAgICAgIGNsYXNzPVxcXCJzb3J0aW5nLWJhcl9fb3JkZXIgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJwb3N0T3JkZXJcIikgPT0gXCJvbGRlc3RfZmlyc3RcIikge1xub3V0cHV0ICs9IFwic29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmVcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCJcXG4gICAgICAgICAgZGF0YS1qcy1vcmRlcmJ5X2FzY2VuZGluZz5cXG4gICAgICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJvcHRpb25zXCIpKSxcImwxMG5cIikpLFwiYXNjZW5kaW5nXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgPC9kaXY+XFxuICAgIDwvZGl2PlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJoZWFkZXItYmFyX19hY3Rpb25zXFxcIj48L2Rpdj5cXG4gICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcImNhbkNvbW1lbnRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cXFwiaGVhZGVyLWJhcl9fY29tbWVudFxcXCIgZGF0YS1qcy1zaG93LWNvbW1lbnQtZGlhbG9nPkNvbW1lbnQ8L2J1dHRvbj5cXG4gICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0xpdmVibG9nTG9nb1wiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8YSBjbGFzcz1cXFwiaGVhZGVyLWJhcl9fbG9nb1xcXCIgaHJlZj1cXFwiaHR0cHM6Ly93d3cubGl2ZWJsb2cucHJvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+XFxuICAgICAgICAgIDxzcGFuPlBvd2VyZWQgYnk8L3NwYW4+XFxuICAgICAgICAgIDxpbWcgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhc3NldHNfcm9vdFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJpbWFnZXMvbGItbG9nby5zdmdcXFwiIC8+XFxuICAgICAgICA8L2E+XFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgPC9kaXY+XFxuICA8IS0tIEhlYWRlciBFbmQgLS0+XFxuXFxuICA8IS0tIENvbW1lbnQgLS0+XFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcImNhbkNvbW1lbnRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1jb21tZW50Lmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzE3LHRfMTUpIHtcbmlmKHRfMTcpIHsgY2IodF8xNyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzE1KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMTgsdF8xNikge1xuaWYodF8xOCkgeyBjYih0XzE4KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTYpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwhLS0gQ29tbWVudCBFbmQgLS0+XFxuXFxuICA8IS0tIFRpbWVsaW5lIC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwidGltZWxpbmUtYm9keSB0aW1lbGluZS1ib2R5LS1sb2FkZWRcXFwiPlxcbiAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInN0aWNreVBvc2l0aW9uXCIpID09IFwiYm90dG9tXCIgJiYgZW52LmdldEZpbHRlcihcImxlbmd0aFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwic3RpY2t5UG9zdHNcIikpLFwiX2l0ZW1zXCIpKSA+IDApIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJsYi1wb3N0cyBsaXN0LWdyb3VwIHN0aWNreVxcXCI+XFxuICAgICAgICBcIjtcbmZyYW1lID0gZnJhbWUucHVzaCgpO1xudmFyIHRfMjEgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInN0aWNreVBvc3RzXCIpKSxcIl9pdGVtc1wiKTtcbmlmKHRfMjEpIHt2YXIgdF8yMCA9IHRfMjEubGVuZ3RoO1xuZm9yKHZhciB0XzE5PTA7IHRfMTkgPCB0XzIxLmxlbmd0aDsgdF8xOSsrKSB7XG52YXIgdF8yMiA9IHRfMjFbdF8xOV07XG5mcmFtZS5zZXQoXCJpdGVtXCIsIHRfMjIpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleFwiLCB0XzE5ICsgMSk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4MFwiLCB0XzE5KTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF8yMCAtIHRfMTkpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleDBcIiwgdF8yMCAtIHRfMTkgLSAxKTtcbmZyYW1lLnNldChcImxvb3AuZmlyc3RcIiwgdF8xOSA9PT0gMCk7XG5mcmFtZS5zZXQoXCJsb29wLmxhc3RcIiwgdF8xOSA9PT0gdF8yMCAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5sZW5ndGhcIiwgdF8yMCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG5pZighcnVudGltZS5tZW1iZXJMb29rdXAoKHRfMjIpLFwiZGVsZXRlZFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF8yNSx0XzIzKSB7XG5pZih0XzI1KSB7IGNiKHRfMjUpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8yMyk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzI2LHRfMjQpIHtcbmlmKHRfMjYpIHsgY2IodF8yNik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzI0KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xufSk7XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgICAgIDwvc2VjdGlvbj5cXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG5pZihlbnYuZ2V0RmlsdGVyKFwibGVuZ3RoXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJwb3N0c1wiKSksXCJfaXRlbXNcIikpID09IDApIHtcbm91dHB1dCArPSBcIlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcImxiLXBvc3QgZW1wdHktbWVzc2FnZVxcXCI+XFxuICAgICAgICA8ZGl2PkJsb2cgcG9zdHMgYXJlIG5vdCBjdXJyZW50bHkgYXZhaWxhYmxlLjwvZGl2PlxcbiAgICAgIDwvZGl2PlxcbiAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8c2VjdGlvbiBjbGFzcz1cXFwibGItcG9zdHMgbGlzdC1ncm91cCBub3JtYWxcXFwiPlxcbiAgICAgICAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzI5ID0gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJwb3N0c1wiKSksXCJfaXRlbXNcIik7XG5pZih0XzI5KSB7dmFyIHRfMjggPSB0XzI5Lmxlbmd0aDtcbmZvcih2YXIgdF8yNz0wOyB0XzI3IDwgdF8yOS5sZW5ndGg7IHRfMjcrKykge1xudmFyIHRfMzAgPSB0XzI5W3RfMjddO1xuZnJhbWUuc2V0KFwiaXRlbVwiLCB0XzMwKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXhcIiwgdF8yNyArIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleDBcIiwgdF8yNyk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4XCIsIHRfMjggLSB0XzI3KTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXgwXCIsIHRfMjggLSB0XzI3IC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmZpcnN0XCIsIHRfMjcgPT09IDApO1xuZnJhbWUuc2V0KFwibG9vcC5sYXN0XCIsIHRfMjcgPT09IHRfMjggLSAxKTtcbmZyYW1lLnNldChcImxvb3AubGVuZ3RoXCIsIHRfMjgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICAgIFwiO1xuaWYoIXJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzMwKSxcImRlbGV0ZWRcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMzMsdF8zMSkge1xuaWYodF8zMykgeyBjYih0XzMzKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMzEpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8zNCx0XzMyKSB7XG5pZih0XzM0KSB7IGNiKHRfMzQpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8zMik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbn0pO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbjtcbn1cbn1cbmZyYW1lID0gZnJhbWUucG9wKCk7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8L3NlY3Rpb24+XFxuICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJwb3N0c1wiKSksXCJfbWV0YVwiKSksXCJtYXhfcmVzdWx0c1wiKSA8PSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFwaV9yZXNwb25zZVwiKSksXCJwb3N0c1wiKSksXCJfbWV0YVwiKSksXCJ0b3RhbFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8YnV0dG9uIGNsYXNzPVxcXCJsYi1idXR0b24gbG9hZC1tb3JlLXBvc3RzXFxcIiBkYXRhLWpzLWxvYWRtb3JlPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwib3B0aW9uc1wiKSksXCJsMTBuXCIpKSxcImxvYWROZXdQb3N0c1wiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2J1dHRvbj5cXG4gICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgPC9kaXY+XFxuICA8IS0tIFRpbWVsaW5lIEVuZCAtLT5cXG5cXG48L2Rpdj5cXG5cIjtcbmNiKG51bGwsIG91dHB1dCk7XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbmJfdGltZWxpbmU6IGJfdGltZWxpbmUsXG5yb290OiByb290XG59O1xuXG59KSgpO1xucmV0dXJuIGZ1bmN0aW9uKGN0eCwgY2IpIHsgcmV0dXJuIG51bmp1Y2tzLnJlbmRlcihcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iXX0=
