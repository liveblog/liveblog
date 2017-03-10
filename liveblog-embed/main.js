(function(angular) {
    'use strict';
    angular.module('liveblog-embed', ['ngResource', 'angular-cache'])
        .constant('config', window.LB);
})(angular);
