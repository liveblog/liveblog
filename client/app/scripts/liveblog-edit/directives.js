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
import _ from 'lodash';

import lbPostsList from './directives/posts-list';
import lbPost from './directives/post';
import lbItem from './directives/item';
import stopEvent from './directives/stop-event';
import selectTextOnClick from './directives/select-text-on-click';
import lbBindHtml from './directives/bind-html';
import lbFilterByMember from './directives/filter-by-member';
import autofocus from './directives/autofocus';
import fullHeight from './directives/full-height';
import outputModal from './directives/output-modal.js';

// Freetype related directives
import freetypeRender from './directives/freetype-render';
import freetypeEmbed from './directives/freetype-embed';
import freetypeText from './directives/freetype-text';
import freetypeSelect from './directives/freetype-select';
import freetypeLink from './directives/freetype-link';
import freetypeCollectionAdd from './directives/freetype-collection-add';
import freetypeCollectionRemove from './directives/freetype-collection-remove';
import freetypeImage from './directives/freetype-image';

angular.module('liveblog.edit')
    .directive('lbPostsList', lbPostsList)
    .directive('lbItem', lbItem)
    .directive('lbPost', lbPost)
    .directive('stopEvent', stopEvent)
    .directive('selectTextOnClick', selectTextOnClick)
    .directive('lbBindHtml', lbBindHtml)
    .directive('lbFilterByMember', lbFilterByMember)
    .directive('autofocus', autofocus)
    .directive('fullHeight', fullHeight)
    .directive('outputModal', outputModal)
    .directive('freetypeRender', freetypeRender)
    .directive('freetypeEmbed', freetypeEmbed)
    .directive('freetypeText', freetypeText)
    .directive('freetypeSelect',freetypeSelect)
    .directive('freetypeLink', freetypeLink)
    .directive('freetypeCollectionAdd', freetypeCollectionAdd)
    .directive('freetypeCollectionRemove', freetypeCollectionRemove)
    .directive('freetypeImage', freetypeImage);
