const LiveblogInstanceSettingsController = (
    $scope,
    api,
    $location,
    notify,
    gettext
) => {
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
                notify.pop();
                notify.info(gettext('Instance settings saved successfully.'));
                $scope.instanceForm.$setPristine();
            })
            .catch(({ data }) => {
                const errMsg = data?._issues?.settings || data?._message;

                notify.pop();
                notify.error(errMsg, 10000);
            });
    };

    $scope.close = () => {
        $location.path('/liveblog/');
    };
};

LiveblogInstanceSettingsController.$inject = [
    '$scope',
    'api',
    '$location',
    'notify',
    'gettext',
];

export default LiveblogInstanceSettingsController;
