liveblogSyndication
    .factory('IncomingSyndicationReducers', function() {
        return function(state, action) {
            switch (action.type) {
                case 'ON_GET_POSTS':
                    return angular.extend(state, {
                        posts: action.posts,
                    });

                case 'ON_GET_SYNDICATION':
                    return angular.extend(state, {
                        syndication: action.syndication
                    });
            }
        };
    });

