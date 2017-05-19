import postsTpl from 'scripts/liveblog-edit/views/posts.html';

lbPostsList.$inject = ['postsService', 'notify', '$q', '$timeout', 'session', 'PagesManager'];

export default function lbPostsList(postsService, notify, $q, $timeout, session, PagesManager) {
    LbPostsListCtrl.$inject = ['$scope', '$element'];

    function LbPostsListCtrl($scope, $element) {
        $scope.lbSticky = $scope.lbSticky === 'true';
        var vm = this;
        angular.extend(vm, {
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
                //if the list is a list with sticky posts, show them all in the 1st pages
                $scope.lbSticky === true? 100: 10,
                $scope.lbPostsOrderBy || 'editorial',
                $scope.lbSticky,
                null,
                $scope.lbPostsNoSyndication === true
            ),
            fetchNewPage: function() {
                vm.isLoading = true;
                return vm.pagesManager.fetchNewPage().then(function() {
                    vm.isLoading = false;
                });
            },
            startReorder: function(post) {
                vm.reorderPost = post;
            },
            clearReorder: function() {
                vm.reorderPost = false;
                $timeout(function() {
                    vm.keepHighlighted = false;
                }, 2000);
                $timeout(function() {
                    vm.hideAllPosts = false;
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
            reorder: function(index, location) {
                if (vm.allowReordering) {
                    var position = index;
                    var order, before, after;
                    if (position === 0) {
                        order = vm.getOrder(0) + 1;
                    } else if (position === $element.find('.posts').find('li .lb-post').length - 1) {
                        order = vm.getOrder(position) - 1;
                    } else {
                        if (location === 'above') {
                            before = vm.getOrder(position - 1);
                            after = vm.getOrder(position);
                        } else {
                            before = vm.getOrder(position);
                            after = vm.getOrder(position + 1);
                        }
                        order = after + (before - after) / 2;
                    }
                    vm.updatePostOrder(vm.reorderPost, order);
                }
            },
            updatePostOrder: function(post, order) {
                vm.hideAllPosts = true;
                postsService.savePost(post.blog, post, undefined, {order: order}).then(function() {
                    vm.keepHighlighted = order;
                    vm.clearReorder();
                }, function() {
                    vm.hideAllPosts = false;
                    notify.pop();
                    notify.error(gettext('Something went wrong. Please reload and try again later'));
                });
            },
            removePostFromList: function(post) {
                vm.pagesManager.removePost(post);
            },
            isPostsEmpty: function() {
                return vm.pagesManager.count() < 1 && !vm.isLoading && vm.isStickyPostsEmpty();
            },
            numberOfPosts: function() {
                return vm.pagesManager.count();
            },
            isStickyPostsEmpty: function() {
                if ($scope.lbStickyInstance) {
                    return $scope.lbStickyInstance.isPostsEmpty();
                }

                return true;
            },
            isSinglePost: function() {
                return vm.pagesManager.count() === 1;
            },
            isFilterEnable: function() {
                return vm.pagesManager.authors.length > 0;
            },
            setAuthorFilter: function(users) {
                vm.authorFilters = users;
                vm.isLoading = true;
                return vm.pagesManager.setAuthors(users.map(function(user) {return user._id;})).then(function() {
                    vm.isLoading = false;
                });
            },
            isEditable: function(post) {
                // A syndicated post of type free type is not editable
                return !(post.syndication_in && post.groups[1].refs[0].item.group_type === 'freetype');
            },
            isBlogClosed: $scope.$parent.blog.blog_status === 'closed'

        });
        $scope.lbPostsInstance = vm;
        // retrieve first page
        vm.fetchNewPage()
        // retrieve updates when event is recieved
        .then(function() {
            // This function is responsible for updating the timeline, 
            // the contribution, the draft and the comment panel on incoming
            // new post as well unpublished posts
            const onNotification = (e, event_params) => {
                if (!$element.hasClass('timeline-posts-list')
                && $scope.lbPostsStatus !== 'comment'
                && event_params.posts
                && event_params.posts[0].hasOwnProperty('syndication_in')) {
                    return false;
                }

                if (!$element.hasClass('timeline-posts-list')
                && angular.isDefined(event_params.stages)) {
                    return false;
                }

                vm.isLoading = true;
                vm.pagesManager.retrieveUpdate(true).then(function() {
                    // Regenerate the embed otherwise the image doesn't appear
                    if (window.hasOwnProperty('instgrm'))
                        window.instgrm.Embeds.process();

                    if (event_params.deleted === true) {
                        notify.pop();
                        notify.info(gettext('Post removed'));
                    }
                    vm.isLoading = false;
                });

            };

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
            lbPostsInstance: '='
        },
        restrict: 'EA',
        transclude: true,
        templateUrl: postsTpl,
        controllerAs: 'postsList',
        controller: LbPostsListCtrl
    };

}
