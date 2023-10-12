from marshmallow import Schema, fields


class MainEntityOfPageSchema(Schema):
    """
    This class represents a MainEntityOfPage schema.

    For more information, see https://schema.org/WebPage

    **Fields:**

    * `@type`: The type of this schema. Defaults to `WebPage`.
    * `@id`: The URL of the third party website where the blog is embedded.
    """

    _type = fields.Str(dump_default="WebPage", data_key="@type")

    # third party website url (where the blog is embedded)
    url = fields.Str(data_key="@id")

    class Meta:
        ordered = True


class AuthorSchema(Schema):
    """
    This class represents a Person schema.

    For more information, see https://schema.org/Person

    **Fields:**

    * `@type`: The type of this schema. Defaults to `Person`.
    * `name`: The name of the person.
    """

    _type = fields.Str(dump_default="Person", data_key="@type")
    name = fields.Str()

    class Meta:
        ordered = True


class ImageObjectSchema(Schema):
    """
    This class represents an ImageObject schema.

    For more information, see https://schema.org/ImageObject

    **Fields:**

    * `@type`: The type of this schema. Defaults to `ImageObject`.
    * `url`: The URL of the image.
    * `width`: The width of the image.
    * `height`: The height of the image.
    """

    _type = fields.Str(dump_default="ImageObject", data_key="@type")
    url = fields.Str()
    width = fields.Int()
    height = fields.Int()

    class Meta:
        ordered = True


class BlogPostingSchema(Schema):
    """
    This class represents a BlogPosting schema.

    For more information, see https://schema.org/BlogPosting

    **Fields:**

    * `_type`: The type of this schema. Defaults to `BlogPosting`.
    * `datePublished`: The date the blog posting was published.
    * `dateModified`: The date the blog posting was last modified.
    * `articleBody`: The full text of the blog posting.
    * `author`: The author of the blog posting.
    * `image`: An image of the blog posting.

    **TODO:**

    * Figure out how to handle the URL of the post.
    * Figure out how to handle the headline.
    """

    _type = fields.Str(dump_default="BlogPosting", data_key="@type")

    # TODO: figure out how to handle the headline
    # headline = fields.Str()

    date_published = fields.DateTime(data_key="datePublished")
    data_modified = fields.DateTime(data_key="dateModified")
    article_body = fields.Str(data_key="articleBody")
    author = fields.Nested(AuthorSchema)
    image = fields.Nested(ImageObjectSchema)
    url = fields.Str()

    class Meta:
        ordered = True


class LiveBlogPostingSchema(Schema):
    """
    This class represents a LiveBlogPosting schema.

    For more information, see https://schema.org/LiveBlogPosting

    **Fields:**

    * `context`: The context URL for this schema. Defaults to `http://schema.org`.
    * `_type`: The type of this schema. Defaults to `LiveBlogPosting`.
    * `main_entity_of_page`: The main entity of the page. This is typically the topic of the live blog.
    * `headline`: The headline of the live blog posting.
    * `description`: The description of the live blog posting.
    * `date_published`: The date the live blog posting was published.
    * `date_modified`: The date the live blog posting was last modified.
    * `coverage_start_time`: The start time of the live blog coverage.
    * `coverage_end_time`: The end time of the live blog coverage.
    * `url`: The URL of the live blog posting.
    * `image`: An image of the live blog posting.
    * `author`: The author of the live blog posting.
    * `live_blog_update`: A list of live blog updates. Each update should be a separate BlogPosting schema.
    * `about`: The about section of the live blog posting.
        This is optional and requires additional information that may not be available at the time of writing.
    """

    context = fields.Str(dump_default="http://schema.org", data_key="@context")
    _type = fields.Str(dump_default="LiveBlogPosting", data_key="@type")

    main_entity_of_page = fields.Nested(
        MainEntityOfPageSchema, data_key="mainEntityOfPage"
    )

    # using blog title for now but we should collect headline
    headline = fields.Str()

    # blog description
    description = fields.Str()

    # we can use blog creation datetime and last updated post datetime
    date_published = fields.DateTime(data_key="datePublished")
    data_modified = fields.DateTime(data_key="dateModified")

    coverage_start_time = fields.DateTime(data_key="coverageStartTime")
    coverage_end_time = fields.DateTime(data_key="coverageEndTime")
    url = fields.Str()

    image = fields.Nested(ImageObjectSchema)
    author = fields.Nested(AuthorSchema)
    live_blog_update = fields.Nested(
        BlogPostingSchema, many=True, data_key="liveBlogUpdate"
    )

    # TODO: consider later if we should include about section.
    # it requires some additional information we don't collect at the moment
    # about = fields.Nested(AboutSchema)

    class Meta:
        ordered = True
