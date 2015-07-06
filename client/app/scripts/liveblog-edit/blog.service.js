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
        .service('blogService', ['api', '$cacheFactory',
            function(api, $cacheFactory) {
                var blogsCache = $cacheFactory('blog');

                function update(_id, cache) {
                    return api.blogs.getById(_id, cache).then(function(data) {
                        blogsCache.put(_id, data);
                        return blogsCache.get(_id);
                    });
                }

                function save(_id, data) {
                    return api.blogs.save(blogsCache.get(_id), data);
                }

                function replace(data) {
                    return api.blogs.replace(data);
                }

                function get(_id) {
                    return blogsCache.get(_id);
                }
                return {
                    get: get,
                    update: update,
                    save: save,
                    replace: replace
                };
            }]);
});

// EOF
