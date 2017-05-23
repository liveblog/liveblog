import consumerListItemTpl from 'scripts/liveblog-syndication/views/consumer-list-item.html';

consumerList.$inject = ['api', 'notify', 'modal', '$http', 'config'];

export default function consumerList(api, notify, modal, $http, config) {
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

            scope.checkOnlineStatus = function(e, consumer) {
                e.stopPropagation();

                $http({
                    url: `${config.server.url}/consumers/${consumer._id}/check_connection`,
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    }
                });
            };

            scope.$on('consumers', (e, data) => {
                if (scope.consumers
                && scope.consumers.length > 0
                && data.consumer
                && data.consumer.hasOwnProperty('webhook_enabled')) {
                    scope.consumers = scope.consumers.map((consumer) => {
                        if (consumer._id === data.consumer._id) {
                            consumer.webhook_enabled = data.consumer.webhook_enabled;

                            scope.$apply(() => {
                                notify.pop();

                                if (consumer.webhook_enabled) {
                                    notify.success(gettext(`${consumer.name} is online`));
                                } else {
                                    notify.error(gettext(`${consumer.name} is offline`));
                                }
                            });
                        }

                        return consumer;
                    });
                }
            });
        }
    };
}
