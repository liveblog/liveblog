from flask import Blueprint, request
from flask_cors import CORS
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service
from flask import current_app as app
from flask import make_response
from bson import ObjectId
import logging
import json

logger = logging.getLogger('superdesk')

analytics_blueprint = Blueprint('analytics', __name__)
CORS(analytics_blueprint)

analytics_schema = {
    'blog_id': Resource.rel('blogs', embeddable=True, required=True, type="objectid"),
    'context_url': {
        'type': 'string',
    },
    'hits': {
        'type': 'integer'
    }
}


class AnalyticsResource(Resource):
    datasource = {
        'source': 'analytics',
        'default_sort': [('hits', 1)]
    }

    public_methods = ['GET']
    privileges = {'GET': 'analytics'}

    schema = analytics_schema


class AnalyticsService(BaseService):
    notification_key = 'analytics'


class BlogAnalyticsResource(Resource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/bloganalytics'
    schema = analytics_schema
    datasource = {
        'source': 'analytics'
    }
    resource_methods = ['GET']


class BlogAnalyticsService(BaseService):
    notification_key = 'blog_analytics'


@analytics_blueprint.route('/api/analytics/hit', methods=['POST'])
def analytics_hit():
    data = request.get_json()
    context_url = data['context_url']
    blog_id = data['blog_id']

    # check ip of origin of request
    # request may have been forwarded by proxy
    if 'X-Forwarded-For' in request.headers:
        ip = request.headers.getlist("X-Forwarded-For")[0].rpartition(' ')[-1]
    else:
        ip = request.remote_addr or 'untrackable'

    # use ip as key and blog_id as value in cache
    cache = app.cache
    cached = cache.get(ip)
    if cached == blog_id:
        return make_response('hit already registered', 406)

    # short term cache is enough here, as we just want to guard against hammering of db
    cache.set(ip, blog_id, timeout=5 * 60)

    # check blog with given id exists
    blogs_service = get_resource_service('blogs')
    blog = blogs_service.find_one(req=None, checkUser=False, _id=blog_id)
    if blog is None:
        data = json.dumps({
            '_status': 'ERR',
            '_error': 'No blog available for syndication with given id "{}".'.format(blog_id)
        })
        response = make_response(data, 409)
        return response

    # if ip is new and blog exists, add a record of a hit in db
    client = app.data.mongo.pymongo('analytics').db['analytics']
    # use upsert to be thread safe (upsert updates the record if it exists, or else creates it)
    client.update({'blog_id': ObjectId(blog_id), 'context_url': context_url}, {"$inc": {"hits": 1}}, True)

    return make_response('success', 200)
