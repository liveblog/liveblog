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
                        modalActive: false,
                        localProducerBlogIds: [],
                        locallySyndicatedItems: []
                    });

                    scope.store.connect(function(state) {
                        scope.syndicationIn = state.syndicationIn;
                        scope.locallySyndicatedItems = state.locallySyndicatedItems;
                        scope.modalActive = state.modalActive;
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

                    scope.toggleDropdown = function($event, blog) {
                        if (!blog.hasOwnProperty('isOpen'))
                            blog.isOpen = false;

                        $event.preventDefault();
                        $event.stopPropagation();

                        blog.isOpen = !blog.isOpen;
                    };

                    scope.updateSyndication = function(synd) {
                        console.log('synd', synd);
                        IngestPanelActions.updateSyndication(
                            synd._id,
                            { auto_publish: synd.auto_publish },
                            synd._etag
                        );
                    };

                    scope.open = false;
                    scope.$on('$destroy', scope.store.destroy);
                }
            };
        }]);
