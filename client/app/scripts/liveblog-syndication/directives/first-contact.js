export default function firstContact() {
    return {
        template: '<span>{{contact.first_name}} {{contact.last_name}}&nbsp;</span>' +
            '<a href="mailto:{{contact.email}}">{{contact.email}}</a>',
        scope: {
            prosumer: '=',
        },
        link: function(scope) {
            scope.$watch('prosumer', function(prosumer) {
                scope.contact = prosumer.contacts[0];
            })
        }
    };
};
