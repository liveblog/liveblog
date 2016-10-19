'use strict';
var angular = require("angular")
  , _ = require('../lodash-custom')
  , moment = require('moment');

require('moment/locale/de'); // Moment.js
moment.locale("de"); // Set Moment.js to german

angular.module('liveblog-embed')
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

.directive('dateFromNowOrAbsolute', ['$interval', function($interval) {
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      var d = new Date(); // Now
      var date = scope.post.mainItem.displayDate

      d.setDate(d.getHours()-4); // Minus 24h
      var delta24h = moment(date).isBefore(d)

      function updateMoment() {
        elem.text(delta24h
          ? moment(date).format('DD.MM, HH:mm [Uhr]')
          : moment(date).fromNow());
      }

      var stopTime = $interval(updateMoment, 10*1000);

      elem.on('$destroy', function() {
        $interval.cancel(stopTime);
      });

      updateMoment();
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

.directive('lbCreateSourceset', [function() {
  // Recreate the .text <figure> but with custom photo credits
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      var meta = scope.item.meta
        , srcset = 'bi 1620w, or 2048w, th 480w, vi 1080w'
        , mapObj = {
            bi: meta.media.renditions.baseImage.href,
            or: meta.media.renditions.original.href,
            th: meta.media.renditions.thumbnail.href,
            vi: meta.media.renditions.viewImage.href
          };

      srcset = srcset.replace(/bi|or|th|vi/gi, function(matched) {
        return mapObj[matched];
      });

      attrs.$set('src', mapObj.vi);
      attrs.$set('srcset', srcset);
      attrs.$set('alt', meta.caption);
    }
  };
}])

.directive('lbGenericEmbed', [function() {
  return {
    scope: {item: '='},
    templateUrl: "template__generic-embed",
    link: function(scope, element) {
      scope.isEmbedCode = angular.isDefined(scope.item.meta.html);
    }
  };
}])

.directive('lbPostlist', [function() {
  return {
    restrict: 'E',
    scope: {
      timeline: '=',
      posts: '='
    },
    templateUrl: "template__postlist"
  };
}])

.directive('loadScript', ['$rootScope', '$timeout', function($rootScope, $timeout) {
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
          else $timeout(function() {
            window.instgrm.Embeds.process(elem)
          }, 100); // n-th instagrams need this
          
          return true;
        },

        twitter: function(elem) {
          if (!window.twttr) return false
          else $timeout(function() {
            if (twttr.hasOwnProperty("widgets")) {
              twttr.widgets.load(elem)
            }
          }, 100);
          return true;
        }
      }

      if (embedLibMethods.hasOwnProperty(provider)) {
        if (embedLibMethods[provider](elem[0]) === true) return; // Exits directive
      }

      // Reverse engineer plaintext
      var html = scope.item.meta.html
        , matchSource = /<script.*?src="(.*?)"/
        , matchContent = /<script(?:.*?)>([^]*?)<\/script>/
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
