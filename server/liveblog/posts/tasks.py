import logging

from datetime import datetime
from flask import current_app as app
from superdesk import get_resource_service
from superdesk.celery_app import celery
from superdesk.notification import push_notification
from celery.exceptions import SoftTimeLimitExceeded
from liveblog.blogs.tasks import publish_blog_embeds_on_s3
from liveblog.blogs.utils import is_seo_enabled
from eve.io.base import DataLayer

logger = logging.getLogger("superdesk")


@celery.task()
def update_post_blog_data(post, action="created"):
    """
    Update blog data num_post and last created or updated post.

    :param post:
    :param updated:
    :return: None
    """
    blogs = get_resource_service("client_blogs")
    posts = get_resource_service("posts")
    blog_id = post.get("blog")
    if not blog_id:
        return

    blog = blogs.find_one(req=None, _id=blog_id)
    if not blog:
        return

    # Fetch total posts.
    total_posts = posts.find(
        {"$and": [{"blog": blog_id}, {"post_status": "open"}, {"deleted": False}]}
    ).count()
    updates = {
        "total_posts": total_posts,
    }

    if action in ("updated", "created"):
        # Update last_updated_post or last_created_post.
        post_field = "last_{}_post".format(action)
        updates[post_field] = {
            "_id": post["_id"],
            "_updated": post["content_updated_date"],
        }
    try:
        blogs.system_update(blog_id, updates, blog)
    except DataLayer.OriginalChangedError:
        blog = blogs.find_one(req=None, _id=blog_id)
        blogs.system_update(blog_id, updates, blog)

    logger.warning('Blog "{}" post data has been updated.'.format(blog_id))


@celery.task()
def update_post_blog_embed(post):
    """
    Update post blog embed.

    :param post:
    :return:
    """
    blogs = get_resource_service("client_blogs")
    blog_id = post.get("blog")
    if not blog_id:
        return

    blog = blogs.find_one(req=None, _id=blog_id)
    if not blog:
        return

    if not is_seo_enabled(blog):
        return

    logger.warning('update_post_blog_embed for blog "{}" started.'.format(blog_id))

    try:
        publish_blog_embeds_on_s3(
            blog_id, save=(blog.get("public_url") is None), safe=True
        )
    except (Exception, SoftTimeLimitExceeded):
        logger.exception('update_post_blog_embed for blog "{}" failed.'.format(blog_id))
    finally:
        logger.warning('update_post_blog_embed for blog "{}" finished.'.format(blog_id))


@celery.task
def notify_scheduled_post(post, published_date):
    """
    It will send a push notification via websocket connection to let the client know
    that the post.published_date has reached its time and it's not available in timeline.
    Also invalidates blog cache to make sure requests will get latest posts from db
    """

    from .posts import PostStatus  # avoid circular references

    post_id = post["_id"]
    posts = get_resource_service("posts")
    db_post = posts.find_one(req=None, _id=post_id)

    if not db_post:
        return

    if db_post.get("published_date") == published_date:
        app.blog_cache.invalidate(post.get("blog"))
        push_notification(
            "posts", scheduled_done=True, post_status=PostStatus.OPEN, posts=[post]
        )


@celery.task
def update_scheduled_post_blog_data(post, action):
    """
    Update blog data last created or updated post based on scheduled post
    only if the existing time is older than the scheduled post time
    """
    blogs = get_resource_service("client_blogs")
    blog_id = post.get("blog")
    if not blog_id:
        return

    blog = blogs.find_one(req=None, _id=blog_id)
    if not blog:
        return

    content_updated_date = post.get("content_updated_date")
    if not content_updated_date:
        return

    last_created_post = blog.get("last_created_post", {})
    last_updated_post = blog.get("last_updated_post", {})
    updates = {}

    if action == "created":
        if not last_created_post or content_updated_date > last_created_post.get(
            "_updated", datetime.min
        ):
            updates["last_created_post"] = {
                "_id": post["_id"],
                "_updated": content_updated_date,
            }
    elif action == "updated":
        if not last_updated_post or content_updated_date > last_updated_post.get(
            "_updated", datetime.min
        ):
            updates["last_updated_post"] = {
                "_id": post["_id"],
                "_updated": content_updated_date,
            }

    if updates:
        try:
            blogs.system_update(blog_id, updates, blog)
        except DataLayer.OriginalChangedError:
            blog = blogs.find_one(req=None, _id=blog_id)
            blogs.system_update(blog_id, updates, blog)
        logger.warning(
            'Blog "{}" scheduled post data has been updated.'.format(blog_id)
        )
