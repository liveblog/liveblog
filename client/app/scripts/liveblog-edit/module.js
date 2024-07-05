
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

import mainTpl from 'scripts/liveblog-edit/views/main.ng1';
import settingsTpl from 'scripts/liveblog-edit/views/settings.ng1';
import analiticsTpl from 'scripts/liveblog-analytics/views/view-analytics.ng1';

import BlogEditController from './controllers/blog-edit.js';
import BlogSettingsController from './controllers/blog-settings.js';
import './components/inactivity.modal';
import './embed/handlers/instagram';
import './embed/handlers/facebook';
import './embed/handlers/pictures';
import './embed/handlers/twitter';

/**
 * Resolve a blog by route id and redirect to /liveblog if such blog does not exist
 */
BlogResolver.$inject = ['api', '$route', '$location', 'notify', 'gettext', 'blogService'];
function BlogResolver(api, $route, $location, notify, gettext, blogService) {
    return blogService.get($route.current.params._id, {timestamp: new Date()}, false)
        .then(null, (response) => {
            if (response.status === 404) {
                notify.error(gettext('Blog was not found, sorry.'), 5000);
                $location.path('/liveblog');
            }
            return response;
        });
}

const app = angular.module('liveblog.edit',
    [
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
        'liveblog.features',
        'liveblog.freetypes',
        'liveblog.edit.components.inactivityModal',
    ])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/liveblog/edit/:_id', {
                label: gettext('Blog Editor'),
                auth: true,
                controller: BlogEditController,
                controllerAs: 'blogEdit',
                templateUrl: mainTpl,
                resolve: {blog: BlogResolver},
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
                    }],
                },
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
                    }],
                },
            });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('posts', {
            type: 'http',
            backend: {rel: 'posts'},
        });
        apiProvider.api('items', {
            type: 'http',
            backend: {rel: 'items'},
        });
        apiProvider.api('archive', {
            type: 'http',
            backend: {rel: 'archive'},
        });
        apiProvider.api('global_preferences', {
            type: 'http',
            backend: {rel: 'global_preferences'},
        });
        apiProvider.api('themes', {
            type: 'http',
            backend: {rel: 'themes'},
        });
        apiProvider.api('consumers', {
            type: 'http',
            backend: {rel: 'consumers'},
        });
    }])
    .config(['SirTrevorOptionsProvider', 'SirTrevorProvider', function(SirTrevorOptions, SirTrevorParam) {
        // here comes all the sir trevor customization (except custom blocks which are in the SirTrevorBlocks module)
        const SirTrevor = SirTrevorParam.$get();

        var onRemoveBlockUpdateSubmitBtn = function() {
            const editorOptions = SirTrevor.Block.prototype.getOptions();

            // I don't like this solution using timeout, but we need to wait just a bit
            // to check if operations are done (block removing, reset, edit, etc)
            setTimeout(() => {
                editorOptions.disableSubmit(editorOptions.isEditorClean());
            }, 500);
        };

        const disableEditorSubmitButton = () => {
            const editorOptions = SirTrevor.Block.prototype.getOptions();

            if (editorOptions)
                editorOptions.disableSubmit(true);
        };

        // let's make sure to avoid double binding
        SirTrevor.EventBus.off('block:remove');
        SirTrevor.EventBus.on('block:remove', onRemoveBlockUpdateSubmitBtn);

        // change the remove trash icon by a cross
        SirTrevor.BlockDeletion.prototype.attributes['data-icon'] = 'close';

        // extends the options given as parameter to the editor contructor
        SirTrevorOptions.$extend({
            onEditorRender: function() {
                const self = this;

                // when a new block is added, remove empty blocks
                function removeEmptyBlockExceptTheBlock(newBlock) {
                    _.each(self.blocks, (block) => {
                        if (block !== newBlock && block.isEmpty()) {
                            self.removeBlock(block.blockID);
                        }
                    });

                    // disable submit once a block has been added
                    disableEditorSubmitButton();
                }

                SirTrevor.EventBus.on('block:create:existing', removeEmptyBlockExceptTheBlock);
                SirTrevor.EventBus.on('block:create:new', removeEmptyBlockExceptTheBlock);
            },
            blockTypes: ['Text', 'Image', 'Embed', 'Quote', 'Comment', 'Video'],
            // render a default block when the editor is loaded
            defaultType: 'Text',
            transform: {
                get: function(block) {
                    return {
                        type: block.blockStorage.type,
                        text: block.toCleanHTML(),
                        meta: block.toMeta(),
                    };
                },
                set: function(block) {
                    return {
                        type: block.type,
                        data: block.data,
                    };
                },
            },
        });
    }])
    .filter('convertLinksWithRelativeProtocol', ['config', function fixProtocol(config) {
        return function getRelativeProtocol(text) {
            const absoluteProtocol = RegExp(/http(s)?:\/\//ig);

            config.server.url.replace(absoluteProtocol, '//');
            text.replace(absoluteProtocol, '//');
            return text.replace(absoluteProtocol, '//');
        };
    }])
    /**
     * Returns relative date and auto updates values every 60s
     *
     * @param {Datetime} date iso format datetime
     * @return {String} relative time
     */
    .filter('reldateAutoUpdate', ['$interval', '$sce', function reldateAutorUpdateFactory($interval, $sce) {
        // trigger digest every 60 seconds
        $interval(() => true, 60000);

        function reldateAutoUpdate(date) {
            const pubDate = moment(date);
            const now = moment();
            var relDate = pubDate.fromNow();

            if (pubDate > now) {
                relDate = `<span class="updated-label">SCHEDULED FOR</span>
                    <span class="updated-time">${pubDate.format('MMM DD, YYYY LT')}</span>`;
            }

            return $sce.trustAsHtml(relDate);
        }

        reldateAutoUpdate.$stateful = true;
        return reldateAutoUpdate;
    }])
    .filter('outboundAnchors', () => function(text = '') {
        return text.replace(/<a([^>]*)>/g, (match, attr) => {
            if (attr.indexOf('target') === -1) {
                return `<a${attr} target="_blank">`;
            }
            return match;
        });
    })
    .filter('varname', () => function(text = '') {
        return text.toLowerCase().replace(' ', '_');
    })
    .factory('instagramService', ['$timeout', function($timeout) {
        const insta = {};

        insta.postHasEmbed = function(post) {
            let hasInstagram = false;

            angular.forEach(post, (item) => {
                if (item.item && item.item.item_type === 'embed') {
                    if (item.item.text && item.item.text.indexOf('platform.instagram.com') !== -1) {
                        hasInstagram = true;
                    }
                }
            });
            return hasInstagram;
        };
        insta.processEmbeds = function() {
            // take in accound the animations
            $timeout(() => {
                window.instgrm.Embeds.process();
            }, 1000);
        };
        return insta;
    }])
    .config(['embedServiceProvider', 'iframelyServiceProvider', 'config',
        function(embedServiceProvider, iframelyServiceProvider, config) {
            iframelyServiceProvider.setKey(config.iframely.key);
            iframelyServiceProvider.useOembed();

            // don't use noembed as first choice
            embedServiceProvider.setConfig('useOnlyFallback', true);
            // and let's use iframely as fallback service (if not handler found)
            embedServiceProvider.setConfig('fallbackService', 'iframely');
        },
    ])
    .run([
        'embedService',
        'embedInstagramHandler',
        'embedFacebookHandler',
        'embedPictureHandler',
        'embedTwitterHandler',
        'featuresService',
        function(
            embedService,
            embedInstagramHandler,
            embedFacebookHandler,
            embedPictureHandler,
            embedTwitterHandler,
            featuresService
        ) {
            embedService.registerHandler(embedInstagramHandler);
            embedService.registerHandler(embedFacebookHandler);
            embedService.registerHandler(embedPictureHandler);
            embedService.registerHandler(embedTwitterHandler);
            featuresService.initialize();
        },
    ]);

export default app;
