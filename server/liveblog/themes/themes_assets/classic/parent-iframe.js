liveblog.loadCallback = function() {
    function callbackJquery() {
        liveblog.load("https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/3.5.5/iframeResizer.min.js", function() {
            var iframe = $('#liveblog-iframe');
            iFrameResize({
                minHeight: 1000
            });
            var reached = false;
            var detectEndOfBlog = function() {
                if ($(window).scrollTop() > iframe.height() + iframe.offset().top - 50 - $(window).height()) {
                    if (reached) {
                        return;
                    }
                    iframe.get(0).contentWindow.postMessage('loadMore', '*');
                    reached = true;
                } else {
                    reached = false;
                }
            };
            $(window).scroll(detectEndOfBlog);
        });
    };

    if (typeof jQuery === "undefined") {
        liveblog.load("https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js", callbackJquery);
    } else {
        // maybe add version support here.
        callbackJquery();
    }
};