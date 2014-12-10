from apps.content import metadata_schema, LINKED_IN_PACKAGES
from bson.objectid import ObjectId
from eve.utils import ParsedRequest
from superdesk.notification import push_notification
from superdesk.resource import Resource, build_custom_hateoas
from superdesk.services import BaseService
from superdesk.utc import utcnow

from liveblog.common import update_dates_for, get_user


posts_schema = {
    'text': metadata_schema['body_html'],
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'pubstatus': metadata_schema['pubstatus'],
    'type': metadata_schema['type'],
    'groups': metadata_schema['groups'],
    LINKED_IN_PACKAGES:  metadata_schema[LINKED_IN_PACKAGES],
    'meta': {'type': 'string'},    
    'blog': Resource.rel('blogs', True),
    'particular_type': {
        'type': 'string',
        'allowed': ['post'],
        'default': 'post'
    }
}


class PostsResource(Resource):
    datasource = {
      'source': 'archive',
      'elastic_filter': {'term': {'particular_type': 'post'}},
      'default_sort': [('_updated', -1)]
    }
    schema = posts_schema
    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class PostsService(BaseService):

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))
            
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('posts', req=req, lookup=lookup)
    
    def on_update(self, updates, original):
        user = get_user()
        updates['versioncreated'] = utcnow()
        updates['version_creator'] = str(user.get('_id'))

    def on_created(self, docs):
        push_notification('posts', created=1)
    
    def on_updated(self, updates, original):
        push_notification('posts', updated=1)

    def on_deleted(self, doc):
        push_notification('posts', deleted=1)


class BlogPostResource(Resource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/posts'
    schema = {
              'parent_post_id': Resource.rel('posts', True)
    }
    schema.update(posts_schema)
    datasource = {
        'source': 'posts'
    }
    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}
    resource_methods = ['GET', 'POST']

    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class BlogPostService(BaseService):
    custom_hateoas = {'self': {'title': 'Posts', 'href': '/{location}/{_id}'}}

    def get(self, req, lookup):
        if lookup.get('blog_id'):
            lookup['blog'] = ObjectId(lookup['blog_id'])
            del lookup['blog_id']
        docs = super().get(req, lookup)
        for doc in docs:
            build_custom_hateoas(self.custom_hateoas, doc, location='posts')
        return docs
