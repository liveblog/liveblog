from superdesk.resource import Resource
from liveblog.tenancy.service import TenantAwareService


class PostCommentResource(Resource):
    datasource = {"source": "post_comments", "search_backend": None}
    schema = {
        "post_id": Resource.rel("posts", type="string", required=True),
        "blog_id": Resource.rel("blogs", required=True),
        "author_name": {
            "type": "string",
            "required": True,
            "minlength": 1,
            "maxlength": 30,
        },
        "text": {"type": "string"},
        "is_published": {"type": "boolean", "default": False},
        "item_type": {
            "type": "string",
            "allowed": ["post_comment"],
            "default": "post_comment",
        },
        "parent_id": Resource.rel("post_comments", nullable=True),
        "tenant_id": Resource.rel("tenants"),
    }

    item_methods = ["GET", "PATCH", "PUT", "DELETE"]

    privileges = {
        "GET": "post_comments_read",
        "POST": "post_comments_create",
        "PATCH": "post_comments_update",
        "DELETE": "post_comments_delete",
    }

    resource_methods = ["GET", "POST"]


class PostCommentService(TenantAwareService):
    """
    Simple CRUD service handler for post's comments
    """

    pass
