import postTpl from 'scripts/liveblog-edit/views/post.html';

lbPost.$inject = [
    'notify',
    'gettext',
    'asset',
    'postsService',
    'modal',
    'blogSecurityService',
    '$document',
    'instagramService',
    '$rootScope'
];

export default function lbPost(notify, gettext, asset, postsService, modal,
    blogSecurityService, $document, instagramService, $rootScope) {
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
        templateUrl: postTpl,
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
                        $rootScope.$broadcast('removing_timeline_post', {post: post});
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
                        notify.info(
                            post.lb_highlight ? gettext('Post was highlighted') : gettext('Post was un-highlighted')
                        );
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
