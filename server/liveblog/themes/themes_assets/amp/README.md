# Liveblog 3 AMP Theme (beta)

[![Build Status](https://travis-ci.org/liveblog/liveblog-amp-theme.svg?branch=master)](https://travis-ci.org/liveblog/liveblog-amp-theme)

AMP (Accelerated Mobile Pages) Live Blog Theme, based on Liveblog 3 SEO Theme.

## Compatibility
This theme requires Live Blog version 3.3 or higher.

## Supported features and post types
Be aware that the Liveblog3 AMP Theme is a beta version that is yet lacking a few features:
- There are no sorting or filtering options available such as "newest first", "oldest first" or "highlights". Latest post will always show up on top.
- There is no paging available yet. Make sure to set the number of posts per page in the theme settings to a high number.
- Posts of type advertisement and "free types" are not yet supported. Advertisements will not show up.
- Embeds for the following social media sources are properly supported: Twitter, Youtube, Facebook, Instagram. Make sure to just paste in a URL, not a code snippet.
- Image galleries are supported, if all items of a post are image items.
- The commenting feature is not yet supported.

## Develop

The best starting point for the development of custom theme extensions is our Wiki: https://wiki.sourcefabric.org/x/wICrB

--

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
