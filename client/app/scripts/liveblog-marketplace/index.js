import './styles/marketplace.scss';
import './../flux';

import marketplaceController from './controllers/marketplace';

import marketplaceActions from './actions/marketplace';
import marketplaceReducers from './reducers/marketplace';

import lbBlogsList from './directives/blogs-list';
import lbSearchPanel from './directives/search-panel';
import lbBlogPreviewModal from './directives/blog-preview-modal';

export default angular
    .module('liveblog.marketplace', ['liveblog.flux'])
    .controller('MarketplaceController', marketplaceController)
    .factory('MarketplaceActions', marketplaceActions)
    .factory('MarketplaceReducers', marketplaceReducers)
    .directive('lbBlogsList', lbBlogsList)
    .directive('lbSearchPanel', lbSearchPanel)
    .directive('lbBlogPreviewModal', lbBlogPreviewModal)
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/marketplace/', {
                label: gettext('Marketplace'),
                controller: 'MarketplaceController',
                templateUrl: 'scripts/liveblog-marketplace/views/marketplace.html',
                category: superdesk.MENU_MAIN,
                priority: 100,
                adminTools: true,
                resolve: {isArchivedFilterSelected: function() {return false;}}
            });
    }]);

