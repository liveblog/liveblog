liveblogSyndication
    .directive('lbContactEdit', function() {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/contacts-edit-form.html',
            scope: {
                contacts: '='
            },
            link: function(scope, elem, attrs) {
                if (!scope.contacts) {
                    scope.contacts = [{}];
                }
            }
        }
    });
