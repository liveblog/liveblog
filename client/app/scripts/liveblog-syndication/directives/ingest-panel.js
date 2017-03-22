import ingestPanelTpl from 'scripts/liveblog-syndication/views/ingest-panel.html';

ingestPanel.$inject = [
    'IngestPanelActions',
    'Store',
    'IngestPanelReducers',
    '$routeParams',
    'notify'
];

export default function ingestPanel(IngestPanelActions, Store, IngestPanelReducers, $routeParams, notify) {
    return {
        templateUrl: ingestPanelTpl,
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
                producerBlogs: {},
                modalActive: false,
                localProducerBlogIds: [],
                locallySyndicatedItems: []
            });

            scope.store.connect((state) => {
                scope.syndicationIn = state.syndicationIn;
                scope.locallySyndicatedItems = state.locallySyndicatedItems;
                scope.modalActive = state.modalActive;
                scope.consumerBlogId = state.consumerBlogId;

                if (state.error) {
                    handleError();
                }

                if (state.producers._items.length > 0) {
                    scope.locallySyndicatedItems.map((blog) => {
                        state.producers._items.forEach((producer) => {
                            if (producer._id === blog.producer_id) {
                                blog.producer_name = producer.name;
                            }
                        });

                        return blog;
                    });
                }
            });

            // Small inconsistency in the code. This function takes
            // the consumer blog id as a parameter.
            // Whereas IncomingSyndication.getSyndiction takes the
            // actual syndication id as a parameter.
            IngestPanelActions.getSyndication($routeParams._id);

            scope.openSyndBlogsModal = function() {
                IngestPanelActions.toggleModal(true);
            };

            scope.select = function(synd) {
                // In case you're wondering, this method is calling
                // a parent scope function in liveblog-edit/module
                scope.openPanel('incoming-syndication', synd._id);
            };

            scope.$on('$destroy', scope.store.destroy);
        }
    };
}
