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
        function _completeUser(obj) {
            if (obj.name) {
                obj.original_creator = {display_name: obj.name};
            } else {
                users.get({userId: obj.original_creator}, function(user) {
                    obj.original_creator = user;
                });
            }
            return obj;
        }
        return $resource(config.api_host + 'api/client_blogs/:blogId/posts', {blogId: config.blog._id}, {
            get: {
                transformResponse: function(posts) {
                    // decode json
                    posts = angular.fromJson(posts);
                    posts._items.forEach(function(post) {
                        post.mainItem = post.groups[1].refs[0].item;
                        post.fullDetails = _.reduce(post.groups[1].refs, function(is, val) {
                            return is || _.isUndefined(val.item.name);
                        }, false);
                        // add all the items directly in a `items` pmainroperty
                        if (angular.isDefined(post.groups[1])) {
                            post.items = post.groups[1].refs.map(function(item) {
                                if(post.fullDetails) {
                                    _completeUser(item.item);
                                }
                                return item.item;
                            });
                        }
                        // replace the creator id by the user object
                        _completeUser(post);
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
