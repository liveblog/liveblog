import React from 'react';
import { IStyleOptionProps } from '../types';
import { connect } from '../utils';
import { Actions } from '../actions';

const mapStateToProps = (state: IStyleSettings, ownProps: IStyleOptionProps): IStyleOptionProps => {
    return {
        ...ownProps,
        value: state[ownProps.group.name][ownProps.property as string],
    };
};

const mapDispatchToProps = (dispatch, ownProps: IStyleOptionProps) => {
    return {
        ...ownProps,
        onChange: (value: any) => {
            dispatch({
                type: Actions.updateSingleValue,
                group: ownProps.group,
                propertyName: ownProps.property as string,
                value: value,
            });
        },
    };
};

export const genericConnect = (
    Component: typeof React.Component) => connect(mapStateToProps, mapDispatchToProps)(Component);
