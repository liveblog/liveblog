import filterByMemberTpl from 'scripts/liveblog-edit/views/filter-by-member.ng1';

lbFilterByMember.$inject = ['api'];

export default function lbFilterByMember(api) {
    return {
        restrict: 'E',
        scope: {
            blogId: '=',
            onFilterChange: '=',
        },
        templateUrl: filterByMemberTpl,
        controllerAs: 'self',
        controller: ['$scope', function($scope) {
            const self = this;

            angular.extend(self, {
                members: [],
                openSelector: false,
                preselectedUsers: [],
                selectedUsers: [],
                findUserInPreselection: function(userId) {
                    return _.find(self.preselectedUsers, (user) => user._id === userId);
                },
                toggleUserInPreselection: function(user) {
                    const oldUser = self.findUserInPreselection(user._id);

                    if (oldUser) {
                        self.preselectedUsers.splice(self.preselectedUsers.indexOf(oldUser), 1);
                    } else {
                        self.preselectedUsers.push(user);
                    }
                },
                isUserInPreselection: function(user) {
                    return self.findUserInPreselection(user._id);
                },
                confirmPreselection: function() {
                    self.updateFilters(angular.copy(self.preselectedUsers));
                },
                updateFilters: function(fitlers) {
                    self.selectedUsers = fitlers;
                    $scope.onFilterChange(self.selectedUsers);
                },
                clearSelection: function() {
                    self.updateFilters([]);
                },
                removeUserFromSelection: function(user) {
                    const filters = angular.copy(self.selectedUsers);

                    filters.splice(self.selectedUsers.indexOf(user), 1);
                    self.updateFilters(filters);
                },
                toggleSelector: function() {
                    self.openSelector = !self.openSelector;
                    if (self.openSelector) {
                        // clear the search input
                        self.search = '';
                        // preset the preselection to the current selection
                        self.preselectedUsers = angular.copy(self.selectedUsers);
                        // retrieve blog information to know the owner and the members
                        api('blogs')
                            .getById($scope.blogId)
                            .then((blog) => {
                                // add the owner
                                const ids = [blog.original_creator];

                                // add the members
                                if (blog.members) {
                                    ids.push(...blog.members.map((member) => member.user));
                                }
                                // retrieve information about these users and list them in the view
                                api('users')
                                    .query({where: {_id: {$in: ids}}})
                                    .then((data) => {
                                        self.members = data._items;
                                    });
                            });
                    }
                },
            });
        }],
    };
}
