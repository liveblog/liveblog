import adManagTemplate from 'scripts/liveblog-advertising/views/main.html';

LiveblogAdvertisingController.$inject = ['api', '$location', 'notify', 'gettext',
'$q', '$sce', 'config', 'lodash', 'upload', 'blogService', 'modal', '$templateCache'];

function LiveblogAdvertisingController(api, $location, notify, gettext,
$q, $sce, config, _, upload, blogService, modal, $templateCache) {
    var vm = this;
    console.log('$templateCache ', $templateCache.get(adManagTemplate));
}


var liveblogAdvertisingModule = angular.module('liveblog.advertising', [])
.config(['superdeskProvider', 'config', function(superdesk, config) {
    if (config.subscriptionLevel != 'solo')
        superdesk
            .activity('/advertising/', {
                label: gettext('Advertising manager'),
                controller: LiveblogAdvertisingController,
                controllerAs: 'vm',
                betaMark: true,
                category: superdesk.MENU_MAIN,
                adminTools: true,
                privileges: {'global_preferences': 1},
                templateUrl: adManagTemplate
            });
}])

export default liveblogAdvertisingModule;

