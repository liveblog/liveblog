from bson.objectid import ObjectId
from eve.utils import ParsedRequest
from superdesk.notification import push_notification
from superdesk.resource import Resource
from superdesk.utc import utcnow

from liveblog.common import get_user, update_dates_for
from apps.archive.archive import ArchiveResource, ArchiveService


class ItemsResource(ArchiveResource):
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'item'}},
        'default_sort': [('_updated', -1)]
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']

    schema = ArchiveResource.schema
    schema.update(schema)
    schema.update({
        'blog': Resource.rel('blogs', True),
        'particular_type': {
            'type': 'string',
            'allowed': ['post', 'item'],
            'default': 'item'
        },
        'item_type': {
            'type': 'string'
        }
    })
    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class ItemsService(ArchiveService):
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


class BlogItemsResource(ArchiveResource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/items'
    schema = ItemsResource.schema
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'item'}},
        'default_sort': [('_updated', -1)]
    }
    resource_methods = ['GET']
    privileges = {'GET': 'blogs'}


class BlogItemsService(ArchiveService):
    def get(self, req, lookup):
        if lookup.get('blog_id'):
            lookup['blog'] = ObjectId(lookup['blog_id'])
            del lookup['blog_id']
        return super().get(req, lookup)
