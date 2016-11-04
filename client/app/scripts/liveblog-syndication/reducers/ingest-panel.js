liveblogSyndication
    .factory('IngestPanelReducers', function() {
        return function(state, action) {
            //console.log('inside reducers', state, action);
            switch (action.type) {
                case 'ON_GET_SYND':
                    return {
                        syndicationIn: action.syndicationIn,
                        producers: state.producers
                    };

                case 'ON_GET_PRODUCERS':
                    return {
                        syndicationIn: state.syndicationIn,
                        producers: action.producers
                    }
            }
        }
    });
