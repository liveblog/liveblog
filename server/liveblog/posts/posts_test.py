import flask

import liveblog.blogs as blogs
import liveblog.posts as posts
import superdesk.users as users_app
from superdesk.tests import TestCase
from superdesk import get_resource_service
from liveblog.posts.posts import get_publisher, private_draft_filter
from liveblog.posts.tasks import update_post_blog_data, update_post_blog_embed
import liveblog.client_modules as client_modules
import liveblog.themes as themes
import liveblog.advertisements as advertisements
from unittest.mock import patch
from superdesk.errors import SuperdeskApiError


class Foo():
    def __init__(self):
        self.setup_call = False

    def setup_called(self):
        self.setup_call = True
        return self.setup_call


foo = Foo()


class ClientModuleTestCase(TestCase):
    def setUp(self):
        if not foo.setup_call:
            test_config = {
                'LIVEBLOG_DEBUG': True,
                'EMBED_PROTOCOL': 'http://',
                'CORS_ENABLED': False,
                'DEBUG': False,
            }
            self.app.config.update(test_config)
            foo.setup_called()
            blogs.init_app(self.app)
            posts.init_app(self.app)
            client_modules.init_app(self.app)
            users_app.init_app(self.app)
            themes.init_app(self.app)
            advertisements.init_app(self.app)
            self.client = self.app.test_client()

        self.posts_service = get_resource_service('posts')

        self.user_list = [{
            '_id': '0',
            '_etag': 'hash',
            '_created': 'now',
            '_updated': 'nowish',
            'username': 'admin',
            'display_name': 'admin',
            'sign_off': 'off',
            'byline': 'by',
            'email': 'admin@example.com',
        }]
        self.user_ids = self.app.data.insert('users', self.user_list)

        self.private_draft_filter = {
            'bool':
                {'should': [
                    {'term': {'post_status': 'open'}},
                    {'term': {'post_status': 'submitted'}},
                    {'term': {'post_status': 'comment'}},
                    {'term': {'post_status': 'ad'}}
                ]}
        }
        self.blogs_list = [{
            "_id": "blog_one",
            "_created": "2018-03-27T12:04:58+00:00",
            "_etag": "b962afec2413ddf43fcf0273a1a422a2fec1e34d",
            "_type": "blogs",
            "_updated": "2018-04-03T05:54:32+00:00",
            "blog_preferences": {
                "language": "en",
                "theme": "classic"
            },
            "blog_status": "open",
            "category": "",
            "description": "title: end to end Five",
            "firstcreated": "2018-03-27T12:04:58+00:00",
            "last_created_post": {
                "_id": "urn:newsml:localhost:2018-04-03T11:12:43.187311:ad5e39b1-2fb2-4676-bd2f-425dca184765",
                "_updated": "2018-04-03T05:42:43+00:00"
            },
            "last_updated_post": {
                "_id": "urn:newsml:localhost:2018-04-03T11:12:43.187311:ad5e39b1-2fb2-4676-bd2f-425dca184765",
                "_updated": "2018-04-03T05:43:12+00:00"
            },
            "market_enabled": False,
            "members": [],
            "original_creator": self.user_list[0],
            "picture": "urn:newsml:localhost:2018-03-27T17:34:58.093848:973b4459-5511-45fc-9bfe-4855159ea917",
            "picture_renditions": {
                "baseImage": {
                    "height": 1075,
                    "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c13/raw?_schema=http",
                    "media": "5aba336a4d003d44ee714c13",
                    "mimetype": "image/jpeg",
                    "width": 1920
                },
                "original": {
                    "height": 168,
                    "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c0d/raw?_schema=http",
                    "media": "5aba336a4d003d44ee714c0d",
                    "mimetype": "image/jpeg",
                    "width": 300
                },
                "thumbnail": {
                    "height": 268,
                    "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c11/raw?_schema=http",
                    "media": "5aba336a4d003d44ee714c11",
                    "mimetype": "image/jpeg",
                    "width": 480
                },
                "viewImage": {
                    "height": 716,
                    "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c0f/raw?_schema=http",
                    "media": "5aba336a4d003d44ee714c0f",
                    "mimetype": "image/jpeg",
                    "width": 1280
                }
            },
            "picture_url": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c0f/raw?_schema=http",
            "posts_order_sequence": 1,
            "public_urls": {
                "output": {},
                "theme": {}
            },
            "start_date": "2018-03-27T12:04:58+00:00",
            "syndication_enabled": 'False',
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
                "showTitle": True
            },
            "title": "title: end to end Five",
            "total_posts": 3,
            "versioncreated": "2018-03-27T12:04:58+00:00"
        }]
        # Create blogs
        self.blogs_ids = self.app.data.insert('client_blogs', self.blogs_list)
        self.items = [{
            "_created": "2018-04-03T05:42:43+00:00",
            "_current_version": 1,
            "_id": "urn:newsml:localhost:2018-04-03T11:12:43.086751:9472f874-6fae-4050-be10-419845e33c06",
            "_etag": "e853a91469eab17a12ddb0ab5b6047b2f82f5faa",
            "_updated": "2018-04-03T05:42:43+00:00",
            "blog": self.blogs_ids[0],
            "event_id": "tag:localhost:2018:debb9d1f-f08c-490d-9191-d449b4fb4e5f",
            "family_id": "urn:newsml:localhost:2018-04-03T11:12:43.086751:9472f874-6fae-4050-be10-419845e33c06",
            "firstcreated": "2018-04-03T05:42:43+00:00",
            "flags": {
                "marked_archived_only": False,
                "marked_for_legal": False,
                "marked_for_not_publication": False,
                "marked_for_sms": False
            },
            "format": "HTML",
            "genre": [
                {
                    "name": "Article (news)",
                    "qcode": "Article"
                }
            ],
            "group_type": "default",
            "guid": "urn:newsml:localhost:2018-04-03T11:12:43.086751:9472f874-6fae-4050-be10-419845e33c06",
            "item_type": "text",
            "language": "en",
            "linked_in_packages": [
                {
                    "package": "urn:newsml:localhost:2018-04-03T11:12:43.187311:ad5e39b1-2fb2-4676-bd2f-425dca184765"
                }
            ],
            "meta": {},
            "operation": "create",
            "original_creator": self.user_ids[0],
            "particular_type": "item",
            "place": [],
            "priority": 3,
            "pubstatus": "usable",
            "schedule_settings": {
                "time_zone": None,
                "utc_embargo": None
            },
            "sign_off": "abc",
            "source": "Liveblog",
            "state": "draft",
            "text": "post #1<br>",
            "type": "text",
            "unique_id": 234,
            "unique_name": "#234",
            "urgency": 3,
            "version_creator": self.user_ids[0],
            "versioncreated": "2018-04-03T05:42:43+00:00"
        }, {
            "_created": "2018-04-13T06:48:23+00:00",
            "_current_version": 1,
            "_etag": "544b8670ad6e16154e4d71730ae01cd68cb6b539",
            "_id": "urn:newsml:localhost:2018-04-13T12:18:23.258732:2a4a8c45-aae6-4d7a-8193-04d7de5b133c",
            "_updated": "2018-04-13T06:48:23+00:00",
            "blog": self.blogs_ids[0],
            "event_id": "tag:localhost:2018:4c730de0-f91e-46e9-9961-b96cf2a845a4",
            "family_id": "urn:newsml:localhost:2018-04-13T12:18:23.258732:2a4a8c45-aae6-4d7a-8193-04d7de5b133c",
            "firstcreated": "2018-04-13T06:48:23+00:00",
            "flags": {
                "marked_archived_only": False,
                "marked_for_legal": False,
                "marked_for_not_publication": False,
                "marked_for_sms": False
            },
            "format": "HTML",
            "genre": [
                {
                    "name": "Article (news)",
                    "qcode": "Article"
                }
            ],
            "group_type": "default",
            "guid": "urn:newsml:localhost:2018-04-13T12:18:23.258732:2a4a8c45-aae6-4d7a-8193-04d7de5b133c",
            "item_type": "image",
            "language": "en",
            "linked_in_packages": [
                {
                    "package": "urn:newsml:localhost:2018-04-03T11:12:43.187311:ad5e39b1-2fb2-4676-bd2f-425dca184765"
                }
            ],
            "meta": {
                "caption": "deep",
                "credit": "by eta",
                "media": {
                    "_id": "urn:newsml:localhost:2018-04-13T12:17:51.591460:7e647f67-72af-4384-9861-47fcd1318b6b",
                    "_url": "http://localhost:5000/api/upload-raw/5ad052984d003d28097d794a.jpg",
                    "renditions": {
                        "baseImage": {
                            "height": 1080,
                            "href": "http://localhost:5000/api/upload-raw/5ad052974d003d28097d7948.jpg",
                            "media": "5ad052974d003d28097d7948",
                            "mimetype": "image/jpeg",
                            "width": 1622
                        },
                        "original": {
                            "height": 183,
                            "href": "http://localhost:5000/api/upload-raw/5ad052974d003d28097d7946.jpg",
                            "media": "5ad052974d003d28097d7946",
                            "mimetype": "image/jpeg",
                            "width": 275
                        },
                        "thumbnail": {
                            "height": 319,
                            "href": "http://localhost:5000/api/upload-raw/5ad052984d003d28097d794a.jpg",
                            "media": "5ad052984d003d28097d794a",
                            "mimetype": "image/jpeg",
                            "width": 480
                        },
                        "viewImage": {
                            "height": 720,
                            "href": "http://localhost:5000/api/upload-raw/5ad052984d003d28097d794c.jpg",
                            "media": "5ad052984d003d28097d794c",
                            "mimetype": "image/jpeg",
                            "width": 1081
                        }
                    }
                }
            },
            "operation": "create",
            "original_creator": self.user_ids[0],
            "particular_type": "item",
            "place": [],
            "priority": 3,
            "pubstatus": "usable",
            "schedule_settings": {
                "time_zone": None,
                "utc_embargo": None
            },
            "sign_off": "abc",
            "source": "Liveblog",
            "state": "draft",
            "text": "<figure>    <img src=\"http://localhost:5000/api/upload-raw/5ad052984d003d28097d794a.jpg\" " +
            "alt=\"\" srcset=\"http://localhost:5000/api/upload-raw/5ad052974d003d28097d7948.jpg 1622w," +
            "http://localhost:5000/api/upload-raw/5ad052974d003d28097d7946.jpg 275w," +
            " http://localhost:5000/api/upload-raw/5ad052984d003d28097d794c.jpg 1081w," +
            " http://localhost:5000/api/upload-raw/5ad052984d003d28097d794a.jpg 480w\"/>" +
            "    <figcaption></figcaption></figure>",
            "type": "text",
            "unique_id": 489,
            "unique_name": "#489",
            "urgency": 3,
            "version_creator": self.user_ids[0],
            "versioncreated": "2018-04-13T06:48:23+00:00"
        }]

        self.items_ids = self.app.data.insert('items', self.items)

        self.blog_posts = [{
            "_created": "2018-04-03T05:42:43+00:00",
            "_current_version": 1,
            "_etag": "0ad2b3f00e13ebad62e74d8d9a500991ba09f1b7",
            "_links": {
                "self": {
                    "href": "/posts/urn:newsml:localhost:2018-04-03T11:12:43.187311:ad5e39b1" +
                    "-2fb2-4676-bd2f-425dca184765",
                    "title": "Posts"
                }
            },
            "_type": "archive",
            "_updated": "2018-04-03T05:42:43+00:00",
            "blog": self.blogs_ids[0],
            "content_updated_date": "2018-04-03T05:42:43+00:00",
            "deleted": False,
            "event_id": "tag:localhost:2018:9f525062-1de7-414e-98f3-2e1e07e24a34",
            "family_id": "urn:newsml:localhost:2018-04-03T11:12:43.187311:ad5e39b1-2fb2-4676-bd2f-425dca184765",
            "firstcreated": "2018-04-03T05:42:43+00:00",
            "flags": {
                "marked_archived_only": False,
                "marked_for_legal": False,
                "marked_for_not_publication": False,
                "marked_for_sms": False
            },
            "format": "HTML",
            "genre": [{
                "name": "Article (news)",
                "qcode": "Article"
            }],
            "groups": [{
                "id": "root",
                "refs": [{
                    "idRef": "main"
                }],
                "role": "grpRole:NEP"
            }, {
                "id": "main",
                "refs": [{
                    "guid": "urn:newsml:localhost:2018-04-03T11:12:43.086751:9472f874-6fae-4050-be10-419845e33c06",
                    "item": self.items[0],
                    "residRef": self.items_ids[0],
                    "type": "text"
                }, {
                    "guid": "urn:newsml:localhost:2018-04-13T12:18:23.258732:2a4a8c45-aae6-4d7a-8193-04d7de5b133c",
                    "item": self.items[1],
                    "residRef": self.items_ids[1],
                    "type": "text"
                }],
                "role": "grpRole:Main"
            }],
            "guid": "urn:newsml:localhost:2018-04-03T11:12:43.187311:ad5e39b1-2fb2-4676-bd2f-425dca184765",
            "language": "en",
            "lb_highlight": False,
            "operation": "create",
            "order": 0,
            "original_creator": self.user_ids[0],
            "particular_type": "post",
            "place": [],
            "post_items_type": "text",
            "post_status": "open",
            "priority": 3,
            "published_date": "2018-04-03T05:42:43+00:00",
            "publisher": {
                "_created": "2018-03-07T06:12:44+00:00",
                "_etag": "df24610ccfdacd030cd1c7919174ebcfb26c6864",
                "_id": self.user_ids[0],
                "_updated": "2018-04-03T05:35:44+00:00",
                "byline": 'by Edwin',
                "display_name": "Edwin the admin",
                "email": "abc@other.com",
                "sign_off": "abc",
                "username": "admin"
            },
            "pubstatus": "usable",
            "schedule_settings": {
                "time_zone": None,
                "utc_embargo": None
            },
            "sign_off": "abc",
            "source": "Liveblog",
            "state": "draft",
            "sticky": False,
            "type": "composite",
            "unique_id": 235,
            "unique_name": "#235",
            "urgency": 3,
            "version_creator": self.user_ids[0],
            "versioncreated": "2018-04-03T05:42:43+00:00"
        }]

        self.blog_post_ids = self.app.data.insert('client_blog_posts', self.blog_posts)

        self.themes = [{
            "name": "classic",
            "seoTheme": True,
            "settings": {
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
                "showTitle": True
            }
        }]

        self.themes_ids = self.app.data.insert('themes', self.themes)

    def test_get_publisher_clean(self):
        with self.app.app_context():
            with_session = self.user_list[0].copy()
            with_session.update({'session': 'nothing'})
            flask.g.user = with_session
            publisher = get_publisher()
            self.assertEqual(publisher, self.user_list[0])

    def test_get_publisher_none(self):
        with self.app.app_context():
            publisher = get_publisher()
            self.assertEqual(publisher, None)

    def test_private_draft_filter_with_user(self):
        with self.app.app_context():
            flask.g.user = self.user_list[0]
            private_filter = self.private_draft_filter.copy()
            private_filter['bool']['should'].append(
                {'term': {'original_creator': str(self.user_list[0]['_id'])}}
            )
            self.assertEqual(private_draft_filter(), self.private_draft_filter)

    def test_get_next_order_sequence(self):
        blog_id = str(self.blogs_ids[0])
        next_order = self.posts_service.get_next_order_sequence(blog_id)
        self.assertEqual(next_order, 1.00)

    def test_get_next_order_sequence_clean(self):
        blog_id = 'none'
        next_order = self.posts_service.get_next_order_sequence(blog_id)
        self.assertEqual(next_order, 0.00)

    def test_check_post_permission(self):
        forbiddenError = False
        try:
            self.posts_service.check_post_permission(self.blog_posts[0])
        except SuperdeskApiError:
            forbiddenError = True
        self.assertEqual(forbiddenError, False)

    @patch('liveblog.posts.tasks.publish_blog_embeds_on_s3')
    def test_update_post_blog_embed(self, *mocks):
        fake_get_service = mocks[0]

        update_post_blog_embed(self.blog_posts[0])
        fake_get_service(self.blogs_list[0]["_id"], save=False, safe=True)
        fake_get_service.assert_called_with(self.blogs_list[0]["_id"], save=False, safe=True)

    @patch('liveblog.posts.tasks.get_resource_service')
    def test_update_post_blog_data(self, *mocks):
        fake_get_service = mocks[0]

        update_post_blog_data(self.blog_posts[0])

        fake_get_service().find.assert_called_with({'$and': [
            {'blog': self.blogs_list[0]["_id"]},
            {'post_status': 'open'},
            {'deleted': False}
        ]})
        total_posts = fake_get_service().find({'$and': [
            {'blog': self.blogs_list[0]["_id"]},
            {'post_status': 'open'},
            {'deleted': False}
        ]}).count()
        blog = fake_get_service().find_one(req=None, _id=self.blogs_list[0]["_id"])
        fake_get_service().system_update.assert_called_with(
            self.blogs_list[0]["_id"], {
                'last_created_post': {
                    '_updated': self.blog_posts[0]["_updated"],
                    '_id': self.blog_posts[0]["_id"]
                },
                'total_posts': total_posts
            }, blog)
