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

import './../../ng-sir-trevor';
import './../../sir-trevor-blocks';
import './../unread.posts.service';
import {DELETED_STATE} from '../../liveblog-bloglist/controllers/constants';

import outputEmbedCodeTpl from 'scripts/liveblog-edit/views/output-embed-code-modal.ng1';
import {EventNames} from 'liveblog-common/constants';


BlogSettingsController.$inject = [
    '$scope',
    'blog',
    'api',
    'blogService',
    '$location',
    'notify',
    'gettext',
    'modal',
    '$q',
    'datetimeHelper',
    'config',
    'blogSecurityService',
    'moment',
    'superdesk',
    '$rootScope',
    '$routeParams',
    'postsService',
    'featuresService',
];

function BlogSettingsController(
    $scope,
    blog,
    api,
    blogService,
    $location,
    notify,
    gettext,
    modal,
    $q,
    datetimeHelper,
    config,
    blogSecurityService,
    moment,
    superdesk,
    $rootScope,
    $routeParams,
    postsService,
    featuresService
) {
    // set view's model
    /* eslint consistent-this: ["error", "vm"]*/
    const vm = this;

    $rootScope.$on('blog', (e, data) => {
        if (data.blog_id === vm.blog._id && data.published === 1) {
            // update the blog property
            vm.blog.public_urls = data.public_urls;
        }
    });

    function doOrAskBeforeIfExceedsPostsLimit($scope) {
        var deferred = $q.defer();
        let count = (vm.blog.total_posts - vm.newBlog.posts_limit);

        if (vm.newBlog.posts_limit !== 0 && count > 0) {
            modal
                .confirm(gettext(`You will lose the oldest posts beyond
                    set limit. Are you sure to continue?`))
                .then(deferred.resolve, deferred.reject);
        } else {
            deferred.resolve();
        }
        return deferred.promise;
    }

    function deleteOldPosts() {
        let count = (vm.blog.total_posts - vm.newBlog.posts_limit);

        if (vm.newBlog.posts_limit !== 0 && count > 0) {
            postsService.getPosts(vm.blog._id, {excludeDeleted: true, sticky: false, highlight: false})
                .then((posts) => {
                    let deleted = {deleted: true};
                    let filteredPosts = posts._items.slice(Math.max(posts._items.length - count));

                    angular.forEach(filteredPosts, (post) => {
                        postsService.savePost(post.blog, post, [], deleted)
                            .then((message) => {
                                $rootScope.$broadcast(EventNames.RemoveTimelinePost, {post: post});
                                notify.info(gettext('Wait! Deleting old posts'));
                            }, () => {
                                notify.error(gettext('Something went wrong'));
                            });
                    });
                });
        }
    }

    function mergeDateAndTime(date, time, defaultDateTime = null) {
        if (date && time) {
            return datetimeHelper.mergeDateTime(date, time) +
                moment.tz(config.defaultTimezone).format('Z');
        }

        return defaultDateTime;
    }

    // make sure to remove duplicated members
    blog.members = _.uniqBy(blog.members, 'user');

    angular.extend(vm, {
        mailto: 'mail:upgrade@liveblog.pro?subject=' +
            encodeURIComponent(location.hostname) +
            ' ' +
            config.subscriptionLevel,
        blog: blog,
        newBlog: angular.copy(blog),
        isThemeSelectorEnabled: featuresService.isEnabled('change_blog_theme'),
        blogPreferences: angular.copy(blog.blog_preferences),
        consumersSettings: angular.copy(blog.consumers_settings),
        availableLanguages: [],
        original_creator: {},
        availableThemes: [],
        availableCategories: [
            '',
            'Breaking News',
            'Entertainment',
            'Business and Finance',
            'Sport',
            'Technology',
            'Politics',
            'Others',
        ],
        availablePostlimit: [
            {text: 'No restriction', value: 0},
            {text: 100, value: 100},
            {text: 500, value: 500},
            {text: 1000, value: 1000},
            {text: 2000, value: 2000},
            {text: 3000, value: 3000},
        ],
        canCommentOptions: [
            {text: 'Unset', value: 'unset'},
            {text: 'Enabled', value: 'enabled'},
            {text: 'Disabled', value: 'disabled'},
        ],
        timezoneOptions: [
            {text: 'GMT−12', value: -12},
            {text: 'GMT−11', value: -11},
            {text: 'GMT−10', value: -10},
            {text: 'GMT−9', value: -9},
            {text: 'GMT−8', value: -8},
            {text: 'GMT−7', value: -7},
            {text: 'GMT−6', value: -6},
            {text: 'GMT−5', value: -5},
            {text: 'GMT−4', value: -4},
            {text: 'GMT−3', value: -3},
            {text: 'GMT−2', value: -2},
            {text: 'GMT−1', value: -1},
            {text: 'GMT+0 (UTC)', value: 0},
            {text: 'GMT+1', value: 1},
            {text: 'GMT+2', value: 2},
            {text: 'GMT+3', value: 3},
            {text: 'GMT+4', value: 4},
            {text: 'GMT+5', value: 5},
            {text: 'GMT+6', value: 6},
            {text: 'GMT+7', value: 7},
            {text: 'GMT+8', value: 8},
            {text: 'GMT+9', value: 9},
            {text: 'GMT+10', value: 10},
            {text: 'GMT+11', value: 11},
            {text: 'GMT+12', value: 12},
            {text: 'GMT+13', value: 13},
            {text: 'GMT+14', value: 14},
        ],
        // used as an aux var to be able to change members and safely cancel the changes
        blogMembers: [],
        // users to remove from the pending queue once the changes are saved
        acceptedMembers: [],
        memberRequests: [],
        // concat of blogMembers and membership requested members
        posibleMembers: [],
        isSaved: true,
        editTeamModal: false,
        forms: {},
        preview: {},
        progress: {width: 0},
        tab: false,
        // by default themes are not accepting embed multi height and code.
        embedMultiHight: false,
        outputs: [],
        outputEmbedCodeTpl: outputEmbedCodeTpl,
        selectedConsumer: null,
        selectedConsumerTags: [],
        showTagsSelector: true,
        onConsumerTagsChange: function(tags) {
            if (!vm.selectedConsumer) return;

            const id = vm.selectedConsumer._id;
            let settings = vm.newBlog.consumers_settings || {};

            if (id in settings) {
                settings[id].tags = tags;
            } else {
                settings[id] = {tags: tags};
            }

            vm.newBlog.consumers_settings = settings;
            vm.forms.dirty = true;
            $scope.$apply();
        },
        loadOutputs: function(silent = false) {
            if (!silent) {
                vm.outputsLoading = true;
            }
            const criteria = {
                where: JSON.stringify({
                    $and: [
                        {deleted: false},
                        {blog: vm.blog._id},
                    ],
                }),
                max_results: 500,
            };

            api('outputs').query(criteria)
                .then((data) => {
                    vm.outputs = data._items;
                    if (!silent) {
                        notify.info('Output channels loaded');
                    }
                    vm.outputsLoading = false;
                }, (data) => {
                    notify.error(gettext('There was an error getting the output channels'));
                    vm.outputsLoading = false;
                });
        },
        showOutputEmbedCode: function(output) {
            vm.outputEmbedModal = true;
            vm.output = output;
            const outputTheme = _.find(vm.availableThemes, (theme) => theme.name === vm.output.theme);

            if (outputTheme.styles && outputTheme.settings && outputTheme.settings.removeStylesESI) {
                vm.output.styleUrl = outputTheme.public_url + outputTheme.styles[outputTheme.styles.length - 1];
            }
        },
        openOutputDialog: function(output = {}) {
            vm.output = angular.copy(output);
            vm.oldOutput = angular.copy(output);

            if (vm.output.style) {
                vm.output.preview = {
                    url: vm.output.style['background-image'],
                };
            } else {
                vm.output.style = {};
            }
            vm.output.preview_logo = {};
            if (vm.output.logo_url) {
                vm.output.preview_logo.url = vm.output.logo_url;
            }
            vm.outputModalActive = true;
        },
        removeOutput: function(output, $index) {
            modal.confirm(gettext('Are you sure you want to remove this output channel?'))
                .then(() => {
                    api('outputs').save(output, {deleted: true})
                        .then((data) => {
                            vm.outputs.splice($index, 1);
                        }, (data) => {
                            notify.error(gettext('Can\'t remove output'));
                        });
                });
        },
        userNotInMembers: function(user) {
            for (let i = 0; i < vm.members.length; i++) {
                if (user._id === vm.members[i]._id) {
                    return false;
                }
            }
            return true;
        },
        openUploadModal: function() {
            superdesk.intent('upload', 'media').then((pictures) => {
                if (pictures.length === 0) {
                    return;
                }

                const firstPicture = pictures[0];

                vm.newBlog.picture_url = firstPicture.renditions.viewImage.href;
                vm.newBlog.picture = firstPicture._id;
                vm.newBlog.picture_renditions = firstPicture.renditions;
                vm.uploadModal = false;
                vm.preview = {};
                vm.progress = {width: 0};
                vm.forms.dirty = true;
            });
        },
        changeTab: function(tab) {
            // outputs and consumer does not dirty the blog settings
            const notDirty = ['outputs', 'consumers'];

            if (vm.tab && notDirty.indexOf(vm.tab) === -1) {
                vm.forms.dirty = vm.forms.dirty || vm.forms[vm.tab].$dirty;
            }
            vm.tab = tab;
        },
        setFormsPristine: function() {
            if (vm.forms.dirty) {
                vm.forms.dirty = false;
            }
            angular.forEach(vm.forms, (value, key) => {
                if (vm.forms[key] && vm.forms[key].$dirty) {
                    vm.forms[key].$setPristine();
                }
            });
        },
        removeImage: function() {
            modal.confirm(gettext('Are you sure you want to remove the blog image?')).then(() => {
                deregisterPreventer();
                vm.newBlog.picture_url = null;
                vm.forms.dirty = true;
            });
        },
        saveAndClose: function() {
            vm.save().then(() => {
                vm.close();
            });
        },
        editTeam: function() {
            vm.blogMembers = _.clone(vm.members);
            vm.posibleMembers = vm.blogMembers.concat(vm.memberRequests);
            // close the change owner dropdown if open
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
        hasReachedMembersLimit: () => featuresService.isLimitReached('blog_members', vm.blogMembers.length),
        removeMember: function(user) {
            vm.blogMembers.splice(vm.blogMembers.indexOf(user), 1);
        },
        save: function() {
            // save on backend
            const deferred = $q.defer();
            const members = _.map(vm.members, (member) => ({user: member._id}));

            notify.info(gettext('saving blog settings'));

            // Set start_date to _created if date and time are empty
            const startDate = mergeDateAndTime(vm.start_date, vm.start_time, vm.blog._created);
            const endDate = mergeDateAndTime(vm.end_date, vm.end_time);
            const changedBlog = {
                blog_preferences: vm.blogPreferences,
                original_creator: vm.original_creator._id,
                blog_status: vm.blog_switch === true ? 'open' : 'closed',
                syndication_enabled: vm.syndication_enabled,
                market_enabled: vm.market_enabled,
                category: vm.category,
                start_date: startDate,
                members: members,
                posts_limit: vm.newBlog.posts_limit,
                users_can_comment: vm.newBlog.users_can_comment,
                consumers_settings: vm.newBlog.consumers_settings,
            };

            if (endDate) {
                changedBlog.end_date = endDate;
            }

            angular.extend(vm.newBlog, changedBlog);

            delete vm.newBlog._latest_version;
            delete vm.newBlog._current_version;
            delete vm.newBlog._version;
            delete vm.newBlog.marked_for_not_publication;
            delete vm.newBlog._type;

            doOrAskBeforeIfExceedsPostsLimit($scope).then(() => {
                blogService.update(vm.blog, vm.newBlog).then((blog) => {
                    vm.isSaved = true;
                    vm.blog = blog;
                    vm.newBlog = angular.copy(blog);
                    vm.blogPreferences = angular.copy(blog.blog_preferences);
                    vm.consumersSettings = angular.copy(blog.consumers_settings);
                    // remove accepted users from the queue
                    if (vm.acceptedMembers.length) {
                        _.each(vm.acceptedMembers, (member) => {
                            api('request_membership')
                                .getById(member.request_id)
                                .then((item) => {
                                    api('request_membership')
                                        .remove(item)
                                        .then(null, () => {
                                            notify.error(gettext('Something went wrong'));
                                            deferred.reject();
                                        });
                                });
                        });
                    }
                    notify.info(gettext('blog settings saved'));
                    vm.setFormsPristine();
                    deferred.resolve();
                });

                deleteOldPosts();
            });

            return deferred.promise;
        },
        askRemoveBlog: function() {
            modal.confirm(`The blog will be in <b>Deleted Blogs</b> tab during ${config.daysRemoveDeletedBlogs}
                day(s), after that period will be removed permanently.<br /><br />
                Are you sure you want to delete this blog?`)
                .then(() => {
                    vm.removeBlog();
                });
        },
        removeBlog: function() {
            const blog = vm.blog;
            const changedBlog = {
                blog_status: DELETED_STATE.code,
            };

            let newBlog = angular.copy(blog);

            angular.extend(newBlog, changedBlog);
            delete newBlog._latest_version;
            delete newBlog._current_version;
            delete newBlog._version;
            delete newBlog.marked_for_not_publication;
            delete newBlog._type;
            delete newBlog.selected;
            delete newBlog.firstcreated;
            newBlog.original_creator = blog.original_creator._id;

            blogService.update(blog, newBlog)
                .then((resp) => {
                    notify.info(gettext('The blog will be deleted'));
                    $location.path('/liveblog');
                }, () => {
                    notify.error(gettext('Something went wrong'));
                    $location.path('/liveblog/edit/' + blog._id);
                });
        },
        close: function() {
            $location.path('/liveblog/edit/' + vm.blog._id);
        },
        buildOwner: function(userID) {
            api('users')
                .getById(userID)
                .then((data) => {
                    // temp_selected_owner is used handle the selection of users in the change owner autocomplete box
                    // without automatically changing the owner that is displayed
                    vm.temp_selected_owner = vm.original_creator = data;
                });
        },
        getUsers: function(details, ids) {
            _.each(ids, (user) => {
                api('users')
                    .getById(user.user)
                    .then((data) => {
                        if (user.request_id) {
                            data.request_id = user.request_id;
                        }
                        details.push(data);
                    });
            });
        },
    });

    // retieve the blog's public url
    const qPublicUrl = blogService.getPublicUrl(blog).then((url) => {
        vm.publicUrl = url;
    });

    // load available languages
    api('languages')
        .query()
        .then((data) => {
            vm.availableLanguages = data._items;
        });

    // load consumers
    api('consumers')
        .query()
        .then((data) => {
            vm.consumers = data._items;
        });

    // load available themes
    const qTheme = api('themes')
        .query()
        .then((data) => {
            // filter theme with label (without label are `generic` from inheritance)
            vm.angularTheme = data._items.find((theme) => theme.name === 'angular');
            vm.availableThemes = data._items.filter((theme) => !theme.abstract);
            vm.selectedTheme = _.find(vm.availableThemes, (theme) => theme.name === vm.blogPreferences.theme);
            if (vm.selectedTheme.styles) {
                vm.styleUrl = vm.selectedTheme.public_url + vm.selectedTheme.styles[vm.selectedTheme.styles.length - 1];
            }
        });

    // after publicUrl and theme is on `vm` object we can compute embeds code.
    $q.all([qPublicUrl, qTheme]).then(() => {
        vm.embedMultiHight = true;
        const embedScript = `${config.client.url}/embed.js`;

        // loading mechanism, and responsive will be handled by embed.ts
        /* eslint-disable max-len */
        vm.embeds = {
            normal: `<script src="${embedScript}" defer></script>
<iframe id="liveblog-iframe" width="100%" height="715" src="${vm.publicUrl}" frameborder="0" allowfullscreen></iframe>`,
            resizeing: `<script src="${embedScript}" defer></script>
<iframe id="liveblog-iframe" width="100%" scrolling="no" src="${vm.publicUrl}" data-responsive="yes" frameborder="0" allowfullscreen></iframe>`,
        };

        vm.esi = `<script src="${embedScript}" defer></script>
<esi:include src="${vm.publicUrl}" />`;
    });

    api('users')
        .getById(blog.original_creator)
        .then((data) => {
            vm.original_creator = data;
        });
    api('users')
        .query()
        .then((data) => {
            vm.avUsers = data._items;
        });
    vm.buildOwner(blog.original_creator);

    // get details for the users that have requested blog membership
    vm.memberRequests = [];
    api('blogs/<regex("[a-f0-9]{24}"):blog_id>/request_membership', {_id: vm.blog._id})
        .query()
        .then((data) => {
            vm.getUsers(vm.memberRequests, _.map(data._items,
                (request) => ({
                    user: request.original_creator,
                    request_id: request._id,
                })
            ));
        });

    // get team members details
    vm.members = [];
    vm.getUsers(vm.members, blog.members);
    vm.loadOutputs();

    // when an output is saved in the modal directive, reload outputs
    $scope.$on('output.saved', () => {
        // load outputs silently
        vm.loadOutputs(true);
    });

    $scope.isAdmin = blogSecurityService.isAdmin;

    // check if form is dirty before leaving the page
    const deregisterPreventer = $scope.$on('$locationChangeStart', routeChange);

    function routeChange(event, next, current) {
        // check if one of the forms is dirty
        let dirty = false;

        if (vm.forms.dirty) {
            dirty = true;
        } else {
            angular.forEach(vm.forms, (value, key) => {
                if (vm.forms[key] && vm.forms[key].$dirty) {
                    dirty = true;
                }
            });
        }
        if (dirty) {
            event.preventDefault();
            modal
                .confirm(gettext('You have unsaved settings. Are you sure you want to leave the page?'))
                .then(() => {
                    deregisterPreventer();
                    $location.url($location.url(next).hash());
                });
        }
    }

    const splitDate = datetimeHelper.splitDateTime(
        vm.newBlog.start_date,
        config.defaultTimezone
    );

    vm.start_date = splitDate.date;
    vm.start_time = splitDate.time;

    if (vm.newBlog.end_date) {
        const splitEndDate = datetimeHelper.splitDateTime(
            vm.newBlog.end_date, config.defaultTimezone);

        vm.end_date = splitEndDate.date;
        vm.end_time = splitEndDate.time;
    }

    vm.changeTab(angular.isDefined($routeParams.tab) ? $routeParams.tab : 'general');
    vm.blog_switch = vm.newBlog.blog_status === 'open';
    vm.syndication_enabled = vm.newBlog.syndication_enabled;
    vm.market_enabled = vm.newBlog.market_enabled;
    vm.category = vm.newBlog.category;

    // Deactivate status input, when too many blogs are active
    blogSecurityService.showUpgradeModal().then((showUpgradeModal) => {
        vm.deactivateStatus = vm.blog_switch ? false : showUpgradeModal;
    });

    if (!vm.newBlog.json_ld_timezone_offset) {
        vm.newBlog.json_ld_timezone_offset = 0;
    }
}

export default BlogSettingsController;
