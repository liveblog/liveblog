'use strict';

angular.module('liveblog.analytics')
.directive('lbAnalyticsList', ['notify', function(notify) {
  return {
    restrict: 'E',
    scope: {
      analytics: '='
    },
    templateUrl: 'scripts/liveblog-analytics/views/view-list.html',
    controllerAs: 'analyticsList',
    controller: LbAnalyticsListCtrl
  };
}])

.filter('startFrom', function() {
  return function(input, start) {
    start = +start; // Parse to int
    return input.slice(start);
  }
});

LbAnalyticsListCtrl.$inject = ['$scope', '$element'];
function LbAnalyticsListCtrl($scope, $element) {
  $scope.predicate = '';

  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
  };

  $scope.isReversePredicate = function(predicate) {
    return $scope.reverse && $scope.predicate == predicate;
  };

  $scope.setPage = function($index) {
    $scope.currentPage = $index;
  }

  $scope.pageSize = 10;
  $scope.currentPage = 0;
  $scope.pages = new Array(Math.ceil($scope.analytics._items.length / $scope.pageSize));

  return null;
}
