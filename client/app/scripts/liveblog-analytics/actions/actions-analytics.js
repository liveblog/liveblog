// liveblogSyndication
//     .factory('analyticsActions', ['Dispatcher', 'api', 'analyticsService',
//         function(Dispatcher, api, analyticsService) {
//             return {
                
//                 listAnalytics: function(blogId) {
//                     api.syndicationIn.getById(syndicationId).then(function(syndication) {
//                         api.producers.getById(syndication.producer_id).then(function(producer) {
//                             syndication.producer = producer;

//                             Dispatcher.dispatch({
//                                 type: 'ON_GET_SYNDICATION',
//                                 syndication: syndication
//                             });
//                         });
//                     });
//                 },
//         }]);
