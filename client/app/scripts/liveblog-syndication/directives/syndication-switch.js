import syndicationSwitchTpl from 'scripts/liveblog-syndication/views/syndication-switch.html';

syndicationSwitch.$inject = ['api', '$routeParams'];

export default function syndicationSwitch(api, $routeParams) {
    return {
        templateUrl: syndicationSwitchTpl,
        link: function(scope) {
            scope.enableSyndSwitch = true;
            scope.consumers = [];

            var params = {
                where: {
                    blog_id: $routeParams._id
                }
            };

            api.syndicationOut.query(params).then(function(syndOuts) {
                if (syndOuts._items.length > 0) {
                    scope.enableSyndSwitch = false;

                    syndOuts._items.forEach((syndOut) => {
                        api.consumers.getById(syndOut.consumer_id).then((consumer) => {
                            consumer.contact = `${consumer.contacts[0].first_name}`;
                            scope.consumers.push(consumer);
                        });
                    })
                }
            });
        }
    };
};
