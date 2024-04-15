/* eslint complexity: ["error", 12] */
import _ from 'lodash';
import postsTpl from 'scripts/liveblog-edit/views/posts-list.ng1';

lbPostsList.$inject = ['postsService', 'notify', '$timeout', 'PagesManager'];

export default function lbPostsList(postsService, notify, $timeout, PagesManager) {
    LbPostsListCtrl.$inject = ['$scope', '$element'];

    function LbPostsListCtrl($scope, $element) {
        $scope.lbSticky = $scope.lbSticky === 'true';
        const self = this;

        angular.extend(self, {
            isLoading: true,
            blogId: $scope.lbPostsBlogId,
            status: $scope.lbPostsStatus,
            sticky: $scope.lbSticky,
            allowUnpublishing: $scope.lbPostsAllowUnpublishing,
            allowReordering: $scope.lbPostsAllowReordering,
            allowEditing: $scope.lbPostsAllowEditing,
            allowDeleting: $scope.lbPostsAllowDeleting,
            allowPublishing: $scope.lbPostsAllowPublishing,
            isUnreadPost: $scope.lbPostsIsUnreadPost,
            onPostSelected: $scope.lbPostsOnPostSelected,
            showReorder: false,
            hideAllPosts: false,
            originalOrder: 0,
            pagesManager: new PagesManager(
                $scope.lbPostsBlogId,
                $scope.lbPostsStatus,
                // if the list is a list with sticky posts, show them all in the 1st pages
                $scope.lbSticky === true ? 100 : 10,
                $scope.lbPostsOrderBy || 'editorial',
                $scope.lbSticky,
                null,
                $scope.lbPostsNoSyndication === true,
                $scope.lbScheduled === true
            ),
            fetchNewPage: function() {
                self.isLoading = true;
                return self.pagesManager.fetchNewPage().then(() => {
                    self.isLoading = false;
                });
            },
            startReorder: function(post) {
                self.reorderPost = post;
            },
            clearReorder: function() {
                self.reorderPost = false;
                $timeout(() => {
                    self.keepHighlighted = false;
                }, 2000);
                $timeout(() => {
                    self.hideAllPosts = false;
                }, 200);
            },
            getOrder: function(position) {
                return angular
                    .element(
                        $element
                            .find('.posts')
                            .find('li .lb-post')
                            .get(position)
                    )
                    .scope()
                    .post
                    .order;
            },
            reorder: function(position, location) {
                if (self.allowReordering) {
                    let order;
                    let before;
                    let after;

                    if (position === 0) {
                        order = self.getOrder(0) + 1;
                    } else if (position === $element.find('.posts').find('li .lb-post').length - 1) {
                        order = self.getOrder(position) - 1;
                    } else {
                        if (location === 'above') {
                            before = self.getOrder(position - 1);
                            after = self.getOrder(position);
                        } else {
                            before = self.getOrder(position);
                            after = self.getOrder(position + 1);
                        }
                        order = after + (before - after) / 2;
                    }
                    self.updatePostOrder(self.reorderPost, order);
                }
            },
            updatePostOrder: function(post, order) {
                self.hideAllPosts = true;
                postsService.savePost(post.blog, post, undefined, {order: order})
                    .then(() => {
                        self.keepHighlighted = order;
                        self.clearReorder();
                    }, () => {
                        self.hideAllPosts = false;
                        notify.error(gettext('Something went wrong. Please reload and try again later'));
                    });
            },
            removePostFromList: function(post) {
                self.pagesManager.removePost(post);
            },
            isPostsEmpty: function() {
                return self.pagesManager.count() < 1 && !self.isLoading && self.isStickyPostsEmpty();
            },
            numberOfPosts: function() {
                return self.pagesManager.count();
            },
            isStickyPostsEmpty: function() {
                if ($scope.lbStickyInstance) {
                    return $scope.lbStickyInstance.isPostsEmpty();
                }

                return true;
            },
            isSinglePost: function() {
                return self.pagesManager.count() === 1;
            },
            isFilterEnable: function() {
                return self.pagesManager.authors.length > 0;
            },
            setAuthorFilter: function(users) {
                self.authorFilters = users;
                self.isLoading = true;
                return self.pagesManager.setAuthors(users.map((user) => user._id)).then(() => {
                    self.isLoading = false;
                });
            },
            isEditable: function(post) {
                // A syndicated post of type free type is not editable
                return !(
                    post.syndication_in &&
                    post.groups[1].refs[0].item.group_type === 'freetype' &&
                    post.groups[1].refs[0].item.item_type.toLowerCase() !== 'scorecard'
                );
            },
            isBlogClosed: $scope.$parent.blog.blog_status === 'closed',

            shouldRender: function(post) {
                if (typeof $scope.lbShouldRenderPost === 'undefined') {
                    return true;
                }

                return $scope.lbShouldRenderPost(post);
            },
        });
        $scope.lbPostsInstance = self;

        // retrieve first page
        self.fetchNewPage()
            // retrieve updates when event is received
            .then(() => {
                const onNotification = _.throttle((e, data) => handleNotification(data, $element, $scope), 100);

                $scope.$on('posts', onNotification);
                $scope.$on('content:update', onNotification);
            });
    }

    /**
     * This function is responsible for updating the timeline,
     * the contribution, the draft and the comment panel on incoming
     * new post as well unpublished posts
     */
    const handleNotification = (eventParams, $element, $scope) => {
        const listInstance = $scope.lbPostsInstance;
        const posts = eventParams.posts || [];

        if (shouldExcludeFromUpdates($element, $scope, eventParams))
            return false;

        if (isNotMainTimelineWithStagesDefined($element, eventParams))
            return false;

        // Notify for scheduled post
        notifyScheduledPostPublished(eventParams);

        // Only update if posts belong to the same blog
        updateIfPostsBelongToSameBlog(posts, $scope, listInstance, eventParams);
    };

    /**
     * Determines if the element should be updated based on:
     * 1. If it not the main timeline
     * 2. It is not a comments panel
     * 3. If the first post is syndicated
     */
    const shouldExcludeFromUpdates = ($element, $scope, eventParams) => {
        const isMainTimeline = $element.hasClass('timeline-posts-list');
        const isPanelOfComments = $scope.lbPostsStatus === 'comment';
        const isFirstPostSyndicated = eventParams.posts && _.has(eventParams.posts[0], 'syndication_in');

        return !isMainTimeline && !isPanelOfComments && isFirstPostSyndicated;
    };

    const isNotMainTimelineWithStagesDefined = ($element, eventParams) => {
        const isMainTimeline = $element.hasClass('timeline-posts-list');

        return !isMainTimeline && angular.isDefined(eventParams.stages);
    };

    const notifyScheduledPostPublished = (eventParams) => {
        if (eventParams.scheduled_done) {
            notify.info(gettext('Scheduled post has been published'));
        }
    };

    // Check if posts belong to the same blog and update accordingly
    const updateIfPostsBelongToSameBlog = (posts, $scope, listInstance, eventParams) => {
        if (posts.length > 0 && posts.find((x) => x.blog === $scope.lbPostsBlogId)) {
            // if post was removed and was a syndicated one
            if (eventParams.deleted && eventParams.syndicated) {
                listInstance.pagesManager.removePost(posts[0]);
                return notify.info(gettext('Syndicated post removed by the producer'));
            }

            const maxPublishedDate = getMaxPublishedDate(posts, eventParams.updated);

            listInstance.isLoading = true;
            listInstance.pagesManager.retrieveUpdate(true, maxPublishedDate).then(() => {
                refreshInstagramEmbeds();
                if (eventParams.deleted === true) {
                    notify.info(gettext('Post removed'));
                }
                listInstance.isLoading = false;
            });
        }
    };

    const getMaxPublishedDate = (posts, isUpdated) =>
        isUpdated ? undefined : posts.length > 0 && posts[0]['published_date'];

    const refreshInstagramEmbeds = () => {
        // Regenerate the embed otherwise the image doesn't appear
        if (_.has(window, 'instgrm')) {
            window.instgrm.Embeds.process();
        }
    };

    return {
        scope: {
            lbPostsBlogId: '=',
            lbPostsStatus: '@',
            lbSticky: '@',
            lbStickyInstance: '=',
            lbPostsNoSyndication: '=',
            lbPostsOrderBy: '@',
            lbPostsAllowUnpublishing: '=',
            lbPostsAllowReordering: '=',
            lbPostsAllowEditing: '=',
            lbPostsAllowDeleting: '=',
            lbPostsAllowPublishing: '=',
            lbPostsOnPostSelected: '=',
            lbPostsIsUnreadPost: '=',
            lbPostsInstance: '=',

            /**
             * Provide `true` in order to get scheduled posts (published_date) in future
             */
            lbScheduled: '=',

            /**
             * Function that will decide if the post is rendered or not. True by default
             */
            lbShouldRenderPost: '=',
        },
        restrict: 'EA',
        transclude: true,
        templateUrl: postsTpl,
        controllerAs: 'postsList',
        controller: LbPostsListCtrl,
    };
}
