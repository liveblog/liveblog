import freetypeImageTpl from 'scripts/liveblog-edit/views/freetype-image.ng1';

freetypeImage.$inject = ['$rootScope', 'modal', 'upload', 'urls', 'notify'];

export default function freetypeImage($rootScope, modal, upload, urls, notify) {
    return {
        restrict: 'E',
        templateUrl: freetypeImageTpl,
        link: function($scope, element) {
            element.on('$destroy', () => {
                $scope.cleanUp();
            });
        },
        controller: ['$scope', '$attrs', function($scope, $attrs) {
            let self = this;

            $scope.preview = {};
            $scope.progress = {width: 0};
            $scope.saved = false;
            $scope._id = _.uniqueId('image');

            // prepare image preview
            if ($scope.image.picture_url) {
                $scope.preview.url = $scope.image.picture_url;
            }

            $scope.$watch('image', (value) => {
                if (value.picture_url) {
                    $scope.progress.width = 100;
                    $scope.preview.url = value.picture_url;
                }
            });

            if ($attrs.compulsory !== undefined) {
                const sentinel = $scope.$watch('[image,compulsory]', ([image, compulsory]) => {
                    if (image.picture_url === undefined && compulsory === undefined) return;
                    const imageValue = (image.picture_url === '' || image.picture_url === undefined);
                    const compulsoryValue = (compulsory === '' || compulsory === undefined);

                    $scope.compulsoryFlag = imageValue && compulsoryValue;
                    $scope.validation['compulsory__' + $scope._id] = !$scope.compulsoryFlag;
                }, true);

                $scope.$on('$destroy', sentinel);
            }

            $scope.$watch('preview.img', (newValue, oldValue, scope) => {
                if (newValue !== undefined || newValue !== oldValue) {
                    self.saveImage();
                }
            });

            this.saveImage = function() {
                // $scope.validation.imageUploaded = false;
                $rootScope.uploadingImage = true;

                var form = {};
                var config = $scope.preview;

                if (config.img) {
                    form.media = config.img;
                } else if (config.url) {
                    form.URL = config.url;
                } else {
                    return;
                }
                $scope.saved = true;
                // return a promise of upload which will call the success/error callback
                return urls.resource('archive').then((uploadUrl) => upload.start({
                    method: 'POST',
                    url: uploadUrl,
                    data: form,
                })
                    .then((response) => {
                        if (response.data._status === 'ERR') {
                            return;
                        }
                        var pictureUrl = response.data.renditions.viewImage.href;

                        $scope.image.picture_url = pictureUrl;
                        $scope.image.picture = response.data._id;
                        if ($scope.progress.width === 100) {
                            // $scope.validation.imageUploaded = true;
                            $rootScope.uploadingImage = false;
                        }
                    }, (error) => {
                        notify.error(
                            error.statusText !== '' ? error.statusText : gettext('There was a problem with your upload')
                        );
                        $rootScope.uploadingImage = false;
                    }, (progress) => {
                        $scope.progress.width = Math.round(progress.loaded / progress.total * 100.0);
                    }));
            };

            $scope.cleanUp = function() {
                // when the element is detroyed, we should avoid keeping garbage in scope
                delete $scope.validation[`compulsory__${$scope._id}`];

                // also let's reset flags
                $scope.compulsoryFlag = undefined;
                $scope.image.picture_url = undefined;
                $scope.compulsory = undefined;
            };

            $scope.subRemoveImage = function(reset) {
                $scope.preview = {};
                $scope.progress = {width: 0};
                $scope.saved = false;

                // let's wait more or less until image is fully removed
                setTimeout(() => {
                    $scope.image.picture_url = '';
                    $rootScope.uploadingImage = false;

                    if (reset) {
                        $scope.cleanUp();
                    } else if ($scope.compulsory === undefined) {
                        // to trigger validation
                        $scope.compulsory = '';
                    }

                    // triggers model update so form state is also updated
                    $scope.$apply();
                }, 500);
            };

            $rootScope.$on('freetypeReset', () => {
                $scope.subRemoveImage(true);
            });

            $scope.removeImage = function() {
                modal
                    .confirm(gettext('Are you sure you want to remove the image?'))
                    .then(() => {
                        $scope.subRemoveImage(false);
                    });
            };
        }],

        scope: {
            image: '=',
            // `compulsory` indicates a variable that is needed if the current value is empty.
            compulsory: '=',
            validation: '=',
        },
    };
}
