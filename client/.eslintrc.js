const superdeskRules = require('superdesk-code-style');

module.exports = Object.assign({}, superdeskRules, {
    'overrides': [
        {
            files: ['*.ts', '*.tsx'],
            plugins: [
                '@typescript-eslint/tslint',
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: './tsconfig.json'
            },
            rules: {
                '@typescript-eslint/tslint/config': [2, {
                    lintFile: './tslint.json',
                }],
                'arrow-body-style': 0,
                'react/prop-types': 0,
                'object-curly-spacing': [2, 'always'],
                'no-empty-function': [2, { 'allow': ['arrowFunctions'] }]
            }
        }
    ]
});
