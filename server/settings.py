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
import json

from celery.schedules import crontab

try:
    from urllib.parse import urlparse
except ImportError:
    from urlparse import urlparse


def env(variable, fallback_value=None):
    env_value = os.environ.get(variable, '')
    if len(env_value) == 0:
        return fallback_value
    else:
        if env_value == "__EMPTY__":
            return ''
        else:
            return env_value


ABS_PATH = os.path.abspath(os.path.dirname(__file__))
BEHAVE_TESTS_FIXTURES_PATH = os.path.join(ABS_PATH, 'features', 'steps', 'fixtures')
XML = False
IF_MATCH = True
BANDWIDTH_SAVER = False
DATE_FORMAT = '%Y-%m-%dT%H:%M:%S+00:00'
PAGINATION_LIMIT = 200

LOG_CONFIG_FILE = env('LOG_CONFIG_FILE', 'logging_config.yml')
LOG_SERVER_ADDRESS = env('LOG_SERVER_ADDRESS', 'localhost')
LOG_SERVER_PORT = int(env('LOG_SERVER_PORT', 5555))

APPLICATION_NAME = env('APP_NAME', 'Live Blog')
server_url = urlparse(env('SUPERDESK_URL', 'http://localhost:5000/api'))
CLIENT_URL = env('SUPERDESK_CLIENT_URL', 'http://localhost:9000')
# Add absolute url protocol to make sure it work with email clients
if not CLIENT_URL.startswith('http'):
    CLIENT_URL = 'http:' + CLIENT_URL

URL_PROTOCOL = server_url.scheme or None
SERVER_NAME = server_url.netloc or None
URL_PREFIX = server_url.path.lstrip('/') or ''
VALIDATION_ERROR_STATUS = 400
JSON_SORT_KEYS = True

CACHE_CONTROL = 'max-age=0, no-cache'

X_DOMAINS = '*'
X_MAX_AGE = 24 * 3600
X_HEADERS = ['Content-Type', 'Authorization', 'If-Match']

MONGO_ENABLE_MULTI_DBS = False
MONGO_DBNAME = env('MONGO_DBNAME', 'liveblog')
if env('MONGO_URI'):
    MONGO_URI = env('MONGO_URI')
elif env('MONGODB_PORT'):
    MONGO_URI = '{0}/{1}'.format(env('MONGODB_PORT').replace('tcp:', 'mongodb:'), MONGO_DBNAME)

LEGAL_ARCHIVE_DBNAME = env('LEGAL_ARCHIVE_DBNAME', 'legal_archive')
if env('LEGAL_ARCHIVE_URI'):
    LEGAL_ARCHIVE_URI = env('LEGAL_ARCHIVE_URI')
elif env('LEGAL_ARCHIVEDB_PORT'):
    LEGAL_ARCHIVE_URI = '{0}/{1}'.format(env('LEGAL_ARCHIVEDB_PORT').replace('tcp:', 'mongodb:'),
                                         LEGAL_ARCHIVE_DBNAME)

ELASTICSEARCH_URL = env('ELASTICSEARCH_URL', 'http://localhost:9200')
ELASTICSEARCH_INDEX = env('ELASTICSEARCH_INDEX', 'liveblog')
if env('ELASTIC_PORT'):
    ELASTICSEARCH_URL = env('ELASTIC_PORT').replace('tcp:', 'http:')
ELASTICSEARCH_FORCE_REFRESH = env('ELASTICSEARCH_FORCE_REFRESH', 'True')

REDIS_URL = env('REDIS_URL', 'redis://localhost:6379')
if env('REDIS_PORT'):
    REDIS_URL = env('REDIS_PORT').replace('tcp:', 'redis:')
BROKER_URL = env('CELERY_BROKER_URL', REDIS_URL)
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', REDIS_URL)
CELERY_ALWAYS_EAGER = (env('CELERY_ALWAYS_EAGER', False) == 'True')
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['pickle', 'json']  # it's using pickle when in eager mode
CELERY_TASK_PROTOCOL = 1

CELERYBEAT_SCHEDULE_FILENAME = env('CELERYBEAT_SCHEDULE_FILENAME', './celerybeatschedule.db')
CELERYBEAT_SCHEDULE = {
    'session:gc': {
        'task': 'apps.auth.session_purge',
        'schedule': crontab(minute=20)
    }
}

SENTRY_DSN = env('SENTRY_DSN')
SENTRY_INCLUDE_PATHS = ['superdesk']

INSTALLED_APPS = [
    'apps.auth',
    'apps.preferences',
    'superdesk.roles',
    'superdesk.users',
    'superdesk.upload',
    'superdesk.notification',
    'superdesk.activity',
    'superdesk.sequences',
    'superdesk.vocabularies',
    'superdesk.commands',
    'superdesk.io',
    'superdesk.publish',

    'apps.archive',
    'apps.desks',
    'apps.stages',
    'apps.groups',
    'apps.privilege',
    'apps.legal_archive',
    'apps.archive_broadcast',
    'apps.content_types',

    'liveblog.prepopulate',
    'liveblog.blogs',
    'liveblog.posts',
    'liveblog.items',
    'liveblog.languages',
    'liveblog.themes',
    'liveblog.global_preferences',
    'liveblog.client_modules',
    'liveblog.blogslist',
    'liveblog.syndication',
    'liveblog.freetypes',
    'liveblog.advertising',
    'liveblog.marketplace',
    'liveblog.analytics'
]

RESOURCE_METHODS = ['GET', 'POST']
ITEM_METHODS = ['GET', 'PATCH', 'PUT', 'DELETE']
EXTENDED_MEDIA_INFO = ['content_type', 'name', 'length']
RETURN_MEDIA_AS_BASE64_STRING = False
VERSION = '_current_version'
AMAZON_CONTAINER_NAME = env('AMAZON_CONTAINER_NAME', '')
AMAZON_ACCESS_KEY_ID = env('AMAZON_ACCESS_KEY_ID', '')
AMAZON_SECRET_ACCESS_KEY = env('AMAZON_SECRET_ACCESS_KEY', '')
AMAZON_REGION = env('AMAZON_REGION', 'us-east-1')
AMAZON_PROXY_SERVER = env('AMAZON_PROXY_SERVER', '')
AMAZON_SERVER = env('AMAZON_SERVER', 'amazonaws.com')
AMAZON_URL_GENERATOR = env('AMAZON_URL_GENERATOR', 'default')
AMAZON_SERVE_DIRECT_LINKS = True
AWS_ACCESS_KEY_ID = AMAZON_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = AMAZON_SECRET_ACCESS_KEY
S3_BUCKET_NAME = AMAZON_CONTAINER_NAME
S3_USE_HTTPS = False
FLASK_ASSETS_USE_S3 = False
AMAZON_S3_SUBFOLDER = env('AMAZON_S3_SUBFOLDER', None)
USE_S3 = FLASK_ASSETS_USE_S3


SUPPORTED_LANGUAGES = {
    'languages': {
        'en': 'english',
        'fr': 'french',
        'de': 'deutsch'
    }
}

RENDITIONS = {
    'picture': {
        #  The resolution for small displays.
        'thumbnail': {'width': 480, 'height': 320},
        # The resolution for full hd and retina.
        'viewImage': {'width': 1280, 'height': 720},
        # The original image is resize to this resolution.
        'baseImage': {'width': 1920, 'height': 1080},
    },
    'avatar': {
        'thumbnail': {'width': 60, 'height': 60},
        'viewImage': {'width': 200, 'height': 200},
    }
}

SERVER_DOMAIN = 'localhost'

BCRYPT_GENSALT_WORK_FACTOR = 12
RESET_PASSWORD_TOKEN_TIME_TO_LIVE = int(env('RESET_PASS_TTL', 1))  # The number of days a token is valid
# The number of days an activation token is valid
ACTIVATE_ACCOUNT_TOKEN_TIME_TO_LIVE = int(env('ACTIVATE_TTL', 7))

# email server
MAIL_SERVER = env('MAIL_SERVER', 'smtp.googlemail.com')
MAIL_PORT = int(env('MAIL_PORT', 465))
MAIL_USE_TLS = json.loads(env('MAIL_USE_TLS', 'False').lower())
MAIL_USE_SSL = json.loads(env('MAIL_USE_SSL', 'False').lower())
MAIL_USERNAME = env('MAIL_USERNAME', 'liveblogsf@gmail.com')
MAIL_PASSWORD = env('MAIL_PASSWORD', 'fabric2010')
MAIL_FROM = env('MAIL_FROM', 'liveblogsf@gmail.com')
ADMINS = [MAIL_FROM]

# LDAP settings
LDAP_SERVER = env('LDAP_SERVER', '')  # Ex: ldap://sourcefabric.org
LDAP_SERVER_PORT = env('LDAP_SERVER_PORT', 389)

# Fully Qualified Domain Name. Ex: sourcefabric.org
LDAP_FQDN = env('LDAP_FQDN', '')

# LDAP_BASE_FILTER limit the base filter to the security group. Ex: OU=Superdesk Users,dc=sourcefabric,dc=org
LDAP_BASE_FILTER = env('LDAP_BASE_FILTER', '')

# change the user depending on the LDAP directory structure
LDAP_USER_FILTER = env('LDAP_USER_FILTER', "(&(objectCategory=user)(objectClass=user)(sAMAccountName={}))")

# LDAP User Attributes to fetch. Keys would be LDAP Attribute Name and Value would be Supderdesk Model Attribute Name
LDAP_USER_ATTRIBUTES = {'givenName': 'first_name', 'sn': 'last_name', 'displayName': 'display_name',
                        'mail': 'email', 'ipPhone': 'phone'}

if LDAP_SERVER:
    INSTALLED_APPS.append('apps.auth.ldap')
else:
    INSTALLED_APPS.append('apps.auth.db')

SUPERDESK_TESTING = (env('SUPERDESK_TESTING', 'true').lower() == 'true')

# Debuging state, this is used when generating theme emebed files default `false`.
LIVEBLOG_DEBUG = (env('LIVEBLOG_DEBUG', 'false').lower() == 'true')

# The number of minutes since the last update of the Mongo auth object after which it will be deleted
SESSION_EXPIRY_MINUTES = 240

# The number of minutes before spiked items purged
SPIKE_EXPIRY_MINUTES = 300

# The number of minutes before content items purged
# akin.tolga 06/01/2014: using a large value (30 days) for the time being
CONTENT_EXPIRY_MINUTES = 43200

# This setting can be used to apply a limit on the elastic search queries, it is a limit per shard.
# A value of -1 indicates that no limit will be applied.
# If for example the elastic has 5 shards and you wish to limit the number of search results to 1000 then set the value
# to 200 (1000/5).
MAX_SEARCH_DEPTH = -1

# Defines the maximum value of Ingest Sequence Number after which the value will start from 1
MAX_VALUE_OF_INGEST_SEQUENCE = 9999

DAYS_TO_KEEP = int(env('INGEST_ARTICLES_TTL', '2'))

WS_HOST = env('WSHOST', '0.0.0.0')
WS_PORT = env('WSPORT', '5100')

# Defines default value for Source to be set for manually created articles
DEFAULT_SOURCE_VALUE_FOR_MANUAL_ARTICLES = env('DEFAULT_SOURCE_VALUE_FOR_MANUAL_ARTICLES', 'Liveblog')

# Defines default value for Priority to be set for manually created articles
DEFAULT_PRIORITY_VALUE_FOR_MANUAL_ARTICLES = env('DEFAULT_PRIORITY_VALUE_FOR_MANUAL_ARTICLES', 3)

# Defines default value for Urgency to be set for manually created articles
DEFAULT_URGENCY_VALUE_FOR_MANUAL_ARTICLES = env('DEFAULT_URGENCY_VALUE_FOR_MANUAL_ARTICLES', 3)

ORGANIZATION_NAME = "Sourcefabric"
ORGANIZATION_NAME_ABBREVIATION = "SF"

# Syndication Global Settings
SYNDICATION_CELERY_MAX_RETRIES = env('SYNDICATION_CELERY_MAX_RETRIES', 5)
SYNDICATION_CELERY_COUNTDOWN = env('SYNDICATION_CELERY_COUNTDOWN', 60)
SYNDICATION_EXCLUDED_ITEMS = env('SYNDICATION_EXCLUDED_ITEMS', ('Advertisement Local', 'Advertisement Remote'))

# Marketplace Settings
MARKETPLACE_APP_URL = env('MARKETPLACE_APP_URL', 'https://lb-market.lab.sourcefabric.org/api')

# Settings related to subscription levels
SUBSCRIPTION_LEVEL_SOLO = 'solo'
SUBSCRIPTION_LEVEL_TEAM = 'team'
SUBSCRIPTION_LEVEL_NETWORK = 'network'
SUBSCRIPTION_LEVEL = env('SUBSCRIPTION_LEVEL', SUBSCRIPTION_LEVEL_NETWORK)
SUBSCRIPTION_MAX_ACTIVE_BLOGS = {SUBSCRIPTION_LEVEL_SOLO: 1, SUBSCRIPTION_LEVEL_TEAM: 3}
SUBSCRIPTION_MAX_BLOG_MEMBERS = {SUBSCRIPTION_LEVEL_SOLO: 3, SUBSCRIPTION_LEVEL_TEAM: 5}
SUBSCRIPTION_MAX_THEMES = {SUBSCRIPTION_LEVEL_SOLO: 1, SUBSCRIPTION_LEVEL_TEAM: 3}
