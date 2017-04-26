'use strict';

var path = require('path')
  , nunjucks = require('nunjucks');

var templatePath = path.resolve(__dirname, '../templates')
  , nunjucksLoader = new nunjucks.FileSystemLoader(templatePath)
  , nunjucksEnv = new nunjucks.Environment(nunjucksLoader);

module.exports = {
  nunjucksEnv: nunjucksEnv
}
