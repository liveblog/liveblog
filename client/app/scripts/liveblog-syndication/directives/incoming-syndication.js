liveblogSyndication
    .directive('lbIncomingSyndication', ['PagesManager', '$routeParams', 
        function(PagesManager, $routeParams) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/incoming-syndication.html',
                link: function(scope) {
                    var blogId = $routeParams._id,
                        status = 'draft',
                        pagesManager = new PagesManager(blogId, status, 10, 'editorial');

                    scope.posts = {};
                    console.log('pages manager');

                    pagesManager.fetchNewPage().then(function(data) {
                        console.log('data', data);
                        scope.posts = data;
                    });
                }
            };
        }]);
