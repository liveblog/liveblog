/**
 * @author ps / @___paul
 */

'use strict';

var helpers = require("./helpers")
  , handlers = require("./handlers")
  , viewmodel = require("./viewmodel")
  , view = require("./view");

module.exports = {
  /**
   * On document loaded, do the following:
   */
  init: function() {
    handlers.buttons.attach(); // Register Buttons Handlers
    handlers.events.attach(); // Register Event, Message Handlers
    viewmodel.init();

    setInterval(function() {
      viewmodel.loadPosts(); // Start polling
      view.updateTimestamps(); // Convert ISO dates to timeago
    }, 10*1000)
  }
}
