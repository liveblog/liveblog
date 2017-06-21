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
    this.keyboardListener = this.keyboardListener.bind(this);
    this.setFocus = this.setFocus.bind(this);
    this.launchIntoFullscreen = this.launchIntoFullscreen.bind(this);
    this.exitFullscreen = this.exitFullscreen.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
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
            meta: { media: { renditions: {
                  baseImage: { href: baseImage },
                  thumbnail: { href: thumbnail },
                  viewImage: { href: viewImage }
                } } },
            active: thumbnail === e.target.getAttribute('src')
          }
        });
      });

      var slideshow = templates.slideshow({
        refs: items
      });

      document.querySelector('div.lb-timeline').insertAdjacentHTML('afterend', slideshow);

      window.addEventListener('keydown', this.keyboardListener);
      window.parent.postMessage('fullscreen', window.document.referrer);

      this.setFocus();

      document.querySelector('#slideshow button.fullscreen').addEventListener('click', this.toggleFullscreen);
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
      var _this = this;

      var container = document.querySelector('#slideshow .container');

      container.querySelectorAll('img').forEach(function (img, i) {
        if (img.classList.contains('active')) {
          _this.iterations = i;
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
output += "<div class=\"lb-type lb-type--embed lb-type--";
output += runtime.suppressValue(env.getFilter("lower").call(context, runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"provider_name")), env.opts.autoescape);
output += "\"></div>\n<div class=\"item--embed\">\n  <div>";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ref")),"item")),"meta")),"html")), env.opts.autoescape);
output += "</div>\n</div>\n";
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

},{"nunjucks/browser/nunjucks-slim":"/home/skam/Work/liveblog-default-theme/node_modules/nunjucks/browser/nunjucks-slim.js"}],"/home/skam/Work/liveblog-default-theme/templates/template-post.html":[function(require,module,exports){
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
output += "\n  </div>\n  <!-- end author -->\n\n  <!-- item start -->\n  ";
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
output += "\n  <!-- item end -->\n\n</article>\n";
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
output += "\n  </div>\n  <button class=\"fullscreen\">Fullscreen</button>\n</div>\n";
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
output += "\n\n  <div class=\"timeline-body timeline-body--loaded\">\n    ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"stickyPosts")),"_items")) > 0) {
output += "\n      <section class=\"lb-posts list-group sticky\">\n        ";
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
output += "\n      </section>\n    ";
;
}
output += "\n  </div>\n\n  <!-- Header -->\n  <div class=\"header-bar\">\n    <div class=\"sorting-bar\">\n      <div class=\"sorting-bar__orders\">\n        <div\n          class=\"sorting-bar__order ";
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
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"posts")),"_items")) == 0) {
output += "\n      <div class=\"lb-post empty-message\">\n        <div>Blog posts are not currently available.</div>\n      </div>\n      ";
;
}
else {
output += "\n      <section class=\"lb-posts list-group normal\">\n        ";
frame = frame.push();
var t_21 = runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "api_response")),"posts")),"_items");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9saXZlYmxvZy5qcyIsImpzL3RoZW1lL2hhbmRsZXJzLmpzIiwianMvdGhlbWUvaGVscGVycy5qcyIsImpzL3RoZW1lL2luZGV4LmpzIiwianMvdGhlbWUvbG9jYWwtYW5hbHl0aWNzLmpzIiwianMvdGhlbWUvc2xpZGVzaG93LmpzIiwianMvdGhlbWUvdGVtcGxhdGVzLmpzIiwianMvdGhlbWUvdmlldy5qcyIsImpzL3RoZW1lL3ZpZXdtb2RlbC5qcyIsIm5vZGVfbW9kdWxlcy9udW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW0uanMiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtaXRlbS1lbWJlZC5odG1sIiwidGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbCIsInRlbXBsYXRlcy90ZW1wbGF0ZS1wb3N0Lmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtc2xpZGVzaG93Lmh0bWwiLCJ0ZW1wbGF0ZXMvdGVtcGxhdGUtdGltZWxpbmUuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7O0FBSUE7O0FBRUE7O0FBQ0EsSUFBSSxRQUFRLFFBQVEsU0FBUixDQUFaOztBQUVBLFNBQVMsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFlBQU07QUFDbEQsUUFBTSxJQUFOO0FBQ0QsQ0FGRDs7QUFJQSxPQUFPLE9BQVAsR0FBaUIsRUFBakI7OztBQ2JBOzs7O0FBSUE7O0FBRUEsSUFBSSxPQUFPLFFBQVEsUUFBUixDQUFYO0FBQUEsSUFDSSxZQUFZLFFBQVEsYUFBUixDQURoQjtBQUFBLElBRUksVUFBVSxRQUFRLFdBQVIsQ0FGZDs7QUFJQTs7Ozs7QUFLQSxJQUFNLGNBQWMsU0FBZCxXQUFjLENBQUMsQ0FBRCxFQUFPO0FBQ3pCLElBQUUsY0FBRjs7QUFFQSxNQUFJLE9BQU8sU0FBUyxhQUFULENBQXVCLGVBQXZCLEVBQXdDLEtBQW5EO0FBQ0EsTUFBSSxVQUFVLFNBQVMsYUFBVCxDQUF1QixrQkFBdkIsRUFBMkMsS0FBekQ7O0FBRUEsT0FBSyxzQkFBTDs7QUFFQSxTQUFPLFVBQVUsV0FBVixDQUFzQixJQUF0QixFQUE0QixPQUE1QixFQUNKLElBREksQ0FDQyxLQUFLLG1CQUROLEVBRUosSUFGSSxDQUVDO0FBQUEsV0FBTSxTQUNQLGFBRE8sQ0FDTyxjQURQLEVBRVAsbUJBRk8sQ0FFYSxRQUZiLEVBRXVCLFdBRnZCLENBQU47QUFBQSxHQUZELEVBTUosSUFOSSxDQU1DLEtBQUsscUJBTk4sRUFPSixLQVBJLENBT0UsS0FBSyx3QkFQUCxDQUFQO0FBUUQsQ0FoQkQ7O0FBa0JBLElBQUksVUFBVTtBQUNaLFlBQVU7QUFDUiwwQkFBc0IsMEJBQU07QUFDMUIsZ0JBQVUsYUFBVixHQUNHLElBREgsQ0FDUSxLQUFLLFdBRGIsRUFFRyxJQUZILENBRVEsS0FBSyxlQUZiLEVBR0csS0FISCxDQUdTLFVBSFQ7QUFJRCxLQU5POztBQVFSLG1DQUErQixtQ0FBTTtBQUNuQyxnQkFBVSxTQUFWLENBQW9CLEVBQUMsTUFBTSxXQUFQLEVBQXBCLEVBQ0csSUFESCxDQUNRLEtBQUssY0FEYixFQUVHLElBRkgsQ0FFUSxLQUFLLGVBRmIsRUFHRyxJQUhILENBR1EsS0FBSyxhQUFMLENBQW1CLFdBQW5CLENBSFIsRUFJRyxLQUpILENBSVMsVUFKVDtBQUtELEtBZE87O0FBZ0JSLG9DQUFnQyxvQ0FBTTtBQUNwQyxnQkFBVSxTQUFWLENBQW9CLEVBQUMsTUFBTSxZQUFQLEVBQXBCLEVBQ0csSUFESCxDQUNRLEtBQUssY0FEYixFQUVHLElBRkgsQ0FFUSxLQUFLLGVBRmIsRUFHRyxJQUhILENBR1EsS0FBSyxhQUFMLENBQW1CLFlBQW5CLENBSFIsRUFJRyxLQUpILENBSVMsVUFKVDtBQUtELEtBdEJPOztBQXdCUixtQ0FBK0IsbUNBQU07QUFDbkMsZ0JBQVUsU0FBVixDQUFvQixFQUFDLE1BQU0sV0FBUCxFQUFwQixFQUNHLElBREgsQ0FDUSxLQUFLLGNBRGIsRUFFRyxJQUZILENBRVEsS0FBSyxlQUZiLEVBR0csSUFISCxDQUdRLEtBQUssYUFBTCxDQUFtQixXQUFuQixDQUhSLEVBSUcsS0FKSCxDQUlTLFVBSlQ7QUFLRCxLQTlCTzs7QUFnQ1IscUNBQWlDLG1DQUFNO0FBQ3JDLFVBQUksWUFBWSxLQUFLLG1CQUFMLEVBQWhCO0FBQ0EsVUFBSSxjQUFjLFNBQVMsYUFBVCxDQUF1QixjQUF2QixDQUFsQjs7QUFFQSxVQUFJLFNBQUosRUFBZTtBQUNiLG9CQUFZLGdCQUFaLENBQTZCLFFBQTdCLEVBQXVDLFdBQXZDO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsb0JBQVksbUJBQVosQ0FBZ0MsUUFBaEMsRUFBMEMsV0FBMUM7QUFDRDtBQUNGLEtBekNPOztBQTJDUixzQ0FBa0Msa0NBQUMsQ0FBRCxFQUFPO0FBQ3ZDLFFBQUUsY0FBRjtBQUNBLFdBQUssbUJBQUw7QUFDRDtBQTlDTyxHQURFOztBQWtEWixVQUFRLGtCQUFXO0FBQ2pCLFdBQU8sSUFBUCxDQUFZLFFBQVEsUUFBcEIsRUFBOEIsT0FBOUIsQ0FBc0MsVUFBQyxPQUFELEVBQWE7QUFDakQsVUFBSSxLQUFLLFFBQVEsUUFBUixDQUFpQixPQUFqQixFQUEwQixDQUExQixDQUFUOztBQUVBLFVBQUksQ0FBQyxFQUFMLEVBQVM7QUFDUCxlQUFPLEtBQVA7QUFDRDs7QUFFRCxTQUFHLGdCQUFILENBQW9CLE9BQXBCLEVBQTZCLFFBQVEsUUFBUixDQUFpQixPQUFqQixDQUE3QixFQUF3RCxLQUF4RDtBQUNELEtBUkQ7O0FBVUEsU0FBSyxlQUFMO0FBQ0Q7QUE5RFcsQ0FBZDs7QUFpRUEsU0FBUyxVQUFULENBQW9CLEdBQXBCLEVBQXlCO0FBQ3ZCLFVBQVEsS0FBUixDQUFjLGlCQUFkLEVBQWlDLEdBQWpDO0FBQ0Q7O0FBRUQsSUFBSSxTQUFTO0FBQ1gsVUFBUSxrQkFBVyxDQUFFLENBRFYsQ0FDVztBQURYLENBQWI7O0FBSUEsT0FBTyxPQUFQLEdBQWlCO0FBQ2YsV0FBUyxPQURNO0FBRWYsVUFBUTtBQUZPLENBQWpCOzs7QUMxR0E7Ozs7QUFJQTtBQUNBOzs7OztBQUlBLFNBQVMsZ0JBQVQsQ0FBMEIsU0FBMUIsRUFBcUM7QUFDbkMsTUFBSSxPQUFPLEdBQUcsSUFBSCxDQUFRLE9BQW5CO0FBQUEsTUFDSSxNQUFNLElBQUksSUFBSixFQURWLENBQ3FCO0FBRHJCO0FBQUEsTUFFSSxPQUFPLE1BQU0sSUFBSSxJQUFKLENBQVMsU0FBVCxDQUZqQjtBQUFBLE1BR0ksUUFBUTtBQUNSLE9BQUcsT0FBTyxJQUFQLEdBQWMsRUFEVDtBQUVSLE9BQUcsT0FBTyxJQUZGO0FBR1IsT0FBRyxPQUFPO0FBSEYsR0FIWjs7QUFTQSxXQUFTLGdCQUFULENBQTBCLFNBQTFCLEVBQXFDLElBQXJDLEVBQTJDO0FBQ3pDLFdBQU8sRUFBRSxhQUFhLE1BQU0sSUFBTixJQUFjLENBQTdCLElBQ0gsS0FBSyxJQUFMLEVBQVcsQ0FBWCxDQUFhLE9BQWIsQ0FBcUIsSUFBckIsRUFBMkIsS0FBSyxLQUFMLENBQVcsWUFBWSxNQUFNLElBQU4sQ0FBdkIsQ0FBM0IsQ0FERyxHQUVILEtBQUssSUFBTCxFQUFXLENBRmY7QUFHRDs7QUFFRCxXQUFTLE9BQVQsQ0FBaUIsU0FBakIsRUFBNEI7QUFDMUIsUUFBSSxZQUFZLE1BQU0sQ0FBdEIsRUFBeUI7QUFDdkIsYUFBTyxpQkFBaUIsU0FBakIsRUFBNEIsR0FBNUIsQ0FBUDtBQUNEOztBQUVELFFBQUksWUFBWSxNQUFNLENBQXRCLEVBQXlCO0FBQ3ZCLGFBQU8saUJBQWlCLFNBQWpCLEVBQTRCLEdBQTVCLENBQVA7QUFDRDs7QUFFRCxXQUFPLGlCQUFpQixTQUFqQixFQUE0QixHQUE1QixDQUFQLENBVDBCLENBU2U7QUFDMUM7O0FBRUQsU0FBTyxRQUFRLElBQVIsQ0FBUDtBQUNEOztBQUVEOzs7O0FBSUEsU0FBUyxRQUFULENBQWtCLEtBQWxCLEVBQXlCO0FBQ3ZCLE1BQUksYUFBYSxNQUFNLE9BQU4sQ0FBYyxPQUFkLElBQXlCLENBQUMsQ0FBM0M7QUFDQSxTQUFPLGFBQ0gsU0FBUyxnQkFBVCxDQUEwQixLQUExQixDQURHLEdBRUgsU0FBUyxzQkFBVCxDQUFnQyxLQUFoQyxDQUZKO0FBR0Q7O0FBRUQ7Ozs7QUFJQSxTQUFTLE9BQVQsQ0FBaUIsR0FBakIsRUFBc0I7QUFDcEIsU0FBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFFBQUksTUFBTSxJQUFJLGNBQUosRUFBVjs7QUFFQSxRQUFJLElBQUosQ0FBUyxLQUFULEVBQWdCLEdBQWhCO0FBQ0EsUUFBSSxNQUFKLEdBQWEsWUFBVztBQUN0QixVQUFJLElBQUksTUFBSixLQUFlLEdBQW5CLEVBQXdCO0FBQ3RCLGdCQUFRLEtBQUssS0FBTCxDQUFXLElBQUksWUFBZixDQUFSO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxJQUFJLFlBQVg7QUFDRDtBQUNGLEtBTkQ7O0FBUUEsUUFBSSxJQUFKO0FBQ0QsR0FiTSxDQUFQO0FBY0Q7O0FBRUQsU0FBUyxJQUFULENBQWMsR0FBZCxFQUFtQixJQUFuQixFQUF5QjtBQUN2QixTQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsUUFBSSxNQUFNLElBQUksY0FBSixFQUFWOztBQUVBLFFBQUksSUFBSixDQUFTLE1BQVQsRUFBaUIsR0FBakI7QUFDQSxRQUFJLGdCQUFKLENBQXFCLGNBQXJCLEVBQXFDLGtCQUFyQztBQUNBLFFBQUksTUFBSixHQUFhLFlBQVc7QUFDdEIsVUFBSSxJQUFJLE1BQUosS0FBZSxHQUFuQixFQUF3QjtBQUN0QixnQkFBUSxLQUFLLEtBQUwsQ0FBVyxJQUFJLFlBQWYsQ0FBUjtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU8sSUFBSSxZQUFYO0FBQ0Q7QUFDRixLQU5EOztBQVFBLFFBQUksSUFBSixDQUFTLEtBQUssU0FBTCxDQUFlLElBQWYsQ0FBVDtBQUNELEdBZE0sQ0FBUDtBQWdCRDs7QUFFRCxPQUFPLE9BQVAsR0FBaUI7QUFDZixZQUFVLFFBREs7QUFFZixXQUFTLE9BRk07QUFHZixRQUFNLElBSFM7QUFJZixvQkFBa0I7QUFKSCxDQUFqQjs7O0FDM0ZBOzs7O0FBSUE7O0FBRUEsSUFBTSxXQUFXLFFBQVEsWUFBUixDQUFqQjtBQUFBLElBQ0UsWUFBWSxRQUFRLGFBQVIsQ0FEZDtBQUFBLElBRUUsT0FBTyxRQUFRLFFBQVIsQ0FGVDtBQUFBLElBR0UsaUJBQWlCLFFBQVEsbUJBQVIsQ0FIbkI7O0FBS0EsT0FBTyxPQUFQLEdBQWlCO0FBQ2Y7OztBQUdBLFFBQU0sZ0JBQVc7QUFDZixhQUFTLE9BQVQsQ0FBaUIsTUFBakIsR0FEZSxDQUNZO0FBQzNCLGFBQVMsTUFBVCxDQUFnQixNQUFoQixHQUZlLENBRVc7QUFDMUIsY0FBVSxJQUFWO0FBQ0EsbUJBQWUsR0FBZjs7QUFFQSxnQkFBWSxZQUFNO0FBQ2hCLFdBQUssZ0JBQUwsR0FEZ0IsQ0FDUztBQUMxQixLQUZELEVBRUcsSUFGSDtBQUdEO0FBYmMsQ0FBakI7Ozs7O0FDWEEsSUFBSSxVQUFVLE9BQU8sY0FBUCxDQUFzQixJQUF0QixJQUE4QixPQUFPLEVBQVAsQ0FBVSxRQUFWLENBQW1CLE9BQW5CLENBQTJCLEtBQTNCLEVBQWtDLEVBQWxDLENBQTlCLEdBQXNFLEVBQXBGO0FBQ0EsSUFBSSxhQUFhLFNBQVMsUUFBMUI7QUFDQSxJQUFJLFNBQVMsT0FBTyxjQUFQLENBQXNCLElBQXRCLElBQThCLE9BQU8sRUFBUCxDQUFVLElBQVYsQ0FBZSxHQUE3QyxHQUFtRCxFQUFoRTs7QUFFQSxXQUFXLG9CQUFYOztBQUVBLElBQUksZUFBZSxTQUFmLFlBQWUsQ0FBUyxJQUFULEVBQWUsS0FBZixFQUFzQixJQUF0QixFQUE0QjtBQUM3QyxNQUFJLFVBQVUsRUFBZDtBQUFBLE1BQWtCLE9BQU8sSUFBSSxJQUFKLEVBQXpCOztBQUVBLE1BQUksSUFBSixFQUFVO0FBQ1IsU0FBSyxPQUFMLENBQWEsS0FBSyxPQUFMLEtBQWlCLE9BQU8sRUFBUCxHQUFZLEVBQVosR0FBaUIsRUFBakIsR0FBc0IsSUFBcEQ7QUFDQSw2QkFBdUIsS0FBSyxXQUFMLEVBQXZCO0FBQ0Q7QUFDRCxXQUFTLE1BQVQsR0FBcUIsSUFBckIsU0FBNkIsS0FBN0IsR0FBcUMsT0FBckM7QUFDRCxDQVJEOztBQVVBLElBQUksYUFBYSxTQUFiLFVBQWEsQ0FBUyxJQUFULEVBQWU7QUFDOUIsTUFBSSxTQUFTLE9BQU8sR0FBcEI7QUFDQSxNQUFJLEtBQUssU0FBUyxNQUFULENBQWdCLEtBQWhCLENBQXNCLEdBQXRCLENBQVQ7O0FBRUEsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEdBQUcsTUFBdkIsRUFBK0IsR0FBL0IsRUFBb0M7QUFDbEMsUUFBSSxJQUFJLEdBQUcsQ0FBSCxDQUFSOztBQUVBLFdBQU8sRUFBRSxNQUFGLENBQVMsQ0FBVCxNQUFnQixHQUF2QixFQUE0QjtBQUMxQixVQUFJLEVBQUUsU0FBRixDQUFZLENBQVosRUFBZSxFQUFFLE1BQWpCLENBQUo7QUFDRDs7QUFFRCxRQUFJLEVBQUUsT0FBRixDQUFVLE1BQVYsTUFBc0IsQ0FBMUIsRUFBNkI7QUFDM0IsYUFBTyxFQUFFLFNBQUYsQ0FBWSxPQUFPLE1BQW5CLEVBQTJCLEVBQUUsTUFBN0IsQ0FBUDtBQUNEO0FBQ0Y7QUFDRCxTQUFPLElBQVA7QUFDRCxDQWhCRDs7QUFrQkEsSUFBSSxPQUFNLFNBQU4sSUFBTSxHQUFXO0FBQ25CLE1BQUksVUFBVSxJQUFJLGNBQUosRUFBZDtBQUNBLE1BQUksV0FBVyxLQUFLLFNBQUwsQ0FBZTtBQUM1QixpQkFBYSxVQURlO0FBRTVCLGFBQVM7QUFGbUIsR0FBZixDQUFmOztBQUtBLFVBQVEsSUFBUixDQUFhLE1BQWIsRUFBcUIsT0FBckI7QUFDQSxVQUFRLGdCQUFSLENBQXlCLGNBQXpCLEVBQXlDLGtCQUF6Qzs7QUFFQSxVQUFRLE1BQVIsR0FBaUIsWUFBVztBQUMxQixRQUFJLFFBQVEsTUFBUixLQUFtQixHQUF2QixFQUE0QjtBQUMxQixtQkFBYSxLQUFiLEVBQW9CLFFBQXBCLEVBQThCLENBQTlCO0FBQ0Q7QUFDRixHQUpEOztBQU1BLFVBQVEsSUFBUixDQUFhLFFBQWI7QUFDRCxDQWpCRDs7QUFtQkEsT0FBTyxPQUFQLEdBQWlCLEVBQUMsS0FBSyxlQUFNO0FBQzNCLFFBQUksQ0FBQyxXQUFXLEtBQVgsQ0FBTCxFQUF3QjtBQUN0QjtBQUNEO0FBQ0YsR0FKZ0IsRUFBakI7Ozs7Ozs7OztBQ3JEQSxJQUFNLFlBQVksUUFBUSxhQUFSLENBQWxCOztJQUVNLFM7QUFDSix1QkFBYztBQUFBOztBQUNaLFNBQUssS0FBTCxHQUFhLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsSUFBaEIsQ0FBYjtBQUNBLFNBQUssZ0JBQUwsR0FBd0IsS0FBSyxnQkFBTCxDQUFzQixJQUF0QixDQUEyQixJQUEzQixDQUF4QjtBQUNBLFNBQUssUUFBTCxHQUFnQixLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLElBQW5CLENBQWhCO0FBQ0EsU0FBSyxvQkFBTCxHQUE0QixLQUFLLG9CQUFMLENBQTBCLElBQTFCLENBQStCLElBQS9CLENBQTVCO0FBQ0EsU0FBSyxjQUFMLEdBQXNCLEtBQUssY0FBTCxDQUFvQixJQUFwQixDQUF5QixJQUF6QixDQUF0QjtBQUNBLFNBQUssZ0JBQUwsR0FBd0IsS0FBSyxnQkFBTCxDQUFzQixJQUF0QixDQUEyQixJQUEzQixDQUF4QjtBQUNEOzs7OzBCQUVLLEMsRUFBRztBQUNQLFVBQUksUUFBUSxFQUFaOztBQUVBLFdBQUssVUFBTCxHQUFrQixDQUFsQjtBQUNBLFdBQUssWUFBTCxHQUFvQixLQUFwQjs7QUFFQSxRQUFFLE1BQUYsQ0FDRyxPQURILENBQ1csbUJBRFgsRUFFRyxnQkFGSCxDQUVvQixjQUZwQixFQUdHLE9BSEgsQ0FHVyxVQUFDLEdBQUQsRUFBUztBQUNoQixZQUFJLFVBQVUsRUFBZDs7QUFFQSxZQUFJLFlBQUosQ0FBaUIsUUFBakIsRUFBMkIsT0FBM0IsQ0FBbUMsY0FBbkMsRUFBbUQsVUFBQyxDQUFELEVBQUksS0FBSixFQUFjO0FBQy9ELGtCQUFRLElBQVIsQ0FBYSxLQUFiO0FBQ0QsU0FGRDs7QUFIZ0IsWUFPWCxTQVBXLEdBT3dCLE9BUHhCO0FBQUEsWUFPQSxTQVBBLEdBT3dCLE9BUHhCO0FBQUEsWUFPVyxTQVBYLEdBT3dCLE9BUHhCOzs7QUFTaEIsY0FBTSxJQUFOLENBQVc7QUFDVCxnQkFBTTtBQUNKLGtCQUFNLEVBQUMsT0FBTyxFQUFDLFlBQVk7QUFDekIsNkJBQVcsRUFBQyxNQUFNLFNBQVAsRUFEYztBQUV6Qiw2QkFBVyxFQUFDLE1BQU0sU0FBUCxFQUZjO0FBR3pCLDZCQUFXLEVBQUMsTUFBTSxTQUFQO0FBSGMsaUJBQWIsRUFBUixFQURGO0FBTUosb0JBQVEsY0FBYyxFQUFFLE1BQUYsQ0FBUyxZQUFULENBQXNCLEtBQXRCO0FBTmxCO0FBREcsU0FBWDtBQVVELE9BdEJIOztBQXdCQSxVQUFJLFlBQVksVUFBVSxTQUFWLENBQW9CO0FBQ2xDLGNBQU07QUFENEIsT0FBcEIsQ0FBaEI7O0FBSUEsZUFBUyxhQUFULENBQXVCLGlCQUF2QixFQUNHLGtCQURILENBQ3NCLFVBRHRCLEVBQ2tDLFNBRGxDOztBQUdBLGFBQU8sZ0JBQVAsQ0FBd0IsU0FBeEIsRUFBbUMsS0FBSyxnQkFBeEM7QUFDQSxhQUFPLE1BQVAsQ0FBYyxXQUFkLENBQTBCLFlBQTFCLEVBQXdDLE9BQU8sUUFBUCxDQUFnQixRQUF4RDs7QUFFQSxXQUFLLFFBQUw7O0FBRUEsZUFDRyxhQURILENBQ2lCLDhCQURqQixFQUVHLGdCQUZILENBRW9CLE9BRnBCLEVBRTZCLEtBQUssZ0JBRmxDO0FBR0Q7Ozt1Q0FFa0I7QUFDakIsVUFBSSxDQUFDLEtBQUssWUFBVixFQUF3QjtBQUN0QixhQUFLLG9CQUFMLENBQTBCLFNBQVMsY0FBVCxDQUF3QixXQUF4QixDQUExQjtBQUNELE9BRkQsTUFFTztBQUNMLGFBQUssY0FBTDtBQUNEO0FBQ0Y7Ozt5Q0FFb0IsTyxFQUFTO0FBQzVCLFVBQUksUUFBUSxpQkFBWixFQUErQjtBQUM3QixnQkFBUSxpQkFBUjtBQUNELE9BRkQsTUFFTyxJQUFJLFFBQVEsb0JBQVosRUFBa0M7QUFDdkMsZ0JBQVEsb0JBQVI7QUFDRCxPQUZNLE1BRUEsSUFBSSxRQUFRLHVCQUFaLEVBQXFDO0FBQzFDLGdCQUFRLHVCQUFSO0FBQ0QsT0FGTSxNQUVBLElBQUksUUFBUSxtQkFBWixFQUFpQztBQUN0QyxnQkFBUSxtQkFBUjtBQUNEOztBQUVELFdBQUssWUFBTCxHQUFvQixJQUFwQjtBQUNEOzs7cUNBRWdCO0FBQ2YsVUFBSSxTQUFTLGNBQWIsRUFBNkI7QUFDM0IsaUJBQVMsY0FBVDtBQUNELE9BRkQsTUFFTyxJQUFJLFNBQVMsbUJBQWIsRUFBa0M7QUFDdkMsaUJBQVMsbUJBQVQ7QUFDRCxPQUZNLE1BRUEsSUFBSSxTQUFTLG9CQUFiLEVBQW1DO0FBQ3hDLGlCQUFTLG9CQUFUO0FBQ0Q7O0FBRUQsV0FBSyxZQUFMLEdBQW9CLEtBQXBCO0FBQ0Q7OzsrQkFFVTtBQUFBOztBQUNULFVBQU0sWUFBWSxTQUFTLGFBQVQsQ0FBdUIsdUJBQXZCLENBQWxCOztBQUVBLGdCQUFVLGdCQUFWLENBQTJCLEtBQTNCLEVBQWtDLE9BQWxDLENBQTBDLFVBQUMsR0FBRCxFQUFNLENBQU4sRUFBWTtBQUNwRCxZQUFJLElBQUksU0FBSixDQUFjLFFBQWQsQ0FBdUIsUUFBdkIsQ0FBSixFQUFzQztBQUNwQyxnQkFBSyxVQUFMLEdBQWtCLENBQWxCO0FBQ0Q7QUFDRixPQUpEOztBQU1BLFVBQUksS0FBSyxVQUFMLEdBQWtCLENBQXRCLEVBQXlCO0FBQ3ZCLGtCQUFVLEtBQVYsQ0FBZ0IsU0FBaEIsU0FBZ0MsVUFBVSxZQUFWLEdBQXlCLEtBQUssVUFBOUQ7QUFDRDtBQUNGOzs7cUNBRWdCLEMsRUFBRztBQUNsQixVQUFNLFlBQVksU0FBUyxhQUFULENBQXVCLHVCQUF2QixDQUFsQjtBQUNBLFVBQU0sZ0JBQWdCLFVBQVUsZ0JBQVYsQ0FBMkIsS0FBM0IsRUFBa0MsTUFBeEQ7QUFDQSxVQUFJLFNBQVMsVUFBVSxZQUFWLEdBQXlCLEtBQUssVUFBM0M7O0FBRUEsY0FBUSxFQUFFLE9BQVY7QUFDQSxhQUFLLEVBQUw7QUFBUztBQUNQLGNBQUksU0FBUyxVQUFVLFlBQW5CLEdBQWtDLGdCQUFnQixVQUFVLFlBQWhFLEVBQThFO0FBQzVFLHNCQUFVLEtBQVYsQ0FBZ0IsU0FBaEIsVUFBZ0MsU0FBUyxVQUFVLFlBQW5EO0FBQ0EsaUJBQUssVUFBTDtBQUNEOztBQUVEO0FBQ0YsYUFBSyxFQUFMO0FBQVM7QUFDUCxjQUFJLFNBQVMsVUFBVSxZQUFuQixJQUFtQyxDQUF2QyxFQUEwQztBQUN4QyxzQkFBVSxLQUFWLENBQWdCLFNBQWhCLFVBQWdDLFNBQVMsVUFBVSxZQUFuRDtBQUNBLGlCQUFLLFVBQUw7QUFDRDs7QUFFRDtBQUNGLGFBQUssRUFBTDtBQUFTO0FBQ1AsZUFBSyxjQUFMO0FBQ0EsbUJBQVMsYUFBVCxDQUF1QixZQUF2QixFQUFxQyxNQUFyQztBQWpCRjtBQW1CRDs7Ozs7O0FBR0gsT0FBTyxPQUFQLEdBQWlCLFNBQWpCOzs7QUN0SUE7Ozs7QUFJQTs7QUFFQSxJQUFNLFdBQVcsUUFBUSxnQ0FBUixDQUFqQjtBQUNBLElBQU0sV0FBVyxPQUFPLEVBQVAsQ0FBVSxRQUEzQjs7QUFFQSxJQUFNLG1CQUFtQjtBQUN2QixRQUFNLFFBQVEsb0NBQVIsQ0FEaUI7QUFFdkIsWUFBVSxRQUFRLHdDQUFSLENBRmE7QUFHdkIsYUFBVyxRQUFRLDBDQUFSLENBSFk7QUFJdkIsYUFBVyxRQUFRLDBDQUFSLENBSlk7QUFLdkIsYUFBVyxRQUFRLHlDQUFSO0FBTFksQ0FBekI7O0FBUUEsU0FBUyxrQkFBVCxHQUE4QjtBQUM1QixNQUFJLGtCQUFrQixTQUFTLGVBQS9CO0FBQUEsTUFDSSxrQkFBa0IsZ0JBRHRCOztBQUQ0Qiw2QkFJbkIsUUFKbUI7QUFLMUIsUUFBSSxxQkFBcUIsZ0JBQWdCLFFBQWhCLENBQXpCO0FBQ0EscUJBQWlCLFFBQWpCLElBQTZCLFVBQUMsR0FBRCxFQUFNLEVBQU4sRUFBYTtBQUN4QyxlQUFTLE1BQVQsQ0FBZ0Isa0JBQWhCLEVBQW9DLEdBQXBDLEVBQXlDLEVBQXpDO0FBQ0QsS0FGRDtBQU4wQjs7QUFJNUIsT0FBSyxJQUFJLFFBQVQsSUFBcUIsZUFBckIsRUFBc0M7QUFBQSxVQUE3QixRQUE2QjtBQUtyQzs7QUFFRCxTQUFPLGVBQVA7QUFDRDs7QUFFRCxPQUFPLE9BQVAsR0FBaUIsU0FBUyxlQUFULEdBQ2Isb0JBRGEsR0FFYixnQkFGSjs7O0FDL0JBOzs7O0FBSUE7O0FBRUEsSUFBSSxVQUFVLFFBQVEsV0FBUixDQUFkO0FBQ0EsSUFBSSxZQUFZLFFBQVEsYUFBUixDQUFoQjtBQUNBLElBQUksWUFBWSxRQUFRLGFBQVIsQ0FBaEI7O0FBRUEsSUFBSSxlQUFlLFNBQVMsZ0JBQVQsQ0FBMEIsa0JBQTFCLENBQW5CO0FBQUEsSUFDSSxzQkFBc0IsUUFBUSxRQUFSLENBQWlCLGlCQUFqQixDQUQxQjs7QUFHQTs7Ozs7QUFLQSxTQUFTLGNBQVQsQ0FBd0IsWUFBeEIsRUFBc0M7QUFDcEMsTUFBSSxnQkFBZ0IsRUFBcEI7O0FBRUEsZUFBYSxNQUFiLENBQW9CLE9BQXBCLENBQTRCLFVBQUMsSUFBRCxFQUFVO0FBQ3BDLGtCQUFjLElBQWQsQ0FBbUIsVUFBVSxJQUFWLENBQWU7QUFDaEMsWUFBTSxJQUQwQjtBQUVoQyxnQkFBVSxPQUFPLEVBQVAsQ0FBVTtBQUZZLEtBQWYsQ0FBbkI7QUFJRCxHQUxEOztBQU9BLGVBQWEsQ0FBYixFQUFnQixTQUFoQixHQUE0QixjQUFjLElBQWQsQ0FBbUIsRUFBbkIsQ0FBNUI7QUFDQTtBQUNBO0FBQ0Q7O0FBRUQ7Ozs7OztBQU1BLFNBQVMsV0FBVCxDQUFxQixZQUFyQixFQUFtQztBQUNqQyxNQUFJLGdCQUFnQixFQUFwQixDQUF1QjtBQUF2QjtBQUFBLE1BQ0ksUUFBUSxhQUFhLE1BRHpCOztBQUdBLE9BQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQ3JDLFFBQUksT0FBTyxNQUFNLENBQU4sQ0FBWDs7QUFFQSxRQUFJLE1BQU0sU0FBTixLQUFvQixRQUF4QixFQUFrQztBQUNoQyxpQkFBVyxLQUFLLEdBQWhCO0FBQ0EsYUFGZ0MsQ0FFeEI7QUFDVDs7QUFFRCxRQUFJLGVBQWUsVUFBVSxJQUFWLENBQWU7QUFDaEMsWUFBTSxJQUQwQjtBQUVoQyxnQkFBVSxPQUFPLEVBQVAsQ0FBVTtBQUZZLEtBQWYsQ0FBbkI7O0FBS0EsUUFBSSxNQUFNLFNBQU4sS0FBb0IsUUFBeEIsRUFBa0M7QUFDaEMsaUJBQVcsWUFBWDtBQUNBLGFBRmdDLENBRXhCO0FBQ1Q7O0FBRUQsa0JBQWMsSUFBZCxDQUFtQixZQUFuQixFQWxCcUMsQ0FrQkg7QUFDbkM7O0FBRUQsTUFBSSxDQUFDLGNBQWMsTUFBbkIsRUFBMkI7QUFDekIsV0FEeUIsQ0FDakI7QUFDVDs7QUFFRCxnQkFBYyxPQUFkOztBQUVBLFdBQVMsYUFBVCxFQUF3QixFQUFFO0FBQ3hCLGNBQVUsYUFBYSxXQUFiLENBQXlCLFFBQXpCLEdBQW9DLEtBQXBDLEdBQTRDO0FBRGhDLEdBQXhCOztBQUlBO0FBQ0Q7O0FBRUQ7Ozs7Ozs7O0FBUUEsU0FBUyxRQUFULENBQWtCLEtBQWxCLEVBQXlCLElBQXpCLEVBQStCO0FBQzdCLFNBQU8sUUFBUSxFQUFmO0FBQ0EsT0FBSyxRQUFMLEdBQWdCLEtBQUssUUFBTCxJQUFpQixRQUFqQzs7QUFFQSxNQUFJLFlBQVksRUFBaEI7QUFBQSxNQUNJLFdBQVcsS0FBSyxRQUFMLEtBQWtCLEtBQWxCLEdBQ1AsWUFETyxDQUNNO0FBRE4sSUFFUCxXQUhSLENBSjZCLENBT1I7O0FBRXJCLE9BQUssSUFBSSxJQUFJLE1BQU0sTUFBTixHQUFlLENBQTVCLEVBQStCLEtBQUssQ0FBcEMsRUFBdUMsR0FBdkMsRUFBNEM7QUFDMUMsaUJBQWEsTUFBTSxDQUFOLENBQWI7QUFDRDs7QUFFRCxlQUFhLENBQWIsRUFBZ0Isa0JBQWhCLENBQW1DLFFBQW5DLEVBQTZDLFNBQTdDO0FBQ0E7QUFDRDs7QUFFRDs7OztBQUlBLFNBQVMsVUFBVCxDQUFvQixNQUFwQixFQUE0QjtBQUMxQixNQUFJLE9BQU8sUUFBUSxRQUFSLENBQWlCLHVCQUF1QixNQUF2QixHQUFnQyxJQUFqRCxDQUFYO0FBQ0EsT0FBSyxDQUFMLEVBQVEsTUFBUjtBQUNEOztBQUVEOzs7O0FBSUEsU0FBUyxVQUFULENBQW9CLE1BQXBCLEVBQTRCLFlBQTVCLEVBQTBDO0FBQ3hDLE1BQUksT0FBTyxRQUFRLFFBQVIsQ0FBaUIsdUJBQXVCLE1BQXZCLEdBQWdDLElBQWpELENBQVg7QUFDQSxPQUFLLENBQUwsRUFBUSxTQUFSLEdBQW9CLFlBQXBCO0FBQ0Q7O0FBRUQ7OztBQUdBLFNBQVMsZUFBVCxHQUEyQjtBQUN6QixNQUFJLFdBQVcsUUFBUSxRQUFSLENBQWlCLGFBQWpCLENBQWY7QUFDQSxPQUFLLElBQUksSUFBSSxTQUFTLE1BQVQsR0FBa0IsQ0FBL0IsRUFBa0MsS0FBSyxDQUF2QyxFQUEwQyxHQUExQyxFQUErQztBQUM3QyxhQUFTLENBQVQsRUFBWSxTQUFaLENBQXNCLE1BQXRCLENBQTZCLGFBQTdCO0FBQ0Q7QUFDRjs7QUFFRDs7OztBQUlBLFNBQVMsVUFBVCxHQUFzQjtBQUNwQixNQUFJLE9BQU8sT0FBWCxFQUFvQjtBQUNsQixZQUFRLE1BQVIsQ0FBZSxPQUFmO0FBQ0Q7O0FBRUQsTUFBSSxPQUFPLEtBQVgsRUFBa0I7QUFDaEIsVUFBTSxPQUFOLENBQWMsSUFBZDtBQUNEO0FBQ0Y7O0FBRUQsU0FBUyxtQkFBVCxHQUErQjtBQUM3QixNQUFJLGNBQWMsU0FBUyxhQUFULENBQXVCLGNBQXZCLENBQWxCO0FBQ0EsTUFBSSxXQUFXLEtBQWY7O0FBRUEsTUFBSSxXQUFKLEVBQWlCO0FBQ2YsZUFBVyxZQUFZLFNBQVosQ0FBc0IsTUFBdEIsQ0FBNkIsTUFBN0IsQ0FBWDtBQUNEOztBQUVELFNBQU8sQ0FBQyxRQUFSO0FBQ0Q7O0FBRUQ7Ozs7QUFJQSxTQUFTLGFBQVQsQ0FBdUIsSUFBdkIsRUFBNkI7QUFDM0IsTUFBSSxjQUFjLFNBQVMsZ0JBQVQsQ0FBMEIscUJBQTFCLENBQWxCOztBQUVBLGNBQVksT0FBWixDQUFvQixVQUFDLEVBQUQsRUFBUTtBQUMxQixRQUFJLGlCQUFpQixHQUFHLE9BQUgsQ0FBVyxjQUFYLENBQTBCLGVBQWUsSUFBekMsQ0FBckI7O0FBRUEsT0FBRyxTQUFILENBQWEsTUFBYixDQUFvQiw0QkFBcEIsRUFBa0QsY0FBbEQ7QUFDRCxHQUpEO0FBS0Q7O0FBRUQ7Ozs7QUFJQSxTQUFTLFlBQVQsQ0FBc0IsVUFBdEIsRUFBa0M7QUFDaEMsTUFBSSxvQkFBb0IsTUFBcEIsR0FBNkIsQ0FBakMsRUFBb0M7QUFDbEMsd0JBQW9CLENBQXBCLEVBQXVCLFNBQXZCLENBQWlDLE1BQWpDLENBQ0UsV0FERixFQUNlLFVBRGY7QUFFRDtBQUNGOztBQUVEOzs7O0FBSUEsU0FBUyxnQkFBVCxHQUE0QjtBQUMxQixNQUFJLFlBQVksUUFBUSxRQUFSLENBQWlCLGNBQWpCLENBQWhCO0FBQ0EsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFVBQVUsTUFBOUIsRUFBc0MsR0FBdEMsRUFBMkM7QUFDekMsUUFBSSxPQUFPLFVBQVUsQ0FBVixDQUFYO0FBQUEsUUFDSSxZQUFZLEtBQUssT0FBTCxDQUFhLFdBRDdCO0FBRUEsU0FBSyxXQUFMLEdBQW1CLFFBQVEsZ0JBQVIsQ0FBeUIsU0FBekIsQ0FBbkI7QUFDRDtBQUNELFNBQU8sSUFBUDtBQUNEOztBQUVELFNBQVMscUJBQVQsR0FBaUM7QUFDL0IsTUFBSSxjQUFjLFNBQVMsYUFBVCxDQUF1QixrQkFBdkIsQ0FBbEI7O0FBRUEsY0FBWSxTQUFaLENBQXNCLE1BQXRCLENBQTZCLE1BQTdCOztBQUVBLGFBQVcsWUFBTTtBQUNmLGdCQUFZLFNBQVosQ0FBc0IsTUFBdEIsQ0FBNkIsTUFBN0I7QUFDRCxHQUZELEVBRUcsSUFGSDtBQUdEOztBQUVELFNBQVMsc0JBQVQsR0FBa0M7QUFDaEMsTUFBSSxhQUFhLFNBQVMsZ0JBQVQsQ0FBMEIsV0FBMUIsQ0FBakI7O0FBRUEsTUFBSSxVQUFKLEVBQWdCO0FBQ2QsZUFBVyxPQUFYLENBQW1CLFVBQUMsU0FBRDtBQUFBLGFBQWUsVUFBVSxNQUFWLEVBQWY7QUFBQSxLQUFuQjtBQUNEO0FBQ0Y7O0FBRUQsU0FBUyx3QkFBVCxDQUFrQyxNQUFsQyxFQUEwQztBQUN4QyxNQUFJLE1BQU0sT0FBTixDQUFjLE1BQWQsQ0FBSixFQUEyQjtBQUN6QixXQUFPLE9BQVAsQ0FBZSxVQUFDLEtBQUQsRUFBVztBQUN4QixVQUFJLFVBQVUsU0FBUyxhQUFULENBQXVCLE1BQU0sRUFBN0IsQ0FBZDs7QUFFQSxVQUFJLE9BQUosRUFBYTtBQUNYLGdCQUFRLGtCQUFSLENBQ0UsVUFERiwwQkFFd0IsTUFBTSxHQUY5QjtBQUlEO0FBQ0YsS0FURDtBQVVEO0FBQ0Y7O0FBRUQsU0FBUyxlQUFULEdBQTJCO0FBQ3pCLE1BQU0sWUFBWSxJQUFJLFNBQUosRUFBbEI7QUFDQSxNQUFNLGtCQUFrQixTQUFTLGdCQUFULENBQTBCLHVCQUExQixDQUF4Qjs7QUFFQSxNQUFJLGVBQUosRUFBcUI7QUFDbkIsb0JBQWdCLE9BQWhCLENBQXdCLFVBQUMsS0FBRCxFQUFXO0FBQ2pDLFlBQU0sZ0JBQU4sQ0FBdUIsT0FBdkIsRUFBZ0MsVUFBVSxLQUExQztBQUNELEtBRkQ7QUFHRDtBQUNGOztBQUVELE9BQU8sT0FBUCxHQUFpQjtBQUNmLFlBQVUsUUFESztBQUVmLGNBQVksVUFGRztBQUdmLG1CQUFpQixlQUhGO0FBSWYsa0JBQWdCLGNBSkQ7QUFLZixlQUFhLFdBTEU7QUFNZixjQUFZLFVBTkc7QUFPZixvQkFBa0IsZ0JBUEg7QUFRZixnQkFBYyxZQVJDO0FBU2YsaUJBQWUsYUFUQTtBQVVmLHVCQUFxQixtQkFWTjtBQVdmLHlCQUF1QixxQkFYUjtBQVlmLDRCQUEwQix3QkFaWDtBQWFmLDBCQUF3QixzQkFiVDtBQWNmLG1CQUFpQjtBQWRGLENBQWpCOzs7QUM5T0E7Ozs7QUFJQTs7QUFFQSxJQUFJLFVBQVUsUUFBUSxXQUFSLENBQWQ7QUFBQSxJQUNJLE9BQU8sUUFBUSxRQUFSLENBRFg7O0FBR0EsSUFBTSxzQkFBeUIsR0FBRyxRQUE1QixxQkFBTjtBQUNBLElBQU0sc0JBQXlCLEdBQUcsUUFBNUIsd0JBQU47O0FBRUEsSUFBSSxXQUFXLEdBQUcsUUFBSCxHQUFjLG9CQUFkLEdBQXFDLEdBQUcsSUFBSCxDQUFRLEdBQTdDLEdBQW1ELFFBQWxFO0FBQUEsSUFDSSxXQUFXLEdBQUcsUUFEbEI7QUFBQSxJQUVJLEtBQUssRUFGVDs7QUFJQTs7OztBQUlBLFNBQVMsVUFBVCxDQUFvQixLQUFwQixFQUEyQjtBQUN6QixTQUFPO0FBQ0wsWUFBUSxJQUFJLEtBQUosQ0FBVSxLQUFWLEtBQW9CLENBRHZCO0FBRUwsaUJBQWEsQ0FGUjtBQUdMLGdCQUFZO0FBSFAsR0FBUDtBQUtEOztBQUVELEdBQUcsV0FBSCxHQUFpQixVQUFDLElBQUQsRUFBTyxPQUFQLEVBQW1CO0FBQ2xDLE1BQUksU0FBUyxFQUFiOztBQUVBLE1BQUksQ0FBQyxJQUFMLEVBQVc7QUFDVCxXQUFPLElBQVAsQ0FBWSxFQUFDLElBQUksZUFBTCxFQUFzQixLQUFLLGNBQTNCLEVBQVo7QUFDRDs7QUFFRCxNQUFJLENBQUMsT0FBTCxFQUFjO0FBQ1osV0FBTyxJQUFQLENBQVksRUFBQyxJQUFJLGtCQUFMLEVBQXlCLEtBQUssaUJBQTlCLEVBQVo7QUFDRDs7QUFFRCxNQUFJLE9BQU8sTUFBUCxHQUFnQixDQUFwQixFQUF1QjtBQUNyQixXQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVY7QUFBQSxhQUFxQixPQUFPLE1BQVAsQ0FBckI7QUFBQSxLQUFaLENBQVA7QUFDRDs7QUFFRCxTQUFPLFFBQ0osSUFESSxDQUNDLG1CQURELEVBQ3NCO0FBQ3pCLGVBQVcsU0FEYztBQUV6QixpQkFBYSxHQUFHLElBQUgsQ0FBUSxHQUZJO0FBR3pCLGVBQVcsSUFIYztBQUl6QixVQUFNO0FBSm1CLEdBRHRCLEVBT0osSUFQSSxDQU9DLFVBQUMsSUFBRDtBQUFBLFdBQVUsUUFBUSxJQUFSLENBQWEsbUJBQWIsRUFBa0M7QUFDaEQsbUJBQWEsU0FEbUM7QUFFaEQsbUJBQWEsR0FBRyxJQUFILENBQVEsR0FGMkI7QUFHaEQsY0FBUSxDQUFDO0FBQ1AsWUFBSSxNQURHO0FBRVAsY0FBTSxDQUFDLEVBQUMsT0FBTyxNQUFSLEVBQUQsQ0FGQztBQUdQLGNBQU07QUFIQyxPQUFELEVBSU47QUFDQSxZQUFJLE1BREo7QUFFQSxjQUFNLENBQUMsRUFBQyxVQUFVLEtBQUssR0FBaEIsRUFBRCxDQUZOO0FBR0EsY0FBTSxjQUhOLEVBSk07QUFId0MsS0FBbEMsQ0FBVjtBQUFBLEdBUEQsQ0FBUDtBQW9CRTtBQUNBO0FBQ0E7QUFDSCxDQXRDRDs7QUF3Q0E7Ozs7Ozs7QUFPQSxHQUFHLFFBQUgsR0FBYyxVQUFTLElBQVQsRUFBZTtBQUMzQixNQUFJLE9BQU8sSUFBWDs7QUFFQSxNQUFJLFVBQVUsS0FBSyxRQUFMLENBQWM7QUFDMUIsVUFBTSxLQUFLLElBQUwsSUFBYSxLQUFLLFFBQUwsQ0FBYyxTQURQO0FBRTFCLG9CQUFnQixTQUFTLEtBQUssY0FGSjtBQUcxQixjQUFVLEtBQUssUUFBTCxHQUNOLEtBQUssUUFEQyxHQUVOO0FBTHNCLEdBQWQsQ0FBZDs7QUFRQSxNQUFJLE9BQU8sS0FBSyxRQUFMLEdBQWdCLENBQWhCLEdBQW9CLEtBQUssSUFBcEM7QUFDQSxNQUFJLEtBQUssa0JBQWtCLFNBQVMsWUFBM0IsR0FBMEMsUUFBMUMsR0FBcUQsSUFBckQsR0FBNEQsVUFBckU7QUFBQSxNQUNJLFdBQVcsV0FBVyxFQUFYLEdBQWdCLE9BRC9COztBQUdBLFNBQU8sUUFBUSxPQUFSLENBQWdCLFFBQWhCLEVBQ0osSUFESSxDQUNDLFVBQUMsS0FBRCxFQUFXO0FBQ2YsU0FBSyxlQUFMLENBQXFCLEtBQXJCLEVBQTRCLElBQTVCO0FBQ0EsVUFBTSxXQUFOLEdBQW9CLElBQXBCO0FBQ0EsV0FBTyxLQUFQO0FBQ0QsR0FMSSxFQU1KLEtBTkksQ0FNRSxVQUFDLEdBQUQsRUFBUztBQUNkLFlBQVEsS0FBUixDQUFjLEdBQWQ7QUFDRCxHQVJJLENBQVA7QUFTRCxDQXhCRDs7QUEwQkE7Ozs7O0FBS0EsR0FBRyxhQUFILEdBQW1CLFVBQVMsSUFBVCxFQUFlO0FBQ2hDLFNBQU8sUUFBUSxFQUFmO0FBQ0EsT0FBSyxJQUFMLEdBQVksRUFBRSxLQUFLLEVBQUwsQ0FBUSxXQUF0QjtBQUNBLE9BQUssSUFBTCxHQUFZLEtBQUssUUFBTCxDQUFjLFNBQTFCO0FBQ0EsU0FBTyxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQVA7QUFDRCxDQUxEOztBQU9BOzs7OztBQUtBLEdBQUcsU0FBSCxHQUFlLFVBQVMsSUFBVCxFQUFlO0FBQzVCLFNBQU8sUUFBUSxFQUFmO0FBQ0EsT0FBSyxRQUFMLEdBQWdCLEtBQUssRUFBTCxDQUFRLFlBQXhCO0FBQ0EsU0FBTyxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQVA7QUFDRCxDQUpEOztBQU1BOzs7O0FBSUEsR0FBRyxlQUFILEdBQXFCLFVBQVMsWUFBVCxFQUF1QixJQUF2QixFQUE2QjtBQUNoRCxNQUFJLE9BQU8sSUFBWDs7QUFFQSxNQUFJLENBQUMsS0FBSyxRQUFOLElBQWtCLEtBQUssSUFBTCxLQUFjLEtBQUssUUFBTCxDQUFjLFNBQWxELEVBQTZEO0FBQUU7QUFDN0QsU0FBSyxZQUFMLENBQWtCLEtBQUssYUFBTCxDQUFtQixZQUFuQixDQUFsQixFQUQyRCxDQUNOO0FBQ3RELEdBRkQsTUFFTztBQUFFO0FBQ1AsUUFBSSxDQUFDLGFBQWEsTUFBYixDQUFvQixNQUF6QixFQUFpQztBQUMvQjtBQUNEOztBQUVELFNBQUssRUFBTCxDQUFRLFlBQVIsR0FBdUIsS0FBSyxlQUFMLENBQXFCLFlBQXJCLENBQXZCO0FBQ0Q7O0FBRUQsTUFBSSxLQUFLLElBQUwsS0FBYyxLQUFLLFFBQUwsQ0FBYyxTQUFoQyxFQUEyQztBQUN6QyxTQUFLLEVBQUwsR0FBVSxZQUFWO0FBQ0EsU0FBSyxZQUFMLENBQWtCLEtBQWxCO0FBQ0EsV0FBTyxNQUFQLENBQWMsS0FBSyxFQUFuQixFQUF1QixZQUF2QjtBQUNELEdBSkQsTUFJTztBQUNMLFNBQUssRUFBTCxDQUFRLE1BQVIsQ0FBZSxJQUFmLENBQW9CLEtBQXBCLENBQTBCLEtBQUssRUFBTCxDQUFRLE1BQWxDLEVBQTBDLGFBQWEsTUFBdkQ7QUFDRDs7QUFFRCxPQUFLLFFBQUwsQ0FBYyxTQUFkLEdBQTBCLEtBQUssSUFBL0I7QUFDQSxTQUFPLFlBQVA7QUFDRCxDQXZCRDs7QUF5QkE7Ozs7O0FBS0EsR0FBRyxlQUFILEdBQXFCLFVBQVMsWUFBVCxFQUF1QjtBQUMxQyxNQUFJLGFBQWEsYUFBYSxNQUFiLENBQW9CLEdBQXBCLENBQXdCLFVBQUMsSUFBRDtBQUFBLFdBQVUsSUFBSSxJQUFKLENBQVMsS0FBSyxRQUFkLENBQVY7QUFBQSxHQUF4QixDQUFqQjs7QUFFQSxNQUFJLFNBQVMsSUFBSSxJQUFKLENBQVMsS0FBSyxHQUFMLENBQVMsS0FBVCxDQUFlLElBQWYsRUFBcUIsVUFBckIsQ0FBVCxDQUFiO0FBQ0EsU0FBTyxPQUFPLFdBQVAsRUFBUCxDQUowQyxDQUliO0FBQzlCLENBTEQ7O0FBT0E7Ozs7O0FBS0EsR0FBRyxhQUFILEdBQW1CLFVBQVMsWUFBVCxFQUF1QjtBQUN4QyxNQUFJLGNBQWMsS0FBSyxFQUFMLENBQVEsTUFBUixDQUFlLE1BQWYsR0FBd0IsU0FBUyxZQUFuRDtBQUNBLFNBQU8sYUFBYSxLQUFiLENBQW1CLEtBQW5CLElBQTRCLFdBQW5DO0FBQ0QsQ0FIRDs7QUFLQTs7O0FBR0EsR0FBRyxJQUFILEdBQVUsWUFBVztBQUNuQixPQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxPQUFLLEVBQUwsR0FBVSxXQUFXLFNBQVMsWUFBcEIsQ0FBVjtBQUNBLE9BQUssRUFBTCxDQUFRLFlBQVIsR0FBdUIsSUFBSSxJQUFKLEdBQVcsV0FBWCxFQUF2QjtBQUNBLE9BQUssRUFBTCxDQUFRLGVBQVIsR0FBMEIsSUFBSSxJQUFKLEdBQVcsV0FBWCxFQUExQjtBQUNBLFNBQU8sS0FBSyxFQUFMLENBQVEsWUFBZjtBQUNELENBTkQ7O0FBUUE7Ozs7Ozs7OztBQVNBLEdBQUcsUUFBSCxHQUFjLFVBQVMsSUFBVCxFQUFlO0FBQzNCLE1BQUksUUFBUTtBQUNWLGFBQVM7QUFDUCxrQkFBWTtBQUNWLGtCQUFVO0FBQ1IsaUJBQU8sQ0FDTCxFQUFDLFFBQVEsRUFBQyxVQUFVLEtBQVgsRUFBVCxFQURLLEVBRUwsRUFBQyxRQUFRLEVBQUMsZUFBZSxNQUFoQixFQUFULEVBRkssRUFHTCxFQUFDLE9BQU8sRUFBQyxRQUFRLEVBQUMsV0FBVyxJQUFaLEVBQVQsRUFBUixFQUhLLEVBSUwsRUFBQyxTQUFTLEVBQUMsWUFBWSxFQUFDLE1BQU0sS0FBSyxFQUFMLENBQVEsZUFBZixFQUFiLEVBQVYsRUFKSztBQURDO0FBREE7QUFETCxLQURDO0FBYVYsWUFBUSxDQUNOO0FBQ0Usa0JBQVksRUFBQyxTQUFTLE1BQVY7QUFEZCxLQURNO0FBYkUsR0FBWjs7QUFvQkEsTUFBSSxLQUFLLFFBQVQsRUFBbUI7QUFDakIsVUFBTSxLQUFOLENBQVksUUFBWixDQUFxQixNQUFyQixDQUE0QixHQUE1QixDQUFnQyxDQUFoQyxFQUFtQyxLQUFuQyxDQUF5QyxRQUF6QyxHQUFvRDtBQUNsRCxZQUFNLEtBQUs7QUFEdUMsS0FBcEQ7QUFHRDs7QUFFRCxNQUFJLEtBQUssY0FBTCxLQUF3QixJQUE1QixFQUFrQztBQUNoQyxVQUFNLEtBQU4sQ0FBWSxRQUFaLENBQXFCLE1BQXJCLENBQTRCLEdBQTVCLENBQWdDLElBQWhDLENBQXFDO0FBQ25DLFlBQU0sRUFBQyxXQUFXLElBQVo7QUFENkIsS0FBckM7QUFHRDs7QUFFRCxNQUFJLEtBQUssSUFBTCxLQUFjLFdBQWxCLEVBQStCO0FBQzdCLFVBQU0sSUFBTixDQUFXLENBQVgsRUFBYyxRQUFkLENBQXVCLEtBQXZCLEdBQStCLEtBQS9CO0FBQ0QsR0FGRCxNQUVPLElBQUksS0FBSyxJQUFMLEtBQWMsV0FBbEIsRUFBK0I7QUFDcEMsVUFBTSxJQUFOLEdBQWEsQ0FDWDtBQUNFLGFBQU87QUFDTCxlQUFPLE1BREY7QUFFTCxpQkFBUyxPQUZKO0FBR0wsdUJBQWU7QUFIVjtBQURULEtBRFcsQ0FBYjtBQVNEOztBQUVEO0FBQ0EsTUFBSSxDQUFDLFdBQUQsRUFBYyxZQUFkLEVBQTRCLFdBQTVCLEVBQXlDLE9BQXpDLENBQWlELEtBQUssSUFBdEQsQ0FBSixFQUFpRTtBQUMvRCxVQUFNLEtBQU4sQ0FBWSxRQUFaLENBQXFCLE1BQXJCLENBQTRCLEdBQTVCLENBQWdDLE9BQWhDLENBQXdDLFVBQUMsSUFBRCxFQUFPLEtBQVAsRUFBaUI7QUFDdkQsVUFBSSxLQUFLLGNBQUwsQ0FBb0IsT0FBcEIsQ0FBSixFQUFrQztBQUNoQyxjQUFNLEtBQU4sQ0FBWSxRQUFaLENBQXFCLE1BQXJCLENBQTRCLEdBQTVCLENBQWdDLE1BQWhDLENBQXVDLEtBQXZDLEVBQThDLENBQTlDO0FBQ0Q7QUFDRixLQUpEO0FBS0Q7O0FBRUQsU0FBTyxVQUFVLEtBQUssU0FBTCxDQUFlLEtBQWYsQ0FBVixDQUFQO0FBQ0QsQ0F6REQ7O0FBMkRBLE9BQU8sT0FBUCxHQUFpQixFQUFqQjs7O0FDOVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcm9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gUHJlcmVuZGVyIGZ1bmN0aW9uc1xudmFyIHRoZW1lID0gcmVxdWlyZSgnLi90aGVtZScpO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICB0aGVtZS5pbml0KCk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSB7fTtcbiIsIi8qKlxuICogQGF1dGhvciBwcyAvIEBfX19wYXVsXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdmlldyA9IHJlcXVpcmUoJy4vdmlldycpXG4gICwgdmlld21vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWwnKVxuICAsIGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcblxuLyoqXG4gKiBDb250YWlucyBhIG1hcHBpbmcgb2YgZWxlbWVudCBkYXRhLXNlbGVjdG9ycyBhbmQgY2xpY2sgaGFuZGxlcnNcbiAqIGJ1dHRvbnMuYXR0YWNoIHtmdW5jdGlvbn0gLSByZWdpc3RlcnMgaGFuZGxlcnMgZm91bmQgaW4gaGFuZGxlcnMgb2JqZWN0XG4gKi9cblxuY29uc3Qgc2VuZENvbW1lbnQgPSAoZSkgPT4ge1xuICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgbGV0IG5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29tbWVudC1uYW1lJykudmFsdWU7XG4gIGxldCBjb21tZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvbW1lbnQtY29udGVudCcpLnZhbHVlO1xuXG4gIHZpZXcuY2xlYXJDb21tZW50Rm9ybUVycm9ycygpO1xuXG4gIHJldHVybiB2aWV3bW9kZWwuc2VuZENvbW1lbnQobmFtZSwgY29tbWVudClcbiAgICAudGhlbih2aWV3LnRvZ2dsZUNvbW1lbnREaWFsb2cpXG4gICAgLnRoZW4oKCkgPT4gZG9jdW1lbnRcbiAgICAgICAgLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0uY29tbWVudCcpXG4gICAgICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBzZW5kQ29tbWVudClcbiAgICApXG4gICAgLnRoZW4odmlldy5zaG93U3VjY2Vzc0NvbW1lbnRNc2cpXG4gICAgLmNhdGNoKHZpZXcuZGlzcGxheUNvbW1lbnRGb3JtRXJyb3JzKTtcbn07XG5cbnZhciBidXR0b25zID0ge1xuICBoYW5kbGVyczoge1xuICAgIFwiW2RhdGEtanMtbG9hZG1vcmVdXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHNQYWdlKClcbiAgICAgICAgLnRoZW4odmlldy5yZW5kZXJQb3N0cylcbiAgICAgICAgLnRoZW4odmlldy5kaXNwbGF5TmV3UG9zdHMpXG4gICAgICAgIC5jYXRjaChjYXRjaEVycm9yKTtcbiAgICB9LFxuXG4gICAgXCJbZGF0YS1qcy1vcmRlcmJ5X2FzY2VuZGluZ11cIjogKCkgPT4ge1xuICAgICAgdmlld21vZGVsLmxvYWRQb3N0cyh7c29ydDogJ2FzY2VuZGluZyd9KVxuICAgICAgICAudGhlbih2aWV3LnJlbmRlclRpbWVsaW5lKVxuICAgICAgICAudGhlbih2aWV3LmRpc3BsYXlOZXdQb3N0cylcbiAgICAgICAgLnRoZW4odmlldy50b2dnbGVTb3J0QnRuKCdhc2NlbmRpbmcnKSlcbiAgICAgICAgLmNhdGNoKGNhdGNoRXJyb3IpO1xuICAgIH0sXG5cbiAgICBcIltkYXRhLWpzLW9yZGVyYnlfZGVzY2VuZGluZ11cIjogKCkgPT4ge1xuICAgICAgdmlld21vZGVsLmxvYWRQb3N0cyh7c29ydDogJ2Rlc2NlbmRpbmcnfSlcbiAgICAgICAgLnRoZW4odmlldy5yZW5kZXJUaW1lbGluZSlcbiAgICAgICAgLnRoZW4odmlldy5kaXNwbGF5TmV3UG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcudG9nZ2xlU29ydEJ0bignZGVzY2VuZGluZycpKVxuICAgICAgICAuY2F0Y2goY2F0Y2hFcnJvcik7XG4gICAgfSxcblxuICAgIFwiW2RhdGEtanMtb3JkZXJieV9lZGl0b3JpYWxdXCI6ICgpID0+IHtcbiAgICAgIHZpZXdtb2RlbC5sb2FkUG9zdHMoe3NvcnQ6ICdlZGl0b3JpYWwnfSlcbiAgICAgICAgLnRoZW4odmlldy5yZW5kZXJUaW1lbGluZSlcbiAgICAgICAgLnRoZW4odmlldy5kaXNwbGF5TmV3UG9zdHMpXG4gICAgICAgIC50aGVuKHZpZXcudG9nZ2xlU29ydEJ0bignZWRpdG9yaWFsJykpXG4gICAgICAgIC5jYXRjaChjYXRjaEVycm9yKTtcbiAgICB9LFxuXG4gICAgXCJbZGF0YS1qcy1zaG93LWNvbW1lbnQtZGlhbG9nXVwiOiAoKSA9PiB7XG4gICAgICBsZXQgaXNWaXNpYmxlID0gdmlldy50b2dnbGVDb21tZW50RGlhbG9nKCk7XG4gICAgICBsZXQgY29tbWVudEZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdmb3JtLmNvbW1lbnQnKTtcblxuICAgICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgICBjb21tZW50Rm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBzZW5kQ29tbWVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21tZW50Rm9ybS5yZW1vdmVFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBzZW5kQ29tbWVudCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgICdbZGF0YS1qcy1jbG9zZS1jb21tZW50LWRpYWxvZ10nOiAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmlldy50b2dnbGVDb21tZW50RGlhbG9nKCk7XG4gICAgfVxuICB9LFxuXG4gIGF0dGFjaDogZnVuY3Rpb24oKSB7XG4gICAgT2JqZWN0LmtleXMoYnV0dG9ucy5oYW5kbGVycykuZm9yRWFjaCgoaGFuZGxlcikgPT4ge1xuICAgICAgbGV0IGVsID0gaGVscGVycy5nZXRFbGVtcyhoYW5kbGVyKVswXTtcblxuICAgICAgaWYgKCFlbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYnV0dG9ucy5oYW5kbGVyc1toYW5kbGVyXSwgZmFsc2UpO1xuICAgIH0pO1xuXG4gICAgdmlldy5hdHRhY2hTbGlkZXNob3coKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY2F0Y2hFcnJvcihlcnIpIHtcbiAgY29uc29sZS5lcnJvcihcIkhhbmRsZXIgZXJyb3I6IFwiLCBlcnIpO1xufVxuXG52YXIgZXZlbnRzID0ge1xuICBhdHRhY2g6IGZ1bmN0aW9uKCkge30gLy8gdG9kb1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJ1dHRvbnM6IGJ1dHRvbnMsXG4gIGV2ZW50czogZXZlbnRzXG59O1xuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG4vKipcbiAqIENvbnZlcnQgSVNPIHRpbWVzdGFtcHMgdG8gcmVsYXRpdmUgbW9tZW50IHRpbWVzdGFtcHNcbiAqIEBwYXJhbSB7Tm9kZX0gZWxlbSAtIGEgRE9NIGVsZW1lbnQgd2l0aCBJU08gdGltZXN0YW1wIGluIGRhdGEtanMtdGltZXN0YW1wIGF0dHJcbiAqL1xuZnVuY3Rpb24gY29udmVydFRpbWVzdGFtcCh0aW1lc3RhbXApIHtcbiAgdmFyIGwxMG4gPSBMQi5sMTBuLnRpbWVBZ29cbiAgICAsIG5vdyA9IG5ldyBEYXRlKCkgLy8gTm93XG4gICAgLCBkaWZmID0gbm93IC0gbmV3IERhdGUodGltZXN0YW1wKVxuICAgICwgdW5pdHMgPSB7XG4gICAgICBkOiAxMDAwICogMzYwMCAqIDI0LFxuICAgICAgaDogMTAwMCAqIDM2MDAsXG4gICAgICBtOiAxMDAwICogNjBcbiAgICB9O1xuXG4gIGZ1bmN0aW9uIGdldFRpbWVBZ29TdHJpbmcodGltZXN0YW1wLCB1bml0KSB7XG4gICAgcmV0dXJuICEodGltZXN0YW1wIDw9IHVuaXRzW3VuaXRdICogMilcbiAgICAgID8gbDEwblt1bml0XS5wLnJlcGxhY2UoXCJ7fVwiLCBNYXRoLmZsb29yKHRpbWVzdGFtcCAvIHVuaXRzW3VuaXRdKSlcbiAgICAgIDogbDEwblt1bml0XS5zO1xuICB9XG5cbiAgZnVuY3Rpb24gdGltZUFnbyh0aW1lc3RhbXApIHtcbiAgICBpZiAodGltZXN0YW1wIDwgdW5pdHMuaCkge1xuICAgICAgcmV0dXJuIGdldFRpbWVBZ29TdHJpbmcodGltZXN0YW1wLCBcIm1cIik7XG4gICAgfVxuXG4gICAgaWYgKHRpbWVzdGFtcCA8IHVuaXRzLmQpIHtcbiAgICAgIHJldHVybiBnZXRUaW1lQWdvU3RyaW5nKHRpbWVzdGFtcCwgXCJoXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBnZXRUaW1lQWdvU3RyaW5nKHRpbWVzdGFtcCwgXCJkXCIpOyAvLyBkZWZhdWx0XG4gIH1cblxuICByZXR1cm4gdGltZUFnbyhkaWZmKTtcbn1cblxuLyoqXG4gKiBXcmFwIGVsZW1lbnQgc2VsZWN0b3IgYXBpXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnkgLSBhIGpRdWVyeSBzeW50YXggRE9NIHF1ZXJ5ICh3aXRoIGRvdHMpXG4gKi9cbmZ1bmN0aW9uIGdldEVsZW1zKHF1ZXJ5KSB7XG4gIHZhciBpc0RhdGFBdHRyID0gcXVlcnkuaW5kZXhPZihcImRhdGEtXCIpID4gLTE7XG4gIHJldHVybiBpc0RhdGFBdHRyXG4gICAgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KVxuICAgIDogZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShxdWVyeSk7XG59XG5cbi8qKlxuICogalF1ZXJ5J3MgJC5nZXRKU09OIGluIGEgbnV0c2hlbGxcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSBhIHJlcXVlc3QgVVJMXG4gKi9cbmZ1bmN0aW9uIGdldEpTT04odXJsKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICByZXNvbHZlKEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVqZWN0KHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB4aHIuc2VuZCgpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdCh1cmwsIGRhdGEpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub3BlbignUE9TVCcsIHVybCk7XG4gICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDEpIHtcbiAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlamVjdCh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICB9KTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0RWxlbXM6IGdldEVsZW1zLFxuICBnZXRKU09OOiBnZXRKU09OLFxuICBwb3N0OiBwb3N0LFxuICBjb252ZXJ0VGltZXN0YW1wOiBjb252ZXJ0VGltZXN0YW1wXG59O1xuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IGhhbmRsZXJzID0gcmVxdWlyZSgnLi9oYW5kbGVycycpLFxuICB2aWV3bW9kZWwgPSByZXF1aXJlKCcuL3ZpZXdtb2RlbCcpLFxuICB2aWV3ID0gcmVxdWlyZSgnLi92aWV3JyksXG4gIGxvY2FsQW5hbHl0aWNzID0gcmVxdWlyZSgnLi9sb2NhbC1hbmFseXRpY3MnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8qKlxuICAgKiBPbiBkb2N1bWVudCBsb2FkZWQsIGRvIHRoZSBmb2xsb3dpbmc6XG4gICAqL1xuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICBoYW5kbGVycy5idXR0b25zLmF0dGFjaCgpOyAvLyBSZWdpc3RlciBCdXR0b25zIEhhbmRsZXJzXG4gICAgaGFuZGxlcnMuZXZlbnRzLmF0dGFjaCgpOyAvLyBSZWdpc3RlciBFdmVudCwgTWVzc2FnZSBIYW5kbGVyc1xuICAgIHZpZXdtb2RlbC5pbml0KCk7XG4gICAgbG9jYWxBbmFseXRpY3MuaGl0KCk7XG5cbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB2aWV3LnVwZGF0ZVRpbWVzdGFtcHMoKTsgLy8gQ29udmVydCBJU08gZGF0ZXMgdG8gdGltZWFnb1xuICAgIH0sIDEwMDApO1xuICB9XG59O1xuIiwidmFyIGFwaUhvc3QgPSB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ0xCJykgPyB3aW5kb3cuTEIuYXBpX2hvc3QucmVwbGFjZSgvXFwvJC8sICcnKSA6ICcnO1xudmFyIGNvbnRleHRVcmwgPSBkb2N1bWVudC5yZWZlcnJlcjtcbnZhciBibG9nSWQgPSB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ0xCJykgPyB3aW5kb3cuTEIuYmxvZy5faWQgOiAnJztcblxuYXBpSG9zdCArPSAnL2FwaS9hbmFseXRpY3MvaGl0JztcblxudmFyIGNyZWF0ZUNvb2tpZSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBkYXlzKSB7XG4gIHZhciBleHBpcmVzID0gJycsIGRhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gIGlmIChkYXlzKSB7XG4gICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApO1xuICAgIGV4cGlyZXMgPSBgOyBleHBpcmVzPSR7ZGF0ZS50b1VUQ1N0cmluZygpfWA7XG4gIH1cbiAgZG9jdW1lbnQuY29va2llID0gYCR7bmFtZX09JHt2YWx1ZX0ke2V4cGlyZXN9OyBwYXRoPS9gO1xufTtcblxudmFyIHJlYWRDb29raWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBuYW1lRVEgPSBuYW1lICsgJz0nO1xuICB2YXIgY2EgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGMgPSBjYVtpXTtcblxuICAgIHdoaWxlIChjLmNoYXJBdCgwKSA9PT0gJyAnKSB7XG4gICAgICBjID0gYy5zdWJzdHJpbmcoMSwgYy5sZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChjLmluZGV4T2YobmFtZUVRKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIGMuc3Vic3RyaW5nKG5hbWVFUS5sZW5ndGgsIGMubGVuZ3RoKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG52YXIgaGl0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciB4bWxodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gIHZhciBqc29uRGF0YSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICBjb250ZXh0X3VybDogY29udGV4dFVybCxcbiAgICBibG9nX2lkOiBibG9nSWRcbiAgfSk7XG5cbiAgeG1saHR0cC5vcGVuKCdQT1NUJywgYXBpSG9zdCk7XG4gIHhtbGh0dHAuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblxuICB4bWxodHRwLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh4bWxodHRwLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICBjcmVhdGVDb29raWUoJ2hpdCcsIGpzb25EYXRhLCAyKTtcbiAgICB9XG4gIH07XG5cbiAgeG1saHR0cC5zZW5kKGpzb25EYXRhKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge2hpdDogKCkgPT4ge1xuICBpZiAoIXJlYWRDb29raWUoJ2hpdCcpKSB7XG4gICAgaGl0KCk7XG4gIH1cbn19O1xuIiwiY29uc3QgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcblxuY2xhc3MgU2xpZGVzaG93IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5zdGFydCA9IHRoaXMuc3RhcnQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmtleWJvYXJkTGlzdGVuZXIgPSB0aGlzLmtleWJvYXJkTGlzdGVuZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNldEZvY3VzID0gdGhpcy5zZXRGb2N1cy5iaW5kKHRoaXMpO1xuICAgIHRoaXMubGF1bmNoSW50b0Z1bGxzY3JlZW4gPSB0aGlzLmxhdW5jaEludG9GdWxsc2NyZWVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5leGl0RnVsbHNjcmVlbiA9IHRoaXMuZXhpdEZ1bGxzY3JlZW4uYmluZCh0aGlzKTtcbiAgICB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4gPSB0aGlzLnRvZ2dsZUZ1bGxzY3JlZW4uYmluZCh0aGlzKTtcbiAgfVxuXG4gIHN0YXJ0KGUpIHtcbiAgICBsZXQgaXRlbXMgPSBbXTtcblxuICAgIHRoaXMuaXRlcmF0aW9ucyA9IDA7XG4gICAgdGhpcy5pc0Z1bGxzY3JlZW4gPSBmYWxzZTtcblxuICAgIGUudGFyZ2V0XG4gICAgICAuY2xvc2VzdCgnYXJ0aWNsZS5zbGlkZXNob3cnKVxuICAgICAgLnF1ZXJ5U2VsZWN0b3JBbGwoJy5sYi1pdGVtIGltZycpXG4gICAgICAuZm9yRWFjaCgoaW1nKSA9PiB7XG4gICAgICAgIGxldCBtYXRjaGVzID0gW107XG5cbiAgICAgICAgaW1nLmdldEF0dHJpYnV0ZSgnc3Jjc2V0JykucmVwbGFjZSgvKFxcUyspXFxzXFxkK3cvZywgKHMsIG1hdGNoKSA9PiB7XG4gICAgICAgICAgbWF0Y2hlcy5wdXNoKG1hdGNoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IFtiYXNlSW1hZ2UsIHRodW1ibmFpbCwgdmlld0ltYWdlXSA9IG1hdGNoZXM7XG5cbiAgICAgICAgaXRlbXMucHVzaCh7XG4gICAgICAgICAgaXRlbToge1xuICAgICAgICAgICAgbWV0YToge21lZGlhOiB7cmVuZGl0aW9uczoge1xuICAgICAgICAgICAgICBiYXNlSW1hZ2U6IHtocmVmOiBiYXNlSW1hZ2V9LFxuICAgICAgICAgICAgICB0aHVtYm5haWw6IHtocmVmOiB0aHVtYm5haWx9LFxuICAgICAgICAgICAgICB2aWV3SW1hZ2U6IHtocmVmOiB2aWV3SW1hZ2V9XG4gICAgICAgICAgICB9fX0sXG4gICAgICAgICAgICBhY3RpdmU6IHRodW1ibmFpbCA9PT0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdzcmMnKVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIGxldCBzbGlkZXNob3cgPSB0ZW1wbGF0ZXMuc2xpZGVzaG93KHtcbiAgICAgIHJlZnM6IGl0ZW1zXG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXYubGItdGltZWxpbmUnKVxuICAgICAgLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJlbmQnLCBzbGlkZXNob3cpO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWJvYXJkTGlzdGVuZXIpO1xuICAgIHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2UoJ2Z1bGxzY3JlZW4nLCB3aW5kb3cuZG9jdW1lbnQucmVmZXJyZXIpO1xuXG4gICAgdGhpcy5zZXRGb2N1cygpO1xuXG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93IGJ1dHRvbi5mdWxsc2NyZWVuJylcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlRnVsbHNjcmVlbik7XG4gIH1cblxuICB0b2dnbGVGdWxsc2NyZWVuKCkge1xuICAgIGlmICghdGhpcy5pc0Z1bGxzY3JlZW4pIHtcbiAgICAgIHRoaXMubGF1bmNoSW50b0Z1bGxzY3JlZW4oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NsaWRlc2hvdycpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5leGl0RnVsbHNjcmVlbigpO1xuICAgIH1cbiAgfVxuXG4gIGxhdW5jaEludG9GdWxsc2NyZWVuKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbikge1xuICAgICAgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbigpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgICAgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudC5tc1JlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzRnVsbHNjcmVlbiA9IHRydWU7XG4gIH1cblxuICBleGl0RnVsbHNjcmVlbigpIHtcbiAgICBpZiAoZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4pIHtcbiAgICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKSB7XG4gICAgICBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbikge1xuICAgICAgZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzRnVsbHNjcmVlbiA9IGZhbHNlO1xuICB9XG5cbiAgc2V0Rm9jdXMoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NsaWRlc2hvdyAuY29udGFpbmVyJyk7XG5cbiAgICBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnaW1nJykuZm9yRWFjaCgoaW1nLCBpKSA9PiB7XG4gICAgICBpZiAoaW1nLmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykpIHtcbiAgICAgICAgdGhpcy5pdGVyYXRpb25zID0gaTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICh0aGlzLml0ZXJhdGlvbnMgPiAwKSB7XG4gICAgICBjb250YWluZXIuc3R5bGUubWFyZ2luVG9wID0gYC0ke2NvbnRhaW5lci5vZmZzZXRIZWlnaHQgKiB0aGlzLml0ZXJhdGlvbnN9cHhgO1xuICAgIH1cbiAgfVxuXG4gIGtleWJvYXJkTGlzdGVuZXIoZSkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzbGlkZXNob3cgLmNvbnRhaW5lcicpO1xuICAgIGNvbnN0IHBpY3R1cmVzQ291bnQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnaW1nJykubGVuZ3RoO1xuICAgIGxldCBvZmZzZXQgPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0ICogdGhpcy5pdGVyYXRpb25zO1xuXG4gICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgaWYgKG9mZnNldCArIGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgPCBwaWN0dXJlc0NvdW50ICogY29udGFpbmVyLm9mZnNldEhlaWdodCkge1xuICAgICAgICBjb250YWluZXIuc3R5bGUubWFyZ2luVG9wID0gYC0ke29mZnNldCArIGNvbnRhaW5lci5vZmZzZXRIZWlnaHR9cHhgO1xuICAgICAgICB0aGlzLml0ZXJhdGlvbnMrKztcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgaWYgKG9mZnNldCAtIGNvbnRhaW5lci5vZmZzZXRIZWlnaHQgPj0gMCkge1xuICAgICAgICBjb250YWluZXIuc3R5bGUubWFyZ2luVG9wID0gYC0ke29mZnNldCAtIGNvbnRhaW5lci5vZmZzZXRIZWlnaHR9cHhgO1xuICAgICAgICB0aGlzLml0ZXJhdGlvbnMtLTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAyNzogLy8gZXNjXG4gICAgICB0aGlzLmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2xpZGVzaG93JykucmVtb3ZlKCk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2xpZGVzaG93O1xuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IG51bmp1Y2tzID0gcmVxdWlyZShcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiKTtcbmNvbnN0IHNldHRpbmdzID0gd2luZG93LkxCLnNldHRpbmdzO1xuXG5jb25zdCBkZWZhdWx0VGVtcGxhdGVzID0ge1xuICBwb3N0OiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLXBvc3QuaHRtbFwiKSxcbiAgdGltZWxpbmU6IHJlcXVpcmUoXCIuLi8uLi90ZW1wbGF0ZXMvdGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiKSxcbiAgaXRlbUltYWdlOiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0taW1hZ2UuaHRtbFwiKSxcbiAgaXRlbUVtYmVkOiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiKSxcbiAgc2xpZGVzaG93OiByZXF1aXJlKFwiLi4vLi4vdGVtcGxhdGVzL3RlbXBsYXRlLXNsaWRlc2hvdy5odG1sXCIpXG59O1xuXG5mdW5jdGlvbiBnZXRDdXN0b21UZW1wbGF0ZXMoKSB7XG4gIGxldCBjdXN0b21UZW1wbGF0ZXMgPSBzZXR0aW5ncy5jdXN0b21UZW1wbGF0ZXNcbiAgICAsIG1lcmdlZFRlbXBsYXRlcyA9IGRlZmF1bHRUZW1wbGF0ZXM7XG5cbiAgZm9yIChsZXQgdGVtcGxhdGUgaW4gY3VzdG9tVGVtcGxhdGVzKSB7XG4gICAgbGV0IGN1c3RvbVRlbXBsYXRlTmFtZSA9IGN1c3RvbVRlbXBsYXRlc1t0ZW1wbGF0ZV07XG4gICAgZGVmYXVsdFRlbXBsYXRlc1t0ZW1wbGF0ZV0gPSAoY3R4LCBjYikgPT4ge1xuICAgICAgbnVuanVja3MucmVuZGVyKGN1c3RvbVRlbXBsYXRlTmFtZSwgY3R4LCBjYik7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBtZXJnZWRUZW1wbGF0ZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dGluZ3MuY3VzdG9tVGVtcGxhdGVzXG4gID8gZ2V0Q3VzdG9tVGVtcGxhdGVzKClcbiAgOiBkZWZhdWx0VGVtcGxhdGVzO1xuIiwiLyoqXG4gKiBAYXV0aG9yIHBzIC8gQF9fX3BhdWxcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XG52YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcbnZhciBTbGlkZXNob3cgPSByZXF1aXJlKCcuL3NsaWRlc2hvdycpO1xuXG52YXIgdGltZWxpbmVFbGVtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5sYi1wb3N0cy5ub3JtYWxcIilcbiAgLCBsb2FkTW9yZVBvc3RzQnV0dG9uID0gaGVscGVycy5nZXRFbGVtcyhcImxvYWQtbW9yZS1wb3N0c1wiKTtcblxuLyoqXG4gKiBSZXBsYWNlIHRoZSBjdXJyZW50IHRpbWVsaW5lIHVuY29uZGl0aW9uYWxseS5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IGFwaV9yZXNwb25zZSDigJMgY29udGFpbnMgcmVxdWVzdCBvcHRzLlxuICogQHByb3BlcnR5IHtPYmplY3R9IHJlcXVlc3RPcHRzIC0gQVBJIHJlcXVlc3QgcGFyYW1zLlxuICovXG5mdW5jdGlvbiByZW5kZXJUaW1lbGluZShhcGlfcmVzcG9uc2UpIHtcbiAgdmFyIHJlbmRlcmVkUG9zdHMgPSBbXTtcblxuICBhcGlfcmVzcG9uc2UuX2l0ZW1zLmZvckVhY2goKHBvc3QpID0+IHtcbiAgICByZW5kZXJlZFBvc3RzLnB1c2godGVtcGxhdGVzLnBvc3Qoe1xuICAgICAgaXRlbTogcG9zdCxcbiAgICAgIHNldHRpbmdzOiB3aW5kb3cuTEIuc2V0dGluZ3NcbiAgICB9KSk7XG4gIH0pO1xuXG4gIHRpbWVsaW5lRWxlbVswXS5pbm5lckhUTUwgPSByZW5kZXJlZFBvc3RzLmpvaW4oXCJcIik7XG4gIGxvYWRFbWJlZHMoKTtcbiAgYXR0YWNoU2xpZGVzaG93KCk7XG59XG5cbi8qKlxuICogUmVuZGVyIHBvc3RzIGN1cnJlbnRseSBpbiBwaXBlbGluZSB0byB0ZW1wbGF0ZS5cbiAqIFRvIHJlZHVjZSBET00gY2FsbHMvcGFpbnRzIHdlIGhhbmQgb2ZmIHJlbmRlcmVkIEhUTUwgaW4gYnVsay5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IGFwaV9yZXNwb25zZSDigJMgY29udGFpbnMgcmVxdWVzdCBvcHRzLlxuICogQHByb3BlcnR5IHtPYmplY3R9IHJlcXVlc3RPcHRzIC0gQVBJIHJlcXVlc3QgcGFyYW1zLlxuICovXG5mdW5jdGlvbiByZW5kZXJQb3N0cyhhcGlfcmVzcG9uc2UpIHtcbiAgdmFyIHJlbmRlcmVkUG9zdHMgPSBbXSAvLyB0ZW1wb3Jhcnkgc3RvcmVcbiAgICAsIHBvc3RzID0gYXBpX3Jlc3BvbnNlLl9pdGVtcztcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBvc3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBvc3QgPSBwb3N0c1tpXTtcblxuICAgIGlmIChwb3N0cy5vcGVyYXRpb24gPT09IFwiZGVsZXRlXCIpIHtcbiAgICAgIGRlbGV0ZVBvc3QocG9zdC5faWQpO1xuICAgICAgcmV0dXJuOyAvLyBlYXJseVxuICAgIH1cblxuICAgIHZhciByZW5kZXJlZFBvc3QgPSB0ZW1wbGF0ZXMucG9zdCh7XG4gICAgICBpdGVtOiBwb3N0LFxuICAgICAgc2V0dGluZ3M6IHdpbmRvdy5MQi5zZXR0aW5nc1xuICAgIH0pO1xuXG4gICAgaWYgKHBvc3RzLm9wZXJhdGlvbiA9PT0gXCJ1cGRhdGVcIikge1xuICAgICAgdXBkYXRlUG9zdChyZW5kZXJlZFBvc3QpO1xuICAgICAgcmV0dXJuOyAvLyBlYXJseVxuICAgIH1cblxuICAgIHJlbmRlcmVkUG9zdHMucHVzaChyZW5kZXJlZFBvc3QpOyAvLyBjcmVhdGUgb3BlcmF0aW9uXG4gIH1cblxuICBpZiAoIXJlbmRlcmVkUG9zdHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuOyAvLyBlYXJseVxuICB9XG4gIFxuICByZW5kZXJlZFBvc3RzLnJldmVyc2UoKTtcblxuICBhZGRQb3N0cyhyZW5kZXJlZFBvc3RzLCB7IC8vIGlmIGNyZWF0ZXNcbiAgICBwb3NpdGlvbjogYXBpX3Jlc3BvbnNlLnJlcXVlc3RPcHRzLmZyb21EYXRlID8gXCJ0b3BcIiA6IFwiYm90dG9tXCJcbiAgfSk7XG5cbiAgbG9hZEVtYmVkcygpO1xufVxuXG4vKipcbiAqIEFkZCBwb3N0IG5vZGVzIHRvIERPTSwgZG8gc28gcmVnYXJkbGVzcyBvZiBzZXR0aW5ncy5hdXRvQXBwbHlVcGRhdGVzLFxuICogYnV0IHJhdGhlciBzZXQgdGhlbSB0byBOT1QgQkUgRElTUExBWUVEIGlmIGF1dG8tYXBwbHkgaXMgZmFsc2UuXG4gKiBUaGlzIHdheSB3ZSBkb24ndCBoYXZlIHRvIG1lc3Mgd2l0aCB0d28gc3RhY2tzIG9mIHBvc3RzLlxuICogQHBhcmFtIHthcnJheX0gcG9zdHMgLSBhbiBhcnJheSBvZiBMaXZlYmxvZyBwb3N0IGl0ZW1zXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIGtleXdvcmQgYXJnc1xuICogQHBhcmFtIHtzdHJpbmd9IG9wdHMucG9zaXRpb24gLSB0b3Agb3IgYm90dG9tXG4gKi9cbmZ1bmN0aW9uIGFkZFBvc3RzKHBvc3RzLCBvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICBvcHRzLnBvc2l0aW9uID0gb3B0cy5wb3NpdGlvbiB8fCBcImJvdHRvbVwiO1xuXG4gIHZhciBwb3N0c0hUTUwgPSBcIlwiXG4gICAgLCBwb3NpdGlvbiA9IG9wdHMucG9zaXRpb24gPT09IFwidG9wXCJcbiAgICAgICAgPyBcImFmdGVyYmVnaW5cIiAvLyBpbnNlcnRBZGphY2VudEhUTUwgQVBJID0+IGFmdGVyIHN0YXJ0IG9mIG5vZGVcbiAgICAgICAgOiBcImJlZm9yZWVuZFwiOyAvLyBpbnNlcnRBZGphY2VudEhUTUwgQVBJID0+IGJlZm9yZSBlbmQgb2Ygbm9kZVxuXG4gIGZvciAodmFyIGkgPSBwb3N0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHBvc3RzSFRNTCArPSBwb3N0c1tpXTtcbiAgfVxuXG4gIHRpbWVsaW5lRWxlbVswXS5pbnNlcnRBZGphY2VudEhUTUwocG9zaXRpb24sIHBvc3RzSFRNTCk7XG4gIGF0dGFjaFNsaWRlc2hvdygpO1xufVxuXG4vKipcbiAqIERlbGV0ZSBwb3N0IDxhcnRpY2xlPiBET00gbm9kZSBieSBkYXRhIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAtIGEgcG9zdCBVUk5cbiAqL1xuZnVuY3Rpb24gZGVsZXRlUG9zdChwb3N0SWQpIHtcbiAgdmFyIGVsZW0gPSBoZWxwZXJzLmdldEVsZW1zKCdkYXRhLWpzLXBvc3QtaWQ9XFxcIicgKyBwb3N0SWQgKyAnXFxcIicpO1xuICBlbGVtWzBdLnJlbW92ZSgpO1xufVxuXG4vKipcbiAqIERlbGV0ZSBwb3N0IDxhcnRpY2xlPiBET00gbm9kZSBieSBkYXRhIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSAtIGEgcG9zdCBVUk5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlUG9zdChwb3N0SWQsIHJlbmRlcmVkUG9zdCkge1xuICB2YXIgZWxlbSA9IGhlbHBlcnMuZ2V0RWxlbXMoJ2RhdGEtanMtcG9zdC1pZD1cXFwiJyArIHBvc3RJZCArICdcXFwiJyk7XG4gIGVsZW1bMF0uaW5uZXJIVE1MID0gcmVuZGVyZWRQb3N0O1xufVxuXG4vKipcbiAqIFNob3cgbmV3IHBvc3RzIGxvYWRlZCB2aWEgWEhSXG4gKi9cbmZ1bmN0aW9uIGRpc3BsYXlOZXdQb3N0cygpIHtcbiAgdmFyIG5ld1Bvc3RzID0gaGVscGVycy5nZXRFbGVtcyhcImxiLXBvc3QtbmV3XCIpO1xuICBmb3IgKHZhciBpID0gbmV3UG9zdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBuZXdQb3N0c1tpXS5jbGFzc0xpc3QucmVtb3ZlKFwibGItcG9zdC1uZXdcIik7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGVtYmVkIHByb3ZpZGVyIHVucGFja2luZ1xuICogVG9kbzogTWFrZSByZXF1aXJlZCBzY3JpcHRzIGF2YWlsYWJsZSBvbiBzdWJzZXF1ZW50IGxvYWRzXG4gKi9cbmZ1bmN0aW9uIGxvYWRFbWJlZHMoKSB7XG4gIGlmICh3aW5kb3cuaW5zdGdybSkge1xuICAgIGluc3Rncm0uRW1iZWRzLnByb2Nlc3MoKTtcbiAgfVxuXG4gIGlmICh3aW5kb3cudHd0dHIpIHtcbiAgICB0d3R0ci53aWRnZXRzLmxvYWQoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b2dnbGVDb21tZW50RGlhbG9nKCkge1xuICBsZXQgY29tbWVudEZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdmb3JtLmNvbW1lbnQnKTtcbiAgbGV0IGlzSGlkZGVuID0gZmFsc2U7XG5cbiAgaWYgKGNvbW1lbnRGb3JtKSB7XG4gICAgaXNIaWRkZW4gPSBjb21tZW50Rm9ybS5jbGFzc0xpc3QudG9nZ2xlKCdoaWRlJyk7XG4gIH1cblxuICByZXR1cm4gIWlzSGlkZGVuO1xufVxuXG4vKipcbiAqIFNldCBzb3J0aW5nIG9yZGVyIGJ1dHRvbiBvZiBjbGFzcyBAbmFtZSB0byBhY3RpdmUuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIGxpdmVibG9nIEFQSSByZXNwb25zZSBKU09OLlxuICovXG5mdW5jdGlvbiB0b2dnbGVTb3J0QnRuKG5hbWUpIHtcbiAgdmFyIHNvcnRpbmdCdG5zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnNvcnRpbmctYmFyX19vcmRlcicpO1xuXG4gIHNvcnRpbmdCdG5zLmZvckVhY2goKGVsKSA9PiB7XG4gICAgdmFyIHNob3VsZEJlQWN0aXZlID0gZWwuZGF0YXNldC5oYXNPd25Qcm9wZXJ0eShcImpzT3JkZXJieV9cIiArIG5hbWUpO1xuXG4gICAgZWwuY2xhc3NMaXN0LnRvZ2dsZSgnc29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmUnLCBzaG91bGRCZUFjdGl2ZSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIENvbmRpdGlvbmFsbHkgaGlkZSBsb2FkLW1vcmUtcG9zdHMgYnV0dG9uLlxuICogQHBhcmFtIHtib29sfSBzaG91bGRUb2dnbGUgLSB0cnVlID0+IGhpZGVcbiAqL1xuZnVuY3Rpb24gaGlkZUxvYWRNb3JlKHNob3VsZEhpZGUpIHtcbiAgaWYgKGxvYWRNb3JlUG9zdHNCdXR0b24ubGVuZ3RoID4gMCkge1xuICAgIGxvYWRNb3JlUG9zdHNCdXR0b25bMF0uY2xhc3NMaXN0LnRvZ2dsZShcbiAgICAgIFwibW9kLS1oaWRlXCIsIHNob3VsZEhpZGUpO1xuICB9XG59XG5cbi8qKlxuICogRGVsZXRlIHBvc3QgPGFydGljbGU+IERPTSBub2RlIGJ5IGRhdGEgYXR0cmlidXRlLlxuICogQHBhcmFtIHtzdHJpbmd9IC0gYSBwb3N0IFVSTlxuICovXG5mdW5jdGlvbiB1cGRhdGVUaW1lc3RhbXBzKCkge1xuICB2YXIgZGF0ZUVsZW1zID0gaGVscGVycy5nZXRFbGVtcyhcImxiLXBvc3QtZGF0ZVwiKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRlRWxlbXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZWxlbSA9IGRhdGVFbGVtc1tpXVxuICAgICAgLCB0aW1lc3RhbXAgPSBlbGVtLmRhdGFzZXQuanNUaW1lc3RhbXA7XG4gICAgZWxlbS50ZXh0Q29udGVudCA9IGhlbHBlcnMuY29udmVydFRpbWVzdGFtcCh0aW1lc3RhbXApO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBzaG93U3VjY2Vzc0NvbW1lbnRNc2coKSB7XG4gIGxldCBjb21tZW50U2VudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Rpdi5jb21tZW50LXNlbnQnKTtcblxuICBjb21tZW50U2VudC5jbGFzc0xpc3QudG9nZ2xlKCdoaWRlJyk7XG5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgY29tbWVudFNlbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZScpO1xuICB9LCA1MDAwKTtcbn1cblxuZnVuY3Rpb24gY2xlYXJDb21tZW50Rm9ybUVycm9ycygpIHtcbiAgbGV0IGVycm9yc01zZ3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwLmVyci1tc2cnKTtcblxuICBpZiAoZXJyb3JzTXNncykge1xuICAgIGVycm9yc01zZ3MuZm9yRWFjaCgoZXJyb3JzTXNnKSA9PiBlcnJvcnNNc2cucmVtb3ZlKCkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BsYXlDb21tZW50Rm9ybUVycm9ycyhlcnJvcnMpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoZXJyb3JzKSkge1xuICAgIGVycm9ycy5mb3JFYWNoKChlcnJvcikgPT4ge1xuICAgICAgbGV0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVycm9yLmlkKTtcblxuICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC5pbnNlcnRBZGphY2VudEhUTUwoXG4gICAgICAgICAgJ2FmdGVyZW5kJyxcbiAgICAgICAgICBgPHAgY2xhc3M9XCJlcnItbXNnXCI+JHtlcnJvci5tc2d9PC9wPmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhdHRhY2hTbGlkZXNob3coKSB7XG4gIGNvbnN0IHNsaWRlc2hvdyA9IG5ldyBTbGlkZXNob3coKTtcbiAgY29uc3Qgc2xpZGVzaG93SW1hZ2VzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYXJ0aWNsZS5zbGlkZXNob3cgaW1nJyk7XG5cbiAgaWYgKHNsaWRlc2hvd0ltYWdlcykge1xuICAgIHNsaWRlc2hvd0ltYWdlcy5mb3JFYWNoKChpbWFnZSkgPT4ge1xuICAgICAgaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzbGlkZXNob3cuc3RhcnQpO1xuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGRQb3N0czogYWRkUG9zdHMsXG4gIGRlbGV0ZVBvc3Q6IGRlbGV0ZVBvc3QsXG4gIGRpc3BsYXlOZXdQb3N0czogZGlzcGxheU5ld1Bvc3RzLFxuICByZW5kZXJUaW1lbGluZTogcmVuZGVyVGltZWxpbmUsXG4gIHJlbmRlclBvc3RzOiByZW5kZXJQb3N0cyxcbiAgdXBkYXRlUG9zdDogdXBkYXRlUG9zdCxcbiAgdXBkYXRlVGltZXN0YW1wczogdXBkYXRlVGltZXN0YW1wcyxcbiAgaGlkZUxvYWRNb3JlOiBoaWRlTG9hZE1vcmUsXG4gIHRvZ2dsZVNvcnRCdG46IHRvZ2dsZVNvcnRCdG4sXG4gIHRvZ2dsZUNvbW1lbnREaWFsb2c6IHRvZ2dsZUNvbW1lbnREaWFsb2csXG4gIHNob3dTdWNjZXNzQ29tbWVudE1zZzogc2hvd1N1Y2Nlc3NDb21tZW50TXNnLFxuICBkaXNwbGF5Q29tbWVudEZvcm1FcnJvcnM6IGRpc3BsYXlDb21tZW50Rm9ybUVycm9ycyxcbiAgY2xlYXJDb21tZW50Rm9ybUVycm9yczogY2xlYXJDb21tZW50Rm9ybUVycm9ycyxcbiAgYXR0YWNoU2xpZGVzaG93OiBhdHRhY2hTbGlkZXNob3dcbn07XG4iLCIvKipcbiAqIEBhdXRob3IgcHMgLyBAX19fcGF1bFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKVxuICAsIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY29uc3QgY29tbWVudEl0ZW1FbmRwb2ludCA9IGAke0xCLmFwaV9ob3N0fWFwaS9jbGllbnRfaXRlbXNgO1xuY29uc3QgY29tbWVudFBvc3RFbmRwb2ludCA9IGAke0xCLmFwaV9ob3N0fWFwaS9jbGllbnRfY29tbWVudHNgO1xuXG52YXIgZW5kcG9pbnQgPSBMQi5hcGlfaG9zdCArIFwiL2FwaS9jbGllbnRfYmxvZ3MvXCIgKyBMQi5ibG9nLl9pZCArIFwiL3Bvc3RzXCJcbiAgLCBzZXR0aW5ncyA9IExCLnNldHRpbmdzXG4gICwgdm0gPSB7fTtcblxuLyoqXG4gKiBHZXQgaW5pdGlhbCBvciByZXNldCB2aWV3bW9kZWwuXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBlbXB0eSB2aWV3bW9kZWwgc3RvcmUuXG4gKi9cbmZ1bmN0aW9uIGdldEVtcHR5Vm0oaXRlbXMpIHtcbiAgcmV0dXJuIHtcbiAgICBfaXRlbXM6IG5ldyBBcnJheShpdGVtcykgfHwgMCxcbiAgICBjdXJyZW50UGFnZTogMSxcbiAgICB0b3RhbFBvc3RzOiAwXG4gIH07XG59XG5cbnZtLnNlbmRDb21tZW50ID0gKG5hbWUsIGNvbW1lbnQpID0+IHtcbiAgbGV0IGVycm9ycyA9IFtdO1xuXG4gIGlmICghbmFtZSkge1xuICAgIGVycm9ycy5wdXNoKHtpZDogJyNjb21tZW50LW5hbWUnLCBtc2c6ICdNaXNzaW5nIG5hbWUnfSk7XG4gIH1cblxuICBpZiAoIWNvbW1lbnQpIHtcbiAgICBlcnJvcnMucHVzaCh7aWQ6ICcjY29tbWVudC1jb250ZW50JywgbXNnOiAnTWlzc2luZyBjb250ZW50J30pO1xuICB9XG5cbiAgaWYgKGVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHJlamVjdChlcnJvcnMpKTtcbiAgfVxuXG4gIHJldHVybiBoZWxwZXJzXG4gICAgLnBvc3QoY29tbWVudEl0ZW1FbmRwb2ludCwge1xuICAgICAgaXRlbV90eXBlOiBcImNvbW1lbnRcIixcbiAgICAgIGNsaWVudF9ibG9nOiBMQi5ibG9nLl9pZCxcbiAgICAgIGNvbW1lbnRlcjogbmFtZSxcbiAgICAgIHRleHQ6IGNvbW1lbnRcbiAgICB9KVxuICAgIC50aGVuKChpdGVtKSA9PiBoZWxwZXJzLnBvc3QoY29tbWVudFBvc3RFbmRwb2ludCwge1xuICAgICAgcG9zdF9zdGF0dXM6IFwiY29tbWVudFwiLFxuICAgICAgY2xpZW50X2Jsb2c6IExCLmJsb2cuX2lkLFxuICAgICAgZ3JvdXBzOiBbe1xuICAgICAgICBpZDogXCJyb290XCIsXG4gICAgICAgIHJlZnM6IFt7aWRSZWY6IFwibWFpblwifV0sXG4gICAgICAgIHJvbGU6IFwiZ3JwUm9sZTpORVBcIlxuICAgICAgfSx7XG4gICAgICAgIGlkOiBcIm1haW5cIixcbiAgICAgICAgcmVmczogW3tyZXNpZFJlZjogaXRlbS5faWR9XSxcbiAgICAgICAgcm9sZTogXCJncnBSb2xlOk1haW5cIn1cbiAgICAgIF1cbiAgICB9KSk7XG4gICAgLy8uY2F0Y2goKGVycikgPT4ge1xuICAgIC8vICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgLy99KTtcbn07XG5cbi8qKlxuICogUHJpdmF0ZSBBUEkgcmVxdWVzdCBtZXRob2RcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0gcXVlcnkgYnVpbGRlciBvcHRpb25zLlxuICogQHBhcmFtIHtudW1iZXJ9IG9wdHMucGFnZSAtIGRlc2lyZWQgcGFnZS9zdWJzZXQgb2YgcG9zdHMsIGxlYXZlIGVtcHR5IGZvciBwb2xsaW5nLlxuICogQHBhcmFtIHtudW1iZXJ9IG9wdHMuZnJvbURhdGUgLSBuZWVkZWQgZm9yIHBvbGxpbmcuXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBMaXZlYmxvZyAzIEFQSSByZXNwb25zZVxuICovXG52bS5nZXRQb3N0cyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBkYlF1ZXJ5ID0gc2VsZi5nZXRRdWVyeSh7XG4gICAgc29ydDogb3B0cy5zb3J0IHx8IHNlbGYuc2V0dGluZ3MucG9zdE9yZGVyLFxuICAgIGhpZ2hsaWdodHNPbmx5OiBmYWxzZSB8fCBvcHRzLmhpZ2hsaWdodHNPbmx5LFxuICAgIGZyb21EYXRlOiBvcHRzLmZyb21EYXRlXG4gICAgICA/IG9wdHMuZnJvbURhdGVcbiAgICAgIDogZmFsc2VcbiAgfSk7XG5cbiAgdmFyIHBhZ2UgPSBvcHRzLmZyb21EYXRlID8gMSA6IG9wdHMucGFnZTtcbiAgdmFyIHFzID0gXCI/bWF4X3Jlc3VsdHM9XCIgKyBzZXR0aW5ncy5wb3N0c1BlclBhZ2UgKyBcIiZwYWdlPVwiICsgcGFnZSArIFwiJnNvdXJjZT1cIlxuICAgICwgZnVsbFBhdGggPSBlbmRwb2ludCArIHFzICsgZGJRdWVyeTtcblxuICByZXR1cm4gaGVscGVycy5nZXRKU09OKGZ1bGxQYXRoKVxuICAgIC50aGVuKChwb3N0cykgPT4ge1xuICAgICAgc2VsZi51cGRhdGVWaWV3TW9kZWwocG9zdHMsIG9wdHMpO1xuICAgICAgcG9zdHMucmVxdWVzdE9wdHMgPSBvcHRzO1xuICAgICAgcmV0dXJuIHBvc3RzO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogR2V0IG5leHQgcGFnZSBvZiBwb3N0cyBmcm9tIEFQSS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0gcXVlcnkgYnVpbGRlciBvcHRpb25zLlxuICogQHJldHVybnMge3Byb21pc2V9IHJlc29sdmVzIHRvIHBvc3RzIGFycmF5LlxuICovXG52bS5sb2FkUG9zdHNQYWdlID0gZnVuY3Rpb24ob3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgb3B0cy5wYWdlID0gKyt0aGlzLnZtLmN1cnJlbnRQYWdlO1xuICBvcHRzLnNvcnQgPSB0aGlzLnNldHRpbmdzLnBvc3RPcmRlcjtcbiAgcmV0dXJuIHRoaXMuZ2V0UG9zdHMob3B0cyk7XG59O1xuXG4vKipcbiAqIFBvbGwgQVBJIGZvciBuZXcgcG9zdHMuXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIHF1ZXJ5IGJ1aWxkZXIgb3B0aW9ucy5cbiAqIEByZXR1cm5zIHtwcm9taXNlfSByZXNvbHZlcyB0byBwb3N0cyBhcnJheS5cbiAqL1xudm0ubG9hZFBvc3RzID0gZnVuY3Rpb24ob3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgb3B0cy5mcm9tRGF0ZSA9IHRoaXMudm0ubGF0ZXN0VXBkYXRlO1xuICByZXR1cm4gdGhpcy5nZXRQb3N0cyhvcHRzKTtcbn07XG5cbi8qKlxuICogQWRkIGl0ZW1zIGluIGFwaSByZXNwb25zZSAmIGxhdGVzdCB1cGRhdGUgdGltZXN0YW1wIHRvIHZpZXdtb2RlbC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBhcGlfcmVzcG9uc2UgLSBsaXZlYmxvZyBBUEkgcmVzcG9uc2UgSlNPTi5cbiAqL1xudm0udXBkYXRlVmlld01vZGVsID0gZnVuY3Rpb24oYXBpX3Jlc3BvbnNlLCBvcHRzKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAoIW9wdHMuZnJvbURhdGUgfHwgb3B0cy5zb3J0ICE9PSBzZWxmLnNldHRpbmdzLnBvc3RPcmRlcikgeyAvLyBNZWFucyB3ZSdyZSBub3QgcG9sbGluZ1xuICAgIHZpZXcuaGlkZUxvYWRNb3JlKHNlbGYuaXNUaW1lbGluZUVuZChhcGlfcmVzcG9uc2UpKTsgLy8gdGhlIGVuZD9cbiAgfSBlbHNlIHsgLy8gTWVhbnMgd2UncmUgcG9sbGluZyBmb3IgbmV3IHBvc3RzXG4gICAgaWYgKCFhcGlfcmVzcG9uc2UuX2l0ZW1zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYudm0ubGF0ZXN0VXBkYXRlID0gc2VsZi5nZXRMYXRlc3RVcGRhdGUoYXBpX3Jlc3BvbnNlKTtcbiAgfVxuXG4gIGlmIChvcHRzLnNvcnQgIT09IHNlbGYuc2V0dGluZ3MucG9zdE9yZGVyKSB7XG4gICAgc2VsZi52bSA9IGdldEVtcHR5Vm0oKTtcbiAgICB2aWV3LmhpZGVMb2FkTW9yZShmYWxzZSk7XG4gICAgT2JqZWN0LmFzc2lnbihzZWxmLnZtLCBhcGlfcmVzcG9uc2UpO1xuICB9IGVsc2Uge1xuICAgIHNlbGYudm0uX2l0ZW1zLnB1c2guYXBwbHkoc2VsZi52bS5faXRlbXMsIGFwaV9yZXNwb25zZS5faXRlbXMpO1xuICB9XG5cbiAgc2VsZi5zZXR0aW5ncy5wb3N0T3JkZXIgPSBvcHRzLnNvcnQ7XG4gIHJldHVybiBhcGlfcmVzcG9uc2U7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgbGF0ZXN0IHVwZGF0ZSB0aW1lc3RhbXAgZnJvbSBhIG51bWJlciBvZiBwb3N0cy5cbiAqIEBwYXJhbSB7b2JqZWN0fSBhcGlfcmVzcG9uc2UgLSBsaXZlYmxvZyBBUEkgcmVzcG9uc2UgSlNPTi5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IC0gSVNPIDg2MDEgZW5jb2RlZCBkYXRlXG4gKi9cbnZtLmdldExhdGVzdFVwZGF0ZSA9IGZ1bmN0aW9uKGFwaV9yZXNwb25zZSkge1xuICB2YXIgdGltZXN0YW1wcyA9IGFwaV9yZXNwb25zZS5faXRlbXMubWFwKChwb3N0KSA9PiBuZXcgRGF0ZShwb3N0Ll91cGRhdGVkKSk7XG5cbiAgdmFyIGxhdGVzdCA9IG5ldyBEYXRlKE1hdGgubWF4LmFwcGx5KG51bGwsIHRpbWVzdGFtcHMpKTtcbiAgcmV0dXJuIGxhdGVzdC50b0lTT1N0cmluZygpOyAvLyBjb252ZXJ0IHRpbWVzdGFtcCB0byBJU09cbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgd2UgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSB0aW1lbGluZS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBhcGlfcmVzcG9uc2UgLSBsaXZlYmxvZyBBUEkgcmVzcG9uc2UgSlNPTi5cbiAqIEByZXR1cm5zIHtib29sfVxuICovXG52bS5pc1RpbWVsaW5lRW5kID0gZnVuY3Rpb24oYXBpX3Jlc3BvbnNlKSB7XG4gIHZhciBpdGVtc0luVmlldyA9IHRoaXMudm0uX2l0ZW1zLmxlbmd0aCArIHNldHRpbmdzLnBvc3RzUGVyUGFnZTtcbiAgcmV0dXJuIGFwaV9yZXNwb25zZS5fbWV0YS50b3RhbCA8PSBpdGVtc0luVmlldztcbn07XG5cbi8qKlxuICogU2V0IHVwIHZpZXdtb2RlbC5cbiAqL1xudm0uaW5pdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gIHRoaXMudm0gPSBnZXRFbXB0eVZtKHNldHRpbmdzLnBvc3RzUGVyUGFnZSk7XG4gIHRoaXMudm0ubGF0ZXN0VXBkYXRlID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICB0aGlzLnZtLnRpbWVJbml0aWFsaXplZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgcmV0dXJuIHRoaXMudm0ubGF0ZXN0VXBkYXRlO1xufTtcblxuLyoqXG4gKiBCdWlsZCB1cmxlbmNvZGVkIEVsYXN0aWNTZWFyY2ggUXVlcnlzdHJpbmdcbiAqIFRPRE86IGFic3RyYWN0IGF3YXksIHdlIG9ubHkgbmVlZCBzdGlja3kgZmxhZyBhbmQgb3JkZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gYXJndW1lbnRzIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IG9wdHMuc29ydCAtIGlmIFwiYXNjZW5kaW5nXCIsIGdldCBpdGVtcyBpbiBhc2NlbmRpbmcgb3JkZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLmZyb21EYXRlIC0gcmVzdWx0cyB3aXRoIGEgSVNPIDg2MDEgdGltZXN0YW1wIGd0IHRoaXMgb25seVxuICogQHBhcmFtIHtib29sfSBvcHRzLmhpZ2hsaWdodHNPbmx5IC0gZ2V0IGVkaXRvcmlhbC9oaWdobGlnaHRlZCBpdGVtcyBvbmx5XG4gKiBAcmV0dXJucyB7c3RyaW5nfSBRdWVyeXN0cmluZ1xuICovXG52bS5nZXRRdWVyeSA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgdmFyIHF1ZXJ5ID0ge1xuICAgIFwicXVlcnlcIjoge1xuICAgICAgXCJmaWx0ZXJlZFwiOiB7XG4gICAgICAgIFwiZmlsdGVyXCI6IHtcbiAgICAgICAgICBcImFuZFwiOiBbXG4gICAgICAgICAgICB7XCJ0ZXJtXCI6IHtcInN0aWNreVwiOiBmYWxzZX19LFxuICAgICAgICAgICAge1widGVybVwiOiB7XCJwb3N0X3N0YXR1c1wiOiBcIm9wZW5cIn19LFxuICAgICAgICAgICAge1wibm90XCI6IHtcInRlcm1cIjoge1wiZGVsZXRlZFwiOiB0cnVlfX19LFxuICAgICAgICAgICAge1wicmFuZ2VcIjoge1wiX3VwZGF0ZWRcIjoge1wibHRcIjogdGhpcy52bS50aW1lSW5pdGlhbGl6ZWR9fX1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFwic29ydFwiOiBbXG4gICAgICB7XG4gICAgICAgIFwiX3VwZGF0ZWRcIjoge1wib3JkZXJcIjogXCJkZXNjXCJ9XG4gICAgICB9XG4gICAgXVxuICB9O1xuXG4gIGlmIChvcHRzLmZyb21EYXRlKSB7XG4gICAgcXVlcnkucXVlcnkuZmlsdGVyZWQuZmlsdGVyLmFuZFszXS5yYW5nZS5fdXBkYXRlZCA9IHtcbiAgICAgIFwiZ3RcIjogb3B0cy5mcm9tRGF0ZVxuICAgIH07XG4gIH1cblxuICBpZiAob3B0cy5oaWdobGlnaHRzT25seSA9PT0gdHJ1ZSkge1xuICAgIHF1ZXJ5LnF1ZXJ5LmZpbHRlcmVkLmZpbHRlci5hbmQucHVzaCh7XG4gICAgICB0ZXJtOiB7aGlnaGxpZ2h0OiB0cnVlfVxuICAgIH0pO1xuICB9XG5cbiAgaWYgKG9wdHMuc29ydCA9PT0gXCJhc2NlbmRpbmdcIikge1xuICAgIHF1ZXJ5LnNvcnRbMF0uX3VwZGF0ZWQub3JkZXIgPSBcImFzY1wiO1xuICB9IGVsc2UgaWYgKG9wdHMuc29ydCA9PT0gXCJlZGl0b3JpYWxcIikge1xuICAgIHF1ZXJ5LnNvcnQgPSBbXG4gICAgICB7XG4gICAgICAgIG9yZGVyOiB7XG4gICAgICAgICAgb3JkZXI6IFwiZGVzY1wiLFxuICAgICAgICAgIG1pc3Npbmc6IFwiX2xhc3RcIixcbiAgICAgICAgICB1bm1hcHBlZF90eXBlOiBcImxvbmdcIlxuICAgICAgICB9XG4gICAgICB9XG4gICAgXTtcbiAgfVxuXG4gIC8vIFJlbW92ZSB0aGUgcmFuZ2UsIHdlIHdhbnQgYWxsIHRoZSByZXN1bHRzXG4gIGlmIChbXCJhc2NlbmRpbmdcIiwgXCJkZXNjZW5kaW5nXCIsIFwiZWRpdG9yaWFsXCJdLmluZGV4T2Yob3B0cy5zb3J0KSkge1xuICAgIHF1ZXJ5LnF1ZXJ5LmZpbHRlcmVkLmZpbHRlci5hbmQuZm9yRWFjaCgocnVsZSwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChydWxlLmhhc093blByb3BlcnR5KCdyYW5nZScpKSB7XG4gICAgICAgIHF1ZXJ5LnF1ZXJ5LmZpbHRlcmVkLmZpbHRlci5hbmQuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBlbmNvZGVVUkkoSlNPTi5zdHJpbmdpZnkocXVlcnkpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdm07XG4iLCIvKiEgQnJvd3NlciBidW5kbGUgb2YgbnVuanVja3MgMy4wLjEgKHNsaW0sIG9ubHkgd29ya3Mgd2l0aCBwcmVjb21waWxlZCB0ZW1wbGF0ZXMpICovXG4oZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJudW5qdWNrc1wiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJudW5qdWNrc1wiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIC8qKioqKiovIChmdW5jdGlvbihtb2R1bGVzKSB7IC8vIHdlYnBhY2tCb290c3RyYXBcbi8qKioqKiovIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4vKioqKioqLyBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuLyoqKioqKi8gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbi8qKioqKiovIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9LFxuLyoqKioqKi8gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdFx0bG9hZGVkOiBmYWxzZVxuLyoqKioqKi8gXHRcdH07XG5cbi8qKioqKiovIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuLyoqKioqKi8gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbi8qKioqKiovIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuLyoqKioqKi8gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG5cblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuLyoqKioqKi8gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8qKioqKiovIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG4vKioqKioqLyB9KVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIChbXG4vKiAwICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgZW52ID0gX193ZWJwYWNrX3JlcXVpcmVfXygyKTtcblx0dmFyIExvYWRlciA9IF9fd2VicGFja19yZXF1aXJlX18oMTUpO1xuXHR2YXIgbG9hZGVycyA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBwcmVjb21waWxlID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXHRtb2R1bGUuZXhwb3J0cy5FbnZpcm9ubWVudCA9IGVudi5FbnZpcm9ubWVudDtcblx0bW9kdWxlLmV4cG9ydHMuVGVtcGxhdGUgPSBlbnYuVGVtcGxhdGU7XG5cblx0bW9kdWxlLmV4cG9ydHMuTG9hZGVyID0gTG9hZGVyO1xuXHRtb2R1bGUuZXhwb3J0cy5GaWxlU3lzdGVtTG9hZGVyID0gbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyO1xuXHRtb2R1bGUuZXhwb3J0cy5QcmVjb21waWxlZExvYWRlciA9IGxvYWRlcnMuUHJlY29tcGlsZWRMb2FkZXI7XG5cdG1vZHVsZS5leHBvcnRzLldlYkxvYWRlciA9IGxvYWRlcnMuV2ViTG9hZGVyO1xuXG5cdG1vZHVsZS5leHBvcnRzLmNvbXBpbGVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0bW9kdWxlLmV4cG9ydHMucGFyc2VyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0bW9kdWxlLmV4cG9ydHMubGV4ZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHRtb2R1bGUuZXhwb3J0cy5ydW50aW1lID0gX193ZWJwYWNrX3JlcXVpcmVfXyg4KTtcblx0bW9kdWxlLmV4cG9ydHMubGliID0gbGliO1xuXHRtb2R1bGUuZXhwb3J0cy5ub2RlcyA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0bW9kdWxlLmV4cG9ydHMuaW5zdGFsbEppbmphQ29tcGF0ID0gX193ZWJwYWNrX3JlcXVpcmVfXygxNik7XG5cblx0Ly8gQSBzaW5nbGUgaW5zdGFuY2Ugb2YgYW4gZW52aXJvbm1lbnQsIHNpbmNlIHRoaXMgaXMgc28gY29tbW9ubHkgdXNlZFxuXG5cdHZhciBlO1xuXHRtb2R1bGUuZXhwb3J0cy5jb25maWd1cmUgPSBmdW5jdGlvbih0ZW1wbGF0ZXNQYXRoLCBvcHRzKSB7XG5cdCAgICBvcHRzID0gb3B0cyB8fCB7fTtcblx0ICAgIGlmKGxpYi5pc09iamVjdCh0ZW1wbGF0ZXNQYXRoKSkge1xuXHQgICAgICAgIG9wdHMgPSB0ZW1wbGF0ZXNQYXRoO1xuXHQgICAgICAgIHRlbXBsYXRlc1BhdGggPSBudWxsO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgVGVtcGxhdGVMb2FkZXI7XG5cdCAgICBpZihsb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIpIHtcblx0ICAgICAgICBUZW1wbGF0ZUxvYWRlciA9IG5ldyBsb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIodGVtcGxhdGVzUGF0aCwge1xuXHQgICAgICAgICAgICB3YXRjaDogb3B0cy53YXRjaCxcblx0ICAgICAgICAgICAgbm9DYWNoZTogb3B0cy5ub0NhY2hlXG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cdCAgICBlbHNlIGlmKGxvYWRlcnMuV2ViTG9hZGVyKSB7XG5cdCAgICAgICAgVGVtcGxhdGVMb2FkZXIgPSBuZXcgbG9hZGVycy5XZWJMb2FkZXIodGVtcGxhdGVzUGF0aCwge1xuXHQgICAgICAgICAgICB1c2VDYWNoZTogb3B0cy53ZWIgJiYgb3B0cy53ZWIudXNlQ2FjaGUsXG5cdCAgICAgICAgICAgIGFzeW5jOiBvcHRzLndlYiAmJiBvcHRzLndlYi5hc3luY1xuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICBlID0gbmV3IGVudi5FbnZpcm9ubWVudChUZW1wbGF0ZUxvYWRlciwgb3B0cyk7XG5cblx0ICAgIGlmKG9wdHMgJiYgb3B0cy5leHByZXNzKSB7XG5cdCAgICAgICAgZS5leHByZXNzKG9wdHMuZXhwcmVzcyk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBlO1xuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbihzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKSB7XG5cdCAgICBpZighZSkge1xuXHQgICAgICAgIG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSgpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIG5ldyBtb2R1bGUuZXhwb3J0cy5UZW1wbGF0ZShzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKTtcblx0fTtcblxuXHRtb2R1bGUuZXhwb3J0cy5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCBjdHgsIGNiKSB7XG5cdCAgICBpZighZSkge1xuXHQgICAgICAgIG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSgpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gZS5yZW5kZXIobmFtZSwgY3R4LCBjYik7XG5cdH07XG5cblx0bW9kdWxlLmV4cG9ydHMucmVuZGVyU3RyaW5nID0gZnVuY3Rpb24oc3JjLCBjdHgsIGNiKSB7XG5cdCAgICBpZighZSkge1xuXHQgICAgICAgIG1vZHVsZS5leHBvcnRzLmNvbmZpZ3VyZSgpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gZS5yZW5kZXJTdHJpbmcoc3JjLCBjdHgsIGNiKTtcblx0fTtcblxuXHRpZihwcmVjb21waWxlKSB7XG5cdCAgICBtb2R1bGUuZXhwb3J0cy5wcmVjb21waWxlID0gcHJlY29tcGlsZS5wcmVjb21waWxlO1xuXHQgICAgbW9kdWxlLmV4cG9ydHMucHJlY29tcGlsZVN0cmluZyA9IHByZWNvbXBpbGUucHJlY29tcGlsZVN0cmluZztcblx0fVxuXG5cbi8qKiovIH0pLFxuLyogMSAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZTtcblx0dmFyIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuXHR2YXIgZXNjYXBlTWFwID0ge1xuXHQgICAgJyYnOiAnJmFtcDsnLFxuXHQgICAgJ1wiJzogJyZxdW90OycsXG5cdCAgICAnXFwnJzogJyYjMzk7Jyxcblx0ICAgICc8JzogJyZsdDsnLFxuXHQgICAgJz4nOiAnJmd0Oydcblx0fTtcblxuXHR2YXIgZXNjYXBlUmVnZXggPSAvWyZcIic8Pl0vZztcblxuXHR2YXIgbG9va3VwRXNjYXBlID0gZnVuY3Rpb24oY2gpIHtcblx0ICAgIHJldHVybiBlc2NhcGVNYXBbY2hdO1xuXHR9O1xuXG5cdHZhciBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuXHRleHBvcnRzLnByZXR0aWZ5RXJyb3IgPSBmdW5jdGlvbihwYXRoLCB3aXRoSW50ZXJuYWxzLCBlcnIpIHtcblx0ICAgIC8vIGpzaGludCAtVzAyMlxuXHQgICAgLy8gaHR0cDovL2pzbGludGVycm9ycy5jb20vZG8tbm90LWFzc2lnbi10by10aGUtZXhjZXB0aW9uLXBhcmFtZXRlclxuXHQgICAgaWYgKCFlcnIuVXBkYXRlKSB7XG5cdCAgICAgICAgLy8gbm90IG9uZSBvZiBvdXJzLCBjYXN0IGl0XG5cdCAgICAgICAgZXJyID0gbmV3IGV4cG9ydHMuVGVtcGxhdGVFcnJvcihlcnIpO1xuXHQgICAgfVxuXHQgICAgZXJyLlVwZGF0ZShwYXRoKTtcblxuXHQgICAgLy8gVW5sZXNzIHRoZXkgbWFya2VkIHRoZSBkZXYgZmxhZywgc2hvdyB0aGVtIGEgdHJhY2UgZnJvbSBoZXJlXG5cdCAgICBpZiAoIXdpdGhJbnRlcm5hbHMpIHtcblx0ICAgICAgICB2YXIgb2xkID0gZXJyO1xuXHQgICAgICAgIGVyciA9IG5ldyBFcnJvcihvbGQubWVzc2FnZSk7XG5cdCAgICAgICAgZXJyLm5hbWUgPSBvbGQubmFtZTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIGVycjtcblx0fTtcblxuXHRleHBvcnRzLlRlbXBsYXRlRXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlLCBsaW5lbm8sIGNvbG5vKSB7XG5cdCAgICB2YXIgZXJyID0gdGhpcztcblxuXHQgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBFcnJvcikgeyAvLyBmb3IgY2FzdGluZyByZWd1bGFyIGpzIGVycm9yc1xuXHQgICAgICAgIGVyciA9IG1lc3NhZ2U7XG5cdCAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UubmFtZSArICc6ICcgKyBtZXNzYWdlLm1lc3NhZ2U7XG5cblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICBpZihlcnIubmFtZSA9ICcnKSB7fVxuXHQgICAgICAgIH1cblx0ICAgICAgICBjYXRjaChlKSB7XG5cdCAgICAgICAgICAgIC8vIElmIHdlIGNhbid0IHNldCB0aGUgbmFtZSBvZiB0aGUgZXJyb3Igb2JqZWN0IGluIHRoaXNcblx0ICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQsIGRvbid0IHVzZSBpdFxuXHQgICAgICAgICAgICBlcnIgPSB0aGlzO1xuXHQgICAgICAgIH1cblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgaWYoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcblx0ICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoZXJyKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGVyci5uYW1lID0gJ1RlbXBsYXRlIHJlbmRlciBlcnJvcic7XG5cdCAgICBlcnIubWVzc2FnZSA9IG1lc3NhZ2U7XG5cdCAgICBlcnIubGluZW5vID0gbGluZW5vO1xuXHQgICAgZXJyLmNvbG5vID0gY29sbm87XG5cdCAgICBlcnIuZmlyc3RVcGRhdGUgPSB0cnVlO1xuXG5cdCAgICBlcnIuVXBkYXRlID0gZnVuY3Rpb24ocGF0aCkge1xuXHQgICAgICAgIHZhciBtZXNzYWdlID0gJygnICsgKHBhdGggfHwgJ3Vua25vd24gcGF0aCcpICsgJyknO1xuXG5cdCAgICAgICAgLy8gb25seSBzaG93IGxpbmVubyArIGNvbG5vIG5leHQgdG8gcGF0aCBvZiB0ZW1wbGF0ZVxuXHQgICAgICAgIC8vIHdoZXJlIGVycm9yIG9jY3VycmVkXG5cdCAgICAgICAgaWYgKHRoaXMuZmlyc3RVcGRhdGUpIHtcblx0ICAgICAgICAgICAgaWYodGhpcy5saW5lbm8gJiYgdGhpcy5jb2xubykge1xuXHQgICAgICAgICAgICAgICAgbWVzc2FnZSArPSAnIFtMaW5lICcgKyB0aGlzLmxpbmVubyArICcsIENvbHVtbiAnICsgdGhpcy5jb2xubyArICddJztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKHRoaXMubGluZW5vKSB7XG5cdCAgICAgICAgICAgICAgICBtZXNzYWdlICs9ICcgW0xpbmUgJyArIHRoaXMubGluZW5vICsgJ10nO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgbWVzc2FnZSArPSAnXFxuICc7XG5cdCAgICAgICAgaWYgKHRoaXMuZmlyc3RVcGRhdGUpIHtcblx0ICAgICAgICAgICAgbWVzc2FnZSArPSAnICc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSArICh0aGlzLm1lc3NhZ2UgfHwgJycpO1xuXHQgICAgICAgIHRoaXMuZmlyc3RVcGRhdGUgPSBmYWxzZTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH07XG5cblx0ICAgIHJldHVybiBlcnI7XG5cdH07XG5cblx0ZXhwb3J0cy5UZW1wbGF0ZUVycm9yLnByb3RvdHlwZSA9IEVycm9yLnByb3RvdHlwZTtcblxuXHRleHBvcnRzLmVzY2FwZSA9IGZ1bmN0aW9uKHZhbCkge1xuXHQgIHJldHVybiB2YWwucmVwbGFjZShlc2NhcGVSZWdleCwgbG9va3VwRXNjYXBlKTtcblx0fTtcblxuXHRleHBvcnRzLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cdH07XG5cblx0ZXhwb3J0cy5pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG5cdH07XG5cblx0ZXhwb3J0cy5pc1N0cmluZyA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgU3RyaW5nXSc7XG5cdH07XG5cblx0ZXhwb3J0cy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cdH07XG5cblx0ZXhwb3J0cy5ncm91cEJ5ID0gZnVuY3Rpb24ob2JqLCB2YWwpIHtcblx0ICAgIHZhciByZXN1bHQgPSB7fTtcblx0ICAgIHZhciBpdGVyYXRvciA9IGV4cG9ydHMuaXNGdW5jdGlvbih2YWwpID8gdmFsIDogZnVuY3Rpb24ob2JqKSB7IHJldHVybiBvYmpbdmFsXTsgfTtcblx0ICAgIGZvcih2YXIgaT0wOyBpPG9iai5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgIHZhciB2YWx1ZSA9IG9ialtpXTtcblx0ICAgICAgICB2YXIga2V5ID0gaXRlcmF0b3IodmFsdWUsIGkpO1xuXHQgICAgICAgIChyZXN1bHRba2V5XSB8fCAocmVzdWx0W2tleV0gPSBbXSkpLnB1c2godmFsdWUpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHJlc3VsdDtcblx0fTtcblxuXHRleHBvcnRzLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChvYmopO1xuXHR9O1xuXG5cdGV4cG9ydHMud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG5cdCAgICB2YXIgcmVzdWx0ID0gW107XG5cdCAgICBpZiAoIWFycmF5KSB7XG5cdCAgICAgICAgcmV0dXJuIHJlc3VsdDtcblx0ICAgIH1cblx0ICAgIHZhciBpbmRleCA9IC0xLFxuXHQgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuXHQgICAgY29udGFpbnMgPSBleHBvcnRzLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcblxuXHQgICAgd2hpbGUoKytpbmRleCA8IGxlbmd0aCkge1xuXHQgICAgICAgIGlmKGV4cG9ydHMuaW5kZXhPZihjb250YWlucywgYXJyYXlbaW5kZXhdKSA9PT0gLTEpIHtcblx0ICAgICAgICAgICAgcmVzdWx0LnB1c2goYXJyYXlbaW5kZXhdKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gcmVzdWx0O1xuXHR9O1xuXG5cdGV4cG9ydHMuZXh0ZW5kID0gZnVuY3Rpb24ob2JqLCBvYmoyKSB7XG5cdCAgICBmb3IodmFyIGsgaW4gb2JqMikge1xuXHQgICAgICAgIG9ialtrXSA9IG9iajJba107XG5cdCAgICB9XG5cdCAgICByZXR1cm4gb2JqO1xuXHR9O1xuXG5cdGV4cG9ydHMucmVwZWF0ID0gZnVuY3Rpb24oY2hhcl8sIG4pIHtcblx0ICAgIHZhciBzdHIgPSAnJztcblx0ICAgIGZvcih2YXIgaT0wOyBpPG47IGkrKykge1xuXHQgICAgICAgIHN0ciArPSBjaGFyXztcblx0ICAgIH1cblx0ICAgIHJldHVybiBzdHI7XG5cdH07XG5cblx0ZXhwb3J0cy5lYWNoID0gZnVuY3Rpb24ob2JqLCBmdW5jLCBjb250ZXh0KSB7XG5cdCAgICBpZihvYmogPT0gbnVsbCkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgaWYoQXJyYXlQcm90by5lYWNoICYmIG9iai5lYWNoID09PSBBcnJheVByb3RvLmVhY2gpIHtcblx0ICAgICAgICBvYmouZm9yRWFjaChmdW5jLCBjb250ZXh0KTtcblx0ICAgIH1cblx0ICAgIGVsc2UgaWYob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcblx0ICAgICAgICBmb3IodmFyIGk9MCwgbD1vYmoubGVuZ3RoOyBpPGw7IGkrKykge1xuXHQgICAgICAgICAgICBmdW5jLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0fTtcblxuXHRleHBvcnRzLm1hcCA9IGZ1bmN0aW9uKG9iaiwgZnVuYykge1xuXHQgICAgdmFyIHJlc3VsdHMgPSBbXTtcblx0ICAgIGlmKG9iaiA9PSBudWxsKSB7XG5cdCAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG5cdCAgICB9XG5cblx0ICAgIGlmKEFycmF5UHJvdG8ubWFwICYmIG9iai5tYXAgPT09IEFycmF5UHJvdG8ubWFwKSB7XG5cdCAgICAgICAgcmV0dXJuIG9iai5tYXAoZnVuYyk7XG5cdCAgICB9XG5cblx0ICAgIGZvcih2YXIgaT0wOyBpPG9iai5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgIHJlc3VsdHNbcmVzdWx0cy5sZW5ndGhdID0gZnVuYyhvYmpbaV0sIGkpO1xuXHQgICAgfVxuXG5cdCAgICBpZihvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuXHQgICAgICAgIHJlc3VsdHMubGVuZ3RoID0gb2JqLmxlbmd0aDtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHJlc3VsdHM7XG5cdH07XG5cblx0ZXhwb3J0cy5hc3luY0l0ZXIgPSBmdW5jdGlvbihhcnIsIGl0ZXIsIGNiKSB7XG5cdCAgICB2YXIgaSA9IC0xO1xuXG5cdCAgICBmdW5jdGlvbiBuZXh0KCkge1xuXHQgICAgICAgIGkrKztcblxuXHQgICAgICAgIGlmKGkgPCBhcnIubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIGl0ZXIoYXJyW2ldLCBpLCBuZXh0LCBjYik7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBjYigpO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgbmV4dCgpO1xuXHR9O1xuXG5cdGV4cG9ydHMuYXN5bmNGb3IgPSBmdW5jdGlvbihvYmosIGl0ZXIsIGNiKSB7XG5cdCAgICB2YXIga2V5cyA9IGV4cG9ydHMua2V5cyhvYmopO1xuXHQgICAgdmFyIGxlbiA9IGtleXMubGVuZ3RoO1xuXHQgICAgdmFyIGkgPSAtMTtcblxuXHQgICAgZnVuY3Rpb24gbmV4dCgpIHtcblx0ICAgICAgICBpKys7XG5cdCAgICAgICAgdmFyIGsgPSBrZXlzW2ldO1xuXG5cdCAgICAgICAgaWYoaSA8IGxlbikge1xuXHQgICAgICAgICAgICBpdGVyKGssIG9ialtrXSwgaSwgbGVuLCBuZXh0KTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGNiKCk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBuZXh0KCk7XG5cdH07XG5cblx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvaW5kZXhPZiNQb2x5ZmlsbFxuXHRleHBvcnRzLmluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA/XG5cdCAgICBmdW5jdGlvbiAoYXJyLCBzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcblx0ICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCk7XG5cdCAgICB9IDpcblx0ICAgIGZ1bmN0aW9uIChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuXHQgICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCA+Pj4gMDsgLy8gSGFjayB0byBjb252ZXJ0IG9iamVjdC5sZW5ndGggdG8gYSBVSW50MzJcblxuXHQgICAgICAgIGZyb21JbmRleCA9ICtmcm9tSW5kZXggfHwgMDtcblxuXHQgICAgICAgIGlmKE1hdGguYWJzKGZyb21JbmRleCkgPT09IEluZmluaXR5KSB7XG5cdCAgICAgICAgICAgIGZyb21JbmRleCA9IDA7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYoZnJvbUluZGV4IDwgMCkge1xuXHQgICAgICAgICAgICBmcm9tSW5kZXggKz0gbGVuZ3RoO1xuXHQgICAgICAgICAgICBpZiAoZnJvbUluZGV4IDwgMCkge1xuXHQgICAgICAgICAgICAgICAgZnJvbUluZGV4ID0gMDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZvcig7ZnJvbUluZGV4IDwgbGVuZ3RoOyBmcm9tSW5kZXgrKykge1xuXHQgICAgICAgICAgICBpZiAoYXJyW2Zyb21JbmRleF0gPT09IHNlYXJjaEVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmcm9tSW5kZXg7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gLTE7XG5cdCAgICB9O1xuXG5cdGlmKCFBcnJheS5wcm90b3R5cGUubWFwKSB7XG5cdCAgICBBcnJheS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYXAgaXMgdW5pbXBsZW1lbnRlZCBmb3IgdGhpcyBqcyBlbmdpbmUnKTtcblx0ICAgIH07XG5cdH1cblxuXHRleHBvcnRzLmtleXMgPSBmdW5jdGlvbihvYmopIHtcblx0ICAgIGlmKE9iamVjdC5wcm90b3R5cGUua2V5cykge1xuXHQgICAgICAgIHJldHVybiBvYmoua2V5cygpO1xuXHQgICAgfVxuXHQgICAgZWxzZSB7XG5cdCAgICAgICAgdmFyIGtleXMgPSBbXTtcblx0ICAgICAgICBmb3IodmFyIGsgaW4gb2JqKSB7XG5cdCAgICAgICAgICAgIGlmKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHQgICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBrZXlzO1xuXHQgICAgfVxuXHR9O1xuXG5cdGV4cG9ydHMuaW5PcGVyYXRvciA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuXHQgICAgaWYgKGV4cG9ydHMuaXNBcnJheSh2YWwpKSB7XG5cdCAgICAgICAgcmV0dXJuIGV4cG9ydHMuaW5kZXhPZih2YWwsIGtleSkgIT09IC0xO1xuXHQgICAgfSBlbHNlIGlmIChleHBvcnRzLmlzT2JqZWN0KHZhbCkpIHtcblx0ICAgICAgICByZXR1cm4ga2V5IGluIHZhbDtcblx0ICAgIH0gZWxzZSBpZiAoZXhwb3J0cy5pc1N0cmluZyh2YWwpKSB7XG5cdCAgICAgICAgcmV0dXJuIHZhbC5pbmRleE9mKGtleSkgIT09IC0xO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB1c2UgXCJpblwiIG9wZXJhdG9yIHRvIHNlYXJjaCBmb3IgXCInXG5cdCAgICAgICAgICAgICsga2V5ICsgJ1wiIGluIHVuZXhwZWN0ZWQgdHlwZXMuJyk7XG5cdCAgICB9XG5cdH07XG5cblxuLyoqKi8gfSksXG4vKiAyICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBwYXRoID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIGFzYXAgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDQpO1xuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblx0dmFyIE9iaiA9IF9fd2VicGFja19yZXF1aXJlX18oNik7XG5cdHZhciBjb21waWxlciA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cdHZhciBidWlsdGluX2ZpbHRlcnMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDcpO1xuXHR2YXIgYnVpbHRpbl9sb2FkZXJzID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblx0dmFyIHJ1bnRpbWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDgpO1xuXHR2YXIgZ2xvYmFscyA9IF9fd2VicGFja19yZXF1aXJlX18oOSk7XG5cdHZhciB3YXRlcmZhbGwgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEwKTtcblx0dmFyIEZyYW1lID0gcnVudGltZS5GcmFtZTtcblx0dmFyIFRlbXBsYXRlO1xuXG5cdC8vIFVuY29uZGl0aW9uYWxseSBsb2FkIGluIHRoaXMgbG9hZGVyLCBldmVuIGlmIG5vIG90aGVyIG9uZXMgYXJlXG5cdC8vIGluY2x1ZGVkIChwb3NzaWJsZSBpbiB0aGUgc2xpbSBicm93c2VyIGJ1aWxkKVxuXHRidWlsdGluX2xvYWRlcnMuUHJlY29tcGlsZWRMb2FkZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDE0KTtcblxuXHQvLyBJZiB0aGUgdXNlciBpcyB1c2luZyB0aGUgYXN5bmMgQVBJLCAqYWx3YXlzKiBjYWxsIGl0XG5cdC8vIGFzeW5jaHJvbm91c2x5IGV2ZW4gaWYgdGhlIHRlbXBsYXRlIHdhcyBzeW5jaHJvbm91cy5cblx0ZnVuY3Rpb24gY2FsbGJhY2tBc2FwKGNiLCBlcnIsIHJlcykge1xuXHQgICAgYXNhcChmdW5jdGlvbigpIHsgY2IoZXJyLCByZXMpOyB9KTtcblx0fVxuXG5cdHZhciBFbnZpcm9ubWVudCA9IE9iai5leHRlbmQoe1xuXHQgICAgaW5pdDogZnVuY3Rpb24obG9hZGVycywgb3B0cykge1xuXHQgICAgICAgIC8vIFRoZSBkZXYgZmxhZyBkZXRlcm1pbmVzIHRoZSB0cmFjZSB0aGF0J2xsIGJlIHNob3duIG9uIGVycm9ycy5cblx0ICAgICAgICAvLyBJZiBzZXQgdG8gdHJ1ZSwgcmV0dXJucyB0aGUgZnVsbCB0cmFjZSBmcm9tIHRoZSBlcnJvciBwb2ludCxcblx0ICAgICAgICAvLyBvdGhlcndpc2Ugd2lsbCByZXR1cm4gdHJhY2Ugc3RhcnRpbmcgZnJvbSBUZW1wbGF0ZS5yZW5kZXJcblx0ICAgICAgICAvLyAodGhlIGZ1bGwgdHJhY2UgZnJvbSB3aXRoaW4gbnVuanVja3MgbWF5IGNvbmZ1c2UgZGV2ZWxvcGVycyB1c2luZ1xuXHQgICAgICAgIC8vICB0aGUgbGlicmFyeSlcblx0ICAgICAgICAvLyBkZWZhdWx0cyB0byBmYWxzZVxuXHQgICAgICAgIG9wdHMgPSB0aGlzLm9wdHMgPSBvcHRzIHx8IHt9O1xuXHQgICAgICAgIHRoaXMub3B0cy5kZXYgPSAhIW9wdHMuZGV2O1xuXG5cdCAgICAgICAgLy8gVGhlIGF1dG9lc2NhcGUgZmxhZyBzZXRzIGdsb2JhbCBhdXRvZXNjYXBpbmcuIElmIHRydWUsXG5cdCAgICAgICAgLy8gZXZlcnkgc3RyaW5nIHZhcmlhYmxlIHdpbGwgYmUgZXNjYXBlZCBieSBkZWZhdWx0LlxuXHQgICAgICAgIC8vIElmIGZhbHNlLCBzdHJpbmdzIGNhbiBiZSBtYW51YWxseSBlc2NhcGVkIHVzaW5nIHRoZSBgZXNjYXBlYCBmaWx0ZXIuXG5cdCAgICAgICAgLy8gZGVmYXVsdHMgdG8gdHJ1ZVxuXHQgICAgICAgIHRoaXMub3B0cy5hdXRvZXNjYXBlID0gb3B0cy5hdXRvZXNjYXBlICE9IG51bGwgPyBvcHRzLmF1dG9lc2NhcGUgOiB0cnVlO1xuXG5cdCAgICAgICAgLy8gSWYgdHJ1ZSwgdGhpcyB3aWxsIG1ha2UgdGhlIHN5c3RlbSB0aHJvdyBlcnJvcnMgaWYgdHJ5aW5nXG5cdCAgICAgICAgLy8gdG8gb3V0cHV0IGEgbnVsbCBvciB1bmRlZmluZWQgdmFsdWVcblx0ICAgICAgICB0aGlzLm9wdHMudGhyb3dPblVuZGVmaW5lZCA9ICEhb3B0cy50aHJvd09uVW5kZWZpbmVkO1xuXHQgICAgICAgIHRoaXMub3B0cy50cmltQmxvY2tzID0gISFvcHRzLnRyaW1CbG9ja3M7XG5cdCAgICAgICAgdGhpcy5vcHRzLmxzdHJpcEJsb2NrcyA9ICEhb3B0cy5sc3RyaXBCbG9ja3M7XG5cblx0ICAgICAgICB0aGlzLmxvYWRlcnMgPSBbXTtcblxuXHQgICAgICAgIGlmKCFsb2FkZXJzKSB7XG5cdCAgICAgICAgICAgIC8vIFRoZSBmaWxlc3lzdGVtIGxvYWRlciBpcyBvbmx5IGF2YWlsYWJsZSBzZXJ2ZXItc2lkZVxuXHQgICAgICAgICAgICBpZihidWlsdGluX2xvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcikge1xuXHQgICAgICAgICAgICAgICAgdGhpcy5sb2FkZXJzID0gW25ldyBidWlsdGluX2xvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcigndmlld3MnKV07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSBpZihidWlsdGluX2xvYWRlcnMuV2ViTG9hZGVyKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBbbmV3IGJ1aWx0aW5fbG9hZGVycy5XZWJMb2FkZXIoJy92aWV3cycpXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdGhpcy5sb2FkZXJzID0gbGliLmlzQXJyYXkobG9hZGVycykgPyBsb2FkZXJzIDogW2xvYWRlcnNdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIEl0J3MgZWFzeSB0byB1c2UgcHJlY29tcGlsZWQgdGVtcGxhdGVzOiBqdXN0IGluY2x1ZGUgdGhlbVxuXHQgICAgICAgIC8vIGJlZm9yZSB5b3UgY29uZmlndXJlIG51bmp1Y2tzIGFuZCB0aGlzIHdpbGwgYXV0b21hdGljYWxseVxuXHQgICAgICAgIC8vIHBpY2sgaXQgdXAgYW5kIHVzZSBpdFxuXHQgICAgICAgIGlmKCh0cnVlKSAmJiB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCkge1xuXHQgICAgICAgICAgICB0aGlzLmxvYWRlcnMudW5zaGlmdChcblx0ICAgICAgICAgICAgICAgIG5ldyBidWlsdGluX2xvYWRlcnMuUHJlY29tcGlsZWRMb2FkZXIod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQpXG5cdCAgICAgICAgICAgICk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdGhpcy5pbml0Q2FjaGUoKTtcblxuXHQgICAgICAgIHRoaXMuZ2xvYmFscyA9IGdsb2JhbHMoKTtcblx0ICAgICAgICB0aGlzLmZpbHRlcnMgPSB7fTtcblx0ICAgICAgICB0aGlzLmFzeW5jRmlsdGVycyA9IFtdO1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9ucyA9IHt9O1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9uc0xpc3QgPSBbXTtcblxuXHQgICAgICAgIGZvcih2YXIgbmFtZSBpbiBidWlsdGluX2ZpbHRlcnMpIHtcblx0ICAgICAgICAgICAgdGhpcy5hZGRGaWx0ZXIobmFtZSwgYnVpbHRpbl9maWx0ZXJzW25hbWVdKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBpbml0Q2FjaGU6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIC8vIENhY2hpbmcgYW5kIGNhY2hlIGJ1c3Rpbmdcblx0ICAgICAgICBsaWIuZWFjaCh0aGlzLmxvYWRlcnMsIGZ1bmN0aW9uKGxvYWRlcikge1xuXHQgICAgICAgICAgICBsb2FkZXIuY2FjaGUgPSB7fTtcblxuXHQgICAgICAgICAgICBpZih0eXBlb2YgbG9hZGVyLm9uID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgICAgICBsb2FkZXIub24oJ3VwZGF0ZScsIGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbG9hZGVyLmNhY2hlW3RlbXBsYXRlXSA9IG51bGw7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXHQgICAgfSxcblxuXHQgICAgYWRkRXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lLCBleHRlbnNpb24pIHtcblx0ICAgICAgICBleHRlbnNpb24uX25hbWUgPSBuYW1lO1xuXHQgICAgICAgIHRoaXMuZXh0ZW5zaW9uc1tuYW1lXSA9IGV4dGVuc2lvbjtcblx0ICAgICAgICB0aGlzLmV4dGVuc2lvbnNMaXN0LnB1c2goZXh0ZW5zaW9uKTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIHJlbW92ZUV4dGVuc2lvbjogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHZhciBleHRlbnNpb24gPSB0aGlzLmdldEV4dGVuc2lvbihuYW1lKTtcblx0ICAgICAgICBpZiAoIWV4dGVuc2lvbikgcmV0dXJuO1xuXG5cdCAgICAgICAgdGhpcy5leHRlbnNpb25zTGlzdCA9IGxpYi53aXRob3V0KHRoaXMuZXh0ZW5zaW9uc0xpc3QsIGV4dGVuc2lvbik7XG5cdCAgICAgICAgZGVsZXRlIHRoaXMuZXh0ZW5zaW9uc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGdldEV4dGVuc2lvbjogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLmV4dGVuc2lvbnNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICBoYXNFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICByZXR1cm4gISF0aGlzLmV4dGVuc2lvbnNbbmFtZV07XG5cdCAgICB9LFxuXG5cdCAgICBhZGRHbG9iYWw6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG5cdCAgICAgICAgdGhpcy5nbG9iYWxzW25hbWVdID0gdmFsdWU7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICBnZXRHbG9iYWw6IGZ1bmN0aW9uKG5hbWUpIHtcblx0ICAgICAgICBpZih0eXBlb2YgdGhpcy5nbG9iYWxzW25hbWVdID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2dsb2JhbCBub3QgZm91bmQ6ICcgKyBuYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuZ2xvYmFsc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIGFkZEZpbHRlcjogZnVuY3Rpb24obmFtZSwgZnVuYywgYXN5bmMpIHtcblx0ICAgICAgICB2YXIgd3JhcHBlZCA9IGZ1bmM7XG5cblx0ICAgICAgICBpZihhc3luYykge1xuXHQgICAgICAgICAgICB0aGlzLmFzeW5jRmlsdGVycy5wdXNoKG5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICB0aGlzLmZpbHRlcnNbbmFtZV0gPSB3cmFwcGVkO1xuXHQgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0RmlsdGVyOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgaWYoIXRoaXMuZmlsdGVyc1tuYW1lXSkge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZpbHRlciBub3QgZm91bmQ6ICcgKyBuYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1tuYW1lXTtcblx0ICAgIH0sXG5cblx0ICAgIHJlc29sdmVUZW1wbGF0ZTogZnVuY3Rpb24obG9hZGVyLCBwYXJlbnROYW1lLCBmaWxlbmFtZSkge1xuXHQgICAgICAgIHZhciBpc1JlbGF0aXZlID0gKGxvYWRlci5pc1JlbGF0aXZlICYmIHBhcmVudE5hbWUpPyBsb2FkZXIuaXNSZWxhdGl2ZShmaWxlbmFtZSkgOiBmYWxzZTtcblx0ICAgICAgICByZXR1cm4gKGlzUmVsYXRpdmUgJiYgbG9hZGVyLnJlc29sdmUpPyBsb2FkZXIucmVzb2x2ZShwYXJlbnROYW1lLCBmaWxlbmFtZSkgOiBmaWxlbmFtZTtcblx0ICAgIH0sXG5cblx0ICAgIGdldFRlbXBsYXRlOiBmdW5jdGlvbihuYW1lLCBlYWdlckNvbXBpbGUsIHBhcmVudE5hbWUsIGlnbm9yZU1pc3NpbmcsIGNiKSB7XG5cdCAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXHQgICAgICAgIHZhciB0bXBsID0gbnVsbDtcblx0ICAgICAgICBpZihuYW1lICYmIG5hbWUucmF3KSB7XG5cdCAgICAgICAgICAgIC8vIHRoaXMgZml4ZXMgYXV0b2VzY2FwZSBmb3IgdGVtcGxhdGVzIHJlZmVyZW5jZWQgaW4gc3ltYm9sc1xuXHQgICAgICAgICAgICBuYW1lID0gbmFtZS5yYXc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYobGliLmlzRnVuY3Rpb24ocGFyZW50TmFtZSkpIHtcblx0ICAgICAgICAgICAgY2IgPSBwYXJlbnROYW1lO1xuXHQgICAgICAgICAgICBwYXJlbnROYW1lID0gbnVsbDtcblx0ICAgICAgICAgICAgZWFnZXJDb21waWxlID0gZWFnZXJDb21waWxlIHx8IGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKGVhZ2VyQ29tcGlsZSkpIHtcblx0ICAgICAgICAgICAgY2IgPSBlYWdlckNvbXBpbGU7XG5cdCAgICAgICAgICAgIGVhZ2VyQ29tcGlsZSA9IGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChuYW1lIGluc3RhbmNlb2YgVGVtcGxhdGUpIHtcblx0ICAgICAgICAgICAgIHRtcGwgPSBuYW1lO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RlbXBsYXRlIG5hbWVzIG11c3QgYmUgYSBzdHJpbmc6ICcgKyBuYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sb2FkZXJzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgX25hbWUgPSB0aGlzLnJlc29sdmVUZW1wbGF0ZSh0aGlzLmxvYWRlcnNbaV0sIHBhcmVudE5hbWUsIG5hbWUpO1xuXHQgICAgICAgICAgICAgICAgdG1wbCA9IHRoaXMubG9hZGVyc1tpXS5jYWNoZVtfbmFtZV07XG5cdCAgICAgICAgICAgICAgICBpZiAodG1wbCkgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZih0bXBsKSB7XG5cdCAgICAgICAgICAgIGlmKGVhZ2VyQ29tcGlsZSkge1xuXHQgICAgICAgICAgICAgICAgdG1wbC5jb21waWxlKCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZihjYikge1xuXHQgICAgICAgICAgICAgICAgY2IobnVsbCwgdG1wbCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdG1wbDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBzeW5jUmVzdWx0O1xuXHQgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdCAgICAgICAgICAgIHZhciBjcmVhdGVUZW1wbGF0ZSA9IGZ1bmN0aW9uKGVyciwgaW5mbykge1xuXHQgICAgICAgICAgICAgICAgaWYoIWluZm8gJiYgIWVycikge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKCFpZ25vcmVNaXNzaW5nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVyciA9IG5ldyBFcnJvcigndGVtcGxhdGUgbm90IGZvdW5kOiAnICsgbmFtZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoY2IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2IoZXJyKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgdG1wbDtcblx0ICAgICAgICAgICAgICAgICAgICBpZihpbmZvKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRtcGwgPSBuZXcgVGVtcGxhdGUoaW5mby5zcmMsIF90aGlzLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucGF0aCwgZWFnZXJDb21waWxlKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZighaW5mby5ub0NhY2hlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmxvYWRlci5jYWNoZVtuYW1lXSA9IHRtcGw7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRtcGwgPSBuZXcgVGVtcGxhdGUoJycsIF90aGlzLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcnLCBlYWdlckNvbXBpbGUpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIGlmKGNiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNiKG51bGwsIHRtcGwpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHRtcGw7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgIGxpYi5hc3luY0l0ZXIodGhpcy5sb2FkZXJzLCBmdW5jdGlvbihsb2FkZXIsIGksIG5leHQsIGRvbmUpIHtcblx0ICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZShlcnIsIHNyYykge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmKGVycikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBkb25lKGVycik7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYoc3JjKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNyYy5sb2FkZXIgPSBsb2FkZXI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUobnVsbCwgc3JjKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIG5leHQoKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8vIFJlc29sdmUgbmFtZSByZWxhdGl2ZSB0byBwYXJlbnROYW1lXG5cdCAgICAgICAgICAgICAgICBuYW1lID0gdGhhdC5yZXNvbHZlVGVtcGxhdGUobG9hZGVyLCBwYXJlbnROYW1lLCBuYW1lKTtcblxuXHQgICAgICAgICAgICAgICAgaWYobG9hZGVyLmFzeW5jKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbG9hZGVyLmdldFNvdXJjZShuYW1lLCBoYW5kbGUpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaGFuZGxlKG51bGwsIGxvYWRlci5nZXRTb3VyY2UobmFtZSkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9LCBjcmVhdGVUZW1wbGF0ZSk7XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHN5bmNSZXN1bHQ7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgZXhwcmVzczogZnVuY3Rpb24oYXBwKSB7XG5cdCAgICAgICAgdmFyIGVudiA9IHRoaXM7XG5cblx0ICAgICAgICBmdW5jdGlvbiBOdW5qdWNrc1ZpZXcobmFtZSwgb3B0cykge1xuXHQgICAgICAgICAgICB0aGlzLm5hbWUgICAgICAgICAgPSBuYW1lO1xuXHQgICAgICAgICAgICB0aGlzLnBhdGggICAgICAgICAgPSBuYW1lO1xuXHQgICAgICAgICAgICB0aGlzLmRlZmF1bHRFbmdpbmUgPSBvcHRzLmRlZmF1bHRFbmdpbmU7XG5cdCAgICAgICAgICAgIHRoaXMuZXh0ICAgICAgICAgICA9IHBhdGguZXh0bmFtZShuYW1lKTtcblx0ICAgICAgICAgICAgaWYgKCF0aGlzLmV4dCAmJiAhdGhpcy5kZWZhdWx0RW5naW5lKSB0aHJvdyBuZXcgRXJyb3IoJ05vIGRlZmF1bHQgZW5naW5lIHdhcyBzcGVjaWZpZWQgYW5kIG5vIGV4dGVuc2lvbiB3YXMgcHJvdmlkZWQuJyk7XG5cdCAgICAgICAgICAgIGlmICghdGhpcy5leHQpIHRoaXMubmFtZSArPSAodGhpcy5leHQgPSAoJy4nICE9PSB0aGlzLmRlZmF1bHRFbmdpbmVbMF0gPyAnLicgOiAnJykgKyB0aGlzLmRlZmF1bHRFbmdpbmUpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIE51bmp1Y2tzVmlldy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24ob3B0cywgY2IpIHtcblx0ICAgICAgICAgIGVudi5yZW5kZXIodGhpcy5uYW1lLCBvcHRzLCBjYik7XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIGFwcC5zZXQoJ3ZpZXcnLCBOdW5qdWNrc1ZpZXcpO1xuXHQgICAgICAgIGFwcC5zZXQoJ251bmp1Y2tzRW52JywgdGhpcyk7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9LFxuXG5cdCAgICByZW5kZXI6IGZ1bmN0aW9uKG5hbWUsIGN0eCwgY2IpIHtcblx0ICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihjdHgpKSB7XG5cdCAgICAgICAgICAgIGNiID0gY3R4O1xuXHQgICAgICAgICAgICBjdHggPSBudWxsO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIFdlIHN1cHBvcnQgYSBzeW5jaHJvbm91cyBBUEkgdG8gbWFrZSBpdCBlYXNpZXIgdG8gbWlncmF0ZVxuXHQgICAgICAgIC8vIGV4aXN0aW5nIGNvZGUgdG8gYXN5bmMuIFRoaXMgd29ya3MgYmVjYXVzZSBpZiB5b3UgZG9uJ3QgZG9cblx0ICAgICAgICAvLyBhbnl0aGluZyBhc3luYyB3b3JrLCB0aGUgd2hvbGUgdGhpbmcgaXMgYWN0dWFsbHkgcnVuXG5cdCAgICAgICAgLy8gc3luY2hyb25vdXNseS5cblx0ICAgICAgICB2YXIgc3luY1Jlc3VsdCA9IG51bGw7XG5cblx0ICAgICAgICB0aGlzLmdldFRlbXBsYXRlKG5hbWUsIGZ1bmN0aW9uKGVyciwgdG1wbCkge1xuXHQgICAgICAgICAgICBpZihlcnIgJiYgY2IpIHtcblx0ICAgICAgICAgICAgICAgIGNhbGxiYWNrQXNhcChjYiwgZXJyKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIGlmKGVycikge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHRtcGwucmVuZGVyKGN0eCwgY2IpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcblx0ICAgIH0sXG5cblx0ICAgIHJlbmRlclN0cmluZzogZnVuY3Rpb24oc3JjLCBjdHgsIG9wdHMsIGNiKSB7XG5cdCAgICAgICAgaWYobGliLmlzRnVuY3Rpb24ob3B0cykpIHtcblx0ICAgICAgICAgICAgY2IgPSBvcHRzO1xuXHQgICAgICAgICAgICBvcHRzID0ge307XG5cdCAgICAgICAgfVxuXHQgICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG5cdCAgICAgICAgdmFyIHRtcGwgPSBuZXcgVGVtcGxhdGUoc3JjLCB0aGlzLCBvcHRzLnBhdGgpO1xuXHQgICAgICAgIHJldHVybiB0bXBsLnJlbmRlcihjdHgsIGNiKTtcblx0ICAgIH0sXG5cblx0ICAgIHdhdGVyZmFsbDogd2F0ZXJmYWxsXG5cdH0pO1xuXG5cdHZhciBDb250ZXh0ID0gT2JqLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbihjdHgsIGJsb2NrcywgZW52KSB7XG5cdCAgICAgICAgLy8gSGFzIHRvIGJlIHRpZWQgdG8gYW4gZW52aXJvbm1lbnQgc28gd2UgY2FuIHRhcCBpbnRvIGl0cyBnbG9iYWxzLlxuXHQgICAgICAgIHRoaXMuZW52ID0gZW52IHx8IG5ldyBFbnZpcm9ubWVudCgpO1xuXG5cdCAgICAgICAgLy8gTWFrZSBhIGR1cGxpY2F0ZSBvZiBjdHhcblx0ICAgICAgICB0aGlzLmN0eCA9IHt9O1xuXHQgICAgICAgIGZvcih2YXIgayBpbiBjdHgpIHtcblx0ICAgICAgICAgICAgaWYoY3R4Lmhhc093blByb3BlcnR5KGspKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzLmN0eFtrXSA9IGN0eFtrXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMuYmxvY2tzID0ge307XG5cdCAgICAgICAgdGhpcy5leHBvcnRlZCA9IFtdO1xuXG5cdCAgICAgICAgZm9yKHZhciBuYW1lIGluIGJsb2Nrcykge1xuXHQgICAgICAgICAgICB0aGlzLmFkZEJsb2NrKG5hbWUsIGJsb2Nrc1tuYW1lXSk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgbG9va3VwOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgLy8gVGhpcyBpcyBvbmUgb2YgdGhlIG1vc3QgY2FsbGVkIGZ1bmN0aW9ucywgc28gb3B0aW1pemUgZm9yXG5cdCAgICAgICAgLy8gdGhlIHR5cGljYWwgY2FzZSB3aGVyZSB0aGUgbmFtZSBpc24ndCBpbiB0aGUgZ2xvYmFsc1xuXHQgICAgICAgIGlmKG5hbWUgaW4gdGhpcy5lbnYuZ2xvYmFscyAmJiAhKG5hbWUgaW4gdGhpcy5jdHgpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLmVudi5nbG9iYWxzW25hbWVdO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3R4W25hbWVdO1xuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblx0ICAgIHNldFZhcmlhYmxlOiBmdW5jdGlvbihuYW1lLCB2YWwpIHtcblx0ICAgICAgICB0aGlzLmN0eFtuYW1lXSA9IHZhbDtcblx0ICAgIH0sXG5cblx0ICAgIGdldFZhcmlhYmxlczogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMuY3R4O1xuXHQgICAgfSxcblxuXHQgICAgYWRkQmxvY2s6IGZ1bmN0aW9uKG5hbWUsIGJsb2NrKSB7XG5cdCAgICAgICAgdGhpcy5ibG9ja3NbbmFtZV0gPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXTtcblx0ICAgICAgICB0aGlzLmJsb2Nrc1tuYW1lXS5wdXNoKGJsb2NrKTtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cblx0ICAgIGdldEJsb2NrOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgaWYoIXRoaXMuYmxvY2tzW25hbWVdKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndW5rbm93biBibG9jayBcIicgKyBuYW1lICsgJ1wiJyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tzW25hbWVdWzBdO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0U3VwZXI6IGZ1bmN0aW9uKGVudiwgbmFtZSwgYmxvY2ssIGZyYW1lLCBydW50aW1lLCBjYikge1xuXHQgICAgICAgIHZhciBpZHggPSBsaWIuaW5kZXhPZih0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXSwgYmxvY2spO1xuXHQgICAgICAgIHZhciBibGsgPSB0aGlzLmJsb2Nrc1tuYW1lXVtpZHggKyAxXTtcblx0ICAgICAgICB2YXIgY29udGV4dCA9IHRoaXM7XG5cblx0ICAgICAgICBpZihpZHggPT09IC0xIHx8ICFibGspIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBzdXBlciBibG9jayBhdmFpbGFibGUgZm9yIFwiJyArIG5hbWUgKyAnXCInKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBibGsoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xuXHQgICAgfSxcblxuXHQgICAgYWRkRXhwb3J0OiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgdGhpcy5leHBvcnRlZC5wdXNoKG5hbWUpO1xuXHQgICAgfSxcblxuXHQgICAgZ2V0RXhwb3J0ZWQ6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciBleHBvcnRlZCA9IHt9O1xuXHQgICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMuZXhwb3J0ZWQubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgdmFyIG5hbWUgPSB0aGlzLmV4cG9ydGVkW2ldO1xuXHQgICAgICAgICAgICBleHBvcnRlZFtuYW1lXSA9IHRoaXMuY3R4W25hbWVdO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gZXhwb3J0ZWQ7XG5cdCAgICB9XG5cdH0pO1xuXG5cdFRlbXBsYXRlID0gT2JqLmV4dGVuZCh7XG5cdCAgICBpbml0OiBmdW5jdGlvbiAoc3JjLCBlbnYsIHBhdGgsIGVhZ2VyQ29tcGlsZSkge1xuXHQgICAgICAgIHRoaXMuZW52ID0gZW52IHx8IG5ldyBFbnZpcm9ubWVudCgpO1xuXG5cdCAgICAgICAgaWYobGliLmlzT2JqZWN0KHNyYykpIHtcblx0ICAgICAgICAgICAgc3dpdGNoKHNyYy50eXBlKSB7XG5cdCAgICAgICAgICAgIGNhc2UgJ2NvZGUnOiB0aGlzLnRtcGxQcm9wcyA9IHNyYy5vYmo7IGJyZWFrO1xuXHQgICAgICAgICAgICBjYXNlICdzdHJpbmcnOiB0aGlzLnRtcGxTdHIgPSBzcmMub2JqOyBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKGxpYi5pc1N0cmluZyhzcmMpKSB7XG5cdCAgICAgICAgICAgIHRoaXMudG1wbFN0ciA9IHNyYztcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc3JjIG11c3QgYmUgYSBzdHJpbmcgb3IgYW4gb2JqZWN0IGRlc2NyaWJpbmcgJyArXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGhlIHNvdXJjZScpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRoaXMucGF0aCA9IHBhdGg7XG5cblx0ICAgICAgICBpZihlYWdlckNvbXBpbGUpIHtcblx0ICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblx0ICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgIF90aGlzLl9jb21waWxlKCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgY2F0Y2goZXJyKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBsaWIucHJldHRpZnlFcnJvcih0aGlzLnBhdGgsIHRoaXMuZW52Lm9wdHMuZGV2LCBlcnIpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICB0aGlzLmNvbXBpbGVkID0gZmFsc2U7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgsIHBhcmVudEZyYW1lLCBjYikge1xuXHQgICAgICAgIGlmICh0eXBlb2YgY3R4ID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIGNiID0gY3R4O1xuXHQgICAgICAgICAgICBjdHggPSB7fTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZiAodHlwZW9mIHBhcmVudEZyYW1lID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIGNiID0gcGFyZW50RnJhbWU7XG5cdCAgICAgICAgICAgIHBhcmVudEZyYW1lID0gbnVsbDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgZm9yY2VBc3luYyA9IHRydWU7XG5cdCAgICAgICAgaWYocGFyZW50RnJhbWUpIHtcblx0ICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBmcmFtZSwgd2UgYXJlIGJlaW5nIGNhbGxlZCBmcm9tIGludGVybmFsXG5cdCAgICAgICAgICAgIC8vIGNvZGUgb2YgYW5vdGhlciB0ZW1wbGF0ZSwgYW5kIHRoZSBpbnRlcm5hbCBzeXN0ZW1cblx0ICAgICAgICAgICAgLy8gZGVwZW5kcyBvbiB0aGUgc3luYy9hc3luYyBuYXR1cmUgb2YgdGhlIHBhcmVudCB0ZW1wbGF0ZVxuXHQgICAgICAgICAgICAvLyB0byBiZSBpbmhlcml0ZWQsIHNvIGZvcmNlIGFuIGFzeW5jIGNhbGxiYWNrXG5cdCAgICAgICAgICAgIGZvcmNlQXN5bmMgPSBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXHQgICAgICAgIC8vIENhdGNoIGNvbXBpbGUgZXJyb3JzIGZvciBhc3luYyByZW5kZXJpbmdcblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICBfdGhpcy5jb21waWxlKCk7XG5cdCAgICAgICAgfSBjYXRjaCAoX2Vycikge1xuXHQgICAgICAgICAgICB2YXIgZXJyID0gbGliLnByZXR0aWZ5RXJyb3IodGhpcy5wYXRoLCB0aGlzLmVudi5vcHRzLmRldiwgX2Vycik7XG5cdCAgICAgICAgICAgIGlmIChjYikgcmV0dXJuIGNhbGxiYWNrQXNhcChjYiwgZXJyKTtcblx0ICAgICAgICAgICAgZWxzZSB0aHJvdyBlcnI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dChjdHggfHwge30sIF90aGlzLmJsb2NrcywgX3RoaXMuZW52KTtcblx0ICAgICAgICB2YXIgZnJhbWUgPSBwYXJlbnRGcmFtZSA/IHBhcmVudEZyYW1lLnB1c2godHJ1ZSkgOiBuZXcgRnJhbWUoKTtcblx0ICAgICAgICBmcmFtZS50b3BMZXZlbCA9IHRydWU7XG5cdCAgICAgICAgdmFyIHN5bmNSZXN1bHQgPSBudWxsO1xuXG5cdCAgICAgICAgX3RoaXMucm9vdFJlbmRlckZ1bmMoXG5cdCAgICAgICAgICAgIF90aGlzLmVudixcblx0ICAgICAgICAgICAgY29udGV4dCxcblx0ICAgICAgICAgICAgZnJhbWUgfHwgbmV3IEZyYW1lKCksXG5cdCAgICAgICAgICAgIHJ1bnRpbWUsXG5cdCAgICAgICAgICAgIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG5cdCAgICAgICAgICAgICAgICBpZihlcnIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBlcnIgPSBsaWIucHJldHRpZnlFcnJvcihfdGhpcy5wYXRoLCBfdGhpcy5lbnYub3B0cy5kZXYsIGVycik7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIGlmKGNiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYoZm9yY2VBc3luYykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja0FzYXAoY2IsIGVyciwgcmVzKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNiKGVyciwgcmVzKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZihlcnIpIHsgdGhyb3cgZXJyOyB9XG5cdCAgICAgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHJlcztcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICk7XG5cblx0ICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcblx0ICAgIH0sXG5cblxuXHQgICAgZ2V0RXhwb3J0ZWQ6IGZ1bmN0aW9uKGN0eCwgcGFyZW50RnJhbWUsIGNiKSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBjdHggPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBjdHg7XG5cdCAgICAgICAgICAgIGN0eCA9IHt9O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmICh0eXBlb2YgcGFyZW50RnJhbWUgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgY2IgPSBwYXJlbnRGcmFtZTtcblx0ICAgICAgICAgICAgcGFyZW50RnJhbWUgPSBudWxsO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIENhdGNoIGNvbXBpbGUgZXJyb3JzIGZvciBhc3luYyByZW5kZXJpbmdcblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICB0aGlzLmNvbXBpbGUoKTtcblx0ICAgICAgICB9IGNhdGNoIChlKSB7XG5cdCAgICAgICAgICAgIGlmIChjYikgcmV0dXJuIGNiKGUpO1xuXHQgICAgICAgICAgICBlbHNlIHRocm93IGU7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGZyYW1lID0gcGFyZW50RnJhbWUgPyBwYXJlbnRGcmFtZS5wdXNoKCkgOiBuZXcgRnJhbWUoKTtcblx0ICAgICAgICBmcmFtZS50b3BMZXZlbCA9IHRydWU7XG5cblx0ICAgICAgICAvLyBSdW4gdGhlIHJvb3RSZW5kZXJGdW5jIHRvIHBvcHVsYXRlIHRoZSBjb250ZXh0IHdpdGggZXhwb3J0ZWQgdmFyc1xuXHQgICAgICAgIHZhciBjb250ZXh0ID0gbmV3IENvbnRleHQoY3R4IHx8IHt9LCB0aGlzLmJsb2NrcywgdGhpcy5lbnYpO1xuXHQgICAgICAgIHRoaXMucm9vdFJlbmRlckZ1bmModGhpcy5lbnYsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyKSB7XG5cdCAgICAgICAgXHRcdCAgICAgICAgaWYgKCBlcnIgKSB7XG5cdCAgICAgICAgXHRcdFx0ICAgIGNiKGVyciwgbnVsbCk7XG5cdCAgICAgICAgXHRcdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBcdFx0XHQgICAgY2IobnVsbCwgY29udGV4dC5nZXRFeHBvcnRlZCgpKTtcblx0ICAgICAgICBcdFx0ICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgIH0sXG5cblx0ICAgIGNvbXBpbGU6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmKCF0aGlzLmNvbXBpbGVkKSB7XG5cdCAgICAgICAgICAgIHRoaXMuX2NvbXBpbGUoKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBfY29tcGlsZTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIHByb3BzO1xuXG5cdCAgICAgICAgaWYodGhpcy50bXBsUHJvcHMpIHtcblx0ICAgICAgICAgICAgcHJvcHMgPSB0aGlzLnRtcGxQcm9wcztcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBzb3VyY2UgPSBjb21waWxlci5jb21waWxlKHRoaXMudG1wbFN0cixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnYuYXN5bmNGaWx0ZXJzLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5leHRlbnNpb25zTGlzdCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXRoLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5vcHRzKTtcblxuXHQgICAgICAgICAgICAvKiBqc2xpbnQgZXZpbDogdHJ1ZSAqL1xuXHQgICAgICAgICAgICB2YXIgZnVuYyA9IG5ldyBGdW5jdGlvbihzb3VyY2UpO1xuXHQgICAgICAgICAgICBwcm9wcyA9IGZ1bmMoKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0aGlzLmJsb2NrcyA9IHRoaXMuX2dldEJsb2Nrcyhwcm9wcyk7XG5cdCAgICAgICAgdGhpcy5yb290UmVuZGVyRnVuYyA9IHByb3BzLnJvb3Q7XG5cdCAgICAgICAgdGhpcy5jb21waWxlZCA9IHRydWU7XG5cdCAgICB9LFxuXG5cdCAgICBfZ2V0QmxvY2tzOiBmdW5jdGlvbihwcm9wcykge1xuXHQgICAgICAgIHZhciBibG9ja3MgPSB7fTtcblxuXHQgICAgICAgIGZvcih2YXIgayBpbiBwcm9wcykge1xuXHQgICAgICAgICAgICBpZihrLnNsaWNlKDAsIDIpID09PSAnYl8nKSB7XG5cdCAgICAgICAgICAgICAgICBibG9ja3Nbay5zbGljZSgyKV0gPSBwcm9wc1trXTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBibG9ja3M7XG5cdCAgICB9XG5cdH0pO1xuXG5cdG1vZHVsZS5leHBvcnRzID0ge1xuXHQgICAgRW52aXJvbm1lbnQ6IEVudmlyb25tZW50LFxuXHQgICAgVGVtcGxhdGU6IFRlbXBsYXRlXG5cdH07XG5cblxuLyoqKi8gfSksXG4vKiAzICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0XG5cbi8qKiovIH0pLFxuLyogNCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vIHJhd0FzYXAgcHJvdmlkZXMgZXZlcnl0aGluZyB3ZSBuZWVkIGV4Y2VwdCBleGNlcHRpb24gbWFuYWdlbWVudC5cblx0dmFyIHJhd0FzYXAgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDUpO1xuXHQvLyBSYXdUYXNrcyBhcmUgcmVjeWNsZWQgdG8gcmVkdWNlIEdDIGNodXJuLlxuXHR2YXIgZnJlZVRhc2tzID0gW107XG5cdC8vIFdlIHF1ZXVlIGVycm9ycyB0byBlbnN1cmUgdGhleSBhcmUgdGhyb3duIGluIHJpZ2h0IG9yZGVyIChGSUZPKS5cblx0Ly8gQXJyYXktYXMtcXVldWUgaXMgZ29vZCBlbm91Z2ggaGVyZSwgc2luY2Ugd2UgYXJlIGp1c3QgZGVhbGluZyB3aXRoIGV4Y2VwdGlvbnMuXG5cdHZhciBwZW5kaW5nRXJyb3JzID0gW107XG5cdHZhciByZXF1ZXN0RXJyb3JUaHJvdyA9IHJhd0FzYXAubWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKHRocm93Rmlyc3RFcnJvcik7XG5cblx0ZnVuY3Rpb24gdGhyb3dGaXJzdEVycm9yKCkge1xuXHQgICAgaWYgKHBlbmRpbmdFcnJvcnMubGVuZ3RoKSB7XG5cdCAgICAgICAgdGhyb3cgcGVuZGluZ0Vycm9ycy5zaGlmdCgpO1xuXHQgICAgfVxuXHR9XG5cblx0LyoqXG5cdCAqIENhbGxzIGEgdGFzayBhcyBzb29uIGFzIHBvc3NpYmxlIGFmdGVyIHJldHVybmluZywgaW4gaXRzIG93biBldmVudCwgd2l0aCBwcmlvcml0eVxuXHQgKiBvdmVyIG90aGVyIGV2ZW50cyBsaWtlIGFuaW1hdGlvbiwgcmVmbG93LCBhbmQgcmVwYWludC4gQW4gZXJyb3IgdGhyb3duIGZyb20gYW5cblx0ICogZXZlbnQgd2lsbCBub3QgaW50ZXJydXB0LCBub3IgZXZlbiBzdWJzdGFudGlhbGx5IHNsb3cgZG93biB0aGUgcHJvY2Vzc2luZyBvZlxuXHQgKiBvdGhlciBldmVudHMsIGJ1dCB3aWxsIGJlIHJhdGhlciBwb3N0cG9uZWQgdG8gYSBsb3dlciBwcmlvcml0eSBldmVudC5cblx0ICogQHBhcmFtIHt7Y2FsbH19IHRhc2sgQSBjYWxsYWJsZSBvYmplY3QsIHR5cGljYWxseSBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgbm9cblx0ICogYXJndW1lbnRzLlxuXHQgKi9cblx0bW9kdWxlLmV4cG9ydHMgPSBhc2FwO1xuXHRmdW5jdGlvbiBhc2FwKHRhc2spIHtcblx0ICAgIHZhciByYXdUYXNrO1xuXHQgICAgaWYgKGZyZWVUYXNrcy5sZW5ndGgpIHtcblx0ICAgICAgICByYXdUYXNrID0gZnJlZVRhc2tzLnBvcCgpO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICByYXdUYXNrID0gbmV3IFJhd1Rhc2soKTtcblx0ICAgIH1cblx0ICAgIHJhd1Rhc2sudGFzayA9IHRhc2s7XG5cdCAgICByYXdBc2FwKHJhd1Rhc2spO1xuXHR9XG5cblx0Ly8gV2Ugd3JhcCB0YXNrcyB3aXRoIHJlY3ljbGFibGUgdGFzayBvYmplY3RzLiAgQSB0YXNrIG9iamVjdCBpbXBsZW1lbnRzXG5cdC8vIGBjYWxsYCwganVzdCBsaWtlIGEgZnVuY3Rpb24uXG5cdGZ1bmN0aW9uIFJhd1Rhc2soKSB7XG5cdCAgICB0aGlzLnRhc2sgPSBudWxsO1xuXHR9XG5cblx0Ly8gVGhlIHNvbGUgcHVycG9zZSBvZiB3cmFwcGluZyB0aGUgdGFzayBpcyB0byBjYXRjaCB0aGUgZXhjZXB0aW9uIGFuZCByZWN5Y2xlXG5cdC8vIHRoZSB0YXNrIG9iamVjdCBhZnRlciBpdHMgc2luZ2xlIHVzZS5cblx0UmF3VGFzay5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRyeSB7XG5cdCAgICAgICAgdGhpcy50YXNrLmNhbGwoKTtcblx0ICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cdCAgICAgICAgaWYgKGFzYXAub25lcnJvcikge1xuXHQgICAgICAgICAgICAvLyBUaGlzIGhvb2sgZXhpc3RzIHB1cmVseSBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cblx0ICAgICAgICAgICAgLy8gSXRzIG5hbWUgd2lsbCBiZSBwZXJpb2RpY2FsbHkgcmFuZG9taXplZCB0byBicmVhayBhbnkgY29kZSB0aGF0XG5cdCAgICAgICAgICAgIC8vIGRlcGVuZHMgb24gaXRzIGV4aXN0ZW5jZS5cblx0ICAgICAgICAgICAgYXNhcC5vbmVycm9yKGVycm9yKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAvLyBJbiBhIHdlYiBicm93c2VyLCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuIEhvd2V2ZXIsIHRvIGF2b2lkXG5cdCAgICAgICAgICAgIC8vIHNsb3dpbmcgZG93biB0aGUgcXVldWUgb2YgcGVuZGluZyB0YXNrcywgd2UgcmV0aHJvdyB0aGUgZXJyb3IgaW4gYVxuXHQgICAgICAgICAgICAvLyBsb3dlciBwcmlvcml0eSB0dXJuLlxuXHQgICAgICAgICAgICBwZW5kaW5nRXJyb3JzLnB1c2goZXJyb3IpO1xuXHQgICAgICAgICAgICByZXF1ZXN0RXJyb3JUaHJvdygpO1xuXHQgICAgICAgIH1cblx0ICAgIH0gZmluYWxseSB7XG5cdCAgICAgICAgdGhpcy50YXNrID0gbnVsbDtcblx0ICAgICAgICBmcmVlVGFza3NbZnJlZVRhc2tzLmxlbmd0aF0gPSB0aGlzO1xuXHQgICAgfVxuXHR9O1xuXG5cbi8qKiovIH0pLFxuLyogNSAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqLyhmdW5jdGlvbihnbG9iYWwpIHtcInVzZSBzdHJpY3RcIjtcblxuXHQvLyBVc2UgdGhlIGZhc3Rlc3QgbWVhbnMgcG9zc2libGUgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gaXRzIG93biB0dXJuLCB3aXRoXG5cdC8vIHByaW9yaXR5IG92ZXIgb3RoZXIgZXZlbnRzIGluY2x1ZGluZyBJTywgYW5pbWF0aW9uLCByZWZsb3csIGFuZCByZWRyYXdcblx0Ly8gZXZlbnRzIGluIGJyb3dzZXJzLlxuXHQvL1xuXHQvLyBBbiBleGNlcHRpb24gdGhyb3duIGJ5IGEgdGFzayB3aWxsIHBlcm1hbmVudGx5IGludGVycnVwdCB0aGUgcHJvY2Vzc2luZyBvZlxuXHQvLyBzdWJzZXF1ZW50IHRhc2tzLiBUaGUgaGlnaGVyIGxldmVsIGBhc2FwYCBmdW5jdGlvbiBlbnN1cmVzIHRoYXQgaWYgYW5cblx0Ly8gZXhjZXB0aW9uIGlzIHRocm93biBieSBhIHRhc2ssIHRoYXQgdGhlIHRhc2sgcXVldWUgd2lsbCBjb250aW51ZSBmbHVzaGluZyBhc1xuXHQvLyBzb29uIGFzIHBvc3NpYmxlLCBidXQgaWYgeW91IHVzZSBgcmF3QXNhcGAgZGlyZWN0bHksIHlvdSBhcmUgcmVzcG9uc2libGUgdG9cblx0Ly8gZWl0aGVyIGVuc3VyZSB0aGF0IG5vIGV4Y2VwdGlvbnMgYXJlIHRocm93biBmcm9tIHlvdXIgdGFzaywgb3IgdG8gbWFudWFsbHlcblx0Ly8gY2FsbCBgcmF3QXNhcC5yZXF1ZXN0Rmx1c2hgIGlmIGFuIGV4Y2VwdGlvbiBpcyB0aHJvd24uXG5cdG1vZHVsZS5leHBvcnRzID0gcmF3QXNhcDtcblx0ZnVuY3Rpb24gcmF3QXNhcCh0YXNrKSB7XG5cdCAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuXHQgICAgICAgIHJlcXVlc3RGbHVzaCgpO1xuXHQgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIC8vIEVxdWl2YWxlbnQgdG8gcHVzaCwgYnV0IGF2b2lkcyBhIGZ1bmN0aW9uIGNhbGwuXG5cdCAgICBxdWV1ZVtxdWV1ZS5sZW5ndGhdID0gdGFzaztcblx0fVxuXG5cdHZhciBxdWV1ZSA9IFtdO1xuXHQvLyBPbmNlIGEgZmx1c2ggaGFzIGJlZW4gcmVxdWVzdGVkLCBubyBmdXJ0aGVyIGNhbGxzIHRvIGByZXF1ZXN0Rmx1c2hgIGFyZVxuXHQvLyBuZWNlc3NhcnkgdW50aWwgdGhlIG5leHQgYGZsdXNoYCBjb21wbGV0ZXMuXG5cdHZhciBmbHVzaGluZyA9IGZhbHNlO1xuXHQvLyBgcmVxdWVzdEZsdXNoYCBpcyBhbiBpbXBsZW1lbnRhdGlvbi1zcGVjaWZpYyBtZXRob2QgdGhhdCBhdHRlbXB0cyB0byBraWNrXG5cdC8vIG9mZiBhIGBmbHVzaGAgZXZlbnQgYXMgcXVpY2tseSBhcyBwb3NzaWJsZS4gYGZsdXNoYCB3aWxsIGF0dGVtcHQgdG8gZXhoYXVzdFxuXHQvLyB0aGUgZXZlbnQgcXVldWUgYmVmb3JlIHlpZWxkaW5nIHRvIHRoZSBicm93c2VyJ3Mgb3duIGV2ZW50IGxvb3AuXG5cdHZhciByZXF1ZXN0Rmx1c2g7XG5cdC8vIFRoZSBwb3NpdGlvbiBvZiB0aGUgbmV4dCB0YXNrIHRvIGV4ZWN1dGUgaW4gdGhlIHRhc2sgcXVldWUuIFRoaXMgaXNcblx0Ly8gcHJlc2VydmVkIGJldHdlZW4gY2FsbHMgdG8gYGZsdXNoYCBzbyB0aGF0IGl0IGNhbiBiZSByZXN1bWVkIGlmXG5cdC8vIGEgdGFzayB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuXHR2YXIgaW5kZXggPSAwO1xuXHQvLyBJZiBhIHRhc2sgc2NoZWR1bGVzIGFkZGl0aW9uYWwgdGFza3MgcmVjdXJzaXZlbHksIHRoZSB0YXNrIHF1ZXVlIGNhbiBncm93XG5cdC8vIHVuYm91bmRlZC4gVG8gcHJldmVudCBtZW1vcnkgZXhoYXVzdGlvbiwgdGhlIHRhc2sgcXVldWUgd2lsbCBwZXJpb2RpY2FsbHlcblx0Ly8gdHJ1bmNhdGUgYWxyZWFkeS1jb21wbGV0ZWQgdGFza3MuXG5cdHZhciBjYXBhY2l0eSA9IDEwMjQ7XG5cblx0Ly8gVGhlIGZsdXNoIGZ1bmN0aW9uIHByb2Nlc3NlcyBhbGwgdGFza3MgdGhhdCBoYXZlIGJlZW4gc2NoZWR1bGVkIHdpdGhcblx0Ly8gYHJhd0FzYXBgIHVubGVzcyBhbmQgdW50aWwgb25lIG9mIHRob3NlIHRhc2tzIHRocm93cyBhbiBleGNlcHRpb24uXG5cdC8vIElmIGEgdGFzayB0aHJvd3MgYW4gZXhjZXB0aW9uLCBgZmx1c2hgIGVuc3VyZXMgdGhhdCBpdHMgc3RhdGUgd2lsbCByZW1haW5cblx0Ly8gY29uc2lzdGVudCBhbmQgd2lsbCByZXN1bWUgd2hlcmUgaXQgbGVmdCBvZmYgd2hlbiBjYWxsZWQgYWdhaW4uXG5cdC8vIEhvd2V2ZXIsIGBmbHVzaGAgZG9lcyBub3QgbWFrZSBhbnkgYXJyYW5nZW1lbnRzIHRvIGJlIGNhbGxlZCBhZ2FpbiBpZiBhblxuXHQvLyBleGNlcHRpb24gaXMgdGhyb3duLlxuXHRmdW5jdGlvbiBmbHVzaCgpIHtcblx0ICAgIHdoaWxlIChpbmRleCA8IHF1ZXVlLmxlbmd0aCkge1xuXHQgICAgICAgIHZhciBjdXJyZW50SW5kZXggPSBpbmRleDtcblx0ICAgICAgICAvLyBBZHZhbmNlIHRoZSBpbmRleCBiZWZvcmUgY2FsbGluZyB0aGUgdGFzay4gVGhpcyBlbnN1cmVzIHRoYXQgd2Ugd2lsbFxuXHQgICAgICAgIC8vIGJlZ2luIGZsdXNoaW5nIG9uIHRoZSBuZXh0IHRhc2sgdGhlIHRhc2sgdGhyb3dzIGFuIGVycm9yLlxuXHQgICAgICAgIGluZGV4ID0gaW5kZXggKyAxO1xuXHQgICAgICAgIHF1ZXVlW2N1cnJlbnRJbmRleF0uY2FsbCgpO1xuXHQgICAgICAgIC8vIFByZXZlbnQgbGVha2luZyBtZW1vcnkgZm9yIGxvbmcgY2hhaW5zIG9mIHJlY3Vyc2l2ZSBjYWxscyB0byBgYXNhcGAuXG5cdCAgICAgICAgLy8gSWYgd2UgY2FsbCBgYXNhcGAgd2l0aGluIHRhc2tzIHNjaGVkdWxlZCBieSBgYXNhcGAsIHRoZSBxdWV1ZSB3aWxsXG5cdCAgICAgICAgLy8gZ3JvdywgYnV0IHRvIGF2b2lkIGFuIE8obikgd2FsayBmb3IgZXZlcnkgdGFzayB3ZSBleGVjdXRlLCB3ZSBkb24ndFxuXHQgICAgICAgIC8vIHNoaWZ0IHRhc2tzIG9mZiB0aGUgcXVldWUgYWZ0ZXIgdGhleSBoYXZlIGJlZW4gZXhlY3V0ZWQuXG5cdCAgICAgICAgLy8gSW5zdGVhZCwgd2UgcGVyaW9kaWNhbGx5IHNoaWZ0IDEwMjQgdGFza3Mgb2ZmIHRoZSBxdWV1ZS5cblx0ICAgICAgICBpZiAoaW5kZXggPiBjYXBhY2l0eSkge1xuXHQgICAgICAgICAgICAvLyBNYW51YWxseSBzaGlmdCBhbGwgdmFsdWVzIHN0YXJ0aW5nIGF0IHRoZSBpbmRleCBiYWNrIHRvIHRoZVxuXHQgICAgICAgICAgICAvLyBiZWdpbm5pbmcgb2YgdGhlIHF1ZXVlLlxuXHQgICAgICAgICAgICBmb3IgKHZhciBzY2FuID0gMCwgbmV3TGVuZ3RoID0gcXVldWUubGVuZ3RoIC0gaW5kZXg7IHNjYW4gPCBuZXdMZW5ndGg7IHNjYW4rKykge1xuXHQgICAgICAgICAgICAgICAgcXVldWVbc2Nhbl0gPSBxdWV1ZVtzY2FuICsgaW5kZXhdO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCAtPSBpbmRleDtcblx0ICAgICAgICAgICAgaW5kZXggPSAwO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG5cdCAgICBpbmRleCA9IDA7XG5cdCAgICBmbHVzaGluZyA9IGZhbHNlO1xuXHR9XG5cblx0Ly8gYHJlcXVlc3RGbHVzaGAgaXMgaW1wbGVtZW50ZWQgdXNpbmcgYSBzdHJhdGVneSBiYXNlZCBvbiBkYXRhIGNvbGxlY3RlZCBmcm9tXG5cdC8vIGV2ZXJ5IGF2YWlsYWJsZSBTYXVjZUxhYnMgU2VsZW5pdW0gd2ViIGRyaXZlciB3b3JrZXIgYXQgdGltZSBvZiB3cml0aW5nLlxuXHQvLyBodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9zcHJlYWRzaGVldHMvZC8xbUctNVVZR3VwNXF4R2RFTVdraFA2QldDejA1M05VYjJFMVFvVVRVMTZ1QS9lZGl0I2dpZD03ODM3MjQ1OTNcblxuXHQvLyBTYWZhcmkgNiBhbmQgNi4xIGZvciBkZXNrdG9wLCBpUGFkLCBhbmQgaVBob25lIGFyZSB0aGUgb25seSBicm93c2VycyB0aGF0XG5cdC8vIGhhdmUgV2ViS2l0TXV0YXRpb25PYnNlcnZlciBidXQgbm90IHVuLXByZWZpeGVkIE11dGF0aW9uT2JzZXJ2ZXIuXG5cdC8vIE11c3QgdXNlIGBnbG9iYWxgIG9yIGBzZWxmYCBpbnN0ZWFkIG9mIGB3aW5kb3dgIHRvIHdvcmsgaW4gYm90aCBmcmFtZXMgYW5kIHdlYlxuXHQvLyB3b3JrZXJzLiBgZ2xvYmFsYCBpcyBhIHByb3Zpc2lvbiBvZiBCcm93c2VyaWZ5LCBNciwgTXJzLCBvciBNb3AuXG5cblx0LyogZ2xvYmFscyBzZWxmICovXG5cdHZhciBzY29wZSA9IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiBzZWxmO1xuXHR2YXIgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPSBzY29wZS5NdXRhdGlvbk9ic2VydmVyIHx8IHNjb3BlLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG5cblx0Ly8gTXV0YXRpb25PYnNlcnZlcnMgYXJlIGRlc2lyYWJsZSBiZWNhdXNlIHRoZXkgaGF2ZSBoaWdoIHByaW9yaXR5IGFuZCB3b3JrXG5cdC8vIHJlbGlhYmx5IGV2ZXJ5d2hlcmUgdGhleSBhcmUgaW1wbGVtZW50ZWQuXG5cdC8vIFRoZXkgYXJlIGltcGxlbWVudGVkIGluIGFsbCBtb2Rlcm4gYnJvd3NlcnMuXG5cdC8vXG5cdC8vIC0gQW5kcm9pZCA0LTQuM1xuXHQvLyAtIENocm9tZSAyNi0zNFxuXHQvLyAtIEZpcmVmb3ggMTQtMjlcblx0Ly8gLSBJbnRlcm5ldCBFeHBsb3JlciAxMVxuXHQvLyAtIGlQYWQgU2FmYXJpIDYtNy4xXG5cdC8vIC0gaVBob25lIFNhZmFyaSA3LTcuMVxuXHQvLyAtIFNhZmFyaSA2LTdcblx0aWYgKHR5cGVvZiBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdCAgICByZXF1ZXN0Rmx1c2ggPSBtYWtlUmVxdWVzdENhbGxGcm9tTXV0YXRpb25PYnNlcnZlcihmbHVzaCk7XG5cblx0Ly8gTWVzc2FnZUNoYW5uZWxzIGFyZSBkZXNpcmFibGUgYmVjYXVzZSB0aGV5IGdpdmUgZGlyZWN0IGFjY2VzcyB0byB0aGUgSFRNTFxuXHQvLyB0YXNrIHF1ZXVlLCBhcmUgaW1wbGVtZW50ZWQgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAsIFNhZmFyaSA1LjAtMSwgYW5kIE9wZXJhXG5cdC8vIDExLTEyLCBhbmQgaW4gd2ViIHdvcmtlcnMgaW4gbWFueSBlbmdpbmVzLlxuXHQvLyBBbHRob3VnaCBtZXNzYWdlIGNoYW5uZWxzIHlpZWxkIHRvIGFueSBxdWV1ZWQgcmVuZGVyaW5nIGFuZCBJTyB0YXNrcywgdGhleVxuXHQvLyB3b3VsZCBiZSBiZXR0ZXIgdGhhbiBpbXBvc2luZyB0aGUgNG1zIGRlbGF5IG9mIHRpbWVycy5cblx0Ly8gSG93ZXZlciwgdGhleSBkbyBub3Qgd29yayByZWxpYWJseSBpbiBJbnRlcm5ldCBFeHBsb3JlciBvciBTYWZhcmkuXG5cblx0Ly8gSW50ZXJuZXQgRXhwbG9yZXIgMTAgaXMgdGhlIG9ubHkgYnJvd3NlciB0aGF0IGhhcyBzZXRJbW1lZGlhdGUgYnV0IGRvZXNcblx0Ly8gbm90IGhhdmUgTXV0YXRpb25PYnNlcnZlcnMuXG5cdC8vIEFsdGhvdWdoIHNldEltbWVkaWF0ZSB5aWVsZHMgdG8gdGhlIGJyb3dzZXIncyByZW5kZXJlciwgaXQgd291bGQgYmVcblx0Ly8gcHJlZmVycmFibGUgdG8gZmFsbGluZyBiYWNrIHRvIHNldFRpbWVvdXQgc2luY2UgaXQgZG9lcyBub3QgaGF2ZVxuXHQvLyB0aGUgbWluaW11bSA0bXMgcGVuYWx0eS5cblx0Ly8gVW5mb3J0dW5hdGVseSB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgYnVnIGluIEludGVybmV0IEV4cGxvcmVyIDEwIE1vYmlsZSAoYW5kXG5cdC8vIERlc2t0b3AgdG8gYSBsZXNzZXIgZXh0ZW50KSB0aGF0IHJlbmRlcnMgYm90aCBzZXRJbW1lZGlhdGUgYW5kXG5cdC8vIE1lc3NhZ2VDaGFubmVsIHVzZWxlc3MgZm9yIHRoZSBwdXJwb3NlcyBvZiBBU0FQLlxuXHQvLyBodHRwczovL2dpdGh1Yi5jb20va3Jpc2tvd2FsL3EvaXNzdWVzLzM5NlxuXG5cdC8vIFRpbWVycyBhcmUgaW1wbGVtZW50ZWQgdW5pdmVyc2FsbHkuXG5cdC8vIFdlIGZhbGwgYmFjayB0byB0aW1lcnMgaW4gd29ya2VycyBpbiBtb3N0IGVuZ2luZXMsIGFuZCBpbiBmb3JlZ3JvdW5kXG5cdC8vIGNvbnRleHRzIGluIHRoZSBmb2xsb3dpbmcgYnJvd3NlcnMuXG5cdC8vIEhvd2V2ZXIsIG5vdGUgdGhhdCBldmVuIHRoaXMgc2ltcGxlIGNhc2UgcmVxdWlyZXMgbnVhbmNlcyB0byBvcGVyYXRlIGluIGFcblx0Ly8gYnJvYWQgc3BlY3RydW0gb2YgYnJvd3NlcnMuXG5cdC8vXG5cdC8vIC0gRmlyZWZveCAzLTEzXG5cdC8vIC0gSW50ZXJuZXQgRXhwbG9yZXIgNi05XG5cdC8vIC0gaVBhZCBTYWZhcmkgNC4zXG5cdC8vIC0gTHlueCAyLjguN1xuXHR9IGVsc2Uge1xuXHQgICAgcmVxdWVzdEZsdXNoID0gbWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKGZsdXNoKTtcblx0fVxuXG5cdC8vIGByZXF1ZXN0Rmx1c2hgIHJlcXVlc3RzIHRoYXQgdGhlIGhpZ2ggcHJpb3JpdHkgZXZlbnQgcXVldWUgYmUgZmx1c2hlZCBhc1xuXHQvLyBzb29uIGFzIHBvc3NpYmxlLlxuXHQvLyBUaGlzIGlzIHVzZWZ1bCB0byBwcmV2ZW50IGFuIGVycm9yIHRocm93biBpbiBhIHRhc2sgZnJvbSBzdGFsbGluZyB0aGUgZXZlbnRcblx0Ly8gcXVldWUgaWYgdGhlIGV4Y2VwdGlvbiBoYW5kbGVkIGJ5IE5vZGUuanPigJlzXG5cdC8vIGBwcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIilgIG9yIGJ5IGEgZG9tYWluLlxuXHRyYXdBc2FwLnJlcXVlc3RGbHVzaCA9IHJlcXVlc3RGbHVzaDtcblxuXHQvLyBUbyByZXF1ZXN0IGEgaGlnaCBwcmlvcml0eSBldmVudCwgd2UgaW5kdWNlIGEgbXV0YXRpb24gb2JzZXJ2ZXIgYnkgdG9nZ2xpbmdcblx0Ly8gdGhlIHRleHQgb2YgYSB0ZXh0IG5vZGUgYmV0d2VlbiBcIjFcIiBhbmQgXCItMVwiLlxuXHRmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjaykge1xuXHQgICAgdmFyIHRvZ2dsZSA9IDE7XG5cdCAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spO1xuXHQgICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcblx0ICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwge2NoYXJhY3RlckRhdGE6IHRydWV9KTtcblx0ICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcblx0ICAgICAgICB0b2dnbGUgPSAtdG9nZ2xlO1xuXHQgICAgICAgIG5vZGUuZGF0YSA9IHRvZ2dsZTtcblx0ICAgIH07XG5cdH1cblxuXHQvLyBUaGUgbWVzc2FnZSBjaGFubmVsIHRlY2huaXF1ZSB3YXMgZGlzY292ZXJlZCBieSBNYWx0ZSBVYmwgYW5kIHdhcyB0aGVcblx0Ly8gb3JpZ2luYWwgZm91bmRhdGlvbiBmb3IgdGhpcyBsaWJyYXJ5LlxuXHQvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuXG5cdC8vIFNhZmFyaSA2LjAuNSAoYXQgbGVhc3QpIGludGVybWl0dGVudGx5IGZhaWxzIHRvIGNyZWF0ZSBtZXNzYWdlIHBvcnRzIG9uIGFcblx0Ly8gcGFnZSdzIGZpcnN0IGxvYWQuIFRoYW5rZnVsbHksIHRoaXMgdmVyc2lvbiBvZiBTYWZhcmkgc3VwcG9ydHNcblx0Ly8gTXV0YXRpb25PYnNlcnZlcnMsIHNvIHdlIGRvbid0IG5lZWQgdG8gZmFsbCBiYWNrIGluIHRoYXQgY2FzZS5cblxuXHQvLyBmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tTWVzc2FnZUNoYW5uZWwoY2FsbGJhY2spIHtcblx0Ly8gICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG5cdC8vICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGNhbGxiYWNrO1xuXHQvLyAgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQvLyAgICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG5cdC8vICAgICB9O1xuXHQvLyB9XG5cblx0Ly8gRm9yIHJlYXNvbnMgZXhwbGFpbmVkIGFib3ZlLCB3ZSBhcmUgYWxzbyB1bmFibGUgdG8gdXNlIGBzZXRJbW1lZGlhdGVgXG5cdC8vIHVuZGVyIGFueSBjaXJjdW1zdGFuY2VzLlxuXHQvLyBFdmVuIGlmIHdlIHdlcmUsIHRoZXJlIGlzIGFub3RoZXIgYnVnIGluIEludGVybmV0IEV4cGxvcmVyIDEwLlxuXHQvLyBJdCBpcyBub3Qgc3VmZmljaWVudCB0byBhc3NpZ24gYHNldEltbWVkaWF0ZWAgdG8gYHJlcXVlc3RGbHVzaGAgYmVjYXVzZVxuXHQvLyBgc2V0SW1tZWRpYXRlYCBtdXN0IGJlIGNhbGxlZCAqYnkgbmFtZSogYW5kIHRoZXJlZm9yZSBtdXN0IGJlIHdyYXBwZWQgaW4gYVxuXHQvLyBjbG9zdXJlLlxuXHQvLyBOZXZlciBmb3JnZXQuXG5cblx0Ly8gZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbVNldEltbWVkaWF0ZShjYWxsYmFjaykge1xuXHQvLyAgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuXHQvLyAgICAgICAgIHNldEltbWVkaWF0ZShjYWxsYmFjayk7XG5cdC8vICAgICB9O1xuXHQvLyB9XG5cblx0Ly8gU2FmYXJpIDYuMCBoYXMgYSBwcm9ibGVtIHdoZXJlIHRpbWVycyB3aWxsIGdldCBsb3N0IHdoaWxlIHRoZSB1c2VyIGlzXG5cdC8vIHNjcm9sbGluZy4gVGhpcyBwcm9ibGVtIGRvZXMgbm90IGltcGFjdCBBU0FQIGJlY2F1c2UgU2FmYXJpIDYuMCBzdXBwb3J0c1xuXHQvLyBtdXRhdGlvbiBvYnNlcnZlcnMsIHNvIHRoYXQgaW1wbGVtZW50YXRpb24gaXMgdXNlZCBpbnN0ZWFkLlxuXHQvLyBIb3dldmVyLCBpZiB3ZSBldmVyIGVsZWN0IHRvIHVzZSB0aW1lcnMgaW4gU2FmYXJpLCB0aGUgcHJldmFsZW50IHdvcmstYXJvdW5kXG5cdC8vIGlzIHRvIGFkZCBhIHNjcm9sbCBldmVudCBsaXN0ZW5lciB0aGF0IGNhbGxzIGZvciBhIGZsdXNoLlxuXG5cdC8vIGBzZXRUaW1lb3V0YCBkb2VzIG5vdCBjYWxsIHRoZSBwYXNzZWQgY2FsbGJhY2sgaWYgdGhlIGRlbGF5IGlzIGxlc3MgdGhhblxuXHQvLyBhcHByb3hpbWF0ZWx5IDcgaW4gd2ViIHdvcmtlcnMgaW4gRmlyZWZveCA4IHRocm91Z2ggMTgsIGFuZCBzb21ldGltZXMgbm90XG5cdC8vIGV2ZW4gdGhlbi5cblxuXHRmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXIoY2FsbGJhY2spIHtcblx0ICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcblx0ICAgICAgICAvLyBXZSBkaXNwYXRjaCBhIHRpbWVvdXQgd2l0aCBhIHNwZWNpZmllZCBkZWxheSBvZiAwIGZvciBlbmdpbmVzIHRoYXRcblx0ICAgICAgICAvLyBjYW4gcmVsaWFibHkgYWNjb21tb2RhdGUgdGhhdCByZXF1ZXN0LiBUaGlzIHdpbGwgdXN1YWxseSBiZSBzbmFwcGVkXG5cdCAgICAgICAgLy8gdG8gYSA0IG1pbGlzZWNvbmQgZGVsYXksIGJ1dCBvbmNlIHdlJ3JlIGZsdXNoaW5nLCB0aGVyZSdzIG5vIGRlbGF5XG5cdCAgICAgICAgLy8gYmV0d2VlbiBldmVudHMuXG5cdCAgICAgICAgdmFyIHRpbWVvdXRIYW5kbGUgPSBzZXRUaW1lb3V0KGhhbmRsZVRpbWVyLCAwKTtcblx0ICAgICAgICAvLyBIb3dldmVyLCBzaW5jZSB0aGlzIHRpbWVyIGdldHMgZnJlcXVlbnRseSBkcm9wcGVkIGluIEZpcmVmb3hcblx0ICAgICAgICAvLyB3b3JrZXJzLCB3ZSBlbmxpc3QgYW4gaW50ZXJ2YWwgaGFuZGxlIHRoYXQgd2lsbCB0cnkgdG8gZmlyZVxuXHQgICAgICAgIC8vIGFuIGV2ZW50IDIwIHRpbWVzIHBlciBzZWNvbmQgdW50aWwgaXQgc3VjY2VlZHMuXG5cdCAgICAgICAgdmFyIGludGVydmFsSGFuZGxlID0gc2V0SW50ZXJ2YWwoaGFuZGxlVGltZXIsIDUwKTtcblxuXHQgICAgICAgIGZ1bmN0aW9uIGhhbmRsZVRpbWVyKCkge1xuXHQgICAgICAgICAgICAvLyBXaGljaGV2ZXIgdGltZXIgc3VjY2VlZHMgd2lsbCBjYW5jZWwgYm90aCB0aW1lcnMgYW5kXG5cdCAgICAgICAgICAgIC8vIGV4ZWN1dGUgdGhlIGNhbGxiYWNrLlxuXHQgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG5cdCAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGUpO1xuXHQgICAgICAgICAgICBjYWxsYmFjaygpO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cdH1cblxuXHQvLyBUaGlzIGlzIGZvciBgYXNhcC5qc2Agb25seS5cblx0Ly8gSXRzIG5hbWUgd2lsbCBiZSBwZXJpb2RpY2FsbHkgcmFuZG9taXplZCB0byBicmVhayBhbnkgY29kZSB0aGF0IGRlcGVuZHMgb25cblx0Ly8gaXRzIGV4aXN0ZW5jZS5cblx0cmF3QXNhcC5tYWtlUmVxdWVzdENhbGxGcm9tVGltZXIgPSBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXI7XG5cblx0Ly8gQVNBUCB3YXMgb3JpZ2luYWxseSBhIG5leHRUaWNrIHNoaW0gaW5jbHVkZWQgaW4gUS4gVGhpcyB3YXMgZmFjdG9yZWQgb3V0XG5cdC8vIGludG8gdGhpcyBBU0FQIHBhY2thZ2UuIEl0IHdhcyBsYXRlciBhZGFwdGVkIHRvIFJTVlAgd2hpY2ggbWFkZSBmdXJ0aGVyXG5cdC8vIGFtZW5kbWVudHMuIFRoZXNlIGRlY2lzaW9ucywgcGFydGljdWxhcmx5IHRvIG1hcmdpbmFsaXplIE1lc3NhZ2VDaGFubmVsIGFuZFxuXHQvLyB0byBjYXB0dXJlIHRoZSBNdXRhdGlvbk9ic2VydmVyIGltcGxlbWVudGF0aW9uIGluIGEgY2xvc3VyZSwgd2VyZSBpbnRlZ3JhdGVkXG5cdC8vIGJhY2sgaW50byBBU0FQIHByb3Blci5cblx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3RpbGRlaW8vcnN2cC5qcy9ibG9iL2NkZGY3MjMyNTQ2YTljZjg1ODUyNGI3NWNkZTZmOWVkZjcyNjIwYTcvbGliL3JzdnAvYXNhcC5qc1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqL30uY2FsbChleHBvcnRzLCAoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KCkpKSlcblxuLyoqKi8gfSksXG4vKiA2ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8vIEEgc2ltcGxlIGNsYXNzIHN5c3RlbSwgbW9yZSBkb2N1bWVudGF0aW9uIHRvIGNvbWVcblxuXHRmdW5jdGlvbiBleHRlbmQoY2xzLCBuYW1lLCBwcm9wcykge1xuXHQgICAgLy8gVGhpcyBkb2VzIHRoYXQgc2FtZSB0aGluZyBhcyBPYmplY3QuY3JlYXRlLCBidXQgd2l0aCBzdXBwb3J0IGZvciBJRThcblx0ICAgIHZhciBGID0gZnVuY3Rpb24oKSB7fTtcblx0ICAgIEYucHJvdG90eXBlID0gY2xzLnByb3RvdHlwZTtcblx0ICAgIHZhciBwcm90b3R5cGUgPSBuZXcgRigpO1xuXG5cdCAgICAvLyBqc2hpbnQgdW5kZWY6IGZhbHNlXG5cdCAgICB2YXIgZm5UZXN0ID0gL3h5ei8udGVzdChmdW5jdGlvbigpeyB4eXo7IH0pID8gL1xcYnBhcmVudFxcYi8gOiAvLiovO1xuXHQgICAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcblxuXHQgICAgZm9yKHZhciBrIGluIHByb3BzKSB7XG5cdCAgICAgICAgdmFyIHNyYyA9IHByb3BzW2tdO1xuXHQgICAgICAgIHZhciBwYXJlbnQgPSBwcm90b3R5cGVba107XG5cblx0ICAgICAgICBpZih0eXBlb2YgcGFyZW50ID09PSAnZnVuY3Rpb24nICYmXG5cdCAgICAgICAgICAgdHlwZW9mIHNyYyA9PT0gJ2Z1bmN0aW9uJyAmJlxuXHQgICAgICAgICAgIGZuVGVzdC50ZXN0KHNyYykpIHtcblx0ICAgICAgICAgICAgLypqc2hpbnQgLVcwODMgKi9cblx0ICAgICAgICAgICAgcHJvdG90eXBlW2tdID0gKGZ1bmN0aW9uIChzcmMsIHBhcmVudCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGN1cnJlbnQgcGFyZW50IG1ldGhvZFxuXHQgICAgICAgICAgICAgICAgICAgIHZhciB0bXAgPSB0aGlzLnBhcmVudDtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8vIFNldCBwYXJlbnQgdG8gdGhlIHByZXZpb3VzIG1ldGhvZCwgY2FsbCwgYW5kIHJlc3RvcmVcblx0ICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgcmVzID0gc3JjLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSB0bXA7XG5cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuXHQgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfSkoc3JjLCBwYXJlbnQpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgcHJvdG90eXBlW2tdID0gc3JjO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgcHJvdG90eXBlLnR5cGVuYW1lID0gbmFtZTtcblxuXHQgICAgdmFyIG5ld19jbHMgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICBpZihwcm90b3R5cGUuaW5pdCkge1xuXHQgICAgICAgICAgICBwcm90b3R5cGUuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgIG5ld19jbHMucHJvdG90eXBlID0gcHJvdG90eXBlO1xuXHQgICAgbmV3X2Nscy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBuZXdfY2xzO1xuXG5cdCAgICBuZXdfY2xzLmV4dGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHByb3BzKSB7XG5cdCAgICAgICAgaWYodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG5cdCAgICAgICAgICAgIHByb3BzID0gbmFtZTtcblx0ICAgICAgICAgICAgbmFtZSA9ICdhbm9ueW1vdXMnO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gZXh0ZW5kKG5ld19jbHMsIG5hbWUsIHByb3BzKTtcblx0ICAgIH07XG5cblx0ICAgIHJldHVybiBuZXdfY2xzO1xuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBleHRlbmQoT2JqZWN0LCAnT2JqZWN0Jywge30pO1xuXG5cbi8qKiovIH0pLFxuLyogNyAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgbGliID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblx0dmFyIHIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDgpO1xuXG5cdGZ1bmN0aW9uIG5vcm1hbGl6ZSh2YWx1ZSwgZGVmYXVsdFZhbHVlKSB7XG5cdCAgICBpZih2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBmYWxzZSkge1xuXHQgICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdmFsdWU7XG5cdH1cblxuXHR2YXIgZmlsdGVycyA9IHtcblx0ICAgIGFiczogTWF0aC5hYnMsXG5cblx0ICAgIGJhdGNoOiBmdW5jdGlvbihhcnIsIGxpbmVjb3VudCwgZmlsbF93aXRoKSB7XG5cdCAgICAgICAgdmFyIGk7XG5cdCAgICAgICAgdmFyIHJlcyA9IFtdO1xuXHQgICAgICAgIHZhciB0bXAgPSBbXTtcblxuXHQgICAgICAgIGZvcihpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICBpZihpICUgbGluZWNvdW50ID09PSAwICYmIHRtcC5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgIHJlcy5wdXNoKHRtcCk7XG5cdCAgICAgICAgICAgICAgICB0bXAgPSBbXTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHRtcC5wdXNoKGFycltpXSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYodG1wLmxlbmd0aCkge1xuXHQgICAgICAgICAgICBpZihmaWxsX3dpdGgpIHtcblx0ICAgICAgICAgICAgICAgIGZvcihpID0gdG1wLmxlbmd0aDsgaSA8IGxpbmVjb3VudDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdG1wLnB1c2goZmlsbF93aXRoKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJlcy5wdXNoKHRtcCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHJlcztcblx0ICAgIH0sXG5cblx0ICAgIGNhcGl0YWxpemU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB2YXIgcmV0ID0gc3RyLnRvTG93ZXJDYXNlKCk7XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcmV0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcmV0LnNsaWNlKDEpKTtcblx0ICAgIH0sXG5cblx0ICAgIGNlbnRlcjogZnVuY3Rpb24oc3RyLCB3aWR0aCkge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IDgwO1xuXG5cdCAgICAgICAgaWYoc3RyLmxlbmd0aCA+PSB3aWR0aCkge1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBzcGFjZXMgPSB3aWR0aCAtIHN0ci5sZW5ndGg7XG5cdCAgICAgICAgdmFyIHByZSA9IGxpYi5yZXBlYXQoJyAnLCBzcGFjZXMvMiAtIHNwYWNlcyAlIDIpO1xuXHQgICAgICAgIHZhciBwb3N0ID0gbGliLnJlcGVhdCgnICcsIHNwYWNlcy8yKTtcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCBwcmUgKyBzdHIgKyBwb3N0KTtcblx0ICAgIH0sXG5cblx0ICAgICdkZWZhdWx0JzogZnVuY3Rpb24odmFsLCBkZWYsIGJvb2wpIHtcblx0ICAgICAgICBpZihib29sKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YWwgPyB2YWwgOiBkZWY7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICByZXR1cm4gKHZhbCAhPT0gdW5kZWZpbmVkKSA/IHZhbCA6IGRlZjtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBkaWN0c29ydDogZnVuY3Rpb24odmFsLCBjYXNlX3NlbnNpdGl2ZSwgYnkpIHtcblx0ICAgICAgICBpZiAoIWxpYi5pc09iamVjdCh2YWwpKSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcignZGljdHNvcnQgZmlsdGVyOiB2YWwgbXVzdCBiZSBhbiBvYmplY3QnKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgYXJyYXkgPSBbXTtcblx0ICAgICAgICBmb3IgKHZhciBrIGluIHZhbCkge1xuXHQgICAgICAgICAgICAvLyBkZWxpYmVyYXRlbHkgaW5jbHVkZSBwcm9wZXJ0aWVzIGZyb20gdGhlIG9iamVjdCdzIHByb3RvdHlwZVxuXHQgICAgICAgICAgICBhcnJheS5wdXNoKFtrLHZhbFtrXV0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBzaTtcblx0ICAgICAgICBpZiAoYnkgPT09IHVuZGVmaW5lZCB8fCBieSA9PT0gJ2tleScpIHtcblx0ICAgICAgICAgICAgc2kgPSAwO1xuXHQgICAgICAgIH0gZWxzZSBpZiAoYnkgPT09ICd2YWx1ZScpIHtcblx0ICAgICAgICAgICAgc2kgPSAxO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcihcblx0ICAgICAgICAgICAgICAgICdkaWN0c29ydCBmaWx0ZXI6IFlvdSBjYW4gb25seSBzb3J0IGJ5IGVpdGhlciBrZXkgb3IgdmFsdWUnKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBhcnJheS5zb3J0KGZ1bmN0aW9uKHQxLCB0Mikge1xuXHQgICAgICAgICAgICB2YXIgYSA9IHQxW3NpXTtcblx0ICAgICAgICAgICAgdmFyIGIgPSB0MltzaV07XG5cblx0ICAgICAgICAgICAgaWYgKCFjYXNlX3NlbnNpdGl2ZSkge1xuXHQgICAgICAgICAgICAgICAgaWYgKGxpYi5pc1N0cmluZyhhKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGEgPSBhLnRvVXBwZXJDYXNlKCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBpZiAobGliLmlzU3RyaW5nKGIpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYiA9IGIudG9VcHBlckNhc2UoKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBhID4gYiA/IDEgOiAoYSA9PT0gYiA/IDAgOiAtMSk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gYXJyYXk7XG5cdCAgICB9LFxuXG5cdCAgICBkdW1wOiBmdW5jdGlvbihvYmosIHNwYWNlcykge1xuXHQgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsIHNwYWNlcyk7XG5cdCAgICB9LFxuXG5cdCAgICBlc2NhcGU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIGlmKHN0ciBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykge1xuXHQgICAgICAgICAgICByZXR1cm4gc3RyO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBzdHIgPSAoc3RyID09PSBudWxsIHx8IHN0ciA9PT0gdW5kZWZpbmVkKSA/ICcnIDogc3RyO1xuXHQgICAgICAgIHJldHVybiByLm1hcmtTYWZlKGxpYi5lc2NhcGUoc3RyLnRvU3RyaW5nKCkpKTtcblx0ICAgIH0sXG5cblx0ICAgIHNhZmU6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIGlmIChzdHIgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cdCAgICAgICAgc3RyID0gKHN0ciA9PT0gbnVsbCB8fCBzdHIgPT09IHVuZGVmaW5lZCkgPyAnJyA6IHN0cjtcblx0ICAgICAgICByZXR1cm4gci5tYXJrU2FmZShzdHIudG9TdHJpbmcoKSk7XG5cdCAgICB9LFxuXG5cdCAgICBmaXJzdDogZnVuY3Rpb24oYXJyKSB7XG5cdCAgICAgICAgcmV0dXJuIGFyclswXTtcblx0ICAgIH0sXG5cblx0ICAgIGdyb3VwYnk6IGZ1bmN0aW9uKGFyciwgYXR0cikge1xuXHQgICAgICAgIHJldHVybiBsaWIuZ3JvdXBCeShhcnIsIGF0dHIpO1xuXHQgICAgfSxcblxuXHQgICAgaW5kZW50OiBmdW5jdGlvbihzdHIsIHdpZHRoLCBpbmRlbnRmaXJzdCkge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblxuXHQgICAgICAgIGlmIChzdHIgPT09ICcnKSByZXR1cm4gJyc7XG5cblx0ICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IDQ7XG5cdCAgICAgICAgdmFyIHJlcyA9ICcnO1xuXHQgICAgICAgIHZhciBsaW5lcyA9IHN0ci5zcGxpdCgnXFxuJyk7XG5cdCAgICAgICAgdmFyIHNwID0gbGliLnJlcGVhdCgnICcsIHdpZHRoKTtcblxuXHQgICAgICAgIGZvcih2YXIgaT0wOyBpPGxpbmVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGlmKGkgPT09IDAgJiYgIWluZGVudGZpcnN0KSB7XG5cdCAgICAgICAgICAgICAgICByZXMgKz0gbGluZXNbaV0gKyAnXFxuJztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJlcyArPSBzcCArIGxpbmVzW2ldICsgJ1xcbic7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXMpO1xuXHQgICAgfSxcblxuXHQgICAgam9pbjogZnVuY3Rpb24oYXJyLCBkZWwsIGF0dHIpIHtcblx0ICAgICAgICBkZWwgPSBkZWwgfHwgJyc7XG5cblx0ICAgICAgICBpZihhdHRyKSB7XG5cdCAgICAgICAgICAgIGFyciA9IGxpYi5tYXAoYXJyLCBmdW5jdGlvbih2KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdlthdHRyXTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGFyci5qb2luKGRlbCk7XG5cdCAgICB9LFxuXG5cdCAgICBsYXN0OiBmdW5jdGlvbihhcnIpIHtcblx0ICAgICAgICByZXR1cm4gYXJyW2Fyci5sZW5ndGgtMV07XG5cdCAgICB9LFxuXG5cdCAgICBsZW5ndGg6IGZ1bmN0aW9uKHZhbCkge1xuXHQgICAgICAgIHZhciB2YWx1ZSA9IG5vcm1hbGl6ZSh2YWwsICcnKTtcblxuXHQgICAgICAgIGlmKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgaWYoXG5cdCAgICAgICAgICAgICAgICAodHlwZW9mIE1hcCA9PT0gJ2Z1bmN0aW9uJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIE1hcCkgfHxcblx0ICAgICAgICAgICAgICAgICh0eXBlb2YgU2V0ID09PSAnZnVuY3Rpb24nICYmIHZhbHVlIGluc3RhbmNlb2YgU2V0KVxuXHQgICAgICAgICAgICApIHtcblx0ICAgICAgICAgICAgICAgIC8vIEVDTUFTY3JpcHQgMjAxNSBNYXBzIGFuZCBTZXRzXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuc2l6ZTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZihsaWIuaXNPYmplY3QodmFsdWUpICYmICEodmFsdWUgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpKSB7XG5cdCAgICAgICAgICAgICAgICAvLyBPYmplY3RzIChiZXNpZGVzIFNhZmVTdHJpbmdzKSwgbm9uLXByaW1hdGl2ZSBBcnJheXNcblx0ICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiB2YWx1ZS5sZW5ndGg7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiAwO1xuXHQgICAgfSxcblxuXHQgICAgbGlzdDogZnVuY3Rpb24odmFsKSB7XG5cdCAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhbC5zcGxpdCgnJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYobGliLmlzT2JqZWN0KHZhbCkpIHtcblx0ICAgICAgICAgICAgdmFyIGtleXMgPSBbXTtcblxuXHQgICAgICAgICAgICBpZihPYmplY3Qua2V5cykge1xuXHQgICAgICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKHZhbCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBmb3IodmFyIGsgaW4gdmFsKSB7XG5cdCAgICAgICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIGxpYi5tYXAoa2V5cywgZnVuY3Rpb24oaykge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHsga2V5OiBrLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbFtrXSB9O1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSBpZihsaWIuaXNBcnJheSh2YWwpKSB7XG5cdCAgICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKCdsaXN0IGZpbHRlcjogdHlwZSBub3QgaXRlcmFibGUnKTtcblx0ICAgICAgICB9XG5cdCAgICB9LFxuXG5cdCAgICBsb3dlcjogZnVuY3Rpb24oc3RyKSB7XG5cdCAgICAgICAgc3RyID0gbm9ybWFsaXplKHN0ciwgJycpO1xuXHQgICAgICAgIHJldHVybiBzdHIudG9Mb3dlckNhc2UoKTtcblx0ICAgIH0sXG5cblx0ICAgIG5sMmJyOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBpZiAoc3RyID09PSBudWxsIHx8IHN0ciA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiAnJztcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgc3RyLnJlcGxhY2UoL1xcclxcbnxcXG4vZywgJzxiciAvPlxcbicpKTtcblx0ICAgIH0sXG5cblx0ICAgIHJhbmRvbTogZnVuY3Rpb24oYXJyKSB7XG5cdCAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG5cdCAgICB9LFxuXG5cdCAgICByZWplY3RhdHRyOiBmdW5jdGlvbihhcnIsIGF0dHIpIHtcblx0ICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcblx0ICAgICAgICByZXR1cm4gIWl0ZW1bYXR0cl07XG5cdCAgICAgIH0pO1xuXHQgICAgfSxcblxuXHQgICAgc2VsZWN0YXR0cjogZnVuY3Rpb24oYXJyLCBhdHRyKSB7XG5cdCAgICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG5cdCAgICAgICAgcmV0dXJuICEhaXRlbVthdHRyXTtcblx0ICAgICAgfSk7XG5cdCAgICB9LFxuXG5cdCAgICByZXBsYWNlOiBmdW5jdGlvbihzdHIsIG9sZCwgbmV3XywgbWF4Q291bnQpIHtcblx0ICAgICAgICB2YXIgb3JpZ2luYWxTdHIgPSBzdHI7XG5cblx0ICAgICAgICBpZiAob2xkIGluc3RhbmNlb2YgUmVnRXhwKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZShvbGQsIG5ld18pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmKHR5cGVvZiBtYXhDb3VudCA9PT0gJ3VuZGVmaW5lZCcpe1xuXHQgICAgICAgICAgICBtYXhDb3VudCA9IC0xO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciByZXMgPSAnJzsgIC8vIE91dHB1dFxuXG5cdCAgICAgICAgLy8gQ2FzdCBOdW1iZXJzIGluIHRoZSBzZWFyY2ggdGVybSB0byBzdHJpbmdcblx0ICAgICAgICBpZih0eXBlb2Ygb2xkID09PSAnbnVtYmVyJyl7XG5cdCAgICAgICAgICAgIG9sZCA9IG9sZCArICcnO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIGlmKHR5cGVvZiBvbGQgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIC8vIElmIGl0IGlzIHNvbWV0aGluZyBvdGhlciB0aGFuIG51bWJlciBvciBzdHJpbmcsXG5cdCAgICAgICAgICAgIC8vIHJldHVybiB0aGUgb3JpZ2luYWwgc3RyaW5nXG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gQ2FzdCBudW1iZXJzIGluIHRoZSByZXBsYWNlbWVudCB0byBzdHJpbmdcblx0ICAgICAgICBpZih0eXBlb2Ygc3RyID09PSAnbnVtYmVyJyl7XG5cdCAgICAgICAgICAgIHN0ciA9IHN0ciArICcnO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIElmIGJ5IG5vdywgd2UgZG9uJ3QgaGF2ZSBhIHN0cmluZywgdGhyb3cgaXQgYmFja1xuXHQgICAgICAgIGlmKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnICYmICEoc3RyIGluc3RhbmNlb2Ygci5TYWZlU3RyaW5nKSl7XG5cdCAgICAgICAgICAgIHJldHVybiBzdHI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gU2hvcnRDaXJjdWl0c1xuXHQgICAgICAgIGlmKG9sZCA9PT0gJycpe1xuXHQgICAgICAgICAgICAvLyBNaW1pYyB0aGUgcHl0aG9uIGJlaGF2aW91cjogZW1wdHkgc3RyaW5nIGlzIHJlcGxhY2VkXG5cdCAgICAgICAgICAgIC8vIGJ5IHJlcGxhY2VtZW50IGUuZy4gXCJhYmNcInxyZXBsYWNlKFwiXCIsIFwiLlwiKSAtPiAuYS5iLmMuXG5cdCAgICAgICAgICAgIHJlcyA9IG5ld18gKyBzdHIuc3BsaXQoJycpLmpvaW4obmV3XykgKyBuZXdfO1xuXHQgICAgICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXMpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBuZXh0SW5kZXggPSBzdHIuaW5kZXhPZihvbGQpO1xuXHQgICAgICAgIC8vIGlmICMgb2YgcmVwbGFjZW1lbnRzIHRvIHBlcmZvcm0gaXMgMCwgb3IgdGhlIHN0cmluZyB0byBkb2VzXG5cdCAgICAgICAgLy8gbm90IGNvbnRhaW4gdGhlIG9sZCB2YWx1ZSwgcmV0dXJuIHRoZSBzdHJpbmdcblx0ICAgICAgICBpZihtYXhDb3VudCA9PT0gMCB8fCBuZXh0SW5kZXggPT09IC0xKXtcblx0ICAgICAgICAgICAgcmV0dXJuIHN0cjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgcG9zID0gMDtcblx0ICAgICAgICB2YXIgY291bnQgPSAwOyAvLyAjIG9mIHJlcGxhY2VtZW50cyBtYWRlXG5cblx0ICAgICAgICB3aGlsZShuZXh0SW5kZXggID4gLTEgJiYgKG1heENvdW50ID09PSAtMSB8fCBjb3VudCA8IG1heENvdW50KSl7XG5cdCAgICAgICAgICAgIC8vIEdyYWIgdGhlIG5leHQgY2h1bmsgb2Ygc3JjIHN0cmluZyBhbmQgYWRkIGl0IHdpdGggdGhlXG5cdCAgICAgICAgICAgIC8vIHJlcGxhY2VtZW50LCB0byB0aGUgcmVzdWx0XG5cdCAgICAgICAgICAgIHJlcyArPSBzdHIuc3Vic3RyaW5nKHBvcywgbmV4dEluZGV4KSArIG5ld187XG5cdCAgICAgICAgICAgIC8vIEluY3JlbWVudCBvdXIgcG9pbnRlciBpbiB0aGUgc3JjIHN0cmluZ1xuXHQgICAgICAgICAgICBwb3MgPSBuZXh0SW5kZXggKyBvbGQubGVuZ3RoO1xuXHQgICAgICAgICAgICBjb3VudCsrO1xuXHQgICAgICAgICAgICAvLyBTZWUgaWYgdGhlcmUgYXJlIGFueSBtb3JlIHJlcGxhY2VtZW50cyB0byBiZSBtYWRlXG5cdCAgICAgICAgICAgIG5leHRJbmRleCA9IHN0ci5pbmRleE9mKG9sZCwgcG9zKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBXZSd2ZSBlaXRoZXIgcmVhY2hlZCB0aGUgZW5kLCBvciBkb25lIHRoZSBtYXggIyBvZlxuXHQgICAgICAgIC8vIHJlcGxhY2VtZW50cywgdGFjayBvbiBhbnkgcmVtYWluaW5nIHN0cmluZ1xuXHQgICAgICAgIGlmKHBvcyA8IHN0ci5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgcmVzICs9IHN0ci5zdWJzdHJpbmcocG9zKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Mob3JpZ2luYWxTdHIsIHJlcyk7XG5cdCAgICB9LFxuXG5cdCAgICByZXZlcnNlOiBmdW5jdGlvbih2YWwpIHtcblx0ICAgICAgICB2YXIgYXJyO1xuXHQgICAgICAgIGlmKGxpYi5pc1N0cmluZyh2YWwpKSB7XG5cdCAgICAgICAgICAgIGFyciA9IGZpbHRlcnMubGlzdCh2YWwpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgLy8gQ29weSBpdFxuXHQgICAgICAgICAgICBhcnIgPSBsaWIubWFwKHZhbCwgZnVuY3Rpb24odikgeyByZXR1cm4gdjsgfSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgYXJyLnJldmVyc2UoKTtcblxuXHQgICAgICAgIGlmKGxpYi5pc1N0cmluZyh2YWwpKSB7XG5cdCAgICAgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyh2YWwsIGFyci5qb2luKCcnKSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBhcnI7XG5cdCAgICB9LFxuXG5cdCAgICByb3VuZDogZnVuY3Rpb24odmFsLCBwcmVjaXNpb24sIG1ldGhvZCkge1xuXHQgICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbiB8fCAwO1xuXHQgICAgICAgIHZhciBmYWN0b3IgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKTtcblx0ICAgICAgICB2YXIgcm91bmRlcjtcblxuXHQgICAgICAgIGlmKG1ldGhvZCA9PT0gJ2NlaWwnKSB7XG5cdCAgICAgICAgICAgIHJvdW5kZXIgPSBNYXRoLmNlaWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYobWV0aG9kID09PSAnZmxvb3InKSB7XG5cdCAgICAgICAgICAgIHJvdW5kZXIgPSBNYXRoLmZsb29yO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgcm91bmRlciA9IE1hdGgucm91bmQ7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHJvdW5kZXIodmFsICogZmFjdG9yKSAvIGZhY3Rvcjtcblx0ICAgIH0sXG5cblx0ICAgIHNsaWNlOiBmdW5jdGlvbihhcnIsIHNsaWNlcywgZmlsbFdpdGgpIHtcblx0ICAgICAgICB2YXIgc2xpY2VMZW5ndGggPSBNYXRoLmZsb29yKGFyci5sZW5ndGggLyBzbGljZXMpO1xuXHQgICAgICAgIHZhciBleHRyYSA9IGFyci5sZW5ndGggJSBzbGljZXM7XG5cdCAgICAgICAgdmFyIG9mZnNldCA9IDA7XG5cdCAgICAgICAgdmFyIHJlcyA9IFtdO1xuXG5cdCAgICAgICAgZm9yKHZhciBpPTA7IGk8c2xpY2VzOyBpKyspIHtcblx0ICAgICAgICAgICAgdmFyIHN0YXJ0ID0gb2Zmc2V0ICsgaSAqIHNsaWNlTGVuZ3RoO1xuXHQgICAgICAgICAgICBpZihpIDwgZXh0cmEpIHtcblx0ICAgICAgICAgICAgICAgIG9mZnNldCsrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHZhciBlbmQgPSBvZmZzZXQgKyAoaSArIDEpICogc2xpY2VMZW5ndGg7XG5cblx0ICAgICAgICAgICAgdmFyIHNsaWNlID0gYXJyLnNsaWNlKHN0YXJ0LCBlbmQpO1xuXHQgICAgICAgICAgICBpZihmaWxsV2l0aCAmJiBpID49IGV4dHJhKSB7XG5cdCAgICAgICAgICAgICAgICBzbGljZS5wdXNoKGZpbGxXaXRoKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXMucHVzaChzbGljZSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHJlcztcblx0ICAgIH0sXG5cblx0ICAgIHN1bTogZnVuY3Rpb24oYXJyLCBhdHRyLCBzdGFydCkge1xuXHQgICAgICAgIHZhciBzdW0gPSAwO1xuXG5cdCAgICAgICAgaWYodHlwZW9mIHN0YXJ0ID09PSAnbnVtYmVyJyl7XG5cdCAgICAgICAgICAgIHN1bSArPSBzdGFydDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZihhdHRyKSB7XG5cdCAgICAgICAgICAgIGFyciA9IGxpYi5tYXAoYXJyLCBmdW5jdGlvbih2KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdlthdHRyXTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICBzdW0gKz0gYXJyW2ldO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBzdW07XG5cdCAgICB9LFxuXG5cdCAgICBzb3J0OiByLm1ha2VNYWNybyhbJ3ZhbHVlJywgJ3JldmVyc2UnLCAnY2FzZV9zZW5zaXRpdmUnLCAnYXR0cmlidXRlJ10sIFtdLCBmdW5jdGlvbihhcnIsIHJldmVyc2UsIGNhc2VTZW5zLCBhdHRyKSB7XG5cdCAgICAgICAgIC8vIENvcHkgaXRcblx0ICAgICAgICBhcnIgPSBsaWIubWFwKGFyciwgZnVuY3Rpb24odikgeyByZXR1cm4gdjsgfSk7XG5cblx0ICAgICAgICBhcnIuc29ydChmdW5jdGlvbihhLCBiKSB7XG5cdCAgICAgICAgICAgIHZhciB4LCB5O1xuXG5cdCAgICAgICAgICAgIGlmKGF0dHIpIHtcblx0ICAgICAgICAgICAgICAgIHggPSBhW2F0dHJdO1xuXHQgICAgICAgICAgICAgICAgeSA9IGJbYXR0cl07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICB4ID0gYTtcblx0ICAgICAgICAgICAgICAgIHkgPSBiO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYoIWNhc2VTZW5zICYmIGxpYi5pc1N0cmluZyh4KSAmJiBsaWIuaXNTdHJpbmcoeSkpIHtcblx0ICAgICAgICAgICAgICAgIHggPSB4LnRvTG93ZXJDYXNlKCk7XG5cdCAgICAgICAgICAgICAgICB5ID0geS50b0xvd2VyQ2FzZSgpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYoeCA8IHkpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiByZXZlcnNlID8gMSA6IC0xO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYoeCA+IHkpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiByZXZlcnNlID8gLTE6IDE7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gMDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgcmV0dXJuIGFycjtcblx0ICAgIH0pLFxuXG5cdCAgICBzdHJpbmc6IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhvYmosIG9iaik7XG5cdCAgICB9LFxuXG5cdCAgICBzdHJpcHRhZ3M6IGZ1bmN0aW9uKGlucHV0LCBwcmVzZXJ2ZV9saW5lYnJlYWtzKSB7XG5cdCAgICAgICAgaW5wdXQgPSBub3JtYWxpemUoaW5wdXQsICcnKTtcblx0ICAgICAgICBwcmVzZXJ2ZV9saW5lYnJlYWtzID0gcHJlc2VydmVfbGluZWJyZWFrcyB8fCBmYWxzZTtcblx0ICAgICAgICB2YXIgdGFncyA9IC88XFwvPyhbYS16XVthLXowLTldKilcXGJbXj5dKj58PCEtLVtcXHNcXFNdKj8tLT4vZ2k7XG5cdCAgICAgICAgdmFyIHRyaW1tZWRJbnB1dCA9IGZpbHRlcnMudHJpbShpbnB1dC5yZXBsYWNlKHRhZ3MsICcnKSk7XG5cdCAgICAgICAgdmFyIHJlcyA9ICcnO1xuXHQgICAgICAgIGlmIChwcmVzZXJ2ZV9saW5lYnJlYWtzKSB7XG5cdCAgICAgICAgICAgIHJlcyA9IHRyaW1tZWRJbnB1dFxuXHQgICAgICAgICAgICAgICAgLnJlcGxhY2UoL14gK3wgKyQvZ20sICcnKSAgICAgLy8gcmVtb3ZlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNwYWNlc1xuXHQgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyArL2csICcgJykgICAgICAgICAgLy8gc3F1YXNoIGFkamFjZW50IHNwYWNlc1xuXHQgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhcXHJcXG4pL2csICdcXG4nKSAgICAgLy8gbm9ybWFsaXplIGxpbmVicmVha3MgKENSTEYgLT4gTEYpXG5cdCAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxuXFxuXFxuKy9nLCAnXFxuXFxuJyk7IC8vIHNxdWFzaCBhYm5vcm1hbCBhZGphY2VudCBsaW5lYnJlYWtzXG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgcmVzID0gdHJpbW1lZElucHV0LnJlcGxhY2UoL1xccysvZ2ksICcgJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhpbnB1dCwgcmVzKTtcblx0ICAgIH0sXG5cblx0ICAgIHRpdGxlOiBmdW5jdGlvbihzdHIpIHtcblx0ICAgICAgICBzdHIgPSBub3JtYWxpemUoc3RyLCAnJyk7XG5cdCAgICAgICAgdmFyIHdvcmRzID0gc3RyLnNwbGl0KCcgJyk7XG5cdCAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHdvcmRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIHdvcmRzW2ldID0gZmlsdGVycy5jYXBpdGFsaXplKHdvcmRzW2ldKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgd29yZHMuam9pbignICcpKTtcblx0ICAgIH0sXG5cblx0ICAgIHRyaW06IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHN0ci5yZXBsYWNlKC9eXFxzKnxcXHMqJC9nLCAnJykpO1xuXHQgICAgfSxcblxuXHQgICAgdHJ1bmNhdGU6IGZ1bmN0aW9uKGlucHV0LCBsZW5ndGgsIGtpbGx3b3JkcywgZW5kKSB7XG5cdCAgICAgICAgdmFyIG9yaWcgPSBpbnB1dDtcblx0ICAgICAgICBpbnB1dCA9IG5vcm1hbGl6ZShpbnB1dCwgJycpO1xuXHQgICAgICAgIGxlbmd0aCA9IGxlbmd0aCB8fCAyNTU7XG5cblx0ICAgICAgICBpZiAoaW5wdXQubGVuZ3RoIDw9IGxlbmd0aClcblx0ICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuXG5cdCAgICAgICAgaWYgKGtpbGx3b3Jkcykge1xuXHQgICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cmluZygwLCBsZW5ndGgpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBpZHggPSBpbnB1dC5sYXN0SW5kZXhPZignICcsIGxlbmd0aCk7XG5cdCAgICAgICAgICAgIGlmKGlkeCA9PT0gLTEpIHtcblx0ICAgICAgICAgICAgICAgIGlkeCA9IGxlbmd0aDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyaW5nKDAsIGlkeCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaW5wdXQgKz0gKGVuZCAhPT0gdW5kZWZpbmVkICYmIGVuZCAhPT0gbnVsbCkgPyBlbmQgOiAnLi4uJztcblx0ICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Mob3JpZywgaW5wdXQpO1xuXHQgICAgfSxcblxuXHQgICAgdXBwZXI6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICByZXR1cm4gc3RyLnRvVXBwZXJDYXNlKCk7XG5cdCAgICB9LFxuXG5cdCAgICB1cmxlbmNvZGU6IGZ1bmN0aW9uKG9iaikge1xuXHQgICAgICAgIHZhciBlbmMgPSBlbmNvZGVVUklDb21wb25lbnQ7XG5cdCAgICAgICAgaWYgKGxpYi5pc1N0cmluZyhvYmopKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBlbmMob2JqKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICB2YXIgcGFydHM7XG5cdCAgICAgICAgICAgIGlmIChsaWIuaXNBcnJheShvYmopKSB7XG5cdCAgICAgICAgICAgICAgICBwYXJ0cyA9IG9iai5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmMoaXRlbVswXSkgKyAnPScgKyBlbmMoaXRlbVsxXSk7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHBhcnRzID0gW107XG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluIG9iaikge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcGFydHMucHVzaChlbmMoaykgKyAnPScgKyBlbmMob2JqW2tdKSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBwYXJ0cy5qb2luKCcmJyk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgdXJsaXplOiBmdW5jdGlvbihzdHIsIGxlbmd0aCwgbm9mb2xsb3cpIHtcblx0ICAgICAgICBpZiAoaXNOYU4obGVuZ3RoKSkgbGVuZ3RoID0gSW5maW5pdHk7XG5cblx0ICAgICAgICB2YXIgbm9Gb2xsb3dBdHRyID0gKG5vZm9sbG93ID09PSB0cnVlID8gJyByZWw9XCJub2ZvbGxvd1wiJyA6ICcnKTtcblxuXHQgICAgICAgIC8vIEZvciB0aGUgamluamEgcmVnZXhwLCBzZWVcblx0ICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWl0c3VoaWtvL2ppbmphMi9ibG9iL2YxNWI4MTRkY2JhNmFhMTJiYzc0ZDFmN2QwYzg4MWQ1NWY3MTI2YmUvamluamEyL3V0aWxzLnB5I0wyMC1MMjNcblx0ICAgICAgICB2YXIgcHVuY1JFID0gL14oPzpcXCh8PHwmbHQ7KT8oLio/KSg/OlxcLnwsfFxcKXxcXG58Jmd0Oyk/JC87XG5cdCAgICAgICAgLy8gZnJvbSBodHRwOi8vYmxvZy5nZXJ2Lm5ldC8yMDExLzA1L2h0bWw1X2VtYWlsX2FkZHJlc3NfcmVnZXhwL1xuXHQgICAgICAgIHZhciBlbWFpbFJFID0gL15bXFx3LiEjJCUmJyorXFwtXFwvPT9cXF5ge3x9fl0rQFthLXpcXGRcXC1dKyhcXC5bYS16XFxkXFwtXSspKyQvaTtcblx0ICAgICAgICB2YXIgaHR0cEh0dHBzUkUgPSAvXmh0dHBzPzpcXC9cXC8uKiQvO1xuXHQgICAgICAgIHZhciB3d3dSRSA9IC9ed3d3XFwuLztcblx0ICAgICAgICB2YXIgdGxkUkUgPSAvXFwuKD86b3JnfG5ldHxjb20pKD86XFw6fFxcL3wkKS87XG5cblx0ICAgICAgICB2YXIgd29yZHMgPSBzdHIuc3BsaXQoLyhcXHMrKS8pLmZpbHRlcihmdW5jdGlvbih3b3JkKSB7XG5cdCAgICAgICAgICAvLyBJZiB0aGUgd29yZCBoYXMgbm8gbGVuZ3RoLCBiYWlsLiBUaGlzIGNhbiBoYXBwZW4gZm9yIHN0ciB3aXRoXG5cdCAgICAgICAgICAvLyB0cmFpbGluZyB3aGl0ZXNwYWNlLlxuXHQgICAgICAgICAgcmV0dXJuIHdvcmQgJiYgd29yZC5sZW5ndGg7XG5cdCAgICAgICAgfSkubWFwKGZ1bmN0aW9uKHdvcmQpIHtcblx0ICAgICAgICAgIHZhciBtYXRjaGVzID0gd29yZC5tYXRjaChwdW5jUkUpO1xuXHQgICAgICAgICAgdmFyIHBvc3NpYmxlVXJsID0gbWF0Y2hlcyAmJiBtYXRjaGVzWzFdIHx8IHdvcmQ7XG5cblx0ICAgICAgICAgIC8vIHVybCB0aGF0IHN0YXJ0cyB3aXRoIGh0dHAgb3IgaHR0cHNcblx0ICAgICAgICAgIGlmIChodHRwSHR0cHNSRS50ZXN0KHBvc3NpYmxlVXJsKSlcblx0ICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiJyArIHBvc3NpYmxlVXJsICsgJ1wiJyArIG5vRm9sbG93QXR0ciArICc+JyArIHBvc3NpYmxlVXJsLnN1YnN0cigwLCBsZW5ndGgpICsgJzwvYT4nO1xuXG5cdCAgICAgICAgICAvLyB1cmwgdGhhdCBzdGFydHMgd2l0aCB3d3cuXG5cdCAgICAgICAgICBpZiAod3d3UkUudGVzdChwb3NzaWJsZVVybCkpXG5cdCAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly8nICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIC8vIGFuIGVtYWlsIGFkZHJlc3Mgb2YgdGhlIGZvcm0gdXNlcm5hbWVAZG9tYWluLnRsZFxuXHQgICAgICAgICAgaWYgKGVtYWlsUkUudGVzdChwb3NzaWJsZVVybCkpXG5cdCAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cIm1haWx0bzonICsgcG9zc2libGVVcmwgKyAnXCI+JyArIHBvc3NpYmxlVXJsICsgJzwvYT4nO1xuXG5cdCAgICAgICAgICAvLyB1cmwgdGhhdCBlbmRzIGluIC5jb20sIC5vcmcgb3IgLm5ldCB0aGF0IGlzIG5vdCBhbiBlbWFpbCBhZGRyZXNzXG5cdCAgICAgICAgICBpZiAodGxkUkUudGVzdChwb3NzaWJsZVVybCkpXG5cdCAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly8nICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cblx0ICAgICAgICAgIHJldHVybiB3b3JkO1xuXG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gd29yZHMuam9pbignJyk7XG5cdCAgICB9LFxuXG5cdCAgICB3b3JkY291bnQ6IGZ1bmN0aW9uKHN0cikge1xuXHQgICAgICAgIHN0ciA9IG5vcm1hbGl6ZShzdHIsICcnKTtcblx0ICAgICAgICB2YXIgd29yZHMgPSAoc3RyKSA/IHN0ci5tYXRjaCgvXFx3Ky9nKSA6IG51bGw7XG5cdCAgICAgICAgcmV0dXJuICh3b3JkcykgPyB3b3Jkcy5sZW5ndGggOiBudWxsO1xuXHQgICAgfSxcblxuXHQgICAgJ2Zsb2F0JzogZnVuY3Rpb24odmFsLCBkZWYpIHtcblx0ICAgICAgICB2YXIgcmVzID0gcGFyc2VGbG9hdCh2YWwpO1xuXHQgICAgICAgIHJldHVybiBpc05hTihyZXMpID8gZGVmIDogcmVzO1xuXHQgICAgfSxcblxuXHQgICAgJ2ludCc6IGZ1bmN0aW9uKHZhbCwgZGVmKSB7XG5cdCAgICAgICAgdmFyIHJlcyA9IHBhcnNlSW50KHZhbCwgMTApO1xuXHQgICAgICAgIHJldHVybiBpc05hTihyZXMpID8gZGVmIDogcmVzO1xuXHQgICAgfVxuXHR9O1xuXG5cdC8vIEFsaWFzZXNcblx0ZmlsdGVycy5kID0gZmlsdGVyc1snZGVmYXVsdCddO1xuXHRmaWx0ZXJzLmUgPSBmaWx0ZXJzLmVzY2FwZTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IGZpbHRlcnM7XG5cblxuLyoqKi8gfSksXG4vKiA4ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBsaWIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXHR2YXIgT2JqID0gX193ZWJwYWNrX3JlcXVpcmVfXyg2KTtcblxuXHQvLyBGcmFtZXMga2VlcCB0cmFjayBvZiBzY29waW5nIGJvdGggYXQgY29tcGlsZS10aW1lIGFuZCBydW4tdGltZSBzb1xuXHQvLyB3ZSBrbm93IGhvdyB0byBhY2Nlc3MgdmFyaWFibGVzLiBCbG9jayB0YWdzIGNhbiBpbnRyb2R1Y2Ugc3BlY2lhbFxuXHQvLyB2YXJpYWJsZXMsIGZvciBleGFtcGxlLlxuXHR2YXIgRnJhbWUgPSBPYmouZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uKHBhcmVudCwgaXNvbGF0ZVdyaXRlcykge1xuXHQgICAgICAgIHRoaXMudmFyaWFibGVzID0ge307XG5cdCAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG5cdCAgICAgICAgdGhpcy50b3BMZXZlbCA9IGZhbHNlO1xuXHQgICAgICAgIC8vIGlmIHRoaXMgaXMgdHJ1ZSwgd3JpdGVzIChzZXQpIHNob3VsZCBuZXZlciBwcm9wYWdhdGUgdXB3YXJkcyBwYXN0XG5cdCAgICAgICAgLy8gdGhpcyBmcmFtZSB0byBpdHMgcGFyZW50ICh0aG91Z2ggcmVhZHMgbWF5KS5cblx0ICAgICAgICB0aGlzLmlzb2xhdGVXcml0ZXMgPSBpc29sYXRlV3JpdGVzO1xuXHQgICAgfSxcblxuXHQgICAgc2V0OiBmdW5jdGlvbihuYW1lLCB2YWwsIHJlc29sdmVVcCkge1xuXHQgICAgICAgIC8vIEFsbG93IHZhcmlhYmxlcyB3aXRoIGRvdHMgYnkgYXV0b21hdGljYWxseSBjcmVhdGluZyB0aGVcblx0ICAgICAgICAvLyBuZXN0ZWQgc3RydWN0dXJlXG5cdCAgICAgICAgdmFyIHBhcnRzID0gbmFtZS5zcGxpdCgnLicpO1xuXHQgICAgICAgIHZhciBvYmogPSB0aGlzLnZhcmlhYmxlcztcblx0ICAgICAgICB2YXIgZnJhbWUgPSB0aGlzO1xuXG5cdCAgICAgICAgaWYocmVzb2x2ZVVwKSB7XG5cdCAgICAgICAgICAgIGlmKChmcmFtZSA9IHRoaXMucmVzb2x2ZShwYXJ0c1swXSwgdHJ1ZSkpKSB7XG5cdCAgICAgICAgICAgICAgICBmcmFtZS5zZXQobmFtZSwgdmFsKTtcblx0ICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZvcih2YXIgaT0wOyBpPHBhcnRzLmxlbmd0aCAtIDE7IGkrKykge1xuXHQgICAgICAgICAgICB2YXIgaWQgPSBwYXJ0c1tpXTtcblxuXHQgICAgICAgICAgICBpZighb2JqW2lkXSkge1xuXHQgICAgICAgICAgICAgICAgb2JqW2lkXSA9IHt9O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIG9iaiA9IG9ialtpZF07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgb2JqW3BhcnRzW3BhcnRzLmxlbmd0aCAtIDFdXSA9IHZhbDtcblx0ICAgIH0sXG5cblx0ICAgIGdldDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHZhciB2YWwgPSB0aGlzLnZhcmlhYmxlc1tuYW1lXTtcblx0ICAgICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFsO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gbnVsbDtcblx0ICAgIH0sXG5cblx0ICAgIGxvb2t1cDogZnVuY3Rpb24obmFtZSkge1xuXHQgICAgICAgIHZhciBwID0gdGhpcy5wYXJlbnQ7XG5cdCAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuXHQgICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBwICYmIHAubG9va3VwKG5hbWUpO1xuXHQgICAgfSxcblxuXHQgICAgcmVzb2x2ZTogZnVuY3Rpb24obmFtZSwgZm9yV3JpdGUpIHtcblx0ICAgICAgICB2YXIgcCA9IChmb3JXcml0ZSAmJiB0aGlzLmlzb2xhdGVXcml0ZXMpID8gdW5kZWZpbmVkIDogdGhpcy5wYXJlbnQ7XG5cdCAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuXHQgICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gcCAmJiBwLnJlc29sdmUobmFtZSk7XG5cdCAgICB9LFxuXG5cdCAgICBwdXNoOiBmdW5jdGlvbihpc29sYXRlV3JpdGVzKSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyBGcmFtZSh0aGlzLCBpc29sYXRlV3JpdGVzKTtcblx0ICAgIH0sXG5cblx0ICAgIHBvcDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50O1xuXHQgICAgfVxuXHR9KTtcblxuXHRmdW5jdGlvbiBtYWtlTWFjcm8oYXJnTmFtZXMsIGt3YXJnTmFtZXMsIGZ1bmMpIHtcblx0ICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgYXJnQ291bnQgPSBudW1BcmdzKGFyZ3VtZW50cyk7XG5cdCAgICAgICAgdmFyIGFyZ3M7XG5cdCAgICAgICAgdmFyIGt3YXJncyA9IGdldEtleXdvcmRBcmdzKGFyZ3VtZW50cyk7XG5cdCAgICAgICAgdmFyIGk7XG5cblx0ICAgICAgICBpZihhcmdDb3VudCA+IGFyZ05hbWVzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBhcmdOYW1lcy5sZW5ndGgpO1xuXG5cdCAgICAgICAgICAgIC8vIFBvc2l0aW9uYWwgYXJndW1lbnRzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCBpbiBhc1xuXHQgICAgICAgICAgICAvLyBrZXl3b3JkIGFyZ3VtZW50cyAoZXNzZW50aWFsbHkgZGVmYXVsdCB2YWx1ZXMpXG5cdCAgICAgICAgICAgIHZhciB2YWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCBhcmdzLmxlbmd0aCwgYXJnQ291bnQpO1xuXHQgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCB2YWxzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBpZihpIDwga3dhcmdOYW1lcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgICAgICBrd2FyZ3Nba3dhcmdOYW1lc1tpXV0gPSB2YWxzW2ldO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgYXJncy5wdXNoKGt3YXJncyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2UgaWYoYXJnQ291bnQgPCBhcmdOYW1lcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgYXJnQ291bnQpO1xuXG5cdCAgICAgICAgICAgIGZvcihpID0gYXJnQ291bnQ7IGkgPCBhcmdOYW1lcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ05hbWVzW2ldO1xuXG5cdCAgICAgICAgICAgICAgICAvLyBLZXl3b3JkIGFyZ3VtZW50cyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgYXNcblx0ICAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uYWwgYXJndW1lbnRzLCBpLmUuIHRoZSBjYWxsZXIgZXhwbGljaXRseVxuXHQgICAgICAgICAgICAgICAgLy8gdXNlZCB0aGUgbmFtZSBvZiBhIHBvc2l0aW9uYWwgYXJnXG5cdCAgICAgICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzW2FyZ10pO1xuXHQgICAgICAgICAgICAgICAgZGVsZXRlIGt3YXJnc1thcmddO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgYXJncy5wdXNoKGt3YXJncyk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGVsc2Uge1xuXHQgICAgICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHQgICAgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIG1ha2VLZXl3b3JkQXJncyhvYmopIHtcblx0ICAgIG9iai5fX2tleXdvcmRzID0gdHJ1ZTtcblx0ICAgIHJldHVybiBvYmo7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRLZXl3b3JkQXJncyhhcmdzKSB7XG5cdCAgICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG5cdCAgICBpZihsZW4pIHtcblx0ICAgICAgICB2YXIgbGFzdEFyZyA9IGFyZ3NbbGVuIC0gMV07XG5cdCAgICAgICAgaWYobGFzdEFyZyAmJiBsYXN0QXJnLmhhc093blByb3BlcnR5KCdfX2tleXdvcmRzJykpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGxhc3RBcmc7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIHt9O1xuXHR9XG5cblx0ZnVuY3Rpb24gbnVtQXJncyhhcmdzKSB7XG5cdCAgICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG5cdCAgICBpZihsZW4gPT09IDApIHtcblx0ICAgICAgICByZXR1cm4gMDtcblx0ICAgIH1cblxuXHQgICAgdmFyIGxhc3RBcmcgPSBhcmdzW2xlbiAtIDFdO1xuXHQgICAgaWYobGFzdEFyZyAmJiBsYXN0QXJnLmhhc093blByb3BlcnR5KCdfX2tleXdvcmRzJykpIHtcblx0ICAgICAgICByZXR1cm4gbGVuIC0gMTtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBsZW47XG5cdCAgICB9XG5cdH1cblxuXHQvLyBBIFNhZmVTdHJpbmcgb2JqZWN0IGluZGljYXRlcyB0aGF0IHRoZSBzdHJpbmcgc2hvdWxkIG5vdCBiZVxuXHQvLyBhdXRvZXNjYXBlZC4gVGhpcyBoYXBwZW5zIG1hZ2ljYWxseSBiZWNhdXNlIGF1dG9lc2NhcGluZyBvbmx5XG5cdC8vIG9jY3VycyBvbiBwcmltaXRpdmUgc3RyaW5nIG9iamVjdHMuXG5cdGZ1bmN0aW9uIFNhZmVTdHJpbmcodmFsKSB7XG5cdCAgICBpZih0eXBlb2YgdmFsICE9PSAnc3RyaW5nJykge1xuXHQgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICB9XG5cblx0ICAgIHRoaXMudmFsID0gdmFsO1xuXHQgICAgdGhpcy5sZW5ndGggPSB2YWwubGVuZ3RoO1xuXHR9XG5cblx0U2FmZVN0cmluZy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFN0cmluZy5wcm90b3R5cGUsIHtcblx0ICAgIGxlbmd0aDogeyB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB2YWx1ZTogMCB9XG5cdH0pO1xuXHRTYWZlU3RyaW5nLnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24oKSB7XG5cdCAgICByZXR1cm4gdGhpcy52YWw7XG5cdH07XG5cdFNhZmVTdHJpbmcucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdCAgICByZXR1cm4gdGhpcy52YWw7XG5cdH07XG5cblx0ZnVuY3Rpb24gY29weVNhZmVuZXNzKGRlc3QsIHRhcmdldCkge1xuXHQgICAgaWYoZGVzdCBpbnN0YW5jZW9mIFNhZmVTdHJpbmcpIHtcblx0ICAgICAgICByZXR1cm4gbmV3IFNhZmVTdHJpbmcodGFyZ2V0KTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB0YXJnZXQudG9TdHJpbmcoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIG1hcmtTYWZlKHZhbCkge1xuXHQgICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuXG5cdCAgICBpZih0eXBlID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyh2YWwpO1xuXHQgICAgfVxuXHQgICAgZWxzZSBpZih0eXBlICE9PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgdmFyIHJldCA9IHZhbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG5cdCAgICAgICAgICAgIGlmKHR5cGVvZiByZXQgPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFNhZmVTdHJpbmcocmV0KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiByZXQ7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIHN1cHByZXNzVmFsdWUodmFsLCBhdXRvZXNjYXBlKSB7XG5cdCAgICB2YWwgPSAodmFsICE9PSB1bmRlZmluZWQgJiYgdmFsICE9PSBudWxsKSA/IHZhbCA6ICcnO1xuXG5cdCAgICBpZihhdXRvZXNjYXBlICYmICEodmFsIGluc3RhbmNlb2YgU2FmZVN0cmluZykpIHtcblx0ICAgICAgICB2YWwgPSBsaWIuZXNjYXBlKHZhbC50b1N0cmluZygpKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHZhbDtcblx0fVxuXG5cdGZ1bmN0aW9uIGVuc3VyZURlZmluZWQodmFsLCBsaW5lbm8sIGNvbG5vKSB7XG5cdCAgICBpZih2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoXG5cdCAgICAgICAgICAgICdhdHRlbXB0ZWQgdG8gb3V0cHV0IG51bGwgb3IgdW5kZWZpbmVkIHZhbHVlJyxcblx0ICAgICAgICAgICAgbGluZW5vICsgMSxcblx0ICAgICAgICAgICAgY29sbm8gKyAxXG5cdCAgICAgICAgKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB2YWw7XG5cdH1cblxuXHRmdW5jdGlvbiBtZW1iZXJMb29rdXAob2JqLCB2YWwpIHtcblx0ICAgIG9iaiA9IG9iaiB8fCB7fTtcblxuXHQgICAgaWYodHlwZW9mIG9ialt2YWxdID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICByZXR1cm4gb2JqW3ZhbF0uYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiBvYmpbdmFsXTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNhbGxXcmFwKG9iaiwgbmFtZSwgY29udGV4dCwgYXJncykge1xuXHQgICAgaWYoIW9iaikge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGNhbGwgYCcgKyBuYW1lICsgJ2AsIHdoaWNoIGlzIHVuZGVmaW5lZCBvciBmYWxzZXknKTtcblx0ICAgIH1cblx0ICAgIGVsc2UgaWYodHlwZW9mIG9iaiAhPT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGNhbGwgYCcgKyBuYW1lICsgJ2AsIHdoaWNoIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG5cdCAgICB9XG5cblx0ICAgIC8vIGpzaGludCB2YWxpZHRoaXM6IHRydWVcblx0ICAgIHJldHVybiBvYmouYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdH1cblxuXHRmdW5jdGlvbiBjb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgbmFtZSkge1xuXHQgICAgdmFyIHZhbCA9IGZyYW1lLmxvb2t1cChuYW1lKTtcblx0ICAgIHJldHVybiAodmFsICE9PSB1bmRlZmluZWQpID9cblx0ICAgICAgICB2YWwgOlxuXHQgICAgICAgIGNvbnRleHQubG9va3VwKG5hbWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlRXJyb3IoZXJyb3IsIGxpbmVubywgY29sbm8pIHtcblx0ICAgIGlmKGVycm9yLmxpbmVubykge1xuXHQgICAgICAgIHJldHVybiBlcnJvcjtcblx0ICAgIH1cblx0ICAgIGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBuZXcgbGliLlRlbXBsYXRlRXJyb3IoZXJyb3IsIGxpbmVubywgY29sbm8pO1xuXHQgICAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gYXN5bmNFYWNoKGFyciwgZGltZW4sIGl0ZXIsIGNiKSB7XG5cdCAgICBpZihsaWIuaXNBcnJheShhcnIpKSB7XG5cdCAgICAgICAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG5cblx0ICAgICAgICBsaWIuYXN5bmNJdGVyKGFyciwgZnVuY3Rpb24oaXRlbSwgaSwgbmV4dCkge1xuXHQgICAgICAgICAgICBzd2l0Y2goZGltZW4pIHtcblx0ICAgICAgICAgICAgY2FzZSAxOiBpdGVyKGl0ZW0sIGksIGxlbiwgbmV4dCk7IGJyZWFrO1xuXHQgICAgICAgICAgICBjYXNlIDI6IGl0ZXIoaXRlbVswXSwgaXRlbVsxXSwgaSwgbGVuLCBuZXh0KTsgYnJlYWs7XG5cdCAgICAgICAgICAgIGNhc2UgMzogaXRlcihpdGVtWzBdLCBpdGVtWzFdLCBpdGVtWzJdLCBpLCBsZW4sIG5leHQpOyBicmVhaztcblx0ICAgICAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgICAgIGl0ZW0ucHVzaChpLCBuZXh0KTtcblx0ICAgICAgICAgICAgICAgIGl0ZXIuYXBwbHkodGhpcywgaXRlbSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9LCBjYik7XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICBsaWIuYXN5bmNGb3IoYXJyLCBmdW5jdGlvbihrZXksIHZhbCwgaSwgbGVuLCBuZXh0KSB7XG5cdCAgICAgICAgICAgIGl0ZXIoa2V5LCB2YWwsIGksIGxlbiwgbmV4dCk7XG5cdCAgICAgICAgfSwgY2IpO1xuXHQgICAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gYXN5bmNBbGwoYXJyLCBkaW1lbiwgZnVuYywgY2IpIHtcblx0ICAgIHZhciBmaW5pc2hlZCA9IDA7XG5cdCAgICB2YXIgbGVuLCBpO1xuXHQgICAgdmFyIG91dHB1dEFycjtcblxuXHQgICAgZnVuY3Rpb24gZG9uZShpLCBvdXRwdXQpIHtcblx0ICAgICAgICBmaW5pc2hlZCsrO1xuXHQgICAgICAgIG91dHB1dEFycltpXSA9IG91dHB1dDtcblxuXHQgICAgICAgIGlmKGZpbmlzaGVkID09PSBsZW4pIHtcblx0ICAgICAgICAgICAgY2IobnVsbCwgb3V0cHV0QXJyLmpvaW4oJycpKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGlmKGxpYi5pc0FycmF5KGFycikpIHtcblx0ICAgICAgICBsZW4gPSBhcnIubGVuZ3RoO1xuXHQgICAgICAgIG91dHB1dEFyciA9IG5ldyBBcnJheShsZW4pO1xuXG5cdCAgICAgICAgaWYobGVuID09PSAwKSB7XG5cdCAgICAgICAgICAgIGNiKG51bGwsICcnKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgZWxzZSB7XG5cdCAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSBhcnJbaV07XG5cblx0ICAgICAgICAgICAgICAgIHN3aXRjaChkaW1lbikge1xuXHQgICAgICAgICAgICAgICAgY2FzZSAxOiBmdW5jKGl0ZW0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgY2FzZSAyOiBmdW5jKGl0ZW1bMF0sIGl0ZW1bMV0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgY2FzZSAzOiBmdW5jKGl0ZW1bMF0sIGl0ZW1bMV0sIGl0ZW1bMl0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgICAgICAgICBpdGVtLnB1c2goaSwgZG9uZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgLy8ganNoaW50IHZhbGlkdGhpczogdHJ1ZVxuXHQgICAgICAgICAgICAgICAgICAgIGZ1bmMuYXBwbHkodGhpcywgaXRlbSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICB9XG5cdCAgICBlbHNlIHtcblx0ICAgICAgICB2YXIga2V5cyA9IGxpYi5rZXlzKGFycik7XG5cdCAgICAgICAgbGVuID0ga2V5cy5sZW5ndGg7XG5cdCAgICAgICAgb3V0cHV0QXJyID0gbmV3IEFycmF5KGxlbik7XG5cblx0ICAgICAgICBpZihsZW4gPT09IDApIHtcblx0ICAgICAgICAgICAgY2IobnVsbCwgJycpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBlbHNlIHtcblx0ICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgdmFyIGsgPSBrZXlzW2ldO1xuXHQgICAgICAgICAgICAgICAgZnVuYyhrLCBhcnJba10sIGksIGxlbiwgZG9uZSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICB9XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IHtcblx0ICAgIEZyYW1lOiBGcmFtZSxcblx0ICAgIG1ha2VNYWNybzogbWFrZU1hY3JvLFxuXHQgICAgbWFrZUtleXdvcmRBcmdzOiBtYWtlS2V5d29yZEFyZ3MsXG5cdCAgICBudW1BcmdzOiBudW1BcmdzLFxuXHQgICAgc3VwcHJlc3NWYWx1ZTogc3VwcHJlc3NWYWx1ZSxcblx0ICAgIGVuc3VyZURlZmluZWQ6IGVuc3VyZURlZmluZWQsXG5cdCAgICBtZW1iZXJMb29rdXA6IG1lbWJlckxvb2t1cCxcblx0ICAgIGNvbnRleHRPckZyYW1lTG9va3VwOiBjb250ZXh0T3JGcmFtZUxvb2t1cCxcblx0ICAgIGNhbGxXcmFwOiBjYWxsV3JhcCxcblx0ICAgIGhhbmRsZUVycm9yOiBoYW5kbGVFcnJvcixcblx0ICAgIGlzQXJyYXk6IGxpYi5pc0FycmF5LFxuXHQgICAga2V5czogbGliLmtleXMsXG5cdCAgICBTYWZlU3RyaW5nOiBTYWZlU3RyaW5nLFxuXHQgICAgY29weVNhZmVuZXNzOiBjb3B5U2FmZW5lc3MsXG5cdCAgICBtYXJrU2FmZTogbWFya1NhZmUsXG5cdCAgICBhc3luY0VhY2g6IGFzeW5jRWFjaCxcblx0ICAgIGFzeW5jQWxsOiBhc3luY0FsbCxcblx0ICAgIGluT3BlcmF0b3I6IGxpYi5pbk9wZXJhdG9yXG5cdH07XG5cblxuLyoqKi8gfSksXG4vKiA5ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGZ1bmN0aW9uIGN5Y2xlcihpdGVtcykge1xuXHQgICAgdmFyIGluZGV4ID0gLTE7XG5cblx0ICAgIHJldHVybiB7XG5cdCAgICAgICAgY3VycmVudDogbnVsbCxcblx0ICAgICAgICByZXNldDogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIGluZGV4ID0gLTE7XG5cdCAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IG51bGw7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICBpbmRleCsrO1xuXHQgICAgICAgICAgICBpZihpbmRleCA+PSBpdGVtcy5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgIGluZGV4ID0gMDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IGl0ZW1zW2luZGV4XTtcblx0ICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudDtcblx0ICAgICAgICB9LFxuXHQgICAgfTtcblxuXHR9XG5cblx0ZnVuY3Rpb24gam9pbmVyKHNlcCkge1xuXHQgICAgc2VwID0gc2VwIHx8ICcsJztcblx0ICAgIHZhciBmaXJzdCA9IHRydWU7XG5cblx0ICAgIHJldHVybiBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgdmFsID0gZmlyc3QgPyAnJyA6IHNlcDtcblx0ICAgICAgICBmaXJzdCA9IGZhbHNlO1xuXHQgICAgICAgIHJldHVybiB2YWw7XG5cdCAgICB9O1xuXHR9XG5cblx0Ly8gTWFraW5nIHRoaXMgYSBmdW5jdGlvbiBpbnN0ZWFkIHNvIGl0IHJldHVybnMgYSBuZXcgb2JqZWN0XG5cdC8vIGVhY2ggdGltZSBpdCdzIGNhbGxlZC4gVGhhdCB3YXksIGlmIHNvbWV0aGluZyBsaWtlIGFuIGVudmlyb25tZW50XG5cdC8vIHVzZXMgaXQsIHRoZXkgd2lsbCBlYWNoIGhhdmUgdGhlaXIgb3duIGNvcHkuXG5cdGZ1bmN0aW9uIGdsb2JhbHMoKSB7XG5cdCAgICByZXR1cm4ge1xuXHQgICAgICAgIHJhbmdlOiBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuXHQgICAgICAgICAgICBpZih0eXBlb2Ygc3RvcCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgICAgICAgIHN0b3AgPSBzdGFydDtcblx0ICAgICAgICAgICAgICAgIHN0YXJ0ID0gMDtcblx0ICAgICAgICAgICAgICAgIHN0ZXAgPSAxO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGVsc2UgaWYoIXN0ZXApIHtcblx0ICAgICAgICAgICAgICAgIHN0ZXAgPSAxO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdmFyIGFyciA9IFtdO1xuXHQgICAgICAgICAgICB2YXIgaTtcblx0ICAgICAgICAgICAgaWYgKHN0ZXAgPiAwKSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKGk9c3RhcnQ7IGk8c3RvcDsgaSs9c3RlcCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGFyci5wdXNoKGkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgZm9yIChpPXN0YXJ0OyBpPnN0b3A7IGkrPXN0ZXApIHtcblx0ICAgICAgICAgICAgICAgICAgICBhcnIucHVzaChpKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gYXJyO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvLyBsaXBzdW06IGZ1bmN0aW9uKG4sIGh0bWwsIG1pbiwgbWF4KSB7XG5cdCAgICAgICAgLy8gfSxcblxuXHQgICAgICAgIGN5Y2xlcjogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBjeWNsZXIoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIGpvaW5lcjogZnVuY3Rpb24oc2VwKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBqb2luZXIoc2VwKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxzO1xuXG5cbi8qKiovIH0pLFxuLyogMTAgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHR2YXIgX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXywgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX187LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovKGZ1bmN0aW9uKHNldEltbWVkaWF0ZSwgcHJvY2Vzcykgey8vIE1JVCBsaWNlbnNlIChieSBFbGFuIFNoYW5rZXIpLlxuXHQoZnVuY3Rpb24oZ2xvYmFscykge1xuXHQgICd1c2Ugc3RyaWN0JztcblxuXHQgIHZhciBleGVjdXRlU3luYyA9IGZ1bmN0aW9uKCl7XG5cdCAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cdCAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdmdW5jdGlvbicpe1xuXHQgICAgICBhcmdzWzBdLmFwcGx5KG51bGwsIGFyZ3Muc3BsaWNlKDEpKTtcblx0ICAgIH1cblx0ICB9O1xuXG5cdCAgdmFyIGV4ZWN1dGVBc3luYyA9IGZ1bmN0aW9uKGZuKXtcblx0ICAgIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgIHNldEltbWVkaWF0ZShmbik7XG5cdCAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG5cdCAgICAgIHByb2Nlc3MubmV4dFRpY2soZm4pO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgc2V0VGltZW91dChmbiwgMCk7XG5cdCAgICB9XG5cdCAgfTtcblxuXHQgIHZhciBtYWtlSXRlcmF0b3IgPSBmdW5jdGlvbiAodGFza3MpIHtcblx0ICAgIHZhciBtYWtlQ2FsbGJhY2sgPSBmdW5jdGlvbiAoaW5kZXgpIHtcblx0ICAgICAgdmFyIGZuID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIGlmICh0YXNrcy5sZW5ndGgpIHtcblx0ICAgICAgICAgIHRhc2tzW2luZGV4XS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gZm4ubmV4dCgpO1xuXHQgICAgICB9O1xuXHQgICAgICBmbi5uZXh0ID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIHJldHVybiAoaW5kZXggPCB0YXNrcy5sZW5ndGggLSAxKSA/IG1ha2VDYWxsYmFjayhpbmRleCArIDEpOiBudWxsO1xuXHQgICAgICB9O1xuXHQgICAgICByZXR1cm4gZm47XG5cdCAgICB9O1xuXHQgICAgcmV0dXJuIG1ha2VDYWxsYmFjaygwKTtcblx0ICB9O1xuXHQgIFxuXHQgIHZhciBfaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24obWF5YmVBcnJheSl7XG5cdCAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG1heWJlQXJyYXkpID09PSAnW29iamVjdCBBcnJheV0nO1xuXHQgIH07XG5cblx0ICB2YXIgd2F0ZXJmYWxsID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaywgZm9yY2VBc3luYykge1xuXHQgICAgdmFyIG5leHRUaWNrID0gZm9yY2VBc3luYyA/IGV4ZWN1dGVBc3luYyA6IGV4ZWN1dGVTeW5jO1xuXHQgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbiAoKSB7fTtcblx0ICAgIGlmICghX2lzQXJyYXkodGFza3MpKSB7XG5cdCAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IHRvIHdhdGVyZmFsbCBtdXN0IGJlIGFuIGFycmF5IG9mIGZ1bmN0aW9ucycpO1xuXHQgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0ICAgIH1cblx0ICAgIGlmICghdGFza3MubGVuZ3RoKSB7XG5cdCAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuXHQgICAgfVxuXHQgICAgdmFyIHdyYXBJdGVyYXRvciA9IGZ1bmN0aW9uIChpdGVyYXRvcikge1xuXHQgICAgICByZXR1cm4gZnVuY3Rpb24gKGVycikge1xuXHQgICAgICAgIGlmIChlcnIpIHtcblx0ICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG5cdCAgICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHt9O1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdCAgICAgICAgICB2YXIgbmV4dCA9IGl0ZXJhdG9yLm5leHQoKTtcblx0ICAgICAgICAgIGlmIChuZXh0KSB7XG5cdCAgICAgICAgICAgIGFyZ3MucHVzaCh3cmFwSXRlcmF0b3IobmV4dCkpO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgYXJncy5wdXNoKGNhbGxiYWNrKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgaXRlcmF0b3IuYXBwbHkobnVsbCwgYXJncyk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICAgIH07XG5cdCAgICB9O1xuXHQgICAgd3JhcEl0ZXJhdG9yKG1ha2VJdGVyYXRvcih0YXNrcykpKCk7XG5cdCAgfTtcblxuXHQgIGlmICh0cnVlKSB7XG5cdCAgICAhKF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18gPSBbXSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgIHJldHVybiB3YXRlcmZhbGw7XG5cdCAgICB9LmFwcGx5KGV4cG9ydHMsIF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18pLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyAhPT0gdW5kZWZpbmVkICYmIChtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fKSk7IC8vIFJlcXVpcmVKU1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gd2F0ZXJmYWxsOyAvLyBDb21tb25KU1xuXHQgIH0gZWxzZSB7XG5cdCAgICBnbG9iYWxzLndhdGVyZmFsbCA9IHdhdGVyZmFsbDsgLy8gPHNjcmlwdD5cblx0ICB9XG5cdH0pKHRoaXMpO1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqL30uY2FsbChleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKDExKS5zZXRJbW1lZGlhdGUsIF9fd2VicGFja19yZXF1aXJlX18oMTMpKSlcblxuLyoqKi8gfSksXG4vKiAxMSAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdHZhciBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseTtcblxuXHQvLyBET00gQVBJcywgZm9yIGNvbXBsZXRlbmVzc1xuXG5cdGV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuXHQgIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldFRpbWVvdXQsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcblx0fTtcblx0ZXhwb3J0cy5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuXHQgIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFySW50ZXJ2YWwpO1xuXHR9O1xuXHRleHBvcnRzLmNsZWFyVGltZW91dCA9XG5cdGV4cG9ydHMuY2xlYXJJbnRlcnZhbCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHtcblx0ICBpZiAodGltZW91dCkge1xuXHQgICAgdGltZW91dC5jbG9zZSgpO1xuXHQgIH1cblx0fTtcblxuXHRmdW5jdGlvbiBUaW1lb3V0KGlkLCBjbGVhckZuKSB7XG5cdCAgdGhpcy5faWQgPSBpZDtcblx0ICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcblx0fVxuXHRUaW1lb3V0LnByb3RvdHlwZS51bnJlZiA9IFRpbWVvdXQucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge307XG5cdFRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdCAgdGhpcy5fY2xlYXJGbi5jYWxsKHdpbmRvdywgdGhpcy5faWQpO1xuXHR9O1xuXG5cdC8vIERvZXMgbm90IHN0YXJ0IHRoZSB0aW1lLCBqdXN0IHNldHMgdXAgdGhlIG1lbWJlcnMgbmVlZGVkLlxuXHRleHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG5cdCAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXHQgIGl0ZW0uX2lkbGVUaW1lb3V0ID0gbXNlY3M7XG5cdH07XG5cblx0ZXhwb3J0cy51bmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0ICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cdCAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcblx0fTtcblxuXHRleHBvcnRzLl91bnJlZkFjdGl2ZSA9IGV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuXHQgIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuXHQgIHZhciBtc2VjcyA9IGl0ZW0uX2lkbGVUaW1lb3V0O1xuXHQgIGlmIChtc2VjcyA+PSAwKSB7XG5cdCAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG5cdCAgICAgIGlmIChpdGVtLl9vblRpbWVvdXQpXG5cdCAgICAgICAgaXRlbS5fb25UaW1lb3V0KCk7XG5cdCAgICB9LCBtc2Vjcyk7XG5cdCAgfVxuXHR9O1xuXG5cdC8vIHNldGltbWVkaWF0ZSBhdHRhY2hlcyBpdHNlbGYgdG8gdGhlIGdsb2JhbCBvYmplY3Rcblx0X193ZWJwYWNrX3JlcXVpcmVfXygxMik7XG5cdGV4cG9ydHMuc2V0SW1tZWRpYXRlID0gc2V0SW1tZWRpYXRlO1xuXHRleHBvcnRzLmNsZWFySW1tZWRpYXRlID0gY2xlYXJJbW1lZGlhdGU7XG5cblxuLyoqKi8gfSksXG4vKiAxMiAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqLyhmdW5jdGlvbihnbG9iYWwsIHByb2Nlc3MpIHsoZnVuY3Rpb24gKGdsb2JhbCwgdW5kZWZpbmVkKSB7XG5cdCAgICBcInVzZSBzdHJpY3RcIjtcblxuXHQgICAgaWYgKGdsb2JhbC5zZXRJbW1lZGlhdGUpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIHZhciBuZXh0SGFuZGxlID0gMTsgLy8gU3BlYyBzYXlzIGdyZWF0ZXIgdGhhbiB6ZXJvXG5cdCAgICB2YXIgdGFza3NCeUhhbmRsZSA9IHt9O1xuXHQgICAgdmFyIGN1cnJlbnRseVJ1bm5pbmdBVGFzayA9IGZhbHNlO1xuXHQgICAgdmFyIGRvYyA9IGdsb2JhbC5kb2N1bWVudDtcblx0ICAgIHZhciByZWdpc3RlckltbWVkaWF0ZTtcblxuXHQgICAgZnVuY3Rpb24gc2V0SW1tZWRpYXRlKGNhbGxiYWNrKSB7XG5cdCAgICAgIC8vIENhbGxiYWNrIGNhbiBlaXRoZXIgYmUgYSBmdW5jdGlvbiBvciBhIHN0cmluZ1xuXHQgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0ICAgICAgICBjYWxsYmFjayA9IG5ldyBGdW5jdGlvbihcIlwiICsgY2FsbGJhY2spO1xuXHQgICAgICB9XG5cdCAgICAgIC8vIENvcHkgZnVuY3Rpb24gYXJndW1lbnRzXG5cdCAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcblx0ICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXTtcblx0ICAgICAgfVxuXHQgICAgICAvLyBTdG9yZSBhbmQgcmVnaXN0ZXIgdGhlIHRhc2tcblx0ICAgICAgdmFyIHRhc2sgPSB7IGNhbGxiYWNrOiBjYWxsYmFjaywgYXJnczogYXJncyB9O1xuXHQgICAgICB0YXNrc0J5SGFuZGxlW25leHRIYW5kbGVdID0gdGFzaztcblx0ICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUobmV4dEhhbmRsZSk7XG5cdCAgICAgIHJldHVybiBuZXh0SGFuZGxlKys7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGNsZWFySW1tZWRpYXRlKGhhbmRsZSkge1xuXHQgICAgICAgIGRlbGV0ZSB0YXNrc0J5SGFuZGxlW2hhbmRsZV07XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIHJ1bih0YXNrKSB7XG5cdCAgICAgICAgdmFyIGNhbGxiYWNrID0gdGFzay5jYWxsYmFjaztcblx0ICAgICAgICB2YXIgYXJncyA9IHRhc2suYXJncztcblx0ICAgICAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG5cdCAgICAgICAgY2FzZSAwOlxuXHQgICAgICAgICAgICBjYWxsYmFjaygpO1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICBjYXNlIDE6XG5cdCAgICAgICAgICAgIGNhbGxiYWNrKGFyZ3NbMF0pO1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICBjYXNlIDI6XG5cdCAgICAgICAgICAgIGNhbGxiYWNrKGFyZ3NbMF0sIGFyZ3NbMV0pO1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICBjYXNlIDM6XG5cdCAgICAgICAgICAgIGNhbGxiYWNrKGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0pO1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh1bmRlZmluZWQsIGFyZ3MpO1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIHJ1bklmUHJlc2VudChoYW5kbGUpIHtcblx0ICAgICAgICAvLyBGcm9tIHRoZSBzcGVjOiBcIldhaXQgdW50aWwgYW55IGludm9jYXRpb25zIG9mIHRoaXMgYWxnb3JpdGhtIHN0YXJ0ZWQgYmVmb3JlIHRoaXMgb25lIGhhdmUgY29tcGxldGVkLlwiXG5cdCAgICAgICAgLy8gU28gaWYgd2UncmUgY3VycmVudGx5IHJ1bm5pbmcgYSB0YXNrLCB3ZSdsbCBuZWVkIHRvIGRlbGF5IHRoaXMgaW52b2NhdGlvbi5cblx0ICAgICAgICBpZiAoY3VycmVudGx5UnVubmluZ0FUYXNrKSB7XG5cdCAgICAgICAgICAgIC8vIERlbGF5IGJ5IGRvaW5nIGEgc2V0VGltZW91dC4gc2V0SW1tZWRpYXRlIHdhcyB0cmllZCBpbnN0ZWFkLCBidXQgaW4gRmlyZWZveCA3IGl0IGdlbmVyYXRlZCBhXG5cdCAgICAgICAgICAgIC8vIFwidG9vIG11Y2ggcmVjdXJzaW9uXCIgZXJyb3IuXG5cdCAgICAgICAgICAgIHNldFRpbWVvdXQocnVuSWZQcmVzZW50LCAwLCBoYW5kbGUpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciB0YXNrID0gdGFza3NCeUhhbmRsZVtoYW5kbGVdO1xuXHQgICAgICAgICAgICBpZiAodGFzaykge1xuXHQgICAgICAgICAgICAgICAgY3VycmVudGx5UnVubmluZ0FUYXNrID0gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcnVuKHRhc2spO1xuXHQgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcblx0ICAgICAgICAgICAgICAgICAgICBjbGVhckltbWVkaWF0ZShoYW5kbGUpO1xuXHQgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRseVJ1bm5pbmdBVGFzayA9IGZhbHNlO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBpbnN0YWxsTmV4dFRpY2tJbXBsZW1lbnRhdGlvbigpIHtcblx0ICAgICAgICByZWdpc3RlckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuXHQgICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHsgcnVuSWZQcmVzZW50KGhhbmRsZSk7IH0pO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGNhblVzZVBvc3RNZXNzYWdlKCkge1xuXHQgICAgICAgIC8vIFRoZSB0ZXN0IGFnYWluc3QgYGltcG9ydFNjcmlwdHNgIHByZXZlbnRzIHRoaXMgaW1wbGVtZW50YXRpb24gZnJvbSBiZWluZyBpbnN0YWxsZWQgaW5zaWRlIGEgd2ViIHdvcmtlcixcblx0ICAgICAgICAvLyB3aGVyZSBgZ2xvYmFsLnBvc3RNZXNzYWdlYCBtZWFucyBzb21ldGhpbmcgY29tcGxldGVseSBkaWZmZXJlbnQgYW5kIGNhbid0IGJlIHVzZWQgZm9yIHRoaXMgcHVycG9zZS5cblx0ICAgICAgICBpZiAoZ2xvYmFsLnBvc3RNZXNzYWdlICYmICFnbG9iYWwuaW1wb3J0U2NyaXB0cykge1xuXHQgICAgICAgICAgICB2YXIgcG9zdE1lc3NhZ2VJc0FzeW5jaHJvbm91cyA9IHRydWU7XG5cdCAgICAgICAgICAgIHZhciBvbGRPbk1lc3NhZ2UgPSBnbG9iYWwub25tZXNzYWdlO1xuXHQgICAgICAgICAgICBnbG9iYWwub25tZXNzYWdlID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZUlzQXN5bmNocm9ub3VzID0gZmFsc2U7XG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIGdsb2JhbC5wb3N0TWVzc2FnZShcIlwiLCBcIipcIik7XG5cdCAgICAgICAgICAgIGdsb2JhbC5vbm1lc3NhZ2UgPSBvbGRPbk1lc3NhZ2U7XG5cdCAgICAgICAgICAgIHJldHVybiBwb3N0TWVzc2FnZUlzQXN5bmNocm9ub3VzO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gaW5zdGFsbFBvc3RNZXNzYWdlSW1wbGVtZW50YXRpb24oKSB7XG5cdCAgICAgICAgLy8gSW5zdGFsbHMgYW4gZXZlbnQgaGFuZGxlciBvbiBgZ2xvYmFsYCBmb3IgdGhlIGBtZXNzYWdlYCBldmVudDogc2VlXG5cdCAgICAgICAgLy8gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9ET00vd2luZG93LnBvc3RNZXNzYWdlXG5cdCAgICAgICAgLy8gKiBodHRwOi8vd3d3LndoYXR3Zy5vcmcvc3BlY3Mvd2ViLWFwcHMvY3VycmVudC13b3JrL211bHRpcGFnZS9jb21tcy5odG1sI2Nyb3NzRG9jdW1lbnRNZXNzYWdlc1xuXG5cdCAgICAgICAgdmFyIG1lc3NhZ2VQcmVmaXggPSBcInNldEltbWVkaWF0ZSRcIiArIE1hdGgucmFuZG9tKCkgKyBcIiRcIjtcblx0ICAgICAgICB2YXIgb25HbG9iYWxNZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgICAgICAgICAgaWYgKGV2ZW50LnNvdXJjZSA9PT0gZ2xvYmFsICYmXG5cdCAgICAgICAgICAgICAgICB0eXBlb2YgZXZlbnQuZGF0YSA9PT0gXCJzdHJpbmdcIiAmJlxuXHQgICAgICAgICAgICAgICAgZXZlbnQuZGF0YS5pbmRleE9mKG1lc3NhZ2VQcmVmaXgpID09PSAwKSB7XG5cdCAgICAgICAgICAgICAgICBydW5JZlByZXNlbnQoK2V2ZW50LmRhdGEuc2xpY2UobWVzc2FnZVByZWZpeC5sZW5ndGgpKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBpZiAoZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIpIHtcblx0ICAgICAgICAgICAgZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIG9uR2xvYmFsTWVzc2FnZSwgZmFsc2UpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGdsb2JhbC5hdHRhY2hFdmVudChcIm9ubWVzc2FnZVwiLCBvbkdsb2JhbE1lc3NhZ2UpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG5cdCAgICAgICAgICAgIGdsb2JhbC5wb3N0TWVzc2FnZShtZXNzYWdlUHJlZml4ICsgaGFuZGxlLCBcIipcIik7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gaW5zdGFsbE1lc3NhZ2VDaGFubmVsSW1wbGVtZW50YXRpb24oKSB7XG5cdCAgICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcblx0ICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICAgICAgICAgIHZhciBoYW5kbGUgPSBldmVudC5kYXRhO1xuXHQgICAgICAgICAgICBydW5JZlByZXNlbnQoaGFuZGxlKTtcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcblx0ICAgICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZShoYW5kbGUpO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGluc3RhbGxSZWFkeVN0YXRlQ2hhbmdlSW1wbGVtZW50YXRpb24oKSB7XG5cdCAgICAgICAgdmFyIGh0bWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXHQgICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG5cdCAgICAgICAgICAgIC8vIENyZWF0ZSBhIDxzY3JpcHQ+IGVsZW1lbnQ7IGl0cyByZWFkeXN0YXRlY2hhbmdlIGV2ZW50IHdpbGwgYmUgZmlyZWQgYXN5bmNocm9ub3VzbHkgb25jZSBpdCBpcyBpbnNlcnRlZFxuXHQgICAgICAgICAgICAvLyBpbnRvIHRoZSBkb2N1bWVudC4gRG8gc28sIHRodXMgcXVldWluZyB1cCB0aGUgdGFzay4gUmVtZW1iZXIgdG8gY2xlYW4gdXAgb25jZSBpdCdzIGJlZW4gY2FsbGVkLlxuXHQgICAgICAgICAgICB2YXIgc2NyaXB0ID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG5cdCAgICAgICAgICAgIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICBydW5JZlByZXNlbnQoaGFuZGxlKTtcblx0ICAgICAgICAgICAgICAgIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xuXHQgICAgICAgICAgICAgICAgaHRtbC5yZW1vdmVDaGlsZChzY3JpcHQpO1xuXHQgICAgICAgICAgICAgICAgc2NyaXB0ID0gbnVsbDtcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgaHRtbC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGluc3RhbGxTZXRUaW1lb3V0SW1wbGVtZW50YXRpb24oKSB7XG5cdCAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcblx0ICAgICAgICAgICAgc2V0VGltZW91dChydW5JZlByZXNlbnQsIDAsIGhhbmRsZSk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgLy8gSWYgc3VwcG9ydGVkLCB3ZSBzaG91bGQgYXR0YWNoIHRvIHRoZSBwcm90b3R5cGUgb2YgZ2xvYmFsLCBzaW5jZSB0aGF0IGlzIHdoZXJlIHNldFRpbWVvdXQgZXQgYWwuIGxpdmUuXG5cdCAgICB2YXIgYXR0YWNoVG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKGdsb2JhbCk7XG5cdCAgICBhdHRhY2hUbyA9IGF0dGFjaFRvICYmIGF0dGFjaFRvLnNldFRpbWVvdXQgPyBhdHRhY2hUbyA6IGdsb2JhbDtcblxuXHQgICAgLy8gRG9uJ3QgZ2V0IGZvb2xlZCBieSBlLmcuIGJyb3dzZXJpZnkgZW52aXJvbm1lbnRzLlxuXHQgICAgaWYgKHt9LnRvU3RyaW5nLmNhbGwoZ2xvYmFsLnByb2Nlc3MpID09PSBcIltvYmplY3QgcHJvY2Vzc11cIikge1xuXHQgICAgICAgIC8vIEZvciBOb2RlLmpzIGJlZm9yZSAwLjlcblx0ICAgICAgICBpbnN0YWxsTmV4dFRpY2tJbXBsZW1lbnRhdGlvbigpO1xuXG5cdCAgICB9IGVsc2UgaWYgKGNhblVzZVBvc3RNZXNzYWdlKCkpIHtcblx0ICAgICAgICAvLyBGb3Igbm9uLUlFMTAgbW9kZXJuIGJyb3dzZXJzXG5cdCAgICAgICAgaW5zdGFsbFBvc3RNZXNzYWdlSW1wbGVtZW50YXRpb24oKTtcblxuXHQgICAgfSBlbHNlIGlmIChnbG9iYWwuTWVzc2FnZUNoYW5uZWwpIHtcblx0ICAgICAgICAvLyBGb3Igd2ViIHdvcmtlcnMsIHdoZXJlIHN1cHBvcnRlZFxuXHQgICAgICAgIGluc3RhbGxNZXNzYWdlQ2hhbm5lbEltcGxlbWVudGF0aW9uKCk7XG5cblx0ICAgIH0gZWxzZSBpZiAoZG9jICYmIFwib25yZWFkeXN0YXRlY2hhbmdlXCIgaW4gZG9jLmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIikpIHtcblx0ICAgICAgICAvLyBGb3IgSUUgNuKAkzhcblx0ICAgICAgICBpbnN0YWxsUmVhZHlTdGF0ZUNoYW5nZUltcGxlbWVudGF0aW9uKCk7XG5cblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgLy8gRm9yIG9sZGVyIGJyb3dzZXJzXG5cdCAgICAgICAgaW5zdGFsbFNldFRpbWVvdXRJbXBsZW1lbnRhdGlvbigpO1xuXHQgICAgfVxuXG5cdCAgICBhdHRhY2hUby5zZXRJbW1lZGlhdGUgPSBzZXRJbW1lZGlhdGU7XG5cdCAgICBhdHRhY2hUby5jbGVhckltbWVkaWF0ZSA9IGNsZWFySW1tZWRpYXRlO1xuXHR9KHR5cGVvZiBzZWxmID09PSBcInVuZGVmaW5lZFwiID8gdHlwZW9mIGdsb2JhbCA9PT0gXCJ1bmRlZmluZWRcIiA/IHRoaXMgOiBnbG9iYWwgOiBzZWxmKSk7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKGV4cG9ydHMsIChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0oKSksIF9fd2VicGFja19yZXF1aXJlX18oMTMpKSlcblxuLyoqKi8gfSksXG4vKiAxMyAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdFxuXG4vKioqLyB9KSxcbi8qIDE0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBMb2FkZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDE1KTtcblxuXHR2YXIgUHJlY29tcGlsZWRMb2FkZXIgPSBMb2FkZXIuZXh0ZW5kKHtcblx0ICAgIGluaXQ6IGZ1bmN0aW9uKGNvbXBpbGVkVGVtcGxhdGVzKSB7XG5cdCAgICAgICAgdGhpcy5wcmVjb21waWxlZCA9IGNvbXBpbGVkVGVtcGxhdGVzIHx8IHt9O1xuXHQgICAgfSxcblxuXHQgICAgZ2V0U291cmNlOiBmdW5jdGlvbihuYW1lKSB7XG5cdCAgICAgICAgaWYgKHRoaXMucHJlY29tcGlsZWRbbmFtZV0pIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHtcblx0ICAgICAgICAgICAgICAgIHNyYzogeyB0eXBlOiAnY29kZScsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgb2JqOiB0aGlzLnByZWNvbXBpbGVkW25hbWVdIH0sXG5cdCAgICAgICAgICAgICAgICBwYXRoOiBuYW1lXG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiBudWxsO1xuXHQgICAgfVxuXHR9KTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IFByZWNvbXBpbGVkTG9hZGVyO1xuXG5cbi8qKiovIH0pLFxuLyogMTUgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIHBhdGggPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXHR2YXIgT2JqID0gX193ZWJwYWNrX3JlcXVpcmVfXyg2KTtcblx0dmFyIGxpYiA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cblx0dmFyIExvYWRlciA9IE9iai5leHRlbmQoe1xuXHQgICAgb246IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpIHtcblx0ICAgICAgICB0aGlzLmxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzIHx8IHt9O1xuXHQgICAgICAgIHRoaXMubGlzdGVuZXJzW25hbWVdID0gdGhpcy5saXN0ZW5lcnNbbmFtZV0gfHwgW107XG5cdCAgICAgICAgdGhpcy5saXN0ZW5lcnNbbmFtZV0ucHVzaChmdW5jKTtcblx0ICAgIH0sXG5cblx0ICAgIGVtaXQ6IGZ1bmN0aW9uKG5hbWUgLyosIGFyZzEsIGFyZzIsIC4uLiovKSB7XG5cdCAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG5cdCAgICAgICAgaWYodGhpcy5saXN0ZW5lcnMgJiYgdGhpcy5saXN0ZW5lcnNbbmFtZV0pIHtcblx0ICAgICAgICAgICAgbGliLmVhY2godGhpcy5saXN0ZW5lcnNbbmFtZV0sIGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG5cdCAgICAgICAgICAgICAgICBsaXN0ZW5lci5hcHBseShudWxsLCBhcmdzKTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgfSxcblxuXHQgICAgcmVzb2x2ZTogZnVuY3Rpb24oZnJvbSwgdG8pIHtcblx0ICAgICAgICByZXR1cm4gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShmcm9tKSwgdG8pO1xuXHQgICAgfSxcblxuXHQgICAgaXNSZWxhdGl2ZTogZnVuY3Rpb24oZmlsZW5hbWUpIHtcblx0ICAgICAgICByZXR1cm4gKGZpbGVuYW1lLmluZGV4T2YoJy4vJykgPT09IDAgfHwgZmlsZW5hbWUuaW5kZXhPZignLi4vJykgPT09IDApO1xuXHQgICAgfVxuXHR9KTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IExvYWRlcjtcblxuXG4vKioqLyB9KSxcbi8qIDE2ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0ZnVuY3Rpb24gaW5zdGFsbENvbXBhdCgpIHtcblx0ICAgICd1c2Ugc3RyaWN0JztcblxuXHQgICAgLy8gVGhpcyBtdXN0IGJlIGNhbGxlZCBsaWtlIGBudW5qdWNrcy5pbnN0YWxsQ29tcGF0YCBzbyB0aGF0IGB0aGlzYFxuXHQgICAgLy8gcmVmZXJlbmNlcyB0aGUgbnVuanVja3MgaW5zdGFuY2Vcblx0ICAgIHZhciBydW50aW1lID0gdGhpcy5ydW50aW1lOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgIHZhciBsaWIgPSB0aGlzLmxpYjsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cdCAgICB2YXIgQ29tcGlsZXIgPSB0aGlzLmNvbXBpbGVyLkNvbXBpbGVyOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgIHZhciBQYXJzZXIgPSB0aGlzLnBhcnNlci5QYXJzZXI7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXHQgICAgdmFyIG5vZGVzID0gdGhpcy5ub2RlczsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cdCAgICB2YXIgbGV4ZXIgPSB0aGlzLmxleGVyOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblxuXHQgICAgdmFyIG9yaWdfY29udGV4dE9yRnJhbWVMb29rdXAgPSBydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwO1xuXHQgICAgdmFyIG9yaWdfQ29tcGlsZXJfYXNzZXJ0VHlwZSA9IENvbXBpbGVyLnByb3RvdHlwZS5hc3NlcnRUeXBlO1xuXHQgICAgdmFyIG9yaWdfUGFyc2VyX3BhcnNlQWdncmVnYXRlID0gUGFyc2VyLnByb3RvdHlwZS5wYXJzZUFnZ3JlZ2F0ZTtcblx0ICAgIHZhciBvcmlnX21lbWJlckxvb2t1cCA9IHJ1bnRpbWUubWVtYmVyTG9va3VwO1xuXG5cdCAgICBmdW5jdGlvbiB1bmluc3RhbGwoKSB7XG5cdCAgICAgICAgcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cCA9IG9yaWdfY29udGV4dE9yRnJhbWVMb29rdXA7XG5cdCAgICAgICAgQ29tcGlsZXIucHJvdG90eXBlLmFzc2VydFR5cGUgPSBvcmlnX0NvbXBpbGVyX2Fzc2VydFR5cGU7XG5cdCAgICAgICAgUGFyc2VyLnByb3RvdHlwZS5wYXJzZUFnZ3JlZ2F0ZSA9IG9yaWdfUGFyc2VyX3BhcnNlQWdncmVnYXRlO1xuXHQgICAgICAgIHJ1bnRpbWUubWVtYmVyTG9va3VwID0gb3JpZ19tZW1iZXJMb29rdXA7XG5cdCAgICB9XG5cblx0ICAgIHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAgPSBmdW5jdGlvbihjb250ZXh0LCBmcmFtZSwga2V5KSB7XG5cdCAgICAgICAgdmFyIHZhbCA9IG9yaWdfY29udGV4dE9yRnJhbWVMb29rdXAuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgc3dpdGNoIChrZXkpIHtcblx0ICAgICAgICAgICAgY2FzZSAnVHJ1ZSc6XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblx0ICAgICAgICAgICAgY2FzZSAnRmFsc2UnOlxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgICAgICBjYXNlICdOb25lJzpcblx0ICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHZhbDtcblx0ICAgIH07XG5cblx0ICAgIHZhciBTbGljZSA9IG5vZGVzLk5vZGUuZXh0ZW5kKCdTbGljZScsIHtcblx0ICAgICAgICBmaWVsZHM6IFsnc3RhcnQnLCAnc3RvcCcsICdzdGVwJ10sXG5cdCAgICAgICAgaW5pdDogZnVuY3Rpb24obGluZW5vLCBjb2xubywgc3RhcnQsIHN0b3AsIHN0ZXApIHtcblx0ICAgICAgICAgICAgc3RhcnQgPSBzdGFydCB8fCBuZXcgbm9kZXMuTGl0ZXJhbChsaW5lbm8sIGNvbG5vLCBudWxsKTtcblx0ICAgICAgICAgICAgc3RvcCA9IHN0b3AgfHwgbmV3IG5vZGVzLkxpdGVyYWwobGluZW5vLCBjb2xubywgbnVsbCk7XG5cdCAgICAgICAgICAgIHN0ZXAgPSBzdGVwIHx8IG5ldyBub2Rlcy5MaXRlcmFsKGxpbmVubywgY29sbm8sIDEpO1xuXHQgICAgICAgICAgICB0aGlzLnBhcmVudChsaW5lbm8sIGNvbG5vLCBzdGFydCwgc3RvcCwgc3RlcCk7XG5cdCAgICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIENvbXBpbGVyLnByb3RvdHlwZS5hc3NlcnRUeXBlID0gZnVuY3Rpb24obm9kZSkge1xuXHQgICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgU2xpY2UpIHtcblx0ICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gb3JpZ19Db21waWxlcl9hc3NlcnRUeXBlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdCAgICB9O1xuXHQgICAgQ29tcGlsZXIucHJvdG90eXBlLmNvbXBpbGVTbGljZSA9IGZ1bmN0aW9uKG5vZGUsIGZyYW1lKSB7XG5cdCAgICAgICAgdGhpcy5lbWl0KCcoJyk7XG5cdCAgICAgICAgdGhpcy5fY29tcGlsZUV4cHJlc3Npb24obm9kZS5zdGFydCwgZnJhbWUpO1xuXHQgICAgICAgIHRoaXMuZW1pdCgnKSwoJyk7XG5cdCAgICAgICAgdGhpcy5fY29tcGlsZUV4cHJlc3Npb24obm9kZS5zdG9wLCBmcmFtZSk7XG5cdCAgICAgICAgdGhpcy5lbWl0KCcpLCgnKTtcblx0ICAgICAgICB0aGlzLl9jb21waWxlRXhwcmVzc2lvbihub2RlLnN0ZXAsIGZyYW1lKTtcblx0ICAgICAgICB0aGlzLmVtaXQoJyknKTtcblx0ICAgIH07XG5cblx0ICAgIGZ1bmN0aW9uIGdldFRva2Vuc1N0YXRlKHRva2Vucykge1xuXHQgICAgICAgIHJldHVybiB7XG5cdCAgICAgICAgICAgIGluZGV4OiB0b2tlbnMuaW5kZXgsXG5cdCAgICAgICAgICAgIGxpbmVubzogdG9rZW5zLmxpbmVubyxcblx0ICAgICAgICAgICAgY29sbm86IHRva2Vucy5jb2xub1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIFBhcnNlci5wcm90b3R5cGUucGFyc2VBZ2dyZWdhdGUgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cdCAgICAgICAgdmFyIG9yaWdTdGF0ZSA9IGdldFRva2Vuc1N0YXRlKHRoaXMudG9rZW5zKTtcblx0ICAgICAgICAvLyBTZXQgYmFjayBvbmUgYWNjb3VudGluZyBmb3Igb3BlbmluZyBicmFja2V0L3BhcmVuc1xuXHQgICAgICAgIG9yaWdTdGF0ZS5jb2xuby0tO1xuXHQgICAgICAgIG9yaWdTdGF0ZS5pbmRleC0tO1xuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIHJldHVybiBvcmlnX1BhcnNlcl9wYXJzZUFnZ3JlZ2F0ZS5hcHBseSh0aGlzKTtcblx0ICAgICAgICB9IGNhdGNoKGUpIHtcblx0ICAgICAgICAgICAgdmFyIGVyclN0YXRlID0gZ2V0VG9rZW5zU3RhdGUodGhpcy50b2tlbnMpO1xuXHQgICAgICAgICAgICB2YXIgcmV0aHJvdyA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgICAgbGliLmV4dGVuZChzZWxmLnRva2VucywgZXJyU3RhdGUpO1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGU7XG5cdCAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgLy8gUmVzZXQgdG8gc3RhdGUgYmVmb3JlIG9yaWdpbmFsIHBhcnNlQWdncmVnYXRlIGNhbGxlZFxuXHQgICAgICAgICAgICBsaWIuZXh0ZW5kKHRoaXMudG9rZW5zLCBvcmlnU3RhdGUpO1xuXHQgICAgICAgICAgICB0aGlzLnBlZWtlZCA9IGZhbHNlO1xuXG5cdCAgICAgICAgICAgIHZhciB0b2sgPSB0aGlzLnBlZWtUb2tlbigpO1xuXHQgICAgICAgICAgICBpZiAodG9rLnR5cGUgIT09IGxleGVyLlRPS0VOX0xFRlRfQlJBQ0tFVCkge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgcmV0aHJvdygpO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHZhciBub2RlID0gbmV3IFNsaWNlKHRvay5saW5lbm8sIHRvay5jb2xubyk7XG5cblx0ICAgICAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZW5jb3VudGVyIGEgY29sb24gd2hpbGUgcGFyc2luZywgdGhpcyBpcyBub3QgYSBzbGljZSxcblx0ICAgICAgICAgICAgLy8gc28gcmUtcmFpc2UgdGhlIG9yaWdpbmFsIGV4Y2VwdGlvbi5cblx0ICAgICAgICAgICAgdmFyIGlzU2xpY2UgPSBmYWxzZTtcblxuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBub2RlLmZpZWxkcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2tpcChsZXhlci5UT0tFTl9SSUdIVF9CUkFDS0VUKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgaWYgKGkgPT09IG5vZGUuZmllbGRzLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChpc1NsaWNlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmFpbCgncGFyc2VTbGljZTogdG9vIG1hbnkgc2xpY2UgY29tcG9uZW50cycsIHRvay5saW5lbm8sIHRvay5jb2xubyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2tpcChsZXhlci5UT0tFTl9DT0xPTikpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpc1NsaWNlID0gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkID0gbm9kZS5maWVsZHNbaV07XG5cdCAgICAgICAgICAgICAgICAgICAgbm9kZVtmaWVsZF0gPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXHQgICAgICAgICAgICAgICAgICAgIGlzU2xpY2UgPSB0aGlzLnNraXAobGV4ZXIuVE9LRU5fQ09MT04pIHx8IGlzU2xpY2U7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYgKCFpc1NsaWNlKSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyByZXRocm93KCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5BcnJheSh0b2subGluZW5vLCB0b2suY29sbm8sIFtub2RlXSk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgZnVuY3Rpb24gc2xpY2VMb29rdXAob2JqLCBzdGFydCwgc3RvcCwgc3RlcCkge1xuXHQgICAgICAgIG9iaiA9IG9iaiB8fCBbXTtcblx0ICAgICAgICBpZiAoc3RhcnQgPT09IG51bGwpIHtcblx0ICAgICAgICAgICAgc3RhcnQgPSAoc3RlcCA8IDApID8gKG9iai5sZW5ndGggLSAxKSA6IDA7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGlmIChzdG9wID09PSBudWxsKSB7XG5cdCAgICAgICAgICAgIHN0b3AgPSAoc3RlcCA8IDApID8gLTEgOiBvYmoubGVuZ3RoO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGlmIChzdG9wIDwgMCkge1xuXHQgICAgICAgICAgICAgICAgc3RvcCArPSBvYmoubGVuZ3RoO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHN0YXJ0IDwgMCkge1xuXHQgICAgICAgICAgICBzdGFydCArPSBvYmoubGVuZ3RoO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciByZXN1bHRzID0gW107XG5cblx0ICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQ7IDsgaSArPSBzdGVwKSB7XG5cdCAgICAgICAgICAgIGlmIChpIDwgMCB8fCBpID4gb2JqLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYgKHN0ZXAgPiAwICYmIGkgPj0gc3RvcCkge1xuXHQgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYgKHN0ZXAgPCAwICYmIGkgPD0gc3RvcCkge1xuXHQgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJ1bnRpbWUubWVtYmVyTG9va3VwKG9iaiwgaSkpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gcmVzdWx0cztcblx0ICAgIH1cblxuXHQgICAgdmFyIEFSUkFZX01FTUJFUlMgPSB7XG5cdCAgICAgICAgcG9wOiBmdW5jdGlvbihpbmRleCkge1xuXHQgICAgICAgICAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucG9wKCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgaWYgKGluZGV4ID49IHRoaXMubGVuZ3RoIHx8IGluZGV4IDwgMCkge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdLZXlFcnJvcicpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLnNwbGljZShpbmRleCwgMSk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goZWxlbWVudCk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gZWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNwbGljZShpLCAxKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbHVlRXJyb3InKTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGNvdW50OiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgICAgICBjb3VudCsrO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiBjb3VudDtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGluZGV4OiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgICAgICAgIHZhciBpO1xuXHQgICAgICAgICAgICBpZiAoKGkgPSB0aGlzLmluZGV4T2YoZWxlbWVudCkpID09PSAtMSkge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZUVycm9yJyk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIGk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBmaW5kOiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4T2YoZWxlbWVudCk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBpbnNlcnQ6IGZ1bmN0aW9uKGluZGV4LCBlbGVtKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0aGlzLnNwbGljZShpbmRleCwgMCwgZWxlbSk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblx0ICAgIHZhciBPQkpFQ1RfTUVNQkVSUyA9IHtcblx0ICAgICAgICBpdGVtczogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHZhciByZXQgPSBbXTtcblx0ICAgICAgICAgICAgZm9yKHZhciBrIGluIHRoaXMpIHtcblx0ICAgICAgICAgICAgICAgIHJldC5wdXNoKFtrLCB0aGlzW2tdXSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHJldDtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIHZhbHVlczogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIHZhciByZXQgPSBbXTtcblx0ICAgICAgICAgICAgZm9yKHZhciBrIGluIHRoaXMpIHtcblx0ICAgICAgICAgICAgICAgIHJldC5wdXNoKHRoaXNba10pO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHJldHVybiByZXQ7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBrZXlzOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuXHQgICAgICAgICAgICBmb3IodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgICAgICAgICAgcmV0LnB1c2goayk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIHJldDtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGdldDogZnVuY3Rpb24oa2V5LCBkZWYpIHtcblx0ICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXNba2V5XTtcblx0ICAgICAgICAgICAgaWYgKG91dHB1dCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICBvdXRwdXQgPSBkZWY7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGhhc19rZXk6IGZ1bmN0aW9uKGtleSkge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcy5oYXNPd25Qcm9wZXJ0eShrZXkpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgcG9wOiBmdW5jdGlvbihrZXksIGRlZikge1xuXHQgICAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpc1trZXldO1xuXHQgICAgICAgICAgICBpZiAob3V0cHV0ID09PSB1bmRlZmluZWQgJiYgZGVmICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIG91dHB1dCA9IGRlZjtcblx0ICAgICAgICAgICAgfSBlbHNlIGlmIChvdXRwdXQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdLZXlFcnJvcicpO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXNba2V5XTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgcG9waXRlbTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGsgaW4gdGhpcykge1xuXHQgICAgICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBmaXJzdCBvYmplY3QgcGFpci5cblx0ICAgICAgICAgICAgICAgIHZhciB2YWwgPSB0aGlzW2tdO1xuXHQgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXNba107XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gW2ssIHZhbF07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdLZXlFcnJvcicpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgc2V0ZGVmYXVsdDogZnVuY3Rpb24oa2V5LCBkZWYpIHtcblx0ICAgICAgICAgICAgaWYgKGtleSBpbiB0aGlzKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1trZXldO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmIChkZWYgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgZGVmID0gbnVsbDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICByZXR1cm4gdGhpc1trZXldID0gZGVmO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihrd2FyZ3MpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgayBpbiBrd2FyZ3MpIHtcblx0ICAgICAgICAgICAgICAgIHRoaXNba10gPSBrd2FyZ3Nba107XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcmV0dXJuIG51bGw7ICAgIC8vIEFsd2F5cyByZXR1cm5zIE5vbmVcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXHQgICAgT0JKRUNUX01FTUJFUlMuaXRlcml0ZW1zID0gT0JKRUNUX01FTUJFUlMuaXRlbXM7XG5cdCAgICBPQkpFQ1RfTUVNQkVSUy5pdGVydmFsdWVzID0gT0JKRUNUX01FTUJFUlMudmFsdWVzO1xuXHQgICAgT0JKRUNUX01FTUJFUlMuaXRlcmtleXMgPSBPQkpFQ1RfTUVNQkVSUy5rZXlzO1xuXHQgICAgcnVudGltZS5tZW1iZXJMb29rdXAgPSBmdW5jdGlvbihvYmosIHZhbCwgYXV0b2VzY2FwZSkgeyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcblx0ICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gNCkge1xuXHQgICAgICAgICAgICByZXR1cm4gc2xpY2VMb29rdXAuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgb2JqID0gb2JqIHx8IHt9O1xuXG5cdCAgICAgICAgLy8gSWYgdGhlIG9iamVjdCBpcyBhbiBvYmplY3QsIHJldHVybiBhbnkgb2YgdGhlIG1ldGhvZHMgdGhhdCBQeXRob24gd291bGRcblx0ICAgICAgICAvLyBvdGhlcndpc2UgcHJvdmlkZS5cblx0ICAgICAgICBpZiAobGliLmlzQXJyYXkob2JqKSAmJiBBUlJBWV9NRU1CRVJTLmhhc093blByb3BlcnR5KHZhbCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge3JldHVybiBBUlJBWV9NRU1CRVJTW3ZhbF0uYXBwbHkob2JqLCBhcmd1bWVudHMpO307XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKGxpYi5pc09iamVjdChvYmopICYmIE9CSkVDVF9NRU1CRVJTLmhhc093blByb3BlcnR5KHZhbCkpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge3JldHVybiBPQkpFQ1RfTUVNQkVSU1t2YWxdLmFwcGx5KG9iaiwgYXJndW1lbnRzKTt9O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBvcmlnX21lbWJlckxvb2t1cC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgfTtcblxuXHQgICAgcmV0dXJuIHVuaW5zdGFsbDtcblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzID0gaW5zdGFsbENvbXBhdDtcblxuXG4vKioqLyB9KVxuLyoqKioqKi8gXSlcbn0pO1xuOyIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiXSA9IChmdW5jdGlvbigpIHtcbmZ1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbnZhciBwYXJlbnRUZW1wbGF0ZSA9IG51bGw7XG5vdXRwdXQgKz0gXCI8ZGl2IGNsYXNzPVxcXCJsYi10eXBlIGxiLXR5cGUtLWVtYmVkIGxiLXR5cGUtLVwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwibG93ZXJcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwicHJvdmlkZXJfbmFtZVwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj48L2Rpdj5cXG48ZGl2IGNsYXNzPVxcXCJpdGVtLS1lbWJlZFxcXCI+XFxuICA8ZGl2PlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJodG1sXCIpKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cXG48L2Rpdj5cXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1pdGVtLWVtYmVkLmh0bWxcIiwgY3R4LCBjYik7IH1cbn0pKCk7XG47XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzL2Jyb3dzZXIvbnVuanVja3Mtc2xpbVwiICk7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHsod2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fSlbXCJ0ZW1wbGF0ZS1pdGVtLWltYWdlLmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPGZpZ3VyZT5cXG4gIDxpbWcgXFxuICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcImFjdGl2ZVwiKSkge1xub3V0cHV0ICs9IFwiY2xhc3M9XFxcImFjdGl2ZVxcXCJcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwibWVkaWFcIikpLFwicmVuZGl0aW9uc1wiKSksXCJ0aHVtYm5haWxcIikpLFwiaHJlZlwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiXFxuICAgIHNyY3NldD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcImJhc2VJbWFnZVwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIiA4MTB3LCBcXG4gICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcInRodW1ibmFpbFwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIiAyNDB3LCBcXG4gICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwicmVmXCIpKSxcIml0ZW1cIikpLFwibWV0YVwiKSksXCJtZWRpYVwiKSksXCJyZW5kaXRpb25zXCIpKSxcInZpZXdJbWFnZVwiKSksXCJocmVmXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIiA1NDB3XFxcIiBcXG4gICAgYWx0PVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNhcHRpb25cIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gIDxmaWdjYXB0aW9uPlxcbiAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZcIikpLFwiaXRlbVwiKSksXCJtZXRhXCIpKSxcImNhcHRpb25cIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiIFxcbiAgICA8c3BhbiBuZy1pZj1cXFwicmVmLml0ZW0ubWV0YS5jcmVkaXRcXFwiPlxcbiAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInJlZlwiKSksXCJpdGVtXCIpKSxcIm1ldGFcIikpLFwiY3JlZGl0XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICA8L3NwYW4+XFxuICA8L2ZpZ2NhcHRpb24+XFxuPC9maWd1cmU+XFxuXFxuXCI7XG5pZihwYXJlbnRUZW1wbGF0ZSkge1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSBlbHNlIHtcbmNiKG51bGwsIG91dHB1dCk7XG59XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbnJvb3Q6IHJvb3Rcbn07XG5cbn0pKCk7XG5yZXR1cm4gZnVuY3Rpb24oY3R4LCBjYikgeyByZXR1cm4gbnVuanVja3MucmVuZGVyKFwidGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIsIGN0eCwgY2IpOyB9XG59KSgpO1xuO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtcG9zdC5odG1sXCJdID0gKGZ1bmN0aW9uKCkge1xuZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xudmFyIHBhcmVudFRlbXBsYXRlID0gbnVsbDtcbm91dHB1dCArPSBcIjxhcnRpY2xlXFxuICBjbGFzcz1cXFwibGItcG9zdCBsaXN0LWdyb3VwLWl0ZW0gc2hvdy1hdXRob3ItYXZhdGFyIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0dhbGxlcnlcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcImdyb3Vwc1wiKSksMSkpLFwicmVmc1wiKSksMCkpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJpbWFnZVwiICYmIGVudi5nZXRGaWx0ZXIoXCJsZW5ndGhcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpKSA+IDEpIHtcbm91dHB1dCArPSBcInNsaWRlc2hvd1wiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxcIlxcbiAgZGF0YS1qcy1wb3N0LWlkPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfaWRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJzdGlja3lcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJsYi10eXBlXFxcIj48L2Rpdj5cXG4gIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGRpdiBjbGFzcz1cXFwibGItdHlwZSBsYi10eXBlLS10ZXh0XFxcIj48L2Rpdj5cXG4gIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiaGlnaGxpZ2h0XCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGRpdiBjbGFzcz1cXFwibGItcG9zdC1oaWdobGlnaHRlZFxcXCI+PC9kaXY+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgPGRpdiBjbGFzcz1cXFwibGItcG9zdC1kYXRlXFxcIiBkYXRhLWpzLXRpbWVzdGFtcD1cXFwiXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiX3VwZGF0ZWRcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxcIj5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJfdXBkYXRlZFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI8L2Rpdj5cXG5cXG4gIDwhLS0gYXV0aG9yIHBsdXMgYXZhdGFyIC0tPlxcbiAgPGRpdiBjbGFzcz1cXFwibGItYXV0aG9yXFxcIj5cXG4gICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93QXV0aG9yXCIpICYmIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicHVibGlzaGVyXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJsYi1hdXRob3JfX25hbWVcXFwiPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiaXRlbVwiKSksXCJwdWJsaXNoZXJcIikpLFwiZGlzcGxheV9uYW1lXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvZGl2PlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwic2hvd0F1dGhvckF2YXRhclwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJpdGVtXCIpKSxcInB1Ymxpc2hlclwiKSksXCJwaWN0dXJlX3VybFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8aW1nIGNsYXNzPVxcXCJsYi1hdXRob3JfX2F2YXRhclxcXCIgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwicHVibGlzaGVyXCIpKSxcInBpY3R1cmVfdXJsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCIgLz5cXG4gICAgICAgIFwiO1xuO1xufVxuZWxzZSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImxiLWF1dGhvcl9fYXZhdGFyXFxcIj48L2Rpdj5cXG4gICAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwvZGl2PlxcbiAgPCEtLSBlbmQgYXV0aG9yIC0tPlxcblxcbiAgPCEtLSBpdGVtIHN0YXJ0IC0tPlxcbiAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzMgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIml0ZW1cIikpLFwiZ3JvdXBzXCIpKSwxKSksXCJyZWZzXCIpO1xuaWYodF8zKSB7dmFyIHRfMiA9IHRfMy5sZW5ndGg7XG5mb3IodmFyIHRfMT0wOyB0XzEgPCB0XzMubGVuZ3RoOyB0XzErKykge1xudmFyIHRfNCA9IHRfM1t0XzFdO1xuZnJhbWUuc2V0KFwicmVmXCIsIHRfNCk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4XCIsIHRfMSArIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleDBcIiwgdF8xKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF8yIC0gdF8xKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXgwXCIsIHRfMiAtIHRfMSAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5maXJzdFwiLCB0XzEgPT09IDApO1xuZnJhbWUuc2V0KFwibG9vcC5sYXN0XCIsIHRfMSA9PT0gdF8yIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmxlbmd0aFwiLCB0XzIpO1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImxiLWl0ZW1cXFwiPlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKCh0XzQpLFwiaXRlbVwiKSksXCJpdGVtX3R5cGVcIikgPT0gXCJlbWJlZFwiKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWl0ZW0tZW1iZWQuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgbnVsbCwgZnVuY3Rpb24odF83LHRfNSkge1xuaWYodF83KSB7IGNiKHRfNyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzUpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF84LHRfNikge1xuaWYodF84KSB7IGNiKHRfOCk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzYpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICBcIjtcbn0pO1xufVxuZWxzZSB7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcIml0ZW1fdHlwZVwiKSA9PSBcImltYWdlXCIpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXBvc3QuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzExLHRfOSkge1xuaWYodF8xMSkgeyBjYih0XzExKTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfOSk7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbih0ZW1wbGF0ZSwgY2FsbGJhY2spe1xudGVtcGxhdGUucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLCBmdW5jdGlvbih0XzEyLHRfMTApIHtcbmlmKHRfMTIpIHsgY2IodF8xMik7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzEwKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG59KTtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8YXJ0aWNsZT5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHRfNCksXCJpdGVtXCIpKSxcInRleHRcIikpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvYXJ0aWNsZT5cXG4gICAgICBcIjtcbjtcbn1cbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICA8L2Rpdj5cXG4gIFwiO1xuO1xufVxufVxuZnJhbWUgPSBmcmFtZS5wb3AoKTtcbm91dHB1dCArPSBcIlxcbiAgPCEtLSBpdGVtIGVuZCAtLT5cXG5cXG48L2FydGljbGU+XFxuXCI7XG5pZihwYXJlbnRUZW1wbGF0ZSkge1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSBlbHNlIHtcbmNiKG51bGwsIG91dHB1dCk7XG59XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbnJvb3Q6IHJvb3Rcbn07XG5cbn0pKCk7XG5yZXR1cm4gZnVuY3Rpb24oY3R4LCBjYikgeyByZXR1cm4gbnVuanVja3MucmVuZGVyKFwidGVtcGxhdGUtcG9zdC5odG1sXCIsIGN0eCwgY2IpOyB9XG59KSgpO1xuO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrcy9icm93c2VyL251bmp1Y2tzLXNsaW1cIiApO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7KHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge30pW1widGVtcGxhdGUtc2xpZGVzaG93Lmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xub3V0cHV0ICs9IFwiPGRpdiBpZD1cXFwic2xpZGVzaG93XFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcImNvbnRhaW5lclxcXCI+XFxuICAgIFwiO1xuZnJhbWUgPSBmcmFtZS5wdXNoKCk7XG52YXIgdF8zID0gcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJyZWZzXCIpO1xuaWYodF8zKSB7dmFyIHRfMiA9IHRfMy5sZW5ndGg7XG5mb3IodmFyIHRfMT0wOyB0XzEgPCB0XzMubGVuZ3RoOyB0XzErKykge1xudmFyIHRfNCA9IHRfM1t0XzFdO1xuZnJhbWUuc2V0KFwicmVmXCIsIHRfNCk7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4XCIsIHRfMSArIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleDBcIiwgdF8xKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXhcIiwgdF8yIC0gdF8xKTtcbmZyYW1lLnNldChcImxvb3AucmV2aW5kZXgwXCIsIHRfMiAtIHRfMSAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5maXJzdFwiLCB0XzEgPT09IDApO1xuZnJhbWUuc2V0KFwibG9vcC5sYXN0XCIsIHRfMSA9PT0gdF8yIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmxlbmd0aFwiLCB0XzIpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgXCI7XG52YXIgdGFza3MgPSBbXTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihjYWxsYmFjaykge1xuZW52LmdldFRlbXBsYXRlKFwidGVtcGxhdGUtaXRlbS1pbWFnZS5odG1sXCIsIGZhbHNlLCBcInRlbXBsYXRlLXNsaWRlc2hvdy5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfNyx0XzUpIHtcbmlmKHRfNykgeyBjYih0XzcpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF81KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfOCx0XzYpIHtcbmlmKHRfOCkgeyBjYih0XzgpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF82KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xufSk7XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICA8L2Rpdj5cXG4gIDxidXR0b24gY2xhc3M9XFxcImZ1bGxzY3JlZW5cXFwiPkZ1bGxzY3JlZW48L2J1dHRvbj5cXG48L2Rpdj5cXG5cIjtcbmlmKHBhcmVudFRlbXBsYXRlKSB7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59IGVsc2Uge1xuY2IobnVsbCwgb3V0cHV0KTtcbn1cbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS1zbGlkZXNob3cuaHRtbFwiLCBjdHgsIGNiKTsgfVxufSkoKTtcbjtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltXCIgKTtcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkgeyh3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9KVtcInRlbXBsYXRlLXRpbWVsaW5lLmh0bWxcIl0gPSAoZnVuY3Rpb24oKSB7XG5mdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgcGFyZW50VGVtcGxhdGUgPSBudWxsO1xuKHBhcmVudFRlbXBsYXRlID8gZnVuY3Rpb24oZSwgYywgZiwgciwgY2IpIHsgY2IoXCJcIik7IH0gOiBjb250ZXh0LmdldEJsb2NrKFwidGltZWxpbmVcIikpKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGZ1bmN0aW9uKHRfMix0XzEpIHtcbmlmKHRfMikgeyBjYih0XzIpOyByZXR1cm47IH1cbm91dHB1dCArPSB0XzE7XG5vdXRwdXQgKz0gXCJcXG5cXG5cIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1lbWJlZC1wcm92aWRlcnMuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfNSx0XzMpIHtcbmlmKHRfNSkgeyBjYih0XzUpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8zKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfNix0XzQpIHtcbmlmKHRfNikgeyBjYih0XzYpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF80KTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHJlc3VsdCwgY2FsbGJhY2spe1xub3V0cHV0ICs9IHJlc3VsdDtcbmNhbGxiYWNrKG51bGwpO1xufSk7XG5lbnYud2F0ZXJmYWxsKHRhc2tzLCBmdW5jdGlvbigpe1xub3V0cHV0ICs9IFwiXFxuXFxuXCI7XG5pZihydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImluY2x1ZGVfanNfb3B0aW9uc1wiKSkge1xub3V0cHV0ICs9IFwiXFxuICA8c2NyaXB0IHR5cGU9XFxcInRleHQvamF2YXNjcmlwdFxcXCI+XFxuICAgIHdpbmRvdy5MQiA9IFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwic2FmZVwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwianNvbl9vcHRpb25zXCIpKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCI7XFxuICA8L3NjcmlwdD5cXG5cIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblwiO1xuaWYocGFyZW50VGVtcGxhdGUpIHtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0gZWxzZSB7XG5jYihudWxsLCBvdXRwdXQpO1xufVxufSl9KTtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5mdW5jdGlvbiBiX3RpbWVsaW5lKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG52YXIgZnJhbWUgPSBmcmFtZS5wdXNoKHRydWUpO1xub3V0cHV0ICs9IFwiXFxuPGRpdiBjbGFzcz1cXFwibGItdGltZWxpbmUgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcImxhbmd1YWdlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcXCI+XFxuICBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInNob3dUaXRsZVwiKSAmJiBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcInRpdGxlXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgPGgxPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcInRpdGxlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvaDE+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93RGVzY3JpcHRpb25cIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJkZXNjcmlwdGlvblwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxkaXYgY2xhc3M9XFxcImRlc2NyaXB0aW9uXFxcIj5cXG4gICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUoZW52LmdldEZpbHRlcihcInNhZmVcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJibG9nXCIpKSxcImRlc2NyaXB0aW9uXCIpKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXG4gICAgPC9kaXY+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93SW1hZ2VcIikgJiYgcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJwaWN0dXJlX3VybFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIDxpbWcgc3JjPVxcXCJcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYmxvZ1wiKSksXCJwaWN0dXJlX3VybFwiKSwgZW52Lm9wdHMuYXV0b2VzY2FwZSk7XG5vdXRwdXQgKz0gXCJcXFwiIC8+XFxuICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcblxcbiAgPGRpdiBjbGFzcz1cXFwidGltZWxpbmUtYm9keSB0aW1lbGluZS1ib2R5LS1sb2FkZWRcXFwiPlxcbiAgICBcIjtcbmlmKGVudi5nZXRGaWx0ZXIoXCJsZW5ndGhcIikuY2FsbChjb250ZXh0LCBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInN0aWNreVBvc3RzXCIpKSxcIl9pdGVtc1wiKSkgPiAwKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8c2VjdGlvbiBjbGFzcz1cXFwibGItcG9zdHMgbGlzdC1ncm91cCBzdGlja3lcXFwiPlxcbiAgICAgICAgXCI7XG5mcmFtZSA9IGZyYW1lLnB1c2goKTtcbnZhciB0XzkgPSBydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwiYXBpX3Jlc3BvbnNlXCIpKSxcInN0aWNreVBvc3RzXCIpKSxcIl9pdGVtc1wiKTtcbmlmKHRfOSkge3ZhciB0XzggPSB0XzkubGVuZ3RoO1xuZm9yKHZhciB0Xzc9MDsgdF83IDwgdF85Lmxlbmd0aDsgdF83KyspIHtcbnZhciB0XzEwID0gdF85W3RfN107XG5mcmFtZS5zZXQoXCJpdGVtXCIsIHRfMTApO1xuZnJhbWUuc2V0KFwibG9vcC5pbmRleFwiLCB0XzcgKyAxKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXgwXCIsIHRfNyk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4XCIsIHRfOCAtIHRfNyk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4MFwiLCB0XzggLSB0XzcgLSAxKTtcbmZyYW1lLnNldChcImxvb3AuZmlyc3RcIiwgdF83ID09PSAwKTtcbmZyYW1lLnNldChcImxvb3AubGFzdFwiLCB0XzcgPT09IHRfOCAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5sZW5ndGhcIiwgdF84KTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgodF8xMCksXCJkZWxldGVkXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzEzLHRfMTEpIHtcbmlmKHRfMTMpIHsgY2IodF8xMyk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzExKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMTQsdF8xMikge1xuaWYodF8xNCkgeyBjYih0XzE0KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTIpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG59KTtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG47XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgPC9zZWN0aW9uPlxcbiAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgPC9kaXY+XFxuXFxuICA8IS0tIEhlYWRlciAtLT5cXG4gIDxkaXYgY2xhc3M9XFxcImhlYWRlci1iYXJcXFwiPlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJzb3J0aW5nLWJhclxcXCI+XFxuICAgICAgPGRpdiBjbGFzcz1cXFwic29ydGluZy1iYXJfX29yZGVyc1xcXCI+XFxuICAgICAgICA8ZGl2XFxuICAgICAgICAgIGNsYXNzPVxcXCJzb3J0aW5nLWJhcl9fb3JkZXIgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJwb3N0T3JkZXJcIikgPT0gXCJlZGl0b3JpYWxcIikge1xub3V0cHV0ICs9IFwic29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmVcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCJcXG4gICAgICAgICAgZGF0YS1qcy1vcmRlcmJ5X2VkaXRvcmlhbD5cXG4gICAgICAgICAgXCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJvcHRpb25zXCIpKSxcImwxMG5cIikpLFwiZWRpdG9yaWFsXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICA8ZGl2XFxuICAgICAgICAgIGNsYXNzPVxcXCJzb3J0aW5nLWJhcl9fb3JkZXIgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJwb3N0T3JkZXJcIikgPT0gXCJuZXdlc3RfZmlyc3RcIikge1xub3V0cHV0ICs9IFwic29ydGluZy1iYXJfX29yZGVyLS1hY3RpdmVcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcXCJcXG4gICAgICAgICAgZGF0YS1qcy1vcmRlcmJ5X2Rlc2NlbmRpbmc+XFxuICAgICAgICAgIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwib3B0aW9uc1wiKSksXCJsMTBuXCIpKSxcImRlc2NlbmRpbmdcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDxkaXZcXG4gICAgICAgICAgY2xhc3M9XFxcInNvcnRpbmctYmFyX19vcmRlciBcIjtcbmlmKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcInNldHRpbmdzXCIpKSxcInBvc3RPcmRlclwiKSA9PSBcIm9sZGVzdF9maXJzdFwiKSB7XG5vdXRwdXQgKz0gXCJzb3J0aW5nLWJhcl9fb3JkZXItLWFjdGl2ZVwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxcIlxcbiAgICAgICAgICBkYXRhLWpzLW9yZGVyYnlfYXNjZW5kaW5nPlxcbiAgICAgICAgICBcIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm9wdGlvbnNcIikpLFwibDEwblwiKSksXCJhc2NlbmRpbmdcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8L2Rpdj5cXG4gICAgICA8L2Rpdj5cXG4gICAgPC9kaXY+XFxuICAgIDxkaXYgY2xhc3M9XFxcImhlYWRlci1iYXJfX2FjdGlvbnNcXFwiPjwvZGl2PlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwiY2FuQ29tbWVudFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgICAgICA8YnV0dG9uIGNsYXNzPVxcXCJoZWFkZXItYmFyX19jb21tZW50XFxcIiBkYXRhLWpzLXNob3ctY29tbWVudC1kaWFsb2c+Q29tbWVudDwvYnV0dG9uPlxcbiAgICAgIFwiO1xuO1xufVxub3V0cHV0ICs9IFwiXFxuXFxuICAgICAgXCI7XG5pZihydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJzZXR0aW5nc1wiKSksXCJzaG93TGl2ZWJsb2dMb2dvXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgIDxhIGNsYXNzPVxcXCJoZWFkZXItYmFyX19sb2dvXFxcIiBocmVmPVxcXCJodHRwczovL3d3dy5saXZlYmxvZy5wcm9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5cXG4gICAgICAgICAgPHNwYW4+UG93ZXJlZCBieTwvc3Bhbj5cXG4gICAgICAgICAgPGltZyBzcmM9XFxcIlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcImFzc2V0c19yb290XCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcImltYWdlcy9sYi1sb2dvLnN2Z1xcXCIgLz5cXG4gICAgICAgIDwvYT5cXG4gICAgICBcIjtcbjtcbn1cbm91dHB1dCArPSBcIlxcbiAgICA8L2Rpdj5cXG4gIDwhLS0gSGVhZGVyIEVuZCAtLT5cXG5cXG4gIDwhLS0gQ29tbWVudCAtLT5cXG4gIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwic2V0dGluZ3NcIikpLFwiY2FuQ29tbWVudFwiKSkge1xub3V0cHV0ICs9IFwiXFxuICAgIFwiO1xudmFyIHRhc2tzID0gW107XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24oY2FsbGJhY2spIHtcbmVudi5nZXRUZW1wbGF0ZShcInRlbXBsYXRlLWNvbW1lbnQuaHRtbFwiLCBmYWxzZSwgXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIG51bGwsIGZ1bmN0aW9uKHRfMTcsdF8xNSkge1xuaWYodF8xNykgeyBjYih0XzE3KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMTUpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24odGVtcGxhdGUsIGNhbGxiYWNrKXtcbnRlbXBsYXRlLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZSwgZnVuY3Rpb24odF8xOCx0XzE2KSB7XG5pZih0XzE4KSB7IGNiKHRfMTgpOyByZXR1cm47IH1cbmNhbGxiYWNrKG51bGwsdF8xNik7fSk7XG59KTtcbnRhc2tzLnB1c2goXG5mdW5jdGlvbihyZXN1bHQsIGNhbGxiYWNrKXtcbm91dHB1dCArPSByZXN1bHQ7XG5jYWxsYmFjayhudWxsKTtcbn0pO1xuZW52LndhdGVyZmFsbCh0YXNrcywgZnVuY3Rpb24oKXtcbm91dHB1dCArPSBcIlxcbiAgXCI7XG59KTtcbn1cbm91dHB1dCArPSBcIlxcbiAgPCEtLSBDb21tZW50IEVuZCAtLT5cXG5cXG4gIDwhLS0gVGltZWxpbmUgLS0+XFxuICA8ZGl2IGNsYXNzPVxcXCJ0aW1lbGluZS1ib2R5IHRpbWVsaW5lLWJvZHktLWxvYWRlZFxcXCI+XFxuICAgIFwiO1xuaWYoZW52LmdldEZpbHRlcihcImxlbmd0aFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwicG9zdHNcIikpLFwiX2l0ZW1zXCIpKSA9PSAwKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJsYi1wb3N0IGVtcHR5LW1lc3NhZ2VcXFwiPlxcbiAgICAgICAgPGRpdj5CbG9nIHBvc3RzIGFyZSBub3QgY3VycmVudGx5IGF2YWlsYWJsZS48L2Rpdj5cXG4gICAgICA8L2Rpdj5cXG4gICAgICBcIjtcbjtcbn1cbmVsc2Uge1xub3V0cHV0ICs9IFwiXFxuICAgICAgPHNlY3Rpb24gY2xhc3M9XFxcImxiLXBvc3RzIGxpc3QtZ3JvdXAgbm9ybWFsXFxcIj5cXG4gICAgICAgIFwiO1xuZnJhbWUgPSBmcmFtZS5wdXNoKCk7XG52YXIgdF8yMSA9IHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwicG9zdHNcIikpLFwiX2l0ZW1zXCIpO1xuaWYodF8yMSkge3ZhciB0XzIwID0gdF8yMS5sZW5ndGg7XG5mb3IodmFyIHRfMTk9MDsgdF8xOSA8IHRfMjEubGVuZ3RoOyB0XzE5KyspIHtcbnZhciB0XzIyID0gdF8yMVt0XzE5XTtcbmZyYW1lLnNldChcIml0ZW1cIiwgdF8yMik7XG5mcmFtZS5zZXQoXCJsb29wLmluZGV4XCIsIHRfMTkgKyAxKTtcbmZyYW1lLnNldChcImxvb3AuaW5kZXgwXCIsIHRfMTkpO1xuZnJhbWUuc2V0KFwibG9vcC5yZXZpbmRleFwiLCB0XzIwIC0gdF8xOSk7XG5mcmFtZS5zZXQoXCJsb29wLnJldmluZGV4MFwiLCB0XzIwIC0gdF8xOSAtIDEpO1xuZnJhbWUuc2V0KFwibG9vcC5maXJzdFwiLCB0XzE5ID09PSAwKTtcbmZyYW1lLnNldChcImxvb3AubGFzdFwiLCB0XzE5ID09PSB0XzIwIC0gMSk7XG5mcmFtZS5zZXQoXCJsb29wLmxlbmd0aFwiLCB0XzIwKTtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgICBcIjtcbmlmKCFydW50aW1lLm1lbWJlckxvb2t1cCgodF8yMiksXCJkZWxldGVkXCIpKSB7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgICBcIjtcbnZhciB0YXNrcyA9IFtdO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCJ0ZW1wbGF0ZS1wb3N0Lmh0bWxcIiwgZmFsc2UsIFwidGVtcGxhdGUtdGltZWxpbmUuaHRtbFwiLCBudWxsLCBmdW5jdGlvbih0XzI1LHRfMjMpIHtcbmlmKHRfMjUpIHsgY2IodF8yNSk7IHJldHVybjsgfVxuY2FsbGJhY2sobnVsbCx0XzIzKTt9KTtcbn0pO1xudGFza3MucHVzaChcbmZ1bmN0aW9uKHRlbXBsYXRlLCBjYWxsYmFjayl7XG50ZW1wbGF0ZS5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUsIGZ1bmN0aW9uKHRfMjYsdF8yNCkge1xuaWYodF8yNikgeyBjYih0XzI2KTsgcmV0dXJuOyB9XG5jYWxsYmFjayhudWxsLHRfMjQpO30pO1xufSk7XG50YXNrcy5wdXNoKFxuZnVuY3Rpb24ocmVzdWx0LCBjYWxsYmFjayl7XG5vdXRwdXQgKz0gcmVzdWx0O1xuY2FsbGJhY2sobnVsbCk7XG59KTtcbmVudi53YXRlcmZhbGwodGFza3MsIGZ1bmN0aW9uKCl7XG5vdXRwdXQgKz0gXCJcXG4gICAgICAgICAgXCI7XG59KTtcbn1cbm91dHB1dCArPSBcIlxcbiAgICAgICAgXCI7XG47XG59XG59XG5mcmFtZSA9IGZyYW1lLnBvcCgpO1xub3V0cHV0ICs9IFwiXFxuICAgICAgPC9zZWN0aW9uPlxcbiAgICAgIFwiO1xuaWYocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwicG9zdHNcIikpLFwiX21ldGFcIikpLFwibWF4X3Jlc3VsdHNcIikgPD0gcnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLm1lbWJlckxvb2t1cCgocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJhcGlfcmVzcG9uc2VcIikpLFwicG9zdHNcIikpLFwiX21ldGFcIikpLFwidG90YWxcIikpIHtcbm91dHB1dCArPSBcIlxcbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cXFwibGItYnV0dG9uIGxvYWQtbW9yZS1wb3N0c1xcXCIgZGF0YS1qcy1sb2FkbW9yZT5cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5tZW1iZXJMb29rdXAoKHJ1bnRpbWUubWVtYmVyTG9va3VwKChydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm9wdGlvbnNcIikpLFwibDEwblwiKSksXCJsb2FkTmV3UG9zdHNcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9idXR0b24+XFxuICAgICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gICAgXCI7XG47XG59XG5vdXRwdXQgKz0gXCJcXG4gIDwvZGl2PlxcbiAgPCEtLSBUaW1lbGluZSBFbmQgLS0+XFxuXFxuPC9kaXY+XFxuXCI7XG5jYihudWxsLCBvdXRwdXQpO1xuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5iX3RpbWVsaW5lOiBiX3RpbWVsaW5lLFxucm9vdDogcm9vdFxufTtcblxufSkoKTtcbnJldHVybiBmdW5jdGlvbihjdHgsIGNiKSB7IHJldHVybiBudW5qdWNrcy5yZW5kZXIoXCJ0ZW1wbGF0ZS10aW1lbGluZS5odG1sXCIsIGN0eCwgY2IpOyB9XG59KSgpO1xuO1xuIl19
