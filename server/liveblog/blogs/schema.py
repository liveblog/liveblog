from superdesk.metadata.item import metadata_schema
from superdesk.resource import Resource


blogs_schema = {
    'title': metadata_schema['headline'],
    'description': metadata_schema['description_text'],
    'picture_url': {
        'type': 'string',
        'nullable': True
    },
    'picture_renditions': {
        'type': 'dict',
        'mapping': {
            'type': 'object',
            'enabled': False
        },
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
        'type': 'dict',
        'mapping': {
            'type': 'object',
            'enabled': False
        }
    },
    'theme_settings': {
        'type': 'dict',
        'mapping': {
            'type': 'object',
            'enabled': False
        }
    },
    'public_url': {
        'type': 'string'
    },
    'public_urls': {
        'type': 'dict',
        'mapping': {
            'type': 'object',
            'enabled': False
        }
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
        'allowed': ["", "Breaking News", "Entertainment", "Business and Finance",
                    "Sport", "Technology", "Politics", "Others"],
        'default': ""
    },
    'start_date': {
        'type': 'datetime',
        'default': None
    },
    'last_created_post': {
        'type': 'dict',
        'schema': {
            '_id': {'type': 'string'},
            '_updated': {'type': 'datetime'},
        },
        'default': {}
    },
    'last_updated_post': {
        'type': 'dict',
        'schema': {
            '_id': {'type': 'string'},
            '_updated': {'type': 'datetime'},
        },
        'default': {}
    },
    'total_posts': {
        'type': 'integer',
        'default': 0
    }
}
