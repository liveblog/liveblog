/* eslint-disable curly */
const CONSENT_KEY = '__lb_consent_key__';
const CONSENT_LIFE_DAYS = 365;
const CONSENT_SUBJECTS_SELECTOR = 'template.lb_consent--awaiting';
const CONSENT_PLACEHOLDER_TMPL = 'template#lb_consent--placeholder-tmpl';
const PLACEHOLDER_SELECTOR = 'lb_consent--placeholder';


class Storage {
    static read = (name) => {
        var itemStr = localStorage.getItem(name);

        // if the item doesn't exist, return null
        if (!itemStr)
            return null;

        var item = JSON.parse(itemStr);
        var now = new Date();

        // compare the expiry time of the item with the current time
        if (now.getTime() > item.expiry) {
            // If the item is expired, delete the item from storage
            // and return null
            localStorage.removeItem(name);
            return null;
        }

        return item.value;
    };

    static write = (name, value, days) => {
        var date = new Date();

        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));

        // `item` is an object which contains the original value
        // as well as the time when it's supposed to expire
        var item = {
            value: value,
            expiry: date.getTime(),
        };

        localStorage.setItem(name, JSON.stringify(item));
    };

}

const wireCookiesEnabler = () => {
    if (isConsentGiven())
        return;

    const acceptBtns = document.getElementsByClassName('lb_consent--accept');

    if (acceptBtns.length > 0) {
        Array.from(acceptBtns).forEach((btn) => {
            btn.addEventListener('click', (ev) => {
                ev.preventDefault();

                Storage.write(CONSENT_KEY, 'Y', 365);
                checkAndHandlePlaceholders();
            });
        });
    }
};

const isConsentGiven = () => Storage.read(CONSENT_KEY) === 'Y';

const getNodesAwaitingConsent = () => document.querySelectorAll(CONSENT_SUBJECTS_SELECTOR);

const domainRequiresConsent = (providerUrl, node) => {
    let domains = LB.settings.gdprConsentDomains;
    let requiresConsent = false;

    if (domains.length > 0) {
        // get domains and remove possible blank spaces
        domains = domains.split(',');
        domains = domains.map((x) => x.trim().toLowerCase());

        if (providerUrl) {
            let embedDomain = new URL(providerUrl).hostname;

            embedDomain = embedDomain.replace('www.', '');
            requiresConsent = domains.indexOf(embedDomain) !== -1;
        } else {
            // NOTE: there are cases of embeds made from the mobile app
            // that there are no providerUrl attribute in meta data
            // let's try to handle them here
            let embedContent = node.content.children[0].innerHTML;

            if (embedContent.indexOf('iframe') > -1 || embedContent.indexOf('script') > -1) {
                domains.forEach((d) => {
                    var domain = d.replace('www.', '');

                    if (embedContent.indexOf(domain) > -1) {
                        requiresConsent = true;
                    }
                });
            }
        }
    }

    return requiresConsent;
};

const exposeContent = (embedNode) => {
    const prev = embedNode.previousElementSibling;

    if (prev && prev.classList.contains(PLACEHOLDER_SELECTOR))
        prev.remove();

    embedNode.replaceWith(embedNode.content);
};

const checkAndHandlePlaceholders = () => {
    const embedNodes = getNodesAwaitingConsent();

    if (LB.settings.enableGdprConsent && !isConsentGiven()) {
        const placeholder = document.querySelector(CONSENT_PLACEHOLDER_TMPL);

        embedNodes.forEach((embed) => {
            const providerUrl = embed.getAttribute('data-provider-url');

            if (!domainRequiresConsent(providerUrl, embed)) {
                exposeContent(embed);
                return;
            }

            const clone = placeholder.content.cloneNode(true);
            const parent = embed.parentNode;
            const prev = embed.previousElementSibling;

            // if placeholder is already there or if skip is provided
            if (prev && prev.classList.contains(PLACEHOLDER_SELECTOR) || embed.hasAttribute('data-no-placeholder'))
                return;

            parent.insertBefore(clone, embed);
        });

        wireCookiesEnabler();
    } else {
        embedNodes.forEach(exposeContent);

        setTimeout(() => {
            try{
                instgrm.Embeds.process();
            } catch(err) {console.log('instgrm script not ready')}

            try{
                twttr.widgets.load();
            } catch(err) {console.log('twttr script not ready')}
        }, 500);
    }
};

module.exports = {
    init: () => {
        wireCookiesEnabler();
        checkAndHandlePlaceholders();
    },

    wireCookiesEnabler: wireCookiesEnabler
};
