from datetime import datetime, timedelta

from bson import ObjectId
from superdesk import get_resource_service
from superdesk.tests import TestCase

from liveblog import blogs, posts, tenants, theme_settings, users
from liveblog.common import run_once
from liveblog.migration.migrate_tenancy import MigrateTenancyCommand


class MigrateTenancyTestCase(TestCase):
    @run_once
    def setup_test_case(self):
        self.app.config.update({"LIVEBLOG_DEBUG": True, "DEBUG": False})
        for lb_app in [tenants, users, blogs, posts, theme_settings]:
            lb_app.init_app(self.app)

    def setUp(self):
        super().setUp()
        self.setup_test_case()
        self.command = MigrateTenancyCommand()
        self.db = self.app.data.mongo.pymongo().db
        self.seed_legacy_data()

    def seed_legacy_data(self):
        now = datetime.utcnow()
        self.admin_id = ObjectId()
        self.editor_id = ObjectId()
        self.db.users.insert_many(
            [
                {
                    "_id": self.editor_id,
                    "username": "editor",
                    "user_type": "user",
                    "_created": now - timedelta(days=2),
                },
                {
                    "_id": self.admin_id,
                    "username": "admin",
                    "user_type": "administrator",
                    "_created": now - timedelta(days=1),
                },
                {
                    "_id": ObjectId(),
                    "username": "admin2",
                    "user_type": "administrator",
                    "_created": now,
                },
            ]
        )
        self.blog_id = ObjectId()
        self.db.blogs.insert_one(
            {"_id": self.blog_id, "title": "Legacy blog", "blog_status": "open"}
        )
        self.db.archive.insert_many(
            [
                {
                    "_id": ObjectId(),
                    "particular_type": "post",
                    "blog": self.blog_id,
                    "post_status": "open",
                },
                {"_id": ObjectId(), "particular_type": "item", "blog": self.blog_id},
            ]
        )
        self.db.polls.insert_one({"_id": ObjectId(), "blog": self.blog_id})
        self.db.themes.insert_many(
            [
                {
                    "_id": ObjectId(),
                    "name": "default",
                    "settings": {"postOrder": "ascending"},
                    "styleSettings": {"background": "#fff"},
                },
                {"_id": ObjectId(), "name": "amp", "settings": {}},
                {"_id": ObjectId(), "name": "custom-theme", "extends": "default"},
            ]
        )

    def tenant_ids(self, collection):
        return {doc.get("tenant_id") for doc in self.db[collection].find()}

    def test_creates_tenant_and_backfills_everything(self):
        summary = self.command.run()

        tenant = get_resource_service("tenants").find_one(req=None)
        self.assertEqual(tenant["name"], "Default Tenant")
        self.assertEqual(tenant["subscription_level"], "network")
        self.assertEqual(tenant["owner_user_id"], self.admin_id)

        self.assertEqual(summary["users"], 3)
        self.assertEqual(summary["blogs"], 1)
        self.assertEqual(summary["archive"], 2)
        self.assertEqual(summary["polls"], 1)
        self.assertEqual(summary["themes"], {"system": 2, "custom": 1})
        for collection in ("users", "blogs", "archive", "polls"):
            self.assertEqual(self.tenant_ids(collection), {tenant["_id"]})

        themes = {t["name"]: t.get("tenant_id") for t in self.db.themes.find()}
        self.assertIsNone(themes["default"])
        self.assertIsNone(themes["amp"])
        self.assertEqual(themes["custom-theme"], tenant["_id"])

        self.assertEqual(summary["theme_settings_moved"], 1)
        moved = self.db.theme_settings.find_one({"theme_name": "default"})
        self.assertEqual(moved["tenant_id"], tenant["_id"])
        self.assertEqual(moved["settings"], {"postOrder": "ascending"})
        self.assertEqual(moved["style_settings"], {"background": "#fff"})
        default_theme = self.db.themes.find_one({"name": "default"})
        self.assertNotIn("settings", default_theme)
        self.assertNotIn("styleSettings", default_theme)
        self.assertEqual(self.db.theme_settings.count_documents({}), 1)

    def test_elastic_documents_carry_the_tenant(self):
        self.command.run()
        tenant = get_resource_service("tenants").find_one(req=None)

        for resource in ("blogs", "posts"):
            backend = self.app.data._search_backend(resource)
            hits = backend.elastic(resource).search(
                index=backend._resource_index(resource),
                body={"query": {"term": {"tenant_id": str(tenant["_id"])}}},
            )
            self.assertEqual(
                hits["hits"]["total"], 1 if resource == "blogs" else 2, resource
            )

    def test_dry_run_writes_nothing(self):
        summary = self.command.run(dry_run=True)

        self.assertEqual(summary["users"], 3)
        self.assertEqual(summary["archive"], 2)
        self.assertEqual(summary["themes"], {"system": 2, "custom": 1})
        self.assertEqual(summary["theme_settings_moved"], 1)
        self.assertEqual(get_resource_service("tenants").find_one(req=None), None)
        self.assertEqual(self.db.theme_settings.count_documents({}), 0)
        self.assertEqual(self.tenant_ids("blogs"), {None})

    def test_rerun_changes_nothing(self):
        self.command.run()
        summary = self.command.run()

        self.assertEqual(summary["users"], 0)
        self.assertEqual(summary["blogs"], 0)
        self.assertEqual(summary["themes"], {"system": 0, "custom": 0})
        self.assertEqual(summary["theme_settings_moved"], 0)

    def test_uses_the_only_existing_tenant(self):
        tenant_id = get_resource_service("tenants").post(
            [{"name": "Existing", "subscription_level": "team"}]
        )[0]

        self.command.run()

        self.assertEqual(self.tenant_ids("blogs"), {tenant_id})
        self.assertEqual(
            get_resource_service("tenants").get(req=None, lookup={}).count(), 1
        )

    def test_requires_tenant_id_when_several_tenants_exist(self):
        tenants_service = get_resource_service("tenants")
        first, second = tenants_service.post([{"name": "First"}, {"name": "Second"}])

        with self.assertRaises(SystemExit):
            self.command.run()
        self.assertEqual(self.tenant_ids("blogs"), {None})

        self.command.run(tenant_id=str(second))
        self.assertEqual(self.tenant_ids("blogs"), {second})
        self.assertEqual(self.tenant_ids("users"), {second})

    def test_unknown_tenant_id_aborts(self):
        with self.assertRaises(SystemExit):
            self.command.run(tenant_id=str(ObjectId()))
        with self.assertRaises(SystemExit):
            self.command.run(tenant_id="not-an-id")
