from liveblog.blogs.blogs import BlogsResource, BlogService
from eve.utils import ParsedRequest
from liveblog.posts.posts import PostsService, PostsResource, BlogPostsService, BlogPostsResource
from apps.users.users import UsersResource
from apps.users.services import UsersService
from bson.objectid import ObjectId
import json
from apps.archive.common import item_url
from werkzeug import ImmutableMultiDict


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
        'default_sort': [('_updated', -1)]
    }
    public_methods = ['GET']
    public_item_methods = ['GET']
    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'blogs'}
    item_url = item_url


class OpenBlogPostsService(BlogPostsService):
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        if req.args == ImmutableMultiDict([]):
            query = {'query': {'filtered': {'filter': {'term': {'particular_type': 'post'}}}}}
            req = self.init_req(query)
        else:
            if req.args.get('status'):
                state = self.get_status(req)
                query = {'query': {'filtered': {'filter': {'term': state}}}}
                req = self.init_req(query)
            else:
                if req.args.get('deleted'):
                    delete = self.get_deleted(req)
                    query = {'query': {'filtered': {'filter': {'term': delete}}}}
                    req = self.init_req(query)
        docs = super().get(req, lookup)
        return docs

    def get_deleted(self, req):
        args = getattr(req, 'args', {})
        if args['deleted']:
            x = args['deleted']
            if x:
                y = {'deleted': x}
        return y

    def get_status(self, req):
        args = getattr(req, 'args', {})
        if args['status']:
            x = args['status']
            if x == 'open':
                y = {'post_status': x}
            else:
                if x == 'draft':
                    y = {'post_status': x}
        return y

    def init_req(self, elastic_query):
        parsed_request = ParsedRequest()
        parsed_request.args = {"source": json.dumps(elastic_query)}
        return parsed_request


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
