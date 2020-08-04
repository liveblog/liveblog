(() => {
    /**
    * Use iframe.ly for instagram
    */
    const instagramService = (iframelyService, $q) => {
        return {
            name: 'Instagram',
            patterns: ['(?:(?:http|https):\/\/)?(?:www.)?(?:instagr(?:\.am|am\.com))\/p\/.+'], // eslint-disable-line
            embed: (url, max_width) => { // eslint-disable-line
                const deferred = $q.defer();

                iframelyService.embed(url, true).then(
                    (response) => {
                        deferred.resolve(response);
                    },
                    (error) => {
                        deferred.reject(error.error_message || error.data.error_message);
                    }
                );

                return deferred.promise;
            },
        };
    };

    angular.module('angular-embed.handlers')
        .service('embedInstagramHandler', ['iframelyService', '$q', instagramService]);
})();
