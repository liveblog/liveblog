from unittest.mock import MagicMock
from superdesk import get_resource_service

import liveblog.themes as themeapp
import liveblog.blogs as blogapp
import liveblog.tenants as tenants_app
import liveblog.theme_settings as theme_settings_app
import liveblog.liveblog_users as liveblog_users_app
import liveblog.core as global_preferences
import liveblog.blogs.embeds as embeds
import liveblog.client_modules as client_modules_app

from liveblog.tests.tenant_test_case import TenantAwareTestCase

from liveblog.blogs.embeds import embed_blueprint
from liveblog.instance_settings.features_service import FeaturesService

from .mock_settings.default_seo_theme import default_seo_theme
from .mock_settings.classic_theme import classic_theme
from .mock_settings.amp_theme import amp_theme


class Foo:
    def __init__(self):
        self.setup_call = False

    def setup_called(self):
        self.setup_call = True
        return self.setup_call


foo = Foo()


def db_service_mock():
    """Mock database service with a method to simulate database config retrieval."""
    db_service = MagicMock()
    db_service.get_existing_config = MagicMock()
    return db_service


def service(app, db_service):
    """Instance of the FeaturesService with mocked dependencies."""
    return FeaturesService(app, db_service)


class ThemesTestCase(TenantAwareTestCase):
    def setUp(self):
        super().setUp()

        if not foo.setup_call:
            # update configuration
            test_config = {
                "LIVEBLOG_DEBUG": True,
                "EMBED_PROTOCOL": "http://",
                "CORS_ENABLED": False,
                "DEBUG": False,
            }
            self.app.config.update(test_config)
            foo.setup_called()
            tenants_app.init_app(self.app)
            liveblog_users_app.init_app(self.app)
            themeapp.init_app(self.app)
            theme_settings_app.init_app(self.app)
            blogapp.init_app(self.app)
            global_preferences.init_app(self.app)
            client_modules_app.init_app(self.app)
            self.app.register_blueprint(embed_blueprint)
            self.client = self.app.test_client()

            self.app.features = FeaturesService(self.app, db_service_mock())

        # Set up tenant and user for multi-tenancy
        self.setup_tenant_and_user()

        self.themeservice = get_resource_service("themes")

        self.angular_theme = {
            "name": "angular",
            "abstract": True,
            "version": "3.3.4",
            "options": [
                {
                    "name": "postsPerPage",
                    "label": "Number of posts per page",
                    "type": "number",
                    "default": 10,
                    "help": "Set the number of posts you want to see at the initialization",
                },
                {
                    "name": "postOrder",
                    "label": "Default posts order of the timeline",
                    "type": "select",
                    "options": [
                        {"value": "editorial", "label": "Editorial"},
                        {"value": "newest_first", "label": "Newest first"},
                        {"value": "oldest_first", "label": "Oldest first"},
                    ],
                    "default": "editorial",
                },
                {
                    "name": "permalinkDelimiter",
                    "label": "Permalink Delimiter",
                    "type": "select",
                    "options": [
                        {"value": "?", "label": "Query delimiter (?)"},
                        {"value": "#", "label": " Fragment identifier delimiter (#)"},
                    ],
                    "default": "?",
                    "help": "Sets the delimiter used to send the permalink. \
                    ex: permalinkHashMark=?, http://example.com/?...",
                },
                {
                    "name": "datetimeFormat",
                    "label": "Date time Format",
                    "type": "datetimeformat",
                    "default": "lll",
                    "help": "Sets the date time format to be used in the embed.\ Please \
                    enter a custom format in valid moment.js format http://momentjs.com/docs/#/parsing/string-format",
                },
                {
                    "name": "datetimeFormattest",
                    "label": "Date time Format test",
                    "type": "datetimeFormattest",
                    "default": "lll",
                    "help": "Test",
                },
            ],
        }

        self.classic_theme = classic_theme.copy()
        self.default_theme = default_seo_theme.copy()
        self.amp_theme = amp_theme.copy()

        # Create themes
        self.themeservice.save_or_update_theme(self.angular_theme)
        self.themeservice.save_or_update_theme(self.classic_theme)
        self.themeservice.save_or_update_theme(self.default_theme)
        self.themeservice.save_or_update_theme(self.amp_theme)

        self.blogs_list = [
            {
                "_created": "2018-03-27T12:04:58+00:00",
                "_etag": "b962afec2413ddf43fcf0273a1a422a2fec1e34d",
                "_id": "5aba336a4d003d61e663eeeb",
                "_links": {
                    "self": {"href": "blogs/5aba336a4d003d61e663eeeb", "title": "Blog"}
                },
                "_type": "blogs",
                "_updated": "2018-04-03T05:54:32+00:00",
                "tenant_id": self.tenant_id,
                "blog_preferences": {"language": "en", "theme": "classic"},
                "blog_status": "open",
                "category": "",
                "description": "title: end to end Five",
                "firstcreated": "2018-03-27T12:04:58+00:00",
                "last_created_post": {
                    "_id": "urn:newsml:localhost:2018-04-03T11:24:32.101496:a50ef9ff-6f85-4d9c-8d29-b8d294d46b85",
                    "_updated": "2018-04-03T05:54:32+00:00",
                },
                "last_updated_post": {
                    "_id": "urn:newsml:localhost:2018-04-03T11:12:52.153339:7eb09046-fa61-4a00-9007-1596ad484a1d",
                    "_updated": "2018-04-03T05:43:12+00:00",
                },
                "market_enabled": False,
                "members": [],
                "original_creator": "5a9f82dc4d003d1469bbc22d",
                "picture": "urn:newsml:localhost:2018-03-27T17:34:58.093848:973b4459-5511-45fc-9bfe-4855159ea917",
                "picture_renditions": {
                    "baseImage": {
                        "height": 1075,
                        "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c13/raw?_schema=http",
                        "media": "5aba336a4d003d44ee714c13",
                        "mimetype": "image/jpeg",
                        "width": 1920,
                    },
                    "original": {
                        "height": 168,
                        "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c0d/raw?_schema=http",
                        "media": "5aba336a4d003d44ee714c0d",
                        "mimetype": "image/jpeg",
                        "width": 300,
                    },
                    "thumbnail": {
                        "height": 268,
                        "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c11/raw?_schema=http",
                        "media": "5aba336a4d003d44ee714c11",
                        "mimetype": "image/jpeg",
                        "width": 480,
                    },
                    "viewImage": {
                        "height": 716,
                        "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c0f/raw?_schema=http",
                        "media": "5aba336a4d003d44ee714c0f",
                        "mimetype": "image/jpeg",
                        "width": 1280,
                    },
                },
                "picture_url": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c0f/raw?_schema=http",
                "posts_order_sequence": 3,
                "public_url": "http://localhost:5000/embed/5aba336a4d003d61e663eeeb/",
                "public_urls": {"output": {}, "theme": {}},
                "start_date": "2018-03-27T12:04:58+00:00",
                "syndication_enabled": "False",
                "theme_settings": {
                    "authorNameFormat": "display_name",
                    "authorNameLinksToEmail": False,
                    "blockSearchEngines": False,
                    "canComment": False,
                    "datetimeFormat": "lll",
                    "hasHighlights": False,
                    "infinitScroll": True,
                    "language": "en",
                    "livestream": False,
                    "livestreamAutoplay": False,
                    "loadNewPostsManually": True,
                    "permalinkDelimiter": "?",
                    "postOrder": "editorial",
                    "postsPerPage": 20,
                    "showAuthor": True,
                    "showAuthorAvatar": True,
                    "showDescription": True,
                    "showGallery": False,
                    "showImage": True,
                    "showSocialShare": True,
                    "showSyndicatedAuthor": False,
                    "showTitle": True,
                },
                "title": "title: end to end Five",
                "total_posts": 3,
                "versioncreated": "2018-03-27T12:04:58+00:00",
            },
            {
                "_created": "2018-03-30T10:24:33+00:00",
                "_etag": "8f96666a3d97401979a79bda82886dd12cc6f272",
                "_id": "5abe10614d003d5f22ce005e",
                "_links": {
                    "collection": {"href": "client_blogs", "title": "client_blogs"},
                    "parent": {"href": "/", "title": "home"},
                    "self": {
                        "href": "client_blogs/5abe10614d003d5f22ce005e",
                        "title": "Client_blog",
                    },
                },
                "_updated": "2018-04-05T09:59:24+00:00",
                "tenant_id": self.tenant_id,
                "blog_preferences": {"language": "en", "theme": "default"},
                "blog_status": "open",
                "category": "",
                "description": "title: end to end Seven",
                "last_created_post": {
                    "_id": "urn:newsml:localhost:2018-03-30T17:33:03.199625:540fb5c8-6119-4927-8b55-9c47bbb9f942",
                    "_updated": "2018-03-30T12:03:03+00:00",
                },
                "last_updated_post": {
                    "_id": "urn:newsml:localhost:2018-03-30T17:33:03.199625:540fb5c8-6119-4927-8b55-9c47bbb9f942",
                    "_updated": "2018-04-03T05:37:16+00:00",
                },
                "market_enabled": False,
                "members": [],
                "original_creator": "5a9f82dc4d003d1469bbc22d",
                "picture": "urn:newsml:localhost:2018-03-30T15:54:33.260459:e093556c-a237-481b-b90d-c4570e0d8476",
                "picture_renditions": {
                    "baseImage": {
                        "height": 1080,
                        "href": "http://localhost:5000/api/upload/5abe10614d003d5f1cf9dc03/raw?_schema=http",
                        "media": "5abe10614d003d5f1cf9dc03",
                        "mimetype": "image/jpeg",
                        "width": 1717,
                    },
                    "original": {
                        "height": 178,
                        "href": "http://localhost:5000/api/upload/5abe10614d003d5f1cf9dbff/raw?_schema=http",
                        "media": "5abe10614d003d5f1cf9dbff",
                        "mimetype": "image/jpeg",
                        "width": 283,
                    },
                    "thumbnail": {
                        "height": 301,
                        "href": "http://localhost:5000/api/upload/5abe10614d003d5f1cf9dc05/raw?_schema=http",
                        "media": "5abe10614d003d5f1cf9dc05",
                        "mimetype": "image/jpeg",
                        "width": 480,
                    },
                    "viewImage": {
                        "height": 720,
                        "href": "http://localhost:5000/api/upload/5abe10614d003d5f1cf9dc01/raw?_schema=http",
                        "media": "5abe10614d003d5f1cf9dc01",
                        "mimetype": "image/jpeg",
                        "width": 1144,
                    },
                },
                "picture_url": "http://localhost:5000/api/upload/5abe10614d003d5f1cf9dc01/raw?_schema=http",
                "posts_order_sequence": 6,
                "public_url": "http://localhost:5000/embed/5abe10614d003d5f22ce005e/",
                "public_urls": {"output": {}, "theme": {}},
                "start_date": "2018-03-30T10:24:33+00:00",
                "syndication_enabled": False,
                "theme_settings": {
                    "authorNameFormat": "display_name",
                    "authorNameLinksToEmail": False,
                    "autoApplyUpdates": True,
                    "blockSearchEngines": True,
                    "canComment": False,
                    "clientDatetimeOnly": False,
                    "datetimeFormat": "lll",
                    "gaCode": "",
                    "hasHighlights": False,
                    "infinitScroll": True,
                    "language": "en",
                    "livestream": False,
                    "livestreamAutoplay": False,
                    "loadNewPostsManually": True,
                    "permalinkDelimiter": "?",
                    "postOrder": "editorial",
                    "postsPerPage": 10,
                    "removeStylesESI": False,
                    "renderForESI": False,
                    "showAuthor": True,
                    "showAuthorAvatar": True,
                    "showDescription": False,
                    "showGallery": False,
                    "showImage": False,
                    "showLiveblogLogo": True,
                    "showSocialShare": True,
                    "showSyndicatedAuthor": False,
                    "showTitle": False,
                    "showUpdateDatetime": False,
                    "stickyPosition": "bottom",
                    "enableGdprConsent": False,
                },
                "title": "title: end to end Seven",
                "total_posts": 6,
                "version_creator": "5a9f82dc4d003d1469bbc22d",
                "versioncreated": "2018-04-05T09:29:37+00:00",
            },
        ]

        self.blogs_service = get_resource_service("blogs")
        self.client_blog_service = get_resource_service("client_blogs")

        # Create blogs
        self.app.data.insert("blogs", self.blogs_list)

    def test_classic_theme(self):
        # Load the template in classic theme, template found
        template = embeds.collect_theme_assets(self.classic_theme)[1]
        self.assertIsNotNone(template, True)

    def test_angular_theme(self):
        # Load the template in angular theme, template not found
        template = embeds.collect_theme_assets(self.angular_theme)[1]
        self.assertIsNone(template, True)

    def test_default_theme(self):
        # Load the template in default theme, template found
        template = embeds.collect_theme_assets(self.default_theme)[1]
        self.assertIsNotNone(template, True)

    def test_amp_theme(self):
        # Load the template in amp theme, template found
        template = embeds.collect_theme_assets(self.amp_theme)[1]
        self.assertIsNotNone(template, True)

    def test_embed_gathering(self):
        # check blog exists
        client_blog = self.client_blog_service.find_one(
            req=None, _id="5aba336a4d003d61e663eeeb"
        )
        self.assertIsNotNone(client_blog, True)
        response = self.client.get("/embed/5aba336a4d003d61e663eeeb/")
        data = str(response.data)
        # response status 200
        self.assertEqual(response.status_code, 200)
        # response contains data
        self.assertIsNotNone(data, True)
        # blog id exists in response page
        test_blog_id = data.find('"_id": "5aba336a4d003d61e663eeeb"')
        self.assertNotEqual(test_blog_id, -1)
        # blog title
        blog_title = data.find('"title": "title: end to end Five"')
        self.assertNotEqual(blog_title, -1)
        # blog created date exists in response
        test_created = data.find('"_created": "2018-03-27T12:04:58+0000"')
        self.assertNotEqual(test_created, -1)
        # test blog_preferences
        blog_pref = data.find(
            '"blog_preferences": {"language": "en", "theme": "classic"}'
        )
        self.assertNotEqual(blog_pref, -1)
        # debug is true
        check_debug = data.find("debug: true")
        self.assertNotEqual(check_debug, -1)
        # test settings data in response
        author_name = data.find('"authorNameFormat": "display_name"')
        self.assertNotEqual(author_name, -1)
        post_order = data.find('"postOrder": "editorial"')
        self.assertNotEqual(post_order, -1)

    def test_is_seo(self):
        response = self.client.get("/embed/5abe10614d003d5f22ce005e/theme/default")
        data = str(response.data)
        # response status 200
        self.assertEqual(response.status_code, 200)
        # response contains data
        self.assertIsNotNone(data, True)
        # blog id exists in response page
        test_blog_id = data.find('"_id": "5abe10614d003d5f22ce005e"')
        self.assertNotEqual(test_blog_id, -1)
        # blog title
        blog_title = data.find('"title: end to end Seven"')
        self.assertNotEqual(blog_title, -1)
        # blog created date exists in response
        test_created = data.find('"_created": "2018-03-30T10:24:33+0000"')
        self.assertNotEqual(test_created, -1)
        # test blog_preferences
        blog_pref = data.find(
            '"blog_preferences": {"language": "en", "theme": "default"'
        )
        self.assertNotEqual(blog_pref, -1)
        # debug is true
        check_debug = data.find("debug: true")
        self.assertNotEqual(check_debug, -1)
        # assests_root
        assets_root = data.find("assets_root: \\'/themes_assets/default/\\'")
        self.assertNotEqual(assets_root, -1)

    def test_is_amp(self):
        response = self.client.get("/embed/5abe10614d003d5f22ce005e/theme/amp")
        data = str(response.data)
        self.assertEqual(response.status_code, 200)
        # response contains data
        self.assertIsNotNone(data, True)
        # blog title
        title = data.find("<title>title: end to end Seven</title>")
        self.assertNotEqual(title, -1)
        # Test: Add AMP compatible css
        amp_styles = data.find("<style amp-boilerplate>")
        self.assertNotEqual(amp_styles, -1)
        # test amp img
        amp_img = data.find(
            '<amp-img src="image.png"\\n  width="1"\\n  height="1"\\n  layout="fixed"\\n  alt="AMP"></amp-img>'
        )
        self.assertNotEqual(amp_img, -1)
        # amp live-list
        amp_live_list = data.find(
            '<amp-live-list\\n    layout="container"\\n    data-poll-interval="15000"\\n    '
            + 'data-max-items-per-page="110"\\n    id="amp-live-list-insert-blog"\\n    class="timeline-body">\\'
        )
        self.assertNotEqual(amp_live_list, -1)
