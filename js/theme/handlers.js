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
        .then(function() {
          view.displayNewPosts();
        })
    },
    "[data-js-orderby-oldest-first]": function() {
      viewmodel.loadPosts({sort: 'oldest_first', returnPromise: true})
        .then(view.renderTimeline)
        .then(function() {
          view.toggleSortBtn('oldest_first')
        })
    }
  },

  attach: function() {
    for (var handler in buttons.handlers) {
      var el = helpers.getElems(handler)[0];
      if (el)
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
