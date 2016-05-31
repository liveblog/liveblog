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
  html : ['*.html']
};

gulp.task('inject-index', function(cb) {
  gulp.src('index.html')
    .pipe(plugins.inject(gulp.src(['template.html']), {
      starttag: '<!-- inject:template -->',
      transform: function (filePath, file) {
        // return file contents as string
        return file.contents.toString('utf8')
      }
    }))
    .pipe(gulp.dest('.')); // Save to working dir
    cb()
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
    .pipe(source('dpa-liveblog.js'))
    .pipe(buffer())
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.if(!DEBUG, plugins.uglify()))
    .pipe(gulp.dest('./dist/'));
});

// Compile LESS files
gulp.task('less', function () {
  return gulp.src('./less/*.less')
    .pipe(plugins.less({
      paths: [path.join(__dirname, 'less', 'includes')]
    }))
    .pipe(plugins.if(
      !DEBUG, plugins.minifyCss({
        compatibility: 'ie8'
      })))
    .pipe(gulp.dest('./css'));
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
gulp.task('default', ['clean', 'browserify', 'less']);
gulp.task('debug', ['clean', 'set-debug', 'browserify', 'less', 'inject-index']);

