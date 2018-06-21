/**
 * @author ps / @___paul
 */

'use strict';

const handlers = require('./handlers'),
  viewmodel = require('./viewmodel'),
  view = require('./view'),
  pageview = require('./pageview'),
  localAnalytics = require('./local-analytics'),
  adsManager = require('./ads-manager'),
  cookieEnabler = require('./cookies-enabler');

require("iframe-resizer/js/iframeResizer.contentWindow.min.js");
module.exports = {
  /**
   * On document loaded, do the following:
   */
  init: function() {
    handlers.buttons.attach(); // Register Buttons Handlers
    handlers.events.attach(); // Register Event, Message Handlers
    viewmodel.init();
    localAnalytics.hit();
    pageview.init();
    adsManager.init();

    COOKIES_ENABLER.init({
        scriptClass: 'ce-script',
        iframeClass: 'ce-iframe',

        acceptClass: 'ce-accept',           
        dismissClass: 'ce-dismiss',
        disableClass: 'ce-disable',

        bannerClass: 'ce-banner',
        bannerHTML:'<a style="position: fixed; bottom: 0; left: 0; right: 0;'+
        '  background-color: #dedede; padding: 1em; color: #232323; font-size: 1em;" '+
        '  data-toggle="modal" data-target="#myModal">' + 
        '<b>View Scocial Media</b></a>',
        eventScroll: false,
        scrollOffset: 200,

        clickOutside: false,

        cookieName: 'ce-cookie',
        cookieDuration: '365',
        wildcardDomain: true,

        iframesPlaceholder: true,
        iframesPlaceholderHTML:'',
        iframesPlaceholderClass: 'ce-iframe-placeholder',
            // Callbacks
            onEnable: '',
            onDismiss: '',
            onDisable: ''
          });

    view.updateTimestamps();
    setInterval(() => {
      view.updateTimestamps(); // Convert ISO dates to timeago
    }, 1000);
  }
};
