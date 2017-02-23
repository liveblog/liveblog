(function(angular) {
    'use strict';
    // here is set all the view templates that are used by classic theme.
    // this config is used only for debug when compiled `asset.templateUrl` path.
    // in the `build` production version this is made and overriden with the help from `$templateCache`
    //      from the `dist/templates.js`.
    angular.module('liveblog-embed')
        .run(function(){
            window.LB.templates = {
                'views/author.html': '/themes_assets/classic/views/author.html',
                'views/comments.html': '/themes_assets/classic/views/comments.html',
                'views/dropdown.html': '/themes_assets/classic/views/dropdown.html',
                'views/gallery.html': '/themes_assets/classic/views/gallery.html',
                'views/generic-embed.html': '/themes_assets/classic/views/generic-embed.html',
                'views/item.html': '/themes_assets/classic/views/item.html',
                'views/posts.html': '/themes_assets/classic/views/posts.html'
            }
        });
})(angular);