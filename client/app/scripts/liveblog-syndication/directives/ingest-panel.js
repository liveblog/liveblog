liveblogSyndication
    .directive('lbIngestPanel',
        ['IngestPanelActions', 'Store', 'IngestPanelReducers', 
        function(IngestPanelActions, Store, IngestPanelReducers) {
            return {
                templateUrl: 'scripts/liveblog-syndication/views/ingest-panel.html',
                link: function(scope) {
                    scope.store = new Store(IngestPanelReducers, {
                        syndicationIn: {},
                        producers: {}
                    });

                    scope.store.connect(function(state) {
                        console.log('state', state);
                        scope.syndicationIn = state.syndicationIn;
                    });

                    IngestPanelActions.getSyndication();

                    scope.openSyndBlogsModal = function() {
                        scope.syndBlogsModalActive = true;
                    }
                }
            };
        }]);
