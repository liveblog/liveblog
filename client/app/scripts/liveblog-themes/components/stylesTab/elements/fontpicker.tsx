import React from 'react';
import Select from 'react-select';
import type { IStyleOptionProps, IStylesTabProps, IFontOption } from '../types';
import { genericMapDispatchToProps } from './helpers';
import { connect } from '../utils';
import { selectStyles } from 'liveblog-common/react-select-styles';

interface IProps extends IStyleOptionProps {
    fontOptions: IFontOption[];
}

class FontPickerInternal extends React.Component<IProps> {
    render() {
        const props = this.props;
        const propertyName = props.property as string;
        const rSelectStyles = {
            ...selectStyles,
            dropdownIndicator: (provided) => ({
                ...provided,
                padding: '2px',
            }),

            clearIndicator: (provided) => ({
                ...provided,
                padding: '2px',
            }),

            indicatorsContainer: (provided) => ({
                ...provided,
                padding: '2px',
            }),
        };

        rSelectStyles.control = (provided, state) => {
            const internal = selectStyles.control(provided, state);

            internal.minHeight = '20px';
            return internal;
        };

        return (
            <div className="sd-line-input">
                <label
                    className="sd-line-input__label text-uppercase"
                    htmlFor={propertyName}
                >
                    {props.label}
                </label>

                <div>
                    <Select
                        styles={rSelectStyles}
                        options={props.fontOptions}
                        menuPosition="fixed"
                    />
                </div>

                {props.help && <small>{props.help}</small>}
            </div>
        );
    }
}

const mapStateToProps = (state: IStylesTabProps, ownProps: IProps): IProps => {
    const { settings } = state;

    return {
        ...ownProps,
        value: settings[ownProps.group.name][ownProps.property as string],
        fontOptions: state.fontsOptions,
    };
};

const FontPickerConnected = connect(mapStateToProps, genericMapDispatchToProps)(FontPickerInternal);

export { FontPickerConnected };
