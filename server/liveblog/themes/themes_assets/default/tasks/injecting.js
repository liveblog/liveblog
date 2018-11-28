const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();

const { lessCommon } = require('./assets');
const { resolveResource, debugState } = require('./utils');

const CWD = process.cwd();


const indexInject = (theme, apiResponse, nunjucksEnv, inputPath) => {
  return () => {
    const DEBUG = debugState();

    var nunjucksOptions = { env: nunjucksEnv };
    var testdata = require(path.resolve(`${CWD}/test`));
    var sources = gulp.src(['./dist/*.js', './dist/*.css'], {
      read: false // We're only after the file paths
    });

    if (apiResponse.posts._items.length > 0) {
      testdata.options.api_host = `${protocol}${apiHost}`;
      testdata.options.blog._id = blogId;
    }

    const index = './templates/template-index.html';

    var indexTask = gulp.src(fs.existsSync(index) ? index : resolveResource(index, theme, CWD))
      .pipe(plugins.inject(sources))
      .pipe(plugins.nunjucks.compile({
        options: testdata.options,
        json_options: JSON.stringify(testdata.options, null, 4),
        settings: testdata.options.settings,
        api_response: apiResponse.posts._items.length > 0 ? apiResponse : testdata.api_response,
        include_js_options: true,
        debug: DEBUG
      }, nunjucksOptions));

    if (theme.ampTheme) {
      indexTask = indexTask.pipe(plugins.inject(
        lessCommon(false, theme, inputPath),
        {
          starttag: '<!-- inject:amp-styles -->',
          transform: function(filepath, file) {
            return file.contents.toString();
          },
          removeTags: true
        })
      );
    }
    return indexTask.pipe(plugins.rename('index.html'))
      .pipe(gulp.dest('.'))
      .pipe(plugins.connect.reload());
  }
}

const getThemeSettings = (options) => {
  var _options = {};
  for (var option in options) {
    _options[option.name] = option.default;
  }
  return _options;
}


/**
 * Inject jinja/nunjucks template for production use.
 * @param  {object} theme   Theme object settiings
 * @return {function}       Gulp compatible task
 */
const templateInject = (theme, inputPath) => {
  return () => {
    const DEBUG = debugState();

    let themeSettings = getThemeSettings(theme.options);
    let templates = [];
    let timeline = `./templates/template-timeline.html`;

    templates.push(fs.existsSync(timeline) ? timeline : resolveResource(timeline, theme, CWD));
    let main = `./templates/template.html`;
    main = fs.existsSync(main) ? main : resolveResource(main, theme, CWD);

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
      .pipe(plugins.rename('template.html'))
      .pipe(gulp.dest('.'))
      .pipe(plugins.connect.reload());
  }
}

const themeReplace = (theme, paths, callback) => {
  return () => {
    let manifest = require(path.resolve(CWD, "./dist/rev-manifest.json"));
    let base = './',
      cssName = new RegExp(`${theme.name}-.*\.css`, 'g'),
      jsName = new RegExp(`${theme.name}-.*\.js`, 'g');

    gulp.src('theme.json', { base: base })
      .pipe(plugins.replace(cssName, manifest[paths.cssfile] || manifest[`${theme.name}.css`]))
      .pipe(plugins.replace(jsName, manifest[paths.jsfile] || manifest[`${theme.name}.js`]))
      .pipe(plugins.replace(/"version":\s*"(\d+\.\d+\.)(\d+)"/,(a, p, r) => `"version": "${p}${++r}"`))
      .pipe(gulp.dest(base));

    gulp.src('package.json', { base: base })
      .pipe(plugins.replace(/"version":\s*"(\d+\.\d+\.)(\d+)"/,(a, p, r) => `"version": "${p}${++r}"`))
      .pipe(gulp.dest(base));

    // Reload theme options
    callback();
  }
}


module.exports = {
  indexInject, templateInject, themeReplace
}
