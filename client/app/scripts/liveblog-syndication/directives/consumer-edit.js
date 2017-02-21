consumerEdit.$inject = ['api', 'notify', 'lodash'];

export default function consumerEdit(api, notify, _) {
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

                apiQuery.then(function(result) {
                    var successMsg = gettext('Consumer saved.');

                    notify.pop();
                    notify.success(successMsg);

                    scope.onsave({ consumer: result });
                })
                .catch(function(err) {
                    var errorMsg = gettext('An error has occurred. Please try again later.');
                    scope.onsave({ consumer: result });
                })
                .catch(function(err) {
                    var errorMsg = gettext('Fatal error!');

                    if (err.data.hasOwnProperty('_issues')) {
                        Object.keys(err.data._issues).forEach(function(key) {
                            var issue = err.data._issues[key];
                            if (typeof issue == 'object') {
                                if (issue.unique == true)
                                    issue = gettext('The selected field value is not unique.');
                            }
                            scope.consumerForm[key].issue = issue;
                        });
                    }

                    //if (err.data.hasOwnProperty('_issues')) {
                    //    Object.keys(err.data._issues).forEach(function(key) {
                    //        scope.consumerForm[key].issue = err.data._issues[key];
                    //    });
                    //}

                    notify.pop();
                    notify.error(errorMsg);
                });
            };

            scope.cancel = function() {
                scope.oncancel();
            }
        }
    };
};
