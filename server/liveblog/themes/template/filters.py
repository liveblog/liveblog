import arrow
import datetime
import re
from settings import (DEFAULT_THEME_DATE_FORMAT, DEFAULT_THEME_TIMEZONE)
from superdesk import get_resource_service
import logging

logger = logging.getLogger('superdesk')

DEFAULT_IFRAME_WIDTH = "350"
DEFAULT_IFRAME_HEIGHT = "350"


def moment_date_filter_container(theme):
    def moment_date_filter(date, format=None):
        """
        Jinja2 filter for moment.js compatible dates.
        :param date:
        :param format:
        :return: str
        """
        settings = get_resource_service('themes').get_default_settings(theme)
        locale = settings.get('language', 'en')
        parsed = arrow.get(date)
        if not format:
            format = settings.get('datetimeFormat', DEFAULT_THEME_DATE_FORMAT)
        # Workaround for "x" unsupported format
        if format == 'x':
            return parsed.timestamp
        # TODO: implement momentjs `Localized formats`
        elif re.search('l+', format.lower()):
            format = DEFAULT_THEME_DATE_FORMAT

        if format == 'ago':
            formated = parsed.humanize()
        else:
            formated = parsed.to(DEFAULT_THEME_TIMEZONE).format(DEFAULT_THEME_DATE_FORMAT)

        try:
            if format == 'ago':
                formated = parsed.humanize(locale=locale)
            else:
                formated = parsed.to(DEFAULT_THEME_TIMEZONE).format(format, locale=locale)
        except Exception:
            logger.info("language not supported")

        return formated

    return moment_date_filter


def regaddten(obj):
    val = int(obj.group(1))
    return str(val + 10)


def addten(date):

    if isinstance(date, datetime.datetime):
        try:
            date = date.replace(year=date.year + 10)
        except ValueError:
            # Leap day in a leap year, move date to February 28th
            date = date.replace(year=date.year + 10, day=28)

    if isinstance(date, str):
        return re.sub(r'(\d{4})', regaddten, date)

    return date


def ampify(html):
    brightcove_re_array = [
        '(http[s:]*)?//(www\.)?players\.brightcove\.net/',
        '(?P<account>\d*)/',
        '(?P<player>[a-zA-Z0-9\-]*)',
        '_',
        '(?P<embed>\w*)',
        '\/index\.html\?videoId=',
        '(?P<videoId>\d*)'
    ]
    match = re.compile(''.join(brightcove_re_array)).match(html)
    if match:
        return ('<amp-brightcove data-account="{account}" data-player="{player}" data-embed="{embed}" data-video-id="{videoId}" \
         layout="responsive" width="480" height="270"></amp-brightcove>'.format(**match.groupdict()))
    if re.search('<\S*iframe', html, re.IGNORECASE):
        src = re.search(r'src\s*=\s*"(?P<src>[^\"]+)"', html)
        width = re.search(r'width\s*=\s*"(?P<width>[^\"]+)"', html)
        height = re.search(r'height\s*=\s*"(?P<height>[^\"]+)"', html)

        width = width.group('width') if width else DEFAULT_IFRAME_WIDTH
        if "%" in width:
            width = DEFAULT_IFRAME_WIDTH

        # adding also fallback for height in case is wrongly provided in %
        height = height.group('height') if height else DEFAULT_IFRAME_HEIGHT
        if "%" in height:
            height = DEFAULT_IFRAME_HEIGHT

        return '''
            <amp-iframe
                width={width}
                height={height}
                layout="responsive"
                frameborder="0"
                sandbox="allow-scripts allow-same-origin allow-popups"
                src="{src}">
                <p placeholder>Loading...</p>
            </amp-iframe>
            '''.format(width=width, height=height, src=src.group('src') if src else '')

    if re.search('players.brightcove.net/\d*/\w*([a-zA-Z0-9\-]*)_\w*\/index\.min\.js', html):
        account = re.search(r'account\s*=\s*"(?P<account>[^\"]+)"', html)
        player = re.search(r'player\s*=\s*"(?P<player>[^\"]+)"', html)
        embed = re.search(r'embed\s*=\s*"(?P<embed>[^\"]+)"', html)
        videoId = re.search(r'data-video-id\s*=\s*"([^\"]+)"', html)

        return '''
            <amp-brightcove
                data-account={}
                data-player={}
                data-embed={}
                data-video-id={}
                layout="responsive"
                width="480" height="270">
            </amp-brightcove>
            '''.format(
               account.group('account') if account else '',
               player.group('player') if player else '',
               embed.group('embed') if embed else '',
               videoId.group(1) if videoId else '')

    return html


def ampsupport(item):
    """
    Jinja filter that checks if an item can be rendered on amp theme based on some of its attributes
    At the moment we only support basic items, Scorecard and Advertisement Local.

    Items of Freetypes group and items of type Advertisement Remote are not yet allowed.

    Args:
        item (`apps.archive.archive.ArchiveResource`): ArchiveResource instance. This might also be Post item

    Returns:
        boolean if supports or not the given item
    """

    def filter_freetypes(obj):
        return obj['item'].get('group_type') == "freetype"

    def item_type_filter(obj):
        return obj['item'].get('item_type') not in ["Scorecard", "Advertisement Local"]

    if item.get('groups') and item['groups'][1]['refs']:
        item_list = item['groups'][1]['refs']

        # let's extract freetypes and then remove the allowed
        freetypes = list(filter(filter_freetypes, item_list))
        not_supported = list(filter(item_type_filter, freetypes))

        if len(not_supported) > 0:
            return False

    return True
