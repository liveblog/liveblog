liveblogSyndication
    .factory('IngestPanelReducers', function() {
        var locallySyndicatedItems = function(syndicationIn, localSyndication) {
            return syndicationIn._items.filter(function(item) {
                return (localSyndication.indexOf(item.producer_blog_id) != -1);
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
                            return syndication.producer_blog_id;
                        });

                    return {
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: action.syndicationIn,
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
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: state.syndicationIn,
                        producers: action.producers,
                        producerBlogs: state.producerBlogs,
                        localSyndication: state.localSyndication,
                        locallySyndicatedItems: state.locallySyndicatedItems
                        //locallySyndicatedItems: locallySyndicatedItems(
                        //    state.syndicationIn, 
                        //    state.localSyndication
                        //)
                    }

                case 'ON_GET_PRODUCER_BLOGS':
                    return {
                        consumerBlogId: state.consumerBlogId,
                        syndicationIn: state.syndicationIn,
                        producers: state.producers,
                        producerBlogs: action.producerBlogs,
                        localSyndication: state.localSyndication,
                        locallySyndicatedItems: state.locallySyndicatedItems
                        //locallySyndicatedItems: locallySyndicatedItems(
                        //    state.syndicationIn, 
                        //    state.localSyndication
                        //)
                    }
            }
        }
    });
