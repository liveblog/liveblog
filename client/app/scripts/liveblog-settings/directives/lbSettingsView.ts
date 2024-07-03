/**
 * Own Liveblog settings view to be able to set
 * correct settings entries and window title
 */
import _ from 'lodash';

const filterSupportTools = (settings, session, usersService) => {
    if (!usersService.isSupport(session.identity)) {
        return settings.filter((x) => x.liveblogSupportTools !== true);
    }

    return settings;
};

const lbSettingsView = ($route, superdesk, pageTitle, session, usersService) => {
    return {
        scope: {},
        transclude: true,
        templateUrl: 'scripts/apps/settings/views/settings-view.html',
        link: (scope) => {
            superdesk.getMenu(superdesk.MENU_SETTINGS).then((menu) => {
                scope.settings = menu.filter((x) => x.liveblogSetting === true);

                // filter settings that should only be available to support team
                scope.settings = filterSupportTools(scope.settings, session, usersService);
            });

            scope.currentRoute = $route.current;
            pageTitle.setUrl(_.capitalize(gettext('Settings')));

            if (scope.currentRoute.$$route.label !== 'Settings') {
                pageTitle.setWorkspace(_.capitalize(gettext(scope.currentRoute.$$route.label)));
            } else {
                pageTitle.setWorkspace(null);
            }

            document.title = document.title.replace('Superdesk', 'Liveblog');
        },
    };
};

lbSettingsView.$inject = ['$route', 'superdesk', 'pageTitle', 'session', 'usersService'];

export { lbSettingsView };
