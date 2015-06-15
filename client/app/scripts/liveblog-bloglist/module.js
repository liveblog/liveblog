(function() {
    'use strict';

    BlogListController.$inject = ['$scope', '$location', 'api', 'gettext', 'upload'];
    function BlogListController($scope, $location, api, gettext, upload) {
        $scope.maxResults = 25;

        $scope.states = [
            {code: 'open', text: gettext('Active blogs')},
            {code: 'closed', text: gettext('Archived blogs')}
        ];

        $scope.activeState = $scope.states[0];
        $scope.creationStep = 'Details';
        $scope.blogMembers = [];

        $scope.changeState = function(state) {
            $scope.activeState = state;
            fetchBlogs();
        };

        $scope.modalActive = false;

        function clearCreateBlogForm() {
            $scope.preview = {};
            $scope.progress = {width: 0};
            $scope.newBlog = {
                title: '',
                description: ''
            };
            $scope.newBlogError = '';
        }
        clearCreateBlogForm();

        $scope.cancelCreate = function() {
            clearCreateBlogForm();
            $scope.newBlogModalActive = false;
        };
        $scope.openNewBlog = function() {
            $scope.newBlogModalActive = true;
        };

        $scope.makeBlog = function(blog) {
            return api.blogs.save(blog)
                .then(function(message) {
                    clearCreateBlogForm();
                    $scope.newBlogModalActive = false;
                    fetchBlogs(getCriteria());
                }, function(error) {
                    //error handler
                    $scope.newBlogError = gettext('Something went wrong. Please try again later');
                });
        };

        $scope.createBlog = function() {
            var members = _.map($scope.blogMembers, function(obj) {
                return {user: obj._id};
            });
            if (angular.equals({}, $scope.preview)) {
               $scope.makeBlog({
                    title: $scope.newBlog.title,
                    description: $scope.newBlog.description,
                    members: members
                });
            } else {
                $scope.upload($scope.preview).then(function() {
                   $scope.makeBlog({
                        title: $scope.newBlog.title,
                        description: $scope.newBlog.description,
                        picture_url: $scope.newBlog.picture_url,
                        picture: $scope.newBlog.picture
                   });
                });
            }
        };

        $scope.upload = function(config) {
            var form = {};
            if (config.img) {
                form.media = config.img;
            } else if (config.url) {
                form.URL = config.url;
            } else {
                return;
            }
            // return a promise of upload which will call the success/error callback
            return api.upload.getUrl().then(function(url) {
                return upload.start({
                    method: 'POST',
                    url: url,
                    data: form
                })
                .then(function(response) {
                    if (response.data._status === 'ERR'){
                        return;
                    }
                    var picture_url = response.data.renditions.viewImage.href;
                    $scope.newBlog.picture_url = picture_url;
                    $scope.newBlog.picture = response.data._id;
                }, null, function(progress) {
                    $scope.progress.width = Math.round(progress.loaded / progress.total * 100.0);
                });
            });
        };

        $scope.remove = function(blog) {
            _.remove($scope.blogs._items, blog);
        };

        $scope.edit = function(blog) {
            $location.path('/liveblog/edit/' + blog._id);
        };

        $scope.switchTab = function(newTab) {
            $scope.creationStep = newTab;
        };

        $scope.addMember = function(user) {
            $scope.blogMembers.push(user);
        };

        $scope.removeMember = function(user) {
            $scope.blogMembers.splice($scope.blogMembers.indexOf(user), 1);
        };

        function getCriteria() {
            var params = $location.search(),
                criteria = {
                    max_results: $scope.maxResults,
                    embedded: {'original_creator': 1},
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
            api.blogs.query(getCriteria()).then(function(blogs) {
                $scope.blogs = blogs;
            });
        }

        // initialize blogs list
        fetchBlogs();
        // fetch when maxResults is updated from the searchbar-directive
        $scope.$watch('maxResults', fetchBlogs);
        // fetch when criteria are updated from url (searchbar-directive)
        $scope.$on('$routeUpdate', fetchBlogs);
    }

    var app = angular.module('liveblog.bloglist', []);
    app.config(['apiProvider', function(apiProvider) {
        apiProvider.api('blogs', {
            type: 'http',
            backend: {rel: 'blogs'}
        });
    }]).config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/liveblog', {
                label: gettext('Blog List'),
                controller: BlogListController,
                templateUrl: 'scripts/liveblog-bloglist/views/main.html',
                category: superdesk.MENU_MAIN
            });
    }]);
    app.filter('username', ['session', function usernameFilter(session) {
        return function getUsername(user) {
            return user ? user.display_name || user.username : null;
        };
    }]);
    app.directive('sdPlainImage', ['notify', function(notify) {
        return {
            scope: {
                src: '=',
                progressWidth: '='
            },
            link: function(scope, elem) {
                scope.$watch('src', function(src) {
                    elem.empty();
                    if (src) {
                        var img = new Image();
                        img.onload = function() {
                            scope.progressWidth = 80;

                            if (this.width < 320 || this.height < 240) {
                                scope.$apply(function() {
                                    notify.pop();
                                    notify.error(gettext('Sorry, but blog image must be at least 320x240 pixels big.'));
                                    scope.src = null;
                                    scope.progressWidth = 0;
                                });

                                return;
                            }
                            elem.append(img);
                            scope.$apply(function() {
                                scope.progressWidth = 0;
                            });
                        };
                        img.src = src;
                    }
                });
            }
        };
    }]).directive('ifBackgroundImage', function() {
        return {
            restrict: 'A',
            scope: {
                ifBackgroundImage: '@'
            },
            link: function(scope, element, attrs) {
                var url = scope.ifBackgroundImage;
                if (url) {
                    element.css({
                        'background-image': 'url(' + url + ')'
                    });
                }
            }
        };
    })
    .directive('lbUserSelectList', ['$filter', 'api', function($filter, api) {
            return {
                scope: {
                    members: '=',
                    onchoose: '&'
                },
                templateUrl: 'scripts/bower_components/superdesk/client/app/scripts/superdesk-desks/views/user-select.html',
                link: function(scope, elem, attrs) {

                    var ARROW_UP = 38, ARROW_DOWN = 40, ENTER = 13;

                    scope.selected = null;
                    scope.search = null;
                    scope.users = {};

                    var _refresh = function() {
                        scope.users = {};
                        return api('users').query({where: JSON.stringify({
                            '$or': [
                                {username: {'$regex': scope.search, '$options': '-i'}},
                                {first_name: {'$regex': scope.search, '$options': '-i'}},
                                {last_name: {'$regex': scope.search, '$options': '-i'}},
                                {email: {'$regex': scope.search, '$options': '-i'}}
                            ]
                        })})
                        .then(function(result) {
                            scope.users = result;
                            scope.users._items = _.filter(scope.users._items, function(item) {
                                var found = false;
                                _.each(scope.members, function(member) {
                                    if (member._id === item._id) {
                                        found = true;
                                    }
                                });
                                return !found;
                            });
                            scope.selected = null;
                        });
                    };
                    var refresh = _.debounce(_refresh, 1000);

                    scope.$watch('search', function() {
                        if (scope.search) {
                            refresh();
                        }
                    });

                    function getSelectedIndex() {
                        if (scope.selected) {
                            var selectedIndex = -1;
                            _.each(scope.users._items, function(item, index) {
                                if (item === scope.selected) {
                                    selectedIndex = index;
                                }
                            });
                            return selectedIndex;
                        } else {
                            return -1;
                        }
                    }

                    function previous() {
                        var selectedIndex = getSelectedIndex(),
                        previousIndex = _.max([0, selectedIndex - 1]);
                        if (selectedIndex > 0) {
                            scope.select(scope.users._items[previousIndex]);
                        }
                    }

                    function next() {
                        var selectedIndex = getSelectedIndex(),
                        nextIndex = _.min([scope.users._items.length - 1, selectedIndex + 1]);
                        scope.select(scope.users._items[nextIndex]);
                    }

                    elem.bind('keydown keypress', function(event) {
                        scope.$apply(function() {
                            switch (event.which) {
                                case ARROW_UP:
                                    event.preventDefault();
                                    previous();
                                    break;
                                case ARROW_DOWN:
                                    event.preventDefault();
                                    next();
                                    break;
                                case ENTER:
                                    event.preventDefault();
                                    if (getSelectedIndex() >= 0) {
                                        scope.choose(scope.selected);
                                    }
                                    break;
                            }
                        });
                    });

                    scope.choose = function(user) {
                        scope.onchoose({user: user});
                        scope.search = null;
                    };

                    scope.select = function(user) {
                        scope.selected = user;
                    };
                }
            };
        }]);
})();
