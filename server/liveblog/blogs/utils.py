import os
from flask import current_app as app
from superdesk import get_resource_service

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


def is_seo_enabled(blog_or_id):
    """
    Return True if blog has seo output enabled in theme.
    """
    blogs = get_resource_service('client_blogs')
    if isinstance(blog_or_id, dict):
        blog = blog_or_id
        blog_id = blog['_id']
    else:
        blog_id = blog_or_id
        blog = blogs.find_one(req=None, _id=blog_id)
        if not blog:
            return

    themes = get_resource_service('themes')
    blog_preferences = blog.get('blog_preferences')
    if not blog_preferences:
        return

    theme_name = blog_preferences.get('theme')
    if not theme_name:
        return

    theme = themes.find_one(req=None, name=theme_name)
    if not theme:
        return
    if theme.get('seoTheme'):
        return True

    outputs_service = get_resource_service('outputs')
    for output in outputs_service.get(req=None, lookup=dict(blog=blog_id)):
        theme_name = output.get('theme')
        if not theme_name:
            continue

        theme = themes.find_one(req=None, name=theme_name)
        if not theme:
            continue

        if theme.get('seoTheme'):
            return True
