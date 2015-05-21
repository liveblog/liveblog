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
            if (angular.equals({}, $scope.preview)) {
               $scope.makeBlog({
                    title: $scope.newBlog.title,
                    description: $scope.newBlog.description
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

        function getCriteria() {
            var params = $location.search(),
                criteria = {
                    max_results: $scope.maxResults,
                    embedded: {'original_creator': 1},
                    sort: '[("versioncreated", -1)]',
                    q: $scope.activeState.code
                };
            if (params.q) {
                // create a dsl query (for elastic search)
                // see: http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/combining-filters.html
                var should = [];
                var terms_to_search = params.q.toLowerCase().split(' ');
                // fields we want to check
                ['description', 'title'].forEach(function(search_in) {
                    var must = [];
                    // terms we want to search
                    terms_to_search.forEach(function(term) {
                        var t = {};
                        t[search_in] = term;
                        must.push({term: t});
                    });
                    should.push({
                        'bool': {'must': must}
                    });
                });
                // add a `filter` attribute to filter from the given keywords
                criteria.filter = JSON.stringify({
                    'bool': {'should': should}
                });
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
                cords: '=',
                progressWidth: '='
            },
            link: function(scope, elem) {
                //@TODO: remove this unecesary method after fix from Petr Jasek
                var updateScope = _.throttle(function(c) {
                    scope.$apply(function() {
                        scope.cords = c;
                    });
                }, 300);

                scope.$watch('src', function(src) {
                    elem.empty();
                    if (src) {
                        var img = new Image();
                        img.onload = function() {
                            scope.progressWidth = 80;
                            if (this.width < 200 || this.height < 200) {
                                scope.$apply(function() {
                                    notify.pop();
                                    notify.error(gettext('Sorry, but picture must be at least 200x200 pixels big.'));
                                    scope.src = null;
                                    scope.progressWidth = 0;
                                });

                                return;
                            }
                            elem.append(img);
                            //@TODO: remove this unecesary calls after fix from Petr Jasek
                            updateScope({});
                            updateScope({});
                            scope.progressWidth = 0;
                        };
                        img.src = src;
                    }
                });
            }
        };
    }]);
})();
