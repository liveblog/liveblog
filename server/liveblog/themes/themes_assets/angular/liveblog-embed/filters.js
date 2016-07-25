(function(angular) {
    'use strict';
    angular.module('liveblog-embed')
        .filter('prettifyIsoDate', [ 'config', function(config) {
            return function(input) {
                return moment(input).format(config.settings.datetimeFormat);
            };
        }])
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
        }])
        .filter('fixEmbed', function() {
            return function(embed) {
                // fix intragram height by removing max-height from blockquote
                return embed.replace(/<blockquote class="instagram-media"[^>]*/g, function(tag) {
                    return tag.replace(/ max-width:[^;]*;/, '').replace(/ width:[^;]*;/, ' width: 96%;');
                });
            }
        });
})(angular);
