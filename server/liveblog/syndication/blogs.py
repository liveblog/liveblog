from flask import request, abort, Blueprint
from superdesk.services import BaseService
from superdesk import get_resource_service
from liveblog.blogs.blogs import blogs_schema

from .utils import api_error, api_response
from .auth import CustomAuthResource, ConsumerApiKeyAuth


blogs_blueprint = Blueprint('syndication_blogs', __name__)


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


@blogs_blueprint.route('/api/syndication/blogs/<blog_id>/syndicate', methods=['POST'])
def blogs_syndicate(blog_id):
    consumer_api_key = request.headers['Authorization']
    consumer_blog_id = request.form.get('consumer_blog_id')
    if not consumer_blog_id:
        return api_response(api_error('Missing "consumer_blog_id" in form data.'), 422)

    consumer = get_resource_service('consumers').find_one(api_key=consumer_api_key, req=None)

    out_service = get_resource_service('syndication_out')
    syndication = out_service.find_one(blog_id=blog_id, consumer_id=consumer._id,
                                       consumer_blog_id=consumer_blog_id, req=None)
    if syndication:
        return api_response('Syndication already sent for blog "{}".'.format(blog_id), 409)

    syndication_id = out_service.post([{
        'blog_id': blog_id,
        'consumer_id': consumer._id,
        'consumer_blog_id': consumer_blog_id
    }])[0]
    syndication = out_service.find_one(_id=syndication_id, req=None)

    return api_response({
        'token': syndication.token,
        'consumer_blog_id': consumer_blog_id
    }, 201)


def _blogs_blueprint_auth():
    auth = ConsumerApiKeyAuth()
    authorized = auth.authorized(allowed_roles=[], resource='syndication_blogs')
    if not authorized:
        return abort(401, 'Authorization failed.')


blogs_blueprint.before_request(_blogs_blueprint_auth)
