//module.exports = {
//    app: {
//        cwd: '<%= appDir %>',
//        src: [
//            'scripts/bower_components/superdesk/client/app/scripts/superdesk*/**/*.html',
//            'scripts/liveblog*/**/*.html'
//        ],
//        dest: '<%= tmpDir %>/scripts/lb-templates.js',
//        options: {
//            htmlmin: {
//                collapseWhitespace: true,
//                collapseBooleanAttributes: true
//            },
//            url: function(url) {
//                'use strict';
//                return url.replace('bower_components/superdesk/client/app/scripts/', '');
//            },
//            bootstrap:  function(module, script) {
//                'use strict';
//                return '"use strict";' +
//                    'var lbtemplates = angular.module("lb.templates", []);' +
//                    'lbtemplates.run([\'$templateCache\', function($templateCache) {' +
//                    script + ' }]);';
//            }
//        }
//    }
//};

'use strict';

//var path = require('path');
//var rootDir = path.dirname(path.dirname(__dirname));

var src = [
    //'node_modules/superdesk-core/scripts/**/*.html',
    'app/scripts/liveblog*/**/*.html',
    'app/scripts/**/*.svg'
];

var options = {
    htmlmin: {
        collapseWhitespace: true,
        collapseBooleanAttributes: true
    },
    //bootstrap: function(module, script) {
    //    return '"use strict";' +
    //        'angular.module("superdesk.templates-cache")' +
    //        '.run([\'$templateCache\', function($templateCache) {' +
    //        script + ' }]);';
    //}
    bootstrap:  function(module, script) {
        return '"use strict";' +
            'var lbtemplates = angular.module("lb.templates", []);' +
            'lbtemplates.run([\'$templateCache\', function($templateCache) {' +
            script + ' }]);';
    }
       
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
