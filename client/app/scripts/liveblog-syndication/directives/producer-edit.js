liveblogSyndication
    .directive('lbProducerEdit', ['api', 'notify', 'lodash', function(api, notify, _) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/producer-edit-form.html',
            scope: {
                producer: '=',
                onsave: '&',
                oncancel: '&',
                onupdate: '&'
            },
            link: function(scope, elem) {
                scope.$watch('producer', function(producer) {
                    scope.isEditing = producer.hasOwnProperty('_id');
                    scope.origProducer = _.cloneDeep(producer);
                });

                scope.save = function() {
                    if (angular.equals(scope.origProducer, scope.producer))
                        return;

                    var data = {}, apiQuery;

                    if (!scope.producerForm.name.$pristine)
                        data.name = scope.producer.name;

                    if (!scope.producerForm.api_url.$pristine)
                        data.api_url = scope.producer.api_url;

                    if (!scope.producerForm.consumer_api_key.$pristine)
                        data.consumer_api_key = scope.producer.consumer_api_key;

                    if (scope.isEditing)
                        apiQuery = api.save('producers', scope.origProducer, data);
                    else
                        apiQuery = api.producers.save(data);

                    apiQuery.then(function(result) {
                        notify.pop();
                        notify.success(gettext('producer saved.'));

                        // If we are creating a new entry,
                        // then we need to update the producer list accordingly.
                        // Otherwise we just broadcast a cancel event
                        // to close the modal
                        if (!scope.isEditing)
                            scope.onsave({ producer: result });
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
