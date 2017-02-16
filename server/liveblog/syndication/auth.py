from eve.auth import BasicAuth
from flask import abort, request
from superdesk import get_resource_service
from superdesk.resource import Resource


class SyndicationTokenAuth(BasicAuth):
    token_field = None
    resource_name = None

    def __init__(self, token_field=None, resource_name=None):
        self.token_field = self.token_field or token_field
        self.resource_name = self.resource_name or resource_name

        if not self.token_field or not self.resource_name:
            abort(501, description='Not implemented')

    def authorized(self, allowed_roles, resource, method=None):
        auth_token = request.headers.get('Authorization')
        return auth_token and self.check_auth(auth_token, allowed_roles, resource, method)

    def authenticate(self):
        """ Returns a standard a 401."""
        abort(401, description='Please provide proper credentials')

    def check_auth(self, auth_token, allowed_roles, resource, method):
        return get_resource_service(self.resource_name).find_one(req=None, **{self.token_field: auth_token})


class ConsumerApiKeyAuth(SyndicationTokenAuth):
    resource_name = 'consumers'
    token_field = 'api_key'


class ConsumerBlogTokenAuth(SyndicationTokenAuth):
    resource_name = 'syndication_in'
    token_field = 'blog_token'


class CustomAuthResource(Resource):
    """ This has been added as superdesk.resource.Resource doesnt support endpoint-level authentication.
    TODO: make pull-request for superdesk-core then remove this class when approved.
    """
    def __init__(self, endpoint_name, app, service, endpoint_schema=None):
        super().__init__(endpoint_name, app, service, endpoint_schema=endpoint_schema)
        authentication = getattr(self, 'authentication', None)
        if authentication:
            # Add endpont-level auth to endpoint_schema attribute and register the resource again.
            self.endpoint_schema['authentication'] = authentication
            app.register_resource(self.endpoint_name, self.endpoint_schema)
