import listViewTpl from 'scripts/liveblog-freetypes/views/list.html'

LiveblogFreetypesController.$inject = ['api', '$location', 'notify', 'gettext',
'$q', '$sce', 'config', 'lodash', 'upload', 'blogService', 'modal'];

function LiveblogFreetypesController(api, $location, notify, gettext,
$q, $sce, config, _, upload, blogService, modal) {
    var vm = this;
        function getFreetypes(silent) {
            silent = silent || false;
            api.freetypes.query().then(function(data) {
                angular.forEach(data._items, function(item){
                    item.isUsed = false;
                    api.items.query({
                        "max_results": 1,
                        "source": {
                            "query": {
                                "filtered": {
                                    "filter": {
                                        "and": [{
                                            "term": {
                                                "item_type": item.name
                                            }
                                        }]
                                    }
                                }
                            }
                        }
                    }).then(function(items){
                        if (items._items.length) {
                            item.isUsed = true;
                        }
                    });
                });
                vm.freetypes = data._items;
                if (!silent) {
                    notify.info('Free types loaded');
                }
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
                vm.checkItemIsUsed(freetype).then(function() {
                    //refresh freetypes to make sure we use a fresh title
                    getFreetypes();
                    vm.editFreetype = freetype || false;

                    if (vm.editFreetype) {
                        vm.dialogFreetype.name = vm.editFreetype.name;
                        vm.dialogFreetype.template = vm.editFreetype.template;
                    } else {
                        vm.dialogFreetype.name = '';
                        vm.dialogFreetype.template = '';
                    }
                    vm.freetypeModalActive = true;
                });
            },
            handleSaveError: function(data) {
                var errorMsg = gettext('Saving did not work, please try again later!');
                if (data.data._issues.template) {
                    errorMsg = gettext(data.data._issues.template);
                }
                notify.error(errorMsg, 10000);
            },
            preSaveChecks: function(template, name) {
                var valid = true, unique = true;
                //check for variables
                var patt = /\$([\$a-z0-9_.\[\]]+)/gi;
                if (!patt.test(template)) {
                    valid = false;
                    notify.error(gettext(
                        'Template must contain at least one variable! Check the documentation for further information'
                    ), 10000);
                }
                //check for unique name
                angular.forEach(vm.freetypes, function(freetype) {
                    if (freetype.name === name) {
                        if (!vm.editFreetype) {
                            //it's a new freetype so not unique
                            unique = false;
                        } else if (vm.editFreetype._id !== freetype._id) {
                            //not editing the same freetype
                            unique = false;
                        }
                    }
                });
                if (!unique) {
                    valid = false;
                    notify.error(gettext('Free types titles must be unique'), 10000);
                }
                return valid
            },
            saveFreetype: function() {
                if (vm.preSaveChecks(vm.dialogFreetype.template, vm.dialogFreetype.name)) {
                    vm.dialogFreetype.loading = true;
                    if (vm.editFreetype) {
                        api
                            .freetypes
                            .save(vm.editFreetype, {name: vm.dialogFreetype.name, template: vm.dialogFreetype.template})
                            .then(function(data) {
                                vm.dialogFreetype.loading = false;
                                vm.freetypeModalActive = false;
                                getFreetypes();
                                vm.editFreetype = false;
                            }, function(data) {
                                vm.handleSaveError(data);
                            });
                    } else {
                        api
                            .freetypes
                            .save({name: vm.dialogFreetype.name, template: vm.dialogFreetype.template})
                            .then(function(data) {
                                vm.dialogFreetype.loading = false;
                                vm.freetypeModalActive = false;
                                getFreetypes();
                            }, function(data) {
                                vm.handleSaveError(data);
                            });
                    }
                }
        },
        checkItemIsUsed: function(freetype) {
            return $q(function(resolve, reject) {
                if (!freetype) {
                    resolve();
                }
                else if (freetype.isUsed) {
                    modal.confirm(gettext(`This free type template is currently used in an active live blog.<br/>
                        If you change or alter it, you may not be able to edit this kind of free types anymore.<br/>
                        Are you sure you want to rename, change or remove it?`)).then(function() {
                        resolve();
                    }, function() {
                        reject();
                    });
                } else {
                    resolve();
                }
            });
        },
        removeFreetype: function(freetype, $index) {
            vm.checkItemIsUsed(freetype).then(function() {
                modal.confirm(gettext('Are you sure you want to remove this free type?')).then(function() {
                    api.freetypes.remove(freetype).then(function(data) {
                        vm.freetypes.splice($index, 1);
                    }, function(data) {
                        notify.error(gettext('Can\'t remove free type'));
                    });
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
    .config(['superdeskProvider', 'config', function(superdesk, config) {
        if (config.subscriptionLevel !== 'solo')
            superdesk
                .activity('/freetypes/', {
                    label: gettext('Free types manager'),
                    controller: LiveblogFreetypesController,
                    controllerAs: 'vm',
                    betaMark: true,
                    category: superdesk.MENU_MAIN,
                    adminTools: true,
                    privileges: {'global_preferences': 1},
                    templateUrl: listViewTpl
                });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('freetypes', {
            type: 'http',
            backend: {rel: 'freetypes'}
        });
}])
.config(['apiProvider', function(apiProvider) {
    apiProvider.api('freetypes', {
        type: 'http',
        backend: {rel: 'freetypes'}
    });
}]);

export default liveblogFreetypesModule;

