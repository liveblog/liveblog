# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from superdesk.resource import Resource
from superdesk.services import BaseService
from liveblog.blogs.tasks import delete_blog_embeds_on_s3, publish_blog_embed_on_s3


class OutputsResource(Resource):
    schema = {
        'name': {
            'type': 'string',
            'required': True,
            'unique': True
        },
        'collection': Resource.rel('collections', True),
        'blog': Resource.rel('blogs'),
        'theme': {
            'type': 'string',
            'nullable': True
        },
        'style': {
            'type': 'dict',
            'schema': {
                'background-color': {
                    'type': 'string',
                    'nullable': True
                },
                'background-image': {
                    'type': 'string',
                    'nullable': True
                }
            }
        },
        'deleted': {
            'type': 'boolean',
            'default': False
        }
    }
    datasource = {
        'source': 'outputs',
        'default_sort': [('name', 1)]
    }
    RESOURCE_METHODS = ['GET', 'POST']
    ITEM_METHODS = ['GET', 'POST', 'DELETE']
    privileges = {'GET': 'outputs', 'POST': 'outputs',
                  'PATCH': 'outputs', 'DELETE': 'outputs'}


class OutputsService(BaseService):
    def on_created(self, outputs):
        for output in outputs:
            if output.get('blog'):
                publish_blog_embed_on_s3(output.get('blog'), output=output)

    def on_updated(self, updates, original):
        super().on_updated(updates, original)
        if updates.get('deleted', False):
            delete_blog_embeds_on_s3(original.get('blog'), output=original)
        else:
            publish_blog_embed_on_s3(original.get('blog'), output=original)
