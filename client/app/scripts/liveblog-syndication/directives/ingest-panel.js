liveblogSyndication
    .directive('lbIngestPanel', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/ingest-panel.html',
            link: function(scope) {
                scope.openSyndBlogsList = function() {
                    scope.syndBlogsListModalActive = true;
                }

                scope.cancel = function() {
                    scope.syndBlogsListModalActive = false;
                }

                api.producers.query().then((producers) => {
                    scope.producers = producers;
                });

                scope.selectProducer = function(producerId) {
                    api.get('/producers/' + producerId + '/blogs')
                        .then(function(blogs) {
                            console.log('blogs', blogs);
                            scope.blogs = blogs;
                        });
                };
            }
        };
    }]);
