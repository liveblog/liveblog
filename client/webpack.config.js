/* eslint-disable */

// TODO: Simplify config setup (requires careful testing):
// - Collapse getDefaults(), configServer(), configApp(), configLiveblog() into a single
//   function returning one flat object. They were split for the old grunt parameter passing
//   which no longer exists.
// - Inline superdesk.config.js into getDefaults() and delete the file. It only returns
//   { defaultRoute: '/liveblog', requiredMediaMetadata: ['headline', 'description_text', 'alt_text'] }.
//   Also remove the SUPERDESK_CONFIG env var path resolution (lines below) if no deployment
//   uses a custom config path.

const path = require('path');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

function defaultsDeep(target, defaults) {
    const result = Object.assign({}, defaults, target);
    for (const key of Object.keys(defaults)) {
        if (
            result[key] && defaults[key] &&
            typeof result[key] === 'object' && typeof defaults[key] === 'object' &&
            !Array.isArray(result[key])
        ) {
            result[key] = defaultsDeep(result[key], defaults[key]);
        }
    }
    return result;
}

let appConfigPath = path.join(process.cwd(), 'superdesk.config.js');
if (process.env.SUPERDESK_CONFIG) {
    appConfigPath = path.join(process.cwd(), process.env.SUPERDESK_CONFIG);
}

const sdConfig = defaultsDeep(require(appConfigPath)(), getDefaults());

// shouldExclude returns true if the path should be excluded from `ts-loader`
// to avoid including node_modules into it, except `superdesk` modules and
// `sanitize-html` which does not provide a build in their releases anymore
// https://github.com/apostrophecms/sanitize-html/pull/380
const shouldExclude = function(modulePath) {
    const isPackageNotInNodeModules = modulePath.indexOf('node_modules') === -1;

    if (isPackageNotInNodeModules) {
        return false;
    }

    const validModules = [
        'superdesk-core',
        'node_modules/sanitize-html',
        // `sanitize-html` dependencies
        'node_modules/postcss',
        'node_modules/nanoid',
        // `@atlaskit/datetime-picker` dependency
        'node_modules/@floating-ui',
    ].concat(sdConfig.apps);

    return !validModules.some((app) => modulePath.indexOf(app) > -1);
};

module.exports = (env, argv) => {
    const mode = (argv && argv.mode) || process.env.NODE_ENV || 'development';

    return {
        mode,

        entry: {
            app: './app/scripts/index.js',
            embed: './app/scripts/liveblog-embed-script/embed.ts',
        },

        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: (pathData) => {
                return pathData.chunk.name === 'embed' ? 'embed.js' : '[name].bundle.js';
            },
            chunkFilename: '[id].bundle.js',
            publicPath: '',
            clean: true,
        },

        devtool: mode === 'production' ? false : 'source-map',

        devServer: {
            port: 9000,
            host: '0.0.0.0',
            static: './dist',
            hot: false,
            headers: {
                'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0',
            },
            devMiddleware: {
                publicPath: '',
            },
        },

        plugins: [
            new webpack.ProvidePlugin({
                $: 'jquery',
                'window.$': 'jquery',
                jQuery: 'jquery',
                'window.jQuery': 'jquery',
                moment: 'moment',
            }),
            new webpack.DefinePlugin({
                __SUPERDESK_CONFIG__: JSON.stringify(sdConfig),
            }),
            new ForkTsCheckerWebpackPlugin({
                async: true,
            }),
            new CopyPlugin({
                patterns: [
                    { from: 'app/fonts', to: 'fonts' },
                    { from: 'app/images', to: 'images' },
                    { from: 'app/favicon.ico', to: 'favicon.ico' },
                    { from: 'app/favicon-alert.ico', to: 'favicon-alert.ico' },
                    { from: 'app/index.html', to: 'index.html' },
                    { from: 'app/config.js', to: 'config.js' },
                    { from: 'node_modules/sir-trevor/sir-trevor.js', to: 'sir-trevor.js' },
                    {
                        from: '**/*.html',
                        to: 'scripts/',
                        context: 'node_modules/superdesk-core/scripts/',
                    },
                    { from: 'app/template/core/', to: 'scripts/core/' },
                    { from: 'app/template/superdesk-override/', to: 'scripts/' },
                    {
                        from: 'node_modules/angular-i18n/angular-locale_*.js',
                        to: 'locales/[name][ext]',
                    },
                ],
            }),
        ],

        resolve: {
            modules: [
                __dirname,
                path.join(__dirname, 'app'),
                path.join(__dirname, 'app/scripts'),
                path.join(__dirname, 'app/styles/sass'),
                path.join(__dirname, 'node_modules/superdesk-core/scripts'),
                path.join(__dirname, 'node_modules/superdesk-core/styles/sass'),
                path.join(__dirname, 'node_modules/superdesk-core'),
                'node_modules',
            ],
            alias: {
                'rangy-saverestore': 'rangy/lib/rangy-selectionsaverestore',
                'jquery-gridster': 'gridster/dist/jquery.gridster.min',
                'external-apps': path.join(process.cwd(), 'dist', 'app-importer.generated.js'),
                i18n: path.join(process.cwd(), 'dist', 'locale.generated.js'),
                react: path.resolve('./node_modules/react'),
                jquery: path.resolve('./node_modules/jquery'),
            },
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },

        module: {
            rules: [
                {
                    test: /\.(ts|tsx|js|jsx)$/,
                    exclude: shouldExclude,
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    },
                },
                {
                    test: /\.html$/,
                    loader: 'html-loader',
                    options: {
                        esModule: false,
                        minimize: true,
                    },
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        {
                            loader: 'style-loader',
                            options: { esModule: false },
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                esModule: false,
                                url: {
                                    filter: (url) => !url.startsWith('/'),
                                },
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sassOptions: {
                                    includePaths: [
                                        path.join(__dirname, 'app/styles/sass'),
                                        path.join(__dirname, 'node_modules/superdesk-core/styles/sass'),
                                    ],
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: 'style-loader',
                            options: { esModule: false },
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                esModule: false,
                                url: {
                                    filter: (url) => !url.startsWith('/'),
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.(png|gif|jpeg|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
                    type: 'asset/resource',
                },
                {
                    test: /\.ng1$/,
                    use: [
                        'ngtemplate-loader',
                        path.resolve(__dirname, 'loaders/raw-html-loader.js'),
                    ],
                },
            ],
        },
    };
};


// getDefaults returns the default configuration for the app
function getDefaults() {
    let version;

    try {
        version = require('git-rev-sync').short('..');
    } catch (err) {
        // pass
    }

    return Object.assign(
        {
            version: version || require(path.join(__dirname, 'package.json')).version,

            iframely: {
                key: process.env.IFRAMELY_KEY || ''
            },

            google: {
                key: process.env.GOOGLE_KEY || ''
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
        },
        configServer(),
        configApp(),
        configLiveblog()
    );
}

function configServer() { return {
    raven: {
        dsn: process.env.SUPERDESK_RAVEN_DSN || ''
    },

    server: {
        url: process.env.SUPERDESK_URL || 'http://localhost:5000/api',
        ws: process.env.SUPERDESK_WS_URL || 'ws://0.0.0.0:5100'
    },
}; }

function configApp() { return {
    editor: {
        disableEditorToolbar: process.env.DISABLE_EDITOR_TOOLBAR === 'true' || undefined
    },

    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Europe/London',

    model: {
        dateformat: 'DD/MM/YYYY',
        timeformat: 'HH:mm:ss'
    },

    view: {
        dateformat: process.env.VIEW_DATE_FORMAT || 'DD/MM/YYYY',
        timeformat: process.env.VIEW_TIME_FORMAT || 'HH:mm'
    },

    isTestEnvironment: !!process.env.SUPERDESK_ENVIRONMENT,

    debug: process.env.DEBUG_MODE === 'true' || false,

    embed_protocol: process.env.EMBED_PROTOCOL || "https://",

    langOverride: {},

    features: {
        useTansaProofing: false,
        onlyEditor3: false,
        editorHighlights: false
    },

    tansa: {
        profile: {
            nb: 1,
            nn: 2
        }
    },

    workspace: {
        ingest: false,
        content: false,
        tasks: false,
        analytics: false
    },

    client: {
        url: process.env.SUPERDESK_CLIENT_URL || 'http://localhost:9000'
    }
}; }

function configLiveblog() { return {
    defaultRoute: '/liveblog',
    system: {
        dateTimeTZ: 'YYYY-MM-DD[T]HH:mm:ssZ'
    },
    iframely: {
        key: process.env.IFRAMELY_KEY || ''
    },
    facebookAppId: process.env.FACEBOOK_APP_ID || '',
    syndication: process.env.SYNDICATION || false,
    marketplace: process.env.MARKETPLACE || false,
    themeCreationRestrictions: {team: 5},
    excludedTheme: 'angular',
    subscriptionLevel: process.env.SUBSCRIPTION_LEVEL || '',
    daysRemoveDeletedBlogs: process.env.DAYS_REMOVE_DELETED_BLOGS || 3,
    maxContentLength: process.env.MAX_CONTENT_LENGTH || 8 * 1024 * 1024,
    // You might think this empty object is useless.
    // That would be a terrible mistake to make.
    validatorMediaMetadata: {}
}; }
