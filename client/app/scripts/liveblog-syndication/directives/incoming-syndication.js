liveblogSyndication
    .directive('lbIncomingSyndication',
        ['$routeParams', 'IncomingSyndicationActions', 'IncomingSyndicationReducers', 'Store', '$route',
        function($routeParams, IncomingSyndicationActions, IncomingSyndicationReducers, Store, $route) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/incoming-syndication.html',
                link: function(scope) {
                    scope.store = new Store(IncomingSyndicationReducers, {
                        posts: {},
                        syndication: {}
                    });

                    scope.store.connect(function(state) {
                        scope.posts = state.posts;
                        scope.syndication = state.syndication;
                    });
                    console.log('route', $route.current.params.syndId);

                    //IncomingSyndicationActions
                    //    .getPosts($routeParams._id, 'draft');

                    IncomingSyndicationActions
                        .getSyndication($routeParams.syndId);
                }
            };
        }]);
