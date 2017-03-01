import superdesk
from .analytics import AnalyticsResource, AnalyticsService, BlogAnalyticsResource, BlogAnalyticsService


def init_app(app):
    # Analytics
    endpoint_name = 'analytics'
    service = AnalyticsService(endpoint_name, backend=superdesk.get_backend())
    AnalyticsResource(endpoint_name, app=app, service=service)

    # Blog Analytics
    endpoint_name = 'blog_analytics'
    service = BlogAnalyticsService(endpoint_name, backend=superdesk.get_backend())
    BlogAnalyticsResource(endpoint_name, app=app, service=service)


superdesk.privilege(name='analytics', label='Analytics Management', description='User can manage analytics')
