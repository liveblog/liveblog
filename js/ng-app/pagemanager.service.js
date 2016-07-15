'use strict';
var angular = require("angular")
  , moment = require('moment')
  , _ = require('../lodash-custom');

angular.module('liveblog-embed')
.factory('PagesManager', ['posts', '$q', 'config', PagesManagerFactory]);

function PagesManagerFactory(postsService, $q, config) {
  function PagesManager (max_results, sort, sticky) {
    var SORTS = {
      'editorial' : {order: {order: 'desc', missing:'_last', unmapped_type: 'long'}},
      'newest_first' : {published_date: {order: 'desc', missing:'_last', unmapped_type: 'long'}},
      'oldest_first' : {published_date: {order: 'asc', missing:'_last', unmapped_type: 'long'}}
    };

    var self = this;
    self.newUpdatesApplied = 0; // no of posts added with scheduled updates
    self.newUpdatesAvailable = 0; // no of posts waiting to be pushed into view
    self.pagesLoaded = 0; //no of pages added by infinite scroll or "load more" button

    /**
     * Represent a page of posts
     * @param {array} [posts=[]] - a list of post to initialize the page
     */

    function Page(posts) {
        return {
            posts: posts || [],
            addPost: function(post) {this.posts.push(post);}
        };
    }

    /**
     * Retrieve the given page of post from the api
     * @param {integer} page - The page index to retrieve (start from 1)
     * @param {integer} [max_results=self.maxResults] - The maximum number of results to retrieve
     * @returns {promise}
     */
    function retrievePage(page, max_results) {
        // set request parameters{term: {highlight: true}},
        var query = {
            filtered: {filter: {
                and: [
                    {term: {'sticky': sticky}},
                    {term: {post_status: 'open'}},
                    {not: {term: {deleted: true}}}
                ]
            }}}

        if (self.highlight) {
            query.filtered.filter.and.push({
                term: {highlight: true}
            })
        }

        var posts_criteria = {
            source: {
                query: query,
                sort: [SORTS[self.sort]]
            },
            page: page,
            max_results: max_results || self.maxResults
        };
        
        return postsService.get(posts_criteria).$promise.then(function(data) {
            // update posts meta data (used to know the total number of posts and pages)
            self.meta = data._meta;
            return data;
        });
    }

    /**
     * Filter the posts in embed by their highlight attribute
     * @param {boolean} highlight - The value of the field (true or false)
     * @returns {promise}
     */
    function changeHighlight(highlight) {
        self.highlight = highlight;
        self.pages = [];
        return fetchNewPage();
    }

    /**
     * Change the order in the future posts request, remove exising post and load a new page
     * @param {string} sort_name - The name of the new order (see self.SORTS)
     * @returns {promise}
     */
    function changeOrder(sort_name) {
        self.sort = sort_name;
        self.pages = [];

        resetPagination();
        return fetchNewPage();
    }

    /**
     * Getter or Setter the order in the future posts request
     * Gets the order current used.
     */
    function order(sort_name) {
        if(sort_name) {
            self.sort = sort_name;
        } else {
            return self.sort;
        }
    }

    /**
     * Fetch a new page of posts and add it to the Pages Manager.
     * @returns {promise}
     */
    function fetchNewPage() {
        var promise = $q.when();

        // for the first time, retrieve the updates just to know the latest update date
        if (self.pages.length === 0) {
            promise = self.retrieveUpdate().then(function(updates) {
                updateLatestDates(updates._items);
            });
        }

        return promise.then(function() {
            var page_boundaries = checkPageBoundary();
            self.pagesLoaded += (1 + page_boundaries); // increase the number of pages loaded
            return loadPage(self.pagesLoaded);
        });
    }

    /**
     * Retrieve all the updates since the latest updated date
     * @param {boolean} [should_apply_updates=false] - By default, will auto-apply all updates to the posts list
     * @param {boolean} [should_apply_edits=true] - By default, will auto-apply edits and deletes made to posts
     * @returns {promise}
     */

    function retrieveUpdate(auto_updates, auto_edits) {
        var auto_apply_updates = auto_updates === true
          , auto_apply_edits = auto_edits === true
          
          , date = self.latestUpdatedDate
            ? self.latestUpdatedDate.utc().format()
            : undefined

          , posts_criteria = {
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
            // if
            // - there is no other page
            // - or if we don't give a latest update date (b/c we look after the meta or the latest date)
            // = then we return the first page of result
            if (meta.total <= meta.max_results * meta.page || !angular.isDefined(date)) {
                return updates;
            // Otherwise we ask page after page and concatenate them in the response
            } else {
                var promises = [];
                for (var i = meta.page + 1; i <= Math.floor(meta.total / meta.max_results) + 1; i++) {
                    posts_criteria.page = i;
                    promises.push(postsService.get(posts_criteria).$promise);
                }
                return $q.all(promises).then(function(updates_pages) {
                    return angular.extend({}, updates_pages[0], {
                        _items: [].concat.apply([], updates_pages.map(function(update) {return update._items;})),
                        _meta: angular.extend(meta, {max_results: meta.max_results * updates_pages.length})
                    });
                });
            }
        })

        // Apply updates now?
        .then(function(updates) {
            if (auto_apply_edits && !auto_apply_updates) {
                var filtered_updates = applyUpdates(updates._items, {
                    only_edits: true // We update edits, deletes
                });

                updates._items = filtered_updates ? filtered_updates : [];
                return updates;
            }

            if (auto_apply_updates) {
                applyUpdates(updates._items);
            }

            if (self.pages.length !== 0) {
                self.newUpdatesAvailable = countNewPosts(updates._items);
            }

            return updates; // untouched timestamps
        });
    }

    /**
     * Apply the given updates to the posts list
     * @param {array} updates - List of updated posts
     */
    function applyUpdates(updates, opts) {
        var new_posts = []
          , opts = angular.isDefined(opts) ? opts : {}
          , only_edits = opts.hasOwnProperty("only_edits") && opts.only_edits === true;

        updates.forEach(function(post) {

            var existing_post_indexes = getPostPageIndexes(post)
            if (angular.isDefined(existing_post_indexes)) { // post already in the list
                if (post.deleted) { // post deleted
                    removePost(post);
                }

                else {
                    // post either edited or not to be shown (but not deleted?)
                    if (post.post_status !== 'open' || post.sticky !== sticky || (self.highlight && !post.highlight)) {
                       removePost(post); // post was deleted
                    }

                    else {
                        // post was edited
                        self.pages[existing_post_indexes[0]].posts[existing_post_indexes[1]] = post;
                        createPagesWithPosts(self.allPosts(), true);
                   }
                }
            }

            else {
                // post was just created
                if (!post.deleted && post.post_status === 'open' && post.sticky === sticky) {
                    if (only_edits) new_posts.push(post); // If we want to prompt the user for new posts                    
                    else {
                        addPost(post); // auto-apply new post
                        self.newUpdatesApplied++; 
                    }
                }
            }
        });

        self.newUpdatesAvailable = 0; // reset the number of new posts available
        if (new_posts.length) return new_posts; // returned to newPosts buffer in timeline
        updateLatestDates(updates); // alternatively just update the viewmodel timestamps
    }

    /**
     * Update the latest update date by using the given posts
     * @param {array} posts - List of posts
     */
    function updateLatestDates(posts) {
        var date;
        posts.forEach(function(post) {
            date = moment(post._updated);
            if (angular.isDefined(self.latestUpdatedDate)) {
                if (self.latestUpdatedDate.diff(date) < 0) {
                    self.latestUpdatedDate = date;
                }
            } else {
                self.latestUpdatedDate = date;
            }
        });
    }

    /**
     * Recreate the pages from the given posts
     * @param {array} [posts=self.allPosts()] - List of posts
     */

    function createPagesWithPosts(posts, resetPages) {
        posts = posts || self.allPosts();
        if (resetPages) self.pages = [];
        
        // respect the order
        var sort_by = Object.keys(SORTS[self.sort])[0];
        var order_by = SORTS[self.sort][sort_by].order;
        posts = _.orderBy(posts, sort_by, order_by);

        var page;
        
        posts.forEach(function(post, index) {
            if (index % self.maxResults === 0) {
                page = new Page();
            }

            page.addPost(post);
            if (page.posts.length === self.maxResults) {
                addPage(page);
                page = undefined;
            }
        });

        if (angular.isDefined(page)) {
            addPage(page);
        }
    }

    /**
     * Load the content of the given page
     * @param {integer} page - index of the desired page
     * @returns {promise}
     */

    function loadPage(page) {
        page = page || self.pages.length;

        return retrievePage(page).then(function(posts) {
            // check for dupes (until we make pagination with "startIndex")
            var new_posts = posts._items.filter(function(post) {
                return !postExists(post)
            });

            createPagesWithPosts(new_posts, false);
            return posts;
        });
    }

    /**
     * Check if a post is already present in viewmodel
     * @param {post} post - any given post
     * @returns {bool}
     */

    function postExists(post) {
        var postIndex = getPostPageIndexes(post);
        return angular.isDefined(postIndex)
    }

    /**
     * Resets the helper vars keeping
     * track of loaded posts and the like.
     */

    function resetPagination() {
        self.newUpdatesApplied = self.newUpdatesAvailable = self.pagesLoaded = 0;
        return true
    }

    /**
     * Returns the page index and the post index of the given post in the local pages
     * @param {Post} post_to_find - post to find in the pages
     * @returns {array|undefined} - [page_index, post_index]
     */

    function getPostPageIndexes(post_to_find){
        var page;
        for (var page_index = 0; page_index < self.pages.length; page_index++) {
            page = self.pages[page_index];
            for (var post_index = 0; post_index < page.posts.length; post_index++) {
                if (page.posts[post_index]._id === post_to_find._id) {
                    return [page_index, post_index];
                }
            }
        }
    }

    /**
     * Add a post or a list of posts to the local pages
     * @param {Post|array<Post>} posts - posts to be added to the pages
     */

    function addPost(posts) {
        var all_posts = self.allPosts();
        if (!angular.isArray(posts)) {
            posts = [posts];
        }

        // for every post, check if exist before or add it
        posts.forEach(function(post) {
            if (!postExists(post)) {
                all_posts.push(post);
            }
        });
        // and recreate pages
        createPagesWithPosts(all_posts, true);
        // update date
        updateLatestDates(all_posts);
    }

    /**
     * Remove a post in the local pages
     * @param {Post} post_to_remove - posts to be removed from the pages
     */

    function removePost(post_to_remove) {
        var indexes = getPostPageIndexes(post_to_remove);
        if (angular.isDefined(post_to_remove)) {
            var page_index = indexes[0];
            var post_index = indexes[1];
            self.pages[page_index].posts.splice(post_index, 1);
            createPagesWithPosts(self.allPosts(), true);
        }
    }

    /**
     * Check to see if we need to require a higher page number
     * @returns {integer} of page boundaries crossed by the sum of posts
     * loaded and available to be loaded after the initial render.
     */
     
    function checkPageBoundary() {
        var shift = self.newUpdatesApplied + self.newUpdatesAvailable; // if number of new posts since the last pagination equals the items per page
        self.newUpdatesAvailable = self.newUpdatesApplied = 0; // reset the counters after new page load

        return (shift % self.maxResults === 0)
            ? Math.floor(shift / self.maxResults) : 0; // increase page number?
    }

    /**
     * Add the given page to the Page Manager
     * @param {Page} page - a page instance
     */

    function addPage(page) {
        self.pages.push(page);
    }

    /**
     * Count the number of new posts 
     * to help the pagination process
     * @param {array} updates - a list of posts
     * @returns {integer}
     */

    function countNewPosts(updates) {
        function isNewPost(post) {
            if (postExists(post)) return; // return early if post exists
            if (!post.deleted && post.post_status === 'open' && post.sticky === sticky) {
                return true
            }
        }
        
        var new_posts = updates.reduce(function(prev, curr) {
            return prev + isNewPost(curr) 
        }, false)

        return new_posts;
    }

    /**
     * Returns the number of posts in the local pages
     * @returns {integer}
     */

    function countTotalPosts() {
        return self.pages.reduce(function(prev, curr) {
            return prev + curr.posts.length;
        }, 0);
    }

    /**
     * Returns an array of all available posts
     * @returns {array}
     */

    function allPosts() {
        var posts = self.pages.map(function(page) {
            return page.posts.map(function(post) {
                return post;
            });
        });

        // flatten array
        var merged = [];
        return merged.concat.apply(merged, posts);
    }

    angular.extend(self, {
        /**
         * List of page instances
         */
        pages: [],
        /**
         * Represent the meta data of posts (total number for instance)
         */
        meta: {},
        /**
         * Set the initial order (see self.SORTS)
         */
        sort: sort || config.settings.postOrder,
        /**
         * Filter by post's highlight field
         */
        changeHighlight: changeHighlight,
        /**
         * Change the order in the future posts request, remove exising post and load a new page
         */
        changeOrder: changeOrder,
        /**
         * Setter or Getter the order in the future posts request.
         */
        order: order,
        /**
         * Number of results per page
         */
        maxResults: max_results || config.settings.postsPerPage,
        /**
         * Latest updated date. Used for retrieving updates since this date.
         */
        latestUpdatedDate: undefined,
        /**
         * Fetch a new page of posts
         */
        fetchNewPage: fetchNewPage,
        /**
         * Return the latest available updates
         */
        retrieveUpdate: retrieveUpdate,
        /**
         * Apply the given updates to the posts list
         */
        applyUpdates: applyUpdates,
        /**
         * Return all the posts from the local pages
         */
        allPosts: allPosts
    });
  }

  // return the Pages Manager constructor
  return PagesManager;
}

