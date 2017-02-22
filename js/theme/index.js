/**
 * @author ps / @___paul
 */

'use strict';

var helpers = require("./helpers")
  , handlers = require("./handlers")
  , viewmodel = require("./viewmodel");

module.exports = {
  /**
   * On document loaded, do the following:
   * convert timestamps, resize embeds periodically
   * register postMessage handlers, register button event listeners
   */
  init: function() {
    var timestamps = helpers.getElems("lb-post-date")
      , posts = helpers.getElems("lb-post")

    handlers.buttons.attach(); // Buttons
    handlers.events.attach(); // Events, PostMessage
    viewmodel.getLatestUpdate(); // Datetime now

    // ISO timestamps to relative time via moment
    for (var i = 0; i < timestamps.length; i++) {
      // todo
    }
  }
}