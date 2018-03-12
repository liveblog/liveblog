import consumerEditFormTpl from 'scripts/liveblog-syndication/views/consumer-edit-form.ng1';

consumerEdit.$inject = ['api', 'notify', 'lodash'];

export default function consumerEdit(api, notify, _) {
    return {
        templateUrl: consumerEditFormTpl,
        scope: {
            consumer: '=',
            onsave: '&',
            oncancel: '&',
            onupdate: '&'
        },
        link: function(scope, elem) {
            scope.consumerForm.attempted = false;

            scope.$watch('consumer', (consumer) => {
                scope.isEditing = consumer.hasOwnProperty('_id');
                scope.origConsumer = _.cloneDeep(consumer);
            });

            scope.save = function() {
                scope.consumerForm.attempted = true;

                if (!scope.consumerForm.$valid) {
                    return;
                }

                if (angular.equals(scope.origConsumer, scope.consumer)) {
                    return;
                }

                const data = {};
                let apiQuery;

                data.contacts = scope.consumer.contacts;

                if (!scope.consumerForm.name.$pristine) {
                    data.name = scope.consumer.name;
                }

                if (!scope.consumerForm.webhook_url.$pristine) {
                    data.webhook_url = scope.consumer.webhook_url;
                }

                if (scope.isEditing) {
                    apiQuery = api.save('consumers', scope.origConsumer, data);
                } else {
                    apiQuery = api.consumers.save(data);
                }

                apiQuery.then((result) => {
                    const successMsg = gettext('Consumer saved.');

                    notify.pop();
                    notify.success(successMsg);

                    scope.onsave({consumer: result});
                })
                    .catch((err) => {
                        const errorMsg = gettext('Fatal error!');

                        if (err.data.hasOwnProperty('_issues')) {
                            Object.keys(err.data._issues).forEach((key) => {
                                let issue = err.data._issues[key];

                                if (typeof issue === 'object' && issue.unique === 1) {
                                    issue = gettext('The selected field value is not unique.');
                                }

                                scope.consumerForm[key].issue = issue;
                            });
                        }

                        notify.pop();
                        notify.error(errorMsg);
                    });
            };

            scope.cancel = function() {
                scope.oncancel();
            };
        }
    };
}
