liveblogSyndication
    .directive('lbIngestPanel',
        ['IngestPanelActions', 'Store', 'IngestPanelReducers', '$routeParams', 'notify',
        function(IngestPanelActions, Store, IngestPanelReducers, $routeParams, notify) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/ingest-panel.html',
                link: function(scope) {
                    var handleError = function() {
                        notify.pop();
                        notify.error(gettext('Fatal Error! Producer might have gone for lunch'));

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
                        scope.consumerBlogId = state.consumerBlogId;

                        if (state.error) handleError();
                    });

                    // Small inconsistency in the code. This function takes
                    // the consumer blog id as a parameter.
                    // Whereas IncomingSyndication.getSyndiction takes the
                    // actual syndication id as a parameter.
                    IngestPanelActions.getSyndication($routeParams._id);

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
                        IngestPanelActions.updateSyndication(
                            synd._id,
                            { auto_publish: synd.auto_publish },
                            synd._etag
                        );
                    };

                    scope.destroy = function($event, synd) {
                        $event.preventDefault();
                        $event.stopPropagation();

                        IngestPanelActions.syndicate({
                            producerId: synd.producer_id,
                            producerBlogId: synd.producer_blog_id,
                            consumerBlogId: scope.consumerBlogId,
                            autoPublish: synd.auto_publish,
                            method: 'DELETE'
                        });
                    };

                    scope.open = false;
                    scope.$on('$destroy', scope.store.destroy);
                }
            };
        }]);
