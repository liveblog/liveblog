liveblogSyndication
    .factory('IncomingSyndicationActions', ['Dispatcher', 'api', 'postsService',
        function(Dispatcher, api, postsService) {
            return {
                getPosts: function(blogId, syndicationId) {
                    var filters = {
                        status: 'submitted',
                        syndicationIn: syndicationId
                    };

                    postsService.getPosts(blogId, filters)
                        .then(function(posts) {
                            Dispatcher.dispatch({
                                type: 'ON_GET_POSTS',
                                posts: posts
                            });
                        });
                },
                getSyndication: function(syndicationId) {
                    api.syndicationIn.getById(syndicationId).then(function(syndication) {
                        api.producers.getById(syndication.producer_id).then(function(producer) {
                            syndication.producer = producer;

                            Dispatcher.dispatch({
                                type: 'ON_GET_SYNDICATION',
                                syndication: syndication
                            });
                        });
                    });
                }
            }
        }]);
