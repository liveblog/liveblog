import logging
import flask
import datetime

from flask import current_app as app
from bson.objectid import ObjectId
from eve.utils import ParsedRequest
from superdesk.notification import push_notification
from superdesk.resource import Resource, build_custom_hateoas, not_analyzed
from apps.archive import ArchiveVersionsResource
from apps.archive.archive import ArchiveResource, ArchiveService
from superdesk.services import BaseService
from superdesk.metadata.packages import LINKED_IN_PACKAGES
from superdesk.utc import utcnow
from superdesk.users.services import current_user_has_privilege
from superdesk.errors import SuperdeskApiError
from superdesk import get_resource_service
from liveblog.common import check_comment_length, get_user

from settings import EDIT_POST_FLAG_TTL
from ..blogs.utils import check_limit_and_delete_oldest, get_blog_stats
from .tasks import update_post_blog_data, update_post_blog_embed
from .mixins import AuthorsMixin


logger = logging.getLogger('superdesk')
DEFAULT_POSTS_ORDER = [('order', -1), ('firstcreated', -1)]


# monkey patch so we can update superdesk core resources in Elastic
# TODO: figure out if there is a better way to achieve this
# We need the tags to be not_analyzed to be able to filter by array
schema_patch = {
    'tags': {
        'type': 'list',
        'default': [],
        'mapping': not_analyzed
    }
}

ArchiveResource.schema.update(schema_patch)


def get_publisher():
    publisher = getattr(flask.g, 'user', None)
    if not publisher:
        return None

    publisher_keys = (
        '_created', '_etag', '_id', '_updated', 'username',
        'display_name', 'sign_off', 'byline', 'email')

    return {k: publisher.get(k, None) for k in publisher_keys}


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
        'search_backend': 'elastic',
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
        },
        'repeat_syndication': Resource.rel('repeat_syndication', embeddable=True, required=False, nullable=True),
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
            blog_id = doc.get('blog')
            post = {}
            post['id'] = doc.get('_id')
            post['blog'] = blog_id

            # Check if post has syndication_in entry.
            post['syndication_in'] = doc.get('syndication_in')
            synd_in_id = doc.get('syndication_in')
            if synd_in_id:
                # Set post auto_publish to syndication_in auto_publish value.
                synd_in = get_resource_service('syndication_in').find_one(_id=synd_in_id, req=None)
                if synd_in:
                    post['auto_publish'] = synd_in.get('auto_publish')

            posts.append(post)
            app.blog_cache.invalidate(blog_id)

            # Update blog post data and embed for SEO-enabled blogs.
            update_post_blog_data.delay(doc, action='created')
            update_post_blog_embed.delay(doc)

            # send post to consumer webhook
            if doc['post_status'] == 'open':
                logger.info('Send document to consumers (if syndicated): {}'.format(doc['_id']))
                out_service.send_syndication_post(doc, action='created')

            # let's check for posts limits in blog and remove old one if needed
            if blog_id:
                check_limit_and_delete_oldest(blog_id)

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
            original['blog'] = ObjectId(original['groups'][1]['refs'][0]['item']['client_blog'])
            updates['blog'] = ObjectId(original['groups'][1]['refs'][0]['item']['client_blog'])
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
        blog_id = original.get('blog')
        app.blog_cache.invalidate(blog_id)
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
            _posts = [{'post_id': original.get('_id'), 'blog': blog_id}]
            push_notification('posts', deleted=True, posts=_posts)

            stats = get_blog_stats(blog_id)
            if stats:
                push_notification('blog:limits', blog_id=blog_id, stats=stats)
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


class PostFlagResource(Resource):
    datasource = {
        'source': 'post_flags'
    }
    schema = {
        'postId': Resource.rel(
            'posts',
            type='string',
            embeddable=True,
            required=False
        ),

        # Flag type because in future we might want to add
        # other types of flag like lock, unlock among others
        # flag_type edit => it's just used to show alert in frontend
        'flag_type': {
            'type': 'string',
            'allowed': ['edit'],
            'default': 'edit'
        },

        'users': {
            'type': 'list',
            'nullable': True,
        },

        # TTL for the flag, this ensures the flag doesn't stay there forever
        'expireAt': {
            'type': 'datetime'
        },
    }

    item_methods = ['PUT', 'GET', 'DELETE']
    privileges = {'GET': 'posts', 'POST': 'posts', 'DELETE': 'posts'}

    mongo_indexes = {
        'edit_flag_ttl': ([('expireAt', 1)], {'expireAfterSeconds': 0}),
        'unique_flag_x_post': ([('postId', 1), ('flag_type', 1)], {'unique': True})
    }


def complete_flag_info(flag):
    if not flag:
        return

    users = []
    if 'users' in flag:
        for userId in flag['users']:
            users.append(get_resource_service('users').find_one(req=None, _id=userId))
        flag['users'] = users

    # so this we have _links available for other methods in frontend
    build_custom_hateoas(PostFlagService.custom_hateoas, flag, location='post_flags')


class PostFlagService(BaseService):
    custom_hateoas = {'self': {'title': 'Post Flag', 'href': '/{location}/{_id}'}}

    def create(self, docs, **kwargs):
        """
        Basically we override this to avoid repeated entries in flag.
        We need to check flag and postId, if exists we extract users and
        append them to new doc that will be created
        """

        userId = get_user()['_id']

        for doc in docs:
            doc['users'] = [userId]
            doc['expireAt'] = utcnow() + datetime.timedelta(seconds=EDIT_POST_FLAG_TTL)

            doc_exists = self.find_one(
                req=None, postId=doc['postId'], flag_type=doc['flag_type'])

            if doc_exists:
                doc['users'] += doc_exists['users']
                doc['users'] = list(set(doc['users']))
                # super delete to avoid notification :)
                super().delete(lookup={'_id': doc_exists['_id']})

        return super().create(docs, **kwargs)

    def on_created(self, docs):
        for doc in docs:
            complete_flag_info(doc)

        # send notifications
        push_notification('posts:updateFlag', flags=docs)

    def delete(self, lookup):
        # this delete method it's kind of special, because it might delete just
        # the user which is leaving the editor but keep the flag because there are
        # more than one user editing the same post
        update = False
        flag = self.find_one(req=None, **lookup)

        if (len(flag['users']) > 1):
            current_user = get_user()['_id']
            updates = flag.copy()
            updates['users'].remove(ObjectId(current_user))
            flag = self.update(flag['_id'], updates, flag)
            update = True
        else:
            super().delete(lookup)

        complete_flag_info(flag)
        self.delete_notify(flag, update=update)

        return flag

    def delete_notify(self, flag, update=False):
        push_notification('posts:deletedFlag', flag=flag, update=update)


class BlogPostsResource(Resource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/posts'
    schema = PostsResource.schema
    datasource = PostsResource.datasource
    resource_methods = ['GET']
    privileges = {'GET': 'posts'}


class BlogPostsService(ArchiveService, AuthorsMixin):
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
        related_items = self._related_items_map(docs)

        for doc in docs:
            build_custom_hateoas(self.custom_hateoas, doc, location='posts')
            for assoc in self.packageService._get_associations(doc):
                ref_id = assoc.get('residRef', None)
                if ref_id is not None:
                    assoc['item'] = related_items[ref_id]

            self.extract_author_ids(doc)

        # now that we have authors id, let's hit db once
        self.generate_authors_map()
        self.attach_authors(docs)

        return docs

    def _related_items_map(self, docs):
        """It receives an array of blogs and we extract the associations' ID
        then we hit the database just 1 time and return them as dictionary"""

        items_map = {}
        ids = []

        for doc in docs:
            for assoc in self.packageService._get_associations(doc):
                ref_id = assoc.get('residRef', None)
                if ref_id:
                    ids.append(ref_id)

        # now let's get this into a form of dictionary
        for item in get_resource_service('archive').find({'_id': {'$in': ids}}):
            items_map[item.get('_id')] = item

        return items_map

    def on_fetched(self, blog):
        super().on_fetched(blog)

        posts_flags_map = self._flags_for_posts(blog['_items'])

        for post in blog['_items']:
            self._add_flags_info(post, posts_flags_map)

    def _flags_for_posts(self, posts):
        """
        Dictionary of {postId: flag} for later usage instead of hitting database
        """
        flags_map = {}

        post_ids = [post['_id'] for post in posts]
        for flag in get_resource_service('post_flags').find({'postId': {'$in': post_ids}}):
            flags_map[flag.get('postId')] = flag

        return flags_map

    def _add_flags_info(self, post, flags_map):
        # time to get info from editing flags
        flag = flags_map.get(post['_id'])

        # let's replace users id with real information
        if (flag):
            users = []
            for userId in flag['users']:
                users.append(get_resource_service('users').find_one(req=None, _id=userId))
            flag['users'] = users

            # so this we have _links available for other methods in frontend
            build_custom_hateoas(PostFlagService.custom_hateoas, flag, location='post_flags')
            post['edit_flag'] = flag

        return post
