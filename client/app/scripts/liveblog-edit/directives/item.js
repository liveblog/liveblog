import itemTpl from 'scripts/liveblog-edit/views/item.ng1';

export default function lbItem() {
    return {
        scope: {
            item: '=',
        },
        templateUrl: itemTpl,
    };
}
