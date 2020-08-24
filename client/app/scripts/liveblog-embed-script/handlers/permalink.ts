import { messageIframe } from '../utils';

export enum Event { /* eslint-disable no-unused-vars */
    Init = 'permalink_init',
    SendUrl = 'permalink_url',
}

export const init = () => {
    messageIframe(Event.SendUrl, document.location.href);
};
