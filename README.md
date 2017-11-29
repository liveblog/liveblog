# Liveblog 3 SEO Theme

User-friendly, indexable and fast Liveblog theme. 

## Compatibility
This theme requires Live Blog version 3.3 or higher. 

## Develop

The best starting point for the development of custom theme extensions is our Wiki: https://wiki.sourcefabric.org/x/wICrB

--

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

### Full screen in the parent page

When embedding liveblog, you want to have to have the fullscreen mode the slideshow taking all the available space. For this you need to modify the embed code as follow:

```html
<iframe id="liveblog-iframe" width="100%" height="715" src="http://localhost:8008/" frameborder="0" allowfullscreen></iframe>
<script type="text/javascript">
  var liveblog = document.getElementById('liveblog-iframe')

  liveblog.addEventListener('load', () => {
    var receiver = liveblog.contentWindow;
    var url = liveblog.getAttribute('src');

    receiver.postMessage(window.location.href, url);

    window.addEventListener('message', function(e) {
      if (e.data === 'fullscreen') {
        liveblog.style.cssText = 'position: fixed; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%';
      } else {
        liveblog.style.cssText = '';
      }
    });
  });
</script>
```

or the compressed version:

```html
<iframe id="liveblog-iframe" width="100%" height="715" src="http://localhost:8008/" frameborder="0" allowfullscreen></iframe>
<script type="text/javascript">
var l=document.getElementById("liveblog-iframe");l.addEventListener("load",function(){var t=l.contentWindow,e=l.getAttribute("src");t.postMessage(window.location.href,e),window.addEventListener("message",function(t){"fullscreen"===t.data?l.style.cssText="position:fixed;top:0;bottom:0;left:0;right:0;width:100%;height: 100%":l.style.cssText=""})});
</script>
```

## License

Liveblog 3 is licensed under AGPL v3, as is this theme.
