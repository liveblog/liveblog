import json

from liveblog.blogs.blogs import BlogsResource
from superdesk.services import BaseService
from liveblog.posts.posts import PostsService, PostsResource, BlogPostsService, BlogPostsResource
from superdesk.users.users import UsersResource
from superdesk.metadata.utils import item_url
from flask import current_app as app
from liveblog.items.items import ItemsResource, ItemsService
from liveblog.common import check_comment_length
from liveblog.blogs.blog import Blog
from superdesk.resource import Resource
from eve.utils import config
from eve.io.mongo import MongoJSONEncoder
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


@blog_posts_blueprint.route('/api/v2/client_blogs/<blog_id>/posts', methods=['GET'])
def get_blog_posts(blog_id):
    blog = Blog(blog_id)
    args = request.args
    posts = blog.posts(**args)
    response_data = []

    # Convert posts
    for post in posts:
        doc = {}

        # copy selected fields
        keys = ['_id', '_etag', '_created', '_updated', 'blog', 'lb_highlight', 'sticky', 'deleted', 'post_status',
                'published_date', 'unpublished_date']
        for key in keys:
            if key in post.keys():
                doc[key] = post[key]

        # add items in post
        doc['items'] = []
        for g in post.get('groups', []):
            if g['id'] != 'main':
                continue

            for item in g['refs']:
                doc['items'].append(_get_converted_item(item['item']))

        # add authorship
        publisher = {}
        publisher['display_name'] = post['publisher']['display_name']
        publisher['picture_url'] = post['publisher']['picture_url']
        doc['publisher'] = publisher

        response_data.append(doc)

    data = json.dumps({'posts': response_data}, cls=MongoJSONEncoder)
    return make_response(data, 200)


def _get_converted_item(item):
    converted = {}
    converted['_id'] = item['_id']
    item_type = item['item_type']
    converted['item_type'] = item_type
    converted['text'] = item['text']

    if item_type == 'embed':
        converted['meta'] = item['meta']
    elif item_type == 'quote':
        converted['meta'] = item['meta']
    elif item_type == 'image':
        meta = {}
        meta['caption'] = item['meta']['caption']
        meta['credit'] = item['meta']['credit']
        converted['meta'] = meta
        converted['renditions'] = item['meta']['media']['renditions']

    return converted
