import './styles/syndication.scss';

import './flux';

// ACTIONS
import ingestPanelActions from './actions/ingest-panel';
import incomingSyndicationActions from './actions/incoming-syndication';

// REDUCERS
import ingestPanelReducers from './reducers/ingest-panel';
import incomingSyndicationReducers from './reducers/incoming-syndication';

// CONTROLLERS
import baseController from './controllers/base';
import producersController from './controllers/producers';
import consumersController from './controllers/consumers';

// DIRECTIVES
import attachSyndicatedBlogsModal from './directives/attach-syndicated-blogs-modal';

var liveblogSyndication = angular
    .module('liveblog.syndication', [
      'liveblog.syndication.flux',
      'liveblog.security'
    ])
    // actions
    .factory('IngestPanelActions', ingestPanelActions)
    .factory('IncomingSyndicationActions', incomingSyndicationActions)

    // reducers
    .factory('IngestPanelReducers', ingestPanelReducers)
    .factory('IncomingSyndicationReducers', incomingSyndicationReducers)

    // controllers
    .controller('BaseController', baseController)
    .controller('ProducersController', producersController)
    .controller('ConsumersController', consumersController)

    // directives
    .directive('lbAttachSyndicatedBlogsModal', attachSyndicatedBlogsModal);

import './directives/consumer-edit';
import './directives/consumer-list';
import './directives/contacts-edit';
import './directives/copy-to-clipboard';
import './directives/first-contact';
import './directives/incoming-syndication';
import './directives/ingest-panel';
import './directives/ingest-panel-dropdown';
import './directives/notifications-count';
import './directives/producer-edit';
import './directives/producer-list';
import './directives/syndication-switch';
import './directives/synd-rm-blog';

liveblogSyndication
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/consumers/', {
                label: gettext('Consumers Management'),
                controller: 'ConsumersController',
                templateUrl: 'scripts/liveblog-syndication/views/consumer-list.html',
                category: superdesk.MENU_MAIN,
                priority: 100,
                adminTools: true,
                resolve: {isArchivedFilterSelected: function() {return false;}}
            })
            .activity('/producers/', {
                label: gettext('Producers Management'),
                controller: 'ProducersController',
                templateUrl: 'scripts/liveblog-syndication/views/producer-list.html',
                category: superdesk.MENU_MAIN,
                priority: 100,
                adminTools: true,
                resolve: {isArchivedFilterSelected: function() {return false;}}
            });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider
            .api('syndicationIn', {
                type: 'http',
                backend: {rel: 'syndication_in'}
            })
            .api('syndicationOut', {
                type: 'http',
                backend: {rel: 'syndication_out'}
            })
             .api('consumers', {
                type: 'http',
                backend: {rel: 'consumers'}
            })
            .api('producers', {
                type: 'http',
                backend: {rel: 'producers'}
            });
    }]);

