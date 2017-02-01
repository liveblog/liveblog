(function() {
    'use strict';

    LiveblogFreetypesController.$inject = ['api', '$location', 'notify', 'gettext',
    '$q', '$sce', 'config', 'lodash', 'upload', 'blogService', 'modal'];
    function LiveblogFreetypesController(api, $location, notify, gettext,
    $q, $sce, config, _, upload, blogService, modal) {
        var vm = this;

        function getFreetypes() {
            api.freetypes.query().then(function(data) {
                vm.freetypes = data._items;
                notify.info('Free types loaded');
            }, function(data) {
                notify.error(gettext('There was an error getting the free type'));
            })
        };

        angular.extend(vm, {
            //new item type modal is closed by default§
            freetypeModalActive: false,
            editFreetype: false,
            dialogFreetype: {
                loading: false,
                name: '',
                template: ''
            },
            //open dialog for adding editing an item type
            openFreetypeDialog: function(freetype) {

                vm.editFreetype = freetype || false;

                if (vm.editFreetype) {
                    vm.dialogFreetype.name = vm.editFreetype.name;
                    vm.dialogFreetype.template = vm.editFreetype.template;
                } else {
                    vm.dialogFreetype.name = '';
                    vm.dialogFreetype.template = '';
                }
                vm.freetypeModalActive = true;
            },
            saveFreetype: function() {
                vm.freetypeModalActive = false;
                vm.dialogFreetype.loading = true;
                if (vm.editFreetype) {
                    api.freetypes.save(vm.editFreetype, {name: vm.dialogFreetype.name, template: vm.dialogFreetype.template}).then(function(data) {
                        vm.dialogFreetype.loading = false;
                        getFreetypes();
                        vm.editFreetype = false;
                    }, function(data) {
                        notify.error(gettext('Saving dit not work, please try again later!'));
                    });
                } else {
                    api.freetypes.save({name: vm.dialogFreetype.name, template: vm.dialogFreetype.template}).then(function(data) {
                        vm.dialogFreetype.loading = false;
                        getFreetypes();
                    }, function(data) {
                        notify.error(gettext('Saving dit not work, please try again later!'));
                    });
                }
            },
            removeFreetype: function(freetype, $index) {
                modal.confirm(gettext('Are you sure you want to remove this free type?')).then(function() {
                    api.freetypes.remove(freetype).then(function(data) {
                        vm.freetypes.splice($index, 1);
                    }, function(data) {
                        notify.errorp(gettext('Can\'t remove free type'));
                    });
                });
            },
            cancelCreate: function() {
                vm.freetypeModalActive = false;
            }
        });

        getFreetypes();
    }

    var liveblogFreetypesModule = angular.module('liveblog.freetypes', [])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/freetypes/', {
                label: gettext('Free types manager'),
                controller: LiveblogFreetypesController,
                controllerAs: 'vm',
                category: superdesk.MENU_MAIN,
                adminTools: true,
                privileges: {'global_preferences': 1},
                templateUrl: 'scripts/liveblog-freetypes/views/list.html'
            });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('freetypes', {
            type: 'http',
            backend: {rel: 'freetypes'}
        });
    }])
    .directive("templateEditable", function() {
        return {
            restrict: "A",
            require: "ngModel",
            link: function(scope, element, attrs, ngModel) {
                function read() {
                    ngModel.$setViewValue(element.text());
                }
                ngModel.$render = function() {
                    element.text(ngModel.$viewValue || "");
                };
                element.bind("blur keyup change", function() {
                    scope.$apply(read);
                });
            }
        }
    });
    return liveblogFreetypesModule;

})();
