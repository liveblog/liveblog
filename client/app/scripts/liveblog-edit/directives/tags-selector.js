import renderTagsSelector from '../components/tagsSelector';

tagsPicker.$inject = ['$compile', '$rootScope', 'api'];

const TAGS = 'global_tags';

/**
* simple directive to fetch tags data and render selector
*/
export default function tagsPicker($compile, $rootScope, api) {
    return {
        restrict: 'E',
        link: function(scope, element, attrs) {
            // perhaps should separate this, but used here for now
            // so we can extract it later if needed
            api.global_preferences.query({where: {key: TAGS}})
                .then((preferences) => {
                    const tagSetting = _.find(preferences._items, (item) => item.key === TAGS);
                    const tags = (tagSetting.value) ? tagSetting.value : [];

                    renderTagsSelector($(element).get(0), tags);
                });
        },

        scope: {
            tags: '=',
        },
    };
}
