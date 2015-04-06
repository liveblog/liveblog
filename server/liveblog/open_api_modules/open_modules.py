from liveblog.blogs.blogs import BlogsResource, BlogService
from eve.utils import ParsedRequest
from liveblog.posts.posts import PostsService, PostsResource, BlogPostsService, BlogPostsResource
from apps.users.users import UsersResource
from apps.users.services import UsersService
from superdesk.resource import Resource, build_custom_hateoas
from superdesk import get_resource_service
from bson.objectid import ObjectId


class OpenUsersResource(UsersResource):
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
 
 
class OpenUsersService(UsersService):
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        docs = super().get(req, lookup)
        return docs



class OpenBlogsResource(BlogsResource):
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'blog'}},
        'default_sort': [('_updated', -1)]
    }
    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']

    schema = {}
    schema.update(BlogsResource.schema)


class OpenBlogsService(BlogService):
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        docs = super().get(req, lookup)
        return docs


class OpenPostsResource(PostsResource):
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'post'}},
        'default_sort': [('_updated', -1)]
    }
    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']

    schema = {}
    schema.update(PostsResource.schema)


class OpenPostsService(PostsService):
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        docs = super().get(req, lookup)
        return docs


class OpenBlogPostsResource(BlogPostsResource):
    url = 'client_blogs/<regex("[a-f0-9]{24}"):blog_id>/posts'
    schema = PostsResource.schema
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'post'}},
        'default_sort': [('_updated', -1)]
    }
    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'blogs'}
    
class OpenBlogPostsService(BlogPostsService):
    def get(self, req, lookup):
        return super().get(req, lookup)


class BlogUsersResource(UsersResource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/users'
    schema = UsersResource.schema
    datasource = {
        'default_sort': [('_updated', -1)]
    }
    resource_methods = ['GET']
    privileges = {'GET': 'blogs'}


class BlogUsersService(UsersService):
    def get(self, req, lookup):
        if lookup.get('blog_id'):
            lookup['blog'] = ObjectId(lookup['blog_id'])
            del lookup['blog_id']
        return super().get(req, lookup)
