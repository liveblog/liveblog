liveblogSyndication
    .controller('ConsumerController', ['$scope', 'api', function($scope, api) {
        console.log('api', api.consumers);
        api.consumers.query().then(function(consumers) {
            console.log('consumers', consumers);
        });
    }]);
