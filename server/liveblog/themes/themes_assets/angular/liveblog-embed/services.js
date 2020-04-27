(function(angular) {
    'use strict';

    angular.module('liveblog-embed')
        .factory('fixProtocol', ['config', function(config){
            return function(text) {
                var absoluteProtocol = RegExp(/http(s)?:\/\//ig);
                var serverpath = config.api_host.split('//').pop();
                config.api_host.replace(absoluteProtocol, '//');
                text.replace(absoluteProtocol, '//')
                return text.replace(absoluteProtocol, '//')
            };
        }])
        .provider('asset', [ '$injector', function ($injector) {
            this.templateUrl = function(path) {
                var config = $injector.get('config'),
                    simplifiedPath = $injector.has('assets_simplified_path')
                            && $injector.get('assets_simplified_path'),
                    ret = path;
                /**
                 * `assets_simplified_path` constant is added
                 * to keep backwards compatibility for old themes.
                 */
                if(config.debug && config.templates && config.templates[path]) {
                    return config.templates[path];
                }
                if(!config.debug && simplifiedPath) {
                    return ret;
                }
                if (!/^(https?:\/\/|\/\/)/.test(path)) {
                    ret = config.assets_root +'/' + ret;
                }
                ret = ret.replace(/[^\/]+\/+\.\.\//g, '/')
                         .replace(/\.\//g, '')
                         .replace(/(\w)\/\/(\w)/g, '$1/$2');
                return ret;
            };

            this.imageUrl = this.templateUrl;

            this.$get = function() {
                return this;
            };
        }])
        .service('cookies', function() {
            this.read = function(name) {
                var nameEQ = name + "=";
                var ca = document.cookie.split(';');
                for(var i=0;i < ca.length;i++) {
                    var c = ca[i];
                    while (c.charAt(0)==' ') c = c.substring(1,c.length);
                    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
                }
                return null;
            };

            this.write = function(name, value, days) {
                var expires = "", date = new Date();

                if (days) {
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toUTCString();
                }
                document.cookie = name + "=" + value + expires + ";path=/;SameSite=Lax;";
            }
        });
})(angular);