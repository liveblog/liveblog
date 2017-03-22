/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import dateFormTpl from 'scripts/liveblog-themes/views/date-format.html';

(function() {
    angular.module('liveblog.themes')
        .directive('lbDateFormat', [function() {
            return {
                scope: {
                    options: '=',
                    value: '=ngModel'
                },
                templateUrl: dateFormTpl,
                link: function(scope) {
                    if (scope.options.indexOf(scope.value) !== -1) {
                        scope.radio = scope.value;
                        scope.custom = '';
                    } else {
                        scope.radio = '';
                        scope.custom = scope.value;
                    }
                    scope.$watch('radio + custom', function() {
                        if (scope.radio === '') {
                            scope.value = scope.custom;
                        } else {
                            scope.value = scope.radio;
                            scope.custom = '';
                        }
                    });
                }
            };
        }])
})();
