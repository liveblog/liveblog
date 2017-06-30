import producerListItemTpl from 'scripts/liveblog-syndication/views/producer-list-item.html';

producerList.$inject = ['api', '$http', 'modal', 'config', 'notify'];

export default function producerList(api, $http, modal, config, notify) {
    return {
        templateUrl: producerListItemTpl,
        scope: {
            roles: '=',
            producers: '=',
            selected: '=',
            done: '='
        },
        link: function(scope, elem, attrs) {
            scope.select = function(producer) {
                scope.selected = producer;
            };

            scope.disable = function(e, producerToRemove) {
                e.stopPropagation();

                modal.confirm(gettext('Are you sure you want to remove this producer?'))
                    .then(() => api.producers.remove(producerToRemove))
                    .then((result) => {
                        angular.forEach(scope.producers, (producer, i) => {
                            if (producer._id === producerToRemove._id) {
                                scope.producers.splice(i, 1);
                            }
                        });
                    });
            };

            scope.checkOnlineStatus = function(e, producer) {
                e.stopPropagation();

                $http({
                    url: `${config.server.url}/producers/${producer._id}/check_connection`,
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    }
                });
            };

            scope.$on('producers', (e, data) => {
                if (scope.producers
                && scope.producers.length > 0
                && data.producer
                && data.producer.hasOwnProperty('api_status')) {
                    scope.producers = scope.producers.map((producer) => {
                        if (producer._id === data.producer._id) {
                            producer.api_status = data.producer.api_status;

                            scope.$apply(() => {
                                notify.pop();

                                if (producer.api_status === 'enabled') {
                                    notify.success(gettext(`${producer.name} is online`));
                                } else if (producer.api_status === 'invalid_key') {
                                    notify.warning(gettext(`${producer.name} key is invalid`));
                                } else {
                                    notify.error(gettext(`${producer.name} is not reachable`));
                                }
                            });
                        }

                        return producer;
                    });
                }
            });
        }
    };
}
