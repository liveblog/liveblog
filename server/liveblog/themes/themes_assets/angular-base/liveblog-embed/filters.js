(function(angular) {
    'use strict';
    angular.module('liveblog-embed')
        .filter('prettifyIsoDate', function() {
            return function(input) {
                var date = fecha.parse(input, 'YYYY-MM-DDTHH:mm:ss+00:00');
                return fecha.format(date, 'DD/MM/YYYY  HH:mm');
            };
        });

})(angular);
