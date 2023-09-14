import pytest
from datetime import datetime
from .utils import get_base_image, get_modified_date, get_post_author, generate_schema_for


class TestGetModifiedDate:
    def test_get_modified_date_with_last_updated_post(self):
        mock_blog = {
            'last_updated_post': {
                '_updated': '2023-06-27'
            },
            'start_date': '2023-06-01'
        }
        result = get_modified_date(mock_blog)
        assert result == '2023-06-27'

    def test_get_modified_date_without_last_updated_post(self):
        mock_blog = {
            'start_date': '2023-06-01'
        }
        result = get_modified_date(mock_blog)
        assert result == '2023-06-01'


class TestGetBaseImage:
    def test_get_base_image_with_base_image(self):
        item = {'meta': {'media': {'renditions': {'baseImage': 'https://example.com/image.jpg'}}}}
        result = get_base_image(item)
        assert result == 'https://example.com/image.jpg'

    def test_get_base_image_without_base_image(self):
        item = {'meta': {'media': {}}}
        assert get_base_image(item) is None

    def test_get_base_image_with_empty_renditions(self):
        item = {'meta': {'media': {'renditions': {}}}}
        assert get_base_image(item) is None

    def test_get_base_image_with_missing_meta(self):
        item = {}
        assert get_base_image(item) is None


class TestGetPostAuthor:
    def test_returns_none_if_no_author(self):
        post = {}
        main_post_item = {}
        theme_settings = {}

        result = get_post_author(post, main_post_item, theme_settings)

        assert result is None

    def test_returns_syndicated_author_if_enabled(self):
        post = {'syndication_in': True}
        main_post_item = {'syndicated_creator': {'display_name': 'Syndicated Author'}}
        theme_settings = {'showSyndicatedAuthor': True}

        result = get_post_author(post, main_post_item, theme_settings)

        assert result.name == 'Syndicated Author'

    def test_returns_original_creator_if_present(self):
        post = {'original_creator': {'display_name': 'Original Author'}}
        main_post_item = {}
        theme_settings = {'authorNameFormat': 'display_name'}

        result = get_post_author(post, main_post_item, theme_settings)

        assert result.name == 'Original Author'

    def test_returns_publisher_if_present(self):
        post = {}
        main_post_item = {'publisher': {'display_name': 'Publisher'}}
        theme_settings = {}

        result = get_post_author(post, main_post_item, theme_settings)

        assert result.name == 'Publisher'


class TestGenerateSchemaFor:
    def test_empty_posts(self):
        blog = {
            'title': 'Test Blog',
            'description': 'A test blog',
            'start_date': '2022-01-01',
            'picture_renditions': {'baseImage': 'https://example.com/image.jpg'}
        }
        posts = []

        result = generate_schema_for(blog, posts)
        assert result == ""

    def test_single_post(self):
        blog = {
            'title': 'Test Blog',
            'description': 'A test blog',
            'start_date': datetime(2022, 1, 1),
            'picture_renditions': {'baseImage': {'href': 'https://example.com/image.jpg', 'width': 100, 'height': 100}},
        }
        post = {
            'title': 'Test Post',
            'description': 'A test post',
            'start_date': datetime(2022, 1, 1),
            'groups': [
                {'id': 'root'},
                {
                    'id': 'main',
                    'refs': [
                        {
                            'item': {
                                'item_type': 'text',
                                'text': 'Test post body',
                                'published_date': datetime(2022, 1, 1),
                            }
                        },
                        {
                            'item': {
                                'item_type': 'image',
                                'meta': {
                                    'media': {
                                        'renditions': {
                                            'baseImage': {
                                                'href': 'https://example.com/post-image.jpg',
                                                'width': 100, 'height': 100
                                            }
                                        }
                                    }
                                },
                            }
                        }
                    ]
                }
            ]
        }
        posts = [post]

        result = generate_schema_for(blog, posts)

        print(result)

        assert result != ""
        assert '"@type": "LiveBlogPosting"' in result
        assert '"@type": "BlogPosting"' in result
        assert '"headline": "Test Blog"' in result
        assert '"description": "A test blog"' in result
        assert '"datePublished": "2022-01-01T00:00:00"' in result

    @pytest.mark.skip(reason="Not implemented yet")
    def test_multiple_posts(self):
        blog = {
            'title': 'Test Blog',
            'description': 'A test blog',
            'start_date': '2022-01-01',
            'picture_renditions': {'baseImage': 'https://example.com/image.jpg'}
        }
        post1 = {
            'title': 'Test Post 1',
            'description': 'A test post',
            'start_date': '2022-01-02',
            'meta': {'media': {'renditions': {'baseImage': 'https://example.com/post1-image.jpg'}}},
            'related_items': [{'type': 'text', 'text': 'Test post 1 body'}]
        }
        post2 = {
            'title': 'Test Post 2',
            'description': 'A test post',
            'start_date': '2022-01-03',
            'meta': {'media': {'renditions': {'baseImage': 'https://example.com/post2-image.jpg'}}},
            'related_items': [{'type': 'text', 'text': 'Test post 2 body'}]
        }
        posts = [post1, post2]

        result = generate_schema_for(blog, posts)

        assert result != ""
        assert '"@type": "LiveBlogPosting"' in result
        assert '"@type": "BlogPosting"' in result
        assert '"headline": "Test Blog"' in result
        assert '"description": "A test blog"' in result
        assert '"datePublished": "2022-01-01"' in result
        assert '"dateModified": "2022-01-03"' in result
        assert '"url": "https://example.com/blog/to-be-collected.html"' in result
        assert '"@type": "ImageObject"' in result
        assert '"url": "https://example.com/image.jpg"' in result
        assert '"@type": "LiveBlogUpdate"' in result
        assert '"@type": "BlogPosting"' in result
        assert '"headline": "Test Post 1"' in result
        assert '"description": "A test post"' in result
        assert '"datePublished": "2022-01-02"' in result
        assert '"@type": "ImageObject"' in result
        assert '"url": "https://example.com/post1-image.jpg"' in result
        assert '"articleBody": "Test post 1 body"' in result
        assert '"@type": "LiveBlogUpdate"' in result
        assert '"@type": "BlogPosting"' in result
        assert '"headline": "Test Post 2"' in result
        assert '"description": "A test post"' in result
        assert '"datePublished": "2022-01-03"' in result
        assert '"@type": "ImageObject"' in result
        assert '"url": "https://example.com/post2-image.jpg"' in result
        assert '"articleBody": "Test post 2 body"' in result
