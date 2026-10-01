import io
import json
import shutil
import tempfile
import unittest
import zipfile
from contextlib import contextmanager
from unittest.mock import MagicMock, patch

import flask
from bson import ObjectId
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError

import liveblog.blogs.embeds as embeds
import liveblog.themes.themes as themes_module
from liveblog.tenancy.context import system_context
from liveblog.tests.tenant_test_case import TenantAwareTestCase
from liveblog.themes import UnknownTheme

from .themes_test import init_themes_test_app

A_TEMPLATE = "<div>TENANT-A-TEMPLATE</div>"
A_SCRIPT = "https://cdn.tenant-a.example/a-custom/a.js"
A_PUBLIC_URL = "https://cdn.tenant-a.example/a-custom/"
A_OPTION = {"name": "tenantASecret", "default": "tenant-a-secret-value"}


def _theme_zip(name, template, script_body, version="1.0.0"):
    archive = io.BytesIO()
    with zipfile.ZipFile(archive, "w") as zf:
        zf.writestr(
            "theme.json",
            json.dumps({"name": name, "version": version, "scripts": ["theme.js"]}),
        )
        zf.writestr("template.html", template)
        zf.writestr("theme.js", script_body)
    archive.seek(0)
    return archive


class ThemeTenantIsolationTestCase(TenantAwareTestCase):
    """Theme inheritance (`extends`) and theme name resolution across tenants."""

    def setUp(self):
        super().setUp()
        init_themes_test_app(self)
        self.setup_tenant_and_user("Tenant A", "user_a")

        features = MagicMock()
        features.is_limit_reached.return_value = False
        features.is_enabled.return_value = False
        features_patch = patch.object(self.app, "features", features)
        features_patch.start()
        self.addCleanup(features_patch.stop)

        self.themes = get_resource_service("themes")
        self.tenant_a, self.user_a = self.tenant_id, self.user
        self.tenant_b = get_resource_service("tenants").post([{"name": "Tenant B"}])[0]
        self.user_b = {
            "_id": ObjectId(),
            "username": "user_b",
            "tenant_id": self.tenant_b,
        }

    def _create_theme(self, user, theme):
        self.set_user_context(user)
        self.themes.post([theme])
        return self.themes.find_one(req=None, name=theme["name"])

    def _create_a_custom(self):
        return self._create_theme(
            self.user_a,
            {
                "name": "a-custom",
                "template": A_TEMPLATE,
                "public_url": A_PUBLIC_URL,
                "scripts": [A_SCRIPT],
                "devScripts": [A_SCRIPT],
                "styles": ["a.css"],
                "options": [A_OPTION],
            },
        )

    def _create_blog(self, tenant_id, theme_name):
        blog_id = ObjectId()
        self.app.data.insert(
            "blogs",
            [
                {
                    "_id": blog_id,
                    "title": "blog of {}".format(tenant_id),
                    "tenant_id": tenant_id,
                    "blog_status": "open",
                    "blog_preferences": {"language": "en", "theme": theme_name},
                    "public_urls": {"output": {}, "theme": {}},
                    "members": [],
                }
            ],
        )
        return str(blog_id)

    @contextmanager
    def _celery_worker_context(self):
        """
        Run code the way `publish_blog_embed_on_s3` runs in a Celery worker:
        superdesk's AppContextTask pushes an app context and no request context.
        """
        user = flask.g.get("user")
        self.ctx.pop()
        try:
            with self.app.app_context():
                yield
        finally:
            self.ctx = self.app.test_request_context()
            self.ctx.push()
            self.set_user_context(user)

    def _render_in_worker(self, blog_id):
        with self._celery_worker_context():
            result = embeds.embed(blog_id, api_host="//localhost/")
        return result if isinstance(result, str) else result[0]

    def _assert_no_tenant_a_data(self, html):
        self.assertNotIn("TENANT-A-TEMPLATE", html)
        self.assertNotIn(A_SCRIPT, html)
        self.assertNotIn(A_PUBLIC_URL, html)
        self.assertNotIn("tenant-a-secret-value", html)

    def test_cannot_create_theme_extending_other_tenant_theme(self):
        self._create_a_custom()
        self.set_user_context(self.user_b)

        with self.assertRaises(SuperdeskApiError) as ctx:
            self.themes.post([{"name": "b-child", "extends": "a-custom"}])

        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIsNone(self.themes.find_one(req=None, name="b-child"))

    def test_cannot_patch_extends_to_other_tenant_theme(self):
        self._create_a_custom()
        b_theme = self._create_theme(self.user_b, {"name": "b-theme"})

        with self.assertRaises(SuperdeskApiError) as ctx:
            self.themes.patch(b_theme["_id"], {"extends": "a-custom"})

        self.assertEqual(ctx.exception.status_code, 400)

    def test_can_extend_system_theme_and_own_theme(self):
        self.app.data.insert("themes", [{"name": "angular", "tenant_id": None}])
        self.set_user_context(self.user_b)
        self.themes.post(
            [
                {"name": "b-parent", "extends": "angular"},
                {"name": "b-child", "extends": "b-parent"},
            ]
        )
        self.themes.post([{"name": "b-grandchild", "extends": "b-child"}])

        self.assertIsNotNone(self.themes.find_one(req=None, name="b-grandchild"))

    def test_public_embed_does_not_resolve_parent_from_other_tenant(self):
        self._create_a_custom()
        # Written through the data layer to skip `extends` validation and model
        # a cross-tenant `extends` already stored in the database.
        self.app.data.insert(
            "themes",
            [{"name": "b-child", "extends": "a-custom", "tenant_id": self.tenant_b}],
        )
        blog_b = self._create_blog(self.tenant_b, "b-child")

        response = self.client.get("/embed/{}".format(blog_b))
        html = response.data.decode("utf-8")

        self.assertEqual(response.status_code, 500)
        self.assertIn('depends on "a-custom"', html)
        self._assert_no_tenant_a_data(html)

    def test_worker_embed_does_not_resolve_parent_from_other_tenant(self):
        self._create_a_custom()
        self.app.data.insert(
            "themes",
            [{"name": "b-child", "extends": "a-custom", "tenant_id": self.tenant_b}],
        )
        blog_b = self._create_blog(self.tenant_b, "b-child")

        html = self._render_in_worker(blog_b)

        self.assertIn('depends on "a-custom"', html)
        self._assert_no_tenant_a_data(html)

    def test_parent_lookup_is_scoped_to_child_tenant_in_system_mode(self):
        self._create_a_custom()
        b_child = {"name": "b-child", "extends": "a-custom", "tenant_id": self.tenant_b}

        with system_context():
            with self.assertRaises(UnknownTheme):
                self.themes.get_options(b_child, parents=[])
            with self.assertRaises(UnknownTheme):
                embeds.collect_theme_assets(b_child, parents=[])

    def test_worker_embed_uses_blog_tenant_theme_on_name_collision(self):
        self._create_theme(
            self.user_a, {"name": "company-theme", "template": A_TEMPLATE}
        )
        self._create_theme(
            self.user_b,
            {"name": "company-theme", "template": "<div>TENANT-B-TEMPLATE</div>"},
        )
        blog_a = self._create_blog(self.tenant_a, "company-theme")
        blog_b = self._create_blog(self.tenant_b, "company-theme")

        html_b = self._render_in_worker(blog_b)
        html_a = self._render_in_worker(blog_a)

        self.assertIn("TENANT-B-TEMPLATE", html_b)
        self.assertNotIn("TENANT-A-TEMPLATE", html_b)
        self.assertIn("TENANT-A-TEMPLATE", html_a)
        self.assertNotIn("TENANT-B-TEMPLATE", html_a)

    def test_public_embed_uses_blog_tenant_theme_on_name_collision(self):
        self._create_theme(
            self.user_a, {"name": "company-theme", "template": A_TEMPLATE}
        )
        self._create_theme(
            self.user_b,
            {"name": "company-theme", "template": "<div>TENANT-B-TEMPLATE</div>"},
        )
        blog_b = self._create_blog(self.tenant_b, "company-theme")

        html_b = self.client.get("/embed/{}".format(blog_b)).data.decode("utf-8")

        self.assertIn("TENANT-B-TEMPLATE", html_b)
        self.assertNotIn("TENANT-A-TEMPLATE", html_b)

    # Uploaded theme files live at UPLOAD_THEMES_DIRECTORY/<theme name> (and on
    # S3 under <version>/<theme name>/...), not namespaced by tenant, so a second
    # tenant uploading the same theme name overwrites the first tenant's files.
    @unittest.expectedFailure
    def test_uploading_same_theme_name_does_not_overwrite_other_tenant_files(self):
        upload_dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, upload_dir, ignore_errors=True)
        dir_patch = patch.object(themes_module, "UPLOAD_THEMES_DIRECTORY", upload_dir)
        dir_patch.start()
        self.addCleanup(dir_patch.stop)

        self.set_user_context(self.user_a)
        themes_module.register_a_theme(
            _theme_zip("company-theme", A_TEMPLATE, "/* tenant a */")
        )
        blog_a = self._create_blog(self.tenant_a, "company-theme")

        self.set_user_context(self.user_b)
        themes_module.register_a_theme(
            _theme_zip(
                "company-theme", "<div>TENANT-B-INJECTED</div>", "/* tenant b */"
            )
        )

        html_a = self.client.get("/embed/{}".format(blog_a)).data.decode("utf-8")

        self.assertIn("TENANT-A-TEMPLATE", html_a)
        self.assertNotIn("TENANT-B-INJECTED", html_a)
