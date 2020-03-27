var cookiesEnabler = require('cookies-enabler');

const COOKIE_NAME = '__lb_consent_cookie__';
const COOKIE_LIFE_DAYS = 365;
const CONSENT_SUBJECTS_SELECTOR = 'template.lb_consent--awaiting';
const CONSENT_PLACEHOLDER_TMPL = 'template#lb_consent--placeholder-tmpl';
const PLACEHOLDER_SELECTOR = 'lb_consent--placeholder';

// TODO: probably get rid of this plugin. For now temptatively
// will be used for scripts loading
const wireCookiesEnabler = () => {

    if (isConsentGiven())
        return;

    cookiesEnabler.init({
        // scriptClass: 'lb_consent--script',

        acceptClass: 'lb-content--accept',
        // dismissClass: 'ce-dismiss',
        // disableClass: 'ce-disable',

        eventScroll: false,
        clickOutside: false,

        cookieName: COOKIE_NAME,
        cookieDuration: COOKIE_LIFE_DAYS,
        wildcardDomain: true,

        // I'll take care of iframes myself
        iframesPlaceholder: false,
        bannerHTML: ' ',

        // Callbacks
        onEnable: () => {
            checkAndHandlePlaceholders();
        },
        // onDismiss: '',
        // onDisable: ''
    });
};

const getCookieValue = (a) => {
    // eslint-disable-next-line newline-after-var
    let b = document.cookie.match('(^|[^;]+)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
};

const isConsentGiven = () => getCookieValue(COOKIE_NAME) === 'Y';

const getNodesAwaitingConsent = () => document.querySelectorAll(CONSENT_SUBJECTS_SELECTOR);

const checkAndHandlePlaceholders = () => {
    const embedNodes = getNodesAwaitingConsent();

    console.log(isConsentGiven());

    if (isConsentGiven()) {
        embedNodes.forEach((embed) => {
            const prev = embed.previousElementSibling;

            if (prev && prev.classList.contains(PLACEHOLDER_SELECTOR))
                prev.remove();

            embed.replaceWith(embed.content);
        });

        setTimeout(() => {
            instgrm.Embeds.process();
            twttr.widgets.load();
        }, 500);
    } else {
        const placeholder = document.querySelector(CONSENT_PLACEHOLDER_TMPL);

        embedNodes.forEach((embed) => {
            const clone = placeholder.content.cloneNode(true);
            const parent = embed.parentNode;

            if (!embed.hasAttribute('data-no-placeholder'))
                parent.insertBefore(clone, embed);
        });

        wireCookiesEnabler();
    }
};

module.exports = {
    init: () => {
        wireCookiesEnabler();
        checkAndHandlePlaceholders();
    },

    wireCookiesEnabler: wireCookiesEnabler
};
