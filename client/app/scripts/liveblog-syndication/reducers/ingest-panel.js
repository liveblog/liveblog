liveblogSyndication
    .factory('IngestPanelReducers', function() {
        var locallySyndicatedItems = function(syndicationIn, localSyndication) {
            return syndicationIn._items.filter(function(item) {
                //return (localSyndication.indexOf(item.producer_blog_id) != -1);
                return (localSyndication.indexOf(item.blog_token) != -1);
            });
        };

        return function(state, action) {
            console.log(action.type);

            switch (action.type) {
                case 'ON_GET_SYND':
                    var localSyndication = action.syndicationIn._items
                        .filter(function(syndication) {
                            return (syndication.blog_id == state.consumerBlogId);
                        })
                        .map(function(syndication) {
                            return syndication.blog_token;
                        });

                    return {
                        modalActive: state.modalActive,
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: action.syndicationIn, //ACTION
                        producers: state.producers,
                        producerBlogs: state.producerBlogs,
                        localSyndication: localSyndication,
                        locallySyndicatedItems: locallySyndicatedItems(
                            action.syndicationIn, 
                            localSyndication
                        )
                    };

                case 'ON_GET_PRODUCERS':
                    return {
                        modalActive: state.modalActive,
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: state.syndicationIn,
                        producers: action.producers, // ACTION
                        producerBlogs: state.producerBlogs,
                        localSyndication: state.localSyndication,
                        locallySyndicatedItems: state.locallySyndicatedItems
                    }

                case 'ON_GET_PRODUCER_BLOGS':
                    action.producerBlogs._items = action.producerBlogs._items.map(function(blog) {
                        blog.checked = false;

                        state.locallySyndicatedItems.forEach(function(localBlog) {
                            if (localBlog.producer_blog_id == blog._id)
                                blog.checked = true;
                        });

                        return blog;
                    });

                    return {
                        modalActive: state.modalActive,
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: state.syndicationIn,
                        producers: state.producers,
                        producerBlogs: action.producerBlogs, // ACTION
                        localSyndication: state.localSyndication,
                        locallySyndicatedItems: state.locallySyndicatedItems
                    }

                case 'ON_TOGGLE_MODAL':
                    return {
                        modalActive: action.modalActive, // ACTION
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: state.syndicationIn,
                        producers: state.producers,
                        producerBlogs: state.producerBlogs,
                        localSyndication: state.localSyndication,
                        locallySyndicatedItems: state.locallySyndicatedItems
                    }
            }
        }
    });
