liveblogSyndication
    .directive('lbConsumerList', ['api', 'notify', function(api, notify) {
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

                scope.updateApiKey = function(e, consumer) {
                    e.stopPropagation();

                    if (!confirm('Are you sure you want to refresh the api key?')) {
                        return;
                    }

                    var data = {};
                    data.api_key = '';

                    apiQuery = api.save('consumers', consumer, data);
                    apiQuery.then(function(result) {
                        notify.pop();
                        notify.success(gettext('api key updated.'));
                    })
                    .catch(function(err) {
                        notify.pop();
                        notify.error(gettext('Fatal error!'));
                    });
                }
            }
        };
    }]);
