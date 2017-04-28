lbUserSelectList.$inject = ['api'];

export default function lbUserSelectList(api) {
    return {
        scope: {
            members: '=',
            onchoose: '&'
        },
        templateUrl: 'scripts/apps/desks/views/user-select.html',
        link: function(scope, elem, attrs) {
            var ARROW_UP = 38, ARROW_DOWN = 40, ENTER = 13;

            scope.selected = null;
            scope.search = null;
            scope.users = {};

            var _refresh = function() {
                scope.users = {};
                return api('users').query({where: JSON.stringify({
                    $or: [
                        {username: {$regex: scope.search, $options: '-i'}},
                        {first_name: {$regex: scope.search, $options: '-i'}},
                        {last_name: {$regex: scope.search, $options: '-i'}},
                        {email: {$regex: scope.search, $options: '-i'}}
                    ]
                })})
                .then((result) => {
                    scope.users = result;
                    scope.users._items = _.filter(scope.users._items, (item) => {
                        var found = false;

                        _.each(scope.members, (member) => {
                            if (member._id === item._id) {
                                found = true;
                            }
                        });
                        return !found;
                    });
                    scope.selected = null;
                });
            };
            var refresh = _.debounce(_refresh, 1000);

            scope.$watch('search', () => {
                if (scope.search) {
                    refresh();
                }
            });

            function getSelectedIndex() {
                if (scope.selected) {
                    var selectedIndex = -1;

                    _.each(scope.users._items, (item, index) => {
                        if (item === scope.selected) {
                            selectedIndex = index;
                        }
                    });
                    return selectedIndex;
                }

                return -1;
            }

            function previous() {
                var selectedIndex = getSelectedIndex(),
                    previousIndex = _.max([0, selectedIndex - 1]);

                if (selectedIndex > 0) {
                    scope.select(scope.users._items[previousIndex]);
                }
            }

            function next() {
                var selectedIndex = getSelectedIndex(),
                    nextIndex = _.min([scope.users._items.length - 1, selectedIndex + 1]);

                scope.select(scope.users._items[nextIndex]);
            }

            elem.bind('keydown keypress', (event) => {
                scope.$apply(() => {
                    switch (event.which) {
                    case ARROW_UP:
                        event.preventDefault();
                        previous();
                        break;
                    case ARROW_DOWN:
                        event.preventDefault();
                        next();
                        break;
                    case ENTER:
                        event.preventDefault();
                        if (getSelectedIndex() >= 0) {
                            scope.choose(scope.selected);
                        }
                        break;
                    }
                });
            });

            scope.choose = function(user) {
                scope.onchoose({user: user});
                scope.search = null;
            };

            scope.select = function(user) {
                scope.selected = user;
            };

            scope.getUserDisplay = (user) => user.display_name;
        }
    };
}
