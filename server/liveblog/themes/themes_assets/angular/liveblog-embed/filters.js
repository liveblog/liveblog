(function(angular) {
    'use strict';
    angular.module('liveblog-embed')
        .filter('prettifyIsoDate', function() {
            return function(input) {
                return moment(input).format('DD/MM/YYYY  HH:mm');
            };
        })
        .filter('outboundAnchors', function() {
            return function(text) {
                return text.replace(/<a([^>]*)>/g, function(match, attr){
                                if(attr.indexOf('target') === -1) {
                                    return '<a' + attr + ' target="_blank">';
                                }
                                return match;
                            });
            };
        })        
        .filter('convertLinksWithRelativeProtocol', ['config', function fixProtocol(config) {
            return function getRelativeProtocol(text) {
                var absoluteProtocol = RegExp(/http(s)?:\/\//ig);
                var serverpath = config.api_host.split('//').pop();
                config.api_host.replace(absoluteProtocol, '//');
                text.replace(absoluteProtocol, '//')
                return text.replace(absoluteProtocol, '//')
            };
        }]);
})(angular);
