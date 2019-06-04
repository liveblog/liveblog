var path = require('path');
var root = path.dirname(path.dirname(__dirname));

module.exports = {
    options: {
        configFile: path.join(root, '.eslintrc.js'),
        quiet: true
    },

    app: {
        src: [
            path.join(root, 'app/**/*.js'),
            path.join(root, 'app/**/*.jsx'),
            path.join(root, 'app/**/*.ts'),
            path.join(root, 'app/**/*.tsx')
        ],
        envs: ['browser', 'amd']
    },

    // TODO: lint the shit out of the specs
    //specs: {
    //    src: [
    //        path.join(root, 'spec/**/*.js'),
    //        path.join(root, 'spec/**/*.jsx')
    //    ],
    //    envs: ['node', 'jasmine']
    //},

    //tasks: {
    //    src: path.join(root, 'tasks/**/*.js'),
    //    envs: ['node']
    //}
};
