import consumerListItemTpl from 'scripts/liveblog-syndication/views/consumer-list-item.html';

consumerList.$inject = ['api', 'notify', 'modal'];

export default function consumerList(api, notify, modal) {
    return {
        templateUrl: consumerListItemTpl,
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

            // It's called disable, but really, it deletes the consumer
            scope.disable = function(e, consumerToRemove) {
                e.stopPropagation();

                modal.confirm(gettext('Are you sure you want to remove this consumer?'))
                    .then(() => api.consumers.remove(consumerToRemove))
                    .then((result) => {
                        angular.forEach(scope.consumers, (consumer, i) => {
                            if (consumer._id === consumerToRemove._id) {
                                scope.consumers.splice(i, 1);
                            }
                        });
                    })
                    .catch((err) => {
                        if (err.data && err.data._message) {
                            notify.pop();
                            notify.error(err.data._message);
                        }
                    });
            };

            scope.updateApiKey = function(e, consumer) {
                e.stopPropagation();

                modal.confirm(gettext('Are you sure you want to refresh the api key?'))
                    .then(() => api.save('consumers', consumer, {api_key: ''}))
                    .then((result) => {
                        notify.pop();
                        notify.success(gettext('api key updated.'));
                    })
                    .catch((err) => {
                        if (err) {
                            let msg = err.data._error.message || 'Fatal error';

                            notify.pop();
                            notify.error(msg);
                        }
                    });
            };
        }
    };
}
