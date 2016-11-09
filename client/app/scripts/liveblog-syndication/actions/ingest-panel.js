liveblogSyndication
    .factory('IngestPanelActions', ['Dispatcher', 'api', '$http', 'config', 
        function(Dispatcher, api, $http, config) {
            return {
                getSyndication: function() {
                    api('syndication_in').query().then(function(syndicationIn) {
                        Dispatcher.dispatch({
                            type: 'ON_GET_SYND',
                            syndicationIn: syndicationIn
                        });
                    });
                },
                getProducers: function() {
                    api.producers.query().then(function(producers) {
                        Dispatcher.dispatch({
                            type: 'ON_GET_PRODUCERS',
                            producers: producers
                        });
                    });
                },
                syndicate: function(currentProducer, consumerBlogId, blog, method) {
                    var uri = config.server.url + 
                        '/producers/' + currentProducer._id + 
                        '/syndicate/' + blog._id;

                    return $http({
                        url: uri,
                        method: (method == 'DELETE') ? 'DELETE' : 'POST',
                        data: { consumer_blog_id: consumerBlogId },
                        headers: {
                            "Content-Type": "application/json;charset=utf-8"
                        }
                    })
                    .then(function(response) {
                        return api('syndication_in').query();
                    })
                    .then(function(syndicationIn) {
                        Dispatcher.dispatch({
                            type: 'ON_GET_SYND',
                            syndicationIn: syndicationIn
                        });
                    });
                },
                getProducerBlogs: function(producerId) {
                    api.get('/producers/' + producerId + '/blogs')
                        .then(function(blogs) {
                            Dispatcher.dispatch({
                                type: 'ON_GET_PRODUCER_BLOGS',
                                producerBlogs: blogs
                            });
                        });
                },
                toggleModal: function(value) {
                    Dispatcher.dispatch({
                        type: 'ON_TOGGLE_MODAL',
                        modalActive: value
                    });
                }
                //getSyndicatedBlogs: function() {
                //    api('syndication_in').query()
                //        .then(function(syndicationIn) {
                //            return syndicationIn._items
                //                .map(function(synd) {
                //                    var uri = '/producers/' + synd.producer_id + 
                //                        '/blogs/' + synd.producer_blog_id;

                //                    api.get(uri).then(function(result) {
                //                        console.log('syndicated blog', result);
                //                    });
                //                });
                //        })
                //},
 
            };
        }])

