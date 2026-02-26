# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
import re
import os
import glob
import json
import magic
import flask
import jinja2
import superdesk
import zipfile
import logging
from io import BytesIO
from math import ceil

from bson.objectid import ObjectId
from eve.io.mongo import MongoJSONEncoder
from eve.utils import ParsedRequest
from flask_cors import cross_origin
from flask import make_response, request, current_app as app

from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError, SuperdeskError
from liveblog.mongo_util import encode as mongoencode
from liveblog.system_themes import system_themes
from liveblog.utils.api import api_error
from liveblog.tenancy import get_tenant_id
from liveblog.tenancy.service import TenantAwareService

from liveblog.blogs.app_settings import THEMES_ASSETS_DIR, THEMES_UPLOADS_DIR
from liveblog.blogs.utils import is_s3_storage_enabled as s3_enabled
from .template.filters import (
    moment_date_filter_container,
    addten,
    ampify,
    ampsupport,
    decode_uri,
    fix_x_domain_embed,
)
from .template.loaders import ThemeTemplateLoader
from settings import COMPILED_TEMPLATES_PATH, UPLOAD_THEMES_DIRECTORY


logger = logging.getLogger("superdesk")
CURRENT_DIRECTORY = os.path.dirname(os.path.realpath(__file__))
LOCAL_THEMES_DIRECTORY = os.path.join(CURRENT_DIRECTORY, THEMES_ASSETS_DIR)
CONTENT_TYPES = {
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".svgz": "image/svg+xml",
}
STEPS = {"ampTheme": 2, "seoTheme": 2, "default": 1}

THEMES_MAX_RESULTS = 50

upload_theme_blueprint = superdesk.Blueprint("upload_theme", __name__)
download_theme_blueprint = superdesk.Blueprint("download_theme", __name__)
themes_assets_blueprint = superdesk.Blueprint(
    "themes_assets", __name__, static_folder=THEMES_ASSETS_DIR
)


class UndefinedVar(jinja2.Undefined):
    def __getattribute__(self, name, *args, **kwargs):
        try:
            return super(UndefinedVar, self).__getattribute__(name, *args, **kwargs)
        except Exception:
            err_msg = "Template variable undefined `{}`, parent reference `{}`".format(
                self._undefined_name, name
            )
            print(err_msg)
            return UndefinedVar(err_msg)


class ThemesResource(Resource):
    schema = {
        "name": {"type": "string"},
        "tenant_id": Resource.rel("tenants", required=False, nullable=True),
        "label": {"type": "string"},
        "extends": {"type": "string"},
        "abstract": {"type": "boolean"},
        "version": {"type": "string"},
        "screenshot_url": {"type": "string"},
        "author": {"type": "string"},
        "license": {"type": "string"},
        "devStyles": {"type": "list", "schema": {"type": "string"}},
        "devScripts": {"type": "list", "schema": {"type": "string"}},
        "styles": {"type": "list", "schema": {"type": "string"}},
        "scripts": {"type": "list", "schema": {"type": "string"}},
        "supportAdsInjection": {"type": "boolean", "default": False},
        "options": {
            "type": "list",
            "schema": {"type": "dict", "mapping": {"type": "object", "enabled": False}},
        },
        "supportStylesSettings": {"type": "boolean", "default": False},
        "styleOptions": {
            "type": "list",
            "schema": {"type": "dict", "mapping": {"type": "object", "enabled": False}},
        },
        "repository": {"type": "dict", "mapping": {"type": "object", "enabled": False}},
        "settings": {"type": "dict", "mapping": {"type": "object", "enabled": False}},
        "styleSettings": {
            "type": "dict",
            "mapping": {"type": "object", "enabled": False},
        },
        "public_url": {"type": "string"},
        "seoTheme": {"type": "boolean", "default": False},
        "ampTheme": {"type": "boolean", "default": False},
        "asyncTheme": {"type": "boolean", "default": False},
        "i18n": {
            "type": "dict",
            "mapping": {"type": "object", "enabled": False},
            "default": {},
        },
        "template": {"type": "string", "default": ""},
        "files": {"type": "dict", "mapping": {"type": "object", "enabled": False}},
    }
    datasource = {
        "source": "themes",
        "default_sort": [("_updated", -1)],
        "search_backend": None,
    }
    additional_lookup = {"url": 'regex("[\w\-]+")', "field": "name"}

    mongo_indexes = {
        # System themes: name must be globally unique (tenant_id = null)
        "system_theme_name_unique": (
            [("name", 1)],
            {
                "unique": True,
                "partialFilterExpression": {"tenant_id": {"$eq": None}},
            },
        ),
        # User themes: (name, tenant_id) must be unique per tenant
        # Uses $type to match only documents where tenant_id exists and is an ObjectId
        "user_theme_name_tenant_unique": (
            [("name", 1), ("tenant_id", 1)],
            {
                "unique": True,
                "partialFilterExpression": {"tenant_id": {"$type": "objectId"}},
            },
        ),
    }

    etag_ignore_fields = ["_type", "template"]

    # point accessible at '/themes/<theme_name>'.
    ITEM_METHODS = ["GET", "POST", "DELETE"]
    privileges = {
        "POST": "themes_create",
        "GET": "themes_read",
        "PATCH": "themes_update",
        "DELETE": "themes_delete",
    }


class UnknownTheme(Exception):
    pass


class ThemesService(TenantAwareService, BaseService):
    def get(self, req, lookup={}):
        """
        Get themes: includes system themes (tenant_id=null) and current tenant's themes.
        Overrides the default TenantAwareService behavior that only filters by tenant_id.
        Sets max_results to 50 expecting clients won't have more than 50 themes.
        """
        if req is None:
            req = ParsedRequest()

        req.max_results = THEMES_MAX_RESULTS

        if self.is_system_request():
            return super(TenantAwareService, self).get(req, lookup)

        tenant_id = get_tenant_id(required=True)
        if "$or" not in lookup:
            lookup["$or"] = [{"tenant_id": None}, {"tenant_id": tenant_id}]

        return self.backend.get(self.datasource, req=req, lookup=lookup)

    def find_one(self, req, **lookup):
        """
        Override find_one to include system themes.

        Allows tenants to access system themes by ID (for viewing, but not modifying).
        """
        if self.is_system_request():
            return super(TenantAwareService, self).find_one(req, **lookup)

        tenant_id = get_tenant_id(required=True)

        if "$or" not in lookup:
            lookup["$or"] = [{"tenant_id": None}, {"tenant_id": tenant_id}]

        return self.backend.find_one(self.datasource, req=req, **lookup)

    def get_from_mongo(self, req, lookup):
        """
        Override get_from_mongo to include system themes.

        This method is used by Eve for some item lookups.
        """
        if lookup is None:
            lookup = {}

        if self.is_system_request():
            return super(TenantAwareService, self).get_from_mongo(req, lookup)

        tenant_id = get_tenant_id(required=True)

        if "$or" not in lookup:
            if isinstance(tenant_id, str):
                tenant_id = ObjectId(tenant_id)
            lookup["$or"] = [{"tenant_id": None}, {"tenant_id": tenant_id}]

        return self.backend.get(self.datasource, req=req, lookup=lookup)

    def on_fetched(self, docs):
        super().on_fetched(docs)

        tenant_id = get_tenant_id(required=False)

        # Only enrich themes when there's a tenant context
        # Without tenant, return raw theme documents (for tests, system operations)
        if not tenant_id:
            return

        theme_settings_service = get_resource_service("theme_settings")

        for doc in docs["_items"]:
            theme_name = doc.get("name")

            # Merge tenant-specific customizations
            effective_settings = theme_settings_service.get_effective_settings(
                theme_name, tenant_id
            )
            effective_style_settings = (
                theme_settings_service.get_effective_style_settings(
                    theme_name, tenant_id
                )
            )

            if effective_settings:
                doc["settings"] = effective_settings
            if effective_style_settings:
                doc["styleSettings"] = effective_style_settings

            # Count blogs in current tenant using this theme
            blogs_service = get_resource_service("blogs")
            lookup = {
                "blog_preferences.theme": theme_name,
                "tenant_id": tenant_id,
            }

            blogs = blogs_service.find(lookup)
            blogs_list = list(blogs)
            blogs_count = len(blogs_list)
            doc["blogs_data"] = {"_items": blogs_list, "total": blogs_count}

    def on_fetched_item(self, doc):
        """
        Merge effective settings when fetching a single theme.
        """
        super().on_fetched_item(doc)

        tenant_id = get_tenant_id(required=False)

        if tenant_id:
            theme_name = doc.get("name")
            theme_settings_service = get_resource_service("theme_settings")

            effective_settings = theme_settings_service.get_effective_settings(
                theme_name, tenant_id
            )
            effective_style_settings = (
                theme_settings_service.get_effective_style_settings(
                    theme_name, tenant_id
                )
            )

            if effective_settings:
                doc["settings"] = effective_settings
            if effective_style_settings:
                doc["styleSettings"] = effective_style_settings

    def get_options(self, theme, options=None, parents=[], optionsKey="options"):
        """
        Get theme options or styleOptions.

        :param theme:
        :param options:
        :param parents:
        :param optionsKey:
        :return:
        """
        options = options or []
        if (
            theme.get("extends", False)
            and theme.get("name") != theme.get("extends")
            and theme.get("name") not in parents
        ):
            parent_theme = get_resource_service("themes").find_one(
                req=None, name=theme.get("extends")
            )

            if parent_theme:
                parents.append(theme.get("extends"))
                options = self.get_options(parent_theme, options, parents, optionsKey)
            else:
                error_message = (
                    'Embed: "%s" theme depends on "%s" but this theme is not registered.'
                    % (theme.get("name"), theme.get("extends"))
                )
                logger.info(error_message)
                raise UnknownTheme(error_message)

        if theme.get(optionsKey, False):
            options += theme.get(optionsKey)

        return options

    def get_default_settings(self, theme):
        """
        Get default theme settings based on theme options.

        :param theme:
        :return:
        """
        settings = {}
        options = self.get_options(theme)

        for option in options:
            settings[option.get("name")] = option.get("default")
        settings.update(theme.get("settings", {}))

        return settings

    def get_default_style_settings(self, theme):
        """
        Get default theme style settings
        """
        settings = {}
        options_groups = self.get_options(theme, optionsKey="styleOptions")

        for group in options_groups:
            group_options = {}
            group_name = group.get("name")
            serializer_ignore = group.get("serializerIgnore", False)
            css_selector = group.get("cssSelector")

            if serializer_ignore or not css_selector:
                continue

            for option in group.get("options", []):
                default = option.get("default")
                property_name = option.get("property")

                if not default or not property_name:
                    continue

                group_options[property_name] = default

            settings[group_name] = group_options

        return settings

    def is_local_theme(self, theme_name):
        """
        Check if theme is a default bundled one.

        :param theme_name:
        :return:
        """
        return theme_name in system_themes

    def is_uploaded_theme(self, theme_name):
        """
        Check if theme is user-uploaded.

        :param theme_name:
        :return:
        """
        theme_folder = os.path.join(UPLOAD_THEMES_DIRECTORY, theme_name)
        return os.path.exists(theme_folder)

    def get_theme_path(self, theme_name):
        """
        Get theme template path.

        :param theme_name:
        :return:
        """
        if self.is_local_theme(theme_name):
            template_dir = LOCAL_THEMES_DIRECTORY
        else:
            template_dir = UPLOAD_THEMES_DIRECTORY
        return os.path.join(template_dir, theme_name)

    def get_theme_template_filename(self, theme_name, template_name="template.html"):
        """
        Get main theme template full path.

        :param theme_name:
        :param template_name:
        :return:
        """
        template_path = self.get_theme_path(theme_name)
        return os.path.join(template_path, template_name)

    def get_theme_template_env(self, theme, loader=ThemeTemplateLoader):
        """
        Get jinja2 template environment for SEO themes.

        :param theme:
        :return:
        """
        embed_env = jinja2.Environment(loader=loader(theme), undefined=UndefinedVar)
        embed_env.filters["date"] = moment_date_filter_container(theme)
        embed_env.filters["addten"] = addten
        embed_env.filters["ampify"] = ampify
        embed_env.filters["ampsupport"] = ampsupport
        embed_env.filters["decode_uri"] = decode_uri
        embed_env.filters["fix_x_domain_embed"] = fix_x_domain_embed
        return embed_env

    def get_theme_compiled_templates_path(self, theme_name):
        """
        Get jinja2 compiled templates path for SEO themes.

        :param theme_name:
        :return:
        """
        compiled_templates_path = os.path.join(COMPILED_TEMPLATES_PATH, "themes")
        if not os.path.exists(compiled_templates_path):
            os.makedirs(compiled_templates_path)

        return os.path.join(compiled_templates_path, theme_name)

    @property
    def is_s3_storage_enabled(self):
        # TODO: provide multiple media storage support.
        return s3_enabled()

    def get_theme_assets_url(self, theme_name):
        """
        Get assets url for theme.
        :param theme_name:
        :return:
        """

        if self.is_local_theme(theme_name):
            base_assets_dir = THEMES_ASSETS_DIR
        else:
            base_assets_dir = THEMES_UPLOADS_DIR
        return "/{}/".format("/".join([base_assets_dir, theme_name]))

    def get_local_themes_packages(self):
        """
        Get local instance theme packages. Includes UPLOAD_THEMES_DIRECTORY if s3 storage is disabled.

        :return:
        """
        if not self.is_s3_storage_enabled:

            # Include upload folder if s3 storage is disabled.
            theme_dirs = [LOCAL_THEMES_DIRECTORY, UPLOAD_THEMES_DIRECTORY]

            for theme_dir in theme_dirs:
                for file in glob.glob(theme_dir + "/**/theme.json"):
                    files = []
                    for root, dirnames, filenames in os.walk(os.path.dirname(file)):
                        for filename in filenames:
                            files.append(os.path.join(root, filename))

                    yield json.loads(open(file).read()), files
        else:
            for theme in system_themes:
                files = []
                for root, dirnames, filenames in os.walk(
                    os.path.join(LOCAL_THEMES_DIRECTORY, theme)
                ):
                    for filename in filenames:
                        files.append(os.path.join(root, filename))
                theme_json = os.path.join(LOCAL_THEMES_DIRECTORY, theme, "theme.json")
                yield json.loads(open(theme_json).read()), files

    def update_registered_theme_with_local_files(self, force=False):
        """
        Update registered themes with local and uploaded files (if s3 storage is disabled).

        :param force:
        :return:
        """
        results = {"created": [], "updated": [], "unchanged": []}

        for theme, files in self.get_local_themes_packages():
            result = self.save_or_update_theme(theme, files, force_update=force)
            results[result.get("status")].append(result.get("theme"))

        return results.get("created"), results.get("updated")

    def _save_theme_file(self, name, theme, upload_path=None):
        if re.search(r"node_modules|.git", name):
            return
        theme_name = theme["name"]
        if not upload_path:
            upload_path = self.get_theme_path(theme_name)

        with open(name, "rb") as file:
            # Set the content type
            mime = magic.Magic(mime=True)
            content_type = mime.from_file(name)
            if content_type == "text/plain" and name.endswith(
                tuple(CONTENT_TYPES.keys())
            ):
                content_type = CONTENT_TYPES[os.path.splitext(name)[1]]

            final_file_name = os.path.join(
                theme_name, os.path.relpath(name, upload_path)
            )

            # TODO: Add version parameter to media_id() after merging related core-changes in amazon_media_storage
            # and desk_media storage.
            version = theme.get("version", True)

            # Remove existing file first.
            app.media.delete(
                app.media.media_id(final_file_name, content_type=content_type)
            )
            # Upload new file.
            file_id = app.media.put(
                file.read(),
                filename=final_file_name,
                content_type=content_type,
                version=version,
            )

            # Add screenshot_url to theme.
            if name.endswith("screenshot.png"):
                theme["screenshot_url"] = superdesk.upload.url_for_media(file_id)

            # Theme needs a theme.json in the root folder. Save the public_url for that theme.
            if name.endswith("theme.json"):
                theme["public_url"] = superdesk.upload.url_for_media(file_id).replace(
                    "theme.json", ""
                )

    def _save_theme_files(self, theme):
        theme_name = theme["name"]
        template_path = self.get_theme_template_filename(theme_name)
        if os.path.exists(template_path):
            with open(template_path) as f:
                theme["template"] = f.read()
        else:
            logger.warning("Template file not found for {} theme.".format(theme_name))

        theme["files"] = {"styles": {}, "scripts": {}, "templates": {}}

        for root, dirs, templates in os.walk(
            self.get_theme_template_filename(theme_name, "templates")
        ):
            for template in templates:
                template_path = self.get_theme_template_filename(
                    theme_name, os.path.join("templates", template)
                )
                if os.path.exists(template_path):
                    with open(template_path) as f:
                        theme["files"]["templates"][mongoencode(template)] = f.read()

        for style in theme.get("styles", []):
            style_path = self.get_theme_template_filename(theme_name, style)
            if os.path.exists(style_path):
                with open(style_path) as f:
                    theme["files"]["styles"][mongoencode(style)] = f.read()
        if theme.get("seoTheme") or theme.get("ampTheme"):
            template_env = self.get_theme_template_env(theme)
            target = self.get_theme_compiled_templates_path(theme_name)
            try:
                template_env.compile_templates(target, ignore_errors=False)
            except Exception:
                logger.exception("Template files compilation failed for {} theme.")

    def _save_theme_settings(self, theme, previous_theme):
        # Get default settings of current theme.
        default_theme_settings = self.get_default_settings(theme)
        default_prev_theme_settings = self.get_default_settings(previous_theme)
        theme_settings = {}

        # Check if theme settings are changed.
        if "settings" in previous_theme:
            options = []
            old_theme_settings = {}
            old_theme = previous_theme.copy()
            # Save the previous theme settings.
            if old_theme.get("options", False):
                options += old_theme.get("options")

            for option in options:
                old_theme_settings[option.get("name")] = option.get("default")
                old_theme_settings.update(theme.get("old_theme_settings", {}))

            # Initialize the theme settings values for the old theme based on the new settings
            # loop over theme settings
            for key, value in old_theme_settings.items():
                if value == default_prev_theme_settings[key]:
                    # If settings of previous theme are the same as the current, we keep them in a new variable
                    theme_settings[key] = value
                else:
                    # Otherwise we keep the settings that are already on the theme.
                    default_theme_settings[key] = default_prev_theme_settings[key]
            theme_settings.update(default_theme_settings)
            theme_settings.update(default_prev_theme_settings)
            theme["settings"] = theme_settings

        return theme_settings, default_theme_settings

    def _set_style_settings(self, theme, previous_theme):
        """
        Extracts the default style settings for the theme and merge them
        with the existing ones (if any)
        """
        style_settings = {}
        key = "styleSettings"

        default_theme_settings = self.get_default_style_settings(theme)
        style_settings.update(default_theme_settings)

        if key in previous_theme:
            prev_theme_settings = previous_theme.get(key, {})
            style_settings.update(prev_theme_settings)

        theme[key] = style_settings

    def save_or_update_theme(
        self, theme, files=[], force_update=False, keep_files=True, upload_path=None
    ):
        theme_name = theme["name"]
        # Save the file in the media storage if needed
        if self.is_s3_storage_enabled:
            for name in files:
                self._save_theme_file(name, theme, upload_path=upload_path)

        # Save theme template and jinja2 compiled templates for SEO themes.
        self._save_theme_files(theme)

        is_local_theme = self.is_local_theme(theme_name)

        # Set tenant_id: None for system themes, current tenant for user-uploaded themes
        if is_local_theme:
            theme["tenant_id"] = None
            previous_theme = self.find_one(req=None, name=theme_name)
        else:
            # User-uploaded themes belong to current tenant
            tenant_id = get_tenant_id(required=False)
            theme["tenant_id"] = tenant_id
            previous_theme = self.find_one(
                req=None, name=theme_name, tenant_id=tenant_id
            )

        if previous_theme:
            self._save_theme_settings(theme, previous_theme)
            self._set_style_settings(theme, previous_theme)
            self.replace(previous_theme["_id"], theme, previous_theme)

            if force_update:
                blogs_updated = self.publish_related_blogs(theme)
                response = dict(
                    status="updated", theme=theme, blogs_updated=blogs_updated
                )
            else:
                response = dict(status="unchanged", theme=theme)
        else:
            if not is_local_theme:
                self.check_themes_limit()

            self.create([theme])
            response = dict(status="created", theme=theme)

        is_temp_upload = (
            self.is_uploaded_theme(theme_name) and self.is_s3_storage_enabled
        )
        if not keep_files and not is_local_theme or is_temp_upload:
            for filename in files:
                os.unlink(filename)

        return response

    def publish_related_blogs(self, theme):
        """
        Publishes related blogs and outputs based on a given theme.

        This function retrieves blogs and outputs that match the specified theme and schedules them for publishing.
        Blogs and outputs are scheduled separately with an incremental countdown to manage the timing of
        their publishing.

        Parameters:
        - theme (dict): A dictionary representing the theme

        Returns:
        - list: A list of blog dictionaries that match the specified theme.
        """

        blogs_service = get_resource_service("blogs")
        outputs_service = get_resource_service("outputs")
        blogs = blogs_service.find({"blog_preferences.theme": theme.get("name")})
        outputs = outputs_service.find({"theme": theme.get("name")})

        step = self._get_publishing_step(theme)

        self._schedule_items(blogs, step, is_blog=True)
        self._schedule_items(outputs, step, is_blog=False)

        return blogs

    def _get_publishing_step(self, theme):
        """
        Determines the publishing step based on theme settings.
        """
        for key in ["seoTheme", "ampTheme"]:
            if theme.get(key):
                return STEPS.get(key)
        return STEPS.get("default")

    def _schedule_items(self, items, step, is_blog, batch_size=10, delay=1):
        """
        Schedules publishing for the given items in manageable batches.

        Scheduling Logic:
        -----------------
        - Items are grouped into batches based on `batch_size` which is 10 by default.
        - `total_batches` is calculated to determine the number of iterations required to cover all items
        to be updated.
        - Within each batch:
            - `publish_blog_embed_on_s3` is called on each item
            - A `countdown` parameter is incremented by `step` seconds between each item to space out
              individual item executions within a batch.
        - After completing each batch, `countdown` is further incremented by `delay` seconds to ensure a gap
          between batches.
        - This logic is added to ensure instances with many blogs do not strain system resources when publishing
        embeds after a theme change
        """
        from liveblog.blogs.tasks import publish_blog_embed_on_s3

        countdown = 1
        items_list = list(items)
        total_batches = ceil(len(items_list) / batch_size)

        for batch_num in range(total_batches):
            batch_items = items_list[
                batch_num * batch_size : (batch_num + 1) * batch_size
            ]

            for item in batch_items:
                if is_blog:
                    args = [item.get("_id")]
                    kwargs = {}
                else:
                    args = [item.get("blog")]
                    kwargs = {"output": item}

                publish_blog_embed_on_s3.apply_async(
                    args=args, kwargs=kwargs, countdown=countdown
                )
                countdown += step

            # Delay the next batch
            countdown += delay

    def check_themes_limit(self, docs=[]):
        """
        Check if creating new themes would exceed the tenant's quota.

        Counts both system themes (globally available) and tenant-specific themes
        against the tenant's custom_themes limit.

        Args:
            docs: List of theme documents being created

        Raises:
            SuperdeskApiError: 403 Forbidden if quota would be exceeded
        """
        if self.is_system_request():
            return

        tenant_id = get_tenant_id(required=True)

        if isinstance(tenant_id, str):
            tenant_id = ObjectId(tenant_id)

        # Count all accessible themes (system + tenant-specific)
        # Must query MongoDB directly to bypass TenantAwareService filtering
        where = {"$or": [{"tenant_id": None}, {"tenant_id": tenant_id}]}

        # Bypass TenantAwareService's query filtering
        cursor = self.backend.find(self.datasource, where)
        current_themes_count = cursor.count() + len(docs)

        if app.features.is_limit_reached("custom_themes", current_themes_count):
            raise SuperdeskApiError.forbiddenError(message="Cannot add another theme.")

    def on_create(self, docs):
        # For system themes, explicitly set tenant_id = None
        # For user themes, leave tenant_id unset and let parent class set it
        for doc in docs:
            if "tenant_id" not in doc:
                theme_name = doc.get("name")
                if theme_name and self.is_local_theme(theme_name):
                    doc["tenant_id"] = None

        has_system_themes = any(
            "tenant_id" in doc and doc["tenant_id"] is None for doc in docs
        )

        if not has_system_themes:
            self.check_themes_limit(docs)

        super().on_create(docs)

    def on_update(self, updates, original):
        """
        Intercept settings/styleSettings updates and route to theme_settings collection.

        When a tenant updates theme settings via PATCH /themes/:id, we store the
        customizations in theme_settings collection (normalized design) instead of
        modifying the theme document itself.

        This keeps theme definitions clean and separates tenant customizations.

        TODO MIGRATION: For existing single-tenant instances upgrading to multi-tenancy:
        Migrate existing theme customizations from themes.settings/styleSettings to
        theme_settings collection. See MIGRATION_GUIDE.md for details.
        """
        settings = updates.pop("settings", None)
        style_settings = updates.pop("styleSettings", None)

        settings_updated = settings is not None or style_settings is not None

        if settings_updated:
            if not self.is_system_request():
                tenant_id = get_tenant_id(required=True)
                theme_settings_service = get_resource_service("theme_settings")

                theme_settings_service.save_or_update_settings(
                    theme_name=original["name"],
                    tenant_id=tenant_id,
                    settings_payload=settings if settings is not None else {},
                    style_settings_payload=style_settings
                    if style_settings is not None
                    else {},
                )

                updates["_settings_updated"] = True

        super().on_update(updates, original)

    def on_updated(self, updates, original):
        if updates.pop("_settings_updated", False):
            self.publish_related_blogs(original)

    def on_delete(self, deleted_theme):
        if deleted_theme.get("tenant_id") is None:
            raise SuperdeskApiError.forbiddenError("System themes cannot be deleted")

        global_default_theme = get_resource_service(
            "global_preferences"
        ).get_global_prefs()["theme"]
        # Raise an exception if the removed theme is the default one.
        if deleted_theme["name"] == global_default_theme:
            raise SuperdeskApiError.forbiddenError(
                "This theme is marked as default and cannot be removed"
            )

        # Raise an exception if the removed theme has children.
        if self.get(req=None, lookup={"extends": deleted_theme["name"]}).count() > 0:
            raise SuperdeskApiError.forbiddenError(
                "This theme has child themes and cannot be removed"
            )

        # Update blogs in the same tenant using the removed theme
        # Only tenant themes can be deleted (checked above), so we only need to
        # reassign blogs in the same tenant
        blogs_service = get_resource_service("blogs")
        theme_tenant_id = deleted_theme.get("tenant_id")

        # Query only blogs with same tenant_id as the deleted theme
        lookup = {
            "blog_preferences.theme": deleted_theme["name"],
            "tenant_id": theme_tenant_id,
        }

        blogs = blogs_service.find(lookup)
        for blog in blogs:
            blog["blog_preferences"]["theme"] = global_default_theme
            blogs_service.system_update(
                ObjectId(blog["_id"]),
                {"blog_preferences": blog["blog_preferences"]},
                blog,
            )

    def get_dependencies(self, theme_name, deps=[]):
        """
        Return a list of the dependencies names.

        :param theme_name:
        :param deps:
        :return:
        """
        deps.append(theme_name)
        theme = self.find_one(req=None, name=theme_name)
        if not theme:
            raise SuperdeskError(400, "Dependencies are not satisfied")

        if theme and theme.get("extends", False):
            self.get_dependencies(theme.get("extends"), deps)

        return deps

    def get_children(self, theme_name, response=[]):
        """
        Return theme childern.

        :param theme_name:
        :param response:
        :return:
        """
        for theme in self.get(req=None, lookup={"extends": theme_name}):
            response.append(theme.get("name"))
            self.get_children(theme.get("name"))

        return list(set(response))


@upload_theme_blueprint.route("/theme-redeploy/<theme_name>", methods=["GET"])
@cross_origin()
def redeploy_a_theme(theme_name):
    themes_service = get_resource_service("themes")
    theme = themes_service.find_one(req=None, name=theme_name)
    if not theme:
        error_message = 'Themes: "{}" this theme is not registered.'.format(theme_name)
        logger.info(error_message)
        raise UnknownTheme(error_message)
    assets = themes_service.get_local_themes_packages()
    theme, files = next(
        (theme, files) for theme, files in assets if theme["name"] == theme_name
    )
    result = themes_service.save_or_update_theme(theme, files, force_update=True)
    return json.dumps(
        dict(_status="OK", _action=result.get("status"), theme=theme_name),
        cls=MongoJSONEncoder,
    )


@upload_theme_blueprint.route("/theme-download/<theme_name>", methods=["GET"])
@cross_origin()
def download_a_theme(theme_name):
    themes = get_resource_service("themes")
    theme = themes.find_one(req=None, name=theme_name)
    if not theme:
        error_message = 'Themes: "{}" this theme is not registered.'.format(theme_name)
        logger.info(error_message)
        raise UnknownTheme(error_message)

    zip_folder = "lb-theme-{}-{}".format(theme_name, theme.get("version", "master"))

    def _response(theme_filepath):
        theme_zip = BytesIO()
        # keep the same nameing convention as we have in github.
        with zipfile.ZipFile(theme_zip, "w") as tz:
            # add all the files from the theme folder
            for root, dirs, files in os.walk(theme_filepath):
                # compile the root for zip.
                zip_root = root.replace(theme_filepath, zip_folder)
                # add dir itself (needed for empty dirs)
                tz.write(os.path.join(root, "."), os.path.join(zip_root, "."))
                for file in files:
                    # compile the path in the zip for the file.
                    tz.write(os.path.join(root, file), os.path.join(zip_root, file))

        response = make_response(theme_zip.getvalue(), 200)
        response.headers["Cache-Control"] = "no-cache"
        response.headers["Content-Type"] = "application/zip"
        response.headers["Content-Disposition"] = "attachment; filename={}.zip".format(
            zip_folder
        )
        # response.headers['X-Accel-Redirect'] = '{}.zip'.format(zip_folder)
        return response

    is_local = themes.is_local_theme(theme_name) or themes.is_uploaded_theme(theme_name)
    if themes.is_s3_storage_enabled and not is_local:
        return "Theme .zip download is not available!", 404
    else:
        theme_filepath = themes.get_theme_path(theme_name)
        return _response(theme_filepath)


def register_a_theme(zip_archive):
    themes_service = get_resource_service("themes")

    with zipfile.ZipFile(zip_archive) as zip_file:
        # Keep only actual files (not folders)
        files = [file for file in zip_file.namelist() if not file.endswith("/")]

        # Determine if there is a root folder
        roots = set(file.split("/")[0] for file in files)
        root_folder = len(roots) == 1 and "%s/" % roots.pop() or ""

        # Check if it has a theme.json in the root folder.
        theme_json = next(
            (file for file in files if file.lower() == ("%stheme.json" % root_folder)),
            None,
        )
        if theme_json is None:
            return json.dumps(dict(error="A theme needs a theme.json file")), 400

        # Decode and load as a json file
        theme_json = json.loads(zip_file.read(theme_json).decode("utf-8"))
        theme_name = theme_json.get("name")
        if not theme_name:
            return json.dumps({"error": "No name specified in theme.json file."}), 400

        # Check if uploaded theme with the given name already exists.
        if theme_name in system_themes:
            return (
                json.dumps(
                    {
                        "error": "A theme with the given name ({}) already exists!".format(
                            theme_name
                        )
                    }
                ),
                400,
            )

        # Check dependencies.
        extends = theme_json.get("extends")
        if extends:
            if extends == theme_name:
                return (
                    json.dumps(
                        {
                            "error": "Uploaded theme {} cannot extend itself!".format(
                                theme_name
                            )
                        }
                    ),
                    400,
                )

            if not themes_service.find_one(req=None, name=extends):
                return (
                    json.dumps(
                        {"error": "Parent theme ({}) does not exists!".format(extends)}
                    ),
                    400,
                )

            try:
                themes_service.get_dependencies(extends)
            except SuperdeskError as e:
                return json.dumps(dict(error=e.desc)), 400

        # Extract and save files
        upload_path = os.path.join(UPLOAD_THEMES_DIRECTORY, theme_name)
        extracted_files = []
        for name in files:
            # Remove the root folder
            local_filepath = name.replace(root_folder, "", 1)
            # Prepend in a root folder called as the theme's name
            local_filepath = os.path.join(upload_path, local_filepath)
            # Create folder if doesn't exist
            os.makedirs(os.path.dirname(local_filepath), exist_ok=True)
            # Write the file
            with open(local_filepath, "wb") as file_in_local_storage:
                file_in_local_storage.write(zip_file.read(name))
                extracted_files.append(local_filepath)

        # Save or update the theme in the database
        result = themes_service.save_or_update_theme(
            theme_json,
            extracted_files,
            force_update=True,
            keep_files=not themes_service.is_s3_storage_enabled,
            upload_path=upload_path,
        )
        return result, theme_json


@upload_theme_blueprint.route("/theme-upload", methods=["POST"])
@cross_origin()
def upload_a_theme():
    result, theme_json = register_a_theme(request.files["media"])

    if "error" in result:
        result = json.loads(result)
        return api_error(result.get("error"), theme_json)

    return json.dumps(
        dict(_status="OK", _action=result.get("status"), theme=theme_json),
        cls=MongoJSONEncoder,
    )
