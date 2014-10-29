define([
    'angular'
], function(angular) {
    'use strict';

    BlogEditController.$inject = ['$scope', 'blog'];
    function BlogEditController($scope, blog) {

        $scope.blog = blog;

        $scope.post = '';

        $scope.timeline = [];

        $scope.publish = function() {
            $scope.timeline.push($scope.post);
            $scope.create();
        };

        $scope.create = function() {
            $scope.post = '';
        };
    }

    /**
     * Resolve a blog by route id and redirect to /liveblog if such blog does not exist
     */
    BlogResolver.$inject = ['api', '$route', '$location'];
    function BlogResolver(api, $route, $location) {
        // return api('blogs').getById($route.current.params._id)
        //     .then(null, function(response) {
        //         if (response.status === 404) {
        //             $location.path('/liveblog');
        //         }

        //         return response;
        //     });

        return {title: 'This is simple blog'};
    }

    var app = angular.module('liveblog.edit', []);

    app
        .config(['superdeskProvider', function(superdesk) {
            superdesk
                .activity('/edit', {
                    label: gettext('Blog Edit'),
                    controller: BlogEditController,
                    templateUrl: 'scripts/liveblog-edit/views/main.html',
                    resolve: {blog: BlogResolver}
                });
        }]);

    return app;
});
