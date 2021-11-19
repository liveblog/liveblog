import React from 'react';
import type { IStyleOptionProps } from '../types';

export class ColorPicker extends React.Component<IStyleOptionProps> {
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

                <div className="sd-line-input--flex-row justify-space-between">
                    <div className="sd-line-input__value">{props.value}</div>
                    <input
                        type="color"
                        className="sd-line-input__color"
                        value={props.value}
                        placeholder={props.placeholder}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.value)}
                    />
                </div>

                {props.help && <small>{props.help}</small>}
            </div>
        );
    }
}
