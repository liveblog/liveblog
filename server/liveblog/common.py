import flask
import superdesk
from superdesk.utc import utcnow
import unittest
from superdesk.errors import SuperdeskApiError
import logging
from flask import current_app as app

logger = logging.getLogger('superdesk')


def get_user(required=False):
    user = flask.g.get('user', {})
    if '_id' not in user and required:
        raise superdesk.SuperdeskError(payload='Invalid user.')
    return user


def update_dates_for(doc):
    for item in ['firstcreated', 'versioncreated']:
        doc.setdefault(item, utcnow())


def check_comment_length(text):
    if not 1 <= len(text) <= 300:
        raise SuperdeskApiError(payload='Allowed length: between 1 and 300. You exceeded the allowed length')


class LiveblogCache(object):
    ''' Manage the cache for blogs '''

    def __init__(self, cache, key='lb'):
        self.cache = cache
        self.main_key = key

    def __get_blog_version(self, blog, invalidate=False):
        '''
        Return the blog cache version.
        If invalidate is true, the version will be incremented
        '''
        blog_cache_key = '{}__{}__{}_version'.format(app.config['CACHE_MEMCACHED_PREFIX'],
                                                     blog, self.main_key)
        blog_version = self.cache.get(blog_cache_key)
        if not blog_version:
            blog_version = self.cache.set(blog_cache_key, '1')
        if invalidate:
            self.__remove_cache_keys(blog, blog_version=blog_version)
            if not blog_version:
                blog_version = '1'
            blog_version = str(int(blog_version) + 1)
            self.cache.set(blog_cache_key, blog_version)
        return blog_version

    def __create_blog_cache_key(self, blog, key):
        ''' return a key name for the given blog and key '''
        return '{}__{}__{}__{}'.format(app.config['CACHE_MEMCACHED_PREFIX'],
                                       blog, self.__get_blog_version(blog), key)

    def __remove_cache_keys(self, blog, blog_version):
        ''' remove all the keys for the previous version '''
        blog_cache_keys = '{}__{}__{}__{}_cache_keys'.format(app.config['CACHE_MEMCACHED_PREFIX'],
                                                             blog, blog_version, self.main_key)
        keys = self.cache.get(blog_cache_keys)
        if keys:
            for key in keys:
                self.cache.delete(key)

    def __save_cache_keys(self, blog, key):
        ''' keep the key so later we can remove it '''
        blog_cache_keys = '{}__{}__{}__{}_cache_keys'.format(app.config['CACHE_MEMCACHED_PREFIX'],
                                                             blog, self.__get_blog_version(blog), self.main_key)
        keys = self.cache.get(blog_cache_keys)
        if not keys:
            keys = []
        keys.append(key)
        self.cache.set(blog_cache_keys, keys)
        return key

    def get(self, blog, key):
        ''' retrieve value from the cache '''
        return self.cache.get(self.__create_blog_cache_key(blog, key))

    def set(self, blog, key, value):
        ''' save value to the cache '''
        blog_cache_key = self.__save_cache_keys(blog, self.__create_blog_cache_key(blog, key))
        return self.cache.set(blog_cache_key, value)

    def invalidate(self, blog):
        ''' invalidate the cache for the given blog '''
        return self.__get_blog_version(blog, invalidate=True)


class BlogCacheTestCase(unittest.TestCase):

    def test_cache(self):
        from flask.ext.cache import Cache
        import app as app_module
        with app_module.get_app().app_context():
            from flask import current_app as app
            cache = Cache(app, config={'CACHE_TYPE': 'simple'})
            liveblog_cache = LiveblogCache(cache)
            self.assertEqual(liveblog_cache.get('blog', 'key'), None)
            liveblog_cache.set('blog', 'key', 'value')
            self.assertEqual(liveblog_cache.get('blog', 'key'), 'value')
            liveblog_cache.invalidate('blog')
            self.assertEqual(liveblog_cache.get('blog', 'key'), None)
