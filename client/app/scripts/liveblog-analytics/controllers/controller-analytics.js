liveblogAnalyticsController.$inject = ['$scope','$location', 'api', 'analytics', 'blog', 'notify'];

function liveblogAnalyticsController($scope, $location, api, analytics, blog, notify) {
  var vm = this;

  var close = function() { // Return to blog list page
    $location.path('/liveblog/edit/' + blog._id);
  };

  var loadAnalytics = function(page) {
    var q = { page: page || 1, max_results: 200 };
    api('blogs/<regex("[a-f0-9]{24}"):blog_id>/bloganalytics', {_id: blog._id})
        .query(q)
        .then(function(data) {
          if (q.page === 1) $scope.analytics_data = data;
          else $scope.analytics_data._items.concat(data._items);
          if (data._links.next) loadAnalytics(q.page + 1)
        })
  };

  var downloadCSV = function() { // Convert relevant item fields to CSV
    var fileContent = "", filename = "liveblog_analytics_" + blog._id;

    $scope.analytics_data._items.forEach(function(arr, index) {
      var item = $scope.analytics_data._items[index]
        , filtered = [item.blog_id, item.context_url, item.hits];
      fileContent += filtered.join(",") + "\n"
    });

    var blob = new Blob([fileContent], {
      type: 'text/csv;charset=utf-8;'
    });

    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, filename);
      return // early exit
    }

    var link = document.createElement("a");
    if (link.download === undefined) return; // detect HTML5 download attribute

    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
  };

  loadAnalytics(); // load all, calls aren't expensive
  
  angular.extend(vm, {
    blog: blog,
    close: close,
    tab: "embeds",
    downloadCSV: downloadCSV,
    changeTab: function(tab) {
      vm.tab = tab;
      if (!vm.tab) return;
    },
  })

};

export default liveblogAnalyticsController;
