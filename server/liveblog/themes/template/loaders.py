import os
from superdesk import get_resource_service
from jinja2.loaders import FileSystemLoader, ModuleLoader, ChoiceLoader


class ThemeTemplateLoader(FileSystemLoader):
    """
    Theme template loader for jinja2 SEO themes.
    """
    def __init__(self, theme, encoding='utf-8', followlinks=False):
        theme_name = theme['name']
        themes = get_resource_service('themes')
        theme_dirname = themes.get_theme_path(theme_name)
        self.searchpath = [os.path.join(theme_dirname, 'templates')]
        parent_theme = theme.get('extends')
        if parent_theme:
            parent_dirname = themes.get_theme_path(parent_theme)
            self.searchpath.append(os.path.join(parent_dirname, 'templates'))
        self.encoding = encoding
        self.followlinks = followlinks


class CompiledThemeTemplateLoader(ChoiceLoader):
    """
    Compiled theme template loader for jinja2 SEO themes.
    """
    def __init__(self, theme):
        theme_name = theme['name']
        themes = get_resource_service('themes')
        parent_theme = theme.get('extends')
        compiled = themes.get_theme_compiled_templates_path(theme_name)
        self.loaders = [ModuleLoader(compiled)]
        if parent_theme:
            parent_compiled = themes.get_theme_compiled_templates_path(parent_theme)
            self.loaders.append(ModuleLoader(parent_compiled))
