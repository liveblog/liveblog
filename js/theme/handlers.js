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
        .then(view.displayNewPosts)
        .catch(catchError)
    },

    "[data-js-orderby_ascending]": function() {
      viewmodel.loadPosts({sort: 'ascending'})
        .then(view.renderTimeline)
        .then(view.displayNewPosts)
        .then(view.toggleSortBtn('ascending'))
        .catch(catchError)
    },

    "[data-js-orderby_descending]": function() {
      viewmodel.loadPosts({sort: 'descending'})
        .then(view.renderTimeline)
        .then(view.displayNewPosts)
        .then(view.toggleSortBtn('descending'))
        .catch(catchError)
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

function catchError(err) {
  console.error("Handler error: ", err)
}

var events = {
  attach: function() {} // todo
};

module.exports = {
  buttons: buttons,
  events: events
}
