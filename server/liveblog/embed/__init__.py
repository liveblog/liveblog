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

from .embed import bp as embed_blueprint
from .embed import publish_embed
from .embed import delete_embed
from .embed import MediaStorageUnsupportedForBlogPublishing

__all__ = ['embed_blueprint', 'publish_embed', 'delete_embed', 'MediaStorageUnsupportedForBlogPublishing']

# EOF
