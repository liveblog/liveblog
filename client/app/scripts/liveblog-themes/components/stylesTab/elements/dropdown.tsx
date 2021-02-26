import React from 'react';
import type { IStyleOptionProps } from '../types';

export const Dropdown: React.FunctionComponent<IStyleOptionProps> = (props) => {
    const propertyName = props.property as string;

    return (
        <div className="sd-line-input">
            <label
                className="sd-line-input__label text-uppercase"
                htmlFor={propertyName}
            >
                {props.label}
            </label>

            <select
                className="sd-line-input__select"
                value={props.value || props.default}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => props.onChange(e.target.value)}
            >
                {props.options?.map(
                    (opt, idx) => <option key={`opt-${idx}`} value={opt.value}>{opt.label}</option>
                )}
            </select>

            {props.help && <small>{props.help}</small>}
        </div>
    );
};
