'use strict'

var liveblogAnalytics = angular
  .module('liveblog.analytics', ['liveblog.security'])
  
  .config(['superdeskProvider', function(superdesk) {
    superdesk.activity('/analytics/:_id', {

      /**
      * superdesk.activity is the starting point for a 'component':
      * It effectively merges some ui-router functionality with
      * superdesk requirements and a bit of the new angular2
      * concept of components sprinkled over it.
      */

      label: gettext('Analytics'),
      controller: 'LiveblogAnalyticsController',
      templateUrl: 'scripts/liveblog-analytics/views/view-analytics-list.html',
      category: superdesk.MENU_MAIN,
      priority: 100,
      adminTools: true,
      resolve: {isArchivedFilterSelected: function() {return false;}}
    })
  }])

  .config(['apiProvider', function(apiProvider) {
    apiProvider
      
      /*
      * 'analytics' being one of the resources that we discovered
      * earlier by requesting http://localhost:5000/api -- endpoints are described with href, title pairs.
      * The apiProvider service then wraps around $http/$resource and inserts a blog_id via
      * .getById(<id>) into href before calling the endpoint. Heads up: apiProvider.query() does
      * not function like 
      */

      .api('analytics', { 
        type: 'http',
        backend: {rel: 'analytics'}
      })
  }]);