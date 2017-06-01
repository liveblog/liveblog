ingestPanelActions.$inject = ['Dispatcher', 'api', '$http', 'config'];

export default function ingestPanelActions(Dispatcher, api, $http, config) {
    return {
        getSyndication: function(consumerBlogId, unreadQueue) {
            var params = {
                where: {
                    blog_id: consumerBlogId
                }
            };

            api.syndicationIn.query(params)
                .then((syndicationIn) => {
                    Dispatcher.dispatch({
                        type: 'ON_GET_SYND',
                        syndicationIn: syndicationIn
                    });

                    if (unreadQueue) {
                        Dispatcher.dispatch({
                            type: 'ON_SET_UNREAD_QUEUE',
                            unreadQueue: unreadQueue
                        });
                    }
                })
                .catch((error) => {
                    Dispatcher.dispatch({
                        type: 'ON_ERROR',
                        error: error
                    });
                });
        },
        getProducers: function() {
            api.producers.query({max_results: 1000}) // Bad hard coded number!
                .then((producers) => {
                    Dispatcher.dispatch({
                        type: 'ON_GET_PRODUCERS',
                        producers: producers
                    });
                })
                .catch((error) => {
                    Dispatcher.dispatch({
                        type: 'ON_ERROR',
                        error: error
                    });
                });
        },
        syndicate: function(params) {
            var uri = config.server.url +
                '/producers/' + params.producerId +
                '/syndicate/' + params.producerBlogId;

            let data = {
                consumer_blog_id: params.consumerBlogId,
                auto_publish: params.autoPublish,
                auto_retrieve: params.autoRetrieve
            };

            return $http({
                url: uri,
                method: params.method === 'DELETE' ? 'DELETE' : 'POST',
                data: data,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            })
            .then((response) => api('syndication_in').query())
            .then((syndicationIn) => {
                Dispatcher.dispatch({
                    type: 'ON_GET_SYND',
                    syndicationIn: syndicationIn
                });
            })
            .catch((error) => {
                Dispatcher.dispatch({
                    type: 'ON_ERROR',
                    error: error
                });
            });
        },
        getProducerBlogs: function(producerId) {
            api.get('/producers/' + producerId + '/blogs')
                .then((blogs) => {
                    Dispatcher.dispatch({
                        type: 'ON_GET_PRODUCER_BLOGS',
                        producerBlogs: blogs
                    });
                })
                .catch((error) => {
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
        updateSyndication: function(syndId, data, etag) {
            return $http({
                url: config.server.url + '/syndication_in/' + syndId,
                method: 'PATCH',
                data: data,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'If-Match': etag
                }
            })
            .then((response) => {
                Dispatcher.dispatch({
                    type: 'ON_UPDATED_SYND',
                    syndEntry: response.data
                });
            });
        },
        flushErrors: function() {
            Dispatcher.dispatch({
                type: 'ON_ERROR',
                error: null
            });
        },
        setUnreadQueue: function(unreadQueue) {
            Dispatcher.dispatch({
                type: 'ON_SET_UNREAD_QUEUE',
                unreadQueue: unreadQueue
            });
        }
    };
}
