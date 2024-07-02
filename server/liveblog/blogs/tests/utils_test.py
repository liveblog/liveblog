import pytest
from ..utils import build_blog_public_url, get_blog_path


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


def test_get_blog_path_with_all_params():
    blog_id = "123"
    theme = "dark"
    output_id = "456"
    expected_url = "blogs/123/dark/456/index.html"

    assert get_blog_path(blog_id, theme, output_id) == expected_url


def test_get_blog_path_without_output_id():
    blog_id = "123"
    theme = None
    output_id = None
    expected_url = "blogs/123/index.html"

    assert get_blog_path(blog_id, theme, output_id) == expected_url
