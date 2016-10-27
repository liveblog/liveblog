liveblogSyndication
    .directive('lbConsumerList', ['api', 'notify', function(api, notify) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/consumer-list-item.html',
            scope: {
                roles: '=',
                consumers: '=',
                selected: '=',
                done: '='
            },
            link: function(scope, elem, attrs) {
                scope.select = function(consumer) {
                    scope.selected = consumer;
                };

                scope.disable = function(e, consumerToRemove) {
                    e.stopPropagation();

                    api.consumers.remove(consumerToRemove).then(function(result) {
                        angular.forEach(scope.consumers, function(consumer, i) {
                            if (consumer._id == consumerToRemove._id)
                                scope.consumers.splice(i, 1);
                        });
                    });
                }

                scope.copyToClipboard = function(elementId) {
                    var apiKey = document.getElementById(elementId),
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
                }
            }
        };
    }]);
