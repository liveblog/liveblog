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
    'liveblog-edit/unread.posts.service',
    'ng-sir-trevor',
    'ng-sir-trevor-blocks',
    'angular-embed'
], function(angular, _) {
    'use strict';
    var BlogSettingsController = function($scope, blog, api, blogService, $location, notify,
        gettext, modal, $q, upload) {

        // set view's model
        var vm = this;
        angular.extend(vm, {
            blog: blog,
            newBlog: angular.copy(blog),
            blogPreferences: angular.copy(blog.blog_preferences),
            availableLanguages: [],
            original_creator: {},
            availableThemes: [],
            //used as an aux var to be able to change members and safely cancel the changes
            blogMembers: [],
            //users to remove from the pending queue once the changes are saved
            acceptedMembers: [],
            memberRequests: [],
            //concat of blogMembers and membership requested members
            posibleMembers: [],
            isSaved: true,
            editTeamModal: false,
            forms: {},
            preview: {},
            progress: {width: 0},
            tab: false,
            // by default themes are not accepting embed multi height and code.
            embedMultiHight: false,
            userNotInMembers:function(user) {
                for (var i = 0; i < vm.members.length; i ++) {
                    if (user._id === vm.members[i]._id) {
                        return false;
                    }
                }
                return true;
            },
            openUploadModal: function() {
                vm.uploadModal = true;
            },
            closeUploadModal: function() {
                vm.uploadModal = false;
                vm.preview = {};
                vm.progress = {width: 0};
            },
            changeTab: function(tab) {
                if (vm.tab) {
                    vm.forms.dirty = vm.forms.dirty || vm.forms[vm.tab].$dirty;
                }
                vm.tab = tab;
            },
            setFormsPristine: function() {
                if (vm.forms.dirty) {
                    vm.forms.dirty = false;
                }
                angular.forEach(vm.forms, function(value, key) {
                    if (vm.forms[key] && vm.forms[key].$dirty) {
                        vm.forms[key].$setPristine();
                    }
                });
            },
            removeImage: function() {
                modal.confirm(gettext('Are you sure you want to remove the blog image?')).then(function() {
                    deregisterPreventer();
                    vm.newBlog.picture_url = null;
                    vm.forms.dirty = true;
                });
            },
            upload: function(config) {
                var form = {};
                if (config.img) {
                    form.media = config.img;
                } else if (config.url) {
                    form.URL = config.url;
                } else {
                    return;
                }
                // return a promise of upload which will call the success/error callback
                return api.archive.getUrl().then(function(url) {
                    return upload.start({
                        method: 'POST',
                        url: url,
                        data: form
                    })
                    .then(function(response) {
                        if (response.data._status === 'ERR'){
                            return;
                        }
                        var picture_url = response.data.renditions.viewImage.href;
                        vm.newBlog.picture_url = picture_url;
                        vm.newBlog.picture = response.data._id;
                        vm.uploadModal = false;
                        vm.preview = {};
                        vm.progress = {width: 0};
                        vm.forms.dirty = true;
                    }, null, function(progress) {
                        vm.progress.width = Math.round(progress.loaded / progress.total * 100.0);
                    });
                });
            },
            saveAndClose: function() {
                vm.save().then(function() {
                    vm.close();
                });
            },
            editTeam: function() {
                vm.blogMembers = _.clone(vm.members);
                vm.posibleMembers = vm.blogMembers.concat(vm.memberRequests);
                //close the change owner dropdown if open
                if (vm.openOwner === true) {
                    vm.openOwner = false;
                }
                vm.editTeamModal = true;
            },
            cancelTeamEdit: function() {
                vm.editTeamModal = false;
            },
            doneTeamEdit: function() {
                vm.members = _.clone(vm.blogMembers);
                vm.forms.dirty = true;
                vm.cancelTeamEdit();
            },
            addMember: function(user) {
                vm.blogMembers.push(user);
            },
            acceptMember: function(user) {
                vm.members.push(user);
                vm.forms.dirty = true;
                vm.memberRequests.splice(vm.memberRequests.indexOf(user), 1);
                vm.acceptedMembers.push(user);
            },
            removeMember: function(user) {
                vm.blogMembers.splice(vm.blogMembers.indexOf(user), 1);
            },
            save: function() {
                // save on backend
                var deferred = $q.defer();
                var members = _.map(vm.members, function(member) {
                    return ({user: member._id});
                });
                notify.info(gettext('saving blog settings'));
                var changedBlog = {
                    blog_preferences: vm.blogPreferences,
                    original_creator: vm.original_creator._id,
                    blog_status: vm.blog_switch === true? 'open': 'closed',
                    syndication_enabled: vm.syndication_enabled,
                    members: members
                };
                angular.extend(vm.newBlog, changedBlog);
                delete vm.newBlog._latest_version;
                delete vm.newBlog._current_version;
                delete vm.newBlog._version;
                delete vm.newBlog.marked_for_not_publication;
                blogService.update(vm.blog, vm.newBlog).then(function(blog) {
                    vm.isSaved = true;
                    vm.blog = blog;
                    vm.newBlog = angular.copy(blog);
                    vm.blogPreferences = angular.copy(blog.blog_preferences);
                    //remove accepted users from the queue
                    if (vm.acceptedMembers.length) {
                        _.each(vm.acceptedMembers, function(member) {
                            api('request_membership').getById(member.request_id).then(function(item) {
                                api('request_membership').remove(item).then(function() {}, function() {
                                    notify.pop();
                                    notify.error(gettext('Something went wrong'));
                                    deferred.reject();
                                });
                            });
                        });
                    }
                    notify.pop();
                    notify.info(gettext('blog settings saved'));
                    vm.setFormsPristine();
                    deferred.resolve();
                });
                return deferred.promise;
            },
            askRemoveBlog: function() {
                modal.confirm(gettext('Are you sure you want to delete the blog?'))
                .then(function() {
                    vm.removeBlog();
                });
            },
            removeBlog: function() {
                api.blogs.remove(angular.copy(vm.blog)).then(function(message) {
                    notify.pop();
                    notify.info(gettext('Blog removed'));
                    $location.path('/liveblog');
                }, function () {
                    notify.pop();
                    notify.error(gettext('Something went wrong'));
                    $location.path('/liveblog/edit/' + vm.blog._id);
                    });
            },
            close: function() {
                // return to blog edit page
                $location.path('/liveblog/edit/' + vm.blog._id);
            },
            buildOwner: function(userID) {
                api('users').getById(userID).then(function(data) {
                    //temp_selected_owner is used handle the selection of users in the change owner autocomplete box
                    //without automatically changing the owner that is displayed
                    vm.temp_selected_owner = vm.original_creator = data;
                });
            },
            getUsers: function(details, ids) {
                _.each(ids, function(user) {
                    api('users').getById(user.user).then(function(data) {
                        if (user.request_id) {
                            data.request_id = user.request_id;
                        }
                        details.push(data);
                    });
                });
            }

        });
        // retieve the blog's public url
        var qPublicUrl = blogService.getPublicUrl(blog).then(function(url) {
            vm.publicUrl = url;
        });
        // load available languages
        api('languages').query().then(function(data) {
            vm.availableLanguages = data._items;
        });
        // load available themes
        var qTheme = api('themes').query().then(function(data) {
            // filter theme with label (without label are `generic` from inheritance)
            vm.angularTheme = data._items.find(function(theme) {return theme.name == 'angular'});
            vm.availableThemes = data._items.filter(function(theme) {return !theme['abstract'];});
            vm.selectedTheme = _.find(vm.availableThemes, function(theme) {
                return theme.name === vm.blogPreferences.theme;
            });
        });

        // after publicUrl and theme is on `vm` object we can compute embeds code.
        $q.all([qPublicUrl, qTheme]).then(function() {
            vm.embedMultiHight = true;
            // devel link
            var parentIframe = 'http://localhost:5000/themes_assets/angular/';
            if (vm.angularTheme.public_url) {
                // production link
                parentIframe = vm.angularTheme.public_url.replace(/\/[0-9\.]+\/themes_assets\//, '/themes_assets/');
            }
            // loading mechanism, and load parent-iframe.js with callback.
            var loadingScript = '<script type="text/javascript">var liveblog={load:function(e,t){var a=document,l=a.createElement("script"),'
            + 'o=a.getElementsByTagName("script")[0];return l.type="text/javascript",l.onload=t,l.async=!0,l.src=e,o.parentNode.insertBefore(l,o),'
            + 'l}};liveblog.load("' + parentIframe + 'parent-iframe.js?"+parseInt(new Date().getTime()/900000,10),function(){"function"==typeof '
            + 'liveblog.loadCallback&&liveblog.loadCallback()});</script>';
            // compute embeds code with the injected publicUrl
            vm.embeds = {
                normal: '<iframe width="100%" height="715" src="' + vm.publicUrl + '" frameborder="0" allowfullscreen></iframe>',
                resizeing: loadingScript + '<iframe id="liveblog-iframe" width="100%" scrolling="no" src="' + vm.publicUrl + '" frameborder="0" allowfullscreen></iframe>'
            };
        });

        api('users').getById(blog.original_creator).then(function(data) {
            vm.original_creator = data;
        });
        api('users').query().then(function(data) {
            vm.avUsers = data._items;
        });
        vm.buildOwner(blog.original_creator);

        //get details for the users that have requested blog membership
        vm.memberRequests = [];
        api('blogs/<regex("[a-f0-9]{24}"):blog_id>/request_membership', {_id: vm.blog._id}).query().then(function(data) {
            vm.getUsers(vm.memberRequests, _.map(data._items, function(request) {
                return {user: request.original_creator, request_id: request._id};
            }));
        });

        //get team members details
        vm.members = [];
        vm.getUsers(vm.members, blog.members);

        //check if form is dirty before leaving the page
        var deregisterPreventer = $scope.$on('$locationChangeStart', routeChange);
        function routeChange (event, next, current) {
            //check if one of the forms is dirty
            var dirty = false;
            if (vm.forms.dirty) {
                dirty = true;
            } else {
                angular.forEach(vm.forms, function(value, key) {
                    if (vm.forms[key] && vm.forms[key].$dirty) {
                        dirty = true;
                        return;
                    }
                });
            }
            if (dirty) {
                event.preventDefault();
                modal.confirm(gettext('You have unsaved settings. Are you sure you want to leave the page?')).then(function() {
                    deregisterPreventer();
                    $location.url($location.url(next).hash());
                });
            }
        }
        vm.changeTab('general');
        vm.blog_switch = vm.newBlog.blog_status === 'open'? true: false;
        vm.syndication_enabled = vm.newBlog.syndication_enabled;
    }
    BlogSettingsController.$inject = ['$scope', 'blog', 'api', 'blogService', '$location', 'notify',
        'gettext', 'modal', '$q', 'upload'];
    return BlogSettingsController;
});
