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


    // shouldExclude returns true if the path p should be excluded from loaders
    // such as 'babel' or 'eslint'. This is to avoid including node_modules into
    // these loaders, but not node modules that are superdesk apps.
    const shouldExclude = function(p) {
        // don't exclude anything outside node_modules
        if (p.indexOf('node_modules') === -1) {
            return false;
        }
        // include only 'superdesk-core' and valid modules inside node_modules
        let validModules = ['superdesk-core'].concat(sdConfig.apps);
        return !validModules.some((app) => p.indexOf(app) > -1);
    };

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
        stats: {
          errorDetails: true,
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
                path.join(__dirname, '/app/styles/sass'),
                path.join(__dirname, '/node_modules/superdesk-core/scripts'),
                path.join(__dirname, '/node_modules/superdesk-core/styles/sass'),
                path.join(__dirname, '/node_modules/superdesk-core')
            ],
            modulesDirectories: [ 'node_modules' ],
            alias: {
                //'moment-timezone': 'moment-timezone/builds/moment-timezone-with-data-2010-2020',
                'rangy-saverestore': 'rangy/lib/rangy-selectionsaverestore',
                'angular-embedly': 'angular-embedly/em-minified/angular-embedly.min',
                'jquery-gridster': 'gridster/dist/jquery.gridster.min',
                'external-apps': path.join(process.cwd(), 'dist', 'app-importer.generated.js'),
                'i18n': path.join(process.cwd(), 'dist', 'locale.generated.js'),
                // ensure that react is loaded only once (3rd party apps can load more...)
                'react': path.resolve('./node_modules/react')
 
            },
            extensions: ['', '.js', '.jsx']
        },
        module: {
            loaders: [
                {
                    test: /\.jsx?$/,
                    exclude: shouldExclude,
                    loader: 'babel',
                    query: {
                        cacheDirectory: true,
                        presets: ['es2015', 'react'],
                        plugins: ['transform-object-rest-spread']
                    }
                },
                {
                    test: /\.html$/,
                    loader: 'ngtemplate!html'
                },
                {
                    test: /\.css/,
                    loader: 'style!css'
                },
                {
                    test: /\.scss$/,
                    loader: 'style!css!sass'
                },
                {
                    test: /\.(png|gif|jpeg|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
                    loader: 'file-loader'
                },
                {
                    test: /\.json$/,
                    loader: 'json-loader'
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
        },

        debug: grunt.option('debug-mode') || false,
        embedly: {
            key: grunt.option('embedly-key') || process.env.EMBEDLY_KEY || ''
        },
        facebookAppId: grunt.option('facebook-appid') || process.env.FACEBOOK_APP_ID || '',
        syndication: process.env.SYNDICATION || false,
        marketplace: process.env.MARKETPLACE || false,
        themeCreationRestrictions: {team: 3},
        excludedTheme: 'angular',
        assignableUsers: {
            solo: 2,
            team: 4
        },
        subscriptionLevel: process.env.SUBSCRIPTION_LEVEL || '',
        blogCreationRestrictions: {
            solo: 1,
            team: 3
        },

        maxContentLength: process.env.MAX_CONTENT_LENGTH || 8 * 1024 * 1024,

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

        system: {
            dateTimeTZ: 'YYYY-MM-DD[T]HH:mm:ssZ'
        },

        // You might think this empty object is useless.
        // That would be a terrible mistake to make.
        validatorMediaMetadata: {}
    };
}
