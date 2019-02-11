'use strict';

const gulp = require('gulp');
const browserify = require('browserify');
const plugins = require('gulp-load-plugins')();
const del = require('del');
const path = require('path');
const nunjucks = require('nunjucks');
const dateFilter = require('nunjucks-date-filter');

const { ThemeTemplatesLoader } = require('liveblog-shared-tools');
const { ampifyFilter, addtenFilter } = require('./misc/filters');

// import all gulp tasks
const { ampValidate } = require('./tasks/amp');
const { wireDeps, bundleJs, compileLess, doBrowserify } = require('./tasks/assets');
const { indexInject, templateInject, themeReplace } = require('./tasks/injecting');
const { precompileParentTemplates, precompileThemeTemplates } = require('./tasks/templates');
const { SYSTEM_THEMES } = require('./tasks/constants');

const CWD = process.cwd();

// Command-line and default theme options from theme.json.
let theme = {};
const loadThemeJSON = () => {
  theme = require(path.resolve(`${CWD}/theme.json`));
};
loadThemeJSON();

const inputPath = theme.extends ?
  path.resolve(`${CWD}/node_modules/liveblog-${theme.extends}-theme/`) :
  path.resolve(`${CWD}/`);

const { options } = require(path.resolve(`${CWD}/test`));

let argvKey = 0;
let apiHost = "";
let blogId = "";
let protocol = "";
let apiResponse = {
  posts: {
    _items: []
  },
  stickyPosts: {
    _items: []
  }
};
let match = [];

const http = require('http');
const https = require('https');

['--embedUrl', '--apiUrl'].forEach((argName) => {
  if (process.argv.indexOf(argName) !== -1) {
    argvKey = process.argv.indexOf(argName)+1;
  }
});

if (argvKey !== 0) {
  match = process.argv[argvKey]
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
  const { postsPerPage } = options.blog.theme_settings;

  request.get(`${postsEndpoint}?max_results=${postsPerPage}&source=${JSON.stringify(query)}`, (response) => {
    let body = '';

    response.on('data', (d) => {
      body += d;
    });
    response.on('end', () => {
      apiResponse.posts = JSON.parse(body);
    });
  });
}

const themeTemplatersLoader = new ThemeTemplatesLoader(theme);
const nunjucksEnv = new nunjucks.Environment(themeTemplatersLoader);

// Add nunjucks-date-filter and set default date format.
// TODO: get date format from theme settings.
dateFilter.setDefaultFormat('dddd, MMMM Do, YYYY, h:MM:ss A');
nunjucksEnv.addFilter('date', dateFilter);
nunjucksEnv.addFilter('ampify', ampifyFilter);
nunjucksEnv.addFilter('addten', addtenFilter);


// TODO: add docstrings after merge default theme refactor
const ampSupport = (item) => {
  const itemTypeFilter = (obj) => {
    const supported = ["Scorecard", "Advertisement Local"];
    return supported.indexOf(obj.item['item_type']) !== -1
  }

  if (item['groups'] && item['groups'][1]['refs']) {
    let itemsList = item['groups'][1]['refs']

    // let's extract freetypes and then remove the allowed
    let freetypes = itemsList.filter(x => x.item['group_type'] == "freetype")
    let notSupported = freetypes.filter(itemTypeFilter)

    if (notSupported.length > 0)
        return false;
  }

  return true;
}

nunjucksEnv.addFilter('ampsupport', ampSupport);


// nunjucks options.
nunjucks.env = nunjucksEnv;

const paths = {
  less: 'less/*.less',
  js: ['js/*.js', 'js/*/*.js'],
  jsfile: 'liveblog.js', // Browserify basedir
  cssfile: path.resolve(inputPath, 'liveblog.css'),
  templates: path.resolve(inputPath, 'templates/*.html')
};

gulp.task('lint', () =>
  gulp.src([
    path.resolve(inputPath, 'js/**/*.js'),
    path.resolve(inputPath, 'gulpfile.js')
  ])
  .pipe(plugins.eslint({ quiet: true }))
  .pipe(plugins.eslint.format())
  .pipe(plugins.eslint.failAfterError())
);


gulp.task('precomp-parent-templates', precompileParentTemplates(theme, nunjucksEnv));

gulp.task('precomp-theme-templates', precompileThemeTemplates(theme, nunjucksEnv));

gulp.task('browserify', ['clean-js'], doBrowserify(theme, paths, inputPath));

gulp.task('bundle-templates', ['precomp-parent-templates', 'precomp-theme-templates']);

gulp.task('bundlejs', ['bundle-templates', 'browserify'], bundleJs(theme));

gulp.task('less', ['clean-css'], compileLess(theme, inputPath));

gulp.task('amp-validate', [], ampValidate);

// Inject API response into template for dev/test purposes.
gulp.task('index-inject', ['less', 'bundlejs'], indexInject(theme, apiResponse, nunjucksEnv, inputPath));

// Inject jinja/nunjucks template for production use.
gulp.task('template-inject', ['less', 'bundlejs'], templateInject(theme, inputPath));

// Replace assets paths in theme.json file and reload options.
gulp.task('theme-replace', ['bundlejs', 'less'], themeReplace(theme, paths, loadThemeJSON));

gulp.task('server', ['install', 'bundlejs', 'less', 'index-inject'], () => {
  plugins.connect.server({
    port: 8008,
    root: '.',
    fallback: 'index.html',
    livereload: true
  });
});

// Watch
gulp.task('watch-static', ['server'], () => {
  var js = gulp.watch(paths.js, ['bundlejs', 'index-inject'])
    , less = gulp.watch(paths.less, ['less', 'index-inject'])
    , templates = gulp.watch(paths.templates, ['index-inject']);

  [js, less, templates].forEach((el, i) => {
    el.on('error', (e) => {
      console.error(e.toString());
    });
  });
});

gulp.task('install', [], () => {
  if (SYSTEM_THEMES.indexOf(theme.name) === -1)
    plugins.util.log('ATTENTION: Make sure you ran gulp wire-deps before install step');

  gulp.src([path.resolve(`${CWD}/package.json`)]).pipe(plugins.install());
});

gulp.task('wire-deps', [], wireDeps(theme));

gulp.task('set-production', () => { process.env.NODE_ENV = "production"; });

gulp.task('clean-css', () => del(['dist/*.css']));

gulp.task('clean-js', () => del(['dist/*.js']));

gulp.task('production', ['install', 'bundlejs', 'less', 'theme-replace', 'template-inject']);

gulp.task('default', ['set-production', 'production']);

// Default build for development
gulp.task('devel', ['install', 'bundlejs', 'less', 'theme-replace', 'index-inject']);

module.exports = gulp;
