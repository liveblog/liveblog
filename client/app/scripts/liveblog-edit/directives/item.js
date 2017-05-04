import itemTpl from 'scripts/liveblog-edit/views/item.html';

export default function lbItem() {
    return {
        scope: {
            item: '='
        },
        templateUrl: itemTpl,
    }
}
