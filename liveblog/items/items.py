from superdesk.notification import push_notification
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.utc import utcnow
from bson.objectid import ObjectId

from liveblog.common import get_user, update_dates_for


items_schema = {
    'headline': {
        'type': 'string'
    },
    'original_creator': Resource.rel('users', True),
    'version_creator': Resource.rel('users', True),
    'post': Resource.rel('posts', True)
}


class ItemsResource(Resource):

    schema = items_schema
    datasource = {
        'default_sort': [('_updated', -1)]
    }

    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class ItemsService(BaseService):

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))

    def on_created(self, docs):
        push_notification('items', created=1)

    def on_update(self, updates, original):
        user = get_user()
        updates['versioncreated'] = utcnow()
        updates['version_creator'] = str(user.get('_id'))

    def on_updated(self, updates, original):
        push_notification('items', updated=1)

    def on_deleted(self, doc):
        push_notification('items', deleted=1)


class ItemsPostResource(Resource):
    url = 'posts/<regex("[a-f0-9]{24}"):post_id>/items'
    schema = items_schema
    datasource = {
        'source': 'items'
    }
    resource_methods = ['GET', 'POST']


class ItemsPostService(BaseService):

    def get(self, req, lookup):
        if lookup.get('post_id'):
            lookup['post'] = ObjectId(lookup['post_id'])
            del lookup['post_id']
        return super().get(req, lookup)
