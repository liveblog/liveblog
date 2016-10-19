liveblogSyndication
    .controller('BaseController', ['$scope', 'api', 'notify', function($scope, api, notify) {
        if ($scope.endPoint) {
            api.query($scope.endPoint).then(function(data) {
                $scope[$scope.endPoint] = data
            })
            .catch(function(err) {
                notify.pop();
                notify.error(gettext('Fatal error!'));
            });
        }

        $scope.createEntry = function() {
            if ($scope.entryName) {
                $scope.selected = {};
                $scope.selected[$scope.entryName] = {name: ''};
            }
        };

        $scope.render = function(newEntry) {
            $scope[$scope.endPoint]._items.unshift(newEntry);
            $scope.selected = {};
        };

        $scope.closePreview = function() {
            $scope.selected = {};
        };
    }]);

