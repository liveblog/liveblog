'use strict'

LiveblogAnalyticsController.$inject = ['$scope','$location', 'api', 'blog', 'notify', ];
function LiveblogAnalyticsController($scope, $location, api, blog, notify) {
  var vm = this;

  var close = function() { //return to blog list page
    $location.path('/liveblog/edit/' + blog._id);
  };

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