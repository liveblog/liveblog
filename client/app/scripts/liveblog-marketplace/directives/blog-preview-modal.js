import previewModalTpl from 'scripts/liveblog-marketplace/views/blog-preview-modal.ng1';

lbBlogPreviewModal.$inject = ['MarketplaceActions', '$sce'];

export default function lbBlogPreviewModal(MarketplaceActions, $sce) {
    return {
        templateUrl: previewModalTpl,
        scope: {
            store: '=',
        },
        link: function(scope) {
            const iframeAttrs = [
                'width="100%"',
                'height="715"',
                'frameborder="0"',
                'allowfullscreen',
            ].join(' ');

            scope.active = 'preview';

            scope.closeEmbedModal = MarketplaceActions.closeEmbedModal;

            // This is unfortunately not the cleanest way to proceed,
            // but it avoid having a non empty current blog value
            // when closing the modal by clicking outside of it.
            scope.$watch('embedModal', (embedModal) => {
                if (!embedModal && scope.currentBlog) {
                    MarketplaceActions.closeEmbedModal();
                }
            });

            scope.store.connect((state) => {
                scope.embedModal = state.embedModal;
                scope.currentBlog = state.currentBlog;

                if (state.currentBlog) {
                    scope.currentBlog = angular.extend(scope.currentBlog, {
                        embed: '<iframe ' + iframeAttrs + ' src="'
                            + scope.currentBlog.public_url + '"></iframe>',
                        iframeUrl: $sce.trustAsResourceUrl(scope.currentBlog.public_url),
                    });
                }
            });
        },
    };
}
