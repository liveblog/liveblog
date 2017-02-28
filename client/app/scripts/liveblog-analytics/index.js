'use strict'

var liveblogAnalytics = angular
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
  }]);