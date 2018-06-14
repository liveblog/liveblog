/**
 * @author ps / @___paul
 */

'use strict';

var moment = require('moment'),
  settings = window.LB.settings;

require("moment/min/locales.min");
moment.locale(settings.language);
function convertTimestamp(timestamp) {
  if (settings.showRelativeDate) {
    const d = new Date(); // Now
    const date = moment(timestamp);

    d.setHours(d.getHours() - 8); // Minus 8h

    if (!moment(date).isBefore(d)) {
      return date.fromNow();
    }
  }

  if (!settings.datetimeFormat || settings.datetimeFormat === 'ago') {
    return moment(timestamp).fromNow();
  }
  return moment(timestamp).format(settings.datetimeFormat);
}

/**
 * Wrap element selector api
 * @param {string} query - a jQuery syntax DOM query (with dots)
 */
function getElems(query) {
  var isDataAttr = query.indexOf("data-") > -1;
  return isDataAttr
    ? document.querySelectorAll(query)
    : document.getElementsByClassName(query);
}

/**
 * jQuery's $.getJSON in a nutshell
 * @param {string} url - a request URL
 */
function getJSON(url) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url);
    xhr.onload = function() {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(xhr.responseText);
      }
    };

    xhr.send();
  });
}

function post(url, data) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();

    xhr.open('POST', url);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onload = function() {
      if (xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(xhr.responseText);
      }
    };

    xhr.send(JSON.stringify(data));
  });

}

/**
 * Simple function to convert plain text to html
 * @param {string} strHTML - plain html to be converted to DOM Nodes
 */
function fragmentFromString(strHTML) {
  return document.createRange().createContextualFragment(strHTML.trim());
}

/**
 * Simple `range` function that behaves like python's `range`
 * see https://docs.python.org/2/library/functions.html#range
 *
 * Create arrays containing arithmetic progressions
 * Thanks StackOverflow -> https://stackoverflow.com/a/8273091/240364
 */
function range(start, stop, step) {
    if (typeof stop === 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof step === 'undefined')
        step = 1;

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop))
        return [];

    let result = [];
    for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
};

module.exports = {
  getElems: getElems,
  getJSON: getJSON,
  post: post,
  convertTimestamp: convertTimestamp,
  fragmentFromString: fragmentFromString,
  range: range
};
