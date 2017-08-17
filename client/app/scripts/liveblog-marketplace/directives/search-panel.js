import searchPanelTpl from 'scripts/liveblog-marketplace/views/search-panel.html';

lbSearchPanel.$inject = ['MarketplaceActions'];

export default function lbSearchPanel(MarketplaceActions) {
    return {
        templateUrl: searchPanelTpl,
        scope: {
            store: '='
        },
        link: function(scope) {
            scope.categories = [
                {code: 'Breaking News', name: 'Breaking News'},
                {code: 'Entertainment', name: 'Entertainment'},
                {code: 'Business and Finance', name: 'Business and Finance'},
                {code: 'Sport', name: 'Sport'},
                {code: 'Technology', name: 'Technology'},
                {code: 'Politics', name: 'Politics'},
                {code: 'Others', name: 'Others'}
            ];

            scope.store.connect((state) => {
                scope.marketers = state.marketers;
                scope.filters = state.filters;
                scope.languages = state.languages;
            });

            scope.close = () => {
                MarketplaceActions.togglePanel(false);
            };
        }
    };
}
