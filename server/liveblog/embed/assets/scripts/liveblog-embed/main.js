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

        /**
         * Represent a page of posts
         */
        function Page(posts) {
            return {
                posts: posts || [],
                addPost: function(post) {this.posts.push(post);}
            };
        }

        /**
         * Manage the pages and their posts
         */
        function PagesManager(pages) {
            return {
                pages: pages || [],
                addPage: function(page) {
                    this.pages.push(page);
                    vm.posts = vm.posts.concat(page.posts);
                },
                addPost: function(post) {
                    vm.posts.push(post);
                },
                removePost: function(post_to_remove) {
                    var page, post;
                    for (var i = 0; i < this.pages.length; i++) {
                        page = this.pages[i];
                        for (var j = 0; j < page.posts.length; j++) {
                            post = page.posts[j];
                            if (post._id === post_to_remove._id) {
                                console.log(post);
                                // should update all the next pages
                            }
                        }
                    }
                }
            };
        }

        function getPost(post_id) {
            for (var i = 0; i < vm.posts.length; i++) {
                if (vm.posts[i]._id === post_id) {
                    return vm.posts[i];
                }
            }
        }

        function retrievePage(page) {
            // request parameters
            var posts_criteria = {
                source: {
                    query: {filtered: {filter: {and: [{not: {term: {deleted: true}}}]}}}
                },
                page: page,
                max_results: vm.max_results
            };
            return Posts.get(posts_criteria).$promise;
        }

        /**
         * Fetch a page of posts and add this page to the pages manager.
         * @param {interger} page_index - the page index
         * @param {object} page_obj - an instance of Page. If undefined, it will be create.
         */
        function fetchPage(page_index, page_obj) {
            page_index = page_index || Math.floor(vm.posts.length / vm.max_results) + 1;
            page_obj = page_obj || Page();
            retrievePage(page_index).then(function(posts) {
                // update posts meta data
                vm.posts_meta = posts._meta;
                // add posts if doesn't exist
                posts._items.forEach(function(post) {
                    if (getPost(post._id) === undefined && page_obj.posts.length < vm.max_results) {
                        page_obj.addPost(post);
                    }
                });
                // if not latest page
                if (posts._meta.total >= posts._meta.max_results * posts._meta.page) {
                    // if page not full, redo this operation to fill this page with the next one
                    if (page_obj.posts.length < vm.max_results) {
                        return fetchPage(page_index + 1, page_obj);
                    }
                }
                vm.pagesManager.addPage(page_obj);
            });
        }

        function retrieveUpdate(force_sync) {
            force_sync = force_sync === true;
            function getLatestUpdateDate(posts) {
                // TODO: check also the date from updated post, they are not always put in vm.posts
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
            var posts_criteria = {
                blogId: blog_id,
                source: {
                    query: {filtered: {filter: {and: [
                        {range: {_updated: {gt: getLatestUpdateDate(vm.posts)}}}
                    ]}}}
                }
            };
            Posts.get(posts_criteria).$promise.then(function(posts) {
                // save updates meta data
                vm.updates_available = posts._meta.total;
                // process the sync operation
                if (force_sync || vm.auto_update) {
                    console.log('sync', vm.pagesManager);
                    posts._items.forEach(function(post) {
                        if (getPost(post._id)) {
                            // post already in the list
                            if (post.deleted) {
                                // post deleted
                                vm.pagesManager.removePost(post);
                                console.log('deleted', post);
                            }
                        } else {
                            // post doesn't exist in the list
                            if (!post.deleted) {
                                vm.pagesManager.addPost(post);
                                console.log('added', post);
                            } else {
                                vm.pagesManager.removePost(post);
                                console.log('deleted', post);
                            }
                        }

                    });
                }
            });
        }

        function toggleAutoUpdate() {
            vm.auto_update = !vm.auto_update;
        }

        // define vm
        angular.extend(vm, {
            auto_update: false,
            page: 1,
            max_results: 5,
            blog: {},
            posts: [],
            pagesManager: PagesManager(),
            posts_meta: {},
            updates_available: 0,
            fetchPage: fetchPage,
            retrieveUpdate: retrieveUpdate
        });
        // retrieve blog information
        Blogs.get().$promise.then(function(blog) {
            vm.blog = blog;
        });
        // retrieve first page of posts
        fetchPage();
        // retrieve update periodically
        $interval(retrieveUpdate, 2000);
    }

    angular.module('liveblog-embed', ['ngResource', 'ngSanitize'])
        .controller('timelineCtrl', TimelineCtrl)
        .config(['$interpolateProvider', function($interpolateProvider) {
            // change the template tag symbols
            $interpolateProvider.startSymbol('[[').endSymbol(']]');
        }]);

})(angular);
