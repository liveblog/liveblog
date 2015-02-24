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
    'lodash',
    'ng-sir-trevor',
    'ng-sir-trevor-blocks',
    'angular-embed'
], function(angular, _) {
    'use strict';

    BlogEditController.$inject = [
        'api', '$q', '$scope', 'blog', 'notify', 'gettext', '$route',
        'upload', 'config', '$rootScope', 'embedService'
    ];
    function BlogEditController(api, $q, $scope, blog, notify, gettext, $route,
        upload, config, $rootScope, embedService) {

        function savePost(post_status) {
            var dfds = [];
            // save every items
            _.each($scope.editor.get(), function(block) {
                dfds.push(api.items.save({
                    text: block.text,
                    item_type: block.type
                }));
            });
            var post = {
                blog: $route.current.params._id,
                post_status: post_status || 'open',
                groups: [
                    {
                        id: 'root',
                        refs: [{idRef: 'main'}],
                        role: 'grpRole:NEP'
                    }, {
                        id: 'main',
                        refs: [],
                        role: 'grpRole:Main'
                    }
                ]
            };
            return $q.all(dfds).then(function(items) {
                // update the post reference (links with items)
                _.each(items, function(item) {
                    post.groups[1].refs.push({residRef: item._id});
                });
                // save the post
                return api.posts.save(post);
            });
        }

        // define the $scope
        angular.extend($scope, {
            blog: blog,
            oldBlog: _.create(blog),
            updateBlog: function(blog) {
                if (_.isEmpty(blog)) {
                    return;
                }
                notify.info(gettext('saving..'));
                api.blogs.save($scope.blog, blog).then(function(newBlog) {
                    notify.pop();
                    notify.success(gettext('blog saved.'));
                    $scope.blog = newBlog;
                });
            },
            // remove and clean every items from the editor
            resetEditor: function() {
                $scope.editor.reinitialize();
            },
            saveAsDraft: function() {
                notify.info(gettext('Saving post'));
                savePost('draft').then(function(data) {
                    notify.pop();
                    notify.info(gettext('Post saved'));
                    $scope.resetEditor();
                }, function() {
                    notify.pop();
                    notify.error(gettext('Something went wrong. Please try again later'));
                });
            },
            publish: function() {
                notify.info(gettext('Saving post'));
                savePost().then(function(post) {
                    notify.pop();
                    notify.info(gettext('Post saved'));
                    $scope.resetEditor();
                    // broadcast an event to say a new post was saved
                    $rootScope.$broadcast('lb.editor.postsaved', post);
                }, function() {
                    notify.pop();
                    notify.error(gettext('Something went wrong. Please try again later'));
                });
            },
            toggleBlogState: function() {
                var newStateValue = $scope.blog.blog_status === 'open' ? 'closed': 'open';
                api.blogs.save($scope.blog, {'blog_status': newStateValue})
                .then(function() {
                    $scope.blog.blog_status = newStateValue;
                }, function(response) {
                    notify.error(gettext('Something went wrong. Please try again later'));
                });
            },
            // FIXME: to be changed to 'closed'
            draftPanelState: 'open',
            toggleDraftPanel: function() {
                var newStateValue = $scope.draftPanelState === 'open' ? 'closed': 'open';
                $scope.draftPanelState = newStateValue;
            },
            stParams: {
                coverMaxWidth: 447,
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
            },
            isBlogOpened: function() {
                return $scope.blog.blog_status === 'open';
            }
        });
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

    var app = angular.module('liveblog.edit', ['SirTrevor', 'SirTrevorBlocks', 'angular-embed', 'angular-embed.handlers']);
    app.config(['superdeskProvider', function(superdesk) {
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
        apiProvider.api('items', {
            type: 'http',
            backend: {rel: 'items'}
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
            blockTypes: ['Text', 'Image', 'Embed', 'Quote'],
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
    }]).config(['embedlyServiceProvider', 'embedServiceProvider', 'config', function(embedlyServiceProvider, embedServiceProvider, config) {
        embedlyServiceProvider.setKey(config.embedly);
        embedServiceProvider.setConfig('facebookAppId', config.facebookAppId);
    }]).run(['$q', 'embedService', 'ngEmbedTwitterHandler', 'ngEmbedFacebookHandler',
            'ngEmbedYoutubeHandler', 'ngEmbedInstagramHandler', 'ngEmbedPictureHandler',
        function($q, embedService, ngEmbedTwitterHandler, ngEmbedFacebookHandler,
                ngEmbedYoutubeHandler, ngEmbedInstagramHandler, ngEmbedPictureHandler) {
            // register all the special handlers we want to use for angular-embed
            embedService.registerHandler(ngEmbedFacebookHandler); // use embed.ly and update the embed code with a max_width
            embedService.registerHandler(ngEmbedYoutubeHandler); // use embed.ly
            embedService.registerHandler(ngEmbedInstagramHandler); // Use embed.ly
            embedService.registerHandler(ngEmbedTwitterHandler); // use embed.ly, load a script to render the card.
            embedService.registerHandler(ngEmbedPictureHandler); // use embed.ly, and provide a `thumbnail_url` field from the `url`
        }
    ]);
    return app;
});
