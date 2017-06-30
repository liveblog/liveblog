import angular from 'angular';

export default angular
.module('SirTrevor', [])
    .provider('SirTrevor', function() {
        this.$get = function() {
            return window.SirTrevor;
        };
        angular.extend(this, window.SirTrevor);
    })
    .provider('SirTrevorOptions', function() {
        var options = {
            blockTypes: ['Text'],
            transform: {
                get: function(block) {
                    return {
                        type: block.blockStorage.type,
                        data: block.blockStorage.data
                    };
                },
                set: function(block) {
                    return {
                        type: block.type,
                        data: block.data
                    };
                }
            }
        };
        this.$get = function() {
            return options;
        };
        this.$extend = function(opts) {
            angular.extend(options, opts);
        };
        this.$set = function(opts) {
            options = opts;
        };
    })
    .directive('ngSirTrevor', ['SirTrevor', 'SirTrevorOptions', function(SirTrevor, options) {
        var directive = {
            template: function(element, attr) {
                var str = '<textarea class="sir-trevor" name="content"></textarea>';
                // sir trevor needs a parent `form` tag.
                if (!element.parent('form').length) {
                    str = '<form>' + str + '</form>';
                }
                return str;
            },
            scope: {
                'editor': '=stModel',
                'onChange': '=stChange',
                'params': '=stParams'
            },
            link: function (scope, element, attrs) {
                var opts = angular.copy(options);
                angular.extend(opts, scope.params);
                opts.el = $(element.find('textarea'));
                scope.editor = new SirTrevor.Editor(opts);
                scope.editor.get = function() {
                    var list = [];
                    // sort blocks by index.
                    scope.editor.blocks.sort(function(a, b) {
                        return (a.$el.index() - b.$el.index());
                    });
                    angular.forEach(scope.editor.blocks, function(block) {
                        scope.editor.saveBlockStateToStore(block);
                        list.push(opts.transform.get(block));
                    });
                    return list;
                };
                scope.editor.set = function(list) {
                    var item;
                    angular.forEach(list, function(block) {
                        item = opts.transform.set(block);
                        scope.editor.createBlock(item.type, item.data);
                    });
                };

                scope.editor.clear = function() {
                    angular.forEach(scope.editor.blocks, function(block) {
                        block.remove();
                    });
                    scope.editor.dataStore.data = [];
                };

                element.on('keyup', scope.onChange);

                // @TODO: investigate how to better `digest` out of $scope  variables.
                //scope.$watchCollection('editor.blocks', function(blocks) {
                //     var list = [];
                //     _.each(blocks, function(block) {
                //         list.push(scope.editor.get(block));
                //     });
                //     scope.model = list;
                //});
            }
        };
        return directive;
    }]);


