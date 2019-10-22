const gulp = require('gulp');
const path = require('path');
const plugins = require('gulp-load-plugins')();
const { discoverThemePaths } = require('liveblog-shared-tools').utils;
const constants = require('./constants');


/**
 * Look for theme's parent and precompiles it templates with
 * the right prefix to be found when inheriting templates
 *
 * @param  {object} theme       Theme settings object
 * @param  {object} nunjucksEnv As its name refers :)
 * @return {function}           Gulp task compatible function
 */
const precompileParentTemplates = (theme, nunjucksEnv) => {

  const pathsTuples = discoverThemePaths(theme, '');
  const getPrefix = (filepath) => {
    const themeBase = filepath.split(`${path.sep}templates${path.sep}`)[0];
    return pathsTuples.find(x => x[1] === themeBase)[0];
  }

  return () => {
    // return if amp theme or if not extends another theme
    if (!theme.extends || theme.ampTheme) return;

    var prefixOptions = {
      env: nunjucksEnv,
      name: function(file) {
        var filename = path.basename(file.path);
        return `${getPrefix(file.path)}/${filename}`;
      }
    };

    // let's exclude self theme as we are only pulling parent themes to assign prefixes
    // self theme will be first element in array returned by discoverThemePaths
    const suffix = 'templates/*.html'
    const flat = true;
    let templatePaths = discoverThemePaths(theme, suffix, flat);
    templatePaths = templatePaths.slice(1);

    return gulp.src(templatePaths)
      .pipe(plugins.nunjucks.precompile(prefixOptions))
      .pipe(plugins.concat(`${theme.extends}-${constants.TEMPLATES_SUFFIX}`))
      .pipe(gulp.dest(`./${constants.PRE_BUNDLE_DIR}`));
  }
}


/**
 * Precompiles template for the given theme
 *
 * @param  {object} theme           Theme settings object
 * @param  {object} nunjucksEnv     Nunjucks Environment object
 * @return {function}               Gulp task compatible function
 */
const precompileThemeTemplates = (theme, nunjucksEnv) => {
  const suffix = 'templates/*.html';
  const flat = true;
  let paths = discoverThemePaths(theme, suffix, flat);

  return () => {
    if (theme.ampTheme) return;

    gulp.src(paths.reverse())
      .pipe(plugins.nunjucks.precompile({ env: nunjucksEnv }))
      .pipe(plugins.concat(`${theme.name}-${constants.TEMPLATES_SUFFIX}`))
      .pipe(gulp.dest(`./${constants.PRE_BUNDLE_DIR}`))
  }
}

module.exports = {
  precompileParentTemplates,
  precompileThemeTemplates
}
