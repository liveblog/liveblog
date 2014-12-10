from superdesk.notification import push_notification
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.utc import utcnow
from eve.utils import ParsedRequest

from liveblog.common import get_user, update_dates_for
from apps.content import metadata_schema


class BlogsResource(Resource):
    datasource = {
        'source': 'archive',
        'search_backend': 'elastic',
        'elastic_filter': {'term': {'particular_type': 'blog'}},
        'default_sort': [('_updated', -1)]
    }
    
    schema = {
              'title': metadata_schema['headline'],
              'description': metadata_schema['description'],
              'language': metadata_schema['language'],
              'settings': {'type': 'dict'},
              'original_creator': metadata_schema['original_creator'],
              'version_creator': metadata_schema['version_creator'],
              'state': {
                    'type': 'string',
                    'allowed': ['open', 'closed'],
                    'default': 'open'
               },
              'particular_type': {
                            'type': 'string',
                            'allowed': ['blog'],
                            'default': 'blog'
            }
    }
    
    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class BlogService(BaseService):

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))
            
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
