import unittest
from bs4 import BeautifulSoup

from jinja2 import Environment, BaseLoader

from superdesk import tests as supertests
from superdesk import get_resource_service
from liveblog import themes as themesapp

from liveblog.exceptions import ParameterError
from .utils import AdsSettings, inject_advertisements


AMP_HTML_TEST = """
<article data-sort-time="1526474417" class="lb-post list-group-item lb-not-pinned">
  <div class="lb-post-date">16 . May 2018 12:43</div>
  <div class="lb-author">
    <div class="lb-author__name">Admin</div>
  </div>
  <div class="lb-item">Post 5</div>
</article>

<article data-sort-time="1526474417" class="lb-post list-group-item lb-not-pinned">
  <div class="lb-post-date">16 . May 2018 12:42</div>
  <div class="lb-author ">
    <div class="lb-author__name">Admin</div>
  </div>
  <div class="lb-item">Post 4</div>
</article>

<article data-sort-time="1526474417" class="lb-post list-group-item lb-not-pinned">
  <div class="lb-post-date">16. May 2018 12:41</div>
  <div class="lb-author ">
    <div class="lb-author__name">Admin</div>
  </div>
  <div class="lb-item">Post 3</div>
</article>

<article data-sort-time="1526474417" class="lb-post list-group-item lb-not-pinned">
  <div class="lb-post-date">16. May 2018 12:40</div>
  <div class="lb-author ">
    <div class="lb-author__name">Admin</div>
  </div>
  <div class="lb-item">Post 2</div>
</article>

<article data-sort-time="1526474303" class="lb-post list-group-item lb-not-pinned">
  <div class="lb-post-date">16. May 2018 12:38</div>
  <div class="lb-author">
    <div class="lb-author__name">Admin</div>
  </div>
  <div class="lb-item">Post 1</div>
</article>
"""

TEST_ADS = [
    {
        "_id": "5b05db9c3f291000e028a30d",
        "text": "Test ad 1",
        "type": "Advertisement Local",
        "name": "Test Ad 1"
    },
    {
        "_id": "5b05dba33f291000e028a30f",
        "text": "Test ad 2",
        "type": "Advertisement Local",
        "name": "Test Ad 2"
    }
]

DEFAULT_THEME_JSON = {
    'name': 'default',
    'version': '3.3.56',
    'asyncTheme': True,
    'seoTheme': True,
    'contributors': [],
    'options': [],
    'i18n': {}
}

AMP_THEME_JSON = {
    'name': 'amp',
    'version': '3.3.22',
    'seoTheme': True,
    'ampTheme': True,
    'extends': 'default',
    'onlyOwnCss': 'true',
    'supportAdsInjection': 'true',
    'contributors': [],
    'options': [],
    'i18n': {}
}


class AdvertisementUtilsTestCase(unittest.TestCase):

    def test_default_ads_settings(self):
        """This should test default settings"""

        settings = AdsSettings()

        self.assertEqual(settings.frequency, 2)
        self.assertEqual(settings.article_tag, "article")
        self.assertEqual(settings.article_class, "lb-post")
        self.assertEqual(settings.tombstone_class, "hide-item")
        self.assertEqual(settings.order, 1)

        # now check if default template is working fine
        test_item = {"item": {"text": "test content"}}
        jinja_env = Environment(loader=BaseLoader())
        default_template = jinja_env.from_string(AdsSettings.DEFAULT_SETTINGS["template"])
        default_rendered = default_template.render(test_item)

        self.assertEqual(settings.template.render(test_item), default_rendered)

    def test_custom_ads_settings(self):
        """Should test some optional parameters provided"""

        settings = AdsSettings(
            frequency=4, article_tag="test_tag", tombstone_class="do_not_show")

        self.assertEqual(settings.frequency, 4)
        self.assertEqual(settings.article_tag, "test_tag")
        self.assertEqual(settings.tombstone_class, "do_not_show")

    def test_ads_settings_unknown_params(self):
        """ParameterError exception is thrown if unknown parameters are provided"""

        self.assertRaises(ParameterError, AdsSettings,
                          unknown_param="some_weird_value__:P")

    def test_parameters_inject_advertisements(self):
        """ParameterError exception is thrown if `content` parameter is not instance of BeautifulSoup"""

        self.assertRaises(ParameterError, inject_advertisements,
                          content="content should be BeautifulSoup4 instance")

    def test_parameters_inject_advertisements(self):
        """ParameterError exception is thrown if settings parameter is not instance of AdsSettings"""

        valid_content = BeautifulSoup("<a href='#''>Valid content</a>", "lxml")
        ads_list = [1, 2]

        invalid_settings = {}  # the key of exception :)

        self.assertRaises(
            ParameterError, inject_advertisements,
            content=valid_content,
            settings=invalid_settings,
            ads_list=ads_list,
            theme="theme"
        )


class AdvertisementInjectionTestCase(supertests.TestCase):

    def setUp(self):
        themesapp.init_app(self.app)

        self.themeservice = get_resource_service('themes')

        # let's register themes in order to use them later
        self.themeservice.save_or_update_theme(DEFAULT_THEME_JSON)
        self.themeservice.save_or_update_theme(AMP_THEME_JSON)

    def test_inject_advertisements(self):
        """Test injection in a real piece of valid AMP html"""

        jinja_env = Environment(loader=BaseLoader())
        test_template_text = "<div class='advertisment'>{{ item.text }}</div>"
        template = jinja_env.from_string(test_template_text)

        settings = AdsSettings(template=template)
        amp_html = BeautifulSoup(AMP_HTML_TEST, "lxml")

        theme = self.themeservice.find_one(req=None, name="amp")
        inject_advertisements(amp_html, settings, TEST_ADS, theme)

        # for some reason after injection, queries on BeautifulSoup object
        # does not work properly, so we need to run BS4 over the result again
        amp_with_ads = str(amp_html)
        amp_soup = BeautifulSoup(amp_with_ads, "lxml")

        articles = amp_soup.find_all(lambda x: x.name == settings.article_tag)

        # base on default frequency (2) we're going to assert "advertisment"
        # on article 1, 3 and 5
        self.assertTrue("advertisment" in str(articles[0]))
        self.assertTrue("advertisment" in str(articles[2]))
        self.assertTrue("advertisment" in str(articles[4]))
