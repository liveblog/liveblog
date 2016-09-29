module.exports = {
    assets: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= appDir %>',
            dest: '<%= distDir %>',
            src: [
                'images/**/*',
                'favicon.ico',
                'styles/css/*.css',
                'scripts/**/*.{html,css,jpg,jpeg,png,gif,json}',
                'scripts/bower_components/requirejs/require.js'
            ]
        },{
            expand: true,
            dot: true,
            cwd: 'node_modules/superdesk-core/',
            dest: '<%= distDir %>',
            src: [
                'scripts/**/*.html',
            ]
        
        }]
    },
    tmp: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= tmpDir %>',
            dest: '<%= distDir %>',
            src: [
                'scripts/lb-templates.js'
            ]
        }]
    },
    docs: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= appDir %>/docs',
            dest: '<%= distDir %>',
            src: [
                'views/**/*.{html,css,jpg,jpeg,png,gif,json}'
            ]
        },
        {
            expand: true,
            dot: true,
            cwd: '<%= appDir %>',
            dest: '<%= distDir %>',
            src: [
                'docs/images/**/*.{jpg,jpeg,png,gif}'
            ]
        }]
    },
    js: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= appDir %>',
            dest: '<%= distDir %>',
            src: [
                'scripts/config.js',
                'scripts/bower_components/**/*.js'
            ]
        }]
    },
    fonts: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= appDir %>',
            dest: '<%= distDir %>',
            src: [
                'fonts/sd_icons.woff',
                'fonts/sd_icons.eot',
                'fonts/sd_icons.svg',
                'fonts/sd_icons.ttf',
                'scripts/bower_components/**/*.ttf',
                'scripts/bower_components/**/*.woff',
                'scripts/bower_components/**/*.woff2'
            ]
        }]
    },
    bower: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= distDir %>',
            dest: '<%= bowerDir %>',
            src: [
                'images/**',
                'styles/css/bootstrap.css',
                'styles/css/app.css',
                'scripts/vendor.js',
                'scripts/superdesk-core.js',
                'scripts/superdesk.js',
                'scripts/vendor-docs.js',
                'scripts/superdesk-docs-core.js',
                'scripts/superdesk-docs-main.js'
            ]
        }]
    }
};
