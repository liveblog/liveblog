import pymongo
from bson.objectid import ObjectId
from superdesk import get_resource_service


class Blog:
    """
    Utility class to fetch blog data directly from mongo collections.
    """
    order_by = ('_updated', '_created')
    default_order_by = '_updated'
    sort = ('asc', 'desc')
    default_sort = 'desc'

    def __init__(self, blog):
        if isinstance(blog, (str, ObjectId)):
            blog = get_resource_service('client_blogs').find_one(_id=blog, req=None)

        self._blog = blog
        self._posts = get_resource_service('client_posts')

    def _posts_lookup(self, sticky=None, highlight=None, all=False):
        filters = [
            {'blog': {'$eq': self._blog['_id']}}
        ]
        if not all:
            filters.append({'post_status': {'$eq': 'open'}})
            filters.append({'deleted': {'$eq': False}})
        if sticky:
            filters.append({'sticky': {'$eq': sticky}})
        if highlight:
            filters.append({'highlight': {'$eq': highlight}})
        return {'$and': filters}


    def posts(self, sticky=None, highlight=None, ordering=None, page=1, limit=25, wrap=False, all=False):
        order_by, sort = self.get_ordering(ordering or self.default_ordering)

        # Fetch total.
        results = self._posts.find(self._posts_lookup(sticky, highlight, all))
        total = results.count()

        # Get sorting direction.
        if sort == 'asc':
            sort = pymongo.ASCENDING
        else:
            sort = pymongo.DESCENDING

        # Fetch posts, do pagination and sorting.
        skip = limit * (page - 1)
        results = results.skip(skip).limit(limit).sort(order_by, sort)
        posts = []
        for doc in results:
            if 'groups' not in doc:
                continue

            for group in doc['groups']:
                if group['id'] == 'main':
                    for ref in group['refs']:
                        ref['item'] = get_resource_service('archive').find_one(req=None, _id=ref['residRef'])
            posts.append(doc)

        if wrap:
            # Wrap in python-eve style data structure
            return {
                '_items': posts,
                '_meta': {
                    'page': page,
                    'total': total,
                    'max_results': limit
                }
            }
        else:
            # Return posts.
            return posts