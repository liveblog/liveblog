import attachSyndicatedBlogsModalTpl from 'scripts/liveblog-syndication/views/attach-syndicated-blogs-modal.html';

attachSyndicatedBlogsModal.$inject = ['$q', 'lodash', 'IngestPanelActions'];

export default function attachSyndicatedBlogsModal($q, _, IngestPanelActions) {
    return {
        templateUrl: attachSyndicatedBlogsModalTpl,
        scope: {
            store: '='
        },
        link: function(scope) {
            scope.actionName = 'Attach';

            scope.store.connect((state) => {
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

                var toSyndicate = _.difference(
                        scope.blogsToAttach,
                        scope.localProducerBlogIds
                    ),
                    toUnSyndicate = _.difference(
                        scope.localProducerBlogIds,
                        scope.blogsToAttach
                    );

                if (toSyndicate.length > 0 && toUnSyndicate.length === 0) {
                    scope.actionName = 'Attach';
                } else if (toSyndicate.length === 0 && toUnSyndicate.length > 0) {
                    scope.actionName = 'Detach';
                } else if (!scope.hasChanged) {
                    scope.actionName = 'Attach/Detach';
                } else {
                    scope.actionName = 'Attach';
                }
            };

            scope.cancel = function() {
                IngestPanelActions.toggleModal(false);
            };

            scope.selectProducer = function(producerId) {
                scope.producers._items.forEach((producer) => {
                    if (producer._id === producerId) {
                        scope.currentProducer = producer;
                    }
                });

                IngestPanelActions.getProducerBlogs(producerId);
            };

            scope.refreshBlogList = function() {
                IngestPanelActions
                    .getProducerBlogs(scope.currentProducer._id);
            };

            scope.isAlreadySyndicated = function(blog) {
                if (scope.localProducerBlogIds.length === 0) {
                    return false;
                }

                return scope.localProducerBlogIds.indexOf(blog._id) !== -1;
            };

            scope.check = function(blog) {
                blog.checked = blog.hasOwnProperty('checked') ? !blog.checked : true;

                if (blog.checked && scope.blogsToAttach.indexOf(blog._id) === -1) {
                    scope.blogsToAttach.push(blog._id);
                } else if (!blog.checked && scope.blogsToAttach.indexOf(blog._id) !== -1) {
                    scope.blogsToAttach.splice(scope.blogsToAttach.indexOf(blog._id), 1);
                }

                compare();
            };

            scope.attach = function() {
                let toSyndicate = _.difference(
                        scope.blogsToAttach,
                        scope.localProducerBlogIds
                    ),
                    toUnSyndicate = _.difference(
                        scope.localProducerBlogIds,
                        scope.blogsToAttach
                    );

                scope.producerBlogs._items.forEach((blog) => {
                    var params = {
                        producerId: scope.currentProducer._id,
                        producerBlogId: blog._id,
                        consumerBlogId: scope.consumerBlogId,
                        autoPublish: blog.auto_publish,
                        autoRetrieve: blog.auto_retrieve,
                        method: 'POST'
                    };

                    if (toSyndicate.indexOf(blog._id) !== -1) {
                        IngestPanelActions.syndicate(params);
                    } else if (toUnSyndicate.indexOf(blog._id) !== -1) {
                        IngestPanelActions.syndicate(
                            angular.extend(params, {method: 'DELETE'})
                        );
                    }
                });

                IngestPanelActions.toggleModal(false);
            };
        }
    };
}
