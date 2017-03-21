'use strict';


var gulp = require('gulp')
  , browserify = require('browserify')
  , nunjucksify = require('nunjucksify')
  , gulpLoadPlugins = require('gulp-load-plugins')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  , plugins = gulpLoadPlugins()
  , path = require('path')
  , del = require('del')
  , minimist = require('minimist')
  , fs = require('fs');

var paths = {
  less: 'less/*.less',
  js : ['js/*.js', 'js/*/*.js'],
  jsfile: 'liveblog.js',
  cssfile: 'liveblog.css',
  templates: 'templates/*.html'
};

var defaultOptions = {
  boolean: 'debug',
  string: ['api_response', 'options'],
  debug: process.env.DEBUG || false,
  api_response: {},
  options: {}
};


// Command-line and default theme options from theme.json.
var options = minimist(process.argv.slice(2), defaultOptions);
var themeOptions = JSON.parse(fs.readFileSync('theme.json', 'utf8'));


// Function to async reload default theme options.
function loadThemeOptions() {
  fs.readFile('theme.json', 'utf8', function (err, data) {
    themeOptions = JSON.parse(data);
  });
}


// Browserify.
gulp.task('browserify', ['clean-js'], function(cb) {
  var b = browserify({
    entries: './js/liveblog.js',
    fullPaths: true,
    debug: options.DEBUG
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
    .pipe(plugins.if(!options.DEBUG, plugins.uglify()))
    .pipe(gulp.dest('./dist/'))
    .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
    .pipe(gulp.dest(''));
});


// Compile LESS files.
gulp.task('less', ['clean-css'], function () {
  return gulp.src('./less/liveblog.less')
    .pipe(plugins.less({
      paths: [path.join(__dirname, 'less', 'includes')]
    }))

    .pipe(plugins.if(!options.DEBUG, plugins.minifyCss({compatibility: 'ie8'})))
    .pipe(plugins.rev())
    .pipe(gulp.dest('./dist'))
    .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
    .pipe(gulp.dest(''));
});

// Inject API response into template for dev/test purposes.
gulp.task('index-inject', ['less', 'browserify'], function() {
  var testdata = require('./test');
  var sources = gulp.src(['./dist/*.js', './dist/*.css'], {
    read: false // We're only after the file paths
  });

  return gulp.src('./templates/template-index.html')
    .pipe(plugins.inject(sources))
    .pipe(plugins.nunjucks.compile({
      api_response: testdata.grammy_awards,
      theme_settings: testdata.options.theme_settings,
      options: JSON.stringify(testdata.options, null, 4),
      theme_options: testdata.options,
      debug: options.DEBUG
    }))

    .pipe(plugins.rename("index.html"))
    .pipe(gulp.dest('.'))
    .pipe(plugins.connect.reload());
});


// Inject jinja/nunjucks template for production use.
gulp.task('template-inject', ['less', 'browserify'], function() {
  var _options = themeOptions;
  var _api_response = {};
  var sources = gulp.src(['./dist/*.js', './dist/*.css'], {
    read: false // We're only after the file paths
  });

  var _theme_settings = _options.theme_settings || {};

  return gulp.src('./templates/template-base.html')
    .pipe(plugins.nunjucks.compile({
      theme_settings: _theme_settings,
      theme_options: _options.options,
      debug: options.DEBUG
    }))

    // Add nunjucks/jinja2 template for server-side processing.
    .pipe(plugins.inject(gulp.src(['./templates/template-timeline.html']), {
      starttag: '<!-- inject:template-timeline -->',
      transform: function(filepath, file) {
        return file.contents.toString();
      }
    }))

    .pipe(plugins.rename("template.html"))
    .pipe(gulp.dest('.'))
    .pipe(plugins.connect.reload());
});


// Replace assets paths in theme.json file and reload options.
gulp.task('theme-replace', ['browserify', 'less'], function() {
  var manifest = require("./dist/rev-manifest.json");
  var base = './';

  gulp.src('theme.json', {base: base})
    .pipe(plugins.replace(/liveblog-.*\.css/g, manifest[paths.cssfile]))
    .pipe(plugins.replace(/liveblog-.*\.js/g, manifest[paths.jsfile]))
    .pipe(gulp.dest(base));

  // Reload theme options
  loadThemeOptions();
});


// Serve index.html for local testing.
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


// Clean CSS
gulp.task('clean-css', function() {
  return del(['dist/*.css'])
});


// Clean JS
gulp.task('clean-js', function() {
  return del(['dist/*.js'])
});


// Default build for production
gulp.task('default', ['browserify', 'less', 'theme-replace', 'template-inject']);


// Default build for development
gulp.task('devel', ['browserify', 'less', 'theme-replace', 'index-inject']);
