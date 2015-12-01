/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

define([
    'angular'
], function(angular) {
    'use strict';

    angular.module('liveblog.blog', [])
    .service('blogService', ['api', '$q', '$rootScope', function(api, $q, $rootScope) {
        function update(blog, updated) {
            return api.blogs.update(blog, updated);
        }

        function save(blog, data) {
            return api.blogs.save(blog, data);
        }

        function get(_id) {
            return api.blogs.getById(_id);
        }

        /**
        * Retrieve the public url of the given blog.
        * If not available, it will start to listen websocket publication notification
        * in order to update the blog with the fresh public url
        * @param {object} blog
        * @return {promise} public_url
        **/
        function getPublicUrl(blog) {
            var deferred = $q.defer();
            // if the blog contains the url, returns it
            if (blog.public_url) {
                deferred.resolve(blog.public_url);
            } else {
                // otherwise, listen for websocket notifications regarding publication
                var notif_listener = $rootScope.$on('blog', function updateBlogAndResolve(e, data) {
                    if (data.blog_id === blog._id && data.published === 1) {
                        // update the blog property
                        blog.public_url = data.public_url;
                        // unbind the listener
                        notif_listener();
                        // return the url
                        deferred.resolve(blog.public_url);
                    }
                });
            }
            return deferred.promise;
        }

        return {
            get: get,
            update: update,
            save: save,
            getPublicUrl: getPublicUrl
        };
    }]);
});

// EOF
