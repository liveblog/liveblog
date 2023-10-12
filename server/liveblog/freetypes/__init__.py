import superdesk
from liveblog.freetypes.freetypes import FreetypesResource, FreetypesService
from .commands import RegisterFreetypeCommand


def init_app(app):
    endpoint_name = "freetypes"
    service = FreetypesService(endpoint_name, backend=superdesk.get_backend())
    FreetypesResource(endpoint_name, app=app, service=service)

    superdesk.command("register_freetype", RegisterFreetypeCommand())


superdesk.privilege(
    name="freetypes_create",
    label="Freetypes management",
    description="User can add new freetypes",
)

superdesk.privilege(
    name="freetypes_read",
    label="Freetypes management",
    description="User can access the list of freetypes",
)

superdesk.privilege(
    name="freetypes_update",
    label="Freetypes management",
    description="User can update existent freetypes",
)

superdesk.privilege(
    name="freetypes_delete",
    label="Freetypes management",
    description="User can delete freetypes",
)
