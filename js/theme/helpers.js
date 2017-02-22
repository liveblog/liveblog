/**
 * @author ps / @___paul
 */

'use strict';
var moment;

/**
 * Convert ISO timestamps to relative moment timestamps
 * @param {Node} elem - a DOM element with ISO timestamp in data-js-timestamp attr
 */
function convertTimestamp(elem) {
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
};

/**
 * Wrap element selector api
 * @param {string} query - a jQuery syntax DOM query (with dots)
 */
function getElems(query) {
  var isDataAttr = -1 < query.indexOf("data-");
  return isDataAttr
    ? document.querySelectorAll(query)
    : document.getElementsByClassName(query);
};

/**
 * jQuery's $.getJSON in a nutshell
 * @param {string} url - a request URL
 */
function getJSON(url) {
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
