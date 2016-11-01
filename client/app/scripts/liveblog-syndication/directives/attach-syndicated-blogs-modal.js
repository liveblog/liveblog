liveblogSyndication
    .directive('lbAttachSyndicatedBlogsModal',
        ['api', 'config', '$http', '$routeParams', function(api, config, $http, $routeParams) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/attach-syndicated-blogs-modal.html',
                scope: {
                    modalActive: '='
                },
                link: function(scope) {
                    scope.blogsToAttach = [];

                    var consumerBlogId = $routeParams._id;

                    api.producers.query().then((producers) => {
                        scope.producers = producers;
                    });

                    scope.cancel = function() {
                        scope.syndBlogsListModalActive = false;
                    }

                    scope.selectProducer = function(producerId) {
                        scope.producers._items.forEach(function(producer) {
                            if (producer._id == producerId)
                                scope.currentProducer = producer;
                        });

                        api.get('/producers/' + producerId + '/blogs')
                            .then(function(blogs) {
                                console.log('blogs', blogs);
                                scope.blogs = blogs;
                            });
                    };

                    scope.check = function(blog) {
                        blog.checked = (blog.hasOwnProperty('checked')) ? !blog.checked : true;

                        if (blog.checked && scope.blogsToAttach.indexOf(blog._id) == -1)
                            scope.blogsToAttach.push(blog._id);
                        else if (!blog.checked && scope.blogsToAttach.indexOf(blog._id) != -1)
                            scope.blogsToAttach.splice(scope.blogsToAttach.indexOf(blog._id), 1);
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

                    scope.attach = function() {
                        scope.blogs._items.forEach(function(blog) {
                            if (scope.blogsToAttach.indexOf(blog._id) != -1)
                                syndicate(blog)
                        });
                    }
                }
            };
        }]);
