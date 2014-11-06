(function() {
    'use strict';

    BlogListController.$inject = ['$scope', '$location', 'api', 'gettext'];
    function BlogListController($scope, $location, api, gettext) {
        $scope.maxResults = 25;

        $scope.states = [
            {code: 'open', text: gettext('Active blogs')},
            {code: 'closed', text: gettext('Archived blogs')}
        ];

        $scope.activeState = $scope.states[0];

        $scope.changeState = function(state) {
            $scope.activeState = state;
        };

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
            $location.path('/liveblog/edit/' + blog._id);
        };

        function getCriteria() {
            var params = $location.search(),
                criteria = {
                    max_results: $scope.maxResults,
                    embedded: {'original_creator': 1},
                    where: {state: $scope.activeState.code}
                };

            if (params.q) {
                criteria.where.$or =  [
                        {name: {'$regex': params.q}},
                        {description: {'$regex': params.q}}
                    ];
            }

            criteria.where = JSON.stringify(criteria.where);
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
    app.filter('username', ['session', function usernameFilter(session) {
        return function getUsername(user) {
            return user ? user.display_name || user.username : null;
        };
    }])
    ;
})();
