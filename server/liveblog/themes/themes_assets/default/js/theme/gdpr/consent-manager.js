import {Storage} from '../common/storage';

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
        window.addEventListener('message', ConsentManager.handleEnhancerMessage, false);
        window.parent.postMessage({type: 'init_consent'}, '*');

        ConsentManager.options = options;
    }

    static handleEnhancerMessage = (event) => {
        const {type} = event.data;

        if (type)
            console.log('Received msg in iframe', event.data); // eslint-disable-line

        switch (type) {
            case 'sync-consent-given':
                Storage.write(CONSENT_KEY, event.data.data, CONSENT_LIFE_DAYS);
                ConsentManager.options.onSync();
                break;
            default:
                break;
        }
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
