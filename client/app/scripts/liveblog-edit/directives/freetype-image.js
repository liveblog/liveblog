import freetypeImageTpl from 'scripts/liveblog-edit/views/freetype-image.html';

freetypeImage.$inject = ['$compile', 'modal', 'api', 'upload', 'superdesk', 'urls', 'notify'];

export default function freetypeImage($compile, modal, api, upload, superdesk, urls, notify) {
    return {
        restrict: 'E',
        templateUrl: freetypeImageTpl,
        controller: ['$scope', function($scope) {

            $scope.preview = {};
            $scope.progress = {width: 0};
            $scope.saved = false;

            // prepare image preview
            if ($scope.image.picture_url) {
                $scope.preview.url = $scope.image.picture_url;
            }

            $scope.valid = true;
            $scope._id = _.uniqueId('image');
            if ($scope.compulsory !== undefined) {
                var sentinel = $scope.$watch('[image,compulsory]', (value) => {
                    $scope.compulsoryFlag = value[0].picture_url === '' && value[1] === '';
                }, true);

                $scope.$on('$destroy', sentinel);
            }
            
            let _self = this;

            $scope.$watch('preview.img', function () {
                _self.saveImage();
            });

            this.saveImage = function() {
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
                    data: form
                })
                .then((response) => {
                    if (response.data._status === 'ERR') {
                        return;
                    }
                    var pictureUrl = response.data.renditions.viewImage.href;

                    $scope.image.picture_url = pictureUrl;
                    $scope.image.picture = response.data._id;

                }, (error) => {
                    notify.error(
                        error.statusText !== '' ? error.statusText : gettext('There was a problem with your upload')
                    );
                }, (progress) => {
                    $scope.progress.width = Math.round(progress.loaded / progress.total * 100.0);
                }));
            };

            this.removeImage = function() {
                modal
                    .confirm(gettext('Are you sure you want to remove the image?'))
                    .then(() => {
                        $scope.image.picture_url = '';
                        $scope.preview = {};
                        $scope.progress = {width: 0};
                        $scope.saved = false;
                    });
            };
        }],
        controllerAs: 'ft',
        scope: {
            image: '=',
            // `compulsory` indicates a variable that is needed if the current value is empty.
            compulsory: '=',
            validation: '='
        }
    };
}
