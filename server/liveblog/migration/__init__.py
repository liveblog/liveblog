"""One-off data migrations for instances upgrading across a release boundary.

Only needed when upgrading from 3.x; the whole package can be removed once no
supported release path starts there.
"""
import superdesk

from .migrate_tenancy import MigrateTenancyCommand


def init_app(app):
    superdesk.command("liveblog:migrate_tenancy", MigrateTenancyCommand())
