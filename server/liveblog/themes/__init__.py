import superdesk
from liveblog.themes.themes import ThemesService, ThemesResource


def init_app(app):
    endpoint_name = 'themes'
    service = ThemesService(endpoint_name, backend=superdesk.get_backend())
    ThemesResource(endpoint_name, app=app, service=service)
