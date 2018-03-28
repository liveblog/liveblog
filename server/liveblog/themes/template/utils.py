import os
import logging

from superdesk import get_resource_service
from liveblog.themes.template.loaders import CompiledThemeTemplateLoader

logger = logging.getLogger('superdesk.liveblog.themes.utils')


def get_theme_template(theme, template_name, theme_service=None):
    """
    Simple shortcut method to retrieve template content based on a given theme

    Args:
        theme: (:obj: `liveblog.themes.ThemesResource` instance): Blog theme
        template_name (`str`): Name of the desided template
        theme_service (:obj:`liveblog.themes.ThemesService`): Optional ThemesService instance

    Returns:
        Content string of the required template if found. Otherwise will return empty string
        and print warning message
    """

    if not theme_service:
        theme_service = get_resource_service('themes')

    theme_name = theme.get('name')
    template_env = theme_service.get_theme_template_env(theme, loader=CompiledThemeTemplateLoader)
    template_file_name = theme_service.get_theme_template_filename(
        theme_name, os.path.join("templates", template_name))

    if os.path.exists(template_file_name):
        template_cnt = open(template_file_name, encoding='utf-8').read()
    else:
        logger.warning("Theme template `%s` not found. Using empty string" % template_file_name)

    return template_env.from_string(template_cnt)
