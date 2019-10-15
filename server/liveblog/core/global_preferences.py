# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
from superdesk import get_resource_service
from superdesk.resource import Resource
from superdesk.services import BaseService

from .constants import (
    THEME, LANGUAGE, YOUTUBE_CREDENTIALS,
    YOUTUBE_SECRETS, GLOBAL_TAGS, ALLOW_MULTIPLE_TAGS,
    YOUTUBE_PRIVACY_STATUS)

preferences_key = 'global_preferences'
logger = logging.getLogger(__name__)


class GlobalPreferencesResource(Resource):
    """
    Used to store global configurations for liveblog instance.
    """

    datasource = {
        'source': preferences_key
    }

    schema = {
        'key': {
            'type': 'string',
            'required': True,
            'unique': True,
            'allowed': [
                THEME,
                LANGUAGE,
                YOUTUBE_CREDENTIALS,
                YOUTUBE_SECRETS,
                YOUTUBE_PRIVACY_STATUS,
                GLOBAL_TAGS,
                ALLOW_MULTIPLE_TAGS
            ],
        },
        'value': {'type': ['string', 'list', 'boolean']}
    }

    privileges = {
        'GET': 'global_preferences',
        'POST': 'global_preferences',
        'PATCH': 'global_preferences',
        'DELETE': 'global_preferences'
    }


class GlobalPreferencesService(BaseService):

    def save_preference(self, key, data):
        global_prefs = self.get_global_prefs()

        try:
            if key in global_prefs:
                setting = self.find_one(req=None, key=key)
                self.update(setting['_id'], {'value': data}, setting)
            else:
                self.post([{'key': key, 'value': data}])
            return True
        except Exception as err:
            logger.error('Unable to save preference {0}. Exception msg: {1}'.format(key, err))
            return False

    def get_global_prefs(self):
        res = get_resource_service(preferences_key).get(req=None, lookup={})
        return dict([v['key'], v['value']] for v in res if 'value' in v and 'key' in v)

# EOF
