liveblogMarketplace
    .directive('lbBlogPreviewModal', ['IngestPanelActions', '$sce', 
        function(IngestPanelActions, $sce) {
            return {
                templateUrl: 'scripts/liveblog-marketplace/views/blog-preview-modal.html',
                scope: {
                    store: '='
                },
                link: function(scope) {
                    var iframeAttrs = [
                        'width="100%"',
                        'height="715"',
                        'frameborder="0"',
                        'allowfullscreen'
                    ].join(' ');

                    scope.active = 'preview';

                    scope.store.connect(function(state) {
                        scope.embedModal = state.embedModal;

                        if (state.currentBlog)
                            scope.currentBlog = angular.extend(state.currentBlog, {
                                embed: '<iframe '+iframeAttrs+' src="'
                                    + state.currentBlog.public_url+'"></iframe>',
                                public_url: $sce.trustAsResourceUrl(state.currentBlog.public_url)
                            });
                    });
                }
            }
        }]);
