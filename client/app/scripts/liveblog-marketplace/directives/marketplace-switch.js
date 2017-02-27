liveblogMarketplace
    .directive('lbMarketplaceSwitch', [function() {
        return {
            templateUrl: 'scripts/liveblog-marketplace/views/marketplace-switch.html',
            scope: {
                marketEnabled: '='
            }
        };
    }]);
