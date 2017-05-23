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
                "Breaking News",
                "Entertainment",
                "Business and Finance",
                "Sport",
                "Technology"
            ];

            scope.languages = [
                {code: 'en', name: 'English'},
                {code: 'de', name: 'Deutsch'}
            ];

            scope.store.connect((state) => {
                scope.marketers = state.marketers;
                scope.filters = state.filters;
            });

            scope.toggleFilter = (type, value) => {
                MarketplaceActions.toggleFilter(scope.filters, type, value);
            };

            scope.hasFilter = (type, value) => scope.filters
                && scope.filters.hasOwnProperty(type)
                && scope.filters[type] === value;

            scope.close = function() {
                MarketplaceActions.togglePanel(false);
            };
        }
    };
}
