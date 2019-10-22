
import React, { useContext } from 'react';
import { Context } from './context';
import { Actions } from './actions';

// NOTE: this could be much more generic connect but for now we just
// need to wire onChange function and pass element value
export const connect = (group: IStyleGroup, option: IStyleOption) => {
    return (Component) => {
        const WrappedComponent = () => {
            const { state, dispatch } = useContext(Context);
            const propertyName = option.property as string;
            const stateValue = state[group.name][propertyName];

            const onChange = (value: any) => {
                dispatch({
                    type: Actions.updateSingleValue,
                    group: group,
                    propertyName: propertyName,
                    value: value,
                });
            };

            // const stateToProps = mapStateToProps(state)
            // const dispatchToProps = mapDispatchToProps(dispatch)
            const props = { ...option, value: stateValue, onChange: onChange };

            return (
                <Component {...props} />
            );
        };

        WrappedComponent.displayName = `Connected${Component.displayName}`;

        return WrappedComponent;
    };
};
