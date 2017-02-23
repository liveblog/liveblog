# Liveblog 3 Lean Theme
Goals for this rewrite: Be usable, indexable and fast.    
We got a fraction of the lines of code, faster DOM ready, enabled SEO through template isomorphism.
Development is possible without the local Liveblog server running, the directory tree is simplified,
we're making heavy use of a build system and drastically reduced dependencies. The theme is written in vanilla ES5.

## Develop
Just issue a `npm i` followed by `gulp watch-static`.    
Development server is up and running at `localhost:8008`.    
Entry point for Browserify is `js/liveblog.js`.

## Build
Use `make` or alternatively zip this directory without the `node_modules` and `.git` folders.

## Documentation
Generate documentation via `jsdoc`.

## License
This is a hard fork of the Liveblog 3 angular, classic themes => https://github.com/liveblog   
Liveblog 3 is licensed under AGPL v3, as is this theme.
   
*© 2016-2017 dpa-infocom*
