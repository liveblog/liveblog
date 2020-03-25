var cookiesEnabler = require('cookies-enabler');

const COOKIE_NAME = '__lb_consent_cookie__';
const COOKIE_LIFE_DAYS = 365;
const CONSENT_SUBJECTS_SELECTOR = 'template.consent_awaiting';

// TODO: probably get rid of this plugin. For now temptatively
// will be used for scripts loading
const setupCookiesEnabler = () => {
    cookiesEnabler.init({
        scriptClass: 'lb_consent--script',
        iframeClass: 'lb_consent--iframe',

        acceptClass: 'ce-accept',
        dismissClass: 'ce-dismiss',
        disableClass: 'ce-disable',

        bannerClass: 'ce-banner',
        bannerHTML: ' ',
        eventScroll: false,

        scrollOffset: 200,

        clickOutside: false,

        cookieName: COOKIE_NAME,
        cookieDuration: COOKIE_LIFE_DAYS,
        wildcardDomain: true,

        iframesPlaceholder: true,
        iframesPlaceholderHTML:
            '<p>This content is not available without cookies. <a href=#" class="ce-accept">Enable Cookies</a>"</p>',
        iframesPlaceholderClass: 'lb_consent--iframe-placeholder',

        // Callbacks
        onEnable: () => {
            checkAndSetPlaceholders();
        },
        onDismiss: '',
        onDisable: ''
    });
};

const getCookieValue = (a) => {
    // eslint-disable-next-line newline-after-var
    let b = document.cookie.match('(^|[^;]+)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
};

const isConsentGiven = () => getCookieValue(COOKIE_NAME) === 'Y';

const getNodesAwaitingConsent = () => document.querySelectorAll(CONSENT_SUBJECTS_SELECTOR);

const checkAndSetPlaceholders = () => {
    const embedNodes = getNodesAwaitingConsent();

    if (!isConsentGiven()) {
        const placeholder = document.querySelector('template#lb_consent-placeholder-tmpl');

        embedNodes.forEach((embed) => {
            const clone = placeholder.content.cloneNode(true);
            const parent = embed.parentNode;

            parent.insertBefore(clone, embed);
            setupCookiesEnabler();
        });
    } else {
        embedNodes.forEach((embed) => {
            const prev = embed.previousElementSibling;

            if (prev && prev.classList.contains('lb_consent-placeholder')) {
                prev.remove();
            }

            embed.replaceWith(embed.content);
        });
    }
};

module.exports = {

    init: () => {
        // first step to setup the cookies plugin
        setupCookiesEnabler();

        checkAndSetPlaceholders();
    }
};
