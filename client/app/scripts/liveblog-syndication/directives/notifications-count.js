export default function notificationsCount() {
    return {
        template: '<span ' +
            'class="label label-info circle small notification-counter" ' +
            'ng-if="count > 0">{{count}}</span>' +
            '<i class="big-icon-ingest" alt="ingest"></i>',
        link: function(scope) {
            let ingestPanels = ['ingest', 'incoming-syndication'];

            scope.count = 0;

            scope.$on('posts', (e, data) => {
                if (data.posts
                && data.posts[0].syndication_in
                && data.posts[0].auto_publish !== true
                && data.hasOwnProperty('created')
                && ingestPanels.indexOf(scope.panelState) === -1) {
                    scope.$apply(() => {
                        scope.count++;
                    });
                }
            });

            scope.$watch('panelState', (panelState) => {
                if (ingestPanels.indexOf(scope.panelState) !== -1) {
                    scope.count = 0;
                }
            });
        }
    };
}
