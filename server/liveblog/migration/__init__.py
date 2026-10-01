import superdesk

from .migrate_tenancy import MigrateTenancyCommand


def init_app(app):
    superdesk.command("liveblog:migrate_tenancy", MigrateTenancyCommand())
