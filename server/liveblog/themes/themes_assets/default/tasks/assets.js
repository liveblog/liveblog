const fs = require('fs');
const del = require('del');
const gulp = require('gulp');
const path = require('path');
const through = require('through2');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const plugins = require('gulp-load-plugins')();

const exists = require('npm-exists');
const install = require('spawn-npm-install');

const { discoverThemePaths, themeDependencyPath } = require('liveblog-shared-tools').utils;
const { resolveResource, debugState } = require('./utils');
const { TEMPLATES_SUFFIX, PRE_BUNDLE_DIR, SYSTEM_THEMES } = require('./constants');

const CWD = process.cwd();

/**
 * Will bundle precompiled templates with theme's assets. This task kind of depends
 * on anothers tasks that should bundle the theme's assets
 *
 * @param  {object} theme       Theme settings object
 * @return {function}           Gulp task compatible function
 */
const bundleJs = (theme) => {
  return () => {
    let DEBUG = debugState();

    var bundlePaths = [
      `./${PRE_BUNDLE_DIR}*-${TEMPLATES_SUFFIX}`,  // templates must go first so nunjucks can load precompiled templates
      `./${PRE_BUNDLE_DIR}${theme.name}.js`
    ];

    return gulp.src(bundlePaths)
      .pipe(plugins.concat(`${theme.name}.js`))
      .pipe(plugins.rev())
      .pipe(plugins.if(!DEBUG, plugins.uglify()))
      .pipe(gulp.dest('./dist'))
      .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
      .pipe(gulp.dest('.'))

      // delete prebundle dir
      .pipe(through.obj(function(file, enc, cb) {
        del([`./${PRE_BUNDLE_DIR}`]);
        cb();
      }));
  }
}


/**
 * As name suggests, it process common logic for css/less styling files/assets
 * @param  {object} theme     Theme settings object
 * @param  {object} theme     inputPath object
 * @return {function}         Gulp compatible task
 */
const lessCommon = (cleanCss, theme, inputPath) => {
  const lessFiles = [];
  let themeLess;

  // check if there is _topImports.less file with font @imports etc.
  // that should be put on very top of compiled css to work
  if (!theme.onlyOwnCss && theme.extends) {
    themeLess = path.resolve(`./less/topImport.less`);
    if (fs.existsSync(themeLess)) {
      lessFiles.push(themeLess);
    }
  }

  // process inherited styles from extended theme first
  // this makes it easier to override rules with this theme's CSS and avoids specificity war
  if ( !theme.onlyOwnCss && theme.extends ) {
    themeLess = path.resolve(`${inputPath}/less/${theme.extends}.less`);
    lessFiles.push(fs.existsSync(themeLess) ? themeLess : path.resolve(`${inputPath}/less/*.less`));
  }

  // Name of the less theme file.
  themeLess = `./less/${theme.name}.less`;
  // Compile all the files under the less folder if no theme less file pressent.
  lessFiles.push(fs.existsSync(themeLess) ? themeLess : './less/*.less');

  const flat = true;
  let lessPaths = discoverThemePaths(theme, 'less', flat);

  return gulp.src(lessFiles)
    .pipe(plugins.less({ paths: lessPaths }))
    .pipe(plugins.autoprefixer({ flexbox: 'no-2009' }))

    /* @TODO:
     *  generate a full api support with
     *      - pinned
     *          - both need to be enable (have support in the code for `stickyPosition`='both')
     *          - with possition below menu bar
     *          - with possition above menu bar
     *      - highlight
     *      - scorecards
     *      - text
     *      - image
     *      - quote
     *      - comments
     *          - with bellow reply
     *          - with on top reply
     *      - advertisements
     *          - local
     *          - remote
     *      - all supported emebds
     *          - twitter
     *          - facebook
     *          - instagram
     *          - youtube
     *          - generic ( link )
     * language settings if any.
     * all posts above needs to be added and then enable purifycss.
     * otherwise purifycss will remove those css "unused"/not present.
    */
    .pipe(plugins.if(cleanCss, plugins.cleanCss({compatibility: 'ie8'})));
};


/**
 * Compiles less files
 * @param  {boolean} cleanCss Boolean parameter indicating if clean or not the css
 * @param  {object} theme     Theme settings object
 * @param  {object} theme     inputPath object
 * @return {function}         Gulp compatible task
 */
const compileLess = (theme, inputPath) => {
  return () => {
    const cleanCss = !debugState();

    return lessCommon(cleanCss, theme, inputPath)
      .pipe(plugins.concat(`${theme.name}.css`))
      .pipe(plugins.rev())
      .pipe(gulp.dest('./dist'))
      .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
      .pipe(gulp.dest('.'))
  }
}


const doBrowserify = (theme, paths, inputPath)  => {
  return () => {
    let DEBUG = debugState();

    if (theme.ampTheme) {
      return gulp.src('.').pipe(plugins.util.noop());
    }

    var mainFile = resolveResource('js/liveblog.js', theme, CWD);

    var b = browserify({
      basedir: inputPath,
      entries: mainFile,
      fullPaths: true,
      debug: DEBUG
    });

    return b
      .transform('babelify', { presets: ['es2015', 'stage-0'] })
      .bundle()
      .on('error', plugins.util.log)
      .pipe(source(mainFile))
      .pipe(buffer())
      .pipe(plugins.concat(`${theme.name}.js`))
      .pipe(plugins.ngAnnotate())
      .pipe(gulp.dest(`./${PRE_BUNDLE_DIR}`));
  }
}

/**
 * It checks the dependencies of the given theme and attach to package.json of the theme the
 * packages on which it depends on
 * @param  {Object} theme Theme settings
 */
const wireDeps = (theme) => {

  const guessPackageName = (name) => {
    return (SYSTEM_THEMES.indexOf(name) !== -1) ? `liveblog-${name}-theme` : name;
  }

  const subAction = (theme) => {
    if (theme.extends) {
      let packageName = guessPackageName(theme.extends);

      if (theme.extendsFromPackage)
        packageName = theme.extendsFromPackage;

      exists(packageName)
        .then((found) => {
          if (!found) {
            console.error(`Theme parent dependency not found in npm registry ${packageName}`);
            return;
          }

          install(packageName, { save: true }, (err) => {
            if (err) {
              console.error(`Unable to install theme parent dependency ${err}`)
              return;
            }

            // if not error, we try to get parent theme dependency (in case of multi levels)
            const parentThemePath = themeDependencyPath(theme.extends);
            const parentTheme = require(path.resolve(parentThemePath, 'theme.json'));
            subAction(parentTheme);
          });
        }
      );
    }
  }

  return () => {
    subAction(theme);
  }
}

module.exports = {
  wireDeps,
  bundleJs,
  lessCommon,
  compileLess,
  doBrowserify
}
