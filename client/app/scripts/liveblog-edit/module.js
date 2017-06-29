
/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import angular from 'angular';
import _ from 'lodash';

import mainTpl from 'scripts/liveblog-edit/views/main.html';
import settingsTpl from 'scripts/liveblog-edit/views/settings.html';
import analiticsTpl from 'scripts/liveblog-analytics/views/view-analytics.html';

import BlogEditController from './controllers/blog-edit.js'
import BlogSettingsController from './controllers/blog-settings.js'

/**
 * Resolve a blog by route id and redirect to /liveblog if such blog does not exist
 */
BlogResolver.$inject = ['api', '$route', '$location', 'notify', 'gettext', 'blogService'];
function BlogResolver(api, $route, $location, notify, gettext, blogService) {

    return blogService.get($route.current.params._id, {timestamp: new Date()}, false)
        .then(null, function(response) {
            if (response.status === 404) {
                notify.error(gettext('Blog was not found, sorry.'), 5000);
                $location.path('/liveblog');
            }
            return response;
        });
}

var app = angular.module('liveblog.edit', [
    'SirTrevor',
    'SirTrevorBlocks',
    'angular-embed',
    'angular-embed.handlers',
    'ngRoute',
    'superdesk.core.services.modal',
    'superdesk.core.upload',
    'liveblog.pages-manager',
    'lrInfiniteScroll',
    'liveblog.security',
    'liveblog.freetypes'
])
.config(['superdeskProvider', function(superdesk) {
    superdesk.activity('/liveblog/edit/:_id', {
        label: gettext('Blog Editor'),
        auth: true,
        controller: BlogEditController,
        controllerAs: 'blogEdit',
        templateUrl: mainTpl,
        resolve: {blog: BlogResolver}
    })
    .activity('/liveblog/settings/:_id', {
        label: gettext('Blog Settings'),
        auth: true,
        controller: BlogSettingsController,
        controllerAs: 'settings',
        templateUrl: settingsTpl,
        resolve: {
            blog: BlogResolver,
            security: ['blogSecurityService', function(blogSecurityService) {
                return blogSecurityService.goToSettings();
            }]
        }
    })
    .activity('/liveblog/analytics/:_id', {
        label: gettext('Blog Analytics'),
        auth: true,
        controller: 'LiveblogAnalyticsController',
        controllerAs: 'analytics',
        templateUrl: analiticsTpl,
        resolve: {
            blog: BlogResolver,
            security: ['blogSecurityService', function(blogSecurityService) {
                return blogSecurityService.goToSettings();
            }]
        }
    });
}])
.config(['apiProvider', function(apiProvider) {
    apiProvider.api('posts', {
        type: 'http',
        backend: {rel: 'posts'}
    });
    apiProvider.api('items', {
        type: 'http',
        backend: {rel: 'items'}
    });
    apiProvider.api('archive', {
        type: 'http',
        backend: {rel: 'archive'}
    });
    // @TODO: remove this when theme at blog level.
    apiProvider.api('global_preferences', {
        type: 'http',
        backend: {rel: 'global_preferences'}
    });
    apiProvider.api('themes', {
        type: 'http',
        backend: {rel: 'themes'}
    });
}])
.config(['SirTrevorOptionsProvider', 'SirTrevorProvider', function(SirTrevorOptions, SirTrevor) {
    // here comes all the sir trevor customization (except custom blocks which are in the SirTrevorBlocks module)
    SirTrevor = SirTrevor.$get();
    // change the remove trash icon by a cross
    SirTrevor.BlockDeletion.prototype.attributes['data-icon'] = 'close';
    // extends the options given as parameter to the editor contructor
    SirTrevorOptions.$extend({
        onEditorRender: function() {
            var editor = this;
            // when a new block is added, remove empty blocks
            function removeEmptyBlockExceptTheBlock(new_block) {
                _.each(editor.blocks, function(block) {
                    if (block !== new_block && block.isEmpty()) {
                        editor.removeBlock(block.blockID);
                    }
                });
            }
            SirTrevor.EventBus.on('block:create:existing', removeEmptyBlockExceptTheBlock);
            SirTrevor.EventBus.on('block:create:new', removeEmptyBlockExceptTheBlock);
        },
        blockTypes: ['Text', 'Image', 'Embed', 'Quote', 'Comment'],
        // render a default block when the editor is loaded
        defaultType: 'Text',
        transform: {
            get: function(block) {
                return {
                    type: block.blockStorage.type,
                    text: block.toHTML(),
                    meta: block.toMeta()
                };
            },
            set: function(block) {
                return {
                    type: block.type,
                    data: block.data
                };
            }
        }
    });
}])
.filter('convertLinksWithRelativeProtocol', ['config', function fixProtocol(config) {
    return function getRelativeProtocol(text) {
        var absoluteProtocol = RegExp(/http(s)?:\/\//ig);
        var serverpath = config.server.url.split('//').pop();
        config.server.url.replace(absoluteProtocol, '//');
        text.replace(absoluteProtocol, '//')
        return text.replace(absoluteProtocol, '//')
    };
}])
.filter('outboundAnchors', function() {
    return function(text) {
        return text.replace(/<a([^>]*)>/g, function(match, attr) {
                        if (attr.indexOf('target') === -1) {
                            return '<a' + attr + ' target="_blank">';
                        }
                        return match;
                    });
    };
})
.factory('instagramService', ['$timeout', function($timeout) {
    var insta = {};
    insta.postHasEmbed = function(post) {
        var hasInstagram = false;
        angular.forEach(post, function(item) {
            if (item.item && item.item.item_type === 'embed') {
                if (item.item.text && item.item.text.indexOf('platform.instagram.com') !== -1) {
                    hasInstagram = true;
                }
            }
        });
        return hasInstagram;
    }
    insta.processEmbeds = function() {
        // take in accound the animations
        $timeout(function() {
            window.instgrm.Embeds.process();
        }, 1000);
    }
    return insta;
}])
.config(['embedlyServiceProvider', 'embedServiceProvider', 'config', 
    function(embedlyServiceProvider, embedServiceProvider, config) {
        embedlyServiceProvider.setKey(config.embedly.key);
        embedServiceProvider.setConfig('facebookAppId', config.facebookAppId);
    }])
    .run(['embedService', 'ngEmbedTwitterHandler', 'ngEmbedFacebookHandler',
        'ngEmbedYoutubeHandler', 'ngEmbedInstagramHandler', 'ngEmbedPictureHandler',
        function(embedService, ngEmbedTwitterHandler, ngEmbedFacebookHandler,
                ngEmbedYoutubeHandler, ngEmbedInstagramHandler, ngEmbedPictureHandler) {
            // register all the special handlers we want to use for angular-embed
            // use embed.ly and update the embed code with a max_width
            embedService.registerHandler(ngEmbedFacebookHandler);
            embedService.registerHandler(ngEmbedYoutubeHandler); // use embed.ly
            embedService.registerHandler(ngEmbedInstagramHandler); // Use embed.ly
            embedService.registerHandler(ngEmbedTwitterHandler); // use embed.ly, load a script to render the card.
            // use embed.ly, and provide a `thumbnail_url` field from the `url`
            embedService.registerHandler(ngEmbedPictureHandler);
        }
    ]);

export default app;
//});
