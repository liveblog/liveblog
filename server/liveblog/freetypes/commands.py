import ntpath
import superdesk
from superdesk import get_resource_service


class RegisterFreetypeCommand(superdesk.Command):
    """
    Class defining the register of a freetype command.
    """
    option_list = (
        superdesk.Option('--filepath', '-f', dest='filepath', required=True),
    )

    def run(self, filepath):
        freetype_handler = open(filepath, "r")
        freetype_template = freetype_handler.read()
        freetype_handler.close()
        freetype_name = ntpath.splitext(ntpath.basename(filepath))[0]
        freetype_service = get_resource_service('freetypes')
        freetype_service.register_freetype_files(freetype_template, freetype_name)
