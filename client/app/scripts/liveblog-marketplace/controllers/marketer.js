liveblogMarketplace
    .controller('MarketerController', ['$scope', '$sce', 'api', '$routeParams',
        function($scope, $sce, api, $routeParams) {
            $scope.states = [
                { text: 'Active Blogs' },
                { text: 'Archived Blogs' }
            ];

            $scope.embedModal = false;

            $scope.openEmbedModal = function(blog) {
                $scope.embedModal = true;
                $scope.currentBlog = blog;
            };

            api.get('/marketplace/marketers/' + $routeParams.id + '/blogs')
                .then(function(blogs) {
                    $scope.marketer = { blogs: angular.extend(blogs, {
                        _items: blogs._items.map(function(item) {
                            return angular.extend(item, {
                                public_url: $sce.trustAsResourceUrl(item.public_url)
                            });
                        })
                    })};
                });
        }]);
