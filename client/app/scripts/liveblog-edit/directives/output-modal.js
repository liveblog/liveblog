import outputModalTpl from 'scripts/liveblog-edit/views/output-modal.ng1';

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
            blog: '=',
        },
        templateUrl: outputModalTpl,
        controllerAs: 'self',
        controller: outputModalController,
        bindToController: true,
    };
}

outputModalController.$inject = ['$rootScope', '$q', 'api', 'urls', 'notify', 'modal', 'upload', 'adsUtilSevice'];

function outputModalController($rootScope, $q, api, urls, notify, modal, upload, adsUtilSevice) {
    const self = this;

    self.themes = [];
    self.collections = [];
    self.readyToSave = false;
    self.disableSave = false;
    self.imageSaved = false;
    self.cancelModal = cancelModal;
    self.saveOutput = saveOutput;
    self.saveOutputImage = saveOutputImage;
    self.removeOutputImage = removeOutputImage;
    self.removeLogoImage = removeLogoImage;
    self.notValidName = adsUtilSevice.uniqueNameInItems;
    self.ordering = [{title: 'Ascending', value: 1}, {title: 'Descending', value: -1}];

    $rootScope.$on('blog', (e, data) => {
        if (data.blog_id === self.blog._id && data.published === 1) {
            // update the blog property
            self.blog.public_urls = data.public_urls;
        }
    });

    initialize().then(() => {
        self.readyToSave = true;
    });
    loadThemes();

    function cancelModal() {
        self.modalActive = false;
        self.disableSave = false;
    }

    function initialize() {
        return api('collections').query({where: {deleted: false}})
            .then((data) => {
                self.collections = data._items;
                return data._items;
            })
            .catch((data) => {
                notify.error(gettext('There was an error getting the collections'));
            });
    }

    function loadThemes() {
        self.themesLoading = true;
        return api('themes').query({})
            .then((data) => {
                self.themes = data._items.filter((theme) => !theme.abstract);
                self.themesLoading = false;
            }, (data) => {
                self.themesLoading = false;
                notify.error(gettext('There was an error getting the themes'));
            });
    }

    function saveOutput() {
        const promises = [];
        const newOutput = {
            name: self.output.name,
            blog: self.blog._id,
            theme: self.output.theme,
            collection: self.output.collection,
            style: self.output.style,
            settings: self.output.settings,
            logo_url: self.output.logo_url,
        };
        // disable save button

        self.disableSave = true;
        // if there is a new background image uploaded
        if (self.output.preview && self.output.preview.img) {
            promises.push(saveOutputImage('preview', 'progress')
                .then((data) => {
                    const pictureUrl = data.renditions.original.href;

                    newOutput.style['background-image'] = pictureUrl;
                    newOutput.picture = data._id;
                })
            );
        }
        // if there is a new logo image uploaded
        if (self.output.preview_logo && self.output.preview_logo.img) {
            promises.push(saveOutputImage('preview_logo', 'progress_logo')
                .then((data) => {
                    const logoUrl = data.renditions.original.href;

                    newOutput.logo_url = logoUrl;
                    newOutput.logo = data._id;
                })
            );
        }

        if (self.oldOutput && self.output.theme !== self.oldOutput.theme) {
            const newBlog = {
                public_urls: angular.copy(self.blog.public_urls),
            };

            newBlog.public_urls.output[self.output._id] = '';
            api('blogs').save(self.blog, newBlog)
                .then(() => {
                    notify.info(gettext('Blog saved'));
                });
        }

        $q.all(promises).then(() => {
            if (newOutput.settings && newOutput.settings.frequency) {
                newOutput.settings.frequency = parseInt(newOutput.settings.frequency, 10);
            }
            return api('outputs').save(self.output, newOutput)
                .then(handleSuccessSave, handleErrorSave);
        });
    }

    function handleSuccessSave() {
        notify.info(gettext('Output saved successfully'));
        self.output = {};
        self.modalActive = false;
        self.disableSave = false;
        $rootScope.$broadcast('output.saved');
    }

    function handleErrorSave() {
        notify.error(gettext('Something went wrong, please try again later!'), 5000);
    }

    function saveOutputImage(preview, progress) {
        const deferred = $q.defer();
        const form = {};
        const config = self.output[preview];

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
            data: form,
        })
            .then((response) => {
                if (response.data._status === 'ERR') {
                    deferred.reject();
                    return;
                }
                deferred.resolve(response.data);
                self.imageSaved = true;
            }, (error) => {
                notify.error(
                    error.statusText !== '' ? error.statusText : gettext('There was a problem with your upload')
                );
                deferred.reject();
            }, (progress) => {
                self.output[progress] = {
                    width: Math.round(progress.loaded / progress.total * 100.0),
                };
            }));
        return deferred.promise;
    }

    function removeOutputImage() {
        modal.confirm(gettext('Are you sure you want to remove the background image?'))
            .then(() => {
                self.output.preview = {};
                self.output.progress = {width: 0};
                self.output.style['background-image'] = '';
                self.imageSaved = false;
            });
    }

    function removeLogoImage() {
        modal.confirm(gettext('Are you sure you want to remove the logo image?'))
            .then(() => {
                self.output.preview_logo = {};
                self.output.progress_logo = {width: 0};
                self.output.logo_url = '';
                self.imageSaved = false;
            });
    }
}
