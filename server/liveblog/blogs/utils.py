import os
from flask import current_app as app

from .app_settings import BLOGSLIST_ASSETS_DIR
from .exceptions import MediaStorageUnsupportedForBlogPublishing


def check_media_storage():
    if type(app.media).__name__ is not 'AmazonMediaStorage':
        raise MediaStorageUnsupportedForBlogPublishing()


def get_blog_path(blog_id, theme=None, output_id=None):
    return 'blogs/{}/{}{}index.html'.format(blog_id,
                                            '{}/'.format(theme) if theme else '',
                                            '{}/'.format(output_id) if output_id else '')


def get_bloglist_path():
    return os.path.join(BLOGSLIST_ASSETS_DIR, 'index.html')


def is_relative_to_current_folder(url):
    return not (url.startswith('/') or url.startswith('http://') or url.startswith('https://'))
