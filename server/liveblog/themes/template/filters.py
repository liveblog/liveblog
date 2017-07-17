import arrow
from liveblog.blogs.app_settings import DEFAULT_THEME_DATE_FORMAT


def moment_date_filter(date, format=None):
    """
    Jinja2 filter for moment.js compatible dates.
    :param date:
    :param format:
    :return: str
    """
    parsed = arrow.get(date)
    # Workaround for "x" unsupported format
    if format == 'x':
        return parsed.timestamp
    if not format:
        format = DEFAULT_THEME_DATE_FORMAT
    return parsed.format(format)
