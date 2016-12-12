import logging
from bson import ObjectId
from flask import current_app as app
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service
from superdesk.notification import push_notification
from flask import Blueprint, request, abort
from flask_cors import CORS

from .auth import ConsumerBlogTokenAuth
from .tasks import send_post_to_consumer, send_posts_to_consumer
from .utils import (generate_api_key, cast_to_object_id, api_response, api_error, create_syndicated_blog_post,
                    get_producer_post_id, get_post_creator)


logger = logging.getLogger('superdesk')
syndication_blueprint = Blueprint('syndication', __name__)
CORS(syndication_blueprint)


WEBHOOK_METHODS = {
    'created': 'POST',
    'updated': 'PUT',
    'deleted': 'DELETE'
}


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
        # Prevent "loops" by sending only posts without syndication_in set.
        if post.get('syndication_in'):
            logger.warning('Not sending post "{}": syndicated content.'.format(post['_id']))
            return

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

    def on_created(self, docs):
        super().on_created(docs)
        for doc in docs:
            send_posts_to_consumer.delay(doc)

    def on_deleted(self, doc):
        super().on_deleted(doc)
        # send notifications
        push_notification(self.notification_key, syndication_out=doc, deleted=True)


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
    },
    'producer_blog_title': {
        'type': 'string',
        'required': True
    },
    'auto_publish': {
        'type': 'boolean',
        'default': False
    }
}


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

    def on_deleted(self, doc):
        super().on_deleted(doc)
        # send notifications
        push_notification(self.notification_key, syndication_in=doc, deleted=True)


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


@syndication_blueprint.route('/api/syndication/webhook', methods=['POST', 'PUT', 'DELETE'])
def syndication_webhook():
    in_service = get_resource_service('syndication_in')
    blog_token = request.headers['Authorization']
    in_syndication = in_service.find_one(blog_token=blog_token, req=None)

    data = request.get_json()
    try:
        items, producer_post = data['items'], data['post']
    except KeyError:
        return api_error('Bad Request', 400)

    logger.info('Webhook Request - method: {} items: {} post: {}'.format(request.method, items, producer_post))
    posts_service = get_resource_service('posts')
    producer_post_id = get_producer_post_id(in_syndication, producer_post['_id'])
    post = posts_service.find_one(req=None, producer_post_id=producer_post_id)

    post_id = None
    publisher = None
    if post:
        post_id = str(post['_id'])
        publisher = get_post_creator(post)

    if publisher:
        return api_error('Post "{}" cannot be updated: already updated by "{}"'.format(
                         post_id, publisher), 409)

    if request.method in ('POST', 'PUT'):
        new_post = create_syndicated_blog_post(producer_post, items, in_syndication)
        if request.method == 'POST':
            # Create post
            if post:
                return api_error('Post already exist', 409)

            new_post_id = posts_service.post([new_post])[0]
            return api_response({'post_id': str(new_post_id)}, 201)
        else:
            # Update post
            if not post:
                return api_error('Post does not exist', 404)

            posts_service.update(post_id, new_post, post)
            return api_response({'post_id': post_id}, 200)
    else:
        # Delete post
        posts_service.update(post_id, {'deleted': True}, post)
        return api_response({'post_id': post_id}, 200)


def _syndication_blueprint_auth():
    auth = ConsumerBlogTokenAuth()
    authorized = auth.authorized(allowed_roles=[], resource='syndication_blogs')
    if not authorized:
        return abort(401, 'Authorization failed.')


syndication_blueprint.before_request(_syndication_blueprint_auth)
