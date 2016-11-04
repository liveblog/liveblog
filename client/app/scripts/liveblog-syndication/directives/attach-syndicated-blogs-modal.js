liveblogSyndication
    .directive('lbAttachSyndicatedBlogsModal',
        ['api', 'config', '$q', '$routeParams', 'lodash', 'IngestPanelActions',
        function(api, config, $q, $routeParams, _, IngestPanelActions) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/attach-syndicated-blogs-modal.html',
                scope: {
                    modalActive: '=',
                    store: '='
                },
                link: function(scope) {
                    var consumerBlogId = $routeParams._id;

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

                        if (Object.keys(state.producerBlogs).length > 0)
                            onProducerBlogs();
                    })

                    IngestPanelActions.getProducers();
                    scope.blogsToAttach = [];

                    var compare = function() {
                        scope.hasChanged = angular.equals(
                            scope.localSyndication.sort(), 
                            scope.blogsToAttach.sort()
                        );
                    };

                    //api('syndication_in').query().then(function(syndicationIn) {
                    //    scope.syndicationIn = syndicationIn;
                    //})

                    //setTimeout(function() {
                    //    console.log('timeout', store.data);
                    //}, 1000);

                    //scope.producers = store.data.producers;
                    //api.producers.query().then(function(producers) {
                    //    scope.producers = producers;
                    //});

                    scope.cancel = function() {
                        scope.modalActive = false;
                    }

                    scope.selectProducer = function(producerId) {
                        console.log('syndication in', scope.syndicationIn);
                        scope.producers._items.forEach(function(producer) {
                            if (producer._id == producerId)
                                scope.currentProducer = producer;
                        });

                        IngestPanelActions.getProducerBlogs(producerId);
                        //api.get('/producers/' + producerId + '/blogs')
                        //    .then(onProducerBlogs);
                    };

                    scope.check = function(blog) {
                        blog.checked = (blog.hasOwnProperty('checked')) ? !blog.checked : true;

                        if (blog.checked && scope.blogsToAttach.indexOf(blog._id) == -1)
                            scope.blogsToAttach.push(blog._id);
                        else if (!blog.checked && scope.blogsToAttach.indexOf(blog._id) != -1)
                            scope.blogsToAttach.splice(scope.blogsToAttach.indexOf(blog._id), 1);

                        compare();
                    };

                    //var syndicate = function(blog, method) {
                    //    var uri = config.server.url + 
                    //        '/producers/' + scope.currentProducer._id + 
                    //        '/syndicate/' + blog._id;

                    //    return $http({
                    //        url: uri,
                    //        method: (method == 'DELETE') ? 'DELETE' : 'POST',
                    //        data: { consumer_blog_id: consumerBlogId },
                    //        headers: {
                    //            "Content-Type": "application/json;charset=utf-8"
                    //        }
                    //    })
                    //    .then(function(response) {
                    //        console.log('response to delete', response);
                    //        return response;
                    //    })
                    //    .catch(function(err) {
                    //        console.log('err', err);
                    //        scope.modalActive = false;
                    //    });
                    //};


                    scope.attach = function() {
                        var chain = [],
                            toSyndicate = _.difference(scope.blogsToAttach, scope.localSyndication),
                            toUnSyndicate = _.difference(scope.localSyndication, scope.blogsToAttach);


                        scope.producerBlogs._items.forEach(function (blog) {
                            if (toSyndicate.indexOf(blog._id) != -1)
                                IngestPanelActions.syndicate(
                                    scope.currentProducer,
                                    consumerBlogId,
                                    blog, 
                                    'POST'
                                );
                            else if (toUnSyndicate.indexOf(blog._id) != -1)
                                IngestPanelActions.syndicate(
                                    scope.currentProducer,
                                    consumerBlogId,
                                    blog, 
                                    'DELETE'
                                );
                        });

                        scope.modalActive = false;

                        //$q.all(chain)
                        //    .then(function() {
                        //        console.log('syndication complete');
                        //        scope.modalActive = false;
                        //    })
                        //    .catch(function(err) {
                        //        scope.modalActive = false;
                        //        console.log('syndication failed');
                        //    });
                    }
                }
            };
        }]);
