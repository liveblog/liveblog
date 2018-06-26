from itertools import groupby
from liveblog.blogs.blogs import BlogsResource
from liveblog.advertisements.collections import CollectionsService, CollectionsResource
from liveblog.advertisements.outputs import OutputsService, OutputsResource
from liveblog.advertisements.advertisements import AdvertisementsService, AdvertisementsResource
from superdesk.services import BaseService
from superdesk.errors import SuperdeskApiError
from liveblog.posts.posts import PostsService, PostsResource, BlogPostsService, BlogPostsResource
from superdesk.users.users import UsersResource
from superdesk.metadata.utils import item_url
from flask import current_app as app
from liveblog.items.items import ItemsResource, ItemsService
from liveblog.common import check_comment_length
from liveblog.blogs.blog import Blog
from liveblog.utils.api import api_error, api_response
from superdesk.resource import Resource
from eve.utils import config
from flask import Blueprint, request
from flask_cors import CORS
from distutils.util import strtobool
from superdesk import get_resource_service
from werkzeug.datastructures import MultiDict

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


class ClientCollectionsResource(CollectionsResource):
    datasource = {
        'source': 'collections',
        'default_sort': [('name', 1)]
    }
    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']
    schema = {}
    schema.update(CollectionsResource.schema)


class ClientCollectionsService(CollectionsService):
    pass


class ClientOutputsResource(OutputsResource):
    datasource = {
        'source': 'outputs',
        'default_sort': [('name', 1)]
    }
    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']
    schema = {}
    schema.update(OutputsResource.schema)


class ClientOutputsService(OutputsService):
    pass


class ClientAdvertisementsResource(AdvertisementsResource):
    datasource = {
        'source': 'advertisements',
        'default_sort': [('name', 1)]
    }
    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']
    schema = {}
    schema.update(AdvertisementsResource.schema)


class ClientAdvertisementsService(AdvertisementsService):
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
    def add_post_info(self, doc, items=None):
        items = items or []
        if not items:
            # Get from groups
            for group in doc.get('groups'):
                for ref in group.get('refs'):
                    item = ref.get('item')
                    if item:
                        item['original_creator'] = get_resource_service('users')\
                            .find_one(req=None, _id=item['original_creator'])
                        items.append(item)

        if not items:
            # Not available in groups. Fetch from packageService.
            for assoc in self.packageService._get_associations(doc):
                if 'residRef' in assoc:
                    item = get_resource_service('archive').find_one(req=None, _id=assoc['residRef'])
                    item['original_creator'] = get_resource_service('users')\
                        .find_one(req=None, _id=item['original_creator'])
                    items.append(item)

        items_length = len(items)
        post_items_type = None
        if items_length:
            if items_length == 1:
                if items[0].get('item_type', '').lower().startswith('advertisement'):
                    post_items_type = 'advertisement'
                elif items[0].get('item_type', '').lower() == 'embed':
                    post_items_type = 'embed'
                    if 'provider_name' in items[0]['meta']:
                        post_items_type = "{}-{}".format(post_items_type, items[0]['meta']['provider_name'].lower())
                else:
                    post_items_type = items[0].get('item_type')
            elif items_length == 2 and not all([item['item_type'] == 'embed' for item in items]):
                if items[1].get('item_type', '').lower() == 'embed' and items[0].get('item_type', '').lower() == 'text':
                    post_items_type = 'embed'
                    if 'provider_name' in items[1]['meta']:
                        post_items_type = "{}-{}".format(post_items_type, items[1]['meta']['provider_name'].lower())
                elif (items[0].get('item_type', '').lower() == 'embed' and
                        items[1].get('item_type', '').lower() == 'text'):
                    post_items_type = 'embed'
                    if 'provider_name' in items[0]['meta']:
                        post_items_type = "{}-{}".format(post_items_type, items[0]['meta']['provider_name'].lower())

            elif items_length > 1:
                for k, g in groupby(items, key=lambda i: i['item_type']):
                    if k == 'image' and sum(1 for _ in g) > 1:
                        post_items_type = 'slideshow'
                        break
        if doc.get('syndication_in'):
            doc['syndication_in'] = get_resource_service('syndication_in')\
                .find_one(req=None, _id=doc['syndication_in'])

        doc['post_items_type'] = post_items_type

        # Bring the client user in the posts so we can post.original_creator.
        # LBSD-2010
        doc['original_creator'] = get_resource_service('users') \
            .find_one(req=None, _id=doc['original_creator'])
        return doc

    def on_fetched(self, docs):
        super().on_fetched(docs)
        for doc in docs['_items']:
            self.add_post_info(doc)

    def get(self, req, lookup):
        allowed_params = {
            'start_date', 'end_date',
            'include_fields', 'exclude_fields',
            'max_results', 'page', 'version', 'where',
            'q', 'default_operator', 'filter',
            'service', 'subject', 'genre', 'urgency',
            'priority', 'type', 'item_source', 'source'
        }

        # check for unknown query parameters
        _check_for_unknown_params(request, allowed_params)

        cache_key = 'lb_ClientBlogPostsService_get_%s' % (hash(frozenset(req.__dict__.items())))
        blog_id = lookup.get('blog_id')
        docs = app.blog_cache.get(blog_id, cache_key)
        if not docs:
            docs = super().get(req, lookup)
            app.blog_cache.set(blog_id, cache_key, docs)
        return docs


def _check_for_unknown_params(request, whitelist, allow_filtering=True):
    """Check if the request contains only allowed parameters.

    :param req: object representing the HTTP request
    :type req: `eve.utils.ParsedRequest`
    :param whitelist: iterable containing the names of allowed parameters.
    :param bool allow_filtering: whether or not the filtering parameter is
        allowed (True by default). Used for disallowing it when retrieving
        a single object.

    :raises SuperdeskApiError.badRequestError:
        * if the request contains a parameter that is not whitelisted
        * if the request contains more than one value for any of the
            parameters
    """
    if not request or not getattr(request, 'args'):
        return
    request_params = request.args or MultiDict()

    if not allow_filtering:
        err_msg = ("Filtering{} is not supported when retrieving a " "single object (the \"{param}\" parameter)")

        if 'start_date' in request_params.keys():
            message = err_msg.format(' by date range', param='start_date')
            raise SuperdeskApiError.badRequestError(message=message)

        if 'end_date' in request_params.keys():
            message = err_msg.format(' by date range', param='end_date')
            raise SuperdeskApiError.badRequestError(message=message)

    for param_name in request_params.keys():
        if param_name not in whitelist:
            raise SuperdeskApiError.badRequestError(message="Unexpected parameter ({})".format(param_name))

        if len(request_params.getlist(param_name)) > 1:
            message = "Multiple values received for parameter ({})"
            raise SuperdeskApiError.badRequestError(message=message.format(param_name))


@blog_posts_blueprint.route('/api/client_item_comments/', methods=['POST'])
def create_amp_comment():
    data = request.values
    check_comment_length(data['text'])

    item_data = dict()
    item_data['text'] = data['text']
    item_data['commenter'] = data['commenter']
    item_data['client_blog'] = data['client_blog']
    item_data['item_type'] = "comment"
    items = get_resource_service('client_items')
    item_id = items.post([item_data])[0]

    comment_data = dict()
    comment_data["post_status"] = "comment"
    comment_data["client_blog"] = item_data['client_blog']
    comment_data["groups"] = [{
        "id": "root",
        "refs": [{"idRef": "main"}],
        "role": "grpRole:NEP"
    }, {
        "id": "main",
        "refs": [{"residRef": item_id}],
        "role": "grpRole:Main"}
    ]

    post_comments = get_resource_service('client_posts')
    post_comment = post_comments.post([comment_data])[0]

    comment = post_comments.find_one(req=None, _id=post_comment)

    resp = api_response(comment, 201)
    resp.headers['Access-Control-Allow-Credentials'] = 'true'
    client_domain = data.get('__amp_source_origin')
    resp.headers['Access-Control-Allow-Origin'] = client_domain
    resp.headers['AMP-Access-Control-Allow-Source-Origin'] = client_domain
    resp.headers['Access-Control-Expose-Headers'] = 'AMP-Access-Control-Allow-Source-Origin'
    return resp


@blog_posts_blueprint.route('/api/v2/client_blogs/<blog_id>/posts', methods=['GET'])
def get_blog_posts(blog_id):
    blog = Blog(blog_id)
    kwargs = {}

    # Get boolean arguments and cast string values to bool.
    try:
        kwargs['sticky'] = strtobool(request.args.get('sticky', '0'))
        kwargs['highlight'] = strtobool(request.args.get('highlight', '0'))
    except ValueError as e:
        return api_error(str(e), 403)

    # Get default ordering.
    ordering = request.args.get('ordering', Blog.default_ordering)
    if ordering not in Blog.ordering:
        return api_error('"{}" is not valid'.format(ordering), 403)
    kwargs['ordering'] = ordering

    # Get page & limit.
    try:
        kwargs['page'] = int(request.args.get('page', Blog.default_page))
        kwargs['limit'] = int(request.args.get('limit', Blog.default_page_limit))
    except ValueError as e:
        return api_error(str(e), 403)

    # Check page value.
    if kwargs['page'] < 1:
        return api_error('"page" value is not valid.', 403)

    # Check max page limit.
    if kwargs['limit'] > Blog.max_page_limit:
        return api_error('"limit" value is not valid.', 403)

    response_data = blog.posts(wrap=True, **kwargs)
    result_data = convert_posts(response_data, blog)
    return api_response(result_data, 200)


# convert posts - add items in post
def convert_posts(response_data, blog):
    fields = ['_id', '_etag', '_created', '_updated', 'blog', 'lb_highlight', 'sticky', 'deleted', 'post_status',
              'published_date', 'unpublished_date']

    for i, post in enumerate(response_data['_items']):
        doc = {k: post.get(k) for k in fields}

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
        publisher['picture_url'] = post['publisher'].get('picture_url', '')
        doc['publisher'] = publisher

        response_data['_items'][i] = doc

    # Add additional blog metadata to response _meta.
    response_data['_meta']['last_updated_post'] = blog._blog.get('last_updated_post')
    response_data['_meta']['last_created_post'] = blog._blog.get('last_created_post')
    return response_data


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
