import os
import jinja2
import unittest
import json


ROOT_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), '..'))
TEST_OPTIONS = os.path.join(ROOT_DIR, 'test', 'options.json')
TEST_RESPONSE = os.path.join(ROOT_DIR, 'test', 'api_response.json')
TEMPLATE_DIR = os.path.join(ROOT_DIR, 'templates')
TEMPLATE_NAME = os.path.join(ROOT_DIR, 'template.html')


class TestTemplate(unittest.TestCase):
    """
    This test is used to check if python-based jinja2 renderer is
    able to render nunjucks templates used by theme JS client.

    TODO: import and add custom jinja2 filters from liveblog.
    """
    def setUp(self):
        loader = jinja2.Environment(
            loader=jinja2.FileSystemLoader(TEMPLATE_DIR)
        )
        with open(TEMPLATE_NAME) as f:
            self.template = loader.from_string(f.read())
        with open(TEST_OPTIONS) as f:
            options = json.load(f)
        with open(TEST_RESPONSE) as f:
            api_response = json.load(f)

        # TODO: options is bad and confusing as name for test data, change it.
        data = {
            'posts': api_response['posts'],
            'stickyPosts': {}
        }
        self.context = {
            'blog': options['blog'],
            'output': options['blog']['output'],
            'options': options,
            'json_options': json.dumps(options),
            'settings': options['settings'],
            'api_response': data,
            'include_js_options': True,
            'debug': False
        }

    def test_template_render(self):
        content = self.template.render(self.context)
        self.assertIsInstance(content, str)


if __name__ == '__main__':
    unittest.main()
