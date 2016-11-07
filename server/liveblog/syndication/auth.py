from flask import request, abort
from superdesk.resource import Resource
from superdesk import get_resource_service


class ConsumerApiKeyAuth:
    def authorized(self, allowed_roles, resource, method=None):
        auth_token = request.headers.get('Authorization')
        return auth_token and self.check_auth(auth_token, allowed_roles, resource, method)

    def authenticate(self):
        """ Returns a standard a 401."""
        abort(401, description='Please provide proper credentials')

    def check_auth(self, auth_token, allowed_roles, resource, method):
        return get_resource_service('consumers').find_one(api_key=auth_token, req=None)


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
