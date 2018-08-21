# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import time
import bs4
import math
import logging
from jinja2 import Environment, BaseLoader

from superdesk import get_resource_service
from liveblog.exceptions import ParameterError

logger = logging.getLogger('superdesk.lb.advertisments')


# NOTE: consider later to move to separate file if needed
ASC = 1
DESC = -1


class AdsSettings(object):
    """
    This is just a data transfer object to define advertisments injection settings.
    Advertisement injection should be agnostic of the theme, so the main idea of
    the helper modules here is to provide different settings depending on the amp theme
    and still be able to inject the advertisments.

    Note:
        At the moment advertisements injection has been only tested on Default AMP Theme

    Args:
        frequency (`int`): number of occurrences or injection of ads
        article_tag (`str`): HTML tag used in theme to render articles entries in timeline
        article_class (`str`): Css class used in article tag
        tombstone_class (`str`): Css class used to describe deleted post entries
        order (`int`): Order that will be used to display the ads
        template (`jinja2.Template` or `str`): Template content to be used to render the ad content
    """

    # @TODO:
    #   Make `article_class` parameter optional

    DEFAULT_SETTINGS = {
        'frequency': 2,
        'article_tag': 'article',
        'article_class': 'lb-post',
        'tombstone_class': 'hide-item',
        'template': '{{ item.text }}',
        'order': ASC
    }

    def __init__(self, **kwargs):
        self._validate_parameters(kwargs)

        parameters = self.DEFAULT_SETTINGS.copy()
        parameters.update(kwargs)

        # if template is string, let's turn it into jinja2 template
        if isinstance(parameters["template"], str):
            jinja_env = Environment(loader=BaseLoader())
            parameters["template"] = jinja_env.from_string(parameters["template"])

        self.__dict__ = parameters

    def __repr__(self):
        """Nice string representation of the object"""
        attrs = ["  %s=%r\n" % (attr, value) for attr, value in self.__dict__.items()]
        return 'AdsSettings\n%s' % "".join(attrs)

    def _validate_parameters(self, settings):
        """
        Ensure that parameters passed to the instance are valid
        Raises a `ParameterError` if any parameters do not validate.

        Args:
            settings (dict): Dictionary with the provided settings
        """

        diff = set(settings.keys()) - set(self.DEFAULT_SETTINGS.keys())

        if diff:
            raise ParameterError("Unknown parameters:", tuple(diff))


def inject_advertisements(content, settings, ads_list, theme):
    """
    This method receives a parsed with BeautifulSoup content and injects the
    advertisments according to given `settings` (frequency, order, etc)

    Raises `ParameterError` if parameters do not match the require type

    Note:
        At the moment advertisements injection has been only tested on Default AMP Theme

    Args:
        content (:obj:`bs4.BeautifulSoup`): BeautifulSoup parsed content
        settings (:obj:`AdsSettings`): Required settings to query and injects content into soup
        ads_list (`list`): List of advertisments entries
        theme: (:obj: `liveblog.themes.ThemesResource` instance): Blog theme
    """

    if not isinstance(content, bs4.BeautifulSoup):
        raise ParameterError(
            "Wrong `content` parameter type. Expected `bs4.BeautifulSoup` instance")

    if not isinstance(settings, AdsSettings):
        raise ParameterError(
            "Wrong `settings` parameter type. Expected `AdsSettings` instance")

    def _not_tombstone_item(css_class):
        return settings.article_class in css_class and settings.tombstone_class not in css_class

    articles = content.find_all(
        lambda x: x.name == settings.article_tag and _not_tombstone_item(x.get('class', [])))

    pcount = len(articles)
    acount = len(ads_list)
    frequency = settings.frequency
    template = settings.template

    if settings.order == DESC:
        ads_list = ads_list[::-1]

    theme_service = get_resource_service('themes')
    theme_settings = theme_service.get_default_settings(theme)

    for i in range(0, pcount, frequency):
        if acount != 0:
            index = math.ceil(i / frequency) % acount

            ref_article = articles[i]
            item = ads_list[index]
            ad_id = "ads_%s_%s" % (item['_id'], i)

            ad_content = template.render(
                ad_id=ad_id, item=item, theme=theme, settings=theme_settings)
            ad_content = prepare_amp_content(ad_content)

            # we need to increment the data-update-time in order to trigger amp updating
            # if date-update-time is not updated, the advertisement will display wrong content
            ref_article['data-update-time'] = int(time.time())
            ref_article.append(ad_content)


def prepare_amp_content(content):
    """
    This ensure that ad html rendered content to be AMP compatible

    Args:
        content (`str`): HTML string content

    Returns:
        `BeautifulSoup` adjusted content to be compatible with AMP
    """

    # using html.parser to avoid html and body tags
    ad_content = bs4.BeautifulSoup(content, "html.parser")

    # time to adjust couple of things from advertisement render
    # e.g: image and some wrong attributes
    ad_image = ad_content.find('img')
    if (ad_image):
        amp_img = ad_content.new_tag('amp-img')
        amp_img['src'] = ad_image.attrs['src']
        amp_img['width'], amp_img['height'] = 600, 200
        amp_img['layout'] = 'responsive'
        ad_image.replace_with(amp_img)

    REMOVE_ATTRIBUTES = ['compulsory', 'type']
    for tag in ad_content.find_all():
        for attr in REMOVE_ATTRIBUTES:
            if attr in tag.attrs:
                del tag[attr]

    return ad_content
