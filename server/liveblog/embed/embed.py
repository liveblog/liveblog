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
from flask import render_template, request
from superdesk import get_resource_service

bp = superdesk.Blueprint('embed_liveblog', __name__, template_folder='templates', static_folder='assets')


@bp.route('/embed/<blog_id>')
def embed(blog_id):
    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    blog['blog_preferences']['theme'] = {
        'template': 'default-theme/default-theme-template.html',
        'themeModule': 'liveblog.default-theme',
        'styles': [
            '/assets/default-theme/styles/embed.css',
            '//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css'
        ],
        'scripts': [
            '//code.angularjs.org/1.3.14/angular-sanitize.js',
            '//code.angularjs.org/1.3.14/angular-animate.js',
            '/assets/default-theme/main.js'
        ]
    }
    return render_template('embed.html', blog=blog, api_host=request.url_root)

# EOF
