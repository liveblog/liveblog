
import React, { useContext } from 'react';
import { Context } from './context';

export const connect = (mapStateToProps, mapDispatchToProps) => {
    return (Component) => {
        const WrappedComponent = (ownProps) => {
            const { state, dispatch } = useContext(Context);
            const stateToProps = mapStateToProps ? mapStateToProps(state, ownProps) : ownProps;
            const dispatchToProps = mapDispatchToProps(dispatch, ownProps);

            const props = {
                ...ownProps,
                ...stateToProps,
                ...dispatchToProps,
            };

            return (
                <Component {...props} />
            );
        };

        WrappedComponent.displayName = `Connected${Component.displayName || Component.name}`;

        return WrappedComponent;
    };
};
