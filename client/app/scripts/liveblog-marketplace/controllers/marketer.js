liveblogMarketplace
    .controller('MarketerController', ['$scope', '$sce', 'api', '$routeParams',
        function($scope, $sce, api, $routeParams) {
            var iframeAttrs = [
                'width="100%"',
                'height="715"',
                'frameborder="0"',
                'allowfullscreen'
            ].join(' ');

            $scope.embedModal = false;
            $scope.active = 'preview';
            $scope.pageLimit = 25;

            $scope.openEmbedModal = function(blog) {
                $scope.embedModal = true;
                $scope.currentBlog = blog;
            };

            $scope.cancelEmbed = function() {
                $scope.embedModal = false;
            };

            var onReceivedData = function(data) {
                if (data._items.length > 0 && data._items[0].hasOwnProperty('marketer_name'))
                    $scope.marketer = data._items[0].marketer_name;

                $scope.blogs = data;

                $scope.blogs._items = $scope.blogs._items.map(function(item) {
                    return angular.extend(item, {
                        embed: '<iframe '+iframeAttrs+' src="'+item.public_url+'"></iframe>',
                        public_url: $sce.trustAsResourceUrl(item.public_url)
                    });
                });
            };

            var fetchBlogs = function() {
                var criteria = {
                    max_results: $scope.pageLimit,
                    page: $routeParams.page || 1,
                };

                if ($routeParams.type == 'marketers')
                    api.get('/marketplace/marketers/' + $routeParams.id + '/blogs', criteria)
                        .then(onReceivedData);
                else
                    api.get('/producers/' + $routeParams.id + '/blogs', criteria)
                        .then(onReceivedData);
            }

            fetchBlogs();
            $scope.$on('$routeUpdate', fetchBlogs);
        }]);
