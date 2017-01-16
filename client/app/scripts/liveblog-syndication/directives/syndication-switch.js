liveblogSyndication
    .directive('lbSyndicationSwitch', ['api', '$routeParams', function(api, $routeParams) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/syndication-switch.html',
            link: function(scope) {
                scope.enableSyndSwitch = true;

                var params = {
                    where: {
                        blog_id: $routeParams._id
                    }
                };

                api.syndicationOut.query(params).then(function(syndOuts) {
                    if (syndOuts._items.length > 0)
                        scope.enableSyndSwitch = false;
                });
            }
        };
    }]);
