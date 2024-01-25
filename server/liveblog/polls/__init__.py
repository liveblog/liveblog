from liveblog.polls.polls import (
    PollsResource,
    PollsService, 
)
import superdesk
from superdesk import get_backend


def init_app(app):
    endpoint_name = "polls"

    service = PollsService(endpoint_name, backend=superdesk.get_backend())
    PollsResource(endpoint_name, app=app, service=service)
