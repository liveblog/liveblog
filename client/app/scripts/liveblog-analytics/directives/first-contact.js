liveblogSyndication
    .directive('lbFirstContact', function() {
        return {
            template: '<span>{{contact.first_name}} {{contact.last_name}}&nbsp;</span>' +
                '<a href="mailto:{{contact.email}}">{{contact.email}}</a>',
            scope: {
                prosumer: '=',
            },
            link: function(scope) {
                console.log('prosumer', scope.prosumer);
                scope.contact = scope.prosumer.contacts[0];
            }
        };
    });
 
