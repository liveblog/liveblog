'use strict';
var angular = require("angular");

angular.module('liveblog-embed')
.filter('isDateChange', function() {
  return (function() { // use closure for comparator
    var prev_isodatestring; // persists across calls

    function isoToDate(iso) {
      return new Date(iso).getDate()
    }
    
    return function(new_isodatestring) {
      var prev_date = isoToDate(prev_isodatestring)
        , new_date = isoToDate(new_isodatestring);

      prev_isodatestring = new_isodatestring; // save for next call
      return (prev_date == new_date || !prev_isodatestring) // new date or first call?
        ? false : true; 
    }
  })()
})

.filter('simpleDate', function() {
  /*
    Convert full iso strings to 12-02 (m-d).
  */

  function leftpad(n) { // BOW TO THE IMMORTAL LEFTPAD!
    return n < 10 ? '0' + n : n
  }
  
  return function(iso) {
    var d = new Date(iso);
    return [leftpad(d.getDate()),
      leftpad(d.getMonth()+1)].join(".")
  };
})

.filter('outboundAnchors', function() {
  /*
    Converts links without target="" to
    target="_blank"
  */
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

