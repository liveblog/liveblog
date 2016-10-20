(function(angular) {
    'use strict';

    BlogListCtrl.$inject = ['config', 'blogList', '$window'];
    function BlogListCtrl(config, blogListService, $window) {
        var vm = this;

        // define view model
        angular.extend(vm, {
            loading: true,
            blogs: [],
            fetchBlogs: function() {
                var blogs_list_criteria = {
                    //sort: [("versioncreated", -1)],
                    source: {
                        query: {filtered: {filter: {term:
                            {"blog_status":"open"}
                        }}}
                    }
                };
                blogListService.get(blogs_list_criteria).$promise.then(function(data) {
                    vm.blogs = data;
                });
            },
            openBlog: function(blog) {
                // for debug purpose
                if (!blog.public_url && config.debug) {
                    $window.location = 'http://localhost:5000/embed/' + blog._id;
                } else if(blog.public_url) {
                    $window.location = blog.public_url;
                }
            }
        });
        vm.fetchBlogs();
    }

    BlogsList.$inject = ['$resource', 'config'];
    function BlogsList($resource, config) {
        return $resource(config.api_host + 'api/client_blogs',{}, {
            'get': {
                method:'GET',
                transformResponse: function(blogs) {
                    blogs = angular.fromJson(blogs);
                    // Transformation for blog image renditions.
                    // angular.forEach(function(blog) {
                    //     blog = transformBlog(blog);
                    // })
                    return blogs;
                }
            }
        });
    }

    angular.module('bloglist', ['ngResource', 'ngRoute', 'gettext'])
        .service('blogList', BlogsList)
        .constant('config', {
            api_host:  window.LB.api_host,
            assets_root: window.LB.assets_root
        }).controller('BlogListCtrl',BlogListCtrl)
        .config(['$routeProvider',
              function($routeProvider) {
                    $routeProvider.
                      when('/', {
                              templateUrl: '/blogslist_assets/template.html',
                              controller: 'BlogListCtrl',
                              'controllerAs': 'bl'
                      })
        }]).filter('htmlToPlaintext', function() {
            return function(text) {
                //replace paragraph and list item with an empty space
                var retValue = text ? String(text).replace(/<(p|li)>/g, ' ') : '';
                retValue = retValue.replace(/<[^>]+>/gm, '');
                return retValue.replace(/(&nbsp;)/gm, '');
            };
          }
        ).filter('username', function() {
            return function(user) {
                return user ? user.display_name || user.username : null;
            };
        }).filter('reldate', function reldateFactory() {
            return function reldate(date) {
                return moment(date).fromNow();
            };
        });
})(angular);