'use strict';

var DEBUG = process.env.NODE_ENV != "production";

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
  , eslint = require('gulp-eslint')
  , fs = require('fs');

var nunjucksOptions = {
  env: require('./js/nunjucks_extensions').nunjucksEnv
}

var paths = {
  less: 'less/*.less',
  js : ['js/*.js', 'js/*/*.js'],
  jsfile: 'liveblog.js',
  cssfile: 'liveblog.css',
  templates: 'templates/*.html'
};

// Command-line and default theme options from theme.json.
var theme = require('./theme.json');

function getThemeSettings(options) {
  var _options = {}
  for (var option in options) {
    _options[option.name] = option.default;
  }
  return _options;
}


// Function to async reload default theme options.
function loadThemeJSON() {
  fs.readFile('theme.json', 'utf8', function (err, data) {
    theme = JSON.parse(data);
  });
}

gulp.task('lint', () => {
  return gulp.src(['js/**/*.js','!node_modules/**'])
    .pipe(eslint({ quiet: true }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// Browserify.
gulp.task('browserify', ['clean-js'], function(cb) {
  var b = browserify({
    entries: './js/liveblog.js',
    fullPaths: true,
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

// Compile LESS files.
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

// Inject API response into template for dev/test purposes.
gulp.task('index-inject', ['less', 'browserify'], function() {
  var testdata = require('./test');
  var sources = gulp.src(['./dist/*.js', './dist/*.css'], {
    read: false // We're only after the file paths
  });

  return gulp.src('./templates/template-index.html')
    .pipe(plugins.inject(sources))
    .pipe(plugins.nunjucks.compile({
      theme: testdata.options,
      theme_json: JSON.stringify(testdata.options, null, 4),
      settings: testdata.options.theme_settings,
      api_response: testdata.api_response,
      include_js_options: true,
      debug: DEBUG
    }, nunjucksOptions))

    .pipe(plugins.rename("index.html"))
    .pipe(gulp.dest('.'))
    .pipe(plugins.connect.reload());
});

// Inject jinja/nunjucks template for production use.
gulp.task('template-inject', ['less', 'browserify'], function() {
  var themeSettings = getThemeSettings(theme.options);

  var _api_response = {};
  var sources = gulp.src(['./dist/*.js', './dist/*.css'], {
    read: false // We're only after the file paths
  });

  return gulp.src('./templates/template.html')
    .pipe(plugins.nunjucks.compile({
      theme: theme,
      theme_json: JSON.stringify(theme, null, 4),
      settings: themeSettings,
      include_js_options: false,
      debug: DEBUG
    }))

    // Add nunjucks/jinja2 template for server-side processing.
    .pipe(plugins.inject(gulp.src(['./templates/template-timeline.html']), {
      starttag: '<!-- inject:template-content -->',
      transform: function(filepath, file) {
        return file.contents.toString();
      }
    }))

    // Save base template.html file.
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
  loadThemeJSON();
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
gulp.task('watch-static', ['serve'], function() {
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
