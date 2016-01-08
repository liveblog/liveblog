(function(angular) {
    'use strict';
    angular.module('liveblog-embed')
        .directive('lbBindHtml', [function() {
            return {
                restrict: 'A',
                link: function(scope, elem, attrs) {
                    attrs.$observe('htmlContent', function() {
                        if (attrs.htmlLocation) {
                            //need to inject the html in a specific element
                            elem.find('[' + attrs.htmlLocation + ']').html(attrs.htmlContent);
                        } else {
                            //inject streaght in the elem
                            elem.html(attrs.htmlContent);
                        }
                    });
                }
            };
        }])
        /**
         * Save the aspect ratio of the orignal iframe, set the full width and preserve the original ratio
         */
        .directive('lbFluidIframe', ['$timeout', '$window', function($timeout, $window) {
            return {
                restrict: 'EA',
                link: function(scope, elem, attrs) {
                    var iframe;
                    $timeout(function() {
                        iframe = elem.find('iframe');
                        iframe.data('aspectRatio', iframe.attr('height') / iframe.attr('width'))
                        .removeAttr('height')
                        .removeAttr('width');
                        resize();
                    }, 1000);
                    function resize() {
                        var newWidth = elem.innerWidth();
                        iframe
                            .width(newWidth)
                            .height(newWidth * iframe.data('aspectRatio'));
                    }
                    angular.element($window).bind('resize', _.debounce(resize, 1000));
                }
            };
        }])
        .directive('lbTwitterCard', [function() {
            return {
                restrict: 'E',
                link: function(scope, elem, attrs) {
                    elem.html(attrs.lbTwitterContent);
                }
            };
        }])
        .directive('lbGenericEmbed', ['$timeout', '$window', function($timeout, $window) {
            return {
                scope: {
                    item: '='
                },
                template: [
                    '<div ng-if="isEmbedCode" class="item--embed" lb-bind-html html-content="{{item.meta.html}}"></div>',
                    '<article class="item--embed">',
                    '    <img ng-if="!isEmbedCode && item.meta.thumbnail_url" ng-src="{{ item.meta.thumbnail_url }}" class="item--embed__illustration"/>',
                    '    <div class="item--embed__title" ng-if="item.meta.title">',
                    '        <a ng-href="{{ item.meta.url }}" target="_blank" ng-bind="item.meta.title"></a>',
                    '    </div>',
                    '    <div class="item--embed__description" ng-if="item.meta.description" ng-bind="item.meta.description"></div>',
                    '    <div class="item--embed__credit" ng-if="item.meta.credit" ng-bind="item.meta.credit"></div>',
                    '</article>'
                ].join(''),
                link: function(scope, element) {
                    var resize = function resize() {
                        // update the min-height, depending of the image ratio
                        $timeout(function() {
                            var imageWidth = element.find('.item--embed__illustration').width();
                            if (imageWidth) {
                                var minHeight = (scope.item.meta.thumbnail_height / scope.item.meta.thumbnail_width) * imageWidth;
                                element.find('.item--embed').css('min-height', minHeight);
                            }
                        });
                    };
                    scope.isEmbedCode = angular.isDefined(scope.item.meta.html);
                    if (!scope.isEmbedCode) {
                        resize();
                        angular.element($window).bind('resize', _.debounce(resize, 1000));
                    }
                }
            };
        }]);
})(angular);
