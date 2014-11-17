define([
    'angular'
], function(angular) {
    'use strict';

    BlogEditController.$inject = ['api', '$scope', 'blog', 'notify', 'gettext'];
    function BlogEditController(api, $scope, blog, notify, gettext) {
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

        $scope.$watch('blog.state', function() {
            //the text on the open/close button
            $scope.toggleStateText = $scope.blog.state === 'open' ? gettext('Close Blog'): gettext('Reopen Blog');
            $scope.disableInterfaceSwitch = $scope.blog.state === 'open' ? false: true;
        });

        $scope.toggleBlogState = function() {
            var newStateValue = $scope.blog.state === 'open' ? 'closed': 'open';
            api.blogs.save($scope.blog, {'state': newStateValue})
            .then(function() {
                $scope.blog.state = newStateValue;
            }, function(response) {
                notify.error(gettext('Something went wrong. Please try again later'));
            });
        };
    }

    /**
     * Resolve a blog by route id and redirect to /liveblog if such blog does not exist
     */
    BlogResolver.$inject = ['api', '$route', '$location', 'notify', 'gettext'];
    function BlogResolver(api, $route, $location, notify, gettext) {
        return api('blogs').getById($route.current.params._id)
            .then(null, function(response) {
                if (response.status === 404) {
                    notify.error(gettext('Blog was not found, sorry.'), 5000);
                    $location.path('/liveblog');
                }

                return response;
            });
    }

    var app = angular.module('liveblog.edit', []);

    app
        .config(['superdeskProvider', function(superdesk) {
            superdesk
                .activity('/liveblog/edit/:_id', {
                    label: gettext('Blog Edit'),
                    controller: BlogEditController,
                    templateUrl: 'scripts/liveblog-edit/views/main.html',
                    resolve: {blog: BlogResolver}
                });
        }]);

    return app;
});
