import * as CSS from "csstype";

interface IGeneralStyles {
    margin: CSS.MarginProperty;
    padding: CSS.PaddingProperty;
    maxWidth: CSS.MaxWidthProperty;
    backgroundColor: CSS.BackgroundColorProperty;
}

interface ITypografy {
    primaryFont: string;
    secondaryFont: string;
}

interface IContentStyles {
    fontFamily: CSS.FontFamilyProperty;
    fontSize: CSS.FontSizeProperty;
    fontWeight: CSS.FontWeightProperty;
    fontStyle: CSS.FontStyleProperty;
    color: CSS.ColorProperty;
}

interface IThemeStyles {
    general: IGeneralStyles;
    typography: ITypografy;

    bodyText: IContentStyles;
    titleText: IContentStyles;
    descriptionText: IContentStyles;
}

type OptionType = "checkbox" | "select" | "text" | "colorpicker";

interface IStyleOptionProps extends IStyleOption {
    value?: any;
    group: IStyleGroup;
    onChange: (value: any) => void;
}

export interface IFontOption {
    value: any;
    label: string;
}

export interface IGoogleFont {
    family: string;
    version: string;
    variant: any;
}

export interface IGoogleFontData {
    kind: string;
    items: IGoogleFont[];
}

export interface IStylesTabProps {
    // used to reset styles to initial theme state
    defaultSettings: IStyleSettings;
    settings: IStyleSettings;
    styleOptions: IStyleGroup[];
    fontsOptions?: IFontOption[];
    googleApiKey?: string;
    onStoreChange: () => void;
}