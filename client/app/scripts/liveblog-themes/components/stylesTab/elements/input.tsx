import React from 'react';

interface IProps extends IStyleOption {
    value: any;
    onChange();
}

export const Input: React.SFC<IProps> = (props) => {
    const propertyName = props.property as string;

    return (
        <div className="sd-line-input">
            <label
                className="sd-line-input__label text-uppercase"
                htmlFor={propertyName}
            >{props.label}</label>

            <input
                id={propertyName}
                type="text"
                name={propertyName}
                value={props.value}
                placeholder={props.placeholder}
            />

            {props.help && <small>{props.help}</small>}
        </div>
    );
};
