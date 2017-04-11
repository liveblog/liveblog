import flask
import superdesk
from superdesk.utc import utcnow
from superdesk.celery_app import update_key
import unittest
from superdesk.errors import SuperdeskApiError


def get_user(required=False):
    user = flask.g.get('user', {})
    if '_id' not in user and required:
        raise superdesk.SuperdeskError(payload='Invalid user.')
    return user


def update_dates_for(doc):
    for item in ['firstcreated', 'versioncreated']:
        doc.setdefault(item, utcnow())


def check_comment_length(text):
    # TODO: move to validators.
    if not 1 <= len(text) <= 300:
        raise SuperdeskApiError(payload='Allowed length: between 1 and 300. You exceeded the allowed length')


class BlogCache(object):
    ''' Manage the cache for blogs '''

    def __init__(self, cache):
        self.cache = cache

    def __get_blog_version(self, blog, invalidate=False):
        '''
        Return the blog cache version.
        If invalidate is true, the version will be incremented
        '''
        return update_key('%s__version' % (blog), flag=invalidate)

    def __create_blog_cache_key(self, blog, key):
        ''' return a key name for the given blog and key '''
        return '%s__%s__%s' % (blog, self.__get_blog_version(blog), key)

    def get(self, blog, key):
        ''' retrieve value from the cache '''
        return self.cache.get(self.__create_blog_cache_key(blog, key))

    def set(self, blog, key, value):
        ''' save value to the cache '''
        return self.cache.set(self.__create_blog_cache_key(blog, key), value)

    def invalidate(self, blog):
        ''' invalidate the cache for the given blog '''
        return self.__get_blog_version(blog, invalidate=True)


class BlogCacheTestCase(unittest.TestCase):

    def test_cache(self):
        from flask_cache import Cache
        import app as app_module
        with app_module.get_app().app_context():
            from flask import current_app as app
            cache = Cache(app, config={'CACHE_TYPE': 'simple'})
            blog_cache = BlogCache(cache)
            self.assertEqual(blog_cache.get('blog', 'key'), None)
            blog_cache.set('blog', 'key', 'value')
            self.assertEqual(blog_cache.get('blog', 'key'), 'value')
            blog_cache.invalidate('blog')
            self.assertEqual(blog_cache.get('blog', 'key'), None)
