'use strict';

var DEBUG = process.env.NODE_ENV !== "production";
var defaultThemePath = './node_modules/liveblog-default-theme/';
var testdata = require(defaultThemePath + 'test');
var gulp = require('gulp')
  , plugins = require('gulp-load-plugins')()
  , path = require('path')
  , fs = require('fs')
  , nunjucks = require('nunjucks')
  , dateFilter = require('nunjucks-date-filter')
  , purify = require('gulp-purifycss')
  , cleanCSS = require('gulp-clean-css')
  , amphtmlValidator = require('amphtml-validator');

// Init nunjucks.
var nunjucksTemplates = [path.resolve(__dirname, './templates/'), defaultThemePath + 'templates/']
  , nunjucksLoader = new nunjucks.FileSystemLoader(nunjucksTemplates)
  , nunjucksEnv = new nunjucks.Environment(nunjucksLoader);

// Add nunjucks-date-filter and set default date format.
// TODO: get date format from theme settings.
dateFilter.setDefaultFormat('dddd, MMMM Do, YYYY, h:MM:ss A');
nunjucksEnv.addFilter('date', dateFilter);

// nunjucks options.
var nunjucksOptions = {
  env: nunjucksEnv
};

// Local paths.
var paths = {
  templates: 'templates/*.html',
  css: 'css/*.css',
  less: 'less/*.less'
};
const BUILD_HTML = './index.html';

// Command-line and default theme options from theme.json.
var theme = require('./theme.json');

// Utility function to get theme settings default values.
function getThemeSettings(options) {
  var _options = {};
  for (var option in options) {
    _options[option.name] = option.default;
  }
  return _options;
}

// JS linter.
gulp.task('lint', () => gulp.src(['gulpfile.js'])
  .pipe(plugins.eslint({ quiet: true }))
  .pipe(plugins.eslint.format())
  .pipe(plugins.eslint.failAfterError())
);

// Inject API response into template for dev/test purposes.
gulp.task('index-inject', [], () => {
  var task = gulp.src('./templates/template-index.html')
    .pipe(plugins.nunjucks.compile({
      theme: testdata.options,
      json_options: JSON.stringify(testdata.options, null, 4),
      settings: testdata.options.settings,
      api_response: {posts: testdata.api_response},
      include_js_options: true,
      debug: DEBUG
    }, nunjucksOptions))
    .pipe(gulp.src('./less/liveblog.less')
      .pipe(plugins.less({
        paths: [path.join(__dirname, 'less', 'includes')]
      }))
      .pipe(purify([BUILD_HTML]))
      .pipe(cleanCSS())
      .pipe(gulp.dest('./build/amp/'))
      .pipe(plugins.inject(gulp.src(['./build/amp/*.css']), {
        starttag: '<!-- inject:amp-styles -->',
        transform: function(filepath, file) {
          return file.contents.toString();
        },
        removeTags: true

      })
    )
  )
  .pipe(plugins.rename("index.html"))
  .pipe(gulp.dest('.'))
  .pipe(plugins.connect.reload());
  return task;
});

// Inject jinja/nunjucks template for production use.
gulp.task('template-inject', [], () => {
  var themeSettings = getThemeSettings(theme.options);

  return gulp.src('./templates/template.html')
    .pipe(plugins.nunjucks.compile({
      options: theme,
      json_options: JSON.stringify(theme, null, 4),
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

/*
 * Validate if AMP markup is valid
 * From: https://github.com/uncompiled/amp-bootstrap-example/
 */
gulp.task('amp-validate', [], () => {
  amphtmlValidator.getInstance().then((validator) => {
    var input = fs.readFileSync(BUILD_HTML, 'utf8');
    var result = validator.validateString(input);
    (result.status === 'PASS' ? console.info : console.error)(BUILD_HTML + ": " + result.status);
    for (var ii = 0; ii < result.errors.length; ii++) {
      var error = result.errors[ii];
      var msg = 'line ' + error.line + ', col ' + error.col + ': ' + error.message;
      if (error.specUrl !== null) {
        msg += ' (see ' + error.specUrl + ')';
      }
      (error.severity === 'ERROR' ? console.error : console.warn)(msg);
    }
  });
});

// Serve index.html for local testing.
gulp.task('serve', ['index-inject'], () => {
  plugins.connect.server({
    port: 8008,
    root: '.',
    fallback: 'index.html',
    livereload: true
  });
});

// Watch
gulp.task('watch-static', ['serve'], () => {
  var templates = gulp.watch(paths.templates, ['index-inject', 'template-inject']);
  templates.on('error', (e) => {
    console.error(e.toString());
  });
});

// Default build.
gulp.task('default', ['index-inject', 'template-inject']);
