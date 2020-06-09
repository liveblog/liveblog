// tslint:disable:only-arrow-functions
(function() {
    /**
    * Add a width parameter to the facebook embed code
    */
    function facebookService(iframelyService, $q, embedService) {
        return {
            name: 'Facebook',
            patterns: [
                'https?://(www\\.)facebook.com/.*',
            ],
            embed: function(url, maxWidth) {
                const deferred = $q.defer();

                iframelyService.embed(url, maxWidth).then(
                    function successCallback(response) {
                        const data = response;
                        const uniqueID = '_' + Math.random()
                            .toString(36)
                            .substr(2, 9);

                        if (data.provider_name === 'Facebook' && data.html && (maxWidth !== undefined)) {
                            data.html = data.html.replace(
                                'class="fb-post"',
                                'class="fb-post" data-width="' + maxWidth + '"'
                            );
                            // remove fb-root
                            data.html = data.html.replace('<div id="fb-root"></div>', '');
                            // wrapper with id
                            data.html = data.html.replace('</script>', `</script><div id="${uniqueID}">`);
                            data.html += '</div>';
                            // reload script
                            data.html += [
                                '<script>',
                                '  if(window.FB !== undefined) {',
                                '    window.FB.XFBML.parse(document.getElementById("' + uniqueID + '"));',
                                '  }',
                                '</script>',
                            ].join('');
                            // add the facebook key
                            if (embedService.getConfig('facebookAppId') !== undefined) {
                                data.html = data.html.replace(
                                    'js#xfbml=1',
                                    'js#xfbml=1&status=0&appId=' + embedService.getConfig('facebookAppId')
                                );
                            }
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
        .service('embedFacebookHandler', ['iframelyService', '$q', 'embedService', facebookService]);
})();
