import arrow
import datetime
import re
from settings import (DEFAULT_THEME_DATE_FORMAT, DEFAULT_THEME_TIMEZONE)
import logging

logger = logging.getLogger('superdesk')


def moment_date_filter_container(theme):
    def moment_date_filter(date, format=None):
        """
        Jinja2 filter for moment.js compatible dates.
        :param date:
        :param format:
        :return: str
        """
        settings = theme.get('settings', {})
        parsed = arrow.get(date)

        if not format:
            format = settings.get('datetimeFormat', DEFAULT_THEME_DATE_FORMAT)
        # Workaround for "x" unsupported format
        if format == 'x':
            return parsed.timestamp
        # TODO: implement momentjs `Localized formats`
        elif re.search('l+', format.lower()):
            format = DEFAULT_THEME_DATE_FORMAT

        formated = parsed.to(DEFAULT_THEME_TIMEZONE).format(DEFAULT_THEME_DATE_FORMAT)
        try:
            formated = parsed.to(DEFAULT_THEME_TIMEZONE).format(format, locale=settings.get('language', 'en'))
        except Exception:
            logger.info("language not supported")

        return formated

    return moment_date_filter


def regaddten(obj):
    print(obj)
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
    if re.search('iframe', html, re.IGNORECASE):
        src = re.search(r'src\s*=\s*"(?P<src>[^\"]+)"', html)
        width = re.search(r'width\s*=\s*"(?P<width>[^\"]+)"', html)
        height = re.search(r'height\s*=\s*"(?P<height>[^\"]+)"', html)
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
'''.format(
            width=width.group('width') if width else 0,
            height=height.group('height') if height else 0,
            src=src.group('src') if src else '')
    return html
