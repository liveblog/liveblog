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
from liveblog.themes.themes import ThemesResource
from superdesk.celery_app import celery
import superdesk
from superdesk import get_resource_service
import zipfile
import os
from flask import current_app as app
import liveblog.embed
import tinys3


class ImportThemesResource(Resource):
    
    schema = {
        'media': {
            'type': 'media'
        }
    }

    datasource = {
        'source': 'upload_themes',
        'default_sort': [('_updated', -1)]
    }

    ITEM_METHODS = ['GET', 'POST']
    RESOURCE_METHODS = ['GET', 'POST']
    schema = schema
    schema.update(ThemesResource.schema)

    privileges = {'GET': 'global_preferences', 'POST': 'global_preferences',
                  'PATCH': 'global_preferences', 'DELETE': 'global_preferences'}

 
class ImportThemesService(BaseService):
    def on_created(self, docs):
        for doc in docs:
            upload_theme(str(doc['_id']))


def save_theme_on_s3(theme_id, api_host=None):
    region = app.config['AMAZON_REGION']
    bucket = app.config['AMAZON_CONTAINER_NAME']
    s3 = tinys3.Connection(
        app.config['AMAZON_ACCESS_KEY_ID'],
        app.config['AMAZON_SECRET_ACCESS_KEY'],
        default_bucket=bucket,
        endpoint='s3-%s.amazonaws.com' % (region))
    # Uploading a single file
    response = s3.upload('themes/%s/index.html' % (theme_id), 'embed_assets/themes')
    return response.url.replace('s3-%s.amazonaws.com/%s' % (region, bucket),
                                '%s.s3-%s.amazonaws.com' % (bucket, region))

embed_folder = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                            '../', 'embed', 'embed_assets', 'themes')
@celery.task(soft_time_limit=1800)
def upload_theme(doc_id, safe=True):
    theme = get_resource_service('upload_themes').find_one(req=None, _id=doc_id)
    print('theme: ', theme)
    if theme.get('media', False):
        try:
            media_id = theme['media']
            print('media id:', media_id)
            media_file = app.media.get(media_id, 'themes')
            print('media file:', media_file)
            zipf = zipfile.ZipFile(media_file)
            for name in zipf.namelist():
                outpath = save_theme_s3(media_id)
                print('outhpath....', outpath)
#                 outpath = embed_folder
                zipf.extract(name, outpath)
            return media_file
        except liveblog.embed.AmazonAccessKeyUnknownException as e:
            if not safe:
                raise e

