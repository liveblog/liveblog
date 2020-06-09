// tslint:disable:only-arrow-functions
(function() {
    /**
    * Use iframe.ly for pictures
    */
    function pictureService(iframelyService, $q) {
        return {
            patterns: [
                '(?:([^:/?#]+):)?(?://([^/?#]*))?([^?#]*\\.(?:jpg|jpeg|gif|png))(?:\\?([^#]*))?(?:#(.*))?',
            ],
            embed: function(url) {
                const deferred = $q.defer();

                iframelyService.embed(url).then(
                    function successCallback(response) {
                        const data = response;

                        if (data.type === 'photo' && !data.thumbnail_url) {
                            data.thumbnail_url = data.url;
                            data.thumbnail_width = data.width;
                            data.thumbnail_height = data.height;
                        }
                        deferred.resolve(data);
                    },
                    function errorCallback(error) {
                        deferred.reject(error.error_message || error.data.error_message);
                    }
                );
                return deferred.promise;
            },
        };
    }
    angular.module('angular-embed.handlers')
        .service('embedPictureHandler', ['iframelyService', '$q', pictureService]);
})();
