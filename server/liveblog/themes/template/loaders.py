import os
from superdesk import get_resource_service
from jinja2.loaders import FileSystemLoader, ModuleLoader, ChoiceLoader, DictLoader
from liveblog.mongo_util import decode as mongodecode

__all__ = ['ThemeTemplateLoader', 'CompiledThemeTemplateLoader']


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
    Add template files as dictionary in the loades.
    """
    def addDictonary(self, theme):
        files = theme.get('files', {'templates': {}})
        if files.get('templates'):
            compiled = {}
            for file, content in files.get('templates').items():
                compiled[mongodecode(file)] = content
            self.loaders.append(DictLoader(compiled))

    """
    Compiled theme template loader for jinja2 SEO themes.
    """
    def __init__(self, theme):
        self.loaders = []
        theme_name = theme['name']
        themes = get_resource_service('themes')
        parent_theme = theme.get('extends')
        files = theme.get('files', {'templates': {}})
        if files.get('templates'):
            self.addDictonary(theme)
            if parent_theme:
                parent = themes.find_one(req=None, name=parent_theme)
                self.addDictonary(parent)
        else:
            compiled = themes.get_theme_compiled_templates_path(theme_name)
            self.loaders.append(ModuleLoader(compiled))
            if parent_theme:
                parent_compiled = themes.get_theme_compiled_templates_path(parent_theme)
                self.loaders.append(ModuleLoader(parent_compiled))
