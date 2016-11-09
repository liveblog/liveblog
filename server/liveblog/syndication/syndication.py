import logging
from bson import ObjectId
from flask import current_app as app
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.celery_app import celery
from superdesk import get_resource_service
from .utils import generate_api_key, cast_to_object_id, api_response
from .auth import ConsumerBlogTokenAuth
from flask import Blueprint, request, abort
from flask_cors import CORS
from superdesk.metadata.item import GUID_NEWSML, GUID_FIELD
from superdesk.metadata.item import ITEM_TYPE, ITEM_STATE, CONTENT_STATE, CONTENT_TYPE
from apps.archive.common import (generate_guid, generate_unique_id_and_name)


logger = logging.getLogger('superdesk')
syndication_blueprint = Blueprint('syndication', __name__)
CORS(syndication_blueprint)


syndication_out_schema = {
    'blog_id': Resource.rel('blogs', embeddable=True, required=True, type="objectid"),
    'consumer_id': Resource.rel('consumers', embeddable=True, required=True, type="objectid"),
    'consumer_blog_id': {
        'type': 'objectid',
        'required': True
    },
    'last_delivered_post_id': {
        'type': 'objectid',
        'nullable': True
    },
    'token': {
        'type': 'string',
        'unique': True
    }
}


@celery.task(soft_time_limit=1800)
def send_syndication_post(syndication_out, post, action='created'):
    """ Celery task to send blog post updates to consumers."""
    consumers = get_resource_service('consumers')
    consumers.send_syndication_post(syndication_out, post, action)


class SyndicationOutService(BaseService):
    notification_key = 'syndication_out'

    def _cursor(self):
        return app.data.mongo.pymongo(resource=self.datasource).db[self.datasource]

    def _get_blog(self, blog_id):
        return get_resource_service('blogs').find_one(req=None, _id=blog_id)

    def is_syndicated(self, consumer_id, producer_blog_id, consumer_blog_id):
        lookup = {'$and': [
            {'consumer_id': {'$eq': consumer_id}},
            {'blog_id': {'$eq': producer_blog_id}},
            {'consumer_blog_id': {'$eq': consumer_blog_id}}
        ]}
        logger.debug('SyndicationOut.is_syndicated lookup: {}'.format(lookup))
        collection = self.find(lookup)
        if collection.count():
            return True
        else:
            return False

    def get_blog_syndication(self, blog):
        cursor = self._cursor()
        if isinstance(blog, (str, ObjectId)):
            blog = self._get_blog(str(blog))

        if not blog['syndication_enabled']:
            logger.info('Syndication not enabled for blog "{}"'.format(blog['_id']))
            return []
        else:
            return cursor.find({'blog_id': {'$eq': blog['_id']}})

    def has_blog_syndication(self, blog):
        out_syndication = self.get_blog_syndication(blog)
        if not out_syndication:
            return False
        else:
            return bool(out_syndication.count())

    def send_syndication_post(self, post, action='created'):
        blog_id = post['blog']
        out_service = get_resource_service('syndication_out')
        out_syndication = out_service.get_blog_syndication(blog_id)
        for out in out_syndication:
            send_syndication_post.delay(out, post, action)
        else:
            logger.info('Not sending post "{}" as blog "{}" has no syndication.'.format(post['_id'], blog_id))

    def on_create(self, docs):
        super().on_create(docs)
        for doc in docs:
            if not doc.get('token'):
                doc['token'] = generate_api_key()
            cast_to_object_id(doc, ['consumer_id', 'blog_id', 'consumer_blog_id'])


class SyndicationOut(Resource):
    datasource = {
        'source': 'syndication_out',
        'search_backend': None,
        'default_sort': [('_updated', -1)],
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'syndication_out', 'PATCH': 'syndication_out', 'PUT': 'syndication_out',
                  'DELETE': 'syndication_out'}
    schema = syndication_out_schema


syndication_in_schema = {
    'blog_id': Resource.rel('blogs', embeddable=True, required=True, type="objectid"),
    'blog_token': {
        'type': 'string',
        'required': True,
        'unique': True
    },
    'producer_id': Resource.rel('producers', embeddable=True, required=True, type="objectid"),
    'producer_blog_id': {
        'type': 'objectid',
        'required': True
    }
}


# TODO: on created, run celery task to fetch old blog posts.
class SyndicationInService(BaseService):
    notification_key = 'syndication_in'

    def is_syndicated(self, producer_id, producer_blog_id, consumer_blog_id):
        lookup = {'$and': [
            {'producer_id': {'$eq': producer_id}},
            {'blog_id': {'$eq': consumer_blog_id}},
            {'producer_blog_id': {'$eq': producer_blog_id}}
        ]}
        logger.debug('SyndicationIn.is_syndicated lookup: {}'.format(lookup))
        collection = self.find(lookup)
        if collection.count():
            return True
        else:
            return False

    def on_create(self, docs):
        super().on_create(docs)
        for doc in docs:
            cast_to_object_id(doc, ['blog_id', 'producer_id', 'producer_blog_id', 'consumer_blog_id'])


class SyndicationIn(Resource):
    datasource = {
        'source': 'syndication_in',
        'search_backend': None,
        'default_sort': [('_updated', -1)],
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'syndication_in', 'PATCH': 'syndication_in', 'PUT': 'syndication_in',
                  'DELETE': 'syndication_in'}
    schema = syndication_in_schema


def _duplicate_item(doc):
    """Legacy code taken from superdesk apps.archive.archive.ArchiveService._duplicate_item """
    posts_service = get_resource_service('blog_posts')
    new_doc = doc.copy()
    posts_service._remove_after_copy(new_doc)
    new_doc[GUID_FIELD] = generate_guid(type=GUID_NEWSML)
    generate_unique_id_and_name(new_doc)
    new_doc.setdefault('_id', new_doc[GUID_FIELD])
    new_doc['force_unlock'] = True
    new_doc[ITEM_STATE] = CONTENT_STATE.PUBLISHED
    return new_doc


def _duplicate_content(self, original_doc):
    """Legacy code taken from superdesk apps.archive.archive.ArchiveService._duplicate_content"""
    posts_service = get_resource_service('blog_posts')
    if original_doc.get(ITEM_TYPE, '') != CONTENT_TYPE.TEXT:
        raise NotImplementedError('Post item_type not supported.')

    return _duplicate_item(original_doc)


@syndication_blueprint.route('/api/syndication/webhook', methods=['POST'])
def syndication_webhook():
    in_service = get_resource_service('syndication_in')
    blog_token = request.headers['Authorization']
    in_syndication = in_service.find_one(blog_token=blog_token, req=None)
    # Get post from request json, clean fields, add syndication_in reference and change blog id.
    post = request.get_json()
    producer_post_id = post['_id']
    new_post = _duplicate_item(post)
    new_post['blog'] = in_syndication['blog_id']
    new_post['syndication_in'] = in_syndication['_id']
    new_post['producer_post_id'] = producer_post_id
    # Create post content
    posts_service = get_resource_service('blog_posts')
    new_post_id = posts_service.create([new_post])[0]
    return api_response({'post_id': new_post_id}, 201)


def _syndication_blueprint_auth():
    auth = ConsumerBlogTokenAuth()
    authorized = auth.authorized(allowed_roles=[], resource='syndication_blogs')
    if not authorized:
        return abort(401, 'Authorization failed.')


syndication_blueprint.before_request(_syndication_blueprint_auth)
