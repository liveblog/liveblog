liveblogSyndication
    .directive('lbConsumerEdit', ['api', 'notify', 'lodash', function(api, notify, _) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/edit-form.html',
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

                    if (scope.isEditing)
                        apiQuery = api.save('consumers', scope.origConsumer, data);
                    else
                        apiQuery = api.consumers.save(data);

                    apiQuery.then(function(result) {
                        notify.pop();
                        notify.success(gettext('consumer saved.'));

                        if (!scope.isEditing)
                            scope.onsave({ consumer: result });
                        else
                            scope.oncancel();
                    });
                };

                scope.cancel = function() {
                    scope.oncancel();
                }
            }
        };
    }]);
