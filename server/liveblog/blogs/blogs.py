from superdesk.notification import push_notification
from superdesk.utc import utcnow
from eve.utils import ParsedRequest
from apps.archive.archive import ArchiveResource, ArchiveService
from superdesk.services import BaseService
from apps.archive.archive import ArchiveVersionsResource
from liveblog.common import get_user, update_dates_for
from apps.content import metadata_schema
from apps.archive.common import generate_guid, GUID_TAG
from superdesk import get_resource_service
from superdesk.resource import Resource
from bson.objectid import ObjectId

blogs_schema = {
    'guid': metadata_schema['guid'],
    'title': metadata_schema['headline'],
    'description': metadata_schema['description'],
    'theme': {
        'type': 'dict'
    },
    'settings': {'type': 'dict'},
    'picture_url': {
        'type': 'string',
    },
    'picture': Resource.rel('upload', True),
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
    'members': {
        'type': 'list',
        'schema': {
            'type': 'dict',
            'schema': {
                'user': Resource.rel('users', True)
            }
        }
    },
    'blog_preferences': {
        'type': 'dict'
    }
}


class BlogsVersionsResource(ArchiveVersionsResource):
    """
    Resource class for versions of archive_media
    """

    datasource = {
        'source': 'archive' + '_versions',
        'filter': {'type': 'composite'}
    }


class BlogsVersionsService(BaseService):
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

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}

    schema = blogs_schema


class BlogService(ArchiveService):

    def get_theme_snapshot(self, theme_name):
        theme = get_resource_service('themes').find_one(req=None, name=theme_name)
        if theme is not None:
            theme['_id'] = str(theme['_id'])
        return theme

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))
            doc['guid'] = generate_guid(type=GUID_TAG)
            # set the blog_preferences by merging given preferences with global_prefs
            global_prefs = get_resource_service('global_preferences').get_global_prefs()
            prefs = global_prefs.copy()
            prefs.update(doc.get('blog_preferences', {}))
            doc['blog_preferences'] = prefs
            # save a snapshot of the theme in the `theme` field
            if 'theme' in prefs:
                doc['theme'] = self.get_theme_snapshot(prefs['theme'])

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        docs = super().get(req, lookup)
        return docs

    def find_one(self, req, **lookup):
        doc = super().find_one(req, **lookup)
        return doc

    def on_created(self, docs):
        push_notification('blogs', created=1)

    def on_update(self, updates, original):
        # if the theme changed, we republish the blog with the new one
        if 'blog_preferences' in updates and 'theme' in updates['blog_preferences']:
            if updates['blog_preferences']['theme'] != original['blog_preferences'].get('theme'):
                updates['theme'] = original.get('theme')
                new_theme = self.get_theme_snapshot(updates['blog_preferences']['theme'])
                if new_theme:
                    for key in original['theme'].keys():
                        if key not in new_theme:
                            # remove fields that are not in new_theme
                            updates['theme'][key] = None
                    for key, value in new_theme.items():
                        # add or update fields that are new
                        updates['theme'][key] = value

        updates['versioncreated'] = utcnow()
        updates['version_creator'] = str(get_user().get('_id'))

    def on_updated(self, updates, original):
        push_notification('blogs', updated=1)

    def on_deleted(self, doc):
        push_notification('blogs', deleted=1)


class UserBlogsResource(Resource):
    url = 'users/<regex("[a-f0-9]{24}"):user_id>/blogs'
    schema = blogs_schema
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'blog'}},
        'default_sort': [('title', 1)]
    }

    resource_methods = ['GET']


class UserBlogsService(BaseService):
    def get(self, req, lookup):
        if lookup.get('user_id'):
            lookup['members.user'] = ObjectId(lookup['user_id'])
            del lookup['user_id']
        return super().get(req, lookup)
