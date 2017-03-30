from flask import current_app as app

from .exceptions import MediaStorageUnsupportedForBlogPublishing


def check_media_storage():
    if type(app.media).__name__ is not 'AmazonMediaStorage':
        raise MediaStorageUnsupportedForBlogPublishing()


def get_blog_path(blog_id):
    return 'blogs/%s/index.html' % (blog_id)


def is_relative_to_current_folder(url):
    return not (url.startswith('/') or url.startswith('http://') or url.startswith('https://'))
