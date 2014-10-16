
var files = [
    {
        dest: '<%= distDir %>/styles/css/liveblog.css',
        src: '<%= appDir %>/styles/less/liveblog.less'
    }, {
        expand: true,
        dest: '<%= tmpDir %>/',
        cwd: '<%= appDir %>/scripts/',
        src: ['liveblog/**/*.less', 'liveblog-*/**/*.less'],
        ext: '.css'
    }
];

module.exports = {
    dev: {
        options: {
            paths: ['<%= appDir %>/styles/less'],
            compress: false,
            cleancss: true
        },
        files: files
    },
    prod: {
        options: {
            paths: ['<%= appDir %>/styles/less'],
            compress: false,
            cleancss: true
        },
        files: files
    }
};
