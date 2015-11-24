module.exports = {
    app: {
        cwd: 'app',
        src: [
            'scripts/bower_components/superdesk/client/app/scripts/superdesk*/**/*.html',
            'scripts/liveblog*/**/*.html'
        ],
        dest: 'app/scripts/lb-templates.js',
        options: {
            htmlmin: {
                collapseWhitespace: true,
                collapseBooleanAttributes: true
            },
            bootstrap:  function(module, script) {
                'use strict';
                return '"use strict";' +
                    'var lbtemplates = angular.module("lb.templates", []);' +
                    'lbtemplates.run([\'$templateCache\', function($templateCache) {' +
                    script + ' }]);';
            }
        }
    }
};
