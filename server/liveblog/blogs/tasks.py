import copy
import io
import logging
import os
import sys
import magic
import superdesk

from bson import ObjectId
from eve.io.base import DataLayer
from flask import current_app as app
from celery.exceptions import SoftTimeLimitExceeded
from superdesk import get_resource_service
from superdesk.celery_app import celery
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification
from superdesk.utc import utcnow

from .app_settings import (
    BLOGLIST_ASSETS,
    BLOGSLIST_ASSETS_DIR,
    BLOGSLIST_DIRECTORY,
    CONTENT_TYPES,
)
from .embeds import embed, render_bloglist_embed
from .exceptions import MediaStorageUnsupportedForBlogPublishing
from .utils import (
    build_blog_public_url,
    check_media_storage,
    get_blog_path,
    get_bloglist_path,
    is_s3_storage_enabled,
    get_blog,
    can_delete_blog,
)

logger = logging.getLogger("liveblog")


def generate_fallback_html_url(blog_id, output, api_host):
    """
    This function is called when the primary embed generation fails, and it
    generates an HTML embed url for the blog using the default seo theme. The function
    also updates the blog's theme and theme settings to the default theme in the
    database.
    """
    logger.info(f'generate_fallback_html_url for blog "{blog_id}" started.')

    theme = "default"
    updates = {}
    blogs = get_resource_service("blogs")
    public_url = publish_embed(blog_id, theme, output, api_host)

    blog_id, blog = get_blog(blog_id)

    updates["blog_preferences"] = blog.get("blog_preferences", {})
    updates["blog_preferences"]["theme"] = theme

    blogs._update_theme_settings(updates, theme)
    blogs.system_update(blog_id, updates, blog)

    logger.info(f'generate_fallback_html_url for blog "{blog_id}" finished.')
    return public_url


def publish_embed(blog_id, theme=None, output=None, api_host=None):
    """
    Generates the html for the embed file using the `embed` function.
    If the embed fails to generate with a `TemplateNotFound` exception
    it will send a push notification so the user can be notified and it
    will also trigger the fallback mechanism to use the default theme
    """
    html = None
    try:
        html = embed(blog_id, theme, output, api_host)
    except SuperdeskApiError as e:
        # Themes are not registered yet.
        return logger.warning(e.message)
    except Exception as e:
        exc_info = sys.exc_info()
        logger.exception(
            f"Failed embed generation with theme `{theme}`. Error: {e}",
            exc_info=exc_info,
        )

        if theme != "default":
            notify_about_embed_generation_error(str(e), blog_id, theme)
            try:
                return generate_fallback_html_url(blog_id, output, api_host)
            except Exception as e:
                exc_info = sys.exc_info()
                return logger.exception(
                    f"Failed embed fallback generation with theme `{theme}`. Error: {e}",
                    exc_info=exc_info,
                )

    if html is None:
        return logger.exception(
            f"Failed embed and embed fallback generation for blog {blog_id}."
        )

    check_media_storage()
    output_id = output["_id"] if output else None
    file_path = get_blog_path(blog_id, output_id)

    # update the embed file
    file_id = app.media.put(
        io.BytesIO(bytes(html, "utf-8")),
        filename=file_path,
        content_type="text/html",
        version=False,
        check_exists=False,
    )

    logger.info(
        'Embed file "{}" for blog "{}" uploaded to s3'.format(file_path, blog_id)
    )
    return superdesk.upload.url_for_media(file_id)


def notify_about_embed_generation_error(err_msg, blog_id, theme_name):
    theme_service = get_resource_service("themes")
    theme = theme_service.find_one(req=None, name=theme_name)
    theme_name = theme.get("label", theme_name)

    push_notification(
        "embed_generation_error",
        error=err_msg,
        blog_id=blog_id,
        theme_name=theme_name,
    )


def delete_embed(blog, theme=None, output=None):
    """
    Will remove the corresponding embed file from S3 storage if enabled.
    It also update `public_urls` value on the given blog. This should be
    handled or migrated to the OutputResource later
    """

    outputs = get_resource_service("outputs")
    blog_id = blog.get("_id")
    public_urls = blog.get("public_urls", {"output": {}, "theme": {}})

    # TODO: handle all the output `public_url` logic in the output resource.
    if output:
        output_id = str(output.get("_id"))
        file_path = get_blog_path(blog_id, output_id)
        public_urls["output"].pop(output_id, None)
    else:
        if is_s3_storage_enabled():
            for output_id, output_url in public_urls["output"].items():
                out = outputs.find_one(req=None, _id=output_id)
                if out:
                    output_path = get_blog_path(blog_id, output_id)
                    app.media.delete(app.media.media_id(output_path, version=False))
            file_path = get_blog_path(blog_id)

    # Remove existing file.
    if is_s3_storage_enabled():
        app.media.delete(app.media.media_id(file_path, version=False))

    if output or theme:
        get_resource_service("blogs").system_update(
            blog_id, {"public_urls": public_urls}, blog
        )


def get_theme_for_publish(blog, output=None):
    """
    Gets the right theme to be used for embed publishing. If an output (channel)
    is provided, then if would try to get the theme assigned the output.
    If the output has no theme, then it would use the blog's theme.
    """
    blog_preferences = blog.get("blog_preferences", {})
    theme = blog_preferences.get("theme")

    if output:
        theme = output.get("theme", theme)

    return theme


def internal_publish_blog_embed_on_s3(blog, output=None, safe=True, save=True):
    """
    Publishes blog (or output channel) embed to AWS S3 storage if enabled.

    Returns:
    - tuple: A tuple containing the public URL and updated public URLs of the blog.
    """

    blog_id = blog.get("_id")
    output_id = str(output.get("_id")) if output else None
    theme = get_theme_for_publish(blog, output)

    blogs = get_resource_service("client_blogs")
    server_url = app.config["SERVER_NAME"]

    try:
        api_host = f"//{server_url}/"
        public_url = publish_embed(blog_id, theme, output, api_host=api_host)
    except MediaStorageUnsupportedForBlogPublishing as e:
        if not safe:
            raise e

        logger.error('Media storage not supported for blog "{}"'.format(blog_id))
        public_url = build_blog_public_url(app, blog_id, theme, output_id)

    public_urls = blog.get("public_urls", {"output": {}, "theme": {}})
    updates = {"public_urls": public_urls}

    if output_id:
        public_urls["output"][output_id] = public_url
    else:
        public_urls["theme"][theme] = public_url
        updates["public_url"] = public_url

    push_notification("blog", published=1, blog_id=blog_id, **updates)

    if save:
        try:
            blogs.system_update(blog_id, updates, blog)
        except DataLayer.OriginalChangedError:
            blog = blogs.find_one(req=None, _id=blog_id)
            blogs.system_update(blog_id, updates, blog)
        except SuperdeskApiError:
            logger.warning('api error: unable to update blog "{}"'.format(blog_id))

    return public_url, public_urls


@celery.task(soft_time_limit=1800)
def publish_blog_embed_on_s3(blog_or_id, output=None, safe=True, save=True):
    blog_id, blog = get_blog(blog_or_id)
    if not blog:
        logger.warning(
            'publish_blog_on_s3 for blog "{}" not started: blog not found'.format(
                blog_id
            )
        )
        return

    logger.info(
        'publish_blog_on_s3 for blog "{}"{} started.'.format(
            blog_id, ' with output="{}"'.format(output.get("name")) if output else ""
        )
    )

    try:
        return internal_publish_blog_embed_on_s3(blog, output, safe, save)
    except (Exception, SoftTimeLimitExceeded):
        logger.exception('publish_blog_on_s3 for blog "{}" failed.'.format(blog_id))
    finally:
        logger.info('publish_blog_on_s3 for blog "{}" finished.'.format(blog_id))


@celery.task(soft_time_limit=1800)
def publish_blog_embeds_on_s3(blog_or_id, safe=True, save=True, subtask_save=False):
    """
    Publishes blog embeds to AWS S3 storage and updates the blog's public URLs.

    Parameters:
    - blog_or_id: Identifier or instance of the blog to be published.
    - safe: If True, suppresses exceptions related to media storage support.
    - save: If True, updates the blog's public URLs in the database after publishing.
    - subtask_save: If True, allows subtasks to update the blog's public URLs.

    Logic:
    - The main task initializes with save=True and subtask_save=False.
    - When the main task calls the subtask to publish each output embed, it passes subtask_save=False to the subtask.
    - This prevents subtasks from updating the blog's public URLs, avoiding redundant updates.
    - After all subtasks complete, the main task performs the update using the save parameter.
    - Therefore, subtask_save ensures that only the main task updates the blog's public URLs, avoiding redundant database operations.
    """
    blogs = get_resource_service("client_blogs")
    blog_id, blog = get_blog(blog_or_id)
    if not blog:
        logger.warning(
            'publish_blog_on_s3 for blog "{}" not started: blog not found'.format(
                blog_id
            )
        )
        return

    logger.info('publish_blog_embeds_on_s3 for blog "{}" started.'.format(blog_id))
    public_url, public_urls = publish_blog_embed_on_s3(
        blog_or_id, safe=safe, save=subtask_save
    )

    outputs_service = get_resource_service("outputs")
    page_size = 25
    page = 0

    while True:
        outputs_results = (
            outputs_service.find(dict(blog=blog_id))
            .limit(page_size)
            .skip(page_size * page)
        )
        if not outputs_results.count(with_limit_and_skip=True):
            break
        page += 1

        for output in outputs_results:
            public_urls = publish_blog_embed_on_s3(
                blog_or_id, output=output, safe=safe, save=subtask_save
            )[1]

    if save:
        blogs.system_update(
            blog_id, {"public_url": public_url, "public_urls": public_urls}, blog
        )

    logger.info('publish_blog_embeds_on_s3 for blog "{}" finished.'.format(blog_id))


@celery.task(soft_time_limit=1800)
def delete_blog_embeds_on_s3(blog, theme=None, output=None, safe=True):
    logger.info(
        'delete_blog_embed_on_s3 for blog "{}" started.'.format(blog.get("_id"))
    )

    try:
        delete_embed(blog, theme=theme, output=output)
    except MediaStorageUnsupportedForBlogPublishing as e:
        if not safe:
            raise e
    except (Exception, SoftTimeLimitExceeded):
        logger.exception(
            'delete_blog_on_s3 for blog "{}" failed.'.format(blog.get("_id"))
        )
    finally:
        logger.info(
            'delete_blog_embed_on_s3 for blog "{}" finished.'.format(blog.get("_id"))
        )


@celery.task(soft_time_limit=1800)
def publish_bloglist_assets(asset_type):
    assets = copy.deepcopy(BLOGLIST_ASSETS)
    # version_path = os.path.join(BLOGSLIST_DIRECTORY, BLOGSLIST_ASSETS_DIR, assets['version'])
    # # loads version json from file
    # version = json.loads(open(version_path, 'rb').read()).get('version', '0.0.0')
    # Save the file in the media storage if needed
    for name in assets[asset_type]:
        asset_file = os.path.join(BLOGSLIST_DIRECTORY, BLOGSLIST_ASSETS_DIR, name)
        with open(asset_file, "rb") as file:
            # Set the content type.
            mime = magic.Magic(mime=True)
            content_type = mime.from_file(asset_file)
            if content_type == "text/plain" and name.endswith(
                tuple(CONTENT_TYPES.keys())
            ):
                content_type = CONTENT_TYPES[os.path.splitext(name)[1]]

            final_file_name = os.path.join(BLOGSLIST_ASSETS_DIR, name)
            # Remove existing first.
            app.media.delete(
                app.media.media_id(final_file_name, content_type=content_type)
            )
            # Upload.
            app.media.put(
                file.read(), filename=final_file_name, content_type=content_type
            )


@celery.task(soft_time_limit=1800)
def publish_bloglist_embed_on_s3():
    if not app.config["S3_PUBLISH_BLOGSLIST"]:
        logger.warning("Blog list embed publishing is disabled.")
        return

    if is_s3_storage_enabled():
        assets = copy.deepcopy(BLOGLIST_ASSETS)

        # Publish version file to get the asset_root.
        version_file = os.path.join(BLOGSLIST_ASSETS_DIR, assets.get("version"))

        # Remove existing first.
        app.media.delete(
            app.media.media_id(version_file, content_type="application/json")
        )

        # Upload to Amazon S3.
        bloglist_path = os.path.join(BLOGSLIST_DIRECTORY, version_file)
        with open(bloglist_path, "rb") as f:
            file_id = app.media.put(
                f.read(), filename=version_file, content_type="application/json"
            )

        assets_public_url = superdesk.upload.url_for_media(file_id)

        # Correct assets public url path.
        assets_public_url = assets_public_url.replace(assets["version"], "")
        assets_public_url = assets_public_url.replace("http://", "//")
        html = render_bloglist_embed(assets_root=assets_public_url)
        file_path = get_bloglist_path()

        # Remove existing.
        app.media.delete(app.media.media_id(file_path, version=False))
        # upload
        file_id = app.media.put(
            io.BytesIO(bytes(html, "utf-8")),
            filename=file_path,
            content_type="text/html",
            version=False,
        )
        public_url = superdesk.upload.url_for_media(file_id)

        # Retrieves all opened blogs.
        blogslist_service = get_resource_service("blogslist")
        for blogslist in blogslist_service.get(req=None, lookup=dict(key="bloglist")):
            get_resource_service("blogslist").system_update(
                blogslist["_id"], {"value": public_url}, blogslist
            )
        else:
            blogslist_service.create([{"key": "bloglist", "value": public_url}])

        publish_bloglist_assets("scripts")
        publish_bloglist_assets("styles")


@celery.task
def post_auto_output_creation(output_data):
    """
    Dummy task to trigger the automatic creation of
    output channel. The reason of this task is to avoid race
    condition between the blog creation and output creation
    """

    get_resource_service("outputs").post(output_data)


@celery.task
def remove_deleted_blogs():
    """
    Simply find what blogs has been marked with blog_status "deleted"
    and it will remove them (and the embeds) not before 3 days
    """

    logger.info("Checking for blogs marked for deletion")

    blog_service = get_resource_service("blogs")
    archive_service = get_resource_service("archive")

    for blog in blog_service.find({"blog_status": "deleted"}):
        if blog["delete_not_before"] <= utcnow():
            blog_id = blog["_id"]
            if can_delete_blog(blog):
                try:
                    blog_service.on_delete(blog)
                    blog_service.delete(lookup={"_id": blog_id})
                    archive_service.delete(lookup={"blog": ObjectId(blog_id)})

                    logger.info(
                        'Blog "{}" with id "{}" removed as was marked for deletion'.format(
                            blog["title"], blog["_id"]
                        )
                    )
                except Exception as err:
                    logger.error(
                        "There was a problem removing the blog. {}".format(err)
                    )
            else:
                # given it's not possible to remove the blog, then we archive it
                updates = blog.copy()
                updates["blog_status"] = "closed"
                blog_service.update(blog_id, updates, blog)

                logger.info(
                    'Blog "{}" with id "{}" archived as it had syndication and active consumers'.format(
                        blog["title"], blog["_id"]
                    )
                )
