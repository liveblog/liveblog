import contactsEditFormTpl from 'scripts/liveblog-syndication/views/contacts-edit-form.html';

export default function contactsEdit() {
    return {
        templateUrl: contactsEditFormTpl,
        scope: {
            contacts: '=',
            attempted: '='
        },
        require: "^form",
        link: function(scope, elem, attrs, form) {
            if (!scope.contacts) {
                scope.contacts = [{}];
            }

            scope.addContact = function() {
                scope.contacts.push({});
            };

            scope.removeContact = function(index) {
                scope.contacts.splice(index, 1);
                form.$setDirty();
            };
        }
    }
};
