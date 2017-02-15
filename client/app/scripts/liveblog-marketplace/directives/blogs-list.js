liveblogMarketplace
    .directive('lbBlogsList', function() {
        return {
            templateUrl: 'scripts/liveblog-marketplace/views/blogs-list.html',
            scope: {
                title: '@',
                blogs: '='
            }
        }
    })
