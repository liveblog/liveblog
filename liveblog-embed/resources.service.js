(function(angular) {
    'use strict';
    var CACHE_OPTIONS = {
        deleteOnExpire: 'aggressive',
        recycleFreq: 600000, // 10mins
        storageMode: 'memory'
    };

    transformBlog.$inject = ['fixProtocol']
    function transformBlog(fixProtocol) {
        return function(blog) {
            if (blog.picture_url && blog.picture) {
                var srcset = '';
                angular.forEach(blog.picture.renditions, function(value) {
                    srcset += ', ' + fixProtocol(value.href) + ' ' + value.width + 'w';
                });
                blog.picture_srcset = srcset.substring(2); 
                blog.picture_url = fixProtocol(blog.picture_url);
            }
            return blog;
        }
    }

    Blogs.$inject = ['$resource', 'config', 'transformBlog'];
    function Blogs($resource, config, transformBlog) {
        return $resource(config.api_host + 'api/client_blogs/:blogId?embedded={"picture":1}', {blogId: config.blog._id},{
            'get': {
                method:'GET',
                transformResponse: function(blog) {
                    blog = angular.fromJson(blog);
                    return transformBlog(blog);
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
            if (obj.commenter) {
                obj.original_creator = {display_name: obj.commenter};
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
                        // if an item has a commenter then that post hasComments.
                        post.hasComments = _.reduce(post.groups[1].refs, function(is, val) {
                            return is || !_.isUndefined(val.item.commenter);
                        }, false);
                        // `fullDetails` is a business logic that can be compiled from other objects.
                        post.fullDetails = post.hasComments;
                        // fallback for older posts.
                        if(!post.content_updated_date) {
                            post.content_updated_date = post._updated;
                        }
                        // special cases for comments.
                        post.showUpdate = (post.content_updated_date !== post.published_date) && 
                                           !post.hasComments && (post.mainItem.item_type !== 'comment');

                        // add all the items directly in a `items` property
                        if (angular.isDefined(post.groups[1])) {
                            post.items = post.groups[1].refs.map(function(value) {
                                var item = value.item;
                                if(post.fullDetails) {
                                    _completeUser(item);
                                    item.displayDate = (item.meta && item.meta._created) || item._created;
                                } else {
                                    item.displayDate = post.published_date;
                                }
                                return item;
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
        .service('items', Items)
        .factory('transformBlog',transformBlog);

})(angular);
