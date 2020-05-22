const domainRequiresConsent = (providerUrl, node) => {
    var domains = LB.settings.gdprConsentDomains;
    var requiresConsent = false;

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

export {domainRequiresConsent};
