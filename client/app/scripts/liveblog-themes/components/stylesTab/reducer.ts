
import { Actions, IStyleAction } from './actions'; // eslint-disable-line

export const rootReducer = (state: IStyleSettings, action: IStyleAction) => {
    switch (action.type) {
    case Actions.updateSingleValue: {
        const { group, propertyName } = action;
        const newState = { ...state };

        newState[group.name][propertyName] = action.value;
        return newState;
    }
    default:
        return state;
    }
};
