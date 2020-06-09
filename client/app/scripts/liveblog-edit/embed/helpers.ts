import _ from 'lodash';

interface IProvider {
    url: string;
    name: string;
}

const domainFromUrl = (url: string): string => {
    let result: string;
    let match: RegExpMatchArray;

    // tslint:disable-next-line
    if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {  // eslint-disable-line
        result = match[1];

        // tslint:disable-next-line
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) { // eslint-disable-line
            result = match[1];
        }
    }

    return result;
};

export const guessProvider = (url: string): IProvider => {
    const fullDomain = domainFromUrl(url);
    const domain = fullDomain.split('.')[0];
    const aTag = document.createElement('a');

    aTag.href = url;

    return {
        url: aTag.origin,
        name: _.startCase(domain),
    };
};
