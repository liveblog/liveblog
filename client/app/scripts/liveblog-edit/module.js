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
        'api', '$q', '$scope', 'blog', 'notify', 'gettext',
        'upload', 'config', 'embedService', 'postsService', 'modal',
        'blogService', '$route', '$routeParams'
    ];
    function BlogEditController(api, $q, $scope, blog, notify, gettext,
        upload, config, embedService, postsService, modal, blogService, $route, $routeParams) {

        // return the list of items from the editor
        function getItemsFromEditor() {
            return _.map($scope.editor.get(), function(block) {
                return {
                    text: block.text.replace(/(^<div>)|(<\/div>$)/g, '').replace(/(<br>$)/g, ''),
                    meta: block.meta,
                    item_type: block.type
                };
            });
        }

        // ask in a modalbox if the user is sure to want to overwrite editor.
        // call the callback if user say yes or if editor is empty
        function doOrAskBeforeIfEditorIsNotEmpty(callback, msg) {
            var are_all_blocks_empty = _.all($scope.editor.blocks, function(block) {return block.isEmpty();});
            if (are_all_blocks_empty || !$scope.isCurrentPostUnsaved()) {
                callback();
            } else {
                msg = msg || gettext('You have content in the editor. You will lose it if you continue without saving it before.');
                modal.confirm(msg).then(callback);
            }
        }

        // remove and clean every items from the editor
        function cleanEditor() {
            $scope.editor.reinitialize();
            $scope.currentPost = undefined;
        }
        var vm = this;

        // define the $scope
        angular.extend($scope, {
            blog: blog,
            oldBlog: _.create(blog),
            currentPost: undefined,
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
            askAndResetEditor: function() {
                doOrAskBeforeIfEditorIsNotEmpty(cleanEditor);
            },
            openPostInEditor: function (post) {
                function fillEditor(post) {
                    cleanEditor();
                    $scope.currentPost = angular.copy(post);
                    var items = post.groups[1].refs;
                    items.forEach(function(item) {
                        item = item.item;
                        if (angular.isDefined(item)) {
                            var data = _.extend({text: item.text}, item.meta);
                            $scope.editor.createBlock(item.item_type, data);
                        }
                    });
                }
                doOrAskBeforeIfEditorIsNotEmpty(fillEditor.bind(null, post));
            },
            saveAsDraft: function() {
                notify.info(gettext('Saving draft'));
                postsService.saveDraft(blog._id, $scope.currentPost, getItemsFromEditor()).then(function(post) {
                    notify.pop();
                    notify.info(gettext('Draft saved'));
                    cleanEditor();
                }, function() {
                    notify.pop();
                    notify.error(gettext('Something went wrong. Please try again later'));
                });
            },
            publish: function() {
                notify.info(gettext('Saving post'));
                postsService.savePost(blog._id,
                    $scope.currentPost,
                    getItemsFromEditor(),
                    {post_status: 'open'}
                ).then(function(post) {
                    notify.pop();
                    notify.info(gettext('Post saved'));
                    cleanEditor();
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
            // retrieve draft panel status from url
            draftPanelState: $routeParams.drafts === 'open'? 'open' : 'closed',
            toggleDraftPanel: function() {
                // reverse status
                var newStateValue = $scope.draftPanelState === 'open' ? 'closed': 'open';
                // update new status
                $scope.draftPanelState = newStateValue;
                // update url for deeplinking
                $route.updateParams({drafts: newStateValue === 'open' ? 'open' : undefined});
            },
            stParams: {
                coverMaxWidth: 350,
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
            fetchNewTimelinePage: function() {
                vm.timelineInstance.fetchPage();
            },
            isBlogOpened: function() {
                return $scope.blog.blog_status === 'open';
            },
            isCurrentPostPublished: function() {
                return angular.isDefined($scope.currentPost) && $scope.currentPost.post_status === 'open';
            },
            isCurrentPostUnsaved: function() {
                if (angular.isDefined($scope.currentPost)) {
                    return _.any(getItemsFromEditor(), function (item, item_index) {
                        return _.any(_.keys(item), function (key) {
                            if (!angular.isDefined($scope.currentPost.items[item_index])) {
                                return true;
                            } else {
                                return !_.isEqual(item[key], $scope.currentPost.items[item_index].item[key]);
                            }
                        });
                    });
                } else {
                    return true;
                }
            }
        });
    }

    BlogSettingsController.$inject = ['$scope', 'blog', 'api', 'blogService', '$location', 'notify', 'gettext'];
    function BlogSettingsController($scope, blog, api, blogService, $location, notify, gettext) {
        // set view's model
        var vm = this;
        angular.extend(vm, {
            blog: blog,
            blogPreferences: angular.copy(blog.blog_preferences),
            availableLanguages: [],
            original_creator: {},
            availableThemes: [],
            isSaved: true,
            save: function() {
                // save on backend and clsoe
                notify.info(gettext('saving blog settings'));
                blogService.save(vm.blog._id, {blog_preferences: vm.blogPreferences, original_creator: vm.original_creator._id})
                .then(function(blog) {
                    vm.isSaved = true;
                    vm.blog = blog;
                    notify.pop();
                    notify.info(gettext('blog settings saved'));
                    vm.close();
                });
            },
            reset: function() {
                // reset vm.blogPreferences's values with the ones from global_preferences (backend)
                api('global_preferences').query().then(function(global_preferences) {
                    global_preferences._items.forEach(function(item) {
                        vm.blogPreferences[item.key] = item.value;
                    });
                });
            },
            close: function() {
                // return to blog edit page
                $location.path('/liveblog/edit/' + vm.blog._id);
            },
            buildOwner: function(userID) {
                api('users').getById(userID).then(function(data) {
                    vm.temp_chosen = vm.original_creator = data;

                });
            }
        });
        // load available languages
        api('languages').query().then(function(data) {
            vm.availableLanguages = data._items;
        });
        // load available themes
        api('themes').query().then(function(data) {
            vm.availableThemes = data._items;
        });
        api('users').getById(blog.original_creator).then(function(data) {
            vm.original_creator = data;
        });
        api('users').query().then(function(data) {
            vm.avUsers = data._items;
        });
        vm.buildOwner(blog.original_creator);
        // watch if the user selected preferences have changed, in order to update the `isSaved` variable
        $scope.$watch(angular.bind(this, function () {return [this.blogPreferences, this.original_creator];}), function(new_value) {
            vm.isSaved = _.isEqual(vm.blogPreferences, vm.blog.blog_preferences) &&
            (!vm.original_creator._id || _.isEqual(vm.original_creator._id, vm.blog.original_creator));
        }, true);
        _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
        var compiled = _.template(_.trim(angular.element('#liveblog-embed-template').html()));
        /*globals config */
        vm.embedCode = compiled({'rest': config.server.url, 'frontend': window.location.origin, id: vm.blog._id});
    }

    /**
     * Resolve a blog by route id and redirect to /liveblog if such blog does not exist
     */
    BlogResolver.$inject = ['api', '$route', '$location', 'notify', 'gettext', 'blogService'];
    function BlogResolver(api, $route, $location, notify, gettext, blogService) {

        return blogService.update($route.current.params._id)
            .then(null, function(response) {
                if (response.status === 404) {
                    notify.error(gettext('Blog was not found, sorry.'), 5000);
                    $location.path('/liveblog');
                }
                return response;
            });
    }

    var app = angular.module('liveblog.edit', ['SirTrevor', 'SirTrevorBlocks', 'angular-embed', 'angular-embed.handlers', 'ngRoute']);
    app.config(['superdeskProvider', function(superdesk) {
        superdesk.activity('/liveblog/edit/:_id', {
            label: gettext('Blog Edit'),
            auth: true,
            controller: BlogEditController,
            controllerAs: 'blogEdit',
            templateUrl: 'scripts/liveblog-edit/views/main.html',
            resolve: {blog: BlogResolver}
        }).activity('/liveblog/settings/:_id', {
            label: gettext('Blog Settings'),
            auth: true,
            controller: BlogSettingsController,
            controllerAs: 'settings',
            templateUrl: 'scripts/liveblog-edit/views/settings.html',
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
                function removeEmptyBlockExceptTheBlock(new_block) {
                    _.each(editor.blocks, function(block) {
                        if (block !== new_block && block.isEmpty()) {
                            editor.removeBlock(block.blockID);
                        }
                    });
                }
                SirTrevor.EventBus.on('block:create:existing', removeEmptyBlockExceptTheBlock);
                SirTrevor.EventBus.on('block:create:new', removeEmptyBlockExceptTheBlock);
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
