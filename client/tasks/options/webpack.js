var webpack = require('webpack');

module.exports = function(grunt) {
    'use strict';
    var config = require('../../webpack.config.js')(grunt);
    return {
        options: config,
        build: {
            plugins: config.plugins.concat(
                new webpack.DefinePlugin({
                    'process.env': {'NODE_ENV': JSON.stringify('production')}
                }),
                new webpack.optimize.DedupePlugin()
                //new webpack.optimize.UglifyJsPlugin()
            )
        }
    };
};
