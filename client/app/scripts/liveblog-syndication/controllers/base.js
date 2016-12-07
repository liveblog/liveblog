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
                $scope.selected[$scope.entryName] = {name: '', contacts: [{}]};
            }
        };

        $scope.render = function(newEntry) {
            var isEditing = false;

            $scope[$scope.endPoint]._items = $scope[$scope.endPoint]._items
                .map(function(item) {
                    console.log('map', item._id, newEntry._id);
                    if (item._id == newEntry._id) {
                        isEditing = true;
                        return newEntry;
                    } else {
                        return item;
                    }
                });

            if (!isEditing) {
                $scope[$scope.endPoint]._items.unshift(newEntry);
            }

            $scope.selected = {};
        };

        $scope.closePreview = function() {
            $scope.selected = {};
        };
    }]);

