/**
 * This is the default configuration file for the Superdesk application. By default,
 * the app will use the file with the name "superdesk.config.js" found in the current
 * working directory, but other files may also be specified using relative paths with
 * the SUPERDESK_CONFIG environment variable or the grunt --config flag.
 */
'use strict';

module.exports = function(grunt) {
    return {
        defaultRoute: '/liveblog',
        requiredMediaMetadata: ['headline', 'description_text', 'alt_text']
    };
};
