import liveblog.client_modules as client_modules
import liveblog.blogs as blogs
from liveblog.blogs.blog import Blog
from superdesk.tests import TestCase


class BlogsPostOrderingTestCase(TestCase):
    def setUp(self):
        blogs.init_app(self.app)
        client_modules.init_app(self.app)
        # set default ordering status
        self.default_ordering = 'newest_first'
        self.blog_instance = Blog('5aa60e5e4d003d133fe75b61')

    def test_default_ordering(self):
        # get default ordering, when no values supplied
        order_by, sort = self.blog_instance.get_ordering('')
        self.assertEqual(order_by, "_created")
        self.assertEqual(sort, "desc")

    def test_check_newest_first(self):
        ordering = "newest_first"
        order_by, sort = self.blog_instance.get_ordering(ordering)
        self.assertEqual(order_by, "_created")
        self.assertEqual(sort, "desc")

    def test_check_oldest_first(self):
        ordering = "oldest_first"
        order_by, sort = self.blog_instance.get_ordering(ordering)
        self.assertEqual(order_by, "_created")
        self.assertEqual(sort, "asc")

    def test_check_editorial(self):
        ordering = "editorial"
        order_by, sort = self.blog_instance.get_ordering(ordering)
        self.assertEqual(order_by, "order")
        self.assertEqual(sort, "desc")


class BlogPostMarkupTestCase(TestCase):
    def setUp(self):
        blogs.init_app(self.app)
        client_modules.init_app(self.app)
        self.blog_instance = Blog('5aa60e5e4d003d133fe75b61')

    def test_check_html_markup(self):
        # valid text  and vaild div wrapped html
        self.assertEqual(self.blog_instance.check_html_markup(''), '')
        self.assertEqual(self.blog_instance.check_html_markup('<p>solo</p>'), '<p>solo</p>')

    def test_valid_html_markup(self):
        # valid text  and vaild div wrapped html
        self.assertEqual(self.blog_instance.check_html_markup('end to end'), 'end to end')

    def test_invalid_html_markup(self):
        # valid text and invaild div wrapped html
        self.assertEqual(self.blog_instance.check_html_markup('<div>end to end'), '<div>end to end')
