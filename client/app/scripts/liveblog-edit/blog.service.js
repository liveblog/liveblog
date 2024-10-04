/**
 * This file is part of Liveblog.
 *
 * Copyright 2013 - 2024 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://github.com/liveblog/liveblog/blob/master/LICENSE
 */

import {EventNames} from '../liveblog-common/constants';
import Storage from '../liveblog-common/storage';

blogService.$inject = ['api', '$q', '$rootScope', 'config', 'notify'];

export default function blogService(api, $q, $rootScope, config, notify) {
    let embedErrorListener;
    let blog;

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
    * Retrieve the public url of the given blog.
    * If not available, it will start to listen websocket publication notification
    * in order to update the blog with the fresh public url
    * @param {object} blog
    * @return {promise} public_url
    **/
    function getPublicUrl(blog) {
        const deferred = $q.defer();
        let publicUrl;

        if (!blog.public_url && config.debug) {
            publicUrl = config.server.url.replace('/api', `/embed/${blog._id}`);
        } else if (blog.public_url) {
            // if the blog contains the url, returns it
            publicUrl = config.debug ? blog.public_url : blog.public_url.replace('http://', 'https://');
        } else {
            // otherwise, listen for websocket notifications regarding publication
            const notifListener = $rootScope.$on(EventNames.Blog, function updateBlogAndResolve(e, data) {
                if (data.blog_id === blog._id && data.published === 1) {
                    // update the blog property
                    blog.public_url = data.public_url;
                    // unbind the listener
                    notifListener();
                    // return the url
                    // fix https issue
                    publicUrl = config.debug ? blog.public_url : blog.public_url.replace('http://',
                        config.embed_protocol);
                    $rootScope.publicUrl = publicUrl;
                }
            });
        }

        deferred.resolve(publicUrl);

        return deferred.promise;
    }

    /**
     * This function is triggered when a embed generation error is notified via web socket message.
     * It makes sure that the notification is shown only once every 3 hours approximately by storing
     * a key in local storage and checking if it should show the error again or not. The intention
     * is to avoid annoying the user too often but still letting them know about a problem with their
     * embed generation.
     * @param {AngularEvent} e
     * @param {*} eventData dictionary with relevant data coming from backend (blog_id, error, theme_name)
     */
    function onEmbedErrorReceived(e, eventData) {
        if (blog._id === eventData.blog_id) {
            const expiry = 3 / 24; // 3 hours
            const storeKey = `embedGenerationErr_${eventData.blog_id}`;
            const isMessageAlreadyShown = Storage.read(storeKey) === '1';

            if (isMessageAlreadyShown)
                return;

            const errorMessage = `There has been an error while generating the embed for the
                current blog. Please try with another theme and contact our Support Team
                and provide this error: "${eventData.error}". The embed generation has fallen
                back to the Default theme for the current blog.`;

            notify.error(errorMessage, 30000);
            Storage.write(storeKey, '1', expiry);
        }
    }

    return {
        get: get,
        update: update,
        save: save,
        getPublicUrl: getPublicUrl,
        listenToEmbedErrors: function(currentBlog) {
            if (!embedErrorListener) {
                blog = currentBlog;
                embedErrorListener = $rootScope.$on(EventNames.EmbedGenerationError, onEmbedErrorReceived);
            }
        },
        stopListeningToEmbedErrors: function() {
            if (embedErrorListener) {
                embedErrorListener();
                embedErrorListener = undefined;
                blog = undefined;
            }
        },
    };
}
