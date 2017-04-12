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
from liveblog.syndication.utils import fetch_url
from liveblog.syndication.exceptions import DownloadError
from bson.json_util import dumps
from urllib3.fields import guess_content_type

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
            'type': 'dict'
        },
        'deleted': {
            'type': 'string'
        },
        'commenter': {
            'type': 'string',
            'minlength': 1,
            'maxlength': 30
        }
    })
    privileges = {'GET': 'posts', 'POST': 'posts', 'PATCH': 'posts', 'DELETE': 'posts'}


class ItemsService(ArchiveService):
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
    accepted_mimetypes = {
        'image/jpge',
        'image/png'
    }
    mimetype = guess_content_type(url)
    if mimetype not in accepted_mimetypes:
        return make_response('invalid file type',406)

    try:
        stream = fetch_url(url)
    except (DownloadError):
        return make_response('unable to download file',404)

    item_data = dict()
    item_data['type'] = 'picture'
    item_data['media'] = FileStorage(stream=stream, content_type=mimetype)
    archive_service = get_resource_service('archive')
    archive_id = archive_service.post([item_data])[0]
    archive = archive_service.find_one(req=None, _id=archive_id)

    return make_response(dumps(archive), 201)
