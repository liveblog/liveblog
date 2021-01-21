import React from 'react';
import { connect } from '../utils';
import { Actions } from '../actions';
import type { IStyleOptionProps } from '../types';

class Input extends React.Component<IStyleOptionProps> {
    render() {
        const props = this.props;
        const propertyName = props.property as string;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            props.onChange(e.target.value);
        };

        return (
            <div className="sd-line-input">
                <label
                    className="sd-line-input__label text-uppercase"
                    htmlFor={propertyName}
                >
                    {props.label}
                </label>

                <input
                    type="text"
                    name={propertyName}
                    value={props.value || ''}
                    placeholder={props.placeholder}
                    onChange={handleChange}
                />

                {props.help && <small>{props.help}</small>}
            </div>
        );
    }
}

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

export const ConnectedInput = connect(mapStateToProps, mapDispatchToProps)(Input);
