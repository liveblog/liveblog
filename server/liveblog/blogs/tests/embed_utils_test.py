from superdesk.tests import TestCase
from liveblog.blogs.embeds_utils import (
    get_setting_value, build_css_selector,
    compile_styles_map, convert_styles_map_to_css)
from liveblog.themes.tests.mock_settings import default_seo_theme

default_seo_theme_settings = {
    "typography": {
        "primary": "Mukta Vaani",
        "secundary": "Oswald"
    },
    "general": {
        "color": "#3394bc",
        "margin": None,
        "padding": None,
        "max-width": None,
        "background": "#ffffff"
    },
    "blog-title": {
        "font-family": "primary",
        "font-size": None,
        "font-weight": "normal",
        "color": "#7d41a4",
        "font-style": "normal"
    },
}


class EmbedUtilsTestCase(TestCase):

    def test_get_setting_value(self):
        settings = default_seo_theme_settings
        self.assertIsNone(get_setting_value(settings, None, ''))
        self.assertEqual(get_setting_value(settings, 'blog-title', 'font-weight'), 'normal')

        # also check the linked group values
        primary_font_mukta = get_setting_value(settings, 'blog-title', 'font-family', linked_to_group='typography')
        self.assertEqual(primary_font_mukta, 'Mukta Vaani')

    def test_build_css_selector(self):
        group_selector = 'div.lb-timeline'
        style_option = {
            "label": "Link Color",
            "property": "color",
            "type": "colorpicker",
            "default": "#3394bc"
        }

        style_option_with_tag = style_option.copy()
        style_option_with_tag['tagName'] = 'a'

        selector = build_css_selector(group_selector, style_option)
        selector_with_child_tag = build_css_selector(group_selector, style_option_with_tag)

        self.assertEqual(selector, 'div.lb-timeline')
        self.assertEqual(selector_with_child_tag, 'div.lb-timeline a')

    def test_compile_styles_map(self):
        mock_styles_map_result = {
            'div.lb-timeline h1': [
                ('font-family', 'Mukta Vaani'),
                ('font-weight', 'normal'),
                ('font-style', 'normal'),
                ('color', '#7d41a4')
            ],
            'div.lb-timeline': [('background', '#ffffff')],
            'div.lb-timeline a': [('color', '#3394bc')]
        }

        styles_map = compile_styles_map(
            default_seo_theme_settings, default_seo_theme.get('styleOptions'))

        self.assertEqual(styles_map, mock_styles_map_result)

    def test_convert_styles_map_to_css(self):
        mock_css_styles_list = [
            "div.lb-timeline h1 { font-family: Mukta Vaani; font-weight: normal; font-style: normal; color: #7d41a4 }",
            "div.lb-timeline { background: #ffffff }",
            "div.lb-timeline a { color: #3394bc }"
        ]

        mock_css_styles = "\n".join(mock_css_styles_list)
        styles_map = compile_styles_map(
            default_seo_theme_settings, default_seo_theme.get('styleOptions'))
        css_styles = convert_styles_map_to_css(styles_map)

        self.assertEqual(css_styles, mock_css_styles)
