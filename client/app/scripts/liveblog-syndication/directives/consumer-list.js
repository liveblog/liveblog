liveblogSyndication
    .directive('lbConsumerList', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/consumer-list-item.html',
            scope: {
                roles: '=',
                consumers: '=',
                selected: '=',
                done: '='
            },
            link: function(scope, elem, attrs) {
                console.log('consumers in directrive', scope.consumers);

            }
        };
    }]);
