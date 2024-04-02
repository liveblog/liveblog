import pytest
from ..utils import build_blog_public_url


@pytest.fixture
def mock_app():
    class MockApp:
        config = {"SERVER_NAME": "liveblog.pro", "EMBED_PROTOCOL": "https://"}

    return MockApp()


def test_build_blog_public_url_with_all_params(mock_app):
    blog_id = "123"
    theme = "dark"
    output_id = "456"
    expected_url = "https://liveblog.pro/embed/123/456/theme/dark"

    assert build_blog_public_url(mock_app, blog_id, theme, output_id) == expected_url


def test_build_blog_public_url_without_output_id(mock_app):
    blog_id = "123"
    theme = "light"
    expected_url = "https://liveblog.pro/embed/123"

    assert build_blog_public_url(mock_app, blog_id, theme) == expected_url
