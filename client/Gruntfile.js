module.exports = function (grunt) {
    // util for grunt.template
    grunt.toJSON = function(input) {
        return JSON.stringify(input);
    };

    var config = {
        pkg: grunt.file.readJSON('./package.json'),
        appDir: 'app',
        tmpDir: '.tmp',
        distDir: 'dist',
        poDir: 'po',
        livereloadPort: 35729
    };

    grunt.initConfig(config);

    require('load-grunt-tasks')(grunt);
    require('load-grunt-config')(grunt, {
        config: config,
        configPath: require('path').join(process.cwd(), 'tasks', 'options')
    });

    grunt.registerTask('test', ['karma:unit']);
    grunt.registerTask('ci', ['eslint']);
    grunt.registerTask('bamboo', ['karma:bamboo']);

    grunt.registerTask('docs', [
        'clean',
        'template:docs',
        'connect:test',
        'open:docs',
        'ngtemplates:docs'
    ]);

    grunt.registerTask('server', [
        'clean',
        'copy:assets',
        'copy:locales',
        'copy:index',
        'copy:config',
        'copy:sirTrevor',
        'webpack-dev-server:start'
    ]);

    grunt.registerTask('ci:travis', ['eslint']);

    grunt.registerTask('server:e2e', [
        'clean',
        'template:mock',
        'ngtemplates:core',
        'connect:mock' // nothing will be run after that
    ]);
    grunt.registerTask('server:travis', ['clean', 'template:travis', 'connect:travis']);

    grunt.registerTask('build', [
        'clean',
        'copy:assets',
        'copy:locales',
        'copy:index',
        'copy:sirTrevor',
        'webpack:build'
    ]);

    grunt.registerTask('package', ['ci', 'build']);
    grunt.registerTask('default', ['server']);
};
