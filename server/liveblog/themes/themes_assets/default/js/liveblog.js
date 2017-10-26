/**
 * @author ps / @___paul
 */

'use strict';

// Prerender functions
var theme = require('./theme');
document.addEventListener('DOMContentLoaded', () => {
  theme.init();
});
if (/complete|loaded|interactive/.test(document.readyState)){
  theme.init();
}

module.exports = {};
