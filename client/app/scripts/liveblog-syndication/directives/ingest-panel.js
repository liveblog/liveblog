liveblogSyndication
    .directive('lbIngestPanel', function() {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/ingest-panel.html',
            link: function(scope) {
                scope.openSyndBlogsModal = function() {
                    console.log('open modal');
                    scope.syndBlogsModalActive = true;
                }
            }
        };
    });
