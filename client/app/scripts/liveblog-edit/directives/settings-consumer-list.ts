import consumerListItemTpl from 'liveblog-edit/views/settings-consumer-list.ng1';

consumerList.$inject = [];

// tslint:disable-next-line:only-arrow-functions
export default function consumerList() {
    return {
        templateUrl: consumerListItemTpl,
        scope: {
            consumers: '=',
            selected: '=',
            consumersSettings: '=',
            selectedConsumerTags: '=',
            showTagsSelector: '=',
        },
        link: (scope) => {
            scope.select = (consumer: any) => {
                scope.showTagsSelector = false;
                scope.selected = consumer;
                scope.selectedConsumerTags = scope.getTags(scope.selected);

                setTimeout(() => {
                    scope.showTagsSelector = true;
                    scope.$apply();
                }, 100);
            };

            scope.getTags = (consumer: any) => {
                const tagsSettings = scope.consumersSettings || {};

                if (consumer._id in tagsSettings) {
                    return tagsSettings[consumer._id]['tags'] || [];
                }

                return [];
            };
        },
    };
}
