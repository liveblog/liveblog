from superdesk.tests import TestCase

from liveblog import blogs, posts
from liveblog.common import run_once
from liveblog.prepopulate.app_initialize import drop_stale_indexes

TENANT_KEYS = [
    ("tenant_id", 1),
    ("blog", 1),
    ("post_status", 1),
    ("deleted", 1),
    ("published_date", 1),
    ("sticky", 1),
    ("tags", 1),
]


class DropStaleIndexesTestCase(TestCase):
    @run_once
    def setup_test_case(self):
        for lb_app in [blogs, posts]:
            lb_app.init_app(self.app)

    def setUp(self):
        super().setUp()
        self.setup_test_case()
        self.archive = self.app.data.mongo.pymongo().db.archive
        self.archive.drop_indexes()

    def index_keys(self, name):
        return [(k, int(d)) for k, d in self.archive.index_information()[name]["key"]]

    def test_recreates_an_index_whose_keys_changed(self):
        legacy_keys = [("blog", 1), ("post_status", 1), ("deleted", 1)]
        self.archive.create_index(legacy_keys, name="blog_posts_optimized")

        drop_stale_indexes()
        self.app.init_indexes()

        self.assertEqual(self.index_keys("blog_posts_optimized"), TENANT_KEYS)

    def test_keeps_an_index_whose_keys_match(self):
        self.archive.create_index(TENANT_KEYS, name="blog_posts_optimized")
        before = self.archive.index_information()["blog_posts_optimized"]

        drop_stale_indexes()

        self.assertEqual(
            self.archive.index_information()["blog_posts_optimized"], before
        )
