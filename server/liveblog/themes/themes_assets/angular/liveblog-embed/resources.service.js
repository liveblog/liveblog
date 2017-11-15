(function(angular) {
    'use strict';
    var CACHE_OPTIONS = {
        deleteOnExpire: 'aggressive',
        recycleFreq: 2 * 60 * 1000, // 2 mins
        maxAge: 4 * 60 * 1000, // 4 mins
        storageMode: 'memory',
    };
    srcSet.$inject = ['fixProtocol'];
    function srcSet(fixProtocol) {
        return function(renditions) {
            var srcset = '';
            // iterate and add the image with the width value to srcset
            angular.forEach(renditions, function(value, key) {
                if(key !== 'original') {
                    srcset += ', ' + fixProtocol(value.href) + ' ' + value.width + 'w';
                }
            });
            return srcset.substring(2);
        }
    }

    thumbnailRendition.$inject = ['fixProtocol'];
    function thumbnailRendition(fixProtocol) {
        return function(renditions) {
            // if the renditions has thumbnail use that.
            if( renditions && renditions.thumbnail ) {
                return fixProtocol(renditions.thumbnail.href);
            }
            // pick the smallest size image from renditions
            // the smallest one is the one with the minimum area.
            var src = '', 
                min = false,
                area;
            angular.forEach(renditions, function(rendition) {
                area = parseInt(rendition.with,10) * parseInt(rendition.height,10);
                if(  area < min || min === false ) {
                    src = fixProtocol(rendition.href);
                    min = area;
                }
            });
            return src;
        }
    }

    transformBlog.$inject = ['fixProtocol', 'srcSet', '$sce'];
    function transformBlog(fixProtocol, srcSet, $sce) {
        return function(blog) {
            blog.descriptionHtml = $sce.trustAsHtml(blog.description);
            if (blog.picture_url && blog.picture) {
                blog.picture_srcset = srcSet(blog.picture.renditions); 
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

    Users.$inject = ['$resource', 'config', 'srcSet', 'thumbnailRendition'];
    function Users($resource, config, srcSet, thumbnailRendition) {
        return $resource(config.api_host + 'api/client_users/:userId', {'userId':'@id'}, {
            'get': { 
                method:'GET',
                transformResponse: function(user) {
                    user = angular.fromJson(user);
                    if(user && user.picture_url !== null) {
                        var thumbnail = thumbnailRendition(user.avatar_renditions);
                        user.picture_url =thumbnail? thumbnail : user.picture_url;
                        user.picture_srcset = srcSet(user.avatar_renditions);
                    }
                    return user;
                }
            }
        });
    }

    function _completePost(obj, user) {
        obj.original_creator = user._items? user._items[0] : user;
        //at times we don't get the byline and sign_off fields from the user request
        if (!obj.original_creator.byline && obj.byline) {
            obj.original_creator.byline = obj.byline;
        }
        if (!obj.original_creator.sign_off && obj.sign_off) {
            obj.original_creator.sign_off = obj.sign_off;
        }
        return obj.original_creator;
    }

    Posts.$inject = ['$resource', 'config', 'CacheFactory', '$rootScope', 'users', 'srcSet', 'fixProtocol'];
    function Posts($resource, config, CacheFactory, $rootScope, users, srcSet, fixProtocol) {
        function _completeUser(obj) {
            var usersCache, refreshCache;
            if (!CacheFactory.get('usersCache')) {
                var REFRESH_CACHE = angular.copy(CACHE_OPTIONS);
                // if it is expired get it again.
                REFRESH_CACHE.onExpire = function (key, value) {
                    $rootScope.$apply(function(){
                        users.get({userId: key}).$promise.then(function(user) {
                            // throught and all set the user on the `obj` post object.
                            var newUser = _completePost(obj, user),
                                oldUser = usersCache.get(key);
                                angular.extend(oldUser, newUser);
                            usersCache.put(key, oldUser);
                            refreshCache.put(key, {});
                        });
                    });
                }
                usersCache = CacheFactory.createCache('usersCache', {storageMode: 'memory'});
                refreshCache = CacheFactory.createCache('refreshCache', REFRESH_CACHE);
            } else {
                 usersCache = CacheFactory.get('usersCache');
                 refreshCache = CacheFactory.get('refreshCache')
            }
            if (obj.commenter) {
                obj.original_creator = {
                    display_name: obj.commenter,
                    sign_off: obj.commenter,
                    byline: obj.commenter
                };
            } else if(obj.syndicated_creator) {
                obj.original_creator = obj.syndicated_creator;
            } else if(obj.original_creator !== "" && obj.original_creator !== 'None'){
                var userId = obj.original_creator;
                if (typeof userId !== 'string') {
                    return obj;
                }
                // check if the `userId` is cached.
                if (!usersCache.get(userId)) {
                    // cache `promise` for batch request purposes.
                    usersCache.put(userId, users.get({userId: obj.original_creator}).$promise.then(function(user) {
                        // throught and all set the user on the `obj` post object.
                        usersCache.put(userId, _completePost(obj, user));
                        refreshCache.put(userId, {});
                        return user;
                    }));
                } else {
                    if(typeof usersCache.get(userId).then === 'function') {
                        usersCache.get(userId).then(function(user){
                            // all and all set the user on the `obj` post object.
                            usersCache.put(userId, _completePost(obj, user));
                        });
                    } else {
                        // use the cache user to set the user on the `obj` post object.
                        _completePost(obj, usersCache.get(userId));
                    }
                }
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

                        // add all the items directly in a `items` property.
                        if (angular.isDefined(post.groups[1])) {
                            post.items = post.groups[1].refs.map(function(value) {
                                var item = value.item;
                                // add `picture_url` and `picture_srcset` property on item.
                                if( (item.item_type == 'image') && item.meta && item.meta.media) {
                                    item.picture_url = fixProtocol(item.meta.media.renditions.thumbnail.href);
                                    item.picture_srcset = srcSet(item.meta.media.renditions);
                                }

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
                        post = _completeUser(post);
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

    Outputs.$inject = ['$resource', 'config'];
    function Outputs($resource, config) {
        // get `collection` embbeded into the `output`.
        return $resource(config.api_host + 'api/client_advertisement_outputs/:id?embedded={"collection":1}',
        {'id':'@id'});
    }

    Advertisements.$inject = ['$resource', 'config'];
    function Advertisements($resource, config) {
        return $resource(config.api_host + 'api/client_advertisements/:advertisementId',
            {'advertisementId':'@id'}, {
                'get': {
                    method:'GET',
                    transformResponse: function(ad) {
                        ad = angular.fromJson(ad);
                        // transform the advertisement, into a post with freetype item.
                        // keep the `item_type` from the advertisement.
                        ad.item_type = ad.type;
                        // `group_type` need to be a freetype string.
                        ad.group_type = 'freetype';
                        var post = {
                            _id: ad._id,
                            mainItem: ad,
                            items: [ad]
                        };
                        return post;
                    }
                }
            });
    }

    angular.module('liveblog-embed')
        .service('users', Users)
        .service('posts', Posts)
        .service('blogs', Blogs)
        .service('comments', Comments)
        .service('items', Items)
        .service('outputs', Outputs)
        .service('advertisements', Advertisements)
        .factory('transformBlog',transformBlog)
        .factory('srcSet', srcSet)
        .factory('thumbnailRendition', thumbnailRendition);

})(angular);
