#!/usr/bin/env python
# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


import os
import jinja2
import flask_s3
import settings
from flask_cache import Cache
from liveblog.blogs import bloglist_assets_blueprint, bloglist_blueprint
from liveblog.blogs.embeds import embed_blueprint
from liveblog.common import BlogCache
from liveblog.syndication.producer import producers_blueprint
from liveblog.syndication.consumer import consumers_blueprint
from liveblog.syndication.syndication import syndication_blueprint
from liveblog.syndication.blogs import blogs_blueprint as syndication_blogs_blueprint
from liveblog.marketplace.marketer import marketers_blueprint
from liveblog.analytics.analytics import analytics_blueprint
from liveblog.items.items import drag_and_drop_blueprint
from liveblog.client_modules.client_modules import blog_posts_blueprint


from superdesk.factory import get_app as superdesk_app


def get_app(config=None):
    """App factory.

    :param config: configuration that can override config from `settings.py`
    :return: a new SuperdeskEve app instance
    """
    if config is None:
        config = {}

    config['APP_ABSPATH'] = os.path.abspath(os.path.dirname(__file__))

    for key in dir(settings):
        if key.isupper():
            config.setdefault(key, getattr(settings, key))

    media_storage = None
    if config.get('AMAZON_CONTAINER_NAME'):
        from superdesk.storage.amazon.amazon_media_storage import AmazonMediaStorage
        media_storage = AmazonMediaStorage

    config['DOMAIN'] = {}

    # Create superdesk app instance.
    app = superdesk_app(config, media_storage, init_elastic=config.get('INIT_ELASTIC', False))

    # Add custom jinja2 template loader.
    custom_loader = jinja2.ChoiceLoader([
        jinja2.FileSystemLoader('superdesk/templates'),
        app.jinja_loader
    ])
    app.jinja_loader = custom_loader

    # Caching.
    app.cache = Cache(app, config={'CACHE_TYPE': 'simple'})
    app.blog_cache = BlogCache(cache=app.cache)

    # Amazon S3 support.
    s3 = flask_s3.FlaskS3()
    s3.init_app(app)

    # Embed feature.
    app.register_blueprint(embed_blueprint)

    # Embed bloglist.
    app.register_blueprint(bloglist_assets_blueprint)
    app.register_blueprint(bloglist_blueprint)

    # Analytics.
    app.register_blueprint(analytics_blueprint)

    # Syndication feature.
    app.register_blueprint(producers_blueprint)
    app.register_blueprint(consumers_blueprint)
    app.register_blueprint(syndication_blueprint)
    app.register_blueprint(syndication_blogs_blueprint)

    # Marketplace.
    app.register_blueprint(marketers_blueprint)

    # Drag and drop
    app.register_blueprint(drag_and_drop_blueprint)

    # New posts endpoint
    app.register_blueprint(blog_posts_blueprint)

    return app


if __name__ == '__main__':
    debug = True
    host = '0.0.0.0'
    port = int(os.environ.get('PORT', '5000'))
    app = get_app()
    app.run(host=host, port=port, debug=debug, use_reloader=debug)
