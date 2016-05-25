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
                    ret = path;
                if (!/^(https?:\/\/|\/\/)/.test(path)) {
                    ret = config.assets_root +'/' + ret;
                }
                ret = ret.replace(/[^\/]+\/+\.\.\//g, '')
                         .replace(/\.\//g, '')
                         .replace(/(\w)\/\/(\w)/g, '$1/$2');
                return ret;
            };

            this.imageUrl = this.templateUrl;

            this.$get = function() {
                return this;
            };
        }]);
})(angular);