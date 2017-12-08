(function(angular) {
    'use strict';
    angular.module('liveblog-embed')
        .filter('varname', [ 'config', function(config) {
            return function(varname) {
                return varname && varname.toLowerCase().replace(' ','_');
            };
        }]).filter('prettifyIsoDate', [ 'config', function(config) {
            return function(input) {
                return moment(input).format(config.settings.datetimeFormat);
            };
        }]).filter('outboundAnchors', function() {
            return function(text) {
                return text.replace(/<a([^>]*)>/g, function(match, attr){
                                if(attr.indexOf('target') === -1) {
                                    return '<a' + attr + ' target="_blank">';
                                }
                                return match;
                            });
            };
        }).filter('convertLinksWithRelativeProtocol', ['fixProtocol', function (fixProtocol) {
            return fixProtocol;
        }]).filter('fixEmbed', [ 'config', function(config) {
            return function(embed) {
                if (config.settings.livestream && config.settings.livestreamAutoplay) {
                    embed =  embed.replace(/src\w*=\w*("|')?([^\"\']+)("|')/, function(match, quote, url){
                        // if the url already has an query mark don't add it.
                        var mark = '?';
                        if (url.indexOf('?') !== -1) {
                            mark = '&';
                        }
                        // add the autoplay query.
                        return 'src="' + url + mark + 'rel=0&autoplay=1"';
                    });
                }
                // fix youtube width and height issues.
                if(embed.indexOf('youtube') !== -1) {
                    // add wrapper div
                    embed = '<div class="responsive-video">' + embed + '</div>';
                }
                // fix intragram height by removing max-height from blockquote
                return embed.replace(/<blockquote class="instagram-media"[^>]*/g, function(tag) {
                    return tag.replace(/ max-width:[^;]*;/, '').replace(/ width:[^;]*;/, ' width: 96%;');
                });
            }
        }]).filter('fixMarkup', function() {
            var regx = [
                /<\/?span>/g,
                /<(\/?)div([^>]+)>/g,
                /<([^>]+)><br><\/([^>]+)>/g,
                /<([^>]+)><\/([^>]+)>/g,
                /(<p>)+/,
                /&nbsp;/g
            ], replaced = [
                '',
                '<$1p$2>',
                function(all, start, end) {
                    return '<' + start + '></' + end + '>';
                }, //'', // maybe use <br>
                function(all, start, end) {
                    return start === end? '': all;
                },
                '<p>',
                ' '
            ];
            return function(markup) {
                regx.forEach(function(regx, id) {
                    markup = markup.replace(regx, replaced[id]);
                });
                return markup;
            }
        })
        ;
})(angular);
