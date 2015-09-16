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
        'blogService', '$route', '$routeParams', 'blogSecurityService'
    ];
    function BlogEditController(api, $q, $scope, blog, notify, gettext,
        upload, config, embedService, postsService, modal, blogService, $route, $routeParams, blogSecurityService) {

        // return the list of items from the editor
        function getItemsFromEditor() {
            return _.map(vm.editor.get(), function(block) {
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
            var are_all_blocks_empty = _.all(vm.editor.blocks, function(block) {return block.isEmpty();});
            if (are_all_blocks_empty || !$scope.isCurrentPostUnsaved()) {
                callback();
            } else {
                msg = msg || gettext('You have content in the editor. You will lose it if you continue without saving it before.');
                modal.confirm(msg).then(callback);
            }
        }

        // remove and clean every items from the editor
        function cleanEditor() {
            vm.editor.reinitialize();
            $scope.currentPost = undefined;
        }
        var vm = this;

        // define the $scope
        angular.extend($scope, {
            blog: blog,
            currentPost: undefined,
            blogSecurityService: blogSecurityService,
            preview: false,
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
                            vm.editor.createBlock(item.item_type, data);
                        }
                    });
                }
                $scope.openPanel('editor');
                doOrAskBeforeIfEditorIsNotEmpty(fillEditor.bind(null, post));
            },
            saveAsContribution: function() {
                $scope.actionPending = true;
                notify.info(gettext('Submitting contribution'));
                postsService.saveContribution(blog._id, $scope.currentPost, getItemsFromEditor()).then(function(post) {
                    notify.pop();
                    notify.info(gettext('Contribution submitted'));
                    cleanEditor();
                    $scope.actionPending = false;
                }, function() {
                    notify.pop();
                    notify.error(gettext('Something went wrong. Please try again later'));
                    $scope.actionPending = false;
                });
            },
            saveAsDraft: function() {
                $scope.actionPending = true;
                notify.info(gettext('Saving draft'));
                postsService.saveDraft(blog._id, $scope.currentPost, getItemsFromEditor()).then(function(post) {
                    notify.pop();
                    notify.info(gettext('Draft saved'));
                    cleanEditor();
                    $scope.actionPending = false;
                }, function() {
                    notify.pop();
                    notify.error(gettext('Something went wrong. Please try again later'));
                    $scope.actionPending = false;
                });
            },
            publish: function() {
                $scope.actionPending = true;
                notify.info(gettext('Saving post'));
                postsService.savePost(blog._id,
                    $scope.currentPost,
                    getItemsFromEditor(),
                    {post_status: 'open'}
                ).then(function(post) {
                    notify.pop();
                    notify.info(gettext('Post saved'));
                    cleanEditor();
                    $scope.actionPending = false;
                }, function() {
                    notify.pop();
                    notify.error(gettext('Something went wrong. Please try again later'));
                    $scope.actionPending = false;
                });
            },
            // retrieve panel status from url
            panelState: angular.isDefined($routeParams.panel)? $routeParams.panel : 'editor',
            openPanel: function(panel) {
                $scope.panelState = panel;
                // update url for deeplinking
                $route.updateParams({panel: $scope.panelState});
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
            fetchNewContributionPage: function() {
                vm.contributionsPostsInstance.fetchNewPage();
            },
            fetchNewDraftPage: function() {
                vm.draftPostsInstance.fetchNewPage();
            },
            fetchNewTimelinePage: function() {
                vm.timelineInstance.fetchNewPage();
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
            },
            togglePreview: function() {
                $scope.preview = !$scope.preview;
            }
        });
    }

    BlogSettingsController.$inject = ['$scope', 'blog', 'api', 'blogService', '$location', 'notify',
        'gettext', 'config', 'modal', '$q', 'upload'];
    function BlogSettingsController($scope, blog, api, blogService, $location, notify,
        gettext, config, modal, $q, upload) {
        // set view's model
        var vm = this;
        angular.extend(vm, {
            blog: blog,
            newBlog: angular.copy(blog),
            blogPreferences: angular.copy(blog.blog_preferences),
            availableLanguages: [],
            original_creator: {},
            availableThemes: [],
            //used as an aux var to be able to change members and safely cancel the changes
            blogMembers: [],
            isSaved: true,
            editTeamModal: false,
            forms: {},
            preview: {},
            progress: {width: 0},
            tab: false,
            userNotInMembers:function(user) {
                var filter = true;
                for (var i = 0; i < vm.members.length; i ++) {
                    if (user._id === vm.members[i]._id) {
                        return false;
                    }
                }
                return filter;
            },
            openUploadModal: function() {
                vm.uploadModal = true;
            },
            closeUploadModal: function() {
                vm.uploadModal = false;
                vm.preview = {};
                vm.progress = {width: 0};
            },
            changeTab: function(tab) {
                if (vm.tab) {
                    vm.forms.dirty = vm.forms.dirty || vm.forms[vm.tab].$dirty;
                }
                vm.tab = tab;
            },
            // take the public url (from s3) or the local address
            // FIXME: The local address shouldn't be given on production mode
            iframe_url: blog.public_url || config.server.url.replace('/api', '/embed/' + blog._id),
            setFormsPristine: function() {
                if (vm.forms.dirty) {
                    vm.forms.dirty = false;
                }
                angular.forEach(vm.forms, function(value, key) {
                    if (vm.forms[key] && vm.forms[key].$dirty) {
                        vm.forms[key].$setPristine();
                    }
                });
            },
            removeImage: function() {
                modal.confirm(gettext('Are you sure you want to remove the blog image?')).then(function() {
                    deregisterPreventer();
                    vm.newBlog.picture_url = null;
                    vm.newBlog.picture = null;
                    vm.forms.dirty = true;
                });
            },
            upload: function(config) {
                var form = {};
                if (config.img) {
                    form.media = config.img;
                } else if (config.url) {
                    form.URL = config.url;
                } else {
                    return;
                }
                // return a promise of upload which will call the success/error callback
                return api.upload.getUrl().then(function(url) {
                    return upload.start({
                        method: 'POST',
                        url: url,
                        data: form
                    })
                    .then(function(response) {
                        if (response.data._status === 'ERR'){
                            return;
                        }
                        var picture_url = response.data.renditions.viewImage.href;
                        vm.newBlog.picture_url = picture_url;
                        vm.newBlog.picture = response.data._id;
                        vm.uploadModal = false;
                        vm.preview = {};
                        vm.progress = {width: 0};
                        vm.forms.dirty = true;
                    }, null, function(progress) {
                        vm.progress.width = Math.round(progress.loaded / progress.total * 100.0);
                    });
                });
            },
            saveAndClose: function() {
                vm.save().then(function() {
                    vm.close();
                });
            },
            editTeam: function() {
                vm.blogMembers = _.clone(vm.members);
                //close the change owner dropdown if open
                if (vm.openOwner === true) {
                    vm.openOwner = false;
                }
                vm.editTeamModal = true;
            },
            cancelTeamEdit: function() {
                vm.editTeamModal = false;
            },
            doneTeamEdit: function() {
                vm.members = _.clone(vm.blogMembers);
                vm.forms.dirty = true;
                vm.cancelTeamEdit();
            },
            addMember: function(user) {
                vm.blogMembers.push(user);
            },
            removeMember: function(user) {
                vm.blogMembers.splice(vm.blogMembers.indexOf(user), 1);
            },
            save: function() {
                // save on backend
                var deferred = $q.defer();
                var members = _.map(vm.members, function(member) {
                    return ({user: member._id});
                });
                notify.info(gettext('saving blog settings'));
                var changedBlog = {
                    blog_preferences: vm.blogPreferences,
                    original_creator: vm.original_creator._id,
                    blog_status: vm.blog_switch === true? 'open': 'closed',
                    members: members
                };
                angular.extend(vm.newBlog, changedBlog);
                delete vm.newBlog._latest_version;
                delete vm.newBlog._current_version;
                delete vm.newBlog._version;
                delete vm.newBlog.marked_for_not_publication;
                blogService.update(vm.blog, vm.newBlog).then(function(blog) {
                    vm.isSaved = true;
                    vm.blog = blog;
                    vm.newBlog = angular.copy(blog);
                    vm.blogPreferences = angular.copy(blog.blog_preferences);
                    notify.pop();
                    notify.info(gettext('blog settings saved'));
                    vm.setFormsPristine();
                    deferred.resolve();
                });
                return deferred.promise;
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
                    //temp_selected_owner is used handle the selection of users in the change owner autocomplete box
                    //without automatically changing the owner that is displayed
                    vm.temp_selected_owner = vm.original_creator = data;
                });
            },
            getMembers: function() {
                //contributors
                vm.members = [];
                _.each(blog.members, function(member) {
                    api('users').getById(member.user).then(function(data) {
                        vm.members.push(data);
                    });
                });
            }

        });
        // load available languages
        api('languages').query().then(function(data) {
            vm.availableLanguages = data._items;
        });
        // load available themes
        api('themes').query().then(function(data) {
            // filter theme with label (without label are `generic` from inheritance)
            vm.availableThemes = data._items.filter(function(theme) {return !theme['abstract'];});
        });
        api('users').getById(blog.original_creator).then(function(data) {
            vm.original_creator = data;
        });
        api('users').query().then(function(data) {
            vm.avUsers = data._items;
        });
        vm.buildOwner(blog.original_creator);
        vm.getMembers();
        //check if form is dirty before leaving the page
        var deregisterPreventer = $scope.$on('$locationChangeStart', routeChange);
        function routeChange (event, next, current) {
            //check if one of the forms is dirty
            var dirty = false;
            if (vm.forms.dirty) {
                dirty = true;
            } else {
                angular.forEach(vm.forms, function(value, key) {
                    if (vm.forms[key] && vm.forms[key].$dirty) {
                        dirty = true;
                        return;
                    }
                });
            }
            if (dirty) {
                event.preventDefault();
                modal.confirm(gettext('You have unsaved settings. Are you sure you want to leave the page?')).then(function() {
                    deregisterPreventer();
                    $location.url($location.url(next).hash());
                });
            }
        }
        vm.changeTab('general');
        vm.blog_switch = vm.newBlog.blog_status === 'open'? true: false;
    }

    /**
     * Resolve a blog by route id and redirect to /liveblog if such blog does not exist
     */
    BlogResolver.$inject = ['api', '$route', '$location', 'notify', 'gettext', 'blogService'];
    function BlogResolver(api, $route, $location, notify, gettext, blogService) {

        return blogService.get($route.current.params._id)
            .then(null, function(response) {
                if (response.status === 404) {
                    notify.error(gettext('Blog was not found, sorry.'), 5000);
                    $location.path('/liveblog');
                }
                return response;
            });
    }

    var app = angular.module('liveblog.edit', [
        'SirTrevor',
        'SirTrevorBlocks',
        'angular-embed',
        'angular-embed.handlers',
        'ngRoute',
        'superdesk.services.modal',
        'superdesk.upload',
        'liveblog.pages-manager'
    ]);
    app.service('blogSecurityService',
        ['$q', '$rootScope', '$route', 'blogService', '$location', 'privileges',
        function($q, $rootScope, $route, blogService, $location, privileges) {
        function canPublishAPost(blog) {
            return privileges.userHasPrivileges({'publish_post': 1});
        }
        function isUserOwner(archive) {
            if ($rootScope.currentUser._id === archive.original_creator || $rootScope.currentUser.user_type === 'administrator') {
                return true;
            } else {
                return false;
            }
        }
        function goToSettings() {
            var def = $q.defer();
            blogService.get($route.current.params._id)
            .then(function(response) {
                if (isUserOwner(response)) {
                    def.resolve();
                } else {
                    def.reject();
                    $location.path('/liveblog/edit/' + $route.current.params._id);
                }
            }, function() {
                $location.path('/liveblog');
                def.reject('You do not have permission to change the settings of this blog');
            });
            return def.promise;
        }
        return {
            goToSettings: goToSettings,
            isUserOwner: isUserOwner,
            canPublishAPost: canPublishAPost
        };
    }]);
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
            resolve: {
                blog: BlogResolver,
                security: ['blogSecurityService', function(blogSecurityService) {
                    return blogSecurityService.goToSettings();
                }]
            }
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
