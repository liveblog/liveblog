
import { Actions } from './actions';
import type { IStyleAction, IUpdateFonts } from './actions';
import type { IStylesTabProps } from './types';

export const rootReducer = (state: IStylesTabProps, action: IAnyAction) => {
    switch (action.type) {
    case Actions.updateSingleValue: {
        const { group, propertyName } = action as IStyleAction;
        const newState = { ...state };
        const { settings } = newState;

        settings[group.name][propertyName] = action.value;
        newState.settings = settings;

        return newState;
    }
    case Actions.resetStylesSettings: {
        const newState = { ...state };

        $.extend(true, newState.settings, state.defaultSettings);
        return newState;
    }
    case Actions.updateFonts: {
        const { fonts } = action as IUpdateFonts;
        const newState = {
            ...state,
            fontsOptions: fonts,
        };

        return newState;
    }
    default:
        return state;
    }
};
