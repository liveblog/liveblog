const CONSENT_KEY = '__lb_consent_key__';
const CONSENT_LIFE_DAYS = 365;
var liveblogEmbed: HTMLIFrameElement = null;

class LBStorage {
    static read(name) {
        const itemStr = localStorage.getItem(name);

        // if the item doesn't exist, return null
        // tslint:disable-next-line:curly
        if (!itemStr)
            return null;

        const item = JSON.parse(itemStr);
        const now = new Date();

        // compare the expiry time of the item with the current time
        if (now.getTime() > item.expiry) {
            // If the item is expired, delete the item from storage
            // and return null
            localStorage.removeItem(name);
            return null;
        }

        return item.value;
    }

    static write(name, value, days) {
        const date = new Date();

        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

        // `item` is an object which contains the original value
        // as well as the time when it's supposed to expire
        const item = {
            value: value,
            expiry: date.getTime(),
        };

        localStorage.setItem(name, JSON.stringify(item));
    }
}

const beginHandshake = (e) => {
    liveblogEmbed = document.querySelector('#liveblog-iframe');
    const consentGiven = LBStorage.read(CONSENT_KEY);

    console.log('sending msg to', liveblogEmbed); // eslint-disable-line

    liveblogEmbed.contentWindow.postMessage({
        type: 'sync-consent-given', data: consentGiven }, '*');
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
