from bson.objectid import ObjectId
from eve.utils import ParsedRequest
from superdesk.notification import push_notification
from superdesk.utc import utcnow
from superdesk.resource import Resource

from liveblog.common import get_user, update_dates_for
from apps.archive.archive import ArchiveResource, ArchiveService, ArchiveVersionsResource
from superdesk.services import BaseService
from superdesk.filemeta import set_filemeta, get_filemeta
from werkzeug.datastructures import FileStorage
from flask import Blueprint, request, make_response
from flask_cors import CORS
from superdesk import get_resource_service
from bson.json_util import dumps
from requests.exceptions import RequestException

import logging
import re
import requests
import tempfile

logger = logging.getLogger('superdesk')
drag_and_drop_blueprint = Blueprint('drag_and_drop', __name__)
CORS(drag_and_drop_blueprint)


class ItemsVersionsResource(ArchiveVersionsResource):
    """
    Resource class for versions of archive_media
    """

    datasource = {
        'source': 'archive' + '_versions'
    }


class ItemsVersionsService(BaseService):
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('archive_versions', req=req, lookup=lookup)


class ItemsResource(ArchiveResource):
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'item'}},
        'default_sort': [('_updated', -1)]
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']

    schema = ArchiveResource.schema
    schema.update(schema)
    schema.update({
        'text': {
            'type': 'string'
        },
        'blog': Resource.rel('blogs', True),
        'particular_type': {
            'type': 'string',
            'allowed': ['post', 'item'],
            'default': 'item'
        },
        'group_type': {
            'type': 'string',
            'allowed': ['freetype', 'default'],
            'default': 'default'
        },
        'item_type': {
            'type': 'string'
        },
        'meta': {
            'type': 'dict',
            'mapping': {
                'type': 'object',
                'enabled': False
            },
            'default': {}
        },
        'deleted': {
            'type': 'string'
        },
        'syndicated_creator': {
            'type': 'dict'
        },
        'commenter': {
            'type': 'string',
            'minlength': 1,
            'maxlength': 30
        },
        'freetype_template': {
            'type': 'string'
        }
    })
    privileges = {'GET': 'posts', 'POST': 'posts', 'PATCH': 'posts', 'DELETE': 'posts'}


class ItemsService(ArchiveService):
    embed_providers = {
        'twitter': [
            re.compile('https?://(?:www|mobile\.)?twitter\.com/(?:#!/)?[^/]+/status(?:es)?/(?P<original_id>\d+)/?$'),
            re.compile('https?://(www\.)?t\.co/(?P<original_id>[a-zA-Z0-9]+)')
        ],
        'youtube': [
            re.compile('https?://(?:[^\.]+\.)?youtube\.com/watch/?\?(?:.+&)?v=(?P<original_id>[^&]+)'),
            re.compile('https?://(www\.)?youtu\.be/(?P<original_id>[a-zA-Z0-9_-]+)')
        ],
        'instagram': [
            re.compile('https?://(www\.)?instagr(?:\.am|am\.com)/p/(?P<original_id>[^/]+)')
        ],
        'facebook': [
            re.compile('https?://(www\.)?facebook.com/(?P<original_id>.*)')
        ]
    }

    def set_embed_metadata(self, doc):
        """
        Set additional embed metadata.
        :param doc:
        :return: None
        """
        original_url = doc['meta'].get('original_url')
        if not original_url:
            logger.warning('Unable to find original_url in item "{}" meta.'.format(doc['_id']))
            return
        provider_name = doc['meta']['provider_name'].lower()
        if provider_name in self.embed_providers:
            for original_id_re in self.embed_providers[provider_name]:
                match = original_id_re.match(original_url)
                if match:
                    original_id = match.group('original_id')
                    doc['meta']['original_id'] = original_id

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        docs = super().get(req, lookup)
        return(docs)

    def on_create(self, docs):
        super().on_create(docs)
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))
            if doc.get('item_type'):
                if doc['item_type'] == 'embed':
                    metadata = doc['meta']
                    set_filemeta(doc, metadata)
                    if get_filemeta(doc, 'version'):
                        metadata['version'] = str(metadata.get('version'))
                    if get_filemeta(doc, 'width'):
                        metadata['width'] = str(metadata.get('width'))
                    if get_filemeta(doc, 'height'):
                        metadata['height'] = str(metadata.get('height'))
                    self.set_embed_metadata(doc)

    def on_created(self, docs):
        super().on_created(docs)
        push_notification('items', created=1)

    def on_update(self, updates, original):
        super().on_update(updates, original)
        user = get_user()
        updates['versioncreated'] = utcnow()
        updates['version_creator'] = str(user.get('_id'))

    def on_updated(self, updates, original):
        super().on_updated(updates, original)
        push_notification('items', updated=1)

    def on_deleted(self, doc):
        super().on_deleted(doc)
        push_notification('items', deleted=1)


class BlogItemsResource(ArchiveResource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/items'
    schema = ItemsResource.schema
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'item'}},
        'default_sort': [('_updated', -1)]
    }
    resource_methods = ['GET']
    privileges = {'GET': 'posts'}


class BlogItemsService(ArchiveService):
    def get(self, req, lookup):
        if lookup.get('blog_id'):
            lookup['blog'] = ObjectId(lookup['blog_id'])
            del lookup['blog_id']
        return super().get(req, lookup)


@drag_and_drop_blueprint.route('/api/archive/draganddrop/', methods=['POST'])
def drag_and_drop():
    data = request.get_json()
    url = data['image_url']

    try:
        response = requests.get(url, timeout=5)
    except (ConnectionError, RequestException):
        return make_response('Unable to get url: "{}"'.format(url), 406)
    fd = tempfile.NamedTemporaryFile()
    for chunk in response.iter_content(chunk_size=1024):
        if chunk:
            fd.write(chunk)
    fd.seek(0)

    content_type = response.headers.get('content-type')
    if 'image' not in content_type:
        return make_response('Invalid content_type {}'.format(content_type), 406)

    item_data = dict()
    item_data['type'] = 'picture'
    item_data['media'] = FileStorage(stream=fd, content_type=content_type)
    archive_service = get_resource_service('archive')
    archive_id = archive_service.post([item_data])[0]
    archive = archive_service.find_one(req=None, _id=archive_id)

    return make_response(dumps(archive), 201)
