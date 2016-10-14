import superdesk
from .consumer import ConsumerService, ConsumerResource


def init_app(app):
    endpoint_name = 'consumers'
    service = ConsumerService(endpoint_name, backend=superdesk.get_backend())
    ConsumerResource(endpoint_name, app=app, service=service)


superdesk.privilege(name='consumers', label='Consumers Management', description='User can manage consumers')
