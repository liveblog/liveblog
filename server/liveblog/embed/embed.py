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
    'embed_liveblog/scripts/liveblog-embed/main.js'
]
js = Bundle(*js_files, output='gen/packed.js')
assets.register('js_embed', js)

bp = superdesk.Blueprint('embed_liveblog', __name__, template_folder='templates', static_folder='assets')
superdesk.blueprint(bp)


@bp.route('/embed')
def embed():
    return render_template('embed.html', blog_id='55476b246844990065ad3c9c', api_host=request.url_root)

# EOF
