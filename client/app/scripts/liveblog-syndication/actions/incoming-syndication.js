liveblogSyndication
    .factory('IncomingSyndicationActions', ['Dispatcher', 'PagesManager',
        function(Dispatcher, PagesManager) {
            return {
                getPosts: function(blogId, status) {
                    new PagesManager(blogId, status, 10, 'editorial')
                        .fetchNewPage()
                        .then(function(posts) {
                            Dispatcher.dispatch({
                                type: 'ON_GET_POSTS',
                                posts: posts
                            });
                        });
                }
            }
        }]);
