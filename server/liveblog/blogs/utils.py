import os
import logging
import pymongo
from bson.objectid import ObjectId
from flask import current_app as app
from superdesk import get_resource_service
from superdesk.notification import push_notification

from .app_settings import BLOGSLIST_ASSETS_DIR
from .exceptions import MediaStorageUnsupportedForBlogPublishing

logger = logging.getLogger("superdesk")


def is_s3_storage_enabled():
    return type(app.media).__name__ == "AmazonMediaStorage"


def check_media_storage():
    if not is_s3_storage_enabled():
        raise MediaStorageUnsupportedForBlogPublishing()


def get_blog_path(blog_id, theme=None, output_id=None):
    theme_str = output_str = ""

    if output_id:
        theme_str = f"{theme}/" if theme else ""
        output_str = f"{output_id}/"

    return f"blogs/{blog_id}/{theme_str}{output_str}index.html"


def get_bloglist_path():
    return os.path.join(BLOGSLIST_ASSETS_DIR, "index.html")


def is_relative_to_current_folder(url):
    return not (
        url.startswith("/") or url.startswith("http://") or url.startswith("https://")
    )


def get_blog(blog_or_id):
    blogs = get_resource_service("client_blogs")
    if isinstance(blog_or_id, (str, ObjectId)):
        blog_id = blog_or_id
        blog = blogs.find_one(req=None, _id=blog_or_id)
    elif isinstance(blog_or_id, dict):
        blog = blog_or_id
        blog_id = blog["_id"]
    else:
        raise ValueError(blog_or_id)

    return blog_id, blog


def is_seo_enabled(blog_or_id):
    """
    Return True if blog has seo output enabled in theme.
    """
    blog_id, blog = get_blog(blog_or_id)
    if not blog:
        return

    themes = get_resource_service("themes")
    blog_preferences = blog.get("blog_preferences")
    if not blog_preferences:
        return

    theme_name = blog_preferences.get("theme")
    if not theme_name:
        return

    theme = themes.find_one(req=None, name=theme_name)
    if not theme:
        return
    if theme.get("seoTheme"):
        return True

    outputs_service = get_resource_service("outputs")
    for output in outputs_service.get(req=None, lookup=dict(blog=blog_id)):
        theme_name = output.get("theme")
        if not theme_name:
            continue

        theme = themes.find_one(req=None, name=theme_name)
        if not theme:
            continue

        if theme.get("seoTheme"):
            return True


def check_limit_and_delete_oldest(blog_id):
    """
    Simple method that checks if a blog has reached the limit of posts and
    deletes ({deleted: true}) the oldest post that belongs to the given blog
    """

    UNLIMITED = 0

    blog = get_resource_service("client_blogs").find_one(req=None, _id=blog_id)
    if not blog:
        return

    post_service = get_resource_service("posts")
    query_params = {
        "blog": ObjectId(blog_id),
        "particular_type": "post",
        "deleted": False,
    }
    posts_limit = blog.get("posts_limit", UNLIMITED)

    if posts_limit != UNLIMITED and blog["total_posts"] > posts_limit:
        oldest_post = (
            post_service.find(query_params).sort("_created", pymongo.ASCENDING).limit(1)
        )

        for doc in oldest_post:
            post_service.update(doc["_id"], {"deleted": True}, doc)
            logger.info(
                "Deleted oldest post `%s` because posts_limit (%s) in blog `%s` has been reached"
                % (doc["_id"], posts_limit, blog["_id"])
            )

        stats = get_blog_stats(blog_id)
        if stats:
            push_notification("blog:limits", blog_id=blog_id, stats=stats)


def get_blog_stats(blog_or_id):
    """
    This find some specific information about the given blog
    like posts_limit, total_posts and returns it in a dictionary
    """
    posts = get_resource_service("posts")

    blog_id, blog = get_blog(blog_or_id)
    if not blog:
        return

    total_posts = posts.find(
        {"$and": [{"blog": blog_id}, {"post_status": "open"}, {"deleted": False}]}
    ).count()

    return {"total_posts": total_posts, "posts_limit": blog.get("posts_limit")}


def can_delete_blog(blog):
    """Returns False if the given blog has syndication enabled and registered consumers"""

    out = get_resource_service("syndication_out").find({"blog_id": blog["_id"]})
    if blog.get("syndication_enabled", False) and out.count():
        return False

    return True


def build_blog_public_url(app, blog_id, theme=None, output_id=None):
    """
    Creates the public url for a given blog. If `output_id` is provided
    it will compile the url using the given theme
    """
    server_url = app.config["SERVER_NAME"]
    protocol = app.config["EMBED_PROTOCOL"]

    theme_str = output_str = ""

    if output_id:
        output_str = f"/{output_id}"
        theme_str = f"/theme/{theme}" if theme else ""

    return f"{protocol}{server_url}/embed/{blog_id}{output_str}{theme_str}"
