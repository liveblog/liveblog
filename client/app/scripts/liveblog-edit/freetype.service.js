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
    function objCreate(variable, value) {
        var part;
        if(angular.isString(value)) {
            if(angular.isArray(variable)) {
                part = {};
                part[value] = null;
                variable[0] = part;
                return variable[0];
            } else if(value.indexOf('[]') !== -1 || value.indexOf('[0]') !== -1) {
                part = value.replace('[]','').replace('[0]','');
                variable[part] = []; 
                return variable[part];
            } else {
                variable[value] = {};
                return variable[value];
            }
        }
    }

    angular.module('liveblog.freetype', ['liveblog.edit'])
    .factory('FreetypeService', ['$q', function ($q) {

        return {
            transform: function(template, scope) {
                if (!angular.isObject(scope.freetypeData)) {
                    scope.freetypeData = {};
                }
                template = template.replace(/[A-Za-z0-9_\.]+=("|')?\$([A-Za-z0-9_.\[\]]+)("|')/gi, function(all, limit, name) {
                    var prefix = 'ng-model="freetypeData.', parts, vector;
                    if (name.indexOf('[]') !== -1 || name.indexOf('[0]') !== -1) {
                        // create vector array on scope, so the representation is an vector.
                        vector = name.split('.');
                        for (var i = 0, neededObj = scope.freetypeData; i < vector.length; i++) {
                            neededObj = objCreate(neededObj, vector[i]);
                        }
                        return prefix + name.replace('[]', '[0]') + '"';
                    }
                    return prefix + name + '"';
                });
                template = template.replace(/\<li[^>]*\>(.*?)\<\/li\>/g, function(all) {
                    return all + '<li><freetype-collection/></li>';
                })
                return template;

            }
        };
    }])
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
                    console.log('add');
                }
            },
            link: function (scope, element, attrs) {

            },
            scope: {
                tmpl: '='
            }
        };
    }]);
})(angular);

