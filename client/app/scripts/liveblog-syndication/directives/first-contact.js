liveblogSyndication
    .directive('lbFirstContact', function() {
        return {
            template: '<div>' +
                    '<span>{{contact.first_name}} {{contact.last_name}}</span>&nbsp;' +
                    '<a href="mailto:{{contact.email}}">{{contact.email}}</a>' +
                '</div>',
            scope: {
                prosumer: '=',
            },
            link: function(scope) {
                console.log('prosumer', scope.prosumer);
                scope.contact = scope.prosumer.contacts[0];
            }
        };
    });
 
