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
