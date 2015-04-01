from bson.objectid import ObjectId
from eve.utils import ParsedRequest
from superdesk.notification import push_notification
from superdesk.resource import Resource, build_custom_hateoas
from superdesk import get_resource_service
from apps.archive import ArchiveVersionsResource
from apps.archive.archive import ArchiveResource, ArchiveService
from superdesk.services import BaseService
from apps.content import LINKED_IN_PACKAGES


class PostsVersionsResource(ArchiveVersionsResource):
    """
    Resource class for versions of archive_media
    """

    datasource = {
        'source': 'archive' + '_versions',
        'filter': {'type': 'composite'}
    }


class PostsVersionsService(BaseService):
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('archive_versions', req=req, lookup=lookup)


class PostsResource(ArchiveResource):
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'post'}},
        'default_sort': [('_updated', -1)]
    }

    item_methods = ['GET', 'PATCH', 'DELETE']

    schema = {}
    schema.update(ArchiveResource.schema)
    schema.update({
        'blog': Resource.rel('blogs', True),
        'particular_type': {
            'type': 'string',
            'allowed': ['post', 'item'],
            'default': 'post'
        },
        'post_status': {
            'type': 'string',
            'allowed': ['open', 'draft'],
            'default': 'open'
        },
        'deleted': {
            'type': 'string'
        },
    })
    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class PostsService(ArchiveService):
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        docs = super().get(req, lookup)
        return docs

    def on_create(self, docs):
        for doc in docs:
            doc['type'] = 'composite'
        super().on_create(docs)

    def on_created(self, docs):
        super().on_created(docs)
        push_notification('posts', created=1)

    def on_updated(self, updates, original):
        super().on_updated(updates, original)
        push_notification('posts', updated=1)

    def get_item_update_data(self, item, links, delete=True):
        doc = {LINKED_IN_PACKAGES: links}
        if not item.get('cid'):
            doc['blog'] = item.get('blog')
        if delete:
            doc['deleted'] = 'on'
        return doc

    def on_deleted(self, doc):
        super().on_deleted(doc)
        push_notification('posts', deleted=1)


class BlogPostsResource(Resource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/posts'
    schema = PostsResource.schema
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'post'}},
        'default_sort': [('_updated', -1)]
    }
    resource_methods = ['GET']
    privileges = {'GET': 'blogs'}


class BlogPostsService(ArchiveService):
    custom_hateoas = {'self': {'title': 'Posts', 'href': '/{location}/{_id}'}}

    def get(self, req, lookup):
        if lookup.get('blog_id'):
            lookup['blog'] = ObjectId(lookup['blog_id'])
            del lookup['blog_id']
        docs = super().get(req, lookup)
        for doc in docs:
            build_custom_hateoas(self.custom_hateoas, doc, location='posts')
            for assoc in self.packageService._get_associations(doc):
                if assoc.get('residRef'):
                    item = get_resource_service('archive').find_one(req=None, _id=assoc['residRef'])
                    assoc['item'] = item
        return docs
