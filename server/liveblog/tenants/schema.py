"""
Schema definition for the tenants resource.

Tenants represent isolated workspaces in the multi-tenant LiveBlog system.
Each tenant has its own isolated set of blogs, posts, items, and other
resources.
"""

tenants_schema = {
    "name": {
        "type": "string",
        "required": True,
        "minlength": 1,
        "maxlength": 100,
        "unique": False,
    },
    "subscription_level": {
        "type": "string",
        "allowed": ["solo", "team", "network"],
        "default": "solo",
    },
    "settings": {"type": "dict", "mapping": {"type": "object", "enabled": False}},
    "owner_user_id": {
        "type": "objectid",
        "nullable": True,
        "data_relation": {"resource": "users", "field": "_id"},
    },
}
