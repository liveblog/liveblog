'use strict';

angular.module('liveblog.security', [])
.service('blogSecurityService',
    ['$q', '$rootScope', '$route', 'blogService', '$location', 'privileges',
    function($q, $rootScope, $route, blogService, $location, privileges) {
        function canPublishAPost(blog) {
            return privileges.userHasPrivileges({'publish_post': 1});
        }
        function canCreateABlog() {
            return privileges.userHasPrivileges({'blogs': 1});
        }
        function isAdmin() {
            return $rootScope.currentUser.user_type === 'administrator';
        }
        function isUserOwnerOrAdmin(archive) {
            return $rootScope.currentUser._id === archive.original_creator || isAdmin();
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
            canAccessSettings: canAccessSettings,
            canPublishAPost: canPublishAPost,
            canCreateABlog: canCreateABlog
        };
    }
]);
