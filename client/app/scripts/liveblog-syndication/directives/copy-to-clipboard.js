copyToClipboard.$inject = ['notify'];

export default function copyToClipboard(notify) {
    return {
        template: '<a ' +
                'title="Copy to clipboard" ' +
                'ng-href="" ' +
                'ng-click="copyToClipboard($event)"' +
                'class="ng-scope">' +
                '<i class="icon-copy true"></i>' +
            '</a>',
        link: function(scope, elem, attrs) {
            scope.copyToClipboard = function(e) {
                if (!attrs.for) {
                    return;
                }

                e.stopPropagation();

                var apiKey = document.getElementById(attrs.for),
                    range = document.createRange(),
                    selection = window.getSelection();

                if (apiKey) {
                    range.selectNode(apiKey);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    document.execCommand('copy');

                    if (selection.hasOwnProperty('removeRange')) {
                        selection.removeRange(range);
                    } else {
                        selection.removeAllRanges();
                    }

                    notify.pop();
                    notify.success('Selection successfully copied to clipboard');
                }
            };
        }
    };
}
