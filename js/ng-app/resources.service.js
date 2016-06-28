'use strict';
var angular = require("angular");

var CACHE_OPTIONS = {
  deleteOnExpire: 'aggressive',
  recycleFreq: 3600000, // 1h
  storageMode: 'localStorage'
};

angular.module('liveblog-embed')
  .service('users', Users)
  .service('posts', Posts)
  .service('blogs', Blogs)
  .service('comments', Comments)
  .service('items', Items)
  .factory('transformBlog', transformBlog);


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
  };

  function _getProvider(meta) {
    var match = false
      , html = meta.html
      , yt = /(youtube.com|youtu.be)/g // Youtube
      , instagram = /(instagram.com|instagr.am)/g // Instagram
      , twitter = /(twitter.com)/g // Twitter
      ;

    switch (true) {
      case yt.test(html): match = "YouTube"; break;
      case instagram.test(html): match = "Instagram"; break;
      case twitter.test(html): match = "Twitter"; break;
    }

    return match;
  };

  function _mainEmbed(refs) {
    
    /*
      Heuristic to determine if the post is centered
      around a certain embed
    */

    var isMainEmbed, numEmbeds = 0;
    for (var i = refs.length - 1; i >= 0; i--) {
      if (refs[i].item.item_type === "embed") {
        var meta = refs[i].item.meta;
        if (!meta.hasOwnProperty("provider_name")) {
          meta.provider_name = _getProvider(meta)
        }
        
        isMainEmbed = meta.provider_name;
        ++numEmbeds;
      }
    }

    return numEmbeds == 1
      ? isMainEmbed // contains provider
      : false // play doh
  }

  return $resource(config.api_host + 'api/client_blogs/:blogId/posts', {blogId: config.blog._id}, {
    get: {
      transformResponse: function(posts) {
        // decode json
        posts = angular.fromJson(posts);
        posts._items.forEach(function(post) {
          post.mainItem = _completeUser(post.groups[1].refs[0].item); // Basically Refs 1?
          post.mainEmbed = _mainEmbed(post.groups[1].refs) // Heuristic for embed-centered item
          post.fullDetails = post.hasComments; // business logic compiled from other objects.

          // fallback for older posts.
          if(!post.content_updated_date) post.content_updated_date = post._updated;
          post.showUpdate = (post._updated !== post.published_date); // post is updated

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

