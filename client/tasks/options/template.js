module.exports = function(grunt) {

    'use strict';

    function data(url, forceUrl) {

        var server = grunt.option('server') || process.env.SUPERDESK_URL || url;
        var ws = grunt.option('ws') || process.env.SUPERDESK_WS_URL || 'ws://localhost:5100';

        if (forceUrl) {
            server = url;
        }
        var config = {
            raven: {dsn: process.env.SUPERDESK_RAVEN_DSN || ''},
            server: {url: server, ws: ws},
            debug: grunt.option('debug-mode') || false,
            embedly: {
                key: grunt.option('embedly-key') || process.env.EMBEDLY_KEY || ''
            },
            facebookAppId: grunt.option('facebook-appid') || process.env.FACEBOOK_APP_ID || '',
            syndication: process.env.SYNDICATION || false,
            themeCreationRestrictions: {team: 3},
            excludedTheme: 'angular',
            assignableUsers: {
                solo: 3,
                team: 5
            },
            subscriptionLevel: process.env.SUBSCRIPTION_LEVEL || '',
            blogCreationRestrictions: {
                solo: 1,
                team: 3
            },
            analytics: {
                piwik: {
                    url: process.env.PIWIK_URL || '',
                    id: process.env.PIWIK_SITE_ID || ''
                },
                ga: {
                    id: process.env.TRACKING_ID || ''
                }
            }
        };

        return {data: {config: config}};
    }

    var files = {'<%= distDir %>/index.html': '<%= appDir %>/index.html'};

    return {
        mock: {
            options: data('http://localhost:5000/api', true),
            files: files
        },
        travis: {
            options: data('http://localhost:5000/api'),
            files: files
        },
        test: {
            options: data('http://localhost:5000/api'),
            files: {
                '<%= distDir %>/index.html': '<%= appDir %>/index.html',
                '<%= distDir %>/docs.html': '<%= appDir %>/docs.html'
            }
        },
        docs: {
            files: {'<%= distDir %>/docs.html': '<%= appDir %>/docs.html'}
        }
    };
};
