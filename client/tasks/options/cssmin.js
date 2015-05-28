module.exports = {
    target: {
        files: [
            {
                dest: '<%= distDir %>/styles/css/sd-app.css',
                src: ['<%= tmpDir %>/superdesk*/**/*.css']
            },
            {
                dest: '<%= distDir %>/styles/css/app.css',
                src: ['<%= tmpDir %>/liveblog*/**/*.css']
            }
        ]
    }
};
