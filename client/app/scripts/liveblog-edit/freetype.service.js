/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

(function(angular) {
    'use strict';
    /**
    * Create a list of paths from `obj` parameter and return it in the
    * `ret` parameter
    */
    function obj2path(ret, obj, path) {
        ret = ret || {};
        var gotopath, path;
        angular.forEach(obj, function(value, key) {
            if (angular.isArray(value)) {
                for (var i = 0; i< value.length; i++) {
                    gotopath = path? path + '.' + key + '[' + i + ']' : key + '[' + i + ']';
                    obj2path(ret, value[i], gotopath);
                }
            } else if (angular.isObject(value)) {
                gotopath = path? path + '.' + key : key;
                obj2path(ret, value, gotopath);
            } else {
                gotopath = path? path + '.' + key : key;
                ret[gotopath] = value;
            }
        });
    }
    /**
    * Function to create object properties on a variable
    * Also it creates an array on the variable if the value contains `[]`
    */
    function objCreate(variable, value) {
        var part;
        if (angular.isString(value)) {
            // is variable is an array transform it in a collection.
            // by adding an empty object with that `value` property.
            if (angular.isArray(variable)) {
                part = {};
                part[value] = '';
                variable[0] = part;
                return variable[0];
            // if the value contains `[]` or `[0]` create an vector on variable.
            } else if (value.indexOf('[]') !== -1 || value.indexOf('[0]') !== -1) {
                part = value.replace('[]', '').replace('[0]', '');
                variable[part] = [];
                return variable[part];
            // by default add object on variable property.
            } else {
                variable[value] = {};
                return variable[value];
            }
        }
    }

    angular.module('liveblog.freetype', ['liveblog.edit'])
    .factory('freetypeService', ['$q', function ($q) {
        return {
            /**
            * transformation method from dorla sign template to angular template
            * also requires `scope` object so that the proper object with the data is set.
            *     this is special case for vector array.
            */
            transform: function(template, scope) {
                if (!angular.isObject(scope.freetypeData)) {
                    scope.freetypeData = {};
                }
                // transform dolar variables in the attributes.
                template = template.replace(/[A-Za-z0-9_\.]+=("|')?\$([A-Za-z0-9_.\[\]]+)("|')/gi, function(all, limit, name) {
                    var prefix = 'ng-model="freetypeData.', parts, vector;
                    if (name.indexOf('[]') !== -1 || name.indexOf('[0]') !== -1) {
                        // create properties on scope
                        vector = name.split('.');
                        for (var i = 0, neededObj = scope.freetypeData; i < vector.length; i++) {
                            neededObj = objCreate(neededObj, vector[i]);
                        }
                        return prefix + name.replace('[]', '[0]') + '"';
                    }
                    return prefix + name + '"';
                });
                // @TODO: remove when freetype-collection mechanism is full implemented.
                // transform collection mechaism for `scorers` or for dinamical lists.
                // template = template.replace(/\<li[^>]*\>(.*?)\<\/li\>/g, function(all) {
                //     return all + '<li><freetype-collection/></li>';
                // })
                return template;

            },
            htmlContent: function(template, data) {
                var paths = {}, path;
                obj2path(paths, data);
                template = template.replace(/\<input[^>]*\>/g, function(all) {
                    for (path in paths) {
                        if (all.indexOf('$' + path) > -1) {
                            return '<span class="freetype--element">' + paths[path] + '</span>'
                        }
                    }
                    return '<span class="freetype--empty"></span>';
                });
                return template;
            }
        };
    }])
    /**
    * Main directive to render the freetype editor.
    */
    .directive('freetypeRender', ['$compile', 'freetypeService', function ($compile, freetypeService) {

        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                scope.$watch('freetype', function(freetype) {
                    element.html(freetypeService.transform(freetype.template, scope));
                    $compile(element.contents())(scope);
                });
            },
            scope: {
                freetype: '=',
                freetypeData: '='
            }
        };
    }])
    .directive('freetypeCollection', ['$compile', function($compile) {
        return {
            restrict: 'E',
            template: '<button ng-click="add()">+</button>',
            controller: function() {
                this.add = function() {
                    /* @TODO add here the mechanism for add more scorers or items */
                }
            },
            scope: {
                tmpl: '='
            }
        };
    }]);
})(angular);

