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
    var BlogEditController = function (api, $q, $scope, blog, notify, gettext, session,
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
    BlogEditController.$inject = [
        'api', '$q', '$scope', 'blog', 'notify', 'gettext', 'session',
        'upload', 'config', 'embedService', 'postsService', 'unreadPostsService', 'modal',
        'blogService', '$route', '$routeParams', 'blogSecurityService', 'themesService'
    ];
    return BlogEditController;
});
