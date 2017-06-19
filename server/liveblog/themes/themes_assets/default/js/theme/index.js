/**
 * @author ps / @___paul
 */

'use strict';

const handlers = require('./handlers'),
  viewmodel = require('./viewmodel'),
  view = require('./view'),
  localAnalytics = require('./local-analytics');

module.exports = {
  /**
   * On document loaded, do the following:
   */
  init: function() {
    handlers.buttons.attach(); // Register Buttons Handlers
    handlers.events.attach(); // Register Event, Message Handlers
    viewmodel.init();
    localAnalytics.hit();

    setInterval(() => {
      view.updateTimestamps(); // Convert ISO dates to timeago
    }, 1000);
  }
};
