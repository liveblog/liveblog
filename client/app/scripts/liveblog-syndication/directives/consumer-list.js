liveblogSyndication
    .directive('lbConsumerList', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/consumer-list-item.html',
            scope: {
                roles: '=',
                consumers: '=',
                selected: '=',
                done: '='
            },
            link: function(scope, elem, attrs) {
                scope.select = function(consumer) {
                    scope.selected = consumer;
                };

                scope.disable = function(e, consumerToRemove) {
                    e.stopPropagation();

                    api.consumers.remove(consumerToRemove).then(function(result) {
                        angular.forEach(scope.consumers, function(consumer, i) {
                            if (consumer._id == consumerToRemove._id)
                                scope.consumers.splice(i, 1);
                        });
                    });
                }
            }
        };
    }]);
