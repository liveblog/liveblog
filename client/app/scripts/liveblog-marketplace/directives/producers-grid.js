liveblogMarketplace
    .directive('lbProducersGrid', ['api', '$location', function(api, $location) {
        return {
            templateUrl: 'scripts/liveblog-marketplace/views/producers-grid.html',
            link: function(scope) {
                scope.open = function(producer) {
                    $location.path('/marketplace/producers/' + producer._id);
                };

                api.producers.query()
                    .then(function(producers) {
                        scope.producers = producers;
                    });
            }
        };
    }]);

