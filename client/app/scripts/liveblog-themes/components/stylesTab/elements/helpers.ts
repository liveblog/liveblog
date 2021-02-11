import React from 'react';
import type { IStylesTabProps, IStyleOptionProps } from '../types';
import { connect } from '../utils';
import { Actions } from '../actions';

type ComponentType = typeof React.Component | React.FunctionComponent;

const mapStateToProps = (state: IStylesTabProps, ownProps: IStyleOptionProps): IStyleOptionProps => {
    const { settings } = state;

    return {
        ...ownProps,
        value: settings[ownProps.group.name][ownProps.property as string],
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
    Component: ComponentType) => connect(mapStateToProps, mapDispatchToProps)(Component);
