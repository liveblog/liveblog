# dpa Liveblog Embed Codes
## Minimal embed
Does resizing in scrolling=no situation via hacky window.innerHeight that equals the parent iframe height during contentloaded:
```
<iframe src="" data-szm-st="" data-szm-cp="" data-szm-co="" data-ga-property="" frameborder=0 width="100%" height="600" style="overflow: hidden; border: 0; min-width: 320px;"><p>Ihr Browser unterstützt keine iframes.</p></iframe>
```

## Analytics embed
Does resizing in scrolling=no situation via hacky window.innerHeight that equals the parent iframe height during contentloaded:
```
<iframe src="" data-szm-st="" data-szm-cp="" data-szm-co="" data-ga-property="" onload="var lb_frame = this; this.contentWindow.postMessage({type: 'analytics', payload: JSON.stringify(lb_frame.dataset)}, lb_frame.src);" frameborder=0 width="100%" height="600" style="overflow: hidden; border: 0; min-width: 320px;"><p>Ihr Browser unterstützt keine iframes.</p></iframe>
```

## Analytics and iframe dynamic height
Does resizing via postMessage from iframe to parent.

```
<iframe class="liveblog-iframe" src="http://localhost:8000/index.html" data-szm-st="foo-szm-st" data-szm-cp="foo-szm-cp" data-szm-co="foo-szm-co" data-ga-property="UA-foo" onload="var lb_frame = this; this.contentWindow.postMessage({type: 'analytics', payload: JSON.stringify(lb_frame.dataset)}, lb_frame.src); this.contentWindow.postMessage({type: 'useParentResize'}, lb_frame.src); function msg(e) {
if (!e.data.type === 'resizeIframe') return; var lb_frame = document.getElementsByClassName('liveblog-iframe')[0]; lb_frame.height = e.data.updatedHeight; } window.addEventListener('message', msg, false);" scrolling=no frameborder=0 width="720px" height="800" style="max-width: 720px; overflow: hidden; border:0;margin: 0px auto;"><p>Ihr Browser unterstützt keine iframes.</p></iframe>
```
