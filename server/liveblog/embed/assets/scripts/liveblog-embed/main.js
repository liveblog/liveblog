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
                },
                createPagesWithPosts: function(posts) {
                    var that = this;
                    that.pages = [];
                    // respect the order
                    // TODO: allow other field for ordering
                    posts.sort(function(a, b) {return a.order < b.order;});
                    var page;
                    posts.forEach(function(post, index) {
                        if (index % vm.max_results === 0) {
                            page = new Page();
                        }
                        page.addPost(post);
                        if (page.posts.length === vm.max_results) {
                            that.addPage(page);
                            page = undefined;
                        }
                    });
                    if (angular.isDefined(page)) {
                        that.addPage(page);
                    }
                },
                refreshPage: function(page_index) {
                    var that = this;
                    retrievePage(page_index).then(function(posts) {
                        that.pages[page_index].posts = posts._items;
                    });
                },
                refreshPageFrom: function(page_index) {
                    for (page_index; page_index < this.pages.length; page_index++) {
                        this.refreshPage(page_index);
                    }
                },
                getPostPageIndexes: function(post_to_find){
                    var page;
                    for (var page_index = 0; page_index < this.pages.length; page_index++) {
                        page = this.pages[page_index];
                        for (var post_index = 0; post_index < page.posts.length; post_index++) {
                            if (page.posts[post_index]._id === post_to_find._id) {
                                return [page_index, post_index];
                            }
                        }
                    }
                },
                allPosts: function () {
                    var posts = this.pages.map(function(page) {
                        return page.posts.map(function(post) {
                            return post;
                        });
                    });
                    var merged = [];
                    return merged.concat.apply(merged, posts);
                },
                addPost: function(post) {
                    var posts = this.allPosts();
                    posts.push(post);
                    this.createPagesWithPosts(posts);
                },
                removePost: function(post_to_remove) {
                    var indexes = this.getPostPageIndexes(post_to_remove);
                    if (angular.isDefined(post_to_remove)) {
                        var page_index = indexes[0];
                        var post_index = indexes[1];
                        this.pages[page_index].posts.splice(post_index, 1);
                    }
                },
                count: function() {
                    return this.pages.reduce(function(previous_value, current_value) {
                        return previous_value + current_value.posts.length;
                    }, 0);
                }
            };
        }

        function retrievePage(page) {
            // request parameters
            var posts_criteria = {
                source: {
                    query: {filtered: {filter: {and: [{not: {term: {deleted: true}}}]}}},
                    "sort":[{"order":{"order":"desc","missing":"_last","unmapped_type":"long"}}]
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
            if (vm.pagesManager.count() > 0) {
                retrieveUpdate().then(function(updates) {
                    updates._items.forEach(function(post) {
                        if (post.deleted) {
                            // a post was removed. Better to update all the pages after the deleted post.
                            var page_index = vm.pagesManager.getPostPageIndexes(post);
                            if (angular.isDefined(page_index)) {
                                vm.pagesManager.refreshPageFrom(page_index[0]);
                            }
                        }
                    });
                });
            }
            page_index = page_index || Math.floor(vm.pagesManager.count() / vm.max_results) + 1;
            page_obj = page_obj || new Page();
            retrievePage(page_index).then(function(posts) {
                // update posts meta data
                vm.posts_meta = posts._meta;
                // add posts if doesn't exist
                posts._items.forEach(function(post) {
                    if (!angular.isDefined(vm.pagesManager.getPostPageIndexes(post)) && page_obj.posts.length < vm.max_results) {
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

            function getLatestUpdateDate(posts) {
                // TODO: check also the date from updated post, they are not always put in `posts`
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

            function applyUpdates(updates) {
                updates.forEach(function(post) {
                    if (angular.isDefined(vm.pagesManager.getPostPageIndexes(post))) {
                        // post already in the list
                        if (post.deleted) {
                            // post deleted
                            vm.pagesManager.removePost(post);
                        }
                    } else {
                        // post doesn't exist in the list
                        if (!post.deleted) {
                            vm.pagesManager.addPost(post);
                        }
                    }

                });
            }

            var posts_criteria = {
                blogId: blog_id,
                source: {
                    query: {filtered: {filter: {and: [
                        {range: {_updated: {gt: getLatestUpdateDate(vm.pagesManager.allPosts())}}}
                    ]}}}
                }
            };
            return Posts.get(posts_criteria).$promise.then(function(posts) {
                // save updates meta data
                vm.updates_available = posts._meta.total;
                // process the sync operation
                force_sync = force_sync === true;
                if (force_sync || vm.auto_update) {
                    applyUpdates(posts._items);
                }
                return posts;
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
            pagesManager: new PagesManager(),
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

    angular.module('liveblog-embed', ['ngResource', 'ngSanitize' ,'ngAnimate'])
        .controller('timelineCtrl', TimelineCtrl)
        .config(['$interpolateProvider', function($interpolateProvider) {
            // change the template tag symbols
            $interpolateProvider.startSymbol('[[').endSymbol(']]');
        }]);

})(angular);
