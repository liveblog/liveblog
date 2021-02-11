
import { Actions } from './actions';
import type { IStyleAction } from './actions';
import type { IStylesTabProps } from './types';

export const rootReducer = (state: IStylesTabProps, action: IStyleAction) => {
    switch (action.type) {
    case Actions.updateSingleValue: {
        const { group, propertyName } = action;
        const newState = { ...state };
        const { settings } = newState;

        settings[group.name][propertyName] = action.value;
        newState.settings = settings;

        return newState;
    }
    case Actions.resetStylesSettings: {
        const newState = { ...state };

        newState.settings = state.defaultSettings;
        return newState;
    }
    default:
        return state;
    }
};
