var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').login,
    consumersManagement = require('./helpers/pages').consumersManagement;

describe('Consumers', function() {
    'use strict';

    beforeEach(function(done) {login().then(done);});

    describe('list', function() {
        it('can open consumers managements and list the consumers', function() {
            consumersManagement
                .openConsumersManagement();
        });
    });
});
