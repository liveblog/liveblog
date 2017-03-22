import blogsListTpl from 'scripts/liveblog-marketplace/views/blogs-list.html';

lbBlogsList.$inject = ['MarketplaceActions'];

export default function lbBlogsList(MarketplaceActions) {
    return {
        templateUrl: blogsListTpl,
        scope: {
            title: '@',
            blogs: '='
        },
        link: function(scope) {
            scope.openEmbedModal = MarketplaceActions.openEmbedModal;
        }
    }
}
