import logging
from flask import current_app as app
from superdesk.resource import Resource
from superdesk.services import BaseService
from .utils import generate_api_key


logger = logging.getLogger('superdesk')


syndication_out_schema = {
    'blog_id': Resource.rel('blogs', embeddable=True, required=True, type="string"),
    'consumer_id': Resource.rel('consumers', embeddable=True, required=True, type="string"),
    'consumer_blog_id': {
        'type': 'string',
        'required': True
    },
    'last_delivered_post_id': {
        'type': 'string',
        'nullable': True
    },
    'token': {
        'type': 'string',
        'unique': True
    }
}


class SyndicationOutService(BaseService):
    notification_key = 'syndication_out'

    def is_syndicated(self, consumer_id, producer_blog_id, consumer_blog_id):
        cursor = app.data.mongo.pymongo(resource=self.datasource).db[self.datasource]
        lookup = {'$and': [
            {'consumer_id': {'$eq': consumer_id}},
            {'blog_id': {'$eq': producer_blog_id}},
            {'consumer_blog_id': {'$eq': consumer_blog_id}}
        ]}
        logger.debug('SyndicationOut.is_syndicated lookup: {}'.format(lookup))
        collection = cursor.find(lookup)
        if collection.count():
            return True
        else:
            return False

    def on_create(self, docs):
        super().on_create(docs)
        for doc in docs:
            if not doc.get('token'):
                doc['token'] = generate_api_key()


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
    'blog_id': Resource.rel('blogs', embeddable=True, required=True, type="string"),
    'blog_token': {
        'type': 'string',
        'required': True,
        'unique': True
    },
    'producer_id': Resource.rel('producers', embeddable=True, required=True, type="string"),
    'producer_blog_id': {
        'type': 'string',
        'required': True
    }
}


# TODO: on created, run celery task to fetch old blog posts.
class SyndicationInService(BaseService):
    notification_key = 'syndication_in'

    def is_syndicated(self, producer_id, producer_blog_id, consumer_blog_id):
        cursor = app.data.mongo.pymongo(resource=self.datasource).db[self.datasource]
        lookup = {'$and': [
            {'producer_id': {'$eq': producer_id}},
            {'blog_id': {'$eq': consumer_blog_id}},
            {'producer_blog_id': {'$eq': producer_blog_id}}
        ]}
        logger.debug('SyndicationIn.is_syndicated lookup: {}'.format(lookup))
        collection = cursor.find(lookup)
        if collection.count():
            return True
        else:
            return False


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
