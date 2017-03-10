(function(angular) {
    'use strict';
    function stripTags(text) {
        return text.replace(/(<([^>]+)>)/ig, '');
    }

    CommentsManagerFactory.$inject = ['comments', 'items', '$q', 'config'];
    function CommentsManagerFactory(commentsService, itemsService, $q, config) {

        function CommentsManager (max_results, sort) {

            /**
             * Send a new comment to be approved.
             * @returns {promise}
             */
            this.send = function(data) {
                var deferred = $q.defer();
                data.client_blog = config.blog._id;
                data.item_type = 'comment';
                itemsService.save(data).$promise.then(function(dataItem) {
                    if (dataItem._status === 'ERR'){
                        deferred.reject('Try again later!')
                        return;
                    }
                    var comment = {
                            "post_status": "comment",
                            "client_blog": config.blog._id,
                            "groups": [{
                                "id": "root",
                                "refs": [{"idRef":"main"}],
                                "role": "grpRole:NEP"
                            },{
                                "id": "main",
                                "refs": [{"residRef": dataItem._id}],
                                "role":"grpRole:Main"}
                            ]
                        };
                    commentsService.save(comment).$promise.then(function(dataComment) {
                        if (dataComment._status === 'ERR'){
                            deferred.reject('Try again later!')
                            return;
                        }
                        deferred.resolve(dataComment);
                    });
                    
                }, function(error) {
                    deferred.reject('Try again later!');
                });
                return deferred.promise;
            };
        }

        // return the Comments Manager constructor
        return CommentsManager;
    }

    CommentsCtrl.$inject = ['$scope', '$timeout', 'CommentsManager'];
    function CommentsCtrl($scope, $timeout, CommentsManager) {
        var vm = $scope,
            commentsManager = new CommentsManager();        
        angular.extend(vm, {
            modal: true,
            notify: false,
            form: true,
            reset: function() {
                if (!vm.form) {
                    vm.commenter = undefined;
                    vm.content = undefined;
                };
            },
            toggle: function(status) {
                if(vm.notify) {
                    vm.notify = false;
                    vm.form = false;
                    vm.modal = false;
                    vm.reset();
                } else {
                    vm.modal = !vm.modal;
                    vm.form = !vm.form;
                    vm.reset();
                }
            },
            send: function() {
                if( 
                    !vm.commenter || vm.commenter.length < 3 || vm.commenter.length > 30 ||
                    !vm.content || vm.content.length <3 || vm.content.length > 300 ) {
                        vm.commenter = (vm.commenter === undefined)? '' : vm.commenter;
                        vm.content = (vm.content === undefined)? '' : vm.content;
                        return false;
                }
                vm.notify = 'sended';
                vm.form = false;
                commentsManager.send({
                    commenter: stripTags(vm.commenter),
                    text: stripTags(vm.content)
                }).then(function(){
                    vm.reset();
                    $timeout(function(){
                        if(vm.notify) {
                            vm.notify = false;
                            vm.form = true;
                            vm.comment = false;
                        }
                    }, 2500);
                });
            }
        });
    }
    angular.module('liveblog-embed')
        .factory('CommentsManager', CommentsManagerFactory)
        .directive('lbComments', ['$timeout', 'asset', function($timeout, asset) {
            return {
                scope: {
                    comment: '='
                },
                templateUrl: asset.templateUrl('views/comments.html'),
                controller: CommentsCtrl,
                link: function(scope, elem, attrs) {
                    scope.comment = false;
                    scope.$watch('comment', scope.toggle);
                }
            };
        }]);

})(angular);
