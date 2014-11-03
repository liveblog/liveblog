from superdesk.resource import Resource
import superdesk
from superdesk.services import BaseService
from apps.archive.common import update_dates_for
from superdesk.notification import push_notification

blogs_schema = {
    'title': {
        'type': 'string',
        'required': True,
    },
    'description': {
        'type': 'string'
    },
    'language': {
        'type': 'string'
    },
    'settings': {
        'type': 'dict'
    },
    'author': Resource.rel('users', True),
    'state': {
        'type': 'string',
        'allowed': ['open', 'closed'],
        'default': 'open'
    }
}


def on_create_blog(docs):
    for doc in docs:
        update_dates_for(doc)


def init_app(app):
    endpoint_name = 'blogs'
    service = BlogService(endpoint_name, backend=superdesk.get_backend())
    BlogsResource(endpoint_name, app=app, service=service)


class BlogsResource(Resource):
    schema = blogs_schema
    datasource = {'default_sort': [('created', -1)]}


class BlogService(BaseService):

    def on_create(self, docs):
        on_create_blog(docs)

    def on_created(self, docs):
        push_notification('blogs', created=1)

    def on_updated(self, updates, original):
        push_notification('blogs', updated=1)

    def on_deleted(self, doc):
        push_notification('blogs', deleted=1)
