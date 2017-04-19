import outputModalTpl from 'scripts/liveblog-edit/views/output-modal.html';

/**
 * @desc directive to open a modal to create or edit a channel output
 * @example <output-modal modal-active="x" outputs="array" output="object" blog-id="id"></output-modal>
 */

export default function outputModal() {
    return {
        restrict: 'E',
        scope: {
            modalActive: '=',
            outputs: '=',
            output: '=',
            blogId: '@'
        },
        templateUrl: outputModalTpl,
        controllerAs: 'vm',
        controller: outputModalController,
        bindToController: true
    };
}

outputModalController.$inject = ['$rootScope', 'api', 'urls', 'notify', 'modal', 'upload'];

function outputModalController($rootScope, api, urls, notify, modal, upload) {
    //console.log('utilService ', utilService);
    var vm = this;
    vm.collections = [];
    vm.readyToSave = false;
    vm.disableSave = false;
    vm.imageSaved = false;
    vm.cancelModal = cancelModal;
    vm.saveOutput = saveOutput;
    vm.saveOutputImage = saveOutputImage;
    vm.removeOutputImage = removeOutputImage;

    initialize().then(function() {
        vm.readyToSave = true;
    });

    function cancelModal() {
        vm.modalActive = false;
        vm.disableSave = false;
    }

    function initialize() {
        return api('collections').query({where: {deleted: false}})
        .then(function(data) {
            vm.collections = data._items;
        })
        .catch(function(data) {
            notify.error(gettext('There was an error getting the collections'));
        });
    }

    function saveOutput() {
        var newOutput = {
            name: vm.output.name,
            blog: vm.blogId,
            collection: vm.output.collection,
            style: vm.output.style
        };
        // disable save button
        vm.disableSave = true;
        // if there is a new image uploaded
        if (vm.output.preview && vm.output.preview.img) {
            saveOutputImage()
            .then(function() {
                newOutput.style['background-image'] = vm.output.style['background-image'];
                return api('outputs').save(vm.output, newOutput)
                .then(handleSuccessSave, handleErrorSave);
            })
        } else {
            return api('outputs').save(vm.output, newOutput)
            .then(handleSuccessSave, handleErrorSave);
        }
    }

    function handleSuccessSave() {
        notify.info(gettext('Advert saved successfully'));
        vm.output = {};
        vm.modalActive = false;
        vm.disableSave = false;
        $rootScope.$broadcast('output.saved');
    }

    function handleErrorSave() {
        notify.error(gettext('Something went wrong, please try again later!'), 5000)
    }

    function saveOutputImage() {
        var form = {};
        var config = vm.output.preview;
        if (config.img) {
            form.media = config.img;
        } else if (config.url) {
            form.URL = config.url;
        } else {
            return;
        }
        
        // return a promise of upload which will call the success/error callback
        return urls.resource('archive').then((uploadUrl) => upload.start({
            method: 'POST',
            url: uploadUrl,
            data: form
        })
        .then((response) => {
            if (response.data._status === 'ERR') {
                return;
            }
            var pictureUrl = response.data.renditions.viewImage.href;

            vm.output.style['background-image'] = pictureUrl;                
            vm.imageSaved = true;
        }, (error) => {
            notify.error(
                error.statusText !== '' ? error.statusText : gettext('There was a problem with your upload')
            );
        }, (progress) => {
            vm.output.progress = {
                width: Math.round(progress.loaded / progress.total * 100.0)
            }
        }));
    }

    function removeOutputImage() {
        modal.confirm(gettext('Are you sure you want to remove the image?'))
        .then(() => {
            vm.output.preview = {};
            vm.output.progress = {width: 0};
            vm.imageSaved = false;
            vm.output.style['background-image'] = '';
        });
    }
}