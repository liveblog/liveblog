(function(angular) {
    'use strict';
    angular.module('liveblog-embed', ['ngResource'])
        .constant('config', {
            blog: window.LB.blog,
            settings: window.LB.settings,
            api_host:  window.LB.api_host,
            assets_root: window.LB.assets_root
        });
})(angular);
