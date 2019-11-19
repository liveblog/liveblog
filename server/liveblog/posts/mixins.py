import logging
from superdesk import get_resource_service
from bson.objectid import ObjectId

logger = logging.getLogger('superdesk')


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
                author_id = ObjectId(author_id)
                self.authors_list.append(author_id)
            except Exception as err:
                logger.debug("Unable to add author id to map. {}".format(err))

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

        for post in posts:
            post_author_id = str(post['original_creator'])
            post['original_creator'] = self.authors_map.get(post_author_id)

            items_refs = [assoc for group in post.get('groups', []) for assoc in group.get('refs', [])]
            for ref in items_refs:
                item = ref.get('item')
                if item:
                    author_id = str(item['original_creator'])
                    item['original_creator'] = self.authors_map.get(author_id)
