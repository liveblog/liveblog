import unittest
from liveblog.blogs.blogs import BlogService
from superdesk.errors import SuperdeskApiError

class BlogsTestCase(unittest.TestCase):

    def setUp(self):
        pass

    def test_if_check_max_active(self):
        increment = 10
        """so if check "subscription in SUBSCRIPTION_MAX_ACTIVE_BLOGS" pass in method \
        _check_max_active it will create exception"""
        error_reach_maximum = False
        try:
            BlogService()._check_max_active(increment)
        except:
            error_reach_maximum = True
        self.assertEqual(error_reach_maximum, True)
