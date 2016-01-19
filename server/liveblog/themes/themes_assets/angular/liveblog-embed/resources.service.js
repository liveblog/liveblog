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
            'get': {
                method:'GET',
                cache: CacheFactory.get('blogsCache'),
                transformResponse: function(blog) {
                    blog = angular.fromJson(blog);
                    var srcset = '';
                    angular.forEach(blog.picture.renditions, function(value) {
                        srcset += ', ' + value.href + ' ' + value.width + 'w';
                    });
                    blog.picture_srcset = srcset.substring(2);
                    return blog;
                }
            }
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
            } else if(obj.original_creator !== "" && obj.original_creator !== 'None'){
                users.get({userId: obj.original_creator}, function(user) {
                    obj.original_creator = user._items? user._items[0] : user;
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
                        post.mainItem = _completeUser(post.groups[1].refs[0].item);
                        post.comments = _.reduce(post.groups[1].refs, function(is, val) {
                            return is || _.isUndefined(val.item.name);
                        }, false);
                        // check if `fullDetails` flag is needed
                        // comments items set falg to true.
                        post.fullDetails = post.comments;
                        // special cases for comments.
                        post.showUpdate = (post._updated !== post.published_date) && 
                                           !post.comments && (post.mainItem.item_type !== 'comment');

                        // add all the items directly in a `items` property
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
