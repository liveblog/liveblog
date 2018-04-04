

const path = require('path');
const makeConfig = require('../../webpack.config.js');

module.exports = function(grunt) {
    const webpackConfig = makeConfig(grunt);

    return {
        options: {
            webpack: webpackConfig,
            port: 9000,
            host: '0.0.0.0',
            contentBase: './dist',
            hot: false,
            headers: {
                'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
            }
        },
        start: {
            webpack: {
                devtool: 'source-map',
                entry: {
                    app: ['webpack-dev-server/client?http://0.0.0.0:9000/'].concat(webpackConfig.entry.app)
                },
                output: {
                    publicPath: ''
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
                devtool: 'eval'
            }
        }
    };
};
