liveblogSyndication
    .directive('lbCopyToClipboard', ['notify', function(notify) {
        return {
            template: '<a ' +
                    'title="Copy to clipboard" ' +
                    'ng-href="" ' +
                    'ng-click="copyToClipboard()"' +
                    'class="ng-scope">' +
                    '<i class="icon-copy true"></i>' +
                '</a>',
            link: function(scope, elem, attrs) {
                scope.copyToClipboard = function() {
                    if (!attrs.for)
                        return;

                    var apiKey = document.getElementById(attrs.for),
                        range = document.createRange(),
                        selection = window.getSelection();

                    if (apiKey) {
                        range.selectNode(apiKey);
                        selection.removeAllRanges();
                        selection.addRange(range);
                        document.execCommand('copy');

                        if (selection.hasOwnProperty('removeRange'))
                            selection.removeRange(range);
                        else
                            selection.removeAllRanges();

                        notify.pop();
                        notify.success('Selection successfully copied to clipboard');
                    }
                };
            }
        };
    }]);

