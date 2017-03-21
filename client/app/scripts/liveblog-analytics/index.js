import './styles/analytics.scss';

import analiticsListTpl from 'scripts/liveblog-analytics/views/view-list.html';

import liveblogAnalyticsController from './controllers/controller-analytics';
import lbAnalyticsListCtrl from './directives/directives-analytics';

export default angular
  .module('liveblog.analytics', ['liveblog.security'])
  .config(['apiProvider', function(apiProvider) {
    apiProvider
      /*
      * 'analytics' being one of the resources that we discovered
      * earlier by requesting http://localhost:5000/api -- endpoints are described with href, title pairs.
      * The apiProvider service then wraps around $http and inserts a blog_id via
      * .getById(<id>) into href before calling the endpoint. Heads up: apiProvider.query() does
      * not function like $resource.
      */

      .api('analytics', { 
        type: 'http',
        backend: {rel: 'analytics'}
      })
  }])
  .controller('LiveblogAnalyticsController', liveblogAnalyticsController)

  .directive('lbAnalyticsList', function() {
    return {
      restrict: 'E',
      scope: {
        analytics: '='
      },
      templateUrl: analiticsListTpl,
      controllerAs: 'analyticsList',
      controller: lbAnalyticsListCtrl
    };
  })

  .filter('startFrom', function() {
    return function(input, start) {
        start = parseInt(start); // Parse to int
        return input.slice(start);
    }
  });
