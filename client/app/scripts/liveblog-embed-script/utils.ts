export const messageIframe = (message: string, data: any) => {
    const msg = { type: message };

    if (data) {
        msg['data'] = data;
    }

    const liveblogEmbed: HTMLIFrameElement = document.querySelector('#liveblog-iframe');

    if (liveblogEmbed) {
        // console.log('sending msg to', liveblogEmbed); // eslint-disable-line
        liveblogEmbed.contentWindow.postMessage(msg, '*');
    }
};
