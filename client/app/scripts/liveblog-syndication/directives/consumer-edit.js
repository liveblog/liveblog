liveblogSyndication
    .directive('lbConsumerEdit', ['api', 'notify', 'lodash', function(api, notify, _) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/consumer-edit-form.html',
            scope: {
                consumer: '=',
                onsave: '&',
                oncancel: '&',
                onupdate: '&'
            },
            link: function(scope, elem) {
                scope.$watch('consumer', function(consumer) {
                    scope.isEditing = consumer.hasOwnProperty('_id');
                    scope.origConsumer = _.cloneDeep(consumer);
                });

                scope.save = function() {
                    if (angular.equals(scope.origConsumer, scope.consumer))
                        return;

                    var data = {};
                    var apiQuery;

                    if (!scope.consumerForm.name.$pristine)
                        data.name = scope.consumer.name;

                    if (!scope.consumerForm.api_url.$pristine)
                        data.api_url = scope.consumer.api_url;

                    if (scope.isEditing)
                        apiQuery = api.save('consumers', scope.origConsumer, data);
                    else
                        apiQuery = api.consumers.save(data);

                    apiQuery.then(function(result) {
                        notify.pop();
                        notify.success(gettext('consumer saved.'));

                        // If we are creating a new entry,
                        // then we need to update the consumer list accordingly.
                        // Otherwise we just broadcast a cancel event
                        // to close the modal
                        if (!scope.isEditing)
                            scope.onsave({ consumer: result });
                        else
                            scope.oncancel();
                    })
                    .catch(function(err) {
                        notify.pop();
                        notify.error(gettext('Fatal error!'));
                    });
                };

                scope.cancel = function() {
                    scope.oncancel();
                }
            }
        };
    }]);
