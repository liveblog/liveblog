export default {
    server: {
        url: 'http://localhost:5000/api',
        ws: 'ws://localhost:5100'
    },
    syndication: true,
    editor: {
        disableEditorToolbar: false
    },
    syndication: true,
    marketplace: true,
    themeCreationRestrictions: {team: 3},
    excludedTheme: 'angular',
    assignableUsers: {
        solo: 3,
        team: 5
    },
    subscriptionLevel: process.env.SUBSCRIPTION_LEVEL || '',
    blogCreationRestrictions: {
        solo: 1,
        team: 3
    },
    analytics: {
        piwik: '',
        ga: ''
    },
    embedly: {
        key: ''
    },
    // model date and time formats
    model: {
        dateformat: 'DD/MM/YYYY',
        timeformat: 'HH:mm:ss'
    },
};
