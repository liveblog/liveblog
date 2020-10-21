import { messageIframe } from '../utils';

export enum Event {
    Init = 'permalink_init',
    SendUrl = 'permalink_url',
}

export const init = () => {
    messageIframe(Event.SendUrl, document.location.href);
};

const escapeRegExp = (string) => {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1'); // eslint-disable-line
};

export const getSharedPost = () => {
    let postId;
    const PARAM_NAME = 'liveblog._id'; // the parameter name for permalink.
    const sharedPostUrlRegex = new RegExp(escapeRegExp(PARAM_NAME) + '=([^&#]*)');
    const url = document.location.href;
    const matches = url.match(sharedPostUrlRegex);

    if (matches) {
        postId = decodeURIComponent(matches[1]).split('__')[0];
    }

    return postId;
};
