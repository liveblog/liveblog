lbBlogsList.$inject = ['MarketplaceActions'];

export default function lbBlogsList(MarketplaceActions) {
    return {
        templateUrl: 'scripts/liveblog-marketplace/views/blogs-list.html',
        scope: {
            title: '@',
            blogs: '='
        },
        link: function(scope) {
            scope.openEmbedModal = MarketplaceActions.openEmbedModal;
        }
    }
}
