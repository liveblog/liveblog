from superdesk.services import BaseService
from liveblog.blogs.blogs import BlogsResource
from superdesk.resource import Resource

class BlogService(BaseService):
    notification_key = 'marketplace_blogs'

class BlogResource(Resource):
    url = 'marketplace/blogs'
    datasource = {
        'source': 'blogs',
        'search_backend': None,
        'default_sort': [('_updated', -1)],
        'elastic_filter': {'bool': {
            'must': {'term': {'market_enabled': 'true'}},
        }},
        # projection don't work
        'projection': {
            'blog_preferences': 0
        }
    }
    public_methods = ['GET']

    schema = {}
    schema.update(BlogsResource.schema)
