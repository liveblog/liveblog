from bson.objectid import ObjectId
from superdesk.resource import Resource
from superdesk.services import BaseService

from liveblog.common import update_dates_for, get_user


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


class PostsResource(Resource):
    schema = posts_schema
    resource_methods = ['GET', 'POST', 'DELETE']
    datasource = {
        'default_sort': [('_created', -1)]
    }


class PostsService(BaseService):

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = get_user()


class BlogPostResource(Resource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/posts'
    schema = posts_schema
    datasource = {
        'source': 'posts',
        'search_backend': 'elastic'
    }
    resource_methods = ['GET']


class BlogPostService(BaseService):
    def get(self, req, lookup):
        if lookup.get('blog_id'):
            lookup['blog'] = ObjectId(lookup['blog_id'])
            del lookup['blog_id']
        return super().get(req, lookup)
