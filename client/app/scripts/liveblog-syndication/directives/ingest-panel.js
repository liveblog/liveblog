liveblogSyndication
    .directive('lbIngestPanel',
        ['IngestPanelActions', 'Store', 'IngestPanelReducers', '$routeParams', 'notify',
        function(IngestPanelActions, Store, IngestPanelReducers, $routeParams, notify) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/ingest-panel.html',
                link: function(scope) {
                    var handleError = function() {
                        notify.pop();
                        notify.error('Fatal Error! Producer might have gone for lunch');

                        IngestPanelActions.flushErrors();
                    };

                    scope.store = new Store(IngestPanelReducers, {
                        error: null,
                        consumerBlogId: $routeParams._id,
                        syndicationIn: {},
                        producers: {},
                        producerBlogs: {},
                        modalActive: false,
                        localProducerBlogIds: [],
                        locallySyndicatedItems: []
                    });

                    scope.store.connect(function(state) {
                        scope.syndicationIn = state.syndicationIn;
                        scope.locallySyndicatedItems = state.locallySyndicatedItems;
                        scope.modalActive = state.modalActive;

                        if (state.error) handleError();
                    });

                    IngestPanelActions.getSyndication();

                    scope.openSyndBlogsModal = function() {
                        IngestPanelActions.toggleModal(true);
                    }

                    scope.select = function(synd) {
                        // In case you're wondering, this method is calling
                        // a parent scope function in liveblog-edit/module
                        scope.openPanel('incoming-syndication', synd._id);
                    }

                    scope.$on('$destroy', scope.store.destroy);
                }
            };
        }]);
