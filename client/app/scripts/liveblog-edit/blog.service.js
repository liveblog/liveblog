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
    .service('blogService', ['api', '$q', '$rootScope', 'config', function(api, $q, $rootScope, config) {
        function update(blog, updated) {
            return api.blogs.update(blog, updated);
        }

        function save(blog, data) {
            return api.blogs.save(blog, data);
        }

        function get(_id, param, cache) {
            return api.blogs.getById(_id, param, cache);
        }

        /**
        * Retrieve the public urls of the given blog.
        * If not available, it will start to listen websocket publication notification
        * in order to update the blog with the fresh public url
        * @param {object} blog
        * @return {promise} public_urls
        **/
        function getPublicUrls(blog) {
            var deferred = $q.defer();
            // for debug purpose
            if (!blog.public_urls && config.debug) {
                var publicUrls = {};
                api('themes').query().then(function(data) {
                    // fix this from query like in the `get_concrete_themes` in theme.py
                    var concreteThemes = data._items.filter(function(theme) {return !theme['abstract'];});
                    angular.forEach(concreteThemes, function(theme) {
                        publicUrls[theme.name] = 'http://localhost:5000/embed/' + blog._id + '/' + theme.name;
                    });
                    deferred.resolve(publicUrls);
                });
            } else {
                // if the blog contains the url, returns it
                if (blog.public_urls) {
                    // fix url to a relative protocol
                    angular.forEach(blog.public_urls, function(value, key) {
                        value = value.replace('http://', '//');
                    });
                    deferred.resolve(blog.public_urls);
                } else {
                    // otherwise, listen for websocket notifications regarding publication
                    var notif_listener = $rootScope.$on('blog', function updateBlogAndResolve(e, data) {
                        if (data.blog_id === blog._id && data.published === 1) {
                            // update the blog property
                            blog.publics_url[theme] = data.publics_url[theme];
                            // unbind the listener
                            notif_listener();
                            // return the url
                            // fix url to a relative protocol
                            angular.forEach(blog.public_urls, function(value, key) {
                                value = value.replace('http://', '//');
                            });
                            deferred.resolve(blog.public_urls);
                        }
                    });
                }
            }
            return deferred.promise;
        }

        /**
        * Retrieve the public url of the given blog.
        * If not available, it will start to listen websocket publication notification
        * in order to update the blog with the fresh public url
        * @param {object} blog
        * @return {promise} public_url
        **/
        function getPublicUrl(blog) {
            var theme = blog.blog_preferences && blog.blog_preferences.theme;
            return getPublicUrls(blog).then(function(publicUrls) {
                return publicUrls[theme];
            });
        }

        return {
            get: get,
            update: update,
            save: save,
            getPublicUrl: getPublicUrl,
            getPublicUrls: getPublicUrls
        };
    }]);
});

// EOF
