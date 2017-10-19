import outputModalTpl from 'scripts/liveblog-edit/views/output-modal.html';

/**
 * @desc directive to open a modal to create or edit a channel output
 * @example <output-modal modal-active="x" outputs="array" output="object" blog="blog"></output-modal>
 */

export default function outputModal() {
    return {
        restrict: 'E',
        scope: {
            modalActive: '=',
            outputs: '=',
            output: '=',
            oldOutput: '=',
            blog: '='
        },
        templateUrl: outputModalTpl,
        controllerAs: 'vm',
        controller: outputModalController,
        bindToController: true
    };
}

outputModalController.$inject = ['$rootScope', '$q', 'api', 'urls', 'notify', 'modal', 'upload', 'adsUtilSevice'];

function outputModalController($rootScope, $q, api, urls, notify, modal, upload, adsUtilSevice) {
    var vm = this;
    vm.themes = [];
    vm.collections = [];
    vm.readyToSave = false;
    vm.disableSave = false;
    vm.imageSaved = false;
    vm.cancelModal = cancelModal;
    vm.saveOutput = saveOutput;
    vm.saveOutputImage = saveOutputImage;
    vm.removeOutputImage = removeOutputImage;
    vm.removeLogoImage = removeLogoImage;
    vm.notValidName = adsUtilSevice.uniqueNameInItems;
    vm.ordering = [{'title': 'Ascending', 'value': 1}, {'title': 'Descending', 'value': -1}];

    var notif_listener = $rootScope.$on('blog', (e, data) => {
        if (data.blog_id === vm.blog._id && data.published === 1) {
            // update the blog property
            vm.blog.public_urls = data.public_urls;
        }
    });

    initialize().then(function() {
        vm.readyToSave = true;
    });
    loadThemes();

    function cancelModal() {
        vm.modalActive = false;
        vm.disableSave = false;
    }

    function initialize() {
        return api('collections').query({where: {deleted: false}})
        .then(function(data) {
            vm.collections = data._items;
            return data._items;
        })
        .catch(function(data) {
            notify.error(gettext('There was an error getting the collections'));
        });
    }

    function loadThemes() {
        vm.themesLoading = true;
        return api('themes').query({})
        .then(function(data) {
            vm.themes = data._items.filter((theme) => !theme.abstract);
            vm.themesLoading = false;
        }, function(data) {
            vm.themesLoading = false;
            notify.error(gettext('There was an error getting the themes'));
        });
    }

    function saveOutput() {
        var promises = [],
            newOutput = {
                name: vm.output.name,
                blog: vm.blog._id,
                theme: vm.output.theme,
                collection: vm.output.collection,
                style: vm.output.style,
                settings: vm.output.settings,
                logo_url: vm.output.logo_url
            };
        // disable save button
        vm.disableSave = true;
        // if there is a new background image uploaded
        if (vm.output.preview && vm.output.preview.img) {
            promises.push(saveOutputImage('preview', 'progress')
                .then(function(data) {
                    let pictureUrl = data.renditions.original.href;
                    newOutput.style['background-image'] = pictureUrl;
                    newOutput.picture = data._id;
                })
            );
        }
        // if there is a new logo image uploaded
        if (vm.output.preview_logo && vm.output.preview_logo.img) {
            promises.push(saveOutputImage('preview_logo', 'progress_logo')
                .then(function(data) {
                    let logoUrl = data.renditions.original.href;
                    newOutput.logo_url = logoUrl;
                    newOutput.logo = data._id;
                })
            );
        }

        if (vm.oldOutput && vm.output.theme !== vm.oldOutput.theme) {
            var newBlog = {
                public_urls: angular.copy(vm.blog.public_urls)
            };
            newBlog.public_urls.output[vm.output._id]='';
            api('blogs').save(vm.blog, newBlog)
            .then(function(){
                notify.info(gettext('Blog saved'));
            })
        }

        $q.all(promises).then(function(){
            if (newOutput.settings && newOutput.settings.frequency) {
                newOutput.settings.frequency = parseInt(newOutput.settings.frequency, 10);
            }
            return api('outputs').save(vm.output, newOutput)
            .then(handleSuccessSave, handleErrorSave);            
        });
    }

    function handleSuccessSave() {
        notify.info(gettext('Output saved successfully'));
        vm.output = {};
        vm.modalActive = false;
        vm.disableSave = false;
        $rootScope.$broadcast('output.saved');
    }

    function handleErrorSave() {
        notify.error(gettext('Something went wrong, please try again later!'), 5000)
    }

    function saveOutputImage(preview, progress) {
        var deferred = $q.defer(),
            form = {},
            config = vm.output[preview];
        if (config.img) {
            form.media = config.img;
        } else if (config.url) {
            form.URL = config.url;
        } else {
            deferred.reject();
        }
        
        // return a promise of upload which will call the success/error callback
        urls.resource('archive').then((uploadUrl) => upload.start({
            method: 'POST',
            url: uploadUrl,
            data: form
        })
        .then((response) => {
            if (response.data._status === 'ERR') {
                deferred.reject();
                return;
            }
            deferred.resolve(response.data);
            vm.imageSaved = true;
        }, (error) => {
            notify.error(
                error.statusText !== '' ? error.statusText : gettext('There was a problem with your upload')
            );
            deferred.reject();
        }, (progress) => {
            vm.output[progress] = {
                width: Math.round(progress.loaded / progress.total * 100.0)
            }
        }));
        return deferred.promise;
    }

    function removeOutputImage() {
        modal.confirm(gettext('Are you sure you want to remove the background image?'))
        .then(() => {
            vm.output.preview = {};
            vm.output.progress = {width: 0};
            vm.output.style['background-image'] = '';
            vm.imageSaved = false;
        });
    }

    function removeLogoImage() {
        modal.confirm(gettext('Are you sure you want to remove the logo image?'))
        .then(() => {
            vm.output.preview_logo = {};
            vm.output.progress_logo = {width: 0};
            vm.output.logo_url = '';
            vm.imageSaved = false;
        });        
    }
}
