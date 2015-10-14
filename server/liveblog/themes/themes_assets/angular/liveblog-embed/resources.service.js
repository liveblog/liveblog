(function(angular) {
    'use strict';

    Blogs.$inject = ['$resource', 'config'];
    function Blogs($resource, config) {
        return $resource(config.api_host + 'api/client_blogs/:blogId', {blogId: config.blog._id});
    }

    Users.$inject = ['$resource', 'config'];
    function Users($resource, config) {
        return $resource(config.api_host + 'api/client_users/:userId');
    }

    Posts.$inject = ['$resource', 'config', 'users'];
    function Posts($resource, config, users) {
        return $resource(config.api_host + 'api/client_blogs/:blogId/posts', {blogId: config.blog._id}, {
            get: {
                transformResponse: function(posts) {
                    // decode json
                    posts = angular.fromJson(posts);
                    posts._items.forEach(function(post) {
                        // add all the items directly in a `items` property
                        if (angular.isDefined(post.groups[1])) {
                            post.items = post.groups[1].refs.map(function(item) {return item.item;});
                        }
                        // replace the creator id by the user object
                        users.get({userId: post.original_creator}, function(user) {
                            post.original_creator = user;
                        });
                    });
                    return posts;
                }
            }
        });
    }

    angular.module('liveblog-embed')
        .service('users', Users)
        .service('posts', Posts)
        .service('blogs', Blogs);

})(angular);
