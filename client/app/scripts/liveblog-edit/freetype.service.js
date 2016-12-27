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
        return '"' + SCOPE_FREETYPEDATA + '.' + name.replace('[]', '[0]') + '" ' + attr;
    }
    /**
    * Create the structure from path in the obj.
    *    this is needed to create the vectors in the angular scope.
    */
    function setStructure(obj, path, value) {
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
                    variable[vector[1]] = [];
                    variable[vector[1]][vector[2]] = part
                    variable = part;
                } else {
                    if (i === parts.length - 1){
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

    angular.module('liveblog.freetype', ['liveblog.edit'])
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
                // transform dolar variables in the attributes of `name` or `text` in any standalone tag .
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, function(all, tag, attr) {
                    var name;
                    attr = attr.replace(/(name|text)\w*=\w*("|')?\$([a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        // remove the dolar variable from the attributes.
                        return '';
                    });
                    if (name) {
                        setStructure(scope[SCOPE_FREETYPEDATA], name);
                        return '<input ng-model=' + makeAngularAttr(name, attr) + '/>';
                    }
                    return all;
                });
                // transform dolar variables in content of any start to end tag.
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>(.*?)<\/\1>?/gi, function(all, tag, attr, content) {
                    var name, parts;
                    content = content.replace(/^\s+|\s+$/g, '');
                    parts = content.match(/^\$([a-z0-9]+)/gi);
                    // content should be only the variable name
                    if (parts && parts[0].length === content.length) {
                        name = content.substr(1);
                    }
                    if (name) {
                        setStructure(scope[SCOPE_FREETYPEDATA], name); a
                        return '<input ng-model=' + makeAngularAttr(name, attr) + '/>';
                    }
                    return all;
                });
                // transform dolar variables in the attributes of `image` in any standalone tag .
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, function(all, tag, attr) {
                    var name;
                    attr = attr.replace(/(image|graphic|rendition)\w*=\w*("|')?\$([a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        // remove the dolar variable from the attributes.
                        return '';
                    });
                    if (name) {
                        setStructure(scope[SCOPE_FREETYPEDATA], name + '.picture_url');
                        return '<freetype-image image=' + makeAngularAttr(name, attr) + '></freetype-image>';
                    }
                    return all;
                });
                // transform dolar variables in the attributes of `link` in any standalone tag .
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, function(all, tag, attr) {
                    var name;
                    attr = attr.replace(/(link|url)\w*=\w*("|')?\$([a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        // remove the dolar variable from the attributes.
                        return '';
                    });
                    if (name) {
                        setStructure(scope[SCOPE_FREETYPEDATA], name);
                        return '<freetype-link link=' + makeAngularAttr(name, attr) + '></freetype-link>';
                    }
                    return all;
                });
                // transform dolar variables in the attributes of `embed` in any standalone tag .
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, function(all, tag, attr) {
                    var name;
                    attr = attr.replace(/(embed|html)\w*=\w*("|')?\$([a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        // remove the dolar variable from the attributes.
                        return '';
                    });
                    if (name) {
                        setStructure(scope[SCOPE_FREETYPEDATA], name);
                        return '<freetype-embed embed=' + makeAngularAttr(name, attr) + '></freetype-embed>';
                    }
                    return all;
                });
                // @TODO: remove when freetype-collection mechanism is full implemented.
                // transform collection mechaism for `scorers` or for dinamical lists.
                // template = template.replace(/\<li[^>]*\>(.*?)\<\/li\>/g, function(all) {
                //     return all + '<li><freetype-collection/></li>';
                // })
                return template;

            },
            htmlContent: function(template, data) {
                var paths = {}, path, wrapBefore = '', wrapAfter = '';
                obj2path(paths, data);
                template = template.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, function(all, tag, attr) {
                    var name, type;
                    // transform `name` and `text` variables.
                    attr = attr.replace(/(name|text)\w*=\w*("|')?\$([a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        type = 'text';
                        // remove the dolar variable from the attributes.
                        return '';
                    });

                    attr = attr.replace(/(image|graphic|rendition)\w*=\w*("|')?\$([a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname + '.picture_url';
                        type = 'image';
                        // remove the dolar variable from the attributes.
                        return '';
                    });

                    attr = attr.replace(/(wrap-link)\w*=\w*("|')?\$([a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        type = 'wrap-link';
                        // remove the dolar variable from the attributes.
                        return '';
                    });

                    attr = attr.replace(/(embed)\w*=\w*("|')?\$([a-z0-9_.\[\]]+)("|')?/gi, function(match, tag, quote, rname) {
                        name = rname;
                        type = 'embed';
                        // remove the dolar variable from the attributes.
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
                            // remove the dolar variable from the attributes.
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
                    scope.initialData = angular.copy(scope.freetypeData);
                });
                
                //methods to control freetype functionality from outside the directive
                scope.internalControl = scope.control || {};

                //check if !dirty
                scope.internalControl.isClean = function() {
                    return angular.equals(scope.freetypeData, scope.initialData);
                };
            },
            scope: {
                freetype: '=',
                freetypeData: '=',
                control: '='
            }
        };
    }])
    .directive('freetypeEmbed', ['$compile', function($compile) {

        return {
            restrict: 'E',
            template: '<textarea ng-model="embed"></textarea>',
            controller: function() {
            },
            scope: {
                embed: '='
            }
        };
    }])
    .directive('freetypeLink', ['$compile', function($compile) {

        return {
            restrict: 'E',
            template: '<input type="url" ng-model="link"/>',
            controller: function() {
            },
            scope: {
                link: '='
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
    }])
    .directive('freetypeImage', ['$compile', 'modal', 'api', 'upload', function($compile, modal, api, upload) {
        return {
            restrict: 'E',
            template: '<div class="form-group"><div class="form-input form-image"><figure class="ads-media" ng-show="image.picture_url"><img ng-src="{{image.picture_url}}"/><div class="ads-image-actions"><button class="btn btn-info pull-right" ng-click="ft.openUploadModal()" translate>Change</button><button class="btn btn-default pull-right" ng-click="ft.removeImage()" translate>Remove</button></div></figure><div ng-hide="image.picture_url"><button class="btn btn-info" ng-click="ft.openUploadModal()" translate>Upload Image</button><div class="image-text pull-left" translate>Image has not been set so far</div></div></div></div><div sd-modal="" data-model="ft.uploadModal"><form ng-submit="ft.upload(ft.preview)" name="uploadImageForm"><div class="modal-header"><button class="close" ng-click="ft.closeUploadModal()"><i class="icon-close-small"></i></button> <h3 translate>Upload Advertisment Image</h3> </div><div class="modal-body"> <div class="upload-form"> <section class="main" sd-image-preview="ft.preview.url" data-file="ft.preview.img" data-progress-width="ft.progress.width" > <div class="upload-progress" ng-show="progress.width"> <div class="bar" style="width:{{progress.width}}%;"></div></div><div class="computer" ng-if="!ft.preview.url" ng-hide="ft.progress.width"> <div class="dropzone" ng-file-drop="ft.preview.img=$files[0]"> <div class="text" translate>Drop it here</div><div class="input-holder"> <input type="file" accept="image/*;capture=camera" ng-file-select="ft.preview.img=$files[0]"> </div></div></div><div class="preview" ng-if="ft.preview.url"> <div class="original"> <div sd-plain-image data-src="ft.preview.url" data-progress-width="ft.progress.width" data-file="ft.preview.img" ></div></div></div></div></div><div class="modal-footer"> <button type="submit" class="btn btn-primary btn-info" translate>Upload</button> </div></form></div>',
            controller: ['$scope', function($scope) {
                var vm = this;
                angular.extend(vm, {
                    preview: {},
                    progress: {width: 0},
                    openUploadModal: function() {
                        vm.uploadModal = true;
                    },
                    closeUploadModal: function() {
                        vm.uploadModal = false;
                        vm.preview = {};
                        vm.progress = {width: 0};
                    },
                    removeImage: function() {
                        modal.confirm(gettext('Are you sure you want to remove the blog image?')).then(function() {
                            $scope.image.picture_url = null;
                        });
                    },
                    upload: function(config) {
                        var form = {};
                        if (config.img) {
                            form.media = config.img;
                        } else if (config.url) {
                            form.URL = config.url;
                        } else {
                            return;
                        }
                        // return a promise of upload which will call the success/error callback
                        return api.archive.getUrl().then(function(url) {
                            return upload.start({
                                method: 'POST',
                                url: url,
                                data: form
                            })
                            .then(function(response) {
                                if (response.data._status === 'ERR'){
                                    return;
                                }
                                var picture_url = response.data.renditions.viewImage.href;
                                $scope.image.picture_url = picture_url;
                                $scope.image.picture = response.data._id;
                                vm.uploadModal = false;
                                vm.preview = {};
                                vm.progress = {width: 0};
                            }, null, function(progress) {
                                vm.progress.width = Math.round(progress.loaded / progress.total * 100.0);
                            });
                        });
                    }
                });
            }],
            controllerAs: 'ft',
            scope: {
                image: '='
            }
        };
    }]);
})(angular);

