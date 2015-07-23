(function(angular) {
    'use strict';

    TimelineCtrl.$inject = ['$interval', 'PagesManager', 'blogs', 'config', '$anchorScroll', '$timeout'];
    function TimelineCtrl($interval, PagesManager, blogsService, config, $anchorScroll, $timeout) {

        var POSTS_PER_PAGE = config.settings.postsPerPage;
        var SHOW_AUTHOR = config.settings.showAuthor;
        var DEFAULT_ORDER = 'editorial'; // newest_first, oldest_first or editorial
        var UPDATE_EVERY = 10*1000; // retrieve update interval in millisecond
        var PERMALINK_HASH = 'liveblog._id'; // the hash identifier for permalink.
        var PERMALINK_HASH_MARK = '?'; // the hasj mark identifier can be `?` or `#`.
        var vm = this;
        var href; // from where it should take the location url.
        if(document.parent) {
            // use document parent if avalible, see iframe cors limitation.
            // this also works well for direct access, testing link.
            try {
                href = document.location.href; 
            } catch(e) {
            // if not use the referrer of the iframe.
                href = document.referrer; 
            }
        } else {
            href = document.location.href; // use this option only if from server
        }

        function retrieveUpdate() {
            return vm.pagesManager.retrieveUpdate(true);
        }
        function escapeRegExp(string) {
            return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
        }
        // define view model
        angular.extend(vm, {
            templateDir: config.assets_root,
            blog: config.blog,
            loading: true,
            finished: false,
            showAuthor: SHOW_AUTHOR,
            order: DEFAULT_ORDER,
            orderBy: function(order_by) {
                vm.order = order_by;
                vm.loading = true;
                vm.finished = false;
                vm.pagesManager.changeOrder(order_by).then(function() {
                    vm.loading = false;
                });
            },
            fetchNewPage: function() {
                vm.loading = true;
                return vm.pagesManager.fetchNewPage().then(function(data){
                    vm.loading = false;
                    vm.finished = data._meta.total <= data._meta.max_results;
                    // TODO: notify updates
                });
            },
            isAllowedToLoadMore: function() {
                return !vm.loading && !vm.finished;
            },
            getPermalink: function(id) {
                var permalink = false,
                    newHash = PERMALINK_HASH + '=' + id + '->' + vm.order;

                if (href.indexOf(PERMALINK_HASH_MARK) === -1) {
                    permalink = href + PERMALINK_HASH_MARK + newHash;
                } else if (href.indexOf(PERMALINK_HASH + '=') !== -1) {
                    var regexHash = new RegExp(escapeRegExp(PERMALINK_HASH) + '=[^&#]*');
                    permalink = href.replace(regexHash, newHash);
                } else {
                    permalink = href + '&' + newHash;
                }
                return permalink;
            },
            initPermalink: function() {
                var matches, 
                    regexHash = new RegExp(escapeRegExp(PERMALINK_HASH) + '=([^&#]*)'),
                    matches = href.match(regexHash);
                if(matches) {
                    var arr = decodeURIComponent(matches[1]).split('->');
                    vm.permalinkId = arr[0];
                    vm.order = arr[1];
                    vm.pagesManager.setSort(vm.order);
                }
            },
            scrollToPermalink: function() {
                if(!vm.permalinkId) {
                    return;
                }
                var posts = vm.pagesManager.allPosts(),
                    found = false;
                angular.forEach(posts, function(post) {
                    if(post._id === vm.permalinkId) {
                        found = true;
                    }
                });
                if (!found && vm.isAllowedToLoadMore()) {
                    vm.fetchNewPage().then(function() {
                        vm.scrollToPermalink();
                    });
                } else if(found) {
                    $timeout(function(){
                        $anchorScroll(vm.permalinkId);                        
                    });
                }
            },
            pagesManager: new PagesManager(POSTS_PER_PAGE, DEFAULT_ORDER)
        });

        // initialize permalink if any.
        vm.initPermalink();
        // retrieve first page
        vm.fetchNewPage()
        // retrieve updates periodically
        .then(function() {
            vm.scrollToPermalink();
        })
        .then(function() {
            $interval(retrieveUpdate, UPDATE_EVERY);
        });
    }

    angular.module('theme', ['liveblog-embed', 'ngAnimate', 'infinite-scroll'])
        .controller('TimelineCtrl', TimelineCtrl);
    angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 1000);

})(angular);
