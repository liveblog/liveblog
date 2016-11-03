liveblogSyndication
    .directive('lbIngestPanel', ['Actions', 'Store', function(Actions, Store) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/ingest-panel.html',
            link: function(scope) {
                new Store(function(data) {
                    console.log('data syndication', data.syndicationIn);
                    scope.syndicationIn = data.syndicationIn;
                });

                Actions.getSyndication();

                scope.openSyndBlogsModal = function() {
                    scope.syndBlogsModalActive = true;
                }
            }
        };
    }]);
