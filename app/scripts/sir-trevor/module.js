define([
    'angular',
], function(angular) {
    'use strict';
    angular.module('sir-trevor', [])
    .directive('sirTrevor', ['$timeout',  function($timeout) {
        var link = function($scope, element) {
            $timeout(function() {
                new SirTrevor.Editor({ el: element.find('textarea') });
            });
        };
        return {
            restrict : 'E',
            link     : link,
            template : '<form><textarea ng-model="post"></textarea></form>'
        };
    }]);
});

// EOF
