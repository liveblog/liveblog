import json
import os
from flask import current_app as app

from .app_settings import BLOGSLIST_ASSETS_DIR, THEMES_DIRECTORY, THEMES_ASSETS_DIR
from .exceptions import MediaStorageUnsupportedForBlogPublishing


def check_media_storage():
    if type(app.media).__name__ is not 'AmazonMediaStorage':
        raise MediaStorageUnsupportedForBlogPublishing()


def get_blog_path(blog_id):
    return 'blogs/%s/index.html' % (blog_id)


def get_bloglist_path():
    return os.path.join(BLOGSLIST_ASSETS_DIR, 'index.html')


def is_relative_to_current_folder(url):
    return not (url.startswith('/') or url.startswith('http://') or url.startswith('https://'))


def get_template_file_name(theme_name):
    return os.path.join(THEMES_DIRECTORY, THEMES_ASSETS_DIR, theme_name, 'template.html')


def get_theme_json_filename(theme_name):
    return os.path.join(THEMES_DIRECTORY, THEMES_ASSETS_DIR, theme_name, 'theme.json')


def get_theme_json(theme_name):
    filename = get_theme_json_filename(theme_name)
    return json.loads(open(filename).read())
