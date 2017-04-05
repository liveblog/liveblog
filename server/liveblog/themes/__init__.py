import superdesk
from .themes import ThemesService, ThemesResource
from .themes import upload_theme_blueprint, themes_assets_blueprint
from .themes import UnknownTheme

__all__ = ['upload_theme_blueprint', 'ThemesService', 'ThemesResource', 'ASSETS_DIR', 'UnknownTheme']


def init_app(app):
    endpoint_name = 'themes'
    service = ThemesService(endpoint_name, backend=superdesk.get_backend())
    ThemesResource(endpoint_name, app=app, service=service)
    # endpoint for uploading a theme
    app.register_blueprint(upload_theme_blueprint, url_prefix=app.api_prefix or None)
    # endpoint to serve static files for themes
    app.register_blueprint(themes_assets_blueprint)
