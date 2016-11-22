liveblogSyndication
    .factory('IngestPanelActions', ['Dispatcher', 'api', '$http', 'config', 
        function(Dispatcher, api, $http, config) {
            return {
                getSyndication: function() {
                    api.syndicationIn.query().then(function(syndicationIn) {
                        Dispatcher.dispatch({
                            type: 'ON_GET_SYND',
                            syndicationIn: syndicationIn
                        });
                    })
                    .catch(function(error) {
                        Dispatcher.dispatch({
                            type: 'ON_ERROR',
                            error: error
                        });
                    });

                },
                getProducers: function() {
                    api.producers.query().then(function(producers) {
                        Dispatcher.dispatch({
                            type: 'ON_GET_PRODUCERS',
                            producers: producers
                        });
                    })
                    .catch(function(error) {
                        Dispatcher.dispatch({
                            type: 'ON_ERROR',
                            error: error
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
                        data: { consumer_blog_id: consumerBlogId, auto_publish: blog.auto_publish },
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
                    })
                    .catch(function(error) {
                        Dispatcher.dispatch({
                            type: 'ON_ERROR',
                            error: error
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
                        })
                        .catch(function(error) {
                            Dispatcher.dispatch({
                                type: 'ON_ERROR',
                                error: error
                            });
                        });
                },
                toggleModal: function(value) {
                    Dispatcher.dispatch({
                        type: 'ON_TOGGLE_MODAL',
                        modalActive: value
                    });
                },
                flushErrors: function() {
                    Dispatcher.dispatch({
                        type: 'ON_ERROR',
                        error: null
                    });
                }
            };
        }])

