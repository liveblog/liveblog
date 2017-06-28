import './styles/liveblog-edit.scss';
import './styles/post.scss';
import './styles/posts-in-panel.scss';
import './styles/settings.scss';
import './styles/timeline.scss';
import './styles/sir-trevor.scss';
import './styles/sir-trevor-icons.scss';

import postsService from './posts.service';
import unreadPostsService from './unread.posts.service';
import blogService from './blog.service';
import pagesManagerFactory from './pages-manager.service';

angular.module('liveblog.posts', [])
    .service('postsService', postsService)
    .service('unreadPostsService', unreadPostsService);

angular.module('liveblog.blog', [])
    .service('blogService', blogService);

angular.module('liveblog.pages-manager', ['liveblog.posts', 'liveblog.edit'])
    .factory('PagesManager', pagesManagerFactory);

import './freetype.service';
import './module';
import './directives';
