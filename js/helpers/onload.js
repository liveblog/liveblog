'use strict';

/*
  DOMContentLoaded,
  register log helper, do initial iframe resize,
  periodically repeat iframe resize,
  register PostMessage receivers. 
*/

var angular = require("angular")
  , iframeResize = require('./iframe')
  , pageview = require('./pageview')
  , polyfills = require("./polyfills")
  , _ = require('./lodash-custom')
  , _log = require("./log");


module.exports = function($rootScope, $window, $timeout, resizeIframe, config) {
  var timeline = document.getElementsByClassName("lb-timeline")[0]
    , timeline_body = document.getElementsByClassName("timeline-body")[0];

  polyfills.events(); // IE10 compatible Event constructor
  polyfills.classList(); // IE9 classList polyfill/shim

  $rootScope._log = _log(config); // Logging helper
  timeline.classList.remove("mod--hide"); // Fade in timeline after all js has loaded  
  
  $window.addEventListener("message", function(msg) {
    var type = msg.data.type; // Various setup params via postMessage API
    switch (type) {
      case 'useParentResize':
        config.parent_resize = true; // determines if we post timeline height to parent or vice versa
        iframeResize.onElemHeightChange(timeline_body, iframeResize.sendHeight);
        break;
    }
  }, false);

  $window.onload = function() {
    $rootScope._log.debug("ng-lb", "started");
    pageview.init(); // Initialize 'pageview/analytics'
    
    $timeout(function() { // Initiate scrollable iframe
      if (!config.parent_resize) iframeResize.adjustBody()
    }, 1000); 

    angular.element($window).bind('resize',  // scrollable iframe
      _.debounce(function() {
        if (!config.parent_resize) iframeResize.adjustBody
      }, 1000));
  };
}