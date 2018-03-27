import unittest
from liveblog.blogs.blogs import BlogService


class BlogsTestCase(unittest.TestCase):

    def setUp(self):
        pass

    def test_if_check_max_active(self):
        increment = 10
        """so if check "subscription in SUBSCRIPTION_MAX_ACTIVE_BLOGS" pass in method \
        _check_max_active it will create exception"""
        self.assertEqual(BlogService()._check_max_active(increment), None)
