import renderTagsSelector from '../components/tagsSelector';

tagsPicker.$inject = ['$rootScope', 'config'];

/**
* simple directive to fetch tags data and render selector
*/
export default function tagsPicker($rootScope, config) {
    return {
        restrict: 'E',
        link: function(scope, element, attrs) {
            if ($rootScope.globalTags) {
                const props = {
                    tags: $rootScope.globalTags,
                    isMulti: config.allowMultiTagPost,
                    onChange: scope.onChange,
                    selectedTags: scope.selectedTags,
                };

                renderTagsSelector($(element).get(0), props);
            }
        },

        scope: {
            selectedTags: '=',
            onChange: '=',
        },
    };
}
