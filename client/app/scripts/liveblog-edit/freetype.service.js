/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

 define([
    'angular',
    './module'
], 
function(angular) {
    'use strict';
    /**
     * Name of the scope variable where the freetype data will be stored.
     */
    const SCOPE_FREETYPEDATA = 'freetypeData'
    /**
     * Generation of new index.
     */
    var index = 0;
    function getNewIndex(string) {
        index = index + 1;
        return string + '__' + index;
    }
    /**
     * Makes the form text input with angular model freetypeData.name.
     * also add the attributes from the tag, needed in case of classes or styles.
     */
    function makeAngularAttr(name, attr) {
        attr = attr || '';
        // remove any trailing `/` character from attr.
        // the trailing character is composed.
        if (attr.substr(attr.length - 1, 1) === '/') {
            attr = attr.substr(0, attr.length - 1);
        }
        if (name.substr(0, 1) === '$') {
            return '"' + name.substr(1).replace('[]', '[0]') + '" ' + attr;
        } else {
            return '"' + SCOPE_FREETYPEDATA + '.' + name.replace('[]', '[0]') + '" ' + attr;
        }
    }
    /**
    * Sets and gets the obj from path.
    *    this is needed to create the vectors in the angular scope.
    */
    function path2obj(obj, path, value) {
        if (path.substr(0, 1) === '$') {
            return;
        }
        var parts, part, vector;
        if (angular.isString(path)) {
            parts = path.split(/\./);
            for (var i = 0, variable = obj; i< parts.length; i++){
                if (parts[i].indexOf('[') !== -1) {
                    vector = parts[i].match(/([^\]]*)\[([^\]]*)]/);
                    if (parseInt(vector[2], 10) == vector[2]) {
                        vector[2] = parseInt(vector[2], 10);
                    }
                    part = {};
                    // if the array is already set, just use that.
                    if (angular.isArray(variable[vector[1]])){
                        // is the array is set but not that index, make it.
                        if (angular.isDefined(variable[vector[1]][vector[2]])) {
                            variable = variable[vector[1]][vector[2]]
                        } else {
                            variable[vector[1]][vector[2]] = part
                            variable = part;
                        }
                    } else {
                        variable[vector[1]] = [];
                        variable[vector[1]][vector[2]] = part
                        variable = part;
                    }
                } else {
                    // if the object is already set, just use that.
                    if (angular.isDefined(variable[parts[i]])) {
                        variable = variable[parts[i]];
                        if (i === parts.length - 1) {
                            return variable;
                        }
                    } else if (i === parts.length - 1){
                        variable[parts[i]] = value || '';
                    } else {
                        variable[parts[i]] = {};
                        variable = variable[parts[i]];
                    }
                }
            }
        }
    }
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
     * Inject `class` in the class attributes string.
     */
    function injectClass(attr, cls) {
        if (attr.indexOf('class') > -1) {
            return attr.replace(/class\w*=\w*("|')?([^\"\']+)("|')/, 'class="' + cls + ' $2"');
        } else {
            attr += 'class="' + cls + '" ';
            return attr;
        }
    }

    angular.module('liveblog.edit')
    .factory('freetypeService', ['$q', function ($q) {
        return {
            /**
            * transformation method from dorla sign template to angular template
            * also requires `scope` object so that the proper object with the data is set.
            *     this is special case for vector array.
            */
            transform: function(template, scope) {
                if (!angular.isObject(scope[SCOPE_FREETYPEDATA])) {
                    scope[SCOPE_FREETYPEDATA] = {};
                }
                // transform collection mechaism for `scorers` or for dinamical lists.
                template = template.replace(/\<li([^>]*)\>(.*?)\<\/li\>/g, function(all, attr, repeater) {
                    var iteratorName = getNewIndex('iterator');
                    var parts, vector = '';
                    repeater = repeater.replace(/\$([\$a-z0-9_.\[\]]+)/gi, function(all, path) {
                        path2obj(scope[SCOPE_FREETYPEDATA], path);
                        parts = path.split(/[\d*]/);
                        if (parts.length === 2 && parts[1] != '') {
                            vector = parts[0].substr(0, parts[0].length - 1);
                            return '$$' + iteratorName + '.' + parts[1].substr(2);
                        } else {
                            return all;
                        }
                    });
                    return '<li ng-repeat="' + iteratorName + ' in ' + SCOPE_FREETYPEDATA + '.' + vector + '">' +
                            repeater + '<freetype-collection-remove index="$index" vector="' + SCOPE_FREETYPEDATA + '.' + vector + '"/>' +
                            '</li><li><freetype-collection-add vector="' + SCOPE_FREETYPEDATA + '.' + vector + '"/></li>';
                });
                // transform dollar variables in the attributes of `name` or `text` in any standalone tag .
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, function(all, tag, attr) {
                    var name;
                    attr = attr.replace(/(name|text)\w*=\w*("|')?\$([\$a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        // remove the dollar variable from the attributes.
                        return '';
                    });
                    if (name) {
                        path2obj(scope[SCOPE_FREETYPEDATA], name);
                        return '<input ng-model=' + makeAngularAttr(name, attr) + '/>';
                    }
                    return all;
                });
                // transform dollar variables in content of any start to end tag.
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>(.*?)<\/\1>?/gi, function(all, tag, attr, content) {
                    var name, parts;
                    content = content.replace(/^\s+|\s+$/g, '');
                    parts = content.match(/^\$([\$a-z0-9]+)/gi);
                    // content should be only the variable name
                    if (parts && parts[0].length === content.length) {
                        name = content.substr(1);
                    }
                    if (name) {
                        path2obj(scope[SCOPE_FREETYPEDATA], name);
                        return '<input ng-model=' + makeAngularAttr(name, attr) + '/>';
                    }
                    return all;
                });
                // transform dollar variables in the attributes of `image` in any standalone tag .
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, function(all, tag, attr) {
                    var name;
                    attr = attr.replace(/(image|graphic|rendition)\w*=\w*("|')?\$([\$a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        // remove the dollar variable from the attributes.
                        return '';
                    });
                    if (name) {
                        path2obj(scope[SCOPE_FREETYPEDATA], name + '.picture_url');
                        return '<freetype-image image=' + makeAngularAttr(name, attr) + '></freetype-image>';
                    }
                    return all;
                });
                // transform dollar variables in the attributes of `link` in any standalone tag .
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, function(all, tag, attr) {
                    var name;
                    attr = attr.replace(/(link|url)\w*=\w*("|')?\$([\$a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        // remove the dollar variable from the attributes.
                        return '';
                    });
                    if (name) {
                        path2obj(scope[SCOPE_FREETYPEDATA], name);
                        return '<freetype-link link=' + makeAngularAttr(name, attr) + '></freetype-link>';
                    }
                    return all;
                });
                // transform dollar variables in the attributes of `embed` in any standalone tag .
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, function(all, tag, attr) {
                    var name;
                    attr = attr.replace(/(embed|html)\w*=\w*("|')?\$([\$a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        // remove the dollar variable from the avem o problema, attributes.
                        return '';
                    });
                    if (name) {
                        path2obj(scope[SCOPE_FREETYPEDATA], name);
                        return '<freetype-embed embed=' + makeAngularAttr(name, attr) + '></freetype-embed>';
                    }
                    return all;
                });
                return template;

            },
            htmlContent: function(template, data) {
                var paths = {},
                    path,
                    wrapBefore = '',
                    wrapAfter = '';
                obj2path(paths, data);
                template = template.replace(/\<li([^>]*)\>(.*?)\<\/li\>/g, function(all, attr, repeater) {
                    var vector, vectorPath, parts, templ = '', emptyVars = true;
                    repeater = repeater.replace(/\$([\$a-z0-9_.\[\]]+)/gi, function(all, path) {
                        parts = path.split(/[\d*]/);
                        if (parts.length === 2 && parts[1] != '') {
                            vectorPath = parts[0].substr(0, parts[0].length - 1);
                            return all;
                        } else {
                            return all;
                        }
                    });
                    if (vectorPath) {
                        vector = path2obj(data, vectorPath);
                        for (var i = 1; i< vector.length; i++) {
                            templ += '<li' + attr + '>' + repeater.replace('[]', '[0]').replace(/\$([\$a-z0-9_.\[\]]+)/gi, function(all) {
                                return all.replace('[]', '[0]').replace('[0]', '[' + i  + ']');
                            }) + '</li>';
                        }
                        repeater.replace('[]', '[0]').replace(/\$([\$a-z0-9_.\[\]]+)/gi, function(all, name) {
                            if (vector[0][name.replace(vectorPath + '[0].', '')]) {
                                emptyVars = false;
                            } else {
                                emptyVars = emptyVars && true;
                            }
                        });
                        if (emptyVars) {
                            return '';
                        } else {
                            return all.replace('[]', '[0]') + templ;
                        }
                    }
                    return all.replace('[]', '[0]');
                });
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, function(all, tag, attr) {
                    var name, type;
                    // transform `name` and `text` variables.
                    attr = attr.replace(/(name|text)\w*=\w*("|')?\$([\$a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        type = 'text';
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                    attr = attr.replace(/(image|graphic|rendition)\w*=\w*("|')?\$([\$a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname + '.picture_url';
                        type = 'image';
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                    attr = attr.replace(/(wrap-link)\w*=\w*("|')?\$([\$a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        type = 'wrap-link';
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                    attr = attr.replace(/(embed)\w*=\w*("|')?\$([\$a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        type = 'embed';
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                    if (name || type) {
                        switch (type) {
                            case 'text':
                                if (paths[name]) {
                                    return '<span ' + injectClass(attr, 'freetype--element') + '>' + paths[name] + '</span>';
                                } else {
                                   return '<span ' + injectClass(attr, 'freetype--empty') + '></span>';
                                }
                                break;

                            case 'image':
                                if (paths[name]) {
                                    return '<img src="' + paths[name] + '"/>'
                                } else {
                                   return '<span ' + injectClass(attr, 'freetype--empty') + '></span>';
                                }
                                break;

                            case 'embed':
                                if (paths[name]) {
                                    return paths[name]
                                } else {
                                   return '<span ' + injectClass(attr, 'freetype--empty') + '></span>';
                                }
                                break;

                            case 'wrap-link':
                                if (paths[name]) {
                                    wrapBefore = '<a href="' + paths[name] + '"' + injectClass(attr, 'freetype--wrap') + ' target="_blank">';
                                    wrapAfter = '</a>'
                                }
                                return '';
                                break;
                        }
                    }
                    return all;
                });
                template = (function recursiveContent(template) {
                    template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>(.*?)<\/\1>?/gi, function(all, tag, attr, content) {
                        if (content) {
                            content = recursiveContent(content);
                        }
                        var name, type;
                        attr = attr.replace(/hide-render/gi, function(match, tag, quote, rname) {
                            type = 'hide-render';
                            // remove the dollar variable from the attributes.
                            return '';
                        });
                        if (name || type) {
                            switch (type) {
                                case 'text':
                                    if (paths[name]) {
                                        return '<span ' + injectClass(attr, 'freetype--element') + '>' + paths[name] + '</span>';
                                    } else {
                                       return '<span ' + injectClass(attr, 'freetype--empty') + '></span>';
                                    }
                                    break;
                                case 'hide-render': {
                                    return '';
                                    break;
                                }
                            }
                        }
                        return '<' + tag + attr + '>' + content + '</' + tag + '>';
                    });
                    return template;
                })(template);
                return wrapBefore + template + wrapAfter;
            }
        };
    }]);
});

