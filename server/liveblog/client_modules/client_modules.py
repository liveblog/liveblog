from liveblog.blogs.blogs import BlogsResource
from superdesk.services import BaseService
from liveblog.posts.posts import PostsService, PostsResource, BlogPostsService, BlogPostsResource
from apps.users.users import UsersResource
from apps.users.services import UsersService
from apps.archive.common import item_url
from flask import current_app as app


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
