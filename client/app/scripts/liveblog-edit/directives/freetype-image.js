import freetypeImageTpl from 'scripts/liveblog-edit/views/freetype-image.html';

freetypeImage.$inject = ['$compile', 'modal', 'api', 'upload', 'superdesk'];

export default function freetypeImage($compile, modal, api, upload, superdesk) {
    return {
        restrict: 'E',
        templateUrl: freetypeImageTpl,
        controller: ['$scope', function($scope) {
            $scope.valid = true;
            $scope._id = _.uniqueId('image');
            if ($scope.compulsory !== undefined) {
                var sentinel = $scope.$watch('[image,compulsory]', (value) => {
                    $scope.compulsoryFlag = value[0].picture_url === '' && value[1] === '';
                }, true);

                $scope.$on('$destroy', sentinel);
            }

            this.openUploadModal = function() {
                superdesk.intent('upload', 'media').then((pictures) => {
                    if (pictures.length === 0) {
                        return;
                    }

                    let firstPicture = pictures[0];

                    $scope.image.picture_url = firstPicture.renditions.original.href;
                    $scope.image.picture = firstPicture._id;
                });
            };

            this.removeImage = function() {
                modal
                    .confirm(gettext('Are you sure you want to remove the blog image?'))
                    .then(() => {
                        $scope.image.picture_url = '';
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
