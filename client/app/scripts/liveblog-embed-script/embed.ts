import LBStorage from './storage';
import { messageIframe } from './utils';

const CONSENT_KEY = '__lb_consent_key__';
const CONSENT_LIFE_DAYS = 365;

const beginHandshake = (e) => {
    const consentGiven = LBStorage.read(CONSENT_KEY);

    messageIframe('sync-consent-given', consentGiven);
};

const handleMessages = (event: MessageEvent) => {
    const { type } = event.data;

    if (type) {
        console.log('Message received', type); // eslint-disable-line
    }

    switch (event.data.type) {
    case 'init_consent':
        beginHandshake(event);
        break;
    case 'accept_consent':
        LBStorage.write(CONSENT_KEY, 'Y', CONSENT_LIFE_DAYS);
        break;
    default:
        break;
    }
};

window.addEventListener('message', handleMessages, false);
