import './styles/marketplace.scss';
import './../flux';

import marketplaceTpl from 'scripts/liveblog-marketplace/views/marketplace.html';

import marketplaceController from './controllers/marketplace';

import marketplaceActions from './actions/marketplace';
import marketplaceReducers from './reducers/marketplace';

import lbBlogsList from './directives/blogs-list';
import lbSearchPanel from './directives/search-panel';
import lbSearchFilter from './directives/search-filter';
import lbBlogPreviewModal from './directives/blog-preview-modal';
import lbMarketplaceSwitch from './directives/marketplace-switch';

export default angular
    .module('liveblog.marketplace', ['liveblog.flux'])
    .controller('MarketplaceController', marketplaceController)
    .factory('MarketplaceActions', marketplaceActions)
    .factory('MarketplaceReducers', marketplaceReducers)
    .directive('lbBlogsList', lbBlogsList)
    .directive('lbSearchPanel', lbSearchPanel)
    .directive('lbSearchFilter', lbSearchFilter)
    .directive('lbBlogPreviewModal', lbBlogPreviewModal)
    .directive('lbMarketplaceSwitch', lbMarketplaceSwitch)
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/marketplace/', {
                label: gettext('Marketplace'),
                controller: 'MarketplaceController',
                templateUrl: marketplaceTpl,
                category: superdesk.MENU_MAIN,
                priority: 100,
                adminTools: true,
                resolve: {isArchivedFilterSelected: function() {
                    return false;
                }}
            });
    }]);

