liveblogMarketplace
    .controller('MPProducerController', ['$scope', function($scope) {
        $scope.states = [
            { text: 'Active Blogs' },
            { text: 'Archived Blogs' }
        ];

        $scope.blogs = {_items: [{
            _id: 0,
            title: 'Blog number 1',
            description: 'Lorem ipsum dolor sit amet',
            url: 'https://liveblog-test-eu-west-1.s3-eu-west-1.amazonaws.com/liveblogsyndtest1/blogs/584530063b0a48003a970b67/index.html'
        }], _meta: { total: 1 }};
    }]);
