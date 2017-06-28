import copy
import io
import logging
import os

import magic
import superdesk
from bson import ObjectId
from celery.exceptions import SoftTimeLimitExceeded
from flask import current_app as app
from settings import S3_CELERY_COUNTDOWN, S3_CELERY_MAX_RETRIES
from superdesk import get_resource_service
from superdesk.celery_app import celery
from superdesk.notification import push_notification

from .app_settings import (BLOGLIST_ASSETS, BLOGSLIST_ASSETS_DIR,
                           BLOGSLIST_DIRECTORY, CONTENT_TYPES)
from .embeds import embed, render_bloglist_embed
from .exceptions import MediaStorageUnsupportedForBlogPublishing
from .utils import check_media_storage, get_blog_path, get_bloglist_path

logger = logging.getLogger('superdesk')


def publish_embed(blog_id, theme=None, output=None, api_host=None):
    # Get html using embed() blueprint.
    html = embed(blog_id, theme, output, api_host)
    check_media_storage()
    output_id = output['_id'] if output else None
    file_path = get_blog_path(blog_id, theme, output_id)
    # Remove existing file.
    app.media.delete(app.media.media_id(file_path, version=False))
    logger.warning('Embed file "{}" for blog "{}" removed from s3'.format(file_path, blog_id))
    # Upload new file.
    file_id = app.media.put(io.BytesIO(bytes(html, 'utf-8')), filename=file_path, content_type='text/html',
                            version=False)
    logger.warning('Embed file "{}" for blog "{}" uploaded to s3'.format(file_path, blog_id))
    return superdesk.upload.url_for_media(file_id)


def delete_embed(blog_id, theme=None, output=None):
    check_media_storage()
    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    public_urls = blog.get('public_urls', {'output': {}, 'theme': {}})
    if output:
        output_id = str(output.get('_id'))
        public_url = public_urls['output'][output_id]
        public_urls['output'].pop(output_id)
    elif theme:
        public_url = public_urls['theme'][theme]
        public_urls['theme'].pop(theme)
    else:
        for output_url in public_urls['outputs']:
            app.media.delete(output_url)
        for theme_url in public_urls['theme']:
            app.media.delete(theme_url)
        public_url = blog.get('public_url')
        public_urls = {}

    # Remove existing file.
    app.media.delete(public_url)
    get_resource_service('blogs').system_update(blog_id, {'public_urls': public_urls}, blog)


def _publish_blog_embed_on_s3(blog_or_id, theme=None, output=None, safe=True):
    if isinstance(blog_or_id, (str, ObjectId)):
        blog_id = blog_or_id
        blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_or_id)
    else:
        blog = blog_or_id
        blog_id = blog['_id']
    
    blog_preferences = blog.get('blog_preferences', {})
    blog_theme = blog_preferences.get('theme')

    # get the `output` data if the `output_id` is set.
    # if output and isinstance(output, str):
    #     output = get_resource_service('outputs').find_one(req=None, _id=output)
    output_id = None
    if output:
        # get the output `_id`
        output_id = str(output.get('_id'))

        # compile a theme if there is an `output`.
        if output.get('theme'):
            theme = output.get('theme', blog_theme)

    if blog_theme:
        try:
            public_url = publish_embed(blog_id,
                                       theme,
                                       output,
                                       api_host='//{}/'.format(app.config['SERVER_NAME']))
        except MediaStorageUnsupportedForBlogPublishing as e:
            if not safe:
                raise e

            logger.warning('Media storage not supported for blog "{}"'.format(blog_id))
            public_url = '{}://{}/embed/{}/{}{}'.format(app.config['URL_PROTOCOL'],
                                                        app.config['SERVER_NAME'],
                                                        blog_id,
                                                        '{}'.format(output_id) if output_id else '',
                                                        '/themes/{}'.format(theme) if theme else '')

        public_urls = blog.get('public_urls', {'output': {}, 'theme': {}})
        updates = {'public_urls': public_urls}

        if output_id:
            public_urls['output'][output_id] = public_url
        if theme:
            public_urls['theme'][theme] = public_url
        else:
            updates['public_url'] = public_url

        get_resource_service('blogs').system_update(blog_id, updates, blog)
        push_notification('blog', published=1, blog_id=blog_id, **updates)
        return public_url



_blog_id = lambda b: b['_id'] if isinstance(b, dict) else b


@celery.task(bind=True, soft_time_limit=1800)
def publish_blog_embed_on_s3(self, blog_or_id, theme=None, output=None, safe=True):
    blog_id = _blog_id(blog_or_id)

    logger.warning('publish_blog_on_s3 for blog "{}" started.'.format(blog_id))
    try:
        _publish_blog_embed_on_s3(blog_or_id, theme, output, safe)
    except (Exception, SoftTimeLimitExceeded) as e:
        logger.exception('publish_blog_on_s3 for blog "{}" failed.'.format(blog_id))
        raise self.retry(exc=e, max_retries=S3_CELERY_MAX_RETRIES, countdown=S3_CELERY_COUNTDOWN)
    finally:
        logger.warning('publish_blog_on_s3 for blog "{}" finished.'.format(blog_id))


@celery.task(bind=True, soft_time_limit=1800)
def publish_blog_embeds_on_s3(self, blog_or_id, safe=True):
    blog_id = _blog_id(blog_or_id)
    logger.warning('publish_blog_embeds_on_s3 for blog "{}" started.'.format(blog_id))
    publish_blog_embed_on_s3(blog_or_id, safe=safe)
    outputs_service = get_resource_service('outputs')
    for output in outputs_service.get(req=None, lookup=dict(blog=blog_id)):
        publish_blog_embed_on_s3(blog_or_id, output=output, safe=safe)
    logger.warning('publish_blog_embeds_on_s3 for blog "{}" finished.'.format(blog_id))


@celery.task(bind=True, soft_time_limit=1800)
def delete_blog_embeds_on_s3(self, blog_id, theme=None, output=None, safe=True):
    logger.warning('delete_blog_embed_on_s3 for blog "{}" started.'.format(blog_id))
    try:
        delete_embed(blog_id, theme=theme, output=output)
    except MediaStorageUnsupportedForBlogPublishing as e:
        if not safe:
            raise e
    except (Exception, SoftTimeLimitExceeded) as e:
        logger.exception('delete_blog_on_s3 for blog "{}" failed.'.format(blog_id))
        raise self.retry(exc=e, max_retries=S3_CELERY_MAX_RETRIES, countdown=S3_CELERY_COUNTDOWN)
    finally:
        logger.warning('delete_blog_embed_on_s3 for blog "{}" finished.'.format(blog_id))


@celery.task(soft_time_limit=1800)
def publish_bloglist_assets(asset_type):
    # TODO: add retry
    assets = copy.deepcopy(BLOGLIST_ASSETS)
    # version_path = os.path.join(BLOGSLIST_DIRECTORY, BLOGSLIST_ASSETS_DIR, assets['version'])
    # # loads version json from file
    # version = json.loads(open(version_path, 'rb').read()).get('version', '0.0.0')
    # Save the file in the media storage if needed
    for name in (assets[asset_type]):
        asset_file = os.path.join(BLOGSLIST_DIRECTORY, BLOGSLIST_ASSETS_DIR, name)
        with open(asset_file, 'rb') as file:
            # Set the content type.
            mime = magic.Magic(mime=True)
            content_type = mime.from_file(asset_file)
            if content_type == 'text/plain' and name.endswith(tuple(CONTENT_TYPES.keys())):
                content_type = CONTENT_TYPES[os.path.splitext(name)[1]]

            final_file_name = os.path.join(BLOGSLIST_ASSETS_DIR, name)
            # Remove existing first.
            app.media.delete(app.media.media_id(final_file_name, content_type=content_type))
            # Upload.
            app.media.put(file.read(), filename=final_file_name, content_type=content_type)


@celery.task(soft_time_limit=1800)
def publish_bloglist_embed_on_s3():
    # TODO: add retry, cleanup code.
    if not app.config['S3_PUBLISH_BLOGSLIST']:
        logger.warning('Blog list embed publishing is disabled.')
        return

    if type(app.media).__name__ is not 'AmazonMediaStorage':
        pass
    else:
        assets = copy.deepcopy(BLOGLIST_ASSETS)

        # Publish version file to get the asset_root.
        version_file = os.path.join(BLOGSLIST_ASSETS_DIR, assets.get('version'))

        # Remove existing first.
        app.media.delete(app.media.media_id(version_file, content_type='application/json'))

        # Upload to Amazon S3.
        bloglist_path = os.path.join(BLOGSLIST_DIRECTORY, version_file)
        with open(bloglist_path, 'rb') as f:
            file_id = app.media.put(f.read(), filename=version_file, content_type='application/json')

        assets_public_url = superdesk.upload.url_for_media(file_id)

        # Correct assets public url path.
        assets_public_url = assets_public_url.replace(assets['version'], '')
        assets_public_url = assets_public_url.replace('http://', '//')
        html = render_bloglist_embed(assets_root=assets_public_url)
        file_path = get_bloglist_path()

        # Eemove existing.
        app.media.delete(app.media.media_id(file_path, version=False))
        # upload
        file_id = app.media.put(io.BytesIO(bytes(html, 'utf-8')),
                                filename=file_path,
                                content_type='text/html',
                                version=False)
        public_url = superdesk.upload.url_for_media(file_id)

        # Retrieves all opened blogs.
        blogslist_service = get_resource_service('blogslist')
        for blogslist in blogslist_service.get(req=None, lookup=dict(key='bloglist')):
            get_resource_service('blogslist').system_update(blogslist['_id'], {'value': public_url}, blogslist)
        else:
            blogslist_service.create([{'key': 'bloglist', 'value': public_url}])

        publish_bloglist_assets('scripts')
        publish_bloglist_assets('styles')

