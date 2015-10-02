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
        .service('blogService', ['api', '$cacheFactory', 'config',
            function(api, $cacheFactory, config) {

                function update(blog, updated) {
                    return api.blogs.update(blog, updated);
                }

                function save(blog, data) {
                    return api.blogs.save(blog, data);
                }

                function get(_id) {
                    return api.blogs.getById(_id);
                }

                // take the public url (from s3) or the local address
                // FIXME: The local address shouldn't be given on production mode
                function getIframe(blog) {
                    return blog.public_url || config.server.url.replace('/api', '/embed/' + blog._id);
                }

                return {
                    get: get,
                    update: update,
                    save: save,
                    getIframe: getIframe
                };
            }]);
});

// EOF
