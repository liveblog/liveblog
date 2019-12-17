import React from 'react';
import Creatable from 'react-select/creatable';
import { connect } from 'liveblog-common/lb-redux';
import { IStore } from './types';

interface IProps {
    isOpen: boolean;
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
    };
};

export const ConnectedTimePicker = connect(mapStateToProps)(TimePicker);
