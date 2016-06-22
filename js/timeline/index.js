'use strict';
var angular = require('angular')
  , pageview = require('../pageview')
  , _ = require('../lodash-custom')
  ;

angular.module('theme')
.controller('TimelineCtrl', [
    '$interval',
    '$anchorScroll',
    '$timeout',
    'blogs',
    'config',
    'transformBlog',
    'PagesManager',
    'Permalink',
    TimelineCtrl]);


function TimelineCtrl($interval, $anchorScroll, $timeout, blogsService, config, transformBlog, PagesManager, Permalink) {
    var POSTS_PER_PAGE = config.settings.postsPerPage;
    var STICKY_POSTS_PER_PAGE = 100;
    var PERMALINK_DELIMITER = config.settings.permalinkDelimiter || '?';
    var DEFAULT_ORDER = config.settings.postOrder; // newest_first, oldest_first or editorial
    var UPDATE_MANUALLY = config.settings.loadNewPostsManually;
    var UPDATE_EVERY = 10*1000; // retrieve update interval in millisecond
    
    var vm = this;
    var pagesManager = new PagesManager(POSTS_PER_PAGE, DEFAULT_ORDER, false),
        permalink = new Permalink(pagesManager, PERMALINK_DELIMITER);

    var stickyPagesManager = new PagesManager(STICKY_POSTS_PER_PAGE, DEFAULT_ORDER, true),
        stickyPermalink = new Permalink(stickyPagesManager, PERMALINK_DELIMITER);

    function retrieveUpdate() {
        return vm.pagesManager.retrieveUpdate(!UPDATE_MANUALLY).then(function(data) {
            vm.newPosts = data._items;
        });
    }

    function retrieveStickyUpdate() {
        return vm.stickyPagesManager.retrieveUpdate(!UPDATE_MANUALLY).then(function(data) {
            vm.newStickyPosts = data._items;
        });
    }

    function retrieveBlogSettings() {
        blogsService.get({}, function(blog) {
            angular.extend(vm.blog, blog);
        });
    }
    
    // define view model
    angular.extend(vm, {
        templateDir: config.assets_root,
        blog: transformBlog(config.blog),
        loading: true,
        finished: false,
        highlightsOnly: false,
        settings: config.settings,
        newPosts: [],
        newStickyPosts: [],
        orderBy: function(order_by) {
            vm.loading = true;
            vm.finished = false;
            vm.pagesManager.changeOrder(order_by).then(function() {
                vm.loading = false;
            });
        },

        fetchNewPage: function() {
            vm.loading = true;
            vm.stickyPagesManager.fetchNewPage();
            return vm.pagesManager.fetchNewPage().then(function(data){
                var num_posts_loaded = data._meta.max_results * vm.pagesManager.pages.length;
                vm.finished = data._meta.total <= num_posts_loaded;
                vm.loading = false; // fires css transitions
                vm.triggerPageview(); // analytics
            });
        },

        getAllPosts: function() {
            /* Consolidate posts and stickies
            into one feed as to avoid redundant HTML and additional
            requests from directive template requests */

            return [].concat.apply([], [
                this.stickyPagesManager.allPosts(),
                this.pagesManager.allPosts()
                ]);
        },

        permalinkScroll: function() {
            vm.loading = true;
            vm.permalink.loadPost().then(function(id) {
                $anchorScroll(id);
                vm.loading = false;
            }, function() {
                vm.loading = false;
            });
        },

        isAllowedToLoadMore: function() {
            return !vm.loading && !vm.finished;
        },

        applyUpdates: function() {
            pagesManager.applyUpdates(vm.newPosts);
            vm.newPosts = [];
            stickyPagesManager.applyUpdates(vm.newStickyPosts);
            vm.newStickyPosts = [];
        },

        toggleHighlighsOnly: function() {
            vm.highlightsOnly = !vm.highlightsOnly;
            vm.finished = false;

            pagesManager.changeHighlight(vm.highlightsOnly);
            stickyPagesManager.changeHighlight(vm.highlightsOnly).then(function(data) {
                vm.finished = data._meta.total <= data._meta.max_results * data._meta.page;
            });

            if (vm.highlightsOnly) stickyPagesManager.hideSticky = false;
        },

        triggerPageview: function() {
            var event = new Event("sendpageview");
            window.dispatchEvent(event);
        },

        pagesManager: pagesManager,
        permalink: permalink,
        stickyPagesManager: stickyPagesManager,
        stickyPermalink: stickyPermalink
    });

    // retrieve first page
    vm.fetchNewPage()
    // retrieve updates periodically
    .then(function() {
        vm.permalinkScroll();
        $interval(retrieveUpdate, UPDATE_EVERY);
        $interval(retrieveStickyUpdate, UPDATE_EVERY);
        $interval(retrieveBlogSettings, 3 * UPDATE_EVERY);
        // listen events from parent
        var fetchNewPageDebounced = _.debounce(vm.fetchNewPage, 1000);
        function receiveMessage(event) {
            if (event.data === 'loadMore') {
                fetchNewPageDebounced();
            }
        }
        window.addEventListener('message', receiveMessage, false);
    });

    window.timeline = this;
}