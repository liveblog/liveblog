import postTpl from 'scripts/liveblog-edit/views/post.ng1';

lbPost.$inject = [
    'notify',
    'gettext',
    'asset',
    'postsService',
    'modal',
    'blogSecurityService',
    '$document',
    'instagramService',
    '$rootScope',
];

export default function lbPost(notify, gettext, asset, postsService, modal,
    blogSecurityService, $document, instagramService, $rootScope) {
    return {
        scope: {
            post: '=',
            onEditAction: '=',
            // the post that is in the process of being reordered
            reorderPost: '=',
            // the order property of the post that was reordered and should stay highlighted a bit more
            keepHighlighted: '=',
            // call when the user clicks on the reorder icon
            startReorder: '&',
            // call when the user escaped the reorder action
            clearReorderAction: '=',
            // call when the user has chosen a new place for the post
            reorder: '&',
            // the index of the post in the list
            index: '=',
            // the controller of parent posts list directive
            postsListCtrl: '=',
        },
        restrict: 'E',
        templateUrl: postTpl,
        link: function(scope, elem, attrs) {
            // we set timeout function to remove edit flag after expireAt date
            if (scope.post.edit_flag) {
                postsService.setFlagTimeout(scope.post, () => {
                    scope.$apply();
                });
            }

            // if the escape key is press then clear the reorder action.
            function escClearReorder(e) {
                if (e.keyCode === 27) {
                    scope.clearReorder();
                }
            }
            function changePostStatus(postRef, status) {
                // don't save the original post coming for the posts list, because it needs
                // to conserve its original update date in the posts list directive
                // in order to retrieve updates from this date (if latest)
                const post = angular.copy(postRef);

                // save the post with the new status
                return postsService.savePost(post.blog, post, undefined, {post_status: status});
            }
            function changeHighlightStatus(post, status) {
                return postsService.savePost(post.blog, post, undefined, {lb_highlight: status});
            }

            angular.extend(scope, {
                functionize: function(obj) {
                    if (typeof obj !== 'function') {
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
                userify: function(user) {
                    if (!user) return;

                    if (user._id === $rootScope.currentUser._id)
                        return 'You';

                    return user.display_name;
                },
                removePost: function(post) {
                    let postToDelete = angular.copy(post);

                    postsService.remove(postToDelete).then((message) => {
                        notify.pop();
                        notify.info(gettext('Removing post...'));
                        $rootScope.$broadcast('removing_timeline_post', {post: post});
                    }, () => {
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
                changePinStatus: function(post, status) {
                    return postsService.savePost(post.blog, post, undefined, {sticky: status});
                },
                togglePinStatus: function(post) {
                    scope.changePinStatus(post, !post.sticky).then((post) => {
                        notify.pop();
                        notify.info(post.sticky ? gettext('Post was pinned') : gettext('Post was unpinned'));
                    }, () => {
                        notify.pop();
                        notify.error(gettext('Something went wrong. Please try again later'));
                    });
                },
                onEditClick: function(post) {
                    scope.clearReorder();
                    scope.onEditAction(post);
                },
                isYoutubeAttached: function(post) {
                    return post.items.some((x) => x.item.item_type === 'video');
                },
                askRemovePost: function(post) {
                    let msg = gettext('Are you sure you want to delete the post?');

                    if (scope.isYoutubeAttached(post))
                        msg += '<br/>This will NOT remove the video from YouTube\'s account.';

                    scope.clearReorder();
                    modal.confirm(msg)
                        .then(() => {
                            scope.removePost(post);
                        });
                },
                unpublishPost: function(post) {
                    scope.clearReorder();
                    changePostStatus(post, 'submitted').then((post) => {
                        notify.pop();
                        notify.info(gettext('Post saved as contribution'));
                    }, () => {
                        notify.pop();
                        notify.error(gettext('Something went wrong. Please try again later'));
                    });
                },
                highlightPost: function(post) {
                    changeHighlightStatus(post, !post.lb_highlight).then((post) => {
                        notify.pop();
                        notify.info(
                            post.lb_highlight ? gettext('Post was highlighted') : gettext('Post was un-highlighted')
                        );
                    }, () => {
                        notify.pop();
                        notify.error(gettext('Something went wrong. Please try again later'));
                    });
                },
                publishPost: function(post) {
                    scope.clearReorder();
                    changePostStatus(post, 'open').then((post) => {
                        notify.pop();
                        notify.info(gettext('Post published'));
                    }, () => {
                        notify.pop();
                        notify.error(gettext('Something went wrong. Please try again later'));
                    });
                },
            });
        },
    };
}
