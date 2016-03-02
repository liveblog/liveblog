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
        .filter('convertLinksWithRelativeProtocol', ['fixProtocol', function (fixProtocol) {
            return fixProtocol;
        }]);
})(angular);
