'use strict'

LiveblogAnalyticsController.$inject = ['$scope','$location', 'api', 'analytics', 'blog', 'notify', ];
function LiveblogAnalyticsController($scope, $location, api, analytics, blog, notify) {
  var vm = this;

  var close = function() { //return to blog list page
    $location.path('/liveblog/edit/' + blog._id);
  };

  var loadAnalytics = function(page) {
    var q = { page: page || 1, max_results: 200 };
    api('blogs/<regex("[a-f0-9]{24}"):blog_id>/bloganalytics', {_id: blog._id}).query(q)
    .then(function(data) {
      if (q.page == 1) $scope.analytics_data = data;
      else $scope.analytics_data._items.concat(data._items);
      if (data._links.next) loadAnalytics(q.page + 1)
    })
  };

  loadAnalytics(); // greedy, as calls aren't expensive/don't need to scale
  
  angular.extend(vm, {
    blog: blog,
    close: close,
    tab: "embeds",
    changeTab: function(tab) {
      vm.tab = tab;
      if (!vm.tab) return;
    },
  })

};

angular.module('liveblog.analytics')
.controller('LiveblogAnalyticsController', LiveblogAnalyticsController)