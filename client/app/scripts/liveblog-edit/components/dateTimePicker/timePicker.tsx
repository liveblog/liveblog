import React from 'react';
import moment from 'moment'; // eslint-disable-line no-unused-vars
import Creatable from 'react-select/creatable';
import { connect } from 'liveblog-common/lb-redux';
import { IStore } from './types';

interface IProps {
    isOpen: boolean;
    datetime: moment.Moment;
    times: Array<string>;
}

class TimePicker extends React.Component<IProps> {
    render() {
        return (
            <Creatable
                className="react__tags__selector"
                menuPosition="fixed"
            />
        );
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IProps => {
    return {
        ...ownProps,
        isOpen: state.isTimePickerOpen,
        datetime: state.datetime,
    };
};

export const ConnectedTimePicker = connect(mapStateToProps)(TimePicker);
