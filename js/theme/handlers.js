/**
 * @author ps / @___paul
 */

'use strict';

var viewmodel = require('./viewmodel')
  , helpers = require('./helpers');

var buttons = {
  /**
   * Contains a mapping of element data-selectors and click handlers
   * @returns {object} [attach] {function} - registers handlers found in _handlers object
   */

  _handlers: {
    "[data-js-loadmore]": function() {
      viewmodel.loadPosts()
        .then(function(posts) {
          viewmodel.renderPosts(posts);
        })
    }
  },

  attach: function() {
    for (var handler in buttons._handlers) {
      helpers.getElems(handler)[0].addEventListener('click',
        buttons._handlers[handler], false);
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