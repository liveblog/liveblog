import logging
from flask import request
from superdesk import get_resource_service
from bson.objectid import ObjectId

logger = logging.getLogger('superdesk')

AGENT_MOBILE_ANDROID = "okhttp/"
AGENT_MOBILE_IOS = "org.sourcefabric.LiveBlogReporter"
AGENT_MOBILE_GENERIC = "cz.adminit.liveblog"


class AuthorsMixin(object):
    """
    Class mixin to provide helpers function to extract authors, hit database once
    and attach information to given posts and inner items
    """

    authors_list = []
    authors_map = {}

    def _get_related_items(self, doc):
        items = []
        items_refs = [assoc for group in doc.get('groups', []) for assoc in group.get('refs', [])]

        if not items:
            for ref in items_refs:
                item = ref.get('item')
                if item:
                    items.append(item)

        return items

    def extract_author_ids(self, doc, items=None):
        """
        Users collection will be used many times if pulling authors one by one
        so we need to get all the IDs, store them in an object and hit DB once per request
        """
        def _append_author(item):
            author_id = item.get('original_creator', None)

            try:
                if isinstance(author_id, dict):
                    author_id = author_id.get('_id', '')

                # author_id might be an empty string, for instance when the post is syndicated in
                # for this case we use the syndicated_creator in `attach_authors` method
                if author_id:
                    author_id = ObjectId(author_id)
                    self.authors_list.append(author_id)
            except Exception as err:
                logger.warning('Unable to add author id to map. {}'.format(err))

        items = items or self._get_related_items(doc)
        for item in items:
            _append_author(item)

        # author info from the post so we can post.original_creator.X - LBSD-2010
        _append_author(doc)

        return doc

    def generate_authors_map(self):
        """
        Gets users information from database based on a list of predefined ids
        The idea behind the method is to reduce the impact on DB. Make sure to call
        `extract_author_ids` method before this one.
        """
        ids = set(self.authors_list)

        for user in get_resource_service('users').find({'_id': {'$in': ids}}):
            author_id = str(user.get('_id'))
            self.authors_map[author_id] = user

    def attach_authors(self, posts):
        """Simply gets author id from items related and for post itself and adds author info"""

        try:
            user_agent = request.user_agent.string
            logger.warning('Looking for user agent mobile app %s' % user_agent)

            is_mobile_app = any([
                (AGENT_MOBILE_IOS in user_agent),
                (AGENT_MOBILE_GENERIC in user_agent),
                (AGENT_MOBILE_ANDROID in user_agent)
            ])
        except RuntimeError:
            # RuntimeError happens when out of the context
            # it will be thrown when running celery tasks to update blog in S3
            # so we don't care about the mobile app thing.
            is_mobile_app = False

        for post in posts:
            post_author_id = str(post['original_creator'])

            post['original_creator'] = post_author_id if is_mobile_app else self.authors_map.get(post_author_id)

            if post.get('syndication_in') and not post['original_creator']:
                ref = None

                try:
                    for group in post['groups']:
                        if group['id'] == 'main':
                            ref = group['refs'][0]['item']
                except Exception as err:
                    logger.warning('Imposible to get the main item for the post {}. Error: {}'.format(post, err))

                if ref:
                    syndicated_creator = ref.get('syndicated_creator', {})
                    post['original_creator'] = syndicated_creator.get('_id') if is_mobile_app else syndicated_creator

            items_refs = [assoc for group in post.get('groups', []) for assoc in group.get('refs', [])]
            for ref in items_refs:
                item = ref.get('item')
                if item:
                    author_id = str(item['original_creator'])
                    item['original_creator'] = author_id if is_mobile_app else self.authors_map.get(author_id)
