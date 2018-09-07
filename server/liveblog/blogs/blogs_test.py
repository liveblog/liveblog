import liveblog.blogs as blog_app
import liveblog.advertisements as advert_app
from superdesk.tests import TestCase
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from settings import SUBSCRIPTION_LEVEL, SUBSCRIPTION_MAX_ACTIVE_BLOGS


class BlogsTestCase(TestCase):

    def setUp(self):
        blog_app.init_app(self.app)
        advert_app.init_app(self.app)

        self.blog_with_output = {
            'title': 'Test blog',
            'description': '',
            'members': [],
            'posts_order_sequence': 0.0,
            'blog_status': 'open',
            'syndication_enabled': False,
            'market_enabled': False,
            'category': '',
            'total_posts': 0,
            'original_creator': '5b1a6935fd16ad1ce83822da',
            'blog_preferences': {
                'language': 'en',
                'theme': 'default'
            },
            'theme_settings': {
                'outputChannel': True,
                'outputChannelName': 'Test channel',
                'outputChannelTheme': 'amp'
            },
            '_etag': '853b12bef642b42b67f8e2273b19f4cba5c88ac3',
            '_id': '5b35df76fd16ad23840abb70',
            '_links': {
                'self': {
                    'title': 'Blog',
                    'href': 'blogs/5b35df76fd16ad23840abb70'
                }
            },
            '_status': 'OK'
        }

        self.blog_without_output = {
            'title': 'Test blog',
            'description': '',
            'members': [],
            'posts_order_sequence': 0.0,
            'blog_status': 'open',
            'syndication_enabled': False,
            'market_enabled': False,
            'category': '',
            'total_posts': 0,
            'original_creator': '5b1a6935fd16ad1ce83822da',
            'blog_preferences': {
                'language': 'en',
                'theme': 'default'
            },
            'theme_settings': {
                'outputChannel': False,
                'outputChannelName': 'Test channel',
                'outputChannelTheme': 'amp'
            },
            '_etag': '853b12bef642b42b67f8e2273b19f4cba5c88ac3',
            '_id': '5b35df76fd16ad23840abb70',
            '_links': {
                'self': {
                    'title': 'Blog',
                    'href': 'blogs/5b35df76fd16ad23840abb70'
                }
            },
            '_status': 'OK'
        }

    def test_if_not_check_max_active(self):
        increment = 0
        self.assertEqual(get_resource_service('blogs')._check_max_active(increment), None)

    def test_if_check_max_active(self):
        if SUBSCRIPTION_LEVEL in SUBSCRIPTION_MAX_ACTIVE_BLOGS:
            try:
                increment = SUBSCRIPTION_MAX_ACTIVE_BLOGS[SUBSCRIPTION_LEVEL] + 5
            except KeyError:
                increment = 10
            with self.assertRaises(SuperdeskApiError):
                get_resource_service('blogs')._check_max_active(increment)

    def test_auto_create_output(self):
        get_resource_service('blogs')._auto_create_output(self.blog_with_output)
        self.assertIsNotNone(get_resource_service('outputs').find({'blog': self.blog_with_output['_id']})[0])

    def test_not_auto_create_output(self):
        get_resource_service('blogs')._auto_create_output(self.blog_without_output)
        with self.assertRaises(IndexError):
            get_resource_service('outputs').find({'blog': self.blog_without_output['_id']})[0]
