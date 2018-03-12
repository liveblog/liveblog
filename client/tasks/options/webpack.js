const webpack = require('webpack');

module.exports = function(grunt) {
    const config = require('../../webpack.config.js')(grunt);

    return {
        entry: 'webpack-dev-server/client?http://0.0.0.0:9000/',
        options: config,
        build: {
            plugins: config.plugins.concat(
                new webpack.DefinePlugin({
                    'process.env': {NODE_ENV: JSON.stringify('production')}
                }),
                new webpack.optimize.DedupePlugin()
                // new webpack.optimize.UglifyJsPlugin()
            )
        }
    };
};