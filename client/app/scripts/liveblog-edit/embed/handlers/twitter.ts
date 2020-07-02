// tslint:disable:only-arrow-functions
(function() {
    /**
    * Construct a custom <blockquote> element from iframe.ly's oembed response metadata
    */
    function twitterService(iframelyService, $q) {
        return {
            name: 'Twitter',
            patterns: [
                'https?://(?:www|mobile\\.)?twitter\\.com/(?:#!/)?[^/]+/status(?:es)?/(\\d+)/?',
                'https?://t\\.co/[a-zA-Z0-9]+',
            ],
            embed: function(url) {
                const deferred = $q.defer();

                iframelyService.embed(url).then(
                    function successCallback(response) {
                        const uniqueID = '_' + Math.random()
                            .toString(36)
                            .substr(2, 9);
                        const data = response;

                        data.element_id = uniqueID;
                        if (data.provider_name === 'Twitter') {
                            data.html = [
                                '<div id="' + uniqueID + '">',
                                '     <blockquote class="twitter-tweet">',
                                '         <p>',
                                data.description,
                                '         </p>&mdash; ',
                                '         ' + data.title + ' (@' + data.author_name + ')',
                                '         <a href="' + url + '">' + url + '</a>',
                                '     </blockquote>',
                                '</div>',
                                '<script>',
                                '    window.twttr = (function(d, s, id) {',
                                '        var js, fjs = d.getElementsByTagName(s)[0],t = window.twttr || {};',
                                '        if (d.getElementById(id)) return t; js = d.createElement(s);js.id = id;',
                                '        js.src = "https://platform.twitter.com/widgets.js";',
                                '        fjs.parentNode.insertBefore(js, fjs); t._e = [];',
                                '        t.ready = function(f) {t._e.push(f);}; return t;}(document, "script", "twitter-wjs"));', // eslint-disable-line
                                '    window.twttr.ready(function(){',
                                '        window.twttr.widgets.load(document.getElementById("' + uniqueID + '"));',
                                '    });',
                                '</script>',
                            ].join('\n');
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
        .service('embedTwitterHandler', ['iframelyService', '$q', twitterService]);
})();
