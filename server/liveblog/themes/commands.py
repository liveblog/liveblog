import superdesk
from superdesk import get_resource_service
from .themes import register_a_theme


def _print_result_to_stdout(created, updated):
    print('%d themes registered' % (len(created) + len(updated)))
    if created:
        print('added:')
        for theme in created:
            print('\t+ %s %s (%s)' % (theme.get('label', theme['name']), theme['version'], theme['name']))
    if updated:
        print('updated:')
        for theme in updated:
            print('\t* %s %s (%s)' % (theme.get('label', theme['name']), theme['version'], theme['name']))


class RegisterLocalThemesCommand(superdesk.Command):
    def run(self):
        theme_service = get_resource_service('themes')
        created, updated = theme_service.update_registered_theme_with_local_files(force=True)
        _print_result_to_stdout(created, updated)


class RegisterThemeCommand(superdesk.Command):
    """
    Class defining the register of a theme command.
    """
    option_list = (
        superdesk.Option('--filepath', '-f', dest='filepath', required=True),
    )

    def run(self, filepath):
        result, theme_json = register_a_theme(filepath)
        results = {'created': [], 'updated': [], 'unchanged': []}
        results[result.get('status')].append(result.get('theme'))
        _print_result_to_stdout(results.get('created'), results.get('updated'))
