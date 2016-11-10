'use strict';

// Node modules
require('angular');
require('angular-cache')
require('angular-route/angular-route');
require('angular-animate/angular-animate');
require('angular-resource/angular-resource');

// 3rd party
require('iframe-resizer')

// Angular base theme
angular.module('liveblog-embed', [
  'ngResource',
  'angular-cache'
  ])

  .constant('config', {
    debug: false,
    parent_resize: false,
    blog: window.LB.blog,
    settings: window.LB.settings,
    api_host: window.LB.api_host,
    assets_root: window.LB.assets_root
  })

  .constant('embed_flags', {
    allowed: [
      "youtube.com",
      "instagram.com",
      "twitter.com"
    ],
    resize_sources: [
      "dpavideo.23video.com",
      "youtube.com"
    ]
  });

// Main app module
angular.module('theme', [
  'ngAnimate',
  'liveblog-embed'
  ])

// Window Load Event
.run([
  '$rootScope',
  '$window',
  '$timeout',
  'resizeIframes',
  'config',
  require('./onload')]);

// App modules
require('./ng-app/directives')
require('./ng-app/filters')
require('./ng-app/services')
require('./ng-app/pagemanager.service')
require('./ng-app/resources.service')
require('./ng-app/permalink.service')

// Timeline
require('./timeline')

module.exports = {}