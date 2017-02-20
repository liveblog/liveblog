liveblogSyndication
    .directive('lbProducers', function() {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/producer-list.html',
            controller: ['$scope', '$controller', function($scope, $controller) {
                $scope.endPoint = 'producers';
                $scope.entryName = 'producer';

                angular.extend(this, $controller('BaseController', {$scope: $scope}));
            }]
        }
    });
