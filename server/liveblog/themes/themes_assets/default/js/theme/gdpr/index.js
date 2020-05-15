/* eslint-disable curly */
import {ConsentManager} from './consent-manager';
import {domainRequiresConsent} from './helpers';

const CONSENT_SUBJECTS_SELECTOR = 'template.lb_consent--awaiting';
const CONSENT_PLACEHOLDER_TMPL = 'template#lb_consent--placeholder-tmpl';
const PLACEHOLDER_SELECTOR = 'lb_consent--placeholder';

const getNodesAwaitingConsent = () => document.querySelectorAll(CONSENT_SUBJECTS_SELECTOR);

const wireCookiesEnabler = () => {
    if (ConsentManager.isConsentGiven())
        return;

    const acceptBtns = document.getElementsByClassName('lb_consent--accept');

    if (acceptBtns.length > 0) {
        Array.from(acceptBtns).forEach((btn) => {
            btn.addEventListener('click', (ev) => {
                ev.preventDefault();

                ConsentManager.acceptConsent();
                checkAndHandlePlaceholders();
            });
        });
    }
};

const exposeContent = (embedNode) => {
    const prev = embedNode.previousElementSibling;

    if (prev && prev.classList.contains(PLACEHOLDER_SELECTOR))
        prev.remove();

    embedNode.replaceWith(embedNode.content);
};

const checkAndHandlePlaceholders = () => {
    const embedNodes = getNodesAwaitingConsent();

    if (LB.settings.enableGdprConsent && !ConsentManager.isConsentGiven()) {
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
            try {
                instgrm.Embeds.process();
            } catch (err) {
                console.log('instgrm script not ready'); // eslint-disable-line
            }

            try {
                twttr.widgets.load();
            } catch (err) {
                console.log('twttr script not ready'); // eslint-disable-line
            }
        }, 500);
    }
};

ConsentManager.start({
    onSync: () => {
        checkAndHandlePlaceholders();
        console.log('synced consent'); // eslint-disable-line
    }
});

module.exports = {
    init: () => {
        wireCookiesEnabler();
        checkAndHandlePlaceholders();
    },

    wireCookiesEnabler: wireCookiesEnabler
};
