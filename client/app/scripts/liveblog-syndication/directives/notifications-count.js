liveblogSyndication
    .directive('lbNotificationsCount', function() {
        return {
            template: '<span ' +
                'class="label label-info circle small notification-counter" ' +
                'ng-if="count > 0">{{count}}</span>' +
                '<i class="big-icon-ingest" alt="ingest"></i>',
            link: function(scope) {
                var ingestPanels = ['ingest', 'incoming-syndication'];
                scope.count = 0;

                scope.$on('posts', function(e, data) {
                    if (data.posts[0].syndication_in && ingestPanels.indexOf(scope.panelState) == -1)
                        scope.count++;
                });

                scope.$watch('panelState', function(panelState) {
                    if (ingestPanels.indexOf(scope.panelState) != -1)
                        scope.count = 0;
                });
            }
        }
    });
