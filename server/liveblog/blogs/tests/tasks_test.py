from superdesk.tests import TestCase
from unittest.mock import patch, MagicMock
from liveblog.blogs.tasks import (
    publish_blog_embeds_on_s3,
    publish_blog_embed_on_s3,
    internal_publish_blog_embed_on_s3,
)


class TestPublishBlogEmbedsOnS3(TestCase):

    @patch("liveblog.blogs.tasks.publish_blog_embed_on_s3")
    @patch("liveblog.blogs.tasks.get_blog")
    @patch("liveblog.blogs.tasks.get_resource_service")
    def test_publish_blog_embeds_on_s3(
        self, mock_get_resource_service, mock_get_blog, mock_publish_blog_embed_on_s3
    ):
        blog_id = "123"
        blog = {"_id": blog_id}
        mock_get_blog.return_value = (blog_id, blog)

        mock_publish_blog_embed_on_s3.side_effect = lambda *args, **kwargs: (
            "public_url",
            ["public_url_1", "public_url_2"],
        )

        mock_outputs_service = MagicMock()
        mock_outputs_service.find.return_value.limit.return_value.skip.return_value.count.return_value = (
            0
        )

        mock_blogs_service = MagicMock()

        def mock_get_resource_service_side_effect(service_name):
            if service_name == "outputs":
                return mock_outputs_service
            elif service_name == "client_blogs":
                return mock_blogs_service
            else:
                return MagicMock()

        mock_get_resource_service.side_effect = mock_get_resource_service_side_effect

        publish_blog_embeds_on_s3(blog_id)

        mock_get_blog.assert_called_once_with(blog_id)
        mock_publish_blog_embed_on_s3.assert_called_once_with(
            blog_id, safe=True, save=False
        )
        mock_outputs_service.find.assert_called_once_with({"blog": blog_id})
        mock_blogs_service.system_update.assert_called_once_with(
            blog_id,
            {
                "public_url": "public_url",
                "public_urls": ["public_url_1", "public_url_2"],
            },
            blog,
        )

    @patch("liveblog.blogs.tasks.internal_publish_blog_embed_on_s3")
    @patch("liveblog.blogs.tasks.get_blog")
    @patch("liveblog.blogs.tasks.logger")
    def test_publish_blog_embed_on_s3(
        self, mock_logger, mock_get_blog, mock_internal_publish_blog_embed_on_s3
    ):
        blog_id = "123"
        blog = {"_id": blog_id}
        mock_get_blog.return_value = (blog_id, blog)

        mock_internal_publish_blog_embed_on_s3.return_value = "some_result"

        result = publish_blog_embed_on_s3(blog_id)

        mock_get_blog.assert_called_once_with(blog_id)
        mock_logger.info.assert_any_call(
            f'publish_blog_on_s3 for blog "{blog_id}" started.'
        )
        mock_internal_publish_blog_embed_on_s3.assert_called_once_with(
            blog, None, True, True
        )
        mock_logger.info.assert_any_call(
            f'publish_blog_on_s3 for blog "{blog_id}" finished.'
        )
        self.assertEqual(result, "some_result")

    @patch("liveblog.blogs.tasks.push_notification")
    @patch("liveblog.blogs.tasks.get_theme_for_publish")
    @patch("liveblog.blogs.tasks.publish_embed")
    @patch("liveblog.blogs.tasks.get_resource_service")
    @patch("liveblog.blogs.tasks.app")
    @patch("liveblog.blogs.tasks.build_blog_public_url")
    @patch("liveblog.blogs.tasks.logger")
    def test_internal_publish_blog_embed_on_s3(
        self,
        mock_logger,
        mock_build_blog_public_url,
        mock_app,
        mock_get_resource_service,
        mock_publish_embed,
        mock_get_theme_for_publish,
        mock_push_notification,
    ):
        blog = {"_id": "123"}
        theme = "default_theme"
        public_url = "http://example.com/public_url"
        output = None

        mock_get_theme_for_publish.return_value = theme
        mock_app.config = {"SERVER_NAME": "example.com"}
        mock_publish_embed.return_value = public_url

        mock_blogs_service = MagicMock()
        mock_get_resource_service.return_value = mock_blogs_service

        result = internal_publish_blog_embed_on_s3(blog, output)

        mock_get_theme_for_publish.assert_called_once_with(blog, output)
        mock_publish_embed.assert_called_once_with(
            "123", theme, output, api_host="//example.com/"
        )
        mock_push_notification.assert_called_once_with(
            "blog",
            published=1,
            blog_id="123",
            public_urls={"output": {}, "theme": {theme: public_url}},
            public_url=public_url,
        )
        mock_blogs_service.system_update.assert_called_once_with(
            "123",
            {
                "public_urls": {"output": {}, "theme": {theme: public_url}},
                "public_url": public_url,
            },
            blog,
        )
        self.assertEqual(
            result, (public_url, {"output": {}, "theme": {theme: public_url}})
        )
