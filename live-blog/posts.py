from superdesk.resource import Resource
from apps.archive.common import update_dates_for, set_user
import superdesk
from superdesk.services import BaseService

posts_schema = {
    'text': {
        'type': 'string',
        'minlength': 1,
        'maxlength': 1000,
        'required': True,
    },
    'blog': Resource.rel('blogs', True)
}


def init_app(app):
    endpoint_name = 'posts'
    service = PostsService(endpoint_name, backend=superdesk.get_backend())
    PostsResource(endpoint_name, app=app, service=service)


class PostsResource(Resource):
    schema = posts_schema
    resource_methods = ['GET', 'POST', 'DELETE']
    datasource = {'default_sort': [('_created', -1)]}


class PostsService(BaseService):

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['editor'] = set_user(doc)
