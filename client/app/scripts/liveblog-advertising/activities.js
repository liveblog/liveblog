import adManagTemplate from 'scripts/liveblog-advertising/views/main.html';
import advertisingController from './controllers/advertising.js';
activities.$inject = ['superdeskProvider'];

export default function activities(superdesk) {
	superdesk
        .activity('/advertising/', {
            label: gettext('Advertising manager'),
            controller: advertisingController,
            betaMark: true,
            category: superdesk.MENU_MAIN,
            adminTools: true,
            privileges: {'global_preferences': 1},
            templateUrl: adManagTemplate
        });
}