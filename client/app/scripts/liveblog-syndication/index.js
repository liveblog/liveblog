import './styles/syndication.scss';
import './../flux';

// ACTIONS
import ingestPanelActions from './actions/ingest-panel';
import incomingSyndicationActions from './actions/incoming-syndication';

// REDUCERS
import ingestPanelReducers from './reducers/ingest-panel';
import incomingSyndicationReducers from './reducers/incoming-syndication';

// CONTROLLERS
import baseController from './controllers/base';
import syndicationController from './controllers/syndication';

// DIRECTIVES
import lbProducers from './directives/producers';
import lbConsumers from './directives/consumers';
import attachSyndicatedBlogsModal from './directives/attach-syndicated-blogs-modal';
import consumerEdit from './directives/consumer-edit';
import consumerList from './directives/consumer-list';
import contactsEdit from './directives/contacts-edit';
import copyToClipboard from './directives/copy-to-clipboard';
import firstContact from './directives/first-contact';
import incomingSyndication from './directives/incoming-syndication';
import ingestPanel from './directives/ingest-panel';
import ingestPanelDropdown from './directives/ingest-panel-dropdown';
import notificationsCount from './directives/notifications-count';
import producerEdit from './directives/producer-edit';
import producerList from './directives/producer-list';
import syndicationSwitch from './directives/syndication-switch';
import syndRmBlog from './directives/synd-rm-blog';

// CONFIG
import activities from './activities';
import api from './api';

export default angular
    .module('liveblog.syndication', [
        'liveblog.security',
        'liveblog.flux'
    ])

    // actions
    .factory('IngestPanelActions', ingestPanelActions)
    .factory('IncomingSyndicationActions', incomingSyndicationActions)

    // reducers
    .factory('IngestPanelReducers', ingestPanelReducers)
    .factory('IncomingSyndicationReducers', incomingSyndicationReducers)

    // controllers
    .controller('BaseController', baseController)
    .controller('SyndicationController', syndicationController)

    // directives
    .directive('lbConsumers', lbConsumers)
    .directive('lbProducers', lbProducers)
    .directive('lbAttachSyndicatedBlogsModal', attachSyndicatedBlogsModal)
    .directive('lbConsumerEdit', consumerEdit)
    .directive('lbConsumerList', consumerList)
    .directive('lbContactsEdit', contactsEdit)
    .directive('lbCopyToClipboard', copyToClipboard)
    .directive('lbFirstContact', firstContact)
    .directive('lbIncomingSyndication', incomingSyndication)
    .directive('lbIngestPanel', ingestPanel)
    .directive('lbIngestPanelDropdown', ingestPanelDropdown)
    .directive('lbNotificationsCount', notificationsCount)
    .directive('lbProducerEdit', producerEdit)
    .directive('lbProducerList', producerList)
    .directive('lbSyndicationSwitch', syndicationSwitch)
    .directive('lbSyndRmBlog', syndRmBlog)

    // config
    .config(activities)
    .config(api);
