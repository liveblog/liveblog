import copy
import io
import logging
import os
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
    check_media_storage,
    get_blog_path,
    get_bloglist_path,
    is_s3_storage_enabled,
    get_blog,
    can_delete_blog,
)

logger = logging.getLogger("superdesk")


def publish_embed(blog_id, theme=None, output=None, api_host=None):
    # Get html using embed() blueprint.
    try:
        html = embed(blog_id, theme, output, api_host)
    except SuperdeskApiError as e:
        # Themes are not registered yet.
        logger.warning(e.message)
        return

    check_media_storage()
    output_id = output["_id"] if output else None
    file_path = get_blog_path(blog_id, theme, output_id)
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
        file_path = get_blog_path(blog_id, output.get("theme"), output_id)
        public_urls["output"].pop(output_id, None)
    elif theme:
        file_path = get_blog_path(blog_id, theme)
        public_urls["theme"].pop(theme, None)
    else:
        if is_s3_storage_enabled():
            for output_id, output_url in public_urls["output"].items():
                out = outputs.find_one(req=None, _id=output_id)
                if out:
                    output_path = get_blog_path(blog_id, out.get("theme"), output_id)
                    app.media.delete(app.media.media_id(output_path, version=False))
            for theme_name, theme_url in public_urls["theme"].items():
                theme_path = get_blog_path(blog_id, theme_name)
                app.media.delete(app.media.media_id(theme_path, version=False))
            file_path = get_blog_path(blog_id)

    # Remove existing file.
    if is_s3_storage_enabled():
        app.media.delete(app.media.media_id(file_path, version=False))

    if output or theme:
        get_resource_service("blogs").system_update(
            blog_id, {"public_urls": public_urls}, blog
        )


def _publish_blog_embed_on_s3(
    blog_or_id, theme=None, output=None, safe=True, save=True
):
    # TODO: replace blog_or_id with just blog to reduce hitting the db server with extra queries

    blogs = get_resource_service("client_blogs")
    if isinstance(blog_or_id, (str, ObjectId)):
        blog_id = blog_or_id
        blog = blogs.find_one(req=None, _id=blog_or_id)
        if not blog:
            return
    else:
        blog = blog_or_id
        blog_id = blog["_id"]

    blog_preferences = blog.get("blog_preferences", {})
    blog_theme = blog_preferences.get("theme")

    output_id = None
    if output:
        output_id = str(output.get("_id"))

        # compile a theme if there is an `output`.
        if output.get("theme"):
            theme = output.get("theme", blog_theme)

    server_url = app.config["SERVER_NAME"]
    protocol = app.config["EMBED_PROTOCOL"]

    if blog_theme:
        try:
            api_host = "//{}/".format(server_url)
            public_url = publish_embed(blog_id, theme, output, api_host=api_host)

        except MediaStorageUnsupportedForBlogPublishing as e:
            if not safe:
                raise e

            logger.warning('Media storage not supported for blog "{}"'.format(blog_id))

            output_str = output_id if output_id else ""
            theme_str = "/theme/{}".format(theme) if theme else ""
            public_url = "{}{}/embed/{}/{}{}".format(
                protocol, server_url, blog_id, output_str, theme_str
            )

        public_urls = blog.get("public_urls", {"output": {}, "theme": {}})
        updates = {"public_urls": public_urls}

        if (output_id and theme) or output_id:
            public_urls["output"][output_id] = public_url
        elif theme:
            public_urls["theme"][theme] = public_url
        else:
            updates["public_url"] = public_url

        if save:
            try:
                try:
                    blogs.system_update(blog_id, updates, blog)
                except DataLayer.OriginalChangedError:
                    blog = blogs.find_one(req=None, _id=blog_id)
                    blogs.system_update(blog_id, updates, blog)
            except SuperdeskApiError:
                logger.warning('api error: unable to update blog "{}"'.format(blog_id))

        push_notification("blog", published=1, blog_id=blog_id, **updates)
        return public_url, public_urls


@celery.task(soft_time_limit=1800)
def publish_blog_embed_on_s3(blog_or_id, theme=None, output=None, safe=True, save=True):
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
        return _publish_blog_embed_on_s3(blog_or_id, theme, output, safe, save)
    except (Exception, SoftTimeLimitExceeded):
        logger.exception('publish_blog_on_s3 for blog "{}" failed.'.format(blog_id))
    finally:
        logger.info('publish_blog_on_s3 for blog "{}" finished.'.format(blog_id))


@celery.task(soft_time_limit=1800)
def publish_blog_embeds_on_s3(blog_or_id, safe=True, save=True, subtask_save=False):
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
