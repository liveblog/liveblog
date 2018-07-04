liveblogAnalyticsController.$inject = ['$scope', '$location', 'api', 'analytics', 'blog', 'notify'];

function liveblogAnalyticsController($scope, $location, api, analytics, blog, notify) {
    const self = this;

    const close = function() { // Return to blog list page
        $location.path('/liveblog/edit/' + blog._id);
    };

    const loadAnalytics = function(page = 1) {
        const q = {page: page, max_results: 500};

        api('blogs/<regex("[a-f0-9]{24}"):blog_id>/bloganalytics', {_id: blog._id})
            .query(q)
            .then((data) => {
                if (q.page === 1) {
                    $scope.analytics_data = data;
                } else {
                    $scope.analytics_data._items.concat(data._items);
                }
                if (data._links.next) {
                    loadAnalytics(q.page + 1);
                }
            });
    };

    const downloadCSV = function() { // Convert relevant item fields to CSV
        let fileContent = '';
        const filename = `liveblog_analytics_${blog._id}`;

        $scope.analytics_data._items.forEach((arr, index) => {
            const item = $scope.analytics_data._items[index];
            const filtered = [item.blog_id, item.context_url, item.hits];

            fileContent += filtered.join(',') + '\n';
        });

        const blob = new Blob([fileContent], {
            type: 'text/csv;charset=utf-8;',
        });

        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
            return; // early exit
        }

        const link = document.createElement('a');

        if (link.download === undefined) {
            return;
        } // detect HTML5 download attribute

        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
    };

    loadAnalytics(); // load all, calls aren't expensive

    angular.extend(self, {
        blog: blog,
        close: close,
        tab: 'embeds',
        downloadCSV: downloadCSV,
        changeTab: function(tab) {
            self.tab = tab;
        },
    });
}

export default liveblogAnalyticsController;
