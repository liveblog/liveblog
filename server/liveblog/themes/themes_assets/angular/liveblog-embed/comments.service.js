(function(angular) {
    'use strict';

    CommentsManagerFactory.$inject = ['comments', 'items', '$q', 'config'];
    function CommentsManagerFactory(commentsService, itemsService, $q, config) {

        function CommentsManager (max_results, sort) {

            /**
             * Send a new comment to be approved.
             * @returns {promise}
             */
            this.send = function(data) {
                var deferred = $q.defer();
                data.blog_id = config.blog._id;
                data.item_type = 'comment';
                itemsService.save(data).$promise.then(function(dataItem) {
                    if (dataItem._status === 'ERR'){
                        deferred.reject('Try again later!')
                        return;
                    }
                    var comment = {
                            "post_status": "comment",
                            "blog_id": config.blog._id,
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

    angular.module('liveblog-embed')
        .factory('CommentsManager', CommentsManagerFactory)
        .directive('lbComments', ['CommentsManager', '$timeout', function(CommentsManager, $timeout) {
            var commentsManager = new CommentsManager();
            return {
                scope: {
                    comment: '='
                },
                template: [
                    '<div class="modal-backdrop ng-cloak" ng-show="modal"></div>',
                    '<div class="modal ng-cloak" ng-show="modal">',
                    '    <div class="modal-dialog">',
                    '        <div ng-show="notify" class="notify">',
                    '            <div class="content">',
                    '                <div class="modal-header">',
                    '                    <h3>Your comment was sent for approval.</h3>',
                    '                </div>',
                    '            </div>',
                    '        </div>',
                    '        <div ng-show="form">',
                    '            <form name="comment" novalidate ng-submit="send();">',
                    '                <div class="content">',
                    '                    <div class="modal-header">',
                    '                        <h2>Post a comment</h2>',
                    '                    </div>',
                    '                    <div class="modal-body">',
                    '                        <fieldset>',
                    '                            <div class="field">',
                    '                                <label for="commenter">Name *</label>',
                    '                                <input name="commenter" ng-model="commenter">',
                    '                                <div role="alert">',
                    '                                    <span class="error" ng-show="name.length < 3">Please fill in your Name.</span>',
                    '                                </div>',
                    '                            </div>',
                    '                            <div class="field">',
                    '                                <label for="content">Comment *</label>',
                    '                                <textarea name="content" ng-model="content"></textarea>',
                    '                                <div role="alert">',
                    '                                    <span class="error" ng-show="content.length < 3">Please fill in your Comment.</span>',
                    '                                </div>',
                    '                            </div>',
                    '                        </fieldset>',
                    '                    </div>',
                    '                    <div class="modal-footer">',
                    '                        <button class="btn" ng-click="toggle();"><span>Cancel</span></button>',
                    '                        <button type="submit" class="btn btn-primary"><span>Send</span></button>',
                    '                    </div>',
                    '                </div>',
                    '            </form>',
                    '        </div>',
                    '    </div>',
                    '</div>'
                ].join(''),
                controller: function($scope) {
                    var vm = $scope;
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
                        toggle: function() {
                            vm.modal = !vm.modal;
                            vm.form = !vm.form;
                            vm.reset();
                        },
                        send: function() {
                            if( !vm.commenter || vm.commenter.length < 3 || !vm.content || vm.content.length <3) {
                                vm.commenter = (vm.commenter === undefined)? '' : vm.commenter;
                                vm.content = (vm.content === undefined)? '' : vm.content;
                                return false;
                            }
                            vm.notify = 'sended';
                            vm.form = false;
                            commentsManager.send({
                                commenter: vm.commenter,
                                text: vm.content
                            }).then(function(){
                                vm.reset();
                                $timeout(function(){
                                    vm.notify = false;
                                    vm.modal = false;
                                }, 2500);
                            });
                        }
                    });
                },
                link: function(scope, elem, attrs) {
                    scope.comment = false;
                    scope.$watch('comment', scope.toggle);
                }
            };
        }]);

})(angular);
