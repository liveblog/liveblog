liveblogSyndication
    .directive('lbIngestPanel',
        ['IngestPanelActions', 'Store', 'IngestPanelReducers', '$routeParams',
        function(IngestPanelActions, Store, IngestPanelReducers, $routeParams) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/ingest-panel.html',
                link: function(scope) {
                    scope.store = new Store(IngestPanelReducers, {
                        consumerBlogId: $routeParams._id,
                        syndicationIn: {},
                        producers: {},
                        producerBlogs: {},
                        locallySyndicatedItems: []
                    });

                    scope.store.connect(function(state) {
                        scope.syndicationIn = state.syndicationIn;
                        scope.localSyndication = state.localSyndication;
                        scope.locallySyndicatedItems = state.locallySyndicatedItems;

                        console.log('state', state);
                    });

                    IngestPanelActions.getSyndication();

                    scope.openSyndBlogsModal = function() {
                        scope.syndBlogsModalActive = true;
                    }

                    //scope.locallySyndicatedItems = function() {
                    //    return scope.syndicationIn._items.filter(function(item) {
                    //        return (scope.localSyndication.indexOf(item.blog_id) != -1);
                    //    });
                    //};
                }
            };
        }]);
