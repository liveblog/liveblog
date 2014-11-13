from bson.objectid import ObjectId
import superdesk
from superdesk.resource import Resource
from superdesk.services import BaseService

from .common import set_user, update_dates_for


posts_schema = {
    'text': {
        'type': 'string',
        'minlength': 1,
        'maxlength': 1000,
        'required': True,
    },
    'blog': Resource.rel('blogs', True),
    'original_creator': Resource.rel('users', True)
}


def init_app(app):
    endpoint_name = 'posts'
    service = PostsService(endpoint_name, backend=superdesk.get_backend())
    PostsResource(endpoint_name, app=app, service=service)
    endpoint_name = 'blog_posts'
    service = BlogPostService(endpoint_name, backend=superdesk.get_backend())
    BlogPostResource(endpoint_name, app=app, service=service)


class PostsResource(Resource):
    schema = posts_schema
    resource_methods = ['GET', 'POST', 'DELETE']
    datasource = {'default_sort': [('_created', -1)]}


class PostsService(BaseService):

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = set_user(doc)


class BlogPostResource(Resource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/posts'
    schema = posts_schema
    datasource = {'source': 'posts'}
    resource_methods = ['GET']


class BlogPostService(BaseService):
    def get(self, req, lookup):
        if lookup.get('blog_id'):
            lookup['blog'] = ObjectId(lookup['blog_id'])
            del lookup['blog_id']
        return super().get(req, lookup)
