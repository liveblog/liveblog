liveblogSyndication
    .directive('lbIncomingSyndication',
        ['$routeParams', 'IncomingSyndicationActions', 'IncomingSyndicationReducers', 'Store', 'modal',
        function($routeParams, IncomingSyndicationActions, IncomingSyndicationReducers, Store, modal) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/incoming-syndication.html',
                scope: {
                    lbPostsOnPostSelected: '=',
                    openPanel: '=',
                    syndId: '='
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

                    scope.publish = function(post) {
                        IncomingSyndicationActions
                            .publish(post);
                    };

                    scope.askRemove = function(post) {
                        modal.confirm(gettext('Are you sure you want to delete the post?'))
                            .then(function() {
                                IncomingSyndicationActions
                                    .destroy(post);
                            });
                    };

                    IncomingSyndicationActions
                        .getPosts(scope.blogId, scope.syndId);

                    IncomingSyndicationActions
                        .getSyndication(scope.syndId);

                    // On incoming post, we reload all the posts.
                    // Not very fast, but easy to setup
                    scope.$on('posts', function(e, data) {
                        if (data.posts[0].syndication_in)
                            IncomingSyndicationActions
                                .getPosts(scope.blogId, scope.syndId);
                    });

                    scope.$on('$destroy', scope.store.destroy);
                }
            };
        }]);
