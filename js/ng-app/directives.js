'use strict';
var angular = require("angular")
  , _ = require('../lodash-custom');

angular.module('liveblog-embed')

/*
  Inject HTML
*/

.directive('lbBindHtml', [function() {
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      attrs.$observe('htmlContent', function() {
        if (attrs.htmlLocation) {
          //need to inject the html in a specific element
          elem.find('[' + attrs.htmlLocation + ']').html(attrs.htmlContent);
        } else {
          //inject streaght in the elem
          elem.html(attrs.htmlContent);
        }
      });
    }
  };
}])

.directive('lbTwitterCard', [function() {
  return {
    restrict: 'E',
    link: function(scope, elem, attrs) {
      elem.html(attrs.lbTwitterContent);
    }
  };
}])

.directive('lbGenericEmbed', ['$timeout', '$window', function($timeout, $window) {
  return {
    scope: {item: '='},
    templateUrl: "template__generic-embed",
    link: function(scope, element) {
      var resize = function resize() {
        // update the min-height, depending of the image ratio
        $timeout(function() {
          var imageWidth = element.find('.item--embed__illustration').width();
          if (imageWidth) {
            var minHeight = (scope.item.meta.thumbnail_height / scope.item.meta.thumbnail_width) * imageWidth;
            element.find('.item--embed').css('min-height', minHeight);
          }
        });
      };

      scope.isEmbedCode = angular.isDefined(scope.item.meta.html);
      if (!scope.isEmbedCode) {
        angular.element($window).bind('resize', _.debounce(resize, 1000));
        resize();
      }
    }
  };
}])

.directive('loadScript', ['$rootScope', function($rootScope) {
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      if (!scope.isEmbedCode) return;

      var provider = scope.item.meta.provider_name.toLowerCase();
      $rootScope._log.debug("ng-loadscript", provider);

      /*
        Return early if embed lib is already loaded
        @param {DOM Element} elem - to avoid parsing the whole DOM tree,
        some embed libs provide the option to specify elements
      */

      var embedLibMethods = {
        instagram: function(elem) {
          if (!window.instgrm) return false;
          else instgrm.Embeds.process(elem);
          return true;
        },

        twitter: function(elem) {
          if (!window.twttr) return false
          else window.setTimeout(twttr.widgets.load, 100);
          return true;
        }
      }

      if (embedLibMethods.hasOwnProperty(provider)) {
        if (embedLibMethods[provider](elem[0]) === true) return; // Exits directive
      }

      // Reverse engineer plaintext
      var html = scope.item.meta.html
        , matchSource = /<script.*?src="(.*?)"/
        , matchContent = /<script(?:.*?)>(.*?)<\/script>/
        , content = html.match(matchContent)
        , src = html.match(matchSource);

      if (src && src.length) { 
        var script = document.createElement('script'); script.src = src[1];
        elem[0].parentNode.insertBefore(script, elem[0]);
      }

      // Evaluate any other script tag contents
      if (content && content.length) {
        eval(content[1])
      }
    }
  }
}])

;
