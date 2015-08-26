import superdesk
from liveblog.themes.themes import ThemesService, ThemesResource
from liveblog.themes.upload_themes import ImportThemesResource, ImportThemesService


def init_app(app):
    endpoint_name = 'themes'
    service = ThemesService(endpoint_name, backend=superdesk.get_backend())
    ThemesResource(endpoint_name, app=app, service=service)
    
    endpoint_name = 'upload_themes'
    service = ImportThemesService(endpoint_name, backend=superdesk.get_backend())
    ImportThemesResource(endpoint_name, app=app, service=service)
