import LBStorage from '../../liveblog-common/storage';
import { messageIframe } from '../utils';

const CONSENT_KEY = '__lb_consent_key__';
const CONSENT_LIFE_DAYS = 365;

export enum Message { /* eslint-disable no-unused-vars */
    Init = 'init_consent',
    Accept = 'accept_consent',
    Sync = 'sync-consent-given',
}

export const init = () => {
    const consentGiven = LBStorage.read(CONSENT_KEY);

    messageIframe(Message.Sync, consentGiven);
};

export const accept = () => {
    LBStorage.write(CONSENT_KEY, 'Y', CONSENT_LIFE_DAYS);
};
