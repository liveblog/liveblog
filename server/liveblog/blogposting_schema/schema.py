
from marshmallow import Schema, fields


class MainEntityOfPageSchema(Schema):
    _type = fields.Str(dump_default="WebPage", data_key="@type")

    # third party website url (where the blog is embedded)
    url = fields.Str(data_key="@id")

    class Meta:
        ordered = True


class AuthorSchema(Schema):
    _type = fields.Str(dump_default="Person", data_key="@type")
    name = fields.Str()

    class Meta:
        ordered = True


class ImageObjectSchema(Schema):
    _type = fields.Str(dump_default="ImageObject", data_key="@type")
    url = fields.Str()
    width = fields.Int()
    height = fields.Int()

    class Meta:
        ordered = True


class BlogPostingSchema(Schema):
    _type = fields.Str(dump_default="BlogPosting", data_key="@type")

    # TODO: skip until we figure out how to handle the URL of the post
    # url = fields.Str()

    # TODO: figure out how to handle the headline
    # headline = fields.Str()

    date_published = fields.DateTime(data_key="datePublished")
    data_modified = fields.DateTime(data_key="dateModified")
    article_body = fields.Str(data_key="articleBody")
    author = fields.Nested(AuthorSchema)
    image = fields.Nested(ImageObjectSchema)

    class Meta:
        ordered = True


class LiveBlogPostingSchema(Schema):
    context = fields.Str(dump_default="http://schema.org", data_key="@context")
    _type = fields.Str(dump_default="LiveBlogPosting", data_key="@type")

    main_entity_of_page = fields.Nested(MainEntityOfPageSchema, data_key="mainEntityOfPage")

    # using blog title for now but we should collect headline
    headline = fields.Str()

    # blog description
    description = fields.Str()

    # we can use blog creation datetime and last updated post datetime
    date_published = fields.DateTime(data_key="datePublished")
    data_modified = fields.DateTime(data_key="dateModified")

    # TODO: we need to collect these 3 below
    coverage_start_time = fields.DateTime(data_key="coverageStartTime")
    coverage_end_time = fields.DateTime(data_key="coverageEndTime")
    url = fields.Str()

    image = fields.Nested(ImageObjectSchema)
    author = fields.Nested(AuthorSchema)
    live_blog_update = fields.Nested(BlogPostingSchema, many=True, data_key="liveBlogUpdate")

    # TODO: consider later if we should include about section.
    # it requires some additional information we don't collect at the moment
    # about = fields.Nested(AboutSchema)

    class Meta:
        ordered = True