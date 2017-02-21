'use strict';
var DEBUG = false;

var gulp = require('gulp')
  , browserify = require('browserify')
  , nunjucksify = require('nunjucksify')
  , gulpLoadPlugins = require('gulp-load-plugins')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  , plugins = gulpLoadPlugins()
  , path = require('path')
  , del = require('del');

var paths = {
  less: 'less/*.less',
  js : ['js/*.js', 'js/*/*.js'],
  jsfile: 'liveblog.js',
  cssfile: 'liveblog.css',
  templates: 'templates/*.html'
};

// Browserify
gulp.task('browserify', ['clean-js'], function(cb) {
  var b = browserify({
    entries: './js/liveblog.js',
    debug: DEBUG
  });

  var rewriteFilenames = function(filename) {
    var parts = filename.split("/");
    return parts[parts.length-1]
  };

  // Source-mapped
  return b
    .transform(nunjucksify, {
      extension: '.html',
      nameFunction: rewriteFilenames
    })
    .bundle()
    .on('error', plugins.util.log)
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
gulp.task('less', ['clean-css'], function () {
  return gulp.src('./less/liveblog.less')
    .pipe(plugins.less({
      paths: [path.join(__dirname, 'less', 'includes')]
    }))

    .pipe(plugins.if(!DEBUG, plugins.minifyCss({compatibility: 'ie8'})))
    .pipe(plugins.rev())
    .pipe(gulp.dest('./dist'))
    .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
    .pipe(gulp.dest(''));
});

// Inject API response into template for dev/test purposes
gulp.task('index-inject', ['less', 'browserify'], function() {
  var testdata = require('./test');
  var sources = gulp.src(['./dist/*.js', './dist/*.css'], {
    read: false // We're only after the file paths
  });

  return gulp.src('./templates/template-index.html')
    .pipe(plugins.inject(sources))
    .pipe(plugins.nunjucks.compile({
      api_response: testdata.grammy_awards,
      options: JSON.stringify(testdata.options, null, 4)
    }))

    .pipe(plugins.rename("index.html"))
    .pipe(gulp.dest('.'))
    .pipe(plugins.connect.reload());
});

// Replace assets paths in theme.json
gulp.task('theme-replace', ['browserify', 'less'], function() {
  var manifest = require("./dist/rev-manifest.json");
  var base = './';

  gulp.src('theme.json', {base: base})
    .pipe(plugins.replace(/liveblog-.*\.css/g, manifest[paths.cssfile]))
    .pipe(plugins.replace(/liveblog-.*\.js/g, manifest[paths.jsfile]))
    .pipe(gulp.dest(base));
});

// Serve
gulp.task('serve', ['browserify', 'less', 'index-inject'], function() {
  plugins.connect.server({
    port: 8008,
    root: '.',
    fallback: 'index.html',
    livereload: true
  });
});

// Watch
gulp.task('watch-static', ['debug', 'serve'], function() {
  var js = gulp.watch(paths.js, ['browserify', 'index-inject'])
    , less = gulp.watch(paths.less, ['less', 'index-inject'])
    , templates = gulp.watch(paths.templates, ['index-inject']);

  [js, less, templates].forEach(function(el, i) {
    el.on('error', function(e) {
      console.log(e.toString())
    });
  })
});

// Set debug 
gulp.task('set-debug', function() {
  DEBUG = true;
});

// Clean CSS
gulp.task('clean-css', function() {
  return del(['dist/*.css'])
});

// Clean JS
gulp.task('clean-js', function() {
  return del(['dist/*.js'])
});

// Default build for production
gulp.task('default', ['browserify', 'less', 'theme-replace', 'index-inject']);
gulp.task('debug', ['set-debug', 'browserify', 'less', 'index-inject']);
