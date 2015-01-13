from apps.content import metadata_schema
from bson.objectid import ObjectId
from eve.utils import ParsedRequest
from superdesk.notification import push_notification
from superdesk.resource import Resource, build_custom_hateoas
from superdesk.services import BaseService
from superdesk.utc import utcnow

from liveblog.common import update_dates_for, get_user
from superdesk import get_resource_service
from apps.archive.common import generate_guid, GUID_TAG


posts_schema = {
    'guid': metadata_schema['guid'],
    'text': metadata_schema['body_html'],
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'pubstatus': metadata_schema['pubstatus'],
    'type': metadata_schema['type'],
    'groups': metadata_schema['groups'],
    'linked_in_packages': metadata_schema['linked_in_packages'],
    'meta': {'type': 'string'},
    'blog': Resource.rel('blogs', True),
    'particular_type': {
        'type': 'string',
        'allowed': ['post', 'item'],
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
    privileges = {'GET': 'blogs', 'POST': 'blogs', 'DELETE': 'blogs'}


class PostsService(BaseService):
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('posts', req=req, lookup=lookup)

    def perform_insert(self, docs, associations, ids):
        post_id = None
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))
            doc['type'] = 'composite'
            doc['guid'] = generate_guid(type=GUID_TAG)
            if not post_id:
                doc['particular_type'] = 'post'
                post_id = super().create([doc])[0]
                ids.append(post_id)
            else:
                doc['particular_type'] = 'item'
                doc['linked_in_packages'] = [{'package': post_id}]
                item_id = get_resource_service('items').post([doc])[0]
                ids.append(item_id)
                associations.append({"itemRef": "/items/%s" % item_id})
        return post_id

    def perform_update(self, guid, docs, associations, ids):
        pass

    def create(self, docs, **kwargs):
        print("kwargs: ", kwargs)
        post_id = None
        associations = []
        ids = []
        for doc in docs:
            if 'guid' in doc:
                post_id = self.perform_update(docs, associations, ids)
            else:
                post_id = self.perform_insert(docs, associations, ids)
            break
        if post_id and associations:
            super().patch(post_id, {"groups": [{"group": {"role": "items", "associations": associations}}]})
        return ids

    def on_created(self, docs):
        push_notification('posts', created=1)

    def on_update(self, updates, original):
        user = get_user()
        updates['versioncreated'] = utcnow()
        updates['version_creator'] = str(user.get('_id'))

    def on_updated(self, updates, original):
        push_notification('posts', updated=1)

    def on_deleted(self, doc):
        push_notification('posts', deleted=1)


class BlogPostsResource(Resource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/posts'
    schema = posts_schema
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'post'}},
        'default_sort': [('_updated', -1)]
    }
    resource_methods = ['GET']
    privileges = {'GET': 'blogs'}


class BlogPostsService(BaseService):
    custom_hateoas = {'self': {'title': 'Posts', 'href': '/{location}/{_id}'}}

    def get(self, req, lookup):
        if lookup.get('blog_id'):
            lookup['blog'] = ObjectId(lookup['blog_id'])
            del lookup['blog_id']
        docs = super().get(req, lookup)
        for doc in docs:
            build_custom_hateoas(self.custom_hateoas, doc, location='posts')
        return docs
