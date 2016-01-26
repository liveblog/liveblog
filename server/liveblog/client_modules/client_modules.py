from liveblog.blogs.blogs import BlogsResource
from superdesk.services import BaseService
from liveblog.posts.posts import PostsService, PostsResource, BlogPostsService, BlogPostsResource
from superdesk.users.users import UsersResource
from superdesk.users.services import UsersService
from superdesk.metadata.utils import item_url
from flask import current_app as app
from liveblog.items.items import ItemsResource, ItemsService
from flask import request


class ClientUsersResource(UsersResource):
    datasource = {
        'source': 'users',
        'default_sort': [('_created', -1)]
    }
    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']
    schema = {}
    schema.update(UsersResource.schema)


class ClientUsersService(UsersService):
    pass


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
    schema = ItemsResource.schema
    schema.update(schema)
    schema.update({
        'name': {
            'type': 'string',
            'minlength': 1,
            'maxlength': 30
        },
        'content': {
            'type': 'string',
            'minlength': 1,
            'maxlength': 300
        }
    })


class ClientItemsService(ItemsService):
    pass


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
    schema = {}
    schema.update(PostsResource.schema)


class ClientCommentsService(PostsService):
    def on_create(self, docs):
        for doc in docs:
            if request.method == 'POST':
                doc['post_status'] = 'comment'
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
