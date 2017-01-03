liveblogMarketplace
    .controller('MarketerController', ['$scope', '$sce', 'api', '$routeParams',
        function($scope, $sce, api, $routeParams) {
            var iframeAttrs = [
                'width="100%"',
                'height="715"',
                'frameborder="0"',
                'allowfullscreen'
            ].join(' ');

//            $scope.states = [
//                { text: 'Active Blogs' },
//                { text: 'Archived Blogs' }
//            ];

            $scope.embedModal = false;
            $scope.active = 'preview';

            $scope.openEmbedModal = function(blog) {
                $scope.embedModal = true;
                $scope.currentBlog = blog;
            };

            $scope.cancelEmbed = function() {
                $scope.embedModal = false;
            };

            if ($routeParams.type == 'marketers')
                api.get('/marketplace/marketers/' + $routeParams.id + '/blogs')
                    .then(function(data) {
                        console.log('data', data);
                        $scope.marketer = data.marketer;

                        $scope.blogs = data;
                        $scope.blogs._items.map(function(item) {
                            return angular.extend(item, {
                                embed: '<iframe '+iframeAttrs+' src="'+item.public_url+'"></iframe>',
                                public_url: $sce.trustAsResourceUrl(item.public_url)
                            });
                        });

                        console.log('blogs', $scope.blogs);
                    });
            else
                api.get('/producers/' + $routeParams.id + '/blogs').then(function(data) {
                    $scope.blogs = { _items: data._items.map(function(item) {
                        return angular.extend(item, {
                            embed: '<iframe '+iframeAttrs+' src="'+item.public_url+'"></iframe>',
                            public_url: $sce.trustAsResourceUrl(item.public_url)
                        });
                    })};
                });

        }]);
