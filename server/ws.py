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
from settings import WS_HOST, WS_PORT, LOG_SERVER_ADDRESS, LOG_SERVER_PORT, BROKER_URL
from superdesk.ws import create_server
from superdesk.logging import configure_logging

LOG_CONFIG_FILE = os.environ.get('LOG_CONFIG_FILE')

beat_delay = 30

if __name__ == '__main__':
    config = {
        'WS_HOST': WS_HOST,
        'WS_PORT': WS_PORT,
        'BROKER_URL': BROKER_URL,
        'LOG_SERVER_ADDRESS': LOG_SERVER_ADDRESS,
        'LOG_SERVER_PORT': LOG_SERVER_PORT
    }
    if LOG_CONFIG_FILE:
        if os.path.exists(LOG_CONFIG_FILE):
            configure_logging(LOG_CONFIG_FILE)

    create_server(config)
