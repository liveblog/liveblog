var path = require('path');
var makeConfig = require('../../webpack.config.js');

module.exports = function(grunt) {
    var webpackConfig = makeConfig(grunt);

    return {
        options: {
            webpack: webpackConfig,
            publicPath: './dist',
            port: 9000,
            host: '0.0.0.0',
            contentBase: "./dist",
            hot: true,
            headers: {
                'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
            }
        },
        start: {
            keepAlive: true,
            //proxy: getProxy(),
            webpack: {
                devtool: 'eval',
                debug: true,
                entry: {
                    app: ['webpack-dev-server/client?http://0.0.0.0:9000/'].concat(webpackConfig.entry.app)
                //},
                //output: {
                //    publicPath: './dist'
                }
            }
        },
        docs: {
            keepAlive: true,
            contentBase: './docs/dist',
            port: 9100,
            webpack: {
                entry: {
                    docs: ['webpack-dev-server/client?http://0.0.0.0:9100/', 'docs/index']
                },
                output: {
                    path: path.join(process.cwd(), 'docs/dist'),
                    publicPath: 'docs/dist'
                },
                devtool: 'eval',
                debug: true
            }
        }
    };
};

// getProxy returns the proxy configuration for the dev server. In the dev
// environment, some paths need to be rewritten.
function getProxy() {
    // isEmbedded will be true when the app is embedded into the main repo as a
    // node module.
    var isEmbedded = require('fs').existsSync('./node_modules/superdesk-core');

    // prepend returns a proxy configuration that prepends the passed URL with
    // the given parameter.
    var prepend = function(loc) {
        return {
            target: 'http://localhost:9000',
            rewrite: function(req) {
                req.url = loc + req.url;
            }
        };
    };

    var proxy = isEmbedded ? {
        '/scripts/*': prepend('node_modules/superdesk-core'),
        '/images/*': prepend('node_modules/superdesk-core')
    } : {};

    // on the dev server the bundle is in the dist folder
    proxy['/app.bundle.js'] = prepend('dist');

    return proxy;
}
