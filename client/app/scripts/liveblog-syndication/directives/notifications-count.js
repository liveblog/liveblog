notificationsCount.$inject = ['$routeParams'];

export default function notificationsCount($routeParams) {
    return {
        template: '<span ' +
            'class="label label-info circle small notification-counter" ' +
            'ng-if="count > 0">{{count}}</span>' +
            '<i class="lb-big-icon-ingest" alt="ingest"></i>',
        link: function(scope) {
            const ingestPanels = ['ingest', 'incoming-syndication'];

            scope.count = 0;
            scope.blogId = $routeParams._id;

            scope.$on('posts', (e, data) => {
                if (data.posts
                && data.posts[0].syndication_in
                && data.posts[0].auto_publish !== true
                && data.posts[0].blog == scope.blogId
                && _.has(data, 'created')
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
        },
    };
}
