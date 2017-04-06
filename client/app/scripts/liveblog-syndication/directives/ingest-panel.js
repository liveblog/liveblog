import ingestPanelTpl from 'scripts/liveblog-syndication/views/ingest-panel.html';

ingestPanel.$inject = [
    'IngestPanelActions',
    'Store',
    'IngestPanelReducers',
    '$routeParams',
    'notify',
    '$timeout'
];

export default function ingestPanel(
    IngestPanelActions,
    Store,
    IngestPanelReducers,
    $routeParams,
    notify,
    $timeout
) {
    return {
        templateUrl: ingestPanelTpl,
        scope: {
            ingestQueue: '=',
            openPanel: '='
        },
        link: function(scope) {
            var handleError = function() {
                notify.pop();
                notify.error(gettext('An error has been occurred. Please try again later!'));

                IngestPanelActions.flushErrors();
            };

            scope.store = new Store(IngestPanelReducers, {
                error: null,
                consumerBlogId: $routeParams._id,
                syndicationIn: {},
                producers: {_items: []},
                producerBlogs: {_items: []},
                modalActive: false,
                localProducerBlogIds: [],
                locallySyndicatedItems: [],
                unreadQueue: []
            });

            scope.store.connect((state) => {
                scope.syndicationIn = state.syndicationIn;
                scope.modalActive = state.modalActive;
                scope.consumerBlogId = state.consumerBlogId;

                if (state.error) {
                    handleError();
                }

                if (state.producers._items.length > 0) {
                    $timeout(() => {
                        scope.locallySyndicatedItems = state.locallySyndicatedItems.map((blog) => {
                            blog.unread = 0;

                            // Set unread (pending notifications) value for each
                            state.unreadQueue.forEach((element) => {
                                if (blog._id === element.syndication_in) {
                                    blog.unread++;
                                }
                            });

                            state.producers._items.forEach((producer) => {
                                if (producer._id === blog.producer_id) {
                                    blog.producer_name = producer.name;
                                }
                            });

                            return blog;
                        });
                    });
                }
            });

            // Small inconsistency in the code. This function takes
            // the consumer blog id as a parameter.
            // Whereas IncomingSyndication.getSyndiction takes the
            // actual syndication id as a parameter.
            IngestPanelActions.getSyndication($routeParams._id);

            // This watches for incoming posts when ingest is not in focus
            if (scope.ingestQueue.length > 0) {
                IngestPanelActions.setUnreadQueue(scope.ingestQueue);
                scope.ingestQueue = [];
            }

            // This watches for incoming posts when ingest is in focus
            scope.$on('posts', (e, data) => {
                let syndPosts = data.posts
                    .filter((post) => post.hasOwnProperty('syndication_in'));

                IngestPanelActions.setUnreadQueue(syndPosts);
            });

            scope.openSyndBlogsModal = function() {
                IngestPanelActions.toggleModal(true);
            };

            scope.select = function(synd) {
                // In case you're wondering, this method calls
                // a parent scope function in liveblog-edit/module
                scope.openPanel('incoming-syndication', synd._id);
            };

            scope.$on('$destroy', scope.store.destroy);
        }
    };
}
