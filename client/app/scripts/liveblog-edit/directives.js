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
    'lodash',
    './module'
], function(angular, _) {
    'use strict';
    angular.module('liveblog.edit').directive('slideable', function() {
        return {
            restrict: 'A',
            scope: {
                'slideableMove': '@',
                'slideable': '='
            },
            link: function(scope, element, attrs) {
                var old_left = parseInt(element.css('left'), 10);
                var to_be_moved = angular.element(document.querySelectorAll(scope.slideableMove));
                var panel_width = element.width();
                function toggleSlide(new_value, old_value) {
                    if (scope.slideable) {
                        element.show();
                        to_be_moved.css({
                            left: panel_width + old_left
                        });
                    } else {
                        element.hide();
                        to_be_moved.css({
                            left: old_left
                        });
                    }
                }
                scope.$watch('slideable', toggleSlide);
            }
        };
    });
});

// EOF
