marketplaceActions.$inject = ['Dispatcher', 'api', '$http', 'lodash'];

export default function marketplaceActions(Dispatcher, api, $http, _) {
    return {
        getBlogs: function(filters) {
            var params = {
                where: filters,
                sort: '-start_date'
            };

            api.get('/marketplace/blogs', params)
                .then((blogs) => {
                    Dispatcher.dispatch({
                        type: 'ON_GET_BLOGS',
                        blogs: blogs,
                        filters: filters
                    });
                });
        },
        getMarketers: function() {
            api.get('/marketplace/marketers').then((marketers) => {
                Dispatcher.dispatch({
                    type: 'ON_GET_MARKETERS',
                    marketers: marketers
                });
            });
        },
        getLanguages: function() {
            api.get('/marketplace/languages').then((languages) => {
                Dispatcher.dispatch({
                    type: 'ON_GET_LANGUAGES',
                    languages: languages
                });
            });
        },
        toggleFilter: function(filters, type, value) {
            if (filters && filters[type] === value) {
                filters = _.omit(filters, type);
            } else {
                filters[type] = value;
            }

            var params = {
                where: filters,
                sort: '-start_date'
            };

            api
                .get('/marketplace/blogs', params)
                .then((blogs) => {
                    Dispatcher.dispatch({
                        type: 'ON_GET_BLOGS',
                        blogs: blogs,
                        filters: filters
                    });
                })
                .catch((error) => {
                    Dispatcher.dispatch({
                        type: 'ON_GET_BLOGS',
                        blogs: {_items: {}},
                        filters: filters
                    });
                });
        },
        togglePanel: function(value) {
            Dispatcher.dispatch({
                type: 'ON_TOGGLED_PANEL',
                searchPanel: value
            });
        },
        openEmbedModal: function(blog) {
            Dispatcher.dispatch({
                type: 'ON_TOGGLED_MODAL',
                embedModal: true,
                currentBlog: blog
            });
        },
        closeEmbedModal: function() {
            Dispatcher.dispatch({
                type: 'ON_TOGGLED_MODAL',
                embedModal: false,
                currentBlog: {}
            });
        }
    };
}
