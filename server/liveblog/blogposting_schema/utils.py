import json
import logging
from bs4 import BeautifulSoup
from datetime import timezone, timedelta

from liveblog.core.constants import GENERAL_JSON_LD_TIMEZONE_OFFSET
from liveblog.posts.utils import (
    get_first_item,
    get_first_item_of_type,
    get_related_items,
)
from superdesk import get_resource_service
from .schema import LiveBlogPostingSchema
from .models import BlogPosting, ImageObject, LiveBlogPosting, MainEntityOfPage, Author

logger = logging.getLogger("superdesk")


def get_configured_timezone_offset(blog):
    """
    Returns the timezone offset to be used in the JSON-LD schema.
    The timezone offset can either come from the General Liveblog Settings or the specific blog settings.
    If they are different, the blog settings take precedence.
    """
    global_serv = get_resource_service("global_preferences").get_global_prefs()
    global_timezone_offset = global_serv.get(GENERAL_JSON_LD_TIMEZONE_OFFSET, 0)
    blog_timezone_offset = blog.get("json_ld_timezone_offset", 0)

    if blog_timezone_offset != global_timezone_offset:
        return blog_timezone_offset

    return global_timezone_offset


def convert_to_configured_timezone(value, tz_offset=0):
    """
    Converts a datetime value to the given timezone offset.

    Args:
        value (datetime or None): The datetime to convert.
        tz_offset (str or int): Timezone offset as hours (e.g. "3" for UTC+3).

    Returns:
        datetime or None: The timezone-aware datetime, or the original value if not applicable.
    """
    if value is None:
        return None

    if tz_offset == 0:
        return value

    try:
        tz = timezone(timedelta(hours=tz_offset))
        return value.astimezone(tz)
    except (ValueError, TypeError):
        return value


def get_modified_date(blog):
    """
    Returns the modified date of the blog.

    If the blog has a last updated post, returns the updated date of that post.
    Otherwise, returns the start date of the blog.

    Args:
        blog (dict): A dictionary representing the blog.

    Returns:
        str: The modified date of the blog.
    """
    last_updated_post = blog.get("last_updated_post")
    if last_updated_post:
        return last_updated_post.get("_updated")
    return blog["start_date"]


def get_base_image(item):
    """
    Get the base image from the given item's metadata.

    Args:
        item (dict): The item to extract the base image from.

    Returns:
        str: The URL of the base image, or None if not found.
    """
    meta = item.get("meta", {})
    media = meta.get("media", {})

    if media:
        return media.get("renditions", {}).get("baseImage")


def clean_html_text(html_text):
    """
    Cleans HTML text by converting <br> tags to newlines and stripping all other HTML tags.

    This function uses BeautifulSoup with the lxml parser for efficient HTML parsing.
    It preserves line breaks from <br> tags while removing all other HTML markup.

    Args:
        html_text (str): The HTML text to clean.

    Returns:
        str: The cleaned text with <br> tags converted to newlines and all other HTML tags removed.
    """
    soup = BeautifulSoup(html_text, "lxml")
    for br in soup.find_all("br"):
        br.replace_with("\n")
    return soup.get_text().strip()


def generate_blogupdate(blog, post, theme_settings):
    """
    Generates a BlogPosting object from a blog post.

    Uses the post data and theme settings to create a BlogPosting object with the relevant data.
    Sets the article body and image of the BlogPosting object based on the related items in the post data.

    Args:
        blog (dict): A dictionary representing the blog.
        post (dict): A dictionary representing the blog post.
        theme_settings (dict): A dictionary representing the theme settings.

    Returns:
        BlogPosting: A BlogPosting object representing the blog post.
    """

    first_post_item = get_first_item(post)
    if not first_post_item:
        return None

    author = get_post_author(post, first_post_item, theme_settings)
    blog_posting = BlogPosting.from_blog_post(post, author)
    blog_posting.set_post_url(theme_settings, blog)

    # we need to preferably set the article body and and image
    # so we're gonna get the first item of type image and text
    items = get_related_items(post)

    text_item = get_first_item_of_type(items, "text")
    if text_item:
        blog_posting.article_body = clean_html_text(text_item.get("text"))

    image_item = get_first_item_of_type(items, "image")
    if image_item:
        main_image = get_base_image(image_item)
        image = ImageObject.from_rendition_image(main_image)
        blog_posting.set_image(image)

    tz_offset = get_configured_timezone_offset(blog)
    blog_posting.date_published = convert_to_configured_timezone(
        blog_posting.date_published, tz_offset
    )
    blog_posting.date_modified = convert_to_configured_timezone(
        blog_posting.date_modified, tz_offset
    )

    return blog_posting


def get_post_author(post, first_post_item, theme_settings):
    """
    Returns the author of a blog post.

    Determines the author of a blog post based on the post data and theme settings.
    If the post is syndicated and the theme settings allow it, returns the syndicated author.
    Otherwise, returns the original creator of the post or the publisher of the main post item.

    Args:
        post (dict): A dictionary representing the blog post.
        first_post_item (dict): A dictionary representing the first post item.
        theme_settings (dict): A dictionary representing the theme settings.

    Returns:
        Author or None: An Author object representing the author of the blog post, or None if no author is found.
    """
    show_syndicated_author = theme_settings.get("showSyndicatedAuthor", False)
    is_syndicated = post.get("syndication_in", False)

    if is_syndicated and show_syndicated_author:
        syndicated_creator = first_post_item.get("syndicated_creator", {})
        return Author(syndicated_creator.get("display_name"))

    original_creator = post.get("original_creator")
    if original_creator:
        author_name_format = theme_settings.get("authorNameFormat", "display_name")
        return Author(original_creator.get(author_name_format))

    publisher = first_post_item.get("publisher")
    if publisher:
        return Author(publisher.get("display_name"))

    return None


def generate_schema_for(blog, posts, theme_settings={}):
    """
    Generates a JSON-LD schema for a blog and its posts.

    Uses the blog data, post data, and theme settings to create a JSON-LD schema for the blog and its posts.
    Creates a LiveBlogPosting object for the blog and adds BlogPosting objects for each post.
    Sets the main entity of the page, image, and live blog updates of the LiveBlogPosting object.

    Args:
    -----
    blog : dict
        Information about the main blog. It should include keys such as:
        - title: Title of the blog.
        - description: Brief description or summary of the blog.
        - start_date: Publication date of the blog.
        - picture_renditions: Dictionary of image renditions. Particularly 'baseImage' is the main image for the blog.

    posts : list
        List of individual posts or updates related to the main blog.

    theme_settings : dict, optional
        Settings or configurations related to the blog's theme or appearance. Default is an empty dictionary.

    Returns:
    -------
    str
        JSON-LD formatted string representing the schema for the blog. Returns an empty string if there are no posts.
    """

    if not posts:
        return ""

    tz_offset = get_configured_timezone_offset(blog)
    start_date = convert_to_configured_timezone(blog.get("start_date"), tz_offset)
    modified_date = convert_to_configured_timezone(get_modified_date(blog), tz_offset)
    end_date = convert_to_configured_timezone(blog.get("end_date", None), tz_offset)

    liveblogposting = LiveBlogPosting(
        headline=blog["title"],
        description=blog["description"],
        date_published=start_date,
        date_modified=modified_date,
        coverage_start_time=start_date,
        coverage_end_time=end_date,
    )

    blog_image = blog.get("picture_renditions", {})
    main_image = blog_image.get("baseImage")

    if main_image:
        liveblogposting.image = ImageObject.from_rendition_image(main_image)

    liveblogposting.main_entity_of_page = MainEntityOfPage(
        url=blog.get("main_page_url", "")
    )

    blog_author = blog.get("blog_author", "")
    if blog_author:
        liveblogposting.author = Author(blog_author)

    liveblogposting.live_blog_update = []
    for post in posts:
        blog_update = generate_blogupdate(blog, post, theme_settings)
        if not blog_update:
            continue
        liveblogposting.live_blog_update.append(blog_update)

    result = LiveBlogPostingSchema().dump(liveblogposting)
    return json.dumps(result, indent=4)


def generate_liveblog_posting_schema(
    blog, posts, output=None, theme_settings={}
) -> str:
    """
    Generates a JSON-LD schema for a blog and its posts.
    """

    # if output is provided, let's override the blog's main page url
    # as the output channel would probably be embedded in a different website
    if output and output.get("main_page_url", None):
        blog["main_page_url"] = output["main_page_url"]

    try:
        return generate_schema_for(blog, posts, theme_settings)
    except Exception as e:
        logger.error("Error generating schema for blog %s: %s" % (blog["_id"], e))
        return ""
