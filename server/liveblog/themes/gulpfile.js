'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    es = require('event-stream');

gulp.task('translations', function () {
    gulp.src(['themes_assets/*', '!themes_assets/angular'])
    .pipe(es.map(function(data, cb){
        if(data.isDirectory()){
            return gulp.src([data.path + '/po/*.po'])
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
                .pipe(gulp.dest(data.path));
        }
        cb(null, data);
    }));
});


// make a stream that identifies if the given 'file' is a directory, and if so
// it pipelines it with the gettext stream.
gulp.task('pot', function(){
    gulp.src(['themes_assets/*', '!themes_assets/angular'])
    .pipe(es.map(function(data, cb){
        if(data.isDirectory()){
            var parts = data.path.split(path.sep),
                theme = parts[parts.length-1];
                gulp.src([data.path + '/**/*.html', data.path + '/**/*.js'])
                    .pipe($.angularGettext.extract(theme + '.pot', {}))
                    .pipe(gulp.dest(data.path + '/po/'));
        }
        cb(null, data);
    }));
});
