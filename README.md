# dpa Liveblog Theme
Derived from Sourcefabric Angular Theme, merges all embed dependencies
into one. This way we gain full control over the build process and
allow debugging the theme in isolation without having
to run a whole fleet of containers needed by the Liveblog Environment.
Downside

# Install
Just issue a `npm i` followed by `gulp`.
Assets are then bundled into single .js and .css files, an index.html is generated
for debugging purposes by injecting hardcoded settings around `template.html` -- emulating
what would normally be handled by Liveblog Server.
Serve via `python -m SimpleHTTPServer` or equivalent

# Build Notes
Use `make` or alternatively zip this directory without the `node_modules`
and `.git` folders before uploading to LiveBlog.

# Synced with Sourcefabric
incorporates all of  
`github.com/liveblog/lb-theme-classic@2.3.9`  
`github.com/liveblog/lb-theme-angular@1.4.7`  