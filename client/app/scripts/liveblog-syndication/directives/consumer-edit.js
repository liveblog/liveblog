liveblogSyndication
    .directive('lbConsumerEdit', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/edit-form.html',
            scope: {
                //origUser: '=user',
                onsave: '&',
                oncancel: '&',
                onupdate: '&'
            },
            link: function(scope, elem) {
                scope.save = function() {
                    console.log('saving thing yo!', scope.consumer);
                    api.consumers.save(scope.consumer).then(function(result) {
                        console.log('result', result);
                    });
                };
            }
        };
    }]);
