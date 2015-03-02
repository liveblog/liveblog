from superdesk.notification import push_notification
from superdesk.utc import utcnow
from eve.utils import ParsedRequest
from apps.archive.archive import ArchiveResource, ArchiveService
from apps.archive.archive import ArchiveVersionsService, ArchiveVersionsResource

from liveblog.common import get_user, update_dates_for
from apps.content import metadata_schema
from apps.archive.common import generate_guid, GUID_TAG
from superdesk.celery_app import update_key


class BlogsVersionsResource(ArchiveVersionsResource):
    """
    Resource class for versions of archive_media
    """

    datasource = {
        'source': 'archive' + '_versions',
        'filter': {'type': 'composite'}
    }


class BlogsVersionsService(ArchiveVersionsService):
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('archive_versions', req=req, lookup=lookup)


class BlogsResource(ArchiveResource):
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'blog'}},
        'default_sort': [('_updated', -1)]
    }

    schema = {
        'guid': metadata_schema['guid'],
        'title': metadata_schema['headline'],
        'description': metadata_schema['description'],
        'language': Resource.rel('languages', True),
        'theme': Resource.rel('themes', True),
        'settings': {'type': 'dict'},
        'original_creator': metadata_schema['original_creator'],
        'version_creator': metadata_schema['version_creator'],
        'versioncreated': metadata_schema['versioncreated'],
        'blog_status': {
            'type': 'string',
            'allowed': ['open', 'closed'],
            'default': 'open'
        },
        'particular_type': {
            'type': 'string',
            'allowed': ['blog'],
            'default': 'blog'
        },
        'cid': {
            'type': 'integer'
        }
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


def set_cid_on_blogs(item):
    key = 'blog_cid' + str(item.get('blog'))
    cid = update_key(key, flag=True)
    if cid:
        item['cid'] = cid
    return cid


def update_last_cid(item):
    key = 'blog_cid' + str(item.get('_id'))
    cid = update_key(key, flag=False)
    if cid:
        item['cid'] = cid
    return cid


class BlogService(ArchiveService):

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))
            doc['guid'] = generate_guid(type=GUID_TAG)

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        docs = super().get(req, lookup)
        return docs

    def find_one(self, req, **lookup):
        doc = super().find_one(req, **lookup)
        update_last_cid(doc)
        return doc

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
