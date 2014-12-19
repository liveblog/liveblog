from bson.objectid import ObjectId
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.notification import push_notification
from superdesk.utc import utcnow

from liveblog.common import update_dates_for, get_user

posts_schema = {
    'text': {
        'type': 'string',
        'minlength': 1,
        'maxlength': 1000,
        'required': True,
    },
    'type': {
        'type': 'string',
        'allowed': ['post', 'item'],
        'default': 'post'
    },
    'blog': Resource.rel('blogs', True),
    'original_creator': Resource.rel('users', True),
    'version_creator': Resource.rel('users', True),
    'meta': {
        'type': 'string'
    }
}


class PostsResource(Resource):
    schema = posts_schema
    resource_methods = ['GET', 'POST', 'DELETE']
    datasource = {
        'default_sort': [('_created', -1)]
    }
    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class PostsService(BaseService):

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))

    def on_created(self, docs):
        push_notification('posts', created=1)

    def on_update(self, updates, original):
        user = get_user()
        updates['versioncreated'] = utcnow()
        updates['version_creator'] = str(user.get('_id'))

    def on_updated(self, updates, original):
        push_notification('posts', updated=1)

    def on_deleted(self, doc):
        push_notification('posts', deleted=1)


class BlogPostResource(Resource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/posts'
    schema = posts_schema
    datasource = {
        'source': 'posts'
    }
    resource_methods = ['GET']

    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class BlogPostService(BaseService):

    def get(self, req, lookup):
        if lookup.get('blog_id'):
            lookup['blog'] = ObjectId(lookup['blog_id'])
            del lookup['blog_id']
        return super().get(req, lookup)
