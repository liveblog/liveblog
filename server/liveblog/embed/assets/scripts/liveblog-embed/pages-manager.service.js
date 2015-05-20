(function(angular) {
    'use strict';

    PagesManagerFactory.$inject = ['posts', '$q'];
    function PagesManagerFactory(postsService, $q) {

        function PagesManager (max_results) {

            var self = this;

            function retrievePage(page, max_results) {

                // request parameters
                var posts_criteria = {
                    source: {
                        query: {filtered: {filter: {and: [{term: {post_status: 'open'}}, {not: {term: {deleted: true}}}]}}},
                        sort: [{order: {order: 'desc', missing:'_last', unmapped_type: 'long'}}]
                    },
                    page: page,
                    max_results: max_results || self.max_results
                };
                return postsService.get(posts_criteria).$promise.then(function(posts) {
                    // update posts meta data
                    self.meta = posts._meta;
                    return posts;
                });
            }

            /**
             * Fetch a new page of posts and add this page to the pages manager.
             */
            function fetchNewPage() {
                return self.reloadPagesFrom(0, self.pages.length + 1);
            }

            function retrieveUpdate() {
                var date = self.latest_updated_date ? self.latest_updated_date.utc().format() : undefined;
                var posts_criteria = {
                    blogId: window.LB_BLOG_ID,
                    page: 1,
                    source: {
                        sort: [{_updated: {order: 'desc'}}],
                        query: {filtered: {filter: {and: [
                            {range: {_updated: {gt: date}}}
                        ]}}}
                    }
                };
                return postsService.get(posts_criteria).$promise.then(function(updates) {
                    var meta = updates._meta;
                    if (meta.total <= meta.max_results * meta.page || !angular.isDefined(date)) {
                        return updates;
                    } else {
                        var promises = [];
                        for (var i = meta.page + 1; i <= Math.floor(meta.total / meta.max_results) + 1; i++) {
                            posts_criteria.page = i;
                            promises.push(postsService.get(posts_criteria).$promise);
                        }
                        return $q.all(promises).then(function(updates_pages) {
                            return angular.extend({} ,updates_pages[0], {
                                _items: [].concat.apply([], updates_pages.map(function(update) {return update._items;})),
                                _meta: angular.extend(meta, {max_results: meta.max_results * updates_pages.length})
                            });
                        });
                    }
                });
            }

            function applyUpdates(updates) {
                updates.forEach(function(post) {
                    var existing_post_indexes = self.getPostPageIndexes(post);
                    if (angular.isDefined(existing_post_indexes)) {
                        // post already in the list
                        if (post.deleted) {
                            // post deleted
                            self.removePost(post);
                        } else {
                            // post updated
                            if (post.post_status === 'draft') {
                               self.removePost(post);
                            } else {
                                // update
                                self.pages[existing_post_indexes[0]].posts[existing_post_indexes[1]] = post;
                                createPagesWithPosts();
                           }
                        }
                    } else {
                        // post doesn't exist in the list
                        if (!post.deleted && post.post_status === 'open') {
                            self.addPost(post);
                        }
                    }
                });
                // update date
                self.updateLatestDates(updates);
            }

            function createPagesWithPosts(posts) {
                posts = posts || self.allPosts();
                self.pages = [];
                // respect the order
                // TODO: allow other field for ordering
                posts.sort(function(a, b) {return a.order < b.order;});
                var page;
                posts.forEach(function(post, index) {
                    if (index % self.max_results === 0) {
                        page = new Page();
                    }
                    page.addPost(post);
                    if (page.posts.length === self.max_results) {
                        addPage(page);
                        page = undefined;
                    }
                });
                if (angular.isDefined(page)) {
                    addPage(page);
                }
            }

            /**
             * Add the given page to the Page Manager
             */
            function addPage(page) {
                self.pages.push(page);
            }

            angular.extend(self, {
                pages: [],
                /**
                 * Represent the meta data of posts (total)
                 */
                meta: {},
                /**
                 * Number of results per page
                 */
                max_results: max_results,
                updateLatestDates: function(posts) {
                    var date;
                    posts.forEach(function(post) {
                        date = moment(post._updated);
                        if (angular.isDefined(self.latest_updated_date)) {
                            if (self.latest_updated_date.diff(date) < 0) {
                                self.latest_updated_date = date;
                            }
                        } else {
                            self.latest_updated_date = date;
                        }
                    });
                },
                /**
                 * Latest updated date. Used for retrieving updates since this date.
                 */
                latest_updated_date: undefined,
                /**
                 * Fetch a new page of posts
                 */
                fetchNewPage: fetchNewPage,
                /**
                 * Return the latest available updates
                 */
                retrieveUpdate: retrieveUpdate,
                applyUpdates: applyUpdates,
                /**
                 * Resynchronize the content of the given page and the following ones
                 */
                reloadPagesFrom: function(page_index, to) {
                    to = to || self.pages.length;
                    return retrievePage(1, to * self.max_results).then(function(posts) {
                        createPagesWithPosts(posts._items);
                    });
                },
                getPostPageIndexes: function(post_to_find){
                    var page;
                    for (var page_index = 0; page_index < self.pages.length; page_index++) {
                        page = self.pages[page_index];
                        for (var post_index = 0; post_index < page.posts.length; post_index++) {
                            if (page.posts[post_index]._id === post_to_find._id) {
                                return [page_index, post_index];
                            }
                        }
                    }
                },
                allPosts: function () {
                    var posts = self.pages.map(function(page) {
                        return page.posts.map(function(post) {
                            return post;
                        });
                    });
                    // flatten array
                    var merged = [];
                    return merged.concat.apply(merged, posts);
                },
                addPost: function(posts) {
                    var all_posts = self.allPosts();
                    if (!angular.isArray(posts)) {
                        posts = [posts];
                    }
                    // for every post, check if exist before or add it
                    posts.forEach(function(post) {
                        if (!angular.isDefined(self.getPostPageIndexes(post))) {
                            all_posts.push(post);
                        }
                    });
                    // and recreate pages
                    createPagesWithPosts(all_posts);
                    // update date
                    self.updateLatestDates(all_posts);
                },
                removePost: function(post_to_remove) {
                    var indexes = self.getPostPageIndexes(post_to_remove);
                    if (angular.isDefined(post_to_remove)) {
                        var page_index = indexes[0];
                        var post_index = indexes[1];
                        self.pages[page_index].posts.splice(post_index, 1);
                        createPagesWithPosts(self.allPosts());
                    }
                },
                count: function() {
                    return self.pages.reduce(function(previous_value, current_value) {
                        return previous_value + current_value.posts.length;
                    }, 0);
                }
            });
        }

        /**
         * Represent a page of posts
         */
        function Page(posts) {
            return {
                posts: posts || [],
                addPost: function(post) {this.posts.push(post);}
            };
        }

        // return the Pages Manager constructor
        return PagesManager;
    }

    angular.module('liveblog-embed')
        .factory('PagesManager', PagesManagerFactory);

})(angular);
