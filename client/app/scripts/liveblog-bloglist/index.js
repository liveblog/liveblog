import './styles/liveblog-bloglist.scss';
import './styles/liveblog-upload.scss';

import mainTemplate from 'scripts/liveblog-bloglist/views/main.html';

import blogListController from './controllers/blog-list';

import sdPlainImage from './directives/plain-image';
import ifBackgroundImage from './directives/if-background-image';
import lbUserSelectList from './directives/user-select-list';

export default angular.module('liveblog.bloglist', ['liveblog.security'])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('blogslist', {
            type: 'http',
            backend: {rel: 'blogslist'}
        });
        apiProvider.api('blogs', {
            type: 'http',
            backend: {rel: 'blogs'}
        });
        apiProvider.api('archive', {
            type: 'http',
            backend: {rel: 'archive'}
        });
    }])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/liveblog', {
                label: gettext('Blog List'),
                controller: blogListController,
                templateUrl: mainTemplate,
                category: superdesk.MENU_MAIN,
                adminTools: false,
                resolve: {isArchivedFilterSelected: function() {
                    return false;
                }}
            })
            .activity('/liveblog/active', {
                label: gettext('Blog List'),
                controller: blogListController,
                templateUrl: mainTemplate,
                resolve: {isArchivedFilterSelected: function() {
                    return false;
                }}
            })
            .activity('/liveblog/archived', {
                label: gettext('Blog List'),
                controller: blogListController,
                templateUrl: mainTemplate,
                resolve: {isArchivedFilterSelected: function() {
                    return true;
                }}
            });
    }])
    .filter('htmlToPlaintext', () => (text) => {
        // Replace paragraph and list item with an empty space
        var retValue = text ? String(text).replace(/<(p|li)>/g, ' ') : '';

        retValue = retValue.replace(/<[^>]+>/gm, '');
        return retValue.replace(/(&nbsp;)/gm, '');
    })
    .filter('username', ['session', function usernameFilter(session) {
        return function getUsername(user) {
            return user ? user.display_name || user.username : null;
        };
    }])
    .directive('sdPlainImage', sdPlainImage)
    .directive('ifBackgroundImage', ifBackgroundImage)
    .directive('lbUserSelectList', lbUserSelectList);
