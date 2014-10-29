(function() {
    'use strict';

    BlogListController.$inject = ['$scope', 'bloglist', '$location'];
    function BlogListController($scope, bloglist, $location) {
        $scope.blogs = bloglist;

        $scope.modalActive = false;

        $scope.newBlog = {
            title: null,
            description: null
        };

        $scope.cancel = function() {
            $scope.newBlog = {
                title: null,
                description: null
            };
            $scope.modalActive = false;
        };

        $scope.remove = function(blog) {
            _.remove($scope.blogs._items, blog);
        };

        $scope.edit = function(blog) {
            $location.path('/edit');
        };
    }

    var app = angular.module('liveblog.bloglist', []);

    app
        .value('bloglist', {
            _items: [
                {
                    _id: 'nNBhbjdbkjsdfnksjdfhguGugdf',
                    title: 'Live from SRCCON',
                    description: 'SRCCON July 24 - 25, PhiladelphiaSRCCON is a conference for developers' +
                    'interactive designers, and other people who love to code in and',
                    _created: '2014-09-25T13:30:03+0000',
                    last_updated: '2014-08-27T14:43:43+0000',
                    user: 'Holman Romero'
                },
                {
                    _id: '8hHIhnasndi5aRD4as5ddjaknasd',
                    title: 'Hacks Hackers Media Party',
                    description: 'Live from the Hacks Hackers Media Party in Buenos Aires!',
                    _created: '2014-09-25T13:11:24+0000',
                    last_updated: '2014-09-25T13:28:15+0000',
                    user: 'Vladimir Stefanovic'
                },
                {
                    _id: 'mzxcniyfbasdh5asdbVGybagugsa5',
                    title: 'Racing from Caymanas Park',
                    description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium' +
                    'doloremque laudantium, totam rem aperiam',
                    _created: '2014-09-25T13:30:03+0000',
                    last_updated: '2014-08-27T14:43:43+0000',
                    user: 'Sebastian Horn'
                }
            ],
            _meta: {
                max_results: 25,
                page: 1,
                total: 3
            }
        })
        .config(['superdeskProvider', function(superdesk) {
            superdesk
                .activity('/liveblog', {
                    label: gettext('Blog List'),
                    controller: BlogListController,
                    templateUrl: 'scripts/liveblog-bloglist/views/main.html',
                    category: superdesk.MENU_MAIN
                });
        }]);

    return app;
})();
