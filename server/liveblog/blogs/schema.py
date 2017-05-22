from superdesk.metadata.item import metadata_schema
from superdesk.resource import Resource


blogs_schema = {
    'title': metadata_schema['headline'],
    'description': metadata_schema['description_text'],
    'picture_url': {
        'type': 'string',
        'nullable': True
    },
    'picture': Resource.rel('archive', embeddable=True, nullable=True, type='string'),
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'versioncreated': metadata_schema['versioncreated'],
    'posts_order_sequence': {
        'type': 'float',
        'default': 0.00
    },
    'blog_status': {
        'type': 'string',
        'allowed': ['open', 'closed'],
        'default': 'open'
    },
    'members': {
        'type': 'list',
        'schema': {
            'type': 'dict',
            'schema': {
                'user': Resource.rel('users', True)
            }
        },
        'maxmembers': True
    },
    'blog_preferences': {
        'type': 'dict'
    },
    'theme_settings': {
        'type': 'dict'
    },
    'public_url': {
        'type': 'string'
    },
    'syndication_enabled': {
        'type': 'boolean',
        'default': False
    },
    'market_enabled': {
        'type': 'boolean',
        'default': False
    },
    'category': {
        'type': 'string',
        'allowed': ["", "Breaking News", "Entertainment", "Business and Finance", "Sport", "Technology"],
        'default': ""
    },
    'start_date': {
        'type': 'datetime',
        'default': None
    }
}
