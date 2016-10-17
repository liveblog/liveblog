liveblogSyndication
    .directive('lbConsumerEdit', ['api', 'notify', function(api, notify) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/edit-form.html',
            scope: {
                //consumer: '=',
                onsave: '&',
                oncancel: '&',
                onupdate: '&'
            },
            link: function(scope, elem) {
                console.log('current consumer', scope.consumer);

                scope.save = function() {
                    api.consumers.save(scope.consumer).then(function(result) {
                        notify.pop();
                        notify.success(gettext('consumer saved.'));

                        scope.onsave({ consumer: result });
                    });
                };
            }
        };
    }]);
