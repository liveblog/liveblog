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
                //var origConsumer = _.clone(scope.consumer);
                var origConsumer;

                console.log('form', scope.consumerForm);
                angular.copy(scope.consumer, origConsumer);

                scope.save = function() {
                    if (angular.equals(origConsumer, scope.consumer))
                        return;

                    console.log('before save', origConsumer, scope.consumer, _.difference(origConsumer, scope.consumer));
                    console.log('form', scope.consumerForm.$pristine);

                    var data = {};
                    var apiQuery;

                    if (!scope.consumerForm.name.$pristine)
                        data.name = scope.consumer.name;

                    if (origConsumer)
                        apiQuery = api.save('consumers', origConsumer, data);
                    else
                        apiQuery = api.consumers.save(data);

                    apiQuery.then(function(result) {
                        console.log('result', result);
                        notify.pop();
                        notify.success(gettext('consumer saved.'));

                        if (!origConsumer)
                            scope.onsave({ consumer: result });
                    });
                };
            }
        };
    }]);
