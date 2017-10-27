import arrow
from liveblog.blogs.app_settings import DEFAULT_THEME_DATE_FORMAT
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
        # Workaround for "x" unsupported format
        if format == 'x':
            return parsed.timestamp
        if not format:
            format = DEFAULT_THEME_DATE_FORMAT
        formated = parsed.format(format)
        try:
            formated = parsed.format(format, settings.get('language', 'en'))
        except Exception:
            logger.info("language not supported")

        return formated

    return moment_date_filter