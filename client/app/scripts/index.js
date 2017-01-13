import 'lb-bootstrap.less';

import 'jquery-ui/jquery-ui';
import 'bootstrap';
import 'angular';
import 'angular-bootstrap-npm';
import 'angular-resource';
import 'angular-route';
import 'ng-file-upload';
import 'angular-gettext';
import 'angular-vs-repeat';
import 'angular-embedly';
import 'angular-embed/dist/angular-embed';
import 'angular-contenteditable';
import 'angular-messages';
import 'lodash';
import 'lr-infinite-scroll';
import 'ment.io';

// This is an ugly little hack required by the venerable superdesk.editor to work
import MediumEditor from 'medium-editor';
window.MediumEditor = MediumEditor;

// core
import 'superdesk-core/scripts/core/gettext';
import 'superdesk-core/scripts/core/activity';
import 'superdesk-core/scripts/core/analytics';
import 'superdesk-core/scripts/core/api';
import 'superdesk-core/scripts/core/auth';
import 'superdesk-core/scripts/core/beta';
import 'superdesk-core/scripts/core/datetime';
import 'superdesk-core/scripts/core/error';
import 'superdesk-core/scripts/core/elastic';
import 'superdesk-core/scripts/core/filters';
import 'superdesk-core/scripts/core/services';
import 'superdesk-core/scripts/core/directives';
import 'superdesk-core/scripts/core/editor/editor';
//import 'superdesk-core/scripts/core/editor2/editor';
import 'superdesk-core/scripts/core/editor/spellcheck/spellcheck';
import 'superdesk-core/scripts/core/features';
import 'superdesk-core/scripts/core/list';
import 'superdesk-core/scripts/core/keyboard';
import 'superdesk-core/scripts/core/privileges';
import 'superdesk-core/scripts/core/notification';
import 'superdesk-core/scripts/core/itemList';
import 'superdesk-core/scripts/core/menu';
import 'superdesk-core/scripts/core/notify';
import 'superdesk-core/scripts/core/ui';
import 'superdesk-core/scripts/core/upload';
import 'superdesk-core/scripts/core/lang';
import 'superdesk-core/scripts/core/superdesk';

import 'superdesk-core/scripts/apps/workspace';
import 'superdesk-core/scripts/apps/dashboard';
import 'superdesk-core/scripts/apps/users';
import 'superdesk-core/scripts/apps/groups';
import 'superdesk-core/scripts/apps/products';
import 'superdesk-core/scripts/apps/publish';
import 'superdesk-core/scripts/apps/templates';
import 'superdesk-core/scripts/apps/profiling';
import 'superdesk-core/scripts/apps/desks';
import 'superdesk-core/scripts/apps/authoring';
import 'superdesk-core/scripts/apps/search';
import 'superdesk-core/scripts/apps/legal-archive';
import 'superdesk-core/scripts/apps/stream';
import 'superdesk-core/scripts/apps/packaging';
import 'superdesk-core/scripts/apps/highlights';
import 'superdesk-core/scripts/apps/content-filters';
import 'superdesk-core/scripts/apps/dictionaries';
import 'superdesk-core/scripts/apps/vocabularies';
import 'superdesk-core/scripts/apps/archive';
import 'superdesk-core/scripts/apps/monitoring';
import 'superdesk-core/scripts/apps/settings';
import 'superdesk-core/scripts/apps/ingest';
import 'superdesk-core/scripts/apps/search-providers';

import 'liveblog-bloglist';
import 'liveblog-edit';
import 'liveblog-themes';
import 'liveblog-settings';

import 'liveblog-security.service';

//import './lb-templates';
import './lb-bootstrap';
