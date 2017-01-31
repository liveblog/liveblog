import logging

from bson import ObjectId
from flask import current_app as app
from flask import Blueprint, abort, request
from flask_cors import CORS
from superdesk import get_resource_service
from superdesk.notification import push_notification
from superdesk.resource import Resource
from superdesk.services import BaseService

from .auth import ConsumerBlogTokenAuth
from .tasks import send_post_to_consumer, send_posts_to_consumer
from .utils import (api_error, api_response, cast_to_object_id,
                    create_syndicated_blog_post, generate_api_key,
                    get_post_creator, get_producer_post_id)

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
    'token': {
        'type': 'string',
        'unique': True
    },
    'auto_retrieve': {
        'type': 'boolean',
        'default': True
    },
    'start_date': {
        'type': 'datetime',
        'default': None
    }
}


class SyndicationOutService(BaseService):
    notification_key = 'syndication_out'

    def _cursor(self, resource=None):
        resource = resource or self.datasource
        return app.data.mongo.pymongo(resource=resource).db[resource]

    def _get_blog(self, blog_id):
        return self._cursor('blogs').find_one({'_id': ObjectId(blog_id)})

    def _lookup(self, consumer_id, producer_blog_id, consumer_blog_id):
        lookup = {'$and': [
            {'consumer_id': {'$eq': consumer_id}},
            {'blog_id': {'$eq': producer_blog_id}},
            {'consumer_blog_id': {'$eq': consumer_blog_id}}
        ]}
        return lookup

    def get_syndication(self, consumer_id, producer_blog_id, consumer_blog_id):
        try:
            return self.find(self._lookup(consumer_id, producer_blog_id, consumer_blog_id))[0]
        except IndexError:
            return

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

    def on_updated(self, updates, original):
        super().on_updated(updates, original)
        start_date = updates.get('start_date')
        if start_date and start_date != original['start_date']:
            doc = original.copy()
            doc.update(updates)
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
    },
    'auto_retrieve': {
        'type': 'boolean',
        'default': True
    },
    'start_date': {
        'type': 'datetime',
        'default': None
    }
}


class SyndicationInService(BaseService):
    notification_key = 'syndication_in'

    def _lookup(self, producer_id, producer_blog_id, consumer_blog_id):
        lookup = {'$and': [
            {'producer_id': {'$eq': producer_id}},
            {'blog_id': {'$eq': consumer_blog_id}},
            {'producer_blog_id': {'$eq': producer_blog_id}}
        ]}
        return lookup

    def get_syndication(self, producer_id, producer_blog_id, consumer_blog_id):
        try:
            return self.find(self._lookup(producer_id, producer_blog_id, consumer_blog_id))[0]
        except IndexError:
            return

    def is_syndicated(self, producer_id, producer_blog_id, consumer_blog_id):
        logger.warning('SyndicationInService.is_syndicated is deprecated!')
        item = self.get_syndication(producer_id, producer_blog_id, consumer_blog_id)
        return bool(item)

    def on_create(self, docs):
        super().on_create(docs)
        for doc in docs:
            cast_to_object_id(doc, ['blog_id', 'producer_id', 'producer_blog_id', 'consumer_blog_id'])

    def on_delete(self, doc):
        super().on_delete(doc)
        posts = get_resource_service('archive')
        syndicated_posts = posts.find({'syndication_in': doc['_id']})
        for post in syndicated_posts:
            logger.warning('Delete syndication_in: {}'.format(post['_id']))
            posts.system_update(post['_id'], {'syndication_in': None}, post)
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
