import React from 'react';
import { createStore, Provider } from 'liveblog-common/lb-redux';
import { rootReducer } from './reducer';
import { ConnectedDatePicker } from './datePicker';
import { IStore } from './types'; // eslint-disable-line
import moment from 'moment';

interface IProps {
    label: string;
}

export const DateTimePicker: React.FunctionComponent<IProps> = (props) => {
    const initialState: IStore = {
        isDatePickerOpen: false,
        datetime: moment(),
    };
    const store = createStore<IStore>(rootReducer, initialState);

    return (
        <Provider value={store}>
            <ConnectedDatePicker />
        </Provider>
    );
};
