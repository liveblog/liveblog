LiveblogInstanceSettingsController.$inject = [
    '$scope',
    'api',
    '$location',
    'notify',
    'gettext',
];

export default function LiveblogInstanceSettingsController(
    $scope,
    api,
    $location,
    notify,
    gettext
) {
    $scope.instanceForm = null;
    $scope.instanceSettings = {
        settings: '{}', // has to be string in order to avoid json parsing error
    };

    $scope.settingsLoading = true;

    api.instance_settings.query().then((data) => {
        $scope.instanceSettings.settings = JSON.stringify(data._items[0].settings);
        $scope.settingsLoading = false;
    });

    $scope.setFormRef = (childScope) => {
        $scope.instanceForm = childScope.instanceForm;
    };

    $scope.saveInstanceSettings = () => {
        let updatedSettings = $scope.instanceSettings.settings;

        try {
            updatedSettings = JSON.parse(updatedSettings);
        } catch (e) {
            notify.error(gettext('Invalid JSON format. Please correct and try again.'));
            return;
        }

        notify.pop();
        notify.info(gettext('Saving instance settings'));

        api.instance_settings.save({ settings: updatedSettings })
            .then(() => {
                /* noop */
            })
            .catch((error) => {
                if (error.status === 422) {
                    notify.pop();
                    notify.info(gettext('Success. Existing instance settings config updated.'));
                    $scope.instanceForm.$setPristine();
                } else {
                    notify.pop();
                    notify.error(gettext('Saving instance settings failed. Please try again later'));
                }
            });
    };

    $scope.close = () => {
        $location.path('/liveblog/');
    };
}

