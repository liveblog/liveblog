from bson.objectid import ObjectId
from eve.utils import ParsedRequest
from superdesk.notification import push_notification
from superdesk.resource import Resource, build_custom_hateoas
from superdesk import get_resource_service
from apps.archive import ArchiveVersionsResource
from apps.archive.archive import ArchiveResource, ArchiveService
from superdesk.services import BaseService
from apps.content import LINKED_IN_PACKAGES
from superdesk.celery_app import update_key
from flask import current_app as app
import flask
from superdesk.utc import utcnow
from apps.users.services import current_user_has_privilege
from superdesk.errors import SuperdeskApiError

DEFAULT_POSTS_ORDER = [('order', -1), ('firstcreated', -1)]


def private_draft_filter():
    """Filter out users private drafts.
    As private we treat items where user is creator
    """
    private_filter = {'should': [{'term': {'post_status': 'open'}},
                                 {'term': {'post_status': 'submitted'}}]}
    user = getattr(flask.g, 'user', None)
    if user:
        private_filter['should'].append(
            {'term': {'original_creator': str(user['_id'])}}
        )
    return {'bool': private_filter}


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
        'elastic_filter_callback': private_draft_filter,
        'elastic_filter': {'term': {'particular_type': 'post'}},
        'default_sort': DEFAULT_POSTS_ORDER
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
            'allowed': ['open', 'draft', 'submitted'],
            'default': 'open'
        },
        'deleted': {
            'type': 'boolean',
            'default': False
        },
        'order': {
            'type': 'number',
            'default': 0
        },
        'published_date': {
            'type': 'datetime'
        },
        'unpublished_date': {
            'type': 'datetime'
        },
        'publisher': Resource.rel('users', True),
    })
    privileges = {'GET': 'posts', 'POST': 'posts', 'PATCH': 'posts', 'DELETE': 'posts'}


class PostsService(ArchiveService):
    def find_one(self, req, **lookup):
        doc = super().find_one(req, **lookup)
        try:
            # include items in the response
            for assoc in self.packageService._get_associations(doc):
                if assoc.get('residRef'):
                    item = get_resource_service('archive').find_one(req=None, _id=assoc['residRef'])
                    assoc['item'] = item
        except Exception:
            pass
        return doc

    def get_next_order_sequence(self):
        return update_key('post_order_sequence', True)

    def check_post_permission(self, post):
        to_be_checked = (
            dict(status='open', privilege_required='publish_post'),
            dict(status='submitted', privilege_required='submit_post')
        )
        for rule in to_be_checked:
            if 'post_status' in post and post['post_status'] == rule['status']:
                if not current_user_has_privilege(rule['privilege_required']):
                    raise SuperdeskApiError.forbiddenError(
                        message='User does not have sufficient permissions.')

    def on_create(self, docs):
        for doc in docs:
            # check permission
            self.check_post_permission(doc)
            doc['type'] = 'composite'
            doc['order'] = self.get_next_order_sequence()
            # if you publish a post directly which is not a draft it will have a published_date assigned
            if doc['post_status'] == 'open':
                doc['published_date'] = utcnow()
                doc['publisher'] = flask.g.user['_id']
        super().on_create(docs)

    def on_created(self, docs):
        super().on_created(docs)
        # invalidate cache for updated blog
        for doc in docs:
            app.blog_cache.invalidate(doc.get('blog'))
        # send notifications
        push_notification('posts', created=True)

    def on_update(self, updates, original):
        # check permission
        post = original.copy()
        post.update(updates)
        self.check_post_permission(post)
        # put the published item from drafts and contributions at the top of the timeline
        if updates.get('post_status') == 'open' and original.get('post_status') in ('draft', 'submitted'):
            updates['order'] = self.get_next_order_sequence()
            # if you publish a post it will save a published date and register who did it
            updates['published_date'] = utcnow()
            updates['publisher'] = flask.g.user['_id']
        if original.get('post_status') == 'open' and updates.get('post_status') != 'open':
            updates['unpublished_date'] = utcnow()
        super().on_update(updates, original)

    def on_updated(self, updates, original):
        super().on_updated(updates, original)
        # invalidate cache for updated blog
        app.blog_cache.invalidate(original.get('blog'))
        # send notifications
        if updates.get('deleted', False):
            push_notification('posts', deleted=True, post_id=original.get('_id'))
        elif updates.get('post_status') == 'draft':
            push_notification('posts', drafted=True, post_id=original.get('_id'),
                              author_id=original.get('original_creator'))
        else:
            push_notification('posts', updated=True)

    def get_item_update_data(self, item, links, delete=True):
        doc = {LINKED_IN_PACKAGES: links}
        if not item.get('cid'):
            doc['blog'] = item.get('blog')
        if delete:
            doc['deleted'] = True
        return doc

    def on_deleted(self, doc):
        super().on_deleted(doc)
        # invalidate cache for updated blog
        app.blog_cache.invalidate(doc.get('blog'))
        # send notifications
        push_notification('posts', deleted=True)


class BlogPostsResource(Resource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/posts'
    schema = PostsResource.schema
    datasource = PostsResource.datasource
    resource_methods = ['GET']
    privileges = {'GET': 'posts'}


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
