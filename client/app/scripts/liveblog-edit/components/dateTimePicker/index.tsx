import React from 'react';
import { createStore, Provider } from 'liveblog-common/lb-redux';
import { rootReducer } from './reducer';
import { ConnectedDatePicker } from './datePicker';
import { ConnectedTimePicker } from './timePicker';
import { IStore } from './types'; // eslint-disable-line no-unused-vars
import moment from 'moment';

interface IProps {
    label: string;
}

export const DateTimePicker: React.FunctionComponent<IProps> = () => {
    const initialState: IStore = {
        isDatePickerOpen: false,
        isTimePickerOpen: false,
        datetime: moment(),
    };
    const store = createStore<IStore>(rootReducer, initialState);

    return (
        <Provider value={store}>
            <div className="flex-grid flex-grid--wrap-items flex-grid--small-2">
                <div className="flex-grid__item">
                    <ConnectedDatePicker />
                </div>
                <div className="flex-grid__item">
                    <ConnectedTimePicker />
                </div>
            </div>
        </Provider>
    );
};
