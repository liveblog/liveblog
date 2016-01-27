module.exports = {
    app: {
        cwd: '<%= appDir %>',
        src: [
            'scripts/bower_components/superdesk/client/app/scripts/superdesk*/**/*.html',
            'scripts/liveblog*/**/*.html'
        ],
        dest: '<%= tmpDir %>/scripts/lb-templates.js',
        options: {
            htmlmin: {
                collapseWhitespace: true,
                collapseBooleanAttributes: true
            },
            url: function(url) {
                'use strict';
                return url.replace('bower_components/superdesk/client/app/scripts/', '');
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
