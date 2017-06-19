import superdesk
from superdesk import get_resource_service


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
