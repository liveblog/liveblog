var liveblogSyndication = angular
    .module('liveblog.syndication', ['liveblog.security']);

liveblogSyndication
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/consumers/', {
                label: gettext('Consumers Management'),
                controller: 'ConsumersController',
                templateUrl: 'scripts/liveblog-syndication/views/consumer-list.html',
                category: superdesk.MENU_MAIN,
                priority: 100,
                adminTools: true,
                resolve: {isArchivedFilterSelected: function() {return false;}}
            })
            .activity('/producers/', {
                label: gettext('Producers Management'),
                controller: 'ProducersController',
                templateUrl: 'scripts/liveblog-syndication/views/producer-list.html',
                category: superdesk.MENU_MAIN,
                priority: 100,
                adminTools: true,
                resolve: {isArchivedFilterSelected: function() {return false;}}
            });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider
            .api('consumers', {
                type: 'http',
                backend: {rel: 'consumers'}
            })
            .api('producers', {
                type: 'http',
                backend: {rel: 'producers'}
            });
    }]);

liveblogSyndication
    .factory('Dispatcher', function() {
        return {
            dispatch: function(action) {
                //console.log('beforeDispatch', action);
                document.dispatchEvent(
                    new CustomEvent('dispatch', { detail: action })
                );
            }
        }
    })
    .factory('Actions', ['Dispatcher', 'api', '$http', 'config', 
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
                        //return api.producers.query();
                        return api('syndication_in').query();
                    })
                    .then(function(syndicationIn) {
                        Dispatcher.dispatch({
                            type: 'ON_GET_SYND',
                            syndicationIn: syndicationIn
                        });
                    });
                }
            };
        }])
    .factory('Reducers', function() {
        return function(data, action) {
            switch (action.type) {
                case 'ON_GET_SYND':
                    return {
                        syndicationIn: action.syndicationIn,
                        producers: data.producers
                    };

                case 'ON_GET_PRODUCERS':
                    return {
                        syndicationIn: data.syndicationIn,
                        producers: action.producers
                    }
            }
        }
    })
    .factory('Store', [ 'Reducers', function(Reducers) {
        var Store = function(callback) {
            this.dispatch = this.dispatch.bind(this);
            this.callback = callback;
            document.addEventListener('dispatch', this.dispatch);
            this.data = { syndicationIn: [] };
        };

        Store.prototype.dispatch = function(e) {
            this.data = Reducers(this.data, e.detail);
            this.callback(this.data);
        }

        return Store;
    }]);
