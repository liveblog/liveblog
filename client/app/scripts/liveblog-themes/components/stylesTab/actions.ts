
export enum Actions {
    updateSingleValue, // eslint-disable-line
}

export interface IStyleAction extends Action<Actions> {
    propertyName: string;
    group: IStyleGroup;
    value: any;
}
