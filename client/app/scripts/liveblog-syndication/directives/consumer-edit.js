liveblogSyndication
    .directive('lbConsumerEdit', ['api', 'notify', function(api, notify) {
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
                        notify.pop();
                        notify.success(gettext('consumer saved.'));

                        scope.onsave({ consumer: result });
                    });
                };
            }
        };
    }]);
