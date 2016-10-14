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
    './unread.posts.service',
    'ng-sir-trevor',
    'ng-sir-trevor-blocks',
    'angular-embed'
], function(angular, _) {
    'use strict';
    BlogEditController.$inject = [
        'api', '$q', '$scope', 'blog', 'notify', 'gettext', 'session',
        'upload', 'config', 'embedService', 'postsService', 'unreadPostsService', 'modal',
        'blogService', '$route', '$routeParams', 'blogSecurityService', 'themesService'
    ];
    function BlogEditController(api, $q, $scope, blog, notify, gettext, session,
        upload, config, embedService, postsService, unreadPostsService, modal, blogService, $route, $routeParams, blogSecurityService, themesService) {

        var vm = this;
        // @TODO: remove this when theme at blog level.
        // check the theme setting for comments.
        if (blog.blog_preferences.theme) {
            themesService.get(blog.blog_preferences.theme).then(function(themes) {
                blog.blog_preferences.theme = themes[0];
            });
        }
        // start listening for unread posts.
        unreadPostsService.startListening();
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
        function cleanEditor(actionDisabled) {
            actionDisabled = (typeof actionDisabled === 'boolean') ? actionDisabled : true;
            vm.editor.reinitialize();
            $scope.actionDisabled = actionDisabled;
            $scope.currentPost = undefined;
            $scope.sticky = false;
            $scope.highlight = false;
        }

        // retieve the blog's public url
        blogService.getPublicUrl(blog).then(function(url) {
            $scope.publicUrl = url;
        });

        // define the $scope
        angular.extend($scope, {
            blog: blog,
            panels: {},
            selectedUsersFilter: [],
            currentPost: undefined,
            blogSecurityService: blogSecurityService,
            unreadPostsService: unreadPostsService,
            preview: false,
            actionPending: false,
            actionDisabled: true,
            sticky: false,
            highlight: false,
            filter: {isHighlight: false},
            actionStatus: function() {
                return $scope.actionDisabled || $scope.actionPending;
            },
            askAndResetEditor: function() {
                doOrAskBeforeIfEditorIsNotEmpty(cleanEditor);
            },
            toggleSticky: function() {
                $scope.sticky = !$scope.sticky;
            },
            toggleHighlight: function() {
                $scope.highlight = !$scope.highlight;
            },
            showSaveAsDraft: function() {
                if (angular.isDefined($scope.currentPost)) {
                    return $scope.currentPost.original_creator === session.identity._id;
                } else {
                    return true;
                }
            },
            openPostInEditor: function (post) {
                function fillEditor(post) {
                    cleanEditor(false);
                    $scope.currentPost = angular.copy(post);
                    $scope.sticky = $scope.currentPost.sticky;
                    $scope.highlight = $scope.currentPost.highlight;
                    var items = post.groups[1].refs;
                    items.forEach(function(item) {
                        item = item.item;
                        if (angular.isDefined(item)) {
                            var data = _.extend(item, item.meta);
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
                    postsService.saveContribution(blog._id, $scope.currentPost, getItemsFromEditor(), $scope.sticky, $scope.highlight).then(function(post) {
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
                postsService.saveDraft(blog._id, $scope.currentPost, getItemsFromEditor(), $scope.sticky, $scope.highlight).then(function(post) {
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
                    {post_status: 'open', sticky: $scope.sticky, highlight: $scope.highlight}
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
            filterHighlight: function(highlight) {
                $scope.filter.isHighlight = highlight;
                vm.timelineInstance.pagesManager.changeHighlight(highlight);
                vm.timelineStickyInstance.pagesManager.changeHighlight(highlight);
            },

            // retrieve panel status from url
            panelState: undefined,
            openPanel: function(panel) {
                $scope.panelState = panel;
                // update url for deeplinking
                $route.updateParams({panel: $scope.panelState});
                unreadPostsService.reset(panel);
            },
            stParams: {
                disableSubmit: function(actionDisabled) {
                    $scope.actionDisabled = actionDisabled;
                    // because this is called outside of angular scope from sir-trevor.
                    if (!$scope.$$phase) {
                        $scope.$digest();
                    }
                },
                coverMaxWidth: 350,
                embedService: embedService,
                // provide an uploader to the editor for media (custom sir-trevor image block uses it)
                uploader: function(file, success_callback, error_callback) {
                    $scope.actionPending = true;
                    var handleError = function(response) {
                        // call the uploader callback with the error message as parameter
                        error_callback(response.data? response.data._message : undefined);
                    };
                    // return a promise of upload which will call the success/error callback
                    return api.archive.getUrl().then(function(url) {
                        upload.start({
                            method: 'POST',
                            url: url,
                            data: {media: file}
                        })
                        .then(function(response) {
                            if (response.data._issues) {
                                return handleError(response);
                            }
                            $scope.actionPending = false;
                            // used in `SirTrevor.Blocks.Image` to fill in the block content.
                            var media_meta = {
                                _info: config.server.url + response.data._links.self.href,
                                _id: response.data._id,
                                _url: response.data.renditions.thumbnail.href,
                                renditions: response.data.renditions
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
            fetchNewCommentsPage: function() {
                vm.commentPostsInstance.fetchNewPage();
            },
            fetchNewTimelinePage: function() {
                vm.timelineInstance.fetchNewPage();
            },
            isTimelineReordering: function() {
                //vm.timelineInstance may not be instantiated yet when isTimelineReordering is first checked
                return vm.timelineInstance ? vm.timelineInstance.reorderPost: false;
            },
            clearTimelineReordering: function() {
                return vm.timelineInstance.clearReorder();
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
        // initalize the view with the editor panel
        $scope.openPanel(angular.isDefined($routeParams.panel)? $routeParams.panel : 'editor');
    }

    BlogSettingsController.$inject = ['$scope', 'blog', 'api', 'blogService', '$location', 'notify',
        'gettext', 'modal', '$q', 'upload'];
    function BlogSettingsController($scope, blog, api, blogService, $location, notify,
        gettext, modal, $q, upload) {

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
            //users to remove from the pending queue once the changes are saved
            acceptedMembers: [],
            memberRequests: [],
            //concat of blogMembers and membership requested members
            posibleMembers: [],
            isSaved: true,
            editTeamModal: false,
            forms: {},
            preview: {},
            progress: {width: 0},
            tab: false,
            // by default themes are not accepting embed multi height and code.
            embedMultiHight: false,
            userNotInMembers:function(user) {
                for (var i = 0; i < vm.members.length; i ++) {
                    if (user._id === vm.members[i]._id) {
                        return false;
                    }
                }
                return true;
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
                return api.archive.getUrl().then(function(url) {
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
                vm.posibleMembers = vm.blogMembers.concat(vm.memberRequests);
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
            acceptMember: function(user) {
                vm.members.push(user);
                vm.forms.dirty = true;
                vm.memberRequests.splice(vm.memberRequests.indexOf(user), 1);
                vm.acceptedMembers.push(user);
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
                    syndication_enabled: vm.syndication_enabled,
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
                    //remove accepted users from the queue
                    if (vm.acceptedMembers.length) {
                        _.each(vm.acceptedMembers, function(member) {
                            api('request_membership').getById(member.request_id).then(function(item) {
                                api('request_membership').remove(item).then(function() {}, function() {
                                    notify.pop();
                                    notify.error(gettext('Something went wrong'));
                                    deferred.reject();
                                });
                            });
                        });
                    }
                    notify.pop();
                    notify.info(gettext('blog settings saved'));
                    vm.setFormsPristine();
                    deferred.resolve();
                });
                return deferred.promise;
            },
            askRemoveBlog: function() {
                                modal.confirm(gettext('Are you sure you want to delete the blog?'))
                                    .then(function() {
                                        vm.removeBlog();
                                    });
            },
            removeBlog: function() {
                api.blogs.remove(angular.copy(vm.blog)).then(function(message) {
                    notify.pop();
                    notify.info(gettext('Blog removed'));
                    $location.path('/liveblog');
                }, function () {
                    notify.pop();
                    notify.error(gettext('Something went wrong'));
                    $location.path('/liveblog/edit/' + vm.blog._id);
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
            getUsers: function(details, ids) {
                _.each(ids, function(user) {
                    api('users').getById(user.user).then(function(data) {
                        if (user.request_id) {
                            data.request_id = user.request_id;
                        }
                        details.push(data);
                    });
                });
            }

        });
        // retieve the blog's public url
        var qPublicUrl = blogService.getPublicUrl(blog).then(function(url) {
            vm.publicUrl = url;
        });
        // load available languages
        api('languages').query().then(function(data) {
            vm.availableLanguages = data._items;
        });
        // load available themes
        var qTheme = api('themes').query().then(function(data) {
            // filter theme with label (without label are `generic` from inheritance)
            vm.angularTheme = data._items.find(function(theme) {return theme.name == 'angular'});
            vm.availableThemes = data._items.filter(function(theme) {return !theme['abstract'];});
            vm.selectedTheme = _.find(vm.availableThemes, function(theme) {
                return theme.name === vm.blogPreferences.theme;
            });
        });

        // after publicUrl and theme is on `vm` object we can compute embeds code.
        $q.all([qPublicUrl, qTheme]).then(function() {
            vm.embedMultiHight = true;
            // devel link
            var parentIframe = 'http://localhost:5000/themes_assets/angular/';
            if (vm.angularTheme.public_url) {
                // production link
                parentIframe = vm.angularTheme.public_url.replace(/\/[0-9\.]+\/themes_assets\//, '/themes_assets/');
            }
            // loading mechanism, and load parent-iframe.js with callback.
            var loadingScript = '<script type="text/javascript">var liveblog={load:function(e,t){var a=document,l=a.createElement("script"),o=a.getElementsByTagName("script")[0];return l.type="text/javascript",l.onload=t,l.async=!0,l.src=e,o.parentNode.insertBefore(l,o),l}};liveblog.load("' + parentIframe + 'parent-iframe.js?"+parseInt(new Date().getTime()/900000,10),function(){"function"==typeof liveblog.loadCallback&&liveblog.loadCallback()});</script>';
            // compute embeds code with the injected publicUrl
            vm.embeds = {
                normal: '<iframe width="100%" height="715" src="' + vm.publicUrl + '" frameborder="0" allowfullscreen></iframe>',
                resizeing: loadingScript + '<iframe id="liveblog-iframe" width="100%" scrolling="no" src="' + vm.publicUrl + '" frameborder="0" allowfullscreen></iframe>'
            };
        });

        api('users').getById(blog.original_creator).then(function(data) {
            vm.original_creator = data;
        });
        api('users').query().then(function(data) {
            vm.avUsers = data._items;
        });
        vm.buildOwner(blog.original_creator);

        //get details for the users that have requested blog membership
        vm.memberRequests = [];
        api('blogs/<regex("[a-f0-9]{24}"):blog_id>/request_membership', {_id: vm.blog._id}).query().then(function(data) {
            vm.getUsers(vm.memberRequests, _.map(data._items, function(request) {
                return {user: request.original_creator, request_id: request._id};
            }));
        });

        //get team members details
        vm.members = [];
        vm.getUsers(vm.members, blog.members);

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
        vm.syndication_enabled = vm.newBlog.syndication_enabled;
    }

    /**
     * Resolve a blog by route id and redirect to /liveblog if such blog does not exist
     */
    BlogResolver.$inject = ['api', '$route', '$location', 'notify', 'gettext', 'blogService'];
    function BlogResolver(api, $route, $location, notify, gettext, blogService) {

        return blogService.get($route.current.params._id, {timestamp: new Date()}, false)
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
        'superdesk.editor',
        'liveblog.pages-manager',
        'lrInfiniteScroll',
        'liveblog.security'
    ])
    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('/liveblog/edit/:_id', {
            label: gettext('Blog Editor'),
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
        apiProvider.api('archive', {
            type: 'http',
            backend: {rel: 'archive'}
        });
        // @TODO: remove this when theme at blog level.
        apiProvider.api('global_preferences', {
            type: 'http',
            backend: {rel: 'global_preferences'}
        });
        apiProvider.api('themes', {
            type: 'http',
            backend: {rel: 'themes'}
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
            blockTypes: ['Text', 'Image', 'Embed', 'Quote', 'Comment'],
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
    }])
    .filter('convertLinksWithRelativeProtocol', ['config', function fixProtocol(config) {
        return function getRelativeProtocol(text) {
            var absoluteProtocol = RegExp(/http(s)?:\/\//ig);
            var serverpath = config.server.url.split('//').pop();
            config.server.url.replace(absoluteProtocol, '//');
            text.replace(absoluteProtocol, '//')
            return text.replace(absoluteProtocol, '//')
        };
    }])
    .filter('outboundAnchors', function() {
        return function(text) {
            return text.replace(/<a([^>]*)>/g, function(match, attr) {
                            if (attr.indexOf('target') === -1) {
                                return '<a' + attr + ' target="_blank">';
                            }
                            return match;
                        });
        };
    })
    .factory('instagramService', ['$timeout', function($timeout) {
        var insta = {};
        insta.postHasEmbed = function(post) {
            var hasInstagram = false;
            angular.forEach(post, function(item) {
                if (item.item.item_type === 'embed') {
                    if (item.item.text.indexOf('platform.instagram.com') !== -1) {
                        hasInstagram = true;
                    }
                }
            });
            return hasInstagram;
        }
        insta.processEmbeds = function() {
            // take in accound the animations
            $timeout(function() {
                window.instgrm.Embeds.process();
            }, 1000);
        }
        return insta;
    }])
    .config(['embedlyServiceProvider', 'embedServiceProvider', 'config', function(embedlyServiceProvider, embedServiceProvider, config) {
        embedlyServiceProvider.setKey(config.embedly.key);
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
