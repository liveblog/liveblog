lbUserSelectList.$inject = ['api'];

export default function lbUserSelectList(api) {
    return {
        scope: {
            members: '=',
            user: '=',
            onchoose: '&',
            showinactive: '=',
        },
        templateUrl: 'scripts/apps/desks/views/user-select.html',
        link: function(scope, elem, attrs) {
            const ARROW_UP = 38;
            const ARROW_DOWN = 40;
            const ENTER = 13;

            scope.selected = null;
            scope.search = null;
            scope.users = {};

            scope.done = false;
            scope.searching = false;

            const _refresh = function() {
                scope.users = {};
                scope.searching = true;
                scope.done = false;

                const filters = {
                    $or: [
                        {username: {$regex: scope.search, $options: '-i'}},
                        {first_name: {$regex: scope.search, $options: '-i'}},
                        {last_name: {$regex: scope.search, $options: '-i'}},
                        {email: {$regex: scope.search, $options: '-i'}},
                    ],
                };

                if (scope.showinactive !== true) {
                    filters.is_active = true;
                    filters.needs_activation = false;
                }

                return api('users')
                    .query({where: JSON.stringify(filters)})
                    .then((result) => {
                        scope.searching = false;

                        // let's exclude current user
                        for (var i = 0; i < result._items.length; i++) {
                            var obj = result._items[i];

                            if (scope.user && obj._id === scope.user._id || obj._id === scope.$root.identity._id) {
                                result._items.splice(i, 1);
                            }
                        }
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
                        scope.done = true;
                    });
            };
            const refresh = _.debounce(_refresh, 500);

            scope.$watch('search', () => {
                if (scope.search) {
                    refresh();
                }
            });

            function getSelectedIndex() {
                if (scope.selected) {
                    let selectedIndex = -1;

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
                const selectedIndex = getSelectedIndex();
                const previousIndex = _.max([0, selectedIndex - 1]);

                if (selectedIndex > 0) {
                    scope.select(scope.users._items[previousIndex]);
                }
            }

            function next() {
                const selectedIndex = getSelectedIndex();
                const nextIndex = _.min([scope.users._items.length - 1, selectedIndex + 1]);

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
                var exists = scope.members.some((el) => el._id === user._id);

                if (!exists) {
                    scope.members.push(user);
                }
                scope.search = null;
            };

            scope.select = function(user) {
                scope.selected = user;
            };

            scope.getUserDisplay = (user) => user.display_name;
        },
    };
}
