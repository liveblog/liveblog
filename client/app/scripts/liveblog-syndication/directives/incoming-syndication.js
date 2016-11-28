liveblogSyndication
    .directive('lbIncomingSyndication',
        ['$routeParams', 'IncomingSyndicationActions', 'IncomingSyndicationReducers', 'Store',
        function($routeParams, IncomingSyndicationActions, IncomingSyndicationReducers, Store) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/incoming-syndication.html',
                scope: {
                    lbPostsOnPostSelected: '=',
                    openPanel: '='
                },
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
                        scope.openPanel('ingest', null);
                    };

                    IncomingSyndicationActions
                        .getPosts(scope.blogId, scope.syndId);

                    IncomingSyndicationActions
                        .getSyndication(scope.syndId);

                    // On incoming post, we reload all the posts.
                    // Not very fast, but easy to setup
                    scope.$on('posts', function() {
                        IncomingSyndicationActions
                            .getPosts(scope.blogId, scope.syndId);
                    });

                    scope.$on('$destroy', scope.store.destroy);
                }
            };
        }]);
