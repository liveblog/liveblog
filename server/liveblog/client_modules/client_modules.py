import pymongo
import json

from bson import ObjectId
from liveblog.blogs.blogs import BlogsResource
from superdesk.services import BaseService
from liveblog.posts.posts import PostsService, PostsResource, BlogPostsService, BlogPostsResource
from superdesk.users.users import UsersResource
from superdesk.metadata.utils import item_url
from flask import current_app as app
from liveblog.items.items import ItemsResource, ItemsService
from liveblog.common import check_comment_length
from superdesk.resource import Resource
from eve.utils import config
from superdesk import get_resource_service
from flask import Blueprint, request, make_response
from flask_cors import CORS


blog_posts_blueprint = Blueprint('blog_posts', __name__)
CORS(blog_posts_blueprint)

class ClientUsersResource(Resource):
    datasource = {
        'source': 'users',
        'projection': {
            'password': 0,
            'avatar': 0,
            'renditions': 0,
            'email': 0,
            'role': 0,
            'session_preferences': 0,
            'user_preferences': 0,
            'user_type': 0,
            'is_active': 0,
            'is_enabled': 0,
            'last_name': 0,
            'first_name': 0,
            'sign_off': 0,
            'needs_activation': 0,
            '_created': 0,
            '_updated': 0,
            '_etag': 0,
            'dateline_source': 0,
            'username': 0
        }
    }

    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']
    schema = {}
    schema.update(UsersResource.schema)


class ClientUsersService(BaseService):
    def get(self, req, lookup):
        config.IF_MATCH = False
        return super().get(req, lookup)


class ClientBlogsResource(BlogsResource):
    datasource = {
        'source': 'blogs',
        'default_sort': [('_updated', -1)]
    }
    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']
    schema = {}
    schema.update(BlogsResource.schema)


class ClientBlogsService(BaseService):
    pass


class ClientPostsResource(PostsResource):
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'post'}},
        'default_sort': [('order', -1)]
    }
    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']
    schema = {}
    schema.update(PostsResource.schema)


class ClientPostsService(PostsService):
    pass


class ClientItemsResource(ItemsResource):
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'item'}},
        'default_sort': [('order', -1)]
    }
    public_methods = ['GET', 'POST']
    public_item_methods = ['GET', 'POST']
    item_methods = ['GET']
    resource_methods = ['GET', 'POST']
    schema = {
        'client_blog': Resource.rel('client_blogs', True)
    }
    schema.update(ItemsResource.schema)


class ClientItemsService(ItemsService):
    def on_create(self, docs):
        for doc in docs:
            check_comment_length(doc['text'])
        super().on_create(docs)


class ClientCommentsResource(PostsResource):
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'post'}},
        'default_sort': [('order', -1)]
    }
    public_methods = ['GET', 'POST']
    public_item_methods = ['GET', 'POST']
    item_methods = ['GET']
    resource_methods = ['GET', 'POST']
    schema = {
        'client_blog': Resource.rel('client_blogs', True),
        'blog': {
            'type': 'string'
        }
    }
    schema.update(PostsResource.schema)


class ClientCommentsService(PostsService):
    def on_create(self, docs):
        for doc in docs:
            if request.method == 'POST':
                doc['post_status'] = 'comment'
                # blog_id is kept also under the name blog as a string
                # so that it can be further used to auto-refresh the back-office
                doc['blog'] = str(doc['client_blog'])
        super().on_create(docs)


class ClientBlogPostsResource(BlogPostsResource):
    url = 'client_blogs/<regex("[a-f0-9]{24}"):blog_id>/posts'
    schema = PostsResource.schema
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'post'}},
        'default_sort': [('order', -1)]
    }
    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'blogs'}
    item_url = item_url


class ClientBlogPostsService(BlogPostsService):

    def get(self, req, lookup):
        cache_key = 'lb_ClientBlogPostsService_get_%s' % (hash(frozenset(req.__dict__.items())))
        blog_id = lookup.get('blog_id')
        docs = app.blog_cache.get(blog_id, cache_key)
        if not docs:
            docs = super().get(req, lookup)
            app.blog_cache.set(blog_id, cache_key, docs)
        return docs


class Blog:
    """
    Utility class to fetch blog data directly from mongo collections.
    """
    order_by = ('_updated', '_created')
    default_order_by = '_updated'
    sort = ('asc', 'desc')
    default_sort = 'desc'

    def __init__(self, blog):
        if isinstance(blog, (str, ObjectId)):
            blog = get_resource_service('client_blogs').find_one(_id=blog, req=None)

        self._blog = blog
        self._posts = get_resource_service('client_posts')

    def _validate_order_by(self, order_by):
        if order_by not in self.order_by:
            raise ValueError(order_by)

    def _validate_sort(self, sort):
        if sort not in self.sort:
            raise ValueError(sort)

    def _posts_lookup(self, sticky=None, highlight=None):
        filters = [
            {'blog': {'$eq': self._blog['_id']}},
            {'post_status': {'$eq': 'open'}},
            {'deleted': {'$eq': False}}
        ]
        if sticky:
            filters.append({'sticky': {'$eq': sticky}})
        if highlight:
            filters.append({'highlight': {'$eq': highlight}})
        return {'$and': filters}


    def posts(self, sticky=None, highlight=None, order_by=default_order_by, sort=default_sort, page=1, limit=25,
              wrap=False):
        # Validate parameters.
        self._validate_sort(sort)
        self._validate_order_by(order_by)

        # Fetch total.
        results = self._posts.find(self._posts_lookup(sticky, highlight))
        total = results.count()

        # Get sorting direction.
        if sort == 'asc':
            sort = pymongo.ASCENDING
        else:
            sort = pymongo.DESCENDING

        # Fetch posts, do pagination and sorting.
        skip = limit * (page - 1)
        results = results.skip(skip).limit(limit).sort(order_by, sort)
        posts = []
        for doc in results:
            if 'groups' not in doc:
                continue

            for group in doc['groups']:
                if group['id'] == 'main':
                    for ref in group['refs']:
                        ref['item'] = get_resource_service('archive').find_one(req=None, _id=ref['residRef'])
            posts.append(doc)

        if wrap:
            # Wrap in python-eve style data structure
            return {
                '_items': posts,
                '_meta': {
                    'page': page,
                    'total': total,
                    'max_results': limit
                }
            }
        else:
            # Return posts.
            return posts


@blog_posts_blueprint.route('/api/v2/client_blogs/<blog_id>/posts', methods=['GET'])
def get_blog_posts(blog_id):
    args = request.args

    posts_service = get_resource_service('posts')
    lookup = {'blog': ObjectId(blog_id)}
    cursor = posts_service.get(req=None, lookup=lookup)

    documents = []
    for document in cursor:
        documents.append(document)

    return make_response(json.dumps(documents), 200)


    # sticky highlight max_results page order_by order