import _ from 'lodash';
import themeSettingsModalTpl from 'scripts/liveblog-themes/views/theme-settings-modal.ng1';
import { Moment } from 'moment'; // eslint-disable-line
import { renderStylesTab } from './components/stylesTab';

interface IThemeName {
    label: string;
    name: string;
}

interface IScope {
    theme?: ITheme;
    modalOpened: any;
    themeNames: Array<IThemeName>;

    settings: any;
    styleSettings: IStyleSettings;
    settingsTab: string;
    stylesTab: string;
    tabs: Array<string>;
    activeTab: string;

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
        .directive('themeSettingsModal', ['api', '$q', 'notify',
            (api, $q, notify) => {
                return {
                    templateUrl: themeSettingsModalTpl,
                    scope: {
                        theme: '=',
                        modalOpened: '=',
                        themeNames: '=',
                    },
                    link: (scope: IScope) => {
                        const vm = scope;

                        // all basic configudation for tabs
                        vm.settingsTab = 'Settings',
                        vm.stylesTab = 'Styles',
                        vm.tabs = [vm.settingsTab, vm.stylesTab];
                        vm.activeTab = vm.settingsTab;

                        angular.extend(vm, {
                            optionsAreloading: true,
                            settings: angular.copy(vm.theme.settings) || {},
                            styleSettings: angular.copy(vm.theme.styleSettings) || {},
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
                                if (!angular.equals(vm.theme.settings, vm.settings)) {
                                    api.themes.update(vm.theme, { settings: vm.settings }).then((data) => {
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
                        // Initialization
                        /**
                         * Collect a list of options for the given theme and its parents
                         * @param {object} theme
                         * @param {string} optsAttr The attribute of options to be collected
                         * @returns {array} Promise with list of options
                         */
                        const collectOptions = <T = any>(
                            theme: ITheme, optionsParam = [], optsAttr = 'options'): Promise<T> => {
                            // keep the theme's options in `options`
                            let options = optionsParam;

                            // attribute could be `options` or `styleOptions`
                            // because they both share more or less the same logic
                            const themeOptions = theme[optsAttr];

                            if (themeOptions) {
                                const alreadyPresent = _.map(options, (o: any) => o.name);
                                // keep only options that are not already saved (children options are prioritary)

                                options = _.filter(themeOptions, (option) =>
                                    alreadyPresent.indexOf(option.name) === -1
                                ).concat(options);
                            }
                            // retrieve parent options
                            if (theme.extends) {
                                return api.themes.getById(theme.extends).then((parentTheme) =>
                                    collectOptions(parentTheme, options, optsAttr)
                                );
                            }

                            // return the options when there is no more parent theme
                            return $q.when(options);
                        };

                        // collect the options for the theme and its parents
                        collectOptions(vm.theme).then((options) => {
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

                        // time for styleOptions to be collected
                        collectOptions<Array<IStyleGroup>>(vm.theme, [], 'styleOptions').then((styleOptions) => {
                            styleOptions.forEach((group) => {
                                if (!angular.isDefined(vm.styleSettings[group.name])) {
                                    vm.styleSettings[group.name] = {};
                                }

                                group.options.forEach((option) => {
                                    const propertyName = option.property as string;

                                    if (!angular.isDefined(vm.styleSettings[group.name][propertyName])) {
                                        vm.styleSettings[group.name][propertyName] = option.default || null;
                                    }
                                });
                            });

                            angular.extend(vm, { styleOptions: styleOptions });
                        });
                    },
                };
            }])
        .directive('stylesTabComponent', [() => {
            return {
                scope: {
                    settings: '=',
                    options: '=',
                },
                link: (scope, element) => {
                    renderStylesTab($(element).get(0), scope.options, scope.settings);
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
