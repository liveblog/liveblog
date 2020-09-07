import {Storage} from '../common/storage';
import * as messages from '../common/messages';

const CONSENT_KEY = '__lb_consent_key__';
const CONSENT_LIFE_DAYS = 365;

class ConsentManager {

    options = {
        onSync: () => {}
    };

    static get isIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    static start(options) {
        messages.listen('sync-consent-given', (data) => {
            Storage.write(CONSENT_KEY, data, CONSENT_LIFE_DAYS);
            ConsentManager.options.onSync();
        });

        messages.send('init_consent');

        ConsentManager.options = options;
    }

    static isConsentGiven() {
        return Storage.read(CONSENT_KEY) === 'Y';
    }

    static acceptConsent = () => {
        Storage.write(CONSENT_KEY, 'Y', CONSENT_LIFE_DAYS);
        window.parent.postMessage({type: 'accept_consent'}, '*');
    }
}

export {ConsentManager};
