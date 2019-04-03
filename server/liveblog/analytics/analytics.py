import json
import logging

from bson import ObjectId
from eve.utils import config
from flask import Blueprint
from flask import current_app as app
from flask import make_response, request
from flask_cors import CORS

from superdesk import get_resource_service
from superdesk.resource import Resource
from superdesk.services import BaseService

from liveblog.utils.hooks import build_hook_data, events, trigger_hooks
from settings import TRIGGER_HOOK_URLS


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
    config.PAGINATION_LIMIT = 500
    datasource = {
        'source': 'analytics'
    }
    resource_methods = ['GET']


class BlogAnalyticsService(BaseService):
    notification_key = 'blog_analytics'


def _trigger_embed_hook(blog_id, url):
    cache = app.cache
    hook_cache_key = 'first_embeded_blog_{0}'.format(blog_id)
    cached_hook = cache.get(hook_cache_key)

    if cached_hook != blog_id:
        blog = get_resource_service('blogs').find_one(
            req=None, checkUser=False, _id=blog_id)
        author = get_resource_service('users').find_one(
            req=None, _id=ObjectId(blog['original_creator']))

        hook_data = build_hook_data(
            events.BLOG_FIRST_EMBEDDED, email=author['email'], blog_id=blog_id, url=url)
        trigger_hooks(hook_data)

        # do not expire as we want this only once
        cache.set(hook_cache_key, blog_id, timeout=0)


@analytics_blueprint.route('/api/analytics/hit', methods=['POST'])
def analytics_hit():
    amp = request.args.get('amp', None)

    if amp:
        context_url = request.args.get('context_url', None)
        blog_id = request.args.get('blog_id', None)
    else:
        data = request.get_json()
        context_url = data['context_url']
        blog_id = data['blog_id']

    # check ip of origin of request
    # request may have been forwarded by proxy
    if 'X-Forwarded-For' in request.headers:
        ip = request.headers.getlist('X-Forwarded-For')[0].rpartition(' ')[-1]
    else:
        ip = request.remote_addr or 'untrackable'

    # use ip as key and blog_id as value in cache
    cache = app.cache
    cached = cache.get(ip)
    if cached == blog_id:
        return make_response('hit already registered', 406)

    if TRIGGER_HOOK_URLS and context_url:
        _trigger_embed_hook(blog_id, context_url)

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
