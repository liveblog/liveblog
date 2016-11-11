liveblogSyndication
    .directive('lbIncomingSyndication',
        ['$routeParams', 'IncomingSyndicationActions', 'IncomingSyndicationReducers', 'Store',
        function($routeParams, IncomingSyndicationActions, IncomingSyndicationReducers, Store) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/incoming-syndication.html',
                link: function(scope) {
                    scope.blogId = $routeParams._id;

                    scope.store = new Store(IncomingSyndicationReducers, {
                        posts: {},
                        syndication: {}
                    });

                    scope.store.connect(function(state) {
                        scope.posts = state.posts;
                        scope.syndication = state.syndication;
                    });

                    scope.goBack = function() {
                        console.log('go back');
                        scope.openPanel('ingest', null);
                    }

                    //IncomingSyndicationActions
                    //    .getPosts($routeParams._id, 'draft');

                    IncomingSyndicationActions
                        .getSyndication(scope.syndId);

                    scope.$on('$destroy', scope.store.destroy);
                }
            };
        }]);
