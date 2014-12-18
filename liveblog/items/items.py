from superdesk.notification import push_notification
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.utc import utcnow

from liveblog.common import get_user, update_dates_for

items_schema = {
    'text': {
        'type': 'string'
    },
    'original_creator': Resource.rel('users', True),
    'version_creator': Resource.rel('users', True),
    'meta': {
        'type': 'string'
    },
    'type': {
        'type': 'string',
        'allowed': ['post', 'item'],
        'default': 'item'
    },
    'post': Resource.rel('posts', True),
    'blog': Resource.rel('blogs', True)
}


class ItemsResource(Resource):

    schema = items_schema
    datasource = {
        'default_sort': [('_updated', -1)]
    }

    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class ItemsService(BaseService):

    def on_create(self, docs):
        first = True
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))
            if not first:
                doc['type'] = 'item'
            else:
                doc['type'] = 'post'
            first = False

    def on_created(self, docs):
        push_notification('items', created=1)
        for doc in docs:
            if doc['type'] == 'item':
                doc['post'] = docs[0]['_id']
                self.update(doc['_id'], doc)

    def on_update(self, updates, original):
        user = get_user()
        updates['versioncreated'] = utcnow()
        updates['version_creator'] = str(user.get('_id'))

    def on_updated(self, updates, original):
        push_notification('items', updated=1)

    def on_deleted(self, doc):
        push_notification('items', deleted=1)
