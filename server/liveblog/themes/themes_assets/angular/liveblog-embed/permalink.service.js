(function(angular) {
    'use strict';

    angular.module('liveblog-embed')
        .factory('Permalink', ['$q', '$timeout', 'config', function($q, $timeout, config){
            return function(pagesManager, delimiter){
                var PARAM_NAME = 'liveblog._id'; // the parameter name for permalink.  
                var DELIMITER = delimiter; // delimiter can be `?` or `#`.

                function escapeRegExp(string) {
                    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
                }

                var href; // from where it should take the location url.
                if(document.parent) {
                    // use document parent if avalible, see iframe cors limitation.
                    try {
                        href = document.location.href; 
                    } catch(e) {
                        // if not use the referrer of the iframe.
                        href = document.referrer; 
                    }
                } else {                
                    href = document.location.href; // use this option if it is access directly not via iframe.
                }
                var matches, 
                    regexHash = new RegExp(escapeRegExp(PARAM_NAME) + '=([^&#]*)'),
                    matches = href.match(regexHash);
                if(matches) {
                    var arr = decodeURIComponent(matches[1]).split('->');
                    this._id = arr[0];
                    pagesManager.order(arr[1]);
                }
                this.get = function(id) {
                    var permalink = false,
                        newHash = PARAM_NAME + '=' + id + '->' + pagesManager.order();

                    if (href.indexOf(DELIMITER) === -1) {
                        permalink = href + DELIMITER + newHash;
                    } else if (href.indexOf(PARAM_NAME + '=') !== -1) {
                        var regexHash = new RegExp(escapeRegExp(PARAM_NAME) + '=[^&#]*');
                        permalink = href.replace(regexHash, newHash);
                    } else {
                        permalink = href + '&' + newHash;
                    }
                    return permalink;                
                };

                this.loadPost = function() {
                    var deferred = $q.defer(),
                        srv = this,
                        found = false;
                    if(!srv._id) {
              
                        deferred.reject();
                    } else {
                        angular.forEach(pagesManager.allPosts(), function(post) {
                            if(post._id === srv._id) {
                                found = true;
                            }
                        });
                        if(found) {
                            $timeout(function(){
                                deferred.resolve(srv._id);
                            });
                        } else {
                            pagesManager.fetchNewPage().then(function() {
                                srv.loadPost();
                            });                        
                        }
                    }
                    return deferred.promise;
                };
            };
        }]);
})(angular);