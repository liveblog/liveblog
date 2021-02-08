import _ from 'lodash';

/**
 * Collect a list of options for the given theme and its parents
 * @param {object} theme
 * @param {Array} optsAttr Accumulator object for child theme cases
 * @param {string} optsAttr The attribute of options to be collected
 * @returns {array} Promise with list of options
 */
export const collectOptions = <T = any>(
    api: any, $q: any, theme: ITheme, optionsParam = [], optsAttr: string = 'options'): Promise<T> => {
    // keep the theme's options in `options`
    let options: any = optionsParam;

    // attribute could be `options` or `styleOptions`
    // because they both share more or less the same logic
    const themeOptions = theme[optsAttr];

    if (themeOptions) {
        const alreadyPresent = _.map(options, (o: any) => o.name);

        // keep only options that are not already saved (children options are prioritary)
        options = _.filter(themeOptions, (option) => alreadyPresent.indexOf(option.name) === -1)
            .concat(options);
    }

    // retrieve parent options
    if (theme.extends) {
        return api.themes.getById(theme.extends)
            .then((parentTheme) => collectOptions(api, $q, parentTheme, options, optsAttr));
    }

    // return the options when there is no more parent theme
    return $q.when(options);
};
