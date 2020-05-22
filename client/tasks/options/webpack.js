const path = require('path');
const webpack = require('webpack');

module.exports = function(grunt) {
    const config = require('../../webpack.config.js')(grunt);

    const prodPlugins = config.plugins.concat(
        new webpack.DefinePlugin({
            'process.env': {NODE_ENV: JSON.stringify('production')},
        }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
        })
    );

    return {
        options: config,
        build: {
            entry: config.entry,
            plugins: prodPlugins,
        },
        embedScript: {
            entry: config.entry.embedScript,
            output: {
                path: path.join(process.cwd(), 'dist'),
                filename: 'embed.js',
                chunkFilename: '[id].bundle.js',
            },
            plugins: prodPlugins,
        },
    };
};