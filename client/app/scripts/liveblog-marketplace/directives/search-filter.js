import searchFilterTpl from 'scripts/liveblog-marketplace/views/search-filter.html';

lbSearchFilter.$inject = ['MarketplaceActions'];

export default function lbSearchFilter(MarketplaceActions) {
    return {
        templateUrl: searchFilterTpl,
        scope: {
            filters: '=',
            terms: '=',
            title: '@',
            key: '@',
            id: '@'
        },
        link: function(scope) {
            scope.toggleFilter = function(type, value) {
                MarketplaceActions.toggleFilter(scope.filters, type, value);
            };

            scope.hasFilter = (type, value) => scope.filters
                && scope.filters.hasOwnProperty(type)
                && scope.filters[type] === value;
        }
    };
}
