(function(angular) {
    'use strict';
    angular.module('liveblog-embed', ['ngResource'])
        .constant('config', {
            blog: window.LB.blog,
            api_host:  window.LB.api_host,
            assets_root: window.LB.assets_root
        });
})(angular);
