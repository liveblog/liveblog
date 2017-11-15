BlogListController.$inject = [
    '$scope',
    '$location',
    '$http',
    'api',
    'gettext',
    'upload',
    'isArchivedFilterSelected',
    '$q',
    'blogSecurityService',
    'notify',
    'config',
    'urls',
    'moment'
];

export default function BlogListController(
    $scope,
    $location,
    $http,
    api,
    gettext,
    upload,
    isArchivedFilterSelected,
    $q,
    blogSecurityService,
    notify,
    config,
    urls,
    moment
) {
    $scope.maxResults = 25;
    $scope.states = [
        {name: 'active', code: 'open', text: gettext('Active blogs')},
        {name: 'archived', code: 'closed', text: gettext('Archived blogs')}
    ];
    $scope.activeState = isArchivedFilterSelected ? $scope.states[1] : $scope.states[0];
    $scope.creationStep = 'Details';
    $scope.requestAccessMessage = gettext('Click to request access');
    $scope.blogMembers = [];
    $scope.changeState = function(state) {
        $scope.activeState = state;
        $location.path('/liveblog/' + state.name);
        fetchBlogs();
    };
    $scope.modalActive = false;

    $scope.mailto = 'mailto:upgrade@liveblog.pro?subject=' +
        encodeURIComponent(location.hostname) +
        ' ' +
        config.subscriptionLevel;

    function clearCreateBlogForm() {
        $scope.preview = {};
        $scope.progress = {width: 0};
        $scope.newBlog = {
            title: '',
            description: ''
        };
        $scope.newBlogError = '';
        $scope.creationStep = 'Details';
        $scope.blogMembers = [];
    }
    clearCreateBlogForm();
    $scope.isAdmin = blogSecurityService.isAdmin;
    $scope.isUserAllowedToCreateABlog = blogSecurityService.canCreateABlog;
    $scope.isUserAllowedToOpenBlog = blogSecurityService.canAccessBlog;
    // blog list embed code.
    function fetchBloglistEmbed() {
        var criteria = {source: {
            query: {filtered: {filter: {term: {key: 'blogslist'}}}}
        }};

        api.blogslist.query(criteria, false).then((embed) => {
            var url;

            if (embed._items.length) {
                url = embed._items[0].value;
            } else if (config.debug) {
                url = 'http://localhost:5000/blogslist_embed';
            }
            if (url) {
                $scope.bloglistEmbed = '<iframe id="liveblog-bloglist" width="100%" ' +
                    'scrolling="no" src="' + url + '" frameborder="0" allowfullscreen></iframe>';
            }
        });
    }
    $scope.cancelEmbed = function() {
        $scope.embedModal = false;
    };
    $scope.openEmbed = function() {
        fetchBloglistEmbed();
        $scope.embedModal = true;
    };

    $scope.cancelCreate = function() {
        clearCreateBlogForm();
        $scope.newBlogModalActive = false;
    };

    $scope.cancelUpgrade = function() {
        $scope.embedUpgrade = false;
    };

    $scope.openNewBlog = function() {
        blogSecurityService
            .showUpgradeModal()
            .then((showUpgradeModal) => {
                if (showUpgradeModal) {
                    $scope.embedUpgrade = true;
                } else {
                    $scope.newBlogModalActive = true;
                }
            });
    };

    $scope.creationInProcess = false;

    $scope.createBlog = function() {
        $scope.creationInProcess = true;

        var members = _.map($scope.blogMembers, (obj) => ({user: obj._id}));

        // Upload image only if we have a valid one chosen
        var promise = $scope.preview.url ? $scope.upload($scope.preview) : $q.when();

        return promise.then(() => api.blogs
            .save({
                title: $scope.newBlog.title,
                description: $scope.newBlog.description,
                picture_url: $scope.newBlog.picture_url,
                picture: $scope.newBlog.picture,
                picture_renditions: $scope.newBlog.picture_renditions,
                members: members
            })
            .then((blog) => {
                $scope.creationInProcess = false;
                $scope.edit(blog);
            }, (error) => {
                $scope.creationInProcess = false;
                // Error handler
                $scope.newBlogError = gettext('Something went wrong. Please try again later');
            }));
    };

    $scope.upload = function(config) {
        var form = {};

        if (config.img) {
            form.media = config.img;
        } else if (config.url) {
            form.URL = config.url;
        }

        if (form.hasOwnProperty('media') || form.hasOwnProperty('url')) {
            // return a promise of upload which will call the success/error callback
            return urls.resource('archive').then((uploadUrl) => upload.start({
                method: 'POST',
                url: uploadUrl,
                data: form
            })
            .then((response) => {
                if (response.data._status === 'ERR') {
                    return;
                }
                var pictureUrl = response.data.renditions.viewImage.href;

                $scope.newBlog.picture_url = pictureUrl;
                $scope.newBlog.picture = response.data._id;
                $scope.newBlog.picture_renditions = response.data.renditions;
            }, (error) => {
                notify.error(
                    error.statusText !== '' ? error.statusText : gettext('There was a problem with your upload')
                );
            }, (progress) => {
                $scope.progress.width = Math.round(progress.loaded / progress.total * 100.0);
            }));
        }
    };

    $scope.remove = function(blog) {
        _.remove($scope.blogs._items, blog);
    };

    $scope.edit = function(blog) {
        $location.path('/liveblog/edit/' + blog._id);
    };

    $scope.openAccessRequest = function(blog) {
        $scope.accessRequestedTo = blog;
        $scope.showBlogAccessModal = true;

        if (config.subscriptionLevel
        && ['solo', 'team'].indexOf(config.subscriptionLevel) !== -1) {
            $scope.checkAccessRequestLimit(blog);
        } else {
            $scope.allowAccessRequest = true;
        }
    };

    $scope.closeAccessRequest = function() {
        $scope.accessRequestedTo = false;
        $scope.showBlogAccessModal = false;
    };

    $scope.checkAccessRequestLimit = function(blog) {
        $scope.allowAccessRequest = false;

        var theoricalMembers = [];

        if (blog.members) {
            blog.members.forEach((member) => {
                if (theoricalMembers.indexOf(member.user) === -1) {
                    theoricalMembers.push(member.user);
                }
            });
        }

        $http({
            url: config.server.url + '/blogs/' + blog._id + '/request_membership',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        })
        .then((response) => {
            if (response.data._items.length > 0) {
                response.data._items.forEach((item) => {
                    if (theoricalMembers.indexOf(item._id) === -1) {
                        theoricalMembers.push(item._id);
                    }
                });
            }

            if (theoricalMembers.length < config.assignableUsers[config.subscriptionLevel]) {
                $scope.allowAccessRequest = true;
            }
        });
    };

    $scope.requestAccess = function(blog) {
        var showRequestDialog = true;

        // Check to see if the current user hasn't been accepted during this session (before refreshing)
        if (blog.members) {
            _.each(blog.members, (member) => {
                if (member.user === $scope.$root.currentUser._id) {
                    showRequestDialog = false;
                }
            });
        }

        if (showRequestDialog) {
            notify.info(gettext('Sending request'));
            api('request_membership')
                .save({blog: blog._id})
                .then(
                    (data) => {
                        notify.pop();
                        notify.info(gettext('Request sent'));
                    },
                    (data) => {
                        notify.pop();
                        var message = gettext('Something went wrong, plase try again later!');

                        if (data.data._message === 'A request has already been sent') {
                            message = gettext('A request has already been sent');
                        }
                        notify.error(message, 5000);
                    }
                );
            $scope.closeAccessRequest();
        } else {
            notify.pop();
            notify.error(gettext('You are already member of this blog\'s team'));
        }
    };

    $scope.switchTab = function(newTab) {
        $scope.creationStep = newTab;
    };

    $scope.handleKeyDown = function(event, action) {
        // prevent form submission and editor 'artifact'
        if (event.keyCode === 13) {
            event.preventDefault();
            switch (action) {
            case 'goToTeamTab':
                // We need at least a valid title from the first tab
                if ($scope.newBlog.title) {
                    $scope.switchTab('Team');
                }
                break;
            }
        }
    };

    $scope.addMember = function(user) {
        $scope.blogMembers.push(user);
    };

    $scope.removeMember = function(user) {
        $scope.blogMembers.splice($scope.blogMembers.indexOf(user), 1);
    };

    $scope.hasReachedMembersLimit = function() {
        if (!config.assignableUsers.hasOwnProperty(config.subscriptionLevel)) {
            return false;
        }

        return $scope.blogMembers.length >= config.assignableUsers[config.subscriptionLevel];
    };

    // Set grid or list view
    $scope.setBlogsView = function(blogsView) {
        if (typeof blogsView !== 'undefined') {
            $scope.blogsView = blogsView;
            localStorage.setItem('blogsView', blogsView);
        } else if (typeof localStorage.getItem('blogsView') === 'undefined'
            || localStorage.getItem('blogsView') === null) {
            $scope.blogsView = 'grid';
        } else {
            $scope.blogsView = localStorage.getItem('blogsView');
        }
    };
    $scope.setBlogsView();

    function getCriteria() {
        var params = $location.search(),
            criteria = {
                max_results: $scope.maxResults,
                embedded: {original_creator: 1},
                sort: '[("versioncreated", -1)]',
                source: {
                    query: {filtered: {filter: {term: {blog_status: $scope.activeState.code}}}}
                }
            };

        if (params.q) {
            criteria.source.query.filtered.query = {
                query_string: {
                    query: '*' + params.q + '*',
                    fields: ['title', 'description']
                }
            };
        }
        if (params.page) {
            criteria.page = parseInt(params.page, 10);
        }
        return criteria;
    }

    function fetchBlogs() {
        $scope.blogsLoading = true;
        api.blogs.query(getCriteria(), false).then((blogs) => {
            $scope.blogs = blogs;
            $scope.blogsLoading = false;
        });
    }
    // initialize bloglist embed code.
    fetchBloglistEmbed();
    // initialize blogs list
    fetchBlogs();
    // fetch when maxResults is updated from the searchbar-directive
    $scope.$watch('maxResults', fetchBlogs);
    // fetch when criteria are updated from url (searchbar-directive)
    $scope.$on('$routeUpdate', fetchBlogs);
    // Reload bloglist on membership's approval
    $scope.$on('blogs', fetchBlogs);
}
