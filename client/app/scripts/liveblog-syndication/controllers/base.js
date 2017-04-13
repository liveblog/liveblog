baseController.$inject = ['$scope', 'api', 'notify', '$route'];

const getPageValue = ($route) => {
    if ($route.current.params.hasOwnProperty('page')) {
        return parseInt($route.current.params.page, 10);
    }

    return 1;
};

export default function baseController($scope, api, notify, $route) {
    $scope.pageLimit = 25;

    $scope.criteria = {
        max_results: $scope.pageLimit,
        sort: '[("_created", 1)]',
        page: getPageValue($route)
    };

    $scope.$on('$routeUpdate', () => {
        $scope.criteria.page = getPageValue($route);
    });

    if ($scope.endPoint) {
        $scope.$watch('criteria.page', () => {
            api
                .query($scope.endPoint, $scope.criteria)
                .then((data) => {
                    $scope[$scope.endPoint] = data;
                })
                .catch((err) => {
                    notify.pop();
                    notify.error(gettext('Fatal error!'));
                });
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
