import themeSettingsModalTpl from 'scripts/liveblog-themes/views/theme-settings-modal.html';

(function() {
    angular.module('liveblog.themes')
    .filter('exampleDate', [ 'moment', function(moment) {
        return function(string) {
            return moment().format(string);
        };
    }])
    .directive('themeSettingsModal', ['api', '$q', 'notify',
        function(api, $q, notify) {
            return {
                templateUrl: themeSettingsModalTpl,
                scope: {
                    theme: '=',
                    modalOpened: '='
                },
                link: function(scope) {
                    var vm = scope;

                    angular.extend(vm, {
                        optionsAreloading: true,
                        settings: angular.copy(vm.theme.settings) || {},
                        options: [],
                        datetimeFormats: [
                            'MMMM Do, YYYY HH:mm',
                            'YYYY-MM-DD hh:mm a',
                            'DD/MM/YYYY hh:mm A',
                            'HH:mm D.M.YYYY',
                            'lll'
                        ],
                        submitSettings: function(shouldClose) {
                            if (!angular.equals(vm.theme.settings, vm.settings)) {
                                api.themes.update(vm.theme, {settings: vm.settings}).then(function(data) {
                                    vm.settings = angular.copy(data.settings);
                                    // reset the dirty state to false
                                    vm.themeSettingsForm.$setPristine();
                                    if (shouldClose) {
                                        vm.closeModal();
                                    }
                                }, function(error) {
                                    notify.error(error.data._error.message);
                                });
                            } else if (shouldClose) {
                                vm.closeModal();
                            }
                        },
                        closeModal: function() {
                            scope.modalOpened = false;
                            vm.theme = undefined;
                        },
                        /**
                         * Check if the option requirements are satified through the `dependsOn` property
                         * @param {object} option
                         * @returns {boolean} true if the option `dependsOn` are satisfied
                         */
                        optionRequirementIsSatisfied: function(option) {
                            if (!angular.isDefined(option.dependsOn)) {
                                return true;
                            }
                            var isSatisfied = true;
                            angular.forEach(option.dependsOn, function(value, key) {
                                isSatisfied = isSatisfied && vm.settings[key] === value;
                            });
                            return isSatisfied;
                        }
                    });

                    scope.vm = vm;
                    // Initialization
                    /**
                     * Collect a list of options for the given theme and its parents
                     * @param {object} theme
                     * @returns {array} list of options
                     */
                    function collectOptions(theme, options) {
                        // options is used for recursiveness
                        options = options || [];
                        // keep the theme's options in `options`
                        if (theme.options) {
                            var alreadyPresent = _.map(options, function(o) {return o.name;});
                            // keep only options that are not already saved (children options are prioritary)
                            options = _.filter(theme.options, function(option) {
                                return alreadyPresent.indexOf(option.name) === -1;
                            }).concat(options);
                        }
                        // retrieve parent options
                        if (theme.extends) {
                            return api.themes.getById(theme.extends).then(function(parentTheme) {
                                return collectOptions(parentTheme, options);
                            });
                        }

                        // return the options when there is no more parent theme
                        return $q.when(options);
                    }
                    // collect the options for the theme and its parents
                    collectOptions(vm.theme).then(function(options) {
                        // set default settings value from options default values
                        options.forEach(function(option) {
                            if (!angular.isDefined(vm.settings[option.name])) {
                                vm.settings[option.name] = option.default;
                            }
                        });
                        angular.extend(vm, {
                            options: options,
                            optionsAreloading: false
                        });
                    });
                    // watch the modalOpened model to reset the selected theme when the user close the modal
                    //scope.$watch(
                    //    function() {return vm.modalOpened;},
                    //    function(isOpened) {
                    //        if (!isOpened) {
                    //            vm.closeModal();
                    //        }
                    //    }
                    //);

                    //scope.$watch('themeSettingsModal', () => {
                    //    scope.vm.isOpened = vm.themeSettingsModal;
                    //});
            }
            //controllerAs: 'vm',
            //bindToController: true,
            //controller: ThemeSettingsModalController
        };
    }])
    .filter('linkup', ['$sce', function($sce) {
        return function(value) {
            if (!value) {
                return value;
            }
            var removeRegx = /(<([^>]+)>)/ig,
                linkupRegx = /((http(s)?:)?\/\/[^\s]*)/ig,
                linkReplace = '<a href="$1" target="_blank">$1</a>';
            return $sce.trustAsHtml(value.replace(removeRegx, '').replace(linkupRegx, linkReplace));
        }
    }]);
})();
