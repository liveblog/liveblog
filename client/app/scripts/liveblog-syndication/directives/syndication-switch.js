liveblogSyndication
    .directive('lbSyndicationSwitch', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-syndication/views/syndication-switch.html',
            link: function(scope) {
                console.log('syndication switch');
                api.syndicationOut.query(function(syndOuts) {
                    console.log('syndout', syndOuts);
                });
            }
        };
    }]);
