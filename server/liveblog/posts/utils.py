import logging
from bson import ObjectId
from flask import current_app as app
from itertools import groupby
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utcnow


logger = logging.getLogger("superdesk")

# Services a post ref may resolve through, keyed by the ref `location` (a ref without
# one points at `archive`). `location` is client input and must never reach
# `get_resource_service` directly, or a post can embed any resource (`tenants`,
# `users`) of any tenant. All of these services are tenant-aware.
REF_LOCATION_SERVICES = {
    "archive": "items",
    "items": "items",
    "polls": "polls",
    "post_comments": "post_comments",
}


def get_associations(post):
    for group in post.get("groups", []):
        for assoc in group.get("refs", []):
            yield assoc


def get_associations_ids(post):
    ids = []

    for assoc in get_associations(post):
        ref_id = assoc.get("residRef", None)
        if ref_id:
            ids.append(ref_id)

    return ids


def get_ref_service_name(ref):
    """Return the service a ref resolves through, or None when its `location` is not allowed."""
    return REF_LOCATION_SERVICES.get(ref.get("location", "archive"))


def get_ref_id(ref):
    """Return a ref's `residRef` as a string, or None when it is not an id."""
    ref_id = ref.get("residRef")
    return str(ref_id) if isinstance(ref_id, (str, ObjectId)) else None


def find_ref_items(refs, tenant_id):
    """Resolve refs to a {get_ref_id(ref): item} dict, only within `tenant_id`.

    The tenant is passed explicitly because tenant-aware services do not filter
    outside a request (Celery tasks, system mode). Refs with a location that is not
    allowed, or that point at another tenant's documents, are left out.
    """
    ids_by_service = {}
    for ref in refs:
        ref_id = get_ref_id(ref)
        service_name = get_ref_service_name(ref)
        if service_name and ref_id:
            ids_by_service.setdefault(service_name, set()).add(ref_id)

    items = {}
    for service_name, ids in ids_by_service.items():
        lookup = {"_id": {"$in": list(ids)}, "tenant_id": tenant_id}
        for item in get_resource_service(service_name).find(lookup):
            items[str(item["_id"])] = item
    return items


def validate_post_refs(post, tenant_id):
    """Reject a post whose refs point outside the allowed resources or `tenant_id`."""
    refs = [ref for ref in get_associations(post) if not ref.get("idRef")]
    items = find_ref_items(refs, tenant_id)
    for ref in refs:
        if get_ref_service_name(ref) is None:
            raise SuperdeskApiError.badRequestError(
                message="Invalid item location: {}".format(ref.get("location"))
            )
        if get_ref_id(ref) not in items:
            raise SuperdeskApiError.badRequestError(
                message="Invalid item reference: {}".format(ref.get("residRef"))
            )


def get_related_items(post):
    """
    Returns a list of all the related items for the given post.
    """
    items = []
    items_refs = [
        assoc for group in post.get("groups", []) for assoc in group.get("refs", [])
    ]

    for ref in items_refs:
        item = ref.get("item")
        if item:
            items.append(item)

    return items


def get_first_item_of_type(items, item_type):
    """Returns the first item for the given type."""
    for item in items:
        if item.get("item_type") == item_type:
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
        post_items_type = items[0].get("item_type", "")
        first_item_type = post_items_type.lower()

        if first_item_type.startswith("advertisement"):
            post_items_type = "advertisement"
        elif first_item_type == "embed":
            post_items_type = get_embed_type(items[0])
        elif first_item_type == "poll":
            post_items_type = "poll"

    elif items_length == 2 and not all(
        [item["item_type"] == "embed" for item in items]
    ):
        item0_type = items[0].get("item_type", "").lower()
        item1_type = items[1].get("item_type", "").lower()

        if item1_type == "embed" and item0_type == "text":
            post_items_type = get_embed_type(items[1])
        elif item0_type == "embed" and item1_type == "text":
            post_items_type = get_embed_type(items[0])
        elif (item0_type == "poll" and item1_type == "text") or (
            item1_type == "poll" and item0_type == "text"
        ):
            post_items_type = "poll"

    elif items_length > 1:
        for k, g in groupby(items, key=lambda i: i["item_type"]):
            if k == "image" and sum(1 for _ in g) > 1:
                post_items_type = "slideshow"
                break

    post["post_items_type"] = post_items_type

    return post


def get_embed_type(item):
    post_items_type = "embed"
    if "provider_name" in item["meta"]:
        post_items_type = "{}-{}".format(
            post_items_type, item["meta"]["provider_name"].lower()
        )
    return post_items_type


def attach_syndication(post):
    """
    Checks if post is syndicated and fetches the reference from the database
    """

    if post.get("syndication_in"):
        post["syndication_in"] = get_resource_service("syndication_in").find_one(
            req=None, _id=post["syndication_in"]
        )


def get_first_item(post):
    """
    It gets the first related item of a post. If the post is syndicated then
    it will return the syndicated item instead as the first one
    """
    is_syndicated = post.get("syndication_in")
    main_item = {}

    try:
        for group in post["groups"]:
            if group["id"] == "main":
                if is_syndicated:
                    for ref in group["refs"]:
                        syndicated_creator = ref.get("item", {}).get(
                            "syndicated_creator"
                        )
                        if syndicated_creator:
                            main_item = ref.get("item")
                            break
                else:
                    main_item = group["refs"][0]["item"]
                    break

    except Exception as err:
        logger.info(
            "Imposible to get the main item for the post {}. Error: {}".format(
                post, err
            )
        )

    return main_item


def check_content_diff(updates, original):
    """
    Checks if there are any content differences between the original and updated
    objects
    """
    content_diff = False

    if not updates.get("groups", False):
        return content_diff

    original_refs = original["groups"][1]["refs"]
    updated_refs = updates["groups"][1]["refs"]

    if len(original_refs) != len(updated_refs):
        return True

    items = find_ref_items(updated_refs, original.get("tenant_id"))
    for index, item_ref in enumerate(updated_refs):
        item = items.get(get_ref_id(item_ref))
        if item is None:
            return True
        item_type = item.get("item_type")

        if item_type == "poll":
            original_poll_body = original_refs[index]["item"].get("poll_body", {})
            item_poll_body = item.get("poll_body", {})

            original_active_until = original_poll_body.get("active_until")
            item_active_until = item_poll_body.get("active_until")

            if original_active_until and item_active_until:
                if original_active_until != item_active_until:
                    return True
        else:
            if item["text"] != original_refs[index]["item"]["text"]:
                return True

    return content_diff


def update_associated_post(blog_id, item_id):
    """
    Updates all associated blog posts related to the given item i.e poll.
    """
    posts_service = get_resource_service("client_posts")

    for post in posts_service.find({"blog": blog_id, "particular_type": "post"}):
        for assoc in get_associations(post):
            if assoc.get("residRef") == item_id:
                updated_post = post.copy()
                updated_post["content_updated_date"] = utcnow()
                posts_service.update(post.get("_id"), updated_post, post)
                app.blog_cache.invalidate(blog_id)
