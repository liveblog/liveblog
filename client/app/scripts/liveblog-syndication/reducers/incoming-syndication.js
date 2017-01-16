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

                case 'ON_SAVED_POST':
                case 'ON_REMOVED_POST':
                    return angular.extend(state, {
                        notification: action.notification || null,
                        posts: angular.extend(state.posts, {
                            _items: state.posts._items.filter(function(item) {
                                return (item._id != action.post._id);
                            })
                        })
                    });

                case 'ON_FLUSHED_NOTIF':
                    return angular.extend(state, {
                        notification: null
                    });
            }
        };
    });

