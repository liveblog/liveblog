/**
 * Own Liveblog settings view to be able to set
 * correct settings entries and window title
 */
import _ from 'lodash';

const lbSettingsView = ($route, superdesk, pageTitle) => {
    return {
        scope: {},
        transclude: true,
        templateUrl: 'scripts/apps/settings/views/settings-view.html',
        link: (scope) => {
            superdesk.getMenu(superdesk.MENU_SETTINGS).then((menu) => {
                scope.settings = menu.filter((x) => x.liveblogSetting === true);
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

lbSettingsView.$inject = ['$route', 'superdesk', 'pageTitle'];

export { lbSettingsView };
