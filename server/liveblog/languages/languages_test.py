import liveblog.languages as languages
from superdesk.tests import TestCase
from superdesk import get_resource_service


class ClientModuleTest(TestCase):
    def setUp(self):
        languages.init_app(self.app)
        self.languages_service = get_resource_service('languages')
        self.languages_doc = [{"language_code": "de"}]

    def test_on_create(self):
        response = self.languages_service.on_create(self.languages_doc)
        self.assertIsNotNone(response.get("name"), True)
