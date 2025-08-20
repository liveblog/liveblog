import _ from 'lodash';
import {
    TAGS, ALLOW_PICK_MULTI_TAGS, YOUTUBE_PRIVACY_STATUS,
    EMBED_HEIGHT_RESPONSIVE_DEFAULT, QUOTE_STYLE, GENERAL_JSON_LD_TIMEZONE_OFFSET,
} from './../../liveblog-common/constants';

const LiveblogSettingsController = ($scope, api, $location, notify, gettext, $q) => {
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

    $scope.quoteStyles = [
        { value: 'en', label: 'English' },
        { value: 'de', label: 'Deutsch' },
    ];

    $scope.timezoneOptions = [
        { text: 'GMT−12', value: -12 },
        { text: 'GMT−11', value: -11 },
        { text: 'GMT−10', value: -10 },
        { text: 'GMT−9', value: -9 },
        { text: 'GMT−8', value: -8 },
        { text: 'GMT−7', value: -7 },
        { text: 'GMT−6', value: -6 },
        { text: 'GMT−5', value: -5 },
        { text: 'GMT−4', value: -4 },
        { text: 'GMT−3', value: -3 },
        { text: 'GMT−2', value: -2 },
        { text: 'GMT−1', value: -1 },
        { text: 'GMT+0 (UTC)', value: 0 },
        { text: 'GMT+1', value: 1 },
        { text: 'GMT+2', value: 2 },
        { text: 'GMT+3', value: 3 },
        { text: 'GMT+4', value: 4 },
        { text: 'GMT+5', value: 5 },
        { text: 'GMT+6', value: 6 },
        { text: 'GMT+7', value: 7 },
        { text: 'GMT+8', value: 8 },
        { text: 'GMT+9', value: 9 },
        { text: 'GMT+10', value: 10 },
        { text: 'GMT+11', value: 11 },
        { text: 'GMT+12', value: 12 },
        { text: 'GMT+13', value: 13 },
        { text: 'GMT+14', value: 14 },
    ];

    // settings allowed keys
    const allowedKeys = [
        'language',
        'theme',
        TAGS,
        ALLOW_PICK_MULTI_TAGS,
        YOUTUBE_PRIVACY_STATUS,
        EMBED_HEIGHT_RESPONSIVE_DEFAULT,
        QUOTE_STYLE,
        GENERAL_JSON_LD_TIMEZONE_OFFSET,
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

    $scope.setFormRef = (childScope) => {
        $scope.settingsForm = childScope.settingsForm;
    };

    $scope.onTagsChange = (tags) => {
        $scope.liveblogSettings.global_tags.value = tags;
        $scope.settingsForm.$setDirty();
        $scope.$apply();
    };

    $scope.saveSettings = () => {
        notify.info(gettext('Saving settings'));
        let patch = {};
        const reqArr = [];

        _.forEach($scope.liveblogSettings, (item, key) => {
            if (!_.includes(allowedKeys, key)) {
                return;
            }

            patch = {
                key: key,
                value: item.value,
            };
            reqArr.push(api('global_preferences').save(item, patch));
        });

        $q.all(reqArr).then(() => {
            notify.info(gettext('Settings saved successfully'));
            $scope.settingsForm.$setPristine();
        }, () => {
            notify.error(gettext('Saving settings failed. Please try again later'));
        });
    };

    $scope.close = () => {
        // return to blog list page
        $location.path('/liveblog/');
    };
};

LiveblogSettingsController.$inject = ['$scope', 'api', '$location', 'notify', 'gettext', '$q'];

export default LiveblogSettingsController;
