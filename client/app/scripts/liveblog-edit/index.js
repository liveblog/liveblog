import './styles/liveblog-edit.scss';
import './styles/post.scss';
import './styles/posts-in-panel.scss';
import './styles/settings.scss';
import './styles/timeline.scss';

import postsService from './posts.service';
import unreadPostsService from './unread.posts.service';
import blogService from './blog.service';

angular.module('liveblog.posts', [])
    .service('postsService', postsService)
    .service('unreadPostsService', unreadPostsService);

angular.module('liveblog.blog', [])
    .service('blogService', blogService);

import './pages-manager.service';

//angular.module('liveblog.pages-manager', ['liveblog.posts', 'liveblog.edit'])

import './freetype.service';
import './module';
import './directives';
