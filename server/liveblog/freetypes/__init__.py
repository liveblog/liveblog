import superdesk
from liveblog.freetypes.freetypes import FreetypesResource, FreetypesService
from .commands import RegisterFreetypeCommand


def init_app(app):
    endpoint_name = 'freetypes'
    service = FreetypesService(endpoint_name, backend=superdesk.get_backend())
    FreetypesResource(endpoint_name, app=app, service=service)

    superdesk.command('register_freetype', RegisterFreetypeCommand())
