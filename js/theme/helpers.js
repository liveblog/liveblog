/**
 * @author ps / @___paul
 */

'use strict';
var moment;

var convertTimestamp = function(elem) {
  /**
   * Convert ISO timestamps to relative moment timestamps
   * @param {Node} elem - a DOM element with ISO timestamp in data-js-timestamp attr
   */

  var d = new Date() // Now
    , date = elem.dataset.jsTimestamp;

  d.setHours(d.getHours() - 12); // Minus 12h
  var delta24h = moment(date).isBefore(d)

  function updateMoment() {
    elem.text(delta24h
      ? moment(date).format('DD.MM, HH:mm [Uhr]')
      : moment(date).fromNow());
  };

  window.setInterval(updateMoment, 10*1000)
}

var getElems = function(query) {
  /**
   * Wrap element selector api
   * @param {string} query - a jQuery syntax DOM query (with dots)
   */

  var isDataAttr = -1 < query.indexOf("data-");
  return isDataAttr
    ? document.querySelectorAll(query)
    : document.getElementsByClassName(query);
}

var getJSON = function(url) {
  /**
   * jQuery's $.getJSON in a nutshell
   * @param {string} url - a request URL
   */

  return new Promise(function(resolve, reject) {
    var promise = Promise;
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url);
    xhr.onload = function() {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
      else reject(xhr.responseText);
    };

    xhr.send();
    
  });
}

module.exports = {
  getElems: getElems,
  getJSON: getJSON,
  convertTimestamp: convertTimestamp
}
