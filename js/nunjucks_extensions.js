var nunjucks = require('nunjucks');
var path = require('path');

var templatePath = path.resolve(__dirname, '../templates');
var nunjucksLoader = new nunjucks.FileSystemLoader(templatePath);
var nunjucksEnv = new nunjucks.Environment(nunjucksLoader);


module.exports = {
    nunjucksEnv: nunjucksEnv
}
