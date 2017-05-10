ingestPanelReducers.$inject = ['moment'];

export default function ingestPanelReducers(moment) {
    // Associate a syndication to a producer blog via blog token
    var locallySyndicatedItems = function(syndicationIn, localSyndTokens) {
        return syndicationIn._items
            .filter((item) => localSyndTokens.indexOf(item.blog_token) !== -1);
    };

    return function(state, action) {
        switch (action.type) {
        case 'ON_GET_SYND':
                // Filters out syndicationIns that aren't corresponding to the current blog
            var localSyndTokens = action.syndicationIn._items
                .filter((syndication) => syndication.blog_id === state.consumerBlogId)
                .map((syndication) => syndication.blog_token);

            return angular.extend(state, {
                syndicationIn: action.syndicationIn, // ACTION
                localSyndTokens: localSyndTokens,
                locallySyndicatedItems: locallySyndicatedItems(
                    action.syndicationIn,
                    localSyndTokens
                ),
                localProducerBlogIds: [], // Reset list after syndication
                producerBlogs: [] // Same here
            });

        case 'ON_UPDATED_SYND':
            var syndicationIn = angular.extend(state.syndicationIn, {
                _items: state.syndicationIn._items.map((item) => {
                    if (item._id === action.syndEntry._id) {
                        return action.syndEntry;
                    }

                    return item;
                })
            });

            return angular.extend(state, {
                syndicationIn: syndicationIn,
                locallySyndicatedItems: locallySyndicatedItems(
                    syndicationIn,
                    state.localSyndTokens
                )
            });

        case 'ON_GET_PRODUCERS':
            return angular.extend(state, {
                producers: action.producers
            });

        case 'ON_GET_PRODUCER_BLOGS':
            var localProducerBlogIds = [];

            return angular.extend(state, {
                producerBlogs: angular.extend(action.producerBlogs, {
                    _items: action.producerBlogs._items
                        // Only display the producer's blogs with an enabled syndication
                        .filter((blog) => blog.syndication_enabled)
                        .map((blog) => {
                            blog.checked = false;
                            blog.start_date = null; // Default start_date as null
                            blog.auto_publish = false; // Default autopublish as false
                            blog.auto_retrieve = true; // Default autoretrieve as true

                            blog.start_date = moment()
                                .subtract(14, 'd')
                                .format('YYYY-MM-DDTHH:MM:ss+00:00');

                            state.locallySyndicatedItems.forEach((localBlog) => {
                                if (localBlog.producer_blog_id === blog._id) {
                                    localProducerBlogIds.push(blog._id);
                                    blog.checked = true;
                                }
                            });

                            return blog;
                        })
                }),
                localProducerBlogIds: localProducerBlogIds
            });

        case 'ON_TOGGLE_MODAL':
            if (action.modalActive) {
                return angular.extend(state, {
                    modalActive: action.modalActive
                });
            }

            return angular.extend(state, {
                producerBlogs: {},
                localProducerBlogIds: [],
                modalActive: action.modalActive
            });

        case 'ON_ERROR':
            return angular.extend(state, {
                error: action.error
            });

        case 'ON_SET_UNREAD_QUEUE':
            return angular.extend(state, {
                unreadQueue: action.unreadQueue.filter((post) => {
                    let isAutoPublished = false;

                    if (state.syndicationIn._items.length > 0) {
                        state.syndicationIn._items.forEach((synd) => {
                            if (synd._id === post.syndication_in) {
                                isAutoPublished = post.auto_publish;
                            }
                        });
                    }

                    return !isAutoPublished;
                })
            });
        }
    };
}
