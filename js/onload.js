'use strict';

/*
  DOMContentLoaded,
  register log helper, do initial iframe resize,
  periodically repeat iframe resize,
  register PostMessage receivers. 
*/

var angular = require("angular")
  , iframeParentResize = require('./iframe')
  , pageview = require('./pageview')
  , _ = require('./lodash-custom')
  , _log = require("./log");

module.exports = function($rootScope, $window, $timeout, resizeIframes, config) {
  var timeline = document.getElementsByClassName("lb-timeline")[0];
  timeline.classList.remove("mod--hide"); // Fade in timeline after all js has loaded
  $rootScope._log = _log(config); // Logging helper

  $window.onload = function() {
    $rootScope._log.debug("ng-lb", "started");
    
    pageview.init(); // Initialize 'analytics' trigger
    iframeParentResize(); // Adjust body height to parent iframe
    $timeout(resizeIframes, 1000); // Hacky, hacky, hacky ... hacky

    angular.element($window).bind('resize', 
      _.debounce(resizeIframes, 1000));
  };
}