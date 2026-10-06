// Mimics html-loader 0.x output format: module.exports = "...html..."
// ngtemplate-loader expects this exact format.
module.exports = function(content) {
    return 'module.exports = ' + JSON.stringify(content) + ';';
};
