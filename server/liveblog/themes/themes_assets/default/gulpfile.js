'use strict';

var gulp = require('gulp')
  , browserify = require('browserify')
  , nunjucksify = require('nunjucksify')
  , gulpLoadPlugins = require('gulp-load-plugins')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  , plugins = gulpLoadPlugins()
  , del = require('del')
  , eslint = require('gulp-eslint')
  , fs = require('fs')
  , path = require('path')
  , nunjucks = require('nunjucks')
  , dateFilter = require('nunjucks-date-filter')
  , purify = require('gulp-purifycss')
  , cleanCSS = require('gulp-clean-css')
  , amphtmlValidator = require('amphtml-validator');

const cwd = process.cwd();
// Command-line and default theme options from theme.json.
var theme = require(path.resolve(cwd, './theme.json'));
var node_env = plugins.util.env.NODE_ENV ?
                    plugins.util.env.NODE_ENV :
                    process.env.NODE_ENV;
const DEBUG =  node_env!== "production";
const inputPath = theme.extends ? `./node_modules/liveblog-${theme.extends}-theme/` : '';


let argvKey = 0,
  apiHost = '',
  blogId = '',
  protocol = '',
  apiResponse = {
    posts: {_items: []},
    stickyPosts: {_items: []}
  },
  match = [];

const http = require('http');
const https = require('https');

['--embedUrl', '--apiUrl'].forEach((argName) => {
  if (process.argv.indexOf(argName) !== -1) {
    argvKey = process.argv.indexOf(argName)+1;
  }
});

if (argvKey !== 0) {
  match = process.argv[argvKey]
    //.match(/^(http:\/\/|https:\/\/|\/\/)([^/]+)\/(api\/client_blogs|embed)\/(\w+)/i);
    .match(/^(http:\/\/|https:\/\/|\/\/)([^\/]+)\/(api\/client_blogs|embed|[^\/]+\/blogs)\/(\w+)/i);
}

if (match.length > 0) {
  [,protocol, apiHost,, blogId] = match;

  const postsEndpoint = `${protocol}${apiHost}/api/client_blogs/${blogId}/posts`;
  const request = protocol === 'http://' ? http : https;

  let query = {
    "query": {
      "filtered": {
        "filter": {
          "and": [
            {"term": {"sticky": true}},
            {"term": {"post_status": "open"}},
            {"not": {"term": {"deleted": true}}}
          ]
        }
      }
    },
    "sort": [
      {
        "_updated": {"order": "desc"}
      }
    ]
  };

  request.get(`${postsEndpoint}?source=${JSON.stringify(query)}`, (response) => {
    let body = '';

    response.on('data', (d) => {
      body += d;
    });
    response.on('end', () => {
      apiResponse.stickyPosts = JSON.parse(body);
    });
  });

  query.query.filtered.filter.and[0].term.sticky = false;

  request.get(`${postsEndpoint}?source=${JSON.stringify(query)}`, (response) => {
    let body = '';

    response.on('data', (d) => {
      body += d;
    });
    response.on('end', () => {
      apiResponse.posts = JSON.parse(body);
    });
  });
}

const templatePath = [
    path.resolve(__dirname, '../../templates'),
    path.resolve(__dirname, 'templates')
  ],
  nunjucksLoader = new nunjucks.FileSystemLoader(templatePath),
  nunjucksEnv = new nunjucks.Environment(nunjucksLoader);

// Add nunjucks-date-filter and set default date format.
// TODO: get date format from theme settings.
dateFilter.setDefaultFormat('dddd, MMMM Do, YYYY, h:MM:ss A');
nunjucksEnv.addFilter('date', dateFilter);

// nunjucks options.
const nunjucksOptions = {
  env: nunjucksEnv
};

const paths = {
  less: 'less/*.less',
  js: ['js/*.js', 'js/*/*.js'],
  jsfile: 'liveblog.js', // Browserify basedir
  cssfile: path.resolve(inputPath, 'liveblog.css'),
  templates: path.resolve(inputPath, 'templates/*.html')
};
const BUILD_HTML = './index.html';

function getThemeSettings(options) {
  var _options = {};
  for (var option in options) {
    _options[option.name] = option.default;
  }
  return _options;
}


// Function to async reload default theme options.
function loadThemeJSON() {
  fs.readFile(path.resolve(cwd, 'theme.json'), 'utf8', (err, data) => {
    theme = JSON.parse(data);
  });
}

gulp.task('lint', () => gulp.src([path.resolve(inputPath, 'js/**/*.js'),path.resolve(inputPath, 'gulpfile.js')])
  .pipe(eslint({ quiet: true }))
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
);

//gulp.task('move-templates', () => gulp.src(inputPath + 'templates/*.html')
//  .pipe(gulp.dest(inputPath + 'templates-dist')));

//gulp.task('move-subtemplates', ['move-templates'], () => gulp.src('./templates/*.html')
//  .pipe(gulp.dest(inputPath + 'templates-dist')));

// Browserify.
let browserifyPreviousTasks = ['clean-js'];

//if (process.env.EXTENDED_MODE) {
//  browserifyPreviousTasks.push('move-subtemplates');
//}

gulp.task('browserify', browserifyPreviousTasks, (cb) => {
  if (theme.ampTheme) {
    return gulp.src('.').pipe(plugins.util.noop());
  }
  var b = browserify({
    basedir: inputPath,
    entries: 'js/liveblog.js',
    fullPaths: true,
    debug: DEBUG
  });

  var rewriteFilenames = function(filename) {
    var parts = filename.split("/");
    return parts[parts.length - 1];
    //return filename;
  };

  // Source-mapped
  return b
    .transform("babelify", {presets: ["es2015"]})
    .transform(nunjucksify, {
      extension: '.html',
      nameFunction: rewriteFilenames
    })
    .bundle()
    .on('error', plugins.util.log)
    .pipe(source(paths.jsfile))
    .pipe(buffer())
    .pipe(plugins.concat(`${theme.name}.js`))
    .pipe(plugins.rev())
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.if(!DEBUG, plugins.uglify()))
    .pipe(gulp.dest('./dist'))
    .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
    .pipe(gulp.dest('.'));
});

// Compile LESS files.
gulp.task('less', ['clean-css'], () => { 
  var lessFiles = [];
  // Name of the less theme file.
  let themeLess = `./less/${theme.name}.less`;
  // Compile all the files under the less folder if no theme less file pressent.
  lessFiles.push(fs.existsSync(themeLess) ? themeLess : './less/*.less');

  if ( !theme.onlyOwnCss && theme.extends ) {
    let themeLess = path.resolve(inputPath,`./less/${theme.extends}.less`);
    lessFiles.push(fs.existsSync(themeLess) ? themeLess : path.resolve(inputPath,'./less/*.less'));
  }

  return gulp.src(lessFiles)
    .pipe(plugins.less({
      paths: [path.resolve(inputPath, 'less')]
    }))
    .pipe(plugins.if(!DEBUG, plugins.minifyCss({compatibility: 'ie8'})))
    .pipe(plugins.concat(`${theme.name}.css`))
    .pipe(plugins.rev())
    .pipe(gulp.dest('./dist'))
    .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
    .pipe(gulp.dest('.'));
});


// Inject API response into template for dev/test purposes.
gulp.task('index-inject', ['less', 'browserify'], () => {
  var testdata = require(path.resolve(inputPath,'./test'));
  var sources = gulp.src(['./dist/*.js', './dist/*.css'], {
    read: false // We're only after the file paths
  });

  if (apiResponse.posts._items.length > 0) {
    testdata.options.api_host = `${protocol}${apiHost}`;
    testdata.options.blog._id = blogId;
  }
  var index = `./templates/template-index.html`;
  var indexTask = gulp.src(fs.existsSync(index) ? index : path.resolve(inputPath,index))
    .pipe(plugins.inject(sources))
    .pipe(plugins.nunjucks.compile({
      options: testdata.options,
      json_options: JSON.stringify(testdata.options, null, 4),
      settings: testdata.options.settings,
      api_response: apiResponse.posts._items.length > 0 ? apiResponse : testdata.api_response,
      include_js_options: true,
      debug: DEBUG
    }, apiResponse.posts._items.length > 0 ? {} : nunjucksOptions));

  if (theme.ampTheme) {
    let lessFiles = [],
      themeLess = path.resolve(cwd, `./less/${theme.extends}.less`);
    lessFiles.push(fs.existsSync(themeLess) ? themeLess : path.resolve(cwd,'./less/*.less'));

    indexTask = indexTask.pipe(gulp.src(lessFiles)
      .pipe(plugins.less({
        paths: [path.resolve(inputPath, 'less')]
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
      }))
    );
  }
  return indexTask.pipe(plugins.rename("index.html"))
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


// Inject jinja/nunjucks template for production use.
gulp.task('template-inject', ['less', 'browserify'], () => {
  var themeSettings = getThemeSettings(theme.options);

  let templates = [];
  let timeline = `./templates/template-timeline.html`;
  templates.push(fs.existsSync(timeline) ? timeline : path.resolve(inputPath,timeline));
  let main = `./templates/template.html`;
  main = fs.existsSync(main) ? main : path.resolve(inputPath,main);
  return gulp.src(main)
    .pipe(plugins.nunjucks.compile({
      theme: theme,
      theme_json: JSON.stringify(theme, null, 4),
      settings: themeSettings,
      include_js_options: false,
      debug: DEBUG
    }))

    // Add nunjucks/jinja2 template for server-side processing.
    .pipe(plugins.inject(gulp.src(templates), {
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
gulp.task('theme-replace', ['browserify', 'less'], () => {
  var manifest = require(path.resolve(cwd, "./dist/rev-manifest.json"));
  var base = './',
    cssName = new RegExp(`${theme.name}-.*\.css`, 'g'),
    jsName = new RegExp(`${theme.name}-.*\.js`, 'g');
  gulp.src('theme.json', {base: base})
    .pipe(plugins.replace(cssName, manifest[paths.cssfile] || manifest[`${theme.name}.css`]))
    .pipe(plugins.replace(jsName, manifest[paths.jsfile] || manifest[`${theme.name}.js`]))
    .pipe(plugins.replace(/"version":\s*"(\d+\.\d+\.)(\d+)"/,(a, p, r) => `"version": "${p}${++r}"`))
    .pipe(gulp.dest(base));

  // Reload theme options
  loadThemeJSON();
});

gulp.task('serve', ['browserify', 'less', 'index-inject'], () => {
  plugins.connect.server({
    port: 8008,
    root: '.',
    fallback: 'index.html',
    livereload: true
  });
});

// Watch
gulp.task('watch-static', ['serve'], () => {
  var js = gulp.watch(paths.js, ['browserify', 'index-inject'])
    , less = gulp.watch(paths.less, ['less', 'index-inject'])
    , templates = gulp.watch(paths.templates, ['index-inject']);

  [js, less, templates].forEach((el, i) => {
    el.on('error', (e) => {
      console.error(e.toString());
    });
  });
});

// Clean CSS
gulp.task('clean-css', () => del(['dist/*.css']));

// Clean JS
gulp.task('clean-js', () => del(['dist/*.js']));

gulp.task('default', ['browserify', 'less', 'theme-replace', 'template-inject']);

// Default build for development
gulp.task('devel', ['browserify', 'less', 'theme-replace', 'index-inject']);

module.exports = gulp;