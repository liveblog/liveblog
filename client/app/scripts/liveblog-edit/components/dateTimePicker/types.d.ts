import moment from 'moment'; // eslint-disable-line

export interface IStore {
    isDatePickerOpen: boolean;
    isTimePickerOpen: boolean;
    datetime: moment.Moment;
}
