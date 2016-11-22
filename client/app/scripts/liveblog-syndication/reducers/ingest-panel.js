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

                    return angular.extend(state, {
                        syndicationIn: action.syndicationIn, //ACTION
                        localSyndTokens: localSyndTokens,
                        locallySyndicatedItems: locallySyndicatedItems(
                            action.syndicationIn, 
                            localSyndTokens
                        )
                    });

                case 'ON_GET_PRODUCERS':
                    return angular.extend(state, {
                        producers: action.producers
                    });

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

                    return angular.extend(state, {
                        producerBlogs: action.producerBlogs, // ACTION
                        localProducerBlogIds: localProducerBlogIds
                    });

                case 'ON_TOGGLE_MODAL':
                    return angular.extend(state, {
                        modalActive: action.modalActive
                    });
            }
        }
    });
