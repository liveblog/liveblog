ingestPanelActions.$inject = ['Dispatcher', 'api', '$http', 'config', 'moment'];

export default function ingestPanelActions(Dispatcher, api, $http, config, moment) {
    const denormalizeDate = function(dateString) {
        return moment
            .tz(dateString, config.model.dateformat, config.defaultTimezone)
            .utc() // Date needs to be converted to UTC because of daylight savings
            .format(config.system.dateTimeTZ);
    };

    return {
        getSyndication: function(consumerBlogId) {
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
                })
                .catch((error) => {
                    Dispatcher.dispatch({
                        type: 'ON_ERROR',
                        error: error
                    });
                });
        },
        getProducers: function() {
            api.producers.query()
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

            if (params.method !== 'DELETE') {
                data.start_date = denormalizeDate(params.startDate);
            }

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
            data.start_date = denormalizeDate(data.start_date);

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
