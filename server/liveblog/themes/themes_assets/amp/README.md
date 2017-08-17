# Liveblog 3 AMP Theme

[![Build Status](https://travis-ci.org/liveblog/liveblog-amp-theme.svg?branch=master)](https://travis-ci.org/liveblog/liveblog-amp-theme)

AMP (Accelerated Mobile Pages) Live Blog Theme, based on Liveblog 3 SEO Theme.

## Develop

Just issue a `npm i` followed by `gulp watch-static`.

CSS assets are included in main `index.html` as inline html as AMP doesn't allow
to include any external CSS or Javascript File.

To validate AMP-compatible markup please run `gulp amp-validate`.

Development server is listening by default to `localhost:8008`.

## Build

Use `make` or alternatively zip this directory without the `node_modules` and `.git` folders.

## Documentation

Generate documentation via `jsdoc`.

## License

Liveblog 3 is licensed under AGPL v3, as is this theme.
