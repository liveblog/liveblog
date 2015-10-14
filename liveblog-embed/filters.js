(function(angular) {
    'use strict';
    angular.module('liveblog-embed')
        .filter('prettifyIsoDate', function() {
            return function(input) {
                return moment(input).format('DD/MM/YYYY  HH:mm');
            };
        });

})(angular);
