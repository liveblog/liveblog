from superdesk.notification import push_notification
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.utc import utcnow

from liveblog.common import get_user, update_dates_for


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
    'original_creator': Resource.rel('users', True),
    'version_creator': Resource.rel('users', True),
    'state': {
        'type': 'string',
        'allowed': ['open', 'closed'],
        'default': 'open'
    }
}


class BlogsResource(Resource):
    schema = blogs_schema
    datasource = {
        'default_sort': [('_updated', -1)]
    }


class BlogService(BaseService):

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = get_user()

    def on_created(self, docs):
        push_notification('blogs', created=1)

    def on_update(self, updates, original):
        user = get_user()
        updates['versioncreated'] = utcnow()
        updates['version_creator'] = str(user.get('_id'))

    def on_updated(self, updates, original):
        push_notification('blogs', updated=1)

    def on_deleted(self, doc):
        push_notification('blogs', deleted=1)
