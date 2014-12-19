from bson.objectid import ObjectId
from eve.utils import ParsedRequest
from superdesk.notification import push_notification
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.utc import utcnow

from liveblog.common import get_user, update_dates_for
from apps.content import metadata_schema, LINKED_IN_PACKAGES


items_schema = {
    'text': metadata_schema['body_html'],
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'pubstatus': metadata_schema['pubstatus'],
    'type': metadata_schema['type'],
    'groups': metadata_schema['groups'],
    LINKED_IN_PACKAGES: metadata_schema[LINKED_IN_PACKAGES],
    'meta': {'type': 'string'},
    'blog': Resource.rel('blogs', True),
    'particular_type': {
        'type': 'string',
        'allowed': ['item'],
        'default': 'item'
    }
}


class ItemsResource(Resource):
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'item'}},
        'default_sort': [('_updated', -1)]
    }
    schema = items_schema
    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class ItemsService(BaseService):
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('items', req=req, lookup=lookup)

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
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'item'}},
        'default_sort': [('_updated', -1)]
    }
    resource_methods = ['GET', 'POST']


class ItemsPostService(BaseService):

    def get(self, req, lookup):
        if lookup.get('post_id'):
            lookup['post'] = ObjectId(lookup['post_id'])
            del lookup['post_id']
        return super().get(req, lookup)
