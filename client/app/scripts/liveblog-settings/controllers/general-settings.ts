import _ from 'lodash';
import {
    TAGS, ALLOW_PICK_MULTI_TAGS, YOUTUBE_PRIVACY_STATUS,
    EMBED_HEIGHT_RESPONSIVE_DEFAULT,
} from './../../liveblog-common/constants';

LiveblogSettingsController.$inject = ['$scope', 'api', '$location', 'notify', 'gettext', '$q'];
export default function LiveblogSettingsController($scope, api, $location, notify, gettext, $q) {
    // prep the settings
    $scope.settingsForm = null;
    $scope.liveblogSettings = {
        language: {},
        theme: {},
        global_tags: [],
        allow_multiple_tag_selection: { value: true }, // multiple tags select is enabled by default
        youtube_privacy_status: { value: 'unlisted' },
        embed_height_responsive_default: { value: true },
    };

    $scope.privacyStatuses = [
        { value: 'private', label: 'Private' },
        { value: 'public', label: 'Public' },
        { value: 'unlisted', label: 'Unlisted' },
    ];

    // settings allowed keys
    const allowedKeys = [
        'language',
        'theme',
        TAGS,
        ALLOW_PICK_MULTI_TAGS,
        YOUTUBE_PRIVACY_STATUS,
        EMBED_HEIGHT_RESPONSIVE_DEFAULT,
    ];

    api.languages.query().then((data) => {
        $scope.languages = data._items;
    });

    api.themes.query().then((data) => {
        // filter theme with label (without label are `generic` from inheritance)
        $scope.themes = data._items.filter((theme) => angular.isDefined(theme.label));
    });

    $scope.settingsLoading = true;

    api.global_preferences.query().then((data) => {
        _.forEach(data._items, (setting) => {
            $scope.liveblogSettings[setting.key] = setting;
        });

        $scope.settingsLoading = false;
    });

    $scope.setFormRef = function(childScope) {
        $scope.settingsForm = childScope.settingsForm;
    };

    $scope.onTagsChange = function(tags) {
        $scope.liveblogSettings.global_tags.value = tags;
        $scope.settingsForm.$setDirty();
        $scope.$apply();
    };

    $scope.saveSettings = function() {
        notify.pop();
        notify.info(gettext('Saving settings'));
        let patch = {};
        const reqArr = [];

        _.forEach($scope.liveblogSettings, (item, key) => {
            if (!_.includes(allowedKeys, key)) return;

            patch = {
                key: key,
                value: item.value,
            };
            reqArr.push(api('global_preferences').save(item, patch));
        });

        $q.all(reqArr).then(() => {
            notify.pop();
            notify.info(gettext('Settings saved successfully'));
            $scope.settingsForm.$setPristine();
        }, () => {
            notify.pop();
            notify.error(gettext('Saving settings failed. Please try again later'));
        });
    };

    $scope.close = function() {
        // return to blog list page
        $location.path('/liveblog/');
    };
}

