from superdesk.notification import push_notification
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.utc import utcnow
from eve.utils import ParsedRequest

from liveblog.common import get_user, update_dates_for
from apps.content import metadata_schema
from apps.archive.common import generate_guid, GUID_TAG
from superdesk import get_resource_service


class BlogsResource(Resource):
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
        'blog_preferences': {
            'type': 'dict'
        }
    }

    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class BlogService(BaseService):

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))
            doc['guid'] = generate_guid(type=GUID_TAG)
            doc['blog_preferences'] = get_resource_service('global_preferences').get_global_prefs()

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('blogs', req=req, lookup=lookup)

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
