freetypeImage.$inject = ['$compile', 'modal', 'api', 'upload'];

export default function freetypeImage($compile, modal, api, upload) {
    return {
        restrict: 'E',
        templateUrl: 'scripts/liveblog-edit/views/freetype-image.html',
        controller: ['$scope', function($scope) {
            $scope.valid = true;
            $scope._id = _.uniqueId('image');
            if ($scope.compulsory !== undefined) {
                var sentinel = $scope.$watch('[image,compulsory]', function(value) {
                        $scope.compulsoryFlag = (value[0].picture_url === '' && value[1] === '');
                }, true);
                $scope.$on('$destroy', sentinel);
            }
            var vm = this;
            angular.extend(vm, {
                preview: {},
                progress: {width: 0},
                openUploadModal: function() {
                    vm.uploadModal = true;
                },
                closeUploadModal: function() {
                    vm.uploadModal = false;
                    vm.preview = {};
                    vm.progress = {width: 0};
                },
                removeImage: function() {
                    modal.confirm(gettext('Are you sure you want to remove the blog image?')).then(function() {
                        $scope.image.picture_url = '';
                    });
                },
                upload: function(config) {
                    var form = {};
                    if (config.img) {
                        form.media = config.img;
                    } else if (config.url) {
                        form.URL = config.url;
                    } else {
                        return;
                    }
                    // return a promise of upload which will call the success/error callback
                    return api.archive.getUrl().then(function(url) {
                        return upload.start({
                            method: 'POST',
                            url: url,
                            data: form
                        })
                        .then(function(response) {
                            if (response.data._status === 'ERR'){
                                return;
                            }
                            var picture_url = response.data.renditions.original.href;
                            $scope.image.picture_url = picture_url;
                            $scope.image.picture = response.data._id;
                            vm.uploadModal = false;
                            vm.preview = {};
                            vm.progress = {width: 0};
                        }, null, function(progress) {
                            vm.progress.width = Math.round(progress.loaded / progress.total * 100.0);
                        });
                    });
                }
            });
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
