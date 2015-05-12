(function(angular) {
    'use strict';

    TimelineCtrl.$inject = ['$resource', '$interval', '$scope'];
    function TimelineCtrl($resource, $interval, $scope) {

        var vm = this;
        var blog_id = window.LB_BLOG_ID;
        var api_hostname = window.LB_API_HOST;
        var Blogs = $resource(api_hostname + 'api/client_blogs/:blogId', {blogId: blog_id});
        var Posts = $resource(api_hostname + 'api/client_blogs/:blogId/posts', {blogId: blog_id}, {
            get: {
                transformResponse: function(posts) {
                    // decode json
                    posts = angular.fromJson(posts);
                    // set an items property
                    posts._items.forEach(function(post) {
                        if (angular.isDefined(post.groups[1])) {
                            post.items = post.groups[1].refs.map(function(item) {return item.item;});
                        }
                    });
                    return posts;
                }
            }
        });

        function fetchPage() {
            vm.page = Math.floor(vm.posts.length / vm.max_results) + 1;
            var filters = filters || {};
            var posts_criteria = {
                source: {
                    query: {filtered: {filter: {and: [{not: {term: {deleted: true}}}]}}}
                },
                page: vm.page,
                max_results: vm.max_results
            };
            return Posts.get(posts_criteria).$promise.then(function(posts) {
                posts._items.forEach(function(post) {
                    if (vm.posts.indexOf(post) < 0) {
                        vm.posts.push(post);
                    }
                });
                vm.posts_meta = posts._meta;
            });
        }

        function retrieveUpdate() {
            function getLatestUpdateDate(posts) {
                if (!angular.isDefined(posts) || posts.length < 1) {
                    return;
                }
                var latest_date, date;
                posts.forEach(function (post) {
                    date = moment(post._updated);
                    if (angular.isDefined(latest_date)) {
                        if (latest_date.diff(date) < 0) {
                            latest_date = date;
                        }
                    } else {
                        latest_date = date;
                    }
                });
                return latest_date.utc().format();
            }
            var updated_after = getLatestUpdateDate(vm.posts);
            var posts_criteria = {
                blogId: blog_id,
                source: {
                    query: {filtered: {filter: {and: [
                        {not: {term: {deleted: true}}},
                        {range: {_updated: {gt: updated_after}}}
                    ]}}}
                }
            };
            Posts.get(posts_criteria).$promise.then(function(posts) {
                posts._items.forEach(function(post) {
                    if (vm.posts.indexOf(post) < 0) {
                        vm.posts.push(post);
                    }
                });
            });
        }

        var update_interval;
        function setAutoUpdateInterval() {
            if (vm.auto_update) {
                update_interval = $interval(retrieveUpdate, 2000);
            } else {
                $interval.cancel(update_interval);
            }
        }

        // define vm
        angular.extend(vm, {
            auto_update: false,
            page: 1,
            max_results: 5,
            blog: {},
            posts: [],
            posts_meta: {},
            fetchPage: fetchPage,
            retrieveUpdate: retrieveUpdate,
            toggleAutoUpdate: setAutoUpdateInterval
        });
        // retrieve blog information
        Blogs.get().$promise.then(function(blog) {
            vm.blog = blog;
        });
        // retrieve first page of posts
        fetchPage();
        // auto update
        setAutoUpdateInterval();
    }

    angular.module('liveblog-embed', ['ngResource', 'ngSanitize'])
        .controller('timelineCtrl', TimelineCtrl)
        .config(['$interpolateProvider', function($interpolateProvider) {
            // change the template tag symbols
            $interpolateProvider.startSymbol('[[').endSymbol(']]');
        }]);

})(angular);
