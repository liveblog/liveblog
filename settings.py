import os
import json

try:
    from urllib.parse import urlparse
except ImportError:
    from urlparse import urlparse

XML = False
IF_MATCH = False
BANDWIDTH_SAVER = False
DATE_FORMAT = '%Y-%m-%dT%H:%M:%S+0000'

server_url = urlparse(os.environ.get('LIVEBLOG_URL', 'http://localhost:5001'))
URL_PROTOCOL = server_url.scheme or None
SERVER_NAME = server_url.netloc or None
URL_PREFIX = server_url.path.lstrip('/') or ''
VALIDATION_ERROR_STATUS = 400

CACHE_CONTROL = 'max-age=0, no-cache'

X_DOMAINS = '*'
X_MAX_AGE = 24 * 3600
X_HEADERS = ['Content-Type', 'Authorization', 'If-Match']


MONGO_DBNAME = os.environ.get('MONGO_DBNAME', 'liveblog')
if os.environ.get('MONGOLAB_URI'):
    MONGO_URI = os.environ.get('MONGOLAB_URI')
elif os.environ.get('MONGODB_PORT'):
    MONGO_URI = '{0}/{1}'.format(os.environ.get('MONGODB_PORT').replace('tcp:', 'mongodb:'), MONGO_DBNAME)


ELASTICSEARCH_URL = os.environ.get('ELASTICSEARCH_URL', 'http://localhost:9200')
ELASTICSEARCH_INDEX = os.environ.get('ELASTICSEARCH_INDEX', 'liveblog')
if os.environ.get('ELASTIC_PORT'):
    ELASTICSEARCH_URL = os.environ.get('ELASTIC_PORT').replace('tcp:', 'http:')


SENTRY_DSN = os.environ.get('SENTRY_DSN')
SENTRY_INCLUDE_PATHS = ['liveblog']

INSTALLED_APPS = [
    'apps.auth',
    'apps.auth.db',
    'apps.users',
    'superdesk.upload',
    'superdesk.notification',
    'superdesk.activity',

    'apps.archive',
    'apps.preferences',

    'live-blog.blogs'
]

RESOURCE_METHODS = ['GET', 'POST']
ITEM_METHODS = ['GET', 'PATCH', 'PUT', 'DELETE']
EXTENDED_MEDIA_INFO = ['content_type', 'name', 'length']
RETURN_MEDIA_AS_BASE64_STRING = False


RENDITIONS = {
    'picture': {
        'thumbnail': {'width': 220, 'height': 120},
        'viewImage': {'width': 640, 'height': 640},
        'baseImage': {'width': 1400, 'height': 1400},
    },
    'avatar': {
        'thumbnail': {'width': 60, 'height': 60},
        'viewImage': {'width': 200, 'height': 200},
    }
}

SERVER_DOMAIN = 'localhost'

BCRYPT_GENSALT_WORK_FACTOR = 12
RESET_PASSWORD_TOKEN_TIME_TO_LIVE = int(os.environ.get('RESET_PASS_TTL', 24))  # The number of hours a token is valid

# email server
MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.googlemail.com')
MAIL_PORT = int(os.environ.get('MAIL_PORT', 465))
MAIL_USE_TLS = json.loads(os.environ.get('MAIL_USE_TLS', 'False').lower())
MAIL_USE_SSL = json.loads(os.environ.get('MAIL_USE_SSL', 'True').lower())
MAIL_USERNAME = os.environ.get('MAIL_USERNAME', 'admin@sourcefabric.org')
MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', 'admin-password')
ADMINS = [MAIL_USERNAME]

# LDAP settings
LDAP_SERVER = None  # Ex: ldap://sourcefabric.org
