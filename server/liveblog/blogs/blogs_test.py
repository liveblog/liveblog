from liveblog.blogs import init_app
from superdesk.tests import TestCase
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from settings import SUBSCRIPTION_LEVEL, SUBSCRIPTION_MAX_ACTIVE_BLOGS


class BlogsTestCase(TestCase):

    def setUp(self):
        init_app(self.app)

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
