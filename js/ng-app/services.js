'use strict';
var angular = require("angular");

/*
  Helper functions
*/

angular.module('liveblog-embed')
  .factory('fixProtocol', ['config', function(config) {
    return function(text) {
      var absoluteProtocol = RegExp(/http(s)?:\/\//ig);
      var serverpath = config.api_host.split('//').pop();
      config.api_host.replace(absoluteProtocol, '//'); // does nothing??
      text.replace(absoluteProtocol, '//') // also does nothing??
      return text.replace(absoluteProtocol, '//')
    };
  }])

  .factory('resizeIframes', function() {
    return function resize() {
      var iframes = document.getElementsByTagName("iframe");
      for (var i = iframes.length - 1; i >= 0; i--) {
        var newWidth = iframes[i].offsetWidth;
        var aspectRatio = iframes[i].height / iframes[i].width;
        iframes[i].height = newWidth * aspectRatio;
        iframes[i].width = newWidth;
      }
      return true
    }
  });