liveblogSyndication
    .factory('IncomingSyndicationReducers', function() {
        return function(state, action) {
            switch (action.type) {
                case 'ON_GET_POSTS':
                    return {
                        posts: action.posts
                    };
            }
        };
    });

