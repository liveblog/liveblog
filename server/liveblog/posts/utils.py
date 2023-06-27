from itertools import groupby
from superdesk import get_resource_service


def get_associations(post):
    for group in post.get('groups', []):
        for assoc in group.get('refs', []):
            yield assoc


def get_associations_ids(post):
    ids = []

    for assoc in get_associations(post):
        ref_id = assoc.get('residRef', None)
        if ref_id:
            ids.append(ref_id)

    return ids


def get_related_items(post):
    """
    Returns a list of all the related items for the given post.
    """
    items = []
    items_refs = [assoc for group in post.get('groups', []) for assoc in group.get('refs', [])]

    for ref in items_refs:
        item = ref.get('item')
        if item:
            items.append(item)

    return items


def get_first_item_of_type(items, item_type):
    """ Returns the first item for the given type. """
    for item in items:
        if item.get('item_type') == item_type:
            return item


def calculate_post_type(post, items=None):
    """
    Tries to get the main post types based on the number of items related to the post
    and to the content of those items.

    Returns the post with post_items_type attribute if possible
    """

    items = items or get_related_items(post)
    items_length = len(items)
    post_items_type = None

    if not items_length:
        return post

    if items_length == 1:
        post_items_type = items[0].get('item_type', '')
        first_item_type = post_items_type.lower()

        if first_item_type.startswith('advertisement'):
            post_items_type = 'advertisement'

        elif first_item_type == 'embed':
            post_items_type = 'embed'
            if 'provider_name' in items[0]['meta']:
                post_items_type = "{}-{}".format(post_items_type, items[0]['meta']['provider_name'].lower())

    elif items_length == 2 and not all([item['item_type'] == 'embed' for item in items]):
        if items[1].get('item_type', '').lower() == 'embed' and items[0].get('item_type', '').lower() == 'text':
            post_items_type = 'embed'
            if 'provider_name' in items[1]['meta']:
                post_items_type = "{}-{}".format(post_items_type, items[1]['meta']['provider_name'].lower())
        elif (items[0].get('item_type', '').lower() == 'embed' and
                items[1].get('item_type', '').lower() == 'text'):
            post_items_type = 'embed'
            if 'provider_name' in items[0]['meta']:
                post_items_type = "{}-{}".format(post_items_type, items[0]['meta']['provider_name'].lower())

    elif items_length > 1:
        for k, g in groupby(items, key=lambda i: i['item_type']):
            if k == 'image' and sum(1 for _ in g) > 1:
                post_items_type = 'slideshow'
                break

    post['post_items_type'] = post_items_type

    return post


def attach_syndication(post):
    """
    Checks if post is syndicated and fetches the reference from the database
    """

    if post.get('syndication_in'):
        post['syndication_in'] = get_resource_service('syndication_in')\
            .find_one(req=None, _id=post['syndication_in'])
