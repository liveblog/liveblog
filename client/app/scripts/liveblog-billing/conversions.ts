import { apiGet } from '../liveblog-common/api';

/**
 * Google Ads conversion tracking (LBSD-2984). The tag only loads for visitors
 * with a Google Ads click cookie, which liveblog.pro sets on the shared
 * `.liveblog.pro` domain.
 */

interface IGoogleAds {
    tagId: string;
    signupLabel: string;
    purchaseLabel: string;
}

interface ICheckoutValue {
    value: number;
    currency: string;
}

// `_gcl_gb` holds the click id of iOS app-to-web clicks (gbraid).
const GOOGLE_CLICK_COOKIES = ['_gcl_aw', '_gcl_gb'];
const CHECKOUT_VALUE_KEY = 'liveblog:checkout-value';

let googleAds: IGoogleAds | null = null;

const hasGoogleClick = (): boolean => document.cookie
    .split(';')
    .some((cookie) => GOOGLE_CLICK_COOKIES.indexOf(cookie.trim().split('=')[0]) !== -1);

// gtag.js only reads Arguments objects from the data layer, not arrays, so
// this cannot take rest parameters or be an arrow function.
// tslint:disable-next-line:only-arrow-functions
function gtag(..._args: any[]) {
    const w = window as any;

    w.dataLayer = w.dataLayer || [];
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
}

export const initConversions = (config: any): void => {
    const ads = config && config.google_ads;

    if (googleAds || !ads || !ads.tag_id || !hasGoogleClick()) {
        return;
    }

    googleAds = {
        tagId: ads.tag_id,
        signupLabel: ads.signup_label,
        purchaseLabel: ads.purchase_label,
    };
    gtag('js', new Date());
    gtag('config', googleAds.tagId);

    const script = document.createElement('script');

    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAds.tagId)}`;
    document.head.appendChild(script);
};

const sendConversion = (label: string, params: {[key: string]: any} = {}): void => {
    if (!googleAds || !label) {
        return;
    }

    try {
        gtag('event', 'conversion', { ...params, send_to: `${googleAds.tagId}/${label}` });
    } catch (error) {
        // tracking must never break the signup or checkout flow
    }
};

export const trackSignup = (): void => {
    sendConversion(googleAds ? googleAds.signupLabel : '');
};

/**
 * The Checkout return is a new page load in the same tab, so session storage
 * carries the price across.
 */
export const rememberCheckoutValue = (value: number, currency: string): void => {
    try {
        sessionStorage.setItem(CHECKOUT_VALUE_KEY, JSON.stringify({ value, currency }));
    } catch (error) {
        // storage unavailable: the purchase is reported without a value
    }
};

const takeCheckoutValue = (): ICheckoutValue | null => {
    try {
        const stored = sessionStorage.getItem(CHECKOUT_VALUE_KEY);

        sessionStorage.removeItem(CHECKOUT_VALUE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        return null;
    }
};

/**
 * Reports a purchase on return from a paid Checkout. Must run before Angular
 * bootstraps: it strips the return params so `$location` never sees them and a
 * reload cannot report twice.
 */
export const trackCheckoutReturn = (): void => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (params.get('checkout') !== 'success' || !sessionId) {
        return;
    }

    params.delete('checkout');
    params.delete('session_id');

    const query = params.toString();

    window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + (query ? `?${query}` : '') + window.location.hash
    );

    const checkoutValue = takeCheckoutValue();

    if (!hasGoogleClick()) {
        return;
    }

    apiGet('/billing/config', { anonymous: true })
        .then((config) => {
            initConversions(config && config.conversions);

            const purchase: {[key: string]: any} = { transaction_id: sessionId };

            if (checkoutValue) {
                purchase.value = checkoutValue.value;
                purchase.currency = checkoutValue.currency.toUpperCase();
            }

            sendConversion(googleAds ? googleAds.purchaseLabel : '', purchase);
        })
        .catch(() => undefined);
};
