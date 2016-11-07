liveblogSyndication
    .directive('lbAttachSyndicatedBlogsModal',
        ['$q', 'lodash', 'IngestPanelActions', function($q, _, IngestPanelActions) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/attach-syndicated-blogs-modal.html',
                scope: {
                    store: '='
                },
                link: function(scope) {
                    scope.store.connect(function(state) {
                        scope.producers = state.producers;
                        scope.syndicationIn = state.syndicationIn;
                        scope.producerBlogs = state.producerBlogs;
                        scope.consumerBlogId = state.consumerBlogId;
                        scope.localProducerBlogIds = state.localProducerBlogIds;
                        scope.modalActive = state.modalActive;

                        if (Object.keys(state.producerBlogs).length > 0) {
                            scope.blogsToAttach = angular.copy(scope.localProducerBlogIds);
                            compare();
                        }
                    });

                    IngestPanelActions.getProducers();
                    scope.blogsToAttach = [];

                    var compare = function() {
                        scope.hasChanged = angular.equals(
                            scope.localProducerBlogIds.sort(), 
                            scope.blogsToAttach.sort()
                        );
                    };

                    scope.cancel = function() {
                        IngestPanelActions.toggleModal(false);
                    };

                    scope.selectProducer = function(producerId) {
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
                            toSyndicate = _.difference(
                                scope.blogsToAttach, 
                                scope.localProducerBlogIds
                            ),
                            toUnSyndicate = _.difference(
                                scope.localProducerBlogIds, 
                                scope.blogsToAttach
                            );

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

                        IngestPanelActions.toggleModal(false);
                    };
                }
            };
        }]);
