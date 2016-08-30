'use strict';

var gulp = require('gulp'),
    fs = require('fs'),
    $ = require('gulp-load-plugins')(),
    config = {
        dest: 'dist',
        script: 'scripts.min.js',
        style: 'styles.min.css',
        translations: 'translations.js',
        templates: 'templates.js'
    };

config.get = function(key) {
    return (config.dest !== '.' ? config.dest + '/' : '') + config[key];
}

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
        .pipe($.rename(config.translations))
        .pipe(gulp.dest(config.dest));
});

gulp.task('templates', function () {
  return gulp.src(['views/*.html'])
    .pipe($.htmlmin({
        collapseWhitespace: true,
        removeComments: true,
    })).pipe($.angularTemplatecache({
        root:'/themes_assets/classic/views/',
        module: 'theme'
    }))
    .pipe($.rename(config.templates))
    .pipe(gulp.dest(config.dest));
});

// build `scripts` and `styles` for theme
// excludes external links, and runs `translations` and `templates` tasks before running build.
gulp.task('build', ['translations', 'templates'], function() {
    var externalUrlCheck = /^(http(s)?:)?\/\//;
    var theme = JSON.parse(fs.readFileSync('./theme.json')),
        build = {
            from: {
                scripts: [],
                styles: []
            }, to: {
                scripts: [],
                styles: []                
            }
        };
    
    if(theme.devScripts) {
        theme.devScripts.forEach(function(script) {
            // check if it is an external url, if so add it like that in final scripts.
            if(externalUrlCheck.test(script)) {
                build.to.scripts.push(script);
            } else {
                build.from.scripts.push(script);
            }
        });

        if(build.from.scripts.indexOf(config.get('translations')) === -1) {
            build.from.scripts.push(config.get('translations'));
        }

        if(build.from.scripts.indexOf(config.get('templates')) === -1) {
            build.from.scripts.push(config.get('templates'));
        }
        gulp.src(build.from.scripts)
            .pipe($.concat(config.script))
            .pipe($.uglify())
            .pipe(gulp.dest(config.dest));
        build.to.scripts.push(config.get('script'));
        theme.scripts = build.to.scripts;
    }
    if(theme.devStyles) {
        theme.devStyles.forEach(function(style) {
            // check if it is an external url, if so add it like that in final scripts.
            if(externalUrlCheck.test(style)) {
                build.to.styles.push(style);
            } else {
                build.from.styles.push(style);
            }
        });
        gulp.src(build.from.styles)
            .pipe($.concat(config.style))
            .pipe($.cleanCss())
            .pipe(gulp.dest(config.dest));
        build.to.styles.push(config.get('style'));
        theme.styles = build.to.styles;
    }
    // automatic `patch` increase in `version`.
    if(theme.version) {
        var version = theme.version.split('.');
        if(version[2]) {
            version[2] = parseInt(version[2], 10) + 1;
        }
        theme.version = version.join('.');
    }
    fs.writeFileSync('./theme.json', JSON.stringify(theme, null, 4));
});

var zipTask = function(){
    var theme = JSON.parse(fs.readFileSync('./theme.json')),
        name = 'lb-theme';
    if(theme.name) {
        name = name + '-' + theme.name;
    }
    if(theme.version) {
        name = name + '-' + theme.version;
    }
    var zipdest = '..', i = process.argv.indexOf("--zipdest");
    if(i>-1) {
        zipdest = process.argv[i+1];
    }

    return gulp.src(['./**','!./node_modules','!./node_modules/**', '!./.git/**', '!./__MACOSX', '!./__MACOSX/**', '!./.DS_Store'])
    // in this way it goes from 7sec to 300ms zip time,
    // but the folder structure isn't  keept.
    // @TODO: check more.
    // return gulp.src(['./dist/**','./images/**', './po/**','./styles/**','./vendors/**', './views/**', '*.*'])
        .pipe($.zip(name + '.zip'))
        .pipe(gulp.dest(zipdest));
};

gulp.task('zip', zipTask);

gulp.task('make',['build'], zipTask);