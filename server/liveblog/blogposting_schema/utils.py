import json
from liveblog.posts.utils import get_main_item, get_first_item_of_type, get_related_items
from .schema import LiveBlogPostingSchema
from .models import BlogPosting, ImageObject, LiveBlogPosting, MainEntityOfPage, Author


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
    last_updated_post = blog.get('last_updated_post')
    if last_updated_post:
        return last_updated_post.get('_updated')
    return blog['start_date']


def get_base_image(item):
    """
    Get the base image from the given item's metadata.

    Args:
        item (dict): The item to extract the base image from.

    Returns:
        str: The URL of the base image, or None if not found.
    """
    meta = item.get('meta', {})
    media = meta.get('media', {})

    if media:
        return media.get('renditions', {}).get('baseImage')


def generate_blogupdate(post, theme_settings):
    """
    Generates a BlogPosting object from a blog post.

    Uses the post data and theme settings to create a BlogPosting object with the relevant data.
    Sets the article body and image of the BlogPosting object based on the related items in the post data.

    Args:
        post (dict): A dictionary representing the blog post.
        theme_settings (dict): A dictionary representing the theme settings.

    Returns:
        BlogPosting: A BlogPosting object representing the blog post.
    """

    main_post_item = get_main_item(post)
    if not main_post_item:
        return None

    author = get_post_author(post, main_post_item, theme_settings)
    blog_posting = BlogPosting.from_blog_post(post, author)

    # we need to preferably set the article body and and image
    # so we're gonna get the first item of type image and text
    items = get_related_items(post)

    text_item = get_first_item_of_type(items, 'text')
    if text_item:
        blog_posting.article_body = text_item.get('text')

    image_item = get_first_item_of_type(items, 'image')
    if image_item:
        main_image = get_base_image(image_item)
        image = ImageObject.from_rendition_image(main_image)
        blog_posting.set_image(image)

    return blog_posting


def get_post_author(post, main_post_item, theme_settings):
    """
    Returns the author of a blog post.

    Determines the author of a blog post based on the post data and theme settings.
    If the post is syndicated and the theme settings allow it, returns the syndicated author.
    Otherwise, returns the original creator of the post or the publisher of the main post item.

    Args:
        post (dict): A dictionary representing the blog post.
        main_post_item (dict): A dictionary representing the main post item.
        theme_settings (dict): A dictionary representing the theme settings.

    Returns:
        Author or None: An Author object representing the author of the blog post, or None if no author is found.
    """
    show_syndicated_author = theme_settings.get('showSyndicatedAuthor', False)
    is_syndicated = post.get('syndication_in', False)

    if is_syndicated and show_syndicated_author:
        syndicated_creator = main_post_item.get('syndicated_creator', {})
        return Author(syndicated_creator.get('display_name'))

    original_creator = post.get('original_creator')
    if original_creator:
        author_name_format = theme_settings.get('authorNameFormat', 'display_name')
        return Author(original_creator.get(author_name_format))

    publisher = main_post_item.get('publisher')
    if publisher:
        return Author(publisher.get('display_name'))

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

    liveblogposting = LiveBlogPosting(
        headline=blog['title'],
        description=blog['description'],
        date_published=blog['start_date'],
        date_modified=get_modified_date(blog),

        coverage_start_time=blog['start_date'],
        coverage_end_time=blog.get('end_date', None)
    )

    blog_image = blog.get('picture_renditions', {})
    main_image = blog_image.get('baseImage')

    if main_image:
        liveblogposting.image = ImageObject.from_rendition_image(main_image)

    liveblogposting.main_entity_of_page = MainEntityOfPage(
        url=blog.get('main_page_url', ''))

    blog_author = blog.get('blog_author', '')
    if blog_author:
        liveblogposting.author = Author(blog_author)

    liveblogposting.live_blog_update = []
    for post in posts:
        blog_update = generate_blogupdate(post, theme_settings)
        if not blog_update:
            continue
        liveblogposting.live_blog_update.append(blog_update)

    result = LiveBlogPostingSchema().dump(liveblogposting)
    return json.dumps(result, indent=4)
