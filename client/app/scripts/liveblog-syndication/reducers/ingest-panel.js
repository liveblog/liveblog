liveblogSyndication
    .factory('IngestPanelReducers', function() {
        var locallySyndicatedItems = function(syndicationIn, localSyndTokens) {
            return syndicationIn._items.filter(function(item) {
                return (localSyndTokens.indexOf(item.blog_token) != -1);
            });
        };

        return function(state, action) {
            switch (action.type) {
                case 'ON_GET_SYND':
                    var localSyndTokens = action.syndicationIn._items
                        .filter(function(syndication) {
                            return (syndication.blog_id == state.consumerBlogId);
                        })
                        .map(function(syndication) {
                            return syndication.blog_token;
                        });

                    return {
                        error: state.error,
                        modalActive: state.modalActive,
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: action.syndicationIn, //ACTION
                        producers: state.producers,
                        producerBlogs: state.producerBlogs,
                        localProducerBlogIds: state.localProducerBlogsIds,
                        localSyndTokens: localSyndTokens,
                        locallySyndicatedItems: locallySyndicatedItems(
                            action.syndicationIn, 
                            localSyndTokens
                        )
                    };

                case 'ON_GET_PRODUCERS':
                    return {
                        error: state.error,
                        modalActive: state.modalActive,
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: state.syndicationIn,
                        producers: action.producers, // ACTION
                        producerBlogs: state.producerBlogs,
                        localProducerBlogIds: state.localProducerBlogsIds,
                        localSyndTokens: state.localSyndTokens,
                        locallySyndicatedItems: state.locallySyndicatedItems
                    }

                case 'ON_GET_PRODUCER_BLOGS':
                    var localProducerBlogIds = [];

                    action.producerBlogs._items = action.producerBlogs._items
                        .filter(function(blog) {
                            // Only display the producer's blogs with an enabled syndication
                            return (blog.syndication_enabled);
                        })
                        .map(function(blog) {
                            blog.checked = false;
                            blog.auto_publish = true; // Default autopublish as true

                            state.locallySyndicatedItems.forEach(function(localBlog) {
                                if (localBlog.producer_blog_id == blog._id) {
                                    localProducerBlogIds.push(blog._id);
                                    blog.checked = true;
                                }

                            });

                            return blog;
                        });

                    return {
                        error: state.error,
                        modalActive: state.modalActive,
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: state.syndicationIn,
                        producers: state.producers,
                        producerBlogs: action.producerBlogs, // ACTION
                        localProducerBlogIds: localProducerBlogIds,
                        localSyndTokens: state.localSyndTokens,
                        locallySyndicatedItems: state.locallySyndicatedItems
                    }

                case 'ON_TOGGLE_MODAL':
                    return {
                        error: state.error,
                        modalActive: action.modalActive, // ACTION
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: state.syndicationIn,
                        producers: state.producers,
                        producerBlogs: state.producerBlogs,
                        localProducerBlogIds: state.localProducerBlogsIds,
                        localSyndTokens: state.localSyndTokens,
                        locallySyndicatedItems: state.locallySyndicatedItems
                    }

                case 'ON_ERROR':
                    return {
                        error: action.error, // ACTION
                        modalActive: state.modalActive,
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: state.syndicationIn,
                        producers: state.producers,
                        producerBlogs: state.producerBlogs,
                        localProducerBlogIds: state.localProducerBlogsIds,
                        localSyndTokens: state.localSyndTokens,
                        locallySyndicatedItems: state.locallySyndicatedItems
                    }
 
            }
        }
    });
