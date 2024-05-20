import superdesk
from liveblog.polls.polls import (
    BlogPollsResource,
    BlogPollsService,
    PollsResource,
    PollsService,
)


def init_app(app):
    endpoint_name = "polls"

    service = PollsService(endpoint_name, backend=superdesk.get_backend())
    PollsResource(endpoint_name, app=app, service=service)

    endpoint_name = "blog_polls"
    service = BlogPollsService(endpoint_name, backend=superdesk.get_backend())
    BlogPollsResource(endpoint_name, app=app, service=service)
