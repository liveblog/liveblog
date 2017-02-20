api.$inject = ['apiProvider'];

export default function api(apiProvider) {
    apiProvider
        .api('syndicationIn', {
            type: 'http',
            backend: {rel: 'syndication_in'}
        })
        .api('syndicationOut', {
            type: 'http',
            backend: {rel: 'syndication_out'}
        })
         .api('consumers', {
            type: 'http',
            backend: {rel: 'consumers'}
        })
        .api('producers', {
            type: 'http',
            backend: {rel: 'producers'}
        });
};
