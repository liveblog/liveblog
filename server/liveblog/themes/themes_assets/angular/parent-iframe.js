if(typeof liveblog !== 'undefined') {
    liveblog.loadCallback = function() {
        var timer = null;
        function debounce(fn,time){
            if (null === timer){
                timer = setTimeout(function(){
                    timer = null;
                    fn();
                }, time);
            }
        }
        function callbackJquery() {
            liveblog.load("https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/3.5.14/iframeResizer.min.js", function() {
                var iframe = jQuery('#liveblog-iframe');
                iFrameResize({
                    minHeight: 1000,
                    heightCalculationMethod: 'lowestElement'
                }, iframe[0]);
                var reached = false;
                var detectEndOfBlog = function() {
                    if (jQuery(window).scrollTop() > iframe.height() + iframe.offset().top - 50 - jQuery(window).height()) {
                        if (reached) {
                            return;
                        }
                        iframe.get(0).contentWindow.postMessage('loadMore', '*');
                        reached = true;
                    } else {
                        reached = false;
                    }
                };
                jQuery(window).scroll(function(){
                    debounce(detectEndOfBlog, 200, true);
                });
            });
        };
        if (typeof jQuery === "undefined") {
            liveblog.load("https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js", callbackJquery);
        } else {
            // maybe add version support here.
            callbackJquery();
        }
    };
}