liveblogSyndication
    .directive('lbAttachSyndicatedBlogsModal', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/attach-syndicated-blogs-modal.html',
            scope: {
                modalActive: '='
            },
            link: function(scope) {
                scope.cancel = function() {
                    scope.syndBlogsListModalActive = false;
                }

                api.producers.query().then((producers) => {
                    scope.producers = producers;
                });

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
            }
        };
    }]);
