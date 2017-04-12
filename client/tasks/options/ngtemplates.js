var src = [
    'app/scripts/liveblog*/**/*.html',
    'app/scripts/**/*.svg'
];

var options = {
    htmlmin: {
        collapseWhitespace: true,
        collapseBooleanAttributes: true
    },
    bootstrap: (module, script) =>
        '"use strict";' +
        'var lbtemplates = angular.module("lb.templates", []);' +
        'lbtemplates.run([\'$templateCache\', function($templateCache) {' +
        script + ' }]);'
};

module.exports = {
    core: {
        cwd: '<%= rootDir %>',
        dest: '<%= tmpDir %>/scripts/lb-templates.js',
        src: src,
        options: options
    },
    docs: {
        cwd: '<%= rootDir %>',
        dest: 'docs/dist/templates-cache-docs.generated.js',
        src: src,
        options: options
    },
    dev: {
        cwd: '<%= rootDir %>',
        dest: '<%= tmpDir %>/scripts/lb-templates.js',
        src: [],
        options: {
            bootstrap: function() {
                return '';
            }
        }
    }
};
