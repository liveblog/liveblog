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
                scope.consumerForm.attempted = false;

                scope.$watch('consumer', function(consumer) {
                    scope.isEditing = consumer.hasOwnProperty('_id');
                    scope.origConsumer = _.cloneDeep(consumer);
                });

                scope.save = function() {
                    scope.consumerForm.attempted = true;

                    if (!scope.consumerForm.$valid)
                        return;

                    if (angular.equals(scope.origConsumer, scope.consumer))
                        return;

                    var data = {};
                    var apiQuery;

                    data.contacts = scope.consumer.contacts;

                    if (!scope.consumerForm.name.$pristine)
                        data.name = scope.consumer.name;

                    if (!scope.consumerForm.webhook_url.$pristine)
                        data.webhook_url = scope.consumer.webhook_url;

                    if (scope.isEditing)
                        apiQuery = api.save('consumers', scope.origConsumer, data);
                    else
                        apiQuery = api.consumers.save(data);

                    apiQuery.then(function(result) {
                        notify.pop();
                        notify.success(gettext('consumer saved.'));

                        scope.onsave({ consumer: result });
                    })
                    .catch(function(err) {
                        var errorMsg = gettext('Fatal error!');

                        console.log('error', err);

                        if (err.data.hasOwnProperty('_error'))
                            errorMsg = err.data._error.message;

                        if (err.data.hasOwnProperty('_issues')) {
                            Object.keys(err.data._issues).forEach(function(key) {
                                scope.consumerForm[key].issue = err.data._issues[key];
                            });
                        }

                        notify.pop();
                        notify.error(errorMsg);
                    });
                };

                scope.cancel = function() {
                    scope.oncancel();
                }
            }
        };
    }]);
