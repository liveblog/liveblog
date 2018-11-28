process.env.EXTENDED_MODE = true;

var gulp = require('gulp');
var parent = require('liveblog-default-theme/gulpfile.js');

gulp.tasks = parent.tasks;
module.exports = gulp;
