import producerEditFormTpl from 'scripts/liveblog-syndication/views/producer-edit-form.ng1';

producerEdit.$inject = ['api', 'notify', 'lodash', 'adsUtilSevice', 'superdesk'];

export default function producerEdit(api, notify, _, adsUtilSevice, superdesk) {
    return {
        templateUrl: producerEditFormTpl,
        scope: {
            producer: '=',
            onsave: '&',
            oncancel: '&',
            onupdate: '&',
            producers: '=',
        },
        link: function(scope, elem) {
            scope.producerForm.attempted = false;
            scope.dirty = false;

            scope.$watch('producer', (producer) => {
                scope.isEditing = producer.hasOwnProperty('_id');
                scope.origProducer = _.cloneDeep(producer);
            });

            scope.editPicture = function() {
                superdesk.intent('edit', 'avatar', scope.producer).then((avatar) => {
                    scope.producer.picture_url = avatar; // prevent replacing Avatar which would get into diff
                    scope.dirty = true;
                });
            };

            scope.save = function() {
                scope.producerForm.attempted = true;

                if (!scope.producerForm.$valid) {
                    return;
                }

                if (angular.equals(scope.origProducer, scope.producer)) {
                    return;
                }

                const data = {};
                let apiQuery;

                data.contacts = scope.producer.contacts;

                if (scope.producer.picture_url) {
                    data.picture_url = scope.producer.picture_url;
                } else {
                    data.picture_url = null;
                }

                if (!scope.producerForm.name.$pristine) {
                    data.name = scope.producer.name;
                }

                if (!scope.producerForm.api_url.$pristine) {
                    data.api_url = scope.producer.api_url;
                }

                if (!scope.producerForm.consumer_api_key.$pristine) {
                    data.consumer_api_key = scope.producer.consumer_api_key;
                }

                if (scope.isEditing) {
                    apiQuery = api.save('producers', scope.origProducer, data);
                } else {
                    apiQuery = api.producers.save(data);
                }

                apiQuery.then((result) => {
                    var successMsg = gettext('Producer saved.');

                    notify.pop();
                    notify.success(successMsg);

                    scope.onsave({producer: result});
                })
                    .catch((err) => {
                        var errorMsg = gettext('An error has occurred. Please try again later.');

                        if (err.data.hasOwnProperty('_error')) {
                            errorMsg = err.data._error.message;
                        }

                        if (err.data.hasOwnProperty('_issues')) {
                            Object.keys(err.data._issues).forEach((key) => {
                                var issue = err.data._issues[key];

                                if (typeof issue === 'object') {
                                    if (issue.unique === true) {
                                        issue = gettext('The selected field value is not unique.');
                                    }
                                }
                                scope.producerForm[key].issue = issue;
                            });
                        }

                        notify.pop();
                        notify.error(errorMsg);
                    });
            };

            scope.cancel = function() {
                scope.oncancel();
            };

            scope.notValidName = adsUtilSevice.uniqueNameInItems;
        },
    };
}
