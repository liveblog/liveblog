'use strict';

angular.module('liveblog.security', [])
.service('blogSecurityService',
    ['$q', '$rootScope', '$route', 'blogService', '$location', 'privileges',
    function($q, $rootScope, $route, blogService, $location, privileges) {
        function canPublishAPost() {
            return privileges.userHasPrivileges({'publish_post': 1});
        }
        function canCreateABlog() {
            return privileges.userHasPrivileges({'blogs': 1});
        }
        function isMemberOfBlog(blog) {
            // add the owner
            var ids = [blog.original_creator._id];
            // add the members
            if (blog.members) {
                ids.push.apply(ids, blog.members.map(function(member) {return member.user;}));
            }
            return ids.indexOf($rootScope.currentUser._id) > -1;
        }
        function canAccessBlog(blog) {
            return isAdmin() || isMemberOfBlog(blog);
        }
        function isAdmin() {
            return $rootScope.currentUser.user_type === 'administrator';
        }
        function isUserOwnerOrAdmin(archive) {
            return $rootScope.currentUser._id === archive.original_creator || isAdmin();
        }
        function isUserOwnerOrCanPublishAPost(archive) {
            return $rootScope.currentUser._id === archive.original_creator || canPublishAPost();
        }
        function canAccessSettings(archive) {
            return canCreateABlog() && isUserOwnerOrAdmin(archive);
        }
        function goToSettings() {
            var def = $q.defer();
            blogService.get($route.current.params._id)
            .then(function(response) {
                if (canAccessSettings(response)) {
                    def.resolve();
                } else {
                    def.reject();
                    $location.path('/liveblog/edit/' + $route.current.params._id);
                }
            }, function() {
                $location.path('/liveblog');
                def.reject('You do not have permission to change the settings of this blog');
            });
            return def.promise;
        }
        return {
            goToSettings: goToSettings,
            isUserOwnerOrAdmin: isUserOwnerOrAdmin,
            isUserOwnerOrCanPublishAPost: isUserOwnerOrCanPublishAPost,
            canAccessSettings: canAccessSettings,
            canPublishAPost: canPublishAPost,
            canCreateABlog: canCreateABlog,
            canAccessBlog: canAccessBlog
        };
    }
]);
