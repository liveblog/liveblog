liveblogSyndication
    .factory('IncomingSyndicationActions',
        ['Dispatcher', 'api', 'postsService', '$rootScope',
        function(Dispatcher, api, postsService, $rootScope) {
            return {
                getPosts: function(blogId, syndicationId) {
                    postsService.getPosts(blogId, { syndicationIn: syndicationId })
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
