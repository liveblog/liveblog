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

    DraftPostsController.$inject = [
        'api'
    ];
    function DraftPostsController(api) {
        // TODO
    }

    angular.module('liveblog.edit')
        .controller('DraftPostsController', DraftPostsController);
});

// EOF
