liveblogSyndication
    .directive('lbAttachSyndicatedBlogsModal',
        ['api', 'config', '$http', '$routeParams', 'lodash',
        function(api, config, $http, $routeParams, _) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/attach-syndicated-blogs-modal.html',
                scope: {
                    modalActive: '='
                },
                link: function(scope) {
                    scope.blogsToAttach = [];

                    var consumerBlogId = $routeParams._id;

                    var compare = function() {
                        scope.hasChanged = angular.equals(
                            scope.localSyndication.sort(), 
                            scope.blogsToAttach.sort()
                        );
                    };

                    api('syndication_in').query().then(function(syndicationIn) {
                        scope.syndicationIn = syndicationIn;
                    })

                    api.producers.query().then(function(producers) {
                        scope.producers = producers;
                    });

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

                    var syndicate = function(blog) {
                        var uri = config.server.url + 
                            '/producers/' + scope.currentProducer._id + 
                            '/syndicate/' + blog._id;

                        // I'm using angular default $http service because I couldn't manage
                        // to have the superdesk api service to do what I want.
                        $http.post(uri, { consumer_blog_id: consumerBlogId })
                            .then(function(response) {
                                console.log('response', response);
                            })
                            .catch(function(err) {
                                console.log('err', err);
                            });
                    };

                    var unSyndicate = function(blog) {
                        var uri = config.server.url + 
                            '/producers/' + scope.currentProducer._id + 
                            '/syndicate/' + blog._id;

                        console.log('unsyndicate', blog);
                        $http({
                            url: uri,
                            method: 'DELETE',
                            data: { consumer_blog_id: consumerBlogId },
                            headers: {
                                "Content-Type": "application/json;charset=utf-8"
                            }
                        })
                        //$http.delete(uri, { data: { consumer_blog_id: consumerBlogId }})
                            .then(function(response) {
                                console.log('response to delete', response);
                            })
                            .catch(function(err) {
                                console.log('err', err);
                            });
                    };

                    scope.attach = function() {
                        var toSyndicate = _.difference(scope.blogsToAttach, scope.localSyndication),
                            toUnSyndicate = _.difference(scope.localSyndication, scope.blogsToAttach);

                        scope.blogs._items.forEach(function(blog) {
                            if (toSyndicate.indexOf(blog._id) != -1)
                                syndicate(blog)
                            else if (toUnSyndicate.indexOf(blog._id) != -1)
                                unSyndicate(blog);
                        });
                    }
                }
            };
        }]);
