(function(angular) {
    'use strict';
    TimelineCtrl.$inject = ['$interval', 'PagesManager', 'blogs', 'config', '$anchorScroll', '$timeout', 'Permalink', 'transformBlog', 'gettext', 'outputs'];
    function TimelineCtrl($interval, PagesManager, blogsService, config, $anchorScroll, $timeout, Permalink, transformBlog, gettext, outputsService) {

        var POSTS_PER_PAGE = config.settings.postsPerPage;
        var STICKY_POSTS_PER_PAGE = 100;
        var PERMALINK_DELIMITER = config.settings.permalinkDelimiter || '?';
        var DEFAULT_ORDER = config.settings.postOrder; // newest_first, oldest_first or editorial
        var UPDATE_MANUALLY = config.settings.loadNewPostsManually;
        var UPDATE_STICKY_MANUALLY = typeof config.settings.loadNewStickyPostsManually === 
        'boolean' ? config.settings.loadNewStickyPostsManually : config.settings.loadNewPostsManually;
        var UPDATE_EVERY = 10*1000; // retrieve update interval in millisecond
        var vm = this;
        var pagesManager = new PagesManager(POSTS_PER_PAGE, DEFAULT_ORDER, false),
            permalink = new Permalink(pagesManager, PERMALINK_DELIMITER);

        var stickyPagesManager = new PagesManager(STICKY_POSTS_PER_PAGE, DEFAULT_ORDER, true),
            stickyPermalink = new Permalink(stickyPagesManager, PERMALINK_DELIMITER);

        function retrieveUpdate() {
            return vm.pagesManager.retrieveUpdate().then(function(data) {
                vm.newPosts = vm.newPosts.concat(vm.pagesManager.processUpdates(data, !UPDATE_MANUALLY));
                vm.newStickyPosts = vm.newStickyPosts.concat(vm.stickyPagesManager.processUpdates(data, !UPDATE_STICKY_MANUALLY));
            });
        }

        function retrieveBlogSettings() {
            blogsService.get({}, function(blog) {
                if(blog.blog_status === 'closed') {
                    $interval.cancel(vm.interval.posts);
                    $interval.cancel(vm.interval.blog);
                }
                angular.extend(vm.blog, blog);
            });

            if (config.output && config.output._id) {
                outputsService.get({id: config.output._id}, function(output) {
                    if (!angular.equals(config.output, output)) {
                        config.output = output;
                        applyOutputStyle();
                    }
                })
            }
        }

        function fixBackgroundImage(style) {
            if (style['background-image']) {
                style['background-image'] = 'url(' + style['background-image'] + ')';
            }
        }

        function applyOutputStyle() {
            if (config.output && config.output.style) {
                fixBackgroundImage(config.output.style);
                $('body').css(config.output.style);
            }
            
        }

        applyOutputStyle();

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
            sortOptions: [{
                name: gettext('Editorial'),
                order: 'editorial'
            }, {
                name: gettext('Newest first'),
                order: 'newest_first'
            }, {
                name: gettext('Oldest first'),
                order: 'oldest_first'
            }],
            orderBy: function(order_by) {
                //remove leftover hash from photoswipe that was causing the slideshow to start on reorder
                if(window.location.hash) {
                    window.location.hash = window.location.hash.replace(/&gid=[^&]+/g,'').replace(/&pid=[^&]+/g, '');
                }
                vm.loading = true;
                vm.finished = false;
                vm.pagesManager.changeOrder(order_by).then(function(data) {
                    vm.loading = false;
                    vm.finished = data._meta.total <= data._meta.max_results * data._meta.page;
                });
            },
            fetchNewPage: function() {
                vm.loading = true;
                return vm.pagesManager.fetchNewPage().then(function(data){
                    vm.loading = false;
                    vm.finished = data._meta.total <= data._meta.max_results * data._meta.page;
                    // TODO: notify updates
                });
            },
            permalinkScroll: function() {
                vm.loading = true;
                vm.permalink.loadPost().then(function(id){
                    $anchorScroll(id);
                    vm.loading = false;
                }, function(){
                    vm.loading = false;
                });
            },
            isAllowedToLoadMore: function() {
                return !vm.loading && !vm.finished;
            },
            applyUpdates: function() {
                pagesManager.applyUpdates(vm.newPosts, true);
                vm.newPosts = [];
                stickyPagesManager.applyUpdates(vm.newStickyPosts, true);
                vm.newStickyPosts = [];
            },
            toggleHighlighsOnly: function() {
                vm.highlightsOnly = !vm.highlightsOnly;
                vm.loading = true;
                vm.finished = false;
                stickyPagesManager.changeHighlight(vm.highlightsOnly);
                pagesManager.changeHighlight(vm.highlightsOnly).then(function(data) {
                    vm.loading = false;
                    vm.finished = data._meta.total <= data._meta.max_results * data._meta.page;
                });
                if (vm.highlightsOnly) {
                    stickyPagesManager.hideSticky = false;
                }
            },
            pagesManager: pagesManager,
            permalink: permalink,
            stickyPagesManager: stickyPagesManager,
            stickyPermalink: stickyPermalink
        });
        //get the first sticky page only once
        vm.stickyPagesManager.fetchNewPage();
        // retrieve regular first page
        vm.fetchNewPage()
        // retrieve updates periodically
        .then(function() {
            vm.permalinkScroll();
            if(vm.blog.blog_status !== 'closed') {
                vm.interval = {
                    posts: $interval(retrieveUpdate, UPDATE_EVERY),
                    blog: $interval(retrieveBlogSettings, 3 * UPDATE_EVERY)
                };
            }
            // listen events from parent
            var fetchNewPageDebounced = _.debounce(vm.fetchNewPage, 1000);
            function receiveMessage(event) {
                if (event.data === 'loadMore') {
                    fetchNewPageDebounced();
                }
            }
            window.addEventListener('message', receiveMessage, false);
        });
    }
    
    function GalleryCtrl() {
        var vm = this;
        // Filter posts getting only images
        var _images = _.filter(vm.items, function(item) {
            return item.item_type === 'image';
        });
        vm.images = _.each(_images, function(item) {
            var credit = item.meta.credit;
            var caption = item.meta.caption;
            caption = caption ? '"' + caption + '"': caption;
            var full_caption = credit ? caption + ' by ' + credit : caption;
            item.meta.full_caption = full_caption;
        });
    }

    PostsCtrl.$inject = ['config'];
    function PostsCtrl(config) {

        var vm = this;
        var all_posts = vm.posts();
        vm.showGallery = function(post) {
            var no = 0;
            angular.forEach(post.items, function(item) {
                if (item.item_type === 'image') {
                    no++;
                }
            });
            return (no > 1) && vm.timeline.settings.showGallery;
        }

        vm.isAd = function(post) {
            return (post.mainItem.item_type.indexOf('Advertisement') !== -1) ||
                    post.mainItem.item_type.indexOf('Advertisment') !== -1
        }
        vm.all_posts = all_posts;
    }

    angular.module('theme', ['liveblog-embed', 'ngAnimate', 'infinite-scroll', 'gettext'])
        // `assets_simplified_path` is set to work with the simplified assets path.
        .constant('assets_simplified_path', true)
        .run(['gettextCatalog', 'config', function (gettextCatalog, config) {
            gettextCatalog.setCurrentLanguage(config.settings.language);
            // moment js uses a diffrent country code for Norks
            // added a mapper for this, internal Norks is `no` and for moment is `nn`.
            var momentMapper = { 'no': 'nn' },
                momentLanguage = config.settings.language;
            if (momentMapper[momentLanguage]) {
                momentLanguage = momentMapper[momentLanguage];
            }
            moment.locale(momentLanguage);
        }])
        .run(['$rootScope', function($rootScope){
            angular.element(document).on("click", function(e) {
                $rootScope.$broadcast("documentClicked", angular.element(e.target));
            });
        }])
        .controller('TimelineCtrl', TimelineCtrl)
        .controller('PostsCtrl', PostsCtrl)
        .controller('GalleryCtrl', GalleryCtrl)
        .directive('lbItem', ['asset', function(asset) {
            return {
                restrict: 'AE',
                scope: {
                    ident: '=',
                    item: '=',
                    gallery: '='
                },
                templateUrl: asset.templateUrl('views/item.html'),
            }
        }])
        .directive('lbAuthor', ['asset', function(asset) {
            return {
                restrict: 'AE',
                scope: {
                    item: '=',
                    timeline: '='
                },
                templateUrl: asset.templateUrl('views/author.html'),
            }
        }])
        .directive('lbPosts', ['asset', function(asset) {
            return {
                restrict: 'E',
                scope: true,
                bindToController: {
                    posts: '=',
                    timeline: '='
                },
                controller: PostsCtrl,
                controllerAs: 'ctrl',
                templateUrl: asset.templateUrl('views/posts.html'),
            }
        }])
        .directive('lbGallery', ['asset', function(asset) {
            return {
                restrict: 'AE',
                scope: {
                    items: '='
                },
                bindToController: true,
                controller: GalleryCtrl,
                controllerAs: 'gallery',
                templateUrl: asset.templateUrl('views/gallery.html'),
                link: function(scope, element, attrs, parentController) {
                    var slideSelector = 'img';
                    var slideOptions = {
                        showHideOpacity: true,
                        getThumbBoundsFn: false,
                        //temp disable of photoswipe sharing
                        shareButtons:[]
                    };
                    var justifiedGalleryOptions = {
                        margins: 3
                    };
                    scope.$watch(attrs.items, function(value) {
                        setTimeout(function() {
                            var el = angular.element(element).find('.gallery');
                            $(el[0]).justifiedGallery(justifiedGalleryOptions).on('jg.complete', function() {
                                $(this).photoSwipe(slideSelector, slideOptions);
                            });
                            $(el[0]).on('click', '.caption', function(e) {
                                //redirect click action from the caption to the image to fix photoswipe bug
                                e.preventDefault();
                                $(this).parent().find('img').click();
                            });
                        }, 100);
                    });
                }
            }
        }]);
    angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 1000);

})(angular);
