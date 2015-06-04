(function(angular) {
    'use strict';

    var blog_id = window.LB_BLOG_ID;
    var api_hostname = window.LB_API_HOST;

    Blogs.$inject = ['$resource'];
    function Blogs($resource) {
        return $resource(api_hostname + 'api/client_blogs/:blogId', {blogId: blog_id});
    }

    Posts.$inject = ['$resource'];
    function Posts($resource) {
        return $resource(api_hostname + 'api/client_blogs/:blogId/posts', {blogId: blog_id}, {
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
    }

    angular.module('liveblog-embed')
        .service('posts', Posts)
        .service('blogs', Blogs);

})(angular);
