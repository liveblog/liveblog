(function() {
    'use strict';

    BlogListController.$inject = ['$scope', '$location', 'api'];
    function BlogListController($scope, $location, api) {
        $scope.maxResults = 25;
        $scope.modalActive = false;

        $scope.newBlog = {
            title: null,
            description: null
        };

        $scope.cancel = function() {
            $scope.newBlog = {
                title: null,
                description: null
            };
            $scope.modalActive = false;
        };

        $scope.remove = function(blog) {
            _.remove($scope.blogs._items, blog);
        };

        $scope.edit = function(blog) {
            $location.path('/edit');
        };

        function getCriteria() {
            var params = $location.search(),
                criteria = {
                    max_results: $scope.maxResults
                };

            if (params.q) {
                criteria.where = JSON.stringify({
                    '$or': [
                        {name: {'$regex': params.q}},
                        {description: {'$regex': params.q}}
                    ]
                });
            }

            if (params.page) {
                criteria.page = parseInt(params.page, 10);
            }

            return criteria;
        }

        function fetchBlogs(criteria) {
            api.blogs.query(criteria)
                .then(function(blogs) {
                    $scope.blogs = blogs;
                });
        }

        $scope.$watch(getCriteria, fetchBlogs, true);
    }

    var app = angular.module('liveblog.bloglist', []);
    app.config(['apiProvider', function(apiProvider) {
        apiProvider.api('blogs', {
            type: 'http',
            backend: {rel: 'blogs'}
        });
    }]).config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/liveblog', {
                label: gettext('Blog List'),
                controller: BlogListController,
                templateUrl: 'scripts/liveblog-bloglist/views/main.html',
                category: superdesk.MENU_MAIN
            });
    }]);
    return app;
})();
