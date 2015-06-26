module.exports = {
    options: {
        livereload: '<%= livereloadPort %>'
    },
    less: {
        tasks: ['style'],
        files: [
            '<%= appDir %>/styles/{,*/}*.less',
            '<%= appDir %>/scripts/liveblog/**/*.less',
            '<%= appDir %>/scripts/liveblog-*/**/*.less'
        ]
    },
    code: {
        options: {livereload: true},
        files: ['<%= appDir %>/scripts/**/*.js']
    },
    assets: {
        options: {livereload: true},
        tasks: ['copy:assets'],
        files: [
            '<%= appDir %>/styles/**/*.css',
            '<%= appDir %>/scripts/**/*.html'
        ]
    },
    index: {
        options: {livereload: true},
        tasks: ['template'],
        files: ['<%= appDir %>/index.html']
    }
};
