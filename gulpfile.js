'use strict';

var gulp = require('gulp')
  , browserify = require('browserify')
  , gulpLoadPlugins = require('gulp-load-plugins')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  , plugins = gulpLoadPlugins()
  , path = require('path')
  , del = require('del');

var DEBUG = false;

var paths = {
  less: 'less/*.less',
  js : ['js/*.js', 'js/*/*.js'],
  html : ['*.html'],
  jsfile: 'dpa-liveblog.js',
  cssfile: 'dpa-liveblog.css'
};

gulp.task('inject-index', ['browserify', 'less'], function () {
  var target = gulp.src('index.html');
  var sources = gulp.src(['./dist/*.js', './dist/*.css'], {
    read: false // We're only after the file paths
  });

  var template = gulp.src(['template.html'], {
      starttag: '<!-- inject:template -->',
      transform: function (filePath, file) {
        // return file contents as string
        return file.contents.toString('utf8')
      }
    })

  return target
    .pipe(plugins.inject(sources))
    .pipe(plugins.inject(template))
    .pipe(gulp.dest('.'));
});


// Browserify
gulp.task('browserify', function() {
  var b = browserify({
    entries: './js/dpa-liveblog.js',
    debug: DEBUG
  });

  // Source-mapped
  return b
    .bundle()
    .pipe(source(paths.jsfile))
    .pipe(buffer())
    .pipe(plugins.rev())
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.if(!DEBUG, plugins.uglify()))
    .pipe(gulp.dest('./dist/'))
    .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
    .pipe(gulp.dest(''));
});

// Compile LESS files
gulp.task('less', function () {
  return gulp.src('./less/dpa-liveblog.less')
    .pipe(plugins.less({
      paths: [path.join(__dirname, 'less', 'includes')]
    }))
    .pipe(plugins.if(!DEBUG, plugins.minifyCss({compatibility: 'ie8'})))
    .pipe(plugins.rev())
    .pipe(gulp.dest('./dist'))
    .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
    .pipe(gulp.dest(''));
});


// Replace assets paths in theme.json
gulp.task('theme-replace', ['browserify', 'less'], function() {
  var manifest = require("./dist/rev-manifest.json");
  var base = './';
  gulp.src('theme.json', {base: base})
    .pipe(plugins.replace(paths.cssfile, manifest[paths.cssfile]))
    .pipe(plugins.replace(paths.jsfile, manifest[paths.jsfile]))
    .pipe(gulp.dest(base));
});

// Watch
gulp.task('watch', function() {
  DEBUG = true;
  var jswatch = gulp.watch(paths.js, ['browserify']);
  var lesswatch = gulp.watch(paths.less, ['less']);
  var htmlwatch = gulp.watch(paths.html, ['inject-index']);

  [jswatch, lesswatch, htmlwatch].forEach(function(el, i) {
    el.on('error', function(e) {
      console.log(e.toString())
    });
  });
});

// Clean
gulp.task('set-debug', function(cb) {
  DEBUG = true;
});

// Clean
gulp.task('clean', function(cb) {
  del(['css/*', 'dist/*'], cb)
});

// Default build for production
gulp.task('default', ['clean', 'browserify', 'less', 'theme-replace']);
gulp.task('debug', ['clean', 'set-debug', 'browserify', 'less', 'inject-index']);

