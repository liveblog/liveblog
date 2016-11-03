liveblogSyndication
    .directive('lbAttachSyndicatedBlogsModal',
        ['api', 'config', '$http', '$q', '$routeParams', 'lodash', 'Actions', 'Store',
        function(api, config, $http, $q, $routeParams, _, Actions, Store) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/attach-syndicated-blogs-modal.html',
                scope: {
                    modalActive: '=',
                    syndicationIn: '='
                },
                link: function(scope) {
                    new Store(function(data) {
                        scope.producers = data.producers;
                    });

                    Actions.getProducers();
                    scope.blogsToAttach = [];

                    var consumerBlogId = $routeParams._id;

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

                    var onProducerBlogs = function(blogs) {
                        scope.localSyndication = scope.syndicationIn._items
                            .filter(function(syndication) {
                                return (syndication.blog_id == consumerBlogId);
                            })
                            .map(function(syndication) {
                                return syndication.producer_blog_id;
                            });

                        blogs._items = blogs._items.map(function(blog) {
                            blog.checked = (scope.localSyndication.indexOf(blog._id) != -1);
                            return blog;
                        });

                        scope.blogsToAttach = angular.copy(scope.localSyndication);
                        scope.blogs = blogs;

                        compare();
                    };

                    scope.selectProducer = function(producerId) {
                        console.log('syndication in', scope.syndicationIn);
                        scope.producers._items.forEach(function(producer) {
                            if (producer._id == producerId)
                                scope.currentProducer = producer;
                        });

                        api.get('/producers/' + producerId + '/blogs')
                            .then(onProducerBlogs);
                    };

                    scope.check = function(blog) {
                        blog.checked = (blog.hasOwnProperty('checked')) ? !blog.checked : true;

                        if (blog.checked && scope.blogsToAttach.indexOf(blog._id) == -1)
                            scope.blogsToAttach.push(blog._id);
                        else if (!blog.checked && scope.blogsToAttach.indexOf(blog._id) != -1)
                            scope.blogsToAttach.splice(scope.blogsToAttach.indexOf(blog._id), 1);

                        compare();
                    };

                    var syndicate = function(blog, method) {
                        var uri = config.server.url + 
                            '/producers/' + scope.currentProducer._id + 
                            '/syndicate/' + blog._id;

                        return $http({
                            url: uri,
                            method: (method == 'DELETE') ? 'DELETE' : 'POST',
                            data: { consumer_blog_id: consumerBlogId },
                            headers: {
                                "Content-Type": "application/json;charset=utf-8"
                            }
                        })
                        .then(function(response) {
                            console.log('response to delete', response);
                            return response;
                        })
                        .catch(function(err) {
                            console.log('err', err);
                            scope.modalActive = false;
                        });
                    };


                    scope.attach = function() {
                        var chain = [],
                            toSyndicate = _.difference(scope.blogsToAttach, scope.localSyndication),
                            toUnSyndicate = _.difference(scope.localSyndication, scope.blogsToAttach);


                        scope.blogs._items.forEach(function (blog) {
                            if (toSyndicate.indexOf(blog._id) != -1)
                                Actions.syndicate(
                                    scope.currentProducer,
                                    consumerBlogId,
                                    blog, 
                                    'POST'
                                );
                            //else if (toUnSyndicate.indexOf(blog._id) != -1)
                            //    chain.push(syndicate(blog, 'DELETE'));
                        });

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
