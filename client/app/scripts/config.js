require.config({
    baseUrl: './scripts/',
    paths: {
        d3: 'bower_components/d3/d3',
        jquery: 'bower_components/jquery/dist/jquery',
        lodash: 'bower_components/lodash/lodash',
        angular: 'bower_components/angular/angular',
        bootstrap: 'bower_components/bootstrap/dist/js/bootstrap',
        moment: 'bower_components/momentjs/moment',
        bower_components: 'bower_components/',
        underscore: 'bower_components/underscore/underscore-min',
        'angular-ui': 'bower_components/angular-bootstrap/ui-bootstrap-tpls',
        'angular-resource': 'bower_components/angular-resource/angular-resource',
        'angular-route': 'bower_components/angular-route/angular-route',
        'angular-gettext': 'bower_components/angular-gettext/dist/angular-gettext',
        'angular-mocks': 'bower_components/angular-mocks/angular-mocks',
        'angular-file-upload': 'bower_components/ng-file-upload/angular-file-upload',
        'angular-file-upload-shim': 'bower_components/ng-file-upload/angular-file-upload-shim',
        'angular-slider': 'bower_components/angular-slider-royale/angular-slider',
        'angular-embed': 'bower_components/angular-embed/dist/angular-embed',
        'angular-embedly': 'bower_components/angular-embedly/em-minified/angular-embedly.min',

        'superdesk': 'bower_components/superdesk/client/app/scripts/superdesk',
        'superdesk-settings': 'bower_components/superdesk/client/app/scripts/superdesk-settings',
        'superdesk-dashboard': 'bower_components/superdesk/client/app/scripts/superdesk-dashboard',

        'moment-timezone': 'bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020',

        'raven-js': 'bower_components/raven-js/dist/raven',
        'jquery-ui': 'bower_components/jquery-ui/jquery-ui',
        'eventable': 'bower_components/Eventable/eventable',
        'sir-trevor': 'bower_components/sir-trevor-js/sir-trevor.min',
        'ng-sir-trevor': 'bower_components/ng-sir-trevor/dist/ng-sir-trevor'
    },
    shim: {
        jquery: {exports: 'jQuery'},
        d3: {exports: 'd3'},

        angular: {
            deps: ['jquery'],
            exports: 'angular'
        },
        'sir-trevor': {
            deps: ['jquery', 'eventable', 'underscore'],
            exports: 'SirTrevor'
        },
        'ng-sir-trevor': {
            deps: ['sir-trevor', 'angular']
        },
        'angular-embedly': ['angular'],
        'raven-js': {exports: 'Raven'},
        'angular-resource': ['angular'],
        'angular-route': ['angular'],
        'angular-gettext': ['angular'],
        'angular-mocks': ['angular'],
        'angular-file-upload': ['angular', 'angular-file-upload-shim'],

        'translations': ['angular-gettext'],
        'angular-ui': ['angular', 'bootstrap'],
        'angular-slider': ['angular'],
        'angular-embed': ['angular', 'angular-embedly'],

        'bootstrap': ['jquery'],
        'jquery-ui': ['jquery'],
        'bower_components/jcrop/js/jquery.Jcrop': ['jquery']
    }
});
