import datetime
import json
import liveblog.client_modules as client_modules
import liveblog.blogs as blogs
import superdesk.users as users_app
import liveblog.items as items_app
from liveblog.blogs.blog import Blog
from superdesk.tests import TestCase
from bson import ObjectId
from superdesk import get_resource_service
from liveblog.client_modules.client_modules import blog_posts_blueprint, convert_posts, _get_converted_item


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
            items_app.init_app(self.app)
            users_app.init_app(self.app)
            client_modules.init_app(self.app)
            self.app.register_blueprint(blog_posts_blueprint)
            self.client = self.app.test_client()

        self.client_item_service = get_resource_service('client_items')
        self.client_comment_service = get_resource_service('client_comments')

        self.item_docs = [{
            "commenter": "test commenter",
            "text": "test comment",
            "client_blog": ObjectId("5ab90249fd16ad1752b39b74"),
            "item_type": "comment",
            "_updated": datetime.datetime(2018, 4, 11, 6, 43, 47),
            "_created": datetime.datetime(2018, 4, 11, 6, 43, 47),
            "type": "text",
            "pubstatus": "usable",
            "flags": {
                "marked_for_not_publication": False,
                "marked_for_legal": False,
                "marked_archived_only": False,
                "marked_for_sms": False
            },
            "format": "HTML",
            "particular_type": "item",
            "group_type": "default",
            "meta": {},
            "_current_version": 1
        }]

        res = self.app.data.insert('client_items', self.item_docs)

        self.comment_docs = [{
            "post_status": "comment",
            "client_blog": ObjectId("5ab90249fd16ad1752b39b74"),
            "groups": [{
                "id": "root",
                "refs": [{
                    "idRef": "main"
                }],
                "role": "grpRole:NEP"
            }, {
                "id": "main",
                "refs": [{
                    "residRef": res[
                        0
                    ]}
                ],
                "role": "grpRole:Main"
            }],
            "_updated": datetime.datetime(2018, 4, 11, 6, 44, 1),
            "_created": datetime.datetime(2018, 4, 11, 6, 44, 1),
            "type": "text",
            "pubstatus": "usable",
            "flags": {
                "marked_for_not_publication": False,
                "marked_for_legal": False,
                "marked_archived_only": False,
                "marked_for_sms": False
            },
            "format": "HTML",
            "particular_type": "post",
            "lb_highlight": False,
            "sticky": False,
            "deleted": False,
            "order": 0.0,
            "_current_version": 1
        }]

        self.blog_post_service = get_resource_service('client_blog_posts')
        self.blogs_service = get_resource_service('blogs')
        self.client_blog_service = get_resource_service('client_blogs')
        self.users_service = get_resource_service('users')

        self.user_list = [{
            '_created': '2018-03-20T00:00:00+00:00',
            '_updated': '2018-03-20T10:00:00+00:00',
            'username': 'admin',
            'display_name': 'Edwin the admin',
            'first_name': 'Edwin',
            'is_active': True,
            'is_enabled': True,
            'last_name': 'the admin',
            'sign_off': 'off',
            'byline': 'by',
            'email': 'abc@other.com',
        }]

        self.user_ids = self.app.data.insert('users', self.user_list)

        self.blogs_list = [{
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
            "original_creator": self.user_ids[0],
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
        self.blogs_ids = self.app.data.insert('blogs', self.blogs_list)

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

    def test_a_on_create_comment(self):
        with self.app.test_request_context('client_comments', method='POST'):
            self.assertIsNone(self.client_comment_service.on_create(self.comment_docs))
            response = get_resource_service('archive').find_one(
                req=None, client_blog=ObjectId("5ab90249fd16ad1752b39b74"))
            self.assertIsNotNone(response, True)

    def test_add_post_info(self):
        doc = self.blog_post_service.add_post_info(self.blog_posts[0])
        # test method added original creator info
        original_creator = doc.get('original_creator')
        self.assertIsNotNone(original_creator, True)
        # test original creator ids
        original_creator_id = self.blog_posts[0].get('original_creator').get('_id')
        self.assertEqual(original_creator.get('_id'), original_creator_id)
        # test post items type items_length > 1, but only one image
        post_items_type = doc.get('post_items_type')
        self.assertIsNone(post_items_type, True)

    def test_b_get_blog_posts(self):
        blog_id = str(self.blogs_ids[0])
        result = self.client.get('/api/v2/client_blogs/' + blog_id + '/posts')
        data = json.loads(result.data.decode())
        # returns status 200
        self.assertEqual(result.status_code, 200)
        # result contains data
        self.assertIsNotNone(result.data, True)
        # test response contains items list
        _items = data.get('_items')
        self.assertIsNotNone(_items, True)
        items_result = _items[0].get('items')
        # test blog id
        self.assertEqual(_items[0].get('blog'), self.blogs_list[0].get('_id'))
        # test items id
        self.assertEqual(items_result[0].get('_id'), self.items_ids[0])
        # test item text
        self.assertEqual(items_result[0].get('text'), self.items[0].get('text'))

    def test_convert_posts(self):
        blog_id = str(self.blogs_ids[0])
        blog = Blog(blog_id)
        kwargs = {'ordering': 'newest_first', 'page': 1, 'highlight': 0, 'sticky': 0, 'limit': 25}
        response_data = blog.posts(wrap=True, **kwargs)
        results_data = convert_posts(response_data, blog)
        self.assertIsNotNone(results_data, True)
        # test meta info
        _meta_data = results_data.get('_meta')
        self.assertIsNotNone(_meta_data, True)
        self.assertEqual(_meta_data.get('max_results'), kwargs.get('limit'))
        self.assertEqual(
            _meta_data.get('last_updated_post').get('_id'),
            self.blogs_list[0].get('last_updated_post').get('_id'))
        # test results contains _items list
        _items = results_data.get('_items')
        self.assertIsNotNone(_items, True)
        # test blog id
        self.assertEqual(_items[0].get('blog'), self.blogs_ids[0])
        # _items contains post items list
        post_item = _items[0].get('items')
        self.assertIsNotNone(post_item, True)
        self.assertEqual(post_item[0].get('_id'), self.items_ids[0])

    def test_get_converted_item(self):
        groups = self.blog_posts[0].get('groups')
        refs = groups[1].get('refs')
        item_text = refs[0]
        item_image = refs[1]

        # test item text
        converted_item_text = _get_converted_item(item_text.get('item'))
        item_text_id = converted_item_text.get('_id')
        self.assertEqual(item_text_id, self.items_ids[0])
        item_type = converted_item_text.get('item_type')
        self.assertEqual(item_type, self.items[0].get('item_type'))
        text = converted_item_text.get('text')
        self.assertEqual(text, self.items[0].get('text'))

        # test item image
        converted_item_image = _get_converted_item(item_image.get('item'))
        # test converted meta data
        meta = converted_item_image.get('meta')
        items_meta_data = self.items[1].get('meta')
        self.assertEqual(meta.get('credit'), items_meta_data.get('credit'))
        self.assertEqual(meta.get('caption'), items_meta_data.get('caption'))
        # test converted renditions
        renditions = converted_item_image.get('renditions')
        self.assertIsNotNone(renditions, True)
        self.assertEqual(renditions, self.items[1]['meta']['media']['renditions'])
