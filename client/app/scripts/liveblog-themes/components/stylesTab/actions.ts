import type { IGoogleFontData, IFontOption } from './types';

export enum Actions {
    updateSingleValue,
    resetStylesSettings,
    updateFonts,
}

export interface IStyleAction extends Action<Actions> {
    propertyName: string;
    group: IStyleGroup;
    value: any;
}

export interface IUpdateFonts extends Action<Actions> {
    fonts: IFontOption[];
}

export const fetchWebFonts = async(apiKey: string): Promise<IGoogleFontData> => {
    const url = `https://content-webfonts.googleapis.com/v1/webfonts?key=${apiKey}`;
    const data = await $.getJSON(url);

    return data;
};

export const updateFontOptionsAction = (fontData: IGoogleFontData): IUpdateFonts => {
    const fonts = fontData.items.map((x) => {
        return { value: x.family, label: x.family };
    });

    return {
        type: Actions.updateFonts,
        fonts: fonts,
    };
};
