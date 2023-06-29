import json
import datetime

from liveblog.posts.utils import get_main_item, get_first_item_of_type, get_related_items

from .schema import LiveBlogPostingSchema
from .models import BlogPosting, ImageObject, LiveBlogPosting, MainEntityOfPage, Author


def get_modified_date(blog):
    last_updated_post = blog.get('last_updated_post')
    if last_updated_post:
        return last_updated_post.get('_updated')
    return blog['start_date']


def get_base_image(item):
    meta = item.get('meta', {})
    media = meta.get('media', {})

    if media:
        return media.get('renditions', {}).get('baseImage')

def generate_blogupdate(post, theme_settings):
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
    if not posts:
        return ""

    liveblogposting = LiveBlogPosting(
        headline=blog['title'],
        description=blog['description'],
        date_published=blog['start_date'],
        date_podified=get_modified_date(blog),

        coverage_start_time=datetime.datetime.now(),
        coverage_end_time=datetime.datetime.now()
    )

    blog_image = blog.get('picture_renditions', {})
    main_image = blog_image.get('baseImage')

    if main_image:
        liveblogposting.image = ImageObject.from_rendition_image(main_image)

    liveblogposting.main_entity_of_page = MainEntityOfPage(url="https://example.com/blog/to-be-collected.html")
    liveblogposting.live_blog_update = []

    # maybe it's the organization name
    author = Author("John Doe")

    for post in posts:
        blog_update = generate_blogupdate(post, theme_settings)
        if not blog_update:
            continue
        liveblogposting.live_blog_update.append(blog_update)

    result = LiveBlogPostingSchema().dump(liveblogposting)
    return json.dumps(result, indent=4)