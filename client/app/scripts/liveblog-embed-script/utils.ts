export const messageIframe = (message: string, data: any) => {
    const msg = { type: message };

    if (data) {
        msg['data'] = data;
    }

    messageIframePlain(msg);
};

export const messageIframePlain = (msg: any) => {
    const liveblogEmbed: HTMLIFrameElement = document.querySelector('#liveblog-iframe');

    if (liveblogEmbed) {
        liveblogEmbed.contentWindow.postMessage(msg, '*');
    } else {
        console.log('liveblog iframe not found', msg); // eslint-disable-line
    }
};

export const loadScript = (src: string, cb: () => void) => {
    const a = document,
        l = a.createElement('script'),
        o = a.getElementsByTagName('script')[0];

    return l.type = 'text/javascript', l.onload = cb, l.async = !0, l.src = src, o.parentNode.insertBefore(l, o), l;
};
