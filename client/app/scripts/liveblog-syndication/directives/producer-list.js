liveblogSyndication
    .directive('lbProducerList', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/producer-list-item.html',
            scope: {
                roles: '=',
                producers: '=',
                selected: '=',
                done: '='
            },
            link: function(scope, elem, attrs) {
                scope.select = function(producer) {
                    scope.selected = producer;
                };

                scope.disable = function(e, producerToRemove) {
                    e.stopPropagation();

                    api.producers.remove(producerToRemove).then(function(result) {
                        angular.forEach(scope.producers, function(producer, i) {
                            if (producer._id == producerToRemove._id)
                                scope.producers.splice(i, 1);
                        });
                    });
                }
            }
        };
    }]);
