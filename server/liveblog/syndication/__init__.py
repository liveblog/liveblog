import superdesk
from .consumer import ConsumerService, ConsumerResource, ConsumerContactService, ConsumerContactResource


def init_app(app):
    endpoint_name = 'consumers'
    service = ConsumerService(endpoint_name, backend=superdesk.get_backend())
    ConsumerResource(endpoint_name, app=app, service=service)

    endpoint_name = 'consumers_contacts'
    service = ConsumerContactService(endpoint_name, backend=superdesk.get_backend())
    ConsumerContactResource(endpoint_name, app=app, service=service)


superdesk.privilege(name='consumers', label='Consumers Management', description='User can manage consumers')
