# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Embed module"""
import superdesk
from flask import render_template, request, current_app as app
from superdesk import get_resource_service

ASSETS_DIR = 'embed_assets'
bp = superdesk.Blueprint('embed_liveblog', __name__, template_folder='templates', static_folder=ASSETS_DIR)


@bp.route('/embed/<blog_id>')
def embed(blog_id):

    def complete_url(url):
        def is_relative(url):
            return not (url.startswith('/') or url.startswith('http://') or url.startswith('https://'))
        if is_relative(url):
            url = '/%s/%s/%s' % (ASSETS_DIR, blog['theme']['name'], url)
        return url

    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    # complete the urls from `scripts` and `styles` fields when it's relative
    for asset_type in ['scripts', 'styles']:
        blog['theme'][asset_type] = list(
            map(complete_url, blog['theme'].get(asset_type) or list())
        )
    return render_template('embed.html', blog=blog, api_host=request.url_root, assets_dir=ASSETS_DIR)

# EOF
