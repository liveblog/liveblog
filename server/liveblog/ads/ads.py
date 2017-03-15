import logging
from superdesk.resource import Resource
from liveblog.posts import PostsResource, PostsService


logger = logging.getLogger('superdesk')

class AdsResource(PostsResource):
    schema = {}
    schema.update(PostsResource.schema)
    schema.update({
        'name': {
            'type': 'string',
            'unique': True
        },
        'blog': Resource.rel('blogs', embeddable=True, required=False),
    })


class AdsService(PostsService):
    pass
