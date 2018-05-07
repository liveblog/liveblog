import pymongo
from bson.objectid import ObjectId
from superdesk import get_resource_service
from html5lib.html5parser import ParseError
from lxml.html.html5parser import fragments_fromstring, HTMLParser


def is_valid_html(html):
    try:
        fragments_fromstring(html.encode('utf-8'), parser=HTMLParser(strict=True))
    except ParseError:
        return False
    return True


class Blog:
    """
    Utility class to fetch blog data directly from mongo collections.
    """
    order_by = ('_updated', '_created', 'order')
    sort = ('asc', 'desc')
    ordering = {
        'newest_first': ('_created', 'desc'),
        'oldest_first': ('_created', 'asc'),
        'editorial': ('order', 'desc')
    }
    default_ordering = 'newest_first'
    default_order_by = '_created'
    default_sort = 'desc'
    default_page = 1
    default_page_limit = 25
    max_page_limit = 100

    def __init__(self, blog):
        if isinstance(blog, (str, ObjectId)):
            blog = get_resource_service('client_blogs').find_one(_id=blog, req=None)

        self._blog = blog
        self._posts = get_resource_service('client_posts')

    # @TODO: refactor params, deleted was introduced as a hot fix.
    def _posts_lookup(self, sticky=None, highlight=None, all=False, deleted=False):
        filters = [
            {'blog': self._blog['_id']}
        ]
        if not all:
            filters.append({'post_status': 'open'})
            if not deleted:
                filters.append({'deleted': False})

        if sticky:
            filters.append({'sticky': True})
        else:
            filters.append({'sticky': False})
        if highlight:
            filters.append({'lb_highlight': True})
        return {'$and': filters}

    def get_ordering(self, label):
        try:
            order_by, sort = self.ordering[label]
            return order_by, sort
        except KeyError:
            return self.default_order_by, self.default_sort

    def check_html_markup(self, original_text):
        div_wrapped = '<div>{}</div>'.format(original_text)
        if not is_valid_html(original_text) and is_valid_html(div_wrapped):
            original_text = div_wrapped
        return original_text

    def posts(self, sticky=None, highlight=None, ordering=None, page=default_page, limit=default_page_limit, wrap=False,
              all=False, deleted=False):
        order_by, sort = self.get_ordering(ordering or self.default_ordering)
        # Fetch total.
        results = self._posts.find(self._posts_lookup(sticky, highlight, all, deleted))
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
                        # Check the original text html markup.
                        original_text = ref['item'].get('text')
                        ref['item']['text'] = self.check_html_markup(original_text)

            posts.append(doc)

        # Enrich documents
        client_blog_posts = get_resource_service('client_blog_posts')
        for doc in posts:
            client_blog_posts.add_post_info(doc)

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
