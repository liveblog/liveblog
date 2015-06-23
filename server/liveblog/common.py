import flask
import superdesk
from superdesk.utc import utcnow
from flask import current_app as app
from superdesk.celery_app import update_key


def get_user(required=False):
    user = flask.g.get('user', {})
    if '_id' not in user and required:
        raise superdesk.SuperdeskError(payload='Invalid user.')
    return user


def update_dates_for(doc):
    for item in ['firstcreated', 'versioncreated']:
        doc.setdefault(item, utcnow())


class BlogCache(object):

    def __get_blog_version(self, blog, invalidate=False):
        return update_key('%s__version' % (blog), flag=invalidate)

    def __create_blog_cache_key(self, blog, key):
        return '%s__%s__%s' % (blog, self.__get_blog_version(blog), key)

    def get(self, blog, key):
        return app.cache.get(self.__create_blog_cache_key(blog, key))

    def set(self, blog, key, value):
        return app.cache.set(self.__create_blog_cache_key(blog, key), value)

    def invalidate(self, blog):
        return self.__get_blog_version(blog, invalidate=True)
