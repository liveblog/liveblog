define([
    'angular'
], function(angular) {
    'use strict';

    BlogEditController.$inject = ['api', '$scope', 'blog', 'notify', 'gettext', '$route'];
    function BlogEditController(api, $scope, blog, notify, gettext, $route) {
        $scope.blog = blog;
        $scope.oldBlog = _.create(blog);
        $scope.updateBlog = function(blog) {
            if (_.isEmpty(blog)) {
                return;
            }
            notify.info(gettext('saving..'));
            api.blogs.save($scope.blog, blog).then(function(newBlog) {
                notify.pop();
                notify.success(gettext('blog saved.'));
                $scope.oldBlog = _.create(newBlog);
                $scope.blog = newBlog;
            });
        };

        $scope.post = '';
        $scope.timeline = [];
        $scope.publish = function() {
            notify.info(gettext('Saving post'));
            $scope.create().then(function() {
                notify.pop();
                notify.info(gettext('Post saved'));
                $scope.timeline.push($scope.post);
                $scope.post = '';
            }, function() {
                notify.pop();
                notify.error(gettext('Something went wrong. Please try again later'));
            });
        };

        $scope.create = function() {
            return api.posts.save({text: $scope.post, blog: $route.current.params._id});
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
    app.config(['superdeskProvider', function(superdesk) {
    superdesk
        .activity('/liveblog/edit/:_id', {
            label: gettext('Blog Edit'),
            controller: BlogEditController,
            templateUrl: 'scripts/liveblog-edit/views/main.html',
            resolve: {blog: BlogResolver}
        });
    }]).config(['apiProvider', function(apiProvider) {
        apiProvider.api('posts', {
            type: 'http',
            backend: {rel: 'posts'}
        });
    }]);

    return app;
});
