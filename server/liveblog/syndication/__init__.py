import superdesk
from .consumer import ConsumerService, ConsumerResource
from .producer import ProducerService, ProducerResource
from .blogs import BlogService, BlogResource, BlogPostsService, BlogPostsResource
from .syndication import SyndicationOut, SyndicationOutService, SyndicationIn, SyndicationInService


def init_app(app):
    # Consumers
    service = ConsumerService('consumers', backend=superdesk.get_backend())
    ConsumerResource('consumers', app=app, service=service)
    # Producers
    service = ProducerService('producers', backend=superdesk.get_backend())
    ProducerResource('producers', app=app, service=service)
    # Blogs
    service = BlogService('syndication_blogs', backend=superdesk.get_backend())
    BlogResource('syndication_blogs', app=app, service=service)
    # Blog Posts
    service = BlogPostsService('syndication_blog_posts', backend=superdesk.get_backend())
    BlogPostsResource('syndication_blog_posts', app=app, service=service)
    # Syndication In/Out
    service = SyndicationOutService('syndication_out', backend=superdesk.get_backend())
    SyndicationOut('syndication_out', app=app, service=service)
    service = SyndicationInService('syndication_in', backend=superdesk.get_backend())
    SyndicationIn('syndication_in', app=app, service=service)


superdesk.privilege(name='consumers', label='Consumers Management', description='User can manage consumers')
superdesk.privilege(name='producers', label='Producers Management', description='User can manage producers')
superdesk.privilege(name='syndication_out', label='Consumer Syndication Management',
                    description='User can manage consumer syndication.')
# IMPORTANT: the _p is here to prevent a bug when querying non syndicated posts on elasticsearch
superdesk.privilege(name='syndication_in_p', label='Producer Syndication Management',
                    description='User can manage producer syndication.')
