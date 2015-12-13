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
                data.blog = config.blog._id;
                data.item_type = 'comment';
                itemsService.save(data).$promise.then(function(dataItem) {
                    if (dataItem._status === 'ERR'){
                        deferred.reject('Try again later!')
                        return;
                    }
                    var comment = {"post_status":"comment","blog":config.blog._id,"groups":[{"id":"root","refs":[{"idRef":"main"}],"role":"grpRole:NEP"},{"id":"main","refs":[{"residRef":dataItem._id}],"role":"grpRole:Main"}]};
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
            }
        }

        // return the Comments Manager constructor
        return CommentsManager;
    }

    angular.module('liveblog-embed')
        .factory('CommentsManager', CommentsManagerFactory);

})(angular);
