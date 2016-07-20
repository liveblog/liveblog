'use strict';
var angular = require("angular");

angular.module('liveblog-embed')
.filter('isDateChange', function() {
  return (function() { // use closure for comparator
    var date_array = []; // persists across calls

    function isoToDate(iso) {
      return new Date(iso).getDate()
    }
    
    return function(new_isodate) {
      var prev_date = date_array[date_array.length-1]
        , new_date = isoToDate(new_isodate);

      date_array.push(new_date); // save for next call
      return (prev_date == new_date || date_array.indexOf(new_date) == 0) // new date or update?
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

