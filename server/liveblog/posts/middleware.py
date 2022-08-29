import re
import logging

from eve.utils import config
from eve.methods.common import resolve_document_etag
from superdesk import get_resource_service


logger = logging.getLogger('superdesk')


class PostEtagAutoFixerMiddleware:
    """
    There are certain situations where registries get out of sync between
    mongodb and elastic search. To be more specific, if there is a network outage
    in one of the databases, and there is user action/update on posts, there is a
    good chance that the entries will get out sync. For this cases, we need to
    be able to re-sync these registries without breaking the user experience.

    This middleware tries to take care of that in an automated way. It detects if a
    patch request for a post is coming and it checks if the etags match. If not, it
    calculates the new proper document etag and sync both registries.
    """

    def __init__(self, app):
        self.app = app.wsgi_app
        self.liveblog_app = app

    def __call__(self, environ, start_response):
        raw_uri = environ.get('RAW_URI')
        etag_if_match = environ.get('HTTP_IF_MATCH')
        is_patch_action = environ['REQUEST_METHOD'] == 'PATCH'

        if is_patch_action and raw_uri and etag_if_match:
            post_id_regex = re.compile(r'/api/posts/(?P<post_id>[\w\:\-\.]*)[/]?$')
            post_match = post_id_regex.match(raw_uri)

            if post_match is not None:
                post_id = post_match.group('post_id')
                self.sync_registries_if_needed(environ, post_id, etag_if_match)

        return self.app(environ, start_response)

    def sync_registries_if_needed(self, environ, post_id, etag_if_match):
        with self.liveblog_app.app_context():
            etag = config.ETAG
            endpoint_name = 'posts'
            eve_backend = get_resource_service(endpoint_name).backend

            data_backend = eve_backend._backend(endpoint_name)
            search_backend = eve_backend._lookup_backend(endpoint_name, fallback=True)

            mongo_entry = data_backend.find_one(endpoint_name, _id=post_id, req=None)
            if not mongo_entry:
                return

            elastic_entry = search_backend.find_one(endpoint_name, _id=post_id, req=None)
            etag_in_mongo = mongo_entry[etag]
            etag_in_elastic = elastic_entry.get(etag)

            registries_out_of_sync = etag_in_mongo != etag_in_elastic
            request_etag_match_any = etag_if_match in [etag_in_mongo, etag_in_elastic]

            if registries_out_of_sync and request_etag_match_any:
                resolve_document_etag(mongo_entry, endpoint_name)

                try:
                    eve_backend.replace(endpoint_name, post_id, mongo_entry, mongo_entry)
                    environ['HTTP_IF_MATCH'] = etag_in_mongo
                except Exception as err:
                    logger.error('Unable to sync post %s. Error: %s', post_id, err)
