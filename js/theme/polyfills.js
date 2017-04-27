'use strict';

var Promise = require('promise-polyfill');

/*
 * All polyfills go here
 * - IE10 custom 'Events'
 * - IE9 elem.classList polyfill
 */

function enableCustomEvent() {
  function CustomEvent (event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
}

function enableClassList() {
  if ("classList" in document.documentElement) {
    return;
  }

  if (!Object.defineProperty || typeof HTMLElement === 'undefined') {
    return;
  }

  Object.defineProperty(HTMLElement.prototype, 'classList', {
    get: function() {
      var self = this;
      function update(fn) {
        return function(value) {
          var classes = self.className.split(/\s+/),
            index = classes.indexOf(value);

          fn(classes, index, value);
          self.className = classes.join(" ");
        };
      }

      var ret = {
        add: update((classes, index, value) => {
          ~index || classes.push(value);
        }),

        remove: update((classes, index) => {
          ~index && classes.splice(index, 1);
        }),

        toggle: update((classes, index, value) => {
          ~index ? classes.splice(index, 1) : classes.push(value);
        }),

        contains: function(value) {
          return !!~self.className.split(/\s+/).indexOf(value);
        },

        item: function(i) {
          return self.className.split(/\s+/)[i] || null;
        }
      };

      Object.defineProperty(ret, 'length', {
        get: function() {
          return self.className.split(/\s+/).length;
        }
      });

      return ret;
    }
  });
}

module.exports = {
  events: enableCustomEvent,
  classList: enableClassList,
  promise: Promise
};
