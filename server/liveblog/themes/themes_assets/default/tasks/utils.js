const { discoverThemePaths, themeDependencyPath } = require('liveblog-shared-tools').utils;
const fs = require('fs');
const pathLib = require('path');
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();


const resolveResource = (file, theme, basepath) => {

  var filepath = pathLib.resolve(basepath, file);
  var fileExists = fs.existsSync(filepath);

  if (fileExists)
    return filepath;

  else {
    // now check in parent theme
    if (!theme.extends) {
      console.err("file does not exists and theme does not extend any other theme");
      return filepath;
    }

    const parentPath = themeDependencyPath(theme.extends);
    const parentTheme = require(`${parentPath}/theme.json`);
    return resolveResource(file, parentTheme, parentPath);
  }
}

const debugState = () => {
  let defaultDebug = true;
  return plugins.util.env.NODE_ENV ? plugins.util.env.NODE_ENV : process.env.NODE_ENV !== "production";
}

module.exports = { resolveResource, debugState }
