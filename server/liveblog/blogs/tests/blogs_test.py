import liveblog.blogs as blog_app
import liveblog.advertisements as advert_app
import liveblog.client_modules as client_modules

from unittest.mock import MagicMock
from superdesk.tests import TestCase
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from liveblog.instance_settings.features_service import FeaturesService


def db_service_mock():
    """Mock database service with a method to simulate database config retrieval."""
    db_service = MagicMock()
    db_service.get_existing_config = MagicMock()
    return db_service


class BlogsTestCase(TestCase):
    def setUp(self):
        self.app.features = FeaturesService(self.app, db_service_mock())

        blog_app.init_app(self.app)
        advert_app.init_app(self.app)
        client_modules.init_app(self.app)

        self.blog_with_output = {
            "title": "Test blog",
            "description": "",
            "members": [],
            "posts_order_sequence": 0.0,
            "blog_status": "open",
            "syndication_enabled": False,
            "market_enabled": False,
            "category": "",
            "total_posts": 0,
            "original_creator": "5b1a6935fd16ad1ce83822da",
            "blog_preferences": {"language": "en", "theme": "default"},
            "theme_settings": {
                "outputChannel": True,
                "outputChannelName": "Test channel",
                "outputChannelTheme": "amp",
            },
            "_etag": "853b12bef642b42b67f8e2273b19f4cba5c88ac3",
            "_id": "5b35df76fd16ad23840abb70",
            "_links": {
                "self": {"title": "Blog", "href": "blogs/5b35df76fd16ad23840abb70"}
            },
            "_status": "OK",
        }

        self.blog_without_output = {
            "title": "Test blog",
            "description": "",
            "members": [],
            "posts_order_sequence": 0.0,
            "blog_status": "open",
            "syndication_enabled": False,
            "market_enabled": False,
            "category": "",
            "total_posts": 0,
            "original_creator": "5b1a6935fd16ad1ce83822da",
            "blog_preferences": {"language": "en", "theme": "default"},
            "theme_settings": {
                "outputChannel": False,
                "outputChannelName": "Test channel",
                "outputChannelTheme": "amp",
            },
            "_etag": "853b12bef642b42b67f8e2273b19f4cba5c88ac3",
            "_id": "5b35df76fd16ad23840abb70",
            "_links": {
                "self": {"title": "Blog", "href": "blogs/5b35df76fd16ad23840abb70"}
            },
            "_status": "OK",
        }

    def test_if_not_check_max_active(self):
        self.app.features.current_sub_level = MagicMock(return_value="network")
        increment = 0
        self.assertEqual(
            get_resource_service("blogs")._check_max_active(increment), None
        )

    def test_if_check_max_active(self):
        plan = "basic"
        self.app.features._settings = {plan: {"limits": {"blogs": 5}}}
        self.app.features.current_sub_level = MagicMock(return_value=plan)

        with self.assertRaises(SuperdeskApiError):
            get_resource_service("blogs")._check_max_active(10)

    def test_auto_create_output(self):
        self.app.features.current_sub_level = MagicMock(return_value="network")
        get_resource_service("blogs")._auto_create_output(self.blog_with_output)
        self.assertIsNotNone(
            get_resource_service("outputs").find(
                {"blog": self.blog_with_output["_id"]}
            )[0]
        )

    def test_not_auto_create_output(self):
        self.app.features.current_sub_level = MagicMock(return_value="network")
        get_resource_service("blogs")._auto_create_output(self.blog_without_output)
        with self.assertRaises(IndexError):
            get_resource_service("outputs").find(
                {"blog": self.blog_without_output["_id"]}
            )[0]
