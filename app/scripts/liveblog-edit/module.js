define([
    'angular',
    'require',
    './sir-trevor-blocks/image-with-description-and-credit',
    'ng-sir-trevor'
], function(angular, require, imageBlockFactory) {
    'use strict';

    BlogEditController.$inject = ['api', '$scope', 'blog', 'notify', 'gettext', '$route', 'upload'];
    function BlogEditController(api, $scope, blog, notify, gettext, $route, upload) {
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

        $scope.publish = function() {
            notify.info(gettext('Saving post'));
            $scope.create().then(function() {
                notify.pop();
                notify.info(gettext('Post saved'));
                $scope.editor.clear();
            }, function() {
                notify.pop();
                notify.error(gettext('Something went wrong. Please try again later'));
            });
        };

        $scope.create = function() {
            //@TODO: refactor with a propper deferred of with a blocks save.
            var dfd;
            _.each($scope.editor.get(), function(block) {
                dfd = api.posts.save({text: block.data.text, blog: $route.current.params._id});
            });
            return dfd;
        };

        $scope.$watch('blog.state', function() {
            //the text on the open/close button
            $scope.toggleStateText = $scope.blog.state === 'open' ? gettext('Archive Blog'): gettext('Activate Blog');
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

        $scope.stParams = {
            // provide an uploader to the editor for media (custom sir-trevor image block uses it)
            uploader: function(file, success_callback, error_callback) {
                var handleError = error_callback;
                // return a promise of upload which will call the success/error callback
                return api.upload.getUrl().then(function(url) {
                    upload.start({
                        method: 'POST',
                        url: url,
                        data: {media: file}
                    })
                    .then(function(response) {
                        if (response.data._issues) {
                            return handleError(response);
                        }
                        success_callback();
                    }, handleError, function(progress) {
                    });
                });
            }
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

    return angular.module('liveblog.edit', ['SirTrevor'])
        .config(['superdeskProvider', function(superdesk) {
            superdesk.activity('/liveblog/edit/:_id', {
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
            apiProvider.api('upload', {
                type: 'http',
                backend: {rel: 'upload'}
            });

        }]).config(['SirTrevorOptionsProvider', function(SirTrevorOptions) {
            SirTrevorOptions.$extend({
                blockTypes: ['Text', 'ImageWithDescriptionAndCredit']
            });
        }]).config(['SirTrevorProvider', function(SirTrevor) {
            // add a custom block with the name as parameter
            // NOTE: It must be the class name in lower case with hyphens
            SirTrevor.Blocks.ImageWithDescriptionAndCredit = imageBlockFactory('image-with-description-and-credit');
        }]);
});
