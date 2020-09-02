import { IFilters } from './types';

const pagesManagerFactory = (postsService, $q, _, moment, instagramService) => {
    function PagesManager(
        blogId: string, status: string,
        maxResults: number, sort: string,
        sticky: boolean, highlight: boolean, noSynd: boolean) { // eslint-disable-line padded-blocks

        const SORTS = {
            editorial: { order: { order: 'desc', missing: '_last', unmapped_type: 'long' } },
            updated_first: { _updated: { order: 'desc', missing: '_last', unmapped_type: 'long' } },
            newest_first: { _created: { order: 'desc', missing: '_last', unmapped_type: 'long' } },
            oldest_first: { _created: { order: 'asc', missing: '_last', unmapped_type: 'long' } },
        };
        const self = this;

        /**
         * Represent a page of posts
         * @param {array} [posts=[]] - a list of post to initialize the page
         */
        class Page {
            posts: Array<any>;

            constructor(posts = []) {
                this.posts = posts;
            }

            addPost = (post) => {
                this.posts.push(post);
            }
        }

        /**
         * Retrieve the given page of post from the api
         * @param {integer} page - The page index to retrieve (start from 1)
         * @param {integer} [max_results=self.maxResults] - The maximum number of results to retrieve
         * @returns {promise}
         */
        const retrievePage = (page, maxResultsInner?) => {
            const options: IFilters = { status: self.status, authors: self.authors };
            // only care about the sticky status if post if open otherwise show them all together
            // @TODO refactor when refactoring the page manager

            if (self.status === 'open') {
                options.sticky = sticky;
            }

            if (noSynd) {
                options.noSyndication = true;
            }

            // only care about the highlight status if it is set to true
            if (self.highlight) {
                options.highlight = self.highlight;
            }

            return postsService.getPosts(self.blogId, options, maxResultsInner || self.maxResults, page)
                .then((data) => {
                    // update posts meta data (used to know the total number of posts and pages)
                    self.meta = data._meta;
                    return data;
                });
        };

        /**
         * Filter the posts in timeline by their highlight attribute
         * @param {boolean} highlight - The value of the field (true or false)
         * @returns {promise}
         */
        const changeHighlight = (highlightParam: boolean) => {
            self.highlight = highlightParam;
            self.pages = [];
            return fetchNewPage();
        };

        /**
         * Change the order in the future posts request, remove exising post and load a new page
         * @param {string} sortName - The name of the new order (see self.SORTS)
         * @returns {promise}
         */
        const changeOrder = (sortName: string) => {
            self.sort = sortName;
            self.pages = [];
            return fetchNewPage();
        };

        /**
         * Filter by author ids.
         * @param {array} authors - The list of ids to filter with
         * @returns {promise}
         */
        const setAuthors = (authors: Array<any>) => {
            self.authors = authors;
            self.pages = [];
            return fetchNewPage();
        };

        /**
         * Fetch a new page of posts and add it to the Pages Manager.
         * @returns {promise}
         */
        const fetchNewPage = () => {
            let promise = $q.when();
            // for the first time, retrieve the updates just to know the latest update date

            if (self.pages.length === 0) {
                promise = self.retrieveUpdate().then((updates) => {
                    updateLatestDates(updates._items);
                });
            }
            return promise.then(() => loadPage(self.pages.length + 1));
        };

        /**
         * Retrieve all the updates since the latest updated date
         * @param {boolean} [should_apply_updates=false] - If true, will apply the updates into the posts list
         * @returns {promise}
         */
        const retrieveUpdate = (shouldApplyUpdates) => {
            const date = self.latestUpdatedDate ? self.latestUpdatedDate.utc().format() : undefined;
            let page = 1;

            return postsService.getPosts(self.blogId, { updatedAfter: date, excludeDeleted: false }, undefined, page)
                .then((updates) => {
                    const meta = updates._meta;
                    // if
                    // - there is no other page
                    // - or if we don't give a latest update date (b/c we look after the meta or the latest date)
                    // = then we return the first page of result

                    if (meta.total <= meta.max_results * meta.page || !angular.isDefined(date)) {
                        return updates;
                        // Otherwise we ask page after page and concatenate them in the response
                    }

                    const promises = [];

                    for (let i = meta.page + 1; i <= Math.floor(meta.total / meta.max_results) + 1; i++) {
                        page = i;
                        promises.push(postsService.getPosts(
                            self.blogId,
                            { updatedAfter: date, excludeDeleted: false },
                            undefined,
                            page
                        ));
                    }
                    return $q.all(promises).then((updatesPages) => angular.extend({}, updatesPages[0], {
                        _items: [].concat(...updatesPages.map((update) => update._items)),
                        _meta: angular.extend(meta, { max_results: meta.max_results * updatesPages.length }),
                    }));
                })
                // Apply the update if needed
                .then((updates) => {
                    if (shouldApplyUpdates) {
                        applyUpdates(updates._items);
                    }
                    return updates;
                });
        };

        /**
         * Apply the given updates to the posts list
         * @param {array} updates - List of updated posts
         */
        const applyUpdates = (updates) => {
            // eslint-disable-next-line
            updates.forEach((post) => {
                const existingPostIndexes = getPostPageIndexes(post);
                const sameStatus = self.status === post.post_status;
                const postSticky = post.sticky === sticky;
                const statusIsOpen = self.status === 'open';

                if (angular.isDefined(existingPostIndexes)) {
                    // post already in the list
                    // tslint:disable-next-line:curly
                    if (post.deleted) removePost(post);

                    if (post.post_status !== self.status || statusIsOpen
                        && post.sticky !== sticky || self.highlight && !post.lb_highlight) {
                        removePost(post);
                    } else {
                        updatePost(post);
                        createPagesWithPosts(self.allPosts(), true);
                    }
                } else if (!post.deleted && sameStatus && (self.status !== 'open' || postSticky)) {
                    // post doesn't exist in the list
                    addPost(post);
                }
            });
            // update date
            updateLatestDates(updates);
        };

        /**
         * Replace the old post with the new updated post.
         * Compare post ids instead of relying on indexes.
         * This method does not return anything and modifies directly self.pages
         */
        const updatePost = (postToUpdate) => {
            self.pages.forEach((page, pageIndex) => {
                page.posts.forEach((post, postIndex) => {
                    if (post._id === postToUpdate._id) {
                        self.pages[pageIndex].posts[postIndex] = postToUpdate;
                    }
                });
            });
        };

        /**
         * Receives edit flags information, loop over them and find the right
         * posts to update the data, then triggers callback
         */
        const updatePostFlag = (postId, flag, cb) => {
            self.pages.forEach((page, pageIndex) => {
                page.posts.forEach((post, postIndex) => {
                    if (post._id === postId) {
                        self.pages[pageIndex].posts[postIndex]['edit_flag'] = flag;
                        cb(self.pages[pageIndex].posts[postIndex]);
                    }
                });
            });
        };

        /**
         * Update the latest update date by using the given posts
         * @param {array} posts - List of posts
         */
        const updateLatestDates = (posts) => {
            let date;

            posts.forEach((post) => {
                date = moment(post._updated);
                if (angular.isDefined(self.latestUpdatedDate)) {
                    if (self.latestUpdatedDate.diff(date) < 0) {
                        self.latestUpdatedDate = date;
                    }
                } else {
                    self.latestUpdatedDate = date;
                }
            });
        };

        /**
         * Recreate the pages from the given posts
         * @param {array} [posts=self.allPosts()] - List of posts
         * @param {boolean} resetPages - Clear the array of pages or not
         */
        const createPagesWithPosts = (postsParams, resetPages) => {
            let posts = postsParams || self.allPosts();

            if (resetPages) {
                self.pages = [];
            }
            // respect the order
            const sortBy = Object.keys(SORTS[self.sort])[0];
            const orderBy = SORTS[self.sort][sortBy].order;

            posts = _.sortByOrder(posts, sortBy, orderBy);
            let page;
            let processInstagram = false;

            posts.forEach((post, index) => {
                if (index % self.maxResults === 0) {
                    page = new Page();
                }
                page.addPost(post);
                if (page.posts.length === self.maxResults) {
                    addPage(page);
                    page = undefined;
                }

                processInstagram = instagramService.postHasEmbed(post.items);
            });
            if (angular.isDefined(page)) {
                addPage(page);
            }
            if (processInstagram) {
                instagramService.processEmbeds();
            }
        };

        /**
         * Load the content of the given page
         * @param {interger} page - index of the desired page
         * @returns {promise}
         */
        const loadPage = (page) => {
            return retrievePage(page || self.pages.length).then((posts) => {
                createPagesWithPosts(posts._items, false);
                return posts;
            });
        };

        /**
         * Returns the page index and the post index of the given post in the local pages
         * @param {Post} postToFind - post to find in the pages
         * @returns {array|undefined} - [pageIndex, postIndex]
         */
        const getPostPageIndexes = (postToFind) => {
            if (!postToFind) {
                return [0, 0];
            }
            let page;

            for (let pageIndex = 0; pageIndex < self.pages.length; pageIndex++) {
                page = self.pages[pageIndex];
                for (let postIndex = 0; postIndex < page.posts.length; postIndex++) {
                    if (page.posts[postIndex]._id === postToFind._id) {
                        return [pageIndex, postIndex];
                    }
                }
            }
        };

        /**
         * Add a post or a list of posts to the local pages
         * @param {Post|array<Post>} postsParams - posts to be added to the pages
         */
        const addPost = (postsParams) => {
            const allPosts = self.allPosts();
            const posts = angular.isArray(postsParams) ? postsParams : [postsParams];
            // for every post, check if exist before or add it

            posts.forEach((post) => {
                if (!angular.isDefined(getPostPageIndexes(post))) {
                    allPosts.push(post);
                }
            });

            // and recreate pages
            createPagesWithPosts(allPosts, true);
            // update date
            updateLatestDates(allPosts);
        };

        /**
         * Remove a post in the local pages
         * @param {Post} postToRemove - posts to be removed from the pages
         */
        const removePost = (postToRemove) => {
            const indexes = getPostPageIndexes(postToRemove);

            if (angular.isDefined(postToRemove)) {
                const pageIndex = indexes[0];
                const postIndex = indexes[1];

                self.pages[pageIndex].posts.splice(postIndex, 1);

                createPagesWithPosts(self.allPosts(), true);
            }
        };

        /**
         * Add the given page to the Page Manager
         * @param {Page} page - a page instance
         */
        const addPage = (page) => {
            self.pages.push(page);
        };

        /**
         * Returns the number of posts in the local pages
         * @returns {integer}
         */
        const count = () => {
            return self.pages.reduce((previousValue, currentValue) => previousValue + currentValue.posts.length, 0);
        };

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
            sort: sort || 'editorial',
            blogId: blogId,
            status: status,
            /**
             * Filter by post's highlight field
             */
            highlight: highlight,
            sticky: sticky,
            changeHighlight: changeHighlight,
            /**
             * Change the order in the future posts request, remove exising post and load a new page
             */
            changeOrder: changeOrder,
            /**
             * Initial authors filter
             */
            authors: [],
            /**
             * Filter by author ids
             */
            setAuthors: setAuthors,
            /**
             * Number of results per page
             */
            maxResults: maxResults,
            /**
             *
             * Remove a post from the page
             */
            removePost: removePost,
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
             * Return all the posts from the local pages
             */
            allPosts: () => {
                // flatten array
                return [].concat(...self.pages.map((page) => page.posts));
            },
            /**
             * Updates flag information, look for the right post and updates it
             */
            updatePostFlag: updatePostFlag,
            /**
             * Returns the number of posts in the local pages
             */
            count: count,
        });
    }

    // return the Pages Manager constructor
    return PagesManager;
};

pagesManagerFactory.$inject = ['postsService', '$q', 'lodash', 'moment', 'instagramService'];

export default pagesManagerFactory;
