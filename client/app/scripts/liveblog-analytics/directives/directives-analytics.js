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

  return null;
}
