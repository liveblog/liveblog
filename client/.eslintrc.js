const superdeskRules = require('superdesk-code-style');

module.exports = Object.assign({}, superdeskRules, {
    'globals': Object.assign({}, superdeskRules.globals, {
        '__SUPERDESK_CONFIG__': 'readonly',
    }),
    'overrides': [
        {
            files: ['*.ts', '*.tsx'],
            plugins: [
                '@typescript-eslint'
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: './tsconfig.json'
            },
            rules: {
                'arrow-body-style': 0,
                'react/prop-types': 0,
                'object-curly-spacing': [2, 'always'],
                'no-empty-function': [2, { 'allow': ['arrowFunctions'] }],
                'no-unused-vars': 0,
                "@typescript-eslint/no-unused-vars-experimental": 2
            }
        }
    ]
});
