import logging
from flask import request, abort, Blueprint
from superdesk.services import BaseService
from superdesk import get_resource_service
from liveblog.blogs.blogs import blogs_schema
from flask_cors import CORS

from .utils import api_error, api_response
from .auth import CustomAuthResource, ConsumerApiKeyAuth


logger = logging.getLogger('superdesk')
blogs_blueprint = Blueprint('syndication_blogs', __name__)
CORS(blogs_blueprint)


class BlogService(BaseService):
    notification_key = 'syndication_blogs'


class BlogResource(CustomAuthResource):
    url = 'syndication/blogs'
    authentication = ConsumerApiKeyAuth
    datasource = {
        'source': 'blogs',
        'search_backend': None,
        'default_sort': [('_updated', -1)],
        'filter': {'syndication_enabled': True},
        'projection': {'syndication_enabled': 0}
    }
    schema = blogs_schema
    item_methods = ['GET']


def _get_consumer_from_auth():
    consumers = get_resource_service('consumers')
    consumer_api_key = request.headers['Authorization']
    consumer = consumers.find_one(api_key=consumer_api_key, req=None)
    return consumer


def _create_blogs_syndicate(blog_id, consumer_blog_id):
    consumer = _get_consumer_from_auth()
    out_service = get_resource_service('syndication_out')
    consumer_id = str(consumer['_id'])
    if out_service.is_syndicated(consumer_id, blog_id, consumer_blog_id):
        return api_error('Syndication already sent for blog "{}".'.format(blog_id), 409)
    else:
        syndication_id = out_service.post([{
            'blog_id': blog_id,
            'consumer_id': consumer_id,
            'consumer_blog_id': consumer_blog_id
        }])[0]
        syndication = out_service.find_one(_id=syndication_id, req=None)
        return api_response({
            'token': syndication['token'],
            'consumer_blog_id': consumer_blog_id  # we return it anyway for consistency.
        }, 201)


def _delete_blogs_syndicate(blog_id, consumer_blog_id):
    consumer = _get_consumer_from_auth()
    out_service = get_resource_service('syndication_out')
    consumer_id = str(consumer['_id'])
    if not out_service.is_syndicated(consumer_id, blog_id, consumer_blog_id):
        return api_error('Syndication not sent for blog "{}".'.format(blog_id), 409)
    else:
        out_service.delete({
            'blog_id': blog_id,
            'consumer_id': consumer_id,
            'consumer_blog_id': consumer_blog_id
        })
        return api_response({}, 204)


@blogs_blueprint.route('/api/syndication/blogs/<string:blog_id>/syndicate', methods=['POST', 'DELETE'])
def blogs_syndicate(blog_id):
    consumer_blog_id = request.get_json().get('consumer_blog_id')
    if not consumer_blog_id:
        return api_error('Missing "consumer_blog_id" in form data.', 422)

    if request.method == 'DELETE':
        return _delete_blogs_syndicate(blog_id, consumer_blog_id)
    else:
        return _create_blogs_syndicate(blog_id, consumer_blog_id)


def _blogs_blueprint_auth():
    auth = ConsumerApiKeyAuth()
    authorized = auth.authorized(allowed_roles=[], resource='syndication_blogs')
    if not authorized:
        return abort(401, 'Authorization failed.')


blogs_blueprint.before_request(_blogs_blueprint_auth)
