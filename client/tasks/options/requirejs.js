module.exports = function(grunt) {
    'use strict';

    var include = [
        'main',
        'liveblog-edit/directives',
        'liveblog-edit/module'
    ];

    return {
        compile: {
            options: {
                name: 'main',
                baseUrl: '<%= appDir %>/scripts/',
                mainConfigFile: '<%= appDir %>/scripts/config.js',
                out: '<%= tmpDir %>/concat/scripts/main.js',
                optimize: 'none',
                include: include
            }
        }
    };
};
