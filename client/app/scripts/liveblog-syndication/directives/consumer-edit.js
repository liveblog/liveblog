liveblogSyndication
    .directive('lbConsumerEdit', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/edit-form.html',
            scope: {
                onsave: '&',
                oncancel: '&',
                onupdate: '&'
            },
            link: function(scope, elem) {
                scope.save = function() {
                    api.consumers.save(scope.consumer).then(function(result) {
                        console.log('result', result);
                        scope.onsave(result);
                    });
                };
            }
        };
    }]);
