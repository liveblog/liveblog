/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

define([
    'angular',
    'ng-sir-trevor',
    'ng-sir-trevor-blocks',
    'angular-embed'
], function(angular) {
    'use strict';

    BlogEditController.$inject = ['api', '$scope', 'blog', 'notify', 'gettext', '$route', 'upload', 'config', 'publishCounter', 'embedService'];
    function BlogEditController(api, $scope, blog, notify, gettext, $route, upload, config, publishCounter, embedService) {
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
                publishCounter.oneMore();
                $scope.editor.reinitialize();
            }, function() {
                notify.pop();
                notify.error(gettext('Something went wrong. Please try again later'));
            });
        };

        $scope.create = function() {
            //@TODO: refactor with a propper deferred of with a blocks save.
            var dfd;
            _.each($scope.editor.get(), function(block) {
                dfd = api.posts.save({text: block.text, blog: $route.current.params._id});
            });
            return dfd;
        };

        $scope.$watch('blog.blog_status', function() {
            //the text on the open/close button
            $scope.toggleStateText = $scope.blog.blog_status === 'open' ? gettext('Archive Blog'): gettext('Activate Blog');
            $scope.disableInterfaceSwitch = $scope.blog.blog_status === 'open' ? false: true;
        });

        $scope.toggleBlogState = function() {
            var newStateValue = $scope.blog.blog_status === 'open' ? 'closed': 'open';
            api.blogs.save($scope.blog, {'blog_status': newStateValue})
            .then(function() {
                $scope.blog.blog_status = newStateValue;
            }, function(response) {
                notify.error(gettext('Something went wrong. Please try again later'));
            });
        };

        $scope.stParams = {
            embedService: embedService,
            // provide an uploader to the editor for media (custom sir-trevor image block uses it)
            uploader: function(file, success_callback, error_callback) {
                var handleError = function(response) {
                    // call the uploader callback with the error message as parameter
                    error_callback(response.data? response.data._message : undefined);
                };
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
                        // used in `SirTrevor.Blocks.Image` to fill in the block content.
                        var media_meta = {
                            _info: config.server.url + response.data._links.self.href,
                            _id: response.data._id,
                            _url: response.data.renditions.viewImage.href
                        };
                        // media will be added latter in the `meta` if this item in this callback
                        success_callback({media: media_meta});
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

    var app = angular.module('liveblog.edit', ['SirTrevor', 'SirTrevorBlocks', 'angular-embed']);
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
        apiProvider.api('upload', {
            type: 'http',
            backend: {rel: 'upload'}
        });
    }]).config(['SirTrevorOptionsProvider', 'SirTrevorProvider', function(SirTrevorOptions, SirTrevor) {
        // here comes all the sir trevor customization (except custom blocks which are in the SirTrevorBlocks module)
        SirTrevor = SirTrevor.$get();
        // change the remove trash icon by a cross
        SirTrevor.BlockDeletion.prototype.attributes['data-icon'] = 'close';
        // extends the options given as parameter to the editor contructor
        SirTrevorOptions.$extend({
            onEditorRender: function() {
                var editor = this;
                // when a new block is added, remove empty blocks
                SirTrevor.EventBus.on('block:create:new', function(new_block) {
                    _.each(editor.blocks, function(block) {
                        if (block !== new_block && block.isEmpty()) {
                            editor.removeBlock(block.blockID);
                        }
                    });
                });
            },
            blockTypes: ['Text', 'Link', 'Image', 'Quote'],
            // render a default block when the editor is loaded
            defaultType: 'Text',
            transform: {
                get: function(block) {
                    return {
                        type: block.blockStorage.type,
                        text: block.toHTML(),
                        meta: block.toMeta()
                    };
                },
                set: function(block) {
                    return {
                        type: block.type,
                        data: block.data
                    };
                }
            }
        });
    }]).factory('publishCounter', [function() {
        return {
            counter: 0,
            oneMore: function() {
                this.counter ++;
            },
            getNewPosts: function() {
                return this.counter;
            }
        };
    }]).config(['embedlyServiceProvider', function(embedlyServiceProvider) {
        embedlyServiceProvider.setKey('6dc2ebdf2a104f08bdc59f6b95c73793');
    }]);
    return app;
});
