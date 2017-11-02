import arrow
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
