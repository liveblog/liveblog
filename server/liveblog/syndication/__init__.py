import superdesk
from .consumer import ConsumerService, ConsumerResource
from .producer import ProducerService, ProducerResource
from .blogs import BlogService, BlogResource


def init_app(app):
    # Consumers
    service = ConsumerService('consumers', backend=superdesk.get_backend())
    ConsumerResource('consumers', app=app, service=service)
    # Producers
    service = ProducerService('producers', backend=superdesk.get_backend())
    ProducerResource('producers', app=app, service=service)
    # Blogs and Posts
    service = BlogService('syndication_blogs', backend=superdesk.get_backend())
    BlogResource('syndication_blogs', app=app, service=service)


superdesk.privilege(name='consumers', label='Consumers Management', description='User can manage consumers')
superdesk.privilege(name='producers', label='Producers Management', description='User can manage producers')
