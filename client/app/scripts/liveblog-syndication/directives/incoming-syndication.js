import incomingSyndicationTpl from 'scripts/liveblog-syndication/views/incoming-syndication.html';

incomingSyndication.$inject = [
    '$routeParams',
    'IncomingSyndicationActions',
    'IncomingSyndicationReducers',
    'Store',
    'modal'
];

export default function incomingSyndication(
    $routeParams,
    IncomingSyndicationActions,
    IncomingSyndicationReducers,
    Store,
    modal
) {
    return {
        templateUrl: incomingSyndicationTpl,
        scope: {
            lbPostsOnPostSelected: '=',
            openPanel: '=',
            syndId: '='
        },
        link: function(scope) {
            scope.blogId = $routeParams._id;

            scope.store = new Store(IncomingSyndicationReducers, {
                posts: {},
                syndication: {}
            });

            scope.store.connect((state) => {
                scope.posts = state.posts;
                scope.syndication = state.syndication;
            });

            scope.goBack = function() {
                scope.openPanel('ingest', null);
            };

            scope.publish = function(post) {
                IncomingSyndicationActions
                    .publish(post);
            };

            scope.askRemove = function(post) {
                modal.confirm(gettext('Are you sure you want to delete the post?'))
                    .then(() => {
                        IncomingSyndicationActions
                            .destroy(post);
                    });
            };

            IncomingSyndicationActions
                .getPosts(scope.blogId, scope.syndId);

            IncomingSyndicationActions
                .getSyndication(scope.syndId);

            // On incoming post, we reload all the posts.
            // Not very fast, but easy to setup
            scope.$on('posts', (e, data) => {
                if (data.hasOwnProperty('deleted') && data.deleted === true
                || data.posts && data.posts[0].syndication_in) {
                    IncomingSyndicationActions
                        .getPosts(scope.blogId, scope.syndId);
                }
            });

            scope.$on('$destroy', scope.store.destroy);
        }
    };
}
