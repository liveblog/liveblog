import filterByMemberTpl from 'scripts/liveblog-edit/views/filter-by-member.html';

lbFilterByMember.$inject = ['api'];

export default function lbFilterByMember(api) {
    return {
        restrict: 'E',
        scope: {
            blogId: '=',
            onFilterChange: '='
        },
        templateUrl: filterByMemberTpl,
        controllerAs: 'vm',
        controller: ['$scope', function($scope) {
            var vm = this;
            angular.extend(vm, {
                members: [],
                openSelector: false,
                preselectedUsers: [],
                selectedUsers: [],
                findUserInPreselection: function(user_id) {
                    return _.find(vm.preselectedUsers, function(user) {
                        return user._id === user_id;
                    });
                },
                toggleUserInPreselection: function(user) {
                    var old_user = vm.findUserInPreselection(user._id);
                    if (old_user) {
                        vm.preselectedUsers.splice(vm.preselectedUsers.indexOf(old_user), 1);
                    } else {
                        vm.preselectedUsers.push(user);
                    }
                },
                isUserInPreselection: function(user) {
                    return vm.findUserInPreselection(user._id);
                },
                confirmPreselection: function() {
                    vm.updateFilters(angular.copy(vm.preselectedUsers));
                },
                updateFilters: function(fitlers) {
                    vm.selectedUsers = fitlers;
                    $scope.onFilterChange(vm.selectedUsers);
                },
                clearSelection: function() {
                    vm.updateFilters([]);
                },
                removeUserFromSelection: function(user) {
                    var filters = angular.copy(vm.selectedUsers);
                    filters.splice(vm.selectedUsers.indexOf(user), 1);
                    vm.updateFilters(filters);
                },
                toggleSelector: function() {
                    vm.openSelector = !vm.openSelector;
                    if (vm.openSelector) {
                        // clear the search input
                        vm.search = '';
                        // preset the preselection to the current selection
                        vm.preselectedUsers = angular.copy(vm.selectedUsers);
                        // retrieve blog information to know the owner and the members
                        api('blogs')
                            .getById($scope.blogId)
                            .then(function(blog) {
                                // add the owner
                                var ids = [blog.original_creator];
                                // add the members
                                if (blog.members) {
                                    ids.push.apply(ids, blog.members.map(function(member) {return member.user;}));
                                }
                                // retrieve information about these users and list them in the view
                                api('users')
                                    .query({where: {_id: {$in: ids}}})
                                    .then(function(data) {
                                        vm.members = data._items;
                                    });
                            });
                    }
                }
            });
        }]
    };
}
