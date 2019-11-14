import moment from 'moment'; // eslint-disable-line

export interface IStore {
    isDatePickerOpen: boolean;
    datetime: moment.Moment;
}
