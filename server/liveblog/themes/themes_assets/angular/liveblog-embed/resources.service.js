(function(angular) {
    'use strict';
    var CACHE_OPTIONS = {
        deleteOnExpire: 'aggressive',
        recycleFreq: 3600000, // 1h
        storageMode: 'localStorage'
    };
    Blogs.$inject = ['$resource', 'config', 'CacheFactory'];
    function Blogs($resource, config, CacheFactory) {
        if (!CacheFactory.get('blogsCache')) {
            CacheFactory.createCache('blogsCache', CACHE_OPTIONS);
        }
        return $resource(config.api_host + 'api/client_blogs/:blogId', {blogId: config.blog._id},{
            'get': { method:'GET', cache: CacheFactory.get('blogsCache')}
        });
    }

    Users.$inject = ['$resource', 'config', 'CacheFactory'];
    function Users($resource, config, CacheFactory) {
        if (!CacheFactory.get('usersCache')) {
            CacheFactory.createCache('usersCache', CACHE_OPTIONS);
        }
        return $resource(config.api_host + 'api/client_users/:userId', {'userId':'@id'}, {
            'get': { method:'GET', cache: CacheFactory.get('usersCache')}

        });
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

    Comments.$inject = ['$resource', 'config'];
    function Comments($resource, config) {
        return $resource(config.api_host + 'api/client_comments/');
    }

    Items.$inject = ['$resource', 'config'];
    function Items($resource, config) {
        return $resource(config.api_host + 'api/client_items/');
    }

    angular.module('liveblog-embed')
        .service('users', Users)
        .service('posts', Posts)
        .service('blogs', Blogs)
        .service('comments', Comments)
        .service('items', Items);

})(angular);
