'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')();
 
gulp.task('pot', function () {
    return gulp.src(['*.html', '*.js', 'views/*.html'])
        .pipe($.angularGettext.extract('classic.pot', {}))
        .pipe(gulp.dest('po/'));
});
 
gulp.task('translations', function () {
    return gulp.src('po/*.po')
        .pipe($.angularGettext.compile({format: 'json'}))
        .pipe($.extend('translations.json')) // use .json extension for wrap plugin to load content
        .pipe($.wrap(
              '\'use strict\';\n\n' +
              'angular.module(\'gettext\').run([\'gettextCatalog\', function (gettextCatalog) {\n' +
              '/* jshint -W100,-W109 */\n' +
              '<% _.forEach(contents, function(translations, lang) { %>  gettextCatalog.setStrings(\'<%= lang %>\', <%= JSON.stringify(translations, undefined, 2) %>);\n<% }); %>' +
              '/* jshint +W100,+W109 */\n' +
              '}]);'))
        .pipe($.rename('translations.js')) // rename to javascript
        .pipe(gulp.dest('.'));
});