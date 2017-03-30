baseController.$inject = ['$scope', 'api', 'notify'];

export default function baseController($scope, api, notify) {
    $scope.pageLimit = 3;

    let criteria = {
        max_results: $scope.pageLimit
    };

    if ($scope.endPoint) {
        api
            .query($scope.endPoint, criteria)
            .then((data) => {
                $scope[$scope.endPoint] = data;
            })
            .catch((err) => {
                notify.pop();
                notify.error(gettext('Fatal error!'));
            });
    }

    $scope.createEntry = function() {
        if ($scope.entryName) {
            $scope.selected = {};
            $scope.selected[$scope.entryName] = {name: '', contacts: [{}]};
        }
    };

    $scope.render = function(newEntry) {
        var isEditing = false;

        $scope[$scope.endPoint]._items = $scope[$scope.endPoint]._items
            .map((item) => {
                if (item._id === newEntry._id) {
                    isEditing = true;
                    return newEntry;
                }

                return item;
            });

        if (!isEditing) {
            $scope[$scope.endPoint]._items.unshift(newEntry);
        }

        $scope.selected = {};
    };

    $scope.closePreview = function() {
        $scope.selected = {};
    };
}
