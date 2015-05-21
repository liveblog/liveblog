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
from flask.ext.assets import Environment, Bundle

# assets with Flask-assets
assets = Environment(app)
js_files = [
    'embed_liveblog/scripts/liveblog-embed/main.js',
    'embed_liveblog/scripts/liveblog-embed/resources.service.js',
    'embed_liveblog/scripts/liveblog-embed/pages-manager.service.js'
]
css_files = [
    'embed_liveblog/styles/embed.css'
]
js = Bundle(*js_files, output='gen/lb-embed.js', filters="jsmin")
css = Bundle(*css_files, output='gen/lb-embed.css')
assets.register('js_embed', js)
assets.register('css_embed', css)
# blueprint for flask
bp = superdesk.Blueprint('embed_liveblog', __name__, template_folder='templates', static_folder='assets')


@bp.route('/embed/<blog_id>')
def embed(blog_id):
    return render_template('embed.html', blog_id=blog_id, api_host=request.url_root)

# EOF
