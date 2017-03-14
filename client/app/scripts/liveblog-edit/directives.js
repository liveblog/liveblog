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

import lbPostsList from './directives/posts-list';
import lbItem from './directives/item';
import stopEvent from './directives/stop-event';
import selectTextOnClick from './directives/select-text-on-click';
import lbBindHtml from './directives/bind-html';
import lbFilterByMember from './directives/filter-by-member';
import autofocus from './directives/autofocus';
import fullHeight from './directives/full-height';

// Freetype related directives
import freetypeRender from './directives/freetype-render';
import freetypeEmbed from './directives/freetype-embed';
import freetypeText from './directives/freetype-text';
import freetypeLink from './directives/freetype-link';
import freetypeCollectionAdd from './directives/freetype-collection-add';
import freetypeCollectionRemove from './directives/freetype-collection-remove';

angular.module('liveblog.edit')
    .directive('lbPostsList', lbPostsList)
    .directive('lbItem', lbItem)
    .directive('lbPost', [
        'notify', 'gettext', 'asset', 'postsService', 'modal', 'blogSecurityService', '$document', 'instagramService',
        function(notify, gettext, asset, postsService, modal, blogSecurityService, $document, instagramService) {
            return {
                scope: {
                    post: '=',
                    onEditAction: '=',
                    //the post that is in the process of being reordered
                    reorderPost: '=',
                    //the order property of the post that was reordered and should stay highlighted a bit more
                    keepHighlighted: '=',
                    //call when the user clicks on the reorder icon
                    startReorder: '&',
                    //call when the user escaped the reorder action
                    clearReorderAction: '=',
                    //call when the user has chosen a new place for the post
                    reorder: '&',
                    //the index of the post in the list
                    index: '=',
                    // the controller of parent posts list directive
                    postsListCtrl: '='
                },
                restrict: 'E',
                templateUrl: 'scripts/liveblog-edit/views/post.html',
                link: function(scope, elem, attrs) {
                    // if the escape key is press then clear the reorder action.
                    function escClearReorder(e) {
                        if (e.keyCode === 27) {
                            scope.clearReorder();
                        }
                    }
                    function changePostStatus(post, status) {
                        // don't save the original post coming for the posts list, because it needs
                        // to conserve its original update date in the posts list directive
                        // in order to retrieve updates from this date (if latest)
                        post = angular.copy(post);
                        // save the post with the new status
                        return postsService.savePost(post.blog, post, undefined, {post_status: status});
                    }
                    function changeHighlightStatus(post, status) {
                        return postsService.savePost(post.blog, post, undefined, {lb_highlight: status});
                    }

                    angular.extend(scope, {
                        functionize: function (obj) {
                            if (typeof(obj) !== 'function') {
                                return function() {
                                    return obj;
                                };
                            }
                            return obj;
                        },
                        toggleMultipleItems: function() {
                            scope.show_all = !scope.show_all;

                            // check if the items toggled are instagram embeds
                            if (instagramService.postHasEmbed(scope.post.groups[1].refs)) {
                                instagramService.processEmbeds();
                            }
                        },
                        removePost: function(post) {
                            postsService.remove(angular.copy(post)).then(function(message) {
                                notify.pop();
                                notify.info(gettext('Removing post...'));
                            }, function() {
                                notify.pop();
                                notify.error(gettext('Something went wrong'));
                            });
                        },
                        preMovePost: function(post) {
                            $document.bind('keypress', escClearReorder);
                            scope.startReorder({post: post});
                        },
                        movePost: function(index, location) {
                            scope.reorder({index: index, location: location});
                        },
                        clearReorder: function() {
                            $document.unbind('keypress', escClearReorder);
                            scope.clearReorderAction();
                        },
                        changePinStatus: function (post, status) {
                            return postsService.savePost(post.blog, post, undefined, {sticky: status});
                        },
                        togglePinStatus: function(post) {
                            scope.changePinStatus(post, !post.sticky).then(function(post) {
                                notify.pop();
                                notify.info(post.sticky ? gettext('Post was pinned') : gettext('Post was unpinned'));
                            }, function() {
                                notify.pop();
                                notify.error(gettext('Something went wrong. Please try again later'));
                            });
                        },
                        onEditClick: function(post) {
                            scope.clearReorder();
                            scope.onEditAction(post);
                        },
                        askRemovePost: function(post) {
                            scope.clearReorder();
                            modal.confirm(gettext('Are you sure you want to delete the post?'))
                                .then(function() {
                                    scope.removePost(post);
                                });
                        },
                        unpublishPost: function(post) {
                            scope.clearReorder();
                            changePostStatus(post, 'submitted').then(function(post) {
                                notify.pop();
                                notify.info(gettext('Post saved as contribution'));
                            }, function() {
                                notify.pop();
                                notify.error(gettext('Something went wrong. Please try again later'));
                            });
                        },
                        highlightPost: function(post) {
                            changeHighlightStatus(post, !post.lb_highlight).then(function(post) {
                               notify.pop();
                               notify.info(post.lb_highlight ? gettext('Post was highlighted') : gettext('Post was un-highlighted'));
                            }, function() {
                               notify.pop();
                               notify.error(gettext('Something went wrong. Please try again later'));
                            });
                        },
                        publishPost: function(post) {
                            scope.clearReorder();
                            changePostStatus(post, 'open').then(function(post) {
                                notify.pop();
                                notify.info(gettext('Post published'));
                            }, function() {
                                notify.pop();
                                notify.error(gettext('Something went wrong. Please try again later'));
                            });
                        }
                    });
                }
            };
        }
    ])
    .directive('stopEvent', stopEvent)
    .directive('selectTextOnClick', selectTextOnClick)
    .directive('lbBindHtml', lbBindHtml)
    .directive('lbFilterByMember', lbFilterByMember)
    .directive('autofocus', autofocus)
    .directive('fullHeight', fullHeight)
    .directive('freetypeRender', freetypeRender)
    .directive('freetypeEmbed', freetypeEmbed)
    .directive('freetypeText', freetypeText)
    .directive('freetypeLink', freetypeLink)
    .directive('freetypeCollectionAdd', freetypeCollectionAdd)
    .directive('freetypeCollectionRemove', freetypeCollectionRemove)
    .directive('freetypeImage', ['$compile', 'modal', 'api', 'upload', function($compile, modal, api, upload) {
        return {
            restrict: 'E',
            templateUrl: 'scripts/liveblog-edit/views/freetype-image.html',
            controller: ['$scope', function($scope) {
                $scope.valid = true;
                $scope._id = _.uniqueId('image');
                if ($scope.compulsory !== undefined) {
                    var sentinel = $scope.$watch('[image,compulsory]', function(value) {
                            $scope.compulsoryFlag = (value[0].picture_url === '' && value[1] === '');
                    }, true);
                    $scope.$on('$destroy', sentinel);
                }
                var vm = this;
                angular.extend(vm, {
                    preview: {},
                    progress: {width: 0},
                    openUploadModal: function() {
                        vm.uploadModal = true;
                    },
                    closeUploadModal: function() {
                        vm.uploadModal = false;
                        vm.preview = {};
                        vm.progress = {width: 0};
                    },
                    removeImage: function() {
                        modal.confirm(gettext('Are you sure you want to remove the blog image?')).then(function() {
                            $scope.image.picture_url = '';
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
                                var picture_url = response.data.renditions.original.href;
                                $scope.image.picture_url = picture_url;
                                $scope.image.picture = response.data._id;
                                vm.uploadModal = false;
                                vm.preview = {};
                                vm.progress = {width: 0};
                            }, null, function(progress) {
                                vm.progress.width = Math.round(progress.loaded / progress.total * 100.0);
                            });
                        });
                    }
                });
            }],
            controllerAs: 'ft',
            scope: {
                image: '=',
                // `compulsory` indicates a variable that is needed if the current value is empty.
                compulsory: '=',
                validation: '='
            }
        };
    }]);
