import React, { useContext } from 'react';
import { Context } from './context';

// TODO: complete typings for this below
export const connect = (mapStateToProps: any, mapDispatchToProps) => {
    return (Component) => {
        const WrappedComponent = (ownProps) => {
            const { state, dispatch } = useContext(Context);
            let stateToProps = {};
            let dispatchToProps = {};

            if (mapStateToProps) {
                stateToProps = mapStateToProps(state, ownProps);
            }

            if (mapDispatchToProps) {
                dispatchToProps = mapDispatchToProps(dispatch, ownProps);
            }

            const props = { ...ownProps, ...stateToProps, ...dispatchToProps };

            return React.createElement(Component, props);
        };

        WrappedComponent.displayName = `Connected${Component.displayName}`;

        return WrappedComponent;
    };
};
