from superdesk.services import BaseService
from liveblog.blogs.blogs import blogs_schema
from superdesk.resource import Resource

class BlogService(BaseService):
    notification_key = 'marketplace_blogs'

class BlogResource(Resource):
    url = 'marketplace/blogs'
    datasource = {
        'source': 'blogs',
        'search_backend': None,
        'default_sort': [('_updated', -1)],
        'filter': {'syndication_enabled': True},
        'projection': {
            'title': 1,
            'description': 1,
            'picture_url': 1,
            'public_url': 1
        }
    }
    schema = blogs_schema
    public_methods = ['GET']
