# Liveblog 3 SEO Theme

User-friendly, indexable and fast Liveblog theme.

## Develop

Just issue a `npm i` followed by `gulp watch-static`.    
Development server is up and running at `localhost:8008`.    
Entry point for Browserify is `js/liveblog.js`.

you can also point to an existing liveblog api entry point by add a `--embedUrl` param.

```shell
gulp watch-static --embedUrl http://undefined.local:5000/embed/592ec5d15e543257f9f6ffc6
```

## Build

Use `make` or alternatively zip this directory without the `node_modules` and `.git` folders.

## Documentation

Generate documentation via `jsdoc`.

## License

Liveblog 3 is licensed under AGPL v3, as is this theme.
