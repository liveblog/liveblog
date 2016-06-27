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

  .factory('resizeIframes', ['embed_flags', function(embed_flags) {
    return function resize() {

      /* for iframe providers that don't implement resize, we scale
      the initial proportions to timeline width */

      function shouldResize(iframe) {
        var should = false, sources = embed_flags.resize_sources;
        for (var i = sources.length - 1; i >= 0; i--) {
          should = iframe.src.indexOf(sources) > -1
        }
        return should
      }

      function proportionalResize(iframe) {
        var newWidth = iframe.offsetWidth;
        var aspectRatio = iframe.height / iframe.width;
        iframe.height = newWidth * aspectRatio;
        iframe.width = newWidth;
      }

      var iframes = document.getElementsByTagName("iframe");
      for (var i = iframes.length - 1; i >= 0; i--) {
        if (shouldResize(iframes[i])) proportionalResize(iframes[i])
      }

      return true
    }
  }]);