from superdesk.resource import Resource
from superdesk.services import BaseService


class PostCommentResource(Resource):
    datasource = {"source": "post_comments"}
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
        "item_type": {"type": "string", "allowed": ["post_comment"]},
        "parent_id": Resource.rel("post_comments", nullable=True),
    }

    item_methods = ["GET", "PATCH", "PUT", "DELETE"]

    privileges = {
        "GET": "post_comments_read",
        "POST": "post_comments_create",
        "PATCH": "post_comments_update",
        "DELETE": "post_comments_delete",
    }

    resource_methods = ["GET", "POST"]


class PostCommentService(BaseService):
    pass
