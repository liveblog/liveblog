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
    });
})();
