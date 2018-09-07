/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import angular from 'angular';
import './module';

'use strict';
/**
     * Name of the scope variable where the freetype data will be stored.
     */
const SCOPE_FREETYPEDATA = 'freetypeData';

/**
     * General regex for catching a $dolar variable
     */
const REGEX_VARIABLE = /\$([$a-z0-9_.[\]]+)/gi;

/**
     * Generation of new index.
     */
let index = 0;

function getNewIndex(string) {
    index = index + 1;
    return string + '__' + index;
}
/**
     * Makes the form text input with angular model freetypeData.name.
     * also add the attributes from the tag, needed in case of classes or styles.
     */
function makeAngularAttr(name, attrRef = '') {
    // remove any trailing `/` character from attr.
    // the trailing character is composed.
    let attr = attrRef.replace(/compulsory\s*=\s*("|')?([^"']+)("|')/g, 'compulsory="' + SCOPE_FREETYPEDATA + '.$2"');

    attr = attr.replace(/\$\$/g, '');
    if (attr.substr(attr.length - 1, 1) === '/') {
        attr = attr.substr(0, attr.length - 1);
    }
    if (name.substr(0, 1) === '$') {
        return '"' + name.substr(1).replace('[]', '[0]') + '" ' + attr;
    }

    return '"' + SCOPE_FREETYPEDATA + '.' + name.replace('[]', '[0]') + '" ' + attr;
}
/**
    * Sets and gets the obj from path.
    *    this is needed to create the vectors in the angular scope.
    */
function _recusivePath2obj(obj, path, value) {
    const index = path.indexOf('.');

    if (index === -1) {
        obj[path] = value ? value : obj[path];
        return obj[path];
    }

    const key = path.substring(0, index);
    const [next] = path.substring(index + 1).split('.', 1);

    if (!obj[key]) {
        // integer values sets a vector and string sets an object.
        // check if the integer next value is the same with the next value.
        obj[key] = +next + '' === next ? [] : {};
    }
    return _recusivePath2obj(obj[key], path.substring(index + 1), value);
}

function path2obj(obj, path, value) {
    // the path should be a string and not a $value variable
    if (typeof path !== 'string' || path.substr(0, 1) === '$') {
        return;
    }

    // normalize the path, square brackets to . and [] has a default value 0.
    return _recusivePath2obj(obj,
        path.replace(/\[\]/g, '[0]')
            .replace(/\[/g, '.')
            .replace(/]/g, ''),
        value);
}
/**
    * Create a list of paths from `obj` parameter and return it in the
    * `ret` parameter
    */
function obj2path(ret = {}, obj, path) {
    let gotopath;

    angular.forEach(obj, (value, key) => {
        if (angular.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                gotopath = path ? path + '.' + key + '[' + i + ']' : key + '[' + i + ']';
                obj2path(ret, value[i], gotopath);
            }
        } else if (angular.isObject(value)) {
            gotopath = path ? path + '.' + key : key;
            obj2path(ret, value, gotopath);
        } else {
            gotopath = path ? path + '.' + key : key;
            ret[gotopath] = value;
        }
    });
}
/**
     * Inject `class` in the class attributes string.
     */
function injectClass(attrParam, cls) {
    let attr = attrParam;

    if (attr.indexOf('class') > -1) {
        return attr.replace(/class\s*=\s*("|')?([^"']+)("|')/, 'class="' + cls + ' $2"');
    }

    attr += 'class="' + cls + '" ';
    return attr;
}
/**
     * check if an angular object has all empty values.
     */
function emptyValues(obj) {
    let empty = true;

    _.each(obj, (val, key) => {
        // ingnore angular key settings
        if (key.substr(0, 2) !== '$$') {
            empty = empty && val === '';
        }
    });
    return empty;
}

angular.module('liveblog.edit')
    .factory('freetypeService', () => ({
        /**
            * transformation method from dollar sign template to angular template
            * also requires `scope` object so that the proper object with the data is set.
            *     this is special case for vector array.
            */
        transform: function(templateParam = '', scope) {
            let template = templateParam;

            if (!angular.isObject(scope[SCOPE_FREETYPEDATA])) {
                scope[SCOPE_FREETYPEDATA] = {};
            }
            // transform collection mechaism for `scorers` or for dinamical lists.
            template = template.replace(/<li([^>]*)>((.|\n)*?)<\/li>/g, (all, attr, repeaterParam) => {
                const iteratorName = getNewIndex('iterator');
                let parts;
                let vector = '';

                const repeater = repeaterParam.replace(REGEX_VARIABLE, (all, path) => {
                    path2obj(scope[SCOPE_FREETYPEDATA], path);
                    parts = path.split(/[\d*]/);
                    if (parts.length === 2 && parts[1] !== '') {
                        vector = parts[0].substr(0, parts[0].length - 1);
                        return '$$' + iteratorName + '.' + parts[1].substr(2);
                    }

                    return all;
                });
                const collection = SCOPE_FREETYPEDATA + '.' + vector;

                return '<li ng-repeat="' + iteratorName + ' in ' + collection + '">' +
                            repeater + '<freetype-collection-remove index="$index" vector="' + collection + '"/>' +
                            '</li><li><freetype-collection-add vector="' + collection + '"/></li>';
            });
            // transform dollar variables in the attributes of `name` or `text` in any standalone tag .
            template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (all, tag, attrParam) => {
                let name;

                const attr = attrParam.replace(/(checkbox|radio)\s*=\s*("|')?\$([$a-z0-9_.[\]]+)("|')?/gi,
                    (match, tag, quote, rname) => {
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
            // transform dollar variables in the attributes of `name` or `text` in any standalone tag .
            template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (all, tag, attrParam) => {
                let name;

                const attr = attrParam.replace(/(name|text)\s*=\s*("|')?\$([$a-z0-9_.[\]]+)("|')?/gi,
                    (match, tag, quote, rname) => {
                        name = rname;
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                if (name) {
                    path2obj(scope[SCOPE_FREETYPEDATA], name);
                    return '<freetype-text text='
                                + makeAngularAttr(name, attr)
                                + ' validation="validation"></freetype-text>';
                }
                return all;
            });
            // transform dollar variables in the attributes of `name` or `text` in any standalone tag .
            template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (all, tag, attrParam) => {
                let name;
                let options;

                let attr = attrParam.replace(/(select|dropdown)\s*=\s*("|')?\$([$a-z0-9_.[\]]+)("|')?/gi,
                    (match, tag, quote, rname) => {
                        name = rname;
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                attr = attr.replace(/(options)\s*=\s*("|')?([^"']+)("|')?/gi,
                    (match, tag, quote, roptions) => {
                        options = roptions;
                        // remove the dollar variable from the attributes.
                        return '';
                    });
                if (name) {
                    path2obj(scope[SCOPE_FREETYPEDATA], name);
                    return '<freetype-select options="' + options + '" select='
                                + makeAngularAttr(name, attr)
                                + ' validation="validation"></freetype-select>';
                }
                return all;
            });
            // transform dollar variables in content of any start to end tag.
            template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>(.*?)<\/\1>?/gi,
                (all, tag, attr, content) => {
                    let name;

                    const parts = content.replace(/^\s+|\s+$/g, '')
                        .match(/^\$([$a-z0-9]+)/gi);

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
            template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (all, tag, attrParam) => {
                let name;

                const attr = attrParam.replace(/(image|graphic|rendition)\s*=\s*("|')?\$([$a-z0-9_.[\]]+)("|')?/gi,
                    (match, tag, quote, rname) => {
                        name = rname;
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                if (name) {
                    path2obj(scope[SCOPE_FREETYPEDATA], name + '.picture_url');
                    return '<freetype-image image='
                                + makeAngularAttr(name, attr)
                                + ' validation="validation"></freetype-image>';
                }
                return all;
            });
            // transform dollar variables in the attributes of `link` in any standalone tag .
            template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (all, tag, attrParam) => {
                let name;

                const attr = attrParam.replace(/(link|url)\s*=\s*("|')?\$([$a-z0-9_.[\]]+)("|')?/gi,
                    (match, tag, quote, rname) => {
                        name = rname;
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                if (name) {
                    path2obj(scope[SCOPE_FREETYPEDATA], name);
                    return '<freetype-link link='
                                + makeAngularAttr(name, attr)
                                + ' validation="validation"></freetype-link>';
                }
                return all;
            });
            // transform dollar variables in the attributes of `embed` in any standalone tag .
            template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (all, tag, attrParam) => {
                let name;

                const attr = attrParam.replace(/(embed|html)\s*=\s*("|')?\$([$a-z0-9_.[\]]+)("|')?/gi,
                    (match, tag, quote, rname) => {
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

            // replace if not empty string variables.
            template = template.replace(/@([a-z0-9_.[\]-]+)\?\s*([a-z0-9_.[\]]+)/gi, (all, str, name) => {
                if (str.indexOf('media') !== -1) {
                    return all;
                }
                return '';
            });
            // replace conditional string variables.
            template = template.replace(/@([a-z0-9_.[\]-]+):\s*([a-z0-9_.[\]]+)/gi, (all, str, name) => {
                if (str.indexOf('media') !== -1) {
                    return all;
                }
                return '';
            });
            // replace variables
            template = template.replace(/@([a-z0-9_.[\]-]+)/gi, (all, name) => {
                if (all.indexOf('media') !== -1) {
                    return all;
                }
                return '{{' + SCOPE_FREETYPEDATA + '.' + name + '}}';
            });
            return template;
        },
        // create the html template that will be shown in the timeline and the live feed
        htmlContent: function(templateParam, data) {
            const paths = {};
            let wrapBefore = '';
            let wrapAfter = '';

            obj2path(paths, data);
            let template = templateParam.replace(/<li([^>]*)>((.|\n)*?)<\/li>/g, (all, attr, repeaterParam) => {
                let vector;
                let vectorPath;
                let parts;
                let templ = '';
                const emptyIndex = [];
                let i;

                const repeater = repeaterParam.replace(REGEX_VARIABLE, (all, path) => {
                    parts = path.split(/[\d*]/);
                    if (parts.length === 2 && parts[1] !== '') {
                        vectorPath = parts[0].substr(0, parts[0].length - 1);
                        return all;
                    }

                    return all;
                });

                if (vectorPath) {
                    vector = path2obj(data, vectorPath);
                    for (i = 1; i < vector.length; i++) {
                        // if current object has empty values add it to emptyIndexs and don't render it.
                        if (!emptyValues(vector[i])) {
                            templ += `<li${attr}>${
                                repeater.replace(REGEX_VARIABLE,
                                    (all) => all.replace('[]', '[0]').replace('[0]', '[' + i + ']'))
                            }</li>`;
                        } else {
                            emptyIndex.push(i);
                        }
                    }
                    // remove all the emptyIndexs from vector.
                    for (i = 0; i < emptyIndex.length; i++) {
                        vector.splice(emptyIndex[i], 1);
                    }
                    if (!emptyValues(vector[0])) {
                        return all.replace('[]', '[0]') + templ;
                    }

                    return '';
                }
                return all.replace('[]', '[0]');
            });

            const attributeScoop = (attrParam) => {
                let name;
                let type;
                let attr = _.trim(attrParam);

                if (attr.substr(-1, 1) === '/') {
                    attr = attr.substr(0, attr.length - 1);
                }
                // transform `name` and `text` variables.
                attr = attr.replace(/(name|text)\s*=\s*("|')?\$([$a-z0-9_.[\]]+)("|')?/gi,
                    (match, tag, quote, rname) => {
                        name = rname;
                        type = 'text';
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                attr = attr.replace(/(image|graphic|rendition)\s*=\s*("|')?\$([$a-z0-9_.[\]]+)("|')?/gi,
                    (match, tag, quote, rname) => {
                        name = rname + '.picture_url';
                        type = 'image';
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                attr = attr.replace(/(wrap-link)\s*=\s*("|')?\$([$a-z0-9_.[\]]+)("|')?/gi,
                    (match, tag, quote, rname) => {
                        name = rname;
                        type = 'wrap-link';
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                attr = attr.replace(/(embed)\s*=\s*("|')?\$([$a-z0-9_.[\]]+)("|')?/gi,
                    (match, tag, quote, rname) => {
                        name = rname;
                        type = 'embed';
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                attr = attr.replace(/(select|dropdown)\s*=\s*("|')?\$([$a-z0-9_.[\]]+)("|')?/gi,
                    (match, tag, quote, rname) => {
                        name = rname;
                        type = 'select';
                        // remove the dollar variable from the attributes.
                        return '';
                    });

                const removeAttr = ['number', 'necessary', 'maxlength', 'tandem'];

                attr = attr.replace(
                    new RegExp([
                        `(${removeAttr.join('|')})`,
                        '\\s*=\\s*("|\')?',
                        '([^"]+)',
                        '("|\')?',
                    ].join(''),
                    'gi'
                    ), '');
                return {
                    name,
                    type,
                    attr,
                };
            };

            /* eslint complexity: [0, 14] */
            template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (all, tag, attrParam) => {
                const {name, type, attr} = attributeScoop(attrParam);

                if (!name || !type) {
                    return all;
                }

                switch (type) {
                case 'select':
                case 'text':
                    return paths[name] ?
                        `<span ${injectClass(attr, 'freetype--element')}>${_.escape(paths[name])}</span>` :
                        `<span ${injectClass(attr, 'freetype--empty')}></span>`;

                case 'image':
                    return paths[name] ?
                        `<img src="${paths[name]}"/>` :
                        `<span ${injectClass(attr, 'freetype--empty')}></span>`;
                case 'embed':
                    return paths[name] ?
                        paths[name] :
                        `<span ${injectClass(attr, 'freetype--empty')}></span>`;
                case 'wrap-link':
                    if (paths[name]) {
                        wrapBefore = '<a href="'
                                                    + paths[name]
                                                    + '"'
                                                    + injectClass(attr, 'freetype--wrap')
                                                    + ' target="_blank">';
                        wrapAfter = '</a>';
                    }
                    return '';
                }
                return all;
            });
            // replace if not empty string variables.
            template = template.replace(/@([a-z0-9_.[\]-]+)\?\s*([a-z0-9_.[\]]+)/gi, (all, str, name) => {
                if (str.indexOf('media') !== -1) {
                    return all;
                }
                if (paths[name] || paths[name + '.picture_url']) {
                    return str;
                }
                return '';
            });
            // replace conditional string variables.
            template = template.replace(/@([a-z0-9_.[\]-]+):\s*([a-z0-9_.[\]]+)/gi, (all, str, nameParam) => {
                let name = nameParam;

                if (str.indexOf('media') !== -1) {
                    return all;
                }
                let prefix = '';
                let sufix = '';

                if (['background-image'].indexOf(str) !== -1) {
                    name = nameParam + '.picture_url';

                    prefix = 'url(';
                    sufix = ')';
                }
                if (paths[name]) {
                    return str + ':' + prefix + paths[name] + sufix;
                }
                return '';
            });
            // replace variables
            template = template.replace(/@([a-z0-9_.[\]-]+)/gi, (all, name) => {
                if (all.indexOf('media') !== -1) {
                    return all;
                }
                if (paths[name]) {
                    return paths[name];
                }
                return '';
            });
            // remove elements with the hide-render attribute
            template = (function recursiveContent(templateParam) {
                let template = templateParam.replace(/<([a-z][a-z0-9]*)\b([^>]*)>((.|\n)*?)<\/\1>?/gi,
                    (all, tag, attrParam, contentParam) => {
                        let type;
                        let content = contentParam;

                        const attr = attrParam.replace(/hide-render/gi, () => {
                            type = 'hide-render';
                            // remove hide-render from attributes
                            return '';
                        });

                        if (type === 'hide-render') {
                            return '';
                        } else if (content) {
                            content = recursiveContent(content);
                        }
                        return '<' + tag + attr + '>' + content + '</' + tag + '>';
                    });

                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>?/gi,
                    (all, tag, attrParam) => {
                        let type;

                        const attr = attrParam.replace(/hide-render/gi, () => {
                            type = 'hide-render';
                            // remove hide-render from attributes
                            return '';
                        });

                        if (type === 'hide-render') {
                            return '';
                        }
                        return '<' + tag + attr + '>';
                    });

                return template;
            })(template);

            return wrapBefore + template + wrapAfter;
        },
    }));
