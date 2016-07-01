"use strict";
var angular = require("angular");

/*
  Let me console.log that for you
*/

module.exports = (function() {
  var DEBUG;

  var _log = {
    debug: function(func, msg) {
      if (!DEBUG) return;
      var color = 'background: #d4d4d4; font-weight: 600; color: #6A7F5E'
      if (console.debug) console.debug('%c ' + func + ' ', color, msg);
    }
  }

  return function(config) {
    DEBUG = config.debug;
    return _log;
  }
})()