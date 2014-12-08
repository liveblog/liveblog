(function(SirTrevor) {
    'use strict';
    
    var sirTrevorDirective = function($timeout) {

        var link = function($scope, element) {
            $timeout(function() {
                var sir_trevor = new SirTrevor.Editor({ el: element.find('textarea') });
            });
        };
        return {
            restrict : 'E',
            link     : link,
            template : ['<form>',
                            '<textarea ng-model="post"></textarea>',
                        '</form>'].join('')
        };
    };

    define([
        'angular'
    ], function(angular) {
        angular.module('sir-trevor', [])
            .directive('sirTrevor', ['$timeout',  sirTrevorDirective]);
    });

})(SirTrevor);

// EOF
