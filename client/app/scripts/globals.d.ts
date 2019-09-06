declare const angular: IAngularStatic;

// fix to avoid the typescript compiler warning
declare module '*.ng1' {
    const value: string;
    export default value;
}

declare const gettext: (text: string) => string;

type Action<T = any> = {
    type: T;
};

interface IAnyAction<T = any> extends Action<T> {
    [prop: string]: any;
}

type Listener = (state: any) => void;

type Reducer<S = any> = (state: S, action: IAnyAction) => S;

interface IAuthor {
    name: string;
    email: string;
    url?: string;
}

interface IFiles {
    scripts: any;
    styles: any;
    templates: {
        [key: string]: string;
    };
}

interface IDict {
    [key: string]: any;
}

interface IThemeSettings extends IDict {
    authorNameFormat: string;
    authorPosition: string;
    autoApplyUpdates: boolean;
    blockSearchEngines: boolean;
    canComment: boolean;
    clientDatetimeOnly: boolean;
    datetimeFormat: string;
    gaCode: string;
    hasHighlights: boolean;
    hidePostOrder: boolean;
    language: string;
    outputChannel: boolean;
    outputChannelName: string;
    outputChannelTheme: string;
    permalinkDelimiter: string;
    postOrder: string;
    postsPerPage: number;
    removeStylesESI: boolean;
    renderForESI: boolean;
    showAuthor: boolean;
    showAuthorAvatar: boolean;
    showDescription: boolean;
    showGallery: boolean;
    showImage: boolean;
    showLiveblogLogo: boolean;
    showPermalinkButton: boolean;
    showRelativeDate: boolean;
    showSharingButtons: boolean;
    showSyndicatedAuthor: boolean;
    showTitle: boolean;
    showUpdateDatetime: boolean;
    stickyPosition: string;
    twitterDNT: boolean;
    youtubePrivateMode: boolean;

    // TODO: figure out how to match these
    // data-privacy-group: null
    // date-group: null
    // authors-group: null
    // edge-server-side-group: null
    // posts-options-group: null
    // show-hide-group: null
    // updates-ordering-group: null
    // visibility-group: null
}

interface IStyleGroupSetting {
    [key: string]: any;
}

interface IStyleSettings {
    [key: string]: IStyleGroupSetting;
}

interface ILinks {
    self: {
        href: string;
        title: string;
    };
}

interface ITheme {
    asyncTheme: boolean;
    author: IAuthor;
    blogs: Array<any>;
    blogs_count: number;
    devScripts: Array<string>;
    devStyles: Array<string>;
    scripts: Array<string>;
    styles: Array<string>;
    files: IFiles;
    i18n: {
        [lang: string]: any
    };
    label: string;
    license: string;
    name: string;
    extends?: string;
    options: Array<any>;
    styleOptions: Array<IStyleGroup>;
    repository: any;
    seoTheme: boolean;
    settings: IThemeSettings;
    styleSettings: IStyleSettings;
    template: string;
    version: string;
    _created: string;
    _etag: string;
    _id: string;
    _links: ILinks;
    _updated: string;
}

interface IStyleOption {
    // text to indicate the name of the setting
    label: string;

    // the css property which the element will serialize to
    property: keyof CSS.Properties;

    // type of element that it will be rendered
    type: OptionType;

    // an example of the expected content
    placeholder?: string;

    // if the type is select, then options is required to show in dropdown
    options?: Array<any>;

    // basic help text
    help?: string;

    // default value for this style
    default?: string | number;

    // Tag to apply the styling under group cssSelector. Eg. div.lb-timeline TagName { }
    tagName?: string;
}

interface IStyleGroup {
    label: string;

    // unique name for this group of settings
    name: string;

    /**
     * The css class or identifier which the style will serialize to
     * e.g: div.lb-timeline
     */
    cssSelector: string;

    options: Array<IStyleOption>;

    // number of layout columns that it will use when rendering in settings tab
    columns: string;
}
