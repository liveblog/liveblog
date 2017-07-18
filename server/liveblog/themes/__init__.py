import superdesk
from .themes import ThemesService, ThemesResource
from .themes import upload_theme_blueprint, themes_assets_blueprint
from .themes import UnknownTheme
from .commands import RegisterLocalThemesCommand
from .utils import send_uploaded_static_file

__all__ = ['upload_theme_blueprint', 'ThemesService', 'ThemesResource', 'UnknownTheme']


def init_app(app):
    endpoint_name = 'themes'
    service = ThemesService(endpoint_name, backend=superdesk.get_backend())
    ThemesResource(endpoint_name, app=app, service=service)
    # endpoint for uploading a theme
    app.register_blueprint(upload_theme_blueprint, url_prefix=app.api_prefix or None)
    # endpoint to serve static files for themes
    app.register_blueprint(themes_assets_blueprint)
    # Additional endpoint to serve uploaded themes (used when s3 storage is disabled)
    app.add_url_rule('/themes_uploads/<path:filename>', endpoint='themes_uploads.static',
                     view_func=send_uploaded_static_file(app))
    # Register local themes command.
    superdesk.command('register_local_themes', RegisterLocalThemesCommand())
