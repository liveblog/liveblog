var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').login,
    logout = require('./helpers/utils').logout,
    consumersManagement = require('./helpers/pages').consumersManagement;

fdescribe('Consumers', function() {
    beforeEach(function(done) {login().then(done);});

    describe('list', function() {
        it('can open consumers managements and list the consumers', function() {
            consumersManagement
                .openConsumersManagement()
                .then(function() {
                });
        });
    });
});
