const superdeskRules = require('superdesk-code-style');

module.exports = Object.assign({}, superdeskRules, {
    parser: '@typescript-eslint/parser',
    overrides: [
        {
            plugins: [
                '@typescript-eslint/tslint',
            ],
            files: ['*.ts', '*.tsx'],
            parserOptions: {
                sourceType: 'module',
                project: './tsconfig.json'
            },
            rules: {
                '@typescript-eslint/tslint/config': [1, {
                    lintFile: './tslint.json',
                }]
            }
        }
    ]
});