import React from 'react';
import type { IStyleOptionProps } from '../types';

export class Input extends React.Component<IStyleOptionProps> {
    render() {
        const props = this.props;
        const propertyName = props.property as string;

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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.value)}
                />

                {props.help && <small>{props.help}</small>}
            </div>
        );
    }
}
