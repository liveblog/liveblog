import logging

import pymongo
import superdesk
from bson import ObjectId
from bson.errors import InvalidId
from flask import current_app as app
from superdesk import get_resource_service

from liveblog.system_themes import system_themes

logger = logging.getLogger(__name__)

# Mongo collections whose documents are tenant scoped. Every document in them that
# predates multi-tenancy has no tenant_id and is therefore invisible to the
# TenantAwareService filters until it is assigned to a tenant.
TENANT_SCOPED_COLLECTIONS = (
    "users",
    "blogs",
    "archive",
    "polls",
    "post_comments",
    "freetypes",
    "analytics",
    "advertisements",
    "collections",
    "outputs",
    "theme_settings",
    "consumers",
    "producers",
    "syndication_out",
    "syndication_in",
)

# (mongo collection, resource whose elastic index holds it). Posts and items share
# the archive collection and the archive doc type, so indexing through `posts`
# covers both.
ELASTIC_REINDEX = (
    ("blogs", "blogs"),
    ("archive", "posts"),
)

MISSING_TENANT = {"tenant_id": None}
REINDEX_PAGE_SIZE = 500


class MigrateTenancyCommand(superdesk.Command):
    """Assign the documents of a pre-multi-tenancy instance to one tenant.

    Backfills `tenant_id` on every tenant scoped collection, marks the bundled
    themes as system themes (`tenant_id` null), links the tenant to its first
    administrator and re-indexes blogs and archive in Elasticsearch so the tenant
    filters there see the new field. Documents that already have a tenant are
    left alone, so the command can be re-run; with several tenants it only asks
    for `--tenant-id` while unassigned documents remain.

    Example:
    ::

        $ python manage.py liveblog:migrate_tenancy --dry-run
        $ python manage.py liveblog:migrate_tenancy --tenant-name "Acme News"
        $ python manage.py liveblog:migrate_tenancy --tenant-id 5f0c...
    """

    option_list = [
        superdesk.Option(
            "--dry-run",
            action="store_true",
            dest="dry_run",
            help="Report what would change without writing anything",
        ),
        superdesk.Option(
            "--tenant-id",
            dest="tenant_id",
            help="Existing tenant to assign the documents to",
        ),
        superdesk.Option(
            "--tenant-name",
            dest="tenant_name",
            default="Default Tenant",
            help="Name for the tenant created when the instance has none",
        ),
        superdesk.Option(
            "--subscription-level",
            dest="subscription_level",
            default="network",
            help="Subscription level for a created tenant (default: network)",
        ),
        superdesk.Option(
            "--skip-elastic",
            action="store_true",
            dest="skip_elastic",
            help="Do not re-index blogs and archive in Elasticsearch",
        ),
    ]

    def run(
        self,
        dry_run=False,
        tenant_id=None,
        tenant_name="Default Tenant",
        subscription_level="network",
        skip_elastic=False,
    ):
        prefix = "[dry run] " if dry_run else ""
        tenant = self._resolve_tenant(
            tenant_id, tenant_name, subscription_level, dry_run
        )
        if tenant is None:
            print(
                "{}Nothing to migrate: every document already has a tenant".format(
                    prefix
                )
            )
            return {}
        print("{}Using tenant {} ({})".format(prefix, tenant["name"], tenant["_id"]))

        summary = {}
        for collection in TENANT_SCOPED_COLLECTIONS:
            summary[collection] = self._backfill(collection, tenant["_id"], dry_run)
            print("{}{}: {} documents".format(prefix, collection, summary[collection]))

        summary["themes"] = self._backfill_themes(tenant["_id"], dry_run)
        print(
            "{}themes: {} custom, {} system".format(
                prefix, summary["themes"]["custom"], summary["themes"]["system"]
            )
        )

        summary["theme_settings_moved"] = self._move_theme_customizations(
            tenant["_id"], dry_run
        )
        print(
            "{}theme customizations moved to theme_settings: {}".format(
                prefix, summary["theme_settings_moved"]
            )
        )

        if not tenant.get("owner_user_id"):
            owner = self._link_owner(tenant, dry_run)
            print(
                "{}owner: {}".format(
                    prefix, owner["username"] if owner else "no administrator found"
                )
            )

        if skip_elastic or dry_run:
            print("{}elastic: skipped".format(prefix))
        else:
            for collection, resource in ELASTIC_REINDEX:
                count = self._reindex(collection, resource)
                print("elastic {}: {} documents re-indexed".format(resource, count))

        return summary

    def _resolve_tenant(self, tenant_id, tenant_name, subscription_level, dry_run):
        tenants_service = get_resource_service("tenants")

        if tenant_id:
            try:
                tenant = tenants_service.find_one(req=None, _id=ObjectId(tenant_id))
            except InvalidId:
                tenant = None
            if not tenant:
                raise SystemExit("Tenant {} does not exist".format(tenant_id))
            return tenant

        tenants = list(tenants_service.get(req=None, lookup={}))
        if len(tenants) == 1:
            return tenants[0]
        if len(tenants) > 1:
            if not self._has_unassigned_documents():
                return None
            raise SystemExit(
                "The instance has {} tenants, pass --tenant-id to pick one: {}".format(
                    len(tenants),
                    ", ".join("{} ({})".format(t["name"], t["_id"]) for t in tenants),
                )
            )

        tenant = {
            "name": tenant_name,
            "subscription_level": subscription_level,
            "settings": {},
        }
        if dry_run:
            tenant["_id"] = "<new>"
            return tenant
        tenant["_id"] = tenants_service.post([tenant])[0]
        return tenant

    def _collection(self, name):
        return app.data.mongo.pymongo().db[name]

    def _has_unassigned_documents(self):
        for collection in TENANT_SCOPED_COLLECTIONS:
            if self._collection(collection).count_documents(MISSING_TENANT, limit=1):
                return True
        custom_without_tenant = {
            "name": {"$nin": list(system_themes)},
            "tenant_id": None,
        }
        return bool(
            self._collection("themes").count_documents(custom_without_tenant, limit=1)
        )

    def _backfill(self, collection, tenant_id, dry_run):
        coll = self._collection(collection)
        if dry_run:
            return coll.count_documents(MISSING_TENANT)
        return coll.update_many(
            MISSING_TENANT, {"$set": {"tenant_id": tenant_id}}
        ).modified_count

    def _backfill_themes(self, tenant_id, dry_run):
        coll = self._collection("themes")
        system_filter = {
            "name": {"$in": list(system_themes)},
            "tenant_id": {"$exists": False},
        }
        custom_filter = {"name": {"$nin": list(system_themes)}, "tenant_id": None}
        if dry_run:
            return {
                "system": coll.count_documents(system_filter),
                "custom": coll.count_documents(custom_filter),
            }
        return {
            "system": coll.update_many(
                system_filter, {"$set": {"tenant_id": None}}
            ).modified_count,
            "custom": coll.update_many(
                custom_filter, {"$set": {"tenant_id": tenant_id}}
            ).modified_count,
        }

    def _move_theme_customizations(self, tenant_id, dry_run):
        """Move legacy `settings`/`styleSettings` off the theme documents.

        Before multi-tenancy the editor saved theme customizations on the theme
        itself. They now live in `theme_settings` per tenant, and whatever is left
        on a system theme document acts as a default for every tenant, so the
        values are copied to the tenant's `theme_settings` entry and removed from
        the theme. Themes that already have an entry for the tenant keep it.
        """
        coll = self._collection("themes")
        legacy_filter = {
            "tenant_id": {"$in": [None, tenant_id]},
            "$or": [
                {"settings": {"$exists": True, "$nin": [{}, None]}},
                {"styleSettings": {"$exists": True, "$nin": [{}, None]}},
            ],
        }
        if dry_run:
            return coll.count_documents(legacy_filter)

        # Outside a request context TenantAwareService neither filters nor stamps
        # tenant_id, so both are passed explicitly here.
        moved = 0
        theme_settings_service = get_resource_service("theme_settings")
        for theme in coll.find(legacy_filter):
            existing = theme_settings_service.find_one(
                req=None, tenant_id=tenant_id, theme_name=theme["name"]
            )
            if not existing:
                theme_settings_service.post(
                    [
                        {
                            "tenant_id": tenant_id,
                            "theme_name": theme["name"],
                            "settings": theme.get("settings") or {},
                            "style_settings": theme.get("styleSettings") or {},
                        }
                    ]
                )
            coll.update_one(
                {"_id": theme["_id"]},
                {"$unset": {"settings": "", "styleSettings": ""}},
            )
            moved += 1
        return moved

    def _link_owner(self, tenant, dry_run):
        owner_filter = {"user_type": "administrator"}
        if not dry_run:
            owner_filter["tenant_id"] = tenant["_id"]
        owner = self._collection("users").find_one(
            owner_filter, sort=[("_created", pymongo.ASCENDING)]
        )
        if owner and not dry_run:
            get_resource_service("tenants").system_update(
                tenant["_id"], {"owner_user_id": owner["_id"]}, tenant
            )
        return owner

    def _reindex(self, collection, resource):
        coll = self._collection(collection)
        backend = app.data._search_backend(resource)
        total = 0
        last_id = None
        while True:
            query = {"_id": {"$gt": last_id}} if last_id else {}
            docs = list(
                coll.find(query).sort("_id", pymongo.ASCENDING).limit(REINDEX_PAGE_SIZE)
            )
            if not docs:
                return total
            success, failed = backend.bulk_insert(resource, docs)
            if failed:
                raise SystemExit(
                    "Elastic bulk insert into {} failed for {} documents: {}".format(
                        resource, len(failed), failed[:3]
                    )
                )
            total += success
            last_id = docs[-1]["_id"]
