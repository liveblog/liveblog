'use strict';
var angular = require("angular")
  , moment = require('moment');

// Set Moment.js to german
require('moment/locale/de');
moment.locale("de");

angular.module('liveblog-embed')
.filter('prettifyIsoDate', function() {
  return function(input) {
    return moment(input).format('DD/MM/YYYY  HH:mm');
  };
})

.filter('dateFromNowOrAbsolute', function() {
  return function(input) {
    var d = new Date(); // Now
    d.setDate(d.getDate()-1); // Minus 24h
    var delta24h = moment(input).isBefore(d)
    return delta24h
      ? moment(input).format('HH:mm')
      : moment(input).fromNow()
  };
})

/*
  Converts links without target="" to
  target="_blank"
*/

.filter('outboundAnchors', function() {
  return function(text) {
    return text.replace(/<a([^>]*)>/g, function(match, attr) {
      if(attr.indexOf('target') === -1) {
        return '<a' + attr + ' target="_blank">';
      }
      return match;
    });
  };
})

/*
  Make factory helper available as directive
*/

.filter('convertLinksWithRelativeProtocol', ['fixProtocol', function (fixProtocol) {
    return fixProtocol;
}]);

