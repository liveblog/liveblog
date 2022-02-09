import ReactDOM from 'react-dom';
import _ from 'lodash';
import themeSettingsModalTpl from 'scripts/liveblog-themes/views/theme-settings-modal.ng1';
import type { Moment } from 'moment';
import { renderStylesTab } from './components/stylesTab';
import { collectOptions, themeStylesOptionsAndSettings, defaultStyleSettings } from './theme-utils';

interface IThemeName {
    label: string;
    name: string;
}

interface IScope {
    theme?: ITheme;
    modalOpened: any;
    themeNames: IThemeName[];

    settings: any;
    styleSettings: IStyleSettings;
    settingsTab: string;
    stylesTab: string;
    tabs: string[];
    activeTab: string;
    supportThemeStyles: boolean;

    themeSettingsForm: any;
    closeModal: () => void;
    vm: IScope;
}

(() => {
    angular.module('liveblog.themes')
        .filter('exampleDate', ['moment', (moment) => {
            return (text: string): Moment => {
                return moment().format(text);
            };
        }])
        .directive('themeSettingsModal', ['api', '$q', 'notify', 'config',
            (api, $q, notify, config) => {
                return {
                    templateUrl: themeSettingsModalTpl,
                    scope: {
                        theme: '=',
                        modalOpened: '=',
                        themeNames: '=',
                    },
                    link: (scope: IScope) => {
                        const vm = scope;
                        const isSoloSubscription = config.subscriptionLevel === 'solo';

                        // all basic configuration for tabs
                        vm.settingsTab = 'Settings',
                        vm.stylesTab = 'Styles',
                        vm.tabs = [vm.settingsTab];
                        vm.activeTab = vm.settingsTab;
                        vm.supportThemeStyles = vm.theme.supportStylesSettings && !isSoloSubscription;

                        if (vm.supportThemeStyles) {
                            vm.tabs.push(vm.stylesTab);
                        }

                        angular.extend(vm, {
                            optionsAreloading: true,
                            styleOptionsAreloading: true,
                            settings: angular.copy(vm.theme.settings) || {},
                            styleSettings: angular.copy(vm.theme.styleSettings) || {},
                            defaultStyleSettings: {},
                            options: [],
                            styleOptions: [],
                            showAdvancedSettings: false,
                            hasAdvancedOptions: false,

                            datetimeFormats: [
                                'MMMM Do, YYYY HH:mm',
                                'YYYY-MM-DD hh:mm a',
                                'DD/MM/YYYY hh:mm A',
                                'HH:mm D.M.YYYY',
                                'lll',
                            ],

                            submitSettings: (shouldClose: boolean) => {
                                const settingsChanged = !angular.equals(vm.theme.settings, vm.settings);
                                const styleSettingsChanged = !angular.equals(vm.theme.styleSettings, vm.styleSettings);

                                if (settingsChanged || styleSettingsChanged) {
                                    const updates = {
                                        settings: vm.settings,
                                        styleSettings: vm.styleSettings,
                                    };

                                    api.themes.update(vm.theme, updates).then((data) => {
                                        vm.settings = angular.copy(data.settings);
                                        // reset the dirty state to false
                                        vm.themeSettingsForm.$setPristine();
                                        if (shouldClose) {
                                            vm.closeModal();
                                        }
                                    }, (error) => {
                                        notify.error(error.data._error.message);
                                    });
                                } else if (shouldClose) {
                                    vm.closeModal();
                                }
                            },
                            closeModal: () => {
                                scope.modalOpened = false;
                                vm.theme = undefined;
                            },
                            /**
                             * Check if the option requirements are satified through the `dependsOn` property
                             * @param {object} option
                             * @returns {boolean} true if the option `dependsOn` are satisfied
                             */
                            optionRequirementIsSatisfied: (option) => {
                                if (!angular.isDefined(option.dependsOn)) {
                                    return true;
                                }
                                let isSatisfied = true;

                                angular.forEach(option.dependsOn, (value, key) => {
                                    isSatisfied = isSatisfied && vm.settings[key] === value;
                                });
                                return isSatisfied;
                            },
                        });

                        scope.vm = vm;

                        // collect the options for the theme and its parents
                        collectOptions(api, $q, vm.theme).then((options) => {
                            // set default settings value from options default values
                            options.forEach((option) => {
                                if (!angular.isDefined(vm.settings[option.name])) {
                                    vm.settings[option.name] = option.default;
                                }
                            });
                            angular.extend(vm, {
                                options: options,
                                optionsAreloading: false,
                                hasAdvancedOptions: options.filter((x) => x.isAdvanced).length > 0,
                            });
                        });

                        themeStylesOptionsAndSettings(api, $q, vm).then(({ styleOptions, styleSettings }) => {
                            defaultStyleSettings(api, $q, vm.theme)
                                .then((defaultSettings) => {
                                    angular.extend(vm, {
                                        styleOptions: styleOptions,
                                        styleOptionsAreloading: false,
                                        styleSettings: styleSettings,
                                        defaultStyleSettings: defaultSettings,
                                    });
                                });
                        });
                    },
                };
            }])
        .directive('stylesTabComponent', ['$rootScope', 'config', ($rootScope, config) => {
            return {
                scope: {
                    defaultSettings: '=',
                    settings: '=',
                    options: '=',
                    form: '=',
                },
                link: (scope, element) => {
                    const mountPoint = $(element).get(0);
                    const submitForm = scope.form;
                    const stylesTabProps = {
                        styleOptions: scope.options,
                        settings: scope.settings,
                        defaultSettings: scope.defaultSettings,
                        googleApiKey: config.google.key || '',

                        onStoreChange: () => {
                            submitForm.$setDirty();
                            $rootScope.$apply();
                        },
                    };

                    renderStylesTab(stylesTabProps, mountPoint);

                    scope.$on('$destroy', () => ReactDOM.unmountComponentAtNode(mountPoint));
                },
            };
        }])
        .filter('linkup', ['$sce', ($sce) => {
            return (value?: string) => {
                if (!value) {
                    return value;
                }

                const removeRegx = /(<([^>]+)>)/ig;
                const linkupRegx = /((http(s)?:)?\/\/[^\s]*)/ig;
                const linkReplace = '<a href="$1" target="_blank">$1</a>';

                return $sce.trustAsHtml(value.replace(removeRegx, '').replace(linkupRegx, linkReplace));
            };
        }]);
})();
