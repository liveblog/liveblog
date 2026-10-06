import os
import unittest
from unittest.mock import patch

import jinja2

from liveblog.themes.themes import (
    LOCAL_THEMES_DIRECTORY,
    UndefinedVar,
    log_undefined_access,
)

LOGGER_NAME = "superdesk"
DEFAULT_THEME_TEMPLATES = os.path.join(LOCAL_THEMES_DIRECTORY, "default", "templates")


def render(source, **context):
    env = jinja2.Environment(undefined=UndefinedVar)
    return env.from_string(source).render(**context)


class UndefinedVarTestCase(unittest.TestCase):
    def setUp(self):
        log_undefined_access.cache_clear()

    def test_safe_filter_on_missing_key_renders_empty(self):
        self.assertEqual(render("[{{ meta.html | safe }}]", meta={}), "[]")

    def test_safe_filter_on_missing_variable_renders_empty(self):
        self.assertEqual(render("[{{ html | safe }}]"), "[]")

    def test_safe_filter_on_missing_parent_renders_empty(self):
        with self.assertLogs(LOGGER_NAME, level="WARNING"):
            self.assertEqual(render("[{{ meta.html | safe }}]"), "[]")

    def test_safe_filter_still_renders_defined_value(self):
        output = render("{{ meta.html | safe }}", meta={"html": "<b>video</b>"})
        self.assertEqual(output, "<b>video</b>")

    def test_escape_filter_on_missing_key_renders_empty(self):
        self.assertEqual(render("[{{ meta.html | e }}]", meta={}), "[]")

    def test_missing_value_renders_empty_with_autoescape(self):
        env = jinja2.Environment(undefined=UndefinedVar, autoescape=True)
        template = env.from_string("[{{ meta.html }}][{{ meta.html | safe }}]")
        self.assertEqual(template.render(meta={}), "[][]")

    def test_chained_access_on_missing_variable_renders_empty(self):
        with self.assertLogs(LOGGER_NAME, level="WARNING"):
            self.assertEqual(render("[{{ a.b.c.d }}]"), "[]")

    def test_chained_access_is_falsy_in_conditions(self):
        with self.assertLogs(LOGGER_NAME, level="WARNING"):
            output = render("{% if a.b.c %}yes{% else %}no{% endif %}")
        self.assertEqual(output, "no")

    def test_chained_access_logs_the_full_variable_path(self):
        with self.assertLogs(LOGGER_NAME, level="WARNING") as logs:
            render("{{ a.b.c.d }}")

        self.assertEqual(len(logs.output), 3)
        self.assertIn("`a`", logs.output[0])
        self.assertIn("`b`", logs.output[0])
        self.assertIn("`a.b`", logs.output[1])
        self.assertIn("`a.b.c`", logs.output[2])
        self.assertNotIn("None", "".join(logs.output))

    def test_chained_access_on_missing_key_logs_the_key_name(self):
        with self.assertLogs(LOGGER_NAME, level="WARNING") as logs:
            render("{{ meta.media.renditions }}", meta={})

        self.assertEqual(len(logs.output), 1)
        self.assertIn("`media`", logs.output[0])
        self.assertIn("`renditions`", logs.output[0])

    def test_same_path_is_logged_once_across_renders(self):
        with patch("liveblog.themes.themes.logger") as logger:
            for _ in range(3):
                render("{% for i in range(5) %}{{ a.b }}{% endfor %}")
            render("{{ a.c }}")

        logged = [call[0][1:] for call in logger.warning.call_args_list]
        self.assertEqual(logged, [("a", "b"), ("a", "c")])

    def test_dunder_lookup_raises_attribute_error(self):
        undefined = UndefinedVar(name="html")

        self.assertFalse(hasattr(undefined, "__html__"))
        with self.assertRaises(AttributeError):
            undefined.__html__


class DefaultThemeVideoWorkaroundTestCase(unittest.TestCase):
    """
    The video workaround template prints `meta.html | safe`, and oEmbed
    responses without an `html` key are valid input (LBSD-2963).
    """

    template_name = "template-mobile-app-video-workaround.html"

    def setUp(self):
        self.env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(DEFAULT_THEME_TEMPLATES),
            undefined=UndefinedVar,
        )

    def render_item(self, meta):
        template = self.env.get_template(self.template_name)
        return template.render(ref={"item": {"item_type": "video", "meta": meta}})

    def test_renders_video_item_without_html(self):
        output = self.render_item({"title": "Clip title"})

        self.assertIn('<div class="item--embed__element"></div>', output)
        self.assertIn("Clip title", output)

    def test_renders_video_item_with_html(self):
        output = self.render_item({"html": "<video src='clip.mp4'></video>"})

        self.assertIn("<video src='clip.mp4'></video>", output)
