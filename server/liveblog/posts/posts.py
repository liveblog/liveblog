import logging
from bson.objectid import ObjectId
from eve.utils import ParsedRequest
from superdesk.notification import push_notification
from superdesk.resource import Resource, build_custom_hateoas
from apps.archive import ArchiveVersionsResource
from apps.archive.archive import ArchiveResource, ArchiveService
from superdesk.services import BaseService
from superdesk.metadata.packages import LINKED_IN_PACKAGES
from flask import current_app as app
import flask
from superdesk.utc import utcnow
from superdesk.users.services import current_user_has_privilege
from superdesk.errors import SuperdeskApiError
from superdesk import get_resource_service
from liveblog.common import check_comment_length

from .tasks import update_post_blog_data, update_post_blog_embed


logger = logging.getLogger('superdesk')
DEFAULT_POSTS_ORDER = [('order', -1), ('firstcreated', -1)]


def get_publisher():
    publisher = getattr(flask.g, 'user', None)
    if not publisher:
        return None
    return {k: publisher.get(k, None) for k in ('_created',
                                                '_etag',
                                                '_id',
                                                '_updated',
                                                'username',
                                                'display_name',
                                                'sign_off',
                                                'byline',
                                                'email')}


def private_draft_filter():
    """Filter out users private drafts.
    As private we treat items where user is creator
    """
    private_filter = {'should': [{'term': {'post_status': 'open'}},
                                 {'term': {'post_status': 'submitted'}},
                                 {'term': {'post_status': 'comment'}},
                                 {'term': {'post_status': 'ad'}}]}
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
            'allowed': ['open', 'draft', 'submitted', 'comment'],
            'default': 'open'
        },
        'lb_highlight': {
            'type': 'boolean',
            'default': False
        },
        'sticky': {
            'type': 'boolean',
            'default': False
        },
        'deleted': {
            'type': 'boolean',
            'default': False
        },
        'order': {
            'type': 'float',
            'default': 0.00
        },
        'published_date': {
            'type': 'datetime'
        },
        'unpublished_date': {
            'type': 'datetime'
        },
        'publisher': {
            'type': 'dict',
            'mapping': {
                'type': 'object',
                'enabled': False
            }
        },
        'content_updated_date': {
            'type': 'datetime'
        },
        'syndication_in': Resource.rel('syndication_in', embeddable=True, required=False, nullable=True),
        'producer_post_id': {
            'type': 'string',
            'nullable': True
        }
    })
    privileges = {'GET': 'posts', 'POST': 'posts', 'PATCH': 'posts', 'DELETE': 'posts'}
    mongo_indexes = {
        '_created_1': ([('_created', 1)]),
        '_created_-1': ([('_created', -1)]),
        'order_-1': ([('order', -1)]),
    }


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

    def get_next_order_sequence(self, blog_id):
        if blog_id is None:
            return 0.00
        # get next order sequence and increment it
        blog = get_resource_service('blogs').find_and_modify(
            query={'_id': blog_id},
            update={'$inc': {'posts_order_sequence': 1}},
            upsert=False)
        if blog:
            order = blog and blog.get('posts_order_sequence') or None
            # support previous LB version when the sequence was not save into the blog
            if order is None:
                # find the highest order in the blog
                req = ParsedRequest()
                req.sort = '-order'
                req.max_results = 1
                post = next(self.get_from_mongo(req=req, lookup={'blog': blog_id}), None)
                if post and post.get('order') is not None:
                    order = post.get('order') + 1
                    # save the order into the blog
                    get_resource_service('blogs').update(blog_id, {'posts_order_sequence': order + 1}, blog)
                else:
                    order = 0.00
        else:
            order = 0.00
        return float(order)

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
            doc['order'] = self.get_next_order_sequence(doc.get('blog'))
            # if you publish a post directly which is not a draft it will have a published_date assigned
            if doc['post_status'] == 'open':
                # published date will be set in a syndicated post
                if 'published_date' not in doc.keys():
                    doc['published_date'] = utcnow()
                doc['content_updated_date'] = doc['published_date']
                doc['publisher'] = get_publisher()
        super().on_create(docs)

    def on_created(self, docs):
        super().on_created(docs)
        # invalidate cache for updated blog
        posts = []
        out_service = get_resource_service('syndication_out')
        for doc in docs:
            post = {}
            post['id'] = doc.get('_id')

            # Check if post has syndication_in entry.
            post['syndication_in'] = doc.get('syndication_in')
            synd_in_id = doc.get('syndication_in')
            if synd_in_id:
                # Set post auto_publish to syndication_in auto_publish value.
                synd_in = get_resource_service('syndication_in').find_one(_id=synd_in_id, req=None)
                if synd_in:
                    post['auto_publish'] = synd_in.get('auto_publish')

            posts.append(post)
            app.blog_cache.invalidate(doc.get('blog'))

            # Update blog post data and embed for SEO-enabled blogs.
            update_post_blog_data.delay(doc, action='created')
            update_post_blog_embed.delay(doc)

            # send post to consumer webhook
            if doc['post_status'] == 'open':
                logger.info('Send document to consumers (if syndicated): {}'.format(doc['_id']))
                out_service.send_syndication_post(doc, action='created')

        # send notifications
        push_notification('posts', created=True, post_status=doc['post_status'], posts=posts)

    def on_update(self, updates, original):
        # check if the timeline is reordered
        if updates.get('order'):
            blog = get_resource_service('blogs').find_one(req=None, _id=original['blog'])
            if blog['posts_order_sequence'] == updates['order']:
                blog['posts_order_sequence'] = self.get_next_order_sequence(original.get('blog'))
        # in the case we have a comment
        if original['post_status'] == 'comment':
            original['blog'] = original['groups'][1]['refs'][0]['item']['client_blog']
            updates['blog'] = original['groups'][1]['refs'][0]['item']['client_blog']
            # if the length of the comment is not between 1 and 300 then we get an error
            check_comment_length(original['groups'][1]['refs'][0]['item']['text'])
        # check if updates `content` is diffrent then the original.
        content_diff = False
        if not updates.get('groups', False):
            content_diff = False
        elif len(original['groups'][1]['refs']) != len(updates['groups'][1]['refs']):
            content_diff = True
        else:
            for index, val in enumerate(updates['groups'][1]['refs']):
                item = get_resource_service('archive').find_one(req=None, _id=val['residRef'])
                if item['text'] != original['groups'][1]['refs'][index]['item']['text']:
                    content_diff = True
                    break
        if content_diff:
            updates['content_updated_date'] = utcnow()

        # check permission
        post = original.copy()
        post.update(updates)
        self.check_post_permission(post)
        # when publishing, put the published item from drafts and contributions at the top of the timeline
        if updates.get('post_status') == 'open' and original.get('post_status') in ('draft', 'submitted', 'comment'):
            updates['order'] = self.get_next_order_sequence(original.get('blog'))
            # if you publish a post it will save a published date and register who did it
            updates['published_date'] = utcnow()
            updates['publisher'] = get_publisher()
            # if you publish a post and hasn't `content_updated_date` add it.
            if not updates.get('content_updated_date', False):
                updates['content_updated_date'] = updates['published_date']
            # assure that the item info is keept if is needed.
            if original.get('post_status') == 'submitted' and original.get('original_creator', False) \
                    and updates.get('groups', False):
                item_resource = get_resource_service('items')
                for container in updates['groups'][1]['refs']:
                    item_id = container.get('residRef')
                    found = item_resource.find_one(req=None, _id=item_id)
                    item_resource.update(item_id, {'original_creator': original.get('original_creator')}, found)

        # when unpublishing
        if original.get('post_status') == 'open' and updates.get('post_status') != 'open':
            updates['unpublished_date'] = utcnow()
        super().on_update(updates, original)

    def on_updated(self, updates, original):
        super().on_updated(updates, original)
        out_service = get_resource_service('syndication_out')
        # invalidate cache for updated blog
        app.blog_cache.invalidate(original.get('blog'))
        doc = original.copy()
        doc.update(updates)
        posts = []
        # send notifications
        if updates.get('deleted', False):
            # Update blog post data and embed for SEO-enabled blogs.
            update_post_blog_data.delay(doc, action='deleted')
            update_post_blog_embed.delay(doc)
            # Syndication.
            out_service.send_syndication_post(original, action='deleted')
            # Push notification.
            push_notification('posts', deleted=True, post_id=original.get('_id'))
        # NOTE: Seems unsused, to be removed later if no bug appears.
        # elif updates.get('post_status') == 'draft':
        #     push_notification('posts', drafted=True, post_id=original.get('_id'),
        #                       author_id=original.get('original_creator'))
        else:
            # Update blog post data and embed for SEO-enabled blogs.
            update_post_blog_data.delay(doc, action='updated')
            update_post_blog_embed.delay(doc)

            # Syndication
            logger.info('Send document to consumers (if syndicated): {}'.format(doc['_id']))
            posts.append(doc)

            if updates.get('post_status') == 'open':
                if original['post_status'] in ('submitted', 'draft', 'comment'):
                    # Post has been published as contribution, then published.
                    # Syndication will be sent with 'created' action.
                    out_service.send_syndication_post(doc, action='created')
                else:
                    out_service.send_syndication_post(doc, action='updated')
            # as far as the consumer is concerned, if a post is unpublished, it is effectively deleted
            elif original['post_status'] == 'open':
                out_service.send_syndication_post(doc, action='deleted')

            push_notification('posts', updated=True, posts=posts)

    def get_item_update_data(self, item, links, delete=True):
        doc = {LINKED_IN_PACKAGES: links}
        if not item.get('cid'):
            doc['blog'] = item.get('blog')
        if delete:
            doc['deleted'] = True
        return doc

    def on_deleted(self, doc):
        super().on_deleted(doc)
        # Invalidate cache for updated blog
        app.blog_cache.invalidate(doc.get('blog'))

        # Update blog post data and embed for SEO-enabled blogs.
        update_post_blog_data.delay(doc, action='deleted')
        update_post_blog_embed.delay(doc)

        # Syndication
        out_service = get_resource_service('syndication_out')
        out_service.send_syndication_post(doc, action='deleted')

        # Send notifications
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
        imd = req.args.items()
        for key in imd:
            if key[1][97:104] == 'comment':  # TODO: fix
                if lookup.get('blog_id'):
                    lookup['client_blog'] = ObjectId(lookup['blog_id'])
                    del lookup['blog_id']
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
