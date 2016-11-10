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
from superdesk.metadata.item import ITEM_TYPE, CONTENT_TYPE


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
    'last_delivered_post_id': Resource.rel('posts', embeddable=True, required=True,
                                           nullable=True, type="objectid"),
    'token': {
        'type': 'string',
        'unique': True
    }
}


class SyndicationOutService(BaseService):
    notification_key = 'syndication_out'

    def _cursor(self, resource=None):
        resource = resource or self.datasource
        return app.data.mongo.pymongo(resource=resource).db[resource]

    def _get_blog(self, blog_id):
        return self._cursor('blogs').find_one({'_id': ObjectId(blog_id)})

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

    def get_blog_syndication(self, blog_id):
        blog = self._get_blog(blog_id)
        if not blog['syndication_enabled']:
            logger.info('Syndication not enabled for blog "{}"'.format(blog['_id']))
            return []
        else:
            logger.info('Syndication enabled for blog "{}"'.format(blog['_id']))
            return self.find({'blog_id': blog_id})

    def has_blog_syndication(self, blog):
        out_syndication = self.get_blog_syndication(blog)
        if not out_syndication:
            return False
        else:
            return bool(out_syndication.count())

    def send_syndication_post(self, post, action='created'):
        blog_id = ObjectId(post['blog'])
        out_syndication = self.get_blog_syndication(blog_id)
        for out in out_syndication:
            logger.info('syndication_out:"{}" post:"{}" blog:"{}"'.format(out['_id'], post['_id'], blog_id))
            send_post_to_consumer.delay(out, post, action)

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


def _get_post_items(original_doc):
    items_service = get_resource_service('items')
    item_type = original_doc.get(ITEM_TYPE, '')
    if item_type != CONTENT_TYPE.COMPOSITE:
        raise NotImplementedError('Post item_type "{}" not supported.'.format(item_type))

    items = []
    for group in original_doc['groups']:
        if group['id'] == 'main':
            for ref in group['refs']:
                item = items_service.find_one(req=None, guid=ref['guid'])
                if ref['type'] == 'text':
                    items.append({
                        'text': item['text'],
                        'item_type': 'text'
                    })
    return items


@celery.task(soft_time_limit=1800)
def send_post_to_consumer(syndication_out, old_post, action='created'):
    """ Celery task to send blog post updates to consumers."""
    logger.warning('syndication_out:"{}" post:"{}" action:"{}"'.format(syndication_out['_id'], old_post['_id'], action))
    consumers = get_resource_service('consumers')
    items = _get_post_items(old_post)
    consumers.send_post(syndication_out, {'items': items, 'producer_post': old_post}, action)


@syndication_blueprint.route('/api/syndication/webhook', methods=['POST'])
def syndication_webhook():
    in_service = get_resource_service('syndication_in')
    items_service = get_resource_service('blog_items')
    blog_token = request.headers['Authorization']
    in_syndication = in_service.find_one(blog_token=blog_token, req=None)

    data = request.get_json()
    items, old_post = data['items'], data['producer_post']

    for item in items:
        item['blog'] = in_syndication['blog_id']

    item_ids = items_service.post(items)
    item_refs = []
    for item_id in item_ids:
        item_refs.append({'residRef': str(item_id)})

    new_post = {
        'blog': in_syndication['blog_id'],
        'groups': [
            {
                'id': 'root',
                'role': 'grpRole:NEP',
                'refs': [
                    {'idRef': 'main'}
                ]
            },
            {
                'id': 'main',
                'role': 'grpRole:Main',
                'refs': item_refs
            }
        ],
        'highlight': False,
        'particular_type': 'post',
        'post_status': 'open',
        'producer_post_id': old_post['_id'],
        'sticky': False,
        'syndication_in': in_syndication['_id']
    }
    # Create post content
    posts_service = get_resource_service('posts')
    new_post_id = posts_service.post([new_post])[0]
    return api_response({'post_id': str(new_post_id)}, 201)


def _syndication_blueprint_auth():
    auth = ConsumerBlogTokenAuth()
    authorized = auth.authorized(allowed_roles=[], resource='syndication_blogs')
    if not authorized:
        return abort(401, 'Authorization failed.')


syndication_blueprint.before_request(_syndication_blueprint_auth)
