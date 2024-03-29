import os
import logging
from superdesk import get_resource_service
from jinja2.loaders import (
    FileSystemLoader,
    ModuleLoader,
    ChoiceLoader,
    DictLoader,
    PrefixLoader,
)
from liveblog.mongo_util import decode as mongodecode

__all__ = ["ThemeTemplateLoader", "CompiledThemeTemplateLoader"]


logger = logging.getLogger("superdesk")


class ThemeTemplateLoader(FileSystemLoader):
    """
    Theme template loader for jinja2 SEO themes.
    """

    def __init__(self, theme, encoding="utf-8", followlinks=False):
        theme_name = theme["name"]
        themes = get_resource_service("themes")
        theme_dirname = themes.get_theme_path(theme_name)
        self.searchpath = [os.path.join(theme_dirname, "templates")]

        parent_theme = theme.get("extends")
        if parent_theme:
            parent_dirname = themes.get_theme_path(parent_theme)
            self.searchpath.append(os.path.join(parent_dirname, "templates"))

        self.encoding = encoding
        self.followlinks = followlinks


class CompiledThemeTemplateLoader(ChoiceLoader):
    def __init__(self, theme):
        """
        A Mixed logic template loader module. It will use Compiled theme template
        for current theme and will also use FileSystemLoader like in order to enable
        inheritance
        """

        self.loaders = []
        themes = get_resource_service("themes")

        def recursive_add(theme):
            theme_name = theme["name"]
            parent_name = theme.get("extends")
            parent = None

            if parent_name:
                parent = themes.find_one(req=None, name=parent_name)

            files = theme.get("files", {"templates": {}})
            if files.get("templates"):
                self.addDictonary(theme)

                if parent:
                    self.addDictonary(parent)
            else:
                compiled = themes.get_theme_compiled_templates_path(theme_name)
                self.loaders.append(ModuleLoader(compiled))

                if parent_name:
                    parent_compiled = themes.get_theme_compiled_templates_path(
                        parent_name
                    )
                    self.loaders.append(ModuleLoader(parent_compiled))

            # let's now add the parent theme prefix loader
            if parent_name:
                prefix_loader = self._parent_prefix_loader(parent_name)
                self.loaders.append(prefix_loader)

            # now check if parent theme extends another and repeat the story :)
            if parent and parent.get("extends"):
                ancestor = themes.find_one(req=None, name=parent.get("extends"))
                recursive_add(ancestor)

        recursive_add(theme)

    def _parent_prefix_loader(self, name):
        """
        Creates a PrefixLoader in order to be able to extends parent theme
        templates using as prefix the parent theme name
        Example:
            {% extends 'parent_theme_name/template_name.html' %}
            {% include 'parent_theme_name/template_name.html' %}

        Args:
            name (`str`): Parent theme name

        Returns:
            PrefixLoader instance with parent_name as prefix
        """

        themes = get_resource_service("themes")
        parent_dirname = themes.get_theme_path(name)
        search_paths = [os.path.join(parent_dirname, "templates")]

        return PrefixLoader({name: FileSystemLoader(search_paths)})

    def addDictonary(self, theme):
        """
        Add template files as dictionary in the loaders.
        """

        files = theme.get("files", {"templates": {}})
        if files.get("templates"):
            compiled = {}
            for tfile, content in files.get("templates").items():
                compiled[mongodecode(tfile)] = content
            self.loaders.append(DictLoader(compiled))
