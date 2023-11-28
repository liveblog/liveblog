from datetime import datetime
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class MainEntityOfPage:
    url: str


@dataclass
class Author:
    name: str


@dataclass
class ImageObject:
    url: str
    width: int
    height: int

    @staticmethod
    def from_rendition_image(image):
        return ImageObject(image.get("href"), image.get("width"), image.get("height"))


@dataclass
class BlogPosting:
    post_id: str
    date_published: datetime
    date_modified: datetime
    author: Author
    article_body: Optional[str] = ""

    def set_image(self, image):
        if image:
            self.image = image

    def set_post_url(self, theme_settings, blog):
        delimiter = theme_settings.get("permalinkDelimiter", "?")
        sort_order = theme_settings.get("postOrder")

        main_page_url = blog.get("main_page_url")
        if main_page_url:
            self.url = (
                f"{main_page_url}{delimiter}liveblog._id={self.post_id}__{sort_order}"
            )

    @staticmethod
    def from_blog_post(post, author):
        return BlogPosting(
            post_id=post.get("_id"),
            date_published=post.get("published_date"),
            date_modified=post.get("content_updated_date"),
            author=author,
        )


@dataclass
class LiveBlogPosting:
    headline: str
    description: str
    date_published: datetime
    date_modified: datetime

    coverage_start_time: datetime
    coverage_end_time: datetime

    author: Optional[Author] = None
    main_entity_of_page: Optional[MainEntityOfPage] = None
    live_blog_update: Optional[List] = None
