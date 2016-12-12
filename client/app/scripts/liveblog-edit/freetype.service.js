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
                part[value] = null;
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
    .factory('FreetypeService', ['$q', function ($q) {
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
                // transform collection mechaism for `scorers` or for dinamical lists.
                template = template.replace(/\<li[^>]*\>(.*?)\<\/li\>/g, function(all) {
                    return all + '<li><freetype-collection/></li>';
                })
                return template;

            }
        };
    }])
    /**
    * Main directive to render the freetype editor.
    */
    .directive('freetypeRender', ['$compile', 'FreetypeService', function ($compile, FreetypeService) {

        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                scope.$watch('freetype', function(freetype) {
                    var ngTemplate = FreetypeService.transform(freetype.template, scope);
                    element.html(ngTemplate);
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

