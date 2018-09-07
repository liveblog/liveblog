import postsTpl from 'scripts/liveblog-edit/views/posts.ng1';

lbPostsList.$inject = ['postsService', 'notify', '$q', '$timeout', 'session', 'PagesManager'];

export default function lbPostsList(postsService, notify, $q, $timeout, session, PagesManager) {
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
                $scope.lbPostsNoSyndication === true
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
                postsService.savePost(post.blog, post, undefined, {order: order}).then(() => {
                    self.keepHighlighted = order;
                    self.clearReorder();
                }, () => {
                    self.hideAllPosts = false;
                    notify.pop();
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

        });
        $scope.lbPostsInstance = self;
        // retrieve first page
        self.fetchNewPage()
            // retrieve updates when event is recieved
            .then(() => {
                // This function is responsible for updating the timeline,
                // the contribution, the draft and the comment panel on incoming
                // new post as well unpublished posts
                const onNotification = _.throttle((e, eventParams) => {
                    if (!$element.hasClass('timeline-posts-list')
                        && $scope.lbPostsStatus !== 'comment'
                        && eventParams.posts
                        && eventParams.posts[0].hasOwnProperty('syndication_in')) {
                        return false;
                    }

                    if (!$element.hasClass('timeline-posts-list')
                        && angular.isDefined(eventParams.stages)) {
                        return false;
                    }

                    self.isLoading = true;
                    self.pagesManager.retrieveUpdate(true).then(() => {
                        // Regenerate the embed otherwise the image doesn't appear
                        if (window.hasOwnProperty('instgrm')) {
                            window.instgrm.Embeds.process();
                        }

                        if (eventParams.deleted === true) {
                            notify.pop();
                            notify.info(gettext('Post removed'));
                        }
                        self.isLoading = false;
                    });
                }, 100);

                $scope.$on('posts', onNotification);
                $scope.$on('content:update', onNotification);
            });
    }
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
        },
        restrict: 'EA',
        transclude: true,
        templateUrl: postsTpl,
        controllerAs: 'postsList',
        controller: LbPostsListCtrl,
    };
}
