import logging
from superdesk.services import BaseService
from liveblog.blogs.blogs import blogs_schema


from .auth import CustomAuthResource, ConsumerApiKeyAuth


logger = logging.getLogger('superdesk')


class BlogService(BaseService):
    notification_key = 'syndication_blogs'


class BlogResource(CustomAuthResource):
    url = 'syndication/blogs'
    authentication = ConsumerApiKeyAuth
    datasource = {
        'source': 'blogs',
        'search_backend': None,
        'default_sort': [('_updated', -1)],
        'filter': {'syndication_enabled': True},
        'projection': {'syndication_enabled': 0}
    }
    schema = blogs_schema
    item_methods = ['GET']
