export enum Actions { /* eslint-disable */
    ToggleDatePicker,
    UpdateDate,
}

export interface IToggleDatePicker extends IAnyAction {
    open: boolean;
}

export interface IUpdateDate extends IAnyAction {
    datetime: Date;
}

export const toggleDatePicker = (open: boolean): IToggleDatePicker => {
    return { type: Actions.ToggleDatePicker, open: open };
};

export const updateDate = (datetime: Date): IUpdateDate => {
    return { type: Actions.UpdateDate, datetime: datetime };
};
