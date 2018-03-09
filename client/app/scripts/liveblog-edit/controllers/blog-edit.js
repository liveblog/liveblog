/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import angular from 'angular';
import _ from 'lodash';

import scorecardsTpl from 'scripts/liveblog-edit/views/scorecards.html';
import adsLocalTpl from 'scripts/liveblog-edit/views/ads-local.html';
import adsRemoteTpl from 'scripts/liveblog-edit/views/ads-remote.html';

import './../../ng-sir-trevor';
import './../../sir-trevor-blocks';
import './../unread.posts.service';

BlogEditController.$inject = [
    'api',
    '$q',
    '$scope',
    'blog',
    'notify',
    'gettext',
    'session',
    '$injector',
    '$http',
    'upload',
    'config',
    'embedService',
    'postsService',
    'unreadPostsService',
    'freetypeService',
    'modal',
    'blogService',
    '$route',
    '$routeParams',
    'blogSecurityService',
    'themesService',
    '$templateCache',
    '$timeout',
    '$rootScope',
    '$location'
];

export default function BlogEditController(
    api,
    $q,
    $scope,
    blog,
    notify,
    gettext,
    session,
    $injector,
    $http,
    upload,
    config,
    embedService,
    postsService,
    unreadPostsService,
    freetypeService,
    modal,
    blogService,
    $route,
    $routeParams,
    blogSecurityService,
    themesService,
    $templateCache,
    $timeout,
    $rootScope,
    $location
) {
    var self = this;
    // @TODO: remove this when theme at blog level.
    // check the theme setting for comments.

    // init with empty vector
    $scope.freetypesData = {}; $scope.freetypeControl = {}; $scope.validation = {};
    $scope.freetypesOriginal = {};
    $scope.validation.imageUploaded = true;

    if (blog.blog_preferences.theme) {
        themesService.get(blog.blog_preferences.theme).then((themes) => {
            blog.blog_preferences.theme = themes[0];
        });
    }
    const emptyPRegex = /<p><br\/?><\/p>/g;
    const emptyDivRegex = /<div><br\/?><\/div>/g;
    const targetIconRegex = /target\s*=\s*"\<\/?i\>blank\"/g;
    // start listening for unread posts.

    unreadPostsService.startListening();
    // return the list of items from the editor
    function getItemsFromEditor() {
        if (!isPostFreetype()) {
            // go with the 'classic' editor items
            return _.map(self.editor.get(), (block) => {
                const syndicatedCreator = block.meta && block.meta.syndicated_creator;

                if (syndicatedCreator) {
                    delete block.meta.syndicated_creator;
                }
                return {
                    group_type: 'default',
                    text: block.text
                        .replace(emptyPRegex, '<br/>')
                        .replace(emptyDivRegex, '<br/>')
                        .replace(targetIconRegex, 'target="_blank"'),
                    meta: block.meta,
                    syndicated_creator: syndicatedCreator,
                    item_type: block.type
                }
            });
        }

        // this is a freetype post
        return [
            {
                group_type: 'freetype',
                item_type: $scope.selectedPostType.name,
                text: freetypeService.htmlContent($scope.selectedPostType.template, $scope.freetypesData),
                meta: {data: $scope.freetypesData},
                syndicated_creator: $scope.freetypesOriginal.syndicated_creator
            }
        ];
    }

    // determine is current post is classic or freetype
    function isPostFreetype() {
        return $scope.selectedPostType !== 'Default';
    }

    // determine if post is 'scorecard'
    function isPostScorecard() {
        return isPostFreetype() && $scope.selectedPostType.name === 'Scorecard';
    }

    // save the 'keep scoarers' if needed
    function saveScorers() {
        if ($scope.currentBlog.blog_preferences) {
            var bp = angular.copy($scope.currentBlog.blog_preferences);

            bp.last_scorecard = $scope.freetypesData;
            return blogService.update($scope.currentBlog, {blog_preferences: bp});
        }

        return blogService.get($scope.blog._id).then((currentBlog) => {
            $scope.currentBlog = currentBlog;
            var bp = angular.copy($scope.currentBlog.blog_preferences);

            bp.last_scorecard = $scope.freetypesData;
            return blogService.update($scope.currentBlog, {blog_preferences: bp});
        });
    }

    // determine if the loaded item is freetype
    function isItemFreetype(itemType) {
        var regularItemTypes = ['text', 'image', 'embed', 'quote', 'comment'];

        if (regularItemTypes.indexOf(itemType) !== -1) {
            return false;
        }

        return true;
    }

    function setDefautPostType() {
        $scope.selectedPostType = 'Default';
    }

    // determine if current editor is not dirty
    function isEditorClean() {
        if (isPostFreetype()) {
            return $scope.freetypeControl.isClean();
        }

        if (!self.editor) {
            return true;
        }

        var areallBlocksempty = _.every(self.editor.blocks, (block) => block.isEmpty());

        return areallBlocksempty || !$scope.isCurrentPostUnsaved();
    }

    // ask in a modalbox if the user is sure to want to overwrite editor.
    // call the callback if user say yes or if editor is empty
    function doOrAskBeforeIfEditorIsNotEmpty() {
        var deferred = $q.defer();

        if (isEditorClean()) {
            deferred.resolve();
        } else {
            modal
                .confirm(gettext(
                    'You have content in the editor. You will lose it if you continue without saving it before.'
                ))
                .then(deferred.resolve, deferred.reject);
        }
        return deferred.promise;
    }

    $scope.enableEditor = true;

    $scope.$on('removing_timeline_post', (event, data) => {
        // if we try to remove a post that is currentry being edited, reset the editor
        if ($scope.currentPost && $scope.currentPost._id === data.post._id) {
            cleanEditor();
        }
    });

    $scope.$on('posts', (event, data) => {
        const edited = $scope.currentPost && data.posts.find((post) => post._id === $scope.currentPost._id);

        if (edited) {
            $scope.currentPost = {...$scope.currentPost, ...edited};
        }
    });

    // remove and clean every items from the editor
    function cleanEditor(actionDisabled) {
        var actionDisable = actionDisabled;

        if (!self.editor) {
            return;
        }
        $scope.enableEditor = false;

        actionDisable = typeof actionDisable === 'boolean' ? actionDisable : true;
        if ($scope.freetypeControl.reset) {
            $scope.freetypeControl.reset();
        }
        self.editor.reinitialize();
        $scope.actionDisabled = actionDisable;
        $scope.currentPost = undefined;
        $scope.sticky = false;
        $scope.highlight = false;

        $timeout(() => {
            $scope.enableEditor = true;
        });
    }

    // retieve the blog's public url
    blogService.getPublicUrl(blog).then((url) => {
        $scope.publicUrl = url;
    });

    $scope.freetypes = [];
    $scope.selectedFreetype = undefined;
    // retrieve the freetypes
    function getFreetypes() {
        // these are the freetypes defined by the user with the CRUD form
        var userFt = api.freetypes.query().then((data) => data._items);

        var scorecards = {
            name: 'Scorecard',
            template: $templateCache.get(scorecardsTpl),
            separator: true
        };

        var adLocal = {
            name: 'Advertisement Local',
            template: $templateCache.get(adsLocalTpl)
        };

        var adRemote = {
            name: 'Advertisement Remote',
            template: $templateCache.get(adsRemoteTpl)
        };

        $q.all([adLocal, adRemote, scorecards, userFt]).then((freetypes) => {
            angular.forEach(freetypes, (freetype) => {
                if (angular.isArray(freetype)) {
                    $scope.freetypes = $scope.freetypes.concat(freetype);
                } else {
                    $scope.freetypes.push(freetype);
                }
            });
        });
    }

    // load freetype item
    function loadFreetypeItem(item) {
        // find freetype model
        angular.forEach($scope.freetypes, (freetype, key) => {
            if (freetype.name === item.item_type) {
                $scope.selectedPostType = freetype;
                $scope.freetypesData = angular.copy(item.meta.data);
                $scope.freetypesOriginal = item;
            }
        });
    }

    getFreetypes();

    // define the $scope
    angular.extend($scope, {
        blog: blog,
        currentBlog: {},
        panels: {},
        syndicationEnabled: $injector.has('lbNotificationsCountDirective'),
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
        selectPostTypeDialog: false,
        selectedPostType: 'Default',
        toggleTypePostDialog: function() {
            $scope.selectPostTypeDialog = !$scope.selectPostTypeDialog;
        },
        selectPostType: function(postType) {
            doOrAskBeforeIfEditorIsNotEmpty().then(() => {
                cleanEditor();

                // see https://dev.sourcefabric.org/browse/LBSD-2009 for reference
                $rootScope.$emit('freetypeScopeDestroy');

                $scope.selectedPostType = postType;
                $scope.toggleTypePostDialog();
                if (isPostScorecard()) {
                    blogService.get($scope.blog._id).then((currentBlog) => {
                        $scope.currentBlog = currentBlog;
                        if ($scope.currentBlog.blog_preferences.last_scorecard) {
                            // load latest scorecard
                            if ($scope.currentBlog.blog_preferences.last_scorecard.remember) {
                                $scope.freetypesData = angular.copy($scope.currentBlog.blog_preferences.last_scorecard);
                            }
                        }
                    });
                }
            });
        },
        backToBlogsList: function() {
            doOrAskBeforeIfEditorIsNotEmpty().then(() => {
                cleanEditor();
                $location.url('/liveblog');
            });
        },
        onEditorChanges: function() {
            var el = $(this).find('.st-text-block');

            if (el.length === 0) {
                return;
            }

            var input = el.text().trim();

            $scope.$apply(() => {
                $scope.actionDisabled = _.isEmpty(input);
            });
        },
        actionStatus: function() {
            if (isPostFreetype()) {
                if (angular.isDefined($scope.currentPost)) {
                    return $scope.freetypeControl.isValid()
                            && ($scope.currentPost.post_status === 'draft'
                            || $scope.currentPost.post_status === 'submitted');
                }

                return $scope.freetypeControl.isValid() || $scope.freetypeControl.isClean();
            }
            return $scope.actionDisabled || $scope.actionPending;
        },
        askAndResetEditor: function() {
            doOrAskBeforeIfEditorIsNotEmpty().then(cleanEditor);
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
            }

            return true;
        },
        openPostInEditor: function(post) {
            function fillEditor(post) {
                cleanEditor(false);
                var delay = 0;

                $scope.currentPost = angular.copy(post);
                $scope.sticky = $scope.currentPost.sticky;
                $scope.highlight = $scope.currentPost.lb_highlight;
                // @TODO handle this better ASAP, remove $timeout and find the cause of the delay
                if (isPostFreetype()) {
                    setDefautPostType();
                    delay = 5;
                }
                $timeout(() => {
                    var items = post.groups[1].refs;

                    items.forEach((item) => {
                        var itm = item;

                        itm = itm.item;
                        if (angular.isDefined(itm)) {
                            if (isItemFreetype(itm.item_type)) {
                                // post it freetype so we need to reder it
                                loadFreetypeItem(itm);
                            } else {
                                var data = _.extend(itm, itm.meta);

                                self.editor.createBlock(itm.item_type, data);
                            }
                        }
                    });
                }, delay);
            }
            $scope.openPanel('editor');
            doOrAskBeforeIfEditorIsNotEmpty().then(fillEditor.bind(null, post));
        },
        saveAsContribution: function() {
            $scope.actionPending = true;
            notify.info(gettext('Submitting contribution'));
            postsService
                .saveContribution(
                    blog._id,
                    $scope.currentPost,
                    getItemsFromEditor(),
                    $scope.sticky,
                    $scope.highlight
                )
                .then((post) => {
                    notify.pop();
                    notify.info(gettext('Contribution submitted'));
                    cleanEditor();
                    $scope.selectedPostType = 'Default';
                    $scope.actionPending = false;
                }, () => {
                    notify.pop();
                    notify.error(gettext('Something went wrong. Please try again later'));
                    $scope.actionPending = false;
                });
        },
        saveAsDraft: function() {
            $scope.actionPending = true;
            notify.info(gettext('Saving draft'));
            postsService
                .saveDraft(blog._id, $scope.currentPost, getItemsFromEditor(), $scope.sticky, $scope.highlight)
                .then((post) => {
                    notify.pop();
                    notify.info(gettext('Draft saved'));
                    cleanEditor();
                    $scope.selectedPostType = 'Default';
                    $scope.actionPending = false;
                }, () => {
                    notify.pop();
                    notify.error(gettext('Something went wrong. Please try again later'));
                    $scope.actionPending = false;
                });
        },
        publish: function() {
            $scope.actionPending = true;
            // save the keep scoreres setting( if needed)
            if (isPostScorecard()) {
                saveScorers().then(() => {
                    // no need to show anything on success
                }, () => {
                    notify.error(gettext('Something went wrong with scoarers status. Please try again later'));
                });
            }
            notify.info(gettext('Saving post'));
            postsService.savePost(blog._id,
                $scope.currentPost,
                getItemsFromEditor(),
                {post_status: 'open', sticky: $scope.sticky, lb_highlight: $scope.highlight}
            ).then((post) => {
                notify.pop();
                notify.info(gettext('Post saved'));

                cleanEditor();
                $scope.selectedPostType = 'Default';
                $scope.actionPending = false;
            }, () => {
                notify.pop();
                notify.error(gettext('Something went wrong. Please try again later'));
                $scope.actionPending = false;
            });
        },
        filterHighlight: function(highlight) {
            $scope.filter.isHighlight = highlight;
            self.timelineInstance.pagesManager.changeHighlight(highlight);
            self.timelineStickyInstance.pagesManager.changeHighlight(highlight);
        },

        // retrieve panel status from url
        panelState: undefined,
        openPanel: function(panel, syndId) {
            $scope.panelState = panel;
            $scope.syndId = syndId;
            // update url for deeplinking
            var params = {panel: $scope.panelState, syndId: null};

            if (syndId) {
                params.syndId = syndId;
            }

            $route.updateParams(params);
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
            setPending: function(value) {
                $scope.actionPending = value;
            },
            coverMaxWidth: 350,
            embedService: embedService,
            // provide an uploader to the editor for media (custom sir-trevor image block uses it)
            uploader: function(file, successCallback, errorCallback) {
                $scope.actionPending = true;
                var handleError = function(response) {
                    // call the uploader callback with the error message as parameter
                    errorCallback(response.data ? response.data._message : undefined);
                    $scope.actionPending = true;
                };
                // return a promise of upload which will call the success/error callback

                return api.archive.getUrl().then((url) => {
                    upload.start({
                        method: 'POST',
                        url: url,
                        data: {media: file}
                    })
                        .then((response) => {
                            if (response.data._issues) {
                                return handleError(response);
                            }
                            $scope.actionPending = false;
                            // used in `SirTrevor.Blocks.Image` to fill in the block content.
                            var mediaMeta = {
                                _info: config.server.url + response.data._links.self.href,
                                _id: response.data._id,
                                _url: response.data.renditions.thumbnail.href,
                                renditions: response.data.renditions
                            };
                            // media will be added latter in the `meta` if this item in this callback

                            successCallback({media: mediaMeta});
                        }, handleError);
                });
            },
            gogoGadgetoRemoteImage: function(imgURL) {
                return $http({
                    url: `${config.server.url}/archive/draganddrop`,
                    method: 'POST',
                    data: {
                        image_url: imgURL,
                        mimetype: 'image/jpeg'
                    },
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    }
                })
                    .then((response) => {
                        if (response.data._issues) {
                            throw response.data._issues;
                        }

                        return {media: {
                            _id: response.data._id,
                            _url: response.data.renditions.thumbnail.href,
                            renditions: response.data.renditions
                        }};
                    });
            }
        },
        fetchNewContributionPage: function() {
            self.contributionsPostsInstance.fetchNewPage();
        },
        fetchNewDraftPage: function() {
            self.draftPostsInstance.fetchNewPage();
        },
        fetchNewCommentsPage: function() {
            self.commentPostsInstance.fetchNewPage();
        },
        fetchNewTimelinePage: function() {
            self.timelineInstance.fetchNewPage();
        },
        isTimelineReordering: function() {
            // self.timelineInstance may not be instantiated yet when isTimelineReordering is first checked
            return self.timelineInstance ? self.timelineInstance.reorderPost : false;
        },
        clearTimelineReordering: function() {
            return self.timelineInstance.clearReorder();
        },
        isBlogOpened: function() {
            return $scope.blog.blog_status === 'open';
        },
        isCurrentPostPublished: function() {
            return angular.isDefined($scope.currentPost) && $scope.currentPost.post_status === 'open';
        },
        isCurrentPostUnsaved: function() {
            if (angular.isDefined($scope.currentPost)) {
                return _.some(getItemsFromEditor(), (item, itemIndex) => _.some(_.keys(item), (key) => {
                    if (!angular.isDefined($scope.currentPost.items[itemIndex])) {
                        return true;
                    }

                    return !_.isEqual(item[key], $scope.currentPost.items[itemIndex].item[key]);
                }));
            }

            return true;
        },
        togglePreview: function() {
            $scope.preview = !$scope.preview;
        }
    });
    // initalize the view with the editor panel
    var panel = angular.isDefined($routeParams.panel) ? $routeParams.panel : 'editor',
        syndId = angular.isDefined($routeParams.syndId) ? $routeParams.syndId : null;

    // Here we define an object instead of simple array.
    // because this variable needs to be update in the ingest-panel directive
    // and the two way data binding will only work with an object!
    $scope.ingestQueue = {queue: []};

    $scope.openPanel(panel, syndId);

    // This function is responsible for updating the ingest panel
    // unread count when this one isn't currently selected/displayed
    $scope.$on('posts', (e, data) => {
        if ($scope.panelState !== 'ingest'
        && data.hasOwnProperty('posts')
        && data.hasOwnProperty('created')) {
            let syndPosts = data.posts
                .filter((post) => post.hasOwnProperty('syndication_in'));

            $scope.ingestQueue.queue = $scope.ingestQueue.queue.concat(syndPosts);
        }
    });
}
