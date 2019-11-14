import moment from 'moment';
import * as ActionTypes from './actions';
import { IStore } from './types'; // eslint-disable-line

import Actions = ActionTypes.Actions;

export const rootReducer = (state: IStore, action: any): IStore => {
    switch (action.type) {
    case Actions.ToggleDatePicker: {
        const update = action as ActionTypes.IToggleDatePicker;

        return {
            ...state,
            isDatePickerOpen: update.open,
        };
    }
    case Actions.UpdateDate: {
        const update = action as ActionTypes.IUpdateDate;
        const incoming = moment(update.datetime);
        const newDate = state.datetime.clone();

        newDate.set({
            year: incoming.get('year'),
            month: incoming.get('month'),
            day: incoming.get('day'),
        });

        return {
            ...state,
            datetime: newDate,
        };
    }
    default:
        return state;
    }
};
