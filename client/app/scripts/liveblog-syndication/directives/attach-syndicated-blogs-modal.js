liveblogSyndication
    .directive('lbAttachSyndicatedBlogsModal',
        ['$q', 'lodash', 'IngestPanelActions',
        function($q, _, IngestPanelActions) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/attach-syndicated-blogs-modal.html',
                scope: {
                    modalActive: '=',
                    store: '='
                },
                link: function(scope) {
                     var onProducerBlogs = function() {
                        console.log('local syndication', scope.localSyndication);
                        scope.producerBlogs._items = scope.producerBlogs._items.map(function(blog) {
                            blog.checked = (scope.localSyndication.indexOf(blog._id) != -1);
                            console.log('checked', blog.checked);
                            return blog;
                        });

                        scope.blogsToAttach = angular.copy(scope.localSyndication);

                        compare();
                    };

                    scope.store.connect(function(state) {
                        scope.producers = state.producers;
                        scope.syndicationIn = state.syndicationIn;
                        scope.producerBlogs = state.producerBlogs;
                        scope.localSyndication = state.localSyndication;
                        scope.consumerBlogId = state.consumerBlogId;

                        if (Object.keys(state.producerBlogs).length > 0)
                            onProducerBlogs();
                    });

                    IngestPanelActions.getProducers();
                    scope.blogsToAttach = [];

                    var compare = function() {
                        scope.hasChanged = angular.equals(
                            scope.localSyndication.sort(), 
                            scope.blogsToAttach.sort()
                        );
                    };

                    scope.cancel = function() {
                        scope.modalActive = false;
                    };

                    scope.selectProducer = function(producerId) {
                        console.log('syndication in', scope.syndicationIn);
                        scope.producers._items.forEach(function(producer) {
                            if (producer._id == producerId)
                                scope.currentProducer = producer;
                        });

                        IngestPanelActions.getProducerBlogs(producerId);
                    };

                    scope.check = function(blog) {
                        blog.checked = (blog.hasOwnProperty('checked')) ? !blog.checked : true;

                        if (blog.checked && scope.blogsToAttach.indexOf(blog._id) == -1)
                            scope.blogsToAttach.push(blog._id);
                        else if (!blog.checked && scope.blogsToAttach.indexOf(blog._id) != -1)
                            scope.blogsToAttach.splice(scope.blogsToAttach.indexOf(blog._id), 1);

                        compare();
                    };

                    scope.attach = function() {
                        var chain = [],
                            toSyndicate = _.difference(scope.blogsToAttach, scope.localSyndication),
                            toUnSyndicate = _.difference(scope.localSyndication, scope.blogsToAttach);


                        scope.producerBlogs._items.forEach(function (blog) {
                            if (toSyndicate.indexOf(blog._id) != -1)
                                IngestPanelActions.syndicate(
                                    scope.currentProducer,
                                    scope.consumerBlogId,
                                    blog, 
                                    'POST'
                                );
                            else if (toUnSyndicate.indexOf(blog._id) != -1)
                                IngestPanelActions.syndicate(
                                    scope.currentProducer,
                                    scope.consumerBlogId,
                                    blog, 
                                    'DELETE'
                                );
                        });

                        scope.modalActive = false;
                    };
                }
            };
        }]);
