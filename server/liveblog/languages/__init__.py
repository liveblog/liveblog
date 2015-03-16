import superdesk
from liveblog.languages.languages import LanguagesService, LanguagesResource


def init_app(app):
    endpoint_name = 'languages'
    service = LanguagesService(endpoint_name, backend=superdesk.get_backend())
    LanguagesResource(endpoint_name, app=app, service=service)
