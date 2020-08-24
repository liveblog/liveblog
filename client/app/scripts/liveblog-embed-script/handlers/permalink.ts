import { messageIframe } from '../utils';

export enum Event { /* eslint-disable no-unused-vars */
    Init = 'permalink_init',
    SendUrl = 'permalink_url',
}

export const setupUrl = () => {
    const liveblogEmbed: HTMLIFrameElement = document.querySelector('#liveblog-iframe');

    if (liveblogEmbed) {
        liveblogEmbed.setAttribute('parent_url', document.location.href);
    }
};

export const init = () => {
    messageIframe(Event.SendUrl, document.location.href);
    setupUrl();
};
