import os


THEMES_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir, 'themes'))
THEMES_ASSETS_DIR = 'themes_assets'
THEMES_UPLOADS_DIR = 'themes_uploads'
BLOGSLIST_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir, 'blogs'))
BLOGSLIST_ASSETS_DIR = 'blogslist_assets'
BLOGLIST_ASSETS = {
    'scripts': [
        'vendors/moment/min/moment-with-locales.min.js',
        'vendors/angular/angular.min.js',
        'vendors/angular-resource/angular-resource.min.js',
        'vendors/angular-route/angular-route.min.js',
        'vendors/angular-gettext/dist/angular-gettext.min.js',
        'main.js'
    ],
    'styles': [
        'styles/embed.css',
        'styles/reset.css'
    ],
    'version': 'bower.json'
}
CONTENT_TYPES = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json'
}
