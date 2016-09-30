var path = require('path');
var webpack = require('webpack');
var lodash = require('lodash');

// makeConfig creates a new configuration file based on the passed options.
module.exports = function makeConfig(grunt) {
    var appConfigPath = path.join(process.cwd(), 'superdesk.config.js');

    if (process.env.SUPERDESK_CONFIG) {
        appConfigPath = path.join(process.cwd(), process.env.SUPERDESK_CONFIG);
    }
    if (grunt.option('config')) {
        appConfigPath = path.join(process.cwd(), grunt.option('config'));
    }

    var sdConfig = lodash.defaultsDeep(require(appConfigPath)(grunt), getDefaults(grunt));

    return {
        cache: true,
        debug: true,
        entry: {
            app: ['app/scripts/index.js']
        },
        output: {
            path: path.join(process.cwd(), 'dist'),
            filename: '[name].bundle.js',
            chunkFilename: '[id].bundle.js'
        },
        plugins: [
            new webpack.ProvidePlugin({
                '$': 'jquery',
                'window.$': 'jquery',
                'jQuery': 'jquery',
                'window.jQuery': 'jquery',
                'moment': 'moment',
                // MediumEditor needs to be globally available, because
                // its plugins will not be able to find it otherwise.
                'MediumEditor': 'medium-editor'
            }),
            new webpack.DefinePlugin({
                __SUPERDESK_CONFIG__: JSON.stringify(sdConfig)
            })
        ],
        resolve: {
            root: [
                __dirname,
                //path.join(__dirname, '/scripts'),
                path.join(__dirname, '/app'),
                path.join(__dirname, '/app/scripts'),
                path.join(__dirname, '/app/styles/less'),
                path.join(__dirname, '/node_modules/superdesk-core/scripts'),
                path.join(__dirname, '/node_modules/superdesk-core/styles/less'),
                path.join(__dirname, '/node_modules/superdesk-core')
            ],
            modulesDirectories: [ 'node_modules' ],
            alias: {
                'moment-timezone': 'moment-timezone/builds/moment-timezone-with-data-2010-2020',
                'rangy-saverestore': 'rangy/lib/rangy-selectionsaverestore',
                'angular-embedly': 'angular-embedly/em-minified/angular-embedly.min',
                'jquery-gridster': 'gridster/dist/jquery.gridster.min'
            },
            extensions: ['', '.js']
        },
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    exclude: function(p) {
                        'use strict';
                        // exclude parsing node modules, but allow the 'superdesk-core'
                        // node module, because it will be used when building in the
                        // main 'superdesk' repository.
                        return p.indexOf('node_modules') > -1 && p.indexOf('superdesk-core') < 0;
                    },
                    loader: 'babel',
                    query: {
                        cacheDirectory: true,
                        presets: ['es2015']
                    }
                },
                {
                    test: /\.css/,
                    loader: 'style!css'
                },
                {
                    test: /\.less$/,
                    loader: 'style!css!less'
                },
                {
                    test: /\.(png|gif|jpeg|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
                    loader: 'file-loader'
                }
            ]
        }
    };
};

// getDefaults returns the default configuration for the app
function getDefaults(grunt) {
    var version;

    try {
        version = require('git-rev-sync').short('..');
    } catch (err) {
        // pass
    }

    return {
        // application version
        version: version || grunt.file.readJSON(path.join(__dirname, 'package.json')).version,

        // raven settings
        raven: {
            dsn: process.env.SUPERDESK_RAVEN_DSN || ''
        },

        // backend server URLs configuration
        server: {
            url: grunt.option('server') || process.env.SUPERDESK_URL || 'http://localhost:5000/api',
            ws: grunt.option('ws') || process.env.SUPERDESK_WS_URL || 'ws://0.0.0.0:5100'
        },

        // iframely settings
        iframely: {
            key: process.env.IFRAMELY_KEY || ''
        },

        // settings for various analytics
        analytics: {
            piwik: {
                url: process.env.PIWIK_URL || '',
                id: process.env.PIWIK_SITE_ID || ''
            },
            ga: {
                id: process.env.TRACKING_ID || ''
            }
        },

        // editor configuration
        editor: {
            // if true, the editor will not have a toolbar
            disableEditorToolbar: grunt.option('disableEditorToolbar')
        },

        // default timezone for the app
        defaultTimezone: grunt.option('defaultTimezone') || 'Europe/London',

        // model date and time formats
        model: {
            dateformat: 'DD/MM/YYYY',
            timeformat: 'HH:mm:ss'
        },

        // view formats for datepickers/timepickers
        view: {
            dateformat: process.env.VIEW_DATE_FORMAT || 'DD/MM/YYYY',
            timeformat: process.env.VIEW_TIME_FORMAT || 'HH:mm'
        },

        // if environment name is not set
        isTestEnvironment: !!grunt.option('environmentName'),

        // environment name
        environmentName: grunt.option('environmentName'),

        // route to be redirected to from '/'
        defaultRoute: '/liveblog',

        // override language translations
        langOverride: {},

        // app features
        features: {
            // tansa spellchecker
            useTansaProofing: false
        }
    };
}
