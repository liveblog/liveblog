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
